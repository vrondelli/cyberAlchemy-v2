// Explicit live benchmark. Emits progress and evidence; no calls without --live.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {dirname,join,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {createAppServerRpcClient,spawnAppServerRpcTransport} from '../../../codex-app-server-wrapper/src/rpc-client.mjs';
import {materializeLatencyResult,verifyLatencyManifest} from '../../src/requirement-latency-control.mjs';
import {registerRequirementLatencyControlCompletion} from '../../src/benchmark-registration.mjs';
if(process.argv[2]!=='--live')throw Error('Explicit --live is required; this benchmark makes 80 model calls.');
const directory=dirname(fileURLToPath(import.meta.url)),root=resolve(directory,'../../../../../../..');
const manifest=JSON.parse(readFileSync(join(directory,'latency-execution-001.json'),'utf8'));if(!verifyLatencyManifest(manifest))throw Error('latency.manifest-invalid');
for(const [path,expected] of Object.entries(manifest.source_digests))if(createHash('sha256').update(readFileSync(join(root,path))).digest('hex')!==expected)throw Error(`latency.source-drift:${path}`);
const binary=execFileSync('codex',['--version'],{encoding:'utf8'}).trim();if(process.version!==manifest.node_version||binary!==manifest.binary_version)throw Error('latency.runtime-version-mismatch');
const observations=[],startedAt=new Date().toISOString();let client,current,error=null;
try{client=createAppServerRpcClient({transport:spawnAppServerRpcTransport({command:'codex',args:['app-server','--stdio']}),thread_start_timeout_ms:manifest.environment.thread_start_timeout_ms,completion_timeout_ms:manifest.environment.completion_timeout_ms});
  client.events.on('notification',n=>{if(!current)return;if(n.method==='item/started'&&!['userMessage','agentMessage','reasoning'].includes(n.params?.item?.type))current.tool_events++;
    if(n.method==='thread/tokenUsage/updated')current.token_usage=n.params?.tokenUsage??null;if(n.method==='item/agentMessage/delta'&&current.first_text_ms===null)current.first_text_ms=performance.now()-current.turn_started;});
  await client.initialize({clientInfo:{name:'are-requirement-latency-002',version:'0.1.0'},capabilities:{experimentalApi:true}});await client.notify('initialized');
  const models=await client.request('model/list',{}),model=models.data.find(x=>x.id===manifest.model||x.model===manifest.model);if(!model?.supportedReasoningEfforts?.some(x=>x.reasoningEffort===manifest.effort))throw Error('latency.model-effort-unavailable');
  for(const entry of manifest.schedule){current={ordinal:entry.ordinal,case_id:entry.case_id,repetition:entry.repetition,variant:entry.variant,prompt_digest:entry.prompt_digest,
      observed_model:null,observed_effort:null,observed_binary_version:binary,thread_id:null,turn_id:null,completion_status:null,tool_events:0,startup_ms:null,first_text_ms:null,elapsed_ms:null,token_usage:null,raw_output:''};
    const startup=performance.now(),thread=await client.startThread({cwd:manifest.environment.cwd,model:manifest.model,approvalPolicy:'never',sandbox:'read-only',ephemeral:true,
      config:{'features.shell_tool':false,'model_reasoning_effort':manifest.effort},baseInstructions:manifest.environment.base_instructions});
    current.startup_ms=performance.now()-startup;current.thread_id=thread.thread.id;current.observed_model=thread.model;current.observed_effort=thread.reasoningEffort;
    if(current.observed_model!==manifest.model||current.observed_effort!==manifest.effort)throw Error('latency.observed-runtime-mismatch');
    current.turn_started=performance.now();const turn=await client.runTurn({threadId:thread.thread.id,model:manifest.model,effort:manifest.effort,input:[{type:'text',text:entry.prompt}],approvalPolicy:'never',sandboxPolicy:{type:'readOnly'}});
    current.elapsed_ms=performance.now()-current.turn_started;delete current.turn_started;current.turn_id=turn.started.turn.id;current.completion_status=turn.completed.turn.status;current.raw_output=turn.text;
    observations.push(current);console.log('PROGRESS '+JSON.stringify({completed:observations.length,ordinal:entry.ordinal,case_id:entry.case_id,repetition:entry.repetition,variant:entry.variant}));current=null;}
}catch(cause){error=cause instanceof Error?cause.message:String(cause);}finally{await client?.close();}
const result=materializeLatencyResult({manifest,observations,status:error===null?'completed':'blocked',error,started_at:startedAt,finished_at:new Date().toISOString()});
console.log('RESULT '+JSON.stringify(result));console.log('REGISTRATION '+JSON.stringify(registerRequirementLatencyControlCompletion(manifest,result)));if(error!==null)process.exitCode=1;
