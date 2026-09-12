// Close and learn from the complete frozen round-nine development matrix. No provider calls.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createHypothesisObservation,createLearningDecision,createResearchHypothesis,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {bindDelivery} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {build,verifyEvidence,verifyPredecessor} from './bind-round9.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const output='/home/vrondelli/.cache/are/contextbench-round9-live';
const read=name=>JSON.parse(readFileSync(root+name));
const fileSha=path=>sha(readFileSync(path));
const digest=value=>createHash('sha256').update(value).digest('hex');
const write=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',path=root+name;if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round9.artifact-drift:'+name);}else writeFileSync(path,bytes,{flag:'wx'});};
const f1=value=>value&&(value.coverage+value.precision)?2*value.coverage*value.precision/(value.coverage+value.precision):value?0:null;

function verifyFrozenSources(){
 const freeze=read('freeze-round9.json'),{freeze_sha256,...material}=freeze;
 if(freeze.status!=='frozen'||sha(material)!==freeze_sha256)throw Error('round9.freeze-material');
 const manifest=JSON.parse(readFileSync('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round9-preserved/runtime-manifest.json'));
 if(manifest.source_freeze_sha256!==fileSha(root+'freeze-round9.json'))throw Error('round9.preserved-freeze-binding');
 const preserved=new Map(manifest.files.map(item=>[item.original_path,item]));
 for(const source of freeze.sources){
  let actual=null;
  try{actual=fileSha(source.path);}catch{}
  if(actual===source.sha256)continue;
  const replacement=preserved.get(resolve(source.path));
  if(!replacement||fileSha(replacement.preserved_path)!==source.sha256)throw Error('round9.frozen-source-unavailable:'+source.path);
 }
 return freeze;
}

function outcome(){
 const freeze=verifyFrozenSources(),matrix=read('development-matrix-v9.json'),analysis=read('round9-analysis.json');
 const sequence=JSON.parse(readFileSync(resolve(output,'sequence/completed.json')));
 if(sequence.scheduled_cells!==16||sequence.all_scheduled_outcomes_accounted!==true)throw Error('round9.sequence-accounting');
 const rows=[];
 for(const cell of matrix.cells){
  const dir=resolve(output,cell.cell_id),resultPath=resolve(dir,'result.json'),completePath=resolve(dir,'completed.json'),scorePath=resolve(dir,'native-score.json');
  if(!existsSync(resultPath)||!existsSync(completePath))throw Error('round9.incomplete:'+cell.cell_id);
  const result=JSON.parse(readFileSync(resultPath)),complete=JSON.parse(readFileSync(completePath));
  if(fileSha(resultPath)!==complete.result_sha256||complete.status!==result.status||complete.benchmark_cleared!==false)throw Error('round9.result-integrity:'+cell.cell_id);
  const models=result.receipts.filter(receipt=>receipt.kind==='model'&&receipt.dispatched),known=models.filter(receipt=>Number.isSafeInteger(receipt.input_tokens)&&Number.isSafeInteger(receipt.output_tokens));
  const modelTokens=known.reduce((sum,receipt)=>sum+receipt.input_tokens+receipt.output_tokens,0);
  if(modelTokens>cell.limits.total_tokens)throw Error('round9.token-cap:'+cell.cell_id);
  const delivery=bindDelivery({captures:result.captures,receipts:result.receipts}),delivered=new Map(delivery.read_observations.map(item=>[item.id,item]));
  const falseCredit=(result.selection?.final_read_ids??[]).filter(id=>!delivered.has(id));
  const score=existsSync(scorePath)?JSON.parse(readFileSync(scorePath)):null,final=score?.native?.final??null;
  if((result.status==='final_context_selected')!==Boolean(final))throw Error('round9.native-score-status:'+cell.cell_id);
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
  if(cell.state_arm==='control'&&(result.task_state_presentations?.length??0)!==0)throw Error('round9.control-state-exposure:'+cell.cell_id);
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
 const report={schema_version:'are.contextbench-round9-outcome-review/v1',status:'complete-development-matrix',freeze_ref:'freeze-round9.json',freeze_artifact_sha256:fileSha(root+'freeze-round9.json'),freeze_material_sha256:freeze.freeze_sha256,
  run_completion_ref:resolve(output,'sequence/completed.json'),analysis_ref:'round9-analysis.json',all_scheduled_outcomes_accounted:true,scheduled_cells:16,native_scored_cells:rows.filter(row=>row.native_score_present).length,complete_pairs:complete.length,
  status_counts:Object.fromEntries([...new Set(rows.map(row=>row.status))].sort().map(status=>[status,rows.filter(row=>row.status===status).length])),
  valid_completions:{control:control.filter(row=>row.native_score_present).length,state:state.filter(row=>row.native_score_present).length,difference:state.filter(row=>row.native_score_present).length-control.filter(row=>row.native_score_present).length},
  span_f1:{complete_pair_mean_gain:mean(complete.map(pair=>pair.span_difference)),scheduled_zero_filled_mean_gain:mean(pairs.map(pair=>pair.scheduled_span_difference)),minimum_required:0.05},
  file_f1:{scheduled_zero_filled_mean_gain:mean(pairs.map(pair=>pair.scheduled_file_difference)),non_degradation:mean(pairs.map(pair=>pair.scheduled_file_difference))>=0},
  model_tokens:{total:controlTokens+stateTokens,control:controlTokens,state:stateTokens,difference:stateTokens-controlTokens,unknown_usage_calls:rows.reduce((sum,row)=>sum+row.unknown_usage_calls,0),per_cell_cap_met:rows.every(row=>row.model_tokens<=96000)},
  recycling:{control:control.reduce((sum,row)=>sum+row.recycles,0),state:state.reduce((sum,row)=>sum+row.recycles,0),difference:state.reduce((sum,row)=>sum+row.recycles,0)-control.reduce((sum,row)=>sum+row.recycles,0)},
  state_exposure:{presentations:state.reduce((sum,row)=>sum+row.task_state_presentations,0),unique_generation_boundaries:state.reduce((sum,row)=>sum+row.unique_state_generations,0),repeated_within_generation:state.reduce((sum,row)=>sum+row.repeated_state_presentations,0),boundary_state_tokens:state.reduce((sum,row)=>sum+row.boundary_state_tokens,0),repeated_state_tokens:state.reduce((sum,row)=>sum+row.repeated_state_tokens,0),maximum_presented_tokens:Math.max(...state.map(row=>row.maximum_presented_state_tokens)),maximum_measurements_per_render:Math.max(...state.map(row=>row.maximum_state_measurements_per_render))},
  integrity:{output_cap_corrections:rows.reduce((sum,row)=>sum+row.output_cap_corrections,0),false_state_facts:rows.reduce((sum,row)=>sum+row.false_state_facts,0),false_source_credit:rows.reduce((sum,row)=>sum+row.false_source_credit,0),unmatched_presentations:rows.reduce((sum,row)=>sum+row.unmatched_presentations,0),generation_mismatches:rows.reduce((sum,row)=>sum+row.generation_mismatches,0),terminal_repository_effects:rows.reduce((sum,row)=>sum+row.terminal_repository_effects,0)},
  h18_criteria:{paired_macro_span_f1_gain_met:mean(complete.map(pair=>pair.span_difference))>=0.05,file_f1_non_degradation:true,valid_completion_non_degradation:true,verified_treatment_presentations_minimum:state.some(row=>row.task_state_presentations>0),state_cap_met:state.every(row=>row.maximum_presented_state_tokens<=1024),measurement_cap_met:state.every(row=>row.maximum_state_measurements_per_render<=4),correction_bound_met:rows.every(row=>row.output_cap_corrections<=1),integrity_met:rows.every(row=>row.false_state_facts===0&&row.false_source_credit===0&&row.unmatched_presentations===0&&row.generation_mismatches===0&&row.terminal_repository_effects===0&&row.unknown_usage_calls===0),passed:false},
  diagnosis:'State was presented on every post-recycle request, not only once at the generation boundary. Of 89 state presentations, 52 repeated within an already resumed generation and directly occupied 42,681 model-input tokens. The state arm used 86,838 more model tokens, made six more model calls, and recycled twelve more times while complete-pair span F1 was 0.0655 lower.',
  rows,pairs,acceptance_review:{development_target_met:false,full_scope_met:false,all_windows_met:false,confirmation_met:false,benchmark_cleared:false},
  claim_ceiling:'Complete exposed eight-task GLM-5.3-flash 8K development evidence. It rejects H18/H14 at the fixed native target and identifies repeated presentation as a token/recycle mechanism; it does not establish repair correctness, semantic retention, transfer, confirmation, or ContextBench clearance.',benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round9.md#open-questions'};
 if(report.span_f1.complete_pair_mean_gain!==analysis.descriptive_complete_pair_mean_gain||report.model_tokens.total!==analysis.known_model_tokens)throw Error('round9.analysis-cross-check');
 return report;
}

function successors({selected,decision}){
 const common={scope:'GLM-5.3-flash exposed 8K ContextBench development tasks; useful reasoning-state continuity after actual recycling, with the fixed acceptance target and cumulative model input plus output tokens.',metrics:selected.metrics,provenance_refs:[decision.record_id,'round9-outcome-review.json','round9-selected-hypothesis-review.json','round9-closeout.json','round10-continuity.json']};
 const h19=createResearchHypothesis({...common,hypothesis_key:'CB117-H19',statement:'Presenting receipt-bound task state exactly once at each recycle boundary preserves useful continuity while removing repeated state-token input and recycle amplification.',mechanism:'For each newly selected recycler generation, construct and inject the fitted receipt-bound projection on only the first dispatched request. Record that generation as presented only after the matching model receipt; omit state on later requests until another recycle creates a new generation.',falsifier:'Any generation receives more than one presentation, any recycled generation receives none, state facts or receipt bindings are invalid, aggregate state-arm tokens do not fall below round nine, valid/file outcomes degrade, or paired native span F1 gain remains below 0.05.',parent_hypothesis_ref:selected.record_id,experiment_template:{research_question:'Does one-shot recycle-boundary state improve native ContextBench selection while avoiding repeated state input and recycle amplification?',baseline_ref:'round10:no-state-control',treatment_ref:'round10:one-shot-boundary-state',dataset_refs:['same frozen exposed eight-task cohort'],required_repetitions:1,success_criteria:{macro_span_f1_gain_minimum:0.05,file_f1_non_degradation:true,valid_completion_non_degradation:true,maximum_presentations_per_generation:1,aggregate_state_model_tokens_below:396085,total_model_token_cap:96000,unknown_model_usage:0,false_state_facts:0},stop_conditions:['Any within-round task, source, prompt, cap or threshold change.','Any missing or duplicate recycle-boundary presentation.','Shared provider or instrument failure pauses unstarted cells and retains every outcome.']}});
 const h20=createResearchHypothesis({...common,hypothesis_key:'CB117-H20-R10',statement:'A receipt-bound delta containing only facts added since the prior presentation preserves continuity with fewer model tokens than replaying the full state.',mechanism:'Track the last presented fact identities per generation lineage and project only new evidence and outcomes after the boundary handoff, retaining the objective digest and explicit recovery handles.',falsifier:'Delta omission removes evidence later needed, creates false completion, or fails to improve native outcomes per model token.',experiment_template:{research_question:'Does delta-only state outperform one-shot full boundary state?',baseline_ref:'candidate:one-shot-full-state',treatment_ref:'candidate:receipt-bound-delta-state',dataset_refs:['round-nine exposed traces'],required_repetitions:1,success_criteria:{model_token_difference:'negative',native_non_degradation:true,false_state_facts:0},stop_conditions:['A required historical fact becomes unavailable.','A delta contains an unobserved fact.']}});
 const h0=createResearchHypothesis({...common,hypothesis_key:'CB117-H0-R10',statement:'Receipt-bound process state cannot improve these native outcomes because semantic evidence interpretation is the limiting factor.',mechanism:'The model can retrieve observed evidence after recycling, but deterministic process facts do not add the semantic judgment needed to select correct spans.',falsifier:'One-shot boundary state achieves the frozen paired native gain without correctness or integrity regression.',experiment_template:{research_question:'Does one-shot boundary state produce no native benefit over no-state control?',baseline_ref:'round10:no-state-control',treatment_ref:'round10:one-shot-boundary-state',dataset_refs:['same frozen exposed eight-task cohort'],required_repetitions:1,success_criteria:{null_prediction:'no positive native gain'},stop_conditions:['Arms differ outside boundary-state presentation.']}});
 for(const record of [h19,h20,h0])if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('round10.hypothesis-invalid');
 return{records:[h19,h20,h0],selection:{selected:h19.record_id,alternatives:[h20.record_id,h0.record_id],reason:'Round nine recorded 52 repeated within-generation presentations and 42,681 repeated state tokens. H19 removes that observed mechanism before adding semantic content; H20 retains a smaller-state alternative and H0 preserves the semantic-ceiling explanation.'},authority_effect:'none',open_questions_ref:'PLAN-round10.md#open-questions'};
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
 const report=outcome();write('round9-outcome-review.json',report);
 const hypotheses=read('hypotheses-round9.json'),selected=hypotheses.records.find(record=>record.record_id===hypotheses.selection.selected),experiment=read('experiment-round9.json');
 const observation=createHypothesisObservation({hypothesis_ref:selected.record_id,source_result_ref:resolve(root+'round9-outcome-review.json'),source_result_digest:fileSha(root+'round9-outcome-review.json'),observation_kind:'counterevidence',phase:'experiment',claim:'All 16 cells completed, but the seven complete pairs had mean state-minus-control span F1 of -0.0655 versus the fixed +0.05 target. State used 86,838 more model tokens and recycled twelve more times; 52 of 89 presentations repeated within a generation and directly occupied 42,681 model-input tokens.',evaluator_id:'contextbench.round9.review',evidence_refs:['round9-outcome-review.json','round9-analysis.json','analyze-round-repair-v1.json',resolve(output,'sequence/completed.json')],observed_markers:['16/16 outcomes accounted','15/16 native scored','7 complete pairs','state span gain -0.0655','state model-token difference +86838','52 repeated presentations','42681 repeated state tokens','0 output-cap corrections'],limitations:['Exposed eight-task 8K development cohort.','One repetition.','No output-cap correction received live exposure.','Native evidence selection does not establish repair correctness or semantic retention.']});
 const decision=createLearningDecision({hypothesis_ref:selected.record_id,observation_refs:[observation.record_id],experiment_ref:experiment.record_id,disposition:'revise-hypothesis',counterevidence_count:1,reason_codes:['native.span-gain-target-missed','model-token-cost-increased','state.presentation-repeated-within-generation','recycling.amplified','output-recovery-unexposed'],next_action:'Retain exact state fitting and typed output recovery as bounded instrumentation. Change only state cadence: inject one receipt-bound state on the first dispatched request of each recycled generation, then omit it until the next boundary. Freeze a new method-bound round against no-state control.'});
 for(const record of [observation,decision])if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('round9.review-record-invalid');
 write('round9-selected-hypothesis-review.json',{records:[selected,experiment,observation,decision],continuity_ref:'round9-continuity.json',benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round9.md#open-questions'});
 const next=successors({selected,decision});write('hypotheses-round10.json',next);
 const selectedNext=next.records.find(record=>record.record_id===next.selection.selected);
 const closeout={schema_version:'are.contextbench-round-closeout/v1',round:'contextbench-development-round9',status:'closed-complete-target-missed',freeze_ref:'freeze-round9.json',preserved_runtime_ref:'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round9-preserved/runtime-manifest.json',run_completion_ref:resolve(output,'sequence/completed.json'),analysis_refs:['round9-analysis.json','round9-outcome-review.json','analyze-round-repair-v1.json'],scheduled_cells:16,attempted_cells:16,native_scored_cells:15,complete_pairs:7,total_model_tokens:report.model_tokens.total,unknown_usage_calls:0,task_state_presentations:report.state_exposure.presentations,repeated_state_presentations:report.state_exposure.repeated_within_generation,repeated_state_tokens:report.state_exposure.repeated_state_tokens,h18_decision_ref:decision.record_id,successor_hypotheses_ref:'hypotheses-round10.json',selected_successor_ref:selectedNext.record_id,remaining_goal:'Clear fixed ContextBench acceptance and finish GLM small-window useful-state qualification under cumulative model input plus output tokens.',benchmark_cleared:false,claim_ceiling:report.claim_ceiling,authority_effect:'none',open_questions_ref:'PLAN-round9.md#open-questions'};
 write('round9-closeout.json',closeout);
 const built=build(),frozen=read('work-state-frozen-v9.json'),evidence=(criterion,artifact)=>[{criterion_id:criterion,artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}];
 const events=[...frozen.events,{event_id:'r9-run-start',task_id:'contextbench.round9.run',action:'start'},{event_id:'r9-run-complete',task_id:'contextbench.round9.run',action:'complete',evidence:evidence('all-sixteen-attempts-accounted',resolve(output,'sequence/completed.json'))},{event_id:'r9-score-start',task_id:'contextbench.round9.score',action:'start'},{event_id:'r9-score-complete',task_id:'contextbench.round9.score',action:'complete',evidence:evidence('native-scores-token-and-state-integrity',root+'round9-outcome-review.json')},{event_id:'r9-review-start',task_id:'contextbench.round9.review',action:'start'},{event_id:'r9-review-complete',task_id:'contextbench.round9.review',action:'complete',evidence:evidence('reviewed-h18-decision-and-method-bound-successor',root+'round9-closeout.json')}];
 const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyCloseEvidence,verify_registration:verifyPredecessor});
 if(state.tasks.some(task=>task.state!=='completed'))throw Error('round9.work-not-closed');write('work-state-closed-v9.json',state);
 return{attempted:16,native_scores:15,complete_pairs:7,span_gain:report.span_f1.complete_pair_mean_gain,model_tokens:report.model_tokens.total,state_token_difference:report.model_tokens.difference,next:selectedNext.record_id,benchmark_cleared:false};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(review()));
