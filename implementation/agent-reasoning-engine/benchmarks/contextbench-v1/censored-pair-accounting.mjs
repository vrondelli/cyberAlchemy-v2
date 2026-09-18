const metrics=['span_coverage','span_precision','span_f1','file_coverage','file_precision'];
const integer=value=>Number.isSafeInteger(value)&&value>=0;

export function applyBoundedFailureCensoring({rows,prefixRows,localFailures,maximumIndeterminateCalls=2,minimumCompletePairs=6,totalTokenLimit=96000}){
  if(!Array.isArray(rows)||!Array.isArray(prefixRows)||!Array.isArray(localFailures))throw Error('censoring.inputs');
  const bounded=localFailures.filter(row=>row?.failure_family==='model-transport-indeterminate'||row?.failure_family==='tokenizer-transport'||row?.failure_family==='nonterminal-boundary');
  const failureByCell=new Map(bounded.map(row=>[row.cell_id,row]));
  if(failureByCell.size!==bounded.length)throw Error('censoring.duplicate-failure-cell');
  const boundShapeValid=bounded.every(row=>row.failure_family==='nonterminal-boundary'
    ? row.boundary_kind!=='terminal-candidate'&&row.unknown_model_receipts===0&&integer(row.known_model_tokens)&&row.known_model_tokens<=totalTokenLimit
    : row.failure_family==='tokenizer-transport'
    ? row.terminal_kind==='tokenizer'&&row.response_bytes===0&&row.unknown_model_receipts===0&&integer(row.known_model_tokens)&&row.known_model_tokens<=totalTokenLimit
    : row.accounting_posture==='upper-bound-debit'&&row.unknown_model_receipts===1&&integer(row.indeterminate_token_debit)&&row.indeterminate_token_debit===row.input_token_upper_bound+row.output_token_upper_bound&&integer(row.conservative_model_token_upper_bound)&&row.conservative_model_token_upper_bound===row.known_model_tokens+row.indeterminate_token_debit&&row.conservative_model_token_upper_bound<=row.total_token_limit&&row.total_token_limit===totalTokenLimit);
  const observedUnknown=prefixRows.reduce((sum,row)=>sum+(row.unknown_usage_calls??0),0)+rows.reduce((sum,row)=>sum+(row.control.unknown_usage_calls??0)+(row.treatment.unknown_usage_calls??0),0);
  const adjusted=rows.map(row=>{
    const prefixFailure=failureByCell.get(row.pair_validation.prefix_cell_id),controlFailure=failureByCell.get(row.pair_validation.control_cell_id),treatmentFailure=failureByCell.get(row.pair_validation.treatment_cell_id),failures=[prefixFailure,controlFailure,treatmentFailure].filter(Boolean),censored=failures.length>0;
    const arms={};
    for(const name of ['control','treatment']){
      const raw=row[name],branchFailure=name==='control'?controlFailure:treatmentFailure,debit=(prefixFailure?.indeterminate_token_debit??0)+(branchFailure?.indeterminate_token_debit??0),next={...raw,conservative_model_tokens:(raw.model_tokens??0)+debit};
      if(censored){next.uncensored_metrics=Object.fromEntries(metrics.map(key=>[key,raw[key]??0]));for(const key of metrics)next[key]=0;next.valid=false;next.censoring='symmetric-fixed-zero';}
      arms[name]=next;
    }
    return {...row,...arms,censored,censoring_failures:failures.map(failure=>failure.cell_id)};
  });
  const completePairs=adjusted.filter(row=>row.pair_validation.ok).length,censoredPairs=adjusted.filter(row=>row.censored).length;
  const unboundedUnknown=Math.max(0,observedUnknown-bounded.reduce((sum,row)=>sum+(row.unknown_model_receipts??0),0));
  const checks={all_identities_accounted:adjusted.length===8&&prefixRows.length===8,minimum_complete_pairs:completePairs>=minimumCompletePairs,indeterminate_call_limit:bounded.length<=maximumIndeterminateCalls,bound_shape_valid:boundShapeValid,unbounded_unknown_usage:unboundedUnknown===0,symmetric_censoring:adjusted.filter(row=>row.censored).every(row=>metrics.every(key=>row.control[key]===0&&row.treatment[key]===0)&&row.control.valid===false&&row.treatment.valid===false),logical_token_caps:adjusted.every(row=>row.control.conservative_model_tokens<=totalTokenLimit&&row.treatment.conservative_model_tokens<=totalTokenLimit)};
  return {rows:adjusted,accounting:{bounded_indeterminate_calls:bounded.length,observed_unknown_model_receipts:observedUnknown,unbounded_unknown_model_receipts:unboundedUnknown,conservative_token_debit:bounded.reduce((sum,row)=>sum+(row.indeterminate_token_debit??0),0),complete_pairs:completePairs,censored_pairs:censoredPairs,minimum_complete_pairs:minimumCompletePairs},checks,passed:Object.values(checks).every(Boolean)};
}
