// Archive candidate diagnostic; original four-task result remains unchanged.
// Exact-reviewed evaluator-only entry point. Open questions: CANDIDATE-DESCRIPTIVE-SCORING.md.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {resolve,join} from 'node:path';import {createHash} from 'node:crypto';
import {runComparisonProductionStage} from './candidate-only-production-stage.mjs';
const verifyBinding=b=>assert.equal(hash(readFileSync(b.path)),b.sha256,'diagnostic.binding-drift:'+b.path);
const [operation,diagnostic_path,diagnostic_sha256,review_path]=process.argv.slice(2),hash=x=>createHash('sha256').update(x).digest('hex');
assert.ok(['qualify','score'].includes(operation));
const bytes=readFileSync(diagnostic_path);assert.equal(hash(bytes),diagnostic_sha256);const d=JSON.parse(bytes);
for(const b of d.files)verifyBinding(b);
if(operation==='score'){
 const review=JSON.parse(readFileSync(review_path));assert.equal(review.approved,true);assert.equal(review.diagnostic_execution_admitted,true);assert.equal(review.freeze_sha256,diagnostic_sha256);
 assert.ok(Array.isArray(review.source_bindings)&&review.source_bindings.some(b=>resolve(b.path)===resolve(diagnostic_path)&&b.sha256===diagnostic_sha256));
 for(const b of review.source_bindings)verifyBinding(b);
}
const controller=new AbortController();process.on('SIGTERM',()=>controller.abort());process.on('SIGINT',()=>controller.abort());
let result;
try{result=await runComparisonProductionStage({operation,args:{diagnostic_path:resolve(diagnostic_path),diagnostic_sha256},signal:controller.signal},{worker:resolve(import.meta.dirname,'query-archive-descriptive-worker-r1.mjs'),deadline_ms:operation==='qualify'?120000:3600000});}
catch(error){result={failed:true,...error.result};process.exitCode=2;}
writeFileSync(join(d.supervision_root,operation==='qualify'?'QUALIFICATION.json':'SCORING-SETTLEMENT.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({operation,failed:result.failed??false,settlement:result.settlement,qualified:result.value?.terminal?.qualified,scored_rows:result.value?.terminal?.native_outcomes?.filter(r=>r.valid).length}));
