// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {fixture} from './ranked-read-test-fixture-r1.mjs';
import {createRankedReadEvidenceRecord,restoreRankedReadEvidence,restoreRankedReadEvidenceMap} from './ranked-read-evidence-r1.mjs';
import {bindRankedReadDelivery} from './ranked-read-delivery-r1.mjs';
test('JSON roundtrip restores receipt evidence without copying full source',async()=>{
 const f=await fixture(),e=f.ranked_evidence.get(f.call.id),record=createRankedReadEvidenceRecord(e);
 assert.equal(Object.hasOwn(record,'sources'),false);assert.deepEqual(record.source_refs,[{path:'source.txt',sha256:e.expected.files.get('source.txt')}]);
 const restored=restoreRankedReadEvidenceMap(JSON.parse(JSON.stringify([record])),e);
 assert.deepEqual(bindRankedReadDelivery({...f,ranked_evidence:restored}),bindRankedReadDelivery(f));
});
test('record, manifest, snapshot and duplicate call changes fail closed',async()=>{
 const f=await fixture(),e=f.ranked_evidence.get(f.call.id),r=createRankedReadEvidenceRecord(e);
 const changed=structuredClone(r);changed.result.output.ranked_read.attempted_reads=4;assert.throws(()=>restoreRankedReadEvidence(changed,e),/record-digest/);
 const expected={...e.expected,files:new Map(e.expected.files)};expected.files.set('extra','d'.repeat(64));assert.throws(()=>restoreRankedReadEvidence(r,{...e,expected}),/index-binding/);
 assert.throws(()=>restoreRankedReadEvidence(r,{...e,sources:new Map([['source.txt','bad']])}),/source-binding/);
 assert.throws(()=>restoreRankedReadEvidenceMap([r,r],e),/duplicate-call/);
});
