// Synthetic protocol fixtures only. Open questions: MINIMAL-HISTORY.md.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectMinimalHistory} from './minimal-history.mjs';
const exchange=(id,content='source',ids=[id])=>[
 {role:'assistant',content:null,reasoning_content:'Unmodified reasoning '+id,tool_calls:ids.map(id=>({id,type:'function',function:{name:'read_file',arguments:'{"path":"a.js"}'}}))},
 ...ids.map(id=>({role:'tool',tool_call_id:id,content}))
];
test('retains two newest complete exchanges with exact reasoning/results and no input mutation',()=>{
 const history=[...exchange('a'),{role:'assistant',content:'Old thought'},...exchange('b'),...exchange('c')],before=structuredClone(history);
 const r=projectMinimalHistory({history});assert.deepEqual(history,before);assert.deepEqual(r.history,history.slice(3));assert.equal(r.projection.complete_exchanges_before,3);assert.equal(r.projection.complete_exchanges_after,2);assert.equal(r.projection.archive_reference_count,0);assert.equal(r.projection.performance_claim,null);
 r.history[0].reasoning_content='changed';assert.deepEqual(history,before);
});
test('rejects incomplete, orphaned, duplicated and malformed tool exchanges before pruning',()=>{
 for(const history of [[exchange('a')[0]],[exchange('a')[1]],[...exchange('a'),...exchange('a')],[...exchange('a'),{role:'user',content:'injected memory'}],[{role:'assistant',tool_calls:{}}],[{role:'assistant',tool_calls:[{id:'a',type:'function',function:{name:'read_file',arguments:{}}}]}]])assert.throws(()=>projectMinimalHistory({history}));
 const incomplete=[exchange('old')[0],...exchange('new1'),...exchange('new2')];assert.throws(()=>projectMinimalHistory({history:incomplete}),/incomplete-exchange/);
});
test('preserves oversized and multi-tool exchanges intact; no token admission claimed',()=>{
 const large='x'.repeat(40000),history=[...exchange('a'),...exchange('b',large,['b','c'])];
 const r=projectMinimalHistory({history});assert.deepEqual(r.history,history);assert.match(r.projection.admission,/not performed/);assert.equal(r.projection.removed_bytes,0);
 const reordered=[history[2],history[4],history[3]];assert.deepEqual(projectMinimalHistory({history:reordered}).history,reordered);
});
test('empty history and terminal assistant messages remain deterministic',()=>{
 assert.deepEqual(projectMinimalHistory({history:[]}).history,[]);
 const history=[...exchange('a'),{role:'assistant',content:'Finished'}];const a=projectMinimalHistory({history}),b=projectMinimalHistory({history});assert.deepEqual(a,b);assert.deepEqual(a.history,history);assert.match(a.projection.input_sha256,/^[a-f0-9]{64}$/);
});
