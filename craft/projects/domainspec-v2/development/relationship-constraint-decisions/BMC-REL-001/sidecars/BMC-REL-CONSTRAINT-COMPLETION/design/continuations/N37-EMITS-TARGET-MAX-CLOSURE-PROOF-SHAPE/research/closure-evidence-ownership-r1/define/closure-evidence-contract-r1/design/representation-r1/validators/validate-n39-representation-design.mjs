#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
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
const sortValue = (value) => Array.isArray(value) ? value.map(sortValue) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])])) : value;
const canonical = (value) => sha(JSON.stringify(sortValue(value)));
let checks = 0;
const assert = (condition, message) => { checks += 1; if (!condition) throw new Error(message); };

const required = [
  "DESIGN-CONTEXT.md", "DESIGN-TEMPLATE-SELECTION.md", "DESIGN-SCOPE-MANIFEST.json",
  "DESIGN-AUTHORED-CONCERNS.json", "DESIGN-PLANNED-WITNESSES.json",
  "DESIGN-DENOMINATOR-RECEIPT.json", "DESIGN-SELECTION-RESULT.json",
  "ARCHITECTURE-BUNDLE.md", "DESIGN-GLOSSARY-CONSISTENCY.md",
  "DESIGN-DISPATCH-TECHNIQUE-TRACE.md", "DESIGN-DISTILL-VALIDATION.md",
  "DESIGN-DECISION-EXAMPLES.md", "DESIGN-RISKS-AND-GAPS.md", "DESIGN-RESULT.md",
  "DESIGN-TRANSPORT.json"
];
for (const file of required) assert(existsSync(resolve(root, file)), `missing ${file}`);

const manifest = json(resolve(root, "DESIGN-SCOPE-MANIFEST.json"));
const manifestMaterial = {...manifest}; delete manifestMaterial.input_digest;
assert(canonical(manifestMaterial) === manifest.input_digest, "manifest input digest drift");
assert(manifest.unknowns.length === 0, "manifest unknowns must be empty");
assert(manifest.authored_by !== "invoke-design-scope-extractor", "manifest self-issued");
assert(manifest.target_footprint.inclusions.length === 13, "source denominator drift");
for (const item of manifest.target_footprint.inclusions) assert(sha(readFileSync(resolve(repo, item.path))) === item.digest, `source drift ${item.selector}`);

const denominator = json(resolve(root, "DESIGN-DENOMINATOR-RECEIPT.json"));
const denominatorMaterial = {...denominator}; delete denominatorMaterial.receipt_digest;
assert(denominator.verdict === "pass", "denominator must pass");
assert(denominator.manifest_input_digest === manifest.input_digest, "denominator manifest binding drift");
assert(canonical(denominatorMaterial) === denominator.receipt_digest, "denominator digest drift");
assert(denominator.unbound_signal_ids.length === 0 && denominator.missing_detector_inputs.length === 0, "denominator incomplete");

const selection = json(resolve(root, "DESIGN-SELECTION-RESULT.json"));
const selectionMaterial = {...selection}; delete selectionMaterial.result_digest;
assert(selection.verdict === "pass" && selection.fixed_point === true, "Design selection must pass fixed point");
assert(selection.pass_1_digest === selection.pass_2_digest, "pass two changed");
assert(selection.evidence_state === "design-validator-pass", "Design evidence state drift");
assert(canonical(selectionMaterial) === selection.result_digest, "selection result digest drift");
for (const output of ["architecture", "architecture:authority-trust", "architecture:integration-versioning", "architecture:persistence-concurrency", "validation-contracts"]) assert(selection.selected_outputs.includes(output), `missing selected output ${output}`);

const n38 = json(resolve(root, "../../decisions/N38-EMITS-CLOSURE-EVIDENCE-OWNER-ADMISSION/OWNER-SELECTION-RECEIPT.json"));
assert(n38.selection.response === "A", "N38 exact response drift");
assert(n38.authorization_boundary.representation_selected === false, "N38 placement consent inferred");

const gate = resolve(root, "decisions/N39-EMITS-CLOSURE-ENVELOPE-PLACEMENT");
const request = json(resolve(gate, "OPTION-ADMISSIBILITY-REQUEST.json"));
const receipt = json(resolve(gate, "OPTION-PREFILTER-RECEIPT.json"));
assert(canonical(request) === receipt.requestDigest, "N39 request digest drift");
assert(receipt.routeOutcome === "gate" && receipt.decisionGateRequired === true, "N39 must be a gate");
assert(receipt.presentedOptionIds.length === 3, "N39 must present action/defer/stop");
assert(receipt.rejectedOptions.length === 3, "N39 must reject three false constructions");
assert(receipt.presentedOptionIds[0] === "BMC-REL-NONNUMERIC-39-A-DEDICATED-CONSUMER-CLOSURE-SIDECAR", "N39 action drift");
const n39Selection = json(resolve(gate, "OWNER-SELECTION-RECEIPT.json"));
assert(n39Selection.selection.response === "A", "N39 exact response drift");
assert(n39Selection.selection.selected_option_id === "BMC-REL-NONNUMERIC-39-A-DEDICATED-CONSUMER-CLOSURE-SIDECAR", "N39 selection drift");
assert(n39Selection.admissibility_binding.requestDigest === receipt.requestDigest, "N39 selection binding drift");
const action = request.candidates.find((item) => item.optionId.includes("39-A-"));
assert(action.hazardClass === "authority" && action.ownerGate === "relationship-decision-owner:owner-decision", "N39 authority gate drift");

const architecture = text(resolve(root, "ARCHITECTURE-BUNDLE.md"));
for (const view of ["## 1. Context view", "## 2. Capability view", "## 3. Concept/type view", "## 4. Operation/flow view", "## 5. State view", "## 6. Dependency/interface view"]) assert(architecture.includes(view), `missing ${view}`);
assert(architecture.includes("project.json` remains unchanged"), "project manifest boundary missing");
assert(architecture.includes("planned contracts, not executed Plan evidence"), "planned witness ceiling missing");

const examples = text(resolve(root, "DESIGN-DECISION-EXAMPLES.md"));
assert((examples.match(/^## (Low|Medium|Complex)/gm) ?? []).length === 3, "complexity ladder must have 3 rungs");
assert(examples.includes("Decision effect: none"), "example decision effect drift");
assert(text(resolve(root, "DESIGN-DISTILL-VALIDATION.md")).includes("pass-one-admissible-route-owner-pending"), "Distill verdict drift");
const transport = json(resolve(root, "DESIGN-TRANSPORT.json"));
assert(transport.n39_selection === n39Selection.selection.selected_option_id, "transport N39 selection drift");
const n40Selection = json(resolve(root, "continuations/N40-EMITS-CLOSURE-SNAPSHOT-CURRENTNESS/decisions/N40-EMITS-CLOSURE-SNAPSHOT-CURRENTNESS/OWNER-SELECTION-RECEIPT.json"));
assert(n40Selection.selection.response === "A", "N40 exact response drift");
assert(n40Selection.selection.selected_option_id === "BMC-REL-NONNUMERIC-40-A-SNAPSHOT-RELATIVE-EVALUATION-CURRENTNESS-EXTERNAL", "N40 selection drift");
assert(transport.n40_selection === n40Selection.selection.selected_option_id, "transport N40 selection drift");
const n41Selection = json(resolve(root, "continuations/N41-EMITS-CLOSURE-SIDECAR-IDENTITY-LIFECYCLE/decisions/N41-EMITS-CLOSURE-SIDECAR-IDENTITY-LIFECYCLE/OWNER-SELECTION-RECEIPT.json"));
assert(n41Selection.selection.response === "A", "N41 exact response drift");
assert(n41Selection.selection.selected_option_id === "BMC-REL-NONNUMERIC-41-A-DIGEST-ADDRESSED-COEXISTENCE-NO-SUPERSESSION", "N41 selection drift");
assert(transport.n41_selection === n41Selection.selection.selected_option_id, "transport N41 selection drift");
const n42Selection = json(resolve(root, "continuations/N42-EMITS-CLOSURE-PAYLOAD-REPRESENTATION/decisions/N42-EMITS-CLOSURE-PAYLOAD-REPRESENTATION/OWNER-SELECTION-RECEIPT.json"));
assert(n42Selection.selection.response === "A", "N42 exact response drift");
assert(n42Selection.selection.selected_option_id === "BMC-REL-NONNUMERIC-42-A-INLINE-EXACT-PAYLOAD-SETS", "N42 selection drift");
assert(transport.n42_selection === n42Selection.selection.selected_option_id, "transport N42 selection drift");
const n45Root = resolve(root, "continuations/N45-EMITS-CLOSURE-EVIDENCE-CHAIN-CONTRACT-ADMISSION");
const n45Gate = resolve(n45Root, "decisions/N45-EMITS-CLOSURE-EVIDENCE-CHAIN-CONTRACT-ADMISSION");
const n45Selection = json(resolve(n45Gate, "OWNER-SELECTION-RECEIPT.json"));
const n45SelectedOption = "BMC-REL-NONNUMERIC-45-A-ADMIT-COORDINATED-CANDIDATE-CLOSURE-EVIDENCE-CHAIN-CONTRACT";
assert(n45Selection.selection.response === "A" && n45Selection.selection.selected_option_id === n45SelectedOption, "N45 selection drift");
assert(n45Selection.admissibility_binding.requestDigest === "e63337001fe9d3e222c0d7331f2f531670d3791c19456713df83c4fb1acd3bcb", "N45 selection binding drift");
assert(transport.n43_status === "candidate-schema-admitted-as-coordinated-design-target" && transport.n44_status === "candidate-schema-admitted-as-coordinated-design-target", "coordinated candidate lifecycle drift");
assert(transport.current_decision === null && transport.n45_selection === n45SelectedOption, "transport current decision drift");
assert(transport.selection === n45SelectedOption && transport.authority_effect === "none", "transport N45 authority/selection drift");
assert(transport.next_route === "invoke:plan" && transport.plan_activation_status === "blocked-pending-plan-activation-inputs" && transport.plan_authoring_started === false, "transport Plan-entry drift");
const planEntry = json(resolve(n45Root, "INVOKE-PLAN-ENTRY-HANDOFF.json"));
assert(sha(readFileSync(resolve(n45Gate, "OWNER-SELECTION-RECEIPT.json"))) === transport.n45_owner_selection_receipt_sha256, "transport N45 receipt hash drift");
assert(sha(readFileSync(resolve(n45Root, "INVOKE-PLAN-ENTRY-HANDOFF.json"))) === transport.plan_entry_handoff_sha256, "transport Plan-entry hash drift");
assert(planEntry.status === "blocked-pending-plan-activation-inputs" && planEntry.target_mode === "invoke:plan", "Plan-entry status drift");
assert(planEntry.approved_design_target.selected_option_id === n45SelectedOption, "Plan-entry Design binding drift");
assert(planEntry.activation_inputs.approved_stable_design_outputs === true && planEntry.activation_inputs.source_design_references === true, "Plan-entry approved inputs lost");
for (const [key, value] of Object.entries(planEntry.activation_inputs).filter(([key]) => !["approved_stable_design_outputs", "source_design_references"].includes(key))) assert(value === false, `Plan activation input inferred ${key}`);
assert(planEntry.authority_boundary.plan_authoring_started === false && planEntry.authority_boundary.mutation_ready === false && planEntry.authority_boundary.implementation_authorized === false && planEntry.authority_boundary.authority_effect === "none", "Plan-entry authority inflation");
assert(planEntry.known_plan_contract_gaps.length === 1 && planEntry.known_plan_contract_gaps[0].path === ".agents/skills/invoke/development/PLAN-ARTIFACT-BOUNDARIES.md" && !existsSync(resolve(repo, planEntry.known_plan_contract_gaps[0].path)), "Plan contract gap drift");

const preserved = [
  ["projects/domainspec-v2/definitions/relationships/relationships.yml", "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1"],
  ["projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json", "a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0"],
  ["projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json", "d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7"],
  ["projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs", "69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975"]
];
for (const [path, expected] of preserved) assert(sha(readFileSync(resolve(repo, path))) === expected, `preserved digest drift ${path}`);

const baseline = {dedicated:true, outsideGenerated:true, consumerAuthored:true, exactDigest:true, embedded:false, ephemeralCopy:false, compilerAttests:false, n39Selected:true, n40Selected:true, n41Selected:true, n42Selected:true, n43Validated:true, n44Validated:true, n45Selected:true, planStarted:false, implementation:false, packet:false, profile:false, d06:false};
function validateBoundary(value) {
  if (!value.dedicated || !value.outsideGenerated || !value.consumerAuthored || !value.exactDigest) throw new Error("A invariant weakened");
  if (value.embedded) throw new Error("project manifest embedding");
  if (value.ephemeralCopy) throw new Error("duplicate request attestation");
  if (value.compilerAttests) throw new Error("compiler authority overreach");
  if (!value.n39Selected) throw new Error("N39 selection lost");
  if (!value.n40Selected) throw new Error("N40 selection lost");
  if (!value.n41Selected) throw new Error("N41 selection lost");
  if (!value.n42Selected) throw new Error("N42 selection lost");
  if (!value.n43Validated || !value.n44Validated) throw new Error("candidate chain validation lost");
  if (!value.n45Selected) throw new Error("N45 selection lost");
  if (value.planStarted || value.implementation || value.packet || value.profile || value.d06) throw new Error("authority overreach");
}
validateBoundary(baseline);
const probes = Object.keys(baseline);
for (const key of probes) {
  const hostile = {...baseline, [key]: baseline[key] ? false : true};
  let rejected = false; try { validateBoundary(hostile); } catch { rejected = true; }
  assert(rejected, `hostile probe accepted ${key}`);
}

console.log(JSON.stringify({result:"pass", checks, sources:manifest.target_footprint.inclusions.length, selected_outputs:selection.selected_outputs, n38_selection:n38.selection.selected_option_id, n39_selection:n39Selection.selection.selected_option_id, n40_selection:n40Selection.selection.selected_option_id, n41_selection:n41Selection.selection.selected_option_id, n42_selection:n42Selection.selection.selected_option_id, n43_status:transport.n43_status, n44_status:transport.n44_status, current_decision:transport.current_decision, n45_selection:n45SelectedOption, plan_entry_status:planEntry.status, presented_options:receipt.presentedOptionIds.length, rejected_controls:receipt.rejectedOptions.length, hostile_probes_rejected:probes.length, authority_effect:"none"}, null, 2));
