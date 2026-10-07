// Immutable exchange/view prototype. Open questions: BOUNDED-ARCHIVE-FRONTIER-R1.md.
import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {admitToolBatch} from './ranked-source-hints-admission-r1.mjs';
import {renderCompactPrompt} from './compact-prompt.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error(`frontier-views.${m}`);};
export function createBoundedExchangeArchive({persist,measure,limit=8000,maximum_probes=16,omit_reasoning_from_view=false,omit_reasoning_on_denial=false}){
 need(typeof persist==='function'&&typeof measure==='function','dependencies');
 need(typeof omit_reasoning_from_view==='boolean'&&typeof omit_reasoning_on_denial==='boolean'&&!(omit_reasoning_from_view&&omit_reasoning_on_denial),'view-option');
 need(Number.isSafeInteger(maximum_probes)&&maximum_probes>0,'probe-budget');
 need(Number.isSafeInteger(limit)&&limit>0&&limit<=8000,'limit');
 const raw=new Map(),views=new Map(),identities=new Map();let active=false;
 async function admit({messages,tools,assistant,results,suffix=[]}){
  need(!active,'concurrent-admission');active=true;
  try{
   need(assistant?.role==='assistant'&&Array.isArray(assistant.tool_calls)&&assistant.tool_calls.length>0,'assistant');
   need(Array.isArray(results)&&results.length===assistant.tool_calls.length,'results');
   const original=structuredClone({assistant,results}),archive_sha256=hash(original);
   const ids=assistant.tool_calls.map(c=>c.id);need(ids.every(id=>typeof id==='string'&&id.length>0)&&new Set(ids).size===ids.length,'call-identities');
   for(const id of ids)need(!identities.has(id)||identities.get(id)===archive_sha256,'call-identity-reused');
   // Persist the assistant (including reasoning) and exact raw results before
   // tokenization or reduction, once per immutable exchange identity.
   if(!raw.has(archive_sha256)){
    await persist({kind:'frontier-raw-exchange',archive_sha256,exchange:structuredClone(original),delivery:'unconfirmed'});
    raw.set(archive_sha256,original);for(const id of ids)identities.set(id,archive_sha256);
   }
   let probes=0;
   const measured=async prompt=>{
    need(probes<maximum_probes,'probe-budget-exhausted');probes++;
    // Bind rejected full requests to reconstructable bytes, not just a digest.
    await persist({kind:'frontier-projection-attempt',archive_sha256,prompt,prompt_sha256:createHash('sha256').update(prompt).digest('hex'),delivery:'unconfirmed'});
    return measure(prompt);
   };
   if(views.has(archive_sha256)){
    const view=structuredClone(views.get(archive_sha256));
    const prompt=renderCompactPrompt({messages:[...messages,...view.messages,...suffix],tools});
    const count=await measured(prompt);need(Number.isSafeInteger(count)&&count>=0,'measurement');
    return {status:count<=limit?'admitted':'denied',reason:count<=limit?null:'immutable-view-envelope-does-not-fit',archive_sha256,view,prompt,envelope_tokens:count,probes,replayed:true,delivery:'unconfirmed'};
   }
   const attempt=(assistantView,initial_keeps=null)=>admitToolBatch({messages,tools,assistant:assistantView,results:original.results,suffix,limit,initial_keeps,measure:measured,archive:async record=>{
    // Raw outputs already exist in the complete exchange; only link the helper's
    // per-output identities so continuation references can locate those bytes.
    await persist({kind:'frontier-output-archive-link',archive_sha256,tool_call_id:record.call.id,output_sha256:record.sha256,delivery:'unconfirmed'});
   }});
   // Raw reasoning remains immutable evidence. Preserve the original view
   // unless the explicit policy omits it, or the original cannot fit at all.
   const viewAssistant=structuredClone(original.assistant);
   if(omit_reasoning_from_view)delete viewAssistant.reasoning_content;
   let admitted=await attempt(viewAssistant),reasoningViewPolicy=omit_reasoning_from_view?'always-omitted':'original';
   if(admitted.status!=='admitted'&&omit_reasoning_on_denial&&typeof viewAssistant.reasoning_content==='string'&&viewAssistant.reasoning_content.length){
    await persist({kind:'frontier-reasoning-view-fallback',archive_sha256,original_denial_reason:admitted.reason,original_attempts:admitted.attempts,delivery:'unconfirmed'});
    delete viewAssistant.reasoning_content;
    // The complete original view was already measured down to its irreducible
    // output projection. Reuse that projection when removing reasoning, so a
    // fixed probe cap is not spent repeating the same output reductions.
    admitted=await attempt(viewAssistant,admitted.attempts.at(-1).kept_units);reasoningViewPolicy='omitted-after-denial';
   }
   if(admitted.status!=='admitted')return {...admitted,archive_sha256,probes};
   const viewMessages=[viewAssistant,...admitted.outputs.map((o,i)=>({role:'tool',tool_call_id:ids[i],content:stable(o)}))];
   const view={archive_sha256,view_sha256:hash(viewMessages),messages:viewMessages,...(omit_reasoning_on_denial?{reasoning_view_policy:reasoningViewPolicy}:{})};
   await persist({kind:'frontier-stable-view',...structuredClone(view),delivery:'unconfirmed'});
   views.set(archive_sha256,view);
   return {...admitted,archive_sha256,view:structuredClone(view),probes,replayed:false};
  }finally{active=false;}
 }
 function archivedOutput({archive_sha256,tool_call_id,output_sha256}){
  const exchange=raw.get(archive_sha256);need(exchange,'archive-not-found');
  const index=exchange.assistant.tool_calls.findIndex(c=>c.id===tool_call_id);need(index>=0,'archived-call-not-found');
  const result=exchange.results[index];need(hash(result)===output_sha256,'archived-output-digest');
  return structuredClone({call:exchange.assistant.tool_calls[index],result});
 }
 function outputByDigest(digest){
  for(const exchange of raw.values())for(const [i,result] of exchange.results.entries())if(hash(result)===digest)return structuredClone({call:exchange.assistant.tool_calls[i],result});
  throw Error('frontier-views.output-not-found');
 }
 return {admit,archivedOutput,outputByDigest,rawExchange:sha=>raw.has(sha)?structuredClone(raw.get(sha)):null,stableView:sha=>views.has(sha)?structuredClone(views.get(sha)):null};
}
