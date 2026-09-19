import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {hash} from '/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/transport-bounded-v3.mjs';

const root='/repo';
const read=path=>JSON.parse(readFileSync(path));
const campaign=read(join(root,'CAMPAIGN-SETTLEMENT.json'));
const exports=read(join(root,'EXPORTS.json'));
assert.equal(campaign.outcomes.length,2);
const rows=[];
for(const outcome of campaign.outcomes){
  const run=join(root,'runs',outcome.slot.id);
  const row={...exports.rows.find(item=>item.slot_id===outcome.slot.id),accounting_verified:false};
  assert.equal(outcome.harness_state.Running,false);
  try{
    const seal=read(join(run,'evidence/RESULTS.json'));
    const ledger=read(join(run,'evidence/run/state/glm-transport-ledger.json'));
    const {ledger_digest,...material}=ledger;
    assert.equal(hash(material),ledger_digest);
    const models=ledger.receipts.filter(receipt=>receipt.kind==='model'&&receipt.dispatched!==false);
    const known=models.filter(receipt=>receipt.dispatched===true&&Number.isSafeInteger(receipt.input_tokens)&&Number.isSafeInteger(receipt.output_tokens));
    const tokens=known.reduce((sum,receipt)=>sum+receipt.input_tokens+receipt.output_tokens,0);
    const unknown=models.length-known.length;
    for(const [key,value] of Object.entries({
      known_total_tokens:tokens,
      model_calls:models.length,
      unknown_usage_dispatched_requests:unknown
    })){
      assert.equal(seal[key],value);
      assert.equal(row[key],value);
    }
    const events=readFileSync(join(run,'evidence/run/events.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
    const rejected=events.filter(event=>event.kind==='tool-batch-rejected');
    for(const event of rejected){
      assert.equal(event.effects,'none');
      assert.equal(events.some(candidate=>candidate.kind==='tool-result'&&candidate.step===event.step),false);
    }
    row.tool_batch_rejections=rejected.length;
    row.ranked_primers=events.filter(event=>event.kind==='ranked-source-primer').length;
    row.ranked_queries=events.filter(event=>event.kind==='tool-result'&&event.tool==='rank_sources').length;
    row.maximum_model_latency_ms=Math.max(0,...models.map(receipt=>receipt.latency_ms??0));
    row.maximum_input_tokens=Math.max(0,...known.map(receipt=>receipt.input_tokens));
    row.finish_reasons=models.map(receipt=>receipt.finish_reason);
    row.tool_call_shapes=models.filter(receipt=>receipt.tool_call_shape).map(receipt=>receipt.tool_call_shape);
    row.ledger_digest=ledger_digest;
    row.accounting_verified=unknown===0;
    row.ledger_reconciled=true;
  }catch(error){
    row.verification_error=String(error.message);
  }
  rows.push(row);
}
writeFileSync(join(root,'ACCOUNTING-VERIFICATION.json'),JSON.stringify({
  rows,
  all_accounting_verified:rows.every(row=>row.accounting_verified),
  benchmark_cleared:false,
  open_questions_ref:'PLAN.md'
},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(rows.map(({slot_id,valid_export,known_total_tokens,accounting_verified,verification_error})=>({slot_id,valid_export,known_total_tokens,accounting_verified,verification_error}))));
