// Additive archive launch composition. Open questions: BOUNDED-ARCHIVE-FRONTIER-R1.md.
// Additive independent-investigation launch binding; historical candidate unchanged.
// Exact reviewed candidate-only production composition. Open questions: BOUNDED-ARCHIVE-FRONTIER-R1.md.
import assert from 'node:assert/strict';import {readFileSync,mkdirSync} from 'node:fs';import {join,resolve} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {verifyBoundedArchiveFrontierSchedule} from './bounded-archive-frontier-schedule-r1.mjs';
import {verifyCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {createComparisonGenerationProcess} from './bounded-archive-frontier-generation-process-r1.mjs';
import {launchComparison} from './bounded-archive-frontier-launcher-r1.mjs';
import {runComparisonProductionStage} from './bounded-archive-frontier-production-stage-r1.mjs';
import {verifyEvolutionRecord} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {credentials} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const read=p=>JSON.parse(readFileSync(p)),hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('candidate-production.'+m);};
export const GROWTH_BYTES=2*1024**3+416*1024**2;
export const REQUIRED_ENTRIES=['run-bounded-archive-frontier-production-r1.mjs','bounded-archive-frontier-production-r1.mjs','bounded-archive-frontier-generation-worker-r1.mjs','bounded-archive-frontier-production-stage-worker-r1.mjs','bounded-archive-frontier-qualification-worker-r1.mjs','bounded-archive-frontier-qualification-process-r1.mjs','packet-diversity-v1/score-native-bounded-v3.py'];
export function verifyComparisonProductionFreeze({manifest_path,manifest_sha256}){
 need(fileHash(manifest_path)===manifest_sha256,'freeze-drift');const f=read(manifest_path);
 need(f.schema==='are.candidate-only-production-freeze/v1','freeze-schema');
 const entries=REQUIRED_ENTRIES.map(n=>join(import.meta.dirname,n));verifyCandidateSources(f.files,entries);
 const files=new Map(f.files.map(b=>[b.path,b.sha256]));
 for(const p of [...entries,f.request.sources.config_path,f.request.sources.cohort_path,f.request.credential_path,f.request.binding.provenance.path,...Object.values(f.evidence)])need(files.has(p),'required-binding');
 verifyBoundedArchiveFrontierSchedule({schedule:f.request.schedule,...f.request.sources});assert.deepEqual(f.request.schedule.candidates,['bounded-archive-frontier']);
 need(f.request.schedule.assigned_outcomes===4&&f.generation_deadline_ms===9000000&&f.combined_growth_bytes===GROWTH_BYTES,'fixed-envelope');
 const config=read(f.request.sources.config_path);need(config.model==='glm-5.3-flash'&&config.tasks.length===4,'model-cohort');
 for(const p of [config.scorer,config.source_manifest,...f.request.schedule.slots.map(s=>s.task_path)])need(files.has(p),'evaluator-task-binding');
 const research=read(f.evidence.research);need(research.schema==='are.candidate-only-research/v1'&&research.records.length===3,'research');
 for(const r of [...research.records,research.experiment])need(verifyEvolutionRecord(r).ok,'native-record');
 for(const b of research.source_bindings)need(files.get(resolve(b.path))===b.sha256,'research-source-binding');
 need(research.schedule_sha256===f.request.schedule.schedule_sha256&&research.maximum_workers===2&&research.maximum_model_tokens===384000&&research.matched_control_savings_evaluable===false,'research-envelope');
 const criteria=research.experiment.success_criteria;
 for(const k of ['fixed_four_outcomes','all_valid','each_task_perfect','all_requests_verified','complete_accounting','all_long_trajectories','post_score_integrity_verified'])need(criteria[k]===true,'research-criteria');
 need(criteria.matched_control_savings_evaluable===false&&criteria.campaign_goal_achieved===false,'claim-ceiling');
 const review=read(f.evidence.integration_review);need(review.approved===true&&review.findings.length===0,'offline-review');
 for(const b of review.source_bindings)need(files.get(resolve(b.path))===b.sha256,'review-source-binding');
 return f;
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
  const projected=r.input_tokens+slot.cell.provider_profile.token_margin+slot.cell.limits.output_cap;need(row.projected_tokens===projected&&projected<=8000,'qualification-window');
 }
 return true;
}
export async function runCandidateProduction({manifest_path,manifest_sha256,review_path,signal}){
 const args={manifest_path,manifest_sha256},f=verifyComparisonProductionFreeze(args),review=read(review_path);
 need(review.approved===true&&review.live_execution_admitted===true&&review.manifest_sha256===manifest_sha256,'exact-live-review');
 const qualification={qualification_path:review.qualification_path,qualification_sha256:review.qualification_sha256,schedule:f.request.schedule};verifyInitialQualification(qualification);
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
