// Source-only confirmation wrapper; mounted over the fresh-pair entry point.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runArePilot} from '../deepseek-pilot-are-worker-screen-v2.mjs';

const selected=Object.freeze({
  'contextbench-2':Object.freeze({
    instance_id:'SWE-Bench-Pro__javascript__maintenance__bugfix__e31ec45c',
    file:'SWE-Bench-Pro__javascript__maintenance__bugfix__e31ec45c.json',
    sha256:'d54918fefde9f74b64d158511e2c1ec0453118fec8695a8935957e23de5b0004',
    commit:'f0d989e4ba5b0dccff6e56022fc6d378d05ab404',
    cache:'/cache/nodebb'
  })
});

export function buildConfirmConfig(base,taskId,bytes){
  const choice=selected[taskId];if(!choice)throw Error('confirm.unknown-task');
  if(createHash('sha256').update(bytes).digest('hex')!==choice.sha256)throw Error('confirm.task-drift');
  const task=JSON.parse(bytes);
  if(task.instance_id!==choice.instance_id||task.base_commit!==choice.commit)throw Error('confirm.identity-drift');
  const template=base.tasks.find(x=>x.id===taskId);if(!template)throw Error('confirm.template-missing');
  return {...base,tasks:[{...template,instance_id:choice.instance_id,task_path:'/tasks/'+choice.file,
    task_sha256:choice.sha256,repository_cache:choice.cache,base_commit:choice.commit,
    cell_template:{...template.cell_template,instance_id:choice.instance_id}}],
    experiment_id:'g02-broad-hints-confirm-r1'};
}

if(process.argv[1]?.endsWith('/fresh-pair-are.mjs')){
  const taskId=process.argv[2],choice=selected[taskId];if(!choice)throw Error('confirm.unknown-task');
  const base=JSON.parse(readFileSync('/repo/PILOT-CONFIG.json','utf8'));
  const config=buildConfirmConfig(base,taskId,readFileSync('/tasks/'+choice.file));
  const controller=new AbortController();
  process.once('SIGTERM',()=>controller.abort());process.once('SIGINT',()=>controller.abort());
  const result=await runArePilot({config,task_id:taskId,evidence_root:'/evidence',source_root:'/sources',
    secret_path:'/run/secrets/model_api_key',signal:controller.signal,screen_token_ceiling:650000});
  console.log(JSON.stringify({task_id:taskId,status:result.status,model_calls:result.model_calls,
    known_total_tokens:result.known_total_tokens,unknown_usage:result.unknown_usage_dispatched_requests}));
}
