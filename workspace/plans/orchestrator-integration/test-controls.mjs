// Actual embedded editor -> Workspace gateway -> native owner -> Rust/ARE fixture.
// Open questions: PLAN.md#open-questions.
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {startNativeConsole} from '../luna-vps/runtime/native-console-server.mjs';
import {startDashboard} from './dashboard-server.mjs';
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
const root=mkdtempSync('/tmp/wct-'),installed=JSON.parse(readFileSync(process.argv[2])),before=readFileSync(resolve(installed.state,'tasks.json'));
const config={...installed,state:resolve(root,'state'),runtime:resolve(root,'run'),port:0,max_tasks:2};
let native,app,browser;
const task=id=>({schema_version:'are-text-task/v1',task_id:id,title:'Gateway test',instruction:'Summarize the supplied status.',input:'Isolated fixture.',objective_kind:'understand'});
async function post(path,body,headers={}){
 const response=await fetch(app.origin+'/api/v1/workspace/runtimes/test-native/native-tasks'+path,{method:'POST',headers:{Origin:app.origin,'Content-Type':'application/json','X-Workspace-Intent':'native-task',...headers},body:JSON.stringify(body)});
 return {status:response.status,body:await response.json()};
}
async function until(predicate){
 const deadline=Date.now()+100000;
 while(Date.now()<deadline){if(predicate(native.snapshot()))return native.snapshot();await new Promise(ok=>setTimeout(ok,100));}
 throw Error('OWNER_TIMEOUT '+JSON.stringify(native.snapshot()));
}
try{
 native=await startNativeConsole(config);
 const consoleFile=resolve(root,'console.json');writeFileSync(consoleFile,JSON.stringify({...config,port:Number(new URL(native.origin).port)}));
 const dashboardConfig={schema_version:'workspace-dashboard-config/v1',console_config:consoleFile,driver:resolve(process.argv[3]),static_root:resolve(process.argv[4]),port:0,runtime_id:'test-native',controls_enabled:true};
 app=await startDashboard(dashboardConfig);
 assert.equal((await post('/review',{task:task('wrong-origin')},{Origin:'https://outside.example'})).status,403);
 assert.equal((await post('/review',{task:task('wrong-intent')},{'X-Workspace-Intent':''})).status,403);
 assert.equal((await post('/review',{task:{...task('live'),mode:'live'}})).status,400);
 assert.equal((await post('/pause',{})).status,404);
 const first=await post('/review',{task:task('bad-digest')});
 assert.equal((await post('/launch',{review_id:first.body.review_id,task_digest:'wrong'})).status,409);
 assert.equal(native.snapshot().jobs.length,0);
 browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(app.origin+'/#/apps/orchestrator/runs');
 await page.getByRole('link',{name:'New run',exact:true}).click();
 await page.getByRole('heading',{name:'Native tasks',exact:true}).waitFor();
 await page.getByLabel('Title',{exact:true}).fill('Workspace controls acceptance');
 await page.getByLabel('Supplied input',{exact:true}).fill('Verify the Workspace connection with isolated fixture state.');
 await page.getByRole('button',{name:'Review task',exact:true}).click();
 await page.getByRole('region',{name:'Task review'}).waitFor();
 await page.getByLabel('Instruction',{exact:true}).fill('Summarize this supplied status in plain text.');
 assert.equal(await page.getByRole('region',{name:'Task review'}).count(),0,'EDIT_DID_NOT_INVALIDATE_REVIEW');
 await page.getByRole('button',{name:'Review task',exact:true}).click();
 const launchResponse=page.waitForResponse(response=>response.url().endsWith('/native-tasks/launch')&&response.request().method()==='POST');
 await page.getByRole('button',{name:'Launch fixture task',exact:true}).click();
 const launched=await launchResponse,job=await launched.json(),retryBody=launched.request().postDataJSON();
 assert.equal(launched.status(),202);
 assert.equal((await post('/launch',retryBody)).body.id,job.id);
 await page.getByRole('heading',{name:'Workspace controls acceptance',exact:true}).first().waitFor();
 assert.equal(native.snapshot().jobs.length,1);
 await page.getByRole('button',{name:'Open Dashboard',exact:true}).click();
 const card=page.getByRole('article',{name:'Run: Workspace controls acceptance',exact:true});
 await card.waitFor();assert.equal(await card.count(),1);
 const completed=await until(state=>!state.active);assert.equal(completed.jobs[0].status,'succeeded',JSON.stringify(completed));assert.equal(completed.jobs[0].fixture_provider_calls,1);
 await card.getByRole('link').click();
 await page.getByRole('tab',{name:'Result',exact:true}).click();
 await page.getByLabel('Final run deliverable').waitFor({timeout:20000});
 assert.match(await page.getByLabel('Final run deliverable').innerText(),/Fixture response/);
 await page.reload();await page.getByRole('tab',{name:'Result',exact:true}).click();await page.getByLabel('Final run deliverable').waitFor();
 assert.equal(await page.getByRole('button',{name:'Cancel task',exact:true}).count(),0);
 // A second isolated launch exercises the existing owner's cancellation protocol.
 await page.getByRole('button',{name:'Open Runs',exact:true}).click();
 await page.getByRole('link',{name:'New run',exact:true}).click();
 await page.getByLabel('Title',{exact:true}).fill('Workspace cancellation acceptance');
 await page.getByRole('button',{name:'Review task',exact:true}).click();
 await page.getByRole('button',{name:'Launch fixture task',exact:true}).click();
 await until(state=>state.jobs[1]?.status==='running');
 await page.getByRole('button',{name:'Cancel task',exact:true}).click();
 const cancelled=await until(state=>!state.active);assert.equal(cancelled.jobs[1].status,'cancelled',JSON.stringify(cancelled));assert.equal(cancelled.jobs[1].result,null);
 assert.equal(cancelled.fixture_budget_remaining,0);
 assert.equal((await post('/review',{task:task('exhausted')})).status,409);
 assert.equal((await post('/launch',retryBody)).body.id,job.id,'EXHAUSTED_RETRY_NOT_IDEMPOTENT');
 await page.getByRole('button',{name:'Open Runs',exact:true}).click();
 await page.getByRole('link',{name:'New run',exact:true}).click();
 await page.getByRole('button',{name:'Review task',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Review task',exact:true}).isDisabled(),true);
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:resolve(process.argv[5],'composer-mobile.png'),fullPage:true,animations:'disabled'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'MOBILE_OVERFLOW');
 // Gateway restart retains owner budget and review idempotency.
 await app.close();app=await startDashboard(dashboardConfig);
 assert.equal((await post('/launch',retryBody)).body.id,job.id);
 await native.close();native=null;
 const offline=await (await fetch(app.origin+'/api/v1/workspace/runs')).json();
 assert.equal(offline.controls.available,false);assert.equal(offline.controls.canReview,false);assert.equal(offline.controls.cancelLaunchIds.length,0);
 assert.equal((await post('/review',{task:task('offline')})).status,503);
 assert.deepEqual(errors,[]);
 assert.deepEqual(readFileSync(resolve(installed.state,'tasks.json')),before,'INSTALLED_HISTORY_CHANGED');
 console.log(JSON.stringify({status:'PASS',checks:['existing editor review invalidated by edits','gateway origin/intent/schema/allowlist rejection','review digest enforcement','duplicate launch remains one job','immediate Dashboard run and verified owner result','cancel from shared run details','budget exhaustion and duplicate retry','gateway restart idempotency','offline controls fail closed','mobile editor','installed history unchanged'],isolated_fixture_launches:2,installed_launches_consumed:0,external_model_calls:0,open_questions_ref:'PLAN.md#open-questions'},null,2));
}finally{await browser?.close();await app?.close();await native?.close();rmSync(root,{recursive:true,force:true});}
