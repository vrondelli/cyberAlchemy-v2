// Open questions and scope: T7-ACCEPTANCE.md. Real browser input, no injected timing samples.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSchedulerFixture} from './scheduler-fixture.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.WORKSPACE_PLAYWRIGHT_ROOT??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const fixture=await createSchedulerFixture(resolve(here,'../../runtime/dist-dashboard'));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.WORKSPACE_CHROMIUM_EXECUTABLE??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
 const page=await browser.newPage();page.setDefaultTimeout(10000);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(fixture.app.origin);
 for(const name of ['Open Essays','Create local studio','Accept intent','Generate & accept local plan'])await page.getByRole('button',{name,exact:true}).click();
 const editor=page.locator('[data-testid="milkdown-editor"] [contenteditable="true"]');await editor.click();
 const samples=()=>page.evaluate(()=>(window.__CA2_PERFORMANCE_SAMPLES__??[]).filter(s=>s.name==='essays.editor-input-to-projection'));
 const before=await samples();assert.equal(before.length,0);
 // The first isolated input must publish a sample without needing another key.
 await page.keyboard.insertText('a');
 await page.waitForFunction(()=>(window.__CA2_PERFORMANCE_SAMPLES__??[]).some(s=>s.name==='essays.editor-input-to-projection'));
 assert.equal((await samples()).length,1);
 for(const [index,key] of ['b','c'].entries()){
  await page.waitForTimeout(300);
  assert.equal((await samples()).length,index+1,'idle time created a sample');
  await editor.press(key);
  await page.waitForFunction(count=>(window.__CA2_PERFORMANCE_SAMPLES__??[]).filter(s=>s.name==='essays.editor-input-to-projection').length===count,index+2);
 }
 const result=await samples();
 assert.equal(result.length,3);
 assert(result.every(s=>s.detail.inputToUpdateMs!==null),'timing began after update');
 assert.match(await editor.textContent(),/abc/);
 assert.deepEqual(errors,[]);assert.equal(fixture.calls.length,0);
 const output=resolve(here,'t7b-fix-evidence');mkdirSync(output,{recursive:true});
 writeFileSync(resolve(output,'editor-regression.json'),JSON.stringify({status:'PASS',checks:['first isolated insert emits its own sample','one sample for each spaced key','no samples while idle','editor retains all input'],samples:result,open_questions_ref:'../T7-ACCEPTANCE.md#open-questions'},null,2)+'\n');
 console.log('PASS: isolated insertion and spaced keys each publish their own timing sample');
}finally{await browser?.close();await fixture.close();}
