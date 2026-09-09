import {readFileSync,mkdtempSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {collectCampaign,runProcess} from '../campaign/collect.mjs';
import {digest,protocolBytes} from '../campaign/analyze.mjs';
import {describeHost} from '../campaign/probe.mjs';
import {validate as validateCC006} from '../../candidates/cc-006/validate.mjs';

const here=fileURLToPath(new URL('.',import.meta.url));
const root=resolve(here,'../../../../../../');
const runtime=join(root,'cyberAlchemy-v2/workspace/runtime');
const budgetPath=join(runtime,'performance-budgets.candidate.json');
const sha=path=>digest(readFileSync(path));
const candidates=Object.freeze({'CC-006':{path:resolve(here,'../../candidates/cc-006/candidate.json'),validate:validateCC006}});

export function selectedContext({candidateId,candidateSha256,binary,binarySha256,mode='measurement'}) {
  if(!Object.hasOwn(candidates,candidateId))throw new Error('UNREGISTERED_CANDIDATE');
  if(!['measurement','smoke'].includes(mode))throw new Error('INVALID_MODE');
  if(![candidateSha256,binarySha256].every(h=>typeof h==='string'&&/^[a-f0-9]{64}$/.test(h)))throw new Error('EXPLICIT_DIGESTS_REQUIRED');
  if(typeof binary!=='string'||!/^\/tmp\/cav2-cc006-native\.[A-Za-z0-9]+\/essays-desktop$/.test(binary))throw new Error('ISOLATED_EXECUTABLE_REQUIRED');
  const selected=candidates[candidateId];
  const identity={candidateSha256,binarySha256,budgetSha256:'e8f7ac530bb990402a04a85ea61e654f83787263c24e73ac26d279fdabd77baf',protocolSha256:digest(protocolBytes),hostSha256:digest(JSON.stringify(describeHost()))};
  const candidate=JSON.parse(readFileSync(selected.path));
  const apparatus=candidate.additional_sources.filter(f=>f.path.includes('/native-test/')).map(f=>({...f}));
  const verify=()=>{
    try {
      const current={candidateSha256:sha(selected.path),binarySha256:sha(binary),budgetSha256:sha(budgetPath),protocolSha256:sha(join(here,'../campaign/protocol.json')),hostSha256:digest(JSON.stringify(describeHost()))};
      const source=selected.validate();
      const errors=Object.keys(identity).filter(k=>identity[k]!==current[k]);
      if(candidate.candidate_id!==candidateId)errors.push('candidate-id');
      return {ok:errors.length===0&&source.selected_runtime_prerequisites_pass,current,errors,source,apparatus};
    }catch(error){return {ok:false,errors:[error.message],apparatus};}
  };
  const launch=directory=>{
    const env={};
    for(const k of ['PATH','HOME','DISPLAY','WAYLAND_DISPLAY','XDG_RUNTIME_DIR','DBUS_SESSION_BUS_ADDRESS','LANG'])if(process.env[k])env[k]=process.env[k];
    Object.assign(env,{
      NODE_OPTIONS:'--enable-source-maps',CC_CANDIDATE_ID:candidateId,CC_CANDIDATE_SHA256:candidateSha256,
      CC_BINARY:binary,CC_BINARY_SHA256:binarySha256,CC_COLLECTION_MODE:mode,
      ESSAYS_DATABASE:join(directory,'session.sqlite'),WORKSPACE_WDIO_OUTPUT:join(directory,'artifacts'),
      XDG_DATA_HOME:join(directory,'data'),XDG_CONFIG_HOME:join(directory,'config'),
      WDIO_USE_NATIVE_FETCH:'1',ARE_CODEX_NODE:process.execPath,ARE_CODEX_ALLOW_PROTOCOL_DRIFT:'1',
      ARE_CODEX_CWD:join(root,'cyberAlchemy-v2'),ARE_CODEX_RECEIPT_PATH:join(directory,'receipts.jsonl'),
      ARE_CODEX_BRIDGE:join(root,'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/client/desktop-bridge.mjs'),
      CODEX_BINARY:join(root,'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/test/fixtures/mock-app-server.mjs'),
    });
    return {command:process.execPath,args:[join(runtime,'node_modules/@wdio/cli/bin/wdio.js'),'run',join(here,'selected.wdio.conf.mjs')],options:{cwd:runtime,env,directory}};
  };
  const run=directory=>{
    if(!verify().ok)throw new Error('SELECTED_PREFLIGHT_FAILED');
    const call=launch(directory);return runProcess(call.command,call.args,call.options);
  };
  return {identity,budgetBytes:readFileSync(budgetPath),verify,run,launch,mode};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  const [action,candidateId,candidateSha256,binary,binarySha256,...extra]=process.argv.slice(2);
  if(!['--preflight','--measure','--smoke'].includes(action)||extra.length)throw new Error('Usage: selected.mjs --preflight|--measure|--smoke CANDIDATE_ID CANDIDATE_SHA256 BINARY BINARY_SHA256');
  const context=selectedContext({candidateId,candidateSha256,binary,binarySha256,mode:action==='--smoke'?'smoke':'measurement'});
  const check=context.verify();
  if(action==='--preflight'||!check.ok){console.log(JSON.stringify(check,null,2));process.exitCode=check.ok?0:1;}
  else {
    const directory=mkdtempSync('/tmp/cav2-selected-campaign.');console.log(JSON.stringify({directory}));
    const result=await collectCampaign({directory,...context});
    console.log(JSON.stringify({directory,status:result.status,qualifiedCount:result.analysis.qualifiedCount,evidenceIndexSha256:result.evidenceIndexSha256}));
    process.exitCode=result.status==='PASS'?0:1;
  }
}
