import test from 'node:test';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {runOwnedContainer} from '../owned-container.mjs';
const config={type:'container',engine:'/usr/bin/docker',image:'node@sha256:'+'a'.repeat(64),allowed_commands:['node'],timeout_ms:1000,maximum_output_bytes:4096,memory:'512m',cpus:'2',pids_limit:64};
function run(execute,command=['node','--version']){return runOwnedContainer({config,repository_root:tmpdir(),command},{execute});}
test('sandbox constraints and exact cleanup survive successful execution',()=>{
 const calls=[];const r=run((engine,args,options)=>{calls.push(args);if(args[0]==='run'){assert.ok(args.includes('--read-only'));assert.ok(args.includes('never'));assert.ok(args.includes('none'));assert.equal(options.maxBuffer,4096);return {status:0,stdout:'v26.8.1',stderr:''};}return {status:0,stdout:'',stderr:''};});
 assert.equal(r.ok,true);assert.equal(calls[1][2],r.container_name);assert.ok(calls[2].includes(`name=^/${r.container_name}$`));
});
test('timed-out Docker client still triggers owned-container removal',()=>{
 const calls=[];const r=run((engine,args)=>{calls.push(args);return args[0]==='run'?{status:null,error:{code:'ETIMEDOUT'}}:{status:0,stdout:''};});assert.equal(r.ok,false);assert.equal(r.cleanup.verified_absent,true);assert.equal(calls.length,3);assert.deepEqual(r.sandbox.reason_codes,['sandbox.command-timeout']);
});
test('cleanup cannot claim success when container remains',()=>{
 const r=run((engine,args)=>({status:0,stdout:args[0]==='container'?'still-present':''}));assert.equal(r.ok,false);assert.equal(r.cleanup.verified_absent,false);
});
test('denied command never launches or removes a container',()=>{
 const r=run(()=>assert.fail(),['bash']);assert.equal(r.ok,false);assert.equal(r.cleanup.attempted,false);
});
test('launch exception still attempts cleanup',()=>{
 let n=0;const r=run(()=>{if(n++===0)throw Error('launch failed');return {status:0,stdout:''};});assert.equal(r.ok,false);assert.equal(n,3);assert.equal(r.cleanup.verified_absent,true);
});
