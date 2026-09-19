// Source-only archived fixtures; no gold, network, tokenizer or provider calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {verifyLiveFreeze} from './live.mjs';
import {hash} from './prepare.mjs';
import {terminalSourceClosure} from './source-closure.mjs';
const fixture=()=>verifyLiveFreeze(join(import.meta.dirname,'live-freeze.json')).jobs;
test('all eight archived terminal source closures preserve ranking candidates and expose exact additional dependencies',()=>{
 const jobs=fixture(),before=jobs.map(j=>hash(j.donor)),closures=jobs.map(j=>terminalSourceClosure(j.donor));
 assert.equal(closures.length,8);
 assert.deepEqual(closures.map(c=>c.additional_paths),[['lib/compress/zstd_lazy.c'],[],[],[],[],[],[],[]]);
 assert.deepEqual(closures.map(c=>c.terminal_delivery_count),[87,74,54,60,58,18,85,44]);
 for(const [i,c]of closures.entries()){
  assert.equal(c.candidate_policy_unchanged,true);assert.equal(c.prefix_candidate_count,jobs[i].donor.reads.length);
  assert.equal(c.source_set_sha256,hash(c.reads));assert.equal(hash(jobs[i].donor),before[i]);
  assert.ok(jobs[i].donor.reads.every(r=>c.reads.some(x=>x.id===r.id&&x.source_sha256===r.source_sha256)));
 }
});
test('changed terminal request, receipt identity, prefix evidence or archived bytes fail closed',()=>{
 const donor=fixture()[0].donor;
 const wrongReceipt=structuredClone(donor);wrongReceipt.original_terminal_receipt_sha256='0'.repeat(64);assert.throws(()=>terminalSourceClosure(wrongReceipt),/confirmed original terminal/);
 const wrongPrompt=structuredClone(donor),wire=JSON.parse(wrongPrompt.original_prompt);wire.messages[0].content+=' source drift';wrongPrompt.original_prompt=JSON.stringify(wire);assert.throws(()=>terminalSourceClosure(wrongPrompt));
 const wrongPrefix=structuredClone(donor);wrongPrefix.reads[0].source_sha256='0'.repeat(64);assert.throws(()=>terminalSourceClosure(wrongPrefix));
 const temp=mkdtempSync(join(tmpdir(),'packet-closure-drift-'));try{const wrongArchive=structuredClone(donor);wrongArchive.archive_root=temp;writeFileSync(join(temp,'result.json'),'{}');wrongArchive.bindings.push({path:join(temp,'result.json'),sha256:'0'.repeat(64)});assert.throws(()=>terminalSourceClosure(wrongArchive));}finally{rmSync(temp,{recursive:true,force:true});}
});
