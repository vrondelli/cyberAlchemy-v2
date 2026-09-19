// DRAFT: not reviewed or executable-authorized; interrupted run must not be scored.
// Evaluator-only: no provider construction or gold access on import. Open questions: LIVE-PROTOCOL.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {hash} from './prepare.mjs';
import {verifyLiveFreeze} from './live.mjs';
import {storageGuard} from './preflight.mjs';
import {exportTerminalEvidenceSelection} from './terminal-evidence.mjs';
import {accountReceipts} from '../discovery-v1/run.mjs';
const read=p=>JSON.parse(readFileSync(p)),save=(p,x)=>writeFileSync(p,JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
const need=(x,m)=>assert.ok(x,'packet-score.'+m);
export const zero=()=>({span_coverage:0,span_precision:0,span_f1:0,file_coverage:0,file_precision:0,file_f1:0});
export function nativeMetrics(native){const f=native?.native?.final,c=f?.span?.coverage,p=f?.span?.precision,fc=f?.file?.coverage,fp=f?.file?.precision;need([c,p,fc,fp].every(n=>Number.isFinite(n)&&n>=0&&n<=1),'native-metrics');return {span_coverage:c,span_precision:p,span_f1:c+p?2*c*p/(c+p):0,file_coverage:fc,file_precision:fp,file_f1:fc+fp?2*fc*fp/(fc+fp):0};}
export function validateSeal(seal,verified){need(seal?.schema==='are.packet-component-generation-seal/v1'&&seal.terminal===true&&seal.planned_slots===16&&seal.slots?.length===16&&seal.freeze_sha256===verified.freeze_sha256,'global-generation-seal');need(seal.completed_at&&seal.maximum_new_model_tokens===128000,'terminal-budget');for(const [i,slot]of seal.slots.entries()){need(slot.donor_id===verified.jobs[Math.floor(i/2)].donor.donor_id&&slot.variant===(i%2?'diversity':'legacy'),'fixed-slot');need(typeof slot.status==='string'&&!['running','pending','started'].includes(slot.status),'terminal-slot');}return seal;}
export function offeredPrediction(donor,packet){const spans={},files=new Set();for(const b of packet.private.bindings){files.add(b.path);(spans[b.path]??=[]).push(...b.base_spans);}return {instance_id:donor.task.instance_id,repo_url:donor.task.repo_url,commit:donor.task.base_commit,traj_data:{pred_steps:[{files:[...files].sort(),spans}],pred_files:[...files].sort(),pred_spans:spans}};}
async function nativeScore(config,prediction,directory){
 storageGuard(directory);mkdirSync(directory,{recursive:true,mode:0o700});const pred=join(directory,'prediction.json'),out=join(directory,'native-score.json');save(pred,prediction);
 await new Promise((yes,no)=>{const proc=spawn(config.python,[config.scorer,'--upstream',config.upstream,'--manifest',config.source_manifest,'--gold',join(config.upstream,'data/full.parquet'),'--pred',pred,'--cache',config.scoring_cache,'--out',out],{env:{...process.env,GIT_ALLOW_PROTOCOL:'file',GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0',CONTEXTBENCH_TMP_ROOT:join(directory,'native-worktrees')}});proc.stdout.resume();proc.stderr.resume();const timer=setTimeout(()=>proc.kill('SIGKILL'),180000);proc.on('error',e=>{clearTimeout(timer);no(e);});proc.on('close',code=>{clearTimeout(timer);code===0?yes():no(Error('native-evaluator-failed'));});});return nativeMetrics(read(out));
}
export function summarize(outcomes,seal){
 need(outcomes.length===16,'fixed-outcome-denominator');const totals={};for(const variant of ['legacy','diversity']){const rows=outcomes.filter(x=>x.variant===variant);need(rows.length===8,'fixed-variant-denominator');totals[variant]={valid:rows.filter(x=>x.valid).length,mean_span_f1:rows.reduce((n,x)=>n+x.metrics.span_f1,0)/8,mean_file_f1:rows.reduce((n,x)=>n+x.metrics.file_f1,0)/8,new_tokens:rows.reduce((n,x)=>n+x.new_usage.total_tokens,0),logical_tokens:rows.reduce((n,x)=>n+x.new_usage.total_tokens+x.prefix_tokens,0)};}
 const pairs=Array.from({length:8},(_,i)=>({donor_id:outcomes[i*2].donor_id,legacy_offered:outcomes[i*2].offered_coverage,diversity_offered:outcomes[i*2+1].offered_coverage}));
 const incomplete=Boolean(seal.wrapper_error||seal.health_errors?.length||!seal.source_integrity_verified||outcomes.some(x=>x.infrastructure_gap||x.unknown_usage));
 const criteria={all_16_valid_accounted:outcomes.every(x=>x.valid&&!x.unknown_usage),offered_coverage_no_regression:pairs.every(p=>p.legacy_offered!==null&&p.diversity_offered!==null&&p.diversity_offered>=p.legacy_offered),offered_coverage_strict_improvement:pairs.some(p=>p.legacy_offered!==null&&p.diversity_offered!==null&&p.diversity_offered>p.legacy_offered),macro_span_f1_nondecreasing:totals.diversity.mean_span_f1>=totals.legacy.mean_span_f1,macro_file_f1_nondecreasing:totals.diversity.mean_file_f1>=totals.legacy.mean_file_f1};
 return {classification:incomplete?'inconclusive':Object.values(criteria).every(Boolean)?'supporting':'counterevidence',criteria,totals,pairs,physical_new_tokens:totals.legacy.new_tokens+totals.diversity.new_tokens,physical_historical_prefix_tokens:outcomes.filter(x=>x.variant==='legacy').reduce((n,x)=>n+x.prefix_tokens,0),campaign_goal_achieved:false,claim_ceiling:'Archived terminal component only; not fresh full trajectories or full-benchmark/15% clearance.'};
}
export async function scoreSealed(freezePath,liveDirectory){
 const directory=resolve(liveDirectory),sealPath=join(directory,'GENERATION-SEAL.json');
 need(existsSync(sealPath),'actual-generation-seal-required');const verified=verifyLiveFreeze(freezePath);
 need(!existsSync(join(directory,'active.lock')),'generation-active');const seal=validateSeal(read(sealPath),verified),sealHash=hash(readFileSync(sealPath));
 const output=join(directory,'evaluation');need(!existsSync(output),'single-use-evaluation');mkdirSync(output,{mode:0o700});const outcomes=[];
 for(const [index,slot]of seal.slots.entries()){
  const job=verified.jobs[Math.floor(index/2)],variant=slot.variant,packet=job.prepared.pair[variant],cell=join(output,job.donor.donor_id,variant);
  const row={donor_id:job.donor.donor_id,variant,status:slot.status,valid:false,metrics:zero(),offered_coverage:null,prefix_tokens:job.donor.prefix_usage.total_tokens,new_usage:slot.usage,unknown_usage:Boolean(slot.unknown_usage),infrastructure_gap:Boolean(slot.persistence_failure||slot.lifecycle_failure||slot.provider_error_code||slot.status.includes('not-started')||slot.status==='infrastructure-failure')};
  try{
   need(slot.usage&&['prompt_tokens','completion_tokens','total_tokens'].every(k=>Number.isSafeInteger(slot.usage[k])&&slot.usage[k]>=0)&&slot.usage.total_tokens===slot.usage.prompt_tokens+slot.usage.completion_tokens,'usage-shape');
   if(slot.receipts){need(hash(slot.receipts.slice(0,slot.suffix_receipt_start))===job.donor.prefix_receipts_sha256,'prefix-receipt-binding');const actual=accountReceipts(slot.receipts.slice(slot.suffix_receipt_start));for(const key of ['prompt_tokens','completion_tokens','total_tokens','model_calls'])need(actual[key]===slot.usage[key],'new-usage-reconciliation');need(!actual.unknown_usage||row.unknown_usage,'unknown-reconciliation');}
   else need(slot.usage.total_tokens===0,'missing-spend-receipts');
   const offered=await nativeScore(verified.config,offeredPrediction(job.donor,packet),join(cell,'offered'));row.offered_coverage=offered.span_coverage;
   if(slot.status==='completed'&&!row.unknown_usage&&!row.infrastructure_gap){
    need(hash(slot.packet)===hash(packet),'packet-binding');
    const rebuilt=exportTerminalEvidenceSelection({packet,captures:slot.captures,receipts:slot.receipts,response_capture:slot.response_capture,source_snapshots:job.donor.snapshots,task:job.donor.task},job.repoRoot);
    need(hash(rebuilt.prediction)===hash(slot.native_export?.prediction)&&hash(rebuilt.selection)===hash(slot.native_export?.selection),'native-export-reconstruction');
    row.metrics=await nativeScore(verified.config,rebuilt.prediction,join(cell,'selected'));row.valid=true;
   }
  }catch{row.infrastructure_gap=true;row.scoring_error='accounting-reconstruction-or-native-evaluator-failure';row.metrics=zero();row.valid=false;}
  outcomes.push(row);
 }
 need(hash(readFileSync(sealPath))===sealHash,'seal-drift');verifyLiveFreeze(freezePath);
 const summary=summarize(outcomes,seal);need(summary.physical_new_tokens===seal.usage.total_tokens,'global-new-cost-reconciliation');
 const result={schema:'are.packet-component-results/v1',generation_seal_sha256:sealHash,freeze_sha256:verified.freeze_sha256,planned_donors:8,planned_slots:16,outcomes,...summary,model_calls:0,provider_tokenizer_calls:0,gold_posture:'Evaluator-only aggregate coverage; no gold paths or hints in this report.',source_bindings:[{path:sealPath,sha256:sealHash},{path:new URL(import.meta.url).pathname,sha256:hash(readFileSync(new URL(import.meta.url)))}],open_questions_ref:'../LIVE-PROTOCOL.md'};save(join(directory,'RESULTS.json'),result);return result;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const r=await scoreSealed(process.argv[2],process.argv[3]);console.log(JSON.stringify({classification:r.classification,totals:r.totals}));}
