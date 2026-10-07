import {observationItems,recoveryName} from './bounded-archive-frontier-recovery-r1.mjs';
// Receipt-first decoder prototype; no production consumer yet. Open questions: TOOL-PAYLOAD-CODEC.md.
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt,observationMaterial} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {decodeToolPayload} from './tool-payload-codec.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex'),need=(v,m)=>{if(!v)throw Error(m);},uint=x=>Number.isSafeInteger(x)&&x>=0;
export function bindCompactDelivery({captures,receipts}){
 need(Array.isArray(captures)&&Array.isArray(receipts),'binding.inputs');
 const parsed=captures.map((c,index)=>{need(typeof c.prompt==='string'&&hash(c.prompt)===c.prompt_sha256,'capture.digest');return {index,c};});
 const requests=[],reads=new Map();let input=0,output=0,unknown=0;const failures=[];
 for(const [receipt_index,r] of receipts.entries()){
  if(r.kind!=='model')continue;
  need(typeof r.dispatched==='boolean','receipt.dispatch-unknown');
  if(!r.dispatched){requests.push({receipt_index,posture:'not-dispatched'});continue;}
  if(uint(r.input_tokens)&&uint(r.output_tokens)){input+=r.input_tokens;output+=r.output_tokens;}else unknown++;
  // A timeout or rejected request is not confirmation that the model consumed context.
  if(r.status!==200||r.failure_code||!uint(r.input_tokens)||!uint(r.output_tokens)){
   requests.push({receipt_index,posture:'delivery-unconfirmed',request_sha256:r.request_sha256});continue;
  }
  need(/^[a-f0-9]{64}$/.test(r.request_sha256),'receipt.request-digest');
  const matches=[];
  for(const p of parsed){const body=bodyForReceipt(p.c.prompt,r);if(hash(body)===r.request_sha256)matches.push({...p,body});}
  need(matches.length>0,'receipt.capture-not-found');
  // Repeated measurements/captures of identical bytes are one possible rendering,
  // while separate dispatched receipts are always separately counted model calls.
  const bodies=new Set(matches.map(m=>stable(m.body)));need(bodies.size===1,'capture.ambiguous-bytes');
  const selected=matches[0],requestReads=[];const calls=new Map();
  for(const m of selected.body.messages){
   if(m.role==='assistant')for(const c of m.tool_calls??[]){
    if(calls.has(c.id))need(stable(calls.get(c.id))===stable(c),'tool.identity-conflict');calls.set(c.id,c);
   }
   if(m.role!=='tool')continue;
   const call=calls.get(m.tool_call_id);if(!call||!['read_file','read-file','search',recoveryName].includes(call.function?.name))continue;
   let result;try{result=decodeToolPayload({tool:call.function.name,payload:JSON.parse(m.content)});}catch{failures.push({receipt_index,tool_call_id:m.tool_call_id,reason:'unparseable-read-envelope'});continue;}
   // A rejected read has delivered no source evidence. Its arguments may be the
   // malformed input that caused the rejection, so they are irrelevant to the
   // delivery ledger and must not poison later valid observations.
   if(result?.ok!==true)continue;
   let args;try{args=JSON.parse(call.function.arguments);}catch{failures.push({receipt_index,tool_call_id:m.tool_call_id,reason:'unparseable-read-envelope'});continue;}
   let items;try{items=observationItems(call,result);}catch(e){failures.push({receipt_index,tool_call_id:m.tool_call_id,reason:e.message});continue;}
   for(const {tool_call_id,o} of items){
    let material;try{material=observationMaterial(tool_call_id,o);}catch(e){failures.push({receipt_index,tool_call_id,reason:e.message});continue;}
    if(call.function.name==='search')need(typeof args.query==='string'&&o.utf8.includes(args.query)&&o.path.startsWith(args.path_prefix??''),'search.arguments-output-mismatch');
    else if(['read_file','read-file'].includes(call.function.name))need(args.path===o.path&&args.start_line===o.start_line,'read.arguments-output-mismatch');
    else {
     // Recovery's compact wire names an immutable archive observation, not a
     // path/range. observationItems has already checked that origin binding.
     const compact='archive_sha256,observation_index';
     const full='archive_sha256,line_count,observation_index,path,revision,start_line';
     const shape=Object.keys(args).sort().join(',');
     need(call.function.name===recoveryName&&(shape===compact||shape===full),'recovery.arguments-shape');
     if(shape===full)need(args.path===o.path&&args.revision===o.source_revision&&
       args.start_line===o.start_line&&o.end_line<=args.start_line+args.line_count-1,
     'recovery.arguments-output-mismatch');
    }
    const id=hash(material),previous=reads.get(tool_call_id);
    if(previous&&previous.id!==id){failures.push({receipt_index,tool_call_id,reason:'read-visible-version-changed'});continue;}
    if(!previous)reads.set(tool_call_id,{id,...material,first_confirmed_receipt:receipt_index,confirmed_receipts:[]});
    reads.get(tool_call_id).confirmed_receipts.push(receipt_index);requestReads.push(id);
   }
  }
  requests.push({receipt_index,posture:'confirmed-successful-request',request_sha256:r.request_sha256,capture_indices:matches.map(m=>m.index),prompt_sha256:selected.c.prompt_sha256,read_ids:[...new Set(requestReads)]});
 }
 return {schema_version:'are.contextbench-delivery-binding/v1',requests,read_observations:[...reads.values()],unmapped:failures,token_accounting:{known_input_tokens:input,known_output_tokens:output,known_total_tokens:input+output,unknown_usage_dispatched_requests:unknown,cost_complete:unknown===0},claim_ceiling:'Successful request receipt binds visible read bytes; source validation, final selection and semantic use require separate evidence. Archives, tokenizer-only captures and unsuccessful dispatches are not confirmed delivery.',authority_effect:'none',open_questions_ref:'README.md'};
}
