import {writeFileSync, readFileSync, copyFileSync, mkdirSync} from "node:fs";
import {join, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {loadDshHostPlanSelection} from "../../src/web-host-plan-selection.mjs";

export const panelNames = ["Overview", "Adapters", "Threads", "Decisions", "Evolution",
  "Evidence/Diagnostics", "Appearance"];
export function hostPlanFixture(workspace) {
  const parent = "Fixture parent plan. All seven panels remain in scope; adapters is the active slice.\n";
  const hash = createHash("sha256").update(parent).digest("hex");
  writeFileSync(join(workspace, "parent-plan.md"), parent);
  const selection = {schema_version: "are.dsh-host-plan-selection/v1",
    parent_plan_ref: "parent-plan.md", parent_plan_digest: hash, active_slice_id: "panel-1",
    source_refs: [{source_ref: "parent-plan.md", source_digest: hash}],
    feature_obligations: panelNames.map((summary, index) => ({obligation_id: `panel-${index}`,
      summary, status: index === 1 ? "active" : "open"})),
    unresolved_decisions: [{decision_id: "resource-budget", question: "What is the accepted memory budget?"}]};
  const path = join(workspace, "plan-selection.json");
  writeFileSync(path, JSON.stringify(selection));
  return {selection, path, descriptor: loadDshHostPlanSelection({workspace, selection_path: path}).descriptor};
}

/** Copy the exact opt-in candidate and its declared source bytes into a
 * disposable native Host workspace. Never select it in a live profile. */
export function fullHostPlanFixture(workspace) {
  const root = fileURLToPath(new URL("../../../../../../", import.meta.url));
  const path = fileURLToPath(new URL("../../config/are-integration-plan-selection.candidate.json", import.meta.url));
  loadDshHostPlanSelection({workspace: root, selection_path: path});
  const selection = JSON.parse(readFileSync(path, "utf8"));
  for (const source of selection.source_refs) {
    const target = join(workspace, source.source_ref);
    mkdirSync(dirname(target), {recursive: true});
    copyFileSync(join(root, source.source_ref), target);
  }
  const selected = join(workspace, "full-plan-selection.json");
  writeFileSync(selected, JSON.stringify(selection));
  return {selection, path: selected,
    descriptor: loadDshHostPlanSelection({workspace, selection_path: selected}).descriptor};
}

/** Explicit test-only startup transition; never modifies a live Host profile. */
export function advanceHostPlanFixture(workspace, fixture, previous, changes = {}) {
  const selection = {...fixture.selection, ...changes,
    schema_version: "are.dsh-host-plan-selection/v2",
    plan_transition: {kind: "advance", predecessors: [{thread_ref: previous.thread_ref,
      plan_context_digest: previous.plan_context_digest}]}};
  writeFileSync(fixture.path, JSON.stringify(selection));
  return {...fixture, selection,
    descriptor: loadDshHostPlanSelection({workspace, selection_path: fixture.path}).descriptor};
}

/** Test-only explicit accounting over actual retained snapshots. */
export function replaceHostPlanFixture(workspace, fixture, previous, continuity, changes = {}) {
  const selection = {...fixture.selection, ...changes, schema_version: 'are.dsh-host-plan-selection/v3'};
  const oldPlan = new Set(previous.feature_obligations.map(row => row.summary));
  const nextPlan = new Set(selection.feature_obligations.map(row => row.summary));
  selection.plan_transition = {kind: 'replace', predecessors: [{thread_ref: previous.thread_ref,
    plan_context_digest: previous.plan_context_digest, continuity_digest: continuity.continuity_digest,
    accounting: continuity.snapshots.map(snapshot => ({objective_id: snapshot.objective_id,
      snapshot_digest: snapshot.snapshot_digest,
      retained_indices: snapshot.requirements.flatMap((value, index) => !oldPlan.has(value) || nextPlan.has(value) ? [index] : []),
      removed_indices: snapshot.requirements.flatMap((value, index) => oldPlan.has(value) && !nextPlan.has(value) ? [index] : []),
      added_obligation_ids: selection.feature_obligations.filter(row => !snapshot.requirements.includes(row.summary)).map(row => row.obligation_id),
      added_requirements: []}))}]};
  writeFileSync(fixture.path, JSON.stringify(selection));
  return {...fixture, selection,
    descriptor: loadDshHostPlanSelection({workspace, selection_path: fixture.path}).descriptor};
}
