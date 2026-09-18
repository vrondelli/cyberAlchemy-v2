import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHandler} from '../src/index.mjs';
const [playwrightPath,chromiumPath,outputPath,...extra]=process.argv.slice(2);
if(!playwrightPath||!chromiumPath||extra.length){console.error('Usage: node test/browser-check.mjs <playwright-entry.mjs> <chromium-executable> [output-directory]');process.exit(1);}
const {chromium}=await import(pathToFileURL(resolve(playwrightPath)).href);
const output=resolve(outputPath??fileURLToPath(new URL('../.runtime/browser-check/',import.meta.url)));
await mkdir(output,{recursive:true});
let handler;
const server=createServer((req,res)=>{void handler(req,res);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:resolve(chromiumPath)});
 const origin=`http://127.0.0.1:${server.address().port}`,context=await browser.newContext({acceptDownloads:true});
 handler=createHandler({origin,auth:{handle:async()=>false},checkout:{},diagnostic:()=>{}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let active=true,creates=0,confirmed=false;
 const orderId='a'.repeat(32);
 await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
   const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
   if(url.pathname==='/api/session')return active?json({csrf:'fixture-csrf'}):json({error:'authentication-required'},401);
   if(url.pathname==='/auth/logout'){assert.equal(req.method(),'POST');assert.equal(req.headers()['x-csrf-token'],'fixture-csrf');active=false;return route.fulfill({status:303,headers:{location:'/signed-out'},body:''});}
   if(url.pathname==='/api/checkout'){creates++;return json({mode:'sandbox',orderId,remoteId:'cs_fixture',checkoutUrl:'https://checkout.stripe.com/c/pay/fixture',amountCents:20000,currency:'USD'});}
   if(url.pathname==='/api/confirm'){confirmed=true;return json({orderId,status:'paid'});}
   if(url.pathname==='/api/download'){assert.ok(confirmed&&active);return route.fulfill({contentType:'application/octet-stream',body:'ARE sandbox fixture'});}
   if(url.pathname==='/api/orders')return json({orders:[],next:null});
   return route.continue();
 });
 const layouts=[];
 for(const width of [1440,768,390,320,240]){
   await page.setViewportSize({width,height:900});await page.goto(origin);await page.getByText('Signed in. Choose your sandbox payment method.',{exact:true}).waitFor();
   const geometry=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));layouts.push(geometry);assert.equal(geometry.document,geometry.viewport,`Horizontal overflow at ${width}px`);
   await page.screenshot({path:join(output,`buyer-${width}.png`),fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Continue to sandbox payment',exact:true}).click();await page.getByRole('link',{name:'Open payment',exact:true}).waitFor();
 await page.reload();await page.getByRole('link',{name:'Open payment',exact:true}).waitFor();assert.equal(creates,1);
 await page.getByRole('button',{name:'Check payment status',exact:true}).click();await page.getByRole('button',{name:'Download test file',exact:true}).waitFor();
 const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'Download test file',exact:true}).click();const download=await waiting;
 assert.equal(await readFile(await download.path(),'utf8'),'ARE sandbox fixture');
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.waitForURL('**/signed-out');
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('keld-sdk-checkout-v1')),null);assert.equal(await page.getByRole('button',{name:'Sign out',exact:true}).isVisible(),false);
 await page.getByRole('link',{name:'Sign in to continue',exact:true}).waitFor();assert.deepEqual(errors,[]);
 const result={browser:browser.version(),layouts,creates,confirmed,download:download.suggestedFilename(),signedOut:!active,pageErrors:errors};
 await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
