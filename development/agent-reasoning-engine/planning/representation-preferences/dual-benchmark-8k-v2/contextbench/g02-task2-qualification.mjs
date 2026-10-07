// Provider-free qualification and freeze-package construction for the G02 task-2 descendant.
import {createHash} from 'node:crypto';
import {closeSync,lstatSync,openSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {G02_FULL_WINDOW,buildG02FullWindowCell} from './deepseek-full-window-profile-g02-v1.mjs';
import {G02_WORKER_BINDING} from './deepseek-pilot-are-worker-g02-v1.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const repoDefault=resolve(here,'../../../../../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const stable=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
const need=(ok,code)=>{if(!ok)throw Error('g02-qualification.'+code);};
const SOURCE_PATHS=Object.freeze([
  'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-full-window-profile-g02-v1.mjs',
  'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-pilot-are-worker-g02-v1.mjs',
  'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/orchestrate-recovery-g02-v1.mjs',
  'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/episode-recovery-g02-v1.mjs',
  'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/transport-bounded-g02-v1.mjs',
  'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-response-batch-policy-v1.mjs',
  'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-remote-mounted-glm-v1.mjs',
  'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-gateway-observation-v1.mjs'
]);
const TASK_PATH='development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/full-cycle-80/snapshot/tasks/contextbench-2.json';
const CONFIG_PATH='development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/full-cycle-80/snapshot/PILOT-CONFIG.json';
const VPS_PATH='implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ARE-DSH-VPS-QUALIFICATION.v1.json';
const AJV_ROOT='implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules/ajv';
export const EXACT_TASK=Object.freeze({id:'contextbench-2',instance_id:'Multi-SWE-Bench__cpp__maintenance__bugfix__64aeac91',sha256:'1184ec718b6f23c1fb6d864cdaabc915feff08335e383f109eb3f401cbaff722'});

function bytes(root,path){return readFileSync(resolve(root,path));}
function binding(root,path){return {path,sha256:sha(bytes(root,path))};}
function loadJson(root,path){return JSON.parse(bytes(root,path));}
function sourceClosure(root,entries){
  const pending=[...entries],seen=new Set(),rows=[];
  while(pending.length){
    const path=pending.pop();if(seen.has(path))continue;seen.add(path);
    const source=bytes(root,path),text=source.toString('utf8');rows.push({path,sha256:sha(source)});
    const directory=dirname(path),pattern=/(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g;
    for(let match;(match=pattern.exec(text));){
      if(!match[1].startsWith('.'))continue;
      const dependency=relative(root,resolve(root,directory,match[1])).split('\\').join('/');
      need(dependency!==''&&!dependency.startsWith('..'),'source-outside-repository');
      pending.push(dependency);
    }
  }
  return rows.sort((a,b)=>a.path.localeCompare(b.path));
}

export function buildDevelopmentSuccessorSourceClosure({repo_root=repoDefault}={}){
  const root=resolve(repo_root),source_entries=Object.freeze([...SOURCE_PATHS]),sources=sourceClosure(root,source_entries);
  need(!source_entries.some(path=>path.endsWith('/g02-vps-probe-adapter-v1.mjs')),'self-referential-adapter-closure');
  return Object.freeze({schema_version:'are.g02-development-successor-source-closure/v1',execution_mode:'development',predecessor_package_digest:'60f636fb13d46039088524d817f5eb0385b3dfa51a00a459006965fd68c0d3e8',source_entries,sources,prelaunch_authorization_required:false,cryptographic_signatures_required:false,independent_postrun_review_required:true,final_successor_freeze_available:false,missing:['live-vps-qualification'],authority_effect:'none'});
}
function treeBinding(root,path){
  const files=[],directory=resolve(root,path);
  const visit=(absolute,relativePath)=>{
    for(const name of readdirSync(absolute).sort()){
      const child=join(absolute,name),childRelative=join(relativePath,name).split('\\').join('/'),stat=lstatSync(child);
      need(!stat.isSymbolicLink(),'ajv-symlink');
      if(stat.isDirectory())visit(child,childRelative);
      else if(stat.isFile())files.push(binding(root,childRelative));
    }
  };
  visit(directory,path);
  return {path,file_count:files.length,tree_sha256:sha(stable(files))};
}

export function dryRunExactTask({repo_root=repoDefault,task_path=TASK_PATH,config_path=CONFIG_PATH}={}){
  const root=resolve(repo_root),taskBytes=bytes(root,task_path),task=JSON.parse(taskBytes),frozen=loadJson(root,config_path);
  need(sha(taskBytes)===EXACT_TASK.sha256,'task-digest');
  need(task.instance_id===EXACT_TASK.instance_id,'task-identity');
  const sourceTask=frozen.tasks.find(row=>row.id===EXACT_TASK.id);
  need(sourceTask?.task_sha256===EXACT_TASK.sha256&&sourceTask.instance_id===EXACT_TASK.instance_id,'config-task-binding');
  const config={...frozen,full_window_profile:G02_FULL_WINDOW.id,tasks:[{...sourceTask,task_path:resolve(root,task_path)}]};
  const cell=buildG02FullWindowCell({config,task_id:EXACT_TASK.id});
  need(cell.limits.maximum_tool_batch_corrections===1,'correction-budget');
  need(cell.provider_profile.request_budget===G02_FULL_WINDOW.request_budget,'request-budget');
  need(G02_WORKER_BINDING.episode.endsWith('episode-recovery-g02-v1.mjs')&&G02_WORKER_BINDING.transport.endsWith('transport-bounded-g02-v1.mjs'),'worker-binding');
  return Object.freeze({schema_version:'are.g02-task2-dry-run/v1',status:'qualified-provider-free',task:{...EXACT_TASK,path:task_path},worker_binding:G02_WORKER_BINDING,
    budgets:{context_limit:cell.context_limit,recycle_at:cell.recycle_at,safety_margin:cell.safety_margin,total_tokens:cell.limits.total_tokens,maximum_calls:cell.limits.maximum_calls,output_cap:cell.limits.output_cap,maximum_tool_batch_corrections:cell.limits.maximum_tool_batch_corrections,request_budget:cell.provider_profile.request_budget,maximum_request_bytes:G02_FULL_WINDOW.maximum_request_bytes,maximum_response_bytes:G02_FULL_WINDOW.maximum_response_bytes},
    provider_calls:0,credentials_accessed:false,network_accessed:false,launch_enabled:false,authority_effect:'none'});
}

export function buildFreezePackage({repo_root=repoDefault,output_path=null}={}){
  const root=resolve(repo_root),dry_run=dryRunExactTask({repo_root:root});
  const ajvPackagePath=join(AJV_ROOT,'package.json'),ajvRuntimePath=join(AJV_ROOT,'dist/ajv.js');
  const ajvPackage=loadJson(root,ajvPackagePath),vps=loadJson(root,VPS_PATH);
  const requiredVpsChecks=['immutable_identity','install_integrity','capacity_isolation','native_subprocess','local_adapter_tests','glm_profile','token_boundary','durable_accounting','benchmark_adapter'];
  const missingVps=requiredVpsChecks.filter(key=>vps.checks?.[key]!==true);
  const sources=sourceClosure(root,SOURCE_PATHS);
  const manifest={schema_version:'are.g02-task2-freeze-package/v1',candidate_id:'contextbench-task2-g02-v1',
    task:binding(root,TASK_PATH),config_source:binding(root,CONFIG_PATH),source_entries:[...SOURCE_PATHS],sources,
    runtime:{node_version:process.version,node_exec_path:process.execPath,node_exec_sha256:sha(readFileSync(process.execPath))},
    ajv:{name:ajvPackage.name,version:ajvPackage.version,package:binding(root,ajvPackagePath),runtime:binding(root,ajvRuntimePath),package_tree:treeBinding(root,AJV_ROOT),mode:'strict',validate_formats:false},
    response_policy:{id:'g02-v1',recoverable_tool_calls:{minimum:9,maximum:32},maximum_corrections:1,terminal_requires_tool_calls_absent:true},
    budgets:dry_run.budgets,vps_profile:{...binding(root,VPS_PATH),host_ref:vps.host_ref,dsh_version:vps.dsh_version,image_digest:vps.image_digest,benchmark_ready:vps.benchmark_ready,missing_checks:missingVps},
    execution_mode:'development',development_execution:{prelaunch_authorization_required:false,cryptographic_signatures_required:false,independent_postrun_review_required:true},
    dry_run,launch:{enabled:missingVps.length===0,gate:missingVps.length?'vps-qualification':'none',blocked_by:missingVps.length?['vps-qualification-incomplete']:[]},
    model_calls:0,credentials_accessed:false,provider_network_accessed:false,authority_effect:'none'};
  manifest.package_digest=sha(stable(manifest));
  if(output_path){
    const target=resolve(output_path);need(relative(root,target)!==''&&!relative(root,target).startsWith('..'),'output-outside-repository');
    const descriptor=openSync(target,'wx',0o600);
    try{writeFileSync(descriptor,JSON.stringify(manifest,null,2)+'\n');}finally{closeSync(descriptor);}
  }
  return Object.freeze(manifest);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const mode=process.argv[2]??'dry-run';
  if(mode==='dry-run')console.log(JSON.stringify(dryRunExactTask(),null,2));
  else if(mode==='freeze')console.log(JSON.stringify(buildFreezePackage({output_path:process.argv[3]??null}),null,2));
  else throw Error('g02-qualification.unknown-mode');
}
