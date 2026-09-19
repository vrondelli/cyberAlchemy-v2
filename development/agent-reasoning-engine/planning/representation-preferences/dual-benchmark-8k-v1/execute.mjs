import {readFileSync,writeFileSync,readdirSync,existsSync,mkdirSync,statfsSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runPools} from './pool.mjs';
import {loadRows} from './longmemeval/adapter.mjs';
import {verifySourceBindings} from '../concurrent-benchmark-v1/adapter.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../..'),prefix=relative(root,dir);
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const write=(name,value)=>writeFileSync(join(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const [command,stageArg]=process.argv.slice(2);
if(command==='prepare'){
 const review=read(join(dir,'PREFLIGHT-REVIEW.json'));assert.equal(review.ready,true,'independent preflight review required');
 const tests=read(join(dir,'TEST-RESULTS.json'));assert.equal(tests.exit_code,0);
 const preflight=read(join(dir,'longmemeval/preflight-result.json'));assert.equal(preflight.admitted,true);
 const config=read(join(dir,'contextbench/config.json'));assert.equal(config.context_limit,8000);
 const files=new Set();
 function scan(path,predicate){for(const item of readdirSync(resolve(root,path),{withFileTypes:true})){if(['node_modules','.git','__pycache__'].includes(item.name))continue;const p=path+'/'+item.name;if(item.isDirectory())scan(p,predicate);else if(predicate(item.name,p))files.add(p);}}
 scan(prefix,(name,p)=>!p.includes('/preflight/')&&/\.(mjs|json|md)$/.test(name));
 for(const p of ['implementation/agent-reasoning-engine/packages/coding-agent-runtime','implementation/agent-reasoning-engine/packages/reasoning-state-runtime','implementation/agent-reasoning-engine/packages/benchmark-scheduler','implementation/agent-reasoning-engine/benchmarks/contextbench-v1'])scan(p,name=>name.endsWith('.mjs')||name==='score_native.py');
 for(const p of ['concurrent-benchmark-v1/adapter.mjs','benchmark-pilot-v2/execution/selectivity-v2/provider.mjs','benchmark-pilot-v2/execution/longmemeval-sequential-v2/chunks.mjs','benchmark-pilot-v2/execution/longmemeval-sequential-v2/ledger.mjs','benchmark-pilot-v2/execution/longmemeval/inputs.json','benchmark-pilot-v2/execution/longmemeval/gold.json','benchmark-pilot-v2/execution/longmemeval/native-rubric.py'])files.add('development/agent-reasoning-engine/planning/representation-preferences/'+p);
 for(const t of config.tasks)files.add(relative(root,t.task_path));
 const bindings=[...files].sort().map(path=>({path,sha256:sha(resolve(root,path))}));
 const external_bindings=[config.scorer,config.source_manifest].filter(Boolean).map(path=>({path,sha256:sha(path)}));
 const rows=loadRows();assert.equal(rows.length,4);assert.equal(config.tasks.length,4);
 for(const stage of [1,2]){
  const jobs=[];for(let i=0;i<4;i++){
   // Interleaving prevents one benchmark's waiting group leases occupying every global slot.
   jobs.push({id:'contextbench-'+(i+1),benchmark:'contextbench',depends_on:[],reservation_tokens:192000,config:{task_id:config.tasks[i].id,repetition:stage}});
   jobs.push({id:'longmemeval-'+(i+1),benchmark:'longmemeval',depends_on:[],reservation_tokens:51200,config:{row:rows[i],repetition:stage}});
  }
  write('stage'+stage+'-manifest.json',{id:'dual8k-stage'+stage,global_workers:stage===1?4:8,worker_limits:{contextbench:stage===1?2:4,longmemeval:stage===1?2:4},benchmark_budgets:{contextbench:768000,longmemeval:204800},token_budget:972800,context_limit:8000,jobs,source_bindings:bindings});
 }
 write('freeze.json',{created_at:new Date().toISOString(),bindings:[...bindings,...[1,2].map(n=>({path:prefix+'/stage'+n+'-manifest.json',sha256:sha(join(dir,'stage'+n+'-manifest.json'))}))],external_bindings,combined_maximum_model_tokens:1945600,authority_effect:'none'});
 console.log('Both stages frozen:2per benchmark then conditional4per benchmark.');
}else if(command==='run'){
 const stage=Number(stageArg);assert.ok([1,2].includes(stage));const freeze=read(join(dir,'freeze.json'));verifySourceBindings({source_bindings:freeze.bindings});for(const b of freeze.external_bindings)assert.equal(sha(b.path),b.sha256);
 if(stage===2)assert.equal(read(join(dir,'SCALING-ADMISSION.json')).admitted,true,'stage2 not admitted');
 const out=join(dir,'live','stage'+stage);mkdirSync(out,{recursive:true});const disk=statfsSync(out);assert.ok(disk.bavail*disk.bsize>=5*1024**3);
 const state=await runPools({manifest:read(join(dir,'stage'+stage+'-manifest.json')),directory:out});
 console.log(JSON.stringify({stage,accounting:state.accounting,jobs:Object.fromEntries(Object.entries(state.jobs).map(([id,j])=>[id,j.status]))}));
}else if(command==='scaling'){
 const state=read(join(dir,'live/stage1/checkpoint.json')),rows=Object.values(state.jobs),reasons=[];
 if(rows.length!==8||rows.some(r=>r.status!=='completed'))reasons.push('not-all-pair-jobs-accounted-completed');
 if(state.accounting.unknown_reserved_tokens||state.accounting.running_reserved_tokens)reasons.push('unknown-or-running-usage');
 if(state.concurrency!==4)reasons.push('provider-capacity-reduction');
 for(const [id,r]of Object.entries(state.jobs)){
  const pair=r.result?.pair_result;
  if(!pair){reasons.push(id+':missing-pair');continue;}
  if(pair.unknown_usage||pair.unknown_usage_calls>0)reasons.push(id+':unknown-usage');
  if(pair.provider_error_code||pair.rate_limited||[429,503].includes(pair.provider_status))reasons.push(id+':provider-capacity');
  // Task failures remain benchmark outcomes; only integrity/accounting failures block scaling.
  if(/admission|context.*exceed|reservation|source.*mismatch/i.test(JSON.stringify(pair.failure??pair.failures??'')))reasons.push(id+':admission-failure');
  for(const arm of Object.values(pair.arms??{})){if(!(arm.usage?.total_tokens>0))reasons.push(id+':no-model-exposure');if(id.startsWith('contextbench')&&arm.window_admission_valid!==true)reasons.push(id+':invalid-window');}
 }
 const events=readFileSync(join(dir,'live/stage1/pool-events.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse),peaks={contextbench:0,longmemeval:0};let global=0;
 for(const e of events){for(const k of Object.keys(peaks))peaks[k]=Math.max(peaks[k],e.active[k]);global=Math.max(global,Object.values(e.active).reduce((a,b)=>a+b,0));}
 if(peaks.contextbench!==2||peaks.longmemeval!==2||global!==4)reasons.push('two-per-benchmark-worker-overlap-unproven');
 const intervals={contextbench:[],longmemeval:[]};
 for(const id of Object.keys(state.jobs)){const base=join(dir,'live/stage1/pairs',id,'run');if(!existsSync(base))continue;
  if(id.startsWith('longmemeval'))for(const name of readdirSync(base).filter(x=>x.endsWith('-receipt.json'))){const r=read(join(base,name));if(r.kind==='model')intervals.longmemeval.push([Date.parse(r.started_at),Date.parse(r.finished_at)]);}
  else for(const arm of ['control','treatment']){const p=join(base,arm,'model-timing.jsonl');if(existsSync(p))for(const r of readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse))intervals.contextbench.push([r.start_ms,r.end_ms]);}
 }
 const peakOf=xs=>{let n=0,peak=0;for(const [t,d]of xs.flatMap(([a,b])=>[[a,1],[b,-1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1])){assert.ok(Number.isFinite(t),'invalid model timing');n+=d;peak=Math.max(peak,n);}return peak;};
 const model_peaks=Object.fromEntries(Object.entries(intervals).map(([k,v])=>[k,peakOf(v)])),global_model_peak=peakOf(Object.values(intervals).flat());
 if(model_peaks.contextbench<2||model_peaks.longmemeval<2||global_model_peak<4)reasons.push('four-total-real-request-overlap-unproven');
 const judgePath=join(dir,'live/stage1/judge/checkpoint.json');if(existsSync(judgePath)){const j=read(judgePath);if(j.accounting.unknown_reserved_tokens||Object.values(j.jobs).some(r=>r.rate_limit_code||r.status!=='completed'))reasons.push('judge-transport-or-accounting-failure');}
 else reasons.push('stage1-judge-accounting-missing');
 const result={admitted:reasons.length===0,reasons,worker_peaks:peaks,global_worker_peak:global,model_peaks,global_model_peak,quality_outcomes_not_used_to_select_scaling:true,known_generation_tokens:state.accounting.known_tokens,authority_effect:'none'};
 write('SCALING-ADMISSION.json',result);console.log(JSON.stringify(result));
}else throw Error('Usage: execute.mjs prepare|run 1|run 2|scaling');
