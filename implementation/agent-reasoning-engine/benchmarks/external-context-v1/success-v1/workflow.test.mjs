import test from 'node:test';import assert from 'node:assert/strict';import {createWorkflow} from './workflow.mjs';import {validateArgs} from './contract.mjs';import {createGlmClient} from './transport.mjs';
const hypotheses=[{claim:'A',evidence_refs:['source:1'],prediction:'red',falsifier:'green'},{claim:'B',evidence_refs:['source:2'],prediction:'green',falsifier:'red'}];
const candidate=i=>({patch:'diff'+i,files:[{path:'packages/svelte/src/a.js',before_sha256:'a'.repeat(64),after_sha256:String(i).repeat(64)}]});
test('requires hypotheses, inspected source and bounded candidate revisions',()=>{
 const w=createWorkflow(),seen=new Set(['packages/svelte/src/a.js']);assert.throws(()=>w.stage(candidate(1),seen),/hypotheses/);w.hypotheses(hypotheses);assert.throws(()=>w.stage(candidate(1),new Set()),/uninspected/);
 const a=w.stage(candidate(1),seen),b=w.stage(candidate(2),seen);assert.equal(w.stage(candidate(1),seen).candidate_id,a.candidate_id);assert.throws(()=>w.stage(candidate(3),seen),/budget/);
 w.recordProbe(a.candidate_id,{candidate_id:a.candidate_id,status:'passed'});assert.equal(w.finalize(b.candidate_id).public_test,null);assert.equal(w.finalize(a.candidate_id).public_test.status,'passed');assert.throws(()=>w.recordProbe(b.candidate_id,{candidate_id:a.candidate_id}),/mismatch/);
 assert.ok(w.notice(4).includes(a.candidate_id));for(let i=0;i<4;i++)w.reserveProbe();assert.throws(()=>w.reserveProbe(),/budget/);
});
test('whole schema validation rejects malformed candidate and extra fields',()=>{
 assert.equal(validateArgs('record_hypotheses',JSON.stringify({hypotheses})).ok,true);assert.equal(validateArgs('submit_patch_candidate',JSON.stringify({candidate_id:'a'.repeat(64),edits:[]})).ok,false);assert.equal(validateArgs('run_public_reproducer',JSON.stringify({candidate_id:'baseline',probe_id:'hidden'})).ok,false);
});
test('24 calls require explicitly identified diagnostic policy',()=>{
 const config={chat_endpoint:'http://127.0.0.1:1/chat/completions',tokenizer_endpoint:'http://127.0.0.1:1/tokenizer'};
 assert.throws(()=>createGlmClient({...config,maximum_requests:24}),/limits/);assert.equal(createGlmClient({...config,maximum_requests:24,request_budget:'diagnostic-v1'}).maximum_requests,24);assert.throws(()=>createGlmClient({...config,maximum_requests:25,request_budget:'diagnostic-v1'}),/limits/);
 assert.notEqual(createGlmClient({...config,request_budget:'diagnostic-v1'}).identity,createGlmClient(config).identity);
});
