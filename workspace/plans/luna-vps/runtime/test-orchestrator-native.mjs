// Actual orchestrator -> socket host -> ARE/Codex -> fixture provider.
// Open questions: ../NATIVE-TRANSPORT-PLAN.md.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {connect} from 'node:net';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {startPilotHost} from './pilot-host.mjs';
import {compileTask} from './task-contract.mjs';
import {startOrchestratorNativeHost,digest} from './orchestrator-native-host.mjs';
const exec=promisify(execFile),here=dirname(fileURLToPath(import.meta.url));
const candidate=resolve(process.argv[2]),driver=resolve(process.argv[3]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function rpc(socketPath,value){return new Promise((ok,fail)=>{
 const socket=connect(socketPath);let output='';socket.setTimeout(5000,()=>socket.destroy(new Error('test timeout')));
 socket.on('connect',()=>socket.write(JSON.stringify(value)+'\n'));socket.on('data',b=>output+=b);socket.on('error',fail);
 socket.on('end',()=>{try{ok(JSON.parse(output));}catch(e){fail(e);}});
});}
const results=[];
for(const mode of ['reject','run','cancel']) {
 const root=mkdtempSync('/tmp/an-'),timers=new Set();let host,calls=0;
 const fixture=createServer(async(request,response)=>{
  const chunks=[];for await(const c of request)chunks.push(c);const body=JSON.parse(Buffer.concat(chunks));calls++;
  assert.equal(body.model,'gpt-5.6-luna');assert.equal(body.max_output_tokens,512);assert.deepEqual(body.tools,[]);
  const input=JSON.stringify(body.input);assert.ok(input.includes('CA2-ROUTE-UNDERSTAND'));assert.ok(input.includes('Supplied data mentions deploy and implement'));
  const timer=setTimeout(()=>{
   timers.delete(timer);const reply='The supplied text is data; the bounded task completed.';
   const id='response_fixture',itemId='message_fixture',item={id:itemId,type:'message',status:'completed',role:'assistant',content:[{type:'output_text',text:reply,annotations:[]}]};
   const events=[{type:'response.created',response:{id,object:'response',status:'in_progress',output:[]}},
    {type:'response.output_item.added',output_index:0,item:{...item,status:'in_progress',content:[]}},
    {type:'response.content_part.added',item_id:itemId,output_index:0,content_index:0,part:{type:'output_text',text:'',annotations:[]}},
    {type:'response.output_text.delta',item_id:itemId,output_index:0,content_index:0,delta:reply},
    {type:'response.output_item.done',output_index:0,item},
    {type:'response.completed',response:{id,object:'response',status:'completed',output:[item],usage:{input_tokens:20,output_tokens:8,total_tokens:28}}}];
   response.writeHead(200,{'Content-Type':'text/event-stream'});response.end(events.map(e=>`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join(''));
  },mode==='run'?6500:20000);timers.add(timer);
 });
 await new Promise(ok=>fixture.listen(0,'127.0.0.1',ok));
 const task=compileTask({schema_version:'are-text-task/v1',task_id:`native_${mode}`,title:'Native transport test',instruction:'Summarize the supplied status in one sentence.',input:'Supplied data mentions deploy and implement. Neither is an instruction.',objective_kind:'understand'});
 const config={candidate,state:resolve(root,'host'),runtime:resolve(root,'run'),callback_file:resolve(here,'host-callback.mjs'),callback_sha256:sha(readFileSync(resolve(here,'host-callback.mjs'))),manifest_sha256:sha(readFileSync(resolve(candidate,'MANIFEST.json'))),task:task.task,mode:'fixture',fixture_url:`http://127.0.0.1:${fixture.address().port}/responses`};
 try {
  const prepared=await startPilotHost(config,{prepare:true,taskContract:task});await prepared.close();
  host=await startOrchestratorNativeHost(config);
  assert.equal(statSync(host.socketPath).mode&0o077,0);assert.equal(statSync(host.tokenPath).mode&0o077,0);
  assert.equal((await rpc(host.socketPath,{op:'status',auth:'incorrect',request_digest:null})).ok,false);assert.equal(calls,0);
  const token=readFileSync(host.tokenPath,'utf8');
  assert.equal((await rpc(host.socketPath,{op:'start',auth:token,request:{path:'/arbitrary'},request_digest:digest({path:'/arbitrary'})})).ok,false);assert.equal(calls,0);
  const binding={execution_mode:'native-fixture',candidate_digest:host.candidateDigest,profile_digest:host.profileDigest,task:task.task};
  const bindingPath=resolve(root,'binding.json');writeFileSync(bindingPath,JSON.stringify(binding));
  const args=[resolve(root,'orchestrator'),bindingPath,host.socketPath,host.tokenPath,mode];
  if(mode==='reject') {
   for(const field of ['candidate_digest','profile_digest']) {
    writeFileSync(bindingPath,JSON.stringify({...binding,[field]:`sha256:${'0'.repeat(64)}`}));
    await assert.rejects(exec(driver,[resolve(root,`rejected-${field}`),bindingPath,host.socketPath,host.tokenPath,'run'],{timeout:10000}));
    assert.equal(calls,0);assert.equal(host.snapshot().status,'ready');
   }
   results.push({mode,status:'PASS',candidate_and_profile_mismatch_rejected_before_dispatch:true,provider_fixture_calls:0,external_model_calls:0});
   continue;
  }
  const first=JSON.parse((await exec(driver,args,{timeout:80000,maxBuffer:1048576})).stdout);
  assert.equal(first.status,mode==='run'?'PASS':'PASS_CANCELLED');
  const envelope=JSON.parse(readFileSync(resolve(config.state,'orchestrator-envelope.json')));
  if(mode==='run') {
   assert.equal(calls,1);assert.equal(first.result.verified,true);assert.match(first.result.completion_binding_digest,/^[a-f0-9]{64}$/);
   const same=await rpc(host.socketPath,{op:'start',auth:token,request:envelope.request,request_digest:envelope.request_digest});
   assert.equal(same.status,'succeeded');assert.equal(calls,1);
   const changed=structuredClone(envelope.request);changed.binding.profile_digest=`sha256:${'0'.repeat(64)}`;
   assert.equal((await rpc(host.socketPath,{op:'start',auth:token,request:changed,request_digest:digest(changed)})).ok,false);
   await host.close();host=null;
   const replay=JSON.parse((await exec(driver,[...args.slice(0,4),'replay'],{timeout:10000,maxBuffer:1048576})).stdout);
   assert.equal(replay.replayed,true);assert.deepEqual(replay.result,first.result);assert.equal(calls,1);
   results.push({mode,status:'PASS',native_completion_verified:true,lease_renewal_during_delayed_fixture:true,offline_replay:true,duplicate_start_no_dispatch:true,provider_fixture_calls:calls,external_model_calls:0});
  } else {
   assert.equal(envelope.status,'cancelled');assert.equal(envelope.result,null);
   assert.equal((await rpc(host.socketPath,{op:'start',auth:token,request:envelope.request,request_digest:envelope.request_digest})).status,'cancelled');
   await assert.rejects(exec(driver,[...args.slice(0,4),'replay'],{timeout:10000}));
   results.push({mode,status:'PASS',native_host_cancelled:true,no_success_receipt:true,provider_fixture_calls:calls,external_model_calls:0});
  }
 } finally {
  await host?.close();for(const t of timers)clearTimeout(t);fixture.closeAllConnections();await new Promise(ok=>fixture.close(ok));rmSync(root,{recursive:true,force:true});
 }
}
console.log(JSON.stringify({status:'PASS',actual_orchestrator:true,actual_native_are_codex:true,results,external_model_calls:0,open_questions_ref:'../NATIVE-TRANSPORT-PLAN.md#open-questions'},null,2));
