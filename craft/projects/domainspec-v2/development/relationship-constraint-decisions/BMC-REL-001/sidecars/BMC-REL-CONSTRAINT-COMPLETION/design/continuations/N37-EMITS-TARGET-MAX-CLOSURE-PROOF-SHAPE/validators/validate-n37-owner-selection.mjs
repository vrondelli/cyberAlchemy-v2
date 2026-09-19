#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const continuation = dirname(dirname(fileURLToPath(import.meta.url)));
const repository = process.cwd();
const A = 'BMC-REL-NONNUMERIC-37-A-MINIMAL-INCOMING-CLOSURE-ENVELOPE';
const DECISION = 'BMC-REL-NONNUMERIC-37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE';
const REQUEST_SHA = '52b2fdd408975b95451179c9ab045905b8ecd5299e36de8cabf2cef08355dc21';
const PREFILTER_SHA = 'e98dc8c05df721954265fac3a8f4aaacd7f7dd07fac1db5289414f9f6e178f67';
const REQUEST_DIGEST = 'ef5162372e9fb22b64f2b24d0bb553e0d17e0d91b39759e6c1cdc04a9341e799';
const PRESENTATION_VALIDATION_SHA = 'd2bb4122768087b4c15e2f8f205c8b158a4e648bae1ee8290726d8b274d95908';
const PRESENTATION_CLOSEOUT_SHA = '63ff09a9e458c68d61aff3b419bf4f8ab78ec9b8ad6a98f03e76788009786b73';
const OWNER_SHA = 'ffd7ffde4ad4a3338674204214eebee9f617a71d87c3a233936ab00d07b57ff3';
const FRONTIER_SHA = '9723002e522df8fe50dac89d738a43e452895fd3f5d8e2e60949f87e77ea7221';
const CANONICAL = {
  relationships: ['projects/domainspec-v2/definitions/relationships/relationships.yml', '82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1'],
  packet: ['projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json', 'a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0'],
  schema: ['projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json', 'd68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7'],
  main_validator: ['projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs', '69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975']
};

function assert(value, message) {
  if (!value) throw new Error(message);
}

function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function local(name) {
  return join(continuation, name);
}

function sha(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function validate(model) {
  const { request, prefilter, presentationValidation, presentationCloseout, owner, frontier, postselectionValidation } = model;

  assert(model.hashes.request === REQUEST_SHA, 'request bytes drift');
  assert(model.hashes.prefilter === PREFILTER_SHA, 'prefilter bytes drift');
  assert(model.hashes.presentationValidation === PRESENTATION_VALIDATION_SHA, 'presentation validation bytes drift');
  assert(model.hashes.presentationCloseout === PRESENTATION_CLOSEOUT_SHA, 'presentation closeout bytes drift');
  assert(model.hashes.owner === OWNER_SHA, 'owner receipt bytes drift');
  assert(model.hashes.frontier === FRONTIER_SHA, 'frontier receipt bytes drift');

  assert(request.decisionId === DECISION, 'request decision drift');
  const option = request.candidates.find((candidate) => candidate.optionId === A);
  assert(option?.structuralStatus === 'admissible', 'selected A is not admissible');
  assert(option?.hazardClass === 'authority', 'selected A hazard drift');
  assert(option?.ownerGate === 'relationship-decision-owner:owner-decision', 'selected A owner gate drift');
  assert(prefilter.requestDigest === REQUEST_DIGEST, 'prefilter request digest drift');
  assert(prefilter.routeOutcome === 'gate' && prefilter.decisionGateRequired === true, 'prefilter route drift');
  assert(prefilter.presentedOptionIds.includes(A) && prefilter.admissibleOptionIds.includes(A), 'A was not presented and admitted');

  assert(presentationValidation.phase_status === 'blocked-at-owner-decision', 'presentation validation phase drift');
  assert(presentationValidation.selection === null, 'immutable presentation validation was rewritten after selection');
  assert(presentationValidation.authority_effect === 'none', 'presentation validation authority growth');
  assert(presentationCloseout.status === 'blocked-at-owner-decision', 'presentation closeout phase drift');
  assert(presentationCloseout.selection === null, 'immutable presentation closeout was rewritten after selection');
  assert(presentationCloseout.request_digest === REQUEST_DIGEST, 'presentation closeout digest drift');

  assert(owner.schema_version === 'domainspec.decision-gate.owner-selection-receipt/v1', 'owner receipt schema drift');
  assert(owner.decision_id === DECISION, 'owner receipt decision drift');
  assert(owner.selection.response === 'A' && owner.selection.selected_option_id === A, 'owner selection is not exact A');
  assert(owner.selection.selected_by === 'user', 'owner selection source is not user');
  assert(owner.selection.exact_response_timestamp_exposed === false, 'response timestamp claim inflated');
  assert(owner.selection.recording_time_note.includes('receipt recording time'), 'recording-time distinction missing');

  const binding = owner.admissibility_binding;
  assert(binding.request_sha256 === REQUEST_SHA, 'owner request binding drift');
  assert(binding.receipt_sha256 === PREFILTER_SHA, 'owner prefilter binding drift');
  assert(binding.requestDigest === REQUEST_DIGEST, 'owner request digest drift');
  assert(binding.gate_validation_sha256 === PRESENTATION_VALIDATION_SHA, 'owner validation binding drift');
  assert(binding.route_outcome === 'gate', 'owner route binding drift');
  assert(binding.selected_option_admitted === true && binding.selected_option_presented === true, 'owner admission binding drift');
  assert(binding.hazard_class === 'authority', 'owner hazard binding drift');
  assert(binding.owner_gate === 'relationship-decision-owner:owner-decision', 'owner gate binding drift');
  assert(postselectionValidation.historical_bindings.request_digest === binding.requestDigest, 'persisted validation digest differs from owner admissibility binding');
  assert(postselectionValidation.historical_bindings.request_digest === prefilter.requestDigest, 'persisted validation digest differs from prefilter request digest');

  assert(owner.preselection_snapshot.request_sha256 === REQUEST_SHA, 'owner snapshot request drift');
  assert(owner.preselection_snapshot.prefilter_receipt_sha256 === PREFILTER_SHA, 'owner snapshot prefilter drift');
  assert(owner.preselection_snapshot.requestDigest === REQUEST_DIGEST, 'owner snapshot digest drift');
  assert(owner.preselection_snapshot.design_validation_sha256 === PRESENTATION_VALIDATION_SHA, 'owner snapshot validation drift');
  assert(owner.preselection_snapshot.presentation_closeout_sha256 === PRESENTATION_CLOSEOUT_SHA, 'owner snapshot closeout drift');

  assert(owner.scope_binding.canonical_verb === 'emits', 'owner verb drift');
  assert(owner.scope_binding.numeric_predicate === 'target_max=1', 'owner predicate drift');
  assert(owner.scope_binding.counting_unit === 'distinct-authored-canonical-concept-fact-after-exact-duplicate-rejection', 'owner counting unit drift');
  assert(JSON.stringify(owner.scope_binding.required_closure_evidence) === JSON.stringify([
    'declared boundary identity and kind',
    'complete eligible Entity population and boundary placement',
    'complete eligible Event population and boundary placement',
    'complete incoming canonical emits adjacency for every eligible Event'
  ]), 'owner closure coordinates drift');
  assert(owner.scope_binding.outgoing_adjacency_required === false, 'owner outgoing adjacency requirement widened');
  assert(owner.scope_binding.missing_proof_verdict === 'not-evaluated-incomplete-closure', 'owner missing-proof verdict drift');
  assert(owner.selection_effect.outgoing_adjacency_policy.includes('not required to prove target_max=1'), 'owner directional effect missing');
  assert(owner.selection_effect.incomplete_proof_policy.includes('not-evaluated-incomplete-closure'), 'owner incomplete-proof effect missing');
  assert(owner.selection_effect.does_not_select.length === 6, 'owner non-effect inventory drift');

  const ownerAuth = owner.authorization_boundary;
  assert(ownerAuth.n37_owner_choice_made === true && ownerAuth.minimal_incoming_closure_envelope_selected === true, 'owner selection effect missing');
  for (const key of [
    'closure_serialization_selected',
    'packet_mapping_or_projection_selected',
    'packet_mutation_authorized',
    'packet_accepted',
    'canonical_source_mutation_authorized',
    'implementation_authorized',
    'runtime_or_event_sourcing_semantics_selected',
    'promotion_publication_release_or_deployment_authorized'
  ]) assert(ownerAuth[key] === false, `owner non-effect widened: ${key}`);
  assert(ownerAuth.repository_authority_effect === 'none', 'owner repository authority growth');

  assert(frontier.status === 'blocked-before-n38-decision-gate', 'frontier status drift');
  assert(frontier.n38_gate_formed === false, 'N38 gate fabricated');
  assert(frontier.resolved_decision.decision_id === DECISION && frontier.resolved_decision.selected_option_id === A, 'frontier resolved decision drift');
  assert(frontier.resolved_decision.owner_selection_receipt_sha256 === OWNER_SHA, 'frontier owner receipt binding drift');
  assert(frontier.reason.includes('do not define two or more consequence-distinct representation contracts'), 'frontier evidence blocker drift');
  assert(frontier.required_evidence_before_n38.length === 5, 'frontier evidence requirements drift');
  assert(frontier.next_owner_clarification.recommendation === null, 'frontier recommendation invented');
  assert(frontier.next_owner_clarification.selection === null, 'frontier owner invented');
  assert(frontier.next_owner_clarification.decision_gate === false, 'frontier clarification inflated to gate');
  assert(frontier.evidence_bindings.n37_request_sha256 === REQUEST_SHA, 'frontier request binding drift');
  assert(frontier.evidence_bindings.n37_prefilter_receipt_sha256 === PREFILTER_SHA, 'frontier prefilter binding drift');
  assert(frontier.evidence_bindings.n37_request_digest === REQUEST_DIGEST, 'frontier request digest drift');
  assert(frontier.evidence_bindings.n37_validation_sha256 === PRESENTATION_VALIDATION_SHA, 'frontier validation binding drift');

  const frontierAuth = frontier.authorization_boundary;
  assert(frontierAuth.n37_owner_choice_made === true && frontierAuth.n38_owner_choice_made === false, 'frontier lifecycle drift');
  for (const key of [
    'closure_evidence_owner_selected',
    'closure_representation_selected',
    'packet_projection_authorized',
    'packet_mutation_authorized',
    'packet_accepted',
    'canonical_source_mutation_authorized',
    'implementation_authorized',
    'promotion_publication_release_or_deployment_authorized'
  ]) assert(frontierAuth[key] === false, `frontier non-effect widened: ${key}`);
  assert(frontierAuth.repository_authority_effect === 'none', 'frontier repository authority growth');

  assert(presentationValidation.canonical_preservation.d06_status === 'closed-and-untouched', 'D06 preservation drift');
  for (const [name, [path, expected]] of Object.entries(CANONICAL)) {
    assert(sha(join(repository, path)) === expected, `canonical preservation drift: ${name}`);
  }
}

function load() {
  const paths = {
    request: local('decisions/BMC-REL-NONNUMERIC-37-OPTION-ADMISSIBILITY-REQUEST.json'),
    prefilter: local('decisions/BMC-REL-NONNUMERIC-37-OPTION-PREFILTER-RECEIPT.json'),
    presentationValidation: local('DESIGN-VALIDATION.json'),
    presentationCloseout: local('DESIGN-CLOSEOUT-RECEIPT.json'),
    owner: local('decisions/BMC-REL-NONNUMERIC-37-OWNER-SELECTION-RECEIPT.json'),
    frontier: local('decisions/BMC-REL-NONNUMERIC-POST-N37-FRONTIER-BLOCK-RECEIPT.json'),
    postselectionValidation: local('N37-OWNER-SELECTION-VALIDATION.json')
  };
  return {
    request: json(paths.request),
    prefilter: json(paths.prefilter),
    presentationValidation: json(paths.presentationValidation),
    presentationCloseout: json(paths.presentationCloseout),
    owner: json(paths.owner),
    frontier: json(paths.frontier),
    postselectionValidation: json(paths.postselectionValidation),
    hashes: Object.fromEntries(Object.entries(paths).map(([name, path]) => [name, sha(path)]))
  };
}

function probe(name, mutate, base, results) {
  const copy = structuredClone(base);
  mutate(copy);
  let rejected = false;
  try { validate(copy); } catch { rejected = true; }
  assert(rejected, `hostile survived: ${name}`);
  results.push({ name, result: 'rejected' });
}

const model = load();
validate(model);
const probes = [];
if (process.argv.includes('--self-test')) {
  probe('selection-response-drift', (m) => { m.owner.selection.response = 'B'; }, model, probes);
  probe('selection-source-drift', (m) => { m.owner.selection.selected_by = 'agent'; }, model, probes);
  probe('admission-binding-drift', (m) => { m.owner.admissibility_binding.selected_option_admitted = false; }, model, probes);
  probe('request-digest-drift', (m) => { m.owner.admissibility_binding.requestDigest = '0'.repeat(64); }, model, probes);
  probe('persisted-validation-request-digest-drift', (m) => { m.postselectionValidation.historical_bindings.request_digest = '0'.repeat(64); }, model, probes);
  probe('missing-entity-population', (m) => { m.owner.scope_binding.required_closure_evidence.splice(1, 1); }, model, probes);
  probe('outgoing-closure-widened', (m) => { m.owner.scope_binding.outgoing_adjacency_required = true; }, model, probes);
  probe('packet-projection-inflation', (m) => { m.owner.authorization_boundary.packet_mapping_or_projection_selected = true; }, model, probes);
  probe('owner-authority-inflation', (m) => { m.owner.authorization_boundary.repository_authority_effect = 'semantic'; }, model, probes);
  probe('fabricated-n38-gate', (m) => { m.frontier.n38_gate_formed = true; }, model, probes);
  probe('fabricated-frontier-recommendation', (m) => { m.frontier.next_owner_clarification.recommendation = 'inline-envelope'; }, model, probes);
  probe('frontier-owner-inflation', (m) => { m.frontier.authorization_boundary.closure_evidence_owner_selected = true; }, model, probes);
  probe('immutable-presentation-rewrite', (m) => { m.presentationValidation.selection = A; }, model, probes);
}

console.log(JSON.stringify({
  schema_version: 'domainspec.n37-owner-selection-validation/v1',
  decision_id: DECISION,
  phase: 'postselection',
  result: 'pass',
  selected_option_id: A,
  selected_by: model.owner.selection.selected_by,
  request_sha256: REQUEST_SHA,
  prefilter_receipt_sha256: PREFILTER_SHA,
  request_digest: REQUEST_DIGEST,
  presentation_validation_sha256: PRESENTATION_VALIDATION_SHA,
  presentation_closeout_sha256: PRESENTATION_CLOSEOUT_SHA,
  owner_selection_receipt_sha256: OWNER_SHA,
  frontier_block_receipt_sha256: FRONTIER_SHA,
  hostile_probes: probes,
  n38_gate_formed: false,
  packet_mutated: false,
  canonical_mutated: false,
  d06_status: 'closed-and-untouched',
  authority_effect: 'none'
}, null, 2));
