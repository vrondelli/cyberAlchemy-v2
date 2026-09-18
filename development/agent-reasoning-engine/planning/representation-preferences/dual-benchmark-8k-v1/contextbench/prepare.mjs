// No provider calls and no gold values. Open questions: README.md.
import { readFileSync, writeFileSync, existsSync, statfsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { compactRequest } from './representation.mjs';
const here=import.meta.dirname, root=resolve(here,'../../../../../..'), read=p=>JSON.parse(readFileSync(p));
const research=resolve(root,'agent-reasoning-engine/research/contextbench-v1');
const frozen=read(resolve(research,'freeze-round52-execution.json'));
const matrix=read(frozen.matrix_ref), manifest=read(frozen.task_manifest_ref), inventory=read(frozen.repository_inventory_ref);
const digest=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const tasks=matrix.tasks.slice(0,4).map((task,index)=>{
  const entry=manifest.tasks.find(x=>x.instance_id===task.instance_id),repository=inventory.repositories.find(x=>x.instance_id===task.instance_id);
  const task_path=resolve(frozen.task_directory,entry.file);
  if(digest(task_path)!==entry.sha256)throw Error('task binding drift');
  execFileSync('git',['-C',repository.cache_path,'cat-file','-e',task.base_commit+'^{commit}']);
  const tree=execFileSync('git',['-C',repository.cache_path,'ls-tree','-rl',task.base_commit],{encoding:'utf8',maxBuffer:16_000_000});
  const source_bytes=tree.split('\n').reduce((s,l)=>s+(Number(l.split('\t')[0]?.trim().split(/\s+/).at(-1))||0),0);
  return {id:'contextbench-'+(index+1),instance_id:task.instance_id,task_path,task_sha256:entry.sha256,repository_cache:repository.cache_path,base_commit:task.base_commit,repository_source_bytes:source_bytes,cell_template:matrix.prefixes[index]};
});
const rows=[];
for(const [index,task] of tasks.entries()){
  const path=resolve('/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round52-live',matrix.prefixes[index].cell_id,'result.json');
  const prior=read(path);let original=0, compact=0;
  for(const capture of prior.captures){const req=JSON.parse(capture.prompt);original+=Buffer.byteLength(JSON.stringify(req));compact+=Buffer.byteLength(JSON.stringify(compactRequest(req)));}
  rows.push({instance_id:task.instance_id,captures:prior.captures.length,original_bytes:original,compact_bytes:compact,byte_reduction:1-compact/original,token_reduction:null,claim:'offline byte proxy only; not measured token savings'});
}
const config={schema_version:'dual8k.contextbench/v1',tasks,context_limit:8000,total_tokens_per_arm:96000,model:'glm-5.3-flash',credential_path:'/home/vrondelli/.config/are/glm-flash-credential.json',python:frozen.python,upstream:frozen.upstream,scorer:frozen.scorer,scoring_cache:frozen.scoring_cache,source_manifest:resolve(root,'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-manifest.json'),authority_effect:'none',open_questions_ref:'README.md'};
for(const key of ['python','upstream','scorer','source_manifest'])if(!existsSync(config[key]))throw Error('dependency missing:'+key);
writeFileSync(resolve(here,'config.json'),JSON.stringify(config,null,2)+'\n');
writeFileSync(resolve(here,'offline-preflight.json'),JSON.stringify({status:'local-ready-no-model-calls',tasks:tasks.map(({cell_template,...task})=>task),archived_request_byte_projection:rows,selection:'first four identities in the existing Round52 development order; no quality or gold selection',long_task_scope:'full native repository trajectories; repository source size is eligibility evidence, actual multiple-call pressure and full cumulative usage must be reported',model_calls:0,authority_effect:'none',open_questions_ref:'README.md'},null,2)+'\n');
console.log(JSON.stringify({tasks:tasks.length,byte_projection:rows.map(x=>x.byte_reduction)}));
