// Additive read-only timing analysis. No providers, prompts, gold or frozen edits.
// Open questions: README.md. Local API lifecycles are not provider server instances.
import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {join,resolve,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
const groups=['contextbench','longmemeval'];
const text=(p,limit=8*1024*1024)=>{if(statSync(p).size>limit)throw Error('bounded metadata limit:'+p);return readFileSync(p,'utf8');};
const read=p=>JSON.parse(text(p));
const lines=p=>existsSync(p)?text(p).split('\n').filter(Boolean).map(s=>JSON.parse(s)):[];
const iso=n=>Number.isFinite(n)?new Date(n).toISOString():null;
const quantile=(xs,q)=>{if(!xs.length)return null;const x=[...xs].sort((a,b)=>a-b);return x[Math.max(0,Math.ceil(q*x.length)-1)];};
export function intervalPeaks(intervals){
  const events=intervals.filter(x=>x.end_ms>x.start_ms).flatMap(x=>[{at:x.start_ms,delta:1,group:x.group},{at:x.end_ms,delta:-1,group:x.group}]).sort((a,b)=>a.at-b.at||a.delta-b.delta);
  const active={contextbench:0,longmemeval:0},peaks={contextbench:0,longmemeval:0};let global=0,firstPeak=null;
  for(const e of events){active[e.group]+=e.delta;for(const g of groups)peaks[g]=Math.max(peaks[g],active[g]);const total=active.contextbench+active.longmemeval;if(total>global){global=total;firstPeak={at:iso(e.at),active:{...active}};}}
  return {global,by_benchmark:peaks,first_global_peak:firstPeak};
}
function timingSummary(intervals){
  const duration=intervals.map(x=>x.end_ms-x.start_ms),start=intervals.length?Math.min(...intervals.map(x=>x.start_ms)):null,end=intervals.length?Math.max(...intervals.map(x=>x.end_ms)):null;
  const http429=intervals.filter(x=>x.status===429).length,http503=intervals.filter(x=>x.status===503).length;
  return {requests:intervals.length,start:iso(start),end:iso(end),observed_span_ms:start===null?null:end-start,total_request_lifecycle_ms:duration.reduce((a,b)=>a+b,0),latency_ms:{p50:quantile(duration,.5),p95:quantile(duration,.95),maximum:duration.length?Math.max(...duration):null},http429:{count:http429,fraction:intervals.length?http429/intervals.length:null},http503:{count:http503,fraction:intervals.length?http503/intervals.length:null},non200_requests:intervals.filter(x=>x.status!==200).length};
}
export function analyzeCapacityStage(directory,{requireTerminal=true}={}){
  const checkpointPath=join(directory,'checkpoint.json'),manifestPath=join(directory,'manifest.json');
  if(!existsSync(checkpointPath)||!existsSync(manifestPath))throw Error('stage metadata missing:'+directory);
  const checkpoint=read(checkpointPath),manifest=read(manifestPath),jobs=checkpoint.jobs??{},records=Object.values(jobs);
  const terminal=records.length===manifest.jobs.length&&records.every(r=>!['pending','running'].includes(r.status))&&!existsSync(join(directory,'.scheduler-lock'));
  if(requireTerminal&&!terminal)throw Error('final capacity report requires terminal stage:'+directory);
  const supplementary=/first-exposure|supplement/i.test(basename(directory));
  const configured=manifest.worker_limits??Object.fromEntries(groups.map(g=>[g,manifest.jobs.some(j=>j.benchmark===g)?checkpoint.concurrency:0]));
  const intervals=[],issues=[],coverage=[];
  for(const job of manifest.jobs){
    const pair=join(directory,'pairs',job.id,'run'),group=job.benchmark;if(!groups.includes(group))continue;
    if(group==='contextbench')for(const arm of ['control','treatment']){
      const rows=lines(join(pair,arm,'model-timing.jsonl')),summaryPath=join(pair,arm+'-summary.json'),summary=existsSync(summaryPath)?read(summaryPath):null;
      coverage.push({job_id:job.id,arm,recorded_intervals:rows.length,expected_dispatched_models:summary?.usage?.model_calls??null,complete:summary!==null&&rows.length===summary.usage?.model_calls});
      for(const row of rows)intervals.push({group,job_id:job.id,arm,start_ms:row.start_ms,end_ms:row.end_ms,status:row.status,request_sha256:row.request_sha256});
    }else if(existsSync(pair)){
      let modelStarts=0,modelReceipts=0;
      for(const name of readdirSync(pair)){
        if(!name.endsWith('-receipt.json')&&!name.endsWith('-started.json'))continue;
        const r=read(join(pair,name));if(r.kind!=='model')continue;
        if(name.endsWith('-started.json')){modelStarts++;continue;}
        modelReceipts++;intervals.push({group,job_id:job.id,start_ms:Date.parse(r.started_at),end_ms:Date.parse(r.finished_at),status:r.status??null,request_sha256:r.request_sha256});
      }
      coverage.push({job_id:job.id,recorded_intervals:modelReceipts,expected_dispatched_models:modelStarts,complete:modelStarts===modelReceipts});
    }else coverage.push({job_id:job.id,recorded_intervals:0,expected_dispatched_models:null,complete:false});
  }
  const valid=intervals.filter(x=>{const ok=Number.isFinite(x.start_ms)&&Number.isFinite(x.end_ms)&&x.end_ms>=x.start_ms;if(!ok)issues.push({job_id:x.job_id,reason:'invalid absolute interval'});return ok;});
  const poolEvents=lines(join(directory,'pool-events.jsonl')),poolPeaks={contextbench:0,longmemeval:0};let poolGlobal=0;
  for(const e of poolEvents){for(const g of groups)poolPeaks[g]=Math.max(poolPeaks[g],e.active?.[g]??0);poolGlobal=Math.max(poolGlobal,groups.reduce((s,g)=>s+(e.active?.[g]??0),0));}
  const schedulerIntervals=manifest.jobs.flatMap(j=>{const r=jobs[j.id];const start=Date.parse(r?.started_at),end=Date.parse(r?.finished_at);return Number.isFinite(start)&&Number.isFinite(end)?[{group:j.benchmark,start_ms:start,end_ms:end}]:[];});
  const observed=intervalPeaks(valid),configuredGlobal=manifest.global_workers??checkpoint.concurrency;
  const metadataComplete=coverage.every(x=>x.complete)&&issues.length===0;
  return {stage_directory:directory,role:supplementary?'supplementary-first-model-exposure':'planned-capacity-stage',terminal,configured_limits:{by_benchmark:configured,global:configuredGlobal},observed_model_request_peaks:observed,
    configured_model_ceilings_respected:observed.global<=configuredGlobal&&groups.every(g=>observed.by_benchmark[g]<=(configured[g]??0)),
    reached_configured_model_overlap:metadataComplete&&observed.global===configuredGlobal&&groups.every(g=>observed.by_benchmark[g]===(configured[g]??0)),
    latency_scope:'Local API lifecycle including credential resolution and transport. Not backend execution duration or number of server instances.',
    model_requests:{global:timingSummary(valid),by_benchmark:Object.fromEntries(groups.map(g=>[g,timingSummary(valid.filter(x=>x.group===g))]))},
    active_pool_worker_peaks:poolEvents.length?{global:poolGlobal,by_benchmark:poolPeaks}:null,scheduler_reserved_slot_peaks:intervalPeaks(schedulerIntervals),
    elapsed_pair_schedule_ms:schedulerIntervals.length?Math.max(...schedulerIntervals.map(x=>x.end_ms))-Math.min(...schedulerIntervals.map(x=>x.start_ms)):null,
    pair_durations_ms:manifest.jobs.map(j=>{const r=jobs[j.id],a=Date.parse(r?.started_at),b=Date.parse(r?.finished_at);return {id:j.id,benchmark:j.benchmark,status:r?.status,duration_ms:Number.isFinite(a)&&Number.isFinite(b)?b-a:null};}),
    timing_coverage:{complete:metadataComplete,rows:coverage,issues},
    capacity_gate:terminal&&metadataComplete&&valid.every(x=>![429,503].includes(x.status))&&observed.global===configuredGlobal&&groups.every(g=>observed.by_benchmark[g]===(configured[g]??0)),
    capacity_gate_scope:'Observed local model overlap, complete timing coverage, terminal execution, and no HTTP429/503; quality, accounting, other transport errors and scientific acceptance require separate gates.',
    caveats:[...(supplementary?['Supplement is a separate repaired first exposure; never merge it into a throughput speedup comparison.']:[]),'Stage1 group-gate waiters consume global scheduler slots and may underutilize available request capacity.','Stage1 AB versus stage2 BA, differing trajectories, infrastructure failure and unequal task durations prevent a causal throughput ratio.','Configured worker counts are ceilings; eight simultaneous API requests must be observed in timestamps, not inferred.'],authority_effect:'none',open_questions_ref:'README.md'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const args=process.argv.slice(2),inspect=args.includes('--inspect'),directories=args.filter(x=>x!=='--inspect');if(!directories.length)throw Error('STAGE1 STAGE2 [SUPPLEMENT] [--inspect] required');
  const stages=directories.map(d=>analyzeCapacityStage(resolve(d),{requireTerminal:!inspect}));console.log(JSON.stringify({schema_version:'dual8k.capacity-analysis/v1',status:inspect?'inspection-not-final':'terminal-stage-report',stages,throughput_speedup_claim:null,authority_effect:'none',open_questions_ref:'README.md'},null,2));
}
