// Frozen source-only task binding for a new Flipt ui.enabled pair.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runArePilot} from '../deepseek-pilot-are-worker-screen-v2.mjs';

const selected=Object.freeze({
  'contextbench-1':Object.freeze({
    instance_id:'SWE-Bench-Pro__go__maintenance__bugfix__40a717e5',
    file:'SWE-Bench-Pro__go__maintenance__bugfix__40a717e5.json',
    sha256:'a732015e734779014fbb00bdb2f43665661afba42dc7748c4a72ed784d31c3b6',
    commit:'266e5e143e87519047b9be3202a0aba273b83de3',
    cache:'/cache/flipt'
  })
});

export function buildConfirmConfig(base,taskId,bytes){
  const choice=selected[taskId];if(!choice)throw Error('confirm-ui.unknown-task');
  if(createHash('sha256').update(bytes).digest('hex')!==choice.sha256)throw Error('confirm-ui.task-drift');
  const task=JSON.parse(bytes);
  if(task.instance_id!==choice.instance_id||task.base_commit!==choice.commit)throw Error('confirm-ui.identity-drift');
  const template=base.tasks.find(x=>x.id===taskId);if(!template)throw Error('confirm-ui.template-missing');
  return {...base,tasks:[{...template,instance_id:choice.instance_id,task_path:'/tasks/'+choice.file,
    task_sha256:choice.sha256,repository_cache:choice.cache,base_commit:choice.commit,
    cell_template:{...template.cell_template,instance_id:choice.instance_id}}],
    experiment_id:'g02-fresh-ui-enabled-r1'};
}

if(process.argv[1]?.endsWith('/fresh-pair-are.mjs')){
  const taskId=process.argv[2],choice=selected[taskId];if(!choice)throw Error('confirm-ui.unknown-task');
  const base=JSON.parse(readFileSync('/repo/PILOT-CONFIG.json','utf8'));
  const config=buildConfirmConfig(base,taskId,readFileSync('/tasks/'+choice.file));
  const controller=new AbortController();
  process.once('SIGTERM',()=>controller.abort());process.once('SIGINT',()=>controller.abort());
  const result=await runArePilot({config,task_id:taskId,evidence_root:'/evidence',source_root:'/sources',
    secret_path:'/run/secrets/model_api_key',signal:controller.signal,screen_token_ceiling:650000});
  console.log(JSON.stringify({task_id:taskId,status:result.status,model_calls:result.model_calls,
    known_total_tokens:result.known_total_tokens,unknown_usage:result.unknown_usage_dispatched_requests}));
}
