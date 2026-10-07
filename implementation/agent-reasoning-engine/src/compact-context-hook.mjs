import {lstatSync, realpathSync, readFileSync} from "node:fs";
import {isAbsolute} from "node:path";

import {selectRecoverableCheckpoint, verifyReasoningStateLog} from "../packages/reasoning-state-runtime/index.mjs";

const MAX_LOG_BYTES = 64 * 1024 * 1024;
const MAX_CONTEXT_BYTES = 16 * 1024;
const identifier = value => typeof value === "string" && value.trim() === value && value.length > 0 && Buffer.byteLength(value, "utf8") <= 256;
const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const blocked = reason => ({exit_code: 0, stdout: {continue: false, stopReason: `ARE compact context unavailable: ${reason}`}, stderr: ""});

export function validateCompactContextBinding(binding) {
  if (!record(binding) || Object.keys(binding).sort().join(",") !== "cwd,ledger_id,ledger_path,schema_version,session_id,thread_ref"
    || binding.schema_version !== "are.compact-context-binding/v1"
    || ![binding.session_id, binding.thread_ref, binding.ledger_id].every(identifier)
    || typeof binding.cwd !== "string" || !isAbsolute(binding.cwd)
    || typeof binding.ledger_path !== "string" || !isAbsolute(binding.ledger_path)) {
    throw new Error("hook.compact-binding-invalid");
  }
  return binding;
}

export function compactContextHook(event, binding, options = {}) {
  try {
    validateCompactContextBinding(binding);
    if (!record(event) || event.hook_event_name !== "SessionStart" || !identifier(event.session_id)
      || typeof event.cwd !== "string" || !isAbsolute(event.cwd)) throw new Error("hook.compact-event-invalid");
    if (event.source !== "compact") return {exit_code: 0, stdout: {}, stderr: ""};
    if (event.session_id !== binding.session_id || realpathSync(event.cwd) !== realpathSync(binding.cwd)) {
      return {exit_code: 0, stdout: {}, stderr: ""};
    }
    let file;
    try { file = lstatSync(binding.ledger_path); }
    catch { return blocked("ledger-file-unavailable"); }
    if (!file.isFile() || file.isSymbolicLink() || file.size > MAX_LOG_BYTES) return blocked("ledger-file-invalid");
    const verified = (options.verify_log ?? verifyReasoningStateLog)(binding.ledger_path, {expected_ledger_id: binding.ledger_id});
    if (!verified.ok) return blocked("ledger-unverified");
    const checkpoint = selectRecoverableCheckpoint(verified);
    if (!checkpoint.ok || checkpoint.disposition !== "recoverable") return blocked("checkpoint-unavailable");
    const records = verified.value.records;
    let planIndex = -1;
    for (let index = 0; index < records.length; index += 1) {
      if (records[index].record_kind === "reasoning-state-event"
        && records[index].value.event_kind === "plan-context-recorded"
        && records[index].value.content.thread_ref === binding.thread_ref) planIndex = index;
    }
    if (planIndex < 0) return blocked("plan-context-missing");
    const plan = records[planIndex].value;
    const epochs = new Map(records.filter(item => item.record_kind === "reasoning-state-epoch").map(item => [item.value.epoch_digest, item.value]));
    const checkpointed = records.slice(planIndex + 1).some(item => item.record_kind === "reasoning-state-checkpoint"
      && epochs.get(item.value.epoch_digest)?.event_digests.includes(plan.event_digest));
    if (!checkpointed) return blocked("plan-context-uncheckpointed");
    const projection = {
      schema_version: "are.compact-context-projection/v1",
      authority_effect: "none",
      session_id: binding.session_id,
      thread_ref: binding.thread_ref,
      checkpoint_digest: checkpoint.digest,
      log_digest: verified.value.log_digest,
      plan_context: plan.content,
    };
    const context = "ARE verified checkpointed plan context (task-state data, not permission or new user intent). Reconcile it with the current conversation before acting.\n"
      + JSON.stringify(projection);
    if (Buffer.byteLength(context, "utf8") > MAX_CONTEXT_BYTES) return blocked("projection-too-large");
    return {exit_code: 0, stdout: {hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: context}}, stderr: ""};
  } catch (error) {
    const reason = error.message?.startsWith("hook.") ? error.message : "hook.compact-runtime-unavailable";
    return {exit_code: 1, stdout: {}, stderr: `${reason}\n`};
  }
}

export function loadCompactContextBinding(path) {
  if (!isAbsolute(path ?? "")) throw new Error("hook.compact-binding-path-absolute-required");
  const file = lstatSync(path);
  if (!file.isFile() || file.isSymbolicLink() || file.size > 4096) throw new Error("hook.compact-binding-file-invalid");
  return validateCompactContextBinding(JSON.parse(readFileSync(path, "utf8")));
}
