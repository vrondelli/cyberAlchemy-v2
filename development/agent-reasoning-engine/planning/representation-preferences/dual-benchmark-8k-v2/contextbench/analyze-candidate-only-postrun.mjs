// Source-bound postrun diagnosis, no provider or evaluator calls.
// Open questions: CANDIDATE-ONLY-PLAN.md.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {verifyComparisonProductionFreeze} from './candidate-only-production.mjs';
import {prepareComparisonPrediction} from './score-candidate-only-campaign.mjs';
import {bindCompactDelivery} from './compact-delivery.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),stage=join(c,'candidate-only-production-live-r1'),read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const reviewPath=join(stage,'RESULT-REVIEW.json'),review=read(reviewPath);assert.equal(review.result_integrity_approved,true);
function verifyReview(){for(const b of review.source_bindings)assert.equal(hash(resolve(root,b.path)),b.sha256,'postrun.review-binding');}verifyReview();
const f=verifyComparisonProductionFreeze({manifest_path:join(stage,'FREEZE.json'),manifest_sha256:'cc813667321211cb0909a9f38e7d7429904ccb6b29fdbca64231414e39bc4ffd'}),request=f.request;
const scores=read(join(stage,'score/RESULTS.json')),manifest=read(join(request.metadata_root,'EVIDENCE-MANIFEST.json')),config=read(request.sources.config_path),sourceManifest=read(config.source_manifest);
assert.equal(scores.assigned_outcomes,4);assert.ok(scores.rows.every(r=>r.valid&&r.accounting_complete&&r.window_verified));assert.equal(scores.post_score_integrity_verified,true);
const metricPath=join(config.upstream,'contextbench/metrics/compute.py');assert.equal(hash(metricPath),sourceManifest.files.find(b=>b.path==='contextbench/metrics/compute.py').sha256);
const metric=readFileSync(metricPath,'utf8');for(const fragment of ['union_files, union_symbols, union_spans, union_lines','union_spans[f] = merge(union_spans.get(f, []) + ivs)','span_inter = span_intersection_bytes(union_spans, gold_spans)'])assert.ok(metric.includes(fragment));
const rows=[];
for(const [i,slot]of request.schedule.slots.entries()){
 const folder=String(i).padStart(2,'0'),outcome=read(join(request.outcome_root,'outcomes',folder+'.json')),result=outcome.result;
 const prepared=prepareComparisonPrediction({slot,outcome,entry:manifest.entries[i],runs_root:request.runs_root,source_root:request.source_root});assert.equal(prepared.verify(),true);
 assert.deepEqual(prepared.prediction,read(join(stage,'score',folder,'prediction.json')));
 const ex=result.native_export,projection=ex.source_projection,binding=bindCompactDelivery({captures:result.captures,receipts:result.receipts});assert.deepEqual(binding,ex.delivery_binding);assert.equal(binding.unmapped.length,0);
 const reads=binding.read_observations;assert.deepEqual(projection.projections.map(p=>p.read_id).sort(),reads.map(r=>r.id).sort());
 const expectedSteps=projection.events.filter(e=>e.delivered).map(e=>({files:[e.path],spans:{[e.path]:[{start:e.start_line,end:e.end_line}]}}));assert.deepEqual(prepared.prediction.traj_data.pred_steps,expectedSteps);
 const n=scores.native_outcomes[i].native.native;assert.equal(n.trajectory.steps.length,expectedSteps.length);assert.ok(expectedSteps.length>0);
 const union=n.trajectory.steps.at(-1).coverage.span,final=n.final.span.coverage;assert.ok(union>=final&&union<=1&&final>=0);
 const tool_counts={},failed_tool_counts={},failure_reasons={};
 for(const line of readFileSync(join(request.runs_root,folder,'events.jsonl'),'utf8').trim().split('\n')){
  const event=JSON.parse(line);if(event.kind!=='tool-result')continue;const tool=event.tool;assert.equal(typeof tool,'string');tool_counts[tool]=(tool_counts[tool]??0)+1;
  const output=typeof event.output==='string'?JSON.parse(event.output):event.output;
  if(output?.ok===false){failed_tool_counts[tool]=(failed_tool_counts[tool]??0)+1;const reason=output.error??JSON.stringify(output.issues??[]);failure_reasons[reason]=(failure_reasons[reason]??0)+1;}
 }
 rows.push({sequence:i,task_id:slot.task_id,arm:slot.arm,model_calls:scores.rows[i].model_calls,known_model_tokens:scores.rows[i].known_tokens,span_f1:scores.rows[i].metrics.span_f1,file_f1:scores.rows[i].metrics.file_f1,
  confirmed_observations:reads.length,projected_events:expectedSteps.length,unmapped_changed_lines:projection.projections.reduce((n,p)=>n+p.unmapped_current_lines.length,0),all_confirmed_observations_projected:true,all_projected_delivered_events_exported:true,
  exported_union_span_coverage:union,final_span_coverage:final,reference_span_share_absent_from_exported_union:1-union,reference_span_share_covered_but_not_selected:union-final,tool_counts,failed_tool_counts,failure_reasons});
}
verifyReview();
const body={schema:'are.candidate-only-postrun-analysis/v1',rows,known_model_tokens:rows.reduce((n,r)=>n+r.known_model_tokens,0),model_calls:rows.reduce((n,r)=>n+r.model_calls,0),source_bindings:[...review.source_bindings,{path:reviewPath,sha256:hash(reviewPath)},{path:metricPath,sha256:hash(metricPath)},{path:join(c,'analyze-candidate-only-postrun.mjs'),sha256:hash(join(c,'analyze-candidate-only-postrun.mjs'))}],
 method:'Reconstruct exact scored predictions; bind successful source observations to source projection and every native exported step. Read the existing pinned cumulative-union native metrics. Count exact tool-result failures without estimating causal token cost.',
 conclusions:['Every task is missing reference spans from the confirmed exported evidence union; final-selection repair alone cannot reach perfect quality.','Recovery address/cursor failures and repeated archive actions are observed, but their causal quality/token cost requires a new experiment.'],
 limitations:['Four exposed tasks; no controls and no causal architecture or efficiency comparison','Confirmed exported source evidence does not measure semantic understanding or patch correctness','Archive acquisition not confirmed as model delivery is outside exported-union coverage','No attribution of all model tokens to failed tool calls; successful and failed calls may share a response','Untouched confirmation and generalization remain pending'],new_model_calls:0,new_evaluator_calls:0,accepted_token_savings:null,campaign_goal_achieved:false,open_questions_ref:'../CANDIDATE-ONLY-PLAN.md'};
writeFileSync(join(stage,'POSTRUN-ANALYSIS.json'),JSON.stringify(body,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({rows,model_calls:body.model_calls,known_model_tokens:body.known_model_tokens,new_model_calls:0,new_evaluator_calls:0}));
