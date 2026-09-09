import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildJudgePacket,
  prepare,
  reduceCards,
  renderFindings,
  runManifest,
  validateCard,
  validateDecision,
  validateManifest,
} from '../scripts/micro-swarm.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'fixtures/example-manifest.json')));
const cards = JSON.parse(await readFile(path.join(root, 'fixtures/cards/control-cards.json')));
const decision = JSON.parse(await readFile(path.join(root, 'fixtures/judge-decision.json')));

test('manifest creates one small prompt envelope per atomic task', () => {
  validateManifest(manifest);
  const envelopes = prepare(manifest);
  assert.equal(envelopes.length, manifest.tasks.length);
  assert.equal(new Set(envelopes.map((item) => item.prompt_sha256)).size, manifest.tasks.length);
  assert.ok(envelopes.every((item) => !JSON.stringify(item).includes('accepted nine-agent findings')));
});

test('cards retain their task and source boundaries', () => {
  for (const card of cards) {
    const task = manifest.tasks.find((item) => item.task_id === card.task_id);
    assert.equal(validateCard(card, task), card);
  }
  const escaped = structuredClone(cards[0]);
  escaped.evidence[0].source_ref = '/unapproved/source';
  assert.throws(() => validateCard(escaped, manifest.tasks[0]), /outside its allowed source/);
});

test('reduction preserves complete coverage and every claim variant', () => {
  const reduced = reduceCards(manifest, [cards]);
  assert.equal(reduced.coverage.complete, true);
  assert.equal(reduced.coverage.received, manifest.tasks.length);
  assert.equal(reduced.claims.length, manifest.tasks.length);
  assert.deepEqual(reduced.coverage.received_task_ids,
    manifest.tasks.map((task) => task.task_id).sort());
});

test('reduction fails closed when a mandatory exploration disappears', () => {
  assert.throws(() => reduceCards(manifest, [cards.slice(1)]),
    /missing mandatory task cards: MAP-001/);
});

test('judge packet is claim-bounded and judge cannot invent a claim', () => {
  const reduced = reduceCards(manifest, [cards]);
  const packet = buildJudgePacket(reduced);
  assert.equal(packet.judge_contract.introduce_new_claims, false);
  validateDecision(reduced, decision);
  const invented = structuredClone(decision);
  invented.decisions[0].claim_id = 'C-INVENTED';
  assert.throws(() => validateDecision(reduced, invented), /invented claim/);
});

test('deterministic rendering reports deadline and non-authority boundary', () => {
  const reduced = reduceCards(manifest, [cards]);
  const result = renderFindings(reduced, decision);
  assert.equal(result.deadlinePass, true);
  assert.match(result.markdown, /Result: \*\*PASS\*\*/);
  assert.match(result.markdown, /makes no quality-parity/);
});

test('deadline fails when receipted exploration exceeds 300 seconds', () => {
  const reduced = reduceCards(manifest, [cards], {wall_elapsed_ms: 300001});
  const result = renderFindings(reduced, decision);
  assert.equal(result.deadlinePass, false);
  assert.match(result.markdown, /Result: \*\*FAIL\*\*/);
});

test('OpenAI-compatible runner writes bounded cards and a wall-time receipt', async () => {
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    const payload = JSON.parse(body);
    const task = JSON.parse(payload.messages[1].content);
    const card = {
      schema_version: 'cav2.micro-swarm-claim-card.v1',
      task_id: task.task_id,
      strategy_result_id: task.strategy_result_id,
      claim_id: task.claim_id,
      statement: `Control response for ${task.task_id}`,
      evidence: [task.allowed_sources[0]],
      proof_status: 'unverified',
      disposition: 'defer',
      confidence: 0.5,
      conflicts: [],
      non_claims: ['Mock response is transport evidence only.'],
      elapsed_ms: 0,
    };
    response.writeHead(200, {'content-type': 'application/json'});
    response.end(JSON.stringify({choices: [{message: {content: JSON.stringify(card)}}]}));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const cardsDir = await mkdtemp(path.join(tmpdir(), 'micro-swarm-test-'));
  try {
    const receipt = await runManifest(manifest, {
      cards: cardsDir,
      'base-url': `http://127.0.0.1:${address.port}`,
      model: 'mock-model',
      concurrency: '3',
    });
    assert.equal(receipt.completed_by_deadline, true);
    assert.equal(receipt.task_count, manifest.tasks.length);
    const files = await readdir(cardsDir);
    assert.equal(files.filter((name) => /^MAP-.*\.json$/.test(name)).length,
      manifest.tasks.length);
    assert.ok(files.includes('_run-receipt.json'));
  } finally {
    await new Promise((resolve, reject) => server.close((error) =>
      error ? reject(error) : resolve()));
    await rm(cardsDir, {recursive: true, force: true});
  }
});
