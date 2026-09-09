// Three isolated local fixture launches; installed journals and budget stay intact.
// Chat transport is mocked; native review, dispatch, owner replay and Essays are real.
// Open questions: T5E-ACCEPTANCE.md#open-questions.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import {startNativeConsole} from '../luna-vps/runtime/native-console-server.mjs';
import {startDashboard} from './dashboard-server.mjs';
import {readSourceContext} from '../../runtime/src/features/runs/source-context.ts';
const installed=JSON.parse(readFileSync(process.argv[2])),before=readFileSync(resolve(installed.state,'tasks.json'));
const root=mkdtempSync('/tmp/t5e-'),out=resolve(process.argv[5]);mkdirSync(out,{recursive:true});
const config={...installed,state:resolve(root,'state'),runtime:resolve(root,'run'),port:0,max_tasks:3};
const journeys=[],posts=[],errors=[];let owner,app,browser;
async function untilIdle(){const deadline=Date.now()+100000;while(Date.now()<deadline){if(!owner.snapshot().active)return;await new Promise(ok=>setTimeout(ok,200));}throw Error('OWNER_TIMEOUT');}
try{
 owner=await startNativeConsole(config);config.port=Number(new URL(owner.origin).port);
 const file=resolve(root,'console.json');writeFileSync(file,JSON.stringify(config));
 app=await startDashboard({schema_version:'workspace-dashboard-config/v1',console_config:file,driver:resolve(process.argv[3]),static_root:resolve(process.argv[4]),port:0,runtime_id:'t5e-isolated',controls_enabled:true});
 browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},bypassCSP:true});
 await page.addInitScript(()=>{
  let channel;
  window.__TAURI__={core:{Channel:class {onmessage=()=>{};},invoke:async(command,args)=>{
   if(command==='chat_control_plane_status')return true;
   if(command==='chat_connect'){channel=args.onEvent;return {connectionId:1,transport:'tauri-channel-to-are-jsonl-stdio',authorityEffect:'none'};}
   if(command==='chat_replay'){channel.onmessage({type:'session.ready',threadId:'t5e-mocked-chat',emittedAtMs:Date.now()});return 0;}
   if(command==='chat_send'){setTimeout(()=>channel.onmessage({type:'turn.completed',emittedAtMs:Date.now()}),0);return;}
   return true;
  }}};
 });
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.method()==='POST')posts.push(new URL(r.url()).pathname)});
 const readHandoff=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ca2.run-result-handoff.v1')));
 const savedWorkspace=()=>page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key.startsWith('cyberalchemy.essays.workspace.'))));
 for(const kind of ['project','chat','knowledge']){
  console.log('Starting '+kind+' source journey');
  const priorPosts=posts.length;
  if(kind==='project'){
   await page.goto(app.origin+'/#/collections/projects');
   await page.getByRole('button',{name:'Prepare task from project description',exact:true}).click();
  }else if(kind==='chat'){
   await page.goto(app.origin+'/#/chat');
   await page.getByLabel('Message the governed Codex session',{exact:true}).fill('Explicitly selected Chat text for the integrated fixture journey.');
   await page.getByRole('button',{name:'Send',exact:true}).click();
   await page.getByRole('button',{name:'Prepare task from this message',exact:true}).click();
  }else{
   await page.goto(app.origin+'/#/apps/orchestrator/ontologies');
   await page.getByText('Browse records and relationships without the canvas',{exact:true}).click();
   await page.getByRole('list',{name:'Ontology records',exact:true}).getByRole('button',{name:'Typed continuation',exact:true}).click();
   await page.getByRole('button',{name:'Prepare task from this concept',exact:true}).click();
  }
  await page.getByRole('button',{name:'Use selected source',exact:true}).click();
  const input=await page.getByLabel('Supplied input',{exact:true}).inputValue(),envelope=await readSourceContext(input);
  assert.equal(envelope.source.kind,kind);assert.equal(posts.length,priorPosts,'selection must not review or dispatch');
  if(kind==='knowledge')assert.equal(JSON.parse(envelope.text).status,'candidate');
  await page.getByLabel('Title',{exact:true}).fill('Integrated '+kind+' fixture');
  await page.getByRole('button',{name:'Review task',exact:true}).click();
  const review=page.getByRole('region',{name:'Task review',exact:true});await review.waitFor();
  assert.equal(await review.locator('pre').innerText(),input);const taskDigest=await review.locator('code').innerText();
  const responsePromise=page.waitForResponse(r=>r.url().endsWith('/native-tasks/launch')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Launch fixture task',exact:true}).click();
  const response=await responsePromise;assert.equal(response.status(),202);const job=await response.json();
  assert.equal(job.task_digest,taskDigest);assert.equal(job.task.input,input);
  await untilIdle();const finished=owner.snapshot().jobs.find(j=>j.id===job.id);assert.equal(finished.status,'succeeded',finished.error??'fixture failed');assert.equal(finished.fixture_provider_calls,1);
  await page.getByRole('button',{name:'Open Dashboard',exact:true}).click();
  const card=page.getByRole('article',{name:'Run: Integrated '+kind+' fixture',exact:true});await card.waitFor();
  assert.equal(await card.count(),1);await card.getByText('Completed',{exact:true}).waitFor();assert.equal(await card.getByRole('img',{name:'Text task'}).count(),1);
  await card.getByRole('link',{name:'View result',exact:true}).click();
  const overview=page.getByRole('tab',{name:'Overview',exact:true});await overview.waitFor();assert.equal(await overview.getAttribute('aria-selected'),'true');
  const data=await (await fetch(app.origin+'/api/v1/workspace/runs')).json();assert.deepEqual(data.errors,[]);
  const run=data.projection.runs.find(r=>r.launchId===job.id);assert.ok(run.runRef);assert.equal(run.result.verification,'owner-verified');assert.deepEqual(run.origin.source,envelope.source);assert.equal(run.origin.taskDigest,taskDigest);assert.equal(run.origin.textSha256,envelope.text_sha256);
  await page.getByRole('link',{name:'Open declared source',exact:true}).click();
  await page.getByText('The current selection matches the declared revision and text.',{exact:true}).waitFor();
  await page.getByRole('link',{name:'Back to run',exact:true}).click();await overview.waitFor();
  await page.getByRole('tab',{name:'Result',exact:true}).click();
  await page.getByRole('button',{name:'Open result in Essays',exact:true}).click();
  const panel=page.getByRole('complementary',{name:'Run result handoff',exact:true});await panel.waitFor();
  assert.equal((await readHandoff()).source.runKey,run.runRef.runKey);assert.equal((await readHandoff()).source.completionDigest,run.result.completionDigest);
  if(kind==='project'){
   await page.getByRole('button',{name:'Create local studio',exact:true}).click();
   await page.getByRole('button',{name:'Accept intent',exact:true}).click();
   await page.getByRole('button',{name:'Generate & accept local plan',exact:true}).click();
  }
  const editor=page.locator('[contenteditable="true"]');await editor.waitFor();await editor.fill('Unsaved '+kind+' writing');
  assert.equal(await panel.getByRole('button',{name:'Stage result in editor',exact:true}).isDisabled(),true);
  const savedBefore=await savedWorkspace();await panel.getByRole('checkbox').check();
  await panel.getByRole('button',{name:'Stage result in editor',exact:true}).click();
  await page.waitForFunction(text=>document.querySelector('[contenteditable="true"]')?.textContent===text,run.result.content);
  assert.deepEqual(await savedWorkspace(),savedBefore,'staging must not save');assert.equal((await readHandoff()).saved,null);
  await page.getByRole('button',{name:'Save accepted draft',exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ca2.run-result-handoff.v1')).saved?.match==='exact');
  const exactSave=(await readHandoff()).saved;
  await editor.fill('Edited '+kind+' fixture result');await page.getByRole('button',{name:'Save accepted draft',exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ca2.run-result-handoff.v1')).saved?.match==='edited');
  const editedSave=(await readHandoff()).saved;assert.ok(editedSave.essayRevision>exactSave.essayRevision);
  await page.reload();await panel.waitFor();await editor.waitFor();assert.equal(await editor.innerText(),'Edited '+kind+' fixture result');
  await panel.getByRole('link',{name:'Open source run',exact:true}).click();await overview.waitFor();
  await page.getByRole('link',{name:'Open declared source',exact:true}).click();
  if(kind==='chat')await page.getByText('The selected source is unavailable here. Chat history is kept only while this page remains open.',{exact:true}).waitFor();
  else await page.getByText('The current selection matches the declared revision and text.',{exact:true}).waitFor();
  await page.getByRole('link',{name:'Back to run',exact:true}).click();await overview.waitFor();
  await page.getByRole('button',{name:'Open Essays',exact:true}).click();await panel.waitFor();
  await panel.getByRole('button',{name:'Dismiss handoff',exact:true}).click();assert.equal(await readHandoff(),null);assert.equal(await editor.innerText(),'Edited '+kind+' fixture result');
  journeys.push({source:envelope.source,source_text_sha256:envelope.text_sha256,task_digest:taskDigest,launch_id:job.id,view_id:run.viewId,owner_run_key:run.runRef.runKey,completion_digest:run.result.completionDigest,exact_save:exactSave,edited_save:editedSave,fixture_provider_calls:finished.fixture_provider_calls});
  console.log('PASS '+kind+' source → real fixture → owner-verified run → Essays exact/edited save');
 }
 assert.equal(owner.snapshot().jobs.length,3);assert.equal(owner.snapshot().fixture_budget_remaining,0);
 const nativeJournal=readFileSync(resolve(config.state,'tasks.json'));
 await owner.close();owner=await startNativeConsole(config);
 assert.deepEqual(readFileSync(resolve(config.state,'tasks.json')),nativeJournal,'successful owner replay must preserve journal bytes');
 const replay=await (await fetch(app.origin+'/api/v1/workspace/runs')).json();assert.deepEqual(replay.errors,[]);assert.equal(replay.projection.runs.length,3);assert.equal(replay.controls.remaining,0);
 for(const journey of journeys){const run=replay.projection.runs.find(r=>r.viewId===journey.view_id);assert.equal(run.result.verification,'owner-verified');assert.equal(run.runRef.runKey,journey.owner_run_key);assert.equal(run.result.completionDigest,journey.completion_digest);assert.deepEqual(run.origin.source,journey.source);}
 await page.goto(app.origin+'/#/dashboard');await page.getByRole('heading',{name:'Dashboard',exact:true}).waitFor();
 for(const kind of ['project','chat','knowledge'])await page.getByRole('article',{name:'Run: Integrated '+kind+' fixture',exact:true}).waitFor();
 assert.equal(posts.filter(p=>p.endsWith('/review')).length,3);assert.equal(posts.filter(p=>p.endsWith('/launch')).length,3);assert.equal(posts.length,6);assert.deepEqual(errors,[]);
 assert.deepEqual(readFileSync(resolve(installed.state,'tasks.json')),before);
 await page.screenshot({path:resolve(out,'integrated-dashboard.png'),fullPage:true});
 writeFileSync(resolve(out,'integrated.json'),JSON.stringify({status:'PASS',journeys,checks:['three explicit source kinds bind review and real fixture task','one dashboard card and icon per owner launch','Overview first','origin return links before and after Essays reload','explicit staging does not save','exact and edited saved revisions remain distinct','dismiss leaves writing intact','native restart replays all three owners without journal mutation'],isolated_launches:3,isolated_fixture_calls:3,installed_history_unchanged:true,external_model_calls:0,chat_transport:'mocked Tauri bridge',open_questions_ref:'T5E-ACCEPTANCE.md#open-questions'},null,2));
 console.log('PASS native restart replay; installed journals unchanged; three isolated fixture launches, zero paid calls');
}catch(error){writeFileSync(resolve(out,'failure.json'),JSON.stringify({error:String(error),journeys,owner:owner?.snapshot().jobs.map(j=>({id:j.id,status:j.status,error:j.error,fixture_provider_calls:j.fixture_provider_calls}))},null,2));throw error;}
finally{await browser?.close();await app?.close();await owner?.close();rmSync(root,{recursive:true,force:true});}
