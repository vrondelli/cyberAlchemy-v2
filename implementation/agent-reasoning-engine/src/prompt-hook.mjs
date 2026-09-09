import {realpathSync} from "node:fs";
import {relative, isAbsolute, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {decide, MAX_INPUT_BYTES} from "./decision-cli.mjs";
import {digestValue} from "../packages/codex-app-server-wrapper/src/canonical.mjs";

export const checkoutRoot = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const text = value => typeof value === "string" && value.trim().length > 0;
const record = value => value !== null && typeof value === "object" && !Array.isArray(value);

function output(material) {
  const guidance = "ARE advisory routing evidence, not authorization. The original user prompt and conversation remain the intent source. "
    + "Announce the selected route's read_first before reading it and retain its ceilings. "
    + "If conversation context is needed, preserve the active objective and prior authorization, mark inferred fields, and call are decide route. "
    + "For unavailable sources, report the exact diagnostic and repair only within existing scope. Never invent a routing fallback.\n";
  return {hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: guidance + JSON.stringify(material)}};
}

export function preparePromptRequest(event, options = {}) {
    if (!record(event) || Buffer.byteLength(JSON.stringify(event)) > MAX_INPUT_BYTES) throw new Error("hook.input-invalid");
    if (event.hook_event_name !== "UserPromptSubmit") throw new Error("hook.event-unsupported");
    for (const key of ["session_id", "turn_id", "cwd", "prompt"]) if (!text(event[key])) throw new Error(`hook.field-required:${key}`);
    if (event.session_id.length > 256 || event.turn_id.length > 256 || event.prompt.length > 65536) throw new Error("hook.field-too-large");
    // Only metadata is accepted beyond these fields. Never read transcript_path,
    // interpolate a prompt into a command, or accept caller policy overrides.
    for (const key of Object.keys(event)) if (!["hook_event_name", "session_id", "turn_id", "cwd", "prompt", "transcript_path", "model", "permission_mode"].includes(key)) throw new Error("hook.field-unsupported");
    for (const key of ["transcript_path", "model", "permission_mode"]) if (event[key] !== undefined && event[key] !== null && typeof event[key] !== "string") throw new Error("hook.metadata-invalid");
    if (!isAbsolute(event.cwd)) throw new Error("hook.cwd-absolute-required");
    const root = options.checkoutRoot ?? checkoutRoot;
    const cwd = realpathSync(event.cwd);
    const rel = relative(root, cwd);
    if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("hook.cwd-outside-checkout");
    return {schema_version: "are.cli-request/v1",
      session_id: `hook-session:${digestValue({session: event.session_id, root})}`,
      request_id: `hook-request:${digestValue({turn: event.turn_id, prompt: event.prompt, cwd})}`,
      request: {raw_request: event.prompt, objective_kind: null, requested_effects: [], target_refs: [], constraints: [], evidence_refs: [],
        field_postures: {request_id: "inferred", raw_request: "explicit", objective_kind: "absent", requested_effects: "absent", target_refs: "absent", constraints: "absent", evidence_refs: "absent"}}};
}

export function promptHook(event, options = {}) {
  try {
    const input = preparePromptRequest(event, options);
    const engine = options.decide ?? decide;
    const route = engine("route", input);
    const material = {schema_version: "are.prompt-hook-evidence/v1", authority_effect: "none", mode: "advisory",
      disposition: !route.ok ? "unavailable" : route.kind === "direct" ? "routed" : "needs-conversation-context",
      request_digest: digestValue(input), receipt: route.receipt ?? null,
      engine_kind: route.kind, reason_codes: route.reason_codes ?? route.result?.reason_codes ?? [],
      route_contract: route.route_contract ?? null};
    if (route.ok && route.kind === "direct") {
      const context = engine("context", {...input, previous_receipt: route.receipt});
      material.context_kind = context.kind;
      material.context_result_digest = context.result_digest ?? null;
      material.context_envelope_digest = context.result?.directive?.context_envelope_digest ?? null;
      if (!context.ok || context.kind !== "direct") {
        material.disposition = "unavailable";
        material.reason_codes = context.reason_codes ?? context.result?.directive?.reason_codes ?? [];
      }
    }
    // Do not project raw prompt, transcript, envelope text, or arbitrary event
    // metadata into the hook's higher-priority developer context.
    return {exit_code: 0, stdout: output(material), stderr: ""};
  } catch (error) {
    const reason = error.message?.startsWith("hook.") ? error.message : "hook.runtime-unavailable";
    return {exit_code: 1, stdout: {}, stderr: `${reason}\n`};
  }
}
