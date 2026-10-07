import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const implementationRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repositoryRoot = path.resolve(implementationRoot, '../..');
const toolchain = path.join(repositoryRoot, 'tools/toolchain/run');

function run(args, input) {
  return spawnSync(toolchain, args, { cwd: repositoryRoot, input, encoding: 'utf8' });
}

function build(crate, feature) {
  const args = [
    'cargo', 'build', '--offline', '--locked', '--message-format=json',
    '--manifest-path', path.join(implementationRoot, crate, 'Cargo.toml'),
  ];
  if (feature) args.push('--features', 'legacy-raw-decision');
  const result = run(args);
  assert.equal(result.status, 0, result.stderr);
  const artifacts = result.stdout.split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const own = artifacts.find((row) => row.reason === 'compiler-artifact' &&
    row.target?.name === `auth_foundation_${crate.replaceAll('-', '_')}` &&
    row.target?.kind?.includes('lib'));
  assert.ok(own, `missing ${crate} library artifact`);
  const rlib = own.filenames.find((file) => file.endsWith('.rlib'));
  assert.ok(rlib, `missing ${crate} rlib`);
  return rlib;
}

function compileImport(crate, rlib, names, extra = '') {
  const name = `auth_foundation_${crate.replaceAll('-', '_')}`;
  const probeDir = mkdtempSync(path.join(tmpdir(), 'auth-raw-capability-'));
  try {
    return run([
      'rustc', '--crate-name', 'raw_capability_probe', '--edition=2024',
      '--crate-type=lib', '--emit=metadata',
      '-o', path.join(probeDir, 'probe.rmeta'), '-',
      '--extern', `${name}=${rlib}`,
      '-L', `dependency=${path.join(path.dirname(rlib), 'deps')}`,
    ], `pub use ${name}::{${names.join(', ')}};\n${extra}\n`);
  } finally {
    rmSync(probeDir, { recursive: true });
  }
}

function dependencyNames(manifest) {
  const result = run([
    'cargo', 'metadata', '--offline', '--locked', '--format-version', '1',
    '--manifest-path', path.join(implementationRoot, manifest, 'Cargo.toml'),
  ]);
  assert.equal(result.status, 0, result.stderr);
  const metadata = JSON.parse(result.stdout);
  const packages = new Map(metadata.packages.map((pkg) => [pkg.id, pkg.name]));
  const nodes = new Map(metadata.resolve.nodes.map((node) => [node.id, node]));
  const visited = new Set();
  const pending = [metadata.resolve.root];
  while (pending.length > 0) {
    const id = pending.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    pending.push(...nodes.get(id).deps
      .filter((edge) => edge.dep_kinds.some((kind) => kind.kind !== 'dev'))
      .map((edge) => edge.pkg));
  }
  return new Set([...visited].map((id) => packages.get(id)));
}

test('raw native decision APIs require an explicit compatibility feature', () => {
  for (const [crate, names] of [
    ['runtime-adapter', ['AuthorizationAdapter', 'authorize_resolved']],
    ['sqlite-provider', ['SqliteAuthorizationService', 'authorize_in_transaction',
      'SqliteAuthorizationStateSnapshot']],
  ]) {
    const defaultRlib = build(crate, false);
    for (const name of names) {
      const defaultProbe = compileImport(crate, defaultRlib, [name]);
      assert.notEqual(defaultProbe.status, 0, `${crate} exposed ${name} by default`);
      assert.match(defaultProbe.stderr, /unresolved import/, `${crate} ${name}: ${defaultProbe.stderr}`);
    }

    const legacyRlib = build(crate, true);
    const methodProbe = crate === 'sqlite-provider'
      ? `pub fn raw_methods_remain_opt_in() {
           let _ = SqliteAuthorizationService::<auth_foundation_sqlite_provider::SystemClock>::authorize;
           let _ = SqliteAuthorizationStateSnapshot::authorize;
           let _ = authorize_in_transaction;
         }`
      : '';
    const legacyProbe = compileImport(crate, legacyRlib, names, methodProbe);
    assert.equal(legacyProbe.status, 0, legacyProbe.stderr);
  }
});

test('selected public Auth roots cannot reach legacy decision crates', () => {
  for (const root of [
    'authorization-api', 'tenant-bridge',
    'authentication-prototype/bridge', 'authentication-https/bridge',
  ]) {
    const names = dependencyNames(root);
    assert.ok(names.has('auth-foundation-authorization-ready-decision'), root);
    for (const forbidden of [
      'auth-foundation-runtime-adapter',
      'auth-foundation-sqlite-provider',
      'auth-foundation-trusted-boundary',
      'auth-foundation-trusted-boundary-v2',
      'auth-foundation-trusted-boundary-pre-resolved-v2-candidate',
    ]) {
      assert.ok(!names.has(forbidden), `${root} reaches ${forbidden}`);
    }
  }
});
