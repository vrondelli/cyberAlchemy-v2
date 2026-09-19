// Evaluator-only join. No provider calls. Open questions: RECOVERY-SCORING.md.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,realpathSync,lstatSync} from 'node:fs';
import {resolve,join,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {hydrateReferencedSeal} from './referenced-generation-seal.mjs';
import {campaignContract} from './recovery-campaign.mjs';
import {verifyTrajectoryRequests} from './verify-trajectory-requests.mjs';
import {buildCell} from './discovery-v1/run-recovery-pair.mjs';
import {exportTerminalEvidenceSelection} from './terminal-evidence.mjs';
import {scoreNativeBounded,safeScorerFailure} from './packet-diversity-v1/scorer-bridge-bounded-v4.mjs';
import {createStageOutputGuard,MAXIMUM_STAGE_BYTES} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const hash=x=>createHash('sha256').update(x).digest('hex'),read=p=>JSON.parse(readFileSync(p));
const need=(x,m)=>{if(!x)throw Error('recovery-score.'+m);};
const within=(a,b)=>{const r=relative(a,b);return r===''||(!r.startsWith('..'+sep)&&r!=='..'&&!r.startsWith(sep));};
function canonical(path){const full=resolve(path);need(realpathSync(full)===full,'canonical-path');let current=sep;for(const bit of full.split(sep).filter(Boolean)){current=join(current,bit);need(!lstatSync(current).isSymbolicLink(),'symlink-path');}return full;}
export function recoveryMetrics(score){const s=score?.native?.final,sc=s?.span?.coverage,sp=s?.span?.precision,fc=s?.file?.coverage,fp=s?.file?.precision;need([sc,sp,fc,fp].every(n=>Number.isFinite(n)&&n>=0&&n<=1),'native-metrics');return {span_coverage:sc,span_precision:sp,span_f1:sc+sp?2*sc*sp/(sc+sp):0,file_coverage:fc,file_precision:fp,file_f1:fc+fp?2*fc*fp/(fc+fp):0};}
export function summarizeRecoveryScores({task_ids,outcomes,known_tokens,unknown_usage_calls}){
 assert.deepEqual(outcomes.map(r=>r.task_id+':'+r.arm),task_ids.flatMap(id=>['control','treatment'].map(a=>id+':'+a)),'fixed score denominator');
 const totals=Object.fromEntries(['control','treatment'].map(arm=>{const rows=outcomes.filter(r=>r.arm===arm);return [arm,{assigned:rows.length,valid:rows.filter(r=>r.valid).length,perfect:rows.filter(r=>r.valid&&r.metrics?.span_f1===1&&r.metrics?.file_f1===1).length,total_tokens:rows.reduce((n,r)=>n+r.usage.total_tokens,0),mean_span_f1:rows.reduce((n,r)=>n+(r.metrics?.span_f1??0),0)/rows.length,mean_file_f1:rows.reduce((n,r)=>n+(r.metrics?.file_f1??0),0)/rows.length}];}));
 const reduction=totals.control.total_tokens>0?1-totals.treatment.total_tokens/totals.control.total_tokens:null;
 const gates={fixed_four_task_cohort:task_ids.length===4,all_eight_valid:outcomes.length===8&&outcomes.every(r=>r.valid),treatment_each_task_perfect:task_ids.length===4&&totals.treatment.perfect===4,at_least_15_percent_reduction:reduction!==null&&reduction>=0.15,all_requests_verified:outcomes.every(r=>r.request_verification?.verified===true),all_long_trajectories:outcomes.every(r=>r.usage.model_calls>1&&r.usage.total_tokens>8000),complete_accounting:unknown_usage_calls===0&&outcomes.reduce((n,r)=>n+r.usage.total_tokens,0)===known_tokens};
 return {totals,relative_token_reduction:reduction,gates,development_target_passed:Object.values(gates).every(Boolean),campaign_goal_achieved:false,known_tokens,unknown_usage_calls,claim_ceiling:'Fixed exposed development cohort; broader untouched confirmation remains required.',authority_effect:'none'};
}
export async function scoreRecoveryCampaign({config,generation_root,source_root,directory,terminal,binding,native_score=scoreNativeBounded,host_guard=guardStorage}){
 const root=canonical(generation_root),sources=canonical(source_root),out=canonical(directory);
 need(!within(root,out)&&!within(out,root)&&!within(sources,out)&&!within(out,sources),'separate-score-root');need(readdirSync(out).length===0,'fresh-evaluation');
 need(terminal?.status==='sealed'&&terminal.workers_settled===true&&terminal.outcomes?.length===config.tasks.length,'settled-generation');
 const seal=read(join(root,'GENERATION-SEAL.json'));assert.deepEqual(terminal.seal,seal,'returned and persisted global seal');
 assert.deepEqual(terminal.outcomes.map(r=>r.task_id),config.tasks.map(t=>t.id),'terminal fixed tasks');need(terminal.outcomes.every(r=>r.status==='settled'),'terminal fixed settlement');
 const pairs=hydrateReferencedSeal({root,seal,expected_slots:terminal.outcomes.map(r=>r.reference),...campaignContract({config,root})});
 const guard=createStageOutputGuard({root:out}),persistence=createStagePersistence({stage_root:out,stage_guard:guard});
 const check=()=>{const r=host_guard({binding,output:out,growth_reservation_bytes:Math.max(0,MAXIMUM_STAGE_BYTES-guard.snapshot().bytes)});need(r?.admitted===true,'storage');};check();
 const rows=[],prepared=[],integrityChecks=[];const configDigest=hash(stable(config)),task_ids=config.tasks.map(t=>t.id);
 // Entire generation and request evidence is checked before any reference/evaluator access.
 for(const [i,{result:pair}]of pairs.entries())for(const arm of ['control','treatment']){
  const task=config.tasks[i],a=pair.arms[arm],row={task_id:task.id,arm,valid:false,status:a.status,usage:a.usage,metrics:null,request_verification:null};rows.push(row);
  if(!a.complete)continue;
  try{
   const cell=buildCell({config,task_id:task.id,arm,repetition:1});assert.deepEqual(a.cell,cell,'frozen arm configuration');
   const raw=readFileSync(a.result_path);need(hash(raw)===a.result_sha256,'result-drift');const r=JSON.parse(raw);
   const verification=verifyTrajectoryRequests({result:r,cell});need(verification.total_tokens===a.usage.total_tokens&&verification.model_calls<=cell.limits.maximum_calls&&verification.total_tokens<=cell.limits.total_tokens,'request-accounting');row.request_verification=verification;
   const taskRaw=readFileSync(task.task_path);need(hash(taskRaw)===task.task_sha256,'task-drift');const publicTask=JSON.parse(taskRaw);
   const expectedSource=join(sources,task.id+'-r1-'+arm);need(canonical(r.source_root)===expectedSource,'source-assignment');
   const run=canonical(a.run_directory);need(within(root,run)&&run!==root,'run-path');
   const snapshots=canonical(join(run,'snapshots'));const source_snapshots=readdirSync(snapshots).filter(n=>n.endsWith('.json')).map(n=>read(canonical(join(snapshots,n))));
   const response_capture=r.response_captures.at(-1),packet=r.terminal_evidence_presentations.find(p=>p.request_sha256===response_capture?.request_sha256)?.packet;need(packet,'terminal-packet');
   const exported=exportTerminalEvidenceSelection({...r,packet,task:publicTask,source_snapshots,response_capture},canonical(join(expectedSource,'base')));
   assert.deepEqual(exported.prediction,r.native_export.prediction,'native prediction reconstruction');assert.deepEqual(exported.selection,r.selection,'native selection reconstruction');
   const snapshotBindings=readdirSync(snapshots).filter(n=>n.endsWith('.json')).map(n=>({path:canonical(join(snapshots,n)),sha256:hash(readFileSync(join(snapshots,n)))}));
   integrityChecks.push(()=>{need(hash(readFileSync(task.task_path))===task.task_sha256,'post-score-task-drift');for(const file of snapshotBindings)need(canonical(file.path)===file.path&&hash(readFileSync(file.path))===file.sha256,'post-score-snapshot-drift');need(canonical(r.source_root)===expectedSource,'post-score-source-alias');const rebuilt=exportTerminalEvidenceSelection({...r,packet,task:publicTask,source_snapshots,response_capture},canonical(join(expectedSource,'base')));assert.deepEqual(rebuilt.prediction,exported.prediction,'post-score source reconstruction');assert.deepEqual(rebuilt.selection,exported.selection,'post-score selection reconstruction');});
   prepared.push({row,prediction:exported.prediction});row.status='ready-to-score';
  }catch(error){row.status='preflight-failed';row.preflight_error=String(error.message);}
 }
 let stopped=rows.some(r=>r.status==='preflight-failed');
 for(const item of prepared){
  if(stopped){item.row.status='not-scored-after-preflight-or-evaluator-failure';continue;}
  try{check();const native=await native_score({config,prediction:item.prediction,directory:join(out,item.row.task_id+'-'+item.row.arm),stage_root:out,stage_guard:guard,persistence});item.row.metrics=recoveryMetrics(native);item.row.valid=true;item.row.status='scored';}
  catch(error){stopped=true;item.row.status='native-evaluation-failed';item.row.failure=safeScorerFailure('score',error);}
 }
 let post_score_integrity_verified=true;
 try{need(hash(stable(config))===configDigest,'post-score-config-drift');assert.deepEqual(read(join(root,'GENERATION-SEAL.json')),seal,'post-score global seal');hydrateReferencedSeal({root,seal,expected_slots:terminal.outcomes.map(r=>r.reference),...campaignContract({config,root})});for(const checkIntegrity of integrityChecks)checkIntegrity();}
 catch{post_score_integrity_verified=false;for(const row of rows){row.valid=false;row.status='post-score-integrity-failed';row.unverified_metrics=row.metrics;row.metrics=null;}}
 const report={schema:'are.recovery-campaign-score/v1',post_score_integrity_verified,generation_seal_digest:seal.seal_digest,outcomes:rows,...summarizeRecoveryScores({task_ids,outcomes:rows,known_tokens:seal.summary.usage.total_tokens,unknown_usage_calls:seal.summary.unknown_usage_calls}),new_provider_calls:0,open_questions_ref:'RECOVERY-SCORING.md'};
 persistence.writeJson(join(out,'RESULTS.json'),report,{final:true});return report;
}
