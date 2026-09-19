// Receipt-bound search-call accounting, including incomplete runs.
// Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import Ajv from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules/ajv/dist/ajv.js';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {rankedSearchSchema,validateSearchStructure} from './schema-agreement-arguments-r1.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const advertised=new Ajv({strict:true,allErrors:true}).compile(structuredClone(rankedSearchSchema));
export function censusSearchCalls({events,receipts}){
 assert.ok(Array.isArray(events)&&Array.isArray(receipts));
 for(const e of events){if(e.kind!=='response-capture')continue;const i=e.response_capture?.receipt_index;assert.ok(Number.isSafeInteger(i)&&i>=0&&i<receipts.length&&receipts[i].kind==='model'&&receipts[i].dispatched===true,'search-census.orphan-capture');}
 const calls=new Map(),seen=new Set();let missingResponses=0,totalTokens=0,unknownUsage=0;
 for(const [index,r] of receipts.entries()){
  if(r.kind!=='model'||r.dispatched!==true)continue;
  const knownInput=Number.isSafeInteger(r.input_tokens)&&r.input_tokens>=0,knownOutput=Number.isSafeInteger(r.output_tokens)&&r.output_tokens>=0;
  totalTokens+=(knownInput?r.input_tokens:0)+(knownOutput?r.output_tokens:0);assert.ok(Number.isSafeInteger(totalTokens));
  if(!knownInput||!knownOutput)unknownUsage++;
  const found=events.filter(e=>e.kind==='response-capture'&&e.response_capture?.receipt_index===index);
  if(!found.length){missingResponses++;continue;}
  assert.equal(found.length,1,'search-census.duplicate-response');
  const c=found[0].response_capture,{capture_sha256,...body}=c;
  assert.equal(hash(body),capture_sha256,'search-census.capture-hash');assert.equal(hash(r),c.receipt_sha256,'search-census.receipt-hash');assert.equal(r.request_sha256,c.request_sha256,'search-census.request-hash');
  if(r.status!==200||r.failure_code||!c.public_response?.message){missingResponses++;continue;}
  const batch=c.public_response.message.tool_calls??[];assert.ok(Array.isArray(batch));
  for(const call of batch){assert.ok(typeof call.id==='string'&&call.id.length&&!seen.has(call.id),'search-census.call-identity');seen.add(call.id);if(call.function?.name==='search')calls.set(call.id,call);}
 }
 const outputs=new Map();
 for(const e of events){if(e.kind!=='source-tool-result'||e.call?.function?.name!=='search')continue;
  assert.ok(calls.has(e.call.id),'search-census.orphan-result');assert.equal(stable(e.call),stable(calls.get(e.call.id)),'search-census.substituted-call');assert.ok(!outputs.has(e.call.id),'search-census.duplicate-result');outputs.set(e.call.id,e.output);
 }
 const rows=[];
 for(const call of calls.values()){
  let args,classification,structural=null;
  try{assert.equal(typeof call.function.arguments,'string');args=JSON.parse(call.function.arguments);}catch{classification='malformed-json';}
  if(!classification){
   structural=validateSearchStructure(args).ok;assert.equal(advertised(args),structural,'search-census.structural-disagreement');
   if(!args||typeof args!=='object'||Array.isArray(args))classification='invalid-shape';
   else if(args.mode==='ranked')classification='ranked';
   else if(args.mode==='literal')classification='literal';
   else if(!Object.hasOwn(args,'mode'))classification=structural?'literal-default':'missing-mode-invalid';
   else classification='invalid-mode';
  }
  const output=outputs.get(call.id),outcome=output?.ok===true?'accepted':output?.ok===false?'rejected':'unresolved';
  rows.push({call_id:call.id,classification,structural_valid:structural,outcome});
 }
 const count=fn=>rows.filter(fn).length,ranked=count(r=>r.classification==='ranked'),rankedRejected=count(r=>r.classification==='ranked'&&r.outcome==='rejected'),rejected=count(r=>r.outcome==='rejected'),unresolved=count(r=>r.outcome==='unresolved');
 const classifications=Object.fromEntries(['ranked','literal','literal-default','malformed-json','invalid-shape','missing-mode-invalid','invalid-mode'].map(k=>[k,count(r=>r.classification===k)]));
 const complete=missingResponses===0&&unknownUsage===0&&unresolved===0;
 return {schema:'are.schema-agreement-search-census/v1',rows,classifications,requested_search_calls:rows.length,rejected_search_calls:rejected,unresolved_search_calls:unresolved,ranked_requested_calls:ranked,ranked_rejected_calls:rankedRejected,missing_model_responses:missingResponses,unknown_usage_receipts:unknownUsage,known_model_tokens:totalTokens,structural_contract:'schema-agreement-r1-local-replay',structural_disagreements:0,counters_reconstructed:complete,ranked_rejection_rate:complete&&ranked?rankedRejected/ranked:null,all_search_invalid_rate:complete&&rows.length?rejected/rows.length:null,mechanism_evaluable:complete&&ranked>0,authority_effect:'none',open_questions_ref:'RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md'};
}
