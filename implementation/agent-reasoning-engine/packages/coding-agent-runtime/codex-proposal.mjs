import {createHash, timingSafeEqual} from "node:crypto";
import {readFileSync, realpathSync} from "node:fs";

import {runTransactionalPatchSet, parsePatchSetCandidate} from "./patch-set-runtime.mjs";
import {parseIterativeToolPolicy, parseRepositoryMapConfig} from "./runtime-config.mjs";
import {createContainerSandbox, parseSandboxConfig} from "./sandbox.mjs";

const SHA = /^[a-f0-9]{64}$/u;
const SCOPE_KEYS = new Set(["schema_version", "observation_allowlist", "mutation_allowlist", "verification_command", "max_context_bytes", "maximum_steps", "tool_policy", "repository_map", "sandbox"]);
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function sameDigest(a, b) { return SHA.test(a ?? "") && SHA.test(b ?? "") && timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex")); }
function strings(value, field) { if (!Array.isArray(value) || value.length < 1 || value.some((item) => typeof item !== "string" || !item)) throw new TypeError(`${field} must be a non-empty array of strings`); return Object.freeze([...value]); }
function result(status, fields) { const material = {schema_version: "are.codex-proposal-application/v1", status, ...fields, authority_effect: "none"}; return Object.freeze({...material, result_digest: sha256(stable(material))}); }

export function parseCodexScopeConfig(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((key) => !SCOPE_KEYS.has(key))) throw new TypeError("Codex scope configuration is invalid");
  if (input.schema_version !== "are.codex-coding-agent-scope/v1") throw new TypeError("Codex scope configuration version is unsupported");
  const max = input.max_context_bytes ?? 262_144;
  if (!Number.isSafeInteger(max) || max < 1) throw new TypeError("max_context_bytes is invalid");
  const maximumSteps = input.maximum_steps ?? 8;
  if (!Number.isSafeInteger(maximumSteps) || maximumSteps < 1 || maximumSteps > 64) throw new TypeError("maximum_steps is invalid");
  const toolPolicy = parseIterativeToolPolicy(input.tool_policy ?? {allow: ["list-files", "read-file", "search-text", "repository-map"], ask: [], deny: []});
  return Object.freeze({schema_version: input.schema_version, observation_allowlist: strings(input.observation_allowlist, "observation_allowlist"), mutation_allowlist: strings(input.mutation_allowlist, "mutation_allowlist"), verification_command: strings(input.verification_command, "verification_command"), max_context_bytes: max, maximum_steps: maximumSteps, tool_policy: toolPolicy, repository_map: parseRepositoryMapConfig(input.repository_map), sandbox: parseSandboxConfig(input.sandbox)});
}

export function bindCodexProposal({proposal, scope_config, codex_profile_bytes}) {
  const scope = parseCodexScopeConfig(scope_config);
  if (!proposal || proposal.schema_version !== "are.codex-app-server-coding-proposal/v1" || proposal.status !== "AWAITING_APPROVAL") throw new TypeError("Codex proposal is invalid");
  const candidateDigest = sha256(proposal.candidate_utf8 ?? "");
  if (!sameDigest(candidateDigest, proposal.candidate_sha256) || !sameDigest(candidateDigest, proposal.approval_digest)) throw new TypeError("Codex proposal candidate binding is invalid");
  return Object.freeze({...proposal, scope_config_sha256: sha256(stable(scope)), codex_profile_sha256: sha256(codex_profile_bytes), authority_effect: "none"});
}

function normalizeCandidate(raw) {
  const candidate = JSON.parse(raw);
  if (candidate.schema_version === "are.patch-set-candidate/v1") return candidate;
  if (candidate.schema_version !== "are.next-action-candidate/v1") throw new TypeError("Codex candidate schema is unsupported");
  return {schema_version: "are.patch-set-candidate/v1", expected_base_tree_sha256: candidate.expected_base_tree_sha256, changes: [{operation: candidate.operation, path: candidate.path, expected_file_sha256: candidate.expected_file_sha256, utf8: candidate.utf8}], rationale: candidate.rationale ?? null, authority_effect: "none"};
}

export function applyCodexAppServerProposal({proposal, repository_root, scope_config, codex_profile_path, approval_digest, sandbox_runner} = {}) {
  let scope;
  try { scope = parseCodexScopeConfig(scope_config); }
  catch (error) { return result("BLOCK", {reason_codes: ["proposal.scope-invalid"], error: error.message, effect_applied: false}); }
  if (!proposal || proposal.schema_version !== "are.codex-app-server-coding-proposal/v1" || proposal.status !== "AWAITING_APPROVAL") return result("BLOCK", {reason_codes: ["proposal.invalid"], effect_applied: false});
  const actualCandidateDigest = sha256(proposal.candidate_utf8 ?? "");
  if (!sameDigest(actualCandidateDigest, proposal.candidate_sha256) || !sameDigest(actualCandidateDigest, proposal.approval_digest) || !sameDigest(actualCandidateDigest, approval_digest)) return result("BLOCK", {reason_codes: ["proposal.approval-digest-mismatch"], effect_applied: false});
  if (!sameDigest(proposal.scope_config_sha256, sha256(stable(scope)))) return result("BLOCK", {reason_codes: ["proposal.scope-drift"], effect_applied: false});
  let profileBytes;
  try { profileBytes = readFileSync(codex_profile_path); } catch { return result("BLOCK", {reason_codes: ["proposal.profile-unavailable"], effect_applied: false}); }
  if (!sameDigest(proposal.codex_profile_sha256, sha256(profileBytes))) return result("BLOCK", {reason_codes: ["proposal.profile-drift"], effect_applied: false});
  let candidate;
  try { candidate = normalizeCandidate(proposal.candidate_utf8); } catch { return result("BLOCK", {reason_codes: ["proposal.candidate-invalid"], effect_applied: false}); }
  const parsed = parsePatchSetCandidate(candidate);
  if (!parsed.ok) return result("BLOCK", {reason_codes: parsed.reason_codes, effect_applied: false});
  let sandbox = null;
  try { if (scope.sandbox) sandbox = createContainerSandbox({config: scope.sandbox, repository_root: realpathSync(repository_root), ...(sandbox_runner ? {runner: sandbox_runner} : {})}); }
  catch { sandbox = null; }
  const application = runTransactionalPatchSet({run_id: `${proposal.run_id}:approved`, fixture_root: repository_root, raw_candidate: candidate, mutation_allowlist: scope.mutation_allowlist, verification_command: scope.verification_command, verification_sandbox: sandbox, approve: true, approval_digest: parsed.candidate_digest});
  return result(application.status, {run_id: application.run_id, approved_candidate_sha256: actualCandidateDigest, application, reason_codes: application.reason_codes, effect_applied: application.effect_applied, automatic_retry_permitted: false});
}
