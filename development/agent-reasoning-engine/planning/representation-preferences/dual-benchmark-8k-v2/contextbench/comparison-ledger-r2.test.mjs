import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {reconcileComparisonLedger} from './comparison-ledger-r2.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
function fixture(arm='minimal-history'){
 const cell={comparison_arm:arm,cell_id:'fixture-'+arm,instance_id:'fixture',context_limit:8000,limits:{total_tokens:96000,maximum_calls:96,output_cap:1024},provider_profile:{reasoning_effort:'low'}};
 const task={instance_id:'fixture',problem_statement:'Repair the issue'},profile={model:'glm-5.3-flash',reasoning_effort:'low',output_cap:1024};
 const scope={request:task.problem_statement,instance_id:task.instance_id,cell_id:cell.cell_id,cell_sha256:hash(cell)};
 const binding=arm==='current-are'?hash(scope):hash({scope,profile,policy:'independent-native-v1'});
 const prompt=stable({messages:[{role:'user',content:task.problem_statement}],tools:[]});
 const receipt={...profile,kind:'model',dispatched:true,status:200,automatic_retries:0,input_tokens:100,output_tokens:20,request_sha256:hash(bodyForReceipt(prompt,profile))};
 const tokenizer={kind:'tokenizer',dispatched:true,status:200,automatic_retries:0,input_tokens:100,request_sha256:'b'.repeat(64)};
 const index={kind:'index-tokenizer',dispatched:true,status:200,tokens:50,request_sha256:'c'.repeat(64),transport_attempts:[{attempt:1,status:200,response_bytes:20}]};
 const body={version:1,binding,identity:'a'.repeat(64),phase:'idle',model_calls:1,tokenizer_calls:1,receipts:[tokenizer,receipt]};
 const capture={prompt,prompt_sha256:hash(prompt)};
 return {cell,task,result:{instance_id:task.instance_id,cell_id:cell.cell_id,receipts:structuredClone(body.receipts),index_tokenizer_receipts:[index]},ledger:{...body,ledger_digest:hash(body)},expected_identity:body.identity,driver_binding:arm==='current-are'?null:{binding,scope,profile,context_limit:8000,recycle_at:7999,safety_margin:1},events:[{kind:'index-tokenizer',receipt:{...index,status:'started',dispatched:false,transport_attempts:[]}},{kind:'index-tokenizer',receipt:index},arm==='current-are'?{kind:'dispatch-admission',captures:[capture]}:{kind:'request-capture',capture}]};
}
const reseal=f=>{const {ledger_digest,...body}=f.ledger;f.ledger.ledger_digest=hash(body);};
test('supports both binding formats and all three arm identities without accepting benchmark success',()=>{
 for(const arm of ['current-are','minimal-history','independent-investigations']){
  const r=reconcileComparisonLedger(fixture(arm));assert.equal(r.total_tokens,120);assert.equal(r.model_calls,1);assert.equal(r.index_tokenizer_calls,1);assert.equal(r.benchmark_cleared,false);assert.equal(r.filesystem_settlement_pending,true);
 }
});
test('altered, pending, cross-run and unpinned ledgers reject',()=>{
 for(const mutate of [f=>f.ledger.phase='model-pending',f=>{f.ledger.phase='failed';reseal(f);},f=>{f.ledger.binding='d'.repeat(64);reseal(f);},f=>f.expected_identity='e'.repeat(64),f=>f.driver_binding.scope.request='Another task',f=>f.result.receipts.pop()]){
  const f=fixture();mutate(f);assert.throws(()=>reconcileComparisonLedger(f));
 }
});
test('missing captures, index journal loss and hidden failed attempts reject',()=>{
 for(const mutate of [f=>f.events.pop(),f=>f.events[2].capture.prompt+=' ',f=>f.events.splice(1,1),f=>f.events.push({kind:'index-tokenizer',receipt:{...f.result.index_tokenizer_receipts[0],request_sha256:'d'.repeat(64)}}),f=>{f.ledger.receipts[0].status=500;f.result.receipts=structuredClone(f.ledger.receipts);reseal(f);}]){
  const f=fixture();mutate(f);assert.throws(()=>reconcileComparisonLedger(f));
 }
});
test('repeated model attempts retain multiplicity even with an identical request',()=>{
 const f=fixture();f.ledger.receipts.push(structuredClone(f.ledger.receipts[1]));f.ledger.model_calls=2;f.result.receipts=structuredClone(f.ledger.receipts);reseal(f);
 assert.equal(reconcileComparisonLedger(f).total_tokens,240);
 f.ledger.model_calls=1;reseal(f);assert.throws(()=>reconcileComparisonLedger(f),/attempt-counts/);
});

test('transport ledger rejects a misplaced successful index-tokenizer receipt',()=>{
 const f=fixture();
 f.ledger.receipts.push(structuredClone(f.result.index_tokenizer_receipts[0]));
 f.result.receipts=structuredClone(f.ledger.receipts);reseal(f);
 assert.throws(()=>reconcileComparisonLedger(f),/ledger-receipt-kinds/);
});
test('configured reasoning effort cannot differ from a consistently rebound receipt and capture',()=>{
 for(const arm of ['current-are','minimal-history','independent-investigations']){
  const f=fixture(arm),r=f.ledger.receipts[1];r.reasoning_effort='high';
  const capture=arm==='current-are'?f.events[2].captures[0]:f.events[2].capture;
  r.request_sha256=hash(bodyForReceipt(capture.prompt,r));
  f.result.receipts=structuredClone(f.ledger.receipts);reseal(f);
  assert.throws(()=>reconcileComparisonLedger(f),/model-profile/);
 }
});
