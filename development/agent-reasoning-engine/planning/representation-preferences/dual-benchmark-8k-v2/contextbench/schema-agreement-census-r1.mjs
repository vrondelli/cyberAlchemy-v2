// Schema-agreement candidate. Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import {censusSearchCalls} from './schema-agreement-search-census-r2.mjs';
// Successful-run mechanism census. Failed/incomplete runs must retain costs and
// receive counters_reconstructed:false in cohort adjudication, never be dropped.
// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {reconstructRankedReadPrediction} from './schema-agreement-prediction-r1.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('ranked-census.'+m);};
export function censusRankedReadRun(input){
 reconstructRankedReadPrediction(input);
 const {events,result}=input,seen=new Set(),rankedCalls=new Map();let navigation=0,total=0;
 for(const [index,r] of result.receipts.entries()){
  if(r.kind!=='model'||r.dispatched!==true)continue;
  need(Number.isSafeInteger(r.input_tokens)&&r.input_tokens>=0&&Number.isSafeInteger(r.output_tokens)&&r.output_tokens>=0,'known-usage');
  total+=r.input_tokens+r.output_tokens;need(Number.isSafeInteger(total),'usage-overflow');
  const found=events.filter(e=>e.kind==='response-capture'&&e.response_capture?.receipt_index===index);need(found.length===1,'response-count');
  const event=found[0],c=event.response_capture,{capture_sha256,...body}=c;
  need(hash(body)===capture_sha256&&hash(r)===c.receipt_sha256&&r.request_sha256===c.request_sha256&&r.status===200&&!r.failure_code,'response-binding');
  const calls=c.public_response.message.tool_calls??[];
  if(event.phase==='discover'&&calls.length&&calls.every(call=>['list_files','rank_sources'].includes(call.function?.name)))navigation++;
  for(const call of calls){
   need(typeof call.id==='string'&&!seen.has(call.id),'call-identity');seen.add(call.id);
   let args;try{args=JSON.parse(call.function.arguments);}catch{continue;}
   if(call.function.name==='search'&&args?.mode==='ranked')rankedCalls.set(call.id,call);
  }
 }
 let successful=0,returned=0,empty=0;
 for(const call of rankedCalls.values()){
  const outputs=events.filter(e=>e.kind==='source-tool-result'&&e.call?.id===call.id);need(outputs.length===1&&stable(outputs[0].call)===stable(call),'ranked-output');
  if(outputs[0].output.ok===true){successful++;const n=outputs[0].output.output.observations.length;returned+=n;if(n===0)empty++;}
 }
 const records=result.branches.flatMap(b=>b.ranked_evidence_records??[]);need(records.length===successful,'successful-record-count');
 const packet=events.find(e=>e.kind==='terminal-packet');
 const confirmed=new Set(packet.joined.branch_bindings.flatMap(b=>b.receipt_confirmed_ranked_read_ids));
 need([...confirmed].every(id=>packet.joined.read_observations.some(r=>r.id===id)),'confirmed-membership');
 return {search_census:censusSearchCalls({events,receipts:result.receipts}),schema:'are.schema-agreement-census/v1',counters_reconstructed:true,total_model_tokens:total,counters:{'ranked-mode-requested-calls':rankedCalls.size,'ranked-mode-successful-calls':successful,'ranked-windows-returned':returned,'receipt-confirmed-ranked-observations':confirmed.size,'ranked-mode-empty-output-calls':empty,'navigation-only-model-responses':navigation},campaign_goal_achieved:false,authority_effect:'none',open_questions_ref:'RANKED-READ-ACQUISITION-PROTOCOL-R2.md'};
}
