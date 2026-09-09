import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { BODY_CONTRACTS, decodeBody, type DecodedProjectNode } from "../../src/input/project-model.ts";
import { canonicalJson, sha256, type SourceManifestV1 } from "../../src/input/source-manifest.ts";
import { FROZEN_META_TYPE_CATALOG } from "../../src/meta-types/catalog.ts";
import { GENERATOR_REGISTRY, generatorIdFor } from "../../src/generation/generators.ts";
import { planInstantiation } from "../../src/generation/plan-instantiation.ts";

const testDir = path.dirname(fileURLToPath(import.meta.url));

const sourceManifest = Object.freeze({
  schema_version: "domainspec.stable-foundation-cli.source-manifest/v1",
  project_id: "test-project",
  source_count: 1,
  total_size_bytes: 1,
  sources: [],
  aggregate_sha256: "0".repeat(64),
  authority_effect: "none",
  manifest_sha256: "1".repeat(64),
}) as unknown as SourceManifestV1;

const bodySamples: Readonly<Record<string, Record<string, unknown>>> = {
  Entity: { description: "Entity", fields: ["value"] },
  "Value Object": { description: "Value", fields: ["value"] },
  Enum: { description: "Enum", values: ["one", "two"] },
  Operation: { description: "Operation", reads: ["entity"], writes: ["entity.state"], effects: ["Changed"], guard: "allowed", failure_continuation: "return-error" },
  Query: { description: "Query", reads: ["entity"] },
  Calculation: { description: "Calculation", inputs: ["left", "right"] },
  Rule: { description: "Rule", predicate: "candidate != null" },
  Policy: { description: "Policy", strategies: ["first"] },
  Workflow: { description: "Workflow", steps: ["operate"], compensations: ["undo"] },
  Interface: { description: "Interface", version: "v1", operations: ["operate"] },
  Event: { description: "Event", fields: ["entity_id"] },
  Mapping: { description: "Mapping", source: "Source", target: "Target" },
  "State Machine": { description: "Machine", states: ["new", "done"], initial: "new", transitions: ["new->done"] },
};

function node(kind: string, id: string): DecodedProjectNode {
  const type = FROZEN_META_TYPE_CATALOG.backend_meta_types.find(({ label }) => label === kind)!;
  const relationships = kind === "Workflow" ? Object.freeze([
    Object.freeze({
      edge_id: "workflow-operate",
      relationship: "orchestrates",
      scope: "feature" as const,
      source: Object.freeze({ feature_id: "feature", node_id: id, kind: "Workflow" }),
      target: Object.freeze({ feature_id: "feature", node_id: "operate", kind: "Operation" }),
    }),
    Object.freeze({
      edge_id: "workflow-undo",
      relationship: "orchestrates",
      scope: "feature" as const,
      source: Object.freeze({ feature_id: "feature", node_id: id, kind: "Workflow" }),
      target: Object.freeze({ feature_id: "feature", node_id: "undo", kind: "Operation" }),
    }),
  ]) : Object.freeze([]);
  return Object.freeze({
    project_root: path.resolve("/tmp/test-project"),
    project_id: "test-project",
    feature_id: "feature",
    node_id: id,
    kind,
    meta_type_id: type.id,
    body: decodeBody(kind, bodySamples[kind]),
    relationships,
    source_manifest: sourceManifest,
  });
}

test("TypeScript Entity planning is pure and deterministic", () => {
  const input = node("Entity", "customer");
  const left = planInstantiation(input, "typescript");
  const right = planInstantiation(input, "typescript");
  assert.deepEqual(left, right);
  assert.equal(left.artifacts[0]?.relative_path, "src/domainspec/typescript/feature/customer.ts");
  assert.equal(left.artifacts[0]?.sha256, sha256(left.artifacts[0]?.content ?? ""));
  const { plan_sha256: ignored, ...body } = left;
  assert.equal(left.plan_sha256, sha256(canonicalJson(body)));
  assert.match(left.artifacts[0]?.content ?? "", /domainspec-meta:/);
  assert.match(left.artifacts[0]?.content ?? "", /export class Customer/);
});

test("generator coverage is exactly the frozen 13 by 3 matrix", () => {
  assert.equal(Object.keys(BODY_CONTRACTS).length, 13);
  assert.equal(GENERATOR_REGISTRY.length, 39);
  assert.equal(new Set(GENERATOR_REGISTRY.map((row) => `${row.meta_type_id}/${row.language}`)).size, 39);
  assert.equal(new Set(GENERATOR_REGISTRY.map((row) => row.generator_id)).size, 39);
  for (const metaType of FROZEN_META_TYPE_CATALOG.backend_meta_types) {
    for (const language of ["typescript", "python", "rust"] as const) {
      const plan = planInstantiation(node(metaType.label, metaType.label.toLowerCase().replaceAll(" ", "-")), language);
      assert.equal(plan.selected_realization.meta_type_id, metaType.id);
      assert.equal(plan.selected_realization.language, language);
      assert.equal(plan.generator_id, generatorIdFor(metaType.id, language));
      assert.equal(plan.artifacts.length, 1);
      assert.equal(plan.artifacts[0]?.content.endsWith("\n"), true);
    }
  }
});

test("all generated Workflow profiles expose Recovery Intent as the only intent term", () => {
  const workflow = node("Workflow", "recovery-workflow");
  const typescript = planInstantiation(workflow, "typescript").artifacts[0]?.content ?? "";
  const python = planInstantiation(workflow, "python").artifacts[0]?.content ?? "";
  const rust = planInstantiation(workflow, "rust").artifacts[0]?.content ?? "";
  assert.match(typescript, /RecoveryWorkflowRecoveryIntent/);
  assert.match(typescript, /recoveryIntent/);
  assert.match(python, /recovery_intent/);
  assert.match(rust, /RecoveryWorkflowRecoveryIntent/);
  assert.match(rust, /recovery_intent/);
  for (const content of [typescript, python, rust]) {
    assert.match(content, /not-required/);
    assert.match(content, /recovery-required/);
    assert.match(content, /semantic[_A-Za-z]*[Ss]tatus/);
    assert.match(content, /required/);
    assert.match(content, /durable[_A-Za-z]*[Tt]erminal[_A-Za-z]*[Dd]isposition/);
    assert.equal(content.includes("domainspec-compensation-states"), false);
    assert.equal(content.includes('"requested"'), false);
    assert.equal(content.includes('"running"'), false);
  }
  const supersededTokens = [
    ["Compensation", "Intent"].join(""),
    ["compensation", "Intent"].join(""),
    ["compensation", "intent"].join("_"),
    ["compensation", "intent"].join("-"),
  ];
  for (const content of [typescript, python, rust]) {
    for (const token of supersededTokens) assert.equal(content.includes(token), false);
  }
});

test("all generated TypeScript typechecks, all generated Python parses, and generated Rust Workflow is rustc-checked when available", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mtcli-language-validation-"));
  try {
    fs.writeFileSync(path.join(root, "package.json"), `${JSON.stringify({ type: "module" })}\n`);
    const pythonFiles: string[] = [];
    for (const metaType of FROZEN_META_TYPE_CATALOG.backend_meta_types) {
      const nodeId = metaType.label.toLowerCase().replaceAll(" ", "-");
      for (const language of ["typescript", "python"] as const) {
        const artifact = planInstantiation(node(metaType.label, nodeId), language).artifacts[0]!;
        const absolute = path.join(root, language, artifact.relative_path);
        fs.mkdirSync(path.dirname(absolute), { recursive: true });
        fs.writeFileSync(absolute, artifact.content);
        if (language === "python") pythonFiles.push(absolute);
      }
    }
    const configPath = path.join(root, "tsconfig.json");
    fs.writeFileSync(configPath, `${JSON.stringify({ compilerOptions: { strict: true, target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", skipLibCheck: true }, include: ["typescript/**/*.ts"] })}\n`);
    const tsc = spawnSync(path.resolve(testDir, "../../../node_modules/.bin/tsc"), ["--project", configPath, "--noEmit", "--pretty", "false"], { encoding: "utf8" });
    assert.equal(tsc.status, 0, `${tsc.stdout}\n${tsc.stderr}`);
    for (const pythonFile of pythonFiles) {
      const python = spawnSync("python3", ["-c", "import pathlib,sys; compile(pathlib.Path(sys.argv[1]).read_text(), sys.argv[1], 'exec')", pythonFile], { encoding: "utf8" });
      assert.equal(python.status, 0, `${pythonFile}\n${python.stdout}\n${python.stderr}`);
    }
    const rustArtifact = planInstantiation(node("Workflow", "recovery-workflow"), "rust").artifacts[0]!;
    const rustSource = path.join(root, rustArtifact.relative_path);
    fs.mkdirSync(path.dirname(rustSource), { recursive: true });
    fs.writeFileSync(rustSource, rustArtifact.content);
    const rust = spawnSync("rustc", ["--edition", "2024", "--crate-type", "lib", rustSource, "--out-dir", root], { encoding: "utf8" });
    if ((rust.error as NodeJS.ErrnoException | undefined)?.code !== "ENOENT") assert.equal(rust.status, 0, `${rust.stdout}\n${rust.stderr}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("generated TypeScript Workflow emits canonical Recovery Intent and preflights exact external Operation bindings", async () => {
  const type = FROZEN_META_TYPE_CATALOG.backend_meta_types.find(({ label }) => label === "Workflow")!;
  const workflowNode: DecodedProjectNode = Object.freeze({
    project_root: path.resolve("/tmp/test-project"),
    project_id: "test-project",
    feature_id: "feature",
    node_id: "recovery-workflow",
    kind: "Workflow",
    meta_type_id: type.id,
    body: decodeBody("Workflow", {
      description: "Recovery workflow",
      steps: ["operate", "publish"],
      compensations: ["undo", "none"],
      compensation_dependencies: [],
    }),
    relationships: Object.freeze([
      Object.freeze({ edge_id: "workflow-operate", relationship: "orchestrates", scope: "feature" as const, source: Object.freeze({ feature_id: "feature", node_id: "recovery-workflow", kind: "Workflow" }), target: Object.freeze({ feature_id: "feature", node_id: "operate", kind: "Operation" }) }),
      Object.freeze({ edge_id: "workflow-publish", relationship: "orchestrates", scope: "feature" as const, source: Object.freeze({ feature_id: "feature", node_id: "recovery-workflow", kind: "Workflow" }), target: Object.freeze({ feature_id: "feature", node_id: "publish", kind: "Operation" }) }),
      Object.freeze({ edge_id: "workflow-undo", relationship: "orchestrates", scope: "feature" as const, source: Object.freeze({ feature_id: "feature", node_id: "recovery-workflow", kind: "Workflow" }), target: Object.freeze({ feature_id: "feature", node_id: "undo", kind: "Operation" }) }),
    ]),
    source_manifest: sourceManifest,
  });
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mtcli-workflow-runtime-"));
  try {
    const artifact = planInstantiation(workflowNode, "typescript").artifacts[0]!;
    const source = path.join(root, "recovery-workflow.ts");
    fs.writeFileSync(source, artifact.content);
    const generated = await import(`${pathToFileURL(source).href}?case=runtime`);
    let directRecoveryCalls = 0;
    const digest = (material: string) => sha256(material);
    const outcome = await generated.recoveryWorkflow(
      async (step: string) => {
        if (step === "publish") throw new Error("publication-failed");
      },
      async () => {
        directRecoveryCalls += 1;
        throw new Error("Workflow must not execute recovery");
      },
      "workflow-run-1",
      "failure-1",
      digest,
    );
    assert.equal(outcome.compensationExecution, false);
    assert.equal(directRecoveryCalls, 0);
    assert.equal(outcome.workflowEvaluationResult, "recovery-required");
    assert.equal(outcome.recoveryIntent.semanticStatus, "required");
    assert.equal(outcome.recoveryIntent.workflowExecutionId, "workflow-run-1");
    assert.equal(outcome.recoveryIntent.failureOccurrenceId, "failure-1");
    assert.match(outcome.recoveryIntent.completedStepJournalDigest, /^[0-9a-f]{64}$/);
    assert.match(outcome.recoveryIntent.planDigest, /^[0-9a-f]{64}$/);
    assert.match(outcome.recoveryIntent.intentId, /^[0-9a-f]{64}$/);
    assert.deepEqual(outcome.recoveryIntent.plan.map(({ operationId }: { operationId: string }) => operationId), ["undo"]);
    assert.match(outcome.recoveryIntent.plan[0].invocationIdentity, /^[0-9a-f]{64}$/);

    const repeatedOutcome = await generated.recoveryWorkflow(
      async (step: string) => { if (step === "publish") throw new Error("publication-failed-again"); },
      async () => { directRecoveryCalls += 1; },
      "workflow-run-1",
      "failure-1",
      digest,
    );
    assert.equal(repeatedOutcome.recoveryIntent.intentId, outcome.recoveryIntent.intentId);
    assert.equal(repeatedOutcome.recoveryIntent.planDigest, outcome.recoveryIntent.planDigest);
    assert.equal(repeatedOutcome.recoveryIntent.plan[0].invocationIdentity, outcome.recoveryIntent.plan[0].invocationIdentity);
    assert.equal(directRecoveryCalls, 0);

    const noRecovery = await generated.recoveryWorkflow(
      async () => { throw new Error("first-step-failed"); },
      async () => { directRecoveryCalls += 1; },
      "workflow-run-2",
      "failure-2",
      digest,
    );
    assert.equal(noRecovery.workflowEvaluationResult, "not-required");
    assert.equal(noRecovery.recoveryIntent, null);
    assert.equal(directRecoveryCalls, 0);

    const calls: string[] = [];
    const validBinding = {
      workflowId: "recovery-workflow",
      operationId: "undo",
      failureContinuation: "escalate",
      invoke: async (invocationIdentity: string) => {
        calls.push(invocationIdentity);
        return { ok: true };
      },
    };
    await assert.rejects(
      generated.executeRecoveryWorkflowRecovery(outcome.recoveryIntent, [validBinding, {
        workflowId: "recovery-workflow",
        operationId: "publish",
        failureContinuation: "terminal-failure",
        invoke: async () => { calls.push("must-not-run"); return { ok: true }; },
      }], digest),
      /undeclared recovery binding:publish/,
    );
    assert.deepEqual(calls, []);
    await assert.rejects(
      generated.executeRecoveryWorkflowRecovery(outcome.recoveryIntent, [validBinding, {
        workflowId: "recovery-workflow",
        operationId: "rogue",
        failureContinuation: "terminal-failure",
        invoke: async () => { calls.push("must-not-run"); return { ok: true }; },
      }], digest),
      /binding is outside Workflow relation set:rogue/,
    );
    assert.deepEqual(calls, []);
    await assert.rejects(
      generated.executeRecoveryWorkflowRecovery({
        ...outcome.recoveryIntent,
        plan: [{ ...outcome.recoveryIntent.plan[0], operationId: "rogue" }],
      }, [validBinding], digest),
      /recovery target is outside Workflow relation set:rogue/,
    );
    assert.deepEqual(calls, []);
    await assert.rejects(
      generated.executeRecoveryWorkflowRecovery({
        ...outcome.recoveryIntent,
        intentId: "0".repeat(64),
      }, [validBinding], digest),
      /Recovery Intent identity mismatch/,
    );
    assert.deepEqual(calls, []);
    await assert.rejects(generated.executeRecoveryWorkflowRecovery(outcome.recoveryIntent, [], digest), /missing recovery Operation:undo/);
    assert.deepEqual(calls, []);

    const execution = await generated.executeRecoveryWorkflowRecovery(outcome.recoveryIntent, [validBinding], digest);
    assert.equal(execution.outcome, "succeeded");
    assert.equal(execution.recoveryIntentSemanticStatus, "required");
    assert.equal(execution.durableTerminalDisposition, null);
    assert.deepEqual(execution.executedPlanOccurrenceIds, [outcome.recoveryIntent.plan[0].planOccurrenceId]);
    assert.deepEqual(calls, [outcome.recoveryIntent.plan[0].invocationIdentity]);

    const failedExecution = await generated.executeRecoveryWorkflowRecovery(outcome.recoveryIntent, [{
      ...validBinding,
      invoke: async () => ({ ok: false, reason: "undo-failed" }),
    }], digest);
    assert.equal(failedExecution.outcome, "failed");
    assert.equal(failedExecution.failureContinuation, "escalate");
    assert.equal(failedExecution.recoveryIntentSemanticStatus, "required");
    assert.equal(failedExecution.durableTerminalDisposition, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
