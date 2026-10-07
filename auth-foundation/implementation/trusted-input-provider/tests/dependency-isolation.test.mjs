import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';

const providerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(providerRoot, '../../..');
const forbidden = new Set([
  'auth-foundation-runtime-adapter',
  'auth-foundation-trusted-boundary',
  'auth-foundation-sqlite-provider',
  'auth-foundation-operation-auth-exact-permission-authorize',
  'auth-foundation-command-boundary-auth-command-boundary-admit-authorization-command',
]);

test('trusted-input provider has no native decision-capable Cargo dependency', () => {
  const result = spawnSync(path.join(repositoryRoot, 'tools/toolchain/run'), [
    'cargo', 'metadata', '--offline', '--locked', '--format-version', '1',
    '--manifest-path', path.join(providerRoot, 'Cargo.toml'),
  ], { encoding: 'utf8' });
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
    for (const dependency of nodes.get(id).dependencies) pending.push(dependency);
  }
  const names = new Set([...visited].map((id) => packages.get(id)));
  for (const name of forbidden) assert.ok(!names.has(name), `${name} reached from provider`);
  assert.ok(names.has('auth-foundation-authorization-state-model'));
  assert.ok(names.has('auth-foundation-trusted-input-reader'));
});
