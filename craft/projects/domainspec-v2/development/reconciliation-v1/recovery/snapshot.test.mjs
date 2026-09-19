import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compare, readRegular, safePath, sha256, validateObjects } from './snapshot.mjs';

test('identical bytes match; altered bytes are drift', () => {
  assert.equal(compare(sha256('old'), sha256('old')), 'matching');
  assert.equal(compare(sha256('old'), sha256('new')), 'changed');
});
test('absence, deletion and newly appearing files remain distinct', () => {
  assert.equal(compare(null,null),'matching-absence');
  assert.equal(compare('digest',null),'missing');
  assert.equal(compare(null,'digest'),'appeared');
});
test('reject path escape and absolute paths', () => {
  for (const p of ['../x','x/../../y','/etc/passwd','x\\..\\y','']) assert.throws(()=>safePath('/tmp/bounded',p));
  assert.equal(safePath('/tmp/bounded','source/a.ts'),'/tmp/bounded/source/a.ts');
});
test('preimage identity is byte-exact including binary data', () => {
  const bytes = Buffer.from([0,255,10,13,42]);
  assert.equal(validateObjects({schema_version:'domainspec.preimage-objects/v1-candidate',objects:{[sha256(bytes)]:bytes.toString('base64')}}),1);
});
test('reject tampered objects and empty bundles', () => {
  assert.throws(()=>validateObjects({schema_version:'domainspec.preimage-objects/v1-candidate',objects:{}}));
  assert.throws(()=>validateObjects({schema_version:'domainspec.preimage-objects/v1-candidate',objects:{[sha256('original')]:Buffer.from('changed').toString('base64')}}));
});
test('wrong schema cannot inherit valid object identity', () => {
  assert.throws(()=>validateObjects({schema_version:'other',objects:{[sha256('x')]:'eA=='}}));
});
test('empty files are valid preimages, not missing objects', () => {
  const bundle = {schema_version:'domainspec.preimage-objects/v1-candidate',objects:{[sha256('')]:''}};
  assert.equal(validateObjects(bundle),1);
  assert.equal(Object.hasOwn(bundle.objects,sha256('')),true);
});
test('real file drift is detected without changing the saved preimage', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'dsr001-drift-'));
  try {
    fs.writeFileSync(path.join(dir,'source'),'original');
    const before = readRegular(dir,'source');
    fs.writeFileSync(path.join(dir,'source'),'changed');
    assert.equal(compare(before.sha256,readRegular(dir,'source').sha256),'changed');
    assert.equal(before.bytes.toString(),'original');
    fs.unlinkSync(path.join(dir,'source'));
    assert.equal(compare(before.sha256,readRegular(dir,'source')),'missing');
  } finally { fs.rmSync(dir,{recursive:true}); }
});
test('symlinks and directory entries are rejected', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'dsr001-links-'));
  try {
    fs.writeFileSync(path.join(dir,'source'),'data');
    fs.symlinkSync('source',path.join(dir,'link'));
    fs.mkdirSync(path.join(dir,'nested'));
    assert.throws(()=>readRegular(dir,'link'));
    assert.throws(()=>readRegular(dir,'nested'));
  } finally { fs.rmSync(dir,{recursive:true}); }
});
