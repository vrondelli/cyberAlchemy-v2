import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const fixture=JSON.parse(readFileSync('../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/operator-state.json'));
const context=await chromium.launchPersistentContext('/tmp/ux5-graph-zoom-profile',{executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true,viewport:null,args:['--window-size=1280,1000','--disable-extensions-except=/tmp/ux5-zoom-extension','--load-extension=/tmp/ux5-zoom-extension']});
const checks=[];
try {
 const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4191/runs/'+encodeURIComponent(fixture.runs[0].run_key)+'?fixture=strategy');
 for(const factor of [2,4]){
  const zoom=await worker.evaluate(async factor=>{const tab=(await chrome.tabs.query({})).find(t=>t.url.includes('4191'));await chrome.tabs.setZoom(tab.id,factor);return chrome.tabs.getZoom(tab.id);},factor);
  await page.waitForTimeout(400);
  const metrics=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert.equal(metrics.width,1280/factor);assert.equal(metrics.overflow,false);
  if(factor===4){
   const list=page.getByRole('list',{name:'Accepted run strategy dependencies',exact:true});
   assert.equal(await list.getByRole('listitem').count(),6);
   await list.getByRole('button').last().click();
   await page.getByRole('region',{name:'Selected strategy node',exact:true}).scrollIntoViewIfNeeded();
   assert.match(await page.getByRole('region',{name:'Selected strategy node',exact:true}).innerText(),/close/i);
  }else{
   await page.getByText('List view and dependencies',{exact:true}).click();assert.equal(await page.locator('.strategy-list > div').count(),6);
  }
  checks.push({zoom,...metrics});
 }
 writeFileSync('/tmp/ux5-graph/zoom.json',JSON.stringify({status:'PASS',checks,dispatches:0,open_questions_ref:'UX5-REFLOW.md#open-questions'},null,2));
}finally{await context.close();}
