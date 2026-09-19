import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync,readFileSync,copyFileSync} from 'node:fs';
import os from 'node:os';
import {serveBuild} from './serve-build.mjs';
import {percentile,frameSummary} from './page-performance-metrics.mjs';

const root=resolve(import.meta.dirname,'..'),evidence=resolve(root,'evidence/performance/round-3');
mkdirSync(evidence,{recursive:true});
copyFileSync(resolve(root,'evidence/performance/page-current.json'),resolve(root,'evidence/performance/page-before-round-3.json'));
const require=createRequire(resolve(root,'../video/package.json')),{chromium}=require('playwright-core');
const server=await serveBuild(resolve(root,'dist'));
const browser=await chromium.launch({executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
const profile={width:390,height:844,latencyMs:100,downloadMbps:4,cpuRate:4};
const loadRuns=[],motionRuns=[],errors=[];
const preloadBlock=()=>{
 const append=Element.prototype.append;
 Element.prototype.append=function(...nodes){return append.apply(this,nodes.filter(node=>!(node instanceof HTMLLinkElement&&node.rel==='preload'&&node.dataset.areHero)))};
 const appendChild=Node.prototype.appendChild;
 Node.prototype.appendChild=function(node){if(node instanceof HTMLLinkElement&&node.rel==='preload'&&node.dataset.areHero)return node;return appendChild.call(this,node)};
};
async function context(blockPreload=false){
 const value=await browser.newContext({viewport:{width:profile.width,height:profile.height},serviceWorkers:'block'});
 if(blockPreload)await value.addInitScript(preloadBlock);
 const page=await value.newPage();page.setDefaultTimeout(90000);
 await page.route('**/api/are/status',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({configured:false,mode:'research-fixture',scope:'conversation-only'})}));
 page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
 const cdp=await value.newCDPSession(page);await cdp.send('Network.enable');
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latencyMs,downloadThroughput:profile.downloadMbps*1000000/8,uploadThroughput:1000000/8});
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpuRate});
 return {value,page,cdp};
}
async function loadTrial(variant,repeat,order){
 const {value,page}=await context(variant==='blocked-preload');
 await page.addInitScript(()=>{window.__lcp=null;if(PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint'))new PerformanceObserver(list=>{for(const item of list.getEntries())window.__lcp=item.startTime}).observe({type:'largest-contentful-paint',buffered:true})});
 await page.goto(server.url,{waitUntil:'load'});await page.getByRole('button',{name:'Chapter 1:'}).waitFor();
 await page.locator('.projected-engine img').evaluateAll(async images=>Promise.all(images.map(image=>image.decode())));
 const readyMs=await page.evaluate(()=>performance.now());await page.waitForTimeout(500);
 const result=await page.evaluate(()=>({lcpMs:window.__lcp,preloads:document.querySelectorAll('link[data-are-hero]').length,heroRequests:performance.getEntriesByType('resource').filter(item=>item.name.includes('/cyber-engine/')).map(item=>({name:item.name.split('/').pop(),startTime:item.startTime,responseEnd:item.responseEnd}))}));
 loadRuns.push({variant,repeat,order,readyMs,...result});await value.close();
}
async function sample(page,selector,durationMs){
 return page.evaluate(async({selector,durationMs})=>{const start=performance.now(),frames=[];let previous=start;await new Promise(done=>{function frame(now){frames.push(now-previous);previous=now;if(now-start>=durationMs)done();else requestAnimationFrame(frame)}requestAnimationFrame(frame)});return frames},{selector,durationMs});
}
const css={
 control:'',
 noFilters:'.scroll-hero *{filter:none!important;backdrop-filter:none!important;box-shadow:none!important}',
 noBackgroundPaint:'.hero-backdrop{visibility:hidden!important}'
};
async function motionTrial(variant,repeat,order){
 const {value,page,cdp}=await context();await page.goto(server.url);
 if(css[variant])await page.addStyleTag({content:css[variant]});
 await page.getByRole('button',{name:'Chapter 4:'}).click();await page.getByRole('button',{name:'Replay ↺',exact:true}).click();
 await cdp.send('Performance.enable');const before=(await cdp.send('Performance.getMetrics')).metrics;
 const assembly=frameSummary(await sample(page,'.scroll-hero',3000),3000,[]);
 await page.getByRole('button',{name:'Chapter 4:'}).click();await page.locator('.final-engine-map').waitFor();
 const finalLoop=frameSummary(await sample(page,'.final-engine-map',4200),4200,[]);
 const after=(await cdp.send('Performance.getMetrics')).metrics;
 const metrics=Object.fromEntries(after.filter(item=>['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration'].includes(item.name)).map(item=>[item.name,item.value-(before.find(old=>old.name===item.name)?.value??0)]));
 motionRuns.push({variant,repeat,order,assembly,finalLoop,metrics});await value.close();
}
function summarize(records,variants,read){return Object.fromEntries(variants.map(variant=>{const values=records.filter(run=>run.variant===variant).map(read);return [variant,{samples:values.length,median:percentile(values,.5),p75:percentile(values,.75),min:Math.min(...values),max:Math.max(...values),values}]}))}
try{
 for(let repeat=1;repeat<=5;repeat++)for(const [order,variant] of (repeat%2?['preload','blocked-preload']:['blocked-preload','preload']).entries())await loadTrial(variant,repeat,order+1);
 const variants=['control','noFilters','noBackgroundPaint'];
 for(let repeat=1;repeat<=4;repeat++)for(const [order,variant] of (repeat%2?variants:[...variants].reverse()).entries())await motionTrial(variant,repeat,order+1);
}finally{
 const analysis={
  schema_version:'are.performance-research-result/v1',status:errors.length?'INVALID':'COMPLETE',date:new Date().toISOString(),
  method:{profile,loadRepetitions:5,motionRepetitions:4,alternatingOrder:true,build:'unchanged production build',claimCeiling:'Synthetic causal diagnostic; no field, GPU, release, or product-treatment claim.',host:{cpu:os.cpus()[0]?.model,load:os.loadavg(),freeMemory:os.freemem()}},
  hypotheses:{
   preload:{readyMs:summarize(loadRuns,['preload','blocked-preload'],run=>run.readyMs),lcpMs:summarize(loadRuns,['preload','blocked-preload'],run=>run.lcpMs)},
   motion:{assemblyP95Ms:summarize(motionRuns,['control','noFilters','noBackgroundPaint'],run=>run.assembly.p95Ms),assemblyOver33:summarize(motionRuns,['control','noFilters','noBackgroundPaint'],run=>run.assembly.over33Ratio),finalP95Ms:summarize(motionRuns,['control','noFilters','noBackgroundPaint'],run=>run.finalLoop.p95Ms)}
  },loadRuns,motionRuns,errors
 };
 writeFileSync(resolve(evidence,'results.json'),JSON.stringify(analysis,null,2)+'\n');
 writeFileSync(resolve(evidence,'run.log'),`status=${analysis.status}\nloadRuns=${loadRuns.length}\nmotionRuns=${motionRuns.length}\nerrors=${errors.length}\n`);
 await browser.close();await server.close();
 console.log(JSON.stringify({status:analysis.status,loadRuns:loadRuns.length,motionRuns:motionRuns.length,summary:analysis.hypotheses,errors},null,2));
}
