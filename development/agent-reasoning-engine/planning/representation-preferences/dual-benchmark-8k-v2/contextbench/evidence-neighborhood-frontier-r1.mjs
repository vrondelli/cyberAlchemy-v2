// Offline bounded prototype. Live qualification and dispatch remain separate gates.
// Open questions: EVIDENCE-NEIGHBORHOOD-FRONTIER-R1.md.
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {realpathSync} from 'node:fs';
import {join} from 'node:path';

const MAX_INPUT=65536,MAX_OUTPUT=128*1024**2,MAX_STDERR=4096;
const need=(value,message)=>{if(!value)throw Error('evidence-frontier.'+message);};
const git=(repository,args)=>spawnSync('git',['--no-optional-locks','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',repository,...args],{encoding:'utf8',timeout:10000,maxBuffer:8*1024**2,env:{...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_NO_LAZY_FETCH:'1',GIT_ALLOW_PROTOCOL:'',GIT_TERMINAL_PROMPT:'0'}});

function verifyRepository(repository,base_commit,prefix=''){
  const head=git(repository,['rev-parse','HEAD']),status=git(repository,['status','--porcelain']);
  need(head.status===0&&head.stdout.trim()===base_commit,prefix+'head');
  need(status.status===0&&status.stdout==='',prefix+'dirty-worktree');
}

async function runWorker({python,worker,input,signal,timeout_ms,kill_grace_ms}){
  need(process.platform==='linux','linux-process-group-required');
  need(Number.isSafeInteger(timeout_ms)&&timeout_ms>=1&&timeout_ms<=60000,'timeout');
  need(Number.isSafeInteger(kill_grace_ms)&&kill_grace_ms>=1&&kill_grace_ms<=5000,'kill-grace');
  const wire=Buffer.from(JSON.stringify(input));need(wire.length<=MAX_INPUT,'input-limit');
  if(signal?.aborted)throw Error('evidence-frontier.cancelled-before-spawn');
  return await new Promise((resolve,reject)=>{
    const child=spawn(python,['-B',worker],{stdio:['pipe','pipe','pipe'],detached:true});
    let output=[],outputBytes=0,stderr=[],stderrBytes=0,failure=null,expired=false,cancelled=false,forced=false,killTimer=null;
    const groupExists=()=>{if(!child.pid)return false;try{process.kill(-child.pid,0);return true;}catch(error){return error.code!=='ESRCH';}};
    const signalGroup=kind=>{if(!child.pid)return;try{process.kill(-child.pid,kind);}catch(error){if(error.code!=='ESRCH')failure??='process-group-signal-failed';}};
    const stop=reason=>{
      failure??=reason;
      signalGroup('SIGTERM');
      killTimer??=setTimeout(()=>{forced=true;signalGroup('SIGKILL');},kill_grace_ms);
    };
    const abort=()=>{cancelled=true;stop('cancelled');};
    const deadline=setTimeout(()=>{expired=true;stop('deadline-exceeded');},timeout_ms);
    signal?.addEventListener('abort',abort,{once:true});
    if(signal?.aborted)abort();
    child.on('error',()=>{failure??='spawn-failed';});
    child.on('exit',()=>{if(groupExists()){forced=true;failure??='descendant-process-survived';signalGroup('SIGKILL');}});
    child.stdin.on('error',()=>stop('input-failed'));
    child.stdout.on('data',chunk=>{
      outputBytes+=chunk.length;
      if(outputBytes>MAX_OUTPUT){stop('output-limit');return;}
      output.push(chunk);
    });
    child.stderr.on('data',chunk=>{
      stderrBytes+=chunk.length;
      if(stderrBytes>MAX_STDERR){stop('stderr-limit');return;}
      stderr.push(chunk);
    });
    child.on('close',async(code,termination_signal)=>{
      clearTimeout(deadline);clearTimeout(killTimer);signal?.removeEventListener('abort',abort);
      if(groupExists()){forced=true;failure??='descendant-process-survived';signalGroup('SIGKILL');}
      const until=Date.now()+5000;
      while(groupExists()&&Date.now()<until)await new Promise(done=>setTimeout(done,20));
      const process_group_absent=!groupExists();
      if(!process_group_absent)failure??='process-group-not-settled';
      const settlement={local_settled:process_group_absent,process_group_absent,child_pid:child.pid??null,exit_code:code,termination_signal,forced,deadline_exceeded:expired,cancelled,stderr_bytes:stderrBytes};
      let result=null;
      if(!failure&&code===0){
        try{result=JSON.parse(Buffer.concat(output).toString('utf8'));}
        catch{failure='worker-output-invalid';}
      }
      if(code!==0)failure??='worker-exit';
      if(failure){
        const error=Error('evidence-frontier.worker-'+failure);
        error.process_settlement=settlement;
        error.worker_stderr=Buffer.concat(stderr).toString('utf8');
        reject(error);
      }else resolve({result,settlement});
    });
    child.stdin.end(wire);
  });
}

export async function queryEvidenceNeighborhood({repository,base_commit,queries,python='/usr/bin/python3',worker=join(import.meta.dirname,'ranked_source_frontier_worker_r1.py'),signal,timeout_ms=60000,kill_grace_ms=1000}){
  need(typeof repository==='string'&&realpathSync(repository)===repository,'repository');
  need(/^[a-f0-9]{40}$/.test(base_commit),'base-commit');
  need(queries&&typeof queries==='object'&&!Array.isArray(queries)&&Object.keys(queries).length>=1&&Object.keys(queries).length<=8,'queries');
  verifyRepository(repository,base_commit);
  let operationError,result,settlement;
  try{
    ({result,settlement}=await runWorker({python,worker,input:{repository,base_commit,queries},signal,timeout_ms,kill_grace_ms}));
    need(result.schema==='are.ranked-source-frontier-worker/v1'&&result.ok===true&&result.model_calls===0&&result.post_verification_required===true,'result');
    assert.deepEqual(Object.keys(result.query_results).sort(),Object.keys(queries).sort());
    for(const output of Object.values(result.query_results)){
      need(output.schema==='are.ranked-source-frontier-hints/v1'&&output.index_digest===result.index_digest&&output.hints.length<=10,'query-result');
      need(new Set(output.hints.map(hint=>hint.path)).size===output.hints.length,'path-diversity');
    }
  }catch(error){operationError=error;}
  try{verifyRepository(repository,base_commit,'post-');}
  catch(postError){if(operationError)postError.cause=operationError;throw postError;}
  if(operationError)throw operationError;
  return {...result,process_settlement:settlement};
}
