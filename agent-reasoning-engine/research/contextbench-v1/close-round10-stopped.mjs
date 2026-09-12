// Close frozen round ten after its declared shared-provider stopping rule. No provider calls.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHypothesisObservation,createLearningDecision,createResearchHypothesis,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {bindDelivery} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {build,verifyPredecessor,verifyEvidence} from './bind-round10.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const out='/home/vrondelli/.cache/are/contextbench-round10-live';
const read=name=>JSON.parse(readFileSync(root+name));
const fileSha=path=>sha(readFileSync(path));
const digest=value=>createHash('sha256').update(value).digest('hex');
const write=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',target=root+name;if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round10.artifact-drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};
const f1=value=>value&&(value.coverage+value.precision)?2*value.coverage*value.precision/(value.coverage+value.precision):value?0:null;

function verifyCloseEvidence(evidence){
 const stage=evidence.validator_ref.split(':').at(-1);
 if(stage!=='freeze')return verifyEvidence(evidence);
 try{
  if(fileSha(resolve(evidence.artifact_ref))!==evidence.artifact_digest)return{ok:false};
  const freeze=JSON.parse(readFileSync(evidence.artifact_ref)),{freeze_sha256,...material}=freeze;
  const manifest=JSON.parse(readFileSync('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round10-preserved/runtime-manifest.json'));
  if(freeze.status!=='frozen'||sha(material)!==freeze_sha256||manifest.source_freeze_sha256!==fileSha(evidence.artifact_ref))return{ok:false};
  for(const item of manifest.files)if(fileSha(item.preserved_path)!==item.sha256)return{ok:false};
  return{ok:true,binding:evidence};
 }catch{return{ok:false};}
}

function collect(){
 const freeze=read('freeze-round10.json'),{freeze_sha256,...freezeMaterial}=freeze,matrix=read('development-matrix-v10.json'),analysis=read('round10-analysis.json');
 if(freeze.status!=='frozen'||sha(freezeMaterial)!==freeze_sha256)throw Error('round10.freeze-material');
 const rows=[],unstarted=[];
 for(const cell of matrix.cells){
  const dir=resolve(out,cell.cell_id),resultPath=resolve(dir,'result.json'),completedPath=resolve(dir,'completed.json'),scorePath=resolve(dir,'native-score.json');
  if(!existsSync(resultPath)){unstarted.push(cell.cell_id);continue;}
  if(!existsSync(completedPath))throw Error('round10.unverified-attempt:'+cell.cell_id);
  const result=JSON.parse(readFileSync(resultPath)),completed=JSON.parse(readFileSync(completedPath));
  if(fileSha(resultPath)!==completed.result_sha256||result.status!==completed.status||completed.benchmark_cleared!==false)throw Error('round10.result-integrity:'+cell.cell_id);
  const models=result.receipts.filter(receipt=>receipt.kind==='model'&&receipt.dispatched),known=models.filter(receipt=>Number.isSafeInteger(receipt.input_tokens)&&Number.isSafeInteger(receipt.output_tokens));
  const delivered=new Map(bindDelivery({captures:result.captures,receipts:result.receipts}).read_observations.map(item=>[item.id,item]));
  const prompt=JSON.parse(result.captures[0].prompt),taskMessage=prompt.messages.find(message=>message.role==='user')?.content??'';
  const modelRequests=new Set(models.map(receipt=>receipt.request_sha256)),generations=new Set();
  let falseStateFacts=0,unmatchedPresentations=0,generationMismatches=0,repeatedPresentations=0,stateTokens=0;
  for(const presentation of result.task_state_presentations??[]){
   stateTokens+=presentation.measured_tokens;
   if(!modelRequests.has(presentation.request_sha256))unmatchedPresentations++;
   if(!Number.isSafeInteger(presentation.generation)||presentation.generation<1||!result.captures.some(c=>c.step===presentation.step&&c.generation===presentation.generation))generationMismatches++;
   if(presentation.objective?.sha256!==digest(taskMessage))falseStateFacts++;
   if(generations.has(presentation.generation))repeatedPresentations++; else generations.add(presentation.generation);
   for(const evidence of presentation.evidence??[]){const source=delivered.get(evidence.read_id);if(!source||source.path!==evidence.path||source.start_line!==evidence.start_line||source.end_line!==evidence.end_line||source.source_sha256!==evidence.source_sha256)falseStateFacts++;}
  }
  const score=existsSync(scorePath)?JSON.parse(readFileSync(scorePath)):null,final=score?.native?.final??null;
  if((result.status==='final_context_selected')!==Boolean(final))throw Error('round10.native-score-status:'+cell.cell_id);
  const falseSourceCredit=(result.selection?.final_read_ids??[]).filter(id=>!delivered.has(id)).length;
  const row={cell_id:cell.cell_id,instance_id:cell.instance_id,state_arm:cell.state_arm,status:result.status,error:result.error,result_sha256:completed.result_sha256,
   native_score_present:Boolean(final),span_f1:f1(final?.span),file_f1:f1(final?.file),model_calls:models.length,known_model_tokens:known.reduce((sum,r)=>sum+r.input_tokens+r.output_tokens,0),unknown_usage_calls:models.length-known.length,
   recycles:result.recycling.recycles,task_state_presentations:result.task_state_presentations?.length??0,unique_state_generations:generations.size,repeated_state_presentations:repeatedPresentations,state_tokens:stateTokens,
   maximum_presented_state_tokens:Math.max(0,...(result.task_state_presentations??[]).map(x=>x.measured_tokens)),maximum_state_measurements_per_render:Math.max(0,...(result.task_state_presentations??[]).map(x=>x.fit?.tokenizer_calls??0)),
   false_state_facts:falseStateFacts,false_source_credit:falseSourceCredit,unmatched_presentations:unmatchedPresentations,generation_mismatches:generationMismatches,output_cap_corrections:Number(result.output_cap_corrections??0),terminal_repository_effects:result.events.filter(event=>event.tool==='submit_context_selection').length};
  if(cell.state_arm==='control'&&row.task_state_presentations!==0)throw Error('round10.control-state-exposure:'+cell.cell_id);
  if(cell.state_arm==='state'&&(row.task_state_presentations!==row.recycles||row.unique_state_generations!==row.recycles||row.repeated_state_presentations!==0))throw Error('round10.one-shot-invariant:'+cell.cell_id);
  rows.push(row);
 }
 if(rows.length!==13||unstarted.length!==3)throw Error('round10.stopping-counts');
 const failure=rows.find(row=>row.cell_id==='r10-07-control-8k');
 if(failure?.status!=='run_error'||failure.error!=='glm.deadline-exceeded'||failure.unknown_usage_calls!==1)throw Error('round10.shared-failure-evidence');
 const pairs=matrix.tasks.map(task=>{const control=rows.find(r=>r.instance_id===task.instance_id&&r.state_arm==='control'),state=rows.find(r=>r.instance_id===task.instance_id&&r.state_arm==='state');return{instance_id:task.instance_id,control_cell:control?.cell_id??null,state_cell:state?.cell_id??null,control_valid:control?.native_score_present??false,state_valid:state?.native_score_present??false,control_span_f1:control?.span_f1??null,state_span_f1:state?.span_f1??null,span_difference:control?.span_f1!=null&&state?.span_f1!=null?state.span_f1-control.span_f1:null,scheduled_span_difference:(state?.span_f1??0)-(control?.span_f1??0)};});
 const complete=pairs.filter(pair=>pair.span_difference!==null),control=rows.filter(row=>row.state_arm==='control'),state=rows.filter(row=>row.state_arm==='state'),mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
 const report={schema_version:'are.contextbench-round10-stopping-review/v1',status:'closed-under-shared-provider-stopping-rule',freeze_ref:'freeze-round10.json',freeze_material_sha256:freeze.freeze_sha256,
  scheduled_cells:16,attempted_cells:rows.length,unstarted_cells:unstarted,native_scored_cells:rows.filter(r=>r.native_score_present).length,complete_pairs:complete.length,status_counts:Object.fromEntries([...new Set(rows.map(r=>r.status))].sort().map(s=>[s,rows.filter(r=>r.status===s).length])),
  valid_completions:{control:control.filter(r=>r.native_score_present).length,state:state.filter(r=>r.native_score_present).length,difference:state.filter(r=>r.native_score_present).length-control.filter(r=>r.native_score_present).length},
  span_f1:{descriptive_complete_pair_mean_gain:mean(complete.map(p=>p.span_difference)),minimum_required:0.05,decision_eligible:false},
  model_tokens:{known_total:rows.reduce((s,r)=>s+r.known_model_tokens,0),control_known:control.reduce((s,r)=>s+r.known_model_tokens,0),state_known:state.reduce((s,r)=>s+r.known_model_tokens,0),descriptive_known_difference:state.reduce((s,r)=>s+r.known_model_tokens,0)-control.reduce((s,r)=>s+r.known_model_tokens,0),unknown_usage_calls:rows.reduce((s,r)=>s+r.unknown_usage_calls,0),decision_eligible:false},
  state_exposure:{presentations:state.reduce((s,r)=>s+r.task_state_presentations,0),unique_generations:state.reduce((s,r)=>s+r.unique_state_generations,0),repeated_within_generation:state.reduce((s,r)=>s+r.repeated_state_presentations,0),presented_tokens:state.reduce((s,r)=>s+r.state_tokens,0),maximum_presented_tokens:Math.max(...state.map(r=>r.maximum_presented_state_tokens)),maximum_measurements_per_render:Math.max(...state.map(r=>r.maximum_state_measurements_per_render)),exactly_once_per_recycled_generation:true},
  integrity:{false_state_facts:rows.reduce((s,r)=>s+r.false_state_facts,0),false_source_credit:rows.reduce((s,r)=>s+r.false_source_credit,0),unmatched_presentations:rows.reduce((s,r)=>s+r.unmatched_presentations,0),generation_mismatches:rows.reduce((s,r)=>s+r.generation_mismatches,0),terminal_repository_effects:rows.reduce((s,r)=>s+r.terminal_repository_effects,0)},
  h19_review:{implementation_invariant_met:true,quality_signal:'promising-incomplete',acceptance_decision:'inconclusive',reasons:['Only 3 of 8 scheduled pairs have native scores in both arms.','The shared provider deadline left one dispatched request with unknown usage and paused three cells.','Complete-case +0.2288 span F1 and 57,576 fewer known state-arm tokens are descriptive because exposure is incomplete.','Aggregate valid scored completions are tied 4-4, but one task improves and another degrades.']},
  diagnosis:'One-shot presentation removed all same-generation duplicates: 27 presentations matched 27 recycle generations. Three complete pairs favor state by 0.2288 mean span F1, and attempted state arms used 57,576 fewer known tokens, but the matrix stopped after a GLM provider deadline and cannot test the frozen criteria.',
  retention_rule:'Retain all thirteen attempts, the provider failure, its unknown-usage receipt, and three unstarted identities. Do not rerun or relabel round ten. Test the unchanged one-shot mechanism in a separately frozen replication before adding delta semantics.',
  rows,pairs,analysis_ref:'round10-analysis.json',preserved_runtime_ref:'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round10-preserved/runtime-manifest.json',benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round10.md#open-questions'};
 if(report.complete_pairs!==analysis.complete_pairs||report.model_tokens.known_total!==analysis.known_model_tokens||report.span_f1.descriptive_complete_pair_mean_gain!==analysis.descriptive_complete_pair_mean_gain)throw Error('round10.analysis-cross-check');
 return report;
}

function successors(selected,decision){
 const common={scope:'GLM-5.3-flash exposed 8K ContextBench development tasks; one-shot receipt-bound reasoning state after actual recycling, evaluated under cumulative model input plus output tokens.',metrics:selected.metrics,provenance_refs:[decision.record_id,'round10-stopping-review.json','round10-selected-hypothesis-review.json','round10-closeout.json','round11-continuity.json']};
 const replication=createResearchHypothesis({...common,hypothesis_key:'CB117-H21-R11',statement:'One receipt-bound state presentation per recycled generation improves useful native ContextBench evidence selection and reduces cumulative model tokens for GLM-5.3-flash at 8K when evaluated over a complete frozen matrix.',mechanism:selected.mechanism+' Use a common five-minute per-model deadline in both arms so a two-minute provider stall does not censor the paired experiment; elapsed time is outside the selected optimization cost.',falsifier:'The complete matrix misses +0.05 paired macro span F1, degrades aggregate file F1 or valid completion, fails to stay below 396,085 treatment model tokens, duplicates or omits a recycled-generation presentation, or violates source, usage, state, or effect integrity.',parent_hypothesis_ref:selected.record_id,experiment_template:{...selected.experiment_template,research_question:'Does the promising one-shot boundary-state signal replicate over a complete frozen GLM-5.3-flash 8K matrix after a common provider-deadline repair?',baseline_ref:'round11:no-state-control',treatment_ref:'round11:one-shot-boundary-state',dataset_refs:['same frozen exposed eight-task cohort; round-ten attempts remain historical'],required_repetitions:1,success_criteria:{...selected.experiment_template.success_criteria,complete_pairs:8,unknown_model_usage:0,common_model_timeout_ms:300000},stop_conditions:['No within-round task, source, prompt, cap, threshold, or state mechanism change.','The five-minute provider deadline is common to both arms and changes no model-token accounting.','No round-ten attempt is rerun or relabeled; round eleven is a separately frozen replication.','Any shared provider or instrument failure pauses unstarted cells and retains every outcome.']}});
 const delta=createResearchHypothesis({...common,hypothesis_key:'CB117-H20-R11',statement:'A receipt-bound delta containing only facts added since the prior presentation preserves GLM-5.3-flash continuity at 8K with fewer model tokens than one-shot full state.',mechanism:'Track previously presented fact identities and project only new evidence and outcomes at each recycle boundary while retaining objective identity and explicit recovery handles.',falsifier:'A required observed fact becomes unavailable, any delta fact lacks provenance, or native quality or valid completion degrades.',parent_hypothesis_ref:selected.record_id,experiment_template:{research_question:'Does delta boundary state outperform one-shot full boundary state?',baseline_ref:'candidate:one-shot-full-state',treatment_ref:'candidate:receipt-bound-delta-state',dataset_refs:['round-ten retained traces'],required_repetitions:1,success_criteria:{model_token_difference:'negative',native_non_degradation:true,false_state_facts:0},stop_conditions:['Do not select before H21 resolves the incomplete one-shot signal.']}});
 const semanticNull=createResearchHypothesis({...common,hypothesis_key:'CB117-H0-R11',statement:'Receipt-bound process state does not reliably improve GLM-5.3-flash native outcomes at 8K because semantic evidence interpretation is the limiting factor.',mechanism:'Deterministic state preserves observed process facts, while remaining errors require semantic judgment that state replay cannot supply.',falsifier:'H21 completes the frozen matrix and meets every native, validity, token, exposure, and integrity criterion.',parent_hypothesis_ref:selected.record_id,experiment_template:{research_question:'Does one-shot boundary state fail to produce reliable native benefit?',baseline_ref:'round11:no-state-control',treatment_ref:'round11:one-shot-boundary-state',dataset_refs:['same frozen exposed eight-task cohort'],required_repetitions:1,success_criteria:{null_prediction:'no criterion-complete positive benefit'},stop_conditions:['Arms differ beyond boundary-state presentation.']}});
 for(const record of [replication,delta,semanticNull])if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('round11.hypothesis-invalid');
 return{records:[replication,delta,semanticNull],selection:{selected:replication.record_id,alternatives:[delta.record_id,semanticNull.record_id],reason:'Round ten verified the one-shot implementation and produced a large favorable but incomplete native signal before a shared provider deadline. Replicate that mechanism without semantic changes before selecting delta state or the semantic null.'},authority_effect:'none',open_questions_ref:'PLAN-round11.md#open-questions'};
}

export function close(){
 const report=collect();write('round10-stopping-review.json',report);
 const hypotheses=read('hypotheses-round10.json'),selected=hypotheses.records.find(record=>record.record_id===hypotheses.selection.selected),experiment=read('experiment-round10.json');
 const observation=createHypothesisObservation({hypothesis_ref:selected.record_id,source_result_ref:resolve(root+'round10-stopping-review.json'),source_result_digest:fileSha(root+'round10-stopping-review.json'),observation_kind:'inconclusive',phase:'experiment',claim:'One-shot state matched every one of 27 recycle generations without duplicates. Three complete pairs showed +0.2288 mean span F1 and attempted state arms used 57,576 fewer known tokens, but a shared GLM deadline left only 13 attempts, 3 complete pairs, 3 unstarted cells, and one unknown-usage call.',evaluator_id:'contextbench.round10.stopping-review',evidence_refs:['round10-stopping-review.json','round10-analysis.json',resolve(out,'r10-07-control-8k/result.json')],observed_markers:['13/16 attempted','3/8 complete pairs','27 presentations for 27 recycled generations','0 duplicate presentations','complete-pair span gain +0.2288','state known-token difference -57576','1 provider deadline','1 unknown-usage call'],limitations:['Incomplete exposed 8K development matrix.','Complete-case quality and unequal attempted-arm token totals are descriptive only.','One task gained a valid score while another lost one; aggregate valid scored completions tied 4-4.','Native evidence selection does not establish repair correctness or semantic retention.']});
 const decision=createLearningDecision({hypothesis_ref:selected.record_id,observation_refs:[observation.record_id],experiment_ref:experiment.record_id,disposition:'inconclusive',reason_codes:['experiment.shared-provider-deadline','experiment.incomplete-matrix','usage.unknown-failed-request','signal.promising-not-decision-eligible'],supporting_count:0,counterevidence_count:0,experiment_support_count:0,next_action:'Preserve the exact one-shot state mechanism, extend the common per-model deadline from two to five minutes, and run a separately versioned frozen replication over all eight exposed pairs. Do not add delta semantics until the promising incomplete signal is resolved.'});
 for(const record of [observation,decision])if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('round10.review-record-invalid');
 write('round10-selected-hypothesis-review.json',{records:[selected,experiment,observation,decision],continuity_ref:'round10-continuity.json',benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round10.md#open-questions'});
 const next=successors(selected,decision);write('hypotheses-round11.json',next);const selectedNext=next.records.find(record=>record.record_id===next.selection.selected);
 write('round10-closeout.json',{schema_version:'are.contextbench-round-closeout/v1',round:'contextbench-development-round10',status:'closed-under-shared-provider-stopping-rule',freeze_ref:'freeze-round10.json',preserved_runtime_ref:report.preserved_runtime_ref,analysis_refs:['round10-analysis.json','round10-stopping-review.json'],scheduled_cells:16,attempted_cells:13,unstarted_cells:report.unstarted_cells,native_scored_cells:report.native_scored_cells,complete_pairs:report.complete_pairs,known_model_tokens:report.model_tokens.known_total,unknown_usage_calls:report.model_tokens.unknown_usage_calls,task_state_presentations:report.state_exposure.presentations,repeated_state_presentations:0,h19_decision_ref:decision.record_id,successor_hypotheses_ref:'hypotheses-round11.json',selected_successor_ref:selectedNext.record_id,remaining_goal:'Clear fixed ContextBench acceptance and finish GLM small-window useful-state qualification under cumulative model input plus output tokens.',benchmark_cleared:false,claim_ceiling:'Incomplete exposed GLM-5.3-flash 8K development evidence. It verifies one-shot boundary-state delivery and motivates replication; it does not establish the frozen target, correctness, retention, transfer, confirmation, or ContextBench clearance.',authority_effect:'none',open_questions_ref:'PLAN-round10.md#open-questions'});
 const built=build(),frozen=read('work-state-frozen-v10.json'),events=[...frozen.events,{event_id:'r10-run-start',task_id:'contextbench.round10.run',action:'start'},{event_id:'r10-run-block',task_id:'contextbench.round10.run',action:'block',reason:'GLM deadline on r10-07-control-8k; 13 attempts retained with one unknown-usage call and 3 cells unstarted.'}];
 const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyCloseEvidence,verify_registration:verifyPredecessor});write('work-state-stopped-v10.json',state);
 return{attempted:13,unstarted:3,complete_pairs:report.complete_pairs,span_gain:report.span_f1.descriptive_complete_pair_mean_gain,known_model_tokens:report.model_tokens.known_total,next:selectedNext.record_id,benchmark_cleared:false};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(close()));
