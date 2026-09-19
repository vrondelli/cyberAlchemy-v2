#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const continuation = dirname(dirname(fileURLToPath(import.meta.url)));
const repository = process.cwd();
const A = 'BMC-REL-NONNUMERIC-36-A-NOT-EVALUATED-WITHOUT-RELEVANT-INCOMING-CLOSURE';
const B = 'BMC-REL-NONNUMERIC-36-B-PASS-OBSERVED-EMITS-SUBGRAPH-ONLY';
const C = 'BMC-REL-NONNUMERIC-36-C-DEFER';
const D = 'BMC-REL-NONNUMERIC-36-D-STOP';
const REJECTED = [
  'BMC-REL-NONNUMERIC-36-W-PASS-WHOLE-BOUNDARY-WITHOUT-CLOSURE',
  'BMC-REL-NONNUMERIC-36-X-SUPPRESS-VISIBLE-OVERBOUND-IN-OPEN-VIEW',
  'BMC-REL-NONNUMERIC-36-Y-INFER-CLOSURE-FROM-SAME-FEATURE-OR-ONE-TO-MANY',
  'BMC-REL-NONNUMERIC-36-Z-BUNDLE-CLOSURE-PROJECTION-RUNTIME-OR-PRODUCES'
];

function assert(value, message) { if (!value) throw new Error(message); }
function json(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function local(name) { return join(continuation, name); }
function canonical(value) { return createHash('sha256').update(JSON.stringify(value, Object.keys(value).sort())).digest('hex'); }
function normalized(value) {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key])]));
  return value;
}
function canonicalDigest(value) { return createHash('sha256').update(JSON.stringify(normalized(value))).digest('hex'); }
function sha(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }

function load() {
  const manifest = json(local('DESIGN-SCOPE-MANIFEST.json'));
  const numericPath = manifest.source_contracts.find((item) => item.source_id === 'numeric-selection').path;
  return {
    manifest,
    denominator: json(local('DESIGN-DENOMINATOR-RECEIPT.json')),
    selection: json(local('DESIGN-SELECTION-RESULT.json')),
    request: json(local('decisions/BMC-REL-NONNUMERIC-36-OPTION-ADMISSIBILITY-REQUEST.json')),
    receipt: json(local('decisions/BMC-REL-NONNUMERIC-36-OPTION-PREFILTER-RECEIPT.json')),
    handoff: json(local('evidence/RUNTIME-HANDOFF.json')),
    numeric: json(join(repository, numericPath)),
    context: readFileSync(local('DESIGN-CONTEXT.md'), 'utf8'),
    architecture: readFileSync(local('ARCHITECTURE-BUNDLE.md'), 'utf8'),
    examples: readFileSync(local('DESIGN-DECISION-EXAMPLES.md'), 'utf8'),
    distill: readFileSync(local('DESIGN-DISTILL-VALIDATION.md'), 'utf8')
  };
}

function validate(model) {
  const { manifest, denominator, selection, request, receipt, handoff, numeric, context, architecture, examples, distill } = model;
  const manifestMaterial = Object.fromEntries(Object.entries(manifest).filter(([key]) => key !== 'input_digest'));
  assert(canonicalDigest(manifestMaterial) === manifest.input_digest, 'manifest digest drift');
  assert(manifest.source_contracts.length === 10 && manifest.unknowns.length === 0, 'source denominator drift');
  assert(denominator.verdict === 'pass' && denominator.inspected_selectors.length === 10, 'denominator not closed');
  assert(canonicalDigest(Object.fromEntries(Object.entries(denominator).filter(([key]) => key !== 'receipt_digest'))) === denominator.receipt_digest, 'denominator digest drift');
  assert(selection.verdict === 'pass' && selection.fixed_point === true && selection.pass_1_digest === selection.pass_2_digest, 'selection fixed point drift');
  assert(selection.evidence_state === 'design-validator-pass' && selection.diagnostics.length === 0, 'selection evidence drift');

  assert(numeric.selection.selected_option_id === 'BMC-REL-NUMERIC-EMITS-01-A-OPTIONAL-MANY-OUTGOING-OPTIONAL-SINGLE-SUBJECT', 'numeric selection drift');
  assert(JSON.stringify(numeric.scope_binding.selected_tuple) === JSON.stringify({source_min:0, source_max:'unbounded', target_min:0, target_max:1}), 'numeric tuple drift');
  assert(numeric.authorization_boundary.packet_mutation_authorized === false && numeric.authorization_boundary.runtime_or_event_sourcing_semantics_selected === false, 'numeric authority growth');

  assert(request.decisionId === 'BMC-REL-NONNUMERIC-36-EMITS-TARGET-MAX-PARTIAL-VIEW-VERDICT', 'request id drift');
  assert(request.candidates.length === 8, 'candidate count drift');
  for (const id of [A, B]) {
    const option = request.candidates.find((item) => item.optionId === id);
    assert(option?.structuralStatus === 'admissible' && option.hazardClass === 'authority' && option.ownerGate === 'relationship-decision-owner:owner-decision', `action gate drift: ${id}`);
  }
  for (const id of REJECTED) assert(request.candidates.find((item) => item.optionId === id)?.structuralStatus === 'inadmissible', `rejected option admitted: ${id}`);
  assert(receipt.routeOutcome === 'gate' && receipt.decisionGateRequired === true, 'prefilter route drift');
  assert(receipt.requestDigest === canonicalDigest(request), 'request digest drift');
  assert(JSON.stringify(receipt.presentedOptionIds) === JSON.stringify([A,B,C,D]), 'presented option drift');
  assert(JSON.stringify(receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(REJECTED), 'rejected option receipt drift');

  assert(handoff.selected_option === null && handoff.execution_allowed === false && handoff.authority_effect === 'none', 'premature selection or execution');
  assert(handoff.presented_options.join('|') === [A,B,C,D].join('|'), 'handoff option drift');
  assert(!existsSync(local('decisions/BMC-REL-NONNUMERIC-36-OWNER-SELECTION-RECEIPT.json')), 'owner selection exists before response');
  assert(context.includes('current packet `partial_view` enum cannot represent either action exactly'), 'representation gap missing');
  assert(context.includes('two distinct visible Entity subjects') && context.includes('invalid whether the view is open or closed'), 'observed violation invariant missing');
  for (let index = 1; index <= 6; index += 1) assert(architecture.includes(`## ${index}.`), `architecture view ${index} missing`);
  for (const rung of ['## Low Complexity','## Medium Complexity','## Complex']) assert(examples.includes(rung), `example rung missing: ${rung}`);
  for (const label of ['**A —','**B —','**C —','**D —']) assert((examples.match(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length === 3, `uneven example coverage: ${label}`);
  assert(examples.includes('Unsupported claims: `0`') && examples.includes('Decision effect: `none`'), 'example claim ceiling drift');
  assert(distill.includes('Mode and budget: Standard assumed') && distill.includes('Verdict: `pass`'), 'Distill trace drift');
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
  probe('numeric-tuple-drift', (m) => { m.numeric.scope_binding.selected_tuple.target_max = 'unbounded'; }, model, probes);
  probe('missing-action-owner-gate', (m) => { m.request.candidates.find((item) => item.optionId === A).ownerGate = null; }, model, probes);
  probe('global-pass-admitted', (m) => { m.request.candidates.find((item) => item.optionId === REJECTED[0]).structuralStatus = 'admissible'; }, model, probes);
  probe('visible-violation-suppressed', (m) => { m.request.candidates.find((item) => item.optionId === REJECTED[1]).structuralStatus = 'admissible'; }, model, probes);
  probe('request-digest-drift', (m) => { m.receipt.requestDigest = '0'.repeat(64); }, model, probes);
  probe('premature-owner-selection', (m) => { m.handoff.selected_option = A; }, model, probes);
  probe('missing-representation-gap', (m) => { m.context = m.context.replace('current packet `partial_view` enum cannot represent either action exactly', 'representation omitted'); }, model, probes);
  probe('uneven-example-coverage', (m) => { m.examples = m.examples.replace('**B —', '**omitted —'); }, model, probes);
}

console.log(JSON.stringify({
  schema_version: 'domainspec.n36-emits-target-max-partial-view-validation/v1',
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
