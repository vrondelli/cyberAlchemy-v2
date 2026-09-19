// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {classifySearchArguments} from './ranked-read-arguments-r1.mjs';
const args=()=>({mode:'ranked',query:'first context offset',revision:'base',path_prefix:'',offset:0,limit:5});
test('literal defaults preserve native inputs and do not mutate callers',()=>{
 for(const mode of [undefined,'literal']){const a={query:7,unexpected:'preserve native error'};if(mode)a.mode=mode;const before=structuredClone(a);const r=classifySearchArguments(a);assert.equal(r.kind,'literal');assert.deepEqual(r.args,{query:7,unexpected:'preserve native error'});assert.deepEqual(a,before);}
});
test('all invalid ranked fields reported together',()=>{
 const r=classifySearchArguments({...args(),query:'',revision:'current',path_prefix:'src',offset:1,limit:6,extra:true});
 assert.equal(r.kind,'reject');for(const p of ['/query','/revision','/path_prefix','/offset','/limit','/extra'])assert.ok(r.result.issues.some(i=>i.path===p));
 assert.equal(r.result.total_issues,6);
});
test('every required field, bad types, mode and bounds rejected',()=>{
 for(const key of ['query','revision','path_prefix','offset','limit']){const a=args();delete a[key];assert.equal(classifySearchArguments(a).kind,'reject',key);}
 for(const [key,value] of [['query',null],['query',7],['offset','0'],['limit',1.2],['limit',0],['limit',-1],['mode',null],['mode','semantic']])assert.equal(classifySearchArguments({...args(),[key]:value}).kind,'reject');
 for(const a of [null,[],false])assert.equal(classifySearchArguments(a).kind,'reject');
});
test('UTF8 byte cap differs from character cap; lone surrogates rejected',()=>{
 for(const query of ['é'.repeat(2049),'\ud800','a'.repeat(4097)])assert.equal(classifySearchArguments({...args(),query}).kind,'reject');
 for(const query of ['é'.repeat(2048),'a'.repeat(4096)])assert.equal(classifySearchArguments({...args(),query}).kind,'ranked');
});
test('oversized input is bounded before validation and never echoed',()=>{
 const r=classifySearchArguments({...args(),extra:'secret'.repeat(2000)}).result;
 assert.deepEqual(r.issues,[{code:'input-size',path:''}]);assert.ok(!JSON.stringify(r).includes('secret'));assert.ok(Buffer.byteLength(JSON.stringify(r))<=8192);
});
test('all errors counted, diagnostic prefix and multibyte pointers bounded',()=>{
 const a=args();for(let i=0;i<70;i++)a['é'.repeat(20)+i]=true;
 const r=classifySearchArguments(a).result;assert.equal(r.total_issues,70);assert.ok(r.issues.length<=32);assert.equal(r.omitted_issues,70-r.issues.length);assert.ok(Buffer.byteLength(JSON.stringify(r))<=8192);
 const long=classifySearchArguments({...args(),['é'.repeat(180)]:1}).result.issues[0].path;
 assert.ok(Buffer.byteLength(long)<=256);assert.equal(Buffer.from(long).toString('utf8'),long);
});
test('valid ranked arguments remain exact and independently copied',()=>{
 const a=args(),r=classifySearchArguments(a);assert.equal(r.kind,'ranked');assert.deepEqual(r.args,a);r.args.limit=1;assert.equal(a.limit,5);
});
