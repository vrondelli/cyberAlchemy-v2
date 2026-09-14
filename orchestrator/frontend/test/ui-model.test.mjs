import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildOrchestratorOntology, graphScene, parseRoute, recoveryInstruction, runCounts, runExplanation } from "../ui-model.js";

test("routes keep all general orchestrator surfaces addressable", () => {
  assert.deepEqual(parseRoute("/runs"), { view: "runs" });
  assert.deepEqual(parseRoute("/runs/run-a"), { view: "run", runId: "run-a" });
  assert.deepEqual(parseRoute("/runs/new"), { view: "new" });
  assert.deepEqual(parseRoute("/adapters"), { view: "adapters" });
  assert.deepEqual(parseRoute("/lab"), { view: "lab" });
  assert.deepEqual(parseRoute("/ontology"), { view: "ontology" });
  assert.deepEqual(parseRoute("/operations"), { view: "operations" });
});

test("DAG layout preserves declared dependencies", () => {
  const scene = graphScene({ nodes: {
    inspect: { node_id: "inspect", role_id: "analyst", contract: "inspect", depends_on: [] },
    decide: { node_id: "decide", role_id: "reviewer", contract: "decide", depends_on: ["inspect"] },
  }});
  assert.equal(scene.nodes.length, 2);
  assert.equal(scene.edges.length, 1);
  assert.ok(scene.nodes.find((node) => node.node_id === "inspect").x < scene.nodes.find((node) => node.node_id === "decide").x);
});

test("ontology is derived from generic orchestration records", () => {
  const run = { run_id: "run-a", phase: "active", revision: 0, bundle: { admission_context: { strategy_id: "review", strategy_version: "v1", selected_adapter_refs: ["gateway/v1"] }, graph: { nodes: { inspect: { node_id: "inspect", role_id: "analyst", contract: "inspect", depends_on: [] } } } }, history: { cursor: { node_status: { inspect: "issued" } } } };
  const ontology = buildOrchestratorOntology({ runs: [run] }, { templates: [] }, { run_templates: [] }, { adapters: [] });
  assert.ok(ontology.nodes.some((node) => node.id === "run:run-a"));
  assert.ok(ontology.nodes.some((node) => node.id === "role:analyst"));
  assert.ok(ontology.relations.some((relation) => relation.type === "requires"));
  assert.ok(ontology.relations.some((relation) => relation.type === "uses"));
});

test("run explanation separates state, cause, next action, and authority", () => {
  const explanation = runExplanation({ phase: "completed" });
  assert.match(explanation.state, /complete/i);
  assert.match(explanation.why, /accepted-history/i);
  assert.match(explanation.next, /Inspect/i);
  assert.match(explanation.authority, /does not accept results/i);
});

test("recovery language does not turn uncertainty into retry permission", () => {
  assert.match(recoveryInstruction({ action: "reconcile" }), /before retrying/i);
  assert.match(recoveryInstruction({ action: "blocked_unknown_effect" }), /owner must resolve/i);
  assert.doesNotMatch(recoveryInstruction({ action: "blocked_unknown_effect" }), /retry now/i);
});

test("node totals are derived from accepted cursor state", () => {
  assert.deepEqual(
    runCounts({ history: { cursor: { node_status: { a: "succeeded", b: "issued", c: "pending" } } } }),
    { pending: 2, running: 0, succeeded: 1, failed: 0 },
  );
});

test("run pages expose landmarks, explanation, recovery, and native disclosure", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.match(html, /<main id="main"/);
  assert.match(html, /aria-label="Primary"/);
  assert.match(app, /What is happening/);
  assert.match(app, /What happens next/);
  assert.match(app, /Operator attention/);
  assert.match(app, /<details class="policy">/);
  assert.match(app, /Quick dispatches/);
  assert.match(app, /compose-run-template-dispatch/);
  assert.match(html, />Lab</);
  assert.match(html, />Ontology</);
  assert.match(html, />Operations</);
  assert.match(app, /Accepted work graph/);
  assert.match(app, /Runtime relationship projection/);
  assert.match(app, /System observability/);
  assert.match(app, /Run details/);
  assert.match(app, /Accepted outputs/);
  assert.match(app, /Event trace/);
  assert.match(app, /Workers and commands/);
  assert.match(app, /Durable leases/);
  assert.match(app, /Worker receipts/);
  assert.match(app, /Durable envelope/);
  assert.match(app, /run_template=/);
});
