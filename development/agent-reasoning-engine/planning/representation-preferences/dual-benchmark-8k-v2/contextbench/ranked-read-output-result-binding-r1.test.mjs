// Recorded real tokenizer evidence and semantic corruption checks. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {verifyRankedOutputQualification} from './ranked-read-output-result-binding-r1.mjs';
const schedule=JSON.parse(readFileSync(join(import.meta.dirname,'RANKED-READ-ACQUISITION-SCHEDULE-R1.json')));
const original=JSON.parse(readFileSync(join(import.meta.dirname,'ranked-read-output-tokenizer-live-r1/supervision/RESULTS.json')));
for(const [name,change,pattern] of [
 ['real result',()=>{},null],
 ['source omitted',q=>q.measurement_report.rows[0].result.source_output_visible=false,/visible-source/],
 ['zero windows',q=>q.measurement_report.rows[0].result.returned_windows=0,/visible-source/],
 ['7999 tokens',q=>q.measurement_report.rows[0].result.projected_tokens=7999,/window/],
 ['substituted prompt',q=>q.measurement_report.rows[0].result.prompt.messages.push({role:'user',content:'changed'}),/measurement-binding/],
 ['model receipt',q=>q.measurement_report.rows[0].result.index_receipts.push({kind:'model'}),/receipt-family/],
 ['forced process',q=>q.process_settlement.forced=true,/settlement/],
 ['reordered tasks',q=>q.measurement_report.rows.reverse(),/slot/],
])test(name,()=>{
 const root=mkdtempSync(join(tmpdir(),'ranked-output-binding-'));
 try{const q=structuredClone(original);change(q);const bytes=JSON.stringify(q),qualification_path=join(root,'result.json');writeFileSync(qualification_path,bytes);
 const args={qualification_path,qualification_sha256:createHash('sha256').update(bytes).digest('hex'),schedule};
 if(pattern)assert.throws(()=>verifyRankedOutputQualification(args),pattern);else assert.equal(verifyRankedOutputQualification(args),true);
 }finally{rmSync(root,{recursive:true,force:true});}
});
