// Explicit live benchmark. It emits progress/evidence to stdout and registers only the final result.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAppServerRpcClient,spawnAppServerRpcTransport} from '../../../codex-app-server-wrapper/src/rpc-client.mjs';
import {materializeReplicationResult,verifyReplicationManifest} from '../../src/requirement-replication.mjs';
import {registerRequirementReplicationCompletion} from '../../src/benchmark-registration.mjs';

if(process.argv[2]!=='--live')throw Error('Explicit --live is required; this benchmark makes 144 model calls.');
const directory=dirname(fileURLToPath(import.meta.url));
const root=resolve(directory,'../../../../../../..');
const manifest=JSON.parse(readFileSync(join(directory,'replication-execution-002.json'),'utf8'));
if(!verifyReplicationManifest(manifest))throw Error('replication.manifest-invalid');
for(const [path,expected] of Object.entries(manifest.source_digests)) {
  const actual=createHash('sha256').update(readFileSync(join(root,path))).digest('hex');
  if(actual!==expected)throw Error(`replication.source-drift:${path}`);
}
const observedBinary=execFileSync('codex',['--version'],{encoding:'utf8'}).trim();
if(process.version!==manifest.node_version||observedBinary!==manifest.binary_version)throw Error('replication.runtime-version-mismatch');

const observations=[];
const startedAt=new Date().toISOString();
let client,current,error=null;
try {
  client=createAppServerRpcClient({transport:spawnAppServerRpcTransport({command:'codex',args:['app-server','--stdio']}),
    thread_start_timeout_ms:manifest.environment.thread_start_timeout_ms,completion_timeout_ms:manifest.environment.completion_timeout_ms});
  client.events.on('notification',notification=>{
    if(!current)return;
    if(notification.method==='item/started'&&!['userMessage','agentMessage','reasoning'].includes(notification.params?.item?.type))current.tool_events++;
    if(notification.method==='thread/tokenUsage/updated')current.token_usage=notification.params?.tokenUsage??null;
    if(notification.method==='item/agentMessage/delta'&&current.first_text_ms===null)current.first_text_ms=performance.now()-current.turn_started;
  });
  await client.initialize({clientInfo:{name:'are-requirement-replication',version:'0.1.0'},capabilities:{experimentalApi:true}});
  await client.notify('initialized');
  const models=await client.request('model/list',{});
  const model=models.data.find(item=>item.id===manifest.model||item.model===manifest.model);
  if(!model?.supportedReasoningEfforts?.some(item=>item.reasoningEffort===manifest.effort))throw Error('replication.model-effort-unavailable');
  for(const entry of manifest.schedule) {
    current={ordinal:entry.ordinal,case_id:entry.case_id,repetition:entry.repetition,variant:entry.variant,prompt_digest:entry.prompt_digest,
      observed_model:null,observed_effort:null,observed_binary_version:observedBinary,thread_id:null,turn_id:null,
      completion_status:null,tool_events:0,startup_ms:null,first_text_ms:null,elapsed_ms:null,token_usage:null,raw_output:''};
    const startup=performance.now();
    const thread=await client.startThread({cwd:manifest.environment.cwd,model:manifest.model,approvalPolicy:manifest.environment.approval_policy,
      sandbox:manifest.environment.sandbox,ephemeral:manifest.environment.ephemeral,
      config:{'features.shell_tool':manifest.environment.shell_tool,'model_reasoning_effort':manifest.effort},baseInstructions:manifest.environment.base_instructions});
    current.startup_ms=performance.now()-startup;current.thread_id=thread.thread.id;current.observed_model=thread.model;current.observed_effort=thread.reasoningEffort;
    if(current.observed_model!==manifest.model||current.observed_effort!==manifest.effort)throw Error('replication.observed-runtime-mismatch');
    current.turn_started=performance.now();
    const turn=await client.runTurn({threadId:thread.thread.id,model:manifest.model,effort:manifest.effort,
      input:[{type:'text',text:entry.prompt}],approvalPolicy:manifest.environment.approval_policy,sandboxPolicy:{type:'readOnly'}});
    current.elapsed_ms=performance.now()-current.turn_started;delete current.turn_started;
    current.turn_id=turn.started.turn.id;current.completion_status=turn.completed.turn.status;current.raw_output=turn.text;
    observations.push(current);
    console.log('PROGRESS '+JSON.stringify({completed:observations.length,ordinal:entry.ordinal,case_id:entry.case_id,repetition:entry.repetition,variant:entry.variant}));
    current=null;
  }
} catch(cause) {error=cause instanceof Error?cause.message:String(cause);}
finally {await client?.close();}
const result=materializeReplicationResult({manifest,observations,status:error===null?'completed':'blocked',error,
  started_at:startedAt,finished_at:new Date().toISOString()});
console.log('RESULT '+JSON.stringify(result));
console.log('REGISTRATION '+JSON.stringify(registerRequirementReplicationCompletion(manifest,result)));
if(error!==null)process.exitCode=1;
