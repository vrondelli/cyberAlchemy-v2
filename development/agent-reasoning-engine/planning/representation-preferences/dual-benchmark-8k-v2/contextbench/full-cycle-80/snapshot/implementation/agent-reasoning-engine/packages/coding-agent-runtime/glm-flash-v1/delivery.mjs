import {need,hash,stable} from './transport.mjs';

const READS=new Set(['read-file','read-context-evidence','read-inspection-evidence']);
export function validateDeliveryPolicy(value='legacy-v1') {
 need(['legacy-v1','bounded-reads-v1'].includes(value),'delivery-policy-invalid');return value;
}

// Call only after validateCalls has admitted the entire native batch. Deferred
// IDs still receive tool results and consume the normal per-run call allowance.
export function deferredReadIds(calls) {
 let first=false;const deferred=new Set();
 for(const call of calls)if(READS.has(call.name)) {if(first)deferred.add(call.id);else first=true;}
 return deferred;
}
export function deferredReadObservation(call) {
 return {ok:false,deferred:true,reason_codes:['delivery.read-deferred'],output:{call_id:call.id,
  message:'This read was not executed. Request it alone on a later model turn if still needed.'},authority_effect:'none'};
}

export function deliveredIdsInProjection(history,retained) {
 const originals=new Map();
 for(const entry of history)for(const [index,call] of (entry.calls??[]).entries()) {
  if(READS.has(call.name)&&entry.observations?.[index]?.ok===true) {
   const result=entry.messages?.find(message=>message.role==='tool'&&message.tool_call_id===call.id);
   if(result&&result.content===stable(entry.observations[index]))originals.set(call.id,result.content);
  }
 }
 const delivered=new Set();
 for(const entry of retained)for(const message of entry.messages??[])if(message.role==='tool'
  &&originals.has(message.tool_call_id)&&originals.get(message.tool_call_id)===message.content)delivered.add(message.tool_call_id);
 return [...delivered];
}
export function rememberDeliveryProjection(projections,prompt,history,retained) {
 // Shared recycler hashes stable(prompt), including the JSON string framing.
 projections.set(hash(stable(prompt)),deliveredIdsInProjection(history,retained));
}
export function selectedDelivery(projections,dispatch) {
 need(dispatch&&projections.has(dispatch.prompt_digest),'delivery-dispatch-untracked');
 return [...projections.get(dispatch.prompt_digest)];
}

export function projectDeliveryProgress(history,dispatches=[],currentDelivery=[],unknownDelivery=[]) {
 const reads=new Map(),delivered=new Set(),deferred=[];
 for(const [turn,entry] of history.entries()) {
  // Only prior successfully executed calls can be delivery evidence in a turn.
  for(const id of entry.delivered_call_ids??[])if(reads.has(id))delivered.add(id);
  for(const [index,call] of (entry.calls??[]).entries()) {
   const observation=entry.observations?.[index];
   if(!READS.has(call.name))continue;
   if(observation?.deferred===true&&observation.ok===false)deferred.push(call.id);
   if(observation?.ok===true)reads.set(call.id,{call_id:call.id,name:call.name,
    ...(typeof observation.output?.path==='string'?{path:observation.output.path}:{}),
    ...(call.name==='read-inspection-evidence'?{source_call_id:call.arguments.call_id}:{}),
    meaningful_archive:call.name!=='read-file'&&dispatches[turn]?.generation>0
     &&((typeof observation.output?.text==='string'&&observation.output.text.length>0)
      ||(typeof observation.output?.utf8==='string'&&observation.output.utf8.length>0))});
  }
 }
 for(const id of currentDelivery)if(reads.has(id))delivered.add(id);
 const unknown=new Set(unknownDelivery.filter(id=>reads.has(id)&&!delivered.has(id)));
 return {executed_read_call_ids:[...reads.keys()],delivered_call_ids:[...delivered],
  attempted_delivery_call_ids:[...new Set([...delivered,...unknown])],delivery_unknown_call_ids:[...unknown],
  undelivered_call_ids:[...reads.keys()].filter(id=>!delivered.has(id)&&!unknown.has(id)),deferred_call_ids:deferred,
  meaningful_archive_delivery_call_ids:[...reads.values()].filter(read=>read.meaningful_archive&&delivered.has(read.call_id)).map(read=>read.call_id),
  executed_reads:[...reads.values()].map(({meaningful_archive,...read})=>({...read,delivered:delivered.has(read.call_id),delivery_unknown:unknown.has(read.call_id)}))};
}
