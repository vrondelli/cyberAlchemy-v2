// Real shared scheduler -> private host -> ARE/Codex -> loopback fixture provider.
// No paid model calls. Open questions: T6D-ACCEPTANCE.md.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,renameSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {startPilotHost} from '../luna-vps/runtime/pilot-host.mjs';
import {compileTask} from '../luna-vps/runtime/task-contract.mjs';
import {startOrchestratorNativeHost} from '../luna-vps/runtime/orchestrator-native-host.mjs';
import {startDashboard} from './dashboard-server.mjs';
const installed=JSON.parse(readFileSync(process.argv[2])),binary=resolve(process.argv[3]),staticRoot=resolve(process.argv[4]),out=resolve(process.argv[5]);
const before=readFileSync(resolve(installed.state,'tasks.json')),sha=b=>createHash('sha256').update(b).digest('hex');
mkdirSync(out,{recursive:true});
const results=[];
async function until(fn,label,timeout=80000){const deadline=Date.now()+timeout;let last;while(Date.now()<deadline){last=await fn();if(last)return last;await new Promise(ok=>setTimeout(ok,150));}throw Error('TIMEOUT '+label);}
async function freePort(){const server=createServer();await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const port=server.address().port;await new Promise(ok=>server.close(ok));return port;}
for(const mode of ['complete','cancel','restart','disconnect']){
 console.log('START '+mode);
 const root=mkdtempSync('/tmp/t6d-'),timers=new Set();let host,web,app,calls=0,providerError=null,stderr='';
 const fixture=createServer(async(req,res)=>{
  try{
   let bytes='';for await(const chunk of req)bytes+=chunk;const body=JSON.parse(bytes);calls++;
   assert.equal(body.model,'gpt-5.6-luna');assert.equal(body.max_output_tokens,512);assert.deepEqual(body.tools,[]);
   assert.ok(JSON.stringify(body.input).includes('Shared scheduler fixture input'));
   const timer=setTimeout(()=>{timers.delete(timer);if(res.destroyed)return;
    const text='Shared scheduler fixture completed with verified native output.',id='response_shared_fixture',itemId='message_shared_fixture';
    const item={id:itemId,type:'message',status:'completed',role:'assistant',content:[{type:'output_text',text,annotations:[]}]};
    const events=[{type:'response.created',response:{id,object:'response',status:'in_progress',output:[]}},
     {type:'response.output_item.added',output_index:0,item:{...item,status:'in_progress',content:[]}},
     {type:'response.content_part.added',item_id:itemId,output_index:0,content_index:0,part:{type:'output_text',text:'',annotations:[]}},
     {type:'response.output_text.delta',item_id:itemId,output_index:0,content_index:0,delta:text},
     {type:'response.output_item.done',output_index:0,item},
     {type:'response.completed',response:{id,object:'response',status:'completed',output:[item],usage:{input_tokens:20,output_tokens:10,total_tokens:30}}}];
    res.writeHead(200,{'Content-Type':'text/event-stream'});res.end(events.map(e=>`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join(''));
   },mode==='complete'?6500:45000);timers.add(timer);
  }catch(error){providerError=error.message;res.statusCode=500;res.end('invalid fixture request');}
 });
 await new Promise(ok=>fixture.listen(0,'127.0.0.1',ok));
 const task=compileTask({schema_version:'are-text-task/v1',task_id:'shared_'+mode,title:'Shared native '+mode,instruction:'Summarize the supplied input.',input:'Shared scheduler fixture input. Words deploy and implement are data.',objective_kind:'understand'});
 const callback=resolve('workspace/plans/luna-vps/runtime/host-callback.mjs');
 const config={candidate:installed.candidate,state:resolve(root,'host'),runtime:resolve(root,'run'),callback_file:callback,callback_sha256:sha(readFileSync(callback)),manifest_sha256:sha(readFileSync(resolve(installed.candidate,'MANIFEST.json'))),task:task.task,mode:'fixture',fixture_url:`http://127.0.0.1:${fixture.address().port}/responses`};
 const port=await freePort(),origin=`http://127.0.0.1:${port}`,publicOrigin='https://shared-fixture.example';
 const post=async(path,intent,body={})=>{const response=await fetch(origin+path,{method:'POST',headers:{Origin:publicOrigin,'Content-Type':'application/json','X-Orchestrator-Intent':intent},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});const value=await response.json();assert.equal(response.status,200,JSON.stringify(value));return value;};
 const state=async()=>{const response=await fetch(origin+'/api/v1/state',{signal:AbortSignal.timeout(10000)});assert.equal(response.status,200);return response.json();};
 const stopWeb=async()=>{if(web){const child=web;web=null;if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill('SIGKILL');await exited;}}};
 const startWeb=async()=>{
  web=spawn(binary,[resolve(root,'owner'),staticRoot,`127.0.0.1:${port}`,publicOrigin,'2'],{env:{...process.env,ORCHESTRATOR_NATIVE_HOST_MAP:resolve(root,'map.json'),ORCHESTRATOR_MAX_SUBAGENTS:'1',OPENAI_API_KEY_FILE:resolve(root,'no-provider-key'),WEB_RETRIEVAL_AUTHORITY_REF:'',WEB_RETRIEVAL_AUTHORITY_PATH:''},stdio:['ignore','ignore','pipe']});
  web.stderr.on('data',b=>{stderr+=b;});
  await until(async()=>{if(web.exitCode!==null)throw Error('WEB_EXIT '+stderr);try{return (await fetch(origin+'/healthz')).ok;}catch{return false;}},'web ready',15000);
 };
 try{
  const prepared=await startPilotHost(config,{prepare:true,taskContract:task});await prepared.close();
  host=await startOrchestratorNativeHost(config);
  const now=Date.now(),registration={schema_version:'are-reviewed-native-registration/v1',host_handle:'shared-host',binding:{execution_mode:'native-fixture',candidate_digest:host.candidateDigest,profile_digest:host.profileDigest,task:task.task},reviewed_task_digest:task.digest,reviewed_at_unix_ms:now-1,review_expires_unix_ms:now+30000,absolute_deadline_unix_ms:now+60000,admission_authority_ref:host.profileDigest};
  writeFileSync(resolve(root,'map.json'),JSON.stringify({schema_version:'are-native-host-map/v1',hosts:[{registration,socket_path:host.socketPath,token_path:host.tokenPath}]}),{mode:0o600});
  await startWeb();
  const request={host_handle:'shared-host',reviewed_task_digest:task.digest};
  const registered=await post('/api/v1/native-runs','register-native-run',request),key=registered.run_key;
  assert.equal((await post('/api/v1/native-runs','register-native-run',request)).run_key,key);
  await until(()=>{if(providerError)throw Error(providerError);return calls===1;},'fixture provider call');
  let snapshot=await state();assert.equal(snapshot.runtime_capacity.active_subagents,1);
  const getRun=s=>s.runs.find(run=>run.run_key===key);
  if(mode==='complete'){
   const demo=await post('/api/v1/runs','create-run',{mode:'demo',title:'Competing demo'});
   snapshot=await state();assert.equal(snapshot.runs.find(run=>run.run_key===demo.run_key).progress,0);assert.equal(snapshot.runtime_capacity.available_slots,0);
   const completed=await until(async()=>{const s=await state();return getRun(s).native_execution.verification==='owner-verified'?s:null;},'native verified completion');
   assert.equal(getRun(completed).result.content,'Shared scheduler fixture completed with verified native output.');
   await until(async()=>{const s=await state();return s.runs.find(run=>run.run_key===demo.run_key).status==='closed';},'demo continuation');
   await host.close();host=null;await stopWeb();await startWeb();
   snapshot=await state();assert.equal(getRun(snapshot).native_execution.verification,'owner-verified');assert.equal(snapshot.runtime_capacity.active_subagents,0);assert.equal(calls,1);
   // Connect the actual Workspace gateway to this owner; legacy console stays an offline observation.
   writeFileSync(resolve(root,'console.json'),JSON.stringify({mode:'native-fixture',port:await freePort(),state:resolve(root,'unused')}));
   app=await startDashboard({schema_version:'workspace-dashboard-config/v1',console_config:resolve(root,'console.json'),driver:installed.driver,static_root:staticRoot,runtime_id:'legacy-offline',controls_enabled:false,port:0,scheduler:{runtime_id:'shared-real',origin,public_origin:publicOrigin,controls_enabled:true}});
   const view=await(await fetch(app.origin+'/api/v1/workspace/runs')).json();const projected=view.projection.runs.find(run=>run.runRef?.runKey===key);
   assert.equal(projected.execution,'succeeded');assert.equal(projected.icon,'text-task');assert.equal(projected.result.kind,'fixture-text');assert.equal(projected.result.content,getRun(snapshot).result.content);assert.equal(projected.result.verification,'source-reported');
   results.push({mode,status:'PASS',delayed_fixture_lease_renewal:true,mixed_capacity:true,demo_progress_after_release:true,offline_owner_replay:true,workspace_result:true,provider_fixture_calls:calls});
  }else if(mode==='cancel'){
   await post(`/api/v1/runs/${key}/cancel`,'cancel-native-run');
   await until(async()=>{const s=await state();return getRun(s).native_execution.phase==='cancelled'&&s.runtime_capacity.active_subagents===0;},'cancelled native host');
   assert.equal(host.snapshot().status,'cancelled');snapshot=await state();assert.notEqual(getRun(snapshot).result.status,'available');assert.equal(calls,1);
   results.push({mode,status:'PASS',owner_cancellation:true,host_stopped:true,no_success_result:true,provider_fixture_calls:calls});
  }else{
   if(mode==='restart'){await stopWeb();await startWeb();}
   else {renameSync(host.socketPath,host.socketPath+'.hidden');await until(async()=>getRun(await state()).native_execution.phase==='needs_attention','host loss');renameSync(host.socketPath+'.hidden',host.socketPath);}
   snapshot=await state();assert.equal(getRun(snapshot).native_execution.phase,'needs_attention');assert.equal(snapshot.runtime_capacity.available_slots,0);assert.equal(calls,1);
   await post(`/api/v1/runs/${key}/reconcile-stop`,'reconcile-native-stop');assert.equal(host.snapshot().status,'cancelled');
   snapshot=await state();assert.equal(snapshot.runtime_capacity.active_subagents,0);assert.notEqual(getRun(snapshot).result.status,'available');
   await stopWeb();await startWeb();snapshot=await state();
   if(mode==='disconnect'){
    // Live coordinator stop confirmation is conservatively reserved again on restart.
    assert.equal(snapshot.runtime_capacity.active_subagents,1);
    await post(`/api/v1/runs/${key}/reconcile-stop`,'reconcile-native-stop');await stopWeb();await startWeb();snapshot=await state();
   }
   assert.equal(snapshot.runtime_capacity.active_subagents,0);assert.equal(calls,1);assert.notEqual(getRun(snapshot).result.status,'available');
   results.push({mode,status:'PASS',uncertain_capacity_retained:true,explicit_stop:true,durable_stop_recovery:true,no_redispatch:true,no_success_result:true,provider_fixture_calls:calls});
  }
  assert.equal(providerError,null);writeFileSync(resolve(out,mode+'.json'),JSON.stringify({result:results.at(-1),projection:await state(),external_model_calls:0},null,2)+'\n');
  console.log('PASS '+mode);
 }catch(error){
  let initializationDiagnostic=null;
  if(calls===0&&error.message.includes('initialize')){
   initializationDiagnostic=await new Promise(done=>{
    const child=spawn(resolve(installed.candidate,'bin/codex'),['app-server','--listen','stdio://'],{cwd:resolve(config.state,'codex'),env:{HOME:config.state,CODEX_HOME:resolve(config.state,'codex'),PATH:resolve(installed.candidate,'bin')+':/usr/bin:/bin',LANG:'C.UTF-8',ARE_PILOT_PROVIDER_TOKEN:'fixture-diagnostic'},stdio:['pipe','pipe','pipe']});
    let stdout='',stderr='';const timer=setTimeout(()=>child.kill('SIGKILL'),5000);
    child.stdout.on('data',b=>{stdout+=b;child.kill('SIGTERM');});child.stderr.on('data',b=>stderr+=b);
    child.on('exit',code=>{clearTimeout(timer);done({code,stdout:stdout.slice(0,2000),stderr:stderr.slice(0,4000)});});
    child.stdin.on('error',()=>{});child.stdin.write(JSON.stringify({id:1,method:'initialize',params:{clientInfo:{name:'fixture-diagnostic',version:'1.0.0'},capabilities:{experimentalApi:true}}})+'\n');
   });
  }
  writeFileSync(resolve(out,mode+'-failure.json'),JSON.stringify({error:error.message,stderr,provider_fixture_calls:calls,provider_error:providerError,host:host?.snapshot(),initializationDiagnostic},null,2));throw error;
 }
 finally{await app?.close();await stopWeb();await host?.close();for(const timer of timers)clearTimeout(timer);fixture.closeAllConnections();await new Promise(ok=>fixture.close(ok));rmSync(root,{recursive:true,force:true});}
}
assert.deepEqual(readFileSync(resolve(installed.state,'tasks.json')),before);
const report={status:'PASS',actual_shared_web_scheduler:true,actual_are_codex_native_transport:true,results,provider_fixture_calls:results.reduce((sum,r)=>sum+r.provider_fixture_calls,0),external_model_calls:0,installed_tasks_sha256:sha(before),installed_budget_unchanged:true,web_binary_sha256:sha(readFileSync(binary)),candidate_manifest_sha256:sha(readFileSync(resolve(installed.candidate,'MANIFEST.json'))),open_questions_ref:'../T6D-ACCEPTANCE.md#open-questions'};
writeFileSync(resolve(out,'acceptance.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
