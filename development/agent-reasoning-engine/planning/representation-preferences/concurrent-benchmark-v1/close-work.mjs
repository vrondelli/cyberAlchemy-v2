import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {replayResearchWork} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {verifyEvolutionRecord} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {digest} from '../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../..'),prefix=relative(root,dir);
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8')),local=p=>read(prefix+'/'+p);
const sha=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
execFileSync(process.execPath,[resolve(dir,'probe.mjs'),'check']);
execFileSync(process.execPath,[resolve(dir,'research.mjs'),'--results','--check']);
const plan=local('research-work-plan.json'),registration=local('registration.json');
const bindings=bs=>{for(const b of bs)assert.equal(sha(b.path),b.sha256,b.path);};
const verify_registration=r=>{try{const {registration_digest,...body}=r;assert.equal(registration_digest,digest(body));bindings([...r.evidence_bindings,...r.implementation.source_bindings]);assert.ok(r.records.every(x=>verifyEvolutionRecord(x).ok));assert.equal(r.records[1].hypothesis_ref,r.records[0].record_id);assert.equal(r.records[2].source_result_digest,digest(local('RESULTS.json')));assert.equal(r.records[3].experiment_ref,r.records[1].record_id);return true;}catch{return false;}};
const artifacts={P:'implementation-dag.json',S:'TEST-RESULTS.json',A:'TEST-RESULTS.json',R:'research-workflow.json',T:'TEST-RESULTS.json',F:'freeze.json',L:'RESULTS.json',M:'RESUME-VERIFICATION.json',V:'FINAL-REVIEW.json',D:'observations.json'};
function verify_evidence(binding){
 try{
  const task=plan.tasks.find(x=>x.task_id===binding.task_id),name=artifacts[binding.task_id];
  assert.equal(binding.artifact_ref,prefix+'/'+name);assert.equal(binding.artifact_digest,sha(binding.artifact_ref));assert.ok(task.completion_criteria.includes(binding.criterion_id));
  const value=local(name);
  switch(binding.task_id){
   case 'P': assert.deepEqual(value.tasks.map(x=>x.id).sort(),Object.keys(artifacts).sort());break;
   case 'S':case 'A':case 'T': assert.equal(value.exit_code,0);assert.equal(value.passed,22);assert.equal(value.failed,0);bindings(value.bindings);break;
   case 'R': assert.ok(value.roles.length>=5);assert.ok(value.dag.length>=5);break;
   case 'F': bindings(value.bindings);assert.equal(value.concurrency.parallel,2);assert.ok(value.combined_reservation<=16384);assert.equal(local('run-continuity-validation.json').ok,true);break;
   case 'L': assert.equal(value.conditions.serial.counts.planned,4);assert.equal(value.conditions.parallel.counts.planned,4);assert.equal(value.conditions.parallel.maximum_model_overlap,2);break;
   case 'M': assert.equal(value.verified,true);assert.equal(value.new_provider_attempts,0);assert.equal(value.completed_jobs_reused,8);bindings(value.bindings);break;
   case 'V': assert.equal(value.complete,true);assert.ok(value.requirements.length>0);break;
   case 'D': assert.ok(value.records.every(x=>verifyEvolutionRecord(x).ok));assert.equal(value.records[0].source_result_digest,digest(local('RESULTS.json')));break;
  }
  return {ok:true,binding};
 }catch{return {ok:false,binding};}
}
const events=plan.topological_order.flatMap(id=>{const task=plan.tasks.find(x=>x.task_id===id),artifact_ref=prefix+'/'+artifacts[id];return [{event_id:id+'-start',task_id:id,action:'start'},{event_id:id+'-complete',task_id:id,action:'complete',evidence:[{criterion_id:task.completion_criteria[0],artifact_ref,artifact_digest:sha(artifact_ref)}]}];});
const state=replayResearchWork({plan,registrations:[registration],events,verify_registration,verify_evidence});
assert.ok(state.tasks.every(x=>x.state==='completed'));
const output=JSON.stringify(state,null,2)+'\n',path=resolve(dir,'research-work-state.json');
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8'),output);else writeFileSync(path,output);
console.log(JSON.stringify({verified:true,completed_tasks:state.tasks.length,claim_ceiling:'Retrospective evidence-bound work reconciliation, not preregistration or production admission.'}));
