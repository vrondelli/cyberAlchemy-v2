import {createHash} from "node:crypto";

export const MAX_EXECUTABLE_TOOL_CALLS = 8;
export const MAX_RECOVERABLE_TOOL_CALLS = 32;
export const MAX_DIAGNOSTIC_CALL_SUMMARIES = 16;
const sha = (value) => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
const text = (value) => typeof value === "string" && value.trim().length > 0;

function inspectCall(call, validators) {
  const structural = call && call.type === "function" && text(call.id) && call.function && text(call.function.name) && typeof call.function.arguments === "string";
  const name = structural ? call.function.name : null;
  const recognized = name !== null && validators !== null && typeof validators === "object" && Object.hasOwn(validators, name) && typeof validators[name] === "function";
  let args = null, json_valid = false, schema_valid = false;
  if (structural) try { args = JSON.parse(call.function.arguments); json_valid = args !== null && typeof args === "object" && !Array.isArray(args); } catch {}
  if (json_valid && recognized) try { schema_valid = validators[name](args) === true; } catch { schema_valid = false; }
  return {structural, name, recognized, json_valid, schema_valid};
}

export function assessResponseBatch(message, finish_reason, {validators = {}} = {}) {
  if (finish_reason === "stop") {
    const valid = text(message?.content) && message?.tool_calls === undefined;
    return {valid, kind: valid ? "terminal" : "invalid", recoverable: false, over_limit: false, count: 0, diagnostic: {response_sha256: sha({message, finish_reason}), observed_count: 0, over_limit: false, calls: [], truncated: false}};
  }
  const calls = message?.tool_calls;
  const inspected = Array.isArray(calls) ? calls.map((call) => inspectCall(call, validators)) : [];
  const unique = Array.isArray(calls) && new Set(calls.map((call) => call?.id)).size === calls.length;
  const count = Array.isArray(calls) ? calls.length : null;
  const structurallyValid = finish_reason === "tool_calls" && Array.isArray(calls) && count > 0 && count <= MAX_RECOVERABLE_TOOL_CALLS && unique && inspected.every((item) => item.structural && item.json_valid && item.recognized && item.schema_valid);
  const over_limit = structurallyValid && count > MAX_EXECUTABLE_TOOL_CALLS;
  const summaries = inspected.slice(0, MAX_DIAGNOSTIC_CALL_SUMMARIES).map((item) => ({...(item.recognized ? {recognized_name: item.name} : item.name ? {name_sha256: sha(item.name)} : {}), structural: item.structural, recognized: item.recognized, json_valid: item.json_valid, schema_valid: item.schema_valid}));
  return {valid: structurallyValid, kind: structurallyValid ? "tool_calls" : "invalid", recoverable: over_limit, over_limit, count, diagnostic: {response_sha256: sha({message, finish_reason}), observed_count: count, over_limit: count > MAX_EXECUTABLE_TOOL_CALLS, calls: summaries, truncated: inspected.length > summaries.length}};
}

export function correctiveBatchMessages(message, assessment, options = {}) {
  const fresh = assessResponseBatch(message, "tool_calls", options);
  if (!assessment?.valid || !assessment.recoverable || !fresh.valid || !fresh.recoverable || fresh.diagnostic.response_sha256 !== assessment.diagnostic?.response_sha256 || fresh.count !== assessment.count) throw new Error("g02-batch-policy.not-recoverable");
  const calls = structuredClone(message.tool_calls);
  return {
    assistant_message: {role: "assistant", content: null, tool_calls: calls},
    tool_messages: calls.map((call) => ({role: "tool", tool_call_id: call.id, content: JSON.stringify({ok: false, error: "tool-batch-execution-limit", execution_succeeded: false, effects: "none", maximum_calls_per_response: MAX_EXECUTABLE_TOOL_CALLS, received_calls: assessment.count})})),
    feedback: `The previous response requested ${assessment.count} tool calls, above the ${MAX_EXECUTABLE_TOOL_CALLS}-call execution limit. None ran. Retry with at most eight calls. The correction remains inside the original call and token budgets.`,
  };
}
