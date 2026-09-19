// Additive D08 closure of evidence/disposition, never campaign achievement.
// Open questions: POSTRUN-IMPLEMENTATION.md.
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {dir,root,read,sha,save,verifyBindings} from './prepare-live.mjs';
import {register,taskIds} from './register-result.mjs';
import {replayResearchWork} from '../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
const prefix=relative(root,dir);
export function close({check=false}={}){
 const bundle=register({check:true}),{context,registration,verify_registration}=bundle,plan=bundle.artifacts['LIVE-RESEARCH-WORK.json'];
 assert.equal(plan.tasks.length,7);assert.deepEqual(plan.topological_order,taskIds);
 const audit=join(dir,'LIVE-COMPLETION-AUDIT.md');assert.ok(existsSync(audit)&&readFileSync(audit,'utf8').trim().length>0,'completion audit required');
 const names={integration:'LIVE-TEST-RESULTS.json','tokenizer-preflight':'preflight/RESULTS.json',freeze:'LIVE-REVIEW.json','generation-two-workers':'live/generation-complete.json','native-score':'live/evaluation-complete.json','complete-report':'LIVE-RESULTS.json','independent-review':'LIVE-POSTRUN-REVIEW.json'};
 const verify_evidence=b=>{try{
  const task=plan.tasks.find(t=>t.task_id===b.task_id);assert.ok(task&&task.completion_criteria.includes(b.criterion_id));
  const name=b.criterion_id==='Bind completion audit'?'LIVE-COMPLETION-AUDIT.md':names[b.task_id];assert.equal(b.artifact_ref,prefix+'/'+name);assert.equal(b.artifact_digest,sha(join(dir,name)));
  if(name.endsWith('.md'))return {ok:true,binding:b};const value=read(join(dir,name));
  if(b.task_id==='integration'){assert.equal(value.exit_code,0);assert.equal(value.counts.fail,0);assert.ok(value.counts.pass>=59);verifyBindings(value.source_bindings);}
  if(b.task_id==='tokenizer-preflight'){assert.equal(value.admitted,true);assert.equal(value.model_calls,0);assert.equal(value.rows.length,8);assert.deepEqual(value.rows.map(r=>r.task_id+':'+r.arm).sort(),context.result.outcomes.map(o=>o.task_id+':'+o.arm).sort());assert.ok(value.rows.every(r=>r.model_calls===0&&r.admission.request_reservation<=8000));verifyBindings(value.source_bindings);}
  if(b.task_id==='freeze'){assert.equal(value.approved,true);assert.equal(value.freeze_sha256,sha(join(dir,'live-freeze.json')));}
  if(b.task_id==='generation-two-workers')assert.deepEqual(value,context.seal);
  if(b.task_id==='native-score'){assert.equal(value.report_sha256,sha(join(dir,'LIVE-RESULTS.json')));assert.equal(value.model_calls,0);}
  if(b.task_id==='complete-report'){assert.equal(value.outcomes.length,8);assert.equal(value.campaign_goal_achieved,false);}
  if(b.task_id==='independent-review'){assert.equal(value.result_integrity_approved,true);verifyBindings(value.source_bindings);}
  return {ok:true,binding:b};
 }catch{return {ok:false,binding:b};}};
 const events=plan.topological_order.flatMap(task_id=>{const task=plan.tasks.find(t=>t.task_id===task_id);return [{event_id:task_id+'-start',task_id,action:'start'},{event_id:task_id+'-complete',task_id,action:'complete',evidence:task.completion_criteria.map(criterion_id=>{const name=criterion_id==='Bind completion audit'?'LIVE-COMPLETION-AUDIT.md':names[task_id];return {criterion_id,artifact_ref:prefix+'/'+name,artifact_digest:sha(join(dir,name))};})}];});
 const state=replayResearchWork({plan,registrations:[registration],events,verify_registration,verify_evidence});assert.equal(state.tasks.length,7);assert.ok(state.tasks.every(t=>t.state==='completed'));
 const artifacts={'LIVE-RESEARCH-WORK-EVENTS.json':events,'LIVE-RESEARCH-WORK-STATE.json':state};
 if(check){for(const [name,value]of Object.entries(artifacts))assert.deepEqual(read(join(dir,name)),value,name);}
 else{for(const name of Object.keys(artifacts))assert.ok(!existsSync(join(dir,name)),'existing closure artifact: '+name);for(const [name,value]of Object.entries(artifacts))save(join(dir,name),value);}
 return {tasks_completed:7,classification:bundle.kind,campaign_goal_achieved:false};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){assert.ok(process.argv.slice(2).every(x=>x==='--check'));console.log(JSON.stringify(close({check:process.argv.includes('--check')})));}
