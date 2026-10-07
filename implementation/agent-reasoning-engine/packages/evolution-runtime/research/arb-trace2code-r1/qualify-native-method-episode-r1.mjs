// All16/two-arm native pipeline with scripted public responses and real source.
// Open Questions: evidence/G01-NATIVE-METHOD-EPISODE-R1.json.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,existsSync} from 'node:fs';import {join,dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {runNativeMethodEpisode,loadNativeMethodEpisode} from './native-method-episode-r1.mjs';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../packages/coding-agent-runtime/context-recycling.mjs';
import {stable,bodyForReceipt,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const HERE=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const OUT='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r1-20261007';
const INDEX='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';
const SOURCE='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007';
assert.equal(existsSync(OUT),false,'no qualification replay');
const native=await loadNativeMethodEpisode(),pins={};
function trace(path){if(pins[path])return;const bytes=readFileSync(path),text=bytes.toString('utf8');pins[path]=sha(bytes);
 for(const match of text.matchAll(/^\s*import\s+[^;\n]*?\sfrom\s+['"]([^'"]+)['"]/gm))
  if(match[1].startsWith('.'))trace(resolve(dirname(path),match[1]));
}
for(const path of [fileURLToPath(import.meta.url),join(HERE,'native-method-episode-r1.mjs'),
 join(HERE,'native-method-episode-r1.test.mjs'),native.binding.native_source_path])trace(path);
for(const path of [join(HERE,'../../evidence/G01-NATIVE-METHOD-EPISODE-R1.json'),
 join(INDEX,'RESULT.json'),'/home/vlad_/are-benchmark-archive/g01-adaptive-common-tools-r1-20261007/RESULT.json'])pins[path]=sha(readFileSync(path));
const source=JSON.parse(readFileSync(join(INDEX,'RESULT.json')));
assert.equal(pins[join(INDEX,'RESULT.json')],'4476e7072b6117bc7c7c8bae481f85e1496e8c7b535dfcd520ef46b3b2443f56');
mkdirSync(OUT,{mode:0o700});const save=(path,value)=>{createReceipt(path,value);return sha(readFileSync(path));};
const freezeHash=save(join(OUT,'FREEZE.json'),{source_pins:pins,native_binding:native.binding,
 cases:source.rows.map(r=>({case_id:r.case_id,parser_output_sha256:r.parser_output_sha256})),arms:['baseline','index'],
 provider_calls:0,reference_label_reads:0,scripted_transport:true,authority_effect:'none',open_questions_owner:'G01-NATIVE-METHOD-EPISODE-R1.json'});
const start=Date.now(),rows=[];
for(const sourceRow of source.rows){
 const bytes=readFileSync(join(INDEX,sourceRow.case_id,'PARSER-OUTPUT.jsonl'));assert.equal(sha(bytes),sourceRow.parser_output_sha256);
 const records=bytes.toString('utf8').trimEnd().split('\n').map(JSON.parse),record=records.find(r=>r.methods.length),method=record.methods[0];
 for(const arm of ['baseline','index']){
  for(const[path,pin]of Object.entries(pins))assert.equal(sha(readFileSync(path)),pin);
  const cell=join(OUT,sourceRow.case_id+'-'+arm);mkdirSync(cell,{mode:0o700});
  const task={problem_statement:'Offline integration qualification: inspect the complete canonical method identified through the catalog and select its delivered read. This is not a fault prediction or quality test.'};
  const receipts=[];let modelCalls=0,selected=[];
  const transport=createStatelessRecyclingTransport({adapter_id:'native-method-offline-qualification',source_ref:fileURLToPath(import.meta.url),maximum_output_tokens:512,
   measure_request:async()=>400,request_once:async({prompt})=>{
    modelCalls++;const messages=JSON.parse(prompt).messages;
    for(const msg of messages)if(msg.role==='tool'){const response=JSON.parse(msg.content);if(response.output?.read_id)selected.push(response.output.read_id);}
    let message,finish_reason;
    if(modelCalls<=2){const name=modelCalls===1?'method_navigation':'read_file',args=modelCalls===1?
     {operation:'list_methods',path:record.path,limit:1}:{method_id:method.entity_id,path:record.path,start_line:method.span.start_line};
     message={role:'assistant',tool_calls:[{id:'offline-'+modelCalls,type:'function',function:{name,arguments:stable(args)}}]};finish_reason='tool_calls';
    }else{message={role:'assistant',content:stable({summary:'Offline source delivery check only',context_read_ids:[...new Set(selected)]})};finish_reason='stop';}
    const receipt={kind:'model',model:'glm-5.3-flash',output_cap:512,reasoning_effort:'low',dispatched:true,status:200,input_tokens:400,output_tokens:20,finish_reason,
     receipt_posture:'Synthetic offline transport, not provider evidence'};
    receipt.request_sha256=sha(stable(bodyForReceipt(prompt,receipt)));receipts.push(receipt);return{receipt,final_bytes:stable({message,finish_reason})};
   }});
  const recycler=openContextRecycling({transport,fixture_root:join(SOURCE,sourceRow.case_id,'buggy-java-only/corpus'),scope:{request:task.problem_statement},
   options:{directory:join(cell,'state'),context_limit:8192,recycle_at:7500,safety_margin:512,
    state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[sourceRow.parser_output_sha256]}}});
  let result;try{result=await runNativeMethodEpisode({caseId:sourceRow.case_id,arm,task,client:{receipts,maximum_model_retries:0},
   recycler,measure_index_tokens:async()=>100,run_id:'offline-'+sourceRow.case_id+'-'+arm});}finally{recycler.close();}
  assert.equal(result.functionality_valid,true,result.error??'invalid native functionality');assert.equal(modelCalls,3);
  assert.equal(result.selection.final_read_ids.length,1);assert.equal(result.method_tool_accounting.all_tool_attempts,2);
  const binding=bindDelivery(result);assert.equal(binding.unmapped.length,0);assert.equal(binding.read_observations.length,1);
  assert.equal(binding.read_observations[0].body,method.span.source);assert.equal(binding.read_observations[0].path,record.path);
  const receiptHash=save(join(cell,'RESULT.json'),{scripted_transport:true,result,binding});
  const row={case_id:sourceRow.case_id,arm,qualified:true,model_calls:modelCalls,tool_actions:2,
   delivered_read_ids:result.selection.final_read_ids,result_sha256:receiptHash};rows.push(row);console.log(JSON.stringify(row));
 }
}
for(const[path,pin]of Object.entries(pins))assert.equal(sha(readFileSync(path)),pin);
assert.equal(rows.length,32);
const result={status:'all32-offline-native-method-episodes-qualified',freeze_sha256:freezeHash,rows,elapsed_ms:Date.now()-start,
 actual_provider_calls:0,reference_label_reads:0,scripted_transport:true,synthetic_tests_passed:8,
 native_binding:native.binding,authority_effect:'none',claim_ceiling:'Offline functionality only, not model accuracy or superiority',
 open_questions_owner:'G01-NATIVE-METHOD-EPISODE-R1.json'};
console.log(JSON.stringify({result_sha256:save(join(OUT,'RESULT.json'),result),...result}));
