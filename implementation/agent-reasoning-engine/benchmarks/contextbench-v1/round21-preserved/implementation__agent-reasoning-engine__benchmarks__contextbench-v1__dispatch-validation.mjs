// Boundary checks before scheduling another frozen cell. Open questions: README.md.
// This validates completion evidence, not native metric correctness or benchmark clearance.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';

const allowed = new Set(['final_context_selected', 'no_context_selected', 'invalid_final_response', 'token_budget_stopped', 'context_budget_stopped', 'call_budget_exhausted']);
const localTokenizerFailures = new Set(['request-failed', 'deadline-exceeded']);
const localModelOutputFailures = new Map([
  ['message-invalid', null],
  ['reasoning-invalid', null],
  ['incomplete-output', 'length'],
  ['finish-reason-unsupported', null],
  ['tool-calls-invalid', 'tool_calls'],
  ['final-text-invalid', 'stop'],
]);
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
function accountedLocalFailure(result) {
  if (!object(result) || result.status !== 'run_error' || typeof result.error !== 'string' || !result.error.startsWith('glm.')) return null;
  if (!Array.isArray(result.receipts) || result.receipts.length === 0 || result.selection != null || result.native_export != null || result.export_error != null) return null;
  const modelReceipts = result.receipts.filter(receipt => receipt?.kind === 'model' && receipt.dispatched === true);
  if (modelReceipts.some(receipt => !Number.isSafeInteger(receipt.input_tokens) || !Number.isSafeInteger(receipt.output_tokens))) return null;
  const terminal = result.receipts.at(-1), code = result.error.slice('glm.'.length);
  if (!object(terminal) || terminal.dispatched !== true) return null;
  let family;
  if (localTokenizerFailures.has(code)) {
    if (terminal.kind !== 'tokenizer' || terminal.status !== null || terminal.response_bytes !== 0 || terminal.failure_code !== code) return null;
    family = 'tokenizer-transport';
  } else if (localModelOutputFailures.has(code)) {
    const expectedFinish = localModelOutputFailures.get(code);
    if (terminal.kind !== 'model' || terminal.status !== 200 || !Number.isSafeInteger(terminal.input_tokens) || !Number.isSafeInteger(terminal.output_tokens) || terminal.response_bytes <= 0 || terminal.failure_code != null || (expectedFinish !== null && terminal.finish_reason !== expectedFinish)) return null;
    family = 'model-output-protocol';
  } else return null;
  return {scope: 'local-branch', failure_family: family, failure_code: code, terminal_kind: terminal.kind, terminal_status: terminal.status, response_bytes: terminal.response_bytes, known_model_tokens: modelReceipts.reduce((sum, receipt) => sum + receipt.input_tokens + receipt.output_tokens, 0), unknown_model_receipts: 0};
}
export function validateDispatchCompletion({cell, root}) {
  const issues = [], add = (path, code) => issues.push({path, code});
  function read(name) {
    let bytes;
    try { bytes = readFileSync(resolve(root, name)); }
    catch { add(name, 'dispatch.artifact-unreadable'); return null; }
    try {
      const value = JSON.parse(bytes);
      if (!object(value)) { add(name, 'dispatch.artifact-not-object'); return null; }
      return {bytes, value};
    } catch { add(name, 'dispatch.artifact-invalid-json'); return null; }
  }
  const completion = read('completed.json'), result = read('result.json');
  const c = completion?.value, r = result?.value;
  if (c) {
    if (c.benchmark_cleared !== false) add('completed.json/benchmark_cleared', 'dispatch.invalid-clearance-claim');
    if (typeof c.result_sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(c.result_sha256))
      add('completed.json/result_sha256', 'dispatch.invalid-result-digest');
  }
  if (c && r) {
    if (createHash('sha256').update(result.bytes).digest('hex') !== c.result_sha256)
      add('completed.json/result_sha256', 'dispatch.result-integrity');
    if (c.status !== r.status) add('completed.json/status', 'dispatch.status-mismatch');
  }
  const localFailure = accountedLocalFailure(r);
  if (r) {
    if (r.cell_id !== cell.cell_id) add('result.json/cell_id', 'dispatch.cell-mismatch');
    if (r.instance_id !== cell.instance_id) add('result.json/instance_id', 'dispatch.instance-mismatch');
    if (!allowed.has(r.status) && !localFailure) add('result.json/status', 'dispatch.shared-runtime-failure');
    if (r.status === 'no_context_selected' && (!Array.isArray(r.selection?.final_read_ids) || r.selection.final_read_ids.length !== 0))
      add('result.json/selection', 'dispatch.no-context-selection-mismatch');
    // Export failure is a shared instrument boundary even if terminal JSON was valid.
    if (r.export_error != null) add('result.json/export_error', 'dispatch.shared-export-failure');
    if (r.native_export != null && !object(r.native_export))
      add('result.json/native_export', 'dispatch.invalid-export-shape');
    if (r.status === 'final_context_selected') {
      if (r.error != null) add('result.json/error', 'dispatch.final-result-error');
      if (!object(r.native_export) && r.export_error == null)
        add('result.json/native_export', 'dispatch.missing-final-export');
    } else if (r.native_export != null) add('result.json/native_export', 'dispatch.export-without-final-selection');
    if (object(r.native_export)) {
      const scoring = read('scoring-status.json'), prediction = read('prediction.json'), score = read('native-score.json');
      if (scoring) {
        if (scoring.value.exit_code !== 0) add('scoring-status.json/exit_code', 'dispatch.scoring-failed');
        if (scoring.value.error != null) add('scoring-status.json/error', 'dispatch.scoring-process-error');
      }
      // Parsing is intentional; scorer semantics and metric checks belong to the native verifier.
      void prediction; void score;
    }
  }
  return {ok: issues.length === 0, directive: issues.length ? 'pause-unstarted' : localFailure ? 'continue-after-local-failure' : 'continue-sequence',
    cell_id: cell.cell_id, status: r?.status ?? null, issues, local_failure: localFailure, authority_effect: 'none', benchmark_cleared: false};
}
