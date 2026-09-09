import {createHash, timingSafeEqual} from "node:crypto";
import {existsSync} from "node:fs";
import {resolve, sep} from "node:path";

import {runModelDrivenCodingTurn} from "./controller.mjs";
import {runCodingAgentSlice} from "./index.mjs";
import {createConfiguredModelTransport, parseCodingAgentRunConfig, parseIterativeToolPolicy, parseRepositoryMapConfig} from "./runtime-config.mjs";
import {loadCapabilityProjection, prepareCapabilityAwareness, verifyCapabilityContext} from "./capability-awareness.mjs";
import {runIterativeCodingAgent} from "./iterative-agent.mjs";
import {createReadOnlyToolRuntime} from "./read-only-tools.mjs";
import {buildRepositoryMap} from "./repository-map.mjs";
import {createContainerSandbox} from "./sandbox.mjs";
import {openPersistentCodingSession} from "./integrated-context.mjs";
import {createAdvancedReasoningController} from "./advanced-reasoning.mjs";
import {runTransactionalPatchSet} from "./patch-set-runtime.mjs";

const PROPOSAL_SCHEMA_VERSION = "are.configured-coding-agent-proposal/v1";
const SHA256 = /^[a-f0-9]{64}$/u;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function exactDigest(value, field) {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${field} is invalid.`);
  return value;
}

function sameDigest(left, right) {
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function commonInputs({repository_root, request}) {
  if (typeof repository_root !== "string" || repository_root.length === 0) throw new TypeError("repository_root is required.");
  if (typeof request !== "string" || request.length === 0) throw new TypeError("request is required.");
}

export async function proposeConfiguredCodingAgent({
  config,
  repository_root,
  request,
  run_id = `coding-agent-${Date.now()}`,
  env = process.env,
  fetch_impl = globalThis.fetch,
  injected_providers = []
}) {
  commonInputs({repository_root, request});
  const configured = createConfiguredModelTransport({config, env, fetch_impl, injected_providers});
  const capabilityContext = configured.config.capability_awareness
    ? await prepareCapabilityAwareness({repository_root, request, run_id, config: configured.config.capability_awareness})
    : null;
  if (capabilityContext?.status === "BLOCK") {
    return Object.freeze({
      schema_version: PROPOSAL_SCHEMA_VERSION,
      status: "BLOCK",
      run_id,
      reason_codes: capabilityContext.reason_codes,
      capability_context: capabilityContext,
      authority_effect: "none"
    });
  }
  let capturedFinalBytes = null;
  const capturingTransport = Object.freeze({
    kind: configured.model_transport.kind,
    transport_id: configured.model_transport.transport_id,
    async generate(input) {
      const generated = await configured.model_transport.generate(input);
      capturedFinalBytes = generated.final_bytes;
      return generated;
    }
  });
  const generationResult = await runModelDrivenCodingTurn({
    run_id,
    request,
    fixture_root: repository_root,
    observation_allowlist: configured.config.observation_allowlist,
    mutation_allowlist: configured.config.mutation_allowlist,
    verification_command: configured.config.verification_command,
    max_context_bytes: configured.config.max_context_bytes,
    model_transport: capturingTransport,
    capability_context: capabilityContext,
    approve: false
  });
  if (generationResult.status !== "AWAITING_APPROVAL" || typeof capturedFinalBytes !== "string" || capturedFinalBytes.length === 0) {
    return Object.freeze({
      schema_version: PROPOSAL_SCHEMA_VERSION,
      status: "BLOCK",
      run_id,
      reason_codes: generationResult.reason_codes ?? ["proposal.candidate-unavailable"],
      generation_result: generationResult,
      authority_effect: "none"
    });
  }
  const candidateDigest = sha256(capturedFinalBytes);
  return Object.freeze({
    schema_version: PROPOSAL_SCHEMA_VERSION,
    status: "AWAITING_APPROVAL",
    run_id,
    request,
    candidate_utf8: capturedFinalBytes,
    candidate_sha256: candidateDigest,
    approval_digest: candidateDigest,
    config_sha256: sha256(stable(configured.config)),
    capability_context: capabilityContext,
    capability_context_digest: capabilityContext?.context_digest ?? null,
    capability_source_set_digest: capabilityContext?.source_set_digest ?? null,
    generation_result: generationResult,
    authority_effect: "none"
  });
}

function normalizeIterativeCandidate(candidate) {
  if (candidate?.schema_version === "are.patch-set-candidate/v1") return candidate;
  if (candidate?.schema_version !== "are.next-action-candidate/v1") throw new TypeError("Iterative candidate schema is unsupported.");
  return Object.freeze({schema_version: "are.patch-set-candidate/v1", expected_base_tree_sha256: candidate.expected_base_tree_sha256, changes: [Object.freeze({operation: candidate.operation, path: candidate.path, expected_file_sha256: candidate.expected_file_sha256, utf8: candidate.utf8})], rationale: candidate.rationale ?? null, authority_effect: "none"});
}

function restoredHistory(session) {
  const observations = new Map(session.snapshot().filter((event) => event.event_kind === "IterativeToolObservation").map((event) => [event.content.event_id, event.content.observation]));
  return session.snapshot().filter((event) => event.event_kind === "IterativeAgentHistory").map((event) => {
    const entry = structuredClone(event.content);
    const observation = observations.get(entry.event?.event_id);
    if (observation) entry.observation = observation;
    return entry;
  });
}

export async function proposeConfiguredIterativeCodingAgent({
  config,
  repository_root,
  request,
  run_id = `iterative-coding-agent-${Date.now()}`,
  maximum_steps = null,
  tool_policy = null,
  session_path = null,
  resume = null,
  cancel_file = null,
  context_config = null,
  env = process.env,
  fetch_impl = globalThis.fetch,
  injected_providers = [],
  sandbox_runner = undefined,
} = {}) {
  commonInputs({repository_root, request});
  const configured = createConfiguredModelTransport({config, env, fetch_impl, injected_providers});
  const iterative = configured.config.iterative ?? {maximum_steps: 8, tool_policy: {allow: ["list-files", "read-file", "search-text", "repository-map"], ask: [], deny: []}, session_path: null, resume: false};
  const selectedSessionPath = session_path ?? iterative.session_path;
  const selectedResume = resume ?? iterative.resume;
  if (typeof selectedSessionPath !== "string" || !selectedSessionPath) return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, status: "BLOCK", run_id, reason_codes: ["session.path-required"], authority_effect: "none"});
  const exactRoot = resolve(repository_root);
  const exactSessionPath = resolve(selectedSessionPath);
  if (exactSessionPath === exactRoot || exactSessionPath.startsWith(`${exactRoot}${sep}`)) return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, status: "BLOCK", run_id, reason_codes: ["session.path-inside-repository"], authority_effect: "none"});
  if (typeof cancel_file === "string" && cancel_file) {
    const exactCancelPath = resolve(cancel_file);
    if (exactCancelPath === exactRoot || exactCancelPath.startsWith(`${exactRoot}${sep}`)) return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, status: "BLOCK", run_id, reason_codes: ["cancellation.path-inside-repository"], authority_effect: "none"});
  }
  if (selectedResume === true && !existsSync(selectedSessionPath)) return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, status: "BLOCK", run_id, reason_codes: ["session.resume-source-missing"], authority_effect: "none"});
  if (selectedResume !== true && existsSync(selectedSessionPath)) return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, status: "BLOCK", run_id, reason_codes: ["session.existing-log-requires-resume"], authority_effect: "none"});

  let mapConfig;
  let selectedToolPolicy;
  try {
    mapConfig = context_config === null ? configured.config.repository_map : parseRepositoryMapConfig(context_config);
    selectedToolPolicy = tool_policy === null ? iterative.tool_policy : parseIterativeToolPolicy(tool_policy);
  } catch (error) {
    return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, status: "BLOCK", run_id, reason_codes: ["runtime.iterative-configuration-invalid"], error: error.message, authority_effect: "none"});
  }
  let repositoryMap;
  let sandbox = null;
  try {
    repositoryMap = buildRepositoryMap({repository_root, paths: configured.config.observation_allowlist, ...mapConfig});
    if (configured.config.sandbox) sandbox = createContainerSandbox({config: configured.config.sandbox, repository_root, ...(sandbox_runner ? {runner: sandbox_runner} : {})});
  } catch (error) {
    return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, status: "BLOCK", run_id, reason_codes: ["runtime.context-or-sandbox-invalid"], error: error.message, authority_effect: "none"});
  }
  const opened = openPersistentCodingSession({log_path: exactSessionPath, ledger_id: `coding-agent:${sha256(repository_root)}`});
  if (!opened.ok) return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, status: "BLOCK", run_id, reason_codes: opened.reason_codes, authority_effect: "none"});
  const session = opened.session;
  try {
    const capabilityContext = configured.config.capability_awareness ? await prepareCapabilityAwareness({repository_root, request, run_id, config: configured.config.capability_awareness}) : null;
    if (capabilityContext?.status === "BLOCK") return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, status: "BLOCK", run_id, reason_codes: capabilityContext.reason_codes, capability_context: capabilityContext, authority_effect: "none"});
    const advanced = createAdvancedReasoningController({session, maximum_event_count: configured.config.advanced_reasoning.maximum_event_count});
    const currentSources = repositoryMap.files.map((file) => ({source_identity: file.path, source_digest: file.sha256}));
    const reusable = advanced.selectCounterevidence({claim_ref: `coding-agent-request:${sha256(request)}`, current_sources: currentSources});
    const toolRuntime = createReadOnlyToolRuntime({repository_root, observation_allowlist: configured.config.observation_allowlist, repository_map: repositoryMap, sandbox});
    const generation = await runIterativeCodingAgent({
      run_id,
      request,
      request_ref: `request:${sha256(request)}`,
      fixture_root: repository_root,
      mutation_allowlist: configured.config.mutation_allowlist,
      verification_command: configured.config.verification_command,
      model_transport: configured.model_transport,
      tool_runtime: toolRuntime,
      tool_policy: selectedToolPolicy,
      maximum_steps: maximum_steps ?? iterative.maximum_steps,
      initial_history: selectedResume ? restoredHistory(session) : [],
      session,
      advanced_reasoning: advanced,
      integrated_context: {repository_map: repositoryMap, reusable_counterevidence: reusable.ok ? reusable.value : null, capability_context: capabilityContext},
      is_cancelled: () => typeof cancel_file === "string" && cancel_file.length > 0 && existsSync(cancel_file),
      approve: false,
    });
    if (generation.status !== "AWAITING_APPROVAL" || !generation.final_candidate) return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, status: generation.status === "CANCELLED" ? "CANCELLED" : "BLOCK", run_id, reason_codes: generation.reason_codes ?? ["proposal.candidate-unavailable"], generation_result: generation, repository_map_digest: repositoryMap.map_digest, session_path: exactSessionPath, authority_effect: "none"});
    const candidate = normalizeIterativeCandidate(generation.final_candidate);
    const candidateUtf8 = stable(candidate);
    const candidateDigest = sha256(candidateUtf8);
    const replay = advanced.replayFixture();
    const portable = advanced.exportPortable();
    return Object.freeze({schema_version: PROPOSAL_SCHEMA_VERSION, proposal_mode: "iterative", status: "AWAITING_APPROVAL", run_id, request, candidate_utf8: candidateUtf8, candidate_sha256: candidateDigest, approval_digest: candidateDigest, config_sha256: sha256(stable(configured.config)), capability_context: capabilityContext, capability_context_digest: capabilityContext?.context_digest ?? null, capability_source_set_digest: capabilityContext?.source_set_digest ?? null, repository_map_digest: repositoryMap.map_digest, reasoning_replay_fixture: replay.ok ? replay.fixture : null, portable_reasoning_epoch: portable.ok ? portable.value : null, session_path: exactSessionPath, generation_result: generation, authority_effect: "none"});
  } finally { session.close(); }
}

export function applyConfiguredCodingAgentProposal({config, repository_root, proposal, approval_digest, sandbox_runner = undefined}) {
  if (typeof repository_root !== "string" || repository_root.length === 0) throw new TypeError("repository_root is required.");
  if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) throw new TypeError("proposal is invalid.");
  if (proposal.schema_version !== PROPOSAL_SCHEMA_VERSION || proposal.status !== "AWAITING_APPROVAL") throw new TypeError("proposal is invalid.");
  if (typeof proposal.request !== "string" || proposal.request.length === 0 || typeof proposal.candidate_utf8 !== "string" || proposal.candidate_utf8.length === 0) throw new TypeError("proposal is invalid.");
  const candidateDigest = exactDigest(proposal.candidate_sha256, "proposal candidate digest");
  const approvedDigest = exactDigest(approval_digest, "approval digest");
  const proposalConfigDigest = exactDigest(proposal.config_sha256, "proposal config digest");
  if (!sameDigest(candidateDigest, sha256(proposal.candidate_utf8)) || !sameDigest(candidateDigest, approvedDigest)) throw new TypeError("proposal approval does not match.");
  const parsed = parseCodingAgentRunConfig(config);
  if (!sameDigest(proposalConfigDigest, sha256(stable(parsed)))) throw new TypeError("proposal configuration changed.");
  if (parsed.capability_awareness) {
    if (!verifyCapabilityContext(proposal.capability_context)) throw new TypeError("proposal capability context is invalid.");
    const expectedContext = exactDigest(proposal.capability_context_digest, "proposal capability context digest");
    if (!sameDigest(expectedContext, proposal.capability_context.context_digest)) throw new TypeError("proposal capability context changed.");
    const expectedSourceSet = exactDigest(proposal.capability_source_set_digest, "proposal capability source-set digest");
    if (!sameDigest(expectedSourceSet, exactDigest(proposal.capability_context.source_set_digest, "proposal context source-set digest"))) throw new TypeError("proposal capability context changed.");
    const current = loadCapabilityProjection({repository_root, config: parsed.capability_awareness});
    if (!sameDigest(expectedSourceSet, current.source_set_digest)) throw new TypeError("proposal capability sources changed.");
  } else if (proposal.capability_context !== null || proposal.capability_context_digest !== null || proposal.capability_source_set_digest !== null) {
    throw new TypeError("proposal capability configuration changed.");
  }
  if (proposal.proposal_mode === "iterative") {
    let sandbox = null;
    try { if (parsed.sandbox) sandbox = createContainerSandbox({config: parsed.sandbox, repository_root, ...(sandbox_runner ? {runner: sandbox_runner} : {})}); } catch { sandbox = null; }
    return runTransactionalPatchSet({run_id: `${proposal.run_id}:apply`, fixture_root: repository_root, raw_candidate: proposal.candidate_utf8, mutation_allowlist: parsed.mutation_allowlist, verification_command: parsed.verification_command, verification_sandbox: sandbox, approve: true, approval_digest: candidateDigest});
  }
  return runCodingAgentSlice({
    run_id: `${proposal.run_id}:apply`,
    request: proposal.request,
    fixture_root: repository_root,
    raw_candidate: proposal.candidate_utf8,
    mutation_allowlist: parsed.mutation_allowlist,
    verification_command: parsed.verification_command,
    approve: true,
    model_turn: Object.freeze({
      schema_version: "are.configured-proposal-binding/v1",
      candidate_sha256: candidateDigest,
      config_sha256: proposalConfigDigest,
      original_run_id: proposal.run_id,
      capability_context_digest: proposal.capability_context_digest ?? null,
      capability_source_set_digest: proposal.capability_source_set_digest ?? null,
      authority_effect: "none"
    })
  });
}

export {PROPOSAL_SCHEMA_VERSION};
