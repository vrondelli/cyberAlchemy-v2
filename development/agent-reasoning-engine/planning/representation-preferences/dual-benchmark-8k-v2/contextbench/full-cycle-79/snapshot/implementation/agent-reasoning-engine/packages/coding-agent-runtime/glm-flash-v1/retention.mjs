import {hash, stable, need} from './transport.mjs';

export function validateRetentionPolicy(value = 'clear-v1') {
  need(['clear-v1', 'recent-observations-v1', 'recent-observations-v2'].includes(value), 'retention-policy-invalid');
  return value;
}

// Projection only: original observations remain in the verified durable journal.
// Two exchanges is a preference, never a token-budget assertion. The recycler
// measures every complete rendered candidate before reserving a dispatch.
export function projectRecentObservations(history, history_ref) {
  return projectObservations(history, history_ref, 2);
}

// V2 changes only the recent-output preference. The same validation/masking
// rules apply, and originals remain in the checkpoint/archive.
export function projectRecentObservationsV2(history, history_ref) {
  return projectObservations(history, history_ref, 1);
}

function projectObservations(history, history_ref, recentCount) {
  need(Array.isArray(history) && history.length <= 12 && /^[a-f0-9]{64}$/.test(history_ref), 'retention-history-invalid');
  return history.map((entry, step) => {
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
    if (step >= history.length - recentCount) return entry;
    return {...entry, messages: [messages[0], ...messages.slice(1).map(message => ({...message,
      content: stable({are_observation_masked: true, original_content_sha256: hash(message.content),
        history_ref, history_step: step + 1, tool_call_id: message.tool_call_id,
        recovery: 'Original result is available through read-context-evidence.'})}))]};
  });
}

export function recentRecoveryCandidates(history) {
  // Complete exchanges only, descending preference. No token estimate here.
  return [history.slice(-2), history.slice(-1), []]
    .filter((entries, index, all) => all.findIndex(other => other.length === entries.length) === index);
}
