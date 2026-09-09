import {constants, closeSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, writeSync} from "node:fs";
import {createHash} from "node:crypto";
import {isAbsolute, resolve, sep} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

import {createReasoningStateLedger} from "../reasoning-state-runtime/index.mjs";
import {createInMemoryRuntimeJournal} from "../runtime-journal/index.mjs";
import {snapshotTree} from "./verifier.mjs";

const verifierPath = fileURLToPath(new URL("./verifier.mjs", import.meta.url));
const CANDIDATE_KEYS = new Set(["schema_version", "operation", "path", "expected_base_tree_sha256", "expected_file_sha256", "utf8", "rationale", "authority_effect"]);

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function result(status, fields = {}) {
  const material = {schema_version: "are.coding-agent-runtime-result/v1", status, ...fields, authority_effect: "none"};
  return Object.freeze({...material, result_digest: sha256(stable(material))});
}

function parseCandidate(raw) {
  let value;
  try { value = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { return {ok: false, reason_codes: ["candidate.json-invalid"]}; }
  const reasons = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return {ok: false, reason_codes: ["candidate.object-required"]};
  if (Object.keys(value).some((key) => !CANDIDATE_KEYS.has(key))) reasons.push("candidate.unknown-field");
  if (value.schema_version !== "are.next-action-candidate/v1") reasons.push("candidate.schema-version-invalid");
  if (value.operation !== "replace-file") reasons.push("candidate.operation-invalid");
  if (typeof value.path !== "string" || value.path.length === 0 || isAbsolute(value.path) || value.path.split(/[\\/]/u).includes("..")) reasons.push("candidate.path-invalid");
  for (const key of ["expected_base_tree_sha256", "expected_file_sha256"]) if (!/^[a-f0-9]{64}$/u.test(value[key] ?? "")) reasons.push(`candidate.${key.replaceAll("_", "-")}-invalid`);
  if (typeof value.utf8 !== "string") reasons.push("candidate.utf8-required");
  if (value.authority_effect !== "none") reasons.push("candidate.authority-effect-invalid");
  return reasons.length > 0 ? {ok: false, reason_codes: reasons.sort()} : {ok: true, value: Object.freeze({...value})};
}

function resolveExistingFile(root, candidatePath) {
  const exactRoot = realpathSync(root);
  const absolute = resolve(exactRoot, candidatePath);
  if (absolute !== exactRoot && !absolute.startsWith(`${exactRoot}${sep}`)) throw new Error("PATH_ESCAPE");
  let current = exactRoot;
  for (const segment of candidatePath.split(/[\\/]/u)) {
    current = resolve(current, segment);
    const status = lstatSync(current);
    if (status.isSymbolicLink()) throw new Error("SYMLINK_FORBIDDEN");
  }
  if (!lstatSync(absolute).isFile()) throw new Error("REGULAR_FILE_REQUIRED");
  return absolute;
}

function replaceExistingNoFollow(path, bytes) {
  const descriptor = openSync(path, constants.O_WRONLY | constants.O_TRUNC | constants.O_NOFOLLOW);
  try { writeSync(descriptor, bytes, null, "utf8"); fsyncSync(descriptor); }
  finally { closeSync(descriptor); }
}

function recorder(runId) {
  const reasoning = createReasoningStateLedger({ledger_id: `are-coding-agent:${runId}`});
  const journal = createInMemoryRuntimeJournal({journal_id: `are-coding-agent:${runId}`});
  const eventDigests = [];
  function append(eventKind, content) {
    const key = `${runId}:${eventKind}:${eventDigests.length + 1}`;
    const state = reasoning.append({event_kind: eventKind, idempotency_key: key, content, provenance_refs: ["CA2-CAP-PRODUCE-VERIFIED-PATCH-CANDIDATE"]});
    const runtime = journal.append({event_kind: eventKind, idempotency_key: key, run_id: runId, content});
    if (!state.ok || !runtime.ok) throw new Error("EVENT_APPEND_FAILED");
    eventDigests.push(state.event.event_digest);
  }
  return {append, snapshot: () => ({reasoning_events: reasoning.snapshot(), runtime_events: journal.snapshot(), event_digests: [...eventDigests]})};
}

export function runCodingAgentSlice(input) {
  const runId = typeof input?.run_id === "string" && input.run_id ? input.run_id : `coding-agent-${Date.now()}`;
  const records = recorder(runId);
  if (input?.model_turn) records.append("ModelOutputBound", input.model_turn);
  const parsed = parseCandidate(input?.raw_candidate);
  records.append("FinalBytesCaptured", {request: input?.request ?? null, candidate_bytes_sha256: sha256(typeof input?.raw_candidate === "string" ? input.raw_candidate : stable(input?.raw_candidate ?? null))});
  if (!parsed.ok) return result("BLOCK", {run_id: runId, reason_codes: parsed.reason_codes, ...records.snapshot()});
  const candidate = parsed.value;
  records.append("CandidateParsed", {candidate_sha256: sha256(stable(candidate)), schema_version: candidate.schema_version});

  let before;
  let target;
  try { before = snapshotTree(input.fixture_root); target = resolveExistingFile(before.root, candidate.path); }
  catch (error) { return result("BLOCK", {run_id: runId, reason_codes: [`candidate.target-invalid:${error.message}`], ...records.snapshot()}); }
  const allowlist = [...new Set(input.mutation_allowlist ?? [])].sort();
  const reasons = [];
  if (!allowlist.includes(candidate.path)) reasons.push("action.path-not-allowlisted");
  if (before.tree_sha256 !== candidate.expected_base_tree_sha256) reasons.push("action.base-tree-drift");
  if (sha256(readFileSync(target)) !== candidate.expected_file_sha256) reasons.push("action.file-drift");
  if (!Array.isArray(input.verification_command) || input.verification_command.length === 0) reasons.push("action.verification-command-required");
  if (reasons.length > 0) return result("BLOCK", {run_id: runId, reason_codes: reasons.sort(), ...records.snapshot()});

  const actionMaterial = {domain: "ca2-action-v1", run_id: runId, base_tree_sha256: before.tree_sha256, operation: candidate.operation, path: candidate.path, utf8_sha256: sha256(candidate.utf8), mutation_allowlist: allowlist};
  const actionId = sha256(stable(actionMaterial));
  records.append("ActionProposed", {action_id: actionId, ...actionMaterial});
  const approved = input.approve === true;
  records.append("EffectAuthorityDecided", {action_id: actionId, decision: approved ? "explicit-fixture-approval" : "withheld"});
  if (!approved) return result("AWAITING_APPROVAL", {run_id: runId, action_id: actionId, reason_codes: ["action.explicit-approval-required"], effect_applied: false, ...records.snapshot()});
  records.append("ApprovalBound", {action_id: actionId, approval_mode: "approve-each", capability_digest: sha256(stable(actionMaterial))});

  const fresh = snapshotTree(before.root);
  if (fresh.tree_sha256 !== before.tree_sha256) return result("BLOCK", {run_id: runId, action_id: actionId, reason_codes: ["action.pre-effect-tree-drift"], effect_applied: false, ...records.snapshot()});
  records.append("ActionStarted", {action_id: actionId, attempt: 1, automatic_retries: 0});
  try { replaceExistingNoFollow(target, candidate.utf8); }
  catch (error) { return result("BLOCK", {run_id: runId, action_id: actionId, reason_codes: [`action.write-failed:${error.code ?? error.message}`], effect_applied: false, ...records.snapshot()}); }
  if (input.fault_injection === "after-effect-before-observation") return result("EFFECT_AMBIGUOUS", {run_id: runId, action_id: actionId, reason_codes: ["action.after-effect-before-observation"], effect_applied: "unknown-to-runtime", automatic_retry_permitted: false, ...records.snapshot()});

  const verifierInput = {fixture_root: before.root, before, expected_base_tree_sha256: before.tree_sha256, mutation_allowlist: allowlist, verification_command: input.verification_command, expected_exit: input.expected_exit ?? 0, verification_timeout_ms: input.verification_timeout_ms ?? 30_000};
  const verified = spawnSync(process.execPath, [verifierPath], {input: JSON.stringify(verifierInput), encoding: "utf8", timeout: (input.verification_timeout_ms ?? 30_000) + 5_000});
  let verification;
  try { verification = JSON.parse(verified.stdout); } catch { verification = {status: "BLOCK", reason_codes: ["verifier.result-unreadable"], authority_effect: "none"}; }
  records.append("ResultAuthenticated", {action_id: actionId, verifier_process_exit: verified.status, verification_digest: verification.verification_digest ?? null});
  records.append("PostimageVerified", {action_id: actionId, verification_status: verification.status, verification_digest: verification.verification_digest ?? null});
  if (verification.status !== "PASS_BOUNDED") return result("BLOCK", {run_id: runId, action_id: actionId, reason_codes: verification.reason_codes ?? ["verifier.blocked"], effect_applied: true, verification, ...records.snapshot()});
  records.append("PatchCandidate", {action_id: actionId, before_tree_sha256: verification.before_tree_sha256, after_tree_sha256: verification.after_tree_sha256, changed_paths: verification.changed_paths});
  return result("PATCH_CANDIDATE", {run_id: runId, action_id: actionId, reason_codes: [], effect_applied: true, automatic_retry_permitted: false, verification, ...records.snapshot()});
}

export {parseCandidate, snapshotTree};
export {openPersistentCodingSession, prepareIntegratedContext, applyIntegratedCorrection} from "./integrated-context.mjs";
export {assessPatchSemantics, decideAgentContinuation, evaluateAgentEffect, bindAgentApproval} from "./semantic-control.mjs";
export {CODING_AGENT_EVENT_SCHEMA, parseAgentEvent} from "./agent-events.mjs";
export {createReadOnlyToolRuntime, decideToolRequest} from "./read-only-tools.mjs";
export {runIterativeCodingAgent} from "./iterative-agent.mjs";
export {createStatelessRecyclingTransport} from "./context-recycling.mjs";
export {createHttpRecyclingTransport} from "./http-recycling-transport.mjs";
export {projectAgentImprovementSignals, runRecommendOnlyEvolutionCycle} from "./evolution-bridge.mjs";
export {buildRepositoryMap} from "./repository-map.mjs";
export {createContainerSandbox, parseSandboxConfig, runSandboxCommand} from "./sandbox.mjs";
export {parsePatchSetCandidate, runTransactionalPatchSet} from "./patch-set-runtime.mjs";
export {createAdvancedReasoningController} from "./advanced-reasoning.mjs";
export {applyCodexAppServerProposal, bindCodexProposal, parseCodexScopeConfig} from "./codex-proposal.mjs";
export {runCodingAgentPreflight} from "./preflight.mjs";
export {createToolSecretBinding, runSecretBoundSandboxCommand} from "./tool-secret-injection.mjs";
export {createNativeSdkModelTransport, createOpenAINativeModelTransport, createAnthropicNativeModelTransport, createGoogleNativeModelTransport} from "./native-provider-transports.mjs";
export {runProviderConformance} from "./provider-conformance.mjs";
