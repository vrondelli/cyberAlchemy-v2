import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stable, bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {buildCoverageLedger as original} from './ranked-read-ledger-r1.mjs';
import {buildCoverageLedger, renderCoverageLedger} from './recent-evidence-ledger-r1.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
function fixture(specs) {
  const snapshots = [], captures = [], receipts = [];
  const messages = [];
  for (const [index, spec] of specs.entries()) {
    const {path, revision = 'base', utf8 = 'a\nb\nc\n'} = spec;
    const source_sha256 = hash(utf8), id = `read-${index}`;
    snapshots.push({path, utf8, source_sha256});
    const call = {id, type: 'function', function: {name: 'read_file', arguments: stable({path, start_line: 1, line_count: 1, revision})}};
    const pair = [{role: 'assistant', content: '', tool_calls: [call]},
      {role: 'tool', tool_call_id: id, content: stable({ok: true, output: {path, start_line: 1, end_line: 1,
        utf8: utf8.split('\n')[0], source_sha256, source_revision: revision, total_lines: 3, base_commit: 'a'.repeat(40)}})}];
    messages.push(pair);
    const prompt = stable({messages: pair, tools: []});
    const receipt = {kind: 'model', dispatched: true, status: 200, model: 'glm-5.3-flash',
      output_cap: 2048, reasoning_effort: 'low', input_tokens: 100, output_tokens: 10, ...spec.receipt};
    receipt.request_sha256 = hash(stable(bodyForReceipt(prompt, receipt)));
    captures.push({prompt, prompt_sha256: hash(prompt)});
    receipts.push(receipt);
  }
  return {snapshots, captures, receipts, ranked_evidence: new Map()};
}
const paths = ledger => ledger.entries.map(entry => entry.path);

test('recent confirmed source wins over alphabetical order without changing coverage', () => {
  const input = fixture([{path: 'a-old'}, {path: 'z-active'}]);
  const before = original(input), after = buildCoverageLedger(input);
  assert.deepEqual(paths(before), ['a-old', 'z-active']);
  assert.deepEqual(paths(after), ['z-active', 'a-old']);
  assert.deepEqual([...after.entries].reverse(), before.entries);
});
test('replaying an old request does not make its source recent', () => {
  const input = fixture([{path: 'a-old'}, {path: 'z-active'}]);
  input.receipts.push({...input.receipts[0]});
  assert.deepEqual(paths(buildCoverageLedger(input)), ['z-active', 'a-old']);
});
test('a new read observation refreshes its source; source versions remain distinct', () => {
  const input = fixture([{path: 'a'}, {path: 'z'}, {path: 'a'}, {path: 'a', revision: 'current'}]);
  const ledger = buildCoverageLedger(input);
  assert.deepEqual(ledger.entries.map(e => [e.path, e.source_revision]), [['a', 'current'], ['a', 'base'], ['z', 'base']]);
  assert.equal(ledger.entries[1].observation_ids.length, 2);
});
test('failed, unknown-usage, tokenizer-only and undispatched requests cannot gain priority', () => {
  for (const receipt of [{status: 500}, {input_tokens: null}, {kind: 'tokenizer'}, {dispatched: false}]) {
    const input = fixture([{path: 'a'}, {path: 'z', receipt}]);
    assert.deepEqual(paths(buildCoverageLedger(input)), ['a']);
  }
});
test('same-request ties are deterministic and do not depend on source snapshot order', () => {
  const input = fixture([{path: 'z'}, {path: 'a'}]);
  const messages = input.captures.flatMap(c => JSON.parse(c.prompt).messages);
  const prompt = stable({messages, tools: []}), receipt = {...input.receipts[0]};
  receipt.request_sha256 = hash(stable(bodyForReceipt(prompt, receipt)));
  input.captures = [{prompt, prompt_sha256: hash(prompt)}]; input.receipts = [receipt];
  const first = buildCoverageLedger(input);
  assert.deepEqual(paths(first), ['a', 'z']);
  input.snapshots.reverse(); assert.deepEqual(buildCoverageLedger(input), first);
});
test('source digest and visible-byte verification remain mandatory', () => {
  const input = fixture([{path: 'a'}]); input.snapshots[0].utf8 = 'tampered';
  assert.throws(() => buildCoverageLedger(input), /source-digest/);
});
test('bounded renderer exposes recent entry, hides private IDs, and retains omission accounting', async () => {
  const ledger = buildCoverageLedger(fixture([{path: 'a'}, {path: 'z'}]));
  const result = await renderCoverageLedger({ledger, measure_tokens: async s => s.length, maximum_tokens: 10000, maximum_entries: 1});
  const rendered = JSON.parse(result.text);
  assert.deepEqual(rendered.entries.map(e => e.path), ['z']);
  assert.equal(rendered.omitted_entries, 1);
  assert.equal(result.tokens, result.text.length);
  assert.ok(!Object.hasOwn(rendered.entries[0], 'observation_ids'));
  assert.ok(!result.text.includes('first_confirmed_receipt'));
});
test('oversized leading entry is omitted whole, and framing/measurement errors fail closed', async () => {
  const ledger = buildCoverageLedger(fixture([{path: 'a'}, {path: 'z'.repeat(1000)}]));
  const empty = await renderCoverageLedger({ledger, measure_tokens: async s => s.length, maximum_tokens: 10000, maximum_entries: 0});
  const result = await renderCoverageLedger({ledger, measure_tokens: async s => s.length, maximum_tokens: empty.tokens + 1});
  assert.equal(result.included_entries, 0); assert.equal(result.omitted_entries, 2);
  assert.ok(result.tokens <= empty.tokens + 1);
  await assert.rejects(renderCoverageLedger({ledger, measure_tokens: async s => s.length, maximum_tokens: 1}), /framing-over-budget/);
  await assert.rejects(renderCoverageLedger({ledger, measure_tokens: async () => NaN}), /measurement/);
});
