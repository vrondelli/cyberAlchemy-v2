// Evaluator-only boundary: invoked after the sealed generation stage is terminal.
import {existsSync,mkdirSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {dir,root,read,save,verifyFreeze} from './live.mjs';
import {createProvider} from './provider.mjs';
import {createExecutor} from '../../dual-benchmark-8k-v1/longmemeval/adapter.mjs';
import {runScheduler} from '../scheduler.mjs';
import {assertStorageCapacity} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs';
function generation(){
 const state=read(join(dir,'live/checkpoint.json'));assert.ok(Object.values(state.jobs).every(j=>!['pending','running'].includes(j.status)),'generation still live');
 const manifest=read(join(dir,'live-manifest.json'));
 const rows=manifest.jobs.map(job=>{const r=join(dir,'live/pairs',job.id,'result.json'),f=join(dir,'live',job.id+'-failure.json');return {job,pair:existsSync(r)?read(r):existsSync(f)?read(f):state.jobs[job.id].result?.pair_result??null};});
 return {state,rows};
}
export async function judge(){
 verifyFreeze();const {state,rows}=generation();assert.equal(state.accounting.unknown_reserved_tokens,0,'unknown spend prevents new judge calls');assert.ok(rows.every(r=>r.pair&&!r.pair.unknown_usage),'missing generation evidence');
 const base=resolve(dir,'../../benchmark-pilot-v2/execution/longmemeval'),gold=read(join(base,'gold.json')),sources=read(join(base,'inputs.json')),jobs=[];
 for(const {job,pair}of rows)for(const answer of pair.answers){
  if(answer.status!=='completed')continue;
  const g=gold.find(g=>g.task_id===pair.task_id),row=sources.find(r=>r.task_id===pair.task_id);assert.ok(g&&row);
  const prompt=execFileSync('python3',['-c',"import json,sys,runpy; d=json.load(sys.stdin); print(runpy.run_path(sys.argv[1])['get_anscheck_prompt'](d['type'],d['question'],d['gold'],d['response'],d['abstention']),end='')",join(base,'native-rubric.py')],{input:JSON.stringify({type:g.question_type,question:row.question,gold:g.answer,response:answer.text,abstention:g.abstention}),encoding:'utf8'});
  const id='judge-'+createHash('sha256').update(JSON.stringify([pair.task_id,answer.arm,answer.answer_sha256])).digest('hex').slice(0,24);
  jobs.push({id,kind:'static',depends_on:[],input_cap:6976,output_cap:384,reservation_tokens:7360,messages:[{role:'user',content:prompt}],mapping:{pair_id:job.id,arm:answer.arm,answer_sha256:answer.answer_sha256}});
 }
 assert.ok(jobs.length<=8&&jobs.reduce((s,j)=>s+j.reservation_tokens,0)<=58880);jobs.sort((a,b)=>a.id.localeCompare(b.id));
 const directory=join(dir,'live/judge');mkdirSync(directory,{recursive:true});
 if(!jobs.length){save(join(directory,'no-answers.json'),{assigned_answer_slots:8,judge_calls:0});return;}
 const provider=createProvider({directory:join(directory,'provider')}),execute=createExecutor({provider}),manifest={id:'longmem-scope-v2-native-judge',token_budget:58880,jobs};let stopped=false;
 const judged=await runScheduler({manifest,directory,concurrency:2,execute:async(job,ctx)=>{
  if(stopped)throw Object.assign(Error('judge health stop'),{receipt:{usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0}}});
  try{assertStorageCapacity({outRoot:dir});}catch(e){e.receipt={usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0}};throw e;}
  try{return await execute(job,ctx);}catch(e){if(!e.receipt?.usage||[429,503].includes(e.receipt?.status)||e.receipt?.persistence_failure)stopped=true;throw e;}
 }});
 save(join(directory,'complete.json'),{accounting:judged.accounting});console.log(JSON.stringify({stage:'judge-terminal',accounting:judged.accounting}));
}
export function report(){
 verifyFreeze();const {state,rows}=generation(),jd=join(dir,'live/judge'),js=existsSync(join(jd,'checkpoint.json'))?read(join(jd,'checkpoint.json')):null,jm=existsSync(join(jd,'manifest.json'))?read(join(jd,'manifest.json')):null;
 assert.ok(!js||Object.values(js.jobs).every(j=>!['pending','running'].includes(j.status)),'judge still live');
 const totals=Object.fromEntries(['baseline','scope'].map(a=>[a,{planned:4,completed:0,correct:0,valid_judgments:0,generation_tokens:0,judge_tokens:0,tokens:0}])),outcomes=[];
 for(const {job,pair}of rows)for(const arm of ['baseline','scope']){
  const call=pair?.calls.find(c=>c.arm===arm),answer=pair?.answers.find(a=>a.arm===arm),jj=jm?.jobs.find(j=>j.mapping.pair_id===job.id&&j.mapping.arm===arm),jr=jj?js.jobs[jj.id]:null;
  if(jj)assert.equal(jj.mapping.answer_sha256,answer.answer_sha256);
  const text=jr?.result?.output?.text?.trim().toLowerCase(),completed=answer?.status==='completed',valid=jr?.status==='completed'&&['yes','no'].includes(text),correct=completed&&valid&&text==='yes';
  const generation_tokens=call?.usage?.total_tokens??0,judge_tokens=jr?.usage?.total_tokens??0;
  const row={pair_id:job.id,task_id:job.pair.task_id,arm,completed,judge_valid:valid,correct,generation_tokens,judge_tokens,tokens:generation_tokens+judge_tokens,answer_sha256:answer?.answer_sha256??null,judge_job:jj?.id??null};outcomes.push(row);
  const t=totals[arm];t.completed+=Number(completed);t.correct+=Number(correct);t.valid_judgments+=Number(valid);t.generation_tokens+=generation_tokens;t.judge_tokens+=judge_tokens;t.tokens+=row.tokens;
 }
 const unknown=state.accounting.unknown_reserved_tokens+(js?.accounting.unknown_reserved_tokens??0),known=state.accounting.known_tokens+(js?.accounting.known_tokens??0);
 if(!unknown)assert.equal(totals.baseline.tokens+totals.scope.tokens,known);
 const result={protocol:'longmem-scope-policy-diagnostic-v2',totals,outcomes,accounting:{known_tokens:known,unknown_reserved_tokens:unknown,generation_tokens:state.accounting.known_tokens,judge_tokens:js?.accounting.known_tokens??0},diagnostic_passed:!unknown&&totals.scope.correct===4&&totals.baseline.completed===4&&totals.scope.completed===4&&totals.baseline.valid_judgments===4&&totals.scope.valid_judgments===4,relative_tokens_vs_same_evidence_baseline:1-totals.scope.tokens/totals.baseline.tokens,campaign_goal_achieved:false,limitations:['Four exposed development tasks and one repetition; no population or perfect benchmark claim.','Both arms use identical projected evidence: not a comparison against full sequential ingestion.','Native same-model rubric judgment is the declared score, not independent truth proof.','All failed or missing outcomes retained; no outcome replacement.'],authority_effect:'none',open_questions_ref:'LIVE-PROTOCOL.md'};
 save(join(dir,'LIVE-RESULTS.json'),result);console.log(JSON.stringify(result));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){if(process.argv[2]==='judge')await judge();else if(process.argv[2]==='report')report();else throw Error('judge | report');}
