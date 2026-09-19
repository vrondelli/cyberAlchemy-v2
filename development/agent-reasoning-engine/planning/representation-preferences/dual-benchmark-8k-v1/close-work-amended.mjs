// Additive retrospective D08 replay; no provider calls. Open questions: AMENDMENT.md.
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
execFileSync(process.execPath,[join(dir,'research-amended-results.mjs'),'--check'],{maxBuffer:8*1024*1024});
const plan=local('amended-research-work-plan.json'),registrations=local('amended-registrations.json');
const bindings=bs=>{for(const b of bs)assert.equal(sha(b.path),b.sha256,b.path);};
const verify_registration=r=>{try{const{registration_digest,...body}=r;assert.equal(registration_digest,digest(body));bindings([...r.evidence_bindings,...r.implementation.source_bindings]);assert.ok(r.records.every(x=>verifyEvolutionRecord(x).ok));assert.equal(r.records[2].source_result_digest,digest(local('AMENDED-RESULTS.json')));assert.equal(r.records[1].hypothesis_ref,r.records[0].record_id);assert.equal(r.records[3].experiment_ref,r.records[1].record_id);return true;}catch{return false;}};
const artifacts={AF:'AMENDMENT-FREEZE.json',FX:'amended-live/first-exposure-cb4/checkpoint.json',AG:'AMENDED-SCALING-ADMISSION.json',AS2:'AMENDED-RESULTS.json',AJ:'AMENDED-POSTRUN-AUDIT.json',AD:'AMENDED-FINAL-REVIEW.json'};
function verify_evidence(binding){try{
 const task=plan.tasks.find(x=>x.task_id===binding.task_id),name=artifacts[binding.task_id];assert.equal(binding.artifact_ref,prefix+'/'+name);assert.equal(binding.artifact_digest,sha(binding.artifact_ref));assert.ok(task.completion_criteria.includes(binding.criterion_id));const v=local(name);
 switch(binding.task_id){
 case 'AF':bindings(v.bindings);assert.equal(v.original_freeze_sha256,sha(prefix+'/freeze.json'));assert.equal(local('contextbench/infrastructure-repair.json').passed,true);assert.equal(local('live/stage1/pairs/contextbench-4/run/result.json').usage.total_tokens,0);break;
 case 'FX':assert.equal(Object.keys(v.jobs).length,1);assert.ok(!['pending','running'].includes(v.jobs['contextbench-4'].status));break;
 case 'AG':assert.equal(typeof v.admitted,'boolean');assert.ok(Array.isArray(v.reasons));if(!v.admitted)assert.ok(v.reasons.length);assert.equal(local('SCALING-ADMISSION.json').admitted,false);break;
 case 'AS2':if(local('AMENDED-SCALING-ADMISSION.json').admitted){assert.ok(v.stages['2']);assert.ok(Object.values(v.stages['2'].statuses).every(s=>!['pending','running'].includes(s)));}else assert.ok(!v.stages['2']);break;
 case 'AJ':assert.equal(v.ok,true);assert.deepEqual(v.findings,[]);bindings(v.source_bindings);break;
 case 'AD':assert.equal(v.complete,true);assert.ok(existsSync(join(dir,'AMENDED-COMPLETION-AUDIT.md')));assert.ok(registrations.every(verify_registration));break;
 }
 return {ok:true,binding};
}catch{return {ok:false,binding};}}
const events=plan.topological_order.flatMap(id=>{const task=plan.tasks.find(x=>x.task_id===id),artifact_ref=prefix+'/'+artifacts[id];return [{event_id:id+'-start',task_id:id,action:'start'},{event_id:id+'-complete',task_id:id,action:'complete',evidence:[{criterion_id:task.completion_criteria[0],artifact_ref,artifact_digest:sha(artifact_ref)}]}];});
const state=replayResearchWork({plan,registrations,events,verify_registration,verify_evidence});assert.ok(state.tasks.every(t=>t.state==='completed'));
const text=JSON.stringify(state,null,2)+'\n',path=join(dir,'amended-research-work-state.json');if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8'),text);else writeFileSync(path,text,{flag:'wx'});
console.log(JSON.stringify({verified:true,completed_tasks:state.tasks.length,claim_ceiling:'Retrospective amended task disposition; not benchmark success or preregistration.',authority_effect:'none'}));
