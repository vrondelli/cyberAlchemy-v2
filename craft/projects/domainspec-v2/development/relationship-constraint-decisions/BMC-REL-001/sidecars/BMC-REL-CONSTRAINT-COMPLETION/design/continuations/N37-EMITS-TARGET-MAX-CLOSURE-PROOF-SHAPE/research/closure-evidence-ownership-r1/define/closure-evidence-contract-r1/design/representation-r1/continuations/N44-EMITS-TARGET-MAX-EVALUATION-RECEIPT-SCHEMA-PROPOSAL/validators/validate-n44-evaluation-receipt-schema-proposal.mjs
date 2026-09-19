#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const selfTest = process.argv.includes("--self-test");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function findRepo(start) {
  let current = start;
  while (current !== dirname(current)) {
    if (existsSync(resolve(current, "AGENTS.md")) && existsSync(resolve(current, "projects"))) return current;
    current = dirname(current);
  }
  throw new Error("repository root not found");
}
const repo = findRepo(root);
let checks = 0;
function assert(value, message) { checks += 1; if (!value) throw new Error(message); }
function text(path) { return readFileSync(path, "utf8"); }
function json(path) { return JSON.parse(text(path)); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function digest(path) { return sha(readFileSync(path)); }
function deep(value) {
  if (Array.isArray(value)) return value.map(deep);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, deep(value[key])]));
  return value;
}
function stable(value) { return sha(JSON.stringify(deep(value))); }
function exactKeys(value, expected, label) { assert(JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()), `${label} keys drift`); }

const required = [
  "ARCHITECTURE-BUNDLE.md", "DESIGN-AUTHORED-CONCERNS.json", "DESIGN-CONTEXT.md", "DESIGN-DENOMINATOR-RECEIPT.json",
  "DESIGN-DISTILL-VALIDATION.md", "DESIGN-PLANNED-WITNESSES.json", "DESIGN-RESULT.md", "DESIGN-RISKS-AND-GAPS.md",
  "DESIGN-SCOPE-MANIFEST.json", "DESIGN-SELECTION-RESULT.json", "DESIGN-TRANSPORT.json",
  "schemas/emits-target-max-evaluation-receipt.candidate-v1.schema.json",
  "fixtures/pass.json", "fixtures/invalid.json", "fixtures/incomplete.json", "fixtures/error.json"
];
for (const file of required) assert(existsSync(resolve(root, file)), `missing ${file}`);

const manifest = json(resolve(root, "DESIGN-SCOPE-MANIFEST.json"));
const manifestMaterial = { ...manifest }; delete manifestMaterial.input_digest;
assert(manifest.target_id === "BMC-REL-NONNUMERIC-44-EMITS-TARGET-MAX-EVALUATION-RECEIPT-SCHEMA-PROPOSAL", "manifest target drift");
assert(stable(manifestMaterial) === manifest.input_digest, "manifest digest drift");
assert(manifest.target_footprint.inclusions.length === 10, "source denominator drift");
for (const source of manifest.target_footprint.inclusions) {
  assert(existsSync(resolve(repo, source.path)), `missing source ${source.selector}`);
  assert(digest(resolve(repo, source.path)) === source.digest, `source drift ${source.selector}`);
}

const denominator = json(resolve(root, "DESIGN-DENOMINATOR-RECEIPT.json"));
const denominatorMaterial = { ...denominator }; delete denominatorMaterial.receipt_digest;
assert(denominator.verdict === "pass", "denominator must pass");
assert(denominator.manifest_input_digest === manifest.input_digest, "denominator manifest drift");
assert(denominator.missing_detector_inputs.length === 0 && denominator.unbound_signal_ids.length === 0, "denominator not closed");
assert(stable(denominatorMaterial) === denominator.receipt_digest, "denominator digest drift");

const selection = json(resolve(root, "DESIGN-SELECTION-RESULT.json"));
const selectionMaterial = { ...selection }; delete selectionMaterial.result_digest;
assert(selection.verdict === "pass" && selection.fixed_point === true, "selection must pass fixed point");
assert(selection.pass_1_digest === selection.pass_2_digest, "selection fixed point drift");
assert(selection.manifest_input_digest === manifest.input_digest && selection.denominator_receipt_digest === denominator.receipt_digest, "selection source binding drift");
assert(stable(selectionMaterial) === selection.result_digest, "selection result digest drift");

const schemaPath = resolve(root, "schemas/emits-target-max-evaluation-receipt.candidate-v1.schema.json");
const schema = json(schemaPath);
assert(schema.$schema === "https://json-schema.org/draft/2020-12/schema", "schema draft drift");
assert(schema.additionalProperties === false, "top-level schema must be closed");
for (const token of ["pass", "invalid", "not-evaluated-incomplete-closure", "error"]) assert(schema.properties.result.enum.includes(token), `missing result ${token}`);
assert(schema.properties.authority_effect.const === "none", "schema authority drift");
assert(schema.properties.predicate.properties.relation.const === "emits", "relation drift");
assert(schema.properties.predicate.properties.facet.const === "target_max" && schema.properties.predicate.properties.value.const === 1, "predicate drift");
assert(schema.properties.predicate.properties.counting_unit.const === "distinct-authored-canonical-concept-facts-after-duplicate-rejection", "counting unit drift");

const schemaDigest = digest(schemaPath);
const allowedTop = ["schema_version","receipt_id","receipt_schema","evaluator","inputs","predicate","evaluation_summary","result","diagnostics","semantic_result_digest","receipt_payload_digest","currentness","claim_ceiling","authority_effect"];
function expectedResult(summary) {
  if (summary.binding_errors.length) return "error";
  if (summary.duplicate_fact_ids.length || summary.target_max_violations.length) return "invalid";
  if (summary.missing_closure_components.length) return "not-evaluated-incomplete-closure";
  return "pass";
}
function validateFixture(value) {
  exactKeys(value, allowedTop, "receipt");
  assert(value.schema_version === "domainspec.emits-target-max-evaluation-receipt.candidate/v1", "fixture schema version drift");
  assert(value.receipt_schema.sha256 === schemaDigest, "fixture schema digest drift");
  assert(value.inputs.closure_envelope.sha256 === "bc1979fb516a84921f4b042948d1b2ffb853fae323eced4546e97c76977cc4d5", "N43 envelope binding drift");
  assert(value.predicate.relation === "emits" && value.predicate.facet === "target_max" && value.predicate.value === 1, "fixture predicate drift");
  assert(value.predicate.counting_unit === "distinct-authored-canonical-concept-facts-after-duplicate-rejection", "fixture counting drift");
  assert(value.result === expectedResult(value.evaluation_summary), "result precedence drift");
  assert(value.authority_effect === "none", "fixture authority drift");
  assert(value.claim_ceiling.runtime_claim === false && value.claim_ceiling.packet_authority === false && value.claim_ceiling.release_authority === false, "claim ceiling drift");
  assert(value.currentness.status === "unknown" && value.currentness.external_ref === null, "fixture currentness drift");
  const semantic = { evaluation_summary:value.evaluation_summary, result:value.result, diagnostics:value.diagnostics, claim_ceiling:value.claim_ceiling };
  assert(stable(semantic) === value.semantic_result_digest, "semantic result digest drift");
  const payload = { ...value }; delete payload.receipt_payload_digest;
  assert(stable(payload) === value.receipt_payload_digest, "receipt payload digest drift");
  const precedences = value.diagnostics.map((item) => item.precedence);
  assert(new Set(precedences).size === precedences.length, "diagnostic precedence duplicate");
  assert(precedences.every((item, index) => index === 0 || precedences[index - 1] < item), "diagnostics not precedence ordered");
  return true;
}

const fixtures = ["pass", "invalid", "incomplete", "error"].map((name) => json(resolve(root, `fixtures/${name}.json`)));
for (const fixture of fixtures) assert(validateFixture(fixture), "fixture validation failed");
assert(JSON.stringify(fixtures.map((item) => item.result)) === JSON.stringify(["pass","invalid","not-evaluated-incomplete-closure","error"]), "fixture result coverage drift");

const architecture = text(resolve(root, "ARCHITECTURE-BUNDLE.md"));
for (let view = 1; view <= 6; view += 1) assert(architecture.includes(`## ${view}.`), `architecture view ${view} missing`);
const distill = text(resolve(root, "DESIGN-DISTILL-VALIDATION.md"));
assert(distill.includes("Mode: Standard") && distill.includes("## Round 1") && distill.includes("## Round 2"), "Distill trace incomplete");
const transport = json(resolve(root, "DESIGN-TRANSPORT.json"));
assert(transport.decision_gate_required === false && transport.schema_admitted === false && transport.authority_effect === "none", "transport authority drift");
assert(transport.canonical_mutation === false && transport.packet_mutation === false && transport.implementation_authorized === false && transport.d06_reopened === false, "transport scope inflation");

const preserved = {
  "projects/domainspec-v2/definitions/relationships/relationships.yml": "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json": "a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json": "d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs": "69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975"
};
for (const [path, expected] of Object.entries(preserved)) assert(digest(resolve(repo, path)) === expected, `preserved target drift ${path}`);

let hostileRejected = 0;
if (selfTest) {
  const pass = fixtures[0];
  const probes = [
    (x) => { x.result = "invalid"; },
    (x) => { x.evaluation_summary.missing_closure_components = ["incoming-emits-adjacency"]; },
    (x) => { x.evaluation_summary.target_max_violations = [{event_id:"Event.X",source_entity_ids:["Entity.A","Entity.B"]}]; x.result="not-evaluated-incomplete-closure"; },
    (x) => { x.evaluation_summary.binding_errors = ["drift"]; x.result="pass"; },
    (x) => { x.authority_effect = "granted"; },
    (x) => { x.claim_ceiling.packet_authority = true; },
    (x) => { x.claim_ceiling.runtime_claim = true; },
    (x) => { x.currentness.status = "latest"; },
    (x) => { x.predicate.relation = "produces"; },
    (x) => { x.predicate.value = 2; },
    (x) => { x.predicate.counting_unit = "runtime-events"; },
    (x) => { x.receipt_schema.sha256 = "f".repeat(64); },
    (x) => { x.inputs.closure_envelope.sha256 = "f".repeat(64); },
    (x) => { x.semantic_result_digest = "f".repeat(64); },
    (x) => { x.receipt_payload_digest = "f".repeat(64); },
    (x) => { x.extra = true; },
    (x) => { x.diagnostics = [{code:"EMITS_EVALUATOR_ERROR",precedence:2,stage:"evaluation",subject:"x",detail:"x"},{code:"EMITS_INPUT_BINDING_ERROR",precedence:1,stage:"binding",subject:"x",detail:"x"}]; },
    (x) => { x.d06_reopened = true; }
  ];
  for (const mutate of probes) {
    const probe = structuredClone(pass); mutate(probe);
    let rejected = false; try { validateFixture(probe); } catch { rejected = true; }
    assert(rejected, "hostile probe accepted"); hostileRejected += 1;
  }
}

console.log(JSON.stringify({
  result:"pass", checks, sources:manifest.target_footprint.inclusions.length, fixed_point:selection.fixed_point,
  six_views:6, result_fixtures:fixtures.length, hostile_probes_rejected:hostileRejected, preserved_targets:Object.keys(preserved).length,
  n44_route:"direct-proposal", schema_admitted:false, authority_effect:"none"
}, null, 2));
