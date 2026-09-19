#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const validatorPath = fileURLToPath(import.meta.url);
const here = dirname(validatorPath);
const root = resolve(here, "..");
let repo = here;
while (!existsSync(resolve(repo, "AGENTS.md"))) {
  const parent = resolve(repo, "..");
  if (parent === repo) throw new Error("repository root not found");
  repo = parent;
}

const text = (path) => readFileSync(path, "utf8");
const json = (path) => JSON.parse(text(path));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sortValue = (value) => Array.isArray(value)
  ? value.map(sortValue)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]))
    : value;
const canonical = (value) => sha(JSON.stringify(sortValue(value)));
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
let checks = 0;
const assert = (condition, message) => {
  checks += 1;
  if (!condition) throw new Error(message);
};

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
  "decisions/N41-EMITS-CLOSURE-SIDECAR-IDENTITY-LIFECYCLE/DECISION-GATE.md",
  "decisions/N41-EMITS-CLOSURE-SIDECAR-IDENTITY-LIFECYCLE/OPTION-ADMISSIBILITY-REQUEST.json",
  "decisions/N41-EMITS-CLOSURE-SIDECAR-IDENTITY-LIFECYCLE/OPTION-PREFILTER-RECEIPT.json",
  "DESIGN-VALIDATION.json"
];
for (const file of required) assert(existsSync(resolve(root, file)), `missing ${file}`);

const manifest = json(resolve(root, "DESIGN-SCOPE-MANIFEST.json"));
const manifestMaterial = { ...manifest };
delete manifestMaterial.input_digest;
assert(canonical(manifestMaterial) === manifest.input_digest, "manifest input digest drift");
assert(manifest.manifest_id === "BMC-REL-CONSTRAINT-COMPLETION-N41-DESIGN-SCOPE", "manifest id drift");
assert(manifest.target_id === "BMC-REL-NONNUMERIC-41-EMITS-CLOSURE-SIDECAR-IDENTITY-LIFECYCLE", "target id drift");
assert(manifest.authored_by !== "invoke-design-scope-extractor", "manifest self-issued");
assert(manifest.unknowns.length === 0, "manifest unknowns must be empty");
assert(manifest.target_footprint.inclusions.length === 10, "source denominator drift");
assert(manifest.target_footprint.exclusions.length === 4, "scope exclusion drift");
for (const item of manifest.target_footprint.inclusions) {
  assert(sha(readFileSync(resolve(repo, item.path))) === item.digest, `source drift ${item.selector}`);
}

const denominator = json(resolve(root, "DESIGN-DENOMINATOR-RECEIPT.json"));
const denominatorMaterial = { ...denominator };
delete denominatorMaterial.receipt_digest;
assert(denominator.verdict === "pass", "denominator must pass");
assert(denominator.manifest_input_digest === manifest.input_digest, "denominator manifest binding drift");
assert(canonical(denominatorMaterial) === denominator.receipt_digest, "denominator digest drift");
assert(denominator.denominator_signal_ids.length === 7, "denominator signal count drift");
assert(denominator.unbound_signal_ids.length === 0, "unbound denominator signal");
assert(denominator.missing_detector_inputs.length === 0, "missing detector input");
assert(denominator.diagnostics.length === 0, "denominator diagnostics present");

const authored = json(resolve(root, "DESIGN-AUTHORED-CONCERNS.json"));
assert(authored.concerns.length === 1, "authored concern count drift");
assert(authored.concerns[0].concern_id === "concern:same-snapshot-sidecar-identity", "authored concern drift");
assert(authored.concerns[0].primary_class === "authority", "identity lifecycle concern class drift");

const selection = json(resolve(root, "DESIGN-SELECTION-RESULT.json"));
const selectionMaterial = { ...selection };
delete selectionMaterial.result_digest;
assert(selection.verdict === "pass", "Design selection must pass");
assert(selection.fixed_point === true, "Design selection must reach fixed point");
assert(selection.pass_1_digest === selection.pass_2_digest, "pass two changed");
assert(selection.evidence_state === "design-validator-pass", "Design evidence state drift");
assert(selection.manifest_input_digest === manifest.input_digest, "selection manifest binding drift");
assert(selection.denominator_receipt_digest === denominator.receipt_digest, "selection denominator binding drift");
assert(canonical(selectionMaterial) === selection.result_digest, "selection result digest drift");
assert(equal(selection.selected_outputs, [
  "architecture",
  "architecture:authority-trust",
  "architecture:integration-versioning",
  "validation-contracts"
]), "selected output set drift");

const gateRoot = resolve(root, "decisions/N41-EMITS-CLOSURE-SIDECAR-IDENTITY-LIFECYCLE");
const request = json(resolve(gateRoot, "OPTION-ADMISSIBILITY-REQUEST.json"));
const prefilter = json(resolve(gateRoot, "OPTION-PREFILTER-RECEIPT.json"));
const coexistId = "BMC-REL-NONNUMERIC-41-A-DIGEST-ADDRESSED-COEXISTENCE-NO-SUPERSESSION";
const supersessionId = "BMC-REL-NONNUMERIC-41-B-EXPLICIT-CONSUMER-OWNED-SUPERSESSION-LINK";
const deferId = "BMC-REL-NONNUMERIC-41-C-DEFER";
const stopId = "BMC-REL-NONNUMERIC-41-D-STOP";
const presented = [coexistId, supersessionId, deferId, stopId];
const rejected = [
  "BMC-REL-NONNUMERIC-41-W-LATEST-SIDECAR-WINS",
  "BMC-REL-NONNUMERIC-41-X-REWRITE-PRIOR-SIDECAR-OR-RECEIPT",
  "BMC-REL-NONNUMERIC-41-Y-EVALUATOR-OWNS-SUPERSESSION",
  "BMC-REL-NONNUMERIC-41-Z-SUPERSESSION-IMPLIES-CURRENTNESS"
];
assert(canonical(request) === prefilter.requestDigest, "N41 request digest drift");
assert(prefilter.routeOutcome === "gate" && prefilter.decisionGateRequired === true, "N41 must remain a gate");
assert(prefilter.directOptionId === null && prefilter.ownerGate === null, "N41 direct route inferred");
assert(equal(prefilter.admissibleOptionIds, presented), "N41 admissible option set drift");
assert(equal(prefilter.presentedOptionIds, presented), "N41 presentation drift");
assert(equal(prefilter.rejectedOptions.map((item) => item.optionId), rejected), "N41 rejected-control set drift");
assert(request.candidates.length === 8, "N41 candidate cardinality drift");
assert(equal(request.candidates.filter((item) => item.structuralStatus === "admissible").map((item) => item.optionId), presented), "N41 admitted candidates drift");
assert(equal(request.candidates.filter((item) => item.structuralStatus === "inadmissible").map((item) => item.optionId), rejected), "N41 rejected candidates drift");
for (const optionId of [coexistId, supersessionId]) {
  const action = request.candidates.find((item) => item.optionId === optionId);
  assert(action.optionKind === "action" && action.hazardClass === "authority", `N41 action classification drift ${optionId}`);
  assert(action.ownerGate === "relationship-decision-owner:owner-decision", `N41 action owner gate drift ${optionId}`);
}

const n40Path = manifest.target_footprint.inclusions.find((item) => item.selector === "n40-owner-a").path;
const n40 = json(resolve(repo, n40Path));
assert(n40.selection.response === "A", "N40 exact response drift");
assert(n40.selection.selected_option_id === "BMC-REL-NONNUMERIC-40-A-SNAPSHOT-RELATIVE-EVALUATION-CURRENTNESS-EXTERNAL", "N40 selection drift");
assert(n40.admissibility_binding.selected_option_admitted === true && n40.admissibility_binding.selected_option_presented === true, "N40 admissibility binding drift");
assert(n40.selection_effect.currentness_boundary.includes("separately governed"), "N40 external currentness boundary drift");
assert(n40.selection_effect.history_boundary.includes("never rewrites"), "N40 immutable history boundary drift");
assert(n40.authorization_boundary.repository_authority_effect === "none", "N40 authority inflation");

const architecture = text(resolve(root, "ARCHITECTURE-BUNDLE.md"));
for (const view of [
  "## 1. Context view",
  "## 2. High-level structure view",
  "## 3. Low-level components view",
  "## 4. Workflow process view",
  "## 5. Decision flow view",
  "## 6. Dependency interface view"
]) assert(architecture.includes(view), `missing ${view}`);
assert(architecture.includes("declaring owner + boundary + predicate + exact snapshot bindings"), "same-scope collision tuple missing");
assert(architecture.includes("Currentness plane: external under N40-A"), "N40 currentness boundary missing");
assert(architecture.includes("multiple immutable digest-addressed attestations may coexist"), "immutable coexistence boundary missing");
assert(architecture.includes("supersession assertion -> not admitted by N41-A"), "selected no-supersession boundary missing");
assert(architecture.includes("never select one by timestamp, filename, directory order, or file discovery"), "latest-wins rejection missing");
assert(architecture.includes("These are Design contracts, not executed Plan evidence."), "planned witness ceiling missing");

const examples = text(resolve(root, "DESIGN-DECISION-EXAMPLES.md"));
assert((examples.match(/^## (Low|Medium|Complex)$/gm) ?? []).length === 3, "complexity ladder must have 3 rungs");
assert(examples.includes("Decision effect: none"), "example decision effect drift");
assert(examples.includes("Coverage: 3/3 rungs; A/B/defer/stop covered evenly; unsupported claims: 0; decision effect: none."), "example coverage drift");
const distill = text(resolve(root, "DESIGN-DISTILL-VALIDATION.md"));
assert(distill.includes("Mode: Standard; one proposal track; Proposer and read-only Balancer; two rounds."), "Distill mode drift");
assert(distill.includes("## Round 1") && distill.includes("## Round 2"), "Distill round count drift");
assert(distill.includes("pass-two-admissible-identity-lifecycle-actions-owner-pending"), "Distill verdict drift");

const witnesses = json(resolve(root, "DESIGN-PLANNED-WITNESSES.json"));
assert(witnesses.fixtures.length === 3, "planned witness count drift");
assert(witnesses.evidence_state === "design-planned-unexecuted", "planned witness evidence inflation");

const transport = json(resolve(root, "DESIGN-TRANSPORT.json"));
assert(transport.target_id === request.decisionId, "transport target drift");
assert(transport.n40_selection === n40.selection.selected_option_id, "transport N40 binding drift");
assert(transport.status === "selected-n42-owner-decision-pending", "transport status drift");
assert(transport.selection === coexistId, "N41 selection drift");
assert(transport.current_decision === "BMC-REL-NONNUMERIC-42-EMITS-CLOSURE-PAYLOAD-REPRESENTATION", "N42 current decision drift");
assert(transport.n42_selection === null, "premature N42 selection");
assert(transport.recommended_option === "BMC-REL-NONNUMERIC-42-A-INLINE-EXACT-PAYLOAD-SETS", "N42 recommendation drift");
assert(transport.authority_effect === "none", "N41 authority effect drift");
assert(transport.canonical_mutation === false && transport.packet_mutation === false, "canonical or packet mutation inferred");
assert(transport.implementation_authorized === false && transport.profile_admission_authorized === false, "implementation or profile authority inferred");
assert(transport.d06_reopened === false, "D06 reopened");
const ownerSelection = json(resolve(gateRoot, "OWNER-SELECTION-RECEIPT.json"));
assert(ownerSelection.selection.response === "A", "N41 exact response drift");
assert(ownerSelection.selection.selected_option_id === coexistId, "N41 selected option drift");
assert(ownerSelection.admissibility_binding.requestDigest === prefilter.requestDigest, "N41 selection request binding drift");
assert(ownerSelection.selection_effect.history_rule.includes("no supersession"), "N41 no-supersession effect drift");

const preserved = [
  ["projects/domainspec-v2/definitions/relationships/relationships.yml", "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1"],
  ["projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json", "a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0"],
  ["projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json", "d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7"],
  ["projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs", "69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975"]
];
for (const [path, expected] of preserved) {
  assert(sha(readFileSync(resolve(repo, path))) === expected, `preserved digest drift ${path}`);
}

const validation = json(resolve(root, "DESIGN-VALIDATION.json"));
assert(validation.result === "pass", "persisted validation result drift");
assert(validation.target_id === request.decisionId, "persisted validation target drift");
assert(validation.validator.sha256 === "41c1a143e83fb81f2cb367c85eefc27c0d7aee376961b0f46129326a71b03d2e", "historical validator digest drift");
assert(validation.manifest_input_digest === manifest.input_digest, "persisted manifest digest drift");
assert(validation.denominator_receipt_digest === denominator.receipt_digest, "persisted denominator digest drift");
assert(validation.selection_result_digest === selection.result_digest, "persisted selection digest drift");
assert(validation.request_digest === prefilter.requestDigest, "persisted request digest drift");
assert(validation.gate.selection === null && validation.authority_effect === "none", "persisted authority inflation");
assert(validation.hostile_probes_rejected === 15, "persisted hostile-probe count drift");
assert(existsSync(resolve(root, "DESIGN-POSTSELECTION-VALIDATION.json")), "postselection validation missing");
const postValidation = json(resolve(root, "DESIGN-POSTSELECTION-VALIDATION.json"));
assert(postValidation.result === "pass", "postselection validation must pass");
assert(postValidation.validator.sha256 === sha(readFileSync(validatorPath)), "postselection validator digest drift");
assert(postValidation.n41_selection === coexistId && postValidation.n42_selection === null, "postselection lifecycle drift");
assert(postValidation.authority_effect === "none", "postselection authority inflation");

const baseline = {
  exactDigestSelection: true,
  historicalBytesImmutable: true,
  currentnessExternal: true,
  sameScopeOnly: true,
  latestWins: false,
  rewriteHistoricalBytes: false,
  evaluatorOwnsSupersession: false,
  supersessionImpliesCurrentness: false,
  crossOwnerOrScopeConflation: false,
  n41Selected: true,
  n42Selected: false,
  schemaMutation: false,
  packetMutation: false,
  profileAdmission: false,
  implementation: false,
  d06: false
};
function validateBoundary(value) {
  if (!value.exactDigestSelection) throw new Error("exact digest selection weakened");
  if (!value.historicalBytesImmutable) throw new Error("historical immutability weakened");
  if (!value.currentnessExternal) throw new Error("external currentness boundary weakened");
  if (!value.sameScopeOnly) throw new Error("same-scope boundary weakened");
  if (value.latestWins) throw new Error("latest sidecar wins");
  if (value.rewriteHistoricalBytes) throw new Error("historical rewrite");
  if (value.evaluatorOwnsSupersession) throw new Error("evaluator-owned supersession");
  if (value.supersessionImpliesCurrentness) throw new Error("supersession currentness inflation");
  if (value.crossOwnerOrScopeConflation) throw new Error("cross-owner or cross-scope conflation");
  if (!value.n41Selected) throw new Error("N41 selection lost");
  if (value.n42Selected) throw new Error("premature N42 selection");
  if (value.schemaMutation || value.packetMutation || value.profileAdmission || value.implementation || value.d06) throw new Error("authority overreach");
}
validateBoundary(baseline);
const probes = Object.keys(baseline);
for (const key of probes) {
  const hostile = { ...baseline, [key]: baseline[key] ? false : true };
  let rejectedProbe = false;
  try {
    validateBoundary(hostile);
  } catch {
    rejectedProbe = true;
  }
  assert(rejectedProbe, `hostile probe accepted ${key}`);
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
  hostile_probes_rejected: probes.length,
  preserved_targets: preserved.length,
  n40_selection: n40.selection.selected_option_id,
  n41_selection: ownerSelection.selection.selected_option_id,
  n42_selection: null,
  authority_effect: "none"
}, null, 2));
