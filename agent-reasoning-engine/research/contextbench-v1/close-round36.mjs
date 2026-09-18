import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHypothesisObservation,createLearningDecision} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';

const root=resolve('agent-reasoning-engine/research/contextbench-v1');
const read=name=>JSON.parse(readFileSync(resolve(root,name)));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const write=(name,value)=>{const path=resolve(root,name),body=JSON.stringify(value,null,2)+'\n';if(existsSync(path)){if(readFileSync(path,'utf8')!==body)throw Error('round36.closeout-drift:'+name);}else writeFileSync(path,body,{flag:'wx'});};

export function close(){
  const bytes=readFileSync(resolve(root,'round36-interrupted-outcome.json'));
  const outcome=JSON.parse(bytes),hypotheses=read('hypotheses-round36.json');
  const selected=hypotheses.records.find(row=>row.record_id===hypotheses.selection.selected);
  if(!selected||outcome.interruption?.error!=='gold.empty-context'||outcome.observed.complete_pairs!==2)throw Error('round36.closeout-input');
  const supporting=createHypothesisObservation({
    hypothesis_ref:selected.record_id,source_result_ref:resolve(root,'round36-interrupted-outcome.json'),source_result_digest:digest(bytes),observation_kind:'supporting',phase:'experiment',
    claim:'Both scoreable pairs completed with exact shared terminal ancestry, one review call per arm, sole slate exposure, known usage, and bounded paired token differences. Their interrupted fixed-denominator contribution was +0.0093507 macro Span-F1.',
    evaluator_id:'contextbench.round36.interruption-audit',evidence_refs:['round36-interrupted-outcome.json','round36-interrupted-cleanup.json'],
    observed_markers:['2/2 completed pairs structurally valid','paired total-token differences 880 and 794','known physical tokens 252634'],
    limitations:['Six pairs are absent from the fixed denominator.','No capacity-pressure boundary occurred before interruption.']
  });
  const counterevidence=createHypothesisObservation({
    hypothesis_ref:selected.record_id,source_result_ref:resolve(root,'round36-interrupted-outcome.json'),source_result_digest:digest(bytes),observation_kind:'counterevidence',phase:'experiment',
    claim:'The frozen cohort admitted an identity whose sealed gold context was empty. Native scoring stopped after its control branch, so the run could neither test H60 across the full cohort nor produce a canary estimate.',
    evaluator_id:'contextbench.round36.frozen-stop',evidence_refs:['round36-interrupted-outcome.json','round36-interrupted-cleanup.json'],
    observed_markers:['gold.empty-context','3 prefixes started','2 complete pairs','6 incomplete pairs'],
    limitations:['This is experiment-input counterevidence, not evidence that the capacity-boundary mechanism failed.','The frozen task was not replaced and no model call was rerun.']
  });
  const decision=createLearningDecision({
    hypothesis_ref:selected.record_id,observation_refs:[supporting.record_id,counterevidence.record_id],experiment_ref:read('experiment-round36.json').record_id,
    disposition:'inconclusive',reason_codes:['mechanism.completed-pairs-valid','quality.incomplete-positive-signal','experiment.unscoreable-identity-admitted','protocol.global-stop-required'],
    supporting_count:1,counterevidence_count:1,experiment_support_count:1,
    next_action:'Retain H60 unchanged. Before Round 37 cohort lock, project every unexposed identity through a sealed scoreability gate, select only eligible identities from public columns, then run a gold-blind native scorer smoke check for every selected task before freeze.'
  });
  const closeout={schema_version:'are.contextbench-round36-closeout/v1',round:36,status:'interrupted-frozen-development-run-unscoreable-input',objective_hierarchy:{enduring:'Improve reusable ARE reasoning and completed outcomes within cumulative model input plus output tokens.',initial:'Finish GLM-5.3-flash qualification, beginning with small context windows.',milestone:'Clear fixed ContextBench gates before moving to larger windows.'},research_method:'objective → gap → question → competing hypotheses → selection → experiment/tasks/criteria → results → observations → reviewed decision → successor',records:[supporting,counterevidence,decision],outcome_ref:'round36-interrupted-outcome.json',selected_successor:'H60 retained with sealed scoreability admission prerequisite',benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round37.md#open-questions'};
  write('round36-closeout.json',closeout);
  const plan=read('work-plan-v36.json');plan.status=closeout.status;plan.completed=['R36-A','R36-B','R36-C','R36-D','R36-E','R36-F','R36-G','R36-H','R36-I','R36-J','R36-K'];plan.frontier=[];plan.result_refs=['round36-interrupted-outcome.json','round36-interrupted-cleanup.json','round36-closeout.json'];plan.benchmark_cleared=false;plan.open_questions_ref='PLAN-round37.md#open-questions';write('work-plan-v36-closed.json',plan);
  return{status:closeout.status,decision:decision.disposition,next:closeout.selected_successor};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(close()));
