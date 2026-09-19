import {bindOrdersAdapter, ORDERS_API} from './mercadopago-orders.mjs';
import Stripe from 'stripe';
import {MercadoPagoConfig, Payment, Order, User} from 'mercadopago';
import {Client, Environment, OrdersController, PaymentsController} from '@paypal/paypal-server-sdk';
import {createHash} from 'node:crypto';
import {Rejected} from './auth.mjs';
import {createAtProvider,CreationFailed} from './errors.mjs';

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
  const stripe=new Stripe(config.stripe.secret,{timeout:10000,maxNetworkRetries:0,httpClient:Stripe.createFetchHttpClient()});
  const mp=new Payment(new MercadoPagoConfig({accessToken:config.mercadopago.accessToken,options:{timeout:10000,maxRetries:0}}));
  const paypal=new Client({environment:Environment.Sandbox,timeout:10000,
    clientCredentialsAuthCredentials:{oAuthClientId:config.paypal.clientId,oAuthClientSecret:config.paypal.secret},
    httpClientOptions:{retryConfig:{maxNumberOfRetries:0}}});
  const mpConfig=new MercadoPagoConfig({accessToken:config.mercadopago.accessToken,options:{timeout:10000,maxRetries:0}});
  const adapters=bindPaymentAdapters({stripe,mp,orders:new OrdersController(paypal),captures:new PaymentsController(paypal)},config);
  if(config.mercadopago.api===ORDERS_API){
    const legacy=adapters.mercadopago,modern=bindOrdersAdapter({orders:new Order(mpConfig),user:new User(mpConfig)},config.mercadopago);
    adapters.mercadopago={...modern,localOrderFor:id=>id.startsWith('ORD')?modern.localOrderFor(id):legacy.localOrderFor(id)};
    const selected=t=>{requireThat(['payments-v1',ORDERS_API].includes(t.providerApi??'payments-v1'),'unsupported-api');return t.providerApi===ORDERS_API?modern:legacy;};
    for(const method of ['resume','verify'])adapters.mercadopago[method]=(id,t,...rest)=>selected(t)[method](id,t,...rest);
    adapters.mercadopago.discover=(t,interval)=>selected(t).discover(t,interval);
  }
  return adapters;
}

export function bindPaymentAdapters({stripe,mp,orders,captures},config) {
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
  return {
    stripe:{
      account:config.stripe.account,
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
      }
    },
    mercadopago:{
      account:config.mercadopago.account,
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
      }
    },
    paypal:{
      account:config.paypal.account,
      async localOrderFor(id){
        const {result:p}=await orders.getOrder({id:remoteId(id)});
        requireThat(p.id===id&&p.purchaseUnits?.length===1&&p.purchaseUnits[0].payee?.merchantId===config.paypal.account,'merchant-mismatch');return remoteId(p.purchaseUnits[0].referenceId);
      },
      async resume(id,t){
        const {result:p}=await orders.getOrder({id:remoteId(id)});paypalTerms(p,t);requireThat(p.id===id,'provider-id-mismatch');
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
        let {result:p}=await orders.getOrder({id});let u=paypalTerms(p,t);requireThat(p.id===id,'provider-id-mismatch');
        if(p.status==='APPROVED'&&capture){({result:p}=await orders.captureOrder({id,paypalRequestId:key,prefer:'return=representation'}));u=paypalTerms(p,t);requireThat(p.id===id,'provider-id-mismatch');}
        if(p.status!=='COMPLETED')return null;
        const cs=u.payments?.captures;requireThat(cs?.length===1&&cs[0].finalCapture===true,'paypal-capture-count');
        const {result:c}=await captures.getCapturedPayment({captureId:remoteId(cs[0].id)});
        requireThat(c.id===cs[0].id&&c.status==='COMPLETED'&&c.amount?.currencyCode===t.currency&&cents(c.amount.value)===t.amountCents&&c.supplementaryData?.relatedIds?.orderId===id,'paypal-capture-invalid');
        return remoteId(c.id);
      }
    }
  };
}
