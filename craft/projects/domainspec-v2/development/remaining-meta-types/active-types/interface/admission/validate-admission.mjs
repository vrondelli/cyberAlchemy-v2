import {createHash} from "node:crypto";
import {readFileSync, statSync, existsSync} from "node:fs";
import {resolve} from "node:path";

const root = resolve(process.argv[2] ?? ".");
const base = "projects/domainspec-v2/development/remaining-meta-types/active-types/interface/admission";
const load = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const digest = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const fail = (message) => { throw new Error(`RMT_IFACE_ADMISSION_INVALID:${message}`); };

const admission = load(`${base}/admission.json`);
const inventory = load(`${base}/source-inventory.json`);
if (admission.schema_version !== "domainspec.meta-type-admission/v1"
    || admission.work_pack_id !== "WP-RMT-002"
    || admission.task_id !== "TASK-RMT-IFACE"
    || admission.meta_type?.id !== "DS-D1.11"
    || admission.meta_type?.label !== "Interface"
    || admission.meta_type?.canonical_maturity !== "active"
    || admission.authority_effect !== "none") fail("active-row");
if (admission.criterion_schema?.portable_semantics?.length !== 9
    || admission.criterion_schema?.rel_a?.length !== 4) fail("criterion-schema");
if (JSON.stringify(admission.target_forms) !== JSON.stringify([
  "typescript.versioned-interface-boundary",
  "python.versioned-interface-boundary",
  "rust.versioned-interface-boundary",
])) fail("target-forms");
if (admission.proof_denominator?.direct_provider_count !== 3
    || admission.proof_denominator?.semantic_hostile_count !== 10
    || admission.proof_denominator?.rel_a_hostile_count !== 4
    || admission.proof_denominator?.fresh_process_count !== 2
    || admission.proof_denominator?.native_hash_byte_comparison !== false) fail("proof-denominator");
if (inventory.sources?.length !== 7 || inventory.authority_effect !== "none") fail("source-inventory");
for (const source of inventory.sources) {
  const path = resolve(root, source.path);
  if (!existsSync(path) || statSync(path).size !== source.size_bytes || digest(source.path) !== source.sha256) fail(`source:${source.role}`);
}
if (existsSync(resolve(root, `${base}/RECEIPT.json`))) fail("lifecycle-receipt-must-remain-deferred");
console.log(JSON.stringify({result:"pass", swu_id:"RMT-IFACE-001", source_count:7, authority_effect:"none"}));
