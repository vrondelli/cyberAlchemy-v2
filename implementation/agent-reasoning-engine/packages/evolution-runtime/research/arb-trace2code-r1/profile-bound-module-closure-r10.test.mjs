// No providers/labels; exact projection, isolation and delivery negatives.
// Open Questions: evidence/G01-NATIVE-CONTRACT-SUFFICIENCY-R10.json.
import {CONTRACT_BEFORE,CONTRACT_AFTER} from './native-method-contract-r10.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {hash} from '../g02-product-r4/vps-json-provider-r1.mjs';
import {providerBody} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';
import {bodyForReceipt as legacyBody,bindDelivery as legacyBind,stable} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {TERMINAL_PATH,DELIVERY_PATH,profileSource,profileModuleURL,loadProfileBoundModule,profileClosureEvidence} from './profile-bound-module-closure-r10.mjs';
const delivery=await loadProfileBoundModule(new URL('../../../../benchmarks/contextbench-v1/delivery.mjs',import.meta.url));
const input={operation:'generate',request_id:'synthetic-closure',messages:[{role:'user',content:'x'}],tools:[],output_cap:512};
const prompt=stable({messages:input.messages,tools:input.tools}),receipt={kind:'model',model:'glm-5.3-flash',output_cap:512,reasoning_effort:'low',
 dispatched:true,status:200,input_tokens:100,output_tokens:20,request_sha256:hash(providerBody(input))};
const capture={prompt,prompt_sha256:hash(prompt)};
test('only declared delivery flag and terminal wording change; original predicate and schema remain',()=>{
 const p=profileSource(DELIVERY_PATH),base=readFileSync(DELIVERY_PATH,'utf8');assert.equal(p.source.replace('clear_thinking:true','clear_thinking:false'),base);
 const policy=profileSource(new URL('./method-selection-terminal-r5.mjs',import.meta.url).pathname);assert.equal(policy.modified,true);
 assert.equal(policy.source.replace(CONTRACT_AFTER,CONTRACT_BEFORE),readFileSync(TERMINAL_PATH,'utf8'));
});
test('legacy module cache remains unchanged and cross-profile delivery credit rejects',()=>{
 assert.equal(legacyBody(prompt,receipt).thinking.clear_thinking,false);assert.equal(delivery.bodyForReceipt(prompt,receipt).thinking.clear_thinking,true);
 assert.equal(hash(stable(delivery.bodyForReceipt(prompt,receipt))),hash(providerBody(input)));
 assert.throws(()=>legacyBind({captures:[capture],receipts:[receipt]}),/capture-not-found/);
 const old={...receipt,request_sha256:hash(stable(legacyBody(prompt,receipt)))};
 assert.throws(()=>delivery.bindDelivery({captures:[capture],receipts:[old]}),/capture-not-found/);
 assert.equal(delivery.bindDelivery({captures:[capture],receipts:[receipt]}).token_accounting.cost_complete,true);
});
test('malformed receipt profile and wrong request digest remain rejected',()=>{
 assert.throws(()=>delivery.bodyForReceipt(prompt,{...receipt,output_cap:null}),/profile-missing/);
 assert.throws(()=>delivery.bindDelivery({captures:[capture],receipts:[{...receipt,request_sha256:'0'.repeat(64)}]}),/capture-not-found/);
 assert.throws(()=>delivery.bindDelivery({captures:[capture],receipts:[{...receipt,dispatched:null}]}),/dispatch-unknown/);
 const unknown=delivery.bindDelivery({captures:[capture],receipts:[{...receipt,input_tokens:null,output_tokens:null}]});
 assert.equal(unknown.token_accounting.cost_complete,false);assert.equal(unknown.read_observations.length,0);
});
test('unconfirmed and withheld observations never acquire source credit',()=>{
 const failed=delivery.bindDelivery({captures:[capture],receipts:[{...receipt,status:500}]});assert.equal(failed.read_observations.length,0);
 assert.equal(failed.requests[0].posture,'delivery-unconfirmed');
 const pending=delivery.bindDelivery({captures:[capture],receipts:[]});assert.equal(pending.read_observations.length,0);
});
test('only exact pinned namespace library URLs accepted, no CLI/network/query override',async()=>{
 assert.throws(()=>profileModuleURL(new URL('./run-native-method-live-r8.mjs',import.meta.url)),/nonlibrary/);
 assert.throws(()=>profileModuleURL(new URL('./not-pinned.mjs',import.meta.url)),/nonlibrary/);
 assert.throws(()=>profileModuleURL('https://example.invalid/x.mjs'),/file-only/);
 assert.throws(()=>profileModuleURL(new URL('../../../../benchmarks/contextbench-v1/delivery.mjs?other=1',import.meta.url)),/no-other-query/);
 await assert.rejects(import(new URL('../../../../benchmarks/contextbench-v1/delivery.mjs?are_native_provider_profile_r10=other',import.meta.url).href),/exact-namespace/);
 assert.equal(profileClosureEvidence().canonical_files_changed,false);
});
test('prediction and navigation audit transitive consumers resolve to same modified delivery module',async()=>{
 await loadProfileBoundModule(new URL('./native-method-live-policy-r5.mjs',import.meta.url));
 await loadProfileBoundModule(new URL('./audit-navigation-state-r6b.mjs',import.meta.url));
 const e=profileClosureEvidence();assert.equal(e.loaded_modules.filter(m=>m.modified).length,2);
 assert.equal(e.loaded_modules.find(m=>m.path===DELIVERY_PATH).path,DELIVERY_PATH);assert.ok(e.loaded_modules.some(m=>m.path.endsWith('/method-selection-terminal-r5.mjs')));
 assert.ok(e.loaded_modules.some(m=>m.path.endsWith('/audit-navigation-state-r6b.mjs')));
});
