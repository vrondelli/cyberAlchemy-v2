import {prepareReferenceFinalization,prepareReferenceCorrection} from './finding-finalization-admission-r2.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {bindInvestigationEvidence} from './compact-repair-evidence-join.mjs';
import {createFindingCatalog,diagnoseFindingReferences,findingCatalogView,findingFeedback,assessReferenceExploration} from './finding-reference-r1.mjs';
// Exact real failed-branch receipts; these tests make no model calls.
const stage=new URL('./independent-candidate-production-live-r1/',import.meta.url);
const result=JSON.parse(readFileSync(new URL('runs_root/00/result.json',stage)));
const events=readFileSync(new URL('runs_root/00/events.jsonl',stage),'utf8').trim().split('\n').map(JSON.parse);
const start=result.phase_state.phase_receipt_start;
const inputs={branches:[{branch_id:'q3',receipt_indices:Array.from({length:result.receipts.length-start},(_,i)=>start+i),captures:events.filter(e=>e.kind==='request-capture'&&e.phase==='investigate-3').map(e=>e.capture)}],receipts:result.receipts};
const joined=bindInvestigationEvidence(inputs),catalog=createFindingCatalog({joined,inputs,branch_id:'q3'});
const diagnose=value=>diagnoseFindingReferences({raw:JSON.stringify(value),catalog,joined,inputs});

const admitMessages=async(messages,tools)=>stable({messages,tools});
const measured=async p=>{const w=JSON.parse(p),n=JSON.parse(w.messages[1].content).catalog.entries.length;return 3500+n*30+(w.messages.length===3?100:0);};
test('catalog selection reserves measured feedback headroom rather than filling the initial envelope',async()=>{
 const a=await prepareReferenceFinalization({joined,inputs,branch_id:'q3',objective:'Task',question:{id:'q3'},admitMessages,measurePrompt:measured});
 assert.equal(a.catalog.limit,12);assert.ok(a.measurements.at(-1).reserved_envelope<=3990);assert.ok(a.measurements.some(x=>x.envelope<=4000&&x.reserved_envelope>3990));
});
test('correction projection shrinks errors to fit while preserving catalog and full diagnostic',async()=>{
 const a=await prepareReferenceFinalization({joined,inputs,branch_id:'q3',objective:'Task',question:{id:'q3'},admitMessages,measurePrompt:measured});
 const before=stable(a.messages),diagnostic={ok:false,issues:Array.from({length:32},()=>({path:'/claims/0/read_refs/0',keyword:'enum',message:'unknown reference'}))};
 const correction=await prepareReferenceCorrection({messages:a.messages,tool:a.tool,diagnostic,admitMessages,measurePrompt:async p=>{const w=JSON.parse(p);return 3960+JSON.parse(w.messages[2].content).issues.length*100;}});
 assert.equal(correction.feedback.issues.length,0);assert.equal(correction.feedback.omitted_issue_count,32);assert.equal(diagnostic.issues.length,32);assert.equal(stable(a.messages),before);assert.deepEqual(correction.messages.slice(0,2),a.messages);
});
test('no silent dispatch if even minimal correction cannot fit',async()=>{
 await assert.rejects(prepareReferenceCorrection({messages:[],tool:{},diagnostic:{ok:false,issues:[]},admitMessages,measurePrompt:async()=>4001}),/correction-envelope/);
});
