#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const A = 'BMC-REL-NUMERIC-EMITS-01-A-OPTIONAL-MANY-OUTGOING-OPTIONAL-SINGLE-SUBJECT';

function assert(value, message) { if (!value) throw new Error(message); }
function json(name) { return JSON.parse(readFileSync(join(root, name), 'utf8')); }
function sha(name) { return createHash('sha256').update(readFileSync(join(root, name))).digest('hex'); }

function load() {
  return {
    request: json('OPTION-ADMISSIBILITY-REQUEST.json'),
    receipt: json('OPTION-PREFILTER-RECEIPT.json'),
    gateValidation: json('GATE-VALIDATION.json'),
    selection: json('OWNER-SELECTION-RECEIPT.json'),
    closeout: readFileSync(join(root, 'DECISION-CLOSEOUT.md'), 'utf8')
  };
}

function validate(model) {
  const { request, receipt, gateValidation, selection, closeout } = model;
  assert(selection.decision_id === request.decisionId, 'decision binding drift');
  assert(selection.selection.response === 'A' && selection.selection.selected_option_id === A, 'selection drift');
  assert(selection.selection.selected_by === 'user' && selection.selection.exact_response_timestamp_exposed === false, 'owner source drift');
  assert(receipt.routeOutcome === 'gate' && receipt.presentedOptionIds.includes(A) && receipt.admissibleOptionIds.includes(A), 'selected option not admitted and presented');
  assert(selection.admissibility_binding.request_sha256 === sha('OPTION-ADMISSIBILITY-REQUEST.json'), 'request hash drift');
  assert(selection.admissibility_binding.receipt_sha256 === sha('OPTION-PREFILTER-RECEIPT.json'), 'receipt hash drift');
  assert(selection.admissibility_binding.requestDigest === receipt.requestDigest, 'request digest drift');
  assert(selection.admissibility_binding.gate_validation_sha256 === sha('GATE-VALIDATION.json'), 'gate validation hash drift');
  assert(selection.admissibility_binding.hazard_class === 'authority' && selection.admissibility_binding.owner_gate === 'relationship-decision-owner:owner-decision', 'owner gate drift');
  assert(gateValidation.selection === null && gateValidation.pre_gate_response.counts_as_post_prefilter_selection === false, 'historical gate boundary drift');
  assert(JSON.stringify(selection.scope_binding.selected_tuple) === JSON.stringify({source_min:0, source_max:'unbounded', target_min:0, target_max:1}), 'selected tuple drift');
  assert(selection.scope_binding.counting_unit === 'distinct-authored-canonical-concept-fact-after-exact-duplicate-rejection', 'counting unit drift');
  assert(selection.authorization_boundary.emits_numeric_bounds_selected === true, 'selection effect missing');
  for (const key of ['packet_projection_authorized','packet_mutation_authorized','packet_accepted','canonical_source_mutation_authorized','implementation_authorized','runtime_or_event_sourcing_semantics_selected','promotion_publication_release_or_deployment_authorized']) {
    assert(selection.authorization_boundary[key] === false, `authority growth: ${key}`);
  }
  assert(selection.authorization_boundary.repository_authority_effect === 'none', 'repository authority growth');
  assert(closeout.includes('Status: selected; packet projection not authorized.') && closeout.includes('Decision Gate result: PASS.'), 'closeout phase drift');
  assert(closeout.includes('{source_min: 0, source_max: unbounded, target_min: 0, target_max: 1}'), 'closeout tuple drift');
}

function probe(name, mutate, base, results) {
  const copy = structuredClone(base);
  mutate(copy);
  let rejected = false;
  try { validate(copy); } catch { rejected = true; }
  assert(rejected, `hostile survived: ${name}`);
  results.push({name, result:'rejected'});
}

const model = load();
validate(model);
const probes = [];
if (process.argv.includes('--self-test')) {
  probe('response-drift', (m) => { m.selection.selection.response = 'B'; }, model, probes);
  probe('selected-option-drift', (m) => { m.selection.selection.selected_option_id = 'unknown'; }, model, probes);
  probe('tuple-drift', (m) => { m.selection.scope_binding.selected_tuple.target_max = 'unbounded'; }, model, probes);
  probe('packet-projection-inflation', (m) => { m.selection.authorization_boundary.packet_projection_authorized = true; }, model, probes);
  probe('runtime-inference', (m) => { m.selection.authorization_boundary.runtime_or_event_sourcing_semantics_selected = true; }, model, probes);
  probe('owner-gate-drift', (m) => { m.selection.admissibility_binding.owner_gate = 'different-owner'; }, model, probes);
}

console.log(JSON.stringify({
  schema_version: 'domainspec.emits-numeric-owner-selection-validation/v1',
  decision_id: model.selection.decision_id,
  result: 'pass',
  selection: model.selection.selection.response,
  selected_option_id: model.selection.selection.selected_option_id,
  selected_tuple: model.selection.scope_binding.selected_tuple,
  hostile_probes: probes,
  packet_projection_authorized: false,
  authority_effect: 'none'
}, null, 2));
