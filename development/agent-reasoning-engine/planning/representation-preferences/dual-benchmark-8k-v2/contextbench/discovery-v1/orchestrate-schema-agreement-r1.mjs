// Schema-agreement candidate. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
// Additive ranked-source-hints production candidate. Open questions: FRONTIER-RESOURCE-HYPOTHESES-R2.md.
// Preserve verified durable result through subsequent persistence failure. Open questions: ../FINAL-PERSISTENCE-PRESERVATION.md.
import {createToolArchiveJournal} from '../tool-archive-references.mjs';
// Additive three-arm codec wiring. Open questions: COMPACT-COMPARISON.md.
// Additive comparison orchestration; inherited source preparation kept unchanged.
// Open questions: ../COMPARISON-REPAIR-RUNNER.md.
// Open questions: INTEGRATION.md. No credential discovery or provider retry occurs here.
import {mkdirSync,readFileSync,existsSync,lstatSync} from 'node:fs';
import {resolve,join,relative,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runNativeComparisonEpisode} from '../schema-agreement-native-driver-r1.mjs';
import {createSourceHintService} from '../ranked-source-index-service-r1.mjs';
import {exportIndependentTerminalSelection} from '../ranked-read-export-r1.mjs';
import {exportIndependentTerminalSelection as exportRepairTerminalSelection} from '../compact-repair-terminal-export.mjs';
import {providerAttemptHealth} from '../provider-attempt-health.mjs';
import {createRepositoryTools,tools as repositoryTools} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');

function git(cwd,args){return execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd,encoding:'utf8',timeout:120000,maxBuffer:16000000});}

export async function runPreparedComparisonTask(options){
  const state={client:null,result:null,persisted_result:null,episode_entered:false,errors:[]};
  try{return await runPreparedComparisonTaskImpl(options,state);}catch(error){
    const receipts=state.client?.receipts??[],models=receipts.filter(r=>r.kind==='model');
    const known=models.every(r=>r.dispatched===false||(r.dispatched===true&&Number.isSafeInteger(r.input_tokens)&&r.input_tokens>=0&&Number.isSafeInteger(r.output_tokens)&&r.output_tokens>=0));
    const unknown_usage=!known||(state.episode_entered&&models.length===0);
    const usage={prompt_tokens:0,completion_tokens:0,total_tokens:0};
    if(!unknown_usage)for(const r of models)if(r.dispatched){usage.prompt_tokens+=r.input_tokens;usage.completion_tokens+=r.output_tokens;usage.total_tokens+=r.input_tokens+r.output_tokens;}
    const result=state.persisted_result??{...(state.result??{}),status:'orchestration_error',error:String((state.original_error??error).message),persistence_failures:state.errors,receipts,native_export:null,benchmark_cleared:false,unknown_usage};
    throw Object.assign(Error('orchestration.failed-with-accounting: '+String((state.original_error??error).message)+'; final failure: '+String(error.message)),{cause:state.original_error??error,final_error:error,persistence_failure:state.errors.length>0,persistence_failures:structuredClone(state.errors),canonical_result_preserved:state.persisted_result!==null,original_receipt:(state.original_error??error).receipt??null,result,receipts,unknown_usage,...(!unknown_usage?{usage,receipt:{kind:'orchestration',usage,persistence_failure:state.errors.length>0}}:{})});
  }
}
async function runPreparedComparisonTaskImpl({task_path,task_sha256,repository_cache,out,cell,create_client,measure_index_tokens,model_dispatch_enabled=true,signal,before_model_dispatch=async()=>true,persistence,evidence_root,source_out,admit_source,io={}},state){
  const guarded=(stage,fn)=>{try{return fn();}catch(error){state.errors.push({stage,error:String(error.message),code:error.code??null});state.original_error??=error;throw error;}};
  if(!persistence||!['writeJson','append','atomicJson','createLock','removeLock'].every(k=>typeof persistence[k]==='function'))throw Error('orchestration.guarded-persistence-required');
  if(typeof source_out!=='string'||typeof evidence_root!=='string'||typeof admit_source!=='function')throw Error('orchestration.source-admission-required');
  const save=(path,value)=>guarded('save:'+path,()=>persistence.writeJson(path,value));
  if(cell?.context_limit!==8000||cell?.limits?.total_tokens!==96000||cell?.limits?.maximum_calls!==96||!Number.isSafeInteger(cell?.limits?.output_cap)||cell.limits.output_cap<1||cell.limits.output_cap>2048)throw Error('orchestration.independent-cell-limits');
  if(!['schema-agreement'].includes(cell.comparison_arm))throw Error('orchestration.comparison-arm');
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
  const journal=join(root,'events.jsonl'),snapshots=new Map(),terminalEvents=[];
  const appendJournal=createToolArchiveJournal({journal,append:text=>persistence.append(journal,text)});
  const append=value=>guarded('journal-append',()=>{appendJournal(value);if(['request-capture','response-capture','terminal-packet'].includes(value.kind))terminalEvents.push(structuredClone(value));});
  let client,result,source_hints;
  try{
    mkdirSync(sourceRoot,{recursive:true,mode:0o700});
    for(const name of ['base','work']){
      if(await admit_source({task,cache,source_root:sourceRoot,phase:'before-'+name})!==true)throw Error('orchestration.source-admission-denied');
      // No local hardlinks or alternates; each run owns its objects/worktrees.
      git(sourceRoot,['clone','--no-local','--no-checkout','--',cache,name]);
      git(join(sourceRoot,name),['checkout','--detach',task.base_commit]);
      if(git(join(sourceRoot,name),['rev-parse','HEAD']).trim()!==task.base_commit)throw Error('orchestration.checkout-mismatch');
    }
    mkdirSync(join(root,'snapshots'));
    const record_source=s=>{
      const key=hash(stable([s.path,s.source_sha256]));
      if(!snapshots.has(key)){save(join(root,'snapshots',`${key}.json`),s);snapshots.set(key,s);}
    };
    const execute_tool=createRepositoryTools({root:join(sourceRoot,'work'),base_commit:task.base_commit,record_source});
    source_hints=await createSourceHintService({repository:join(sourceRoot,'base'),base_commit:task.base_commit,signal,
      save_manifest:value=>save(join(root,'source-index.json'),value),record:append,
      before_index:()=>admit_source({task,cache,source_root:sourceRoot,phase:'before-work'})});
    client=await create_client({cell,task,record_event:append,signal});state.client=client;
    const scope={request:task.problem_statement,instance_id:task.instance_id,cell_id:cell.cell_id,cell_sha256:hash(stable(cell))};
    state.episode_entered=true;
    const taskTools=repositoryTools;
    const episode=await runNativeComparisonEpisode({arm:cell.comparison_arm,native:{client,profile:{model:client.model,reasoning_effort:cell.provider_profile.reasoning_effort,output_cap:cell.limits.output_cap},scope,fixture_root:join(sourceRoot,'base'),directory:join(root,'state'),persistence,signal,before_dispatch:async()=>model_dispatch_enabled&&!signal?.aborted&&providerAttemptHealth([...(client.receipts??[]),...(client.index_receipts??[])]).healthy&&await before_model_dispatch()===true},
      task,source_hints,tools:taskTools,execute_tool:async(name,args)=>{if(!taskTools.some(t=>t.function.name===name))throw Error('orchestration.unknown-task-tool');return execute_tool(name,args);},
      source_context:()=>({snapshots:[...snapshots.values()],repoRoot:join(sourceRoot,'base')}),measure_tokens:text=>measure_index_tokens(text,client),persist:append,output_cap:cell.limits.output_cap});
    result={...episode,index_tokenizer_receipts:client.index_receipts??[],instance_id:task.instance_id,cell_id:cell.cell_id,task_sha256,source_root:sourceRoot,
      patch:git(join(sourceRoot,'work'),['diff','--no-ext-diff','--no-textconv','--binary',task.base_commit,'--']),native_export:null};
    state.result=result;
    save(join(root,'episode.json'),episode);
    if(episode.status==='final_context_selected'&&episode.exported?.selection){
      try{
        if(episode.branches.length!==(cell.comparison_arm==='schema-agreement'?1:4)||episode.phase_state.closed!==true)throw Error('orchestration.incomplete-investigations');
        const end=episode.branches.at(-1).receipt_indices.at(-1)+1;
        const ranked_context={expected:source_hints.expected,sources:new Map([...snapshots.values()].filter(s=>source_hints.expected.files.get(s.path)===s.source_sha256).map(s=>[s.path,s.utf8]))};
        const branch_inputs={branches:episode.branches,receipts:episode.receipts.slice(0,end),ranked_context};
        const packetEvent=terminalEvents.find(e=>e.kind==='terminal-packet');
        const packetIndex=terminalEvents.indexOf(packetEvent);
        if(packetIndex<0)throw Error('orchestration.missing-terminal-packet');
        const finalEvents=terminalEvents.slice(packetIndex+1);
        const terminal_captures=finalEvents.filter(e=>e.kind==='request-capture'&&e.phase==='join').map(e=>e.capture);
        const response_capture=finalEvents.filter(e=>e.kind==='response-capture'&&e.phase==='join').at(-1)?.response_capture;
        const exportSelection=cell.comparison_arm==='schema-agreement'?exportIndependentTerminalSelection:exportRepairTerminalSelection;
        result.native_export=exportSelection({joined:packetEvent?.joined,packet:packetEvent?.packet,branch_inputs,terminal_captures,receipts:episode.receipts,response_capture,snapshots:[...snapshots.values()],task,repoRoot:join(sourceRoot,'base')});
        if(stable(result.native_export)!==stable(episode.exported))throw Error('orchestration.selection-export-mismatch');
        save(join(root,'prediction.json'),result.native_export.prediction);
        save(join(root,'export-evidence.json'),result.native_export);
      }catch(e){result.export_error=String(e.message);result.native_export=null;result.status='native_export_error';}
    }
    // Base is an evaluator source, never the editable checkout.
    if(git(join(sourceRoot,'base'),['status','--porcelain']).trim())throw Error('orchestration.base-mutated');
  }catch(e){state.original_error??=e;result={...(result??{}),status:'orchestration_error',error:String(e.message),receipts:client?.receipts??[]};state.result=result;append({kind:'orchestration-error',error:result.error});throw e;}
  finally{
    source_hints?.close();
    if(result){if(state.errors.length||state.original_error){result={...result,status:'orchestration_error',native_export:null,benchmark_cleared:false};state.result=result;}const snapshot=JSON.parse(stable({...result,receipts:client?.receipts??result.receipts??[],index_tokenizer_receipts:client?.index_receipts??result.index_tokenizer_receipts??[]}));result=snapshot;save(join(root,'result.json'),snapshot);if(hash(readFileSync(join(root,'result.json')))!==hash(stable(snapshot)))throw Error('orchestration.persisted-result-mismatch');state.persisted_result=snapshot;save(join(root,'completed.json'),{status:result.status,result_sha256:hash(readFileSync(join(root,'result.json'))),benchmark_cleared:false});}
  }
  if(state.errors.length)throw state.original_error;
  return result;
}
