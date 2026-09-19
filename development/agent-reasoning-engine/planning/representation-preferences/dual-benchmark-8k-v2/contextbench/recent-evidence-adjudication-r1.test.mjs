import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adjudicateRecentEvidence, verifyLedgerCensus} from './recent-evidence-adjudication-r1.mjs';
const contract = JSON.parse(readFileSync(new URL('./RECENT-EVIDENCE-LEDGER-MEASUREMENTS-R1.json', import.meta.url)));
function census() {
  return {schema: 'are.recent-evidence-ledger-census/v1',
    read_rows: [{call_id: 'read', receipt_index: 0, outcome: 'accepted', fully_repeated: false, returned_lines: 1, repeated_lines: 0}],
    request_rows: [{request_index: 0, receipt_index: 1, latest_returned_path: 'source', eligible: true, latest_path_absent: false}],
    requested_direct_read_calls: 1, successful_direct_read_calls: 1, rejected_direct_read_calls: 0, unresolved_direct_read_calls: 0,
    fully_repeated_direct_read_calls: 0, returned_direct_read_lines: 1, previously_returned_direct_read_lines: 0,
    ledger_requests_after_successful_direct_read: 1, latest_returned_path_absent_from_ledger_requests: 0,
    known_model_tokens: 80000, unknown_usage_receipts: 0, missing_model_responses: 0, failed_model_responses: 0,
    unbound_request_captures: 0, counters_reconstructed: true, mechanism_evaluable: true,
    direct_read_repetition_rate: 0, ledger_omission_rate: 0};
}
function rows() {
  return Array.from({length: 4}, (_, i) => ({task_id: 'contextbench-' + (i + 1), status: 'scored', valid: true,
    native_reconstructed: true, accounting_complete: true, window_verified: true, counters_reconstructed: true,
    post_score_integrity_verified: true, total_model_tokens: 80000, known_model_tokens: 80000, conservative_model_tokens: 80000,
    exported_union_span_recall: .8, native_span_f1: .6, ledger_census: census()}));
}
test('eligible support requires quality, Q and both mechanism thresholds; no goal override', () => {
  const result = adjudicateRecentEvidence(rows());
  assert.equal(result.eligible, true); assert.equal(result.disposition, 'supporting');
  assert.equal(result.campaign_goal_achieved, false); assert.equal(result.accepted_token_savings, null);
  assert.equal(result.pooled_mechanism_counts.successful_direct_read_calls, 4);
  assert.equal(result.mean_native_span_f1, .6); assert.equal(result.mean_coverage_per_10000_tokens, .1);
});
test('quality regression or unchanged Q is counterevidence, even with perfect mechanism counts', () => {
  for (const mutate of [r => r.native_span_f1 = .1,
    r => r.exported_union_span_recall = contract.support.mean_Q_greater_than * 8]) {
    const input = rows(); input.forEach(mutate);
    assert.equal(adjudicateRecentEvidence(input).disposition, 'counterevidence');
  }
});
test('one invalid, missing, unknown-cost, unverified or zero-denominator task keeps fixed denominator inconclusive', () => {
  for (const mutate of [r => r.valid = false, r => r.accounting_complete = false,
    r => r.window_verified = false, r => r.post_score_integrity_verified = false, r => r.unknown_usage = true,
    r => r.conservative_model_tokens++, r => r.total_model_tokens = 0,
    r => r.ledger_census.unknown_usage_receipts++, r => r.ledger_census.successful_direct_read_calls = 0]) {
    const input = rows(); mutate(input[0]); const result = adjudicateRecentEvidence(input);
    assert.equal(result.disposition, 'inconclusive'); assert.equal(result.rows.length, 4);
    assert.equal(result.mean_native_span_f1, null); assert.equal(result.direct_read_repetition_rate, null);
  }
  const missing = adjudicateRecentEvidence(rows().slice(1)); assert.equal(missing.disposition, 'inconclusive'); assert.equal(missing.rows.length, 4);
});
test('duplicate and unassigned tasks are rejected', () => {
  const duplicate = rows(); duplicate[1].task_id = duplicate[0].task_id; assert.throws(() => adjudicateRecentEvidence(duplicate), /task-identity/);
  const unknown = rows(); unknown[0].task_id = 'replacement'; assert.throws(() => adjudicateRecentEvidence(unknown), /task-identity/);
});
test('all census count, rate and row contradictions fail verification', () => {
  assert.equal(verifyLedgerCensus(census(), 80000), true);
  for (const mutate of [c => c.fully_repeated_direct_read_calls++, c => c.ledger_omission_rate = .5,
    c => c.read_rows[0].fully_repeated = true, c => c.read_rows[0].returned_lines = 0,
    c => c.request_rows[0].eligible = false, c => c.request_rows[0].receipt_index = null,
    c => c.known_model_tokens--, c => c.counters_reconstructed = false]) {
    const value = census(); mutate(value); assert.equal(verifyLedgerCensus(value, 80000), false);
  }
});
test('eligible repetition or omission regression is counterevidence', () => {
  for (const mechanism of ['repeat', 'omit']) {
    const input = rows();
    for (const row of input) {
      const c = row.ledger_census;
      if (mechanism === 'repeat') {
        c.read_rows[0].fully_repeated = true; c.read_rows[0].repeated_lines = 1;
        c.previously_returned_direct_read_lines = 1; c.fully_repeated_direct_read_calls = 1; c.direct_read_repetition_rate = 1;
      } else {
        c.request_rows[0].latest_path_absent = true; c.latest_returned_path_absent_from_ledger_requests = 1; c.ledger_omission_rate = 1;
      }
    }
    assert.equal(adjudicateRecentEvidence(input).disposition, 'counterevidence');
  }
});
