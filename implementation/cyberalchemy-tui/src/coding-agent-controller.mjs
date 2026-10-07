import {writeFileSync} from "node:fs";
import {resolve} from "node:path";

import {proposeConfiguredIterativeCodingAgent} from "../../agent-reasoning-engine/packages/coding-agent-runtime/configured-runner.mjs";
import {applyConfiguredCodingAgentProposal} from "../../agent-reasoning-engine/packages/coding-agent-runtime/configured-runner.mjs";
import {applyCodexAppServerProposal} from "../../agent-reasoning-engine/packages/coding-agent-runtime/codex-proposal.mjs";
import {createGatewayClientRecoveryState} from "../../agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs";
import {runCodexAppServerProposal} from "./codex-coding-agent.mjs";
import {observePendingGatewayTurn} from "./pending-turn-reconciliation.mjs";

function immutableSnapshot(state) {
  return Object.freeze({...state, transcript: Object.freeze([...state.transcript]), timeline: Object.freeze([...(state.timeline ?? [])])});
}

function causalReasons(result) {
  const candidates = [result?.reason_codes, result?.coding_result?.reason_codes, result?.live_session?.coding_result?.reason_codes];
  const reasons = candidates.flatMap((value) => Array.isArray(value) ? value : []);
  if (reasons.length > 0) return [...new Set(reasons)].sort();
  if (typeof result?.error === "string" && result.error) return [result.error];
  if (typeof result?.coding_result?.model_error === "string" && result.coding_result.model_error) return [result.coding_result.model_error];
  return ["reason-receipt-missing"];
}

function diagnosticProjection(result) {
  if (!result || typeof result !== "object") return null;
  return Object.freeze({
    schema_version: result.schema_version ?? null,
    status: result.status ?? null,
    reason_codes: Array.isArray(result.reason_codes) ? result.reason_codes : causalReasons(result),
    result_digest: result.result_digest ?? result.application?.result_digest ?? null,
    approval_digest: result.approval_digest ?? null,
    candidate_digest: result.candidate_digest ?? result.application?.candidate_digest ?? null,
    changed_paths: result.changed_paths ?? result.application?.changed_paths ?? result.application?.verification?.changed_paths ?? [],
    authority_effect: "none",
  });
}

function proposalSummary(result, outputPath) {
  if (result.status === "AWAITING_APPROVAL") {
    let candidatePaths = [];
    try {
      const candidate = JSON.parse(result.candidate_utf8 ?? "null");
      candidatePaths = Array.isArray(candidate?.changes) ? candidate.changes.map((change) => change.path) : candidate?.path ? [candidate.path] : [];
    } catch {}
    const changes = result.generation_result?.final_candidate?.changes?.map((change) => change.path) ?? candidatePaths;
    const pathSummary = changes.length > 0 ? `\nPaths: ${changes.join(", ")}` : "";
    const outputSummary = outputPath ? `\nSaved: ${resolve(outputPath)}` : "\nNot saved: relaunch with --proposal-output <file> to persist it.";
    return `Proposal ready. No files were changed.\nApproval digest: ${result.approval_digest}${pathSummary}${outputSummary}\nReview the candidate, then activate Confirm & apply or type /approve ${result.approval_digest}. Type /reject to cancel.`;
  }
  return `${result.status ?? "BLOCK"}: ${causalReasons(result).join(", ")}. No files were changed.`;
}

export function createCodingAgentController(options = {}) {
  const listeners = new Set();
  const runProposal = options.runProposal ?? proposeConfiguredIterativeCodingAgent;
  const runCodexProposal = options.runCodexProposal ?? runCodexAppServerProposal;
  const observePendingTurn = options.observePendingTurn ?? observePendingGatewayTurn;
  const applyCodexProposal = options.applyCodexProposal ?? applyCodexAppServerProposal;
  const applyConfiguredProposal = options.applyConfiguredProposal ?? applyConfiguredCodingAgentProposal;
  let pendingProposal = null;
  let activeClient = null;
  let gatewayRecovery = null;
  let gatewayRecoveryError = null;
  if (options.gatewayRecoveryPath) {
    try { gatewayRecovery = createGatewayClientRecoveryState({path: options.gatewayRecoveryPath, consumer_id: "codex:coding-proposal"}); }
    catch (error) { gatewayRecoveryError = error; }
  }
  let gatewayResumeToken = gatewayRecovery?.resume_token() ?? null;
  let activeTurnIntent = null;
  let reconciling = false;
  const unresolvedTurnAtStartup = gatewayRecovery?.has_unresolved_turn_intent() ?? false;
  let turnNumber = 0;
  let state = immutableSnapshot({
    phase: unresolvedTurnAtStartup ? "uncertain" : "idle",
    prompt: unresolvedTurnAtStartup
      ? "Previous model turn outcome is uncertain. New proposals are blocked until host history is reconciled."
      : "Describe the bounded repository change you want the coding agent to propose.",
    transcript: [],
    timeline: [],
    preflight: options.preflightResult ?? null,
    diagnostics: diagnosticProjection(options.preflightResult),
    result: null,
    error: unresolvedTurnAtStartup ? "coding-agent.gateway-turn-outcome-unresolved" : null,
    reconciliation: null,
    lastTurnStatus: null,
  });

  function publish(patch) {
    state = immutableSnapshot({...state, ...patch});
    for (const listener of listeners) listener(state);
  }

  function append(role, text) {
    const clean = String(text ?? "").trim();
    if (!clean) return;
    publish({transcript: [...state.transcript, Object.freeze({role, text: clean})]});
  }

  function mark(phase, detail) {
    publish({timeline: [...state.timeline, Object.freeze({phase, detail, at: new Date().toISOString(), authority_effect: "none"})]});
  }

  function proposalOutputForTurn(number) {
    if (options.proposalOutput) return resolve(options.proposalOutput);
    if (!options.proposalDirectory) return null;
    return resolve(options.proposalDirectory, `proposal-${String(number).padStart(4, "0")}.json`);
  }

  function settle(phase, prompt, patch = {}) {
    if (gatewayRecovery?.has_unresolved_turn_intent()) {
      publish({phase: "uncertain", prompt: "Model turn outcome is uncertain. New proposals are blocked until host history is reconciled.",
        lastTurnStatus: "uncertain", ...patch, error: "coding-agent.gateway-turn-outcome-unresolved"});
      return;
    }
    if (options.chatMode) {
      append("agent", "What would you like to do next?");
      publish({phase: "idle", prompt: "Type your next message.", lastTurnStatus: phase, ...patch});
      return;
    }
    publish({phase, prompt, lastTurnStatus: phase, ...patch});
  }

  async function start(request) {
    const text = String(request ?? "").trim();
    if (!text || state.phase !== "idle") return false;
    turnNumber += 1;
    pendingProposal = null;
    append("human", text);
    if (options.preflightResult) {
      append("agent", `Preflight ${options.preflightResult.status}: ${options.preflightResult.checks.filter((entry) => entry.status === "PASS").length}/${options.preflightResult.checks.length} checks passed or remained explicitly bounded.`);
      mark("preflight", options.preflightResult.status);
    }
    publish({phase: "working", prompt: "Implement is mapping the repository and evaluating candidate steps…", error: null});
    mark("model-and-tools", "started");
    try {
      const codexMode = options.provider === "codex-app-server";
      if (codexMode && gatewayRecoveryError) throw gatewayRecoveryError;
      if (!options.config || !options.repositoryRoot || (!codexMode && !options.sessionPath)) {
        throw new Error(codexMode
          ? "Codex scope configuration and repository root are required"
          : "coding-agent configuration, repository root, and session path are required");
      }
      const runId = options.runId ?? `coding-agent-tui-${Date.now()}-${turnNumber}`;
      const common = {
        config: options.config,
        repositoryRoot: resolve(options.repositoryRoot),
        repository_root: resolve(options.repositoryRoot),
        request: text,
        runId,
        run_id: runId,
      };
      const result = codexMode ? await runCodexProposal({
        ...common,
        codexCommand: options.codexCommand,
        codexProfile: options.codexProfile,
        wrapperPath: options.wrapperPath,
        gatewaySocket: options.gatewaySocket,
        durableProposalThread: options.durableProposalThread === true,
        gatewayResumeToken,
        onGatewayContinuity: (token) => { gatewayResumeToken = token; },
        onGatewayConnected: (receipt) => {
          gatewayRecovery?.bind_gateway(receipt);
          gatewayResumeToken = receipt?.continuity?.resume_token ?? null;
          if (!gatewayResumeToken) throw new Error("coding-agent.gateway-resume-token-missing");
          if (gatewayRecovery?.has_unresolved_turn_intent()) throw new Error("coding-agent.gateway-turn-outcome-unresolved");
        },
        onGatewayThreadStarted: (threadId) => gatewayRecovery?.record_thread(threadId),
        onGatewayTurnStarting: ({thread_id, request_key, prompt_sha256}) => {
          if (!gatewayRecovery) return;
          const pending = gatewayRecovery.pending_turn_intent();
          if (pending) throw new Error("coding-agent.gateway-turn-outcome-unresolved");
          activeTurnIntent = Object.freeze({schema_version: "are.codex-client-pending-turn/v1", thread_id,
            request_key, text_digest: prompt_sha256, created_at: new Date().toISOString()});
          gatewayRecovery.record_turn_intent(activeTurnIntent);
        },
        onGatewayTurnCompleted: ({turn_id}) => {
          if (!gatewayRecovery) return;
          gatewayRecovery.settle_turn_intent(activeTurnIntent, turn_id);
          activeTurnIntent = null;
        },
        transportMode: options.transportMode,
        authorityRepositoryRoot: options.authorityRepositoryRoot,
        model: options.model,
        onClient: (client) => { activeClient = client; },
      }) : await runProposal({
        ...common,
        session_path: resolve(options.sessionPath),
        resume: options.resume === true || (options.chatMode === true && turnNumber > 1),
        maximum_steps: options.maximumSteps ?? null,
        cancel_file: options.cancelFile ? resolve(options.cancelFile) : null,
        tool_policy: options.toolPolicy ?? null,
        context_config: options.contextConfig ?? null,
      });
      const proposalOutput = proposalOutputForTurn(turnNumber);
      if (result.status === "AWAITING_APPROVAL" && proposalOutput) {
        writeFileSync(proposalOutput, `${JSON.stringify(result, null, 2)}\n`, {encoding: "utf8", flag: "wx", mode: 0o600});
      }
      append("agent", proposalSummary(result, result.status === "AWAITING_APPROVAL" ? proposalOutput : null));
      mark(result.status === "AWAITING_APPROVAL" ? "proposal" : "terminal", result.status);
      pendingProposal = result.status === "AWAITING_APPROVAL" ? result : null;
      if (result.status === "AWAITING_APPROVAL") {
        publish({phase: "review", prompt: "Review required. Confirm the exact pending digest or reject it.", result, diagnostics: diagnosticProjection(result), error: null});
      } else {
        settle(result.status === "CANCELLED" ? "stopped" : "error", "Implement stopped without changing repository files.", {
          result,
          diagnostics: diagnosticProjection(result),
          error: result.status === "BLOCK" ? causalReasons(result).join(", ") : null,
        });
      }
    } catch (error) {
      append("error", error.message);
      settle("error", "Implement stopped without changing repository files.", {error: error.message});
    }
    return true;
  }

  async function decide(value, source = "command") {
    const text = String(value ?? "").trim();
    if (text === "/reject") {
      append("human", text);
      pendingProposal = null;
      settle("stopped", "Proposal rejected. No files were changed.", {result: null, error: null});
      return true;
    }
    const match = /^\/approve\s+([a-f0-9]{64})$/u.exec(text);
    if (!match) {
      append("error", "Approval requires /approve followed by the exact 64-character digest, or /reject.");
      return false;
    }
    append("human", source === "button" ? "Confirmed the exact pending digest with Confirm & apply." : "/approve <exact digest>");
    if (!pendingProposal || match[1] !== pendingProposal.approval_digest) {
      append("error", "Approval digest does not match the pending proposal.");
      return false;
    }
    publish({phase: "applying", prompt: "Applying the exact approved candidate and verifying it in the configured sandbox…", error: null});
    mark("apply-and-verify", "started");
    await new Promise((resolveValue) => setImmediate(resolveValue));
    try {
      const codexMode = options.provider === "codex-app-server";
      const applied = codexMode
        ? applyCodexProposal({proposal: pendingProposal, repository_root: resolve(options.repositoryRoot), scope_config: options.config, codex_profile_path: options.codexProfile, approval_digest: match[1], sandbox_runner: options.sandboxRunner})
        : applyConfiguredProposal({config: options.config, repository_root: resolve(options.repositoryRoot), proposal: pendingProposal, approval_digest: match[1], sandbox_runner: options.sandboxRunner});
      pendingProposal = null;
      const success = applied.status === "PATCH_CANDIDATE";
      const paths = applied.application?.changed_paths ?? applied.application?.verification?.changed_paths ?? applied.changed_paths ?? applied.verification?.changed_paths ?? [];
      append("agent", success ? `Approved candidate applied and verified.\nChanged paths: ${paths.join(", ") || "none"}\nResult digest: ${applied.result_digest}` : `${applied.status}: ${(applied.reason_codes ?? []).join(", ")}. Automatic retry is forbidden.`);
      mark("terminal", applied.status);
      settle(success ? "completed" : "error", success ? "Verified patch candidate ready." : "Application stopped.", {result: applied, error: success ? null : (applied.reason_codes ?? []).join(", ")});
      publish({diagnostics: diagnosticProjection(applied)});
    } catch (error) {
      pendingProposal = null;
      append("error", error.message);
      settle("error", "Application stopped.", {error: error.message});
    }
    return true;
  }

  async function selfTest() {
    if (state.phase !== "idle" || typeof options.runSelfTest !== "function") return false;
    publish({phase: "self-testing", prompt: "Running the disposable product canary…", error: null});
    mark("self-test", "started");
    try {
      const receipt = await options.runSelfTest();
      const pass = receipt.status === "PASS_BOUNDED";
      append("agent", pass
        ? `Product self-test passed.\nCandidate digest: ${receipt.candidate_digest}\nExternal repository effects: ${receipt.external_repository_effects}`
        : `Product self-test ${receipt.status}: ${(receipt.reason_codes ?? []).join(", ")}.`);
      mark("self-test", receipt.status);
      settle(pass ? "completed" : "error", pass ? "Disposable product self-test passed." : "Product self-test blocked.", {result: receipt, error: pass ? null : (receipt.reason_codes ?? []).join(", ")});
      publish({diagnostics: diagnosticProjection(receipt)});
    } catch (error) {
      append("error", error.message);
      mark("self-test", "BLOCK");
      settle("error", "Product self-test blocked.", {error: error.message});
    }
    return true;
  }

  async function reconcilePendingTurn() {
    if (state.phase !== "uncertain" || reconciling || !gatewayRecovery) return false;
    reconciling = true;
    publish({reconciliation: Object.freeze({status: "checking", authority_effect: "none"}),
      prompt: "Checking owned host history. New proposals remain blocked."});
    try {
      const observation = await observePendingTurn({recoveryState: gatewayRecovery, gatewaySocket: options.gatewaySocket,
        connectionToken: options.connectionToken, onClient: (client) => { activeClient = client; }});
      const detail = observation.disposition === "host-active" ? "The matching host turn is still active."
        : observation.disposition === "host-terminal" ? `The matching host turn is ${observation.turn_status}. Its proposal has not been recovered.`
          : observation.disposition === "host-active-unbound" ? "The owned host thread is active, but ephemeral history cannot bind the pending turn."
            : observation.disposition === "host-idle-unbound" ? "The owned host thread is idle, but ephemeral history cannot bind the pending turn."
          : "The pending turn could not be matched to host history.";
      append("agent", `Read-only recovery check: ${detail} New proposals remain blocked.`);
      publish({reconciliation: observation,
        prompt: "Host history observed; the pending model result is not yet recovered. Ctrl+R rechecks."});
    } catch {
      const observation = Object.freeze({schema_version: "are.tui-pending-turn-observation/v1", disposition: "unverified",
        reason_codes: Object.freeze(["history.read-unavailable"]), turn_status: null, turn_id_digest: null, authority_effect: "none"});
      append("agent", "Read-only recovery check could not reach or verify host history. New proposals remain blocked.");
      publish({reconciliation: observation,
        prompt: "Host history unavailable; new proposals remain blocked. Ctrl+R rechecks."});
    } finally { reconciling = false; }
    return true;
  }

  return Object.freeze({
    start,
    reconcilePendingTurn,
    submit(value) {
      if (state.phase === "idle") { void start(value); return String(value ?? "").trim().length > 0; }
      if (state.phase === "review") { void decide(value); return true; }
      return false;
    },
    confirmPending() {
      if (state.phase !== "review" || !pendingProposal?.approval_digest) return false;
      void decide(`/approve ${pendingProposal.approval_digest}`, "button");
      return true;
    },
    selfTest,
    async close() {
      const client = activeClient;
      activeClient = null;
      gatewayResumeToken = null;
      try { await client?.close?.(); }
      finally { gatewayRecovery?.close(); }
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    snapshot: () => state,
  });
}
