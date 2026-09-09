// Evidence verifier adversarial checks. Open questions: H18.md.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {inspect} from './review.mjs';
const read=name=>JSON.parse(readFileSync(new URL(`evidence-v2/${name}.json`,import.meta.url)));
test('accepts retained control and both delayed conditions',()=>{for(const name of ['8000-BLUE_NEW-false-0','10000-GREEN_NEW-false-3','12000-AMBER_OLD-true-3'])assert.doesNotThrow(()=>inspect(read(name)));});
test('rejects forged body, omitted tokenizer, invented visibility and gate success',()=>{
 for(const mutate of [r=>{r.captures[0].raw+=' ';},r=>{r.receipts.splice(r.receipts.findIndex(x=>x.kind==='tokenizer'),1);},r=>{r.metrics.final_revision_visible=true;},r=>{r.agent_result.completion_gate.passed=false;},r=>{r.selected[0].generation+=1;}]){const r=read('8000-BLUE_NEW-false-3');mutate(r);assert.throws(()=>inspect(r));}
});
