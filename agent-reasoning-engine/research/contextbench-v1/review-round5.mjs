// Deterministic round-five review and method-bound successor hypotheses.
// Performs no provider requests or repository effects.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHypothesisObservation,createLearningDecision,createResearchHypothesis,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {bindDelivery} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {build,verifyPredecessor} from './bind-round5.mjs';

const research=resolve('agent-reasoning-engine/research/contextbench-v1'),output='/tmp/are-contextbench-round5';
const path=name=>resolve(research,name),read=name=>JSON.parse(readFileSync(path(name))),fileSha=p=>sha(readFileSync(p));
const write=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',target=path(name);if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round5.existing-artifact-drift:'+name);return;}writeFileSync(target,bytes,{flag:'wx'});};
const f1=value=>value&&(value.coverage+value.precision)?2*value.coverage*value.precision/(value.coverage+value.precision):value?0:null;

function outcome(){
  const matrix=read('development-matrix-v5.json'),rows=[];
  for(const cell of matrix.cells){
    const root=resolve(output,cell.cell_id),resultPath=resolve(root,'result.json'),completePath=resolve(root,'completed.json');
    if(!existsSync(resultPath)||!existsSync(completePath))throw Error('round5.incomplete:'+cell.cell_id);
    const result=JSON.parse(readFileSync(resultPath)),complete=JSON.parse(readFileSync(completePath));
    if(fileSha(resultPath)!==complete.result_sha256||complete.status!==result.status||complete.benchmark_cleared!==false)throw Error('round5.result-integrity:'+cell.cell_id);
    const models=result.receipts.filter(r=>r.kind==='model'&&r.dispatched),unknown=models.filter(r=>!Number.isSafeInteger(r.input_tokens)||!Number.isSafeInteger(r.output_tokens)).length;
    const modelTokens=models.reduce((n,r)=>n+(r.input_tokens??0)+(r.output_tokens??0),0);
    if(modelTokens>cell.limits.total_tokens)throw Error('round5.token-cap:'+cell.cell_id);
    const delivery=bindDelivery({captures:result.captures,receipts:result.receipts}),delivered=new Set(delivery.read_observations.map(x=>x.id));
    const falseCredit=(result.selection?.final_read_ids??[]).filter(id=>!delivered.has(id));
    const terminalEffects=result.events.filter(event=>event.tool==='submit_context_selection').length;
    const scorePath=resolve(root,'native-score.json'),score=existsSync(scorePath)?JSON.parse(readFileSync(scorePath)):null,final=score?.native?.final??null;
    if((result.status==='final_context_selected')!==Boolean(final)||falseCredit.length||terminalEffects)throw Error('round5.integrity:'+cell.cell_id);
    const terminalCallId=result.selection?.terminal_submission_call_id??null;
    if((cell.terminal_arm==='structured'&&result.status==='final_context_selected')!==Boolean(terminalCallId))throw Error('round5.terminal-binding:'+cell.cell_id);
    rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,terminal_arm:cell.terminal_arm,evidence_arm:cell.arm,status:result.status,error:result.error,
      model_calls:models.length,model_tokens:modelTokens,unknown_usage_calls:unknown,recycles:result.recycling.recycles,delivered_deferrals:result.tool_output_deferrals.length,
      terminal_corrections:Number(result.terminal_corrections??0),terminal_submission_call_id:terminalCallId,terminal_repository_effects:terminalEffects,false_source_credit:falseCredit.length,
      native_score_present:Boolean(final),file_f1:f1(final?.file),span_f1:f1(final?.span),result_sha256:complete.result_sha256,native_score_sha256:score?fileSha(scorePath):null});
  }
  const pairs=matrix.tasks.map(task=>{const freeform=rows.find(r=>r.instance_id===task.instance_id&&r.terminal_arm==='freeform'),structured=rows.find(r=>r.instance_id===task.instance_id&&r.terminal_arm==='structured');return{instance_id:task.instance_id,freeform_cell:freeform.cell_id,structured_cell:structured.cell_id,freeform_valid:freeform.native_score_present,structured_valid:structured.native_score_present,valid_completion_difference:Number(structured.native_score_present)-Number(freeform.native_score_present),model_token_difference:structured.model_tokens-freeform.model_tokens};});
  const structured=rows.filter(r=>r.terminal_arm==='structured'),freeform=rows.filter(r=>r.terminal_arm==='freeform'),sequence=JSON.parse(readFileSync(resolve(output,'sequence/completed.json')));
  if(sequence.scheduled_cells!==6||sequence.all_scheduled_outcomes_accounted!==true)throw Error('round5.sequence-accounting');
  const sv=structured.filter(r=>r.native_score_present).length,fv=freeform.filter(r=>r.native_score_present).length;
  return{schema_version:'are.contextbench-round5-outcome-review/v1',matrix_ref:'development-matrix-v5.json',matrix_sha256:fileSha(path('development-matrix-v5.json')),freeze_ref:'freeze-round5.json',freeze_artifact_sha256:fileSha(path('freeze-round5.json')),
    all_scheduled_outcomes_accounted:true,scheduled_cells:6,status_counts:Object.fromEntries([...new Set(rows.map(r=>r.status))].sort().map(s=>[s,rows.filter(r=>r.status===s).length])),
    valid_completions:{freeform:fv,structured:sv,difference:sv-fv},native_scored_cells:rows.filter(r=>r.native_score_present).length,total_model_tokens:rows.reduce((n,r)=>n+r.model_tokens,0),
    model_tokens_by_arm:{freeform:freeform.reduce((n,r)=>n+r.model_tokens,0),structured:structured.reduce((n,r)=>n+r.model_tokens,0),difference:structured.reduce((n,r)=>n+r.model_tokens,0)-freeform.reduce((n,r)=>n+r.model_tokens,0)},
    unknown_usage_calls:rows.reduce((n,r)=>n+r.unknown_usage_calls,0),false_source_credit:rows.reduce((n,r)=>n+r.false_source_credit,0),terminal_repository_effects:rows.reduce((n,r)=>n+r.terminal_repository_effects,0),rows,pairs,
    h9_criteria:{structured_valid_minimum:sv>=2,structured_gain_minimum:sv-fv>=1,false_source_credit_zero:true,terminal_repository_effects_zero:true,unknown_usage_zero:rows.every(r=>r.unknown_usage_calls===0),per_cell_cap_met:rows.every(r=>r.model_tokens<=96000),passed:sv>=2&&sv-fv>=1},
    acceptance_review:{instrument_criterion_met:true,full_scope_met:false,all_windows_met:false,confirmation_met:false,benchmark_cleared:false},
    claim_ceiling:'H9 is supported on three outcome-selected exposed 8K failures. This establishes terminal validity and source/effect integrity only; it does not establish semantic retention, repair correctness, transfer, H1 benefit or ContextBench clearance.',benchmark_cleared:false,authority_effect:'none'};
}

function successor(records){
  const common={scope:'GLM-5.3-flash exposed 8K ContextBench development tasks; useful reasoning-state representation after actual recycling, with structured terminal submission common to both arms.',metrics:['native.span-f1','native.file-f1','terminal.valid-selection-rate','total_model_tokens','recovery.repeated-bytes'],provenance_refs:[records.h9Decision.record_id,'round5-outcome-review.json','round5-closeout.json','round6-continuity.json']};
  const h11=createResearchHypothesis({...common,hypothesis_key:'CB117-H11',statement:'A compact event-derived task-state projection shown after recycling improves useful completion more than a source-handle index alone.',mechanism:'Deterministically project the unchanged task objective, confirmed evidence handles, repository mutations, test/search outcomes, and unresolved terminal requirements from receipts and tool events. Present the bounded projection only after local recycling; keep source recovery explicit and structured terminal submission common.',falsifier:'The projection fails to improve frozen paired native span F1 by the development target, degrades file metrics or completion, creates false observations, or increases cumulative model tokens without outcome benefit.',parent_hypothesis_ref:records.h1.record_id,experiment_template:{research_question:'Does event-derived task state improve native ContextBench evidence selection after recycling within the same cumulative model-token cap?',baseline_ref:'round6:baseline-with-structured-terminal',treatment_ref:'round6:event-state-with-structured-terminal',dataset_refs:['frozen exposed eight-task round-four cohort'],required_repetitions:1,success_criteria:{macro_span_f1_gain_minimum:0.05,file_f1_non_degradation:true,unknown_model_usage:0,false_state_facts:0,total_model_token_cap:96000},stop_conditions:['Any projected fact lacks a receipt or tool-event source.','Any within-round intervention, task, threshold or cap changes.','Shared provider or instrument failure pauses unstarted cells.']}});
  const h12=createResearchHypothesis({...common,hypothesis_key:'CB117-H12',statement:'Repeated historical recovery is the main avoidable token cost; deduplicating recovered ranges preserves outcomes with fewer model tokens.',mechanism:'Retain the source-handle index but suppress already recovered exact ranges within an epoch and present recovery availability only after recycling.',falsifier:'Deduplication does not reduce cumulative model tokens, blocks evidence needed after a later recycle, or reduces native selection quality or valid completion.',experiment_template:{research_question:'Can recovery deduplication reduce token use without reducing useful outcomes?',baseline_ref:'round4:index',treatment_ref:'candidate:deduplicated-post-recycle-index',dataset_refs:['round-four recovery traces'],required_repetitions:1,success_criteria:{model_token_difference:'negative',native_non_degradation:true},stop_conditions:['Required historical evidence becomes unrecoverable.','False cache-hit or source credit occurs.']}});
  const h0=createResearchHypothesis({...common,hypothesis_key:'CB117-H0-R6',statement:'The remaining small-window error is semantic task reasoning, so deterministic state projection will not improve native selection quality.',mechanism:'GLM already has sufficient observable source recovery; its failures come from choosing or interpreting evidence rather than losing process state.',falsifier:'A state-only treatment improves native paired outcomes under identical tasks, tools, terminal submission and token caps.',experiment_template:{research_question:'Does the state-only intervention produce no native benefit?',baseline_ref:'round6:baseline-with-structured-terminal',treatment_ref:'round6:event-state-with-structured-terminal',dataset_refs:['frozen exposed eight-task round-four cohort'],required_repetitions:1,success_criteria:{null_prediction:'no positive native paired gain'},stop_conditions:['Arms differ in evidence access, task, provider policy or token cap.']}});
  for(const record of [h11,h12,h0])if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('round6.invalid-hypothesis');
  return{records:[h11,h12,h0],selection:{selected:h11.record_id,alternatives:[h12.record_id,h0.record_id],reason:'Round four exercised exact recovery 31 times and returned 46,555 source bytes, yet the handle-only index missed the quality target and cost 77,656 more model tokens. H11 changes the missing abstraction—task reasoning state—while H12 isolates repeated recovery cost and H0 retains the semantic-ceiling explanation.'},authority_effect:'none',open_questions_ref:'PLAN-round6.md#open-questions'};
}

function verifyEvidence(binding){
  if(binding.validator_ref==='contextbench.round5.verify:freeze'){
    try{
      if(binding.criterion_id!=='exact-frozen-run-envelope'||fileSha(resolve(binding.artifact_ref))!==binding.artifact_digest)return{ok:false};
      const freeze=JSON.parse(readFileSync(binding.artifact_ref)),{freeze_sha256,...material}=freeze;if(freeze.status!=='frozen'||sha(material)!==freeze_sha256)return{ok:false};
      const manifest=JSON.parse(readFileSync(resolve('implementation/agent-reasoning-engine/benchmarks/contextbench-v1/round5-preserved/runtime-manifest.json'))),preserved=new Map(manifest.files.map(x=>[x.original_path,x]));
      for(const source of freeze.sources){const replacement=preserved.get(source.path),candidate=replacement?resolve(replacement.preserved_path):source.path;if(fileSha(candidate)!==source.sha256)return{ok:false};}
      return{ok:true,binding};
    }catch{return{ok:false};}
  }
  if(fileSha(resolve(binding.artifact_ref))!==binding.artifact_digest)return{ok:false};
  if(binding.validator_ref==='contextbench.round5.verify:run'){const x=JSON.parse(readFileSync(binding.artifact_ref));if(x.scheduled_cells!==6||x.all_scheduled_outcomes_accounted!==true)return{ok:false};}
  else if(binding.validator_ref==='contextbench.round5.verify:score'){const x=JSON.parse(readFileSync(binding.artifact_ref));if(x.scheduled_cells!==6||x.native_scored_cells!==4||x.unknown_usage_calls!==0||x.false_source_credit!==0||x.terminal_repository_effects!==0)return{ok:false};}
  else if(binding.validator_ref==='contextbench.round5.verify:review'){const x=JSON.parse(readFileSync(binding.artifact_ref));if(x.benchmark_cleared!==false||!x.h9_decision_ref||!x.successor_hypotheses_ref)return{ok:false};}
  else return{ok:false}; return{ok:true,binding};
}

export function review(){
  const report=outcome();write('round5-outcome-review.json',report);
  const hs=read('hypotheses-round5.json'),h9=hs.records.find(h=>h.record_id===hs.selection.selected),h1=read('hypotheses.json').records[0],experiment=read('experiment-round5.json');
  const observation=createHypothesisObservation({hypothesis_ref:h9.record_id,source_result_ref:path('round5-outcome-review.json'),source_result_digest:fileSha(path('round5-outcome-review.json')),observation_kind:'supporting',phase:'experiment',claim:'Structured terminal submission produced 3/3 valid native-scoreable outcomes versus 1/3 free-form, with zero false source credit, zero terminal repository effects, zero unknown usage, and 18,778 fewer aggregate model tokens.',evaluator_id:'contextbench.round5.review',evidence_refs:['round5-outcome-review.json'],observed_markers:['structured 3/3 valid','free-form 1/3 valid','zero integrity violations'],limitations:['Outcome-selected exposed three-task cohort.','One repetition at 8K.','Terminal validity does not establish semantic retention or repair correctness.']});
  const decision=createLearningDecision({hypothesis_ref:h9.record_id,observation_refs:[observation.record_id],experiment_ref:experiment.record_id,disposition:'candidate-supported',supporting_count:1,experiment_support_count:1,reason_codes:['terminal.validity-gain-met','terminal.source-and-effect-integrity-met','terminal.aggregate-token-use-lower'],next_action:'Retain structured terminal submission as common candidate instrumentation. Return to a competing state-representation hypothesis derived from the round-four recovery traces; do not treat H9 as ContextBench clearance.'});
  for(const record of [observation,decision])if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('round5.invalid-record');
  write('round5-selected-hypothesis-review.json',{records:[h9,experiment,observation,decision],reviewer:'executing parent agent',continuity_ref:'round5-continuity.json',authority_effect:'none',benchmark_cleared:false,open_questions_ref:'PLAN-round5.md#open-questions'});
  const next=successor({h9Decision:decision,h1});write('hypotheses-round6.json',next);
  const closeout={schema_version:'are.contextbench-round-closeout/v1',round:'contextbench-development-round5',freeze_ref:'freeze-round5.json',run_completion_ref:'/tmp/are-contextbench-round5/sequence/completed.json',analysis_refs:['round5-outcome-review.json'],scheduled_cells:6,attempted_cells:6,native_scored_cells:4,total_model_tokens:report.total_model_tokens,unknown_usage_calls:0,false_source_credit:0,terminal_repository_effects:0,status_counts:report.status_counts,h9_decision_ref:decision.record_id,successor_hypotheses_ref:'hypotheses-round6.json',selected_successor_ref:next.selection.selected,benchmark_cleared:false,claim_ceiling:report.claim_ceiling,authority_effect:'none',open_questions_ref:'PLAN-round6.md#open-questions'};write('round5-closeout.json',closeout);
  const built=build(),freezeState=read('work-state-frozen-v5.json'),evidence=(criterion,artifact)=>[{criterion_id:criterion,artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}];
  const events=[...freezeState.events,{event_id:'r5-run-start',task_id:'contextbench.round5.run',action:'start'},{event_id:'r5-run-complete',task_id:'contextbench.round5.run',action:'complete',evidence:evidence('all-six-attempts-accounted','/tmp/are-contextbench-round5/sequence/completed.json')},{event_id:'r5-score-start',task_id:'contextbench.round5.score',action:'start'},{event_id:'r5-score-complete',task_id:'contextbench.round5.score',action:'complete',evidence:evidence('matched-terminal-outcomes-and-token-accounting',path('round5-outcome-review.json'))},{event_id:'r5-review-start',task_id:'contextbench.round5.review',action:'start'},{event_id:'r5-review-complete',task_id:'contextbench.round5.review',action:'complete',evidence:evidence('reviewed-h9-decision-and-successor',path('round5-closeout.json'))}];
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});if(state.tasks.some(t=>t.state!=='completed'))throw Error('round5.work-not-closed');write('work-state-closed-v5.json',state);
  return{attempted:6,native_scores:4,valid_gain:2,model_tokens:report.total_model_tokens,h9_decision:decision.record_id,next:next.selection.selected,benchmark_cleared:false};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(review()));
