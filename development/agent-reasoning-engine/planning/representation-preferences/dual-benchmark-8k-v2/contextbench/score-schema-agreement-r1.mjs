// Schema-agreement candidate. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
// Additive ranked-source-hints production candidate. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
// Candidate-only descendant of score-comparison-compact-campaign.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Evaluator-only orchestration. Open questions: COMPARISON-NATIVE-SCORING-R2.md.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,realpathSync,lstatSync,openSync,closeSync,fstatSync,readSync,constants} from 'node:fs';
import {resolve,join,relative,sep,isAbsolute} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {reconcileComparisonCampaignEvidence} from './schema-agreement-evidence-manifest-r1.mjs';
import {verifyComparisonOutcomeSeal} from './schema-agreement-outcome-store-r1.mjs';
import {reconstructRankedReadPrediction as reconstructComparisonPrediction} from './schema-agreement-prediction-r1.mjs';
import {censusRankedReadRun} from './schema-agreement-census-r1.mjs';
import {adjudicateSchemaAgreement as adjudicateRankedRead} from './schema-agreement-adjudication-r2.mjs';
import {summarizeComparisonScores} from './schema-agreement-score-summary-r1.mjs';
import {recoveryMetrics} from './score-recovery-campaign.mjs';
import {scoreNativeBounded,safeScorerFailure} from './packet-diversity-v1/scorer-bridge-bounded-v4.mjs';
import {createStageOutputGuard,MAXIMUM_STAGE_BYTES} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('comparison-native-score.'+m);};
const canonical=p=>{p=resolve(p);need(realpathSync(p)===p,'canonical-path');return p;};
const within=(a,b)=>{const r=relative(a,b);return r===''||(r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r));};
export function prepareComparisonPrediction({slot,outcome,entry,runs_root,source_root}){
 const run=canonical(join(runs_root,String(slot.sequence).padStart(2,'0'))),base=canonical(join(source_root,String(slot.sequence).padStart(2,'0'),'base'));
 need(canonical(outcome.result.source_root)===canonical(join(source_root,String(slot.sequence).padStart(2,'0'))),'source-assignment');
 const resultDigest=hash(stable(outcome.result));
 function rebuild(){
  let bytesRead=0;const bindings=[];
  const read=(path,pin)=>{
   path=canonical(path);need(lstatSync(path).isFile(),'regular-file');const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
   try{const stat=fstatSync(fd);need(stat.isFile()&&stat.size<=128*1024*1024-bytesRead,'read-limit');bytesRead+=stat.size;const data=Buffer.alloc(stat.size);let offset=0;
    while(offset<data.length){const n=readSync(fd,data,offset,data.length-offset,offset);need(n>0,'short-read');offset+=n;}
    const digest=hash(data);need(fstatSync(fd).size===stat.size&&(!pin||digest===pin),'file-drift');bindings.push({path,sha256:digest});return data;
   }finally{closeSync(fd);}
  };
  need(hash(stable(outcome.result))===resultDigest,'result-object-drift');
  const task=JSON.parse(read(slot.task_path,slot.task_sha256));
  need(task.instance_id===slot.instance_id&&task.base_commit===slot.base_commit,'task-identity');
  const git=args=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:base,encoding:'utf8',timeout:120000,maxBuffer:1048576}).trim();
  need(git(['rev-parse','HEAD'])===slot.base_commit&&!git(['status','--porcelain']),'base-revision-or-drift');
  const names=readdirSync(canonical(join(run,'snapshots'))).sort();need(names.length<=4096&&names.every(n=>/^[a-f0-9]{64}\.json$/.test(n)),'snapshot-names');
  const snapshots=names.map(n=>JSON.parse(read(join(run,'snapshots',n))));
  const text=read(join(run,'events.jsonl'),entry.files['events.jsonl']).toString('utf8'),lines=text.split('\n');if(lines.at(-1)==='')lines.pop();need(lines.length<=100000&&lines.every(Boolean),'journal-shape');
  const source_index=JSON.parse(read(join(run,'source-index.json'),entry.files['source-index.json']));
  const input={arm:slot.arm,result:outcome.result,events:lines.map(JSON.parse),snapshots,source_index,task,repoRoot:base};
  const rebuilt=reconstructComparisonPrediction(input),census=censusRankedReadRun(input);
  return {rebuilt,census,bindings};
 }
 const initial=rebuild();return {prediction:initial.rebuilt.prediction,census:initial.census,verify:()=>{assert.deepEqual(rebuild(),initial,'comparison-native-score.post-source-integrity');return true;}};
}
export async function scoreComparisonCampaign({outcome_root,runs_root,source_root,score_root,schedule,sources,manifest,expected_manifest_sha256,verify_settlement,admit_score}, {native_score=scoreNativeBounded,reconcile=reconcileComparisonCampaignEvidence,hydrate=verifyComparisonOutcomeSeal,prepare=prepareComparisonPrediction,adjudicate=adjudicateRankedRead}={}){
 need(typeof verify_settlement==='function'&&typeof admit_score==='function','admission-callbacks');
 const out=canonical(score_root),roots=[outcome_root,runs_root,source_root].map(canonical);
 need(roots.every(root=>!within(root,out)&&!within(out,root))&&readdirSync(out).length===0,'separate-fresh-score-root');
 need(await verify_settlement({schedule_sha256:schedule.schedule_sha256,manifest_sha256:expected_manifest_sha256})===true,'process-not-settled');
 const args={outcome_root,runs_root,schedule,sources,manifest,expected_manifest_sha256};
 const evidence=reconcile(args),sealed=hydrate({root:outcome_root,schedule,sources,expected_seal_sha256:manifest.outcome_seal_sha256});
 need(sealed.length===schedule.assigned_outcomes&&evidence.rows.length===schedule.assigned_outcomes,'denominator');
 const config=JSON.parse(readFileSync(sources.config_path)),inputDigest=hash(stable({config,schedule,manifest}));
 const guard=createStageOutputGuard({root:out}),persistence=createStagePersistence({stage_root:out,stage_guard:guard});
 const check=async()=>need(await admit_score({output:out,growth_reservation_bytes:Math.max(0,MAXIMUM_STAGE_BYTES-guard.snapshot().bytes)})===true,'score-admission');
 const rows=schedule.slots.map(s=>({slot_id:s.slot_id,task_id:s.task_id,arm:s.arm,status:'not-scored',valid:false,native:null})),prepared=[];
 const failureSummary=summarizeComparisonScores({schedule,sources,outcomes:rows,reconciliation:evidence,outer_process_settled:false,post_score_integrity_verified:false});
 let stopped=false;
 for(const [i,slot]of schedule.slots.entries()){
  if(!evidence.rows[i].reconciled){rows[i].status='unreconciled';stopped=true;continue;}
  try{const p=prepare({slot,outcome:sealed[i].result,entry:manifest.entries[i],runs_root,source_root});need(p?.prediction&&typeof p.verify==='function','prepared-prediction');prepared.push({i,...p});rows[i].status='ready-to-score';}
  catch(error){rows[i].status='prediction-preflight-failed';rows[i].error=String(error.message);stopped=true;}
 }
 for(const p of prepared){
  if(stopped){rows[p.i].status='not-scored-after-failure';continue;}
  try{await check();const score=await native_score({config,prediction:p.prediction,directory:join(out,String(p.i).padStart(2,'0')),stage_root:out,stage_guard:guard,persistence});need(!score?.native?.error,'native-error');recoveryMetrics(score);rows[p.i].native=score;rows[p.i].valid=true;rows[p.i].status='scored';}
  catch(error){rows[p.i].status='native-evaluation-failed';rows[p.i].failure=safeScorerFailure('score',error);stopped=true;}
 }
 let integrity=true,settled=false,summary;
 try{
  need(hash(stable({config,schedule,manifest}))===inputDigest,'input-drift');
  assert.deepEqual(reconcile(args),evidence,'comparison-native-score.post-evidence');
  for(const p of prepared)need(p.verify()===true,'post-prediction');
  settled=await verify_settlement({schedule_sha256:schedule.schedule_sha256,manifest_sha256:expected_manifest_sha256})===true;need(settled,'post-settlement');
  summary=summarizeComparisonScores({schedule,sources,outcomes:rows,reconciliation:evidence,outer_process_settled:settled,post_score_integrity_verified:true});
 }catch{integrity=false;for(const row of rows){row.unverified_native=row.native;row.native=null;row.valid=false;row.status='post-score-integrity-failed';}}
 if(!integrity)summary={...failureSummary,rows:failureSummary.rows.map((row,i)=>({...row,status:rows[i].status})),gates:{...failureSummary.gates,outer_process_settled:settled}};
 const measurementRows=summary.rows.map((row,i)=>{
  const p=prepared.find(p=>p.i===i),census=p?.census,steps=rows[i].native?.native?.trajectory?.steps;
  return {task_id:row.task_id,status:row.status,valid:row.valid,native_reconstructed:integrity&&!!p,accounting_complete:row.accounting_complete,window_verified:row.window_verified,counters_reconstructed:integrity&&census?.counters_reconstructed===true,total_model_tokens:census?.total_model_tokens??null,known_model_tokens:row.known_tokens,conservative_model_tokens:row.conservative_tokens,exported_union_span_recall:Array.isArray(steps)&&steps.length?steps.at(-1).coverage?.span:null,native_span_f1:row.metrics?.span_f1??null,counters:census?.counters??null,search_census:census?.search_census??null};
 });
 let acquisition,acquisition_measurement_verified=true;
 try{acquisition=adjudicate(measurementRows);}
 catch(error){
  acquisition_measurement_verified=false;
  acquisition={schema:'are.schema-agreement-adjudication/v1',eligible:false,disposition:'inconclusive',reason:'measurement-contract-validation-failed',rows:measurementRows.map(row=>({...row,eligible:false,reasons:['measurement-contract-validation-failed'],coverage_per_10000_tokens:null,coverage_per_10000_tokens_delta:null,native_span_f1_delta:null})),mean_coverage_per_10000_tokens:null,mean_native_span_f1:null,mean_coverage_per_10000_tokens_delta:null,mean_native_span_f1_delta:null,campaign_goal_achieved:false,matched_control_savings_evaluable:false,accepted_token_savings:null,authority_effect:'none',claim_ceiling:'Acquisition comparison unavailable; native outcomes and all cost evidence retained.',open_questions_ref:'RANKED-READ-ACQUISITION-PROTOCOL-R2.md'};
 }

 const report={...summary,acquisition,acquisition_measurement_verified,native_outcomes:rows,manifest_sha256:expected_manifest_sha256,new_provider_calls:0,post_score_integrity_verified:integrity};
 persistence.writeJson(join(out,'RESULTS.json'),report,{final:true});return report;
}
