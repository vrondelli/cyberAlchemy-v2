// Pure complete-response validator for the ARE x DSH round-78 successor.
// Diagnostics intentionally retain no reasoning text or raw tool arguments.
import {createHash} from "node:crypto";

export const RESPONSE_BATCH_VALIDATION_SCHEMA = "are.dsh-response-batch-validation/v1";
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
const digest = (value) => createHash("sha256").update(stable(value)).digest("hex");
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.length > 0;
const verdict = ({ok, code, correction_eligible = false, response, finish_reason = null, calls = []}) => Object.freeze({schema_version: RESPONSE_BATCH_VALIDATION_SCHEMA, ok, code, correction_eligible, diagnostic: Object.freeze({response_sha256: digest(response), finish_reason, count: calls.length, calls: Object.freeze(calls.map(Object.freeze))}), authority_effect: "none"});

export function validateCompleteResponseBatch(response, {maximum_calls = 8, tools = {}} = {}) {
  if (!Number.isSafeInteger(maximum_calls) || maximum_calls < 1 || maximum_calls > 64 || !object(tools)) throw new TypeError("response-batch.policy-invalid");
  const choice = Array.isArray(response?.choices) && response.choices.length === 1 ? response.choices[0] : null;
  const message = choice?.message;
  const finish_reason = choice?.finish_reason ?? null;
  if (!object(message) || message.role !== "assistant") return verdict({ok: false, code: "message-invalid", response, finish_reason});
  if (message.reasoning_content !== undefined && typeof message.reasoning_content !== "string") return verdict({ok: false, code: "reasoning-invalid", response, finish_reason});
  if (!Array.isArray(message.tool_calls)) return verdict({ok: false, code: "tool-calls-invalid", response, finish_reason});
  const seen = new Set();
  const calls = message.tool_calls.map((call, index) => {
    const name = call?.function?.name;
    let args;
    let arg_json_valid = false;
    try { args = JSON.parse(call?.function?.arguments); arg_json_valid = object(args); } catch {}
    const duplicate_id = text(call?.id) && seen.has(call.id);
    if (text(call?.id)) seen.add(call.id);
    let schema_valid = false;
    if (text(name) && Object.hasOwn(tools, name) && arg_json_valid) {
      const validate = tools[name];
      schema_valid = typeof validate === "function" ? validate(args) === true : validate === true;
    }
    return {index, name: text(name) ? name : null, name_sha256: text(name) ? digest(name) : null, id_valid: text(call?.id), duplicate_id, type_valid: call?.type === "function", arg_json_valid, schema_valid};
  });
  if (calls.length > maximum_calls) return verdict({ok: false, code: "tool-calls-invalid", correction_eligible: true, response, finish_reason, calls});
  if (calls.length < 1 || calls.some((call) => !call.id_valid || call.duplicate_id || !call.type_valid || call.name === null || !call.arg_json_valid || !call.schema_valid)) return verdict({ok: false, code: "tool-calls-invalid", response, finish_reason, calls});
  if (!["tool_calls", "stop"].includes(finish_reason)) return verdict({ok: false, code: "finish-reason-unsupported", response, finish_reason, calls});
  return verdict({ok: true, code: "accepted", response, finish_reason, calls});
}

export function correctiveBatchMessage(maximum_calls = 8) {
  if (!Number.isSafeInteger(maximum_calls) || maximum_calls < 1) throw new TypeError("response-batch.policy-invalid");
  return `The previous assistant response was discarded before any tool execution because it requested more than ${maximum_calls} tool calls. Submit at most ${maximum_calls} valid tool calls, or a valid terminal response. The discarded request still counts against all call and token budgets.`;
}
