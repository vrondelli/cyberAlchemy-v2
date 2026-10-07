// Bridge binding and same-cap behavior; prior scripted captures only, no providers/gold.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R6.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {buildTaskStateProjection as bridge} from './native-navigation-state-r6.mjs';
import {buildTaskStateProjection as original} from '../../../../benchmarks/contextbench-v1/task-state.mjs';
import {collectConfirmedMethodNavigation} from './method-navigation-state-r6.mjs';
import {loadNavigationMethodEpisode,runNavigationMethodEpisode} from './native-method-episode-r6.mjs';
import {loadAcquisitionMethodEpisode} from './native-method-episode-r5.mjs';
import {stable,bodyForReceipt} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r5-20261007',sha=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const saved=JSON.parse(readFileSync(root+'/Defects4J-Cli-5-baseline/RESULT.json')).result;
const input=()=>({task:{problem_statement:'Offline bridge qualification.',native_navigation_case_id:'Defects4J-Cli-5'},
 captures:saved.captures,receipts:saved.receipts,events:saved.events,generation:1,max_evidence:8,max_outcomes:8,
 include_outcomes:true,novelty_gate:false,exclude_read_ids:[],max_bytes:4096,max_tokens:512,measure_tokens:async t=>Math.ceil(Buffer.byteLength(t)/4)});
test('only native task-state dependency changes after verified exact frozen r5 reconstruction',async()=>{
 const a=await loadAcquisitionMethodEpisode(),b=await loadNavigationMethodEpisode();
 assert.equal(b.binding.previous_effective_module_sha256,a.binding.effective_module_sha256);
 assert.equal(b.binding.navigation_seams.length,1);assert.equal(b.binding.native_source_sha256,a.binding.native_source_sha256);
 assert.equal(b.binding.navigation_seams[0].before,new URL('../../../../benchmarks/contextbench-v1/task-state.mjs',import.meta.url).href);
 assert.equal(b.binding.navigation_seams[0].after,new URL('./native-navigation-state-r6.mjs',import.meta.url).href);
});
test('same-cap bridge retains exact observed navigation without creating source IDs or extra state',async()=>{
 const x=input(),p=await bridge(x);assert.equal(p.projection_mode,'confirmed-native-navigation');
 assert.equal(p.material.pages.filter(x=>x.tool==='list_methods').length,1);assert.equal(p.generation,1);
 assert.deepEqual(p.evidence,[]);assert.deepEqual(p.outcomes,[]);assert.ok(p.measured_tokens<=512&&Buffer.byteLength(p.text)<=4096);
 assert.equal(p.material.pages[1].items[0].method_id,collectConfirmedMethodNavigation({caseId:x.task.native_navigation_case_id,...x}).observations[1].fact.items[0].method_id);
});
test('pending catalog and tokenizer-only captures are absent from retained state',async()=>{
 const x=input(),before={...x,receipts:x.receipts.slice(0,2)};const p=await bridge(before);
 assert.equal(p.material.pages.length,1);assert.equal(p.material.pages[0].tool,'runtime_status');
 assert.equal(p.material.pages.some(p=>p.tool==='list_methods'),false);
 const none=await bridge({...x,receipts:x.receipts.map(r=>({...r,kind:'tokenizer'})),events:[]});assert.equal(none,null);
});
test('scope injection and widened state policy reject before usable projection',async()=>{
 const x=input();await assert.rejects(()=>bridge({...x,task:{problem_statement:'x'}}),/case-binding/);
 await assert.rejects(()=>bridge({...x,task:{...x.task,native_navigation_case_id:'foreign'}}),/output-scope/);
 for(const changes of [{max_bytes:4097},{max_tokens:513},{novelty_gate:true},{max_paths:1}])await assert.rejects(()=>bridge({...x,...changes}),/original-state-limits/);
 await assert.rejects(()=>runNavigationMethodEpisode({caseId:'foreign',arm:'index',task:{problem_statement:'x',native_navigation_case_id:'injected'}}),/input/);
});
test('uncertain spend still stops before generation-zero no-op',async()=>{
 const x=input();await assert.rejects(()=>bridge({...x,generation:0,receipts:[{kind:'tokenizer',dispatch_uncertain:true}]}),/uncertain-history/);
 assert.equal(await bridge({...x,generation:0}),null);
});
test('without navigation metadata, original receipt-bound read-state fallback is exact and same-cap',async()=>{
 const messages=JSON.parse(saved.captures.at(-1).prompt).messages;
 const sourceCall=messages.flatMap(m=>m.role==='assistant'?m.tool_calls??[]:[]).find(c=>c.function.name==='read_file');
 const sourceOutput=messages.find(m=>m.role==='tool'&&m.tool_call_id===sourceCall.id);
 const prompt=stable({messages:[{role:'assistant',tool_calls:[sourceCall]},sourceOutput],tools:[]});
 const r={kind:'model',model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,dispatched:true,status:200,input_tokens:400,output_tokens:20};
 r.request_sha256=sha(stable(bodyForReceipt(prompt,r)));const x={...input(),captures:[{prompt,prompt_sha256:sha(prompt)}],receipts:[r],events:[]};
 const p=await bridge(x);assert.deepEqual(p,await original(x));assert.equal(p.evidence.length,1);assert.equal(p.projection_mode,'evidence-and-outcomes');
});
