// Separate post-seal audit; never reads evaluator labels or dispatches providers.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R8.json.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {providerBody,validateReply} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';
import {stable,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {selectMethodHandleSubmission} from './method-selection-terminal-r5.mjs';
import {checkAcquisitionGuidanceRequestR7} from './audit-acquisition-guidance-r7.mjs';
import {ACQUISITION_GUIDANCE_SHA256_R7} from './evidence-acquisition-guidance-r7.mjs';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
import {auditNavigationPresentations,navigationMeasurement} from './audit-navigation-state-r6b.mjs';
const ROOT='/home/vlad_/are-benchmark-archive/g01-native-method-live-r8-20261007';
const INDEX='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';
const SOURCE='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007';
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=(p,pin)=>{const b=readFileSync(p);if(pin)assert.equal(sha(b),pin);return JSON.parse(b);};
const uint=x=>Number.isSafeInteger(x)&&x>=0;

export function checkSavedExchange(start,reply,receipt){
 const hash=sha(providerBody(start.input));assert.equal(start.request_sha256,hash);
 assert.equal(reply.request_sha256,hash);assert.equal(receipt.request_sha256,hash);
 assert.equal(reply.request_id,start.input.request_id);assert.equal(reply.operation,start.input.operation);
 if(!reply.dispatch_uncertain)validateReply(reply,start.input);
 assert.equal(receipt.dispatched,reply.dispatched===true);
 assert.equal(receipt.dispatch_uncertain,reply.dispatch_uncertain===true);
 assert.equal(receipt.status,reply.status??null);
 assert.equal(receipt.input_tokens,reply.prompt_tokens??null);
 assert.equal(receipt.output_tokens,start.input.operation==='generate'?reply.completion_tokens??null:0);
 assert.equal(receipt.failure_code,reply.failure_code??null);
 assert.equal(receipt.output_cap,512);assert.equal(receipt.automatic_retries,0);
 assert.equal(receipt.kind,start.input.operation==='generate'?'model':'tokenizer');
 return start.input.operation==='generate'&&uint(reply.prompt_tokens)&&uint(reply.completion_tokens)
  ?reply.prompt_tokens+reply.completion_tokens:0;
}

export function checkCanonicalObservation(output,bytes){
 assert.equal(sha(bytes),output.source_sha256);
 assert.equal(output.complete_method,true);
 assert.ok(uint(output.source_byte_start)&&uint(output.source_byte_end));
 assert.ok(output.source_byte_end>=output.source_byte_start&&output.source_byte_end<=bytes.length);
 const body=bytes.subarray(output.source_byte_start,output.source_byte_end);
 assert.equal(body.toString('utf8'),output.utf8);
 assert.equal(body.length,output.byte_count);assert.equal(sha(body),output.method_source_sha256);
}

export function checkCanonicalMethodObservation(output,bytes,record){
 checkCanonicalObservation(output,bytes);
 assert.equal(output.path,record.path);assert.equal(output.source_sha256,record.source_sha256);
 const method=record.methods.find(m=>m.entity_id===output.method_id);assert.ok(method);
 assert.equal(method.span.complete,true);assert.equal(output.source_byte_start,method.span.start_utf8);
 assert.equal(output.source_byte_end,method.span.end_utf8);assert.equal(output.start_line,method.span.start_line);
 assert.equal(output.end_line,method.span.end_line);assert.equal(output.utf8,method.span.source);
}
export function selectEpisodeTerminal(episode){
 const response_capture=episode.response_captures.at(-1);
 const presentation=episode.method_handle_presentations.at(-1);
 assert.equal(presentation.request_sha256,response_capture.request_sha256);
 assert.equal(presentation.receipt_index,response_capture.receipt_index);
 assert.equal(typeof presentation.finalizing,'boolean');
 return selectMethodHandleSubmission({...episode,response_capture,table:presentation.table,finalizing:presentation.finalizing});
}
export async function audit(){
 const seal=read(join(ROOT,'PREDICTION-SEAL.json'));
 assert.equal(seal.gold_opened,false);assert.equal(seal.expected_predictions,32);
 const result=read(join(ROOT,'RESULT.json'),seal.result_sha256);
 const freeze=read(join(ROOT,'FREEZE.json'),seal.freeze_sha256);
 assert.equal(result.freeze_sha256,seal.freeze_sha256);
 for(const[p,pin]of Object.entries(freeze.source_pins))assert.equal(sha(readFileSync(p)),pin);
 assert.equal(freeze.cases.length,16);assert.equal(result.predictions.length,32);
 const expected=freeze.cases.flatMap(c=>['baseline','index'].map(arm=>[c.case_id,arm]));
 assert.deepEqual(result.predictions.map(p=>[p.case_id,p.arm]),expected);
 const index=read(join(INDEX,'RESULT.json'),'4476e7072b6117bc7c7c8bae481f85e1496e8c7b535dfcd520ef46b3b2443f56');
 const canonicalCases=new Map(index.rows.map(r=>[r.case_id,r])),catalogs=new Map();
 const catalog=caseId=>{
  if(!catalogs.has(caseId)){const bytes=readFileSync(join(INDEX,caseId,'PARSER-OUTPUT.jsonl'));
   assert.equal(sha(bytes),canonicalCases.get(caseId).parser_output_sha256);
   catalogs.set(caseId,new Map(bytes.toString('utf8').trimEnd().split('\n').map(JSON.parse).map(r=>[r.path,r])));}
  return catalogs.get(caseId);
 };
 let statePresentations=0,navigationPresentations=0,guidedGenerations=0;
 const sequences=[],totals={baseline:0,index:0};let valid=0,sourceReads=0,modelCalls=0,tokenizerCalls=0;
 for(const row of result.rows){
  const cell=join(ROOT,row.cell),saved=read(join(cell,'RESULT.json'),row.result_sha256);
  assert.equal(saved.gold_opened,false);assert.equal(saved.actual_provider,true);
  assert.deepEqual(saved.prediction,result.predictions[row.ordinal-1]);
  assert.equal(saved.prediction.ordinal,row.ordinal);assert.equal(saved.prediction.case_id,row.case_id);
  assert.equal(saved.prediction.arm,row.arm);assert.equal(saved.prediction.valid,row.valid);
  const requests=join(cell,'requests'),numbers=readdirSync(requests).filter(n=>/^\d+-STARTED\.json$/.test(n))
   .map(n=>Number(n.split('-')[0])).sort((a,b)=>a-b);
  assert.equal(numbers.length,saved.receipts.length);
  let generations=0,tokenizers=0;const navigationMeasurements=[],measuredRequests=new Map();
  const task=freeze.cases.find(c=>c.case_id===row.case_id).problem_statement;
  for(const[n,i]of numbers.map((n,i)=>[n,i])){
   sequences.push(n);const start=read(join(requests,n+'-STARTED.json'));
   const reply=read(join(requests,n+'-REPLY.json')),receipt=read(join(requests,n+'-RECEIPT.json'));
   assert.deepEqual(receipt,saved.receipts[i]);assert.equal(start.input.request_id,'g01-native-method-r8-'+n);
   totals[row.arm]+=checkSavedExchange(start,reply,receipt);
   if(!start.index_measurement){
    const guided=checkAcquisitionGuidanceRequestR7(start.input,row.arm,task);
    const body=stable({messages:start.input.messages,tools:start.input.tools});
    if(start.input.operation==='tokenize'&&receipt.dispatched&&receipt.status===200&&!receipt.dispatch_uncertain)measuredRequests.set(body,reply.prompt_tokens);
    if(start.input.operation==='generate'){
     assert.ok(measuredRequests.has(body),'exact guidance-bearing generation must have prior same-cell tokenizer measurement');
     const measured=measuredRequests.get(body);assert.ok(uint(measured)&&measured+512<=8192);
     assert.ok(uint(reply.prompt_tokens)&&reply.prompt_tokens<=measured);
     if(guided)guidedGenerations++;
    }
   }
   if(start.input.operation==='tokenize'&&start.index_measurement===true)navigationMeasurements.push(navigationMeasurement(start,reply,receipt,i));
   if(start.input.operation==='generate')generations++;else tokenizers++;
  }
  assert.equal(generations,saved.model_calls);assert.equal(tokenizers,saved.tokenizer_calls);
  assert.ok(generations<=11&&tokenizers<=128);modelCalls+=generations;tokenizerCalls+=tokenizers;
  if(saved.result){assert.deepEqual(saved.result.receipts,saved.receipts);
   const stateAudit=await auditNavigationPresentations({caseId:row.case_id,arm:row.arm,episode:saved.result,measurements:navigationMeasurements});
   statePresentations+=stateAudit.reconstructed_state_presentations;navigationPresentations+=stateAudit.confirmed_navigation_presentations;}
  if(!saved.prediction.valid){assert.deepEqual(saved.prediction.ranked_files,[]);continue;}
  valid++;const episode=saved.result;
  assert.equal(episode.status,'final_context_selected');assert.equal(episode.functionality_valid,true);
  assert.equal(episode.method_tool_accounting.over_budget,false);
  assert.ok(episode.method_tool_accounting.all_tool_attempts<=10);
  const selection=selectEpisodeTerminal(episode);
  assert.deepEqual(selection.final_read_ids,episode.selection.final_read_ids);
  assert.equal(selection.handle_table_sha256,episode.selection.handle_table_sha256);
  assert.deepEqual(selection.final_read_ids,saved.prediction.final_read_ids);
  const binding=bindDelivery(episode);assert.deepEqual(binding.unmapped,[]);
  assert.equal(binding.token_accounting.cost_complete,true);
  assert.ok(binding.token_accounting.known_total_tokens<=65536);
  const reads=new Map(binding.read_observations.map(o=>[o.id,o]));
  assert.deepEqual([...new Set(selection.final_read_ids.map(id=>{assert.ok(reads.has(id));return reads.get(id).path;}))],saved.prediction.ranked_files);
  for(const observation of reads.values()){
   let checked=false;
   for(const request of binding.requests.filter(r=>r.posture==='confirmed-successful-request'&&r.read_ids.includes(observation.id))){
    const prompt=JSON.parse(episode.captures[request.capture_indices[0]].prompt);
    const callId=observation.tool_call_id;
    for(const message of prompt.messages.filter(m=>m.role==='tool'&&m.tool_call_id===callId)){
     const envelope=JSON.parse(message.content);if(envelope.ok!==true)continue;
     const output=envelope.output;assert.equal(output.utf8,observation.body);
     const root=join(SOURCE,row.case_id,'buggy-java-only/corpus');const path=resolve(root,output.path);
     assert.ok(path.startsWith(root+sep));checkCanonicalMethodObservation(output,readFileSync(path),catalog(row.case_id).get(output.path));checked=true;
    }
   }
   assert.ok(checked,'confirmed source observation must bind canonical complete bytes');sourceReads++;
  }
 }
 assert.equal(result.completed,result.rows.length);assert.equal(result.valid,valid);
 assert.equal(new Set(sequences).size,sequences.length);
 assert.deepEqual([...sequences].sort((a,b)=>a-b),Array.from({length:result.provider_calls},(_,i)=>i+1));
 assert.deepEqual(totals,result.arm_generation_tokens);
 assert.equal(totals.baseline+totals.index,result.known_generation_tokens);
 assert.ok(result.known_generation_tokens<=2097152);
 const output={status:'post-seal-native-request-source-accounting-audit-passed',
  result_sha256:seal.result_sha256,prediction_seal_sha256:sha(readFileSync(join(ROOT,'PREDICTION-SEAL.json'))),
  audit_source_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),completed:result.completed,valid,
  provider_calls:sequences.length,model_calls:modelCalls,tokenizer_calls:tokenizerCalls,
  confirmed_complete_source_reads:sourceReads,reconstructed_state_presentations:statePresentations,confirmed_navigation_presentations:navigationPresentations,arm_generation_tokens:totals,
  guidance_sha256:ACQUISITION_GUIDANCE_SHA256_R7,guided_generations:guidedGenerations,labels_read:false,authority_effect:'none',
  limitation:'Canonical index extents and complete bytes verified for confirmed reads in valid episodes only. Reuses native terminal/delivery primitives; not an independent semantic correctness oracle.',
  open_questions_owner:'G01-NATIVE-METHOD-LIVE-R8.json'};
 createReceipt(join(ROOT,'AUDIT.json'),output);return output;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))console.log(JSON.stringify(await audit()));
