import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {resolve,basename} from 'node:path';import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';import {serveBuild} from './serve-build.mjs';
const root=resolve(import.meta.dirname,'..'),require=createRequire(resolve(root,'../video/package.json')),{chromium}=require('playwright-core');
const server=await serveBuild(resolve(root,'dist')),browser=await chromium.launch({executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
const dir=resolve(root,'evidence/performance/hero-visual');mkdirSync(dir,{recursive:true});const checks=[],errors=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name)};
try{
 for(const reference of [true,false]){
 const page=await browser.newPage({viewport:{width:1366,height:768}});page.on('pageerror',e=>errors.push(e.message));
 if(reference)await page.route('**/assets/cyber-engine/*.webp',route=>{const name=basename(new URL(route.request().url()).pathname).replace('-384','').replace('.webp','.png');return route.fulfill({contentType:'image/png',body:readFileSync(resolve(root,'source-assets/cyber-engine',name))})});
 await page.goto(server.url);await page.locator('.are-offer').waitFor();await page.mouse.wheel(0,120);await page.getByRole('button',{name:'Pause animation',exact:true}).click();await page.getByRole('button',{name:'Chapter 4:'}).click();await page.getByRole('button',{name:'Replay ↺',exact:true}).click();
 await page.locator('.projected-engine img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()))});
 check(`${reference?'source':'optimized'} parts start separated`,await page.locator('.generated-part').evaluateAll(es=>new Set(es.map(e=>getComputedStyle(e).transform)).size===3));
 check('brain initially hidden',await page.locator('.projected-brain').evaluate(e=>+getComputedStyle(e).opacity===0));
 await page.getByRole('button',{name:'Chapter 1:'}).click();
 check('brain and assembled engine visible',await page.evaluate(()=>+getComputedStyle(document.querySelector('.projected-brain')).opacity>.89&&+getComputedStyle(document.querySelector('.generated-engine')).opacity>.99));
 await page.screenshot({path:resolve(dir,reference?'original.png':'optimized.png')});
 if(!reference){
  const images=await page.locator('.projected-engine img').evaluateAll(imgs=>imgs.map(i=>({src:i.currentSrc,width:i.naturalWidth})));
  check('responsive images select 384px at this display size',images.length===5&&images.every(i=>i.width===384&&i.src.endsWith('-384.webp')));
  const ring=await page.locator('.story-particles').evaluate(c=>c.toDataURL());
  check('decorative canvas paints visible points',await page.locator('.story-particles').evaluate(c=>{const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])count++;return count>50}));
  await page.getByRole('button',{name:'Chapter 2:'}).click();
  check('point cloud changes for context scene',await page.locator('.story-particles').evaluate(c=>c.toDataURL())!==ring);
  for(const chapter of [2,3,4]){await page.getByRole('button',{name:`Chapter ${chapter}:`}).click();check(`chapter ${chapter} remains reachable`,await page.locator('.scroll-hero').getAttribute('data-stage')===String(chapter-1));}
  await page.getByRole('button',{name:'Chapter 1:'}).click();check('reverse seek restores engine',await page.locator('.generated-engine').evaluate(e=>+getComputedStyle(e).opacity>.99));
  check('reverse seek restores point cloud',await page.locator('.story-particles').evaluate(c=>c.toDataURL())===ring);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:resolve(dir,'mobile.png')});
 }
 await page.close();
 }
 check('no runtime errors',errors.length===0);writeFileSync(resolve(dir,'results.json'),JSON.stringify({status:'PASS',checks,errors},null,2)+'\n');console.log('PASS',checks);
}finally{await browser.close();await server.close()}
