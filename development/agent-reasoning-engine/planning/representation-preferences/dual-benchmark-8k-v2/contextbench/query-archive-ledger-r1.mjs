// Additive query-archive production candidate. Open questions: QUERY-ARCHIVE-CANDIDATE-R1.md.
// Pure evidence reconciliation; filesystem/process settlement is separate. Open questions: COMPARISON-LEDGER-R2.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('comparison-ledger.'+m);};
const sha=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function reconcileComparisonLedger({cell,task,result,ledger,expected_identity,driver_binding=null,events}){
 need(['query-archive'].includes(cell?.comparison_arm),'arm');
 need(cell.context_limit===8000&&cell.limits?.total_tokens===96000&&cell.limits?.maximum_calls===96,'limits');
 need(task?.instance_id===cell.instance_id&&result?.instance_id===task.instance_id&&result.cell_id===cell.cell_id,'task-cell');
 need(sha(expected_identity)&&ledger?.identity===expected_identity,'external-identity');
 const {ledger_digest,...body}=ledger;need(hash(body)===ledger_digest&&body.version===1&&body.phase==='idle','settled-ledger');
 const scope={request:task.problem_statement,instance_id:task.instance_id,cell_id:cell.cell_id,cell_sha256:hash(cell)};
 if(cell.comparison_arm==='current-are')need(body.binding===hash(scope)&&driver_binding===null,'current-scope');
 else{
  const profile={model:'glm-5.3-flash',reasoning_effort:cell.provider_profile.reasoning_effort,output_cap:cell.limits.output_cap};
  const binding=hash({scope,profile,policy:'independent-native-v1'});
  assert.deepEqual(driver_binding,{binding,scope,profile,context_limit:8000,recycle_at:7999,safety_margin:1},'comparison-ledger.driver-binding');
  need(body.binding===binding,'candidate-scope');
 }
 need(Array.isArray(body.receipts)&&Array.isArray(result.receipts)&&Array.isArray(events),'evidence-arrays');
 assert.deepEqual(body.receipts,result.receipts,'comparison-ledger.returned-receipts');
 need(body.receipts.every(r=>r&&['model','tokenizer'].includes(r.kind)),'ledger-receipt-kinds');
 const models=body.receipts.filter(r=>r.kind==='model'),tokenizers=body.receipts.filter(r=>r.kind==='tokenizer');
 need(models.length>0&&models.length<=96&&body.model_calls===models.length&&body.tokenizer_calls===tokenizers.length,'attempt-counts');
 need(tokenizers.length<=(cell.comparison_arm==='current-are'?291:192),'tokenizer-ceiling');
 need(Array.isArray(result.index_tokenizer_receipts)&&result.index_tokenizer_receipts.length<=512,'index-receipts');
 need(providerAttemptHealth([...body.receipts,...result.index_tokenizer_receipts]).healthy,'attempt-health');
 // Index measurements are cached by request hash: a successful request appears once in the receipt list.
 const finalIndex=new Map();
 for(const event of events)if(event.kind==='index-tokenizer'){
  need(sha(event.receipt?.request_sha256),'index-event');finalIndex.set(event.receipt.request_sha256,event.receipt);
 }
 const index=result.index_tokenizer_receipts;
 need(new Set(index.map(r=>r.request_sha256)).size===index.length,'duplicate-index-receipt');
 assert.deepEqual([...finalIndex.values()],index,'comparison-ledger.index-journal');
 // Candidate captures are individual events; current ARE also journals captures in admission events.
 const captures=events.flatMap(e=>e.kind==='request-capture'?[e.capture]:Array.isArray(e.captures)?e.captures:[]);
 let input=0,output=0;
 for(const receipt of models){
  need(receipt.model==='glm-5.3-flash'&&receipt.output_cap===cell.limits.output_cap&&receipt.reasoning_effort===cell.provider_profile.reasoning_effort,'model-profile');
  need(captures.some(c=>typeof c?.prompt==='string'&&c.prompt_sha256===hash(c.prompt)&&hash(bodyForReceipt(c.prompt,receipt))===receipt.request_sha256),'model-capture');
  input+=receipt.input_tokens;output+=receipt.output_tokens;
  need(Number.isSafeInteger(input)&&Number.isSafeInteger(output)&&Number.isSafeInteger(input+output),'usage-overflow');
 }
 need(input+output<=96000,'token-ceiling');
 return {schema:'are.comparison-ledger-reconciliation/v1',arm:cell.comparison_arm,cell_id:cell.cell_id,ledger_sha256:hash(ledger),identity:expected_identity,model_calls:models.length,request_tokenizer_calls:tokenizers.length,index_tokenizer_calls:index.length,input_tokens:input,output_tokens:output,total_tokens:input+output,evidence_consistent:true,filesystem_settlement_pending:true,request_window_qualification_pending:true,benchmark_cleared:false};
}
