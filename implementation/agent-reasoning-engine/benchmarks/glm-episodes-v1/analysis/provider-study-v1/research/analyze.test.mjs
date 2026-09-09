// Analysis controls. Open questions: README.md#open-questions.
import test from 'node:test';import assert from 'node:assert/strict';
import {compare,analyze} from './analyze.mjs';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {verifyEvolutionRecord} from '../../../../../packages/evolution-runtime/index.mjs';
test('paired comparison keeps missing arms out, counts failures, and does not turn unknown semantics into success',()=>{
 const rows=[{block:0,arm:'b',initial_pass:true,semantics:true},{block:0,arm:'t',initial_pass:false,semantics:null},{block:1,arm:'t',initial_pass:true,semantics:true},{block:2,arm:'b',initial_pass:false,semantics:false},{block:2,arm:'t',initial_pass:true,semantics:true}];
 assert.deepEqual(compare(rows,'t','b'),{treatment:'t',baseline:'b',wins:1,losses:1,ties:0,net_wins:0,paired_blocks:2,semantic_losses_or_unobserved:1});
});
test('retained first-block evidence contains five passes, no continuity exposure, and valid inconclusive efficacy records',()=>{
 const root=new URL('block-0/',import.meta.url),r=JSON.parse(readFileSync(new URL('report.json',root))),records=JSON.parse(readFileSync(new URL('research.json',root))).records;
 assert.equal(r.completed,5);assert.equal(r.initial_passes,5);assert.equal(r.recycled_trials,0);assert.equal(r.physical_model_calls,20);
 for(const record of records)assert.equal(verifyEvolutionRecord(record,record.schema_version).ok,true);
 const decisions=records.filter(r=>r.schema_version==='are.learning-decision/v1');assert.equal(decisions.filter(r=>r.disposition==='collect-replications').length,2);assert.equal(decisions.filter(r=>r.disposition==='run-experiment').length,1);
 const host=r.rows.find(r=>r.arm==='host-envelope');assert.equal(host.raw_full_schema_valid,false);assert.equal(host.native_contract_valid,true);
});
