import test from "node:test";
import assert from "node:assert/strict";
import {loadBenchmarkRegistrations} from "../src/benchmark-registration.mjs";
import {materializeResearchDag, verifyResearchDag} from "../src/research-dag.mjs";
const allRegistrations = loadBenchmarkRegistrations();
const registrations = ["requirement-change-001","requirement-latency-001"].map(id=>allRegistrations.find(record=>record.experiment_id===id));
test("selected historical research projects into six-node branches with open questions", () => {
  const d = materializeResearchDag({registrations});
  assert.equal(d.nodes.length,12); assert.equal(d.edges.length,10);
  assert.equal(d.research_frontier.length,2);assert.equal(d.dependency_layers.length,5);
  assert.ok(d.nodes.some(n => n.outcome === "counterevidence"));
  assert.ok(d.nodes.some(n => n.disposition === "revise-hypothesis"));
  assert.equal(verifyResearchDag(d,registrations),true);
  assert.ok(Object.isFrozen(d.edges));
  for(const e of d.edges) assert.ok(d.topological_order.indexOf(e.from)<d.topological_order.indexOf(e.to));
});
test("the complete stored corpus includes newly registered research without invalidating history",()=>{
  const d=materializeResearchDag({registrations:allRegistrations});
  assert.equal(d.nodes.length,allRegistrations.length*6);
  assert.equal(d.edges.length,allRegistrations.length*5);
  assert.equal(d.research_frontier.length,allRegistrations.length);
  assert.equal(verifyResearchDag(d,allRegistrations),true);
  assert.ok(allRegistrations.some(record=>record.experiment_id==='requirement-replication-001'));
});
test("source permutation and repeated imports preserve DAG bytes", () => {
  const a = materializeResearchDag({registrations});
  assert.deepEqual(materializeResearchDag({registrations:[...registrations].reverse()}),a);
  assert.deepEqual(materializeResearchDag({registrations:[...registrations,...registrations]}),a);
});
test("explicit successor lineage joins branches without rewriting history", () => {
  const [a,b]=registrations;
  const before=materializeResearchDag({registrations});
  const lineage=[{question_ref:a.question.record_id,hypothesis_ref:b.records[0].record_id,source_ref:"test:declared-lineage-not-a-production-claim"}];
  const after=materializeResearchDag({registrations,lineage});
  assert.equal(after.edges.length,before.edges.length+1);assert.equal(after.research_frontier.length,1);
  assert.equal(before.research_frontier.length,2);
  assert.notEqual(after.dag_digest,before.dag_digest);
});
test("backward lineage and multi-branch cycles fail closed", () => {
  const [a,b]=registrations;
  const link=(x,y)=>({question_ref:x.question.record_id,hypothesis_ref:y.records[0].record_id,source_ref:"test"});
  assert.throws(()=>materializeResearchDag({registrations,lineage:[link(a,a)]}),/cycle-detected/);
  assert.throws(()=>materializeResearchDag({registrations,lineage:[link(a,b),link(b,a)]}),/cycle-detected/);
});
test("missing references, tampering and authority-bearing lineage block", () => {
  const a=registrations[0], link={question_ref:a.question.record_id,hypothesis_ref:"missing",source_ref:"test"};
  assert.throws(()=>materializeResearchDag({registrations,lineage:[link]}),/lineage-types/);
  assert.throws(()=>materializeResearchDag({registrations,lineage:[{...link,authority_effect:"grant"}]}),/invalid-lineage/);
  assert.throws(()=>materializeResearchDag({registrations:[{...a,gates:{}}]}),/invalid-registration/);
  const d=materializeResearchDag({registrations});
  assert.equal(verifyResearchDag({...d,research_frontier:[]},registrations),false);
});
test("empty research collection has no invented frontier", () => {
  const d=materializeResearchDag();assert.deepEqual(d.nodes,[]);assert.deepEqual(d.research_frontier,[]);
});
