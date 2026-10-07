import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";

import {runModelDrivenCodingTurn} from "./controller.mjs";
import {runIterativeCodingAgent} from "./iterative-agent.mjs";
import {createCodexAppServerModelTransport} from "./model-transport.mjs";

const REQUEST_CONTEXT_KEY = "cyberalchemy.request-context";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function buildLiveTurnRequestContext({request, mutation_allowlist, iterative_options, entrypoint_selected = false}) {
  const iterative = iterative_options !== undefined && iterative_options !== null;
  const targetRefs = [...new Set(mutation_allowlist ?? [])]
    .sort()
    .map((path) => `ephemeral-fixture:${path}`);
  return Object.freeze({
    schema_version: "are.request-context-hint/v1",
    raw_request: typeof request === "string" && request.trim() ? request : "Propose a bounded patch candidate without applying effects.",
    objective_kind: entrypoint_selected ? "implement" : "research",
    requested_effects: Object.freeze([]),
    target_refs: Object.freeze(targetRefs),
    constraints: Object.freeze(iterative ? ["proposal-only", "outer-runtime-read-only-tools", "no-mutation-during-model-turn"] : ["proposal-only", "no-tool-execution", "no-mutation-during-model-turn"]),
    evidence_refs: Object.freeze(["coding-agent-live-session:fixture-snapshot", ...(entrypoint_selected ? ["coding-agent:user-selected-implement-entrypoint"] : [])]),
    field_postures: Object.freeze({objective_kind: entrypoint_selected ? "explicit" : "inferred"}),
  });
}

function requireClient(client) {
  for (const method of ["initialize", "notify", "startThread", "runTurn", "close"]) {
    if (typeof client?.[method] !== "function") throw new TypeError(`Codex App Server client must provide ${method}().`);
  }
  return client;
}

export function inspectLiveCodexBinding({command = "codex", expected_version, exec_file_sync = execFileSync}) {
  if (typeof expected_version !== "string" || expected_version.length === 0) throw new TypeError("expected_version is required.");
  let observedVersion = "unavailable";
  let error = null;
  try {
    observedVersion = exec_file_sync(command, ["--version"], {encoding: "utf8"}).trim();
  } catch (caught) {
    error = caught.message;
  }
  return Object.freeze({
    ok: observedVersion === expected_version,
    command,
    expected_version,
    observed_version: observedVersion,
    reason_codes: Object.freeze(observedVersion === expected_version ? [] : ["protocol.codex-version-drift"]),
    error,
    authority_effect: "none"
  });
}

export async function runLiveCodingAgentSession(input) {
  const client = requireClient(input?.client);
  if (typeof input.run_id !== "string" || !input.run_id.trim()) throw new TypeError("run_id is required for stable coding-agent request identity.");
  const requestIdentity = sha256(input.run_id);
  let threadId = null;
  let sessionResult;
  let capturedFinalBytes = null;
  try {
    const connection = typeof client.ready === "function" ? await client.ready() : null;
    if (typeof input.on_gateway_connected === "function") await input.on_gateway_connected(connection);
    await client.initialize({
      clientInfo: {name: "cyberalchemy-coding-agent", title: "CyberAlchemy Coding Agent", version: "0.1.0"},
      capabilities: {experimentalApi: true}
    });
    if (connection?.resumed !== true) await client.notify("initialized", {});
    const started = await client.startThread({
      cwd: input.fixture_root,
      ephemeral: input.durable_thread !== true,
      approvalPolicy: "on-request",
      sandbox: "read-only",
      serviceName: "cyberalchemy-coding-agent",
      ...(input.model ? {model: input.model} : {})
    }, {idempotency_key: `coding:thread:${requestIdentity}`});
    threadId = started?.thread?.id ?? null;
    if (!threadId) throw new Error("LIVE_THREAD_ID_MISSING");
    if (typeof input.on_gateway_thread_started === "function") await input.on_gateway_thread_started(threadId);
    const requestContext = buildLiveTurnRequestContext(input);
    const baseModelTransport = createCodexAppServerModelTransport({
      client,
      thread_id: threadId,
      request_key_prefix: `coding:turn:${requestIdentity}`,
      on_before_turn: input.on_gateway_turn_starting,
      on_turn_completed: input.on_gateway_turn_completed,
      turn_options: {
        additionalContext: {
          [REQUEST_CONTEXT_KEY]: {kind: "application", value: JSON.stringify(requestContext)}
        }
      }
    });
    const modelTransport = input.capture_proposal === true ? Object.freeze({
      kind: baseModelTransport.kind,
      transport_id: baseModelTransport.transport_id,
      async generate(request) {
        const generated = await baseModelTransport.generate(request);
        capturedFinalBytes = generated.final_bytes;
        return generated;
      }
    }) : baseModelTransport;
    const codingResult = input.iterative_options
      ? await runIterativeCodingAgent({...input, client: undefined, model: undefined, model_transport: modelTransport, tool_runtime: input.iterative_options.tool_runtime, tool_policy: input.iterative_options.tool_policy, maximum_steps: input.iterative_options.maximum_steps, integrated_context: {repository_map: input.iterative_options.repository_map}, approve: false})
      : await runModelDrivenCodingTurn({...input, client: undefined, model: undefined, model_transport: modelTransport});
    const proposalCandidateBytes = input.iterative_options && codingResult.final_candidate
      ? stable(codingResult.final_candidate)
      : capturedFinalBytes;
    const proposal = input.capture_proposal === true && codingResult.status === "AWAITING_APPROVAL" && proposalCandidateBytes
      ? Object.freeze({
          schema_version: "are.codex-app-server-coding-proposal/v1",
          status: "AWAITING_APPROVAL",
          run_id: codingResult.run_id,
          request: input.request,
          candidate_utf8: proposalCandidateBytes,
          candidate_sha256: sha256(proposalCandidateBytes),
          approval_digest: sha256(proposalCandidateBytes),
          action_id: codingResult.action_id ?? codingResult.candidate_result?.action_id ?? null,
          thread_id: threadId,
          observation_allowlist: Object.freeze([...(input.observation_allowlist ?? [])]),
          mutation_allowlist: Object.freeze([...(input.mutation_allowlist ?? [])]),
          verification_command: Object.freeze([...(input.verification_command ?? [])]),
          authority_effect: "none"
        })
      : null;
    sessionResult = {
      schema_version: "are.coding-agent-live-session/v1",
      status: codingResult.status,
      thread_id: threadId,
      thread_policy: Object.freeze({ephemeral: input.durable_thread !== true, approval_policy: "on-request", sandbox: "read-only"}),
      coding_result: codingResult,
      ...(codingResult.status === "AWAITING_APPROVAL" ? {} : {reason_codes: Object.freeze([...(codingResult.reason_codes ?? [])])}),
      ...(codingResult.model_error ? {error: codingResult.model_error} : {}),
      live_model_invoked: capturedFinalBytes !== null || (codingResult.reasoning_events?.some((event) => event.event_kind === "ModelOutputBound") ?? false),
      ...(proposal ? {proposal} : {}),
      authority_effect: "none",
      claim_limit: "One ephemeral live-model canary session only; no architecture adoption, acceptance, publication, deployment, or external-effect authority."
    };
  } catch (error) {
    sessionResult = {
      schema_version: "are.coding-agent-live-session/v1",
      status: "BLOCK",
      thread_id: threadId,
      reason_codes: Object.freeze(["live.session-failed"]),
      error: error.message,
      authority_effect: "none"
    };
  } finally {
    try {
      await client.close();
    } catch (error) {
      sessionResult = {
        schema_version: "are.coding-agent-live-session/v1",
        status: "BLOCK",
        thread_id: threadId,
        reason_codes: [...new Set([...(sessionResult?.reason_codes ?? []), "live.client-close-failed"])].sort(),
        error: error.message,
        authority_effect: "none"
      };
    }
  }
  return Object.freeze(sessionResult);
}
