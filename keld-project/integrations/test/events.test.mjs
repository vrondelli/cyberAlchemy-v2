import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHmac} from 'node:crypto';
import Stripe from 'stripe';
import nock from 'nock';
import {createEventVerifiers,createEventInbox} from '../src/events.mjs';
import {createRepository} from '../src/repository.mjs';
nock.disableNetConnect();
const now=1800000000000,secret='whsec_fixture';
const stripe=new Stripe('sk_test_fixture');
const e={id:'evt_one',object:'event',type:'checkout.session.completed',livemode:false,data:{object:{id:'cs_fixture',object:'checkout.session',customer_email:'private-payer@example.test'}}};
const body=Buffer.from(JSON.stringify(e));
const signature=(raw,time=now/1000)=>stripe.webhooks.generateTestHeaderString({payload:raw.toString(),secret,timestamp:time});
const stripeVerifier=()=>createEventVerifiers({environment:'sandbox',stripe:{account:'acct_fixture',secret}},{clock:()=>now}).stripe;

test('Stripe SDK verifies original bytes and rejects stale/future, live, wrong-account and ambiguous headers',async()=>{
 const verify=stripeVerifier();const record=await verify(body,{'stripe-signature':signature(body)});assert.equal(record.resourceId,'cs_fixture');assert.equal(record.environment,'sandbox');assert.equal(record.customer_email,undefined);
 for(const raw of [Buffer.from(JSON.stringify({...e,livemode:true})),Buffer.from(JSON.stringify({...e,account:'acct_wrong'}))])await assert.rejects(()=>verify(raw,{'stripe-signature':signature(raw)}));
 await assert.rejects(()=>verify(Buffer.from(body.toString()+' '),{'stripe-signature':signature(body)}));
 for(const time of [now/1000-301,now/1000+301])await assert.rejects(()=>verify(body,{'stripe-signature':signature(body,time)}));
 await assert.rejects(()=>verify(body,{'stripe-signature':[signature(body)]}));
 await assert.rejects(()=>verify(body,{'stripe-signature':signature(body)+',t='+now/1000}));
});

test('signed Stripe dispute closure retains only its dispute resource as a lookup hint',async()=>{
 const raw=Buffer.from(JSON.stringify({...e,id:'evt_dispute',type:'charge.dispute.closed',
   data:{object:{id:'du_fixture',object:'dispute',status:'lost',charge:'ch_untrusted',
     payment_intent:'pi_untrusted',customer_email:'private@example.test'}}}));
 const event=await stripeVerifier()(raw,{'stripe-signature':signature(raw)});
 assert.deepEqual(event,{provider:'stripe',account:'acct_fixture',environment:'sandbox',
   eventId:'evt_dispute',eventType:'charge.dispute.closed',resourceId:'du_fixture',resourceKind:'dispute'});
 await assert.rejects(()=>stripeVerifier()(raw,{'stripe-signature':signature(body)}));
});

test('durable inbox deduplicates across restart, rejects conflicting references and stores no payer payload',async t=>{
 const root=await mkdtemp(join(tmpdir(),'keld-events-'));t.after(()=>rm(root,{recursive:true,force:true}));const database=join(root,'ledger.db');
 const repo=()=>createRepository({database,releaseDigest:'a'.repeat(64)});
 const make=()=>createEventInbox({verifiers:{stripe:stripeVerifier()},repository:repo(),clock:()=>now/1000});
 const inbox=make();assert.deepEqual(await inbox.receive('stripe',body,{'stripe-signature':signature(body)}),{accepted:true,duplicate:false});
 assert.deepEqual(await make().receive('stripe',body,{'stripe-signature':signature(body)}),{accepted:true,duplicate:true});
 const changed=Buffer.from(JSON.stringify({...e,data:{object:{id:'cs_other',object:'checkout.session'}}}));
 await assert.rejects(()=>inbox.receive('stripe',changed,{'stripe-signature':signature(changed)}),x=>x.status===409);
 assert.equal((await repo()('reconcile-inspect',{now:now/1000})).total,0);
 assert.equal((await readFile(database)).includes(Buffer.from('private-payer@example.test')),false);
 await assert.rejects(()=>inbox.receive('paypal',body,{}),x=>x.status===404);
});

test('Mercado Pago SDK authenticates only signed lookup fields and ignores forged JSON status/identity',async()=>{
 const secret='mercadopago-fixture-secret',requestId='request-one',payment='123456';
 const sign=ts=>'ts='+ts+',v1='+createHmac('sha256',secret).update(`id:${payment};request-id:${requestId};ts:${ts};`).digest('hex');
 const headers={'x-signature':sign(now/1000),'x-request-id':requestId};
 const verify=createEventVerifiers({environment:'sandbox',mercadopago:{account:'123',secret}},{clock:()=>now}).mercadopago;
 const a=await verify(Buffer.from('{"id":"forged","type":"refund","status":"approved"}'),headers,'/events?data.id='+payment);
 const b=await verify(Buffer.from('{"status":"failed","user_id":"someone-else"}'),headers,'/events?data.id='+payment);
 assert.deepEqual(a,b);assert.equal(a.resourceId,payment);assert.equal(a.eventType,'payment.notification');
 await assert.rejects(()=>verify(Buffer.from('{}'),headers,'/events?data.id='+payment+'&data.id='+payment));
 await assert.rejects(()=>verify(Buffer.from('{}'),{'x-signature':sign(now/1000)},'/events?data.id='+payment));
 await assert.rejects(()=>verify(Buffer.from('{}'),{...headers,'x-signature':sign(now/1000-301)},'/events?data.id='+payment));
});

const paypalConfig={environment:'sandbox',paypal:{account:'MERCHANT123',clientId:'fixture',secret:'fixture',webhookId:'WH-CONFIGURED'}};
const paypalHeaders={'paypal-transmission-id':'transmission-one','paypal-transmission-time':'2026-09-17T00:00:00Z','paypal-cert-url':'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-fixture','paypal-auth-algo':'SHA256withRSA','paypal-transmission-sig':'fixture-signature'};
const paypalRaw=Buffer.from('{\n "id": "WH-EVENT", "event_type": "PAYMENT.CAPTURE.COMPLETED", "resource_type": "capture", "resource": {"id":"CAPTURE1", "payee":{"merchant_id":"MERCHANT123"}}\n}');
test('PayPal reuses SDK OAuth and preserves raw event JSON in bounded sandbox postback',async t=>{
 t.after(()=>nock.cleanAll());let sent,calls=0;
 nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').once().reply(200,{access_token:'fixture-token',token_type:'Bearer',expires_in:3600});
 const verify=createEventVerifiers(paypalConfig,{request:async(url,options)=>{calls++;assert.equal(url,'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature');assert.equal(options.redirect,'error');assert.equal(options.headers.authorization,'Bearer fixture-token');sent=options.body;return new Response('{"verification_status":"SUCCESS"}');}}).paypal;
 assert.equal((await verify(paypalRaw,paypalHeaders)).resourceId,'CAPTURE1');assert.ok(sent.includes('"webhook_event":'+paypalRaw.toString()));assert.equal(JSON.parse(sent).webhook_id,'WH-CONFIGURED');
 await verify(paypalRaw,paypalHeaders);assert.equal(calls,2);assert.ok(nock.isDone());
 await assert.rejects(()=>verify(paypalRaw,{...paypalHeaders,'paypal-cert-url':'http://127.0.0.1/private'}));assert.equal(calls,2);
});

test('signed PayPal refund webhook stores only a refund-ID lookup hint',async t=>{
 t.after(()=>nock.cleanAll());
 const raw=Buffer.from('{"id":"WH-REFUND","event_type":"PAYMENT.CAPTURE.REFUNDED","resource_type":"refund","resource":{"id":"REFUND123","status":"COMPLETED","amount":{"value":"999.00"}}}');
 nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').reply(200,
   {access_token:'fixture-token',token_type:'Bearer',expires_in:3600});
 let postback;
 const verify=createEventVerifiers(paypalConfig,{request:async(_url,options)=>{
   postback=options.body;return new Response('{"verification_status":"SUCCESS"}');
 }}).paypal;
 assert.deepEqual(await verify(raw,paypalHeaders),{provider:'paypal',account:'MERCHANT123',
   environment:'sandbox',eventId:'WH-REFUND',eventType:'PAYMENT.CAPTURE.REFUNDED',
   resourceId:'REFUND123',resourceKind:'refund'});
 assert.ok(postback.includes('"webhook_event":'+raw.toString()));assert.ok(nock.isDone());
});

test('PayPal verification failure and oversized/unavailable responses never reach the inbox',async t=>{
 t.after(()=>nock.cleanAll());nock('https://api-m.sandbox.paypal.com').post('/v1/oauth2/token').reply(200,{access_token:'fixture-token',token_type:'Bearer',expires_in:3600});
 let mode='failure',stored=0;const verifiers=createEventVerifiers(paypalConfig,{request:async()=>mode==='failure'?new Response('{"verification_status":"FAILURE"}'):mode==='large'?new Response('x'.repeat(9000)):Promise.reject(Error('private failure'))});
 let admitted=0;const inbox=createEventInbox({verifiers,repository:async operation=>{if(operation==='event-admit')admitted++;else if(operation==='event-receive')stored++;else assert.fail('unexpected repository operation');}});
 await assert.rejects(()=>inbox.receive('paypal',paypalRaw,paypalHeaders),e=>e.status===403);
 for(mode of ['large','unavailable'])await assert.rejects(()=>inbox.receive('paypal',paypalRaw,paypalHeaders),e=>e.code==='event-verification-unavailable');
 assert.equal(admitted,0);assert.equal(stored,0);assert.ok(nock.isDone());
});

test('webhook pre-auth gate bounds expensive concurrent verification without consuming durable allowance',async()=>{
 let release;const blocked=new Promise(resolve=>{release=resolve;});let durable=0;
 const inbox=createEventInbox({verifiers:{paypal:async()=>{await blocked;return {provider:'paypal',account:'MERCHANT123',environment:'sandbox',eventId:'bounded',eventType:'PAYMENT.CAPTURE.COMPLETED',resourceId:'CAPTURE1',resourceKind:'capture'};}},
  repository:async operation=>{if(operation==='event-admit')durable++;return {accepted:true,duplicate:false};},maxConcurrentVerifications:1});
 const first=inbox.receive('paypal',Buffer.from('{}'),{},'/events/paypal');
 await assert.rejects(()=>inbox.receive('paypal',Buffer.from('{}'),{},'/events/paypal'),e=>e.code==='event-verification-busy'&&e.status===503);
 assert.equal(durable,0);release();await first;assert.equal(durable,1);
});

test('HTTP event routes bypass buyer cookies only through verified durable receipt and default to disabled',async t=>{
 const {createHandler}=await import('../src/index.mjs');const {Readable}=await import('node:stream');
 const root=await mkdtemp(join(tmpdir(),'keld-event-http-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const inbox=createEventInbox({verifiers:{stripe:stripeVerifier()},repository:createRepository({database:join(root,'ledger.db'),releaseDigest:'a'.repeat(64)}),clock:()=>now/1000});
 let buyerCalls=0;const auth={handle:async()=>{buyerCalls++;throw Error('must not authenticate webhook as buyer');}};
 const handler=createHandler({auth,inbox,origin:'https://keld.localhost',checkout:{},diagnostic:()=>{}});
 const call=async(handler,{sig=signature(body),rawHeaders=[]}={})=>{
   const req=Readable.from([body]);req.url='/events/stripe';req.method='POST';req.headers={host:'keld.localhost','content-type':'application/json','stripe-signature':sig};req.rawHeaders=rawHeaders;
   const res={writeHead(status){this.status=status;},end(value){this.value=JSON.parse(value);}};await handler(req,res);return res;
 };
 assert.equal((await call(handler)).status,202);assert.equal((await call(handler)).value.duplicate,true);assert.equal(buyerCalls,0);
 assert.equal((await call(handler,{sig:'invalid'})).status,403);
 assert.equal((await call(handler,{rawHeaders:['Stripe-Signature',signature(body),'stripe-signature',signature(body)]})).status,403);
 const disabled=createHandler({auth,origin:'https://keld.localhost',checkout:{},diagnostic:()=>{}});assert.equal((await call(disabled)).status,404);
 const broken=createHandler({auth,inbox:createEventInbox({verifiers:{stripe:stripeVerifier()},repository:async()=>{throw Error('private DB error');}}),origin:'https://keld.localhost',checkout:{},diagnostic:()=>{}});
 assert.equal((await call(broken)).status,503);assert.equal(buyerCalls,0);
});
