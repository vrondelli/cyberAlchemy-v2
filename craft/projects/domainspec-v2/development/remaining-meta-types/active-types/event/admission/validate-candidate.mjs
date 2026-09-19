import {createHash} from "node:crypto";
import {existsSync, readFileSync, readdirSync, statSync} from "node:fs";
import {resolve} from "node:path";

const root = resolve(".");
const candidatePath = resolve(process.argv[2] ?? "");
const load = path => JSON.parse(readFileSync(path, "utf8"));
const sha = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const fail = message => { throw new Error(`RMT_EVENT_CANDIDATE_INVALID:${message}`); };
const verifyRef = (ref, label) => {
  const path = resolve(root, ref?.path ?? "");
  if (!existsSync(path) || statSync(path).size !== ref.size_bytes || sha(path) !== ref.sha256) fail(`ref:${label}`);
};

if (!existsSync(candidatePath)) fail("missing-candidate");
const candidate = load(candidatePath);
if (candidate.schema_version !== "domainspec.meta-type-implementation-candidate/v1" || candidate.work_pack_id !== "WP-RMT-002" || candidate.task_id !== "TASK-RMT-EVENT" || candidate.projection_swu_id !== "RMT-EVENT-010" || candidate.meta_type?.id !== "DS-D1.12" || candidate.architecture_implementation?.architecture_type_id !== "architecture.EventImplementation") fail("identity");
if (candidate.semantic_plan?.epoch_id !== "WP-RMT-002/S1/2026-08-16" || candidate.semantic_plan?.contract_digest !== "75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7") fail("s1-binding");

const receiptIds = ["RMT-EVENT-006", "RMT-EVENT-007", "RMT-EVENT-008", "RMT-EVENT-009"];
if (JSON.stringify(candidate.projection_source?.receipt_order) !== JSON.stringify(receiptIds)) fail("receipt-order");
const receipts = {};
for (const expected of receiptIds) {
  const ref = candidate.projection_source.proof_receipts.find(({swu_id}) => swu_id === expected);
  if (!ref) fail(`receipt-ref:${expected}`);
  verifyRef(ref, expected);
  const receipt = load(resolve(root, ref.path));
  if (receipt.result !== "pass" || receipt.authority_effect !== "none" || receipt.semantic_plan_epoch_id !== candidate.semantic_plan.epoch_id || receipt.semantic_contract_digest !== candidate.semantic_plan.contract_digest) fail(`receipt-result:${expected}`);
  receipts[expected] = receipt;
}

const s1Ids = ["s1/after-outbox-before-publish-failure", "s1/send-failure", "s1/success-ack-timeout", "s1/duplicate-reordered-delivery", "s1/poison-occurrence", "s1/recovery-replay", "s1/future-version", "s1/occurrence-reuse", "s1/non-idempotent-retry"];
const owner006 = ["s1/after-outbox-before-publish-failure", "s1/send-failure", "s1/success-ack-timeout", "s1/duplicate-reordered-delivery", "s1/poison-occurrence", "s1/future-version", "s1/occurrence-reuse"];
const owner007 = ["s1/recovery-replay", "s1/non-idempotent-retry"];
if (JSON.stringify(receipts["RMT-EVENT-006"].proof_closure?.s1_hostile_ids) !== JSON.stringify(owner006) || receipts["RMT-EVENT-006"].proof_closure?.s1_cross_boundary_count !== 7) fail("receipt-006-s1-closure");
if (JSON.stringify(receipts["RMT-EVENT-007"].proof_closure?.s1_hostile_ids) !== JSON.stringify(owner007) || receipts["RMT-EVENT-007"].proof_closure?.s1_cross_boundary_count !== 2) fail("receipt-007-s1-closure");
if (receipts["RMT-EVENT-008"].owner_evidence?.sha256 !== "3eea502705e2960ee328a3d86931ccfb13090ad7c2d682223f9816f68d629e0e" || receipts["RMT-EVENT-008"].proof?.rel_a_hostiles_killed !== 4) fail("receipt-008-operation-owner");
if (receipts["RMT-EVENT-009"].registry?.sha256 !== "2497f2e047e023de2738bac4b815e6b0212560dcfc8053982c94f4a529a9f51b" || receipts["RMT-EVENT-009"].registry_changed !== false) fail("receipt-009-registry");

for (const [label, ref] of [["admission", candidate.admission_context.admission], ["source-inventory", candidate.admission_context.source_inventory], ...candidate.admission_context.dependencies.map(ref => [`dependency:${ref.swu_id}`, ref]), ["operation-owner", candidate.admission_context.relation_owner_source], ["factory-request", candidate.architecture_implementation.source_binding_request], ["w3-contracts", candidate.architecture_implementation.w3_reuse.contracts], ["w3-observer", candidate.architecture_implementation.w3_reuse.observer], ["s1-catalogue", candidate.architecture_implementation.s1_extension.hostile_catalogue], ["s1-contracts", candidate.architecture_implementation.s1_extension.contracts], ["s1-decoder", candidate.architecture_implementation.s1_extension.decoder], ["s1-evaluator", candidate.architecture_implementation.s1_extension.evaluator]]) verifyRef(ref, label);
if (candidate.admission_context.relation_owner_source.sha256 !== "3eea502705e2960ee328a3d86931ccfb13090ad7c2d682223f9816f68d629e0e" || candidate.admission_context.relation_owner_source.size_bytes !== 12100) fail("operation-owner-binding");
if (candidate.architecture_implementation.w3_reuse.contracts.sha256 !== "ab44599370cc64f30dc75780cd4cff23220926049a2eefda42ed84ed4a687193" || candidate.architecture_implementation.w3_reuse.observer.sha256 !== "54ef9b154a1f5ed9be7cedc4ce9b73391803e51935b3282ba0fc323b75f58313") fail("w3-unchanged");
if (candidate.architecture_implementation.s1_extension.hostile_catalogue.sha256 !== "41d5937f8bb6cc40475c23e228248130fe383b7930f09078fc7c98d26873505e" || candidate.architecture_implementation.s1_extension.hostile_directory_total !== 23) fail("frozen-s1-catalogue");

const catalogue = load(resolve(root, candidate.architecture_implementation.s1_extension.hostile_catalogue.path));
const frozenIds = catalogue.cross_type_controls.filter(({fixture_owner_swu}) => fixture_owner_swu === "RMT-EVENT-002").map(({hostile_id}) => hostile_id);
if (JSON.stringify(frozenIds) !== JSON.stringify(s1Ids)) fail("frozen-s1-denominator");
const hostileDir = resolve(root, "projects/domainspec-v2/impl/architecture-conformance/families/past-tense-event/hostiles");
if (readdirSync(hostileDir).filter(name => name.endsWith(".json")).length !== 23) fail("hostile-directory-total");
if (candidate.s1_control_closure?.frozen_denominator !== 9 || candidate.s1_control_closure?.hostile_directory_total !== 23 || JSON.stringify(candidate.s1_control_closure?.hostile_ids) !== JSON.stringify(s1Ids) || JSON.stringify(candidate.s1_control_closure?.proof_owner_split) !== JSON.stringify({"RMT-EVENT-006": 7, "RMT-EVENT-007": 2}) || Object.values(candidate.s1_control_closure?.required_outcomes ?? {}).length !== 9 || Object.values(candidate.s1_control_closure.required_outcomes).some(value => value !== true)) fail("s1-control-closure");

if (JSON.stringify(candidate.architecture_implementation.direct_provider_ids) !== JSON.stringify(["event-typescript-v1", "event-python-v1", "event-rust-v1"]) || candidate.architecture_implementation.provider_registration_status !== "unregistered") fail("providers");
if (candidate.targets?.length !== 3 || candidate.targets.some(({registered}) => registered !== false)) fail("targets");
for (const target of candidate.targets) { verifyRef(target.source, `target:${target.language}`); verifyRef(target.provider, `provider:${target.language}`); verifyRef(target.binding, `binding:${target.language}`); }
const fields = ["occurrence_id", "persistence_checkpoint", "publication_attempt_id", "acknowledgement_state", "delivery_observation", "consumption_observation"].sort();
if (candidate.durable_occurrence?.handle !== "durable-occurrence/v1" || JSON.stringify(Object.keys(candidate.durable_occurrence.observation).sort()) !== JSON.stringify(fields) || candidate.durable_occurrence.publication_is_separate_from_commit !== true || candidate.durable_occurrence.distributed_exactly_once_claim !== false) fail("durable-handle");
if (candidate.portable_parity?.semantic_hostiles_killed !== 10 || candidate.portable_parity?.s1_hostiles_killed !== 7 || candidate.portable_parity?.native_hash_byte_comparison !== false || candidate.deterministic_replay?.s1_hostiles_killed !== 2 || JSON.stringify(candidate.deterministic_replay?.s1_hostile_ids) !== JSON.stringify(owner007) || candidate.deterministic_replay?.provider_attempts_per_process !== 12 || candidate.deterministic_replay?.owned_transient_residue_count !== 0) fail("proof-accounting");

const lifecycleReceipts = [
  "projects/domainspec-v2/development/remaining-meta-types/active-types/event/admission/RECEIPT.json",
  "projects/domainspec-v2/impl/architecture-conformance/families/past-tense-event/RMT-EVENT-002.RECEIPT.json",
  "projects/domainspec-v2/impl/architecture-conformance/realizations/event/typescript/past-tense-v1/RECEIPT.json",
  "projects/domainspec-v2/impl/architecture-conformance/realizations/event/python/past-tense-v1/RECEIPT.json",
  "projects/domainspec-v2/impl/architecture-conformance/realizations/event/rust/past-tense-v1/RECEIPT.json",
];
if (lifecycleReceipts.some(path => existsSync(resolve(root, path)))) fail("lifecycle-receipt-must-remain-deferred");
if (candidate.lifecycle?.admission_status !== "not-admitted" || candidate.lifecycle?.promotion_status !== "not-promoted" || candidate.lifecycle?.authority_effect !== "none" || candidate.external_effects?.network !== false || candidate.external_effects?.registry_write !== false || candidate.external_effects?.ontology_mutation !== false || candidate.proof_projection_policy?.claims_distributed_exactly_once !== false) fail("claim-ceiling");
console.log(JSON.stringify({result: "pass", swu_id: "RMT-EVENT-010", candidate_id: candidate.candidate_id, base_semantic_count: 10, rel_a_count: 4, s1_cross_boundary_count: 9, hostile_directory_total: 23, semantic_plan_epoch_id: candidate.semantic_plan.epoch_id, authority_effect: "none"}));
