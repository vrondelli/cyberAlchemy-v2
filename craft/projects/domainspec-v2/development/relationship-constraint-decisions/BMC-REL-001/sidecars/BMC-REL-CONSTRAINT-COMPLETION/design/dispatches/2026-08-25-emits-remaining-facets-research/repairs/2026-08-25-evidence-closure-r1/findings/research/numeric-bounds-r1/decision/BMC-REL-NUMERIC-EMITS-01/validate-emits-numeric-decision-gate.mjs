#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const researchRoot = dirname(dirname(root));

function assert(value, message) { if (!value) throw new Error(message); }
function readJson(name) { return JSON.parse(readFileSync(join(root, name), 'utf8')); }
function digest(value) { return createHash('sha256').update(JSON.stringify(value, Object.keys(value).sort())).digest('hex'); }
function canonicalDigest(value) {
  const normalize = (item) => Array.isArray(item) ? item.map(normalize) : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, normalize(item[key])])) : item;
  return createHash('sha256').update(JSON.stringify(normalize(value))).digest('hex');
}
function sha(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }

function load() {
  return {
    intent: readJson('OWNER-INTENT-EVIDENCE.json'),
    request: readJson('OPTION-ADMISSIBILITY-REQUEST.json'),
    receipt: readJson('OPTION-PREFILTER-RECEIPT.json'),
    gate: readFileSync(join(root, 'DECISION-GATE.md'), 'utf8'),
    examples: readFileSync(join(root, 'DECISION-EXAMPLES.md'), 'utf8'),
  };
}

const A = 'BMC-REL-NUMERIC-EMITS-01-A-OPTIONAL-MANY-OUTGOING-OPTIONAL-SINGLE-SUBJECT';
const B = 'BMC-REL-NUMERIC-EMITS-01-B-DEFER';
const C = 'BMC-REL-NUMERIC-EMITS-01-C-STOP';
const REJECTED = [
  'BMC-REL-NUMERIC-EMITS-01-W-LIMIT-EACH-ENTITY-TO-ONE-EVENT-CONCEPT',
  'BMC-REL-NUMERIC-EMITS-01-X-DERIVE-BOUNDS-FROM-ONE-TO-MANY',
  'BMC-REL-NUMERIC-EMITS-01-Y-ALLOW-MULTIPLE-ENTITY-SUBJECTS',
  'BMC-REL-NUMERIC-EMITS-01-Z-REQUIRE-ENTITY-SUBJECT-FOR-EVERY-EVENT',
];

function validate(model) {
  const { intent, request, receipt, gate, examples } = model;
  assert(intent.decision_id === 'BMC-REL-NUMERIC-EMITS-01', 'intent decision drift');
  assert(JSON.stringify(intent.assembled_tuple) === JSON.stringify({source_min:0, source_max:'unbounded', target_min:0, target_max:1}), 'assembled tuple drift');
  assert(intent.clarifications.length === 4, 'clarification count drift');
  assert(intent.pre_gate_response.exact_input === 'A' && intent.pre_gate_response.counts_as_post_prefilter_selection === false, 'pre-gate response inflation');
  assert(intent.authority_effect === 'none', 'intent authority inflation');

  assert(request.decisionId === intent.decision_id, 'request decision drift');
  assert(request.candidates.length === 7, 'request candidate count drift');
  const action = request.candidates.find((item) => item.optionId === A);
  assert(action?.structuralStatus === 'admissible' && action.hazardClass === 'authority' && action.ownerGate === 'relationship-decision-owner:owner-decision', 'A gate shape drift');
  const actionEvidence = action.evidence.join(' ');
  for (const phrase of ['source_min 0', 'source_max unbounded', 'target_min 0', 'target_max 1']) assert(actionEvidence.includes(phrase), `A evidence missing ${phrase}`);

  assert(receipt.routeOutcome === 'gate' && receipt.decisionGateRequired === true, 'prefilter route drift');
  assert(receipt.requestDigest === canonicalDigest(request), 'request digest drift');
  assert(JSON.stringify(receipt.presentedOptionIds) === JSON.stringify([A,B,C]), 'presented options drift');
  assert(JSON.stringify(receipt.admissibleOptionIds) === JSON.stringify([A,B,C]), 'admissible options drift');
  assert(JSON.stringify(receipt.rejectedOptions.map((item) => item.optionId)) === JSON.stringify(REJECTED), 'rejected options drift');

  assert(gate.includes('Selection: null.'), 'gate prematurely selected');
  assert(gate.includes('earlier exact `A` response') && gate.includes('is not a selection here'), 'pre-gate boundary missing');
  assert(gate.includes('Recommendation: A') && gate.includes('Explain / more context'), 'gate presentation incomplete');
  assert(gate.includes('Authority effect: none'), 'gate authority ceiling missing');
  for (const heading of ['## Low','## Medium','## Complex']) assert(examples.includes(heading), `example rung missing ${heading}`);
  for (const option of ['- A:','- B:','- C:']) assert((examples.match(new RegExp(option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length === 3, `uneven example coverage ${option}`);
  assert(examples.includes('unsupported claims 0') && examples.includes('decision effect none'), 'example ceiling drift');

  assert(sha(join(researchRoot, 'RESEARCH-VALIDATION.json')) === '1c8d393075afb2ce9099da2522e04ee66cbe867897f2285a62ff99a2d22cbb7d', 'research receipt drift');
}

function probe(name, mutate, base, results) {
  const copy = structuredClone(base);
  mutate(copy);
  let rejected = false;
  try { validate(copy); } catch { rejected = true; }
  assert(rejected, `hostile survived ${name}`);
  results.push({name, result:'rejected'});
}

const model = load();
validate(model);
const probes = [];
if (process.argv.includes('--self-test')) {
  probe('pre-gate-a-as-selection', (m) => { m.intent.pre_gate_response.counts_as_post_prefilter_selection = true; }, model, probes);
  probe('tuple-drift', (m) => { m.intent.assembled_tuple.target_max = 'unbounded'; }, model, probes);
  probe('missing-owner-gate', (m) => { m.request.candidates.find((x) => x.optionId === A).ownerGate = null; }, model, probes);
  probe('token-derived-option-admitted', (m) => { m.request.candidates.find((x) => x.optionId.includes('-X-')).structuralStatus = 'admissible'; }, model, probes);
  probe('receipt-digest-drift', (m) => { m.receipt.requestDigest = '0'.repeat(64); }, model, probes);
  probe('premature-selection', (m) => { m.gate = m.gate.replace('Selection: null.', 'Selection: A.'); }, model, probes);
  probe('missing-explain', (m) => { m.gate = m.gate.replace('Explain / more context', 'context removed'); }, model, probes);
  probe('authority-growth', (m) => { m.intent.authority_effect = 'canonical-update'; }, model, probes);
}

console.log(JSON.stringify({
  schema_version: 'domainspec.emits-numeric-decision-gate-validation/v1',
  decision_id: model.intent.decision_id,
  result: 'pass',
  route_outcome: model.receipt.routeOutcome,
  presented_option_ids: model.receipt.presentedOptionIds,
  selection: null,
  pre_gate_a_counts_as_selection: false,
  recommendation: 'A',
  hostile_probes: probes,
  research_receipt_sha256: sha(join(researchRoot, 'RESEARCH-VALIDATION.json')),
  request_sha256: sha(join(root, 'OPTION-ADMISSIBILITY-REQUEST.json')),
  receipt_sha256: sha(join(root, 'OPTION-PREFILTER-RECEIPT.json')),
  authority_effect: 'none'
}, null, 2));
