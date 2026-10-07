import {test} from 'node:test';import assert from 'node:assert/strict';
import {bindClassInfo} from './jacoco-class-binding-r3.mjs';
const i=[{path:'a/A.class',sha256:'x',bytes:1},{path:'a/A$1.class',sha256:'y',bytes:2}],s={classes:['a.A']};
const text='  INST   BRAN   LINE   METH   CXTY   ELEMENT\n 4 0 2 1 1 class 0x0123456789abcdef a/A\n 2 0 1 1 1 class 0xfedcba9876543210 a/A$1\n';
test('exact class bytes and inner classes bound',()=>assert.equal(bindClassInfo(text,i,s).length,2));
test('missing compiled class is not zero coverage',()=>assert.throws(()=>bindClassInfo(text.split('\n').slice(0,2).join('\n'),i,s),/incomplete/));
test('unmapped production class fails',()=>assert.throws(()=>bindClassInfo(text,i,{classes:['a.B']}),/missing-production/));
test('duplicate class ID row fails',()=>assert.throws(()=>bindClassInfo(text+text.split('\n')[1],i,s),/membership/));
