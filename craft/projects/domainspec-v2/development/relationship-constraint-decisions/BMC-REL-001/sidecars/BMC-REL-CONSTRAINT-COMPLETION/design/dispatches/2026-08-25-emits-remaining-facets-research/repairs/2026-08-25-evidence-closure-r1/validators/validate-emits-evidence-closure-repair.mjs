#!/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPAIR_DIR = path.dirname(SCRIPT_DIR);
const FACETS = [
  'numeric_bounds',
  'closure',
  'multi_endpoint_semantics',
  'partial_view',
  'representation',
  'runtime_cardinality',
  'compatibility_token'
];
const BOUNDARIES = [
  'n33-duplicates',
  'n34-occurrence-semantics',
  'n35-ordering',
  'inverse-semantics',
  'self-relations',
  'event-sourcing',
  'payload-delivery-retry-replay-storage',
  'produces-cross-verb',
  'hyperedges-and-roles'
];
const DEF_BY_FACET = {
  numeric_bounds: 'numericBoundsDecision',
  closure: 'closureDecision',
  multi_endpoint_semantics: 'multiEndpointDecision',
  partial_view: 'partialViewDecision',
  representation: 'representationDecision',
  runtime_cardinality: 'runtimeCardinalityDecision',
  compatibility_token: 'compatibilityTokenDecision'
};
const EXPECTED_VALUE_VOCAB = {
  closure: ['same-feature', 'cross-feature', 'declared-feature-scopes'],
  multi_endpoint_semantics: ['pooled', 'per-type', 'not-applicable'],
  partial_view: ['skip', 'unsupported', 'owner-blocked'],
  representation: ['authored-edge', 'generated-projection', 'canonical-edge-plus-generated-projection', 'attribute-only'],
  runtime_cardinality: ['separate-from-concept-cardinality', 'same-as-concept-cardinality', 'not-applicable'],
  compatibility_token: ['retain', 'replace', 'deprecate']
};
const CANONICAL_HASHES = {
  relationships: '82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1',
  packet: 'a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0',
  schema: 'd68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7',
  validator: '69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975'
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

function findRepositoryRoot(start) {
  let current = start;
  while (true) {
    const marker = path.join(current, 'projects', 'domainspec-v2', 'definitions', 'relationships', 'relationships.yml');
    if (fs.existsSync(marker)) return current;
    const parent = path.dirname(current);
    if (parent === current) fail('repository root not found');
    current = parent;
  }
}

const ROOT = findRepositoryRoot(REPAIR_DIR);
const PATHS = {
  relationships: 'projects/domainspec-v2/definitions/relationships/relationships.yml',
  packet: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json',
  schema: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json',
  validator: 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs'
};

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function repairJson(name) {
  return readJson(path.join(REPAIR_DIR, name));
}

function decodePointerToken(token) {
  return token.replaceAll('~1', '/').replaceAll('~0', '~');
}

function resolveJsonPointer(document, pointer) {
  assert(pointer.startsWith('/'), `JSON pointer must start with /: ${pointer}`);
  let current = document;
  for (const rawToken of pointer.slice(1).split('/')) {
    const token = decodePointerToken(rawToken);
    assert(current !== null && typeof current === 'object' && Object.hasOwn(current, token), `JSON pointer does not resolve: ${pointer}`);
    current = current[token];
  }
  return current;
}

function validateSelector(sourceBytes, sourcePath, selector) {
  const text = sourceBytes.toString('utf8');
  if (selector.kind === 'json-pointer') {
    resolveJsonPointer(JSON.parse(text), selector.value);
    return;
  }
  if (selector.kind === 'markdown-heading') {
    assert(text.split(/\r?\n/).includes(selector.value), `${sourcePath} missing heading ${selector.value}`);
    return;
  }
  if (selector.kind === 'js-symbol') {
    assert(text.includes(selector.value), `${sourcePath} missing symbol ${selector.value}`);
    return;
  }
  fail(`unsupported selector kind ${selector.kind}`);
}

function validateManifest(manifest) {
  assert(manifest.schema_version === 'domainspec.emits-evidence-selector-manifest/v1', 'selector manifest schema drift');
  assert(manifest.repair_id === '2026-08-25-evidence-closure-r1', 'selector manifest repair id drift');
  assert(Array.isArray(manifest.sources) && manifest.sources.length === 16, 'selector manifest must contain exactly 16 sources');
  assert(new Set(manifest.sources.map((source) => source.path)).size === 16, 'selector manifest source paths must be unique');
  for (const source of manifest.sources) {
    assert(!path.isAbsolute(source.path) && !source.path.split(path.sep).includes('..'), `unsafe source path ${source.path}`);
    const absolute = path.resolve(ROOT, source.path);
    assert(absolute.startsWith(`${ROOT}${path.sep}`), `source escapes repository ${source.path}`);
    const bytes = fs.readFileSync(absolute);
    assert(sha256(bytes) === source.sha256, `source hash drift: ${source.path}`);
    assert(Array.isArray(source.selectors) && source.selectors.length > 0, `source selectors missing: ${source.path}`);
    for (const selector of source.selectors) validateSelector(bytes, source.path, selector);
  }
  assert(manifest.all_selectors_required === true, 'all selectors must be required');
  assert(manifest.authority_effect === 'none', 'selector manifest may not grow authority');
}

function validateScope(scope) {
  assert(scope.schema_version === 'domainspec.emits-evidence-closure-repair-scope/v1', 'repair scope schema drift');
  assert(scope.allowed_result === 'pass-for-bounded-negative-findings', 'repair allowed result drift');
  assert(scope.blocked_result === 'not-ready-for-owner-gate', 'repair blocked result drift');
  assert(scope.authority_effect === 'none', 'repair scope may not grow authority');
  same(scope.selector_unknowns, [], 'selector unknowns');
  assert(Array.isArray(scope.semantic_unknowns) && scope.semantic_unknowns.length === 5, 'five semantic unknowns must remain visible');
  const requiredForbidden = [
    'semantic-selection',
    'decision-gate-admission',
    'packet-projection-or-acceptance',
    'canonical-definition-or-relationship-mutation',
    'schema-or-validator-mutation',
    'implementation',
    'inventory-or-ledger-mutation',
    'git-commit-or-push',
    'promotion-publication-release-deployment-or-production-effect'
  ];
  same(scope.forbidden_effects, requiredForbidden, 'forbidden effects');
  assert(scope.immutable_predecessor.status === 'blocked', 'immutable predecessor must remain blocked');
  assert(scope.immutable_predecessor.sha256 === 'c4c4b6006ee0674cf7c5edd536d9418a2aef042f0a35a0764b3d41c1621d5bf0', 'immutable predecessor hash drift');
  assert(scope.full_dispatch_required === false, 'bounded repair must not claim a full dispatch');
}

function schemaVocabulary(schema, facet) {
  const definition = schema.$defs[DEF_BY_FACET[facet]];
  assert(definition, `schema definition missing for ${facet}`);
  return {
    status: definition.properties.status.enum,
    values: facet === 'numeric_bounds' ? null : definition.properties.value.enum.filter((value) => value !== null)
  };
}

function validateMatrix(matrix, schema) {
  assert(matrix.schema_version === 'domainspec.emits-seven-facet-repair-matrix/v1', 'matrix schema drift');
  assert(matrix.signature_id === 'emits' && matrix.packet_row_pointer === '/rows/14', 'matrix emits binding drift');
  assert(matrix.result === 'pass-for-bounded-negative-findings', 'matrix result drift');
  assert(matrix.owner_gate_readiness === 'not-ready', 'matrix may not claim owner-gate readiness');
  assert(matrix.authority_effect === 'none', 'matrix may not grow authority');
  assert(Array.isArray(matrix.facets) && matrix.facets.length === 7, 'matrix must have exactly seven facets');
  same(matrix.facets.map((row) => row.facet), FACETS, 'facet order or membership');
  assert(new Set(matrix.facets.map((row) => row.facet)).size === 7, 'facet rows must be unique');

  for (const row of matrix.facets) {
    assert(row.current_packet_status === 'unresolved', `${row.facet} packet status must remain unresolved`);
    assert(Array.isArray(row.options) && row.options.length === 0, `${row.facet} may not invent semantic options`);
    assert(row.owner_gate_ready === false, `${row.facet} may not become owner-gate ready`);
    assert(Array.isArray(row.source_determined_facts) && row.source_determined_facts.length > 0, `${row.facet} source facts missing`);
    assert(Array.isArray(row.missing_for_gate) && row.missing_for_gate.length > 0, `${row.facet} missing-for-gate evidence missing`);
    assert(typeof row.live_enforcement_gap === 'string' && row.live_enforcement_gap.length > 0, `${row.facet} live enforcement gap missing`);
    assert(typeof row.negative_finding === 'string' && row.negative_finding.length > 0, `${row.facet} negative finding missing`);
    const exact = schemaVocabulary(schema, row.facet);
    same(row.schema_contract.status_vocabulary, exact.status, `${row.facet} status vocabulary`);
    if (row.facet === 'numeric_bounds') {
      same(row.schema_contract.value_shape, ['source_min', 'source_max', 'target_min', 'target_max'], 'numeric bounds value shape');
    } else {
      same(row.schema_contract.value_vocabulary, exact.values, `${row.facet} value vocabulary`);
      same(row.schema_contract.value_vocabulary, EXPECTED_VALUE_VOCAB[row.facet], `${row.facet} pinned vocabulary`);
    }
  }

  assert(matrix.already_selected_design_only.packet_projection_authorized === false, 'N33-N35 packet projection must remain unauthorized');
  assert(matrix.new_semantic_options_authored === 0, 'new semantic options authored must be zero');
  assert(matrix.recommendation === null, 'repair may not recommend a semantic option');
  assert(matrix.next_route.includes('no owner Decision Gate'), 'matrix next route must block owner Decision Gate');
}

function validateExclusions(exclusions) {
  assert(exclusions.schema_version === 'domainspec.emits-facet-boundary-exclusions/v1', 'exclusions schema drift');
  same(exclusions.facets, FACETS, 'exclusion facet set');
  assert(Array.isArray(exclusions.boundaries) && exclusions.boundaries.length === BOUNDARIES.length, 'boundary count drift');
  same(exclusions.boundaries.map((item) => item.boundary_id), BOUNDARIES, 'boundary identities');
  for (const item of exclusions.boundaries) {
    same(item.excluded_from, FACETS, `${item.boundary_id} excluded facets`);
    assert(typeof item.rule === 'string' && item.rule.length > 0, `${item.boundary_id} rule missing`);
    assert(['selected-design-only-not-packet-projected', 'source-determined-none', 'source-determined-not-applicable-by-endpoint-types', 'forbidden-inference'].includes(item.status), `${item.boundary_id} status invalid`);
  }
  assert(exclusions.decision_effect === 'none', 'exclusions decision effect must be none');
  assert(exclusions.authority_effect === 'none', 'exclusions authority effect must be none');
}

function section(markdown, name, nextName) {
  const startMarker = `## ${name}\n`;
  const start = markdown.indexOf(startMarker);
  assert(start >= 0, `witness ladder missing ${name}`);
  const end = nextName ? markdown.indexOf(`## ${nextName}\n`, start + startMarker.length) : markdown.length;
  assert(end >= 0, `witness ladder missing boundary after ${name}`);
  return markdown.slice(start, end);
}

function validateLadder(markdown) {
  const headingMatches = [...markdown.matchAll(/^## (Low|Medium|Complex)$/gm)].map((match) => match[1]);
  same(headingMatches, ['Low', 'Medium', 'Complex'], 'ladder rung headings');
  const low = section(markdown, 'Low', 'Medium');
  const medium = section(markdown, 'Medium', 'Complex');
  const complex = section(markdown, 'Complex', 'Coverage');
  for (const [name, body] of [['Low', low], ['Medium', medium], ['Complex', complex]]) {
    for (const marker of ['- Hypothetical: yes', '- Scenario:', '- Positive witness:', '- Hostile witness:', '- Demonstrates:', '- Does not prove:']) {
      assert(body.includes(marker), `${name} missing ${marker}`);
    }
  }
  assert(markdown.includes('- Rungs produced: 3/3'), 'ladder must report 3/3 rungs');
  assert(markdown.includes('- Positive witnesses: 3/3'), 'ladder must report 3/3 positive witnesses');
  assert(markdown.includes('- Hostile witnesses: 3/3'), 'ladder must report 3/3 hostile witnesses');
  assert(markdown.includes('- Unsupported claims: 0;'), 'ladder unsupported claims must be zero');
  assert((markdown.match(/- Decision effect: none/g) ?? []).length >= 2, 'ladder decision effect must remain none');
  assert(markdown.includes('do not route to an owner Decision Gate'), 'ladder must return without owner-gate routing');
}

function validateMarkdownContracts(readme, distill, result) {
  for (const [label, text] of [['README', readme], ['Distill', distill], ['Result', result]]) {
    assert(!/[ \t]+$/m.test(text), `${label} has trailing whitespace`);
  }
  assert(readme.includes('pass-for-bounded-negative-findings') && readme.includes('not-ready-for-owner-gate'), 'README verdict missing');
  assert(distill.includes('Mode and budget: Validate') && distill.includes('block for owner-gate readiness'), 'Distill Validate verdict missing');
  assert(result.includes('## Outcome Brief') && result.includes('## Boundary and Next Decision'), 'Invoke human result layers missing');
  assert(result.includes('Recommendation: null'), 'repair result must keep recommendation null');
  assert(result.includes('do not invoke an owner Decision Gate yet'), 'repair result must defer owner gate');
}

function listFiles(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...listFiles(absolute));
    else if (entry.isFile()) result.push(absolute);
    else fail(`non-regular repair entry ${absolute}`);
  }
  return result;
}

function validateRepairFiles() {
  const required = [
    'README.md',
    'REPAIR-SCOPE.json',
    'EXACT-SELECTOR-MANIFEST.json',
    'REPAIRED-FACET-MATRIX.json',
    'FACET-BOUNDARY-EXCLUSIONS.json',
    'WITNESS-LADDER.md',
    'DISTILL-VALIDATION.md',
    'REPAIR-RESULT.md',
    'validators/validate-emits-evidence-closure-repair.mjs'
  ];
  for (const relative of required) assert(fs.statSync(path.join(REPAIR_DIR, relative)).isFile(), `required repair file missing: ${relative}`);
  const files = listFiles(REPAIR_DIR);
  for (const absolute of files) {
    const bytes = fs.readFileSync(absolute);
    const text = bytes.toString('utf8');
    assert(!/[ \t]+$/m.test(text), `trailing whitespace: ${path.relative(REPAIR_DIR, absolute)}`);
    if (absolute.endsWith('.json')) JSON.parse(text);
  }
  return files;
}

function loadDocuments() {
  return {
    scope: repairJson('REPAIR-SCOPE.json'),
    manifest: repairJson('EXACT-SELECTOR-MANIFEST.json'),
    matrix: repairJson('REPAIRED-FACET-MATRIX.json'),
    exclusions: repairJson('FACET-BOUNDARY-EXCLUSIONS.json'),
    ladder: fs.readFileSync(path.join(REPAIR_DIR, 'WITNESS-LADDER.md'), 'utf8'),
    readme: fs.readFileSync(path.join(REPAIR_DIR, 'README.md'), 'utf8'),
    distill: fs.readFileSync(path.join(REPAIR_DIR, 'DISTILL-VALIDATION.md'), 'utf8'),
    result: fs.readFileSync(path.join(REPAIR_DIR, 'REPAIR-RESULT.md'), 'utf8'),
    schema: readJson(path.join(ROOT, PATHS.schema))
  };
}

function validateStructural(documents) {
  validateScope(documents.scope);
  validateManifest(documents.manifest);
  validateMatrix(documents.matrix, documents.schema);
  validateExclusions(documents.exclusions);
  validateLadder(documents.ladder);
  validateMarkdownContracts(documents.readme, documents.distill, documents.result);
}

function validateCanonicalHashes() {
  for (const [key, expected] of Object.entries(CANONICAL_HASHES)) {
    const bytes = fs.readFileSync(path.join(ROOT, PATHS[key]));
    assert(sha256(bytes) === expected, `${key} canonical hash drift`);
  }
}

function validatePacketBaseline() {
  const packetBytes = fs.readFileSync(path.join(ROOT, PATHS.packet));
  const packet = JSON.parse(packetBytes.toString('utf8'));
  assert(packet.status === 'candidate-pending-owner-decision', 'main packet status must remain candidate-pending-owner-decision');
  assert(Array.isArray(packet.rows) && packet.rows.length === 31, 'main packet must retain 31 rows');
  const emits = packet.rows[14];
  assert(emits.signature_id === 'emits', 'packet /rows/14 must remain emits');
  for (const facet of FACETS) {
    assert(emits.proposed_decision[facet].status === 'unresolved', `packet emits.${facet} must remain unresolved`);
    assert(emits.proposed_decision[facet].value === null, `packet emits.${facet} value must remain null`);
  }
  assert(packet.owner_disposition.status === 'pending', 'main packet owner disposition must remain pending');
  return {
    snapshot_result: 'pass',
    signature_rows: packet.rows.length,
    owner_disposition: packet.owner_disposition.status,
    emits_seven_facets_unresolved: true,
    packet_sha256: sha256(packetBytes),
    main_validator_execution: 'external-required-because-nested-process-spawn-is-sandbox-blocked'
  };
}

function clone(value) {
  return structuredClone(value);
}

function runProbe(name, mutate) {
  const documents = loadDocuments();
  mutate(documents);
  try {
    validateStructural(documents);
    fail(`negative probe ${name} unexpectedly passed`);
  } catch (error) {
    if (error.message === `negative probe ${name} unexpectedly passed`) throw error;
    return { name, result: 'rejected' };
  }
}

function runSelfTest() {
  const probes = [];
  probes.push(runProbe('missing-facet', (documents) => { documents.matrix.facets.pop(); }));
  probes.push(runProbe('invented-option', (documents) => { documents.matrix.facets[0].options.push('invented'); }));
  probes.push(runProbe('owner-gate-inflation', (documents) => { documents.matrix.facets[1].owner_gate_ready = true; }));
  probes.push(runProbe('schema-vocabulary-drift', (documents) => { documents.matrix.facets[2].schema_contract.value_vocabulary.push('invented'); }));
  probes.push(runProbe('missing-boundary-exclusion', (documents) => { documents.exclusions.boundaries.pop(); }));
  probes.push(runProbe('decision-effect-growth', (documents) => { documents.exclusions.decision_effect = 'selected'; }));
  probes.push(runProbe('source-hash-drift', (documents) => { documents.manifest.sources[0].sha256 = '0'.repeat(64); }));
  probes.push(runProbe('ladder-authority-drift', (documents) => { documents.ladder = documents.ladder.replaceAll('- Decision effect: none', '- Decision effect: selected'); }));
  return probes;
}

function fileInventory(files) {
  return files
    .map((absolute) => ({
      path: path.relative(ROOT, absolute),
      sha256: sha256(fs.readFileSync(absolute))
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

try {
  const unexpected = process.argv.slice(2).filter((arg) => arg !== '--self-test');
  assert(unexpected.length === 0, `unknown arguments: ${unexpected.join(', ')}`);
  const files = validateRepairFiles();
  const documents = loadDocuments();
  validateStructural(documents);
  validateCanonicalHashes();
  const packet = validatePacketBaseline();
  const hostile = process.argv.includes('--self-test') ? runSelfTest() : [];
  process.stdout.write(`${JSON.stringify({
    schema_version: 'domainspec.emits-evidence-closure-repair-validation/v1',
    repair_id: '2026-08-25-evidence-closure-r1',
    result: 'pass-for-bounded-negative-findings',
    owner_gate_readiness: 'not-ready',
    exact_facet_rows: 7,
    selector_sources: documents.manifest.sources.length,
    ladder: { rungs: 3, positive_witnesses: 3, hostile_witnesses: 3, decision_effect: 'none' },
    canonical_preservation: CANONICAL_HASHES,
    packet_validation: packet,
    hostile_probes: hostile,
    repair_files: fileInventory(files),
    authority_effect: 'none',
    next_route: 'bounded-findings-authoring-or-targeted-research; no owner Decision Gate'
  }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`emits evidence-closure repair validation failed: ${error.stack ?? error.message}\n`);
  process.exitCode = 1;
}
