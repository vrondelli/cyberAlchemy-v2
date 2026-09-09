import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {validatePublicCases} from '../public-case-validation.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function setup(t,source='export const solve=x=>x+1;') {
 const root=mkdtempSync(join(tmpdir(),'are-public-test-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const subject=join(root,'subject.mjs'),path=join(root,'visible.json');
 writeFileSync(subject,source);writeFileSync(path,JSON.stringify({requirement:'increment'}));
 const plan={schema_version:'are.public-case-plan/v1',sources:[{path,sha256:hash(readFileSync(path))}],checks:[{id:'increment',export_name:'solve',args:[1],expected:{ok:true,value:2},evidence:[{path,selector:'/requirement',value_sha256:hash(JSON.stringify('increment'))}]}]};
 return {subject,plan,child_timeout_ms:5000,batch_timeout_ms:120000};
}
test('public checker compares values outside candidate and rejects wrong result',t=>{
 const x=setup(t);assert.equal(validatePublicCases(x).ok,true);x.plan.checks[0].expected.value=3;assert.equal(validatePublicCases(x).ok,false);
});
test('source or selector drift rejects before execution',t=>{
 const x=setup(t);x.plan.checks[0].evidence[0].value_sha256='0'.repeat(64);assert.throws(()=>validatePublicCases(x),/selector-drift/);
 x.plan.sources[0].sha256='0'.repeat(64);assert.throws(()=>validatePublicCases(x),/source-drift/);
});
test('missing evidence and excess checks reject',t=>{
 const x=setup(t);x.plan.checks[0].evidence=[];assert.throws(()=>validatePublicCases(x),/evidence-required/);
 x.plan.checks=Array(33).fill(x.plan.checks[0]);assert.throws(()=>validatePublicCases(x),/budget/);
});
test('candidate cannot read public expected-data file',t=>{
 const x=setup(t);writeFileSync(x.subject,`import {readFileSync} from 'node:fs';export const solve=()=>readFileSync(${JSON.stringify(x.plan.sources[0].path)},'utf8');`);
 assert.equal(validatePublicCases(x).ok,false);
});
test('candidate mutation and infinite execution fail',t=>{
 const x=setup(t,'export const solve=x=>{x.changed=true;return 2};');x.plan.checks[0].args=[{}];assert.equal(validatePublicCases(x).ok,false);
 writeFileSync(x.subject,'export const solve=()=>{while(true){}}');x.child_timeout_ms=100;const r=validatePublicCases(x);assert.equal(r.ok,false);assert.equal(r.results[0].reason,'child-timeout');
});
test('candidate stdout cannot fake a passing TAP report',t=>{
 const x=setup(t,"console.log('ok 1 - passed');export const solve=()=>2;");assert.equal(validatePublicCases(x).ok,false);
});
