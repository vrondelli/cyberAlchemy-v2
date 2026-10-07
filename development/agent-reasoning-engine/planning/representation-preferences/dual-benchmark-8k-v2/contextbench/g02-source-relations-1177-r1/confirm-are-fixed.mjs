// Fixed-candidate G02 task binding. The per-task JSON is source-only and hash-pinned.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runArePilot} from '../deepseek-pilot-are-worker-screen-v2.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const binding=JSON.parse(readFileSync('/tasks/binding.json','utf8'));
const safe=value=>typeof value==='string'&&/^[A-Za-z0-9_.-]+$/.test(value);
if(!safe(binding.task_file)||!binding.task_file.endsWith('.json')||
   !safe(binding.cache)||!safe(binding.experiment_id)||
   !/^[a-f0-9]{64}$/.test(binding.task_sha256)||
   !/^[a-f0-9]{40}$/.test(binding.base_commit))throw Error('fixed-pair.invalid-binding');

export function buildConfirmConfig(base,taskId,bytes){
  if(taskId!=='contextbench-1')throw Error('fixed-pair.unknown-task');
  if(sha(bytes)!==binding.task_sha256)throw Error('fixed-pair.task-drift');
  const task=JSON.parse(bytes);
  if(task.instance_id!==binding.instance_id||task.base_commit!==binding.base_commit)
    throw Error('fixed-pair.identity-drift');
  const template=base.tasks.find(x=>x.id===taskId);
  if(!template)throw Error('fixed-pair.template-missing');
  return {...base,tasks:[{...template,instance_id:task.instance_id,
    task_path:'/tasks/'+binding.task_file,task_sha256:binding.task_sha256,
    repository_cache:'/cache/'+binding.cache,base_commit:task.base_commit,
    cell_template:{...template.cell_template,instance_id:task.instance_id}}],
    experiment_id:binding.experiment_id};
}

if(process.argv[1]?.endsWith('/fresh-pair-are.mjs')){
  const taskId=process.argv[2];
  const base=JSON.parse(readFileSync('/repo/PILOT-CONFIG.json','utf8'));
  const config=buildConfirmConfig(base,taskId,readFileSync('/tasks/'+binding.task_file));
  const controller=new AbortController();
  process.once('SIGTERM',()=>controller.abort());process.once('SIGINT',()=>controller.abort());
  const result=await runArePilot({config,task_id:taskId,evidence_root:'/evidence',source_root:'/sources',
    secret_path:'/run/secrets/model_api_key',signal:controller.signal,screen_token_ceiling:650000});
  console.log(JSON.stringify({task_id:taskId,status:result.status,model_calls:result.model_calls,
    known_total_tokens:result.known_total_tokens,unknown_usage:result.unknown_usage_dispatched_requests}));
}
