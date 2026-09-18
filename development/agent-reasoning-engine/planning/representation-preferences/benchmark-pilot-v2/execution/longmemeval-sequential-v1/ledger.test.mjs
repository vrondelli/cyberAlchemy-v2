import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareHistory,verifyPreparedHistory} from './ledger.mjs';
const rows=JSON.parse(readFileSync(new URL('../longmemeval/inputs.json',import.meta.url)));
test('all selected sources replay exactly through real ARE ledger with stable IDs and dates',()=>{
 for(const row of rows){const p=prepareHistory(row),q=prepareHistory(row);assert.deepEqual(p,q);assert.equal(p.evidence.epoch.schema_version,'are.reasoning-state-epoch/v1');assert.equal(p.evidence.replay_fixture.schema_version,'are.reasoning-replay-fixture/v1');assert.equal(verifyPreparedHistory(p,row).ok,true);assert.deepEqual(p.units.map(x=>({role:x.role,content:x.content})),row.history.flatMap(x=>x.messages));assert.equal(p.evidence.external_calls,0);}
});
test('corrupted replay or omitted source turn fails verification',()=>{
 const row=rows[0],p=prepareHistory(row);
 const a=structuredClone(p);a.evidence.replay_fixture.events[0].content.content='tampered';assert.throws(()=>verifyPreparedHistory(a,row),/replay-integrity/);
 const b=structuredClone(p);b.units.pop();assert.throws(()=>verifyPreparedHistory(b,row),/unit-binding/);
 const c=structuredClone(row);c.history[0].messages[0].content+='changed';assert.throws(()=>verifyPreparedHistory(p,c),/source-coverage/);
});
test('answer markers, task names, query and scorer fields never enter ingestion units',()=>{
 const row=structuredClone(rows[0]);row.task_id='longmemeval:hidden_abs';row.question='QUERY_CANARY';row.history[0].session_id='answer_GOLD_CANARY';
 const p=prepareHistory(row),wire=JSON.stringify(p);assert.ok(!wire.includes('QUERY_CANARY'));assert.ok(!wire.includes('GOLD_CANARY'));assert.ok(!wire.includes('hidden_abs'));
 assert.throws(()=>prepareHistory({...row,answer:'GOLD'}),/unknown-source-field/);
 const tagged=structuredClone(row);tagged.history[0].messages[0].has_answer=true;assert.throws(()=>prepareHistory(tagged),/unknown-source-field/);
});
test('out-of-order, invalid and future dates or unsupported roles fail closed',()=>{
 const row=structuredClone(rows.find(x=>x.history.length>1));row.history.reverse();assert.throws(()=>prepareHistory(row),/chronology-invalid/);
 const future=structuredClone(rows[0]);future.history[0].date='2099/01/01 (Thu) 00:00';assert.throws(()=>prepareHistory(future),/chronology-invalid/);
 const malformed=structuredClone(rows[0]);malformed.history[0].date='2023/02/30 (Thu) 00:00';assert.throws(()=>prepareHistory(malformed),/date-invalid/);
 const system=structuredClone(rows[0]);system.history[0].messages[0].role='system';assert.throws(()=>prepareHistory(system),/turn-invalid/);
});

test('notes are actual unverified ARE claims with source and predecessor provenance',async()=>{
 const {recordNotes}=await import('./ledger.mjs');const prepared=prepareHistory(rows[0]);const before=JSON.stringify(prepared);
 const a=recordNotes({prepared,notes:'Claim from s0-m0; unsupported s99-m99.',step:1});
 assert.equal(a.event.schema_version,'are.reasoning-state-event/v1');assert.equal(a.event.content.posture,'unverified-model-claim');assert.deepEqual(a.used_source_refs,['s0-m0']);assert.deepEqual(a.unknown_refs,['s99-m99']);assert.equal(a.event.content.notes,'Claim from s0-m0; unsupported s99-m99.');
 assert.ok(a.event.provenance_refs.includes('reasoning-event:'+prepared.units[0].event_digest));
 const b=recordNotes({prepared,notes:'Revised claim from s0-m1.',step:2,prior_claims:[a]});assert.equal(b.event.content.previous_claim_digest,a.event.event_digest);assert.deepEqual(b.inherited_source_refs,['s0-m0']);assert.equal(b.replay_fixture.events.length,2);assert.equal(JSON.stringify(prepared),before);
});
test('notes reject corrupt predecessor evidence, foreign source and sequence drift',async()=>{
 const {recordNotes}=await import('./ledger.mjs');const prepared=prepareHistory(rows[0]);const a=recordNotes({prepared,notes:'s0-m0',step:1});
 const corrupt=structuredClone(a);corrupt.event.content.notes='changed';assert.throws(()=>recordNotes({prepared,notes:'next',step:2,prior_claims:[corrupt]}),/prior-claim-integrity/);
 assert.throws(()=>recordNotes({prepared:prepareHistory(rows[1]),notes:'next',step:2,prior_claims:[a]}),/prior-claim-integrity/);
 assert.throws(()=>recordNotes({prepared,notes:'next',step:3,prior_claims:[a]}),/claim-sequence/);
 const source=structuredClone(prepared);source.units[0].content='changed';assert.throws(()=>recordNotes({prepared:source,notes:'next',step:1}),/notes-source-binding/);
});
