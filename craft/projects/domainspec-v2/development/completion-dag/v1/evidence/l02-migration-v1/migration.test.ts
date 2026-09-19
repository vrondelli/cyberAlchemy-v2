import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { checkedDerive, gitChanges, implRoot, machineDerive, normalDiagnostics, parseChanges, selectChanges, validateChanged } from './bridge.js';
import { parse } from '../../../../../impl/test-derivation-engine/src/grammar/index.js';
import { derive } from '../../../../../impl/test-derivation-engine/src/rules/index.js';
import { emitSpec } from '../../../../../impl/test-derivation-engine/src/emit/spec.js';
import { emitTests } from '../../../../../impl/test-derivation-engine/src/emit/tests.js';
import { assertExactRef, deriveEnforcesObligations, loadEvfS1Bundle } from '../../../../../impl/test-derivation-engine/src/minted-project/derive.js';

const repoRoot = resolve(implRoot, '../../..');
const sample = readFileSync(join(implRoot, 'spec/features/sample/SPEC.md'), 'utf8');
const aspect = '# Operations\n## Pay\n### Rules\n| ID | Rule | Formal |\n| --- | --- | --- |\n| R1 | positive | x >= 0 |\n| R2 | policy | follow the approved business policy |\n';
function fixture(run: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'dsv2-l02-test-'));
  try { run(dir); } finally { rmSync(dir, {recursive: true, force: true}); }
}
function put(dir: string, name: string, value: string) {
  mkdirSync(resolve(dir, name, '..'), {recursive: true}); writeFileSync(join(dir, name), value);
}
function native(dir: string) {
  const parsed = parse(dir); assert.deepEqual(parsed.violations, []);
  const obligations = derive(parsed.graph);
  return {obligations, spec: emitSpec(obligations), tests: emitTests(obligations)};
}
test('T01 aspect exact native output parity and deterministic snapshots', () => fixture(dir => {
  put(dir, 'operations.md', aspect);
  const result = checkedDerive(dir, 'aspect', true);
  assert.equal(result.status, 'pass'); assert.deepEqual(result.output, native(dir));
  assert.ok(result.output!.obligations.length > 0);
  assert.deepEqual(result, checkedDerive(dir, 'aspect', true));
}));
for (const name of ['sample', 'agent-execution-orchestrator']) test(`T02 retained ${name} normalized output parity`, () => {
  const dir = join(implRoot, 'spec/features', name);
  const result = checkedDerive(dir, 'normalized-spec', true);
  assert.equal(result.status, 'pass'); assert.deepEqual(result.output, native(dir));
});
test('T03 mixed explicit dialect and legacy aspect precedence without merging', () => fixture(dir => {
  put(dir, 'SPEC.md', sample); const normalized = checkedDerive(dir, 'normalized-spec').output;
  put(dir, 'operations.md', aspect);
  const selected = checkedDerive(dir, 'normalized-spec');
  assert.deepEqual(selected.output, normalized); assert.deepEqual(selected.ignoredSources, ['operations.md']);
  const auto = checkedDerive(dir, 'legacy-auto');
  assert.equal(auto.selectedDialect, 'aspect'); assert.deepEqual(auto.ignoredSources, ['SPEC.md']);
  assert.deepEqual(auto.output, checkedDerive(dir, 'aspect').output);
}));
test('T04 missing or malformed selected input rejects without output', () => fixture(dir => {
  for (const dialect of ['aspect', 'normalized-spec', 'legacy-auto'] as const) {
    const result = checkedDerive(dir, dialect); assert.equal(result.status, 'reject'); assert.equal(result.output, undefined);
  }
  put(dir, 'SPEC.md', '# Invalid\n');
  put(dir, 'operations.md', '## Pay\n### Rules\n| Wrong | Columns |\n| --- | --- |\n| x | y |\n');
  for (const dialect of ['aspect', 'normalized-spec'] as const) {
    const result = checkedDerive(dir, dialect); assert.equal(result.status, 'reject'); assert.ok(result.diagnostics.length); assert.equal(result.output, undefined);
  }
}));
test('T04 malformed normalized endpoint rejects', () => fixture(dir => {
  put(dir, 'SPEC.md', sample.replace('| --- | --- | --- | --- |', '| --- | --- | --- | --- |\n| Missing | owns | AlsoMissing | fixture |'));
  assert.equal(checkedDerive(dir, 'normalized-spec').status, 'reject');
}));
test('T05 unclassified formal remains an identified needs-formal obligation', () => fixture(dir => {
  put(dir, 'operations.md', aspect);
  const output = checkedDerive(dir, 'aspect').output!;
  assert.ok(output.obligations.some(o => o.rule_type === 'needs-formal'));
  assert.deepEqual(output.obligations, native(dir).obligations);
}));
test('T06 retained machine route preserves the current native result or rejection', () => {
  const result = machineDerive(repoRoot, 'evf-s1');
  let nativeResult;
  try { nativeResult = deriveEnforcesObligations(repoRoot); }
  catch (error) {
    assert.equal(result.status, 'reject');
    assert.deepEqual(result.diagnostics, [(error as Error).message]);
    assert.equal(result.obligations, undefined);
    return;
  }
  assert.equal(result.status, 'pass');
  assert.deepEqual(result.obligations, nativeResult);
  assert.equal(result.obligations!.length, 1);
});
for (const ref of ['rule_source', 'relationship_registry', 'generated_graph', 'generated_source_manifest'] as const) test(`T06 stale machine ${ref} rejects`, () => {
  const bundle = structuredClone(loadEvfS1Bundle(repoRoot));
  const changed = {...bundle.binding.lineage_refs[ref], sha256: '0'.repeat(64)};
  assert.throws(() => assertExactRef(repoRoot, changed, ref.startsWith('generated_') ? 'GENERATED_GRAPH_STALE' : 'SOURCE_DIGEST_STALE'), error => {
    assert.equal((error as Error).message, `stale exact ref ${changed.path}`); return true;
  });
});
test('T07 unsupported machine profile does not inspect or fall back to Markdown', () => {
  const result = machineDerive('/does-not-exist', 'generic-json');
  assert.equal(result.status, 'unsupported'); assert.equal(result.obligations, undefined);
});
test('T08 NUL records preserve spaces, renames and deletions', () => fixture(dir => {
  put(dir, 'product/spec/features/a/new name.md', '# ok');
  const changes = parseChanges('R100\0product/spec/features/a/old name.md\0product/spec/features/a/new name.md\0D\0product/spec/features/a/gone.md\0M\0other.md\0');
  const selection = selectChanges(dir, 'product/spec/features', changes);
  assert.deepEqual(selection.files, ['product/spec/features/a/new name.md']);
  assert.match(selection.dispositions[0]!.disposition, /renamed/);
  assert.match(selection.dispositions[1]!.disposition, /deleted/);
  assert.equal(selection.dispositions[2]!.disposition, 'outside-scope');
}));
test('T08 traversal, malformed status, symlinks and missing paths fail closed', () => fixture(dir => {
  put(dir, 'product/spec/features/a/ok.md', '# ok');
  for (const raw of ['M\0../bad.md\0', 'M\0/absolute.md\0', 'M\0a/../bad.md\0', 'U\0a.md\0', 'R100\0a.md\0', 'M\0a.md']) assert.throws(() => parseChanges(raw));
  put(dir, 'outside.md', '# outside');
  symlinkSync(join(dir, 'outside.md'), join(dir, 'product/spec/features/a/link.md'));
  for (const name of ['link.md', 'missing.md']) assert.throws(() => selectChanges(dir, 'product/spec/features', [{status: 'M', path: `product/spec/features/a/${name}`} ]));
}));
test('T08 real Git range handles rename/delete and rejects Git errors', () => fixture(dir => {
  const git = (...args: string[]) => { const r = spawnSync('git', args, {cwd: dir, encoding: 'utf8'}); assert.equal(r.status, 0, r.stderr); };
  git('init', '-q'); put(dir, 'a old.md', '# content'); put(dir, 'gone.md', '# deleted'); git('add', '--', '.');
  git('-c', 'user.name=L02 fixture', '-c', 'user.email=l02@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'base');
  git('mv', 'a old.md', 'a new.md'); git('rm', 'gone.md');
  git('-c', 'user.name=L02 fixture', '-c', 'user.email=l02@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qam', 'change');
  const changes = gitChanges(dir, 'HEAD~1..HEAD'); assert.ok(changes.some(c => c.previousPath === 'a old.md' && c.path === 'a new.md')); assert.ok(changes.some(c => c.status === 'D'));
  assert.throws(() => gitChanges(dir, 'missing-ref..HEAD'), /Git diff failed/);
  assert.throws(() => gitChanges(dir, '--output=bad'), /invalid Git range/);
}));
test('T09 selected diagnostics equal normal scan; unrelated errors stay visible', () => fixture(dir => {
  put(dir, 'product/spec/features/a/selected file.md', '[broken](missing.md)');
  put(dir, 'product/spec/features/a/other.md', '[other](also-missing.md)');
  const changes = [{status: 'M', path: 'product/spec/features/a/selected file.md'}];
  const normal = normalDiagnostics(join(dir, 'product'));
  const result = validateChanged(dir, 'product', changes);
  assert.equal(result.status, 'reject'); assert.equal(result.errors.length, 1);
  assert.deepEqual(result.errors, normal.filter(d => d.file.endsWith('/selected file.md')));
  assert.equal(result.outsideScopeErrors.length, 1);
  put(dir, 'product/spec/features/a/selected file.md', '# valid');
  assert.equal(validateChanged(dir, 'product', changes).status, 'selected-pass');
  assert.equal(validateChanged(dir, 'product', []).status, 'no-work');
  assert.equal(validateChanged(dir, 'product', [{status: 'D', path: 'product/spec/features/a/deleted.md'}]).status, 'changes-only');
  assert.equal(validateChanged(dir, 'product', [{status: 'R100', previousPath: changes[0]!.path, path: 'elsewhere.md'}]).status, 'changes-only');
}));
test('T09 normal validator infrastructure failure is not no-work', () => fixture(dir => {
  put(dir, 'product/spec/features/a/bad.md', '[bad](%zz)');
  assert.throws(() => validateChanged(dir, 'product', [{status: 'M', path: 'product/spec/features/a/bad.md'}]), /normal validator failed/);
}));
test('T11 previous native binding remains selectable and rejection evidence survives rollback', () => fixture(dir => {
  put(dir, 'SPEC.md', sample); const baseline = native(dir);
  const failedCandidate = checkedDerive(dir, 'aspect');
  assert.equal(failedCandidate.status, 'reject'); assert.deepEqual(native(dir), baseline);
  assert.equal(failedCandidate.status, 'reject'); assert.deepEqual(readdirSync(dir), ['SPEC.md']);
}));
test('T10 bound legacy, waiver and contract source hashes remain unchanged', () => {
  for (const location of ['./source-manifest.json', '../l01-migration-v1/source-manifest.json']) {
    const manifest = JSON.parse(readFileSync(new URL(location, import.meta.url), 'utf8'));
    for (const source of manifest.files) assert.equal(createHash('sha256').update(readFileSync(join(repoRoot, source.path))).digest('hex'), source.sha256, source.path);
  }
});
test('CLI rejection is nonzero JSON without success artifacts', () => fixture(dir => {
  const result = spawnSync(process.execPath, ['--import', join(implRoot, 'node_modules/tsx/dist/loader.mjs'), new URL('./cli.ts', import.meta.url).pathname, 'derive', dir, 'aspect'], {encoding: 'utf8'});
  assert.equal(result.status, 1);
  const body = JSON.parse(result.stdout); assert.equal(body.status, 'reject'); assert.equal(body.output, undefined);
  assert.deepEqual(readdirSync(dir), []);
}));
