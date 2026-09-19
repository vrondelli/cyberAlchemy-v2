#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const continuation = dirname(dirname(fileURLToPath(import.meta.url)));
const repository = process.cwd();
const A = 'BMC-REL-NONNUMERIC-37-A-MINIMAL-INCOMING-CLOSURE-ENVELOPE';
const B = 'BMC-REL-NONNUMERIC-37-B-SYMMETRIC-OUTGOING-AND-INCOMING-CLOSURE-ENVELOPE';
const C = 'BMC-REL-NONNUMERIC-37-C-DEFER';
const D = 'BMC-REL-NONNUMERIC-37-D-STOP';
const REJECTED = [
  'BMC-REL-NONNUMERIC-37-W-EVENT-POPULATION-ONLY',
  'BMC-REL-NONNUMERIC-37-X-VISIBLE-FACTS-AS-CLOSURE',
  'BMC-REL-NONNUMERIC-37-Y-INFER-CLOSURE-FROM-SCOPE-OR-TOKEN',
  'BMC-REL-NONNUMERIC-37-Z-BUNDLE-REPRESENTATION-RUNTIME-OR-PRODUCES'
];

function assert(value, message) { if (!value) throw new Error(message); }
function local(name) { return join(continuation, name); }
function json(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function text(path) { return readFileSync(path, 'utf8'); }
function sha(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }
function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key])]));
  }
  return value;
}
function canonicalDigest(value) {
  return createHash('sha256').update(JSON.stringify(normalized(value))).digest('hex');
}

function load() {
  const manifest = json(local('DESIGN-SCOPE-MANIFEST.json'));
  const sourcePath = (id) => manifest.source_contracts.find((item) => item.source_id === id).path;
  return {
    manifest,
    denominator: json(local('DESIGN-DENOMINATOR-RECEIPT.json')),
    selection: json(local('DESIGN-SELECTION-RESULT.json')),
    request: json(local('decisions/BMC-REL-NONNUMERIC-37-OPTION-ADMISSIBILITY-REQUEST.json')),
    receipt: json(local('decisions/BMC-REL-NONNUMERIC-37-OPTION-PREFILTER-RECEIPT.json')),
    handoff: json(local('evidence/RUNTIME-HANDOFF.json')),
    n36: json(join(repository, sourcePath('n36-owner-selection'))),
    numeric: json(join(repository, sourcePath('numeric-selection'))),
    context: text(local('DESIGN-CONTEXT.md')),
    architecture: text(local('ARCHITECTURE-BUNDLE.md')),
    examples: text(local('DESIGN-DECISION-EXAMPLES.md')),
    distill: text(local('DESIGN-DISTILL-VALIDATION.md'))
  };
}

function validate(model) {
  const { manifest, denominator, selection, request, receipt, handoff, n36, numeric, context, architecture, examples, distill } = model;
  const manifestMaterial = Object.fromEntries(Object.entries(manifest).filter(([key]) => key !== 'input_digest'));
  assert(canonicalDigest(manifestMaterial) === manifest.input_digest, 'manifest digest drift');
  assert(manifest.source_contracts.length === 8 && manifest.unknowns.length === 0, 'source denominator drift');
  for (const source of manifest.source_contracts) {
    assert(sha(join(repository, source.path)) === source.digest, `source drift: ${source.source_id}`);
  }
  assert(denominator.verdict === 'pass' && denominator.inspected_selectors.length === 8, 'denominator not closed');
  const denominatorMaterial = Object.fromEntries(Object.entries(denominator).filter(([key]) => key !== 'receipt_digest'));
  assert(canonicalDigest(denominatorMaterial) === denominator.receipt_digest, 'denominator digest drift');
  assert(selection.verdict === 'pass' && selection.fixed_point === true, 'selection not passing');
  assert(selection.pass_1_digest === selection.pass_2_digest && selection.diagnostics.length === 0, 'selection fixed point drift');
  assert(selection.evidence_state === 'design-validator-pass', 'selection evidence state drift');

  assert(n36.selection.selected_option_id === 'BMC-REL-NONNUMERIC-36-A-NOT-EVALUATED-WITHOUT-RELEVANT-INCOMING-CLOSURE', 'N36 selection drift');
  assert(n36.scope_binding.selected_verdict === 'not-evaluated-incomplete-closure', 'N36 verdict drift');
  assert(n36.authorization_boundary.n37_closure_proof_shape_selected === false, 'N37 consent inferred from N36');
  assert(JSON.stringify(numeric.scope_binding.selected_tuple) === JSON.stringify({source_min:0, source_max:'unbounded', target_min:0, target_max:1}), 'numeric tuple drift');

  assert(request.decisionId === 'BMC-REL-NONNUMERIC-37-EMITS-TARGET-MAX-CLOSURE-PROOF-SHAPE', 'request id drift');
  assert(request.candidates.length === 8, 'candidate count drift');
  for (const id of [A, B]) {
    const option = request.candidates.find((item) => item.optionId === id);
    assert(option?.structuralStatus === 'admissible', `action not admissible: ${id}`);
    assert(option.hazardClass === 'authority' && option.ownerGate === 'relationship-decision-owner:owner-decision', `action owner gate drift: ${id}`);
  }
  for (const id of REJECTED) {
    assert(request.candidates.find((item) => item.optionId === id)?.structuralStatus === 'inadmissible', `rejected option admitted: ${id}`);
  }
  assert(receipt.routeOutcome === 'gate' && receipt.decisionGateRequired === true, 'prefilter route drift');
  assert(receipt.requestDigest === canonicalDigest(request), 'request digest drift');
  assert(JSON.stringify(receipt.presentedOptionIds) === JSON.stringify([A,B,C,D]), 'presented option drift');
  assert(JSON.stringify(receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(REJECTED), 'rejected receipt drift');

  assert(handoff.current_decision === request.decisionId && handoff.selected_option === null, 'premature N37 selection');
  assert(handoff.execution_allowed === false && handoff.authority_effect === 'none', 'handoff authority widened');
  assert(JSON.stringify(handoff.presented_options) === JSON.stringify([A,B,C,D]), 'handoff option drift');
  assert(!existsSync(local('decisions/BMC-REL-NONNUMERIC-37-OWNER-SELECTION-RECEIPT.json')), 'N37 owner receipt exists before response');

  assert(context.includes('complete eligible Entity and Event populations') && context.includes('complete incoming `emits` adjacency'), 'minimal envelope missing');
  assert(context.includes('Declare outgoing') && context.includes('stronger symmetric envelope'), 'A/B direction distinction missing');
  assert(context.includes('current packet remains') && context.includes('not semantic authority'), 'packet boundary missing');
  for (let index = 1; index <= 6; index += 1) assert(architecture.includes(`## ${index}.`), `architecture view ${index} missing`);
  for (const rung of ['## Low Complexity', '## Medium Complexity', '## Complex']) assert(examples.includes(rung), `example rung missing: ${rung}`);
  for (const label of ['**A —', '**B —', '**C —', '**D —']) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert((examples.match(new RegExp(escaped, 'g')) ?? []).length === 3, `uneven example coverage: ${label}`);
  }
  assert(examples.includes('Every `emits` fact remains inside its canonical same-feature scope.'), 'same-feature example boundary missing');
  assert(!examples.includes('Across Features'), 'cross-feature example survived');
  assert(examples.includes('Unsupported claims: `0`') && examples.includes('Decision effect: `none`'), 'example claim ceiling drift');
  assert(distill.includes('Mode and budget: Standard') && distill.includes('recursive rounds, then one reconciliation'), 'Distill budget drift');
  assert(distill.includes('Event-only closure') && distill.includes('Verdict: `pass`'), 'Distill reconciliation drift');
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
  probe('n36-selection-drift', (m) => { m.n36.selection.selected_option_id = 'other'; }, model, probes);
  probe('numeric-target-max-drift', (m) => { m.numeric.scope_binding.selected_tuple.target_max = 'unbounded'; }, model, probes);
  probe('event-only-population-admitted', (m) => { m.request.candidates.find((item) => item.optionId === REJECTED[0]).structuralStatus = 'admissible'; }, model, probes);
  probe('visible-facts-as-closure-admitted', (m) => { m.request.candidates.find((item) => item.optionId === REJECTED[1]).structuralStatus = 'admissible'; }, model, probes);
  probe('action-owner-gate-removed', (m) => { m.request.candidates.find((item) => item.optionId === A).ownerGate = null; }, model, probes);
  probe('request-digest-drift', (m) => { m.receipt.requestDigest = '0'.repeat(64); }, model, probes);
  probe('premature-n37-selection', (m) => { m.handoff.selected_option = A; }, model, probes);
  probe('cross-feature-example', (m) => { m.examples += '\nAcross Features\n'; }, model, probes);
}

console.log(JSON.stringify({
  schema_version: 'domainspec.n37-emits-target-max-closure-proof-validation/v1',
  decision_id: model.request.decisionId,
  result: 'pass',
  design_sources: model.manifest.source_contracts.length,
  fixed_point: model.selection.fixed_point,
  route_outcome: model.receipt.routeOutcome,
  presented_option_ids: model.receipt.presentedOptionIds,
  selection: null,
  recommendation: A,
  hostile_probes: probes,
  packet_mutated: false,
  authority_effect: 'none'
}, null, 2));
