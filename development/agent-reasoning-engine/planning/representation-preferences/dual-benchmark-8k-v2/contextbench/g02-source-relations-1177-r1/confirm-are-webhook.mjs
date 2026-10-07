// Frozen source-only binding for the next deterministic Flipt Go task.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runArePilot} from '../deepseek-pilot-are-worker-screen-v2.mjs';

const selected=Object.freeze({
  'contextbench-1':Object.freeze({
    instance_id:'SWE-Bench-Pro__go__maintenance__bugfix__43d6d59b',
    file:'SWE-Bench-Pro__go__maintenance__bugfix__43d6d59b.json',
    sha256:'35edd7fc4f9e2b6f5b5c83e51ccffb91fd3722e8906952027f9596736d726e81',
    commit:'32864671f44b7bbd9edc8e2bc1d6255906c31f5b',
    cache:'/cache/flipt'
  })
});

export function buildConfirmConfig(base,taskId,bytes){
  const choice=selected[taskId];if(!choice)throw Error('confirm-webhook.unknown-task');
  if(createHash('sha256').update(bytes).digest('hex')!==choice.sha256)throw Error('confirm-webhook.task-drift');
  const task=JSON.parse(bytes);
  if(task.instance_id!==choice.instance_id||task.base_commit!==choice.commit)throw Error('confirm-webhook.identity-drift');
  const template=base.tasks.find(x=>x.id===taskId);if(!template)throw Error('confirm-webhook.template-missing');
  return {...base,tasks:[{...template,instance_id:choice.instance_id,task_path:'/tasks/'+choice.file,
    task_sha256:choice.sha256,repository_cache:choice.cache,base_commit:choice.commit,
    cell_template:{...template.cell_template,instance_id:choice.instance_id}}],
    experiment_id:'g02-fresh-webhook-r1'};
}

if(process.argv[1]?.endsWith('/fresh-pair-are.mjs')){
  const taskId=process.argv[2],choice=selected[taskId];if(!choice)throw Error('confirm-webhook.unknown-task');
  const base=JSON.parse(readFileSync('/repo/PILOT-CONFIG.json','utf8'));
  const config=buildConfirmConfig(base,taskId,readFileSync('/tasks/'+choice.file));
  const controller=new AbortController();
  process.once('SIGTERM',()=>controller.abort());process.once('SIGINT',()=>controller.abort());
  const result=await runArePilot({config,task_id:taskId,evidence_root:'/evidence',source_root:'/sources',
    secret_path:'/run/secrets/model_api_key',signal:controller.signal,screen_token_ceiling:650000});
  console.log(JSON.stringify({task_id:taskId,status:result.status,model_calls:result.model_calls,
    known_total_tokens:result.known_total_tokens,unknown_usage:result.unknown_usage_dispatched_requests}));
}
