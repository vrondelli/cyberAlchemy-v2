// Fixed accounting for pinned benchmark identities with no public task prompt.
// Open questions: README.md. This module performs no provider or repository effect.
const unavailableReason='pinned-dataset-public-problem-statement-null';

export function classifyInputAvailability(task){
  const status=task?.input_status??'ready';
  if(status==='ready')return{available:true,reason:null};
  if(status==='input-unavailable'&&task?.input_reason===unavailableReason)return{available:false,reason:unavailableReason};
  throw Error(`input-availability.invalid:${task?.instance_id??'unknown'}`);
}

export function unavailablePreflightRow(cell,reason){
  return{instance_id:cell.instance_id,status:'input_unavailable',error:reason,model_calls:0,tokenizer_receipts:[],admissions:[],output_path:null};
}

export function unavailableBranchRows(prefix,branches,reason){
  return branches.map(branch=>({cell_id:branch.cell_id,prefix_cell_id:prefix.cell_id,instance_id:branch.instance_id,status:'not_started_input_unavailable',prefix_status:'input_unavailable',reason}));
}
