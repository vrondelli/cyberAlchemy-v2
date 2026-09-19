// Narrow descendant of benchmark-pilot-v2/execution/selectivity-v2/provider.mjs.
// Adds injected exchange/journal and preserves receipt usage when journaling fails.
// Open questions and admission status: RUNNER.md.
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT,MODEL,stable,sha,validateReceipt} from '../../benchmark-pilot-v2/execution/selectivity-v2/provider.mjs';
export {MODEL};
const valid=u=>Number.isSafeInteger(u?.prompt_tokens)&&u.prompt_tokens>=0&&Number.isSafeInteger(u?.completion_tokens)&&u.completion_tokens>=0&&u.total_tokens===u.prompt_tokens+u.completion_tokens;
export function createProvider({directory,credential='/home/vrondelli/.config/are/glm-flash-credential.json',exchange,write=writeFileSync,exists=existsSync,mkdir=mkdirSync}={}){
 mkdir(directory,{recursive:true});let consumed=new Set();
 async function liveExchange(url,raw,digest){
  const {parseCredential}=await import(ROOT+'/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/cli.mjs');
  const {createSecretProviderRegistry,createSecretReference}=await import(ROOT+'/implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs');
  const {createSopsAgeProcessSecretProvider}=await import(ROOT+'/implementation/agent-reasoning-engine/packages/coding-agent-runtime/sops-age-secret-provider.mjs');
  const {postOnce}=await import(ROOT+'/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs');
  const c=parseCredential(JSON.parse(readFileSync(credential))),provider=createSopsAgeProcessSecretProvider(c),registry=createSecretProviderRegistry({providers:[provider]}),reference=createSecretReference({provider_id:c.provider_id,locator:c.locator});
  let result,failure;await registry.consume({secret_ref:reference,consumer_id:'glm-flash-transport',request_digest:digest,consumer:async material=>{try{result=await postOnce(url,raw,{apiKey:Buffer.from(material).toString('utf8'),timeout_ms:60000,maximum_response_bytes:262144});}catch(error){failure=error;}}});if(failure)throw failure;return result;
 }
 async function request(kind,id,messages,max_tokens=1024){
  if(!/^[a-zA-Z0-9_-]+$/.test(id))throw Error('invalid call id');
  const start=join(directory,id+'-started.json'),end=join(directory,id+'-receipt.json');
  if(consumed.has(id)||exists(start)||exists(end))throw Error('recorded call must not be retried');consumed.add(id);
  const payload=kind==='tokenizer'?{model:MODEL,messages}:{model:MODEL,messages,max_tokens,temperature:0,stream:false,thinking:{type:'enabled',clear_thinking:false},reasoning_effort:'low'};
  const raw=stable(payload),digest=sha(raw),record={kind,id,model:MODEL,request_sha256:digest,started_at:new Date().toISOString(),authority_effect:'none'};
  let sent=false,failure;
  try{
   write(join(directory,id+'-request.json'),raw,{flag:'wx',mode:0o600});write(start,JSON.stringify(record),{flag:'wx'});
   sent=true;const result=await(exchange??liveExchange)(new URL('https://api.z.ai/api/paas/v4/'+(kind==='tokenizer'?'tokenizer':'chat/completions')),raw,digest);
   record.status=result.status;record.usage=result.payload?.usage??null;
   if(result.status!==200){record.error_code=String(result.payload?.error?.code??'http-error');throw Error('provider-http-error');}
   record.output=result.payload?.choices?.[0]?.message?.content??null;record.finish_reason=result.payload?.choices?.[0]?.finish_reason??null;record.response_model=result.payload?.model??null;record.response_sha256=sha(result.payload);
   validateReceipt(record,kind,max_tokens);record.ok=true;
  }catch(error){record.ok=false;record.failure=error.code??(String(error.message).startsWith('provider-')||String(error.message).startsWith('usage-')||error.message==='incomplete-output'?error.message:'provider-or-journal-failure');failure=Error(record.failure);if(!sent)record.usage={prompt_tokens:0,completion_tokens:0,total_tokens:0};}
  record.finished_at=new Date().toISOString();
  try{write(end,JSON.stringify(record,null,2)+'\n',{flag:'wx'});}catch(error){record.persistence_failure=error.code??'receipt-journal-failure';record.ok=false;failure=Object.assign(Error('provider-receipt-persistence-failure'),{cause:failure??error});}
  if(failure)throw Object.assign(failure,{receipt:record,model_started:kind==='model'&&sent,...(kind==='model'&&valid(record.usage)?{usage:record.usage}:{})});
  return record;
 }
 return {tokenize:(id,messages)=>request('tokenizer',id,messages),generate:(id,messages,max)=>request('model',id,messages,max)};
}
