// Rendered UX3 checks. All review/launch replies below are browser mocks.
// Open questions: UX3-FOCUS-RECOVERY.md#open-questions.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {startDashboard} from './dashboard-server.mjs';
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
const config=JSON.parse(readFileSync(process.argv[2]));
const native=JSON.parse(readFileSync(config.console_config));
const before=readFileSync(resolve(native.state,'tasks.json'));
const output=resolve(process.argv[4]);mkdirSync(output,{recursive:true});
let app,browser;
try {
 app=process.env.WORKSPACE_TEST_ORIGIN?{origin:process.env.WORKSPACE_TEST_ORIGIN,close:async()=>{}}:await startDashboard({...config,port:0,static_root:resolve(process.argv[3])});
 const body=await (await fetch(app.origin+'/api/v1/workspace/runs')).json();
 assert.equal(body.controls.canReview,true);
 const run=body.projection.runs.find(run=>run.execution==='succeeded');assert.ok(run);
 browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[],posts=[];page.on('pageerror',e=>errors.push(e.message));
 let offline=false,reviewMode='fail',launchMode='expired',initialResolve,replyResolve;
 let initial=new Promise(ok=>initialResolve=ok),holdReply=null;
 const reply=(route,status,value)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  if(path==='/api/v1/workspace/runs'){await initial;if(offline)return reply(route,503,{error:'unavailable'});return reply(route,200,body);}
  if(req.method()==='POST'){
   posts.push(path);
   if(path.endsWith('/native-tasks/review')){
    const task=req.postDataJSON().task,mode=reviewMode;
    if(holdReply)await holdReply;
    if(mode==='fail')return reply(route,503,{error:'RUNTIME_UNAVAILABLE'});
    return reply(route,200,{review_id:'mock-review-'+posts.length,task,task_digest:'mock-digest',expires_at:Date.now()+(mode==='short'?1200:300000),route:'CA2-ROUTE-UNDERSTAND',bindings:{}});
   }
   if(path.endsWith('/native-tasks/launch'))return reply(route,launchMode==='expired'?409:502,{error:launchMode==='expired'?'REVIEW_EXPIRED':'CONTROL_DELIVERY_UNCERTAIN_CHECK_RUNS'});
   throw Error('UNEXPECTED_EFFECT '+path);
  }
  return route.continue();
 });
 const focused=async locator=>{
  await locator.waitFor();
  for(let i=0;i<100;i++){
   if(await locator.evaluate(e=>e.getRootNode().activeElement===e))return;
   await page.waitForTimeout(25);
  }
  throw Error('FOCUS_MISSING '+await locator.innerText());
 };
 const focusedHeading=name=>focused(page.getByRole('heading',{name,exact:true}));
 const reviews=()=>posts.filter(path=>path.endsWith('/review')).length;
 const launches=()=>posts.filter(path=>path.endsWith('/launch')).length;
 await page.goto(app.origin+'/#/apps/orchestrator/runs/'+encodeURIComponent(run.viewId));
 await page.getByText('Loading run observations…',{exact:true}).waitFor();
 assert.equal(await page.getByRole('heading',{name:'Run unavailable',exact:true}).count(),0);
 initialResolve();await focusedHeading(run.title);
 await page.getByRole('tab',{name:'Result',exact:true}).click();await focused(page.getByRole('tab',{name:'Result',exact:true}));
 await page.getByRole('button',{name:'Open Dashboard',exact:true}).click();await focusedHeading('Dashboard');
 await page.getByRole('button',{name:'Open Runs',exact:true}).click();await focusedHeading('Runs');
 const search=page.getByRole('searchbox',{name:'Search runs'});await search.focus();await page.waitForTimeout(3300);await focused(search);
 await page.getByRole('list',{name:'Projected runs'}).getByRole('link').first().click();await focusedHeading(run.title);
 await page.goBack();await focusedHeading('Runs');await page.goForward();await focusedHeading(run.title);
 await page.reload();await focusedHeading(run.title);
 const skip=page.getByRole('button',{name:'Skip to Runs content',exact:true});await skip.focus();await skip.press('Enter');await focusedHeading(run.title);
 await page.getByRole('navigation',{name:'Orchestrator sections'}).getByRole('link',{name:'Runs',exact:true}).click();await focusedHeading('Runs');
 await page.getByRole('link',{name:'New run',exact:true}).click();await focusedHeading('Native tasks');
 const input=page.getByLabel('Supplied input',{exact:true}),instruction=page.getByLabel('Instruction',{exact:true});
 await input.fill('');await page.getByRole('button',{name:'Review task',exact:true}).click();await focused(input);
 assert.equal(await input.getAttribute('aria-invalid'),'true');assert.equal(await input.getAttribute('aria-describedby'),'native-input-error');assert.equal(reviews(),0);
 await input.fill('Keep this draft through failure and disconnection.');
 holdReply=new Promise(ok=>replyResolve=ok);
 const reviewButton=page.getByRole('button',{name:'Review task',exact:true});
 await reviewButton.focus();await reviewButton.press('Enter');
 await page.getByText('Reviewing the task…',{exact:true}).waitFor();await focused(reviewButton);
 await reviewButton.evaluate(e=>e.click());assert.equal(reviews(),1,'DUPLICATE_REVIEW_WHILE_BUSY');
 replyResolve();holdReply=null;
 await page.getByRole('alert').filter({hasText:'could not be reached'}).waitFor();
 const retry=page.getByRole('button',{name:'Retry review',exact:true});await focused(retry);
 assert.match(await input.inputValue(),/Keep this draft/);
 reviewMode='short';await retry.press('Enter');await focusedHeading('2. Review and launch');
 const launch=page.getByRole('button',{name:'Launch fixture task',exact:true});await launch.focus();
 await page.getByText('Review expired. Choose Review again to get a fresh review.',{exact:true}).waitFor();await focused(launch);
 assert.equal(await launch.getAttribute('aria-disabled'),'true');await launch.press('Enter');assert.equal(launches(),0);
 reviewMode='valid';await page.getByRole('button',{name:'Review again',exact:true}).click();await focusedHeading('2. Review and launch');
 // Owner rejection of an apparently current review restores a usable focus target.
 await launch.focus();await launch.press('Enter');
 await page.getByRole('alert').filter({hasText:'no longer valid'}).waitFor();await focused(page.getByRole('button',{name:'Review again',exact:true}));
 assert.equal(await page.getByRole('region',{name:'Task review'}).count(),0);
 // Editing while review is pending invalidates that response without stealing focus.
 holdReply=new Promise(ok=>replyResolve=ok);
 await page.getByRole('button',{name:'Review again',exact:true}).click();
 await page.getByText('Reviewing the task…',{exact:true}).waitFor();
 await instruction.fill('Edited while a review was pending.');
 replyResolve();holdReply=null;
 await page.waitForTimeout(300);assert.equal(await page.getByRole('region',{name:'Task review'}).count(),0);await focused(instruction);
 await page.getByRole('button',{name:'Review task',exact:true}).click();await focusedHeading('2. Review and launch');
 await input.focus();const handle=await input.elementHandle();
 offline=true;
 await page.getByText('The local runtime is offline or connecting. Your text is kept.',{exact:true}).waitFor({timeout:15000});
 assert.equal(await handle.evaluate(e=>e.isConnected),true,'OFFLINE_UNMOUNTED_DRAFT');
 await focused(input);assert.match(await input.inputValue(),/Keep this draft/);
 const count=reviews();await page.getByRole('button',{name:'Review task',exact:true}).evaluate(e=>e.click());assert.equal(reviews(),count);
 offline=false;
 await page.waitForFunction(()=>document.querySelector('[data-workspace-frontend="orchestrator"]').shadowRoot.querySelector('#native-availability').textContent==='');
 await page.getByText('Connection restored. Your draft is kept.',{exact:true}).waitFor();
 await focused(input);assert.match(await input.inputValue(),/Keep this draft/);
 // A failed launch delivery is not converted into a new review/task.
 launchMode='uncertain';await launch.focus();await launch.press('Enter');
 await page.getByRole('alert').filter({hasText:'It may have started'}).waitFor();await focused(launch);
 const delivered=launches();await launch.evaluate(e=>e.click());assert.equal(launches(),delivered);
 await instruction.fill('Draft retained, but launch still needs inspection.');
 await page.getByRole('button',{name:'Review task',exact:true}).evaluate(e=>e.click());assert.equal(reviews(),count);
 await page.screenshot({path:resolve(output,'uncertain-launch.png'),fullPage:true});
 await page.getByRole('link',{name:'Inspect Runs',exact:true}).click();await focusedHeading('Runs');
 assert.deepEqual(errors,[]);
 assert.deepEqual(readFileSync(resolve(native.state,'tasks.json')),before);
 const result={status:'PASS',checks:['loading waits for route heading','Dashboard and embedded route focus','back, forward, reload and skip action','polling and tab selection preserve focus','associated field errors','busy review focus and duplicate guard','review failure and retry retain draft','timer expiry blocks launch without moving focus','owner-expired review restores Review again focus','stale review response does not steal focus','offline editor stays mounted and retains draft','uncertain launch blocks fresh submission and links to Runs'],mock_review_calls:reviews(),mock_launch_calls:launches(),installed_launches_consumed:0,installed_history_unchanged:true,remaining_fixture_launches:body.controls.remaining,open_questions_ref:'UX3-FOCUS-RECOVERY.md#open-questions'};
 writeFileSync(resolve(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser?.close();await app?.close();}
