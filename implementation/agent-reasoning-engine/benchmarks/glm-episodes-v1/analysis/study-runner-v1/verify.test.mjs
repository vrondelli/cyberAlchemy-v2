// Saved integration checks. Open questions: README.md#open-questions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {baselineMaterial} from './runner.mjs';
import {createReadOnlyToolRuntime} from '../../../../packages/coding-agent-runtime/read-only-tools.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(readFileSync(new URL('evidence-v2/'+p,import.meta.url)));
const summary=read('result.json');
test('source and artifact hashes match retained integration',()=>{
 const m=read('manifest.json');for(const s of m.sources)assert.equal(sha(readFileSync(new URL('../../../../'+s.path,import.meta.url))),s.sha256,s.path);
 for(const s of m.artifacts)assert.equal(sha(readFileSync(new URL('evidence-v2/'+s.path,import.meta.url))),s.sha256,s.path);
 assert.equal(summary.tests.length,32);assert.ok(summary.tests.every(t=>t.passed));
});
test('all captured bytes match receipts and model bodies were token-measured first',()=>{
 for(const t of summary.tests){const r=read(t.file),measured=new Set();assert.equal(r.captures.length,r.receipts.length);
  for(const [i,c] of r.captures.entries()){
   assert.equal(sha(c.raw),r.receipts[i].request_sha256);const b=JSON.parse(c.raw),key=JSON.stringify({messages:b.messages,tools:b.tools});
   if(c.kind==='tokenizer')measured.add(key);else assert.ok(measured.has(key));
  }
 }
});
test('host normalization stays isolated and raw metadata omissions remain visible',()=>{
 for(const t of summary.tests.filter(t=>t.arm)){const r=read(t.file);assert.ok(r.hidden_denials.every(d=>!d.ok));assert.equal(r.oracle_read_denied,true);
  if(t.arm==='host-envelope'){assert.equal(r.normalization.length,1);const n=r.normalization[0],raw=JSON.parse(n.raw_text);assert.equal(Object.hasOwn(raw,'schema_version'),false);assert.equal(Object.hasOwn(raw,'authority_effect'),false);assert.equal(sha(n.raw_text),r.raw_final_sha256);}
  else assert.equal(r.normalization.length,0);
 }
 assert.equal(read('badEnvelope.json').forbidden_envelope_rejected,true);
});
test('simulated transport failure remains one failed physical attempt with no retry',()=>{
 const r=read('forceFailure.json');assert.equal(r.status,'BLOCK');assert.equal(r.model_calls,1);assert.equal(r.receipts.filter(x=>x.kind==='model')[0].status,503);
});
test('baseline comparison excludes only validated history references, not scope or instructions',()=>{
 const a=read('baseline-original.json'),b=read('baseline-candidate.json');
 assert.deepEqual(a.captures.map(c=>baselineMaterial(JSON.parse(c.raw))),b.captures.map(c=>baselineMaterial(JSON.parse(c.raw))));
 const changed=JSON.parse(b.captures[0].raw);changed.messages[0].content+=' CHANGED INSTRUCTION';assert.notDeepEqual(baselineMaterial(changed),baselineMaterial(JSON.parse(a.captures[0].raw)));
 assert.throws(()=>baselineMaterial({history_ref:'invalid'}));
 assert.notDeepEqual(baselineMaterial({expected_base_tree_sha256:'a'.repeat(64)}),baselineMaterial({expected_base_tree_sha256:'b'.repeat(64)}));
});
test('existing hidden files are denied by allowlist, not merely missing on disk',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'are-denial57-'));try{
  writeFileSync(join(dir,'subject.mjs'),'export const x=1;');writeFileSync(join(dir,'oracle.json'),'[{"hidden":true}]');
  const runtime=createReadOnlyToolRuntime({repository_root:dir,observation_allowlist:['subject.mjs']});
  const result=await runtime.invoke('read-file',{path:'oracle.json'});assert.equal(result.ok,false);assert.deepEqual(result.reason_codes,['tool.invocation-blocked:PATH_NOT_ALLOWLISTED']);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
