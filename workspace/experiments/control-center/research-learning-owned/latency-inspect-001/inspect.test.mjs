import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveReport,verifyReport,buildProgress,sourceRead} from './inspect.mjs';
import {digest} from '../runtime/request-intent-runtime/src/canonical.mjs';
const bindings=JSON.parse(readFileSync(new URL('./sources.json',import.meta.url)));
test('source inspection covers seven boundaries without a causal claim',()=>{
  const r=deriveReport();assert.equal(r.sources.length,6);assert.equal(r.boundaries.length,7);
  assert.equal(r.causal_conclusion,'not_evaluable');assert.ok(verifyReport(r));
  assert.deepEqual(deriveReport(),r);
});
test('missing source, changed bytes and omitted binding fail closed',()=>{
  assert.throws(()=>deriveReport(bindings,()=>{throw Error('missing');}));
  assert.throws(()=>deriveReport(bindings,p=>sourceRead(p)+' '),/source-drift/);
  assert.throws(()=>deriveReport(bindings.slice(1)),/coverage/);
});
test('forged report and omitted measurement gaps cannot complete inspection',()=>{
  const r=structuredClone(deriveReport());r.boundaries[0].missing=[];assert.equal(verifyReport(r),false);
  r.causal_conclusion='IPC is the cause';assert.equal(verifyReport(r),false);
});
test('completion unlocks only hypotheses and preserves operational separation',()=>{
  const {view}=buildProgress();
  assert.deepEqual(view.state.frontier.product_construction,['latency.hypothesize']);
  assert.deepEqual(view.state.frontier.operational_support,['host.qualify']);
  assert.equal(view.state.tasks.find(t=>t.task_id==='latency.inspect').state,'completed');
  assert.equal(view.state.tasks.find(t=>t.task_id==='experiment.run').state,'planned');
  assert.equal(view.assessment.performanceInference,'not_evaluable');
});
test('criterion binds exact plan, task, artifact and verifier',()=>{
  const {report,view,verify_evidence}=buildProgress();
  const b={plan_digest:view.plan.plan_digest,task_id:'latency.inspect',validator_ref:'workspace.research-evidence/v1',
    criterion_id:'timing-boundary-report',artifact_ref:'workspace-timing-report:'+report.report_digest,artifact_digest:digest(report)};
  assert.equal(verify_evidence(b).ok,true);
  for(const change of [{plan_digest:'bad'},{task_id:'latency.hypothesize'},{artifact_digest:'bad'},{validator_ref:'other'},{criterion_id:'other'}])
    assert.equal(verify_evidence({...b,...change}).ok,false);
});
