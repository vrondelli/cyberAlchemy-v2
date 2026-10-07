import {Rejected} from './auth.mjs';
import {keyFor} from './payments.mjs';
import {CreationFailed} from './errors.mjs';
const requireThat=(value,code)=>{if(!value)throw new Rejected(code);};

/** Session-authenticated SDK orchestration. Returned URLs are never payment proof. */
export function createCheckoutService({auth,repository,adapters,origin,quoteBrl,clock=()=>Math.floor(Date.now()/1000)}) {
  const root=new URL(origin);requireThat(root.protocol==='https:'&&root.origin===origin,'https-origin-required');
  const use=async(req,work)=>{
    const identity=await auth.identity(req,{mutation:true});
    // Identity comes only from the shared auth consumer; resource ownership lives in ledger.
    return work(identity.customer);
  };
  const status=a=>a.status==='pending'&&clock()>=a.expires_at?'expired':a.status;
  return {
    async list(req,before){
      const {customer}=await auth.identity(req);
      requireThat(before===undefined||(typeof before==='string'&&/^[a-f0-9]{32}$/.test(before)),'order-id-invalid');
      const page=await repository('list',{customer,now:clock(),before});
      return {next:page.next,orders:page.orders.map(a=>({orderId:a.id,provider:a.provider,amountCents:a.amount,currency:'USD',createdAt:a.created_at,status:status(a)}))};
    },
    restore:(req,orderId)=>use(req,async customer=>{
      requireThat(typeof orderId==='string'&&/^[a-f0-9]{32}$/.test(orderId),'order-id-invalid');
      const a=await repository('get',{customer,now:clock(),orderId});
      requireThat(adapters[a.provider]?.account===a.account,'merchant-account-changed');
      return {input:{provider:a.provider,amountCents:a.amount,...(a.provider==='mercadopago'?{payerEmail:a.terms.payerEmail}: {})},
        requestKey:a.request_key,state:a.status==='paid'?'paid':a.status==='cancelled'?'failed':'pending',ledgerStatus:status(a),
        ...(a.response?{result:{orderId:a.id,...a.response,amountCents:a.terms.amountCents,currency:a.terms.currency,
          usdAmountCents:a.amount,quoteReference:a.terms.reference??null,expiresAt:a.expires_at,earlySupporter:Boolean(a.benefit),mode:'sandbox'}}:{})};
    }),
    create:(req,input)=>use(req,async customer=>{
      requireThat(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).every(k=>['provider','amountCents','requestKey','payerEmail'].includes(k)),'checkout-fields');
      const {provider,amountCents,requestKey,payerEmail}=input;
      requireThat(['stripe','mercadopago','paypal'].includes(provider)&&adapters[provider],'provider-unavailable');
      requireThat(Number.isSafeInteger(amountCents)&&amountCents>=5000&&amountCents<=100000,'amount-invalid');
      requireThat(typeof requestKey==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(requestKey),'request-key-invalid');
      if(provider==='mercadopago')requireThat(typeof payerEmail==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)&&payerEmail.length<=254,'payer-email-required');
      else requireThat(payerEmail===undefined,'unexpected-payer-email');
      const now=clock();const adapter=adapters[provider];
      let attempt=await repository('lookup',{customer,now,requestKey});
      if(attempt){
        if(attempt.provider!==provider||attempt.account!==adapter.account||attempt.amount!==amountCents||attempt.terms.payerEmail!==(payerEmail??null))throw new Rejected('checkout-conflict',409);
      } else {
        let quote={amountCents,currency:'USD'};
        if(provider==='mercadopago'||adapter.currency==='BRL'){
          requireThat(typeof quoteBrl==='function','brl-quote-required');
          quote=await quoteBrl(amountCents);
          requireThat(quote?.currency==='BRL'&&Number.isSafeInteger(quote.amountCents)&&quote.amountCents>0&&quote.amountCents<=100000000&&typeof quote.reference==='string'&&quote.reference.length>0,'brl-quote-invalid');
        }
        attempt=await repository('prepare',{customer,now,requestKey,provider,account:adapter.account,amountCents,
          terms:{...quote,...(provider==='mercadopago'?{providerApi:adapter.api??'payments-v1',...(adapter.api==='orders-v1'?{pixRequestVersion:2,pixExpirationSeconds:1800,pixExpiresAt:now+1800}:{})}:{}),payerEmail:payerEmail??null,returnUrl:origin+'/purchase/return',cancelUrl:origin+'/purchase/cancel'}});
      }
      if(attempt.status!=='pending'||now>=attempt.expires_at)throw new Rejected('checkout-not-pending',409);
      let response=attempt.response;
      if(['preparing','verification-required'].includes(response?.checkoutState)){
        const updated=await adapter.resume(attempt.remote_id,attempt.terms);
        response=await repository('refresh-response',{customer,now:clock(),orderId:attempt.id,remoteId:attempt.remote_id,response:updated});
      }
      if(!response){
        // Stripe requires at least 30 minutes. Refuse ambiguous retry after provider key lifetime.
        requireThat(clock()-attempt.created_at<3600,'checkout-reconciliation-required');
        if(provider==='stripe')requireThat(attempt.expires_at-clock()>=1860,'stripe-session-too-short');
        const claim=await repository('claim',{customer,now:clock(),orderId:attempt.id});
        try {
          response=await adapter.create(attempt.terms,keyFor('create',provider,adapter.account,attempt.id));
        } catch(error) {
          const outcome=await repository('creation-failed',{customer,now:clock(),orderId:attempt.id,
            generation:claim.generation,definite:error instanceof CreationFailed&&error.definite});
          throw new CreationFailed(outcome.definite);
        }
        await repository('bind',{customer,now:clock(),orderId:attempt.id,remoteId:response.remoteId,response,generation:claim.generation});
      }
      const current=await repository('get',{customer,now:clock(),orderId:attempt.id});
      requireThat(current.status==='pending'&&clock()<current.expires_at,'checkout-not-pending');
      response=current.response;
      if(provider==='mercadopago'&&clock()>=Math.min(attempt.terms.pixExpiresAt??attempt.expires_at,attempt.expires_at))response={remoteId:attempt.remote_id??response.remoteId,checkoutState:'expired'};
      return {orderId:attempt.id,...response,amountCents:attempt.terms.amountCents,currency:attempt.terms.currency,usdAmountCents:attempt.amount,
        quoteReference:attempt.terms.reference??null,expiresAt:attempt.expires_at,earlySupporter:Boolean(attempt.benefit),mode:'sandbox'};
    }),
    confirm:(req,orderId)=>use(req,async customer=>{
      requireThat(typeof orderId==='string'&&/^[a-f0-9]{32}$/.test(orderId),'order-id-invalid');
      const a=await repository('get',{customer,now:clock(),orderId});
      const adapter=adapters[a.provider];requireThat(adapter?.account===a.account&&a.remote_id,'checkout-unbound');
      // Only this authenticated action may capture a buyer-approved PayPal order.
      const paymentId=await adapter.verify(a.remote_id,a.terms,{capture:a.status==='pending'&&clock()<a.expires_at,key:keyFor('capture',a.provider,a.account,a.id)});
      if(!paymentId)return {orderId,status:'awaiting-payment'};
      const result=await repository('settle',{customer,now:clock(),orderId,remoteId:a.remote_id,paymentId,amountCents:a.terms.amountCents,currency:a.terms.currency});
      return {orderId,status:result.status};
    }),
    downloadStream:(req,orderId,options)=>use(req,customer=>repository('download-stream',{customer,now:clock(),orderId},options)),
    download:(req,orderId)=>use(req,customer=>repository('download',{customer,now:clock(),orderId})),
  };
}
