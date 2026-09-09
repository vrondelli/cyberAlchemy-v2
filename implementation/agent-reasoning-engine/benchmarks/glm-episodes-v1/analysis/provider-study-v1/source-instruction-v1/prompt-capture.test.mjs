// Negative controls for the receipt join; Open questions: ../research/FACT-PROBE-DESIGN.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {read} from './common.mjs';import {captureAdapter} from './prompt-capture.mjs';
test('actual loopback captures join exactly; tampered receipts and absent measurement fail',()=>{
 const run=read(new URL('capture-evidence/10000-recycled.json',import.meta.url));
 const recorder=captureAdapter({binding:'test-observer',evidence:[],decorate:p=>p,normalize:m=>m});
 for(const c of run.selected)assert.equal(recorder.adapter.decorate(c.prompt),c.prompt);
 const result={receipts:run.receipts,recycling:{dispatches:run.selected.map(c=>({sequence:c.sequence,generation:c.generation,prompt_digest:c.prompt_digest}))}};
 const options={model:run.receipts.find(r=>r.kind==='model').model};assert.equal(recorder.selected(result,options).length,4);
 const altered=structuredClone(result);altered.receipts.find(r=>r.kind==='model').request_sha256='0'.repeat(64);assert.throws(()=>recorder.selected(altered,options),/physical model receipt/);
 const missing=structuredClone(result);missing.receipts=missing.receipts.filter(r=>r.kind!=='tokenizer');assert.throws(()=>recorder.selected(missing,options),/tokenizer receipt/);
 const unobserved=structuredClone(result);unobserved.recycling.dispatches[0].prompt_digest='0'.repeat(64);assert.throws(()=>recorder.selected(unobserved,options),/not observed/);
});
