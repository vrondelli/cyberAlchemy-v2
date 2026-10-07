import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Versioned successor to the historical pre-resolved-wrapper V4b candidate.
// This is a source-spelled, selected-root graph check, not a Rust/effect proof.
const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const base = 'auth-foundation/implementation/';
const inventoryManifest = `${base}../formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/v4b-call-inventory/Cargo.toml`;
const toolchain = resolve(root, 'tools/toolchain/run');
const pin = {
  api: ['authorization-api/src/lib.rs', 'dc4cacf0ec46df0f8e99b417344ef27d1ff630d24f96ae68c4683f90a78890be'],
  service: ['authorization-service/src/lib.rs', '76277cc1456d0680f56040a7f1bbbf39944ea4afce5e3d97eb0c2157a0cc41e7'],
  authority: ['authorization-ready-authority/src/lib.rs', '32315608e0c8c08d5148e9411cdea5d22f8b69fa2554da8deec4eb2d46a2bff6'],
  decision: ['authorization-ready-decision/src/lib.rs', '7992addf5d7075868eccb70d5e43b689a08baf5f9fa81cac9904d1ca688e71ed'],
  admission: ['command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs', '7c19fdb91f4098d7f12cc0c05804dd50c852c69902125af0c3b2d55ba5e497f0'],
  policy: ['standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs', '13c696a8f17b4d6bff1529b2cb75d1780aca38f45277f8c454cf7ec024b7efe9'],
  tenant: ['tenant-bridge/src/main.rs', '91a52bec443c3ab1dc71b7ebe3302b3d58931c207288a396f40398146638a05a'],
  prototype: ['authentication-prototype/bridge/src/main.rs', '0e62668e0317086105ad55c0b864714ecd21598e68c827e85487ea6f1fbca6c1'],
  https: ['authentication-https/bridge/src/main.rs', '0e62668e0317086105ad55c0b864714ecd21598e68c827e85487ea6f1fbca6c1'],
};
const manifestPin = {
  api: ['authorization-api/Cargo.toml', '93ff177c0ebc94b55e4f16f5df30b37356a7aebbfca80411bc63e521b925d9d5'],
  service: ['authorization-service/Cargo.toml', 'e4c302660bcb444638df3f8e8216885be4a7ecafbcf17b34db4f79684f1756aa'],
  authority: ['authorization-ready-authority/Cargo.toml', 'dea6fccd57d313bab8775399aac3620358730bacf061adee733a90aefa7e5f8e'],
  decision: ['authorization-ready-decision/Cargo.toml', '55498f5fe4aa28b16552196011d4b712f97b9cd0a500a57bc25d147ba140a421'],
  admission: ['command-boundary-runtime-v2/Cargo.toml', 'febf45e7dc61a1ebec89c98cbce82cafe030610340d3cbc5311f91ce7db4ebfa'],
  policy: ['standard-runtime/Cargo.toml', '5c191b9f8b267ea8223573b8a1747390b90a615ac21b121c0012d863353807df'],
  tenant: ['tenant-bridge/Cargo.toml', '160148b4c75602a833c48044a7f95e287bb0e856c7d455db461ccea881cd085d'],
  prototype: ['authentication-prototype/bridge/Cargo.toml', 'a3d18c4bfc340a123c98e6992d2ac136a2e382442195d1bed3d6372030ad5844'],
  https: ['authentication-https/bridge/Cargo.toml', 'a3d18c4bfc340a123c98e6992d2ac136a2e382442195d1bed3d6372030ad5844'],
  state_model: ['authorization-state-model/Cargo.toml', 'a448c0c2d7856349137c7c54efcd7e88f65479dbd2d4eff1201bc66eea5c57e6'],
  state_reader: ['authorization-state-reader/Cargo.toml', '2c7192f5e9ab60cfffcb1a86e61d75c57cef687e9721104b25a48f51359f58d8'],
  metadata_reader: ['authorization-metadata-reader/Cargo.toml', '07cad038a0a0eb4bf3b91b74cfd9e438db10d55cc8a7219cda7ca892a8cd6fd1'],
  trusted_reader: ['trusted-input-reader/Cargo.toml', 'a73a6b0a8cfedfc00eb36bbf185bd38dab359658fb6031ff889ebf902879fa34'],
  trusted_runtime: ['trusted-input-runtime/Cargo.toml', '5f91b7019af4dfa1952b0f430f4e0f452bfce2a3cee7887061bc1303a5772187'],
};
const lockPin = {
  api: ['authorization-api/Cargo.lock', '83a45c11c7927710c56165c55ac64bbf26b0ebb18fd0f99409a7e433c2775904'],
  service: ['authorization-service/Cargo.lock', '6c7a9a84d24f6fef8e58f4dd216a3af70df4c6ca7a96b1e1e197dc6d6bf88fcf'],
  authority: ['authorization-ready-authority/Cargo.lock', '0014443a860c91bb32028f4ce729b6d45def56f981fd048d93bcdeb4efd2c573'],
  decision: ['authorization-ready-decision/Cargo.lock', 'ab3a24b61b32992745e4bf50eb6cce9aa658fc34fb7cfa8444d57c84c124ced5'],
  tenant: ['tenant-bridge/Cargo.lock', 'ebfd7b1c607a027fe27b7582427f259ece85ce657a416630ee347d978ce57228'],
  prototype: ['authentication-prototype/bridge/Cargo.lock', '4827b6961d947ba8b1eae6c358f6d6d1f5b17f26848db760fe0c48bbbd68938b'],
  https: ['authentication-https/bridge/Cargo.lock', '4827b6961d947ba8b1eae6c358f6d6d1f5b17f26848db760fe0c48bbbd68938b'],
};
const inventoryPin = {
  manifest: 'bae9cb5ec51ec461cb44413a0703879668ae963e0b1168e2c4c87963099f12c3',
  source: '58c5f742287f1408e79ef214f501d2f2bba1888a8b46c24dbf39aeb7f0545cfd',
};
const required = new Set([
  'auth-foundation-authorization-service', 'auth-foundation-authorization-ready-authority',
  'auth-foundation-authorization-ready-decision', 'auth-foundation-authorization-state-model',
  'auth-foundation-authorization-state-reader', 'auth-foundation-authorization-metadata-reader',
  'auth-foundation-trusted-input-reader',
  'auth-foundation-trusted-inputs-trusted-input-resolution-resolve-trusted-inputs',
  'auth-foundation-command-boundary-v2-auth-command-boundary-admit-authorization-command',
  'auth-foundation-operation-auth-exact-permission-authorize',
]);
const forbidden = new Set([
  'auth-foundation-runtime-adapter', 'auth-foundation-sqlite-provider',
  'auth-foundation-trusted-boundary', 'auth-foundation-trusted-boundary-v2',
  'auth-foundation-trusted-boundary-pre-resolved-v2-candidate',
  'auth-foundation-trusted-input-provider',
]);
const localManifests = new Map([
  ['auth-foundation-authorization-api', 'authorization-api/Cargo.toml'],
  ['auth-foundation-authorization-service', 'authorization-service/Cargo.toml'],
  ['auth-foundation-authorization-ready-authority', 'authorization-ready-authority/Cargo.toml'],
  ['auth-foundation-authorization-ready-decision', 'authorization-ready-decision/Cargo.toml'],
  ['auth-foundation-authorization-state-model', 'authorization-state-model/Cargo.toml'],
  ['auth-foundation-authorization-state-reader', 'authorization-state-reader/Cargo.toml'],
  ['auth-foundation-authorization-metadata-reader', 'authorization-metadata-reader/Cargo.toml'],
  ['auth-foundation-trusted-input-reader', 'trusted-input-reader/Cargo.toml'],
  ['auth-foundation-trusted-inputs-trusted-input-resolution-resolve-trusted-inputs', 'trusted-input-runtime/Cargo.toml'],
  ['auth-foundation-command-boundary-v2-auth-command-boundary-admit-authorization-command', 'command-boundary-runtime-v2/Cargo.toml'],
  ['auth-foundation-operation-auth-exact-permission-authorize', 'standard-runtime/Cargo.toml'],
  ['auth-tenant-bridge', 'tenant-bridge/Cargo.toml'],
  ['auth-prototype-bridge', null],
]);
const commonEdges = [
  'auth-foundation-authorization-ready-authority->auth-foundation-authorization-metadata-reader',
  'auth-foundation-authorization-ready-authority->auth-foundation-authorization-state-model',
  'auth-foundation-authorization-ready-authority->auth-foundation-authorization-state-reader',
  'auth-foundation-authorization-ready-authority->auth-foundation-command-boundary-v2-auth-command-boundary-admit-authorization-command',
  'auth-foundation-authorization-ready-authority->auth-foundation-trusted-input-reader',
  'auth-foundation-authorization-ready-decision->auth-foundation-authorization-ready-authority',
  'auth-foundation-authorization-ready-decision->auth-foundation-authorization-state-model',
  'auth-foundation-authorization-ready-decision->auth-foundation-operation-auth-exact-permission-authorize',
  'auth-foundation-authorization-service->auth-foundation-authorization-ready-authority',
  'auth-foundation-authorization-service->auth-foundation-authorization-ready-decision',
  'auth-foundation-authorization-service->auth-foundation-authorization-state-model',
  'auth-foundation-authorization-state-reader->auth-foundation-authorization-state-model',
  'auth-foundation-trusted-input-reader->auth-foundation-authorization-state-model',
  'auth-foundation-trusted-input-reader->auth-foundation-trusted-inputs-trusted-input-resolution-resolve-trusted-inputs',
];
const rootEdges = {
  'authorization-api/Cargo.toml': [
    'auth-foundation-authorization-api->auth-foundation-authorization-service',
    'auth-foundation-authorization-api->auth-foundation-authorization-state-model',
  ],
  'tenant-bridge/Cargo.toml': [
    'auth-tenant-bridge->auth-foundation-authorization-service',
    'auth-tenant-bridge->auth-foundation-authorization-state-model',
  ],
  'authentication-prototype/bridge/Cargo.toml': [
    'auth-prototype-bridge->auth-foundation-authorization-service',
    'auth-prototype-bridge->auth-foundation-authorization-state-model',
  ],
  'authentication-https/bridge/Cargo.toml': [
    'auth-prototype-bridge->auth-foundation-authorization-service',
    'auth-prototype-bridge->auth-foundation-authorization-state-model',
  ],
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw new Error(`AUTH_V4B_READY_SUCCESSOR:${code}`); };
const one = (rows, predicate, code) => {
  const selected = rows.filter(predicate);
  if (selected.length !== 1) fail(code);
  return selected[0];
};
const selector = (kind, name, self_type, trait = null) =>
  kind === 'free' ? { kind, name } : { kind, name, self_type, trait };

function readPinned(table) {
  return Object.fromEntries(Object.entries(table).map(([id, [path, expected]]) => {
    const bytes = readFileSync(resolve(root, base, path));
    if (sha(bytes) !== expected) fail(`source-drift:${id}:${path}`);
    return [id, bytes.toString('utf8')];
  }));
}

function inventory(source, selected) {
  const stdout = execFileSync(toolchain, [
    'cargo', 'run', '--quiet', '--locked', '--offline', '--manifest-path',
    resolve(root, inventoryManifest), '--', '--selector', JSON.stringify(selected),
  ], { cwd: root, input: source, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const value = JSON.parse(stdout);
  if (value.selector?.name !== selected.name || value.selected_parsed_call_nodes_exhaustive !== true ||
      value.implicit_operations_covered !== false || value.macro_token_trees_expanded !== false ||
      value.attributes_present !== 0) fail(`inventory-shape:${selected.name}`);
  return value;
}

function exactCall(ast, callee, expression, code) {
  return one(ast.sites, site => site.callee_syntax === callee &&
    (expression === null || site.expression_syntax === expression), code);
}

// Fixture-accessible shape checker. Production additionally pins all source bytes.
export function checkReadyShapes(source) {
  const apiBuilder = inventory(source.api, selector('free', 'authorization_runtime_from_database'));
  const apiEngine = inventory(source.api, selector('impl', 'authorize', 'SqliteAuthService < SystemDecisionClock >', 'AuthorizationEngine'));
  const apiRuntime = inventory(source.api, selector('impl', 'authorize', 'AuthorizationRuntime'));
  const servicePublic = inventory(source.service, selector('impl', 'authorize', 'SqliteAuthService < C >'));
  const serviceDetailed = inventory(source.service, selector('impl', 'authorize_detailed', 'SqliteAuthService < C >'));
  const serviceEpoch = inventory(source.service, selector('free', 'authorize_in_epoch'));
  const authority = inventory(source.authority, selector('free', 'with_ready_in_transaction'));
  const decision = inventory(source.decision, selector('free', 'authorize'));
  const admission = inventory(source.admission, selector('free', 'admit_authorization_command'));
  const policy = inventory(source.policy, selector('free', 'authorize'));
  const bridges = Object.fromEntries(['tenant', 'prototype', 'https'].map(id =>
    [id, inventory(source[id], selector('free', 'evaluate'))]));

  if (!source.api.includes('trait AuthorizationEngine: Send + \'static') ||
      source.api.includes('pub trait AuthorizationEngine') ||
      !source.api.includes('    fn from_engines(') || source.api.includes('    pub fn from_engines(')) fail('api-private-dispatch');
  exactCall(apiBuilder, 'SqliteAuthService :: open_with_epoch_allocator', null, 'api-concrete-builder');
  exactCall(apiEngine, 'SqliteAuthService :: authorize', 'SqliteAuthService :: authorize (self , request)', 'api-concrete-engine');
  const dispatch = exactCall(apiRuntime, 'authorize', 'engine . authorize (request)', 'api-runtime-dispatch');
  if (dispatch.closure_depth !== 2 ||
      apiRuntime.sites.filter(site => site.callee_syntax === 'authorize').length !== 1) fail('api-dynamic-dispatch-shape');
  exactCall(servicePublic, 'authorize_detailed', 'self . authorize_detailed (request)', 'service-public-delegate');
  exactCall(serviceDetailed, 'authorize_in_epoch', 'authorize_in_epoch (& epoch , request)', 'service-detailed-epoch');

  const issue = exactCall(serviceEpoch, 'with_ready_in_transaction', null, 'service-issuer');
  if (issue.pre_tail_statement !== 1 || issue.closure_depth !== 0 ||
      !issue.expression_syntax.startsWith('with_ready_in_transaction (epoch . transaction () , & request , epoch . evaluation_epoch_id , epoch . decision_time , | ready |')) fail('service-actual-epoch-request');
  const continuation = one(serviceEpoch.closure_nodes, item => item.parent_call_site_ordinal === issue.ordinal &&
    item.parent_argument_index === 4, 'service-ready-continuation');
  const policyCall = exactCall(serviceEpoch, 'authorize_ready_decision', 'authorize_ready_decision (ready)', 'service-ready-only-call');
  if (policyCall.closure_depth !== 1 || !continuation.nested_site_ordinals.includes(policyCall.ordinal) ||
      serviceEpoch.sites.some(site => /authorize_ready_decision|kernel :: authorize/.test(site.callee_syntax) && site.ordinal !== policyCall.ordinal)) fail('service-pre-gate-policy');
  if (continuation.body_top_level_statements?.join('|') !==
      'downstream_port_calls += 1 ;|authorize_ready_decision (ready)') fail('service-continuation-body');

  const gateCall = exactCall(authority, 'gate :: admit_authorization_command',
    'gate :: admit_authorization_command (& context)', 'authority-gate');
  const invoke = exactCall(authority, 'continuation', 'continuation (ready)', 'authority-continuation');
  if (gateCall.pre_tail_statement !== 9 || invoke.pre_tail_statement !== 17 ||
      authority.top_level_statements[9] !==
        'if gate :: admit_authorization_command (& context) != gate :: CommandBoundaryDecision :: Ready { return AdmissionOutcome :: Denied ; }' ||
      !authority.top_level_statements[16].startsWith('let ready = ReadyAuthorization { transaction , evaluation_epoch_id , decision_time , command ,') ||
      authority.top_level_statements[17] !== 'AdmissionOutcome :: Ready (continuation (ready))' ||
      authority.sites.some(site => /kernel :: authorize|authorize_ready_decision|continuation/.test(site.callee_syntax) && site.ordinal !== invoke.ordinal)) fail('authority-ready-dominance-shape');
  if (!source.authority.includes('pub struct ReadyAuthorization<') ||
      source.authority.includes('pub fn new(') || source.authority.includes('pub fn admit(') ||
      !source.authority.includes('transaction: &\'transaction Transaction<\'connection>')) fail('authority-token-constructor');
  if (!source.decision.includes("pub fn authorize(ready: ReadyAuthorization<'_, '_>)") ||
      decision.sites.filter(site => site.callee_syntax === 'kernel :: authorize').length !== 1 ||
      exactCall(decision, 'kernel :: authorize', 'kernel :: authorize (& context)', 'decision-policy') === null) fail('decision-ready-only');
  if (admission.sites.some(site => /kernel :: authorize|authorize_ready_decision/.test(site.callee_syntax)) ||
      policy.sites.some(site => /admit_authorization_command/.test(site.callee_syntax))) fail('kernel-role-confusion');

  for (const [id, ast] of Object.entries(bridges)) {
    const call = one(ast.sites, site => site.callee_syntax === 'authorize' &&
      site.receiver_syntax === 'service' && site.expression_syntax.startsWith('service . authorize (InboundAuthorizationRequest {'),
      `bridge-service-call:${id}`);
    if (ast.sites.some(site => /authorize/.test(site.callee_syntax) && site.ordinal !== call.ordinal)) fail(`bridge-extra-decision:${id}`);
  }
  return {
    selectors: ['api/builder', 'api/private-engine', 'api/runtime', 'service/public', 'service/detailed', 'service/epoch',
      'authority/issuer', 'decision/ready', 'admission/gate', 'policy/kernel',
      'tenant/evaluate', 'prototype/evaluate', 'https/evaluate'],
    source_spelled_edges: [
      'api builder -> concrete SqliteAuthService<SystemDecisionClock>',
      'private engine impl -> service authorize -> authorize_detailed -> authorize_in_epoch',
      'service actual epoch transaction/request -> with_ready_in_transaction',
      'authority complete rows -> exact candidate -> v2 gate',
      'gate READY -> private ReadyAuthorization -> continuation',
      'continuation -> ready decision -> generated policy',
      'three bridge evaluate roots -> selected service authorize',
    ],
    parsed_sites: Object.fromEntries([
      ['api_builder', apiBuilder], ['api_engine', apiEngine], ['api_runtime', apiRuntime],
      ['service_public', servicePublic], ['service_detailed', serviceDetailed],
      ['service_epoch', serviceEpoch], ['authority', authority], ['decision', decision],
      ['admission', admission], ['policy', policy],
      ...Object.entries(bridges).map(([id, ast]) => [`bridge_${id}`, ast]),
    ].map(([id, ast]) => [id, ast.sites.length])),
  };
}

function closure(manifest) {
  const metadata = JSON.parse(execFileSync(toolchain, [
    'cargo', 'metadata', '--locked', '--offline', '--format-version', '1',
    '--manifest-path', resolve(root, base, manifest),
  ], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
  const packages = new Map(metadata.packages.map(item => [item.id, item]));
  const nodes = new Map(metadata.resolve.nodes.map(item => [item.id, item]));
  const entry = [...packages.values()].filter(item => resolve(item.manifest_path) === resolve(root, base, manifest));
  if (entry.length !== 1) fail(`cargo-root:${manifest}`);
  const reached = new Set();
  const pending = [entry[0].id];
  while (pending.length) {
    const id = pending.pop();
    if (reached.has(id)) continue;
    reached.add(id);
    const node = nodes.get(id);
    if (!node) fail(`cargo-node:${id}`);
    pending.push(...node.deps.filter(dep => dep.dep_kinds.some(kind => kind.kind === null || kind.kind === 'normal')).map(dep => dep.pkg));
  }
  const pathPackages = [...reached].map(id => packages.get(id)).filter(item => item.source === null);
  if (pathPackages.some(item => !resolve(item.manifest_path).startsWith(`${resolve(root, base)}${sep}`))) {
    fail(`cargo-local-escape:${manifest}`);
  }
  const local = pathPackages;
  for (const item of local) {
    const expected = item.name === 'auth-prototype-bridge' ? manifest : localManifests.get(item.name);
    if (!expected || resolve(item.manifest_path) !== resolve(root, base, expected)) {
      fail(`cargo-local-identity:${manifest}:${item.name}`);
    }
  }
  const names = new Set(local.map(item => item.name));
  checkLocalClosureNames(manifest, [...names], local.length);
  const actualEdges = local.flatMap(item => (nodes.get(item.id)?.deps ?? [])
    .filter(dep => dep.dep_kinds.some(kind => kind.kind === null || kind.kind === 'normal'))
    .filter(dep => reached.has(dep.pkg) && packages.get(dep.pkg)?.manifest_path.startsWith(resolve(root, base)))
    .map(dep => `${item.name}->${packages.get(dep.pkg).name}`)).sort();
  checkLocalEdges(manifest, actualEdges);
  return { root: manifest, local_crates: [...names].sort(), local_edges: actualEdges,
    legacy_decision_crates_reachable: false };
}

export function checkLocalEdges(manifest, edges) {
  const extras = rootEdges[manifest];
  if (!extras) fail(`cargo-edge-root:${manifest}`);
  const expected = [...commonEdges, ...extras].sort();
  if (JSON.stringify([...edges].sort()) !== JSON.stringify(expected)) fail(`cargo-edge-set:${manifest}`);
  return true;
}

export function checkLocalClosureNames(manifest, names, count = names.length) {
  const expectedRoot = manifest === 'authorization-api/Cargo.toml' ?
    'auth-foundation-authorization-api' : manifest === 'tenant-bridge/Cargo.toml' ?
    'auth-tenant-bridge' :
      ['authentication-prototype/bridge/Cargo.toml', 'authentication-https/bridge/Cargo.toml'].includes(manifest) ?
        'auth-prototype-bridge' : fail(`cargo-root-name:${manifest}`);
  const actual = new Set(names);
  const expected = new Set([...required, expectedRoot]);
  for (const name of forbidden) if (actual.has(name)) fail(`cargo-forbidden:${manifest}:${name}`);
  if (actual.size !== count || actual.size !== expected.size ||
      [...expected].some(name => !actual.has(name))) fail(`cargo-closure-set:${manifest}`);
  return true;
}

export function evaluateCurrent() {
  const inventoryRoot = resolve(root, inventoryManifest);
  if (sha(readFileSync(inventoryRoot)) !== inventoryPin.manifest ||
      sha(readFileSync(resolve(dirname(inventoryRoot), 'src/main.rs'))) !== inventoryPin.source) fail('inventory-tool-drift');
  const source = readPinned(pin);
  readPinned(manifestPin);
  readPinned(lockPin);
  const graph = checkReadyShapes(source);
  const cargo = Object.fromEntries([
    ['api', 'authorization-api/Cargo.toml'], ['tenant', 'tenant-bridge/Cargo.toml'],
    ['prototype', 'authentication-prototype/bridge/Cargo.toml'],
    ['https', 'authentication-https/bridge/Cargo.toml'],
  ].map(([id, path]) => [id, closure(path)]));
  return {
    schema_version: 'auth-foundation.v4b-ready-successor/v2-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    selected_roots: ['authorization-api', 'tenant-bridge', 'authentication-prototype/bridge', 'authentication-https/bridge'],
    source_sha256: Object.fromEntries(Object.entries(pin).map(([id, [, hash]]) => [id, hash])),
    manifest_sha256: Object.fromEntries(Object.entries(manifestPin).map(([id, [, hash]]) => [id, hash])),
    lock_sha256: Object.fromEntries(Object.entries(lockPin).map(([id, [, hash]]) => [id, hash])),
    graph, cargo,
    open_edges: [
      'Rust trait-object dispatch, ownership and general typed def-use are source-spelled, not compiler-resolved',
      'caller reachability, control-flow dominance and callback/SQL/iterator/implicit effects are not closed',
      'bridge and API external effects, async worker continuation, panic and FFI are not modeled',
      'generated policy remains a public raw-context function inside the selected dependency closure',
      'finite controls do not prove every normal context or native endpoint call path',
    ],
    claim_limit: 'Current exact-byte selected sources, manifests, root lockfiles, syn-selected explicit call shapes, and locked offline normal Cargo local dependency closures for API and three bridges. Gate-before-continuation is source-spelled under pinned bodies. No transitive effect or all-path native-call proof, no FormalClaim admission, no runtime guarantee, and no deployment/security authority.',
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.stdout.write(`${JSON.stringify(evaluateCurrent(), null, 2)}\n`);
}
