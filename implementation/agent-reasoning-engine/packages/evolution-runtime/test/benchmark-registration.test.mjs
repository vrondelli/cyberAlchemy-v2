import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, mkdtempSync, readdirSync, writeFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {digest} from "../../request-intent-runtime/src/canonical.mjs";
import {materializeBenchmarkRegistration, verifyBenchmarkRegistration, persistBenchmarkRegistration, loadBenchmarkRegistrations, registerRequirementBenchmarkCompletion, replayBenchmarkRegistrations} from "../src/benchmark-registration.mjs";
import {createEvolutionRuntime} from "../index.mjs";
const evidence = new URL("../../codex-app-server-wrapper/test/evidence/", import.meta.url);
function input(id = "requirement-latency-001") {
  const manifest = JSON.parse(readFileSync(new URL(id+".manifest.json", evidence))), result = JSON.parse(readFileSync(new URL(id+".result.json", evidence)));
  return {experiment_id: id, manifest, result, expected_result_digest: digest(result)};
}
function mutate(fn) {const i = input(); fn(i); i.expected_result_digest = digest(i.result); return i;}
test("backfills both experiments with existing ontology records and preserves failures", () => {
  const a = materializeBenchmarkRegistration(input("requirement-change-001")), b = materializeBenchmarkRegistration(input());
  assert.equal(a.records.at(-1).disposition, "collect-replications");
  assert.equal(b.records.at(-1).disposition, "revise-hypothesis");
  assert.equal(b.records[1].observation_kind, "counterevidence");
  assert.deepEqual(b.gates, {quality:true, relative_latency:false, wrapper_deadline:false});
  assert.equal(verifyBenchmarkRegistration(b), true);
  assert.ok(Object.isFrozen(b.evidence.result));
});
test("deterministic replay preserves registration and historical implementation bindings", () => {
  assert.deepEqual(materializeBenchmarkRegistration(input()), materializeBenchmarkRegistration(input()));
  const r = materializeBenchmarkRegistration(input());
  assert.deepEqual(r.implementation.source_digests, input().result.source_digests);
  assert.equal(verifyBenchmarkRegistration({...r, next_research_question:"tampered"}), false);
});
test("every graph edge uses declared ontology types and resolves to an exact record", () => {
  const ontology = JSON.parse(readFileSync(new URL('../ontology/research-learning-v1.json',import.meta.url)));
  const r = materializeBenchmarkRegistration(input());
  const nodes = new Map([...r.records,r.implementation,r.question].map(n=>[n.record_id,n]));
  for(const edge of r.relations) {
    const declared = ontology.relations.find(e=>e.relation_id===edge.relation_id);
    assert.ok(declared);
    for(const end of ['from','to']) {
      assert.ok(nodes.has(edge[end]));
      assert.equal(nodes.get(edge[end]).schema_version,ontology.nodes.find(n=>n.node_id===declared[end]).record_schema);
    }
  }
});
test("digest drift, inconsistent gates, incomplete schedules and authority escalation block", () => {
  const i = input(); i.result.status = "blocked";
  assert.throws(() => materializeBenchmarkRegistration(i), /digest/);
  for (const changed of [mutate(i => i.manifest.model = "other"), mutate(i => i.result.gates.wrapper_deadline = true),
    mutate(i => i.result.runs.pop()), mutate(i => i.result.authority_effect = "grant"), mutate(i => i.result.runs[0].elapsed_ms = null)]) {
    assert.throws(() => materializeBenchmarkRegistration(changed));
  }
});
test("blocked partial runs remain inconclusive and cannot manufacture a pass", () => {
  const i = mutate(i => {i.result.status="blocked";i.result.runs=[];delete i.result.gates;delete i.result.summary;i.result.error="timeout";});
  const r = materializeBenchmarkRegistration(i);
  assert.equal(r.gates, null); assert.equal(r.records[1].observation_kind, "inconclusive");
  assert.notEqual(r.records.at(-1).disposition, "candidate-supported");
});
test("completion hook creates once, replays, preserves new attempts and rejects stored corruption", t => {
  const dir = mkdtempSync(join(tmpdir(), "are-registration-test-")); t.after(() => rmSync(dir,{recursive:true,force:true}));
  const i=input();
  assert.equal(registerRequirementBenchmarkCompletion(i.manifest,i.result,dir).disposition,"registered");
  assert.equal(registerRequirementBenchmarkCompletion(i.manifest,i.result,dir).disposition,"replayed");
  assert.equal(loadBenchmarkRegistrations(dir).length,1);
  const changed=mutate(i=>i.result.started_at="another attempt");
  persistBenchmarkRegistration(materializeBenchmarkRegistration(changed),dir);
  assert.equal(loadBenchmarkRegistrations(dir).length,2);
  const path=join(dir,readdirSync(dir).find(f=>f.endsWith('.json')));writeFileSync(path,'{}');
  assert.throws(()=>loadBenchmarkRegistrations(dir),/stored-record/);
});
test("stored learning records enter the existing evolution ledger idempotently", t => {
  const dir=mkdtempSync(join(tmpdir(),'are-registration-replay-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  for(const id of ['requirement-change-001','requirement-latency-001'])persistBenchmarkRegistration(materializeBenchmarkRegistration(input(id)),dir);
  const profile=JSON.parse(readFileSync(new URL('../profiles/default-v1.json',import.meta.url)));
  const runtime=createEvolutionRuntime({profile});
  assert.equal(replayBenchmarkRegistrations(runtime,dir).registrations,2);
  const before=runtime.snapshot();
  assert.equal(before.length,8);
  replayBenchmarkRegistrations(runtime,dir);
  assert.deepEqual(runtime.snapshot(),before);
  assert.ok(before.some(r=>r.observation_kind==='counterevidence'));
  assert.ok(before.some(r=>r.disposition==='revise-hypothesis'));
});
