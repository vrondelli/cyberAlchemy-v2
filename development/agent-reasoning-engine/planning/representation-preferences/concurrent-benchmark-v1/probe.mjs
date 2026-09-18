import {readFileSync,writeFileSync,readdirSync,statfsSync,existsSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {buildSmokeManifest,verifySourceBindings} from './adapter.mjs';
import {summarizeRun} from '../../../../../implementation/agent-reasoning-engine/packages/benchmark-scheduler/report.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../..'),prefix=relative(root,dir);
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const write=(name,value)=>writeFileSync(join(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const [command]=process.argv.slice(2);
if(command==='prepare'){
 const files=new Set(['PLAN.md','REVIEW.md','PREFLIGHT-REVIEW.md','TEST-RESULTS.json','research-workflow.json','research.mjs','hypotheses.json','experiment.json','continuity.json','run-continuity.json','adapter.mjs','cli.mjs','probe.mjs'].map(x=>prefix+'/'+x));
 function sourceTree(path){for(const item of readdirSync(resolve(root,path),{withFileTypes:true})){const p=path+'/'+item.name;if(item.isDirectory())sourceTree(p);else if(item.name.endsWith('.mjs')&&!item.name.endsWith('.test.mjs'))files.add(p);}}
 for(const packageName of ['benchmark-scheduler','coding-agent-runtime','reasoning-state-runtime'])sourceTree('implementation/agent-reasoning-engine/packages/'+packageName);
 for(const p of ['selectivity-v2/provider.mjs','longmemeval-sequential-v2/chunks.mjs','longmemeval-sequential-v2/ledger.mjs'])files.add('development/agent-reasoning-engine/planning/representation-preferences/benchmark-pilot-v2/execution/'+p);
 const bindings=[...files].sort().map(path=>({path,sha256:sha(resolve(root,path))}));
 for(const arm of ['serial','parallel'])write(arm+'-manifest.json',{...buildSmokeManifest({id:'glm-concurrency-'+arm,count:4}),source_bindings:bindings});
 const manifests=['serial','parallel'].map(x=>({path:prefix+'/'+x+'-manifest.json',sha256:sha(join(dir,x+'-manifest.json'))}));
 write('freeze.json',{schema_version:'are.concurrent-probe-freeze/v1',created_at:new Date().toISOString(),bindings:[...bindings,...manifests],order:['serial','parallel'],concurrency:{serial:1,parallel:2},combined_reservation:4096,maximum_combined_tokens:16384,model:'glm-5.3-flash',claim_ceiling:'Synthetic infrastructure canary, descriptive serial-then-parallel timing only.',authority_effect:'none'});
 console.log('Frozen two four-job conditions; combined reservation 4096 tokens.');
}else if(command==='run'){
 const frozen=read(join(dir,'freeze.json'));verifySourceBindings({source_bindings:frozen.bindings});
 const disk=statfsSync(dir);assert.ok(disk.bavail*disk.bsize>=2*1024**3,'disk guard');
 for(const arm of frozen.order){
  // Resume cannot duplicate completed or ambiguous provider calls. Raw started records are retained.
  execFileSync(process.execPath,[join(dir,'cli.mjs'),'run',join(dir,arm+'-manifest.json'),join(dir,'live',arm),String(frozen.concurrency[arm])],{stdio:['ignore','ignore','inherit']});
  console.log(arm+' terminal; '+JSON.stringify(read(join(dir,'live',arm,'report.json')).counts));
 }
}else if(command==='report'||command==='check'){
 const frozen=read(join(dir,'freeze.json'));verifySourceBindings({source_bindings:frozen.bindings});
 const conditions={};
 for(const arm of frozen.order){
  const base=join(dir,'live',arm),manifest=read(join(dir,arm+'-manifest.json')),state=read(join(base,'checkpoint.json'));
  const summary=summarizeRun({manifest,state});assert.deepEqual(read(join(base,'report.json')),summary);
  const provider=join(base,'provider'),files=readdirSync(provider),starts=files.filter(x=>x.endsWith('-started.json')).map(x=>read(join(provider,x))).filter(x=>x.kind==='model');
  const receipts=files.filter(x=>x.endsWith('-receipt.json')).map(x=>read(join(provider,x))).filter(x=>x.kind==='model');
  assert.equal(new Set(starts.map(x=>x.id)).size,starts.length);assert.equal(receipts.length,starts.length,'all model starts need terminal receipt');
  for(const s of starts){assert.ok(Object.values(state.jobs).some(j=>j.attempt_id===s.id),'orphan provider attempt');assert.equal(sha(join(provider,s.id+'-request.json')),s.request_sha256,'request drift');}
  let known=0,unknown=0,correct=0;const events=[];
  for(const r of receipts){assert.ok(starts.some(s=>s.id===r.id&&s.request_sha256===r.request_sha256));assert.equal(r.model,frozen.model);const u=r.usage;if(Number.isSafeInteger(u?.total_tokens)&&u.total_tokens===u.prompt_tokens+u.completion_tokens)known+=u.total_tokens;else unknown++;if(r.ok&&r.output.trim()==='READY')correct++;events.push([Date.parse(r.started_at),1],[Date.parse(r.finished_at),-1]);}
  events.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let active=0,peak=0;for(const [time,delta] of events){assert.ok(Number.isFinite(time));active+=delta;peak=Math.max(peak,active);}
  assert.equal(known,summary.known_tokens);assert.equal(correct,summary.exact_output.correct);
  conditions[arm]={...summary,model_attempts:starts.length,provider_known_tokens:known,provider_unknown_usage_attempts:unknown,maximum_model_overlap:peak,model_elapsed_ms:events.length?events.at(-1)[0]-events[0][0]:null};
 }
 const serial=conditions.serial,parallel=conditions.parallel;
 const success=[serial,parallel].every(x=>x.counts.completed===4&&x.exact_output.correct===4&&x.exact_total_tokens!==null&&x.within_budget)&&parallel.maximum_model_overlap>=2&&parallel.elapsed_ms<serial.elapsed_ms;
 const report={schema_version:'are.concurrent-probe-result/v1',conditions,known_tokens:serial.known_tokens+parallel.known_tokens,elapsed_ratio:serial.elapsed_ms/parallel.elapsed_ms,success,conclusion:success?'Two-worker GLM execution overlapped and finished this synthetic four-task batch faster, with all eight outputs correct and known token usage. Replication is required before claiming general speedup.':'The bounded probe did not satisfy every throughput criterion. Preserve all failures and timing; no general speedup claim.',authority_effect:'none'};
 assert.ok(report.known_tokens<=frozen.maximum_combined_tokens);
 if(command==='check')assert.deepEqual(read(join(dir,'RESULTS.json')),report);else write('RESULTS.json',report);
 console.log(JSON.stringify({success,known_tokens:report.known_tokens,serial_ms:serial.elapsed_ms,parallel_ms:parallel.elapsed_ms,model_overlap:parallel.maximum_model_overlap,ratio:report.elapsed_ratio}));
}else throw Error('Usage: probe.mjs prepare|run|report|check');
