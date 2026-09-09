// Explicit six-node fixture, never a native launch.
// Open questions: UX5-REFLOW.md#open-questions.
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://127.0.0.1:4191',out=resolve(process.argv[3]||'/tmp/ux5-graph');mkdirSync(out,{recursive:true});
const projection=JSON.parse(readFileSync(resolve('../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/operator-state.json')));
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true});
 const page=await context.newPage();
 await page.goto(origin+'/runs/'+encodeURIComponent(projection.runs[0].run_key)+'?fixture=strategy');
 const graph=page.getByLabel('Accepted run strategy graph',{exact:true});await graph.waitFor();
 const inspector=page.getByRole('region',{name:'Selected strategy node',exact:true});
 const buttons=page.locator('.run-node-trigger');assert.equal(await buttons.count(),6);
 for(let i=0;i<6;i++){
  const node=buttons.nth(i);await node.focus();await node.press(i%2?'Space':'Enter');
  assert.equal(await node.getAttribute('aria-pressed'),'true');
  assert.equal(await node.getAttribute('aria-controls'),await inspector.getAttribute('id'));
 }
 assert.equal(await graph.getByRole('tooltip').count(),0);
 await page.getByText('List view and dependencies',{exact:true}).click();
 assert.equal(await page.locator('.strategy-list > div').count(),6);
 await page.setViewportSize({width:320,height:800});
 const list=page.getByRole('list',{name:'Accepted run strategy dependencies',exact:true});
 assert.equal(await list.getByRole('listitem').count(),6);
 for(const row of await list.getByRole('listitem').all()){
  const button=row.getByRole('button');await button.tap();assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.ok((await inspector.innerText()).includes(await button.innerText()));
  const text=await row.locator('small').evaluate(e=>({nowrap:getComputedStyle(e).whiteSpace,clipped:e.scrollWidth>e.clientWidth}));
  assert.notEqual(text.nowrap,'nowrap');assert.equal(text.clipped,false);
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.ok(await buttons.first().evaluate(e=>parseFloat(getComputedStyle(e).transitionDuration)<=.001));
 await page.screenshot({path:resolve(out,'graph-mobile.png'),fullPage:true});
 writeFileSync(resolve(out,'graph.json'),JSON.stringify({status:'PASS',fixture:'six-node branching strategy',keyboard_nodes:6,touch_list_selections:6,dependency_text_unclipped:true,hover_only_details:false,reduced_motion:true,dispatches:0,open_questions_ref:'UX5-REFLOW.md#open-questions'},null,2));
 console.log('PASS graph keyboard, touch, full dependency text and reduced motion');
}finally{await browser.close();}
