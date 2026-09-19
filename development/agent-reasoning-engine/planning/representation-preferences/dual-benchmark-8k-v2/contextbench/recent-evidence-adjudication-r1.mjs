// Registered H-L decision; never overrides perfect-quality gates.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyRecentEvidenceSchedule} from './recent-evidence-schedule-r1.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const uint = n => Number.isSafeInteger(n) && n >= 0;
const fraction = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;
const sum = values => {const total = values.reduce((a, b) => a + b, 0); assert.ok(uint(total)); return total;};

export function verifyLedgerCensus(census, totalTokens) {
  try {
    assert.equal(census.schema, 'are.recent-evidence-ledger-census/v1');
    assert.equal(census.known_model_tokens, totalTokens);
    assert.ok(Array.isArray(census.read_rows) && Array.isArray(census.request_rows));
    assert.equal(new Set(census.read_rows.map(r => r.call_id)).size, census.read_rows.length);
    for (const row of census.read_rows) {
      assert.ok(typeof row.call_id === 'string' && row.call_id.length && uint(row.receipt_index));
      assert.ok(['accepted', 'rejected', 'unresolved'].includes(row.outcome));
      assert.ok(uint(row.returned_lines) && uint(row.repeated_lines) && row.repeated_lines <= row.returned_lines);
      if (row.outcome === 'accepted') {
        assert.ok(row.returned_lines > 0); assert.equal(row.fully_repeated, row.returned_lines === row.repeated_lines);
      } else {
        assert.equal(row.fully_repeated, null); assert.equal(row.returned_lines, 0); assert.equal(row.repeated_lines, 0);
      }
    }
    assert.equal(new Set(census.request_rows.map(r => r.receipt_index)).size, census.request_rows.length);
    for (const [i, row] of census.request_rows.entries()) {
      assert.equal(row.request_index, i); assert.ok(uint(row.receipt_index));
      assert.ok(row.latest_returned_path === null || (typeof row.latest_returned_path === 'string' && row.latest_returned_path.length));
      assert.equal(row.eligible, row.latest_returned_path !== null);
      assert.equal(typeof row.latest_path_absent, 'boolean');
      if (!row.eligible) assert.equal(row.latest_path_absent, false);
    }
    const accepted = census.read_rows.filter(r => r.outcome === 'accepted').length;
    const rejected = census.read_rows.filter(r => r.outcome === 'rejected').length;
    const unresolved = census.read_rows.filter(r => r.outcome === 'unresolved').length;
    const repeated = census.read_rows.filter(r => r.fully_repeated === true).length;
    const eligible = census.request_rows.filter(r => r.eligible).length;
    const omitted = census.request_rows.filter(r => r.eligible && r.latest_path_absent).length;
    const expected = {requested_direct_read_calls: census.read_rows.length, successful_direct_read_calls: accepted,
      rejected_direct_read_calls: rejected, unresolved_direct_read_calls: unresolved,
      fully_repeated_direct_read_calls: repeated,
      returned_direct_read_lines: sum(census.read_rows.map(r => r.returned_lines)),
      previously_returned_direct_read_lines: sum(census.read_rows.map(r => r.repeated_lines)),
      ledger_requests_after_successful_direct_read: eligible, latest_returned_path_absent_from_ledger_requests: omitted};
    for (const [key, value] of Object.entries(expected)) assert.equal(census[key], value, key);
    const diagnostics = ['unknown_usage_receipts', 'missing_model_responses', 'failed_model_responses', 'unbound_request_captures'];
    for (const key of diagnostics) assert.ok(uint(census[key]));
    const complete = diagnostics.every(key => census[key] === 0) && unresolved === 0;
    assert.equal(census.counters_reconstructed, complete);
    assert.equal(census.mechanism_evaluable, complete && accepted > 0 && eligible > 0);
    assert.equal(census.direct_read_repetition_rate, complete && accepted > 0 ? repeated / accepted : null);
    assert.equal(census.ledger_omission_rate, complete && eligible > 0 ? omitted / eligible : null);
    return true;
  } catch { return false; }
}

export function adjudicateRecentEvidence(rows) {
  const bytes = readFileSync(new URL('./RECENT-EVIDENCE-LEDGER-MEASUREMENTS-R1.json', import.meta.url));
  const contract = JSON.parse(bytes);
  for (const binding of contract.source_bindings) assert.equal(hash(readFileSync(binding.path)), binding.sha256, 'recent-adjudication.contract-drift');
  const schedule = JSON.parse(readFileSync(new URL('./RECENT-EVIDENCE-LEDGER-SCHEDULE-R1.json', import.meta.url)));
  verifyRecentEvidenceSchedule({schedule, config_path: schedule.config_path, cohort_path: schedule.cohort_path, cohort_sha256: schedule.cohort_sha256});
  const tasks = schedule.slots.map(slot => slot.task_id), seen = new Set();
  assert.ok(Array.isArray(rows));
  for (const row of rows) {assert.ok(row && tasks.includes(row.task_id) && !seen.has(row.task_id), 'recent-adjudication.task-identity'); seen.add(row.task_id);}
  const mapped = tasks.map(task_id => {
    const row = rows.find(r => r.task_id === task_id) ?? {task_id, status: 'missing'};
    const reasons = [];
    for (const flag of ['valid', 'native_reconstructed', 'accounting_complete', 'window_verified', 'counters_reconstructed', 'post_score_integrity_verified']) {
      if (row[flag] !== true) reasons.push(flag);
    }
    if (!uint(row.total_model_tokens) || row.total_model_tokens === 0 || row.total_model_tokens > 96000) reasons.push('bounded-complete-cost');
    for (const key of ['known_model_tokens', 'conservative_model_tokens']) {
      if (!uint(row[key]) || row[key] !== row.total_model_tokens) reasons.push('inconsistent-' + key);
    }
    for (const key of ['unknown_usage', 'unknown_model_calls', 'unknown_usage_dispatched_requests', 'unknown_calls', 'unresolved_reserved_attempts']) {
      if (Object.hasOwn(row, key) && row[key] !== (key === 'unknown_usage' ? false : 0)) reasons.push('unresolved-' + key);
    }
    if (!fraction(row.exported_union_span_recall) || !fraction(row.native_span_f1)) reasons.push('native-metrics');
    const censusValid = verifyLedgerCensus(row.ledger_census, row.total_model_tokens);
    if (!censusValid) reasons.push('ledger-census-invalid');
    if (!censusValid || row.ledger_census.mechanism_evaluable !== true) reasons.push('mechanism-ineligible');
    const eligible = reasons.length === 0;
    return {task_id, status: row.status ?? null, eligible, reasons,
      total_model_tokens: row.total_model_tokens ?? null, known_model_tokens: row.known_model_tokens ?? null,
      conservative_model_tokens: row.conservative_model_tokens ?? null,
      native_span_f1: row.native_span_f1 ?? null, exported_union_span_recall: row.exported_union_span_recall ?? null,
      ledger_census: row.ledger_census ?? null, counters: row.counters ?? null,
      coverage_per_10000_tokens: eligible ? 10000 * row.exported_union_span_recall / row.total_model_tokens : null};
  });
  const eligible = mapped.every(row => row.eligible);
  const meanQ = eligible ? mapped.reduce((n, r) => n + r.coverage_per_10000_tokens, 0) / tasks.length : null;
  const meanF1 = eligible ? mapped.reduce((n, r) => n + r.native_span_f1, 0) / tasks.length : null;
  const pooled = eligible ? Object.fromEntries(['successful_direct_read_calls', 'fully_repeated_direct_read_calls',
    'ledger_requests_after_successful_direct_read', 'latest_returned_path_absent_from_ledger_requests']
    .map(key => [key, sum(mapped.map(row => row.ledger_census[key]))])) : null;
  const repetition = pooled ? pooled.fully_repeated_direct_read_calls / pooled.successful_direct_read_calls : null;
  const omission = pooled ? pooled.latest_returned_path_absent_from_ledger_requests / pooled.ledger_requests_after_successful_direct_read : null;
  const support = contract.support, tolerance = support.tolerance;
  const gates = eligible ? {
    native_quality: meanF1 >= support.mean_span_f1_at_least - tolerance,
    coverage_efficiency: meanQ > support.mean_Q_greater_than + tolerance,
    direct_read_repetition: repetition < support.direct_read_repetition_rate_less_than - tolerance,
    ledger_omission: omission < support.ledger_omission_rate_less_than - tolerance,
  } : null;
  const supported = gates && Object.values(gates).every(Boolean);
  return {schema: 'are.recent-evidence-ledger-adjudication/v1', measurement_contract_sha256: hash(bytes),
    rows: mapped, eligible, disposition: !eligible ? 'inconclusive' : supported ? 'supporting' : 'counterevidence',
    reason: !eligible ? 'incomplete-fixed-cohort-or-mechanism' : supported ? 'descriptive-ledger-support' : 'registered-ledger-thresholds-failed',
    mean_native_span_f1: meanF1, mean_coverage_per_10000_tokens: meanQ,
    mean_native_span_f1_delta: eligible ? meanF1 - contract.baseline.mean_native_span_f1 : null,
    mean_coverage_per_10000_tokens_delta: eligible ? meanQ - contract.baseline.mean_coverage_per_10000_tokens : null,
    pooled_mechanism_counts: pooled, direct_read_repetition_rate: repetition, ledger_omission_rate: omission,
    support_gates: gates, campaign_goal_achieved: false, matched_control_savings_evaluable: false,
    accepted_token_savings: null, authority_effect: 'none',
    claim_ceiling: 'Descriptive fixed exposed cohort only. Mechanism counts measure returned reads and prompt ledger paths, not causal quality gains or saved tokens. Perfect-quality gates remain separate.',
    open_questions_ref: 'RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md'};
}
