// Open questions: RANKED-READ-PROJECTION-R1.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {fixture} from './ranked-read-saved-run-fixture-r1.mjs';
import {reconstructRankedReadPrediction} from './ranked-read-prediction-r1.mjs';
const input=x=>({...JSON.parse(JSON.stringify(x)),arm:'ranked-read-acquisition',result:{...JSON.parse(JSON.stringify(x.result)),instance_id:x.task.instance_id,native_export:JSON.parse(JSON.stringify(x.result.exported))}});
test('saved JSON evidence reconstructs complete native prediction',async()=>{
 await fixture({inspect:x=>{const r=reconstructRankedReadPrediction(input(x));assert.equal(r.reconstructed,true);assert.deepEqual(r.prediction,x.result.exported.prediction);assert.equal(r.benchmark_cleared,false);}});
});
test('missing or changed records, source index, query settlement and snapshots fail',async()=>{
 await fixture({inspect:x=>{
  for(const mutate of [
   a=>{a.events=a.events.filter(e=>e.kind!=='ranked-read-evidence');},
   a=>{a.events=a.events.filter(e=>e.kind!=='source-tool-result');},
   a=>{a.events=a.events.filter(e=>!(e.kind==='response-capture'&&e.phase==='discover'));},
   a=>{a.events=a.events.filter(e=>e.kind!=='source-index-query');},
   a=>{a.source_index.manifest.admitted_bytes++;},
   a=>{a.snapshots[0].utf8='changed';},
   a=>{for(const e of a.events)if(e.kind==='source-index-query')e.python_settlement.forced=true;},
   a=>{a.result.native_export.prediction.traj_data.pred_files=[];}
  ]){const a=input(x);mutate(a);assert.throws(()=>reconstructRankedReadPrediction(a));}
 }});
});
