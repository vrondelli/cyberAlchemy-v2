// Call capturePublicResponse immediately on transport.generate's returned result.
// Local integrity evidence only, not provider-signed authentication. Open questions: README.md.
import {createHash} from 'node:crypto';
import {stable, bindDelivery} from './delivery.mjs';
import {exportCapturedContext} from './receipt-export.mjs';
import {diagnoseFinalSelection} from './terminal-schema.mjs';
const hash = x => createHash('sha256').update(typeof x === 'string' ? x : stable(x)).digest('hex');
const need = (x, reason) => { if (!x) throw Error(`final-selection.${reason}`); };

export function capturePublicResponse(result, receipt_index) {
  need(Number.isSafeInteger(receipt_index) && receipt_index >= 0, 'receipt-index');
  need(typeof result?.final_bytes === 'string', 'response-required');
  const parsed = JSON.parse(result.final_bytes), r = result.receipt;
  need(r?.kind === 'model' && r.dispatched === true && r.status === 200 && !r.failure_code, 'unsuccessful-response');
  need(parsed.message?.role === 'assistant', 'assistant-required');
  // Persist only public content/tool calls, not hidden reasoning text.
  const public_response = {finish_reason: parsed.finish_reason,
    message: {role: 'assistant', content: parsed.message.content ?? null,
      ...(parsed.message.tool_calls ? {tool_calls: parsed.message.tool_calls} : {})}};
  need(r.finish_reason === parsed.finish_reason, 'finish-receipt-mismatch');
  const material = {receipt_index, receipt_sha256: hash(r), request_sha256: r.request_sha256, public_response};
  return {...material, capture_sha256: hash(material)};
}

export function selectFinalReads({captures, receipts, response_capture}) {
  const c = response_capture;
  need(c && typeof c === 'object', 'capture-required');
  const {capture_sha256, ...material} = c;
  need(hash(material) === capture_sha256, 'capture-digest');
  need(Number.isSafeInteger(c.receipt_index) && c.receipt_index >= 0, 'receipt-index');
  const r = receipts[c.receipt_index];
  need(r && hash(r) === c.receipt_sha256 && r.request_sha256 === c.request_sha256, 'receipt-mismatch');
  need(!receipts.slice(c.receipt_index + 1).some(x => x.kind === 'model' && x.dispatched === true), 'not-terminal-response');
  const binding = bindDelivery({captures, receipts});
  need(binding.requests.some(x => x.receipt_index === c.receipt_index && x.posture === 'confirmed-successful-request'), 'unconfirmed-response');
  const publicResponse = c.public_response;
  need(publicResponse?.finish_reason === 'stop' && r.finish_reason === 'stop' &&
    publicResponse.message?.role === 'assistant' && !publicResponse.message.tool_calls, 'terminal-text-required');
  const diagnostic=diagnoseFinalSelection(publicResponse.message.content,binding.read_observations.map(x=>x.id));
  if(!diagnostic.ok){const error=Error(`final-selection.${diagnostic.category}`);error.diagnostic=diagnostic;throw error;}
  const selection=diagnostic.value,ids=selection.context_read_ids;
  return {final_read_ids: ids, summary: selection.summary, response_capture_sha256: c.capture_sha256};
}

export function exportModelSelectedContext(input, repoRoot) {
  const selection = selectFinalReads(input);
  const exported = exportCapturedContext({...input, final_read_ids: selection.final_read_ids}, repoRoot);
  return {...exported, selection,
    selection_posture: 'Explicit terminal model content bound to local transport response capture and matching successful request receipt; not archive union or proof of semantic use.'};
}
