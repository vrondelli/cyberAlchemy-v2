// Compare retained-state breadth and final selections without reading gold annotations.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,resolve} from 'node:path';

const researchRoot=resolve('agent-reasoning-engine/research/contextbench-v1');
const liveRoot=round=>`/home/vrondelli/.cache/are/contextbench-round${round}-live`;
const read=path=>JSON.parse(readFileSync(path));
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const f1=x=>x&&Number.isFinite(x.coverage)&&Number.isFinite(x.precision)
  ? (x.coverage+x.precision===0?0:2*x.coverage*x.precision/(x.coverage+x.precision)):0;

function traceSummary(round){
  const reviewPath=resolve(researchRoot,`round${round}-outcome-review.json`),review=read(reviewPath),cells=[];
  for(const row of review.rows.filter(row=>row.state_arm==='state'&&row.status!=='not_started_prefix_ineligible')){
    const path=resolve(liveRoot(round),row.cell_id,'result.json'),result=read(path),presentations=result.task_state_presentations??[],selected=result.selection?.final_read_ids??[];
    const any=new Set(presentations.flatMap(item=>(item.evidence??[]).map(e=>e.read_id)));
    const last=new Set((presentations.at(-1)?.evidence??[]).map(e=>e.read_id));
    cells.push({cell_id:row.cell_id,status:row.status,presentations:presentations.length,
      distinct_presented_read_ids:any.size,last_projection_read_ids:last.size,selected_read_ids:selected.length,
      selected_seen_in_any_projection:selected.filter(id=>any.has(id)).length,
      selected_seen_in_last_projection:selected.filter(id=>last.has(id)).length,
      projection_evictions:presentations.reduce((sum,item)=>sum+(item.truncation?.evicted_evidence??0),0),
      span_f1:row.span_f1??0,file_f1:row.file_f1??0});
  }
  const valid=cells.filter(row=>row.status==='final_context_selected');
  return {round,state_cells:cells.length,valid_selected_cells:valid.length,
    presentations:cells.reduce((sum,row)=>sum+row.presentations,0),
    distinct_presented_read_ids_summed_by_cell:cells.reduce((sum,row)=>sum+row.distinct_presented_read_ids,0),
    selected_read_ids:valid.reduce((sum,row)=>sum+row.selected_read_ids,0),
    selected_seen_in_any_projection:valid.reduce((sum,row)=>sum+row.selected_seen_in_any_projection,0),
    selected_seen_in_last_projection:valid.reduce((sum,row)=>sum+row.selected_seen_in_last_projection,0),
    cells_with_every_selected_id_in_projection:valid.filter(row=>row.selected_read_ids===row.selected_seen_in_any_projection).length,
    projection_evictions:cells.reduce((sum,row)=>sum+row.projection_evictions,0)};
}

const reviewPath=resolve(researchRoot,'round22-outcome-review.json'),review=read(reviewPath);
const grouped=new Map();
for(const row of review.rows){
  const key=`${row.instance_id}\0${row.repetition}`;
  if(!grouped.has(key))grouped.set(key,{});
  grouped.get(key)[row.state_arm]=row;
}
const pairs=[...grouped.values()].map(({control,state})=>({instance_id:control.instance_id,repetition:control.repetition,
  control_status:control.status,state_status:state.status,
  span_f1_difference:(state.span_f1??0)-(control.span_f1??0),file_f1_difference:(state.file_f1??0)-(control.file_f1??0),
  cumulative_model_token_difference:(state.cumulative_model_tokens??0)-(control.cumulative_model_tokens??0)}));
const byInstance=[];
for(const instance of [...new Set(pairs.map(pair=>pair.instance_id))]){
  const rows=pairs.filter(pair=>pair.instance_id===instance),n=rows.length;
  byInstance.push({instance_id:instance,repetitions:n,
    mean_span_f1_difference:rows.reduce((sum,row)=>sum+row.span_f1_difference,0)/n,
    mean_file_f1_difference:rows.reduce((sum,row)=>sum+row.file_f1_difference,0)/n,
    valid_completion_difference:rows.filter(row=>row.state_status==='final_context_selected').length-rows.filter(row=>row.control_status==='final_context_selected').length,
    cumulative_model_token_difference:rows.reduce((sum,row)=>sum+row.cumulative_model_token_difference,0)});
}
const result={schema_version:'are.contextbench-state-selection-analysis/v1',round:22,
  source_refs:[20,21,22].map(round=>({path:`round${round}-outcome-review.json`,sha256:sha(resolve(researchRoot,`round${round}-outcome-review.json`))})),
  gate_review:review.gate_review,
  projection_history:[20,21,22].map(traceSummary),
  task_effects:byInstance,
  largest_positive_pairs:[...pairs].sort((a,b)=>b.span_f1_difference-a.span_f1_difference).slice(0,5),
  largest_negative_pairs:[...pairs].sort((a,b)=>a.span_f1_difference-b.span_f1_difference).slice(0,5),
  observations:[
    'Round 22 path balancing passed its exact four-path/two-handle constraint but did not pass the development gate.',
    'Relative to Rounds 20 and 21, Round 22 reduced distinct state-exposed read IDs while increasing recorded evidence evictions.',
    'Only 10 of 35 finally selected read IDs had appeared in a prior Round 22 state projection; this is descriptive because many final reads occur after the last recycle.',
    'Effects remain heterogeneous across tasks and repetitions, so the aggregate improvement does not establish a stable semantic benefit.',
    'A broader one-handle-per-path state is the next discriminating test: it removes duplicate-path frequency while preserving more path diversity than the four-path/two-handle policy.'
  ],
  selected_successor_mechanism:{maximum_paths:8,maximum_distinct_handles_per_path:1,ordering:'chronological-after-selection',semantic_claim:'observed-not-relevant'},
  causal_limits:['Historical cross-round comparisons include fresh stochastic samples.','Final-selection overlap does not prove that a state item caused retrieval or selection.','No gold annotations or source bodies were read by this analysis.'],
  authority_effect:'none',open_questions_ref:'PLAN-round23.md#open-questions'};
const out=resolve(researchRoot,'round22-state-selection-analysis.json'),bytes=JSON.stringify(result,null,2)+'\n';
if(existsSync(out)&&readFileSync(out,'utf8')!==bytes)throw Error('round22.selection-analysis-drift');
if(!existsSync(out))writeFileSync(out,bytes,{flag:'wx'});
console.log(JSON.stringify({ok:true,artifact:basename(out),projection_history:result.projection_history,selected_successor_mechanism:result.selected_successor_mechanism}));
