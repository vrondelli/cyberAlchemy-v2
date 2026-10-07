import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { assertGeneratedPolicyCargoTarget, assertScannedCargoTargets,
  assertSelectedProductionClassified, evaluateCurrent, generatedPolicySurface,
  matchKnown, parseSurface, policyBindingContract, rustFiles, sourceRole } from './auth-v4b-native-endpoint-inventory-v2.mjs';

const policySource = 'standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs';
const policyManifest = 'standard-runtime/Cargo.toml';
const policyPackage = 'auth-foundation-operation-auth-exact-permission-authorize';
const policyPath = new URL('../../../implementation/standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs', import.meta.url);
const policyManifestPath = new URL('../../../implementation/standard-runtime/Cargo.toml', import.meta.url);
const graphPath = new URL('../../../implementation/standard-conformance/compiled-operation-graph.json', import.meta.url);
const selectedRoots = Object.fromEntries(['api', 'tenant', 'prototype', 'https'].map(id =>
  [id, { manifests: [policyManifest] }]));
const policyBindings = () => policyBindingContract(readFileSync(policyPath, 'utf8'),
  JSON.parse(readFileSync(graphPath, 'utf8')));

function generatedFixture(source) {
  const parsed = parseSurface(source);
  return {
    functions: parsed.functions.map(row => ({ source: policySource, crate: policyPackage,
      package_manifest: policyManifest,
      source_role: sourceRole(policySource, row, { name: policyPackage }), ...row })),
    opaque: parsed.opaque.map(row => ({ source: policySource, ...row })),
  };
}

test('current syntax-wide inventory stays candidate-only and shows raw legacy APIs', () => {
  const result = evaluateCurrent();
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.endpoint_set_closed, false);
  assert.equal(result.all_path_ready_dominance, false);
  assert.equal(result.runtime_guarantees_observed, false);
  assert.equal(result.unclassified_selected_production_suspect_count, 0);
  assert.equal(result.public_capturing_lower_authority, false);
  assert.ok(!result.open_effects.some(effect => effect.includes('DENY drop effects')));
  assert.match(result.known_entrypoints.find(row => row.id === 'lower-ready-authority').signature,
    /continuation : fn \(/);
  assert.ok(result.rust_source_count >= 40);
  assert.ok(result.parsed_function_count > result.known_entrypoint_count);
  assert.deepEqual(result.known_entrypoints.map(row => row.id), [
    'ready-decision', 'generated-policy', 'sqlite-service', 'sqlite-transaction',
    'sqlite-snapshot', 'runtime-adapter', 'runtime-resolved',
    'lower-ready-authority', 'legacy-service-facade',
    'legacy-boundary-trait',
    'legacy-boundary-wrapper', 'v2-boundary-trait', 'v2-boundary-wrapper',
    'pre-resolved-borrowed-dispatch', 'pre-resolved-wrapper',
    'command-boundary-gate', 'admission-service-with-ready',
    'api-runtime-authorize', 'api-http-authorize', 'tenant-bridge-evaluate',
    'prototype-bridge-evaluate', 'https-bridge-evaluate',
  ]);
  for (const id of ['sqlite-service', 'sqlite-transaction', 'sqlite-snapshot',
    'runtime-adapter', 'runtime-resolved', 'legacy-service-facade',
    'legacy-boundary-trait',
    'legacy-boundary-wrapper', 'v2-boundary-trait', 'v2-boundary-wrapper',
    'pre-resolved-borrowed-dispatch', 'pre-resolved-wrapper']) {
    const row = result.known_entrypoints.find(entry => entry.id === id);
    assert.deepEqual(row.selected_root_cargo_membership, []);
  }
  assert.deepEqual(result.known_entrypoints.find(row => row.id === 'ready-decision')
    .selected_root_cargo_membership.sort(), ['api', 'https', 'prototype', 'tenant']);
  assert.throws(() => matchKnown(result.known_entrypoints.filter(row =>
    row.id !== 'pre-resolved-wrapper')), /known-entrypoint:pre-resolved-wrapper:0/);
  const historicalPolicy = result.unclassified_suspects.find(row =>
    row.source === 'current-runtime-successor-v1/standard/src/domainspec/rust/auth-exact-permission/authorize.rs' &&
    row.name === 'authorize');
  assert.ok(historicalPolicy, 'historical same-name policy mirror remains visible');
  assert.equal(historicalPolicy.source_role, 'historical-mirror');
  assert.deepEqual(historicalPolicy.selected_root_cargo_membership, [],
    'Cargo package name equality must not imply package identity or reachability');
  assert.ok(result.opaque_edge_count > 0);
  assert.equal(result.generated_policy_callable_count, 9);
  assert.equal(result.generated_policy_endpoint_roles_closed, false);
  assert.equal(result.protected_generated_policy_surface_complete, true);
  assert.ok(result.generated_policy_callables.every(row => row.conservative_downstream_risk));
  assert.deepEqual(result.generated_policy_callables.map(row => row.name), [
    'allow_iff', 'authorization_admissible', 'authorize', 'complete_active_roles',
    'default_deny', 'exact_active_role_grant', 'session_current', 'trusted_scope',
    'unique_resolved_session',
  ]);
  assert.equal(result.generated_policy_callables.find(row => row.name === 'authorize').role,
    'known-full-decision-entrypoint');
  assert.equal(result.generated_policy_callables.find(row => row.name === 'allow_iff').role,
    'policy-callable-role-unresolved');
  assert.equal(result.generated_policy_callables.find(row => row.name === 'allow_iff').protection_role,
    'authorization-policy-predicate');
  const boundarySource = readFileSync(new URL('../../../implementation/trusted-boundary/src/lib.rs', import.meta.url), 'utf8');
  assert.ok(!boundarySource.includes('for auth_foundation_sqlite_provider::SqliteAuthorizationService'),
    'removed concrete SQLite dispatch must not silently return');
  assert.ok(result.opaque_edges.some(row => row.kind === 'unresolved-symlink-source' &&
    row.source === 'authentication-durable/.runtime'));
});

test('generated policy Cargo target binds exact manifest, lib source, and all selected roots', () => {
  const packageRow = { manifest_path: fileURLToPath(policyManifestPath), name: policyPackage,
    targets: [{ src_path: fileURLToPath(policyPath), kind: ['lib'] }] };
  const packages = Object.fromEntries(Object.keys(selectedRoots).map(id => [id, [packageRow]]));
  assert.doesNotThrow(() => assertGeneratedPolicyCargoTarget(packages));
  assert.throws(() => assertGeneratedPolicyCargoTarget({ ...packages, api: [{ ...packageRow,
    targets: [{ src_path: '/tmp/other.rs', kind: ['lib'] }] }] }),
  /generated-policy-cargo-target:api/);
  assert.throws(() => assertGeneratedPolicyCargoTarget({ api: [packageRow] }),
    /generated-policy-root-set/);
});

test('current generated policy gate sees every callable and rejects filtered-out Boolean additions', () => {
  const source = readFileSync(policyPath, 'utf8');
  const bindings = policyBindings();
  const current = generatedFixture(source);
  assert.equal(generatedPolicySurface(current.functions, current.opaque, selectedRoots, bindings).length, 9);
  const added = generatedFixture(`${source}\npub fn unrelated_name(_: &EvaluationContext) -> bool { true }\n`);
  assert.throws(() => generatedPolicySurface(added.functions, added.opaque, selectedRoots, bindings),
    /generated-policy-count:10/);
  const hidden = generatedFixture(source.replace('pub fn allow_iff(', 'fn allow_iff('));
  assert.throws(() => generatedPolicySurface(hidden.functions, hidden.opaque, selectedRoots, bindings),
    /generated-policy-function:allow_iff/);
  const reshaped = generatedFixture(source.replace(
    'pub fn default_deny(context: &EvaluationContext) -> bool',
    'pub fn default_deny(context: &EvaluationContext) -> usize'));
  assert.throws(() => generatedPolicySurface(reshaped.functions, reshaped.opaque, selectedRoots, bindings),
    /generated-policy-function:default_deny/);
  const extraParameter = generatedFixture(source.replace(
    'pub fn allow_iff(context: &EvaluationContext) -> bool',
    'pub fn allow_iff(context: &EvaluationContext, raw: bool) -> bool'));
  assert.throws(() => generatedPolicySurface(extraParameter.functions,
    extraParameter.opaque, selectedRoots, bindings), /generated-policy-function:allow_iff/);
  assert.throws(() => generatedPolicySurface(current.functions.filter(row =>
    row.name !== 'allow_iff'), current.opaque, selectedRoots, bindings), /generated-policy-count:8/);
  assert.throws(() => generatedPolicySurface([...current.functions,
    current.functions.find(row => row.name === 'allow_iff')], current.opaque, selectedRoots, bindings),
  /generated-policy-count:10/);
});

test('Rule protection set is joined to typed closure and generated bindings', () => {
  const source = readFileSync(policyPath, 'utf8');
  const graph = JSON.parse(readFileSync(graphPath, 'utf8'));
  assert.equal(policyBindingContract(source, graph).size, 8);
  assert.throws(() => policyBindingContract(source.replace('"allow_iff"),', '"renamed_allow_iff"),'), graph),
    /policy-binding-rule-join/);
  assert.throws(() => policyBindingContract(source, { ...graph, typed_closure: {
    ...graph.typed_closure, rules: graph.typed_closure.rules.slice(1) } }),
  /policy-binding-rule-join/);
  assert.throws(() => policyBindingContract(source, { ...graph, typed_closure: {
    ...graph.typed_closure, closure_sha256: '0'.repeat(64) } }),
  /policy-binding-closure-digest/);
  const bindings = policyBindings();
  bindings.delete('allow_iff');
  const current = generatedFixture(source);
  assert.throws(() => generatedPolicySurface(current.functions, current.opaque, selectedRoots, bindings),
    /generated-policy-rule-bindings/);
});

test('generated policy gate rejects opaque re-exports, include macros, and external modules', () => {
  const source = readFileSync(policyPath, 'utf8');
  const bindings = policyBindings();
  for (const mutation of ['pub use crate::allow_iff as exported_alias;',
    'include!("other_policy.rs");', 'mod extra_policy;']) {
    const changed = generatedFixture(`${source}\n${mutation}\n`);
    assert.ok(changed.opaque.length > 0, mutation);
    assert.throws(() => generatedPolicySurface(changed.functions, changed.opaque, selectedRoots, bindings),
      /generated-policy-opaque:/);
  }
});

test('cfg classification distinguishes test, normal, and mixed conditions', () => {
  const parsed = parseSurface(`
    #[cfg(test)] pub fn authorize_test() -> BinaryAuthorizationDecision { todo!() }
    #[cfg(not(test))] pub fn authorize_normal() -> BinaryAuthorizationDecision { todo!() }
    #[cfg(any(test, feature = "extra"))] pub fn authorize_mixed() -> BinaryAuthorizationDecision { todo!() }
  `);
  const roles = Object.fromEntries(parsed.functions.map(row =>
    [row.name, sourceRole('sample/src/lib.rs', row, { name: 'sample' })]));
  assert.deepEqual(roles, {
    authorize_test: 'test-only-or-cfg-test',
    authorize_normal: 'production-source-candidate',
    authorize_mixed: 'cfg-conditional-candidate',
  });
});

test('source walk records symlinked Rust files and directories as unresolved', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'auth-v4b-symlinks-'));
  try {
    const real = join(fixture, 'real.rs');
    writeFileSync(real, 'pub fn authorize() {}');
    mkdirSync(join(fixture, 'nested'));
    symlinkSync(real, join(fixture, 'linked.rs'));
    symlinkSync(join(fixture, 'nested'), join(fixture, 'linked-dir'));
    const result = rustFiles(fixture);
    assert.deepEqual(result.files, [real]);
    assert.deepEqual(result.symlinks, [join(fixture, 'linked-dir'), join(fixture, 'linked.rs')]);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('selected Cargo target root omitted from scan fails closed', () => {
  const packages = [{ targets: [{ src_path: '/unscanned/auth/src/lib.rs' }] }];
  assert.throws(() => assertScannedCargoTargets(packages, new Set(), 'api'),
    /selected-target-unscanned:api:/);
});

test('new selected production decision surface fails until classified', () => {
  assert.throws(() => assertSelectedProductionClassified([{
    source: 'authorization-api/src/lib.rs', kind: 'free', owner: null,
    name: 'authorize_shadow', source_role: 'production-source-candidate',
    selected_root_cargo_membership: ['api'],
  }]), /unclassified-selected-production:authorization-api\/src\/lib.rs:free::authorize_shadow/);
  assert.doesNotThrow(() => assertSelectedProductionClassified([{
    source: 'authorization-api/src/http_api_tests.rs', kind: 'free', owner: null,
    name: 'authorize_shadow', source_role: 'test-only-or-cfg-test',
    selected_root_cargo_membership: ['api'],
  }]));
});

test('syntax scan exposes new decision-shaped API instead of silently retaining old list', () => {
  const parsed = parseSurface(`pub fn authorize_shadow() -> AuthorizationDecision { todo!() }
    pub trait Engine { fn decide(&self) -> AuthorizationDecision; }`);
  assert.ok(parsed.functions.some(row => row.kind === 'free' && row.name === 'authorize_shadow'));
  assert.ok(parsed.functions.some(row => row.kind === 'trait' && row.name === 'decide'));
  assert.equal(parsed.cfg_expanded, false);
  assert.equal(parsed.transitive_effect_closure, false);
});

test('missing known native endpoint fails closed', () => {
  assert.throws(() => matchKnown([]), /known-entrypoint:ready-decision:0/);
});
