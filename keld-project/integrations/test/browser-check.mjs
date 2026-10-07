import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve,join,extname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHandler} from '../src/index.mjs';

const [playwrightPath,chromiumPath,outputPath,...extra]=process.argv.slice(2);
if(!playwrightPath||!chromiumPath||extra.length){console.error('Usage: node test/browser-check.mjs <playwright-entry.mjs> <chromium-executable> [output-directory]');process.exit(1);}
const {chromium}=await import(pathToFileURL(resolve(playwrightPath)).href);
const output=resolve(outputPath??fileURLToPath(new URL('../.runtime/browser-check/',import.meta.url)));
await mkdir(output,{recursive:true});

async function loadBuiltApp(){
  const root=process.env.KELD_BROWSER_BUILD_DIR
    ?pathToFileURL(resolve(process.env.KELD_BROWSER_BUILD_DIR)+'/')
    :new URL('../../web/dist/',import.meta.url);
  const index=await readFile(new URL('index.html',root));
  const types=new Map([['.js','text/javascript'],['.css','text/css'],['.svg','image/svg+xml'],['.png','image/png'],['.webp','image/webp'],['.jpg','image/jpeg'],['.jpeg','image/jpeg'],['.avif','image/avif'],['.woff2','font/woff2']]);
  const assets=new Map();
  for(const relative of await readdir(new URL('assets/',root),{recursive:true})){
    const type=types.get(extname(relative).toLowerCase());
    if(!type)continue;
    assets.set('/assets/'+relative.replaceAll('\\','/'),{content:await readFile(new URL('assets/'+relative,root)),type,immutable:true});
  }
  assert.ok(assets.size>0,'run npm run build in keld-project/web before browser acceptance');
  return {index,assets};
}

let handler;
const server=createServer((req,res)=>{void handler(req,res);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:resolve(chromiumPath)});
  const origin=`http://127.0.0.1:${server.address().port}`,context=await browser.newContext({acceptDownloads:true});
  handler=createHandler({origin,app:await loadBuiltApp(),auth:{handle:async()=>false},checkout:{},diagnostic:()=>{}});
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));let active=true,creates=0,confirms=0,currentKey='',historicalDownloads=0,revoked=false;
  const orderId='a'.repeat(32),oldOrderId='c'.repeat(32);
  await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/session')return json(active?{authenticated:true,csrf:'fixture-csrf',buyerRef:'b'.repeat(64)}:{authenticated:false});
    if(url.pathname==='/auth/logout'){
      assert.equal(req.method(),'POST');assert.equal(req.headers()['x-csrf-token'],'fixture-csrf');active=false;
      return route.fulfill({status:204,body:''});
    }
    if(url.pathname==='/api/checkout'){
      creates++;assert.equal(req.method(),'POST');assert.equal(req.headers()['x-csrf-token'],'fixture-csrf');
      const body=req.postDataJSON();assert.equal(body.provider,'stripe');assert.equal(body.amountCents,20000);assert.match(body.requestKey,/^[A-Za-z0-9_-]+$/);currentKey=body.requestKey;
      return json({mode:'sandbox',orderId,checkoutUrl:'https://checkout.stripe.com/c/pay/fixture',amountCents:20000,currency:'USD'});
    }
    if(url.pathname==='/api/restore'){
      if(req.postDataJSON().orderId===oldOrderId)return json({input:{provider:'stripe',amountCents:5000},requestKey:'historical-key',state:'paid',ledgerStatus:'paid',result:{mode:'sandbox',orderId:oldOrderId,checkoutUrl:'https://checkout.stripe.com/c/pay/historical',amountCents:5000,currency:'USD'}});
      assert.equal(req.postDataJSON().orderId,orderId);
      if(revoked)return json({input:{provider:'stripe',amountCents:20000},requestKey:currentKey,state:'revoked',ledgerStatus:'revoked',revocationReason:'full-refund',lateRefundStatus:'verified-full-refund',result:{mode:'sandbox',orderId,remoteId:'cs_fixture',recovered:true,amountCents:20000,currency:'USD'}});
      return json({input:{provider:'stripe',amountCents:20000},requestKey:currentKey,state:confirms?'paid':'pending',ledgerStatus:confirms?'paid':'pending',result:{mode:'sandbox',orderId,checkoutUrl:'https://checkout.stripe.com/c/pay/fixture',amountCents:20000,currency:'USD'}});
    }
    if(url.pathname==='/api/confirm'){confirms++;return json({orderId,status:revoked?'revoked':'paid'});}
    if(url.pathname==='/api/download'){
      if(req.postDataJSON().orderId===oldOrderId){historicalDownloads++;return route.fulfill({contentType:'application/octet-stream',body:'Older paid fixture'});}
      assert.ok(confirms===1&&active);return route.fulfill({contentType:'application/octet-stream',body:'ARE sandbox fixture'});
    }
    if(url.pathname==='/api/orders')return json({orders:creates?[{orderId:oldOrderId,provider:'stripe',amountCents:5000,currency:'USD',createdAt:1,status:'paid'},...(revoked?[{orderId,provider:'stripe',amountCents:20000,currency:'USD',createdAt:2,status:'revoked',revocationReason:'full-refund',lateRefundStatus:'verified-full-refund'}]:[])]:[],next:null});
    return route.continue();
  });

  await page.goto(origin);
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Shop'}).click();
  await page.getByRole('button',{name:/Add sandbox test offer/}).click();
  await page.getByRole('button',{name:'Review checkout',exact:true}).click();
  await page.waitForURL(`${origin}/checkout?amount=200`);
  await page.getByRole('button',{name:'Continue to Stripe',exact:true}).waitFor();

  const layouts=[];
  for(const width of [1440,1024,768,390,320]){
    await page.setViewportSize({width,height:900});await page.goto(`${origin}/checkout?amount=200`);
    await page.getByRole('button',{name:'Continue to Stripe',exact:true}).waitFor();
    const geometry=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,active:document.activeElement?.id}));
    layouts.push(geometry);assert.equal(geometry.document,geometry.viewport,`Horizontal overflow at ${width}px`);assert.equal(geometry.active,'checkout-page-title');
    await page.screenshot({path:join(output,`checkout-review-${width}.png`),fullPage:true});
  }

  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Find my checkouts',exact:true}).click();
  await page.getByRole('heading',{name:'Your checkout history',exact:true}).waitFor();
  await page.getByText('No previous checkouts were found.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Close checkout history',exact:true}).click();
  await page.getByRole('button',{name:'Continue to Stripe',exact:true}).click();
  await page.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  await page.getByRole('button',{name:'Find my checkouts',exact:true}).click();
  await page.getByRole('button',{name:/paid ·/}).click();
  const olderDownload=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download this paid order',exact:true}).click();
  assert.equal(await readFile(await (await olderDownload).path(),'utf8'),'Older paid fixture');
  assert.equal(historicalDownloads,1);assert.equal(creates,1);
  await page.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  await page.reload();await page.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();assert.equal(creates,1);
  await page.getByRole('button',{name:'Check payment status',exact:true}).click();
  await page.getByRole('button',{name:'Download verified artifact',exact:true}).waitFor();assert.equal(confirms,1);
  await page.screenshot({path:join(output,'checkout-paid-390.png'),fullPage:true});
  const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'Download verified artifact',exact:true}).click();const download=await waiting;
  assert.equal(await readFile(await download.path(),'utf8'),'ARE sandbox fixture');
  revoked=true;
  await page.reload();
  await page.getByRole('heading',{name:/This order is closed/}).waitFor();
  await page.getByText(/KELD verified a full refund/).first().waitFor();
  await page.screenshot({path:join(output,'checkout-revoked-390.png'),fullPage:true});
  assert.equal(await page.getByRole('button',{name:'Download verified artifact',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Start another checkout',exact:true}).count(),1);
  assert.equal(await page.getByRole('button',{name:'Find my checkouts',exact:true}).count(),0);
  await page.getByRole('button',{name:'View order history',exact:true}).click();
  await page.getByRole('button',{name:/revoked ·/}).click();
  assert.equal(await page.getByRole('button',{name:'Download this paid order',exact:true}).count(),0);
  await page.getByRole('button',{name:'Close checkout history',exact:true}).click();
  await page.getByRole('button',{name:'Start another checkout',exact:true}).click();
  await page.getByRole('button',{name:'Continue to Stripe',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('keld-sdk-checkout-v1')),null);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL('**/signed-out');
  assert.equal(await page.getByRole('button',{name:'Sign out',exact:true}).isVisible().catch(()=>false),false);

  const recoveryContext=await browser.newContext();
  const recoveryPage=await recoveryContext.newPage();
  recoveryPage.on('pageerror',error=>errors.push(error.message));
  const retryKeys=[];let loseResponse=true,recoveryBuyerRef='b'.repeat(64),recoveryHistoryAvailable=false,blockedSecondTab=0,recoverySessionExpired=false,recoveryConfirms=0;
  await recoveryContext.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/auth/login')return route.fulfill({contentType:'text/html',body:'<title>Fixture sign-in</title>'});
    if(url.pathname==='/api/session')return recoverySessionExpired?json({error:'session_expired'},401):json({authenticated:true,csrf:'fixture-csrf',buyerRef:recoveryBuyerRef});
    if(url.pathname==='/api/checkout'){
      if(retryKeys.length===2){blockedSecondTab++;return json({error:'customer-checkout-pending'},409);}
      retryKeys.push(req.postDataJSON().requestKey);
      if(loseResponse){loseResponse=false;return route.abort('failed');}
      return json({mode:'sandbox',orderId,checkoutUrl:'https://checkout.stripe.com/c/pay/fixture',amountCents:20000,currency:'USD'});
    }
    if(url.pathname==='/api/checkout/lookup')return json({found:false});
    if(url.pathname==='/api/restore')return json({input:{provider:'stripe',amountCents:20000},requestKey:retryKeys[0],state:'pending',ledgerStatus:'pending',result:{mode:'sandbox',orderId,checkoutUrl:'https://checkout.stripe.com/c/pay/fixture',amountCents:20000,currency:'USD'}});
    if(url.pathname==='/api/confirm'){recoveryConfirms++;return json({orderId,status:'awaiting-payment'});}
    if(url.pathname==='/api/orders')return json({orders:recoveryHistoryAvailable?[{orderId,provider:'stripe',amountCents:20000,currency:'USD',createdAt:1,status:'pending'}]:[],next:null});
    return route.continue();
  });
  await recoveryPage.goto(`${origin}/checkout?amount=200`);
  await recoveryPage.getByRole('button',{name:'Continue to Stripe',exact:true}).click();
  await recoveryPage.getByRole('button',{name:'Resume this checkout',exact:true}).waitFor();
  await recoveryPage.reload();
  await recoveryPage.getByRole('button',{name:'Resume this checkout',exact:true}).click();
  await recoveryPage.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  assert.equal(retryKeys.length,2);assert.equal(retryKeys[0],retryKeys[1]);
  let releaseHeldRestore,markRestoreRequested;
  const heldRestore=new Promise(resolve=>{releaseHeldRestore=resolve;});
  const restoreRequested=new Promise(resolve=>{markRestoreRequested=resolve;});
  await recoveryPage.route('**/api/restore',async route=>{
    markRestoreRequested();await heldRestore;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
      input:{provider:'stripe',amountCents:20000},requestKey:retryKeys[0],state:'pending',ledgerStatus:'pending',
      result:{mode:'sandbox',orderId,checkoutUrl:'https://checkout.stripe.com/c/pay/fixture',amountCents:20000,currency:'USD'},
    })});
  });
  await recoveryPage.goto(`${origin}/checkout?amount=50`);
  await restoreRequested;
  assert.match(await recoveryPage.locator('.checkout-live-status').innerText(),/Checking your account and saved checkout/);
  assert.doesNotMatch(await recoveryPage.locator('.checkout-summary-column .checkout-order-card').innerText(),/\$50|\$200/);
  releaseHeldRestore();
  await recoveryPage.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  assert.match(await recoveryPage.locator('.checkout-summary-column .checkout-order-card').innerText(),/\$200/);
  assert.match(await recoveryPage.locator('.checkout-live-status').innerText(),/saved order is loaded/);
  await recoveryPage.unroute('**/api/restore');
  await recoveryPage.goto(`${origin}/checkout?amount=200`);
  await recoveryPage.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  recoverySessionExpired=true;
  await recoveryPage.reload();
  await recoveryPage.waitForURL(url=>url.pathname==='/auth/login'&&url.searchParams.get('returnTo')==='/checkout?amount=200');
  assert.equal(await recoveryPage.evaluate(()=>JSON.parse(sessionStorage.getItem('keld-sdk-checkout-v1')).requestKey),retryKeys[0]);
  recoverySessionExpired=false;
  await recoveryPage.goto(`${origin}/checkout?amount=200`);
  await recoveryPage.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  await recoveryPage.goto(`${origin}/purchase/return`);
  await recoveryPage.getByText(/provider has not confirmed payment yet/).waitFor();
  assert.equal(recoveryConfirms,1);
  assert.equal(await recoveryPage.getByRole('button',{name:'Download verified artifact',exact:true}).count(),0);
  await recoveryPage.goBack();
  await recoveryPage.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  await recoveryPage.goto(`${origin}/purchase/cancel`);
  await recoveryPage.getByText('Provider approval was cancelled.',{exact:true}).waitFor();
  assert.equal(await recoveryPage.getByRole('button',{name:'Download verified artifact',exact:true}).count(),0);
  assert.equal(retryKeys.length,2);
  recoveryBuyerRef='d'.repeat(64);
  await recoveryPage.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await recoveryPage.getByText(/checkout from a different account/).first().waitFor();
  assert.equal(new URL(recoveryPage.url()).origin,origin);
  await recoveryPage.reload();
  await recoveryPage.getByText(/checkout from a different account/).first().waitFor();
  assert.equal(await recoveryPage.getByRole('button',{name:'Open Stripe',exact:true}).count(),0);
  await recoveryPage.evaluate(()=>sessionStorage.setItem('keld-sdk-checkout-v1','{'));
  recoveryBuyerRef='b'.repeat(64);
  await recoveryPage.reload();
  await recoveryPage.getByText(/could not safely save the checkout/).waitFor();
  await recoveryPage.getByRole('button',{name:'Check this account’s history',exact:true}).click();
  await recoveryPage.getByText('No previous checkouts were found.',{exact:true}).waitFor();
  recoveryHistoryAvailable=true;
  const freshPage=await recoveryContext.newPage();
  freshPage.on('pageerror',error=>errors.push(error.message));
  await freshPage.goto(`${origin}/checkout?amount=200`);
  await freshPage.getByRole('button',{name:'Continue to Stripe',exact:true}).click();
  await freshPage.getByText(/earlier checkout is still pending/).first().waitFor();
  assert.match(await freshPage.locator('.checkout-live-status').innerText(),/No new checkout was opened/);
  assert.doesNotMatch(await freshPage.locator('.checkout-live-status').innerText(),/Preparing/);
  assert.equal(blockedSecondTab,1);
  await freshPage.getByRole('button',{name:'Find my checkouts',exact:true}).click();
  await freshPage.getByRole('button',{name:/pending ·/}).click();
  await freshPage.getByRole('button',{name:'Resume this order',exact:true}).click();
  await freshPage.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  assert.equal(retryKeys.length,2,'fresh-tab recovery must not create another provider attempt');
  assert.equal(await freshPage.evaluate(()=>JSON.parse(sessionStorage.getItem('keld-sdk-checkout-v1')).requestKey),retryKeys[0]);
  await freshPage.getByRole('button',{name:'Find my checkouts',exact:true}).click();
  await freshPage.getByRole('heading',{name:'Your checkout history',exact:true}).waitFor();
  recoveryBuyerRef='e'.repeat(64);
  await freshPage.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await freshPage.getByText(/checkout from a different account/).first().waitFor();
  assert.equal(await freshPage.getByRole('heading',{name:'Your checkout history',exact:true}).count(),0);
  await recoveryPage.close();
  await freshPage.close();
  recoveryBuyerRef='b'.repeat(64);
  const reopenedPage=await recoveryContext.newPage();
  reopenedPage.on('pageerror',error=>errors.push(error.message));
  await reopenedPage.goto(`${origin}/checkout?amount=200`);
  await reopenedPage.getByRole('button',{name:'Find my checkouts',exact:true}).click();
  await reopenedPage.getByRole('button',{name:/pending ·/}).click();
  await reopenedPage.getByRole('button',{name:'Resume this order',exact:true}).click();
  await reopenedPage.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  assert.equal(await reopenedPage.evaluate(()=>JSON.parse(sessionStorage.getItem('keld-sdk-checkout-v1')).requestKey),retryKeys[0]);
  assert.equal(retryKeys.length,2);
  await recoveryContext.close();

  // A pre-guard database may contain a second prepared key behind an older
  // unresolved provider order. Verify the older order without replacing the
  // blocked key or dispatching another payment.
  const historicalContext=await browser.newContext();
  const historicalPage=await historicalContext.newPage();
  historicalPage.on('pageerror',error=>errors.push(error.message));
  const historicalOrderId='9'.repeat(32);
  let historicalCreates=0,historicalChecks=0;
  await historicalPage.addInitScript(({ref})=>{
    sessionStorage.setItem('keld-sdk-checkout-v1',JSON.stringify({
      input:{provider:'stripe',amountCents:20000},requestKey:'historical-second',state:'pending',buyerRef:ref,
    }));
  },{ref:'b'.repeat(64)});
  await historicalContext.route('**/*',async route=>{
    const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/session')return json({authenticated:true,csrf:'fixture-csrf',buyerRef:'b'.repeat(64)});
    if(url.pathname==='/api/checkout'){
      historicalCreates++;
      assert.equal(route.request().postDataJSON().requestKey,'historical-second');
      return json({error:'checkout-reconciliation-required'},409);
    }
    if(url.pathname==='/api/orders')return json({orders:[{orderId:historicalOrderId,provider:'stripe',amountCents:20000,currency:'USD',createdAt:1,status:'expired'}],next:null});
    if(url.pathname==='/api/restore')return json({input:{provider:'stripe',amountCents:20000},requestKey:'older-bound',state:'pending',ledgerStatus:'expired',result:{mode:'sandbox',orderId:historicalOrderId,checkoutUrl:'https://checkout.stripe.com/c/pay/old',amountCents:20000,currency:'USD'}});
    if(url.pathname==='/api/confirm'){historicalChecks++;return json({orderId:historicalOrderId,status:'awaiting-payment'});}
    return route.continue();
  });
  await historicalPage.goto(`${origin}/checkout?amount=200`);
  await historicalPage.getByRole('button',{name:'Resume this checkout',exact:true}).click();
  await historicalPage.getByText(/earlier provider attempt needs reconciliation/).waitFor();
  await historicalPage.getByRole('button',{name:'Find my checkouts',exact:true}).first().click();
  await historicalPage.getByRole('button',{name:/expired ·/}).click();
  assert.equal(await historicalPage.getByRole('button',{name:'Resume this order',exact:true}).count(),0);
  await historicalPage.getByRole('button',{name:'Check this older payment',exact:true}).click();
  await historicalPage.getByText(/older payment is still unresolved/).waitFor();
  assert.equal(await historicalPage.evaluate(()=>JSON.parse(sessionStorage.getItem('keld-sdk-checkout-v1')).requestKey),'historical-second');
  assert.equal(historicalCreates,1);
  assert.equal(historicalChecks,1);
  await historicalContext.close();

  // A lost replacement response keeps the old order and exact new key until
  // an owned lookup after reload proves that one linked successor exists.
  const replacementContext=await browser.newContext();
  const replacementPage=await replacementContext.newPage();
  replacementPage.on('pageerror',error=>errors.push(error.message));
  const replacementOldId='7'.repeat(32),replacementNewId='8'.repeat(32);
  const replacementOldResult={mode:'sandbox',orderId:replacementOldId,amountCents:20000,currency:'USD',checkoutState:'expired',recovered:true,expiresAt:Math.floor(Date.now()/1000)-60};
  const replacementNewResult={mode:'sandbox',orderId:replacementNewId,amountCents:25000,currency:'USD',checkoutUrl:'https://checkout.stripe.com/c/pay/replacement-fixture'};
  let replacementKey='',replacementCreates=0,replacementLookupAvailable=false;
  await replacementPage.addInitScript(({ref,result})=>{
    if(!sessionStorage.getItem('keld-sdk-checkout-v1'))sessionStorage.setItem('keld-sdk-checkout-v1',JSON.stringify({input:{provider:'stripe',amountCents:20000},requestKey:'replacement-old-key',state:'pending',buyerRef:ref,result}));
  },{ref:'b'.repeat(64),result:replacementOldResult});
  await replacementContext.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/session')return json({authenticated:true,csrf:'fixture-csrf',buyerRef:'b'.repeat(64)});
    if(url.pathname==='/api/restore'){
      const {orderId:requested}=req.postDataJSON();
      return json(requested===replacementOldId
        ? {input:{provider:'stripe',amountCents:20000},requestKey:'replacement-old-key',state:'pending',ledgerStatus:'expired',replacementCheckAvailable:true,result:replacementOldResult}
        : {input:{provider:'stripe',amountCents:25000},requestKey:replacementKey,state:'pending',ledgerStatus:'pending',result:replacementNewResult});
    }
    if(url.pathname==='/api/checkout'){
      const body=req.postDataJSON();
      assert.equal(body.replaceOldOrderId,replacementOldId);
      assert.equal(body.amountCents,25000);
      replacementCreates++;replacementKey=body.requestKey;
      return route.abort('failed');
    }
    if(url.pathname==='/api/checkout/lookup'){
      if(!replacementLookupAvailable)return route.abort('failed');
      assert.equal(req.postDataJSON().requestKey,replacementKey);
      return json({found:true,orderId:replacementNewId,status:'pending',replacesOrderId:replacementOldId});
    }
    if(url.pathname==='/api/orders')return json({orders:[],next:null});
    if(url.pathname==='/api/confirm')return json({orderId:replacementOldId,status:'awaiting-payment'});
    return route.continue();
  });
  await replacementPage.goto(`${origin}/checkout?amount=200`);
  await replacementPage.getByRole('button',{name:'Check old payment and start a new checkout',exact:true}).waitFor();
  await replacementPage.getByRole('textbox',{name:'Your price in USD'}).fill('250');
  await replacementPage.getByRole('button',{name:'Check old payment and start a new checkout',exact:true}).click();
  await replacementPage.getByRole('button',{name:'Resume the saved replacement',exact:true}).waitFor();
  assert.equal(await replacementPage.evaluate(()=>JSON.parse(sessionStorage.getItem('keld-sdk-checkout-v1')).replacementDraft.nextRequestKey),replacementKey);
  replacementLookupAvailable=true;
  await replacementPage.reload();
  await replacementPage.getByRole('button',{name:'Resume the saved replacement',exact:true}).click();
  await replacementPage.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  assert.equal(replacementCreates,1);
  assert.equal(await replacementPage.evaluate(()=>JSON.parse(sessionStorage.getItem('keld-sdk-checkout-v1')).requestKey),replacementKey);
  await replacementContext.close();

  const visibilityContext=await browser.newContext();
  const visibilityPage=await visibilityContext.newPage();
  visibilityPage.on('pageerror',error=>errors.push(error.message));
  const visibilityOldId='4'.repeat(32),visibilityNewId='5'.repeat(32);
  const visibilityOldResult={mode:'sandbox',orderId:visibilityOldId,amountCents:20000,currency:'USD',checkoutState:'expired',recovered:true,expiresAt:Math.floor(Date.now()/1000)-60};
  const visibilityNewResult={mode:'sandbox',orderId:visibilityNewId,amountCents:25000,currency:'USD',checkoutUrl:'https://checkout.stripe.com/c/pay/visibility-fixture'};
  let visibilityKey='',markVisibilityCreate,releaseVisibilityCreate;
  const visibilityCreateStarted=new Promise(resolve=>{markVisibilityCreate=resolve;});
  const visibilityCreateReleased=new Promise(resolve=>{releaseVisibilityCreate=resolve;});
  await visibilityPage.addInitScript(({ref,result})=>{
    if(!sessionStorage.getItem('keld-sdk-checkout-v1'))sessionStorage.setItem('keld-sdk-checkout-v1',JSON.stringify({input:{provider:'stripe',amountCents:20000},requestKey:'visibility-old-key',state:'pending',buyerRef:ref,result}));
  },{ref:'b'.repeat(64),result:visibilityOldResult});
  await visibilityContext.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/session')return json({authenticated:true,csrf:'fixture-csrf',buyerRef:'b'.repeat(64)});
    if(url.pathname==='/api/restore'){
      const requested=req.postDataJSON().orderId;
      return json(requested===visibilityOldId
        ? {input:{provider:'stripe',amountCents:20000},requestKey:'visibility-old-key',state:'pending',ledgerStatus:'expired',replacementCheckAvailable:true,result:visibilityOldResult}
        : {input:{provider:'stripe',amountCents:25000},requestKey:visibilityKey,state:'pending',ledgerStatus:'pending',replacesOrderId:visibilityOldId,result:visibilityNewResult});
    }
    if(url.pathname==='/api/checkout'){
      visibilityKey=req.postDataJSON().requestKey;
      markVisibilityCreate();await visibilityCreateReleased;
      return json(visibilityNewResult);
    }
    if(url.pathname==='/api/checkout/lookup')return json({found:true,orderId:visibilityNewId,status:'pending',replacesOrderId:visibilityOldId});
    if(url.pathname==='/api/confirm')return json({orderId:visibilityOldId,status:'awaiting-payment'});
    return route.continue();
  });
  await visibilityPage.goto(`${origin}/checkout?amount=200`);
  await visibilityPage.getByRole('button',{name:'Check old payment and start a new checkout',exact:true}).waitFor();
  await visibilityPage.getByRole('textbox',{name:'Your price in USD'}).fill('250');
  await visibilityPage.getByRole('button',{name:'Check old payment and start a new checkout',exact:true}).click();
  await visibilityCreateStarted;
  await visibilityPage.evaluate(()=>{
    Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  releaseVisibilityCreate();
  await visibilityPage.getByRole('button',{name:'Open Stripe',exact:true}).waitFor();
  assert.doesNotMatch(await visibilityPage.locator('.checkout-live-status').innerText(),/Checking your account/);
  await visibilityContext.close();

  const linkedPixContext=await browser.newContext();
  const linkedPixPage=await linkedPixContext.newPage();
  linkedPixPage.on('pageerror',error=>errors.push(error.message));
  const linkedOldId='2'.repeat(32),linkedPixId='3'.repeat(32);
  const linkedOldResult={mode:'sandbox',orderId:linkedOldId,amountCents:20000,currency:'USD',checkoutState:'expired',recovered:true,expiresAt:Math.floor(Date.now()/1000)-60};
  const linkedPixPreparing={mode:'sandbox',orderId:linkedPixId,amountCents:127500,currency:'BRL',usdAmountCents:25000,quoteReference:'merchant-fixed-5.10',checkoutState:'preparing',expiresAt:Math.floor(Date.now()/1000)+3600,paymentExpiresAt:Math.floor(Date.now()/1000)+1800};
  const linkedPixReady={...linkedPixPreparing,checkoutState:'ready',pixCode:'000201-linked-replacement-fixture'};
  let linkedPixKey='',linkedPixCreates=0;
  await linkedPixPage.addInitScript(({ref,result})=>{
    if(!sessionStorage.getItem('keld-sdk-checkout-v1'))sessionStorage.setItem('keld-sdk-checkout-v1',JSON.stringify({input:{provider:'stripe',amountCents:20000},requestKey:'linked-pix-old-key',state:'pending',buyerRef:ref,result}));
  },{ref:'b'.repeat(64),result:linkedOldResult});
  await linkedPixContext.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/session')return json({authenticated:true,csrf:'fixture-csrf',buyerRef:'b'.repeat(64)});
    if(url.pathname==='/api/restore'){
      const requested=req.postDataJSON().orderId;
      return json(requested===linkedOldId
        ? {input:{provider:'stripe',amountCents:20000},requestKey:'linked-pix-old-key',state:'pending',ledgerStatus:'expired',replacementCheckAvailable:true,result:linkedOldResult}
        : {input:{provider:'mercadopago',amountCents:25000,payerEmail:'buyer@example.test'},requestKey:linkedPixKey,state:'pending',ledgerStatus:'pending',replacesOrderId:linkedOldId,result:linkedPixCreates>1?linkedPixReady:linkedPixPreparing});
    }
    if(url.pathname==='/api/checkout'){
      const body=req.postDataJSON();
      assert.equal(body.replaceOldOrderId,linkedOldId);
      assert.equal(body.provider,'mercadopago');
      assert.equal(body.amountCents,25000);
      assert.equal(body.payerEmail,'buyer@example.test');
      if(linkedPixKey)assert.equal(body.requestKey,linkedPixKey);
      linkedPixKey=body.requestKey;
      linkedPixCreates++;
      return json(linkedPixCreates>1?linkedPixReady:linkedPixPreparing);
    }
    if(url.pathname==='/api/checkout/lookup')return json({found:true,orderId:linkedPixId,status:'pending',replacesOrderId:linkedOldId});
    if(url.pathname==='/api/confirm')return json({orderId:linkedOldId,status:'awaiting-payment'});
    return route.continue();
  });
  await linkedPixPage.goto(`${origin}/checkout?amount=200`);
  await linkedPixPage.getByRole('button',{name:'Check old payment and start a new checkout',exact:true}).waitFor();
  await linkedPixPage.getByRole('textbox',{name:'Your price in USD'}).fill('250');
  await linkedPixPage.getByRole('radio',{name:/Mercado Pago Pix/}).check();
  await linkedPixPage.getByRole('textbox',{name:'Pix payer email'}).fill('buyer@example.test');
  await linkedPixPage.getByRole('button',{name:'Check old payment and start a new checkout',exact:true}).click();
  await linkedPixPage.getByRole('button',{name:'Copy Pix code',exact:true}).waitFor();
  assert.equal(linkedPixCreates,2);
  assert.equal(await linkedPixPage.getByRole('textbox',{name:'Pix copy-and-paste code'}).inputValue(),linkedPixReady.pixCode);
  await linkedPixContext.close();

  const pixContext=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
  const pixPage=await pixContext.newPage();
  pixPage.on('pageerror',error=>errors.push(error.message));
  const pixOrderId='f'.repeat(32),pixCode='00020126470014br.gov.bcb.pix0125keld-sandbox-fixture-12345';
  let savedPixKey='',pixCreates=0,pixConfirms=0;
  const pixDeadline=Math.floor(Date.now()/1000)+7;
  const pixResult={mode:'sandbox',orderId:pixOrderId,pixCode,amountCents:102000,currency:'BRL',usdAmountCents:20000,quoteReference:'merchant-fixed-5.10',expiresAt:pixDeadline+1800,paymentExpiresAt:pixDeadline};
  await pixContext.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/session')return json({authenticated:true,csrf:'fixture-csrf',buyerRef:'b'.repeat(64)});
    if(url.pathname==='/api/checkout'){
      const body=req.postDataJSON();assert.equal(body.provider,'mercadopago');assert.equal(body.amountCents,20000);assert.equal(body.payerEmail,'buyer@example.test');
      pixCreates++;savedPixKey=body.requestKey;return json(pixResult);
    }
    if(url.pathname==='/api/restore')return json({input:{provider:'mercadopago',amountCents:20000,payerEmail:'buyer@example.test'},requestKey:savedPixKey,state:'pending',ledgerStatus:'pending',result:pixResult});
    if(url.pathname==='/api/confirm'){pixConfirms++;return json({orderId:pixOrderId,status:'awaiting-payment'});}
    if(url.pathname==='/api/orders')return json({orders:[],next:null});
    return route.continue();
  });
  await pixPage.goto(`${origin}/checkout?amount=200`);
  await pixPage.getByRole('radio',{name:/Mercado Pago Pix/}).check();
  await pixPage.getByRole('textbox',{name:'Pix payer email'}).fill('buyer@example.test');
  await pixPage.getByRole('button',{name:'Generate sandbox Pix',exact:true}).click();
  await pixPage.getByRole('button',{name:'Copy Pix code',exact:true}).click();
  await pixPage.getByText(/Pix code copied/).waitFor();
  assert.equal(await pixPage.evaluate(()=>navigator.clipboard.readText()),pixCode);
  await pixPage.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>Promise.reject(new DOMException('Copy denied','NotAllowedError'))}));
  await pixPage.getByRole('button',{name:'Copy Pix code',exact:true}).click();
  await pixPage.getByText(/Select the Pix code above and copy it manually/).waitFor();
  assert.equal(await pixPage.getByRole('textbox',{name:'Pix copy-and-paste code'}).inputValue(),pixCode);
  await pixPage.getByRole('button',{name:'Copy Pix code',exact:true}).waitFor({state:'hidden',timeout:8000});
  assert.equal(await pixPage.getByRole('textbox',{name:'Pix copy-and-paste code'}).count(),0);
  assert.equal(pixCreates,1);
  assert.equal(await pixPage.getByRole('button',{name:'Download verified artifact',exact:true}).count(),0);
  await pixContext.close();

  const switchContext=await browser.newContext();
  const switchPage=await switchContext.newPage();
  switchPage.on('pageerror',error=>errors.push(error.message));
  let switchBuyerRef='b'.repeat(64),markCheckoutStarted,releaseCheckout;
  const checkoutStarted=new Promise(resolve=>{markCheckoutStarted=resolve;});
  const checkoutReleased=new Promise(resolve=>{releaseCheckout=resolve;});
  await switchContext.route('**/*',async route=>{
    const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/session')return json({authenticated:true,csrf:'fixture-csrf',buyerRef:switchBuyerRef});
    if(url.pathname==='/api/checkout'){
      markCheckoutStarted();await checkoutReleased;
      return json({mode:'sandbox',orderId,checkoutUrl:'https://checkout.stripe.com/c/pay/fixture',amountCents:20000,currency:'USD'});
    }
    return route.continue();
  });
  await switchPage.goto(`${origin}/checkout?amount=200`);
  await switchPage.getByRole('button',{name:'Continue to Stripe',exact:true}).click();
  await checkoutStarted;
  switchBuyerRef='d'.repeat(64);
  releaseCheckout();
  await switchPage.getByText(/checkout from a different account/).first().waitFor();
  assert.equal(await switchPage.getByRole('button',{name:'Open Stripe',exact:true}).count(),0);
  const switchedAttempt=await switchPage.evaluate(()=>JSON.parse(sessionStorage.getItem('keld-sdk-checkout-v1')));
  assert.equal(switchedAttempt.buyerRef,'b'.repeat(64));
  assert.equal(switchedAttempt.result,undefined);
  await switchContext.close();

  // A just-detected late payment must refresh the owned ledger projection
  // before the buyer sees refund copy, without implying a refund was sent.
  const lateContext=await browser.newContext(),latePage=await lateContext.newPage();
  latePage.on('pageerror',error=>errors.push(error.message));
  let lateKey='',lateRestores=0;
  await lateContext.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
    const json=body=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/session')return json({authenticated:true,csrf:'fixture-csrf',buyerRef:'b'.repeat(64)});
    if(url.pathname==='/api/checkout'){
      lateKey=req.postDataJSON().requestKey;
      return json({mode:'sandbox',orderId,checkoutUrl:'https://checkout.stripe.com/c/pay/fixture',amountCents:20000,currency:'USD',expiresAt:Math.floor(Date.now()/1000)+3600});
    }
    if(url.pathname==='/api/confirm')return json({orderId,status:'paid-review'});
    if(url.pathname==='/api/restore'){
      lateRestores++;
      return json({input:{provider:'stripe',amountCents:20000},requestKey:lateKey,state:'pending',ledgerStatus:'paid-review',lateRefundStatus:'recorded',result:{mode:'sandbox',orderId,remoteId:'cs_fixture',recovered:true,amountCents:20000,currency:'USD'}});
    }
    if(url.pathname==='/api/orders')return json({orders:[],next:null});
    return route.continue();
  });
  await latePage.goto(`${origin}/checkout?amount=200`);
  await latePage.getByRole('button',{name:'Continue to Stripe',exact:true}).click();
  await latePage.getByRole('button',{name:'Check payment status',exact:true}).click();
  await latePage.getByText(/KELD recorded this late payment for resolution/).first().waitFor();
  assert.ok(lateRestores>=1);
  assert.equal(await latePage.getByRole('button',{name:'Download verified artifact',exact:true}).count(),0);
  await lateContext.close();
  assert.deepEqual(errors,[]);
  const result={browser:browser.version(),layouts,creates,confirms,historicalDownloads,revokedOrderNoDownload:true,lateRefundOwnedRestores:lateRestores,recoveryRetryKeysEqual:retryKeys[0]===retryKeys[1],authRenewalPreservedKey:true,recoveryConfirms,providerReturnNotPaid:true,cancelNotPaid:true,freshTabHistoryResume:true,blockedSecondTab,replacementLostResponseRecovered:true,replacementCreates,visibilityRefreshAfterAction:true,linkedPixPreparingSameKey:true,linkedPixCreates,historicalOlderPaymentCheckedWithoutSwitch:historicalCreates===1&&historicalChecks===1,crossAccountHistoryHidden:true,crossAccountProviderLinks:0,inflightAccountSwitchHidden:true,corruptStorageHistoryAvailable:true,pixCreates,pixConfirms,pixClipboardCopied:true,pixManualFallback:true,pixInstructionsExpired:true,download:download.suggestedFilename(),signedOut:!active,pageErrors:errors};
  await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
