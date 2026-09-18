import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyPrefix} from './verify.mjs';
import {runSequential} from './runner.mjs';
import {prepareTasks} from '../prepare.mjs';
const preflight=JSON.parse(readFileSync(new URL('../preflight-compact-notes/result.json',import.meta.url)));
test('authoritative stopped prefix accounts for all starts and exact schedule',()=>{assert.equal(verifyPrefix().remaining_calls,36);});
test('suffix recovery never repeats completed generations and retains total usage',async()=>{
 const {prefix}=verifyPrefix(),seen=[];
 const r=await runSequential({tasks:prepareTasks(),preflight,prefix,provider:{tokenize:async()=>({usage:{prompt_tokens:100}}),generate:async id=>{seen.push(id);return {output:'Historical fact [s0-m0].',usage:{prompt_tokens:100,completion_tokens:10,total_tokens:110}};}},save:async()=>{},saveClaim:async()=>{}});
 assert.equal(seen.length,36);assert.equal(seen.some(id=>prefix.calls.some(c=>c.id===id)),false);assert.equal(r.completed_answers,16);assert.equal(r.total_tokens,65762+3960);
});
