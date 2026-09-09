import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { decodeBody, loadProjectNode, ProjectModelError, RELATIONSHIP_SIGNATURES } from "../../src/input/project-model.ts";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(testDir, "../../fixtures/input-roots/canonical-project");

function createRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mtcli-project-model-"));
  fs.cpSync(fixtureRoot, root, { recursive: true });
  return root;
}

function removeRoot(root: string): void {
  assert.equal(root.startsWith(path.join(os.tmpdir(), "mtcli-project-model-")), true);
  fs.rmSync(root, { recursive: true, force: true });
}

function expectCode(action: () => unknown, code: string): void {
  assert.throws(action, (error) => error instanceof ProjectModelError && error.code === code);
}

test("Entity input decodes from a read-only project with its exact relationship", () => {
  const root = createRoot();
  try {
    const before = fs.readFileSync(path.join(root, "specs/alpha/nodes/customer.json"), "utf8");
    const node = loadProjectNode(root, "alpha:customer");
    assert.equal(node.meta_type_id, "DS-D1.1");
    assert.equal(node.kind, "Entity");
    assert.deepEqual(node.body, { description: "A fixture customer.", fields: [] });
    assert.deepEqual(node.relationships.map(({ relationship }) => relationship), ["performs"]);
    assert.equal(fs.readFileSync(path.join(root, "specs/alpha/nodes/customer.json"), "utf8"), before);
  } finally {
    removeRoot(root);
  }
});

test("all 13 bodies are closed and Operation semantics are explicit", () => {
  assert.equal(RELATIONSHIP_SIGNATURES.length, 31);
  const operation = decodeBody("Operation", {
    description: "Settle an account.",
    reads: ["account"],
    writes: ["account.status"],
    effects: ["SettlementCompleted"],
    guard: "can-settle",
    failure_continuation: "return-settlement-error",
  });
  assert.deepEqual(operation.writes, ["account.status"]);
  expectCode(() => decodeBody("Operation", { ...operation, undeclared: "effect" }), "MTCLI_INPUT_BODY");
  expectCode(() => decodeBody("Enum", { description: "Priority", values: [] }), "MTCLI_INPUT_BODY");
  expectCode(() => decodeBody("State Machine", { description: "Order", states: ["new"], initial: "missing", transitions: [] }), "MTCLI_INPUT_BODY");
});

test("Workflow compensation dependencies are closed, Operation-shaped, and acyclic", () => {
  const workflow = decodeBody("Workflow", {
    description: "Settle an account.",
    steps: ["reserve", "charge"],
    compensations: ["release-reservation", "refund-payment"],
    compensation_dependencies: ["release-reservation:depends-on:refund-payment"],
  });
  assert.deepEqual(workflow.compensation_dependencies, ["release-reservation:depends-on:refund-payment"]);
  expectCode(() => decodeBody("Workflow", {
    ...workflow,
    compensation_dependencies: ["release-reservation->refund-payment"],
  }), "MTCLI_WORKFLOW_COMPENSATION_DEPENDENCY");
  expectCode(() => decodeBody("Workflow", {
    ...workflow,
    compensation_dependencies: [
      "release-reservation:depends-on:refund-payment",
      "refund-payment:depends-on:release-reservation",
    ],
  }), "MTCLI_WORKFLOW_COMPENSATION_DEPENDENCY_CYCLE");
});

test("unknown selected types and relationship endpoint mismatches fail closed", () => {
  const unknown = createRoot();
  const mismatch = createRoot();
  try {
    const nodePath = path.join(unknown, "specs/alpha/nodes/customer.json");
    const node = JSON.parse(fs.readFileSync(nodePath, "utf8"));
    node.kind = "Saga";
    fs.writeFileSync(nodePath, `${JSON.stringify(node, null, 2)}\n`);
    assert.throws(() => loadProjectNode(unknown, "alpha:customer"), /unsupported meta-type/);

    const edgePath = path.join(mismatch, "specs/beta/edges/audit-owns-settled.json");
    const edge = JSON.parse(fs.readFileSync(edgePath, "utf8"));
    edge.relationship = "produces";
    fs.writeFileSync(edgePath, `${JSON.stringify(edge, null, 2)}\n`);
    expectCode(() => loadProjectNode(mismatch, "beta:audit"), "MTCLI_RELATIONSHIP_ENDPOINT");
  } finally {
    removeRoot(unknown);
    removeRoot(mismatch);
  }
});
