#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const formalizationRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(formalizationRoot, "../../..");
const caseRoot = resolve(
  formalizationRoot,
  "cases/AF-EXACT-SESSION-ROLE-PERMISSION-001",
);

const paths = {
  candidate: resolve(caseRoot, "FORMAL-CLAIM.v5-lean-candidate.json"),
  identityInputs: resolve(caseRoot, "CLAIM-IDENTITY-INPUTS.v3-lean-bound.json"),
  identityAlgorithm: resolve(caseRoot, "IDENTITY-ALGORITHM.v3.json"),
  definitionBinding: resolve(caseRoot, "FORMAL-CLAIM-DEFINITION-BINDING.v2-lean-candidate.json"),
  predecessorDefinitionBinding: resolve(caseRoot, "FORMAL-CLAIM-DEFINITION-BINDING.v1-candidate.json"),
  acceptedMeaning: resolve(caseRoot, "BUSINESS-MEANING.v2-definitions-accepted.json"),
  predecessorClaim: resolve(caseRoot, "FORMAL-CLAIM.v4-definitions-bound-candidate.json"),
  leanSource: resolve(caseRoot, "ExactSessionRolePermission.lean"),
  leanEnvironment: resolve(caseRoot, "LEAN-ENVIRONMENT.v1-candidate.json"),
  leanToolchain: resolve(caseRoot, "lean-toolchain"),
  profileRegistry: resolve(repositoryRoot, "projects/domainspec-v2/formalization/profiles/formal-language-profiles.json"),
};

const checks = [];
const blockers = [];

function check(id, condition, detail) {
  const status = condition ? "pass" : "block";
  checks.push({ check_id: id, status, detail });
  if (!condition) blockers.push({ check_id: id, detail });
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sha256(path) {
  return sha256Bytes(readFileSync(path));
}

function sha256Text(value) {
  return sha256Bytes(Buffer.from(value, "utf8"));
}

function parse(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isInside(path) {
  const fromRoot = relative(repositoryRoot, path);
  return fromRoot === "" || (!fromRoot.startsWith("..") && !isAbsolute(fromRoot));
}

function exactRefErrors(label, ref) {
  const errors = [];
  if (!ref || typeof ref.path !== "string") return [`${label}: missing exact reference`];
  const target = resolve(repositoryRoot, ref.path);
  if (!isInside(target) || !existsSync(target)) return [`${label}: target is missing or escapes repository`];
  if (sha256(target) !== ref.sha256) errors.push(`${label}: sha256 mismatch`);
  if (statSync(target).size !== ref.size_bytes) errors.push(`${label}: size mismatch`);
  if (ref.current !== true) errors.push(`${label}: reference is not current`);
  return errors;
}

const documents = {};
for (const [name, path] of Object.entries(paths)) {
  try {
    documents[name] = path.endsWith(".json") ? parse(path) : readFileSync(path, "utf8");
    check(`AF-LEAN-${name}-parse`, true, `${relative(repositoryRoot, path)} is readable`);
  } catch (error) {
    check(`AF-LEAN-${name}-parse`, false, error.message);
  }
}

if (blockers.length === 0) {
  const candidate = documents.candidate;
  const identity = documents.identityInputs;
  const algorithm = documents.identityAlgorithm;
  const binding = documents.definitionBinding;
  const predecessorBinding = documents.predecessorDefinitionBinding;
  const meaning = documents.acceptedMeaning;
  const predecessor = documents.predecessorClaim;
  const environment = documents.leanEnvironment;
  const registry = documents.profileRegistry;

  const exactRefs = [
    ["candidate.identity_algorithm_ref", candidate.claim.identity_algorithm_ref],
    ["candidate.business_meaning_ref", candidate.business_meaning_ref],
    ["candidate.business_acceptance_ref", candidate.business_acceptance_ref],
    ["candidate.definition_binding_ref", candidate.definition_binding_ref],
    ["candidate.formal_language_profile_ref", candidate.formal_language_profile_ref],
    ["candidate.proposition.identity_algorithm_ref", candidate.canonical_proposition.identity_algorithm_ref],
    ["identity.business_meaning_ref", identity.business_meaning_ref],
    ["identity.definition_binding_ref", identity.definition_binding_ref],
    ["identity.profile_registry_ref", identity.formal_language_profile.registry_ref],
    ["identity.lean_source_ref", identity.lean_source_ref],
    ["identity.lean_environment_ref", identity.lean_environment_ref],
    ["binding.predecessor_binding_ref", binding.predecessor_binding_ref],
    ["binding.definition_authority_ref", binding.definition_authority_ref],
    ["environment.toolchain_ref", environment.toolchain_ref],
  ];
  const refErrors = exactRefs.flatMap(([label, ref]) => exactRefErrors(label, ref));
  check("AF-LEAN-exact-references", refErrors.length === 0,
    refErrors.length === 0 ? `${exactRefs.length} exact references match live bytes` : refErrors.join("; "));

  check("AF-LEAN-candidate-boundary",
    candidate.schema_version === "domainspec-v2.formal-claim-source/v4-candidate" &&
      candidate.claim.claim_version === "5-lean-candidate" &&
      candidate.claim.supersedes === "FormalClaim:auth-foundation.exact-session-role-permission@4-definitions-bound-candidate" &&
      candidate.claim.currentness === "current" &&
      candidate.authority_effect === "none" &&
      candidate.interpretation_boundary.interpretation_model_is_part_of_claim === false &&
      candidate.interpretation_boundary.join_stage === "external-evaluation-context" &&
      !("interpretation_model_ref" in candidate),
    "v5 is a no-authority successor candidate and keeps InterpretationModel external");

  check("AF-LEAN-identity-algorithm",
    algorithm.schema_version === "auth-foundation.formal-claim-identity-algorithm/v3" &&
      algorithm.identity_inputs_schema_ref === "projects/auth-foundation/formalization/schemas/auth-formal-claim-identity-inputs.v3.schema.json" &&
      algorithm.interpretation_boundary.interpretation_model_is_identity_input === false,
    "identity algorithm v3 binds the Lean identity-input contract and excludes InterpretationModel");

  check("AF-LEAN-identity-inputs",
    identity.schema_version === "auth-foundation.formal-claim-identity-inputs/v3" &&
      identity.claim_id === candidate.claim.claim_id &&
      identity.claim_version === candidate.claim.claim_version &&
      candidate.claim.identity_inputs_digest === sha256(paths.identityInputs) &&
      identity.authority_effect === "none",
    "candidate identity binds the exact v3 identity-input bytes");

  const source = documents.leanSource;
  const marked = source.match(
    /  -- DOMAINSPEC-CANONICAL-PROPOSITION-BEGIN\n([\s\S]*?)\n  -- DOMAINSPEC-CANONICAL-PROPOSITION-END/,
  );
  const representation = marked?.[1] ?? null;
  check("AF-LEAN-canonical-source",
    representation !== null &&
      representation === candidate.canonical_proposition.representation &&
      sha256Text(representation) === candidate.canonical_proposition.representation_digest &&
      sha256Text(candidate.canonical_proposition.semantic_identity) === candidate.canonical_proposition.semantic_identity_digest &&
      same(identity.canonical_proposition, {
        representation_media_type: candidate.canonical_proposition.representation_media_type,
        representation_digest: candidate.canonical_proposition.representation_digest,
        semantic_identity: candidate.canonical_proposition.semantic_identity,
        semantic_identity_digest: candidate.canonical_proposition.semantic_identity_digest,
      }),
    "FormalClaim proposition exactly equals the marked Lean term and all proposition digests reproduce");

  const leanProfile = registry.profiles.find((profile) =>
    profile.profile_id === identity.formal_language_profile.profile_id &&
    profile.version === identity.formal_language_profile.version
  );
  check("AF-LEAN-profile-selection",
    leanProfile?.profile_id === "lean-dtt" &&
      leanProfile.formal_claim_role === "canonical-source" &&
      leanProfile.provider_route === "evf-theorem" &&
      leanProfile.authority_effect === "none",
    "lean-dtt canonical-source profile and theorem route are exactly selected without authority effect");

  check("AF-LEAN-definition-rebind",
    binding.claim_identity.claim_version === candidate.claim.claim_version &&
      binding.semantic_delta.startsWith("none;") &&
      same(binding.definition_closure, predecessorBinding.definition_closure) &&
      binding.definition_authority_ref.sha256 === sha256(paths.acceptedMeaning) &&
      meaning.status === "accepted" && meaning.acceptance.status === "accepted",
    "the v5 identity reuses the exact accepted 20-definition closure without a semantic delta");

  check("AF-LEAN-signature-preservation",
    same(candidate.formal_signature, predecessor.formal_signature) &&
      same(identity.formal_signature, candidate.formal_signature) &&
      candidate.source_authority_count === 1,
    "the v4 formal signature and single-source authority boundary are unchanged");

  check("AF-LEAN-environment",
    documents.leanToolchain === "leanprover/lean4:v4.32.0\n" &&
      environment.toolchain.channel === "leanprover/lean4:v4.32.0" &&
      environment.toolchain.lean_version === "4.32.0" &&
      environment.imports.length === 0 && environment.options.length === 0 &&
      environment.authority_effect === "none",
    "Lean 4.32.0 is pinned with no imports or ambient options");

  const compile = spawnSync(
    "elan",
    ["run", "leanprover/lean4:v4.32.0", "lean", relative(repositoryRoot, paths.leanSource)],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  check("AF-LEAN-typecheck", compile.status === 0,
    compile.status === 0 ? "Lean 4.32.0 elaborated the canonical declaration" : `${compile.stdout}${compile.stderr}`.trim());

  check("AF-LEAN-claim-ceiling",
    candidate.claim_ceiling.includes("no FormalClaim admission") &&
      candidate.claim_ceiling.includes("theorem proof") &&
      candidate.tde_compatibility.status === "adapter-required" &&
      candidate.tde_compatibility.v2_projection_ref === null,
    "candidate remains unadmitted and creates no TDE projection, proof, runtime, or release claim");
}

const result = {
  schema_version: "auth-foundation.lean-candidate-validation/v1",
  candidate_ref: existsSync(paths.candidate) ? {
    path: relative(repositoryRoot, paths.candidate),
    sha256: sha256(paths.candidate),
    size_bytes: statSync(paths.candidate).size,
    current: true,
  } : null,
  validator_ref: {
    path: relative(repositoryRoot, fileURLToPath(import.meta.url)),
    sha256: sha256(fileURLToPath(import.meta.url)),
    size_bytes: statSync(fileURLToPath(import.meta.url)).size,
    current: true,
  },
  status: blockers.length === 0 ? "pass" : "block",
  checks,
  blockers,
  semantic_preservation_review: "not_evaluable",
  admission_effect: "none",
  authority_effect: "none",
  claim_ceiling: "Technical validation of one unadmitted Lean FormalClaim candidate only. PASS proves exact binding and Lean elaboration, not semantic equivalence, theorem proof, FormalClaim admission, runtime correspondence, security, release, or production readiness."
};

const outputIndex = process.argv.indexOf("--output");
if (outputIndex >= 0) {
  const requested = process.argv[outputIndex + 1];
  if (!requested) throw new Error("--output requires a path");
  const outputPath = resolve(repositoryRoot, requested);
  if (!isInside(outputPath)) throw new Error("output path escapes repository");
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = blockers.length === 0 ? 0 : 1;
