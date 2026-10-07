import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";

import {materializeStandaloneDistribution} from "../src/distribution.mjs";
import {projectRoot, repositoryRoot} from "../src/product.mjs";

test("standalone distribution rejects the source project and its ancestors as output", () => {
  assert.throws(() => materializeStandaloneDistribution(resolve(projectRoot, ".distribution-guard-test-output")),
    /distribution\.output-inside-source-repository/u);
  assert.throws(() => materializeStandaloneDistribution(projectRoot),
    /distribution\.output-inside-source-repository/u);
  assert.throws(() => materializeStandaloneDistribution(repositoryRoot),
    /distribution\.output-inside-source-repository/u);
});

test("standalone distribution runs without Alch or DomainSpec trees", () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "are-standalone-"));
  const output = resolve(temporary, "distribution");
  try {
    const receipt = materializeStandaloneDistribution(output);
    assert.equal(receipt.forbidden_dependencies.length, 0);
    assert.equal(receipt.file_count > 100, true);
    const productRoot = resolve(output, "cyberAlchemy-v2/implementation/agent-reasoning-engine");
    const doctor = spawnSync(process.execPath, [resolve(productRoot, "bin/are.mjs"), "doctor", "--json"], {
      cwd: productRoot,
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.equal(doctor.status, 0, `${doctor.stdout}\n${doctor.stderr}`);
    assert.equal(JSON.parse(doctor.stdout).status, "PASS");
    const routeInput = {
      schema_version: "are.cli-request/v1",
      session_id: "standalone-distribution-test",
      request_id: "route-1",
      request: {
        raw_request: "Explain the routing architecture",
        objective_kind: "understand",
        requested_effects: [],
        target_refs: [],
        constraints: [],
        evidence_refs: [],
        field_postures: {request_id: "inferred", raw_request: "explicit", objective_kind: "inferred", requested_effects: "absent", target_refs: "absent", constraints: "absent", evidence_refs: "absent"},
      },
    };
    const runtimeSchema = resolve(productRoot, "schemas/cli-request.schema.json");
    assert.equal(JSON.parse(readFileSync(runtimeSchema, "utf8")).$id, "are.cli-request/v1");
    // The repository-facing contract remains in the distribution for callers,
    // but ARE route/context execution must not load that external copy.
    rmSync(resolve(output, "cyberAlchemy-v2/agent-routing/capabilities/are-cli/request.schema.json"));
    const routed = spawnSync(process.execPath, [resolve(productRoot, "bin/are.mjs"), "decide", "route"], {
      cwd: productRoot,
      input: JSON.stringify(routeInput),
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.equal(routed.status, 0, `${routed.stdout}\n${routed.stderr}`);
    const routeResult = JSON.parse(routed.stdout);
    assert.equal(routeResult.route_contract.route_id, "CA2-ROUTE-UNDERSTAND");
    assert.equal(typeof routeResult.policy_bundle_digest, "string");
    const contextInput = {...routeInput, previous_receipt: routeResult.receipt};
    const context = spawnSync(process.execPath, [resolve(productRoot, "bin/are.mjs"), "decide", "context"], {
      cwd: productRoot,
      input: JSON.stringify(contextInput),
      encoding: "utf8",
      timeout: 30_000,
    });
    assert.equal(context.status, 0, `${context.stdout}\n${context.stderr}`);
    const contextResult = JSON.parse(context.stdout);
    assert.equal(contextResult.kind, "direct");
    assert.equal(contextResult.result.source_mode, "product-bundle");
    assert.equal(typeof contextResult.result.source_epoch_digest, "string");
    assert.throws(() => readFileSync(resolve(output, "domainspec-core/README.md")), /ENOENT/u);
    assert.throws(() => readFileSync(resolve(output, "cyberAlchemy-v2/language/capabilities/alchlang/README.md")), /ENOENT/u);
  } finally {
    rmSync(temporary, {recursive: true, force: true});
  }
});

test("DSH extension materializes independently with an explicit locked install contract", () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "are-dsh-extension-"));
  const output = resolve(temporary, "distribution");
  try {
    const receipt = materializeStandaloneDistribution(output, {include: ["dsh-gateway-backend-adapter", "codex-app-server-wrapper"]});
    assert.equal(receipt.selection.includes("dsh-gateway-backend-adapter"), true);
    assert.deepEqual(receipt.install_contracts.map((contract) => contract.component_id), ["dsh-gateway-backend-adapter"]);
    const extensionRoot = resolve(output, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/dsh-gateway-backend-adapter");
    assert.equal(JSON.parse(readFileSync(resolve(extensionRoot, "package-lock.json"), "utf8")).lockfileVersion, 3);
    assert.throws(() => readFileSync(resolve(extensionRoot, "node_modules/@deepseek-ai/dsh/package.json")), /ENOENT/u);
  } finally {
    rmSync(temporary, {recursive: true, force: true});
  }
});
