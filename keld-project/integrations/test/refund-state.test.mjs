import test from 'node:test';
import assert from 'node:assert/strict';
import nock from 'nock';
import {createPaymentAdapters} from '../src/payments.mjs';
import {bindOrdersAdapter,orderReference} from '../src/mercadopago-orders.mjs';
import {stripeRefundState,mercadoPagoRefundState,paypalRefundState,paypalKnownRefundState,paypalRefundCaptureId} from '../src/refund-state.mjs';

nock.disableNetConnect();
const orderId='a'.repeat(32),releaseDigest='b'.repeat(64);
const usd={orderId,releaseDigest,amountCents:20000,currency:'USD',expiresAt:1800003600};
const brl={...usd,amountCents:102000,currency:'BRL'};
const config={environment:'sandbox',stripe:{secret:'sk_test_fixture',account:'acct_fixture'},
  mercadopago:{accessToken:'TEST-fixture',account:'123'},
  paypal:{clientId:'fixture',secret:'fixture-secret',account:'MERCHANT123'}};
const stripePayment={id:'pi_fixture',livemode:false,status:'succeeded',amount:20000,amount_received:20000,currency:'usd'};
const stripeCharge={id:'ch_fixture',payment_intent:'pi_fixture',livemode:false,status:'succeeded',paid:true,captured:true,
  refunded:false,disputed:false,amount_refunded:0,amount:20000,currency:'usd'};
const stripeRefund={id:'re_fixture',object:'refund',livemode:false,payment_intent:'pi_fixture',
  charge:'ch_fixture',currency:'usd',amount:20000,status:'succeeded'};
const stripeSnapshot=(charge=stripeCharge,refunds=[])=>({payment:{...stripePayment,latest_charge:charge},
  charge,refunds:{object:'list',data:refunds,has_more:false},paymentId:'pi_fixture',amountCents:20000,currency:'USD'});

test('Stripe refund classifier binds complete cumulative refunds and the signed event ID',()=>{
  assert.equal(stripeRefundState(stripeSnapshot()).kind,'unrefunded');
  assert.equal(stripeRefundState(stripeSnapshot({...stripeCharge,refunded:true,amount_refunded:20000},[stripeRefund])).kind,'full-refund');
  const half={...stripeRefund,id:'re_first',amount:10000};
  const finalHalf={...stripeRefund,id:'re_second',amount:10000};
  const cumulative=stripeSnapshot({...stripeCharge,refunded:true,amount_refunded:20000},[finalHalf,half]);
  assert.deepEqual(stripeRefundState(cumulative),
    {kind:'full-refund',provider:'stripe',providerRef:'re_second'});
  assert.deepEqual(stripeRefundState({...cumulative,refundId:'re_first'}),
    {kind:'full-refund',provider:'stripe',providerRef:'re_first'});
  assert.deepEqual(stripeRefundState({...cumulative,charge:{...cumulative.charge,disputed:true},
    payment:{...cumulative.payment,latest_charge:{...cumulative.charge,disputed:true}}}),
    {kind:'full-refund',provider:'stripe',providerRef:'re_second'});
  assert.equal(stripeRefundState({...cumulative,refundId:'re_absent'}).kind,'review');
  assert.equal(stripeRefundState(stripeSnapshot({...stripeCharge,amount_refunded:10000},
    [finalHalf,half])).kind,'review');
  assert.deepEqual(stripeRefundState(stripeSnapshot({...stripeCharge,refunded:true,amount_refunded:20000},
    [{...finalHalf,status:'pending'},half])),
    {kind:'review',provider:'stripe',reason:'refund-pending'});
  assert.throws(()=>stripeRefundState(stripeSnapshot({...stripeCharge,refunded:true,amount_refunded:20000},
    [half,half])),{code:'stripe-refund-proof-invalid'});
  assert.equal(stripeRefundState({...cumulative,refunds:{...cumulative.refunds,has_more:true}}).kind,'review');
  assert.deepEqual(stripeRefundState(stripeSnapshot({...stripeCharge,amount_refunded:10000},
    [{...stripeRefund,amount:10000}])),{kind:'partial-refund',provider:'stripe',providerRef:'re_fixture'});
  assert.equal(stripeRefundState(stripeSnapshot(stripeCharge,[{...stripeRefund,amount:10000}])).kind,'review');
  assert.equal(stripeRefundState(stripeSnapshot({...stripeCharge,disputed:true})).kind,'review');
  assert.equal(stripeRefundState({...stripeSnapshot(),refunds:{object:'list',data:[],has_more:true}}).reason,'refund-list-incomplete');
  for(const charge of [{...stripeCharge,disputed:undefined},{...stripeCharge,status:undefined},
    {...stripeCharge,paid:undefined}])assert.throws(()=>stripeRefundState(stripeSnapshot(charge)),
    {code:'stripe-refund-proof-invalid'});
  for(const refund of [{...stripeRefund,payment_intent:'pi_other'},{...stripeRefund,livemode:true},
    {...stripeRefund,currency:'brl'}])assert.throws(()=>stripeRefundState(stripeSnapshot(stripeCharge,[refund])),{code:'stripe-refund-proof-invalid'});
});

test('Mercado Pago Payments refund classifier distinguishes full, partial and uncertain',()=>{
  const payment={id:567,live_mode:false,transaction_amount:1020,status:'approved',status_detail:'accredited',transaction_amount_refunded:0};
  const input={payment,refunds:[],paymentId:'567',amountCents:102000};
  assert.equal(mercadoPagoRefundState(input).kind,'unrefunded');
  assert.equal(mercadoPagoRefundState({...input,payment:{...payment,status:'refunded',transaction_amount_refunded:1020},
    refunds:[{id:123,payment_id:567,amount:1020,status:'approved'}]}).kind,'full-refund');
  assert.deepEqual(mercadoPagoRefundState({...input,payment:{...payment,status_detail:'partially_refunded',transaction_amount_refunded:10},
    refunds:[{id:123,payment_id:567,amount:10,status:'approved'}]}),
    {kind:'partial-refund',provider:'mercadopago',providerRef:'567:123'});
  assert.equal(mercadoPagoRefundState({...input,payment:{...payment,transaction_amount_refunded:10},
    refunds:[{id:123,payment_id:567,amount:10,status:'approved'}]}).kind,'review');
  for(const refund of [{id:123,payment_id:999,amount:10},
    {payment_id:567,amount:10},{id:123,payment_id:567,amount:1021}])
    assert.throws(()=>mercadoPagoRefundState({...input,refunds:[refund]}),{code:'pix-refund-proof-invalid'});
});

test('PayPal capture refund classifier binds capture, order, amount and currency',()=>{
  const capture={id:'CAPTURE123',status:'COMPLETED',amount:{currencyCode:'USD',value:'200.00'},
    supplementaryData:{relatedIds:{orderId:'ORDER123'}}};
  const input={capture,captureId:'CAPTURE123',orderId:'ORDER123',amountCents:20000,currency:'USD'};
  assert.equal(paypalRefundState(input).kind,'review');
  assert.equal(paypalRefundState({...input,capture:{...capture,status:'REFUNDED'}}).kind,'review');
  assert.equal(paypalRefundState({...input,capture:{...capture,status:'PARTIALLY_REFUNDED',
    sellerReceivableBreakdown:{totalRefundedAmount:{currencyCode:'USD',value:'50.00'}}}}).kind,'review');
  assert.throws(()=>paypalRefundState({...input,capture:{...capture,amount:{currencyCode:'BRL',value:'200.00'}}}),
    {code:'paypal-refund-proof-invalid'});
});

test('known PayPal refund requires one exact sandbox capture link and final merchant-bound amount',()=>{
  const capture={id:'CAPTURE123',status:'REFUNDED',finalCapture:true,
    payee:{merchantId:'MERCHANT123'},amount:{currencyCode:'USD',value:'200.00'},
    supplementaryData:{relatedIds:{orderId:'ORDER123'}}};
  const up={rel:'up',method:'GET',href:'https://api-m.sandbox.paypal.com/v2/payments/captures/CAPTURE123'};
  const refund={id:'REFUND123',status:'COMPLETED',amount:{currencyCode:'USD',value:'200.00'},links:[up]};
  const input={refund,refundId:'REFUND123',capture,captureId:'CAPTURE123',orderId:'ORDER123',
    amountCents:20000,currency:'USD',merchantId:'MERCHANT123'};
  assert.equal(paypalRefundCaptureId(refund,'REFUND123'),'CAPTURE123');
  assert.deepEqual(paypalKnownRefundState(input),
    {kind:'full-refund',provider:'paypal',providerRef:'REFUND123'});
  const finalPartial={...refund,amount:{currencyCode:'USD',value:'150.00'},
    sellerPayableBreakdown:{totalRefundedAmount:{currencyCode:'USD',value:'200.00'}}};
  assert.deepEqual(paypalKnownRefundState({...input,refund:finalPartial}),
    {kind:'full-refund',provider:'paypal',providerRef:'REFUND123'});
  for(const change of [
    {...finalPartial,sellerPayableBreakdown:undefined},
    {...finalPartial,sellerPayableBreakdown:{totalRefundedAmount:{currencyCode:'BRL',value:'200.00'}}},
    {...finalPartial,sellerPayableBreakdown:{totalRefundedAmount:{currencyCode:'USD',value:'150.00'}}},
  ])assert.equal(paypalKnownRefundState({...input,refund:change}).kind,'review');
  assert.equal(paypalKnownRefundState({...input,refund:{...refund,
    sellerPayableBreakdown:{totalRefundedAmount:{currencyCode:'USD',value:'150.00'}}}}).kind,'review');
  assert.deepEqual(paypalKnownRefundState({...input,refund:{...refund,amount:{currencyCode:'USD',value:'50.00'}},
    capture:{...capture,status:'PARTIALLY_REFUNDED'}}),
    {kind:'partial-refund',provider:'paypal',providerRef:'REFUND123'});
  for(const r of [{...refund,status:'PENDING'},{...refund,links:[]},
    {...refund,links:[up,up]}])assert.equal(paypalKnownRefundState({...input,refund:r}).kind,'review');
  assert.equal(paypalRefundCaptureId({...refund,links:[]},'REFUND123'),null);
  assert.equal(paypalKnownRefundState({...input,capture:{...capture,status:'COMPLETED'}}).kind,'review');
  for(const r of [
    {...refund,id:'OTHER'},
    {...refund,links:[{...up,href:'https://api-m.paypal.com/v2/payments/captures/CAPTURE123'}]},
    {...refund,links:[{...up,href:up.href+'?x=1'}]},
    {...refund,links:[{...up,href:up.href.replace('CAPTURE123','OTHER')}]},
    {...refund,links:[{...up,method:'POST'}]},
    {...refund,amount:{currencyCode:'BRL',value:'200.00'}},
    {...refund,amount:{currencyCode:'USD',value:'201.00'}},
  ])assert.throws(()=>paypalKnownRefundState({...input,refund:r}),{code:'paypal-refund-proof-invalid'});
  for(const c of [
    {...capture,payee:{merchantId:'OTHER'}},
    {...capture,supplementaryData:{relatedIds:{orderId:'OTHER'}}},
    {...capture,amount:{currencyCode:'USD',value:'201.00'}},
    {...capture,finalCapture:false},
  ])assert.throws(()=>paypalKnownRefundState({...input,capture:c}),{code:'paypal-refund-proof-invalid'});
});

test('Stripe SDK refund inspection issues only GET and binds frozen checkout',async t=>{
  t.after(()=>nock.cleanAll());const adapters=createPaymentAdapters(config);
  const base=nock('https://api.stripe.com');
  base.get('/v1/account').reply(200,{id:'acct_fixture',object:'account'});
  base.get('/v1/checkout/sessions/cs_fixture').reply(200,{id:'cs_fixture',object:'checkout.session',livemode:false,
    mode:'payment',status:'complete',payment_status:'paid',payment_intent:'pi_fixture',
    client_reference_id:orderId,metadata:{release:releaseDigest},currency:'usd',amount_total:20000,amount_subtotal:20000});
  base.get('/v1/payment_intents/pi_fixture').query(true).reply(200,{...stripePayment,latest_charge:stripeCharge});
  base.get('/v1/refunds').query({payment_intent:'pi_fixture',limit:'100'}).reply(200,{object:'list',data:[],has_more:false});
  assert.deepEqual(await adapters.stripe.inspectRefund('cs_fixture',usd,'pi_fixture'),{kind:'unrefunded',provider:'stripe'});
  assert.ok(nock.isDone());
});

test('Stripe SDK full-refund response remains bound through expanded charge and refund list',async t=>{
  t.after(()=>nock.cleanAll());const adapters=createPaymentAdapters(config);
  const base=nock('https://api.stripe.com');
  base.get('/v1/account').reply(200,{id:'acct_fixture',object:'account'});
  base.get('/v1/checkout/sessions/cs_fixture').reply(200,{id:'cs_fixture',object:'checkout.session',livemode:false,
    mode:'payment',status:'complete',payment_status:'paid',payment_intent:'pi_fixture',
    client_reference_id:orderId,metadata:{release:releaseDigest},currency:'usd',amount_total:20000,amount_subtotal:20000});
  base.get('/v1/payment_intents/pi_fixture').query(true).reply(200,{...stripePayment,
    latest_charge:{...stripeCharge,refunded:true,amount_refunded:20000}});
  base.get('/v1/refunds').query({payment_intent:'pi_fixture',limit:'100'}).reply(200,
    {object:'list',data:[stripeRefund],has_more:false});
  assert.deepEqual(await adapters.stripe.inspectRefund('cs_fixture',usd,'pi_fixture'),
    {kind:'full-refund',provider:'stripe',providerRef:'re_fixture'});
  assert.ok(nock.isDone());
});

test('Stripe lost-dispute proof uses only GET and binds dispute, charge, payment and checkout',async t=>{
  t.after(()=>nock.cleanAll());const adapter=createPaymentAdapters(config).stripe;
  const base=nock('https://api.stripe.com');
  const dispute={id:'du_fixture',object:'dispute',livemode:false,status:'lost',
    charge:'ch_fixture',payment_intent:null,amount:10000,currency:'usd'};
  base.get('/v1/account').twice().reply(200,{id:'acct_fixture',object:'account'});
  base.get('/v1/disputes/du_fixture').twice().reply(200,dispute);
  base.get('/v1/charges/ch_fixture').reply(200,{...stripeCharge,object:'charge'});
  base.get('/v1/checkout/sessions/cs_fixture').reply(200,{id:'cs_fixture',object:'checkout.session',livemode:false,
    mode:'payment',status:'complete',payment_status:'paid',payment_intent:'pi_fixture',
    client_reference_id:orderId,metadata:{release:releaseDigest},currency:'usd',amount_total:20000,amount_subtotal:20000});
  base.get('/v1/payment_intents/pi_fixture').query(true).reply(200,{...stripePayment,latest_charge:stripeCharge});
  assert.equal(await adapter.paymentForDispute('du_fixture'),'pi_fixture');
  assert.deepEqual(await adapter.inspectLostDispute('cs_fixture',usd,'pi_fixture','du_fixture'),
    {kind:'lost-dispute',provider:'stripe',providerRef:'du_fixture'});
  assert.ok(nock.isDone());
});

test('Stripe won, warning and mismatched dispute resources never prove loss',async t=>{
  t.after(()=>nock.cleanAll());const adapter=createPaymentAdapters(config).stripe;
  for(const status of ['won','warning_closed','under_review']){
    nock('https://api.stripe.com').get('/v1/account').reply(200,{id:'acct_fixture'});
    nock('https://api.stripe.com').get('/v1/disputes/du_fixture').reply(200,
      {id:'du_fixture',object:'dispute',livemode:false,status,charge:'ch_fixture',amount:20000,currency:'usd'});
    await assert.rejects(()=>adapter.paymentForDispute('du_fixture'),{code:'stripe-dispute-proof-invalid'});
  }
  nock('https://api.stripe.com').get('/v1/account').reply(200,{id:'acct_fixture'});
  nock('https://api.stripe.com').get('/v1/disputes/du_fixture').reply(200,
    {id:'du_other',object:'dispute',livemode:false,status:'lost',charge:'ch_fixture',amount:20000,currency:'usd'});
  await assert.rejects(()=>adapter.paymentForDispute('du_fixture'),{code:'stripe-dispute-proof-invalid'});
  assert.ok(nock.isDone());
});

test('Stripe lost-dispute inspection rejects wrong merchant, order, amount and charge',async t=>{
  t.after(()=>nock.cleanAll());const adapter=createPaymentAdapters(config).stripe;
  nock('https://api.stripe.com').get('/v1/account').reply(200,{id:'acct_other'});
  await assert.rejects(()=>adapter.inspectLostDispute('cs_fixture',usd,'pi_fixture','du_fixture'),
    {code:'merchant-mismatch'});
  const session={id:'cs_fixture',object:'checkout.session',livemode:false,mode:'payment',
    status:'complete',payment_status:'paid',payment_intent:'pi_fixture',client_reference_id:orderId,
    metadata:{release:releaseDigest},currency:'usd',amount_total:20000,amount_subtotal:20000};
  const dispute={id:'du_fixture',object:'dispute',livemode:false,status:'lost',charge:'ch_fixture',
    payment_intent:'pi_fixture',amount:10000,currency:'usd'};
  const stage=(s,d,p)=>{
    const base=nock('https://api.stripe.com');
    base.get('/v1/account').reply(200,{id:'acct_fixture'});
    base.get('/v1/checkout/sessions/cs_fixture').reply(200,s);
    if(d)base.get('/v1/disputes/du_fixture').reply(200,d);
    if(p)base.get('/v1/payment_intents/pi_fixture').query(true).reply(200,p);
  };
  stage({...session,client_reference_id:'wrong-order'});
  await assert.rejects(()=>adapter.inspectLostDispute('cs_fixture',usd,'pi_fixture','du_fixture'),
    {code:'stripe-terms-mismatch'});
  stage(session,{...dispute,amount:20001});
  await assert.rejects(()=>adapter.inspectLostDispute('cs_fixture',usd,'pi_fixture','du_fixture'),
    {code:'stripe-dispute-proof-invalid'});
  stage(session,dispute,{...stripePayment,latest_charge:{...stripeCharge,id:'ch_other'}});
  await assert.rejects(()=>adapter.inspectLostDispute('cs_fixture',usd,'pi_fixture','du_fixture'),
    {code:'stripe-dispute-proof-invalid'});
  assert.ok(nock.isDone());
});

test('Mercado Pago Payments SDK refund inspection issues only GET',async t=>{
  t.after(()=>nock.cleanAll());const adapters=createPaymentAdapters(config);
  const base=nock('https://api.mercadopago.com');
  base.get('/v1/payments/567').reply(200,{id:567,live_mode:false,collector_id:123,external_reference:orderId,
    metadata:{release:releaseDigest},currency_id:'BRL',transaction_amount:1020,payment_method_id:'pix',
    status:'approved',status_detail:'accredited',transaction_amount_refunded:0});
  base.get('/v1/payments/567/refunds/').reply(200,[]);
  assert.deepEqual(await adapters.mercadopago.inspectRefund('567',brl,'567'),{kind:'unrefunded',provider:'mercadopago'});
  assert.ok(nock.isDone());
});

test('Mercado Pago Payments SDK full-refund response remains payment-bound',async t=>{
  t.after(()=>nock.cleanAll());const adapters=createPaymentAdapters(config);
  const base=nock('https://api.mercadopago.com');
  base.get('/v1/payments/567').reply(200,{id:567,live_mode:false,collector_id:123,external_reference:orderId,
    metadata:{release:releaseDigest},currency_id:'BRL',transaction_amount:1020,payment_method_id:'pix',
    status:'refunded',transaction_amount_refunded:1020});
  base.get('/v1/payments/567/refunds/').reply(200,[{id:123,payment_id:567,amount:1020,status:'approved'}]);
  assert.deepEqual(await adapters.mercadopago.inspectRefund('567',brl,'567'),
    {kind:'full-refund',provider:'mercadopago',providerRef:'567:123'});
  assert.ok(nock.isDone());
});

test('Stripe refund command candidate sends exact frozen amount and stable key only after a read',async t=>{
  t.after(()=>nock.cleanAll());const adapter=createPaymentAdapters(config).stripe;
  const key='a'.repeat(64),base=nock('https://api.stripe.com');
  base.get('/v1/account').reply(200,{id:'acct_fixture',object:'account'});
  base.get('/v1/checkout/sessions/cs_fixture').reply(200,{id:'cs_fixture',object:'checkout.session',
    livemode:false,mode:'payment',status:'complete',payment_status:'paid',payment_intent:'pi_fixture',
    client_reference_id:orderId,metadata:{release:releaseDigest},currency:'usd',
    amount_total:20000,amount_subtotal:20000});
  assert.equal(await adapter.refundPaymentId('cs_fixture',usd),'pi_fixture');
  base.post('/v1/refunds',body=>{
    const params=new URLSearchParams(body);return params.get('payment_intent')==='pi_fixture'&&
      params.get('amount')==='20000';
  }).matchHeader('idempotency-key',key).reply(200,{id:'re_fixture',object:'refund',livemode:false,
    payment_intent:'pi_fixture',charge:'ch_fixture',amount:20000,currency:'usd',status:'pending'});
  assert.deepEqual(await adapter.issueFullRefund('pi_fixture',usd,key),
    {providerRef:'re_fixture',status:'pending'});
  assert.ok(nock.isDone());
});

test('Mercado Pago Payments command candidate sends exact BRL amount and stable key',async t=>{
  t.after(()=>nock.cleanAll());const adapter=createPaymentAdapters(config).mercadopago;
  const key='b'.repeat(64),base=nock('https://api.mercadopago.com');
  base.get('/v1/payments/567').reply(200,{id:567,live_mode:false,collector_id:123,
    external_reference:orderId,metadata:{release:releaseDigest},currency_id:'BRL',
    transaction_amount:1020,payment_method_id:'pix',status:'approved',
    status_detail:'accredited',transaction_amount_refunded:0});
  assert.equal(await adapter.refundPaymentId('567',brl),'567');
  base.post('/v1/payments/567/refunds',body=>body.amount===1020)
    .matchHeader('x-idempotency-key',key).reply(201,{id:123,payment_id:567,amount:1020,status:'approved'});
  assert.deepEqual(await adapter.issueFullRefund('567',brl,key),
    {providerRef:'567:123',status:'approved'});
  assert.ok(nock.isDone());
});

test('PayPal SDK refund inspection reads order and capture without a payment mutation',async t=>{
  t.after(()=>nock.cleanAll());const adapters=createPaymentAdapters(config);
  const base=nock('https://api-m.sandbox.paypal.com');
  base.post('/v1/oauth2/token').reply(200,{access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
  base.get('/v2/checkout/orders/ORDER123').reply(200,{id:'ORDER123',intent:'CAPTURE',status:'COMPLETED',
    purchase_units:[{reference_id:orderId,custom_id:releaseDigest,payee:{merchant_id:'MERCHANT123'},
      amount:{currency_code:'USD',value:'200.00'},payments:{captures:[{id:'CAPTURE123'}]}}]});
  base.get('/v2/payments/captures/CAPTURE123').reply(200,{id:'CAPTURE123',status:'COMPLETED',
    amount:{currency_code:'USD',value:'200.00'},supplementary_data:{related_ids:{order_id:'ORDER123'}}});
  assert.deepEqual(await adapters.paypal.inspectRefund('ORDER123',usd,'CAPTURE123'),
    {kind:'review',provider:'paypal',reason:'refund-resource-verification-required'});
  assert.ok(nock.isDone());
});

test('PayPal final partial refund binds cumulative full amount through three resource GETs',async t=>{
  t.after(()=>nock.cleanAll());const adapter=createPaymentAdapters(config).paypal;
  const base=nock('https://api-m.sandbox.paypal.com');
  base.post('/v1/oauth2/token').reply(200,{access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
  base.get('/v2/checkout/orders/ORDER123').reply(200,{id:'ORDER123',intent:'CAPTURE',status:'COMPLETED',
    purchase_units:[{reference_id:orderId,custom_id:releaseDigest,payee:{merchant_id:'MERCHANT123'},
      amount:{currency_code:'USD',value:'200.00'},payments:{captures:[{id:'CAPTURE123',final_capture:true}]}}]});
  base.get('/v2/payments/captures/CAPTURE123').reply(200,{id:'CAPTURE123',status:'REFUNDED',
    final_capture:true,payee:{merchant_id:'MERCHANT123'},amount:{currency_code:'USD',value:'200.00'},
    supplementary_data:{related_ids:{order_id:'ORDER123'}}});
  base.get('/v2/payments/refunds/REFUND123').reply(200,{id:'REFUND123',status:'COMPLETED',
    amount:{currency_code:'USD',value:'150.00'},
    seller_payable_breakdown:{total_refunded_amount:{currency_code:'USD',value:'200.00'}},
    links:[{rel:'up',method:'GET',
      href:'https://api-m.sandbox.paypal.com/v2/payments/captures/CAPTURE123'}]});
  assert.deepEqual(await adapter.inspectKnownRefund('ORDER123',usd,'CAPTURE123','REFUND123'),
    {kind:'full-refund',provider:'paypal',providerRef:'REFUND123'});
  assert.ok(nock.isDone());
});

test('PayPal refund-ID lookup reads only the refund and returns a sandbox capture hint',async t=>{
  t.after(()=>nock.cleanAll());const adapter=createPaymentAdapters(config).paypal;
  const base=nock('https://api-m.sandbox.paypal.com');
  base.post('/v1/oauth2/token').reply(200,{access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
  base.get('/v2/payments/refunds/REFUND123').reply(200,{id:'REFUND123',status:'PENDING',
    links:[{rel:'up',method:'GET',href:'https://api-m.sandbox.paypal.com/v2/payments/captures/CAPTURE123'}]});
  assert.equal(await adapter.captureForKnownRefund('REFUND123'),'CAPTURE123');
  assert.ok(nock.isDone());
});

test('PayPal known-refund path stops at an order with wrong frozen terms or merchant',async t=>{
  t.after(()=>nock.cleanAll());
  for(const purchase of [
    {reference_id:orderId,custom_id:'wrong-release',payee:{merchant_id:'MERCHANT123'}},
    {reference_id:orderId,custom_id:releaseDigest,payee:{merchant_id:'OTHER'}},
  ]){
    const adapter=createPaymentAdapters(config).paypal;
    const base=nock('https://api-m.sandbox.paypal.com');
    base.post('/v1/oauth2/token').reply(200,{access_token:'fixture-access',token_type:'Bearer',expires_in:3600});
    base.get('/v2/checkout/orders/ORDER123').reply(200,{id:'ORDER123',intent:'CAPTURE',status:'COMPLETED',
      purchase_units:[{...purchase,amount:{currency_code:'USD',value:'200.00'},
        payments:{captures:[{id:'CAPTURE123',final_capture:true}]}}]});
    await assert.rejects(()=>adapter.inspectKnownRefund('ORDER123',usd,'CAPTURE123','REFUND123'),
      {code:'paypal-terms-mismatch'});
    assert.ok(nock.isDone());
  }
});

test('Mercado Pago Orders rejects incomplete provider proof after authenticated seller read',async()=>{
  const c={account:'123',applicationId:'456'};
  const oid='ORD'+'A'.repeat(29),pid='PAY'+'B'.repeat(29);
  const o={id:oid,user_id:'123',integration_data:{application_id:'456'},live_mode:false,
    external_reference:orderReference(brl,c),currency:'BRL',total_amount:'1020.00',
    transactions:{payments:[{id:pid}]}};
  const adapter=bindOrdersAdapter({user:{get:async()=>({id:123,site_id:'MLB',country_id:'BR',tags:['test_user']})},
    orders:{get:async()=>o}},c);
  await assert.rejects(()=>adapter.inspectRefund(oid,{...brl,providerApi:'orders-v1'},pid),
    {code:'orders-refund-proof-invalid'});
  await assert.rejects(()=>adapter.inspectRefund(oid,{...brl,providerApi:'orders-v1'},'PAYWRONG'),
    {code:'orders-refund-proof-invalid'});
});
