import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {startDecisionService} from '../codex-host-policy-v1/decision-service.mjs';
import {runRecovery} from './supervisor.mjs';
import {fixtureState} from './fixture-host.mjs';
assert.ok(process.env.ARE_CODEX_SOURCE && process.env.ARE_JUST_BIN,'explicit isolated source paths required');
const route=`/${randomUUID()}`;
let waiting, queued, receiver, readyResolve;
const ready=new Promise(resolve=>readyResolve=resolve);
const flush=()=>{if(waiting&&queued){waiting.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify(queued));waiting=null;queued=null;}};
const server=createServer(async(req,res)=>{
 try {
  assert.equal(req.method,'POST');assert.equal(req.url,route);
  const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;assert.ok(bytes<16384);chunks.push(chunk);}
  const reply=JSON.parse(Buffer.concat(chunks));
  if(reply.ready)readyResolve();else{assert.ok(receiver);receiver.resolve(reply);receiver=null;}
  assert.ok(!waiting);waiting=res;flush();
 }catch(e){res.writeHead(400).end();receiver?.reject(e);receiver=null;}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const child=spawn(process.env.ARE_JUST_BIN,['test','-p','codex-core','--test','all','--run-ignored','all','-E','test(context_recovery_native_supervisor)'],{
 cwd:process.env.ARE_CODEX_SOURCE,stdio:'inherit',env:{...process.env,RUSTUP_TOOLCHAIN:'1.95.0',ARE_OFFLINE_RECOVERY_COORDINATOR:`http://127.0.0.1:${server.address().port}${route}`}});
const exited=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>{receiver?.reject(Error('native peer exited'));receiver=null;resolve(code);});});
const rpc=command=>new Promise((resolve,reject)=>{assert.ok(!receiver&&!queued);receiver={resolve,reject};queued=command;flush();});
const contexts=new Map(), receipts=new Map(), peers=[];
let providerCalls=0;
const host={adapter_id:'source-built-codex-offline-fixture/v1',
 async open(request){
  const existing=[...contexts.values()].find(x=>x.handover_id===request.handover_id);if(existing)return existing.receipt;
  const scope=`native-recovery:${request.generation}`;
  const peer=await startDecisionService({scope,state_digest:request.capsule.source_state_digest,checkpoint_ref:request.handover_id,maximum_output_tokens:32,
   profiles:{'gpt-5.1':{limit_ref:'synthetic-native-recovery',measurement_ref:'synthetic-assistant-count-fixture',compaction_limit:150000,recycle_at:110000,safety_margin:10000,
    measure_request:({serialized_body})=>60000+30000*JSON.parse(serialized_body).input.filter(x=>x.role==='assistant').length}}});peers.push(peer);
  const result=await rpc({kind:'open',handover_id:request.handover_id,capsule_text:JSON.stringify(request.capsule),scope,policy_endpoint:peer.endpoint});
  const receipt={...result,handover_id:request.handover_id,generation:request.generation,capsule_digest:request.capsule.capsule_digest,evidence_ref:`native:injected:${result.context_id}`};
  contexts.set(result.context_id,{handover_id:request.handover_id,peer,receipt,sealed:false});return receipt;
 },
 async step(operation){
  assert.equal(operation.item.kind,'provider');
  const context=contexts.get(operation.context_id);assert.ok(context&&!context.sealed);
  const before=context.peer.snapshot().length;
  const result=await rpc({kind:'step',handover_id:context.handover_id,input:operation.item.input});
  assert.equal(result.context_id,operation.context_id);
  const decisions=context.peer.snapshot().slice(before);assert.equal(decisions.length,1);assert.equal(decisions[0].kind,'provider');
  const receipt={operation_id:operation.operation_id,context_id:operation.context_id,generation:operation.generation,evidence_ref:`native:${decisions[0].request_digest}`};
  if(result.stopped){assert.equal(decisions[0].action,'recycle');assert.equal(result.provider_calls,0);Object.assign(receipt,{status:'recycle',provider_sent:false,effects_started:false});}
  else {assert.equal(decisions[0].action,'continue');assert.equal(result.provider_calls,1);providerCalls++;Object.assign(receipt,{status:'completed',result:'offline-recovery-result'});}
  receipts.set(operation.operation_id,receipt);return receipt;
 },
 async lookup(operation){return receipts.get(operation.operation_id)??{...operation,status:'unknown',evidence_ref:'native:lookup-unavailable'};},
 async seal(context){
  const source=contexts.get(context.context_id);assert.ok(source);
  const result=await rpc({kind:'seal',handover_id:source.handover_id});source.sealed=true;
  return {...result,...context,evidence_ref:`native:shutdown:${context.context_id}`};
 }
};
const directory=mkdtempSync(join(tmpdir(),'are-native-recovery-'));
try {
 await Promise.race([ready,exited.then(code=>{throw Error(`native peer failed before ready: ${code}`);})]);
 const state=fixtureState();state.pending=state.pending.map(x=>({...x,kind:'provider'}));
 const result=await runRecovery({directory,task_id:'native-recovery',state,host});
 assert.equal(result.status,'completed');assert.equal(result.recycles,2);assert.equal(result.generation,2);
 assert.equal(result.state.completed.length,6);assert.deepEqual(result.state.pending,[]);assert.equal(providerCalls,6);
 assert.equal(contexts.size,3);assert.equal(new Set([...contexts.keys()]).size,3);
 for(const key of ['objective','constraints','facts','lessons'])assert.deepEqual(result.state[key],state[key]);
 for(const context of contexts.values())if(!context.sealed)await host.seal({context_id:context.receipt.context_id,generation:context.receipt.generation});
 assert.deepEqual(peers.map(peer=>peer.snapshot().map(d=>d.action)),[['continue','continue','recycle'],['continue','continue','recycle'],['continue','continue']]);
 queued={kind:'finish'};flush();assert.equal(await exited,0);
 writeFileSync('NATIVE-RECEIPT.json',JSON.stringify({status:'PASS',source_built_native_contexts:3,completed_operations:6,recycles:2,provider_calls:providerCalls,
  duplicate_operations:0,policy_decisions:peers.map(p=>p.snapshot()),state_preserved:true,paid_model_calls:0,native_compaction_events:0,
  limits:['Mock provider; synthetic meter','Native driver receipts are in-memory; crash recovery tested separately with durable fixture host','No production activation or live token-bound claim']},null,2)+'\n');
} finally {
 if(waiting){queued={kind:'finish'};flush();}
 await Promise.all(peers.map(p=>p.close()));
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 rmSync(directory,{recursive:true,force:true});
}
