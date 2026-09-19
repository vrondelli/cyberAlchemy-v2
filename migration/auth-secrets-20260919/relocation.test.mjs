import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=p=>readFileSync(resolve(root,p),'utf8');
test('imported files retain audited bytes; local-only archives may be absent',()=>{
 const {files}=JSON.parse(read('migration/auth-secrets-20260919/source-manifest.json'));
 for(const f of files){
  const target=resolve(root,f.destination);
  const localOnly=/^auth-foundation\/development\/(authentication-v1\/history\/|auth-service-d65-r2-plan\/remote-staging-orodi-plan-001\/vps\/out\/)/.test(f.destination);
  if(localOnly&&!existsSync(target))continue;
  assert.equal(createHash('sha256').update(readFileSync(target)).digest('hex'),f.sha256,f.destination);
 }
});
test('KELD resolves Auth within this checkout and lock agrees',()=>{
 const p=JSON.parse(read('keld-project/integrations/package.json'));
 const lock=JSON.parse(read('keld-project/integrations/package-lock.json'));
 const dep=p.dependencies['@auth-foundation/session-core'];
 assert.equal(dep,'file:../../auth-foundation/implementation/session-core');
 assert.equal(lock.packages[''].dependencies['@auth-foundation/session-core'],dep);
 assert.ok(existsSync(resolve(root,'keld-project/integrations',dep.slice(5),'package.json')));
});
test('Alch Auth source imports stay inside this checkout',()=>{
 const base='language/capabilities/alchlang/plans/general-compiler-v1/extensions/inference-router-v1';
 for(const file of ['security/auth-foundation.mjs','security/browser/binding.mjs']){
  const text=read(base+'/'+file);
  assert.ok(!text.includes('domainspec-core/projects/auth-foundation'));
  for(const [,target] of text.matchAll(/['"]((?:\.\.\/)+auth-foundation\/[^'"]+)['"]/g)){
   assert.ok(existsSync(fileURLToPath(new URL(target,new URL(base+'/'+file,'file://'+root)))));
  }
 }
});
test('operator state and historical payloads are excluded from Git',()=>{
 const paths=['auth-foundation/implementation/authentication-https/.runtime/config.json','auth-foundation/example.pem','auth-foundation/implementation/session-core/node_modules/example','secret-management/secrets.yaml','auth-foundation/development/authentication-v1/history/example'];
 const ignored=execFileSync('git',['check-ignore','--stdin'],{cwd:root,input:paths.join('\n')+'\n',encoding:'utf8'}).trim().split('\n');
 assert.deepEqual(ignored,paths);
});
