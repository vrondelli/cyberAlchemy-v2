#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function findRepoRoot(start) {
  let current = resolve(start);
  while (dirname(current) !== current) {
    if (existsSync(join(current, '.git'))) return current;
    current = dirname(current);
  }
  throw new Error('repository root not found');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function resolvePointer(value, pointer) {
  invariant(pointer.startsWith('/'), `invalid JSON pointer ${pointer}`);
  return pointer.slice(1).split('/').reduce((current, token) => {
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    invariant(current !== null && current !== undefined && Object.hasOwn(current, key), `missing selector ${pointer}`);
    return current[key];
  }, value);
}

const validatorPath = fileURLToPath(import.meta.url);
const packageRoot = dirname(dirname(validatorPath));
const repoRoot = findRepoRoot(packageRoot);

function loadModel() {
  return {
    scope: readJson(join(packageRoot, 'RESEARCH-SCOPE.json')),
    context: readJson(join(packageRoot, 'CONTEXT-PACK.json')),
    evidence: readJson(join(packageRoot, 'EVIDENCE-INVENTORY.json')),
    candidates: readJson(join(packageRoot, 'NUMERIC-BOUND-CANDIDATES.json')),
    readme: readFileSync(join(packageRoot, 'README.md'), 'utf8'),
    contextMd: readFileSync(join(packageRoot, 'CONTEXT-PACK.md'), 'utf8'),
    ladder: readFileSync(join(packageRoot, 'WITNESS-LADDER.md'), 'utf8'),
    distill: readFileSync(join(packageRoot, 'DISTILL-VALIDATION.md'), 'utf8'),
    result: readFileSync(join(packageRoot, 'RESEARCH-RESULT.md'), 'utf8'),
  };
}

function validateSources(scope) {
  invariant(scope.selected_sources.length === 14, 'selected source count must be 14');
  invariant(scope.inspected_excluded_sources.length === 2, 'excluded source count must be 2');
  for (const source of [...scope.selected_sources, ...scope.inspected_excluded_sources]) {
    const absolute = join(repoRoot, source.path);
    invariant(existsSync(absolute), `source missing: ${source.path}`);
    const bytes = readFileSync(absolute);
    invariant(sha256(bytes) === source.sha256, `source hash drift: ${source.path}`);
    if (!source.selectors) continue;
    const text = bytes.toString('utf8');
    let parsed;
    for (const selector of source.selectors) {
      if (selector.startsWith('/')) {
        parsed ??= JSON.parse(text);
        resolvePointer(parsed, selector);
      } else {
        invariant(text.includes(selector), `source selector missing: ${source.path} ${selector}`);
      }
    }
  }
}

function validateModel(model) {
  const { scope, context, evidence, candidates, readme, contextMd, ladder, distill, result } = model;
  invariant(scope.research_id === '2026-08-25-emits-numeric-bounds-r1', 'research id drift');
  invariant(scope.user_sequencing.exact_input === 'numeric_bounds', 'sequencing input drift');
  invariant(scope.user_sequencing.effect === 'select-research-target-only', 'sequencing effect drift');
  invariant(scope.user_sequencing.semantic_tuple_selected === false, 'tuple selection inflation');
  invariant(scope.user_sequencing.decision_gate_authorized === false, 'gate authorization inflation');
  invariant(scope.counting_basis === 'distinct authored canonical Entity-ID to Event-ID propositions after exact-duplicate rejection', 'counting basis drift');
  invariant(scope.authority_effect === 'none', 'scope authority inflation');
  invariant(scope.helper.result === 'interrupted-after-read-only-verdict' && scope.helper.writes === 0 && scope.helper.joined === true, 'helper closeout drift');

  invariant(context.files_selected === 14, 'context file count drift');
  invariant(context.obligations.length === 7 && context.obligations.every((item) => item.status === 'covered'), 'context obligations incomplete');
  invariant(context.obligation_coverage_percent === 100, 'context coverage drift');
  invariant(context.runtime_handoff === false, 'runtime handoff inflation');
  invariant(context.authority_effect === 'none', 'context authority inflation');

  const coordinates = ['source_min', 'source_max', 'target_min', 'target_max'];
  invariant(JSON.stringify(Object.keys(evidence.coordinate_meanings)) === JSON.stringify(coordinates), 'coordinate meanings drift');
  invariant(evidence.semantic_tuple_candidates_supported === 0, 'evidence candidate inflation');
  invariant(evidence.owner_gate_readiness === 'not-ready', 'evidence owner-gate inflation');
  invariant(evidence.authority_effect === 'none', 'evidence authority inflation');
  invariant(evidence.evidence_backed_eliminations.length === 2, 'elimination count drift');
  invariant(evidence.evidence_backed_eliminations.some((item) => item.coordinate === 'source_max' && item.rejected_value === 0), 'source_max=0 elimination missing');
  invariant(evidence.evidence_backed_eliminations.some((item) => item.coordinate === 'target_max' && item.rejected_value === 0), 'target_max=0 elimination missing');
  invariant(evidence.unresolved_coordinates.length === 4, 'every coordinate must remain unresolved');
  const rejected = evidence.rejected_inferences.map((item) => `${item.inference} ${item.reason}`).join('\n');
  for (const phrase of ['one_to_many', 'single canonical example', 'D02 closure proof', 'creates 0..1/0..1', 'runtime Event occurrences', 'produces or Event-Sourcing', 'generic ontology edges']) {
    invariant(rejected.includes(phrase), `required rejected inference missing: ${phrase}`);
  }

  invariant(JSON.stringify(candidates.coordinate_order) === JSON.stringify(coordinates), 'coordinate order drift');
  invariant(candidates.semantic_tuple_candidates.length === 0, 'semantic tuple candidate inflation');
  invariant(candidates.non_authoritative_research_controls.length === 4, 'research control count drift');
  invariant(candidates.non_authoritative_research_controls.every((item) => item.owner_option === false), 'research control promoted to owner option');
  for (const control of candidates.non_authoritative_research_controls) {
    invariant(JSON.stringify(Object.keys(control.tuple)) === JSON.stringify(coordinates), `${control.id} tuple shape drift`);
  }
  invariant(candidates.control_ceiling.includes('not structural admissibility'), 'control ceiling weakened');
  invariant(candidates.recommendation === null, 'recommendation inflation');
  invariant(candidates.decision_gate === false, 'Decision Gate inflation');
  invariant(candidates.owner_gate_readiness === 'not-ready', 'candidate owner-gate inflation');
  invariant(candidates.authority_effect === 'none', 'candidate authority inflation');

  for (const text of [readme, contextMd, result]) invariant(text.includes('no Decision Gate') || text.includes('Decision Gate: false') || text.includes('Decision Gate'), 'Decision Gate boundary missing');
  for (const heading of ['## Low', '## Medium', '## Complex']) invariant(ladder.includes(heading), `ladder rung missing: ${heading}`);
  for (const id of ['RC-A', 'RC-B', 'RC-C', 'RC-D']) invariant(ladder.includes(id), `ladder control missing: ${id}`);
  invariant(ladder.includes('Decision effect: none') && ladder.includes('Unsupported claims: 0'), 'ladder authority or claim ceiling drift');
  invariant(distill.includes('Mode and budget: Validate') && distill.includes('semantic candidate list empty') && distill.includes('no Decision Gate'), 'Distill boundary drift');
  invariant(result.includes('blocked-no-admissible-tuple-candidates'), 'result token missing');
  invariant(result.includes('Semantic tuple candidates: 0') && result.includes('Recommendation: null') && result.includes('Decision Gate: false'), 'result decision boundary drift');
  invariant(result.includes('Authority effect: none') && result.includes('D06'), 'result authority ceiling drift');
}

function expectFailure(name, mutator, base, probes) {
  const candidate = structuredClone(base);
  mutator(candidate);
  let rejected = false;
  try { validateModel(candidate); } catch { rejected = true; }
  invariant(rejected, `hostile probe was not rejected: ${name}`);
  probes.push({ name, result: 'rejected' });
}

const model = loadModel();
validateSources(model.scope);
validateModel(model);

const probes = [];
if (process.argv.includes('--self-test')) {
  expectFailure('token-derived-tuple', (m) => m.candidates.semantic_tuple_candidates.push({ source: 'one_to_many' }), model, probes);
  expectFailure('canonical-example-as-bound', (m) => { m.evidence.semantic_tuple_candidates_supported = 1; }, model, probes);
  expectFailure('open-view-positive-min-inference', (m) => { m.evidence.owner_gate_readiness = 'ready'; }, model, probes);
  expectFailure('runtime-occurrence-collapse', (m) => { m.scope.counting_basis = 'runtime Event occurrences'; }, model, probes);
  expectFailure('produces-emits-transfer', (m) => { m.evidence.rejected_inferences = m.evidence.rejected_inferences.filter((x) => !x.inference.includes('produces')); }, model, probes);
  expectFailure('creates-precedent-transfer', (m) => { m.evidence.rejected_inferences = m.evidence.rejected_inferences.filter((x) => !x.inference.includes('creates')); }, model, probes);
  expectFailure('generic-ontology-emits-confusion', (m) => { m.evidence.rejected_inferences = m.evidence.rejected_inferences.filter((x) => !x.inference.includes('generic ontology')); }, model, probes);
  expectFailure('fabricated-recommendation', (m) => { m.candidates.recommendation = 'RC-A-PERMISSIVE'; }, model, probes);
  expectFailure('fabricated-decision-gate', (m) => { m.candidates.decision_gate = true; }, model, probes);
  expectFailure('packet-or-authority-mutation-claim', (m) => { m.candidates.authority_effect = 'canonical-update'; }, model, probes);
}

const localFiles = ['README.md', 'RESEARCH-SCOPE.json', 'CONTEXT-PACK.md', 'CONTEXT-PACK.json', 'EVIDENCE-INVENTORY.json', 'NUMERIC-BOUND-CANDIDATES.json', 'WITNESS-LADDER.md', 'DISTILL-VALIDATION.md', 'RESEARCH-RESULT.md', 'validators/validate-emits-numeric-bounds-research.mjs'];
console.log(JSON.stringify({
  schema_version: 'domainspec.emits-numeric-bounds-research-validation/v1',
  research_id: model.scope.research_id,
  result: 'pass-for-bounded-negative-numeric-research',
  semantic_tuple_candidates: 0,
  non_authoritative_research_controls: 4,
  evidence_backed_eliminations: ['source_max=0', 'target_max=0'],
  owner_gate_readiness: 'not-ready',
  recommendation: null,
  decision_gate: false,
  selected_sources: model.scope.selected_sources.length,
  excluded_sources: model.scope.inspected_excluded_sources.length,
  context_obligations: model.context.obligations.length,
  ladder: { rungs: 3, controls_per_rung: 4, unsupported_claims: 0, decision_effect: 'none' },
  hostile_probes: probes,
  files: localFiles.map((path) => ({ path, sha256: sha256(readFileSync(join(packageRoot, path))) })),
  authority_effect: 'none',
  next_route: 'targeted-authority-and-closure-bound-fixture-acquisition; no Decision Gate'
}, null, 2));
