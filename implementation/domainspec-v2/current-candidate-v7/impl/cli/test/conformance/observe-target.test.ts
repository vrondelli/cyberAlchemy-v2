import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { ConformanceError, observeTarget, observeTargetReceipt } from "../../src/conformance/observe-target.ts";
import { planInstantiation } from "../../src/generation/plan-instantiation.ts";
import { publishInstantiation } from "../../src/generation/publish-instantiation.ts";
import { loadProjectNode } from "../../src/input/project-model.ts";
import { loadSystemIntegrationSelection, SystemIntegrationError } from "../../src/system-integration/compiler.ts";
import { testPlan } from "../helpers/plans.ts";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const sourceFixtureRoot = path.resolve(testDir, "../../fixtures/input-roots/canonical-project");

function targetFor(language: "typescript" | "python" | "rust" = "typescript", kind: "Operation" | "Workflow" = "Operation"): { parent: string; target: string; artifact: string } {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "mtcli-observe-"));
  const target = path.join(parent, "target");
  const result = publishInstantiation(testPlan(kind, language), target);
  return { parent, target, artifact: path.join(target, result.receipt.artifacts[0]!.relative_path) };
}

function clean(parent: string): void {
  assert.equal(parent.startsWith(path.join(os.tmpdir(), "mtcli-observe-")), true);
  fs.rmSync(parent, { recursive: true, force: true });
}

function integrationTarget(language: "typescript" | "python" | "rust"): { parent: string; target: string; integrationArtifact: string } {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "mtcli-observe-"));
  const target = path.join(parent, "target");
  const node = loadProjectNode(sourceFixtureRoot, "alpha:settle");
  const selection = loadSystemIntegrationSelection(sourceFixtureRoot, "settle-runtime", "provider-neutral-v1", "alpha:settle", language);
  const result = publishInstantiation(planInstantiation(node, language, selection), target);
  return { parent, target, integrationArtifact: path.join(target, result.receipt.system_integration!.generated_relative_path) };
}

function expectCode(target: string, code: string): void {
  assert.throws(() => observeTarget(target), (error) => error instanceof ConformanceError && error.code === code);
  const receipt = observeTargetReceipt(target);
  assert.equal(receipt.result, "fail");
  if (receipt.result === "fail") {
    assert.equal(receipt.schema_version, "domainspec.target-observation/v1");
    assert.equal(receipt.code, code);
    assert.equal(receipt.target_root, target);
    assert.equal(receipt.authority_effect, "none");
  }
}

test("all three Operation realizations pass independent post-write observation", () => {
  for (const language of ["typescript", "python", "rust"] as const) {
    const fixture = targetFor(language);
    try {
      const observation = observeTarget(fixture.target);
      assert.equal(observation.result, "pass");
      assert.equal(observation.observed_artifacts.length, 1);
    } finally {
      clean(fixture.parent);
    }
  }
});

test("all three Workflow realizations bind composition-root compensation as intent only", () => {
  for (const language of ["typescript", "python", "rust"] as const) {
    const fixture = targetFor(language, "Workflow");
    try {
      const observation = observeTarget(fixture.target);
      assert.equal(observation.result, "pass");
      assert.equal(observation.checks.includes("workflow-obligations-when-applicable"), true);
    } finally {
      clean(fixture.parent);
    }
  }
});

test("all three provider-neutral integration profiles pass exact post-write observation", () => {
  for (const language of ["typescript", "python", "rust"] as const) {
    const fixture = integrationTarget(language);
    try {
      const observation = observeTarget(fixture.target);
      assert.equal(observation.result, "pass");
      assert.equal(observation.observed_artifacts.length, 2);
      assert.equal(observation.checks.includes("system-integration-profile-when-selected"), true);
    } finally {
      clean(fixture.parent);
    }
  }
});

test("system-integration generated-contract drift fails causally", () => {
  const fixture = integrationTarget("typescript");
  try {
    const content = fs.readFileSync(fixture.integrationArtifact, "utf8");
    fs.writeFileSync(fixture.integrationArtifact, content.replace("provider-neutral-v1", "provider-neutral-v2"));
    assert.throws(() => observeTarget(fixture.target), (error) => error instanceof SystemIntegrationError && error.code === "SIC_GENERATED_PROFILE_DRIFT");
    const observation = observeTargetReceipt(fixture.target);
    assert.equal(observation.result, "fail");
    if (observation.result === "fail") assert.equal(observation.code, "SIC_GENERATED_PROFILE_DRIFT");
  } finally {
    clean(fixture.parent);
  }
});

test("causal mutants identify declared-set, guard, atomicity, continuation, and relationship drift", () => {
  const mutants: readonly [string, string, string][] = [
    ['// domainspec-operation-sets: {"effects":["AccountChanged"],"reads":["account"],"writes":["account.status"]}', '// domainspec-operation-sets: {"effects":[],"reads":["account"],"writes":["account.status"]}', "MTCLI_OPERATION_DECLARED_SETS"],
    ["if (!guard())", "if (guard())", "MTCLI_OPERATION_GUARD_ORDER"],
    ["const outbox", "const deferredOutbox", "MTCLI_OPERATION_ATOMICITY"],
    ["Contract.reads.map", "Contract.writes.map", "MTCLI_OPERATION_UNDECLARED_READ"],
    ["Contract.writes.reduce", "Contract.reads.reduce", "MTCLI_OPERATION_UNDECLARED_WRITE"],
    ["Contract.effects.map", 'Contract.effects.concat(["UndeclaredEffect"]).map', "MTCLI_OPERATION_UNDECLARED_EFFECT"],
    ['// domainspec-failure-continuation: "return-account-error"', '// domainspec-failure-continuation: "retry"', "MTCLI_OPERATION_CONTINUATION"],
    ['// domainspec-operation-instrumentation-owner: "outer-wrapper"', '// domainspec-operation-instrumentation-owner: "core"', "MTCLI_OPERATION_INSTRUMENTATION_BOUNDARY"],
    ['// domainspec-relationships: [{"edge_id":"operation-produces-event"', '// domainspec-relationships: [{"edge_id":"changed-edge"', "MTCLI_OBSERVE_RELATIONSHIPS"],
  ];
  for (const [before, after, code] of mutants) {
    const fixture = targetFor();
    try {
      const content = fs.readFileSync(fixture.artifact, "utf8");
      assert.equal(content.includes(before), true, `test fixture contains ${before}`);
      fs.writeFileSync(fixture.artifact, content.replace(before, after));
      expectCode(fixture.target, code);
    } finally {
      clean(fixture.parent);
    }
  }
});

test("Workflow compensation execution drift has a causal failure", () => {
  const fixture = targetFor("typescript", "Workflow");
  try {
    const content = fs.readFileSync(fixture.artifact, "utf8");
    const before = "void compensate;";
    assert.equal(content.includes(before), true);
    fs.writeFileSync(
      fixture.artifact,
      content.replace(before, `${before}\n  await compensate(recoveryIntent ?? "");`),
    );
    expectCode(fixture.target, "MTCLI_WORKFLOW_COMPENSATION_EXECUTION");
  } finally {
    clean(fixture.parent);
  }
});

test("Workflow compensation contract, state, order, executor, and Operation role drift fail causally", () => {
  const mutants: readonly [string, string, string][] = [
    ['// domainspec-compensation-contract: "forward-recovery-operation/v2"', '// domainspec-compensation-contract: "rollback/v1"', "MTCLI_WORKFLOW_COMPENSATION_CONTRACT"],
    ['// domainspec-recovery-intent-statuses: ["required","satisfied","unresolved"]', '// domainspec-recovery-intent-statuses: ["required","satisfied"]', "MTCLI_WORKFLOW_COMPENSATION_STATE"],
    ['// domainspec-compensation-order: "explicit-dependency-graph-with-reverse-completion-default"', '// domainspec-compensation-order: "forward-step-order"', "MTCLI_WORKFLOW_COMPENSATION_ORDER"],
    ['// domainspec-compensation-executor-owner: "external-runtime"', '// domainspec-compensation-executor-owner: "workflow"', "MTCLI_WORKFLOW_COMPENSATION_EXECUTOR"],
    ['// domainspec-compensation-operation-role: "Operation"', '// domainspec-compensation-operation-role: "callback"', "MTCLI_WORKFLOW_COMPENSATION_RELATIONSHIP"],
  ];
  for (const [before, after, code] of mutants) {
    const fixture = targetFor("typescript", "Workflow");
    try {
      const content = fs.readFileSync(fixture.artifact, "utf8");
      assert.equal(content.includes(before), true, `test fixture contains ${before}`);
      fs.writeFileSync(fixture.artifact, content.replace(before, after));
      expectCode(fixture.target, code);
    } finally {
      clean(fixture.parent);
    }
  }
});

test("undeclared effects and generic byte drift fail closed", () => {
  const undeclared = targetFor();
  const drift = targetFor();
  try {
    fs.writeFileSync(path.join(undeclared.target, "undeclared-effect.txt"), "effect");
    expectCode(undeclared.target, "MTCLI_OBSERVE_UNDECLARED_OUTPUT");
    fs.appendFileSync(drift.artifact, "// byte drift\n");
    expectCode(drift.target, "MTCLI_OBSERVE_EXACT_REALIZATION");
  } finally {
    clean(undeclared.parent);
    clean(drift.parent);
  }
});
