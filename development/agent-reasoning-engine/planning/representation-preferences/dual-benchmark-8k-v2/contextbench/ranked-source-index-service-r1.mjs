// One immutable manifest per task; queries rebuild the same bounded base index.
// Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
import {createHash} from 'node:crypto';import {realpathSync} from 'node:fs';import {fileURLToPath} from 'node:url';
import {createGenerationProcess} from './recovery-generation-process.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {validateRankQuery,validateHintOutput} from './ranked-source-hints-tool-r1.mjs';
const worker=fileURLToPath(new URL('./ranked-source-index-worker-r1.mjs',import.meta.url));
const hash=x=>createHash('sha256').update(stable(x)).digest('hex'),need=(v,m)=>{if(!v)throw Error('source-index.'+m);};
const limits={entries:10000,file_bytes:8*1024**2,admitted_bytes:64*1024**2,postings:2000000,manifest_bytes:8*1024**2};
export async function runSourceIndex({repository,base_commit,query,signal},{worker_path=worker,deadline_ms=65000}={}){
 need(signal instanceof AbortSignal&&!signal.aborted,'active-signal');validateRankQuery({query});
 need(Number.isSafeInteger(deadline_ms)&&deadline_ms>0&&deadline_ms<=65000,'deadline');
 const process=createGenerationProcess({worker:worker_path,kill_grace_ms:10000}),abort=new AbortController(),cancel=()=>abort.abort();
 let terminal=null,settlement=null,failure=null,expired=false;
 signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
 const timer=setTimeout(()=>{expired=true;abort.abort();},deadline_ms);
 try{
  try{terminal=await process.generate({config:{repository,base_commit,query},signal:abort.signal});}catch(e){terminal=e.result??null;failure=e;}
  try{settlement=await process.settle({terminal});}catch(e){failure??=e;}
  if(expired||signal.aborted||!settlement?.local_settled||!settlement.process_group_absent||settlement.forced||settlement.exit_code!==0)failure??=Error('source-index.cancelled-or-unsettled');
  if(failure)throw Object.assign(Error('source-index.failed',{cause:failure}),{result:{report:terminal,settlement,expired,error:String(failure.message)}});
  need(terminal?.ok===true&&terminal.settlement?.process_group_absent===true&&terminal.settlement.forced===false&&terminal.settlement.exit_code===0,'python-settlement');
  const value=terminal.result;need(value?.schema==='are.ranked-source-worker/v1'&&value.ok===true&&value.model_calls===0&&value.base_commit===base_commit,'worker-result');
  need(value.runtime?.executable===realpathSync('/usr/bin/python3')&&value.runtime.python===value.normalizer?.python&&value.normalizer.version==='ranked-source-hints-r3','runtime');
  need(value.limits?.address_space_bytes===512*1024**2&&stable(value.index_limits)===stable(limits),'limits');
  need(hash({base_commit,normalizer:value.normalizer,limits:value.index_limits,manifest:value.manifest})===value.index_digest,'manifest-digest');
  const files=new Map(),manifest=value.manifest;let bytes=0,postings=0;
  need(Array.isArray(manifest.entries)&&manifest.entries.length<=10000,'manifest-entries');
  for(const e of manifest.entries)if(e.status==='admitted'){
   need(typeof e.path==='string'&&!files.has(e.path)&&/^[a-f0-9]{64}$/.test(e.content_sha256)&&Number.isSafeInteger(e.bytes)&&e.bytes>=0&&e.bytes<=2000000&&Number.isSafeInteger(e.postings)&&e.postings>=0,'manifest-source');
   files.set(e.path,e.content_sha256);bytes+=e.bytes;postings+=e.postings;
  }else need(e.status==='excluded'&&typeof e.reason==='string','manifest-exclusion');
  need(manifest.admitted_files===files.size&&manifest.admitted_bytes===bytes&&manifest.postings===postings&&bytes<=limits.admitted_bytes&&postings<=limits.postings&&manifest.partial===manifest.entries.some(e=>e.status==='excluded'),'manifest-counts');
  const expected={index_digest:value.index_digest,base_commit,partial_index:manifest.partial,files};validateHintOutput({query,output:value.query_result,expected});
  return {value,expected,settlement,python_settlement:terminal.settlement};
 }catch(error){
  // Preserve settled worker evidence even when semantic validation rejects it.
  if(!error.result)error.result={report:terminal,settlement,expired,error:String(error.message)};
  throw error;
 }finally{clearTimeout(timer);signal.removeEventListener('abort',cancel);}
}
export async function createSourceHintService({repository,base_commit,signal,save_manifest,record,before_index=async()=>true}){
 need(typeof save_manifest==='function'&&typeof record==='function'&&typeof before_index==='function','persistence');
 let active=false,closed=false,failed=false,initial=null;
 async function invoke(query){
  need(!active&&!closed&&!failed,'service-state');active=true;
  try{
   need(await before_index()===true,'admission');const result=await runSourceIndex({repository,base_commit,query,signal});
   if(initial)need(result.value.index_digest===initial.value.index_digest,'index-drift');
   await record({kind:'source-index-query',query_sha256:hash({query}),index_digest:result.value.index_digest,query_result_sha256:hash(result.value.query_result),settlement:result.settlement,python_settlement:result.python_settlement,model_calls:0});
   return result;
  }catch(error){failed=true;await record({kind:'source-index-failure',error:String(error.message),evidence:error.result??null,model_calls:0});throw error;}
  finally{active=false;}
 }
 initial=await invoke('');await save_manifest(initial.value);
 const summary=stable({base_commit,index_digest:initial.value.index_digest,admitted_files:initial.value.manifest.admitted_files,excluded_files:initial.value.manifest.entries.length-initial.value.manifest.admitted_files,partial_index:initial.value.manifest.partial});
 return Object.freeze({summary,expected:initial.expected,query:async query=>{validateRankQuery({query});return (await invoke(query)).value.query_result;},close(){need(!active,'close-while-active');closed=true;}});
}
