// Retrospective diagnostic closure only. Open questions: LIVE-COMPLETION-AUDIT.md.
import assert from 'node:assert/strict';
import {join,relative} from 'node:path';
import {dir,root,read,sha,save,verifyFreeze} from './live.mjs';
import {replayResearchWork} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {verifyEvolutionRecord} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {digest} from '../../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
verifyFreeze();
const prefix=relative(root,dir),local=p=>read(join(dir,p)),plan=local('LIVE-RESEARCH-WORK.json'),registration=local('LIVE-REGISTRATION.json'),result=local('LIVE-RESULTS.json');
const bindings=bs=>{for(const b of bs)assert.equal(sha(join(root,b.path)),b.sha256,b.path);};
function verify_registration(r){try{const{registration_digest,...body}=r;assert.equal(registration_digest,digest(body));bindings([...r.evidence_bindings,...r.implementation.source_bindings]);assert.ok(r.records.every(x=>verifyEvolutionRecord(x).ok));assert.equal(r.records[2].source_result_digest,digest(result));assert.equal(r.records[2].observation_kind,'inconclusive');assert.equal(r.records[3].supporting_count,0);return true;}catch{return false;}}
const artifacts={freeze:'LIVE-REVIEW.json',generation:'live/generation-complete.json',judge:'live/judge/complete.json',report:'LIVE-RESULTS.json',audit:'LIVE-POSTRUN-REVIEW.json'};
function verify_evidence(b){try{
 const task=plan.tasks.find(t=>t.task_id===b.task_id),name=artifacts[b.task_id];assert.equal(b.artifact_ref,prefix+'/'+name);assert.equal(b.artifact_digest,sha(join(root,b.artifact_ref)));assert.ok(task.completion_criteria.includes(b.criterion_id));const v=local(name);
 if(b.task_id==='freeze'){assert.equal(v.approved,true);assert.equal(v.freeze_sha256,sha(join(dir,'live-freeze.json')));}
 if(b.task_id==='generation'){assert.equal(Object.keys(v.statuses).length,4);assert.ok(Object.values(v.statuses).every(s=>s==='completed'));assert.equal(v.health_stop,false);assert.equal(v.accounting.known_tokens,21943);assert.equal(v.accounting.unknown_reserved_tokens,0);}
 if(b.task_id==='judge'){assert.equal(v.accounting.known_tokens,2508);assert.equal(v.accounting.unknown_reserved_tokens,0);assert.equal(result.outcomes.length,8);assert.ok(result.outcomes.every(o=>o.judge_valid));}
 if(b.task_id==='report'){assert.equal(v.outcomes.length,8);assert.ok(v.outcomes.every(o=>o.completed&&o.judge_valid));assert.equal(v.accounting.known_tokens,24451);assert.equal(v.accounting.unknown_reserved_tokens,0);assert.equal(v.campaign_goal_achieved,false);}
 if(b.task_id==='audit'){assert.equal(v.result_integrity_approved,true);assert.equal(v.campaign_goal_achieved,false);assert.equal(v.model_requests,16);assert.ok(v.maximum_measured_input_plus_reserved_output<=8000);bindings(v.source_bindings);assert.ok(verify_registration(registration));}
 return {ok:true,binding:b};
 }catch(e){console.error(e.message);return {ok:false,binding:b};}}
const events=plan.topological_order.flatMap(task_id=>{const task=plan.tasks.find(t=>t.task_id===task_id),artifact_ref=prefix+'/'+artifacts[task_id];return [{event_id:task_id+'-start',task_id,action:'start'},{event_id:task_id+'-complete',task_id,action:'complete',evidence:[{criterion_id:task.completion_criteria[0],artifact_ref,artifact_digest:sha(join(root,artifact_ref))}]}];});
const state=replayResearchWork({plan,registrations:[registration],events,verify_registration,verify_evidence});assert.equal(state.tasks.length,5);assert.ok(state.tasks.every(t=>t.state==='completed'));
if(process.argv.includes('--check'))assert.deepEqual(local('LIVE-RESEARCH-WORK-STATE.json'),state);else{save(join(dir,'LIVE-RESEARCH-WORK-EVENTS.json'),events);save(join(dir,'LIVE-RESEARCH-WORK-STATE.json'),state);}
console.log(JSON.stringify({diagnostic_tasks_completed:5,campaign_goal_achieved:false}));
