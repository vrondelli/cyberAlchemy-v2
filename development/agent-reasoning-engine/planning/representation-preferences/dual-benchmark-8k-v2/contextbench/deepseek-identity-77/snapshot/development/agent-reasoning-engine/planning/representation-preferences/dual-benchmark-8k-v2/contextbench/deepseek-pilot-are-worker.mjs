// Existing ARE treatment runner with the VPS-mounted credential provider.
// Open questions: DEEPSEEK-COMPARISON-DAG.md. No model calls occur on import.
import {readFileSync,statfsSync} from 'node:fs';import {join,resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {FULL_WINDOW,buildFullWindowCell} from './deepseek-full-window-profile.mjs';
import {buildComparisonCell} from './comparison-repair-arm.mjs';
import {runPreparedTask} from './discovery-v1/orchestrate-recovery-v2.mjs';
import {createGlmClient} from './packet-diversity-v1/transport-bounded-v3.mjs';
import {createIndexTokenizer} from './packet-diversity-v1/live-client-bounded-v3.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {createSecretReference,createInjectedSecretProvider,createSecretProviderRegistry} from '../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs';
export async function runArePilot({config,task_id,evidence_root,source_root,secret_path,signal}){
 const task=config.tasks.find(t=>t.id===task_id);if(!task)throw Error('pilot.task');
 const full=config.full_window_profile===FULL_WINDOW.id;
 const cell=full?buildFullWindowCell({config,task_id}):buildComparisonCell({config,task_id,arm:'current-are'});
 const guard=createStageOutputGuard({root:evidence_root,...(full?{maximum_bytes:FULL_WINDOW.maximum_stage_bytes}:{})}),persistence=createStagePersistence({stage_guard:guard,stage_root:evidence_root});
 const capacity=()=>{const s=statfsSync(evidence_root);if(s.bavail*s.bsize<8*1024**3)throw Error('pilot.disk-reserve');signal.throwIfAborted();return true;};
 const reference=createSecretReference({provider_id:'vps-mounted-glm',locator:'model-api-key'});
 const registry=createSecretProviderRegistry({providers:[createInjectedSecretProvider({provider_id:'vps-mounted-glm',resolve:({locator})=>{if(locator!=='model-api-key')throw Error('credential-locator');return Buffer.from(readFileSync(secret_path,'utf8').trim());}})]});
 let client,result,error;
 try{result=await runPreparedTask({task_path:task.task_path,task_sha256:task.task_sha256,repository_cache:task.repository_cache,cell,
  out:join(evidence_root,'run'),evidence_root,source_out:join(source_root,'session'),persistence,admit_source:async()=>capacity(),before_model_dispatch:async()=>capacity(),
  create_client:({cell,record_event})=>{
   const p=cell.provider_profile;
   const base=createGlmClient({api_key_ref:reference,secret_registry:registry,persistence,before_dispatch:async()=>capacity(),scope_tool_call_ids:true,maximum_output_tokens:cell.limits.output_cap,maximum_requests:96,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,request_budget:p.request_budget,maximum_request_bytes:full?FULL_WINDOW.maximum_request_bytes:262144,maximum_response_bytes:full?1048576:262144,token_margin:512,reasoning_effort:'low',model_timeout_ms:120000,signal});
   const index=createIndexTokenizer({registry,reference,maximum_calls:p.index_tokenizer_maximum_calls,maximum_transport_attempts:1,record:r=>record_event({kind:'index-tokenizer',receipt:r}),signal,before_dispatch:async()=>capacity()});
   client={...base,index_receipts:index.receipts,measure_index:index.measure};return client;
  },measure_index_tokens:(text,c)=>c.measure_index(text)});
 }catch(e){result=e.result??null;error=String(e.message).slice(0,500);}
 const models=(client?.receipts??[]).filter(r=>r.kind==='model'&&r.dispatched!==false),known=models.filter(r=>r.dispatched===true&&Number.isSafeInteger(r.input_tokens)&&Number.isSafeInteger(r.output_tokens));
 const seal={schema_version:'are.external-control-pilot-outcome/v1',task_id,arm:'current-are',status:result?.status??'worker-error',error,model_calls:models.length,known_total_tokens:known.reduce((n,r)=>n+r.input_tokens+r.output_tokens,0),unknown_usage_dispatched_requests:models.length-known.length,native_export:result?.native_export??null,benchmark_cleared:false};
 persistence.writeJson(join(evidence_root,'RESULTS.json'),seal,{final:true});return seal;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const signal=new AbortController();process.once('SIGTERM',()=>signal.abort());process.once('SIGINT',()=>signal.abort());
 const config=JSON.parse(readFileSync('/repo/PILOT-CONFIG.json','utf8'));
 const result=await runArePilot({config,task_id:process.argv[2],evidence_root:'/evidence',source_root:'/sources',secret_path:'/run/secrets/model_api_key',signal:signal.signal});
 console.log(JSON.stringify({task_id:result.task_id,status:result.status,model_calls:result.model_calls,known_total_tokens:result.known_total_tokens,unknown_usage:result.unknown_usage_dispatched_requests}));
}
