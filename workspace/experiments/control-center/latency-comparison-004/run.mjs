import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,openSync,closeSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import {setTimeout as delay} from 'node:timers/promises';
import {processIdentity,verifyProcess,sha} from './process-identity.mjs';
import {collectPhaseEvidence} from '../latency-comparison-003/collector.mjs';
const here=fileURLToPath(new URL('./',import.meta.url));
const repo=fileURLToPath(new URL('../../../../../',import.meta.url));
const prior=fileURLToPath(new URL('../latency-comparison-003/',import.meta.url));
const bridge=repo+'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/client/desktop-bridge.mjs';
const mock=repo+'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/test/fixtures/mock-app-server.mjs';
if(spawnSync(process.execPath,[prior+'verify-native.mjs'],{stdio:'inherit'}).status!==0)throw Error('native-inputs-invalid');
const bind=async()=>{const s=createServer();await new Promise((ok,no)=>{s.once('error',no);s.listen(0,'127.0.0.1',ok);});const port=s.address().port;await new Promise(ok=>s.close(ok));return port;};
mkdirSync(here+'runs',{recursive:true});
for(const arm of ['baseline','treatment']){
  const dir=mkdtempSync(here+'runs/'+arm+'-');
  const identity=JSON.parse(readFileSync(prior+'native/'+arm+'/identity.json'));
  const binary=prior+'native/'+arm+'/essays-desktop';
  const port=await bind();
  const env=Object.fromEntries(['PATH','HOME','DISPLAY','XAUTHORITY','XDG_RUNTIME_DIR','DBUS_SESSION_BUS_ADDRESS','LANG','LD_LIBRARY_PATH'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  for(const name of ['data','cache','config'])mkdirSync(dir+'/'+name);
  Object.assign(env,{XDG_DATA_HOME:dir+'/data',XDG_CACHE_HOME:dir+'/cache',XDG_CONFIG_HOME:dir+'/config',
    ESSAYS_DATABASE:dir+'/essays.sqlite',TAURI_WEBDRIVER_PORT:String(port),ARE_CODEX_NODE:process.execPath,
    ARE_CODEX_BRIDGE:bridge,ARE_CODEX_CWD:repo+'cyberAlchemy-v2',ARE_CODEX_RECEIPT_PATH:dir+'/are-events.jsonl',
    ARE_CODEX_ALLOW_PROTOCOL_DRIFT:'0',CODEX_BINARY:mock});
  const fd=openSync(dir+'/native.log','wx');
  const child=spawn(binary,[],{cwd:repo,env,detached:true,stdio:['ignore',fd,fd]});
  const exited=new Promise(resolve=>{child.once('exit',(code,signal)=>resolve({code,signal}));child.once('error',error=>resolve({error:error.message}));});
  let session,failed,receipt;
  const request=async(path,body,method=body===undefined?'GET':'POST')=>{
    const response=await fetch(`http://127.0.0.1:${port}`+path,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
    const json=await response.json();if(!response.ok||json.value?.error)throw Error('webdriver:'+JSON.stringify(json));return json.value;
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
    for(let i=0;i<50;i++){
      receipt=await collectPhaseEvidence(browser,{arm,build_id:identity.build_id,binary_sha256:identity.binary_sha256});
      if(receipt.ok)break;await delay(200);
    }
    if(!receipt?.ok)throw Error('receipt-invalid:'+JSON.stringify(receipt?.errors));
    const after=processIdentity(child.pid);
    if(!verifyProcess(before,after,{path:binary,sha256:identity.binary_sha256}))throw Error('process-identity-drift');
    writeFileSync(dir+'/receipt.json',JSON.stringify({schema_version:'workspace.native-phase-probe/v1',arm,before,after,receipt,
      backend:'local-mock-codex-not-live-model',bridge_sha256:sha(readFileSync(bridge)),mock_sha256:sha(readFileSync(mock)),
      host_qualified:false,performance_inference:'not_evaluable',authority_effect:'none'},null,2)+'\n');
  }catch(e){failed=e;writeFileSync(dir+'/failure.json',JSON.stringify({error:e.message,receipt:receipt??null,authority_effect:'none'},null,2)+'\n');}
  finally{
    if(session)try{await request('/session/'+session,undefined,'DELETE');}catch{}
    // This group was created by this runner. Never match or kill unrelated apps.
    if(child.pid){try{process.kill(-child.pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}}
    let outcome=await Promise.race([exited,delay(3000).then(()=>null)]);
    if(!outcome&&child.pid){try{process.kill(-child.pid,'SIGKILL');}catch(e){if(e.code!=='ESRCH')throw e;}outcome=await exited;}
    closeSync(fd);
    writeFileSync(dir+'/closeout.json',JSON.stringify({outcome,log_sha256:sha(readFileSync(dir+'/native.log')),authority_effect:'none'},null,2)+'\n');
  }
  if(failed)throw failed;
  console.log('PASS native receipt '+arm);
}
