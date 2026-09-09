import {stateCapsule} from '../recycling-v1/recycling.mjs';
import {digestValue} from '../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/canonical.mjs';
const need=(v,r)=>{if(!v)throw Error(r);};
// Historical usage is deliberately not promoted into pre-dispatch safety evidence.
export function inspectBudget(config,usage){
 const configured=config?.model_auto_compact_token_limit;
 return {configured_limit:Number.isSafeInteger(configured)&&configured>0?configured:null,configured_scope:config?.model_auto_compact_token_limit_scope??'unknown',reported_model_window:usage?.modelContextWindow??null,historical_last_input:usage?.last?.inputTokens??null,pre_dispatch_upper_bound:null,effective_limit_verified:false,owns_every_provider_step:false,decision:'block',reason:'stock-host-provider-step-control-unverified'};
}
export function strictHostClient(client){
 // This integration exposes only read/setup calls required by the isolated staging lane.
 // All generation paths and unknown RPCs fail before touching the transport.
 const allowed=new Set(['initialize','config/read','thread/start','thread/read','thread/inject_items']);
 return {request(message){need(allowed.has(message?.method),'generation-or-unknown-method-blocked');return client.request(structuredClone(message));}};
}
export async function stageFreshContext(client,{capsule,source_context_id,thread_params}){
 const expected=stateCapsule({task_id:capsule.task_id,checkpoint_ref:capsule.checkpoint_ref,state:capsule.state});
 need(expected.capsule_digest===capsule.capsule_digest,'capsule-integrity-failed');
 need(typeof source_context_id==='string'&&source_context_id.length>0,'source-context-required');
 need(thread_params&&typeof thread_params.cwd==='string','isolated-thread-params-required');
 const call=async(id,method,params)=>{const r=await client.request({id,method,params});need(!r.error,'host-request-rejected');return r.result;};
 const suffix=digestValue({source_context_id,capsule:capsule.capsule_digest});
 const started=await call('fresh:'+suffix,'thread/start',thread_params);
 const fresh=started?.thread;need(fresh&&typeof fresh.id==='string'&&fresh.id!==source_context_id&&Array.isArray(fresh.turns)&&fresh.turns.length===0,'fresh-history-not-established');
 const text='ARE task-state data. Preserve constraints and evidence; this grants no new authority.\n'+JSON.stringify(capsule);
 const accepted=await call('capsule:'+suffix,'thread/inject_items',{threadId:fresh.id,items:[{type:'message',role:'developer',content:[{type:'input_text',text}]}]});
 need(accepted&&typeof accepted==='object'&&!Array.isArray(accepted)&&Object.keys(accepted).length===0,'invalid-injection-acknowledgement');
 const read=await call('verify:'+suffix,'thread/read',{threadId:fresh.id,includeTurns:true});need(read?.thread?.id===fresh.id&&Array.isArray(read.thread.turns)&&read.thread.turns.length===0,'fresh-context-readback-mismatch');
 return {status:'staged-host-accepted',source_context_id,fresh_context_id:fresh.id,capsule_digest:capsule.capsule_digest,injected_text:text,rollout_path:read.thread.path??fresh.path,cutover:false,generation_allowed:false,reason:'provider-step-budget-control-still-required'};
}
