import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSopsAgeProcessSecretProvider} from '../sops-age-secret-provider.mjs';
import {createSecretProviderRegistry,createSecretReference,secretResolutionFailure} from '../secret-provider.mjs';
const sentinel='DO_NOT_EXPORT_SYNTHETIC_SECRET';
async function failed(script, expected, options={}) {
 const root=mkdtempSync(join(tmpdir(),'are-secret-diagnostic-'));
 try {
  mkdirSync(join(root,'secret_management'));
  writeFileSync(join(root,'secret_management','bridge.py'),script);
  const provider=createSopsAgeProcessSecretProvider({provider_id:'test',python_command:'/usr/bin/python3',project_root:root,timeout_ms:1500,...options});
  const registry=createSecretProviderRegistry({providers:[provider]});
  await assert.rejects(registry.consume({secret_ref:createSecretReference({provider_id:'test',locator:sentinel}),consumer_id:'test',request_digest:'a'.repeat(64),consumer(){assert.fail('failure must never dispatch');}}),error=>{
   assert.equal(error.code,'resolution-denied');assert.equal(secretResolutionFailure(error),expected);
   assert.ok(!JSON.stringify(error).includes(sentinel));assert.ok(!String(error).includes(sentinel));return true;
  });
 } finally {rmSync(root,{recursive:true,force:true});}
}
test('bridge timeout remains distinguishable and redacted',()=>failed('import time; time.sleep(5)','timeout',{timeout_ms:100}));
test('bridge process failures never export stderr',()=>failed(`import sys; sys.stderr.write('${sentinel}'); sys.exit(1)`,'process-failed'));
test('bridge rejects empty output',()=>failed('pass','empty-output'));
test('bridge rejects excess material without export',()=>failed(`print('${sentinel}')`,'output-limit',{max_secret_bytes:2}));
test('bridge reports spawn failure',()=>failed('pass','spawn-failed',{python_command:'/nonexistent/are-python'}));
test('untrusted error text and forged diagnostic fields stay unknown',()=>{
 assert.equal(secretResolutionFailure({resolution_failure:sentinel}),'unknown');
 assert.equal(secretResolutionFailure({resolution_failure:'timeout'}),'unknown');
});
