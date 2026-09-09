import assert from 'node:assert/strict';
import {startDecisionService} from '../codex-host-policy-v1/decision-service.mjs';
import {nativeDriver} from './driver-client.mjs';

export function durableNativeHost(options) {
 const contexts=new Map(), handovers=new Map(), peers=[];
 let nextFault=options.fault??null;
 const client=nativeDriver({...options,async classify({operation,stopped,provider_calls}){
  const context=contexts.get(operation.context_id);assert.ok(context);
  assert.deepEqual(operation,context.operation);
  const decisions=context.peer.snapshot().slice(context.before);assert.equal(decisions.length,1);assert.equal(decisions[0].kind,'provider');
  const receipt={operation_id:operation.operation_id,context_id:operation.context_id,generation:operation.generation,evidence_ref:`native:${decisions[0].request_digest}`};
  if(stopped){assert.equal(provider_calls,0);assert.equal(decisions[0].action,'recycle');Object.assign(receipt,{status:'recycle',provider_sent:false,effects_started:false});}
  else{assert.equal(provider_calls,1);assert.equal(decisions[0].action,'continue');Object.assign(receipt,{status:'completed',result:'offline-recovery-result'});}
  return receipt;
 }});
 const faultFor=kind=>{const matches=kind==='open'&&nextFault==='after-open'||kind==='step'&&['before-step','after-provider','after-receipt'].includes(nextFault)||kind==='seal'&&nextFault==='after-seal';if(!matches)return null;const f=nextFault;nextFault=null;return f;};
 const host={adapter_id:'durable-source-built-native-host/v1',
  async open(request){
   let context=handovers.get(request.handover_id);
   if(!context){
    const scope=`native-receipts:${request.handover_id}`;
    const peer=await startDecisionService({scope,state_digest:request.capsule.source_state_digest,checkpoint_ref:request.handover_id,maximum_output_tokens:32,
     profiles:{'gpt-5.1':{limit_ref:'synthetic-native-receipt-fixture',measurement_ref:'synthetic-assistant-count',compaction_limit:150000,recycle_at:110000,safety_margin:10000,
      measure_request:({serialized_body})=>60000+30000*JSON.parse(serialized_body).input.filter(x=>x.role==='assistant').length}}});
    peers.push(peer);context={peer,scope,handover_id:request.handover_id};handovers.set(request.handover_id,context);
   }
   const receipt=await client.rpc({kind:'open',request,handover_id:request.handover_id,capsule_text:JSON.stringify(request.capsule),scope:context.scope,policy_endpoint:context.peer.endpoint,fault:faultFor('open')});
   contexts.set(receipt.context_id,context);return receipt;
  },
  async step(operation){
   assert.equal(operation.item.kind,'provider');const context=contexts.get(operation.context_id);assert.ok(context);
   context.operation=structuredClone(operation);context.before=context.peer.snapshot().length;
   return client.rpc({kind:'step',operation,handover_id:context.handover_id,input:operation.item.input,fault:faultFor('step')});
  },
  async lookup(operation){return client.rpc({kind:'lookup',operation});},
  async seal(context){const source=contexts.get(context.context_id);assert.ok(source);return client.rpc({kind:'seal',context,handover_id:source.handover_id,fault:faultFor('seal')});}
 };
 return {host,start:()=>client.start(),exitCode:()=>client.exitCode(),snapshot:()=>peers.map(p=>p.snapshot()),async close(){try{await client.close();}finally{await Promise.all(peers.map(p=>p.close()));}}};
}
