import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(experimentRoot, "../../../../..");
const readJson = (path) => JSON.parse(readFileSync(resolve(repoRoot, path), "utf8"));
const readText = (path) => readFileSync(resolve(repoRoot, path), "utf8");
const sha256 = (path) => createHash("sha256").update(readFileSync(resolve(repoRoot, path))).digest("hex");
const errors = [];
const checks = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

const ontologyPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json";
const projectionPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json";
const selectionPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/decisions/W4-A-PURE-GRAPH-BOUND.json";
const profilePaths = {
  typescript: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json",
  python: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json",
  rust: "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json",
};
const historicalTypeScriptProfilePath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/semantic-slices/legacy-whole-file-snapshots/enum-v1/typescript-strict.profile.json";
const providerPaths = {
  typescript: {
    StateMachine: "projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/providers/typescript/settlement-state-machine.ts",
    Workflow: "projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/providers/typescript/settlement-workflow.ts",
  },
  python: {
    StateMachine: "projects/domainspec-v2/impl/architecture-conformance/targets/python/w4_state_machine.py",
    Workflow: "projects/domainspec-v2/impl/architecture-conformance/targets/python/w4_workflow.py",
  },
  rust: {
    StateMachine: "projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/w4/state_machine.rs",
    Workflow: "projects/domainspec-v2/impl/architecture-conformance/targets/rust/src/w4/workflow.rs",
  },
};
const descriptorPath = "projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/fixtures/financial-settlement/descriptors.json";
const observationPath = "projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/fixtures/financial-settlement/observations.json";

const ontology = readJson(ontologyPath);
const projection = readJson(projectionPath);
const concepts = new Map(ontology.concept_types.map((item) => [item.concept_id, item]));
const properties = new Set(ontology.property_definitions.map((item) => item.property_id));
const relations = new Map(ontology.relation_definitions.map((item) => [item.relation_id, item]));

const requiredConcepts = new Map([
  ["architecture.StateMachineImplementation", "DS-D1.14"],
  ["architecture.WorkflowImplementation", "DS-D1.9"],
]);
for (const [typeId, metaTypeId] of requiredConcepts) {
  const concept = concepts.get(typeId);
  expect(concept?.extends === "architecture.DomainConceptImplementation", `${typeId} must extend DomainConceptImplementation`);
  expect(concept?.canonical_meta_type_ref === metaTypeId, `${typeId} must reciprocally bind ${metaTypeId}`);
  expect(concept?.candidate_status === "candidate", `${typeId} implemented realization must be candidate`);
  const projected = projection.meta_types.find((item) => item.meta_type_id === metaTypeId);
  expect(projected?.mapping_status === "candidate-mapped" && projected?.architecture_type_id === typeId, `${metaTypeId} projection must map to ${typeId}`);
}
expect(concepts.get("architecture.StateContract")?.canonical_mapping_status === "architecture-role-only", "StateContract must remain architecture-only");
expect(concepts.get("architecture.WorkflowStepContract")?.canonical_mapping_status === "architecture-role-only", "WorkflowStepContract must remain architecture-only");
checks.push("W4 ontology types, reciprocal projections, and candidate boundary");

const requiredProperties = [
  "state.expected_states_ref", "state.initial_state_ref", "state.terminal_states_ref", "transition.trigger", "transition.guard_bindings_ref", "transition.effect_intents_ref", "transition.invalid_policy", "transition.effect_execution",
  "workflow.scope", "workflow.step_order_ref", "workflow.terminal_outcomes_ref", "workflow.failure_contract_ref", "workflow.continuation_boundary", "workflow.step_id", "workflow.step_failure_policy", "workflow.step_compensation_ref",
];
for (const property of requiredProperties) expect(properties.has(property), `missing W4 property ${property}`);
checks.push(`${requiredProperties.length} W4 properties`);

const requiredRelations = {
  "architecture.has_state": ["architecture.StateMachineImplementation", "architecture.StateContract"],
  "architecture.transitions_to": ["architecture.StateContract", "architecture.StateContract"],
  "architecture.orchestrates": ["architecture.WorkflowImplementation", "architecture.WorkflowStepContract"],
  "architecture.precedes": ["architecture.WorkflowStepContract", "architecture.WorkflowStepContract"],
  "architecture.binds_step": ["architecture.WorkflowStepContract", "architecture.OperationImplementation"],
};
for (const [relationId, [source, target]] of Object.entries(requiredRelations)) {
  const relation = relations.get(relationId);
  expect(relation?.source_types.includes(source), `${relationId} missing source ${source}`);
  expect(relation?.target_types.includes(target), `${relationId} missing target ${target}`);
  expect(relation?.authority_effect === "none", `${relationId} must not carry authority`);
}
expect(relations.get("architecture.transitions_to")?.properties.join(",") === "transition.trigger,transition.guard_bindings_ref,transition.effect_intents_ref", "transition edge must carry trigger, guard, and effect-intent refs");
expect(relations.get("architecture.transitions_to")?.value_effect === "value-free" && relations.get("architecture.transitions_to")?.cycle_policy === "cycle-permitted", "transition topology must permit lifecycle loops without creating recursive value derivation");
checks.push("typed State Machine and Workflow graph relations");

const forms = {
  typescript: {StateMachine: "typescript.discriminated-union-reducer", Workflow: "typescript.workflow-step-orchestrator"},
  python: {StateMachine: "python.enum-transition-function", Workflow: "python.workflow-step-orchestrator"},
  rust: {StateMachine: "rust.state-enum-transition-match", Workflow: "rust.workflow-step-orchestrator"},
};
const contracts = {StateMachine: "state-machine.profile-representation", Workflow: "workflow.profile-representation"};
for (const [language, profilePath] of Object.entries(profilePaths)) {
  const profile = readJson(profilePath);
  for (const kind of ["StateMachine", "Workflow"]) {
    const overlay = profile.representation_overlays.find((item) => item.contract_id === contracts[kind]);
    expect(overlay?.admitted_forms.includes(forms[language][kind]), `${language} ${kind} form is not admitted`);
    expect(overlay?.admission_status === "candidate", `${language} ${kind} must be candidate`);
    const protocol = overlay?.candidate_protocols?.[0];
    const path = providerPaths[language][kind];
    expect(protocol?.runtime_provider?.module_path === path, `${language} ${kind} provider path drift`);
    expect(protocol?.runtime_provider?.provider_sha256 === sha256(path), `${language} ${kind} provider digest drift`);
    const source = readText(path);
    for (const exported of protocol?.runtime_provider?.required_exports ?? []) expect(source.includes(exported), `${language} ${kind} missing declared export ${exported}`);
  }
}
checks.push("six candidate language protocols with exact one-concept provider digests");

const descriptors = readJson(descriptorPath);
const observations = readJson(observationPath);
expect(descriptors.descriptors.length === 2 && observations.observations.length === 2, "W4 fixture cardinality must be two");
const registryDigest = sha256("projects/domainspec-v2/definitions/meta-types/meta-types.yml");
// Existing W4 descriptors are immutable historical evidence. Their broad profile
// reference remains bound to the exact pre-Calculation snapshot, while the loop
// above selects and validates the current W4 overlays from the live profile.
const profileDigest = sha256(historicalTypeScriptProfilePath);
const fixtureDigest = sha256(observationPath);
const selectionDigest = sha256(selectionPath);
for (const [index, descriptor] of descriptors.descriptors.entries()) {
  const providerPath = providerPaths.typescript[descriptor.kind];
  expect(descriptor.binding.protocol_id === "domainspec.w4-descriptor-binding/v1", `${descriptor.kind} protocol drift`);
  expect(descriptor.binding.concept_ref.sha256 === registryDigest, `${descriptor.kind} registry digest drift`);
  expect(descriptor.binding.decision_ref.sha256 === selectionDigest, `${descriptor.kind} selection digest drift`);
  expect(descriptor.binding.profile_ref.sha256 === profileDigest, `${descriptor.kind} profile digest drift`);
  expect(descriptor.binding.provider_ref.sha256 === sha256(providerPath) && descriptor.binding.source_ref.sha256 === sha256(providerPath), `${descriptor.kind} provider/source digest drift`);
  expect(descriptor.binding.fixture_ref.sha256 === fixtureDigest, `${descriptor.kind} fixture digest drift`);
  expect(descriptor.kind === observations.observations[index]?.kind, `${descriptor.kind} observation join drift`);
  expect(descriptor.admission_status === "candidate" && descriptor.authority_effect === "none", `${descriptor.kind} candidate boundary drift`);
}
expect(descriptors.descriptors.find((item) => item.kind === "StateMachine")?.effect_execution === "returned-effect-intents", "State Machine must return effect intents for Operation execution");
checks.push("two exact content-addressed descriptor joins");

console.log(JSON.stringify({
  schema_version: "domainspec.w4-validation/v1",
  verdict: errors.length === 0 ? "pass" : "fail",
  checks,
  errors,
  claim_ceiling: "candidate-local ontology, profiles, provider-source bindings, and fixtures; hostile accounting and native execution remain separately required validation evidence; no promotion, release, deployment, or production proof",
  authority_effect: "none",
}, null, 2));
if (errors.length > 0) process.exitCode = 1;
