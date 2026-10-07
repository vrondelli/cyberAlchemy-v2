// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCandidateWorkspace} from './candidate-workspace-r1.mjs';
const id='a'.repeat(64),read={id,path:'src/x.py',start_line:10,end_line:12,
  body:'def alpha():\n    return 2\n# tail',source_sha256:'b'.repeat(64),first_confirmed_receipt:1};
const args={path:read.path,status:'plausible',reason:'Implements the relevant return value.',question:'',
  evidence:[{read_id:id,start_line:11,end_line:11,quote:'return 2'}]};
const workspace=(options={})=>createCandidateWorkspace({confirmedReads:()=>[read],validateBaseRead:()=>true,...options});

test('cited update and revision persist; returned projections cannot mutate state',()=>{
  const w=workspace();const p=w.update(args);assert.equal(p.generation,1);
  p.candidates[0].reason='tampered';assert.equal(w.projection().candidates[0].reason,args.reason);
  const next=w.update({...args,status:'discarded',reason:'Shown return does not address the issue.'});
  assert.equal(next.generation,2);assert.equal(next.candidates.length,1);assert.equal(next.candidates[0].status,'discarded');
});
for(const [name,change] of [
  ['not delivered',{evidence:[{...args.evidence[0],read_id:'c'.repeat(64)}]}],
  ['wrong path',{path:'src/other.py'}],
  ['outside read',{evidence:[{...args.evidence[0],start_line:9,end_line:9}]}],
  ['invented quote',{evidence:[{...args.evidence[0],quote:'return 3'}]}],
  ['citation required',{evidence:[]}],
  ['unknown field',{extra:true}],
  ['duplicate citation',{evidence:[args.evidence[0],args.evidence[0]]}],
  ['unsafe path',{path:'../x.py'}],
])test(`rejected ${name} update is atomic`,()=>{
  const w=workspace();const before=w.projection();assert.throws(()=>w.update({...args,...change}));
  assert.deepEqual(w.projection(),before);
});
test('unverified needs a question and cannot smuggle undelivered evidence',()=>{
  const w=workspace();assert.throws(()=>w.update({...args,status:'unverified',evidence:[]}));
  assert.equal(w.update({...args,status:'unverified',question:'Where is this return consumed?',evidence:[]}).generation,1);
});
test('base-source rejection preserves prior state',()=>{
  const w=workspace({validateBaseRead:()=>false});assert.throws(()=>w.update(args),/base-provenance/);
  assert.equal(w.projection().generation,0);
});
test('candidate and byte caps reject without eviction',()=>{
  const w=workspace({maximumCandidates:1});w.update(args);const before=w.projection();
  assert.throws(()=>w.update({...args,path:'new.py',status:'unverified',question:'Which behavior?',evidence:[]}),/candidate-cap/);
  assert.deepEqual(w.projection(),before);
  const small=workspace({maximumBytes:512});assert.throws(()=>small.update(args),/byte-cap/);
  assert.equal(small.projection().generation,0);
});
