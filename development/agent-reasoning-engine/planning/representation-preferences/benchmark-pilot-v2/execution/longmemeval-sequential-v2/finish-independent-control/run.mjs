import {readFileSync,writeFileSync,mkdirSync,existsSync,statfsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {ROOT,sha,createProvider} from '../../selectivity-v2/provider.mjs';
import {prepareTasks} from '../prepare.mjs';
import {ingestionMessages,answerMessages} from '../chunks.mjs';
const dir=import.meta.dirname,json=p=>JSON.parse(readFileSync(join(dir,p)));
const approval=json('freeze.json');if(approval.status!=='reviewed-independent-tail')throw Error('unreviewed tail');
for(const b of approval.bindings)if(sha(readFileSync(resolve(ROOT,b.path)))!==b.sha256)throw Error('tail source drift');
const original=json('../freeze.json');for(const b of original.bindings)if(sha(readFileSync(resolve(ROOT,b.path)))!==b.sha256)throw Error('original source drift');
const prior=json('../recovery-v1/live/result.json');
if(prior.status!=='stopped'||prior.completed_answers!==14||prior.total_tokens!==139074||!prior.usage_complete||prior.failed_call!=='r2-longmemeval-eeda8a6d_abs-treatment-ingestion-1'||prior.failure!=='incomplete-output')throw Error('unexpected boundary');
const task=prepareTasks().find(t=>t.task_id==='longmemeval:eeda8a6d_abs'),preflight=json('../preflight-compact-notes/result.json');
if(prior.calls.some(c=>c.task_id===task.task_id&&c.arm==='control'&&c.repetition===2))throw Error('control already attempted');
for(let step=0;step<=task.chunks.length;step++){const phase=step===task.chunks.length?'answer':'ingestion',id=`r2-longmemeval-eeda8a6d_abs-control-${phase}-${step}`;for(const source of ['../live','../recovery-v1/live'])if(existsSync(join(dir,source,id+'-started.json')))throw Error('control dispatch already started');}
const disk=statfsSync(dir);if(disk.bavail*disk.bsize<2*1024**3)throw Error('disk floor');
const {verifyResearchContinuity}=await import(resolve(ROOT,'implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs'));const binding=json('../run-continuity.json');const cv=verifyResearchContinuity({binding,policy:JSON.parse(readFileSync(resolve(ROOT,binding.policy_ref))),hypotheses:json('../run-hypotheses.json'),phase:'freeze',root:ROOT});if(!cv.ok)throw Error(JSON.stringify(cv));
const out=join(dir,'live');mkdirSync(out);const provider=createProvider({directory:out});
const calls=[];let notes='',total=prior.total_tokens;
let stoppedSaved=false;
const save=(status,extra={})=>{if(status==='stopped')stoppedSaved=true;writeFileSync(join(out,'result.json'),JSON.stringify({status,prior_total_tokens:prior.total_tokens,total_tokens:total,calls,usage_complete:true,...extra},null,2)+'\n');};
try{
for(let step=0;step<=task.chunks.length;step++){
 const phase=step===task.chunks.length?'answer':'ingestion',id=`r2-longmemeval-eeda8a6d_abs-control-${phase}-${step}`;
 const reservation=preflight.calls.find(c=>c.task_id===task.task_id&&c.phase===phase&&(phase==='answer'||c.arm==='control'&&c.chunk===step));
 const cap=reservation.input_tokens+reservation.carried_notes_reservation,max=reservation.output_reserve;
 if(total+cap+max>199499)throw Error('tail budget');
 const messages=phase==='answer'?answerMessages(task,notes):ingestionMessages(task.chunks[step],'control',notes);
 const measured=await provider.tokenize(id+'-admission',messages);if(measured.usage.prompt_tokens>cap)throw Error('tail admission');
 let r;try{r=await provider.generate(id,messages,max);}catch(e){const u=e.receipt?.usage,known=Number.isSafeInteger(u?.prompt_tokens)&&u.prompt_tokens>=0&&Number.isSafeInteger(u?.completion_tokens)&&u.completion_tokens>=0&&Number.isSafeInteger(u?.total_tokens)&&u.total_tokens===u.prompt_tokens+u.completion_tokens;if(known)total+=u.total_tokens;save('stopped',{failed_call:id,usage_complete:known,failed_usage:u??null});throw e;}
 total+=r.usage.total_tokens;calls.push({id,task_id:task.task_id,arm:'control',repetition:2,phase,step,usage:r.usage,output:r.output});
 if(r.usage.prompt_tokens>cap||total>199499){save('stopped');throw Error('actual tail reservation exceeded');}
 notes=r.output;save('running');console.log(JSON.stringify({tail_calls:calls.length,total_tokens:total}));
}
save('completed');
}catch(error){if(!stoppedSaved)save('stopped',{failure:error.receipt?.failure??String(error.message)});throw error;}
