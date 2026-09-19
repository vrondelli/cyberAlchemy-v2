// Additive archive launch composition. Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
// Additive independent-investigation launch binding; historical candidate unchanged.
// Exact reviewed candidate-only production composition. Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import assert from 'node:assert/strict';import {readFileSync,mkdirSync,realpathSync} from 'node:fs';import {join,resolve} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {verifyRecentEvidenceSchedule} from './recent-evidence-schedule-r1.mjs';
import {verifyCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {createComparisonGenerationProcess} from './recent-evidence-generation-process-r1.mjs';
import {launchComparison} from './recent-evidence-launcher-r1.mjs';
import {runComparisonProductionStage} from './recent-evidence-production-stage-r1.mjs';
import {verifyEvolutionRecord} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {credentials} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
import {verifyRecentPopulatedQualification} from './recent-evidence-populated-result-binding-r2.mjs';
import {verifyRecentEvidenceProspectiveDag} from './recent-evidence-prospective-dag-r1.mjs';
const read=p=>JSON.parse(readFileSync(p)),hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('candidate-production.'+m);};
export const GROWTH_BYTES=2*1024**3+416*1024**2;
export const REQUIRED_ENTRIES=['run-recent-evidence-production-r1.mjs','recent-evidence-production-r1.mjs','recent-evidence-launcher-r1.mjs','recent-evidence-generation-process-r1.mjs','recent-evidence-generation-worker-r1.mjs','recent-evidence-generation-storage-r1.mjs','recent-evidence-campaign-r1.mjs','recent-evidence-production-stage-r1.mjs','recent-evidence-production-stage-worker-r1.mjs','recent-evidence-qualification-worker-r1.mjs','recent-evidence-qualification-process-r1.mjs','recent-evidence-final-worker-r1.mjs','recent-evidence-final-process-r1.mjs','recent-evidence-prospective-dag-r1.mjs','score-recent-evidence-r1.mjs','packet-diversity-v1/score-native-bounded-v3.py','ranked_source_supervisor_r1.py','ranked_source_worker_r2.py','ranked_source_hints_r3.py'];
export const SOURCE_INDEX_PYTHON=realpathSync('/usr/bin/python3');
export function verifyComparisonProductionFreeze({manifest_path,manifest_sha256}){
 need(fileHash(manifest_path)===manifest_sha256,'freeze-drift');const f=read(manifest_path);
 need(f.schema==='are.candidate-only-production-freeze/v1','freeze-schema');
 const entries=[...REQUIRED_ENTRIES.map(n=>join(import.meta.dirname,n)),SOURCE_INDEX_PYTHON];verifyCandidateSources(f.files,entries);
 const files=new Map(f.files.map(b=>[b.path,b.sha256]));
 for(const p of [...entries,f.request.sources.config_path,f.request.sources.cohort_path,f.request.credential_path,f.request.binding.provenance.path,...Object.values(f.evidence)])need(files.has(p),'required-binding');
 verifyRecentEvidenceSchedule({schedule:f.request.schedule,...f.request.sources});assert.deepEqual(f.request.schedule.candidates,['recent-evidence-ledger']);
 need(f.request.schedule.assigned_outcomes===4&&f.generation_deadline_ms===9000000&&f.combined_growth_bytes===GROWTH_BYTES,'fixed-envelope');
 const config=read(f.request.sources.config_path);need(config.model==='glm-5.3-flash'&&config.tasks.length===4,'model-cohort');
 for(const p of [config.scorer,config.source_manifest,...f.request.schedule.slots.map(s=>s.task_path)])need(files.has(p),'evaluator-task-binding');
 const research=read(f.evidence.research);need(research.schema==='are.candidate-only-research/v1'&&research.records.length===3,'research');
 for(const r of [...research.records,research.experiment])need(verifyEvolutionRecord(r).ok,'native-record');
 for(const b of research.source_bindings)need(files.get(resolve(b.path))===b.sha256,'research-source-binding');
 need(research.schedule_sha256===f.request.schedule.schedule_sha256&&research.maximum_workers===2&&research.maximum_model_tokens===384000&&research.matched_control_savings_evaluable===false,'research-envelope');
 const overlay=read(f.evidence.prospective_overlay),registrationReview=read(f.evidence.registration_review);
 need(overlay.candidate_ref===f.evidence.research&&overlay.dispatch_admitted===false&&
  overlay.registration_review_required===true,'prospective-overlay-identity');
 for(const b of overlay.source_bindings)need(files.get(resolve(b.path))===b.sha256,'prospective-overlay-binding');
 need(verifyRecentEvidenceProspectiveDag({graph:overlay.graph,candidate:research,parent:read(overlay.parent_ref)})===true,'prospective-overlay-graph');
 need(registrationReview.approved===true&&registrationReview.findings.length===0,'registration-review');
 for(const b of registrationReview.source_bindings)need(files.get(resolve(b.path))===b.sha256,'registration-review-binding');
 const criteria=research.experiment.success_criteria;
 for(const k of ['fixed_four_outcomes','all_valid','each_task_perfect','all_requests_verified','complete_accounting','all_long_trajectories','post_score_integrity_verified'])need(criteria[k]===true,'research-criteria');
 need(criteria.matched_control_savings_evaluable===false&&criteria.campaign_goal_achieved===false,'claim-ceiling');
 const review=read(f.evidence.integration_review);need(review.approved===true&&review.findings.length===0,'offline-review');
 for(const b of review.source_bindings)need(files.get(resolve(b.path))===b.sha256,'review-source-binding');
 need(files.get(f.final_qualification?.path)===f.final_qualification?.sha256,'final-qualification-binding');
 verifyFinalQualification({qualification_path:f.final_qualification.path,qualification_sha256:f.final_qualification.sha256,schedule:f.request.schedule});
 const finalReview=read(f.evidence.final_qualification_review);need(finalReview.approved===true&&finalReview.findings.length===0,'final-qualification-review');
 for(const b of finalReview.source_bindings)need(files.get(resolve(b.path))===b.sha256,'final-review-source-binding');
 need(files.get(f.initial_qualification?.path)===f.initial_qualification?.sha256,'initial-qualification-binding');
 verifyInitialQualification({qualification_path:f.initial_qualification.path,qualification_sha256:f.initial_qualification.sha256,schedule:f.request.schedule});
 need(files.get(f.populated_qualification?.path)===f.populated_qualification?.sha256,'populated-qualification-binding');
 verifyRecentPopulatedQualification({qualification_path:f.populated_qualification.path,
  qualification_sha256:f.populated_qualification.sha256,schedule:f.request.schedule});
 for(const key of ['initial_qualification_review','populated_qualification_review']){
  const qualificationReview=read(f.evidence[key]);need(qualificationReview.approved===true&&qualificationReview.findings.length===0,key);
  for(const b of qualificationReview.source_bindings)need(files.get(resolve(b.path))===b.sha256,key+'-binding');
 }
 return f;
}
export function verifyFinalQualification({qualification_path,qualification_sha256,schedule}){
 need(fileHash(qualification_path)===qualification_sha256,'final-qualification-drift');
 const q=read(qualification_path),report=q.measurement_report,s=q.process_settlement;
 need(q.qualified===true&&s?.local_settled===true&&s.process_group_absent===true&&s.forced===false&&s.exit_code===0,'final-qualification-settlement');
 need(report?.schema==='are.recent-evidence-final-campaign/v1'&&report.qualified===true&&report.model_calls===0&&report.schedule_sha256===schedule.schedule_sha256&&report.rows?.length===4,'final-qualification-report');
 for(const [i,row]of report.rows.entries()){
  const slot=schedule.slots[i],r=row.result;
  need(row.qualified===true&&row.model_calls===0&&row.slot_id===slot.slot_id&&r?.qualified===true&&r.model_calls===0&&r.cell_sha256===slot.cell_sha256&&r.task_id===slot.instance_id,'final-qualification-slot');
  need(Number.isSafeInteger(r.projected_tokens)&&r.projected_tokens<7999&&r.packet?.status==='ready','final-qualification-window');
  need(Array.isArray(r.receipts)&&Array.isArray(r.index_receipts)&&r.receipts.every(x=>x.kind==='tokenizer')&&r.index_receipts.every(x=>x.kind==='index-tokenizer'),'final-qualification-receipt-kind');
  need(r.receipts.length>=1&&r.receipts.length<=2&&r.index_measurements>=1&&r.index_measurements<=11&&providerAttemptHealth([...r.receipts,...r.index_receipts]).healthy,'final-qualification-provider-health');
  const digest=hash(stable({model:'glm-5.3-flash',messages:r.prompt?.messages,tools:r.prompt?.tools}));
  need(digest===r.tokenizer_request_sha256&&r.receipts.some(x=>x.request_sha256===digest&&x.input_tokens+slot.cell.provider_profile.token_margin+slot.cell.limits.output_cap===r.projected_tokens),'final-qualification-measurement-binding');
 }
 return true;
}
export function qualifyComparisonProduction(args){
 const f=verifyComparisonProductionFreeze(args),config=read(f.request.sources.config_path);
 for(const task of config.tasks){
  need(fileHash(task.task_path)===task.task_sha256,'task-drift');
  const output=execFileSync('git',['--no-optional-locks','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',task.repository_cache,'rev-parse','--verify',task.base_commit+'^{commit}'],{encoding:'utf8',timeout:10000,maxBuffer:1048576,env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_NO_LAZY_FETCH:'1',GIT_ALLOW_PROTOCOL:'',GIT_TERMINAL_PROMPT:'0'}}).trim();need(output===task.base_commit,'base-commit');
 }
 credentials(f.request.credential_path);
 const storage=[f.request.outcome_root,f.request.runs_root,f.request.metadata_root,f.request.source_root,f.score_root,f.supervision_root].map(output=>guardStorage({binding:f.request.binding,output,growth_reservation_bytes:GROWTH_BYTES}));
 need(storage.every(r=>r.admitted===true),'storage');return {admitted:true,manifest_sha256:args.manifest_sha256,storage,new_provider_calls:0};
}
export function verifyInitialQualification({qualification_path,qualification_sha256,schedule}){
 need(fileHash(qualification_path)===qualification_sha256,'qualification-drift');const q=read(qualification_path),report=q.measurement_report,s=q.process_settlement;
 need(q.qualified===true&&s?.local_settled===true&&s.process_group_absent===true&&s.forced===false&&s.exit_code===0,'qualification-settlement');
 need(report?.schema==='are.candidate-only-request-qualification/v1'&&report.qualified===true&&report.model_calls===0&&report.schedule_sha256===schedule.schedule_sha256&&report.rows.length===schedule.assigned_outcomes,'qualification-report');
 for(const [i,row]of report.rows.entries()){
  const slot=schedule.slots[i];need(row.qualified===true&&row.slot_id===slot.slot_id&&row.task_sha256===slot.task_sha256&&row.cell_sha256===slot.cell_sha256,'qualification-slot');
  const bytes=readFileSync(row.prompt_path),prompt=JSON.parse(bytes);need(hash(bytes)===row.prompt_sha256&&prompt.model==='glm-5.3-flash'&&Array.isArray(prompt.messages)&&Array.isArray(prompt.tools),'qualification-prompt');
  const r=row.receipt;need(r?.kind==='tokenizer'&&r.dispatched===true&&r.status===200&&Number.isSafeInteger(r.input_tokens)&&r.input_tokens>=0&&r.request_sha256===hash(stable({model:prompt.model,messages:prompt.messages,tools:prompt.tools})),'qualification-tokenizer');
  const projected=r.input_tokens+slot.cell.provider_profile.token_margin+slot.cell.limits.output_cap;need(row.projected_tokens===projected&&projected<7999,'qualification-window');
 }
 return true;
}
export async function runCandidateProduction({manifest_path,manifest_sha256,review_path,signal}){
 const args={manifest_path,manifest_sha256},f=verifyComparisonProductionFreeze(args),review=read(review_path);
 need(review.approved===true&&review.live_execution_admitted===true&&review.manifest_sha256===manifest_sha256,'exact-live-review');
 need(review.initial_qualification_sha256===f.initial_qualification.sha256&&
  review.populated_qualification_sha256===f.populated_qualification.sha256&&
  review.final_qualification_sha256===f.final_qualification.sha256,'exact-qualification-review');
 const qualification={qualification_path:f.initial_qualification.path,qualification_sha256:f.initial_qualification.sha256,schedule:f.request.schedule};verifyInitialQualification(qualification);
 verifyRecentPopulatedQualification({qualification_path:f.populated_qualification.path,
  qualification_sha256:f.populated_qualification.sha256,schedule:f.request.schedule});
 verifyFinalQualification({qualification_path:f.final_qualification.path,
  qualification_sha256:f.final_qualification.sha256,schedule:f.request.schedule});
 qualifyComparisonProduction(args);
 for(const p of [f.request.outcome_root,f.request.runs_root,f.request.metadata_root,f.score_root,f.supervision_root])mkdirSync(p,{recursive:true,mode:0o700});
 const child=createComparisonGenerationProcess(),process_adapter={generate:async input=>{verifyComparisonProductionFreeze(args);verifyInitialQualification(qualification);return child.generate(input);},settle:async input=>{const s=await child.settle(input);verifyComparisonProductionFreeze(args);return s;}};
 return launchComparison({request:f.request,score_root:f.score_root,supervision_root:f.supervision_root,signal,deadline_ms:f.generation_deadline_ms,qualify:async()=>qualifyComparisonProduction(args)},{process_adapter,score:async input=>{
  verifyComparisonProductionFreeze(args);verifyInitialQualification(qualification);
  const pins={schedule_sha256:f.request.schedule.schedule_sha256,manifest_sha256:input.expected_manifest_sha256};need(await input.verify_settlement(pins)===true,'pre-score-settlement');
  const generation_pins=Object.fromEntries(['RESULTS.json','EVIDENCE-MANIFEST.json','PROCESS-SETTLEMENT.json'].map(name=>[name,fileHash(join(name==='PROCESS-SETTLEMENT.json'?f.supervision_root:f.request.metadata_root,name))]));
  const {verify_settlement,admit_score,...score}=input;
  const result=await runComparisonProductionStage({operation:'score',args:{...args,score,generation_pins},signal});
  need(await input.verify_settlement(pins)===true,'post-score-settlement');verifyComparisonProductionFreeze(args);return result.value;
 }});
}
