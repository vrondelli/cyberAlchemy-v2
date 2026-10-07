// Open Questions: evidence/G01-RUNTIME-LINKED-READER-R1.json.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {tokenizerAdmission,publicSelection,fullPredictions} from './runtime-linked-reader-policy-r1.mjs';
const good={dispatched:true,status:200,failure_code:null,prompt_tokens:7680,completion_tokens:20,
 public_response:{finish_reason:'stop',message:{role:'assistant',content:'{"candidate_ids":[2,1]}'}}};
test('exact8K boundary and missing/uncertain usage fail closed',()=>{
 assert.equal(tokenizerAdmission(good),true);
 for(const change of [{prompt_tokens:7681},{prompt_tokens:null},{prompt_tokens:true},{dispatched:false},{dispatch_uncertain:true},{status:429},{failure_code:'x'}])
  assert.equal(tokenizerAdmission({...good,...change}),false);
});
test('only bounded public selections; invalid replies remain null',()=>{
 assert.deepEqual(publicSelection(good,2),[2,1]);
 for(const change of [{completion_tokens:513},{completion_tokens:null},{prompt_tokens:7681},{dispatch_uncertain:true},
  {public_response:{...good.public_response,finish_reason:'length'}},
  {public_response:{finish_reason:'stop',message:{role:'assistant',content:'{"candidate_ids":[2,2]}'}}}])
  assert.equal(publicSelection({...good,...change},2),null);
});
test('full denominator preserves invalid and missing replies',()=>{
 const p=[1,2,3].map(ordinal=>({ordinal,case_id:'case',arm:String(ordinal),prompt_sha256:'sha',candidates:[{path:'a'},{path:'b'}]}));
 const r=[{...p[0],valid:true,selected_ids:[2]},{...p[1],valid:false,selected_ids:null}];
 const full=fullPredictions(p,r);assert.equal(full.length,3);assert.deepEqual(full[0].ranked_files,['b']);
 assert.deepEqual(full[1].ranked_files,[]);assert.equal(full[2].missing,true);assert.equal(full[2].valid,false);
 assert.throws(()=>fullPredictions(p,[r[0],r[0]]));
 assert.throws(()=>fullPredictions(p,[{...r[0],case_id:'other'}]));
});
