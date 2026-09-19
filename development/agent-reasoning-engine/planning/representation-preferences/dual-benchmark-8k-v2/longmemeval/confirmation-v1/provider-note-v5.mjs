// Exact-wire, single-attempt GLM transport. No construction/effects on import.
// Open questions: RUNNER.md; live execution needs a reviewed immutable freeze.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sha,wire} from './adapter-note-v5.mjs';
import {createMeter} from './qualify-note-v5.mjs';
import {stable,postOnce} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {parseCredential} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/cli.mjs';
import {createSecretProviderRegistry,createSecretReference} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs';
import {createSopsAgeProcessSecretProvider} from '../../../../../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/sops-age-secret-provider.mjs';
const valid=u=>Number.isSafeInteger(u?.prompt_tokens)&&u.prompt_tokens>=0&&Number.isSafeInteger(u?.completion_tokens)&&u.completion_tokens>=0&&u.total_tokens===u.prompt_tokens+u.completion_tokens;
export function createLiveExchange(credential){
 const c=parseCredential(JSON.parse(readFileSync(credential))),provider=createSopsAgeProcessSecretProvider({...c,timeout_ms:Math.min(c.timeout_ms??30000,30000)}),registry=createSecretProviderRegistry({providers:[provider]}),reference=createSecretReference({provider_id:c.provider_id,locator:c.locator});
 return async(kind,raw,digest,{signal,onDispatch=()=>{}})=>{
  assert.ok(['model','tokenizer'].includes(kind));assert.equal(sha(raw),digest);let response,failure;
  await registry.consume({secret_ref:reference,consumer_id:'glm-flash-transport',request_digest:digest,consumer:async material=>{
   try{assert.ok(!signal?.aborted,'cancelled-before-dispatch');await onDispatch();assert.ok(!signal?.aborted,'cancelled-at-dispatch');response=await postOnce(new URL('https://api.z.ai/api/paas/v4/'+(kind==='model'?'chat/completions':'tokenizer')),raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:kind==='model'?60000:30000,maximum_response_bytes:262144,signal});}catch(error){failure=error;}
  }});if(failure)throw failure;return response;
 };
}
export function createGenerator({exchange,record,before=()=>{},maximum_calls=153}){
 assert.equal(typeof exchange,'function');assert.equal(typeof record,'function');assert.ok(Number.isSafeInteger(maximum_calls)&&maximum_calls>0);const consumed=new Set(),active=new Set();let calls=0,reserved=0;
 const execute=async({id,request,signal})=>{
  assert.match(id,/^[a-zA-Z0-9_-]+$/);assert.ok(!consumed.has(id),'no retries');assert.ok(reserved<maximum_calls,'model-call ceiling');assert.equal(stable(request),stable(wire(request.messages,request.max_tokens)),'unsupported exact wire');consumed.add(id);
  const raw=stable(request),receipt={kind:'model',id,request_sha256:sha(raw),model:request.model,started_at:new Date().toISOString(),dispatched:false,transport_attempts:0};let failure,intent=false;
  try{
   before();assert.ok(!signal?.aborted,'cancelled-before-exchange');await record({...receipt,phase:'prepared'});
   const response=await exchange('model',raw,receipt.request_sha256,{signal,onDispatch:async()=>{before();assert.ok(!signal?.aborted,'cancelled-before-dispatch');assert.ok(!intent,'single transport attempt');assert.ok(reserved<maximum_calls,'model-call ceiling');intent=true;reserved++;await record({...receipt,phase:'dispatch-intent',dispatched:true,transport_attempts:1});receipt.dispatched=true;receipt.transport_attempts=1;calls++;}});
   assert.ok(receipt.dispatched,'missing-dispatch-proof');receipt.status=response.status;receipt.response_sha256=sha(response.payload);receipt.usage=response.payload?.usage??null;
   if(response.status!==200){receipt.error_code=String(response.payload?.error?.code??'http-error');throw Error('provider-http-error');}
   const choice=response.payload?.choices?.[0];receipt.response_model=response.payload?.model??null;receipt.finish_reason=choice?.finish_reason??null;receipt.output=choice?.message?.content??null;
   assert.equal(receipt.response_model,request.model,'provider-model-mismatch');assert.equal(response.payload?.choices?.length,1,'provider-choice-count');assert.ok(valid(receipt.usage),'unknown-usage');
   receipt.ok=true;
  }catch(error){receipt.ok=false;receipt.failure_code=error.code??'provider-or-journal-failure';failure=error;}
  receipt.finished_at=new Date().toISOString();
  try{await record({...receipt,phase:receipt.ok?'completed':'failed'});}catch(error){receipt.ok=false;receipt.persistence_failure=true;failure=error;}
  if(failure){const error=Object.assign(Error(receipt.failure_code??'provider-persistence-failure'),{receipt,model_started:receipt.dispatched});if(!receipt.dispatched)error.dispatch_proof='not-dispatched';if(valid(receipt.usage))error.usage=receipt.usage;throw error;}
  return receipt;
 };
 const generate=options=>{const pending=execute(options);active.add(pending);pending.then(()=>active.delete(pending),()=>active.delete(pending));return pending;};
 generate.settle=async({timeout_ms=35000}={})=>{let timer;try{return await Promise.race([Promise.allSettled([...active]).then(()=>({settled:true,pending:0})),new Promise(resolve=>{timer=setTimeout(()=>resolve({settled:false,pending:active.size}),timeout_ms);})]);}finally{clearTimeout(timer);}};
 return generate;
}
export function createProviders({credential,record,before,maximum_calls=153,exchange}){
 const send=exchange??createLiveExchange(credential);
 const meter=createMeter({exchange:(raw,digest,{signal})=>send('tokenizer',raw,digest,{signal}),record:r=>record({channel:'tokenizer',...r}),before});
 const generate=createGenerator({exchange:send,record:r=>record({channel:'model',...r}),before,maximum_calls});return {meter,generate};
}
