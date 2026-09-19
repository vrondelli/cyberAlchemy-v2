#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const defineRoot = resolve(here, "..");
let repoRoot = here;
while (!existsSync(resolve(repoRoot, "AGENTS.md"))) {
  const parent = resolve(repoRoot, "..");
  if (parent === repoRoot) throw new Error("repository root not found");
  repoRoot = parent;
}
const readText = (path) => readFileSync(path, "utf8");
const readJson = (path) => JSON.parse(readText(path));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalDigest = (value) => sha256(JSON.stringify(sortValue(value)));
const sortValue = (value) => Array.isArray(value) ? value.map(sortValue) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])])) : value;
let checks = 0;
const assert = (condition, message) => { checks += 1; if (!condition) throw new Error(message); };

const required = [
  "DEFINE-CONTEXT.md", "DEFINE-INTENT.md", "DEFINE-TEMPLATE-SELECTION.md", "SPEC.md", "GLOSSARY.md",
  "COMPLEXITY-EXAMPLES.md", "DEFINE-DISPATCH-TECHNIQUE-TRACE.md", "DEFINE-DISTILL-VALIDATION.md",
  "DEFINE-GAPS.md", "DEFINE-RESULT.md", "DEFINE-TRANSPORT.json"
];
for (const file of required) assert(existsSync(resolve(defineRoot, file)), `missing ${file}`);

const spec = readText(resolve(defineRoot, "SPEC.md"));
const glossary = readText(resolve(defineRoot, "GLOSSARY.md"));
const examples = readText(resolve(defineRoot, "COMPLEXITY-EXAMPLES.md"));
const distill = readText(resolve(defineRoot, "DEFINE-DISTILL-VALIDATION.md"));
const result = readText(resolve(defineRoot, "DEFINE-RESULT.md"));
const transport = readJson(resolve(defineRoot, "DEFINE-TRANSPORT.json"));
const researchValidation = readJson(resolve(defineRoot, "../../RESEARCH-VALIDATION.json"));

assert(spec.includes("EmitsIncomingClosureEvidenceEnvelope"), "specific envelope missing");
assert(spec.includes("EmitsTargetMaxEvaluationReceipt"), "receipt record missing");
assert(spec.includes("two independently governed records"), "independent governance missing");
assert(spec.includes("incoming canonical `emits` fact set or manifest reference and digest"), "incoming fact-set binding missing");
assert(spec.includes("outgoing explicitly open"), "N37 outgoing boundary drift");
assert(spec.includes("not-evaluated-incomplete-closure"), "fail-closed verdict missing");
assert(spec.includes("Exact digest equality is the minimum candidate freshness check"), "freshness candidate missing");
assert(spec.includes("no TTL is invented"), "TTL boundary missing");
assert(glossary.includes("candidate-local explanatory terms"), "glossary authority ceiling missing");
assert((examples.match(/^## (Low|Medium|Complex)/gm) ?? []).length === 3, "complexity ladder must have 3 rungs");
assert(examples.includes("Decision effect: none"), "example decision effect drift");
assert(distill.includes("flag-before-owner-admission"), "Distill verdict missing");
assert(distill.includes("2/2"), "Distill round budget missing");
assert(result.includes("N38-A through N41-A are recorded; N42 remains pending"), "next route drift");
assert(transport.phase_status === "n38-n41-selected-design-blocked-at-n42-owner-decision", "transport phase drift");
assert(transport.identity_denominator_validation.status === "not-applicable", "identity denominator drift");
assert(transport.authority_effect === "none", "transport authority growth");
assert(researchValidation.result === "pass-for-bounded-negative-finding", "research baseline drift");

const gateRoot = resolve(defineRoot, "decisions/N38-EMITS-CLOSURE-EVIDENCE-OWNER-ADMISSION");
const request = readJson(resolve(gateRoot, "OPTION-ADMISSIBILITY-REQUEST.json"));
const receipt = readJson(resolve(gateRoot, "OPTION-PREFILTER-RECEIPT.json"));
assert(canonicalDigest(request) === receipt.requestDigest, "prefilter request digest drift");
assert(receipt.routeOutcome === "gate" && receipt.decisionGateRequired === true, "N38 must route to gate");
assert(receipt.presentedOptionIds.length === 3, "N38 must present action/defer/stop");
assert(receipt.rejectedOptions.length === 3, "N38 must reject three overreach controls");
assert(request.candidates.find((item) => item.optionId.includes("38-A-")).hazardClass === "authority", "A authority hazard missing");
assert(request.candidates.find((item) => item.optionId.includes("38-A-")).ownerGate === "relationship-decision-owner:owner-decision", "A owner gate drift");
const selection = readJson(resolve(gateRoot, "OWNER-SELECTION-RECEIPT.json"));
assert(selection.selection.response === "A", "N38 exact response drift");
assert(selection.selection.selected_option_id === "BMC-REL-NONNUMERIC-38-A-ADMIT-SPLIT-CLOSURE-EVIDENCE-OWNERSHIP", "N38 selected option drift");
assert(selection.admissibility_binding.requestDigest === receipt.requestDigest, "N38 selection request digest drift");
assert(selection.authorization_boundary.split_ownership_chain_admitted_for_design === true, "N38 Design admission missing");
assert(selection.authorization_boundary.representation_selected === false, "N38 representation overreach");
assert(transport.n38_selection === selection.selection.selected_option_id, "transport N38 selection drift");
const n39GateRoot = resolve(defineRoot, "design/representation-r1/decisions/N39-EMITS-CLOSURE-ENVELOPE-PLACEMENT");
const n39Selection = readJson(resolve(n39GateRoot, "OWNER-SELECTION-RECEIPT.json"));
assert(n39Selection.selection.response === "A", "N39 exact response drift");
assert(n39Selection.selection.selected_option_id === "BMC-REL-NONNUMERIC-39-A-DEDICATED-CONSUMER-CLOSURE-SIDECAR", "N39 selected option drift");
assert(transport.n39_selection === n39Selection.selection.selected_option_id, "transport N39 selection drift");
const n40GateRoot = resolve(defineRoot, "design/representation-r1/continuations/N40-EMITS-CLOSURE-SNAPSHOT-CURRENTNESS/decisions/N40-EMITS-CLOSURE-SNAPSHOT-CURRENTNESS");
const n40Selection = readJson(resolve(n40GateRoot, "OWNER-SELECTION-RECEIPT.json"));
assert(n40Selection.selection.response === "A", "N40 exact response drift");
assert(n40Selection.selection.selected_option_id === "BMC-REL-NONNUMERIC-40-A-SNAPSHOT-RELATIVE-EVALUATION-CURRENTNESS-EXTERNAL", "N40 selected option drift");
assert(transport.n40_selection === n40Selection.selection.selected_option_id, "transport N40 selection drift");
const n41GateRoot = resolve(defineRoot, "design/representation-r1/continuations/N41-EMITS-CLOSURE-SIDECAR-IDENTITY-LIFECYCLE/decisions/N41-EMITS-CLOSURE-SIDECAR-IDENTITY-LIFECYCLE");
const n41Selection = readJson(resolve(n41GateRoot, "OWNER-SELECTION-RECEIPT.json"));
assert(n41Selection.selection.response === "A", "N41 exact response drift");
assert(n41Selection.selection.selected_option_id === "BMC-REL-NONNUMERIC-41-A-DIGEST-ADDRESSED-COEXISTENCE-NO-SUPERSESSION", "N41 selected option drift");
assert(transport.n41_selection === n41Selection.selection.selected_option_id, "transport N41 selection drift");
assert(transport.n42_selection === null, "premature N42 selection");

const preserved = [
  ["projects/domainspec-v2/definitions/relationships/relationships.yml", "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1"],
  ["projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json", "a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0"],
  ["projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json", "d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7"],
  ["projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs", "69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975"]
];
for (const [path, expected] of preserved) assert(sha256(readFileSync(resolve(repoRoot, path))) === expected, `preserved digest drift: ${path}`);

const baseline = {split:true, compilerAttests:false, outgoingRequired:false, profileAdmitted:false, n39Selected:true, n40Selected:true, n41Selected:true, n42Selected:false, runtime:false, packetMutation:false, ttl:false};
function validateBoundary(state) {
  if (!state.split) throw new Error("authority collapse");
  if (state.compilerAttests) throw new Error("compiler completeness overreach");
  if (state.outgoingRequired) throw new Error("N37 outgoing overreach");
  if (state.profileAdmitted) throw new Error("profile admission overreach");
  if (!state.n39Selected) throw new Error("N39 selection lost");
  if (!state.n40Selected) throw new Error("N40 selection lost");
  if (!state.n41Selected) throw new Error("N41 selection lost");
  if (state.n42Selected) throw new Error("premature N42 selection");
  if (state.runtime) throw new Error("runtime semantics overreach");
  if (state.packetMutation) throw new Error("packet mutation overreach");
  if (state.ttl) throw new Error("invented TTL");
}
validateBoundary(baseline);
const probes = ["split", "compilerAttests", "outgoingRequired", "profileAdmitted", "n39Selected", "n40Selected", "n41Selected", "n42Selected", "runtime", "packetMutation", "ttl"];
for (const probe of probes) {
  const hostile = {...baseline, [probe]: ["split", "n39Selected", "n40Selected", "n41Selected"].includes(probe) ? false : true};
  let rejected = false;
  try { validateBoundary(hostile); } catch { rejected = true; }
  assert(rejected, `hostile probe accepted: ${probe}`);
}

console.log(JSON.stringify({result:"pass", checks, artifacts:required.length, hostile_probes_rejected:probes.length, define_phase:"n38-n41-selected-design-blocked-at-n42-owner-decision", n38_selection:selection.selection.selected_option_id, n39_selection:n39Selection.selection.selected_option_id, n40_selection:n40Selection.selection.selected_option_id, n41_selection:n41Selection.selection.selected_option_id, n42_selection:null, authority_effect:"none"}, null, 2));
