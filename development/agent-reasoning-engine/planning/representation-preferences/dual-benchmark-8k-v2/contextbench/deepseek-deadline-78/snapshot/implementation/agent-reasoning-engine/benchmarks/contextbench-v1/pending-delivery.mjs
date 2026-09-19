// Preserve first delivery of an executed tool exchange across history recycling.
// Open questions: README.md. Retention here is transport delivery, not semantic use.
import {stable} from './delivery.mjs';
export function retainPendingToolExchange(visible, pending) {
  if (!pending.length) return visible;
  const calls = pending[0]?.tool_calls;
  if (pending[0]?.role !== 'assistant' || !Array.isArray(calls) || !calls.length)
    throw Error('pending-delivery.assistant-call-required');
  const ids = new Set(calls.map(c => c.id));
  if (ids.size !== calls.length || [...ids].some(id => typeof id !== 'string' || !id.length))
    throw Error('pending-delivery.call-identities');
  const results = pending.slice(1);
  if (results.length !== calls.length || results.some(m => m.role !== 'tool' || !ids.has(m.tool_call_id)) ||
      new Set(results.map(m => m.tool_call_id)).size !== ids.size)
    throw Error('pending-delivery.complete-results-required');
  if (visible.length >= pending.length && stable(visible.slice(-pending.length)) === stable(pending)) return visible;
  // A recycler may retain only the tail of an exchange. Reassemble it once,
  // with its assistant call before every matching result, without duplicating IDs.
  const rest = visible.filter(m => !(m.role === 'tool' && ids.has(m.tool_call_id)) &&
    !(m.role === 'assistant' && m.tool_calls?.some(c => ids.has(c.id))));
  return [...rest, ...pending];
}
