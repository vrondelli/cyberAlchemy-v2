// Source-only fresh G02 paired probe. Gold is never mounted during generation.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runArePilot} from '../deepseek-pilot-are-worker-screen-v2.mjs';

const selected=Object.freeze({
  'contextbench-1':Object.freeze({instance_id:'SWE-Bench-Pro__go__maintenance__bugfix__6efcf999',file:'SWE-Bench-Pro__go__maintenance__bugfix__6efcf999.json',sha256:'d85d82580cbf8733ae3ad977581392f8bc3d46cecf7036e8c89a381c9e7e3b56',commit:'91cc1b9fc38280a53a36e1e9543d87d7306144b2',cache:'/cache/flipt'}),
  'contextbench-2':Object.freeze({instance_id:'SWE-Bench-Pro__javascript__maintenance__bugfix__bc5ac89f',file:'SWE-Bench-Pro__javascript__maintenance__bugfix__bc5ac89f.json',sha256:'c4d920d0970b4c5a1b809b67e19a88399aa46b53e5a1a18d233e039e6c490bc5',commit:'09f3ac6574b3192497df0403306aff8d6f20448b',cache:'/cache/nodebb'})
});

export function buildFreshConfig(base,taskId,taskBytes){
  const choice=selected[taskId];
  if(!choice)throw Error('fresh-pair.unknown-task');
  if(createHash('sha256').update(taskBytes).digest('hex')!==choice.sha256)throw Error('fresh-pair.task-drift');
  const task=JSON.parse(taskBytes);
  if(task.instance_id!==choice.instance_id||task.base_commit!==choice.commit)throw Error('fresh-pair.identity-drift');
  const template=base.tasks.find(x=>x.id===taskId);
  if(!template)throw Error('fresh-pair.missing-template');
  return {...base,tasks:[{...template,instance_id:choice.instance_id,task_path:'/tasks/'+choice.file,
    task_sha256:choice.sha256,repository_cache:choice.cache,base_commit:choice.commit,
    cell_template:{...template.cell_template,instance_id:choice.instance_id}}],
    experiment_id:'g02-fresh-pair-20260926'};
}

if(process.argv[1]?.endsWith('/fresh-pair-are.mjs')){
  const taskId=process.argv[2],choice=selected[taskId];
  if(!choice)throw Error('fresh-pair.unknown-task');
  const base=JSON.parse(readFileSync('/repo/PILOT-CONFIG.json','utf8'));
  const config=buildFreshConfig(base,taskId,readFileSync('/tasks/'+choice.file));
  const controller=new AbortController();
  process.once('SIGTERM',()=>controller.abort());process.once('SIGINT',()=>controller.abort());
  const result=await runArePilot({config,task_id:taskId,evidence_root:'/evidence',source_root:'/sources',
    secret_path:'/run/secrets/model_api_key',signal:controller.signal,screen_token_ceiling:650000});
  console.log(JSON.stringify({task_id:taskId,status:result.status,model_calls:result.model_calls,
    known_total_tokens:result.known_total_tokens,unknown_usage:result.unknown_usage_dispatched_requests}));
}
