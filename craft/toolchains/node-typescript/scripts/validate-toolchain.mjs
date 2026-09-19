import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const toolchain = readJson('toolchain.json');
const packageManifest = readJson('package.json');
const base = readJson('tsconfig/base.json');
const node = readJson('tsconfig/node.json');
const browser = readJson('tsconfig/browser.json');
const migrationInventory = readJson('migration-inventory.json');
const dockerfile = readFileSync(new URL('Dockerfile', root), 'utf8');

assert.equal(packageManifest.engines.node, toolchain.node.version);
assert.equal(packageManifest.packageManager, `npm@${toolchain.package_managers.npm}`);
assert.equal(packageManifest.dependencies.pnpm, toolchain.package_managers.pnpm);
assert.equal(packageManifest.dependencies.typescript, toolchain.typescript);
assert.match(dockerfile, new RegExp(`^ARG NODE_IMAGE=${toolchain.node.image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));

assert.equal(base.compilerOptions.target, 'ES2024');
assert.equal(base.compilerOptions.strict, true);
assert.deepEqual(base.compilerOptions.types, []);
assert.equal(node.extends, './base.json');
assert.equal(node.compilerOptions.module, 'NodeNext');
assert.equal(node.compilerOptions.moduleResolution, 'NodeNext');
assert.equal(browser.extends, './base.json');
assert.equal(browser.compilerOptions.module, 'ESNext');
assert.equal(browser.compilerOptions.moduleResolution, 'Bundler');
assert.equal(browser.compilerOptions.noEmit, true);
assert.equal(migrationInventory.runtime_authority, 'toolchains/node-typescript/toolchain.json');
assert.ok(migrationInventory.active_parent_manifests.length > 0);
assert.deepEqual(Object.keys(migrationInventory.owned_private_submodules).sort(), ['implementation/domainspec', 'validation/poker-team']);

for (const [name, path] of Object.entries(toolchain.profiles)) {
  assert.doesNotThrow(() => readJson(path), `profile ${name} must resolve: ${path}`);
}

const pythonSchemaRuntime = spawnSync('python3', ['-c', [
  'import json,sys,yaml',
  'from importlib.metadata import version',
  "print(json.dumps({'python':sys.version.split()[0],'PyYAML':version('PyYAML'),'jsonschema':version('jsonschema')}))"
].join(';')], { encoding: 'utf8' });
assert.equal(pythonSchemaRuntime.status, 0, pythonSchemaRuntime.stderr || 'Python JSON Schema runtime is unavailable');
const supportingRuntime = JSON.parse(pythonSchemaRuntime.stdout);

console.log(JSON.stringify({
  status: 'pass',
  node: toolchain.node.version,
  npm: toolchain.package_managers.npm,
  pnpm: toolchain.package_managers.pnpm,
  typescript: toolchain.typescript,
  supporting_runtime: supportingRuntime,
  profiles: Object.keys(toolchain.profiles)
}, null, 2));
