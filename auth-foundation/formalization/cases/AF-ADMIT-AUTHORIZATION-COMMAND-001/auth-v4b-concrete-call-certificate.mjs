import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lexRust } from './auth-v2-rust-extract.mjs';
import { extractCurrentWrapper } from './auth-v2-wrapper-extract.mjs';

// Bounded C1/C3 slice. It checks a selected service call reached from a closed
// service-tail entry, fixed pre-resolved composition, and source-extracted
// wrapper IR. Public-entry reachability and the complete pre-boundary
// helper/effect closure are NOT established.
const sourcePath = fileURLToPath(new URL('../../../implementation/trusted-boundary-pre-resolved-v2-candidate/src/lib.rs', import.meta.url));
const cargoPath = fileURLToPath(new URL('../../../implementation/trusted-boundary-pre-resolved-v2-candidate/Cargo.toml', import.meta.url));
const wrapperSourcePath = fileURLToPath(new URL('../../../implementation/trusted-boundary-v2/src/lib.rs', import.meta.url));
const wrapperCargoPath = fileURLToPath(new URL('../../../implementation/trusted-boundary-v2/Cargo.toml', import.meta.url));
const kernelSourcePath = fileURLToPath(new URL('../../../implementation/command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs', import.meta.url));
const kernelCargoPath = fileURLToPath(new URL('../../../implementation/command-boundary-runtime-v2/Cargo.toml', import.meta.url));
const servicePath = fileURLToPath(new URL('../../../implementation/authorization-service/src/lib.rs', import.meta.url));
const serviceCargoPath = fileURLToPath(new URL('../../../implementation/authorization-service/Cargo.toml', import.meta.url));
const serviceCargoLockPath = fileURLToPath(new URL('../../../implementation/authorization-service/Cargo.lock', import.meta.url));
const metadataReaderPath = fileURLToPath(new URL('../../../implementation/authorization-metadata-reader/src/lib.rs', import.meta.url));
const metadataReaderCargoPath = fileURLToPath(new URL('../../../implementation/authorization-metadata-reader/Cargo.toml', import.meta.url));
const metadataReaderLockPath = fileURLToPath(new URL('../../../implementation/authorization-metadata-reader/Cargo.lock', import.meta.url));
const apiPath = fileURLToPath(new URL('../../../implementation/authorization-api/src/lib.rs', import.meta.url));
const apiCargoPath = fileURLToPath(new URL('../../../implementation/authorization-api/Cargo.toml', import.meta.url));
const trustedProviderPath = fileURLToPath(new URL('../../../implementation/trusted-input-reader/src/lib.rs', import.meta.url));
const trustedProviderCargoPath = fileURLToPath(new URL('../../../implementation/trusted-input-reader/Cargo.toml', import.meta.url));
const trustedProviderCargoLockPath = fileURLToPath(new URL('../../../implementation/trusted-input-reader/Cargo.lock', import.meta.url));
const trustedFacadePath = fileURLToPath(new URL('../../../implementation/trusted-input-provider/src/lib.rs', import.meta.url));
const trustedFacadeCargoPath = fileURLToPath(new URL('../../../implementation/trusted-input-provider/Cargo.toml', import.meta.url));
const trustedFacadeLockPath = fileURLToPath(new URL('../../../implementation/trusted-input-provider/Cargo.lock', import.meta.url));
const trustedRuntimePath = fileURLToPath(new URL('../../../implementation/trusted-input-runtime/src/domainspec/rust/trusted-input-resolution/resolve-trusted-inputs.rs', import.meta.url));
const trustedRuntimeCargoPath = fileURLToPath(new URL('../../../implementation/trusted-input-runtime/Cargo.toml', import.meta.url));
const sqliteProviderPath = fileURLToPath(new URL('../../../implementation/sqlite-provider/src/lib.rs', import.meta.url));
const sqliteProviderCargoPath = fileURLToPath(new URL('../../../implementation/sqlite-provider/Cargo.toml', import.meta.url));
const sqliteProviderCargoLockPath = fileURLToPath(new URL('../../../implementation/sqlite-provider/Cargo.lock', import.meta.url));
const stateReaderPath = fileURLToPath(new URL('../../../implementation/authorization-state-reader/src/lib.rs', import.meta.url));
const stateReaderCargoPath = fileURLToPath(new URL('../../../implementation/authorization-state-reader/Cargo.toml', import.meta.url));
const stateReaderLockPath = fileURLToPath(new URL('../../../implementation/authorization-state-reader/Cargo.lock', import.meta.url));
const stateModelPath = fileURLToPath(new URL('../../../implementation/authorization-state-model/src/lib.rs', import.meta.url));
const stateModelCargoPath = fileURLToPath(new URL('../../../implementation/authorization-state-model/Cargo.toml', import.meta.url));
const stateModelLockPath = fileURLToPath(new URL('../../../implementation/authorization-state-model/Cargo.lock', import.meta.url));
const runtimeAdapterPath = fileURLToPath(new URL('../../../implementation/runtime-adapter/src/lib.rs', import.meta.url));
const runtimeAdapterCargoPath = fileURLToPath(new URL('../../../implementation/runtime-adapter/Cargo.toml', import.meta.url));
const runtimeAdapterCargoLockPath = fileURLToPath(new URL('../../../implementation/runtime-adapter/Cargo.lock', import.meta.url));
const legacyBoundaryPath = fileURLToPath(new URL('../../../implementation/trusted-boundary/src/lib.rs', import.meta.url));
const callInventoryCargoPath = fileURLToPath(new URL('./v4b-call-inventory/Cargo.toml', import.meta.url));
const callInventoryLockPath = fileURLToPath(new URL('./v4b-call-inventory/Cargo.lock', import.meta.url));
const callInventorySourcePath = fileURLToPath(new URL('./v4b-call-inventory/src/main.rs', import.meta.url));
const toolchainPath = fileURLToPath(new URL('../../../../tools/toolchain/run', import.meta.url));
const sourcePin = '349b686453d237b8d6f6b56fd42ccbe316dc44a1c4aef9c08ed7ebd57142911d';
const wrapperPin = 'e068fd4dac134971b7f7e1e7e55cc455f721d75de2d3f17d327970d51c12e58d';
const wrapperCargoPin = '86b601c32d610f667fe5e52b306de5a0bbb97922dc86725e2ba243a188f86c93';
const kernelPin = '7c19fdb91f4098d7f12cc0c05804dd50c852c69902125af0c3b2d55ba5e497f0';
const kernelCargoPin = 'febf45e7dc61a1ebec89c98cbce82cafe030610340d3cbc5311f91ce7db4ebfa';
const cargoPin = '0d033e842ff7c8028db4172f95a927488ee11d92547ba9344cb0ac3f91ec5a89';
const servicePin = '9f6ebe804586dea16dd461dfa42ac0c46fcad02aa487a36fee2695c86943dea0';
const serviceCargoPin = 'f6b40c37de1ef1a973b312a9cfdfef8e98b7a06e22ceebc179e5d471d691c9f3';
const serviceCargoLockPin = '1c5fa8e2ca344a8f2da0f6798c3fab38b053f6d65ca00f5e602fde2ebc8af3df';
const metadataReaderPin = '9af901c7879febb5040ac0a7f1fe67380c278bde916a5a64436594dcac5acec7';
const metadataReaderCargoPin = '07cad038a0a0eb4bf3b91b74cfd9e438db10d55cc8a7219cda7ca892a8cd6fd1';
const metadataReaderLockPin = 'c38a775b888484e2781174a13abd01b4bd845ab51ca4762319024ac2ba4f9b18';
const apiPin = '79012161282a67980c53e84d9e9aff22248b04fe5f9776ba51626fafaefef0dd';
const apiCargoPin = '5107875e52c9789e6ac44c61e8dac07b1d4d4d587f7e6b8fa278dbf811020ad6';
const trustedProviderPin = '05ea5047e85ddccc228055d85218fd446e8093bddce81a0e2b19ce88a75dedc6';
const trustedProviderCargoPin = 'a73a6b0a8cfedfc00eb36bbf185bd38dab359658fb6031ff889ebf902879fa34';
const trustedProviderCargoLockPin = 'd2bd266aa53220fc90b6cd274ea7b0355e0c2c4e93da7c7a4ab98f74550419d1';
const trustedFacadePin = '753e22775190e629199865f74e9b63309a8dd2518d0efa2979f734f3f683ff30';
const trustedFacadeCargoPin = 'dc7455df3c5402bef8daa5e92330b8b8c35341661bffa31761175b2d7fdba149';
const trustedFacadeLockPin = 'c9ae2385939f4f6c92ed693332b1aa4e210caf66f0840195489c59b90a54b79d';
const trustedRuntimePin = '3e284dc211c6b940cad909cda3ed8a477bb8899ae10b6bea1cd10cef043c8905';
const trustedRuntimeCargoPin = '5f91b7019af4dfa1952b0f430f4e0f452bfce2a3cee7887061bc1303a5772187';
const sqliteProviderPin = '045e3335d4dc302fd79d3bdd2903f283b34c7afbd280be671b83d83abf6765bd';
const sqliteProviderCargoPin = '94aafbb680f8e50547debc660ebe8048d54da0f552916d6f2916f8299567f230';
const sqliteProviderCargoLockPin = '73f014e4eea6467901b56d83dee1b33dc78eb0026c92ed878d82723ff627b6a9';
const stateReaderPin = 'cd0ad95c035b0432399d2f4f9b9410f3b1658c89dd98aecb8f132abcda223c9d';
const stateReaderCargoPin = '2c7192f5e9ab60cfffcb1a86e61d75c57cef687e9721104b25a48f51359f58d8';
const stateReaderLockPin = '54b248968f7ca2d5578b05c5775fe3990420fbc209936e2191373f5ef0ecd4c5';
const stateModelPin = 'c940dd9b7aeafdbc53858e0dbda4531ef9197672cef5ad00f3296ac3d734ca00';
const stateModelCargoPin = 'a448c0c2d7856349137c7c54efcd7e88f65479dbd2d4eff1201bc66eea5c57e6';
const stateModelLockPin = '9cdb9e3f30f2daef0dd828a7b3329e40d002fcdb1a61aa1ba11c07d3d6d47de0';
const runtimeAdapterPin = '8f447d2a6b9e38f98a6ef719bd0a2aba37e02fd0d3356736305baf58f8bad310';
const runtimeAdapterCargoPin = '9bb6c69048a942a59f72ee2fce955b0c3617380087411bd5e7814bbab68892e0';
const runtimeAdapterCargoLockPin = '5e3a43f48f29742578f0324426fd791ee93cd9d230cdc3deb6dc68f964f1362d';
const legacyBoundaryPin = '8d10fe9d1c93a142bbe4126a05a8fce85bcede002b1c5250bb69372b342c689d';
const callInventoryCargoPin = 'bae9cb5ec51ec461cb44413a0703879668ae963e0b1168e2c4c87963099f12c3';
const callInventoryLockPin = '5442169c712b9c41ad3f46af39ea96be3eb64ece05dc9891250e13f61e4073cf';
const callInventorySourcePin = '58c5f742287f1408e79ef214f501d2f2bba1888a8b46c24dbf39aeb7f0545cfd';
// Exact JSON projection of the four selected syn inventories under the pinned
// reader and source modules; composition must not accept substituted rows.
const boundaryNodesPin = '5fa0e4bcf4f1977c75a831f007734538baa2cc1d34eaaaf79f36af7ace7e2889';
// Complete extracted projections, not just their source hashes or selected edges.
// Fixture worklists may vary these inputs, but production composition may not.
const publicSpinePin = '069d6ab4bc8df8158e40c2d08c55e3a2506fef7bedd678c0ec6fe27ce875b5c2';
const selectedManifestPin = 'cae1ca9b0a898797db6cf9a405a56a6e83f5680f1b82cfaa4260e0e80d7faa71';
const rootedFrontierPin = 'cb66c87c1a699d2e4ce0cfc57fe12232096e05325593c45a44d56577bf778764';
const selectedClosureInventoriesPin = '09fd1b1e0e99faccb987abda54dbc7f8f50088d95dc1d6a091e87ebc8f7226b6';
const preResultEffectInventoryPin = '69bb4a78ead687693df580504b402523b560ea2d66ebc2fec8ed26d4f731afaf';
const reachedClosureParentRelationsPin = '848920999c4cebd64444db4459c1adc91de5d124952e08ffb64f863ae469210d';
const selectedClosureCatalogQueryMapPin = '7fe81284beeea704fb45e12f938a4fbefea684721c2ae4ad8ad3f82c7a1300ae';
const selectedSqlIteratorConsumerBridgePin = 'b9cc90f32deac3a1ab22fc3dac7d48dc0def6a36c536c86854d5967ec3d4077c';
const rusqliteArchivePin = '23f2a97da3e3873c73cb2a2e71b35c40ff95e0b1eefa8d72d8499a6928c3b5b3';
const rusqliteStatementPin = 'cc53dcc82755d97a48f2fa3b33d4d65c0f06fa45af0896441100e2467bfcc478';
const rusqliteRowPin = 'ca0d543ee7004db58d365bdf45708aa59d9c81ef20e20b4da40ab3eea6aaa492';
const rustcVersionPin = 'rustc 1.98.1 (48a229cea 2026-09-01)';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = reason => { throw new Error(`AUTH_V4B_COMPOSITION:${reason}`); };
const values = source => lexRust(source).map(token => token.value);
const sameValues = (left, right) => JSON.stringify(values(left)) === JSON.stringify(values(right));
const same = (actual, expected, reason) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) fail(reason);
};

// This is a source-level ownership and dependency check, not a type-resolution
// proof. It prevents the selected path from silently reintroducing the legacy
// boundary after the request record moved to the kernel-free shared model.
export function selectedSharedRequestOwnership(model, runtime, legacy, v2, service, serviceCargo, api, apiCargo) {
  for (const value of [model, runtime, legacy, v2, service, serviceCargo, api, apiCargo]) {
    assert.equal(typeof value, 'string');
  }
  if (occurrences(model, 'pub struct InboundAuthorizationRequest {') !== 1 ||
      !model.includes('pub request_id: String,') ||
      !model.includes('pub authentication_evidence_ref: String,') ||
      !model.includes('pub route_id: String,') ||
      !runtime.includes('AuthorizationCommand, BinaryAuthorizationDecision, InboundAuthorizationRequest, Permission,') ||
      !legacy.includes('AuthorizationCommand, BinaryAuthorizationDecision, InboundAuthorizationRequest, Permission,') ||
      !v2.includes('AuthorizationCommand, BinaryAuthorizationDecision, InboundAuthorizationRequest, Permission,') ||
      [runtime, legacy, v2].some(source => source.includes('pub struct InboundAuthorizationRequest {')) ||
      !service.includes('AuthorizationCommand, BinaryAuthorizationDecision, DecisionClock, InboundAuthorizationRequest,') ||
      !api.includes('BinaryAuthorizationDecision, DecisionClock, InboundAuthorizationRequest, PortFailure,') ||
      /auth-foundation-(?:sqlite-provider|trusted-boundary|trusted-input-provider)\s*=/.test(serviceCargo) ||
      /auth-foundation-trusted-boundary\s*=/.test(apiCargo)) fail('shared-request-ownership');
  return {
    request_owner: 'authorization-state-model',
    legacy_and_v2_reexport: true,
    selected_service_and_api_legacy_boundary_dependency: false,
    claim_limit: 'Source-spelled ownership and direct Cargo dependency isolation only; no compiler target resolution, transitive closure, or runtime guarantee.',
  };
}

function selectedBody(source, marker, from = 0) {
  const start = source.indexOf(marker, from);
  if (start < 0 || source.indexOf(marker, start + marker.length) >= 0) fail('function-identity');
  const open = source.indexOf('{', start);
  if (open < 0) fail('missing-body');
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) {
      return { open, close: i, body: source.slice(open + 1, i) };
    }
  }
  fail('unclosed-body');
}

const normalBody = [
  'TrustedAuthorizationBoundary', '::', 'new', '(',
  'ResolvedAuthentication', '(', 'authentication_evidence', ')', ',',
  'ResolvedRoutes', '(', 'route_bindings', ')', ',',
  'BorrowedDecision', '(', 'downstream', ')', ',', ')',
  '.', 'authorize', '(', 'request', ')',
];

function masked(source, selected) {
  let result = source;
  for (const span of [...selected].sort((left, right) => right.open - left.open)) {
    result = `${result.slice(0, span.open + 1)}<selected-body>${result.slice(span.close)}`;
  }
  return result;
}

export function extractPreResolved(source, cargo, { fixture = false } = {}) {
  assert.equal(typeof source, 'string');
  assert.equal(typeof cargo, 'string');
  if (digest(cargo) !== cargoPin) fail('cargo-pin');
  const baseline = readFileSync(sourcePath, 'utf8');
  if (!fixture && digest(source) !== sourcePin) fail('source-pin');
  const selected = selectedBody(source, 'pub fn authorize_pre_resolved<');
  const original = selectedBody(baseline, 'pub fn authorize_pre_resolved<');
  const borrowedImpl = source.indexOf('impl<D: AuthorizationDecisionService> AuthorizationDecisionService for BorrowedDecision');
  if (borrowedImpl < 0) fail('borrowed-implementation');
  const borrowed = selectedBody(source, 'fn authorize(', borrowedImpl);
  const originalBorrowedImpl = baseline.indexOf('impl<D: AuthorizationDecisionService> AuthorizationDecisionService for BorrowedDecision');
  const originalBorrowed = selectedBody(baseline, 'fn authorize(', originalBorrowedImpl);
  if (masked(source, [selected, borrowed]) !== masked(baseline, [original, originalBorrowed])) fail('outside-selected-body');
  same(values(selected.body), normalBody, 'pre-resolved-call-shape');
  same(values(borrowed.body), ['self', '.', '0', '.', 'authorize', '(', 'command', ')'], 'borrowed-forwarding');
  return {
    source_sha256: digest(source), cargo_sha256: digest(cargo),
    resolver_behavior: 'pinned-source-only-not-effect-extracted',
    receiver_path: ['TrustedAuthorizationBoundary::authorize(request)', 'BorrowedDecision(downstream)::authorize(command)', 'self.0.authorize(command)'],
    extra_pre_kernel_calls: 0,
  };
}

function selectedServiceCall(body) {
  const marker = 'let decision = authorize_pre_resolved(';
  const start = body.indexOf(marker);
  if (start < 0 || body.indexOf(marker, start + marker.length) >= 0) fail('service-call-identity');
  const end = body.indexOf('\n    );', start);
  if (end < 0) fail('service-call-end');
  return body.slice(start, end + '\n    );'.length);
}

function selectedServiceTail(body) {
  const tokens = lexRust(body);
  const opening = { '(': ')', '[': ']', '{': '}' };
  const stack = [];
  let start = -1;
  let end = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].value;
    if (stack.length === 0 && token === 'let' && tokens[i + 1]?.value === 'routes') {
      if (start >= 0) fail('service-tail-entry-ambiguous');
      start = i;
    }
    if (opening[token]) stack.push(opening[token]);
    else if (token === ')' || token === ']' || token === '}') {
      if (stack.pop() !== token) fail('service-tail-delimiter');
    }
    if (start >= 0 && end < 0 && token === ';' && stack.length === 0) end = i;
  }
  if (stack.length) fail('service-tail-delimiter');
  if (start < 0 || end < 0) fail('service-tail-entry');
  const routeStatement = tokens.slice(start, end + 1).map(token => token.value);
  if (JSON.stringify(routeStatement.slice(0, 4)) !== JSON.stringify(['let', 'routes', '=', 'snapshot']) ||
      JSON.stringify(routeStatement.slice(-5)) !== JSON.stringify(['.', 'collect', '(', ')', ';'])) fail('service-tail-routes-shape');
  return { prefix: body.slice(0, tokens[start].start), routeStatement, tail: body.slice(tokens[end].end) };
}

const preTailCallSites = [
  ['trusted-input-reader', 'resolve_in_transaction('],
  ['authentication-metadata-read', 'authentication_metadata('],
  ['route-revision-read', 'route_revision('],
  ['injected-hook', 'after_trusted_input('],
  ['authorization-state-provider', 'resolve_authorization_state_in_transaction('],
  ['state-join-check', 'authorization_state_joins_hold('],
];

function readPreTailInventory(prefix) {
  const selected_named_call_sites = preTailCallSites.map(([id, spelling]) => {
    const count = prefix.split(spelling).length - 1;
    if (count !== 1) fail(`pre-tail-call-site-${id}`);
    return { id, spelling, occurrence_count: count };
  });
  return {
    scope: 'selected-in-epoch-body-before-routes-tail',
    syntax_binding: 'complete-lexed-prefix-equality-to-pinned-source',
    marker_method: 'raw-substring-count-after-complete-lexed-prefix-binding',
    exhaustive: false,
    selected_named_call_sites,
    closure: 'open',
    unresolved_leaves: [
      'local-helper-and-inline-closure-callees',
      'provider-and-snapshot-callees',
      'injected-hook-effect-flow',
      'sqlite-and-standard-library-effects',
      'trait-dispatch-and-endpoint-set',
    ],
  };
}

function decisionNamedSite(site) {
  if (site.kind !== 'function' && site.kind !== 'method') return false;
  const tail = site.callee_syntax.replace(/\s+/g, '').split('::').at(-1);
  return tail === 'authorize' || tail.startsWith('authorize_') || tail === 'admit_authorization_command';
}

function runAstInventory(source, selector = null) {
  assert.equal(typeof source, 'string');
  if (digest(readFileSync(callInventoryCargoPath)) !== callInventoryCargoPin ||
      digest(readFileSync(callInventoryLockPath)) !== callInventoryLockPin ||
      digest(readFileSync(callInventorySourcePath)) !== callInventorySourcePin) fail('ast-reader-pin');
  let inventory;
  try {
    inventory = JSON.parse(execFileSync(toolchainPath, [
      'cargo', 'run', '--offline', '--locked', '--quiet', '--manifest-path', callInventoryCargoPath,
      ...(selector === null ? [] : ['--', '--selector', JSON.stringify(selector)]),
    ], { input: source, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 }));
  } catch (error) {
    fail(`ast-reader-execution:${error.status ?? error.message}`);
  }
  if (inventory.schema_version !== 'auth-foundation.v4b-explicit-call-inventory/v1-candidate' ||
      inventory.function !== (selector?.name ?? 'authorize_in_epoch') ||
      inventory.selected_parsed_call_nodes_exhaustive !== true ||
      inventory.transitive_effect_closure !== false ||
      inventory.implicit_operations_covered !== false ||
      inventory.macro_token_trees_expanded !== false ||
      !Number.isInteger(inventory.attributes_present) ||
      !Array.isArray(inventory.sites) ||
      !Array.isArray(inventory.closure_nodes) ||
      !Array.isArray(inventory.local_bindings) ||
      !Array.isArray(inventory.struct_initializers) ||
      !Array.isArray(inventory.top_level_statements) ||
      (selector !== null && !Array.isArray(inventory.parameters)) ||
      (selector === null && (!Array.isArray(inventory.tail_top_level_statements) ||
        inventory.tail_top_level_statements.length < 2))) fail('ast-reader-result');
  return inventory;
}

function runAstConsumerChain(source, selector) {
  assert.equal(typeof source, 'string');
  if (digest(readFileSync(callInventoryCargoPath)) !== callInventoryCargoPin ||
      digest(readFileSync(callInventoryLockPath)) !== callInventoryLockPin ||
      digest(readFileSync(callInventorySourcePath)) !== callInventorySourcePin) fail('consumer-reader-pin');
  let result;
  try {
    result = JSON.parse(execFileSync(toolchainPath, [
      'cargo', 'run', '--offline', '--locked', '--quiet', '--manifest-path', callInventoryCargoPath,
      '--', '--consumer-chain', '--selector', JSON.stringify(selector),
    ], { input: source, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 }));
  } catch (error) {
    fail(`consumer-reader-execution:${error.status ?? error.message}`);
  }
  if (result.schema_version !== 'auth-foundation.v4b-query-map-consumer-chain/v1-candidate' ||
      result.function !== selector.name ||
      Object.keys(result.selector ?? {}).length !== Object.keys(selector).length ||
      Object.entries(selector).some(([key, value]) => result.selector[key] !== value) ||
      !Array.isArray(result.chains)) fail('consumer-reader-result');
  return result;
}

export function extractAstPreTailInventory(source) {
  return runAstInventory(source);
}

export function extractSelectedProviderRoots(trustedSource, trustedCargo, sqliteSource, sqliteCargo, { fixture = false } = {}) {
  for (const input of [trustedSource, trustedCargo, sqliteSource, sqliteCargo]) assert.equal(typeof input, 'string');
  if (digest(trustedCargo) !== trustedProviderCargoPin || digest(sqliteCargo) !== stateReaderCargoPin ||
      digest(readFileSync(trustedProviderCargoLockPath)) !== trustedProviderCargoLockPin ||
      digest(readFileSync(stateReaderLockPath)) !== stateReaderLockPin) fail('provider-root-cargo-pin');
  if (!fixture && (digest(trustedSource) !== trustedProviderPin || digest(sqliteSource) !== stateReaderPin)) fail('provider-root-source-pin');
  const selector = name => ({ kind: 'free', name });
  const trusted = runAstInventory(trustedSource, selector('resolve_in_transaction'));
  const sqlite = runAstInventory(sqliteSource, selector('resolve_authorization_state_in_transaction'));
  const nativeDecisionSites = [
    ...trusted.sites.filter(decisionNamedSite).map(site => ({ ...site, root: 'trusted' })),
    ...sqlite.sites.filter(decisionNamedSite).map(site => ({ ...site, root: 'sqlite' })),
  ];
  return {
    trusted_source_sha256: digest(trustedSource),
    sqlite_source_sha256: digest(sqliteSource),
    sqlite_source_role: 'read-only-authorization-state-reader',
    roots: { trusted, sqlite },
    selected_root_potential_decision_named_sites: nativeDecisionSites,
    alias_and_dynamic_target_resolution: 'open',
    transitive_closure: 'open',
  };
}

export function extractSelectedTrustedProviderGraph(trustedSource, trustedCargo, generatedSource, generatedCargo, { fixture = false } = {}) {
  for (const input of [trustedSource, trustedCargo, generatedSource, generatedCargo]) assert.equal(typeof input, 'string');
  if (digest(trustedCargo) !== trustedProviderCargoPin || digest(generatedCargo) !== trustedRuntimeCargoPin ||
      digest(readFileSync(trustedProviderCargoLockPath)) !== trustedProviderCargoLockPin ||
      !generatedCargo.includes('path = "src/domainspec/rust/trusted-input-resolution/resolve-trusted-inputs.rs"')) fail('trusted-graph-cargo-pin');
  if (!trustedCargo.includes('auth-foundation-authorization-state-model = { path = "../authorization-state-model" }') ||
      !trustedCargo.includes('auth-foundation-trusted-input-runtime = { package = "auth-foundation-trusted-inputs-trusted-input-resolution-resolve-trusted-inputs", path = "../trusted-input-runtime" }') ||
      /auth-foundation-(?:runtime-adapter|trusted-boundary|sqlite-provider|trusted-input-provider)\s*=/.test(trustedCargo)) {
    fail('trusted-reader-dependency-isolation');
  }
  if (!fixture && (digest(trustedSource) !== trustedProviderPin || digest(generatedSource) !== trustedRuntimePin)) fail('trusted-graph-source-pin');
  const nodes = {
    resolve: runAstInventory(trustedSource, { kind: 'free', name: 'resolve_in_transaction' }),
    authentication_rows: runAstInventory(trustedSource, { kind: 'free', name: 'logical_authentication_evidence_in_transaction' }),
    route_rows: runAstInventory(trustedSource, { kind: 'free', name: 'logical_route_bindings_in_transaction' }),
    to_u64: runAstInventory(trustedSource, { kind: 'free', name: 'to_u64' }),
    generated_resolve: runAstInventory(generatedSource, { kind: 'free', name: 'resolve_trusted_inputs' }),
    generated_query_valid: runAstInventory(generatedSource, { kind: 'free', name: 'trusted_input_query_valid' }),
  };
  const bindings = [
    ['resolve', 'authentication_rows', 'logical_authentication_evidence_in_transaction'],
    ['resolve', 'route_rows', 'logical_route_bindings_in_transaction'],
    ['resolve', 'generated_resolve', 'resolve_trusted_inputs'],
    ['authentication_rows', 'to_u64', 'to_u64'],
    ['route_rows', 'to_u64', 'to_u64'],
    ['generated_resolve', 'generated_query_valid', 'trusted_input_query_valid'],
  ];
  const edges = bindings.map(([from, to, callee]) => {
    const site_ordinals = nodes[from].sites.filter(site => site.kind === 'function' && site.callee_syntax === callee).map(site => site.ordinal);
    if (site_ordinals.length === 0) fail(`trusted-graph-missing-edge-${from}-${to}`);
    return { from, to, site_ordinals, site_kind: 'function', callee_syntax: callee, receiver_syntax: null };
  });
  const endpointSites = Object.entries(nodes).flatMap(([node, inventory]) => inventory.sites
    .filter(decisionNamedSite)
    .map(site => ({ node, ordinal: site.ordinal, callee_syntax: site.callee_syntax })));
  return {
    trusted_source_sha256: digest(trustedSource),
    generated_source_sha256: digest(generatedSource),
    nodes,
    edges,
    potential_decision_sites: endpointSites,
    external_and_implicit_effect_closure: 'open',
    source_edge_scope: 'six-named-edge-presence-bindings-not-exhaustive-flow',
    edge_argument_and_extra_edge_closure: 'open',
  };
}

export function extractSelectedSqliteProviderGraph(sqliteSource, sqliteCargo, runtimeSource, runtimeCargo, { fixture = false } = {}) {
  for (const input of [sqliteSource, sqliteCargo, runtimeSource, runtimeCargo]) assert.equal(typeof input, 'string');
  if (digest(sqliteCargo) !== stateReaderCargoPin || digest(runtimeCargo) !== stateModelCargoPin ||
      digest(readFileSync(stateReaderLockPath)) !== stateReaderLockPin ||
      digest(readFileSync(stateModelLockPath)) !== stateModelLockPin) fail('sqlite-graph-cargo-pin');
  if (!fixture && (digest(sqliteSource) !== stateReaderPin || digest(runtimeSource) !== stateModelPin)) fail('sqlite-graph-source-pin');
  for (const name of ['resolve_sessions', 'resolve_active_roles', 'verify_scope_evidence']) {
    if (sqliteSource.split(`fn ${name}(`).length !== 2) fail(`sqlite-graph-ambiguous-inherent-method-${name}`);
  }
  const free = name => ({ kind: 'free', name });
  const selectedImpl = name => ({ kind: 'impl', name, trait: null, self_type: "SqliteSnapshot < '_ , '_ >" });
  const nodes = {
    resolve: runAstInventory(sqliteSource, free('resolve_authorization_state_in_transaction')),
    sessions: runAstInventory(sqliteSource, selectedImpl('resolve_sessions')),
    roles: runAstInventory(sqliteSource, selectedImpl('resolve_active_roles')),
    revision: runAstInventory(sqliteSource, selectedImpl('current_authorization_revision')),
    scope: runAstInventory(sqliteSource, selectedImpl('verify_scope_evidence')),
    relation_revisions: runAstInventory(sqliteSource, free('relation_revisions_are_current')),
    active_role_ids: runAstInventory(sqliteSource, free('active_role_ids')),
    role_permissions: runAstInventory(sqliteSource, free('role_permissions')),
    parse_status: runAstInventory(sqliteSource, free('parse_status')),
    status_text: runAstInventory(sqliteSource, free('status_text')),
    to_u64: runAstInventory(sqliteSource, free('to_u64')),
    to_i64: runAstInventory(sqliteSource, free('to_i64')),
    state_new: runAstInventory(runtimeSource, { kind: 'impl', name: 'new', trait: null, self_type: 'ResolvedAuthorizationState' }),
  };
  const bindings = [
    ['resolve', 'sessions', 'method', 'resolve_sessions', 'provider'],
    ['resolve', 'roles', 'method', 'resolve_active_roles', 'provider'],
    ['resolve', 'revision', 'method', 'current_authorization_revision', 'provider'],
    ['resolve', 'scope', 'method', 'verify_scope_evidence', 'provider'],
    ['resolve', 'relation_revisions', 'function', 'relation_revisions_are_current', null],
    ['resolve', 'state_new', 'function', 'ResolvedAuthorizationState :: new', null],
    ['sessions', 'active_role_ids', 'function', 'active_role_ids', null],
    ['sessions', 'parse_status', 'function', 'parse_status', null],
    ['sessions', 'to_u64', 'function', 'to_u64', null],
    ['roles', 'status_text', 'function', 'status_text', null],
    ['roles', 'to_i64', 'function', 'to_i64', null],
    ['roles', 'active_role_ids', 'function', 'active_role_ids', null],
    ['roles', 'role_permissions', 'function', 'role_permissions', null],
    ['revision', 'to_u64', 'function', 'to_u64', null],
    ['relation_revisions', 'to_i64', 'function', 'to_i64', null],
  ];
  const edges = bindings.map(([from, to, kind, callee, receiver]) => {
    const site_ordinals = nodes[from].sites.filter(site => site.kind === kind && site.callee_syntax === callee &&
      site.receiver_syntax === receiver).map(site => site.ordinal);
    if (site_ordinals.length === 0) fail(`sqlite-graph-missing-edge-${from}-${to}`);
    return { from, to, site_ordinals, site_kind: kind, callee_syntax: callee, receiver_syntax: receiver };
  });
  const bound = new Set(edges.flatMap(edge => edge.site_ordinals.map(ordinal => `${edge.from}:${ordinal}`)));
  const unboundExplicitSites = Object.entries(nodes).flatMap(([node, inventory]) => inventory.sites
    .filter(site => !bound.has(`${node}:${site.ordinal}`))
    .map(site => ({ node, ordinal: site.ordinal, kind: site.kind, callee_syntax: site.callee_syntax })));
  const decisionSites = Object.entries(nodes).flatMap(([node, inventory]) => inventory.sites
    .filter(decisionNamedSite)
    .map(site => ({ node, ordinal: site.ordinal, callee_syntax: site.callee_syntax })));
  const constructorExpressions = [
    ['sessions', 'method', 'resolve_sessions', 'provider . resolve_sessions (& command . session_id)'],
    ['roles', 'method', 'resolve_active_roles', 'provider . resolve_active_roles (matching_sessions [0])'],
    ['current_authorization_revision', 'method', 'current_authorization_revision', 'provider . current_authorization_revision (& command . session_id)'],
    ['trusted_scope_evidence', 'method', 'verify_scope_evidence', 'provider . verify_scope_evidence (command)'],
    ['state_new', 'function', 'ResolvedAuthorizationState :: new',
      'ResolvedAuthorizationState :: new (sessions , roles , trusted_scope_evidence , current_authorization_revision , revision_complete ,)'],
  ];
  const constructorSites = constructorExpressions.map(([field, kind, callee, expression]) => {
    const sites = nodes.resolve.sites.filter(site => site.kind === kind && site.callee_syntax === callee &&
      site.expression_syntax === expression);
    if (sites.length !== 1) fail(`sqlite-constructor-expression-${field}`);
    return { field, ordinal: sites[0].ordinal, expression_syntax: expression };
  });
  const currentResolver = selectedBody(sqliteSource, 'pub fn resolve_authorization_state_in_transaction<');
  const pinnedResolver = selectedBody(readFileSync(stateReaderPath, 'utf8'), 'pub fn resolve_authorization_state_in_transaction<');
  same(currentResolver.body, pinnedResolver.body, 'sqlite-constructor-resolver-body');
  const constructorMarker = 'pub fn new(\n        sessions: Vec<SessionRecord>';
  const currentConstructor = selectedBody(runtimeSource, constructorMarker);
  const pinnedConstructorSource = readFileSync(stateModelPath, 'utf8');
  const pinnedConstructor = selectedBody(pinnedConstructorSource, constructorMarker);
  same(values(runtimeSource.slice(runtimeSource.indexOf(constructorMarker), currentConstructor.open)),
    values(pinnedConstructorSource.slice(pinnedConstructorSource.indexOf(constructorMarker), pinnedConstructor.open)),
    'sqlite-constructor-signature');
  same(values(currentConstructor.body), values(pinnedConstructor.body), 'sqlite-constructor-fields');
  return {
    sqlite_source_sha256: digest(sqliteSource), state_model_source_sha256: digest(runtimeSource),
    sqlite_source_role: 'read-only-authorization-state-reader',
    nodes, edges, unbound_explicit_sites: unboundExplicitSites,
    potential_decision_named_sites: decisionSites,
    source_edge_scope: 'fifteen-named-edge-presence-bindings-across-state-reader-and-model-not-exhaustive-runtime-flow',
    constructor_mapping: {
      selected_expressions: constructorSites,
      argument_order: ['sessions', 'roles', 'trusted_scope_evidence', 'current_authorization_revision', 'revision_complete'],
      model_parameters: ['sessions', 'roles', 'trusted_scope_evidence', 'current_authorization_revision', 'complete'],
      conditional_origins: ['roles: unique matching session or incomplete fallback',
        'revision_complete: unique matching session, equal revision and current relation revisions or false'],
      binding: 'exact-spelled-inherent-reader-calls-and-whole-selected-resolver-body-bytes-to-pinned-state-reader-with-lexed-model-constructor-signature-and-body',
      generic_dataflow_and_trait_dispatch: 'open',
    },
    method_dispatch_resolution: 'selected-calls-use-inherent-SqliteSnapshot-methods-in-read-only-state-reader; compiler-check-external-to-reader; other-targets-open',
    external_macro_implicit_effect_closure: 'open',
    service_join_snapshot_accessors: 'outside-this-slice',
  };
}

export function extractSelectedServiceJoinGraph(serviceSource, serviceCargo, sqliteSource, sqliteCargo, runtimeSource, runtimeCargo, { fixture = false } = {}) {
  for (const input of [serviceSource, serviceCargo, sqliteSource, sqliteCargo, runtimeSource, runtimeCargo]) assert.equal(typeof input, 'string');
  if (digest(serviceCargo) !== serviceCargoPin || digest(sqliteCargo) !== stateReaderCargoPin ||
      digest(runtimeCargo) !== stateModelCargoPin ||
      digest(readFileSync(serviceCargoLockPath)) !== serviceCargoLockPin ||
      digest(readFileSync(stateReaderLockPath)) !== stateReaderLockPin ||
      digest(readFileSync(stateModelLockPath)) !== stateModelLockPin) fail('join-graph-cargo-pin');
  if (!fixture && (digest(serviceSource) !== servicePin || digest(sqliteSource) !== stateReaderPin ||
      digest(runtimeSource) !== stateModelPin)) fail('join-graph-source-pin');
  const accessors = ['sessions', 'current_authorization_revision', 'trusted_scope_evidence', 'is_complete'];
  const adapterAccessors = [...accessors, 'roles'];
  const nodes = {
    service_pre_tail: runAstInventory(serviceSource),
    join: runAstInventory(serviceSource, { kind: 'free', name: 'authorization_state_joins_hold' }),
  };
  for (const name of accessors) nodes[`snapshot_${name}`] = runAstInventory(sqliteSource, {
    kind: 'impl', name, trait: null, self_type: "SqliteAuthorizationStateSnapshot < '_ >",
  });
  for (const name of adapterAccessors) nodes[`adapter_${name}`] = runAstInventory(runtimeSource, {
    kind: 'impl', name, trait: null, self_type: 'ResolvedAuthorizationState',
  });
  const bindings = [
    ['service_pre_tail', 'join', 'function', 'authorization_state_joins_hold', null,
      'authorization_state_joins_hold (epoch , & command , & authorization_state)'],
    ...accessors.map(name => ['join', `snapshot_${name}`, 'method', name, 'state', null]),
    ...adapterAccessors.map(name => [`snapshot_${name === 'roles' ? 'is_complete' : name}`,
      `adapter_${name}`, 'method', name, 'self . state', null]),
  ];
  const edges = bindings.map(([from, to, kind, callee, receiver, expression]) => {
    const sites = nodes[from].sites.filter(site => site.kind === kind && site.callee_syntax === callee &&
      site.receiver_syntax === receiver && (expression === null || site.expression_syntax === expression));
    if (sites.length !== 1) fail(`join-graph-edge-${from}-${to}`);
    return { from, to, site_ordinals: [sites[0].ordinal], site_kind: kind, callee_syntax: callee, receiver_syntax: receiver };
  });
  // These selected bodies are deliberately pinned as whole lexed bodies. The
  // graph names their calls; it does not infer arbitrary Rust dispatch/effects.
  const originalSources = [readFileSync(servicePath, 'utf8'), readFileSync(stateReaderPath, 'utf8'), readFileSync(stateModelPath, 'utf8')];
  const bodyGroups = [
    [serviceSource, originalSources[0], ['fn authorization_state_joins_hold(']],
    [sqliteSource, originalSources[1], accessors.map(name => `pub fn ${name}(`)],
    [runtimeSource, originalSources[2], adapterAccessors.map(name => `pub fn ${name}(`)],
  ];
  for (const [source, original, markers] of bodyGroups) {
    for (const marker of markers) same(values(selectedBody(source, marker).body),
      values(selectedBody(original, marker).body), `join-graph-body-${marker}`);
  }
  const bound = new Set(edges.flatMap(edge => edge.site_ordinals.map(ordinal => `${edge.from}:${ordinal}`)));
  const unboundExplicitSites = Object.entries(nodes).flatMap(([node, inventory]) => inventory.sites
    .filter(site => !bound.has(`${node}:${site.ordinal}`))
    .map(site => ({ node, ordinal: site.ordinal, kind: site.kind, callee_syntax: site.callee_syntax })));
  return {
    service_source_sha256: digest(serviceSource), sqlite_source_sha256: digest(sqliteSource),
    state_model_source_sha256: digest(runtimeSource), nodes, edges,
    unbound_explicit_sites: unboundExplicitSites,
    potential_decision_named_sites: Object.entries(nodes).flatMap(([node, inventory]) => inventory.sites
      .filter(decisionNamedSite).map(site => ({ node, ordinal: site.ordinal, callee_syntax: site.callee_syntax }))),
    selected_body_binding: 'whole-lexed-body-equality-to-pinned-source',
    short_circuit_execution: 'open',
    constructor_argument_mapping: 'open',
    dispatch_and_effect_closure: 'open',
  };
}

export function extractSelectedServiceHelperGraph(serviceSource, serviceCargo,
  { fixture = false, fixtureMetadataSource = null } = {}) {
  assert.equal(typeof serviceSource, 'string');
  assert.equal(typeof serviceCargo, 'string');
  if (digest(serviceCargo) !== serviceCargoPin || digest(readFileSync(serviceCargoLockPath)) !== serviceCargoLockPin) {
    fail('service-helper-cargo-pin');
  }
  if (!fixture && digest(serviceSource) !== servicePin) fail('service-helper-source-pin');
  const metadataSource = fixtureMetadataSource ?? readFileSync(metadataReaderPath, 'utf8');
  const metadataCargo = readFileSync(metadataReaderCargoPath, 'utf8');
  const metadataLock = readFileSync(metadataReaderLockPath);
  if ((!fixture || fixtureMetadataSource === null) && digest(metadataSource) !== metadataReaderPin ||
      digest(metadataCargo) !== metadataReaderCargoPin ||
      digest(metadataLock) !== metadataReaderLockPin ||
      !serviceCargo.includes('auth-foundation-authorization-metadata-reader = { path = "../authorization-metadata-reader" }') ||
      !serviceSource.includes('use auth_foundation_authorization_metadata_reader::{authentication_metadata, route_revision};') ||
      /auth-foundation-(?:runtime-adapter|sqlite-provider|trusted-boundary)/.test(metadataCargo)) {
    fail('service-helper-metadata-dependency');
  }
  const serviceNames = ['command_from_snapshot', 'command_matches_snapshot',
    'valid_reference', 'valid_permission_component', 'valid_identifier'];
  const metadataNames = ['authentication_metadata', 'route_revision'];
  const names = [...serviceNames, ...metadataNames];
  const nodes = Object.fromEntries(names.map(name => [name, runAstInventory(
    metadataNames.includes(name) ? metadataSource : serviceSource, { kind: 'free', name })]));
  nodes.epoch_transaction = runAstInventory(serviceSource, {
    kind: 'impl', name: 'transaction', trait: null, self_type: "AuthorizationEvaluationEpoch < '_ >",
  });
  const original = readFileSync(servicePath, 'utf8');
  if (digest(original) !== servicePin) fail('service-helper-baseline-pin');
  for (const name of names) {
    const selectedSource = metadataNames.includes(name) ? metadataSource : serviceSource;
    const originalSource = metadataNames.includes(name) ? readFileSync(metadataReaderPath, 'utf8') : original;
    same(selectedBody(selectedSource, `fn ${name}`).body,
      selectedBody(originalSource, `fn ${name}`).body, `service-helper-body-${name}`);
  }
  same(selectedBody(serviceSource, 'fn transaction(&self)').body,
    selectedBody(original, 'fn transaction(&self)').body, 'service-helper-body-epoch_transaction');
  const preTail = runAstInventory(serviceSource);
  const baselinePreTail = runAstInventory(original);
  const bindings = [
    ['service_pre_tail', 'authentication_metadata', 'function', 'authentication_metadata', null, 1],
    ['service_pre_tail', 'route_revision', 'function', 'route_revision', null, 1],
    ['service_pre_tail', 'command_from_snapshot', 'function', 'command_from_snapshot', null, 1],
    ['service_pre_tail', 'command_matches_snapshot', 'function', 'command_matches_snapshot', null, 1],
    ['service_pre_tail', 'valid_reference', 'function', 'valid_reference', null, 11],
    ['service_pre_tail', 'valid_permission_component', 'function', 'valid_permission_component', null, 6],
    ['service_pre_tail', 'epoch_transaction', 'method', 'transaction', 'epoch', 5],
    ['valid_reference', 'valid_identifier', 'function', 'valid_identifier', null, 1],
    ['valid_permission_component', 'valid_identifier', 'function', 'valid_identifier', null, 1],
  ];
  const allNodes = { service_pre_tail: preTail, ...nodes };
  const edges = bindings.map(([from, to, kind, callee, receiver, count]) => {
    const sites = allNodes[from].sites.filter(site => site.kind === kind &&
      site.callee_syntax === callee && site.receiver_syntax === receiver);
    if (sites.length !== count) fail(`service-helper-edge-${from}-${to}`);
    const baselineSites = (from === 'service_pre_tail' ? baselinePreTail : allNodes[from]).sites
      .filter(site => site.kind === kind && site.callee_syntax === callee && site.receiver_syntax === receiver);
    same(sites.map(site => site.expression_syntax), baselineSites.map(site => site.expression_syntax),
      `service-helper-arguments-${from}-${to}`);
    return { from, to, site_ordinals: sites.map(site => site.ordinal),
      site_kind: kind, callee_syntax: callee, receiver_syntax: receiver,
      expression_syntaxes: sites.map(site => site.expression_syntax) };
  });
  return {
    service_source_sha256: digest(serviceSource), metadata_source_sha256: digest(metadataSource),
    metadata_cargo_sha256: digest(metadataCargo), metadata_lock_sha256: digest(metadataLock),
    nodes, edges,
    selected_body_binding: 'whole-body-byte-equality-to-pinned-source',
    function_value_effects: ['valid_identifier passes char::is_control to any without an explicit call site'],
    implicit_and_external_effect_closure: 'open',
  };
}

export function selectedParsedSiteManifest(serviceAst, providerRoots, trustedGraph, sqliteGraph, joinGraph, helperGraph) {
  same(serviceAst, joinGraph.nodes.service_pre_tail, 'manifest-duplicate-service-pre-tail');
  if (helperGraph.service_source_sha256 !== joinGraph.service_source_sha256) fail('manifest-service-helper-source-identity');
  if (helperGraph.metadata_source_sha256 !== metadataReaderPin ||
      helperGraph.metadata_cargo_sha256 !== metadataReaderCargoPin ||
      helperGraph.metadata_lock_sha256 !== metadataReaderLockPin) fail('manifest-metadata-source-identity');
  same(providerRoots.roots.trusted, trustedGraph.nodes.resolve, 'manifest-duplicate-trusted-root');
  same(providerRoots.roots.sqlite, sqliteGraph.nodes.resolve, 'manifest-duplicate-sqlite-root');
  if (providerRoots.trusted_source_sha256 !== trustedGraph.trusted_source_sha256 ||
      providerRoots.sqlite_source_sha256 !== sqliteGraph.sqlite_source_sha256 ||
      joinGraph.sqlite_source_sha256 !== sqliteGraph.sqlite_source_sha256 ||
      joinGraph.state_model_source_sha256 !== sqliteGraph.state_model_source_sha256) {
    fail('manifest-source-identity');
  }
  const groups = [
    { id: 'service', nodes: { service_pre_tail: serviceAst,
      ...Object.fromEntries(Object.entries(helperGraph.nodes).filter(([name]) =>
        !['authentication_metadata', 'route_revision'].includes(name))) },
      edges: [...joinGraph.edges.filter(edge => edge.from === 'service_pre_tail'), ...helperGraph.edges] },
    { id: 'metadata', nodes: { authentication_metadata: helperGraph.nodes.authentication_metadata,
      route_revision: helperGraph.nodes.route_revision }, edges: [] },
    { id: 'trusted', nodes: trustedGraph.nodes, edges: trustedGraph.edges },
    { id: 'sqlite', nodes: sqliteGraph.nodes, edges: sqliteGraph.edges },
    { id: 'join', nodes: Object.fromEntries(Object.entries(joinGraph.nodes).filter(([name]) => name !== 'service_pre_tail')),
      edges: joinGraph.edges.filter(edge => edge.from !== 'service_pre_tail') },
  ];
  const expectedNodes = {
    service: ['service_pre_tail', 'command_from_snapshot', 'command_matches_snapshot',
      'valid_reference', 'valid_permission_component', 'valid_identifier', 'epoch_transaction'],
    metadata: ['authentication_metadata', 'route_revision'],
    trusted: ['resolve', 'authentication_rows', 'route_rows', 'to_u64', 'generated_resolve', 'generated_query_valid'],
    sqlite: ['resolve', 'sessions', 'roles', 'revision', 'scope', 'relation_revisions', 'active_role_ids',
      'role_permissions', 'parse_status', 'status_text', 'to_u64', 'to_i64', 'state_new'],
    join: ['join', 'snapshot_sessions', 'snapshot_current_authorization_revision', 'snapshot_trusted_scope_evidence',
      'snapshot_is_complete', 'adapter_sessions', 'adapter_current_authorization_revision',
      'adapter_trusted_scope_evidence', 'adapter_is_complete', 'adapter_roles'],
  };
  const expectedEdges = {
    service: ['service_pre_tail>join', 'service_pre_tail>authentication_metadata',
      'service_pre_tail>route_revision', 'service_pre_tail>command_from_snapshot',
      'service_pre_tail>command_matches_snapshot', 'service_pre_tail>valid_reference',
      'service_pre_tail>valid_permission_component', 'service_pre_tail>epoch_transaction',
      'valid_reference>valid_identifier', 'valid_permission_component>valid_identifier'],
    metadata: [],
    trusted: ['resolve>authentication_rows', 'resolve>route_rows', 'resolve>generated_resolve',
      'authentication_rows>to_u64', 'route_rows>to_u64', 'generated_resolve>generated_query_valid'],
    sqlite: ['resolve>sessions', 'resolve>roles', 'resolve>revision', 'resolve>scope',
      'resolve>relation_revisions', 'resolve>state_new', 'sessions>active_role_ids',
      'sessions>parse_status', 'sessions>to_u64', 'roles>status_text', 'roles>to_i64',
      'roles>active_role_ids', 'roles>role_permissions', 'revision>to_u64',
      'relation_revisions>to_i64'],
    join: ['join>snapshot_sessions', 'join>snapshot_current_authorization_revision',
      'join>snapshot_trusted_scope_evidence', 'join>snapshot_is_complete',
      'snapshot_sessions>adapter_sessions',
      'snapshot_current_authorization_revision>adapter_current_authorization_revision',
      'snapshot_trusted_scope_evidence>adapter_trusted_scope_evidence',
      'snapshot_is_complete>adapter_is_complete', 'snapshot_is_complete>adapter_roles'],
  };
  const rows = [];
  const perNode = [];
  const closureInventories = [];
  for (const group of groups) {
    same(Object.keys(group.nodes).sort(), expectedNodes[group.id].sort(), `manifest-nodes-${group.id}`);
    same(group.edges.map(edge => `${edge.from}>${edge.to}`).sort(), expectedEdges[group.id].sort(),
      `manifest-edges-${group.id}`);
    const bound = new Map();
    for (const edge of group.edges) {
      const sourceNodes = group.id === 'service' ? { ...group.nodes,
        authentication_metadata: helperGraph.nodes.authentication_metadata,
        route_revision: helperGraph.nodes.route_revision, join: joinGraph.nodes.join } :
        group.id === 'join' ? joinGraph.nodes : group.nodes;
      if (!sourceNodes[edge.from] || !sourceNodes[edge.to] || !Array.isArray(edge.site_ordinals) || !edge.site_ordinals.length) {
        fail(`manifest-edge-node-${group.id}`);
      }
      for (const ordinal of edge.site_ordinals) {
        if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= sourceNodes[edge.from].sites.length) fail(`manifest-edge-ordinal-${group.id}`);
        const site = sourceNodes[edge.from].sites[ordinal];
        if (site.kind !== edge.site_kind || site.callee_syntax !== edge.callee_syntax ||
            site.receiver_syntax !== edge.receiver_syntax ||
            (edge.expression_syntaxes && site.expression_syntax !== edge.expression_syntaxes[edge.site_ordinals.indexOf(ordinal)])) {
          fail(`manifest-edge-site-${group.id}`);
        }
        const key = `${edge.from}:${ordinal}`;
        if (bound.has(key)) fail(`manifest-conflicting-edge-${group.id}`);
        bound.set(key, edge.to);
      }
    }
    for (const [node, inventory] of Object.entries(group.nodes)) {
      if (inventory.selected_parsed_call_nodes_exhaustive !== true || !Array.isArray(inventory.sites) ||
          inventory.transitive_effect_closure !== false || inventory.implicit_operations_covered !== false ||
          inventory.macro_token_trees_expanded !== false) fail(`manifest-inventory-${group.id}-${node}`);
      for (const [ordinal, site] of inventory.sites.entries()) {
        if (site.ordinal !== ordinal || !['function', 'method', 'macro', 'opaque-verbatim'].includes(site.kind)) {
          fail(`manifest-site-ordinal-${group.id}-${node}`);
        }
        const target = bound.get(`${node}:${ordinal}`);
        rows.push({
          site_id: `${group.id}/${node}#${ordinal}`,
          group: group.id, node, ordinal,
          kind: site.kind, callee_syntax: site.callee_syntax,
          expression_syntax: site.expression_syntax, receiver_syntax: site.receiver_syntax,
          closure_depth: site.closure_depth, nested_item_depth: site.nested_item_depth,
          control_context: site.control_context,
          potential_decision_named_site: decisionNamedSite(site),
          disposition: target === undefined ? 'unresolved_call_boundary' : 'named_source_edge',
          selected_target: target === undefined ? null : `${group.id === 'service' && target === 'join' ? 'join' :
            group.id === 'service' && ['authentication_metadata', 'route_revision'].includes(target) ? 'metadata' : group.id}/${target}`,
          unresolved_reason: target !== undefined ? null : site.kind === 'macro' ? 'macro-token-tree-unexpanded' :
            site.kind === 'opaque-verbatim' ? 'opaque-verbatim' : 'target-or-effects-unclosed',
          effect_status: 'open',
        });
      }
      const selected = rows.filter(row => row.group === group.id && row.node === node);
      perNode.push({ group: group.id, node, site_count: selected.length,
        bound_site_count: selected.filter(row => row.disposition === 'named_source_edge').length,
        unresolved_site_count: selected.filter(row => row.disposition === 'unresolved_call_boundary').length });
      if (!Array.isArray(inventory.closure_nodes)) fail(`manifest-closure-inventory-${group.id}-${node}`);
      closureInventories.push({ body_id: `${group.id}/${node}`, closure_nodes: inventory.closure_nodes });
    }
  }
  const boundSiteCount = rows.filter(row => row.disposition === 'named_source_edge').length;
  const unresolvedSiteCount = rows.length - boundSiteCount;
  const selectedBodyIds = new Set(perNode.map(node => `${node.group}/${node.node}`));
  if (new Set(rows.map(row => row.site_id)).size !== rows.length ||
      perNode.some(node => node.site_count !== node.bound_site_count + node.unresolved_site_count) ||
      rows.some(row => row.selected_target !== null && !selectedBodyIds.has(row.selected_target))) {
    fail('manifest-partition');
  }
  return {
    schema_version: 'auth-foundation.v4b-selected-parsed-site-manifest/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    source_sha256: {
      service: joinGraph.service_source_sha256,
      metadata_reader: helperGraph.metadata_source_sha256,
      trusted: trustedGraph.trusted_source_sha256,
      trusted_facade: trustedFacadePin,
      sqlite: sqliteGraph.sqlite_source_sha256,
      state_reader: sqliteGraph.sqlite_source_sha256,
      state_model: joinGraph.state_model_source_sha256,
      sqlite_facade: sqliteProviderPin,
      runtime_adapter: runtimeAdapterPin,
    },
    provider_root_signatures: {
      trusted: providerRoots.roots.trusted.parameters,
      sqlite: providerRoots.roots.sqlite.parameters,
    },
    selected_body_count: perNode.length, site_count: rows.length,
    bound_site_count: boundSiteCount, unresolved_site_count: unresolvedSiteCount,
    per_node: perNode, sites: rows, closure_inventories: closureInventories,
    outside_selected_scope: [
      'unselected reachable helper bodies and complete public-entry path',
      'macro expansion and conditional compilation',
      'implicit Drop, Try, iterator and language operations',
      'function-value calls such as char::is_control passed to Iterator::any',
      'standard-library and SQL implementation effects',
      'dynamic and external target resolution',
    ],
    claim_limit: 'Exhaustive partition only of supplied selected syn-parsed explicit sites; a named edge does not close callee effects and an unresolved boundary is not a safe leaf.',
  };
}

export function selectedBoundaryChain(serviceBinding, preResolved, wrapperIR,
  serviceSource, preResolvedSource, wrapperSource) {
  if (serviceBinding.source_sha256 !== digest(serviceSource) ||
      preResolved.source_sha256 !== digest(preResolvedSource) ||
      wrapperIR.source_sha256 !== digest(wrapperSource) ||
      serviceBinding.service_tail_ir?.adapter_form !== 'inline' ||
      serviceBinding.service_tail_ir?.prefix_adapter_calls !== 0) fail('boundary-chain-input-identity');
  same(wrapperIR.prefixActions, [], 'boundary-chain-wrapper-prefix');
  same(wrapperIR.branches.ready, ['callDownstream'], 'boundary-chain-wrapper-ready');
  same(wrapperIR.branches.deny, ['returnDeny'], 'boundary-chain-wrapper-deny');
  const pre = runAstInventory(preResolvedSource, { kind: 'free', name: 'authorize_pre_resolved' });
  const borrowed = runAstInventory(preResolvedSource, { kind: 'impl', name: 'authorize',
    self_type: "BorrowedDecision < '_ , D >", trait: 'AuthorizationDecisionService' });
  const wrapper = runAstInventory(wrapperSource, { kind: 'impl', name: 'authorize',
    self_type: 'TrustedAuthorizationBoundary < A , R , D >', trait: null });
  const adapter = runAstInventory(serviceSource, { kind: 'impl', name: 'authorize',
    self_type: "ResolvedDecisionService < '_ , '_ , '_ >", trait: 'V2AuthorizationDecisionService' });
  const serviceFull = runAstInventory(serviceSource, { kind: 'free', name: 'authorize_in_epoch' });
  same([pre.sites.length, borrowed.sites.length, wrapper.sites.length, adapter.sites.length],
    [5, 1, 14, 3], 'boundary-chain-site-counts');
  if (serviceFull.sites.length !== 84) fail('boundary-chain-full-service-site-count');
  const tailCall = serviceFull.sites[79];
  if (tailCall.kind !== 'function' || tailCall.callee_syntax !== 'authorize_pre_resolved' ||
      tailCall.closure_depth !== 0 || tailCall.nested_item_depth !== 0 ||
      tailCall.receiver_syntax !== null || tailCall.control_context.length !== 0) {
    fail('boundary-chain-tail-call-site');
  }
  const check = (site, expected, reason) => same({
    kind: site.kind, callee_syntax: site.callee_syntax,
    expression_syntax: site.expression_syntax, receiver_syntax: site.receiver_syntax,
    closure_depth: site.closure_depth, nested_item_depth: site.nested_item_depth,
    control_context: site.control_context,
  }, expected, reason);
  check(pre.sites[0], { kind: 'method', callee_syntax: 'authorize',
    expression_syntax: 'TrustedAuthorizationBoundary :: new (ResolvedAuthentication (authentication_evidence) , ResolvedRoutes (route_bindings) , BorrowedDecision (downstream) ,) . authorize (request)',
    receiver_syntax: 'TrustedAuthorizationBoundary :: new (ResolvedAuthentication (authentication_evidence) , ResolvedRoutes (route_bindings) , BorrowedDecision (downstream) ,)',
    closure_depth: 0, nested_item_depth: 0, control_context: [] }, 'boundary-chain-pre-wrapper-site');
  check(borrowed.sites[0], { kind: 'method', callee_syntax: 'authorize',
    expression_syntax: 'self . 0 . authorize (command)', receiver_syntax: 'self . 0',
    closure_depth: 0, nested_item_depth: 0, control_context: [] }, 'boundary-chain-borrowed-site');
  check(wrapper.sites[12], { kind: 'function',
    callee_syntax: 'boundary_kernel :: admit_authorization_command',
    expression_syntax: 'boundary_kernel :: admit_authorization_command (& context)', receiver_syntax: null,
    closure_depth: 0, nested_item_depth: 0, control_context: [] }, 'boundary-chain-kernel-site');
  check(wrapper.sites[13], { kind: 'method', callee_syntax: 'authorize',
    expression_syntax: 'self . downstream . authorize (candidate)', receiver_syntax: 'self . downstream',
    closure_depth: 0, nested_item_depth: 0,
    control_context: ['match boundary_kernel :: admit_authorization_command (& context) arm 0 boundary_kernel :: CommandBoundaryDecision :: Ready'] },
  'boundary-chain-ready-site');
  check(adapter.sites[1], { kind: 'function', callee_syntax: 'authorize_resolved',
    expression_syntax: 'authorize_resolved (command , self . expected . decision_time , state . into_state ())',
    receiver_syntax: null, closure_depth: 0, nested_item_depth: 0,
    control_context: ['match self . state . take () arm 0 Some (state)'] },
  'boundary-chain-adapter-policy-site');
  check(adapter.sites[2], { kind: 'method', callee_syntax: 'into_state',
    expression_syntax: 'state . into_state ()', receiver_syntax: 'state',
    closure_depth: 0, nested_item_depth: 0,
    control_context: ['match self . state . take () arm 0 Some (state)'] },
  'boundary-chain-adapter-state-transfer-site');
  return {
    schema_version: 'auth-foundation.v4b-selected-boundary-chain/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    source_sha256: { service: serviceBinding.source_sha256,
      pre_resolved: preResolved.source_sha256, wrapper: wrapperIR.source_sha256 },
    tail_source_site: tailCall,
    service_full_top_level_statements: serviceFull.top_level_statements,
    nodes: { pre_resolved: pre, borrowed, wrapper, adapter },
    edges: [
      { from: 'public/service_in_epoch', ordinal: 79, to: 'pre_resolved/authorize',
        assumption: 'service-prefix-completes-and-tail-entered' },
      { from: 'pre_resolved/authorize', ordinal: 0, to: 'wrapper/authorize',
        assumption: 'constructed-wrapper-method-target' },
      { from: 'wrapper/authorize', ordinal: 13, to: 'pre_resolved/borrowed',
        assumption: 'kernel-ready-branch-and-borrowed-decision-target' },
      { from: 'pre_resolved/borrowed', ordinal: 0, to: 'service/adapter',
        assumption: 'borrowed-generic-is-selected-adapter-instance' },
    ],
    claim_limit: 'Selected source-spelled AST sites and wrapper branch shape, with generic, trait, and continuation transitions explicitly assumed. No transitive effect closure, all-path no-call proof, or runtime observation.',
  };
}

export function selectedServiceDependencyBridge(publicSpine, selectedManifest, servicePreTail) {
  const serviceSource = readFileSync(servicePath, 'utf8');
  const serviceCargo = readFileSync(serviceCargoPath, 'utf8');
  if (digest(serviceSource) !== servicePin || digest(serviceCargo) !== serviceCargoPin ||
      publicSpine.service_source_sha256 !== servicePin ||
      selectedManifest.source_sha256.service !== servicePin ||
      selectedManifest.source_sha256.trusted !== trustedProviderPin ||
      selectedManifest.source_sha256.trusted_facade !== trustedFacadePin ||
      selectedManifest.source_sha256.sqlite !== stateReaderPin ||
      selectedManifest.source_sha256.state_model !== stateModelPin ||
      selectedManifest.source_sha256.sqlite_facade !== sqliteProviderPin ||
      selectedManifest.source_sha256.runtime_adapter !== runtimeAdapterPin ||
      !serviceSource.includes('use auth_foundation_trusted_input_reader::{\n    SCHEMA_V1 as TRUSTED_INPUT_SCHEMA_V1, TrustedInputResolution, resolve_in_transaction,\n};') ||
      !serviceSource.includes('use auth_foundation_authorization_state_reader::{\n    SCHEMA_V1 as AUTHORIZATION_SCHEMA_V1, SqliteAuthorizationStateSnapshot,\n    resolve_authorization_state_in_transaction,\n};') ||
      !serviceCargo.includes('auth-foundation-trusted-input-reader') ||
      serviceCargo.includes('auth-foundation-trusted-input-provider') ||
      !serviceCargo.includes('auth-foundation-authorization-state-reader') ||
      serviceCargo.includes('auth-foundation-sqlite-provider')) fail('dependency-bridge-source-identity');
  same(selectedManifest.provider_root_signatures, {
    trusted: ["transaction : & Transaction < '_ >", 'authentication_evidence_ref : & str',
      'route_id : & str', 'decision_time : u64'],
    sqlite: ["transaction : & 'transaction Transaction < '_ >", 'command : & AuthorizationCommand'],
  }, 'dependency-bridge-provider-signatures');
  for (const [group, node] of [['trusted', 'resolve'], ['sqlite', 'resolve']]) {
    const inventory = selectedManifest.per_node?.filter(row => row.group === group && row.node === node);
    const sites = selectedManifest.sites?.filter(row => row.group === group && row.node === node);
    if (inventory?.length !== 1 || !Array.isArray(sites) ||
        inventory[0].site_count !== sites.length ||
        sites.some((row, ordinal) => row.site_id !== `${group}/${node}#${ordinal}` || row.ordinal !== ordinal)) {
      fail(`dependency-bridge-target-inventory-${group}`);
    }
  }
  same(publicSpine.nodes.service_authorize.parameters,
    ['& mut self', 'request : InboundAuthorizationRequest'], 'dependency-bridge-public-parameters');
  same(publicSpine.nodes.service_detailed.parameters,
    ['& mut self', 'request : InboundAuthorizationRequest', 'after_trusted_input : F'],
  'dependency-bridge-detailed-parameters');
  same(publicSpine.nodes.service_in_epoch.parameters,
    ["epoch : & AuthorizationEvaluationEpoch < '_ >", 'request : InboundAuthorizationRequest',
      'after_trusted_input : F'], 'dependency-bridge-in-epoch-parameters');
  const hookSite = publicSpine.nodes.service_authorize.sites[0];
  const forwardedSite = publicSpine.nodes.service_detailed.sites[13];
  same([hookSite?.kind, hookSite?.expression_syntax, hookSite?.receiver_syntax],
    ['method', 'self . authorize_detailed_with_hook (request , | _ | { })', 'self'],
  'dependency-bridge-noop-hook-site');
  const hookClosures = publicSpine.nodes.service_authorize.closure_nodes;
  if (!Array.isArray(hookClosures) || hookClosures.length !== 1) fail('dependency-bridge-hook-closure-count');
  const hookClosure = hookClosures[0];
  same([hookClosure.ordinal, hookClosure.parent_call_site_ordinal,
    hookClosure.parent_argument_index, hookClosure.closure_syntax,
    hookClosure.parameters, hookClosure.body_kind, hookClosure.body_syntax,
    hookClosure.body_top_level_statements, hookClosure.nested_site_ordinals,
    hookClosure.attributes_present, hookClosure.modifiers],
  [0, 0, 1, '| _ | { }', ['_'], 'block', '{ }', [], [], 0,
    { async: false, const: false, lifetimes_syntax: null, move: false, static: false }],
  'dependency-bridge-hook-closure-ast');
  if (occurrences(serviceSource, "F: FnOnce(&Transaction<'_>)") !== 2 ||
      occurrences(serviceSource, 'authorize_in_epoch(&epoch, request, after_trusted_input)') !== 1 ||
      occurrences(serviceSource, 'after_trusted_input(epoch.transaction());') !== 1) {
    fail('dependency-bridge-hook-transfer-shape');
  }
  same([forwardedSite?.kind, forwardedSite?.expression_syntax],
    ['function', 'authorize_in_epoch (& epoch , request , after_trusted_input)'],
  'dependency-bridge-forwarded-hook-site');
  const selected = ordinal => selectedManifest.sites.find(row =>
    row.group === 'service' && row.node === 'service_pre_tail' && row.ordinal === ordinal);
  for (const [ordinal, callee, expression] of [
    [0, 'resolve_in_transaction', 'resolve_in_transaction (epoch . transaction () , & request . authentication_evidence_ref , & request . route_id , epoch . decision_time ,)'],
    [47, 'after_trusted_input', 'after_trusted_input (epoch . transaction ())'],
    [53, 'resolve_authorization_state_in_transaction', 'resolve_authorization_state_in_transaction (epoch . transaction () , & kernel_command)'],
  ]) {
    for (const site of [publicSpine.nodes.service_in_epoch.sites[ordinal], servicePreTail.sites[ordinal], selected(ordinal)]) {
      same([site?.ordinal, site?.kind, site?.callee_syntax, site?.expression_syntax,
        site?.closure_depth, site?.nested_item_depth, site?.control_context],
      [ordinal, 'function', callee, expression, 0, 0, []], `dependency-bridge-site-${ordinal}`);
    }
    if (selected(ordinal).selected_target !== null) fail(`dependency-bridge-conflicting-target-${ordinal}`);
  }
  if (publicSpine.nodes.service_in_epoch.sites.filter(site =>
      site.callee_syntax === 'after_trusted_input').length !== 1 ||
      servicePreTail.sites.filter(site =>
        site.callee_syntax === 'after_trusted_input').length !== 1) {
    fail('dependency-bridge-hook-transfer-shape');
  }
  return {
    schema_version: 'auth-foundation.v4b-selected-service-dependency-bridge/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    source_sha256: { service: servicePin, trusted: trustedProviderPin, sqlite: stateReaderPin },
    callback_body: { body_id: 'callback/selected_noop_hook', parsed_site_count: 0,
      explicit_statement_count: 0, source_shape: 'selected-public-argument-1-empty-closure',
      ast_binding: 'public-call-site-0-closure-node-0', effects_closed: false },
    callback_transfer: { public_argument_index: 1,
      detailed_to_epoch: 'one exact source-spelled by-value forwarding call',
      epoch_invocation: 'one exact source-spelled pre-kernel call',
      generic_contract: "two source-pinned F: FnOnce(&Transaction<'_>) clauses",
      status: 'source-pinned-ast-shape; language-level transfer and effects conditional' },
    edges: [
      ...['public/service_in_epoch', 'service/service_pre_tail'].flatMap(from => [
        { from, ordinal: 0, to: 'trusted/resolve', assumption: 'source-spelled-read-only-trusted-reader-import-target' },
        { from, ordinal: 47, to: 'callback/selected_noop_hook',
          assumption: 'generic-FnOnce-argument-transfer-is-selected-noop-closure' },
        { from, ordinal: 53, to: 'sqlite/resolve', assumption: 'source-spelled-read-only-state-reader-import-target' },
      ]),
    ],
    claim_limit: 'Source-pinned AST binds the selected public call\'s second argument to an empty, unmodified closure with zero explicit statements or nested sites; two FnOnce clauses, one forwarding site and one pre-kernel invocation are source-pinned. Typed transfer semantics and implicit operations remain assumptions. Named edges and the empty callback do not close provider effects, dynamic targets, or all-path behavior.',
  };
}

export function selectedKernelCargoIdentity(kernelCargo) {
  if (digest(kernelCargo) !== kernelCargoPin ||
      !kernelCargo.includes('name = "auth-foundation-command-boundary-v2-auth-command-boundary-admit-authorization-command"') ||
      !kernelCargo.includes('path = "src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs"')) {
    fail('gate-bridge-kernel-cargo-identity');
  }
  return { cargo_sha256: kernelCargoPin, selected_lib_path: 'src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs' };
}

export function inspectSelectedWrapperMapperFixture(wrapperSource) {
  const baseline = readFileSync(wrapperSourcePath, 'utf8');
  if (digest(baseline) !== wrapperPin) fail('wrapper-mapper-fixture-baseline-identity');
  const select = (source, kind, name, extra = {}) =>
    runAstInventory(source, { kind, name, ...extra });
  const wrapperSelector = { self_type: 'TrustedAuthorizationBoundary < A , R , D >', trait: null };
  const selected = {
    authorize: select(wrapperSource, 'impl', 'authorize', wrapperSelector),
    authentication: select(wrapperSource, 'free', 'to_kernel_authentication_evidence'),
    route: select(wrapperSource, 'free', 'to_kernel_route_binding'),
  };
  const original = {
    authorize: select(baseline, 'impl', 'authorize', wrapperSelector),
    authentication: select(baseline, 'free', 'to_kernel_authentication_evidence'),
    route: select(baseline, 'free', 'to_kernel_route_binding'),
  };
  same(selected.authorize, original.authorize, 'wrapper-mapper-fixture-authorize-body');
  same(selected.authentication, original.authentication,
    'wrapper-mapper-fixture-authentication-body');
  same(selected.route, original.route, 'wrapper-mapper-fixture-route-body');
  return { status: 'indeterminate', runtime_guarantees_observed: false,
    selected_body_binding: 'whole-selected-AST-equality-to-pinned-source',
    source_spelled_targets: ['to_kernel_authentication_evidence', 'to_kernel_route_binding'],
    target_resolution: 'candidate-not-compiler-proved' };
}

export function selectedWrapperGateBridge(boundaryChain) {
  if (boundaryChain?.schema_version !== 'auth-foundation.v4b-selected-boundary-chain/v1-candidate' ||
      digest(JSON.stringify(boundaryChain.nodes)) !== boundaryNodesPin) {
    fail('gate-bridge-input-identity');
  }
  const preSource = readFileSync(sourcePath, 'utf8');
  const wrapperSource = readFileSync(wrapperSourcePath, 'utf8');
  const wrapperCargo = readFileSync(wrapperCargoPath, 'utf8');
  const kernelSource = readFileSync(kernelSourcePath, 'utf8');
  const kernelCargoIdentity = selectedKernelCargoIdentity(readFileSync(kernelCargoPath, 'utf8'));
  if (digest(preSource) !== sourcePin || digest(wrapperSource) !== wrapperPin ||
      digest(wrapperCargo) !== wrapperCargoPin || digest(kernelSource) !== kernelPin ||
      boundaryChain.source_sha256.pre_resolved !== sourcePin ||
      boundaryChain.source_sha256.wrapper !== wrapperPin ||
      !wrapperSource.includes('use auth_command_boundary_kernel as boundary_kernel;') ||
      !wrapperCargo.includes('auth-command-boundary-kernel = { package = "auth-foundation-command-boundary-v2-auth-command-boundary-admit-authorization-command", path = "../command-boundary-runtime-v2" }')) {
    fail('gate-bridge-source-identity');
  }
  inspectSelectedWrapperMapperFixture(wrapperSource);
  const select = (source, kind, name, self_type = null, trait = null) =>
    runAstInventory(source, { kind, name, ...(kind === 'impl' ? { self_type, trait } : {}) });
  const nodes = {
    'resolver/authentication': select(preSource, 'impl', 'resolve_authentication_evidence',
      'ResolvedAuthentication', 'AuthenticationEvidenceResolver'),
    'resolver/routes': select(preSource, 'impl', 'resolve_route_authorization_bindings',
      'ResolvedRoutes', 'RouteAuthorizationBindingResolver'),
    'wrapper/construct_candidate': select(wrapperSource, 'free', 'construct_candidate'),
    'wrapper/to_kernel_authentication_evidence': select(wrapperSource, 'free', 'to_kernel_authentication_evidence'),
    'wrapper/to_kernel_route_binding': select(wrapperSource, 'free', 'to_kernel_route_binding'),
    'wrapper/to_kernel_command': select(wrapperSource, 'free', 'to_kernel_command'),
    'wrapper/to_kernel_permission': select(wrapperSource, 'free', 'to_kernel_permission'),
    'kernel/admit': select(kernelSource, 'free', 'admit_authorization_command'),
    'kernel/admissible': select(kernelSource, 'free', 'command_boundary_admissible'),
    'kernel/unique_authentication': select(kernelSource, 'free', 'unique_trusted_authentication_evidence'),
    'kernel/unique_route': select(kernelSource, 'free', 'unique_complete_route_binding'),
    'kernel/provenance': select(kernelSource, 'free', 'candidate_command_provenance'),
  };
  same(Object.values(nodes).map(node => node.sites.length), [2, 2, 25, 0, 1, 4, 3, 1, 3, 3, 3, 4],
    'gate-bridge-inventory-counts');
  same([nodes['resolver/authentication'].parameters, nodes['resolver/routes'].parameters], [
    ['& self', '_evidence_ref : & str'], ['& self', '_route_id : & str'],
  ], 'gate-bridge-resolver-parameters');
  same(nodes['wrapper/construct_candidate'].parameters, [
    'request : & InboundAuthorizationRequest',
    'authentication_evidence : & [AuthenticatedSessionEvidence]',
    'route_bindings : & [RouteAuthorizationBinding]',
  ], 'gate-bridge-candidate-parameters');
  same(nodes['wrapper/to_kernel_command'].parameters, ['command : & AuthorizationCommand'],
    'gate-bridge-command-parameters');
  same(nodes['wrapper/to_kernel_authentication_evidence'].parameters,
    ['evidence : AuthenticatedSessionEvidence'], 'gate-bridge-authentication-mapper-parameters');
  same(nodes['wrapper/to_kernel_route_binding'].parameters,
    ['binding : RouteAuthorizationBinding'], 'gate-bridge-route-mapper-parameters');
  for (const name of ['to_kernel_authentication_evidence', 'to_kernel_route_binding']) {
    if (!Array.isArray(boundaryChain.nodes.wrapper.local_bindings) ||
        boundaryChain.nodes.wrapper.local_bindings.some(binding => binding.name === name) ||
        boundaryChain.nodes.wrapper.parameters.some(parameter =>
          new RegExp(`\\b${name}\\b`).test(parameter))) {
      fail(`gate-bridge-local-mapper-shadow-${name}`);
    }
  }
  for (const name of ['kernel/admit', 'kernel/admissible', 'kernel/unique_authentication',
    'kernel/unique_route', 'kernel/provenance']) {
    same(nodes[name].parameters, ['context : & CommandBoundaryContext'],
      'gate-bridge-kernel-parameters');
  }
  const edgeSpecs = [
    ['wrapper/authorize', 1, 'resolver/authentication', 'resolve_authentication_evidence',
      'self . authentication_evidence . resolve_authentication_evidence (& request . authentication_evidence_ref)',
      'selected-ResolvedAuthentication-trait-target'],
    ['wrapper/authorize', 3, 'resolver/routes', 'resolve_route_authorization_bindings',
      'self . route_bindings . resolve_route_authorization_bindings (& request . route_id)',
      'selected-ResolvedRoutes-trait-target'],
    ['wrapper/authorize', 4, 'wrapper/construct_candidate', 'construct_candidate',
      'construct_candidate (& request , & authentication_evidence , & route_bindings)',
      'same-crate-candidate-helper-target'],
    ['wrapper/authorize', 11, 'wrapper/to_kernel_command', 'to_kernel_command',
      'to_kernel_command (& candidate)', 'same-crate-command-conversion-target'],
    ['wrapper/authorize', 12, 'kernel/admit', 'boundary_kernel :: admit_authorization_command',
      'boundary_kernel :: admit_authorization_command (& context)', 'cargo-aliased-v2-kernel-target'],
    ['wrapper/to_kernel_command', 2, 'wrapper/to_kernel_permission', 'to_kernel_permission',
      'to_kernel_permission (& command . required_permission)', 'same-crate-permission-conversion-target'],
    ['wrapper/to_kernel_route_binding', 0, 'wrapper/to_kernel_permission', 'to_kernel_permission',
      'to_kernel_permission (& binding . required_permission)', 'same-crate-permission-conversion-target'],
    ['kernel/admit', 0, 'kernel/admissible', 'command_boundary_admissible',
      'command_boundary_admissible (context)', 'generated-kernel-local-rule-target'],
    ['kernel/admissible', 0, 'kernel/unique_authentication', 'unique_trusted_authentication_evidence',
      'unique_trusted_authentication_evidence (context)', 'generated-kernel-local-rule-target'],
    ['kernel/admissible', 1, 'kernel/unique_route', 'unique_complete_route_binding',
      'unique_complete_route_binding (context)', 'generated-kernel-local-rule-target'],
    ['kernel/admissible', 2, 'kernel/provenance', 'candidate_command_provenance',
      'candidate_command_provenance (context)', 'generated-kernel-local-rule-target'],
  ];
  const edges = edgeSpecs.map(([from, ordinal, to, callee, expression, assumption]) => {
    const site = (from === 'wrapper/authorize' ? boundaryChain.nodes.wrapper : nodes[from]).sites[ordinal];
    same([site?.ordinal, site?.kind, site?.callee_syntax, site?.expression_syntax,
      site?.closure_depth, site?.nested_item_depth, site?.control_context],
    [ordinal, from === 'wrapper/authorize' && (ordinal === 1 || ordinal === 3) ? 'method' : 'function',
      callee, expression, 0, 0, []], `gate-bridge-site-${from}-${ordinal}`);
    return { from, ordinal, to, assumption };
  });
  // The two resolver calls are methods; all other bridge calls are functions.
  for (const ordinal of [1, 3]) {
    if (boundaryChain.nodes.wrapper.sites[ordinal].kind !== 'method') {
      fail(`gate-bridge-resolver-kind-${ordinal}`);
    }
  }
  const mapperSpecs = [
    [6, 5, 7, 'to_kernel_authentication_evidence', 'wrapper/to_kernel_authentication_evidence',
      'authentication_evidence'],
    [9, 8, 10, 'to_kernel_route_binding', 'wrapper/to_kernel_route_binding', 'route_bindings'],
  ];
  const mappedFunctionValues = mapperSpecs.map(([mapOrdinal, collectOrdinal, iteratorOrdinal,
    functionSyntax, target, receiver]) => {
    const map = boundaryChain.nodes.wrapper.sites[mapOrdinal];
    const collect = boundaryChain.nodes.wrapper.sites[collectOrdinal];
    const iterator = boundaryChain.nodes.wrapper.sites[iteratorOrdinal];
    same([map?.kind, map?.callee_syntax, map?.expression_syntax,
      map?.receiver_syntax, map?.control_context,
      collect?.kind, collect?.callee_syntax, collect?.receiver_syntax,
      iterator?.kind, iterator?.callee_syntax, iterator?.expression_syntax],
    ['method', 'map', `${receiver} . into_iter () . map (${functionSyntax})`,
      `${receiver} . into_iter ()`, [],
      'method', 'collect', map?.expression_syntax,
      'method', 'into_iter', `${receiver} . into_iter ()`],
    `gate-bridge-mapper-${mapOrdinal}`);
    return { driver_site_id: `wrapper/authorize#${mapOrdinal}`,
      collect_site_id: `wrapper/authorize#${collectOrdinal}`,
      iterator_site_id: `wrapper/authorize#${iteratorOrdinal}`,
      function_value_syntax: functionSyntax, source_bound_target: target,
      target_resolution: 'source-spelled-local-definition-candidate',
      invocation_assumption: 'iterator-collect-may-invoke-mapped-function-value',
      effect_status: 'open' };
  });
  return {
    schema_version: 'auth-foundation.v4b-selected-wrapper-gate-bridge/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    source_sha256: { pre_resolved: sourcePin, wrapper: wrapperPin, wrapper_cargo: wrapperCargoPin,
      kernel: kernelPin, kernel_cargo: kernelCargoIdentity.cargo_sha256 },
    nodes, edges, mapped_function_values: mappedFunctionValues,
    unbound_function_values: [],
    claim_limit: 'Source-pinned selected resolver, candidate, conversion, two source-spelled local mapper candidates and generated-kernel named edges. Exact selected wrapper AST excludes changed local shadowing in this source, but compiler target resolution remains unproved. Mapper bodies are candidates under iterator-collect assumptions, not direct calls at their map sites. Generic dispatch, iterator invocation, cloning, implicit operations and external effects remain open; no all-path no-call or policy-preservation proof.',
  };
}

export function inspectSelectedPublicHookFixture(serviceSource) {
  assert.equal(typeof serviceSource, 'string');
  const baseline = readFileSync(servicePath, 'utf8');
  const serviceCargo = readFileSync(serviceCargoPath, 'utf8');
  const sqliteSource = readFileSync(sqliteProviderPath, 'utf8');
  const sqliteCargo = readFileSync(sqliteProviderCargoPath, 'utf8');
  if (digest(baseline) !== servicePin || digest(serviceCargo) !== serviceCargoPin ||
      digest(sqliteSource) !== sqliteProviderPin || digest(sqliteCargo) !== sqliteProviderCargoPin ||
      serviceCargo.includes('auth-foundation-sqlite-provider = { path = "../sqlite-provider" }') ||
      !sqliteSource.includes('pub fn authorize_in_transaction(')) fail('hook-fixture-dependency-identity');
  const baselineHookOpen = 'self.authorize_detailed_with_hook(request, |_| {';
  const fixtureHookOpen = 'self.authorize_detailed_with_hook(request, |transaction| {';
  const hookClose = '}).decision';
  const selected = source => {
    const hookOpen = source.includes(fixtureHookOpen) ? fixtureHookOpen : baselineHookOpen;
    const start = source.indexOf(hookOpen);
    const end = source.indexOf(hookClose, start + hookOpen.length);
    if (start < 0 || end < 0 || source.indexOf(hookOpen, start + 1) >= 0 ||
        source.indexOf(hookClose, end + 1) >= 0) fail('hook-fixture-shape');
    return { before: source.slice(0, start) + baselineHookOpen,
      body: source.slice(start + hookOpen.length, end),
      after: source.slice(end) };
  };
  const original = selected(baseline);
  const fixture = selected(serviceSource);
  same([fixture.before, fixture.after], [original.before, original.after],
    'hook-fixture-outside-body');
  const inventory = runAstInventory(serviceSource, { kind: 'impl', name: 'authorize',
    self_type: 'SqliteAuthService < C >', trait: null });
  same(inventory.parameters, ['& mut self', 'request : InboundAuthorizationRequest'],
    'hook-fixture-parameters');
  const outer = inventory.sites.filter(site => site.closure_depth === 0);
  same(outer.map(site => [site.kind, site.callee_syntax, site.receiver_syntax]),
    [['method', 'authorize_detailed_with_hook', 'self']], 'hook-fixture-outer-call');
  const directSqliteAuthSites = inventory.sites.filter(site => site.closure_depth === 1 &&
    site.nested_item_depth === 0 &&
    site.kind === 'function' &&
    site.callee_syntax === 'auth_foundation_sqlite_provider :: authorize_in_transaction');
  // A parsed call inside a closure can be unreachable (for example, `if false`).
  // Only classify the narrow one-statement, straight-line fixture as a witness.
  const hookInventory = runAstInventory(
    `fn selected_public_hook_fixture(transaction: &Transaction<'_>) {${fixture.body}}`,
    { kind: 'free', name: 'selected_public_hook_fixture' });
  const firstHookSite = hookInventory.sites[0];
  const straightLineSite = hookInventory.top_level_statements.length === 1 &&
    firstHookSite?.kind === 'function' && firstHookSite.closure_depth === 0 &&
    firstHookSite.nested_item_depth === 0 &&
    firstHookSite.callee_syntax === 'auth_foundation_sqlite_provider :: authorize_in_transaction' &&
    sameValues(hookInventory.top_level_statements[0], `let _ = ${firstHookSite.expression_syntax};`) &&
    directSqliteAuthSites.some(site => sameValues(site.expression_syntax, firstHookSite.expression_syntax));
  const violatingSiteOrdinals = straightLineSite ? directSqliteAuthSites
    .filter(site => sameValues(site.expression_syntax, firstHookSite.expression_syntax))
    .map(site => site.ordinal) : [];
  return {
    schema_version: 'auth-foundation.v4b-selected-public-hook-fixture/v1-candidate',
    input_mode: 'fixture', status: 'indeterminate', runtime_guarantees_observed: false,
    source_sha256: { fixture_service: digest(serviceSource), baseline_service: servicePin,
      service_cargo: serviceCargoPin, sqlite: sqliteProviderPin, sqlite_cargo: sqliteProviderCargoPin },
    selected_hook_body: fixture.body,
    sites: inventory.sites,
    direct_sqlite_authorization_sites: directSqliteAuthSites.map(site => site.ordinal),
    parsed_straight_line_sqlite_authorization_sites: violatingSiteOrdinals,
    native_endpoint_linkability: 'not-well-typed-under-pinned-service-cargo',
    pre_gate_direct_sqlite_authorization_counterexample: false,
    bounded_graph_property: {
      id: 'no-direct-sqlite-authorization-call-in-selected-public-hook-before-kernel',
      status: 'indeterminate',
      violating_site_ordinals: [],
    },
    claim_limit: 'Fixture-only exact-spelling AST check. The pinned service Cargo has no sqlite-provider dependency, so this direct native authorization call cannot type-check and is not a runnable pre-gate counterexample. Parsed syntax alone proves no transitive effect, production behavior, or runtime guarantee.',
  };
}

export function selectedIteratorCallbackBridge(publicSpine, servicePreTail, { fixture = false } = {}) {
  if (publicSpine?.schema_version !== 'auth-foundation.v4b-selected-public-entry-spine/v1-candidate' ||
      publicSpine.service_source_sha256 !== servicePin ||
      servicePreTail?.selected_parsed_call_nodes_exhaustive !== true ||
      !Array.isArray(servicePreTail.sites) || !Array.isArray(servicePreTail.closure_nodes) ||
      !fixture && digest(JSON.stringify({ api_source_sha256: publicSpine.api_source_sha256,
        service_source_sha256: publicSpine.service_source_sha256,
        nodes: publicSpine.nodes, edges: publicSpine.edges })) !== publicSpinePin) {
    fail('iterator-bridge-input-identity');
  }
  const full = publicSpine.nodes.service_in_epoch;
  const prefix = servicePreTail;
  if (!Array.isArray(full?.sites) || !Array.isArray(full.closure_nodes) ||
      full.closure_nodes.length !== 4 || prefix.closure_nodes.length !== 3) {
    fail('iterator-bridge-closure-count');
  }
  const chains = [
    { closure: 0, collect: 5, adapter: 6, iter: 7, method: 'filter', nested: [8, 9] },
    { closure: 1, collect: 10, adapter: 11, iter: 12, method: 'filter', nested: [13, 14, 15, 16, 17] },
    { closure: 2, collect: 58, adapter: 59, iter: 60, method: 'map', nested: [61, 62, 63, 64] },
    { closure: 3, collect: 65, adapter: 66, iter: 67, method: 'map', nested: [68, 69, 70, 71, 72, 73, 74, 75, 76, 77] },
  ];
  const callbackSites = [];
  for (const chain of chains) {
    const collector = full.sites[chain.collect];
    const adapter = full.sites[chain.adapter];
    const iterator = full.sites[chain.iter];
    const closure = full.closure_nodes[chain.closure];
    same([collector?.ordinal, collector?.kind, collector?.callee_syntax,
      collector?.receiver_syntax, adapter?.ordinal, adapter?.kind,
      adapter?.callee_syntax, adapter?.receiver_syntax,
      iterator?.ordinal, iterator?.kind, iterator?.callee_syntax,
      closure?.ordinal, closure?.parent_call_site_ordinal,
      closure?.parent_argument_index, closure?.nested_site_ordinals],
    [chain.collect, 'method', 'collect', adapter?.expression_syntax,
      chain.adapter, 'method', chain.method, iterator?.expression_syntax,
      chain.iter, 'method', 'iter', chain.closure, chain.adapter, 0, chain.nested],
    `iterator-bridge-chain-${chain.closure}`);
    if (!adapter.expression_syntax.includes(closure.closure_syntax) ||
        collector.expression_syntax !== `${adapter.expression_syntax} . collect ()`) {
      fail(`iterator-bridge-expression-${chain.closure}`);
    }
    if (chain.closure < 3) {
      same(prefix.closure_nodes[chain.closure], closure,
        `iterator-bridge-prefix-closure-${chain.closure}`);
    }
    for (const ordinal of chain.nested) {
      const site = full.sites[ordinal];
      if (site?.ordinal !== ordinal || site.closure_depth !== 1 || site.nested_item_depth !== 0) {
        fail(`iterator-bridge-nested-site-${chain.closure}-${ordinal}`);
      }
      if (chain.closure < 3) {
        same(prefix.sites[ordinal], site,
          `iterator-bridge-prefix-site-${chain.closure}-${ordinal}`);
      }
      for (const body_id of chain.closure < 3 ?
        ['public/service_in_epoch', 'service/service_pre_tail'] : ['public/service_in_epoch']) {
        callbackSites.push({ site_id: `${body_id}#${ordinal}`, closure_ordinal: chain.closure,
          assumption: `iterator-collect-${chain.closure}-callback-may-run` });
      }
    }
  }
  const tailNamedHelpers = [
    [73, 'valid_reference', 'route_id'],
    [74, 'valid_permission_component', 'resource'],
    [75, 'valid_permission_component', 'action'],
    [76, 'valid_permission_component', 'scope'],
    [77, 'valid_reference', 'scope_evidence_ref'],
  ];
  const tailNamedHelperEdges = tailNamedHelpers.map(([ordinal, callee, field]) => {
    const site = full.sites[ordinal];
    same([site?.ordinal, site?.kind, site?.callee_syntax, site?.expression_syntax,
      site?.receiver_syntax, site?.closure_depth, site?.nested_item_depth,
      site?.control_context],
    [ordinal, 'function', callee, `${callee} (& row . ${field})`, null, 1, 0, []],
    `iterator-bridge-tail-helper-${ordinal}`);
    if (!full.closure_nodes[3].nested_site_ordinals.includes(ordinal)) {
      fail(`iterator-bridge-tail-helper-closure-${ordinal}`);
    }
    return { from: 'public/service_in_epoch', ordinal,
      to: `service/${callee}`, assumption: 'source-spelled-tail-validity-helper-target' };
  });
  return {
    schema_version: 'auth-foundation.v4b-selected-iterator-callback-bridge/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    source_sha256: { service: servicePin, api: publicSpine.api_source_sha256 },
    chains: chains.map(({ closure, collect, adapter, iter, method, nested }) =>
      ({ closure_ordinal: closure, collect_site_ordinal: collect,
        adapter_site_ordinal: adapter, iter_site_ordinal: iter, method,
        nested_site_ordinals: nested })),
    callback_sites: callbackSites,
    tail_named_helper_edges: tailNamedHelperEdges,
    claim_limit: 'Pinned AST binds four selected iter/filter-or-map/collect chains, their parsed callback sites, and five source-spelled tail validity-helper edges. Callback and short-circuited helper execution are possible, not guaranteed; Rust method resolution, iterator semantics, implicit operations and callee effects remain assumptions. No downstream no-call or runtime guarantee follows.',
  };
}

export function selectedIdentifierFunctionValueBridge(helperGraph, selectedManifest, rootedFrontier,
  { fixture = false } = {}) {
  if (helperGraph?.service_source_sha256 !== servicePin ||
      selectedManifest?.schema_version !== 'auth-foundation.v4b-selected-parsed-site-manifest/v1-candidate' ||
      selectedManifest.source_sha256.service !== servicePin ||
      rootedFrontier?.schema_version !== 'auth-foundation.v4b-rooted-call-frontier/v1-candidate' ||
      rootedFrontier.source_sha256.service !== servicePin ||
      rootedFrontier.status !== 'indeterminate' ||
      rootedFrontier.runtime_guarantees_observed !== false ||
      !fixture && (rootedFrontier.input_mode !== 'pinned-production' ||
        digest(JSON.stringify(rootedFrontier)) !== rootedFrontierPin ||
        digest(JSON.stringify({ source_sha256: selectedManifest.source_sha256,
          provider_root_signatures: selectedManifest.provider_root_signatures,
          per_node: selectedManifest.per_node, sites: selectedManifest.sites })) !== selectedManifestPin)) {
    fail(`identifier-function-value-input-identity:${digest(JSON.stringify(rootedFrontier))}`);
  }
  const node = helperGraph.nodes?.valid_identifier;
  if (!fixture) {
    same(node, runAstInventory(readFileSync(servicePath, 'utf8'),
      { kind: 'free', name: 'valid_identifier' }), 'identifier-function-value-production-node');
  }
  same([node?.parameters, node?.selected_statement_count, node?.top_level_statements,
    node?.closure_nodes, node?.attributes_present, node?.selected_parsed_call_nodes_exhaustive],
  [['value : & str', 'maximum : usize'], 1,
    ['! value . is_empty () && value . len () <= maximum && ! value . chars () . any (char :: is_control)'],
    [], 0, true], 'identifier-function-value-body');
  const expectedSites = [
    ['method', 'is_empty', 'value . is_empty ()', 'value'],
    ['method', 'len', 'value . len ()', 'value'],
    ['method', 'any', 'value . chars () . any (char :: is_control)', 'value . chars ()'],
    ['method', 'chars', 'value . chars ()', 'value'],
  ];
  if (!Array.isArray(node.sites) || node.sites.length !== expectedSites.length) {
    fail('identifier-function-value-site-count');
  }
  const manifestRows = selectedManifest.sites.filter(row =>
    row.group === 'service' && row.node === 'valid_identifier');
  const manifestNode = selectedManifest.per_node.find(row =>
    row.group === 'service' && row.node === 'valid_identifier');
  if (manifestRows.length !== 4 || manifestNode?.site_count !== 4) {
    fail('identifier-function-value-manifest-count');
  }
  for (const [ordinal, expected] of expectedSites.entries()) {
    const site = node.sites[ordinal];
    same([site?.ordinal, site?.kind, site?.callee_syntax, site?.expression_syntax,
      site?.receiver_syntax, site?.closure_depth, site?.nested_item_depth,
      site?.pre_tail_statement, site?.control_context, site?.scope_path],
    [ordinal, ...expected, 0, 0, 0, [], []], `identifier-function-value-site-${ordinal}`);
    const row = manifestRows[ordinal];
    same([row?.site_id, row?.kind, row?.callee_syntax, row?.expression_syntax,
      row?.receiver_syntax, row?.closure_depth, row?.nested_item_depth,
      row?.control_context, row?.selected_target, row?.disposition, row?.effect_status],
    [`service/valid_identifier#${ordinal}`, ...expected, 0, 0, [], null,
      'unresolved_call_boundary', 'open'], `identifier-function-value-manifest-site-${ordinal}`);
  }
  const drivers = rootedFrontier.rows.filter(row => row.site_id === 'service/valid_identifier#2');
  const driver = drivers[0];
  if (drivers.length !== 1 || driver.body_id !== 'service/valid_identifier' ||
      driver.ordinal !== 2 || driver.kind !== 'method' || driver.callee_syntax !== 'any' ||
      driver.expression_syntax !== expectedSites[2][2] ||
      driver.selected_target !== null || driver.effect_status !== 'open' ||
      driver.posture !== 'possible-under-listed-assumptions' ||
      !Array.isArray(driver.entered_under) || driver.entered_under.length === 0 ||
      driver.entered_under.some(path => !Array.isArray(path) ||
        path.some(assumption => typeof assumption !== 'string' || !assumption))) {
    fail('identifier-function-value-frontier-driver');
  }
  const invocationAssumptions = ['third-short-circuit-conjunct-evaluated',
    'Iterator-any-invokes-function-value-for-visited-character'];
  return {
    schema_version: 'auth-foundation.v4b-selected-identifier-function-value-bridge/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    input_mode: fixture ? 'fixture' : 'pinned-production',
    source_sha256: { service: servicePin },
    boundaries: [{ body_id: 'service/valid_identifier',
      driver_site_id: 'service/valid_identifier#2', receiver_site_id: 'service/valid_identifier#3',
      argument_index: 0, function_value_syntax: 'char :: is_control',
      target_resolution: 'source-spelled-function-value-only', effect_status: 'open',
      posture: driver.posture,
      entered_under: driver.entered_under.map(path => [...new Set([...path, ...invocationAssumptions])].sort()) }],
    claim_limit: 'One pinned valid_identifier body passes char::is_control as a function value to any. It is not a parsed explicit call or a compiler-resolved target; short-circuit, iterator invocation, implicit operations and callee effects remain open. No all-path no-call or runtime guarantee follows.',
  };
}

export function selectedRootedCallFrontier(publicSpine, selectedManifest, servicePreTail, instanceTransfer,
  boundaryChain, { fixture = false } = {}) {
  if (publicSpine.schema_version !== 'auth-foundation.v4b-selected-public-entry-spine/v1-candidate' ||
      selectedManifest.schema_version !== 'auth-foundation.v4b-selected-parsed-site-manifest/v1-candidate' ||
      instanceTransfer.schema_version !== 'auth-foundation.v4b-selected-instance-transfer/v1-candidate' ||
      instanceTransfer.api_source_sha256 !== publicSpine.api_source_sha256 ||
      instanceTransfer.service_source_sha256 !== publicSpine.service_source_sha256 ||
      instanceTransfer.selected_origin_template_property !== true ||
      instanceTransfer.normal_return_repool_template_property !== true ||
      publicSpine.service_source_sha256 !== selectedManifest.source_sha256.service ||
      boundaryChain?.schema_version !== 'auth-foundation.v4b-selected-boundary-chain/v1-candidate' ||
      boundaryChain.source_sha256.service !== publicSpine.service_source_sha256 ||
      boundaryChain.source_sha256.pre_resolved !== sourcePin ||
      boundaryChain.source_sha256.wrapper !== wrapperPin ||
      digest(JSON.stringify(boundaryChain.nodes)) !== boundaryNodesPin ||
      servicePreTail.selected_parsed_call_nodes_exhaustive !== true) fail('frontier-input-identity');
  if (!fixture && (digest(JSON.stringify({ api_source_sha256: publicSpine.api_source_sha256,
    service_source_sha256: publicSpine.service_source_sha256,
    nodes: publicSpine.nodes, edges: publicSpine.edges })) !== publicSpinePin ||
    digest(JSON.stringify({ source_sha256: selectedManifest.source_sha256,
      provider_root_signatures: selectedManifest.provider_root_signatures,
      per_node: selectedManifest.per_node, sites: selectedManifest.sites })) !== selectedManifestPin)) {
    fail(`frontier-production-projection:${digest(JSON.stringify({ api_source_sha256: publicSpine.api_source_sha256,
      service_source_sha256: publicSpine.service_source_sha256,
      nodes: publicSpine.nodes, edges: publicSpine.edges }))}:${digest(JSON.stringify({ source_sha256: selectedManifest.source_sha256,
      provider_root_signatures: selectedManifest.provider_root_signatures,
      per_node: selectedManifest.per_node, sites: selectedManifest.sites }))}`);
  }
  if (!Array.isArray(servicePreTail.sites) || servicePreTail.sites.length !== 65) {
    fail('frontier-segment-length');
  }
  const dependencyBridge = selectedServiceDependencyBridge(publicSpine, selectedManifest, servicePreTail);
  const iteratorCallbackBridge = selectedIteratorCallbackBridge(publicSpine, servicePreTail, { fixture });
  const iteratorCallbackSites = new Map(iteratorCallbackBridge.callback_sites.map(row =>
    [row.site_id, row.assumption]));
  const gateBridge = selectedWrapperGateBridge(boundaryChain);
  const mappedFunctionValueTargets = new Map(gateBridge.mapped_function_values.map(row =>
    [row.driver_site_id, row]));
  if (mappedFunctionValueTargets.size !== 2) fail('frontier-mapped-function-value-partition');
  const publicNames = ['api_builder', 'api_from_engines', 'api_pool_take', 'api_pool_put',
    'api_runtime_authorize', 'api_engine_authorize', 'api_clock', 'service_open',
    'service_from_connection', 'service_authorize', 'service_detailed', 'service_valid_inbound',
    'service_epoch_new', 'service_epoch_allocate', 'service_epoch_finish', 'service_in_epoch'];
  same(Object.keys(publicSpine.nodes).sort(), [...publicNames].sort(), 'frontier-public-nodes');
  const expectedPublicEdges = [
    'api_builder>service_epoch_new', 'api_builder>service_open', 'api_builder>api_from_engines',
    'service_open>service_from_connection',
    'api_runtime_authorize>api_pool_take', 'api_runtime_authorize>api_engine_authorize',
    'api_runtime_authorize>api_pool_put', 'api_engine_authorize>service_authorize',
    'service_authorize>service_detailed', 'service_detailed>service_valid_inbound',
    'service_detailed>api_clock', 'service_detailed>service_epoch_allocate',
    'service_detailed>service_in_epoch', 'service_detailed>service_epoch_finish',
  ];
  same(publicSpine.edges.map(edge => `${edge.from}>${edge.to}`).sort(),
    expectedPublicEdges.sort(), 'frontier-public-edges');
  const publicRows = [];
  const edgeTargets = new Map();
  for (const edge of publicSpine.edges) {
    if (!publicSpine.nodes[edge.from] || !publicSpine.nodes[edge.to] ||
        !Array.isArray(edge.site_ordinals) || edge.site_ordinals.length !== 1) fail('frontier-public-edge');
    const ordinal = edge.site_ordinals[0];
    const site = publicSpine.nodes[edge.from].sites[ordinal];
    if (!site || site.ordinal !== ordinal || site.kind !== edge.site_kind ||
        site.callee_syntax !== edge.callee_syntax || site.receiver_syntax !== edge.receiver_syntax ||
        site.expression_syntax !== edge.expression_syntaxes[0]) fail('frontier-public-edge-site');
    const key = `public/${edge.from}#${ordinal}`;
    if (edgeTargets.has(key)) fail('frontier-public-edge-duplicate');
    edgeTargets.set(key, `public/${edge.to}`);
  }
  const chainNames = { pre_resolved: 'pre_resolved/authorize', borrowed: 'pre_resolved/borrowed',
    wrapper: 'wrapper/authorize', adapter: 'service/adapter' };
  same(Object.keys(boundaryChain.nodes).sort(), Object.keys(chainNames).sort(), 'frontier-boundary-nodes');
  same(boundaryChain.edges.map(edge => `${edge.from}#${edge.ordinal}>${edge.to}:${edge.assumption}`).sort(), [
    'public/service_in_epoch#79>pre_resolved/authorize:service-prefix-completes-and-tail-entered',
    'pre_resolved/authorize#0>wrapper/authorize:constructed-wrapper-method-target',
    'wrapper/authorize#13>pre_resolved/borrowed:kernel-ready-branch-and-borrowed-decision-target',
    'pre_resolved/borrowed#0>service/adapter:borrowed-generic-is-selected-adapter-instance',
  ].sort(), 'frontier-boundary-edges');
  same(Object.keys(chainNames).map(name => boundaryChain.nodes[name].sites.length),
    [5, 1, 14, 3], 'frontier-boundary-site-counts');
  if (Object.values(boundaryChain.nodes).some(node => node.selected_parsed_call_nodes_exhaustive !== true)) {
    fail('frontier-boundary-inventory');
  }
  same(publicSpine.nodes.service_in_epoch.sites[79], boundaryChain.tail_source_site,
    'frontier-tail-call-source-site');
  same(publicSpine.nodes.service_in_epoch.top_level_statements,
    boundaryChain.service_full_top_level_statements, 'frontier-full-service-source-statements');
  const chainAssumptions = new Map();
  for (const edge of boundaryChain.edges) {
    const source = edge.from.startsWith('public/') ?
      publicSpine.nodes[edge.from.slice('public/'.length)] :
      boundaryChain.nodes[Object.keys(chainNames).find(key => chainNames[key] === edge.from)];
    const site = source?.sites?.[edge.ordinal];
    if (!site || site.ordinal !== edge.ordinal || site.kind !== (edge.from === 'public/service_in_epoch' ? 'function' : 'method') ||
        site.callee_syntax !== 'authorize' && !(edge.from === 'public/service_in_epoch' &&
          site.callee_syntax === 'authorize_pre_resolved') ||
        typeof edge.assumption !== 'string' || !edge.assumption) fail('frontier-boundary-edge-site');
    const key = `${edge.from}#${edge.ordinal}`;
    if (edgeTargets.has(key)) fail('frontier-boundary-edge-duplicate');
    edgeTargets.set(key, edge.to);
    chainAssumptions.set(key, edge.assumption);
  }
  for (const edge of dependencyBridge.edges) {
    const key = `${edge.from}#${edge.ordinal}`;
    if (edgeTargets.has(key)) fail('frontier-dependency-edge-duplicate');
    edgeTargets.set(key, edge.to);
    chainAssumptions.set(key, edge.assumption);
  }
  for (const edge of gateBridge.edges) {
    const key = `${edge.from}#${edge.ordinal}`;
    if (edgeTargets.has(key)) fail('frontier-gate-edge-duplicate');
    edgeTargets.set(key, edge.to);
    chainAssumptions.set(key, edge.assumption);
  }
  for (const edge of iteratorCallbackBridge.tail_named_helper_edges) {
    const key = `${edge.from}#${edge.ordinal}`;
    if (edgeTargets.has(key) || !selectedManifest.per_node.some(row =>
      `${row.group}/${row.node}` === edge.to)) fail('frontier-tail-helper-target');
    edgeTargets.set(key, edge.to);
    chainAssumptions.set(key, edge.assumption);
  }
  for (const name of publicNames) {
    const inventory = publicSpine.nodes[name];
    if (inventory.selected_parsed_call_nodes_exhaustive !== true || !Array.isArray(inventory.sites)) {
      fail('frontier-public-inventory');
    }
    for (const [ordinal, site] of inventory.sites.entries()) {
      if (site.ordinal !== ordinal) fail('frontier-public-ordinal');
      const site_id = `public/${name}#${ordinal}`;
      publicRows.push({ site_id, body_id: `public/${name}`, ordinal,
        kind: site.kind, callee_syntax: site.callee_syntax,
        expression_syntax: site.expression_syntax,
        closure_depth: site.closure_depth, nested_item_depth: site.nested_item_depth,
        control_context: site.control_context,
        selected_target: edgeTargets.get(site_id) ?? null,
        source_group: 'public', effect_status: 'open' });
    }
  }
  const selectedRows = selectedManifest.sites.map(row => ({
    site_id: row.site_id, body_id: `${row.group}/${row.node}`, ordinal: row.ordinal,
    kind: row.kind, callee_syntax: row.callee_syntax,
    expression_syntax: row.expression_syntax,
    closure_depth: row.closure_depth, nested_item_depth: row.nested_item_depth,
    control_context: row.control_context,
    selected_target: edgeTargets.get(row.site_id) ?? row.selected_target,
    source_group: row.group,
    effect_status: row.effect_status,
  }));
  const chainRows = Object.entries(chainNames).flatMap(([name, body_id]) =>
    boundaryChain.nodes[name].sites.map((site, ordinal) => {
      if (site.ordinal !== ordinal) fail('frontier-boundary-ordinal');
      const site_id = `${body_id}#${ordinal}`;
      return { site_id, body_id, ordinal, kind: site.kind,
        callee_syntax: site.callee_syntax, expression_syntax: site.expression_syntax,
        closure_depth: site.closure_depth, nested_item_depth: site.nested_item_depth,
        control_context: site.control_context,
        selected_target: edgeTargets.get(site_id) ?? null,
        source_group: name, effect_status: 'open' };
    }));
  const gateRows = Object.entries(gateBridge.nodes).flatMap(([body_id, inventory]) =>
    inventory.sites.map((site, ordinal) => {
      if (site.ordinal !== ordinal) fail('frontier-gate-ordinal');
      const site_id = `${body_id}#${ordinal}`;
      return { site_id, body_id, ordinal, kind: site.kind,
        callee_syntax: site.callee_syntax, expression_syntax: site.expression_syntax,
        closure_depth: site.closure_depth, nested_item_depth: site.nested_item_depth,
        control_context: site.control_context,
        selected_target: edgeTargets.get(site_id) ?? null,
        source_group: body_id.split('/')[0], effect_status: 'open' };
    }));
  const rows = [...publicRows, ...selectedRows, ...chainRows, ...gateRows];
  const bodyRows = new Map();
  for (const name of publicNames) bodyRows.set(`public/${name}`, []);
  for (const node of selectedManifest.per_node) bodyRows.set(`${node.group}/${node.node}`, []);
  for (const body_id of Object.values(chainNames)) bodyRows.set(body_id, []);
  for (const body_id of Object.keys(gateBridge.nodes)) bodyRows.set(body_id, []);
  if ([...mappedFunctionValueTargets.values()].some(row => !bodyRows.has(row.source_bound_target))) {
    fail('frontier-mapped-function-value-target');
  }
  bodyRows.set(dependencyBridge.callback_body.body_id, []);
  for (const row of rows) {
    if (!bodyRows.has(row.body_id)) fail('frontier-row-body');
    bodyRows.get(row.body_id).push(row);
  }
  if (rows.length !== publicRows.length + selectedManifest.site_count + chainRows.length + gateRows.length ||
      new Set(rows.map(row => row.site_id)).size !== rows.length ||
      [...selectedRows, ...gateRows].some(row => row.selected_target !== null && !bodyRows.has(row.selected_target))) {
    fail('frontier-catalog-partition');
  }
  const fullInEpoch = publicSpine.nodes.service_in_epoch.sites;
  const prefix = servicePreTail.sites;
  same(publicSpine.nodes.service_in_epoch.top_level_statements.slice(
    servicePreTail.pre_tail_statement_count), servicePreTail.tail_top_level_statements,
  'frontier-tail-statement-overlap');
  const selectedPrefix = selectedManifest.sites.filter(row =>
    row.group === 'service' && row.node === 'service_pre_tail');
  const prefixNode = selectedManifest.per_node.find(row =>
    row.group === 'service' && row.node === 'service_pre_tail');
  if (!Array.isArray(prefix) || !prefixNode || prefix.length !== prefixNode.site_count ||
      prefix.length !== selectedPrefix.length || prefix.length !== 65 ||
      prefix.length > fullInEpoch.length) fail('frontier-segment-length');
  let prefixProjectedEdgeCount = 0;
  for (const [ordinal, site] of prefix.entries()) {
    const full = fullInEpoch[ordinal];
    const selected = selectedPrefix[ordinal];
    same([site.ordinal, site.kind, site.callee_syntax, site.expression_syntax,
      site.receiver_syntax, site.closure_depth, site.nested_item_depth, site.control_context],
    [selected.ordinal, selected.kind, selected.callee_syntax, selected.expression_syntax,
      selected.receiver_syntax, selected.closure_depth, selected.nested_item_depth,
      selected.control_context],
    'frontier-segment-manifest-overlap');
    same([site.kind, site.callee_syntax, site.expression_syntax, site.receiver_syntax,
      site.control_context],
      [full.kind, full.callee_syntax, full.expression_syntax, full.receiver_syntax,
        full.control_context],
      'frontier-segment-source-overlap');
    if (selected.selected_target !== null) {
      const publicRow = publicRows.find(row => row.site_id === `public/service_in_epoch#${ordinal}`);
      if (!publicRow || publicRow.selected_target !== null &&
          publicRow.selected_target !== selected.selected_target ||
          !bodyRows.has(selected.selected_target)) fail('frontier-prefix-target-conflict');
      publicRow.selected_target = selected.selected_target;
      prefixProjectedEdgeCount++;
    }
  }
  const entries = new Map();
  const siteEntries = new Map();
  const deferred = new Map();
  const queue = [];
  const add = (target, assumptions) => {
    if (!bodyRows.has(target)) fail('frontier-target-missing');
    const sorted = [...new Set(assumptions)].sort();
    const key = JSON.stringify(sorted);
    if (!entries.has(target)) entries.set(target, new Map());
    if (!entries.get(target).has(key)) {
      entries.get(target).set(key, sorted);
      queue.push({ target, assumptions: sorted });
    }
  };
  add('public/api_builder', []);
  add('public/api_runtime_authorize', ['caller-invokes-returned-selected-runtime']);
  while (queue.length) {
    const { target, assumptions } = queue.shift();
    if (target === 'public/service_in_epoch') add('service/service_pre_tail', assumptions);
    for (const row of bodyRows.get(target)) {
      if (row.nested_item_depth > 0) {
        deferred.set(row.site_id, 'nested-item-not-invoked');
        continue;
      }
      let conditions = assumptions;
      if (row.body_id === 'public/service_in_epoch' && row.ordinal >= prefix.length) {
        conditions = [...conditions, 'service-prefix-completes-and-tail-entered'];
      }
      if (row.closure_depth > 0) {
        const iteratorAssumption = iteratorCallbackSites.get(row.site_id);
        if (iteratorAssumption) {
          conditions = [...conditions, iteratorAssumption];
        } else if (row.body_id !== 'public/api_runtime_authorize') {
          deferred.set(row.site_id, 'closure-invocation-unresolved');
          continue;
        } else {
          conditions = [...conditions, 'tokio-spawn-blocking-invokes-worker'];
          if (row.closure_depth > 1) conditions.push('catch-unwind-invokes-callback');
        }
      }
      conditions = [...new Set(conditions)].sort();
      if (!siteEntries.has(row.site_id)) siteEntries.set(row.site_id, new Map());
      siteEntries.get(row.site_id).set(JSON.stringify(conditions), conditions);
      if (row.selected_target !== null) {
        const edgeConditions = row.site_id === `public/api_runtime_authorize#${publicSpine.edges.find(
          edge => edge.from === 'api_runtime_authorize' && edge.to === 'api_engine_authorize').site_ordinals[0]}` ?
          [...conditions, 'dynamic-engine-vtable-target-is-selected-service'] :
          chainAssumptions.has(row.site_id) ? [...conditions, chainAssumptions.get(row.site_id)] : conditions;
        add(row.selected_target, edgeConditions);
      }
      const mapped = mappedFunctionValueTargets.get(row.site_id);
      if (mapped) {
        if (row.body_id !== 'wrapper/authorize' || row.kind !== 'method' ||
            row.callee_syntax !== 'map' || row.selected_target !== null ||
            row.effect_status !== 'open') fail('frontier-mapped-function-value-driver');
        add(mapped.source_bound_target,
          [...conditions, mapped.invocation_assumption,
            `source-bound-function-value-${mapped.function_value_syntax}`]);
      }
    }
  }
  const projected = rows.map(row => {
    const entered_under = [...(siteEntries.get(row.site_id)?.values() ?? [])];
    const body_entered_under = [...(entries.get(row.body_id)?.values() ?? [])];
    const posture = entered_under.length ? 'possible-under-listed-assumptions' :
      deferred.has(row.site_id) ? deferred.get(row.site_id) :
      body_entered_under.length ? 'unentered-site-in-entered-body' :
      'body-not-entered-by-named-projection';
    return { ...row, posture, entered_under, body_entered_under };
  });
  const possible = projected.filter(row => row.posture === 'possible-under-listed-assumptions');
  return {
    schema_version: 'auth-foundation.v4b-rooted-call-frontier/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    input_mode: fixture ? 'fixture' : 'pinned-production',
    source_sha256: { api: publicSpine.api_source_sha256,
      ...selectedManifest.source_sha256,
      pre_resolved: boundaryChain.source_sha256.pre_resolved,
      wrapper: boundaryChain.source_sha256.wrapper,
      kernel: gateBridge.source_sha256.kernel },
    roots: [{ body_id: 'public/api_builder', phase: 'construction' },
      { body_id: 'public/api_runtime_authorize', phase: 'invocation',
        assumption: 'caller-invokes-returned-selected-runtime' }],
    public_site_count: publicRows.length, selected_site_count: selectedRows.length,
    boundary_site_count: chainRows.length, gate_site_count: gateRows.length,
    catalog_site_count: projected.length, projection_overlap_count: prefix.length,
    prefix_projected_edge_count: prefixProjectedEdgeCount,
    entered_body_count: entries.size, possible_site_count: possible.length,
    possible_unresolved_site_count: possible.filter(row => row.selected_target === null).length,
    deferred_site_count: projected.filter(row => row.posture === 'closure-invocation-unresolved' ||
      row.posture === 'nested-item-not-invoked').length,
    dependency_bridge: dependencyBridge,
    iterator_callback_bridge: iteratorCallbackBridge,
    gate_bridge: gateBridge,
    mapped_function_value_handoffs: gateBridge.mapped_function_values,
    rows: projected,
    open_boundaries: ['Every named call edge has open effects and unproved target resolution',
      'Unmatched sites in entered bodies can call unselected code or selected bodies',
      'Unentered selected bodies are not proved unreachable',
      'The service tail and wrapper are parsed but source-spelled transitions remain assumption-dependent',
      'Selected iterator callbacks are possible under collect-invocation assumptions; their helper, clone, implicit and external effects remain open',
      'The selected no-op hook and provider imports are source-spelled only; generic transfer and callee effects remain open',
      'Selected wrapper resolver, candidate, conversion and kernel edges are source-spelled only; iterator callbacks and implicit effects remain open',
      'Implicit operations, macros, callbacks, dynamic dispatch and external libraries are unclosed'],
    claim_limit: `${fixture ? 'Fixture-only variation; not a source-proven production catalog. ' : ''}Two-root named-source-edge projection over a finite parsed-site catalog, including selected provider roots, no-op hook syntax, service tail, pre-resolved body, wrapper resolver/candidate/conversion and generated-kernel gate, READY branch, BorrowedDecision and adapter. It is not a complete reachable-call/leaf manifest. Hook transfer, imported targets, tail continuation, conditional worker, generic/trait target and vtable transitions are assumptions; closure sites without invocation evidence remain deferred. Unentered parsed bodies are not safe leaves or proofs of unreachability.`,
  };
}

export function selectedPreResultEffectInventory(frontier, identifierBridge, selectedManifest,
  { fixture = false } = {}) {
  if (frontier?.schema_version !== 'auth-foundation.v4b-rooted-call-frontier/v1-candidate' ||
      frontier.status !== 'indeterminate' || frontier.runtime_guarantees_observed !== false ||
      identifierBridge?.schema_version !==
        'auth-foundation.v4b-selected-identifier-function-value-bridge/v1-candidate' ||
      identifierBridge.status !== 'indeterminate' || identifierBridge.runtime_guarantees_observed !== false ||
      selectedManifest?.schema_version !== 'auth-foundation.v4b-selected-parsed-site-manifest/v1-candidate' ||
      selectedManifest.source_sha256.service !== servicePin ||
      !fixture && (frontier.input_mode !== 'pinned-production' ||
        identifierBridge.input_mode !== 'pinned-production' ||
        digest(JSON.stringify(frontier)) !== rootedFrontierPin ||
        digest(JSON.stringify({ source_sha256: selectedManifest.source_sha256,
          provider_root_signatures: selectedManifest.provider_root_signatures,
          per_node: selectedManifest.per_node, sites: selectedManifest.sites })) !== selectedManifestPin)) {
    fail('pre-result-inventory-input-identity');
  }
  if (!Array.isArray(frontier.rows) || frontier.catalog_site_count !== frontier.rows.length ||
      new Set(frontier.rows.map(row => row.site_id)).size !== frontier.rows.length) {
    fail('pre-result-inventory-catalog');
  }
  const byBody = new Map();
  for (const row of frontier.rows) {
    if (!byBody.has(row.body_id)) byBody.set(row.body_id, []);
    byBody.get(row.body_id).push(row);
  }
  for (const node of selectedManifest.per_node) {
    const body = `${node.group}/${node.node}`;
    if (!byBody.has(body)) byBody.set(body, []);
    if (byBody.get(body).length !== node.site_count) {
      fail('pre-result-inventory-selected-body-coverage');
    }
  }
  for (const [body, node] of Object.entries(frontier.gate_bridge?.nodes ?? {})) {
    if (!byBody.has(body)) byBody.set(body, []);
    if (byBody.get(body).length !== node.sites?.length) {
      fail('pre-result-inventory-gate-body-coverage');
    }
    for (const [ordinal, site] of node.sites.entries()) {
      const row = byBody.get(body)[ordinal];
      same([row?.ordinal, row?.kind, row?.callee_syntax, row?.expression_syntax,
        row?.closure_depth, row?.nested_item_depth, row?.control_context],
      [site.ordinal, site.kind, site.callee_syntax, site.expression_syntax,
        site.closure_depth, site.nested_item_depth, site.control_context],
      `pre-result-inventory-gate-site-${body}-${ordinal}`);
    }
  }
  if (byBody.has('callback/selected_noop_hook')) {
    fail('pre-result-inventory-noop-callback-sites');
  }
  byBody.set('callback/selected_noop_hook', []);
  const kernelCounts = { 'kernel/admit': 1, 'kernel/admissible': 3,
    'kernel/unique_authentication': 3, 'kernel/unique_route': 3, 'kernel/provenance': 4 };
  for (const [body, count] of Object.entries(kernelCounts)) {
    const rows = byBody.get(body);
    if (rows?.length !== count || rows.some((row, ordinal) => row.ordinal !== ordinal)) {
      fail('pre-result-inventory-kernel-coverage');
    }
  }
  const kernelCall = frontier.rows.find(row => row.site_id === 'wrapper/authorize#12');
  const readyCall = frontier.rows.find(row => row.site_id === 'wrapper/authorize#13');
  same([kernelCall?.kind, kernelCall?.callee_syntax, kernelCall?.expression_syntax,
    kernelCall?.selected_target, kernelCall?.control_context],
  ['function', 'boundary_kernel :: admit_authorization_command',
    'boundary_kernel :: admit_authorization_command (& context)', 'kernel/admit', []],
  'pre-result-inventory-kernel-call');
  same([readyCall?.kind, readyCall?.callee_syntax, readyCall?.expression_syntax,
    readyCall?.selected_target, readyCall?.control_context],
  ['method', 'authorize', 'self . downstream . authorize (candidate)', 'pre_resolved/borrowed',
    ['match boundary_kernel :: admit_authorization_command (& context) arm 0 boundary_kernel :: CommandBoundaryDecision :: Ready']],
  'pre-result-inventory-ready-edge');
  if (frontier.projection_overlap_count !== 65) fail('pre-result-inventory-overlap-count');
  for (let ordinal = 0; ordinal < 65; ordinal++) {
    const full = frontier.rows.find(row => row.site_id === `public/service_in_epoch#${ordinal}`);
    const prefix = frontier.rows.find(row => row.site_id === `service/service_pre_tail#${ordinal}`);
    same([full?.kind, full?.callee_syntax, full?.expression_syntax,
      full?.selected_target, full?.effect_status, full?.closure_depth,
      full?.nested_item_depth, full?.control_context],
    [prefix?.kind, prefix?.callee_syntax, prefix?.expression_syntax,
      prefix?.selected_target, prefix?.effect_status, prefix?.closure_depth,
      prefix?.nested_item_depth, prefix?.control_context],
    `pre-result-inventory-overlap-${ordinal}`);
  }
  const reached = new Set();
  const queue = ['public/api_runtime_authorize'];
  while (queue.length) {
    const body = queue.shift();
    if (reached.has(body)) continue;
    if (!byBody.has(body)) fail('pre-result-inventory-missing-body');
    reached.add(body);
    if (body === 'public/service_in_epoch') queue.push('service/service_pre_tail');
    for (const row of byBody.get(body)) {
      if (row.site_id !== 'wrapper/authorize#13' && row.selected_target !== null) {
        queue.push(row.selected_target);
      }
      const mapped = frontier.mapped_function_value_handoffs?.find(handoff =>
        handoff.driver_site_id === row.site_id);
      if (mapped) queue.push(mapped.source_bound_target);
    }
  }
  if (!reached.has('wrapper/authorize') ||
      Object.keys(kernelCounts).some(body => !reached.has(body))) {
    fail('pre-result-inventory-kernel-reach');
  }
  const physicalSiteId = row =>
    (row.body_id === 'public/service_in_epoch' && row.ordinal < 65 ||
      row.body_id === 'service/service_pre_tail') ?
      `service/in_epoch-source#${row.ordinal}` : row.site_id;
  const candidateRows = frontier.rows.filter(row =>
    reached.has(row.body_id) && row.site_id !== 'wrapper/authorize#13');
  if (candidateRows.some(row => row.effect_status !== 'open')) {
    fail('pre-result-inventory-effect-closure-unsupported');
  }
  const sites = candidateRows.map(row => ({
    site_id: row.site_id, physical_site_id: physicalSiteId(row),
    temporal_class: row.body_id.startsWith('kernel/') || row.site_id === 'wrapper/authorize#12' ?
      'during-kernel-before-result-candidate' : 'temporal-order-unproven',
    named_target: row.selected_target, effect_status: row.effect_status,
    posture: row.posture, entered_under: row.entered_under,
  }));
  const latentSpecs = [
    ['service/valid_identifier#2', 'char :: is_control',
      'value . chars () . any (char :: is_control)'],
  ];
  const identifier = identifierBridge.boundaries?.[0];
  if (identifierBridge.boundaries?.length !== 1 ||
      identifier.driver_site_id !== latentSpecs[0][0] ||
      identifier.function_value_syntax !== latentSpecs[0][1] ||
      identifier.effect_status !== 'open') {
    fail('pre-result-inventory-identifier-latent');
  }
  const latent_function_values = latentSpecs.map(([anchor, syntax, expression]) => {
    const row = frontier.rows.find(site => site.site_id === anchor);
    if (!reached.has(row?.body_id) || row.expression_syntax !== expression ||
        row.selected_target !== null || row.effect_status !== 'open') {
      fail('pre-result-inventory-latent-anchor');
    }
    return { anchor_site_id: anchor, function_value_syntax: syntax,
      target_resolution: 'source-spelled-only', invocation: 'possible-not-proved',
      effect_status: 'open' };
  });
  const mapperSpecs = [
    ['wrapper/authorize#6', 'wrapper/authorize#5', 'wrapper/authorize#7',
      'to_kernel_authentication_evidence', 'wrapper/to_kernel_authentication_evidence',
      'authentication_evidence . into_iter () . map (to_kernel_authentication_evidence)',
      'authentication_evidence . into_iter ()'],
    ['wrapper/authorize#9', 'wrapper/authorize#8', 'wrapper/authorize#10',
      'to_kernel_route_binding', 'wrapper/to_kernel_route_binding',
      'route_bindings . into_iter () . map (to_kernel_route_binding)',
      'route_bindings . into_iter ()'],
  ];
  const mapped_function_values = mapperSpecs.map(([anchor, collectId, iteratorId,
    syntax, target, expression, iteratorExpression]) => {
    const row = frontier.rows.find(site => site.site_id === anchor);
    const collector = frontier.rows.find(site => site.site_id === collectId);
    const iterator = frontier.rows.find(site => site.site_id === iteratorId);
    const handoff = frontier.mapped_function_value_handoffs?.find(site =>
      site.driver_site_id === anchor);
    const expectedHandoff = { driver_site_id: anchor, collect_site_id: collectId,
      iterator_site_id: iteratorId, function_value_syntax: syntax,
      source_bound_target: target,
      target_resolution: 'source-spelled-local-definition-candidate',
      invocation_assumption: 'iterator-collect-may-invoke-mapped-function-value',
      effect_status: 'open' };
    if (!reached.has(row?.body_id) || !reached.has(target) ||
        row.expression_syntax !== expression || row.selected_target !== null ||
        row.effect_status !== 'open' ||
        row.posture !== 'possible-under-listed-assumptions' ||
        collector?.kind !== 'method' || collector.callee_syntax !== 'collect' ||
        collector.expression_syntax !== `${expression} . collect ()` ||
        iterator?.kind !== 'method' || iterator.callee_syntax !== 'into_iter' ||
        iterator.expression_syntax !== iteratorExpression ||
        JSON.stringify(handoff) !== JSON.stringify(expectedHandoff)) {
      fail('pre-result-inventory-mapped-function-value');
    }
    return { anchor_site_id: anchor, function_value_syntax: syntax,
      source_bound_target: target, target_resolution: 'source-spelled-local-definition-candidate',
      invocation: 'possible-under-listed-assumptions', effect_status: 'open' };
  });
  if (frontier.mapped_function_value_handoffs?.length !== mapped_function_values.length ||
      !frontier.rows.some(row => row.site_id === 'wrapper/to_kernel_route_binding#0' &&
        row.selected_target === 'wrapper/to_kernel_permission' &&
        reached.has(row.body_id))) fail('pre-result-inventory-mapped-target-coverage');
  const unresolved = candidateRows.filter(row => row.selected_target === null);
  const prematureSelectedAdapter = reached.has('service/adapter');
  const denyArmRows = frontier.rows.filter(row => row.body_id === 'wrapper/authorize' &&
    row.control_context?.some(context => context.includes('CommandBoundaryDecision :: Deny')));
  return {
    schema_version: 'auth-foundation.v4b-selected-pre-result-effect-inventory/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    input_mode: fixture ? 'fixture' : 'pinned-production',
    coverage_level: 'parsed-sites-plus-one-latent-and-two-source-bound-mapped-function-values-only',
    closure_boundary_coverage: 'not-exhaustive',
    invocation_root: 'public/api_runtime_authorize',
    result_event: 'result of wrapper/authorize#12 boundary_kernel::admit_authorization_command(&context)',
    ready_endpoint_site_id: 'wrapper/authorize#13',
    ready_endpoint_temporal_class: 'after-result-READY-source-arm',
    deny_arm: { parsed_site_count: denyArmRows.length,
      named_selected_downstream_edge: denyArmRows.some(row =>
        row.selected_target === 'pre_resolved/borrowed' || row.selected_target === 'service/adapter'),
      drop_and_unwind_effects_closed: false },
    reached_body_ids: [...reached], site_count: sites.length,
    physical_site_count: new Set(sites.map(row => row.physical_site_id)).size,
    unresolved_parsed_site_count: unresolved.length,
    unresolved_physical_site_count: new Set(unresolved.map(physicalSiteId)).size,
    sites, latent_function_values, mapped_function_values,
    coverage_boundaries: [
      'implicit-Drop-Try-IntoIterator-and-comparison-operations-not-enumerated',
      'macro-expansion-and-conditional-compilation-not-closed',
      'standard-library-SQL-and-provider-effects-not-closed',
      'dynamic-engine-dispatch-and-worker-continuation-not-closed',
      'caller-continuation-and-DENY-unwind-effects-not-closed',
      'other-function-values-and-callbacks-not-exhaustively-enumerated',
      'mapped-function-value-invocation-and-implicit-iterator-effects-not-closed',
      'zero-parsed-call-closure-bodies-not-individually-cataloged',
      'body-level-traversal-does-not-prove-temporal-order',
    ],
    named_edge_property: { selected_adapter_reachable_without_ready_edge: prematureSelectedAdapter,
      status: prematureSelectedAdapter ? 'fail' : 'indeterminate' },
    claim_limit: 'Conservative invocation-root named-edge overapproximation excluding only the source-pinned READY downstream edge. Kernel call and descendants remain in scope until its result. Body membership does not prove a site executes before the result. Every included parsed site retains open effects; one latent function value and two source-bound local mapper bodies are listed, but iterator invocation and other closure, implicit and external classes are not exhaustively enumerated. A fixture failed named-edge cut does not prove a runtime call; an absent named adapter path cannot prove endpoint absence or runtime no-call.',
  };
}

export function selectedReachedClosureCatalog(preResult, publicSpine, selectedManifest,
  boundaryChain, frontier, { fixture = false } = {}) {
  if (preResult?.schema_version !== 'auth-foundation.v4b-selected-pre-result-effect-inventory/v1-candidate' ||
      preResult.status !== 'indeterminate' || preResult.runtime_guarantees_observed !== false ||
      publicSpine?.schema_version !== 'auth-foundation.v4b-selected-public-entry-spine/v1-candidate' ||
      selectedManifest?.schema_version !== 'auth-foundation.v4b-selected-parsed-site-manifest/v1-candidate' ||
      boundaryChain?.schema_version !== 'auth-foundation.v4b-selected-boundary-chain/v1-candidate' ||
      frontier?.schema_version !== 'auth-foundation.v4b-rooted-call-frontier/v1-candidate' ||
      !Array.isArray(selectedManifest.closure_inventories) ||
      !fixture && (preResult.input_mode !== 'pinned-production' ||
        digest(JSON.stringify(preResult)) !== preResultEffectInventoryPin ||
        digest(JSON.stringify({ api_source_sha256: publicSpine.api_source_sha256,
          service_source_sha256: publicSpine.service_source_sha256,
          nodes: publicSpine.nodes, edges: publicSpine.edges })) !== publicSpinePin ||
        digest(JSON.stringify({ source_sha256: selectedManifest.source_sha256,
          provider_root_signatures: selectedManifest.provider_root_signatures,
          per_node: selectedManifest.per_node, sites: selectedManifest.sites })) !== selectedManifestPin ||
        digest(JSON.stringify(selectedManifest.closure_inventories)) !== selectedClosureInventoriesPin ||
        digest(JSON.stringify(boundaryChain.nodes)) !== boundaryNodesPin ||
        digest(JSON.stringify(frontier)) !== rootedFrontierPin)) {
    fail(`closure-catalog-input-identity:${digest(JSON.stringify(preResult))}:${digest(JSON.stringify(selectedManifest.closure_inventories))}:${digest(JSON.stringify(frontier))}`);
  }
  const inventories = new Map();
  const add = (body, inventory) => {
    if (inventories.has(body) || !Array.isArray(inventory?.sites) ||
        !Array.isArray(inventory?.closure_nodes)) fail('closure-catalog-source-inventory');
    inventories.set(body, inventory);
  };
  for (const [name, inventory] of Object.entries(publicSpine.nodes)) add(`public/${name}`, inventory);
  const manifestBodies = new Set();
  for (const record of selectedManifest.closure_inventories) {
    if (manifestBodies.has(record.body_id) || !Array.isArray(record.closure_nodes)) {
      fail('closure-catalog-manifest-inventory');
    }
    manifestBodies.add(record.body_id);
    const selected = selectedManifest.per_node.find(node => `${node.group}/${node.node}` === record.body_id);
    if (!selected || selectedManifest.sites.filter(site =>
      `${site.group}/${site.node}` === record.body_id).length !== selected.site_count) {
      fail('closure-catalog-manifest-body');
    }
    add(record.body_id, { sites: selectedManifest.sites.filter(site =>
      `${site.group}/${site.node}` === record.body_id), closure_nodes: record.closure_nodes });
  }
  if (manifestBodies.size !== selectedManifest.per_node.length) fail('closure-catalog-manifest-coverage');
  for (const [name, body] of Object.entries({ pre_resolved: 'pre_resolved/authorize',
    borrowed: 'pre_resolved/borrowed', wrapper: 'wrapper/authorize', adapter: 'service/adapter' })) {
    add(body, boundaryChain.nodes[name]);
  }
  for (const [body, inventory] of Object.entries(frontier.gate_bridge?.nodes ?? {})) add(body, inventory);
  const reached = preResult.reached_body_ids;
  if (!Array.isArray(reached) || new Set(reached).size !== reached.length ||
      reached.length !== 64 || !reached.includes('callback/selected_noop_hook') ||
      reached.includes('service/adapter')) fail('closure-catalog-reached-set');
  const preResultSites = new Set(preResult.sites?.map(site => site.site_id));
  if (preResultSites.size !== preResult.site_count) fail('closure-catalog-pre-result-sites');
  const handoffKinds = new Map([
    ['function:tokio :: task :: spawn_blocking', 'worker-scheduling-argument'],
    ['function:AssertUnwindSafe', 'unwind-wrapper-argument'],
    ['method:map_err', 'error-mapper-argument'],
    ['method:authorize_detailed_with_hook', 'service-hook-argument'],
    ['method:query_row', 'sql-row-callback-argument'],
    ['method:query_map', 'sql-row-iterator-callback-argument'],
    ['method:filter', 'iterator-filter-callback-argument'],
    ['method:map', 'iterator-map-callback-argument'],
    ['method:any', 'iterator-any-callback-argument'],
  ]);
  const iteratorChains = frontier.iterator_callback_bridge?.chains;
  const callbackSites = new Set(frontier.iterator_callback_bridge?.callback_sites?.map(row => row.site_id));
  if (!Array.isArray(iteratorChains) || iteratorChains.length !== 4 ||
      callbackSites.size !== frontier.iterator_callback_bridge.callback_sites.length ||
      frontier.dependency_bridge?.callback_body?.body_id !== 'callback/selected_noop_hook' ||
      frontier.dependency_bridge.callback_body.parsed_site_count !== 0 ||
      frontier.dependency_bridge.callback_body.explicit_statement_count !== 0 ||
      frontier.dependency_bridge.callback_body.effects_closed !== false) {
    fail('closure-catalog-handoff-bridge');
  }
  const rows = [];
  for (const body of reached) {
    if (body === 'callback/selected_noop_hook') continue;
    const inventory = inventories.get(body);
    if (!inventory) fail(`closure-catalog-missing-body-${body}`);
    for (const [ordinal, closure] of inventory.closure_nodes.entries()) {
      const parent = inventory.sites[closure.parent_call_site_ordinal];
      if (closure.ordinal !== ordinal || !parent ||
          !preResultSites.has(`${body}#${closure.parent_call_site_ordinal}`) ||
          !Number.isInteger(closure.parent_argument_index) || closure.parent_argument_index < 0 ||
          !Array.isArray(closure.nested_site_ordinals) ||
          new Set(closure.nested_site_ordinals).size !== closure.nested_site_ordinals.length ||
          closure.nested_site_ordinals.some(site => !Number.isInteger(site) ||
            site < 0 || site >= inventory.sites.length ||
            !preResultSites.has(`${body}#${site}`)) ||
          !Array.isArray(closure.parameters) ||
          (closure.body_kind === 'block' && !Array.isArray(closure.body_top_level_statements)) ||
          (closure.body_kind === 'expression' && closure.body_top_level_statements !== null) ||
          !['block', 'expression'].includes(closure.body_kind) ||
          typeof closure.body_syntax !== 'string' || typeof closure.closure_syntax !== 'string') {
        fail(`closure-catalog-node-${body}-${ordinal}`);
      }
      const handoffKind = handoffKinds.get(`${parent.kind}:${parent.callee_syntax}`);
      if (!handoffKind) fail(`closure-catalog-parent-kind-${body}-${ordinal}`);
      const chain = (body === 'public/service_in_epoch' || body === 'service/service_pre_tail') ?
        iteratorChains.find(item => item.closure_ordinal === ordinal) : null;
      if (chain && (closure.parent_call_site_ordinal !== chain.adapter_site_ordinal ||
          parent.callee_syntax !== chain.method ||
          closure.nested_site_ordinals.some(site => !callbackSites.has(`${body}#${site}`)))) {
        fail(`closure-catalog-iterator-handoff-${body}-${ordinal}`);
      }
      const isHook = body === 'public/service_authorize' && ordinal === 0;
      if (isHook && (closure.parent_call_site_ordinal !== 0 ||
          closure.parent_argument_index !== 1 ||
          parent.callee_syntax !== 'authorize_detailed_with_hook')) {
        fail('closure-catalog-hook-handoff');
      }
      const sqlRowCallback = handoffKind === 'sql-row-callback-argument';
      const sqlRowIteratorCallback = handoffKind === 'sql-row-iterator-callback-argument';
      const invocationAssumptions = chain ?
        [`iterator-collect-${ordinal}-callback-may-run`] : isHook ?
          ['selected-service-hook-transfer-and-pre-kernel-invocation-may-run'] : sqlRowCallback ?
            ['query-row-executes-and-invokes-callback-on-produced-row'] : sqlRowIteratorCallback ?
              ['query-map-succeeds-iterator-advances-with-produced-row-without-earlier-short-circuit'] : [];
      rows.push({ closure_id: `${body}@${ordinal}`,
        physical_closure_id: (body === 'public/service_in_epoch' && ordinal < 3 ||
          body === 'service/service_pre_tail') ? `service/in_epoch-source@${ordinal}` : `${body}@${ordinal}`,
        parent_body_id: body, ordinal,
        parent_site_id: `${body}#${closure.parent_call_site_ordinal}`,
        parent_argument_index: closure.parent_argument_index,
        parent_kind: parent.kind, parent_callee_syntax: parent.callee_syntax,
        parent_expression_syntax: parent.expression_syntax,
        handoff_kind: handoffKind,
        closure_syntax: closure.closure_syntax, parameters: closure.parameters,
        body_kind: closure.body_kind, body_syntax: closure.body_syntax,
        body_top_level_statements: closure.body_top_level_statements,
        nested_site_ids: closure.nested_site_ordinals.map(site => `${body}#${site}`),
        invocation_posture: invocationAssumptions.length ?
          'possible-under-listed-assumptions' : 'unresolved',
        invocation_assumptions: invocationAssumptions, effect_status: 'open' });
    }
  }
  for (let ordinal = 0; ordinal < 3; ordinal++) {
    same(publicSpine.nodes.service_in_epoch.closure_nodes[ordinal],
      selectedManifest.closure_inventories.find(row =>
        row.body_id === 'service/service_pre_tail')?.closure_nodes[ordinal],
    `closure-catalog-overlap-${ordinal}`);
  }
  if (digest(JSON.stringify(rows.map(row => [row.closure_id,
    row.parent_site_id, row.parent_argument_index, row.parent_kind,
    row.parent_callee_syntax, row.parent_expression_syntax]))) !== reachedClosureParentRelationsPin) {
    fail(`closure-catalog-parent-relations:${digest(JSON.stringify(rows.map(row => [row.closure_id,
      row.parent_site_id, row.parent_argument_index, row.parent_kind,
      row.parent_callee_syntax, row.parent_expression_syntax])))}`);
  }
  const handoffCounts = Object.fromEntries([...handoffKinds.values()].map(kind =>
    [kind, rows.filter(row => row.handoff_kind === kind).length]));
  same(handoffCounts, {
    'worker-scheduling-argument': 1, 'unwind-wrapper-argument': 1,
    'error-mapper-argument': 34, 'service-hook-argument': 1,
    'sql-row-callback-argument': 8, 'sql-row-iterator-callback-argument': 8,
    'iterator-filter-callback-argument': 9, 'iterator-map-callback-argument': 7,
    'iterator-any-callback-argument': 2,
  }, 'closure-catalog-handoff-partition');
  const hook = rows.find(row => row.closure_id === 'public/service_authorize@0');
  if (!hook || hook.closure_syntax !== '| _ | { }' || hook.nested_site_ids.length !== 0 ||
      rows.length !== 71 || new Set(rows.map(row => row.physical_closure_id)).size !== 68 ||
      rows.filter(row => row.invocation_posture === 'possible-under-listed-assumptions').length !== 24) {
    fail('closure-catalog-partition');
  }
  return {
    schema_version: 'auth-foundation.v4b-selected-reached-closure-catalog/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    input_mode: fixture ? 'fixture' : 'pinned-production',
    invocation_root: preResult.invocation_root,
    result_event: preResult.result_event,
    reached_body_count: reached.length, closure_count: rows.length,
    physical_closure_count: new Set(rows.map(row => row.physical_closure_id)).size,
    zero_nested_site_count: rows.filter(row => row.nested_site_ids.length === 0).length,
    handoff_counts: handoffCounts,
    possible_under_assumptions_count: rows.filter(row =>
      row.invocation_posture === 'possible-under-listed-assumptions').length,
    callback_aliases: [{ body_id: 'callback/selected_noop_hook',
      closure_id: hook.closure_id, physical_closure_id: hook.physical_closure_id }],
    closures: rows,
    coverage_boundaries: [
      'nested-site ordinals are syntactic containment, not a direct-call or invocation proof',
      'syntactic handoff does not prove callback invocation; unresolved does not mean unreachable or not invoked',
      'query_row callback invocation is only possible under an explicit produced-row assumption; SQL, row.get, captured-value, implicit and external effects remain open',
      'query_map callback invocation additionally requires iterator advancement without earlier short-circuit; consumer and SQL semantics remain assumptions',
      'the selected no-op hook is an alias, not an additional physical closure',
    ],
    claim_limit: 'Source-bound catalog of closure syntax and parent handoffs in currently reached selected bodies, including zero-parsed-site bodies. The selected no-op hook, four iterator chains, eight query_row callbacks, and eight lazy query_map callbacks are only possible under listed assumptions; all other callback invocations are unresolved. Every effect remains open and no runtime no-call guarantee follows.',
  };
}

export function selectedSqlRowCallbackBridge(catalog, frontier, preResult) {
  if (!['fixture', 'pinned-production'].includes(catalog?.input_mode) ||
      frontier?.input_mode !== catalog.input_mode ||
      preResult?.input_mode !== catalog.input_mode) fail('sql-row-callback-input-mode');
  const ids = [
    'public/service_detailed@0', 'metadata/route_revision@0', 'sqlite/roles@4',
    'sqlite/revision@0', 'sqlite/scope@0', 'sqlite/relation_revisions@0',
    'sqlite/relation_revisions@6', 'sqlite/relation_revisions@8',
  ];
  const expected = new Set(ids);
  const rows = catalog.closures.filter(row => row.handoff_kind === 'sql-row-callback-argument');
  if (rows.length !== ids.length || new Set(rows.map(row => row.closure_id)).size !== ids.length ||
      rows.some(row => !expected.has(row.closure_id))) fail('sql-row-callback-set');
  const sites = new Map(frontier.rows.map(site => [site.site_id, site]));
  const reachedSites = new Set(preResult.sites.map(site => site.site_id));
  const callbacks = ids.map(id => {
    const row = rows.find(item => item.closure_id === id);
    const parent = sites.get(row.parent_site_id);
    const nested = row.nested_site_ids.length === 1 ? sites.get(row.nested_site_ids[0]) : null;
    if (!parent || !reachedSites.has(row.parent_site_id) ||
        parent.kind !== 'method' || parent.callee_syntax !== 'query_row' ||
        row.parent_kind !== 'method' || row.parent_callee_syntax !== 'query_row' ||
        row.parent_expression_syntax !== parent.expression_syntax ||
        row.parent_argument_index !== 2) fail(`sql-row-callback-parent-${id}`);
    if (!nested || !reachedSites.has(row.nested_site_ids[0]) || nested.kind !== 'method' ||
        nested.callee_syntax !== 'get' || !nested.expression_syntax.startsWith('row . get') ||
        !sameValues(nested.expression_syntax, row.body_syntax) ||
        nested.closure_depth !== 1) fail(`sql-row-callback-nested-${id}`);
    if (row.body_kind !== 'expression' ||
        row.parameters.length !== 1 || row.parameters[0] !== 'row' ||
        row.invocation_posture !== 'possible-under-listed-assumptions' ||
        row.invocation_assumptions.length !== 1 ||
        row.invocation_assumptions[0] !== 'query-row-executes-and-invokes-callback-on-produced-row' ||
        row.effect_status !== 'open') fail(`sql-row-callback-shape-${id}`);
    return { closure_id: id, parent_site_id: row.parent_site_id,
      parent_expression_syntax: parent.expression_syntax, parent_argument_index: 2,
      nested_row_get_site_id: nested.site_id,
      invocation_posture: row.invocation_posture,
      invocation_assumptions: row.invocation_assumptions, effect_status: 'open' };
  });
  return { schema_version: 'auth-foundation.v4b-selected-sql-row-callback-bridge/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    input_mode: catalog.input_mode, callbacks,
    claim_limit: `${catalog.input_mode === 'fixture' ? 'Fixture-only variation; not production evidence. ' : ''}Eight selected query_row callback handoffs and nested row.get sites are source-bound under the stated input mode. Invocation is only possible if query_row executes and produces a row; Rust method targets, SQLite behavior, row.get and all callback effects remain open. This is not a no-call proof.` };
}

export function selectedSqlRowIteratorCallbackBridge(catalog, frontier, preResult) {
  if (!['fixture', 'pinned-production'].includes(catalog?.input_mode) ||
      frontier?.input_mode !== catalog.input_mode ||
      preResult?.input_mode !== catalog.input_mode) fail('sql-row-iterator-input-mode');
  if (catalog.input_mode === 'pinned-production' &&
      (digest(JSON.stringify(catalog)) !== selectedClosureCatalogQueryMapPin ||
       digest(JSON.stringify(frontier)) !== rootedFrontierPin ||
       digest(JSON.stringify(preResult)) !== preResultEffectInventoryPin)) {
    fail(`sql-row-iterator-production-identity:${digest(JSON.stringify(catalog))}`);
  }
  const expected = [
    ['metadata/authentication_metadata@0', 3, 2],
    ['trusted/authentication_rows@1', 7, 6],
    ['trusted/route_rows@1', 9, 8],
    ['sqlite/sessions@1', 7, 6],
    ['sqlite/roles@1', 1, 1],
    ['sqlite/relation_revisions@3', 1, 1],
    ['sqlite/active_role_ids@1', 1, 1],
    ['sqlite/role_permissions@1', 4, 3],
  ];
  const rows = catalog.closures.filter(row =>
    row.handoff_kind === 'sql-row-iterator-callback-argument');
  const ids = new Set(expected.map(([id]) => id));
  if (rows.length !== expected.length || new Set(rows.map(row => row.closure_id)).size !==
      expected.length || rows.some(row => !ids.has(row.closure_id))) {
    fail('sql-row-iterator-set');
  }
  const sites = new Map(frontier.rows.map(site => [site.site_id, site]));
  const reached = new Set(preResult.sites.map(site => site.site_id));
  const callbacks = expected.map(([id, nestedCount, rowGetCount]) => {
    const row = rows.find(item => item.closure_id === id);
    const parent = sites.get(row.parent_site_id);
    if (!parent || !reached.has(row.parent_site_id) || parent.kind !== 'method' ||
        parent.callee_syntax !== 'query_map' || row.parent_kind !== 'method' ||
        row.parent_callee_syntax !== 'query_map' || row.parent_argument_index !== 1 ||
        row.parent_expression_syntax !== parent.expression_syntax ||
        row.parameters.length !== 1 || row.parameters[0] !== 'row') {
      fail(`sql-row-iterator-parent-${id}`);
    }
    if (row.nested_site_ids.length !== nestedCount ||
        new Set(row.nested_site_ids).size !== nestedCount) {
      fail(`sql-row-iterator-nested-count-${id}`);
    }
    const nested = row.nested_site_ids.map(siteId => sites.get(siteId));
    if (nested.some((site, index) => !site || !reached.has(row.nested_site_ids[index]) ||
        site.closure_depth !== 1)) fail(`sql-row-iterator-nested-site-${id}`);
    const rowGet = nested.filter(site => site.kind === 'method' &&
      site.callee_syntax === 'get' && site.expression_syntax.startsWith('row . get'));
    if (rowGet.length !== rowGetCount ||
        nested.some(site => !rowGet.includes(site) &&
          !(site.kind === 'function' && site.callee_syntax === 'Ok')) ||
        row.invocation_posture !== 'possible-under-listed-assumptions' ||
        row.invocation_assumptions.length !== 1 ||
        row.invocation_assumptions[0] !==
          'query-map-succeeds-iterator-advances-with-produced-row-without-earlier-short-circuit' ||
        row.effect_status !== 'open') fail(`sql-row-iterator-body-${id}`);
    return { closure_id: id, parent_site_id: row.parent_site_id,
      callback_argument_index: 1, nested_site_ids: row.nested_site_ids,
      row_get_site_ids: rowGet.map(site => site.site_id),
      invocation_posture: row.invocation_posture,
      invocation_assumptions: row.invocation_assumptions,
      consumer_binding: 'unproved', effect_status: 'open' };
  });
  return { schema_version: 'auth-foundation.v4b-selected-sql-row-iterator-callback-bridge/v1-candidate',
    input_mode: catalog.input_mode, status: 'indeterminate',
    runtime_guarantees_observed: false, callbacks,
    claim_limit: `${catalog.input_mode === 'fixture' ? 'Fixture-only variation; not production evidence. ' : ''}Eight selected query_map callback handoffs and complete nested parsed-site inventories are bound. Callback invocation is only possible under successful query, iterator advancement with a produced row, and no earlier short-circuit; iterator target and consumer semantics, SQL, row.get, implicit operations and all effects remain open. This is not a no-call proof.` };
}

export function selectedSqlRowIteratorConsumerBridge(catalog, frontier, preResult,
  { fixtureMetadataSource = null } = {}) {
  const callbackBridge = selectedSqlRowIteratorCallbackBridge(catalog, frontier, preResult);
  const fixture = fixtureMetadataSource !== null;
  if (fixture !== (catalog.input_mode === 'fixture')) fail('sql-row-consumer-input-mode');
  const metadataSource = fixture ? fixtureMetadataSource : readFileSync(metadataReaderPath, 'utf8');
  const trustedSource = readFileSync(trustedProviderPath, 'utf8');
  const sqliteSource = readFileSync(stateReaderPath, 'utf8');
  if (digest(readFileSync(metadataReaderPath, 'utf8')) !== metadataReaderPin ||
      digest(trustedSource) !== trustedProviderPin || digest(sqliteSource) !== stateReaderPin) {
    fail('sql-row-consumer-source-pin');
  }
  if (fixture) {
    assert.equal(typeof fixtureMetadataSource, 'string');
    const selected = selectedBody(metadataSource, 'fn authentication_metadata(');
    const baseline = readFileSync(metadataReaderPath, 'utf8');
    const original = selectedBody(baseline, 'fn authentication_metadata(');
    same(masked(metadataSource, [selected]), masked(baseline, [original]),
      'sql-row-consumer-fixture-outside-selected-body');
  }
  const sqliteImpl = name => ({ kind: 'impl', name, trait: null,
    self_type: "SqliteSnapshot < '_ , '_ >" });
  const specs = [
    ['metadata/authentication_metadata@0', metadataSource,
      { kind: 'free', name: 'authentication_metadata' }, ['query_map', 'ok', 'try', 'collect']],
    ['trusted/authentication_rows@1', trustedSource,
      { kind: 'free', name: 'logical_authentication_evidence_in_transaction' },
      ['query_map', 'map_err', 'try', 'map', 'collect']],
    ['trusted/route_rows@1', trustedSource,
      { kind: 'free', name: 'logical_route_bindings_in_transaction' },
      ['query_map', 'map_err', 'try', 'map', 'collect']],
    ['sqlite/sessions@1', sqliteSource, sqliteImpl('resolve_sessions'),
      ['query_map', 'map_err', 'try', 'collect']],
    ['sqlite/roles@1', sqliteSource, sqliteImpl('resolve_active_roles'),
      ['query_map', 'map_err', 'try', 'collect']],
    ['sqlite/relation_revisions@3', sqliteSource,
      { kind: 'free', name: 'relation_revisions_are_current' },
      ['query_map', 'map_err', 'try', 'collect']],
    ['sqlite/active_role_ids@1', sqliteSource,
      { kind: 'free', name: 'active_role_ids' },
      ['query_map', 'map_err', 'try', 'collect']],
    ['sqlite/role_permissions@1', sqliteSource,
      { kind: 'free', name: 'role_permissions' },
      ['query_map', 'map_err', 'try', 'collect']],
  ];
  const rows = specs.map(([closureId, source, selector, expectedSteps]) => {
    const callback = callbackBridge.callbacks.find(row => row.closure_id === closureId);
    const parent = frontier.rows.find(row => row.site_id === callback?.parent_site_id);
    const bodyId = closureId.slice(0, closureId.lastIndexOf('@'));
    const collectSites = frontier.rows.filter(row => row.site_id.startsWith(`${bodyId}#`) &&
      row.kind === 'method' && row.callee_syntax === 'collect');
    const extracted = runAstConsumerChain(source, selector);
    if (!parent || extracted.chains.length !== 1 ||
        extracted.chains[0].query_map_expression_syntax !== parent.expression_syntax ||
        extracted.chains[0].closure_depth !== parent.closure_depth) {
      fail(`sql-row-consumer-parent-${closureId}`);
    }
    const chain = extracted.chains[0];
    const matchedCollect = collectSites.filter(site =>
      site.expression_syntax === chain.collect_expression_syntax &&
      site.closure_depth === chain.closure_depth);
    const sourceSpelledBound = JSON.stringify(chain.steps) === JSON.stringify(expectedSteps) &&
      typeof chain.collect_expression_syntax === 'string' &&
      (fixture || matchedCollect.length === 1);
    if (!fixture && !sourceSpelledBound) fail(`sql-row-consumer-production-chain-${closureId}`);
    return { closure_id: closureId, parent_site_id: callback.parent_site_id,
      collect_site_id: matchedCollect.length === 1 ? matchedCollect[0].site_id : null,
      top_level_statement: chain.top_level_statement,
      receiver_steps: chain.steps,
      source_spelled_collect_receiver_bound: sourceSpelledBound,
      consumer_property: sourceSpelledBound ? 'pass' : 'fail',
      callback_invocation: 'possible-only-if-query-succeeds-row-produced-and-iterator-advances',
      effect_status: 'open' };
  });
  return { schema_version: 'auth-foundation.v4b-selected-sql-row-iterator-consumer-bridge/v1-candidate',
    input_mode: catalog.input_mode, status: 'indeterminate', runtime_guarantees_observed: false,
    consumer_property: rows.every(row => row.consumer_property === 'pass') ? 'pass' : 'fail',
    callbacks: rows,
    claim_limit: `${fixture ? 'Fixture-only variation; not production evidence. ' : ''}The exact selected query_map expression is an AST receiver ancestor of a collect expression through only named source-spelled adapters. This is a source-shape property, not runtime iterator advancement, callback invocation, Rust target resolution, SQL behavior, effect closure, or an all-path no-call guarantee.` };
}

export function selectedSqlIteratorDependencySemantics(consumerBridge) {
  if (consumerBridge?.schema_version !==
        'auth-foundation.v4b-selected-sql-row-iterator-consumer-bridge/v1-candidate' ||
      consumerBridge.input_mode !== 'pinned-production' ||
      consumerBridge.consumer_property !== 'pass' ||
      consumerBridge.callbacks?.length !== 8 ||
      digest(JSON.stringify(consumerBridge)) !== selectedSqlIteratorConsumerBridgePin ||
      consumerBridge.callbacks.some(row => row.source_spelled_collect_receiver_bound !== true ||
        row.effect_status !== 'open')) fail(`sql-iterator-semantics-consumer-input:${digest(JSON.stringify(consumerBridge))}`);
  for (const [path, pin] of [
    [serviceCargoLockPath, serviceCargoLockPin],
    [metadataReaderLockPath, metadataReaderLockPin],
    [trustedProviderCargoLockPath, trustedProviderCargoLockPin],
    [trustedFacadeLockPath, trustedFacadeLockPin],
    [sqliteProviderCargoLockPath, sqliteProviderCargoLockPin],
  ]) {
    const lock = readFileSync(path, 'utf8');
    if (digest(lock) !== pin || !lock.includes(`name = "rusqlite"\nversion = "0.40.2"\nsource = "registry+https://github.com/rust-lang/crates.io-index"\nchecksum = "${rusqliteArchivePin}"`)) {
      fail('sql-iterator-semantics-lock');
    }
  }
  let metadata;
  let rustcVersion;
  try {
    metadata = JSON.parse(execFileSync(toolchainPath, ['cargo', 'metadata', '--offline',
      '--locked', '--format-version', '1', '--manifest-path', serviceCargoPath],
    { encoding: 'utf8', timeout: 120000, maxBuffer: 16 * 1024 * 1024 }));
    rustcVersion = execFileSync(toolchainPath, ['rustc', '--version'],
      { encoding: 'utf8', timeout: 120000 }).trim();
  } catch (error) {
    fail(`sql-iterator-semantics-toolchain:${error.status ?? error.message}`);
  }
  if (rustcVersion !== rustcVersionPin) fail('sql-iterator-semantics-rustc-version');
  const packages = metadata.packages?.filter(pkg => pkg.name === 'rusqlite');
  const pkg = packages?.length === 1 ? packages[0] : null;
  const match = pkg?.manifest_path?.match(/^(.+)\/registry\/src\/([^/]+)\/rusqlite-0\.40\.2\/Cargo\.toml$/);
  if (!match || pkg.version !== '0.40.2' ||
      pkg.source !== 'registry+https://github.com/rust-lang/crates.io-index') {
    fail('sql-iterator-semantics-resolved-package');
  }
  const archive = join(match[1], 'registry', 'cache', match[2], 'rusqlite-0.40.2.crate');
  const statement = join(pkg.manifest_path.slice(0, -'Cargo.toml'.length), 'src', 'statement.rs');
  const row = join(pkg.manifest_path.slice(0, -'Cargo.toml'.length), 'src', 'row.rs');
  if (digest(readFileSync(archive)) !== rusqliteArchivePin ||
      digest(readFileSync(statement)) !== rusqliteStatementPin ||
      digest(readFileSync(row)) !== rusqliteRowPin) fail('sql-iterator-semantics-source-pin');
  const paths = consumerBridge.callbacks.map(callback => ({
    closure_id: callback.closure_id,
    source_spelled_steps: callback.receiver_steps,
    inferred_query_map_target: 'rusqlite::Statement::query_map',
    inferred_iterator_type_after_success: callback.receiver_steps.includes('map') ?
      'std::iter::Map<rusqlite::MappedRows, closure>' : 'rusqlite::MappedRows',
    inferred_terminal_target: 'std::iter::Iterator::collect',
    compiler_resolved_target: false,
  }));
  return {
    schema_version: 'auth-foundation.v4b-selected-sql-iterator-dependency-semantics/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    dependency: { crate: 'rusqlite', version: '0.40.2', archive_sha256: rusqliteArchivePin,
      statement_sha256: rusqliteStatementPin, row_sha256: rusqliteRowPin,
      rustc_version: rustcVersionPin },
    selected_paths: paths,
    conditional_semantics: [
      'Statement::query_map returns Result<MappedRows<F>> after query succeeds',
      'MappedRows::next invokes its mapper only for a successfully produced row',
      'Iterator::collect over Result items stops after the first error',
    ],
    target_resolution: 'open', effect_closure: 'open', all_path_reachability: 'open',
    claim_limit: 'Pinned rusqlite archive and source plus selected source-spelled chains support a conditional dependency-semantics lemma. Production method targets remain inferred, not compiler-resolved; query execution, row production, iterator advancement, callback effects, implicit operations, and the V4b no-call property remain unproved.',
  };
}

export function inspectSelectedSqlRowCallbackFixture(metadataSource) {
  assert.equal(typeof metadataSource, 'string');
  const baseline = readFileSync(metadataReaderPath, 'utf8');
  if (digest(baseline) !== metadataReaderPin ||
      digest(readFileSync(metadataReaderCargoPath)) !== metadataReaderCargoPin) fail('sql-row-fixture-baseline-pin');
  const selected = selectedBody(metadataSource, 'fn route_revision(');
  const original = selectedBody(baseline, 'fn route_revision(');
  same(masked(metadataSource, [selected]), masked(baseline, [original]),
    'sql-row-fixture-outside-selected-body');
  const preTail = runAstInventory(readFileSync(servicePath, 'utf8'));
  const routeCall = preTail.sites.filter(site => site.kind === 'function' &&
    site.callee_syntax === 'route_revision' && site.closure_depth === 0);
  if (routeCall.length !== 1) fail('sql-row-fixture-pre-gate-edge');
  const helper = runAstInventory(metadataSource, { kind: 'free', name: 'route_revision' });
  const closure = helper.closure_nodes[0];
  const parent = helper.sites[closure?.parent_call_site_ordinal];
  if (helper.closure_nodes.length !== 1 || !parent || parent.kind !== 'method' ||
      parent.callee_syntax !== 'query_row' || closure.parent_argument_index !== 2 ||
      closure.parameters.length !== 1 || closure.parameters[0] !== 'row') {
    fail('sql-row-fixture-parent');
  }
  const nested = closure.nested_site_ordinals.map(ordinal => helper.sites[ordinal]);
  const rowGet = nested.filter(site => site?.kind === 'method' &&
    site.callee_syntax === 'get' && site.receiver_syntax === 'row');
  if (rowGet.length !== 1) fail('sql-row-fixture-row-get');
  const nativeDecision = nested.filter(site => site?.kind === 'function' &&
    site.callee_syntax === 'auth_foundation_sqlite_provider :: authorize_in_transaction');
  const statements = closure.body_top_level_statements;
  const straightLineHarm = closure.body_kind === 'block' &&
    Array.isArray(statements) && statements.length === 2 && nativeDecision.length === 1 &&
    sameValues(statements[0], `let _ = ${nativeDecision[0].expression_syntax};`) &&
    sameValues(statements[1], `${rowGet[0].expression_syntax}`);
  return {
    schema_version: 'auth-foundation.v4b-sql-row-callback-fixture/v1-candidate',
    input_mode: 'fixture', status: 'indeterminate', runtime_guarantees_observed: false,
    source_sha256: { fixture_metadata_reader: digest(metadataSource),
      baseline_metadata_reader: metadataReaderPin, service: servicePin },
    pre_gate_route_revision_site: routeCall[0].ordinal,
    query_row_parent_site: parent.ordinal, callback_argument_index: 2,
    nested_sites: nested.map(site => ({ ordinal: site.ordinal, kind: site.kind,
      callee_syntax: site.callee_syntax, expression_syntax: site.expression_syntax })),
    direct_native_decision_site_count: nativeDecision.length,
    bounded_graph_property: { status: straightLineHarm ? 'fail' : 'indeterminate',
      reason: straightLineHarm ? 'pre-gate-query-row-callback-invokes-broader-native-decision' :
        'callback-path-or-effect-not-closed' },
    claim_limit: 'Fixture-only AST links the selected pre-gate service call to a mutated metadata-reader query_row callback. The native call has no declared decision-crate dependency in the selected reader and must fail compilation; AST alone is not executable production or selected-adapter evidence.'
  };
}

export function inspectSelectedSqlRowIteratorCallbackFixture(metadataSource) {
  assert.equal(typeof metadataSource, 'string');
  const baseline = readFileSync(metadataReaderPath, 'utf8');
  if (digest(baseline) !== metadataReaderPin ||
      digest(readFileSync(metadataReaderCargoPath)) !== metadataReaderCargoPin) fail('sql-row-iterator-fixture-baseline-pin');
  const selected = selectedBody(metadataSource, 'fn authentication_metadata(');
  const original = selectedBody(baseline, 'fn authentication_metadata(');
  same(masked(metadataSource, [selected]), masked(baseline, [original]),
    'sql-row-iterator-fixture-outside-selected-body');
  const preTail = runAstInventory(readFileSync(servicePath, 'utf8'));
  const calls = preTail.sites.filter(site => site.kind === 'function' &&
    site.callee_syntax === 'authentication_metadata' && site.closure_depth === 0);
  if (calls.length !== 1) fail('sql-row-iterator-fixture-pre-gate-edge');
  const helper = runAstInventory(metadataSource,
    { kind: 'free', name: 'authentication_metadata' });
  const baselineHelper = runAstInventory(baseline,
    { kind: 'free', name: 'authentication_metadata' });
  const closure = helper.closure_nodes[0];
  const originalClosure = baselineHelper.closure_nodes[0];
  const parent = helper.sites[closure?.parent_call_site_ordinal];
  if (helper.closure_nodes.length !== 1 || !parent || parent.kind !== 'method' ||
      parent.callee_syntax !== 'query_map' || closure.parent_argument_index !== 1 ||
      closure.parameters.length !== 1 || closure.parameters[0] !== 'row') {
    fail('sql-row-iterator-fixture-parent');
  }
  const nested = closure.nested_site_ordinals.map(ordinal => helper.sites[ordinal]);
  const rowGet = nested.filter(site => site?.kind === 'method' &&
    site.callee_syntax === 'get' && site.receiver_syntax === 'row');
  if (rowGet.length !== 2) fail('sql-row-iterator-fixture-row-get');
  const nativeDecision = nested.filter(site => site?.kind === 'function' &&
    site.callee_syntax === 'auth_foundation_sqlite_provider :: authorize_in_transaction');
  const statements = closure.body_top_level_statements;
  const straightLineHarm = closure.body_kind === 'block' &&
    Array.isArray(statements) && statements.length === 2 && nativeDecision.length === 1 &&
    sameValues(statements[0], `let _ = ${nativeDecision[0].expression_syntax};`) &&
    statements[1] === originalClosure.body_top_level_statements[0];
  return {
    schema_version: 'auth-foundation.v4b-sql-row-iterator-callback-fixture/v1-candidate',
    input_mode: 'fixture', status: 'indeterminate', runtime_guarantees_observed: false,
    source_sha256: { fixture_metadata_reader: digest(metadataSource),
      baseline_metadata_reader: metadataReaderPin, service: servicePin },
    pre_gate_authentication_metadata_site: calls[0].ordinal,
    query_map_parent_site: parent.ordinal, callback_argument_index: 1,
    nested_sites: nested.map(site => ({ ordinal: site.ordinal, kind: site.kind,
      callee_syntax: site.callee_syntax, expression_syntax: site.expression_syntax })),
    direct_native_decision_site_count: nativeDecision.length,
    bounded_graph_property: { status: straightLineHarm ? 'fail' : 'indeterminate',
      reason: straightLineHarm ?
        'conditional-pre-gate-query-map-callback-invokes-broader-native-decision' :
        'lazy-callback-path-or-effect-not-closed' },
    claim_limit: 'Fixture-only AST links the selected pre-gate service call to a mutated metadata-reader lazy query_map callback. The native call has no declared decision-crate dependency in the selected reader and must fail compilation. Its hypothetical invocation is conditional on iterator advancement and row production; no production runtime call follows.'
  };
}

function readServiceTail(body, originalBody, astInventory) {
  const selected = selectedServiceTail(body);
  const original = selectedServiceTail(originalBody);
  same(values(selected.prefix), values(original.prefix), 'pre-tail-shape');
  same(selected.routeStatement, original.routeStatement, 'service-tail-routes-shape');
  const parsed = astInventory.tail_top_level_statements;
  if (!Array.isArray(parsed) || (parsed.length !== 6 && parsed.length !== 8)) fail('service-tail-statement-count');
  const statements = parsed.map(statement => values(statement));
  same(statements[0], selected.routeStatement, 'service-tail-parsed-routes');
  const tail = statements.slice(1);
  if (tail.length !== 5 && tail.length !== 7) fail('service-tail-statement-count');
  same(tail[0], ['let', 'expected_request_id', '=', 'request', '.', 'request_id', '.', 'clone', '(', ')', ';'], 'service-tail-request-id');
  same(tail[1], ['let', 'mut', 'downstream_port_calls', '=', '0', ';'], 'service-tail-counter');
  const originalCall = selectedServiceCall(originalBody);
  const adapterStart = originalCall.indexOf('&mut ResolvedDecisionService {');
  const adapterEnd = originalCall.indexOf('\n        },', adapterStart);
  if (adapterStart < 0 || adapterEnd < 0) fail('service-tail-baseline-adapter');
  const namedCall = `${originalCall.slice(0, adapterStart)}&mut decision_service,${originalCall.slice(adapterEnd + '\n        },'.length)}`;
  const namedAdapter = values(`let mut decision_service = ResolvedDecisionService {
    expected_request_id,
    expected: &command,
    state: Some(authorization_state),
    downstream_port_calls: &mut downstream_port_calls,
  };`);
  const eagerCall = values('let _ = V2AuthorizationDecisionService::authorize(&mut decision_service, kernel_command.clone());');
  const named = tail.length === 7;
  if (named) {
    same(tail[2], namedAdapter, 'service-tail-named-adapter');
    same(tail[3], eagerCall, 'service-tail-eager-same-instance-call');
    same(tail[4], values(namedCall), 'service-tail-named-wrapper-call');
  } else {
    same(tail[2], values(originalCall), 'service-tail-inline-wrapper-call');
  }
  const outcomeIndex = named ? 5 : 3;
  same(tail[outcomeIndex], values(`let outcome = match decision {
    BinaryAuthorizationDecision::Allow => AuthorizationOutcome::allow(),
    BinaryAuthorizationDecision::Deny => { AuthorizationOutcome::deny(AuthorizationDiagnostic::PolicyDenied) }
  };`), 'service-tail-outcome');
  same(tail[outcomeIndex + 1], ['outcome', '.', 'with_downstream_port_calls', '(', 'downstream_port_calls', ')'], 'service-tail-return');
  return {
    selected_call_reachable_from_tail_entry: true,
    tail_statement_count: tail.length,
    service_tail_ir: {
      parse_source: 'syn-top-level-statements-with-closed-lexed-statement-grammar',
      selected_adapter_instance: 'ResolvedDecisionService:A0',
      adapter_form: named ? 'named' : 'inline',
      prefix_adapter_calls: named ? 1 : 0,
      same_instance_receiver: true,
      unknown_statements_accepted: false,
    },
    pre_tail_inventory: readPreTailInventory(selected.prefix),
  };
}

export function extractServiceBinding(source, cargo, { fixture = false } = {}) {
  assert.equal(typeof source, 'string');
  assert.equal(typeof cargo, 'string');
  if (digest(cargo) !== serviceCargoPin) fail('service-cargo-pin');
  const baseline = readFileSync(servicePath, 'utf8');
  if (!fixture && digest(source) !== servicePin) fail('service-source-pin');
  const service = selectedBody(source, 'fn authorize_in_epoch<F>(');
  const originalService = selectedBody(baseline, 'fn authorize_in_epoch<F>(');
  const implMarker = 'impl V2AuthorizationDecisionService for ResolvedDecisionService';
  const impl = source.indexOf(implMarker);
  const originalImpl = baseline.indexOf(implMarker);
  if (impl < 0 || originalImpl < 0) fail('service-adapter-identity');
  const adapter = selectedBody(source, 'fn authorize(', impl);
  const originalAdapter = selectedBody(baseline, 'fn authorize(', originalImpl);
  if (masked(source, [service, adapter]) !== masked(baseline, [originalService, originalAdapter])) fail('service-outside-selected-body');
  const astInventory = extractAstPreTailInventory(source);
  const tail = readServiceTail(service.body, originalService.body, astInventory);
  same(values(adapter.body), values(originalAdapter.body), 'service-adapter-shape');
  const call = selectedServiceCall(service.body);
  if (tail.service_tail_ir.adapter_form === 'inline' &&
      (!call.includes('&mut ResolvedDecisionService {') ||
       !call.includes('downstream_port_calls: &mut downstream_port_calls,'))) fail('service-receiver-binding');
  if (tail.service_tail_ir.adapter_form === 'named' && !call.includes('&mut decision_service,')) fail('service-receiver-binding');
  if (!adapter.body.includes('*self.downstream_port_calls += 1;') ||
      !adapter.body.includes('Some(state) => {') ||
      !adapter.body.includes('authorize_resolved(command, self.expected.decision_time, state.into_state())')) fail('service-adapter-observer');
  return {
    source_sha256: digest(source), cargo_sha256: digest(cargo),
    selected_call_receiver_shape: 'ResolvedDecisionService',
    source_counter_increment_shape: 1,
    ...tail,
    ast_pre_tail_inventory: astInventory,
    helper_and_callback_closure: 'unresolved',
  };
}

const occurrences = (source, phrase) => source.split(phrase).length - 1;

export function extractSelectedPublicPath(apiSource, apiCargo, serviceSource, serviceCargo, { fixture = false } = {}) {
  for (const source of [apiSource, apiCargo, serviceSource, serviceCargo]) assert.equal(typeof source, 'string');
  if (digest(apiCargo) !== apiCargoPin || digest(serviceCargo) !== serviceCargoPin) fail('public-path-cargo-pin');
  const originalApi = readFileSync(apiPath, 'utf8');
  const originalService = readFileSync(servicePath, 'utf8');
  if (!fixture && (digest(apiSource) !== apiPin || digest(serviceSource) !== servicePin)) fail('public-path-source-pin');

  const apiMarkers = [
    'impl DecisionClock for SystemDecisionClock',
    'impl<C> AuthorizationEngine for SqliteAuthService<C>',
    'pub fn authorization_runtime_from_database(',
  ];
  const apiBodies = apiMarkers.map(marker => selectedBody(apiSource, marker));
  const originalApiBodies = apiMarkers.map(marker => selectedBody(originalApi, marker));
  const serviceMarkers = ['pub fn authorize(', 'fn authorize_detailed_with_hook<F>('];
  const serviceBodies = serviceMarkers.map(marker => selectedBody(serviceSource, marker));
  const originalServiceBodies = serviceMarkers.map(marker => selectedBody(originalService, marker));
  if (masked(apiSource, apiBodies) !== masked(originalApi, originalApiBodies) ||
      masked(serviceSource, serviceBodies) !== masked(originalService, originalServiceBodies)) fail('public-path-outside-selected-body');
  for (let index = 0; index < apiBodies.length; index++) {
    same(apiBodies[index].body, originalApiBodies[index].body, `public-path-api-body-${index}`);
  }
  for (let index = 0; index < serviceBodies.length; index++) {
    same(serviceBodies[index].body, originalServiceBodies[index].body, `public-path-service-body-${index}`);
  }

  const [clock, engine, builder] = apiBodies.map(span => span.body);
  const [publicAuthorize, detailed] = serviceBodies.map(span => span.body);
  same(values(publicAuthorize), ['self', '.', 'authorize_detailed_with_hook', '(', 'request', ',', '|', '_', '|', '{', '}', ')', '.', 'decision'], 'public-path-noop-hook');
  if (occurrences(engine, 'SqliteAuthService::authorize(self, request)') !== 1 ||
      occurrences(builder, 'SqliteAuthService::open_with_epoch_allocator(') !== 1 ||
      occurrences(builder, 'SystemDecisionClock') !== 1 ||
      occurrences(clock, 'SystemTime::now()') !== 1) fail('public-path-selected-construction');
  if (occurrences(detailed, 'authorize_in_epoch(&epoch, request, after_trusted_input)') !== 1) fail('public-path-in-epoch-call');
  return {
    api_source_sha256: digest(apiSource), api_cargo_sha256: digest(apiCargo),
    selected_builder_engine_shape: 'SqliteAuthService<SystemDecisionClock>',
    selected_public_hook_shape: 'no-op',
    selected_detailed_in_epoch_call_occurrence: 1,
    dynamic_engine_pool_and_collaborator_effect_closure: 'unresolved',
  };
}

export function extractSelectedPublicEntrySpine(apiSource, apiCargo, serviceSource, serviceCargo, { fixture = false } = {}) {
  const publicPath = extractSelectedPublicPath(apiSource, apiCargo, serviceSource, serviceCargo, { fixture });
  const originalApi = readFileSync(apiPath, 'utf8');
  const originalService = readFileSync(servicePath, 'utf8');
  for (const marker of ['pub fn from_engines(', 'fn take(&self)', 'fn put(&self', 'pub async fn authorize(']) {
    same(selectedBody(apiSource, marker).body, selectedBody(originalApi, marker).body,
      `public-spine-api-body-${marker}`);
  }
  for (const marker of ['pub fn open_with_epoch_allocator(', 'pub fn from_connection_with_epoch_allocator(',
    'pub fn allocate(&self)', 'fn finish(self)', 'fn valid_inbound_request(']) {
    same(selectedBody(serviceSource, marker).body, selectedBody(originalService, marker).body,
      `public-spine-service-body-${marker}`);
  }
  const impl = (name, self_type, trait = null) => ({ kind: 'impl', name, self_type, trait });
  const free = name => ({ kind: 'free', name });
  const nodes = {
    api_builder: runAstInventory(apiSource, free('authorization_runtime_from_database')),
    api_from_engines: runAstInventory(apiSource, impl('from_engines', 'AuthorizationRuntime')),
    api_pool_take: runAstInventory(apiSource, impl('take', 'EnginePool')),
    api_pool_put: runAstInventory(apiSource, impl('put', 'EnginePool')),
    api_runtime_authorize: runAstInventory(apiSource, impl('authorize', 'AuthorizationRuntime')),
    api_engine_authorize: runAstInventory(apiSource, impl('authorize', 'SqliteAuthService < C >', 'AuthorizationEngine')),
    api_clock: runAstInventory(apiSource, impl('decision_time', 'SystemDecisionClock', 'DecisionClock')),
    service_open: runAstInventory(serviceSource, impl('open_with_epoch_allocator', 'SqliteAuthService < C >')),
    service_from_connection: runAstInventory(serviceSource, impl('from_connection_with_epoch_allocator', 'SqliteAuthService < C >')),
    service_authorize: runAstInventory(serviceSource, impl('authorize', 'SqliteAuthService < C >')),
    service_detailed: runAstInventory(serviceSource, impl('authorize_detailed_with_hook', 'SqliteAuthService < C >')),
    service_valid_inbound: runAstInventory(serviceSource, free('valid_inbound_request')),
    service_epoch_new: runAstInventory(serviceSource, impl('new', 'EpochAllocator')),
    service_epoch_allocate: runAstInventory(serviceSource, impl('allocate', 'EpochAllocator')),
    service_epoch_finish: runAstInventory(serviceSource, impl('finish', "AuthorizationEvaluationEpoch < '_ >")),
    service_in_epoch: runAstInventory(serviceSource, free('authorize_in_epoch')),
  };
  const bindings = [
    ['api_builder', 'service_epoch_new', 'function', 'EpochAllocator :: new', null, 1],
    ['api_builder', 'service_open', 'function', 'SqliteAuthService :: open_with_epoch_allocator', null, 1],
    ['api_builder', 'api_from_engines', 'function', 'AuthorizationRuntime :: from_engines', null, 1],
    ['service_open', 'service_from_connection', 'function', 'Self :: from_connection_with_epoch_allocator', null, 1],
    ['api_runtime_authorize', 'api_pool_take', 'method', 'take', 'pool', 1],
    ['api_runtime_authorize', 'api_engine_authorize', 'method', 'authorize', 'engine', 1],
    ['api_runtime_authorize', 'api_pool_put', 'method', 'put', 'pool', 1],
    ['api_engine_authorize', 'service_authorize', 'function', 'SqliteAuthService :: authorize', null, 1],
    ['service_authorize', 'service_detailed', 'method', 'authorize_detailed_with_hook', 'self', 1],
    ['service_detailed', 'service_valid_inbound', 'function', 'valid_inbound_request', null, 1],
    ['service_detailed', 'api_clock', 'method', 'decision_time', 'self . clock', 1],
    ['service_detailed', 'service_epoch_allocate', 'method', 'allocate', 'self . epoch_allocator', 1],
    ['service_detailed', 'service_in_epoch', 'function', 'authorize_in_epoch', null, 1],
    ['service_detailed', 'service_epoch_finish', 'method', 'finish', 'epoch', 1],
  ];
  const edges = bindings.map(([from, to, kind, callee, receiver, count]) => {
    const sites = nodes[from].sites.filter(site => site.kind === kind &&
      site.callee_syntax === callee && site.receiver_syntax === receiver);
    if (sites.length !== count) fail(`public-spine-edge-${from}-${to}`);
    return { from, to, site_ordinals: sites.map(site => site.ordinal), site_kind: kind,
      callee_syntax: callee, receiver_syntax: receiver,
      expression_syntaxes: sites.map(site => site.expression_syntax),
      closure_depths: sites.map(site => site.closure_depth) };
  });
  const edge = (from, to) => edges.find(item => item.from === from && item.to === to);
  same(edge('api_builder', 'service_open').expression_syntaxes,
    ['SqliteAuthService :: open_with_epoch_allocator (path . as_ref () , SystemDecisionClock , Arc :: clone (& epoch_allocator) ,)'],
    'public-spine-builder-concrete-engine');
  same(edge('api_runtime_authorize', 'api_engine_authorize').expression_syntaxes,
    ['engine . authorize (request)'], 'public-spine-dynamic-invocation');
  same(edge('service_authorize', 'service_detailed').expression_syntaxes,
    ['self . authorize_detailed_with_hook (request , | _ | { })'], 'public-spine-noop-hook');
  same(edge('service_detailed', 'service_in_epoch').expression_syntaxes,
    ['authorize_in_epoch (& epoch , request , after_trusted_input)'], 'public-spine-in-epoch-arguments');
  if (edge('api_runtime_authorize', 'api_engine_authorize').closure_depths[0] < 1) {
    fail('public-spine-worker-closure');
  }
  return {
    schema_version: 'auth-foundation.v4b-selected-public-entry-spine/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    api_source_sha256: publicPath.api_source_sha256,
    service_source_sha256: digest(serviceSource),
    selected_root: 'authorization_runtime_from_database',
    selected_instance: 'SqliteAuthService<SystemDecisionClock>',
    nodes, edges,
    pool_origin_binding: 'selected builder passes its engines vector to from_engines; pinned take/put bodies pop/push boxed dynamic engines',
    dispatch_binding: 'source-spelled engine.authorize(request) inside spawn_blocking closure; dynamic vtable and pool exclusivity not proved',
    selected_public_hook: 'service authorize supplies |_| {} to detailed method; callback transfer and external effects remain open',
    distinct_events: ['pre-kernel abort', 'kernel DENY', 'kernel READY then policy DENY or ALLOW',
      'post-call transaction finish failure', 'API timeout or worker error'],
    effect_status: 'open',
    unresolved: ['dynamic engine pool membership and vtable target', 'worker continuation after API timeout',
      'clock, allocator, SQLite and transaction effects', 'callback effect flow',
      'public-entry all-path reachability and complete call/leaf graph'],
    claim_limit: 'Partial selected source-site inventory and whole-body bindings only. The named call sites are not a connected execution graph: construction-to-pool transfer, dynamic dispatch, all-path reachability, collaborator effects, HTTP behavior, and zero calls for every public DENY remain unproved.',
  };
}

// Closed two-shape source-template reader for the selected database builder.
// Fixture mode admits one mixed-engine control beyond the production shape;
// neither shape proves Rust/Tokio execution or trait-object dispatch.
export function extractSelectedInstanceTransfer(apiSource, apiCargo, serviceSource, serviceCargo, { fixture = false } = {}) {
  for (const source of [apiSource, apiCargo, serviceSource, serviceCargo]) assert.equal(typeof source, 'string');
  if (digest(apiCargo) !== apiCargoPin || digest(serviceCargo) !== serviceCargoPin ||
      digest(serviceSource) !== servicePin) fail('instance-transfer-dependency-pin');
  if (!fixture && digest(apiSource) !== apiPin) fail('instance-transfer-api-pin');
  const originalApi = readFileSync(apiPath, 'utf8');
  const builderMarker = 'pub fn authorization_runtime_from_database(';
  const builder = selectedBody(apiSource, builderMarker);
  const originalBuilder = selectedBody(originalApi, builderMarker);
  const workerMarker = 'pub async fn authorize(';
  const workerBody = selectedBody(apiSource, workerMarker);
  const originalWorkerBody = selectedBody(originalApi, workerMarker);
  if (masked(apiSource, [builder, workerBody]) !== masked(originalApi, [originalBuilder, originalWorkerBody])) {
    fail('instance-transfer-outside-selected-bodies');
  }
  const alternateBlock = `    struct AlternateEngine;
    impl AuthorizationEngine for AlternateEngine {
        fn authorize(&mut self, _request: InboundAuthorizationRequest) -> BinaryAuthorizationDecision {
            BinaryAuthorizationDecision::Allow
        }
    }
    engines.push(Box::new(AlternateEngine));
`;
  const alternateCount = occurrences(builder.body, alternateBlock);
  if (alternateCount > 1 || (alternateCount > 0 && !fixture)) fail('instance-transfer-fixture-shape');
  const normalized = alternateCount === 1 ? builder.body.replace(alternateBlock, '') : builder.body;
  same(normalized, originalBuilder.body, 'instance-transfer-builder-grammar');
  const form = alternateCount === 1 ? 'mixed-engine-fixture' : 'selected-database-builder';
  const normalWorkerBranch = `            match outcome {
                Ok(decision) => {
                    pool.put(engine)?;
                    Ok(decision)
                }
                Err(_) => Err(AuthorizationRuntimeError::WorkerUnavailable),
            }`;
  const movedWorkerBranch = `            match outcome {
                Ok(decision) => Ok(decision),
                Err(_) => {
                    pool.put(engine)?;
                    Err(AuthorizationRuntimeError::WorkerUnavailable)
                }
            }`;
  if (occurrences(originalWorkerBody.body, normalWorkerBranch) !== 1) fail('instance-transfer-worker-baseline');
  const movedWorkerBody = originalWorkerBody.body.replace(normalWorkerBranch, movedWorkerBranch);
  const workerBranchForm = workerBody.body === originalWorkerBody.body ? 'normal-return-put' :
    (fixture && workerBody.body === movedWorkerBody ? 'error-return-put-fixture' : null);
  if (workerBranchForm === null) fail('instance-transfer-worker-grammar');
  const impl = (name, self_type, trait = null) => ({ kind: 'impl', name, self_type, trait });
  const nodes = {
    builder: runAstInventory(apiSource, { kind: 'free', name: 'authorization_runtime_from_database' }),
    from_engines: runAstInventory(apiSource, impl('from_engines', 'AuthorizationRuntime')),
    pool_take: runAstInventory(apiSource, impl('take', 'EnginePool')),
    pool_put: runAstInventory(apiSource, impl('put', 'EnginePool')),
    runtime_authorize: runAstInventory(apiSource, impl('authorize', 'AuthorizationRuntime')),
    trait_forward: runAstInventory(apiSource, impl('authorize', 'SqliteAuthService < C >', 'AuthorizationEngine')),
  };
  const site = (node, kind, callee, receiver, expression) => {
    const found = nodes[node].sites.filter(row => row.kind === kind && row.callee_syntax === callee &&
      row.receiver_syntax === receiver && row.expression_syntax === expression);
    if (found.length !== 1) fail(`instance-transfer-site-${node}-${callee}`);
    return { node, ordinal: found[0].ordinal, expression_syntax: expression };
  };
  const steps = [
    { site_role: 'fresh-vector', binding_label: 'engines', site: site('builder', 'function', 'Vec :: new', null, 'Vec :: new ()') },
    { site_role: 'selected-service-box-into-vector', binding_label: 'engines', site: site('builder', 'method', 'push', 'engines', 'engines . push (Box :: new (SqliteAuthService :: open_with_epoch_allocator (path . as_ref () , SystemDecisionClock , Arc :: clone (& epoch_allocator) ,) ?))') },
    { site_role: 'move-vector-into-runtime-constructor', binding_label: 'engines', site: site('builder', 'function', 'AuthorizationRuntime :: from_engines', null, 'AuthorizationRuntime :: from_engines (engines , config . acquisition_timeout , config . evaluation_timeout ,)') },
    { site_role: 'move-vector-into-private-pool-mutex', binding_label: 'engines', site: site('from_engines', 'function', 'Mutex :: new', null, 'Mutex :: new (engines)') },
    { site_role: 'clone-pool-handle-into-worker', binding_label: 'pool', site: site('runtime_authorize', 'function', 'Arc :: clone', null, 'Arc :: clone (& self . inner . pool)') },
    { site_role: 'take-box-from-pool', binding_label: 'engine', site: site('runtime_authorize', 'method', 'take', 'pool', 'pool . take ()') },
    { site_role: 'pop-box-from-mutex', binding_label: 'engine', site: site('pool_take', 'method', 'pop', 'self . engines . lock () . map_err (| _ | AuthorizationRuntimeError :: WorkerUnavailable) ?', 'self . engines . lock () . map_err (| _ | AuthorizationRuntimeError :: WorkerUnavailable) ? . pop ()') },
    { site_role: 'invoke-boxed-trait-object', binding_label: 'engine', site: site('runtime_authorize', 'method', 'authorize', 'engine', 'engine . authorize (request)') },
    { site_role: 'return-same-box-on-normal-result', binding_label: 'engine', site: site('runtime_authorize', 'method', 'put', 'pool', 'pool . put (engine)') },
    { site_role: 'push-box-back-into-mutex', binding_label: 'engine', site: site('pool_put', 'method', 'push', 'self . engines . lock () . map_err (| _ | AuthorizationRuntimeError :: WorkerUnavailable) ?', 'self . engines . lock () . map_err (| _ | AuthorizationRuntimeError :: WorkerUnavailable) ? . push (engine)') },
    { site_role: 'selected-trait-impl-forwarding', binding_label: 'self', site: site('trait_forward', 'function', 'SqliteAuthService :: authorize', null, 'SqliteAuthService :: authorize (self , request)') },
  ];
  const alternate = alternateCount === 1 ? site('builder', 'method', 'push', 'engines',
    'engines . push (Box :: new (AlternateEngine))') : null;
  const unique = (rows, predicate, reason) => {
    const matches = rows.filter(predicate);
    if (matches.length !== 1) fail(`instance-transfer-ast-${reason}`);
    return matches[0];
  };
  const local = (node, name) => unique(nodes[node].local_bindings,
    item => item.name === name, `${node}-local-${name}`);
  const builderVector = local('builder', 'engines');
  same([builderVector.type_syntax, builderVector.initializer_syntax, builderVector.mutable,
    builderVector.closure_depth, builderVector.control_context,
    builderVector.scope_path, builderVector.top_level_statement],
  ['Vec < Box < dyn AuthorizationEngine > >', 'Vec :: new ()', true, 0, [], [], 1],
  'instance-transfer-ast-builder-vector');
  const builderPush = unique(nodes.builder.sites, row => row.ordinal === steps[1].site.ordinal,
    'builder-push');
  same([builderPush.control_context, builderPush.closure_depth],
    [['for _ in 0 .. config . pool_size . get ()'], 0], 'instance-transfer-ast-builder-loop');
  same(nodes.from_engines.parameters[0], 'engines : Vec < Box < dyn AuthorizationEngine > >',
    'instance-transfer-ast-constructor-parameter');
  const poolStruct = unique(nodes.from_engines.struct_initializers,
    item => item.type_syntax === 'EnginePool', 'pool-struct');
  const poolField = unique(poolStruct.fields, item => item.member === 'engines', 'pool-field');
  same(poolField.expression_syntax, 'Mutex :: new (engines)', 'instance-transfer-ast-pool-field');
  const innerStruct = unique(nodes.from_engines.struct_initializers,
    item => item.type_syntax === 'AuthorizationRuntimeInner', 'runtime-inner-struct');
  const innerPoolField = unique(innerStruct.fields, item => item.member === 'pool', 'runtime-inner-pool');
  same(innerPoolField.expression_syntax, 'Arc :: new (EnginePool { engines : Mutex :: new (engines) , })',
    'instance-transfer-ast-runtime-inner-pool');
  const workerPool = local('runtime_authorize', 'pool');
  same([workerPool.initializer_syntax, workerPool.closure_depth,
    workerPool.scope_path, workerPool.top_level_statement],
    ['Arc :: clone (& self . inner . pool)', 0, [], 2], 'instance-transfer-ast-worker-pool');
  const worker = local('runtime_authorize', 'worker');
  if (!worker.initializer_syntax.startsWith('tokio :: task :: spawn_blocking (move | | {')) {
    fail('instance-transfer-ast-move-worker');
  }
  const workerEngine = local('runtime_authorize', 'engine');
  const workerOutcome = local('runtime_authorize', 'outcome');
  same([workerEngine.initializer_syntax, workerEngine.mutable, workerEngine.closure_depth,
    workerEngine.scope_path, workerOutcome.scope_path],
  ['pool . take () ?', true, 1, [1], [1]], 'instance-transfer-ast-worker-engine');
  const workerCall = unique(nodes.runtime_authorize.sites,
    item => item.ordinal === steps[7].site.ordinal, 'worker-call');
  const workerPut = unique(nodes.runtime_authorize.sites,
    item => item.ordinal === steps[8].site.ordinal, 'worker-put');
  same([workerCall.closure_depth, workerCall.scope_path, workerPut.closure_depth,
    workerPut.control_context],
  [2, [1], 1, workerBranchForm === 'normal-return-put' ?
    ['match outcome arm 0 Ok (decision)'] : ['match outcome arm 1 Err (_)']],
  'instance-transfer-ast-worker-branch');
  const astBindingFacts = {
    source_kind: 'syn-parsed-selected-syntax',
    builder_vector: { binding_label: 'builder/root/engines', ...builderVector },
    builder_loop_push: { site_ordinal: builderPush.ordinal,
      control_context: builderPush.control_context, scope_path: builderPush.scope_path },
    constructor_parameter: { binding_label: 'from_engines/parameter/engines',
      syntax: nodes.from_engines.parameters[0] },
    pool_field: { binding_label: 'from_engines/EnginePool.engines', ...poolField },
    runtime_pool_field: { binding_label: 'from_engines/AuthorizationRuntimeInner.pool',
      ...innerPoolField },
    worker_pool: { binding_label: 'runtime_authorize/root/pool', ...workerPool },
    worker_engine: { binding_label: 'runtime_authorize/worker/engine', ...workerEngine },
    worker_call: { site_ordinal: workerCall.ordinal, closure_depth: workerCall.closure_depth,
      scope_path: workerCall.scope_path },
    worker_put_branch: { site_ordinal: workerPut.ordinal,
      control_context: workerPut.control_context, scope_path: workerPut.scope_path },
    source_spelled_correspondences: [
      ['builder/root/engines', 'from_engines/parameter/engines', 'same-spelled-call-argument-and-parameter'],
      ['from_engines/parameter/engines', 'from_engines/EnginePool.engines', 'same-spelled-field-initializer'],
      ['from_engines/AuthorizationRuntimeInner.pool', 'runtime_authorize/root/pool', 'same-spelled-pool-field-clone'],
      ['runtime_authorize/root/pool', 'runtime_authorize/worker/engine', 'same-spelled-take-receiver'],
    ],
    ownership_and_dispatch_proved: false,
    kernel_ready_dominance_proved: false,
  };
  const origins = alternate ? ['SqliteAuthService<SystemDecisionClock>', 'AlternateEngine'] :
    ['SqliteAuthService<SystemDecisionClock>'];
  return {
    schema_version: 'auth-foundation.v4b-selected-instance-transfer/v1-candidate',
    status: 'indeterminate', runtime_guarantees_observed: false,
    api_source_sha256: digest(apiSource), service_source_sha256: digest(serviceSource),
    form, worker_branch_form: workerBranchForm,
    normal_return_repool_template_property: workerBranchForm === 'normal-return-put',
    selected_builder_only: true, generic_from_engines_origin_set: 'unconstrained',
    template_origin_set: origins, selected_origin_template_property: alternate === null,
    alternate_origin_site: alternate, source_matched_transfer_sites: steps,
    ast_binding_facts: astBindingFacts,
    assumptions: ['Rust move and trait-object coercion semantics', 'private pool remains inaccessible to callers',
      'Arc, Mutex, Vec, Box and Tokio worker semantics', 'trait-object dispatch targets concrete boxed type'],
    unresolved: ['dynamic dispatch and all-path execution proof', 'timeout worker continuation',
      'panic and pool return failure', 'collaborator and callback effects'],
    claim_limit: 'AST-annotated source correspondences under closed selected-builder and worker byte templates: 11 matched call sites, parsed local/parameter/field syntax, and loop and match-arm contexts. Binding labels are constructed, not resolved symbols. Compiled mixed-engine and moved-put fixtures falsify their respective template properties. This is not Rust type resolution, a capture or general def-use/CFG proof, kernel-READY dominance, dynamic dispatch, runtime observation, or a guarantee for public from_engines callers.',
  };
}

export function checkSelectedGraph(preResolved, wrapperIR, serviceTailIR) {
  if (preResolved.extra_pre_kernel_calls !== 0 ||
      JSON.stringify(preResolved.receiver_path) !== JSON.stringify([
        'TrustedAuthorizationBoundary::authorize(request)', 'BorrowedDecision(downstream)::authorize(command)', 'self.0.authorize(command)',
      ])) fail('pre-resolved-receiver');
  if (!serviceTailIR || serviceTailIR.selected_adapter_instance !== 'ResolvedDecisionService:A0' ||
      serviceTailIR.same_instance_receiver !== true ||
      !Number.isInteger(serviceTailIR.prefix_adapter_calls) ||
      serviceTailIR.prefix_adapter_calls < 0) fail('service-tail-graph-input');
  const calls = actions => actions.filter(action => action === 'callDownstream').length;
  const prefix = serviceTailIR.prefix_adapter_calls + calls(wrapperIR.prefixActions);
  const deny = prefix + calls(wrapperIR.branches.deny);
  const ready = prefix + calls(wrapperIR.branches.ready);
  return {
    kernel_event: 'boundary_kernel::admit_authorization_command(&context)',
    selected_endpoint: 'wrapper-direct-downstream-call-through-BorrowedDecision',
    selected_adapter_instance: serviceTailIR.selected_adapter_instance,
    pre_kernel_adapter_calls: serviceTailIR.prefix_adapter_calls,
    deny_endpoint_calls: deny,
    ready_endpoint_calls: ready,
    branch_property: deny === 0 && ready === 1,
  };
}

export function evaluateCurrent() {
  if (digest(readFileSync(trustedFacadePath)) !== trustedFacadePin ||
      digest(readFileSync(trustedFacadeCargoPath)) !== trustedFacadeCargoPin ||
      digest(readFileSync(trustedFacadeLockPath)) !== trustedFacadeLockPin ||
      digest(readFileSync(sqliteProviderPath)) !== sqliteProviderPin ||
      digest(readFileSync(sqliteProviderCargoPath)) !== sqliteProviderCargoPin ||
      digest(readFileSync(sqliteProviderCargoLockPath)) !== sqliteProviderCargoLockPin ||
      digest(readFileSync(runtimeAdapterPath)) !== runtimeAdapterPin ||
      digest(readFileSync(runtimeAdapterCargoPath)) !== runtimeAdapterCargoPin ||
      digest(readFileSync(runtimeAdapterCargoLockPath)) !== runtimeAdapterCargoLockPin ||
      digest(readFileSync(legacyBoundaryPath)) !== legacyBoundaryPin) {
    fail('native-policy-endpoint-source-pin');
  }
  const sharedRequestOwnership = selectedSharedRequestOwnership(
    readFileSync(stateModelPath, 'utf8'), readFileSync(runtimeAdapterPath, 'utf8'),
    readFileSync(legacyBoundaryPath, 'utf8'), readFileSync(wrapperSourcePath, 'utf8'),
    readFileSync(servicePath, 'utf8'), readFileSync(serviceCargoPath, 'utf8'),
    readFileSync(apiPath, 'utf8'), readFileSync(apiCargoPath, 'utf8'));
  const preResolvedSource = readFileSync(sourcePath, 'utf8');
  const serviceSource = readFileSync(servicePath, 'utf8');
  const wrapperSource = readFileSync(fileURLToPath(new URL('../../../implementation/trusted-boundary-v2/src/lib.rs', import.meta.url)), 'utf8');
  const preResolved = extractPreResolved(preResolvedSource, readFileSync(cargoPath, 'utf8'));
  const service = extractServiceBinding(serviceSource, readFileSync(serviceCargoPath, 'utf8'));
  const wrapperIR = extractCurrentWrapper();
  const publicPath = extractSelectedPublicPath(
    readFileSync(apiPath, 'utf8'), readFileSync(apiCargoPath, 'utf8'),
    readFileSync(servicePath, 'utf8'), readFileSync(serviceCargoPath, 'utf8'),
  );
  const publicEntrySpine = extractSelectedPublicEntrySpine(
    readFileSync(apiPath, 'utf8'), readFileSync(apiCargoPath, 'utf8'),
    readFileSync(servicePath, 'utf8'), readFileSync(serviceCargoPath, 'utf8'),
  );
  const selectedInstanceTransfer = extractSelectedInstanceTransfer(
    readFileSync(apiPath, 'utf8'), readFileSync(apiCargoPath, 'utf8'),
    readFileSync(servicePath, 'utf8'), readFileSync(serviceCargoPath, 'utf8'),
  );
  const providerRoots = extractSelectedProviderRoots(
    readFileSync(trustedProviderPath, 'utf8'), readFileSync(trustedProviderCargoPath, 'utf8'),
    readFileSync(stateReaderPath, 'utf8'), readFileSync(stateReaderCargoPath, 'utf8'),
  );
  const trustedProviderGraph = extractSelectedTrustedProviderGraph(
    readFileSync(trustedProviderPath, 'utf8'), readFileSync(trustedProviderCargoPath, 'utf8'),
    readFileSync(trustedRuntimePath, 'utf8'), readFileSync(trustedRuntimeCargoPath, 'utf8'),
  );
  const sqliteProviderGraph = extractSelectedSqliteProviderGraph(
    readFileSync(stateReaderPath, 'utf8'), readFileSync(stateReaderCargoPath, 'utf8'),
    readFileSync(stateModelPath, 'utf8'), readFileSync(stateModelCargoPath, 'utf8'),
  );
  const serviceJoinGraph = extractSelectedServiceJoinGraph(
    readFileSync(servicePath, 'utf8'), readFileSync(serviceCargoPath, 'utf8'),
    readFileSync(stateReaderPath, 'utf8'), readFileSync(stateReaderCargoPath, 'utf8'),
    readFileSync(stateModelPath, 'utf8'), readFileSync(stateModelCargoPath, 'utf8'),
  );
  const serviceHelperGraph = extractSelectedServiceHelperGraph(
    readFileSync(servicePath, 'utf8'), readFileSync(serviceCargoPath, 'utf8'),
  );
  const selectedSiteManifest = selectedParsedSiteManifest(service.ast_pre_tail_inventory,
    providerRoots, trustedProviderGraph, sqliteProviderGraph, serviceJoinGraph, serviceHelperGraph);
  const boundaryChain = selectedBoundaryChain(service, preResolved, wrapperIR,
    serviceSource, preResolvedSource, wrapperSource);
  const rootedFrontier = selectedRootedCallFrontier(publicEntrySpine, selectedSiteManifest,
    service.ast_pre_tail_inventory, selectedInstanceTransfer, boundaryChain);
  const identifierFunctionValueBridge = selectedIdentifierFunctionValueBridge(
    serviceHelperGraph, selectedSiteManifest, rootedFrontier);
  const preResultEffectInventory = selectedPreResultEffectInventory(
    rootedFrontier, identifierFunctionValueBridge, selectedSiteManifest);
  const reachedClosureCatalog = selectedReachedClosureCatalog(preResultEffectInventory,
    publicEntrySpine, selectedSiteManifest, boundaryChain, rootedFrontier);
  const sqlRowCallbackBridge = selectedSqlRowCallbackBridge(reachedClosureCatalog,
    rootedFrontier, preResultEffectInventory);
  const sqlRowIteratorCallbackBridge = selectedSqlRowIteratorCallbackBridge(
    reachedClosureCatalog, rootedFrontier, preResultEffectInventory);
  const sqlRowIteratorConsumerBridge = selectedSqlRowIteratorConsumerBridge(
    reachedClosureCatalog, rootedFrontier, preResultEffectInventory);
  const sqlIteratorDependencySemantics = selectedSqlIteratorDependencySemantics(
    sqlRowIteratorConsumerBridge);
  const graph = checkSelectedGraph(preResolved, wrapperIR, service.service_tail_ir);
  return {
    schema_version: 'auth-foundation.v4b-concrete-call-certificate/v1-candidate',
    status: 'indeterminate',
    verified_sublemma: graph.branch_property ? 'selected-public-path-service-tail-and-wrapper-direct-site-shape' : 'none',
    source_sha256: preResolved.source_sha256,
    cargo_sha256: preResolved.cargo_sha256,
    service_source_sha256: service.source_sha256,
    service_cargo_sha256: service.cargo_sha256,
    api_source_sha256: publicPath.api_source_sha256,
    api_cargo_sha256: publicPath.api_cargo_sha256,
    selected_builder_engine_shape: publicPath.selected_builder_engine_shape,
    selected_public_hook_shape: publicPath.selected_public_hook_shape,
    selected_public_entry_spine: publicEntrySpine,
    selected_instance_transfer: selectedInstanceTransfer,
    selected_detailed_in_epoch_call_occurrence: publicPath.selected_detailed_in_epoch_call_occurrence,
    selected_call_receiver_shape: service.selected_call_receiver_shape,
    selected_shared_request_ownership: sharedRequestOwnership,
    source_counter_increment_shape: service.source_counter_increment_shape,
    selected_call_reachable_from_tail_entry: service.selected_call_reachable_from_tail_entry,
    tail_statement_count: service.tail_statement_count,
    service_tail_ir: service.service_tail_ir,
    tail_claim_limit: 'The pinned syn reader segments all top-level selected tail statements. A closed two-shape token grammar accepts the current inline adapter path and one named same-instance eager-call fixture, and rejects other shapes. This is not a generic CFG, alias, dataflow, or transitive-effect proof. The separate fixture test uses offline cargo check for type checking; this certificate does not observe runtime calls.',
    pre_tail_inventory: service.pre_tail_inventory,
    ast_pre_tail_inventory: service.ast_pre_tail_inventory,
    provider_root_inventories: providerRoots,
    trusted_provider_graph: trustedProviderGraph,
    sqlite_provider_graph: sqliteProviderGraph,
    service_join_graph: serviceJoinGraph,
    service_helper_graph: serviceHelperGraph,
    selected_parsed_site_manifest: selectedSiteManifest,
    selected_boundary_chain: boundaryChain,
    selected_rooted_call_frontier: rootedFrontier,
    selected_identifier_function_value_bridge: identifierFunctionValueBridge,
    selected_pre_result_effect_inventory: preResultEffectInventory,
    selected_reached_closure_catalog: reachedClosureCatalog,
    selected_sql_row_callback_bridge: sqlRowCallbackBridge,
    selected_sql_row_iterator_callback_bridge: sqlRowIteratorCallbackBridge,
    selected_sql_row_iterator_consumer_bridge: sqlRowIteratorConsumerBridge,
    selected_sql_iterator_dependency_semantics: sqlIteratorDependencySemantics,
    graph,
    unresolved: [
      'service-helper-and-callback-closure',
      'service-helper-function-value-and-implicit-effects',
      'public-entry-to-service-tail-reachability-and-effects',
      'selected-builder-general-typed-def-use-and-path-condition-proof',
      'public-entry-dynamic-engine-pool-dispatch-and-worker-continuation',
      'public-entry-clock-allocator-transaction-and-callback-effects',
      'selected-clock-and-provider-effect-closure',
      'implicit-operations-and-macro-expansion-effects',
      'selected-parsed-site-manifest-has-open-effects-and-unselected-bodies',
      'reached-closure-catalog-has-unresolved-invocation-and-open-effects',
      'selected-wrapper-gate-bridge-has-open-effects-and-unproved-semantic-preservation',
      'full-downstream-endpoint-interpretation',
      'normal-context-and-list-correspondence',
    ],
    authority_effect: 'none',
    runtime_guarantees_observed: false,
    claim_limit: 'Source-pinned selected database builder, clock, trait forwarding, public no-op hook and one exact in_epoch call occurrence in the detailed body; the entire lexed in-epoch prefix before the routes-tail is bound to pinned source. A pinned syn reader enumerates parsed explicit call and macro nodes in that prefix, both read-only provider roots, six named trusted-input edge-presence bindings, fifteen named SQL state-reader/model edge-presence bindings, ten named service-join/snapshot-accessor edge bindings, and nine selected helper edges across service and metadata-reader crates. The two metadata bodies are source- and Cargo-pinned in a separate read-only crate. The selected SQL resolver and snapshot accessors are source-pinned in the authorization-state-reader crate; the state constructor and accessors are source-pinned in the authorization-state-model crate. The selected service imports that reader directly and its adapter spells authorize_resolved only in the post-READY forwarding path. The legacy sqlite-provider decision facade and runtime adapter are separately source- and Cargo-pinned but their complete effects are not closed. A finite manifest partitions every selected parsed explicit site into a named source edge or unresolved boundary; all site effects remain open and this is not a complete reachable leaf manifest. The selected rooted projection includes source-pinned resolver, candidate-construction, command-conversion and generated-kernel gate bodies before the wrapper READY branch, BorrowedDecision and selected adapter; generic/trait binding, iterator callbacks and semantic preservation of the accepted rule remain assumptions or open obligations. The four selected SQL resolver calls are inherent SqliteSnapshot methods in the reader, with exact receiver and argument expressions and duplicate-method checks; compiler checking is external to this reader. Selected join/accessor bodies have whole-lexed-body equality to pinned source. The state constructor has an exact source-spelled five-argument mapping, with pinned resolver-body bytes and model constructor signature/body; this is template evidence, not generic dataflow. The selected char::is_control function value is separately bound as a latent open callback boundary, not a resolved target or explicit call. Implicit Try, iterator and SQL callbacks, dynamic targets and external effects remain open. This does not expand macros, cover implicit operations, or close effects. Straight-line service tail reaches the selected call from its tail entry in normal execution; adapter shape and wrapper direct-site counts are checked. No detailed-body CFG or end-to-end public-entry-to-tail reachability, pre-tail helper/effect closure, or all-path no-call proof.',
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.stdout.write(`${JSON.stringify(evaluateCurrent(), null, 2)}\n`);
}
