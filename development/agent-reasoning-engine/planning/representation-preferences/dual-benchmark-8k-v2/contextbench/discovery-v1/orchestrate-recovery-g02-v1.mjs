// Additive G02 response-batch recovery orchestration. Open questions: ORCHESTRATE-RECOVERY.md.
// Open questions: INTEGRATION.md. No credential discovery or provider retry occurs here.
import {mkdirSync,readFileSync,existsSync,lstatSync} from 'node:fs';
import {resolve,join,relative,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {openContextRecycling} from '../packet-diversity-v1/context-recycling-bounded-v3.mjs';
import {createRepositoryTools,tools as repositoryTools} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {runEpisode} from './episode-recovery-g02-v1.mjs';
import {exportTerminalEvidenceSelection} from '../terminal-evidence.mjs';
import {exportModelSelectedContext} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs';
import {stable} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const recoveryTool={type:'function',function:{name:'recover_observed_read',description:'Recover exact historical observed source using its retrieval_handle; this does not read current disk bytes.',parameters:{type:'object',properties:{retrieval_handle:{type:'string',pattern:'^observed-read:[a-f0-9]{64}$'}},required:['retrieval_handle'],additionalProperties:false}}};
function git(cwd,args){return execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-c',`safe.directory=${resolve(cwd)}`,...args],{cwd,encoding:'utf8',timeout:120000,maxBuffer:16000000});}

export async function runPreparedTask(options){
  const state={client:null,result:null,episode_entered:false,errors:[]};
  try{return await runPreparedTaskImpl(options,state);}catch(error){
    const receipts=state.client?.receipts??[],models=receipts.filter(r=>r.kind==='model');
    const known=models.every(r=>r.dispatched===false||(r.dispatched===true&&Number.isSafeInteger(r.input_tokens)&&r.input_tokens>=0&&Number.isSafeInteger(r.output_tokens)&&r.output_tokens>=0));
    const unknown_usage=!known||(state.episode_entered&&models.length===0);
    const usage={prompt_tokens:0,completion_tokens:0,total_tokens:0};
    if(!unknown_usage)for(const r of models)if(r.dispatched){usage.prompt_tokens+=r.input_tokens;usage.completion_tokens+=r.output_tokens;usage.total_tokens+=r.input_tokens+r.output_tokens;}
    const result={...(state.result??{}),status:'orchestration_error',error:String((state.original_error??error).message),persistence_failures:state.errors,receipts,native_export:null,benchmark_cleared:false,unknown_usage};
    throw Object.assign(Error('orchestration.failed-with-accounting: '+String((state.original_error??error).message)),{cause:state.original_error??error,final_error:error,original_receipt:(state.original_error??error).receipt??null,result,receipts,unknown_usage,...(!unknown_usage?{usage,receipt:{kind:'orchestration',usage,persistence_failure:state.errors.length>0}}:{})});
  }
}
async function runPreparedTaskImpl({task_path,task_sha256,repository_cache,out,cell,create_client,measure_index_tokens,model_dispatch_enabled=true,pause_after_first_recycle=false,before_model_dispatch=async()=>true,persistence,evidence_root,source_out,admit_source,io={}},state){
  const guarded=(stage,fn)=>{try{return fn();}catch(error){state.errors.push({stage,error:String(error.message),code:error.code??null});state.original_error??=error;throw error;}};
  if(!persistence||!['writeJson','append','atomicJson','createLock','removeLock'].every(k=>typeof persistence[k]==='function'))throw Error('orchestration.guarded-persistence-required');
  if(typeof source_out!=='string'||typeof evidence_root!=='string'||typeof admit_source!=='function')throw Error('orchestration.source-admission-required');
  const save=(path,value)=>guarded('save:'+path,()=>persistence.writeJson(path,value));
  const taskBytes=readFileSync(task_path);
  if(hash(taskBytes)!==task_sha256)throw Error('orchestration.task-digest');
  const task=JSON.parse(taskBytes);
  const allowed=['instance_id','original_inst_id','repo','repo_url','language','base_commit','problem_statement','source'];
  if(Object.keys(task).length!==allowed.length||!allowed.every(k=>typeof task[k]==='string'&&task[k].length>0)||Object.keys(task).some(k=>!allowed.includes(k)))throw Error('orchestration.task-fields');
  if(!/^[a-f0-9]{40}$/.test(task.base_commit)||cell.instance_id!==task.instance_id)throw Error('orchestration.task-cell-mismatch');
  if(typeof create_client!=='function'||typeof measure_index_tokens!=='function')throw Error('orchestration.client-required');
  const root=resolve(out),cache=resolve(repository_cache),sourceRoot=resolve(source_out),evidenceRoot=resolve(evidence_root);
  // Reject aliases even when the final destination does not exist yet.
  for(const path of [root,cache,sourceRoot,evidenceRoot]){
    let cursor=sep;for(const piece of path.split(sep).filter(Boolean)){cursor=join(cursor,piece);
      try{if(lstatSync(cursor).isSymbolicLink())throw Error('orchestration.symlink-path');}catch(e){if(e.code!=='ENOENT')throw e;}
    }
  }
  const within=(a,b)=>{const r=relative(a,b);return r===''||(!r.startsWith('..'+sep)&&r!=='..'&&!r.startsWith(sep));};
  if(!within(evidenceRoot,root)||root===evidenceRoot||within(evidenceRoot,sourceRoot)||within(sourceRoot,evidenceRoot)||within(cache,sourceRoot)||within(sourceRoot,cache)||within(cache,evidenceRoot)||within(evidenceRoot,cache))throw Error('orchestration.source-evidence-overlap');
  if(existsSync(sourceRoot))throw Error('orchestration.existing-source-no-replay');
  if(existsSync(root))throw Error('orchestration.existing-run-no-replay');
  // Verify repository identity before copying any issue source into the run.
  if(git(cache,['remote','get-url','origin']).trim()!==task.repo_url)throw Error('orchestration.repository-identity');
  git(cache,['cat-file','-e',`${task.base_commit}^{commit}`]);
  if(await admit_source({task,cache,source_root:sourceRoot,phase:'before-prepare'})!==true)throw Error('orchestration.source-admission-denied');
  mkdirSync(root,{recursive:true,mode:0o700});
  save(join(root,'started.json'),{task_sha256,cell,status:'started',authority_effect:'none'});
  const journal=join(root,'events.jsonl'),snapshots=new Map();
  const append=value=>guarded('journal-append',()=>{persistence.append(journal,stable(value)+'\n');});
  let recycler,client,result;
  try{
    mkdirSync(sourceRoot,{recursive:true,mode:0o700});
    for(const name of ['base','work']){
      if(await admit_source({task,cache,source_root:sourceRoot,phase:'before-'+name})!==true)throw Error('orchestration.source-admission-denied');
      // No local hardlinks or alternates; each run owns its objects/worktrees.
      // A local clone asks the source repository to serve objects, so both the
      // command working directory and the exact read-only cache must be trusted
      // for this one process. Do not mutate global Git configuration.
      git(sourceRoot,['-c',`safe.directory=${cache}`,'clone','--no-local','--no-checkout','--',cache,name]);
      git(join(sourceRoot,name),['checkout','--detach',task.base_commit]);
      if(git(join(sourceRoot,name),['rev-parse','HEAD']).trim()!==task.base_commit)throw Error('orchestration.checkout-mismatch');
    }
    mkdirSync(join(root,'snapshots'));
    const record_source=s=>{
      const key=hash(stable([s.path,s.source_sha256]));
      if(!snapshots.has(key)){save(join(root,'snapshots',`${key}.json`),s);snapshots.set(key,s);}
    };
    const execute_tool=createRepositoryTools({root:join(sourceRoot,'work'),base_commit:task.base_commit,record_source});
    client=await create_client({cell,task,record_event:append});state.client=client;
    const scope={request:task.problem_statement,instance_id:task.instance_id,cell_id:cell.cell_id,cell_sha256:hash(stable(cell))};
    recycler=openContextRecycling({persistence,transport:client.transport,fixture_root:join(sourceRoot,'base'),scope,options:{directory:join(root,'state'),context_limit:cell.context_limit,recycle_at:cell.recycle_at,safety_margin:cell.safety_margin,
      state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[task.base_commit]}}});
    if(client.bindRunLedger)client.bindRunLedger({directory:join(root,'state'),binding:hash(stable(scope))});
    state.episode_entered=true;
    const episode=await runEpisode({task,arm:cell.arm,client,recycler,tools:[...repositoryTools,recoveryTool],execute_tool,
      measure_index_tokens:text=>measure_index_tokens(text,client),limits:cell.limits,run_id:cell.cell_id,
      source_context:()=>({snapshots:[...snapshots.values()],repoRoot:join(sourceRoot,'base'),patch:git(join(sourceRoot,'work'),['diff','--no-ext-diff','--no-textconv','--binary',task.base_commit,'--'])}),model_dispatch_enabled,pause_after_first_recycle,before_model_dispatch,on_event:async event=>append(event)});
    result={...episode,index_tokenizer_receipts:client.index_receipts??[],instance_id:task.instance_id,cell_id:cell.cell_id,task_sha256,source_root:sourceRoot,
      patch:git(join(sourceRoot,'work'),['diff','--no-ext-diff','--no-textconv','--binary',task.base_commit,'--']),native_export:null};
    state.result=result;
    save(join(root,'episode.json'),episode);
    if(episode.status==='final_context_selected'&&episode.selection){
      try{
        const input={...episode,task,source_snapshots:[...snapshots.values()],response_capture:episode.response_captures.at(-1)};
        const packet=episode.terminal_evidence_presentations?.find(p=>p.request_sha256===input.response_capture?.request_sha256)?.packet;
        if(cell.limits.terminal_evidence_review&&!packet)throw Error('orchestration.missing-terminal-packet');
        result.native_export=packet?exportTerminalEvidenceSelection({...input,packet},join(sourceRoot,'base')):exportModelSelectedContext(input,join(sourceRoot,'base'));
        if(stable(result.native_export.selection)!==stable(episode.selection))throw Error('orchestration.selection-export-mismatch');
        save(join(root,'prediction.json'),result.native_export.prediction);
        save(join(root,'export-evidence.json'),result.native_export);
      }catch(e){result.export_error=String(e.message);result.native_export=null;result.status='native_export_error';}
    }
    // Base is an evaluator source, never the editable checkout.
    if(git(join(sourceRoot,'base'),['status','--porcelain']).trim())throw Error('orchestration.base-mutated');
  }catch(e){state.original_error??=e;result={...(result??{}),status:'orchestration_error',error:String(e.message),receipts:client?.receipts??[]};state.result=result;append({kind:'orchestration-error',error:result.error});throw e;}
  finally{
    let cleanupError;
    try{guarded('recycler-close',()=>io.closeRecycler?io.closeRecycler(recycler):recycler?.close());}catch(e){cleanupError=e;}
    if(cleanupError)throw cleanupError;
    if(result){if(state.errors.length||state.original_error){result={...result,status:'orchestration_error',native_export:null,benchmark_cleared:false};state.result=result;}save(join(root,'result.json'),result);save(join(root,'completed.json'),{status:result.status,result_sha256:hash(readFileSync(join(root,'result.json'))),benchmark_cleared:false});}
  }
  if(state.errors.length)throw state.original_error;
  return result;
}
