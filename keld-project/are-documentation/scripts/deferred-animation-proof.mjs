import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
import {serveBuild} from './serve-build.mjs';

const root=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(root,'../video/package.json'));
const {chromium}=require('playwright-core');
const server=await serveBuild(resolve(root,'dist'));
const browser=await chromium.launch({executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
const checks=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name)};

try {
  const opening=await browser.newPage({viewport:{width:1440,height:900}}),openingRequests=[];
  opening.on('request',request=>openingRequests.push(request.url()));
  await opening.goto(server.url+'#view=intro');
  await opening.waitForTimeout(1200);
  const animationRequests=()=>openingRequests.filter(url=>/AnimatedHero|cyber-engine|particle-worker/.test(url));
  check('opening has no animation DOM',await opening.locator('.hero-sticky').count()===0);
  check('opening has no animation controls',await opening.getByRole('button',{name:'Pause animation',exact:true}).count()===0);
  check('opening requests no animation code, images, or worker',animationRequests().length===0);

  const tryLink=opening.locator('.topbar nav a',{hasText:'Try ARE'});
  check('Try ARE targets the live chat',await tryLink.getAttribute('href')==='#are-walkthrough');
  await tryLink.click();
  await opening.locator('#are-walkthrough textarea').waitFor({state:'visible'});
  await opening.waitForTimeout(400);
  check('Try ARE reaches chat without loading animation',animationRequests().length===0);
  await opening.close();

  const scrolling=await browser.newPage({viewport:{width:1440,height:900}}),scrollRequests=[];
  scrolling.on('request',request=>scrollRequests.push(request.url()));
  await scrolling.goto(server.url+'#view=intro');
  await scrolling.locator('.are-offer').waitFor({state:'visible'});
  await scrolling.mouse.wheel(0,120);
  await scrolling.locator('.hero-sticky').waitFor({state:'attached'});
  await scrolling.getByRole('button',{name:'Pause animation',exact:true}).waitFor({state:'visible'});
  check('scroll loads the animation bundle',scrollRequests.some(url=>url.includes('AnimatedHero')));
  check('scroll loads engine imagery',scrollRequests.some(url=>url.includes('cyber-engine')));
  const progress=await scrolling.locator('.scroll-hero').getAttribute('data-progress');
  await scrolling.waitForFunction(value=>document.querySelector('.scroll-hero')?.getAttribute('data-progress')!==value,progress,{timeout:3500});
  check('animation advances after scroll',true);
  await scrolling.close();

  const cta=await browser.newPage({viewport:{width:1440,height:900}});
  await cta.goto(server.url+'#view=intro');
  await cta.locator('.are-offer').waitFor({state:'visible'});
  await cta.getByRole('button',{name:/See the missing layer/}).click();
  await cta.locator('.hero-sticky').waitFor({state:'attached'});
  await cta.waitForFunction(()=>scrollY>0);
  check('offer CTA loads and reveals the animation',true);
  await cta.close();

  const result={status:'PASS',checks,date:new Date().toISOString()};
  writeFileSync(resolve(root,'evidence/performance/deferred-animation-proof.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
} finally {
  await browser.close();
  await server.close();
}
