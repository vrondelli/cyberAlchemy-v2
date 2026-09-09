import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,openSync,closeSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {performance} from 'node:perf_hooks';
import {analyze,digest,protocol,protocolBytes} from './analyze.mjs';
import {describeHost,sampleHost} from './probe.mjs';
import {validate} from '../../candidates/cc-003/validate.mjs';
import {sealEvidence} from './evidence.mjs';

const here=fileURLToPath(new URL('.',import.meta.url));
const root=resolve(here,'../../../../../../');
const runtime=join(root,'cyberAlchemy-v2/workspace/runtime');
const candidatePath=resolve(here,'../../candidates/cc-003/candidate.json');
const budgetPath=join(runtime,'performance-budgets.candidate.json');
const candidateSha256='d6d0cab8e8b6699eafed912a8467a7599ed3d10cf756348765cc6142f361861d';
const budgetSha256='e8f7ac530bb990402a04a85ea61e654f83787263c24e73ac26d279fdabd77baf';
const hashFile=path=>digest(readFileSync(path));
const writeJSON=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx'});

// Keep failure output, including samples emitted before the existing smoke throws.
export function extractMetrics(stdout,mode='smoke') {
  const reports=[];
  for(const line of stdout.split('\n')) {
    const start=line.indexOf('{"status":"CANDIDATE_PERFORMANCE_MEASURED"');
    if(start>=0) reports.push(JSON.parse(line.slice(start)));
  }
  if(reports.length!==1 || !Array.isArray(reports[0].performanceResults)) throw new Error('EXACTLY_ONE_PERFORMANCE_REPORT_REQUIRED');
  if(mode==='measurement'&&reports[0].collectionMode!=='measurement-only/v1')throw new Error('MEASUREMENT_MODE_NOT_PROVEN');
  const metrics={};
  for(const row of reports[0].performanceResults) {
    if(typeof row.name!=='string' || Object.hasOwn(metrics,row.name) || !Array.isArray(row.samplesMs) || !row.samplesMs.length || !row.samplesMs.every(n=>Number.isFinite(n)&&n>=0)) throw new Error('INVALID_PERFORMANCE_REPORT');
    metrics[row.name]=row.samplesMs;
  }
  return metrics;
}

// A detached process group bounds timeout cleanup to this launch's descendants.
export function runProcess(command,args,{cwd,env,directory,timeoutMs=240000,graceMs=3000}) {
  return new Promise((resolveResult,reject)=>{
    const out=openSync(join(directory,'stdout.log'),'wx');
    let err;
    try { err=openSync(join(directory,'stderr.log'),'wx'); }
    catch(error) { closeSync(out); reject(error); return; }
    const child=spawn(command,args,{cwd,env,detached:true,stdio:['ignore',out,err]});
    closeSync(out);closeSync(err);
    let timedOut=false,killTimer,interrupted=null;
    const kill=signal=>{if(!Number.isInteger(child.pid))return;try{process.kill(-child.pid,signal);}catch(error){if(error.code!=='ESRCH') throw error;}};
    const timer=setTimeout(()=>{timedOut=true;kill('SIGTERM');killTimer=setTimeout(()=>kill('SIGKILL'),graceMs);},timeoutMs);
    const interrupt=signal=>{interrupted=signal;kill('SIGKILL');};
    const onInt=()=>interrupt('SIGINT'),onTerm=()=>interrupt('SIGTERM');
    process.once('SIGINT',onInt);process.once('SIGTERM',onTerm);
    const cleanup=()=>{clearTimeout(timer);clearTimeout(killTimer);process.off('SIGINT',onInt);process.off('SIGTERM',onTerm);};
    child.once('error',error=>{cleanup();reject(error);});
    child.once('close',(exitCode,signal)=>{
      cleanup();
      // Do not leave a desktop/driver descendant running between cold sessions.
      kill('SIGKILL');
      resolveResult({pid:child.pid,exitCode,signal,timedOut,interrupted});
    });
  });
}

export async function observe(run,{sample=sampleHost,now=()=>performance.now(),pause=sleep}={}) {
  const host=[];
  for(let i=0;i<protocol.prelaunchObservations;i++) {host.push(sample(now()));await pause(1000);}
  const startMs=now();host.push(sample(startMs));
  let observationError=null;
  const timer=setInterval(()=>{try{host.push(sample(now()));}catch(error){observationError=error.message;}},1000);
  let result;
  try {result=await run();}
  catch(error){result={exitCode:null,error:error.message};}
  finally {clearInterval(timer);}
  const endMs=now();
  try {host.push(sample(endMs));}catch(error){observationError=error.message;}
  return {host,startMs,endMs,result,observationError};
}

// Dependency injection is a test seam, not an alternate CLI authority/validator.
export async function collectCampaign({directory,identity,budgetBytes,verify,run,observeRun=observe,mode='smoke'}) {
  if(!['smoke','measurement'].includes(mode))throw new Error('INVALID_COLLECTION_MODE');
  const attempts=[];
  let stopReason=null;
  writeJSON(join(directory,'manifest.json'),{schema:'cc-collector/v1',identity,mode,startedAt:new Date().toISOString(),authorityEffect:'none'});
  writeFileSync(join(directory,'budgets.json'),budgetBytes,{flag:'wx'});
  writeFileSync(join(directory,'protocol.json'),protocolBytes,{flag:'wx'});
  const checked=()=>{try{return verify();}catch(error){return {ok:false,error:error.message};}};
  for(let index=1;index<=protocol.maxAttempts;index++) {
    const pre=checked();writeJSON(join(directory,`pre-${index}.json`),pre);
    if(pre.ok!==true){stopReason='preflight-failed';break;}
    const attemptDirectory=mkdtempSync(join(directory,`attempt-${index}-`));
    for(const folder of ['data','config','artifacts'])mkdirSync(join(attemptDirectory,folder));
    let observed;
    try {observed=await observeRun(()=>{
      const launch=checked();writeJSON(join(attemptDirectory,'launchflight.json'),launch);
      if(launch.ok!==true)throw new Error('LAUNCHFLIGHT_FAILED');
      return run(attemptDirectory);
    });}
    catch(error){observed={host:[],startMs:0,endMs:0,result:{error:error.message}};}
    const post=checked();
    writeJSON(join(attemptDirectory,'postflight.json'),post);
    let metrics={},parseError=null;
    try {metrics=extractMetrics(readFileSync(join(attemptDirectory,'stdout.log'),'utf8'),mode);}
    catch(error){parseError=error.message;}
    const completed=observed.result.exitCode===0 && !observed.result.timedOut && !observed.result.interrupted && !observed.result.error && !observed.observationError && !parseError && post.ok===true;
    const attempt={runId:attemptDirectory.split('/').at(-1),attempt:index,identity,coldProcess:Number.isInteger(observed.result.pid),freshStorage:true,status:completed?'completed':'failed',...observed,metrics,parseError};
    attempts.push(attempt);writeJSON(join(attemptDirectory,'attempt.json'),attempt);
    const report=analyze(identity,attempts,budgetBytes);
    // Even a host-rejected functional failure stops: rejection is not retry permission.
    if(!completed){stopReason=post.ok!==true?'postflight-failed':'session-failed';break;}
    if(report.status==='INVALID'){stopReason='invalid-evidence';break;}
    if(report.qualifiedCount===protocol.qualifiedSessions)break;
  }
  const analysis=analyze(identity,attempts,budgetBytes);
  const bundle={schema:'cc-collector-result/v1',identity,attempts,analysis,stopReason,status:stopReason?'INVALID':analysis.status,authorityEffect:'none',claimCeiling:'Mock-backed local test evidence only; not product approval or a differential bundle.'};
  writeJSON(join(directory,'attempts.json'),{identity,attempts});
  writeJSON(join(directory,'result.json'),bundle);
  return {...bundle,evidenceIndexSha256:sealEvidence(directory)};
}

export function createNativeContext(binary,expectedBinarySha256,mode='smoke') {
  if(!['smoke','measurement'].includes(mode))throw new Error('INVALID_COLLECTION_MODE');
  if(!/^\/tmp\/cav2-cc003-native\.[^/]+\/essays-desktop$/.test(binary) || !/^[a-f0-9]{64}$/.test(expectedBinarySha256))throw new Error('EXPLICIT_ISOLATED_BINARY_AND_SHA256_REQUIRED');
  const host=describeHost();
  const identity={candidateSha256,binarySha256:expectedBinarySha256,budgetSha256,protocolSha256:digest(protocolBytes),hostSha256:digest(JSON.stringify(host))};
  const apparatusPaths=['collect.mjs','analyze.mjs','probe.mjs','protocol.json','evidence.mjs','measurement-loader.mjs','measurement-register.mjs','../wdio.conf.mjs','../../candidates/cc-003/validate.mjs'].map(p=>resolve(here,p));
  apparatusPaths.push(join(runtime,'wdio/specs/unified-workspace.e2e.mjs'),join(runtime,'wdio/wdio.conf.mjs'));
  const apparatus=apparatusPaths.map(path=>({path,sha256:hashFile(path)}));
  const verify=()=>{
    const source=validate();
    const current={candidateSha256:hashFile(candidatePath),binarySha256:hashFile(binary),budgetSha256:hashFile(budgetPath),protocolSha256:hashFile(join(here,'protocol.json')),hostSha256:digest(JSON.stringify(describeHost()))};
    const errors=Object.keys(identity).filter(k=>identity[k]!==current[k]);
    for(const file of apparatus)if(hashFile(file.path)!==file.sha256)errors.push('apparatus:'+file.path);
    return {ok:source.selected_runtime_prerequisites_pass&&errors.length===0,errors,current,source,apparatus};
  };
  const run=directory=>{
    // Explicit allowlist: never inherit live Codex/provider or database overrides.
    const env={};
    for(const key of ['PATH','HOME','DISPLAY','WAYLAND_DISPLAY','XDG_RUNTIME_DIR','DBUS_SESSION_BUS_ADDRESS','LANG'])if(process.env[key])env[key]=process.env[key];
    Object.assign(env,{
      CC003_TEST_BINARY:binary,CC003_UNIFIED:'1',ESSAYS_DATABASE:join(directory,'session.sqlite'),
      WORKSPACE_WDIO_OUTPUT:join(directory,'artifacts'),XDG_DATA_HOME:join(directory,'data'),XDG_CONFIG_HOME:join(directory,'config'),
      WDIO_USE_NATIVE_FETCH:'1',ARE_CODEX_NODE:process.execPath,ARE_CODEX_ALLOW_PROTOCOL_DRIFT:'1',
      ARE_CODEX_CWD:join(root,'cyberAlchemy-v2'),ARE_CODEX_RECEIPT_PATH:join(directory,'receipts.jsonl'),
      ARE_CODEX_BRIDGE:join(root,'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/client/desktop-bridge.mjs'),
      CODEX_BINARY:join(root,'cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/test/fixtures/mock-app-server.mjs'),
    });
    if(mode==='measurement')env.NODE_OPTIONS='--import='+pathToFileURL(join(here,'measurement-register.mjs')).href;
    return runProcess(process.execPath,[join(runtime,'node_modules/@wdio/cli/bin/wdio.js'),'run',resolve(here,'../wdio.conf.mjs')],{cwd:runtime,env,directory});
  };
  return {identity,budgetBytes:readFileSync(budgetPath),verify,run,mode};
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  const [mode,binary,sha,...extra]=process.argv.slice(2);
  if(!['--preflight','--collect','--measure'].includes(mode)||extra.length)throw new Error('Usage: collect.mjs --preflight|--collect|--measure /tmp/cav2-cc003-native.ID/essays-desktop SHA256');
  const context=createNativeContext(binary,sha,mode==='--measure'?'measurement':'smoke');
  if(mode==='--preflight'){const result=context.verify();console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;}
  else {
    const directory=mkdtempSync('/tmp/cav2-cc-campaign.');
    console.log(JSON.stringify({directory,authorityEffect:'none'}));
    const result=await collectCampaign({directory,...context});
    console.log(JSON.stringify({directory,status:result.status,stopReason:result.stopReason,qualifiedCount:result.analysis.qualifiedCount,evidenceIndexSha256:result.evidenceIndexSha256}));
    process.exitCode=result.status==='PASS'?0:1;
  }
}
