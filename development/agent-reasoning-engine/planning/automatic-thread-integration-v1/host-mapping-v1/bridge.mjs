import {handle} from '../continuity-v1/adapter.mjs';
import {digestValue} from '../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/canonical.mjs';
import {createInteractionLearningLifecycle} from '../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs';
import {acquireReasoningStateWriterLock,recoverReasoningStateLedger} from '../../../../../implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs';
const need=(value,reason)=>{if(!value)throw Error(reason);};
const ok=value=>{need(value?.ok,(value?.reason_codes??['ledger-failure']).join(','));return value;};
const nonblank=v=>typeof v==='string'&&v.trim().length>0;
const rpcId=v=>typeof v==='string'&&v.length>0||Number.isSafeInteger(v);
const clone=v=>structuredClone(v);
export function createBridge(binding){
 const config=clone(binding);need(config.mode==='isolated-prototype','isolated-only');
 let pending=null,poisoned=false,closed=false,sequence=0;
 const used=new Set(),receipts=[];
 function current(){
  const lock=ok(acquireReasoningStateWriterLock({path:config.log_path})).lock;let ledger;
  try{
   ledger=ok(recoverReasoningStateLedger({path:config.log_path,ledger_id:'hook:'+digestValue(config)})).ledger;
   const events=ledger.snapshot().filter(e=>e.event_kind==='are-hook');
   const prompt=events.filter(e=>e.content.kind==='prompt').at(-1)?.content;
   need(prompt&&!events.some(e=>e.content.kind==='outcome'&&e.content.turn===prompt.turn),'active-revision-required');
   const projection=events.find(e=>e.content.kind==='projection'&&e.content.turn===prompt.turn)?.content;
   const life=createInteractionLearningLifecycle({ledger,configuration:{enabled:true,participant_ref:config.participant_ref,product_ref:config.product_ref,policy:{mode:'observe',max_inline_bytes:7000}}});
   need(projection&&projection.state_digest===life.inspect().state_digest,'current-projection-required');
   return {...prompt,context_digest:projection.context_digest,state_digest:projection.state_digest};
  }finally{try{ledger?.close();}finally{lock.release();}}
 }
 function ready(){need(!poisoned&&!closed,'reconciliation-required-or-closed');}
 function event(kind,active,extra={}){return {session_id:config.session_id,cwd:config.cwd,transcript_path:config.transcript_path,hook_event_name:kind,turn_id:active.host_turn,revision:active.revision,...extra};}
 function unchanged(active){need(digestValue(current())===digestValue(active),'active-state-changed');}
 function reserve(id){need(rpcId(id)&&!used.has(JSON.stringify(id)),'invalid-or-reused-rpc-id');used.add(JSON.stringify(id));}
 function inject(output,active){
  if(!output.additionalContext)return {status:'no-guidance',model_observed:false};
  need(Buffer.byteLength(output.additionalContext)<=8192,'guidance-overflow');
  let id;do{id='are-inject:'+ ++sequence;}while(used.has(JSON.stringify(id)));
  reserve(id);
  const request={id,method:'thread/inject_items',params:{threadId:config.session_id,items:[{type:'message',role:'developer',content:[{type:'input_text',text:output.additionalContext}]}]}};
  pending={kind:'inject',id,active,context_digest:output.context_digest};
  receipts.push({kind:'injection',status:'proposed',context_digest:output.context_digest,model_observed:false});
  return {status:'injection-proposed',request,model_observed:false};
 }
 return {
  // Caller observes this request before sending it. This module never sends RPCs.
  request(message){
   ready();need(!pending,'rpc-in-flight');need(message?.method==='turn/steer','unsupported-client-method');
   const p=message.params,active=current();
   need(p?.threadId===config.session_id&&p.expectedTurnId===active.host_turn,'steer-scope-mismatch');
   need(Array.isArray(p.input)&&p.input.length===1&&p.input[0].type==='text'&&nonblank(p.input[0].text)&&Buffer.byteLength(p.input[0].text)<=16384,'single-text-input-required');
   need(!p.input[0].text_elements||p.input[0].text_elements.length===0,'text-spans-unsupported');
   reserve(message.id);pending={kind:'steer',id:message.id,active,prompt:p.input[0].text};
   return {status:'awaiting-host-acceptance',request:clone(message),model_observed:false};
  },
  response(message){
   ready();need(pending&&message?.id===pending.id,'uncorrelated-response');
   const p=pending;
   try{
    unchanged(p.active);
    need(Object.hasOwn(message,'result')!==Object.hasOwn(message,'error'),'malformed-response');
    if(Object.hasOwn(message,'error')){pending=null;receipts.push({kind:p.kind,status:'host-rejected',model_observed:false});return {status:'host-rejected',model_observed:false};}
    if(p.kind==='inject'){
     need(message.result&&typeof message.result==='object'&&!Array.isArray(message.result)&&Object.keys(message.result).length===0,'invalid-injection-response');
     pending=null;receipts.push({kind:'injection',status:'host-accepted',context_digest:p.context_digest,model_observed:false});
     return {status:'host-accepted',model_observed:false};
    }
    need(message.result?.turnId===p.active.host_turn,'accepted-turn-mismatch');
    const output=handle(config,event('Steer',p.active,{revision:p.active.revision+1,prompt:p.prompt})).continuityOutput;
    pending=null;receipts.push({kind:'steer',status:'host-accepted',revision:output.revision,model_observed:false});
    return inject(output,current());
   }catch(error){poisoned=true;throw error;}
  },
  notification(message){
   ready();
   const p=message?.params;
   const compact=message?.method==='item/completed'&&p?.item?.type==='contextCompaction';
   const complete=message?.method==='turn/completed';
   if(!compact&&!complete)return {status:'ignored'};
   need(p.threadId===config.session_id,'notification-scope-mismatch');
   if(pending){poisoned=true;throw Error('event-raced-pending-rpc-reconciliation-required');}
   const active=current();need((compact?p.turnId:p.turn?.id)===active.host_turn,'notification-turn-mismatch');
   if(compact){
    need(nonblank(p.item.id)&&Number.isFinite(p.completedAtMs),'invalid-compaction-item');
    try{
     const output=handle(config,event('ContextRestore',active,{compaction_id:p.item.id,request_digest:active.request_digest,context_digest:active.context_digest})).continuityOutput;
     return inject(output,current());
    }catch(error){poisoned=true;throw error;}
   }
   need(['completed','interrupted','failed'].includes(p.turn.status),'invalid-terminal-status');
   const text=(p.turn.items??[]).filter(i=>i.type==='agentMessage').map(i=>i.text).filter(t=>typeof t==='string').join('\n');
   try{handle(config,event(p.turn.status==='completed'?'Stop':'Interrupt',active,{stop_hook_active:false,last_assistant_message:text||null}));closed=true;return {status:'closed',host_status:p.turn.status};}
   catch(error){poisoned=true;throw error;}
  },
  inspect(){return clone({pending:pending?{kind:pending.kind,id:pending.id}:null,poisoned,closed,receipts,model_observed:false});}
 };
}
