// Schema-agreement candidate. Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
// Additive ranked-source-hints production candidate. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
// Additive canonical outcome boundary. Open questions: CANONICAL-OUTCOME-REPAIR-DRAFT.md.
import {preserveComparisonResult} from './canonical-comparison-result.mjs';
// Fixed arm routing, source cell derivation and shared attempt health. Open questions: COMPARISON-REPAIR-RUNNER.md.
import {buildComparisonCell as buildHistoricalCell} from './comparison-arm.mjs';
import {runPreparedTask} from './compact-current-v1/orchestrate-final-preserved.mjs';
import {runPreparedComparisonTask} from './discovery-v1/orchestrate-recent-evidence-r1.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const need=(v,m)=>{if(!v)throw Error('comparison-arm.'+m);};
export const COMPARISON_ARMS=Object.freeze(['recent-evidence-ledger']);
export function buildComparisonCell({config,task_id,arm}){
 need(arm==='recent-evidence-ledger','candidate-only');
 const base=buildHistoricalCell({config,task_id,arm:'minimal-history'});
 return {...base,cell_id:task_id+'-recent-evidence-ledger-r1',comparison_arm:'recent-evidence-ledger',context_projection:'recent-evidence-ledger-r1',
  phase_contract:{exploration_tokens:88000,exploration_calls:95,finalization_tokens:8000,finalization_calls:1}};
}
/** Executor injection is a programmatic test seam, never a manifest field. */
export async function runComparisonArm({config,task_id,arm,create_client,signal,before_model_dispatch=async()=>true,...runtime},{execute_current=runPreparedTask,execute_candidate=runPreparedComparisonTask}={}){
 const cell=buildComparisonCell({config,task_id,arm}),task=config.tasks.find(t=>t.id===task_id);
 need(signal instanceof AbortSignal&&!signal.aborted,'active-shared-signal');need(typeof create_client==='function'&&typeof before_model_dispatch==='function','dependencies');let client,clientAttempted=false;
 const health=()=>providerAttemptHealth([...(client?.receipts??[]),...(client?.index_receipts??[])]);
 const classify=value=>preserveComparisonResult(value,client);
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
