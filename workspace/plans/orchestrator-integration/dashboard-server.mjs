import {schedulerGateway} from './scheduler-gateway.mjs';
import {recordedNativeStrategy} from './native-strategy.mjs';
import {projectRunStrategy} from '../../runtime/src/features/runs/run-strategy.ts';
import {nativeCapabilities,offlineCapabilities,forwardNativeControl} from './native-controls.mjs';
// Workspace observations and explicit native control gateway. Open questions: PLAN.md#open-questions.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,readdirSync,lstatSync,cpSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {projectNativeRuns,combineRunProjections} from '../../runtime/src/features/runs/run-adapters.ts';
const exec=promisify(execFile),sha=value=>createHash('sha256').update(value).digest('hex');
function fingerprint(root){return sha(JSON.stringify(readdirSync(root).sort().map(name=>{const p=join(root,name),s=lstatSync(p);assert.ok(!s.isSymbolicLink(),'HISTORY_SYMLINK');return [name,s.isDirectory()?fingerprint(p):sha(readFileSync(p))];})));}
export async function startDashboard(config){
 assert.equal(config.schema_version,'workspace-dashboard-config/v1');
 for(const name of ['console_config','driver','static_root'])assert.equal(resolve(config[name]),config[name]);
 assert.match(config.runtime_id,/^[A-Za-z0-9_-]{1,80}$/);assert.ok(Number.isInteger(config.port)&&config.port>=0&&config.port<=65535);
 const native=JSON.parse(readFileSync(config.console_config));assert.equal(native.mode,'native-fixture');assert.ok(Number.isInteger(native.port)&&native.port>0&&native.port<=65535);
 assert.ok(config.controls_enabled===undefined||typeof config.controls_enabled==='boolean');
 const controlsEnabled=config.controls_enabled===true;
 const scheduler=schedulerGateway(config.scheduler);if(scheduler)assert.notEqual(scheduler.runtimeId,config.runtime_id);
 const driverHash=sha(readFileSync(config.driver)),cache=new Map();let last=null,inflight=null,closing=false;
 async function observe(){
  try{
   assert.equal(sha(readFileSync(config.driver)),driverHash,'DRIVER_CHANGED');
   const response=await fetch(`http://127.0.0.1:${native.port}/api/v1/native-tasks`,{signal:AbortSignal.timeout(4000),redirect:'error',cache:'no-store'});assert.equal(response.status,200,'NATIVE_UNAVAILABLE');
   const raw=await response.json(),owners=new Map();assert.ok(Array.isArray(raw.jobs)&&raw.jobs.length<=10);
   for(const job of raw.jobs){
    if(job.status!=='succeeded')continue;assert.match(job.id,/^[a-f0-9-]{36}$/);
    const original=resolve(native.state,job.id,'orchestrator'),binding=resolve(native.state,job.id,'binding.json');
    const before=fingerprint(original),bindingHash=sha(readFileSync(binding)),key=sha(JSON.stringify([before,bindingHash,job.result]));
    if(cache.get(job.id)?.key===key){owners.set(job.id,cache.get(job.id).owner);continue;}
    const tmp=mkdtempSync('/tmp/wsr-');
    try{
     cpSync(original,resolve(tmp,'orchestrator'),{recursive:true});cpSync(binding,resolve(tmp,'binding.json'));
     const {stdout}=await exec(config.driver,[resolve(tmp,'orchestrator'),resolve(tmp,'binding.json'),resolve(tmp,'unused.sock'),resolve(tmp,'unused.token'),'replay'],{timeout:15000,maxBuffer:1048576});
     assert.equal(fingerprint(original),before,'HISTORY_CHANGED_DURING_COPY');assert.equal(sha(readFileSync(binding)),bindingHash,'BINDING_CHANGED_DURING_COPY');
     const owner=JSON.parse(stdout);owners.set(job.id,owner);cache.set(job.id,{key,owner});
    }finally{rmSync(tmp,{recursive:true,force:true});}
   }
   const now=Date.now(),projection=await projectNativeRuns(raw,{runtimeId:config.runtime_id,label:'Local native console',location:'local',observedAtMs:now,nowMs:now,maxAgeMs:10000,available:true},owners);
   for(const run of projection.runs){const job=raw.jobs.find(job=>job.id===run.launchId);run.strategy=projectRunStrategy(recordedNativeStrategy(native.state,job));}
   const controls=nativeCapabilities(raw,config.runtime_id,controlsEnabled);
   for(const run of projection.runs)run.actions=controls.cancelLaunchIds.includes(run.launchId)?['cancel']:[];
   last=projection;return {schema_version:'workspace-dashboard-response/v1',projection,controls,errors:[]};
  }catch(error){
   const source={runtimeId:config.runtime_id,label:'Local native console',location:'local',observedAtMs:0,revision:null,freshness:'offline'};
   const projection=last?{...last,sources:last.sources.map(s=>({...s,freshness:'offline'})),runs:last.runs.map(r=>({...r,actions:[],source:{...r.source,freshness:'offline'},attention:[...new Set([...r.attention,'source-offline'])]}))}:{schemaVersion:'workspace-run-projection/v1-candidate',authorityEffect:'none',sources:[source],runs:[]};
   return {schema_version:'workspace-dashboard-response/v1',projection,controls:offlineCapabilities(config.runtime_id,controlsEnabled),errors:['Native runtime unavailable or its history could not be verified. Previous observations are retained.']};
  }
 }
 async function observeAll(){
  const [nativeView,schedulerView]=await Promise.all([observe(),scheduler?.observe()]);
  if(!schedulerView)return nativeView;
  return {...nativeView,projection:combineRunProjections([nativeView.projection,schedulerView.projection]),controls:{...nativeView.controls,scheduler:schedulerView.controls},errors:[...nativeView.errors,...schedulerView.errors]};
 }
 async function load(){if(!inflight)inflight=observeAll().finally(()=>{inflight=null;});return inflight;}
 let origin;const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'};
 const server=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'none'");
  const json=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  try{
   if(req.headers.host!==new URL(origin).host){json(403,{error:'HOST_REJECTED'});return;}
   const path=new URL(req.url,origin).pathname;
   if(req.method==='POST'&&path.startsWith('/api/v1/workspace/runtimes/')){
    try{const result=scheduler&&path.includes("/scheduler-runs/")?await scheduler.forward(req,origin,path):await forwardNativeControl({req,origin,path,runtimeId:config.runtime_id,nativeOrigin:`http://127.0.0.1:${native.port}`,observation:load,enabled:controlsEnabled});if(inflight)await inflight;json(result.status,result.value);}
    catch(error){json(error.status??500,{error:error.status?error.message:'CONTROL_FAILED'});}
    return;
   }
   if(req.method!=='GET'){json(405,{error:'METHOD_NOT_ALLOWED'});return;}
   if(path==='/api/v1/workspace/runs'){json(200,await load());return;}
   if(path==='/healthz'){json(200,{status:'ready',mode:controlsEnabled?'workspace-native-controls':'workspace-read-only'});return;}
   if(path.startsWith('/api/')){json(404,{error:'NOT_FOUND'});return;}
   const file=path==='/'?resolve(config.static_root,'index.html'):resolve(config.static_root,'.'+decodeURIComponent(path));
   if(!file.startsWith(config.static_root+'/')||!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink()){json(404,{error:'NOT_FOUND'});return;}
   res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});res.end(readFileSync(file));
  }catch{if(!res.headersSent)json(404,{error:'NOT_FOUND'});else res.destroy();}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;
 await new Promise((ok,no)=>{server.once('error',no);server.listen(config.port,'127.0.0.1',ok);});origin=`http://127.0.0.1:${server.address().port}`;
 return {origin,close:async()=>{if(closing)return;closing=true;server.closeAllConnections();await new Promise(ok=>server.close(ok));await inflight;}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{assert.equal(process.argv.length,3,'Usage: node dashboard-server.mjs CONFIG');const app=await startDashboard(JSON.parse(readFileSync(process.argv[2])));console.log(JSON.stringify({status:'ready',url:app.origin+'/#/dashboard'}));process.once('SIGTERM',()=>void app.close());process.once('SIGINT',()=>void app.close());}catch(error){console.error(error.message);process.exitCode=1;}
}
