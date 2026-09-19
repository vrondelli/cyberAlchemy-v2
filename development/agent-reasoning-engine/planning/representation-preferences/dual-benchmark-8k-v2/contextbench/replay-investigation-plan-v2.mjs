// Replays public planner outputs only. No model/evaluator calls. Open questions: INVESTIGATION-PLAN-V2.md.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {resolve,join} from 'node:path';import {createHash} from 'node:crypto';
import {createHistoricalSourceOverlay} from './historical-source-overlay.mjs';
import {validateInvestigationPlan as oldValidate} from './independent-phase-runtime.mjs';
import {diagnoseInvestigationPlan,PLAN_POSTURE} from './investigation-plan-v2.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),hash=x=>createHash('sha256').update(x).digest('hex'),read=p=>JSON.parse(readFileSync(p));
const df=read(join(c,'compact-descriptive-live-r1/FREEZE.json')),overlay=createHistoricalSourceOverlay(df.overlay),reviewPath=join(c,'compact-comparison-production-live-r1/RESULT-REVIEW.json'),review=read(reviewPath);
assert.equal(review.result_integrity_approved,true);for(const b of review.source_bindings)overlay.verifyBinding(b);
const stage=join(c,'compact-comparison-production-live-r1'),rows=[];
for(const sequence of [2,6]){
 const run=join(stage,'runs_root',String(sequence).padStart(2,'0')),result=read(join(run,'result.json')),events=readFileSync(join(run,'events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 const captures=events.filter(e=>e.kind==='response-capture'&&e.phase==='plan');assert.equal(captures.length,1);
 const capture=captures[0].response_capture,{capture_sha256,...body}=capture;assert.equal(hash(stable(body)),capture_sha256);
 const receipt=result.receipts[capture.receipt_index];assert.equal(hash(stable(receipt)),capture.receipt_sha256);assert.equal(receipt.request_sha256,capture.request_sha256);assert.equal(receipt.status,200);
 const raw=capture.public_response.message.content;assert.equal(typeof raw,'string');assert.throws(()=>oldValidate(raw),/plan-source-identifier/);
 const diagnostic=diagnoseInvestigationPlan(raw);assert.equal(diagnostic.ok,true);assert.equal(diagnostic.posture,PLAN_POSTURE);assert.equal(diagnostic.questions.length,3);
 rows.push({sequence,public_plan_sha256:hash(raw),response_capture_sha256:capture_sha256,receipt_sha256:capture.receipt_sha256,original_error:result.error,candidate_valid:true,question_ids:diagnostic.questions.map(q=>q.id),candidate_posture:diagnostic.posture});
}
for(const b of review.source_bindings)overlay.verifyBinding(b);
const source_bindings=[...review.source_bindings,{path:reviewPath,sha256:hash(readFileSync(reviewPath))},...['investigation-plan-v2.mjs','independent-repair-compact-plan-v2.mjs','investigation-plan-v2.test.mjs','independent-repair-compact-plan-v2.test.mjs','replay-investigation-plan-v2.mjs'].map(n=>({path:join(c,n),sha256:hash(readFileSync(join(c,n)))}))];
const report={schema:'are.investigation-plan-v2-replay/v1',historical_source_overlay:df.overlay,source_bindings,rows,new_model_calls:0,new_evaluator_calls:0,original_results_changed:false,candidate_posture:'offline validation repair; not a live completion or benchmark quality result',campaign_goal_achieved:false,open_questions_ref:'INVESTIGATION-PLAN-V2.md'};
writeFileSync(join(c,'INVESTIGATION-PLAN-V2-REPLAY.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({rows,new_model_calls:0}));
