import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stable, bodyForReceipt, attachObservationHandles} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {censusRecentEvidence} from './recent-evidence-census-r1.mjs';
const hash = value => createHash('sha256').update(typeof value === 'string' ? value : stable(value)).digest('hex');
const PREFIX = 'Evidence coverage ledger (not relevance or gold coverage): ';
function fixture({changed = false, rejected = false} = {}) {
  const snapshots = [], receipts = [], events = [];
  for (let i = 0; i < 3; i++) {
    const utf8 = changed && i === 1 ? 'x\nb\nc\n' : 'a\nb\nc\n';
    const source_sha256 = hash(utf8);
    snapshots.push({path: 'source', source_sha256, utf8});
    const messages = [{role: 'system', content: PREFIX + stable({claim: 'fixture', entries: i === 2 ? [{path: 'source'}] : [], omitted_entries: 0})}];
    const prompt = stable({messages, tools: []});
    const receipt = {kind: 'model', dispatched: true, status: 200, model: 'glm-5.3-flash',
      output_cap: 2048, reasoning_effort: 'low', input_tokens: 100, output_tokens: 10};
    receipt.request_sha256 = hash(bodyForReceipt(prompt, receipt)); receipts.push(receipt);
    events.push({kind: 'request-capture', phase: 'discover', capture: {prompt, prompt_sha256: hash(prompt)}});
    const args = {path: 'source', start_line: 1, line_count: 2, revision: 'base'};
    const call = {id: 'call-' + i, type: 'function', function: {name: i === 2 ? 'finish_issue_attempt' : 'read_file', arguments: stable(i === 2 ? {} : args)}};
    const body = {receipt_index: i, receipt_sha256: hash(receipt), request_sha256: receipt.request_sha256,
      public_response: {message: {role: 'assistant', tool_calls: [call]}, finish_reason: 'tool_calls'}};
    events.push({kind: 'response-capture', phase: 'discover', response_capture: {...body, capture_sha256: hash(body)}});
    if (i < 2) {
      const output = rejected && i === 1 ? {ok: false, issues: []} : attachObservationHandles(call, {ok: true, output: {
        path: 'source', source_sha256, source_revision: 'base', base_commit: 'a'.repeat(40), start_line: 1,
        end_line: 2, total_lines: 3, utf8: utf8.split('\n').slice(0, 2).join('\n'), byte_count: 3}});
      events.push({kind: 'source-tool-result', call, output});
    }
  }
  return {events, receipts, snapshots};
}
test('receipt-bound counts preserve raw overlap and captured ledger denominator', () => {
  const result = censusRecentEvidence(fixture());
  assert.equal(result.counters_reconstructed, true); assert.equal(result.mechanism_evaluable, true);
  assert.equal(result.known_model_tokens, 330);
  assert.equal(result.successful_direct_read_calls, 2); assert.equal(result.fully_repeated_direct_read_calls, 1);
  assert.equal(result.returned_direct_read_lines, 4); assert.equal(result.previously_returned_direct_read_lines, 2);
  assert.equal(result.ledger_requests_after_successful_direct_read, 2);
  assert.equal(result.latest_returned_path_absent_from_ledger_requests, 1);
  assert.equal(result.direct_read_repetition_rate, .5); assert.equal(result.ledger_omission_rate, .5);
});
test('different source versions are not repeated and rejected reads do not enter success denominator', () => {
  assert.equal(censusRecentEvidence(fixture({changed: true})).fully_repeated_direct_read_calls, 0);
  const result = censusRecentEvidence(fixture({rejected: true}));
  assert.equal(result.successful_direct_read_calls, 1); assert.equal(result.rejected_direct_read_calls, 1);
  assert.equal(result.fully_repeated_direct_read_calls, 0);
});
test('unknown components preserve known spend, missing response disables both rates', () => {
  for (const [input_tokens, output_tokens, known] of [[123, null, 123], [null, 47, 47]]) {
    const result = censusRecentEvidence({events: [], snapshots: [], receipts: [{kind: 'model', dispatched: true, input_tokens, output_tokens}]});
    assert.equal(result.known_model_tokens, known); assert.equal(result.unknown_usage_receipts, 1);
    assert.equal(result.missing_model_responses, 1); assert.equal(result.counters_reconstructed, false);
    assert.equal(result.direct_read_repetition_rate, null); assert.equal(result.ledger_omission_rate, null);
  }
});
test('unexecuted read and trailing unconfirmed request cannot become complete evidence', () => {
  const a = fixture(); a.events = a.events.filter(e => !(e.kind === 'source-tool-result' && e.call.id === 'call-1'));
  const ar = censusRecentEvidence(a); assert.equal(ar.unresolved_direct_read_calls, 1); assert.equal(ar.mechanism_evaluable, false);
  const b = fixture(); b.events.push(structuredClone(b.events[0]));
  const br = censusRecentEvidence(b); assert.equal(br.unbound_request_captures, 1); assert.equal(br.ledger_omission_rate, null);
});
test('zero usage does not masquerade as zero repetition or omission', () => {
  const result = censusRecentEvidence({events: [], receipts: [], snapshots: []});
  assert.equal(result.counters_reconstructed, true); assert.equal(result.mechanism_evaluable, false);
  assert.equal(result.direct_read_repetition_rate, null); assert.equal(result.ledger_omission_rate, null);
});
test('tampered receipts, prompts, output identity, source bytes and duplicate outputs fail closed', () => {
  for (const mutate of [
    x => x.receipts[0].input_tokens++,
    x => x.events[0].capture.prompt += ' ',
    x => x.events[2].call.id = 'orphan',
    x => x.events[2].output.output.utf8 = 'xx',
    x => x.snapshots[0].utf8 = 'bad',
    x => x.events.splice(3, 0, structuredClone(x.events[2])),
    x => x.events.splice(2, 0, structuredClone(x.events[1])),
  ]) {const input = fixture(); mutate(input); assert.throws(() => censusRecentEvidence(input));}
});
