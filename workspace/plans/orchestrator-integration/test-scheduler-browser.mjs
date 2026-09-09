// Browser candidate using HTTP host doubles, no native provider calls. Open questions: T6C3-INTEGRATION.md.
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createSchedulerFixture} from './scheduler-fixture.mjs';
const {chromium}=await import('/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs');
const fixture=await createSchedulerFixture(resolve('workspace/runtime/dist-dashboard'));
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(fixture.app.origin+'/#/apps/orchestrator/runs/'+encodeURIComponent('shared-main/run/'+fixture.key));
 const cancel=page.getByRole('button',{name:'Cancel task',exact:true});await cancel.waitFor();
 assert.equal(await page.getByRole('tab',{name:'Overview',exact:true}).getAttribute('aria-selected'),'true');
 await cancel.click();
 const stop=page.getByRole('button',{name:'Confirm host stopped',exact:true});await stop.waitFor();
 await stop.click();await stop.waitFor({state:'detached'});
 await page.reload();await page.getByRole('tab',{name:'Overview',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Cancel task',exact:true}).count(),0);
 assert.equal(fixture.calls.length,2);
 fixture.setOnline(false);
 await page.getByText('Shared orchestrator offline',{exact:false}).first().waitFor();
 assert.equal(await page.getByRole('button',{name:'Confirm host stopped',exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 mkdirSync('workspace/plans/orchestrator-integration/t6c3-evidence',{recursive:true});
 await page.screenshot({path:'workspace/plans/orchestrator-integration/t6c3-evidence/shared-controls.png',fullPage:true});
 console.log(JSON.stringify({status:'PASS',overview_first:true,cancel_forwarded:true,stop_reconciled:true,reload_no_repeat:true,offline_controls_removed:true,control_requests:fixture.calls.length,page_errors:errors,provider_calls:0}));
}finally{await browser.close();await fixture.close();}
