// Evaluator-only driver. Generator receives no gold data. Open questions: ../REPRESENTATION-CEILING.md.
import {readFileSync,writeFileSync,readdirSync,mkdirSync,mkdtempSync,rmSync,existsSync,statfsSync} from 'node:fs';
import {resolve,join,dirname,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {projectDeliveredEvidence} from '../terminal-evidence.mjs';
import {bindDelivery,stable} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const here=import.meta.dirname,root=resolve(here,'../../../../../../..'),parent=dirname(here),v1=resolve(parent,'../../dual-benchmark-8k-v1/contextbench');
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const output=join(parent,'REPRESENTATION-CEILING.json');if(existsSync(output))throw Error('immutable receipt already exists');
const configPath=join(v1,'config.json'),failurePath=join(v1,'FAILURE-ANALYSIS.json'),config=read(configPath),failures=read(failurePath);
const inputs=[configPath,failurePath,join(parent,'terminal-evidence.mjs'),join(here,'representation-ceiling.mjs'),join(here,'representation-ceiling.py')].map(path=>({path:relative(root,path),sha256:hash(path)}));
const disk='/home/vrondelli/.local/share/are/dual-benchmark-8k-v2-replay';mkdirSync(disk,{recursive:true});const fs=statfsSync(disk);if(fs.bsize*fs.bavail<5e9)throw Error('disk headroom below5GB');
const owned=mkdtempSync(join(disk,'owned-ceiling-')),commands=[],checkouts=[],cases=[],evaluators=[];
const git=(cwd,args)=>{const r=spawnSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd,encoding:'utf8',timeout:180000,maxBuffer:1e6});commands.push({cwd,args,status:r.status});if(r.status!==0)throw Error('git failed '+args.join(' '));return r.stdout.trim();};
let passed=false,error=null;
try{
 for(const id of [...new Set(failures.cases.map(c=>c.task_id))]){
  const t=config.tasks.find(t=>t.id===id),task=read(t.task_path),repo=join(owned,id);
  if(git(t.repository_cache,['remote','get-url','origin'])!==task.repo_url)throw Error('origin mismatch');
  git(owned,['clone','--no-local','--no-checkout','--',t.repository_cache,repo]);git(repo,['checkout','--detach',t.base_commit]);
  const head=git(repo,['rev-parse','HEAD']);if(head!==t.base_commit)throw Error('commit mismatch');
  checkouts.push({task_id:id,commit:head,tree:git(repo,['rev-parse','HEAD^{tree}']),created_path:repo,removed:false});
  const payload={task_id:id,instance_id:t.instance_id,repo_url:task.repo_url,base_commit:head,repo_root:repo,cases:[]};
  for(const original of failures.cases.filter(c=>c.task_id===id)){
   const file=resolve(root,original.source.result_path),r=read(file);if(hash(file)!==original.source.result_sha256)throw Error('archive source changed');
   const snapshots=readdirSync(join(dirname(file),'snapshots')).filter(n=>n.endsWith('.json')).sort().map(n=>read(join(dirname(file),'snapshots',n)));
   const delivery=bindDelivery(r);if(delivery.unmapped.length)throw Error('unmapped delivery');
   const projection=projectDeliveredEvidence({reads:delivery.read_observations,snapshots,repoRoot:repo});
   payload.cases.push({arm:original.arm,stage:original.stage,source_result:relative(root,file),source_result_sha256:hash(file),delivered_reads:delivery.read_observations.length,eligible:projection.eligible.map(r=>({path:r.path,base_spans:r.base_spans}))});
  }
  const payloadPath=join(owned,'source-only-projection.json');writeFileSync(payloadPath,JSON.stringify(payload));
  const proc=spawnSync('/home/vrondelli/.local/share/are/contextbench-venv-117/bin/python',[join(here,'representation-ceiling.py'),root,'/home/vrondelli/.local/share/are/contextbench-upstream-117',payloadPath],{encoding:'utf8',timeout:180000,maxBuffer:1e6});
  if(proc.status!==0)throw Error('evaluator failed: '+proc.stderr.slice(-1500));
  const result=JSON.parse(proc.stdout);cases.push(...result.cases);evaluators.push({task_id:id,...Object.fromEntries(Object.entries(result).filter(([k])=>k!=='cases'))});
  if(git(repo,['status','--porcelain'])!=='')throw Error('source checkout changed');
  rmSync(repo,{recursive:true});checkouts.at(-1).removed=true;
 }
 for(const input of inputs)if(hash(resolve(root,input.path))!==input.sha256)throw Error('input drift');
 passed=true;
}catch(e){error=e.message;}
finally{
 rmSync(owned,{recursive:true,force:true});
 writeFileSync(output,JSON.stringify({schema_version:'dual8k.contextbench-representation-ceiling/v1',passed,error,evaluator_only:true,cases,evaluators,bound_inputs:inputs,checkouts,commands,temporary_root_removed:!existsSync(owned),maximum_concurrent_clones:1,model_calls:0,provider_tokenizer_calls:0,gold_access:'isolated evaluator subprocess only; aggregate output; no generator exposure',v1_files_modified:[],scope:'five archived failed cases; all unique provenance-valid whole reads; no presentation count/window restriction',claim_ceiling:'Exact maximum recall and perfect-selection feasibility; proven F1 upper bound, not exact maximum F1 or actual model prediction.',authority_effect:'none',open_questions_ref:'REPRESENTATION-CEILING.md'},null,2)+'\n',{flag:'wx'});
}
if(!passed)throw Error(error);console.log(JSON.stringify({passed,cases}));
