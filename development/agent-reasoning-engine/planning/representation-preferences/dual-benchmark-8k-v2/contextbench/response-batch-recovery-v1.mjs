// One-correction, pre-tool recovery controller for the round-78 successor.
// The caller owns durable ledgers; any split acknowledgement fails closed.
import {correctiveBatchMessage, validateCompleteResponseBatch} from "./response-batch-validation-v1.mjs";

const fail = (code, details = {}) => { const error = new Error(code); error.code = code; Object.assign(error, details); throw error; };
const knownUsage = (receipt) => Number.isSafeInteger(receipt?.usage?.total_tokens) && receipt.usage.total_tokens >= 0;

export async function runResponseBatchRecovery({dispatch, execute_tool, acknowledge_transport, acknowledge_recycler, persist, tools, limits = {maximum_calls: 96, maximum_tokens: 4_000_000, maximum_executable_tool_calls: 8}} = {}) {
  if (![dispatch, execute_tool, acknowledge_transport, acknowledge_recycler, persist].every((value) => typeof value === "function") || !tools || !Number.isSafeInteger(limits.maximum_calls) || limits.maximum_calls < 1 || !Number.isSafeInteger(limits.maximum_tokens) || limits.maximum_tokens < 1 || limits.maximum_executable_tool_calls !== 8) fail("response-recovery.dependencies-invalid");
  let calls = 0, tokens = 0, corrections = 0;
  const receipts = [], events = [];
  let feedback = null;
  while (true) {
    if (calls >= limits.maximum_calls) fail("response-recovery.call-budget-exhausted", {receipts, events});
    const attempt = await dispatch({feedback, sequence: calls + 1});
    calls += 1;
    if (!attempt?.receipt || !knownUsage(attempt.receipt)) fail("response-recovery.unknown-usage", {receipts, events});
    tokens += attempt.receipt.usage.total_tokens;
    receipts.push(structuredClone(attempt.receipt));
    await persist({kind: "response-attempt-accounted", sequence: calls, receipt: structuredClone(attempt.receipt), cumulative_tokens: tokens});
    if (tokens > limits.maximum_tokens) fail("response-recovery.token-budget-exhausted", {receipts, events});
    const validation = validateCompleteResponseBatch(attempt.response, {maximum_calls: limits.maximum_executable_tool_calls, tools});
    await persist({kind: "response-batch-validation", sequence: calls, validation});
    if (!validation.ok) {
      if (!validation.correction_eligible || corrections >= 1) fail("response-recovery.response-invalid", {validation, receipts, events});
      const event = {kind: "over-limit-tool-batch-discarded", sequence: calls, response_sha256: validation.diagnostic.response_sha256, count: validation.diagnostic.count, no_tool_executed: true};
      events.push(event);
      await persist({kind: "response-recovery-pending", event, correction_number: 1});
      try {
        await acknowledge_transport({receipt: attempt.receipt, code: validation.code});
        await persist({kind: "response-recovery-transport-acknowledged", sequence: calls});
        await acknowledge_recycler(validation.code);
        await persist({kind: "response-recovery-recycler-acknowledged", sequence: calls});
      } catch (cause) {
        fail("response-recovery-ack-uncertain", {cause, receipts, events, no_blind_replay: true});
      }
      corrections += 1;
      feedback = correctiveBatchMessage(limits.maximum_executable_tool_calls);
      continue;
    }
    const callsToExecute = attempt.response.choices[0].message.tool_calls;
    const outputs = [];
    for (const call of callsToExecute) outputs.push(await execute_tool(call.function.name, JSON.parse(call.function.arguments), call.id));
    await persist({kind: "response-batch-executed", sequence: calls, tool_call_count: callsToExecute.length});
    return Object.freeze({status: "executed", calls, tokens, corrections, receipts, events, outputs, no_premature_execution: events.every((event) => event.no_tool_executed), authority_effect: "none"});
  }
}
