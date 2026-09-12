import assert from "node:assert/strict";
import test from "node:test";
import {createHash} from "node:crypto";
import {verifyResearchContinuity} from "../index.mjs";

const digest = "a".repeat(64), ref = path => ({path, sha256: digest});
const policy = {schema_version:"are.research-continuity-policy/v1",policy_ref:"policy.json",objective_levels:{enduring:{refs:[ref("lighthouse.md")]},initial:{refs:[ref("glm.md")]},milestone:{refs:[ref("acceptance.json")]}},method_refs:[ref("method.json")],required_method_definitions:["D01","D08"],required_hypothesis_scope_terms:["GLM","8K"],required_measurement_fields:["native","retention","integrity","tokens","transfer"],acceptance_ref:ref("acceptance.json"),scope_invariants:{SWE_bench_in_active_scope:false},required_review_criteria:["enduring_objective","initial_GLM_objective","method_and_predecessor"]};
const hypothesis = id => ({record_id:id,statement:"s",mechanism:"m",falsifier:"f",scope:"GLM 8K",metrics:["x"],provenance_refs:["round.json"],experiment_template:{question:"q"}});
const hypotheses = {records:[hypothesis("h1"),hypothesis("h0")],selection:{selected:"h1",alternatives:["h0"]}};
const binding = {schema_version:"are.research-continuity-binding/v1",binding_ref:"round.json",policy_ref:"policy.json",policy_sha256:digest,authority_effect:"none",objective_refs:[ref("lighthouse.md"),ref("glm.md"),ref("acceptance.json")],objective_contribution:"Close the measured GLM gap.",method_refs:[ref("method.json")],method_definitions:["D01","D08"],predecessor_refs:[ref("decision.json")],question_and_hypotheses:{question:"q",records_ref:"hypotheses.json",selected:"h1",alternatives:["h0"]},experiment_and_task_refs:{plan_ref:"PLAN.md",tasks:["P","R"]},measurement_mapping:{native:"native",retention:"retention",integrity:"integrity",tokens:"model input and output",transfer:"transfer"},acceptance_and_scope:{acceptance:ref("acceptance.json"),SWE_bench_in_active_scope:false,window_order:"GLM small-window first"},retained_counterevidence:["failure"],successor_rule:"review then revise",continuity_review:{reviewed_artifacts:[ref("PLAN.md"),ref("hypotheses.json")],criterion_verdicts:{enduring_objective:"preserved",initial_GLM_objective:"preserved",method_and_predecessor:"bound"},passed_for_candidate_plan:true,run_ready:true}};
const read_bytes = () => Buffer.from("irrelevant");

test("reports all continuity defects instead of stopping on the first", () => {
  const broken=structuredClone(binding), hs=structuredClone(hypotheses); broken.objective_refs=[]; broken.method_definitions=[]; broken.acceptance_and_scope.SWE_bench_in_active_scope=true; broken.continuity_review.run_ready=false; broken.experiment_and_task_refs.unresolved="matrix"; broken.retained_counterevidence=[]; hs.records[0].provenance_refs=[];
  const result=verifyResearchContinuity({binding:broken,policy,hypotheses:hs,phase:"freeze",read_bytes});
  assert.equal(result.ok,false); assert.ok(result.reason_codes.length>=8); assert.ok(result.reason_codes.some(x=>x.includes("objective_refs"))); assert.ok(result.reason_codes.includes("continuity.run-not-ready"));
});

test("accepts a fully bound plan and competing hypothesis set", () => {
  const bytes=Buffer.from("same"), actual=createHash("sha256").update(bytes).digest("hex");
  const p=structuredClone(policy), b=structuredClone(binding), hs=structuredClone(hypotheses);
  p.objective_levels={enduring:{refs:[ref("lighthouse.md")]},initial:{refs:[ref("glm.md")]},milestone:{refs:[ref("acceptance.json")]}};
  for(const group of Object.values(p.objective_levels))for(const x of group.refs)x.sha256=actual; p.method_refs=[{path:"method.json",sha256:actual}]; p.acceptance_ref={path:"acceptance.json",sha256:actual};
  b.policy_sha256=actual; b.objective_refs=["lighthouse.md","glm.md","acceptance.json"].map(path=>({path,sha256:actual})); b.method_refs=[{path:"method.json",sha256:actual}]; b.predecessor_refs=[{path:"decision.json",sha256:actual}]; b.acceptance_and_scope.acceptance={path:"acceptance.json",sha256:actual}; b.continuity_review.reviewed_artifacts=["PLAN.md","hypotheses.json"].map(path=>({path,sha256:actual}));
  assert.deepEqual(verifyResearchContinuity({binding:b,policy:p,hypotheses:hs,phase:"freeze",read_bytes:()=>bytes}).reason_codes,[]);
});

test("requires the objective hierarchy and research method in reviewed plans when policy declares markers", () => {
  const p=structuredClone(policy), b=structuredClone(binding), hs=structuredClone(hypotheses);
  p.required_plan_markers=["Enduring objective", "Initial GLM objective", "objective → gap → question"];
  const contents=new Map([
    ["PLAN.md",Buffer.from("Enduring objective\nInitial GLM objective\n")],
    ["hypotheses.json",Buffer.from("hypotheses")],
    ["policy.json",Buffer.from("policy")],
    ["lighthouse.md",Buffer.from("lighthouse")],
    ["glm.md",Buffer.from("glm")],
    ["acceptance.json",Buffer.from("acceptance")],
    ["method.json",Buffer.from("method")],
    ["decision.json",Buffer.from("decision")],
  ]);
  const read=path=>contents.get(path.split('/').at(-1));
  const hash=path=>createHash("sha256").update(read(path)).digest("hex");
  p.policy_ref="policy.json";
  for(const level of Object.values(p.objective_levels))for(const item of level.refs)item.sha256=hash(item.path);
  p.method_refs.forEach(item=>item.sha256=hash(item.path));p.acceptance_ref.sha256=hash("acceptance.json");
  b.policy_sha256=hash("policy.json");
  for(const item of b.objective_refs)item.sha256=hash(item.path);
  for(const item of b.method_refs)item.sha256=hash(item.path);
  for(const item of b.predecessor_refs)item.sha256=hash(item.path);
  b.acceptance_and_scope.acceptance.sha256=hash("acceptance.json");
  for(const item of b.continuity_review.reviewed_artifacts)item.sha256=hash(item.path);
  const result=verifyResearchContinuity({binding:b,policy:p,hypotheses:hs,phase:"final",root:".",read_bytes:read});
  assert.equal(result.ok,false);
  assert.ok(result.reason_codes.includes("continuity.plan-marker-missing:objective → gap → question"));
});
