import {createHash} from "node:crypto";
import {existsSync, readFileSync, statSync} from "node:fs";
import {resolve} from "node:path";

const root = resolve(".");
const candidatePath = resolve(process.argv[2] ?? "");
const load = (path) => JSON.parse(readFileSync(path, "utf8"));
const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const fail = (message) => { throw new Error(`RMT_MAP_CANDIDATE_INVALID:${message}`); };
if (!existsSync(candidatePath)) fail("missing-candidate");
const candidate = load(candidatePath);
if (candidate.schema_version !== "domainspec.meta-type-implementation-candidate/v1" || candidate.work_pack_id !== "WP-RMT-002"
    || candidate.task_id !== "TASK-RMT-MAP" || candidate.projection_swu_id !== "RMT-MAP-010"
    || candidate.meta_type?.id !== "DS-D1.13" || candidate.meta_type?.label !== "Mapping"
    || candidate.architecture_implementation?.architecture_type_id !== "architecture.MappingImplementation") fail("identity");
const receiptIds = ["RMT-MAP-006", "RMT-MAP-007", "RMT-MAP-008", "RMT-MAP-009"];
if (JSON.stringify(candidate.projection_source?.receipt_order) !== JSON.stringify(receiptIds)) fail("receipt-order");
for (const expected of receiptIds) {
  const ref = candidate.projection_source.proof_receipts.find(({swu_id}) => swu_id === expected);
  if (!ref) fail(`receipt-ref:${expected}`);
  const path = resolve(root, ref.path);
  if (!existsSync(path) || statSync(path).size !== ref.size_bytes || sha(path) !== ref.sha256) fail(`receipt-bytes:${expected}`);
  const receipt = load(path);
  if (receipt.result !== "pass" || receipt.authority_effect !== "none") fail(`receipt-result:${expected}`);
}
if (JSON.stringify(candidate.architecture_implementation.direct_provider_ids) !== JSON.stringify(["mapping-typescript-v1", "mapping-python-v1", "mapping-rust-v1"])
    || candidate.architecture_implementation.provider_registration_status !== "unregistered") fail("providers");
if (candidate.targets?.length !== 3 || candidate.targets.some(({registered}) => registered !== false)) fail("targets");
if (candidate.portable_parity?.native_hash_byte_comparison !== false || candidate.lifecycle?.admission_status !== "not-admitted"
    || candidate.lifecycle?.promotion_status !== "not-promoted" || candidate.lifecycle?.authority_effect !== "none"
    || candidate.external_effects?.network !== false || candidate.external_effects?.registry_write !== false
    || candidate.external_effects?.ontology_mutation !== false) fail("claim-ceiling");
console.log(JSON.stringify({result:"pass", swu_id:"RMT-MAP-010", candidate_id:candidate.candidate_id, authority_effect:"none"}));
