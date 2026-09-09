// Bounded token-only feasibility; no model endpoint or candidate mutation. Open questions: README.md.
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';import {join} from 'node:path';
export const sha=x=>createHash('sha256').update(x).digest('hex');
export const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export function padded(body,blocks){
 if(!Number.isInteger(blocks)||blocks<0||blocks>512)throw Error('padding bounds');
 const result={model:body.model,messages:structuredClone(body.messages),tools:structuredClone(body.tools)};
 if(blocks)result.messages.push({role:'user',content:'Neutral calibration payload; contains no task instructions or routing values.\n'+Array.from({length:blocks},(_,i)=>sha('h22-pressure80-'+i)).join('\n')});
 return result;
}
export async function calibrateGroup(group,measure){
 const limit=group.soft-256,reserve=2048,margin=512,cache=new Map();let queries=0;
 async function count(body,n,label){const raw=stable(padded(body,n));if(!cache.has(raw)){if(queries>=32)throw Error('per-window query cap');queries++;cache.set(raw,await measure(raw,{window:group.soft,padding_blocks:n,label}));}return cache.get(raw);}
 const projected=t=>t+reserve+margin;
 const base=await count(group.full,0,'full-unpadded');
 if(projected(base)>=limit)return {window:group.soft,bracketed:false,reason:'unpressured full history does not fit',queries};
 let lo=0,hi=512;const upper=await count(group.full,hi,'full-search-upper');
 if(projected(upper)<limit)return {window:group.soft,bracketed:false,reason:'bounded padding does not cross limit',queries};
 while(hi-lo>1){const mid=Math.floor((lo+hi)/2),tokens=await count(group.full,mid,'full-search');if(projected(tokens)>=limit)hi=mid;else lo=mid;}
 const full=await count(group.full,hi,'full-selected'),below=await count(group.full,lo,'full-below'),fallback=await count(group.fallback,hi,'fallback-selected'),prefix=[];
 for(const [i,body] of group.prefix.entries())prefix.push(await count(body,hi,'prefix-'+(i+1)));
 const bracketed=projected(full)>=limit&&projected(below)<limit&&projected(fallback)<limit&&prefix.every(t=>projected(t)<limit);
 return {window:group.soft,bracketed,padding_blocks:hi,below_padding_blocks:lo,effective_limit:limit,output_reservation:reserve,input_margin:margin,full_tokens:full,below_tokens:below,fallback_tokens:fallback,prefix_tokens:prefix,full_projected:projected(full),fallback_projected:projected(fallback),maximum_prefix_projected:Math.max(...prefix.map(projected)),queries,reason:bracketed?'exact measured bracket':'prefix or fallback is not admitted; no pressure claim'};
}
export async function runCalibration({groups,out,request}){
 mkdirSync(out);const receipts=[],results=[],cache=new Map();
 const save=(name,value)=>writeFileSync(join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
 async function measure(raw,label){
  if(cache.has(raw))return cache.get(raw);
  if(receipts.length>=96)throw Error('global tokenizer cap');
  // Leave room for model-only transport fields; this is not a large-body qualification.
  if(Buffer.byteLength(raw)>126976)throw Error('request body ceiling');
  const id=receipts.length,r={id,...label,request_sha256:sha(raw),request_bytes:Buffer.byteLength(raw),status:null,dispatched:false,automatic_retries:0,authority_effect:'none'};
  receipts.push(r);writeFileSync(join(out,'request-'+id+'.json'),raw,{flag:'wx'});save('started-'+id+'.json',r);const start=Date.now();
  try{
   const response=await request(raw,()=>{if(r.dispatched)throw Error('duplicate dispatch');r.dispatched=true;save('dispatch-'+id+'.json',{id,request_sha256:r.request_sha256});});
   r.status=response.status;r.response_bytes=response.bytes??null;r.input_tokens=response.payload?.usage?.prompt_tokens??null;
   if(r.status!==200||!Number.isSafeInteger(r.input_tokens)||r.input_tokens<0)throw Error('invalid tokenizer response');
   cache.set(raw,r.input_tokens);return r.input_tokens;
  }catch(e){r.failure_code=typeof e.code==='string'?e.code:'calibration-request-failed';throw e;}
  finally{r.elapsed_ms=Date.now()-start;save('receipt-'+id+'.json',r);}
 }
 try{
  for(const group of groups){const result=await calibrateGroup(group,measure);results.push(result);save('window-'+group.soft+'.json',result);console.log(JSON.stringify(result));}
  const result={results,all_bracketed:results.every(r=>r.bracketed),tokenizer_attempts:receipts.length,maximum_tokenizer_attempts:96,model_attempts:0,receipts,authority_effect:'none',open_questions_ref:'../README.md'};save('result.json',result);return result;
 }catch(e){save('stop.json',{reason:typeof e.code==='string'?e.code:'calibration-failed',completed_windows:results.map(r=>r.window),tokenizer_attempts:receipts.length,model_attempts:0,authority_effect:'none',open_questions_ref:'../README.md'});throw e;}
}
