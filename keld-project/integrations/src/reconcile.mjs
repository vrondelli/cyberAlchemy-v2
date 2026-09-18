import {Rejected} from './errors.mjs';
/** Operator-only batch. No checkout creation, PayPal capture or refund issuance. */
export async function reconcileBatch({repository,adapters,after,signal,clock=()=>Math.floor(Date.now()/1000)}){
  if(after!==undefined&&(typeof after!=='string'||!/^[a-f0-9]{32}$/.test(after)))throw new Rejected('order-id-invalid');
  const page=await repository('reconcile-scan',{after,now:clock()});
  const result={checked:0,paid:0,review:0,pending:0,failed:[],next:page.next};
  for(const row of page.orders){
    if(signal?.aborted)break;
    result.checked++;
    try{
      const adapter=adapters[row.provider];
      if(!adapter||adapter.account!==row.account)throw new Rejected('merchant-account-changed');
      const a=await repository('get',{customer:row.customer,orderId:row.id,now:clock()});
      const paymentId=await adapter.verify(a.remote_id,a.terms,{capture:false});
      if(!paymentId){result.pending++;continue;}
      const paid=await repository('settle',{customer:row.customer,orderId:a.id,now:clock(),remoteId:a.remote_id,paymentId,amountCents:a.terms.amountCents,currency:a.terms.currency});
      if(paid.status==='paid')result.paid++;else result.review++;
    }catch(error){
      const code=error instanceof Rejected&&/^[a-z-]{1,80}$/.test(error.code)?error.code:'provider-or-ledger-unavailable';
      result.failed.push({orderId:row.id,code});
    }
  }
  return result;
}
