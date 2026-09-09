import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {measurementSource,specURL} from './measurement-loader.mjs';
import {collectCampaign,extractMetrics} from './collect.mjs';
import {buildDifferential,verifyCampaign} from './bundle.mjs';
import {digest,protocolBytes} from './analyze.mjs';

const budgets=JSON.stringify({budgets:{paint:{minimum_samples:1,p95_ms:16.7}}});
const identity={candidateSha256:'a'.repeat(64),binarySha256:'b'.repeat(64),hostSha256:'c'.repeat(64),budgetSha256:digest(budgets),protocolSha256:digest(protocolBytes)};
const host=Array.from({length:8},(_,i)=>({atMs:i*1000,normalizedLoad1:0.1,availableMemoryFraction:0.8,cpuPressureAvg10:0,memoryPressureAvg10:0}));
async function fixture(t,{value=99,candidate='a',exitCode=0}={}) {
  const directory=mkdtempSync('/tmp/cc-measurement-unit.');t.after(()=>rmSync(directory,{recursive:true}));
  const id={...identity,candidateSha256:candidate.repeat(64)};
  const result=await collectCampaign({directory,mode:'measurement',identity:id,budgetBytes:budgets,
    verify:()=>({ok:true,current:id,errors:[],source:{selected_runtime_prerequisites_pass:true},apparatus:[{path:'fixture-harness',sha256:'d'.repeat(64)}]}),
    observeRun:async run=>({host,startMs:5000,endMs:7000,result:await run()}),
    run:async dir=>{
      writeFileSync(join(dir,'stdout.log'),JSON.stringify({status:'CANDIDATE_PERFORMANCE_MEASURED',collectionMode:'measurement-only/v1',performanceResults:[{name:'paint',samplesMs:[value]}]})+'\n');
      writeFileSync(join(dir,'stderr.log'),'');return {pid:123,exitCode};
    }});
  return {directory,result,index:digest(readFileSync(join(directory,'evidence-index.json')))};
}
test('measurement transformation is exact and rejects any upstream source drift',()=>{
  const source=readFileSync(new URL(specURL),'utf8'),modified=measurementSource(source);
  assert.ok(source.includes('result.status !== "within-budget"'));
  assert.ok(modified.includes('result.status === "insufficient-samples"'));
  assert.equal(modified.replace('result.status === "insufficient-samples"','result.status !== "within-budget"').replace('performanceResults, collectionMode: "measurement-only/v1", authorityEffect: "none"','performanceResults, authorityEffect: "none"'),source);
  assert.throws(()=>measurementSource(source+'\n'),/DRIFT/);
  assert.throws(()=>extractMetrics('{"status":"CANDIDATE_PERFORMANCE_MEASURED","performanceResults":[]}','measurement'),/MODE_NOT_PROVEN/);
});
test('forty slow sessions are retained and fail unchanged population budget',async t=>{
  const f=await fixture(t);assert.equal(f.result.status,'FAIL');assert.equal(f.result.attempts.length,40);
  assert.equal(verifyCampaign(f.directory,f.index).analysis.metrics[0].p95Ms,99);
});
test('functional failure stops measurement and cannot be compared',async t=>{
  const f=await fixture(t,{exitCode:1});assert.equal(f.result.attempts.length,1);
  assert.throws(()=>verifyCampaign(f.directory,f.index),/NOT_COMPLETE/);
});
test('differential recomputes complete populations and binds supplied indexes',async t=>{
  const before=await fixture(t),after=await fixture(t,{value:10,candidate:'e'});
  const result=buildDifferential(before.directory,before.index,after.directory,after.index);
  assert.equal(result.status,'COMPARABLE');assert.equal(result.deltas[0].p95DeltaMs,-89);
  assert.equal(result.before.status,'FAIL');assert.equal(result.after.status,'PASS');
  assert.equal(buildDifferential(before.directory,'f'.repeat(64),after.directory,after.index).status,'not_evaluable');
});
test('modified raw log invalidates retained index',async t=>{
  const f=await fixture(t);writeFileSync(join(f.directory,f.result.attempts[0].runId,'stdout.log'),'forged');
  assert.throws(()=>verifyCampaign(f.directory,f.index),/FILE_DRIFT/);
});
test('modified PASS summary is not trusted',async t=>{
  const f=await fixture(t);const result={...f.result,status:'PASS'};
  writeFileSync(join(f.directory,'result.json'),JSON.stringify(result));
  assert.throws(()=>verifyCampaign(f.directory,f.index),/FILE_DRIFT/);
});
test('native Node registration actually applies the loader without running a desktop',()=>{
  const script=`globalThis.describe=(title,fn)=>fn();globalThis.it=(title,fn)=>{if(!fn.toString().includes('collectionMode: "measurement-only/v1"'))throw Error('LOADER_NOT_APPLIED');console.log('LOADER_APPLIED');};await import(${JSON.stringify(specURL)});`;
  const child=spawnSync(process.execPath,['--import',fileURLToPath(new URL('./measurement-register.mjs',import.meta.url)),'--input-type=module','-e',script],{encoding:'utf8'});
  assert.equal(child.status,0,child.stderr);assert.match(child.stdout,/LOADER_APPLIED/);
});
test('even a freshly indexed edited summary is rejected by raw recomputation',async t=>{
  const f=await fixture(t),path=join(f.directory,'result.json');
  const value=JSON.parse(readFileSync(path));value.analysis.metrics[0].p95Ms=1;writeFileSync(path,JSON.stringify(value));
  const indexPath=join(f.directory,'evidence-index.json'),index=JSON.parse(readFileSync(indexPath));
  index.files.find(x=>x.path==='result.json').sha256=digest(readFileSync(path));
  writeFileSync(indexPath,JSON.stringify(index));
  assert.throws(()=>verifyCampaign(f.directory,digest(readFileSync(indexPath))),/ANALYSIS_DRIFT/);
});
