// Recover Round 59 scoring from its immutable live evidence after the original
// scorer applied the Round 52 always-active validator. No model call occurs.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {scoreRound52} from '../score-round52.mjs';
import {validateConditionalTerminalEvidenceHandlePair} from '../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/conditional-terminal-evidence-handle-validation.mjs';
import {applyBoundedFailureCensoring} from '../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/censored-pair-accounting.mjs';

const read=path=>JSON.parse(readFileSync(path));
const writeExact=(path,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round59-recovery.output-drift:'+path);}else writeFileSync(path,bytes,{flag:'wx'});};
const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
const metricKeys=['span_coverage','span_precision','span_f1','file_coverage','file_precision'];

function recomputeValidation({row,liveRoot}){
  const prefix=read(resolve(liveRoot,row.pair_validation.prefix_cell_id,'result.json'));
  const controlPath=resolve(liveRoot,row.pair_validation.control_cell_id,'result.json');
  const treatmentPath=resolve(liveRoot,row.pair_validation.treatment_cell_id,'result.json');
  if(!existsSync(controlPath)||!existsSync(treatmentPath))return {instance_id:row.instance_id,prefix_cell_id:row.pair_validation.prefix_cell_id,control_cell_id:row.pair_validation.control_cell_id,treatment_cell_id:row.pair_validation.treatment_cell_id,ok:false,issues:[{code:'terminal-handles-conditional.unstarted-pair'}],measurements:{}};
  return {instance_id:row.instance_id,prefix_cell_id:row.pair_validation.prefix_cell_id,control_cell_id:row.pair_validation.control_cell_id,treatment_cell_id:row.pair_validation.treatment_cell_id,...validateConditionalTerminalEvidenceHandlePair({prefix,control:read(controlPath),treatment:read(treatmentPath),minimum_handles:3,maximum_state_tokens:160,maximum_state_bytes:1024,maximum_handles:3,minimum_input_token_reduction:128,maximum_paired_token_difference:3072,total_token_limit:96000})};
}

export async function scoreRound59ConditionalRecovery({freezePath,liveRoot,rawReportPath,reportPath}){
  // The original scorer performs freeze verification, branch reconstruction,
  // native scoring, and fixed-denominator accounting. Its raw report remains
  // immutable evidence of the mismatch and supplies branch metrics here.
  const raw=await scoreRound52({freezePath,liveRoot,reportPath:rawReportPath});
  const pairValidations=raw.rows.map(row=>recomputeValidation({row,liveRoot}));
  let rows=raw.rows.map((row,index)=>({...row,pair_validation:pairValidations[index]}));
  const censoring=applyBoundedFailureCensoring({rows,prefixRows:raw.prefixes,localFailures:raw.local_failures,maximumIndeterminateCalls:2,minimumCompletePairs:6,totalTokenLimit:96000});
  rows=censoring.rows;
  const control={},treatment={},gains={};
  for(const key of metricKeys){control[key]=mean(rows.map(row=>row.control[key]));treatment[key]=mean(rows.map(row=>row.treatment[key]));gains[key]=treatment[key]-control[key];}
  const complete=pairValidations.filter(row=>row.ok),active=complete.filter(row=>row.measurements.activation==='active'),inactive=complete.filter(row=>row.measurements.activation==='inactive');
  const uncensoredBranches=rows.filter(row=>!row.censored).flatMap(row=>[row.control,row.treatment]);
  const controlValid=rows.filter(row=>row.control.valid).length,treatmentValid=rows.filter(row=>row.treatment.valid).length;
  const instrumentChecks={
    ...censoring.checks,
    fixed_denominator:rows.length===8&&new Set(rows.map(row=>row.instance_id)).size===8,
    no_automatic_retries:raw.evaluation.instrument.checks.no_automatic_retries===true,
    independent_reconstruction:uncensoredBranches.every(row=>row.independent_reconstruction_agrees),
    complete_pair_causal_validation:complete.length===censoring.accounting.complete_pairs,
    terminal_decision_boundary:complete.every(row=>row.measurements.phase==='terminal'),
    held_response_zero_effect:raw.evaluation.instrument.checks.held_response_zero_effect===true,
    control_has_no_state:complete.every(row=>row.measurements.control_state_presentations===0),
    treatment_state_once:complete.every(row=>row.measurements.treatment_state_presentations===1&&row.measurements.treatment_state_tokens<=160&&row.measurements.treatment_state_bytes<=1024&&row.measurements.private_handle_count<=3),
    activation_partition:active.length===3&&inactive.length===4&&active.length+inactive.length===complete.length,
    active_threshold_and_reduction:active.every(row=>row.measurements.activation_minimum_handles===3&&row.measurements.activation_observed_handles===3&&row.measurements.first_request_input_token_difference<=-128),
    active_added_full_ids_zero:active.every(row=>row.measurements.treatment_added_full_read_id_occurrences===0),
    active_inherited_ids_paired:active.every(row=>row.measurements.inherited_full_read_id_occurrences_paired===true&&row.measurements.common_prompt_byte_equivalent===true),
    inactive_control_equivalence:inactive.every(row=>row.measurements.activation_minimum_handles===3&&row.measurements.activation_observed_handles<3&&row.measurements.inactive_prompt_equivalent===true&&row.measurements.first_request_input_token_difference===0),
    paired_token_bound:complete.every(row=>row.measurements.paired_token_difference<=3072)
  };
  const controlLogical=rows.reduce((sum,row)=>sum+row.control.conservative_model_tokens,0),treatmentLogical=rows.reduce((sum,row)=>sum+row.treatment.conservative_model_tokens,0);
  const semanticChecks={span_f1_gain:gains.span_f1>=0.05,span_coverage_nondegrade:gains.span_coverage>=0,span_precision_nondegrade:gains.span_precision>=0,file_coverage_nondegrade:gains.file_coverage>=0,file_precision_nondegrade:gains.file_precision>=0,valid_selection_nondegrade:treatmentValid>=controlValid,aggregate_treatment_tokens_not_above_control:treatmentLogical<=controlLogical};
  const instrumentPassed=Object.values(instrumentChecks).every(Boolean),semanticInterpretable=instrumentPassed&&censoring.accounting.complete_pairs>=6,semanticPassed=semanticInterpretable&&Object.values(semanticChecks).every(Boolean);
  const evaluation={control,treatment,gains,valid_selections:{control:controlValid,treatment:treatmentValid},exact_unknown_model_receipts:raw.evaluation.exact_unknown_model_receipts,instrument:{...censoring.accounting,active_pairs:active.length,inactive_pairs:inactive.length,checks:instrumentChecks,passed:instrumentPassed},semantic:{interpretable:semanticInterpretable,checks:semanticChecks,passed:semanticPassed},passed:instrumentPassed&&semanticPassed};
  const report={...raw,schema_version:'are.contextbench-round59-conditional-recovery/v1',status:evaluation.passed?'complete-accounted-canary-passed':instrumentPassed?'complete-accounted-semantic-failed':'instrument-failed',recovery:{reason:'The original score-round52 validator assumed terminal-handle substitution was active for every pair.',source_report:rawReportPath,model_calls_added:0},model_accounting:{...raw.model_accounting,control_logical_model_token_upper_bound:controlLogical,treatment_logical_model_token_upper_bound:treatmentLogical,treatment_minus_control_conservative_tokens:treatmentLogical-controlLogical},evaluation,pair_validations:pairValidations,rows,benchmark_cleared:false,claim_ceiling:'Fresh GLM-5.3-flash 10K conditional development canary only; passing selects independent confirmation but does not clear ContextBench.',open_questions_ref:'round59-hypotheses.json'};
  writeExact(reportPath,report);return report;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const [freezePath,liveRoot,rawReportPath,reportPath]=process.argv.slice(2);if(!reportPath)throw Error('freeze live-root raw-report report required');const report=await scoreRound59ConditionalRecovery({freezePath,liveRoot,rawReportPath,reportPath});console.log(JSON.stringify({status:report.status,gains:report.evaluation.gains,instrument:report.evaluation.instrument,semantic:report.evaluation.semantic,model_accounting:report.model_accounting}));}
