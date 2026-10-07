import {realpathSync} from "node:fs";
import {decide, MAX_INPUT_BYTES} from "./decision-cli.mjs";
import {preparePromptRequest, promptHook} from "./prompt-hook.mjs";
import {digestValue, freezeResult} from "../packages/codex-app-server-wrapper/src/canonical.mjs";

const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const id = value => typeof value === "string" && value.trim().length > 0 && value.length <= 256;
const fail = reason => freezeResult({ok: false, kind: "block", reason_codes: [reason], stdout: {}, authority_effect: "none"});

export function createHookEventSession(options = {}) {
  const turns = new Map();
  const engine = options.decide ?? decide;
  const maxTurns = options.max_turns ?? 32, maxTools = options.max_tools_per_turn ?? 64;
  if (options.enforce_supported_tool_blocks !== undefined
    && typeof options.enforce_supported_tool_blocks !== "boolean") throw new Error("events.invalid-tool-block-mode");
  const enforceSupportedToolBlocks = options.enforce_supported_tool_blocks === true;
  if (!Number.isInteger(maxTurns) || maxTurns < 1 || maxTurns > 128 || !Number.isInteger(maxTools) || maxTools < 1 || maxTools > 128) throw new Error("events.invalid-limits");
  const key = (session, turn) => digestValue({session, turn});
  const result = material => freezeResult({...material, authority_effect: "none", observation_digest: digestValue(material)});

  function observe(event) {
    try {
      if (!record(event) || Buffer.byteLength(JSON.stringify(event)) > MAX_INPUT_BYTES) return fail("events.invalid-input");
      const terminal = event.method === "turn/completed";
      const sessionId = terminal ? event.params?.threadId : event.session_id;
      const turnId = terminal ? event.params?.turn?.id : event.turn_id;
      if (!id(sessionId) || !id(turnId)) return fail("events.identity-required");
      const identity = key(sessionId, turnId), eventDigest = digestValue(event);
      let state = turns.get(identity);
      if (event.hook_event_name === "UserPromptSubmit") {
        if (state && state.prompt_digest !== eventDigest) { state.invalidated = true; return fail("events.prompt-revision-conflict"); }
        const request = preparePromptRequest(event);
        if (state?.invalidated || state?.terminal) return fail("events.turn-unavailable");
        if (!state && turns.size >= maxTurns) return fail("events.turn-limit");
        const hook = promptHook(event, {decide: engine});
        if (hook.exit_code !== 0) return fail("events.prompt-rejected");
        const route = engine("route", request);
        if (!route.ok) return fail("events.route-unavailable");
        if (state) {
          if (digestValue(hook.stdout) !== state.hook_digest || digestValue(route.receipt) !== digestValue(state.request.previous_receipt)) return fail("events.prompt-source-drift");
          return result({...state.prompt_result, replayed: true});
        }
        const bindingDigest = digestValue({identity, cwd: realpathSync(event.cwd), request, receipt: route.receipt});
        const promptResult = {ok: true, kind: route.kind, phase: "prompt", binding_digest: bindingDigest, event_digest: eventDigest, stdout: hook.stdout, replayed: false};
        state = {request: {...request, previous_receipt: route.receipt}, cwd: realpathSync(event.cwd), prompt_digest: eventDigest,
          hook_digest: digestValue(hook.stdout), binding_digest: bindingDigest, prompt_result: promptResult, tools: new Map(), stops: new Map(), terminal: null, invalidated: false};
        turns.set(identity, state);
        return result(promptResult);
      }
      if (!state) return fail("events.prompt-binding-missing");
      if (state.invalidated) return fail("events.turn-invalidated");
      if (terminal) {
        if (state.terminal) return state.terminal.event_digest === eventDigest
          ? result({...state.terminal, replayed: true}) : fail("events.completion-conflict");
        const status = event.params.turn.status;
        if (!["completed", "failed", "interrupted"].includes(status)) return fail("events.terminal-status-required");
        const continuation = engine("continue", {...state.request, continuation: {
          completion: {completion_id: `native-turn:${identity}`, status: status === "interrupted" ? "cancelled" : status,
            continuation_required: false, evidence_refs: [`native-turn-completed:${eventDigest}`, ...state.stops.keys()].sort()}, options: []}});
        // This closes a transport turn, never asserts that the user's goal succeeded.
        state.terminal = {ok: continuation.ok, kind: continuation.kind, phase: "completion", completion_scope: "native-turn-only",
          binding_digest: state.binding_digest, event_digest: eventDigest, decision: continuation, stdout: {}, replayed: false};
        return result(state.terminal);
      }
      if (state.terminal) return fail("events.turn-already-completed");
      if (typeof event.cwd !== "string" || realpathSync(event.cwd) !== state.cwd) return fail("events.cwd-mismatch");
      const common = ["hook_event_name", "session_id", "turn_id", "cwd", "transcript_path", "model", "permission_mode"];
      if (event.hook_event_name === "PreToolUse") {
        if (Object.keys(event).some(name => ![...common, "tool_name", "tool_use_id", "tool_input"].includes(name))) return fail("events.tool-field-unsupported");
        if (!id(event.tool_name) || !id(event.tool_use_id) || !Object.hasOwn(event, "tool_input")) return fail("events.tool-identity-required");
        const previous = state.tools.get(event.tool_use_id);
        if (previous && previous.event_digest !== eventDigest) { state.invalidated = true; return fail("events.tool-revision-conflict"); }
        if (!previous && state.tools.size >= maxTools) return fail("events.tool-limit");
        const decision = engine("effect", {...state.request, effect: {
          method: event.tool_name === "apply_patch" ? "item/fileChange/requestApproval" : "item/commandExecution/requestApproval",
          item_id: event.tool_use_id, proposal: {tool_name: event.tool_name, tool_input: event.tool_input}}});
        const evidence = {schema_version: "are.bound-tool-evidence/v1", binding_digest: state.binding_digest, event_digest: eventDigest,
          kind: decision.kind, result_digest: decision.result_digest ?? null, reason_codes: decision.reason_codes ?? decision.result?.value?.reason_codes ?? [], authority_effect: "none"};
        // A gate is not an approval. Until an exact approval is bound to this
        // proposal, the strict hosted path must not let the host execute it.
        const denied = enforceSupportedToolBlocks && decision.ok
          && (decision.kind === "block" || decision.kind === "gate");
        const hookSpecificOutput = {hookEventName: "PreToolUse", additionalContext:
          (denied
            ? "ARE withheld this exact bound tool proposal. The host's supported tool-hook path must enforce the denial; other tool paths remain unverified.\n"
            : "ARE evaluated this exact proposal against its originating request. This is advisory evidence, not permission. Preserve existing user authorization and host approval rules; unavailable bindings never authorize a fallback.\n")
          + JSON.stringify(evidence)};
        if (denied) {
          hookSpecificOutput.permissionDecision = "deny";
          hookSpecificOutput.permissionDecisionReason = decision.kind === "gate"
            ? "ARE requires a separate decision for this bound tool proposal."
            : "ARE blocked this bound tool proposal.";
        }
        const stdout = {hookSpecificOutput};
        const observed = {ok: decision.ok, kind: decision.kind, phase: "tool", binding_digest: state.binding_digest, event_digest: eventDigest,
          decision, stdout, replayed: Boolean(previous)};
        state.tools.set(event.tool_use_id, {event_digest: eventDigest});
        return result(observed);
      }
      if (event.hook_event_name === "Stop") {
        if (Object.keys(event).some(name => ![...common, "stop_hook_active", "last_assistant_message"].includes(name))) return fail("events.stop-field-unsupported");
        if (typeof event.stop_hook_active !== "boolean" || !(event.last_assistant_message === null || typeof event.last_assistant_message === "string")) return fail("events.stop-payload-invalid");
        if (!state.stops.has(eventDigest) && state.stops.size >= maxTools) return fail("events.stop-limit");
        const replayed = state.stops.has(eventDigest); state.stops.set(eventDigest, true);
        return result({ok: true, kind: "observed", phase: "stop", binding_digest: state.binding_digest, event_digest: eventDigest,
          completion_scope: "none-await-native-terminal", stdout: {}, replayed});
      }
      return fail("events.unsupported-event");
    } catch (error) { return fail(error.message?.startsWith("hook.") ? error.message : "events.invalid-or-unavailable"); }
  }

  return Object.freeze({observe, clear: () => turns.clear(), size: () => turns.size,
    releaseCompleted: (sessionId, turnId) => {
      const identity = key(sessionId, turnId);
      return turns.get(identity)?.terminal ? turns.delete(identity) : false;
    }});
}
