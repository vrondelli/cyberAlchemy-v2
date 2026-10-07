// Synthetic evidence policy tests. Open Questions: G01-ADAPTIVE-COMMON-TOOLS-R1.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {createAdaptiveRuntimeViews} from './adaptive-runtime-view-policy-r1.mjs';
const method={class_name:'p/A',class_sha256:'sha',class_id:'crc',path:'src/p/A.java',name:'f',descriptor:'()V',
 access_flags:1,status:'unique-coordinate-association',source_method_id:'m',reported:true,reported_positive:true,
 reported_counters:{INSTRUCTION:{covered:1,missed:0}}};
function fixture({methods=[method,{...method,name:'g',source_method_id:null,status:'ambiguous-or-unmatched'},
 {...method,name:'h',reported_positive:false}],available=true,validateBasis=()=>{}}={}){
 return createAdaptiveRuntimeViews({caseIds:['c'],sourceView:r=>({delegated:r}),validateBasis,
  loadRuntime:()=>({runtime_available:available,methods,compiled_methods:methods.length,
   reported_positive_methods:methods.filter(m=>m.reported_positive).length,
   associated_reported_positive_methods:methods.filter(m=>m.reported_positive&&m.source_method_id).length,
   counts:{},unavailable_reason:'qualified runtime missing'})});
}
test('closed runtime JSON and bounded filter/pagination types',()=>{
 const run=fixture();for(const extra of [{root:'/'},{limit:51},{offset:-1},{positive_only:'yes'},
  {class_name:'x\n'},{source_method_id:''}])assert.throws(()=>run({operation:'list_runtime_methods',case_id:'c',...extra}));
 assert.throws(()=>run({operation:'runtime_status',case_id:'c',offset:0}));
});
test('positive filter retains unresolved positive observations; default retains all',()=>{
 const run=fixture(),base={operation:'list_runtime_methods',case_id:'c'};
 assert.equal(run(base).total,3);const positive=run({...base,positive_only:true});
 assert.equal(positive.total,2);assert.equal(positive.items[1].source_method_id,null);
 assert.equal(positive.items[1].negative_relevance_inference,false);
});
test('pagination exact, no source or execution claims added',()=>{
 const run=fixture(),r=run({operation:'list_runtime_methods',case_id:'c',limit:1});
 assert.equal(r.next_offset,1);assert.equal(r.items[0].type_attributed_signature,false);
 assert.equal(r.items[0].test_exclusive,false);assert.equal(r.tokenizer_admitted,false);
 assert.equal(run({operation:'list_runtime_methods',case_id:'c',offset:1,limit:2}).next_offset,null);
});
test('missing runtime remains eligible; source delegation unaffected',()=>{
 const run=fixture({available:false});assert.equal(run({operation:'runtime_status',case_id:'c'}).source_case_retained,true);
 assert.deepEqual(run({operation:'get_method',case_id:'c',method_id:'m'}).delegated.operation,'get_method');
 assert.equal(run({operation:'runtime_status',case_id:'unknown'}).status,'unknown-case');
});
test('source-method filter is identity only, no fuzzy guess',()=>{
 const run=fixture();assert.equal(run({operation:'list_runtime_methods',case_id:'c',source_method_id:'m'}).total,2);
 assert.equal(run({operation:'list_runtime_methods',case_id:'c',source_method_id:'other'}).total,0);
});
test('basis drift fails closed before reading case',()=>{
 assert.throws(()=>fixture({validateBasis:()=>{throw Error('drift');}})({operation:'runtime_status',case_id:'c'}),/drift/);
});
test('oversized metadata outcome does not skip item',()=>{
 const run=fixture({methods:[{...method,descriptor:'x'.repeat(40000)}]});
 const r=run({operation:'list_runtime_methods',case_id:'c'});
 assert.equal(r.status,'metadata-capacity-exceeded');assert.equal(r.next_offset,0);
 assert.ok(Buffer.byteLength(JSON.stringify(r))<=32768);
});
