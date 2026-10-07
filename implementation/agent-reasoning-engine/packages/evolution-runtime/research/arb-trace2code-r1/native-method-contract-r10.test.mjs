// Exact two shared wording seams; no provider/model/label use.
// Open Questions: evidence/G01-NATIVE-CONTRACT-SUFFICIENCY-R10.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {CONTRACT_BEFORE,CONTRACT_AFTER,clarifySelectionContract} from './native-method-contract-r10.mjs';
import {loadProfileBoundMethodEpisode} from './native-method-episode-r10.mjs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
test('shared clarification is exactly reversible and duplicate/missing seams reject',()=>{
 assert.equal(clarifySelectionContract('x '+CONTRACT_BEFORE+' y'),'x '+CONTRACT_AFTER+' y');
 assert.throws(()=>clarifySelectionContract('none'));assert.throws(()=>clarifySelectionContract(CONTRACT_BEFORE+CONTRACT_BEFORE));
});
test('adapter reconstructs exact r7 native engine with unchanged eligibility and guidance, then isolated imports',async()=>{
 const n=await loadProfileBoundMethodEpisode();
 assert.equal(n.binding.previous_effective_module_sha256,'e1ce489e10110872ce755b95d0cc30722a45591078d9d1773ed7f8c9be0ac520');
 assert.equal(n.binding.guidance_sha256,'61da562b854d9ccea7b894ac72317b1f58077a463697e969a5bb00937ff5348d');
 assert.equal(n.binding.provider_profile_closure.loaded_modules.filter(m=>m.modified).length,2);
});
test('common task contract changes once with no arm condition or limit changes',()=>{
 const old=read('native-method-episode-r9.mjs'),next=read('native-method-episode-r10.mjs');
 const oldTask=old.match(/const nativeTask=.*?;\n/)[0],newTask=next.match(/const nativeTask=.*?;\n/)[0];
 assert.equal(newTask,clarifySelectionContract(oldTask));
 const limits=s=>s.slice(s.indexOf(' const configured='),s.indexOf(' const nativeTask='));
 assert.equal(limits(next),limits(old));
});
