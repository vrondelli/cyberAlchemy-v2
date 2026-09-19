// Read-only verification plus exclusive analysis output. Open questions: PLAN.md.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';import {join} from 'node:path';import assert from 'node:assert/strict';
import {reconcileTransport} from '/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-durable-transport.mjs';
import {hash} from '/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/packet-diversity-v1/transport-bounded-v3.mjs';
const root='/repo',read=p=>JSON.parse(readFileSync(p)),campaign=read(join(root,'CAMPAIGN-SETTLEMENT.json')),exports=read(join(root,'EXPORTS.json')),rows=[];
assert.equal(campaign.outcomes.length,1);
for(const outcome of campaign.outcomes){
 const r=join(root,'runs',outcome.slot.id),row={...exports.rows.find(x=>x.slot_id===outcome.slot.id),accounting_verified:false};
 assert.equal(outcome.harness_state.Running,false);if(outcome.proxy_state)assert.equal(outcome.proxy_state.Running,false);
 try{
 if(outcome.slot.arm==='current-are'){
  const seal=read(join(r,'evidence/RESULTS.json')),ledger=read(join(r,'evidence/run/state/glm-transport-ledger.json')),{ledger_digest,...material}=ledger;
  assert.equal(hash(material),ledger_digest);const models=ledger.receipts.filter(x=>x.kind==='model'&&x.dispatched!==false),known=models.filter(x=>x.dispatched===true&&Number.isSafeInteger(x.input_tokens)&&Number.isSafeInteger(x.output_tokens));
  const tokens=known.reduce((n,x)=>n+x.input_tokens+x.output_tokens,0),unknown=models.length-known.length;
  for(const[k,v]of Object.entries({known_total_tokens:tokens,model_calls:models.length,unknown_usage_dispatched_requests:unknown})){assert.equal(seal[k],v);assert.equal(row[k],v);}
  row.maximum_input_tokens=Math.max(0,...known.map(x=>x.input_tokens));row.maximum_reserved_tokens=Math.max(0,...known.map(x=>x.reserved_input_tokens+x.output_cap));
  const episode=read(join(r,'evidence/run/result.json'));row.recycles=episode.recycling?.recycles??null;row.episode_error=episode.error??null;row.finish_reasons=models.map(x=>x.finish_reason);row.tool_call_shapes=models.filter(x=>x.tool_call_shape).map(x=>x.tool_call_shape);const mappings=models.flatMap(r=>{const e=r.tool_call_identity;if(!e)return [];assert.equal(e.request_sha256,r.request_sha256);for(const m of e.mapping)assert.equal(m.runtime_id,'call_are_'+hash({version:1,request_sha256:e.request_sha256,sequence:e.sequence,provider_public_sha256:e.provider_public_sha256,index:m.index,provider_id:m.provider_id}).slice(0,48));return e.mapping;});
  row.repeated_provider_ids=mappings.length-new Set(mappings.map(m=>m.provider_id)).size;row.runtime_ids_unique=new Set(mappings.map(m=>m.runtime_id)).size===mappings.length;
  assert.ok(row.runtime_ids_unique);row.scoped_identity_receipts=models.filter(x=>x.tool_call_identity).length;row.identity_mapping_count=models.reduce((n,x)=>n+(x.tool_call_identity?.mapping.length??0),0);row.ledger_digest=ledger_digest;row.accounting_verified=unknown===0;
 }else{
  const a=reconcileTransport(join(r,'transport')),seal=read(join(r,'transport/RESULTS.json'));for(const k of Object.keys(a))assert.deepEqual(seal[k],a[k]);
  for(const k of ['known_total_tokens','model_calls','unknown_usage_dispatched_requests'])assert.equal(row[k],a[k]);
  const events=a.bindings.map(b=>read(join(r,'transport',b.name))),admissions=events.filter(e=>e.kind==='admission'),receipts=events.filter(e=>e.kind==='receipt');
  row.maximum_input_tokens=Math.max(0,...receipts.map(e=>e.usage?.input??0));row.maximum_reserved_tokens=Math.max(0,...admissions.filter(e=>e.admitted).map(e=>e.reservation));row.window_denials=admissions.filter(e=>e.reservation>e.window).length;
  const summaryAttempts=new Set(events.filter(e=>e.kind==='request'&&JSON.parse(e.request_bytes).messages.some(m=>typeof m.content==='string'&&m.content.includes('You are now acting as a compaction engine'))).map(e=>e.attempt));
  row.summary_calls=receipts.filter(e=>e.dispatched&&summaryAttempts.has(e.attempt)).length;row.summary_tokens=receipts.filter(e=>e.dispatched&&summaryAttempts.has(e.attempt)).reduce((n,e)=>n+(e.usage?.total??0),0);row.finish_reasons=receipts.map(e=>e.finish_reason??e.code);row.accounting_verified=a.cost_complete&&a.unsettled_attempts.length===0&&seal.state.closed;
 }
 row.ledger_reconciled=true;
 }catch(error){row.verification_error=String(error.message);}
 rows.push(row);
}
writeFileSync(join(root,'ACCOUNTING-VERIFICATION.json'),JSON.stringify({rows,all_accounting_verified:rows.every(r=>r.accounting_verified),benchmark_cleared:false,open_questions_ref:'PLAN.md'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows.map(({slot_id,valid_export,known_total_tokens,accounting_verified,verification_error})=>({slot_id,valid_export,known_total_tokens,accounting_verified,verification_error}))));
