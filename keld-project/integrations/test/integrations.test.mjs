import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import nock from 'nock';
import {bindKeldAuth,createKeldAuth} from '../src/auth.mjs';
import {createPaymentAdapters,money,cents} from '../src/payments.mjs';
import {createCheckoutService} from '../src/checkout.mjs';
import {createRepository} from '../src/repository.mjs';

nock.disableNetConnect();
const origin='https://keld.localhost:17443';
const config={environment:'sandbox',stripe:{secret:'sk_test_fixture',account:'acct_fixture'},mercadopago:{accessToken:'TEST-fixture',account:'123'},paypal:{clientId:'fixture',secret:'fixture-secret',account:'MERCHANT123'}};
const profile={issuer:'https://issuer.localhost/realms/keld',origin,callback:'/auth/callback',client:'keld',audience:'keld',secret:'x'.repeat(32)};
const digest=createHash('sha256').update('ARE sandbox fixture').digest('hex');
const request=(handle='alice',csrf='csrf-alice')=>({headers:{host:'keld.localhost:17443',cookie:'__Host-keld_session='+handle,origin,'x-csrf-token':csrf}});

async function fixture(t,paymentOverrides={}) {
  const root=await mkdtemp(join(tmpdir(),'keld-sdk-test-'));await writeFile(join(root,'fixture.bin'),'ARE sandbox fixture');
  t.after(async()=>{nock.cleanAll();await rm(root,{recursive:true,force:true});});
  const repository=createRepository({database:join(root,'ledger.db'),releaseDigest:digest,delivery:{root,artifacts:[{sha256:digest,bytes:19,relative_path:'fixture.bin'}]}});
  const state={now:1800000000,active:true};
  // This fixture replaces only the external OIDC/PG session runtime, not the KELD consumer.
  const core={async touch(){},async authenticate(handle){if(!state.active||!['alice','bob'].includes(handle))throw Error('revoked');return {subject:handle,csrf:'csrf-'+handle};}};
  const auth=bindKeldAuth(core,profile);
  const adapters=createPaymentAdapters({...config,...paymentOverrides});
  const service=createCheckoutService({auth,repository,adapters,origin,clock:()=>state.now,
    quoteBrl:async amount=>({currency:'BRL',amountCents:amount*5,reference:'fixture-rate-not-for-sale'})});
  return {service,state,repository,auth,adapters,root};
}

test('shared Auth Foundation consumer rejects spoofing, wrong origin, CSRF and revocation',async t=>{
  const {auth,state}=await fixture(t);
  const alice=await auth.identity(request(),{mutation:true});assert.match(alice.customer,/^oidc:[0-9a-f]{64}$/);
  const bob=await auth.identity(request('bob','csrf-bob'),{mutation:true});assert.notEqual(alice.customer,bob.customer);
  for(const headers of [{'x-user-id':'bob'},{origin:'https://attacker.invalid'},{'x-csrf-token':'bad'},{cookie:'__Host-keld_session=alice; __Host-keld_session=bob'}])await assert.rejects(()=>auth.identity({headers:{...request().headers,...headers}},{mutation:true}));
  state.active=false;await assert.rejects(()=>auth.identity(request()));
  // Real package composition creates a dedicated client and never migrates implicitly.
  let migrated=false;const store={migrate(){migrated=true;}};
  const composition=await createKeldAuth({profile,store});assert.equal(composition.core.store,store);assert.equal(migrated,false);
  await assert.rejects(()=>createKeldAuth({profile,store,namespace:'body-war'}));
});

function stripeSession(orderId,extra={}) {return {id:'cs_test_fixture',object:'checkout.session',livemode:false,mode:'payment',client_reference_id:orderId,metadata:{release:digest},currency:'usd',amount_total:20000,amount_subtotal:20000,status:'open',expires_at:1800003600,url:'https://checkout.stripe.com/c/pay/cs_test_fixture',...extra};}
function stripeAccount(){return nock('https://api.stripe.com').get('/v1/account').reply(200,{id:'acct_fixture',object:'account'});}
test('Stripe SDK → durable ledger → exact fixture; replay and cross-buyer denial',async t=>{
  const {service,repository}=await fixture(t);let orderId;
  stripeAccount();const create=nock('https://api.stripe.com').post('/v1/checkout/sessions',body=>{
    const p=new URLSearchParams(typeof body==='string'?body:new URLSearchParams(body));orderId=p.get('client_reference_id');
    assert.equal(p.get('line_items[0][price_data][unit_amount]'),'20000');return true;
  }).matchHeader('idempotency-key',v=>/^[a-f0-9]{64}$/.test(v)).reply(()=>[200,stripeSession(orderId)]);
  const input={provider:'stripe',amountCents:20000,requestKey:'stripe-one'};
  const result=await service.create(request(),input);assert.equal(result.orderId,orderId);assert.ok(create.isDone());
  assert.deepEqual(await service.create(request(),input),result); // No duplicate SDK call.
  await assert.rejects(()=>service.confirm(request('bob','csrf-bob'),orderId));
  stripeAccount();nock('https://api.stripe.com').get('/v1/checkout/sessions/cs_test_fixture').reply(200,stripeSession(orderId,{status:'complete',payment_status:'paid',payment_intent:'pi_fixture'}));
  nock('https://api.stripe.com').get('/v1/payment_intents/pi_fixture').query(true).reply(200,{id:'pi_fixture',livemode:false,status:'succeeded',amount:20000,amount_received:20000,currency:'usd',latest_charge:{id:'ch_fixture',payment_intent:'pi_fixture',livemode:false,paid:true,captured:true,refunded:false,disputed:false,amount_refunded:0,amount:20000,currency:'usd'}});
  assert.equal((await service.confirm(request(),orderId)).status,'paid');
  assert.equal(Buffer.from((await service.download(request(),orderId)).data,'base64').toString(),'ARE sandbox fixture');
  await assert.rejects(()=>service.download(request('bob','csrf-bob'),orderId));
  assert.ok(nock.isDone());
});

test('Stripe terminal-unpaid evidence is card-only and never inferred from an open or processing session',async t=>{
  const {adapters}=await fixture(t);
  const terms={orderId:'a'.repeat(32),releaseDigest:digest,currency:'USD',amountCents:20000,expiresAt:1800003600};
  const cases=[
    [{status:'expired',payment_status:'unpaid',payment_intent:null,payment_method_types:['card']},'terminal-unpaid'],
    [{status:'open',payment_status:'unpaid',payment_intent:null,payment_method_types:['card']},'unresolved'],
    [{status:'complete',payment_status:'unpaid',payment_intent:'pi_pending',payment_method_types:['card']},'unresolved'],
    [{status:'expired',payment_status:'unpaid',payment_intent:'pi_existing',payment_method_types:['card']},'unresolved'],
    [{status:'expired',payment_status:'paid',payment_intent:'pi_paid',payment_method_types:['card']},'unresolved'],
    [{status:'expired',payment_status:'unpaid',payment_intent:null,payment_method_types:['card','link']},'unresolved'],
    [{status:'expired',payment_status:'unpaid',payment_intent:null,payment_method_types:['card'],expires_at:terms.expiresAt+1},'unresolved'],
    [{status:'expired',payment_status:'unpaid',payment_intent:null},'unresolved'],
  ];
  for(const [state,expected] of cases){
    stripeAccount();
    nock('https://api.stripe.com').get('/v1/checkout/sessions/cs_test_fixture').reply(200,stripeSession(terms.orderId,state));
    assert.deepEqual(await adapters.stripe.terminalUnpaid('cs_test_fixture',terms),
      {kind:expected,provider:'stripe',remoteId:'cs_test_fixture'});
  }
  stripeAccount();
  nock('https://api.stripe.com').get('/v1/checkout/sessions/cs_test_fixture').reply(200,stripeSession('wrong-order',cases[0][0]));
  await assert.rejects(()=>adapters.stripe.terminalUnpaid('cs_test_fixture',terms),{code:'stripe-terms-mismatch'});
  assert.ok(nock.isDone());
});

function pix(orderId,extra={}) {return {id:567,live_mode:false,collector_id:123,external_reference:orderId,metadata:{release:digest},currency_id:'BRL',transaction_amount:1000,payment_method_id:'pix',status:'pending',point_of_interaction:{transaction_data:{qr_code:'000201-fixture'}},...extra};}
test('Mercado Pago SDK preserves BRL quote and verifies approved payment before delivery',async t=>{
  const {service}=await fixture(t);let orderId;
  nock('https://api.mercadopago.com').post('/v1/payments',body=>{
    orderId=body.external_reference;assert.equal(body.transaction_amount,1000);assert.equal(body.payment_method_id,'pix');return true;
  }).matchHeader('x-idempotency-key',v=>/^[a-f0-9]{64}$/.test(v)).reply(()=>[201,pix(orderId)]);
  const result=await service.create(request(),{provider:'mercadopago',amountCents:20000,requestKey:'pix-one',payerEmail:'buyer@example.test'});
  assert.equal(result.currency,'BRL');assert.equal(result.amountCents,100000);assert.equal(result.usdAmountCents,20000);
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(orderId));
  assert.equal((await service.confirm(request(),orderId)).status,'awaiting-payment');await assert.rejects(()=>service.download(request(),orderId));
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(orderId,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
  assert.equal((await service.confirm(request(),orderId)).status,'paid');assert.equal((await service.download(request(),orderId)).sha256,digest);assert.ok(nock.isDone());
});

test('Mercado Pago Payments finality requires exact canceled Pix terms and no approval',async t=>{
  const {adapters}=await fixture(t);
  const terms={orderId:'a'.repeat(32),releaseDigest:digest,currency:'BRL',amountCents:100000,expiresAt:1800003600};
  const base={status:'cancelled',status_detail:'expired',date_of_expiration:new Date(terms.expiresAt*1000).toISOString(),
    transaction_amount_refunded:0,date_approved:null};
  const cases=[
    [{},'terminal-unpaid'],
    [{status:'pending',status_detail:'pending_waiting_transfer'},'unresolved'],
    [{status:'approved',status_detail:'accredited'},'unresolved'],
    [{status_detail:'unknown'},'unresolved'],
    [{date_approved:'2027-01-01T00:00:00Z'},'unresolved'],
    [{transaction_amount_refunded:1},'unresolved'],
    [{transaction_amount_refunded:null},'unresolved'],
    [{date_of_expiration:new Date((terms.expiresAt+1)*1000).toISOString()},'unresolved'],
  ];
  for(const [change,expected] of cases){
    nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(terms.orderId,{...base,...change}));
    assert.deepEqual(await adapters.mercadopago.terminalUnpaid('567',terms),
      {kind:expected,provider:'mercadopago',providerApi:'payments-v1',remoteId:'567'});
  }
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix('wrong-order',base));
  await assert.rejects(()=>adapters.mercadopago.terminalUnpaid('567',terms),{code:'pix-terms-mismatch'});
  assert.ok(nock.isDone());
});

function paypalOrder(orderId,extra={},currency='USD',value='200.00') {return {id:'ORDER123',intent:'CAPTURE',status:'PAYER_ACTION_REQUIRED',purchase_units:[{reference_id:orderId,custom_id:digest,payee:{merchant_id:'MERCHANT123'},amount:{currency_code:currency,value}}],links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token=ORDER123',method:'GET'}],...extra};}
test('PayPal SDK creates, captures approved order and verifies capture with merchant/amount binding',async t=>{
  const {service}=await fixture(t);let orderId;
  nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').reply(200,{access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
  nock('https://api-m.sandbox.paypal.com').post('/v2/checkout/orders',body=>{
    orderId=body.purchase_units[0].reference_id;assert.equal(body.purchase_units[0].amount.value,'200.00');return true;
  }).matchHeader('paypal-request-id',v=>/^[a-f0-9]{64}$/.test(v)).reply(()=>[201,paypalOrder(orderId)]);
  const result=await service.create(request(),{provider:'paypal',amountCents:20000,requestKey:'paypal-one'});assert.equal(result.remoteId,'ORDER123');
  nock('https://api-m.sandbox.paypal.com').get('/v2/checkout/orders/ORDER123').reply(200,paypalOrder(orderId,{status:'APPROVED'}));
  const completed=paypalOrder(orderId,{status:'COMPLETED'});completed.purchase_units[0].payments={captures:[{id:'CAPTURE123',status:'COMPLETED',final_capture:true,amount:{currency_code:'USD',value:'200.00'}}]};
  nock('https://api-m.sandbox.paypal.com').post('/v2/checkout/orders/ORDER123/capture').matchHeader('paypal-request-id',v=>/^[a-f0-9]{64}$/.test(v)).reply(201,completed);
  nock('https://api-m.sandbox.paypal.com').get('/v2/payments/captures/CAPTURE123').reply(200,{id:'CAPTURE123',status:'COMPLETED',amount:{currency_code:'USD',value:'200.00'},supplementary_data:{related_ids:{order_id:'ORDER123'}}});
  assert.equal((await service.confirm(request(),result.orderId)).status,'paid');assert.equal((await service.download(request(),result.orderId)).sha256,digest);assert.ok(nock.isDone());
});

test('PayPal BRL presentment freezes the shared quote while preserving the USD commercial input',async t=>{
  const {service}=await fixture(t,{paypal:{...config.paypal,currency:'BRL'}});let orderId;
  nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').reply(200,{access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
  nock('https://api-m.sandbox.paypal.com').post('/v2/checkout/orders',body=>{
    orderId=body.purchase_units[0].reference_id;
    assert.deepEqual(body.purchase_units[0].amount,{currency_code:'BRL',value:'1000.00'});
    return true;
  }).reply(()=>[201,paypalOrder(orderId,{},'BRL','1000.00')]);
  const result=await service.create(request(),{provider:'paypal',amountCents:20000,requestKey:'paypal-brl'});
  assert.equal(result.currency,'BRL');assert.equal(result.amountCents,100000);assert.equal(result.usdAmountCents,20000);
  assert.equal(result.quoteReference,'fixture-rate-not-for-sale');assert.ok(nock.isDone());
});

test('PayPal missing remote order remains unresolved after reconciliation',async t=>{
  const {reconcileBatch}=await import('../src/reconcile.mjs');const f=await fixture(t);let orderId;
  nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').reply(200,{access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
  nock('https://api-m.sandbox.paypal.com').post('/v2/checkout/orders',body=>{orderId=body.purchase_units[0].reference_id;return true;}).reply(()=>[201,paypalOrder(orderId)]);
  await f.service.create(request(),{provider:'paypal',amountCents:20000,requestKey:'paypal-missing'});
  f.state.now+=3601;
  nock('https://api-m.sandbox.paypal.com').get('/v2/checkout/orders/ORDER123').reply(404,{name:'RESOURCE_NOT_FOUND',message:'The specified resource does not exist.'});
  const result=await reconcileBatch({...f,clock:()=>f.state.now});
  assert.equal(result.checked,1);assert.equal(result.review,1);assert.deepEqual(result.failed,[{orderId,code:'paypal-order-missing'}]);
  const review=await f.repository('reconcile-inspect',{state:'review',after:0,now:f.state.now});
  assert.equal(review.orders.length,1);assert.equal(review.orders[0].reason,'paypal-order-missing');
  await assert.rejects(()=>f.service.create(request(),{provider:'stripe',amountCents:20000,requestKey:'fresh-tab-after-expiry'}),
    error=>error.code==='customer-checkout-unresolved'&&error.status===409);
  const enabled=createCheckoutService({auth:f.auth,repository:f.repository,adapters:f.adapters,
    origin,clock:()=>f.state.now,automaticReplacement:true});
  assert.equal((await enabled.restore(request(),orderId)).replacementCheckAvailable,false);
  await assert.rejects(()=>enabled.create(request(),{provider:'stripe',amountCents:20000,
    requestKey:'paypal-missing-enabled-fresh-key'}),{code:'customer-checkout-unresolved'});
  await assert.rejects(()=>enabled.create(request(),{provider:'stripe',amountCents:20000,
    requestKey:'paypal-missing-explicit-replacement',replaceOldOrderId:orderId}),
  {code:'replacement-review-required'});
  assert.equal(await f.repository('lookup',{customer:(await f.auth.identity(request())).customer,
    now:f.state.now,requestKey:'paypal-missing-explicit-replacement'}),null);
  await assert.rejects(()=>f.repository('reconcile-resolve',{work:{orderId,generation:review.orders[0].generation},reason:'paypal-missing-unpaid',now:f.state.now}),error=>error.code==='reconciliation-terminal-evidence-required'&&error.status===409);
  assert.equal((await f.repository('reconcile-inspect',{state:'review',after:0,now:f.state.now})).counts.review,1);
  assert.ok(nock.isDone());
});

test('PayPal order state and missing-order response cannot automatically release checkout',async t=>{
  const {adapters}=await fixture(t);
  const terms={orderId:'a'.repeat(32),releaseDigest:digest,currency:'USD',amountCents:20000};
  nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').reply(200,{access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
  for(const status of ['CREATED','PAYER_ACTION_REQUIRED','APPROVED','VOIDED']){
    nock('https://api-m.sandbox.paypal.com').get('/v2/checkout/orders/ORDER123').reply(200,paypalOrder(terms.orderId,{status}));
    assert.deepEqual(await adapters.paypal.terminalUnpaid('ORDER123',terms),
      {kind:'unresolved',provider:'paypal',remoteId:'ORDER123'});
  }
  nock('https://api-m.sandbox.paypal.com').get('/v2/checkout/orders/ORDER123').reply(404,{name:'RESOURCE_NOT_FOUND'});
  await assert.rejects(()=>adapters.paypal.terminalUnpaid('ORDER123',terms),{code:'paypal-order-missing'});
  assert.ok(nock.isDone());
});

test('expired PayPal payer-action order stays in review and blocks a fresh payment key',async t=>{
  const {reconcileBatch}=await import('../src/reconcile.mjs');const f=await fixture(t);let orderId;
  nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').reply(200,
    {access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
  nock('https://api-m.sandbox.paypal.com').post('/v2/checkout/orders',body=>{
    orderId=body.purchase_units[0].reference_id;return true;
  }).reply(()=>[201,paypalOrder(orderId)]);
  await f.service.create(request(),{provider:'paypal',amountCents:20000,requestKey:'paypal-payer-action'});
  f.state.now+=3601;
  nock('https://api-m.sandbox.paypal.com').get('/v2/checkout/orders/ORDER123')
    .reply(()=>[200,paypalOrder(orderId)]);
  const result=await reconcileBatch({...f,clock:()=>f.state.now});
  assert.deepEqual([result.checked,result.pending,result.review],[1,1,1]);
  await assert.rejects(()=>f.service.create(request(),{
    provider:'stripe',amountCents:20000,requestKey:'new-after-payer-action'}),
  error=>error.code==='customer-checkout-unresolved'&&error.status===409);
  const enabled=createCheckoutService({auth:f.auth,repository:f.repository,adapters:f.adapters,
    origin,clock:()=>f.state.now,automaticReplacement:true});
  assert.equal((await enabled.restore(request(),orderId)).replacementCheckAvailable,false);
  await assert.rejects(()=>enabled.create(request(),{provider:'stripe',amountCents:20000,
    requestKey:'paypal-payer-action-enabled-fresh-key'}),{code:'customer-checkout-unresolved'});
  await assert.rejects(()=>enabled.create(request(),{provider:'stripe',amountCents:20000,
    requestKey:'paypal-payer-action-explicit-replacement',replaceOldOrderId:orderId}),
  {code:'replacement-review-required'});
  assert.equal(await f.repository('lookup',{customer:(await f.auth.identity(request())).customer,
    now:f.state.now,requestKey:'paypal-payer-action-explicit-replacement'}),null);
  assert.ok(nock.isDone());
});

test('default-disabled replacement stays locked; enabled proof closes and creates one successor',async t=>{
  const f=await fixture(t),customer=(await f.auth.identity(request(),{mutation:true})).customer;
  const old=await f.repository('prepare',{customer,now:f.state.now,requestKey:'old-key',provider:'stripe',account:'acct_fixture',amountCents:20000,
    terms:{amountCents:20000,currency:'USD',payerEmail:null,returnUrl:origin+'/purchase/return',cancelUrl:origin+'/purchase/cancel'}});
  const claim=await f.repository('claim',{customer,now:f.state.now,orderId:old.id});
  await f.repository('bind',{customer,now:f.state.now,orderId:old.id,generation:claim.generation,remoteId:'cs_old',
    response:{remoteId:'cs_old',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_old'}});
  f.state.now+=3601;
  const input={provider:'stripe',amountCents:20000,requestKey:'new-key',replaceOldOrderId:old.id};
  assert.equal((await f.service.restore(request(),old.id)).replacementCheckAvailable,false);
  await assert.rejects(()=>f.service.create(request(),input),{code:'replacement-disabled'});
  await assert.rejects(()=>f.service.create(request(),{...input,replaceOldOrderId:undefined}),{code:'customer-checkout-unresolved'});
  let discovered=0,checked=0,created=0;
  const stripe={...f.adapters.stripe,
    async discover(terms,interval){discovered++;assert.equal(terms.orderId,old.id);return {ids:['cs_old'],total:1,complete:true,interval};},
    async terminalUnpaid(id,terms){checked++;assert.equal(id,'cs_old');assert.equal(terms.orderId,old.id);return {kind:'terminal-unpaid',provider:'stripe',remoteId:id};},
    async create(){created++;return {remoteId:'cs_new',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_new'};}};
  const candidate=createCheckoutService({auth:f.auth,repository:f.repository,adapters:{...f.adapters,stripe},origin,clock:()=>f.state.now,automaticReplacement:true});
  await assert.rejects(()=>candidate.create(request(),{...input,replaceOldOrderId:undefined}),{code:'customer-checkout-unresolved'});
  await assert.rejects(()=>candidate.create(request(),{...input,replaceOldOrderId:'a'.repeat(32)}),{code:'replacement-review-required'});
  assert.deepEqual([discovered,checked,created],[0,0,0]);
  assert.equal((await candidate.restore(request(),old.id)).replacementCheckAvailable,true);
  const result=await candidate.create(request(),input);
  assert.notEqual(result.orderId,old.id);assert.equal(result.remoteId,'cs_new');
  assert.equal((await candidate.restore(request(),result.orderId)).replacesOrderId,old.id);
  assert.deepEqual([discovered,checked,created],[1,1,1]);
  assert.equal((await f.repository('lookup',{customer,now:f.state.now,requestKey:'old-key'})).status,'cancelled');
  assert.equal((await candidate.create(request(),input)).orderId,result.orderId);
  assert.deepEqual([discovered,checked,created],[1,1,1]);
  assert.deepEqual(await candidate.lookup(request(),{requestKey:'new-key'}),
    {found:true,orderId:result.orderId,status:'pending',replacesOrderId:old.id});
  await assert.rejects(()=>candidate.create(request(),{...input,replaceOldOrderId:'a'.repeat(32)}),{code:'replacement-link-conflict'});
  await assert.rejects(()=>candidate.create(request('bob','csrf-bob'),input),{code:'replacement-review-required'});
  await assert.rejects(()=>candidate.create(request(),{...input,requestKey:'racing-key',replaceOldOrderId:undefined}),{code:'customer-checkout-pending'});
});

test('incomplete discovery or inconclusive finality never releases an old checkout',async t=>{
  const f=await fixture(t),customer=(await f.auth.identity(request(),{mutation:true})).customer;
  const old=await f.repository('prepare',{customer,now:f.state.now,requestKey:'old-key',provider:'stripe',account:'acct_fixture',amountCents:20000,
    terms:{amountCents:20000,currency:'USD',payerEmail:null}});
  const claim=await f.repository('claim',{customer,now:f.state.now,orderId:old.id});
  await f.repository('bind',{customer,now:f.state.now,orderId:old.id,generation:claim.generation,remoteId:'cs_old',response:{remoteId:'cs_old'}});
  f.state.now+=3601;
  const input={provider:'stripe',amountCents:20000,requestKey:'new-key',replaceOldOrderId:old.id};
  let discovery={ids:['cs_old','cs_other'],total:2,complete:true},finality={kind:'unresolved',provider:'stripe',remoteId:'cs_old'},checked=0;
  const stripe={...f.adapters.stripe,
    async discover(terms,interval){return {...discovery,interval};},
    async terminalUnpaid(){checked++;return finality;},
    async create(){assert.fail('no new provider creation');}};
  const candidate=createCheckoutService({auth:f.auth,repository:f.repository,adapters:{...f.adapters,stripe},origin,clock:()=>f.state.now,automaticReplacement:true});
  await assert.rejects(()=>candidate.create(request(),input),{code:'replacement-review-required'});
  assert.equal(checked,0);
  discovery={ids:['cs_old'],total:1,complete:true};
  await assert.rejects(()=>candidate.create(request(),input),{code:'replacement-review-required'});
  assert.equal(checked,1);
  assert.equal((await f.repository('lookup',{customer,now:f.state.now,requestKey:'old-key'})).status,'pending');
  assert.equal(await f.repository('lookup',{customer,now:f.state.now,requestKey:'new-key'}),null);
});

test('payment event arriving after terminal provider reads blocks replacement before successor creation',async t=>{
  const f=await fixture(t),customer=(await f.auth.identity(request(),{mutation:true})).customer;
  const old=await f.repository('prepare',{customer,now:f.state.now,requestKey:'old-key',provider:'stripe',account:'acct_fixture',amountCents:20000,
    terms:{amountCents:20000,currency:'USD',payerEmail:null}});
  const claim=await f.repository('claim',{customer,now:f.state.now,orderId:old.id});
  await f.repository('bind',{customer,now:f.state.now,orderId:old.id,generation:claim.generation,remoteId:'cs_old',response:{remoteId:'cs_old'}});
  f.state.now+=3601;
  let created=0;
  const stripe={...f.adapters.stripe,
    async discover(_terms,interval){return {ids:['cs_old'],total:1,complete:true,interval};},
    async terminalUnpaid(){
      // The provider read looked terminal, but a trusted event was admitted
      // before the ledger could consume that proof in its transaction.
      await f.repository('event-receive',{now:f.state.now,event:{provider:'stripe',account:'acct_fixture',environment:'sandbox',
        eventId:'evt-race',eventType:'checkout.session.completed',resourceId:'cs_old',resourceKind:'checkout.session'}});
      return {kind:'terminal-unpaid',provider:'stripe',remoteId:'cs_old'};
    },
    async create(){created++;assert.fail('provider creation must not run after a conflicting event');}};
  const service=createCheckoutService({auth:f.auth,repository:f.repository,adapters:{...f.adapters,stripe},origin,
    clock:()=>f.state.now,automaticReplacement:true});
  await assert.rejects(()=>service.create(request(),{provider:'stripe',amountCents:20000,requestKey:'new-key',replaceOldOrderId:old.id}),
    {code:'terminal-event-review-required'});
  assert.equal(created,0);
  assert.equal((await f.repository('lookup',{customer,now:f.state.now,requestKey:'old-key'})).status,'pending');
  assert.equal(await f.repository('lookup',{customer,now:f.state.now,requestKey:'new-key'}),null);
});

test('uncertain Mercado Pago Orders creation discovers one existing resource or locks without another POST',async t=>{
  const remoteA='ORD'+'A'.repeat(29),remoteB='ORD'+'B'.repeat(29);
  for(const scenario of [
    {name:'one existing Order',ids:[remoteA],complete:true},
    {name:'no observed Order',ids:[],complete:true},
    {name:'two distinct Orders',ids:[remoteA,remoteB],complete:true},
    {name:'incomplete search',ids:[],complete:false},
    {name:'provider terms mismatch',ids:[remoteA],complete:true,mismatch:true},
    {name:'active create lease',ids:[remoteA],complete:true,active:true},
    {name:'stale create lease',ids:[remoteA],complete:true,active:true,stale:true},
  ])await t.test(scenario.name,async sub=>{
    const f=await fixture(sub),customer=(await f.auth.identity(request(),{mutation:true})).customer;
    const email='buyer@example.test',requestKey='mp-uncertain';
    const old=await f.repository('prepare',{customer,now:f.state.now,requestKey,provider:'mercadopago',account:'123',amountCents:20000,
      terms:{providerApi:'orders-v1',pixRequestVersion:2,pixExpirationSeconds:1800,pixExpiresAt:f.state.now+1800,
        amountCents:102000,currency:'BRL',reference:'fixed-5.10',payerEmail:email}});
    const claim=await f.repository('claim',{customer,now:f.state.now,orderId:old.id});
    if(!scenario.active)await f.repository('creation-failed',{customer,now:f.state.now,orderId:old.id,generation:claim.generation,definite:false});
    if(scenario.stale)f.state.now+=61;
    let searched=0,resumed=0,created=0;
    const mp={account:'123',api:'orders-v1',async discover(terms,interval){
      searched++;assert.equal(terms.orderId,old.id);return {ids:scenario.ids,total:scenario.ids.length,complete:scenario.complete,interval};
    },async resume(id,terms){resumed++;assert.equal(id,remoteA);assert.equal(terms.orderId,old.id);
      return scenario.mismatch?{remoteId:id,checkoutState:'verification-required',verificationIssues:[{path:'total_amount',code:'mismatch-or-missing'}]}:
        {remoteId:id,checkoutState:'ready',pixCode:'synthetic-pix'};
    },async create(){created++;assert.fail('an uncertain Orders POST must not be repeated');}};
    const service=createCheckoutService({auth:f.auth,repository:f.repository,adapters:{...f.adapters,mercadopago:mp},origin,clock:()=>f.state.now});
    const input={provider:'mercadopago',amountCents:20000,requestKey,payerEmail:email};
    if(scenario.active&&!scenario.stale){
      await assert.rejects(()=>service.create(request(),input),{code:'checkout-in-progress'});
      assert.deepEqual([searched,resumed,created],[0,0,0]);
    }else if(scenario.ids.length===1&&scenario.complete&&!scenario.mismatch){
      const changedApi=createCheckoutService({auth:f.auth,repository:f.repository,
        adapters:{...f.adapters,mercadopago:{...mp,api:'payments-v1'}},origin,clock:()=>f.state.now});
      await assert.rejects(()=>changedApi.create(request(),input),{code:'checkout-conflict'});
      const result=await service.create(request(),input);
      assert.equal(result.remoteId,remoteA);
      assert.equal((await f.repository('lookup',{customer,now:f.state.now,requestKey})).creation_state,'bound');
      assert.equal((await service.create(request(),input)).remoteId,remoteA);
      assert.deepEqual([searched,resumed,created],[1,1,0]);
    }else{
      await assert.rejects(()=>service.create(request(),input),
        {code:scenario.ids.length>1||scenario.mismatch?'checkout-reconciliation-required':'checkout-in-progress'});
      const attempt=await f.repository('lookup',{customer,now:f.state.now,requestKey});
      assert.equal(attempt.remote_id,null);assert.equal(attempt.creation_state,'uncertain');
      assert.deepEqual([searched,resumed,created],[1,scenario.mismatch?1:0,0]);
      if(scenario.ids.length===0){
        scenario.ids=[remoteA];scenario.complete=true;
        assert.equal((await service.create(request(),input)).remoteId,remoteA);
        assert.deepEqual([searched,resumed,created],[2,1,0]);
      }
    }
  });
});

test('explicit replacement keeps its linked successor after a post-commit 409 without another provider create',async t=>{
  const f=await fixture(t),customer=(await f.auth.identity(request(),{mutation:true})).customer;
  const old=await f.repository('prepare',{customer,now:f.state.now,requestKey:'old-key',provider:'stripe',account:'acct_fixture',amountCents:20000,
    terms:{amountCents:20000,currency:'USD',payerEmail:null}});
  const claim=await f.repository('claim',{customer,now:f.state.now,orderId:old.id});
  await f.repository('bind',{customer,now:f.state.now,orderId:old.id,generation:claim.generation,remoteId:'cs_old',response:{remoteId:'cs_old'}});
  f.state.now+=3601;
  let created=0;
  const stripe={...f.adapters.stripe,
    async discover(_terms,interval){return {ids:['cs_old'],total:1,complete:true,interval};},
    async terminalUnpaid(){return {kind:'terminal-unpaid',provider:'stripe',remoteId:'cs_old'};},
    async create(){created++;assert.fail('provider creation must not run after expiry');}};
  const repository=async(op,args)=>{
    const value=await f.repository(op,args);
    if(op==='replace-prepare')f.state.now+=3601;
    return value;
  };
  const service=createCheckoutService({auth:f.auth,repository,adapters:{...f.adapters,stripe},origin,clock:()=>f.state.now,automaticReplacement:true});
  const input={provider:'stripe',amountCents:20000,requestKey:'new-key',replaceOldOrderId:old.id};
  await assert.rejects(()=>service.create(request(),input),{code:'checkout-not-pending'});
  const found=await service.lookup(request(),{requestKey:'new-key'});
  assert.equal(found.found,true);assert.equal(found.replacesOrderId,old.id);assert.equal(found.status,'expired');
  assert.equal(created,0);
  await assert.rejects(()=>service.create(request(),{...input,replaceOldOrderId:'a'.repeat(32)}),{code:'replacement-link-conflict'});
});

test('replacement refreshes a Mercado Pago Orders Pix quote and deadline after terminal reads',async t=>{
  const f=await fixture(t),customer=(await f.auth.identity(request(),{mutation:true})).customer;
  const old=await f.repository('prepare',{customer,now:f.state.now,requestKey:'old-key',provider:'stripe',account:'acct_fixture',amountCents:20000,
    terms:{amountCents:20000,currency:'USD',payerEmail:null}});
  const claim=await f.repository('claim',{customer,now:f.state.now,orderId:old.id});
  await f.repository('bind',{customer,now:f.state.now,orderId:old.id,generation:claim.generation,remoteId:'cs_old',response:{remoteId:'cs_old'}});
  f.state.now+=3601;
  let quoted=0,created=0;
  const stripe={...f.adapters.stripe,
    async discover(_terms,interval){f.state.now+=120;return {ids:['cs_old'],total:1,complete:true,interval};},
    async terminalUnpaid(){return {kind:'terminal-unpaid',provider:'stripe',remoteId:'cs_old'};}};
  const mp={account:'123',api:'orders-v1',async create(terms){created++;assert.equal(terms.pixExpiresAt,f.state.now+1800);
    assert.equal(terms.amountCents,102000);return {remoteId:'ORD_NEW',pixCode:'000201-fixture'};}};
  const service=createCheckoutService({auth:f.auth,repository:f.repository,adapters:{...f.adapters,stripe,mercadopago:mp},origin,clock:()=>f.state.now,
    automaticReplacement:true,quoteBrl:async()=>{quoted++;return {amountCents:102000,currency:'BRL',reference:'fixed-5.10'};}});
  const result=await service.create(request(),{provider:'mercadopago',amountCents:20000,requestKey:'new-pix',payerEmail:'buyer@example.test',replaceOldOrderId:old.id});
  assert.equal(result.pixCode,'000201-fixture');assert.deepEqual([quoted,created],[1,1]);
});

test('reject live credentials and invalid amounts without issuing requests',async t=>{
  const {service}=await fixture(t);
  assert.throws(()=>createPaymentAdapters({...config,environment:'live'}));
  assert.throws(()=>createPaymentAdapters({...config,stripe:{...config.stripe,secret:'sk_live_no'}}));
  assert.throws(()=>createPaymentAdapters({...config,mercadopago:{...config.mercadopago,accessToken:'APP_USR-no'}}));
  for(const amountCents of [4999,100001,1.5,'20000',NaN])await assert.rejects(()=>service.create(request(),{provider:'stripe',amountCents,requestKey:'invalid'}));
  await assert.rejects(()=>service.create(request(),{provider:'usdc',amountCents:20000,requestKey:'usdc'}));
  assert.equal(money(5012),'50.12');assert.equal(cents('50.12'),5012);assert.throws(()=>cents('50.123'));
});

test('wrong merchant, currency, amount or refunded Pix cannot grant access; late approval requires review',async t=>{
  const {service,state}=await fixture(t);let orderId;
  nock('https://api.mercadopago.com').post('/v1/payments',b=>{orderId=b.external_reference;return true;}).reply(()=>[201,pix(orderId)]);
  await service.create(request(),{provider:'mercadopago',amountCents:20000,requestKey:'pix-negative',payerEmail:'payer@example.test'});
  const paid={status:'approved',status_detail:'accredited',transaction_amount_refunded:0};
  for(const change of [{collector_id:999},{currency_id:'USD'},{transaction_amount:200},{transaction_amount_refunded:1},{live_mode:true},{id:999}]){
    nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(orderId,{...paid,...change}));
    await assert.rejects(()=>service.confirm(request(),orderId));await assert.rejects(()=>service.download(request(),orderId));
  }
  state.now+=3601;
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(orderId,paid));
  assert.equal((await service.confirm(request(),orderId)).status,'paid-review');await assert.rejects(()=>service.download(request(),orderId));
  assert.ok(nock.isDone());
});

test('restart preserves checkout and idempotency; competing provider cannot reuse an order',async t=>{
  const {service,repository,auth,adapters,state}=await fixture(t);let orderId;
  nock('https://api.mercadopago.com').post('/v1/payments',b=>{orderId=b.external_reference;return true;}).reply(()=>[201,pix(orderId)]);
  const input={provider:'mercadopago',amountCents:20000,requestKey:'restart-one',payerEmail:'payer@example.test'};
  const first=await service.create(request(),input);
  const restarted=createCheckoutService({auth,repository,adapters,origin,clock:()=>state.now,quoteBrl:async()=>({amountCents:120000,currency:'BRL',reference:'new-rate'})});
  assert.deepEqual(await restarted.create(request(),input),first);
  await assert.rejects(()=>restarted.create(request(),{provider:'paypal',amountCents:20000,requestKey:'restart-one'}));
  nock('https://api.mercadopago.com').get('/v1/payments/567').twice().reply(200,pix(orderId,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
  assert.equal((await restarted.confirm(request(),orderId)).status,'paid');state.now+=5;
  assert.equal((await restarted.confirm(request(),orderId)).status,'paid');assert.ok(nock.isDone());
});

test('HTTP handler mounts shared login/callback and gates checkout with the session consumer',async t=>{
  const {createHandler}=await import('../src/index.mjs');const {Readable}=await import('node:stream');
  const {service,auth,repository}=await fixture(t);const handler=createHandler({auth,checkout:service,origin});
  const call=async(path,{method='POST',headers={},body='{}'}={})=>{
    const req=Readable.from([Buffer.from(body)]);req.url=path;req.method=method;req.headers={...request().headers,'content-type':'application/json',...headers};
    const res={headers:{},setHeader(k,v){this.headers[k]=v;},writeHead(status,h){this.status=status;Object.assign(this.headers,h);this.headersSent=true;},end(body){this.body=body;}};
    await handler(req,res);return res;
  };
  const session=await call('/api/session',{method:'GET'});assert.equal(session.status,200);assert.equal(JSON.parse(session.body).csrf,'csrf-alice');assert.match(JSON.parse(session.body).buyerRef,/^[a-f0-9]{64}$/);
  const anonymous=await call('/api/session',{method:'GET',headers:{cookie:''}});assert.equal(anonymous.status,200);assert.deepEqual(JSON.parse(anonymous.body),{authenticated:false});
  assert.equal((await call('/api/checkout',{headers:{'x-csrf-token':'wrong'},body:JSON.stringify({provider:'stripe',amountCents:20000,requestKey:'bad'})})).status,403);
  const customer=(await auth.identity(request(),{mutation:true})).customer;
  const saved=await repository('list',{customer,now:1800000000});
  assert.deepEqual(saved.orders,[]);
  const checkoutOrder=await repository('prepare',{customer,now:1800000000,requestKey:'lookup-owned',provider:'stripe',account:'acct_fixture',amountCents:20000,
    terms:{amountCents:20000,currency:'USD',payerEmail:null}});
  const owned=await call('/api/checkout/lookup',{body:JSON.stringify({requestKey:'lookup-owned'})});
  assert.equal(owned.status,200);assert.deepEqual(JSON.parse(owned.body),
    {found:true,orderId:checkoutOrder.id,status:'pending',replacesOrderId:null});
  const other=await call('/api/checkout/lookup',{headers:{cookie:'__Host-keld_session=bob','x-csrf-token':'csrf-bob'},body:JSON.stringify({requestKey:'lookup-owned'})});
  assert.equal(other.status,200);assert.deepEqual(JSON.parse(other.body),{found:false});
  const absent=await call('/api/checkout/lookup',{body:JSON.stringify({requestKey:'missing'})});
  assert.equal(absent.status,200);assert.deepEqual(JSON.parse(absent.body),{found:false});
  assert.equal((await call('/api/checkout/lookup',{headers:{'x-csrf-token':'wrong'},body:JSON.stringify({requestKey:'missing'})})).status,403);
  assert.equal((await call('/api/checkout/lookup',{body:JSON.stringify({requestKey:'missing',orderId:'x'})})).status,400);
  assert.equal((await call('/api/session',{method:'GET',headers:{host:'attacker.invalid'}})).status,400);
  const core={async start(){return {url:'https://issuer.localhost/login',login:'login-handle'};},async complete(){return {id:'new-handle',absolute:100,now:1};},async checkLogout(){},async logout(){}};
  const consumer=bindKeldAuth(core,profile);
  const authHandler=createHandler({auth:consumer,checkout:service,origin});
  await assert.rejects(()=>consumer.handle({method:'POST',url:'/auth/logout',headers:{origin:'https://attacker.invalid'}},{}),e=>e.status===403);
  for(const [url,expected] of [['/auth/login','https://issuer.localhost/login'],['/auth/register','https://issuer.localhost/login?prompt=create'],['/auth/callback?code=test','/']]){
    const req={method:'GET',url,headers:{host:'keld.localhost:17443'}};
    const res={writeHead(status,h){this.status=status;this.h=h;},end(){}};await authHandler(req,res);
    assert.equal(res.status,303);assert.equal(res.h.location,expected);assert.match(res.h['set-cookie'][0],/Secure; HttpOnly; SameSite=Lax/);
  }
  const started={method:'GET',url:'/auth/login?returnTo=%2Fcheckout%3Famount%3D200',headers:{host:'keld.localhost:17443'}};
  const startResult={writeHead(status,h){this.status=status;this.h=h;},end(){}};await authHandler(started,startResult);
  const returnCookie=startResult.h['set-cookie'].find(value=>value.startsWith('__Host-keld_return='));
  assert.ok(returnCookie);assert.match(returnCookie,/Secure; HttpOnly; SameSite=Lax/);
  const completed={method:'GET',url:'/auth/callback?code=test',headers:{host:'keld.localhost:17443',cookie:returnCookie.split(';')[0]}};
  const completeResult={writeHead(status,h){this.status=status;this.h=h;},end(){}};await authHandler(completed,completeResult);
  assert.equal(completeResult.status,303);assert.equal(completeResult.h.location,'/checkout?amount=200');
  assert.ok(completeResult.h['set-cookie'].some(value=>value.startsWith('__Host-keld_return=')&&value.includes('Max-Age=0')));
  for(const returnTo of ['https://attacker.invalid/','//attacker.invalid/','/api/session','/checkout?next=https://attacker.invalid','/checkout?amount=1']){
    const req={method:'GET',url:'/auth/login?returnTo='+encodeURIComponent(returnTo),headers:{host:'keld.localhost:17443'}};
    const res={writeHead(){throw new Error('unexpected redirect');},end(){}};
    await assert.rejects(()=>consumer.handle(req,res),error=>error.code==='return-target-rejected');
  }
});

test('saved Pix checkout survives unavailable quote service and still rejects changed buyer inputs',async t=>{
  const f=await fixture(t);let orderId;
  nock('https://api.mercadopago.com').post('/v1/payments',b=>{orderId=b.external_reference;return true;}).reply(()=>[201,pix(orderId)]);
  const input={provider:'mercadopago',amountCents:20000,requestKey:'quote-outage',payerEmail:'a@example.test'};
  const first=await f.service.create(request(),input);
  const retry=createCheckoutService({...f,origin,clock:()=>f.state.now,quoteBrl:async()=>{throw Error('quote-service-down');}});
  assert.deepEqual(await retry.create(request(),input),first);
  await assert.rejects(()=>retry.create(request(),{...input,amountCents:30000}),e=>e.code==='checkout-conflict');
  await assert.rejects(()=>retry.create(request(),{...input,payerEmail:'b@example.test'}),e=>e.code==='checkout-conflict');
  assert.ok(nock.isDone());
});

test('definite Stripe rejection frees reservation for a different provider with a new request key',async t=>{
  const f=await fixture(t);stripeAccount();let failedOrder;
  nock('https://api.stripe.com').post('/v1/checkout/sessions',body=>{
    failedOrder=new URLSearchParams(body).get('client_reference_id');return true;
  }).reply(400,{error:{type:'invalid_request_error',message:'rejected test request'}});
  const input={provider:'stripe',amountCents:20000,requestKey:'definite-failure'};
  await assert.rejects(()=>f.service.create(request(),input),e=>e.code==='payment-creation-failed');
  await assert.rejects(()=>f.service.create(request(),input),e=>e.status===409);
  const who=await f.auth.identity(request());
  assert.equal((await f.repository('get',{customer:who.customer,now:f.state.now,orderId:failedOrder})).status,'cancelled');
  let orderId;nock('https://api.mercadopago.com').post('/v1/payments',b=>{orderId=b.external_reference;return true;}).reply(()=>[201,pix(orderId)]);
  const next=await f.service.create(request(),{provider:'mercadopago',amountCents:20000,requestKey:'switch-after-failure',payerEmail:'a@example.test'});
  assert.notEqual(next.orderId,failedOrder);assert.equal(next.earlySupporter,true);assert.ok(nock.isDone());
});

test('ambiguous provider failure remains reserved even after a later rejection; retry keeps its key',async t=>{
  const f=await fixture(t);let orderId;const keys=[];
  const intercept=()=>nock('https://api.mercadopago.com').post('/v1/payments',b=>{orderId=b.external_reference;return true;})
    .matchHeader('x-idempotency-key',key=>{keys.push(key);return true;});
  intercept().reply(500,{message:'unknown outcome',status:500});
  const input={provider:'mercadopago',amountCents:20000,requestKey:'uncertain',payerEmail:'a@example.test'};
  await assert.rejects(()=>f.service.create(request(),input),e=>e.code==='payment-outcome-uncertain');
  await assert.rejects(()=>f.service.create(request(),{provider:'stripe',amountCents:20000,requestKey:'unsafe-switch'}),e=>e.code==='customer-checkout-pending');
  intercept().replyWithError({code:'ECONNRESET',message:'response lost'});
  await assert.rejects(()=>f.service.create(request(),input),e=>e.code==='payment-outcome-uncertain');
  intercept().reply(400,{message:'later rejection cannot erase uncertainty',status:400});
  await assert.rejects(()=>f.service.create(request(),input),e=>e.code==='payment-outcome-uncertain');
  intercept().reply(()=>[201,pix(orderId)]);
  const result=await f.service.create(request(),input);assert.equal(result.orderId,orderId);
  assert.equal(new Set(keys).size,1);assert.equal(keys.length,4);assert.ok(nock.isDone());
});

test('concurrent creates serialize; abandoned claim retries cannot release uncertain payment',async t=>{
  const f=await fixture(t);let enter,release,calls=0;
  const entered=new Promise(r=>enter=r),gate=new Promise(r=>release=r);
  f.adapters.stripe.create=async()=>{calls++;enter();await gate;return {remoteId:'cs_concurrent',checkoutUrl:'https://checkout.stripe.com/c/pay/test'};};
  const input={provider:'stripe',amountCents:20000,requestKey:'concurrent'};
  const first=f.service.create(request(),input);await entered;
  await assert.rejects(()=>f.service.create(request(),input),e=>e.code==='checkout-in-progress');
  release();const saved=await first;assert.deepEqual(await f.service.create(request(),input),saved);assert.equal(calls,1);
  const customer='isolated-abandoned';
  const old=await f.repository('prepare',{customer,now:f.state.now,requestKey:'abandoned',provider:'stripe',account:'acct_fixture',amountCents:20000,terms:{amountCents:20000,currency:'USD',payerEmail:null}});
  const a=await f.repository('claim',{customer,now:f.state.now,orderId:old.id});
  const b=await f.repository('claim',{customer,now:f.state.now+61,orderId:old.id});
  await assert.rejects(()=>f.repository('creation-failed',{customer,now:f.state.now+61,orderId:old.id,generation:a.generation,definite:true}),e=>e.code==='checkout-attempt-changed');
  const outcome=await f.repository('creation-failed',{customer,now:f.state.now+61,orderId:old.id,generation:b.generation,definite:true});
  assert.equal(outcome.definite,false);assert.equal((await f.repository('get',{customer,now:f.state.now+61,orderId:old.id})).status,'pending');
});

test('authenticated activity refreshes idle clock; rejected CSRF and revoked sessions cannot touch it',async()=>{
  let now=0,last=0,touches=0,revoked=false;
  const core={async authenticate(){if(revoked||now-last>=900)throw Error('expired');return {subject:'alice',csrf:'csrf-alice'};},async touch(){last=now;touches++;}};
  const auth=bindKeldAuth(core,profile);
  for(now=500;now<=2000;now+=500)await auth.identity(request(),{mutation:true});
  assert.equal(touches,4);assert.equal(last,2000);
  await assert.rejects(()=>auth.identity(request('alice','wrong'),{mutation:true}));assert.equal(touches,4);
  revoked=true;await assert.rejects(()=>auth.identity(request(),{mutation:true}));assert.equal(touches,4);
});

test('HTTP exposes safe error categories, logs correlation only, and reports unavailable database as 503',async t=>{
  const {createHandler}=await import('../src/index.mjs');const {Readable}=await import('node:stream');
  const root=await mkdtemp(join(tmpdir(),'keld-sdk-errors-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const unavailable=createRepository({database:join(root,'missing','ledger.db'),releaseDigest:digest});
  const events=[];
  const checkout={create:()=>unavailable('get',{customer:'private-buyer',now:1800000000,orderId:'a'.repeat(32)})};
  const handler=createHandler({origin,auth:{handle:async()=>false},checkout,diagnostic:e=>events.push(e)});
  const call=async()=>{const req=Readable.from([Buffer.from('{}')]);req.method='POST';req.url='/api/checkout';req.headers={host:'keld.localhost:17443','content-type':'application/json',authorization:'private-secret'};
    const res={writeHead(s){this.status=s;},end(b){this.body=JSON.parse(b);}};await handler(req,res);return res;};
  const result=await call();assert.equal(result.status,503);assert.equal(result.body.error,'ledger-unavailable');assert.equal(result.body.requestId,events[0].requestId);
  assert.deepEqual(Object.keys(events[0]).sort(),['code','event','requestId','status']);assert.doesNotMatch(JSON.stringify(events),/private-|ledger.db/);
  checkout.create=()=>{throw Error('private-secret stack and SQL');};
  const unknown=await call();assert.equal(unknown.status,503);assert.equal(unknown.body.error,'service-unavailable');assert.doesNotMatch(JSON.stringify(events),/private-secret/);
});

test('authenticated recovery lists only owned checkouts and restores frozen payment state without provider calls',async t=>{
  const f=await fixture(t);let orderId;
  nock('https://api.mercadopago.com').post('/v1/payments',b=>{orderId=b.external_reference;return true;}).reply(()=>[201,pix(orderId)]);
  const input={provider:'mercadopago',amountCents:20000,requestKey:'recover-me',payerEmail:'buyer@example.test'};
  const original=await f.service.create(request(),input);
  const alice=await f.service.list(request());assert.equal(alice.orders.length,1);assert.equal(alice.orders[0].orderId,orderId);
  assert.deepEqual(Object.keys(alice.orders[0]).sort(),['amountCents','createdAt','currency','orderId','provider','status']);
  assert.deepEqual((await f.service.list(request('bob','csrf-bob'))).orders,[]);
  await assert.rejects(()=>f.service.restore(request('bob','csrf-bob'),orderId),e=>e.code==='not-owned');
  const recovered=await f.service.restore(request(),orderId);assert.equal(recovered.requestKey,'recover-me');assert.equal(recovered.state,'pending');assert.deepEqual(recovered.result,original);assert.equal(recovered.input.payerEmail,input.payerEmail);
  await assert.rejects(()=>f.service.restore(request('alice','wrong'),orderId),e=>e.status===403);
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(orderId,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
  await f.service.confirm(request(),orderId);
  assert.equal((await f.service.restore(request(),orderId)).state,'paid');assert.equal((await f.service.download(request(),orderId)).sha256,digest);assert.ok(nock.isDone());
});

test('uncertain checkout without a provider response remains recoverable under its original key',async t=>{
  const f=await fixture(t);
  nock('https://api.mercadopago.com').post('/v1/payments').replyWithError({code:'ECONNRESET',message:'lost response'});
  await assert.rejects(()=>f.service.create(request(),{provider:'mercadopago',amountCents:20000,requestKey:'recover-uncertain',payerEmail:'buyer@example.test'}));
  const {orders}=await f.service.list(request());assert.equal(orders.length,1);
  const pending=await f.service.restore(request(),orders[0].orderId);assert.equal(pending.requestKey,'recover-uncertain');assert.equal(pending.state,'pending');assert.equal(pending.result,undefined);
  f.state.now+=3601;assert.equal((await f.service.list(request())).orders[0].status,'expired');assert.equal((await f.service.restore(request(),orders[0].orderId)).ledgerStatus,'expired');
  assert.ok(nock.isDone());
});

test('history traverses older owned orders without duplicates across tied timestamps and newer inserts',async t=>{
  const f=await fixture(t);const {customer}=await f.auth.identity(request());const ids=[];
  async function prepare(key,now){return f.repository('prepare',{customer,now,requestKey:key,provider:'stripe',account:'acct_fixture',amountCents:20000,terms:{amountCents:20000,currency:'USD',payerEmail:null}});}
  for(let i=0;i<23;i++){
    const a=await prepare('history-'+i,f.state.now);ids.push(a.id);
    const c=await f.repository('claim',{customer,now:f.state.now,orderId:a.id});
    await f.repository('creation-failed',{customer,now:f.state.now,orderId:a.id,generation:c.generation,definite:true});
  }
  const first=await f.service.list(request());assert.equal(first.orders.length,20);assert.equal(first.next,first.orders.at(-1).orderId);
  f.state.now++;const newOrder=await prepare('newer-insert',f.state.now);
  const second=await f.service.list(request(),first.next);assert.equal(second.orders.length,3);assert.equal(second.next,null);
  const found=[...first.orders,...second.orders].map(o=>o.orderId);assert.equal(new Set(found).size,23);assert.deepEqual(found,[...ids].sort().reverse());assert.ok(!found.includes(newOrder.id));
  await assert.rejects(()=>f.service.list(request('bob','csrf-bob'),first.next),e=>e.code==='not-owned');
  await assert.rejects(()=>f.service.list(request(),'invalid'),e=>e.code==='order-id-invalid');
});

test('operator reconciliation observes existing payments without buyer return, creation or capture',async t=>{
  const {reconcileBatch}=await import('../src/reconcile.mjs');const f=await fixture(t);let orderId;
  nock('https://api.mercadopago.com').post('/v1/payments',b=>{orderId=b.external_reference;return true;}).reply(()=>[201,pix(orderId)]);
  await f.service.create(request(),{provider:'mercadopago',amountCents:20000,requestKey:'no-return',payerEmail:'buyer@example.test'});
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(orderId,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
  const result=await reconcileBatch({...f,clock:()=>f.state.now});assert.equal(result.checked,1);assert.equal(result.paid,1);assert.deepEqual(result.failed,[]);
  assert.equal((await f.service.download(request(),orderId)).sha256,digest);
  assert.equal((await reconcileBatch({...f,clock:()=>f.state.now})).checked,0);assert.ok(nock.isDone());
});

test('operator reconciliation preserves late review, isolates failures and never captures PayPal',async t=>{
  const {reconcileBatch}=await import('../src/reconcile.mjs');const f=await fixture(t);
  for(const [customer,provider,account] of [['late','mercadopago','123'],['broken','stripe','acct_fixture'],['approved','paypal','MERCHANT123'],['wrong-merchant','paypal','OLD']]){
    const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'batch',provider,account,amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
    await f.repository('bind',{customer,now:f.state.now,orderId:order.id,generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,remoteId:'remote-'+customer,response:{remoteId:'remote-'+customer}});
  }
  let paypalCalls=0;
  const adapters={mercadopago:{account:'123',verify:async()=> 'paid-late'},stripe:{account:'acct_fixture',verify:async()=>{throw Error('private-provider-error');}},paypal:{account:'MERCHANT123',verify:async(id,t,options)=>{paypalCalls++;assert.equal(options.capture,false);return null;}}};
  const result=await reconcileBatch({repository:f.repository,adapters,clock:()=>f.state.now+3601});
  assert.equal(result.checked,4);assert.equal(result.review,3);assert.equal(result.pending,1);assert.equal(result.retried,1);assert.equal(result.paid,0);assert.equal(result.failed.length,2);assert.equal(paypalCalls,1);
  assert.doesNotMatch(JSON.stringify(result),/private-provider-error|wrong-merchant|OLD/);
  assert.equal((await reconcileBatch({repository:f.repository,adapters,clock:()=>f.state.now+3601})).checked,0);
  const review=await f.repository('reconcile-inspect',{state:'review',after:0,now:f.state.now+3601});
  // The late verified payment is terminal `paid-review` in the order ledger, so
  // reconciliation is done; the two unresolved operator cases remain review.
  assert.equal(review.counts.review,2);assert.equal(review.counts.done,1);assert.equal(review.orders.length,2);assert.equal(review.next,null);
  assert.equal(review.orders.every(row=>row.state==='review'&&row.orderId&&row.provider&&row.reason&&row.resolutions===0),true);
  assert.equal(JSON.stringify(review).includes('customer'),false);
  await assert.rejects(()=>f.repository('reconcile-inspect',{state:'private',after:0,now:f.state.now}),error=>error.code==='reconciliation-fields');
  const [firstReview,secondReview]=review.orders;assert.equal(firstReview.provider,'paypal');assert.equal(secondReview.provider,'paypal');
  await assert.rejects(()=>f.repository('reconcile-resolve',{work:{orderId:firstReview.orderId,generation:firstReview.generation},reason:'mercadopago-canceled-expired',now:f.state.now+3602}),error=>error.code==='reconciliation-resolution-mismatch');
  await assert.rejects(()=>f.repository('reconcile-resolve',{work:{orderId:firstReview.orderId,generation:firstReview.generation},reason:'paypal-missing-unpaid',now:f.state.now+3602}),error=>error.code==='reconciliation-resolution-mismatch');
  const mp=await f.repository('prepare',{customer:'mp-review',now:f.state.now,requestKey:'mp-review',provider:'mercadopago',account:'123',amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer:'mp-review',now:f.state.now,orderId:mp.id,generation:(await f.repository('claim',{customer:'mp-review',now:f.state.now,orderId:mp.id})).generation,remoteId:'remote-mp-review',response:{remoteId:'remote-mp-review'}});
  const mpWork=await f.repository('reconcile-claim',{now:f.state.now+3604});assert.equal(mpWork.provider,'mercadopago');
  await f.repository('reconcile-finish',{work:{orderId:mpWork.id,generation:mpWork.generation},outcome:'review',reason:'pix-order-state-review',now:f.state.now+3604});
  await assert.rejects(()=>f.repository('reconcile-resolve',{work:{orderId:mpWork.id,generation:mpWork.generation},reason:'mercadopago-canceled-expired',now:f.state.now+3605}),error=>error.code==='reconciliation-terminal-evidence-required'&&error.status===409);
  const pp=await f.repository('prepare',{customer:'pp-missing',now:f.state.now,requestKey:'pp-missing',provider:'paypal',account:'MERCHANT123',amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer:'pp-missing',now:f.state.now,orderId:pp.id,generation:(await f.repository('claim',{customer:'pp-missing',now:f.state.now,orderId:pp.id})).generation,remoteId:'remote-pp-missing',response:{remoteId:'remote-pp-missing'}});
  const ppWork=await f.repository('reconcile-claim',{now:f.state.now+3606});assert.equal(ppWork.provider,'paypal');
  await f.repository('reconcile-finish',{work:{orderId:ppWork.id,generation:ppWork.generation},outcome:'review',reason:'paypal-order-missing',now:f.state.now+3606});
  await assert.rejects(()=>f.repository('reconcile-resolve',{work:{orderId:ppWork.id,generation:ppWork.generation},reason:'paypal-missing-unpaid',now:f.state.now+3607}),error=>error.code==='reconciliation-terminal-evidence-required'&&error.status===409);
  const unresolved=await f.repository('reconcile-inspect',{state:'review',after:0,now:f.state.now+3607});
  assert.equal(unresolved.counts.review,4);assert.equal(unresolved.counts.done,1);assert.equal(unresolved.orders.every(row=>row.resolutions===0),true);
});

test('signed Pix event proceeds through durable inbox worker to verified fixture delivery',async t=>{
  const {createEventVerifiers,createEventInbox}=await import('../src/events.mjs');const {processEvents}=await import('../src/event-worker.mjs');const {createHmac}=await import('node:crypto');
  const f=await fixture(t);let orderId;
  nock('https://api.mercadopago.com').post('/v1/payments',b=>{orderId=b.external_reference;return true;}).reply(()=>[201,pix(orderId)]);
  await f.service.create(request(),{provider:'mercadopago',amountCents:20000,requestKey:'event-fulfillment',payerEmail:'buyer@example.test'});
  const secret='worker-signature-secret',requestId='worker-request',ts=f.state.now;
  const sig='ts='+ts+',v1='+createHmac('sha256',secret).update(`id:567;request-id:${requestId};ts:${ts};`).digest('hex');
  const inbox=createEventInbox({repository:f.repository,clock:()=>f.state.now,verifiers:createEventVerifiers({environment:'sandbox',mercadopago:{account:'123',secret}},{clock:()=>f.state.now*1000})});
  const receive=()=>inbox.receive('mercadopago',Buffer.from('{}'),{'x-signature':sig,'x-request-id':requestId},'/events/mercadopago?data.id=567');
  await receive();nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(orderId,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
  const result=await processEvents({...f,clock:()=>f.state.now});assert.equal(result.done,1);assert.equal(result.retried,0);assert.deepEqual(result.failed,[]);
  assert.equal((await f.service.download(request(),orderId)).sha256,digest);
  assert.equal((await receive()).duplicate,true);assert.equal((await processEvents({...f,clock:()=>f.state.now})).claimed,0);assert.ok(nock.isDone());
});

test('webhook admission is durable per provider and unauthenticated traffic cannot consume it',async t=>{
  const {createEventInbox}=await import('../src/events.mjs');const {execFileSync}=await import('node:child_process');const f=await fixture(t);
  let verified=0;const verifiers={paypal:async()=>{verified++;return {provider:'paypal',account:'MERCHANT123',environment:'sandbox',eventId:'admission-fixture',eventType:'PAYMENT.CAPTURE.COMPLETED',resourceId:'CAPTURE123',resourceKind:'capture'};}};
  const inbox=createEventInbox({repository:f.repository,clock:()=>f.state.now,verifiers,admissionPerMinute:2});
  assert.equal((await inbox.receive('paypal',Buffer.from('{}'),{},'/events/paypal')).accepted,true);
  assert.equal((await inbox.receive('paypal',Buffer.from('{}'),{},'/events/paypal')).duplicate,true);
  await assert.rejects(()=>inbox.receive('paypal',Buffer.from('{}'),{},'/events/paypal'),error=>error.code==='event-rate-limit'&&error.status===429);
  assert.equal(verified,3);
  const count=Number(execFileSync('python3',['-c',"import sqlite3,sys; print(sqlite3.connect(sys.argv[1]).execute('SELECT attempts FROM sdk_event_admission WHERE provider=\\\"paypal\\\"').fetchone()[0])",join(f.root,'ledger.db')],{encoding:'utf8'}));
  assert.equal(count,2);
  f.state.now+=60;
  assert.equal((await inbox.receive('paypal',Buffer.from('{}'),{},'/events/paypal')).duplicate,true);
  assert.equal(verified,4);
});

test('event-before-binding retries durably then completes without recreating payment',async t=>{
  const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t);const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'event-first',provider:'mercadopago',account:'123',amountCents:20000,terms:{amountCents:100000,currency:'BRL',payerEmail:'buyer@example.test'}});
  await f.repository('event-receive',{now:f.state.now,event:{provider:'mercadopago',account:'123',environment:'sandbox',eventId:'event-first',eventType:'payment.notification',resourceId:'567',resourceKind:'payment'}});
  let calls=0;const original=f.adapters.mercadopago.verify;f.adapters.mercadopago.verify=(...args)=>{calls++;return original(...args);};
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(order.id));
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).retried,1);assert.equal(calls,0);
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).claimed,0);
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,remoteId:'567',response:{remoteId:'567',pixCode:'fixture'}});
  f.state.now+=31;nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(order.id,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).done,1);assert.equal(calls,1);assert.ok(nock.isDone());
});

test('expired event claim can be recovered; stale worker cannot finish newer generation',async t=>{
  const f=await fixture(t);
  await f.repository('event-receive',{now:f.state.now,event:{provider:'stripe',account:'acct_fixture',environment:'sandbox',eventId:'lease-event',eventType:'checkout.session.completed',resourceId:'cs_fixture',resourceKind:'checkout.session'}});
  const a=await f.repository('event-claim',{now:f.state.now});assert.equal(a.generation,1);
  assert.equal(await f.repository('event-claim',{now:f.state.now}),null);f.state.now+=61;
  const b=await f.repository('event-claim',{now:f.state.now});assert.equal(b.generation,2);
  await assert.rejects(()=>f.repository('event-finish',{now:f.state.now,event:a,outcome:'done',reason:'stale'}),e=>e.code==='event-work-conflict');
  const retry=await f.repository('event-finish',{now:f.state.now,event:b,outcome:'retry',reason:'binding-pending'});assert.equal(retry.nextAttempt,f.state.now+60);
  assert.equal(await f.repository('event-claim',{now:f.state.now}),null);f.state.now+=61;
  const c=await f.repository('event-claim',{now:f.state.now});assert.equal(c.generation,3);
  await f.repository('event-finish',{now:f.state.now,event:c,outcome:'done',reason:'verified'});assert.equal(await f.repository('event-claim',{now:f.state.now}),null);
});

test('Stripe final partial-refund event re-fetches cumulative full proof and revokes with GET only',async t=>{
  const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'reversal-stripe',
    provider:'stripe',account:'acct_fixture',amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,
    remoteId:'cs_fixture',response:{remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_fixture'}});
  await f.repository('settle',{customer,now:f.state.now+1,orderId:order.id,remoteId:'cs_fixture',
    paymentId:'pi_fixture',amountCents:20000,currency:'USD'});
  await f.repository('event-receive',{now:f.state.now+2,event:{provider:'stripe',account:'acct_fixture',
    environment:'sandbox',eventId:'evt_partial',eventType:'refund.updated',resourceId:'re_first',resourceKind:'refund'}});
  f.state.now+=3;
  const stripe=nock('https://api.stripe.com');
  stripe.get('/v1/account').twice().reply(200,{id:'acct_fixture',object:'account'});
  stripe.get('/v1/refunds/re_first').reply(200,{id:'re_first',object:'refund',livemode:false,
    payment_intent:'pi_fixture',charge:'ch_fixture',currency:'usd',amount:10000,status:'succeeded'});
  stripe.get('/v1/checkout/sessions/cs_fixture').reply(200,stripeSession(order.id,{id:'cs_fixture',
    status:'complete',payment_status:'paid',payment_intent:'pi_fixture'}));
  stripe.get('/v1/payment_intents/pi_fixture').query(true).reply(200,{id:'pi_fixture',livemode:false,
    status:'succeeded',amount:20000,amount_received:20000,currency:'usd',latest_charge:{id:'ch_fixture',
      payment_intent:'pi_fixture',livemode:false,status:'succeeded',paid:true,captured:true,
      refunded:false,disputed:false,amount_refunded:10000,amount:20000,currency:'usd'}});
  stripe.get('/v1/refunds').query({payment_intent:'pi_fixture',limit:'100'}).reply(200,{object:'list',
    has_more:false,data:[{id:'re_first',object:'refund',livemode:false,payment_intent:'pi_fixture',
      charge:'ch_fixture',currency:'usd',amount:10000,status:'succeeded'}]});
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).review.length,1);
  assert.equal((await f.service.download(request(),order.id)).sha256,digest);
  f.state.now++;
  await f.repository('event-receive',{now:f.state.now,event:{provider:'stripe',account:'acct_fixture',
    environment:'sandbox',eventId:'evt_refund',eventType:'refund.updated',resourceId:'re_fixture',resourceKind:'refund'}});
  stripe.get('/v1/account').twice().reply(200,{id:'acct_fixture',object:'account'});
  stripe.get('/v1/refunds/re_fixture').reply(200,{id:'re_fixture',object:'refund',livemode:false,
    payment_intent:'pi_fixture',charge:'ch_fixture',currency:'usd',amount:10000,status:'succeeded'});
  stripe.get('/v1/checkout/sessions/cs_fixture').reply(200,stripeSession(order.id,{id:'cs_fixture',
    status:'complete',payment_status:'paid',payment_intent:'pi_fixture'}));
  stripe.get('/v1/payment_intents/pi_fixture').query(true).reply(200,{id:'pi_fixture',livemode:false,
    status:'succeeded',amount:20000,amount_received:20000,currency:'usd',latest_charge:{id:'ch_fixture',
      payment_intent:'pi_fixture',livemode:false,status:'succeeded',paid:true,captured:true,
      refunded:true,disputed:false,amount_refunded:20000,amount:20000,currency:'usd'}});
  stripe.get('/v1/refunds').query({payment_intent:'pi_fixture',limit:'100'}).reply(200,{object:'list',
    has_more:false,data:[{id:'re_fixture',object:'refund',livemode:false,payment_intent:'pi_fixture',
      charge:'ch_fixture',currency:'usd',amount:10000,status:'succeeded'},
    {id:'re_first',object:'refund',livemode:false,payment_intent:'pi_fixture',
      charge:'ch_fixture',currency:'usd',amount:10000,status:'succeeded'}]});
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).done,1);
  await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});
  const inspected=await f.repository('event-inspect',{now:f.state.now});
  assert.equal(inspected.counts.done,1);assert.equal(inspected.counts.review,1);
  assert.ok(nock.isDone());
});

test('pending Stripe full-refund hint retries the same event and revokes only after final proof',async t=>{
  const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'pending-stripe-refund',
    provider:'stripe',account:'acct_fixture',amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
  const claim=await f.repository('claim',{customer,now:f.state.now,orderId:order.id});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,generation:claim.generation,
    remoteId:'cs_fixture',response:{remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_fixture'}});
  await f.repository('settle',{customer,now:f.state.now+1,orderId:order.id,remoteId:'cs_fixture',
    paymentId:'pi_fixture',amountCents:20000,currency:'USD'});
  await f.repository('event-receive',{now:f.state.now+2,event:{provider:'stripe',account:'acct_fixture',
    environment:'sandbox',eventId:'evt_refund_pending',eventType:'refund.created',
    resourceId:'re_fixture',resourceKind:'refund'}});
  f.adapters.stripe.paymentForRefund=async()=> 'pi_fixture';
  f.adapters.stripe.inspectRefund=async()=>({kind:'review',provider:'stripe',reason:'refund-pending'});
  f.state.now+=3;
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).retried,1);
  assert.equal((await f.service.download(request(),order.id)).sha256,digest);
  const pending=await f.repository('event-inspect',{now:f.state.now});
  assert.equal(pending.counts.queued,1);assert.equal(pending.events[0].reason,'refund-pending');
  f.state.now+=31;
  f.adapters.stripe.inspectRefund=async()=>({kind:'full-refund',provider:'stripe',providerRef:'re_fixture'});
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).done,1);
  await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});
  assert.equal((await f.repository('event-inspect',{now:f.state.now})).counts.done,1);
});

test('Stripe closed lost dispute re-fetches exact proof and atomically revokes future access with GET only',async t=>{
  const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'dispute-stripe',
    provider:'stripe',account:'acct_fixture',amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,
    remoteId:'cs_fixture',response:{remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_fixture'}});
  await f.repository('settle',{customer,now:f.state.now+1,orderId:order.id,remoteId:'cs_fixture',
    paymentId:'pi_fixture',amountCents:20000,currency:'USD'});
  await f.repository('event-receive',{now:f.state.now+2,event:{provider:'stripe',account:'acct_fixture',
    environment:'sandbox',eventId:'evt_dispute',eventType:'charge.dispute.closed',resourceId:'du_fixture',resourceKind:'dispute'}});
  f.state.now+=3;
  const stripe=nock('https://api.stripe.com');
  stripe.get('/v1/account').twice().reply(200,{id:'acct_fixture',object:'account'});
  stripe.get('/v1/disputes/du_fixture').twice().reply(200,{id:'du_fixture',object:'dispute',livemode:false,
    status:'lost',charge:'ch_fixture',payment_intent:'pi_fixture',amount:10000,currency:'usd'});
  stripe.get('/v1/charges/ch_fixture').reply(200,{id:'ch_fixture',object:'charge',livemode:false,
    status:'succeeded',paid:true,captured:true,amount:20000,currency:'usd',payment_intent:'pi_fixture'});
  stripe.get('/v1/checkout/sessions/cs_fixture').reply(200,stripeSession(order.id,{id:'cs_fixture',
    status:'complete',payment_status:'paid',payment_intent:'pi_fixture'}));
  stripe.get('/v1/payment_intents/pi_fixture').query(true).reply(200,{id:'pi_fixture',livemode:false,
    status:'succeeded',amount:20000,amount_received:20000,currency:'usd',latest_charge:{id:'ch_fixture',
      payment_intent:'pi_fixture',livemode:false,status:'succeeded',paid:true,captured:true,
      amount:20000,currency:'usd'}});
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).done,1);
  await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});
  assert.equal((await f.service.restore(request(),order.id)).revocationReason,'lost-dispute');
  assert.equal((await f.service.list(request())).orders.find(item=>item.orderId===order.id)?.revocationReason,'lost-dispute');
  const inspected=await f.repository('event-inspect',{now:f.state.now});
  assert.equal(inspected.counts.done,1);assert.equal(inspected.events[0].reason,'verified-lost-dispute');
  assert.ok(nock.isDone());
});

test('PayPal refund hint records only fresh bound full proof and revokes future access',async t=>{
  const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'paypal-refund-event',
    provider:'paypal',account:'MERCHANT123',amountCents:20000,
    terms:{amountCents:20000,currency:'USD'}});
  const claim=await f.repository('claim',{customer,now:f.state.now,orderId:order.id});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,generation:claim.generation,
    remoteId:'ORDER123',response:{remoteId:'ORDER123',checkoutUrl:'https://www.sandbox.paypal.com/checkoutnow?token=ORDER123'}});
  await f.repository('settle',{customer,now:f.state.now+1,orderId:order.id,remoteId:'ORDER123',
    paymentId:'CAPTURE123',amountCents:20000,currency:'USD'});
  await f.repository('event-receive',{now:f.state.now+2,event:{provider:'paypal',account:'MERCHANT123',
    environment:'sandbox',eventId:'WH-REFUND123',eventType:'PAYMENT.CAPTURE.REFUNDED',
    resourceId:'REFUND123',resourceKind:'refund'}});
  const calls=[];
  f.adapters.paypal.captureForKnownRefund=async id=>{calls.push(['refund',id]);return 'CAPTURE123';};
  f.adapters.paypal.inspectKnownRefund=async(id,_terms,paymentId,refundId)=>{
    calls.push(['proof',id,paymentId,refundId]);
    return {kind:'full-refund',provider:'paypal',providerRef:refundId};
  };
  f.state.now+=3;
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).done,1);
  assert.deepEqual(calls,[['refund','REFUND123'],['proof','ORDER123','CAPTURE123','REFUND123']]);
  await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});
  assert.equal((await f.repository('event-inspect',{now:f.state.now})).events[0].reason,'verified-full-refund');
});

test('PayPal partial proof and unknown webhook resource stay review-only',async t=>{
  const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'paypal-partial-event',
    provider:'paypal',account:'MERCHANT123',amountCents:20000,
    terms:{amountCents:20000,currency:'USD'}});
  const claim=await f.repository('claim',{customer,now:f.state.now,orderId:order.id});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,generation:claim.generation,
    remoteId:'ORDER123',response:{remoteId:'ORDER123',checkoutUrl:'https://www.sandbox.paypal.com/checkoutnow?token=ORDER123'}});
  await f.repository('settle',{customer,now:f.state.now+1,orderId:order.id,remoteId:'ORDER123',
    paymentId:'CAPTURE123',amountCents:20000,currency:'USD'});
  const receive=(eventId,resourceKind)=>f.repository('event-receive',{now:f.state.now+2,
    event:{provider:'paypal',account:'MERCHANT123',environment:'sandbox',eventId,
      eventType:'PAYMENT.CAPTURE.REFUNDED',resourceId:'REFUND123',resourceKind}});
  await receive('WH-UNKNOWN','capture');await receive('WH-PARTIAL','refund');
  let calls=0;
  f.adapters.paypal.captureForKnownRefund=async()=>{calls++;return 'CAPTURE123';};
  f.adapters.paypal.inspectKnownRefund=async()=>({kind:'partial-refund',provider:'paypal',providerRef:'REFUND123'});
  f.state.now+=3;
  const summary=await processEvents({...f,clock:()=>f.state.now});
  assert.equal(summary.claimed,2);assert.equal(calls,1);
  assert.equal((await f.repository('event-inspect',{now:f.state.now})).counts.review,2);
  assert.equal((await f.service.download(request(),order.id)).sha256,digest);
});

test('dispute reversal bridge rejects wrong event resource, payment and stale claim before revocation',async t=>{
  const f=await fixture(t),{customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'dispute-fence',
    provider:'stripe',account:'acct_fixture',amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,
    remoteId:'cs_fixture',response:{remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_fixture'}});
  await f.repository('settle',{customer,now:f.state.now+1,orderId:order.id,remoteId:'cs_fixture',
    paymentId:'pi_fixture',amountCents:20000,currency:'USD'});
  const receive=(eventId,eventType)=>f.repository('event-receive',{now:f.state.now,event:{provider:'stripe',
    account:'acct_fixture',environment:'sandbox',eventId,eventType,resourceId:'du_fixture',resourceKind:'dispute'}});
  const proof={orderId:order.id,remoteId:'cs_fixture',paymentId:'pi_fixture',providerRef:'du_fixture',kind:'lost-dispute'};
  await receive('evt_not_closed','charge.dispute.created');
  const wrong=await f.repository('event-claim',{now:f.state.now});
  await assert.rejects(()=>f.repository('event-record-reversal',{event:wrong,proof,now:f.state.now+1}),
    {code:'event-dispute-mismatch'});
  await f.repository('event-finish',{event:wrong,outcome:'review',reason:'event-policy-review',now:f.state.now+1});
  await receive('evt_closed','charge.dispute.closed');
  const first=await f.repository('event-claim',{now:f.state.now+1});
  for(const change of [{providerRef:'du_other'},{paymentId:'pi_other'},{remoteId:'cs_other'}])
    await assert.rejects(()=>f.repository('event-record-reversal',{event:first,proof:{...proof,...change},now:f.state.now+2}));
  await assert.rejects(()=>f.repository('event-record-reversal',{event:first,proof,now:f.state.now+61}),
    {code:'event-work-conflict'});
  const newer=await f.repository('event-claim',{now:f.state.now+62});
  await assert.rejects(()=>f.repository('event-record-reversal',{event:first,proof,now:f.state.now+62}),
    {code:'event-work-conflict'});
  assert.equal((await f.service.download(request(),order.id)).sha256,digest);
  assert.equal((await f.repository('event-record-reversal',{event:newer,proof,now:f.state.now+62})).state,'done');
  await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});
});

test('closed won Stripe dispute stays in review without revoking paid access',async t=>{
  const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'dispute-won',
    provider:'stripe',account:'acct_fixture',amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,
    remoteId:'cs_fixture',response:{remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_fixture'}});
  await f.repository('settle',{customer,now:f.state.now+1,orderId:order.id,remoteId:'cs_fixture',
    paymentId:'pi_fixture',amountCents:20000,currency:'USD'});
  await f.repository('event-receive',{now:f.state.now+2,event:{provider:'stripe',account:'acct_fixture',
    environment:'sandbox',eventId:'evt_won',eventType:'charge.dispute.closed',resourceId:'du_won',resourceKind:'dispute'}});
  f.state.now+=3;
  stripeAccount();nock('https://api.stripe.com').get('/v1/disputes/du_won').reply(200,
    {id:'du_won',object:'dispute',livemode:false,status:'won',charge:'ch_fixture',amount:20000,currency:'usd'});
  const result=await processEvents({...f,clock:()=>f.state.now});
  assert.equal(result.done,0);assert.equal(result.review[0].reason,'stripe-dispute-proof-invalid');
  assert.equal((await f.service.download(request(),order.id)).sha256,digest);
  assert.ok(nock.isDone());
});

test('Mercado Pago signed payment hint re-reads full refund and revokes; partial remains review',async t=>{
  const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'reversal-pix',
    provider:'mercadopago',account:'123',amountCents:20000,
    terms:{amountCents:100000,currency:'BRL',payerEmail:'buyer@example.test'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,
    remoteId:'567',response:{remoteId:'567',pixCode:'fixture'}});
  await f.repository('settle',{customer,now:f.state.now+1,orderId:order.id,remoteId:'567',
    paymentId:'567',amountCents:100000,currency:'BRL'});
  const receive=(id)=>f.repository('event-receive',{now:f.state.now,event:{provider:'mercadopago',
    account:'123',environment:'sandbox',eventId:id,eventType:'payment.notification',
    resourceId:'567',resourceKind:'payment'}});
  await receive('pix-partial');f.state.now+=2;
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,
    pix(order.id,{status:'approved',status_detail:'partially_refunded',transaction_amount_refunded:100}));
  nock('https://api.mercadopago.com').get('/v1/payments/567/refunds/').reply(200,
    [{id:31,payment_id:567,amount:100,status:'approved'}]);
  const partial=await processEvents({...f,clock:()=>f.state.now});
  assert.equal(partial.review.length,1);
  assert.equal(partial.review[0].reason,'partial-refund-review');
  assert.equal((await f.service.download(request(),order.id)).sha256,digest);
  const second=await f.repository('prepare',{customer,now:f.state.now,requestKey:'reversal-pix-full',
    provider:'mercadopago',account:'123',amountCents:20000,
    terms:{amountCents:100000,currency:'BRL',payerEmail:'buyer@example.test'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:second.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:second.id})).generation,
    remoteId:'568',response:{remoteId:'568',pixCode:'fixture'}});
  await f.repository('settle',{customer,now:f.state.now+1,orderId:second.id,remoteId:'568',
    paymentId:'568',amountCents:100000,currency:'BRL'});
  await f.repository('event-receive',{now:f.state.now+1,event:{provider:'mercadopago',
    account:'123',environment:'sandbox',eventId:'pix-full',eventType:'payment.notification',
    resourceId:'568',resourceKind:'payment'}});f.state.now+=2;
  nock('https://api.mercadopago.com').get('/v1/payments/568').reply(200,
    pix(second.id,{id:568,status:'refunded',transaction_amount_refunded:1000}));
  nock('https://api.mercadopago.com').get('/v1/payments/568/refunds/').reply(200,
    [{id:32,payment_id:568,amount:1000,status:'approved'}]);
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).done,1);
  await assert.rejects(()=>f.service.download(request(),second.id),{code:'delivery-not-authorized'});
  assert.equal((await f.service.download(request(),order.id)).sha256,digest);
  assert.ok(nock.isDone());
});

test('late Stripe payment uses one idempotent refund command and fresh full outcome before revocation',async t=>{
  const {processLateRefunds}=await import('../src/refund-worker.mjs');const f=await fixture(t);
  const {createHandler}=await import('../src/index.mjs');
  const {Readable}=await import('node:stream');
  const handler=createHandler({auth:f.auth,checkout:f.service,origin,diagnostic:()=>{}});
  const http=async(path,orderId,handle='alice')=>{
    const method=path==='/api/orders'?'GET':'POST';
    const req=Readable.from(method==='GET'?[]:[Buffer.from(JSON.stringify({orderId}))]);
    req.url=path;req.method=method;req.headers={...request(handle,'csrf-'+handle).headers,'content-type':'application/json'};
    const res={headers:{},setHeader(k,v){this.headers[k]=v;},writeHead(status,h){this.status=status;Object.assign(this.headers,h);this.headersSent=true;},end(body){this.body=body;}};
    await handler(req,res);
    return {status:res.status,body:JSON.parse(res.body)};
  };
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'late-refund-command',
    provider:'stripe',account:'acct_fixture',amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,
    remoteId:'cs_fixture',response:{remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_fixture'}});
  f.state.now=order.expires_at+1;
  await f.repository('settle',{customer,now:f.state.now,orderId:order.id,remoteId:'cs_fixture',
    paymentId:'pi_fixture',amountCents:20000,currency:'USD'});
  assert.equal((await f.service.restore(request(),order.id)).lateRefundStatus,'recorded');
  assert.equal((await f.service.list(request())).orders.find(item=>item.orderId===order.id)?.lateRefundStatus,'recorded');
  assert.equal((await f.service.list(request('bob','csrf-bob'))).orders.length,0);
  await assert.rejects(()=>f.service.restore(request('bob','csrf-bob'),order.id));
  const recordedHistory=await http('/api/orders');
  const recordedRestore=await http('/api/restore',order.id);
  assert.equal(recordedHistory.status,200);assert.equal(recordedRestore.status,200);
  assert.equal(recordedHistory.body.orders[0].lateRefundStatus,'recorded');
  assert.equal(recordedRestore.body.lateRefundStatus,'recorded');
  assert.deepEqual((await http('/api/orders',undefined,'bob')).body.orders,[]);
  const crossBuyer=await http('/api/restore',order.id,'bob');
  assert.notEqual(crossBuyer.status,200);
  for(const view of [recordedHistory.body.orders[0],recordedRestore.body]){
    for(const internal of ['late_refund_state','late_refund_lease_until','payment_id','last_reason','full_refund_recorded','lost_dispute_recorded'])
      assert.equal(Object.hasOwn(view,internal),false);
  }
  const stripe=nock('https://api.stripe.com');
  stripe.get('/v1/account').thrice().reply(200,{id:'acct_fixture',object:'account'});
  stripe.get('/v1/checkout/sessions/cs_fixture').thrice().reply(200,stripeSession(order.id,{id:'cs_fixture',
    status:'complete',payment_status:'paid',payment_intent:'pi_fixture'}));
  const charge={id:'ch_fixture',payment_intent:'pi_fixture',livemode:false,status:'succeeded',
    paid:true,captured:true,refunded:false,disputed:false,amount_refunded:0,amount:20000,currency:'usd'};
  stripe.get('/v1/payment_intents/pi_fixture').query(true).reply(200,{id:'pi_fixture',livemode:false,
    status:'succeeded',amount:20000,amount_received:20000,currency:'usd',latest_charge:charge});
  stripe.get('/v1/refunds').query({payment_intent:'pi_fixture',limit:'100'}).reply(200,{object:'list',
    has_more:false,data:[]});
  let posts=0;
  stripe.post('/v1/refunds',body=>{
    posts++;const params=new URLSearchParams(body);
    return params.get('payment_intent')==='pi_fixture'&&params.get('amount')==='20000';
  }).matchHeader('idempotency-key',v=>/^[a-f0-9]{64}$/.test(v)).reply(200,{id:'re_late',
    object:'refund',livemode:false,payment_intent:'pi_fixture',charge:'ch_fixture',
    amount:20000,currency:'usd',status:'succeeded'});
  stripe.get('/v1/payment_intents/pi_fixture').query(true).reply(200,{id:'pi_fixture',livemode:false,
    status:'succeeded',amount:20000,amount_received:20000,currency:'usd',
    latest_charge:{...charge,refunded:true,amount_refunded:20000}});
  stripe.get('/v1/refunds').query({payment_intent:'pi_fixture',limit:'100'}).reply(200,{object:'list',
    has_more:false,data:[{id:'re_late',object:'refund',livemode:false,payment_intent:'pi_fixture',
      charge:'ch_fixture',amount:20000,currency:'usd',status:'succeeded'}]});
  const result=await processLateRefunds({...f,allowProviderMutation:true,clock:()=>f.state.now});
  assert.deepEqual([result.succeeded,result.review.length,posts],[1,0,1]);
  assert.equal((await f.repository('refund-inspect',{now:f.state.now})).counts.succeeded,1);
  assert.equal((await f.service.list(request())).orders.find(item=>item.orderId===order.id)?.status,'revoked');
  const restored=await f.service.restore(request(),order.id);
  assert.equal(restored.state,'revoked');
  assert.equal(restored.ledgerStatus,'revoked');
  assert.equal(restored.revocationReason,'full-refund');
  assert.equal(restored.lateRefundStatus,'verified-full-refund');
  const finalHistory=await http('/api/orders');
  const finalRestore=await http('/api/restore',order.id);
  assert.equal(finalHistory.body.orders[0].lateRefundStatus,'verified-full-refund');
  assert.equal(finalRestore.body.lateRefundStatus,'verified-full-refund');
  assert.equal(finalHistory.body.orders[0].revocationReason,'full-refund');
  assert.equal(finalRestore.body.revocationReason,'full-refund');
  await f.repository('event-receive',{now:f.state.now+1,event:{provider:'stripe',account:'acct_fixture',
    environment:'sandbox',eventId:'evt_later_lost_dispute',eventType:'charge.dispute.closed',
    resourceId:'du_later',resourceKind:'dispute'}});
  const dispute=await f.repository('event-claim',{now:f.state.now+1});
  await f.repository('event-record-reversal',{event:dispute,now:f.state.now+2,
    proof:{orderId:order.id,remoteId:'cs_fixture',paymentId:'pi_fixture',providerRef:'du_later',kind:'lost-dispute'}});
  f.state.now+=3;
  const disputedHistory=await http('/api/orders');
  const disputedRestore=await http('/api/restore',order.id);
  for(const view of [disputedHistory.body.orders[0],disputedRestore.body]){
    assert.equal(view.revocationReason,'lost-dispute');
    assert.equal(view.lateRefundStatus,undefined);
  }
  assert.equal(restored.result.checkoutUrl,undefined);
  assert.deepEqual(await f.service.confirm(request(),order.id),{orderId:order.id,status:'revoked'});
  assert.equal((await f.service.lookup(request(),{requestKey:'late-refund-command'})).status,'revoked');
  await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});
  assert.ok(nock.isDone());
});

test('pending late Stripe refund is rechecked without another command before revocation',async t=>{
  const {processLateRefunds}=await import('../src/refund-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'late-pending-recheck',
    provider:'stripe',account:'acct_fixture',amountCents:20000,
    terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,
    remoteId:'cs_fixture',response:{remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_fixture'}});
  f.state.now=order.expires_at+1;
  await f.repository('settle',{customer,now:f.state.now,orderId:order.id,remoteId:'cs_fixture',
    paymentId:'pi_fixture',amountCents:20000,currency:'USD'});
  let issued=0,reads=0;
  const adapters={stripe:{account:'acct_fixture',refundPaymentId:async()=> 'pi_fixture',
    inspectRefund:async()=>{
      reads++;
      if(reads===1)return {kind:'unrefunded',provider:'stripe'};
      if(reads===2)return {kind:'review',provider:'stripe',reason:'refund-pending'};
      return {kind:'full-refund',provider:'stripe',providerRef:'re_final'};
    },
    issueFullRefund:async()=>{issued++;return {providerRef:'re_final',status:'pending'};}}};
  const run=()=>processLateRefunds({repository:f.repository,adapters,clock:()=>f.state.now,
    allowProviderMutation:true});
  const first=await run();
  assert.deepEqual([first.claimed,first.retried,first.succeeded,issued,reads],[1,1,0,1,2]);
  assert.equal((await f.repository('refund-inspect',{now:f.state.now})).counts.queued,1);
  assert.equal((await run()).claimed,0);
  f.state.now+=60;
  const second=await run();
  assert.deepEqual([second.claimed,second.succeeded,issued,reads],[1,1,1,3]);
  assert.equal((await f.repository('refund-inspect',{now:f.state.now})).counts.succeeded,1);
  assert.equal((await f.service.restore(request(),order.id)).state,'revoked');
  await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});
});

test('explicit operator GET-only recheck resolves a reviewed full refund with no second POST',async t=>{
  const {recheckReviewedLateRefund}=await import('../src/refund-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'late-operator-full',
    provider:'stripe',account:'acct_fixture',amountCents:20000,
    terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,
    remoteId:'cs_fixture',response:{remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_fixture'}});
  f.state.now=order.expires_at+1;
  await f.repository('settle',{customer,now:f.state.now,orderId:order.id,remoteId:'cs_fixture',
    paymentId:'pi_fixture',amountCents:20000,currency:'USD'});
  const first=await f.repository('refund-claim',{now:f.state.now});
  await f.repository('refund-command-start',{now:f.state.now,
    work:{orderId:order.id,generation:first.generation},
    proof:{remoteId:'cs_fixture',paymentId:'pi_fixture'}});
  await f.repository('refund-finish',{now:f.state.now,
    work:{orderId:order.id,generation:first.generation},outcome:'review',
    reason:'refund-recheck-attempts-exhausted'});
  assert.deepEqual(await f.repository('refund-review-preflight',
    {orderId:order.id,generation:first.generation,now:f.state.now}),{eligible:true});
  let reads=0;
  const adapters={stripe:{account:'acct_fixture',refundPaymentId:async()=> 'pi_fixture',
    inspectRefund:async()=>{reads++;return {kind:'full-refund',provider:'stripe',providerRef:'re_final'};},
    issueFullRefund:async()=>{throw Error('forbidden second POST');}}};
  const result=await recheckReviewedLateRefund({repository:f.repository,adapters,
    orderId:order.id,generation:first.generation,operatorRef:'operator_one',clock:()=>f.state.now});
  assert.deepEqual(result,{outcome:'verified-full-refund',orderId:order.id});
  assert.equal(reads,1);
  assert.equal((await f.repository('refund-inspect',{now:f.state.now})).counts.succeeded,1);
  assert.deepEqual(await f.repository('refund-review-preflight',
    {orderId:order.id,generation:first.generation+1,now:f.state.now}),{eligible:false});
  assert.equal((await f.service.restore(request(),order.id)).state,'revoked');
  await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});
});

test('trusted full-refund event winning an operator recheck reports success without a second POST',async t=>{
  const {recheckReviewedLateRefund}=await import('../src/refund-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'late-operator-event-race',
    provider:'stripe',account:'acct_fixture',amountCents:20000,
    terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,
    remoteId:'cs_fixture',response:{remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/cs_fixture'}});
  f.state.now=order.expires_at+1;
  await f.repository('settle',{customer,now:f.state.now,orderId:order.id,remoteId:'cs_fixture',
    paymentId:'pi_fixture',amountCents:20000,currency:'USD'});
  const first=await f.repository('refund-claim',{now:f.state.now});
  await f.repository('refund-command-start',{now:f.state.now,
    work:{orderId:order.id,generation:first.generation},
    proof:{remoteId:'cs_fixture',paymentId:'pi_fixture'}});
  await f.repository('refund-finish',{now:f.state.now,
    work:{orderId:order.id,generation:first.generation},outcome:'review',
    reason:'refund-recheck-attempts-exhausted'});
  let reads=0;
  const adapters={stripe:{account:'acct_fixture',refundPaymentId:async()=> 'pi_fixture',
    inspectRefund:async()=>{
      reads++;
      await f.repository('event-receive',{now:f.state.now,event:{provider:'stripe',
        account:'acct_fixture',environment:'sandbox',eventId:'evt_operator_race',
        eventType:'refund.updated',resourceId:'re_event',resourceKind:'refund'}});
      const event=await f.repository('event-claim',{now:f.state.now});
      assert.equal((await f.repository('event-record-reversal',{now:f.state.now,event,
        proof:{orderId:order.id,remoteId:'cs_fixture',paymentId:'pi_fixture',
          providerRef:'re_event',kind:'full-refund'}})).state,'done');
      assert.deepEqual(await f.repository('refund-review-status',{work:{orderId:order.id,
        generation:first.generation+1},now:f.state.now}),{verifiedFullRefund:true});
      return {kind:'full-refund',provider:'stripe',providerRef:'re_event'};
    },issueFullRefund:async()=>{throw Error('forbidden second POST');}}};
  const result=await recheckReviewedLateRefund({repository:f.repository,adapters,
    orderId:order.id,generation:first.generation,operatorRef:'operator_one',clock:()=>f.state.now});
  assert.deepEqual(result,{outcome:'verified-full-refund',orderId:order.id,source:'recorded-full-refund'});
  assert.equal(reads,1);
  assert.equal((await f.repository('refund-inspect',{now:f.state.now})).counts.succeeded,1);
  assert.equal((await f.service.restore(request(),order.id)).state,'revoked');
  await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});
});

test('late Pix payment uses one exact-amount refund command and provider re-read before revocation',async t=>{
  const {processLateRefunds}=await import('../src/refund-worker.mjs');const f=await fixture(t);
  const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'late-pix-refund',
    provider:'mercadopago',account:'123',amountCents:20000,
    terms:{amountCents:100000,currency:'BRL',payerEmail:'buyer@example.test'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,
    generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,
    remoteId:'567',response:{remoteId:'567',pixCode:'fixture'}});
  f.state.now=order.expires_at+1;
  await f.repository('settle',{customer,now:f.state.now,orderId:order.id,remoteId:'567',
    paymentId:'567',amountCents:100000,currency:'BRL'});
  const mp=nock('https://api.mercadopago.com');
  mp.get('/v1/payments/567').twice().reply(200,pix(order.id,{status:'approved',
    status_detail:'accredited',transaction_amount_refunded:0}));
  mp.get('/v1/payments/567/refunds/').reply(200,[]);
  let posts=0;
  mp.post('/v1/payments/567/refunds',body=>{posts++;return body.amount===1000;})
    .matchHeader('x-idempotency-key',v=>/^[a-f0-9]{64}$/.test(v)).reply(201,
      {id:77,payment_id:567,amount:1000,status:'approved'});
  mp.get('/v1/payments/567').reply(200,pix(order.id,{status:'refunded',
    transaction_amount_refunded:1000}));
  mp.get('/v1/payments/567/refunds/').reply(200,[{id:77,payment_id:567,
    amount:1000,status:'approved'}]);
  const result=await processLateRefunds({...f,allowProviderMutation:true,clock:()=>f.state.now});
  assert.deepEqual([result.succeeded,result.review.length,posts],[1,0,1]);
  assert.equal((await f.repository('refund-inspect',{now:f.state.now})).counts.succeeded,1);
  await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});
  assert.ok(nock.isDone());
});

test('PayPal event worker resolves capture through SDK and verifies order without capture requests',async t=>{
  const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t);const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'paypal-event',provider:'paypal',account:'MERCHANT123',amountCents:20000,terms:{amountCents:20000,currency:'USD'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,remoteId:'ORDER123',response:{remoteId:'ORDER123',checkoutUrl:'https://www.sandbox.paypal.com/checkoutnow?token=ORDER123'}});
  await f.repository('event-receive',{now:f.state.now,event:{provider:'paypal',account:'MERCHANT123',environment:'sandbox',eventId:'capture-event',eventType:'PAYMENT.CAPTURE.COMPLETED',resourceId:'CAPTURE123',resourceKind:'capture'}});
  nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').reply(200,{access_token:'fixture-token',token_type:'Bearer',expires_in:3600});
  nock('https://api-m.sandbox.paypal.com').get('/v2/payments/captures/CAPTURE123').twice().reply(200,{id:'CAPTURE123',status:'COMPLETED',amount:{currency_code:'USD',value:'200.00'},supplementary_data:{related_ids:{order_id:'ORDER123'}}});
  const completed=paypalOrder(order.id,{status:'COMPLETED'});completed.purchase_units[0].payments={captures:[{id:'CAPTURE123',status:'COMPLETED',final_capture:true,amount:{currency_code:'USD',value:'200.00'}}]};
  nock('https://api-m.sandbox.paypal.com').get('/v2/checkout/orders/ORDER123').reply(200,completed);
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).done,1);assert.equal((await f.service.download(request(),order.id)).sha256,digest);assert.ok(nock.isDone());
});

test('policy-sensitive events stay in review while provider failures retry without leaking errors',async t=>{
  const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t);const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'worker-failure',provider:'mercadopago',account:'123',amountCents:20000,terms:{amountCents:100000,currency:'BRL'}});
  await f.repository('bind',{customer,now:f.state.now,orderId:order.id,generation:(await f.repository('claim',{customer,now:f.state.now,orderId:order.id})).generation,remoteId:'567',response:{remoteId:'567',pixCode:'fixture'}});
  for(const event of [{provider:'stripe',account:'acct_fixture',eventId:'refund-review',eventType:'charge.refunded',resourceId:'ch_fixture',resourceKind:'charge'},{provider:'mercadopago',account:'123',eventId:'provider-failure',eventType:'payment.notification',resourceId:'567',resourceKind:'payment'}])await f.repository('event-receive',{now:f.state.now,event:{...event,environment:'sandbox'}});
  f.adapters.mercadopago.verify=async()=>{throw Error('private-provider-secret');};
  const result=await processEvents({...f,clock:()=>f.state.now});assert.equal(result.claimed,2);assert.equal(result.review.length,1);assert.equal(result.retried,1);assert.equal(result.done,0);assert.doesNotMatch(JSON.stringify(result),/private-provider-secret/);
  assert.equal((await processEvents({...f,clock:()=>f.state.now})).claimed,0);await assert.rejects(()=>f.service.download(request(),order.id));
});

test('event inspection shows deferred retries, review, expired leases and capacity without claiming work',async t=>{
  const {repository,state}=await fixture(t);const now=state.now;
  const inspect=extra=>repository('event-inspect',{now,...extra});
  assert.equal((await inspect()).total,0);
  for(let i=0;i<23;i++)await repository('event-receive',{now,event:{provider:'stripe',account:'acct_fixture',environment:'sandbox',eventId:`evt_${String(i).padStart(2,'0')}`,eventType:'charge.refunded',resourceId:'ch_fixture',resourceKind:'charge'}});
  const claim=()=>repository('event-claim',{now});
  const first=await claim();await repository('event-finish',{now,event:first,outcome:'retry',reason:'provider-or-ledger-unavailable'});
  const second=await claim();await repository('event-finish',{now,event:second,outcome:'review',reason:'event-policy-review'});
  const third=await claim();await repository('event-finish',{now,event:third,outcome:'done',reason:'payment-verified'});
  await claim();
  const a=await inspect();assert.deepEqual(a.counts,{queued:20,processing:1,review:1,done:1});
  assert.equal(a.due,19);assert.equal(a.deferred,1);assert.equal(a.expiredLeases,0);assert.equal(a.remaining,9977);
  assert.equal(a.events.length,20);assert.ok(a.next);assert.deepEqual(await inspect(),a);
  const b=await inspect({after:a.next});assert.equal(b.events.length,3);assert.equal(b.next,null);
  assert.equal(new Set([...a.events,...b.events].map(e=>e.event_id)).size,23);
  const review=await inspect({state:'review'});assert.equal(review.events.length,1);assert.equal(review.events[0].reason,'event-policy-review');assert.deepEqual(review.counts,a.counts);
  const later=await inspect({now:now+61});assert.equal(later.expiredLeases,1);assert.equal(later.deferred,0);assert.equal(later.due,20);
  for(const input of [{after:-1},{after:1.5},{state:'unknown'}])await assert.rejects(()=>inspect(input));
  assert.equal('customer' in a.events[0],false);assert.equal('terms' in a.events[0],false);
});

test('review retry is atomic, audited and generation-bound; it never approves unsupported events',async t=>{
  const {repository,state,adapters,root}=await fixture(t);const now=state.now;
  const {processEvents}=await import('../src/event-worker.mjs');
  await repository('event-receive',{now,event:{provider:'stripe',account:'acct_fixture',environment:'sandbox',eventId:'evt_review',eventType:'charge.refunded',resourceId:'ch_refund',resourceKind:'charge'}});
  const run=()=>processEvents({repository,adapters,clock:()=>now});
  assert.equal((await run()).review.length,1);
  const original=(await repository('event-inspect',{now})).events[0];
  const event={provider:original.provider,account:original.account,environment:original.environment,event_id:original.event_id,generation:original.generation};
  const retry=changes=>repository('event-requeue',{now,event,reason:'configuration-corrected',...changes});
  for(const changes of [{event:{...event,account:'wrong'}},{event:{...event,environment:'live'}},{event:{...event,generation:0}},{reason:'approve-payment'}])await assert.rejects(()=>retry(changes));
  const attempts=await Promise.allSettled([retry(),retry()]);assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(attempts.find(r=>r.status==='rejected').reason.code,'event-work-conflict');
  const queued=(await repository('event-inspect',{now})).events[0];
  assert.equal(queued.state,'queued');assert.equal(queued.requeues,1);assert.equal(queued.generation,event.generation+1);
  assert.equal(queued.attempts,original.attempts);
  assert.equal((await run()).review.length,1); // Requeue cannot override unsupported/refund policy.
  await assert.rejects(()=>retry(),{code:'event-work-conflict'});
  const reviewed=(await repository('event-inspect',{now})).events[0];assert.equal(reviewed.requeues,1);assert.equal(reviewed.generation,event.generation+2);
  const {execFileSync}=await import('node:child_process');
  const audit=JSON.parse(execFileSync('python3',['-c',"import sqlite3,json,sys; c=sqlite3.connect(sys.argv[1]); c.row_factory=sqlite3.Row; print(json.dumps([dict(r) for r in c.execute('SELECT generation,review_reason,action_reason,created_at FROM sdk_event_review_actions')]))",join(root,'ledger.db')],{encoding:'utf8'}));
  assert.deepEqual(audit,[{generation:event.generation,review_reason:'event-policy-review',action_reason:'configuration-corrected',created_at:now}]);
  assert.equal(nock.pendingMocks().length,0);
});

test('lost paid Pix response is recovered with SDK proof, survives settlement failure and restores buyer delivery',async t=>{
  const {recoverPayment}=await import('../src/recover-payment.mjs');const f=await fixture(t);const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'recover-paid',provider:'mercadopago',account:'123',amountCents:20000,terms:{amountCents:100000,currency:'BRL',payerEmail:'buyer@example.test'}});
  const claim=await f.repository('claim',{customer,orderId:order.id,now:f.state.now});
  const recover=repository=>recoverPayment({...f,repository:repository??f.repository,orderId:order.id,remoteId:'567',clock:()=>f.state.now});
  await assert.rejects(()=>recover(),{code:'checkout-attempt-changed'}); // Active create lease.
  await f.repository('creation-failed',{customer,orderId:order.id,now:f.state.now,generation:claim.generation,definite:false});
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix('wrong-order',{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
  await assert.rejects(()=>recover(),{code:'pix-terms-mismatch'});
  assert.equal((await f.repository('get',{customer,orderId:order.id,now:f.state.now})).remote_id,null);
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(order.id,{status:'pending'}));
  await assert.rejects(()=>recover(),{code:'recovery-payment-not-complete'});
  const proof=()=>nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(order.id,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
  proof();await assert.rejects(()=>recover((op,args)=>op==='settle'?Promise.reject(Error('lost database response')):f.repository(op,args)));
  assert.equal((await f.repository('get',{customer,orderId:order.id,now:f.state.now})).remote_id,'567');
  await assert.rejects(()=>f.service.download(request(),order.id));
  proof();assert.equal((await recover()).status,'paid');
  proof();assert.equal((await recover()).status,'paid');
  const restored=await f.service.restore(request(),order.id);assert.equal(restored.state,'paid');assert.equal(restored.result.recovered,true);assert.equal(restored.result.pixCode,undefined);
  assert.equal(Buffer.from((await f.service.download(request(),order.id)).data,'base64').toString(),'ARE sandbox fixture');
  await assert.rejects(()=>f.service.restore(request('bob','csrf-bob'),order.id));assert.ok(nock.isDone());
});

test('recovery rejects a racing creation generation and preserves late-payment review without capture',async t=>{
  const {recoverPayment}=await import('../src/recover-payment.mjs');const f=await fixture(t);const {customer}=await f.auth.identity(request());
  const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'recover-late',provider:'paypal',account:'MERCHANT123',amountCents:20000,terms:{amountCents:20000,currency:'USD',payerEmail:null}});
  let claim=await f.repository('claim',{customer,orderId:order.id,now:f.state.now});f.state.now+=61;
  let race=true;const adapters={paypal:{account:'MERCHANT123',async verify(id,terms,options){assert.deepEqual(options,{capture:false});if(race){claim=await f.repository('claim',{customer,orderId:order.id,now:f.state.now});}return 'CAPTURE123';}}};
  const recover=()=>recoverPayment({...f,adapters,orderId:order.id,remoteId:'ORDER123',clock:()=>f.state.now});
  await assert.rejects(()=>recover(),{code:'checkout-attempt-changed'});
  assert.equal((await f.repository('get',{customer,orderId:order.id,now:f.state.now})).remote_id,null);
  race=false;f.state.now=order.expires_at+1;
  assert.equal((await recover()).status,'paid-review');await assert.rejects(()=>f.service.download(request(),order.id));
});

test('Mercado Pago SDK discovery preserves uncertainty and recovers only one freshly verified paid candidate',async t=>{
 const {discoverPayment}=await import('../src/discover-payment.mjs');const f=await fixture(t);const {customer}=await f.auth.identity(request());
 const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'discover-pix',provider:'mercadopago',account:'123',amountCents:20000,terms:{amountCents:100000,currency:'BRL',payerEmail:'buyer@example.test'}});
 const claim=await f.repository('claim',{customer,orderId:order.id,now:f.state.now});
 const discover=recover=>discoverPayment({...f,orderId:order.id,recover,clock:()=>f.state.now});
 await assert.rejects(()=>discover(false),{code:'checkout-attempt-changed'});
 await f.repository('creation-failed',{customer,orderId:order.id,now:f.state.now,generation:claim.generation,definite:false});
 const search=(ids,total=ids.length)=>nock('https://api.mercadopago.com').get('/v1/payments/search').query(q=>q.external_reference===order.id&&q.limit==='20'&&q.offset==='0'&&q.sort==='date_created'&&q.criteria==='asc'&&q.range==='date_created'&&q.begin_date===new Date((f.state.now-300)*1000).toISOString()&&q.end_date===new Date(f.state.now*1000).toISOString()).reply(200,{paging:{total,limit:20,offset:0},results:ids.map(id=>({id,external_reference:order.id,payer:{email:'must-not-appear@example.test'}}))});
 search([]);assert.equal((await discover(true)).outcome,'not-observed');
 search(['567','568']);assert.equal((await discover(true)).outcome,'ambiguous');
 search(Array.from({length:20},(_,i)=>String(100+i)),21);assert.equal((await discover(true)).outcome,'incomplete');
 search(['567']);nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(order.id,{status:'pending'}));assert.equal((await discover(true)).outcome,'not-paid');
 const proof=()=>nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(order.id,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
 search(['567']);proof();const inspected=await discover(false);assert.equal(inspected.outcome,'verified-paid');assert.equal(JSON.stringify(inspected).includes('payer'),false);
 assert.equal((await f.repository('get',{customer,orderId:order.id,now:f.state.now})).remote_id,null);
 search(['567']);proof();proof();assert.equal((await discover(true)).status,'paid');
 assert.equal(Buffer.from((await f.service.download(request(),order.id)).data,'base64').toString(),'ARE sandbox fixture');assert.ok(nock.isDone());
});

test('Mercado Pago discovery rejects malformed paging, mismatched references, unsafe IDs and duplicate resources',async t=>{
 const f=await fixture(t),terms={orderId:'a'.repeat(32)},range={begin:f.state.now-300,end:f.state.now};
 const valid={paging:{total:1,limit:20,offset:0},results:[{id:'567',external_reference:terms.orderId}]};
 for(const body of [{}, {...valid,paging:{total:-1,limit:20,offset:0}}, {...valid,paging:{total:2,limit:20,offset:0}}, {...valid,results:[{id:'567',external_reference:'other'}]}, {...valid,results:[{id:9007199254740992,external_reference:terms.orderId}]}, {paging:{total:2,limit:20,offset:0},results:[...valid.results,...valid.results]}]){
   nock('https://api.mercadopago.com').get('/v1/payments/search').query(true).reply(200,body);
   await assert.rejects(()=>f.adapters.mercadopago.discover(terms,range),{code:'discovery-response-invalid'});
 }
 nock('https://api.mercadopago.com').get('/v1/payments/search').query(true).reply(503,{message:'private-provider-detail'});
 await assert.rejects(()=>f.adapters.mercadopago.discover(terms,range));assert.ok(nock.isDone());
});

test('Stripe SDK discovery scans cursors and recovers a unique paid session without another create',async t=>{
 const {discoverPayment}=await import('../src/discover-payment.mjs');const f=await fixture(t);const {customer}=await f.auth.identity(request());
 const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'discover-stripe',provider:'stripe',account:'acct_fixture',amountCents:20000,terms:{amountCents:20000,currency:'USD',payerEmail:null}});
 const claim=await f.repository('claim',{customer,orderId:order.id,now:f.state.now});await f.repository('creation-failed',{customer,orderId:order.id,now:f.state.now,generation:claim.generation,definite:false});
 stripeAccount();
 nock('https://api.stripe.com').get('/v1/checkout/sessions').query(q=>q.limit==='20'&&q['created[gte]']===String(f.state.now-300)&&q['created[lte]']===String(f.state.now)&&q.starting_after===undefined).reply(200,{object:'list',has_more:true,data:[{...stripeSession('unrelated'),id:'cs_unrelated',created:f.state.now}]});
 nock('https://api.stripe.com').get('/v1/checkout/sessions').query(q=>q.starting_after==='cs_unrelated').reply(200,{object:'list',has_more:false,data:[{...stripeSession(order.id),created:f.state.now}]});
 for(let i=0;i<2;i++){
   stripeAccount();nock('https://api.stripe.com').get('/v1/checkout/sessions/cs_test_fixture').reply(200,stripeSession(order.id,{status:'complete',payment_status:'paid',payment_intent:'pi_fixture'}));
   nock('https://api.stripe.com').get('/v1/payment_intents/pi_fixture').query(true).reply(200,{id:'pi_fixture',livemode:false,status:'succeeded',amount:20000,amount_received:20000,currency:'usd',latest_charge:{id:'ch_fixture',payment_intent:'pi_fixture',livemode:false,paid:true,captured:true,refunded:false,disputed:false,amount_refunded:0,amount:20000,currency:'usd'}});
 }
 const result=await discoverPayment({...f,orderId:order.id,recover:true,clock:()=>f.state.now});assert.equal(result.status,'paid');assert.equal(result.pages,2);assert.equal(result.scanned,2);assert.deepEqual(result.ids,['cs_test_fixture']);
 assert.equal(Buffer.from((await f.service.download(request(),order.id)).data,'base64').toString(),'ARE sandbox fixture');assert.ok(nock.isDone());
});

test('Stripe discovery bounds scans and rejects repeated cursors, malformed pages and wrong merchant',async t=>{
 const f=await fixture(t),terms={orderId:'a'.repeat(32)},range={begin:f.state.now-300,end:f.state.now};
 const row=id=>({id,object:'checkout.session',created:f.state.now,livemode:false,client_reference_id:terms.orderId});
 stripeAccount();for(let i=0;i<5;i++)nock('https://api.stripe.com').get('/v1/checkout/sessions').query(q=>i===0?q.starting_after===undefined:q.starting_after===`cs_${i-1}`).reply(200,{object:'list',has_more:true,data:[row(`cs_${i}`)]});
 const incomplete=await f.adapters.stripe.discover(terms,range);assert.equal(incomplete.complete,false);assert.equal(incomplete.total,null);assert.equal(incomplete.pages,5);
 stripeAccount();nock('https://api.stripe.com').get('/v1/checkout/sessions').query(true).twice().reply(200,{object:'list',has_more:true,data:[row('cs_repeated')]});await assert.rejects(()=>f.adapters.stripe.discover(terms,range),{code:'discovery-response-invalid'});
 for(const page of [{object:'list',has_more:true,data:[]},{object:'list',data:[]},{object:'list',has_more:false,data:[{...row('cs_live'),livemode:true}]},{object:'list',has_more:false,data:[{...row('cs_old'),created:range.begin-1}]}]){
   stripeAccount();nock('https://api.stripe.com').get('/v1/checkout/sessions').query(true).reply(200,page);await assert.rejects(()=>f.adapters.stripe.discover(terms,range),{code:'discovery-response-invalid'});
 }
 nock('https://api.stripe.com').get('/v1/account').reply(200,{id:'acct_wrong'});await assert.rejects(()=>f.adapters.stripe.discover(terms,range),{code:'merchant-mismatch'});assert.ok(nock.isDone());
});

test('buyer client through HTTP handler, auth adapter and SDK delivers exact bytes then revokes logout access',async t=>{
 const {createHandler}=await import('../src/index.mjs');const {createBuyerClient}=await import('../public/buyer-client.mjs');const {Readable,Writable}=await import('node:stream');
 const f=await fixture(t);let cookie='__Host-keld_session=alice',revocations=0;
 const auth=bindKeldAuth({authenticate:async()=>({subject:'alice',csrf:'csrf-alice'}),touch:async()=>{},checkLogout:async(handle,csrf)=>{assert.equal(handle,'alice');assert.equal(csrf,'csrf-alice');},logout:async()=>{f.state.active=false;revocations++;}},profile);
 const handler=createHandler({auth,checkout:f.service,origin,diagnostic:()=>{}}),stored=new Map();
 const requestThroughHandler=async(path,options={})=>{
   const req=Readable.from(options.body?[Buffer.from(options.body)]:[]);req.url=path;req.method=options.method??'GET';req.headers={host:new URL(origin).host,cookie,...(req.method==='POST'?{origin}:{}),...options.headers};
   let status=200,headers={},body;
   const output=[];const res=new Writable({write(chunk,encoding,done){output.push(Buffer.from(chunk));done();}});
   res.headersSent=false;res.setHeader=(k,v)=>{headers[k]=v;};res.writeHead=(code,h)=>{status=code;headers={...headers,...h};res.headersSent=true;};
   await handler(req,res);body=Buffer.concat(output);
   if(headers['set-cookie']){assert.ok(headers['set-cookie'].some(x=>x.startsWith('__Host-keld_session=;')&&x.includes('Max-Age=0')));cookie='';}
   if(status===303){assert.equal(headers.location,'/signed-out');return requestThroughHandler(headers.location);}
   return new Response(body,{status,headers});
 };
 const client=createBuyerClient({fetch:requestThroughHandler,storage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)},uuid:()=> 'full-buyer-journey'});
 let id;nock('https://api.mercadopago.com').post('/v1/payments',body=>{id=body.external_reference;return true;}).reply(()=>[201,pix(id)]);
 await client.create({provider:'mercadopago',amountCents:20000,payerEmail:'buyer@example.test'});
 await assert.rejects(()=>client.download(),{code:'delivery-not-authorized'});
 nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(id,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
 assert.equal((await client.confirm()).status,'paid');assert.equal(await (await client.download()).text(),'ARE sandbox fixture');
 await client.logout();assert.equal(revocations,1);assert.equal(client.pending(),null);
 assert.deepEqual(await client.session(),{authenticated:false});
 assert.equal((await requestThroughHandler('/api/download',{method:'POST',headers:{'content-type':'application/json','x-csrf-token':'csrf-alice'},body:JSON.stringify({orderId:id})})).status,401);
 assert.ok(nock.isDone());
});

async function uncertainOrder(f,provider,key){
 const {customer}=await f.auth.identity(request());
 const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:key,provider,account:f.adapters[provider].account,amountCents:20000,terms:{amountCents:provider==='mercadopago'?100000:20000,currency:provider==='mercadopago'?'BRL':'USD',payerEmail:provider==='mercadopago'?'buyer@example.test':null}});
 const claim=await f.repository('claim',{customer,orderId:order.id,now:f.state.now});await f.repository('creation-failed',{customer,orderId:order.id,now:f.state.now,generation:claim.generation,definite:false});return {customer,order};
}
test('Stripe unpaid checkout resumes after create retry cutoff without creating or granting access',async t=>{
 const {resumeCheckout}=await import('../src/resume-checkout.mjs');const f=await fixture(t),{order}=await uncertainOrder(f,'stripe','resume-stripe');f.state.now+=1800;
 const resume=()=>resumeCheckout({...f,orderId:order.id,remoteId:'cs_test_fixture',clock:()=>f.state.now});
 for(let i=0;i<2;i++){stripeAccount();nock('https://api.stripe.com').get('/v1/checkout/sessions/cs_test_fixture').reply(200,stripeSession(order.id,{payment_status:'unpaid'}));assert.equal((await resume()).resumed,true);}
 const restored=await f.service.restore(request(),order.id);assert.equal(restored.state,'pending');assert.equal(restored.result.checkoutUrl,'https://checkout.stripe.com/c/pay/cs_test_fixture');
 const result=await f.service.create(request(),{provider:'stripe',amountCents:20000,requestKey:'resume-stripe'});assert.equal(result.orderId,order.id);assert.equal(result.checkoutUrl,restored.result.checkoutUrl);
 await assert.rejects(()=>f.service.download(request(),order.id),{code:'delivery-not-authorized'});assert.ok(nock.isDone());
});
test('Pix resumption checks exact expiry and terms before restoring its original code',async t=>{
 const {resumeCheckout}=await import('../src/resume-checkout.mjs');const f=await fixture(t),{order,customer}=await uncertainOrder(f,'mercadopago','resume-pix');
 const resume=()=>resumeCheckout({...f,orderId:order.id,remoteId:'567',clock:()=>f.state.now});
 for(const extra of [{date_of_expiration:new Date((order.expires_at+1)*1000).toISOString()},{date_of_expiration:new Date(order.expires_at*1000).toISOString(),external_reference:'other'}]){
  nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(order.id,extra));await assert.rejects(()=>resume());
  assert.equal((await f.repository('get',{customer,orderId:order.id,now:f.state.now})).remote_id,null);
 }
 nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(order.id,{date_of_expiration:new Date(order.expires_at*1000).toISOString()}));await resume();
 assert.equal((await f.service.restore(request(),order.id)).result.pixCode,pix(order.id).point_of_interaction.transaction_data.qr_code);await assert.rejects(()=>f.service.download(request(),order.id));assert.ok(nock.isDone());
});
test('approved PayPal checkout resumes for buyer confirmation without implicit capture',async t=>{
 const {resumeCheckout}=await import('../src/resume-checkout.mjs');const f=await fixture(t),{order}=await uncertainOrder(f,'paypal','resume-paypal');
 nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').reply(200,{access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
 nock('https://api-m.sandbox.paypal.com').get('/v2/checkout/orders/ORDER123').reply(200,paypalOrder(order.id,{status:'APPROVED',links:[]}));
 const result=await resumeCheckout({...f,orderId:order.id,remoteId:'ORDER123',clock:()=>f.state.now});assert.equal(result.status,'pending');
 const restored=await f.service.restore(request(),order.id);assert.equal(restored.result.recovered,true);assert.equal(restored.state,'pending');await assert.rejects(()=>f.service.download(request(),order.id));assert.ok(nock.isDone());
});
test('checkout resumption rechecks expiration atomically after the provider response',async t=>{
 const {resumeCheckout}=await import('../src/resume-checkout.mjs');const f=await fixture(t),{order,customer}=await uncertainOrder(f,'stripe','resume-expiring');
 stripeAccount();nock('https://api.stripe.com').get('/v1/checkout/sessions/cs_test_fixture').reply(()=>{f.state.now=order.expires_at;return [200,stripeSession(order.id,{payment_status:'unpaid'})];});
 await assert.rejects(()=>resumeCheckout({...f,orderId:order.id,remoteId:'cs_test_fixture',clock:()=>f.state.now}),{code:'checkout-not-pending'});
 assert.equal((await f.repository('get',{customer,orderId:order.id,now:f.state.now})).remote_id,null);assert.ok(nock.isDone());
});

test('completed event archival preserves deduplication and audit while retaining active and recent events',async t=>{
 const f=await fixture(t),now=f.state.now;
 const event=id=>({provider:'stripe',account:'acct_fixture',environment:'sandbox',eventId:id,eventType:'checkout.session.completed',resourceId:'cs_fixture',resourceKind:'checkout.session'});
 const receive=(id,at=now)=>f.repository('event-receive',{now:at,event:event(id)});
 const finish=async(outcome,at=now)=>{const e=await f.repository('event-claim',{now:at});await f.repository('event-finish',{now:at,event:e,outcome,reason:'fixture-reason'});return e;};
 await receive('archive-a');const reviewed=await finish('review');await f.repository('event-requeue',{now,event:{provider:reviewed.provider,account:reviewed.account,environment:reviewed.environment,event_id:reviewed.event_id,generation:reviewed.generation},reason:'provider-recovered'});await finish('done');
 await receive('archive-b');await finish('review');await receive('archive-c');await f.repository('event-claim',{now});
 await receive('archive-d',now+1);await finish('done',now+1);await receive('archive-e');
 const archive=dryRun=>f.repository('event-archive',{now:now+2,before:now+1,dryRun});
 assert.equal((await archive(true)).wouldArchive,1);assert.equal((await f.repository('event-inspect',{now})).total,5);
 assert.equal((await archive(false)).archived,1);
 const state=await f.repository('event-inspect',{now});assert.deepEqual(state.counts,{queued:1,processing:1,review:1,done:1});assert.equal(state.archive.total,1);assert.equal(state.remaining,9996);
 assert.equal((await f.repository('event-receive',{now:now+3,event:event('archive-a')})).duplicate,true);
 await assert.rejects(()=>f.repository('event-receive',{now:now+3,event:{...event('archive-a'),resourceId:'cs_changed'}}),{code:'event-identity-conflict'});
 assert.equal((await archive(false)).archived,0);await assert.rejects(()=>f.repository('event-archive',{now,before:now+1,dryRun:false}));
 const {execFileSync}=await import('node:child_process');const count=execFileSync('python3',['-c',"import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); print(c.execute('SELECT count(*) FROM sdk_event_review_actions').fetchone()[0])",join(f.root,'ledger.db')],{encoding:'utf8'});assert.equal(Number(count),1);
});

test('archive batches are bounded and failed writes or a full receipt archive cannot lose inbox records',async t=>{
 const f=await fixture(t),now=f.state.now;await f.repository('event-inspect',{now});
 const {execFileSync}=await import('node:child_process');const sql=script=>execFileSync('python3',['-c',"import sqlite3,sys\nc=sqlite3.connect(sys.argv[1])\n"+script+"\nc.commit()",join(f.root,'ledger.db')]);
 sql("c.executemany(\"INSERT INTO sdk_event_inbox VALUES('stripe','acct_fixture','sandbox',?,'checkout.session.completed','cs_fixture','checkout.session','fixture-only',1,'done')\",[(str(i),) for i in range(105)])\nc.execute(\"CREATE TRIGGER archive_failure BEFORE INSERT ON sdk_event_archive BEGIN SELECT RAISE(ABORT,'fixture-failure'); END\")");
 const archive=()=>f.repository('event-archive',{now,before:2,dryRun:false});await assert.rejects(()=>archive(),{code:'ledger-unavailable'});
 let state=await f.repository('event-inspect',{now});assert.equal(state.total,105);assert.equal(state.archive.total,0);
 sql('c.execute("DROP TRIGGER archive_failure")');assert.deepEqual(await archive(),{dryRun:false,archived:100,eligibleRemaining:5,archiveRemaining:99900});
 sql("c.executemany(\"INSERT INTO sdk_event_archive VALUES('stripe','acct_fixture','sandbox',?,'checkout.session.completed','cs_fixture','checkout.session','fixture-only',1,2)\",[('receipt-'+str(i),) for i in range(99900)])");
 await assert.rejects(()=>archive(),{code:'event-archive-capacity'});state=await f.repository('event-inspect',{now});assert.equal(state.total,5);assert.equal(state.archive.total,100000);assert.equal(state.archive.remaining,0);
});

test('payment event recovers a lost Pix binding using full SDK proof before fixture delivery',async t=>{
 const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t),{order}=await uncertainOrder(f,'mercadopago','event-lost-pix');
 await f.repository('event-receive',{now:f.state.now,event:{provider:'mercadopago',account:'123',environment:'sandbox',eventId:'lost-pix',eventType:'payment.notification',resourceId:'567',resourceKind:'payment'}});
 nock('https://api.mercadopago.com').get('/v1/payments/567').twice().reply(200,pix(order.id,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
 assert.equal((await processEvents({...f,clock:()=>f.state.now})).done,1);assert.equal(Buffer.from((await f.service.download(request(),order.id)).data,'base64').toString(),'ARE sandbox fixture');assert.ok(nock.isDone());
});
test('PayPal capture event discovers an unbound local order but rejects cross-provider order references',async t=>{
 const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t),{order}=await uncertainOrder(f,'paypal','event-lost-paypal');
 const receive=(eventId,resourceId)=>f.repository('event-receive',{now:f.state.now,event:{provider:'paypal',account:'MERCHANT123',environment:'sandbox',eventId,eventType:'PAYMENT.CAPTURE.COMPLETED',resourceId,resourceKind:'capture'}});
 await receive('lost-paypal','CAPTURE123');
 nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').reply(200,{access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
 const capture={id:'CAPTURE123',status:'COMPLETED',amount:{currency_code:'USD',value:'200.00'},supplementary_data:{related_ids:{order_id:'ORDER123'}}};
 nock('https://api-m.sandbox.paypal.com').get('/v2/payments/captures/CAPTURE123').twice().reply(200,capture);
 const completed=paypalOrder(order.id,{status:'COMPLETED'});completed.purchase_units[0].payments={captures:[{id:'CAPTURE123',final_capture:true}]};
 nock('https://api-m.sandbox.paypal.com').get('/v2/checkout/orders/ORDER123').twice().reply(200,completed);
 assert.equal((await processEvents({...f,clock:()=>f.state.now})).done,1);assert.equal((await f.service.restore(request(),order.id)).state,'paid');
 const other=await uncertainOrder(f,'stripe','other-provider');await receive('wrong-provider','CAPTURE2');
 nock('https://api-m.sandbox.paypal.com').get('/v2/payments/captures/CAPTURE2').reply(200,{...capture,id:'CAPTURE2',supplementary_data:{related_ids:{order_id:'ORDER2'}}});
 nock('https://api-m.sandbox.paypal.com').get('/v2/checkout/orders/ORDER2').reply(200,paypalOrder(other.order.id,{id:'ORDER2'}));
 const denied=await processEvents({...f,clock:()=>f.state.now});assert.equal(denied.done,0);assert.equal(denied.review[0].reason,'merchant-account-changed');
 assert.equal((await f.repository('get',{customer:other.customer,orderId:other.order.id,now:f.state.now})).remote_id,null);assert.ok(nock.isDone());
});
test('event recovery waits for an active creation lease then recovers after its expiry',async t=>{
 const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t),{customer}=await f.auth.identity(request());
 const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'event-active',provider:'mercadopago',account:'123',amountCents:20000,terms:{amountCents:100000,currency:'BRL',payerEmail:'buyer@example.test'}});
 await f.repository('claim',{customer,orderId:order.id,now:f.state.now});await f.repository('event-receive',{now:f.state.now,event:{provider:'mercadopago',account:'123',environment:'sandbox',eventId:'active-lease',eventType:'payment.notification',resourceId:'567',resourceKind:'payment'}});
 const proof=()=>nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(order.id,{status:'approved',status_detail:'accredited',transaction_amount_refunded:0}));
 proof();assert.equal((await processEvents({...f,clock:()=>f.state.now})).retried,1);assert.equal((await f.repository('get',{customer,orderId:order.id,now:f.state.now})).remote_id,null);
 f.state.now+=61;proof();proof();assert.equal((await processEvents({...f,clock:()=>f.state.now})).done,1);assert.ok(nock.isDone());
});
test('Stripe local-order hint requires a matching retrieved session and sandbox account',async t=>{
 const f=await fixture(t),orderId='a'.repeat(32);
 stripeAccount();nock('https://api.stripe.com').get('/v1/checkout/sessions/cs_test_fixture').reply(200,stripeSession(orderId));assert.equal(await f.adapters.stripe.localOrderFor('cs_test_fixture'),orderId);
 stripeAccount();nock('https://api.stripe.com').get('/v1/checkout/sessions/cs_test_fixture').reply(200,stripeSession(orderId,{livemode:true}));await assert.rejects(()=>f.adapters.stripe.localOrderFor('cs_test_fixture'),{code:'provider-id-mismatch'});assert.ok(nock.isDone());
});

test('event recovery sends a definitely failed local creation to review instead of endless retry',async t=>{
 const {processEvents}=await import('../src/event-worker.mjs');const f=await fixture(t),{customer}=await f.auth.identity(request());
 const order=await f.repository('prepare',{customer,now:f.state.now,requestKey:'event-definite-failure',provider:'mercadopago',account:'123',amountCents:20000,terms:{amountCents:100000,currency:'BRL',payerEmail:'buyer@example.test'}});
 const claim=await f.repository('claim',{customer,orderId:order.id,now:f.state.now});await f.repository('creation-failed',{customer,orderId:order.id,now:f.state.now,generation:claim.generation,definite:true});
 await f.repository('event-receive',{now:f.state.now,event:{provider:'mercadopago',account:'123',environment:'sandbox',eventId:'failed-order-event',eventType:'payment.notification',resourceId:'567',resourceKind:'payment'}});
 nock('https://api.mercadopago.com').get('/v1/payments/567').reply(200,pix(order.id));
 const result=await processEvents({...f,clock:()=>f.state.now});assert.equal(result.retried,0);assert.equal(result.review[0].reason,'checkout-failed');
 assert.equal((await f.repository('get',{customer,orderId:order.id,now:f.state.now})).remote_id,null);assert.ok(nock.isDone());
});
