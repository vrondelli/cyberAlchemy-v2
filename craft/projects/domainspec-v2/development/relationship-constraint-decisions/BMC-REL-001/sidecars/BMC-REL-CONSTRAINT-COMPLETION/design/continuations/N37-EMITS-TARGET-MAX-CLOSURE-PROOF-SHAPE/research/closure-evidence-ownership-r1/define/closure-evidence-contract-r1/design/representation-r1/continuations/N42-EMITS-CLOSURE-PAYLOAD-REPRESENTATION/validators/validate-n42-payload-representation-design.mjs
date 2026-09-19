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
function assert(condition, message) {
  checks += 1;
  if (!condition) throw new Error(message);
}
function text(path) { return readFileSync(path, "utf8"); }
function json(path) { return JSON.parse(text(path)); }
function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function digest(path) { return sha(readFileSync(path)); }
function canonical(value) { return sha(JSON.stringify(value, Object.keys(value).sort())); }
function deepCanonical(value) {
  if (Array.isArray(value)) return value.map(deepCanonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, deepCanonical(value[key])]));
  return value;
}
function canonicalDigest(value) { return sha(JSON.stringify(deepCanonical(value))); }
function equal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

const required = [
  "ARCHITECTURE-BUNDLE.md",
  "DESIGN-AUTHORED-CONCERNS.json",
  "DESIGN-CONTEXT.md",
  "DESIGN-DECISION-EXAMPLES.md",
  "DESIGN-DENOMINATOR-RECEIPT.json",
  "DESIGN-DISTILL-VALIDATION.md",
  "DESIGN-PLANNED-WITNESSES.json",
  "DESIGN-RESULT.md",
  "DESIGN-RISKS-AND-GAPS.md",
  "DESIGN-SCOPE-MANIFEST.json",
  "DESIGN-SELECTION-RESULT.json",
  "DESIGN-TRANSPORT.json",
  "decisions/N42-EMITS-CLOSURE-PAYLOAD-REPRESENTATION/DECISION-GATE.md",
  "decisions/N42-EMITS-CLOSURE-PAYLOAD-REPRESENTATION/OPTION-ADMISSIBILITY-REQUEST.json",
  "decisions/N42-EMITS-CLOSURE-PAYLOAD-REPRESENTATION/OPTION-PREFILTER-RECEIPT.json",
  "decisions/N42-EMITS-CLOSURE-PAYLOAD-REPRESENTATION/OWNER-SELECTION-RECEIPT.json"
];
for (const path of required) assert(existsSync(resolve(root, path)), `missing ${path}`);

const manifest = json(resolve(root, "DESIGN-SCOPE-MANIFEST.json"));
const manifestMaterial = { ...manifest };
delete manifestMaterial.input_digest;
assert(manifest.manifest_id === "BMC-REL-CONSTRAINT-COMPLETION-N42-DESIGN-SCOPE", "manifest id drift");
assert(manifest.target_id === "BMC-REL-NONNUMERIC-42-EMITS-CLOSURE-PAYLOAD-REPRESENTATION", "target drift");
assert(manifest.authored_by !== "invoke-design-scope-extractor", "manifest self-issued");
assert(canonicalDigest(manifestMaterial) === manifest.input_digest, "manifest input digest drift");
assert(manifest.target_footprint.inclusions.length === 10, "source denominator drift");
for (const item of manifest.target_footprint.inclusions) {
  assert(existsSync(resolve(repo, item.path)), `source missing ${item.selector}`);
  assert(digest(resolve(repo, item.path)) === item.digest, `source drift ${item.selector}`);
}

const denominator = json(resolve(root, "DESIGN-DENOMINATOR-RECEIPT.json"));
const denominatorMaterial = { ...denominator };
delete denominatorMaterial.receipt_digest;
assert(denominator.verdict === "pass", "denominator must pass");
assert(denominator.manifest_input_digest === manifest.input_digest, "denominator manifest binding drift");
assert(denominator.inspected_selectors.length === 10, "inspected selector count drift");
assert(denominator.missing_detector_inputs.length === 0 && denominator.unbound_signal_ids.length === 0, "denominator not closed");
assert(canonicalDigest(denominatorMaterial) === denominator.receipt_digest, "denominator receipt digest drift");

const selection = json(resolve(root, "DESIGN-SELECTION-RESULT.json"));
const selectionMaterial = { ...selection };
delete selectionMaterial.result_digest;
assert(selection.verdict === "pass" && selection.fixed_point === true, "selection must pass fixed point");
assert(selection.pass_1_digest === selection.pass_2_digest, "selection pass drift");
assert(selection.manifest_input_digest === manifest.input_digest, "selection manifest binding drift");
assert(selection.denominator_receipt_digest === denominator.receipt_digest, "selection denominator binding drift");
assert(canonicalDigest(selectionMaterial) === selection.result_digest, "selection result digest drift");
assert(equal(selection.selected_outputs, ["architecture", "architecture:integration-versioning", "validation-contracts"]), "selected output drift");

const gateRoot = resolve(root, "decisions/N42-EMITS-CLOSURE-PAYLOAD-REPRESENTATION");
const request = json(resolve(gateRoot, "OPTION-ADMISSIBILITY-REQUEST.json"));
const prefilter = json(resolve(gateRoot, "OPTION-PREFILTER-RECEIPT.json"));
const ownerSelection = json(resolve(gateRoot, "OWNER-SELECTION-RECEIPT.json"));
const presented = [
  "BMC-REL-NONNUMERIC-42-A-INLINE-EXACT-PAYLOAD-SETS",
  "BMC-REL-NONNUMERIC-42-B-DIGEST-BOUND-PAYLOAD-MANIFEST-REFERENCES",
  "BMC-REL-NONNUMERIC-42-C-CLOSED-TAGGED-INLINE-OR-REFERENCE",
  "BMC-REL-NONNUMERIC-42-D-DEFER",
  "BMC-REL-NONNUMERIC-42-E-STOP"
];
const rejected = [
  "BMC-REL-NONNUMERIC-42-W-IMPLICIT-PAYLOAD-DISCOVERY",
  "BMC-REL-NONNUMERIC-42-X-COMPILER-MANIFEST-ATTESTS-COMPLETENESS",
  "BMC-REL-NONNUMERIC-42-Y-MIXED-SNAPSHOT-PAYLOADS",
  "BMC-REL-NONNUMERIC-42-Z-COPY-ATTESTATION-INTO-REQUEST"
];
assert(request.decisionId === "BMC-REL-NONNUMERIC-42-EMITS-CLOSURE-PAYLOAD-REPRESENTATION", "request id drift");
assert(canonicalDigest(request) === prefilter.requestDigest, "request digest drift");
assert(prefilter.routeOutcome === "gate" && prefilter.decisionGateRequired === true, "N42 must remain a gate");
assert(prefilter.directOptionId === null && prefilter.ownerGate === null, "direct route inferred");
assert(equal(prefilter.admissibleOptionIds, presented), "admissible set drift");
assert(equal(prefilter.presentedOptionIds, presented), "presentation set drift");
assert(equal(prefilter.rejectedOptions.map((item) => item.optionId), rejected), "rejected set drift");
assert(ownerSelection.selection.response === "A", "N42 exact response drift");
assert(ownerSelection.selection.selected_option_id === presented[0], "N42 selected option drift");
assert(ownerSelection.admissibility_binding.requestDigest === prefilter.requestDigest, "N42 selection request binding drift");
assert(ownerSelection.admissibility_binding.selected_option_admitted === true && ownerSelection.admissibility_binding.selected_option_presented === true, "N42 selection admission drift");
assert(ownerSelection.authorization_boundary.repository_authority_effect === "none", "N42 selection authority inflation");
for (const id of presented.slice(0, 3)) {
  const item = request.candidates.find((candidate) => candidate.optionId === id);
  assert(item.structuralStatus === "admissible" && item.hazardClass === "authority", `${id} authority shape drift`);
  assert(item.ownerGate === "relationship-decision-owner:owner-decision", `${id} owner gate drift`);
}

const n41Path = manifest.target_footprint.inclusions.find((item) => item.selector === "n41-owner-a").path;
const n41 = json(resolve(repo, n41Path));
assert(n41.selection.response === "A", "N41 exact response drift");
assert(n41.selection.selected_option_id === "BMC-REL-NONNUMERIC-41-A-DIGEST-ADDRESSED-COEXISTENCE-NO-SUPERSESSION", "N41 selection drift");
assert(n41.authorization_boundary.repository_authority_effect === "none", "N41 authority inflation");
assert(n41.selection_effect.history_rule.includes("no supersession"), "N41 no-supersession boundary drift");

const architecture = text(resolve(root, "ARCHITECTURE-BUNDLE.md"));
for (let view = 1; view <= 6; view += 1) assert(architecture.includes(`## ${view}.`), `architecture view ${view} missing`);
assert(architecture.includes("compiler does not inherit authority"), "compiler authority boundary missing");
assert(architecture.includes("exactly one closed tagged variant"), "tagged union boundary missing");

const distill = text(resolve(root, "DESIGN-DISTILL-VALIDATION.md"));
assert(distill.includes("Mode: Standard"), "Distill mode drift");
assert(distill.includes("## Round 1") && distill.includes("## Round 2"), "Distill rounds missing");
assert(distill.includes("recommending A"), "recommendation rationale missing");

const examples = text(resolve(root, "DESIGN-DECISION-EXAMPLES.md"));
for (const rung of ["## Low", "## Medium", "## Complex"]) assert(examples.includes(rung), `${rung} missing`);
assert(examples.includes("A/B/C/defer/stop covered evenly"), "example option coverage drift");
assert(examples.includes("decision effect: none"), "example decision effect drift");

const transport = json(resolve(root, "DESIGN-TRANSPORT.json"));
assert(transport.n41_selection === n41.selection.selected_option_id, "transport N41 binding drift");
assert(transport.selection === ownerSelection.selection.selected_option_id && transport.authority_effect === "none", "N42 transport selection drift");
assert(transport.canonical_mutation === false && transport.packet_mutation === false, "canonical or packet mutation inferred");
assert(transport.implementation_authorized === false && transport.profile_admission_authorized === false, "implementation or profile authority inferred");
assert(transport.d06_reopened === false, "D06 reopened");

const preserved = {
  "projects/domainspec-v2/definitions/relationships/relationships.yml": "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json": "a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json": "d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7",
  "projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs": "69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975"
};
for (const [path, expected] of Object.entries(preserved)) assert(digest(resolve(repo, path)) === expected, `preserved target drift ${path}`);

if (existsSync(resolve(root, "DESIGN-VALIDATION.json"))) {
  const validation = json(resolve(root, "DESIGN-VALIDATION.json"));
  assert(validation.result === "pass", "persisted validation must pass");
  assert(validation.manifest_input_digest === manifest.input_digest, "persisted manifest digest drift");
  assert(validation.denominator_receipt_digest === denominator.receipt_digest, "persisted denominator digest drift");
  assert(validation.selection_result_digest === selection.result_digest, "persisted selection digest drift");
  assert(validation.request_digest === prefilter.requestDigest, "persisted request digest drift");
  assert(validation.gate.selection === null && validation.authority_effect === "none", "persisted authority inflation");
}

let hostileRejected = 0;
function boundary(value) {
  if (!value.exactCarrier) throw new Error("implicit or missing carrier");
  if (value.compilerCompleteness) throw new Error("compiler authority collapse");
  if (value.mixedSnapshot) throw new Error("mixed snapshot");
  if (value.requestCopiesAttestation) throw new Error("request copies attestation");
  if (value.dualVariant || value.untaggedVariant) throw new Error("ambiguous carrier variant");
  if (value.missingDigest) throw new Error("missing digest");
  if (value.currentness || value.supersession) throw new Error("lifecycle overreach");
  if (!value.n42Selected) throw new Error("N42 selection lost");
  if (value.packetMutation || value.implementation || value.profile || value.runtimeEvent) throw new Error("authority overreach");
  if (value.d06) throw new Error("D06 reopened");
  return true;
}
const positive = { exactCarrier: true, n42Selected: true };
assert(boundary(positive) === true, "positive boundary failed");
if (selfTest) {
  const probes = [
    { exactCarrier: false, n42Selected: true }, { exactCarrier: true, n42Selected: true, compilerCompleteness: true }, { exactCarrier: true, n42Selected: true, mixedSnapshot: true },
    { exactCarrier: true, n42Selected: true, requestCopiesAttestation: true }, { exactCarrier: true, n42Selected: true, dualVariant: true }, { exactCarrier: true, n42Selected: true, untaggedVariant: true },
    { exactCarrier: true, n42Selected: true, missingDigest: true }, { exactCarrier: true, n42Selected: true, currentness: true }, { exactCarrier: true, n42Selected: true, supersession: true },
    { exactCarrier: true, n42Selected: false }, { exactCarrier: true, n42Selected: true, packetMutation: true }, { exactCarrier: true, n42Selected: true, implementation: true },
    { exactCarrier: true, n42Selected: true, profile: true }, { exactCarrier: true, n42Selected: true, runtimeEvent: true }, { exactCarrier: true, n42Selected: true, d06: true }
  ];
  for (const probe of probes) {
    let rejected = false;
    try { boundary(probe); } catch { rejected = true; }
    assert(rejected, "hostile probe accepted");
    hostileRejected += 1;
  }
}

console.log(JSON.stringify({
  result: "pass",
  checks,
  sources: manifest.target_footprint.inclusions.length,
  fixed_point: selection.fixed_point,
  six_views: 6,
  complexity_examples: 3,
  presented_options: prefilter.presentedOptionIds.length,
  rejected_controls: prefilter.rejectedOptions.length,
  hostile_probes_rejected: hostileRejected,
  preserved_targets: Object.keys(preserved).length,
  n41_selection: n41.selection.selected_option_id,
  n42_selection: ownerSelection.selection.selected_option_id,
  authority_effect: "none"
}, null, 2));
