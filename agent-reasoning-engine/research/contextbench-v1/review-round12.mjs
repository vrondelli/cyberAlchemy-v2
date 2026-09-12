// Close and learn from the complete frozen round-twelve development matrix. No provider calls.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createHypothesisObservation,createLearningDecision,createResearchHypothesis,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {bindDelivery} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {build,verifyEvidence,verifyPredecessor} from './bind-round12.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const output='/home/vrondelli/.cache/are/contextbench-round12-live';
const read=name=>JSON.parse(readFileSync(root+name));
const fileSha=path=>sha(readFileSync(path));
const digest=value=>createHash('sha256').update(value).digest('hex');
const write=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',path=root+name;if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round12.artifact-drift:'+name);}else writeFileSync(path,bytes,{flag:'wx'});};
const f1=value=>value&&(value.coverage+value.precision)?2*value.coverage*value.precision/(value.coverage+value.precision):value?0:null;

function verifyFrozenSources(){
 const freeze=read('freeze-round12.json'),{freeze_sha256,...material}=freeze;
 if(freeze.status!=='frozen'||sha(material)!==freeze_sha256)throw Error('round12.freeze-material');
 const manifest=JSON.parse(readFileSync('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round12-preserved/runtime-manifest.json'));
 if(manifest.source_freeze_sha256!==fileSha(root+'freeze-round12.json'))throw Error('round12.preserved-freeze-binding');
 const preserved=new Map(manifest.files.map(item=>[item.original_path,item]));
 for(const source of freeze.sources){
  let actual=null;
  try{actual=fileSha(source.path);}catch{}
  if(actual===source.sha256)continue;
  const replacement=preserved.get(resolve(source.path));
  if(!replacement||fileSha(replacement.preserved_path)!==source.sha256)throw Error('round12.frozen-source-unavailable:'+source.path);
 }
 return freeze;
}

function outcome(){
 const freeze=verifyFrozenSources(),matrix=read('development-matrix-v12.json'),analysis=read('round12-analysis.json');
 const sequence=JSON.parse(readFileSync(resolve(output,'sequence/completed.json')));
 if(sequence.scheduled_cells!==16||sequence.all_scheduled_outcomes_accounted!==true)throw Error('round12.sequence-accounting');
 const rows=[];
 for(const cell of matrix.cells){
  const dir=resolve(output,cell.cell_id),resultPath=resolve(dir,'result.json'),completePath=resolve(dir,'completed.json'),scorePath=resolve(dir,'native-score.json');
  if(!existsSync(resultPath)||!existsSync(completePath))throw Error('round12.incomplete:'+cell.cell_id);
  const result=JSON.parse(readFileSync(resultPath)),complete=JSON.parse(readFileSync(completePath));
  if(fileSha(resultPath)!==complete.result_sha256||complete.status!==result.status||complete.benchmark_cleared!==false)throw Error('round12.result-integrity:'+cell.cell_id);
  const models=result.receipts.filter(receipt=>receipt.kind==='model'&&receipt.dispatched),known=models.filter(receipt=>Number.isSafeInteger(receipt.input_tokens)&&Number.isSafeInteger(receipt.output_tokens));
  const modelTokens=known.reduce((sum,receipt)=>sum+receipt.input_tokens+receipt.output_tokens,0);
  if(modelTokens>cell.limits.total_tokens)throw Error('round12.token-cap:'+cell.cell_id);
  const delivery=bindDelivery({captures:result.captures,receipts:result.receipts}),delivered=new Map(delivery.read_observations.map(item=>[item.id,item]));
  const falseCredit=(result.selection?.final_read_ids??[]).filter(id=>!delivered.has(id));
  const score=existsSync(scorePath)?JSON.parse(readFileSync(scorePath)):null,final=score?.native?.final??null;
  if((result.status==='final_context_selected')!==Boolean(final))throw Error('round12.native-score-status:'+cell.cell_id);
  const firstPrompt=JSON.parse(result.captures[0].prompt),taskMessage=firstPrompt.messages.find(message=>message.role==='user')?.content??'';
  let falseStateFacts=0,unmatchedPresentations=0,generationMismatches=0,repeatedPresentations=0,repeatedStateTokens=0,boundaryStateTokens=0;
  const seenGenerations=new Set(),modelRequests=new Set(models.map(receipt=>receipt.request_sha256));
  for(const presentation of result.task_state_presentations??[]){
   if(!modelRequests.has(presentation.request_sha256))unmatchedPresentations++;
   if(!Number.isSafeInteger(presentation.generation)||presentation.generation<1||!result.captures.some(capture=>capture.step===presentation.step&&capture.generation===presentation.generation))generationMismatches++;
   if(presentation.objective?.sha256!==digest(taskMessage))falseStateFacts++;
   for(const evidence of presentation.evidence??[]){
    const source=delivered.get(evidence.read_id);
    if(!source||source.path!==evidence.path||source.start_line!==evidence.start_line||source.end_line!==evidence.end_line||source.source_sha256!==evidence.source_sha256)falseStateFacts++;
   }
   for(const projected of presentation.outcomes??[]){
    const expectedOk=projected.outcome!=='rejected';
    const matched=result.events.some(event=>event.step===projected.step&&event.tool===projected.tool&&event.output?.ok===expectedOk&&
     (projected.outcome!=='recovered'||event.output?.output?.read_id===projected.read_id)&&
     (projected.outcome!=='applied'||(event.output?.output?.base_commit===projected.base_commit&&JSON.stringify([...new Set(event.output?.output?.changed_paths??[])].sort())===JSON.stringify([...new Set(projected.changed_paths??[])].sort()))));
    if(!matched)falseStateFacts++;
   }
   if(seenGenerations.has(presentation.generation)){repeatedPresentations++;repeatedStateTokens+=presentation.measured_tokens;}else{seenGenerations.add(presentation.generation);boundaryStateTokens+=presentation.measured_tokens;}
  }
  if(cell.state_arm==='control'&&(result.task_state_presentations?.length??0)!==0)throw Error('round12.control-state-exposure:'+cell.cell_id);
  const spanF1=f1(final?.span),fileF1=f1(final?.file);
  rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,state_arm:cell.state_arm,status:result.status,error:result.error,
   result_sha256:complete.result_sha256,native_score_sha256:score?fileSha(scorePath):null,native_score_present:Boolean(final),span_f1:spanF1,file_f1:fileF1,
   model_calls:models.length,model_tokens:modelTokens,unknown_usage_calls:models.length-known.length,recycles:result.recycling.recycles,
   output_cap_corrections:Number(result.output_cap_corrections??0),task_state_presentations:result.task_state_presentations?.length??0,
   unique_state_generations:seenGenerations.size,repeated_state_presentations:repeatedPresentations,boundary_state_tokens:boundaryStateTokens,repeated_state_tokens:repeatedStateTokens,
   maximum_presented_state_tokens:Math.max(0,...(result.task_state_presentations??[]).map(item=>item.measured_tokens)),
   maximum_state_measurements_per_render:Math.max(0,...(result.task_state_presentations??[]).map(item=>item.fit?.tokenizer_calls??0)),
   false_state_facts:falseStateFacts,false_source_credit:falseCredit.length,unmatched_presentations:unmatchedPresentations,generation_mismatches:generationMismatches,
   terminal_repository_effects:result.events.filter(event=>event.tool==='submit_context_selection').length});
 }
 const pairs=matrix.tasks.map(task=>{const control=rows.find(row=>row.instance_id===task.instance_id&&row.state_arm==='control'),state=rows.find(row=>row.instance_id===task.instance_id&&row.state_arm==='state');return{
  instance_id:task.instance_id,control_cell:control.cell_id,state_cell:state.cell_id,control_valid:control.native_score_present,state_valid:state.native_score_present,
  control_span_f1:control.span_f1,state_span_f1:state.span_f1,span_difference:control.span_f1!==null&&state.span_f1!==null?state.span_f1-control.span_f1:null,
  scheduled_span_difference:(state.span_f1??0)-(control.span_f1??0),control_file_f1:control.file_f1,state_file_f1:state.file_f1,
  scheduled_file_difference:(state.file_f1??0)-(control.file_f1??0),model_token_difference:state.model_tokens-control.model_tokens,recycle_difference:state.recycles-control.recycles};});
 const control=rows.filter(row=>row.state_arm==='control'),state=rows.filter(row=>row.state_arm==='state'),complete=pairs.filter(pair=>pair.span_difference!==null);
 const mean=(values)=>values.reduce((sum,value)=>sum+value,0)/values.length;
 const controlTokens=control.reduce((sum,row)=>sum+row.model_tokens,0),stateTokens=state.reduce((sum,row)=>sum+row.model_tokens,0);
 const report={schema_version:'are.contextbench-round12-outcome-review/v1',status:'complete-development-matrix',freeze_ref:'freeze-round12.json',freeze_artifact_sha256:fileSha(root+'freeze-round12.json'),freeze_material_sha256:freeze.freeze_sha256,
  run_completion_ref:resolve(output,'sequence/completed.json'),analysis_ref:'round12-analysis.json',all_scheduled_outcomes_accounted:true,scheduled_cells:16,native_scored_cells:rows.filter(row=>row.native_score_present).length,complete_pairs:complete.length,
  status_counts:Object.fromEntries([...new Set(rows.map(row=>row.status))].sort().map(status=>[status,rows.filter(row=>row.status===status).length])),
  valid_completions:{control:control.filter(row=>row.native_score_present).length,state:state.filter(row=>row.native_score_present).length,difference:state.filter(row=>row.native_score_present).length-control.filter(row=>row.native_score_present).length},
  span_f1:{complete_pair_mean_gain:mean(complete.map(pair=>pair.span_difference)),scheduled_zero_filled_mean_gain:mean(pairs.map(pair=>pair.scheduled_span_difference)),minimum_required:0.05},
  file_f1:{scheduled_zero_filled_mean_gain:mean(pairs.map(pair=>pair.scheduled_file_difference)),non_degradation:mean(pairs.map(pair=>pair.scheduled_file_difference))>=0},
  model_tokens:{total:controlTokens+stateTokens,control:controlTokens,state:stateTokens,difference:stateTokens-controlTokens,unknown_usage_calls:rows.reduce((sum,row)=>sum+row.unknown_usage_calls,0),per_cell_cap_met:rows.every(row=>row.model_tokens<=96000)},
  recycling:{control:control.reduce((sum,row)=>sum+row.recycles,0),state:state.reduce((sum,row)=>sum+row.recycles,0),difference:state.reduce((sum,row)=>sum+row.recycles,0)-control.reduce((sum,row)=>sum+row.recycles,0)},
  state_exposure:{presentations:state.reduce((sum,row)=>sum+row.task_state_presentations,0),unique_generation_boundaries:state.reduce((sum,row)=>sum+row.unique_state_generations,0),repeated_within_generation:state.reduce((sum,row)=>sum+row.repeated_state_presentations,0),boundary_state_tokens:state.reduce((sum,row)=>sum+row.boundary_state_tokens,0),repeated_state_tokens:state.reduce((sum,row)=>sum+row.repeated_state_tokens,0),maximum_presented_tokens:Math.max(...state.map(row=>row.maximum_presented_state_tokens)),maximum_measurements_per_render:Math.max(...state.map(row=>row.maximum_state_measurements_per_render))},
  integrity:{output_cap_corrections:rows.reduce((sum,row)=>sum+row.output_cap_corrections,0),false_state_facts:rows.reduce((sum,row)=>sum+row.false_state_facts,0),false_source_credit:rows.reduce((sum,row)=>sum+row.false_source_credit,0),unmatched_presentations:rows.reduce((sum,row)=>sum+row.unmatched_presentations,0),generation_mismatches:rows.reduce((sum,row)=>sum+row.generation_mismatches,0),terminal_repository_effects:rows.reduce((sum,row)=>sum+row.terminal_repository_effects,0)},
  h22_criteria:{complete_pairs_met:complete.length===8,paired_macro_span_f1_gain_met:mean(complete.map(pair=>pair.span_difference))>=0.05,file_f1_non_degradation:mean(pairs.map(pair=>pair.scheduled_file_difference))>=0,valid_completion_non_degradation:state.filter(row=>row.native_score_present).length>=control.filter(row=>row.native_score_present).length,aggregate_state_token_target_met:stateTokens<396085,one_shot_boundary_exposure_met:state.every(row=>row.task_state_presentations===row.recycles&&row.unique_state_generations===row.recycles&&row.repeated_state_presentations===0),verified_treatment_presentations_minimum:state.some(row=>row.task_state_presentations>0),state_cap_met:state.every(row=>row.maximum_presented_state_tokens<=1024),measurement_cap_met:state.every(row=>row.maximum_state_measurements_per_render<=4),correction_bound_met:rows.every(row=>row.output_cap_corrections<=1),integrity_met:rows.every(row=>row.false_state_facts===0&&row.false_source_credit===0&&row.unmatched_presentations===0&&row.generation_mismatches===0&&row.terminal_repository_effects===0&&row.unknown_usage_calls===0),passed:false},
  diagnosis:`The repaired instrument completed all 16 cells and one-shot exposure was exact: ${state.reduce((sum,row)=>sum+row.task_state_presentations,0)} presentations for ${state.reduce((sum,row)=>sum+row.recycles,0)} recycled treatment generations, with no duplicates. Only ${complete.length}/8 pairs were natively scoreable. Their mean state-minus-control span F1 was ${mean(complete.map(pair=>pair.span_difference))}, below +0.05. State used ${stateTokens-controlTokens} more model tokens and recycled ${state.reduce((sum,row)=>sum+row.recycles,0)-control.reduce((sum,row)=>sum+row.recycles,0)} more times. Effects were heterogeneous: large gains on tasks 1 and 2, a small gain on 4, a tie on 5, and losses on 6 and 8.`,
  rows,pairs,acceptance_review:{development_target_met:false,full_scope_met:false,all_windows_met:false,confirmation_met:false,benchmark_cleared:false},
  claim_ceiling:'Complete exposed eight-task GLM-5.3-flash 8K development evidence. It validates the repaired instrument and exact one-shot delivery, but rejects H22 at the fixed native target. It shows task-dependent benefit and harm; it does not establish semantic retention, repair correctness, transfer, confirmation, or ContextBench clearance.',benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round12.md#open-questions'};
 if(report.span_f1.complete_pair_mean_gain!==analysis.descriptive_complete_pair_mean_gain||report.model_tokens.total!==analysis.known_model_tokens)throw Error('round12.analysis-cross-check');
 return report;
}

function successors({selected,decision}){
 const continuity_contract={enduring_objective:'Improve reusable ARE reasoning, useful continuity, recovery, correctness and completed outcomes within cumulative model input plus output tokens.',initial_objective:'Finish GLM-5.3-flash qualification, beginning with the 8K small context window and useful reasoning-state recovery under pressure.',current_milestone:'Clear the fixed ContextBench contract through frozen evidence-led rounds while keeping its diagnostic distinct from semantic retention and repair correctness.',research_method:'objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor'};
 const common={scope:'GLM-5.3-flash exposed 8K ContextBench development tasks; useful reasoning-state continuity after actual recycling, with the fixed acceptance target and cumulative model input plus output tokens.',metrics:selected.metrics,continuity_contract,provenance_refs:[decision.record_id,'round12-outcome-review.json','round12-selected-hypothesis-review.json','round12-closeout.json','round12-continuity.json','round13-continuity.json']};
 const h23=createResearchHypothesis({...common,hypothesis_key:'CB117-H23-R13',statement:'At GLM-5.3-flash 8K recycle boundaries, projecting durable observed evidence without replaying exploratory tool-outcome chronology improves ContextBench continuity because it preserves source grounding while reducing anchoring on failed or superseded search paths.',mechanism:'Keep the objective digest, exact receipt-bound source evidence, recovery handles, truncation facts and limitations. Omit the ordered tool-outcome history from the model-facing projection while retaining it in the deterministic ledger for validation and recovery.',falsifier:'Evidence-only state loses required recovery information, creates any unsupported fact, fails integrity or completion gates, uses at least as many aggregate model tokens as Round 12 state, or misses the frozen +0.05 paired span-F1 target without file/validity degradation.',parent_hypothesis_ref:selected.record_id,experiment_template:{research_question:'Does separating durable evidence from exploratory process history remove the task-dependent harm observed with full one-shot state?',baseline_ref:'round13:no-state-control',treatment_ref:'round13:one-shot-evidence-only-state',dataset_refs:['same frozen exposed eight-task cohort; Round 12 remains historical counterevidence'],required_repetitions:1,success_criteria:{complete_pairs:8,macro_span_f1_gain_minimum:0.05,file_f1_non_degradation:true,valid_completion_non_degradation:true,aggregate_state_model_tokens_below:352655,total_model_token_cap:96000,unknown_model_usage:0,false_state_facts:0,maximum_presentations_per_generation:1},stop_conditions:['Any within-round task, source, prompt, cap, threshold, or non-state mechanism change.','Any missing or duplicate recycle-boundary presentation.','Shared provider or instrument failure pauses unstarted cells and retains every outcome.']}});
 const h20=createResearchHypothesis({...common,hypothesis_key:'CB117-H20-R13',statement:'A receipt-bound delta containing only newly observed facts is sufficient for useful GLM-5.3-flash continuity at 8K with fewer model tokens.',mechanism:'Project only facts added since the prior boundary while retaining objective identity and exact recovery handles.',falsifier:'Delta state omits evidence needed after recycling, creates unsupported state, or fails native quality, completion, integrity, or model-token criteria.',experiment_template:{research_question:'Does delta-only state outperform full one-shot state?',baseline_ref:'candidate:full-one-shot-state',treatment_ref:'candidate:receipt-bound-delta-state',dataset_refs:['Round 12 traces'],required_repetitions:1,success_criteria:{model_token_difference:'negative',native_non_degradation:true,false_state_facts:0},stop_conditions:['A required historical fact becomes unavailable.','A delta contains an unobserved fact.']}});
 const h0=createResearchHypothesis({...common,hypothesis_key:'CB117-H0-R13',statement:'Deterministic process or evidence state does not reliably improve GLM-5.3-flash ContextBench outcomes at 8K because semantic evidence interpretation is the limiting factor.',mechanism:'The model can recover observed evidence after recycling, but replaying deterministic facts cannot add the semantic judgment needed to select correct spans.',falsifier:'A frozen state treatment clears the native, validity, integrity, and cumulative-token criteria.',experiment_template:{research_question:'Does state provide no criterion-complete benefit over no-state control?',baseline_ref:'round13:no-state-control',treatment_ref:'round13:evidence-only-state',dataset_refs:['same frozen exposed eight-task cohort'],required_repetitions:1,success_criteria:{null_prediction:'no criterion-complete positive benefit'},stop_conditions:['Arms differ beyond state presentation.']}});
 for(const record of [h23,h20,h0])if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('round13.hypothesis-invalid');
 return{records:[h23,h20,h0],selection:{selected:h23.record_id,alternatives:[h20.record_id,h0.record_id],reason:'Round 12 disproved unconditional full-state benefit and exposed heterogeneous gains and harms. The next controlled question separates durable evidence from exploratory outcome chronology; delta compression and the semantic ceiling remain explicit alternatives.'},authority_effect:'none',open_questions_ref:'PLAN-round13.md#open-questions'};
}

export function verifyCloseEvidence(evidence){
 try{
  const stage=evidence.validator_ref.split(':').at(-1);
  if(stage==='freeze'){
   if(fileSha(resolve(evidence.artifact_ref))!==evidence.artifact_digest)return{ok:false};
   verifyFrozenSources();return{ok:true,binding:evidence};
  }
  if(['continuity','integrate','test','design','preflight'].includes(stage))return verifyEvidence(evidence);
  if(fileSha(resolve(evidence.artifact_ref))!==evidence.artifact_digest)return{ok:false};
  if(stage==='run'){const value=JSON.parse(readFileSync(evidence.artifact_ref));if(value.scheduled_cells!==16||value.all_scheduled_outcomes_accounted!==true)return{ok:false};}
  else if(stage==='score'){const value=JSON.parse(readFileSync(evidence.artifact_ref));if(value.scheduled_cells!==16||value.model_tokens.unknown_usage_calls!==0||value.integrity.false_state_facts!==0)return{ok:false};}
  else if(stage==='review'){const value=JSON.parse(readFileSync(evidence.artifact_ref));if(value.benchmark_cleared!==false||!value.selected_successor_ref)return{ok:false};}
  else return{ok:false};
  return{ok:true,binding:evidence};
 }catch{return{ok:false};}
}

export function review(){
 const report=outcome();write('round12-outcome-review.json',report);
 const hypotheses=read('hypotheses-round12.json'),selected=hypotheses.records.find(record=>record.record_id===hypotheses.selection.selected),experiment=read('experiment-round12.json');
 const observation=createHypothesisObservation({hypothesis_ref:selected.record_id,source_result_ref:resolve(root+'round12-outcome-review.json'),source_result_digest:fileSha(root+'round12-outcome-review.json'),observation_kind:'counterevidence',phase:'experiment',claim:`All 16 cells completed with exact one-shot exposure and known usage, but only ${report.complete_pairs}/8 pairs were scoreable and complete-pair mean state-minus-control span F1 was ${report.span_f1.complete_pair_mean_gain} versus the fixed +0.05 target. State used ${report.model_tokens.difference} more model tokens. Benefits on tasks 1, 2 and 4 coexisted with losses on tasks 6 and 8.`,evaluator_id:'contextbench.round12.review',evidence_refs:['round12-outcome-review.json','round12-analysis.json','analyze-round-repair-v1.json',resolve(output,'sequence/completed.json')],observed_markers:['16/16 outcomes accounted',`${report.native_scored_cells}/16 native scored`,`${report.complete_pairs} complete pairs`,`state span gain ${report.span_f1.complete_pair_mean_gain}`,`state model-token difference ${report.model_tokens.difference}`,`${report.state_exposure.presentations} exact one-shot presentations`,'0 unknown usage calls'],limitations:['Exposed eight-task 8K development cohort.','One repetition.','Two pairs lacked native scores.','No output-cap correction received live exposure.','Native evidence selection does not establish repair correctness or semantic retention.']});
 const decision=createLearningDecision({hypothesis_ref:selected.record_id,observation_refs:[observation.record_id],experiment_ref:experiment.record_id,disposition:'revise-hypothesis',counterevidence_count:1,reason_codes:['native.span-gain-target-missed','native.complete-pairs-missing','effect.heterogeneous-by-task','model-token-cost-increased'],next_action:'Retain the repaired instrument, exact fitting, one-shot delivery, frozen cohort and fixed criteria. Test whether model-facing durable evidence without exploratory tool-outcome chronology removes the observed task-dependent harm. Keep delta state and the semantic-ceiling null as competing hypotheses.'});
 for(const record of [observation,decision])if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('round12.review-record-invalid');
 write('round12-selected-hypothesis-review.json',{records:[selected,experiment,observation,decision],continuity_ref:'round12-continuity.json',benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round12.md#open-questions'});
 const next=successors({selected,decision});write('hypotheses-round13.json',next);
 const selectedNext=next.records.find(record=>record.record_id===next.selection.selected);
 const closeout={schema_version:'are.contextbench-round-closeout/v1',round:'contextbench-development-round12',status:'closed-complete-target-missed',freeze_ref:'freeze-round12.json',preserved_runtime_ref:'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round12-preserved/runtime-manifest.json',run_completion_ref:resolve(output,'sequence/completed.json'),analysis_refs:['round12-analysis.json','round12-outcome-review.json','analyze-round-repair-v1.json'],scheduled_cells:16,attempted_cells:16,native_scored_cells:report.native_scored_cells,complete_pairs:report.complete_pairs,total_model_tokens:report.model_tokens.total,unknown_usage_calls:report.model_tokens.unknown_usage_calls,task_state_presentations:report.state_exposure.presentations,repeated_state_presentations:report.state_exposure.repeated_within_generation,repeated_state_tokens:report.state_exposure.repeated_state_tokens,h22_decision_ref:decision.record_id,successor_hypotheses_ref:'hypotheses-round13.json',selected_successor_ref:selectedNext.record_id,remaining_goal:'Clear fixed ContextBench acceptance and finish GLM small-window useful-state qualification under cumulative model input plus output tokens.',benchmark_cleared:false,claim_ceiling:report.claim_ceiling,authority_effect:'none',open_questions_ref:'PLAN-round12.md#open-questions'};
 write('round12-closeout.json',closeout);
 const built=build(),frozen=read('work-state-frozen-v12.json'),evidence=(criterion,artifact)=>[{criterion_id:criterion,artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}];
 const events=[...frozen.events,{event_id:'r12-run-start',task_id:'contextbench.round12.run',action:'start'},{event_id:'r12-run-complete',task_id:'contextbench.round12.run',action:'complete',evidence:evidence('all-sixteen-attempts-accounted',resolve(output,'sequence/completed.json'))},{event_id:'r12-score-start',task_id:'contextbench.round12.score',action:'start'},{event_id:'r12-score-complete',task_id:'contextbench.round12.score',action:'complete',evidence:evidence('native-scores-token-and-generation-integrity',root+'round12-outcome-review.json')},{event_id:'r12-review-start',task_id:'contextbench.round12.review',action:'start'},{event_id:'r12-review-complete',task_id:'contextbench.round12.review',action:'complete',evidence:evidence('reviewed-h22-decision-and-method-bound-successor',root+'round12-closeout.json')}];
 const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyCloseEvidence,verify_registration:verifyPredecessor});
 if(state.tasks.some(task=>task.state!=='completed'))throw Error('round12.work-not-closed');write('work-state-closed-v12.json',state);
 return{attempted:16,native_scores:report.native_scored_cells,complete_pairs:report.complete_pairs,span_gain:report.span_f1.complete_pair_mean_gain,model_tokens:report.model_tokens.total,state_token_difference:report.model_tokens.difference,next:selectedNext.record_id,benchmark_cleared:false};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(review()));
