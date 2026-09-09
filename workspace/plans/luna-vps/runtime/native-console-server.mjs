// Local console adapter for the existing native Rust executor.
// Open questions: ../NATIVE-CONSOLE-PLAN.md#open-questions
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash, randomUUID} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, fsyncSync, existsSync, lstatSync} from 'node:fs';
import {resolve, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileTask} from './task-contract.mjs';
import {startPilotHost} from './pilot-host.mjs';
import {startOrchestratorNativeHost} from './orchestrator-native-host.mjs';
const here=dirname(fileURLToPath(import.meta.url)), exec=promisify(execFile);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const activeStates=new Set(['preparing','running','cancelling']);
function fail(code,status=409){throw Object.assign(new Error(code),{status});}
function keys(value,allowed){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join()!==[...allowed].sort().join())fail('INVALID_FIELDS',400);}
function privateDirectory(path){mkdirSync(path,{recursive:true,mode:0o700});const s=lstatSync(path);assert.ok(s.isDirectory()&&!s.isSymbolicLink()&&!(s.mode&0o077)&&s.uid===process.getuid(),'PRIVATE_DIRECTORY_REQUIRED');}
function durable(path,value){const temp=path+'.'+randomUUID()+'.tmp';const fd=openSync(temp,'wx',0o600);try{writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}renameSync(temp,path);const dir=openSync(dirname(path),'r');try{fsyncSync(dir);}finally{closeSync(dir);}}
async function acquireLock(path){
 const child=spawn('/usr/bin/flock',['--nonblock',path,'/bin/sh','-c','printf locked; cat >/dev/null'],{stdio:['pipe','pipe','pipe']});
 await new Promise((ok,no)=>{child.once('error',no);child.once('exit',()=>no(new Error('CONSOLE_STATE_ALREADY_LOCKED')));child.stdout.once('data',b=>b.toString()==='locked'?ok():no(new Error('LOCK_PROTOCOL')));});
 return async()=>{child.stdin.end();if(child.exitCode===null)await new Promise(ok=>child.once('exit',ok));};
}
function fixtureServer(){
 let calls=0;const timers=new Set();
 const server=createServer(async(req,res)=>{
  try {
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1024*1024)throw Error('FIXTURE_INPUT_TOO_LARGE');chunks.push(chunk);}
   const body=JSON.parse(Buffer.concat(chunks));assert.equal(body.model,'gpt-5.6-luna');assert.equal(body.max_output_tokens,512);assert.deepEqual(body.tools,[]);assert.ok(JSON.stringify(body.input).includes('CA2-ROUTE-UNDERSTAND'));assert.equal(calls,0);calls++;
   const timer=setTimeout(()=>{timers.delete(timer);if(res.destroyed)return;
    const reply='Fixture response: the task passed through the orchestrator, ARE and native Codex transport. No model generated this answer.';
    const id='response_fixture',itemId='message_fixture',item={id:itemId,type:'message',status:'completed',role:'assistant',content:[{type:'output_text',text:reply,annotations:[]}]};
    const events=[{type:'response.created',response:{id,object:'response',status:'in_progress',output:[]}},
     {type:'response.output_item.added',output_index:0,item:{...item,status:'in_progress',content:[]}},
     {type:'response.content_part.added',item_id:itemId,output_index:0,content_index:0,part:{type:'output_text',text:'',annotations:[]}},
     {type:'response.output_text.delta',item_id:itemId,output_index:0,content_index:0,delta:reply},
     {type:'response.output_item.done',output_index:0,item},
     {type:'response.completed',response:{id,object:'response',status:'completed',output:[item],usage:{input_tokens:20,output_tokens:24,total_tokens:44}}}];
    res.writeHead(200,{'Content-Type':'text/event-stream'});res.end(events.map(e=>`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join(''));
   },6500);timers.add(timer);
  }catch{res.writeHead(400);res.end('Fixture contract rejected');}
 });
 return {server,calls:()=>calls,close:async()=>{for(const timer of timers)clearTimeout(timer);server.closeAllConnections();await new Promise(ok=>server.close(ok));}};
}
export async function startNativeConsole(input){
 keys(input,['schema_version','mode','candidate','driver','state','runtime','static_root','port','max_tasks']);
 assert.equal(input.schema_version,'are-native-console-config/v1');assert.equal(input.mode,'native-fixture');
 for(const key of ['candidate','driver','state','runtime','static_root'])assert.equal(resolve(input[key]),input[key]);
 assert.ok(Number.isInteger(input.port)&&input.port>=0&&input.port<=65535);assert.ok(Number.isInteger(input.max_tasks)&&input.max_tasks>=1&&input.max_tasks<=10);
 const config={...input};privateDirectory(config.state);privateDirectory(config.runtime);
 assert.ok(Buffer.byteLength(resolve(config.runtime,'x'.repeat(36),'orchestrator.sock'))<104,'SOCKET_PATH_TOO_LONG');
 const unlock=await acquireLock(resolve(config.state,'console.lock'));
 let server,closing=false,active=null,host=null;
 try {
 const bindings={candidate_digest:'sha256:'+sha(readFileSync(resolve(config.candidate,'MANIFEST.json'))),profile_digest:'sha256:'+sha(readFileSync(resolve(config.candidate,'pilot-profile.json'))),driver_digest:sha(readFileSync(config.driver)),host_digest:sha(readFileSync(resolve(here,'orchestrator-native-host.mjs'))),callback_digest:sha(readFileSync(resolve(here,'host-callback.mjs')))};
 const storePath=resolve(config.state,'tasks.json');
 let store=existsSync(storePath)?JSON.parse(readFileSync(storePath,'utf8')):{schema_version:'are-native-console-state/v1',bindings,max_tasks:config.max_tasks,jobs:[]};
 assert.equal(store.schema_version,'are-native-console-state/v1');assert.deepEqual(store.bindings,bindings,'CONSOLE_BINDING_CHANGED');assert.equal(store.max_tasks,config.max_tasks,'CONSOLE_BUDGET_CHANGED');assert.ok(Array.isArray(store.jobs)&&store.jobs.length<=store.max_tasks);
 const jobRoot=job=>resolve(config.state,job.id), runtimeRoot=job=>resolve(config.runtime,job.id);
 const driverArgs=(job,mode)=>[resolve(jobRoot(job),'orchestrator'),resolve(jobRoot(job),'binding.json'),resolve(runtimeRoot(job),'orchestrator.sock'),resolve(runtimeRoot(job),'orchestrator-token'),mode];
 const persist=()=>durable(storePath,store);
 const ids=new Set(),taskIds=new Set();
 for(const job of store.jobs){
  assert.match(job.id,/^[a-f0-9-]{36}$/);assert.ok(!ids.has(job.id)&&!taskIds.has(job.task.task_id));ids.add(job.id);taskIds.add(job.task.task_id);assert.equal(compileTask(job.task).digest,job.task_digest);
  assert.ok(['preparing','running','cancelling','succeeded','cancelled','uncertain'].includes(job.status));
  if(activeStates.has(job.status)){job.status='uncertain';job.error='PROCESS_INTERRUPTED_REQUIRES_RECONCILIATION';}
  if(job.status==='succeeded'){
   try{const replay=JSON.parse((await exec(config.driver,driverArgs(job,'replay'),{timeout:10000,maxBuffer:1024*1024})).stdout);assert.equal(replay.replayed,true);assert.deepEqual(replay.result,job.result);assert.equal(replay.result.task_digest,job.task_digest);assert.equal(replay.result.request_id,job.task.task_id);}catch{job.status='uncertain';job.result=null;job.error='HISTORY_VERIFICATION_FAILED';}
  }
 }
 persist();
 const reviews=new Map();
 function snapshot(){const uncertain=store.jobs.some(j=>j.status==='uncertain');return {schema_version:'are-native-console-state/v1',mode:config.mode,external_model_calls:0,fixture_budget_remaining:config.max_tasks-store.jobs.length,capacity:1,active:!!active,blocked_reason:uncertain?'An interrupted or unverified task needs reconciliation. Automatic retry is disabled.':null,bindings,jobs:store.jobs};}
 function validateCurrentBinding(){assert.equal(sha(readFileSync(config.driver)),bindings.driver_digest,'DRIVER_CHANGED');assert.equal('sha256:'+sha(readFileSync(resolve(config.candidate,'MANIFEST.json'))),bindings.candidate_digest,'CANDIDATE_CHANGED');assert.equal(sha(readFileSync(resolve(here,'host-callback.mjs'))),bindings.callback_digest,'CALLBACK_CHANGED');assert.equal('sha256:'+sha(readFileSync(resolve(config.candidate,'pilot-profile.json'))),bindings.profile_digest,'PROFILE_CHANGED');}
 async function execute(job){
  const fixture=fixtureServer();let prepared;
  try {
   validateCurrentBinding();privateDirectory(jobRoot(job));privateDirectory(runtimeRoot(job));privateDirectory(resolve(jobRoot(job),'orchestrator'));
   await new Promise(ok=>fixture.server.listen(0,'127.0.0.1',ok));
   const task=compileTask(job.task),hostConfig={candidate:config.candidate,state:resolve(jobRoot(job),'host'),runtime:runtimeRoot(job),callback_file:resolve(here,'host-callback.mjs'),callback_sha256:bindings.callback_digest,manifest_sha256:bindings.candidate_digest.slice(7),task:task.task,mode:'fixture',fixture_url:`http://127.0.0.1:${fixture.server.address().port}/responses`};
   prepared=await startPilotHost(hostConfig,{prepare:true,taskContract:task});await prepared.close();prepared=null;
   if(job.status==='cancelling'||closing){job.status='cancelled';return;}
   host=await startOrchestratorNativeHost(hostConfig);
   const binding={execution_mode:'native-fixture',candidate_digest:host.candidateDigest,profile_digest:host.profileDigest,task:task.task};
   durable(resolve(jobRoot(job),'binding.json'),binding);
   if(job.status==='cancelling'||closing){job.status='cancelled';return;}
   job.status='running';persist();
   const result=JSON.parse((await exec(config.driver,driverArgs(job,'run'),{timeout:80000,maxBuffer:1024*1024,killSignal:'SIGKILL'})).stdout);
   if(result.status==='PASS_CANCELLED'){job.status='cancelled';}
   else {assert.equal(result.status,'PASS');assert.equal(result.result.verified,true);assert.equal(result.result.task_digest,job.task_digest);assert.equal(result.result.request_id,job.task.task_id);job.status='succeeded';job.result=result.result;}
  } catch(error){job.status='uncertain';job.error=String(error.message).slice(0,500);}
  finally {
   try{await prepared?.close();await host?.close();}catch{job.status='uncertain';job.error='HOST_CLOSE_FAILED';}
   host=null;await fixture.close();job.fixture_provider_calls=fixture.calls();job.completed_at=new Date().toISOString();persist();active=null;
  }
 }
 function cancel(job){
  if(!activeStates.has(job.status))return job;
  job.status='cancelling';persist();const state=resolve(jobRoot(job),'orchestrator');privateDirectory(state);durable(resolve(state,'cancel.request'),{requested_at:new Date().toISOString()});return job;
 }
 function review(taskInput){
  let task;try{task=compileTask(taskInput);}catch{fail('TASK_INVALID',400);}if(task.task.objective_kind!=='understand')fail('UNDERSTAND_OBJECTIVE_REQUIRED',400);
  for(const [id,r] of reviews)if(r.expires_at<=Date.now())reviews.delete(id);
  if(reviews.size>=100)fail('TOO_MANY_REVIEWS',429);
  const value={review_id:randomUUID(),task:task.task,task_digest:task.digest,bindings,expires_at:Date.now()+300000,mode:config.mode,budget:{fixture_provider_calls:1,external_model_calls:0,max_output_tokens:512,tools_enabled:false},route:'CA2-ROUTE-UNDERSTAND'};
  reviews.set(value.review_id,value);return value;
 }
 function launch(body){
  keys(body,['review_id','task_digest']);const reviewed=reviews.get(body.review_id);
  const prior=store.jobs.find(j=>j.review_id===body.review_id);
  if(prior){if(prior.task_digest!==body.task_digest)fail('REVIEW_DIGEST_MISMATCH');return prior;}
  if(!reviewed||reviewed.expires_at<=Date.now())fail('REVIEW_EXPIRED');if(reviewed.task_digest!==body.task_digest)fail('REVIEW_DIGEST_MISMATCH');
  const duplicate=store.jobs.find(j=>j.task.task_id===reviewed.task.task_id);if(duplicate){if(duplicate.task_digest!==reviewed.task_digest)fail('TASK_ID_ALREADY_USED');return duplicate;}
  if(closing)fail('CONSOLE_STOPPING');if(active)fail('CAPACITY_FULL');if(store.jobs.some(j=>j.status==='uncertain'))fail('RECONCILIATION_REQUIRED');if(store.jobs.length>=config.max_tasks)fail('FIXTURE_BUDGET_EXHAUSTED');
  validateCurrentBinding();
  const job={id:randomUUID(),review_id:reviewed.review_id,task:reviewed.task,task_digest:reviewed.task_digest,status:'preparing',created_at:new Date().toISOString(),result:null,error:null,fixture_provider_calls:0};
  store.jobs.push(job);persist();active=Promise.resolve().then(()=>execute(job));return job;
 }
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
 let origin;
 server=createServer(async(req,res)=>{
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  try {
   if(req.headers.host!==new URL(origin).host)fail('HOST_REJECTED',403);
   const path=new URL(req.url,origin).pathname;
   if(req.method==='GET'&&path==='/api/v1/native-tasks'){send(200,snapshot());return;}
   if(req.method==='GET'&&path==='/'){res.writeHead(302,{Location:'/native'});res.end();return;}
   if(req.method==='GET'&&path==='/healthz'){send(200,{status:closing?'stopping':'ready',mode:config.mode});return;}
   if(req.method==='POST'){
    if(req.headers.origin!==origin||req.headers['x-orchestrator-intent']!=='native-task'||req.headers['content-type']?.split(';')[0]!=='application/json')fail('CONTROL_HEADERS_REJECTED',403);
    let length=0;const chunks=[];for await(const c of req){length+=c.length;if(length>16384)fail('BODY_TOO_LARGE',413);chunks.push(c);}let body;try{body=JSON.parse(Buffer.concat(chunks));}catch{fail('INVALID_JSON',400);}
    if(path==='/api/v1/native-tasks/review'){keys(body,['task']);send(200,review(body.task));return;}
    if(path==='/api/v1/native-tasks/launch'){send(202,launch(body));return;}
    const match=path.match(/^\/api\/v1\/native-tasks\/([a-f0-9-]{36})\/cancel$/);
    if(match){keys(body,[]);const job=store.jobs.find(j=>j.id===match[1]);if(!job)fail('TASK_NOT_FOUND',404);send(200,cancel(job));return;}
    fail('ROUTE_NOT_FOUND',404);
   }
   if(req.method!=='GET')fail('METHOD_NOT_ALLOWED',405);
   if(path.startsWith('/api/'))fail('ROUTE_NOT_FOUND',404);
   const file=path==='/'||path==='/native'?resolve(config.static_root,'index.html'):resolve(config.static_root,'.'+decodeURIComponent(path));
   if(!file.startsWith(config.static_root+'/')||!existsSync(file)||!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink())fail('NOT_FOUND',404);
   res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});res.end(readFileSync(file));
  }catch(error){if(!res.headersSent)send(error.status??500,{error:error.status?error.message:'CONSOLE_OPERATION_FAILED'});else res.destroy();}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;
 await new Promise((ok,no)=>{server.once('error',no);server.listen(config.port,'127.0.0.1',ok);});origin=`http://127.0.0.1:${server.address().port}`;
 return {origin,snapshot,close:async()=>{closing=true;for(const job of store.jobs)if(activeStates.has(job.status))cancel(job);await active;server.closeAllConnections();await new Promise(ok=>server.close(ok));await unlock();}};
 }catch(error){server?.close();await unlock();throw error;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{assert.equal(process.argv.length,3,'Usage: node native-console-server.mjs CONFIG_JSON');const app=await startNativeConsole(JSON.parse(readFileSync(process.argv[2],'utf8')));console.log(JSON.stringify({status:'ready',url:app.origin+'/native',mode:'native-fixture'}));let stopped=false;const stop=async()=>{if(stopped)return;stopped=true;await app.close();};process.on('SIGINT',()=>void stop());process.on('SIGTERM',()=>void stop());}catch(error){console.error(error.message);process.exitCode=1;}
}
