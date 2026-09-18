import {Rejected} from './errors.mjs';
import {recoverPayment} from './recover-payment.mjs';
/** Trusted operator worker. Event hints never replace fresh provider verification. */
export async function processEvents({repository,adapters,signal,clock=()=>Math.floor(Date.now()/1000)}){
  const summary={claimed:0,done:0,retried:0,review:[],failed:[]};
  for(let i=0;i<20&&!signal?.aborted;i++){
    const event=await repository('event-claim',{now:clock()});if(!event)break;
    summary.claimed++;let outcome='retry',reason='payment-not-ready';
    try{
      const adapter=adapters[event.provider];
      if(!adapter||adapter.account!==event.account||event.environment!=='sandbox')throw new Rejected('merchant-account-changed');
      let remoteId;
      if(event.provider==='stripe'&&event.resource_kind==='checkout.session'&&['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.event_type))remoteId=event.resource_id;
      else if(event.provider==='mercadopago'&&((event.resource_kind==='payment'&&event.event_type==='payment.notification')||(event.resource_kind==='order'&&event.event_type==='order.notification')))remoteId=event.resource_id;
      else if(event.provider==='paypal'&&event.resource_kind==='capture'&&event.event_type==='PAYMENT.CAPTURE.COMPLETED')remoteId=await adapter.orderForCapture(event.resource_id);
      if(!remoteId){outcome='review';reason='event-policy-review';}
      else{
        const order=await repository('event-find-order',{provider:event.provider,account:event.account,environment:event.environment,remoteId,now:clock()});
        if(!order){
          const orderId=await adapter.localOrderFor(remoteId);
          const owner=await repository('recovery-order',{orderId,now:clock()});
          if(owner.provider!==event.provider||owner.account!==event.account)throw new Rejected('merchant-account-changed');
          if(owner.state==='failed')throw new Rejected('checkout-failed',409);
          const recovered=await recoverPayment({repository,adapters,orderId,remoteId,clock});
          outcome=recovered.status==='paid'?'done':'review';reason=recovered.status==='paid'?'payment-recovered':'late-payment-review';
        }
        else{
          const a=await repository('get',{customer:order.customer,orderId:order.id,now:clock()});
          const paymentId=await adapter.verify(a.remote_id,a.terms,{capture:false});
          if(paymentId){
            const settled=await repository('settle',{customer:order.customer,orderId:a.id,now:clock(),remoteId:a.remote_id,paymentId,amountCents:a.terms.amountCents,currency:a.terms.currency});
            outcome=settled.status==='paid'?'done':'review';reason=settled.status==='paid'?'payment-verified':'late-payment-review';
          }else if(a.status==='paid'){outcome='review';reason='paid-order-state-review';}
        }
      }
    }catch(error){
      if(error instanceof Rejected&&['checkout-attempt-changed','recovery-payment-not-complete'].includes(error.code))reason='checkout-binding-pending';
      else if(error instanceof Rejected&&error.status<500){outcome='review';reason=/^[a-z-]{1,80}$/.test(error.code)?error.code:'event-policy-review';}
      else reason='provider-or-ledger-unavailable';
    }
    try{
      await repository('event-finish',{event,outcome,reason,now:clock()});
      if(outcome==='done')summary.done++;else if(outcome==='retry')summary.retried++;else summary.review.push({provider:event.provider,eventId:event.event_id,reason});
    }catch{summary.failed.push({provider:event.provider,eventId:event.event_id,reason:'event-completion-not-recorded'});}
  }
  return summary;
}
