// Retrospective D08 reconciliation only. Open questions: REVIEW.md#open-questions.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {replayResearchWork} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {verifyEvolutionRecord} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {digest} from '../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../..'),prefix=relative(root,dir);
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8')),local=p=>read(prefix+'/'+p),sha=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
execFileSync(process.execPath,[join(dir,'audit-postrun.mjs'),'--check']);
execFileSync(process.execPath,[join(dir,'research.mjs'),'--results','--check']);
const plan=local('research-work-plan.json'),registrations=local('registrations.json');
const bindings=bs=>{for(const b of bs)assert.equal(sha(b.path),b.sha256,b.path);};
const verify_registration=r=>{try{const{registration_digest,...body}=r;assert.equal(registration_digest,digest(body));bindings([...r.evidence_bindings,...r.implementation.source_bindings]);assert.ok(r.records.every(x=>verifyEvolutionRecord(x).ok));assert.equal(r.records[1].hypothesis_ref,r.records[0].record_id);assert.equal(r.records[2].source_result_digest,digest(local('RESULTS.json')));assert.equal(r.records[3].experiment_ref,r.records[1].record_id);return true;}catch{return false;}};
const artifacts={P:'implementation-dag.json',L:'TEST-RESULTS.json',C:'TEST-RESULTS.json',Q:'TEST-RESULTS.json',F:'freeze.json',S1:'RESULTS.json',G:'SCALING-ADMISSION.json',S2:'RESULTS.json',J:'POSTRUN-AUDIT.json',D:'FINAL-REVIEW.json'};
function verify_evidence(binding){try{
 const task=plan.tasks.find(x=>x.task_id===binding.task_id),name=artifacts[binding.task_id];assert.equal(binding.artifact_ref,prefix+'/'+name);assert.equal(binding.artifact_digest,sha(binding.artifact_ref));assert.ok(task.completion_criteria.includes(binding.criterion_id));const value=local(name);
 switch(binding.task_id){
  case 'P':assert.deepEqual(value.tasks.map(x=>x.id).sort(),Object.keys(artifacts).sort());break;
  case 'L':case 'C':case 'Q':assert.equal(value.exit_code,0);assert.equal(value.failed,0);assert.ok(value.passed>=16);bindings(value.bindings);break;
  case 'F':bindings(value.bindings);assert.equal(local('PREFLIGHT-REVIEW.json').ready,true);assert.equal(value.combined_maximum_model_tokens,1945600);break;
  case 'S1':assert.ok(value.stages['1']);assert.ok(Object.values(value.stages['1'].statuses).every(s=>!['pending','running'].includes(s)));break;
  case 'G':assert.equal(typeof value.admitted,'boolean');assert.ok(Array.isArray(value.reasons));if(!value.admitted)assert.ok(value.reasons.length);break;
  case 'S2':if(local('SCALING-ADMISSION.json').admitted){assert.ok(value.stages['2']);assert.ok(Object.values(value.stages['2'].statuses).every(s=>!['pending','running'].includes(s)));}else assert.ok(!value.stages['2']);break;
  case 'J':assert.equal(value.ok,true);assert.deepEqual(value.findings,[]);bindings(value.source_bindings);break;
  case 'D':assert.equal(value.complete,true);assert.ok(existsSync(join(dir,'COMPLETION-AUDIT.md')));assert.ok(registrations.every(verify_registration));break;
 }
 return {ok:true,binding};
}catch{return {ok:false,binding};}}
const events=plan.topological_order.flatMap(id=>{const task=plan.tasks.find(x=>x.task_id===id),artifact_ref=prefix+'/'+artifacts[id];return [{event_id:id+'-start',task_id:id,action:'start'},{event_id:id+'-complete',task_id:id,action:'complete',evidence:[{criterion_id:task.completion_criteria[0],artifact_ref,artifact_digest:sha(artifact_ref)}]}];});
const state=replayResearchWork({plan,registrations,events,verify_registration,verify_evidence});assert.ok(state.tasks.every(t=>t.state==='completed'));
const output=JSON.stringify(state,null,2)+'\n',path=join(dir,'research-work-state-postrun.json');
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8'),output);else writeFileSync(path,output,{flag:'wx'});
console.log(JSON.stringify({verified:true,completed_tasks:state.tasks.length,claim_ceiling:'Retrospective evidence-bound task disposition, including conditionally unexecuted stage2; not benchmark success, preregistration or authority admission.'}));
