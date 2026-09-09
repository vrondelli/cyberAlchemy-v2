import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseCredential, runConfiguredGlm} from './cli.mjs';
import {runTransactionalPatchSet} from '../patch-set-runtime.mjs';
import {snapshotTree} from '../verifier.mjs';
import {hash, MODEL, need} from './transport.mjs';
import {validateRetentionPolicy} from './retention.mjs';

const specification = `Implement createQueue() in src/queue.mjs, exporting it as a named function.
Each queue is independent and exposes enqueue(job), dequeue(), and size().
A job must be a non-null, non-array object with a non-empty string id; otherwise enqueue throws TypeError.
enqueue returns true when added. If that id is already queued it returns false and preserves the original job.
dequeue returns the oldest queued job, or null if empty. Removing a job frees its id for reuse.
size returns the number of currently queued jobs. Preserve FIFO order and do not mutate caller objects.
Inspect the source and README through tools before proposing a patch. Change only src/queue.mjs.`;
const tests = `import test from 'node:test';
import assert from 'node:assert/strict';
import {createQueue} from '../src/queue.mjs';
test('empty',()=>{const q=createQueue();assert.equal(q.size(),0);assert.equal(q.dequeue(),null);});
test('fifo',()=>{const q=createQueue();const a={id:'a',payload:1},b={id:'b',payload:2};assert.equal(q.enqueue(a),true);assert.equal(q.enqueue(b),true);assert.equal(q.size(),2);assert.deepEqual(q.dequeue(),a);assert.deepEqual(q.dequeue(),b);assert.equal(q.size(),0);});
test('duplicates preserve original',()=>{const q=createQueue();q.enqueue({id:'x',payload:1});assert.equal(q.enqueue({id:'x',payload:2}),false);assert.equal(q.size(),1);assert.deepEqual(q.dequeue(),{id:'x',payload:1});});
test('reuse after removal',()=>{const q=createQueue();q.enqueue({id:'x'});q.dequeue();assert.equal(q.enqueue({id:'x'}),true);assert.equal(q.size(),1);});
test('invalid jobs',()=>{for(const bad of [null,undefined,[],1,'a',{}, {id:''},{id:5}])assert.throws(()=>createQueue().enqueue(bad),TypeError);});
test('independent instances',()=>{const a=createQueue(),b=createQueue();a.enqueue({id:'one'});assert.equal(b.size(),0);assert.equal(b.dequeue(),null);});
test('frozen input and tricky IDs',()=>{const q=createQueue();for(const id of ['__proto__','constructor','toString'])assert.equal(q.enqueue(Object.freeze({id})),true);assert.equal(q.size(),3);assert.equal(q.dequeue().id,'__proto__');});
`;
export function createFixture(directory) {
 const root=join(directory,'fixture');mkdirSync(join(root,'src'),{recursive:true});mkdirSync(join(root,'test'));
 writeFileSync(join(root,'README.md'),specification+'\n');
 writeFileSync(join(root,'src','queue.mjs'),'export function createQueue() { throw new Error("not implemented"); }\n');
 writeFileSync(join(root,'test','queue.test.mjs'),tests);
 return root;
}
export function verifyCandidate(root, candidate, destination) {
 cpSync(root,destination,{recursive:true});
 const command=[process.execPath,'--permission',`--allow-fs-read=${destination}`,'--test','--test-isolation=none','--test-reporter=tap','test/queue.test.mjs'];
 const sandbox={run(actual){
   if(JSON.stringify(actual)!==JSON.stringify(command))return {ok:false,reason_codes:['verification.command-denied']};
   const r=spawnSync(actual[0],actual.slice(1),{cwd:destination,env:{LANG:'C',LC_ALL:'C'},encoding:'utf8',timeout:10000,maxBuffer:65536});
   const complete=r.status===0 && /^# tests 7\s*$/m.test(r.stdout??'') && /^# pass 7\s*$/m.test(r.stdout??'') && /^# fail 0\s*$/m.test(r.stdout??'');
   return {ok:complete,reason_codes:complete?[]:['verification.tests-failed'],observed_exit:r.status,
     stdout:r.stdout??'',stderr:r.stderr??'',permissions:'read fixture only; no writes, network, subprocesses, workers or addons',authority_effect:'none'};
 }};
 const result=runTransactionalPatchSet({run_id:'glm-canary-verification',fixture_root:destination,raw_candidate:candidate,
   mutation_allowlist:['src/queue.mjs'],approve:true,verification_sandbox:sandbox,verification_command:command});
 return result;
}

export function addRecyclingFixture(root) {
 const paths=['cases-first.json','cases-second.json'];
 for(const [part,path] of paths.entries()) {
  const cases=Array.from({length:28},(_,i)=>({
   name:`FIFO duplicate and ID reuse example ${part*28+i}`,
   operations:[['enqueue',{id:`job-${part*28+i}`,payload:i}],['enqueue',{id:`job-${part*28+i}`,payload:'duplicate'}],['size'],['dequeue'],['dequeue'],['enqueue',{id:`job-${part*28+i}`,payload:'reused'}],['size']],
   expected:[true,false,1,{id:`job-${part*28+i}`,payload:i},null,true,1]
  }));
  writeFileSync(join(root,path),JSON.stringify(cases)+'\n');
 }
 return paths;
}

export function assessRecycling(output, paths) {
 const history=output.history??[],dispatches=output.recycling?.dispatches??[];
 const readPaths=new Set(history.flatMap(entry=>(entry.calls??[]).filter((call,i)=>call.name==='read-file' && entry.observations?.[i]?.ok).map(call=>call.arguments.path)));
 const evidenceAfterRecycle=history.some((entry,i)=>dispatches[i]?.generation>0 && entry.calls?.some((call,j)=>call.name==='read-context-evidence' && entry.observations?.[j]?.ok));
 return {required_files_read:paths.every(path=>readPaths.has(path)),recycled:(output.recycling?.recycles??0)>0,
  dispatched_after_recycle:dispatches.some(d=>d.generation>0),evidence_read_after_recycle:evidenceAfterRecycle};
}

export function canaryRequest(casePaths) {
 return specification+(casePaths.length?`\nBefore proposing, read ${casePaths.join(' and ')} through read-file, one file per model turn, to inspect the acceptance examples. The fixture files remain available across recycling. Once per run, after the first recycle, call read-context-evidence with the current history_ref and max_chars 1024. This requirement is satisfied when inspection_progress.archived_evidence_read_after_recycle is true; later generation changes do not reset it. Use inspection_progress.successful_file_reads to track completed inspections across all generations, and do not repeat them solely because raw history or recent_progress omitted them. Retrieve details again only if needed to implement correctly. Implement the queue and propose the patch after these inspections.`:'');
}

export async function runCanary(credential = {provider_kind:'local-sops-age',provider_id:'local-model-secrets',locator:'model/zai-key'}, {create_client, report = console.log, scenario='queue', retention_policy='clear-v1', expected_task, recycle_at} = {}) {
 // Validate before creating a fixture or persisting configuration.
 const selectedCredential=parseCredential(credential);
 validateRetentionPolicy(retention_policy);
 need(recycle_at===undefined || (scenario==='queue-recycling' && [5000,8000].includes(recycle_at)),'canary-threshold-invalid');
 need(['queue','queue-recycling'].includes(scenario),'canary-scenario-invalid');
 const dir=mkdtempSync(join(tmpdir(),'are-glm-flash-canary-'));
 const root=createFixture(dir);
 const casePaths=scenario==='queue-recycling'?addRecyclingFixture(root):[];
 const before=snapshotTree(root);
 const request=canaryRequest(casePaths);
 if(expected_task) need(hash(request)===expected_task.request_sha256 && before.tree_sha256===expected_task.fixture_tree_sha256,'paired-task-drift');
 const config={schema_version:'are.glm-flash-config/v1',model:MODEL,
   credential:selectedCredential,retention_policy,
   run_id:'glm-flash-'+scenario+'-'+Date.now(),request,fixture_root:root,state_directory:join(dir,'state'),
   observation_allowlist:['README.md','src/queue.mjs',...casePaths],mutation_allowlist:['src/queue.mjs'],context_limit:16384,recycle_at:recycle_at ?? (casePaths.length?5000:12000),safety_margin:1024};
 writeFileSync(join(dir,'config.json'),JSON.stringify(config,null,2)+'\n',{mode:0o600});
 report(JSON.stringify({status:'RUNNING',directory:dir,model:MODEL,scenario,maximum_model_calls:12,maximum_output_tokens:2048}));
 const output=await runConfiguredGlm(config,{create_client});
 writeFileSync(join(dir,'agent-result.json'),JSON.stringify(output,null,2)+'\n',{mode:0o600});
 const verification=output.status==='AWAITING_APPROVAL'?verifyCandidate(root,output.candidate,join(dir,'verification')):null;
 const modelReceipts=output.receipts.filter(r=>r.kind==='model');
 const continuity=casePaths.length?assessRecycling(output,casePaths):null;
 const unchanged=snapshotTree(root).tree_sha256===before.tree_sha256;
 const reads=output.history.flatMap(entry=>(entry.calls??[]).map((call,i)=>({call,ok:entry.observations?.[i]?.ok===true}))).filter(({call})=>call.name==='read-file');
 const readCounts=Object.fromEntries([...new Set(reads.map(({call})=>call.arguments.path))].map(path=>[path,reads.filter(({call})=>call.arguments.path===path).length]));
 const receipt={schema_version:'are.glm-live-canary/v1',model:MODEL,directory:dir,scenario,continuity,retention_policy,
  request_sha256:hash(request),fixture_tree_sha256:before.tree_sha256,fixture_files:before.files,
  context_policy:{context_limit:config.context_limit,recycle_at:config.recycle_at,safety_margin:config.safety_margin,maximum_output_tokens:2048},
  read_counts:{attempts:reads.length,successful:reads.filter(r=>r.ok).length,unique_paths:Object.keys(readCounts).length,by_path:readCounts},
  dispatch_headroom:(output.recycling?.dispatches??[]).map(d=>({...d,soft_headroom_tokens:config.recycle_at-d.projected_upper_bound,hard_headroom_tokens:config.context_limit-d.projected_upper_bound})),
  status:verification?.status==='PATCH_CANDIDATE' && unchanged && (!continuity || Object.values(continuity).every(Boolean))?'PASS_BOUNDED':'BLOCK',agent_status:output.status,reasons:output.reason_codes??[],
  model_requests:modelReceipts.length,tokenizer_requests:output.receipts.filter(r=>r.kind==='tokenizer').length,
  model_usage:{input:modelReceipts.reduce((s,r)=>s+(r.input_tokens??0),0),output:modelReceipts.reduce((s,r)=>s+(r.output_tokens??0),0),reasoning:modelReceipts.reduce((s,r)=>s+(r.reasoning_tokens??0),0),cached:modelReceipts.reduce((s,r)=>s+(r.cached_tokens??0),0)},
  elapsed_model_ms:modelReceipts.reduce((s,r)=>s+r.latency_ms,0),recycles:output.recycling?.recycles,
  original_fixture_unchanged:unchanged,
  verification,agent_result_sha256:hash(readFileSync(join(dir,'agent-result.json'),'utf8')),cost_usd:null,authority_effect:'none',product_approval:'not-requested'};
 writeFileSync(join(dir,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
 report(JSON.stringify({...receipt,verification:verification?{status:verification.status,changed_paths:verification.changed_paths,observed_exit:verification.verification?.observed_exit}:null}));
 return receipt;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2);
  const scenario=args[0]==='--recycle'?(args.shift(),'queue-recycling'):'queue';
  need(args.length===0 || (args.length===2 && args[0]==='--credential'),'usage-credential-file-required');
  const credential=args.length===0?undefined:JSON.parse(readFileSync(resolve(args[1]),'utf8'));
  const r=await runCanary(credential,{scenario});process.exitCode=r.status==='PASS_BOUNDED'?0:1;
 }catch{console.error('Canary failed; check --credential file and any reported private run directory.');process.exitCode=1;}
}
