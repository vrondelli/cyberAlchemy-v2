import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classify,collectBounded} from './collection.mjs';
const identity={arm:'baseline',build_id:'a'.repeat(64),binary_sha256:'b'.repeat(64)};
const sample={name:'workspace.tauri.chat-cold-ipc-handshake',durationMs:2,recordedAtUnixMs:100};
const row={schema_version:'workspace.handshake-phases/v1',session_id:'s',attempt_id:'a',clock:'frontend-monotonic',frame_available:true,start_ms:0,status_end_ms:1,end_ms:2,status_ipc_ms:1,post_status_frame_ms:1,authority_effect:'none'};
const phase={schema_version:'workspace.phase-export/v1',arm:'baseline',build_id:identity.build_id,receipts:[row],authority_effect:'none'};
const baseline={hasTauri:true,hasPhaseExport:true,phase,samples:[sample]};
const control={hasTauri:true,hasPhaseExport:false,phase:null,samples:[sample]};
test('both arms capture the same aggregate metric',()=>{
  assert.equal(classify({...baseline,phase:{...phase,receipts:[]}},identity).state,'phase-pending');
  assert.deepEqual(classify(baseline,identity).receipt.sample,classify(control,{...identity,arm:'uninstrumented'}).receipt.sample);
});
test('wrong arm, build, malformed aggregate and duplicate handshake fail',()=>{
  for(const [s,i] of [[baseline,{...identity,arm:'uninstrumented'}],[baseline,{...identity,build_id:'c'.repeat(64)}],[baseline,{...identity,arm:'treatment'}],[{...baseline,samples:[sample,sample]},identity],[{...baseline,samples:[{...sample,durationMs:-1}]},identity]])assert.throws(()=>classify(s,i));
});
test('missing export waits; valid phase and aggregate complete',async()=>{
  let clock=0,script,n=0;
  const r=await collectBounded(async(path,body,method)=>{
    clock+=10;if(path.endsWith('/timeouts')){if(method==='POST')script=body.script;return {script};}
    return n++===0?{...control,samples:[]}:baseline;
  },'s',identity,{now:()=>clock,sleep:async ms=>{clock+=ms;}});
  assert.equal(r.expected_identity.build_id,identity.build_id);assert.equal(n,2);
});
test('driver errors stop without retry',async()=>{
  let n=0;await assert.rejects(collectBounded(async()=>{n++;throw Error('driver');},'s',identity),/driver/);assert.equal(n,1);
});
