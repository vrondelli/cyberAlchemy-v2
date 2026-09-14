import test from 'node:test';
import assert from 'node:assert/strict';
import {parseConfig,parseCredential} from './cli.mjs';
const config={schema_version:'are.glm-flash-config/v1',model:'glm-5.3-flash',credential:{provider_kind:'local-sops-age',provider_id:'local-model-secrets',locator:'model/zai-key'},run_id:'test',request:'repair',fixture_root:'/tmp/fixture',state_directory:'/tmp/state',observation_allowlist:['src.mjs'],mutation_allowlist:['src.mjs'],context_limit:16384,recycle_at:8000,safety_margin:1024};
test('delivery config preserves legacy omission and accepts only explicit supported candidates',()=>{
 assert.deepEqual(parseConfig(config),config);
 for(const delivery_policy of ['legacy-v1','bounded-reads-v1'])assert.equal(parseConfig({...config,delivery_policy}).delivery_policy,delivery_policy);
 for(const delivery_policy of [null,'guess',{},true,0])assert.throws(()=>parseConfig({...config,delivery_policy}),/delivery-policy-invalid/);
 assert.throws(()=>parseConfig({...config,read_batch_limit:10}),/config-fields-invalid/);
});
test('completion config requires bounded delivery and preserves omission',()=>{
 assert.equal(parseConfig(config).completion_policy,undefined);
 assert.equal(parseConfig({...config,delivery_policy:'bounded-reads-v1',completion_policy:'budget-aware-v1'}).completion_policy,'budget-aware-v1');
 for(const completion_policy of [null,'unknown',1])assert.throws(()=>parseConfig({...config,completion_policy}),/completion-policy-invalid/);
 assert.throws(()=>parseConfig({...config,completion_policy:'budget-aware-v1'}),/completion-requires-bounded-delivery/);
});
test('source config is opt-in and requires bounded delivery',()=>{
 assert.equal(parseConfig(config).source_policy,undefined);
 assert.equal(parseConfig({...config,delivery_policy:'bounded-reads-v1',source_policy:'inspected-mutation-v1'}).source_policy,'inspected-mutation-v1');
 for(const source_policy of [null,'unknown',42])assert.throws(()=>parseConfig({...config,source_policy}),/source-policy-invalid/);
 assert.throws(()=>parseConfig({...config,source_policy:'inspected-mutation-v1'}),/source-requires-bounded-delivery/);
});
test('local credential bridge accepts only a bounded explicit resolution deadline',()=>{
 const credential={...config.credential,timeout_ms:30000};
 assert.deepEqual(parseCredential(credential),credential);
 for(const timeout_ms of [0,999,300001,1.5,'30000'])assert.throws(()=>parseCredential({...credential,timeout_ms}),/credential-timeout-invalid/);
});
