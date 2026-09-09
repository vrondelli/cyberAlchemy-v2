import test from 'node:test';import assert from 'node:assert/strict';
import {attributeSource,assess} from './evaluate.mjs';import {sha} from './common.mjs';
test('schema-invalid no-op is measurable, but wrong scope and incomplete evidence are unknown',()=>{
 const original='export const x=1;',base={tree_sha256:'a'.repeat(64),files:{'subject.mjs':sha(original)}};
 const candidate={expected_base_tree_sha256:base.tree_sha256,changes:[{path:'subject.mjs',operation:'replace-file',expected_file_sha256:sha(original),utf8:original}]};
 const evidence=value=>{const text=JSON.stringify(value);return {text,text_sha256:sha(text),truncated:false};};
 const r=attributeSource(evidence(candidate),base,original);assert.equal(r.attributable,true);assert.equal(r.schema_ok,false);assert.equal(r.unchanged_source,true);
 candidate.changes[0].expected_file_sha256='b'.repeat(64);assert.equal(attributeSource(evidence(candidate),base,original).unchanged_source,null);
 assert.equal(attributeSource({...evidence(candidate),truncated:true},base,original).attributable,false);
});
test('no exposure, missing attribution and semantic regressions cannot support the mechanism',()=>{
 const rows=Array.from({length:8},(_,i)=>({arm:i%2?'scope-clarified':'byte-baseline',block:Math.floor(i/2),soft_limit:10000,attributable:true,unchanged_source:false,raw_source_semantics:true,schema_ok:true,qualified:true,failed_receipts:0,safety_passed:true}));
 assert.equal(assess(rows).kind,'inconclusive');rows[0].unchanged_source=true;assert.equal(assess(rows).kind,'supporting');
 rows[1].raw_source_semantics=false;assert.equal(assess(rows).kind,'counterevidence');rows[1].raw_source_semantics=true;rows[1].attributable=false;assert.equal(assess(rows).kind,'inconclusive');
 assert.equal(assess(rows.slice(0,6)).kind,'inconclusive');
});
