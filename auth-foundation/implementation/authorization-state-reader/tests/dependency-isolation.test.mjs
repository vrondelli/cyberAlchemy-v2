import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const crate = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const model = resolve(crate, '../authorization-state-model');
const toolchain = resolve(crate, '../../../tools/toolchain/run');
const manifest = join(crate, 'Cargo.toml');
const source = join(crate, 'src/lib.rs');
const forbidden = new Set([
  'auth-foundation-sqlite-provider',
  'auth-foundation-runtime-adapter',
  'auth-foundation-operation-auth-exact-permission-authorize',
  'auth-foundation-trusted-boundary-v2',
]);

test('state reader depends only on the kernel-free model and SQLite', () => {
  const metadata = JSON.parse(execFileSync(toolchain, [
    'cargo', 'metadata', '--offline', '--locked', '--format-version', '1',
    '--manifest-path', manifest,
  ], { encoding: 'utf8' }));
  const names = new Set(metadata.packages.map(pkg => pkg.name));
  for (const name of forbidden) assert.equal(names.has(name), false, name);
  const reader = metadata.packages.find(pkg => pkg.name === 'auth-foundation-authorization-state-reader');
  assert.deepEqual(reader.dependencies.map(dependency => dependency.name).sort(),
    ['auth-foundation-authorization-state-model', 'rusqlite']);
  assert.doesNotMatch(readFileSync(source, 'utf8'), /pub fn authorize\s*\(/);
});

test('a state-row callback cannot call the SQLite decision entrypoint', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'auth-state-isolation-'));
  try {
    mkdirSync(join(temporary, 'src'));
    const originalManifest = readFileSync(manifest, 'utf8');
    const modelPath = 'path = "../authorization-state-model"';
    assert.equal(originalManifest.split(modelPath).length, 2);
    writeFileSync(join(temporary, 'Cargo.toml'),
      originalManifest.replace(modelPath, `path = "${model}"`));
    const schemaPath = resolve(crate, '../sqlite-provider/migrations/0001_auth_state.sql');
    const original = readFileSync(source, 'utf8').replace(
      'include_str!("../../sqlite-provider/migrations/0001_auth_state.sql")',
      `include_str!("${schemaPath}")`,
    );
    const marker = '.query_map([session_id], |row| {';
    assert.equal(original.split(marker).length, 2);
    writeFileSync(join(temporary, 'src/lib.rs'), original.replace(
      marker,
      `${marker}\n                let _decision = auth_foundation_sqlite_provider::authorize_in_transaction;`,
    ));
    const result = spawnSync(toolchain, [
      'cargo', 'check', '--offline', '--manifest-path', join(temporary, 'Cargo.toml'),
    ], { encoding: 'utf8' });
    assert.notEqual(result.status, 0, 'hostile callback unexpectedly compiled');
    assert.match(result.stderr, /unresolved module or unlinked crate `auth_foundation_sqlite_provider`/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
