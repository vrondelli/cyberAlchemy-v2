import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
import {serveBuild} from './serve-build.mjs';
const root=resolve(import.meta.dirname,'..'),require=createRequire(resolve(root,'../video/package.json'));
const {chromium}=require('playwright-core');
const server=await serveBuild(resolve(root,'dist'));
const browser=await chromium.launch({executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
const results=[];
try{for(const variant of ['normal','no-background','no-filters']){
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 await page.goto(server.url+(variant==='no-background'?'?background=halo':''));
 if(variant==='no-filters')await page.addStyleTag({content:'.scroll-hero *{filter:none!important;backdrop-filter:none!important}'});
 await page.getByRole('button',{name:'Chapter 1:'}).click();
 const initial=await page.locator('.scroll-hero').getAttribute('data-progress');
 await page.waitForFunction(p=>document.querySelector('.scroll-hero').dataset.progress!==p,initial);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 const before=(await cdp.send('Performance.getMetrics')).metrics;
 const frames=await page.evaluate(()=>new Promise(done=>{let previous=performance.now(),start=previous;const samples=[];function tick(now){samples.push(now-previous);previous=now;if(now-start>3000)done(samples);else requestAnimationFrame(tick)}requestAnimationFrame(tick)}));
 const {profile}=await cdp.send('Profiler.stop'),after=(await cdp.send('Performance.getMetrics')).metrics;
 const nodes=new Map(profile.nodes.map(n=>[n.id,n])),weights=new Map();profile.samples.forEach((id,i)=>weights.set(id,(weights.get(id)??0)+(profile.timeDeltas[i]??0)));
 const top=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,16).map(([id,us])=>({ms:us/1000,...nodes.get(id).callFrame}));
 const metrics=Object.fromEntries(after.filter(m=>/Duration|Count/.test(m.name)).map(m=>[m.name,m.value-(before.find(b=>b.name===m.name)?.value??0)]));
 results.push({variant,metrics,top,frameP95Ms:frames.sort((a,b)=>a-b)[Math.ceil(frames.length*.95)-1]});console.log(JSON.stringify(results.at(-1)));await page.close();
}}finally{mkdirSync(resolve(root,'evidence/performance'),{recursive:true});writeFileSync(resolve(root,'evidence/performance/hero-profile.json'),JSON.stringify({scope:'Controlled diagnostic, one sample per intervention; not acceptance evidence',results},null,2)+'\n');await browser.close();await server.close()}
