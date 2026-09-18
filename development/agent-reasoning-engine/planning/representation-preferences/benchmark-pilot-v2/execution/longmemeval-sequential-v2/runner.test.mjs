import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runSequential} from './runner.mjs';
import {prepareTasks} from './prepare.mjs';
const preflight=JSON.parse(readFileSync(new URL('./preflight-compact-notes/result.json',import.meta.url)));
test('actual input above per-call reservation prevents any generation',async()=>{
 let generated=0;const saved=[];
 await assert.rejects(runSequential({tasks:prepareTasks(),preflight,provider:{tokenize:async()=>({usage:{prompt_tokens:7168}}),generate:async()=>{generated++;}},save:async x=>saved.push(x),saveClaim:async()=>{}}),/reserved admission/);
 assert.equal(generated,0);assert.equal(saved.at(-1).status,'stopped');
});
test('complete paired schedule retains treatment claims and counts every model token',async()=>{
 const tasks=prepareTasks(),saved=[],claims=[];
 const provider={tokenize:async()=>({usage:{prompt_tokens:100}}),generate:async()=>({output:'Retained historical fact [s0-m0].',usage:{prompt_tokens:100,completion_tokens:10,total_tokens:110}})};
 const result=await runSequential({tasks,preflight,provider,save:async x=>saved.push(x),saveClaim:async(id,c)=>claims.push({id,c})});
 assert.equal(result.completed_calls,64);assert.equal(result.completed_answers,16);assert.equal(result.total_tokens,7040);assert.equal(claims.length,24);
 assert.ok(claims.every(x=>x.c.event.content.posture==='unverified-model-claim'));
 assert.deepEqual(result.answers.slice(0,2).map(x=>x.arm),['control','treatment']);assert.deepEqual(result.answers.slice(8,10).map(x=>x.arm),['treatment','control']);
});
test('failed output retains known usage and does not retry',async()=>{
 let n=0;const saved=[];
 await assert.rejects(runSequential({tasks:prepareTasks(),preflight,provider:{tokenize:async()=>({usage:{prompt_tokens:100}}),generate:async()=>{n++;throw Object.assign(Error('incomplete-output'),{receipt:{failure:'incomplete-output',usage:{prompt_tokens:100,completion_tokens:512,total_tokens:612}}});}},save:async x=>saved.push(x),saveClaim:async()=>{}}),/incomplete/);
 assert.equal(n,1);assert.equal(saved.at(-1).total_tokens,612);assert.equal(saved.at(-1).usage_complete,true);
});
