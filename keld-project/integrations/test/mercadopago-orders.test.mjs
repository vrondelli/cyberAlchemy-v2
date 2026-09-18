import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createHmac} from 'node:crypto';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import nock from 'nock';
import {validateOrder,orderReference,bindOrdersAdapter} from '../src/mercadopago-orders.mjs';
import {createPaymentAdapters} from '../src/payments.mjs';
import {createRepository} from '../src/repository.mjs';
import {createCheckoutService} from '../src/checkout.mjs';
import {processEvents} from '../src/event-worker.mjs';
import {createEventVerifiers,createEventInbox} from '../src/events.mjs';
const c={api:'orders-v1',account:'123',applicationId:'456',accessToken:'APP_USR-fixture'};
const oid='ORD01JP84C939T20S0P1DN382FQ6K',pid='PAY01JP84C939T20S0P1DN6FCMWQC';
const now=1800000000,bytes=Buffer.from('Orders sandbox fixture'),digest=createHash('sha256').update(bytes).digest('hex');
const terms={providerApi:'orders-v1',pixRequestVersion:2,pixExpirationSeconds:1800,pixExpiresAt:now+1800,orderId:'a'.repeat(32),releaseDigest:digest,currency:'BRL',amountCents:25000,expiresAt:now+3600,payerEmail:'test_user_br@testuser.com'};
const seller={id:123,site_id:'MLB',country_id:'BR',tags:['test_user']};
function order(t=terms,extra={}){return {id:oid,type:'online',user_id:'123',country_code:'BRA',integration_data:{application_id:'456'},currency:'BRL',external_reference:orderReference(t,c),total_amount:'250.00',status:'action_required',status_detail:'waiting_transfer',transactions:{payments:[{id:pid,amount:'250.00',status:'action_required',status_detail:'waiting_transfer',payment_method:{id:'pix',type:'bank_transfer',qr_code:'000201-synthetic-pix'}}]},...extra};}
function paid(t){const o=order(t,{status:'processed',status_detail:'accredited',total_paid_amount:'250.00'});Object.assign(o.transactions.payments[0],{status:'processed',status_detail:'accredited',paid_amount:'250.00'});return o;}
nock.disableNetConnect();
const me=()=>nock('https://api.mercadopago.com').get('/users/me').reply(200,seller);

test('Orders validator collects field paths without including provider data',()=>{
  const o=paid(terms);o.user_id='wrong';o.currency='USD';o.total_amount='251.00';o.transactions.payments[0].paid_amount='249.00';
  assert.throws(()=>validateOrder(o,terms,c,{paid:true}),e=>{assert.deepEqual(e.issues.map(x=>x.path),['user_id','total_amount','currency','transactions.payments[0].paid_amount']);assert.ok(!JSON.stringify(e.issues).includes('wrong'));return true;});
  for(const edit of [o=>delete o.currency,o=>o.live_mode=true,o=>o.transactions.refunds=[{}],o=>o.transactions.chargebacks=[{}],o=>o.transactions.payments.push(o.transactions.payments[0]),o=>o.external_reference='a'.repeat(32),o=>o.integration_data.application_id='999']){const o=paid(terms);edit(o);assert.throws(()=>validateOrder(o,terms,c,{paid:true}));}
});

test('Orders SDK → asynchronous QR refresh → paid ledger → owned download, without a second POST',async t=>{
  const root=await mkdtemp(join(tmpdir(),'keld-orders-'));await writeFile(join(root,'fixture.bin'),bytes);
  t.after(async()=>{nock.cleanAll();await rm(root,{recursive:true,force:true});});
  const repository=createRepository({database:join(root,'ledger.db'),releaseDigest:digest,delivery:{root,artifacts:[{sha256:digest,bytes:bytes.length,relative_path:'fixture.bin'}]}});
  const adapters=createPaymentAdapters({environment:'sandbox',stripe:{secret:'sk_test_fixture',account:'acct_test'},mercadopago:c,paypal:{clientId:'fixture',secret:'fixture',account:'MERCHANT'}});
  const service=createCheckoutService({auth:{identity:async req=>({customer:req.customer})},repository,adapters,origin:'https://shop.example.test',clock:()=>now,quoteBrl:async()=>({currency:'BRL',amountCents:25000,reference:'test'})});
  const req={customer:'oidc:'+'a'.repeat(64)},other={customer:'oidc:'+'b'.repeat(64)},input={provider:'mercadopago',amountCents:5000,requestKey:'orders-one',payerEmail:terms.payerEmail};let frozen;
  me();nock('https://api.mercadopago.com').post('/v1/orders',body=>{
    frozen={...terms,orderId:body.external_reference.slice(0,32)};
    assert.equal(body.transactions.payments[0].expiration_time,'PT30M');assert.equal(body.total_amount,'250.00');assert.equal(body.payer.first_name,'APRO');assert.equal(body.transactions.payments[0].payment_method.type,'bank_transfer');
    assert.equal(body.external_reference,orderReference(frozen,c));return true;
  }).matchHeader('x-idempotency-key',/^[a-f0-9]{64}$/).reply(()=>[201,order(frozen,{status:'processing',transactions:{},currency:undefined})]);
  const a=await service.create(req,input);assert.equal(a.checkoutState,'verification-required');assert.deepEqual(a.verificationIssues,[{path:'currency',code:'mismatch-or-missing'}]);
  const stored=await repository('get',{customer:req.customer,now,orderId:a.orderId});assert.equal(stored.terms.providerApi,'orders-v1');assert.equal(stored.remote_id,oid);
  await assert.rejects(()=>service.confirm(other,a.orderId));await assert.rejects(()=>service.download(req,a.orderId));
  me();nock('https://api.mercadopago.com').get('/v1/orders/'+oid).reply(200,order(frozen));
  const ready=await service.create(req,input);assert.equal(ready.pixCode,'000201-synthetic-pix');assert.deepEqual(await service.create(req,input),ready);
  me();nock('https://api.mercadopago.com').get('/v1/orders/'+oid).reply(200,paid(frozen));
  const secret='orders-end-to-end-secret',headers={'x-request-id':'delivery-1','x-signature':`ts=${now*1000},v1=${createHmac('sha256',secret).update(`id:${oid};request-id:delivery-1;ts:${now*1000};`).digest('hex')}`};
  const inbox=createEventInbox({repository,clock:()=>now,verifiers:createEventVerifiers({environment:'sandbox',mercadopago:{...c,secret}},{clock:()=>now*1000})});
  await inbox.receive('mercadopago',Buffer.from('{}'),headers,'/?data.id='+oid);
  await inbox.receive('mercadopago',Buffer.from('{}'),headers,'/?data.id='+oid);
  const worked=await processEvents({repository,adapters,clock:()=>now});assert.equal(worked.done,1);assert.equal(worked.claimed,1);
  assert.equal((await service.download(req,a.orderId)).sha256,digest);await assert.rejects(()=>service.download(other,a.orderId));
  me();nock('https://api.mercadopago.com').get('/v1/orders/'+oid).reply(200,paid(frozen));
  assert.equal((await service.confirm(req,a.orderId)).status,'paid');assert.ok(nock.isDone());
});

test('non-test or wrong seller cannot create an order',async()=>{
  for(const u of [{...seller,tags:[]},{...seller,id:999},{...seller,country_id:'AR'}]){
    let writes=0;const a=bindOrdersAdapter({user:{get:async()=>u},orders:{create:async()=>{writes++;}}},c);
    await assert.rejects(()=>a.create(terms,'key'),e=>e.definite===true);assert.equal(writes,0);
  }
});

test('Orders webhook authenticates raw case and seconds/milliseconds, ignores unsigned status, rejects replay age and duplicate IDs',async()=>{
  const secret='synthetic-webhook-secret';const verify=createEventVerifiers({environment:'sandbox',mercadopago:{...c,secret}},{clock:()=>now*1000}).mercadopago;
  const headers=(ts,id=oid)=>({'x-request-id':'req-1','x-signature':`ts=${ts},v1=${createHmac('sha256',secret).update(`id:${id};request-id:req-1;ts:${ts};`).digest('hex')}`});
  for(const ts of [now,now*1000]){
    const e=await verify(Buffer.from('{"type":"payment","data":{"id":"forged","status":"processed"}}'),headers(ts),'/?data.id='+oid);
    assert.equal(e.resourceId,oid);assert.equal(e.resourceKind,'order');assert.equal(e.eventType,'order.notification');
  }
  await assert.rejects(()=>verify(Buffer.from('{}'),headers(now-301),'/?data.id='+oid));
  await assert.rejects(()=>verify(Buffer.from('{}'),headers(now),'/?data.id='+oid+'&data.id='+oid));
  await assert.rejects(()=>verify(Buffer.from('{}'),headers(now,oid.toLowerCase()),'/?data.id='+oid));
});

test('bounded Orders discovery and paid verification use the order, never numeric payment endpoints',async()=>{
  let options;const a=bindOrdersAdapter({user:{get:async()=>seller},orders:{search:async arg=>{options=arg.options;return {data:[order()],paging:{total:'1',total_pages:'1'}};},get:async()=>paid(terms)}},c);
  const result=await a.discover(terms,{begin:now-30,end:now});assert.deepEqual(result.ids,[oid]);assert.equal(result.complete,true);assert.equal(options.external_reference,orderReference(terms,c));
  assert.equal(await a.verify(oid,terms),pid);assert.equal(await a.localOrderFor(oid),terms.orderId);
});

test('Orders discovery fails closed on malformed pages and caps provider work',async()=>{
 for(const page of [{data:[],paging:{total:null,total_pages:null}},{data:[order(),order()],paging:{total:'2',total_pages:'1'}},{data:[{...order(),external_reference:'wrong'}],paging:{total:'1',total_pages:'1'}}]){
  const a=bindOrdersAdapter({user:{get:async()=>seller},orders:{search:async()=>page}},c);
  await assert.rejects(()=>a.discover(terms,{begin:now-10,end:now}));
 }
 let calls=0;const a=bindOrdersAdapter({user:{get:async()=>seller},orders:{search:async()=>{calls++;return {data:[{...order(),id:'ORD'+String(calls).padStart(26,'0')}],paging:{total:'6',total_pages:'6'}};}}},c);
 const scan=await a.discover(terms,{begin:now-10,end:now});assert.equal(calls,5);assert.equal(scan.complete,false);
});

test('bound operator resume succeeds, replay cannot downgrade ready, and stale first binding is rejected',async t=>{
 const {resumeCheckout}=await import('../src/resume-checkout.mjs');
 const root=await mkdtemp(join(tmpdir(),'orders-repair-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const repository=createRepository({database:join(root,'ledger.db'),releaseDigest:digest});
 const base={customer:'oidc:'+'c'.repeat(64),now};
 const make=key=>repository('prepare',{...base,requestKey:key,provider:'mercadopago',account:'123',amountCents:5000,terms});
 const a=await make('bound'),input={...base,orderId:a.id,remoteId:oid};
 const claim=await repository('claim',input);
 const pending={remoteId:oid,checkoutState:'preparing'},ready={remoteId:oid,checkoutState:'ready',pixCode:'fixture'};
 await repository('bind',{...input,...claim,response:pending});
 const adapters={mercadopago:{account:'123',resume:async()=>ready}};
 assert.equal((await resumeCheckout({repository,adapters,orderId:a.id,remoteId:oid,clock:()=>now})).resumed,true);
 assert.equal((await resumeCheckout({repository,adapters,orderId:a.id,remoteId:oid,clock:()=>now})).resumed,true);
 await repository('bind',{...input,...claim,response:pending});
 assert.deepEqual((await repository('get',input)).response,ready);
 await assert.rejects(()=>repository('bind',{...input,...claim,remoteId:'ORD'+'0'.repeat(26),response:pending}));
 const b=await make('stale'),other={...base,orderId:b.id,remoteId:'ORD'+'1'.repeat(26)};
 const first=await repository('claim',other);
 const second=await repository('claim',{...other,now:now+61});
 await assert.rejects(()=>repository('bind',{...other,now:now+61,...first,response:pending}),e=>e.code==='checkout-attempt-changed');
 await repository('bind',{...other,now:now+61,...second,response:{...pending,remoteId:other.remoteId}});
 assert.equal((await repository('get',other)).remote_id,other.remoteId);
});

test('Pix TTL is fixed across retries, preflight cutoff prevents late POST and old keys are never reserialized',async()=>{
 let time=now,writes=0;const bodies=[];
 const a=bindOrdersAdapter({user:{get:async()=>seller},orders:{create:async args=>{writes++;bodies.push(args);return order();}}},c,{clock:()=>time});
 await a.create(terms,'stable');time+=10;await a.create(terms,'stable');
 assert.deepEqual(bodies[0],bodies[1]);assert.equal(bodies[0].body.transactions.payments[0].expiration_time,'PT30M');
 time=terms.expiresAt-1859;
 await assert.rejects(()=>a.create(terms,'stable'),e=>e.definite);assert.equal(writes,2);
 time=now;await assert.rejects(()=>a.create({...terms,pixRequestVersion:undefined},'old-key'),e=>e.definite);assert.equal(writes,2);
 const slow=bindOrdersAdapter({user:{get:async()=>{time=terms.expiresAt-1859;return seller;}},orders:{create:async()=>assert.fail('late POST')}},c,{clock:()=>time});
 await assert.rejects(()=>slow.create(terms,'slow'),e=>e.definite);
});

test('missing currency preserves accepted ID and safe issues but never grants payment proof',async()=>{
 const response=order(terms,{currency:undefined});
 const a=bindOrdersAdapter({user:{get:async()=>seller},orders:{create:async()=>response,get:async()=>response}},c,{clock:()=>now});
 const accepted=await a.create(terms,'key');assert.equal(accepted.remoteId,oid);assert.equal(accepted.checkoutState,'verification-required');assert.equal(accepted.pixCode,undefined);
 assert.deepEqual(accepted.verificationIssues,[{path:'currency',code:'mismatch-or-missing'}]);
 assert.equal((await a.resume(oid,terms)).remoteId,oid);
 await assert.rejects(()=>a.verify(oid,terms),e=>e.code==='pix-order-invalid');
});
