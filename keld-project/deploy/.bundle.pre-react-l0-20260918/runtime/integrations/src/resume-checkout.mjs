import {Rejected} from './errors.mjs';
/** Recover an existing payable checkout, without creating or capturing payment. */
export async function resumeCheckout({repository,adapters,orderId,remoteId,clock=()=>Math.floor(Date.now()/1000)}){
  if(typeof orderId!=='string'||!/^[a-f0-9]{32}$/.test(orderId)||typeof remoteId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(remoteId))throw new Rejected('recovery-input-invalid');
  const owner=await repository('recovery-order',{orderId,now:clock()}),adapter=adapters[owner.provider];
  if(!adapter||adapter.account!==owner.account)throw new Rejected('merchant-account-changed');
  if(!['uncertain','inflight','bound'].includes(owner.state)||owner.state==='inflight'&&owner.lease_until>clock())throw new Rejected('checkout-attempt-changed',409);
  const a=await repository('get',{customer:owner.customer,orderId,now:clock()});
  if(a.status!=='pending'||clock()>=a.expires_at)throw new Rejected('checkout-not-pending',409);
  if(a.remote_id&&a.remote_id!==remoteId)throw new Rejected('checkout-conflict',409);
  const response=await adapter.resume(remoteId,a.terms);
  if(response.remoteId!==remoteId)throw new Rejected('provider-id-mismatch');
  if(owner.state==='bound'){
    await repository('refresh-response',{customer:owner.customer,orderId,remoteId,response,now:clock()});
    return {orderId,status:'pending',resumed:true};
  }
  await repository('resume-bind',{customer:owner.customer,orderId,remoteId,response,generation:owner.generation,now:clock()});
  return {orderId,status:'pending',resumed:true};
}
