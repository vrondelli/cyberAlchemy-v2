import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHypothesisObservation,createLearningDecision} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';

const root=resolve('agent-reasoning-engine/research/contextbench-v1');
const read=name=>JSON.parse(readFileSync(resolve(root,name)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const write=(name,value)=>{const target=resolve(root,name),bytes=JSON.stringify(value,null,2)+'\n';if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round41.closeout-drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

export function close(){
  const outcomeBytes=readFileSync(resolve(root,'round41-interrupted-outcome.json'));
  const outcome=JSON.parse(outcomeBytes),hypotheses=read('hypotheses-round41.json');
  const selected=hypotheses.records.find(record=>record.record_id===hypotheses.selection.selected);
  if(!selected||outcome.observed.prefixes_started!==1||outcome.observed.complete_pairs!==0||outcome.interruption.error!=='glm.deadline-exceeded')throw Error('round41.closeout-input');
  const supporting=createHypothesisObservation({
    hypothesis_ref:selected.record_id,source_result_ref:resolve(root,'round41-interrupted-outcome.json'),source_result_digest:sha(outcomeBytes),observation_kind:'supporting',phase:'experiment',
    claim:'The first frozen prefix completed 29 responses and seven 8K recycling transitions with known cumulative usage of 77,704 tokens. The unchanged ARE loop therefore exercised sustained small-window continuity before the provider failure.',
    evaluator_id:'contextbench.round41.interruption-audit',evidence_refs:['round41-interrupted-outcome.json','round41-interrupted-cleanup.json'],
    observed_markers:['29 successful model responses','7 recycling transitions','77,704 known model tokens','zero automatic retries'],
    limitations:['No control/treatment review pair was reached.','This supports runtime continuity only and does not estimate H62 quality.']
  });
  const counter=createHypothesisObservation({
    hypothesis_ref:selected.record_id,source_result_ref:resolve(root,'round41-interrupted-outcome.json'),source_result_digest:sha(outcomeBytes),observation_kind:'counterevidence',phase:'experiment',
    claim:'Request 30 reached the new 900-second deadline with zero response bytes and absent provider usage. Increasing the deadline did not make a complete frozen cohort feasible, while the admitted request still provides a conservative 3,736-token upper bound.',
    evaluator_id:'contextbench.round41.frozen-stop',evidence_refs:['round41-interrupted-outcome.json','round41-interrupted-cleanup.json'],
    observed_markers:['latency 900,526 ms','response bytes 0','one unknown-usage receipt','request upper bound 3,736 tokens','physical conservative upper bound 81,440 tokens','0/8 complete pairs'],
    limitations:['No retry, replacement, branch, or later task occurred.','The provider failure is not evidence against the compact-slate semantics.']
  });
  const decision=createLearningDecision({
    hypothesis_ref:selected.record_id,observation_refs:[supporting.record_id,counter.record_id],experiment_ref:read('experiment-round41.json').record_id,disposition:'inconclusive',
    reason_codes:['quality.no-paired-estimate','provider.deadline-repeated','integrity.no-rerun','cost.conservative-bound-available','method.infrastructure-blocks-hypothesis-test'],supporting_count:1,counterevidence_count:1,experiment_support_count:1,
    next_action:'Keep H62 and its sole compact-slate difference unchanged. Test a new harness hypothesis: an indeterminate zero-byte transport call with zero retries must debit its admitted input-plus-output upper bound, retain the affected task as a symmetric fixed-denominator zero, and permit later independent tasks. Require all tasks accounted, bounded total cost, and a preregistered minimum number of complete pairs before interpreting quality.'
  });
  const closeout={schema_version:'are.contextbench-round41-closeout/v1',round:41,status:'interrupted-frozen-development-run-provider-deadline',objective_hierarchy:{enduring:'Improve reusable ARE reasoning and completed outcomes within cumulative model input plus output tokens.',initial:'Finish GLM-5.3-flash qualification, beginning with small context windows.',milestone:'Clear fixed ContextBench gates before moving to larger windows.'},research_method:'objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor',records:[supporting,counter,decision],outcome_ref:'round41-interrupted-outcome.json',selected_successor:'bounded indeterminate-usage debit and independent-task continuation, with H62 retained',benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round41.md#open-questions'};
  write('round41-closeout.json',closeout);
  const plan=read('work-plan-v41.json');plan.status=closeout.status;plan.completed=plan.tasks.map(task=>task.task_id);plan.frontier=[];plan.benchmark_cleared=false;plan.evidence_refs=['round41-matrix.json','freeze-round41-execution.json','round41-interrupted-outcome.json','round41-interrupted-cleanup.json','round41-closeout.json'];write('work-plan-v41-closed.json',plan);
  return{status:closeout.status,decision:decision.record_id,next_action:decision.next_action};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(close()));
