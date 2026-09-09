import {createBridge} from './bridge.mjs';
import {digestValue} from '../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/canonical.mjs';
import {acquireReasoningStateWriterLock,recoverReasoningStateLedger} from '../../../../../implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs';
const need=(v,r)=>{if(!v)throw Error(r);};
const ok=r=>{need(r?.ok,(r?.reason_codes??['journal-error']).join(','));return r;};
export function openTransport({config,journalPath}){
 config=structuredClone(config);need(config.mode==='isolated-prototype','isolated-only');
 need(typeof journalPath==='string'&&journalPath!==config.log_path,'separate-journal-required');
 const binding=digestValue(config);let state,expected;
 function access(fn){
  const lock=ok(acquireReasoningStateWriterLock({path:journalPath})).lock;let ledger;
  try{ledger=ok(recoverReasoningStateLedger({path:journalPath,ledger_id:'transport:'+binding})).ledger;return fn(ledger);}
  finally{try{ledger?.close();}finally{lock.release();}}
 }
 const latest=ledger=>ledger.snapshot().filter(e=>e.event_kind==='are-transport').at(-1)?.content??null;
 access(ledger=>{state=latest(ledger)??{version:1,binding,sequence:0,phase:'idle',bridge:createBridge(config).exportState(),request:null,response:null,output:null};expected=digestValue(state);});
 need(state.version===1&&state.binding===binding,'journal-binding-mismatch');
 createBridge(config,state.bridge);
 function save(next){
  access(ledger=>{
   const found=latest(ledger);need((found?digestValue(found):digestValue({...state,sequence:0}))===expected,'stale-transport-writer');
   next={...structuredClone(next),sequence:state.sequence+1};
   const key='transport:'+next.sequence;
   const entry=ok(ledger.append({event_kind:'are-transport',idempotency_key:key,content:next,provenance_refs:[key]}));
   const epoch=ok(ledger.seal({event_digests:[entry.event.event_digest],consumer_ref:config.participant_ref,request_ref:key}));
   ok(ledger.checkpoint({checkpoint_kind:'manual',epoch:epoch.value,subject_digest:digestValue(next)}));
   state=next;expected=digestValue(state);
  });
 }
 function allowed(...phases){need(phases.includes(state.phase),'phase-'+state.phase+'-requires-reconciliation-or-response');}
 function settle(bridge,output){save({...state,phase:output.request?'prepared':'idle',bridge:bridge.exportState(),request:output.request??null,response:null,output});return structuredClone(output);}
 function apply(method,message){
  const bridge=createBridge(config,state.bridge);
  save({...state,phase:'applying',operation:{method,message}});
  try{return settle(bridge,bridge[method](message));}
  catch(error){save({...state,phase:'blocked',error:error.message});throw error;}
 }
 return {
  queue(request){allowed('idle');const bridge=createBridge(config,state.bridge);const output=bridge.request(request);return settle(bridge,output);},
  notify(message){allowed('idle');return apply('notification',message);},
  async send(writer){
   allowed('prepared');need(typeof writer==='function','writer-required');
   const request=structuredClone(state.request);save({...state,phase:'sent'});
   // Even a synchronous write failure is delivery-unknown. No automatic retry.
   await writer(JSON.stringify(request)+'\n');return {status:'sent-awaiting-response',id:request.id};
  },
  receive(response){allowed('sent');need(response?.id===state.request?.id,'uncorrelated-response');save({...state,phase:'received',response});return {status:'response-recorded'};},
  applyResponse(){allowed('received');return apply('response',state.response);},
  inspect(){return structuredClone({...state,recovery:state.phase==='prepared'?'safe-to-send':state.phase==='sent'?'await-correlated-response':state.phase==='received'?'safe-to-apply-response':['applying','blocked'].includes(state.phase)?'reconciliation-required':'settled',model_observed:false});}
 };
}
