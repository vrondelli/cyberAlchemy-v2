import {createServer} from 'node:http';
import {readFileSync,readdirSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname,sep,relative} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import os from 'node:os';
import {percentile,clsScore,frameSummary,failuresFor} from './page-performance-metrics.mjs';

const root=resolve(import.meta.dirname,'..'),dist=resolve(root,'dist');
const args=Object.fromEntries(process.argv.slice(2).map(v=>{const [k,...rest]=v.replace(/^--/,'').split('=');return [k,rest.length?rest.join('='):true]}));
const budget=JSON.parse(readFileSync(resolve(root,'page-performance-budget.json'),'utf8'));
const repeats=Number(args.repeats??budget.repeats);
if(!Number.isInteger(repeats)||repeats<1||repeats>10)throw Error('repeats must be 1–10');
const profiles=budget.profiles.filter(p=>!args.profile||p.name===args.profile);
if(!profiles.length)throw Error('Unknown profile');
const require=createRequire(resolve(root,'../video/package.json'));
const {chromium}=require('playwright-core');
const inventory=[];
function scan(dir){for(const name of readdirSync(dir)){const file=resolve(dir,name);if(statSync(file).isDirectory())scan(file);else{const bytes=readFileSync(file);inventory.push({file:relative(dist,file),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})}}}scan(dist);
// Isolated static fixture: actual gzip transfer, persistent browser caching, no backend API.
const cache=new Map(),mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server=createServer((req,res)=>{try{
 if(req.url==='/api/are/status'){res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({configured:false,mode:'benchmark-fixture',scope:'conversation-only'}));return;}
 const pathname=new URL(req.url,'http://local').pathname,file=resolve(dist,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(dist+sep))throw Error('Outside build');
 const compressed=/\.(html|js|css|svg|json)$/.test(file)&&/gzip/.test(req.headers['accept-encoding']??'');
 const key=file+compressed;if(!cache.has(key)){const bytes=readFileSync(file);cache.set(key,compressed?gzipSync(bytes):bytes)}
 const body=cache.get(key);res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');
 res.setHeader('Cache-Control',extname(file)==='.html'?'no-cache':'public, max-age=3600');res.setHeader('Vary','Accept-Encoding');
 if(compressed)res.setHeader('Content-Encoding','gzip');res.setHeader('Content-Length',body.length);res.end(body);
 }catch{res.statusCode=404;res.end('Not found')}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
const runs=[],errors=[];
const output=resolve(root,args.output||'evidence/performance/page-current.json');
async function frameSample(page,selector,durationMs=2200){
 console.log(`  sample ${selector} ${durationMs}ms`);
 const raw=await page.evaluate(async({selector,durationMs})=>{
  const start=performance.now(),frames=[],phases=[];let previous=start,lastPhase=null;
  await new Promise(done=>{function tick(now){frames.push(now-previous);previous=now;const el=document.querySelector(selector);const phase=el?.dataset.phase??el?.dataset.stage;
   if(phase!==lastPhase){phases.push({phase,at:now});lastPhase=phase;}
   if(now-start>=durationMs)done();else requestAnimationFrame(tick)}requestAnimationFrame(tick)});
  return {durationMs:performance.now()-start,frames,phases,tasks:window.__pagePerf.tasks.filter(t=>t.startTime>=start)};
 },{selector,durationMs});
 const summary=frameSummary(raw.frames,raw.durationMs,raw.tasks);
 return {...summary,durationMs:raw.durationMs,phases:raw.phases,failures:failuresFor({frameP95Ms:summary.p95Ms,framesOver33Ratio:summary.over33Ratio,longTaskBlockingMsPerSecond:summary.blockingMsPerSecond},budget.limits)};
}
try{
 for(const profile of profiles)for(let repeat=1;repeat<=repeats;repeat++){
  const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},reducedMotion:'no-preference',serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(90000);
  page.on('pageerror',e=>errors.push(`${profile.name}: ${e.message}`));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.addInitScript(()=>{
   window.__pagePerf={lcp:null,shifts:[],tasks:[],events:[],supported:PerformanceObserver.supportedEntryTypes};
   for(const [type,key] of [['largest-contentful-paint','lcp'],['layout-shift','shifts'],['longtask','tasks'],['event','events']]){
    if(!PerformanceObserver.supportedEntryTypes.includes(type))continue;
    new PerformanceObserver(list=>{for(const e of list.getEntries()){
     if(key==='lcp')window.__pagePerf.lcp=e.startTime;
     else window.__pagePerf[key].push({startTime:e.startTime,duration:e.duration,value:e.value,hadRecentInput:e.hadRecentInput,interactionId:e.interactionId});
    }}).observe({type,buffered:true,...(type==='event'?{durationThreshold:16}:{})});
   }
  });
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latencyMs,downloadThroughput:profile.downloadMbps*1000000/8,uploadThroughput:1000000/8});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpuRate});
  for(const state of ['cold','warm']){
   await page.goto(url,{waitUntil:'load',timeout:90000});
   await page.getByRole('button',{name:'Chapter 1:'}).waitFor();
   await page.locator('.projected-engine img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()))});
   const readyMs=await page.evaluate(()=>performance.now());
   await page.waitForTimeout(500);
   const load=await page.evaluate(()=>({perf:window.__pagePerf,nav:performance.getEntriesByType('navigation')[0].toJSON(),resources:performance.getEntriesByType('resource').map(e=>e.toJSON()),images:[...document.images].filter(i=>i.complete&&i.naturalWidth).map(i=>({url:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight}))}));
   const resources=[load.nav,...load.resources];const transferredBytes=resources.reduce((s,r)=>s+r.transferSize,0);
   const imageBytes=load.resources.filter(r=>/\.(png|webp|svg|avif)(\?|$)/.test(r.name)).reduce((s,r)=>s+r.encodedBodySize,0);
   const metrics={readyMs,lcpMs:load.perf.lcp,cls:clsScore(load.perf.shifts),[state==='cold'?'coldTransferredBytes':'warmTransferredBytes']:transferredBytes,...(state==='cold'?{coldImageBytes:imageBytes}:{})};
   const result={profile:profile.name,repeat,cache:state,metrics,ttfbMs:load.nav.responseStart-load.nav.requestStart,loadEventMs:load.nav.loadEventEnd,resources:resources.map(r=>({url:r.name.replace(url,''),transferBytes:r.transferSize,encodedBytes:r.encodedBodySize,decodedBytes:r.decodedBodySize,durationMs:r.duration})),estimatedImageRgbaBytes:[...new Map(load.images.map(i=>[i.url,i])).values()].reduce((s,i)=>s+i.width*i.height*4,0),failures:failuresFor(metrics,budget.limits),scenes:[]};
   console.log(`${profile.name} ${repeat} ${state}: ${(transferredBytes/1048576).toFixed(2)} MiB, ready ${readyMs.toFixed(0)}ms, LCP ${load.perf.lcp?.toFixed(0)}ms`);
   if(state==='warm'){
    await page.getByRole('button',{name:'Chapter 4:'}).click();
    await page.getByRole('button',{name:'Replay ↺',exact:true}).click();
    result.scenes.push({name:'engine-assembly',...await frameSample(page,'.scroll-hero',3000)});
    // Sample real timeline playback, not only held chapter checkpoints.
    for(let i=0;i<3;i++){
     await page.getByRole('button',{name:`Chapter ${i+1}:`}).click();
     const checkpoint=await page.locator('.scroll-hero').evaluate(el=>({progress:Number(el.dataset.progress),at:performance.now()}));
     await page.waitForFunction(progress=>Number(document.querySelector('.scroll-hero').dataset.progress)>progress+.002,checkpoint.progress);
     const dwellMs=await page.evaluate(start=>performance.now()-start,checkpoint.at);
     result.scenes.push({name:`transition-after-chapter-${i+1}`,checkpointDwellMs:dwellMs,...await frameSample(page,'.scroll-hero')});
    }
    await page.evaluate(()=>{window.__inputPaint=null;document.addEventListener('pointerdown',event=>{
     const start=event.timeStamp;requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__inputPaint=performance.now()-start}));
    },{once:true,capture:true})});
    await page.getByRole('button',{name:'Chapter 4:'}).click();
    await page.locator('.final-engine-map').waitFor();
    await page.waitForFunction(()=>window.__inputPaint!==null);
    const inputPaintProxyMs=await page.evaluate(()=>window.__inputPaint);
    result.interaction={inputPaintProxyMs,note:'Pointerdown timestamp to two rAF callbacks; not INP or proof of compositor presentation',failures:failuresFor({inputPaintProxyMs},budget.limits)};
    await page.locator('.final-map-link img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()))});
    const final=await frameSample(page,'.final-engine-map',4200);result.scenes.push({name:'final-loop',...final});
    const intervals=final.phases.slice(2).map((p,i)=>p.at-final.phases[i+1].at);
    result.phaseTiming={expectedMs:1800,intervalsMs:intervals,failures:failuresFor({phaseIntervalErrorMs:intervals.length?Math.max(...intervals.map(v=>Math.abs(v-1800))):null},budget.limits)};
    await page.getByRole('button',{name:'Pause animation',exact:true}).click();
    const held=Number(await page.locator('.final-engine-map').getAttribute('data-time'));await page.waitForTimeout(500);
    const pauseAdvanceMs=Number(await page.locator('.final-engine-map').getAttribute('data-time'))-held;
    result.pause={pauseAdvanceMs,failures:failuresFor({pauseAdvanceMs},budget.limits)};
    await page.getByRole('button',{name:'Resume animation',exact:true}).click();
    await page.locator('.sculpture-cycles').scrollIntoViewIfNeeded();await page.waitForTimeout(300);
    result.scenes.push({name:'explanation-cycles',...await frameSample(page,'.sculpture-cycles')});
    result.eventDurationsMs=await page.evaluate(()=>window.__pagePerf.events.filter(e=>e.interactionId).map(e=>e.duration));
   }
   runs.push(result);
  }
  await context.close();
 }
}catch(error){errors.push(String(error));console.error(error)}finally{
 const summaries=profiles.flatMap(p=>['cold','warm'].map(cacheState=>{
  const selected=runs.filter(r=>r.profile===p.name&&r.cache===cacheState),keys=Object.keys(selected[0]?.metrics??{});
  const p75=Object.fromEntries(keys.map(k=>[k,percentile(selected.map(r=>r.metrics[k]).filter(Number.isFinite),.75)]));
  return {profile:p.name,cache:cacheState,samples:selected.length,p75,failures:[...(selected.length!==repeats?['incomplete repetitions']:[]),...(selected.some(r=>Object.values(r.metrics).some(v=>v===null||!Number.isFinite(v)))?['missing observation in a repetition']:[]),...failuresFor(p75,budget.limits)]};
 }));
 const motionFailures=runs.flatMap(r=>[...r.scenes,...[r.interaction,r.phaseTiming,r.pause].filter(Boolean)].flatMap(s=>s.failures.map(f=>`${r.profile}/${r.repeat}/${s.name??'interaction-timing'}: ${f}`)));
 const status=errors.length||summaries.some(s=>s.failures.length)||motionFailures.length?'FAIL':'PASS';
 mkdirSync(resolve(root,'evidence/performance'),{recursive:true});
 const result={schema:'are.page-performance/v1',date:new Date().toISOString(),status,method:{urlKind:'isolated production static fixture, gzip, one-hour asset cache',repeats,profiles,frameScope:'rAF scheduling proxy; no GPU raster/compositor guarantee',loadScope:'initial hero and requested resources; inventory is not transfer weight',vitalsScope:'synthetic LCP/CLS snapshots and interaction proxy, not field CWV',runtime:process.version,browser:browser.version(),cpu:os.cpus()[0]?.model,load:os.loadavg()},budget,summaries,motionFailures,errors,inventory:inventory.sort((a,b)=>b.bytes-a.bytes),runs};
 writeFileSync(output,JSON.stringify(result,null,2)+'\n');
 console.log(`${status}: ${output}`);for(const s of summaries)for(const f of s.failures)console.log(`${s.profile}/${s.cache}: ${f}`);motionFailures.forEach(f=>console.log(f));
 await browser.close();await new Promise(done=>server.close(done));if(args.check&&status!=='PASS')process.exitCode=1;
}
