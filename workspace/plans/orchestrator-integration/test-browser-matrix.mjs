// Browser engine journeys and semantic snapshots do not replace screen readers.
// Open questions: UX6-ACCEPTANCE.md#open-questions.
import {chromium,firefox,webkit} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const origin=process.argv[2]||'http://127.0.0.1:4187',out=resolve(process.argv[3]||'/tmp/ux6-matrix');mkdirSync(out,{recursive:true});
const webkitExecutable=process.env.WORKSPACE_WEBKIT_EXECUTABLE;
const config=JSON.parse(readFileSync('/home/vrondelli/.local/state/are-workspace/dashboard-01/config.json'));
const native=JSON.parse(readFileSync(config.console_config)),journal=resolve(native.state,'tasks.json'),before=readFileSync(journal);
const body=await (await fetch(origin+'/api/v1/workspace/runs')).json(),run=body.projection.runs.find(r=>r.execution==='succeeded');
const results=[];
for(const name of (process.env.TEST_BROWSERS||'chromium,firefox,webkit').split(',')){
 let browser;
 try{
  browser=await ({chromium,firefox,webkit}[name]).launch({headless:true,...(name==='chromium'?{executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'}:name==='webkit'&&webkitExecutable?{executablePath:webkitExecutable}:{})});
  for(const width of [1440,320]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage(),errors=[],posts=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/**',async route=>{
    if(route.request().method()==='POST'){
     posts.push(route.request().url());
     assert.ok(route.request().url().endsWith('/native-tasks/review'));
     return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'runtime_unavailable'})});
    }
    return route.continue();
   });
   await page.goto(origin+'/#/dashboard');
   await page.getByRole('heading',{name:'Dashboard',exact:true}).waitFor();
   await page.locator('a[href="#/runs/'+encodeURIComponent(run.viewId)+'"]').click();
   const overview=page.getByRole('tab',{name:'Overview',exact:true});
   await overview.waitFor();assert.equal(await overview.getAttribute('aria-selected'),'true');
   await page.getByRole('list',{name:'Single execution step',exact:true}).waitFor();
   writeFileSync(resolve(out,`${name}-${width}-overview.aria.txt`),await page.locator('.embedded-console').ariaSnapshot());
   for(const tab of ['Result','Strategy','Trace','Workers','Evidence','Lifecycle']){
    await page.getByRole('tab',{name:tab,exact:true}).click();
    assert.equal(await page.getByRole('tab',{name:tab,exact:true}).getAttribute('aria-selected'),'true');
    if(tab==='Result')assert.equal(await page.getByLabel('Final run deliverable',{exact:true}).innerText(),run.result.content);
   }
   await page.getByRole('tab',{name:'Lifecycle',exact:true}).press('Home');
   assert.equal(await overview.getAttribute('aria-selected'),'true');
   assert.equal(await overview.evaluate(el=>el.getRootNode().activeElement===el),true);
   await page.reload();await overview.waitFor();assert.equal(await overview.getAttribute('aria-selected'),'true');
   await page.getByRole('navigation',{name:'Orchestrator sections'}).getByRole('link',{name:'Runs',exact:true}).click();
   await page.getByRole('searchbox',{name:'Search runs'}).fill('no-such-run-matrix');
   await page.getByText('No matching runs',{exact:true}).waitFor();
   await page.getByRole('button',{name:'Reset filters',exact:true}).click();
   assert.equal(await page.getByRole('list',{name:'Projected runs'}).getByRole('listitem').count(),body.projection.runs.length);
   await page.getByRole('navigation',{name:'Orchestrator sections'}).getByRole('link',{name:'Research ontology',exact:true}).click();
   await page.getByText('Browse records and relationships without the canvas',{exact:true}).click();
   const records=page.getByRole('list',{name:'Ontology records'});assert.ok(await records.getByRole('listitem').count()>0);
   await records.getByRole('button').first().press('Enter');assert.equal(await records.getByRole('button').first().getAttribute('aria-pressed'),'true');
   await page.goto(origin+'/#/apps/orchestrator/runs/new');
   const input=page.getByLabel('Supplied input',{exact:true});await input.fill('');
   await page.getByRole('button',{name:'Review task',exact:true}).click();
   assert.equal(await input.evaluate(el=>el.getRootNode().activeElement===el),true);
   assert.equal(await input.getAttribute('aria-invalid'),'true');
   await input.fill('Preserve this cross-browser draft.');
   await page.getByRole('button',{name:'Review task',exact:true}).click();
   await page.getByRole('alert').waitFor();assert.equal(await input.inputValue(),'Preserve this cross-browser draft.');
   assert.equal(posts.length,1);
   writeFileSync(resolve(out,`${name}-${width}-failure.aria.txt`),await page.locator('.embedded-console').ariaSnapshot());
   await page.getByRole('button',{name:'Retry review',exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.deepEqual(errors,[]);
   results.push({name,version:browser.version(),width,status:'PASS',checks:['dashboard to default Overview','all seven tabs','verified result','keyboard Home and focus','reload','search/reset','ontology keyboard list','required-field focus','mocked review failure retains draft','no document overflow'],mock_reviews:posts.length,real_dispatches:0});
   await context.close();
  }
 }catch(error){results.push({name,status:'FAILED_OR_UNAVAILABLE',error:String(error)});}
 finally{await browser?.close();}
 writeFileSync(resolve(out,'matrix.json'),JSON.stringify({results,platform:'Ubuntu 26.04; Playwright Ubuntu 24.04 browser compatibility override',real_screen_reader_test:false,installed_history_unchanged:before.equals(readFileSync(journal)),open_questions_ref:'UX6-ACCEPTANCE.md#open-questions'},null,2));
}
assert.deepEqual(readFileSync(journal),before);
console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
