// Open questions: DEEPSEEK-FULL-WINDOW-DAG.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createDurableTransport,loadSealedExchanges} from './deepseek-durable-transport.mjs';
import {FULL_WINDOW,buildFullWindowCell} from './deepseek-full-window-profile.mjs';
import {parseDeepSeekStream} from './deepseek-wire-export.mjs';
import {createGlmClient} from './packet-diversity-v1/transport-bounded-v3.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
const request=JSON.stringify({model:'glm-5.3-flash',stream:true,messages:[],max_tokens:2048});
function fixture(t){const root=mkdtempSync(join(tmpdir(),'full-window-'));t.after(()=>rmSync(root,{recursive:true,force:true}));return root;}
test('1M boundary is admitted, one token beyond is unpaid, and continuation costs reconcile',async t=>{
 const root=fixture(t);let measured=1000000-512-2048,calls=0;
 const transport=createDurableTransport({root,window:FULL_WINDOW.context_limit,token_budget:FULL_WINDOW.total_tokens,maximum_request_bytes:FULL_WINDOW.maximum_request_bytes,maximum_stage_bytes:FULL_WINDOW.maximum_stage_bytes,
 post:async p=>p==='tokenizer'?{status:200,bytes:JSON.stringify({usage:{prompt_tokens:measured}})}:(calls++,{status:200,bytes:'data: '+JSON.stringify({model:'glm-5.3-flash',choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:measured,completion_tokens:1,total_tokens:measured+1}})+'\n\ndata: [DONE]\n\n'})});
 await transport.process(request);measured++;await assert.rejects(transport.process(request),/context-window/);assert.equal(calls,1);measured=12000;await transport.process(request);const seal=await transport.close();assert.equal(seal.cost_complete,true);assert.equal(seal.known_total_tokens,1009442);assert.equal(loadSealedExchanges(root).exchanges.length,2);
});
test('full-window ARE opts in without mutating frozen 8K templates',()=>{
 const config=JSON.parse(readFileSync(new URL('./discovery-v1/live-config.json',import.meta.url)));config.full_window_profile=FULL_WINDOW.id;
 const original=JSON.stringify(config);const cell=buildFullWindowCell({config,task_id:config.tasks[0].id});assert.equal(JSON.stringify(config),original);assert.equal(cell.context_limit,1000000);assert.equal(cell.recycle_at,990000);assert.equal(cell.limits.total_tokens,4000000);assert.equal(cell.provider_profile.request_budget,FULL_WINDOW.request_budget);
});
test('ARE permits full-window byte profile only under explicit experiment policy',t=>{
 const root=fixture(t),guard=createStageOutputGuard({root,maximum_bytes:FULL_WINDOW.maximum_stage_bytes}),persistence=createStagePersistence({stage_guard:guard,stage_root:root});
 const options={persistence,before_dispatch:async()=>true,chat_endpoint:'http://127.0.0.1/chat/completions',tokenizer_endpoint:'http://127.0.0.1/tokenizer',maximum_requests:96,maximum_request_bytes:FULL_WINDOW.maximum_request_bytes,request_budget:FULL_WINDOW.request_budget};
 const client=createGlmClient(options);assert.equal(client.maximum_requests,96);assert.equal(client.maximum_tokenizer_requests,291);assert.throws(()=>createGlmClient({...options,request_budget:'contextbench-deferral-v1'}),/limits-exceed/);
});
test('partial tool arguments remain unsuccessful and never become executable evidence',()=>{
 const bytes='data: '+JSON.stringify({model:'glm-5.3-flash',choices:[{index:0,delta:{tool_calls:[{index:0,id:'x',function:{name:'apply_edits',arguments:'{"path":'}}]},finish_reason:'length'}],usage:{prompt_tokens:10,completion_tokens:2,total_tokens:12}})+'\n\ndata: [DONE]\n\n';
 assert.throws(()=>parseDeepSeekStream(bytes),/unsuccessful-finish/);const parsed=parseDeepSeekStream(bytes,{allowUnsuccessful:true});assert.deepEqual(parsed.tool_calls,[]);assert.equal(parsed.usage.total_tokens,12);
});
