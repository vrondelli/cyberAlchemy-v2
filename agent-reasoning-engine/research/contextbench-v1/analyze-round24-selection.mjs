import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {bindDelivery} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/';
const live='/home/vrondelli/.cache/are/contextbench-round24-live/';
const report=JSON.parse(readFileSync(root+'round24-outcome-review.json'));
const rows=[];
for(const pair of report.pairs){
  const resultPath=live+pair.state_cell_id+'/result.json';if(!existsSync(resultPath))continue;
  const result=JSON.parse(readFileSync(resultPath)),delivered=bindDelivery(result).read_observations,byId=new Map(delivered.map(item=>[item.id,item]));
  const projectedIds=new Set(),metrics={slots:0,narrow_slots:0,replaceable_slots:0,projected_lines:0,widest_available_lines:0};
  for(const presentation of result.task_state_presentations??[])for(const evidence of presentation.evidence??[]){
    const selected=byId.get(evidence.read_id);if(!selected)throw Error('round24.analysis-unbound:'+evidence.read_id);
    projectedIds.add(evidence.read_id);metrics.slots++;
    const width=selected.end_line-selected.start_line+1,widest=Math.max(...delivered.filter(item=>item.path===selected.path).map(item=>item.end_line-item.start_line+1));
    metrics.projected_lines+=width;metrics.widest_available_lines+=widest;if(width===1)metrics.narrow_slots++;if(widest>width)metrics.replaceable_slots++;
  }
  const finalIds=result.selection?.final_read_ids??[],directUses=finalIds.filter(id=>projectedIds.has(id)).length;
  rows.push({cell_id:pair.state_cell_id,instance_id:pair.instance_id,repetition:pair.repetition,status:pair.state_status,scheduled_span_f1_delta:pair.scheduled_span_f1_delta,model_token_delta:pair.model_token_delta,presentations:(result.task_state_presentations??[]).length,unique_projected_handles:projectedIds.size,...metrics,projected_width_ratio:metrics.widest_available_lines?metrics.projected_lines/metrics.widest_available_lines:null,final_selected_handles:finalIds.length,final_selected_handles_previously_projected:directUses});
}
const sum=key=>rows.reduce((total,row)=>total+row[key],0),branchesDirect=rows.filter(row=>row.final_selected_handles_previously_projected>0).length;
const artifact={schema_version:'are.contextbench-round24-state-selection-analysis/v1',round:24,hypothesis_ref:JSON.parse(readFileSync(root+'hypotheses-round24.json')).selection.selected,source_result_ref:'round24-outcome-review.json',observations:{executed_state_branches:rows.length,state_presentations:sum('presentations'),projected_slots:sum('slots'),single_line_slots:sum('narrow_slots'),replaceable_by_wider_same_path_slots:sum('replaceable_slots'),projected_lines:sum('projected_lines'),widest_available_same_path_lines:sum('widest_available_lines'),projected_width_ratio:sum('projected_lines')/sum('widest_available_lines'),final_selected_handles:sum('final_selected_handles'),final_selected_handles_previously_projected:sum('final_selected_handles_previously_projected'),branches_with_direct_projected_handle_use:branchesDirect},interpretation:['The policy preserved path identity but often replaced broad source context with a later narrow observation from the same path.','Handle metadata has nearly constant projection size regardless of referenced span width, so widest-handle selection can preserve more recoverable source without adding state slots.','Direct final-handle reuse is partial; the treatment can also change later search and retrieval, so a new causal round is required.'],rows,limitations:['Span width is a deterministic coverage proxy, not inferred semantic relevance.','A wider read can include irrelevant lines; H40 remains falsifiable by native quality, validity, and cumulative model tokens.','Round 24 is an exposed development sample and does not establish transfer, repair correctness, confirmation, or clearance.'],authority_effect:'none',open_questions_ref:'PLAN-round25.md#open-questions'};
const path=root+'round24-state-selection-analysis.json',bytes=JSON.stringify(artifact,null,2)+'\n';
if(existsSync(path)){if(readFileSync(path,'utf8')!==bytes)throw Error('round24.analysis-drift');}else writeFileSync(path,bytes,{flag:'wx'});
console.log(JSON.stringify(artifact.observations));
