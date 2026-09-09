import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {prepareHost} from '../latency-comparison-011/host.mjs';
import {runProcess} from '../native-test/campaign/collect.mjs';
import {sha} from '../latency-comparison-012/campaign.mjs';
const here=fileURLToPath(new URL('./',import.meta.url)),repo=fileURLToPath(new URL('../../../../../',import.meta.url));
const runtime=repo+'cyberAlchemy-v2/workspace/runtime';
if(spawnSync(process.execPath,[here+'../latency-comparison-008/verify-native.mjs'],{stdio:'inherit'}).status!==0)throw Error('binary-preflight');
const port=createServer();await new Promise((ok,no)=>{port.once('error',no);port.listen(4445,'127.0.0.1',ok);});await new Promise(ok=>port.close(ok));
mkdirSync(here+'runs',{recursive:true});const dir=mkdtempSync(here+'runs/unified-');
console.log('Strict unified smoke artifacts: '+dir);
const save=(name,v)=>writeFileSync(dir+'/'+name,JSON.stringify(v,null,2)+'\n');
const host=await prepareHost(v=>save('host.json',v));
if(!host.prelaunch.qualified){save('result.json',{status:'host-rejected-prelaunch',reasons:host.prelaunch.reasons,authority_effect:'none'});process.exitCode=2;}
else{
  for(const f of ['data','config','cache','artifacts'])mkdirSync(dir+'/'+f);
  const env=Object.fromEntries(['PATH','HOME','DISPLAY','WAYLAND_DISPLAY','XAUTHORITY','XDG_RUNTIME_DIR','DBUS_SESSION_BUS_ADDRESS','LANG'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  const bridge=repo+'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/client/desktop-bridge.mjs',mock=repo+'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/test/fixtures/mock-app-server.mjs';
  Object.assign(env,{ESSAYS_DATABASE:dir+'/essays.sqlite',WORKSPACE_WDIO_OUTPUT:dir+'/artifacts',XDG_DATA_HOME:dir+'/data',XDG_CONFIG_HOME:dir+'/config',XDG_CACHE_HOME:dir+'/cache',WDIO_USE_NATIVE_FETCH:'1',ARE_CODEX_NODE:process.execPath,ARE_CODEX_BRIDGE:bridge,ARE_CODEX_CWD:repo+'cyberAlchemy-v2',CODEX_BINARY:mock,ARE_CODEX_RECEIPT_PATH:dir+'/are-events.jsonl',ARE_CODEX_ALLOW_PROTOCOL_DRIFT:'0'});
  env.ARE_CODEX_TEST_FIXTURE='workspace-mock-v1';
  const proxyRoot=repo+'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/runtime/';
  save('identity.json',{binary:JSON.parse(readFileSync(here+'../latency-comparison-008/native/uninstrumented/identity.json')),bridge_sha256:sha(readFileSync(bridge)),mock_sha256:sha(readFileSync(mock)),proxy_sha256:sha(readFileSync(proxyRoot+'proxy.mjs')),fixture_binding_sha256:sha(readFileSync(proxyRoot+'test-fixture.mjs')),evidence_mode:'synthetic-fixture',test_fixture_id:env.ARE_CODEX_TEST_FIXTURE,real_codex_conformance:'not_evaluable',spec_sha256:sha(readFileSync(runtime+'/wdio/specs/unified-workspace.e2e.mjs')),authority_effect:'none'});
  const monitor=host.start();let result,qualification;
  try{result=await runProcess(process.execPath,[runtime+'/node_modules/@wdio/cli/bin/wdio.js','run',here+'wdio.conf.mjs'],{cwd:runtime,env,directory:dir});}finally{qualification=monitor.finish();}
  save('result.json',{status:result.exitCode===0&&qualification.qualified?'PASS':'FAIL',result,qualification,authority_effect:'none'});
  if(result.exitCode!==0||!qualification.qualified)process.exitCode=1;
}
