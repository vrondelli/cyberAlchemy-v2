// Additive evaluator for AMENDMENT.md. Derived from frozen score.mjs.
// Only evidence paths and amendment metadata differ; scoring and thresholds are unchanged.
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runScheduler} from '../../../../../implementation/agent-reasoning-engine/packages/benchmark-scheduler/scheduler.mjs';
import {createGlmExecutor,verifySourceBindings} from '../concurrent-benchmark-v1/adapter.mjs';
import {scorePair} from './contextbench/run.mjs';
const dir=import.meta.dirname,read=p=>JSON.parse(readFileSync(p,'utf8'));
const save=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx'});
const [command,arg]=process.argv.slice(2),stage=Number(arg),stageDir=n=>join(dir,n===1?'live':'amended-live','stage'+n);
verifySourceBindings({source_bindings:read(join(dir,'freeze.json')).bindings});
verifySourceBindings({source_bindings:read(join(dir,'AMENDMENT-FREEZE.json')).bindings});
function stateAt(n){return read(join(stageDir(n),'checkpoint.json'));}
function pairs(n,benchmark){const manifest=read(join(dir,'stage'+n+'-manifest.json'));return manifest.jobs.filter(j=>j.benchmark===benchmark).map(job=>{const path=n===1&&job.id==='contextbench-4'?join(dir,'amended-live/first-exposure-cb4/pairs/contextbench-4/run'):join(stageDir(n),'pairs',job.id,'run');return {job,path,pair:existsSync(join(path,'result.json'))?read(join(path,'result.json')):null};});}
if(command==='native'){
 assert.ok([1,2].includes(stage));for(const row of pairs(stage,'contextbench')){if(!row.pair)continue;if(!existsSync(join(row.path,'scored-result.json')))await scorePair({directory:row.path});}console.log('Native scoring complete for stage'+stage);
}else if(command==='judge'){
 assert.ok([1,2].includes(stage));verifySourceBindings({source_bindings:read(join(dir,'freeze.json')).bindings});
 const state=stateAt(stage);assert.ok(Object.values(state.jobs).every(j=>!['pending','running'].includes(j.status)),'generation stage must be terminal before gold evaluation');
 const base=resolve(dir,'../benchmark-pilot-v2/execution/longmemeval'),gold=read(join(base,'gold.json')),sources=read(join(base,'inputs.json')),jobs=[];
 for(const {job,pair}of pairs(stage,'longmemeval'))for(const arm of ['control','treatment']){
  const answer=pair?.answers.find(a=>a.arm===arm);if(answer?.status!=='completed')continue;
  const g=gold.find(g=>g.task_id===pair.task_id),row=sources.find(r=>r.task_id===pair.task_id);
  const prompt=execFileSync('python3',['-c',"import json,sys,runpy; d=json.load(sys.stdin); print(runpy.run_path(sys.argv[1])['get_anscheck_prompt'](d['type'],d['question'],d['gold'],d['response'],d['abstention']),end='')",join(base,'native-rubric.py')],{input:JSON.stringify({type:g.question_type,question:row.question,gold:g.answer,response:answer.text,abstention:g.abstention}),encoding:'utf8'});
  const id='judge-'+createHash('sha256').update(JSON.stringify({task:pair.task_id,stage,arm,response:answer.text})).digest('hex').slice(0,24);
  jobs.push({id,depends_on:[],reservation_tokens:7360,input_cap:6976,output_cap:384,kind:'static',messages:[{role:'user',content:prompt}],mapping:{pair_id:job.id,task_id:pair.task_id,arm,repetition:stage}});
 }
 jobs.sort((a,b)=>a.id.localeCompare(b.id));
 const generation=pairs(stage,'longmemeval').reduce((s,r)=>s+(r.pair?.usage.total_tokens??0),0);
 const uncertain=pairs(stage,'longmemeval').some(r=>!r.pair||r.pair.unknown_usage);
 if(uncertain)throw Error('uncertain generation spend prevents new judge dispatch');
 assert.ok(generation+jobs.reduce((s,j)=>s+j.reservation_tokens,0)<=204800,'combined generator/judge budget');
 const out=join(stageDir(stage),'judge');mkdirSync(out,{recursive:true});
 if(jobs.length){const manifest={id:'dual8k-longmemeval-judge-stage'+stage,token_budget:204800-generation,jobs};const result=await runScheduler({manifest,directory:out,concurrency:stage===1?2:4,execute:createGlmExecutor({directory:join(out,'provider')})});console.log(JSON.stringify({stage,judge_known_tokens:result.accounting.known_tokens,jobs:jobs.length}));}
 else save(join(out,'no-answers.json'),{planned:8,completed:0});
}else if(command==='report'){
 const scaling=existsSync(join(dir,'AMENDED-SCALING-ADMISSION.json'))?read(join(dir,'AMENDED-SCALING-ADMISSION.json')):null;
 const active=[1,2].filter(n=>existsSync(join(stageDir(n),'checkpoint.json'))),benchmarks={},stages={};
 for(const n of active){const s=stateAt(n);stages[n]={accounting:s.accounting,statuses:Object.fromEntries(Object.entries(s.jobs).map(([k,v])=>[k,v.status])),workers:read(join(dir,'stage'+n+'-manifest.json')).worker_limits};}
 for(const benchmark of ['longmemeval','contextbench']){
  const rows=[],totals={control:{tokens:0,completed:0,correct:0},treatment:{tokens:0,completed:0,correct:0}};let unknown=false,scoringComplete=true,exposureComplete=true;
  const lengths=read(join(dir,'longmemeval/preflight-result.json')).source_lengths;
  for(const n of [1,2])for(const {job,path,pair}of pairs(n,benchmark)){
   if(!active.includes(n)){rows.push({stage:n,pair:job.id,status:'not-executed'});exposureComplete=false;continue;}
   if(!pair){unknown=true;exposureComplete=false;rows.push({stage:n,pair:job.id,status:'missing'});continue;}
   unknown ||= pair.unknown_usage||pair.unknown_usage_calls>0;
   const scored=benchmark==='contextbench'&&existsSync(join(path,'scored-result.json'))?read(join(path,'scored-result.json')):pair;
   let judge,jmanifest;if(benchmark==='longmemeval'&&existsSync(join(stageDir(n),'judge/checkpoint.json'))){judge=read(join(stageDir(n),'judge/checkpoint.json'));jmanifest=read(join(stageDir(n),'judge/manifest.json'));unknown ||= judge.accounting.unknown_reserved_tokens>0;}
   const result={stage:n,pair:job.id,task_id:pair.task_id,long:benchmark==='contextbench'||lengths.find(x=>x.task_id===pair.task_id)?.long,arms:{}};
   for(const arm of ['control','treatment']){
    const a=scored.arms[arm],generationTokens=a?.usage.total_tokens??0;let judgeTokens=0,correct=false,complete=false,metrics=null,judgeValid=true;
    if(benchmark==='longmemeval'){
     complete=a?.answer?.status==='completed';const j=jmanifest?.jobs.find(j=>j.mapping.pair_id===job.id&&j.mapping.arm===arm),r=j?judge.jobs[j.id]:null;
     judgeTokens=r?.usage?.total_tokens??0;const text=r?.result?.output?.text?.trim().toLowerCase();judgeValid=!complete||(r?.status==='completed'&&['yes','no'].includes(text));correct=complete&&judgeValid&&text==='yes';
     if(!judgeValid)scoringComplete=false;if(a?.calls?.some(c=>c.status!=='completed'))exposureComplete=false;
    }else{complete=a?.complete===true&&a?.reconstructed===true;metrics=a?.metrics??{span_f1:0,span_coverage:0,span_precision:0,file_coverage:0,file_precision:0};if(a?.scoring_pending||a?.scoring_error)scoringComplete=false;if(a?.window_admission_valid!==true||a?.long_trajectory_observed!==true)exposureComplete=false;}
    const tokens=generationTokens+judgeTokens;totals[arm].tokens+=tokens;totals[arm].completed+=Number(complete);totals[arm].correct+=Number(correct);result.arms[arm]={generation_tokens:generationTokens,judge_tokens:judgeTokens,tokens,completed:complete,correct,judge_valid:judgeValid,metrics};
   }
   rows.push(result);
  }
  let quality=true;
  if(benchmark==='contextbench')for(const arm of ['control','treatment']){totals[arm].metrics={};for(const metric of ['span_f1','span_coverage','span_precision','file_coverage','file_precision'])totals[arm].metrics[metric]=rows.reduce((s,r)=>s+(r.arms?.[arm]?.metrics?.[metric]??0),0)/8;}
  if(benchmark==='contextbench')quality=Object.keys(totals.control.metrics).every(m=>totals.treatment.metrics[m]>=totals.control.metrics[m]);else quality=totals.treatment.correct>=totals.control.correct;
  const reduction=totals.control.tokens?1-totals.treatment.tokens/totals.control.tokens:null;
  const longRows=rows.filter(r=>r.long),longTotals=Object.fromEntries(['control','treatment'].map(a=>[a,{tokens:longRows.reduce((s,r)=>s+(r.arms?.[a]?.tokens??0),0),correct:longRows.filter(r=>r.arms?.[a]?.correct).length,completed:longRows.filter(r=>r.arms?.[a]?.completed).length}]));
  const longReduction=longTotals.control.tokens?1-longTotals.treatment.tokens/longTotals.control.tokens:null;
  const passed=active.length===2&&!unknown&&scoringComplete&&exposureComplete&&quality&&totals.treatment.completed>=totals.control.completed&&totals.control.completed===8&&totals.treatment.completed===8&&reduction>=0.15&&longReduction>=0.15&&(benchmark!=='longmemeval'||longTotals.treatment.correct>=longTotals.control.correct);
  benchmarks[benchmark]={passed,planned_per_arm:8,executed_stages:active,unknown_usage:unknown,scoring_complete:scoringComplete,exposure_complete:exposureComplete,totals,relative_token_reduction:reduction,quality_nonregression:quality,long_stratum:{independent_tasks:new Set(longRows.map(x=>x.task_id)).size,totals:longTotals,relative_token_reduction:longReduction},rows,conclusion:passed?benchmark+' met the15% development token-reduction and quality/completion criteria on this limited cohort.':benchmark+' did not establish the complete15% token-efficiency criterion; preserve the measured savings, quality, completion and missing-evidence distinctions.'};
 }
 const result={schema_version:'are.dual8k-result/v1',benchmarks,stages,scaling,all_benchmarks_passed:Object.values(benchmarks).every(x=>x.passed),authority_effect:'none'};result.evidence_status='prospectively amended development evidence; original prerequisite failure preserved';result.amendment_ref='AMENDMENT.md';result.original_zero_exposure_failure='live/stage1/pairs/contextbench-4/run/result.json';result.supplemental_first_exposure='amended-live/first-exposure-cb4/pairs/contextbench-4/run/result.json';result.original_result_ref='RESULTS.json';result.stages[1].supplemental_accounting=read(join(dir,'amended-live/first-exposure-cb4/checkpoint.json')).accounting;save(join(dir,'AMENDED-RESULTS.json'),result);console.log(JSON.stringify(Object.fromEntries(Object.entries(benchmarks).map(([k,v])=>[k,{passed:v.passed,reduction:v.relative_token_reduction,totals:v.totals}]))));
}else throw Error('Usage: score.mjs native STAGE | judge STAGE | report');
