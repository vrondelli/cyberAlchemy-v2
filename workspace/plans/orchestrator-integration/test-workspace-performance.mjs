// Open questions and measurement limits: T7-ACCEPTANCE.md.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {evaluatePerformanceBudgets} from '../../runtime/src/performance-budget.ts';
import {createSchedulerFixture} from './scheduler-fixture.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.WORKSPACE_PLAYWRIGHT_ROOT ?? '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const output=resolve(process.argv[2] ?? resolve(here,'t7b-evidence'));
mkdirSync(output,{recursive:true});
const budgetPath=resolve(here,'../../runtime/performance-budgets.candidate.json');
const budgetBytes=readFileSync(budgetPath);
const budgets=JSON.parse(budgetBytes).budgets;
const names=['workspace.navigation-to-paint','workspace.cold-navigation-to-paint','essays.editor-input-to-projection'];
const fixture=await createSchedulerFixture(resolve(here,'../../runtime/dist-dashboard'));
let browser;
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.WORKSPACE_CHROMIUM_EXECUTABLE ?? '/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 context.setDefaultTimeout(15000);
 const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
 page.on('request',request=>requests.push(request.url()));
 await page.goto(fixture.app.origin,{waitUntil:'networkidle'});
 const count=name=>page.evaluate(name=>(window.__CA2_PERFORMANCE_SAMPLES__??[]).filter(s=>s.name===name).length,name);
 async function navigate(label,name){
  const before=await count(name);
  await page.getByRole('button',{name:label,exact:true}).click();
  await page.waitForFunction(({name,before})=>(window.__CA2_PERFORMANCE_SAMPLES__??[]).filter(s=>s.name===name).length>before,{name,before});
 }
 for(const label of ['Explore workspace','Open Essays','Open governed chat'])await navigate(label,names[1]);
 // First-mount is the existing budget's meaning of cold; no cache clearing or metric injection.
 for(let round=0;round<6;round++)for(const label of ['Open Dashboard','Explore workspace','Open Essays','Open governed chat'])await navigate(label,names[0]);
 await navigate('Open Essays',names[0]);
 await page.getByRole('button',{name:'Create local studio',exact:true}).click();
 await page.getByRole('button',{name:'Accept intent',exact:true}).click();
 await page.getByRole('button',{name:'Generate & accept local plan',exact:true}).click();
 const editor=page.locator('[data-testid="milkdown-editor"] [contenteditable="true"]');
 await editor.waitFor();
 await editor.click();
 await page.keyboard.press('Control+End');
 for(let i=0;i<5;i++){
  const before=await count(names[2]);
  await editor.pressSequentially(` Measured browser edit ${i}.`);
  await page.waitForFunction(({name,before})=>(window.__CA2_PERFORMANCE_SAMPLES__??[]).filter(s=>s.name===name).length>before,{name:names[2],before});
 }
 assert.match(await editor.textContent(),/Measured browser edit 4\./);
 const samples=await page.evaluate(()=>window.__CA2_PERFORMANCE_SAMPLES__??[]);
 const results=evaluatePerformanceBudgets(samples,Object.fromEntries(names.map(name=>[name,budgets[name]])));
 assert.deepEqual(errors,[]);
 assert.deepEqual(requests.filter(url=>!url.startsWith(fixture.app.origin)),[]);
 assert.equal(fixture.calls.length,0);
 assert.deepEqual(readFileSync(budgetPath),budgetBytes);
 const report={schema_version:'workspace-t7b-performance/v1-candidate',authority_effect:'none',status:results.every(r=>r.status==='PASS')?'PASS':'FAIL',browser:browser.version(),viewport:{width:1440,height:1000},results,unmeasured:Object.keys(budgets).filter(name=>!names.includes(name)).map(name=>({name,status:'NOT_MEASURED',reason:'Requires native Tauri/Chat fixture; T7C'})),budget_sha256:createHash('sha256').update(budgetBytes).digest('hex'),samples,external_model_calls:0,scheduler_mutations:0,errors,measurement_limits:['Navigation measures the existing next-animation-frame boundary, not feature-ready or presentation completion.','Cold means first surface mount within this browser context, not cold process startup.','Registered orchestrator routes emit a separate unbudgeted hash-navigation metric and are not covered by these navigation budgets.'],open_questions_ref:'../T7-ACCEPTANCE.md#open-questions'};
 writeFileSync(resolve(output,'performance.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,results,unmeasured:report.unmeasured.length},null,2));
 if(report.status!=='PASS')process.exitCode=1;
} catch(error) {
 writeFileSync(resolve(output,'runner-error.json'),JSON.stringify({status:'ERROR',error:String(error),open_questions_ref:'../T7-ACCEPTANCE.md#open-questions'},null,2)+'\n');
 throw error;
} finally {
 await browser?.close();
 await fixture.close();
}
