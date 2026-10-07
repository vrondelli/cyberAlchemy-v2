// Scripted offline pipeline over all16 actual source cases/both native arms.
// Open Questions: evidence/G01-NATIVE-PROFILE-CLOSURE-R9.json.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,existsSync} from 'node:fs';import {join,dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {runProfileBoundMethodEpisode} from './native-method-episode-r9.mjs';
import {loadProfileBoundMethodEpisode} from './native-method-episode-r9.mjs';
import {ACQUISITION_GUIDANCE_R7,ACQUISITION_GUIDANCE_SHA256_R7} from './evidence-acquisition-guidance-r7.mjs';
import {loadProfileBoundModule,profileClosureEvidence} from './profile-bound-module-closure-r9.mjs';
import {providerBody} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';
const {nativeFilePredictionR5:nativeFilePredictionR9}=await loadProfileBoundModule(new URL('./native-method-live-policy-r5.mjs',import.meta.url));
const {auditNavigationPresentations,navigationMeasurement}=await loadProfileBoundModule(new URL('./audit-navigation-state-r6b.mjs',import.meta.url));
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
import {createStatelessRecyclingTransport,openContextRecycling} from '../../../../packages/coding-agent-runtime/context-recycling.mjs';
const {stable,bindDelivery}=await loadProfileBoundModule(new URL('../../../../benchmarks/contextbench-v1/delivery.mjs',import.meta.url));
import {execFileSync} from 'node:child_process';
const HERE=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const OUT='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r9-20261007';
const INDEX='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';
const SOURCE='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007';
assert.equal(existsSync(OUT),false,'no qualification replay');
const native=await loadProfileBoundMethodEpisode(),pins={};
function trace(path){if(pins[path])return;const bytes=readFileSync(path);pins[path]=sha(bytes);
 for(const m of bytes.toString('utf8').matchAll(/\b(?:import|export)\s+[^;\n]*?\sfrom\s+['"](\.[^'"]+)['"]/g))trace(resolve(dirname(path),m[1]));}
for(const path of [fileURLToPath(import.meta.url),join(HERE,'native-method-episode-r9.test.mjs'),join(HERE,'profile-bound-module-closure-r9.test.mjs'),join(HERE,'native-method-episode-r7.test.mjs'),
 join(HERE,'explicit-method-tools-r2.test.mjs'),join(HERE,'method-selection-terminal-r5.test.mjs'),join(HERE,'method-navigation-state-r6.test.mjs'),join(HERE,'native-navigation-state-r6.test.mjs'),join(HERE,'native-method-navigation-recycle-r7.test.mjs'),join(HERE,'native-method-live-policy-r6.mjs'),join(HERE,'evidence-acquisition-guidance-r7.test.mjs'),join(HERE,'native-method-guidance-parity-r7.test.mjs'),native.binding.native_source_path])trace(path);
for(const path of [join(HERE,'../../evidence/G01-NATIVE-PROFILE-CLOSURE-R9.json'),join(HERE,'../../../../packages/coding-agent-runtime/schemas/patch-set-candidate.schema.json'),join(INDEX,'RESULT.json')])pins[path]=sha(readFileSync(path));
assert.equal(pins[join(INDEX,'RESULT.json')],'4476e7072b6117bc7c7c8bae481f85e1496e8c7b535dfcd520ef46b3b2443f56');
const priorFreezePath='/home/vlad_/are-benchmark-archive/g01-native-method-live-r8-20261007/FREEZE.json';
assert.equal(sha(readFileSync(priorFreezePath)),'a7fe0022b0f6d8df91009daf1fc4aa604ac4d4472ce568e79b0cbf24b60cee30');
const prior=JSON.parse(readFileSync(priorFreezePath));for(const[p,h]of Object.entries(prior.source_pins)){assert.equal(sha(readFileSync(p)),h);pins[p]=h;}pins[priorFreezePath]=sha(readFileSync(priorFreezePath));
const cases=JSON.parse(readFileSync(join(INDEX,'RESULT.json'))).rows;assert.equal(cases.length,16);
mkdirSync(OUT,{mode:0o700});const save=(path,value)=>{createReceipt(path,value);return sha(readFileSync(path));};
const freezeHash=save(join(OUT,'FREEZE.json'),{source_pins:pins,native_binding:native.binding,cases:cases.map(c=>({case_id:c.case_id,parser_output_sha256:c.parser_output_sha256})),
 scripted_transport:true,actual_provider_calls:0,reference_label_reads:0,authority_effect:'none',open_questions_owner:'G01-NATIVE-PROFILE-CLOSURE-R9.json'});
const output=execFileSync(process.execPath,['--test',join(HERE,'profile-bound-module-closure-r9.test.mjs'),join(HERE,'native-method-episode-r9.test.mjs')],{encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});assert.ok(/(?:ℹ|#) pass 7/.test(output));
const start=Date.now(),rows=[];let navigationAudits=0;
for(const c of cases){
 const bytes=readFileSync(join(INDEX,c.case_id,'PARSER-OUTPUT.jsonl'));assert.equal(sha(bytes),c.parser_output_sha256);
 const records=bytes.toString('utf8').trimEnd().split('\n').map(JSON.parse),record=records.find(r=>r.methods.length),method=record.methods[0];
 for(const arm of ['baseline','index']){
  for(const[p,pin]of Object.entries(pins))assert.equal(sha(readFileSync(p)),pin);
  const cell=join(OUT,c.case_id+'-'+arm);mkdirSync(cell,{mode:0o700});
  const task={problem_statement:'Offline explicit-native integration: inspect runtime status and one canonical catalog declaration, then select its delivered complete source read. Not a fault-quality prediction.'};
  const receipts=[],navigationMeasurements=[],measuredPrompts=new Map();let calls=0,selected=[],tokenizers=0;
  function syntheticTokenizer(prompt,tokens,index=false){
   const body=JSON.parse(prompt),input={operation:'tokenize',request_id:'offline-r9-tokenizer-'+(++tokenizers),...body,output_cap:512};
   const receipt={kind:'tokenizer',model:'glm-5.3-flash',request_sha256:sha(providerBody(input)),dispatched:true,dispatch_uncertain:false,status:200,input_tokens:tokens,output_tokens:0,output_cap:512,reasoning_effort:'low',automatic_retries:0};
   const receiptIndex=receipts.length;receipts.push(receipt);if(index)navigationMeasurements.push(navigationMeasurement({input,index_measurement:true},{prompt_tokens:tokens},receipt,receiptIndex));
   return tokens;
  }
  const transport=createStatelessRecyclingTransport({adapter_id:'native-profile-r9-offline',source_ref:fileURLToPath(import.meta.url),maximum_output_tokens:512,
   measure_request:async({prompt})=>{const tokens=JSON.parse(prompt).messages.filter(m=>['assistant','tool'].includes(m.role)).length>2?7800:400;measuredPrompts.set(prompt,tokens);return syntheticTokenizer(prompt,tokens);},request_once:async({prompt})=>{
    calls++;const rendered=JSON.parse(prompt),messages=rendered.messages;assert.ok(measuredPrompts.has(prompt));assert.ok(measuredPrompts.get(prompt)+512<=8192);
    assert.equal(messages[0].content.endsWith('\n'+ACQUISITION_GUIDANCE_R7),arm==='index','exact policy must be in every dispatched request, including initial and recycled');
    assert.equal(messages[1].content.startsWith(task.problem_statement+'\nCOMMON ACQUISITION-FIRST SOURCE CONTRACT:'),true,'same actual task and common contract');
    const readIds=[];for(const m of messages)if(m.role==='tool'){const output=JSON.parse(m.content).output;if(output?.read_id)readIds.push(output.read_id);}
    selected=[];for(const m of messages){if(m.role!=='user')continue;let reply;try{reply=JSON.parse(m.content);}catch{continue;}for(const row of reply.method_terminal_handles?.evidence??[])selected.push(row.handle);}
    let message,finish_reason;
    if(calls<=4){const name=['runtime_status','list_methods','read_file','recover_observed_read'][calls-1],args=calls===1?{}:calls===2?
     {path:record.path,limit:1}:calls===3?{method_id:method.entity_id,path:record.path,start_line:method.span.start_line}:{retrieval_handle:'observed-read:'+readIds[0]};
     message={role:'assistant',tool_calls:[{id:'offline-r9-'+calls,type:'function',function:{name,arguments:stable(args)}}]};finish_reason='tool_calls';
    }else{message={role:'assistant',tool_calls:[{id:'offline-r9-terminal',type:'function',function:{name:'submit_source_handles',arguments:stable({context_handles:[...new Set(selected)]})}}]};finish_reason='tool_calls';}
    const receipt={kind:'model',model:'glm-5.3-flash',output_cap:512,reasoning_effort:'low',dispatched:true,dispatch_uncertain:false,status:200,input_tokens:400,output_tokens:20,finish_reason,
     receipt_posture:'Synthetic offline transport, not provider evidence'};
    receipt.request_sha256=sha(providerBody({operation:'generate',request_id:'offline-r9-model-'+calls,messages:rendered.messages,tools:rendered.tools,output_cap:512}));receipts.push(receipt);return{receipt,final_bytes:stable({message,finish_reason})};
   }});
  const recycler=openContextRecycling({transport,fixture_root:join(SOURCE,c.case_id,'buggy-java-only/corpus'),scope:{request:task.problem_statement},
   options:{directory:join(cell,'state'),context_limit:8192,recycle_at:7500,safety_margin:512,
    state:{objective:task.problem_statement,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:[c.parser_output_sha256]}}});
  let result;try{result=await runProfileBoundMethodEpisode({caseId:c.case_id,arm,task,client:{receipts,maximum_model_retries:0},recycler,
   measure_index_tokens:async text=>syntheticTokenizer(stable({messages:[{role:'user',content:text}],tools:[]}),100,true),run_id:'offline-r9-'+c.case_id+'-'+arm});}finally{recycler.close();}
  assert.equal(result.functionality_valid,true,result.error);assert.equal(result.method_handle_presentations[0].table.bindings.length,0);assert.equal(result.method_handle_presentations.at(-1).table.bindings.length,1);assert.equal(result.method_handle_presentations.at(-1).finalizing,false);assert.equal(Object.hasOwn(result.selection,'summary'),false);assert.equal(calls,5);assert.equal(result.method_tool_accounting.all_tool_attempts,4);
  assert.equal(result.method_tool_accounting.attempts,3);
  const recovery=result.events.find(e=>e.tool==='recover_observed_read');assert.equal(recovery.output.ok,true);assert.equal(recovery.output.output.read_id,result.selection.final_read_ids[0]);
  assert.ok(result.recycling.recycles>=2,'two forced native recycles must occur in both arms');
  if(arm==='index'){
   const states=result.task_state_presentations.filter(s=>s.projection_mode==='confirmed-native-navigation');
   assert.ok(states.length>0,'native confirmed navigation state must actually be presented');
   assert.ok(states.some(s=>s.material.pages.some(p=>p.tool==='list_methods'&&p.items.some(i=>i.method_id===method.entity_id))),'catalog coordinates survive a real recycle');
   const delivered=bindDelivery(result);
   for(const state of states){
    assert.ok(state.measured_tokens<=512&&Buffer.byteLength(stable(state.material))<=4096);
    assert.ok(state.fit.tokenizer_calls<=4);assert.deepEqual(state.evidence,[]);
    const request=delivered.requests.find(r=>r.posture==='confirmed-successful-request'&&r.request_sha256===state.request_sha256);assert.ok(request);
    const messages=JSON.parse(result.captures[request.capture_indices[0]].prompt).messages;
    assert.ok(messages.some(m=>m.role==='user'&&m.content===stable(state.material)),'exact state binds successful actual request');
    for(const provenance of state.provenance)assert.ok(provenance.confirmed_receipts.every(i=>i<request.receipt_index),'pending facts cannot be promoted');
   }
  }else assert.equal(result.task_state_presentations.length,0);
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
  const navigationAudit=await auditNavigationPresentations({caseId:c.case_id,arm,episode:result,measurements:navigationMeasurements});navigationAudits+=navigationAudit.confirmed_navigation_presentations;
  const prediction=nativeFilePredictionR9(result);assert.equal(prediction.valid,true);
  assert.deepEqual(prediction.ranked_files,[record.path]);
  const runtime=result.events.find(e=>e.tool==='runtime_status').output;assert.equal(runtime.ok,true);
  if(c.case_id==='Defects4J-Closure-5')assert.equal(runtime.output.runtime_available,false);
  const row={case_id:c.case_id,arm,qualified:true,model_calls:calls,tool_actions:4,runtime_available:runtime.output.runtime_available,
   delivered_read_ids:result.selection.final_read_ids,result_sha256:save(join(cell,'RESULT.json'),{scripted_transport:true,result,binding,navigation_audit:navigationAudit,navigation_measurements:navigationMeasurements})};
  rows.push(row);console.log(JSON.stringify(row));
 }
}
for(const[p,pin]of Object.entries(pins))assert.equal(sha(readFileSync(p)),pin);assert.equal(rows.length,32);
const result={status:'all32-offline-profile-bound-native-method-episodes-qualified',freeze_sha256:freezeHash,rows,elapsed_ms:Date.now()-start,
 actual_provider_calls:0,reference_label_reads:0,canonical_byte_audits:32,profile_closure:profileClosureEvidence(),confirmed_navigation_reconstructions:navigationAudits,new_profile_end_to_end_tests_passed:7,strict_terminal_prediction_reconstructions:32,scripted_transport:true,guidance_sha256:ACQUISITION_GUIDANCE_SHA256_R7,native_binding:native.binding,
 authority_effect:'none',claim_ceiling:'Offline functionality only, no actual provider/tokenizer quality or superiority',open_questions_owner:'G01-NATIVE-PROFILE-CLOSURE-R9.json'};
console.log(JSON.stringify({result_sha256:save(join(OUT,'RESULT.json'),result),elapsed_ms:result.elapsed_ms,qualified:rows.length}));
