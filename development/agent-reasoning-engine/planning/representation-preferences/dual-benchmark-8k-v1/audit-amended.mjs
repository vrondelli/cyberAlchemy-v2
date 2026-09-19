// Additive, offline independent reconciliation. Never invokes providers or mutates frozen files.
// Open questions: REVIEW.md#open-questions.
import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir=import.meta.dirname,root=resolve(dir,'../../../../..');
const read=p=>JSON.parse(readFileSync(p,'utf8')),local=p=>read(join(dir,p));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const findings=[],sources=[],rows=[],stages=[];
const check=(ok,message)=>{if(!ok)findings.push(message);};
const bind=p=>{sources.push({path:relative(root,p),sha256:sha(p)});return read(p);};
const freeze=bind(join(dir,'freeze.json'));
for(const b of [...freeze.bindings,...freeze.external_bindings])check(existsSync(resolve(root,b.path))&&sha(resolve(root,b.path))===b.sha256,'frozen source mismatch: '+b.path);
const amendment=bind(join(dir,'AMENDMENT-FREEZE.json'));
for(const b of amendment.bindings)check(sha(resolve(root,b.path))===b.sha256,'amendment source mismatch: '+b.path);
const results=bind(join(dir,'AMENDED-RESULTS.json'));
const stageBase=n=>join(dir,n===1?'live':'amended-live',`stage${n}`);
const pairBase=(n,id)=>n===1&&id==='contextbench-4'?join(dir,'amended-live/first-exposure-cb4/pairs/contextbench-4/run'):join(stageBase(n),'pairs',id,'run');
const supplement=bind(join(dir,'amended-live/first-exposure-cb4/checkpoint.json'));
const original=bind(join(dir,'live/stage1/pairs/contextbench-4/run/result.json'));
check(original.usage.total_tokens===0&&!original.unknown_usage&&Object.values(original.arms).every(a=>a.usage.model_calls===0),'original CB4 was not zero-exposure');
function receipts(directory){
 let known=0,unknown=0,calls=0;const completed=new Set();
 if(!existsSync(directory))return {known,unknown,calls};
 for(const file of readdirSync(directory).filter(x=>x.endsWith('-receipt.json'))){const r=read(join(directory,file));if(r.kind!=='model')continue;completed.add(file.replace(/-receipt.json$/,''));calls++;
  if(Number.isSafeInteger(r.usage?.prompt_tokens)&&r.usage.prompt_tokens>=0&&Number.isSafeInteger(r.usage?.completion_tokens)&&r.usage.completion_tokens>=0&&r.usage.total_tokens===r.usage.prompt_tokens+r.usage.completion_tokens)known+=r.usage.total_tokens;else unknown++;
 }
 for(const file of readdirSync(directory).filter(x=>x.endsWith('-started.json'))){const r=read(join(directory,file));if(r.kind==='model'&&!completed.has(file.replace(/-started.json$/,''))){unknown++;calls++;}}
 return {known,unknown,calls};
}
function contextReceipts(directory){
 const file=join(directory,'state/glm-transport-ledger.json');if(!existsSync(file))return {known:0,unknown:0,calls:0};
 const ledger=read(file),models=ledger.receipts.filter(r=>r.kind==='model'&&r.dispatched);let known=0,unknown=0;
 for(const r of models)if(Number.isSafeInteger(r.input_tokens)&&r.input_tokens>=0&&Number.isSafeInteger(r.output_tokens)&&r.output_tokens>=0)known+=r.input_tokens+r.output_tokens;else unknown++;
 unknown+=Math.max(0,ledger.model_calls-models.length);return {known,unknown,calls:ledger.model_calls};
}
for(const stage of [1,2]){
 const manifest=bind(join(dir,`stage${stage}-manifest.json`)),base=stageBase(stage),path=join(base,'checkpoint.json');
 check(manifest.jobs.length===8,'stage denominator not8: '+stage);
 for(const b of ['longmemeval','contextbench'])check(manifest.jobs.filter(j=>j.benchmark===b).length===4,'benchmark denominator not4: '+stage+':'+b);
 if(!existsSync(path)){stages.push({stage,executed:false});continue;}
 const state=bind(path);check(Object.values(state.jobs).every(j=>!['running','pending'].includes(j.status)),'stage is not terminal: '+stage);
 let physicalKnown=0,rawUnknown=0;
 for(const job of manifest.jobs){
  const pairDir=pairBase(stage,job.id),pairPath=join(pairDir,'result.json');
  if(!existsSync(pairPath)){rows.push({stage,id:job.id,benchmark:job.benchmark,status:'missing',scheduler_status:state.jobs[job.id]?.status});continue;}
  const pair=bind(pairPath);let raw;
  if(job.benchmark==='longmemeval')raw=receipts(pairDir);
  else {const arms=['control','treatment'].map(a=>contextReceipts(join(pairDir,a)));raw={known:arms.reduce((s,r)=>s+r.known,0),unknown:arms.reduce((s,r)=>s+r.unknown,0),calls:arms.reduce((s,r)=>s+r.calls,0)};}
  check(raw.known===pair.usage.total_tokens,'raw generation usage mismatch: '+stage+':'+job.id);
  check(!raw.unknown||pair.unknown_usage===true,'unreported raw unknown usage: '+stage+':'+job.id);
  check(pair.usage.total_tokens<=job.reservation_tokens,'pair reservation exceeded: '+stage+':'+job.id);
  const sum=Object.values(pair.arms).reduce((s,a)=>s+(a.usage?.total_tokens??0),0);check(sum===raw.known,'arm generation totals mismatch: '+stage+':'+job.id);
  physicalKnown+=raw.known;rawUnknown+=raw.unknown;
  rows.push({stage,id:job.id,benchmark:job.benchmark,status:pair.status,raw_known_tokens:raw.known,raw_unknown_calls:raw.unknown,raw_model_calls:raw.calls});
 }
 const judgeDir=join(base,'judge'),jpath=join(judgeDir,'checkpoint.json');let judge={known:0,unknown:0,calls:0};
 if(existsSync(jpath)){const j=bind(jpath);judge=receipts(join(judgeDir,'provider'));check(judge.known===j.accounting.known_tokens,'raw judge usage mismatch: '+stage);check(!judge.unknown||j.accounting.unknown_reserved_tokens>0,'unreported judge unknown usage: '+stage);}
 check(physicalKnown===state.accounting.known_tokens+(stage===1?supplement.accounting.known_tokens:0),'physical generation reconciliation mismatch: '+stage);
 const conservative=state.accounting.accounted_tokens+(stage===1?supplement.accounting.accounted_tokens:0)+(existsSync(jpath)?read(jpath).accounting.accounted_tokens:0);
 check(conservative<=972800,'stage global conservative budget exceeded: '+stage);
 stages.push({stage,executed:true,generation_known_tokens:physicalKnown,judge_known_tokens:judge.known,known_physical_tokens:physicalKnown+judge.known,raw_unknown_calls:rawUnknown+judge.unknown,conservative_accounted_tokens:conservative});
}
for(const benchmark of ['longmemeval','contextbench']){
 const b=results.benchmarks[benchmark];check(b.planned_per_arm===8&&b.rows.length===8,'result denominator mismatch: '+benchmark);
 for(const arm of ['control','treatment']){
  const tokens=b.rows.reduce((s,r)=>s+(r.arms?.[arm]?.tokens??0),0);check(tokens===b.totals[arm].tokens,'result row sum mismatch: '+benchmark+':'+arm);
  for(const row of b.rows.filter(r=>r.arms)){
   const base=stageBase(row.stage),pair=read(join(pairBase(row.stage,row.pair),'result.json')),a=row.arms[arm];
   check(a.generation_tokens===pair.arms[arm].usage.total_tokens,'reported generation cost mismatch: '+row.pair+':'+arm);
   let cost=0;
   if(benchmark==='longmemeval'&&existsSync(join(base,'judge/manifest.json'))){const m=read(join(base,'judge/manifest.json')),s=read(join(base,'judge/checkpoint.json')),j=m.jobs.find(j=>j.mapping.pair_id===row.pair&&j.mapping.arm===arm);cost=j?(s.jobs[j.id].usage?.total_tokens??0):0;}
   check(a.judge_tokens===cost,'reported judge cost mismatch: '+row.pair+':'+arm);check(a.tokens===a.generation_tokens+a.judge_tokens,'all-model cost mismatch: '+row.pair+':'+arm);
  }
 }
 const ratio=b.totals.control.tokens?1-b.totals.treatment.tokens/b.totals.control.tokens:null;check(ratio===b.relative_token_reduction,'reduction ratio mismatch: '+benchmark);
 if(b.passed)check(b.executed_stages.length===2&&!b.unknown_usage&&b.scoring_complete&&b.exposure_complete&&b.quality_nonregression&&b.totals.control.completed===8&&b.totals.treatment.completed===8&&ratio>=.15&&b.long_stratum.relative_token_reduction>=.15,'invalid success claim: '+benchmark);
}
check(stages.reduce((s,x)=>s+(x.conservative_accounted_tokens??0),0)<=1945600,'two-stage global budget exceeded');
check(results.all_benchmarks_passed===Object.values(results.benchmarks).every(b=>b.passed),'combined verdict mismatch');
const output={schema_version:'are.dual8k-independent-raw-audit/v1',ok:findings.length===0,findings,stages,rows,known_physical_tokens:stages.reduce((s,x)=>s+(x.known_physical_tokens??0),0),source_bindings:sources,scope:'Raw receipt and fixed-denominator accounting reconstruction; quality judgments remain separate.',authority_effect:'none',open_questions_ref:'REVIEW.md#open-questions'};
const encoded=JSON.stringify(output,null,2)+'\n',target=join(dir,'AMENDED-POSTRUN-AUDIT.json');
if(process.argv.includes('--check'))assert.equal(readFileSync(target,'utf8'),encoded);else if(process.argv.includes('--write'))writeFileSync(target,encoded,{flag:'wx'});
console.log(JSON.stringify(output));if(!output.ok)process.exitCode=1;
