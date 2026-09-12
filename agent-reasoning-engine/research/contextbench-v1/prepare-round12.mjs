// Prepare the separately versioned H22 replication after round-eleven review. No provider calls.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createResearchExperiment,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const read=name=>JSON.parse(readFileSync(root+name));
const write=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',target=root+name;if(existsSync(target)){if(readFileSync(target,'utf8')!==bytes)throw Error('round12.artifact-drift:'+name);}else writeFileSync(target,bytes,{flag:'wx'});};

export function prepare(){
 const prior=read('development-matrix-v11.json'),hypotheses=read('hypotheses-round12.json'),selected=hypotheses.records.find(record=>record.record_id===hypotheses.selection.selected);
 if(!selected)throw Error('round12.selected-hypothesis');
 const cells=[];
 for(let index=0;index<prior.cells.length;index+=2){
  const pair=prior.cells.slice(index,index+2).map(cell=>({...cell,cell_id:cell.cell_id.replace(/^r11-/,'r12-'),provider_profile:{...cell.provider_profile,model_timeout_ms:300000}}));
  cells.push(...pair.reverse());
 }
 const matrix={...prior,round:'contextbench-development-round12',cells,selection:'Same eight exposed GLM-5.3-flash 8K development identities in a separately versioned replication. Round-ten and round-eleven attempts and unstarted cells remain historical. Within-pair order is reversed before freeze.',predecessor_closeout_ref:'round11-closeout.json',protocol_ref:'PLAN-round12.md',continuity_ref:'round12-continuity.json',
  treatment:'Only limits.task_state_projection differs within each pair. A 300000 ms model deadline is common. One-shot state cadence, source, tools, prompt, context, caps, output recovery, terminal policy, provider, scorer, and token accounting are matched.',
  stopping_rules:['No within-round task, source, prompt, cap, threshold, state-mechanism change, replacement, or lucky rerun.','Round-ten and round-eleven outcomes remain historical; every round-twelve cell is a new separately frozen replication identity.','Pause unstarted cells on shared provider or instrument failure and retain every attempted outcome.','Any missing or duplicate recycled-generation presentation, unknown usage, state-cap failure, false fact, false source credit, effect, or correction above one is an instrument failure.'],
  success_criteria:{...prior.success_criteria,complete_pairs:8,paired_macro_span_f1_gain_minimum:0.05,file_f1_non_degradation:true,valid_completion_non_degradation:true,aggregate_treatment_model_tokens_below:396085,unknown_model_usage:0,task_state_presentations_per_generation:1,model_timeout_ms:300000},
  claim_ceiling:'Complete exposed GLM-5.3-flash 8K one-shot boundary-state replication; no larger window, untouched confirmation, repair correctness, semantic-retention, transfer, or clearance claim.',open_questions_ref:'PLAN-round12.md#open-questions'};
 write('development-matrix-v12.json',matrix);
 const experiment=createResearchExperiment({hypothesis_ref:selected.record_id,research_question:selected.experiment_template.research_question,baseline_ref:'development-matrix-v12.json:control',treatment_ref:'development-matrix-v12.json:state',metrics:selected.metrics,dataset_refs:['development-matrix-v12.json@'+sha(readFileSync(root+'development-matrix-v12.json'))],required_repetitions:1,success_criteria:{...matrix.success_criteria,scope:matrix.claim_ceiling,protocol_ref:'PLAN-round12.md'},stop_conditions:matrix.stopping_rules,observation_refs:[]});
 if(!verifyEvolutionRecord(experiment,experiment.schema_version).ok)throw Error('round12.invalid-experiment');
 write('experiment-round12.json',experiment);
 return{tasks:matrix.tasks.length,cells:matrix.cells.length,selected:selected.record_id,experiment:experiment.record_id,model_timeout_ms:300000,authority_effect:'none'};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(prepare()));
