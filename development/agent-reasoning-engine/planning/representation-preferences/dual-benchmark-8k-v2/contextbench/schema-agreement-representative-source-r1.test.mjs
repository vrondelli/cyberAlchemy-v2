// Real index/native reader; no provider. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';
import {runSourceIndex} from './ranked-source-index-service-r1.mjs';
import {representativeQuery,buildRepresentativeRankedSource} from './schema-agreement-representative-source-r1.mjs';
test('query follows task text with whole UTF-8 characters and rejects malformed text',()=>{
 const text='a'.repeat(4093)+'😀tail';assert.equal(representativeQuery(text),'a'.repeat(4093));
 assert.equal(representativeQuery('Investigate needle'),'Investigate needle');
 for(const bad of ['', '   ', '\ud800'])assert.throws(()=>representativeQuery(bad),/task-text/);
});
test('actual ranked query binds native source and rejects a changed saved index',async()=>{
 const root=mkdtempSync(join(tmpdir(),'ranked-representative-'));
 try{
  const git=(...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init','-q');writeFileSync(join(root,'source.js'),'export const needle = 1;\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture');
  const base_commit=git('rev-parse','HEAD'),signal=new AbortController().signal;
  const index=await runSourceIndex({repository:root,base_commit,query:'',signal});
  const args={task:{instance_id:'fixture',base_commit,problem_statement:'Investigate needle'},repoRoot:root,source_index:index.value,signal,before_index:async()=>true};
  const r=await buildRepresentativeRankedSource(args);
  assert.ok(r.evidence.result.output.observations.length>0);assert.equal(r.evidence.sources.get('source.js'),'export const needle = 1;\n');
  assert.equal(r.provenance.model_calls,0);assert.equal(r.provenance.provider_calls,0);assert.equal(r.provenance.delivery,'unconfirmed');assert.equal(r.provenance.settlement.process_group_absent,true);
  await assert.rejects(buildRepresentativeRankedSource({...args,source_index:{...index.value,index_digest:'0'.repeat(64)}}),/index-drift/);
  await assert.rejects(buildRepresentativeRankedSource({...args,before_index:async()=>false}),/storage/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
