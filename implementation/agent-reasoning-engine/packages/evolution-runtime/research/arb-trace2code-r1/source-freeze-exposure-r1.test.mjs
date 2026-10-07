// Pure metadata only. No archives, labels or providers read by these tests.
// Open Questions: evidence/G01-SOURCE-FREEZE-EXPOSURE-169.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {freezeCaseIdentity as identity,freezeIdentityProjection as project} from './source-freeze-exposure-r1.mjs';
test('canonical IDs and project/bug coordinates deduplicate arms and string/numeric bug representations',()=>{
 const r=project({cases:[{case_id:'Defects4J-Cli-5-baseline'},{case_id:'Defects4J-Cli-5-index'},{project:'Cli',bug:5},{project:'Cli',bug:'5'}]});
 assert.deepEqual(r.case_ids,['Defects4J-Cli-5']);assert.equal(r.identity_rows,4);assert.deepEqual(r.unresolved,[]);
});
test('conflicting identities and invalid Defects4J IDs are unresolved, never silently admitted',()=>{
 for(const row of [{case_id:'Defects4J-Cli-5',project:'Cli',bug:6},{case_id:'Defects4J-Cli-0'},{case_id:'Defects4J-NewProject-1'},{project:'Cli',bug:'05'},{project:'Cli',bug:1.5}])assert.equal(identity(row).posture,'unresolved');
 assert.equal(identity({case_id:'OtherDataset-task1'}).posture,'other-namespace');
});
test('non-identity fields are never accessed or interpreted as IDs',()=>{
 const manifest={cases:[{case_id:'Defects4J-Cli-5'}]};
 for(const key of ['gold','predictions','query','source','public_response','credentials','environment'])Object.defineProperty(manifest,key,{get(){throw Error('forbidden non-identity access');}});
 const row=manifest.cases[0];Object.defineProperty(row,'answer',{get(){throw Error('forbidden answer access');}});
 assert.deepEqual(project(manifest).case_ids,['Defects4J-Cli-5']);
});
test('supported metadata arrays are unioned and missing schemas are explicit',()=>{
 const r=project({cases:['Defects4J-Cli-5'],captures:[{case_id:'Defects4J-Csv-5'}],completed_public_cells:[{case_id:'Defects4J-Cli-5'}]});
 assert.deepEqual(r.case_ids,['Defects4J-Cli-5','Defects4J-Csv-5']);assert.equal(r.supported_identity_array_present,true);
 assert.equal(project({ordered_ordinals:[1,2]}).supported_identity_array_present,false);
 assert.equal(project({cases:{}}).unresolved.length,1);assert.throws(()=>project(null));
});
test('single-case root freezes are retained even with no case-named directory',()=>{
 const r=project({case_id:'Defects4J-JxPath-8',source_sha256:'metadata-only'});
 assert.deepEqual(r.case_ids,['Defects4J-JxPath-8']);assert.equal(r.identity_rows,1);assert.equal(r.supported_identity_array_present,true);
 assert.equal(project({case_id:'Defects4J-JxPath-8',project:'JxPath',bug:9}).unresolved.length,1);
});
