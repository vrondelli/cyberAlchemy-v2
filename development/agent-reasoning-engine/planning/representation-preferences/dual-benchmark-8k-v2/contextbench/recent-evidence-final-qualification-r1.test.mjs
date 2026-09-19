import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {qualifyRecentEvidenceFinalRequest} from './recent-evidence-final-qualification-r1.mjs';
import {createGlmClient} from './packet-diversity-v1/transport-admission-v5.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {fixture as rankedFixture} from './ranked-read-test-fixture-r1.mjs';
import {createRankedReadEvidenceRecord} from './ranked-read-evidence-r1.mjs';

const measured = async text => Math.ceil(Buffer.byteLength(text) / 4);

async function donorFixture() {
  const fixture = await rankedFixture();
  const evidence = fixture.ranked_evidence.get(fixture.call.id);
  const repoRoot = mkdtempSync(join(tmpdir(), 'recent-final-evidence-'));
  writeFileSync(join(repoRoot, 'source.txt'), evidence.sources.get('source.txt'));
  return {
    repoRoot,
    branch_inputs: {branches: [{branch_id: 'q1', receipt_indices: [0], captures: fixture.captures,
      ranked_evidence_records: [createRankedReadEvidenceRecord(evidence)]}], receipts: fixture.receipts,
      ranked_context: evidence},
    snapshots: [{path: 'source.txt', source_sha256: evidence.expected.files.get('source.txt'),
      utf8: evidence.sources.get('source.txt')}],
    clean() { rmSync(repoRoot, {recursive: true, force: true}); },
  };
}

for (const [tokens, arm, succeeds] of [[5438, 'recent-evidence-ledger', true],
  [5439, 'recent-evidence-ledger', false], [5438, 'schema-agreement', false]]) {
  test(`qualifies exact H-L final envelope tokens=${tokens} arm=${arm}`, async () => {
    const donor = await donorFixture();
    const storageRoot = mkdtempSync(join(tmpdir(), 'recent-final-store-'));
    let tokenizerCalls = 0;
    const server = http.createServer(async (request, response) => {
      let body = '';
      for await (const chunk of request) body += chunk;
      if (request.url === '/tokenizer') {
        tokenizerCalls++;
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({usage: {prompt_tokens: tokens}}));
      } else {
        response.statusCode = 500;
        response.end('{}');
      }
    });
    try {
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      const endpoint = `http://127.0.0.1:${server.address().port}`;
      const guard = createStageOutputGuard({root: storageRoot});
      const persistence = createStagePersistence({stage_root: storageRoot, stage_guard: guard});
      const signal = new AbortController().signal;
      const client = createGlmClient({chat_endpoint: endpoint + '/chat/completions',
        tokenizer_endpoint: endpoint + '/tokenizer', maximum_requests: 96,
        maximum_output_tokens: 2048, maximum_model_retries: 0,
        maximum_tokenizer_transport_attempts: 1, request_budget: 'contextbench-budget-v1',
        maximum_request_bytes: 262144, token_margin: 512, reasoning_effort: 'low',
        model_timeout_ms: 30000, signal, persistence, before_dispatch: async () => true});
      const task = {instance_id: 'fixture', problem_statement: 'Investigate fixture'};
      const cell = {instance_id: 'fixture', cell_id: 'fixture-final', comparison_arm: arm,
        context_limit: 8000, limits: {output_cap: 2048, total_tokens: 96000, maximum_calls: 96},
        provider_profile: {token_margin: 512, reasoning_effort: 'low'}};
      const args = {...donor, task, cell, out: storageRoot, persistence, signal,
        create_client: async () => ({...client, index_receipts: []}),
        measure_index_tokens: measured, before_measure: async () => true};
      if (succeeds) {
        const report = await qualifyRecentEvidenceFinalRequest(args);
        assert.equal(report.qualified, true);
        assert.equal(report.projected_tokens, 7998);
        assert.equal(report.model_calls, 0);
        assert.equal(report.schema, 'are.recent-evidence-final-qualification/v1');
      } else {
        await assert.rejects(qualifyRecentEvidenceFinalRequest(args),
          arm === 'recent-evidence-ledger' ? /fresh-context-too-large/ : /fixed-cell/);
      }
      assert.equal(client.receipts.filter(receipt => receipt.kind === 'model').length, 0);
      assert.equal(tokenizerCalls, arm === 'recent-evidence-ledger' ? 1 : 0);
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
      donor.clean();
      rmSync(storageRoot, {recursive: true, force: true});
    }
  });
}
