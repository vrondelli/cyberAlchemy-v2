import test from 'node:test';import assert from 'node:assert/strict';import {classify} from './evaluate.mjs';
// Open questions: README.md#open-questions.
const pair=()=>[{arm:'baseline',status:'BLOCK',reason_codes:['recycling.fresh-context-too-large'],semantics:null,recycles:1,max_projected_tokens:5000,receipts:[{status:200}]},{arm:'pressure',semantics:true,recycles:1,archive_recovery_confirmed:true,max_projected_tokens:9000,receipts:[{status:200}]}];
test('repair success alone cannot satisfy pressure prediction',()=>{assert.equal(classify(pair()),'supporting');for(const delta of [{recycles:0},{archive_recovery_confirmed:false},{semantics:false},{max_projected_tokens:17000},{max_projected_tokens:null}]){const rows=pair();Object.assign(rows[1],delta);assert.equal(classify(rows),'counterevidence');}});
test('missing trials and transport failures remain inconclusive',()=>{assert.equal(classify(pair().slice(0,1)),'inconclusive');const rows=pair();rows[1].receipts.push({status:503});assert.equal(classify(rows),'inconclusive');});

test('zero-dispatch harness failures are not counterevidence about the model',()=>{const rows=pair();rows[1].models=0;assert.equal(classify(rows),'inconclusive');});
