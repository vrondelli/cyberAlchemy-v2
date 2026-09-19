import {serveBuild} from './serve-build.mjs';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import os from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=Object.fromEntries(process.argv.slice(2).map(s=>{const [k,...v]=s.replace(/^--/,'').split('=');return [k,v.join('=')||true];}));
const dist=resolve(args.dist||process.env.ARE_DOCS_DIST||resolve(root,'dist')),output=resolve(root,args.output||'evidence/performance/current.json');
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright');}catch{pw=require(process.env.ARE_PLAYWRIGHT_ROOT??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');}
const preview=await serveBuild(dist);
const base=preview.url+'?benchmark=1#view=continuity';
let browser;try{browser=await pw.chromium.launch({headless:true,executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});}catch(error){await preview.close();throw error;}
const content=JSON.parse(readFileSync(resolve(root,'src/generated/documentation.json'),'utf8'));
const documents=['working-memory',...content.documents.map(d=>d.id).filter(id=>id!=='working-memory')].slice(0,args['legacy-five']?5:undefined);
const results=[];const errors=[];const repeats=Number(args.repeats||3);
const scenarios=[{name:'desktop-1',count:1,width:1440,height:1000},{name:'desktop-3',count:3,width:1440,height:1000},{name:'desktop-5',count:5,width:1440,height:1000},{name:'mobile-5',count:5,width:390,height:844}];
if(documents.length>5)scenarios.push({name:'desktop-all',count:documents.length,width:1440,height:1000},{name:'mobile-all',count:documents.length,width:390,height:844});
try{
 for(const scenario of scenarios)for(let repeat=0;repeat<repeats;repeat++){
  const page=await browser.newPage({viewport:{width:scenario.width,height:scenario.height},reducedMotion:args.motion==='normal'?'no-preference':'reduce'});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({count,documents,version})=>{
   const key='are.documentation.workspace.v1';sessionStorage.setItem(key,JSON.stringify({schema:1,version,lens:'continuity',selected:null,active:'doc-working-memory',viewport:{x:0,y:0,zoom:.85},cards:documents.slice(0,count).map((document,i)=>({id:`doc-${document}`,document,position:{x:30+i*430,y:50},expanded:true,scroll:0,sources:[i===0?'state':'objective']}))}));
   const original=Storage.prototype.setItem;window.__storageWrites=0;Storage.prototype.setItem=function(k,v){if(k===key)window.__storageWrites++;return original.call(this,k,v);};
  },{count:scenario.count,documents,version:content.version});
  await page.goto(base,{waitUntil:'networkidle'});await page.locator('[data-document="working-memory"] .document-body h2').first().waitFor();await page.waitForTimeout(400);
  const prepared=await page.evaluate(()=>{
   if(!(window.__ARE_PERF__?.['app.render']>0))throw Error('Benchmark instrumentation is unavailable');
   window.__ARE_PERF__={};window.__storageWrites=0;window.__frames=[];window.__longTasks=[];window.__scrollEvents=0;window.__nodeRemovals=0;
   const body=document.querySelector('[data-document="working-memory"] .document-body');window.__originalBody=body;body.addEventListener('scroll',()=>window.__scrollEvents++);
   let last=performance.now();const tick=t=>{window.__frames.push(t-last);last=t;window.__raf=requestAnimationFrame(tick);};window.__raf=requestAnimationFrame(tick);
   if(PerformanceObserver.supportedEntryTypes.includes('longtask')){window.__observer=new PerformanceObserver(l=>window.__longTasks.push(...l.getEntries().map(e=>e.duration)));window.__observer.observe({entryTypes:['longtask']});}
   window.__mutation=new MutationObserver(records=>{for(const r of records)for(const n of r.removedNodes)if(n.nodeType===1&&(n.matches?.('.react-flow__node')||n.querySelector?.('.react-flow__node')))window.__nodeRemovals++;});window.__mutation.observe(document.querySelector('.react-flow'),{childList:true,subtree:true});
   return {viewport:document.querySelector('.react-flow__viewport').getAttribute('style'),nodes:document.querySelectorAll('.react-flow__node-documentation').length};
  });
  const start=performance.now();await page.locator('[data-document="working-memory"] .document-body').hover();
  for(let i=0;i<32;i++){await page.mouse.wheel(0,Math.floor(i/4)%2===0?65:-45);await page.waitForTimeout(16);}
  // Include coalesced persistence after the interaction; no navigation in the measured span.
  await page.waitForTimeout(400);
  const sample=await page.evaluate(()=>{cancelAnimationFrame(window.__raf);window.__observer?.disconnect();window.__mutation.disconnect();const body=document.querySelector('[data-document="working-memory"] .document-body');const frames=window.__frames.sort((a,b)=>a-b);return {counters:window.__ARE_PERF__,storageWrites:window.__storageWrites,scrollEvents:window.__scrollEvents,scrollTop:body.scrollTop,bodyRetained:body===window.__originalBody,nodeRemovals:window.__nodeRemovals,viewport:document.querySelector('.react-flow__viewport').getAttribute('style'),frameP95Ms:frames[Math.floor(frames.length*.95)]??null,frameMaxMs:frames.at(-1)??null,frames:frames.length,longTaskCount:window.__longTasks.length,longTaskTotalMs:window.__longTasks.reduce((a,b)=>a+b,0)};});
  let interactions=null;
  if(!args['scroll-only']){
  const routeStart=performance.now();await page.locator('[data-document="working-memory"] .read-document').click();await page.locator('.manual-page h1').waitFor();const fullPageMs=performance.now()-routeStart;
  const returnStart=performance.now();await page.getByRole('button',{name:'Return to canvas',exact:true}).first().click();await page.locator('[data-document="working-memory"] .document-body').waitFor();const returnMs=performance.now()-returnStart;await page.waitForTimeout(400);
  const returnedScroll=await page.locator('[data-document="working-memory"] .document-body').evaluate(e=>e.scrollTop);
  await page.evaluate(()=>{window.__ARE_PERF__={};});const dragHeader=page.locator('[data-document="working-memory"] header'),box=await dragHeader.boundingBox();
  await page.mouse.move(box.x+50,box.y+18);await page.mouse.down();await page.mouse.move(box.x+110,box.y+50,{steps:20});await page.mouse.up();await page.waitForTimeout(350);
  const drag=await page.evaluate(()=>({counters:window.__ARE_PERF__,x:JSON.parse(sessionStorage.getItem('are.documentation.workspace.v1')).cards[0].position.x}));
  interactions={fullPageMs,returnMs,readingOffsetRestored:Math.abs(returnedScroll-sample.scrollTop)<1,drag};
  }
  const failures=[];if(interactions&&!interactions.readingOffsetRestored)failures.push('reading offset lost on full-page return');if(interactions&&interactions.drag.x<=40)failures.push('drag did not execute');if(interactions&&interactions.drag.counters['markdown.parse'])failures.push('drag reparses Markdown');if(interactions&&Object.entries(interactions.drag.counters).some(([k,v])=>k.startsWith('card.render.')&&k!=='card.render.working-memory'&&v>0))failures.push('drag rerenders peer cards');if(prepared.nodes!==scenario.count)failures.push('fixture node count');if(sample.scrollEvents<8||sample.scrollTop<=0)failures.push('scroll did not execute');if((sample.counters['app.render']??0)!==0)failures.push('scroll rerenders App');if((sample.counters['card.render']??0)!==0)failures.push('scroll rerenders cards');if((sample.counters['markdown.parse']??0)!==0)failures.push('scroll reparses Markdown');if(sample.storageWrites>3)failures.push('excessive synchronous storage');if(!sample.bodyRetained||sample.nodeRemovals||sample.counters['canvas.mount']||sample.counters['canvas.unmount'])failures.push('canvas remount');if(sample.viewport!==prepared.viewport)failures.push('scroll moved viewport');
  results.push({...scenario,repeat:repeat+1,durationMs:performance.now()-start,...sample,interactions,failures});console.log(`${scenario.name} #${repeat+1}: App=${sample.counters['app.render']??0}, cards=${sample.counters['card.render']??0}, parse=${sample.counters['markdown.parse']??0}, writes=${sample.storageWrites}, p95=${sample.frameP95Ms?.toFixed(1)}ms`);await page.close();
 }
 const assets=readdirSync(resolve(dist,'assets')).filter(f=>f.endsWith('.js')).map(f=>({file:f,bytes:readFileSync(resolve(dist,'assets',f)).length,sha256:createHash('sha256').update(readFileSync(resolve(dist,'assets',f))).digest('hex')}));
 const result={schema:'are.canvas-performance/v1',date:new Date().toISOString(),status:results.every(r=>!r.failures.length)&&!errors.length?'PASS':'FAIL',environment:{browser:browser.version(),node:process.version,platform:os.platform(),arch:os.arch(),cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,load:os.loadavg(),headless:true,cpuThrottle:1,reducedMotion:args.motion!=='normal'},method:{repeats,fullPageAndDrag:!args['scroll-only'],wheelEvents:32,intervalMs:16,persistenceWaitMs:400,productionBuild:true,timingGate:'informational; shared host and headless scheduling are uncontrolled',structuralGate:'zero App/card/Markdown work, <=3 storage writes, no node replacement or viewport change'},assets,results,errors};mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(`${result.status}: ${output}`);if(args.check&&result.status!=='PASS')process.exitCode=1;
}catch(error){mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify({schema:'are.canvas-performance/v1',status:'ERROR',results,errors:[...errors,String(error)]},null,2)+'\n');process.exitCode=1;console.error(error); }finally{await browser.close();await preview.close();}
