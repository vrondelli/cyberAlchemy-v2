import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const crate = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolchain = resolve(crate, '../../../tools/toolchain/run');
const manifest = join(crate, 'Cargo.toml');
const source = join(crate, 'src/lib.rs');
const forbidden = new Set([
  'auth-foundation-sqlite-provider',
  'auth-foundation-runtime-adapter',
  'auth-foundation-standard-runtime',
  'auth-foundation-trusted-boundary-v2',
]);

test('metadata reader has no transitive native decision dependency', () => {
  const metadata = JSON.parse(execFileSync(toolchain, [
    'cargo', 'metadata', '--offline', '--locked', '--format-version', '1',
    '--manifest-path', manifest,
  ], { encoding: 'utf8' }));
  const names = new Set(metadata.packages.map(pkg => pkg.name));
  for (const name of forbidden) assert.equal(names.has(name), false, name);
  const reader = metadata.packages.find(pkg => pkg.name === 'auth-foundation-authorization-metadata-reader');
  assert.deepEqual(reader.dependencies.map(dependency => dependency.name), ['rusqlite']);
});

test('a produced-row callback cannot import the SQLite decision entrypoint', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'auth-metadata-isolation-'));
  try {
    mkdirSync(join(temporary, 'src'));
    writeFileSync(join(temporary, 'Cargo.toml'), readFileSync(manifest));
    const original = readFileSync(source, 'utf8');
    const marker = 'Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))';
    assert.equal(original.split(marker).length, 2);
    writeFileSync(join(temporary, 'src/lib.rs'), original.replace(
      marker,
      `let _decision = auth_foundation_sqlite_provider::authorize_in_transaction;\n            ${marker}`,
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
