import test from 'node:test';
import assert from 'node:assert/strict';
import {loadInput,assessInput,materializeRegistration,verifyRegistration} from './adapter.mjs';
import {buildView,renderHtml} from './view.mjs';
import {sourcePaths,verifyCandidate} from './verify.mjs';
import {materializeResearchDag} from './runtime/evolution-runtime/src/research-dag.mjs';
import {replayResearchWork,transitionResearchWork} from './runtime/evolution-runtime/src/research-work.mjs';
const input=loadInput();
test('exact historical fixture remains failed and inconclusive, never a population p95',()=>{
  const a=assessInput(input);assert.equal(a.smoke,'FAIL');assert.equal(a.host,'REJECTED');
  assert.equal(a.observation,'inconclusive');assert.equal(a.populationP95,null);
  assert.equal(a.performanceInference,'not_evaluable');
});
test('every source digest and raw log is mandatory',()=>{
  for(const field of ['report','candidate','budget','protocol','ontology']) {
    assert.throws(()=>assessInput({...input,[field]:input[field]+' '}),/digest/);
    assert.throws(()=>assessInput({...input,[field]:undefined}),/digest/);
  }
  assert.throws(()=>assessInput({...input,logs:[]}),/log-coverage/);
  const changed=structuredClone(input);changed.logs[0].bytes+='tampered';
  assert.throws(()=>assessInput(changed),/log-digest/);
});
test('synthetic forged report cannot upgrade host, metrics, process or approval',()=>{
  for(const mutate of [r=>r.smoke.hostRejections=[],r=>r.smoke.metrics={},r=>r.smoke.result.exitCode=0,r=>r.approval='approved']) {
    const r=JSON.parse(input.report);mutate(r);
    assert.throws(()=>assessInput({...input,report:JSON.stringify(r)}),/report-digest/);
  }
});
test('registration is deterministic and self verification rejects status edits',()=>{
  const r=materializeRegistration(input);assert.ok(verifyRegistration(r));
  assert.deepEqual(materializeRegistration(structuredClone(input)),r);
  const bad=structuredClone(r);bad.assessment.observation='supporting';assert.equal(verifyRegistration(bad),false);
});
test('default ARE verifier rejects Workspace; explicit adapter derives six nodes without changing defaults',()=>{
  const r=materializeRegistration(input);
  assert.throws(()=>materializeResearchDag({registrations:[r]}),/invalid-registration/);
  const d=materializeResearchDag({registrations:[r],verify_registration:verifyRegistration});
  assert.equal(d.nodes.length,6);assert.equal(d.edges.length,5);assert.equal(d.research_frontier.length,1);
  assert.deepEqual(d,materializeResearchDag({registrations:[r,r],verify_registration:verifyRegistration}));
  assert.throws(()=>materializeResearchDag({registrations:[r],verify_registration:()=>false}),/invalid-registration/);
  const h=r.records.find(x=>x.schema_version==='are.research-hypothesis/v1');
  assert.throws(()=>materializeResearchDag({registrations:[r],verify_registration:verifyRegistration,
    lineage:[{question_ref:r.question.record_id,hypothesis_ref:h.record_id,source_ref:'fixture:cycle'}]}),/cycle/);
});
test('work view completes only verified inspection and keeps independent construction ready',()=>{
  const {view,registration,verify_evidence}=buildView(input);
  assert.equal(view.state.tasks.find(t=>t.task_id==='evidence.inspect').state,'completed');
  assert.deepEqual(view.state.frontier.product_construction,['latency.inspect']);
  assert.deepEqual(view.state.frontier.operational_support,['host.qualify']);
  const args={plan:view.plan,registrations:[registration],verify_registration:verifyRegistration,verify_evidence};
  assert.deepEqual(replayResearchWork({...args,events:view.state.events}),view.state);
  assert.throws(()=>replayResearchWork({...args,events:view.state.events,verify_evidence:()=>({ok:false})}),/not-verified/);
  const blocked=transitionResearchWork({...args,state:view.state,expected_state_digest:view.state.state_digest,
    event:{event_id:'host-block',task_id:'host.qualify',action:'block',reason:'Host not qualified for next run'}});
  assert.deepEqual(blocked.frontier.product_construction,['latency.inspect']);
  assert.equal(blocked.tasks.find(t=>t.task_id==='experiment.run').state,'blocked');
});
test('criterion verifier rejects unrelated task, changed digest and unknown artifacts',()=>{
  const {view,verify_evidence}=buildView(input), e=view.state.events[1].evidence[0];
  const b={plan_digest:view.plan.plan_digest,task_id:'evidence.inspect',validator_ref:'workspace.research-evidence/v1',...e};
  assert.equal(verify_evidence(b).ok,true);
  for(const change of [{task_id:'experiment.run'},{artifact_digest:'0'.repeat(64)},{artifact_ref:'unknown'},{plan_digest:'0'.repeat(64)}])assert.equal(verify_evidence({...b,...change}).ok,false);
});
test('HTML is read-only, escaped and derived from the same view',()=>{
  const {view}=buildView(input);const html=renderHtml(view);
  assert.match(html,/Host rejected/);assert.match(html,new RegExp(view.view_digest));assert.doesNotMatch(html,/<script/);
  const v=structuredClone(view);v.research_dag.nodes[0].label='<script>bad</script>';
  assert.doesNotMatch(renderHtml(v),/<script>/);assert.match(renderHtml(v),/&lt;script&gt;/);
});
test('synthetic candidate fixture passes only with exact complete source inventory',()=>{
  const c={schema_version:'workspace.research-candidate/v1',status:'candidate',authority_effect:'none',approval:'not-requested',
    closure_ceiling:'selected-source-inventory-not-transitive-build-closure',sources:sourcePaths.map(path=>({path,sha256:'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}))};
  assert.equal(verifyCandidate(c,()=>Buffer.from('')).ok,true);
  assert.equal(verifyCandidate({...c,sources:c.sources.slice(1)},()=>Buffer.from('')).ok,false);
  assert.equal(verifyCandidate({...c,approval:'approved'},()=>Buffer.from('')).ok,false);
  assert.equal(verifyCandidate(c,()=>Buffer.from('changed')).ok,false);
  assert.equal(verifyCandidate(c,()=>{throw Error('missing');}).ok,false);
});
