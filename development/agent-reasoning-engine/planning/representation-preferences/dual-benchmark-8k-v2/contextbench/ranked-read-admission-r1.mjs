import {projectRankedRead,validateRankedReadView} from './ranked-read-projection-r1.mjs';
import {rankedSearchSchema} from './ranked-read-arguments-r1.mjs';
import {rankSourcesName,rankSourcesTool,validateHintOutput,projectHintOutput} from './ranked-source-hints-tool-r1.mjs';
import {attachObservationHandles,recoveryTool,recoveryName} from './bounded-archive-frontier-recovery-r1.mjs';
// Candidate only. Open questions: AGGREGATE-TOOL-ADMISSION.md.
import {createHash} from 'node:crypto';
import {stable,observationMaterial} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {renderCompactPrompt} from './compact-prompt.mjs';
import Ajv from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules/ajv/dist/ajv.js';
import {schemas} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
const ajv=new Ajv({strict:true,allErrors:true});
const validators=Object.fromEntries(Object.entries({...schemas,search:rankedSearchSchema,[rankSourcesName]:rankSourcesTool.function.parameters,[recoveryName]:recoveryTool.function.parameters}).map(([name,schema])=>[name,ajv.compile(schema)]));
const need=(v,m)=>{if(!v)throw Error('aggregate-admission.'+m);};
const hash=v=>createHash('sha256').update(v).digest('hex');

// measure returns the TOTAL request envelope (including output, reasoning and
// margin). It must only tokenize; never reserve a driver slot or dispatch.
export async function admitToolBatch({messages,tools,assistant,results,measure,archive,suffix=[],limit=8000,ranked_evidence=new Map()}){
 need(Array.isArray(suffix)&&suffix.every(m=>['user','system'].includes(m.role))&&Array.isArray(messages)&&Array.isArray(tools)&&typeof measure==='function'&&typeof archive==='function','dependencies');
 need(Number.isSafeInteger(limit)&&limit>0&&limit<=8000,'limit');
 const calls=assistant?.tool_calls;
 need(assistant?.role==='assistant'&&Array.isArray(calls)&&calls.length>0&&calls.length<=8,'calls');
 need(new Set(calls.map(c=>c.id)).size===calls.length&&calls.every(c=>typeof c.id==='string'&&c.id.length>0),'identities');
 need(Array.isArray(results)&&results.length===calls.length,'results');
 const rows=calls.map((call,i)=>{
  const result=structuredClone(results[i]),args=JSON.parse(call.function.arguments),name=call.function.name;
  need(result&&typeof result==='object'&&!Array.isArray(result),'result');
  let units=0;
  if(result.ok===true){
   if(validators[name])need(validators[name](args),'successful-call-arguments');
   else need(['recover_observed_read','list_recovery_page','recover_archived_read','open_recovery'].includes(name),'unknown-successful-tool');
   if(name===rankSourcesName){
    validateHintOutput({query:args.query,output:result.output});units=result.output.hints.length;
   }else if(name==='search'){
    need(Array.isArray(result.output?.observations)&&result.output.observations.length<=30,'search');
    if(args.mode==='ranked'){need(stable(result)===stable(ranked_evidence.get(call.id)?.result),'ranked-raw-result');validateRankedReadView({call,result,evidence:ranked_evidence.get(call.id)});}
    else result.output.observations.forEach(o=>{observationMaterial('validate',o);need(o.utf8.includes(args.query)&&o.path.startsWith(args.path_prefix)&&o.source_revision===args.revision,'search-binding');});units=result.output.observations.length;
   }else if(name==='list_files'){
    need(Array.isArray(result.output?.paths)&&result.output.paths.length<=100,'paths');units=result.output.paths.length;
   }else if((name==='read_file'||name===recoveryName)){
    observationMaterial('validate',result.output);units=result.output.end_line-result.output.start_line+1;
    need(result.output.path===args.path&&result.output.start_line===args.start_line&&result.output.source_revision===args.revision,'read-binding');
    need(units<=100&&result.output.utf8.split('\n').length===units,'whole-lines');
   }
  }
  return {call:structuredClone(call),args,result,units,keep:units,sha256:hash(stable(result))};
 });
 // Persist every complete output before any projection. Archive success is not
 // evidence of model delivery. Failure propagates; nothing is dispatched here.
 for(const row of rows)await archive({schema:'are.tool-output-archive/v1',call:row.call,result:structuredClone(row.result),sha256:row.sha256,delivery:'unconfirmed'});
 function project(row){
  const {call,args,result,units,keep,sha256}=row;
  if(call.function.name==='search'&&args.mode==='ranked'&&result.ok===true)return projectRankedRead({evidence:ranked_evidence.get(call.id),keep});
  if(keep===units)return attachObservationHandles(call,structuredClone(result));
  const name=call.function.name,resume={...args};
  if(name===rankSourcesName)return {...structuredClone(result),output:projectHintOutput({query:args.query,output:result.output,keep}),deferred:{archive_sha256:sha256,omitted_units:units-keep,delivery:'unconfirmed',instruction:'Ranked hints were omitted; refine the query. Hints are not source observations.'}};
  if((name==='read_file'||name===recoveryName)){resume.start_line=args.start_line+keep;resume.line_count=units-keep;}
  else resume.offset=args.offset+keep;
  const deferred={archive_sha256:sha256,omitted_units:units-keep,resume:{tool:name,arguments:resume},source_revision:args.revision??null};
  if(name==='read_file'||name===recoveryName){
   const recovery={archive_sha256:sha256,observation_index:0,path:args.path,revision:args.revision,start_line:args.start_line+keep,line_count:units-keep};
   deferred.archive_recovery={tool:recoveryName,arguments:recovery};
  }else if(name==='search'){
   deferred.archive_recovery={tool:recoveryName,archive_sha256:sha256,observation_indices:Array.from({length:units-keep},(_,i)=>keep+i),instruction:'Recover an omitted observation with its original path/revision/start_line and line_count. Metadata listed below.',observations:result.output.observations.slice(keep).map((o,i)=>({observation_index:keep+i,path:o.path,revision:o.source_revision,start_line:o.start_line,line_count:o.end_line-o.start_line+1}))};
  }
  if(!keep)return {ok:false,error:'output-deferred-by-aggregate-request-limit',deferred};
  const out=structuredClone(result);
  if((name==='read_file'||name===recoveryName)){
   out.output.utf8=out.output.utf8.split('\n').slice(0,keep).join('\n');
   out.output.end_line=out.output.start_line+keep-1;out.output.byte_count=Buffer.byteLength(out.output.utf8);
   delete out.output.read_id;delete out.output.retrieval_handle;
  }else if(name==='search'){
   out.output.observations=out.output.observations.slice(0,keep);out.output.next_offset=args.offset+keep;
  }else {out.output.paths=out.output.paths.slice(0,keep);out.output.next_offset=args.offset+keep;}
  out.deferred=deferred;return attachObservationHandles(call,out);
 }
 const attempts=[];
 while(true){
  const outputs=rows.map(project),history=[...structuredClone(messages),structuredClone(assistant),...outputs.map((output,i)=>({role:'tool',tool_call_id:calls[i].id,content:stable(output)})),...structuredClone(suffix)];
  let prompt,envelope;
  try{if(outputs.some((o,i)=>rows[i].args?.mode==='ranked'&&rows[i].call.function.name==='search'&&Buffer.byteLength(stable(o))>8192))throw Error('ranked-projection.view-byte-limit');prompt=renderCompactPrompt({messages:history,tools});}
  catch(error){if(!['ranked-projection.view-byte-limit','compact-prompt.request-byte-bound','tool-payload.string-bound','tool-payload.byte-bound','tool-payload.encoded-byte-bound'].includes(error.message))throw error;}
  if(prompt!==undefined){envelope=await measure(prompt);need(Number.isSafeInteger(envelope)&&envelope>=0,'measurement');}
  attempts.push({kept_units:rows.map(r=>r.keep),envelope_tokens:envelope??null,reason:prompt===undefined?'request-byte-bound':envelope>limit?'request-token-bound':'fits'});
  if(prompt!==undefined&&envelope<=limit)return {status:'admitted',prompt,prompt_sha256:hash(prompt),envelope_tokens:envelope,outputs,history,attempts,delivery:'unconfirmed'};
  // Deterministic halving bounds tokenizer work; do not assume token count is
  // monotonic. Every accepted final rendering is measured independently.
  const candidates=rows.map((row,i)=>({row,i,bytes:Buffer.byteLength(stable(outputs[i]))})).filter(x=>x.row.keep>0).sort((a,b)=>b.bytes-a.bytes||a.i-b.i);
  if(!candidates.length)return {status:'denied',reason:'mandatory-request-envelope-does-not-fit',attempts,delivery:'unconfirmed'};
  candidates[0].row.keep=Math.floor(candidates[0].row.keep/2);
 }
}
