import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { machineDerive, selectedBundle, verifySources, checkedDerive } from './bridge.js';
import { deriveEnforcesObligations } from '../../../../../impl/test-derivation-engine/src/minted-project/derive.js';
import { deriveFeature } from '../../../../../impl/test-derivation-engine/src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../../../../..');
const packagePath = 'projects/domainspec-v2/development/completion-dag/v1/evidence/l02-migration-v2';
const impl = join(root, 'projects/domainspec-v2/impl');
const profile = 'evf-s1-migration-002';
const fixture = 'projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door';
function temporary(run: (path: string) => void) {
  const path = mkdtempSync(join(tmpdir(), 'l02-repair-'));
  try { run(path); } finally { rmSync(path, {recursive: true, force: true}); }
}
function mirror(path: string) {
  const manifest = JSON.parse(readFileSync(join(here, 'source-manifest.json'), 'utf8'));
  for (const name of [...manifest.files.map((f: {path: string}) => f.path), `${packagePath}/source-manifest.json`, `${packagePath}/key-door-binding.json`]) {
    mkdirSync(dirname(join(path, name)), {recursive: true}); cpSync(join(root, name), join(path, name));
  }
}
test('R1 source closure and deterministic compiler reproduction', () => {
  assert.ok(verifySources(root) > 86);
  assert.deepEqual(selectedBundle(root), selectedBundle(root));
});
test('T06 positive native identity and complete payload parity with retained O_spec', () => {
  const bundle = selectedBundle(root);
  const result = machineDerive(root, profile);
  assert.equal(result.status, 'pass', JSON.stringify(result));
  assert.deepEqual(result.obligations, bundle.ospec.obligations);
  assert.deepEqual(result.obligations, deriveEnforcesObligations(root, bundle));
  assert.equal(result.obligations![0]!.obligation_id, 'evf.s1.enforces.has-key.unlock-door.v1');
  assert.deepEqual(machineDerive(root, profile), result);
});
for (const name of ['rule_source', 'relationship_registry', 'generated_graph', 'generated_source_manifest'] as const) test(`T06 native stale ${name} rejects from a passing baseline`, () => {
  const bundle = selectedBundle(root);
  const mutated = {...bundle, binding: {...bundle.binding, lineage_refs: {...bundle.binding.lineage_refs, [name]: {...bundle.binding.lineage_refs[name], sha256: '0'.repeat(64)}}}};
  assert.throws(() => deriveEnforcesObligations(root, mutated), error => {
    assert.equal((error as Error).message, `stale exact ref ${bundle.binding.lineage_refs[name].path}`); return true;
  });
});
test('T06 bridge rejects changed raw source, graph, registry, binding and manifest', () => temporary(path => {
  mirror(path);
  assert.equal(machineDerive(path, profile).status, 'pass');
  for (const name of [`${fixture}/specs/key-and-door/nodes/player.json`, `${fixture}/expected/graph.json`, 'projects/domainspec-v2/definitions/relationships/relationships.yml', `${packagePath}/key-door-binding.json`, `${packagePath}/source-manifest.json`]) {
    const target = join(path, name); const original = readFileSync(target);
    writeFileSync(target, Buffer.concat([original, Buffer.from('\n')]));
    const result = machineDerive(path, profile);
    assert.equal(result.status, 'reject'); assert.equal(result.obligations, undefined);
    assert.ok(result.diagnostics!.some(d => d.includes(name)), JSON.stringify(result));
    writeFileSync(target, original);
  }
}));
test('T07 unknown profile has no fallback; historical EVF route remains rejected', () => {
  assert.equal(machineDerive('/missing', 'generic-json').status, 'unsupported');
  const result = machineDerive(root, 'evf-s1');
  assert.equal(result.status, 'reject'); assert.equal(result.obligations, undefined);
  assert.match(result.diagnostics![0]!, /stale exact ref/);
});
test('T11 rollback invokes the exact legacy API/input and retains failure evidence', () => {
  const input = join(impl, 'spec/features/sample');
  const before = deriveFeature(input, {emitTests: true});
  const failedCandidate = checkedDerive(input, 'aspect');
  assert.equal(failedCandidate.status, 'reject');
  assert.deepEqual(deriveFeature(input, {emitTests: true}), before);
  assert.deepEqual(checkedDerive(input, 'normalized-spec', true).output, before);
  assert.equal(failedCandidate.status, 'reject');
  assert.equal(JSON.parse(readFileSync(join(here, '../l02-migration-v1/receipt.json'), 'utf8')).result, 'BLOCK');
});
test('CLI explicitly selects the successor and emits the native obligation', () => {
  const result = spawnSync(process.execPath, ['--import', join(impl, 'node_modules/tsx/dist/loader.mjs'), join(here, 'cli.ts'), 'machine', root, profile], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const body = JSON.parse(result.stdout); assert.equal(body.status, 'pass');
  assert.deepEqual(body.obligations, selectedBundle(root).ospec.obligations);
});
