// Actual local console -> Rust -> ARE -> native Codex -> fixture acceptance.
// Open questions: ../NATIVE-CONSOLE-PLAN.md#open-questions
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {startNativeConsole} from './native-console-server.mjs';
const root=mkdtempSync('/tmp/nc-'),config={schema_version:'are-native-console-config/v1',mode:'native-fixture',candidate:resolve(process.argv[2]),driver:resolve(process.argv[3]),state:resolve(root,'state'),runtime:resolve(root,'run'),static_root:resolve(process.argv[4]),port:0,max_tasks:2};
let app;const results=[];
const task=id=>({schema_version:'are-text-task/v1',task_id:id,title:'Console acceptance',instruction:'Summarize the supplied status.',input:'Check the real transport with a fixture.',objective_kind:'understand'});
async function post(path,body,headers={}){const response=await fetch(app.origin+'/api/v1/native-tasks'+path,{method:'POST',headers:{Origin:app.origin,'Content-Type':'application/json','X-Orchestrator-Intent':'native-task',...headers},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};}
async function until(predicate){const deadline=Date.now()+90000;while(Date.now()<deadline){const value=app.snapshot();if(predicate(value))return value;await new Promise(ok=>setTimeout(ok,100));}throw new Error('CONSOLE_WAIT_TIMEOUT: '+JSON.stringify(app.snapshot()));}
try{
 app=await startNativeConsole(config);
 await assert.rejects(startNativeConsole(config),/CONSOLE_STATE_ALREADY_LOCKED/);
 assert.equal((await fetch(app.origin,{redirect:'manual'})).headers.get('location'),'/native');assert.equal((await fetch(app.origin+'/native')).status,200);
 assert.equal((await post('/review',{task:task('no')},{Origin:'https://untrusted.example'})).status,403);
 assert.equal((await post('/review',{task:task('no')},{'X-Orchestrator-Intent':''})).status,403);
 assert.equal(await new Promise((ok,no)=>{const req=request(app.origin+'/api/v1/native-tasks',{headers:{Host:'untrusted.example'}},res=>{res.resume();ok(res.statusCode);});req.on('error',no);req.end();}),403);
 assert.equal((await post('/review',{task:{...task('no'),mode:'live'}})).status,400);
 assert.equal((await fetch(app.origin+'/api/v1/runs',{method:'POST',headers:{Origin:app.origin,'Content-Type':'application/json','X-Orchestrator-Intent':'native-task'},body:'{}'})).status,404);
 assert.equal(app.snapshot().jobs.length,0);results.push('origin, host, intent, closed task schema and legacy write rejection');
 const reviewed=(await post('/review',{task:task('console_success')})).body;
 assert.equal((await post('/launch',{review_id:reviewed.review_id,task_digest:'wrong'})).status,409);assert.equal(app.snapshot().jobs.length,0);
 const launchBody={review_id:reviewed.review_id,task_digest:reviewed.task_digest};
 const job=(await post('/launch',launchBody)).body;
 assert.equal((await post('/launch',launchBody)).body.id,job.id);
 const second=(await post('/review',{task:task('console_cancel')})).body;
 assert.equal((await post('/launch',{review_id:second.review_id,task_digest:second.task_digest})).body.error,'CAPACITY_FULL');
 let state=await until(s=>!s.active);assert.equal(state.jobs[0].status,'succeeded',JSON.stringify(state));assert.equal(state.jobs[0].result.verified,true);assert.equal(state.jobs[0].fixture_provider_calls,1);assert.match(state.jobs[0].result.output,/Fixture response/);results.push('review binding, duplicate launch, one active task, verified native completion');
 await app.close();app=await startNativeConsole(config);assert.equal(app.snapshot().jobs[0].status,'succeeded');assert.equal((await post('/launch',launchBody)).body.id,job.id);assert.equal(app.snapshot().fixture_budget_remaining,1);results.push('offline verified history and consumed budget preserved after restart');
 const cancelReview=(await post('/review',{task:task('console_cancel')})).body;
 const cancelled=(await post('/launch',{review_id:cancelReview.review_id,task_digest:cancelReview.task_digest})).body;
 await until(s=>s.jobs[1].status==='running');await new Promise(ok=>setTimeout(ok,1500));
 assert.equal((await post(`/${cancelled.id}/cancel`,{})).status,200);
 state=await until(s=>!s.active);assert.equal(state.jobs[1].status,'cancelled',JSON.stringify(state));assert.equal(state.jobs[1].result,null);
 const third=(await post('/review',{task:task('console_exhausted')})).body;
 assert.equal((await post('/launch',{review_id:third.review_id,task_digest:third.task_digest})).body.error,'FIXTURE_BUDGET_EXHAUSTED');results.push('operator cancellation has no accepted result; lifetime budget exhausted');
 await app.close();app=null;
 const saved=JSON.parse(readFileSync(resolve(config.state,'tasks.json')));saved.jobs[1].status='running';writeFileSync(resolve(config.state,'tasks.json'),JSON.stringify(saved));
 app=await startNativeConsole(config);assert.equal(app.snapshot().jobs[1].status,'uncertain');assert.ok(app.snapshot().blocked_reason);assert.equal(app.snapshot().fixture_budget_remaining,0);results.push('interrupted work blocks automatic replay or new dispatch');
 console.log(JSON.stringify({status:'PASS',checks:results,external_model_calls:0,open_questions_ref:'../NATIVE-CONSOLE-PLAN.md#open-questions'},null,2));
}finally{await app?.close();rmSync(root,{recursive:true,force:true});}
