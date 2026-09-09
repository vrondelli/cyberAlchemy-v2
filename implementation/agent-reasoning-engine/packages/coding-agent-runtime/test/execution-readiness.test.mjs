import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {measureExecutionReadiness} from '../execution-readiness.mjs';
import {SecretResolutionError} from '../secret-provider.mjs';
const good=createHash('sha256').update('are-readiness-v1').digest('hex');
function clock(step=10){let n=0;return ()=>n+=step;}
test('fast verified children and secret consumption admit',async()=>{
 let children=0,secrets=0;
 const r=await measureExecutionReadiness({consume_secret:async()=>{secrets++;}},{execute:(command,args,options)=>{children++;assert.ok(args.includes('--permission'));assert.deepEqual(options.env,{});assert.equal(options.timeout,1000);return good;},now:clock()});
 assert.equal(r.ready,true);assert.equal(children,3);assert.equal(secrets,1);
});
test('slow child prevents all secret access',async()=>{
 const r=await measureExecutionReadiness({consume_secret:async()=>assert.fail()},{execute:()=>good,now:clock(600)});
 assert.equal(r.ready,false);assert.equal(r.secret.attempted,false);assert.equal(r.children[0].reason,'child-latency');
});
test('timeout is classified without arbitrary error text',async()=>{
 const r=await measureExecutionReadiness({consume_secret:async()=>assert.fail()},{execute:()=>{throw Object.assign(Error('private-sentinel'),{code:'ETIMEDOUT'});},now:clock()});
 assert.equal(r.ready,false);assert.equal(r.children[0].reason,'child-timeout');assert.ok(!JSON.stringify(r).includes('private-sentinel'));
});
test('incorrect sentinel cannot admit execution',async()=>{
 const r=await measureExecutionReadiness({consume_secret:async()=>assert.fail()},{execute:()=>'ok',now:clock()});assert.equal(r.ready,false);
});
test('typed secret timeout is retained safely',async()=>{
 const r=await measureExecutionReadiness({consume_secret:async()=>{throw new SecretResolutionError('timeout');}},{execute:()=>good,now:clock()});assert.equal(r.ready,false);assert.equal(r.secret.reason,'timeout');
});
test('slow successful secret is not ready',async()=>{
 let n=0;const ticks=[0,10,20,30,40,50,60,1200];
 const r=await measureExecutionReadiness({consume_secret:async()=>{}},{execute:()=>good,now:()=>ticks[n++]});assert.equal(r.ready,false);assert.equal(r.secret.reason,'secret-latency');
});
