// Fixed arm routing, source cell derivation and shared attempt health. Open questions: COMPARISON-REPAIR-RUNNER.md.
import {buildCell} from './discovery-v1/run-recovery-pair.mjs';
import {runPreparedTask} from './discovery-v1/orchestrate-recovery-v2.mjs';
import {runPreparedComparisonTask} from './discovery-v1/orchestrate-comparison-repair-v1.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const need=(v,m)=>{if(!v)throw Error('comparison-arm.'+m);};
export const COMPARISON_ARMS=Object.freeze(['minimal-history','current-are','independent-investigations']);
export function buildComparisonCell({config,task_id,arm}){
 need(COMPARISON_ARMS.includes(arm),'unknown-arm');need(config?.model==='glm-5.3-flash','model');
 const base=buildCell({config,task_id,arm:'control',repetition:1});
 return {...base,cell_id:task_id+'-r1-'+arm,comparison_arm:arm,
  ...(arm==='current-are'?{}:{limits:{total_tokens:96000,maximum_calls:96,output_cap:base.limits.output_cap,finalization_reserve_tokens:arm==='minimal-history'?8000:20000},provider_profile:{...base.provider_profile,request_budget:'contextbench-budget-v1'}})};
}
/** Executor injection is a programmatic test seam, never a manifest field. */
export async function runComparisonArm({config,task_id,arm,create_client,signal,before_model_dispatch=async()=>true,...runtime},{execute_current=runPreparedTask,execute_candidate=runPreparedComparisonTask}={}){
 const cell=buildComparisonCell({config,task_id,arm}),task=config.tasks.find(t=>t.id===task_id);
 need(signal instanceof AbortSignal&&!signal.aborted,'active-shared-signal');need(typeof create_client==='function'&&typeof before_model_dispatch==='function','dependencies');let client,clientAttempted=false;
 const health=()=>providerAttemptHealth([...(client?.receipts??[]),...(client?.index_receipts??[])]);
 const classify=value=>{const result={...value,receipts:value.receipts??structuredClone(client?.receipts??[]),index_tokenizer_receipts:value.index_tokenizer_receipts??structuredClone(client?.index_receipts??[])};const attempt_health=providerAttemptHealth([...(result.receipts??[]),...(result.index_tokenizer_receipts??[])]);return attempt_health.healthy?result:{...result,infrastructure_failure:{...(typeof result.infrastructure_failure==='object'?result.infrastructure_failure:{}),provider_attempt_failure:true,attempt_health}};};
 try{
  const execute=arm==='current-are'?execute_current:execute_candidate;
  return classify(await execute({...runtime,task_path:task.task_path,task_sha256:task.task_sha256,repository_cache:task.repository_cache,cell,signal,
   create_client:async args=>{need(!clientAttempted,'single-client');clientAttempted=true;client=await create_client({...args,signal});return client;},
   before_model_dispatch:async()=>!signal.aborted&&health().healthy&&await before_model_dispatch()===true}));
 }catch(error){
  // A plain executor/persistence exception can still follow paid work.
  // Attach both receipt families without turning missing summaries into zero spend.
  const evidence=error.result??{status:'orchestration_error',error:String(error.message),benchmark_cleared:false,accounting_requires_reconciliation:true,infrastructure_failure:{orchestration_failure:true}};
  error.result=classify(evidence);throw error;
 }
}
