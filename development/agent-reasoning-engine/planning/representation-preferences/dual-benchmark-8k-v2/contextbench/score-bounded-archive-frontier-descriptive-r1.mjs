// Archive candidate diagnostic; original four-task result remains unchanged.
// Separate descriptive diagnostic; never promotes a campaign. Open questions: CANDIDATE-DESCRIPTIVE-SCORING.md.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,realpathSync,lstatSync,openSync,closeSync,fstatSync,readSync,constants} from 'node:fs';
import {resolve,join,relative,sep,isAbsolute} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {reconcileComparisonCampaignEvidence} from './bounded-archive-frontier-evidence-manifest-r1.mjs';
import {verifyComparisonOutcomeSeal} from './bounded-archive-frontier-outcome-store-r1.mjs';
import {reconstructComparisonPrediction} from './bounded-archive-frontier-prediction-r1.mjs';
import {prepareComparisonPrediction} from './score-bounded-archive-frontier-r1.mjs';
import {recoveryMetrics} from './score-recovery-campaign.mjs';
import {scoreNativeBounded,safeScorerFailure} from './packet-diversity-v1/scorer-bridge-bounded-v4.mjs';
import {createStageOutputGuard,MAXIMUM_STAGE_BYTES} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('comparison-native-score.'+m);};
const canonical=p=>{p=resolve(p);need(realpathSync(p)===p,'canonical-path');return p;};
const within=(a,b)=>{const r=relative(a,b);return r===''||(r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r));};
export async function scoreDescriptiveComparison({outcome_root,runs_root,source_root,score_root,schedule,sources,manifest,expected_manifest_sha256,verify_settlement,admit_score,diagnostic_contract,verify_audit}, {native_score=scoreNativeBounded,reconcile=reconcileComparisonCampaignEvidence,hydrate=verifyComparisonOutcomeSeal,prepare=prepareComparisonPrediction}={}){
 need(typeof verify_settlement==='function'&&typeof admit_score==='function'&&typeof verify_audit==='function','admission-callbacks');
 const dc=structuredClone(diagnostic_contract);
 need(dc?.schema==='are.candidate-descriptive-contract/v1'&&Array.isArray(dc.eligible_sequences)&&dc.eligible_sequences.length>0&&
 dc.eligible_sequences.every((x,i,a)=>Number.isSafeInteger(x)&&x>=0&&x<schedule.assigned_outcomes&&(i===0||x>a[i-1])),'diagnostic-contract');
 need(await verify_audit()===true,'audit-not-verified');
 const out=canonical(score_root),roots=[outcome_root,runs_root,source_root].map(canonical);
 need(roots.every(root=>!within(root,out)&&!within(out,root))&&readdirSync(out).length===0,'separate-fresh-score-root');
 need(await verify_settlement({schedule_sha256:schedule.schedule_sha256,manifest_sha256:expected_manifest_sha256})===true,'process-not-settled');
 const args={outcome_root,runs_root,schedule,sources,manifest,expected_manifest_sha256};
 const evidence=reconcile(args),sealed=hydrate({root:outcome_root,schedule,sources,expected_seal_sha256:manifest.outcome_seal_sha256});
 need(sealed.length===schedule.assigned_outcomes&&evidence.rows.length===schedule.assigned_outcomes,'denominator');
 const configBytes=readFileSync(sources.config_path),config=JSON.parse(configBytes),inputDigest=hash(stable({config,schedule,manifest}));
 need(hash(stable(evidence))===dc.reconciliation_sha256&&hash(stable(sealed))===dc.sealed_outcomes_sha256,'audited-evidence-mismatch');
 const guard=createStageOutputGuard({root:out}),persistence=createStagePersistence({stage_root:out,stage_guard:guard});
 const check=async()=>need(await admit_score({output:out,growth_reservation_bytes:Math.max(0,MAXIMUM_STAGE_BYTES-guard.snapshot().bytes)})===true,'score-admission');
 const rows=schedule.slots.map(s=>({slot_id:s.slot_id,task_id:s.task_id,arm:s.arm,status:'not-scored',valid:false,native:null})),prepared=[];

 let stopped=false;
 for(const [i,slot]of schedule.slots.entries()){
  if(!dc.eligible_sequences.includes(i)){rows[i].status='excluded-by-diagnostic-contract';continue;}
  if(!evidence.rows[i].reconciled){rows[i].status='unreconciled';stopped=true;continue;}
  try{const p=prepare({slot,outcome:sealed[i].result,entry:manifest.entries[i],runs_root,source_root});need(p?.prediction&&typeof p.verify==='function','prepared-prediction');prepared.push({i,...p});rows[i].status='ready-to-score';}
  catch(error){rows[i].status='prediction-preflight-failed';rows[i].error=String(error.message);stopped=true;}
 }
 for(const p of prepared){
  if(stopped){rows[p.i].status='not-scored-after-failure';continue;}
  try{await check();const score=await native_score({config,prediction:p.prediction,directory:join(out,String(p.i).padStart(2,'0')),stage_root:out,stage_guard:guard,persistence});need(!score?.native?.error,'native-error');recoveryMetrics(score);rows[p.i].native=score;rows[p.i].valid=true;rows[p.i].status='scored';}
  catch(error){rows[p.i].status='native-evaluation-failed';rows[p.i].failure=safeScorerFailure('score',error);stopped=true;}
 }
 let integrity=true,settled=false;
 try{
  need(hash(stable({config,schedule,manifest}))===inputDigest&&readFileSync(sources.config_path).equals(configBytes),'input-drift');
  need(await verify_audit()===true,'post-audit');
  assert.deepEqual(hydrate({root:outcome_root,schedule,sources,expected_seal_sha256:manifest.outcome_seal_sha256}),sealed,'comparison-native-score.post-seal');
  assert.deepEqual(reconcile(args),evidence,'comparison-native-score.post-evidence');
  for(const p of prepared)need(p.verify()===true,'post-prediction');
  settled=await verify_settlement({schedule_sha256:schedule.schedule_sha256,manifest_sha256:expected_manifest_sha256})===true;need(settled,'post-settlement');

 }catch{integrity=false;for(const row of rows){row.unverified_native=row.native;row.native=null;row.valid=false;row.status='post-score-integrity-failed';}}
 const report={
  schema:'are.candidate-descriptive-scores/v1',diagnostic_only:true,
  assigned_outcomes:schedule.assigned_outcomes,eligible_sequences:dc.eligible_sequences,
  reconciliation:evidence,native_outcomes:rows,manifest_sha256:expected_manifest_sha256,
  new_provider_calls:0,post_score_integrity_verified:integrity,outer_process_settled:settled,
  development_target_passed:false,benchmark_cleared:false,all_assignments_valid:false,
  accepted_relative_token_reduction:null,
  limitation:'Selected completed outcomes only; survivor scores do not establish campaign quality, patch correctness or comparative token savings.'
 };
 persistence.writeJson(join(out,'RESULTS.json'),report,{final:true});return report;
}
