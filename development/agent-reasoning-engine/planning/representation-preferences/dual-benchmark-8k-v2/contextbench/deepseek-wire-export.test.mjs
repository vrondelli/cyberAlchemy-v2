// Offline replay only. Open questions: DEEPSEEK-WIRE-EXPORT.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {exportDeepSeekWire,parseDeepSeekStream} from './deepseek-wire-export.mjs';
const root=new URL('./deepseek-headless-evidence/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const hash=s=>createHash('sha256').update(s).digest('hex');
const stream=e=>'data: '+JSON.stringify(e)+'\n\ndata: [DONE]\n\n';
const pin=e=>({...e,request_sha256:hash(e.request_bytes),response_sha256:hash(e.response_bytes)});
function fixture(t){
 const repoRoot=mkdtempSync(join(tmpdir(),'dsh-export-'));t.after(()=>rmSync(repoRoot,{recursive:true,force:true}));
 writeFileSync(join(repoRoot,'value.js'),'export const value = 1;\n');
 const records=readdirSync(new URL('evidence-r3/',root)).sort().map(f=>JSON.parse(read('evidence-r3/'+f)));
 const exchanges=Array.from({length:4},(_,i)=>pin({status:200,request_bytes:read('wire-r3/request-'+i+'.json'),response_bytes:stream(JSON.parse(read('wire-r3/response-'+i+'.json')))}));
 return {repoRoot,records,exchanges,task:{instance_id:'scripted-dsh-fixture',repo_url:'https://example.invalid/fixture',base_commit:records.find(r=>r.kind==='tool-result').output.output.base_commit}};
}
test('actual DSH captured messages export selected base span; synthetic usage is counted per exchange',t=>{
 const result=exportDeepSeekWire(fixture(t));
 assert.deepEqual(result.prediction.traj_data.pred_files,['value.js']);
 assert.deepEqual(result.prediction.traj_data.pred_spans,{'value.js':[{start:1,end:1}]});
 assert.equal(result.read_observations.length,2);
 assert.deepEqual(result.token_accounting,{known_input_tokens:400,known_output_tokens:80,known_total_tokens:480,model_calls:4});
 assert.equal(result.benchmark_cleared,false);
});
test('fragmented tool arguments and usage-only final chunk parse',()=>{
 const event=JSON.parse(read('wire-r3/response-0.json'));
 const call=event.choices[0].delta.tool_calls[0],args=call.function.arguments;
 const a=structuredClone(event);delete a.usage;a.choices[0].finish_reason=null;
 a.choices[0].delta.tool_calls[0].function.arguments=args.slice(0,12);
 const b={model:event.model,choices:[{index:0,delta:{tool_calls:[{index:0,function:{arguments:args.slice(12)}}]},finish_reason:'tool_calls'}]};
 const c={model:event.model,choices:[],usage:event.usage};
 const raw=[a,b,c].map(x=>'data: '+JSON.stringify(x)+'\n\n').join('')+'data: [DONE]\n\n';
 assert.deepEqual(parseDeepSeekStream(raw).tool_calls[0].function,call.function);
});
test('truncated, failed, conflicting and post-finish streams cannot score',()=>{
 const event=JSON.parse(read('wire-r3/response-0.json'));
 assert.throws(()=>parseDeepSeekStream(stream(event).replace('data: [DONE]\n\n','')),/incomplete-stream/);
 const failed=structuredClone(event);failed.choices[0].finish_reason='length';
 assert.throws(()=>parseDeepSeekStream(stream(failed)),/unsuccessful-finish/);
 const missing=structuredClone(event);delete missing.usage;
 assert.throws(()=>parseDeepSeekStream(stream(missing)),/usage-required/);
 const wrong=structuredClone(event);wrong.usage.total_tokens++;
 assert.throws(()=>parseDeepSeekStream(stream(wrong)),/usage-total/);
 assert.throws(()=>parseDeepSeekStream(stream(event)+'data: {}\n\n'),/data-after-done/);
 assert.throws(()=>parseDeepSeekStream('data: '+JSON.stringify(event)+'\n\n'+stream(event)),/choice-after-finish/);
});
test('wire mutation without new pin is rejected',t=>{
 const f=fixture(t);f.exchanges[1].request_bytes+=' ';
 assert.throws(()=>exportDeepSeekWire(f),/wire-digest/);
});
test('re-pinned fabricated assistant call cannot become delivered evidence',t=>{
 const f=fixture(t),e=f.exchanges[1],b=JSON.parse(e.request_bytes);
 b.messages.find(m=>m.role==='assistant'&&m.tool_calls).tool_calls[0].function.arguments='{}';
 f.exchanges[1]=pin({...e,request_bytes:JSON.stringify(b)});
 assert.throws(()=>exportDeepSeekWire(f),/assistant-call-not-issued/);
});
test('tool output must match durable execution record',t=>{
 const f=fixture(t),e=f.exchanges[1],b=JSON.parse(e.request_bytes);
 b.messages.find(m=>m.role==='tool').content='{}';f.exchanges[1]=pin({...e,request_bytes:JSON.stringify(b)});
 assert.throws(()=>exportDeepSeekWire(f),/tool-output-mismatch/);
});
test('execution alone is not evidence of model delivery',t=>{
 const f=fixture(t),e=f.exchanges[3],b=JSON.parse(e.request_bytes);
 b.messages=b.messages.filter(m=>m.role!=='tool'||m.tool_call_id!=='fixture-call-2');
 f.exchanges[3]=pin({...e,request_bytes:JSON.stringify(b)});
 assert.throws(()=>exportDeepSeekWire(f),/selected-source-not-delivered-or-invalid/);
});
test('terminal selection must match actual final response',t=>{
 const f=fixture(t);f.records.at(-1).selection.summary='fabricated';
 assert.throws(()=>exportDeepSeekWire(f),/terminal-selection-mismatch/);
});
test('execution intent and terminal record ordering are required',t=>{
 const f=fixture(t);f.records=f.records.filter(r=>r.kind!=='tool-intent');
 assert.throws(()=>exportDeepSeekWire(f),/result-without-intent/);
 const g=fixture(t);g.records.push(g.records[0]);
 assert.throws(()=>exportDeepSeekWire(g),/record-after-terminal/);
});
test('base source drift and missing model usage cannot export',t=>{
 const f=fixture(t);writeFileSync(join(f.repoRoot,'value.js'),'changed\n');
 assert.throws(()=>exportDeepSeekWire(f));
 const g=fixture(t),e=g.exchanges[1],v=JSON.parse(read('wire-r3/response-1.json'));
 delete v.usage;g.exchanges[1]=pin({...e,response_bytes:stream(v)});
 assert.throws(()=>exportDeepSeekWire(g),/usage-required/);
});
test('tool-less compaction calls are charged without inventing source evidence',t=>{
 const f=fixture(t),summary={model:'glm-5.3-flash',choices:[{index:0,delta:{role:'assistant',content:'fixture summary'},finish_reason:'stop'}],usage:{prompt_tokens:50,completion_tokens:10,total_tokens:60}};
 f.exchanges.splice(1,0,pin({status:200,request_bytes:JSON.stringify({model:'glm-5.3-flash',stream:true,max_tokens:2048,messages:[{role:'user',content:'Summarize history'}]}),response_bytes:stream(summary)}));
 const r=exportDeepSeekWire(f);assert.equal(r.token_accounting.model_calls,5);assert.equal(r.token_accounting.known_total_tokens,540);assert.equal(r.read_observations.length,2);assert.deepEqual(r.requests[1].read_ids,[]);
});
