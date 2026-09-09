import test from 'node:test';
import assert from 'node:assert/strict';
import {validateExport,collectPhaseEvidence} from './collector.mjs';
const expected={arm:'baseline',build_id:'a'.repeat(64),binary_sha256:'b'.repeat(64)};
const fixture=()=>({schema_version:'workspace.phase-export/v1',build_id:expected.build_id,arm:expected.arm,authority_effect:'none',
  receipts:[{schema_version:'workspace.handshake-phases/v1',session_id:'synthetic-session',attempt_id:'1',clock:'frontend-monotonic',
    frame_available:true,start_ms:1,status_end_ms:3,end_ms:9,status_ipc_ms:2,post_status_frame_ms:6,authority_effect:'none'}]});
test('synthetic export binds build and arm without qualifying host',()=>{
  const r=validateExport(fixture(),expected);assert.equal(r.ok,true);assert.equal(r.host_qualification,'not_evaluable');
});
test('wrong arm, build, extra content, no frame and duplicate handshakes fail closed',()=>{
  for(const mutate of [x=>x.arm='treatment',x=>x.build_id='c'.repeat(64),x=>x.chat='private',x=>x.receipts=[],x=>x.receipts.push(x.receipts[0]),x=>x.receipts[0].frame_available=false,x=>x.receipts[0].end_ms=0]){
    const v=fixture();mutate(v);assert.equal(validateExport(v,expected).ok,false);
  }
  assert.equal(validateExport(null,expected).ok,false);assert.equal(validateExport(fixture(),{}).ok,false);
});
test('collector reads one snapshot and validates it',async()=>{
  let calls=0;const browser={execute:async()=>{calls++;return fixture();}};
  assert.equal((await collectPhaseEvidence(browser,expected)).ok,true);assert.equal(calls,1);
});
