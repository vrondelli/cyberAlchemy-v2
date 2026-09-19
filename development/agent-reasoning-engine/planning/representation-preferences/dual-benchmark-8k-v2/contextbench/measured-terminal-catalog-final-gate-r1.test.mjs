// Real qualification evidence plus tampering regressions. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {verifyFinalQualification} from './measured-terminal-catalog-production-r1.mjs';
const schedule=JSON.parse(readFileSync(new URL('./MEASURED-TERMINAL-CATALOG-SCHEDULE-R1.json',import.meta.url)));
const path=join(import.meta.dirname,'measured-catalog-final-tokenizer-live-r1/supervision/RESULTS.json');
const pin='f175ef36402fbffd731a5d5d88abce7ac6ace6a3e9c49a25206fb9e656eb3247';
test('accepts exact real final qualification for the candidate schedule',()=>assert.equal(verifyFinalQualification({qualification_path:path,qualification_sha256:pin,schedule}),true));
test('rejects settlement, task, envelope, receipt and measurement tampering',t=>{
 const root=mkdtempSync(join(tmpdir(),'catalog-gate-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const mutate=[q=>q.process_settlement.forced=true,q=>q.measurement_report.rows[0].result.cell_sha256='wrong',q=>q.measurement_report.rows[0].result.projected_tokens=7999,q=>q.measurement_report.rows[0].result.index_receipts.push({kind:'model'}),q=>q.measurement_report.rows[0].result.receipts[0].status=503,q=>q.measurement_report.rows[0].result.receipts[0].input_tokens++];
 for(const [i,edit]of mutate.entries()){
  const q=JSON.parse(readFileSync(path));edit(q);const body=JSON.stringify(q),f=join(root,i+'.json');writeFileSync(f,body);
  assert.throws(()=>verifyFinalQualification({qualification_path:f,qualification_sha256:createHash('sha256').update(body).digest('hex'),schedule}),/final-qualification/);
 }
});
