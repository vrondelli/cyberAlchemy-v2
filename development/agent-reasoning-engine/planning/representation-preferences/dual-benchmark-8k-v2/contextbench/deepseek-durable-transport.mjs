// Durable, one-arm transport. Open questions: DEEPSEEK-DURABLE-TRANSPORT.md.
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {parseDeepSeekStream} from './deepseek-wire-export.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const need=(v,m)=>{if(!v)throw Error('dsh-transport.'+m);};
const uint=n=>Number.isSafeInteger(n)&&n>=0;
const MAX_BYTES=2*1024**2;
export async function boundedResponse(response,limit=MAX_BYTES){
 need(uint(limit)&&limit>0,'response-limit');const chunks=[];let size=0;
 if(response.body){const reader=response.body.getReader();try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;need(size<=limit,'response-size');chunks.push(value);}}catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}}
 return {status:response.status,bytes:new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks))};
}
export function providerPost({key,base='https://api.z.ai/api/paas/v4/',fetchImpl=fetch}){
 need(typeof key==='string'&&key.trim().length>0,'credential');need(base==='https://api.z.ai/api/paas/v4/','provider-base');
 return async(path,bytes,signal)=>{need(['tokenizer','chat/completions'].includes(path),'provider-path');return boundedResponse(await fetchImpl(base+path,{method:'POST',headers:{authorization:'Bearer '+key.trim(),'content-type':'application/json'},body:bytes,signal}));};
}
function usageFrom(response){
 if(!response)return null;let usage=null;
 // Usage may be known even when finish_reason is length or another task failure.
 for(const frame of response.bytes.replaceAll('\r\n','\n').split('\n\n')){
  const data=frame.split('\n').filter(x=>x.startsWith('data:')).map(x=>x.slice(5).trimStart()).join('\n');
  if(!data||data==='[DONE]')continue;
  let value;try{value=JSON.parse(data);}catch{continue;}
  if(!value.usage)continue;const u=value.usage;
  if(!uint(u.prompt_tokens)||!uint(u.completion_tokens)||!uint(u.total_tokens)||!Number.isSafeInteger(u.prompt_tokens+u.completion_tokens)||u.prompt_tokens+u.completion_tokens!==u.total_tokens)return null;
  const next={input:u.prompt_tokens,output:u.completion_tokens,total:u.total_tokens};
  if(usage&&JSON.stringify(usage)!==JSON.stringify(next))return null;usage=next;
 }
 return usage;
}
export function reconcileTransport(root){
 const names=readdirSync(root).filter(n=>/^\d{6}\.json$/.test(n)).sort(),events=[],bindings=[];
 for(const [index,name] of names.entries()){
  need(name===String(index).padStart(6,'0')+'.json','journal-gap');const bytes=readFileSync(join(root,name),'utf8'),event=JSON.parse(bytes);
  need(event.seq===index,'journal-sequence');events.push(event);bindings.push({name,sha256:hash(bytes)});
 }
 const attempts=new Map();let input=0,output=0,unknown=0,dispatched=0;
 for(const e of events){
  if(e.kind==='request'){need(typeof e.request_bytes==='string'&&hash(e.request_bytes)===e.request_sha256,'request-digest');need(!attempts.has(e.attempt),'duplicate-request');attempts.set(e.attempt,{request:e,dispatch:null,response:null,receipt:null});}
  if(e.kind==='model-intent'){const a=attempts.get(e.attempt);need(a&&!a.dispatch&&!a.receipt,'duplicate-or-orphan-dispatch');need(e.request_sha256===a.request.request_sha256,'dispatch-request-digest');a.dispatch=e;}
  if(e.kind==='model-response'){const a=attempts.get(e.attempt);need(a?.dispatch&&!a.response&&!a.receipt,'duplicate-or-orphan-response');need(typeof e.bytes==='string'&&hash(e.bytes)===e.response_sha256,'response-digest');a.response=e;}
  if(e.kind==='receipt'){const a=attempts.get(e.attempt);need(a&&!a.receipt,'duplicate-or-orphan-receipt');a.receipt=e;}
 }
 for(const a of attempts.values())if(a.dispatch){dispatched++;const u=usageFrom(a.response);if(u){input+=u.input;output+=u.output;need(Number.isSafeInteger(input+output),'usage-overflow');}else unknown++;}
 return {attempts:attempts.size,model_calls:dispatched,known_input_tokens:input,known_output_tokens:output,known_total_tokens:input+output,unknown_usage_dispatched_requests:unknown,cost_complete:unknown===0,unsettled_attempts:[...attempts].filter(([,a])=>!a.receipt).map(([id])=>id),bindings};
}
export function createDurableTransport({root,post,output_cap=2048,window=8000,margin=512,token_budget=96000,max_calls=96,timeout_ms=120000,maximum_request_bytes=MAX_BYTES,maximum_stage_bytes=32*1024**2,persistenceFactory=createStagePersistence}){
 need(realpathSync(root)===resolve(root)&&readdirSync(root).length===0,'fresh-canonical-root');need(typeof post==='function','post');
 need([output_cap,window,margin,token_budget,max_calls,timeout_ms].every(uint)&&output_cap>0&&output_cap+margin<window&&[8000,1000000].includes(window)&&token_budget<=(window===8000?96000:4000000)&&token_budget>=window&&max_calls>0&&max_calls<=96&&timeout_ms>0,'limits');
 need(uint(maximum_request_bytes)&&maximum_request_bytes>0&&maximum_request_bytes<=(window===8000?MAX_BYTES:32*1024**2),'request-byte-limit');
 const guard=createStageOutputGuard({root,maximum_bytes:maximum_stage_bytes}),disk=persistenceFactory({stage_guard:guard,stage_root:root});
 let seq=0,attempts=0,calls=0,known=0,unknown=0,poisoned=false,closed=false,pending=null,abort=null;
 const save=(kind,data)=>{try{disk.writeJson(join(root,String(seq).padStart(6,'0')+'.json'),{seq,kind,...data});seq++;}catch(e){poisoned=true;throw e;}};
 const state=()=>({attempts,model_calls:calls,known_total_tokens:known,unknown_usage_dispatched_requests:unknown,poisoned,closed,busy:pending!==null,window,maximum_request_bytes});
 async function execute(request_bytes,signal){
  const attempt=attempts++;let dispatched=false,response=null,usage=null,accounted=false;
  try{
   need(typeof request_bytes==='string'&&Buffer.byteLength(request_bytes)<=maximum_request_bytes,'request-size');save('request',{attempt,request_bytes,request_sha256:hash(request_bytes)});
   const b=JSON.parse(request_bytes),cap=b.max_tokens??b.max_completion_tokens;
   need(b.model==='glm-5.3-flash'&&b.stream===true&&Array.isArray(b.messages)&&(b.tools===undefined||Array.isArray(b.tools))&&uint(cap)&&cap>0&&cap<=output_cap,'request-profile');
   need(!(b.max_tokens!==undefined&&b.max_completion_tokens!==undefined),'ambiguous-output-cap');
   need(calls<max_calls,'call-budget');signal.throwIfAborted();
   const tokenizer=JSON.stringify({model:b.model,messages:b.messages,tools:b.tools??[]});save('tokenizer-intent',{attempt,request_bytes:tokenizer,request_sha256:hash(tokenizer)});
   const measurement=await post('tokenizer',tokenizer,signal);need(typeof measurement.bytes==='string'&&Buffer.byteLength(measurement.bytes)<=MAX_BYTES,'tokenizer-size');save('tokenizer-response',{attempt,...measurement});
   const measured=JSON.parse(measurement.bytes)?.usage?.prompt_tokens;need(measurement.status===200&&uint(measured),'tokenizer-invalid');
   const reservation=measured+margin+cap;need(Number.isSafeInteger(reservation),'reservation-overflow');
   const admitted=reservation<=window&&known+reservation<=token_budget;save('admission',{attempt,admitted,measured,margin,cap,reservation,window,token_budget});
   need(known+reservation<=token_budget,'request-budget');
   if(reservation>window)throw Object.assign(Error('dsh-transport.context-window'),{recoverableWindow:true});
   signal.throwIfAborted();
   save('model-intent',{attempt,reservation,request_sha256:hash(request_bytes)});dispatched=true;calls++;
   response=await post('chat/completions',request_bytes,signal);need(typeof response.bytes==='string'&&Buffer.byteLength(response.bytes)<=MAX_BYTES,'response-size');
   usage=usageFrom(response);if(usage)known+=usage.total;else unknown++;accounted=true;
   save('model-response',{attempt,...response,response_sha256:hash(response.bytes)});
   need(response.status===200,'provider-status');const parsed=parseDeepSeekStream(response.bytes,{allowUnsuccessful:true});need(parsed.model===b.model,'response-model');
   need(usage&&usage.input<=measured+margin&&usage.output<=cap&&usage.input+cap<=window&&known<=token_budget,'actual-budget');
   save('receipt',{attempt,dispatched:true,ok:true,finish_reason:parsed.finish_reason,usage,known_total_tokens:known,unknown_usage:false});return response;
  }catch(e){
   const recoverableWindow=e.recoverableWindow===true&&!dispatched&&!poisoned;
   if(!recoverableWindow)poisoned=true;if(dispatched&&!accounted)unknown++;
   // Do not log raw network errors, which may contain credentials or response text.
   const code=String(e.message).startsWith('dsh-')?String(e.message).slice(0,160):e.name==='AbortError'?'aborted':'transport-or-persistence-failure';
   try{save('receipt',{attempt,dispatched,ok:false,code,recoverable_window:recoverableWindow,usage,known_total_tokens:known,unknown_usage:dispatched&&!usage});}catch{}
   throw Object.assign(Error(code),{attempt,dispatched,recoverableWindow:recoverableWindow&&!poisoned,unknown_usage:dispatched&&!usage});
  }
 }
 return Object.freeze({
  state,
  process(bytes,{signal}={}){
   need(!closed&&!poisoned&&!pending,'closed-poisoned-or-busy');if(attempts>=max_calls*2){poisoned=true;throw Error('dsh-transport.attempt-budget');}abort=new AbortController();
   const combined=AbortSignal.any([abort.signal,AbortSignal.timeout(timeout_ms),...(signal?[signal]:[])]);
   // The microtask installs pending before any work begins.
   pending=Promise.resolve().then(()=>execute(bytes,combined)).finally(()=>{pending=null;abort=null;});return pending;
  },
  async close({cancel=false}={}){
   if(closed)throw Error('dsh-transport.already-closed');closed=true;if(cancel)abort?.abort();if(pending)await pending.catch(()=>{});
   const reconciliation=reconcileTransport(root),summary={schema_version:'are.dsh-transport-seal/v1',...reconciliation,state:state(),limits:{window,margin,output_cap,token_budget,max_calls,maximum_request_bytes,maximum_stage_bytes},benchmark_cleared:false};
   disk.writeJson(join(root,'RESULTS.json'),summary,{final:true});return summary;
  }
 });
}

export function loadSealedExchanges(root){
 const seal=JSON.parse(readFileSync(join(root,'RESULTS.json'),'utf8')),actual=reconcileTransport(root);
 need(seal.schema_version==='are.dsh-transport-seal/v1','seal-version');
 for(const key of Object.keys(actual))need(JSON.stringify(seal[key])===JSON.stringify(actual[key]),'seal-reconciliation-'+key);
 need(seal.state?.closed===true&&seal.state.busy===false&&!seal.state.poisoned&&actual.cost_complete&&actual.unsettled_attempts.length===0,'successful-settled-seal');
 const events=actual.bindings.map(b=>JSON.parse(readFileSync(join(root,b.name),'utf8')));
 const exchanges=events.filter(e=>e.kind==='request').map(request=>{
  const match=kind=>events.find(e=>e.kind===kind&&e.attempt===request.attempt);
  const response=match('model-response'),receipt=match('receipt'),admission=match('admission');
  if(receipt?.dispatched===false&&receipt.recoverable_window===true){need(!response&&!match('model-intent')&&receipt.code==='dsh-transport.context-window'&&admission?.admitted===false&&admission.reservation>admission.window,'denial-binding');return null;}
  need(response&&receipt?.ok===true&&admission?.admitted===true,'successful-attempt-required');
  return {status:response.status,request_bytes:request.request_bytes,request_sha256:request.request_sha256,response_bytes:response.bytes,response_sha256:response.response_sha256};
 }).filter(Boolean);
 need(exchanges.length===actual.model_calls,'dispatch-completeness');return {seal,exchanges};
}
