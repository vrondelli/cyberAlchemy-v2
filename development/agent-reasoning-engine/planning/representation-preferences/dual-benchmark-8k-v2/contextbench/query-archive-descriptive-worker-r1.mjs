// Archive candidate diagnostic; original four-task result remains unchanged.
// Isolated evaluator child; no model transport execution. Open questions: CANDIDATE-DESCRIPTIVE-SCORING.md.
import assert from 'node:assert/strict';
import {readFileSync,realpathSync} from 'node:fs';import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';import {register} from 'node:module';
const verifyBinding=b=>assert.equal(hash(readFileSync(b.path)),b.sha256,'diagnostic.binding-drift:'+b.path);
const hash=b=>createHash('sha256').update(b).digest('hex');
const controller=new AbortController();process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
let input='';for await(const chunk of process.stdin){input+=chunk;if(Buffer.byteLength(input)>1024**2)process.exit(2);}
let terminal=null,error=null;
try{
 const {operation,args}=JSON.parse(input).config;assert.ok(['qualify','score'].includes(operation));
 const path=resolve(args.diagnostic_path);assert.equal(realpathSync(path),path);
 const bytes=readFileSync(path);assert.equal(hash(bytes),args.diagnostic_sha256);
 const d=JSON.parse(bytes);assert.equal(d.schema,'are.candidate-descriptive-freeze/v1');

 const {scoreDescriptiveComparison}=await import('./score-query-archive-descriptive-r1.mjs');
 const {guardStorage}=await import('../storage-host-small-run.mjs');
 const {stable}=await import('../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs');
 const f=JSON.parse(readFileSync(d.original_freeze.path));assert.equal(hash(readFileSync(d.original_freeze.path)),d.original_freeze.sha256);
 const review=JSON.parse(readFileSync(d.result_review.path));assert.equal(review.result_integrity_approved,true);
 const manifest=JSON.parse(readFileSync(join(f.request.metadata_root,'EVIDENCE-MANIFEST.json')));
 const verify=()=>{
  assert.equal(controller.signal.aborted,false,'diagnostic.cancelled');
  assert.equal(hash(readFileSync(path)),args.diagnostic_sha256,'diagnostic.freeze-drift');
  for(const b of d.files)verifyBinding(b);
  verifyBinding(d.result_review);for(const b of review.source_bindings)verifyBinding(b);
  const s=JSON.parse(readFileSync(join(f.supervision_root,'PROCESS-SETTLEMENT.json')));
  assert.ok(s.local_settled&&s.process_group_absent&&s.exit_code===0&&s.forced===false&&Number.isSafeInteger(s.child_pid)&&s.child_pid>0);
  let absent=false;try{process.kill(-s.child_pid,0);}catch(e){absent=e.code==='ESRCH';}assert.ok(absent,'diagnostic.generation-still-present');return true;
 };
 verify();assert.deepEqual(d.diagnostic_contract.eligible_sequences,[0,2]);
 const score={...Object.fromEntries(['outcome_root','runs_root','source_root','schedule','sources'].map(k=>[k,f.request[k]])),score_root:d.score_root,manifest,expected_manifest_sha256:hash(stable(manifest)),diagnostic_contract:d.diagnostic_contract,verify_audit:async()=>verify(),verify_settlement:async()=>verify(),admit_score:async({output,growth_reservation_bytes})=>{verify();assert.equal(output,d.score_root);return guardStorage({binding:f.request.binding,output,growth_reservation_bytes}).admitted===true;}};
 if(operation==='qualify')terminal={qualified:verify(),new_provider_calls:0,new_evaluator_calls:0};
 else terminal=await scoreDescriptiveComparison(score);
 verify();
}catch(e){error=String(e.message);}
const output=JSON.stringify({terminal,error});if(Buffer.byteLength(output)>8*1024**2)process.exit(3);
process.stdout.write(output,()=>process.exit(error?2:0));
