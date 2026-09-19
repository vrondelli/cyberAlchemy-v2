// Open questions: RANKED-READ-PROJECTION-R1.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {fixture} from './ranked-read-test-fixture-r1.mjs';
import {createRankedReadEvidenceRecord} from './ranked-read-evidence-r1.mjs';
import {bindInvestigationEvidence,verifyInvestigationJoin} from './ranked-read-evidence-join-r1.mjs';
import {createBoundedExchangeArchive} from './ranked-read-views-r1.mjs';
import {buildCoverageLedger} from './ranked-read-ledger-r1.mjs';
test('persisted ranked evidence joins in global receipt coordinates',async()=>{
 const f=await fixture(),e=f.ranked_evidence.get(f.call.id),record=createRankedReadEvidenceRecord(e);
 const inputs={branches:[{branch_id:'q1',captures:f.captures,receipt_indices:[1],ranked_evidence_records:[JSON.parse(JSON.stringify(record))]}],receipts:[{kind:'tokenizer'},...f.receipts],ranked_context:e};
 const joined=bindInvestigationEvidence(inputs);assert.equal(joined.read_observations.length,1);assert.equal(joined.read_observations[0].first_confirmed_receipt,1);assert.deepEqual(joined.unassigned_receipt_indices,[0]);assert.equal(joined.branch_bindings[0].receipt_confirmed_ranked_read_ids.length,1);assert.equal(verifyInvestigationJoin(joined,inputs),true);
 inputs.branches[0].ranked_evidence_records[0].source_refs=[];assert.equal(verifyInvestigationJoin(joined,inputs),false);
});
test('coverage ledger credits confirmed ranked lines from pinned snapshot',async()=>{
 const f=await fixture(),e=f.ranked_evidence.get(f.call.id);
 const ledger=buildCoverageLedger({...f,snapshots:[{path:'source.txt',utf8:e.sources.get('source.txt'),source_sha256:e.expected.files.get('source.txt')}]});
 assert.equal(ledger.entries.length,1);assert.equal(ledger.entries[0].path,'source.txt');assert.deepEqual(ledger.entries[0].seen_ranges,[[1,2]]);assert.deepEqual(ledger.entries[0].unseen_ranges,[]);assert.equal(ledger.entries[0].observation_ids.length,1);
});
test('archive replay preserves ranked view and links original result',async()=>{
 const f=await fixture(),events=[];
 const archive=createBoundedExchangeArchive({persist:async e=>events.push(e),measure:async()=>7000,ranked_evidence:f.ranked_evidence});
 const input={messages:[{role:'system',content:'Acquire source.'}],tools:[],assistant:f.wire.messages[0],results:[f.result]};
 const a=await archive.admit(input),b=await archive.admit(input);assert.equal(a.status,'admitted');assert.equal(b.replayed,true);assert.deepEqual(a.view,b.view);
 const link=events.find(e=>e.kind==='frontier-output-archive-link');assert.deepEqual(archive.outputByDigest(link.output_sha256).result,f.result);assert.equal(events.filter(e=>e.kind==='frontier-raw-exchange').length,1);
});
