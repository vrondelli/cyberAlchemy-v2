// Isolated HTTP host double for gateway/browser validation. Open questions: T6C3-INTEGRATION.md.
import {createServer} from 'node:http';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {startDashboard} from './dashboard-server.mjs';
export async function createSchedulerFixture(staticRoot){
 const directory=mkdtempSync('/tmp/t6c3-web-'),key='a'.repeat(64),calls=[];
 let online=true;
 const run={run_key:key,title:'Shared native recovery check',status:'active',phase:'execute',work_kind:'are-native-fixture',lifecycle:{execution:'in_progress',acceptance:'pending',promotion:'pending'},automation:{paused:false},graph:{completed:0,running:1,pending:0,blocked:0,total:1},result:{status:'pending'},native_execution:{phase:'running',mode:'fixture',cancel_allowed:true,reconcile_allowed:false,capacity_held:true}};
 const owner=createServer(async(req,res)=>{
  const send=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
  if(req.url==='/api/v1/native-tasks'){send({schema_version:'are-native-console-state/v1',mode:'native-fixture',external_model_calls:0,fixture_budget_remaining:5,active:false,jobs:[]});return;}
  if(!online){res.statusCode=503;send({error:'offline'});return;}
  if(req.method==='GET'&&req.url==='/api/v1/state'){send({schema_version:'cav2-orchestrator-current-state/v1-candidate',projection_revision:1,source_mode:'live-vps-candidate',runs:[run]});return;}
  let bytes='';for await(const part of req)bytes+=part;calls.push({path:req.url,origin:req.headers.origin,intent:req.headers['x-orchestrator-intent'],body:JSON.parse(bytes)});
  if(req.url.endsWith('/cancel')){run.status='blocked';run.native_execution={phase:'needs_attention',mode:'fixture',cancel_allowed:false,reconcile_allowed:true,capacity_held:true};send({result:'cancellation_requested'});}
  else if(req.url.endsWith('/reconcile-stop')){run.native_execution.reconcile_allowed=false;run.native_execution.capacity_held=false;send({result:'stop_confirmed'});}
  else {res.statusCode=404;send({error:'not-found'});}
 });
 await new Promise(resolve=>owner.listen(0,'127.0.0.1',resolve));
 const port=owner.address().port;
 writeFileSync(join(directory,'console.json'),JSON.stringify({mode:'native-fixture',port,state:directory}));
 writeFileSync(join(directory,'driver'),'isolated-unused-driver');writeFileSync(join(directory,'index.html'),'fixture');
 const app=await startDashboard({schema_version:'workspace-dashboard-config/v1',console_config:join(directory,'console.json'),driver:join(directory,'driver'),static_root:staticRoot??directory,runtime_id:'fixture-console',port:0,controls_enabled:false,scheduler:{runtime_id:'shared-main',origin:`http://127.0.0.1:${port}`,public_origin:'https://fixture.example',controls_enabled:true}});
 return {app,key,calls,run,setOnline:value=>{online=value;},close:async()=>{await app.close();owner.closeAllConnections();await new Promise(resolve=>owner.close(resolve));rmSync(directory,{recursive:true,force:true});}};
}
