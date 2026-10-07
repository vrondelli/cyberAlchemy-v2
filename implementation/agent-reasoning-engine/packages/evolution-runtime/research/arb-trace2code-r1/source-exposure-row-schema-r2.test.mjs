// Closed metadata projection tests. No labels/provider/source payload access.
// Open Questions: evidence/G01-SOURCE-EXPOSURE-ROW-SCHEMA-183.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {supplementalRowIdentity as project} from './source-exposure-row-schema-r2.mjs';
test('arm-suffixed explicit cells normalize as conservative prepared exclusions',()=>{
 for(const arm of ['baseline','index'])assert.deepEqual(project({cell:'Defects4J-Cli-5-'+arm,result_sha256:'opaque'}),{posture:'recognized-prepared-exclusion',case_id:'Defects4J-Cli-5'});
});
test('known dataset IDs are retained, never declared disjoint or fresh',()=>{
 for(const ns of ['SWE-Bench-Pro','SWE-Bench-Verified','Multi-SWE-Bench']){const r=project({instance_id:ns+'__python__maintenance__bugfix__e579f2f0'});assert.equal(r.posture,'other-dataset-prepared-exclusion');assert.equal(r.cross_dataset_alias_reconciled,false);assert.equal(r.case_id,undefined);}
});
test('unknown, malformed and path-like identifiers fail closed',()=>{
 for(const row of [null,[],{cell:'Defects4J-Unknown-5-index'},{cell:'Defects4J-Cli-5-index/escape'},{cell:'Defects4J-Cli-5'},{instance_id:'Defects4J-Cli-5'},{instance_id:42},{instance_id:'SWE-Bench-Pro__java__maintenance__bugfix__e579f2f0'}])assert.equal(project(row).posture,'unresolved');
});
test('direct identity retains old contract and every explicit conflict remains unresolved',()=>{
 assert.equal(project({case_id:'Defects4J-Cli-5',cell:'Defects4J-Cli-5-index'}).case_id,'Defects4J-Cli-5');
 for(const row of [{case_id:'Defects4J-Cli-5',cell:'Defects4J-Cli-6-index'},{project:'Cli',bug:5,case_id:'Defects4J-Cli-6'},{case_id:42,cell:'Defects4J-Cli-5-index'},{case_id:'Defects4J-Cli-5',instance_id:'SWE-Bench-Pro__python__maintenance__bugfix__e579f2f0'}])assert.equal(project(row).posture,'unresolved');
});
test('query, source, reasoning, output and nested transport fields are never accessed',()=>{
 const row={instance_id:'SWE-Bench-Pro__python__maintenance__bugfix__e579f2f0',cell:new Proxy({},{get(){throw Error('nested transport access');}})};
 for(const k of ['query','source','reasoning','reasoning_content','output','gold','credentials','environment'])Object.defineProperty(row,k,{get(){throw Error('forbidden payload access');}});
 assert.equal(project(row).posture,'other-dataset-prepared-exclusion');
});
test('valid direct coordinates work, empty transport containers do not fabricate identity',()=>{
 assert.equal(project({project:'Cli',bug:5}).case_id,'Defects4J-Cli-5');
 assert.equal(project({cell:{case_id:'Defects4J-Cli-5'}}).posture,'unresolved');
});
