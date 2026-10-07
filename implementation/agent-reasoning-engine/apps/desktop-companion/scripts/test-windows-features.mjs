#!/usr/bin/env node
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync, mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {pathToFileURL} from "node:url";

function invoke(node, entry, args, input) {
  // Native Windows reads a WSL UNC payload through the WSL file server. A
  // healthy bundled doctor can exceed the local-disk deadline there.
  const timeout = entry.startsWith("\\\\") ? 120_000 : 30_000;
  const result = spawnSync(node, [entry, ...args], {input, encoding: "utf8", timeout, maxBuffer: 1024 * 1024});
  assert.equal(result.status, 0, `${args.join(" ")} failed after ${timeout}ms: ${result.error?.message ?? result.stderr?.trim() ?? "unknown error"}`);
  return JSON.parse(result.stdout);
}

async function main() {
  if (process.platform !== "win32" || process.argv.length !== 3) {
    throw new Error("Usage on native Windows: node scripts/test-windows-features.mjs <installed-or-staged-resource-directory>");
  }
  const resources = resolve(process.argv[2]);
  const node = join(resources, "node/node.exe");
  const root = join(resources, "are/cyberAlchemy-v2/implementation/agent-reasoning-engine");
  const entry = join(root, "bin/are.mjs");
  const crossOsLauncher = join(resources, "cross-os-development/run.mjs");
  const crossOsBoundary = join(resources, "cross-os-development/cross-os-boundary.mjs");
  assert.ok(existsSync(node) && existsSync(entry), "Bundled ARE and Node are required.");
  assert.ok(existsSync(crossOsLauncher), "The opt-in cross-OS development launcher is required.");
  assert.ok(existsSync(crossOsBoundary), "The cross-OS launch boundary is required.");
  for (const path of [crossOsLauncher, crossOsBoundary]) {
    const timeout = path.startsWith("\\\\") ? 30_000 : 10_000;
    const syntax = spawnSync(node, ["--check", path], {encoding: "utf8", timeout});
    assert.equal(syntax.status, 0, syntax.error?.message || syntax.stderr || `Invalid packaged script: ${path}`);
  }
  const doctor = invoke(node, entry, ["doctor", "--json"]);
  assert.equal(doctor.schema_version, "are.product-health/v1");
  assert.equal(doctor.status, "PASS");
  assert.equal(doctor.node.exact_match, true);

  const request = {
    schema_version: "are.cli-request/v1",
    session_id: "windows-companion-package-check",
    request_id: "windows-companion-route-check",
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
  const route = invoke(node, entry, ["decide", "route"], JSON.stringify(request));
  assert.equal(route.kind, "direct");
  assert.equal(route.route_contract.route_id, "CA2-ROUTE-UNDERSTAND");
  const context = invoke(node, entry, ["decide", "context"], JSON.stringify({...request, previous_receipt: route.receipt}));
  assert.equal(context.kind, "direct");
  assert.equal(context.result.context_envelope.ok, true);

  const reasoningModule = await import(pathToFileURL(join(root, "packages/reasoning-state-runtime/index.mjs")).href);
  const ledger = reasoningModule.createReasoningStateLedger({ledger_id: "are-companion-windows-smoke"});
  assert.equal(ledger.inspect().event_count, 0);
  assert.equal(ledger.inspect().authority_effect, "none");
  const planRef = "plans:packaged-smoke";
  const planDigest = createHash("sha256").update("packaged plan fixture").digest("hex");
  const planInput = {
    thread_ref: "backend-thread:packaged-smoke",
    parent_plan_ref: planRef,
    parent_plan_digest: planDigest,
    feature_obligations: [{obligation_id: "scope", summary: "Retain the whole plan", status: "active"}],
    active_slice_id: "scope",
    unresolved_decisions: [],
    source_refs: [{source_ref: planRef, source_digest: planDigest}],
    previous_plan_context_digest: null,
  };
  const planOptions = {expected_thread_ref: planInput.thread_ref, source_digests: {[planRef]: planDigest}};
  const recordedPlan = reasoningModule.appendReasoningPlanContext(ledger, planInput, planOptions);
  assert.equal(recordedPlan.ok, true);
  assert.equal(reasoningModule.verifyReasoningPlanContext(recordedPlan.value).ok, true);
  assert.equal(reasoningModule.getLatestReasoningPlanContext(ledger, planInput.thread_ref)?.content.plan_context_digest, recordedPlan.value.plan_context_digest);
  assert.equal(reasoningModule.appendReasoningPlanContext(ledger, {...planInput, thread_ref: "backend-thread:forged"}, planOptions).ok, false);
  ledger.close();

  const threadObservation = await import(pathToFileURL(join(root, "packages/codex-app-server-wrapper/src/thread-observation-client.mjs")).href);
  assert.equal(typeof threadObservation.readGatewayThreadObservation, "function");
  const decisionObservation = await import(pathToFileURL(join(root, "packages/codex-app-server-wrapper/src/decision-observation-client.mjs")).href);
  assert.equal(typeof decisionObservation.readGatewayDecisionObservation, "function");

  const evolution = await import(pathToFileURL(join(root, "packages/evolution-runtime/index.mjs")).href);
  const registryOnly = invoke(node, join(root, "packages/evolution-runtime/bin/observe.mjs"), ["--json", "--registry-only"]);
  assert.equal(registryOnly.source, "candidate-registry-only");
  assert.equal(registryOnly.root_status, "not-configured");
  assert.equal(registryOnly.evidence_status, "not-observed");
  assert.equal(registryOnly.definitions.length, 5);
  assert.equal(registryOnly.cycle_count, 0);
  assert.equal(registryOnly.commit_count, 0);
  const probeParent = mkdtempSync(join(tmpdir(), "are-companion-windows-evolution-"));
  const probeRoot = join(probeParent, "native-ledger");
  try {
    const definition = evolution.loadCandidateCycleDefinitionRegistry().definitions.find((item) => item.definition_ref === "benchmark-research/v1");
    assert.ok(definition, "The bounded Evolution fixture definition is required.");
    const kernel = evolution.createDurableEvolutionKernel({root: probeRoot, require_enabled: false});
    const command = evolution.materializeEvolutionCommand({
      idempotency_key: "companion-windows-package-smoke:001",
      expected_event_revision: 0,
      actor: {actor_id: "agent:companion-package-smoke", actor_kind: "agent"},
      worker_ref: null,
      cycle_ref: "cycle:companion-package-smoke",
      cycle_definition_ref: definition.definition_ref,
      cycle_definition_digest: definition.definition_digest,
      operation: "cycle.diagnose",
      target: {record_kind: "experiment", record_ref: "experiment:companion-package-smoke"},
      payload: {objective_ref: "objective:companion-package-smoke"},
    });
    const written = kernel.process(command, {event_drafts: [{event_type: "diagnosis-recorded", payload: {diagnosis_ref: "diagnosis:companion-package-smoke", disposition: "active"}}]});
    assert.equal(written.ok, true);
    assert.equal(written.disposition, "accepted");
    assert.ok(existsSync(join(probeRoot, "evolution-ledger.sqlite")), "Native Windows SQLite ledger was not created.");
    const observation = evolution.observeDurableEvolution({root: probeRoot});
    assert.equal(observation.evidence_status, "verified");
    assert.equal(observation.commit_count, 1);
    assert.equal(observation.cycle_count, 1);
    const reopened = evolution.createDurableEvolutionKernel({root: probeRoot, require_enabled: false});
    assert.equal(reopened.inspect().value.commit_count, 1);
    assert.equal(reopened.process(command).disposition, "replayed");
  } finally { rmSync(probeParent, {recursive: true, force: true}); }

  process.stdout.write(`${JSON.stringify({schema_version: "are.companion-windows-feature-check/v1", ok: true, checks: ["bundled-node-exact", "cross-os-development-launcher-present", "product-health-pass", "route-decision-direct", "context-preflight-direct", "reasoning-state-runtime-load", "bounded-plan-context-record", "backend-thread-observation-client-load", "backend-decision-observation-client-load", "evolution-candidate-registry-without-root", "evolution-native-sqlite-write", "evolution-read-only-observer", "evolution-reopen-and-replay"], active_thread_reasoning_projection: "development-gateway-backend-threads-only", product_version: doctor.product_version, closure_digest: doctor.source_closure.closure_digest, authority_effect: "none"}, null, 2)}\n`);
}

main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
