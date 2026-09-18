// Browser smoke test; pass PLAYWRIGHT_MODULE and optional BASE_URL in the environment.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--no-sandbox']});
 const base=process.env.BASE_URL||'http://127.0.0.1:4189';
 let errors=[];
 for(const lang of ['pt','en']){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  const result=await page.goto(base+(lang==='en'?'/en/':'/'));assert.equal(result.status(),200);
  await page.locator('.brand img').evaluate(i=>i.decode());
  for(const image of await page.locator('img').all()) assert(await image.evaluate(i=>i.complete&&i.naturalWidth>0));
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('.product-tabs [role=tab]').count(),6);
  for(const id of ['craft','alchlang','workspace','ontology','essays','are']){
   await page.locator('#tab-'+id).click();assert(await page.locator('#'+id).isVisible());assert.equal(await page.locator('.product-panel:visible').count(),1);
  }
  await page.locator('#tab-craft').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#tab-alchlang').getAttribute('aria-selected'),'true');
  for(let i=0;i<4;i++){await page.locator('#step-tab-'+i).click();assert(await page.locator('#step-'+i).isVisible());}
  await page.locator('.open-questions summary').click();assert(await page.locator('.open-questions').evaluate(e=>e.open));
  await page.goto(base+(lang==='en'?'/en/':'/')+'#essays');assert(await page.locator('#essays').isVisible());
  await page.locator('.languages a[lang="'+(lang==='en'?'pt-BR':'en')+'"]').click();assert.equal(new URL(page.url()).hash,'#essays');assert(await page.locator('#essays').isVisible());
  await page.goto(base+(lang==='en'?'/en/':'/'));
  for(const width of [1440,768,390,320]){
   await page.setViewportSize({width,height:width===1440?1000:844});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+lang+' '+width);
   for(const id of ['craft','alchlang','workspace','ontology','essays','are']){await page.locator('#tab-'+id).click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'tab overflow '+id);}
   await page.locator('#tab-craft').click();await page.evaluate(()=>scrollTo(0,0));
   if(process.env.OUTPUT_DIR&&[1440,390].includes(width))await page.screenshot({path:process.env.OUTPUT_DIR+'/'+lang+'-'+width+'.png',fullPage:true});
  }
  await page.close();
 }
 const context=await browser.newContext({javaScriptEnabled:false});const p=await context.newPage();await p.goto(base);assert.equal(await p.locator('.product-panel:visible').count(),6);assert.equal(await p.locator('.step-panel:visible').count(),4);await context.close();
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS PT/EN: six product tabs, four approach tabs, keyboard, language/deep links, open questions, images, 320–1440px overflow and no-JS content.');
})().catch(e=>{console.error(e);process.exit(1)});
