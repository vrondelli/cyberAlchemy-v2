import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../..");
const manifestPath = resolve(here, "CANONICAL-IMPLEMENTED-BASELINE.v9.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
let checks = 0;

const assert = (condition, message) => {
  checks += 1;
  if (!condition) throw new Error(message);
};
const sha256Bytes = (bytes) => createHash("sha256").update(bytes).digest("hex");
const supersededIntentTerms = [
  ["Compensation", "Intent"].join(" "),
  ["Compensation", "Intent"].join(""),
  ["compensation", "intent"].join(" "),
  ["compensation", "Intent"].join(""),
  ["compensation", "intent"].join("_"),
  ["compensation", "intent"].join("-"),
];

assert(manifest.schema_version === "domainspec.canonical-implemented-meta-type-baseline/v9", "schema drift");
assert(manifest.baseline_id === "domainspec-meta-types-current-implemented@9", "baseline identity drift");
assert(manifest.supersedes?.baseline_id === "domainspec-meta-types-current-implemented@8", "superseded baseline identity drift");
assert(manifest.supersedes?.baseline_digest === "a1f20fc7fdd07470e3346dfe32a519115ff625e45e695149d9fceac636d19da5", "superseded baseline digest drift");
assert(manifest.authority_effect === "project-local-canonical-baseline-admission", "authority effect drift");
assert(manifest.denominators.backend_meta_types === 13, "backend denominator drift");
assert(manifest.denominators.realization_rows === 39, "realization denominator drift");
assert(manifest.denominators.ui_state_rows === 11, "UI denominator drift");
assert(manifest.denominators.relationship_authority_rows === 31, "relationship denominator drift");
assert(manifest.denominators.compensation_runtime_contracts === 1, "compensation contract denominator drift");
assert(manifest.denominators.compensation_definition_cards === 9, "compensation definition denominator drift");
assert(manifest.denominators.infrastructure_binding_definition_cards === 5, "infrastructure binding definition denominator drift");
assert(manifest.denominators.system_integration_language_profiles === 3, "system-integration language denominator drift");
assert(manifest.denominators.system_integration_obligation_rows === 15, "system-integration obligation denominator drift");
assert(manifest.inventory.length === manifest.denominators.frozen_evidence_files, "inventory denominator drift");
assert(new Set(manifest.inventory.map(({ path }) => path)).size === manifest.inventory.length, "duplicate inventory path");
assert(manifest.realization_rows.length === 39, "realization row count drift");
assert(new Set(manifest.realization_rows.map(({ meta_type_id, language }) => `${meta_type_id}/${language}`)).size === 39, "duplicate realization row");

for (const required of [
  "projects/domainspec-v2/definitions/DEFINITIONS.md",
  "projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md",
  "projects/domainspec-v2/definitions/DEFINITION-DRIFT-AUDIT.md",
  "projects/domainspec-v2/definitions/meta-types/meta-types.yml",
  "projects/domainspec-v2/definitions/meta-types/meta-types.md",
  "projects/domainspec-v2/definitions/meta-types/current-implementation.schema.json",
  "projects/domainspec-v2/definitions/meta-types/validate-current-implementation.mjs",
  "projects/domainspec-v2/definitions/relationships/relationships.yml",
  "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/workflow-compensation-v1.md",
  "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/workflow-compensation-v1.ts",
  "projects/domainspec-v2/development/durable-compensation-concepts/README.md",
  "projects/domainspec-v2/development/durable-compensation-concepts/concepts.json",
  "projects/domainspec-v2/development/durable-compensation-concepts/concepts.schema.json",
  "projects/domainspec-v2/development/durable-compensation-concepts/validate.mjs",
  "projects/domainspec-v2/development/meta-type-instantiation-cli/freeze-baseline-v9.mjs",
  "projects/domainspec-v2/development/meta-type-instantiation-cli/validate-baseline-v9.mjs",
  "projects/domainspec-v2/impl/cli/src/generation/generators.ts",
  "projects/domainspec-v2/impl/cli/test/generation/plan-instantiation.test.ts",
  "projects/domainspec-v2/impl/cli/test/conformance/observe-target.test.ts",
  "projects/domainspec-v2/impl/system-integration/profiles/provider-neutral-v1/profile.json",
  "projects/domainspec-v2/impl/system-integration/compiler/system-integration-v1.mjs",
  "projects/domainspec-v2/impl/system-integration/validation/validate-system-integration-profile-v1.mjs",
  "projects/domainspec-v2/impl/system-integration/tests/system-integration-v1.test.mjs",
  "projects/domainspec-v2/impl/cli/src/system-integration/compiler.ts",
  "projects/domainspec-v2/impl/cli/test/system-integration/profile.test.ts",
  "projects/domainspec-v2/impl/cli/tools/materialize-system-integration-profile.mjs",
]) assert(manifest.inventory.some(({ path }) => path === required), `required canonical source absent:${required}`);

for (const excluded of [
  "projects/domainspec-v2/RUNTIME.json",
  "projects/domainspec-v2/validate-runtime.mjs",
  "projects/domainspec-v2/definitions/meta-types/current-implementation.json",
  "projects/domainspec-v2/definitions/meta-types/current-implementation.md",
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
  "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json",
  "projects/domainspec-v2/impl/cli/contracts/instantiation-receipt.schema.json",
  "projects/domainspec-v2/impl/cli/src/meta-types/frozen-catalog.generated.ts",
  "projects/domainspec-v2/impl/cli/tools/materialize-frozen-catalog.mjs",
]) assert(!manifest.inventory.some(({ path }) => path === excluded), `digest-cycle view included:${excluded}`);

for (const entry of manifest.inventory) {
  const path = resolve(repoRoot, entry.path);
  assert(existsSync(path), `missing frozen file:${entry.path}`);
  const bytes = readFileSync(path);
  assert(bytes.length === entry.bytes, `frozen size drift:${entry.path}`);
  assert(sha256Bytes(bytes) === entry.sha256, `frozen digest drift:${entry.path}`);
  const content = bytes.toString("utf8");
  assert(!supersededIntentTerms.some((term) => content.includes(term)), `superseded D37 term in current baseline:${entry.path}`);
}

for (const row of manifest.realization_rows) {
  for (const role of ["source", "provider", "binding"]) {
    const ref = row[role];
    const path = resolve(repoRoot, ref.path);
    assert(existsSync(path), `missing realization ${role}:${row.meta_type_id}/${row.language}`);
    assert(sha256Bytes(readFileSync(path)) === ref.sha256, `realization ${role} drift:${row.meta_type_id}/${row.language}`);
  }
}

const decisionPath = resolve(repoRoot, manifest.owner_decision.path);
assert(existsSync(decisionPath), "owner decision missing");
assert(sha256Bytes(readFileSync(decisionPath)) === manifest.owner_decision.sha256, "owner decision drift");

const { baseline_digest: recordedDigest, ...body } = manifest;
assert(sha256Bytes(Buffer.from(JSON.stringify(body))) === recordedDigest, "baseline digest drift");
assert(manifest.claim_ceiling.canonical_project_local_baseline === true, "canonical baseline not admitted");
assert(manifest.claim_ceiling.current_implementation_evidence_admitted === true, "implementation evidence not admitted");
assert(manifest.claim_ceiling.generated_target_conformance === true, "generated target conformance admission missing");
assert(manifest.claim_ceiling.compensation_runtime_contract_admitted === true, "compensation contract not admitted");
assert(manifest.claim_ceiling.durable_compensation_model_admitted === true, "durable compensation model not admitted");
assert(manifest.claim_ceiling.recovery_intent_terminology_admitted === true, "Recovery Intent terminology not admitted");
assert(manifest.claim_ceiling.infrastructure_binding_model_admitted === true, "infrastructure binding model not admitted");
assert(manifest.claim_ceiling.durable_workflow_runtime_binding_admitted === true, "durable workflow runtime binding not admitted");
assert(manifest.claim_ceiling.system_integration_contract_profiles_implemented === true, "system-integration contract profiles not admitted");
assert(manifest.claim_ceiling.system_integration_cli_binding_formation_implemented === true, "system-integration CLI formation not admitted");
assert(manifest.claim_ceiling.system_integration_provider_runtime_implemented === false, "provider runtime claim widened");
assert(manifest.claim_ceiling.system_integration_runtime_guarantees_observed === false, "runtime guarantee claim widened");
for (const field of ["durable_compensation_dispatch_implemented", "publication", "release", "deployment", "production"]) {
  assert(manifest.claim_ceiling[field] === false, `claim ceiling widened:${field}`);
}

process.stdout.write(`${JSON.stringify({
  status: "pass",
  baseline_id: manifest.baseline_id,
  baseline_digest: manifest.baseline_digest,
  checks,
  evidence_files: manifest.inventory.length,
  backend_meta_types: manifest.backend_meta_types.length,
  realization_rows: manifest.realization_rows.length,
  authority_effect: manifest.authority_effect,
}, null, 2)}\n`);
