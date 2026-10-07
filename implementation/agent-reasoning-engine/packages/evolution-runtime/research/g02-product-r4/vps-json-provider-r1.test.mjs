// Open Questions: evidence/G02-WSL-VPS-PROVIDER-BINDING-R1.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRequest,executeRequest,hash,stable} from './vps-json-provider-r1.mjs';
const request={operation:'generate',request_id:'fixture-1',messages:[{role:'user',content:'Return JSON.'}],tools:[],output_cap:512};
test('file pins hash raw bytes, not Buffer JSON serialization',()=>{
  assert.equal(hash(Buffer.from('abc')),hash('abc'));
  assert.equal(hash(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('closed request rejects endpoint, credentials and hidden reasoning fields',()=>{
  for(const extra of [{endpoint:'https://evil.invalid'},{apiKey:'secret'},{model:'other'},{headers:{}}])
    assert.throws(()=>validateRequest({...request,...extra}));
  assert.throws(()=>validateRequest({...request,messages:[{role:'assistant',content:'x',reasoning_content:'private'}]}));
});
test('bounded roles, tools and output reject malformed inputs',()=>{
  for(const change of [{output_cap:8193},{operation:'shell'},{request_id:'; echo secret'},
    {messages:[]},{tools:[{type:'function',function:{name:'tool'}}]},
    {messages:[{role:'assistant',tool_calls:[{id:'x',type:'function',function:{name:'x',arguments:{}}}]}]}])
    assert.throws(()=>validateRequest({...request,...change}));
});
test('one fixed generation call, public-only reply and exact body digest',async()=>{
  let calls=0;
  const result=await executeRequest(request,{apiKey:'private-test-key',postOnce:async(url,body,options)=>{
    calls++;assert.equal(url.href,'https://api.z.ai/api/paas/v4/chat/completions');
    assert.equal(options.apiKey,'private-test-key');assert.equal(JSON.parse(body).max_tokens,512);
    return {status:200,bytes:500,payload:{usage:{prompt_tokens:12,completion_tokens:4},
      choices:[{finish_reason:'stop',message:{role:'assistant',content:'{"ok":true}',reasoning_content:'DO_NOT_EXPORT'}}],
      hidden_metadata:'DO_NOT_EXPORT'}};}});
  assert.equal(calls,1);assert.equal(result.prompt_tokens,12);
  assert.ok(!stable(result).includes('DO_NOT_EXPORT'));assert.ok(!stable(result).includes('private-test-key'));
  assert.equal(result.request_sha256,hash({model:'glm-5.3-flash',messages:request.messages,tools:[],stream:false,
    max_tokens:512,thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'}));
});
test('tool reply strips hidden/provider extras',async()=>{
  const r=await executeRequest(request,{apiKey:'private-test-key',postOnce:async()=>({status:200,bytes:200,payload:{
    choices:[{finish_reason:'tool_calls',message:{role:'assistant',reasoning_content:'hidden',tool_calls:[{
      id:'x',type:'function',extra:'hidden',function:{name:'read_file',arguments:'{}',extra:'hidden'}}]}}]}})});
  assert.equal(r.public_response.message.tool_calls[0].function.name,'read_file');assert.ok(!stable(r).includes('hidden'));
});
test('tokenizer uses fixed endpoint and returns no provider text',async()=>{
  const r=await executeRequest({...request,operation:'tokenize'},{apiKey:'private-test-key',postOnce:async(url,body)=>{
    assert.ok(url.href.endsWith('/tokenizer'));assert.ok(!Object.hasOwn(JSON.parse(body),'max_tokens'));
    return {status:200,bytes:100,payload:{usage:{prompt_tokens:9},error:{message:'private-test-key'}}};}});
  assert.equal(r.prompt_tokens,9);assert.equal(r.public_response,null);assert.ok(!stable(r).includes('private-test-key'));
});
test('provider failure never exports arbitrary exception or error prose; no retry',async()=>{
  let calls=0;const r=await executeRequest(request,{apiKey:'private-test-key',postOnce:async()=>{
    calls++;throw Error('private-test-key stack environment dump');}});
  assert.equal(calls,1);assert.equal(r.failure_code,'request-failed');assert.ok(!stable(r).includes('stack'));
});
test('exact credential reflection in public content is redacted',async()=>{
  const r=await executeRequest(request,{apiKey:'private-test-key',postOnce:async()=>({status:200,bytes:100,payload:{
    choices:[{finish_reason:'stop',message:{role:'assistant',content:'private-test-key'}}]}})});
  assert.equal(r.public_response.message.content,'[REDACTED]');
});
