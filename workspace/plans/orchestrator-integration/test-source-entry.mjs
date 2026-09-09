// Browser review only against an isolated owner. No launch requests.
// Open questions: T5C-SOURCE-ENTRY.md#open-questions.
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
 const page=await browser.newPage({viewport:{width:1440,height:1000},bypassCSP:true});
 const audits=[];
 const audit=async(name,selector)=>{await page.waitForTimeout(350);if(!await page.evaluate(()=>!!window.axe))await page.addScriptTag({path:'/tmp/orchestrator-ux/node_modules/axe-core/axe.min.js'});const result=await page.evaluate(async selector=>window.axe.run(selector?{include:[selector]}:document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}),selector);audits.push({name,violations:result.violations,incomplete:result.incomplete.map(x=>x.id)});assert.equal(result.violations.length,0,JSON.stringify(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))));};
 await page.addInitScript(()=>{
  let channel;
  window.__TAURI__={core:{Channel:class {onmessage=()=>{};},invoke:async(command,args)=>{
   if(command==='chat_control_plane_status')return true;
   if(command==='chat_connect'){channel=args.onEvent;return {connectionId:1,transport:'tauri-channel-to-are-jsonl-stdio',authorityEffect:'none'};}
   if(command==='chat_replay'){channel.onmessage({type:'session.ready',threadId:'test-thread',emittedAtMs:Date.now()});return 0;}
   if(command==='chat_send'){channel.onmessage({type:'turn.completed',emittedAtMs:Date.now()});return;}
   return true;
  }}};
 });
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(new URL(r.url()).pathname)});
 await page.route('**/native-tasks/launch',route=>route.abort());
 await page.goto(app.origin+'/#/collections/projects');
 const meaning=await page.locator('.record-detail .meaning').innerText();
 await audit('project source action','.source-task-action');
 await page.getByRole('button',{name:'Prepare task from project description',exact:true}).click();
 const input=page.getByLabel('Supplied input',{exact:true});await input.waitFor();
 assert.notEqual(await input.inputValue(),meaning);
 await page.setViewportSize({width:320,height:900});await audit('mobile source preview and composer');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:resolve(out,'source-preview-mobile.png')});
 await page.setViewportSize({width:1440,height:1000});
 await page.getByLabel('Instruction',{exact:true}).fill('Keep my custom instruction.');
 await input.fill('Keep my current input.');
 const originalInput=await input.inputValue();
 await page.getByRole('link',{name:'Return to selected source',exact:true}).click();
 await page.getByRole('button',{name:'Prepare task from project description',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'A source selection is already waiting'}).waitFor();
 await page.evaluate(()=>location.hash='#/apps/orchestrator/runs/new');
 await page.getByRole('button',{name:'Dismiss selection',exact:true}).click();
 assert.equal(await input.inputValue(),originalInput);
 assert.equal(await page.getByLabel('Instruction',{exact:true}).inputValue(),'Keep my custom instruction.');
 await page.evaluate(()=>location.hash='#/collections/projects');
 await page.getByRole('button',{name:'Prepare task from project description',exact:true}).click();
 await page.getByRole('button',{name:'Review task',exact:true}).click();
 await page.getByRole('region',{name:'Task review',exact:true}).waitFor();
 await page.getByRole('button',{name:'Use selected source',exact:true}).click();
 assert.equal(await page.getByRole('region',{name:'Task review',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Launch fixture task',exact:true}).count(),0);
 const envelope=await input.inputValue();const selected=JSON.parse(envelope.slice(envelope.indexOf('\n')+1));
 assert.equal(await page.getByLabel('Instruction',{exact:true}).inputValue(),'Keep my custom instruction.');
 assert.equal(selected.text,meaning);assert.equal(selected.source.kind,'project');assert.equal(selected.source.selector,'meaning');
 await page.getByRole('button',{name:'Review task',exact:true}).click();
 const review=page.getByRole('region',{name:'Task review',exact:true});await review.waitFor();
 assert.equal(await review.locator('pre').innerText(),envelope);
 await page.getByRole('link',{name:'Return to selected source',exact:true}).click();
 await page.getByText('The current selection matches the declared revision and text.',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'Selected source');
 await audit('project source return','.source-return');
 await page.reload();await page.getByText('The current selection matches the declared revision and text.',{exact:true}).waitFor();
 const projectHref=await page.evaluate(()=>location.hash);
 await page.evaluate(()=>{const q=new URLSearchParams(location.hash.split('?')[1]),t=JSON.parse(q.get('origin'));t.source.revision='changed';q.set('origin',JSON.stringify(t));location.hash='#/collections/projects?'+q;});
 await page.getByText('The source has changed. This is current content, not the reviewed revision.',{exact:true}).waitFor();
 // Exercise run -> source -> run with an explicitly mocked run projection, without a launch.
 const sourceTarget=JSON.parse(new URLSearchParams(projectHref.split('?')[1]).get('origin'));
 await page.route('**/api/v1/workspace/runs',async route=>{
  const response=await route.fetch(),data=await response.json();
  data.projection.runs=[{viewId:'test/run/source',runRef:null,launchId:'source',taskId:'source',title:'Source navigation fixture',icon:'text-task',workKind:'are-native-fixture',originRefs:[sourceTarget.source],origin:{source:sourceTarget.source,textSha256:sourceTarget.textSha256,taskDigest:'test-only',binding:'task-digest-bound',sourceVerification:'caller-declared'},execution:'preparing',scheduling:'unknown',mode:'fixture',executor:{contract:null,modelTarget:null},progress:null,result:{kind:'fixture-text',content:null,verification:'unavailable',completionDigest:null},lifecycle:{execution:null,acceptance:null,promotion:null},source:{runtimeId:'source-browser-test',label:'Test',location:'local',freshness:'live',observedAtMs:Date.now(),revision:1},attention:[],actions:[]}];
  await route.fulfill({response,json:data});
 });
 await page.goto(app.origin+'/#/apps/orchestrator/runs/'+encodeURIComponent('test/run/source'));
 await page.getByRole('link',{name:'Open declared source',exact:true}).click();
 await page.getByText('The current selection matches the declared revision and text.',{exact:true}).waitFor();
 await page.getByRole('link',{name:'Back to run',exact:true}).click();
 await page.getByRole('heading',{name:'Source navigation fixture',exact:true}).waitFor();
 await page.goto(app.origin+'/#/chat');
 await page.getByLabel('Message the governed Codex session',{exact:true}).fill('One explicitly selected message.');
 await page.getByRole('button',{name:'Send',exact:true}).click();
 await page.getByRole('button',{name:'Prepare task from this message',exact:true}).click();
 await page.getByRole('button',{name:'Use selected source',exact:true}).click();
 const chatEnvelope=JSON.parse((await input.inputValue()).split('\n').slice(1).join('\n'));
 assert.equal(chatEnvelope.text,'One explicitly selected message.');assert.equal(chatEnvelope.source.id,'test-thread');assert.match(chatEnvelope.source.revision,/^sha256:/);
 await page.getByRole('link',{name:'Return to selected source',exact:true}).click();
 await page.getByText('The current selection matches the declared revision and text.',{exact:true}).waitFor();
 await page.reload();await page.getByText('The selected source is unavailable here. Chat history is kept only while this page remains open.',{exact:true}).waitFor();
 await page.setViewportSize({width:320,height:900});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await audit('missing chat source return','.source-return');
 writeFileSync(resolve(out,'axe.json'),JSON.stringify(audits,null,2));
 assert.equal(posts.length,2);assert.ok(posts.every(path=>path.endsWith('/review')));
 assert.equal(owner.snapshot().jobs.length,0);assert.deepEqual(readFileSync(resolve(installed.state,'tasks.json')),before);
 writeFileSync(resolve(out,'entry.json'),JSON.stringify({status:'PASS',checks:['occupied selection cannot be overwritten; dismissal leaves input intact','applying selection clears prior review and launch action','project description only, explicit input replacement','real owner review preserves selection','project return and reload match exact snapshot','changed revision remains explicit','mocked run source return and back navigation','mocked Chat bridge selects one message with content revision','Chat return matches retained message; reload reports unavailable','320px source return reflow'],review_calls:2,launch_requests:0,installed_history_unchanged:true,external_model_calls:0,open_questions_ref:'T5C-SOURCE-ENTRY.md#open-questions'},null,2));
 console.log('PASS source entry and return journeys; zero launch requests');

}finally{await browser?.close();await app?.close();await owner?.close();rmSync(root,{recursive:true,force:true});}
