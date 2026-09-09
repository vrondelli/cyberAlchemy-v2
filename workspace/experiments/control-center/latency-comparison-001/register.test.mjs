import test from 'node:test';
import assert from 'node:assert/strict';
import {probeHandshake} from './phase-probe.mjs';
import {validateRows,assessRegistration,loadDesign} from './register.mjs';
async function fixture(extra={}){
  const receipts=[],times=[10,13,29];
  const result=await probeHandshake({invokeStatus:async()=>false,frame:cb=>cb(),now:()=>times.shift(),sessionId:'fixture-session',attemptId:'fixture-attempt',emit:r=>receipts.push(r),...extra});
  return {receipts,result};
}
test('synthetic timing receipt separates IPC and frame without changing false response',async()=>{
  const {receipts,result}=await fixture();assert.equal(result,false);assert.equal(receipts[0].status_ipc_ms,3);assert.equal(receipts[0].post_status_frame_ms,16);
  assert.equal(validateRows(JSON.stringify(receipts[0])).ok,true);
});
test('errors propagate unchanged, and no success receipt is fabricated',async()=>{
  const error=Error('status failed');let emitted=false;
  await assert.rejects(fixture({invokeStatus:async()=>{throw error;},emit:()=>{emitted=true;}}),e=>e===error);assert.equal(emitted,false);
});
test('diagnostic sink failure preserves successful result',async()=>{assert.equal((await fixture({emit:()=>{throw Error('sink');}})).result,false);});
test('missing frame and backward clock remain distinguishable',async()=>{
  assert.equal((await fixture({frame:null})).receipts[0].frame_available,false);
  const times=[10,9,11];assert.equal((await fixture({now:()=>times.shift()})).receipts.length,0);
});
test('row validator rejects missing identity, extra content, bad clock and forged durations',async()=>{
  const {receipts:[r]}=await fixture();
  for(const mutate of [x=>delete x.session_id,x=>x.chat_text='private',x=>x.clock='wall',x=>x.status_ipc_ms=999,x=>x.end_ms=-1,x=>x.authority_effect='approve']){
    const copy=structuredClone(r);mutate(copy);assert.equal(validateRows(JSON.stringify(copy)).ok,false);
  }
  assert.equal(validateRows('broken').ok,false);assert.equal(validateRows(JSON.stringify(r)+'\n'+JSON.stringify(r)).ok,false);
});
test('registration collects all missing prerequisites and never completes from fixtures',()=>{
  const r=assessRegistration();assert.equal(r.checks[0].status,'PASS');assert.equal(r.registration_status,'incomplete');
  assert.equal(r.checks.length,7);assert.equal(r.checks.filter(c=>c.status==='not_evaluable').length,6);
  assert.equal(r.operational_support[0].blocks_current_construction,false);
  const d=loadDesign();assert.equal(d.qualified_sessions_per_arm,40);assert.equal(d.max_attempts_per_arm,60);
});
