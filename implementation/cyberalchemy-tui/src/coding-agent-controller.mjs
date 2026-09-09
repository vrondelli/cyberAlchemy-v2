import {writeFileSync} from "node:fs";
import {resolve} from "node:path";

import {proposeConfiguredIterativeCodingAgent} from "../../agent-reasoning-engine/packages/coding-agent-runtime/configured-runner.mjs";
import {applyConfiguredCodingAgentProposal} from "../../agent-reasoning-engine/packages/coding-agent-runtime/configured-runner.mjs";
import {applyCodexAppServerProposal} from "../../agent-reasoning-engine/packages/coding-agent-runtime/codex-proposal.mjs";
import {runCodexAppServerProposal} from "./codex-coding-agent.mjs";

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
  const applyCodexProposal = options.applyCodexProposal ?? applyCodexAppServerProposal;
  const applyConfiguredProposal = options.applyConfiguredProposal ?? applyConfiguredCodingAgentProposal;
  let pendingProposal = null;
  let activeClient = null;
  let turnNumber = 0;
  let state = immutableSnapshot({
    phase: "idle",
    prompt: "Describe the bounded repository change you want the coding agent to propose.",
    transcript: [],
    timeline: [],
    preflight: options.preflightResult ?? null,
    diagnostics: diagnosticProjection(options.preflightResult),
    result: null,
    error: null,
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

  return Object.freeze({
    start,
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
      await client?.close?.();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    snapshot: () => state,
  });
}
