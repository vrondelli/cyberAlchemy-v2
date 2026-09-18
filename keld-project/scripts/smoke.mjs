import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.KELD_PLAYWRIGHT_MODULE??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');const out=resolve(root,'evidence');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.KELD_CHROMIUM?{executablePath:process.env.KELD_CHROMIUM}:{executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'})});
const checks=[];const check=(name,value)=>{if(!value)throw Error(name);checks.push(name)};const base=process.env.KELD_PREVIEW_URL??'http://127.0.0.1:4194';
try{const p=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/','/shop.html','/legend.html']){const r=await p.goto(base+route);check(`${route}: served`,r.ok());check(`${route}: has title`,(await p.title()).length>0);check(`${route}: images loaded`,await p.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.getAttribute('src')&&i.loading!=='lazy').every(i=>i.complete&&i.naturalWidth>0)));}
 await p.goto(base+'/shop.html');await p.emulateMedia({reducedMotion:'reduce'});
 check('preview gates closed',await p.evaluate(()=>{const c=window.KELD_SHOP_CONFIG;return c.mode==='preview'&&!c.approvedForSale&&!c.fulfillmentReady&&!c.earlySupporter.entitlementReady}));
 if(await p.locator('#release-preview').count()){
  const response=await p.request.get(base+'/assets/are-release.json');check('release metadata served',response.ok());
  const metadata=await response.json();
  check('release version rendered',(await p.locator('#release-fact').innerText())===metadata.engine_version);
  check('release remains unavailable',metadata.checkout_enabled===false&&metadata.download_enabled===false);
  check('metadata excludes private source inventory',!('files' in metadata)&&!('archive' in metadata)&&!('private_url' in metadata));
  for(const path of ['/are-customer-bundle.tar.gz','/manifest.json','/evidence/customer-bundle/manifest.json'])check('private artifact inaccessible '+path,(await p.request.get(base+path)).status()===404);
 }
 check('initial price 200',await p.locator('#custom-price').inputValue()==='200');check('lower shelf initially hidden',!await p.locator('#hidden-shelf').isVisible());
 await p.locator('#custom-price').fill('125.25');await p.locator('#custom-price').blur();check('intentional price reveals shelf',await p.locator('#hidden-shelf').isVisible());await p.locator('#add-to-bag').click();check('exact cents retained in bag',await p.locator('#bag-price').inputValue()==='125.25');await p.locator('#review-checkout').click();check('checkout still labeled preview',/preview|not an order/i.test(await p.locator('#checkout-final-note').innerText()));await p.keyboard.press('Escape');
 for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:900});await p.goto(base+'/shop.html');check(`${width}: no horizontal overflow`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.setViewportSize({width:1440,height:1000});await p.goto(base+'/shop.html');await p.screenshot({path:resolve(out,'keld-shop.png')});check('no browser errors',errors.length===0);
 writeFileSync(resolve(out,'smoke.json'),JSON.stringify({status:'PASS',checks,claim_limit:'Local static website only. No payment, entitlement or ARE download was created.'},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length}));
}finally{await browser.close()}
