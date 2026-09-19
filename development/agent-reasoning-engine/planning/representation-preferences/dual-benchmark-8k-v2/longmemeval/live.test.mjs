import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {executePairJob} from './live.mjs';
import {buildPairs} from './runner.mjs';
for(const unknown of [false,true])test(`parent preserves pair costs and stops new work; unknown=${unknown}`,async t=>{
 const directory=await mkdtemp(join(tmpdir(),'lme-parent-'));t.after(()=>rm(directory,{force:true,recursive:true}));
 const pair=buildPairs()[0],job={id:pair.id,pair,reservation_tokens:16000},health={stopped:false};let generated=0;
 const providerFactory=()=>({tokenize:async()=>({usage:{prompt_tokens:100}}),generate:async()=>{generated++;throw Object.assign(Error('capacity'),unknown?{}:{receipt:{status:503,usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}}});}});
 const options={directory,health,providerFactory,storage:{hostRoot:null,minimumFreeBytes:0}};
 await assert.rejects(executePairJob(job,options),e=>{assert.equal(e.result.unknown_usage,unknown);assert.equal(e.receipt.usage?.total_tokens,unknown?undefined:120);return true;});
 assert.equal(generated,1);assert.equal(health.stopped,true);
 await assert.rejects(executePairJob({...job,id:'later'},options),e=>e.receipt.usage.total_tokens===0);assert.equal(generated,1);
});

import {healthFailure} from './score-live.mjs';
for(const code of ['1302','1305'])test(`capacity code ${code} stops within a pair even with HTTP400`,async t=>{
 const directory=await mkdtemp(join(tmpdir(),'lme-code-'));t.after(()=>rm(directory,{force:true,recursive:true}));
 const pair=buildPairs()[0],health={stopped:false};let calls=0;
 const receipt={status:400,error_code:code,usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}};
 assert.equal(healthFailure({receipt}),true);
 await assert.rejects(executePairJob({id:pair.id,pair,reservation_tokens:16000},{directory,health,storage:{hostRoot:null,minimumFreeBytes:0},providerFactory:()=>({tokenize:async()=>({usage:{prompt_tokens:100}}),generate:async()=>{calls++;throw Object.assign(Error('capacity'),{receipt});}})}),e=>{assert.equal(e.receipt.usage.total_tokens,120);assert.equal(e.result.answers[1].status,'blocked');return true;});
 assert.equal(calls,1);assert.equal(health.stopped,true);
});

test('judge stops on malformed truthy usage rather than only missing usage',()=>{
 for(const usage of [{},{prompt_tokens:1,completion_tokens:1,total_tokens:1},{prompt_tokens:-1,completion_tokens:1,total_tokens:0},{prompt_tokens:0.5,completion_tokens:1,total_tokens:1.5}])assert.equal(healthFailure({receipt:{usage}}),true);
 assert.equal(healthFailure({receipt:{usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}}}),false);
});
