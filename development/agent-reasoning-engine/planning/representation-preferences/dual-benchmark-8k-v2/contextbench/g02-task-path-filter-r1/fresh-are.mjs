// Exact source-only prospective task. Gold is absent from the worker.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {runArePilot} from '../deepseek-pilot-are-worker-screen-v2.mjs';

const choice=Object.freeze({
 instance_id:'SWE-Bench-Pro__javascript__maintenance__bugfix__14ef25ae',
 file:'SWE-Bench-Pro__javascript__maintenance__bugfix__14ef25ae.json',
 sha256:'cd932a746cfe2292b6f15e6727054bf32b8f0827421b91d2233c5b496a6eb7c4',
 commit:'f24b630e1afcb8135144be66d67a09a61b21753e',cache:'/cache/nodebb',
});
export function buildFreshConfig(base,taskId,bytes){
 if(taskId!=='contextbench-2'||createHash('sha256').update(bytes).digest('hex')!==choice.sha256)throw Error('task-path-fresh.task-drift');
 const task=JSON.parse(bytes),template=base.tasks.find(x=>x.id===taskId);
 if(!template||task.instance_id!==choice.instance_id||task.base_commit!==choice.commit)throw Error('task-path-fresh.identity-drift');
 return {...base,tasks:[{...template,instance_id:choice.instance_id,task_path:'/tasks/'+choice.file,
  task_sha256:choice.sha256,repository_cache:choice.cache,base_commit:choice.commit,
  cell_template:{...template.cell_template,instance_id:choice.instance_id}}],
  experiment_id:'g02-task-path-prospective-r1'};
}
if(process.argv[1]?.endsWith('/fresh-pair-are.mjs')){
 const base=JSON.parse(readFileSync('/repo/PILOT-CONFIG.json','utf8'));
 const config=buildFreshConfig(base,'contextbench-2',readFileSync('/tasks/'+choice.file));
 const controller=new AbortController();
 process.once('SIGTERM',()=>controller.abort());process.once('SIGINT',()=>controller.abort());
 const result=await runArePilot({config,task_id:'contextbench-2',evidence_root:'/evidence',source_root:'/sources',
  secret_path:'/run/secrets/model_api_key',signal:controller.signal,screen_token_ceiling:650000});
 console.log(JSON.stringify({task_id:'contextbench-2',status:result.status,model_calls:result.model_calls,
  known_total_tokens:result.known_total_tokens,unknown_usage:result.unknown_usage_dispatched_requests}));
}
