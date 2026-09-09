import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classify,collectBounded} from './collection.mjs';
const expected={arm:'baseline',build_id:'a'.repeat(64),binary_sha256:'b'.repeat(64)};
const empty={schema_version:'workspace.phase-export/v1',arm:expected.arm,build_id:expected.build_id,receipts:[],authority_effect:'none'};
const ready={...empty,receipts:[{schema_version:'workspace.handshake-phases/v1',session_id:'s',attempt_id:'a',clock:'frontend-monotonic',frame_available:true,start_ms:0,status_end_ms:1,end_ms:2,status_ipc_ms:1,post_status_frame_ms:1,authority_effect:'none'}]};
function fixture(values){
  let time=0,script,calls=0;const events=[];
  return {events,get calls(){return calls;},options:{now:()=>time,sleep:async ms=>{time+=ms;},record:e=>events.push(e)},
    request:async(path,body,method,ms)=>{assert.ok(ms<=10000&&ms>0);time+=10;
      if(path.endsWith('/timeouts')){if(method==='POST')script=body.script;return {script};}
      calls++;const v=values.shift();if(v instanceof Error)throw v;return v??null;}};
}
test('explicit absent, empty and ready transitions',async()=>{
  const f=fixture([null,empty,ready]);const r=await collectBounded(f.request,'s',expected,f.options);
  assert.equal(r.ok,true);assert.deepEqual(f.events.filter(e=>e.state!=='configuring').map(e=>e.state),['export-pending','receipt-pending','ready']);
});
test('pending exhausts one deadline',async()=>{
  const f=fixture([]);await assert.rejects(collectBounded(f.request,'s',expected,f.options),/collection-deadline/);assert.ok(f.calls<50);
});
test('script and transport failures are not retried',async()=>{
  for(const msg of ['webdriver:script timeout','HTTP abort']){const f=fixture([Error(msg),ready]);await assert.rejects(collectBounded(f.request,'s',expected,f.options),new RegExp(msg));assert.equal(f.calls,1);}
});
test('malformed export and identity mismatch fail immediately',async()=>{
  for(const value of [{},undefined,{...empty,build_id:'c'.repeat(64)},{...ready,receipts:[{}]}])assert.throws(()=>classify(value,expected),/invalid-export/);
  assert.throws(()=>classify(null,{}),/invalid-expected-identity/);
});
test('timeout readback mismatch is terminal',async()=>{
  await assert.rejects(collectBounded(async()=>({script:30000}),'s',expected),/driver-timeout-mismatch/);
});
test('late ready response cannot pass deadline',async()=>{
  let time=0;
  await assert.rejects(collectBounded(async path=>{if(path.endsWith('/timeouts'))return {script:5000};time=10001;return ready;},'s',expected,{now:()=>time}),/collection-deadline/);
});
