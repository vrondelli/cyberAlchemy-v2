import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {deferReadOnlyOutputs} from './output-deferral.mjs';
import {attachObservationHandles,bindDelivery,bodyForReceipt,stable} from './delivery.mjs';
const hash = x => createHash('sha256').update(x).digest('hex');
function fixture() {
  const calls = ['read_file', 'apply_edits', 'search', 'list_files'].map((name, i) => ({id: 'c' + i, type: 'function', function: {name, arguments: stable({path: 'a.txt', start_line: 1, line_count: 1})}}));
  const read = attachObservationHandles(calls[0], {ok: true, output: {path: 'a.txt', start_line: 1, end_line: 1, utf8: 'source '.repeat(3000), source_sha256: hash('source '.repeat(3000))}});
  return [{role: 'assistant', tool_calls: calls},
    {role: 'tool', tool_call_id: 'c0', content: stable(read)},
    {role: 'tool', tool_call_id: 'c1', content: stable({ok: true, output: {changed_paths: ['a.txt'], receipt: 'x'.repeat(1000)}})},
    {role: 'tool', tool_call_id: 'c2', content: stable({ok: false, error: 'validator '.repeat(100)})},
    {role: 'tool', tool_call_id: 'c3', content: stable({ok: true, output: {paths: ['a.txt']}})}];
}
test('large read-only payload becomes bounded truthful metadata without changing original bytes', () => {
  const pending = fixture(), before = stable(pending), r = deferReadOnlyOutputs(pending);
  assert.equal(stable(pending), before); assert.equal(r.deferrals.length, 1);
  const notice = JSON.parse(r.exchange[1].content);
  assert.equal(notice.ok, false); assert.equal(notice.execution_succeeded, true);
  assert.equal(notice.payload_delivered, false); assert.equal(notice.result_digest, hash(pending[1].content));
  assert.ok(Buffer.byteLength(r.exchange[1].content) <= 640);
  assert.equal(notice.read_id, undefined); assert.equal(notice.retrieval_handle, undefined);
});
test('mutations, failed validation, and small successful results stay exact', () => {
  const pending = fixture(), r = deferReadOnlyOutputs(pending);
  for (const i of [0, 2, 3, 4]) assert.equal(r.exchange[i], pending[i]);
});
test('successful delivery of a notice does not credit the withheld source', () => {
  const pending = fixture(), {exchange} = deferReadOnlyOutputs(pending);
  const prompt = stable({messages: exchange, tools: []});
  const receipt = {kind: 'model', model: 'glm-5.3-flash', output_cap: 2048, reasoning_effort: 'low', dispatched: true, status: 200, input_tokens: 100, output_tokens: 10};
  receipt.request_sha256 = hash(stable(bodyForReceipt(prompt, receipt)));
  const b = bindDelivery({captures: [{prompt, prompt_sha256: hash(prompt)}], receipts: [receipt]});
  assert.equal(b.read_observations.length, 0); assert.equal(b.unmapped.length, 0);
  assert.equal(b.token_accounting.known_total_tokens, 110);
});
test('unparseable results and unknown tools are not reinterpreted', () => {
  const pending = fixture(); pending[1] = {...pending[1], content: 'not json '.repeat(200)};
  pending[0].tool_calls[0].function.name = 'unknown_effect';
  assert.equal(deferReadOnlyOutputs(pending).exchange[1], pending[1]);
});
