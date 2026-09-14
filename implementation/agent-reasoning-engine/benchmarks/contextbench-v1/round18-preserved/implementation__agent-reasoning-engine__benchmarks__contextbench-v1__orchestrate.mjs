// Isolated task orchestration. A caller must bind/freeze the live client and cell first.
// Open questions: README.md. No credential discovery or provider retry occurs here.
import {mkdirSync,writeFileSync,readFileSync,existsSync,openSync,writeSync,fsyncSync,closeSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {openContextRecycling} from '../../packages/coding-agent-runtime/context-recycling.mjs';
import {createRepositoryTools,tools as repositoryTools} from './repository-tools.mjs';
import {runEpisode} from './episode.mjs';
import {exportModelSelectedContext} from './final-selection.mjs';
import {stable} from './delivery.mjs';
import {cloneSharedPrefix,inspectSharedPrefix} from './shared-prefix.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const save=(path,value)=>writeFileSync(path,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
const recoveryTool={type:'function',function:{name:'recover_observed_read',description:'Recover exact historical observed source using its retrieval_handle; this does not read current disk bytes.',parameters:{type:'object',properties:{retrieval_handle:{type:'string',pattern:'^observed-read:[a-f0-9]{64}$'}},required:['retrieval_handle'],additionalProperties:false}}};
function git(cwd,args){return execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd,encoding:'utf8',timeout:120000,maxBuffer:16000000});}

export async function runPreparedTask({task_path,task_sha256,repository_cache,out,cell,create_client,measure_index_tokens,model_dispatch_enabled=true,pause_after_first_recycle=false}){
  const taskBytes=readFileSync(task_path);
  if(hash(taskBytes)!==task_sha256)throw Error('orchestration.task-digest');
  const task=JSON.parse(taskBytes);
  const allowed=['instance_id','original_inst_id','repo','repo_url','language','base_commit','problem_statement','source'];
  if(Object.keys(task).length!==allowed.length||!allowed.every(k=>typeof task[k]==='string'&&task[k].length>0)||Object.keys(task).some(k=>!allowed.includes(k)))throw Error('orchestration.task-fields');
  if(!/^[a-f0-9]{40}$/.test(task.base_commit)||cell.instance_id!==task.instance_id)throw Error('orchestration.task-cell-mismatch');
  if(typeof create_client!=='function'||typeof measure_index_tokens!=='function')throw Error('orchestration.client-required');
  const root=resolve(out),cache=resolve(repository_cache);
  if(existsSync(root))throw Error('orchestration.existing-run-no-replay');
  // Verify repository identity before copying any issue source into the run.
  if(git(cache,['remote','get-url','origin']).trim()!==task.repo_url)throw Error('orchestration.repository-identity');
  git(cache,['cat-file','-e',`${task.base_commit}^{commit}`]);
  mkdirSync(root,{recursive:true,mode:0o700});
  save(join(root,'started.json'),{task_sha256,cell,status:'started',authority_effect:'none'});
  const journal=openSync(join(root,'events.jsonl'),'wx',0o600),snapshots=new Map();
  const append=value=>{writeSync(journal,stable(value)+'\n');fsyncSync(journal);};
  let recycler,client,result;
  try{
    for(const name of ['base','work']){
      // No local hardlinks or alternates; each run owns its objects/worktrees.
      git(root,['clone','--no-local','--no-checkout','--',cache,name]);
      git(join(root,name),['checkout','--detach',task.base_commit]);
      if(git(join(root,name),['rev-parse','HEAD']).trim()!==task.base_commit)throw Error('orchestration.checkout-mismatch');
    }
    mkdirSync(join(root,'snapshots'));
    const record_source=s=>{
      const key=hash(stable([s.path,s.source_sha256]));
      if(!snapshots.has(key)){save(join(root,'snapshots',`${key}.json`),s);snapshots.set(key,s);}
    };
    const execute_tool=createRepositoryTools({root:join(root,'work'),base_commit:task.base_commit,record_source});
    client=await create_client({cell,task,record_event:append});
    const scope={request:task.problem_statement,instance_id:task.instance_id,cell_id:cell.cell_id,cell_sha256:hash(stable(cell))};
    recycler=openContextRecycling({transport:client.transport,fixture_root:join(root,'base'),scope,options:{directory:join(root,'state'),context_limit:cell.context_limit,recycle_at:cell.recycle_at,safety_margin:cell.safety_margin,
      state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[task.base_commit]}}});
    if(client.bindRunLedger)client.bindRunLedger({directory:join(root,'state'),binding:hash(stable(scope))});
    const episode=await runEpisode({task,arm:cell.arm,client,recycler,tools:[...repositoryTools,recoveryTool],execute_tool,
      measure_index_tokens:text=>measure_index_tokens(text,client),limits:cell.limits,run_id:cell.cell_id,
      source_context:()=>({snapshots:[...snapshots.values()],repoRoot:join(root,'base')}),model_dispatch_enabled,pause_after_first_recycle,on_event:async event=>append(event)});
    result={...episode,index_tokenizer_receipts:client.index_receipts??[],instance_id:task.instance_id,cell_id:cell.cell_id,task_sha256,
      patch:git(join(root,'work'),['diff','--no-ext-diff','--no-textconv','--binary',task.base_commit,'--']),native_export:null};
    save(join(root,'episode.json'),episode);
    if(episode.status==='final_context_selected'&&episode.selection){
      try{
        result.native_export=exportModelSelectedContext({...episode,task,source_snapshots:[...snapshots.values()],response_capture:episode.response_captures.at(-1)},join(root,'base'));
        save(join(root,'prediction.json'),result.native_export.prediction);
        save(join(root,'export-evidence.json'),result.native_export);
      }catch(e){result.export_error=String(e.message);}
    }
    // Base is an evaluator source, never the editable checkout.
    if(git(join(root,'base'),['status','--porcelain']).trim())throw Error('orchestration.base-mutated');
  }catch(e){result={...(result??{}),status:'orchestration_error',error:String(e.message),receipts:client?.receipts??[]};append({kind:'orchestration-error',error:result.error});}
  finally{
    recycler?.close();closeSync(journal);
    if(result){save(join(root,'result.json'),result);save(join(root,'completed.json'),{status:result.status,result_sha256:hash(readFileSync(join(root,'result.json'))),benchmark_cleared:false});}
  }
  return result;
}

const branchComparable=cell=>stable({arm:cell.arm,instance_id:cell.instance_id,context_limit:cell.context_limit,recycle_at:cell.recycle_at,safety_margin:cell.safety_margin,
  provider_profile:cell.provider_profile,limits:Object.fromEntries(Object.entries(cell.limits).filter(([key])=>key!=='task_state_projection'))});

export async function runPreparedBranch({task_path,task_sha256,prefix_root,out,cell,create_client,measure_index_tokens,model_dispatch_enabled=true}){
  const taskBytes=readFileSync(task_path);
  if(hash(taskBytes)!==task_sha256)throw Error('orchestration.task-digest');
  const task=JSON.parse(taskBytes),prefix=resolve(prefix_root),root=resolve(out);
  const inspection=inspectSharedPrefix(prefix),prefixResult=JSON.parse(readFileSync(join(prefix,'result.json'))),prefixStarted=JSON.parse(readFileSync(join(prefix,'started.json'))),prefixCell=prefixStarted.cell;
  if(prefixResult.task_sha256!==task_sha256||prefixResult.instance_id!==task.instance_id||cell.instance_id!==task.instance_id)throw Error('orchestration.branch-task-mismatch');
  if(branchComparable(prefixCell)!==branchComparable(cell))throw Error('orchestration.branch-policy-drift');
  const projected=cell.limits?.task_state_projection;
  if(typeof projected!=='boolean'||!['control','state'].includes(cell.state_arm)||projected!==(cell.state_arm==='state'))throw Error('orchestration.branch-treatment-mismatch');
  if(typeof create_client!=='function'||typeof measure_index_tokens!=='function')throw Error('orchestration.client-required');
  const ancestry=cloneSharedPrefix({prefix_root:prefix,out:root,branch_id:cell.cell_id});
  save(join(root,'started.json'),{task_sha256,cell,prefix_cell_id:prefixCell.cell_id,prefix_tree_digest:inspection.tree_digest,status:'started',authority_effect:'none'});
  const journal=openSync(join(root,'events.jsonl'),'wx',0o600),append=value=>{writeSync(journal,stable(value)+'\n');fsyncSync(journal);};
  let recycler,client,result;
  try{
    const loadSnapshots=()=>readdirSync(join(root,'snapshots')).filter(name=>name.endsWith('.json')).sort().map(name=>JSON.parse(readFileSync(join(root,'snapshots',name))));
    const record_source=source=>{const key=hash(stable([source.path,source.source_sha256]));const path=join(root,'snapshots',`${key}.json`);if(!existsSync(path))save(path,source);};
    const execute_tool=createRepositoryTools({root:join(root,'work'),base_commit:task.base_commit,record_source});
    client=await create_client({cell,task,record_event:append});
    const scope={request:task.problem_statement,instance_id:task.instance_id,cell_id:prefixCell.cell_id,cell_sha256:hash(stable(prefixCell))};
    recycler=openContextRecycling({transport:client.transport,fixture_root:join(root,'base'),scope,options:{directory:join(root,'state'),context_limit:cell.context_limit,recycle_at:cell.recycle_at,safety_margin:cell.safety_margin,
      state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[task.base_commit]}}});
    recycler.initialHistory(prefixResult.continuation.state.history);
    if(client.bindRunLedger)client.bindRunLedger({directory:join(root,'state'),binding:hash(stable(scope)),require_existing:true});
    const episode=await runEpisode({task,arm:cell.arm,client,recycler,tools:[...repositoryTools,recoveryTool],execute_tool,
      measure_index_tokens:text=>measure_index_tokens(text,client),limits:cell.limits,run_id:cell.cell_id,continuation:prefixResult.continuation,
      source_context:()=>({snapshots:loadSnapshots(),repoRoot:join(root,'base')}),model_dispatch_enabled,on_event:async event=>append(event)});
    result={...episode,index_tokenizer_receipts:client.index_receipts??[],instance_id:task.instance_id,cell_id:cell.cell_id,task_sha256,prefix_ancestry:ancestry,
      prefix_model_tokens:prefixResult.receipts?.filter(receipt=>receipt.kind==='model').reduce((sum,receipt)=>sum+(receipt.input_tokens??0)+(receipt.output_tokens??0),0)??0,
      patch:git(join(root,'work'),['diff','--no-ext-diff','--no-textconv','--binary',task.base_commit,'--']),native_export:null};
    save(join(root,'episode.json'),episode);
    if(episode.status==='final_context_selected'&&episode.selection){
      try{result.native_export=exportModelSelectedContext({...episode,task,source_snapshots:loadSnapshots(),response_capture:episode.response_captures.at(-1)},join(root,'base'));save(join(root,'prediction.json'),result.native_export.prediction);save(join(root,'export-evidence.json'),result.native_export);}
      catch(e){result.export_error=String(e.message);}
    }
    if(git(join(root,'base'),['status','--porcelain']).trim())throw Error('orchestration.base-mutated');
  }catch(e){result={...(result??{}),status:'orchestration_error',error:String(e.message),receipts:client?.receipts??[]};append({kind:'orchestration-error',error:result.error});}
  finally{
    recycler?.close();closeSync(journal);
    if(result){save(join(root,'result.json'),result);save(join(root,'completed.json'),{status:result.status,result_sha256:hash(readFileSync(join(root,'result.json'))),benchmark_cleared:false});}
  }
  return result;
}
