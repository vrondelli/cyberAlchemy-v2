import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';
import {pressureMessage,shouldInject,verifyPressureDispatch} from './pressure.mjs';
import {createRecoveryController} from '../recovery-v1/recovery.mjs';
import {openContextRecycling,createStatelessRecyclingTransport} from '../../../packages/coding-agent-runtime/context-recycling.mjs';
test('fixed padding and injection condition',()=>{
 assert.ok(Buffer.byteLength(JSON.stringify(pressureMessage()))<110000);assert.equal(pressureMessage().content.split('pressure ballast ').length-1,6000);
 assert.equal(shouldInject(0,[]),false);assert.equal(shouldInject(3,[]),true);assert.equal(shouldInject(1,[{tool:'read_file',result:{ok:true}}]),true);
 assert.throws(()=>verifyPressureDispatch([{generation:0},{generation:0}],0),/not admitted/);
});
test('transport copy changes only relative imports and pre-dispatch pressure guard',()=>{
 let original=readFileSync(new URL('../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs',import.meta.url),'utf8').replaceAll("from '../secret-provider.mjs'","from '../../../packages/coding-agent-runtime/secret-provider.mjs'").replace("from '../context-recycling.mjs'","from '../../../packages/coding-agent-runtime/context-recycling.mjs'");
 original=original.replace('async request_once({prompt, dispatch}) {',"async request_once({prompt, dispatch}) {\n      need(dispatch.generation > 0 || !prompt.includes('pressure ballast '), 'pressure-transition-required');");
 assert.equal(readFileSync(new URL('./transport.mjs',import.meta.url),'utf8'),'// Isolated pressure guard; upstream transport otherwise unchanged. Open questions: PLAN.md.\n'+original);
});
test('actual recycler removes injected pressure before dispatch and retains recovery anchor',async()=>{
 const dir=mkdtempSync(tmpdir()+'/pressure94-');mkdirSync(dir+'/fixture');let r;
 try{
 const sent=[],measured=[];const t=createStatelessRecyclingTransport({adapter_id:'pressure-test',source_ref:'pressure.test.mjs',maximum_output_tokens:2048,measure_request:async({prompt})=>{measured.push(prompt);return prompt.includes('pressure ballast ')?15000:500;},request_once:async({prompt})=>{assert.ok(!prompt.includes('pressure ballast '));sent.push(prompt);return {final_bytes:'ok'};}});
 r=openContextRecycling({transport:t,fixture_root:dir+'/fixture',scope:{request:'real task placeholder'},options:{directory:dir+'/state',context_limit:16384,recycle_at:12000,safety_margin:1000,state:{objective:'real task placeholder',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['fixture']}}});
 const c=createRecoveryController(),history=[];const render=(visible,meta)=>JSON.stringify({visible,notice:c.notice(meta)});
 await r.generate({history,render,run_id:'test'});history.push({role:'assistant',content:'inspected evidence'},pressureMessage());r.completeStep(history,false);
 await r.generate({history,render,run_id:'test'});assert.equal(verifyPressureDispatch(r.snapshot().dispatches,0).exercised,true);assert.equal(measured.length,3);assert.equal(sent.length,2);
 const anchor=c.snapshot().recovery.digest;r.beforeTool();const page=c.read({digest:anchor,offset:0,max_chars:100},args=>r.readEvidence(args));assert.equal(page.ok,true);history.push({role:'assistant',content:'recovered'});r.completeStep(history,false);
 await r.generate({history,render,run_id:'test'});assert.equal(c.snapshot().recovery.digest,anchor);r.completeStep(history,true);
 }finally{r?.close();rmSync(dir,{recursive:true,force:true});}
});
