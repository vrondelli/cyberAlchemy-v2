// Additive G02 worker. Import is inert; live dispatch requires an explicit caller.
import {createHash} from 'node:crypto';
import {readFileSync,statfsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {G02_FULL_WINDOW,buildG02FullWindowCell} from './deepseek-full-window-profile-g02-v1.mjs';
import {runPreparedTask} from './discovery-v1/orchestrate-recovery-g02-v1.mjs';
import {createGlmClient,stable} from './packet-diversity-v1/transport-bounded-g02-v1.mjs';
import {createIndexTokenizer} from './packet-diversity-v1/live-client-bounded-v3.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {runEpisode} from './discovery-v1/episode-recovery-g02-v1.mjs';
import {createSecretReference,createInjectedSecretProvider,createSecretProviderRegistry} from '../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs';

export const G02_WORKER_BINDING=Object.freeze({
  worker_version:'g02-v1',
  episode:'discovery-v1/episode-recovery-g02-v1.mjs',
  orchestrator:'discovery-v1/orchestrate-recovery-g02-v1.mjs',
  transport:'packet-diversity-v1/transport-bounded-g02-v1.mjs',
  response_batch_policy:'g02-v1',
  profile:G02_FULL_WINDOW.id
});

const sha=value=>createHash('sha256').update(typeof value==='string'?value:stable(value)).digest('hex');
const qualificationTool={type:'function',function:{name:'read_file',description:'Read one repository file.',parameters:{type:'object',properties:{path:{type:'string'}},required:['path'],additionalProperties:false}}};
export const G02_QUALIFICATION_MINIMUM_REQUEST_BYTES=16*1024;

// Runs the exact G02 episode boundary without preparing a benchmark repository. This is a
// transport/episode qualification only: it cannot produce a ContextBench score or outcome.
export async function runBoundedG02WorkerQualification({client,recycler}={}){
  if(!client||!recycler||client.maximum_model_retries!==0)throw Error('g02-worker-qualification.dependencies');
  const statement='Exercise the exact G02 episode and return a concise terminal JSON selection. '.padEnd(G02_QUALIFICATION_MINIMUM_REQUEST_BYTES,'q');
  const result=await runEpisode({task:{problem_statement:statement},arm:'baseline',client,recycler,
    tools:[qualificationTool],execute_tool:async()=>{throw Error('g02-worker-qualification.tool-execution-forbidden');},measure_index_tokens:async()=>0,
    limits:{maximum_calls:2,output_cap:2048,total_tokens:4000000,index_entries:1,index_tokens:1,maximum_terminal_corrections:0,maximum_tool_batch_corrections:1},
    run_id:'g02-bounded-worker-qualification',before_model_dispatch:async()=>true});
  const modelReceipts=client.receipts.filter(row=>row.kind==='model'&&row.dispatched===true),tokenizerReceipts=client.receipts.filter(row=>row.kind==='tokenizer'&&row.dispatched===true);
  if(modelReceipts.length<1||modelReceipts.length>2||tokenizerReceipts.length<1||tokenizerReceipts.length>2)throw Error('g02-worker-qualification.call-cap');
  if(client.receipts.some(row=>(row.automatic_retries??0)!==0))throw Error('g02-worker-qualification.retry');
  const material={schema_version:'are.g02-bounded-worker-qualification/v1',worker_binding:G02_WORKER_BINDING,episode_status:result.status,
    model_request_sha256:modelReceipts.at(-1)?.request_sha256,tokenizer_request_sha256:tokenizerReceipts.at(-1)?.request_sha256,
    model_calls:modelReceipts.length,tokenizer_calls:tokenizerReceipts.length,automatic_retries:0,tool_executions:result.events.length,authority_effect:'none'};
  return Object.freeze({...material,worker_receipt_digest:sha(material)});
}

export async function runArePilotG02({config,task_id,evidence_root,source_root,secret_path,signal,credential_binding=null,post=null}){
  const task=config.tasks.find(t=>t.id===task_id);if(!task)throw Error('g02-pilot.task');
  const cell=buildG02FullWindowCell({config,task_id});
  const guard=createStageOutputGuard({root:evidence_root,maximum_bytes:G02_FULL_WINDOW.maximum_stage_bytes});
  const persistence=createStagePersistence({stage_guard:guard,stage_root:evidence_root});
  const capacity=()=>{const s=statfsSync(evidence_root);if(s.bavail*s.bsize<8*1024**3)throw Error('g02-pilot.disk-reserve');signal.throwIfAborted();return true;};
  const reference=credential_binding?.reference??createSecretReference({provider_id:'vps-mounted-glm',locator:'model-api-key'});
  const registry=credential_binding?.registry??createSecretProviderRegistry({providers:[createInjectedSecretProvider({provider_id:'vps-mounted-glm',resolve:({locator})=>{if(locator!=='model-api-key')throw Error('credential-locator');return Buffer.from(readFileSync(secret_path,'utf8').trim());}})]});
  let client,result,error;
  try{result=await runPreparedTask({task_path:task.task_path,task_sha256:task.task_sha256,repository_cache:task.repository_cache,cell,
    out:join(evidence_root,'run'),evidence_root,source_out:join(source_root,'session'),persistence,admit_source:async()=>capacity(),before_model_dispatch:async()=>capacity(),
    create_client:({cell,record_event})=>{
      const p=cell.provider_profile;
      const base=createGlmClient({api_key_ref:reference,secret_registry:registry,persistence,before_dispatch:async()=>capacity(),maximum_output_tokens:G02_FULL_WINDOW.output_cap,maximum_requests:G02_FULL_WINDOW.maximum_calls,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,request_budget:p.request_budget,maximum_request_bytes:G02_FULL_WINDOW.maximum_request_bytes,maximum_response_bytes:G02_FULL_WINDOW.maximum_response_bytes,token_margin:512,reasoning_effort:'low',model_timeout_ms:120000,signal,...(post?{post}: {})});
      const index=createIndexTokenizer({registry,reference,maximum_calls:p.index_tokenizer_maximum_calls,maximum_transport_attempts:1,record:r=>record_event({kind:'index-tokenizer',receipt:r}),signal,before_dispatch:async()=>capacity(),...(post?{post}: {})});
      client={...base,index_receipts:index.receipts,measure_index:index.measure};return client;
    },measure_index_tokens:(text,c)=>c.measure_index(text)});
  }catch(e){result=e.result??null;error=String(e.message).slice(0,500);}
  const models=(client?.receipts??[]).filter(r=>r.kind==='model'&&r.dispatched!==false);
  const known=models.filter(r=>r.dispatched===true&&Number.isSafeInteger(r.input_tokens)&&Number.isSafeInteger(r.output_tokens));
  const seal={schema_version:'are.external-control-pilot-outcome/v1',task_id,arm:'current-are-g02',status:result?.status??'worker-error',error,model_calls:models.length,known_total_tokens:known.reduce((n,r)=>n+r.input_tokens+r.output_tokens,0),unknown_usage_dispatched_requests:models.length-known.length,native_export:result?.native_export??null,benchmark_cleared:false};
  persistence.writeJson(join(evidence_root,'RESULTS.json'),seal,{final:true});return seal;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  throw Error('g02-pilot.direct-launch-disabled-use-development-wrapper');
}
