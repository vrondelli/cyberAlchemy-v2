import test from 'node:test';
import assert from 'node:assert/strict';
import {createBuyerClient,parsePrice} from '../public/buyer-client.mjs';
import {createHandler} from '../src/index.mjs';
const orderId='a'.repeat(32);
function storage(){const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body,blob:async()=>new Blob(['fixture'])});
const input={provider:'stripe',amountCents:20000};
const result={mode:'sandbox',orderId,checkoutUrl:'https://checkout.stripe.com/c/pay/fixture',amountCents:20000,currency:'USD'};
test('buyer persists idempotency before dispatch and resumes across reload after a lost response',async()=>{
 const saved=storage();const keys=[];let failed=false;
 const fetch=async(path,options)=>{if(path==='/api/session')return response({csrf:'csrf'});assert.equal(options.headers['x-csrf-token'],'csrf');keys.push(JSON.parse(options.body).requestKey);if(!failed){failed=true;throw Error('response lost');}return response(result);};
 const first=createBuyerClient({storage:saved,fetch,uuid:()=> 'stable-key'});
 await assert.rejects(()=>first.create(input));assert.equal(first.pending().requestKey,'stable-key');
 assert.throws(()=>first.reset(),e=>e.code==='payment-outcome-uncertain');
 const next=createBuyerClient({storage:saved,fetch,uuid:()=> 'must-not-be-used'});assert.deepEqual(await next.create(input),result);assert.deepEqual(keys,['stable-key','stable-key']);
 await assert.rejects(()=>next.create({...input,amountCents:30000}),e=>e.code==='checkout-conflict');
});
test('storage failure prevents payment dispatch; sign-in failure retains draft',async()=>{
 let requests=0;const broken=createBuyerClient({storage:{getItem:()=>null,setItem:()=>{throw Error();}},fetch:async()=>{requests++;},uuid:()=> 'key'});
 await assert.rejects(()=>broken.create(input),e=>e.code==='storage-unavailable');assert.equal(requests,0);
 const buyer=createBuyerClient({storage:storage(),fetch:async()=>response({error:'authentication-required'},401),uuid:()=> 'key'});
 await assert.rejects(()=>buyer.create(input),e=>e.code==='authentication-required');assert.equal(buyer.pending().requestKey,'key');
});
test('buyer allows new checkout only after definite failure or verified payment',async()=>{
 let mode='fail',sequence=0;const calls=[];
 const buyer=createBuyerClient({storage:storage(),uuid:()=>String(++sequence),fetch:async(path,options)=>{
   if(path==='/api/session')return response({csrf:'csrf'});calls.push(path);
   if(path==='/api/checkout')return mode==='fail'?response({error:'payment-creation-failed'},503):response(result);
   if(path==='/api/confirm')return response({orderId,status:mode==='paid'?'paid':'awaiting-payment'});
   if(path==='/api/download')return response({});
 }});
 await assert.rejects(()=>buyer.create(input));assert.equal(buyer.pending().state,'failed');buyer.reset();mode='create';await buyer.create(input);assert.equal(sequence,2);
 assert.equal((await buyer.confirm()).status,'awaiting-payment');assert.equal(buyer.pending().state,'pending');
 mode='paid';await buyer.confirm();assert.equal(buyer.pending().state,'paid');assert.equal(await (await buyer.download()).text(),'fixture');buyer.reset();assert.equal(buyer.pending(),null);
});
test('buyer rejects non-sandbox destinations and parses cents without rounding',async()=>{
 const buyer=createBuyerClient({storage:storage(),uuid:()=> 'key',fetch:async path=>response(path==='/api/session'?{csrf:'csrf'}:{...result,checkoutUrl:'https://attacker.invalid/pay'})});
 await assert.rejects(()=>buyer.create(input),e=>e.code==='invalid-checkout-response');
 assert.equal(parsePrice('50.01'),5001);for(const x of ['49.99','1000.01','50.001','1e3','-50'])assert.throws(()=>parsePrice(x));
});
test('buyer return pages never confirm or grant payment and assets use an exact route allowlist',async()=>{
 let calls=0;const handler=createHandler({origin:'https://keld.localhost',auth:{handle:async()=>false},checkout:{confirm:()=>{calls++;}},diagnostic:()=>{}});
 const call=async(url)=>{const req={url,method:'GET',headers:{host:'keld.localhost'}};const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(body){this.body=body;}};await handler(req,res);return res;};
 for(const path of ['/','/purchase/return?token=untrusted&PayerID=untrusted','/purchase/cancel','/signed-out']){const r=await call(path);assert.equal(r.status,200);assert.match(String(r.body),/Sandbox/);assert.match(r.headers['content-security-policy'],/frame-ancestors 'none'/);}
 assert.equal(calls,0);assert.equal((await call('/buyer-client.mjs')).status,200);assert.equal((await call('/src/payments.mjs')).status,404);
});

test('fresh browser restores server-owned request identity and cannot replace a different uncertain checkout',async()=>{
 const recovered={input,requestKey:'original-key',state:'pending',ledgerStatus:'pending',result};let createdKey;
 const fetch=async(path,options)=>{
   if(path==='/api/session')return response({csrf:'csrf'});
   if(path==='/api/restore')return response(recovered);
   if(path==='/api/orders')return response({orders:[{orderId,status:'pending'}]});
   createdKey=JSON.parse(options.body).requestKey;return response(result);
 };
 const buyer=createBuyerClient({storage:storage(),fetch,uuid:()=> 'new-key'});
 assert.equal((await buyer.orders()).orders.length,1);await buyer.restore(orderId);await buyer.create(input);assert.equal(createdKey,'original-key');
 recovered.requestKey='different-key';await assert.rejects(()=>buyer.restore(orderId),e=>e.code==='checkout-conflict');assert.equal(buyer.pending().requestKey,'original-key');
});

test('history pagination uses the exact before parameter and rejects extra or duplicate query fields',async()=>{
 const calls=[];const client=createBuyerClient({storage:storage(),fetch:async path=>{calls.push(path);return response({orders:[],next:null});}});
 await client.orders(orderId);assert.equal(calls[0],'/api/orders?before='+orderId);
 let seen;const handler=createHandler({origin:'https://keld.localhost',auth:{handle:async()=>false},checkout:{list:async(req,before)=>{seen=before;return {orders:[],next:null};}},diagnostic:()=>{}});
 const call=async query=>{const req={url:'/api/orders'+query,method:'GET',headers:{host:'keld.localhost'}};const res={writeHead(s){this.status=s;},end(){}};await handler(req,res);return res.status;};
 assert.equal(await call('?before='+orderId),200);assert.equal(seen,orderId);
 assert.equal(await call('?before='+orderId+'&before='+orderId),400);
 assert.equal(await call('?customer=bob'),400);
});

test('recovered paid checkout restores without a payment link and still uses authenticated download',async()=>{
 const saved=storage(),paths=[];const recovered={input,requestKey:'recovered-key',state:'paid',result:{mode:'sandbox',orderId,amountCents:20000,currency:'USD',recovered:true}};
 const fetch=async(path,options)=>{paths.push(path);if(path==='/api/session')return response({csrf:'csrf'});if(path==='/api/restore')return response(recovered);assert.equal(options.headers['x-csrf-token'],'csrf');assert.deepEqual(JSON.parse(options.body),{orderId});return response({});};
 const buyer=createBuyerClient({storage:saved,fetch});await buyer.restore(orderId);
 const reloaded=createBuyerClient({storage:saved,fetch});assert.equal(reloaded.pending().state,'paid');assert.equal(await (await reloaded.download()).text(),'fixture');assert.deepEqual(paths,['/api/session','/api/restore','/api/session','/api/download']);
 recovered.result.checkoutUrl='https://attacker.invalid';await assert.rejects(()=>buyer.restore(orderId),{code:'invalid-checkout-response'});
});

test('logout retains uncertain checkout on revocation failure and clears it only after success',async()=>{
 const saved=storage();let fail=true;
 const buyer=createBuyerClient({storage:saved,uuid:()=> 'logout-pending',fetch:async(path,options)=>{
   if(path==='/api/session')return response({csrf:'csrf'});
   if(path==='/api/checkout')return response(result);
   assert.equal(path,'/auth/logout');assert.equal(options.method,'POST');assert.equal(options.headers['x-csrf-token'],'csrf');
   return fail?response({error:'service-unavailable'},503):response({});
 }});
 await buyer.create(input);await assert.rejects(()=>buyer.logout(),{code:'service-unavailable'});assert.equal(buyer.pending().state,'pending');
 fail=false;await buyer.logout();assert.equal(buyer.pending(),null);
});

test('sign-out remains usable with damaged storage and reports successful revocation separately',async t=>{
 const originals=new Map(['document','location','sessionStorage','fetch'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 t.after(()=>{for(const [k,v] of originals){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}});
 const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{hidden:true,disabled:false,addEventListener(event,callback){this[event]=callback;}});return elements.get(id);};
 globalThis.document={getElementById:element};globalThis.location={pathname:'/',assign(){throw Error('must report storage failure');}};
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem(){throw Error('corrupt');},removeItem(){throw Error('cannot clear');}}});
 let loggedOut=false;globalThis.fetch=async path=>{if(path==='/api/session')return response({csrf:'csrf'});assert.equal(path,'/auth/logout');loggedOut=true;return response({});};
 await import('../public/buyer.mjs?logout-storage-test');await new Promise(resolve=>setImmediate(resolve));
 assert.equal(element('logout').hidden,false);await element('logout').click();
 assert.equal(loggedOut,true);assert.equal(element('logout').hidden,true);assert.match(element('status').textContent,/You are signed out/);
});

test('Pix preparing response survives reload and refreshes with the same request key',async()=>{
 const saved=storage(),keys=[];let calls=0;
 const fetch=async(path,options)=>{
  if(path==='/api/session')return response({csrf:'csrf'});
  keys.push(JSON.parse(options.body).requestKey);calls++;
  return response({mode:'sandbox',orderId,amountCents:25000,currency:'BRL',expiresAt:2000000000,
   ...(calls===1?{checkoutState:'preparing'}:{checkoutState:'ready',pixCode:'000201-test'})});
 };
 const input={provider:'mercadopago',amountCents:5000,payerEmail:'buyer@example.test'};
 const first=createBuyerClient({storage:saved,fetch,uuid:()=> 'same-key'});
 assert.equal((await first.create(input)).checkoutState,'preparing');assert.throws(()=>first.reset());
 const restored=createBuyerClient({storage:saved,fetch,uuid:()=>assert.fail('must retain key')});
 assert.equal((await restored.create(input)).pixCode,'000201-test');assert.deepEqual(keys,['same-key','same-key']);
});

test('expired Pix instructions disappear at the deadline, including restored state',async()=>{
 const {paymentPresentation}=await import('../public/buyer-client.mjs');
 const r={pixCode:'fixture',checkoutUrl:'https://example.test',paymentExpiresAt:100,expiresAt:200};
 assert.equal(paymentPresentation(r,99).pixCode,'fixture');
 for(const now of [100,201]){const view=paymentPresentation(JSON.parse(JSON.stringify(r)),now);assert.equal(view.pixCode,undefined);assert.equal(view.checkoutUrl,undefined);assert.equal(view.checkoutState,'expired');}
 assert.equal(paymentPresentation({...r,paymentExpiresAt:300},200).checkoutState,'expired');
 assert.equal(r.pixCode,'fixture');
});
