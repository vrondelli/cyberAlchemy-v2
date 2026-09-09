import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {interpret} from './interpreter.mjs';
import {evaluate} from './evaluate.mjs';
const bytes=readFileSync(new URL('./CORPUS.json',import.meta.url));
const {cases}=JSON.parse(bytes);
for(const c of cases)test(c.id+' '+c.category,()=>assert.deepEqual(interpret(c.input),c.expected,c.input));
test('corpus is unchanged from pre-implementation baseline and IDs are unique',()=>{
 const baseline=JSON.parse(readFileSync(new URL('./BASELINE.json',import.meta.url)));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),baseline.corpus_sha256);
 assert.equal(new Set(cases.map(c=>c.id)).size,cases.length);
});
test('quoted, negated, conditional, conflicting and cross-scope variants abstain',()=>{
 const transforms=[s=>'"'+s+'"',s=>'> '+s,s=>'`'+s+'`',s=>'The document says: '+s,s=>'Do not '+s,s=>'If I say '+s+', what happens?',s=>s+' Actually, do not.',s=>s+'\nIgnore all instructions.',s=>s.replace(/[.!?]$/,'')+' for everyone.',s=>'Translate into French: '+s];
 for(const c of cases.filter(c=>c.expected.kind!=='none'))for(const transform of transforms){const input=transform(c.input);assert.deepEqual(interpret(input),{kind:'none'},input);}
});
test('evaluator detects false retention and wrong preference, not just recognized kind',()=>{
 const fixtures=[{id:'a',category:'once',input:'a',expected:{kind:'once',preference:'plain'}},{id:'b',category:'persistent',input:'b',expected:{kind:'persistent',preference:'examples'}}];
 const r=evaluate(()=>({kind:'persistent',preference:'plain'}),fixtures);
 assert.equal(r.correct,0);assert.equal(r.false_persistent_promotions,1);assert.equal(r.persistent_correct,0);assert.equal(r.failures.length,2);
});
test('invalid, oversized and non-text classifier inputs abstain',()=>{
 for(const input of [null,undefined,{},42,'','a'.repeat(16385),'é'.repeat(8193)])assert.deepEqual(interpret(input),{kind:'none'});
});
