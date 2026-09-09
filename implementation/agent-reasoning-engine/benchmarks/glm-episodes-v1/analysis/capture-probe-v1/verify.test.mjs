// Saved synthetic evidence checks. Open questions: README.md#open-questions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectFinal} from './probe.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const sha=x=>createHash('sha256').update(x).digest('hex');
const summary=read('./evidence/result.json');
test('saved source hashes still match the probe and coding runtime',()=>{
 for(const s of summary.input_hashes)assert.equal(sha(readFileSync(new URL('../../../../'+s.path,import.meta.url))),s.sha256,s.path);
});
for(const run of summary.runs)test(`${run.soft_limit} recycle=${run.recycled}: exact wire, scope, facts and controls`,()=>{
 const r=read(`./evidence/${run.soft_limit}-${run.recycled?'recycled':'baseline'}.json`);
 assert.equal(r.captures.length,r.receipts.length);
 r.captures.forEach((c,i)=>{assert.equal(sha(c.raw),c.sha256);assert.equal(c.sha256,r.receipts[i].request_sha256);assert.equal(c.kind,r.receipts[i].kind);});
 const models=r.captures.filter(c=>c.kind==='model');
 assert.equal(models[0].generation,0);assert.equal(models.at(-1).generation>0,run.recycled);
 assert.deepEqual(inspectFinal(JSON.parse(models.at(-1).raw),r.base),[]);
 assert.equal(Object.keys(r.negative_controls).length,5);assert.ok(Object.values(r.negative_controls).every(Boolean));
 assert.equal(r.completion_gate.passed,true);
});
