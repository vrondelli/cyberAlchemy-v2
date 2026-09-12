import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {bodyForReceipt, stable} from './delivery.mjs';
import {buildEvidenceIndex, recoverObservedRead} from './evidence-index.mjs';
const hash = x => createHash('sha256').update(x).digest('hex');
function fixture() {
  const captures = [], receipts = [];
  for (let i = 0; i < 3; i++) {
    const body = `old source ${i}`, path = `${i}.py`, id = `call-${i}`;
    const prompt = stable({messages: [
      {role:'assistant', tool_calls:[{id, type:'function', function:{name:'read_file', arguments:stable({path, start_line:1})}}]},
      {role:'tool', tool_call_id:id, content:stable({ok:true, output:{path,start_line:1,end_line:1,utf8:body,source_sha256:hash(body)}})}
    ], tools:[]});
    const receipt = {kind:'model', model:'glm-5.3-flash', output_cap:2048, reasoning_effort:'low', dispatched:true,status:200,input_tokens:100,output_tokens:10};
    receipt.request_sha256 = hash(stable(bodyForReceipt(prompt,receipt)));
    captures.push({prompt,prompt_sha256:hash(prompt)});receipts.push(receipt);
  }
  return {captures,receipts,max_entries:10,max_tokens:10000,measure_tokens:async text=>text.length};
}
test('index selects recent confirmed ranges and omits source bodies',async()=>{
  const x=fixture();x.max_entries=2;
  const r=await buildEvidenceIndex(x);
  assert.deepEqual(r.entries.map(e=>e.path),['2.py','1.py']);
  assert.equal(r.omitted_ranges,1);assert.equal(r.text.includes('old source'),false);
});
test('complete presentation is measured and oldest entries are evicted',async()=>{
  const x=fixture(),one=await buildEvidenceIndex({...x,max_entries:1});
  const r=await buildEvidenceIndex({...x,max_tokens:one.measured_tokens});
  assert.deepEqual(r.entries,one.entries);assert.equal(r.measured_tokens,r.text.length);
  const empty=await buildEvidenceIndex({...x,max_tokens:1});assert.equal(empty.text,'');assert.equal(empty.measured_tokens,0);
});
test('failed and absent model receipts do not supply index entries',async()=>{
  const x=fixture();x.receipts[2].status=500;
  assert.deepEqual((await buildEvidenceIndex(x)).entries.map(e=>e.path),['1.py','0.py']);
  assert.equal((await buildEvidenceIndex({...x,receipts:[]})).entries.length,0);
});
test('repeated confirmed presentation updates recency without duplicate range',async()=>{
  const x=fixture();x.receipts.push({...x.receipts[0]});
  assert.deepEqual((await buildEvidenceIndex(x)).entries.map(e=>e.path),['0.py','2.py','1.py']);
});
test('recovery is exact historical observed bytes; fabricated handles fail',async()=>{
  const x=fixture(),r=await buildEvidenceIndex(x);
  const old=recoverObservedRead({...x,retrieval_handle:r.entries[0].retrieval_handle});
  assert.equal(old.utf8,'old source 2');assert.equal(old.current_source_verified,false);
  assert.throws(()=>recoverObservedRead({...x,retrieval_handle:'observed-read:invented'}),/unknown-handle/);
});
test('invalid token measurements cannot yield an admitted index',async()=>{
  await assert.rejects(buildEvidenceIndex({...fixture(),measure_tokens:async()=>NaN}),/invalid-token-measurement/);
});
