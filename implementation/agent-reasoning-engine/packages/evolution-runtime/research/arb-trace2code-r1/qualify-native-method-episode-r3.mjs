// Scripted offline pipeline over all16 actual source cases/both native arms.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R3.json.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,existsSync} from 'node:fs';import {join,dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {runReliableMethodEpisode} from './native-method-episode-r3.mjs';
import {loadReliableMethodEpisode} from './native-method-episode-r3.mjs';
import {nativeFilePredictionR3} from './native-method-live-policy-r3.mjs';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const HERE=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const OUT='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r3-20261007';
const INDEX='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';
const SOURCE='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007';
assert.equal(existsSync(OUT),false,'no qualification replay');
const native=await loadReliableMethodEpisode(),pins={};
function trace(path){if(pins[path])return;const bytes=readFileSync(path);pins[path]=sha(bytes);
 for(const m of bytes.toString('utf8').matchAll(/\b(?:import|export)\s+[^;\n]*?\sfrom\s+['"](\.[^'"]+)['"]/g))trace(resolve(dirname(path),m[1]));}
for(const path of [fileURLToPath(import.meta.url),join(HERE,'native-method-episode-r3.test.mjs'),
 join(HERE,'explicit-method-tools-r2.test.mjs'),join(HERE,'native-method-live-policy-r3.mjs'),native.binding.native_source_path])trace(path);
for(const path of [join(HERE,'../../evidence/G01-NATIVE-METHOD-EPISODE-R3.json'),join(INDEX,'RESULT.json')])pins[path]=sha(readFileSync(path));
assert.equal(pins[join(INDEX,'RESULT.json')],'4476e7072b6117bc7c7c8bae481f85e1496e8c7b535dfcd520ef46b3b2443f56');
const cases=JSON.parse(readFileSync(join(INDEX,'RESULT.json'))).rows;assert.equal(cases.length,16);
mkdirSync(OUT,{mode:0o700});const save=(path,value)=>{createReceipt(path,value);return sha(readFileSync(path));};
const freezeHash=save(join(OUT,'FREEZE.json'),{source_pins:pins,native_binding:native.binding,cases:cases.map(c=>({case_id:c.case_id,parser_output_sha256:c.parser_output_sha256})),
 scripted_transport:true,actual_provider_calls:0,reference_label_reads:0,authority_effect:'none',open_questions_owner:'G01-NATIVE-METHOD-EPISODE-R3.json'});
const start=Date.now(),rows=[];
for(const c of cases){
 const bytes=readFileSync(join(INDEX,c.case_id,'PARSER-OUTPUT.jsonl'));assert.equal(sha(bytes),c.parser_output_sha256);
 const records=bytes.toString('utf8').trimEnd().split('\n').map(JSON.parse),record=records.find(r=>r.methods.length),method=record.methods[0];
 for(const arm of ['baseline','index']){
  for(const[p,pin]of Object.entries(pins))assert.equal(sha(readFileSync(p)),pin);
  const cell=join(OUT,c.case_id+'-'+arm);mkdirSync(cell,{mode:0o700});
  const task={problem_statement:'Offline explicit-native integration: inspect runtime status and one canonical catalog declaration, then select its delivered complete source read. Not a fault-quality prediction.'};
  const receipts=[];let calls=0,selected=[];
  const transport=createStatelessRecyclingTransport({adapter_id:'native-explicit-r3-offline',source_ref:fileURLToPath(import.meta.url),maximum_output_tokens:512,
   measure_request:async()=>400,request_once:async({prompt})=>{
    calls++;const messages=JSON.parse(prompt).messages;
    for(const m of messages)if(m.role==='tool'){const reply=JSON.parse(m.content);if(reply.output?.read_id)selected.push(reply.output.read_id);}
    let message,finish_reason;
    if(calls<=3){const name=['runtime_status','list_methods','read_file'][calls-1],args=calls===1?{}:calls===2?
     {path:record.path,limit:1}:{method_id:method.entity_id,path:record.path,start_line:method.span.start_line};
     message={role:'assistant',tool_calls:[{id:'offline-r3-'+calls,type:'function',function:{name,arguments:stable(args)}}]};finish_reason='tool_calls';
    }else{message={role:'assistant',tool_calls:[{id:'offline-r3-terminal',type:'function',function:{name:'submit_context_selection',arguments:stable({summary:'Offline canonical delivery only',context_read_ids:[...new Set(selected)]})}}]};finish_reason='tool_calls';}
    const receipt={kind:'model',model:'glm-5.3-flash',output_cap:512,reasoning_effort:'low',dispatched:true,status:200,input_tokens:400,output_tokens:20,finish_reason,
     receipt_posture:'Synthetic offline transport, not provider evidence'};
    receipt.request_sha256=sha(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);return{receipt,final_bytes:stable({message,finish_reason})};
   }});
  const recycler=openContextRecycling({transport,fixture_root:join(SOURCE,c.case_id,'buggy-java-only/corpus'),scope:{request:task.problem_statement},
   options:{directory:join(cell,'state'),context_limit:8192,recycle_at:7500,safety_margin:512,
    state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[c.parser_output_sha256]}}});
  let result;try{result=await runReliableMethodEpisode({caseId:c.case_id,arm,task,client:{receipts,maximum_model_retries:0},recycler,
   measure_index_tokens:async()=>100,run_id:'offline-r3-'+c.case_id+'-'+arm});}finally{recycler.close();}
  assert.equal(result.functionality_valid,true,result.error);assert.equal(calls,4);assert.equal(result.method_tool_accounting.all_tool_attempts,3);
  const binding=bindDelivery(result);assert.deepEqual(binding.unmapped,[]);assert.equal(binding.read_observations.length,1);
  assert.equal(binding.read_observations[0].body,method.span.source);assert.equal(binding.read_observations[0].path,record.path);
  assert.equal(result.selection.final_read_ids.length,1);assert.equal(binding.token_accounting.cost_complete,true);
  // Separate direct file-byte oracle, not merely an adapter self-report.
  const file=readFileSync(join(SOURCE,c.case_id,'buggy-java-only/corpus',record.path));
  assert.equal(sha(file),record.source_sha256);assert.equal(binding.read_observations[0].source_sha256,sha(file));
  const canonical=file.subarray(method.span.start_utf8,method.span.end_utf8).toString('utf8');
  assert.equal(binding.read_observations[0].body,canonical);
  const delivered=result.events.find(e=>e.tool==='read_file').output.output;
  assert.equal(delivered.complete_method,true);assert.equal(delivered.method_id,method.entity_id);
  assert.equal(delivered.source_byte_start,method.span.start_utf8);assert.equal(delivered.source_byte_end,method.span.end_utf8);
  assert.equal(delivered.method_source_sha256,sha(Buffer.from(canonical)));assert.equal(delivered.byte_count,Buffer.byteLength(canonical));
  const prediction=nativeFilePredictionR3(result);assert.equal(prediction.valid,true);
  assert.deepEqual(prediction.ranked_files,[record.path]);
  const runtime=result.events.find(e=>e.tool==='runtime_status').output;assert.equal(runtime.ok,true);
  if(c.case_id==='Defects4J-Closure-5')assert.equal(runtime.output.runtime_available,false);
  const row={case_id:c.case_id,arm,qualified:true,model_calls:calls,tool_actions:3,runtime_available:runtime.output.runtime_available,
   delivered_read_ids:result.selection.final_read_ids,result_sha256:save(join(cell,'RESULT.json'),{scripted_transport:true,result,binding})};
  rows.push(row);console.log(JSON.stringify(row));
 }
}
for(const[p,pin]of Object.entries(pins))assert.equal(sha(readFileSync(p)),pin);assert.equal(rows.length,32);
const result={status:'all32-offline-reliable-native-method-episodes-qualified',freeze_sha256:freezeHash,rows,elapsed_ms:Date.now()-start,
 actual_provider_calls:0,reference_label_reads:0,canonical_byte_audits:32,strict_terminal_prediction_reconstructions:32,scripted_transport:true,native_tests_passed:9,interface_tests_passed:4,native_binding:native.binding,
 authority_effect:'none',claim_ceiling:'Offline functionality only, no actual provider/tokenizer quality or superiority',open_questions_owner:'G01-NATIVE-METHOD-EPISODE-R3.json'};
console.log(JSON.stringify({result_sha256:save(join(OUT,'RESULT.json'),result),elapsed_ms:result.elapsed_ms,qualified:rows.length}));
