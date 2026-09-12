import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createResearchExperiment,verifyEvolutionRecord} from '../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {sha} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/verify-freeze.mjs';
const root='agent-reasoning-engine/research/contextbench-v1/',read=name=>JSON.parse(readFileSync(root+name)),write=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n',path=root+name;if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round17.drift:'+name);}else writeFileSync(path,bytes,{flag:'wx'});};

export function prepare(){
  const prior=read('development-matrix-v16.json'),hypotheses=read('hypotheses-round17.json'),selected=hypotheses.records.find(record=>record.record_id===hypotheses.selection.selected);
  const rename=cell=>{const value=structuredClone(cell);value.cell_id=value.cell_id.replace(/^r16-/,'r17-');if(value.prefix_cell_id)value.prefix_cell_id=value.prefix_cell_id.replace(/^r16-/,'r17-');value.limits.incomplete_output_corrections=2;return value;};
  const prefixes=prior.prefixes.map(rename),branches=prior.branches.map(rename),success_criteria={...prior.success_criteria,maximum_incomplete_output_corrections_per_cell:2,two_length_then_success_completes:true,third_length_stops:true};
  const matrix={...prior,round:'contextbench-development-round17',hypothesis_ref:selected.record_id,prefixes,branches,cells:[...prefixes,...branches],success_criteria,selection:'Separately versioned replication after Round 16 supported H26 but stopped on a second fully accounted length response. H27 changes only the common bounded incomplete-output correction maximum from one to two.',predecessor_closeout_ref:'round16-closeout.json',protocol_ref:'PLAN-round17.md',continuity_ref:'round17-continuity.json',instrument_review_ref:'bounded-incomplete-output-review-v1.json',treatment:'Unchanged evidence-only state after one exact shared prefix. Both arms share the bounded two-correction policy; state projection remains the only arm difference.',claim_ceiling:'Exposed GLM-5.3-flash 8K causal development study; no reserved confirmation, larger-window, correctness, transfer, or ContextBench clearance claim.',open_questions_ref:'PLAN-round17.md#open-questions'};
  write('development-matrix-v17.json',matrix);
  const experiment=createResearchExperiment({hypothesis_ref:selected.record_id,research_question:selected.experiment_template.research_question,baseline_ref:'development-matrix-v17.json:shared-prefix-control',treatment_ref:'development-matrix-v17.json:shared-prefix-evidence-only-state',metrics:selected.metrics,dataset_refs:['development-matrix-v17.json@'+sha(readFileSync(root+'development-matrix-v17.json'))],required_repetitions:3,success_criteria:{...success_criteria,protocol_ref:'PLAN-round17.md'},stop_conditions:selected.experiment_template.stop_conditions,observation_refs:[]});
  if(!verifyEvolutionRecord(experiment,experiment.schema_version).ok)throw Error('round17.experiment');write('experiment-round17.json',experiment);
  return{tasks:8,prefixes:8,branches:48,cells:56,incomplete_output_corrections:2,selected:selected.record_id,experiment:experiment.record_id,model_calls:0,authority_effect:'none'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(prepare()));
