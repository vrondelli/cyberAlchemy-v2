#!/usr/bin/env node

import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, realpathSync} from "node:fs";
import {dirname, resolve, sep} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(experimentRoot, "../../../../..");
const relative = {
  admission: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/protocol-admission.semantic-slice-v1.json",
  descriptor: "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/cross-language-realization-descriptor.semantic-slice-v1.json",
  request: "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-enum-semantic-slice.request.json",
  sliceValidator: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/validate-meta-type-semantic-slices.mjs",
  registry: "projects/domainspec-v2/impl/architecture-conformance/factory/registry/factory-node-registry-v1.ts",
};
const historical = Object.freeze({
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-ENUM-001.json": "8000c53f8a471a04ee566071407848d68e4edfbf24175067e1deac629b3add25",
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-ENUM-002.json": "22352837c3ae9378d787762038cbd24781a51192746dda6e0d7cc2cdc3fbf19d",
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-ENUM-003.json": "0190c7a54b227b84101cd3aad91560efabaea3be1d10bdfcd642ad23542ec77f",
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-ENUM-004.json": "ab5abb600f50dc61cc620d3a3172bbf1579f1a41a09700320162bd8edffe4403",
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-ENUM-005.json": "53638a6d3c114949e5f8158f63816c7abde0f8689c42f034229188042e81fe4b",
  "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-ENUM-006.json": "f93a07a3bf9754e812a878392c9cad9682acd674a7519ff50150e032d6d2895f",
  "projects/domainspec-v2/development/remaining-meta-types/candidates/enum.json": "8641a721ac3d02bbfd0e2c667b0f951ddb5532f387b01dadeb768c898fce7e29",
  "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/protocol-admission.json": "adcc72140c85f15ecd83b86ce9603b5b32739deb3896b513261957681f91844c",
  "projects/domainspec-v2/development/remaining-meta-types/admissions/enum/cross-language-realization-descriptor.json": "055f33857c71ec606ad1a516e5b174e7bc94a385ff48b45354ac219c210fa61e",
  "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures/rmt-enum.request.json": "ee93333bc10f4bbf9bdf0e4f80f85a294fe5b86496463b2785984c57012ac65e",
});

const absolute = (path) => resolve(repositoryRoot, path);
const sha256 = (path) => createHash("sha256").update(readFileSync(absolute(path))).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(absolute(path), "utf8"));
const errors = [];
const checks = [];
const check = (id, condition, message) => {
  checks.push({check_id: id, result: condition ? "pass" : "fail"});
  if (!condition) errors.push({code: id, message});
};
const validateRef = (reference, label) => {
  if (reference === null || typeof reference !== "object" ||
      typeof reference.path !== "string" || typeof reference.sha256 !== "string") {
    check(`ref:${label}`, false, `${label} lacks path and SHA-256`);
    return;
  }
  const target = absolute(reference.path);
  const safe = target.startsWith(`${repositoryRoot}${sep}`) && existsSync(target) &&
    lstatSync(target).isFile() && !lstatSync(target).isSymbolicLink() && realpathSync(target) === target;
  check(`ref:${label}`, safe && sha256(reference.path) === reference.sha256,
    `${label} is unsafe, missing, or stale`);
};
const walkRefs = (value, label = "root") => {
  if (Array.isArray(value)) return value.forEach((child, index) => walkRefs(child, `${label}.${index}`));
  if (value === null || typeof value !== "object") return;
  if (typeof value.path === "string" && typeof value.sha256 === "string") validateRef(value, label);
  for (const [key, child] of Object.entries(value)) walkRefs(child, `${label}.${key}`);
};

const sliceRun = spawnSync(process.execPath, [absolute(relative.sliceValidator)], {
  cwd: repositoryRoot,
  encoding: "utf8",
});
let sliceResult = null;
try { sliceResult = JSON.parse(sliceRun.stdout); } catch { /* reported below */ }
check("semantic-slice-concordance", sliceRun.status === 0 && sliceResult?.result === "pass" &&
  sliceResult?.checks_passed === sliceResult?.checks_total,
"semantic slice concordance or hostile validation failed");

const admission = readJson(relative.admission);
const descriptor = readJson(relative.descriptor);
const request = readJson(relative.request);
check("admission-boundary", admission.schema_version === "domainspec.enum-protocol-admission/v2" &&
  admission.admission_status === "implemented-candidate" && admission.result === "pass" &&
  admission.meta_type_id === "DS-D1.3" && admission.authority_effect === "none",
"superseding admission boundary drifted");
check("descriptor-boundary",
  descriptor.schema_version === "domainspec.enum-cross-language-realization-descriptor/v2" &&
  descriptor.descriptor_status === "implemented-candidate" &&
  descriptor.meta_type_ref === "DS-D1.3" && descriptor.authority_effect === "none",
"superseding descriptor boundary drifted");
check("five-role-slices", admission.semantic_slice_refs?.length === 5 &&
  new Set(admission.semantic_slice_refs.map(({role}) => role)).size === 5,
"admission must bind five distinct semantic-slice roles");
check("request-versioned-provider", request.request_id === "rmt-enum-semantic-slice-v1" &&
  request.nodes?.find(({node_id}) => node_id === "enum.typescript.shipment-priority")?.provider_id ===
    "typescript-enum-shipment-priority-semantic-slice-v1",
"factory request is not bound to the semantic-slice provider");
const tsInputs = new Set(request.nodes?.find(({node_id}) =>
  node_id === "enum.typescript.shipment-priority")?.input_refs?.map(({role}) => role));
check("request-slice-inputs", tsInputs.has("ontology_slice") &&
  tsInputs.has("typescript_profile_slice") && !tsInputs.has("ontology") &&
  !tsInputs.has("typescript_profile"),
"versioned TypeScript node still consumes broad ontology/profile inputs");
check("registry-versioned-provider", readFileSync(absolute(relative.registry), "utf8")
  .includes("typeScriptEnumShipmentPrioritySemanticSliceV1Provider"),
"versioned provider is absent from the live registry");

walkRefs(admission, "admission");
walkRefs(descriptor, "descriptor");
for (const [path, expected] of Object.entries(historical)) {
  check(`historical:${path}`, sha256(path) === expected, `${path} historical bytes changed`);
}

const result = {
  schema_version: "domainspec.rmt-enum-semantic-slice-validation/v1",
  result: errors.length === 0 ? "pass" : "fail",
  checks_passed: checks.filter(({result: status}) => status === "pass").length,
  checks_total: checks.length,
  semantic_slice_validation: sliceResult,
  checks,
  errors,
  claim_ceiling: "candidate-local superseding Enum semantic-slice admission and factory binding; historical bytes preserved; no authority, promotion, publication, deployment, release, or production effect",
  authority_effect: "none",
};
console.log(JSON.stringify(result, null, 2));
if (errors.length > 0) process.exitCode = 1;
