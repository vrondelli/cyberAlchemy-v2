// Separately authorized infrastructure repair; no model calls or frozen source edits.
// Open questions: infrastructure-repair.md.
import {readFileSync,writeFileSync,mkdirSync,existsSync,mkdtempSync,rmSync,statfsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const here=import.meta.dirname,read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const configPath=join(here,'config.json'),config=read(configPath),configSha=hash(configPath),output=join(here,'infrastructure-repair.json');
if(existsSync(output))throw Error('repair evidence already exists; no silent rerun');
const diskRoot='/home/vrondelli/.local/share/are/dual8k-infrastructure-repair';mkdirSync(diskRoot,{recursive:true});
const disk=statfsSync(diskRoot);if(disk.bavail*disk.bsize<5_000_000_000)throw Error('insufficient disk headroom');
const work=mkdtempSync(join(diskRoot,'checkout-proof-')),commands=[],tasks=[];
const failures=['control','treatment'].map(arm=>{const directory=resolve(here,'../live/stage1/pairs/contextbench-4/run',arm),path=join(directory,'result.json');const r=read(path),ledgerPath=join(directory,'state/glm-transport-ledger.json'),ledger=existsSync(ledgerPath)?read(ledgerPath):null;return {arm,path,sha256:hash(path),status:r.status,error:r.error,model_receipts:(r.receipts??[]).filter(x=>x.kind==='model').length,transport_ledger_present:ledger!==null,ledger_model_calls:ledger?.model_calls??0,pending_model_dispatch:ledger?.phase==='model-pending'};});
if(failures.some(f=>f.model_receipts!==0||f.ledger_model_calls!==0||f.pending_model_dispatch))throw Error('original failed arm has model evidence; zero-exposure repair cannot apply');
const run=(cwd,args,{recordOutput=true}={})=>{
  const result=spawnSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd,encoding:'utf8',timeout:180000,maxBuffer:16_000_000});
  commands.push({cwd,argv:['git','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],status:result.status,stdout:recordOutput?(result.stdout??'').slice(0,5000):null,stderr:(result.stderr??'').slice(-5000)});
  if(result.status!==0)throw Error('git command failed:'+args.join(' ')+':'+result.stderr);
  return result.stdout.trim();
};
let status='failed',error=null;
try{
  for(const task of config.tasks){
    const cache=task.repository_cache,commit=task.base_commit,taskInput=read(task.task_path);
    const origin=run(cache,['remote','get-url','origin']);if(origin!==taskInput.repo_url)throw Error('source identity mismatch');
    const type=run(cache,['cat-file','-t',commit]),tree=run(cache,['rev-parse',commit+'^{tree}']);
    if(type!=='commit'||run(cache,['cat-file','-t',tree])!=='tree')throw Error('source object type mismatch');
    const reachability=run(cache,['rev-list','--objects','--missing=print',commit],{recordOutput:false}).split('\n');
    const missing=reachability.filter(x=>x.startsWith('?'));if(missing.length)throw Error('source cache has missing objects');
    const refsBefore=run(cache,['for-each-ref','--contains',commit,'--format=%(refname)']).split('\n').filter(Boolean);
    let addedRef=null;
    if(!refsBefore.length){addedRef='refs/heads/are-dual8k-repair-'+commit.slice(0,12);run(cache,['update-ref',addedRef,commit,'0'.repeat(40)]);}
    const refsAfter=run(cache,['for-each-ref','--contains',commit,'--format=%(refname)']).split('\n').filter(Boolean);
    const clone=join(work,task.id);run(work,['clone','--no-local','--no-checkout','--',cache,clone]);
    run(clone,['cat-file','-e',commit+'^{commit}']);run(clone,['cat-file','-e',commit+'^{tree}']);
    run(clone,['checkout','--detach',commit]);
    const head=run(clone,['rev-parse','HEAD']),actualTree=run(clone,['rev-parse','HEAD^{tree}']),clean=run(clone,['status','--porcelain']);
    if(head!==commit||actualTree!==tree||clean!=='')throw Error('isolated source checkout mismatch');
    tasks.push({task_id:task.id,instance_id:task.instance_id,cache,origin,pinned_commit:commit,pinned_tree:tree,objects_checked:reachability.length,missing_objects:missing.length,refs_before:refsBefore,added_ref:addedRef,refs_after:refsAfter,exact_native_clone_transfer:true,detached_worktree_checkout:true,checkout_clean:true});
    rmSync(clone,{recursive:true,force:true});
  }
  for(const failure of failures)if(hash(failure.path)!==failure.sha256)throw Error('original failure evidence changed');
  if(hash(configPath)!==configSha)throw Error('frozen config changed');
  status='repaired-and-all-four-native-checkouts-verified';
}catch(e){error=String(e.message);}
finally{
  writeFileSync(output,JSON.stringify({schema_version:'dual8k.contextbench-infrastructure-repair/v1',status,passed:status==='repaired-and-all-four-native-checkouts-verified',error,config_path:configPath,config_sha256:hash(configPath),source_manifest_path:config.source_manifest,source_manifest_sha256:hash(config.source_manifest),original_failures:failures,diagnosis:'Pinned commit and complete tree existed in CB4 retained cache but had no containing ref; exact native no-local clone omitted unreachable objects.',repair:'Add one branch ref at the already-present exact pinned commit; preserve task revision, source bytes and failed-run artifacts.',tasks,commands,model_calls:0,network_fetches:0,frozen_files_modified:[],authority_effect:'none',open_questions_ref:'infrastructure-repair.md'},null,2)+'\n',{flag:'wx'});
  rmSync(work,{recursive:true,force:true});
}
if(status==='failed')throw Error(error);console.log(JSON.stringify({status,tasks:tasks.length,added_refs:tasks.filter(t=>t.added_ref).map(t=>t.added_ref),model_calls:0}));
