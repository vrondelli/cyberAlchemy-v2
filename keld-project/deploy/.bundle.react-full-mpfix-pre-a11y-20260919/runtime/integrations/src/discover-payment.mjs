import {Rejected} from './errors.mjs';
import {recoverPayment} from './recover-payment.mjs';
/** Bounded discovery never treats absence as permission to create a payment. */
export async function discoverPayment({repository,adapters,orderId,recover=false,clock=()=>Math.floor(Date.now()/1000)}){
  if(typeof orderId!=='string'||!/^[a-f0-9]{32}$/.test(orderId)||typeof recover!=='boolean')throw new Rejected('discovery-input-invalid');
  const now=clock(),owner=await repository('recovery-order',{orderId,now});
  const adapter=adapters[owner.provider];
  if(!adapter||adapter.account!==owner.account)throw new Rejected('merchant-account-changed');
  if(typeof adapter.discover!=='function')throw new Rejected('discovery-provider-unsupported');
  if(owner.state!=='uncertain'&&!(owner.state==='inflight'&&owner.lease_until<=now))throw new Rejected('checkout-attempt-changed',409);
  const a=await repository('get',{customer:owner.customer,orderId,now});
  if(a.remote_id)throw new Rejected('checkout-already-bound',409);
  const scan=await adapter.discover(a.terms,{begin:Math.max(0,a.created_at-300),end:Math.min(now,a.expires_at+300)});
  const report={orderId,provider:owner.provider,...scan};
  if(!scan.complete)return {...report,outcome:'incomplete'};
  if(scan.ids.length===0)return {...report,outcome:'not-observed'};
  if(scan.ids.length>1)return {...report,outcome:'ambiguous'};
  const remoteId=scan.ids[0],paymentId=await adapter.verify(remoteId,a.terms,{capture:false});
  if(!paymentId)return {...report,outcome:'not-paid'};
  if(!recover)return {...report,outcome:'verified-paid'};
  const result=await recoverPayment({repository,adapters,orderId,remoteId,clock});
  return {...report,outcome:'recovered',status:result.status};
}
