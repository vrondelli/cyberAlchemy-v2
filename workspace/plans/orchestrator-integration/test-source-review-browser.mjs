// Browser review only against an isolated owner. No launch requests.
// Open questions: T5B-SOURCE-CONTEXT.md#open-questions.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import {startNativeConsole} from '../luna-vps/runtime/native-console-server.mjs';
import {startDashboard} from './dashboard-server.mjs';
import {encodeSourceContext} from '../../runtime/src/features/runs/source-context.ts';
const installed=JSON.parse(readFileSync(process.argv[2])),before=readFileSync(resolve(installed.state,'tasks.json'));
const root=mkdtempSync('/tmp/source-browser-'),out=resolve(process.argv[5]);mkdirSync(out,{recursive:true});
const config={...installed,state:resolve(root,'state'),runtime:resolve(root,'runtime'),port:0,max_tasks:1};
let owner,app,browser;
try{
 owner=await startNativeConsole(config);
 const file=resolve(root,'console.json');writeFileSync(file,JSON.stringify({...config,port:Number(new URL(owner.origin).port)}));
 app=await startDashboard({schema_version:'workspace-dashboard-config/v1',console_config:file,driver:resolve(process.argv[3]),static_root:resolve(process.argv[4]),port:0,runtime_id:'source-browser-test',controls_enabled:true});
 browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(new URL(r.url()).pathname)});
 await page.route('**/native-tasks/launch',route=>route.abort());
 await page.goto(app.origin+'/#/apps/orchestrator/runs/new');
 const source={kind:'chat',id:'chat-fixture',revision:'message-rev-3',selector:'message:2'};
 const first=await encodeSourceContext(source,'Explicit selected text.');
 await page.getByLabel('Supplied input',{exact:true}).fill(first);
 await page.getByRole('button',{name:'Review task',exact:true}).click();
 const review=page.getByRole('region',{name:'Task review',exact:true});await review.waitFor();
 assert.equal(await review.locator('pre').innerText(),first);
 const digest=await review.locator('code').innerText();
 const changed=await encodeSourceContext({...source,revision:'message-rev-4'},'Explicit selected text.');
 await page.getByLabel('Supplied input',{exact:true}).fill(changed);
 assert.equal(await review.count(),0);assert.equal(await page.getByRole('button',{name:'Launch fixture task',exact:true}).count(),0);
 await page.getByRole('button',{name:'Review task',exact:true}).click();
 await review.waitFor();assert.notEqual(await review.locator('code').innerText(),digest);
 assert.equal(await review.locator('pre').innerText(),changed);
 assert.equal(posts.length,2);assert.ok(posts.every(path=>path.endsWith('/review')));
 assert.equal(owner.snapshot().jobs.length,0);assert.deepEqual(readFileSync(resolve(installed.state,'tasks.json')),before);
 writeFileSync(resolve(out,'browser.json'),JSON.stringify({status:'PASS',checks:['review exposes exact selected source bytes','editing source revision removes prior review and launch action','new review has a different digest'],review_calls:2,launch_requests:0,installed_history_unchanged:true,external_model_calls:0,open_questions_ref:'T5B-SOURCE-CONTEXT.md#open-questions'},null,2));
 console.log('PASS source revision edits invalidate browser review; zero launch requests');
}finally{await browser?.close();await app?.close();await owner?.close();rmSync(root,{recursive:true,force:true});}
