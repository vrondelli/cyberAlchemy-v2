#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const discoverRepositoryRoot = (start) => {
  let current = resolve(start);
  while (true) {
    if (existsSync(resolve(current, "AGENTS.md")) && existsSync(resolve(current, "projects/domainspec-v2"))) return current;
    const parent = dirname(current);
    if (parent === current) throw new Error(`unable to discover repository root from ${start}`);
    current = parent;
  }
};
const repositoryRoot = discoverRepositoryRoot(here);
const ontologyPath = resolve(here, "ontology.json");
const projectionPath = resolve(here, "domain-meta-types.projection.json");
const statePath = resolve(repositoryRoot, "projects/domainspec-v2/definitions/meta-types/current-implementation.json");
const manifestPath = resolve(repositoryRoot, "projects/domainspec-v2/development/meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v3.json");
const decisionPath = resolve(repositoryRoot, "projects/domainspec-v2/development/meta-type-instantiation-cli/OWNER-PRODUCT-ONTOLOGY-AND-COMPENSATION-ADMISSION.json");
const sha256Bytes = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const repoPath = (path) => relative(repositoryRoot, path).replaceAll("\\", "/");
const fileRef = (path) => {
  const bytes = readFileSync(path);
  return { path: repoPath(path), sha256: sha256Bytes(bytes), size_bytes: bytes.length };
};
const sourceRef = (sourceId, path, use) => ({
  source_id: sourceId,
  path: repoPath(path),
  sha256: sha256Bytes(readFileSync(path)),
  use,
});

const ontology = readJson(ontologyPath);
const projection = readJson(projectionPath);
const state = readJson(statePath);
const manifest = readJson(manifestPath);

if (state.baseline.id !== manifest.baseline_id || state.baseline.baseline_digest !== manifest.baseline_digest) {
  throw new Error("current state and baseline manifest identity differ");
}
if (manifest.realization_rows.length !== 39 || state.backend_meta_types.length !== 13) {
  throw new Error("canonical 13 by 3 realization closure is absent");
}

const canonicalState = {
  baseline_id: manifest.baseline_id,
  baseline_digest: manifest.baseline_digest,
  state_ref: repoPath(statePath),
  state_file_ref: fileRef(statePath),
  baseline_manifest_ref: fileRef(manifestPath),
  owner_decision_ref: fileRef(decisionPath),
  scope: state.scope,
  backend_meta_types: state.backend_meta_types.map(({ id }) => id),
  realization_rows: manifest.realization_rows,
  ui_state: state.ui_state,
  historical_gate_effect: "provenance-only-do-not-control-current-baseline",
  product_frontier: {
    ...state.product_frontier,
    typed_residue: [
      "durable-compensation-dispatcher-missing",
      "production-runtime-observation-missing",
      "machine-graph-to-obligation-join-missing",
      "published-package-and-release-missing",
    ],
  },
  operation_contract: {
    ...state.operation_contract,
    relationship_authority: [
      "Rule --[enforces]--> Operation",
      "Operation --[produces]--> Event",
      "Workflow --[orchestrates]--> Operation",
    ],
  },
  example_instance_effect: "unchanged-six-not-admitted-example-instances",
  claim_ceiling: state.claim_ceiling,
  authority_effect: "none",
};

ontology.ontology_scope = {
  ontology_type: "architecture-property",
  branch: "system",
  visibility: "private",
  package_root: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment",
  owner_route: "implementation-conformance profile owner",
  residue_route: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/TRACEABILITY-AND-DRIFT.md",
};
ontology.canonical_implementation_state = canonicalState;

const currentSources = new Map(ontology.definition_source_refs.map((ref) => [ref.source_id, ref]));
for (const [sourceId, path, use] of [
  ["domainspec.meta-types-registry", resolve(repositoryRoot, "projects/domainspec-v2/definitions/meta-types/meta-types.yml"), "canonical DS-D1 identity, maturity, current implementation pointer, criteria, deferred state, and superseded tombstone"],
  ["domainspec.meta-type-cards", resolve(repositoryRoot, "projects/domainspec-v2/definitions/meta-types/meta-types.md"), "three-voice semantic cards plus canonical current implementation and Operation obligation context"],
  ["experiment.ontology-map", resolve(here, "ONTOLOGY-MAP.md"), "current architecture-property map, canonical baseline projection, instance boundary, and typed product residue"],
  ["domainspec.definition-catalogue", resolve(repositoryRoot, "projects/domainspec-v2/definitions/DEFINITIONS.md"), "D31 through D36 canonical realization, baseline, instantiation, conformance, receipt, and Workflow Compensation vocabulary"],
  ["domainspec.current-meta-type-implementation", statePath, "canonical current implementation state and product frontier"],
  ["domainspec.canonical-meta-type-baseline-v3", manifestPath, "immutable 13-type, 39-realization implementation and Workflow Compensation baseline"],
  ["domainspec.meta-type-baseline-v3-owner-decision", decisionPath, "owner admission of the canonical product ontology, Workflow Compensation, and baseline version 3"],
  ["domainspec.relationship-signatures", resolve(repositoryRoot, "projects/domainspec-v2/definitions/relationships/relationships.yml"), "DS-D8 relationship signatures including Operation, Rule, Event, and Workflow bindings"],
]) currentSources.set(sourceId, sourceRef(sourceId, path, use));
ontology.definition_source_refs = [...currentSources.values()];

const conceptByMetaType = new Map();
for (const concept of ontology.concept_types) {
  if (!concept.canonical_meta_type_ref) continue;
  concept.canonical_mapping_status = "canonical-baseline-alignment";
  conceptByMetaType.set(concept.canonical_meta_type_ref, concept.concept_id);
}
for (const { id } of state.backend_meta_types) {
  if (!conceptByMetaType.has(id)) throw new Error(`missing architecture concept mapping for ${id}`);
}

const counts = "implementation_instances={total=6,not_admitted=6,proposed=0,admitted=0}; supporting_instances={total=0,not_admitted=0}; relation_instances={total=0,not_admitted=0,proposed=0,admitted=0}; relation_instance_blueprints=4; PromotionRecords=0";
ontology.claim_ceiling = `This ontology document is materialized as v2 with ${counts}. It reports canonical implemented baseline ${manifest.baseline_id} with 13 backend meta-types and 39 realization rows; bounded static generated-target conformance is separately admitted by the current state. Candidate bytes remain unchanged. This document creates no PromotionRecord and does not admit or promote any implementation, relation, or candidate; grant authority; publish; release; deploy; or establish production readiness.`;
writeFileSync(ontologyPath, `${JSON.stringify(ontology, null, 2)}\n`);

projection.canonical_implementation_state = canonicalState;
if (!projection.mapping_status_values.includes("canonical-baseline-alignment")) {
  projection.mapping_status_values.unshift("canonical-baseline-alignment");
}
for (const metaType of projection.meta_types) {
  if (metaType.maturity !== "active") continue;
  metaType.mapping_status = "canonical-baseline-alignment";
  metaType.architecture_type_id = conceptByMetaType.get(metaType.meta_type_id);
  metaType.mapping_reason = `The current owner-admitted baseline binds this backend meta-type to exact TypeScript, Python, and Rust source, provider, and binding digests. Historical candidate coverage remains provenance only.`;
}
projection.claim_ceiling = "This derived read model reports the owner-admitted canonical implemented meta-type baseline, bounded static generated-target conformance, and the ontology-v2 example lifecycle axes. It does not establish production runtime conformance and cannot author admission, create a PromotionRecord, grant authority, migrate candidate bytes, publish, release, deploy, or establish production readiness.";
projection.source_ontology_ref = fileRef(ontologyPath);
writeFileSync(projectionPath, `${JSON.stringify(projection, null, 2)}\n`);

process.stdout.write(`${JSON.stringify({
  status: "pass",
  baseline_id: canonicalState.baseline_id,
  realization_rows: canonicalState.realization_rows.length,
  backend_meta_types: canonicalState.backend_meta_types.length,
  example_instances: ontology.implementation_instances.length,
  example_instances_admitted: ontology.implementation_instances.filter(({ lifecycle_axes }) => lifecycle_axes.admission_status === "admitted").length,
  ontology: fileRef(ontologyPath),
  projection: fileRef(projectionPath),
  authority_effect: "none",
}, null, 2)}\n`);
