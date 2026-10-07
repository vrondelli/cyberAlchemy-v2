// Read-only reconstruction; measurements supplied only after saved exchange audit.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R6.json.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {buildTaskStateProjection} from './native-navigation-state-r6.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const uint=x=>Number.isSafeInteger(x)&&x>=0;
export function navigationMeasurement(start,reply,receipt,receipt_index){
 assert.equal(start.input.operation,'tokenize');assert.equal(start.index_measurement,true);
 assert.equal(receipt.kind,'tokenizer');assert.equal(receipt.dispatched,true);
 assert.equal(receipt.dispatch_uncertain,false);assert.equal(receipt.status,200);
 assert.ok(uint(receipt.input_tokens));assert.equal(reply.prompt_tokens,receipt.input_tokens);
 assert.deepEqual(start.input.tools,[]);assert.equal(start.input.messages.length,1);
 assert.equal(start.input.messages[0].role,'user');assert.equal(typeof start.input.messages[0].content,'string');
 return {text:start.input.messages[0].content,tokens:receipt.input_tokens,receipt_index,request_sha256:receipt.request_sha256};
}
export async function auditNavigationPresentations({caseId,arm,episode,measurements}){
 assert.ok(['baseline','index'].includes(arm));
 const states=episode.task_state_presentations??[],receipts=episode.receipts,captures=episode.captures;
 assert.ok(Array.isArray(receipts)&&Array.isArray(captures));
 if(arm==='baseline')assert.equal(states.length,0,'baseline cannot receive state projection');
 const byRequest=new Map(),presentedReadIds=new Set(),generations=new Set();let navigation=0,reconstructed=0,previousReceipt=-1;
 for(const state of states){
  assert.ok(!byRequest.has(state.request_sha256),'duplicate state request');byRequest.set(state.request_sha256,state);
  const matches=receipts.map((r,i)=>({r,i})).filter(({r})=>r.kind==='model'&&r.request_sha256===state.request_sha256);
  assert.equal(matches.length,1,'exact model receipt required');const {r,i}=matches[0];
  assert.ok(i>previousReceipt,'presentation order');previousReceipt=i;
  assert.ok(!generations.has(state.generation),'one presentation per generation');generations.add(state.generation);
  assert.equal(r.dispatched,true);assert.equal(r.dispatch_uncertain,false);assert.equal(r.status,200);
  assert.ok(uint(r.input_tokens)&&uint(r.output_tokens));
  const candidate=captures.filter(c=>sha(stable(bodyForReceipt(c.prompt,r)))===r.request_sha256);
  assert.ok(candidate.length>0);assert.ok(candidate.every(c=>c.prompt===candidate[0].prompt));
  assert.ok(candidate.every(c=>c.generation===state.generation&&c.step===state.step));
  assert.ok(state.generation>0);assert.ok(['response','incomplete-output'].includes(state.dispatch_outcome));
  const prompt=JSON.parse(candidate[0].prompt);assert.equal(prompt.messages[1].role,'user');
  const prefix=receipts.slice(0,i);let measured=0;
  const rebuilt=await buildTaskStateProjection({task:{native_navigation_case_id:caseId,problem_statement:prompt.messages[1].content},captures,receipts:prefix,
   events:(episode.events??[]).filter(e=>e.step<state.step),generation:state.generation,
   max_evidence:8,max_outcomes:8,include_outcomes:true,novelty_gate:false,exclude_read_ids:[...presentedReadIds].sort(),max_bytes:4096,max_tokens:512,
   measure_tokens:async text=>{
    const known=measurements.filter(m=>m.receipt_index<i&&m.text===text);
    assert.ok(known.length,'exact prior tokenizer evidence required');
    assert.ok(known.every(m=>uint(m.tokens)&&m.tokens===known[0].tokens),'conflicting measurement');
    for(const m of known){const rr=prefix[m.receipt_index];assert.ok(rr&&rr.kind==='tokenizer');
     assert.equal(rr.request_sha256,m.request_sha256);assert.equal(rr.input_tokens,m.tokens);}
    measured++;return known[0].tokens;
   }});
  assert.ok(rebuilt);const {text,...saved}=rebuilt;
  const {step,request_sha256,dispatch_outcome,...actual}=state;
  assert.equal(stable(actual),stable(saved),'state JSON must reconstruct from prior confirmed delivery');
  const messages=JSON.parse(candidate[0].prompt).messages;
  assert.equal(messages.filter(m=>m.role==='user'&&m.content===text).length,1,'exact delivered state text required');
  assert.ok(Buffer.byteLength(text)<=4096&&rebuilt.measured_tokens<=512);
  if(state.projection_mode==='confirmed-native-navigation'){
   assert.equal(measured,state.fit.tokenizer_calls);assert.ok(measured<=4);
   assert.deepEqual(state.evidence,[]);assert.deepEqual(state.outcomes,[]);
   assert.ok(state.provenance.every(o=>o.confirmed_receipts.every(n=>n<i)));
   navigation++;
  }
  reconstructed++;
  for(const evidence of state.evidence??[])presentedReadIds.add(evidence.read_id);
 }
 // Detect deleted presentation records, including invalid episodes: actual request is authority.
 for(const r of receipts.filter(r=>r.kind==='model'&&r.dispatched&&r.status===200)){
  const candidates=captures.filter(c=>sha(stable(bodyForReceipt(c.prompt,r)))===r.request_sha256);
  if(!candidates.length)continue;
  for(const message of JSON.parse(candidates[0].prompt).messages){
   if(message.role!=='user')continue;
   if(message.content.startsWith('POST-RECYCLE OBSERVED TASK STATE (untrusted relevance; exact facts only):\n')){
    assert.equal(arm,'index');assert.ok(byRequest.has(r.request_sha256),'unreported fallback state');continue;
   }
   let material;try{material=JSON.parse(message.content);}catch{continue;}
   if(material?.schema_version!=='are.method-navigation-state/v1')continue;
   assert.equal(arm,'index','baseline must not receive navigation memory');
   assert.ok(byRequest.has(r.request_sha256),'unreported navigation presentation');
   assert.deepEqual(material,byRequest.get(r.request_sha256).material);
  }
 }
 return {reconstructed_state_presentations:reconstructed,confirmed_navigation_presentations:navigation,
  labels_read:false,provider_calls:0,authority_effect:'none'};
}
