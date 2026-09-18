import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inventory, classify} from './distribution-inventory.mjs';

test('nested package owns its files without capturing similarly named siblings',()=>{
  const data={'root/package.json':{name:'root'},'root/vendor/package.json':{name:'vendor',license:'MIT'}};
  const paths=[...Object.keys(data),'root/vendor/LICENSE','root/vendor/src.js','root/vendor-other/src.js','elsewhere/code.rs'];
  const result=inventory({files:paths.map(path=>({path,bytes:1,sha256:'fixture'})),closure_digest:'fixture'},p=>JSON.stringify(data[p]));
  assert.equal(result.files.find(f=>f.path==='root/vendor/src.js').package_ref,'root/vendor/package.json');
  assert.equal(result.files.find(f=>f.path==='root/vendor-other/src.js').package_ref,'root/package.json');
  assert.equal(result.files.at(-1).package_ref,null);
  assert.deepEqual(result.packages.find(p=>p.name==='root').notice_files,[]);
  assert.equal(result.packages.find(p=>p.name==='root').declared_license,null);
  assert.deepEqual(result.packages.find(p=>p.name==='vendor').notice_files,['root/vendor/LICENSE']);
  assert.equal(result.publication_approved,false);
  assert.ok(result.files.every(f=>f.review_status==='unreviewed'));
  assert.equal(Object.values(result.groups).reduce((n,g)=>n+g.files,0),paths.length);
});
test('classification preserves bundled dependency and evidence distinction',()=>{
  assert.equal(classify('root/node_modules/a/README.md'),'bundled-dependency');
  assert.equal(classify('root/generated/receipt.json'),'generated-evidence');
  assert.equal(classify('root/a.test.mjs'),'test-or-benchmark');
});
test('third-party notices and license variants are discovered without unrelated source matches',()=>{
  const paths=['vendor/package.json','vendor/ThirdPartyNoticeText.txt','vendor/THIRD-PARTY-NOTICES.md','vendor/LICENSE-MIT','vendor/COPYRIGHT','vendor/license-validator.mjs'];
  const result=inventory({files:paths.map(path=>({path,bytes:1,sha256:'fixture'})),closure_digest:'fixture'},()=>'{"name":"vendor"}');
  assert.ok(result.license_files.includes('vendor/ThirdPartyNoticeText.txt'));
  assert.ok(result.license_files.includes('vendor/THIRD-PARTY-NOTICES.md'));
  assert.ok(result.license_files.includes('vendor/LICENSE-MIT'));
  assert.ok(result.license_files.includes('vendor/COPYRIGHT'));
  assert.ok(!result.license_files.includes('vendor/license-validator.mjs'));
});
