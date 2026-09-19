export const MAX_EXECUTABLE_TOOL_CALLS = 8;
export const MAX_CAPTURED_TOOL_CALLS = 32;

const validCall = call =>
  call && call.type === 'function' && typeof call.id === 'string' &&
  call.id.length > 0 && call.function &&
  typeof call.function.name === 'string' && call.function.name.length > 0 &&
  typeof call.function.arguments === 'string';

export function assessToolBatch(message, finishReason) {
  if (finishReason !== 'tool_calls') {
    return {valid: true, over_limit: false, count: 0};
  }
  const calls = message?.tool_calls;
  if (!Array.isArray(calls) || calls.length < 1 ||
      calls.length > MAX_CAPTURED_TOOL_CALLS || !calls.every(validCall) ||
      new Set(calls.map(call => call.id)).size !== calls.length) {
    return {
      valid: false,
      over_limit: false,
      count: Array.isArray(calls) ? calls.length : null
    };
  }
  return {
    valid: true,
    over_limit: calls.length > MAX_EXECUTABLE_TOOL_CALLS,
    count: calls.length
  };
}

export function rejectOverLimitToolBatch(message) {
  const assessment = assessToolBatch(message, 'tool_calls');
  if (!assessment.valid || !assessment.over_limit) {
    throw Error('tool-batch-policy.not-over-limit');
  }
  return {
    tool_messages: message.tool_calls.map(call => ({
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify({
        ok: false,
        error: 'tool-batch-execution-limit',
        execution_succeeded: false,
        effects: 'none',
        maximum_calls_per_response: MAX_EXECUTABLE_TOOL_CALLS,
        received_calls: assessment.count
      })
    })),
    feedback:
      `The previous response requested ${assessment.count} tool calls, above the ` +
      `${MAX_EXECUTABLE_TOOL_CALLS}-call execution limit. None of those calls ran. ` +
      'Retry with one concise action or at most eight tool calls. Split larger work ' +
      'across later responses. The rejected response and correction remain inside ' +
      'the original call and token budgets.'
  };
}
