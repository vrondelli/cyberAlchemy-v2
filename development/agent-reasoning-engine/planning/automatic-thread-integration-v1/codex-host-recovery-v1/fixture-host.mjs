import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {durable, clone, need} from './store.mjs';
export const fixtureState = () => ({objective:'Complete six isolated operations', constraints:['No deployment','Preserve user-selected format'],
  completed:[],pending:Array.from({length:6},(_,i)=>({id:`work-${i}`,kind:i%2?'tool':'provider',input:`item-${i}`})),
  facts:['Schema v1'],lessons:['Show concise graphs'],evidence_refs:['fixture:input']});
// Durable mock host has a transactional local effect ledger. This models a host
// with reliable lookup; it is not proof of exactly-once arbitrary external tools.
export function fixtureHost(directory, options = {}) {
  const file = join(directory,'host.json');
  const load = () => existsSync(file) ? JSON.parse(readFileSync(file,'utf8')) : {contexts:{}, operations:{}, effects:[], opens:0};
  const save = value => durable(file,value);
  return {
    adapter_id:'durable-offline-host/v1',
    async open(request) {
      const db=load();
      if (!db.contexts[request.handover_id]) {
        const receipt={handover_id:request.handover_id, generation:request.generation, capsule_digest:request.capsule.capsule_digest,
          fresh_history:true,restored:true,context_id:`fixture-context-${db.opens++}`,evidence_ref:'fixture:open'};
        db.contexts[request.handover_id]={receipt,capsule:request.capsule,sealed:false,steps:0};save(db);
      }
      return clone(db.contexts[request.handover_id].receipt);
    },
    async step(operation) {
      const db=load();
      if(db.operations[operation.operation_id]) return clone(db.operations[operation.operation_id]);
      const context=Object.values(db.contexts).find(c=>c.receipt.context_id===operation.context_id);
      need(context && !context.sealed && context.receipt.generation===operation.generation,'fixture-stale-context');
      const receipt={operation_id:operation.operation_id,context_id:operation.context_id,generation:operation.generation,evidence_ref:'fixture:'+operation.operation_id};
      if(context.steps>=2) Object.assign(receipt,{status:'recycle',provider_sent:false,effects_started:false});
      else {Object.assign(receipt,{status:'completed',result:operation.item.input});context.steps++;db.effects.push(operation.item.id);}
      db.operations[operation.operation_id]=receipt;save(db);return clone(receipt);
    },
    async lookup(operation) {
      const db=load();
      return clone(db.operations[operation.operation_id] ?? {...operation,status:options.unknown?'unknown':'not_started',evidence_ref:'fixture:durable-lookup'});
    },
    async seal(context) {
      const db=load(); const old=Object.values(db.contexts).find(c=>c.receipt.context_id===context.context_id);
      need(old,'fixture-source-missing'); old.sealed=true;save(db);
      return {...context,sealed:true,pending:options.pending??0,uncertain:options.uncertain??0,evidence_ref:'fixture:sealed'};
    },
    snapshot:load
  };
}
