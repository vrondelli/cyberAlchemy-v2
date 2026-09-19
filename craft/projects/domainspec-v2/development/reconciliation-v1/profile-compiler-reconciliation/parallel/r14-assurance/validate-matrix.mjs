import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const lane = path.dirname(new URL(import.meta.url).pathname);
const matrix = JSON.parse(fs.readFileSync(path.join(lane, 'assurance-matrix.json'), 'utf8'));
const snapshot = JSON.parse(fs.readFileSync(path.join(lane, 'source-inputs.json'), 'utf8'));
const root = snapshot.source_root;
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const json = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const failures = [];
const check = (name, fn) => { try { fn(); } catch(e) { failures.push({check:name,error:e.message}); } };
for (const [p, expected] of Object.entries(snapshot.inputs)) check('source-currentness:'+p, () => {
  const bytes = fs.readFileSync(path.join(root,p));
  assert.equal(hash(bytes),expected.sha256); assert.equal(bytes.length,expected.size_bytes);
});
const authority=json('definitions/relationships/relationships.yml');
const profile=json('definitions/minted-project/supported-profiles.yml').profiles.find(p=>p.id==='complete-backend-criteria');
const admission=json('development/first-production-release/backend-type-test-engine-completeness/validation-inputs/admissions/relationship-profile-17-admission.json');
check('exact-denominator',()=>{
 assert.equal(authority.signatures.length,31); assert.equal(authority.signature_count,31);
 assert.equal(profile.relationship_ids.length,17);
 assert.deepEqual(matrix.backend_rows.map(r=>r.id),profile.relationship_ids);
 assert.deepEqual(admission.admitted_profile.ordered_relationship_ids,profile.relationship_ids);
 assert.deepEqual(matrix.broader_registry_only.map(r=>r.id),authority.signatures.filter(s=>!profile.relationship_ids.includes(s.id)).map(s=>s.id));
 assert.equal(matrix.broader_registry_only.length,14);
 assert.equal(matrix.backend_rows.reduce((n,r)=>n+r.obligations.length,0),44);
 assert.equal(matrix.retained_boundaries.backend_row_exclusions.length,0);
});
check('selected-frozen-bindings',()=>{
 const registry='definitions/relationships/relationships.yml',profiles='definitions/minted-project/supported-profiles.yml';
 assert.equal(snapshot.inputs[registry].sha256,admission.bound_input_digests.relationship_registry.sha256);
 const config=json('development/reconciliation-v1/profile-compiler-reconciliation/configuration.json');
 assert.equal(snapshot.inputs[config.sources.relationships.path].sha256,config.sources.relationships.sha256);
});
check('historical-profile-admission-currentness',()=>{
 assert.equal(snapshot.inputs['definitions/minted-project/supported-profiles.yml'].sha256,admission.sha256);
});
function pointer(selector) {
 const [p,fragment]=selector.split('#');
 let value=json(p);
 for(const part of fragment.slice(1).split('/')) value=value[part.replaceAll('~1','/').replaceAll('~0','~')];
 return value;
}
for (const row of matrix.backend_rows) check('row:'+row.id,()=>{
 const source=pointer(row.authority.path+'#'+row.authority.pointer);
 assert.equal(source.id,row.id);
 assert.deepEqual(row.obligations.map(o=>o.id),source.validation.obligations);
 assert.deepEqual(row.feature_scope,source.feature_scope);
 assert.equal(row.multiplicity,source.multiplicity);
 assert.deepEqual(row.source_types,source.source_types??[source.source_type]);
 assert.deepEqual(row.target_types,source.target_types??[source.target_type]);
 assert.equal(row.endpoint_combinations.length,row.source_types.length*row.target_types.length);
 assert.deepEqual(row.language_scope.required_native,['typescript','python','rust']);
 assert.deepEqual(row.language_scope.executed_native,[]);
 assert.equal(row.existing_exclusions.length,0);
 assert.ok(row.positive.scenario&&row.negative.scenario&&row.observation_owner);
 for(const o of row.obligations) {
  assert.equal(pointer(o.authority_selector),o.id);
  assert.ok(o.positive_scenario&&o.negative_or_contrast_scenario&&o.observation_owner);
  assert.ok(o.coverage_status!=='pass');
 }
});
let referenceCount=0;
for(const [id,ref] of Object.entries(matrix.assertion_catalog)) check('reference:'+id,()=>{
 assert.ok(snapshot.inputs[ref.path]);
 const lines=fs.readFileSync(path.join(root,ref.path),'utf8').split('\n');
 assert.equal(lines[ref.line-1],ref.snippet); referenceCount++;
});
for(const group of [matrix.backend_rows,...matrix.backend_rows.map(r=>r.obligations),matrix.cross_cutting_obligations,matrix.compiling_mutant_specifications])
 for(const entry of group) check('reference-link:'+entry.id,()=>{
  for(const id of entry.assertion_refs??entry.existing_assertion_refs??[])assert.ok(matrix.assertion_catalog[id],id);
 });
check('claim-ceiling',()=>{
 assert.equal(matrix.r14_complete,false);assert.equal(matrix.authority_effect,'none');
 assert.equal(matrix.compiling_mutant_specifications.length,11);
 assert.equal(matrix.cross_cutting_obligations.length,12);
 assert.ok(matrix.open_questions.length);
});
console.log(JSON.stringify({status:failures.length?'fail':'pass',scope:'matrix/source-only; no compiler or native execution',selected_inputs:Object.keys(snapshot.inputs).length,backend_rows:matrix.backend_rows.length,registry_rows:authority.signatures.length,frozen_obligations:44,reference_count:referenceCount,failures},null,2));
process.exitCode=failures.length?1:0;
