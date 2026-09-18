import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
export const ROOT=resolve(import.meta.dirname,'../../../../../../..');
const {parseCredential}=await import(resolve(ROOT,'implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/cli.mjs'));
const {createSecretProviderRegistry,createSecretReference}=await import(resolve(ROOT,'implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs'));
const {createSopsAgeProcessSecretProvider}=await import(resolve(ROOT,'implementation/agent-reasoning-engine/packages/coding-agent-runtime/sops-age-secret-provider.mjs'));
const {postOnce,MODEL,stable}=await import(resolve(ROOT,'implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs'));
export {MODEL,stable};
export const sha=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:stable(x)).digest('hex');
export function createProvider({directory,credential='/home/vrondelli/.config/are/glm-flash-credential.json',send=postOnce}={}){
 mkdirSync(directory,{recursive:true});
 const c=parseCredential(JSON.parse(readFileSync(credential))),provider=createSopsAgeProcessSecretProvider(c);
 const registry=createSecretProviderRegistry({providers:[provider]}),reference=createSecretReference({provider_id:c.provider_id,locator:c.locator});
 async function request(kind,id,messages,max_tokens=1024){
  if(!/^[a-zA-Z0-9_-]+$/.test(id))throw Error('invalid call id');
  const start=join(directory,id+'-started.json'),end=join(directory,id+'-receipt.json');
  if(existsSync(start)||existsSync(end))throw Error('recorded call must not be retried');
  const payload=kind==='tokenizer'?{model:MODEL,messages}:{model:MODEL,messages,max_tokens,temperature:0,stream:false,thinking:{type:'disabled'}};
  const raw=stable(payload),digest=sha(raw),record={kind,id,model:MODEL,request_sha256:digest,started_at:new Date().toISOString(),authority_effect:'none'};
  writeFileSync(join(directory,id+'-request.json'),raw,{flag:'wx',mode:0o600});writeFileSync(start,JSON.stringify(record),{flag:'wx'});
  try{
   let result,transportFailure;await registry.consume({secret_ref:reference,consumer_id:'glm-flash-transport',request_digest:digest,consumer:async material=>{
    try { result=await send(new URL('https://api.z.ai/api/paas/v4/'+(kind==='tokenizer'?'tokenizer':'chat/completions')),raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:60000,maximum_response_bytes:262144}); } catch(error) { transportFailure=error; } }});
   if(transportFailure){record.transport_failure=transportFailure.code??'transport-failure';throw transportFailure;}
   record.status=result.status;record.usage=result.payload?.usage??null;
   if(result.status!==200){record.error_code=String(result.payload?.error?.code??'http-error');throw Error('provider-http-error');}
   record.output=result.payload?.choices?.[0]?.message?.content??null;record.finish_reason=result.payload?.choices?.[0]?.finish_reason??null;record.response_model=result.payload?.model??null;
   record.response_sha256=sha(result.payload);
   validateReceipt(record,kind,max_tokens);
   record.ok=true;return record;
  }catch(error){record.ok=false;record.failure=error.code??(String(error.message).startsWith('provider-')||String(error.message).startsWith('usage-')||error.message==='incomplete-output'?error.message:'provider-or-credential-failure');throw Object.assign(Error(record.failure),{receipt:record});}
  finally{record.finished_at=new Date().toISOString();writeFileSync(end,JSON.stringify(record,null,2)+'\n',{flag:'wx'});}
 }
 return {tokenize:(id,messages)=>request('tokenizer',id,messages),generate:(id,messages,max)=>request('model',id,messages,max)};
}

export function validateReceipt(record,kind,max_tokens=1024){
   const u=record.usage;if(!Number.isSafeInteger(u?.prompt_tokens)||u.prompt_tokens<0)throw Error('usage-missing');
   if(kind!=='tokenizer'&&(!Number.isSafeInteger(u?.completion_tokens)||u.completion_tokens<0||u.total_tokens!==u.prompt_tokens+u.completion_tokens))throw Error('usage-invalid');
   if(kind!=='tokenizer'){
    if(record.response_model!==MODEL)throw Error('provider-model-mismatch');
    if(u.prompt_tokens>7168||u.completion_tokens>max_tokens)throw Error('usage-context-cap-exceeded');
    for(const [value,cap] of [[u.completion_tokens_details?.reasoning_tokens,u.completion_tokens],[u.prompt_tokens_details?.cached_tokens,u.prompt_tokens]]){
     if(value!==undefined&&value!==null&&(!Number.isSafeInteger(value)||value<0||value>cap))throw Error('usage-details-invalid');
    }
   }
   if(kind!=='tokenizer'&&(typeof record.output!=='string'||!record.output.trim()||record.finish_reason!=='stop'))throw Error('incomplete-output');
}
