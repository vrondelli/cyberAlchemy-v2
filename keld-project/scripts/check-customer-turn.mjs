import {spawn,spawnSync} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import {mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {setupCustomerProfile,loadCustomerProfile} from './setup-customer-profile.mjs';
import {customerFixture} from './customer-fixture.mjs';

if(process.argv.length!==4)throw Error('Usage: node check-customer-turn.mjs <codex-binary> <model>');
const scripts=import.meta.dirname,candidate=resolve(scripts,'../evidence/private-candidate');
const manifest=JSON.parse(readFileSync(resolve(candidate,'manifest.json'),'utf8'));
const archive=resolve(candidate,manifest.archive);
if(createHash('sha256').update(readFileSync(archive)).digest('hex')!==manifest.sha256)throw Error('Archive mismatch');
const temp=mkdtempSync(resolve(tmpdir(),'keld-turn-'));let client,child;
const report={schema_version:'keld.customer-turn/v1',archive_sha256:manifest.sha256,model:process.argv[3],status:'FAIL',claim_limit:'One synthetic customer-context task and completed-frontier recovery; not a general quality benchmark, crash-delivery recovery or agent transport resumption proof.'};
try{
  const engine=resolve(temp,'engine'),project=resolve(temp,'customer');mkdirSync(project);
  const extraction=spawnSync('python3',[resolve(scripts,'archive.py'),'unpack',resolve(candidate,'source-closure.json'),archive,engine],{encoding:'utf8',timeout:30000});
  if(extraction.status!==0)throw Error('Extraction failed: '+extraction.stderr);
  const input={...customerFixture(project),persistent_state:true},nonce='widget-'+randomBytes(8).toString('hex');
  const definitions=JSON.parse(readFileSync(resolve(project,'definitions.json'),'utf8'));
  definitions.concepts[0].propose.normative_voice=`The Widget delivery code is ${nonce}.`;
  writeFileSync(resolve(project,'definitions.json'),JSON.stringify(definitions));
  writeFileSync(resolve(project,'AGENTS.md'),'Use the supplied project context. Do not use tools for this connection check.\n');
  await setupCustomerProfile({engineRoot:engine,projectRoot:project,input});
  const {spawnAppServerRpcTransport,createAppServerRpcClient}=await import(pathToFileURL(resolve(engine,'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/rpc-client.mjs')));
  const transport=spawnAppServerRpcTransport({command:process.execPath,args:[resolve(scripts,'customer-app-server.mjs'),engine,project,resolve(process.argv[2])],spawn_impl:(command,args,options)=>{
    child=spawn(command,args,{...options,detached:true,cwd:temp});return child;
  }});
  client=createAppServerRpcClient({transport,request_timeout_ms:60000,thread_start_timeout_ms:60000,completion_timeout_ms:120000});
  const toolItems=new Set();let completedNotification;
  client.events.on('notification',message=>{
    if(message.method==='turn/completed')completedNotification=message;
    const item=message.params?.item;
    if(item&&['commandExecution','fileChange','mcpToolCall','dynamicToolCall','webSearch'].includes(item.type))toolItems.add(item.id??JSON.stringify(item));
  });
  await client.initialize({clientInfo:{name:'keld-customer-context-check',version:'0.1.0'},capabilities:{experimentalApi:true}});
  await client.notify('initialized',{});
  process.stderr.write('Initialized real agent through customer launcher.\n');
  const thread=await client.startThread({cwd:project,ephemeral:true,model:process.argv[3],approvalPolicy:'never',sandbox:'read-only'});
  const result=await client.runTurn({threadId:thread.thread.id,input:[{type:'text',text:'Explain the Widget delivery code from the supplied project context. Reply with only the code. Do not use tools.'}],approvalPolicy:'never',sandboxPolicy:{type:'readOnly',networkAccess:false}});
  report.completion_status=result.completed?.turn?.status;
  report.exact_context_answer=result.text.trim()===nonce;
  report.tool_items=toolItems.size;
  report.status=report.completion_status==='completed'&&report.exact_context_answer&&report.tool_items===0?'PASS':'FAIL';
  report.answer_sha256=createHash('sha256').update(result.text).digest('hex');
  const exited=new Promise(resolveExit=>child.once('exit',resolveExit));
  await client.close();await exited;
  const loaded=await loadCustomerProfile(engine,project);
  const {createCodexAppServerWrapper}=await import(pathToFileURL(resolve(engine,'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs')));
  const recovered=createCodexAppServerWrapper({loaded_profile:loaded.value,decision_profile:loaded.decision_profile,
    definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,
    source_snapshot:loaded.source_snapshot,context_source_provider:loaded.context_source_provider});
  try{
    const state=recovered.inspectState();
    report.recovery_disposition=state.reasoning_state.recovery?.disposition;
    report.recovered_frontiers=state.completion_frontier_turn_ids.length;
    if(!completedNotification)throw Error('Exact completion notification missing');
    const replay=await recovered.processServerMessage(completedNotification);
    report.replay_upstream_messages=replay.to_server.length;
    report.replay_confirmed=replay.to_client.some(message=>message.method==='cyberalchemy/successor'&&message.params?.kind==='replayed');
    report.replay_reason_codes=replay.to_client.flatMap(message=>message.params?.reason_codes??[]);
    if(report.recovery_disposition!=='recovered'||report.recovered_frontiers!==1||report.replay_upstream_messages!==0||!report.replay_confirmed)report.status='FAIL';
  }finally{recovered.close()}
}catch(error){report.error=error.message.slice(0,3000)}finally{
  await client?.close();
  if(child?.pid){try{process.kill(-child.pid,'SIGKILL')}catch(error){if(error.code!=='ESRCH')throw error}}
  rmSync(temp,{recursive:true,force:true});
  writeFileSync(resolve(candidate,'customer-turn.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report));if(report.status!=='PASS')process.exitCode=1;
