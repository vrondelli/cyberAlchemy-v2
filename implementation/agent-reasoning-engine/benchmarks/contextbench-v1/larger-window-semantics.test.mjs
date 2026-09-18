import assert from "node:assert/strict";
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {createStatelessRecyclingTransport, openContextRecycling} from "../../packages/coding-agent-runtime/context-recycling.mjs";

const policies = Object.freeze([
  {window: 10000, recycle_at: 9000, safety_margin: 1000},
  {window: 12000, recycle_at: 11000, safety_margin: 1000},
]);

test("10K and 12K preserve the confirmed absolute safety margin and dispatch semantics", async (context) => {
  const bindings = [];
  for (const policy of policies) {
    const root = mkdtempSync(resolve(tmpdir(), `are-contextbench-${policy.window}-`));
    context.after(() => rmSync(root, {recursive: true, force: true}));
    const fixture = resolve(root, "fixture");
    mkdirSync(fixture);
    writeFileSync(resolve(fixture, "source.txt"), "source\n");
    const transport = createStatelessRecyclingTransport({
      adapter_id: `larger-window-${policy.window}`,
      source_ref: "larger-window-semantics.test.mjs",
      maximum_output_tokens: 2048,
      measure_request: () => policy.recycle_at - 2049,
      request_once: async () => ({final_bytes: '{"message":{"role":"assistant","content":"held"}}'}),
    });
    const recycler = openContextRecycling({
      options: {
        directory: resolve(root, "state"),
        context_limit: policy.window,
        recycle_at: policy.recycle_at,
        safety_margin: policy.safety_margin,
        state: {objective: "larger-window probe", constraints: [], completed: [], pending: [], facts: [], lessons: [], evidence_refs: ["fixture"]},
      },
      transport,
      scope: {request: "larger-window probe"},
      fixture_root: fixture,
    });
    await recycler.generate({history: [], render: async () => "probe", run_id: `probe:${policy.window}`});
    const snapshot = recycler.snapshot();
    assert.equal(snapshot.dispatches.length, 1);
    assert.equal(snapshot.dispatches[0].projected_upper_bound, policy.recycle_at - 1);
    assert.equal(snapshot.dispatches[0].projected_upper_bound < policy.recycle_at, true);
    bindings.push(snapshot.dispatches[0].binding);
    recycler.completeStep([], true);
    recycler.close();
  }
  assert.notEqual(bindings[0], bindings[1]);
});

test("larger-window policies fail closed if the absolute safety margin is not represented by the recycle threshold", (context) => {
  for (const policy of policies) assert.equal(policy.window - policy.recycle_at, policy.safety_margin);
  const root = mkdtempSync(resolve(tmpdir(), "are-contextbench-invalid-window-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const fixture = resolve(root, "fixture");
  mkdirSync(fixture);
  writeFileSync(resolve(fixture, "source.txt"), "source\n");
  const transport = createStatelessRecyclingTransport({adapter_id: "invalid-window", source_ref: "larger-window-semantics.test.mjs", maximum_output_tokens: 2048, measure_request: () => 1, request_once: async () => ({final_bytes: "unused"})});
  assert.throws(() => openContextRecycling({
    options: {directory: resolve(root, "state"), context_limit: 10000, recycle_at: 9501, safety_margin: 1000, state: {objective: "x", constraints: [], completed: [], pending: [], facts: [], lessons: [], evidence_refs: ["x"]}},
    transport, scope: {request: "x"}, fixture_root: fixture,
  }), /invalid-budget-policy/);
});
