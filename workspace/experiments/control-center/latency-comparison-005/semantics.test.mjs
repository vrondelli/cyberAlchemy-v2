import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {setImmediate} from 'node:timers/promises';
import {verifySemantics} from './semantics.mjs';
const source=readFileSync('/home/vrondelli/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-2.11.5/scripts/ipc-protocol.js','utf8');
function harness(fetch){
  const posted=[],callbacks=[],warnings=[];
  const window={__TAURI_INTERNALS__:{convertFileSrc:cmd=>'ipc://'+cmd,runCallback:(id,data)=>callbacks.push({id,data})},ipc:{postMessage:data=>posted.push(JSON.parse(data))}};
  const code=source.replace('__TEMPLATE_invoke_key__',JSON.stringify('synthetic-key')).replace('__RAW_process_ipc_message_fn__','x=>({contentType:"application/json",data:JSON.stringify(x)})').replace('__TEMPLATE_os_name__',JSON.stringify('linux')).replace('__TEMPLATE_fetch_channel_data_command__',JSON.stringify('plugin:channel|fetch'));
  runInNewContext(code,{window,fetch,Headers,console:{warn:(...args)=>warnings.push(args)}});
  return {send:window.__TAURI_INTERNALS__.postMessage,posted,callbacks,warnings};
}
test('exact installed IPC source preserves successful false responses',async()=>{
  const h=harness(async()=>({headers:new Headers({'Tauri-Response':'ok','content-type':'application/json'}),json:async()=>false}));
  h.send({cmd:'status',callback:1,error:2,payload:{}});await setImmediate();
  assert.deepEqual(h.callbacks,[{id:1,data:false}]);assert.equal(h.posted.length,0);
});
test('native command errors take error callback, not transport retry',async()=>{
  const h=harness(async()=>({headers:new Headers({'Tauri-Response':'error','content-type':'text/plain'}),text:async()=>'inactive'}));
  h.send({cmd:'replay',callback:1,error:2,payload:{connectionId:0}});await setImmediate();
  assert.deepEqual(h.callbacks,[{id:2,data:'inactive'}]);assert.equal(h.posted.length,0);
});
test('transport failure preserves message identities and latches fallback',async()=>{
  let calls=0;const h=harness(async()=>{calls++;throw Error('synthetic transport failure');});
  const first={cmd:'status',callback:1,error:2,payload:{number:0,enabled:false}};
  h.send(first);await setImmediate();
  const second={cmd:'replay',callback:3,error:4,payload:{connectionId:0}};h.send(second);
  assert.equal(calls,1);assert.equal(h.warnings.length,1);assert.equal(h.posted.length,2);
  for(const [i,m] of [first,second].entries()){
    for(const k of ['cmd','callback','error','payload'])assert.deepEqual(h.posted[i][k],m[k]);
    assert.equal(h.posted[i].options.customProtocolIpcBlocked,true);
  }
});
test('native semantic result rejects swapped values, missing responses and wrong error',()=>{
  const r={statuses:Array(8).fill(true),inactiveDisconnect:false,replayError:'chat connection is not active'};
  assert.equal(verifySemantics(r),true);
  for(const patch of [{statuses:[true]},{statuses:Array(8).fill(false)},{inactiveDisconnect:true},{replayError:null}])assert.equal(verifySemantics({...r,...patch}),false);
});
