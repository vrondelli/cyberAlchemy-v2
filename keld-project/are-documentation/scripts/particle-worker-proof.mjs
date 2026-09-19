import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {resolve} from 'node:path';import {writeFileSync} from 'node:fs';import {serveBuild} from './serve-build.mjs';
const root=resolve(import.meta.dirname,'..'),require=createRequire(resolve(root,'../video/package.json')),{chromium}=require('playwright-core');
const server=await serveBuild(resolve(root,'dist')),browser=await chromium.launch({executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
const checks=[];
try{
 for(const mode of ['worker','unsupported','failed']){
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(mode==='unsupported')await page.addInitScript(()=>{HTMLCanvasElement.prototype.transferControlToOffscreen=undefined});
  if(mode==='failed')await page.route('**/particle-worker-*.js',r=>r.abort());
  await page.goto(server.url);
  await page.locator('.are-offer').waitFor();
  assert.equal(await page.locator('.particle-depth-surface').count(),0,`${mode} is deferred before scroll`);
  await page.mouse.wheel(0,120);
  await page.waitForFunction(expected=>document.querySelector('.particle-depth-surface')?.dataset.renderer===expected,mode==='worker'?'worker':'main');
  const time=()=>page.locator('.particle-depth-surface').getAttribute('data-time');
  await page.waitForFunction(()=>Number(document.querySelector('.particle-depth-surface')?.dataset.time)>.1);
  await page.getByRole('button',{name:'Pause animation',exact:true}).click();await page.waitForTimeout(250);const stopped=await time();await page.waitForTimeout(400);assert.equal(await time(),stopped,`${mode} pause`);
  await page.getByRole('button',{name:'Resume animation',exact:true}).click();
  await page.waitForFunction(previous=>Number(document.querySelector('.particle-depth-surface')?.dataset.time)>Number(previous),stopped);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(250);const reduced=await time();await page.waitForTimeout(400);assert.equal(await time(),reduced,`${mode} reduced motion`);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await page.waitForFunction(()=>document.querySelector('.particle-depth-surface').getBoundingClientRect().bottom<=0);
  // IntersectionObserver and already-posted worker messages are asynchronous. Require a
  // stable interval before starting the assertion rather than assuming a fixed delivery lag.
  await page.waitForFunction(()=>{const canvas=document.querySelector('.particle-depth-surface');const current=canvas.dataset.time;if(canvas.dataset.proofTime===current)return true;canvas.dataset.proofTime=current;return false},null,{polling:500,timeout:5000});
  const offscreen=await time();await page.waitForTimeout(500);assert.equal(await time(),offscreen,`${mode} offscreen`);
  assert.deepEqual(errors,[],`${mode} runtime errors`);checks.push(`${mode}: starts, pauses, resumes, respects reduced motion and offscreen`);await page.close();
 }
 const docs=await browser.newPage();await docs.goto(server.url+'#view=docs');await docs.waitForTimeout(600);assert.equal(await docs.locator('link[data-are-hero]').count(),0);assert.equal(await docs.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/cyber-engine/')).length),0);checks.push('direct documentation route does not preload hero images');await docs.close();
 writeFileSync(resolve(root,'evidence/performance/particle-worker-proof.json'),JSON.stringify({status:'PASS',checks},null,2)+'\n');console.log(checks);
}finally{await browser.close();await server.close()}
