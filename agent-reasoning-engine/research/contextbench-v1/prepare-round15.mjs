import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createResearchExperiment,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const read=name=>JSON.parse(readFileSync(root+name));
const write=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',path=root+name;if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round15.drift:'+name);}else writeFileSync(path,bytes,{flag:'wx'});};

export function prepare(){
  const prior=read('development-matrix-v14.json'),hypotheses=read('hypotheses-round15.json'),selected=hypotheses.records.find(record=>record.record_id===hypotheses.selection.selected);
  const seeds=[];
  for(const cell of prior.cells)if(!seeds.some(item=>item.instance_id===cell.instance_id))seeds.push(cell);
  if(seeds.length!==8)throw Error('round15.task-count');
  const prefixes=[],branches=[];
  for(const [taskIndex,seed] of seeds.entries()){
    const number=String(taskIndex+1).padStart(2,'0'),common={instance_id:seed.instance_id,arm:seed.arm,context_limit:seed.context_limit,recycle_at:seed.recycle_at,safety_margin:seed.safety_margin,provider_profile:seed.provider_profile};
    const limits={...seed.limits,task_state_projection:false,task_state_include_outcomes:false};
    const prefix={...common,cell_id:`r15-${number}-prefix-8k`,cell_kind:'shared-prefix',state_arm:'prefix',repetition:0,limits};
    prefixes.push(prefix);
    for(let repetition=1;repetition<=3;repetition++){
      const stateFirst=(taskIndex+repetition)%2===0,arms=stateFirst?['state','control']:['control','state'];
      for(const stateArm of arms)branches.push({...common,cell_id:`r15-${number}-${stateArm}-rep${repetition}-8k`,cell_kind:'branch',prefix_cell_id:prefix.cell_id,state_arm:stateArm,repetition,
        order_in_pair:arms.indexOf(stateArm)+1,limits:{...limits,task_state_projection:stateArm==='state'}});
    }
  }
  const stateFirst=branches.filter(cell=>cell.order_in_pair===1&&cell.state_arm==='state').length,controlFirst=branches.filter(cell=>cell.order_in_pair===1&&cell.state_arm==='control').length;
  if(stateFirst!==12||controlFirst!==12)throw Error('round15.order-balance');
  const success_criteria={shared_prefix_identity:true,eligible_tasks:8,required_repetitions_per_arm:3,paired_macro_span_f1_gain_minimum:0.05,file_f1_non_degradation:true,valid_completion_non_degradation:true,
    treatment_after_exposure_only:true,control_presentations:0,task_state_presentations_per_generation:1,task_state_projection_mode:'evidence-only',false_projected_facts:0,false_source_credit:0,terminal_repository_effects:0,
    unknown_model_usage:0,per_trajectory_total_model_token_cap:96000,all_prefix_and_branch_model_tokens_accounted:true,no_favorable_repetition_selection:true};
  const stopping_rules=['Any prefix that terminates before its first recycle is retained as instrument-ineligible and is not replaced.','Any snapshot, ancestry, common-policy, receipt or pre-treatment identity mismatch stops that task before branch dispatch.','No within-round task, source, prompt, cap, threshold, state content, repetition count, order, replacement, or lucky rerun.','Record every prefix and branch model input/output token; unknown usage makes the pair ineligible.'];
  const matrix={schema_version:'are.contextbench-development-matrix/v1',round:'contextbench-development-round15',hypothesis_ref:selected.record_id,window_tokens:8000,tasks:prior.tasks,prefixes,branches,cells:[...prefixes,...branches],
    selection:'Same exposed eight-task cohort as Round 14. Generate one exact first-recycle prefix per task, then run three frozen control/state continuations from that prefix with aggregate-balanced branch order.',predecessor_closeout_ref:'round14-closeout.json',protocol_ref:'PLAN-round15.md',continuity_ref:'round15-continuity.json',instrument_review_ref:'shared-prefix-instrument-review-v1.json',
    treatment:'The first post-recycle treatment request adds unchanged evidence-only state exactly once; control omits it. All pre-treatment bytes and effects share one content-addressed prefix.',branch_order:{method:'predeclared alternating schedule over task index plus repetition; no outcome input',state_first_pairs:stateFirst,control_first_pairs:controlFirst},stopping_rules,success_criteria,
    claim_ceiling:'Exposed GLM-5.3-flash 8K causal development study; no reserved confirmation, larger-window, correctness, transfer, or ContextBench clearance claim.',open_questions_ref:'PLAN-round15.md#open-questions',authority_effect:'none'};
  write('development-matrix-v15.json',matrix);
  const experiment=createResearchExperiment({hypothesis_ref:selected.record_id,research_question:selected.experiment_template.research_question,baseline_ref:'development-matrix-v15.json:shared-prefix-control',treatment_ref:'development-matrix-v15.json:shared-prefix-evidence-only-state',metrics:selected.metrics,dataset_refs:['development-matrix-v15.json@'+sha(readFileSync(root+'development-matrix-v15.json'))],required_repetitions:3,success_criteria:{...success_criteria,protocol_ref:'PLAN-round15.md'},stop_conditions:stopping_rules,observation_refs:[]});
  if(!verifyEvolutionRecord(experiment,experiment.schema_version).ok)throw Error('round15.experiment');
  write('experiment-round15.json',experiment);
  return{tasks:8,prefixes:8,branches:48,cells:56,state_first_pairs:stateFirst,control_first_pairs:controlFirst,selected:selected.record_id,experiment:experiment.record_id,model_calls:0,authority_effect:'none'};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(prepare()));
