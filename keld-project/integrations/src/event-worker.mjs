import {Rejected} from './errors.mjs';
import {recoverPayment} from './recover-payment.mjs';
/** Trusted operator worker. Event hints never replace fresh provider verification. */
export async function processEvents({repository,adapters,signal,clock=()=>Math.floor(Date.now()/1000)}){
  const summary={claimed:0,done:0,retried:0,review:[],failed:[]};
  for(let i=0;i<20&&!signal?.aborted;i++){
    const event=await repository('event-claim',{now:clock()});if(!event)break;
    summary.claimed++;let outcome='retry',reason='payment-not-ready',finished=false;
    try{
      const adapter=adapters[event.provider];
      if(!adapter||adapter.account!==event.account||event.environment!=='sandbox')throw new Rejected('merchant-account-changed');
      let remoteId;
      if(event.provider==='stripe'&&event.resource_kind==='dispute'&&event.event_type==='charge.dispute.closed'){
        const paymentId=await adapter.paymentForDispute(event.resource_id);
        const order=await repository('event-find-payment-order',{provider:event.provider,account:event.account,
          environment:event.environment,paymentId,now:clock()});
        if(!order){outcome='review';reason='dispute-payment-not-recorded';}
        else{
          const owned=await repository('get',{customer:order.customer,orderId:order.id,now:clock()});
          if(owned.remote_id!==order.remoteId)throw new Rejected('event-payment-mismatch');
          const state=await adapter.inspectLostDispute(owned.remote_id,owned.terms,paymentId,event.resource_id);
          if(state.kind!=='lost-dispute'||state.provider!=='stripe'||state.providerRef!==event.resource_id)
            throw new Rejected('stripe-dispute-proof-invalid');
          const recorded=await repository('event-record-reversal',{event,proof:{orderId:order.id,remoteId:owned.remote_id,
            paymentId,providerRef:state.providerRef,kind:'lost-dispute'},now:clock()});
          outcome=recorded.state;reason='verified-lost-dispute';finished=true;
        }
      }
      else if(event.provider==='paypal'&&event.resource_kind==='refund'&&
        event.event_type==='PAYMENT.CAPTURE.REFUNDED'){
        const paymentId=await adapter.captureForKnownRefund(event.resource_id);
        if(!paymentId){outcome='review';reason='refund-capture-link-unresolved';}
        else{
          const order=await repository('event-find-payment-order',{provider:event.provider,account:event.account,
            environment:event.environment,paymentId,now:clock()});
          if(!order){outcome='review';reason='refund-payment-not-recorded';}
          else{
            const owned=await repository('get',{customer:order.customer,orderId:order.id,now:clock()});
            if(owned.remote_id!==order.remoteId)throw new Rejected('event-payment-mismatch');
            const state=await adapter.inspectKnownRefund(owned.remote_id,owned.terms,paymentId,event.resource_id);
            if(['full-refund','partial-refund'].includes(state.kind)&&state.provider==='paypal'&&
               state.providerRef===event.resource_id){
              const recorded=await repository('event-record-reversal',{event,proof:{orderId:order.id,
                remoteId:owned.remote_id,paymentId,providerRef:state.providerRef,kind:state.kind},now:clock()});
              outcome=recorded.state;reason=state.kind==='full-refund'?'verified-full-refund':'partial-refund-review';finished=true;
            }else{outcome='review';reason=state.reason??'refund-not-final';}
          }
        }
      }
      else if(event.provider==='stripe'&&event.resource_kind==='refund'&&['refund.created','refund.updated'].includes(event.event_type)){
        const paymentId=await adapter.paymentForRefund(event.resource_id);
        const order=await repository('event-find-payment-order',{provider:event.provider,account:event.account,
          environment:event.environment,paymentId,now:clock()});
        if(!order){outcome='review';reason='refund-payment-not-recorded';}
        else{
          const owned=await repository('get',{customer:order.customer,orderId:order.id,now:clock()});
          if(owned.remote_id!==order.remoteId)throw new Rejected('event-payment-mismatch');
          const state=await adapter.inspectRefund(owned.remote_id,owned.terms,paymentId,event.resource_id);
          if(['full-refund','partial-refund'].includes(state.kind)&&state.providerRef===event.resource_id){
            const recorded=await repository('event-record-reversal',{event,proof:{orderId:order.id,remoteId:owned.remote_id,
              paymentId,providerRef:state.providerRef,kind:state.kind},now:clock()});
            outcome=recorded.state;reason=state.kind==='full-refund'?'verified-full-refund':'partial-refund-review';finished=true;
          }else if(state.kind==='review'&&state.reason==='refund-pending'&&event.attempts<8){
            outcome='retry';reason='refund-pending';
          }else{outcome='review';reason=state.reason??'refund-not-final';}
        }
      }
      else if(event.provider==='stripe'&&event.resource_kind==='checkout.session'&&['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.event_type))remoteId=event.resource_id;
      else if(event.provider==='mercadopago'&&((event.resource_kind==='payment'&&event.event_type==='payment.notification')||(event.resource_kind==='order'&&event.event_type==='order.notification')))remoteId=event.resource_id;
      else if(event.provider==='paypal'&&event.resource_kind==='capture'&&event.event_type==='PAYMENT.CAPTURE.COMPLETED')remoteId=await adapter.orderForCapture(event.resource_id);
      if(!finished&&remoteId){
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
          if(event.provider==='mercadopago'&&event.resource_kind==='order'&&
            event.event_type==='order.notification'&&['paid','paid-review'].includes(a.status)&&
            a.terms.providerApi==='orders-v1'){
            if(typeof adapter.inspectRecordedRefund!=='function')throw new Rejected('orders-refund-proof-unavailable');
            const state=await adapter.inspectRecordedRefund(a.remote_id,a.terms);
            if(state.kind==='full-refund'&&state.provider==='mercadopago'&&
               state.providerRef?.startsWith(state.paymentId+':')){
              const recorded=await repository('event-record-reversal',{event,proof:{orderId:a.id,
                remoteId:a.remote_id,paymentId:state.paymentId,providerRef:state.providerRef,
                kind:'full-refund'},now:clock()});
              outcome=recorded.state;reason='verified-full-refund';finished=true;
            }else if(state.kind==='unrefunded'){
              outcome='done';reason='payment-already-recorded';
            }else{outcome='review';reason=state.reason??'orders-refund-not-final';}
          }
          else if(event.provider==='mercadopago'&&event.resource_kind==='payment'&&
            event.event_type==='payment.notification'&&['paid','paid-review'].includes(a.status)&&
            a.terms.providerApi!=='orders-v1'){
            const state=await adapter.inspectRefund(a.remote_id,a.terms,event.resource_id);
            if(['full-refund','partial-refund'].includes(state.kind)&&state.providerRef?.startsWith(event.resource_id+':')){
              const recorded=await repository('event-record-reversal',{event,proof:{orderId:a.id,remoteId:a.remote_id,
                paymentId:event.resource_id,providerRef:state.providerRef,kind:state.kind},now:clock()});
              outcome=recorded.state;reason=state.kind==='full-refund'?'verified-full-refund':'partial-refund-review';finished=true;
            }else if(state.kind==='unrefunded'){outcome='done';reason='payment-already-recorded';}
            else{outcome='review';reason=state.reason??'refund-not-final';}
          }else{
            const paymentId=await adapter.verify(a.remote_id,a.terms,{capture:false});
            if(paymentId){
              const settled=await repository('settle',{customer:order.customer,orderId:a.id,now:clock(),remoteId:a.remote_id,paymentId,amountCents:a.terms.amountCents,currency:a.terms.currency});
              outcome=settled.status==='paid'?'done':'review';reason=settled.status==='paid'?'payment-verified':'late-payment-review';
            }else if(a.status==='paid'){outcome='review';reason='paid-order-state-review';}
          }
        }
      }else if(!finished&&outcome==='retry'&&reason==='payment-not-ready'){
        outcome='review';reason='event-policy-review';
      }
    }catch(error){
      if(error instanceof Rejected&&['checkout-attempt-changed','recovery-payment-not-complete'].includes(error.code))reason='checkout-binding-pending';
      else if(error instanceof Rejected&&error.status<500){outcome='review';reason=/^[a-z-]{1,80}$/.test(error.code)?error.code:'event-policy-review';}
      else reason='provider-or-ledger-unavailable';
    }
    try{
      if(!finished)await repository('event-finish',{event,outcome,reason,now:clock()});
      if(outcome==='done')summary.done++;else if(outcome==='retry')summary.retried++;else summary.review.push({provider:event.provider,eventId:event.event_id,reason});
    }catch{summary.failed.push({provider:event.provider,eventId:event.event_id,reason:'event-completion-not-recorded'});}
  }
  return summary;
}
