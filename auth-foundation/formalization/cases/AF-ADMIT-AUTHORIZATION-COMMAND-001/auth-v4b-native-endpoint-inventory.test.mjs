import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { evaluateCurrent } from './auth-v4b-concrete-pool-successor.mjs';
import { checkNativeEndpointInventory } from './auth-v4b-native-endpoint-inventory.mjs';

const manifestPath = fileURLToPath(new URL('./AUTH-V4B-NATIVE-ENDPOINT-INVENTORY.v1-candidate.json', import.meta.url));
const repositoryRoot = resolve(dirname(manifestPath), '../../../..');
const historicalManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const copy = value => structuredClone(value);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

// The historical v1 source pins intentionally reject current migrated sources.
// These synthetic inputs exercise the old structural checker without pretending
// that its old source-bound result is current evidence.
const manifest = copy(historicalManifest);
for (const [id, path] of Object.entries({
  sqlite: 'auth-foundation/implementation/sqlite-provider/src/lib.rs',
  runtime_adapter: 'auth-foundation/implementation/runtime-adapter/src/lib.rs',
})) manifest.legacy_source_sha256[id] = sha(readFileSync(resolve(repositoryRoot, path)));
const policy = 'auth-foundation-operation-auth-exact-permission-authorize';
const decision = 'auth-foundation-authorization-ready-decision';
const successor = {
  schema_version: 'auth-foundation.v4b-concrete-pool-successor/v3-candidate',
  status: 'indeterminate', runtime_guarantees_observed: false,
  selected_roots: copy(manifest.selected_roots),
  source_sha256: Object.fromEntries([
    'api', 'service', 'authority', 'decision', 'admission', 'policy',
    'tenant', 'prototype', 'https',
  ].map(id => [id, '0'.repeat(64)])),
  cargo: Object.fromEntries(['api', 'tenant', 'prototype', 'https'].map(id => [id, {
    local_crates: [decision, policy],
    local_edges: [`${decision}->${policy}`],
    legacy_decision_crates_reachable: false,
  }])),
  open_edges: ['generated policy remains a public raw-context function'],
};

test('historical v1 source pins reject the current migrated checkout', () => {
  assert.notEqual(sha(readFileSync(resolve(repositoryRoot,
    'auth-foundation/implementation/authorization-api/src/lib.rs'))),
  '52b49c4c3d7a85fa25c8e5a2fdbbb79c1ec32e89b08bc53792ec2952a27b9228');
  assert.throws(() => evaluateCurrent(), /source-drift:api/);
});

test('synthetic historical inventory shape remains explicitly indeterminate', () => {
  const result = checkNativeEndpointInventory(manifest, successor);
  assert.equal(result.status, 'indeterminate');
  assert.equal(result.known_selected_policy_endpoint_count, 2);
  assert.equal(result.known_legacy_policy_endpoint_count, 5);
  assert.equal(result.known_legacy_decision_edge_count, 1);
  assert.deepEqual(result.selected_policy_direct_importers,
    ['auth-foundation-authorization-ready-decision']);
  assert.equal(result.endpoint_set_closed, false);
  assert.equal(result.all_path_ready_dominance, false);
  assert.equal(result.runtime_guarantees_observed, false);
});

test('omitting a native entrypoint or relabeling admission is rejected', () => {
  const missing = copy(manifest);
  missing.known_legacy_policy_endpoints.splice(1, 1);
  assert.throws(() => checkNativeEndpointInventory(missing, successor), /legacy-endpoints/);
  const missingFallback = copy(manifest);
  missingFallback.known_legacy_decision_edges = [];
  assert.throws(() => checkNativeEndpointInventory(missingFallback, successor), /legacy-decision-edges/);
  const relabeled = copy(manifest);
  relabeled.non_policy_surfaces[0].source_id = 'policy';
  assert.throws(() => checkNativeEndpointInventory(relabeled, successor), /non-policy/);
});

test('selected-root redirection into a legacy decision crate is rejected', () => {
  const redirected = copy(successor);
  redirected.cargo.api.local_crates.push('auth-foundation-sqlite-provider');
  assert.throws(() => checkNativeEndpointInventory(manifest, redirected), /cargo-closure:api/);
  const omitted = copy(successor);
  omitted.cargo.tenant.local_crates = omitted.cargo.tenant.local_crates.filter(
    name => name !== 'auth-foundation-authorization-ready-decision');
  assert.throws(() => checkNativeEndpointInventory(manifest, omitted), /cargo-closure:tenant/);
});

test('a new direct pre-READY policy import is rejected even when transitive crate set is unchanged', () => {
  for (const id of ['api', 'tenant', 'prototype', 'https']) {
    const redirected = copy(successor);
    redirected.cargo[id].local_edges.push(
      'auth-foundation-authorization-service->auth-foundation-operation-auth-exact-permission-authorize');
    assert.throws(() => checkNativeEndpointInventory(manifest, redirected),
      new RegExp(`policy-direct-edge:${id}`));
  }
});

test('Rust cannot import a transitive policy crate without a direct Cargo edge', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'auth-v4b-policy-import-'));
  const service = join(repositoryRoot, 'auth-foundation/implementation/authorization-service');
  const policy = join(repositoryRoot, 'auth-foundation/implementation/standard-runtime');
  const toolchain = join(repositoryRoot, 'tools/toolchain/run');
  const manifestFile = join(scratch, 'Cargo.toml');
  const sourceFile = join(scratch, 'src/lib.rs');
  const manifestText = withPolicy => `[package]\nname = "auth-v4b-policy-import-control"\nversion = "0.0.0"\nedition = "2024"\n\n[dependencies]\nauth-foundation-authorization-service = { path = "${service}" }\n${withPolicy ? `auth-kernel = { package = "auth-foundation-operation-auth-exact-permission-authorize", path = "${policy}" }\n` : ''}\n[workspace]\n`;
  const run = () => execFileSync(toolchain,
    ['cargo', 'check', '--quiet', '--offline', '--manifest-path', manifestFile],
    { cwd: scratch, encoding: 'utf8', stdio: 'pipe',
      env: { ...process.env, CARGO_TARGET_DIR: join(service, 'target') } });
  try {
    mkdirSync(dirname(sourceFile));
    writeFileSync(sourceFile, 'pub fn probe() { let _ = auth_kernel::authorize; }\n');
    writeFileSync(manifestFile, manifestText(false));
    assert.throws(run, error => /undeclared crate or module|unresolved/.test(String(error.stderr)));
    writeFileSync(manifestFile, manifestText(true));
    assert.doesNotThrow(run);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('false closure or runtime-observed promotion is rejected', () => {
  for (const field of ['endpoint_set_closed', 'all_path_ready_dominance', 'runtime_guarantees_observed']) {
    const promoted = copy(manifest);
    promoted[field] = true;
    assert.throws(() => checkNativeEndpointInventory(promoted, successor), /false-closure/);
  }
  const concealed = copy(manifest);
  concealed.open_effect_classes.pop();
  assert.throws(() => checkNativeEndpointInventory(concealed, successor), /open-effects/);
});

test('legacy source drift and stale READY successor are rejected', () => {
  assert.throws(() => checkNativeEndpointInventory(manifest, successor, () => Buffer.from('altered')),
    /legacy-drift:sqlite/);
  const stale = copy(successor);
  stale.status = 'pass';
  assert.throws(() => checkNativeEndpointInventory(manifest, stale), /posture/);
});
