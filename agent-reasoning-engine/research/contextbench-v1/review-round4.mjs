// Deterministic round-four closeout and successor hypotheses.
// Open questions: PLAN-round4.md. This performs no provider requests.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHypothesisObservation,createLearningDecision,createResearchHypothesis,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {replayResearchWork} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
import {build,verifyPredecessor,verifyFreezeEvidence} from './bind-round4.mjs';

const research=resolve('agent-reasoning-engine/research/contextbench-v1'),output='/tmp/are-contextbench-round4';
const path=name=>resolve(research,name),read=name=>JSON.parse(readFileSync(path(name))),fileSha=p=>sha(readFileSync(p));
const write=(name,value)=>{
  const bytes=JSON.stringify(value,null,2)+'\n',target=path(name);
  if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round4.existing-artifact-drift:'+name);return;}
  writeFileSync(target,bytes,{flag:'wx'});
};
const f1=value=>value&&(value.coverage+value.precision)?2*value.coverage*value.precision/(value.coverage+value.precision):value?0:null;
const mean=(rows,key)=>rows.reduce((n,row)=>n+row[key],0)/rows.length;

function outcome(){
  const matrix=read('development-matrix-v4.json'),rows=[];
  for(const cell of matrix.cells){
    const root=resolve(output,cell.cell_id),resultPath=resolve(root,'result.json'),completePath=resolve(root,'completed.json');
    if(!existsSync(resultPath)||!existsSync(completePath))throw Error('round4.incomplete:'+cell.cell_id);
    const result=JSON.parse(readFileSync(resultPath)),complete=JSON.parse(readFileSync(completePath));
    if(fileSha(resultPath)!==complete.result_sha256||complete.status!==result.status||complete.benchmark_cleared!==false)throw Error('round4.result-integrity:'+cell.cell_id);
    const models=result.receipts.filter(r=>r.kind==='model'&&r.dispatched),unknown=models.filter(r=>!Number.isSafeInteger(r.input_tokens)||!Number.isSafeInteger(r.output_tokens)).length;
    const scorePath=resolve(root,'native-score.json'),score=existsSync(scorePath)?JSON.parse(readFileSync(scorePath)):null;
    if((result.status==='final_context_selected')!==Boolean(score?.native?.final))throw Error('round4.score-presence:'+cell.cell_id);
    const final=score?.native?.final??null;
    rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,language:matrix.tasks.find(t=>t.instance_id===cell.instance_id).language,arm:cell.arm,status:result.status,error:result.error,
      model_calls:models.length,model_tokens:models.reduce((n,r)=>n+(r.input_tokens??0)+(r.output_tokens??0),0),unknown_usage_calls:unknown,recycles:result.recycling.recycles,
      delivered_deferrals:result.tool_output_deferrals.length,native_score_present:Boolean(final),file_f1:f1(final?.file),span_f1:f1(final?.span),
      file_coverage:final?.file?.coverage??null,file_precision:final?.file?.precision??null,span_coverage:final?.span?.coverage??null,span_precision:final?.span?.precision??null,
      result_sha256:complete.result_sha256,native_score_sha256:score?fileSha(scorePath):null});
  }
  const pairs=matrix.tasks.map(task=>{const baseline=rows.find(r=>r.instance_id===task.instance_id&&r.arm==='baseline'),index=rows.find(r=>r.instance_id===task.instance_id&&r.arm==='index');
    const complete=baseline.span_f1!==null&&index.span_f1!==null;
    return {instance_id:task.instance_id,language:task.language,baseline_cell:baseline.cell_id,index_cell:index.cell_id,baseline_status:baseline.status,index_status:index.status,
      span_f1_difference:complete?index.span_f1-baseline.span_f1:null,file_f1_difference:complete?index.file_f1-baseline.file_f1:null,
      span_coverage_difference:complete?index.span_coverage-baseline.span_coverage:null,span_precision_difference:complete?index.span_precision-baseline.span_precision:null,
      file_coverage_difference:complete?index.file_coverage-baseline.file_coverage:null,file_precision_difference:complete?index.file_precision-baseline.file_precision:null,
      model_token_difference:index.model_tokens-baseline.model_tokens};});
  const complete=pairs.filter(p=>p.span_f1_difference!==null),sequence=JSON.parse(readFileSync(resolve(output,'sequence/completed.json')));
  if(sequence.all_scheduled_outcomes_accounted!==true||sequence.scheduled_cells!==16||complete.length!==5)throw Error('round4.sequence-accounting');
  const report={schema_version:'are.contextbench-round4-outcome-review/v1',matrix_ref:'development-matrix-v4.json',matrix_sha256:fileSha(path('development-matrix-v4.json')),
    freeze_ref:'freeze-round4.json',freeze_artifact_sha256:fileSha(path('freeze-round4.json')),all_scheduled_outcomes_accounted:true,scheduled_cells:16,
    status_counts:Object.fromEntries([...new Set(rows.map(r=>r.status))].sort().map(status=>[status,rows.filter(r=>r.status===status).length])),native_scored_cells:rows.filter(r=>r.native_score_present).length,
    complete_pairs:complete.length,missing_pairs:pairs.length-complete.length,total_model_tokens:rows.reduce((n,r)=>n+r.model_tokens,0),unknown_usage_calls:rows.reduce((n,r)=>n+r.unknown_usage_calls,0),
    model_tokens_by_arm:{baseline:rows.filter(r=>r.arm==='baseline').reduce((n,r)=>n+r.model_tokens,0),index:rows.filter(r=>r.arm==='index').reduce((n,r)=>n+r.model_tokens,0)},
    delivered_deferrals:rows.reduce((n,r)=>n+r.delivered_deferrals,0),context_budget_stops:rows.filter(r=>r.status==='context_budget_stopped').length,
    complete_pair_macro:{baseline_span_f1:mean(complete.map(p=>rows.find(r=>r.cell_id===p.baseline_cell)),'span_f1'),index_span_f1:mean(complete.map(p=>rows.find(r=>r.cell_id===p.index_cell)),'span_f1'),span_f1_gain:mean(complete,'span_f1_difference'),file_f1_gain:mean(complete,'file_f1_difference'),span_coverage_gain:mean(complete,'span_coverage_difference'),span_precision_gain:mean(complete,'span_precision_difference'),file_coverage_gain:mean(complete,'file_coverage_difference'),file_precision_gain:mean(complete,'file_precision_difference')},
    rows,pairs,acceptance_review:{development_gain_target:0.05,development_gain_met:false,complete_accounting_met:true,no_unknown_model_usage_met:true,full_scope_met:false,all_windows_met:false,confirmation_met:false,benchmark_cleared:false,reasons:['Only five of eight development pairs have native scores.','Complete-pair macro span-F1 gain is below 0.05.','File F1 degrades on complete pairs.','Only one 8K development repetition was run; full 1136-task, 10K/12K, token-tier and two-repetition reserved confirmation requirements remain.']},
    claim_ceiling:'Frozen 16-cell development evidence. Missing pairs stay missing; complete-pair statistics cannot establish full-cohort benefit. No patch correctness, semantic retention, transfer or clearance claim.',benchmark_cleared:false,authority_effect:'none'};
  return report;
}

function records(report){
  const hypotheses=read('hypotheses.json'),h1=hypotheses.records[0],experiment=read('experiment-round4.json'),h7=read('hypotheses-round4.json').records.find(h=>h.hypothesis_key==='CB117-H7');
  const h1Observation=createHypothesisObservation({hypothesis_ref:h1.record_id,source_result_ref:path('round4-outcome-review.json'),source_result_digest:fileSha(path('round4-outcome-review.json')),observation_kind:'counterevidence',phase:'experiment',
    claim:`Five of eight pairs were scoreable. Their macro span-F1 gain was ${report.complete_pair_macro.span_f1_gain}; three pairs were missing and file F1 decreased ${report.complete_pair_macro.file_f1_gain}. The fixed development target was not met.`,evaluator_id:'contextbench.round4.review',evidence_refs:['round4-outcome-review.json','round4-analysis.json','round4-traces.json'],
    missing_terms:['full cohort','repair correctness','reserved confirmation','10K and 12K windows'],observed_markers:['all 16 cells accounted','13 native scores','zero unknown usage'],limitations:['Development tasks are exposed and cannot confirm acceptance.','Complete-pair means exclude three failed terminal outcomes.','The common deferral instrument does not isolate the evidence index mechanism.']});
  const h1Decision=createLearningDecision({hypothesis_ref:h1.record_id,observation_refs:[h1Observation.record_id],experiment_ref:experiment.record_id,disposition:'revise-hypothesis',counterevidence_count:1,
    reason_codes:['contextbench.development-gain-below-target','contextbench.missing-pairs','contextbench.file-f1-degradation'],next_action:'Do not rerun the index comparison unchanged. Resolve the observed terminal-completion failures through a separately controlled hypothesis, then reassess the state intervention on development evidence before any reserved confirmation.'});
  const h7Observation=createHypothesisObservation({hypothesis_ref:h7.record_id,source_result_ref:path('round4-outcome-review.json'),source_result_digest:fileSha(path('round4-outcome-review.json')),observation_kind:'supporting',phase:'experiment',
    claim:`Seventeen deferral notices were delivered across both arms; all 16 cells completed with zero context-budget stops and 13 native scores. Withheld source received no automatic score credit under the frozen exporter.`,evaluator_id:'contextbench.round4.instrument-review',evidence_refs:['round4-outcome-review.json','output-deferral-integration-review-v1.json'],
    observed_markers:['17 delivered deferrals','zero context-budget stops','13 native scores'],limitations:['Round three versus round four is not a randomized causal comparison.','Three terminal failures remain.','A fitting notice does not prove useful semantic recovery or lower token use.']});
  const h7Decision=createLearningDecision({hypothesis_ref:h7.record_id,observation_refs:[h7Observation.record_id],experiment_ref:null,disposition:'collect-replications',supporting_count:1,
    reason_codes:['instrument.deferral-exercised','instrument.context-stops-eliminated','instrument.causal-effect-unisolated'],next_action:'Retain truthful deferral as a common development instrument, preserve its claim ceiling, and test terminal submission separately; revisit or specialize if later runs show retry loops or token cost without outcome benefit.'});
  for(const record of [h1Observation,h1Decision,h7Observation,h7Decision])if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('round4.invalid-record');
  return {h1,h7,experiment,h1Observation,h1Decision,h7Observation,h7Decision};
}

function successors(records){
  const common={scope:'GLM-5.3-flash 8K exposed ContextBench development failures; terminal instrument only, before another evidence-index comparison.',metrics:['terminal.valid-selection-rate','native.score-availability','terminal.provenance-validity','total_model_tokens'],provenance_refs:[records.h1Decision.record_id,records.h7Decision.record_id,'round4-outcome-review.json','round4-continuity.json']};
  const h9=createResearchHypothesis({...common,hypothesis_key:'CB117-H9',statement:'A schema-bound terminal submission action improves valid completion under small-window pressure.',mechanism:'During finalization expose one no-effect submit_context_selection action with closed summary and context_read_ids arguments; validate it with the same whole-envelope and source-provenance checks, and accept a valid call as the terminal candidate without requiring another model response.',falsifier:'Structured submission does not improve valid terminal outcomes on the frozen failure cohort, changes source credit, permits tool effects, exceeds equal model-token caps, or prevents actionable provenance diagnostics.',parent_hypothesis_ref:records.h1.record_id,experiment_template:{research_question:'Does schema-bound no-effect terminal submission reduce invalid final outcomes while preserving evidence integrity and equal cumulative model-token caps?',baseline_ref:'round5-matrix:freeform-terminal',treatment_ref:'round5-matrix:structured-terminal',dataset_refs:['round4 failed terminal cells: r4-03-baseline-8k, r4-06-baseline-8k, r4-08-index-8k'],required_repetitions:1,success_criteria:{treatment_valid_completions:'at least 2 of 3 and at least one more than matched control',false_source_credit:0,external_tool_effects:0,unknown_model_usage:0,total_model_token_cap:96000},stop_conditions:['Any terminal submission performs a repository effect.','Any withheld or unknown source receives delivery credit.','Shared instrument or provider failure pauses unstarted cells.']}});
  const h10=createResearchHypothesis({...common,hypothesis_key:'CB117-H10',statement:'One additional diagnostic correction opportunity improves valid completion more than structured submission.',mechanism:'Keep free-form final JSON but reserve and permit a second validator-driven correction inside the same cumulative token cap.',falsifier:'A second correction fails to improve completion, consumes the remaining budget before valid submission, or repeats the same invalid envelope.',experiment_template:{research_question:'Does a second bounded correction repair terminal failures within the same token cap?',baseline_ref:'round5-matrix:one-correction',treatment_ref:'candidate:two-corrections',dataset_refs:['round4 failed terminal cells'],required_repetitions:1,success_criteria:{valid_completion_gain:'positive',unknown_model_usage:0,total_model_token_cap:96000},stop_conditions:['Token cap would be exceeded.','Repeated identical invalid response.','Shared instrument failure.']}});
  const h0=createResearchHypothesis({...common,hypothesis_key:'CB117-H0-R5',statement:'The remaining failures are semantic source-selection failures that structured serialization cannot repair.',mechanism:'The model lacks or misidentifies relevant pinned-base evidence; changing the terminal wire shape only moves the same invalid IDs into tool arguments.',falsifier:'Structured terminal submission converts malformed or provenance-invalid controls into valid independently scored selections without new evidence delivery.',experiment_template:{research_question:'Are terminal failures unchanged when only submission shape changes?',baseline_ref:'round5-matrix:freeform-terminal',treatment_ref:'round5-matrix:structured-terminal',dataset_refs:['round4 failed terminal cells'],required_repetitions:1,success_criteria:{null_prediction:'no valid-completion gain'},stop_conditions:['Evidence delivery differs between arms.','Task or source versions drift.']}});
  for(const record of [h9,h10,h0])if(!verifyEvolutionRecord(record,record.schema_version).ok)throw Error('round5.invalid-hypothesis');
  return {records:[h9,h10,h0],selection:{selected:h9.record_id,alternatives:[h10.record_id,h0.record_id],reason:'Two of three observed failures are invalid JSON, making schema-bound submission the most direct discriminating mechanism. It also preserves the whole-envelope validator for the provenance failure. A second correction changes both budget and retry count, so it remains an alternative.'},authority_effect:'none',open_questions_ref:'PLAN-round5.md#open-questions'};
}

function verifyEvidence(binding){
  if(binding.validator_ref==='contextbench.round4.verify:freeze')return verifyFreezeEvidence(binding);
  if(fileSha(resolve(binding.artifact_ref))!==binding.artifact_digest)return {ok:false};
  if(binding.validator_ref==='contextbench.round4.verify:run'){
    const x=JSON.parse(readFileSync(binding.artifact_ref));if(x.scheduled_cells!==16||x.all_scheduled_outcomes_accounted!==true)return {ok:false};
  }else if(binding.validator_ref==='contextbench.round4.verify:score'){
    const x=JSON.parse(readFileSync(binding.artifact_ref));if(x.scheduled_cells!==16||x.native_scored_cells!==13||x.unknown_usage_calls!==0)return {ok:false};
  }else if(binding.validator_ref==='contextbench.round4.verify:review'){
    const x=JSON.parse(readFileSync(binding.artifact_ref));
    if(x.benchmark_cleared!==false||!x.primary_hypothesis_decision_ref||!x.instrument_decision_ref||!x.successor_hypotheses_ref)return {ok:false};
    const primary=read('round4-selected-hypothesis-review.json'),instrument=read('round4-instrument-learning.json'),successor=read(x.successor_hypotheses_ref);
    if(!primary.records.some(r=>r.record_id===x.primary_hypothesis_decision_ref)||!instrument.records.some(r=>r.record_id===x.instrument_decision_ref)||successor.selection.selected!==x.selected_successor_ref)return {ok:false};
  }else return {ok:false};
  return {ok:true,binding};
}

export function review(){
  const report=outcome();write('round4-outcome-review.json',report);
  const rs=records(report);
  write('round4-selected-hypothesis-review.json',{records:[rs.h1,rs.experiment,rs.h1Observation,rs.h1Decision],reviewer:'executing parent agent',continuity_ref:'round4-continuity.json',authority_effect:'none',benchmark_cleared:false,open_questions_ref:'PROTOCOL-round4.md#open-questions'});
  write('round4-instrument-learning.json',{records:[rs.h7,rs.h7Observation,rs.h7Decision],reviewer:'executing parent agent',claim_ceiling:'Narrow instrument evidence; no isolated H7 causal efficacy or benchmark claim.',authority_effect:'none',benchmark_cleared:false,open_questions_ref:'PROTOCOL-round4.md#open-questions'});
  const next=successors(rs);write('hypotheses-round5.json',next);
  const closeout={schema_version:'are.contextbench-round-closeout/v1',round:'contextbench-development-round4',freeze_ref:'freeze-round4.json',run_completion_ref:'/tmp/are-contextbench-round4/sequence/completed.json',analysis_refs:['round4-analysis.json','round4-traces.json','round4-outcome-review.json'],scheduled_cells:16,attempted_cells:16,native_scored_cells:13,complete_pairs:5,total_model_tokens:report.total_model_tokens,unknown_usage_calls:0,delivered_deferrals:17,context_budget_stops:0,status_counts:report.status_counts,primary_hypothesis_decision_ref:rs.h1Decision.record_id,instrument_decision_ref:rs.h7Decision.record_id,successor_hypotheses_ref:'hypotheses-round5.json',selected_successor_ref:next.selection.selected,benchmark_cleared:false,claim_ceiling:report.claim_ceiling,authority_effect:'none',open_questions_ref:'PLAN-round5.md#open-questions'};
  write('round4-closeout.json',closeout);
  const built=build(),freezeState=read('work-state-frozen-v4.json');
  const evidence=(criterion,artifact)=>[{criterion_id:criterion,artifact_ref:artifact,artifact_digest:fileSha(resolve(artifact))}];
  const events=[...freezeState.events,{event_id:'r4-run-start',task_id:'contextbench.round4.run',action:'start'},{event_id:'r4-run-complete',task_id:'contextbench.round4.run',action:'complete',evidence:evidence('all-scheduled-attempts-accounted','/tmp/are-contextbench-round4/sequence/completed.json')},{event_id:'r4-score-start',task_id:'contextbench.round4.score',action:'start'},{event_id:'r4-score-complete',task_id:'contextbench.round4.score',action:'complete',evidence:evidence('independent-native-scores-and-token-accounting',path('round4-outcome-review.json'))},{event_id:'r4-review-start',task_id:'contextbench.round4.review',action:'start'},{event_id:'r4-review-complete',task_id:'contextbench.round4.review',action:'complete',evidence:evidence('reviewed-learning-decision-and-successor',path('round4-closeout.json'))}];
  const state=replayResearchWork({plan:built.plan,registrations:built.registrations,events,verify_evidence:verifyEvidence,verify_registration:verifyPredecessor});
  if(state.tasks.some(t=>t.state!=='completed'))throw Error('round4.work-not-closed');write('work-state-closed-v4.json',state);
  return {attempted:16,native_scores:13,complete_pairs:5,model_tokens:report.total_model_tokens,span_gain:report.complete_pair_macro.span_f1_gain,benchmark_cleared:false,h1_decision:rs.h1Decision.record_id,h7_decision:rs.h7Decision.record_id,next:next.selection.selected};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(review()));
