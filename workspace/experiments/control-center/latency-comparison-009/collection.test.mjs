import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classify,collectBounded} from './collection.mjs';
const pending={hasPhaseExport:false,hasTauri:true,samples:[]};
const row={name:'workspace.tauri.chat-cold-ipc-handshake',durationMs:2,recordedAtUnixMs:100};
const ready={...pending,samples:[row]};
test('pending and ready are distinct without interpreting duration as a budget pass',()=>{
  assert.equal(classify(pending).state,'aggregate-pending');
  assert.equal(classify(ready).receipt.performance_inference,'not_evaluable');
});
test('instrumented, malformed and duplicate snapshots fail closed',()=>{
  for(const v of [null,{...ready,hasPhaseExport:true},{...ready,samples:{}},{...ready,samples:[row,row]},{...ready,samples:[{...row,durationMs:-1}]}])assert.throws(()=>classify(v));
});
test('bounded collector polls pending then captures ready',async()=>{
  let time=0,script,count=0;const states=[];
  const r=await collectBounded(async(path,body,method)=>{
    time+=10;if(path.endsWith('/timeouts')){if(method==='POST')script=body.script;return {script};}
    return count++===0?pending:ready;
  },'s',null,{now:()=>time,sleep:async ms=>{time+=ms;},record:e=>states.push(e.state)});
  assert.equal(r.phase_export_absent,true);assert.ok(states.includes('aggregate-pending'));
});
test('deadline and driver errors remain terminal',async()=>{
  let time=0,script;
  await assert.rejects(collectBounded(async(path,body,method)=>{
    if(path.endsWith('/timeouts')){if(method==='POST')script=body.script;return {script};}return pending;
  },'s',null,{now:()=>time,sleep:async ms=>{time+=ms;}}),/collection-deadline/);
  let calls=0;await assert.rejects(collectBounded(async()=>{calls++;throw Error('driver-error');},'s',null),/driver-error/);assert.equal(calls,1);
});
