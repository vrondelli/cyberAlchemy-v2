import {createHash} from 'node:crypto';
const stable = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key,item[key]])) : item);
const hash = value => createHash('sha256').update(typeof value === 'string' ? value : stable(value)).digest('hex');
const need = (condition, code) => { if (!condition) throw new Error(code); };
export function projectObservations(history, history_ref, recentCount) {
  need(Array.isArray(history) && history.length <= 12 && /^[a-f0-9]{64}$/.test(history_ref), 'retention-history-invalid');
  const validate = entry => {
    const messages = entry.messages;
    const calls = messages?.[0]?.tool_calls;
    need(Array.isArray(calls) && calls.length > 0 && messages[0].role === 'assistant'
      && messages.length === calls.length + 1, 'retention-tool-pair-invalid');
    const ids = calls.map(call => call.id);
    need(ids.every(id => typeof id === 'string' && id.length > 0) && new Set(ids).size === ids.length,
      'retention-tool-pair-invalid');
    for (const [index, message] of messages.slice(1).entries()) {
      need(message.role === 'tool' && message.tool_call_id === ids[index] && typeof message.content === 'string',
        'retention-tool-pair-invalid');
    }
    return {messages, ids};
  };
  const validated = history.map(validate);
  return history.map((entry, step) => {
    if (step >= history.length - recentCount) return entry;
    const {messages} = validated[step];
    return {...entry, messages: [messages[0], ...messages.slice(1).map(message => ({...message,
      content: stable({are_observation_masked: true, original_content_sha256: hash(message.content),
        history_ref, history_step: step + 1, tool_call_id: message.tool_call_id,
        recovery: 'Original result is available through read-context-evidence.'})}))]};
  });
}
