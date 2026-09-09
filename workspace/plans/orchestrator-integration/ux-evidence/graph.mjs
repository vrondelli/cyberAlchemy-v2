// Local audit harness; Playwright and axe paths require the documented local setup.
// Open questions: ../UX-AUDIT.md#open-questions.
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const projection=JSON.parse(readFileSync('/home/vrondelli/projects/cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/operator-state.json'));
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://127.0.0.1:4191/runs/'+encodeURIComponent(projection.runs[0].run_key)+'?fixture=strategy');
 await page.getByRole('tab',{name:'Overview',exact:true}).waitFor();
 await page.getByLabel('Accepted run strategy graph',{exact:true}).waitFor();
 assert.equal(await page.locator('.run-node-trigger').count(),6);
 const node=page.locator('.run-node-trigger').nth(2);await node.focus();await node.press('Enter');assert.equal(await node.getAttribute('aria-pressed'),'true');
 await page.getByText('List view and dependencies',{exact:true}).click();
 assert.equal(await page.locator('.strategy-list > div').count(),6);
 await page.screenshot({path:'/tmp/orchestrator-ux/multi-graph.png',fullPage:true});
 await page.setViewportSize({width:320,height:800});
 assert.equal(await page.getByRole('list',{name:'Accepted run strategy dependencies',exact:true}).getByRole('listitem').count(),6);
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.ok(await page.locator('.run-node-trigger').first().evaluate(e=>parseFloat(getComputedStyle(e).transitionDuration)<=0.001));
 writeFileSync('/tmp/orchestrator-ux/graph-test.json',JSON.stringify({status:'PASS',fixture:'explicit standalone six-node branching strategy',checks:['graph retained','keyboard node selection','six dependency list entries','mobile six-node list','reduced motion transition disabled'],dispatches:0},null,2));
 console.log('PASS multi-node graph, keyboard, list, reduced motion');
}finally{await browser.close();}
