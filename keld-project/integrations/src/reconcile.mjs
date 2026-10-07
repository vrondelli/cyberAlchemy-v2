import {Rejected} from './errors.mjs';
/** Operator-only batch. No checkout creation, PayPal capture or refund issuance. */
export async function reconcileBatch({repository,adapters,signal,clock=()=>Math.floor(Date.now()/1000),limit=20}){
  if(!Number.isInteger(limit)||limit<1||limit>20)throw new Rejected('reconciliation-limit-invalid');
  const result={claimed:0,checked:0,paid:0,review:0,pending:0,retried:0,failed:[]};
  for(let i=0;i<limit&&!signal?.aborted;i++){
    const now=clock();
    const row=await repository('reconcile-claim',{now});
    if(!row)break;
    result.claimed++;result.checked++;
    let outcome='retry',reason='payment-not-ready';
    try{
      const adapter=adapters[row.provider];
      if(!adapter||adapter.account!==row.account)throw new Rejected('merchant-account-changed');
      const attempt=await repository('get',{customer:row.customer,orderId:row.id,now});
      const paymentId=await adapter.verify(attempt.remote_id,attempt.terms,{capture:false});
      if(!paymentId){
        result.pending++;
        if(now>=attempt.expires_at){outcome='review';reason='payment-not-complete-after-expiry';}
      }else{
        const paid=await repository('settle',{customer:row.customer,orderId:attempt.id,now,remoteId:attempt.remote_id,paymentId,amountCents:attempt.terms.amountCents,currency:attempt.terms.currency});
        outcome=paid.status==='paid'?'done':'review';reason=paid.status==='paid'?'payment-verified':'late-payment-review';
        if(outcome==='done')result.paid++;
      }
    }catch(error){
      const code=error instanceof Rejected&&/^[a-z-]{1,80}$/.test(error.code)?error.code:'provider-or-ledger-unavailable';
      reason=code;
      if(error instanceof Rejected&&error.status<500)outcome='review';
      result.failed.push({orderId:row.id,code});
    }
    try{
      const finish=await repository('reconcile-finish',{work:{orderId:row.id,generation:row.generation},outcome,reason,now:clock()});
      if(finish.state==='review')result.review++;
      else if(finish.state==='queued')result.retried++;
    }catch{
      result.failed.push({orderId:row.id,code:'reconciliation-completion-not-recorded'});
    }
  }
  return result;
}
