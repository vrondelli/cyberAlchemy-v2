import test from 'node:test';
import assert from 'node:assert/strict';
import {rankProjectedEvidence,DIVERSITY,LEGACY} from './ranking.mjs';
function fixture(items){return {problem_statement:'alpha beta gamma',eligible:items.map((r,i)=>({read_id:String(i),path:r.path??'same.js',source_sha256:r.version??'source',base_source_sha256:'base',base_spans:[{start_line:r.start??1,end_line:r.end??10}],preferred:r.preferred??false,recency:i})),reads:items.map((r,i)=>({id:String(i),path:r.path??'same.js',source_sha256:r.version??'source',body:r.body??''}))};}
const ids=r=>r.eligible.map(x=>x.read_id);
test('new task terms precede repeated lexical coverage, without gold inputs',()=>{
 const f=fixture([{body:'alpha beta',end:30},{body:'alpha beta',end:20},{body:'gamma',start:31,end:35}]);
 assert.deepEqual(ids(rankProjectedEvidence(f)),['0','2','1']);
});
test('novel source displaces a contained read after query features are covered',()=>{
 const f=fixture([{body:'alpha beta gamma',end:30},{body:'alpha beta gamma',start:3,end:10},{body:'alpha beta gamma',start:31,end:35}]);
 assert.deepEqual(ids(rankProjectedEvidence(f)),['0','2','1']);
});
test('preferred evidence keeps the explicit predecessor priority',()=>{
 const f=fixture([{body:'alpha beta gamma'},{body:'',preferred:true}]);assert.equal(ids(rankProjectedEvidence(f))[0],'1');
});
test('ordering is independent of input order and does not mutate provenance rows',()=>{
 const f=fixture([{body:'alpha',path:'a.js'},{body:'beta',path:'b.js'},{body:'gamma',path:'c.js'}]),before=structuredClone(f),a=rankProjectedEvidence(f),b=rankProjectedEvidence({...f,eligible:[...f.eligible].reverse(),reads:[...f.reads].reverse()});
 assert.deepEqual(a,b);assert.deepEqual(f,before);assert.deepEqual(new Set(ids(a)),new Set(f.eligible.map(r=>r.read_id)));
});
test('legacy policy preserves exact predecessor ordering',()=>{
 const f=fixture([{body:'alpha'},{body:'alpha beta gamma'}]);assert.deepEqual(rankProjectedEvidence({...f,policy:LEGACY}).eligible,f.eligible);
});
test('base coverage is isolated by source path and base identity',()=>{
 const f=fixture([{body:'alpha beta gamma',path:'a.js',end:30},{body:'alpha beta gamma',path:'b.js',end:20},{body:'alpha beta gamma',path:'a.js',end:10}]);assert.deepEqual(ids(rankProjectedEvidence(f)),['0','1','2']);
});
test('unknown policies, duplicate identities and missing read bindings fail closed',()=>{
 const f=fixture([{body:'alpha'}]);assert.throws(()=>rankProjectedEvidence({...f,policy:'oracle'}));assert.throws(()=>rankProjectedEvidence({...f,reads:[]}));assert.throws(()=>rankProjectedEvidence({...f,eligible:[...f.eligible,...f.eligible]}));
});
test('empty query and empty archive are defined without fabricating candidates',()=>{
 assert.deepEqual(ids(rankProjectedEvidence({eligible:[],reads:[],problem_statement:'',policy:DIVERSITY})),[]);
 const f=fixture([{body:'alpha'},{body:'beta'}]);assert.equal(rankProjectedEvidence({...f,problem_statement:''}).audit.covered_query_terms,0);
});
