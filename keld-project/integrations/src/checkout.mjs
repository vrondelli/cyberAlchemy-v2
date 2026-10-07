import {Rejected} from './auth.mjs';
import {keyFor} from './payments.mjs';
import {CreationFailed} from './errors.mjs';
const requireThat=(value,code)=>{if(!value)throw new Rejected(code);};

/** Session-authenticated SDK orchestration. Returned URLs are never payment proof. */
export function createCheckoutService({auth,repository,adapters,origin,quoteBrl,clock=()=>Math.floor(Date.now()/1000),automaticReplacement=false}) {
  const root=new URL(origin);requireThat(root.protocol==='https:'&&root.origin===origin,'https-origin-required');
  requireThat(typeof automaticReplacement==='boolean','replacement-config-invalid');
  const use=async(req,work)=>{
    const identity=await auth.identity(req,{mutation:true});
    // Identity comes only from the shared auth consumer; resource ownership lives in ledger.
    return work(identity.customer);
  };
  const status=(a,now=clock())=>a.access_revoked?'revoked':
    a.status==='pending'&&now>=a.expires_at?'expired':a.status;
  const revocationReason=a=>{
    if(!a.access_revoked)return null;
    // The first revocation row is sticky; a later verified lost dispute takes
    // precedence over an earlier full-refund completion in the buyer view.
    if(a.lost_dispute_recorded)return 'lost-dispute';
    return ['full-refund','lost-dispute'].includes(a.revocation_reason)?a.revocation_reason:null;
  };
  // Buyer-facing status is derived from the owned ledger read. An intent is
  // not proof that a refund command ran, and only a verified reversal together
  // with revoked access can be presented as a completed full refund.
  const lateRefundStatus=(a,now)=>{
    if(a.status!=='paid-review'||!a.late_refund_state)return null;
    if(a.access_revoked)return revocationReason(a)==='full-refund'&&a.full_refund_recorded&&a.late_refund_state==='succeeded'
      ?'verified-full-refund':null;
    if(a.late_refund_state==='queued')return 'recorded';
    if(a.late_refund_state==='processing'&&a.late_refund_lease_until>now)return 'checking';
    return 'review-required';
  };
  return {
    async list(req,before){
      const {customer}=await auth.identity(req);
      requireThat(before===undefined||(typeof before==='string'&&/^[a-f0-9]{32}$/.test(before)),'order-id-invalid');
      const page=await repository('list',{customer,now:clock(),before});
      const now=clock();
      return {next:page.next,orders:page.orders.map(a=>{
        const late=lateRefundStatus(a,now);
        const reversal=revocationReason(a);
        return {orderId:a.id,provider:a.provider,amountCents:a.amount,currency:'USD',createdAt:a.created_at,status:status(a,now),
          ...(reversal?{revocationReason:reversal}:{}),
          ...(late?{lateRefundStatus:late}:{})};
      })};
    },
    restore:(req,orderId)=>use(req,async customer=>{
      requireThat(typeof orderId==='string'&&/^[a-f0-9]{32}$/.test(orderId),'order-id-invalid');
      const a=await repository('get',{customer,now:clock(),orderId});
      requireThat(adapters[a.provider]?.account===a.account,'merchant-account-changed');
      const revoked=Boolean(a.access_revoked);
      const response=revoked?{remoteId:a.remote_id,recovered:true}:a.response;
      const now=clock();
      const late=lateRefundStatus(a,now);
      const reversal=revocationReason(a);
      return {input:{provider:a.provider,amountCents:a.amount,...(a.provider==='mercadopago'?{payerEmail:a.terms.payerEmail}: {})},
        requestKey:a.request_key,state:revoked?'revoked':a.status==='paid'?'paid':a.status==='cancelled'?'failed':'pending',ledgerStatus:status(a,now),
        ...(reversal?{revocationReason:reversal}:{}),
        ...(late?{lateRefundStatus:late}:{}),
        ...(a.replaces_order_id?{replacesOrderId:a.replaces_order_id}:{}),
        replacementCheckAvailable:automaticReplacement&&['stripe','mercadopago'].includes(a.provider)&&
          adapters[a.provider]?.account===a.account&&
          typeof adapters[a.provider]?.discover==='function'&&typeof adapters[a.provider]?.terminalUnpaid==='function'&&
          ['pending','expired'].includes(a.status)&&clock()>=a.expires_at&&a.payment_id==null&&
          Boolean(a.remote_id)&&a.creation_state==='bound'&&!a.creation_uncertain,
        ...(response?{result:{orderId:a.id,...response,amountCents:a.terms.amountCents,currency:a.terms.currency,
          usdAmountCents:a.amount,quoteReference:a.terms.reference??null,expiresAt:a.expires_at,earlySupporter:Boolean(a.benefit),mode:'sandbox'}}:{})};
    }),
    lookup:(req,input)=>use(req,async customer=>{
      requireThat(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).length===1&&
        typeof input.requestKey==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(input.requestKey),'lookup-fields');
      return repository('lookup-key-readonly',{customer,now:clock(),requestKey:input.requestKey});
    }),
    create:(req,input)=>use(req,async customer=>{
      requireThat(input&&typeof input==='object'&&!Array.isArray(input)&&Object.keys(input).every(k=>['provider','amountCents','requestKey','payerEmail','replaceOldOrderId'].includes(k)),'checkout-fields');
      const {provider,amountCents,requestKey,payerEmail,replaceOldOrderId}=input;
      requireThat(['stripe','mercadopago','paypal'].includes(provider)&&adapters[provider],'provider-unavailable');
      requireThat(Number.isSafeInteger(amountCents)&&amountCents>=5000&&amountCents<=100000,'amount-invalid');
      requireThat(typeof requestKey==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(requestKey),'request-key-invalid');
      requireThat(replaceOldOrderId===undefined||(typeof replaceOldOrderId==='string'&&/^[a-f0-9]{32}$/.test(replaceOldOrderId)),'order-id-invalid');
      if(replaceOldOrderId!==undefined&&!automaticReplacement)throw new Rejected('replacement-disabled',409);
      if(provider==='mercadopago')requireThat(typeof payerEmail==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)&&payerEmail.length<=254,'payer-email-required');
      else requireThat(payerEmail===undefined,'unexpected-payer-email');
      const now=clock();const adapter=adapters[provider];
      let attempt=await repository('lookup',{customer,now,requestKey});
      if(attempt){
        if((attempt.replaces_order_id??null)!==(replaceOldOrderId??null))throw new Rejected('replacement-link-conflict',409);
        if(attempt.provider!==provider||attempt.account!==adapter.account||attempt.amount!==amountCents||attempt.terms.payerEmail!==(payerEmail??null))throw new Rejected('checkout-conflict',409);
        if(provider==='mercadopago'&&(attempt.terms.providerApi??'payments-v1')!==(adapter.api??'payments-v1'))throw new Rejected('checkout-conflict',409);
      } else {
        const preparation=async()=>{
          let quote={amountCents,currency:'USD'};
          if(provider==='mercadopago'||adapter.currency==='BRL'){
            requireThat(typeof quoteBrl==='function','brl-quote-required');
            quote=await quoteBrl(amountCents);
            requireThat(quote?.currency==='BRL'&&Number.isSafeInteger(quote.amountCents)&&quote.amountCents>0&&quote.amountCents<=100000000&&typeof quote.reference==='string'&&quote.reference.length>0,'brl-quote-invalid');
          }
          const preparedAt=clock();
          return {customer,now:preparedAt,requestKey,provider,account:adapter.account,amountCents,
            terms:{...quote,...(provider==='mercadopago'?{providerApi:adapter.api??'payments-v1',...(adapter.api==='orders-v1'?{pixRequestVersion:2,pixExpirationSeconds:1800,pixExpiresAt:preparedAt+1800}:{})}:{}),payerEmail:payerEmail??null,returnUrl:origin+'/purchase/return',cancelUrl:origin+'/purchase/cancel'}};
        };
        if(replaceOldOrderId===undefined){
          attempt=await repository('prepare',await preparation());
        }else{
          const old=await repository('replacement-candidate',{customer,now:clock(),requestKey});
          const prior=adapters[old?.provider];
          if(!old||old.id!==replaceOldOrderId||old.provider==='paypal'||!prior||prior.account!==old.account||
            typeof prior.discover!=='function'||typeof prior.terminalUnpaid!=='function')throw new Rejected('replacement-review-required',409);
          const discovery=await prior.discover(old.terms,{begin:Math.max(0,old.createdAt-60),end:clock()});
          if(discovery.complete!==true||discovery.total!==1||discovery.ids?.length!==1||discovery.ids[0]!==old.remoteId)throw new Rejected('replacement-review-required',409);
          const finality=await prior.terminalUnpaid(old.remoteId,old.terms);
          const observedAt=clock();
          if(finality.kind!=='terminal-unpaid'||finality.remoteId!==old.remoteId||finality.provider!==old.provider||
            (old.provider==='mercadopago'&&finality.providerApi!==old.terms.providerApi))throw new Rejected('replacement-review-required',409);
          // Any provider read may outlive the initial quote or Pix window.
          attempt=await repository('replace-prepare',{...await preparation(),oldOrderId:old.id,oldAccount:old.account,
            proof:{kind:finality.kind,provider:finality.provider,providerApi:finality.providerApi??null,
              remoteId:finality.remoteId,observedAt,discovery}});
        }
      }
      if(attempt.status!=='pending'||clock()>=attempt.expires_at)throw new Rejected('checkout-not-pending',409);
      let response=attempt.response;
      if(['preparing','verification-required'].includes(response?.checkoutState)){
        const updated=await adapter.resume(attempt.remote_id,attempt.terms);
        response=await repository('refresh-response',{customer,now:clock(),orderId:attempt.id,remoteId:attempt.remote_id,response:updated});
      }
      if(!response&&provider==='mercadopago'&&attempt.terms.providerApi==='orders-v1'&&
        (attempt.creation_state!=='ready'||attempt.creation_uncertain)){
        // An ambiguous Orders POST has produced two remote resources for one
        // frozen reference in the sandbox. A stable idempotency key is not
        // enough evidence to issue another POST after an uncertain response.
        const owner=await repository('recovery-order',{orderId:attempt.id,now:clock()});
        if(owner.customer!==customer||owner.provider!==provider||owner.account!==adapter.account)throw new Rejected('checkout-reconciliation-required',409);
        if(owner.state==='bound'){
          attempt=await repository('get',{customer,now:clock(),orderId:attempt.id});
          response=attempt.response;
        }else{
          if(!['uncertain','inflight'].includes(owner.state))throw new Rejected('checkout-reconciliation-required',409);
          if(owner.state==='inflight'&&owner.lease_until>clock())throw new Rejected('checkout-in-progress',409);
          if(typeof adapter.discover!=='function')throw new Rejected('checkout-reconciliation-required',409);
          const scan=await adapter.discover(attempt.terms,{begin:Math.max(0,attempt.created_at-60),end:clock()});
          // Empty or incomplete searches may become conclusive later; keep the
          // key retryable for another GET-only check. Multiple IDs need review.
          if(scan.complete!==true||scan.total===0)throw new Rejected('checkout-in-progress',409);
          if(scan.total!==1||scan.ids?.length!==1)throw new Rejected('checkout-reconciliation-required',409);
          const remoteId=scan.ids[0],recovered=await adapter.resume(remoteId,attempt.terms);
          if(recovered.remoteId!==remoteId||recovered.checkoutState==='verification-required')throw new Rejected('checkout-reconciliation-required',409);
          await repository('resume-bind',{customer,now:clock(),orderId:attempt.id,remoteId,response:recovered,generation:owner.generation});
          attempt=await repository('get',{customer,now:clock(),orderId:attempt.id});
          response=attempt.response;
        }
        if(!response)throw new Rejected('checkout-reconciliation-required',409);
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
      if(a.access_revoked)return {orderId,status:'revoked'};
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
