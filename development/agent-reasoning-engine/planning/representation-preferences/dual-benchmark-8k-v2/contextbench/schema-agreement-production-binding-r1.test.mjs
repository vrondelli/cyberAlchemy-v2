// Qualification integrity only; no model generation or native quality claim.
// Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {verifyInitialQualification,verifyFinalQualification} from './schema-agreement-production-r1.mjs';
import {verifyRankedOutputQualification} from './schema-agreement-output-result-binding-r1.mjs';
import {rankedReadTool as historicalTool} from './ranked-read-acquisition-tool-r2.mjs';
const c=import.meta.dirname,hash=x=>createHash('sha256').update(x).digest('hex'),schedule=JSON.parse(readFileSync(join(c,'SCHEMA-AGREEMENT-SCHEDULE-R1.json')));
const path=kind=>join(c,'schema-agreement-'+kind+'-tokenizer-live-r1/supervision/RESULTS.json');
for(const [kind,verify] of [['initial',verifyInitialQualification],['output',verifyRankedOutputQualification],['final',verifyFinalQualification]])test('real '+kind+' qualification binds current four-slot candidate',()=>{
 const p=path(kind);assert.equal(verify({qualification_path:p,qualification_sha256:hash(readFileSync(p)),schedule}),true);
 assert.throws(()=>verify({qualification_path:p,qualification_sha256:'0'.repeat(64),schedule}));
 const wrong=structuredClone(schedule);wrong.slots[0].cell_sha256='0'.repeat(64);assert.throws(()=>verify({qualification_path:p,qualification_sha256:hash(readFileSync(p)),schedule:wrong}));
});
test('old advertised schema cannot substitute for current initial prompt even with a new file hash',t=>{
 const root=mkdtempSync(join(tmpdir(),'schema-production-binding-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const q=JSON.parse(readFileSync(path('initial'))),row=q.measurement_report.rows[0],prompt=JSON.parse(readFileSync(row.prompt_path));
 prompt.tools=prompt.tools.map(t=>t.function?.name==='search'?historicalTool:t);
 const bytes=JSON.stringify(prompt),p=join(root,'prompt.json');writeFileSync(p,bytes);row.prompt_path=p;row.prompt_sha256=hash(bytes);
 const report=JSON.stringify(q),r=join(root,'result.json');writeFileSync(r,report);
 assert.throws(()=>verifyInitialQualification({qualification_path:r,qualification_sha256:hash(report),schedule}),/qualification-current-tool-schema/);
});
test('forced final settlement and oversized final requests fail despite matching file hashes',t=>{
 const root=mkdtempSync(join(tmpdir(),'schema-final-binding-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 for(const mutate of [q=>q.process_settlement.forced=true,q=>q.measurement_report.rows[0].result.projected_tokens=7999]){
  const q=JSON.parse(readFileSync(path('final')));mutate(q);const bytes=JSON.stringify(q),p=join(root,'result.json');writeFileSync(p,bytes);assert.throws(()=>verifyFinalQualification({qualification_path:p,qualification_sha256:hash(bytes),schedule}));
 }
});
