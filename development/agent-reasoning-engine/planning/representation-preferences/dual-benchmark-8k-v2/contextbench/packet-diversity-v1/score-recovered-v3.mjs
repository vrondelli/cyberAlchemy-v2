// Additive successor evaluator; no effects or reference access on import.
// Original draft is preserved. Open questions and scope: LIVE-PROTOCOL-BOUNDED-V3.md.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createStageOutputGuard} from './stage-output-guard.mjs';
import {createStagePersistence} from './stage-persistence.mjs';
import {scoreNativeBounded,safeScorerFailure} from './scorer-bridge-bounded-v3.mjs';
import {hasAccountedModelAttempt} from './run-bounded-v3.mjs';
import {hash} from './prepare.mjs';
import {verifyPreparationBindings} from './preflight.mjs';
import {hydrateRecoveredSeal} from './recover-generation-bounded-v3.mjs';
import {storageGuard} from './preflight-bounded-v3.mjs';
import {exportTerminalEvidenceSelection} from './terminal-evidence.mjs';
import {accountReceipts} from '../discovery-v1/run.mjs';
const root=resolve(import.meta.dirname,'../../../../../../..');
const read=p=>JSON.parse(readFileSync(p));
const need=(x,m)=>assert.ok(x,'packet-score-recovered-v3.'+m);
const keys=['prompt_tokens','completion_tokens','total_tokens','model_calls','unknown_usage_calls','conservative_total_tokens'];
const uint=n=>Number.isSafeInteger(n)&&n>=0;
export const zero=()=>({span_coverage:0,span_precision:0,span_f1:0,file_coverage:0,file_precision:0,file_f1:0});
export function nativeMetrics(native){const f=native?.native?.final,c=f?.span?.coverage,p=f?.span?.precision,fc=f?.file?.coverage,fp=f?.file?.precision;need([c,p,fc,fp].every(n=>Number.isFinite(n)&&n>=0&&n<=1),'native-metrics');return {span_coverage:c,span_precision:p,span_f1:c+p?2*c*p/(c+p):0,file_coverage:fc,file_precision:fp,file_f1:fc+fp?2*fc*fp/(fc+fp):0};}
function checkUsage(usage){need(usage&&keys.every(k=>uint(usage[k]))&&typeof usage.unknown_usage==='boolean','usage-shape');need(usage.total_tokens===usage.prompt_tokens+usage.completion_tokens&&usage.conservative_total_tokens===usage.total_tokens+8000*usage.unknown_usage_calls&&usage.unknown_usage===(usage.unknown_usage_calls>0),'usage-identity');return usage;}
function infrastructure(slot){return Boolean(slot.infrastructure_failure||slot.persistence_failure||slot.lifecycle_failure||slot.provider_error_code||slot.unknown_usage||slot.status.includes('not-started')||slot.status==='infrastructure-failure');}
export function reconcileSlot(slot,donor){
 checkUsage(slot.usage);need(slot.unknown_usage===slot.usage.unknown_usage,'slot-unknown-identity');
 let actual=accountReceipts([]),suffix=[];
 if(slot.receipts){need(Array.isArray(slot.receipts)&&slot.suffix_receipt_start===donor.receipts.length,'prefix-index-binding');if(slot.receipts.length<donor.receipts.length)need(slot.entered!==true&&infrastructure(slot)&&hash(slot.receipts)===hash(donor.receipts.slice(0,slot.receipts.length)),'unimported-prefix');else need(hash(slot.receipts.slice(0,slot.suffix_receipt_start))===donor.prefix_receipts_sha256,'prefix-receipt-binding');suffix=slot.receipts.slice(slot.suffix_receipt_start);actual=accountReceipts(suffix);}
 const model=suffix.filter(r=>r.kind==='model'&&r.dispatched!==false);need(model.length<=1,'one-model-per-slot');
 if(slot.entered===true&&!hasAccountedModelAttempt(suffix))actual={...actual,unknown_usage:true,unknown_usage_calls:1,conservative_total_tokens:8000};
 for(const k of [...keys,'unknown_usage'])need(slot.usage[k]===actual[k],'slot-usage-reconciliation:'+k);
 if(actual.rate_limited)need(infrastructure(slot),'capacity-classification');
 for(const r of model)if(r.dispatched===true&&uint(r.input_tokens)&&uint(r.output_tokens)){
  need(r.input_tokens+2048<=8000&&r.output_tokens<=2048,'actual-window');
  for(const [detail,parent]of [[r.reasoning_tokens,r.output_tokens],[r.cached_tokens,r.input_tokens]])need(detail===undefined||(uint(detail)&&detail<=parent),'usage-detail');
 }
 if(model.length||slot.entered){need(slot.admission?.output_reservation===2048&&uint(slot.admission.projected_upper_bound)&&slot.admission.projected_upper_bound<=8000,'actual-admission');}
 if(slot.status==='completed')need(model.length===1&&!actual.unknown_usage&&slot.response_capture&&slot.native_export,'completed-receipt-evidence');
 return actual;
}
export function validateSeal(seal,verified){
 need(seal?.schema==='are.packet-component-generation-seal/bounded-v3'&&seal.terminal===true&&seal.transport_settled===true&&seal.planned_slots===16&&seal.slots?.length===16&&seal.freeze_sha256===verified.freeze_sha256,'global-generation-seal');
 need(typeof seal.completed_at==='string'&&Number.isFinite(Date.parse(seal.completed_at))&&seal.maximum_new_model_tokens===128000&&seal.maximum_pair_concurrency===2,'terminal-budget');
 need(['completed','completed-with-failures','failed','interrupted'].includes(seal.status),'terminal-status');need(verified.jobs?.length===8,'fixed-jobs');
 const sum=Object.fromEntries(keys.map(k=>[k,0]));
 for(const [i,slot]of seal.slots.entries()){
  const donor=verified.jobs[Math.floor(i/2)].donor;
  need(slot.donor_id===donor.donor_id&&slot.variant===(i%2?'diversity':'legacy'),'fixed-slot');
  need(['completed','no_context_selected','invalid_terminal_selection','failed','infrastructure-failure','not-started-shared-health-stop','not-started-wrapper-failure','not-started-interruption'].includes(slot.status),'terminal-slot');
  reconcileSlot(slot,donor);for(const k of keys)sum[k]+=slot.usage[k];
  const prefix=accountReceipts(donor.receipts);need(!prefix.unknown_usage&&!prefix.rate_limited,'known-prefix');for(const k of keys)need(donor.prefix_usage[k]===prefix[k],'prefix-cost-reconciliation');
 }
 checkUsage(seal.usage);for(const k of keys)need(uint(sum[k])&&sum[k]===seal.usage[k],'global-usage-reconciliation:'+k);
 need(seal.usage.unknown_usage===seal.slots.some(s=>s.unknown_usage)&&seal.usage.conservative_total_tokens<=128000,'global-reservation');
 const historical=verified.jobs.reduce((n,j)=>n+j.donor.prefix_usage.total_tokens,0);need(seal.historical_prefix_tokens===historical,'historical-prefix-reconciliation');
 for(const v of ['legacy','diversity'])need(seal.logical_totals?.[v]===historical+seal.slots.filter(s=>s.variant===v).reduce((n,s)=>n+s.usage.total_tokens,0),'logical-cost-reconciliation');
 return seal;
}
export function offeredPrediction(donor,packet){const spans={},files=new Set();for(const b of packet.private.bindings){files.add(b.path);(spans[b.path]??=[]).push(...b.base_spans.map(s=>({start:s.start_line,end:s.end_line})));}return {instance_id:donor.task.instance_id,repo_url:donor.task.repo_url,commit:donor.task.base_commit,traj_data:{pred_steps:[{files:[...files].sort(),spans}],pred_files:[...files].sort(),pred_spans:spans}};}
async function nativeScore(config,prediction,directory,budget){
 return nativeMetrics(await scoreNativeBounded({config,prediction,directory,...budget}));
}
function validMetrics(metrics){need(metrics&&Object.keys(zero()).every(k=>Number.isFinite(metrics[k])&&metrics[k]>=0&&metrics[k]<=1),'metric-range');for(const prefix of ['span','file']){const c=metrics[prefix+'_coverage'],p=metrics[prefix+'_precision'];need(Math.abs(metrics[prefix+'_f1']-(c+p?2*c*p/(c+p):0))<1e-12,'metric-f1');}return metrics;}
export function summarize(outcomes,seal,{evaluation_failure=null,source_integrity_verified=true}={}){
 need(outcomes.length===16,'fixed-outcome-denominator');const totals={};for(const variant of ['legacy','diversity']){
  const rows=outcomes.filter(x=>x.variant===variant);need(rows.length===8,'fixed-variant-denominator');
  totals[variant]={valid:rows.filter(x=>x.valid).length,mean_span_f1:rows.reduce((n,x)=>n+x.metrics.span_f1,0)/8,mean_file_f1:rows.reduce((n,x)=>n+x.metrics.file_f1,0)/8,new_tokens:rows.reduce((n,x)=>n+x.new_usage.total_tokens,0),logical_tokens:rows.reduce((n,x)=>n+x.new_usage.total_tokens+x.prefix_tokens,0)};
 }
 const pairs=Array.from({length:8},(_,i)=>({donor_id:outcomes[i*2].donor_id,legacy_offered:outcomes[i*2].offered_coverage,diversity_offered:outcomes[i*2+1].offered_coverage}));
 const incomplete=Boolean(evaluation_failure||!source_integrity_verified||['failed','interrupted'].includes(seal.status)||seal.wrapper_error||seal.interruptions?.length||seal.health_errors?.length||!seal.source_integrity_verified||!seal.transport_settled||outcomes.some(x=>x.infrastructure_gap||x.unknown_usage));
 const criteria={all_16_valid_accounted:!incomplete&&outcomes.every(x=>x.valid&&!x.unknown_usage),offered_coverage_no_regression:pairs.every(p=>p.legacy_offered!==null&&p.diversity_offered!==null&&p.diversity_offered>=p.legacy_offered),offered_coverage_strict_improvement:pairs.some(p=>p.legacy_offered!==null&&p.diversity_offered!==null&&p.diversity_offered>p.legacy_offered),macro_span_f1_nondecreasing:totals.diversity.mean_span_f1>=totals.legacy.mean_span_f1,macro_file_f1_nondecreasing:totals.diversity.mean_file_f1>=totals.legacy.mean_file_f1};
 return {classification:incomplete?'inconclusive':Object.values(criteria).every(Boolean)?'supporting':'counterevidence',criteria,totals,pairs,physical_new_tokens:seal.usage.total_tokens,physical_new_conservative_tokens:seal.usage.conservative_total_tokens,physical_historical_prefix_tokens:outcomes.filter(x=>x.variant==='legacy').reduce((n,x)=>n+x.prefix_tokens,0),campaign_goal_achieved:false,claim_ceiling:'Archived terminal component only; not fresh full trajectories or full-benchmark/15% clearance.'};
}
const verifyDefault=async path=>(await import('./live-bounded-v3.mjs')).verifyLiveFreezeBoundedV3(path);
/** Injectable boundaries exist for synthetic tests; CLI always uses native defaults.
 * No evaluator call occurs until every fixed slot and all raw spend reconcile. */
export async function scoreRecovered(freezePath,liveDirectory,reviewPath,{verify=verifyDefault,hydrate=hydrateRecoveredSeal,score=nativeScore,reconstruct=exportTerminalEvidenceSelection,checkStorage=storageGuard,persist,make_stage_guard=createStageOutputGuard,make_persistence=createStagePersistence}={}){
 const directory=resolve(liveDirectory),sealPath=join(directory,'RECOVERED-GENERATION.json');
 need(existsSync(sealPath),'actual-generation-seal-required');need(!existsSync(join(directory,'active.lock')),'generation-active');
 const verified=await verify(freezePath);const analysisReview=read(resolve(reviewPath));need(analysisReview.approved===true&&analysisReview.scope==='packet-component-recovered-scoring-v3','recovered-scorer-review');verifyPreparationBindings(analysisReview.source_bindings);need(analysisReview.source_bindings.some(b=>resolve(root,b.path)===new URL(import.meta.url).pathname&&b.sha256===hash(readFileSync(new URL(import.meta.url)))),'scorer-review-binding');
 for(const key of ['scorer','source_manifest']){const path=verified.config?.[key];need(typeof path==='string'&&verified.freeze.bindings.some(b=>resolve(root,b.path)===resolve(root,path)&&b.sha256===hash(readFileSync(resolve(root,path)))),'evaluator-freeze-binding:'+key);}
 const hydrated=hydrate(sealPath,verified),seal=validateSeal(hydrated.seal,verified),sealHash=hash(readFileSync(sealPath));
 const output=join(dirname(directory),basename(directory)+'-evaluation-recovered-v3');need(!existsSync(output),'single-use-evaluation');checkStorage(output,{growth_reservation_bytes:33554432});mkdirSync(output,{mode:0o700});
 const stage_guard=make_stage_guard({root:output}),persistence=make_persistence({stage_guard,stage_root:output});persist??=persistence.writeJson;const budget={stage_guard,stage_root:output,persistence};
 const outcomes=seal.slots.map((slot,index)=>({donor_id:slot.donor_id,variant:slot.variant,status:slot.status,valid:false,metrics:zero(),offered_coverage:null,prefix_tokens:verified.jobs[Math.floor(index/2)].donor.prefix_usage.total_tokens,new_usage:structuredClone(slot.usage),unknown_usage:slot.unknown_usage,infrastructure_gap:infrastructure(slot),scoring_status:'not-started'}));
 let failure=null,sourceIntegrity=true,scorerCalls=0;
 const generationGap=['failed','interrupted'].includes(seal.status)||seal.wrapper_error||seal.interruptions?.length||seal.health_errors?.length||!seal.source_integrity_verified||outcomes.some(r=>r.infrastructure_gap||r.unknown_usage);
 if(generationGap)failure='generation-infrastructure-or-unknown';
 for(const [index,row]of outcomes.entries()){
  if(failure){row.scoring_status='blocked-infrastructure';continue;}
  const slot=seal.slots[index],job=verified.jobs[Math.floor(index/2)],packet=job.prepared.pair[row.variant],cell=join(output,job.donor.donor_id,row.variant);
  try{
   // Validate completed native selections before exposing either prediction to gold.
   let rebuilt;
   if(slot.status==='completed'){
    need(hash(slot.packet)===hash(packet),'packet-binding');
    rebuilt=reconstruct({packet,captures:slot.captures,receipts:slot.receipts,response_capture:slot.response_capture,source_snapshots:job.donor.snapshots,task:job.donor.task},job.repoRoot);
    need(hash(rebuilt.prediction)===hash(slot.native_export.prediction)&&hash(rebuilt.selection)===hash(slot.native_export.selection),'native-export-reconstruction');
   }
   checkStorage(output);scorerCalls++;const offered=validMetrics(await score(verified.config,offeredPrediction(job.donor,packet),join(cell,'offered'),budget));row.offered_coverage=offered.span_coverage;
   if(rebuilt){checkStorage(output);scorerCalls++;row.metrics=validMetrics(await score(verified.config,rebuilt.prediction,join(cell,'selected'),budget));row.valid=true;}
   row.scoring_status='completed';persist(join(output,'slot-'+String(index).padStart(2,'0')+'.json'),row);
  }catch(error){if(error?.diagnostic)row.scoring_diagnostic=safeScorerFailure(error.diagnostic.phase,error);row.infrastructure_gap=true;row.scoring_status='failed';row.scoring_error='reconstruction-or-evaluator-or-persistence-failure';row.metrics=zero();row.valid=false;failure=row.scoring_error;}
 }
 try{need(hash(readFileSync(sealPath))===sealHash,'seal-drift');hydrate(sealPath,verified);verifyPreparationBindings(analysisReview.source_bindings);const finalVerified=await verify(freezePath);need(finalVerified.freeze_sha256===verified.freeze_sha256,'freeze-drift');}catch{sourceIntegrity=false;failure??='source-or-seal-drift';}
 const summary=summarize(outcomes,seal,{evaluation_failure:failure,source_integrity_verified:sourceIntegrity});
 const report={schema:'are.packet-component-results/recovered-v3',generation_seal_representation:'verified-reference-recovery',recovery:hydrated.recovery,analysis_review_sha256:hash(readFileSync(resolve(reviewPath))),terminal:true,status:failure?'failed':'scored',generation_seal_sha256:sealHash,freeze_sha256:verified.freeze_sha256,planned_donors:8,planned_slots:16,outcomes,...summary,evaluation_failure:failure,source_integrity_verified:sourceIntegrity,native_scorer_calls:scorerCalls,model_calls:0,provider_tokenizer_calls:0,gold_posture:'Evaluator-only aggregate coverage; no gold paths or hints in this report.',source_bindings:[{path:sealPath,sha256:sealHash},{path:new URL(import.meta.url).pathname,sha256:hash(readFileSync(new URL(import.meta.url)))}],open_questions_ref:'../LIVE-PROTOCOL-BOUNDED-V3.md'};
 try{persist(join(output,'RESULTS.json'),report,{final:true});}catch(error){report.status='failed';report.classification='inconclusive';report.evaluation_failure='final-result-persistence-failure';report.persistence_failure=true;report.criteria.all_16_valid_accounted=false;throw Object.assign(error,{report,persistence_failure:true});}return report;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const r=await scoreRecovered(process.argv[2],process.argv[3],process.argv[4]);console.log(JSON.stringify({status:r.status,classification:r.classification,totals:r.totals}));}
