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
test('real confirmed references restore exact native provenance without model hash copying',()=>{
 const d=diagnose({branch_id:'q3',claims:[{text:'Provisional claim',read_refs:[catalog.entries[0].ref]}]});
 assert.equal(d.ok,true);assert.deepEqual(d.finding.claims[0].read_ids,[catalog.entries[0].read_id]);
 assert.equal(catalog.entries.length,61);assert.ok(findingCatalogView(catalog).entries.every(e=>!('read_id' in e)));
});
test('all schema fields report errors together without coercion, stripping or promotion',()=>{
 const d=diagnose({branch_id:'q1',extra:true,claims:[{text:' ',extra:true,read_refs:['q3:r999','q3:r999']},{text:7,read_refs:[]},{read_refs:[catalog.entries[0].ref]}]});
 assert.equal(d.ok,false);for(const keyword of ['const','additionalProperties','pattern','enum','uniqueItems','type','minItems','required'])assert.ok(d.issues.some(e=>e.keyword===keyword),keyword);
 assert.equal('finding' in d,false);assert.ok(findingFeedback(d).issues.length>1);
});
test('reject fabricated original failure label and another branch reference',()=>{
 for(const ref of ['list_files:html-tag-hydration-samples','q1:r1',catalog.entries[0].read_id])assert.equal(diagnose({branch_id:'q3',claims:[{text:'claim',read_refs:[ref]}]}).ok,false);
});
test('catalog tampering and mismatched receipt inputs fail before claim validation',()=>{
 const bad=structuredClone(catalog);bad.entries[0].read_id='a'.repeat(64);
 assert.throws(()=>diagnoseFindingReferences({raw:'{}',catalog:bad,joined,inputs}),/catalog-integrity/);
 assert.throws(()=>createFindingCatalog({joined,inputs:{...inputs,receipts:[]},branch_id:'q3'}),/join-integrity/);
});
test('bounded catalog discloses omitted reads and empty catalog only permits empty claims',()=>{
 const small=createFindingCatalog({joined,inputs,branch_id:'q3',limit:2});assert.equal(small.omitted_reads,59);
 const empty=createFindingCatalog({joined,inputs,branch_id:'q3',limit:0});
 assert.equal(diagnoseFindingReferences({raw:'{"branch_id":"q3","claims":[]}',catalog:empty,joined,inputs}).ok,true);
 assert.equal(diagnoseFindingReferences({raw:'{"branch_id":"q3","claims":[{"text":"x","read_refs":["q3:r1"]}]}',catalog:empty,joined,inputs}).ok,false);
});
test('raw size, JSON syntax, expanded native size and feedback size stay bounded',()=>{
 assert.equal(diagnoseFindingReferences({raw:'x'.repeat(8193),catalog,joined,inputs}).issues[0].keyword,'maxBytes');
 assert.equal(diagnoseFindingReferences({raw:'{',catalog,joined,inputs}).issues[0].keyword,'parse');
 const large=diagnose({branch_id:'q3',claims:Array.from({length:8},()=>({text:'x'.repeat(200),read_refs:catalog.entries.slice(0,16).map(e=>e.ref)}))});
 assert.equal(large.ok,false);assert.equal(large.issues[0].keyword,'expandedSize');
 const fb=findingFeedback({ok:false,issues:Array.from({length:100},()=>({path:'',keyword:'enum'}))});assert.equal(fb.issues.length,32);assert.equal(fb.omitted_issue_count,68);
});
test('exploration reserves two calls and 8K in the unchanged investigation budget',()=>{
 const receipt=t=>({kind:'model',dispatched:true,status:200,input_tokens:t,output_tokens:0});
 assert.equal(assessReferenceExploration({receipts:[receipt(12000)],envelope_tokens:4000}).explore,true);
 assert.equal(assessReferenceExploration({receipts:[receipt(12001)],envelope_tokens:4000}).explore,false);
 assert.equal(assessReferenceExploration({receipts:Array.from({length:22},()=>receipt(1)),envelope_tokens:100}).explore,false);
 assert.throws(()=>assessReferenceExploration({receipts:[{...receipt(1),status:500}],envelope_tokens:100}),/unknown-usage/);
});
