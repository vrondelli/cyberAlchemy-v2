import {hash, stable, need} from './transport.mjs';

// The caller supplies the current source-bound checkpoint and its archive
// capability. No path/digest is accepted from model arguments, and no current
// workspace file is read here. Original full observations remain untouched.
export function readInspectionEvidence({history, history_ref, recycling, base, observation_allowlist}, args) {
  need(args && typeof args === 'object' && !Array.isArray(args)
    && Object.keys(args).every(key => ['call_id', 'offset', 'max_chars'].includes(key)), 'inspection-arguments-invalid');
  const {call_id, offset = 0, max_chars = 1024} = args;
  need(typeof call_id === 'string' && call_id.length > 0 && call_id.length <= 256 && !call_id.includes('\0'), 'inspection-call-id-invalid');
  need(Number.isSafeInteger(offset) && offset >= 0 && Number.isSafeInteger(max_chars)
    && max_chars >= 1 && max_chars <= 1024, 'inspection-range-invalid');
  need(Array.isArray(history) && history.length <= 12 && /^[a-f0-9]{64}$/.test(history_ref)
    && hash(history) === history_ref, 'inspection-history-mismatch');
  need(typeof recycling?.readEvidence === 'function', 'inspection-archive-required');
  const proof = recycling.readEvidence({digest: history_ref, offset: 0, max_chars: 1});
  need(proof?.ok === true && proof.output?.digest === history_ref, 'inspection-archive-invalid');
  const matches = [];
  for (const entry of history) for (const [index, call] of (entry.calls ?? []).entries()) {
    if (call.id === call_id) matches.push({entry, index, call, observation: entry.observations?.[index]});
  }
  need(matches.length === 1, 'inspection-call-not-unique');
  const {entry, index, call, observation} = matches[0];
  const path = call.arguments?.path, sourceHash = base?.files?.[path];
  need(call.name === 'read-file' && Array.isArray(observation_allowlist) && observation_allowlist.includes(path)
    && /^[a-f0-9]{64}$/.test(sourceHash) && observation?.ok === true
    && observation.output?.path === path && observation.output.sha256 === sourceHash
    && typeof observation.output.utf8 === 'string' && hash(observation.output.utf8) === sourceHash,
  'inspection-source-invalid');
  // Verify that the selected typed observation is the original native tool
  // result, not an unrelated successful observation copied into a call record.
  const native = entry.messages?.[0]?.tool_calls?.[index], result = entry.messages?.[index + 1];
  let nativeArgs;
  try { nativeArgs = typeof native?.function?.arguments === 'string' ? JSON.parse(native.function.arguments) : native?.function?.arguments; }
  catch { need(false, 'inspection-protocol-invalid'); }
  need(entry.messages?.[0]?.role === 'assistant' && native?.id === call_id && native?.function?.name === 'read-file'
    && stable(nativeArgs) === stable(call.arguments) && result?.role === 'tool' && result.tool_call_id === call_id
    && result.content === stable(observation), 'inspection-protocol-invalid');
  const text = observation.output.utf8;
  need(offset <= text.length, 'inspection-range-invalid');
  const splitPair = position => position > 0 && position < text.length
    && /[\uD800-\uDBFF]/.test(text[position - 1]) && /[\uDC00-\uDFFF]/.test(text[position]);
  need(!splitPair(offset), 'inspection-range-splits-unicode');
  let end = Math.min(text.length, offset + max_chars);
  if (splitPair(end)) end--;
  need(end > offset || offset === text.length, 'inspection-range-splits-unicode');
  return {ok: true, output: {call_id, path, sha256: sourceHash, digest: history_ref, archive_digest: history_ref,
    offset_unit: 'utf16-code-units', offset, next_offset: end, total_chars: text.length, eof: end === text.length,
    utf8: text.slice(offset, end)}};
}
