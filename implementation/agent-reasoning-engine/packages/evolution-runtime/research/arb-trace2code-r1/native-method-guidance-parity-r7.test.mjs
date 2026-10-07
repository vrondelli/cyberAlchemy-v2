// Direct r6/r7 request comparison; no providers or labels.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R7.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {runNavigationMethodEpisode as runR6,loadNavigationMethodEpisode} from './native-method-episode-r6.mjs';
import {runEvidenceGuidedMethodEpisode as runR7,loadEvidenceGuidedMethodEpisode} from './native-method-episode-r7.mjs';
import {ACQUISITION_GUIDANCE_R7 as policy,ACQUISITION_GUIDANCE_SHA256_R7 as policyHash} from './evidence-acquisition-guidance-r7.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex'),source='void f() {}';
async function episode(run,arm){
 const root=mkdtempSync(join(tmpdir(),'are-r7-parity-'));mkdirSync(join(root,'fixture'));
 const receipts=[],measured=[],dispatched=[];let calls=0;
 const transport=createStatelessRecyclingTransport({adapter_id:'r7-parity',source_ref:import.meta.url,maximum_output_tokens:512,
  measure_request:async({prompt})=>{measured.push(prompt);return 400+Buffer.byteLength(JSON.parse(prompt).messages[0].content);},
  request_once:async({prompt})=>{
   assert.ok(measured.includes(prompt),'exact guidance-bearing request measured before dispatch');dispatched.push(prompt);calls++;
   const p=JSON.parse(prompt),handles=[];for(const m of p.messages)if(m.role==='user')try{for(const h of JSON.parse(m.content).method_terminal_handles?.evidence??[])handles.push(h.handle);}catch{}
   const name=calls===1?'read_file':'submit_source_handles',args=calls===1?{path:'src/A.java',method_id:'m',start_line:1}:{context_handles:handles};
   const message={role:'assistant',tool_calls:[{id:'parity-'+calls,type:'function',function:{name,arguments:stable(args)}}]},finish_reason='tool_calls';
   const receipt={kind:'model',model:'glm-5.3-flash',output_cap:512,reasoning_effort:'low',dispatched:true,status:200,input_tokens:400+Buffer.byteLength(p.messages[0].content),output_tokens:20,finish_reason};
   receipt.request_sha256=sha(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);return{receipt,final_bytes:stable({message,finish_reason})};
  }});
 const task={problem_statement:'Exact task unchanged: observed behavior differs from expected behavior.'};
 const recycler=openContextRecycling({transport,fixture_root:join(root,'fixture'),scope:{request:task.problem_statement},options:{directory:join(root,'state'),context_limit:8192,recycle_at:7500,safety_margin:512,state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['synthetic-parity-fixture']}}});
 const view=()=>({status:'method-source',path:'src/A.java',source,source_sha256:sha(source),method_source_sha256:sha(source),method:{source_span:{start_line:1,end_line:1,start_utf8:0,end_utf8:Buffer.byteLength(source)}}});
 try{const result=await run({caseId:'c',arm,task,client:{receipts,maximum_model_retries:0},recycler,measure_index_tokens:async()=>100,view,run_id:'parity'});assert.equal(result.functionality_valid,true,result.error);return{result,dispatched};}finally{recycler.close();}
}
test('r7 verifies exact predecessor and adds only declared pre-measurement system guidance',async()=>{
 const r6=await loadNavigationMethodEpisode(),r7=await loadEvidenceGuidedMethodEpisode();
 assert.equal(r7.binding.previous_effective_module_sha256,r6.binding.effective_module_sha256);assert.equal(r7.binding.guidance_sha256,policyHash);
 for(const arm of ['baseline','index']){
  const before=await episode(runR6,arm),after=await episode(runR7,arm);assert.equal(after.dispatched.length,2);
  for(let i=0;i<2;i++){
   const a=JSON.parse(before.dispatched[i]),b=JSON.parse(after.dispatched[i]);
   if(arm==='index'){assert.equal(b.messages[0].content,a.messages[0].content+'\n'+policy);b.messages[0].content=a.messages[0].content;}
   assert.deepEqual(b,a,'all tools, task, handles and delivered source unchanged');
  }
  const delta=bindDelivery(after.result).token_accounting.known_total_tokens-bindDelivery(before.result).token_accounting.known_total_tokens;
  assert.equal(delta,arm==='index'?2*Buffer.byteLength('\n'+policy):0,'synthetic guidance cost counted in original generation accounting');
 }
});
