// Fixed source-only confirmation tasks. Gold never enters this worker.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runArePilot} from '../deepseek-pilot-are-worker-screen-v2.mjs';

const selected=Object.freeze({
 'contextbench-1':Object.freeze({instance_id:'SWE-Bench-Pro__go__maintenance__bugfix__997c7afd',file:'SWE-Bench-Pro__go__maintenance__bugfix__997c7afd.json',sha256:'6a594c11a2657f7c0ee08fc95586017b4564ae936cc700125c6d8ab56c83dc78',commit:'e432032cf2d11e3bb6f558748a5ee41a90640daa',cache:'/cache/flipt'}),
 'contextbench-2':Object.freeze({instance_id:'SWE-Bench-Pro__javascript__maintenance__bugfix__93b583ae',file:'SWE-Bench-Pro__javascript__maintenance__bugfix__93b583ae.json',sha256:'891e224a109e0ac1a2aca54cf6d31caeeda7ffb62b40d30fe7ac7daa30bac8fe',commit:'8fd8079a84d8e71ab02eaa69ef15cb33fcea85c7',cache:'/cache/nodebb'})
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
  experiment_id:'g02-callcap16-confirm-r1'};
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
