import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {processIdentity} from './app-server-host.mjs';
import {digest} from '../codex-host-recovery-v1/store.mjs';

const binary = process.env.ARE_APP_SERVER_BINARY;
assert.ok(binary,'ARE_APP_SERVER_BINARY must name the isolated patched binary');
const results = [];
async function fixture() {
  const directory = mkdtempSync(join(tmpdir(),'are-real-app-server-'));
  const calls = []; let hold = false;
  const server = createServer(async (request,response) => {
    let raw='';for await (const chunk of request) raw += chunk;
    if (request.method !== 'POST' || request.url !== '/v1/responses') {response.writeHead(404).end();return;}
    const body = JSON.parse(raw); calls.push(body);
    assert.equal(body.max_output_tokens,32);assert.equal(body.store,false);
    assert.equal(request.headers.authorization,undefined);
    if (hold) return;
    const id=`response-${calls.length}`;
    const events=[{type:'response.created',response:{id}},
      {type:'response.output_item.done',item:{type:'message',role:'assistant',id:`message-${calls.length}`,content:[{type:'output_text',text:'Offline answer.'}]}},
      {type:'response.completed',response:{id,usage:{input_tokens:100,output_tokens:4,total_tokens:104,input_tokens_details:null,output_tokens_details:null}}}];
    response.writeHead(200,{'content-type':'text/event-stream'}).end(events.map(x=>`data: ${JSON.stringify(x)}\n\n`).join(''));
  });
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  const provider=`http://127.0.0.1:${server.address().port}/v1`;
  const children=[];
  function start(crash,probe=false) {
    const child=fork(fileURLToPath(new URL('./coordinator.mjs',import.meta.url)),[JSON.stringify({directory,binary,provider,crash,probe})],{stdio:['ignore','pipe','pipe','ipc']});
    const messages=[]; let stderr='';child.stderr.on('data',x=>stderr+=x);
    child.on('message',m=>messages.push(m));
    const done=new Promise(ok=>child.on('exit',(code,signal)=>ok({code,signal,stderr})));
    const entry={child,messages,done};children.push(entry);return entry;
  }
  async function wait(entry,type) {
    for(let i=0;i<600;i++) {const message=entry.messages.find(x=>x.type===type || x.type==='error');if(message) {assert.notEqual(message.type,'error',message.message);return message;}
      if(entry.child.exitCode!==null || entry.child.signalCode) throw Error(`coordinator exited early: ${JSON.stringify(await entry.done)}`);
      await delay(100);
    } throw Error(`timeout ${type}`);
  }
  async function kill(entry) {
    const identity=entry.messages.find(x=>x.type==='server')?.identity;
    entry.child.kill('SIGKILL');
    if(identity && digest(processIdentity(identity.pid))===digest(identity)) process.kill(identity.pid,'SIGKILL');
    await entry.done;
    for(let i=0;identity && digest(processIdentity(identity.pid))===digest(identity);i++) {assert.ok(i<100,'native process did not stop');await delay(20);}
  }
  return {directory,calls,start,wait,kill,setHold:value=>hold=value,
    async finish(entry) {const result=await wait(entry,'result');assert.equal((await entry.done).code,0);return result;},
    async close(){for(const child of children) await kill(child);server.closeAllConnections();await new Promise(ok=>server.close(ok));}};
}
function assertComplete(result,calls) {
  assert.equal(result.outcome.status,'completed');
  assert.equal(result.outcome.state.completed.length,4);
  assert.deepEqual(result.outcome.state.lessons,['Prefer concise answers.']);
  assert.equal(calls.length,4,'no duplicated provider dispatch');
  for (const body of calls) {
    assert.ok(JSON.stringify(body).includes('Prefer concise answers.'),'restored lesson reaches native provider context');
    assert.ok(body.input.filter(x=>x.role==='assistant').length<=1,'recycled before the third answer in a context');
  }
  const routes = Object.values(result.routing.routes);
  assert.ok(routes.some(x=>x.generation>0 && x.capsule.state.completed.length>0),'completed work reaches the fresh capsule');
  const operationIds=calls.map(x=>x.input.filter(i=>i.role==='user').at(-1).content.map(c=>c.text).join(''));
  assert.equal(new Set(operationIds).size,4);
  assert.ok(result.outcome.recycles>=1);
}
for(const boundary of [null,'route-saved','before-step','native-completed','after-step','sealed']) {
  test(`real app-server recovery: ${boundary ?? 'normal recycling'}`,{timeout:180000},async()=>{
    const f=await fixture();try {
      if(boundary) {const first=f.start(boundary);await f.wait(first,'boundary');await f.kill(first);}
      const result=await f.finish(f.start());assertComplete(result,f.calls);
      // Reopening a completed task performs no provider work.
      assertComplete(await f.finish(f.start()),f.calls);
      results.push({case:boundary??'normal',status:'PASS',provider_calls:f.calls.length,recycles:result.outcome.recycles});
    }finally{await f.close();}
  });
}
for(const mode of ['dispatch-intent','provider-in-flight']) {
  test(`uncertain outcome stops: ${mode}`,{timeout:180000},async()=>{
    const f=await fixture();try {
      if(mode==='provider-in-flight') f.setHold(true);
      const first=f.start(mode==='dispatch-intent'?mode:'turn-started');await f.wait(first,'boundary');
      if(mode==='provider-in-flight') {for(let i=0;!f.calls.length;i++){assert.ok(i<300);await delay(100);}}
      await f.kill(first);f.setHold(false);
      const count=f.calls.length;const result=await f.finish(f.start());assert.equal(result.outcome.status,'reconcile');assert.equal(f.calls.length,count);
      results.push({case:mode,status:'PASS',outcome:'reconcile',provider_calls:count});
    }finally{await f.close();}
  });
}
for(const mode of ['corruption','binding-drift','writer-busy','live-lease']) {
  test(`routing rejects ${mode}`,{timeout:180000},async()=>{
    const f=await fixture();try {
      const first=f.start('route-saved');await f.wait(first,'boundary');
      if(mode==='writer-busy') { /* Keep the first coordinator's kernel lock. */ }
      else {await f.kill(first);const path=join(f.directory,'routing/checkpoint.json');const saved=JSON.parse(readFileSync(path,'utf8'));
        if(mode==='corruption') saved.checksum='bad';else {if(mode==='live-lease') saved.value.lease=processIdentity(process.pid);else saved.value.binding='changed';saved.checksum=digest(saved.value);}writeFileSync(path,JSON.stringify(saved));}
      const second=f.start();const exit=await second.done;assert.equal(exit.code,1);
      assert.match(second.messages.find(x=>x.type==='error')?.message??'',new RegExp(mode==='corruption'?'checkpoint-integrity':mode==='binding-drift'?'host-binding-drift':mode==='writer-busy'?'writer-busy':'previous-server-still-live'));
      assert.equal(f.calls.length,0);results.push({case:mode,status:'PASS',provider_calls:0});
    }finally{await f.close();}
  });
}
test('native app-server validates opt-in gate configuration',{timeout:180000},async()=>{
  const f=await fixture();try {const result=await f.finish(f.start(null,true));assert.deepEqual(result.checks,['rejected','rejected','rejected']);assert.equal(result.default_start,'PASS');assert.equal(f.calls.length,0);results.push({case:'native-config',status:'PASS',rejected_invalid_configs:3,provider_calls:0});}finally{await f.close();}
});
test.after(()=>{if(process.env.ARE_TEST_RECEIPT)writeFileSync(process.env.ARE_TEST_RECEIPT,JSON.stringify({cases:results,completed:results.length,model_calls:'local mock only',crash_method:'SIGKILL coordinator and app-server',open_questions_ref:'CONTRACT.json'},null,2)+'\n');});
