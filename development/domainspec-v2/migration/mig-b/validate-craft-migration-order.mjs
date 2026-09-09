#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const orderPath = "cyberAlchemy-v2/development/domainspec-v2/migration/mig-b/map/CRAFT-MIGRATION-ORDER.json";
const errors = [];

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(repositoryRoot, relativePath), "utf8"));
}

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(resolve(repositoryRoot, relativePath)))
    .digest("hex");
}

function requireCondition(condition, message) {
  if (!condition) errors.push(message);
}

const order = readJson(orderPath);

requireCondition(order.schema_version === "cav2.craft-migration-order/v2", "unexpected order schema");
requireCondition(order.revision === 2, "migration order revision must be 2");
requireCondition(order.supersedes_revision === 1, "migration order must supersede revision 1");
requireCondition(order.status === "planned", "migration order must remain planned before execution");
requireCondition(order.authority_effect === "none", "migration order must not claim authority effect");
requireCondition(order.identity?.product_id === "CA2-PRODUCT-CRAFT", "Craft Product identity is missing");
requireCondition(order.identity?.current_name === "Craft", "current Product name must be Craft");
requireCondition(order.identity?.former_name === "DomainSpec v2", "former Product name must be DomainSpec v2");
requireCondition(order.identity?.continuity === "same-product-renamed", "Product continuity must be same-product-renamed");
requireCondition(order.route?.numbered_candidate_policy === "forbidden-as-migration-control-loop", "numbered candidate loop must be forbidden");
requireCondition(order.route?.source_deletion_policy === "forbidden-by-this-order", "source deletion must remain forbidden");
requireCondition(order.route?.selection_policy === "only-explicit-dependency-closed-slices-migrate", "migration must be selective");
requireCondition(order.route?.unselected_source_policy === "retain-in-place-as-legacy-evidence", "unselected sources must remain legacy evidence");

const amendment = readJson(order.amendment_ref);
requireCondition(amendment.order_id === order.order_id, "amendment order identity mismatch");
requireCondition(amendment.prior_revision === order.supersedes_revision, "amendment prior revision mismatch");
requireCondition(amendment.new_revision === order.revision, "amendment new revision mismatch");
requireCondition(amendment.status === "owner-directed-correction", "amendment is not an owner-directed correction");
requireCondition(amendment.authority_effect === "none", "amendment exceeds its authority ceiling");

for (const binding of order.source_bindings ?? []) {
  requireCondition(sha256(binding.path) === binding.sha256, `source binding drift: ${binding.role}`);
}

const bindingByRole = new Map((order.source_bindings ?? []).map((binding) => [binding.role, binding]));
const projectMap = readJson(bindingByRole.get("validated-project-map").path);
const matrix = readJson(bindingByRole.get("development-directory-matrix").path);
const sourceManifest = readJson(bindingByRole.get("source-file-inventory").path);
const pathConsumers = readJson(bindingByRole.get("literal-path-consumer-inventory").path);
const identityDecision = readJson(bindingByRole.get("craft-rename-decision").path);

requireCondition(projectMap.semantic_digest === bindingByRole.get("validated-project-map").semantic_digest, "project map semantic digest drift");
requireCondition(matrix.semantic_digest === bindingByRole.get("development-directory-matrix").semantic_digest, "migration matrix semantic digest drift");
requireCondition(sourceManifest.content_digest === bindingByRole.get("source-file-inventory").content_digest, "source inventory content digest drift");
requireCondition(matrix.source_map_semantic_digest === projectMap.semantic_digest, "matrix does not bind the selected project map");
requireCondition(matrix.rows?.length === order.observed_source_epoch?.development_directories, "development directory count mismatch");
requireCondition(sourceManifest.summary?.entry_count === order.observed_source_epoch?.source_file_entries, "source entry count mismatch");
requireCondition(sourceManifest.summary?.present_bytes === order.observed_source_epoch?.source_bytes, "source byte count mismatch");
requireCondition(pathConsumers.summary?.consumer_file_count === order.observed_source_epoch?.literal_path_consumer_files, "path consumer file count mismatch");
requireCondition(pathConsumers.summary?.occurrence_count === order.observed_source_epoch?.literal_path_occurrences, "path occurrence count mismatch");

requireCondition(identityDecision.identities?.product_id === order.identity.product_id, "identity decision Product mismatch");
requireCondition(identityDecision.identities?.project_id === order.identity.project_id, "identity decision Project mismatch");
requireCondition(identityDecision.identities?.method_ref === order.identity.method_ref, "identity decision Method mismatch");
requireCondition(identityDecision.product_lineage?.current_name === order.identity.current_name, "identity decision current name mismatch");
requireCondition(identityDecision.product_lineage?.former_name === order.identity.former_name, "identity decision former name mismatch");
requireCondition(identityDecision.product_lineage?.continuity === order.identity.continuity, "identity decision continuity mismatch");

const craftRoot = order.destination_policy?.craft_root;
const activeRootEntries = Object.entries(order.destination_policy?.active_roots ?? {});
requireCondition(craftRoot === "cyberAlchemy-v2/craft", "canonical Craft root must be cyberAlchemy-v2/craft");
requireCondition(activeRootEntries.length === 9, "all nine self-contained Craft roots must be declared");
for (const [concern, activeRoot] of activeRootEntries) {
  requireCondition(activeRoot.startsWith(`${craftRoot}/`), `active destination is outside the Craft root: ${activeRoot}`);
  const expectedSuffix = concern === "definitions" ? "/authority/definitions" : `/${concern}`;
  requireCondition(activeRoot.endsWith(expectedSuffix), `active destination does not match its concern ${concern}: ${activeRoot}`);
}
requireCondition(order.destination_policy?.active_roots?.definitions === "cyberAlchemy-v2/craft/authority/definitions", "Craft definition authority path is incorrect");
for (const forbidden of [
  "cyberAlchemy-v2/product/craft",
  "cyberAlchemy-v2/architecture/craft",
  "cyberAlchemy-v2/authority/craft",
  "cyberAlchemy-v2/ontology/craft",
  "cyberAlchemy-v2/implementation/craft",
  "cyberAlchemy-v2/research/craft",
  "cyberAlchemy-v2/development/craft",
]) {
  requireCondition(!JSON.stringify(order).includes(forbidden), `layer-first Craft destination remains: ${forbidden}`);
}

const definitionSlice = order.definitions_first_slice ?? {};
requireCondition(definitionSlice.destination === order.destination_policy?.active_roots?.definitions, "definition slice destination mismatch");
requireCondition(definitionSlice.scope === "active-backend-meta-type-definitions", "definition slice scope mismatch");
requireCondition(definitionSlice.active_meta_type_ids?.length === 13, "definition slice must select 13 active backend meta types");
requireCondition(new Set(definitionSlice.active_meta_type_ids ?? []).size === 13, "definition slice meta-type IDs must be unique");
requireCondition(definitionSlice.criterion_schema_count === 13, "definition slice must select 13 criterion records");
requireCondition(definitionSlice.relationship_authority?.signature_count === 17, "backend relationship authority must contain 17 signatures");
requireCondition(definitionSlice.relationship_authority?.source_signature_count === 31, "source relationship authority count must remain 31");
requireCondition(definitionSlice.relationship_authority?.deferred_signature_count === 14, "deferred relationship signature count must remain 14");
requireCondition(definitionSlice.relationship_authority?.full_source_parity_claimed === false, "scoped relationship authority must not claim full parity");
requireCondition(definitionSlice.serialization?.canonical_format === "json", "definition canonical format must be JSON");
requireCondition(definitionSlice.serialization?.criterion_representation === "json-criterion-record", "criterion representation must remain a JSON criterion record");
requireCondition(definitionSlice.serialization?.destination_yaml_forbidden === true, "YAML must be forbidden in the Craft definition destination");
requireCondition(definitionSlice.meta_type_state_definition_ids?.join(",") === "domainspec-v2-D31,domainspec-v2-D32,domainspec-v2-D33,domainspec-v2-D34,domainspec-v2-D35", "meta-type state definition selection drift");

const developmentPolicy = order.development_inventory_policy ?? {};
requireCondition(developmentPolicy.inventory_role === "discovery-and-preservation-map-not-copy-order", "development inventory must not become a copy order");
requireCondition(developmentPolicy.inventoried_directories === matrix.rows?.length, "development inventory count mismatch");
requireCondition(developmentPolicy.default_action === "retain-in-place-as-legacy-evidence", "unselected development directories must remain in place");
requireCondition(developmentPolicy.bulk_copy_forbidden === true, "bulk development-directory copying must be forbidden");

const phases = order.phases ?? [];
const expectedPhaseIds = [
  "M00-REFRESH-AND-FREEZE",
  "M01-MIGRATE-CANONICAL-DEFINITIONS",
  "M02-FREEZE-DEFINITION-SNAPSHOT",
  "M03-FINALIZE-CRAFT-ENTRY-SURFACES",
  "M04-MIGRATE-PRODUCT-CAPABILITY-AND-ONTOLOGY",
  "M05-MIGRATE-DOMAINSPEC-AND-SYSTEM-ONTOLOGY",
  "M06-MIGRATE-ARCHITECTURE-AND-REALIZATIONS",
  "M07-MIGRATE-ONE-RUNTIME-CLOSURE",
  "M08-REBIND-SELECTED-CONSUMERS",
  "M09-VALIDATE-AND-FREEZE-FIRST-VERTICAL",
];
requireCondition(phases.map((phase) => phase.id).join(",") === expectedPhaseIds.join(","), "definitions-first selective phase order drift");
const phaseIds = new Set(phases.map((phase) => phase.id));
requireCondition(phaseIds.size === phases.length, "phase IDs must be unique");
for (let index = 0; index < phases.length; index += 1) {
  const phase = phases[index];
  requireCondition(phase.order === index, `phase order is not contiguous at ${phase.id}`);
  for (const dependency of phase.depends_on ?? []) {
    const dependencyIndex = phases.findIndex((candidate) => candidate.id === dependency);
    requireCondition(dependencyIndex >= 0, `unknown dependency ${dependency} for ${phase.id}`);
    requireCondition(dependencyIndex < index, `dependency ${dependency} must precede ${phase.id}`);
  }
}

const m00 = phases.find((phase) => phase.id === "M00-REFRESH-AND-FREEZE");
requireCondition(m00?.status === "completed", "M00 must be marked completed");
requireCondition(Boolean(m00?.receipt_ref), "M00 completion receipt is missing");
const m00Receipt = m00?.receipt_ref ? readJson(m00.receipt_ref) : null;
if (m00Receipt) {
  requireCondition(m00Receipt.order_id === order.order_id, "M00 receipt order identity mismatch");
  requireCondition(m00Receipt.phase_id === m00.id, "M00 receipt phase identity mismatch");
  requireCondition(m00Receipt.status === "PASS", "M00 receipt is not PASS");
  requireCondition(m00Receipt.authority_effect === "none", "M00 receipt exceeds its authority ceiling");
  requireCondition(m00Receipt.source_epoch?.source_bytes_unchanged === true, "M00 receipt does not prove stable source bytes");
  requireCondition(m00Receipt.source_epoch?.source_content_digest_after === sourceManifest.content_digest, "M00 receipt source digest mismatch");
  requireCondition(m00Receipt.refreshed_observations?.project_map_semantic_digest === projectMap.semantic_digest, "M00 receipt project map digest mismatch");
  requireCondition(m00Receipt.refreshed_observations?.migration_matrix_semantic_digest === matrix.semantic_digest, "M00 receipt matrix digest mismatch");
  requireCondition(m00Receipt.refreshed_observations?.literal_path_consumer_files_after === pathConsumers.summary?.consumer_file_count, "M00 receipt consumer file count mismatch");
  requireCondition(m00Receipt.refreshed_observations?.literal_path_occurrences_after === pathConsumers.summary?.occurrence_count, "M00 receipt occurrence count mismatch");
  requireCondition(m00Receipt.validation?.craft_migration_order === "pass", "M00 receipt does not record the Craft order validation");
  requireCondition(m00Receipt.validation?.scoped_content_check === "pass", "M00 receipt does not record the scoped content check");
  requireCondition(amendment.prior_m00_artifact_hashes?.["CRAFT-MIGRATION-ORDER.json"] === m00Receipt.artifact_hashes?.["CRAFT-MIGRATION-ORDER.json"], "amendment does not preserve the M00 order hash");
  requireCondition(amendment.prior_m00_artifact_hashes?.["validate-craft-migration-order.mjs"] === m00Receipt.artifact_hashes?.["validate-craft-migration-order.mjs"], "amendment does not preserve the M00 validator hash");
}

const latestCandidate = readJson(bindingByRole.get("latest-numbered-candidate-evidence-only").path);
requireCondition(latestCandidate.status === "candidate-unadmitted", "latest numbered candidate posture changed");
requireCondition(latestCandidate.baseline?.admission === "pending", "latest numbered candidate admission is no longer pending");
requireCondition(bindingByRole.get("latest-numbered-candidate-evidence-only").use === "diagnostic-evidence-not-migration-source", "latest numbered candidate must remain diagnostic only");

const result = {
  schema_version: "cav2.craft-migration-order-validation/v2",
  status: errors.length === 0 ? "PASS" : "BLOCK",
  authority_effect: "none",
  order_id: order.order_id,
  counts: {
    source_bindings: order.source_bindings?.length ?? 0,
    phases: phases.length,
    development_directories_inventoried: matrix.rows?.length ?? 0,
    active_backend_meta_types_selected: definitionSlice.active_meta_type_ids?.length ?? 0,
    backend_relationship_signatures_selected: definitionSlice.relationship_authority?.signature_count ?? 0,
    source_entries_bound: sourceManifest.summary?.entry_count ?? 0,
    literal_path_consumer_files: pathConsumers.summary?.consumer_file_count ?? 0,
    literal_path_occurrences: pathConsumers.summary?.occurrence_count ?? 0
  },
  identity: order.identity,
  errors
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = errors.length === 0 ? 0 : 1;
