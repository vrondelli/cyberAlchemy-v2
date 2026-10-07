// Native loop with synthetic public responses only; no providers/labels.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R2.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {runExplicitMethodEpisode} from './native-method-episode-r2.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex'),source='void f() {}';
const view=r=>r.operation==='get_method'?{status:'method-source',path:'src/A.java',source,source_sha256:sha(source),
 method_source_sha256:sha(source),method:{source_span:{start_line:1,end_line:1,start_utf8:0,end_utf8:source.length}}}:
 {status:'page',items:[],total:0,next_offset:null};
async function scripted({arm='baseline',pressure=false,untilFinalization=false,fenced=false,invented=false,multi=false,totalTokens=65536}={}){
 const root=mkdtempSync(join(tmpdir(),'are-method-r2-test-'));mkdirSync(join(root,'fixture'));
 const receipts=[];let calls=0,ids=[];const toolSets=[],observedEvents=[];
 const transport=createStatelessRecyclingTransport({adapter_id:'native-r2-synthetic',source_ref:'native-method-episode-r2.test.mjs',maximum_output_tokens:512,
  measure_request:async({prompt})=>pressure&&JSON.parse(prompt).messages.filter(m=>['assistant','tool'].includes(m.role)).length>2?7800:400,
  request_once:async({prompt})=>{
   calls++;const p=JSON.parse(prompt);toolSets.push(p.tools.map(t=>t.function.name));
   assert.ok(p.messages.some(m=>m.content?.includes('COMMON OUTPUT CONTRACT:')));
   for(const m of p.messages)if(m.role==='tool'){const x=JSON.parse(m.content);if(x.output?.read_id)ids.push(x.output.read_id);}
   for(const m of p.messages)if(m.content?.startsWith('{"observed_source_index"'))ids.push(...JSON.parse(m.content).observed_source_index.map(x=>x.read_id));
   let message,finish_reason;
   const acquiring=calls===1||pressure&&calls===2||untilFinalization&&p.tools.length>0;
   if(acquiring){const call=i=>({id:'r2-read-'+calls+'-'+i,type:'function',function:{name:'read_file',arguments:stable({method_id:'m',path:'src/A.java',start_line:1})}});
    message={role:'assistant',tool_calls:Array.from({length:multi?11:1},(_,i)=>call(i))};finish_reason='tool_calls';}
   else{let content=stable({summary:'Source localization check',context_read_ids:invented?['invented']:[...new Set(ids)]});
    if(fenced)content='Answer:\n```json\n'+content+'\n```';message={role:'assistant',content};finish_reason='stop';}
   const receipt={kind:'model',model:'glm-5.3-flash',output_cap:512,reasoning_effort:'low',dispatched:true,status:200,input_tokens:400,output_tokens:20,finish_reason};
   receipt.request_sha256=sha(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
   return{receipt,final_bytes:stable({message,finish_reason})};
  }});
 const task={problem_statement:'Read delivered source and localize without editing.'};
 const recycler=openContextRecycling({transport,fixture_root:join(root,'fixture'),scope:{request:task.problem_statement},
  options:{directory:join(root,'state'),context_limit:8192,recycle_at:7500,safety_margin:512,
   state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['synthetic']}}});
 try{return {...await runExplicitMethodEpisode({caseId:'c',arm,task,client:{receipts,maximum_model_retries:0},recycler,
  measure_index_tokens:async()=>100,run_id:'r2-synthetic',view,on_event:async e=>{observedEvents.push(e);},limits:{total_tokens:totalTokens,
   ...(totalTokens<16384?{finalization_reserve_tokens:0}:{})}}),toolSets,calls,observedEvents};}finally{recycler.close();}
}
test('both arms use explicit native tools/common final contract and valid strict selection',async()=>{
 for(const arm of ['baseline','index']){const r=await scripted({arm});assert.equal(r.functionality_valid,true,r.error);
  assert.equal(r.calls,2);assert.ok(r.toolSets[0].includes('runtime_status'));assert.ok(!r.toolSets[0].includes('method_navigation'));
  assert.equal(bindDelivery(r).read_observations[0].body,source);assert.equal(r.method_tool_accounting.all_tool_attempts,1);}
});
test('both arms reserve finalization inside unchanged eleven calls and total tokens',async()=>{
 for(const arm of ['baseline','index']){const r=await scripted({arm,untilFinalization:true});assert.equal(r.functionality_valid,true,r.error);
  assert.equal(r.calls,10);assert.deepEqual(r.toolSets.at(-1),[]);assert.equal(r.method_tool_accounting.all_tool_attempts,9);
  assert.ok(r.observedEvents.some(e=>e.kind==='finalization-start'&&e.reason==='reserved-call-capacity'));
  assert.ok(bindDelivery(r).token_accounting.known_total_tokens<=65536);}
});
test('native index/recycler retains confirmed evidence under pressure',async()=>{
 const r=await scripted({arm:'index',pressure:true});assert.equal(r.functionality_valid,true,r.error);
 assert.ok(r.recycling.recycles>0);assert.ok(r.indexes.length>0);assert.ok(r.task_state_presentations.length>0);
});
test('fenced prose and invented read IDs remain rejected, no automatic correction',async()=>{
 for(const options of [{fenced:true},{invented:true}]){const r=await scripted(options);assert.equal(r.functionality_valid,false);
  assert.equal(r.status,'invalid_final_response');assert.equal(r.calls,2);assert.equal(r.terminal_corrections,0);}
});
test('native tool and token caps fail closed, without extra dispatch',async()=>{
 const batch=await scripted({multi:true});assert.equal(batch.functionality_valid,false);assert.equal(batch.method_tool_accounting.over_budget,true);
 assert.equal(batch.method_tool_accounting.ledger.length,10);
 const token=await scripted({totalTokens:1200});assert.equal(token.functionality_valid,false);assert.equal(token.calls,1);assert.equal(token.status,'token_budget_stopped');
});
