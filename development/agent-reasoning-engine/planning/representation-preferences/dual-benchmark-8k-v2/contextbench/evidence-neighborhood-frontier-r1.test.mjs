import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {queryEvidenceNeighborhood} from './evidence-neighborhood-frontier-r1.mjs';

function fixture(t){
  const repository=mkdtempSync(join(tmpdir(),'evidence-frontier-'));
  t.after(()=>rmSync(repository,{recursive:true,force:true}));
  const git=(...args)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd:repository,encoding:'utf8'}).trim();
  git('init','-q');
  for(let i=0;i<12;i++)writeFileSync(join(repository,`source-${String(i).padStart(2,'0')}.txt`),`needle line ${i}\nneedle second ${i}\n`);
  git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture');
  return {repository:resolve(repository),base_commit:git('rev-parse','HEAD'),git};
}

function worker(t,body){
  const root=mkdtempSync(join(tmpdir(),'evidence-frontier-worker-')),path=join(root,'worker.py');
  t.after(()=>rmSync(root,{recursive:true,force:true}));writeFileSync(path,body);return path;
}

const validWorker=`
import json,sys
request=json.load(sys.stdin)
keys=list(request["queries"])
result={"schema":"are.ranked-source-frontier-worker/v1","ok":True,"model_calls":0,"post_verification_required":True,"index_digest":"fixture","query_results":{key:{"schema":"are.ranked-source-frontier-hints/v1","index_digest":"fixture","hints":[]} for key in keys}}
print(json.dumps(result))
`;

test('one pinned index serves multiple path-diverse facets',async t=>{
  const input=fixture(t),result=await queryEvidenceNeighborhood({...input,queries:{task:'needle',verification:'needle second'}});
  assert.equal(result.model_calls,0);assert.deepEqual(Object.keys(result.query_results),['task','verification']);
  assert.equal(result.process_settlement.local_settled,true);assert.equal(result.process_settlement.forced,false);
  for(const output of Object.values(result.query_results)){
    assert.equal(output.hints.length,10);assert.equal(new Set(output.hints.map(h=>h.path)).size,10);
    assert.equal(output.maximum_hints,10);assert.equal(output.matching_paths,12);
  }
});

test('dirty checkout is rejected before indexing',async t=>{
  const input=fixture(t);writeFileSync(join(input.repository,'source-00.txt'),'changed\n');
  await assert.rejects(queryEvidenceNeighborhood({...input,queries:{task:'needle'}}),/dirty-worktree/);
});

for(const flag of ['--assume-unchanged','--skip-worktree'])test(`pinned Git blobs defeat ${flag} worktree substitution`,async t=>{
  const input=fixture(t),path=join(input.repository,'source-00.txt');
  execFileSync('git',['update-index',flag,'source-00.txt'],{cwd:input.repository});
  writeFileSync(path,'substituted secret phrase\n');
  const result=await queryEvidenceNeighborhood({...input,queries:{task:'substituted secret phrase'}});
  assert.equal(result.query_results.task.matching_paths,0);
  assert.deepEqual(result.query_results.task.hints,[]);
});

test('canonical content hashes bind raw Git object bytes despite CRLF worktree bytes',async t=>{
  const input=fixture(t),path=join(input.repository,'source-00.txt');
  execFileSync('git',['update-index','--assume-unchanged','source-00.txt'],{cwd:input.repository});
  writeFileSync(path,'needle line 0\r\nneedle second 0\r\n');
  const object=execFileSync('git',['show',`${input.base_commit}:source-00.txt`],{cwd:input.repository});
  assert.notDeepEqual(readFileSync(path),object);
  const result=await queryEvidenceNeighborhood({...input,queries:{task:'needle line 0'}});
  const hint=result.query_results.task.hints.find(value=>value.path==='source-00.txt');
  assert.equal(hint.content_sha256,createHash('sha256').update(object).digest('hex'));
});

test('query and commit envelopes fail closed',async t=>{
  const input=fixture(t);
  await assert.rejects(queryEvidenceNeighborhood({...input,base_commit:'0'.repeat(40),queries:{task:'needle'}}),/head/);
  await assert.rejects(queryEvidenceNeighborhood({...input,queries:{}}),/queries/);
  await assert.rejects(queryEvidenceNeighborhood({...input,queries:Object.fromEntries(Array.from({length:9},(_,i)=>['q'+i,'needle']))}),/queries/);
});

test('deadline escalates and settles the worker process group',async t=>{
  const input=fixture(t),path=worker(t,`import signal,sys,time\nsignal.signal(signal.SIGTERM,lambda *_:None)\nsys.stdin.buffer.read()\ntime.sleep(60)\n`);
  let error;try{await queryEvidenceNeighborhood({...input,queries:{task:'needle'},worker:path,timeout_ms:50,kill_grace_ms:20});}catch(value){error=value;}
  assert.match(error.message,/deadline-exceeded/);assert.equal(error.process_settlement.process_group_absent,true);
  assert.equal(error.process_settlement.deadline_exceeded,true);assert.equal(error.process_settlement.forced,true);
});

test('cancellation settles the worker process group',async t=>{
  const input=fixture(t),path=worker(t,`import signal,sys,time\nsignal.signal(signal.SIGTERM,lambda *_:None)\nsys.stdin.buffer.read()\ntime.sleep(60)\n`),controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),50);let error;
  try{await queryEvidenceNeighborhood({...input,queries:{task:'needle'},worker:path,signal:controller.signal,kill_grace_ms:20});}catch(value){error=value;}finally{clearTimeout(timer);}
  assert.match(error.message,/cancelled/);assert.equal(error.process_settlement.process_group_absent,true);
  assert.equal(error.process_settlement.cancelled,true);
});

test('a surviving descendant is killed and cannot produce success',async t=>{
  const input=fixture(t),path=worker(t,`import json,subprocess,sys\nrequest=json.load(sys.stdin)\nsubprocess.Popen([sys.executable,"-c","import time;time.sleep(60)"])\nkeys=list(request["queries"])\nresult={"schema":"are.ranked-source-frontier-worker/v1","ok":True,"model_calls":0,"post_verification_required":True,"index_digest":"fixture","query_results":{key:{"schema":"are.ranked-source-frontier-hints/v1","index_digest":"fixture","hints":[]} for key in keys}}\nprint(json.dumps(result),flush=True)\n`);
  let error;try{await queryEvidenceNeighborhood({...input,queries:{task:'needle'},worker:path,kill_grace_ms:20});}catch(value){error=value;}
  assert.match(error.message,/descendant-process-survived/);assert.equal(error.process_settlement.process_group_absent,true);assert.equal(error.process_settlement.forced,true);
});

test('parent post-verification rejects a worker worktree mutation',async t=>{
  const input=fixture(t),path=worker(t,`import json,pathlib,sys\nrequest=json.load(sys.stdin)\npathlib.Path(request["repository"],"source-00.txt").write_text("mutated by worker\\n")\nkeys=list(request["queries"])\nresult={"schema":"are.ranked-source-frontier-worker/v1","ok":True,"model_calls":0,"post_verification_required":True,"index_digest":"fixture","query_results":{key:{"schema":"are.ranked-source-frontier-hints/v1","index_digest":"fixture","hints":[]} for key in keys}}\nprint(json.dumps(result))\n`);
  await assert.rejects(queryEvidenceNeighborhood({...input,queries:{task:'needle'},worker:path}),/post-dirty-worktree/);
});

test('bounded worker success retains settlement evidence',async t=>{
  const input=fixture(t),path=worker(t,validWorker),result=await queryEvidenceNeighborhood({...input,queries:{task:'needle'},worker:path});
  assert.equal(result.process_settlement.process_group_absent,true);assert.equal(result.process_settlement.exit_code,0);
});
