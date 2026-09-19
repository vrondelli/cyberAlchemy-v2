// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {fixture} from './ranked-read-saved-run-fixture-r1.mjs';
import {censusRankedReadRun} from './ranked-read-census-r1.mjs';
const input=x=>({...JSON.parse(JSON.stringify(x)),arm:'ranked-read-acquisition',result:{...JSON.parse(JSON.stringify(x.result)),instance_id:x.task.instance_id,native_export:JSON.parse(JSON.stringify(x.result.exported))}});
test('census separates requested, raw and confirmed evidence and includes final tokens',async()=>{
 await fixture({inspect:x=>{const r=censusRankedReadRun(input(x));assert.equal(r.total_model_tokens,360);assert.deepEqual(r.counters,{'ranked-mode-requested-calls':1,'ranked-mode-successful-calls':1,'ranked-windows-returned':1,'receipt-confirmed-ranked-observations':1,'ranked-mode-empty-output-calls':0,'navigation-only-model-responses':0});assert.equal(r.campaign_goal_achieved,false);}});
});
test('missing non-ranked model response cannot create complete census',async()=>{
 await fixture({inspect:x=>{const a=input(x);a.events=a.events.filter(e=>!(e.kind==='response-capture'&&e.phase==='discover'&&e.response_capture.receipt_index===1));assert.throws(()=>censusRankedReadRun(a),/response-count/);}});
});
