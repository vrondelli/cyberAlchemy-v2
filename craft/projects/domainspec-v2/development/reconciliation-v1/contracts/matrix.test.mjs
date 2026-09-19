import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildMatrix,validateMatrix,resolveCombination,axes} from './matrix.mjs';
const matrix=buildMatrix();
const reject=mutate=>{const changed=structuredClone(matrix);mutate(changed);assert.equal(validateMatrix(changed,{checkDisk:false}).status,'fail');};
test('source-bound matrix validates and regenerates deterministically',()=>{
  assert.deepEqual(buildMatrix(),matrix);assert.equal(validateMatrix(matrix).status,'pass');
});
test('13 kinds, 39 realizations, 31 signatures, 24 commands are explicit',()=>{
  assert.equal(matrix.types.length,13);assert.equal(matrix.realizations.length,39);assert.equal(matrix.relationships.length,31);assert.equal(matrix.commands.length,24);
  assert.equal(matrix.relationships.filter(r=>r.release_scope==='UI-excluded-from-v1').length,14);
});
test('lost kinds, cells, relationships or commands fail',()=>{
  for(const key of ['types','realizations','relationships','commands','cells'])reject(m=>m[key].pop());
});
test('no fresh product-test, current acceptance or publication claims',()=>{
  for(const axis of ['tested','accepted','published'])reject(m=>m.types[0].states[axis]='pass');
  reject(m=>delete m.types[0].states.packaged);
});
test('source evidence refs and hashes cannot be omitted or replaced',()=>{
  reject(m=>m.types[0].evidence_refs=['missing']);
  reject(m=>m.evidence[0].sha256='bad');
  const changed=structuredClone(matrix);changed.evidence[0].sha256='0'.repeat(64);assert.equal(validateMatrix(changed).status,'fail');
});
test('exact UInt64 never becomes a Python/Rust profile',()=>{
  reject(m=>m.profiles.find(p=>p.id==='domainspec.typescript-exact-uint64/v1').languages.push('rust'));
  assert.equal(resolveCombination(matrix,{type:'Calculation',language:'rust',profile:'domainspec.typescript-exact-uint64/v1',command:'build'}).status,'not-applicable');
});
test('composition is not checked-interchange certification',()=>{
  assert.equal(resolveCombination(matrix,{type:'Mapping',language:'typescript',profile:'domainspec.project-composition/v1',command:'certify'}).status,'not-applicable');
});
test('application commands remain separate from advertised stable commands',()=>{
  assert.deepEqual(matrix.commands.filter(r=>r.classification==='dispatcher-only-candidate').map(r=>r.id),['application-build','application-check']);
});
test('every selected Cartesian query resolves explicitly without a semantic PASS',()=>{
  let count=0,applicable=0;
  for(const type of matrix.dimensions.types)for(const language of [...matrix.dimensions.languages,'host-node','language-independent'])for(const profile of matrix.dimensions.profiles)for(const command of matrix.dimensions.commands){
    const r=resolveCombination(matrix,{type,language,profile,command});count++;
    assert.ok(['source-applicability-only','not-applicable'].includes(r.status));
    if(r.states){applicable++;assert.deepEqual(Object.keys(r.states),axes);assert.equal(r.states.tested,'not-run-current');assert.equal(r.states.accepted,'not-established-for-current-tree');}
    else assert.ok(r.reason.length);
  }
  assert.equal(count,13*5*matrix.profiles.length*24);assert.ok(applicable>0);
});
test('one matching archive source never accepts the current tree',()=>{
  reject(m=>m.package_states.current_tree.accepted='accepted');
  reject(m=>m.package_states.current_tree.version_is_acceptance=true);
});
test('candidate closure definition cannot self-promote',()=>reject(m=>m.closure_definition_selected=true));
