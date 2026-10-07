#!/usr/bin/env node
// Frozen, single-use development runner for the G02 task-2 benchmark.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {closeSync,existsSync,fsyncSync,lstatSync,mkdirSync,openSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {runArePilotG02} from './deepseek-pilot-are-worker-g02-v1.mjs';
import {G02_FULL_WINDOW} from './deepseek-full-window-profile-g02-v1.mjs';
import {createG02VpsLocalPost,createRemoteMountedCredentialBinding} from './g02-remote-mounted-glm-v1.mjs';
import {buildDevelopmentSuccessorSourceClosure} from './g02-task2-qualification.mjs';

const here=dirname(fileURLToPath(import.meta.url)),sha=value=>createHash('sha256').update(value).digest('hex');
const fileSha=path=>sha(readFileSync(path)),stable=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
const need=(ok,code)=>{if(!ok)throw Error('g02-development-run.'+code);};
function exactFile(path,digest,code){path=resolve(path);const stat=lstatSync(path);need(stat.isFile()&&!stat.isSymbolicLink()&&fileSha(path)===digest,code);return path;}
function writeExclusive(path,value){mkdirSync(dirname(path),{recursive:true,mode:0o700});const fd=openSync(path,'wx',0o600);try{writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}const directory=openSync(dirname(path),'r');try{fsyncSync(directory);}finally{closeSync(directory);}}
function codeBindings(){
  const repositoryRoot=resolve(here,'../../../../../..'),closure=buildDevelopmentSuccessorSourceClosure({repo_root:repositoryRoot});
  const qualificationPath=join(here,'g02-task2-qualification.mjs');
  const rows=[{path:fileURLToPath(import.meta.url),sha256:fileSha(fileURLToPath(import.meta.url))},{path:qualificationPath,sha256:fileSha(qualificationPath)},...closure.sources.map(row=>({path:resolve(repositoryRoot,row.path),sha256:row.sha256}))];
  const visit=directory=>{for(const entry of readdirSync(directory,{withFileTypes:true})){const path=join(directory,entry.name);need(!entry.isSymbolicLink(),'code-symlink');if(entry.isDirectory())visit(path);else{need(entry.isFile(),'code-entry');rows.push({path,sha256:fileSha(path)});}}};
  visit(join(repositoryRoot,'implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules'));
  visit(join(repositoryRoot,'implementation/agent-reasoning-engine/packages/coding-agent-runtime'));
  return Object.fromEntries(rows.sort((a,b)=>a.path.localeCompare(b.path)).map((row,index)=>[`source_${String(index).padStart(3,'0')}`,row]));
}
function gitHead(path){const result=spawnSync('git',['-c',`safe.directory=${path}`,'-C',path,'rev-parse','HEAD'],{encoding:'utf8',timeout:30000});need(result.status===0,'repository-git');return result.stdout.trim();}

export function prepareG02Task2DevelopmentFreeze({configPath,taskPath,repositoryCache,qualificationPath,outputRoot,freezePath}){
  for(const path of [configPath,taskPath,repositoryCache,qualificationPath,outputRoot,freezePath])need(typeof path==='string','prepare-arguments');
  configPath=resolve(configPath);taskPath=resolve(taskPath);repositoryCache=resolve(repositoryCache);qualificationPath=resolve(qualificationPath);outputRoot=resolve(outputRoot);freezePath=resolve(freezePath);
  need(!existsSync(freezePath)&&!existsSync(outputRoot),'single-use-target');const taskBytes=readFileSync(taskPath),qualification=JSON.parse(readFileSync(qualificationPath)),source=JSON.parse(readFileSync(configPath));
  need(sha(taskBytes)==='1184ec718b6f23c1fb6d864cdaabc915feff08335e383f109eb3f401cbaff722','task-drift');need(qualification.benchmark_ready===true&&qualification.execution_mode==='development','qualification');
  const original=source.tasks.find(row=>row.id==='contextbench-2');need(original?.base_commit==='c5c43e9c7ff613bf01ca14b9b9083d38a6efd5fc','task-config');need(gitHead(repositoryCache)===original.base_commit,'repository-commit');
  const config={...source,full_window_profile:G02_FULL_WINDOW.id,tasks:[{...original,task_path:taskPath,repository_cache:repositoryCache}]},material={schema_version:'are.g02-task2-development-freeze/v1',execution_mode:'development',prelaunch_authorization_required:false,cryptographic_signatures_required:false,independent_postrun_review_required:true,execution_host:'187.77.163.194',task_id:'contextbench-2',task_sha256:sha(taskBytes),repository_cache:repositoryCache,repository_commit:original.base_commit,qualification:{path:qualificationPath,sha256:fileSha(qualificationPath),receipt_digest:qualification.receipt_digest},config,code_bindings:codeBindings(),caps:{maximum_workers:1,maximum_calls:G02_FULL_WINDOW.maximum_calls,total_tokens:G02_FULL_WINDOW.total_tokens,context_limit:G02_FULL_WINDOW.context_limit,output_cap:G02_FULL_WINDOW.output_cap,maximum_request_bytes:G02_FULL_WINDOW.maximum_request_bytes,maximum_response_bytes:G02_FULL_WINDOW.maximum_response_bytes,automatic_retries:0},output_root:outputRoot,provider_boundary:{container:'are-keld-presentation-provider-gateway-1',secret_path:'/run/secrets/model_api_key',secret_crosses_container_boundary:false},authority_effect:'none'};
  const freeze={...material,freeze_digest:sha(stable(material))};writeExclusive(freezePath,freeze);return freeze;
}

export async function runG02Task2Development({freezePath,signal=new AbortController().signal}){
  freezePath=resolve(freezePath);const freeze=JSON.parse(readFileSync(freezePath)),material={...freeze};delete material.freeze_digest;need(freeze.schema_version==='are.g02-task2-development-freeze/v1'&&freeze.execution_mode==='development'&&freeze.prelaunch_authorization_required===false&&freeze.cryptographic_signatures_required===false&&freeze.freeze_digest===sha(stable(material)),'freeze');
  need(freeze.execution_host==='187.77.163.194'&&freeze.caps.maximum_workers===1&&freeze.caps.automatic_retries===0,'caps');for(const binding of Object.values(freeze.code_bindings))exactFile(binding.path,binding.sha256,'code-drift');exactFile(freeze.qualification.path,freeze.qualification.sha256,'qualification-drift');need(gitHead(freeze.repository_cache)===freeze.repository_commit,'repository-drift');need(!existsSync(freeze.output_root),'single-use-output');
  mkdirSync(freeze.output_root,{mode:0o700});const launch={schema_version:'are.g02-task2-development-launch/v1',freeze_path:freezePath,freeze_sha256:fileSha(freezePath),freeze_digest:freeze.freeze_digest,qualification_receipt_digest:freeze.qualification.receipt_digest,task_sha256:freeze.task_sha256,repository_commit:freeze.repository_commit,caps:freeze.caps,output_root:freeze.output_root,prelaunch_authorization_required:false,cryptographic_signatures_required:false,postrun_review_status:'pending',started_at:new Date().toISOString(),authority_effect:'none'};launch.launch_digest=sha(stable(launch));writeExclusive(join(freeze.output_root,'DEVELOPMENT-LAUNCH.json'),launch);
  const evidence=join(freeze.output_root,'evidence'),sources=join(freeze.output_root,'sources');mkdirSync(evidence,{mode:0o700});mkdirSync(sources,{mode:0o700});let result,error=null;
  try{result=await runArePilotG02({config:freeze.config,task_id:freeze.task_id,evidence_root:evidence,source_root:sources,signal,credential_binding:createRemoteMountedCredentialBinding(),post:createG02VpsLocalPost()});}catch(cause){error=String(cause.message);}
  const resultPath=join(evidence,'RESULTS.json'),seal={schema_version:'are.g02-task2-development-seal/v1',terminal:true,status:!error&&result?.status==='final_context_selected'?'completed':'failed',freeze_sha256:fileSha(freezePath),launch_digest:launch.launch_digest,result_sha256:existsSync(resultPath)?fileSha(resultPath):null,result:result??null,error,postrun_review_status:'pending',completed_at:new Date().toISOString(),authority_effect:'none'};writeExclusive(join(freeze.output_root,'SEAL.json'),seal);return seal;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const mode=process.argv[2];if(mode==='prepare'){assert.equal(process.argv.length,9,'usage: prepare CONFIG TASK REPOSITORY QUALIFICATION OUTPUT FREEZE');console.log(JSON.stringify(prepareG02Task2DevelopmentFreeze({configPath:process.argv[3],taskPath:process.argv[4],repositoryCache:process.argv[5],qualificationPath:process.argv[6],outputRoot:process.argv[7],freezePath:process.argv[8]})));}
  else if(mode==='run'){assert.equal(process.argv.length,4,'usage: run FREEZE');const seal=await runG02Task2Development({freezePath:process.argv[3]});console.log(JSON.stringify({status:seal.status,result_status:seal.result?.status??null}));}
  else throw Error('g02-development-run.mode');
}
