// Source-bound postrun diagnosis, no provider or evaluator calls.
// Open questions: FRONTIER-RESOURCE-HYPOTHESES-R2.md.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {verifyComparisonProductionFreeze} from './receipt-budget-production-r2.mjs';
import {prepareComparisonPrediction} from './score-receipt-budget-r1.mjs';
import {bindInvestigationEvidence} from './bounded-archive-frontier-evidence-join-r1.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),stage=join(c,'receipt-budget-production-live-r2'),original=join(c,'receipt-budget-production-live-r2'),read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const reviewPath=join(stage,'RESULT-REVIEW.json'),review=read(reviewPath);assert.equal(review.result_integrity_approved,true);
function verifyReview(){for(const b of review.source_bindings)assert.equal(hash(resolve(root,b.path)),b.sha256,'postrun.review-binding');}verifyReview();
const f=verifyComparisonProductionFreeze({manifest_path:join(original,'FREEZE.json'),manifest_sha256:'48810ae79cefd76db6688f309e5b781cb268858745f369f0e0e0d6aa5ae77401'}),request=f.request;
const scores=read(join(stage,'score/RESULTS.json')),manifest=read(join(request.metadata_root,'EVIDENCE-MANIFEST.json')),config=read(request.sources.config_path),sourceManifest=read(config.source_manifest);
assert.equal(scores.assigned_outcomes,4);assert.ok(scores.rows.every(r=>r.accounting_complete&&r.window_verified));assert.equal(scores.post_score_integrity_verified,true);
const metricPath=join(config.upstream,'contextbench/metrics/compute.py');assert.equal(hash(metricPath),sourceManifest.files.find(b=>b.path==='contextbench/metrics/compute.py').sha256);
const metric=readFileSync(metricPath,'utf8');for(const fragment of ['union_files, union_symbols, union_spans, union_lines','union_spans[f] = merge(union_spans.get(f, []) + ivs)','span_inter = span_intersection_bytes(union_spans, gold_spans)'])assert.ok(metric.includes(fragment));
const rows=[];
for(const [i,slot]of request.schedule.slots.entries()){
 if(!scores.native_outcomes[i].valid)continue;
 const folder=String(i).padStart(2,'0'),outcome=read(join(request.outcome_root,'outcomes',folder+'.json')),result=outcome.result;
 const prepared=prepareComparisonPrediction({slot,outcome,entry:manifest.entries[i],runs_root:request.runs_root,source_root:request.source_root});assert.equal(prepared.verify(),true);
 assert.deepEqual(prepared.prediction,read(join(stage,'score',folder,'prediction.json')));
 const events=readFileSync(join(request.runs_root,folder,'events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 const terminalIndex=events.findIndex(e=>e.kind==='terminal-packet');assert.ok(terminalIndex>=0);
 const end=result.branches.at(-1).receipt_indices.at(-1)+1;
 for(const branch of result.branches){
  assert.equal(branch.branch_id,'q1');const phase='discover';
  const recorded=events.slice(0,terminalIndex).filter(e=>e.kind==='request-capture'&&e.phase===phase).map(e=>e.capture);
  assert.deepEqual(branch.captures,recorded,'census.branch-capture-completeness');
 }
 const binding=bindInvestigationEvidence({branches:result.branches,receipts:result.receipts.slice(0,end)});
 assert.deepEqual(binding,events[terminalIndex].joined,'census.exact-join');
 const ex=result.native_export,projection=ex.source_projection;
 assert.equal(binding.join_sha256,ex.delivery_join_sha256);
 const reads=binding.read_observations;assert.deepEqual(projection.projections.map(p=>p.read_id).sort(),reads.map(r=>r.id).sort());
 const expectedSteps=projection.events.filter(e=>e.delivered).map(e=>({files:[e.path],spans:{[e.path]:[{start:e.start_line,end:e.end_line}]}}));assert.deepEqual(prepared.prediction.traj_data.pred_steps,expectedSteps);
 const n=scores.native_outcomes[i].native.native;assert.equal(n.trajectory.steps.length,expectedSteps.length);assert.ok(expectedSteps.length>0);
 const union=n.trajectory.steps.at(-1).coverage.span,final=n.final.span.coverage;assert.ok(union>=final&&union<=1&&final>=0);
 const tool_counts={},failed_tool_counts={},failure_reasons={};
 for(const line of readFileSync(join(request.runs_root,folder,'events.jsonl'),'utf8').trim().split('\n')){
  const event=JSON.parse(line);if(event.kind!=='source-tool-result')continue;const tool=event.call.function.name;assert.equal(typeof tool,'string');tool_counts[tool]=(tool_counts[tool]??0)+1;
  const output=typeof event.output==='string'?JSON.parse(event.output):event.output;
  if(output?.ok===false){failed_tool_counts[tool]=(failed_tool_counts[tool]??0)+1;const reason=output.error??JSON.stringify(output.issues??[]);failure_reasons[reason]=(failure_reasons[reason]??0)+1;}
 }
 const modelReceipts=result.receipts.filter(r=>r.kind==='model');
 const lastDiscovery=events.filter(e=>e.kind==='response-capture'&&e.phase==='discover').at(-1)?.response_capture.public_response;
 rows.push({tokenizer_state:result.tokenizer_state,known_tokens_before_final:modelReceipts.slice(0,-1).reduce((n,r)=>n+r.input_tokens+r.output_tokens,0),last_discovery_tool_names:(lastDiscovery?.message?.tool_calls??[]).map(c=>c.function.name),sequence:i,task_id:slot.task_id,arm:slot.arm,model_calls:scores.rows[i].model_calls,known_model_tokens:scores.rows[i].known_tokens,
  confirmed_observations:reads.length,projected_events:expectedSteps.length,unmapped_changed_lines:projection.projections.reduce((n,p)=>n+p.unmapped_current_lines.length,0),all_confirmed_observations_projected:true,all_projected_delivered_events_exported:true,
  exported_union_span_coverage:union,final_span_coverage:final,reference_span_share_absent_from_exported_union:1-union,reference_span_share_covered_but_not_selected:union-final,tool_counts,failed_tool_counts,failure_reasons});
}
verifyReview();
const body={schema:'are.receipt-budget-postrun-analysis/v1',rows,assigned_outcomes:4,scored_sequences:rows.map(r=>r.sequence),known_model_tokens:scores.rows.reduce((n,r)=>n+r.known_tokens,0),model_calls:scores.rows.reduce((n,r)=>n+r.model_calls,0),source_bindings:[...review.source_bindings,{path:reviewPath,sha256:hash(reviewPath)},{path:metricPath,sha256:hash(metricPath)},{path:join(c,'analyze-receipt-budget-postrun-r2.mjs'),sha256:hash(join(c,'analyze-receipt-budget-postrun-r2.mjs'))}],
 method:'Reconstruct exact scored predictions; bind successful source observations to source projection and every native exported step. Read the existing pinned cumulative-union native metrics. Count exact tool-result failures without estimating causal token cost.',
 conclusions:[rows.every(r=>r.exported_union_span_coverage<1)?'Every scored output lacks reference spans in its confirmed exported union; final selection alone cannot attain perfect coverage.':'Inspect per-task exported union versus final coverage; do not assume all tasks share one failure mode.','Every recorded continuous-investigation capture is included in the reconstructed join; every confirmed observation is projected and every delivered projected event is exported. Inspect unmapped changed lines before attributing coverage gaps.'],
 limitations:['Only completed outputs analyzed out of four exposed tasks; all four costs retained; no controls or causal architecture comparison','Confirmed exported source evidence does not measure semantic understanding or patch correctness','Archive acquisition not confirmed as model delivery is outside exported-union coverage','No attribution of all model tokens to failed tool calls; successful and failed calls may share a response','Untouched confirmation and generalization remain pending'],new_model_calls:0,new_evaluator_calls:0,accepted_token_savings:null,campaign_goal_achieved:false,open_questions_ref:'../FRONTIER-RESOURCE-HYPOTHESES-R2.md'};
writeFileSync(join(stage,'POSTRUN-ANALYSIS.json'),JSON.stringify(body,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({rows,model_calls:body.model_calls,known_model_tokens:body.known_model_tokens,new_model_calls:0,new_evaluator_calls:0}));
