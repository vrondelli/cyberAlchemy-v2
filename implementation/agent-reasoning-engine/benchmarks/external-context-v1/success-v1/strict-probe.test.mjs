import test from 'node:test';import assert from 'node:assert/strict';
import {enforceProbe,handleProbeError} from './strict-probe.mjs';
test('infrastructure failures escape tool feedback and prevent subsequent dispatch',()=>{
 for(const run of [()=>{throw Error('timeout')},()=>({status:'execution_error',cleanup_verified:true}),()=>({status:'passed',cleanup_verified:false})]) {
  let dispatched=0;
  assert.throws(()=>{try{enforceProbe(run,{})}catch(e){handleProbeError(e)}dispatched++;},e=>e.code==='public-diagnostic-infrastructure-failure');
  assert.equal(dispatched,0);
 }
});
test('ordinary candidate failures remain revisable',()=>{
 const r={status:'failed',cleanup_verified:true};assert.equal(enforceProbe(()=>r,{}),r);
 assert.equal(handleProbeError(Error('unknown candidate')).ok,false);
});
