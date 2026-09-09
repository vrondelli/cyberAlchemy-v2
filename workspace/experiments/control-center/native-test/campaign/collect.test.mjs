import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {collectCampaign,extractMetrics,observe,runProcess,createNativeContext} from './collect.mjs';
import {digest,protocolBytes} from './analyze.mjs';

const budgetBytes=JSON.stringify({budgets:{paint:{minimum_samples:1,p95_ms:16.7}}});
const identity={candidateSha256:'a'.repeat(64),binarySha256:'b'.repeat(64),hostSha256:'c'.repeat(64),budgetSha256:digest(budgetBytes),protocolSha256:digest(protocolBytes)};
const report=(samples=[10])=>JSON.stringify({status:'CANDIDATE_PERFORMANCE_MEASURED',performanceResults:[{name:'paint',samplesMs:samples}]})+'\n';
const host=()=>Array.from({length:8},(_,i)=>({atMs:i*1000,normalizedLoad1:0.1,availableMemoryFraction:0.8,cpuPressureAvg10:0,memoryPressureAvg10:0}));
const temp=t=>{const directory=mkdtempSync('/tmp/cc-collector-unit.');t.after(()=>rmSync(directory,{recursive:true}));return directory;};
function options(t,overrides={}) {
  return {directory:temp(t),identity,budgetBytes,verify:()=>({ok:true}),
    run:async directory=>{writeFileSync(join(directory,'stdout.log'),report(),{flag:'wx'});return {pid:123,exitCode:0};},
    observeRun:async run=>({host:host(),startMs:5000,endMs:7000,result:await run()}),...overrides};
}
test('collects exactly forty sessions with separate storage and retained raw evidence',async t=>{
  const config=options(t);const result=await collectCampaign(config);
  assert.equal(result.status,'PASS');assert.equal(result.attempts.length,40);
  assert.equal(new Set(result.attempts.map(a=>a.runId)).size,40);
  assert.equal(readdirSync(config.directory).filter(n=>n.startsWith('attempt-')).length,40);
  assert.equal(readFileSync(join(config.directory,'budgets.json'),'utf8'),budgetBytes);
  assert.equal(JSON.parse(readFileSync(join(config.directory,'attempts.json'))).attempts.length,40);
});
test('preflight drift prevents launch and persists a failed result',async t=>{
  let launches=0;const result=await collectCampaign(options(t,{verify:()=>({ok:false}),run:()=>{launches++;}}));
  assert.equal(launches,0);assert.equal(result.stopReason,'preflight-failed');assert.equal(result.status,'INVALID');
});
test('drift during prelaunch observations prevents actual process launch',async t=>{
  let checks=0,launches=0;
  const result=await collectCampaign(options(t,{verify:()=>({ok:++checks!==2}),run:()=>{launches++;}}));
  assert.equal(launches,0);assert.equal(result.status,'INVALID');assert.equal(result.attempts.length,1);
});
test('postflight drift stops successors and keeps raw samples',async t=>{
  let checks=0;const result=await collectCampaign(options(t,{verify:()=>({ok:++checks<3})}));
  assert.equal(result.stopReason,'postflight-failed');assert.equal(result.attempts.length,1);assert.deepEqual(result.attempts[0].metrics.paint,[10]);
});
test('failed smoke is retained, never reclassified as a completed collection',async t=>{
  const result=await collectCampaign(options(t,{run:async directory=>{writeFileSync(join(directory,'stdout.log'),report([99]));return {pid:123,exitCode:1};}}));
  assert.equal(result.stopReason,'session-failed');assert.equal(result.attempts.length,1);assert.equal(result.attempts[0].status,'failed');assert.deepEqual(result.attempts[0].metrics.paint,[99]);
});
test('host rejection alone allows next attempt, without inspecting its latency',async t=>{
  let index=0;const result=await collectCampaign(options(t,{observeRun:async run=>{
    const observations=host();if(index++===0)observations[0].cpuPressureAvg10=99;
    return {host:observations,startMs:5000,endMs:7000,result:await run()};
  }}));
  assert.equal(result.status,'PASS');assert.equal(result.attempts.length,41);assert.equal(result.analysis.rejected.length,1);
});
test('sixty rejected attempts stop incomplete, without manufacturing p95',async t=>{
  const result=await collectCampaign(options(t,{observeRun:async run=>{const observations=host();observations[0].cpuPressureAvg10=99;return {host:observations,startMs:5000,endMs:7000,result:await run()};}}));
  assert.equal(result.attempts.length,60);assert.equal(result.status,'INCOMPLETE');assert.equal(result.analysis.metrics[0].p95Ms,null);
});
test('malformed metrics cannot pass',async t=>{
  const result=await collectCampaign(options(t,{run:async directory=>{writeFileSync(join(directory,'stdout.log'),'no report');return {pid:123,exitCode:0};}}));
  assert.equal(result.status,'INVALID');assert.equal(result.attempts.length,1);
  assert.throws(()=>extractMetrics(report()+report()),/EXACTLY_ONE/);
  assert.throws(()=>extractMetrics(report([-1])),/INVALID/);
  assert.deepEqual(extractMetrics('[0-0] '+report()),{paint:[10]});
});
test('append-only output refuses reuse instead of overwriting evidence',async t=>{
  const config=options(t,{verify:()=>({ok:false})});await collectCampaign(config);
  await assert.rejects(collectCampaign(config),{code:'EEXIST'});
});
test('real child exit and timeout preserve logs and distinguish failure',async t=>{
  const directory=temp(t);
  const result=await runProcess(process.execPath,['-e','console.log("retained");process.exit(7)'],{directory,env:{},cwd:directory});
  assert.equal(result.exitCode,7);assert.match(readFileSync(join(directory,'stdout.log'),'utf8'),/retained/);
  const timeoutDirectory=temp(t);
  const timed=await runProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{directory:timeoutDirectory,env:{},cwd:timeoutDirectory,timeoutMs:50,graceMs:50});
  assert.equal(timed.timedOut,true);assert.notEqual(timed.exitCode,0);
});
test('continuous observer records prelaunch and both run boundaries even on rejection',async()=>{
  let at=0;const result=await observe(async()=>{at+=100;throw new Error('fixture failure');},{now:()=>at,sample:atMs=>({atMs}),pause:async ms=>{at+=ms;}});
  assert.equal(result.host.length,7);assert.equal(result.startMs,5000);assert.equal(result.endMs,5100);assert.match(result.result.error,/fixture failure/);
});
test('native adapter refuses arbitrary binaries and missing pinned digest',()=>{
  assert.throws(()=>createNativeContext('/bin/true','a'.repeat(64)),/EXPLICIT_ISOLATED/);
  assert.throws(()=>createNativeContext('/tmp/cav2-cc003-native.test/essays-desktop',''),/EXPLICIT_ISOLATED/);
});
test('host-rejected failed smoke still stops and is retained',async t=>{
  const result=await collectCampaign(options(t,{observeRun:async run=>{
    const result=await run();result.exitCode=1;
    const observations=host();observations[0].cpuPressureAvg10=99;
    return {host:observations,startMs:5000,endMs:7000,result};
  }}));
  assert.equal(result.status,'INVALID');assert.equal(result.attempts.length,1);assert.equal(result.analysis.rejected.length,1);
});
test('observer samples during an actual asynchronous run',async()=>{
  const result=await observe(()=>new Promise(resolve=>setTimeout(()=>resolve({exitCode:0}),1100)),{sample:atMs=>({atMs}),pause:async()=>{}});
  assert.ok(result.host.some(o=>o.atMs>result.startMs&&o.atMs<result.endMs));
});
test('missing executable rejects without lingering process listeners',async t=>{
  const directory=temp(t),before=process.listenerCount('SIGINT');
  await assert.rejects(runProcess(join(directory,'missing'),[],{directory,env:{},cwd:directory}),{code:'ENOENT'});
  assert.equal(process.listenerCount('SIGINT'),before);
});
