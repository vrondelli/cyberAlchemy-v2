// Public request-body qualification only; no real providers or labels.
// Open Questions: evidence/G01-PUBLIC-STATELESS-PROVIDER-PROFILE-R1.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';import {join} from 'node:path';
import {executeRequest as executeOriginal,stable,hash} from './vps-json-provider-r1.mjs';
import {providerBody} from './wsl-vps-provider-r1.mjs';
import {BASE_RELAY_PATH,BASE_RELAY_SHA,buildPublicStatelessRelaySource,publicStatelessProviderBody,loadPublicStatelessRelay} from './public-stateless-provider-profile-r1.mjs';
const relay=await loadPublicStatelessRelay();
const request={operation:'generate',request_id:'synthetic-profile-test',messages:[{role:'user',content:'Return JSON.'}],tools:[],output_cap:512};
const syntheticKey='synthetic-not-a-real-credential';
test('exact pinned standalone relay differs only by the single clearing flag',()=>{
 const base=readFileSync(BASE_RELAY_PATH,'utf8');assert.equal(hash(base),BASE_RELAY_SHA);
 assert.equal(relay.source.replace("clear_thinking:true","clear_thinking:false"),base);
 assert.notEqual(relay.source_sha256,BASE_RELAY_SHA);
 assert.throws(()=>buildPublicStatelessRelaySource(base+'\n'),/base-source-drift/);
 assert.throws(()=>buildPublicStatelessRelaySource(base.replace('clear_thinking:false','clear_thinking:true')),/base-source-drift/);
});
test('all144 saved public inputs preserve everything except generation clearing flag',()=>{
 const root='/home/vlad_/are-benchmark-archive/g01-native-method-live-r7-20261007';
 const result=JSON.parse(readFileSync(join(root,'RESULT.json')));let count=0,generations=0;
 for(const row of result.rows){const dir=join(root,row.cell,'requests');
  for(const name of readdirSync(dir).filter(n=>/^\d+-STARTED\.json$/.test(n))){
   const input=JSON.parse(readFileSync(join(dir,name))).input;
   const oldBody=providerBody(input),nextBody=publicStatelessProviderBody(input);
   if(input.operation==='tokenize')assert.equal(nextBody,oldBody);
   else{const expected=JSON.parse(oldBody);expected.thinking.clear_thinking=true;
    assert.equal(nextBody,stable(expected));assert.equal(JSON.parse(nextBody).max_tokens,512);generations++;}
   count++;
  }
 }
 assert.equal(count,144);assert.equal(generations,63);
});
test('generated relay sends exact profile body once and keeps public-only response',async()=>{
 let calls=0;
 const result=await relay.module.executeRequest(request,{apiKey:syntheticKey,postOnce:async(url,body,opts)=>{
  calls++;assert.equal(url.href,'https://api.z.ai/api/paas/v4/chat/completions');
  assert.equal(body,publicStatelessProviderBody(request));assert.equal(opts.timeout_ms,300000);
  assert.equal(opts.maximum_response_bytes,1024*1024);
  const message={role:'assistant',content:'{"ok":true}'};
  Object.defineProperty(message,'reasoning_content',{get(){throw Error('non-public field accessed');}});
  return{status:200,bytes:100,payload:{usage:{prompt_tokens:12,completion_tokens:4},choices:[{finish_reason:'stop',message}]}};
 }});
 assert.equal(calls,1);assert.equal(result.request_sha256,hash(publicStatelessProviderBody(request)));
 assert.equal(result.automatic_retries,0);assert.equal(result.redirects_followed,0);
 assert.deepEqual(result.public_response,{finish_reason:'stop',message:{role:'assistant',content:'{"ok":true}'}});
 assert.ok(!stable(result).includes(syntheticKey));
});
test('original/new sanitizer semantics identical, including public tool calls and redaction',async()=>{
 const payload={usage:{prompt_tokens:20,completion_tokens:8},choices:[{finish_reason:'tool_calls',message:{role:'assistant',
  content:syntheticKey,tool_calls:[{id:'t',type:'function',function:{name:'read_file',arguments:'{}',extra:'DROP'},extra:'DROP'}]}}],extra:'DROP'};
 const deps={apiKey:syntheticKey,postOnce:async()=>({status:200,bytes:200,payload})};
 const original=await executeOriginal(request,deps),next=await relay.module.executeRequest(request,deps);
 for(const r of [original,next]){delete r.latency_ms;delete r.request_sha256;assert.ok(!stable(r).includes('DROP'));}
 assert.deepEqual(next,original);assert.equal(next.public_response.message.content,'[REDACTED]');
});
test('closed request still rejects private and provider override fields before dispatch',async()=>{
 for(const extra of [{model:'other'},{apiKey:'x'},{endpoint:'https://invalid.test'},{thinking:{type:'disabled'}}]){
  let called=false;await assert.rejects(relay.module.executeRequest({...request,...extra},{apiKey:syntheticKey,postOnce:async()=>{called=true;}}));assert.equal(called,false);
 }
 await assert.rejects(relay.module.executeRequest({...request,messages:[{role:'assistant',content:'x',reasoning_content:'forbidden'}]},
  {apiKey:syntheticKey,postOnce:async()=>{throw Error('must not dispatch');}}));
});
test('tokenizer body remains identical and confirmed500 remains non-success with no retry',async()=>{
 const input={...request,operation:'tokenize'};let calls=0;
 const result=await relay.module.executeRequest(input,{apiKey:syntheticKey,postOnce:async(url,body,opts)=>{
  calls++;assert.equal(url.href,'https://api.z.ai/api/paas/v4/tokenizer');assert.equal(body,providerBody(input));assert.equal(opts.timeout_ms,30000);
  return{status:500,bytes:59,payload:{error:{code:'500',message:'DO_NOT_EXPORT'}}};
 }});
 assert.equal(calls,1);assert.equal(result.status,500);assert.equal(result.provider_code,'500');
 assert.equal(result.dispatched,true);assert.equal(result.prompt_tokens,null);assert.equal(result.public_response,null);
 assert.equal(result.request_sha256,hash(providerBody(input)));assert.ok(!stable(result).includes('DO_NOT_EXPORT'));
});
test('unknown transport error retains unknown usage, sanitized code and no retry',async()=>{
 let calls=0;const result=await relay.module.executeRequest(request,{apiKey:syntheticKey,postOnce:async()=>{calls++;throw Error('DO_NOT_EXPORT');}});
 assert.equal(calls,1);assert.equal(result.failure_code,'request-failed');assert.equal(result.status,null);
 assert.equal(result.prompt_tokens,null);assert.equal(result.completion_tokens,null);assert.equal(result.automatic_retries,0);
 assert.ok(!stable(result).includes('DO_NOT_EXPORT'));
});
test('output exhaustion is not repaired or relabeled as an admitted successful generation',async()=>{
 const result=await relay.module.executeRequest(request,{apiKey:syntheticKey,postOnce:async()=>({status:200,bytes:100,
  payload:{usage:{prompt_tokens:3287,completion_tokens:512},choices:[{finish_reason:'length',message:{role:'assistant',content:'incomplete'}}]}})});
 assert.equal(result.completion_tokens,512);assert.equal(result.public_response.finish_reason,'length');assert.equal(result.automatic_retries,0);
});
