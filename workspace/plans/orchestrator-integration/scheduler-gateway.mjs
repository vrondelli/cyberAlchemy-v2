// Optional loopback main-owner connection. Open questions: T6C3-INTEGRATION.md.
import assert from 'node:assert/strict';
import {projectOrchestratorRuns} from '../../runtime/src/features/runs/run-adapters.ts';
export function schedulerGateway(config){
 if(!config)return null;
 assert.deepEqual(Object.keys(config).sort(),['controls_enabled','origin','public_origin','runtime_id']);
 const url=new URL(config.origin);assert.equal(url.origin,config.origin);assert.equal(url.protocol,'http:');assert.equal(url.hostname,'127.0.0.1');
 assert.match(config.runtime_id,/^[A-Za-z0-9_-]{1,80}$/);assert.equal(typeof config.controls_enabled,'boolean');
 const publicUrl=new URL(config.public_origin);assert.equal(publicUrl.origin,config.public_origin);assert.equal(publicUrl.protocol,'https:');
 let last=null;
 async function observe(){
  try{
   const response=await fetch(config.origin+'/api/v1/state',{signal:AbortSignal.timeout(5000),redirect:'error',cache:'no-store'});assert.equal(response.status,200);
   const raw=await response.json(),now=Date.now();
   const projection=projectOrchestratorRuns(raw,{runtimeId:config.runtime_id,label:'Shared orchestrator',location:'local',observedAtMs:now,nowMs:now,maxAgeMs:10000,available:true});
   for(const run of projection.runs){
    const control=raw.runs.find(r=>r.run_key===run.runRef.runKey)?.native_execution;
    if(config.controls_enabled&&control){run.actions=[...(control.cancel_allowed===true?['cancel']:[]),...(control.reconcile_allowed===true?['reconcile-stop']:[])];}
   }
   last=projection;return {projection,controls:{runtimeId:config.runtime_id,available:true,enabled:config.controls_enabled},errors:[]};
  }catch{
   const source={runtimeId:config.runtime_id,label:'Shared orchestrator',location:'local',freshness:'offline',observedAtMs:0,revision:null};
   return {projection:last?{...last,sources:[source],runs:last.runs.map(r=>({...r,source:{...r.source,freshness:'offline'},actions:[],attention:[...new Set([...r.attention,'source-offline'])]}))}:{schemaVersion:'workspace-run-projection/v1-candidate',authorityEffect:'none',sources:[source],runs:[]},controls:{runtimeId:config.runtime_id,available:false,enabled:config.controls_enabled},errors:['Shared orchestrator unavailable. Previous observations are retained.']};
  }
 }
 async function forward(req,origin,path){
  const fail=(message,status=409)=>{throw Object.assign(Error(message),{status});};
  if(!config.controls_enabled)fail('CONTROLS_DISABLED',405);
  if(req.headers.origin!==origin||req.headers['x-workspace-intent']!=='scheduler-run'||req.headers['content-type']?.split(';')[0]!=='application/json')fail('CONTROL_HEADERS_REJECTED',403);
  const prefix='/api/v1/workspace/runtimes/'+encodeURIComponent(config.runtime_id)+'/scheduler-runs/';
  if(!path.startsWith(prefix))fail('RUNTIME_NOT_SELECTED',404);
  const match=path.slice(prefix.length).match(/^([a-f0-9]{64})\/(cancel|reconcile-stop)$/);if(!match)fail('CONTROL_NOT_SUPPORTED',404);
  let length=0,chunks=[];for await(const chunk of req){length+=chunk.length;if(length>1024)fail('BODY_TOO_LARGE',413);chunks.push(chunk);}
  let body;try{body=JSON.parse(Buffer.concat(chunks));}catch{fail('INVALID_JSON',400);}
  if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).length)fail('INVALID_FIELDS',400);
  const observation=await observe();if(!observation.controls.available)fail('RUNTIME_UNAVAILABLE',503);
  const run=observation.projection.runs.find(r=>r.runRef.runKey===match[1]);if(!run?.actions.includes(match[2]))fail('ACTION_NOT_AVAILABLE');
  try{
   const response=await fetch(config.origin+'/api/v1/runs/'+match[1]+'/'+match[2],{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Origin:config.public_origin,'Content-Type':'application/json','X-Orchestrator-Intent':match[2]==='cancel'?'cancel-native-run':'reconcile-native-stop'},body:'{}'});
   const value=await response.json();return {status:response.status,value};
  }catch{fail('CONTROL_DELIVERY_UNCERTAIN_CHECK_RUNS',502);}
 }
 return {observe,forward,runtimeId:config.runtime_id};
}
