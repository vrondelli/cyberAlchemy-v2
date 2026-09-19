// Source-verified analysis of existing native cumulative metrics. No evaluator calls.
// Open questions: COMPACT-DIAGNOSTIC-NEXT-DAG.md.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {resolve,join} from 'node:path';import {createHash} from 'node:crypto';import {register} from 'node:module';
import {createHistoricalSourceOverlay} from './historical-source-overlay.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),stage=join(c,'compact-descriptive-live-r1'),read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const diagnostic=read(join(stage,'FREEZE.json')),overlay=createHistoricalSourceOverlay(diagnostic.overlay);overlay.verifyFreeze();register(new URL('./historical-source-loader.mjs',import.meta.url),{data:diagnostic.overlay});
const reviewPath=join(stage,'RESULT-REVIEW.json'),review=read(reviewPath);assert.equal(review.result_integrity_approved,true);for(const b of review.source_bindings)overlay.verifyBinding(b);
const {prepareComparisonPrediction}=await import('./score-comparison-compact-campaign.mjs');
const {bindCompactDelivery}=await import('./compact-delivery.mjs');const {bindInvestigationEvidence}=await import('./compact-evidence-join.mjs');
const freeze=read(diagnostic.original_freeze.path),f=freeze.request,manifest=read(join(f.metadata_root,'EVIDENCE-MANIFEST.json')),scores=read(join(stage,'score/RESULTS.json')),config=read(f.sources.config_path),sourceManifest=read(config.source_manifest);
const metricPath=join(config.upstream,'contextbench/metrics/compute.py');assert.equal(hash(metricPath),sourceManifest.files.find(b=>b.path==='contextbench/metrics/compute.py').sha256);
// Semantic conclusion is independently reviewed against this pinned implementation;
// source text matches below prevent accidentally analyzing a different algorithm.
const metric=readFileSync(metricPath,'utf8');for(const fragment of ['union_files, union_symbols, union_spans, union_lines','union_spans[f] = merge(union_spans.get(f, []) + ivs)','span_inter = span_intersection_bytes(union_spans, gold_spans)'])assert.ok(metric.includes(fragment));
const rows=[];
for(const i of [1,3,7]){
 const slot=f.schedule.slots[i],outcome=read(join(f.outcome_root,'outcomes',String(i).padStart(2,'0')+'.json')),result=outcome.result;
 const prepared=prepareComparisonPrediction({slot,outcome,entry:manifest.entries[i],runs_root:f.runs_root,source_root:f.source_root});assert.equal(prepared.verify(),true);
 assert.deepEqual(prepared.prediction,read(join(stage,'score',String(i).padStart(2,'0'),'prediction.json')));
 const ex=result.native_export,projection=ex.source_projection;
 let reads;
 if(slot.arm==='current-are'){
  const binding=bindCompactDelivery({captures:result.captures,receipts:result.receipts});assert.deepEqual(binding,ex.delivery_binding);assert.equal(binding.unmapped.length,0);reads=binding.read_observations;
 }else{
  const end=result.branches.at(-1).receipt_indices.at(-1)+1;
  const joined=bindInvestigationEvidence({branches:result.branches,receipts:result.receipts.slice(0,end)});assert.equal(joined.join_sha256,ex.delivery_join_sha256);reads=joined.read_observations;
 }
 assert.deepEqual(projection.projections.map(p=>p.read_id).sort(),reads.map(r=>r.id).sort());
 const expectedSteps=projection.events.filter(e=>e.delivered).map(e=>({files:[e.path],spans:{[e.path]:[{start:e.start_line,end:e.end_line}]}}));assert.deepEqual(prepared.prediction.traj_data.pred_steps,expectedSteps);
 const n=scores.native_outcomes[i].native.native;assert.equal(n.trajectory.steps.length,expectedSteps.length);
 const union=n.trajectory.steps.at(-1).coverage.span,final=n.final.span.coverage;assert.ok(union>=final&&union<=1&&final>=0);
 rows.push({sequence:i,arm:slot.arm,task_id:slot.task_id,confirmed_observations:reads.length,projected_events:projection.events.length,observations_with_unmapped_changed_lines:projection.projections.filter(p=>p.unmapped_current_lines.length).length,unmapped_changed_lines:projection.projections.reduce((n,p)=>n+p.unmapped_current_lines.length,0),all_confirmed_observations_projected:true,all_projected_delivered_events_exported:true,exported_union_span_coverage:union,final_span_coverage:final,reference_span_share_absent_from_exported_union:1-union,reference_span_share_covered_but_not_selected:union-final});
}
for(const b of review.source_bindings)overlay.verifyBinding(b);
const bindings=[...review.source_bindings,{path:reviewPath,sha256:hash(reviewPath)},{path:metricPath,sha256:hash(metricPath)},{path:join(c,'analyze-compact-delivered-union.mjs'),sha256:hash(join(c,'analyze-compact-delivered-union.mjs'))}];
const report={schema:'are.compact-delivered-union-analysis/v1',source_bindings:bindings,historical_source_overlay:diagnostic.overlay,assigned_outcomes:12,analyzed_sequences:[1,3,7],rows,method:'Pinned native trajectory coverage accumulates a union over exported steps. Reconstruct original predictions and prove all confirmed source-tool observations pass through projection into those steps. Read existing native metrics; do not rerun evaluation.',new_model_calls:0,new_evaluator_calls:0,conclusion:'For these survivors most reference spans are absent from the confirmed exported union. Final selection alone cannot recover that missing reference context. This supports testing retrieval/delivery coverage, not a claim that memory architecture is causally inferior.',limitations:['Three exposed survivors, not a comparative architecture result','Confirmation requires successful receipt-bound source-tool delivery; textual summaries, unknown/failed requests and unrecognized source channels are outside this measurement','Current changed lines may not project to base; per-row counts remain explicit','Native coverage is not proof of semantic use or patch correctness; no gold content enters generator inputs'],campaign_goal_achieved:false,accepted_token_savings:null,open_questions_ref:'COMPACT-DIAGNOSTIC-NEXT-DAG.md'};
writeFileSync(join(c,'COMPACT-DELIVERED-UNION-RESULT-R1.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({rows,new_model_calls:0,new_evaluator_calls:0}));
