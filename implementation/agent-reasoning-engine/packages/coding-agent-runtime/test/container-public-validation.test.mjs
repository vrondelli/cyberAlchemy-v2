import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {createContainerPublicValidator} from '../container-public-validation.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function setup(t){const root=mkdtempSync(join(tmpdir(),'are-container-adapter-test-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const subject=join(root,'subject.mjs'),path=join(root,'cases.json');writeFileSync(subject,'export const solve=()=>2;');writeFileSync(path,'{"rule":"two"}');return {subject,plan:{schema_version:'are.public-case-plan/v1',sources:[{path,sha256:hash(readFileSync(path))}],checks:[{id:'two',export_name:'solve',args:[],expected:{ok:true,value:2},evidence:[{path,selector:'/rule',value_sha256:hash(JSON.stringify('two'))}]}]}};}
function response(root){const plan=JSON.parse(readFileSync(join(root,'plan.json')));return {schema_version:'are.public-case-result/v1',ok:true,subject_sha256:hash(readFileSync(join(root,'subject.mjs'))),plan_sha256:hash(JSON.stringify(plan)),results:[{id:'two',passed:true,reason:'matched'}],total:1,passed:1};}
test('container adapter binds remapped evidence and preserves original plan',t=>{
 const x=setup(t);const before=JSON.stringify(x.plan);let temporary;
 const backend=createContainerPublicValidator({run_container:({repository_root,config})=>{temporary=repository_root;assert.equal(config.memory,'512m');const r=response(repository_root);return {ok:true,sandbox:{stdout:JSON.stringify(r)},cleanup:{verified_absent:true}};}});
 const r=backend.validate(x);assert.equal(r.ok,true);assert.equal(r.plan_sha256,hash(before));assert.equal(JSON.stringify(x.plan),before);assert.equal(existsSync(temporary),false);
});
test('forged worker source hash cannot pass',t=>{
 const x=setup(t);const backend=createContainerPublicValidator({run_container:({repository_root})=>{const r=response(repository_root);r.subject_sha256='0'.repeat(64);return {ok:true,sandbox:{stdout:JSON.stringify(r)},cleanup:{verified_absent:true}};}});assert.equal(backend.validate(x).ok,false);
});
test('worker failure remains execution failure without native fallback',t=>{
 const r=createContainerPublicValidator({run_container:()=>({ok:false,sandbox:{},cleanup:{verified_absent:true}})}).validate(setup(t));assert.equal(r.ok,false);assert.equal(r.results[0].reason,'container-validation-failed');
});
test('unconfirmed cleanup is carried to stage',t=>{
 const r=createContainerPublicValidator({run_container:()=>({ok:false,sandbox:{},cleanup:{verified_absent:false}})}).validate(setup(t));assert.equal(r.worker_cleanup_verified,false);
});
test('source drift rejects before container launch',t=>{const x=setup(t);x.plan.sources[0].sha256='0'.repeat(64);assert.throws(()=>createContainerPublicValidator({run_container:()=>assert.fail()}).validate(x),/source-drift/);});
