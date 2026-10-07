// Open Questions: evidence/G02-PREBASE-COCHANGE-SOURCE-R1.json.
import test from'node:test';import assert from'node:assert/strict';import{rankCochange}from'./prebase-cochange-r1.mjs';
const c=(n,paths)=>({commit:n.toString(16).padStart(40,'0'),paths}),run=history=>rankCochange({history,seeds:['seed.py'],observed:['seed.py','seen.py'],eligible:['seed.py','a.py','seen.py']});
test('two witnessed co-edits admit an unseen path',()=>assert.deepEqual(run([c(1,['seed.py','a.py']),c(2,['seed.py','a.py'])]).treatment.map(x=>x.path),['a.py']));
test('one occurrence abstains',()=>assert.deepEqual(run([c(1,['seed.py','a.py'])]).treatment,[]));
test('already observed and absent-base paths are never candidates',()=>assert.deepEqual(run([c(1,['seed.py','seen.py','absent.py']),c(2,['seed.py','seen.py','absent.py'])]).treatment,[]));
test('raw mega-commit excluded before base-file filtering',()=>assert.deepEqual(run([c(1,['seed.py','a.py',...Array.from({length:19},(_,i)=>'removed'+i)]),c(2,['seed.py','a.py'])]).treatment,[]));
test('duplicate history paths fail',()=>assert.throws(()=>run([c(1,['seed.py','seed.py'])])));
