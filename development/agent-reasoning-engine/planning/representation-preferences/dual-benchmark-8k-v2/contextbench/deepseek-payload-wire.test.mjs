// Actual tool execution -> compact native rendering -> strict source export.
// Open questions: DEEPSEEK-CONTROL-FIT-DAG.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,cpSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {createMatchedRepositoryTools} from './deepseek-matched-tools.mjs';
import {exportDeepSeekWire} from './deepseek-wire-export.mjs';
import {decodeToolPayload,PAYLOAD_ENCODING,PAYLOAD_GUIDE} from './tool-payload-codec.mjs';
import {FINAL_SCHEMA} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-schema.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const pin=e=>({...e,request_sha256:hash(e.request_bytes),response_sha256:hash(e.response_bytes)});
async function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'dsh-codec-wire-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const git=(...a)=>execFileSync('git',['-c','core.hooksPath=/dev/null',...a],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init');writeFileSync(join(root,'value.js'),Array.from({length:6},(_,i)=>`export const value${i} = ${i};`).join('\n')+'\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture');const commit=git('rev-parse','HEAD');
 const records=[],adapter=createMatchedRepositoryTools({root,base_commit:commit,persist:e=>records.push(e),payload_encoding:PAYLOAD_ENCODING});
 const search=adapter.definitions.find(d=>d.name==='search'),args={query:'value',path_prefix:'value.js',offset:0,limit:20,revision:'base'};
 const output=await search.execute(args,{callId:'search1',signal:new AbortController().signal});assert.equal(output.ok,true);
 const encoded=JSON.parse(search.output.render(args,output)[0].text);assert.equal(encoded.output.observation_encoding,PAYLOAD_ENCODING);assert.deepEqual(decodeToolPayload({tool:'search',payload:encoded}),output);
 const selection={summary:'Selected matching source lines',context_read_ids:output.output.observations.map(o=>o.read_id)};
 const tools=adapter.definitions.map(d=>({type:'function',function:{name:d.name,description:d.description,parameters:d.parameters}}));tools.push({type:'function',function:{name:'submit_context_selection',parameters:FINAL_SCHEMA}});
 const call={id:'search1',type:'function',function:{name:'search',arguments:JSON.stringify(args)}},final={id:'final1',type:'function',function:{name:'submit_context_selection',arguments:JSON.stringify(selection)}};
 const req={model:'glm-5.3-flash',stream:true,max_tokens:2048,tools,messages:[{role:'system',content:PAYLOAD_GUIDE},{role:'user',content:'Find source value'}]};
 const response=c=>'data: '+JSON.stringify({model:req.model,choices:[{index:0,delta:{role:'assistant',tool_calls:[{index:0,...c}]},finish_reason:'tool_calls'}],usage:{prompt_tokens:100,completion_tokens:20,total_tokens:120}})+'\n\ndata: [DONE]\n\n';
 const next={...req,messages:[...req.messages,{role:'assistant',tool_calls:[call],content:null},{role:'tool',tool_call_id:call.id,content:JSON.stringify(encoded)}]};
 records.push({kind:'terminal-candidate',call_id:'final1',selection});
 return {records,repoRoot:root,task:{instance_id:'payload-fixture',repo_url:'https://example.invalid/fixture',base_commit:commit},exchanges:[pin({status:200,request_bytes:JSON.stringify(req),response_bytes:response(call)}),pin({status:200,request_bytes:JSON.stringify(next),response_bytes:response(final)})]};
}
test('lossless native rendering preserves delivered source IDs and native spans',async t=>{
 const f=await fixture(t),result=exportDeepSeekWire(f);assert.equal(result.read_observations.length,6);assert.deepEqual(result.prediction.traj_data.pred_files,['value.js']);assert.equal(result.token_accounting.known_total_tokens,240);
});
test('re-pinned encoded source alteration cannot become source evidence',async t=>{
 const f=await fixture(t),b=JSON.parse(f.exchanges[1].request_bytes),payload=JSON.parse(b.messages.at(-1).content);payload.output.sources[0].path='fabricated.js';b.messages.at(-1).content=JSON.stringify(payload);f.exchanges[1]=pin({...f.exchanges[1],request_bytes:JSON.stringify(b)});assert.throws(()=>exportDeepSeekWire(f),/tool-output-mismatch/);
});
