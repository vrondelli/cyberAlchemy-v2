import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
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
  return {repository:resolve(repository),base_commit:git('rev-parse','HEAD')};
}

test('one pinned index serves multiple path-diverse facets',t=>{
  const input=fixture(t),result=queryEvidenceNeighborhood({...input,queries:{task:'needle',verification:'needle second'}});
  assert.equal(result.model_calls,0);assert.deepEqual(Object.keys(result.query_results),['task','verification']);
  for(const output of Object.values(result.query_results)){
    assert.equal(output.hints.length,10);assert.equal(new Set(output.hints.map(h=>h.path)).size,10);
    assert.equal(output.maximum_hints,10);assert.equal(output.matching_paths,12);
  }
});

test('dirty checkout is rejected before indexing',t=>{
  const input=fixture(t);writeFileSync(join(input.repository,'source-00.txt'),'changed\n');
  assert.throws(()=>queryEvidenceNeighborhood({...input,queries:{task:'needle'}}),/dirty-worktree/);
});

test('pinned Git blobs defeat assume-unchanged worktree substitution',t=>{
  const input=fixture(t),path=join(input.repository,'source-00.txt');
  execFileSync('git',['update-index','--assume-unchanged','source-00.txt'],{cwd:input.repository});
  writeFileSync(path,'substituted secret phrase\n');
  const result=queryEvidenceNeighborhood({...input,queries:{task:'substituted secret phrase'}});
  assert.equal(result.query_results.task.matching_paths,0);
  assert.deepEqual(result.query_results.task.hints,[]);
});

test('query and commit envelopes fail closed',t=>{
  const input=fixture(t);
  assert.throws(()=>queryEvidenceNeighborhood({...input,base_commit:'0'.repeat(40),queries:{task:'needle'}}),/head/);
  assert.throws(()=>queryEvidenceNeighborhood({...input,queries:{}}),/queries/);
  assert.throws(()=>queryEvidenceNeighborhood({...input,queries:Object.fromEntries(Array.from({length:9},(_,i)=>['q'+i,'needle']))}),/queries/);
});
