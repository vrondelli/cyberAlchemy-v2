import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadDefinitions,deriveBundle,verifyBundle,buildProgress,verifySaved} from './hypothesize.mjs';
import {digest} from '../research-learning-owned/runtime/request-intent-runtime/src/canonical.mjs';
const report=()=>JSON.parse(readFileSync(new URL('../research-learning-owned/latency-inspect-001/report.json',import.meta.url)));
test('four deterministic hypotheses cover seven boundaries without invented observations',()=>{
  const b=deriveBundle();assert.deepEqual(b,deriveBundle());assert.equal(b.records.length,4);
  assert.equal(new Set(b.definitions.flatMap(h=>h.boundaries)).size,7);
  assert.deepEqual(b.observations,[]);assert.equal(b.causal_conclusion,'not_evaluable');
  assert.equal(b.registration_status,'not-registered');assert.ok(verifyBundle(b));
  assert.ok(b.records.every(r=>r.schema_version==='are.research-hypothesis/v1'));
});
test('missing falsifiers, controls, coverage and extra fields fail closed',()=>{
  for(const mutate of [x=>delete x[0].falsifier,x=>x[0].controls=[],x=>x[0].boundaries=['connect'],x=>x[0].outcome='supported',x=>x[1].id=x[0].id]){
    const x=loadDefinitions();mutate(x);assert.throws(()=>deriveBundle(x));
  }
});
test('selected report cannot be forged or rebound by refreshing a digest',()=>{
  const r=report();r.boundaries[0].conclusion='IPC is the cause';
  const {report_digest,...material}=r;r.report_digest=digest(material);
  assert.throws(()=>deriveBundle(loadDefinitions(),r));
});
test('record edits, budget changes and omitted alternatives cannot complete work',()=>{
  for(const mutate of [b=>b.records[0].statement='proven',b=>b.protocol.qualifiedSessions=1,b=>b.protocol.maxAttempts=999,b=>b.definitions.pop(),b=>b.causal_conclusion='supported']){
    const b=structuredClone(deriveBundle());mutate(b);const {bundle_digest,...material}=b;b.bundle_digest=digest(material);
    assert.equal(verifyBundle(b),false);assert.throws(()=>buildProgress(b));
  }
});
test('only experiment registration becomes ready; host and run remain separate',()=>{
  const {view}=buildProgress();assert.deepEqual(view.state.frontier.product_construction,['experiment.register']);
  assert.deepEqual(view.state.frontier.operational_support,['host.qualify']);
  assert.equal(view.state.tasks.find(t=>t.task_id==='experiment.run').state,'planned');
  assert.equal(view.hypothesis_projection.nodes.length,5);assert.equal(view.hypothesis_projection.edges.length,4);
  assert.equal(view.research_dag.nodes.length,6);
});
test('criterion binds exact plan, task, validator, artifact and digest',()=>{
  const {view,verify_evidence}=buildProgress();
  const evidence=view.state.tasks.find(t=>t.task_id==='latency.hypothesize').evidence[0];
  const b={plan_digest:view.plan.plan_digest,task_id:'latency.hypothesize',validator_ref:'workspace.research-evidence/v1',...evidence};
  assert.equal(verify_evidence(b).ok,true);
  for(const key of Object.keys(b))assert.notEqual(verify_evidence({...b,[key]:'wrong'}).ok,true);
});
test('saved candidate and derived outputs verify exactly',()=>{assert.equal(verifySaved().ok,true);});
