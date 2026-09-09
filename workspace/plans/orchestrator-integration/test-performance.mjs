// Local cold-context measurements. No production SLO or user population claim.
// Open questions: UX6-ACCEPTANCE.md#open-questions.
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const origin=process.argv[2]||'http://127.0.0.1:4187',out=resolve(process.argv[3]||'/tmp/ux6-performance');mkdirSync(out,{recursive:true});
const data=await (await fetch(origin+'/api/v1/workspace/runs')).json();
const run=data.projection.runs.find(r=>r.execution==='succeeded');
const routes={dashboard:'#/dashboard',runs:'#/apps/orchestrator/runs',overview:'#/apps/orchestrator/runs/'+encodeURIComponent(run.viewId),lab:'#/apps/orchestrator/lab',ontology:'#/apps/orchestrator/ontologies'};
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
const samples=[];
try{
for(const [name,hash] of Object.entries(routes))for(let sample=0;sample<3;sample++){
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();
 await page.route('**/api/**',route=>['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());
 await page.addInitScript(()=>{
  window.__metrics={lcp:0,cls:0,longTasks:[]};
  for(const type of ['largest-contentful-paint','layout-shift','longtask']){
   if(!PerformanceObserver.supportedEntryTypes.includes(type))continue;
   new PerformanceObserver(list=>{for(const e of list.getEntries()){
    if(type==='largest-contentful-paint')window.__metrics.lcp=e.startTime;
    if(type==='layout-shift'&&!e.hadRecentInput)window.__metrics.cls+=e.value;
    if(type==='longtask')window.__metrics.longTasks.push(e.duration);
   }}).observe({type,buffered:true});
  }
 });
 const start=performance.now();
 await page.goto(origin+'/'+hash);
 await (name==='dashboard'?page.getByRole('heading',{name:'Dashboard',exact:true}):page.locator('.embedded-console h1')).waitFor();
 const headingReadyMs=performance.now()-start;
 await page.waitForTimeout(1000);
 const metrics=await page.evaluate(()=>({ ...window.__metrics,resources:performance.getEntriesByType('resource').map(e=>({name:new URL(e.name).pathname,initiator:e.initiatorType,transferBytes:e.transferSize,encodedBytes:e.encodedBodySize,decodedBytes:e.decodedBodySize,durationMs:e.duration})),navigation:performance.getEntriesByType('navigation').map(e=>({domContentLoadedMs:e.domContentLoadedEventEnd,loadMs:e.loadEventEnd}))}));
 samples.push({name,sample,headingReadyMs,...metrics});
 await context.close();
}
const summary=Object.fromEntries(Object.keys(routes).map(name=>{const selected=samples.filter(s=>s.name===name);const median=key=>selected.map(key).sort((a,b)=>a-b)[1];return [name,{medianHeadingReadyMs:median(s=>s.headingReadyMs),medianLcpMs:median(s=>s.lcp),medianCls:median(s=>s.cls),medianTransferredBytes:median(s=>s.resources.reduce((n,r)=>n+r.transferBytes,0)),portraitRequests:selected[0].resources.filter(r=>r.name.includes('research-agent')).map(r=>({name:r.name,transferBytes:r.transferBytes})),largestResources:[...selected[0].resources].sort((a,b)=>b.transferBytes-a.transferBytes).slice(0,5)}];}));
writeFileSync(resolve(out,'performance.json'),JSON.stringify({browser:browser.version(),conditions:'Loopback; fresh browser context per sample; no CPU/network throttling; 1440x1000; one second observation after route heading; no task POSTs; resource totals exclude main document',samples,summary,open_questions_ref:'UX6-ACCEPTANCE.md#open-questions'},null,2));
console.log(JSON.stringify(summary,null,2));
}finally{await browser.close();}
