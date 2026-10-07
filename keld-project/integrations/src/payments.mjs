import {bindOrdersAdapter, ORDERS_API} from './mercadopago-orders.mjs';
import Stripe from 'stripe';
import {MercadoPagoConfig, Payment, PaymentRefund, Order, User} from 'mercadopago';
import {Client, Environment, OrdersController, PaymentsController} from '@paypal/paypal-server-sdk';
import {createHash} from 'node:crypto';
import {Rejected} from './auth.mjs';
import {createAtProvider,CreationFailed} from './errors.mjs';
import {stripeRefundState,mercadoPagoRefundState,paypalRefundState,paypalKnownRefundState,paypalRefundCaptureId} from './refund-state.mjs';

const requireThat=(value,code)=>{if(!value)throw new Rejected(code);};
export const keyFor=(...values)=>createHash('sha256').update(JSON.stringify(values)).digest('hex');
export const money=n=>{requireThat(Number.isSafeInteger(n)&&n>0,'amount-invalid');return `${Math.floor(n/100)}.${String(n%100).padStart(2,'0')}`;};
export function cents(value) {
  const s=String(value);requireThat(/^\d+(\.\d{1,2})?$/.test(s),'amount-format');
  const [whole,fraction='']=s.split('.');const n=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  requireThat(Number.isSafeInteger(n)&&n>0,'amount-invalid');return n;
}
const remoteId=id=>{requireThat(typeof id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(id),'provider-id');return id;};
function redirect(value,host) {
  const u=new URL(value);requireThat(u.protocol==='https:'&&u.hostname===host&&!u.username&&!u.password&&!u.port,'checkout-url');return u.href;
}

/** Fixed sandbox endpoints. No production credentials or SDK logging defaults. */
export function createPaymentAdapters(config) {
  requireThat(config.environment==='sandbox','sandbox-required');
  requireThat(['payments-v1','orders-v1'].includes(config.mercadopago.api??'payments-v1'),'unsupported-api');
  requireThat(/^sk_test_/.test(config.stripe.secret),'stripe-test-key-required');
  requireThat((config.mercadopago.api===ORDERS_API?/^APP_USR-/:/^TEST-/).test(config.mercadopago.accessToken),'mercadopago-test-key-required');
  for(const provider of ['stripe','mercadopago','paypal'])requireThat(typeof config[provider].account==='string'&&config[provider].account.length>0,'merchant-account-required');
  const paypalCurrency=config.paypal.currency??'USD';requireThat(['USD','BRL'].includes(paypalCurrency),'paypal-currency-required');
  const stripe=new Stripe(config.stripe.secret,{timeout:10000,maxNetworkRetries:0,httpClient:Stripe.createFetchHttpClient()});
  const mp=new Payment(new MercadoPagoConfig({accessToken:config.mercadopago.accessToken,options:{timeout:10000,maxRetries:0}}));
  const paypal=new Client({environment:Environment.Sandbox,timeout:10000,
    clientCredentialsAuthCredentials:{oAuthClientId:config.paypal.clientId,oAuthClientSecret:config.paypal.secret},
    httpClientOptions:{retryConfig:{maxNumberOfRetries:0}}});
  const mpConfig=new MercadoPagoConfig({accessToken:config.mercadopago.accessToken,options:{timeout:10000,maxRetries:0}});
  const adapters=bindPaymentAdapters({stripe,mp,mpRefunds:new PaymentRefund(mpConfig),
    mpRefundCommands:new PaymentRefund(new MercadoPagoConfig({accessToken:config.mercadopago.accessToken,
      options:{timeout:10000,maxRetries:0}})),
    orders:new OrdersController(paypal),captures:new PaymentsController(paypal)},config);
  if(config.mercadopago.api===ORDERS_API){
    const legacy=adapters.mercadopago,modern=bindOrdersAdapter({orders:new Order(mpConfig),user:new User(mpConfig)},config.mercadopago);
    adapters.mercadopago={...modern,localOrderFor:id=>id.startsWith('ORD')?modern.localOrderFor(id):legacy.localOrderFor(id)};
    const selected=t=>{requireThat(['payments-v1',ORDERS_API].includes(t.providerApi??'payments-v1'),'unsupported-api');return t.providerApi===ORDERS_API?modern:legacy;};
    for(const method of ['resume','verify','terminalUnpaid','inspectRefund'])adapters.mercadopago[method]=(id,t,...rest)=>selected(t)[method](id,t,...rest);
    for(const method of ['refundPaymentId','issueFullRefund'])adapters.mercadopago[method]=(id,t,...rest)=>{
      requireThat((t.providerApi??'payments-v1')==='payments-v1','refund-provider-unsupported');
      return legacy[method](id,t,...rest);
    };
    adapters.mercadopago.discover=(t,interval)=>selected(t).discover(t,interval);
  }
  return adapters;
}

export function bindPaymentAdapters({stripe,mp,mpRefunds,mpRefundCommands,orders,captures},config) {
  const stripeAccount=async()=>requireThat((await stripe.accounts.retrieve()).id===config.stripe.account,'merchant-mismatch');
  function stripeTerms(s,t) {
    requireThat(s.livemode===false&&s.mode==='payment'&&s.client_reference_id===t.orderId&&s.metadata?.release===t.releaseDigest&&s.currency===t.currency.toLowerCase()&&s.amount_total===t.amountCents&&s.amount_subtotal===t.amountCents,'stripe-terms-mismatch');
  }
  function mpTerms(p,t) {
    requireThat(p.live_mode===false&&String(p.collector_id)===config.mercadopago.account&&p.external_reference===t.orderId&&p.metadata?.release===t.releaseDigest&&p.currency_id===t.currency&&cents(p.transaction_amount)===t.amountCents&&p.payment_method_id==='pix','pix-terms-mismatch');
  }
  function paypalTerms(p,t) {
    const u=p.purchaseUnits;
    requireThat(p.intent==='CAPTURE'&&Array.isArray(u)&&u.length===1&&u[0].referenceId===t.orderId&&u[0].customId===t.releaseDigest&&u[0].payee?.merchantId===config.paypal.account&&u[0].amount?.currencyCode===t.currency&&cents(u[0].amount.value)===t.amountCents,'paypal-terms-mismatch');
    return u[0];
  }
  async function getPayPalOrder(id) {
    try {
      const {result}=await orders.getOrder({id:remoteId(id)});
      return result;
    } catch(error) {
      const status=error?.statusCode??error?.status??error?.response?.statusCode??error?.response?.status;
      if(status===404)throw new Rejected('paypal-order-missing');
      throw error;
    }
  }
  return {
    stripe:{
      account:config.stripe.account,
      async terminalUnpaid(id,t){
        await stripeAccount();
        const s=await stripe.checkout.sessions.retrieve(remoteId(id));
        stripeTerms(s,t);
        requireThat(s.id===id&&s.object==='checkout.session','provider-id-mismatch');
        // Current KELD creation enables card only. Stripe documents an expired
        // Checkout Session as unable to process further; complete/unpaid may
        // still be processing. A linked PaymentIntent needs separate review.
        const terminal=s.status==='expired'&&s.payment_status==='unpaid'&&
          s.payment_intent===null&&Array.isArray(s.payment_method_types)&&
          s.payment_method_types.length===1&&s.payment_method_types[0]==='card'&&
          s.expires_at===t.expiresAt;
        return terminal
          ? {kind:'terminal-unpaid',provider:'stripe',remoteId:id}
          : {kind:'unresolved',provider:'stripe',remoteId:id};
      },
      async localOrderFor(id){
        await stripeAccount();const s=await stripe.checkout.sessions.retrieve(remoteId(id));
        requireThat(s.id===id&&s.livemode===false,'provider-id-mismatch');return remoteId(s.client_reference_id);
      },
      async resume(id,t){
        await stripeAccount();const s=await stripe.checkout.sessions.retrieve(remoteId(id));stripeTerms(s,t);
        requireThat(s.id===id,'provider-id-mismatch');
        requireThat(s.status==='open'&&s.payment_status==='unpaid'&&s.expires_at===t.expiresAt,'checkout-not-open');
        return {remoteId:id,checkoutUrl:redirect(s.url,'checkout.stripe.com')};
      },
      async discover(t,{begin,end}){
        requireThat(Number.isSafeInteger(begin)&&Number.isSafeInteger(end)&&begin>=0&&end>=begin&&end-begin<365*86400,'discovery-interval-invalid');
        await stripeAccount();
        const seen=new Set(),ids=[];let after,complete=false,pages=0;
        for(;pages<5;){
          const page=await stripe.checkout.sessions.list({created:{gte:begin,lte:end},limit:20,...(after?{starting_after:after}:{})});
          pages++;
          requireThat(page?.object==='list'&&typeof page.has_more==='boolean'&&Array.isArray(page.data)&&page.data.length<=20&&(!page.has_more||page.data.length>0),'discovery-response-invalid');
          for(const s of page.data){
            requireThat(s?.object==='checkout.session'&&s.livemode===false&&Number.isSafeInteger(s.created)&&s.created>=begin&&s.created<=end,'discovery-response-invalid');
            const id=remoteId(s.id);requireThat(!seen.has(id),'discovery-response-invalid');seen.add(id);
            if(s.client_reference_id===t.orderId)ids.push(id);
          }
          if(!page.has_more){complete=true;break;}
          after=page.data.at(-1).id;
        }
        return {ids,total:complete?ids.length:null,scanned:seen.size,pages,complete,interval:{begin,end}};
      },
      async create(t,key) {
        try {await stripeAccount();} catch {throw new CreationFailed(true);}
        const s=await createAtProvider(()=>stripe.checkout.sessions.create({mode:'payment',payment_method_types:['card'],
          client_reference_id:t.orderId,metadata:{release:t.releaseDigest},expires_at:t.expiresAt,
          success_url:t.returnUrl,cancel_url:t.cancelUrl,automatic_tax:{enabled:false},adaptive_pricing:{enabled:false},
          line_items:[{quantity:1,price_data:{currency:'usd',unit_amount:t.amountCents,product_data:{name:'ARE alpha — sandbox'}}}]},{idempotencyKey:key}));
        stripeTerms(s,t);requireThat(s.status==='open'&&s.expires_at===t.expiresAt,'checkout-not-open');
        return {remoteId:remoteId(s.id),checkoutUrl:redirect(s.url,'checkout.stripe.com')};
      },
      async verify(id,t) {
        await stripeAccount();const s=await stripe.checkout.sessions.retrieve(id);stripeTerms(s,t);
        requireThat(s.id===id,'provider-id-mismatch');
        if(s.status!=='complete'||s.payment_status!=='paid')return null;
        const p=await stripe.paymentIntents.retrieve(remoteId(s.payment_intent),{expand:['latest_charge']});
        const c=p.latest_charge;
        requireThat(p.id===s.payment_intent&&p.livemode===false&&p.status==='succeeded'&&p.amount_received===t.amountCents&&p.amount===t.amountCents&&p.currency===t.currency.toLowerCase()&&c?.payment_intent===p.id&&c.livemode===false&&c.paid===true&&c.captured===true&&c.refunded===false&&c.disputed===false&&c.amount_refunded===0&&c.amount===t.amountCents&&c.currency===t.currency.toLowerCase(),'stripe-capture-invalid');
        return remoteId(p.id);
      },
      async inspectRefund(id,t,paymentId,refundId){
        await stripeAccount();
        const s=await stripe.checkout.sessions.retrieve(remoteId(id));stripeTerms(s,t);
        requireThat(s.id===id&&s.object==='checkout.session'&&s.status==='complete'&&s.payment_status==='paid'&&
          s.payment_intent===paymentId,'stripe-refund-proof-invalid');
        const p=await stripe.paymentIntents.retrieve(remoteId(paymentId),{expand:['latest_charge']});
        const c=p.latest_charge;
        requireThat(c&&typeof c==='object'&&p.amount_received===t.amountCents,'stripe-refund-proof-invalid');
        const refunds=await stripe.refunds.list({payment_intent:paymentId,limit:100});
        return stripeRefundState({payment:p,charge:c,refunds,paymentId,amountCents:t.amountCents,
          currency:t.currency,refundId});
      },
      async refundPaymentId(id,t){
        await stripeAccount();
        const s=await stripe.checkout.sessions.retrieve(remoteId(id));stripeTerms(s,t);
        requireThat(s.id===id&&s.object==='checkout.session'&&s.status==='complete'&&
          s.payment_status==='paid','stripe-refund-proof-invalid');
        return remoteId(s.payment_intent);
      },
      async issueFullRefund(paymentId,t,key){
        requireThat(/^[a-f0-9]{64}$/.test(key)&&Number.isSafeInteger(t.amountCents)&&
          t.amountCents>0&&['USD','BRL'].includes(t.currency),'refund-command-invalid');
        const id=remoteId(paymentId);
        const r=await stripe.refunds.create({payment_intent:id,amount:t.amountCents},
          {idempotencyKey:key});
        requireThat(r.object==='refund'&&r.livemode===false&&r.payment_intent===id&&
          r.amount===t.amountCents&&r.currency===t.currency.toLowerCase()&&
          typeof r.charge==='string','stripe-refund-response-invalid');
        return {providerRef:remoteId(r.id),status:r.status};
      },
      async paymentForRefund(refundId){
        await stripeAccount();
        const r=await stripe.refunds.retrieve(remoteId(refundId));
        requireThat(r.id===refundId&&r.object==='refund'&&r.livemode===false&&
          Number.isSafeInteger(r.amount)&&r.amount>0&&
          typeof r.charge==='string'&&typeof r.currency==='string',
          'stripe-refund-proof-invalid');
        return remoteId(r.payment_intent);
      },
      async paymentForDispute(disputeId){
        await stripeAccount();
        const d=await stripe.disputes.retrieve(remoteId(disputeId));
        requireThat(d.id===disputeId&&d.object==='dispute'&&d.livemode===false&&
          d.status==='lost'&&Number.isSafeInteger(d.amount)&&d.amount>0&&
          typeof d.currency==='string','stripe-dispute-proof-invalid');
        const chargeId=remoteId(d.charge);
        const c=await stripe.charges.retrieve(chargeId);
        requireThat(c.id===chargeId&&c.object==='charge'&&c.livemode===false&&
          c.paid===true&&c.captured===true&&c.status==='succeeded'&&
          Number.isSafeInteger(c.amount)&&c.amount>=d.amount&&c.currency===d.currency,
          'stripe-dispute-proof-invalid');
        const paymentId=remoteId(c.payment_intent);
        requireThat(d.payment_intent==null||d.payment_intent===paymentId,
          'stripe-dispute-proof-invalid');
        return paymentId;
      },
      async inspectLostDispute(id,t,paymentId,disputeId){
        await stripeAccount();
        const s=await stripe.checkout.sessions.retrieve(remoteId(id));stripeTerms(s,t);
        requireThat(s.id===id&&s.object==='checkout.session'&&s.status==='complete'&&
          s.payment_status==='paid'&&s.payment_intent===paymentId,
          'stripe-dispute-proof-invalid');
        const d=await stripe.disputes.retrieve(remoteId(disputeId));
        requireThat(d.id===disputeId&&d.object==='dispute'&&d.livemode===false&&
          d.status==='lost'&&Number.isSafeInteger(d.amount)&&d.amount>0&&
          d.amount<=t.amountCents&&d.currency===t.currency.toLowerCase()&&
          (d.payment_intent==null||d.payment_intent===paymentId),
          'stripe-dispute-proof-invalid');
        const p=await stripe.paymentIntents.retrieve(remoteId(paymentId),{expand:['latest_charge']});
        const c=p.latest_charge;
        requireThat(p.id===paymentId&&p.livemode===false&&p.status==='succeeded'&&
          p.amount===t.amountCents&&p.amount_received===t.amountCents&&
          p.currency===t.currency.toLowerCase()&&c&&typeof c==='object'&&
          c.id===d.charge&&c.payment_intent===paymentId&&c.livemode===false&&
          c.status==='succeeded'&&c.paid===true&&c.captured===true&&
          c.amount===t.amountCents&&c.currency===t.currency.toLowerCase(),
          'stripe-dispute-proof-invalid');
        return {kind:'lost-dispute',provider:'stripe',providerRef:disputeId};
      }
    },
    mercadopago:{
      account:config.mercadopago.account,
      async terminalUnpaid(id,t){
        const p=await mp.get({id:remoteId(id)});
        mpTerms(p,t);
        requireThat(String(p.id)===id,'provider-id-mismatch');
        const terminal=p.status==='cancelled'&&
          ['expired','by_collector','by_payer'].includes(p.status_detail)&&
          Date.parse(p.date_of_expiration)===t.expiresAt*1000&&
          (p.transaction_amount_refunded===0||p.transaction_amount_refunded==='0')&&
          p.date_approved==null;
        return terminal
          ? {kind:'terminal-unpaid',provider:'mercadopago',providerApi:'payments-v1',remoteId:id}
          : {kind:'unresolved',provider:'mercadopago',providerApi:'payments-v1',remoteId:id};
      },
      async localOrderFor(id){
        const p=await mp.get({id:remoteId(id)});
        requireThat(String(p.id)===id&&p.live_mode===false&&String(p.collector_id)===config.mercadopago.account,'merchant-mismatch');return remoteId(p.external_reference);
      },
      async resume(id,t){
        const p=await mp.get({id:remoteId(id)});mpTerms(p,t);requireThat(String(p.id)===id,'provider-id-mismatch');
        const qr=p.point_of_interaction?.transaction_data?.qr_code;
        requireThat(p.status==='pending'&&Date.parse(p.date_of_expiration)===t.expiresAt*1000&&typeof qr==='string'&&qr.length>0&&qr.length<=4096,'checkout-not-open');
        return {remoteId:id,pixCode:qr};
      },
      async discover(t,{begin,end}){
        requireThat(Number.isSafeInteger(begin)&&Number.isSafeInteger(end)&&begin>=0&&end>=begin&&end-begin<365*86400,'discovery-interval-invalid');
        const page=await mp.search({options:{external_reference:t.orderId,sort:'date_created',criteria:'asc',range:'date_created',
          begin_date:new Date(begin*1000).toISOString(),end_date:new Date(end*1000).toISOString(),limit:20,offset:0}});
        const p=page?.paging,rows=page?.results;
        requireThat(p&&Number.isSafeInteger(p.total)&&p.total>=0&&p.limit===20&&p.offset===0&&Array.isArray(rows)&&rows.length===Math.min(p.total,20),'discovery-response-invalid');
        const ids=rows.map(row=>{
          requireThat(row?.external_reference===t.orderId&&(typeof row.id==='string'||Number.isSafeInteger(row.id)),'discovery-response-invalid');
          return remoteId(String(row.id));
        });
        requireThat(new Set(ids).size===ids.length,'discovery-response-invalid');
        return {ids,total:p.total,complete:p.total<=20,interval:{begin,end}};
      },
      async create(t,key) {
        requireThat(t.currency==='BRL','pix-requires-brl');
        const p=await createAtProvider(()=>mp.create({body:{transaction_amount:Number(money(t.amountCents)),description:'ARE alpha — sandbox',
          payment_method_id:'pix',payer:{email:t.payerEmail},external_reference:t.orderId,
          metadata:{release:t.releaseDigest},date_of_expiration:new Date(t.expiresAt*1000).toISOString()},requestOptions:{idempotencyKey:key}}));
        mpTerms(p,t);
        const qr=p.point_of_interaction?.transaction_data?.qr_code;
        requireThat(['pending','approved'].includes(p.status)&&typeof qr==='string'&&qr.length>0&&qr.length<=4096,'pix-response-invalid');
        return {remoteId:remoteId(String(p.id)),pixCode:qr};
      },
      async verify(id,t) {
        const p=await mp.get({id});mpTerms(p,t);requireThat(String(p.id)===id,'provider-id-mismatch');
        if(p.status!=='approved')return null;
        requireThat(p.status_detail==='accredited'&&Number(p.transaction_amount_refunded)===0,'pix-payment-invalid');
        return remoteId(String(p.id));
      },
      async inspectRefund(id,t,paymentId){
        requireThat(id===paymentId,'pix-refund-proof-invalid');
        const p=await mp.get({id:remoteId(id)});mpTerms(p,t);
        requireThat(String(p.id)===id,'provider-id-mismatch');
        const refunds=await mpRefunds.list({payment_id:id});
        return mercadoPagoRefundState({payment:p,refunds,paymentId,amountCents:t.amountCents});
      },
      async refundPaymentId(id,t){
        requireThat(t.providerApi!=='orders-v1','refund-provider-unsupported');
        const p=await mp.get({id:remoteId(id)});mpTerms(p,t);
        requireThat(String(p.id)===id,'pix-refund-proof-invalid');
        return remoteId(id);
      },
      async issueFullRefund(paymentId,t,key){
        requireThat(t.providerApi!=='orders-v1'&&t.currency==='BRL'&&
          /^[a-f0-9]{64}$/.test(key)&&Number.isSafeInteger(t.amountCents)&&t.amountCents>0,
          'refund-command-invalid');
        const id=remoteId(paymentId);
        requireThat(/^\d+$/.test(id),'pix-refund-proof-invalid');
        const r=await mpRefundCommands.create({payment_id:id,
          body:{amount:Number(money(t.amountCents))},
          requestOptions:{idempotencyKey:key,maxRetries:0}});
        requireThat(Number.isSafeInteger(r?.id)&&r.id>0&&String(r.payment_id)===id&&
          cents(r.amount)===t.amountCents,'pix-refund-response-invalid');
        return {providerRef:id+':'+r.id,status:r.status};
      }
    },
    paypal:{
      account:config.paypal.account,
      currency:config.paypal.currency??'USD',
      async terminalUnpaid(id,t){
        // Orders CAPTURE exposes no qualified no-later-capture predicate in this
        // integration. Even VOIDED or a 404 needs operator/provider review.
        const p=await getPayPalOrder(id);
        paypalTerms(p,t);
        requireThat(p.id===id,'provider-id-mismatch');
        return {kind:'unresolved',provider:'paypal',remoteId:id};
      },
      async localOrderFor(id){
        const p=await getPayPalOrder(id);
        requireThat(p.id===id&&p.purchaseUnits?.length===1&&p.purchaseUnits[0].payee?.merchantId===config.paypal.account,'merchant-mismatch');return remoteId(p.purchaseUnits[0].referenceId);
      },
      async resume(id,t){
        const p=await getPayPalOrder(id);paypalTerms(p,t);requireThat(p.id===id,'provider-id-mismatch');
        requireThat(['CREATED','PAYER_ACTION_REQUIRED','APPROVED'].includes(p.status),'checkout-not-open');
        if(p.status==='APPROVED')return {remoteId:id,recovered:true};
        return {remoteId:id,checkoutUrl:redirect(p.links?.find(l=>['payer-action','approve'].includes(l.rel))?.href,'www.sandbox.paypal.com')};
      },
      async orderForCapture(id){
        const {result:c}=await captures.getCapturedPayment({captureId:remoteId(id)});
        requireThat(c.id===id,'provider-id-mismatch');
        return remoteId(c.supplementaryData?.relatedIds?.orderId);
      },
      async create(t,key) {
        const {result:p}=await createAtProvider(()=>orders.createOrder({paypalRequestId:key,prefer:'return=representation',body:{intent:'CAPTURE',
          purchaseUnits:[{referenceId:t.orderId,customId:t.releaseDigest,payee:{merchantId:config.paypal.account},amount:{currencyCode:t.currency,value:money(t.amountCents)}}],
          paymentSource:{paypal:{experienceContext:{returnUrl:t.returnUrl,cancelUrl:t.cancelUrl,shippingPreference:'NO_SHIPPING',userAction:'PAY_NOW'}}}}}));
        paypalTerms(p,t);requireThat(['CREATED','PAYER_ACTION_REQUIRED'].includes(p.status),'paypal-not-open');
        const url=p.links?.find(l=>['payer-action','approve'].includes(l.rel))?.href;
        return {remoteId:remoteId(p.id),checkoutUrl:redirect(url,'www.sandbox.paypal.com')};
      },
      async verify(id,t,{capture=false,key}={}) {
        let p=await getPayPalOrder(id);let u=paypalTerms(p,t);requireThat(p.id===id,'provider-id-mismatch');
        if(p.status==='APPROVED'&&capture){({result:p}=await orders.captureOrder({id,paypalRequestId:key,prefer:'return=representation'}));u=paypalTerms(p,t);requireThat(p.id===id,'provider-id-mismatch');}
        if(p.status!=='COMPLETED')return null;
        const cs=u.payments?.captures;requireThat(cs?.length===1&&cs[0].finalCapture===true,'paypal-capture-count');
        const {result:c}=await captures.getCapturedPayment({captureId:remoteId(cs[0].id)});
        requireThat(c.id===cs[0].id&&c.status==='COMPLETED'&&c.amount?.currencyCode===t.currency&&cents(c.amount.value)===t.amountCents&&c.supplementaryData?.relatedIds?.orderId===id,'paypal-capture-invalid');
        return remoteId(c.id);
      },
      async inspectRefund(id,t,paymentId){
        const p=await getPayPalOrder(id);const u=paypalTerms(p,t);
        requireThat(p.id===id&&p.status==='COMPLETED'&&u.payments?.captures?.length===1&&
          u.payments.captures[0].id===paymentId,'paypal-refund-proof-invalid');
        const {result:c}=await captures.getCapturedPayment({captureId:remoteId(paymentId)});
        return paypalRefundState({capture:c,captureId:paymentId,orderId:id,
          amountCents:t.amountCents,currency:t.currency});
      },
      async captureForKnownRefund(refundId){
        const {result:r}=await captures.getRefund({refundId:remoteId(refundId)});
        return paypalRefundCaptureId(r,refundId);
      },
      async inspectKnownRefund(id,t,paymentId,refundId){
        // The signed event is only a refund-ID hint. Three fresh GETs bind its
        // resource to this merchant, one exact capture, and the frozen order.
        const p=await getPayPalOrder(id);const u=paypalTerms(p,t);
        requireThat(p.id===id&&p.status==='COMPLETED'&&u.payments?.captures?.length===1&&
          u.payments.captures[0].id===paymentId&&u.payments.captures[0].finalCapture===true,
          'paypal-refund-proof-invalid');
        const {result:c}=await captures.getCapturedPayment({captureId:remoteId(paymentId)});
        const {result:r}=await captures.getRefund({refundId:remoteId(refundId)});
        return paypalKnownRefundState({refund:r,refundId,capture:c,captureId:paymentId,
          orderId:id,amountCents:t.amountCents,currency:t.currency,
          merchantId:config.paypal.account});
      }
    }
  };
}
