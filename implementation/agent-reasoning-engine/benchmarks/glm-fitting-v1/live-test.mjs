import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createStatelessRecyclingTransport} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {createLiveQaAdapter,validateLiveManifest} from './live-adapter.mjs';
import {runDataset,sha256} from './benchmark.mjs';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../../..');
const dataset=JSON.parse(await readFile(resolve(here,'dataset.json'),'utf8'));
const config={split:'train',repeats:1,max_attempts:1,max_input_bytes:65536,context_limit_tokens:16384,recycle_at_tokens:5000,output_reserve_tokens:2048,token_margin:256,policy:'clear-v1',model:'glm-5.3-flash',adapter_kind:'bounded-runtime'};
const manifest=dir=>({schema_version:'are.glm-fitting-live/v1',dataset_sha256:sha256(JSON.stringify(dataset)),credential:{provider_kind:'local-sops-age',provider_id:'local-model-secrets',locator:'model/zai-key'},state_directory:dir,task_ids:[dataset.tasks[0].id],config,limits:{max_attempt_ms:1000,max_total_ms:5000,max_model_calls:1}});
function injected({upper=1000,fail=false,inspect=()=>{},tools=false,hang=false}={}) {
 let calls=0,measures=0;
 return {get calls(){return calls;},get measures(){return measures;},create_client(options){
   assert.equal(options.maximum_requests,1);assert.equal(options.maximum_output_tokens,2048);assert.equal(options.token_margin,256);assert.equal(typeof options.secret_registry.consume,'function');
   const receipts=[];
   return {receipts,transport:createStatelessRecyclingTransport({adapter_id:'scripted-qa',source_ref:'scripted-test-only',maximum_output_tokens:2048,
    async measure_request({prompt}){measures++;inspect(JSON.parse(prompt));receipts.push({kind:'tokenizer',dispatched:true,input_tokens:upper-256,request_sha256:'a'.repeat(64)});return upper;},
    async request_once({prompt}){calls++;inspect(JSON.parse(prompt));const receipt={kind:'model',dispatched:true,input_tokens:700,output_tokens:20,request_sha256:'b'.repeat(64),finish_reason:fail?'length':'stop'};receipts.push(receipt);
      if(hang)await new Promise((res,rej)=>options.signal.addEventListener('abort',()=>rej(new Error('abort')), {once:true}));
      if(fail){const e=new Error('SECRET-ERROR-TEXT');e.code='incomplete-output';throw e;}
      return {final_bytes:JSON.stringify({finish_reason:tools?'tool_calls':'stop',message:{role:'assistant',content:'{"value":"CA2-ROUTE-ENTRY"}',reasoning_content:'PRIVATE-REASONING-DO-NOT-RECORD',...(tools?{tool_calls:[{}]}:{})}})};
    }})};
 }};
}
async function run(mock,alter=m=>m){const dir=await mkdtemp(resolve(tmpdir(),'glm-live-test-'));try{const m=alter(manifest(dir));const adapter=createLiveQaAdapter({manifest:m,fixture_root:root},{create_client:mock.create_client});return await runDataset({root,dataset,config:m.config,task_ids:m.task_ids,adapter});}finally{await rm(dir,{recursive:true,force:true});}}
test('single-turn full request measured; no gold or reasoning persisted',async()=>{const mock=injected({inspect:wire=>{assert.equal(wire.messages.length,2);assert.deepEqual(wire.tools,[]);assert(!JSON.stringify(wire).includes('gold'));assert(!JSON.stringify(wire).includes('json_pointer'));}});const r=await run(mock);assert.equal(mock.calls,1);assert.equal(mock.measures,1);assert.equal(r.summary.passed,1);assert(!JSON.stringify(r).includes('PRIVATE-REASONING'));assert.equal(r.attempts[0].response.admission.dispatches[0].projected_upper_bound,3048);assert.equal(r.attempts[0].response.usage.recycles,0);});
test('at-threshold full request blocks before model; tokenizer cost visible',async()=>{const mock=injected({upper:2952});const r=await run(mock);assert.equal(mock.calls,0);assert.equal(mock.measures,1);assert.equal(r.summary.failed,1);assert.equal(r.attempts[0].error_code,'fresh-context-too-large');assert.equal(r.attempts[0].response.usage.tokenizer_calls,1);});
test('incomplete-output preserves spent usage without retry or error disclosure',async()=>{const mock=injected({fail:true});const r=await run(mock);assert.equal(mock.calls,1);assert.equal(r.summary.failed,1);assert.equal(r.attempts[0].error_code,'incomplete-output');assert.equal(r.attempts[0].response.usage.input_tokens,700);assert.equal(r.attempts[0].response.usage.output_tokens,20);assert(!JSON.stringify(r).includes('SECRET'));});
test('unexpected tool calls fail without executing them',async()=>{const r=await run(injected({tools:true}));assert.equal(r.attempts[0].error_code,'qa-final-text-required');assert.deepEqual(r.attempts[0].response.tool_events,[]);});
test('attempt deadline aborts injected transport and records partial usage',async()=>{const r=await run(injected({hang:true}),m=>({...m,limits:{...m.limits,max_attempt_ms:30}}));assert.equal(r.summary.failed,1);assert.equal(r.attempts[0].response.usage.model_calls,1);});
test('live manifest rejects heldout, arbitrary credential, excessive call/time/token caps',()=>{const m=manifest('/tmp/not-used');assert.throws(()=>validateLiveManifest({...m,config:{...config,split:'heldout'}}),/training/);assert.throws(()=>validateLiveManifest({...m,credential:{api_key:'SECRET'}}),/credential/);assert.throws(()=>validateLiveManifest({...m,limits:{...m.limits,max_model_calls:13}}),/bounds/);assert.throws(()=>validateLiveManifest({...m,config:{...config,output_reserve_tokens:4096}}),/bounds/);assert.throws(()=>validateLiveManifest({...m,task_ids:[...m.task_ids,dataset.tasks[1].id]}),/call-cap/);});
test('explicit task selection rejects duplicates and cross-split IDs before dispatch',async()=>{for(const ids of [[dataset.tasks[0].id,dataset.tasks[0].id],[dataset.tasks.at(-1).id]])await assert.rejects(runDataset({root,dataset,config,task_ids:ids,adapter:()=>assert.fail('not dispatched')}),/selection/);});
test('unknown transport outcome halts remaining calls and leaves unknown tokens null',async()=>{let factories=0;const mock={create_client(options){factories++;const receipts=[];return {receipts,transport:createStatelessRecyclingTransport({adapter_id:'uncertain-test',source_ref:'test',maximum_output_tokens:2048,async measure_request(){receipts.push({kind:'tokenizer',dispatched:true,input_tokens:100});return 356;},async request_once(){receipts.push({kind:'model',dispatched:true,status:null});const e=new Error('secret detail');e.code='response-interrupted';throw e;}})};}};const r=await run(mock,m=>({...m,task_ids:[dataset.tasks[0].id,dataset.tasks[1].id],config:{...m.config,max_attempts:2},limits:{...m.limits,max_model_calls:2}}));assert.equal(factories,1);assert.equal(r.summary.failed,2);assert.equal(r.attempts[0].response.usage.input_tokens,null);assert.equal(r.attempts[1].error_code,'run-halted-after-transport-failure');assert.equal(r.attempts[1].response.usage.model_calls,0);});
