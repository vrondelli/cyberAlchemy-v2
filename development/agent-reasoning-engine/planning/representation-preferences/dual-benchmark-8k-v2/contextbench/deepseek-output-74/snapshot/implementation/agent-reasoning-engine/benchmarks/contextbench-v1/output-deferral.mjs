// Candidate projection after full fresh-request admission fails. Open questions: README.md.
// Original executed results remain in the caller journal; this function never executes tools.
import {createHash} from 'node:crypto';
import {stable} from './delivery.mjs';
import {retainPendingToolExchange} from './pending-delivery.mjs';
const readOnly = new Set(['read_file', 'search', 'list_files', 'get_patch', 'recover_observed_read']);
const guidance = {
  read_file: 'Request fewer lines from the intended revision. If one line is too large, choose narrower source evidence; partial-line credit is unavailable.',
  search: 'Narrow query/path_prefix or reduce limit, starting with one match. Page using offset; returned source must fit before it can be selected.',
  list_files: 'Reduce limit and page using offset; narrow query when useful.',
  get_patch: 'Inspect smaller current/base source ranges; the full patch remains recorded outside this context.',
  recover_observed_read: 'The archived result is too large here. Read smaller source ranges in an explicitly intended revision; do not assume current and archived versions match.'
};
export function deferReadOnlyOutputs(pending, {maximum_inline_bytes = 512} = {}) {
  if (!Number.isSafeInteger(maximum_inline_bytes) || maximum_inline_bytes < 1 || maximum_inline_bytes > 4096)
    throw Error('output-deferral.invalid-inline-bound');
  if (!Array.isArray(pending)) throw Error('output-deferral.exchange-required');
  if (!pending.length) return {exchange: [], deferrals: [], authority_effect: 'none'};
  retainPendingToolExchange([], pending); // Complete call/result identity checks.
  const calls = new Map(pending[0].tool_calls.map(c => [c.id, c]));
  const deferrals = [];
  const exchange = pending.map((message, i) => {
    if (i === 0) return message;
    const call = calls.get(message.tool_call_id), name = call.function?.name;
    if (!readOnly.has(name) || typeof message.content !== 'string' || Buffer.byteLength(message.content) <= maximum_inline_bytes) return message;
    let result; try { result = JSON.parse(message.content); } catch { return message; }
    if (result?.ok !== true) return message; // Never hide a validator/producer failure.
    const result_digest = createHash('sha256').update(message.content).digest('hex');
    const notice = {ok: false, error: 'tool-output-deferred', execution_succeeded: true,
      effects: 'read-only', payload_delivered: false, original_result_bytes: Buffer.byteLength(message.content),
      result_digest, guidance: guidance[name]};
    const content = stable(notice);
    if (Buffer.byteLength(content) > 640) throw Error('output-deferral.notice-too-large');
    deferrals.push({tool_call_id: call.id, tool: name, result_digest, original_result_bytes: notice.original_result_bytes,
      notice_bytes: Buffer.byteLength(content)});
    return {...message, content};
  });
  return {exchange, deferrals, authority_effect: 'none',
    claim_ceiling: 'Projection only. A notice is delivered only after a matching successful request receipt. Withheld source gets no first-delivery or native-context credit.'};
}
