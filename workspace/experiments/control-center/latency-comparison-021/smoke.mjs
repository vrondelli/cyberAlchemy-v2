import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import {prepareHost} from '../latency-comparison-011/host.mjs';
import {runProcess} from '../native-test/campaign/collect.mjs';
import {verifyNative,sha} from './verify.mjs';
const here=fileURLToPath(new URL('./',import.meta.url)),repo=fileURLToPath(new URL('../../../../../',import.meta.url));
const runtime=repo+'cyberAlchemy-v2/workspace/runtime/';
const binary=verifyNative();
const budgetBinding=JSON.parse(readFileSync(here+'../latency-comparison-014/budget-binding.json'));
if(sha(readFileSync(repo+budgetBinding.path))!==budgetBinding.sha256)throw Error('budget-drift');
const port=createServer();await new Promise((ok,no)=>{port.once('error',no);port.listen(4445,'127.0.0.1',ok);});await new Promise(ok=>port.close(ok));
mkdirSync(here+'runs',{recursive:true});const dir=mkdtempSync(here+'runs/unified-');
console.log('WLC-021 smoke artifacts: '+dir);
const save=(name,v)=>writeFileSync(dir+'/'+name,JSON.stringify(v,null,2)+'\n');
const host=await prepareHost(v=>save('host.json',v));
if(!host.prelaunch.qualified){save('result.json',{status:'host-rejected-prelaunch',reasons:host.prelaunch.reasons,authority_effect:'none'});process.exitCode=2;}
else{
  for(const f of ['data','config','cache','artifacts'])mkdirSync(dir+'/'+f);
  const env=Object.fromEntries(['PATH','HOME','DISPLAY','WAYLAND_DISPLAY','XAUTHORITY','XDG_RUNTIME_DIR','DBUS_SESSION_BUS_ADDRESS','LANG'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  const are=repo+'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/';
  const bridge=are+'client/desktop-bridge.mjs',mock=are+'test/fixtures/mock-app-server.mjs';
  Object.assign(env,{ESSAYS_DATABASE:dir+'/essays.sqlite',WORKSPACE_WDIO_OUTPUT:dir+'/artifacts',XDG_DATA_HOME:dir+'/data',XDG_CONFIG_HOME:dir+'/config',XDG_CACHE_HOME:dir+'/cache',WDIO_USE_NATIVE_FETCH:'1',ARE_CODEX_NODE:process.execPath,ARE_CODEX_BRIDGE:bridge,ARE_CODEX_CWD:repo+'cyberAlchemy-v2',CODEX_BINARY:mock,ARE_CODEX_RECEIPT_PATH:dir+'/are-events.jsonl',ARE_CODEX_ALLOW_PROTOCOL_DRIFT:'0',ARE_CODEX_TEST_FIXTURE:'workspace-mock-v1'});
  const paths=[bridge,mock,are+'client/session.mjs',are+'runtime/proxy.mjs',are+'runtime/test-fixture.mjs',here+'smoke.mjs',here+'base.wdio.conf.mjs',here+'verify.mjs',runtime+'wdio/specs/unified-workspace.e2e.mjs',runtime+'performance-budgets.candidate.json'];
  const bound=paths.map(path=>({path,sha256:sha(readFileSync(path))}));
  save('identity.json',{binary,selected_runtime_inputs:bound,node:process.version,evidence_mode:'instrumented-native-diagnostic-with-synthetic-fixture',real_codex_conformance:'not_evaluable',authority_effect:'none'});
  const monitor=host.start();let result,qualification;
  try{result=await runProcess(process.execPath,[runtime+'node_modules/@wdio/cli/bin/wdio.js','run',here+'base.wdio.conf.mjs'],{cwd:runtime,env,directory:dir});}finally{qualification=monitor.finish();}
  let drift=null;try{verifyNative();for(const e of bound)if(sha(readFileSync(e.path))!==e.sha256)throw Error('runtime-drift:'+e.path);}catch(e){drift=e.message;}
  const pass=result.exitCode===0&&qualification.qualified&&!drift;
  save('result.json',{status:pass?'DIAGNOSTIC_COMPLETED':'DIAGNOSTIC_FAILED',product_test_status:'not_evaluable',result,qualification,drift,authority_effect:'none'});
  if(!pass)process.exitCode=1;
}
