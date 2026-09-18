import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { compactRequest } from './representation.mjs';
import { accountReceipts } from './run.mjs';
import { attachObservationHandles, bindDelivery, bodyForReceipt, stable } from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
test('compact observations retain exact delivered source identity and native receipt reconstruction',()=>{
  const call={id:'call1',type:'function',function:{name:'read_file',arguments:JSON.stringify({path:'a.c',start_line:1,line_count:2,revision:'base'})}};
  const body={path:'a.c',start_line:1,end_line:2,utf8:'int x;\nint y;',source_sha256:'a'.repeat(64),source_revision:'base',base_commit:'b'.repeat(40),byte_count:13,total_lines:2};
  const decorated=attachObservationHandles(call,{ok:true,output:body});
  const request={messages:[{role:'system',content:'Full instructions'},{role:'assistant',tool_calls:[call],content:''},{role:'tool',tool_call_id:call.id,content:stable(decorated)}],tools:[]};
  const original=structuredClone(request),compacted=compactRequest(request);assert.deepEqual(request,original);
  const output=JSON.parse(compacted.messages[2].content).output;
  for(const key of ['utf8','path','start_line','end_line','source_sha256','read_id','source_revision'])assert.equal(output[key],decorated.output[key]);
  for(const key of ['retrieval_handle','base_commit','byte_count'])assert.equal(output[key],undefined);
  const prompt=stable(compacted),receipt={kind:'model',dispatched:true,status:200,model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low',input_tokens:10,output_tokens:2};
  receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));
  const bound=bindDelivery({captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt]});
  assert.equal(bound.unmapped.length,0);assert.equal(bound.read_observations[0].id,decorated.output.read_id);assert.equal(bound.read_observations[0].body,body.utf8);
});
test('schema constraints, function names, tool pairing and reasoning remain unchanged',()=>{
  const tools=[{type:'function',function:{name:'read_file',description:'Verbose',parameters:{required:['path'],additionalProperties:false,properties:{path:{type:'string',maxLength:4096}}}}}];
  const request={messages:[{role:'system',content:'system'},{role:'assistant',tool_calls:[{id:'a'}],reasoning_content:'retained'},{role:'tool',tool_call_id:'a',content:'plain output'}],tools};
  const compact=compactRequest(request);assert.deepEqual(compact.messages.slice(1),request.messages.slice(1));assert.deepEqual(compact.tools[0].function.parameters,tools[0].function.parameters);
});
test('unknown model usage debits full8000 reservation; failed calls with known usage are counted',()=>{
  const usage=accountReceipts([{kind:'tokenizer',dispatched:true,input_tokens:100},{kind:'model',dispatched:true,input_tokens:500,output_tokens:200,failure_code:'incomplete-output'},{kind:'model',dispatched:true,status:429}]);
  assert.equal(usage.total_tokens,700);assert.equal(usage.unknown_usage_calls,1);assert.equal(usage.conservative_total_tokens,8700);assert.equal(usage.rate_limited,true);
});
