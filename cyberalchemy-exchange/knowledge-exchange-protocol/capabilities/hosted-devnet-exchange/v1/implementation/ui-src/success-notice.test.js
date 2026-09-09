import test from 'node:test';
import assert from 'node:assert/strict';
import {createSuccessDismissal} from './success-notice.js';
function harness() {
  const state={notice:'Done.',busy:false,error:false}, callbacks=[];
  const controller=createSuccessDismissal({read:()=>state,dismiss:()=>{state.notice='';},schedule:(fn,ms)=>{assert.equal(ms,3500);callbacks.push(fn);return callbacks.length;},cancel:()=>{}});
  return {state,callbacks,controller};
}
test('completed success disappears',()=>{const h=harness();h.controller.start();h.callbacks[0]();assert.equal(h.state.notice,'');});
test('errors, instructions and active work survive an older timer',()=>{
 for(const change of [{error:true},{notice:'Review the retention policy'},{busy:true}]) {
  const h=harness();h.controller.start();Object.assign(h.state,change);const before={...h.state};h.callbacks[0]();assert.deepEqual(h.state,before);
 }
});
test('cancelled completion cannot clear a newer success',()=>{const h=harness();h.controller.start();h.controller.cancel();h.controller.start();h.callbacks[0]();assert.equal(h.state.notice,'Done.');h.callbacks[1]();assert.equal(h.state.notice,'');});

test('specific success expires without clearing a replacement notice',()=>{const h=harness();h.state.notice='Download requested.';h.controller.start(h.state.notice);h.state.notice='Keep recovery file';h.callbacks[0]();assert.equal(h.state.notice,'Keep recovery file');h.state.notice='Download requested.';h.controller.start(h.state.notice);h.callbacks[1]();assert.equal(h.state.notice,'');});
