import {createCampaign,readCampaign,appendEvent} from '../latency-comparison-012/campaign.mjs';
import {protocolBytes} from '../research-learning-owned/runtime/benchmark/analyze.mjs';
import {importArm,verifyArtifacts} from './import.mjs';
import {prepareHost} from '../latency-comparison-011/host.mjs';
import {probeSemantics,verifySemantics} from '../latency-comparison-005/semantics.mjs';
import {spawn,spawnSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,openSync,closeSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
import {processIdentity,verifyProcess,sha} from '../latency-comparison-004/process-identity.mjs';
import {collectBounded} from '../latency-comparison-010/collection.mjs';
const here=fileURLToPath(new URL('./',import.meta.url));
const repo=fileURLToPath(new URL('../../../../../',import.meta.url));
for(const f of JSON.parse(readFileSync(here+'bindings.json')))if(sha(readFileSync(repo+f.path))!==f.sha256)throw Error('host-binding-drift:'+f.path);
const registrationBytes=readFileSync(new URL('../latency-comparison-010/registration.json',import.meta.url));
const registration=JSON.parse(registrationBytes),registrationSha=sha(registrationBytes);
const name=process.argv[2];
if(!name||!/^campaign-[a-z0-9-]+$/.test(name)||process.argv.length!==3)throw Error('usage: run.mjs campaign-NAME');
const campaignDir=here+name;
const harnessSha=sha(readFileSync(here+'bindings.json'));
for(const f of registration.bindings)if(sha(readFileSync(repo+f.path))!==f.sha256)throw Error('registration-binding-drift:'+f.path);
for(const id of ['003','008'])if(spawnSync(process.execPath,[fileURLToPath(new URL('../latency-comparison-'+id+'/verify-native.mjs',import.meta.url))],{stdio:'inherit'}).status!==0)throw Error('native-inputs-invalid');
const bridge=repo+'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/client/desktop-bridge.mjs';
const mock=repo+'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/test/fixtures/mock-app-server.mjs';

const campaignIdentity={registration_sha256:registrationSha,protocol_sha256:sha(protocolBytes),arms:registration.arms,harness_sha256:harnessSha,bridge_sha256:sha(readFileSync(bridge)),mock_sha256:sha(readFileSync(mock))};
if(!existsSync(campaignDir))createCampaign(campaignDir,campaignIdentity);
const state=readCampaign(campaignDir);
if(JSON.stringify(state.identity)!==JSON.stringify(campaignIdentity))throw Error('campaign-identity-drift');
for(const event of state.events)if(event.type==='settle')verifyArtifacts(event.results);
const reservation=state.view.next;
if(!reservation)throw Error('campaign-not-runnable:'+state.view.status);
const order=reservation.pair%2?'AB':'BA';
const normalized=[];
const bind=async()=>{const s=createServer();await new Promise((ok,no)=>{s.once('error',no);s.listen(0,'127.0.0.1',ok);});const port=s.address().port;await new Promise(ok=>s.close(ok));return port;};
mkdirSync(here+'runs',{recursive:true});
const pairDir=mkdtempSync(here+'runs/pair-');
const members=[];
appendEvent(campaignDir,{type:'reserve',...reservation,artifact_directory:pairDir});
writeFileSync(pairDir+'/pair.json',JSON.stringify({status:'running',order,registration_sha256:registrationSha,authority_effect:'none'},null,2));
for(const arm of reservation.arms){
  const prior=fileURLToPath(new URL('../latency-comparison-'+(arm==='baseline'?'003':'008')+'/',import.meta.url));
  const dir=mkdtempSync(pairDir+'/'+arm+'-');
  const identity=JSON.parse(readFileSync(prior+'native/'+arm+'/identity.json'));
  if(identity.binary_sha256!==registration.arms[arm].binary_sha256||identity.build_id!==registration.arms[arm].build_id)throw Error('registered-identity-mismatch');
  const binary=prior+'native/'+arm+'/essays-desktop';
  const expected={...campaignIdentity,...identity,arm,pair:reservation.pair,harness_sha256:harnessSha,binary_path:binary};
  writeFileSync(dir+'/context.json',JSON.stringify({...expected,cold_process:true,fresh_storage:true,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
  const port=await bind();
  const env=Object.fromEntries(['PATH','HOME','DISPLAY','XAUTHORITY','XDG_RUNTIME_DIR','DBUS_SESSION_BUS_ADDRESS','LANG','LD_LIBRARY_PATH'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  for(const name of ['data','cache','config'])mkdirSync(dir+'/'+name);
  Object.assign(env,{XDG_DATA_HOME:dir+'/data',XDG_CACHE_HOME:dir+'/cache',XDG_CONFIG_HOME:dir+'/config',
    ESSAYS_DATABASE:dir+'/essays.sqlite',TAURI_WEBDRIVER_PORT:String(port),ARE_CODEX_NODE:process.execPath,
    ARE_CODEX_BRIDGE:bridge,ARE_CODEX_CWD:repo+'cyberAlchemy-v2',ARE_CODEX_RECEIPT_PATH:dir+'/are-events.jsonl',
    ARE_CODEX_ALLOW_PROTOCOL_DRIFT:'0',CODEX_BINARY:mock});
  const host=await prepareHost(value=>writeFileSync(dir+'/host.json',JSON.stringify(value,null,2)+'\n'));
  if(!host.prelaunch.qualified){normalized.push(importArm(dir,expected));writeFileSync(pairDir+'/pair.json',JSON.stringify({status:'host-rejected-prelaunch',arm,order,registration_sha256:registrationSha,members,reasons:host.prelaunch.reasons,host_evidence:dir+'/host.json',authority_effect:'none'},null,2));console.log('Host rejected before launch: '+dir);process.exitCode=2;break;}
  const monitor=host.start();
  let hostResult;
  const fd=openSync(dir+'/native.log','wx');
  const child=spawn(binary,[],{cwd:repo,env,detached:true,stdio:['ignore',fd,fd]});
  const exited=new Promise(resolve=>{child.once('exit',(code,signal)=>resolve({code,signal}));child.once('error',error=>resolve({error:error.message}));});
  let session,failed,receipt;
  const trace=[];
  const request=async(path,body,method=body===undefined?'GET':'POST',timeout=10000)=>{
    const event={path,method,started_ms:performance.now(),status:'running'};trace.push(event);
    writeFileSync(dir+'/trace.json',JSON.stringify(trace,null,2)+'\n');
    try{
    const response=await fetch(`http://127.0.0.1:${port}`+path,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(timeout)});
    const json=await response.json();if(!response.ok||json.value?.error)throw Error('webdriver:'+JSON.stringify(json));event.status='completed';event.duration_ms=performance.now()-event.started_ms;return json.value;
    }catch(e){event.status='failed';event.error=e.message;event.duration_ms=performance.now()-event.started_ms;throw e;}
    finally{writeFileSync(dir+'/trace.json',JSON.stringify(trace,null,2)+'\n');}
  };
  try{
    console.log('Probing '+arm+' pid='+child.pid+' artifacts='+dir);
    const before=processIdentity(child.pid);
    if(before.binary_sha256!==identity.binary_sha256||before.executable!==binary)throw Error('initial-process-identity');
    let ready=false;
    for(let i=0;i<100;i++){if(child.exitCode!==null||child.signalCode!==null)throw Error('native-exited');try{await request('/status');ready=true;break;}catch{}await delay(200);}
    if(!ready)throw Error('webdriver-not-ready');
    const created=await request('/session',{capabilities:{alwaysMatch:{browserName:'wry'}}});session=created.sessionId;
    if(!session)throw Error('session-id-missing');
    const browser={execute:async fn=>request('/session/'+session+'/execute/sync',{script:'return ('+fn.toString()+')()',args:[]})};
    const readiness=[];
    receipt=await collectBounded(request,session,{arm,build_id:identity.build_id,binary_sha256:identity.binary_sha256},{record:event=>{readiness.push(event);writeFileSync(dir+'/readiness.json',JSON.stringify(readiness,null,2)+'\n');}});
    const semantics=await probeSemantics(browser);
    writeFileSync(dir+'/semantics.json',JSON.stringify(semantics,null,2)+'\n');
    if(!verifySemantics(semantics))throw Error('native-semantics-invalid');
    const after=processIdentity(child.pid);
    if(!verifyProcess(before,after,{path:binary,sha256:identity.binary_sha256}))throw Error('process-identity-drift');
    writeFileSync(dir+'/receipt.json',JSON.stringify({schema_version:'workspace.native-overhead-capture/v1',registration_sha256:registrationSha,order,arm,before,after,receipt,
      backend:'local-mock-codex-not-live-model',bridge_sha256:sha(readFileSync(bridge)),mock_sha256:sha(readFileSync(mock)),
      host_qualification_ref:'host.json',performance_inference:'not_evaluable',authority_effect:'none'},null,2)+'\n');
  }catch(e){failed=e;writeFileSync(dir+'/failure.json',JSON.stringify({error:e.message,receipt:receipt??null,authority_effect:'none'},null,2)+'\n');}
  finally{
    hostResult=monitor.finish();
    if(session)try{await request('/session/'+session,undefined,'DELETE');}catch{}
    // This group was created by this runner. Never match or kill unrelated apps.
    if(child.pid){try{process.kill(-child.pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}}
    let outcome=await Promise.race([exited,delay(3000).then(()=>null)]);
    if(!outcome&&child.pid){try{process.kill(-child.pid,'SIGKILL');}catch(e){if(e.code!=='ESRCH')throw e;}outcome=await exited;}
    closeSync(fd);
    writeFileSync(dir+'/closeout.json',JSON.stringify({outcome,log_sha256:sha(readFileSync(dir+'/native.log')),authority_effect:'none'},null,2)+'\n');
  }
  normalized.push(importArm(dir,expected));
  if(!hostResult.qualified){writeFileSync(pairDir+'/pair.json',JSON.stringify({status:'host-rejected-during-run',arm,order,registration_sha256:registrationSha,members,reasons:hostResult.reasons,product_error:failed?.message??null,host_evidence:dir+'/host.json',authority_effect:'none'},null,2));console.log('Host rejected during run: '+dir);process.exitCode=2;break;}
  if(failed){writeFileSync(pairDir+'/pair.json',JSON.stringify({status:'failed',order,registration_sha256:registrationSha,members,error:failed.message,host_qualification:'not_evaluable',authority_effect:'none'},null,2));process.exitCode=1;break;}
  members.push({arm,directory:dir,host_sha256:sha(readFileSync(dir+'/host.json')),receipt_sha256:sha(readFileSync(dir+'/receipt.json')),semantics_sha256:sha(readFileSync(dir+'/semantics.json'))});
  console.log('PASS native receipt '+arm);
}

if(members.length===2)writeFileSync(pairDir+'/pair.json',JSON.stringify({status:'host-qualified-diagnostic-complete',order,registration_sha256:registrationSha,members,host_qualification:'not_evaluable',overhead_result:'not_evaluable',authority_effect:'none'},null,2)+'\n');

for(const arm of reservation.arms)if(!normalized.some(r=>r.arm===arm))normalized.push({arm,run_id:pairDir+'/'+arm+'-not-run',status:'not-run',reason:'prior arm stopped pair'});
verifyArtifacts(normalized);
const view=appendEvent(campaignDir,{type:'settle',pair:reservation.pair,results:normalized});
writeFileSync(pairDir+'/settlement.json',JSON.stringify(view,null,2)+'\n');
console.log(JSON.stringify({campaign:campaignDir,status:view.status,next:view.next,qualified_counts:view.qualified_counts,authority_effect:'none'},null,2));
