#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function findRepositoryRoot(start) {
  let current = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(current, 'AGENTS.md'))) return current;
    const parent = path.dirname(current);
    if (parent === current) throw new Error('repository root with AGENTS.md not found');
    current = parent;
  }
}

const ROOT = findRepositoryRoot(path.dirname(fileURLToPath(import.meta.url)));
const BASE = 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/define';
const HANDOFF_MD = `${BASE}/evidence/RUNTIME-HANDOFF.md`;
const HANDOFF_JSON = `${BASE}/evidence/RUNTIME-HANDOFF.json`;
const PACKET = 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json';

const EXPECTED_HANDOFF_HASHES = {
  [HANDOFF_MD]: '84ebd5e0a5fc27f9491035d562507f0275a6f3a75934310f1b88f4b22476ff4b',
  [HANDOFF_JSON]: 'db6e710cf2055d50690ddd67345deab1927c83880bf2236da4c3694def4cea25'
};

const APPROVAL_ARTIFACTS = [
  'README.md',
  'SPEC.md',
  'GLOSSARY.md',
  'DEFINE-CONTEXT.md',
  'DEFINE-INTENT.md',
  'DEFINE-TEMPLATE-SELECTION.md',
  'DEFINE-DISPATCH-TECHNIQUE-TRACE.md',
  'DEFINE-DISTILL-VALIDATION.md',
  'DEFINE-COMPLEXITY-EXAMPLES.md',
  'DEFINE-GAPS.md',
  'DEFINE-TRANSPORT-REPORT.json',
  'DEFINE-RESULT.md',
  'validators/validate-bmc-rel-constraint-completion-define.mjs'
];

const REQUIRED_FINAL = [
  ...APPROVAL_ARTIFACTS,
  'DEFINE-APPROVAL-MANIFEST.json',
  'DEFINE-VALIDATION.json',
  'evidence/RUNTIME-HANDOFF.md',
  'evidence/RUNTIME-HANDOFF.json'
];

const REQUIRED_SECTIONS = {
  'README.md': ['## Status', '## Package Map', '## Validation'],
  'SPEC.md': ['## What This Module Owns', '## Capabilities', '## Fixed Source Contracts', '## Current Packet Invariants', '## Remaining Constraint-Authoring Frontier', '## Acceptance Contract', '## Claim Ceiling'],
  'GLOSSARY.md': ['## Non-Collapse Rules'],
  'DEFINE-CONTEXT.md': ['## Context Pack Summary', '## Selected Evidence Denominator', '## Inventory Selection', '## Excluded Context', '## Context Builder Verdict'],
  'DEFINE-INTENT.md': ['## Authorization Record', '## Goal', '## Scope', '## Non-Goals', '## Structured Interview Result'],
  'DEFINE-TEMPLATE-SELECTION.md': ['## Inventory Result', '## Eligibility Evidence', '## Selection', '## Validation Expectation'],
  'DEFINE-DISPATCH-TECHNIQUE-TRACE.md': ['## Route Shape', '## Techniques Actually Used', '## Skipped Techniques', '## Dispatch Result'],
  'DEFINE-DISTILL-VALIDATION.md': ['## Distill Result', '## Recursive Round 1', '## Recursive Round 2', '## Smallest Coherent Define Unit', '## Closure and Recomposition Proof', '## Technique Pack Trace', '## Frame-Expiry Note', '## Navigation Guide'],
  'DEFINE-COMPLEXITY-EXAMPLES.md': ['## Complexity Example Ladder Result', '### Low', '### Medium', '### Complex', '### Coverage'],
  'DEFINE-GAPS.md': ['## Exact Remaining Subject Frontier', '## Separate Route Gate', '## Layering Gap', '## Gap Ledger Verdict'],
  'DEFINE-RESULT.md': ['## Outcome Brief', '## Boundary and Next Decision', '## Technical Details', '## Invoke Result', '## Capability Axes']
};

const FRONTIER_PHRASES = [
  'Nonnumeric pass: duplicates, ordered occurrence representation, inverse views, self-edge/cycle topology, hostile fixtures, and partial-view behavior.',
  'Per-fact ownership-dimension and membership-kind representation plus executable fixtures.',
  'Runtime-cardinality semantics.',
  'Numeric bounds, separately from all other axes.',
  'Packet-wide owner acceptance.',
  'Implementation and enforcement later, under separately authorized lifecycle work.'
];

const TECHNIQUES = [
  'sequence',
  'frame_handoff',
  'handle_handoff',
  'concrete_path_evidence',
  'owner_boundary_check',
  'residue_ledger',
  'artifact_contract_bridge',
  'approval_semantics_map',
  'validation_loop'
];

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function absolute(repositoryRelativePath) {
  const resolved = path.resolve(ROOT, repositoryRelativePath);
  assert(resolved === ROOT || resolved.startsWith(`${ROOT}${path.sep}`), `path escapes repository: ${repositoryRelativePath}`);
  return resolved;
}

function basePath(relativePath) {
  return absolute(`${BASE}/${relativePath}`);
}

function readBytes(repositoryRelativePath) {
  return fs.readFileSync(absolute(repositoryRelativePath));
}

function readBase(relativePath) {
  return fs.readFileSync(basePath(relativePath), 'utf8');
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function parseJsonText(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

function parseBaseJson(relativePath) {
  return parseJsonText(readBase(relativePath), relativePath);
}

function assertExactArray(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`);
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} drift`);
}

function approvalSetDigest(entries) {
  const lines = entries.map((entry) => `${entry.path}:${entry.sha256}\n`).join('');
  return sha256(Buffer.from(lines, 'utf8'));
}

function validateRequiredFiles(preflight) {
  const required = preflight ? REQUIRED_FINAL.filter((name) => name !== 'DEFINE-VALIDATION.json') : REQUIRED_FINAL;
  for (const relativePath of required) {
    const candidate = basePath(relativePath);
    assert(fs.existsSync(candidate), `required file missing: ${relativePath}`);
    assert(fs.statSync(candidate).isFile(), `required path is not a file: ${relativePath}`);
  }
  return required.length;
}

function validateSections() {
  for (const [relativePath, sections] of Object.entries(REQUIRED_SECTIONS)) {
    const text = readBase(relativePath);
    for (const section of sections) assert(text.includes(section), `${relativePath} missing section ${section}`);
  }
}

function validateTemplateMarkers() {
  const authoredMarkdown = APPROVAL_ARTIFACTS.filter((name) => name.endsWith('.md'));
  const markerPattern = /\b(?:TODO|TBD|FIXME)\b|\{[A-Za-z][^}\n]*\}|<!--/;
  for (const relativePath of authoredMarkdown) {
    assert(!markerPattern.test(readBase(relativePath)), `${relativePath} contains an unresolved template marker`);
  }
}

function validateHandoffAndSources() {
  for (const [repositoryRelativePath, expected] of Object.entries(EXPECTED_HANDOFF_HASHES)) {
    const actual = sha256(readBytes(repositoryRelativePath));
    assert(actual === expected, `${repositoryRelativePath} byte hash drift: expected ${expected}, got ${actual}`);
  }

  const handoff = parseJsonText(readBytes(HANDOFF_JSON).toString('utf8'), HANDOFF_JSON);
  assert(handoff.strict_coverage === 'pass', 'runtime handoff strict coverage must remain pass');
  assert(Array.isArray(handoff.selected_sources) && handoff.selected_sources.length === 10, 'runtime handoff must bind exactly ten selected sources');
  for (const source of handoff.selected_sources) {
    assert(typeof source.path === 'string' && typeof source.sha256 === 'string', 'runtime handoff source binding is malformed');
    const actual = sha256(readBytes(source.path));
    assert(actual === source.sha256, `selected source hash drift: ${source.path}`);
  }
  return handoff.selected_sources.length;
}

function validatePacketFacts() {
  const packet = parseJsonText(readBytes(PACKET).toString('utf8'), PACKET);
  assert(packet.status === 'candidate-pending-owner-decision', 'packet status drift');
  assert(packet.owner_disposition?.status === 'pending', 'packet owner disposition must remain pending');
  assert(packet.authority_effect === 'none', 'packet authority effect must remain none');
  assert(Array.isArray(packet.rows) && packet.rows.length === 31, 'packet must retain 31 rows');
  assert(packet.rows.every((row) => row.proposed_decision?.status === 'unresolved'), 'all 31 row proposed decisions must remain unresolved');
  const numericUnresolved = packet.rows.filter((row) => row.numeric_bounds_evidence?.status === 'unresolved').length;
  assert(numericUnresolved === 30, 'exactly 30 numeric bounds evidence records must remain unresolved');
  const ownerSelectedFacets = packet.rows.reduce((count, row) => count + Object.values(row.proposed_decision)
    .filter((value) => value && typeof value === 'object' && !Array.isArray(value) && value.status === 'owner-selected').length, 0);
  assert(ownerSelectedFacets === 6, 'exactly six ordinary facet objects must remain owner-selected');
  const owns = packet.rows.find((row) => row.signature_id === 'owns');
  const belongsTo = packet.rows.find((row) => row.signature_id === 'belongs-to');
  assert(owns?.ownership_topology?.status === 'owner-selected', 'owns topology object must remain owner-selected');
  assert(owns.ownership_topology.policy === 'one-owner-per-admitted-dimension', 'owns topology policy drift');
  assert(belongsTo?.membership_topology?.status === 'owner-selected', 'belongs-to topology object must remain owner-selected');
  assert(belongsTo.membership_topology.policy === 'one-parent-per-admitted-membership-kind', 'belongs-to topology policy drift');
  return { rows: packet.rows.length, numeric_unresolved: numericUnresolved, owner_selected_facets: ownerSelectedFacets };
}

function validateIntentAndTemplate() {
  const spec = readBase('SPEC.md');
  const intent = readBase('DEFINE-INTENT.md');
  const template = readBase('DEFINE-TEMPLATE-SELECTION.md');
  const waiver = 'discovery_waiver_reason: "the exact HN-E1384364D9F4 plus D01-D08 decision corpus supersedes a generic new discovery pass for this bounded compilation."';
  assert(spec.includes(waiver), 'SPEC discovery waiver drift');
  assert(intent.includes('`run the proposed Define->approval->Design sequence`'), 'exact prospective user authorization is missing');
  assert(intent.includes('Questions asked: `0`'), 'Interrogation result must record zero questions');
  assert(intent.includes('It is not approval of artifacts that had not yet been shown'), 'authorization must not be treated as artifact approval');
  assert(template.includes('Lookup readiness: `pass`'), 'Inventory lookup readiness must pass');
  assert(template.includes('Uncontrolled historical tag warnings: `153`'), 'Inventory lookup must preserve 153 tag warnings');
  assert(template.includes('no tie'), 'template selection must record no tie');
  assert(template.includes('DomainSpec spec baseline'), 'DomainSpec spec baseline must be selected');
}

function validateFrontierAndNonSelection() {
  const spec = readBase('SPEC.md');
  const gaps = readBase('DEFINE-GAPS.md');
  for (const phrase of FRONTIER_PHRASES) assert(spec.includes(phrase), `SPEC missing exact frontier phrase: ${phrase}`);
  for (const id of ['F-NONNUMERIC', 'F-PER-FACT', 'F-RUNTIME', 'F-NUMERIC', 'F-PACKET-ACCEPTANCE', 'F-IMPLEMENTATION']) {
    assert(gaps.includes(`\`${id}\``), `gap ledger missing ${id}`);
  }
  const combined = `${spec}\n${gaps}`;
  const nonSelection = 'No policy in this remaining frontier is selected by this package.';
  assert(spec.includes(nonSelection) && gaps.includes(nonSelection), 'explicit frontier non-selection boundary missing');
  const forbiddenAssignments = [
    /duplicates?\s*(?:=|:)\s*(?:reject|coalesce|allow)/i,
    /partial[-_ ]view\s*(?:=|:)\s*(?:skip|unsupported|owner-blocked)/i,
    /self[-_ ](?:edge|relations?)\s*(?:=|:)\s*(?:reject|allow)/i,
    /inverse[-_ ]semantics\s*(?:=|:)\s*(?:generated-view|authored-canonical|bidirectional-pair)/i,
    /runtime[-_ ]cardinality\s*(?:=|:)\s*(?:same-as|separate-from|not-applicable)/i,
    /numeric bounds?\s*(?:=|:)\s*(?:[0-9]|unbounded)/i,
    /(?:this package|this candidate|we)\s+(?:selects?|chooses?|sets?)\s+[^.\n]*(?:duplicate|ordered occurrence|inverse view|self-edge|cycle|partial-view|runtime-cardinality|numeric bound)/i
  ];
  for (const pattern of forbiddenAssignments) assert(!pattern.test(combined), `unresolved policy selection language matched ${pattern}`);
}

function validateDistillAndDispatch() {
  const distill = readBase('DEFINE-DISTILL-VALIDATION.md');
  assert(distill.includes('Mode and budget: `Standard`'), 'Distill must use Standard mode');
  assert(distill.includes('Proposal tracks: `1`'), 'Distill must use one proposal track');
  assert(distill.includes('labelled `Proposer` and `Balancer` simulation'), 'Distill role simulation missing');
  assert(distill.includes('Recursive rounds: `2/2`'), 'Distill must complete two recursive rounds');
  assert(distill.includes('Multi-agent tournament: not authorized and not run'), 'Distill tournament boundary missing');
  assert(distill.includes('`BMC-REL-001 Constraint Completion Define Baseline`'), 'smallest coherent Define unit missing');
  assert(distill.includes('## Closure and Recomposition Proof'), 'Distill recomposition proof missing');
  assert(distill.includes('- Verdict: `pass`'), 'Distill verdict must pass');

  const dispatch = readBase('DEFINE-DISPATCH-TECHNIQUE-TRACE.md');
  for (const technique of TECHNIQUES) assert(dispatch.includes(`\`${technique}\``), `dispatch trace missing used technique ${technique}`);
  assert(dispatch.includes('A full Dispatch Spec JSON document is therefore not required.'), 'full dispatch JSON skipped reason missing');
  assert(dispatch.includes('## Skipped Techniques'), 'dispatch skipped-technique reasons missing');
}

function validateComplexityLadder() {
  const ladder = readBase('DEFINE-COMPLEXITY-EXAMPLES.md');
  for (const rung of ['### Low', '### Medium', '### Complex']) assert(ladder.includes(rung), `complexity ladder missing ${rung}`);
  for (const marker of ['simple concept edge', 'workflow/mapping occurrence distinction', '`owns`/`belongs-to`/`produces`/`emits` graph']) {
    assert(ladder.includes(marker), `complexity ladder missing coverage marker ${marker}`);
  }
  assert(ladder.includes('Unsupported claims: `0`'), 'complexity ladder unsupported claim count must be zero');
  assert(ladder.includes('Decision effect: `none`'), 'complexity ladder decision effect must be none');
  assert(ladder.includes('Invariant preserved: `pass`'), 'complexity invariant must be preserved');
  assert((ladder.match(/Hypothetical/g) || []).length >= 3, 'all three scenarios must be labelled hypothetical');
}

function validateTransport() {
  const transport = parseBaseJson('DEFINE-TRANSPORT-REPORT.json');
  assert(transport.observed_capability === 'invoke' && transport.invoke_mode === 'define', 'transport capability or mode drift');
  assert(transport.result?.phase_status === 'pass', 'transport phase status must pass');
  assert(transport.result?.handoff_status === 'blocked-pending-exact-owner-approval', 'transport handoff must remain blocked');
  assert(transport.claim_ceiling?.artifact_authored === 'pass', 'artifact-authored axis must pass');
  assert(transport.claim_ceiling?.registry_released === false, 'registry release must remain false');
  assert(transport.claim_ceiling?.mutation_runtime_ready === false, 'mutation runtime readiness must remain false');
  assert(transport.claim_ceiling?.packet_accepted === false, 'packet acceptance must remain false');
  assert(transport.claim_ceiling?.authority_effect === 'none', 'transport authority effect must remain none');
  assertExactArray(transport.dispatch_trace?.selected_techniques, TECHNIQUES, 'transport selected techniques');
  return transport;
}

function validateManifest(manifest) {
  assert(manifest.schema_version === 'domainspec.invoke.define-approval-manifest/v1', 'approval manifest schema drift');
  assert(manifest.manifest_id === 'BMC-REL-CONSTRAINT-COMPLETION-DEFINE-APPROVAL', 'approval manifest id drift');
  assert(manifest.candidate_root === BASE, 'approval manifest root drift');
  assert(manifest.digest_algorithm === 'sha256', 'approval manifest digest algorithm must be sha256');
  assert(manifest.artifact_set_digest_algorithm === 'sha256-over-utf8-lines-path-colon-sha256-lf-in-listed-order', 'artifact-set digest algorithm drift');
  assert(Array.isArray(manifest.included_artifacts), 'approval manifest artifacts must be an array');
  assertExactArray(manifest.included_artifacts.map((entry) => entry.path), APPROVAL_ARTIFACTS, 'approval artifact path closure');
  for (const entry of manifest.included_artifacts) {
    assert(/^[a-f0-9]{64}$/.test(entry.sha256), `invalid artifact digest for ${entry.path}`);
    const actual = sha256(fs.readFileSync(basePath(entry.path)));
    assert(actual === entry.sha256, `approval artifact hash drift: ${entry.path}`);
  }
  assert(manifest.artifact_set_sha256 === approvalSetDigest(manifest.included_artifacts), 'approval artifact-set digest closure failed');
  assertExactArray(manifest.excluded_mutable_or_self_referential, ['DEFINE-APPROVAL-MANIFEST.json', 'DEFINE-VALIDATION.json'], 'approval manifest exclusions');
  assert(manifest.preserved_evidence?.['evidence/RUNTIME-HANDOFF.md'] === EXPECTED_HANDOFF_HASHES[HANDOFF_MD], 'manifest handoff Markdown binding drift');
  assert(manifest.preserved_evidence?.['evidence/RUNTIME-HANDOFF.json'] === EXPECTED_HANDOFF_HASHES[HANDOFF_JSON], 'manifest handoff JSON binding drift');
  assert(manifest.approval?.status === 'pending-exact-owner-approval', 'approval status must remain pending');
  assert(manifest.approval?.question === 'Approve the exact Define candidate artifact set and SHA-256 bindings in this manifest as the stable Define baseline for Invoke Design?', 'exact approval question drift');
  assertExactArray(manifest.approval?.allowed_responses, ['approve-exact', 'return-for-revision', 'reject'], 'approval responses');
  assert(manifest.design_handoff?.status === 'blocked-pending-exact-owner-approval', 'Design handoff must remain blocked');
  assert(manifest.design_handoff?.begun === false, 'Design must not be begun');
  assert(manifest.claim_ceiling?.artifact_authored === 'pass', 'manifest artifact-authored axis must pass');
  assert(manifest.claim_ceiling?.registry_released === false, 'manifest registry release must remain false');
  assert(manifest.claim_ceiling?.mutation_runtime_ready === false, 'manifest mutation runtime readiness must remain false');
  assert(manifest.claim_ceiling?.packet_accepted === false, 'manifest packet acceptance must remain false');
  assert(manifest.claim_ceiling?.authority_effect === 'none', 'manifest authority effect must remain none');
  return manifest.artifact_set_sha256;
}

function validateValidationReceipt(preflight) {
  if (preflight) return { status: 'not-required-in-preflight', commands: 0 };
  const receipt = parseBaseJson('DEFINE-VALIDATION.json');
  assert(receipt.schema_version === 'domainspec.invoke.define-validation/v1', 'validation receipt schema drift');
  assert(receipt.result === 'pass', 'validation receipt must report pass');
  assert(Array.isArray(receipt.commands) && receipt.commands.length >= 6, 'validation receipt must preserve required command results');
  assert(receipt.commands.every((command) => command.result === 'pass' && command.exit_code === 0), 'every recorded validation command must pass');
  assert(receipt.source_hashes_verified === 10, 'validation receipt must record ten source hashes');
  assert(receipt.handoff_preserved === true, 'validation receipt must record preserved handoff bytes');
  assert(receipt.design_handoff === 'blocked-pending-exact-owner-approval', 'validation receipt must block Design');
  return { status: receipt.result, commands: receipt.commands.length };
}

function runNegativeProbes(manifest) {
  const probes = [];
  function reject(name, action) {
    try {
      action();
      fail(`negative probe ${name} unexpectedly passed`);
    } catch (error) {
      if (error.message === `negative probe ${name} unexpectedly passed`) throw error;
      probes.push({ name, result: 'rejected' });
    }
  }
  reject('approval-artifact-hash-drift', () => {
    const candidate = structuredClone(manifest);
    candidate.included_artifacts[0].sha256 = '0'.repeat(64);
    validateManifest(candidate);
  });
  reject('design-handoff-open-without-approval', () => {
    const candidate = structuredClone(manifest);
    candidate.design_handoff.status = 'ready';
    validateManifest(candidate);
  });
  reject('registry-release-overclaim', () => {
    const candidate = structuredClone(manifest);
    candidate.claim_ceiling.registry_released = true;
    validateManifest(candidate);
  });
  return probes;
}

function parseArgs(args) {
  let preflight = false;
  let selfTest = false;
  for (const arg of args) {
    if (arg === '--preflight') preflight = true;
    else if (arg === '--self-test') selfTest = true;
    else fail(`unknown option: ${arg}`);
  }
  return { preflight, selfTest };
}

try {
  const { preflight, selfTest } = parseArgs(process.argv.slice(2));
  const requiredFiles = validateRequiredFiles(preflight);
  validateSections();
  validateTemplateMarkers();
  const sourceHashesVerified = validateHandoffAndSources();
  const packetFacts = validatePacketFacts();
  validateIntentAndTemplate();
  validateFrontierAndNonSelection();
  validateDistillAndDispatch();
  validateComplexityLadder();
  validateTransport();
  const manifest = parseBaseJson('DEFINE-APPROVAL-MANIFEST.json');
  const artifactSetSha256 = validateManifest(manifest);
  const validationReceipt = validateValidationReceipt(preflight);
  const result = {
    validator: 'validate-bmc-rel-constraint-completion-define',
    result: 'pass',
    mode: preflight ? 'preflight' : 'final',
    required_files_verified: requiredFiles,
    source_hashes_verified: sourceHashesVerified,
    handoff_preserved: true,
    packet_facts: packetFacts,
    approval_artifacts_verified: APPROVAL_ARTIFACTS.length,
    artifact_set_sha256: artifactSetSha256,
    required_sections: 'pass',
    json_parseability: 'pass',
    unresolved_template_markers: 0,
    unresolved_policy_selection_effect: 'none',
    distill_verdict: 'pass',
    complexity_ladder: { rungs: 3, unsupported_claims: 0, decision_effect: 'none' },
    claim_ceiling: { artifact_authored: 'pass', registry_released: false, mutation_runtime_ready: false },
    validation_receipt: validationReceipt,
    design_handoff: 'blocked-pending-exact-owner-approval',
    approval_question: manifest.approval.question
  };
  if (selfTest) result.negative_probes = runNegativeProbes(manifest);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`BMC-REL constraint-completion Define validation failed: ${error.message}\n`);
  process.exitCode = 1;
}
