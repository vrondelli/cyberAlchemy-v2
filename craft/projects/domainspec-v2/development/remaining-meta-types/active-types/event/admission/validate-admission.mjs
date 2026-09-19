import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync} from "node:fs";
import {resolve} from "node:path";

const root = resolve(process.argv[2] ?? ".");
const base = "projects/domainspec-v2/development/remaining-meta-types/active-types/event/admission";
const load = path => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const digest = path => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const fail = message => { throw new Error(`RMT_EVENT_ADMISSION_INVALID:${message}`); };
const admission = load(`${base}/admission.json`);
const inventory = load(`${base}/source-inventory.json`);

if (admission.schema_version !== "domainspec.meta-type-admission/v1" || admission.work_pack_id !== "WP-RMT-002" || admission.task_id !== "TASK-RMT-EVENT" || admission.meta_type?.id !== "DS-D1.12" || admission.meta_type?.label !== "Event" || admission.meta_type?.canonical_maturity !== "active" || admission.authority_effect !== "none") fail("active-row");
if (admission.semantic_plan?.epoch_id !== "WP-RMT-002/S1/2026-08-16" || admission.semantic_plan?.contract_digest !== "75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7") fail("s1-binding");
const expectedS1Names = ["after-outbox-before-publish-failure", "send-failure", "success-ack-timeout", "duplicate-reordered-delivery", "poison-occurrence", "recovery-replay", "future-version", "occurrence-reuse", "non-idempotent-retry"];
if (admission.criterion_schema?.portable_semantics?.length !== 10 || admission.criterion_schema?.rel_a?.length !== 4 || JSON.stringify(admission.criterion_schema?.s1_cross_boundary) !== JSON.stringify(expectedS1Names)) fail("criterion-schema");
if (JSON.stringify(admission.target_forms) !== JSON.stringify(["typescript.past-tense-event", "python.past-tense-event", "rust.past-tense-event"])) fail("target-forms");
const denominator = admission.proof_denominator;
if (denominator?.direct_provider_count !== 3 || denominator?.semantic_hostile_count !== 10 || denominator?.rel_a_hostile_count !== 4 || denominator?.s1_cross_boundary_hostile_count !== 9 || denominator?.s1_parity_proof_owner_count !== 7 || denominator?.s1_replay_proof_owner_count !== 2 || denominator?.hostile_directory_total !== 23 || denominator?.fresh_process_count !== 2 || denominator?.native_hash_byte_comparison !== false) fail("proof-denominator");
const fields = ["occurrence_id", "persistence_checkpoint", "publication_attempt_id", "acknowledgement_state", "delivery_observation", "consumption_observation"];
if (admission.durable_handle_contract?.handle !== "durable-occurrence/v1" || JSON.stringify(admission.durable_handle_contract.fields) !== JSON.stringify(fields) || admission.durable_handle_contract.publication_is_separate_from_commit !== true) fail("s1-handle");

if (inventory.sources?.length !== 8 || inventory.authority_effect !== "none") fail("source-inventory");
for (const source of inventory.sources) {
  const path = resolve(root, source.path);
  if (!existsSync(path) || statSync(path).size !== source.size_bytes || digest(source.path) !== source.sha256) fail(`source:${source.role}`);
}
const catalogueRef = admission.s1_hostile_catalogue;
if (catalogueRef?.sha256 !== "41d5937f8bb6cc40475c23e228248130fe383b7930f09078fc7c98d26873505e" || catalogueRef?.size_bytes !== 56677 || catalogueRef?.event_control_count !== 9 || digest(catalogueRef.path) !== catalogueRef.sha256 || statSync(resolve(root, catalogueRef.path)).size !== catalogueRef.size_bytes) fail("s1-catalogue-binding");
const expectedS1 = [
  ["s1/after-outbox-before-publish-failure", "RMT_S1_AFTER_OUTBOX_BEFORE_PUBLISH_FAILURE", "RMT-EVENT-006", "fault-matrix:S1-F03", "committed outbox occurrence and absent publication attempt", "durable state and occurrence preserved"],
  ["s1/send-failure", "RMT_S1_SEND_FAILURE", "RMT-EVENT-006", "fault-matrix:S1-F04", "failed publication attempt for committed occurrence", "retry same occurrence without durable rollback"],
  ["s1/success-ack-timeout", "RMT_S1_ACKNOWLEDGEMENT_AMBIGUOUS", "RMT-EVENT-006", "fault-matrix:S1-F05", "successful send with ambiguous acknowledgement", "idempotent retry or reconcile using same occurrence"],
  ["s1/duplicate-reordered-delivery", "RMT_S1_DUPLICATE_REORDERED_DELIVERY", "RMT-EVENT-006", "fault-matrix:S1-F06", "duplicate or reordered delivery trace", "idempotent consume or stable rejection without history rewrite"],
  ["s1/poison-occurrence", "RMT_S1_POISON_OCCURRENCE", "RMT-EVENT-006", "fault-matrix:S1-F07", "unpublishable or unconsumable committed occurrence", "quarantine or forward handling with durable history preserved"],
  ["s1/recovery-replay", "RMT_S1_RECOVERY_REPLAY_MISMATCH", "RMT-EVENT-007", "fault-matrix:S1-F08", "fresh-process restart and outbox recovery", "same committed occurrence identity and outcome"],
  ["s1/future-version", "RMT_S1_FUTURE_VERSION", "RMT-EVENT-006", "decode-contract", "future occurrence schema version", "closed rejection with stable code"],
  ["s1/occurrence-reuse", "RMT_S1_OCCURRENCE_REUSE", "RMT-EVENT-006", "identity-contract", "same occurrence identity for a distinct durable fact", "reject identity reuse"],
  ["s1/non-idempotent-retry", "RMT_S1_NON_IDEMPOTENT_RETRY", "RMT-EVENT-007", "retry-contract", "retry changes occurrence identity or duplicates consumer effect", "reject non-idempotent retry"],
];
const catalogue = load(catalogueRef.path).cross_type_controls.filter(entry => entry.fixture_owner_swu === "RMT-EVENT-002");
const projected = catalogue.map(entry => [entry.hostile_id, entry.expected_code, entry.proof_owner_swu, entry.category, entry.required_observation, entry.required_outcome]);
if (JSON.stringify(projected) !== JSON.stringify(expectedS1) || catalogue.some(entry => entry.hostile_class !== "s1-cross-boundary" || entry.fixture_owner_swu !== "RMT-EVENT-002" || entry.non_noop_required !== true)) fail("s1-catalogue-denominator");
if (catalogue.filter(entry => entry.proof_owner_swu === "RMT-EVENT-006").length !== 7 || catalogue.filter(entry => entry.proof_owner_swu === "RMT-EVENT-007").length !== 2) fail("s1-proof-owner-split");

for (const dependency of admission.dependencies) {
  const candidate = load(dependency.path);
  if (candidate.projection_swu_id !== dependency.swu_id || candidate.lifecycle?.admission_status !== "not-admitted" || candidate.lifecycle?.authority_effect !== "none") fail(`dependency:${dependency.swu_id}`);
}
const operation = load(admission.relation_owner_source.path);
if (operation.projection_swu_id !== "RMT-OP-010" || operation.semantic_plan_binding?.epoch_id !== admission.semantic_plan.epoch_id || operation.semantic_plan_binding?.contract_digest !== admission.semantic_plan.contract_digest || digest(admission.relation_owner_source.path) !== "3eea502705e2960ee328a3d86931ccfb13090ad7c2d682223f9816f68d629e0e") fail("operation-relation-owner");
if (existsSync(resolve(root, `${base}/RECEIPT.json`))) fail("lifecycle-receipt-must-remain-deferred");
console.log(JSON.stringify({result: "pass", swu_id: "RMT-EVENT-001", source_count: 8, semantic_hostile_count: 10, rel_a_hostile_count: 4, s1_cross_boundary_hostile_count: 9, hostile_directory_total: 23, semantic_plan_epoch_id: admission.semantic_plan.epoch_id, authority_effect: "none"}));
