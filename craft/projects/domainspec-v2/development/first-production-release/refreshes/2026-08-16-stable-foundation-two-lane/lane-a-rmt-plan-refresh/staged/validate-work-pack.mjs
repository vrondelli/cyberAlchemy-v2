#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const planRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(process.argv[2] ?? process.cwd());
const logicalPlanRoot = resolve(process.env.WP_RMT_LOGICAL_PLAN_ROOT ?? planRoot);
const fail = (code, detail) => { throw new Error(`${code}:${detail}`); };
const read = (path) => readFileSync(path);
const json = (path) => JSON.parse(read(path).toString("utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const lstatExists = (path) => {
  try { lstatSync(path); return true; }
  catch (error) { if (error?.code === "ENOENT") return false; throw error; }
};
const exactKeys = (value, expected, code) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) fail(code, `${actual.join(",")}`);
};
const inspectBoundFile = (path, binding, code) => {
  const stat = lstatSync(path);
  const bytes = read(path);
  if (!stat.isFile() || stat.isSymbolicLink() || bytes.length !== binding.size_bytes || sha256(bytes) !== binding.sha256) fail(code, path);
  return bytes;
};
const verifyBoundInventory = (receiptPath, inventory, code) => {
  const materials = [...inventory.materials].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  let totalSize = 0;
  const rows = [];
  for (const material of materials) {
    const bytes = inspectBoundFile(resolve(dirname(receiptPath), material.path), material, `${code}_MATERIAL`);
    totalSize += bytes.length;
    rows.push(`${material.sha256}\t${material.size_bytes}\t${material.path}\n`);
  }
  if (materials.length !== inventory.file_count || totalSize !== inventory.total_size_bytes || sha256(Buffer.from(rows.join(""), "utf8")) !== inventory.sha256) fail(code, inventory.sha256);
};

const manifestPath = join(planRoot, "SWU-MANIFEST.json");
const entryPath = join(planRoot, "EXECUTION-ENTRY.json");
const manifest = json(manifestPath);
const entry = json(entryPath);
const contracts = json(join(planRoot, "SWU-CONTRACTS.json"));
const scopeBaseline = json(join(planRoot, "WRITE-SCOPE-BASELINE.json"));
const hostileCatalogue = json(join(planRoot, "HOSTILE-CATALOGUE.json"));
const relationContracts = json(join(planRoot, "RELATION-CONTRACTS.json"));

if (manifest.schema_version !== "domainspec.remaining-meta-types-work-pack-manifest/v3") fail("WP_SCHEMA", manifest.schema_version);
if (manifest.work_pack_id !== "WP-RMT-002" || entry.work_pack_id !== manifest.work_pack_id) fail("WP_ID", manifest.work_pack_id);
if (manifest.status !== "planned-selection-ready" || entry.execution_entry.state !== "selection-ready") fail("WP_GATE_STATE", `${manifest.status}/${entry.execution_entry.state}`);
if (entry.execution_entry.selected_unit !== null || entry.execution_entry.route_id !== null || entry.execution_entry.next_owner !== "implementation-readiness:execute") fail("WP_SELECTION_READY_ENTRY", "selection or owner contradiction");
if (entry.authority_effect !== "none") fail("WP_AUTHORITY", entry.authority_effect);
const planRelative = (name) => relative(repoRoot, join(logicalPlanRoot, name)).replaceAll("\\", "/");
if (manifest.contract_inventory_ref !== planRelative("SWU-CONTRACTS.json") || manifest.write_scope_baseline_ref !== planRelative("WRITE-SCOPE-BASELINE.json") || manifest.hostile_catalogue_ref !== planRelative("HOSTILE-CATALOGUE.json") || manifest.relation_contracts_ref !== planRelative("RELATION-CONTRACTS.json")) fail("WP_AUXILIARY_REF", "mismatch");

const expectedSemanticEpochId = "WP-RMT-002/S1/2026-08-16";
const expectedDecisionPath = "projects/domainspec-v2/development/first-production-release/decisions/2026-08-16-first-stable-foundation-candidate.md";
const expectedDecisionSha256 = "2168de08e9e0ea72a29ce74fb9a3285094aebaa05d72df34d9749e5cbdac20c9";
const expectedSemanticContractDigest = "75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7";
const semanticEpoch = manifest.semantic_plan_epoch;
if (semanticEpoch?.epoch_id !== expectedSemanticEpochId || semanticEpoch.status !== "candidate-plan-refresh" || semanticEpoch.decision?.path !== expectedDecisionPath || semanticEpoch.decision?.sha256 !== expectedDecisionSha256 || semanticEpoch.decision?.size_bytes !== 14571 || semanticEpoch.decision?.selection_id !== "SF-04") fail("WP_S1_EPOCH", "binding");
if (sha256(Buffer.from(canonicalJson(semanticEpoch.contract), "utf8")) !== expectedSemanticContractDigest || semanticEpoch.contract_digest !== expectedSemanticContractDigest) fail("WP_S1_CONTRACT_DIGEST", semanticEpoch.contract_digest);
const s1 = semanticEpoch.contract;
if (s1.version !== "domainspec.s1-durable-occurrence/v1" || JSON.stringify(s1.atomic_commit?.members) !== JSON.stringify(["state_write","durable_outbox_occurrence"]) || s1.publication?.timing !== "after-durable-commit" || s1.publication?.delivery !== "at-least-once" || s1.publication?.retry !== "idempotent-with-same-occurrence-identity" || s1.publication?.distributed_exactly_once_claim !== false || s1.state_machine?.executes_publication !== false || s1.state_machine?.executes_compensation !== false || s1.workflow?.compensation !== "forward-recovery-only" || s1.provider_proof?.fixture_evaluator !== "representability-only" || s1.decode?.closed !== true) fail("WP_S1_CONTRACT", "semantic boundary");
const expectedFaultIds = ["S1-F01","S1-F02","S1-F03","S1-F04","S1-F05","S1-F06","S1-F07","S1-F08"];
if (JSON.stringify(s1.fault_matrix?.map((row) => row.id)) !== JSON.stringify(expectedFaultIds)) fail("WP_S1_FAULT_MATRIX", "ids");

const expectedTypes = new Map([
  ["OP", ["Operation", "DS-D1.4", "architecture.OperationImplementation"]],
  ["RULE", ["Rule", "DS-D1.7", "architecture.RuleImplementation"]],
  ["IFACE", ["Interface", "DS-D1.11", "architecture.InterfaceImplementation"]],
  ["MAP", ["Mapping", "DS-D1.13", "architecture.MappingImplementation"]],
  ["EVENT", ["Event", "DS-D1.12", "architecture.EventImplementation"]],
  ["SM", ["State Machine", "DS-D1.14", "architecture.StateMachineImplementation"]],
  ["WF", ["Workflow", "DS-D1.9", "architecture.WorkflowImplementation"]]
]);
const expectedSemanticHostiles = {
  OP: ["undeclared-write","undeclared-effect","guard-bypass","order-swap","atomicity-removed","success-failure-collapse","emitted-before-commit","continuation-mismatch","read-set-drift","output-contract-overclaim"],
  RULE: ["non-boolean-return","hidden-mutation","external-effect","missing-enforces-edge","inverse-enforces-edge","undeclared-dependency","rule-calls-operation","evaluation-order-dependence","unstable-input-binding","exception-as-false"],
  IFACE: ["undeclared-exposure","exposure-drift","internal-type-leak","version-regression","compatibility-overclaim","compatibility-direction-flip","boundary-crossing","mapping-obligation-missing","transport-domain-collapse","consumer-route-outside"],
  MAP: ["source-target-swap","direction-flip","missing-required-field","undeclared-extra-field","correspondence-drift","totality-overclaim","silent-coercion","effect-policy-violation","failure-as-success","failure-detail-loss"],
  EVENT: ["non-past-tense","mutable-payload","unstable-occurrence-id","reused-occurrence-id","checkpoint-missing","checkpoint-duplicate","publish-before-commit","exactly-once-overclaim","consumer-overclaim","schema-version-drift"],
  SM: ["illegal-transition","initial-state-drift","terminal-state-drift","guard-bypass","nondeterministic-transition","executes-effect","cycle-policy-mismatch","invalid-transition-success","hidden-mutation","unstable-transition-identity"],
  WF: ["step-reorder","step-skip","step-duplicate","scope-drift","failure-continuation-mismatch","compensation-overclaim","executes-effect","stale-binding","guard-bypass","lifecycle-transition-bypass"]
};
const expectedRelAHostiles = ["relation-owner-evidence-stale","relation-source-endpoint-mismatch","relation-target-endpoint-mismatch","materialized-without-exact-assertion"];
const expectedS1Hostiles = new Map([
  ["s1/before-state-write-failure", ["RMT_S1_BEFORE_STATE_WRITE_FAILURE","RMT-OP-002","RMT-OP-006","fault-matrix:S1-F01"]],
  ["s1/between-state-and-outbox-failure", ["RMT_S1_STATE_OUTBOX_ATOMICITY_BREACH","RMT-OP-002","RMT-OP-006","fault-matrix:S1-F02"]],
  ["s1/after-outbox-before-publish-failure", ["RMT_S1_AFTER_OUTBOX_BEFORE_PUBLISH_FAILURE","RMT-EVENT-002","RMT-EVENT-006","fault-matrix:S1-F03"]],
  ["s1/send-failure", ["RMT_S1_SEND_FAILURE","RMT-EVENT-002","RMT-EVENT-006","fault-matrix:S1-F04"]],
  ["s1/success-ack-timeout", ["RMT_S1_ACKNOWLEDGEMENT_AMBIGUOUS","RMT-EVENT-002","RMT-EVENT-006","fault-matrix:S1-F05"]],
  ["s1/duplicate-reordered-delivery", ["RMT_S1_DUPLICATE_REORDERED_DELIVERY","RMT-EVENT-002","RMT-EVENT-006","fault-matrix:S1-F06"]],
  ["s1/poison-occurrence", ["RMT_S1_POISON_OCCURRENCE","RMT-EVENT-002","RMT-EVENT-006","fault-matrix:S1-F07"]],
  ["s1/recovery-replay", ["RMT_S1_RECOVERY_REPLAY_MISMATCH","RMT-EVENT-002","RMT-EVENT-007","fault-matrix:S1-F08"]],
  ["s1/closed-decode", ["RMT_S1_CLOSED_DECODE_UNKNOWN_MEMBER","RMT-SM-002","RMT-SM-006","decode-contract"]],
  ["s1/future-version", ["RMT_S1_FUTURE_VERSION","RMT-EVENT-002","RMT-EVENT-006","decode-contract"]],
  ["s1/missing-member", ["RMT_S1_MISSING_MEMBER","RMT-OP-002","RMT-OP-006","decode-contract"]],
  ["s1/mixed-commit", ["RMT_S1_MIXED_COMMIT","RMT-OP-002","RMT-OP-006","atomicity-contract"]],
  ["s1/stale-binding", ["RMT_S1_STALE_BINDING","RMT-WF-002","RMT-WF-006","binding-contract"]],
  ["s1/occurrence-reuse", ["RMT_S1_OCCURRENCE_REUSE","RMT-EVENT-002","RMT-EVENT-006","identity-contract"]],
  ["s1/rollback-after-commit", ["RMT_S1_ROLLBACK_AFTER_COMMIT","RMT-OP-002","RMT-OP-006","recovery-contract"]],
  ["s1/non-idempotent-retry", ["RMT_S1_NON_IDEMPOTENT_RETRY","RMT-EVENT-002","RMT-EVENT-007","retry-contract"]]
]);
const expectedRelationContractIds = {
  OP: ["op/enforced-by-to-guards","op/exposed-by-to-exposes","op/emitted-events-to-emits","op/workflow-step-to-binds-step"],
  RULE: ["rule/enforces-to-guards","rule/factory-validation"],
  IFACE: ["interface/exposes","interface/implemented-by-adapter"],
  MAP: ["mapping/maps-source-to-maps-from","mapping/maps-target-to-maps-to"],
  EVENT: ["event/emitted-by-operation","event/consumed-by-element"],
  SM: ["state-machine/guarded-by-rule","state-machine/has-state","state-machine/transitions"],
  WF: ["workflow/orchestrates","workflow/precedes","workflow/binds-step"]
};
if (manifest.types.length !== 7) fail("WP_TYPE_COUNT", manifest.types.length);
for (const type of manifest.types) {
  const expected = expectedTypes.get(type.prefix);
  if (!expected || type.label !== expected[0] || type.meta_type_id !== expected[1] || type.architecture_type_id !== expected[2]) fail("WP_TYPE_BINDING", type.prefix);
}

const stages = ["admission", "family", "typescript", "python", "rust", "parity", "replay", "relations", "registry-negative", "candidate"];
if (manifest.swus.length !== 70) fail("WP_SWU_COUNT", manifest.swus.length);
const byId = new Map();
const scopeOwners = new Map();
for (const swu of manifest.swus) {
  exactKeys(swu, ["id","type","stage","wave","depends_on","outcome","write_scope","status"], "WP_SWU_SHAPE");
  if (byId.has(swu.id)) fail("WP_SWU_DUPLICATE", swu.id);
  if (swu.status !== "planned" || !stages.includes(swu.stage) || !swu.outcome) fail("WP_SWU_INVALID", swu.id);
  if (!Array.isArray(swu.write_scope) || swu.write_scope.length === 0) fail("WP_SCOPE_EMPTY", swu.id);
  for (const scope of swu.write_scope) {
    if (scope.startsWith("/") || scope.includes("..") || scope.includes("\\")) fail("WP_SCOPE_PATH", `${swu.id}:${scope}`);
    if (scope.includes("implementation-conformance/ontology-experiment/") || scope.endsWith("factory-node-registry-v1.ts") || scope.includes("families/effects-connections/") || scope.includes("families/orchestration-lifecycle/")) fail("WP_SCOPE_FORBIDDEN", `${swu.id}:${scope}`);
    if (scopeOwners.has(scope)) fail("WP_SCOPE_OVERLAP", `${scopeOwners.get(scope)}/${swu.id}:${scope}`);
    scopeOwners.set(scope, swu.id);
  }
  byId.set(swu.id, swu);
}
for (const [prefix, expected] of expectedTypes) {
  const rows = manifest.swus.filter((row) => row.id.startsWith(`RMT-${prefix}-`));
  if (rows.length !== 10) fail("WP_TYPE_SWU_COUNT", `${prefix}:${rows.length}`);
  for (let index = 0; index < 10; index += 1) {
    const id = `RMT-${prefix}-${String(index + 1).padStart(3, "0")}`;
    const row = byId.get(id);
    if (!row || row.type !== expected[0] || row.stage !== stages[index]) fail("WP_TYPE_SEQUENCE", id);
  }
}

const indegree = new Map([...byId.keys()].map((id) => [id, 0]));
const outgoing = new Map([...byId.keys()].map((id) => [id, []]));
for (const swu of manifest.swus) {
  for (const dependency of swu.depends_on) {
    if (!byId.has(dependency)) fail("WP_DEPENDENCY_UNKNOWN", `${swu.id}:${dependency}`);
    indegree.set(swu.id, indegree.get(swu.id) + 1);
    outgoing.get(dependency).push(swu.id);
  }
}
const roots = [...indegree].filter(([, value]) => value === 0).map(([id]) => id).sort();
if (JSON.stringify(roots) !== JSON.stringify(["RMT-OP-001"]) || JSON.stringify(manifest.frontier) !== JSON.stringify(roots) || JSON.stringify(entry.frontier) !== JSON.stringify(roots)) fail("WP_FRONTIER", roots.join(","));
const queue = [...roots];
let visited = 0;
while (queue.length) {
  const id = queue.shift();
  visited += 1;
  for (const child of outgoing.get(id)) {
    indegree.set(child, indegree.get(child) - 1);
    if (indegree.get(child) === 0) queue.push(child);
  }
}
if (visited !== 70) fail("WP_GRAPH_CYCLE", `${visited}/70`);

if (contracts.schema_version !== "domainspec.wp-rmt-002-swu-contracts/v2" || contracts.work_pack_id !== manifest.work_pack_id || contracts.contract_count !== 70 || contracts.contracts.length !== 70) fail("WP_CONTRACT_COUNT", contracts.contracts.length);
const contractById = new Map();
for (const contract of contracts.contracts) {
  if (contractById.has(contract.swu_id) || !byId.has(contract.swu_id)) fail("WP_CONTRACT_ID", contract.swu_id);
  const swu = byId.get(contract.swu_id);
  if (contract.type !== swu.type || contract.stage !== swu.stage || contract.atomicity.partial_success !== false || contract.atomicity.receipt_written_last !== true || contract.verification.independent_read_only_audit !== true || !Array.isArray(contract.verification.commands) || contract.verification.commands.length === 0 || contract.closeout_sync.authority_effect !== "none") fail("WP_CONTRACT_INVALID", contract.swu_id);
  if (JSON.stringify(contract.atomicity.scope) !== JSON.stringify(swu.write_scope) || !Array.isArray(contract.acceptance) || contract.acceptance.length < 5) fail("WP_CONTRACT_BINDING", contract.swu_id);
  const receiptOwned = swu.write_scope.some((scope) => scope.endsWith("/") ? contract.atomicity.receipt.startsWith(scope) : contract.atomicity.receipt === scope);
  if (!receiptOwned || contract.closeout_sync.expected_receipt !== contract.atomicity.receipt) fail("WP_RECEIPT_SCOPE", contract.swu_id);
  const cargoTargets = contract.verification.commands.flatMap((command) => [...command.matchAll(/(?:^|\s)CARGO_TARGET_DIR=([^\s]+)/g)].map((match) => match[1]));
  if (swu.stage === "rust") {
    if (cargoTargets.length !== 1) fail("WP_CARGO_TARGET_COUNT", `${contract.swu_id}:${cargoTargets.length}`);
    const cargoTarget = cargoTargets[0];
    if (cargoTarget.startsWith("/") || cargoTarget.split("/").includes("..") || !swu.write_scope.includes(cargoTarget)) fail("WP_CARGO_TARGET_SCOPE", `${contract.swu_id}:${cargoTarget}`);
    const transient = contract.atomicity.transient_outputs;
    if (!Array.isArray(transient) || transient.length !== 1 || transient[0].path !== cargoTarget || transient[0].purpose !== "isolated-cargo-target" || transient[0].retention !== "none" || transient[0].cleanup_before_receipt !== true || transient[0].required_closeout_state !== "absent") fail("WP_CARGO_TARGET_LIFECYCLE", contract.swu_id);
  } else if (cargoTargets.length !== 0) {
    fail("WP_CARGO_TARGET_UNEXPECTED", contract.swu_id);
  }
  contractById.set(contract.swu_id, contract);
}
const affectedS1Types = new Set(["Operation","Event","State Machine","Workflow"]);
if (contracts.semantic_plan_binding?.epoch_id !== expectedSemanticEpochId || contracts.semantic_plan_binding?.decision_sha256 !== expectedDecisionSha256 || contracts.semantic_plan_binding?.contract_digest !== expectedSemanticContractDigest || contracts.semantic_plan_binding?.affected_contract_count !== 40 || contracts.semantic_plan_binding?.topology_changed !== false || contracts.semantic_plan_binding?.write_scope_changed !== false) fail("WP_S1_CONTRACT_HEADER", "mismatch");
let affectedContractCount = 0;
for (const contract of contracts.contracts) {
  if (!affectedS1Types.has(contract.type)) continue;
  affectedContractCount += 1;
  if (contract.semantic_plan_epoch_id !== expectedSemanticEpochId || contract.semantic_contract_digest !== expectedSemanticContractDigest || !Array.isArray(contract.semantic_inputs) || contract.semantic_inputs.length < 4 || !Array.isArray(contract.semantic_outputs) || contract.semantic_outputs.length < 2 || !contract.acceptance.includes("s1-semantic-plan-epoch-exact") || !contract.acceptance.includes("s1-contract-digest-exact") || contract.closeout_sync.required_semantic_plan_epoch_id !== expectedSemanticEpochId || contract.closeout_sync.required_semantic_contract_digest !== expectedSemanticContractDigest) fail("WP_S1_SWU_CONTRACT", contract.swu_id);
}
if (affectedContractCount !== 40) fail("WP_S1_SWU_CONTRACT_COUNT", affectedContractCount);

const expectedScopes = [...scopeOwners].map(([path, owner_swu]) => ({path, owner_swu})).sort((a,b) => a.path.localeCompare(b.path));
if (scopeBaseline.schema_version !== "domainspec.wp-rmt-002-write-scope-baseline/v2" || scopeBaseline.work_pack_id !== manifest.work_pack_id || scopeBaseline.path_count !== expectedScopes.length || scopeBaseline.all_paths_absent !== true || scopeBaseline.entries.length !== expectedScopes.length) fail("WP_BASELINE_COUNT", scopeBaseline.entries.length);
for (let index = 0; index < expectedScopes.length; index += 1) {
  const expected = expectedScopes[index];
  const actual = scopeBaseline.entries[index];
  if (actual.path !== expected.path || actual.owner_swu !== expected.owner_swu || actual.baseline_state !== "absent" || actual.planned_operation !== "create" || actual.concurrent_write_forbidden !== true) fail("WP_BASELINE_BINDING", actual.path);
  if (lstatExists(resolve(repoRoot, actual.path))) fail("WP_BASELINE_DRIFT", actual.path);
}
if (scopeBaseline.semantic_plan_binding?.epoch_id !== expectedSemanticEpochId || scopeBaseline.semantic_plan_binding?.decision_sha256 !== expectedDecisionSha256 || scopeBaseline.semantic_plan_binding?.contract_digest !== expectedSemanticContractDigest || scopeBaseline.revalidation?.checked_path_count !== expectedScopes.length || scopeBaseline.revalidation?.all_paths_absent !== true || scopeBaseline.revalidation?.scope_changed !== false) fail("WP_S1_BASELINE_BINDING", "mismatch");

if (hostileCatalogue.schema_version !== "domainspec.wp-rmt-002-hostile-catalogue/v2" || hostileCatalogue.work_pack_id !== manifest.work_pack_id || hostileCatalogue.control_count !== 114 || hostileCatalogue.base_control_count !== 98 || hostileCatalogue.s1_control_count !== 16 || hostileCatalogue.groups.length !== 7 || hostileCatalogue.policy.authority_effect !== "none" || hostileCatalogue.semantic_plan_binding?.epoch_id !== expectedSemanticEpochId || hostileCatalogue.semantic_plan_binding?.decision_sha256 !== expectedDecisionSha256 || hostileCatalogue.semantic_plan_binding?.contract_digest !== expectedSemanticContractDigest) fail("WP_HOSTILE_COUNT", hostileCatalogue.control_count);
const hostileIds = new Set();
for (const group of hostileCatalogue.groups) {
  if (!expectedTypes.has(group.prefix) || group.type !== expectedTypes.get(group.prefix)[0] || group.accounting !== "14/14" || group.semantic_controls !== "10/10" || group.rel_a_controls !== "4/4" || group.controls.length !== 14) fail("WP_HOSTILE_GROUP", group.prefix);
  const expectedOwner = `RMT-${group.prefix}-002`;
  const expectedParity = `RMT-${group.prefix}-006`;
  const expectedRelations = `RMT-${group.prefix}-008`;
  const familyScope = byId.get(expectedOwner).write_scope.find((scope) => scope.includes("/families/"));
  const relationControls = group.controls.filter((control) => control.hostile_class === "rel-a-evidence");
  if (relationControls.length !== 4 || group.controls.filter((control) => control.hostile_class === "type-semantic").length !== 10) fail("WP_REL_A_CONTROLS", group.prefix);
  const expectedIds = [...expectedSemanticHostiles[group.prefix], ...expectedRelAHostiles].map((id) => `${group.prefix.toLowerCase()}/${id}`).sort();
  const actualIds = group.controls.map((control) => control.hostile_id).sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) fail("WP_HOSTILE_EXACT_SET", group.prefix);
  for (const control of group.controls) {
    const expectedProof = control.hostile_class === "rel-a-evidence" ? expectedRelations : expectedParity;
    const suffix = control.hostile_id.split("/")[1];
    const relCodes = {"relation-owner-evidence-stale":"RMT_RELATION_OWNER_EVIDENCE_STALE","relation-source-endpoint-mismatch":"RMT_RELATION_SOURCE_ENDPOINT_MISMATCH","relation-target-endpoint-mismatch":"RMT_RELATION_TARGET_ENDPOINT_MISMATCH","materialized-without-exact-assertion":"RMT_RELATION_ASSERTION_REQUIRED"};
    const expectedCode = control.hostile_class === "rel-a-evidence" ? relCodes[suffix] : `RMT_${group.prefix}_${suffix.replaceAll("-", "_").toUpperCase()}`;
    if (hostileIds.has(control.hostile_id) || control.fixture_owner_swu !== expectedOwner || control.proof_owner_swu !== expectedProof || control.non_noop_required !== true || control.expected_code !== expectedCode || !control.fixture_path.startsWith(familyScope)) fail("WP_HOSTILE_BINDING", control.hostile_id);
    hostileIds.add(control.hostile_id);
  }
}
if (!Array.isArray(hostileCatalogue.cross_type_controls) || hostileCatalogue.cross_type_controls.length !== expectedS1Hostiles.size) fail("WP_S1_HOSTILE_COUNT", hostileCatalogue.cross_type_controls?.length);
for (const control of hostileCatalogue.cross_type_controls) {
  const expected = expectedS1Hostiles.get(control.hostile_id);
  const owner = byId.get(control.fixture_owner_swu);
  const familyScope = owner?.write_scope.find((scope) => scope.includes("/families/"));
  if (!expected || hostileIds.has(control.hostile_id) || control.hostile_class !== "s1-cross-boundary" || control.expected_code !== expected[0] || control.fixture_owner_swu !== expected[1] || control.proof_owner_swu !== expected[2] || control.category !== expected[3] || control.non_noop_required !== true || !familyScope || !control.fixture_path.startsWith(familyScope) || !control.required_observation || !control.required_outcome) fail("WP_S1_HOSTILE_BINDING", control.hostile_id);
  hostileIds.add(control.hostile_id);
}
if (hostileIds.size !== 114) fail("WP_HOSTILE_TOTAL", hostileIds.size);

const sourceResults = [];
for (const ref of manifest.source_bindings) {
  const path = resolve(repoRoot, ref.path);
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) fail("WP_SOURCE_KIND", ref.path);
  const bytes = read(path);
  if (bytes.length !== ref.size_bytes || sha256(bytes) !== ref.sha256) fail("WP_SOURCE_STALE", ref.role);
  sourceResults.push(ref.role);
}
if (manifest.source_bindings.length !== 29 || new Set(manifest.source_bindings.map((ref) => ref.role)).size !== 29 || new Set(manifest.source_bindings.map((ref) => ref.path)).size !== 29) fail("WP_SOURCE_DENOMINATOR", manifest.source_bindings.length);
const sourceByRole = new Map(manifest.source_bindings.map((ref) => [ref.role, ref]));
const s1DecisionSource = sourceByRole.get("stable_foundation_s1_owner_decision");
if (!s1DecisionSource || s1DecisionSource.path !== expectedDecisionPath || s1DecisionSource.sha256 !== expectedDecisionSha256 || s1DecisionSource.size_bytes !== 14571) fail("WP_S1_DECISION_SOURCE", "mismatch");
const continuationSourceRoles = [
  "ontology_v2_validator_repair_owner_decision",
  "ontology_v2_validator_repair_package_receipt",
  "ontology_v2_repaired_apply_package_validator",
  "ontology_v2_validator_repair_live_apply_receipt"
];
for (const role of continuationSourceRoles) if (!sourceByRole.has(role)) fail("WP_CONTINUATION_SOURCE_MISSING", role);
const sourcePaths = new Set(manifest.source_bindings.map((ref) => ref.path));
const route = entry.execution_policy.allowed_routes.find((candidate) => candidate.frontier_swu === "RMT-OP-001");
if (!route || !route.expected_receipt.startsWith(route.write_scope[0])) fail("WP_ROUTE_RECEIPT_SCOPE", route?.expected_receipt ?? "missing");
const requiredS1PlanTargets = ["WORK-PACK.md","IMPLEMENTATION-LAYERING.md","EXECUTION-PACK.md","DISTILL-PLAN-VALIDATION.md","PLAN-TRANSPORT.md","GAP-LEDGER.md","SWU-MANIFEST.json","SWU-CONTRACTS.json","HOSTILE-CATALOGUE.json","RELATION-CONTRACTS.json","WRITE-SCOPE-BASELINE.json","VALIDATION-RESULT.json","EXECUTION-ENTRY.json","EXECUTION-ENTRY-VALIDATION.json","validate-work-pack.mjs","tasks/TASK-RMT-OP.md","tasks/TASK-RMT-EVENT.md","tasks/TASK-RMT-SM.md","tasks/TASK-RMT-WF.md","waves/W0-OPERATION.md","waves/W2-MAPPING-EVENT.md","waves/W3-STATE-MACHINE-WORKFLOW.md"].map(planRelative);
for (const required of requiredS1PlanTargets) if (!route.required_inputs.includes(required)) fail("WP_ROUTE_PLAN_INPUT", required);
const logicalPlanPrefix = `${planRelative("")}/`;
const routePlanInputs = route.required_inputs.filter((input) => input.startsWith(logicalPlanPrefix)).sort();
if (JSON.stringify(routePlanInputs) !== JSON.stringify([...requiredS1PlanTargets].sort())) fail("WP_ROUTE_PLAN_DENOMINATOR", routePlanInputs.length);
const precedentPaths = manifest.source_bindings.filter((ref) => ref.role.startsWith("operation_precedent_") || ref.role.startsWith("w3_precedent_") || ref.role === "rel_a_relation_ownership_decision").map((ref) => ref.path);
for (const required of precedentPaths) if (!route.required_inputs.includes(required)) fail("WP_ROUTE_PRECEDENT_INPUT", required);
const continuationPaths = continuationSourceRoles.map((role) => sourceByRole.get(role).path);
if (route.required_inputs.length !== 43 || new Set(route.required_inputs).size !== 43 || !route.required_inputs.includes(expectedDecisionPath)) fail("WP_ROUTE_INPUT_DENOMINATOR", route.required_inputs.length);
for (const required of continuationPaths) if (!route.required_inputs.includes(required)) fail("WP_ROUTE_CONTINUATION_INPUT", required);
for (const input of route.required_inputs) {
  const logicalPath = resolve(repoRoot, input);
  const path = input.startsWith(logicalPlanPrefix) ? join(planRoot, relative(logicalPlanRoot, logicalPath)) : logicalPath;
  if (!lstatExists(path) || (!sourcePaths.has(input) && !input.startsWith(logicalPlanPrefix))) fail("WP_ROUTE_INPUT", input);
}

const history = manifest.prerequisite_history;
const priorBlocker = history?.prior_blocker;
const satisfiedBy = history?.satisfied_by;
if (priorBlocker?.lifecycle_status !== "historical-resolved" || priorBlocker.result !== "block" || satisfiedBy?.result !== "pass" || satisfiedBy.authority_effect !== "none" || satisfiedBy.independent_parent_replay !== "pass") fail("WP_PREREQUISITE_HISTORY", "invalid");
const historicalReceiptPath = resolve(repoRoot, priorBlocker.receipt_path);
const historicalReceiptBytes = inspectBoundFile(historicalReceiptPath, { sha256: priorBlocker.receipt_sha256, size_bytes: priorBlocker.receipt_size_bytes }, "WP_HISTORICAL_RECEIPT_DRIFT");
const historicalReceipt = JSON.parse(historicalReceiptBytes.toString("utf8"));
if (historicalReceipt.result !== "block" || historicalReceipt.rollback?.attempted !== false || historicalReceipt.current_state?.promotion_records !== 0) fail("WP_HISTORICAL_RECEIPT", historicalReceipt.result);
const sidecarReceiptPath = resolve(repoRoot, priorBlocker.sidecar_receipt_path);
const sidecarReceiptBytes = inspectBoundFile(sidecarReceiptPath, { sha256: priorBlocker.sidecar_receipt_sha256, size_bytes: priorBlocker.sidecar_receipt_size_bytes }, "WP_SIDECAR_DRIFT");
const sidecarReceipt = JSON.parse(sidecarReceiptBytes.toString("utf8"));
if (sidecarReceipt.result !== "pass" || sidecarReceipt.classification?.ordering_and_error_classification_only !== true || sidecarReceipt.classification?.semantic_rollback_generation_hole !== false) fail("WP_SIDECAR_RECEIPT", sidecarReceipt.result);

const decisionPath = resolve(repoRoot, satisfiedBy.owner_decision_path);
const ownerDecisionBytes = inspectBoundFile(decisionPath, { sha256: satisfiedBy.owner_decision_sha256, size_bytes: satisfiedBy.owner_decision_size_bytes }, "WP_OWNER_DECISION_DRIFT");
const ownerDecision = JSON.parse(ownerDecisionBytes.toString("utf8"));
if (ownerDecision.result !== "pass" || ownerDecision.selected_option_id !== "ACCEPT-ONE-TARGET-REPAIR" || ownerDecision.source?.exact_response !== "ACCEPT-ONE-TARGET-REPAIR" || ownerDecision.accepted_repair?.receipt_sha256 !== satisfiedBy.repair_receipt_sha256 || ownerDecision.authorized_action?.postimage_sha256 !== satisfiedBy.repaired_validator_sha256 || ownerDecision.authority_effect !== "none") fail("WP_OWNER_DECISION_INVALID", ownerDecision.selected_option_id);

const repairReceiptPath = resolve(repoRoot, satisfiedBy.repair_receipt_path);
const repairReceiptBytes = inspectBoundFile(repairReceiptPath, { sha256: satisfiedBy.repair_receipt_sha256, size_bytes: satisfiedBy.repair_receipt_size_bytes }, "WP_REPAIR_RECEIPT_DRIFT");
const repairReceipt = JSON.parse(repairReceiptBytes.toString("utf8"));
if (repairReceipt.result !== "pass" || repairReceipt.status !== "pass" || repairReceipt.pre_receipt_inventory?.sha256 !== satisfiedBy.repair_inventory_sha256 || repairReceipt.target_inventory?.target?.staged_postimage?.sha256 !== satisfiedBy.repaired_validator_sha256 || repairReceipt.authority_effect !== "none") fail("WP_REPAIR_RECEIPT_INVALID", repairReceipt.result);
verifyBoundInventory(repairReceiptPath, repairReceipt.pre_receipt_inventory, "WP_REPAIR_INVENTORY_DRIFT");

inspectBoundFile(resolve(repoRoot, satisfiedBy.repaired_validator_path), { sha256: satisfiedBy.repaired_validator_sha256, size_bytes: satisfiedBy.repaired_validator_size_bytes }, "WP_REPAIRED_VALIDATOR_DRIFT");
const currentReceiptPath = resolve(repoRoot, satisfiedBy.receipt_path);
const currentReceiptBytes = inspectBoundFile(currentReceiptPath, { sha256: satisfiedBy.receipt_sha256, size_bytes: satisfiedBy.receipt_size_bytes }, "WP_CURRENT_RECEIPT_DRIFT");
const currentReceipt = JSON.parse(currentReceiptBytes.toString("utf8"));
if (currentReceipt.result !== "pass" || currentReceipt.status !== "pass" || currentReceipt.pre_receipt_inventory?.sha256 !== satisfiedBy.evidence_inventory_sha256 || currentReceipt.pre_receipt_inventory?.file_count !== satisfiedBy.evidence_file_count || currentReceipt.pre_receipt_inventory?.total_size_bytes !== satisfiedBy.evidence_total_size_bytes || currentReceipt.target?.postimage?.sha256 !== satisfiedBy.repaired_validator_sha256 || currentReceipt.post_apply_validation?.hostile_controls !== "37/37" || currentReceipt.post_apply_validation?.ordinary_live_validator_check_count !== 24 || currentReceipt.authority_effect !== "none") fail("WP_CURRENT_RECEIPT_INVALID", currentReceipt.result);
verifyBoundInventory(currentReceiptPath, currentReceipt.pre_receipt_inventory, "WP_CURRENT_RECEIPT_INVENTORY_DRIFT");

const prerequisite = entry.pre_execution_owner_prerequisite;
if (prerequisite.status !== "satisfied" || prerequisite.current_receipt !== satisfiedBy.receipt_path || prerequisite.current_receipt_sha256 !== satisfiedBy.receipt_sha256 || prerequisite.current_receipt_size_bytes !== satisfiedBy.receipt_size_bytes || prerequisite.current_result !== "pass" || prerequisite.current_evidence_inventory_sha256 !== satisfiedBy.evidence_inventory_sha256 || prerequisite.current_validation?.hostile_replay !== "pass 37/37" || prerequisite.current_validation?.ordinary_live_validator !== "pass 24/24" || prerequisite.current_validation?.authority_effect !== "none") fail("WP_PREREQUISITE_CURRENT", "mismatch");
if (prerequisite.repair_authorization?.owner_decision_sha256 !== satisfiedBy.owner_decision_sha256 || prerequisite.repair_authorization?.repair_receipt_sha256 !== satisfiedBy.repair_receipt_sha256 || prerequisite.repair_authorization?.repaired_validator_sha256 !== satisfiedBy.repaired_validator_sha256) fail("WP_PREREQUISITE_REPAIR_CHAIN", "mismatch");
if (prerequisite.historical_blocker?.status !== "historical-resolved" || prerequisite.historical_blocker?.receipt_sha256 !== priorBlocker.receipt_sha256 || prerequisite.historical_blocker?.sidecar_receipt_sha256 !== priorBlocker.sidecar_receipt_sha256) fail("WP_PREREQUISITE_HISTORICAL", "mismatch");
const entrySemantic = prerequisite.semantic_plan_epoch;
if (entrySemantic?.epoch_id !== expectedSemanticEpochId || entrySemantic.decision_path !== expectedDecisionPath || entrySemantic.decision_sha256 !== expectedDecisionSha256 || entrySemantic.contract_digest !== expectedSemanticContractDigest || entrySemantic.required_plan_target_count !== 22 || entry.execution_entry.selected_unit !== null || entry.execution_entry.route_id !== null) fail("WP_ENTRY_S1_BINDING", "mismatch");
const expectedAllowedRoutesDigest = sha256(Buffer.from(canonicalJson(entry.execution_policy.allowed_routes), "utf8"));
if (entry.execution_policy.allowed_routes_digest !== expectedAllowedRoutesDigest) fail("WP_ROUTE_DIGEST", entry.execution_policy.allowed_routes_digest);

const ontology = json(resolve(repoRoot, "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json"));
const projection = json(resolve(repoRoot, "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json"));
const state = [ontology.implementation_instances.length, ontology.supporting_instances.length, ontology.relation_instances.length, ontology.relation_instance_blueprints.length, ontology.promotion_records.length];
if (JSON.stringify(state) !== JSON.stringify([6,0,0,4,0]) || ontology.authority_effect !== "none") fail("WP_LIVE_STATE", state.join("/"));
if (projection.derived_projection.length !== 6 || projection.derived_supporting_projection.length !== 0 || projection.derived_relation_projection.length !== 0 || projection.authority_effect !== "none") fail("WP_PROJECTION_STATE", "invalid");
for (const type of manifest.types) {
  const row = projection.meta_types.find((candidate) => candidate.meta_type_id === type.meta_type_id);
  if (!row || row.label !== type.label || row.maturity !== "active" || row.mapping_status !== "candidate-mapped" || row.architecture_type_id !== type.architecture_type_id) fail("WP_ACTIVE_ROW", type.meta_type_id);
}

if (relationContracts.schema_version !== "domainspec.wp-rmt-002-relation-contracts/v1" || relationContracts.work_pack_id !== manifest.work_pack_id || relationContracts.type_contracts.length !== 7 || relationContracts.policy.authority_effect !== "none" || relationContracts.rel_a_decision.selected_option !== "REL-A") fail("WP_RELATION_CONTRACTS", "header");
const decisionBytes = read(resolve(repoRoot, relationContracts.rel_a_decision.path));
if (decisionBytes.length !== relationContracts.rel_a_decision.size_bytes || sha256(decisionBytes) !== relationContracts.rel_a_decision.sha256) fail("WP_REL_A_DECISION", "stale");
const relationDefinitions = new Map(ontology.relation_definitions.map((definition) => [definition.relation_id, definition]));
const relationContractIds = new Set();
let relationContractCount = 0;
for (const typeContract of relationContracts.type_contracts) {
  const expectedType = expectedTypes.get(typeContract.prefix);
  if (!expectedType || typeContract.type !== expectedType[0] || typeContract.owner_swu !== `RMT-${typeContract.prefix}-008` || byId.get(typeContract.owner_swu)?.stage !== "relations" || typeContract.contracts.length < 2) fail("WP_RELATION_OWNER", typeContract.prefix);
  if (JSON.stringify(typeContract.contracts.map((contract) => contract.contract_id).sort()) !== JSON.stringify([...expectedRelationContractIds[typeContract.prefix]].sort())) fail("WP_RELATION_EXACT_SET", typeContract.prefix);
  const unmapped = new Set(typeContract.unmapped_domain_relations);
  if (unmapped.size !== typeContract.unmapped_domain_relations.length) fail("WP_RELATION_UNMAPPED", typeContract.prefix);
  for (const contract of typeContract.contracts) {
    const definition = relationDefinitions.get(contract.architecture_relation_id);
    if (!definition || relationContractIds.has(contract.contract_id) || !contract.domain_surface || !contract.translation || !contract.assertion_owner_mapping || contract.cycle_policy !== definition.cycle_policy) fail("WP_RELATION_CONTRACT", contract.contract_id);
    if (!contract.source_types.every((type) => definition.source_types.includes(type)) || !contract.target_types.every((type) => definition.target_types.includes(type))) fail("WP_RELATION_ENDPOINT_TYPES", contract.contract_id);
    relationContractIds.add(contract.contract_id);
    relationContractCount += 1;
  }
}
if (relationContractCount !== 18) fail("WP_RELATION_COUNT", relationContractCount);
if (relationContracts.semantic_plan_binding?.epoch_id !== expectedSemanticEpochId || relationContracts.semantic_plan_binding?.decision_sha256 !== expectedDecisionSha256 || relationContracts.semantic_plan_binding?.contract_digest !== expectedSemanticContractDigest || relationContracts.semantic_plan_binding?.relation_topology_changed !== false) fail("WP_S1_RELATION_HEADER", "mismatch");
const relationByPrefix = new Map(relationContracts.type_contracts.map((row) => [row.prefix, row]));
if (relationByPrefix.get("OP")?.s1_handle_contract?.handle !== "operation-transaction-effect-group/v1" || relationByPrefix.get("EVENT")?.s1_handle_contract?.handle !== "durable-occurrence/v1" || relationByPrefix.get("SM")?.s1_handle_contract?.handle !== "state-machine-transition-effect-intent/v1" || relationByPrefix.get("WF")?.s1_handle_contract?.compensation !== "forward-recovery-only") fail("WP_S1_RELATION_HANDLES", "mismatch");

const requiredDocuments = ["WORK-PACK.md","IMPLEMENTATION-LAYERING.md","EXECUTION-PACK.md","GAP-LEDGER.md","PLAN-TRANSPORT.md","DISTILL-PLAN-VALIDATION.md","PLAN-RECEIPT.json",...manifest.types.map((type) => `tasks/TASK-RMT-${type.prefix}.md`),"waves/W0-OPERATION.md","waves/W1-RULE-INTERFACE.md","waves/W2-MAPPING-EVENT.md","waves/W3-STATE-MACHINE-WORKFLOW.md","SWU-MANIFEST.json","SWU-CONTRACTS.json","WRITE-SCOPE-BASELINE.json","HOSTILE-CATALOGUE.json","RELATION-CONTRACTS.json","EXECUTION-ENTRY.json","VALIDATION-RESULT.json","EXECUTION-ENTRY-VALIDATION.json","validate-work-pack.mjs"];
for (const name of requiredDocuments) {
  const path = join(planRoot, name);
  const stat = lstatSync(path);
  const bytes = read(path);
  if (!stat.isFile() || stat.isSymbolicLink() || bytes.includes(13) || bytes.at(-1) !== 10 || /[ \t]+$/m.test(bytes.toString("utf8"))) fail("WP_HYGIENE", name);
}
const historicalPlanReceiptBytes = inspectBoundFile(join(planRoot, "PLAN-RECEIPT.json"), { sha256: "d4a2fe31e1c39557f0c7012f760f67ae695634f6ddaf3757c426576e78794e40", size_bytes: 7433 }, "WP_HISTORICAL_PLAN_RECEIPT_DRIFT");
const historicalPlanReceipt = JSON.parse(historicalPlanReceiptBytes.toString("utf8"));
if (historicalPlanReceipt.result !== "pass" || historicalPlanReceipt.execution_entry?.state !== "blocked" || historicalPlanReceipt.plan_accounting?.source_bindings !== "24/24" || historicalPlanReceipt.plan_accounting?.blocked_route_inputs !== "23/23") fail("WP_HISTORICAL_PLAN_RECEIPT_INVALID", historicalPlanReceipt.result);
const distillValidation = read(join(planRoot, "DISTILL-PLAN-VALIDATION.md")).toString("utf8");
if (!distillValidation.includes("**PASS** for staged plan coherence and bounded handoff only") || !distillValidation.includes(expectedSemanticEpochId) || !distillValidation.includes(expectedSemanticContractDigest) || !distillValidation.includes("RMT-OP-001") || !distillValidation.includes("independent plan review") || !distillValidation.includes("No SWU is selected")) fail("WP_DISTILL_EVIDENCE", "DISTILL-PLAN-VALIDATION.md");
const workPackDocument = read(join(planRoot, "WORK-PACK.md")).toString("utf8");
const executionPackDocument = read(join(planRoot, "EXECUTION-PACK.md")).toString("utf8");
if (!workPackDocument.includes(expectedSemanticEpochId) || !workPackDocument.includes(expectedSemanticContractDigest) || !workPackDocument.includes(satisfiedBy.receipt_sha256) || !workPackDocument.includes("no SWU is selected or executed")) fail("WP_DOCUMENT_STATE", "WORK-PACK.md");
if (!executionPackDocument.includes("`selection-ready`") || !executionPackDocument.includes(expectedSemanticEpochId) || !executionPackDocument.includes(expectedSemanticContractDigest) || !executionPackDocument.includes(satisfiedBy.receipt_sha256) || !executionPackDocument.includes("No unit or route is selected")) fail("WP_DOCUMENT_STATE", "EXECUTION-PACK.md");

const output = {
  schema_version: "domainspec.wp-rmt-002-plan-validation/v1",
  result: "pass",
  work_pack_id: "WP-RMT-002",
  authoring: { complexity: "high", plan_shape: "split", admission_timing: "selected-unit-at-task-session", full_dispatch: "descriptive-two-lane-parent-route-no-execution-dispatch" },
  semantic_plan_epoch: { epoch_id: expectedSemanticEpochId, decision_sha256: expectedDecisionSha256, contract_digest: expectedSemanticContractDigest, affected_types: "4/4", affected_swu_contracts: "40/40", fault_matrix: "8/8", additional_s1_controls: "8/8", topology_changed: false, write_scope_changed: false },
  graph: { types: "7/7", swus: "70/70", stages_per_type: "10/10", roots: roots, acyclic: true, disjoint_declared_write_scopes: `${scopeOwners.size}/${scopeOwners.size}` },
  task_contracts: { atomic_acceptance_verification_closeout: "70/70", terminal_receipts_within_owned_scope: "70/70", exact_command_sets: "70/70", cargo_target_scope_and_cleanup: "7/7" },
  write_scope_baseline: { exact_absent_paths: `${scopeBaseline.entries.length}/${scopeBaseline.entries.length}`, unique_owners: `${scopeOwners.size}/${scopeOwners.size}`, drift: false },
  hostile_catalogue: { executable_planned_controls: "114/114", base_controls: "98/98", s1_cross_boundary_controls: "16/16", base_per_type: "14/14", semantic_per_type: "10/10", rel_a_per_type: "4/4", exact_diagnostics_required: true },
  sources: { exact: `${sourceResults.length}/${manifest.source_bindings.length}`, roles: sourceResults },
  live_ontology: { state: "6/0/0/4/0", derived_projection: "6/0/0", authority_effect: "none" },
  relation_contracts: { type_contracts: "7/7", translation_contracts: "18/18", rel_a_decision: "REL-A", materialization_fallback: "deferred-blueprint" },
  historical_plan_evidence: { plan_receipt: "immutable blocked snapshot", prior_distill_validation: "superseded historical blocked-handoff review", current_distill_validation: "S1 staged-plan coherence pass with independent review pending", prior_block_receipt: priorBlocker.receipt_sha256 },
  execution_entry: { state: "selection-ready", live_effect_from_staging: false, current_pass_receipt: satisfiedBy.receipt_sha256, satisfied_by_inventory: satisfiedBy.evidence_inventory_sha256, future_frontier: "RMT-OP-001", selected_unit: null, route_id: null, next_owner: "implementation-readiness:execute", self_contained_route_inputs: `${route.required_inputs.length}/${route.required_inputs.length}`, allowed_routes_digest: entry.execution_policy.allowed_routes_digest, authority_effect: "none" },
  boundaries: { implementation_swu_selected: false, implementation_swu_executed: false, registry_admission: false, ontology_admission: false, promotion_records: 0, promotion: false, publication: false, release: false, deployment: false, production_readiness: false },
  authority_effect: "none"
};
const storedValidation = json(join(planRoot, "VALIDATION-RESULT.json"));
if (JSON.stringify(storedValidation) !== JSON.stringify(output)) fail("WP_STORED_VALIDATION_STALE", "VALIDATION-RESULT.json");
const entryValidation = json(join(planRoot, "EXECUTION-ENTRY-VALIDATION.json"));
if (entryValidation.status !== "pass" || entryValidation.allowed_routes_digest !== entry.execution_policy.allowed_routes_digest || entryValidation.work_pack_id !== manifest.work_pack_id || entryValidation.authority_effect !== "none") fail("WP_ENTRY_VALIDATION_STALE", "EXECUTION-ENTRY-VALIDATION.json");
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
