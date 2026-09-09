// Actual Chrome tab zoom, not pinch zoom or CSS transforms. No task submission.
// Open questions: UX5-REFLOW.md#open-questions.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {startDashboard} from './dashboard-server.mjs';
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
const config=JSON.parse(readFileSync(process.argv[2])),out=resolve(process.argv[4]);
mkdirSync(out,{recursive:true});
const temp=mkdtempSync(resolve(tmpdir(),'ux5-zoom-')),ext=resolve(temp,'extension');
mkdirSync(ext);
writeFileSync(resolve(ext,'manifest.json'),JSON.stringify({manifest_version:3,name:'Local reflow verification',version:'1.0',permissions:['tabs'],background:{service_worker:'worker.js'}}));
writeFileSync(resolve(ext,'worker.js'),'chrome.runtime.onInstalled.addListener(() => {});');
const native=JSON.parse(readFileSync(config.console_config)),journal=resolve(native.state,'tasks.json'),before=readFileSync(journal);
let app,context;
const checks=[],posts=[],errors=[];
try {
 app=await startDashboard({...config,port:0,static_root:resolve(process.argv[3])});
 const body=await (await fetch(app.origin+'/api/v1/workspace/runs')).json();
 const run=body.projection.runs.find(r=>r.execution==='succeeded');assert.ok(run);
 context=await chromium.launchPersistentContext(resolve(temp,'profile'),{executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true,viewport:null,args:['--window-size=1280,1000',`--disable-extensions-except=${ext}`,`--load-extension=${ext}`]});
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{if(!['GET','HEAD'].includes(route.request().method())){posts.push(route.request().url());return route.abort();}return route.continue();});
 const nav=path=>page.goto(app.origin+'/#/apps/orchestrator'+path);
 const layout=async name=>{
  await page.waitForTimeout(350);
  const metrics=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,scale:visualViewport.scale,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert.equal(metrics.overflow,false,name+' document overflow');
  checks.push({name,...metrics});
 };
 const focusVisible=async locator=>{
  await locator.focus();
  const rect=await locator.boundingBox(),rail=await page.locator('.app-rail').boundingBox();
  const width=await page.evaluate(()=>innerWidth);
  assert.ok(rect.x>=0&&rect.x+rect.width<=width+1,'focused control clipped horizontally');
  if(width<=720)assert.ok(rect.y+rect.height<=rail.y+1,'focused control obscured by navigation');
 };
 await nav('/runs');
 for(const factor of [1,2,4]){
  const zoom=await worker.evaluate(async({origin,factor})=>{const tab=(await chrome.tabs.query({})).find(t=>t.url.startsWith(origin));await chrome.tabs.setZoom(tab.id,factor);return chrome.tabs.getZoom(tab.id);},{origin:app.origin,factor});
  assert.ok(Math.abs(zoom-factor)<.01);
  await nav('/runs/'+encodeURIComponent(run.viewId));
  await page.getByRole('tab',{name:'Overview',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>innerWidth),1280/factor);
  for(const tab of ['Overview','Result','Strategy','Trace','Workers','Evidence','Lifecycle']){
   const control=page.getByRole('tab',{name:tab,exact:true});await control.click();await focusVisible(control);await layout(`${factor*100}% ${tab}`);
  }
  await page.getByRole('tab',{name:'Overview',exact:true}).click();
  await focusVisible(page.getByRole('button',{name:'View result →',exact:true}));
  await page.getByText('Technical details',{exact:true}).click();
  await layout(`${factor*100}% expanded technical details`);
  const capture = await (await context.newCDPSession(page)).send("Page.captureScreenshot", {format:"png", captureBeyondViewport:false});
  writeFileSync(resolve(out,`overview-${factor*100}.png`), Buffer.from(capture.data,"base64"));
  for(const path of ['/runs','/runs/new','/operations','/lab','/ontologies']){
   await nav(path);await page.locator('.embedded-console h1').waitFor();await layout(`${factor*100}% ${path}`);
   if(path==='/runs/new')await focusVisible(page.getByRole('button',{name:'Review task',exact:true}));
   if(path==='/ontologies'){
    await page.getByText('Browse records and relationships without the canvas',{exact:true}).click();
    const records=page.getByRole('list',{name:'Ontology records'});assert.ok(await records.getByRole('listitem').count()>0);
    await records.getByRole('button').first().click();
    assert.equal(await records.getByRole('button').first().getAttribute('aria-pressed'),'true');
    await layout(`${factor*100}% ontology list`);
   }
  }
 }
 assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);assert.deepEqual(readFileSync(journal),before);
 writeFileSync(resolve(out,'reflow.json'),JSON.stringify({status:'PASS',method:'Chrome extension chrome.tabs.setZoom; 1280 device-pixel window, 100/200/400% produces 1280/640/320 CSS px; visualViewport.scale stays 1',checks,posts,errors,installed_history_unchanged:true,open_questions_ref:'UX5-REFLOW.md#open-questions'},null,2));
 console.log('PASS actual zoom, reflow, focus obstruction and ontology list');
}finally{await context?.close();await app?.close();rmSync(temp,{recursive:true,force:true});}
