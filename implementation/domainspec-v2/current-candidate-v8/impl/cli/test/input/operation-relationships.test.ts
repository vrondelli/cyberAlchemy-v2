import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { observeTarget } from "../../src/conformance/observe-target.ts";
import { planInstantiation } from "../../src/generation/plan-instantiation.ts";
import { publishInstantiation } from "../../src/generation/publish-instantiation.ts";
import { loadProjectNode, ProjectModelError } from "../../src/input/project-model.ts";

function writeJson(root: string, relativePath: string, value: unknown): void {
  const absolute = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

function project(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mtcli-operation-relations-"));
  writeJson(root, "project.json", { schema_version: "domainspec.project/v1", project_id: "operations-project", features: ["settlement"], cross_feature_edges: [] });
  writeJson(root, "specs/settlement/feature.json", { schema_version: "domainspec.feature/v1", feature_id: "settlement", nodes: ["settle", "reverse", "can-settle", "settled", "settlement-flow"], edges: ["rule-operation", "operation-event", "workflow-operation", "workflow-compensation-operation"] });
  writeJson(root, "specs/settlement/nodes/settle.json", { schema_version: "domainspec.node/v1", node_id: "settle", feature_id: "settlement", kind: "Operation", body: { description: "Settle", reads: ["settlement"], writes: ["settlement.status"], effects: ["Settled"], guard: "can-settle", failure_continuation: "return-settlement-error" } });
  writeJson(root, "specs/settlement/nodes/reverse.json", { schema_version: "domainspec.node/v1", node_id: "reverse", feature_id: "settlement", kind: "Operation", body: { description: "Reverse settlement", reads: ["settlement"], writes: ["settlement.status"], effects: ["SettlementReversed"], guard: "can-reverse", failure_continuation: "escalate" } });
  writeJson(root, "specs/settlement/nodes/can-settle.json", { schema_version: "domainspec.node/v1", node_id: "can-settle", feature_id: "settlement", kind: "Rule", body: { description: "Can settle", predicate: "open" } });
  writeJson(root, "specs/settlement/nodes/settled.json", { schema_version: "domainspec.node/v1", node_id: "settled", feature_id: "settlement", kind: "Event", body: { description: "Settlement completed", fields: ["settlement-id"] } });
  writeJson(root, "specs/settlement/nodes/settlement-flow.json", { schema_version: "domainspec.node/v1", node_id: "settlement-flow", feature_id: "settlement", kind: "Workflow", body: { description: "Settlement flow", steps: ["settle"], compensations: ["reverse"] } });
  writeJson(root, "specs/settlement/edges/rule-operation.json", { schema_version: "domainspec.edge/v1", edge_id: "rule-operation", feature_id: "settlement", relationship: "enforces", source_node_id: "can-settle", target_node_id: "settle", scope: "feature" });
  writeJson(root, "specs/settlement/edges/operation-event.json", { schema_version: "domainspec.edge/v1", edge_id: "operation-event", feature_id: "settlement", relationship: "produces", source_node_id: "settle", target_node_id: "settled", scope: "feature" });
  writeJson(root, "specs/settlement/edges/workflow-operation.json", { schema_version: "domainspec.edge/v1", edge_id: "workflow-operation", feature_id: "settlement", relationship: "orchestrates", source_node_id: "settlement-flow", target_node_id: "settle", scope: "feature" });
  writeJson(root, "specs/settlement/edges/workflow-compensation-operation.json", { schema_version: "domainspec.edge/v1", edge_id: "workflow-compensation-operation", feature_id: "settlement", relationship: "orchestrates", source_node_id: "settlement-flow", target_node_id: "reverse", scope: "feature" });
  return root;
}

function readJson(root: string, relativePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function addFeatureNode(root: string, nodeId: string, kind: string, body: Record<string, unknown>): void {
  const feature = readJson(root, "specs/settlement/feature.json");
  (feature.nodes as string[]).push(nodeId);
  writeJson(root, "specs/settlement/feature.json", feature);
  writeJson(root, `specs/settlement/nodes/${nodeId}.json`, { schema_version: "domainspec.node/v1", node_id: nodeId, feature_id: "settlement", kind, body });
}

function addFeatureEdge(root: string, edgeId: string, relationship: string, sourceNodeId: string, targetNodeId: string): void {
  const feature = readJson(root, "specs/settlement/feature.json");
  (feature.edges as string[]).push(edgeId);
  writeJson(root, "specs/settlement/feature.json", feature);
  writeJson(root, `specs/settlement/edges/${edgeId}.json`, { schema_version: "domainspec.edge/v1", edge_id: edgeId, feature_id: "settlement", relationship, source_node_id: sourceNodeId, target_node_id: targetNodeId, scope: "feature" });
}

test("Operation materializes its exact Rule, Event, and Workflow relationships in all languages", () => {
  const root = project();
  try {
    const node = loadProjectNode(root, "settlement:settle");
    assert.deepEqual(node.relationships.map(({ relationship }) => relationship), ["produces", "enforces", "orchestrates"]);
    assert.deepEqual(node.relationships.map(({ source, target }) => `${source.kind}->${target.kind}`), ["Operation->Event", "Rule->Operation", "Workflow->Operation"]);
    for (const language of ["typescript", "python", "rust"] as const) {
      const target = path.join(root, `target-${language}`);
      const publication = publishInstantiation(planInstantiation(node, language), target);
      const content = fs.readFileSync(path.join(target, publication.receipt.artifacts[0]!.relative_path), "utf8");
      assert.match(content, /domainspec-relationships:/);
      assert.equal(observeTarget(target).result, "pass");
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Workflow forward and compensation Operations close exactly against orchestrates", () => {
  const root = project();
  try {
    const workflow = loadProjectNode(root, "settlement:settlement-flow");
    assert.deepEqual(
      workflow.relationships.map(({ target }) => target.node_id),
      ["reverse", "settle"],
    );
    for (const language of ["typescript", "python", "rust"] as const) {
      const plan = planInstantiation(workflow, language);
      assert.equal(plan.input.relationships.length, 2);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Workflow rejects missing and undeclared compensation Operation relationships", () => {
  const missing = project();
  const undeclared = project();
  try {
    const missingNode = readJson(missing, "specs/settlement/nodes/settlement-flow.json");
    (missingNode.body as Record<string, unknown>).compensations = ["unbound-recovery"];
    writeJson(missing, "specs/settlement/nodes/settlement-flow.json", missingNode);
    assert.throws(
      () => loadProjectNode(missing, "settlement:settlement-flow"),
      (error) => error instanceof ProjectModelError && error.code === "MTCLI_WORKFLOW_OPERATION_RELATIONSHIP_MISSING",
    );

    const undeclaredNode = readJson(undeclared, "specs/settlement/nodes/settlement-flow.json");
    (undeclaredNode.body as Record<string, unknown>).compensations = ["none"];
    writeJson(undeclared, "specs/settlement/nodes/settlement-flow.json", undeclaredNode);
    assert.throws(
      () => loadProjectNode(undeclared, "settlement:settlement-flow"),
      (error) => error instanceof ProjectModelError && error.code === "MTCLI_WORKFLOW_OPERATION_RELATIONSHIP_UNDECLARED",
    );
  } finally {
    fs.rmSync(missing, { recursive: true, force: true });
    fs.rmSync(undeclared, { recursive: true, force: true });
  }
});

test("unknown and directionally invalid selected relationships fail closed", () => {
  const unknown = project();
  const invalid = project();
  try {
    const unknownPath = path.join(unknown, "specs/settlement/edges/operation-event.json");
    const unknownEdge = JSON.parse(fs.readFileSync(unknownPath, "utf8"));
    unknownEdge.relationship = "announces";
    fs.writeFileSync(unknownPath, `${JSON.stringify(unknownEdge, null, 2)}\n`);
    assert.throws(() => loadProjectNode(unknown, "settlement:settle"), (error) => error instanceof ProjectModelError && error.code === "MTCLI_RELATIONSHIP_UNKNOWN");

    const invalidPath = path.join(invalid, "specs/settlement/edges/rule-operation.json");
    const invalidEdge = JSON.parse(fs.readFileSync(invalidPath, "utf8"));
    invalidEdge.relationship = "produces";
    fs.writeFileSync(invalidPath, `${JSON.stringify(invalidEdge, null, 2)}\n`);
    assert.throws(() => loadProjectNode(invalid, "settlement:settle"), (error) => error instanceof ProjectModelError && error.code === "MTCLI_RELATIONSHIP_ENDPOINT");
  } finally {
    fs.rmSync(unknown, { recursive: true, force: true });
    fs.rmSync(invalid, { recursive: true, force: true });
  }
});

test("deprecated aliases and generated inverse views cannot be authored", () => {
  const deprecated = project();
  const generated = project();
  try {
    const deprecatedPath = path.join(deprecated, "specs/settlement/edges/operation-event.json");
    const deprecatedEdge = readJson(deprecated, "specs/settlement/edges/operation-event.json");
    deprecatedEdge.relationship = "queries";
    writeJson(deprecated, "specs/settlement/edges/operation-event.json", deprecatedEdge);
    assert.throws(() => loadProjectNode(deprecated, "settlement:settle"), (error) => error instanceof ProjectModelError && error.code === "MTCLI_RELATIONSHIP_DEPRECATED" && error.message.includes("reads"));

    const generatedEdge = readJson(generated, "specs/settlement/edges/operation-event.json");
    generatedEdge.relationship = "owned-by";
    writeJson(generated, "specs/settlement/edges/operation-event.json", generatedEdge);
    assert.throws(() => loadProjectNode(generated, "settlement:settle"), (error) => error instanceof ProjectModelError && error.code === "MTCLI_RELATIONSHIP_GENERATED_VIEW" && error.message.includes("owns"));
    assert.equal(fs.existsSync(deprecatedPath), true);
  } finally {
    fs.rmSync(deprecated, { recursive: true, force: true });
    fs.rmSync(generated, { recursive: true, force: true });
  }
});

test("relationship placement is checked against the canonical signature", () => {
  const root = project();
  try {
    writeJson(root, "specs/settlement/nodes/settled.json", { schema_version: "domainspec.node/v1", node_id: "settled", feature_id: "settlement", kind: "Entity", body: { description: "Settlement" } });
    const edge = readJson(root, "specs/settlement/edges/operation-event.json");
    edge.relationship = "produces-for";
    writeJson(root, "specs/settlement/edges/operation-event.json", edge);
    assert.throws(() => loadProjectNode(root, "settlement:settle"), (error) => error instanceof ProjectModelError && error.code === "MTCLI_RELATIONSHIP_SCOPE");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("selected duplicate propositions are rejected across the whole project graph", () => {
  const root = project();
  try {
    addFeatureEdge(root, "operation-event-copy", "produces", "settle", "settled");
    assert.throws(() => loadProjectNode(root, "settlement:can-settle"), (error) => error instanceof ProjectModelError && error.code === "MTCLI_RELATIONSHIP_DUPLICATE");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("creates enforces one target per Operation and one creator per Entity", () => {
  const outgoing = project();
  const incoming = project();
  try {
    writeJson(outgoing, "specs/settlement/nodes/settled.json", { schema_version: "domainspec.node/v1", node_id: "settled", feature_id: "settlement", kind: "Entity", body: { description: "Settlement" } });
    const original = readJson(outgoing, "specs/settlement/edges/operation-event.json");
    original.relationship = "creates";
    writeJson(outgoing, "specs/settlement/edges/operation-event.json", original);
    addFeatureNode(outgoing, "settlement-copy", "Entity", { description: "Settlement copy" });
    addFeatureEdge(outgoing, "operation-creates-copy", "creates", "settle", "settlement-copy");
    assert.throws(() => loadProjectNode(outgoing, "settlement:settle"), (error) => error instanceof ProjectModelError && error.code === "MTCLI_RELATIONSHIP_MULTIPLICITY");

    writeJson(incoming, "specs/settlement/nodes/settled.json", { schema_version: "domainspec.node/v1", node_id: "settled", feature_id: "settlement", kind: "Entity", body: { description: "Settlement" } });
    const incomingOriginal = readJson(incoming, "specs/settlement/edges/operation-event.json");
    incomingOriginal.relationship = "creates";
    writeJson(incoming, "specs/settlement/edges/operation-event.json", incomingOriginal);
    addFeatureNode(incoming, "settle-again", "Operation", { description: "Settle again", reads: [], writes: [], effects: [], guard: "allowed", failure_continuation: "return-error" });
    addFeatureEdge(incoming, "second-operation-creates", "creates", "settle-again", "settled");
    assert.throws(() => loadProjectNode(incoming, "settlement:can-settle"), (error) => error instanceof ProjectModelError && error.code === "MTCLI_RELATIONSHIP_MULTIPLICITY");
  } finally {
    fs.rmSync(outgoing, { recursive: true, force: true });
    fs.rmSync(incoming, { recursive: true, force: true });
  }
});
