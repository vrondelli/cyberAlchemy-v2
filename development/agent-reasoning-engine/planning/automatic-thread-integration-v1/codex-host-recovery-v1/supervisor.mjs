import {stateCapsule} from '../recycling-v1/recycling.mjs';
import {openStore, clone, digest, need} from './store.mjs';

const nonempty = s => typeof s === 'string' && s.length > 0;
function validateState(state) {
  stateCapsule({task_id:'validation', checkpoint_ref:'validation', state});
  need(state.pending.every(x => nonempty(x.id) && ['tool','provider'].includes(x.kind)), 'operation-shape');
  const ids = [...state.pending, ...state.completed].map(x => x.id);
  need(ids.every(nonempty) && new Set(ids).size === ids.length, 'duplicate-operation');
}
/** Host adapter is a trusted, explicitly selected boundary. open must be idempotent
 * by handover_id; lookup must report durable evidence, never infer non-execution
 * from a timeout; seal must fence all host dispatch before reporting quiescence.
 * All callbacks receive copies. No arbitrary host error is treated as recycle. */
export async function runRecovery({directory, task_id, state, host, max_recycles = 32, fault = () => {}, signal}) {
  state = clone(state);
  validateState(state);
  need(nonempty(task_id) && nonempty(host?.adapter_id), 'binding-required');
  need(Number.isSafeInteger(max_recycles) && max_recycles >= 0, 'recycle-limit');
  for (const method of ['open','step','lookup','seal']) need(typeof host[method] === 'function', 'host-method:'+method);
  const adapter = Object.fromEntries(['adapter_id','open','step','lookup','seal'].map(k => [k,host[k]]));
  const store = await openStore(directory);
  try {
    const binding = digest({task_id, initial_state:state, adapter_id:adapter.adapter_id, max_recycles});
    let journal = store.load();
    if (journal) need(journal.version === 1 && journal.binding === binding, 'scope-or-policy-drift');
    else journal = {version:1, binding, task_id, state:clone(state), phase:'staging', generation:0,
      context:null, retired:[], recycles:0, operation:null, handover_id:digest({binding,generation:0})};
    const save = label => {store.save(journal); fault(label, clone(journal));};
    const outcome = (status, reason) => ({status, reason, state:clone(journal.state), generation:journal.generation,
      recycles:journal.recycles, phase:journal.phase, retired:clone(journal.retired), authority_effect:'none'});
    const complete = result => {
      need(result.operation_id === journal.operation.operation_id && result.context_id === journal.context.context_id &&
        result.generation === journal.generation && nonempty(result.evidence_ref), 'operation-receipt-binding');
      need(result.status === 'completed', 'completion-required');
      const item = journal.state.pending[0];
      need(item?.id === journal.operation.item.id, 'pending-drift');
      const next = clone(journal.state);
      next.completed.push({...item, result:clone(result.result ?? null), evidence_ref:result.evidence_ref});
      next.evidence_refs.push(result.evidence_ref);
      next.pending.shift();
      validateState(next);
      journal.state = next;
      journal.operation = null;
      journal.phase = 'ready';
      save('completed');
    };
    save('loaded');
    while (true) {
      if (signal?.aborted) return outcome('cancelled','cancelled-before-next-effect');
      if (journal.phase === 'done') return outcome('completed','all-pending-work-complete');
      if (journal.phase === 'executing') {
        const result = await adapter.lookup(clone(journal.operation));
        need(result?.operation_id === journal.operation.operation_id && result.context_id === journal.context.context_id &&
          result.generation === journal.generation && nonempty(result.evidence_ref), 'lookup-binding');
        if (result.status === 'completed') {complete(result); continue;}
        if (result.status === 'recycle' && result.provider_sent === false && result.effects_started === false) {
          journal.operation = null; journal.phase = 'sealing'; save('recycle-stop'); continue;
        }
        if (result.status !== 'not_started') return outcome('reconcile', 'pending-or-unknown-outcome');
        // Only a host-owned proof of non-execution permits the same operation to be tried.
        journal.phase = 'dispatch'; save('reconciled-not-started');
      }
      if (journal.phase === 'sealing') {
        const receipt = await adapter.seal(clone(journal.context));
        need(receipt?.context_id === journal.context.context_id && receipt.generation === journal.generation &&
          nonempty(receipt.evidence_ref), 'seal-binding');
        if (receipt.sealed !== true || receipt.pending !== 0 || receipt.uncertain !== 0)
          return outcome('reconcile','source-not-quiescent');
        need(journal.recycles < max_recycles, 'recycle-limit-reached');
        journal.retired.push({...journal.context, seal_ref:receipt.evidence_ref});
        journal.context = null; journal.generation++; journal.recycles++;
        journal.handover_id = digest({binding, generation:journal.generation, state:journal.state});
        journal.phase = 'staging'; save('sealed');
      }
      if (journal.phase === 'staging') {
        const capsule = stateCapsule({task_id, checkpoint_ref:journal.handover_id, state:journal.state});
        const request = {task_id, handover_id:journal.handover_id, generation:journal.generation, capsule};
        save('before-open');
        const receipt = await adapter.open(clone(request));
        need(receipt?.handover_id === request.handover_id && receipt.generation === request.generation &&
          receipt.capsule_digest === capsule.capsule_digest && receipt.fresh_history === true &&
          receipt.restored === true && nonempty(receipt.evidence_ref) && nonempty(receipt.context_id) &&
          !journal.retired.some(x => x.context_id === receipt.context_id), 'fresh-context-binding');
        fault('after-open',clone(journal));
        journal.context = {context_id:receipt.context_id, generation:receipt.generation, capsule_digest:capsule.capsule_digest};
        journal.phase = 'ready'; save('opened');
      }
      if (journal.phase === 'ready') {
        if (!journal.state.pending.length) {journal.phase = 'done'; save('done'); continue;}
        const item = journal.state.pending[0];
        journal.operation = {operation_id:digest({binding,item_id:item.id,generation:journal.generation}),
          ...journal.context, item:clone(item), state_digest:digest(journal.state)};
        journal.phase = 'dispatch'; save('prepared');
      }
      if (journal.phase === 'dispatch') {
        journal.phase = 'executing'; save('before-step');
        const result = await adapter.step(clone(journal.operation));
        fault('after-step',clone(journal));
        if (result?.status === 'completed') {complete(result); continue;}
        need(result?.operation_id === journal.operation.operation_id && result.context_id === journal.context.context_id &&
          result.generation === journal.generation && nonempty(result.evidence_ref), 'stop-binding');
        if (result.status !== 'recycle' || result.provider_sent !== false || result.effects_started !== false)
          return outcome('reconcile','pending-or-unknown-outcome');
        journal.operation = null; journal.phase = 'sealing'; save('recycle-stop');
        continue;
      }
      need(false, 'invalid-phase');
    }
  } finally {await store.close();}
}
