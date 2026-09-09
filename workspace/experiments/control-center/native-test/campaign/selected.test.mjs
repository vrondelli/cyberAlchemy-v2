import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {digest} from './analyze.mjs';
import {selectedContext} from './selected.mjs';

const candidateSha256=digest(readFileSync(new URL('../../candidates/cc-005/candidate.json',import.meta.url)));
function fixture(t,overrides={}) {
  const dir=mkdtempSync('/tmp/cav2-cc005-native.');t.after(()=>rmSync(dir,{recursive:true}));
  const binary=join(dir,'essays-desktop');writeFileSync(binary,'unit fixture - never executed');
  return {candidateId:'CC-005',candidateSha256,binary,binarySha256:digest(readFileSync(binary)),...overrides};
}
test('registered exact selection verifies without launching the binary',t=>{
  const c=selectedContext(fixture(t));assert.equal(c.verify().ok,true);assert.equal(c.mode,'measurement');
});
test('no implicit default, unknown ID or missing digests',t=>{
  const f=fixture(t);assert.throws(()=>selectedContext({...f,candidateId:undefined}),/UNREGISTERED/);
  assert.throws(()=>selectedContext({...f,candidateId:'../../arbitrary'}),/UNREGISTERED/);
  assert.throws(()=>selectedContext({...f,candidateSha256:undefined}),/DIGESTS/);
  assert.throws(()=>selectedContext({...f,mode:'live'}),/INVALID_MODE/);
});
test('candidate and binary drift fail before process launch',async t=>{
  const f=fixture(t);const c=selectedContext({...f,candidateSha256:'0'.repeat(64)});
  assert.equal(c.verify().ok,false);assert.throws(()=>c.run('/tmp'),/PREFLIGHT/);
  const actual=selectedContext(f);writeFileSync(f.binary,'changed');assert.equal(actual.verify().ok,false);
});
test('production and escaped executable paths are rejected',t=>{
  const f=fixture(t);for(const binary of ['/bin/true','/tmp/cav2-cc005-native.a/../essays-desktop'])assert.throws(()=>selectedContext({...f,binary}),/ISOLATED/);
});
test('launch descriptor carries exact selection, fixed mock and fresh storage',t=>{
  const f=fixture(t),c=selectedContext(f),call=c.launch('/tmp/isolated-attempt');
  assert.equal(call.options.env.CC_CANDIDATE_ID,'CC-005');assert.equal(call.options.env.CC_CANDIDATE_SHA256,candidateSha256);
  assert.equal(call.options.env.CC_BINARY_SHA256,f.binarySha256);assert.equal(call.options.env.CC_COLLECTION_MODE,'measurement');
  assert.equal(call.options.env.ESSAYS_DATABASE,'/tmp/isolated-attempt/session.sqlite');
  assert.match(call.options.env.CODEX_BINARY,/test\/fixtures\/mock-app-server.mjs$/);
  assert.match(call.args.at(-1),/selected.wdio.conf.mjs$/);
  assert.equal(selectedContext({...f,mode:'smoke'}).launch('/tmp/isolated-attempt').options.env.CC_COLLECTION_MODE,'smoke');
});
