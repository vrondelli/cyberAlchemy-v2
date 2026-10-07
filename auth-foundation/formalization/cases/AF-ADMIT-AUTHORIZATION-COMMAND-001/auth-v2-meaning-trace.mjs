import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = realpathSync(fileURLToPath(new URL('../../../', import.meta.url)));
const repoRoot = realpathSync(join(root, '..'));
const rel = 'formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/';
const source = 'implementation/command-boundary-source-v2/';
const runtime = 'implementation/command-boundary-runtime-v2/';
const node = `${source}specs/auth-command-boundary/nodes/`;
const receiptName = '.domainspec/instantiations/auth-command-boundary.admit-authorization-command.json';
const rustName = 'src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = reason => { throw new Error(`AUTH_V2_MEANING_TRACE:${reason}`); };
const pins = Object.freeze({
  meaning: [`${rel}BUSINESS-MEANING.v1-candidate.json`, '3cd0b2d4d59815e212ea601ca95c49929b5036f459fef8b6ed0e63b70c20724e'],
  productDecision: ['implementation/decisions/command-boundary-product-ontology-admission-001.json', '61bcc2b22bda6c405c17d6dfa612e77fdbaae1cc2d5b36f98f9dc53820da8b65'],
  sfolDecision: ['formalization/decisions/AF-ADMIT-AUTHORIZATION-COMMAND-001/sfol-formal-claim-admission-001.json', 'c321f051840f56a8cacd5e1b3a29efddc4708f1d438d356a0927237d33199fa5'],
  project: [`${source}project.json`, '193b9b6feca8d20ab7ca4c27ba00cea9ecce7ecf659d10fd77facd3eef7b2fd5'],
  context: [`${node}command-boundary-context.json`, 'f59e12aad5efa12375cca82f56b36d73e532fb8795c7a7d4ad7e9a9ef2c9df34'],
  decision: [`${node}command-boundary-decision.json`, 'ab768996fe16624e2a949b51099cd2e1b7081c994f524914d101545b7f7ff0f1'],
  auth: [`${node}unique-trusted-authentication-evidence.json`, 'eada37d662b8d31737c2c00d118f629a03e250a1742bb137231bd7996e1e6608'],
  route: [`${node}unique-complete-route-binding.json`, 'd6a56c77c2c00937ee6526cfe423b37fc31b4a9940795c840e276cd6b3e322b4'],
  provenance: [`${node}candidate-command-provenance.json`, '102b60b8da13f51273b4bafe6fb6522cdc68c923597f10dee02772bd8836937c'],
  aggregate: [`${node}command-boundary-admissible.json`, '91899b41f928554b796ce4446d06e7ed1836fcbcf20deac814430010a9a320ed'],
  operation: [`${node}admit-authorization-command.json`, 'fbace90ffca46b51fd286d3bf733b39b803f739c69bf5d2c9a1a1daeb5df9ac1'],
  receipt: [`${runtime}${receiptName}`, '23b8d7a9957ea6a8b6854d78ae359da2c91968f1a1dd265731a15e8255728a12'],
  cargo: [`${runtime}Cargo.toml`, 'febf45e7dc61a1ebec89c98cbce82cafe030610340d3cbc5311f91ce7db4ebfa'],
  rust: [`${runtime}${rustName}`, '7c19fdb91f4098d7f12cc0c05804dd50c852c69902125af0c3b2d55ba5e497f0'],
  candidateEvidence: ['implementation/standard-conformance/command-boundary-v2-candidate-evidence.json', '44909079f84b296b4f98ed63e810c4516ea311a9e3e7a882dc94a8da6556f842'],
});
export const AUTH_V2_MEANING_PINS = pins;
export const AUTH_V2_MEANING_SOURCE_PATHS = Object.freeze(Object.fromEntries(Object.entries(pins).map(([k, [p]]) => [k, p])));

const P = (r, ...properties) => ({ op: 'path', root: r, properties });
const L = (type, value) => ({ op: 'literal', type, value });
const E = (left, right) => ({ op: 'eq', left, right });
const N = value => ({ op: 'not', term: E(value, L('String', '')) });
const A = terms => ({ op: 'all', terms });
const x = Object.freeze({
  request: 'AUTH-CB-CONTEXT#request', candidate: 'AUTH-CB-CONTEXT#candidate_command',
  authRows: 'AUTH-CB-CONTEXT#resolved_authentication_evidence', routeRows: 'AUTH-CB-CONTEXT#resolved_route_bindings',
  requestId: 'AUTH-CB-BOUNDARY-REQUEST#request_id', requestAuth: 'AUTH-CB-BOUNDARY-REQUEST#authentication_evidence_ref', requestRoute: 'AUTH-CB-BOUNDARY-REQUEST#route_id',
  evidenceRef: 'AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#evidence_ref', session: 'AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#session_id', trusted: 'AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#trusted',
  routeId: 'AUTH-CB-ROUTE-AUTHORIZATION-BINDING#route_id', complete: 'AUTH-CB-ROUTE-AUTHORIZATION-BINDING#complete', scopeEvidence: 'AUTH-CB-ROUTE-AUTHORIZATION-BINDING#scope_evidence_ref', routePermission: 'AUTH-CB-ROUTE-AUTHORIZATION-BINDING#required_permission',
  commandId: 'AUTH-CB-AUTHORIZATION-COMMAND#request_id', commandSession: 'AUTH-CB-AUTHORIZATION-COMMAND#session_id', commandPermission: 'AUTH-CB-AUTHORIZATION-COMMAND#required_permission', commandScopeEvidence: 'AUTH-CB-AUTHORIZATION-COMMAND#scope_evidence_ref',
});
const fields = ['resource', 'action', 'scope'];
const permission = field => `AUTH-CB-PERMISSION#${field}`;
const evidence = field => P('evidence', field);
const binding = (...parts) => P('binding', ...parts);
const request = field => P('context', x.request, field);
const candidate = (...parts) => P('context', x.candidate, ...parts);
const authQualifiers = [E(evidence(x.evidenceRef), request(x.requestAuth)), N(evidence(x.evidenceRef)), E(evidence(x.trusted), L('Bool', true)), N(evidence(x.session))];
const routeQualifiers = [E(binding(x.routeId), request(x.requestRoute)), N(binding(x.routeId)), E(binding(x.complete), L('Bool', true)), N(binding(x.scopeEvidence)), ...fields.map(field => N(binding(x.routePermission, permission(field))))];
const param = [{ name: 'context', type: { kind: 'named', selector: 'auth-command-boundary:command-boundary-context' } }];
const rule = (ontology_rule, expression) => ({ schema_version: 'domainspec.typed-rule/v1', ontology_rule, parameters: param, expression });
const expected = {
  auth: rule('AUTH-CB-RULE-UNIQUE-TRUSTED-AUTHENTICATION-EVIDENCE', { op: 'exactly_one', binding: 'evidence', collection: P('context', x.authRows), where: A(authQualifiers) }),
  route: rule('AUTH-CB-RULE-UNIQUE-COMPLETE-ROUTE-BINDING', { op: 'exactly_one', binding: 'binding', collection: P('context', x.routeRows), where: A(routeQualifiers) }),
  provenance: rule('AUTH-CB-RULE-CANDIDATE-COMMAND-PROVENANCE', A([
    N(request(x.requestId)), E(candidate(x.commandId), request(x.requestId)),
    { op: 'exists', binding: 'evidence', collection: P('context', x.authRows), where: A([...authQualifiers, E(evidence(x.session), candidate(x.commandSession))]) },
    { op: 'exists', binding: 'binding', collection: P('context', x.routeRows), where: A([...routeQualifiers, ...fields.map(field => E(binding(x.routePermission, permission(field)), candidate(x.commandPermission, permission(field)))), E(binding(x.scopeEvidence), candidate(x.commandScopeEvidence))]) },
  ])),
  aggregate: rule('AUTH-CB-RULE-ADMISSIBLE', A(['unique-trusted-authentication-evidence', 'unique-complete-route-binding', 'candidate-command-provenance'].map(name => ({ op: 'rule_ref', selector: `auth-command-boundary:${name}`, arguments: [{ parameter: 'context', value: P('context') }] })))),
  operation: { schema_version: 'domainspec.typed-operation/v1', ontology_operation: 'AUTH-CB-OP-ADMIT-AUTHORIZATION-COMMAND', inputs: param, output: { kind: 'named', selector: 'auth-command-boundary:command-boundary-decision' }, guard: 'auth-command-boundary:command-boundary-admissible', reads: [], writes: [], effects: [], failure_continuation: 'return-deny-without-downstream-call', success_result: { variant: 'Ready', payload_variant: null }, failure_result: { variant: 'Deny', payload_variant: null } },
};

export function validateAuthV2MeaningAst(rows) {
  for (const key of ['auth', 'route', 'provenance', 'aggregate']) {
    const row = rows[key];
    if (row?.kind !== 'Rule' || row.node_id !== ({ auth: 'unique-trusted-authentication-evidence', route: 'unique-complete-route-binding', provenance: 'candidate-command-provenance', aggregate: 'command-boundary-admissible' })[key] || row.feature_id !== 'auth-command-boundary' || row.body?.predicate !== 'structured:domainspec.typed-rule/v1') fail(`rule-metadata:${key}`);
    try { assert.deepStrictEqual(row.body.typed_contract, expected[key]); } catch { fail(`rule-ast:${key}`); }
  }
  const op = rows.operation;
  if (op?.kind !== 'Operation' || op.node_id !== 'admit-authorization-command' || op.feature_id !== 'auth-command-boundary' || op.body?.guard !== 'command-boundary-admissible' || op.body?.failure_continuation !== 'return-deny-without-downstream-call') fail('operation-metadata');
  for (const field of ['reads', 'writes', 'effects']) {
    try { assert.deepStrictEqual(op.body[field], []); } catch { fail(`operation-${field}`); }
  }
  try { assert.deepStrictEqual(op.body.typed_contract, expected.operation); } catch { fail('operation-ast'); }
  const context = rows.context?.body?.typed_contract;
  const decision = rows.decision?.body?.typed_contract;
  if (context?.ontology_node !== 'AUTH-CB-CONTEXT' || decision?.ontology_node !== 'AUTH-CB-DECISION') fail('context-decision');
  try {
    assert.deepStrictEqual(context.properties.filter(p => p.cardinality === 'many').map(p => [p.name, p.type.kind]), [['resolved_authentication_evidence', 'list'], ['resolved_route_bindings', 'list']]);
    assert.deepStrictEqual(decision.variants.map(v => [v.name, v.payload]), [['Ready', null], ['Deny', null]]);
  } catch { fail('context-decision'); }
}

function readSafe(path) {
  const parts = path.split('/');
  if (parts.some(part => !part || part === '.' || part === '..') || path.includes('\\')) fail(`path:${path}`);
  let at = root;
  for (const part of parts) { at = join(at, part); if (lstatSync(at).isSymbolicLink()) fail(`symlink:${path}`); }
  if (relative(root, at).startsWith('..') || realpathSync(at) !== at || !lstatSync(at).isFile()) fail(`scope:${path}`);
  return readFileSync(at);
}
export function currentAuthV2MeaningSources() { return new Map(Object.values(pins).map(([path]) => [path, readSafe(path)])); }
const cliEntry = join(repoRoot, 'craft/projects/domainspec-v2/impl/cli/node_modules/tsx/dist/cli.mjs');
const cliMain = join(repoRoot, 'craft/projects/domainspec-v2/impl/cli/src/cli/main.ts');
function cli(...args) {
  const result = spawnSync(process.execPath, [cliEntry, cliMain, ...args], { cwd: repoRoot, env: { ...process.env, TMPDIR: '/var/tmp' }, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0 || result.error) fail(`cli:${args[0]}:${result.error?.message ?? `${result.stderr.slice(0, 500)}:${result.stdout.slice(-500)}`}`);
  try { return JSON.parse(result.stdout); } catch { fail(`cli-json:${args[0]}`); }
}
export function buildAuthV2MeaningTrace(sources, { regenerate = true } = {}) {
  const paths = Object.values(pins).map(([path]) => path);
  if (!(sources instanceof Map) || sources.size !== paths.length || [...sources.keys()].some(path => !paths.includes(path))) fail('source-domain');
  const values = {};
  const refs = {};
  for (const [name, [path, pin]] of Object.entries(pins)) {
    const bytes = sources.get(path);
    if (!Buffer.isBuffer(bytes) || !bytes.equals(readSafe(path)) || sha(bytes) !== pin) fail(`source-drift:${name}`);
    refs[name] = { path, sha256: pin, size_bytes: bytes.length, current: true };
    if (name !== 'cargo' && name !== 'rust') {
      try { values[name] = JSON.parse(bytes.toString('utf8')); } catch { fail(`json:${name}`); }
    }
  }
  const meaning = values.meaning;
  const exactRule = 'For a representable CommandBoundaryContext evaluated normally, the boundary returns READY if and only if exactly one qualifying trusted authentication row and exactly one qualifying complete route-binding row match the request, and every candidate-command value has exact provenance from the inbound request or those same unique qualifying rows. Every other normally evaluated in-scope context returns DENY without a downstream call.';
  if (meaning?.meaning_id !== 'BusinessMeaning:auth-foundation.admit-authorization-command-boundary' || meaning.version !== '1-candidate' || meaning.status !== 'draft' || meaning.acceptance?.status !== 'not-requested' || meaning.acceptance?.acceptance_ref !== null || meaning.rule !== exactRule || meaning.authority_effect !== 'none') fail('foreign-or-accepted-meaning');
  if (values.productDecision?.decision_id !== 'AUTH-DECISION-COMMAND-BOUNDARY-PRODUCT-ONTOLOGY-ADMISSION-001' ||
      values.sfolDecision?.decision_id !== 'AUTH-DECISION-SFOL-FORMAL-CLAIM-ADMISSION-001' ||
      values.sfolDecision?.meaning_predecessor?.decision_path !== refs.productDecision.path ||
      values.sfolDecision?.meaning_predecessor?.decision_sha256 !== refs.productDecision.sha256) fail('historical-decision-link');
  if (values.project?.project_id !== 'auth-foundation-command-boundary-v2') fail('project-identity');
  validateAuthV2MeaningAst(values);
  const manifest = cli('receipt', join(root, source));
  if (manifest.schema_version !== 'domainspec.stable-foundation-cli.source-manifest/v1' || manifest.project_id !== values.project.project_id || manifest.manifest_sha256 !== '2d20ee36b08095bfab7f59ca224cc6a565644fbd3ac8d995be9b2f5fa6b475b7') fail('source-manifest');
  const receipt = values.receipt;
  if (receipt.schema_version !== 'domainspec.instantiation-receipt/v1' || receipt.input?.project_id !== values.project.project_id || receipt.input?.source_manifest_sha256 !== manifest.manifest_sha256 || receipt.receipt_sha256 !== '1116907dfb341cc3efa2c14bef56f22147b204a92045a55cb5554f1629df9275' || receipt.authority_effect !== 'none') fail('receipt-binding');
  const observed = cli('receipt', join(root, runtime.slice(0, -1)));
  if (observed.observation?.result !== 'pass' || observed.receipt?.receipt_sha256 !== receipt.receipt_sha256) fail('receipt-observation');
  for (const [path, digest] of [['Cargo.toml', refs.cargo.sha256], [rustName, refs.rust.sha256]]) {
    const artifact = receipt.artifacts?.find(row => row.relative_path === path);
    if (!artifact || artifact.sha256 !== digest || artifact.size_bytes !== sources.get(`${runtime}${path}`)?.length) fail(`artifact:${path}`);
  }
  if (receipt.artifacts?.length !== 2) fail('artifact-count');
  const candidate = values.candidateEvidence;
  if (candidate?.status !== 'tested-local-candidate-not-admitted' || candidate.authority_effect !== 'none' || candidate.can_satisfy_f5 !== false || candidate.neutral_set_eligible !== false ||
      !candidate.local_checks?.includes('v2 trusted boundary and direct kernel cases: 10/10, including blank request ID DENY with unique qualifying rows and matching candidate')) fail('candidate-ceiling-or-witness');
  if (!Array.isArray(candidate.predecessor_preserved) || !Array.isArray(candidate.selected_artifacts) ||
      candidate.predecessor_preserved.length !== 4 || candidate.selected_artifacts.length !== 11) fail('candidate-ref-set');
  for (const ref of [...candidate.predecessor_preserved, ...candidate.selected_artifacts]) {
    if (typeof ref.path !== 'string' || !/^[0-9a-f]{64}$/.test(ref.sha256) || sha(readSafe(ref.path)) !== ref.sha256)
      fail(`candidate-ref-drift:${ref.path}`);
  }
  const clean = { status: 'not-run' };
  if (regenerate) {
    // A fresh target; no write to the checked-in generated runtime.
    const scratch = mkdtempSync(join('/var/tmp', 'auth-v2-meaning-regeneration-'));
    const target = join(scratch, 'runtime');
    try {
      const generated = cli('instantiate', join(root, source), '--node', 'auth-command-boundary:admit-authorization-command', '--language', 'rust', '--target-root', target);
      if (generated.status !== 'pass' && generated.result !== 'pass' && generated.receipt?.receipt_sha256 !== receipt.receipt_sha256) fail('regeneration-result');
      for (const path of ['Cargo.toml', rustName, receiptName]) {
        const fresh = readFileSync(join(target, path));
        const original = readSafe(`${runtime}${path}`);
        if (!fresh.equals(original)) fail(`regeneration-drift:${path}`);
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
    clean.status = 'byte-identical-rust-cargo-receipt';
  }
  return {
    schema_version: 'auth-foundation.v2-meaning-source-trace/v1-candidate',
    meaning_ref: refs.meaning,
    historical_product_decision_ref: refs.productDecision,
    historical_sfol_decision_ref: refs.sfolDecision,
    selected_source_refs: refs,
    source_manifest_sha256: manifest.manifest_sha256,
    receipt_sha256: receipt.receipt_sha256,
    structural_alignment: 'exact-selected-typed-ast-only',
    ast_check: 'exact-selected-rules-aggregate-operation',
    prose_alignment_status: 'unresolved',
    typed_qualifier_inventory: {
      authentication: [
        'evidence_ref equals request.authentication_evidence_ref',
        'evidence_ref is nonempty',
        'trusted is true',
        'session_id is nonempty',
      ],
      route: [
        'route_id equals request.route_id',
        'route_id is nonempty',
        'complete is true',
        'scope_evidence_ref is nonempty',
        'required_permission.resource is nonempty',
        'required_permission.action is nonempty',
        'required_permission.scope is nonempty',
      ],
      additional_provenance_guard: 'request.request_id is nonempty',
      multiplicity: 'exactly_one counts list entries, including duplicate equal rows',
    },
    semantic_gaps: [
      { gap_id: 'AUTH-V2-MEANING-BLANK-REQUEST-ID', status: 'unresolved', typed_observation: 'nonempty request_id required; blank ID with otherwise unique qualifying rows and matching candidate returns DENY', owner_question: 'Must request_id be nonempty for READY under the normative business meaning?' },
      { gap_id: 'AUTH-V2-MEANING-QUALIFIER-DEFINITION', status: 'unresolved', typed_observation: 'typed exactly_one Rules use the full listed nonempty, trust and completeness qualifiers with list multiplicity', owner_question: 'Does qualifying in the draft mean precisely the full listed typed qualifier set, including duplicate list entries counting separately?' },
    ],
    cli_source_target_observation: 'pass',
    clean_regeneration: clean.status,
    historical_v1_counterexample: 'known-red-for-historical-v1-only-not-transferred',
    finite_v2_witnesses: 'separate-local-tests-including-blank-request-id-deny-only',
    domainspec_business_meaning_status: 'draft-not-accepted',
    all_context_preservation_proven: false,
    v4_formal_claim_emitted: false,
    neutral_tde_set_derived: false,
    can_satisfy_f5: false,
    runtime_guarantees_observed: false,
    authority_effect: 'none',
  };
}

export function makeAuthV2MeaningReport(sources) {
  const trace = buildAuthV2MeaningTrace(sources);
  return {
    schema_version: trace.schema_version,
    meaning_id: 'BusinessMeaning:auth-foundation.admit-authorization-command-boundary',
    meaning_sha256: trace.meaning_ref.sha256,
    historical_product_decision_sha256: trace.historical_product_decision_ref.sha256,
    historical_sfol_decision_sha256: trace.historical_sfol_decision_ref.sha256,
    selected_sha256: Object.fromEntries(Object.entries(trace.selected_source_refs).map(([key, ref]) => [key, ref.sha256])),
    source_manifest_sha256: trace.source_manifest_sha256,
    receipt_sha256: trace.receipt_sha256,
    structural_alignment: trace.structural_alignment,
    ast_check: trace.ast_check,
    prose_alignment_status: trace.prose_alignment_status,
    typed_qualifier_inventory: trace.typed_qualifier_inventory,
    semantic_gaps: trace.semantic_gaps,
    cli_source_target_observation: trace.cli_source_target_observation,
    clean_regeneration: trace.clean_regeneration,
    historical_v1_counterexample: trace.historical_v1_counterexample,
    finite_v2_witnesses: trace.finite_v2_witnesses,
    domainspec_business_meaning_status: trace.domainspec_business_meaning_status,
    all_context_preservation_proven: trace.all_context_preservation_proven,
    v4_formal_claim_emitted: trace.v4_formal_claim_emitted,
    neutral_tde_set_derived: trace.neutral_tde_set_derived,
    can_satisfy_f5: trace.can_satisfy_f5,
    runtime_guarantees_observed: trace.runtime_guarantees_observed,
    authority_effect: trace.authority_effect,
  };
}

export function verifyAuthV2MeaningReport(report, sources) {
  const expectedReport = makeAuthV2MeaningReport(sources);
  try { assert.deepStrictEqual(report, expectedReport); } catch { fail('held-report-tamper'); }
  return expectedReport;
}
