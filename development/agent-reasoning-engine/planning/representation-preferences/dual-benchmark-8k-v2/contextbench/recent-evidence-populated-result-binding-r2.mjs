// Admission of reviewed populated-ledger tokenizer evidence only.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const need = (value, message) => { if (!value) throw Error('recent-populated-binding.' + message); };

export function verifyRecentPopulatedQualification({qualification_path, qualification_sha256, schedule}) {
  const bytes = readFileSync(qualification_path);
  need(hash(bytes) === qualification_sha256, 'file-drift');
  const qualification = JSON.parse(bytes), report = qualification.measurement_report,
    settlement = qualification.process_settlement;
  need(qualification.qualified === true && settlement?.local_settled === true &&
    settlement.process_group_absent === true && settlement.forced === false && settlement.exit_code === 0,
  'settlement');
  need(report?.schema === 'are.recent-evidence-populated-campaign/v2' && report.qualified === true &&
    report.model_calls === 0 && report.schedule_sha256 === schedule.schedule_sha256 &&
    report.rows?.length === 4 && schedule.slots.length === 4 && report.workers === 2, 'report');
  let requests = 0, populated = 0, maximum = 0;
  for (const [index, row] of report.rows.entries()) {
    const slot = schedule.slots[index], result = row.result;
    need(row.qualified === true && row.model_calls === 0 && row.slot_id === slot.slot_id &&
      result?.qualified === true && result.model_calls === 0 && result.task_id === slot.instance_id &&
      result.cell_sha256 === slot.cell_sha256 && result.donor_sha256 === row.donor_sha256, 'slot');
    need(Number.isSafeInteger(result.requests_measured) && result.requests_measured === result.rows?.length &&
      Number.isSafeInteger(result.populated_requests) && result.populated_requests > 0 &&
      result.populated_requests <= result.requests_measured, 'request-count');
    need(Array.isArray(result.receipts) && result.receipts.length >= 1 &&
      result.receipts.length <= result.requests_measured && result.receipts.every(receipt => receipt.kind === 'tokenizer') &&
      Array.isArray(result.index_receipts) && result.index_receipts.every(receipt => receipt.kind === 'index-tokenizer') &&
      providerAttemptHealth([...result.receipts, ...result.index_receipts]).healthy, 'receipt-family');
    const receiptsByHash = new Map(result.receipts.map(receipt => [receipt.request_sha256, receipt]));
    for (const request of result.rows) {
      need(Number.isSafeInteger(request.receipt_index) && request.receipt_index >= 0 &&
        /^[a-f0-9]{64}$/.test(request.historical_prompt_sha256) &&
        /^[a-f0-9]{64}$/.test(request.candidate_prompt_sha256) &&
        /^[a-f0-9]{64}$/.test(request.request_sha256) && receiptsByHash.has(request.request_sha256),
      'request-binding');
      const receipt = receiptsByHash.get(request.request_sha256);
      need(Number.isSafeInteger(request.envelope_tokens) && request.envelope_tokens <= 8000 &&
        request.projected_tokens === request.envelope_tokens - 2 && request.projected_tokens < 7999 &&
        Number.isSafeInteger(request.retained_reasoning_reservation) && request.retained_reasoning_reservation >= 0 &&
        Number.isSafeInteger(request.retained_reasoning_occurrences) && request.retained_reasoning_occurrences >= 0 &&
        receipt.retained_reasoning_reservation === request.retained_reasoning_reservation &&
        receipt.retained_reasoning_occurrences === request.retained_reasoning_occurrences &&
        receipt.input_tokens + slot.cell.provider_profile.token_margin + request.retained_reasoning_reservation +
          slot.cell.limits.output_cap + 2 === request.envelope_tokens,
      'request-window');
      need(Number.isSafeInteger(request.ledger_entries) && request.ledger_entries >= 0 &&
        Number.isSafeInteger(request.included_entries) && request.included_entries >= 0 &&
        Number.isSafeInteger(request.omitted_entries) && request.omitted_entries >= 0 &&
        request.included_entries + request.omitted_entries === request.ledger_entries &&
        Array.isArray(request.historical_paths) && Array.isArray(request.candidate_paths) &&
        request.candidate_paths.length === request.included_entries, 'ledger-accounting');
    }
    need(result.populated_requests === result.rows.filter(request => request.included_entries > 0).length &&
      result.maximum_envelope_tokens === Math.max(...result.rows.map(request => request.envelope_tokens)),
    'slot-aggregate');
    requests += result.requests_measured;
    populated += result.populated_requests;
    maximum = Math.max(maximum, result.maximum_envelope_tokens);
  }
  need(report.requests_measured === requests && report.populated_requests === populated &&
    report.maximum_envelope_tokens === maximum, 'campaign-aggregate');
  return true;
}
