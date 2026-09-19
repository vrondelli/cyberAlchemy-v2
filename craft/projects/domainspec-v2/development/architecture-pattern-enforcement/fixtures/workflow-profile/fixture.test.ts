import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { observeWorkflowChildren, type WorkflowChildObserverInput } from "../../adapters/typescript/workflow-child-observer.ts";
import { observeWorkflowCompensation, type WorkflowCompensationObserverInput } from "../../adapters/typescript/workflow-compensation-observer.ts";
import { observeWorkflowContinuation, type WorkflowContinuationObserverInput } from "../../adapters/typescript/workflow-continuation-observer.ts";
import { observeWorkflowMessageBoundary, type WorkflowMessageObserverInput } from "../../adapters/typescript/workflow-message-observer.ts";
import { discriminateWorkflowMode, type WorkflowModeDiscriminatorInput } from "../../adapters/typescript/workflow-mode-discriminator.ts";
import { observeWorkflowRuntime, type WorkflowRuntimeObserverInput } from "../../adapters/typescript/workflow-runtime-observer.ts";
import { observeWorkflowVersion, type WorkflowVersionObserverInput } from "../../adapters/typescript/workflow-version-observer.ts";
import { validateWorkflowPredecessor, type WorkflowPredecessorInput } from "../../validators/rmt-workflow-predecessor.ts";

const REPO_ROOT = resolve(process.cwd(), "../../..");
const FIXTURE_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/workflow-profile/workflow.fixture.json";
const HOSTILES_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/workflow-profile/hostiles.json";
const PROFILE_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-workflow-application-profile.json";
const PROFILE_SCHEMA_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-workflow-application-profile.schema.json";

type Json = Record<string, any>;
const fixture = JSON.parse(readFileSync(resolve(REPO_ROOT, FIXTURE_REF), "utf8")) as Json;
const hostiles = JSON.parse(readFileSync(resolve(REPO_ROOT, HOSTILES_REF), "utf8")) as Json;

function observerInputs() {
  const values = structuredClone(fixture.observer_inputs) as Json;
  for (const key of ["child", "continuation", "compensation", "runtime", "version", "message"]) {
    values[key].repo_root = REPO_ROOT;
  }
  values.runtime.mode_input = structuredClone(values.mode);
  delete values.runtime.mode_input_ref;
  values.version.mode_input = structuredClone(values.mode);
  delete values.version.mode_input_ref;
  return values;
}

test("the Workflow profile validates and freezes the exact nine-property denominator", () => {
  const script = [
    "import json, sys",
    "from jsonschema import Draft202012Validator",
    "schema=json.load(open(sys.argv[1], encoding='utf-8'))",
    "instance=json.load(open(sys.argv[2], encoding='utf-8'))",
    "Draft202012Validator.check_schema(schema)",
    "errors=sorted(Draft202012Validator(schema).iter_errors(instance), key=lambda e:list(e.path))",
    "assert not errors, '\\n'.join(e.message for e in errors)",
  ].join("\n");
  const checked = spawnSync(
    "python3",
    ["-c", script, resolve(REPO_ROOT, PROFILE_SCHEMA_REF), resolve(REPO_ROOT, PROFILE_REF)],
    { encoding: "utf8" },
  );
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
  assert.equal(fixture.selected_applicability.applicability_results.length, 9);
  assert.deepEqual(fixture.selected_applicability.unaccounted_property_ids, []);
  assert.equal(
    fixture.selected_applicability.applicable_property_ids.length +
      fixture.selected_applicability.non_applicable_property_ids.length +
      fixture.selected_applicability.owner_blocked_applicability_ids.length,
    9,
  );
});

test("the exact live Workflow predecessor and all observer expectations recompute", () => {
  const predecessor = validateWorkflowPredecessor(
    fixture.predecessor_input as WorkflowPredecessorInput,
    { repoRoot: REPO_ROOT },
  );
  assert.equal(predecessor.result, "pass");

  const values = observerInputs();
  const results = {
    child: observeWorkflowChildren(values.child as WorkflowChildObserverInput),
    continuation: observeWorkflowContinuation(values.continuation as WorkflowContinuationObserverInput),
    compensation: observeWorkflowCompensation(values.compensation as WorkflowCompensationObserverInput),
    mode: discriminateWorkflowMode(values.mode as WorkflowModeDiscriminatorInput),
    runtime: observeWorkflowRuntime(values.runtime as WorkflowRuntimeObserverInput),
    version: observeWorkflowVersion(values.version as WorkflowVersionObserverInput),
    message: observeWorkflowMessageBoundary(values.message as WorkflowMessageObserverInput),
  };
  assert.deepEqual(
    {
      child: [results.child.result, results.child.diagnostic],
      continuation: [results.continuation.result, results.continuation.diagnostic],
      compensation: [results.compensation.result, results.compensation.diagnostic],
      mode: [results.mode.result, results.mode.diagnostic],
      runtime: [results.runtime.result, results.runtime.diagnostic],
      version: [results.version.result, results.version.diagnostic],
      message: [results.message.result, results.message.diagnostic],
    },
    {
      child: ["pass", "AOP_WF_CHILD_PASS"],
      continuation: ["pass", "AOP_WF_CONTINUATION_PASS"],
      compensation: ["pass", "AOP_WF_COMPENSATION_PASS"],
      mode: ["pass", "AOP_WF_MODE_PASS"],
      runtime: ["not-applicable", "AOP_WF_RUNTIME_NOT_APPLICABLE"],
      version: ["not-applicable", "AOP_WF_VERSION_NOT_APPLICABLE"],
      message: ["not-applicable", "AOP_WF_MESSAGE_NOT_APPLICABLE"],
    },
  );
});

test("fixture expectations bind the named compensation callable without execution authority", () => {
  const expected = fixture.expected_property_results as Array<Json>;
  assert.equal(expected.length, 9);
  assert.deepEqual(
    expected.find((row) => row.property_id === "APE.WF.P09-TRAVERSAL-EQUIVALENCE"),
    {
      property_id: "APE.WF.P09-TRAVERSAL-EQUIVALENCE",
      result: "pass",
      diagnostic: "AOP_WF_COMPENSATION_PASS",
      producer: "workflow-compensation-observer",
    },
  );
  assert.equal(fixture.claim_ceiling.named_compensation_callable_bound_at_composition_root, true);
  assert.equal(fixture.claim_ceiling.compensation_execution, false);
  assert.equal(fixture.authority_effect, "none");
});

test("hostile catalogue has stable one-cause architecture cases and no copied RMT semantic hostiles", () => {
  const cases = hostiles.cases as Array<Json>;
  assert.equal(cases.length, 12);
  assert.equal(new Set(cases.map((entry) => entry.hostile_id)).size, cases.length);
  assert.equal(new Set(cases.map((entry) => entry.primary_cause)).size, cases.length);
  assert.ok(cases.every((entry) => typeof entry.expected_diagnostic === "string"));
  assert.equal(hostiles.one_primary_cause_per_hostile, true);
  assert.equal(hostiles.rmt_semantic_hostiles_copied, false);
  assert.equal(hostiles.authority_effect, "none");
});
