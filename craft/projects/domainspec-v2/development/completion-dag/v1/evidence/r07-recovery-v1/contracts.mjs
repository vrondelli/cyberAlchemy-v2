import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.argv[2];
const api=await import(pathToFileURL(path.join(root,'projects/domainspec-v2/impl/system-integration/compiler/system-integration-v1.mjs')));
const fixture=JSON.parse(fs.readFileSync(path.join(root,'projects/domainspec-v2/development/completion-dag/v1/evidence/r02-recovery-v1/bindings.json')));
const formed=api.compileBindingManifest(fixture,'python');
assert.equal(formed.runtime_guarantees_observed,false);
assert.equal(formed.authority_effect,'none');
assert.ok(formed.canonical_bindings.persistence_bindings.length>0);
let changed=structuredClone(fixture);changed.dependency_contracts[0].concern='Port';
assert.throws(()=>api.validateBindingSet(changed),e=>e.code==='SIC_UNIVERSAL_PORT_FORBIDDEN');
const rejected=[];
for(const field of ['replay_contract_ref','clock_contract_ref','version_compatibility_ref']){
 changed=structuredClone(fixture);delete changed.durable_workflow_runtime_bindings[0][field];
 assert.throws(()=>api.validateBindingSet(changed),e=>{rejected.push({field,code:e.code});return typeof e.code==='string';});
}
console.log(JSON.stringify({result:'PASS',formation_only:true,runtime_guarantees_observed:false,universal_port_rejected:true,missing_bindings:rejected,node:process.version,source_digest:formed.source_digest,binding_digest:formed.binding_digest}));
