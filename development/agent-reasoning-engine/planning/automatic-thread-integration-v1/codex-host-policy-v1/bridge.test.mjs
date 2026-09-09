import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {startDecisionService} from './decision-service.mjs';
const exec = promisify(execFile);
const probe = process.env.ARE_HOST_GATE_PROBE;
assert.ok(probe, 'ARE_HOST_GATE_PROBE must point to the compiled Rust probe');
const body = {model:'fixture-model',input:[{role:'user',content:'synthetic fixture'}]};
const profile = {limit_ref:'synthetic-limit',measurement_ref:'synthetic-byte-meter',compaction_limit:10000,recycle_at:9000,safety_margin:100,measure_request:({serialized_body})=>Buffer.byteLength(serialized_body)};
const hash = text => createHash('sha256').update(text).digest('hex');
async function service(t, override = {}) {
 const peer = await startDecisionService({scope:'fixture-scope',state_digest:'a'.repeat(64),checkpoint_ref:'synthetic-checkpoint',maximum_output_tokens:32,profiles:{'fixture-model':{...profile,...override}}});
 t.after(()=>peer.close()); return peer;
}
async function server(t, handler) {
 const server=createServer(handler); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
 return `http://127.0.0.1:${server.address().port}`;
}
async function provider(t, status=200) {
 const received=[];
 const endpoint=await server(t,async(req,res)=>{const chunks=[];for await(const c of req)chunks.push(c);received.push(Buffer.concat(chunks).toString());res.writeHead(status).end('ok');});
 return {endpoint:endpoint+'/responses',received};
}
async function run(peer, target, value=body) {
 const {stdout,stderr}=await exec(probe,[peer.endpoint,target,JSON.stringify(value)],{timeout:8000,maxBuffer:8192});
 assert.equal(stderr,''); return stdout.trim();
}

test('Rust sends exactly the full capped body evaluated by ARE',async t=>{
 const peer=await service(t);const remote=await provider(t);
 assert.equal(await run(peer,remote.endpoint),'allowed');
 assert.equal(remote.received.length,1);
 const sent=JSON.parse(remote.received[0]);assert.equal(sent.max_output_tokens,32);assert.equal(sent.store,false);
 assert.deepEqual(sent.input,body.input);
 assert.equal(peer.snapshot()[0].request_digest,hash(remote.received[0]));
 assert.equal(peer.snapshot()[0].action,'continue');
});
test('ARE threshold equality stops before provider dispatch',async t=>{
 const peer=await service(t,{measure_request:()=>100,recycle_at:132});const remote=await provider(t);
 assert.equal(await run(peer,remote.endpoint),'stopped');assert.equal(remote.received.length,0);
 assert.equal(peer.snapshot()[0].action,'recycle');
});
test('unknown input bound fails closed',async t=>{
 const peer=await service(t,{measure_request:()=>undefined});const remote=await provider(t);
 assert.equal(await run(peer,remote.endpoint),'stopped');assert.equal(remote.received.length,0);
});
test('unknown model fails closed',async t=>{
 const peer=await service(t);const remote=await provider(t);
 assert.equal(await run(peer,remote.endpoint,{...body,model:'unmeasured'}),'stopped');assert.equal(remote.received.length,0);
});
test('native compaction produces a recycle stop through the real ARE service',async t=>{
 const peer=await service(t);
 assert.equal(await run(peer,'compact'),'stopped');
 assert.equal(peer.snapshot()[0].kind,'native_compaction');assert.equal(peer.snapshot()[0].action,'recycle');
});
test('a peer cannot authorize native compaction',async t=>{
 const endpoint=await server(t,async(req,res)=>{let text='';for await(const c of req)text+=c;res.end(JSON.stringify({...JSON.parse(text),action:'continue'}));});
 assert.equal(await run({endpoint},'compact'),'stopped');
});
test('changed response bindings cannot release a request',async t=>{
 const remote=await provider(t);
 for(const field of ['request_id','request_digest','scope','version']) {
  const endpoint=await server(t,async(req,res)=>{let text='';for await(const c of req)text+=c;res.end(JSON.stringify({...JSON.parse(text),action:'continue',[field]:'wrong'}));});
  assert.equal(await run({endpoint},remote.endpoint),'stopped');
 }
 assert.equal(remote.received.length,0);
});
test('policy redirects and stalled responses cannot dispatch',async t=>{
 const remote=await provider(t);
 const redirect=await server(t,(_,res)=>res.writeHead(307,{location:remote.endpoint}).end());
 assert.equal(await run({endpoint:redirect},remote.endpoint),'stopped');
 const stalled=await server(t,()=>{});
 assert.equal(await run({endpoint:stalled},remote.endpoint),'stopped');
 assert.equal(remote.received.length,0);
});
test('provider retries require another policy decision',async t=>{
 const peer=await service(t);const remote=await provider(t,503);
 assert.equal(await run(peer,remote.endpoint),'stopped');assert.equal(remote.received.length,1);
 assert.equal(await run(peer,remote.endpoint),'stopped');assert.equal(remote.received.length,2);
 assert.equal(peer.snapshot().length,2);assert.notEqual(peer.snapshot()[0].request_id,peer.snapshot()[1].request_id);
});
test('incremental input never reaches policy or provider',async t=>{
 const peer=await service(t);const remote=await provider(t);
 assert.equal(await run(peer,remote.endpoint,{...body,previous_response_id:'previous'}),'stopped');
 assert.equal(peer.snapshot().length,0);assert.equal(remote.received.length,0);
});
test('service rejects repeated identity and mismatched payload digest',async t=>{
 const peer=await service(t);
 const serialized=JSON.stringify({...body,store:false,max_output_tokens:32});
 const message={version:1,scope:'fixture-scope',request_id:'one',request_digest:hash(serialized),kind:'provider',body:serialized};
 const send=value=>fetch(peer.endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)});
 assert.equal((await send(message)).status,200);assert.equal((await send(message)).status,400);
 assert.equal((await send({...message,request_id:'two',body:serialized+' '})).status,400);
});
