// Offline bounded prototype. Live supervision remains a separate gate.
// Open questions: EVIDENCE-NEIGHBORHOOD-FRONTIER-R1.md.
import assert from 'node:assert/strict';
import {realpathSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const need=(value,message)=>{if(!value)throw Error('evidence-frontier.'+message);};
const git=(repository,args)=>spawnSync('git',['--no-optional-locks','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',repository,...args],{encoding:'utf8',timeout:10000,maxBuffer:8*1024**2,env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_NO_LAZY_FETCH:'1',GIT_ALLOW_PROTOCOL:'',GIT_TERMINAL_PROMPT:'0'}});

export function queryEvidenceNeighborhood({repository,base_commit,queries,python='/usr/bin/python3',worker=join(import.meta.dirname,'ranked_source_frontier_worker_r1.py')}){
  need(typeof repository==='string'&&realpathSync(repository)===repository,'repository');
  need(/^[a-f0-9]{40}$/.test(base_commit),'base-commit');
  need(queries&&typeof queries==='object'&&!Array.isArray(queries)&&Object.keys(queries).length>=1&&Object.keys(queries).length<=8,'queries');
  const beforeHead=git(repository,['rev-parse','HEAD']),beforeStatus=git(repository,['status','--porcelain']);
  need(beforeHead.status===0&&beforeHead.stdout.trim()===base_commit,'head');
  need(beforeStatus.status===0&&beforeStatus.stdout==='','dirty-worktree');
  const child=spawnSync(python,['-B',worker],{input:JSON.stringify({repository,base_commit,queries}),encoding:'utf8',timeout:60000,maxBuffer:128*1024**2});
  need(child.status===0&&!child.signal,'worker');
  const result=JSON.parse(child.stdout);
  need(result.schema==='are.ranked-source-frontier-worker/v1'&&result.ok===true&&result.model_calls===0&&result.post_verification_required===true,'result');
  assert.deepEqual(Object.keys(result.query_results),Object.keys(queries));
  for(const output of Object.values(result.query_results)){
    need(output.schema==='are.ranked-source-frontier-hints/v1'&&output.index_digest===result.index_digest&&output.hints.length<=10,'query-result');
    need(new Set(output.hints.map(hint=>hint.path)).size===output.hints.length,'path-diversity');
  }
  const afterHead=git(repository,['rev-parse','HEAD']),afterStatus=git(repository,['status','--porcelain']);
  need(afterHead.status===0&&afterHead.stdout.trim()===base_commit,'post-head');
  need(afterStatus.status===0&&afterStatus.stdout==='','post-dirty-worktree');
  return result;
}
