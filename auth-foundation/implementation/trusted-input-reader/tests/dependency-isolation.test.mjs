import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const crate = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const model = resolve(crate, '../authorization-state-model');
const runtime = resolve(crate, '../trusted-input-runtime');
const toolchain = resolve(crate, '../../../tools/toolchain/run');
const manifest = join(crate, 'Cargo.toml');
const source = join(crate, 'src/lib.rs');

test('trusted-input reader has no native decision-capable dependency', () => {
  const metadata = JSON.parse(execFileSync(toolchain, [
    'cargo', 'metadata', '--offline', '--locked', '--format-version', '1',
    '--manifest-path', manifest,
  ], { encoding: 'utf8' }));
  const names = new Set(metadata.packages.map(pkg => pkg.name));
  for (const forbidden of [
    'auth-foundation-trusted-input-provider',
    'auth-foundation-runtime-adapter',
    'auth-foundation-trusted-boundary',
    'auth-foundation-sqlite-provider',
    'auth-foundation-operation-auth-exact-permission-authorize',
  ]) assert.equal(names.has(forbidden), false, forbidden);
  const reader = metadata.packages.find(pkg => pkg.name === 'auth-foundation-trusted-input-reader');
  assert.deepEqual(reader.dependencies.map(dependency => dependency.name).sort(), [
    'auth-foundation-authorization-state-model',
    'auth-foundation-trusted-inputs-trusted-input-resolution-resolve-trusted-inputs',
    'rusqlite',
  ].sort());
  assert.doesNotMatch(readFileSync(source, 'utf8'), /pub fn authorize\s*\(/);
});

test('a trusted-input row callback cannot call the native provider', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'auth-trusted-input-isolation-'));
  try {
    mkdirSync(join(temporary, 'src'));
    const originalManifest = readFileSync(manifest, 'utf8');
    const adjusted = originalManifest
      .replace('path = "../authorization-state-model"', `path = "${model}"`)
      .replace('path = "../trusted-input-runtime"', `path = "${runtime}"`);
    assert.notEqual(adjusted, originalManifest);
    writeFileSync(join(temporary, 'Cargo.toml'), adjusted);
    const schema = resolve(crate, '../trusted-input-provider/migrations/0001_trusted_inputs.sql');
    const original = readFileSync(source, 'utf8').replace(
      'include_str!("../../trusted-input-provider/migrations/0001_trusted_inputs.sql")',
      `include_str!("${schema}")`,
    );
    const marker = '.query_map([evidence_ref], |row| {';
    assert.equal(original.split(marker).length, 2);
    writeFileSync(join(temporary, 'src/lib.rs'), original.replace(
      marker,
      `${marker}\n            let _decision = auth_foundation_trusted_input_provider::SqliteTrustedInputResolver::<()>::open_in_memory;`,
    ));
    const result = spawnSync(toolchain, [
      'cargo', 'check', '--offline', '--manifest-path', join(temporary, 'Cargo.toml'),
    ], { encoding: 'utf8' });
    assert.notEqual(result.status, 0, 'hostile callback unexpectedly compiled');
    assert.match(result.stderr, /unresolved module or unlinked crate `auth_foundation_trusted_input_provider`/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
