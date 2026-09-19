import {Rejected} from './errors.mjs';
/** Operator-supplied lookup hint; fresh SDK proof is mandatory before binding. */
export async function recoverPayment({repository,adapters,orderId,remoteId,clock=()=>Math.floor(Date.now()/1000)}){
  if(typeof orderId!=='string'||!/^[a-f0-9]{32}$/.test(orderId)||typeof remoteId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(remoteId))throw new Rejected('recovery-input-invalid');
  const owner=await repository('recovery-order',{orderId,now:clock()});
  const adapter=adapters[owner.provider];
  if(!adapter||adapter.account!==owner.account)throw new Rejected('merchant-account-changed');
  if(!['uncertain','inflight','bound'].includes(owner.state)||owner.state==='inflight'&&owner.lease_until>clock())throw new Rejected('checkout-attempt-changed',409);
  const a=await repository('get',{customer:owner.customer,orderId,now:clock()});
  if(a.remote_id&&a.remote_id!==remoteId)throw new Rejected('checkout-conflict',409);
  const paymentId=await adapter.verify(remoteId,a.terms,{capture:false});
  if(!paymentId)throw new Rejected('recovery-payment-not-complete',409);
  await repository('recovery-bind',{customer:owner.customer,orderId,remoteId,paymentId,generation:owner.generation,now:clock()});
  const settled=await repository('settle',{customer:owner.customer,orderId,remoteId,paymentId,amountCents:a.terms.amountCents,currency:a.terms.currency,now:clock()});
  return {orderId,status:settled.status};
}
