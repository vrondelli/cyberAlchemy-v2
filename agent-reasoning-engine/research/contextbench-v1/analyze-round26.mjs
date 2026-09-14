import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const root='agent-reasoning-engine/research/contextbench-v1/';
const read=name=>JSON.parse(readFileSync(root+name));
const write=(name,value)=>{const path=root+name,bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round26.analysis-drift');}else writeFileSync(path,bytes,{flag:'wx'});};

export function analyze(){
  const report=read('round26-outcome-review.json'),prior=read('round25-outcome-review.json'),failures=JSON.parse(readFileSync('/home/vrondelli/.cache/are/contextbench-round26-live/sequence/local-failures.json')).rows;
  const state=report.rows.filter(row=>row.state_arm==='state'),control=report.rows.filter(row=>row.state_arm==='control');
  const failed=report.rows.filter(row=>row.status==='run_error');
  const unknownReservation=JSON.parse(readFileSync('/home/vrondelli/.cache/are/contextbench-round26-live/r26-03-control-rep2-8k/result.json')).admissions.at(-1).request_reservation;
  const knownDifference=report.model_accounting.cumulative_branch_tokens.difference;
  const result={schema_version:'are.contextbench-round26-novelty-analysis/v1',status:'reviewed',hypothesis_ref:read('hypotheses-round26.json').selection.selected,
    denominator:{scheduled_pairs:24,complete_native_pairs:report.complete_native_pairs,executed_branches:report.accounted.executed_branches,skipped_branches:report.accounted.skipped_branches,failed_branches:failed.length},
    quality:{scheduled_span_f1_gain:report.gate_review.scheduled_zero_filled_span_f1_gain,required:0.05,scheduled_file_f1_gain:report.gate_review.scheduled_zero_filled_file_f1_gain,complete_pair_mean_span_f1_gain:report.gate_review.complete_pair_mean_span_f1_gain,valid_completion_difference:report.gate_review.valid_completions.difference},
    token_cost:{known_control:report.model_accounting.cumulative_branch_tokens.control,known_state:report.model_accounting.cumulative_branch_tokens.state,known_difference:knownDifference,unknown_control_receipt_maximum_reservation:unknownReservation,state_minus_control_lower_bound_if_unknown_fully_charged_to_control:knownDifference-unknownReservation,decisive_nonincrease_failure:knownDifference-unknownReservation>0},
    novelty_mechanism:{round25_presentations:prior.state_exposure.presentations,round26_presentations:report.state_exposure.presentations,round26_suppressions:report.state_exposure.suppressions,round26_decisions:report.state_exposure.presentations+report.state_exposure.suppressions,round26_state_tokens:state.reduce((sum,row)=>sum+row.state_tokens,0),round26_state_model_calls:state.reduce((sum,row)=>sum+row.model_calls,0),round26_control_model_calls:control.reduce((sum,row)=>sum+row.model_calls,0),round26_state_recycles:state.reduce((sum,row)=>sum+(row.recycles??0),0),round26_control_recycles:control.reduce((sum,row)=>sum+(row.recycles??0),0),exact_dispatch_decisions:report.gate_review.exact_state_presentation_on_dispatched_state_prompts,selector_violations:report.path_balance.violations.length},
    transport:{local_tokenizer_failures:failures.filter(row=>row.scope==='local-branch'&&row.failure_family==='tokenizer-transport').length,failed_control_branches:failed.filter(row=>row.state_arm==='control').length,failed_state_branches:failed.filter(row=>row.state_arm==='state').length,unknown_model_receipts:report.model_accounting.unknown_model_receipts,reviewed_timeout_ref:'round26-timeout-adjudication.json'},
    conclusion:'H42 is falsified. Novelty gating executed exactly and suppressed unchanged state, but it did not retain the Round 25 quality gain and treatment still used decisively more model tokens than control. Per the registered stopping rule, selector variants stop and H44 oracle/placebo calibration is next.',
    limitations:['One reviewed control model timeout prevents exact token accounting, but its maximum reservation cannot reverse the token comparison.','Five local tokenizer timeouts and twelve prefix-ineligible branches reduce the complete native-pair count to thirteen.','This exposed 8K development result does not establish repair correctness, transfer, untouched confirmation, or ContextBench clearance.'],
    authority_effect:'none',benchmark_cleared:false,open_questions_ref:'PLAN-round26.md#open-questions'};
  write('round26-novelty-analysis.json',result);return result;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(analyze()));
