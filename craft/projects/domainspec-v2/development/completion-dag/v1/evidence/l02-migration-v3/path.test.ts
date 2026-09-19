import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { validateChanged, checkedDerive, machineDerive } from './bridge.js';
import { validateChanged as previous, implRoot } from '../l02-migration-v1/bridge.js';
const here = dirname(fileURLToPath(import.meta.url));
function temporary(run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'l04-path-repair-'));
  try { run(root); } finally { rmSync(root, {recursive: true, force: true}); }
}
function put(root: string, path: string, text: string) {mkdirSync(dirname(join(root, path)), {recursive:true}); writeFileSync(join(root, path), text);}
const bad = 'product/spec/features/actual/bad.md';
test('L04-F01 original contained-directory alias rejects; historical reproducer remains visible', () => temporary(root => {
  put(root, bad, '[broken](missing.md)');
  symlinkSync('actual', join(root, 'product/spec/features/alias'));
  const changes = [{status:'M', path:'product/spec/features/alias/bad.md'}];
  assert.equal(previous(root, 'product', changes).status, 'selected-pass');
  assert.throws(() => validateChanged(root, 'product', changes), /unsupported symlink/);
}));
test('Alias with different relative-link context rejects instead of canonicalizing semantics', () => temporary(root => {
  put(root, 'product/spec/features/actual/nested/bad.md', '[relative](../target.md)');
  put(root, 'product/spec/features/actual/target.md', '# actual target');
  symlinkSync('actual/nested', join(root, 'product/spec/features/alias'));
  assert.throws(() => validateChanged(root, 'product', [{status:'M',path:'product/spec/features/alias/bad.md'}]), /unsupported symlink/);
}));
for (const path of ['product', 'product/spec', 'product/spec/features']) test(`Root component alias rejects: ${path}`, () => temporary(root => {
  put(root, bad, '# valid');
  renameSync(join(root,path),join(root,path+'-real'));
  symlinkSync(path.split('/').at(-1)+'-real',join(root,path));
  assert.throws(() => validateChanged(root,'product',[{status:'M',path:bad}]), /unsupported symlink/);
}));
test('Repository root alias rejects with canonical-path guidance', () => temporary(root => {
  put(root, bad, '# valid');
  symlinkSync(root,join(root,'self'));
  assert.throws(() => validateChanged(join(root,'self'),'product',[{status:'M',path:bad}]), /canonical path/);
}));
test('Leaf file symlink and outside-feature directory alias reject', () => temporary(root => {
  put(root, bad, '# valid');put(root,'outside/bad.md','# outside');
  symlinkSync('actual/bad.md',join(root,'product/spec/features/leaf.md'));
  symlinkSync(join(root,'outside'),join(root,'product/spec/features/outside'));
  for (const path of ['product/spec/features/leaf.md','product/spec/features/outside/bad.md']) assert.throws(() => validateChanged(root,'product',[{status:'M',path}]));
}));
test('Ordinary paths retain full diagnostics, no-work, rename and deletion dispositions', () => temporary(root => {
  put(root,bad,'[broken](missing.md)');put(root,'product/spec/features/actual/with space.md','# valid');
  for (const changes of [[],[{status:'M',path:bad}],[{status:'M',path:'product/spec/features/actual/with space.md'}],[{status:'R100',previousPath:'product/spec/features/actual/old.md',path:bad}],[{status:'D',path:'product/spec/features/actual/gone.md'}],[{status:'M',path:'elsewhere.md'}]]) assert.deepEqual(validateChanged(root,'product',changes),previous(root,'product',changes));
}));
test('CLI alias selection exits nonzero with JSON rejection', () => temporary(root => {
  put(root,bad,'# valid');symlinkSync('actual',join(root,'product/spec/features/alias'));
  // Project aliases are rejected even for an empty Git range selection.
  const git=(...args:string[])=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
  git('init','-q');git('add','.');git('-c','user.name=fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','commit','-qm','fixture');
  symlinkSync('product',join(root,'alias-product'));
  const result=spawnSync(process.execPath,['--import',join(implRoot,'node_modules/tsx/dist/loader.mjs'),join(here,'cli.ts'),'changed',root,'alias-product','HEAD..HEAD'],{encoding:'utf8'});
  assert.equal(result.status,2);assert.equal(JSON.parse(result.stdout).status,'reject');
}));
test('Unchanged Markdown and machine exports remain callable', () => {
  assert.equal(checkedDerive(join(implRoot,'spec/features/sample'),'normalized-spec').status,'pass');
  assert.equal(machineDerive('/missing','unknown').status,'unsupported');
});
test('All predecessor bytes remain unchanged', () => {
  const root=join(implRoot,'../../..');const manifest=JSON.parse(readFileSync(join(here,'source-manifest.json'),'utf8'));
  for(const ref of manifest.files) assert.equal(createHash('sha256').update(readFileSync(join(root,ref.path))).digest('hex'),ref.sha256,ref.path);
});
