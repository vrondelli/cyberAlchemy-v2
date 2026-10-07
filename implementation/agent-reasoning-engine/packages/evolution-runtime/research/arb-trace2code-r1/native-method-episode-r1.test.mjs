// Real native episode/recycler and synthetic public transport; no provider/gold.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R1.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {runNativeMethodEpisode,createMethodEpisodeTools,loadNativeMethodEpisode} from './native-method-episode-r1.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const source='void f() {}',methodReply={status:'method-source',path:'src/A.java',source,source_sha256:sha(source),
 method_source_sha256:sha(source),method:{source_span:{start_line:1,end_line:1,start_utf8:0,end_utf8:source.length}}};
const view=r=>r.operation==='get_method'?methodReply:{status:'page',items:[],total:0,next_offset:null};
async function scripted({arm='baseline',pressure=false,badFinal=false,tokenBudget=65536,multi=false}={}){
 const root=mkdtempSync(join(tmpdir(),'are-method-native-test-'));mkdirSync(join(root,'fixture'));
 const receipts=[];let calls=0,readIds=[];const task={problem_statement:'Localize the faulty implementation; do not edit.'};
 const transport=createStatelessRecyclingTransport({adapter_id:'native-method-synthetic',source_ref:'native-method-episode-r1.test.mjs',maximum_output_tokens:512,
  measure_request:async({prompt})=>pressure&&JSON.parse(prompt).messages.filter(m=>['assistant','tool'].includes(m.role)).length>2?7800:400,
  request_once:async({prompt})=>{
   calls++;const messages=JSON.parse(prompt).messages;
   assert.ok(messages[0].content.startsWith('Localize the faulty production implementation'));
   for(const msg of messages)if(msg.role==='tool'){const r=JSON.parse(msg.content);if(r.output?.read_id)readIds.push(r.output.read_id);}
   for(const msg of messages)if(msg.content?.startsWith('{"observed_source_index"'))readIds.push(...JSON.parse(msg.content).observed_source_index.map(x=>x.read_id));
   let message,finish_reason;
   if(calls===1||(pressure&&calls===2)){const toolCall=i=>({id:'read-'+calls+'-'+i,type:'function',function:{name:'read_file',arguments:stable({method_id:'m',path:'src/A.java',start_line:1})}});
    message={role:'assistant',tool_calls:Array.from({length:multi?11:1},(_,i)=>toolCall(i))};finish_reason='tool_calls';
   }else{message={role:'assistant',content:stable({summary:'Potential faulty implementation',context_read_ids:badFinal?['invented']:[...new Set(readIds)]})};finish_reason='stop';}
   const receipt={kind:'model',model:'glm-5.3-flash',output_cap:512,reasoning_effort:'low',dispatched:true,status:200,
    input_tokens:400,output_tokens:20,finish_reason};receipt.request_sha256=sha(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);
   return {receipt,final_bytes:stable({message,finish_reason})};
  }});
 const recycler=openContextRecycling({transport,fixture_root:join(root,'fixture'),scope:{request:task.problem_statement},
  options:{directory:join(root,'state'),context_limit:8192,recycle_at:7500,safety_margin:512,
   state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['synthetic-source']}}});
 try{return {...await runNativeMethodEpisode({caseId:'c',arm,task,client:{receipts,maximum_model_retries:0},recycler,
  measure_index_tokens:async()=>100,run_id:'synthetic',view,limits:{total_tokens:tokenBudget}}),retained_test_root:root};}
 finally{recycler.close();} // Test evidence retained, no recursive cleanup.
}
test('native baseline and index both bind complete method reads to final selections',async()=>{
 for(const arm of ['baseline','index']){const r=await scripted({arm});assert.equal(r.functionality_valid,true,r.error);
  assert.equal(r.selection.final_read_ids.length,1);assert.equal(r.method_tool_accounting.attempts,1);
  assert.equal(bindDelivery(r).unmapped.length,0);assert.equal(r.receipts.length,2);}
});
test('native index survives actual recycling with only confirmed evidence',async()=>{
 const r=await scripted({arm:'index',pressure:true});assert.equal(r.functionality_valid,true,r.error??'unexpected invalid episode');
 assert.ok(r.recycling.recycles>0);assert.ok(r.indexes.length>0);
 assert.ok(r.task_state_presentations.length>0);
});
test('invented final handles fail native final-selection validation, no correction replay',async()=>{
 const r=await scripted({badFinal:true});assert.equal(r.functionality_valid,false);assert.equal(r.status,'invalid_final_response');assert.equal(r.receipts.length,2);
});
test('native total-token denial prevents another generation',async()=>{
 const r=await scripted({tokenBudget:1200});assert.equal(r.functionality_valid,false);assert.equal(r.receipts.length,1);
 assert.equal(r.status,'token_budget_stopped');
});
test('tool batch cannot silently exceed action budget',async()=>{
 const r=await scripted({multi:true});assert.equal(r.functionality_valid,false);assert.equal(r.method_tool_accounting.over_budget,true);
 assert.equal(r.method_tool_accounting.ledger.filter(x=>x.ordinal<=10).length,10);
});
test('case injection, arbitrary source windows, and coordinate drift rejected',async()=>{
 const bound=createMethodEpisodeTools({caseId:'c',view});
 await assert.rejects(bound.execute_tool('method_navigation',{operation:'list_files',case_id:'other'}));
 await assert.rejects(bound.execute_tool('read_file',{method_id:'m',path:'src/A.java',start_line:2}));
 await assert.rejects(bound.execute_tool('read_file',{method_id:'m',path:'src/A.java',start_line:1,root:'/'}));
});
test('capacity outcome remains explicit and is not a partial source observation',async()=>{
 const bound=createMethodEpisodeTools({caseId:'c',view:()=>({status:'source-capacity-exceeded',complete_source_returned:false})});
 const r=await bound.execute_tool('read_file',{method_id:'m',path:'src/A.java',start_line:1});
 assert.equal(r.ok,false);assert.equal(r.evidence.complete_source_returned,false);assert.equal(r.output,undefined);
});
test('native source binding distinguishes adaptation from canonical implementation',async()=>{
 const r=await loadNativeMethodEpisode();assert.notEqual(r.binding.native_source_sha256,r.binding.effective_module_sha256);
 assert.equal(r.binding.authority_effect,'none');
});
