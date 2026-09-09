import {readSourceContext} from '../../runtime/src/features/runs/source-context.ts';
// Gateway to the existing owner; never writes a run journal. Open questions: PLAN.md.
export function nativeCapabilities(raw,runtimeId,enabled) {
 if(raw.mode!=='native-fixture'||!Number.isInteger(raw.fixture_budget_remaining)||raw.fixture_budget_remaining<0||typeof raw.active!=='boolean'||!Array.isArray(raw.jobs))throw Error('INVALID_NATIVE_CAPABILITIES');
 const ready=enabled&&!raw.active&&!raw.blocked_reason&&raw.fixture_budget_remaining>0;
 return {schema_version:'workspace-native-controls/v1',runtimeId,available:true,enabled,mode:raw.mode,remaining:raw.fixture_budget_remaining,active:raw.active,blockedReason:raw.blocked_reason??null,canReview:ready,canLaunch:ready,
  cancelLaunchIds:enabled?raw.jobs.filter(job=>['preparing','running','cancelling'].includes(job.status)).map(job=>job.id):[],
  state:{mode:raw.mode,fixture_budget_remaining:raw.fixture_budget_remaining,active:raw.active,blocked_reason:raw.blocked_reason??null,jobs:raw.jobs}};
}
export function offlineCapabilities(runtimeId,enabled) {
 return {schema_version:'workspace-native-controls/v1',runtimeId,available:false,enabled,mode:'native-fixture',remaining:null,active:false,blockedReason:'Native runtime unavailable or history unverified',canReview:false,canLaunch:false,cancelLaunchIds:[],state:null};
}
function fail(error,status=409){throw Object.assign(Error(error),{status});}
function keys(value,expected){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join()!==expected.sort().join())fail('INVALID_FIELDS',400);}
export async function forwardNativeControl({req,origin,path,runtimeId,nativeOrigin,observation,enabled}) {
 if(!enabled)fail('CONTROLS_DISABLED',405);
 if(req.headers.origin!==origin||req.headers['x-workspace-intent']!=='native-task'||req.headers['content-type']?.split(';')[0]!=='application/json')fail('CONTROL_HEADERS_REJECTED',403);
 const prefix='/api/v1/workspace/runtimes/'+encodeURIComponent(runtimeId)+'/native-tasks';
 if(!path.startsWith(prefix+'/'))fail('RUNTIME_NOT_SELECTED',404);
 const suffix=path.slice(prefix.length),cancel=suffix.match(/^\/([a-f0-9-]{36})\/cancel$/);
 if(!['/review','/launch'].includes(suffix)&&!cancel)fail('CONTROL_NOT_SUPPORTED',404);
 let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16384)fail('BODY_TOO_LARGE',413);chunks.push(chunk);}
 let body;try{body=JSON.parse(Buffer.concat(chunks));}catch{fail('INVALID_JSON',400);}
 keys(body,suffix==='/review'?['task']:suffix==='/launch'?['review_id','task_digest']:[]);
 if(suffix==='/review'){try{await readSourceContext(body.task?.input);}catch(error){fail(error.message,400);}}
 const view=await observation(),cap=view.controls;
 if(!cap?.available)fail('RUNTIME_UNAVAILABLE',503);
 if(suffix==='/review'&&!cap.canReview)fail('RUNTIME_NOT_READY');
 if(suffix==='/launch'){
  // The owning console retains review idempotency across retries and restarts.
  const prior=cap.state.jobs.find(job=>job.review_id===body.review_id);
  if(!prior&&!cap.canLaunch)fail('RUNTIME_NOT_READY');
 }
 if(cancel&&!cap.cancelLaunchIds.includes(cancel[1]))fail('ACTION_NOT_AVAILABLE');
 let response;
 try{response=await fetch(nativeOrigin+'/api/v1/native-tasks'+suffix,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Origin:nativeOrigin,'Content-Type':'application/json','X-Orchestrator-Intent':'native-task'},body:JSON.stringify(body)});}
 catch{fail('CONTROL_DELIVERY_UNCERTAIN_CHECK_RUNS',502);}
 let value;try{value=await response.json();}catch{fail('CONTROL_DELIVERY_UNCERTAIN_CHECK_RUNS',502);}
 return {status:response.status,value};
}
