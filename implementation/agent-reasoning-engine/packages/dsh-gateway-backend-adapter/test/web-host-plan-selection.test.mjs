import assert from "node:assert/strict";
import test from "node:test";
import {mkdtempSync, rmSync, writeFileSync, symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {loadDshHostPlanSelection} from "../src/web-host-plan-selection.mjs";
import {hostPlanFixture, panelNames} from "./fixtures/host-plan-selection.mjs";

function fixture(context) {
  const home = mkdtempSync(join(tmpdir(), "are-host-plan-select-"));
  context.after(() => rmSync(home, {recursive: true, force: true}));
  return {home, ...hostPlanFixture(home)};
}
test("explicit Host selection verifies source bytes and retains all obligations and questions", context => {
  const h = fixture(context), value = loadDshHostPlanSelection(h.descriptor);
  assert.deepEqual(value.requirement_seed.requirements, panelNames);
  assert.equal(value.template.active_slice_id, "panel-1");
  assert.deepEqual(value.template.unresolved_decisions, h.selection.unresolved_decisions);
  assert.equal(Object.isFrozen(value.template.feature_obligations), true);
  assert.equal(value.requirement_seed.source_ref, `host-plan-selection:${value.selection_digest}`);
});
test("source drift and changed selection bytes fail without refreshing any digest", context => {
  const h = fixture(context);
  writeFileSync(join(h.home, "parent-plan.md"), "changed parent");
  assert.throws(() => loadDshHostPlanSelection(h.descriptor), /selection-invalid-or-drifted/);
  const fresh = hostPlanFixture(h.home);
  writeFileSync(fresh.path, JSON.stringify({...fresh.selection, active_slice_id: "panel-2"}));
  assert.throws(() => loadDshHostPlanSelection(fresh.descriptor), /selection-invalid-or-drifted/);
});
test("selection is closed, bounded and cannot inject identity, a missing source or a completed active slice", context => {
  const h = fixture(context);
  for (const change of [
    {thread_ref: "browser-thread"}, {requirements: []}, {source_refs: []},
    {active_slice_id: "absent"}, {feature_obligations: h.selection.feature_obligations.map(x => ({...x, status: "completed"}))},
    {parent_plan_digest: "0".repeat(64)},
    {feature_obligations: h.selection.feature_obligations.map(x => ({...x, summary: "duplicate"}))},
  ]) {
    writeFileSync(h.path, JSON.stringify({...h.selection, ...change}));
    assert.throws(() => loadDshHostPlanSelection({workspace: h.home, selection_path: h.path}), /selection-invalid-or-drifted/);
  }
  writeFileSync(h.path, " ".repeat(16385));
  assert.throws(() => loadDshHostPlanSelection({workspace: h.home, selection_path: h.path}), /selection-invalid-or-drifted/);
});
test("no traversal, absolute source, symlink or nonregular selection is accepted", context => {
  const h = fixture(context);
  for (const ref of ["../parent-plan.md", "/etc/passwd", "./parent-plan.md", "folder/../parent-plan.md", "folder\\parent-plan.md"]) {
    writeFileSync(h.path, JSON.stringify({...h.selection, source_refs: [{source_ref: ref, source_digest: h.selection.parent_plan_digest}]}));
    assert.throws(() => loadDshHostPlanSelection({workspace: h.home, selection_path: h.path}), /selection-invalid-or-drifted/);
  }
  hostPlanFixture(h.home);
  symlinkSync(join(h.home, "parent-plan.md"), join(h.home, "linked.md"));
  writeFileSync(h.path, JSON.stringify({...h.selection, parent_plan_ref: "linked.md",
    source_refs: [{source_ref: "linked.md", source_digest: h.selection.parent_plan_digest}]}));
  assert.throws(() => loadDshHostPlanSelection({workspace: h.home, selection_path: h.path}), /selection-invalid-or-drifted/);
  symlinkSync(h.path, join(h.home, "linked-selection.json"));
  assert.throws(() => loadDshHostPlanSelection({workspace: h.home, selection_path: join(h.home, "linked-selection.json")}), /selection-invalid-or-drifted/);
  assert.throws(() => loadDshHostPlanSelection({workspace: h.home, selection_path: h.home}), /selection-invalid-or-drifted/);
});

test("advancing selection is closed and binds distinct bounded backend-thread predecessors", context => {
  const h = fixture(context);
  const transition = {kind: "advance", predecessors: [{thread_ref: `backend-thread:${"a".repeat(64)}`,
    plan_context_digest: "b".repeat(64)}]};
  const selection = {...h.selection, schema_version: "are.dsh-host-plan-selection/v2", plan_transition: transition};
  writeFileSync(h.path, JSON.stringify(selection));
  const value = loadDshHostPlanSelection({workspace: h.home, selection_path: h.path});
  assert.deepEqual(value.transition, transition);
  assert.equal(Object.hasOwn(value.template, "plan_transition"), false);
  for (const plan_transition of [null, {...transition, kind: "replace"}, {...transition, browser: true},
    {...transition, predecessors: []}, {...transition, predecessors: [...transition.predecessors, ...transition.predecessors]},
    {...transition, predecessors: [{...transition.predecessors[0], plan_context_digest: null}]},
    {...transition, predecessors: [{...transition.predecessors[0], plan_context_digest: ["b".repeat(64)]}]},
    {...transition, predecessors: [{...transition.predecessors[0], thread_ref: [`backend-thread:${"a".repeat(64)}`]}]},
    {...transition, predecessors: [{...transition.predecessors[0], thread_ref: "browser-thread"}]}]) {
    writeFileSync(h.path, JSON.stringify({...selection, plan_transition}));
    assert.throws(() => loadDshHostPlanSelection({workspace: h.home, selection_path: h.path}), /selection-invalid-or-drifted/);
  }
});

test('replacement selection binds compact accounting and refuses malformed private predecessors', context => {
  const h = fixture(context);
  const predecessor = {thread_ref: `backend-thread:${'a'.repeat(64)}`, plan_context_digest: 'b'.repeat(64),
    continuity_digest: 'c'.repeat(64), accounting: [{objective_id: 'fixture-objective', snapshot_digest: 'd'.repeat(64),
      retained_indices: [1, 0], removed_indices: [], added_obligation_ids: ['panel-2'], added_requirements: ['latency']}]};
  const selection = {...h.selection, schema_version: 'are.dsh-host-plan-selection/v3',
    plan_transition: {kind: 'replace', predecessors: [predecessor]}};
  writeFileSync(h.path, JSON.stringify(selection));
  const selected = loadDshHostPlanSelection({workspace: h.home, selection_path: h.path});
  assert.deepEqual(selected.transition.predecessors[0].accounting[0].retained_indices, [0, 1]);
  assert.equal(Object.hasOwn(selected.template, 'plan_transition'), false);
  for (const mutate of [value => {value.plan_transition.kind = 'advance';},
    value => {value.plan_transition.predecessors.push(value.plan_transition.predecessors[0]);},
    value => {value.plan_transition.predecessors[0].continuity_digest = ['c'.repeat(64)];},
    value => {delete value.plan_transition.predecessors[0].continuity_digest;},
    value => {value.plan_transition.predecessors[0].browser = true;},
    value => {value.plan_transition.predecessors[0].accounting = [];},
    value => {value.plan_transition.predecessors[0].accounting[0].retained_indices = [0, 0];},
    value => {value.plan_transition.predecessors[0].accounting[0].retained_indices = ['0'];},
    value => {value.plan_transition.predecessors[0].accounting[0].extra = true;},
    value => {value.plan_transition.predecessors[0].accounting[0] = {objective_id: 'fixture-objective',
      snapshot_digest: 'd'.repeat(64), retained: [], added: [], removed: []};}]) {
    const changed = structuredClone(selection); mutate(changed); writeFileSync(h.path, JSON.stringify(changed));
    assert.throws(() => loadDshHostPlanSelection({workspace: h.home, selection_path: h.path}), /selection-invalid-or-drifted/);
  }
});
