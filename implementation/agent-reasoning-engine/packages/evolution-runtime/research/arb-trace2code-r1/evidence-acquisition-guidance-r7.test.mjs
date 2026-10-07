// Pure offline request-policy tests; no labels, providers or hidden reasoning.
// Open Questions: evidence/G01-EVIDENCE-ACQUISITION-GUIDANCE-R7.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ACQUISITION_GUIDANCE_R7 as policy, ACQUISITION_GUIDANCE_SHA256_R7 as hash,
 evidenceGuidedMessagesR7 as apply} from './evidence-acquisition-guidance-r7.mjs';

const messages = () => [
 {role:'system',content:'Existing native system and strict terminal contract.'},
 {role:'user',content:'Exact supplied failure query: expected value differs from observed value.'},
 {role:'assistant',tool_calls:[{id:'a',type:'function',function:{name:'runtime_status',arguments:'{}'}}]},
 {role:'tool',tool_call_id:'a',content:'{"ok":true,"output":{"runtime_available":false}}'}
];
test('baseline is byte-identical and caller-owned messages are untouched', () => {
 const input=messages(),before=JSON.stringify(input),out=apply(input,'baseline');
 assert.equal(JSON.stringify(out),before);assert.equal(JSON.stringify(input),before);
 out[1].content='changed clone';assert.equal(JSON.stringify(input),before);
});
test('treatment changes only the public system instruction, never task or evidence', () => {
 const input=messages(),before=structuredClone(input),out=apply(input,'index');
 assert.equal(out[0].content,before[0].content+'\n'+policy);
 assert.deepEqual(out.slice(1),before.slice(1));assert.deepEqual(input,before);
 assert.equal(hash,createHash('sha256').update(policy).digest('hex'));
});
test('same generic policy applies initially and after recycled history', () => {
 const initial=messages().slice(0,2),later=messages();
 assert.equal(apply(initial,'index')[0].content,apply(later,'index')[0].content);
 assert.equal(policy.includes('Defects4J'),false);assert.equal(policy.includes('.java'),false);
 assert.ok(policy.includes('unchanged terminal schema'));
});
test('invalid inputs and duplicate policy fail closed for both arms', () => {
 for(const arm of ['baseline','index']){
  for(const input of [[],null,[{role:'user',content:'bad'}],
   [{role:'system',content:'s'},{role:'assistant',content:'bad'}]])assert.throws(()=>apply(input,arm),/input/);
  assert.throws(()=>apply(apply(messages(),'index'),arm),/duplicate-policy/);
 }
 assert.throws(()=>apply(messages(),'other'),/input/);
});
