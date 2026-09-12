// Independent final comparison and context/feedback audit. Open questions: RESULT.md.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {hash} from '../common.mjs';import {stable} from '../holdout-v1/transport.mjs';import {stageView,diagnosticView} from '../feedback-timing-v1/syntax.mjs';
import {createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../packages/evolution-runtime/index.mjs';
const root=fileURLToPath(new URL('./',import.meta.url)),bytes=p=>readFileSync(root+p),read=p=>JSON.parse(bytes(p)),save=(p,v)=>writeFileSync(root+p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const matrix=read('matrix.json'),freeze=read('freeze.json'),rows=[],bindings=[];
const bind=p=>bindings.push({path:p,sha256:hash(bytes(p))});
for(const f of freeze.sources)assert.equal(hash(bytes(f.path)),f.sha256,'frozen source changed: '+f.path);
for(const cell of matrix.cells){
 const dir='evidence/'+cell.cell_id+'/',r=read(dir+'result.json'),done=read(dir+'completed.json');assert.equal(done.result_sha256,hash(bytes(dir+'result.json')));assert.equal(read(dir+'started.json').freeze_sha256,hash(bytes('freeze.json')));
 if(!existsSync(root+'assessment-'+cell.cell_id+'.json'))execFileSync('node',[root+'audit.mjs',cell.cell_id],{maxBuffer:1000000});
 const a=read('assessment-'+cell.cell_id+'.json'),events=read(dir+'events.json'),captures=read(dir+'captures.json'),syntax=read(dir+'syntax-reports.json');
 const checkpoint=read(dir+'state/checkpoint.json'),{checkpoint_digest,...state}=checkpoint;
 assert.equal(hash(state),checkpoint_digest,'checkpoint digest');
 assert.equal(hash(state.history),r.recycling.history_digest,'history snapshot');
 assert.deepEqual(state.dispatches,r.recycling.dispatches,'dispatch history');
 for(const ref of state.archives){assert.equal(hash(read(dir+'state/'+ref+'.json')),ref,'archive integrity');bind(dir+'state/'+ref+'.json');}
 const generations=[...new Set(state.dispatches.map(d=>d.generation))],recoveries=[];
 for(const generation of generations.filter(g=>g>0)){
  const d=state.dispatches.find(d=>d.generation===generation);
  const capture=captures.find(c=>hash(stable(c.prompt))===d.prompt_digest);assert(capture,'dispatch prompt capture');
  const messages=JSON.parse(capture.prompt).messages;
  assert(messages.some(m=>typeof m.content==='string'&&m.content.includes('Workflow state: ')),'workflow state missing after recycle');
  assert(messages.some(m=>typeof m.content==='string'&&m.content.includes(read('tasks/'+cell.task_id+'/task.json').problem_statement)),'objective missing');
  recoveries.push({generation,sequence:d.sequence,step:capture.step,history_ref:d.history_ref,archive_verified:true,objective_and_workflow_present:true,model_response_received:!!read(dir+'responses.json')[d.sequence-1],subsequent_tool_events:events.filter(e=>e.step>=capture.step).length});
 }
 for(const e of events.filter(e=>e.tool==='stage_patch_candidate'&&e.result.ok)){
  const c=read(dir+e.result.candidate_id+'.json'),check=syntax.find(s=>s.candidate_id===c.candidate_id);assert(check&&check.cleanup_verified);
  assert.deepEqual(e.result,stageView(c,check,cell.feedback_arm),'feedback delivery mismatch');
  assert(check.files.every(f=>f.sha256===c.files.find(x=>x.path===f.path)?.after_sha256),'syntax candidate attribution');
 }
 for(const e of events.filter(e=>e.tool==='run_public_reproducer'&&e.result.ok&&e.arguments.candidate_id!=='baseline')){
  const check=syntax.find(s=>s.candidate_id===e.arguments.candidate_id);assert(check);
  assert.deepEqual(diagnosticView(e.result.syntax),diagnosticView(check),'evaluation diagnostic drift');
  if(check.status==='invalid')assert.equal(e.result.runtime_probe_executed,false);
 }
 const failedSyntax=syntax.filter(s=>s.status==='invalid');
 const feedback=failedSyntax.map(s=>{const staged=events.find(e=>e.tool==='stage_patch_candidate'&&e.result.candidate_id===s.candidate_id);const evaluation=events.find(e=>e.tool==='run_public_reproducer'&&e.arguments?.candidate_id===s.candidate_id);return {candidate_id:s.candidate_id,stage_call:staged.step+1,feedback_call:cell.feedback_arm==='early'?staged.step+1:evaluation?evaluation.step+1:null};});
 if(r.patch_produced){assert.equal(syntax.find(s=>s.candidate_id===r.candidate_id)?.status,'valid');for(const mode of ['evaluation','reproduction']){if(existsSync(root+dir+mode+'/invocation.json')){const v=read(dir+mode+'/invocation.json');assert.equal(v.patch_sha256,r.patch_sha256);assert.equal(v.report_sha256,hash(bytes(dir+mode+'/report.json')));bind(dir+mode+'/report.json');bind(dir+mode+'/invocation.json');}}}
 const row={cell_id:cell.cell_id,task_id:cell.task_id,arm:cell.policy_arm,repetition:cell.repetition,...a,syntax_invalid_candidates:failedSyntax.length,syntax_candidates:syntax.length,syntax_elapsed_ms:syntax.reduce((sum,x)=>sum+x.elapsed_ms,0),feedback,recoveries,recycling_verdict:r.recycling.recycles?recoveries.length===r.recycling.recycles&&recoveries.every(x=>x.model_response_received&&x.subsequent_tool_events>0)?'passed':'incomplete':'not_exercised',host_compaction:{mode:'direct-stateless-api',host_compaction_events:0,provider_internal_compaction:'unobservable',claim:'ARE recycles before configured admission threshold; provider internal behavior is not proven.'}};
 row.infrastructure_failure=r.status==='run_error'&&!((r.error==='incomplete-output'&&r.receipts.at(-1)?.status===200&&r.receipts.at(-1)?.finish_reason==='length')||['terminal outcome must be sole call','submission must be sole call'].includes(r.error));
 row.first_stage_call=events.find(e=>e.tool==='stage_patch_candidate'&&e.result.ok)?.step+1||null;row.first_hypothesis_call=events.find(e=>e.tool==='record_hypotheses'&&e.result.ok)?.step+1||null;row.checkpoint_exposures=captures.filter(c=>JSON.parse(c.prompt).messages.some(m=>m.role==='user'&&m.content?.includes('Required phase: construction checkpoint:'))).map(c=>c.step+1);
 rows.push(row);for(const f of ['result.json','events.json','captures.json','workflow.json','syntax-reports.json','completed.json','state/checkpoint.json'])bind(dir+f);bind('assessment-'+cell.cell_id+'.json');
}
const pairs=[];
for(const task_id of [...new Set(matrix.cells.map(c=>c.task_id))])for(const repetition of [1,2]){
 const early=rows.find(r=>r.task_id===task_id&&r.repetition===repetition&&r.arm==='reserved'),delayed=rows.find(r=>r.task_id===task_id&&r.repetition===repetition&&r.arm==='baseline');assert.equal(early.first_prompt_sha256,delayed.first_prompt_sha256,'paired prompt mismatch');
 pairs.push({task_id,repetition,early:early.cell_id,delayed:delayed.cell_id,comparison:early.infrastructure_failure||delayed.infrastructure_failure?'infrastructure_incomplete':early.verified_success===delayed.verified_success?'tie':early.verified_success?'early_win':'delayed_win'});
}
const summary=Object.fromEntries(['reserved','baseline'].map(arm=>{const rr=rows.filter(r=>r.arm===arm);return [arm,{episodes:rr.length,successes:rr.filter(r=>r.verified_success).length,model_calls:rr.reduce((s,r)=>s+r.model_calls,0),tokens:rr.reduce((s,r)=>s+r.input_tokens+r.output_tokens,0),elapsed_ms:rr.reduce((s,r)=>s+r.elapsed_ms,0),recycles:rr.reduce((s,r)=>s+r.recycles,0),invalid_candidates:rr.reduce((s,r)=>s+r.syntax_invalid_candidates,0),list_price_estimate_usd:rr.reduce((s,r)=>s+r.list_price_estimate_usd,0)}];}));
const earlyWins=pairs.filter(p=>p.comparison==='early_win').length,delayedWins=pairs.filter(p=>p.comparison==='delayed_win').length,exposed=rows.some(r=>r.checkpoint_exposures.length),completePairs=pairs.every(p=>p.comparison!=='infrastructure_incomplete');
const costPass=summary.reserved.tokens<=summary.baseline.tokens*1.2&&summary.reserved.elapsed_ms<=summary.baseline.elapsed_ms*1.2;
const disposition=!completePairs||!exposed?'inconclusive':earlyWins>delayedWins&&costPass?'collect-replications':'inconclusive';
const reason=!completePairs?'Infrastructure-incomplete pairs limit the comparison.':!exposed?'No construction checkpoint was exposed; treatment mechanism not exercised.':earlyWins>delayedWins&&costPass?'Pilot repair/cost screen passed; collect independent replications before broader qualification.':'Construction checkpoints did not satisfy the joint pilot repair/cost screen; retain counterevidence and investigate separately.';
const report={status:'completed',episodes:rows.length,rows,pairs,summary,early_wins:earlyWins,delayed_wins:delayedWins,hypothesis_disposition:disposition,reason,syntax_mechanism_exercised:exposed,cost_screen_passed:costPass,incorrect_rejection_claim:'Offline retained-valid controls passed; live invalid candidates require diagnostic review; no universal false-rejection claim.',bindings,authority_effect:'none',open_questions_ref:'RESULT.md'};
assert.equal(rows.length,8);assert(rows.every(r=>r.cleanup_verified));save('closeout.json',report);
const research=read('research.json'),h=research.records.find(r=>r.record_id===research.labels.H1),exp=research.records.find(r=>r.schema_version==='are.research-experiment/v1');
const observation=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:'closeout.json',source_result_digest:hash(bytes('closeout.json')),evaluator_id:'recovery110-independent-scoring-and-context-audit',evidence_refs:['closeout.json','controls.json'],phase:'experiment',limitations:['Two observed tasks, same repository and model; two repetitions per task.','No cross-domain or cross-model claim.','Provider-internal compaction unobservable.'],observation_kind:disposition==='collect-replications'?'supporting':'inconclusive',claim:reason});
const decision=createLearningDecision({hypothesis_ref:h.record_id,observation_refs:[observation.record_id],experiment_ref:exp.record_id,disposition,reason_codes:['recovery.fixed-cohort-completed','recovery.development-only'],supporting_count:disposition==='collect-replications'?1:0,counterevidence_count:0,experiment_support_count:disposition==='collect-replications'?1:0,next_action:'Close this GLM small-window round with scoped evidence; select any later intervention or generalization as a separate plan.'});
const records=[...research.records,observation,decision];for(const r of records)assert(verifyEvolutionRecord(r,r.schema_version).ok);save('research-result.json',{records,projection:{edges:[...research.projection.edges,{from:exp.record_id,to:observation.record_id},{from:observation.record_id,to:decision.record_id}]},authority_effect:'none',open_questions_ref:'RESULT.md'});
const table=rows.map(r=>`| ${r.cell_id} | ${r.verified_success?'full pass twice':r.status} | ${r.model_calls} | ${r.recycles} | ${r.syntax_invalid_candidates} |`).join('\n');
writeFileSync(root+'RESULT.md',`# GLM recovery reservation comparison\n\nThe fixed 8-episode development cohort is complete. Reserved construction: **${summary.reserved.successes}/4** repeat-verified repairs. Baseline: **${summary.baseline.successes}/4**. These are two observed Svelte tasks with two repetitions, not fresh holdout qualification.\n\n${reason}\n\n| Episode | Outcome | Model calls | Recycles | Invalid syntax candidates |\n| --- | --- | --- | --- | --- |\n${table}\n\n## Evidence and limits\n\n[Closeout](closeout.json) contains all paired outcomes, scores, costs, feedback timing, archive integrity and recovery evidence. [Research records](research-result.json) bind H1 to the measured result. [Policy controls](controls.json) verify checkpoints and unchanged baseline. Existing syntax/scoring controls are inherited with frozen source bindings.\n\nThe direct API runner invokes no host compactor. Every audited admitted bound is below 12K. Provider-internal compaction is unobservable; this does not prove it never occurs. Per-episode recovery verdicts distinguish passed, incomplete and not exercised. Preserved archives and objective/workflow continuity do not establish perfect semantic recall.\n\n## Follow-up and Open Questions\n\nInterpret the per-task and paired outcomes before selecting another intervention. Recovery budgeting and evidence retention remain separate hypotheses. Non-coding, other models and larger windows remain deferred after this chapter. Any generalization needs its own comparison.\n\nDid earlier construction improve repairs? Which are knowledge, investigation or budget bottlenecks? Does any benefit survive fresh tasks and models?\n`,{flag:'wx'});
console.log(JSON.stringify({episodes:rows.length,summary,disposition,reason}));
