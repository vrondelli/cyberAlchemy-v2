// Additive wrapper; frozen R1 pair runner stays unchanged. Open questions: PROVIDER-ATTEMPT-HEALTH.md.
import {runPair} from './discovery-v1/run-recovery-pair.mjs';
import {runPreparedTask} from './discovery-v1/orchestrate-recovery-v2.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
function classify(result){
 const health=providerAttemptHealth([...(result.receipts??[]),...(result.index_tokenizer_receipts??[])]);
 if(health.healthy)return result;
 return {...result,infrastructure_failure:{...(typeof result.infrastructure_failure==='object'?result.infrastructure_failure:{}),provider_attempt_failure:true,attempt_health:health}};
}
export async function runPairWithProviderHealth(options){
 const execute=options.run_task??runPreparedTask;
 return await runPair({...options,run_task:async args=>{
  try{return classify(await execute(args));}
  catch(error){if(error.result)error.result=classify(error.result);throw error;}
 }});
}
