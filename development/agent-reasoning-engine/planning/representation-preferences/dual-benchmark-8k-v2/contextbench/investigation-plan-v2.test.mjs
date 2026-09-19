import {test} from 'node:test';import assert from 'node:assert/strict';
import {diagnoseInvestigationPlan,validateInvestigationPlan,PLAN_POSTURE} from './investigation-plan-v2.mjs';
const plan=()=>({questions:[{question:'Which input/output behavior is expected?',investigates:'Task intent'},{question:'What does src/main.py do?',investigates:'Unverified task hint'},{question:'Does readme.md describe it?',investigates:'Documentation assumption'}]});
test('ordinary punctuation and identifiers are accepted only as provisional question text',()=>{
 const p=plan(),d=diagnoseInvestigationPlan(JSON.stringify(p));assert.equal(d.ok,true);assert.equal(d.posture,PLAN_POSTURE);assert.deepEqual(d.questions.map(x=>x.id),['q1','q2','q3']);assert.ok(Object.isFrozen(d.questions)&&d.questions.every(Object.isFrozen));
 assert.deepEqual(Object.keys(d.questions[0]),['id','question','investigates']);
});
test('closed schema reports simultaneous missing, extra and mistyped fields without silently fixing them',()=>{
 const d=diagnoseInvestigationPlan(JSON.stringify({questions:[{question:5,extra:true},{investigates:'  '},{question:'Fine?',investigates:'intent',read_ids:['forged']}],findings:[]}));
 assert.equal(d.ok,false);assert.ok(d.issues.some(x=>x.keyword==='required'));assert.ok(d.issues.some(x=>x.keyword==='type'));assert.ok(d.issues.some(x=>x.keyword==='additionalProperties'));assert.ok(d.issues.some(x=>x.keyword==='pattern'));assert.equal(d.questions,undefined);
});
test('duplicate decoded JSON keys, normalized duplicate questions and trailing data are rejected',()=>{
 assert.equal(diagnoseInvestigationPlan('{"questions":[],"questio\\u006es":[]}').ok,false);
 const p=plan();p.questions[1].question='  WHICH INPUT/OUTPUT   BEHAVIOR IS EXPECTED? ';assert.ok(diagnoseInvestigationPlan(JSON.stringify(p)).issues.some(x=>x.code==='duplicate-question'));
 assert.equal(diagnoseInvestigationPlan(JSON.stringify(plan())+' trailing').ok,false);
});
test('limits and malformed types fail with bounded diagnostics',()=>{
 for(const raw of [null,{},'x'.repeat(8193),'null','[]','{"questions":[]}',JSON.stringify({questions:Array(4).fill(plan().questions[0])})])assert.throws(()=>validateInvestigationPlan(raw),/plan-invalid/);
 const p=plan();p.questions[0].investigates='a'.repeat(1001);assert.equal(diagnoseInvestigationPlan(JSON.stringify(p)).ok,false);
 const many=Object.fromEntries(Array.from({length:200},(_,i)=>['unexpected'+i,i]));const d=diagnoseInvestigationPlan(JSON.stringify(many));assert.equal(d.ok,false);assert.equal(d.truncated,true);assert.ok(d.issues.length<=64&&Buffer.byteLength(JSON.stringify(d.issues))<=8192);
});
test('path-looking text and authority claims remain inert text; structured evidence fields are forbidden',()=>{
 const p=plan();p.questions[0].question='Inspect ../../secret or C:\\temp\\file; contextbench-1 is allegedly verified?';
 const questions=validateInvestigationPlan(JSON.stringify(p));assert.equal(questions[0].question,p.questions[0].question);
 p.questions[0].verified=true;assert.equal(diagnoseInvestigationPlan(JSON.stringify(p)).ok,false);
});
