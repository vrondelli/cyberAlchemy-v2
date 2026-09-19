#!/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FINDINGS_DIR = path.dirname(SCRIPT_DIR);
const FACETS = ['numeric_bounds', 'closure', 'multi_endpoint_semantics', 'partial_view', 'representation', 'runtime_cardinality', 'compatibility_token'];
const SOURCE_SUBJECTS = ['multi_endpoint_semantics', 'compatibility_token', 'inverse_semantics', 'self_relations'];
const DESIGN_DECISIONS = ['N33', 'N34', 'N35'];
const RESEARCH_TARGETS = ['numeric_bounds', 'packet_closure_mapping', 'partial_view_semantics', 'additional_representation', 'runtime_cardinality'];
const FORBIDDEN_INFERENCES = [
  'Event Sourcing narrowing',
  'payload, delivery, retry, replay, timestamp, or storage semantics',
  'runtime occurrence, order, cardinality, or guarantee',
  'produces/emits cross-verb equality, implication, pairing, or shared provenance',
  'numeric or other facet authority derived from one_to_many'
];
const SOURCE_HASHES = {
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/dispatches/2026-08-25-emits-remaining-facets-research/repairs/2026-08-25-evidence-closure-r1/REPAIR-RESULT.md': 'dd106f55c6239d0dab784f94a11743882529e65e2628cc87d1c848bf49a41a84',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/dispatches/2026-08-25-emits-remaining-facets-research/repairs/2026-08-25-evidence-closure-r1/REPAIR-SCOPE.json': 'b6080d87729fda2f4a0da105c75ab93ef6271ca870ce9742cdb6c3f473f12425',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/dispatches/2026-08-25-emits-remaining-facets-research/repairs/2026-08-25-evidence-closure-r1/REPAIRED-FACET-MATRIX.json': '2a36c7131ac09bd5cf516c20bdc4f6feb30fedc46b386ae0a4decc32b83b35ad',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/dispatches/2026-08-25-emits-remaining-facets-research/repairs/2026-08-25-evidence-closure-r1/EXACT-SELECTOR-MANIFEST.json': '08c32f7db61757297d224f174fc6dbb410f83df40c54aeeec06fa51ebfefc279',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/dispatches/2026-08-25-emits-remaining-facets-research/repairs/2026-08-25-evidence-closure-r1/FACET-BOUNDARY-EXCLUSIONS.json': '8bfed9f4e0e93669dc33539943c7401cb5af50c64cfbc1836c6fcae26b3e9ba6',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/dispatches/2026-08-25-emits-remaining-facets-research/repairs/2026-08-25-evidence-closure-r1/WITNESS-LADDER.md': '9d6c0b29386cfedde9c5ca369aa3fe5bed2840c3f46530728e940b77ad4e418b',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/dispatches/2026-08-25-emits-remaining-facets-research/repairs/2026-08-25-evidence-closure-r1/REPAIR-VALIDATION.json': 'e2103451169252a7185a3f8bc856d2da27e891d8b5904e62088d64fd301d94c7',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/dispatches/2026-08-25-emits-remaining-facets-research/receipts/evidence-closure.json': 'c4c4b6006ee0674cf7c5edd536d9418a2aef042f0a35a0764b3d41c1621d5bf0'
};

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function same(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} drift`);
}

function exactKeys(value, expected, label) {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  same(Object.keys(value).sort(), [...expected].sort(), `${label} keys`);
}

function findRepositoryRoot(start) {
  let current = start;
  while (true) {
    if (fs.existsSync(path.join(current, 'AGENTS.md')) && fs.existsSync(path.join(current, 'projects', 'domainspec-v2'))) return current;
    const parent = path.dirname(current);
    if (parent === current) fail('repository root not found');
    current = parent;
  }
}

const ROOT = findRepositoryRoot(FINDINGS_DIR);

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function validateScope(scope) {
  exactKeys(scope, ['schema_version', 'findings_id', 'parent_repair_id', 'invoke_mode', 'template_family', 'objective', 'write_scope', 'sources', 'predecessor_state', 'result_ceiling', 'semantic_options_allowed', 'owner_gate_readiness', 'recommendation_allowed', 'decision_gate_allowed', 'authority_effect', 'forbidden_effects', 'dispatch_technique_trace', 'full_dispatch_required', 'full_dispatch_skipped_reason', 'distill'], 'scope');
  assert(scope.schema_version === 'domainspec.emits-negative-findings-scope/v1', 'scope schema drift');
  assert(scope.result_ceiling === 'bounded-negative-findings-only', 'scope result ceiling drift');
  assert(scope.semantic_options_allowed === 0, 'scope may not allow semantic options');
  assert(scope.owner_gate_readiness === 'not-ready', 'scope may not claim owner-gate readiness');
  assert(scope.recommendation_allowed === false && scope.decision_gate_allowed === false, 'scope may not allow recommendation or Decision Gate');
  assert(scope.authority_effect === 'none', 'scope may not grow authority');
  assert(scope.predecessor_state.status === 'blocked', 'predecessor must remain blocked');
  assert(scope.predecessor_state.writer_admission === false && scope.predecessor_state.auditor_admission === false && scope.predecessor_state.retroactive_writer_admission === false, 'predecessor admission drift');
  assert(Array.isArray(scope.sources) && scope.sources.length === 8, 'scope must bind exactly eight sources');
  same(scope.sources.map((source) => source.path), Object.keys(SOURCE_HASHES), 'scope source paths');
  for (const source of scope.sources) {
    assert(source.sha256 === SOURCE_HASHES[source.path], `scope expected hash drift: ${source.path}`);
    const bytes = fs.readFileSync(path.join(ROOT, source.path));
    assert(sha256(bytes) === source.sha256, `live source hash drift: ${source.path}`);
  }
  assert(scope.full_dispatch_required === false, 'findings continuation must not claim a full dispatch');
  assert(scope.distill.status === 'skipped' && typeof scope.distill.reason === 'string', 'narrow-unit Distill skip must be explicit');
}

function validateFindings(findings) {
  exactKeys(findings, ['schema_version', 'findings_id', 'parent_repair_id', 'result', 'predecessor', 'source_determined_unprojected', 'design_only_unprojected', 'facets', 'targeted_research_gaps', 'forbidden_inferences', 'ladder_reference', 'semantic_options_authored', 'owner_gate_readiness', 'recommendation', 'decision_gate', 'owner_sequencing_clarification', 'authority_effect', 'next_route'], 'findings');
  assert(findings.schema_version === 'domainspec.emits-bounded-negative-findings/v1', 'findings schema drift');
  assert(findings.result === 'bounded-negative-findings-authored', 'findings result drift');
  exactKeys(findings.predecessor, ['status', 'writer_admission', 'retroactive_writer_admission'], 'predecessor');
  assert(findings.predecessor.status === 'blocked' && findings.predecessor.writer_admission === false && findings.predecessor.retroactive_writer_admission === false, 'predecessor or retroactive admission drift');

  assert(findings.source_determined_unprojected.length === 4, 'source-determined count must be four');
  same(findings.source_determined_unprojected.map((item) => item.subject), SOURCE_SUBJECTS, 'source-determined subjects');
  for (const item of findings.source_determined_unprojected) {
    exactKeys(item, ['subject', 'finding', 'packet_projected'], `source finding ${item.subject}`);
    assert(item.packet_projected === false, `${item.subject} may not be packet-projected`);
  }

  assert(findings.design_only_unprojected.length === 3, 'Design-only count must be three');
  same(findings.design_only_unprojected.map((item) => item.decision), DESIGN_DECISIONS, 'Design-only decisions');
  for (const item of findings.design_only_unprojected) {
    exactKeys(item, ['decision', 'subject', 'finding', 'packet_projected'], `Design-only finding ${item.decision}`);
    assert(item.packet_projected === false, `${item.decision} may not be packet-projected`);
  }

  assert(findings.facets.length === 7, 'findings must carry exactly seven facets');
  same(findings.facets.map((item) => item.facet), FACETS, 'facet identities');
  for (const item of findings.facets) {
    exactKeys(item, ['facet', 'classification', 'finding', 'semantic_options', 'owner_gate_ready', 'packet_projected'], `facet ${item.facet}`);
    assert(Array.isArray(item.semantic_options) && item.semantic_options.length === 0, `${item.facet} may not author semantic options`);
    assert(item.owner_gate_ready === false, `${item.facet} may not become owner-gate ready`);
    assert(item.packet_projected === false, `${item.facet} may not be packet-projected`);
  }

  assert(findings.targeted_research_gaps.length === 5, 'findings must carry exactly five targeted-research gaps');
  same(findings.targeted_research_gaps.map((item) => item.target_id), RESEARCH_TARGETS, 'research targets');
  for (const item of findings.targeted_research_gaps) {
    exactKeys(item, ['target_id', 'question', 'selected', 'precedence_evidence'], `research target ${item.target_id}`);
    assert(item.selected === false && item.precedence_evidence === null, `${item.target_id} may not be selected or claim precedence`);
  }

  same(findings.forbidden_inferences, FORBIDDEN_INFERENCES, 'forbidden inferences');
  exactKeys(findings.ladder_reference, ['path', 'sha256', 'decision_effect', 'new_examples_added'], 'ladder reference');
  assert(findings.ladder_reference.path === '../WITNESS-LADDER.md', 'ladder path drift');
  assert(findings.ladder_reference.sha256 === SOURCE_HASHES[Object.keys(SOURCE_HASHES)[5]], 'ladder hash drift');
  assert(findings.ladder_reference.decision_effect === 'none' && findings.ladder_reference.new_examples_added === 0, 'ladder authority or example growth');
  assert(findings.semantic_options_authored === 0, 'semantic option count must be zero');
  assert(findings.owner_gate_readiness === 'not-ready', 'owner-gate readiness must remain not-ready');
  assert(findings.recommendation === null, 'recommendation must remain null');
  assert(findings.decision_gate === false, 'Decision Gate must remain false');
  exactKeys(findings.owner_sequencing_clarification, ['question', 'target_ids', 'selection', 'recommendation', 'decision_gate'], 'owner sequencing clarification');
  same(findings.owner_sequencing_clarification.target_ids, RESEARCH_TARGETS, 'owner sequencing targets');
  assert(findings.owner_sequencing_clarification.selection === null && findings.owner_sequencing_clarification.recommendation === null && findings.owner_sequencing_clarification.decision_gate === false, 'owner sequencing must not select, recommend, or become a Decision Gate');
  assert(findings.authority_effect === 'none', 'findings may not grow authority');
  assert(findings.next_route === 'owner-sequencing-clarification-among-five-targeted-research-gaps; no target selected and no Decision Gate', 'next route drift');
}

function equivalenceProjection(findings) {
  return {
    source_determined_unprojected: findings.source_determined_unprojected.map((item) => item.subject),
    design_only_unprojected: findings.design_only_unprojected.map((item) => item.decision),
    facets: findings.facets.map((item) => item.facet),
    targeted_research_gaps: findings.targeted_research_gaps.map((item) => item.target_id),
    semantic_options_authored: findings.semantic_options_authored,
    owner_gate_readiness: findings.owner_gate_readiness,
    recommendation: findings.recommendation,
    decision_gate: findings.decision_gate,
    authority_effect: findings.authority_effect,
    next_route: findings.next_route
  };
}

function validateMarkdown(markdown, findings) {
  const match = markdown.match(/<!-- findings-equivalence:start -->\n```json\n([\s\S]*?)\n```\n<!-- findings-equivalence:end -->/);
  assert(match, 'Markdown machine-equivalence block missing');
  same(JSON.parse(match[1]), equivalenceProjection(findings), 'Markdown/JSON equivalence');
  const headings = ['## Outcome Brief', '## Boundary and Next Clarification', '## Source-Determined but Unprojected', '## Design-Only and Unprojected', '## Seven-Facet Finding', '## Five Targeted-Research Gaps', '## Practical Explanation by Existing Ladder', '## Forbidden Inferences', '## Predecessor and Authority Ceiling', '## Machine Equivalence'];
  for (const heading of headings) assert(markdown.includes(heading), `Markdown missing ${heading}`);
  assert(markdown.includes('[witness ladder](../WITNESS-LADDER.md)'), 'Markdown must reference the existing witness ladder');
  assert(markdown.includes('This findings package adds no scenario and changes no example.'), 'Markdown may not invent examples');
  assert(markdown.includes('decision effect: none'), 'Markdown must preserve ladder decision effect none');
  assert(markdown.includes('not retroactive writer admission'), 'Markdown must deny retroactive writer admission');
  assert(markdown.includes('Recommendation: null. Decision Gate: no.'), 'Markdown must state null recommendation and no Decision Gate');
  assert(!/[ \t]+$/m.test(markdown), 'Markdown has trailing whitespace');
}

function validateAll(documents) {
  validateScope(documents.scope);
  validateFindings(documents.findings);
  validateMarkdown(documents.markdown, documents.findings);
}

function loadDocuments() {
  return {
    scope: readJson(path.join(FINDINGS_DIR, 'FINDINGS-SCOPE.json')),
    findings: readJson(path.join(FINDINGS_DIR, 'FINDINGS.json')),
    markdown: fs.readFileSync(path.join(FINDINGS_DIR, 'FINDINGS.md'), 'utf8')
  };
}

function runProbe(name, mutate) {
  const documents = loadDocuments();
  mutate(documents);
  try {
    validateAll(documents);
    fail(`negative probe ${name} unexpectedly passed`);
  } catch (error) {
    if (error.message === `negative probe ${name} unexpectedly passed`) throw error;
    return {name, result: 'rejected'};
  }
}

function runSelfTest() {
  return [
    runProbe('semantic-option-inflation', (documents) => { documents.findings.facets[0].semantic_options.push('invented'); }),
    runProbe('recommendation-inflation', (documents) => { documents.findings.recommendation = 'numeric_bounds'; }),
    runProbe('decision-gate-inflation', (documents) => { documents.findings.decision_gate = true; }),
    runProbe('packet-projection-inflation', (documents) => { documents.findings.facets[2].packet_projected = true; }),
    runProbe('runtime-inference-inflation', (documents) => { documents.findings.forbidden_inferences = documents.findings.forbidden_inferences.filter((item) => !item.startsWith('runtime occurrence')); }),
    runProbe('event-sourcing-inflation', (documents) => { documents.findings.forbidden_inferences = documents.findings.forbidden_inferences.filter((item) => !item.startsWith('Event Sourcing')); })
  ];
}

function listFiles(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...listFiles(absolute));
    else if (entry.isFile()) result.push(absolute);
    else fail(`non-regular findings entry: ${absolute}`);
  }
  return result;
}

function validateLocalFiles() {
  const required = ['FINDINGS.md', 'FINDINGS.json', 'FINDINGS-SCOPE.json', 'validators/validate-emits-negative-findings.mjs'];
  for (const relative of required) assert(fs.statSync(path.join(FINDINGS_DIR, relative)).isFile(), `required findings file missing: ${relative}`);
  const files = listFiles(FINDINGS_DIR);
  for (const absolute of files) {
    const text = fs.readFileSync(absolute, 'utf8');
    assert(!/[ \t]+$/m.test(text), `trailing whitespace: ${path.relative(FINDINGS_DIR, absolute)}`);
    if (absolute.endsWith('.json')) JSON.parse(text);
  }
  return files;
}

try {
  const unexpected = process.argv.slice(2).filter((arg) => arg !== '--self-test');
  assert(unexpected.length === 0, `unknown arguments: ${unexpected.join(', ')}`);
  const files = validateLocalFiles();
  const documents = loadDocuments();
  validateAll(documents);
  const hostile = process.argv.includes('--self-test') ? runSelfTest() : [];
  process.stdout.write(`${JSON.stringify({
    schema_version: 'domainspec.emits-negative-findings-validation/v1',
    findings_id: documents.findings.findings_id,
    result: 'pass',
    facets: documents.findings.facets.length,
    targeted_research_gaps: documents.findings.targeted_research_gaps.length,
    semantic_options_authored: documents.findings.semantic_options_authored,
    owner_gate_readiness: documents.findings.owner_gate_readiness,
    recommendation: documents.findings.recommendation,
    decision_gate: documents.findings.decision_gate,
    source_bindings: documents.scope.sources.length,
    markdown_json_equivalence: 'pass',
    hostile_probes: hostile,
    files: files.map((absolute) => ({path: path.relative(ROOT, absolute), sha256: sha256(fs.readFileSync(absolute))})).sort((left, right) => left.path.localeCompare(right.path)),
    authority_effect: 'none',
    next_route: documents.findings.next_route
  }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`emits negative-findings validation failed: ${error.stack ?? error.message}\n`);
  process.exitCode = 1;
}
