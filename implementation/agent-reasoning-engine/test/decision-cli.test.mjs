import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve, dirname} from "node:path";
import {spawnSync} from "node:child_process";
import {decide, repositoryRoot, decisionProfilePath, policyBundlePath, MAX_INPUT_BYTES} from "../src/decision-cli.mjs";
import {computeRepositoryPolicyBundleDigest, loadVerifiedRepositoryPolicyBundle} from "../packages/request-decision-router/index.mjs";

const examplePath = new URL("../../../agent-routing/capabilities/are-cli/route.example.json", import.meta.url);
const compatibilitySchemaPath = new URL("../../../agent-routing/capabilities/are-cli/request.schema.json", import.meta.url);
const runtimeSchemaPath = new URL("../schemas/cli-request.schema.json", import.meta.url);
const cli = new URL("../bin/are.mjs", import.meta.url).pathname;
const example = () => JSON.parse(readFileSync(examplePath, "utf8"));
const routed = () => { const input = example(); return {...input, previous_receipt: decide("route", input).receipt}; };
const effect = (metadata) => ({method: "item/commandExecution/requestApproval", item_id: "item-1", proposal: {command: "example only; never executed"}, ...(metadata ? {metadata} : {})});

test("ARE owns the runtime CLI request schema without compatibility-copy drift", () => {
  assert.deepEqual(readFileSync(runtimeSchemaPath), readFileSync(compatibilitySchemaPath));
});

test("route is deterministic and returns the actual registry contract", () => {
  const first = decide("route", example());
  assert.equal(first.kind, "direct");
  assert.equal(first.route_contract.route_id, "CA2-ROUTE-UNDERSTAND");
  assert.deepEqual(first.route_contract.read_first, ["cyberAlchemy-v2/SOURCE-MAP.md"]);
  assert.equal(first.authority_effect, "none");
  assert.deepEqual(first, decide("route", example()));
  assert.equal(typeof first.policy_bundle_digest, "string");
  assert.equal(first.result.selected.write_ceiling, "none");
  assert.equal(first.result.selected.requires_user_authorization, false);
});

test("an immutable policy bundle routes without repository source reads and fails closed on tampering", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-policy-bundle-test-"));
  try {
    const copied = resolve(root, "policy.json");
    writeFileSync(copied, readFileSync(policyBundlePath));
    const routedFromBundle = decide("route", example(), {repositoryRoot: root, policyBundlePath: copied});
    assert.equal(routedFromBundle.kind, "direct");
    assert.equal(routedFromBundle.route_contract.route_id, "CA2-ROUTE-UNDERSTAND");
    const changed = JSON.parse(readFileSync(copied, "utf8"));
    changed.route_contracts[0].objective = "tampered";
    writeFileSync(copied, JSON.stringify(changed));
    assert.match(decide("route", example(), {repositoryRoot: root, policyBundlePath: copied}).reason_codes.join(), /policy-bundle.digest-mismatch/);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("policy bundle v2 fails closed on missing enforcement and can roll back to verified v1", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-policy-compatibility-test-"));
  try {
    const current = JSON.parse(readFileSync(policyBundlePath, "utf8"));
    const invalidV2 = structuredClone(current);
    delete invalidV2.route_contracts[0].enforcement;
    invalidV2.bundle_digest = computeRepositoryPolicyBundleDigest(invalidV2);
    const invalidPath = resolve(root, "invalid-v2.json");
    writeFileSync(invalidPath, JSON.stringify(invalidV2));
    assert.match(loadVerifiedRepositoryPolicyBundle(invalidPath).reason_codes.join(), /route-enforcement-invalid/);

    const rollback = structuredClone(current);
    rollback.schema_version = "are.repository-policy-bundle/v1";
    for (const route of rollback.route_contracts) delete route.enforcement;
    rollback.bundle_digest = computeRepositoryPolicyBundleDigest(rollback);
    const rollbackPath = resolve(root, "rollback-v1.json");
    writeFileSync(rollbackPath, JSON.stringify(rollback));
    const loaded = loadVerifiedRepositoryPolicyBundle(rollbackPath);
    assert.equal(loaded.ok, true);
    const rolledBackDecision = decide("route", example(), {repositoryRoot: root, policyBundlePath: rollbackPath});
    const currentDecision = decide("route", example());
    assert.equal(rolledBackDecision.kind, "direct");
    assert.equal(rolledBackDecision.route_contract.route_id, currentDecision.route_contract.route_id);
    assert.deepEqual(rolledBackDecision.result.selected.effect_assessment, currentDecision.result.selected.effect_assessment);
    assert.equal(rolledBackDecision.policy_source.mode, "compiled-bundle");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("sessions have distinct receipts and cannot exchange predecessors", () => {
  const a = routed(); const b = example(); b.session_id = "second-session";
  const bResult = decide("route", b);
  assert.notEqual(a.previous_receipt.receipt_digest, bResult.receipt.receipt_digest);
  assert.equal(decide("context", {...b, previous_receipt: a.previous_receipt}).kind, "block");
  assert.equal(decide("context", {...b, previous_receipt: bResult.receipt}).kind, "direct");
});

test("changed request, request ID, and altered predecessor all fail binding", () => {
  for (const change of [x => x.request.raw_request += " changed", x => x.request_id = "new", x => x.previous_receipt.receipt_digest = "changed"]) {
    const input = routed(); change(input);
    assert.deepEqual(decide("context", input).reason_codes, ["cli.predecessor-binding-mismatch"]);
  }
  assert.equal(decide("context", example()).ok, false);
});

test("real preflight returns a replayable source-bound context envelope", () => {
  const input = routed(); const output = decide("context", input);
  assert.equal(output.kind, "direct");
  assert.equal(output.result.context_envelope.ok, true);
  assert.ok(output.result.source_snapshot.length > 0);
  assert.equal(output.result.caller_field_postures.objective_kind, "inferred");
  assert.equal(output.result.source_mode, "product-bundle");
  assert.equal(typeof output.result.source_epoch_digest, "string");
  assert.deepEqual(output, decide("context", input));
});

test("context preflight preserves an explicitly selected objective without lexical route words", () => {
  const input = example();
  input.request_id = "prototype-context-posture";
  input.request.raw_request = "the two should be included in the first prototype";
  input.request.objective_kind = "implement";
  input.request.requested_effects = ["implementation"];
  input.request.target_refs = ["Linux ARE desktop companion"];
  input.request.constraints = ["dashboard does not mutate ARE state"];
  input.request.field_postures.objective_kind = "explicit";
  input.request.field_postures.requested_effects = "inferred";
  const route = decide("route", input);
  assert.equal(route.kind, "direct");
  assert.equal(route.route_contract.route_id, "CA2-ROUTE-IMPLEMENT");
  const context = decide("context", {...input, previous_receipt: route.receipt});
  assert.equal(context.kind, "direct");
  assert.deepEqual(context.result.directive.selected_route_or_candidates, ["CA2-ROUTE-IMPLEMENT"]);
  assert.equal(context.result.caller_field_postures.objective_kind, "explicit");
});

test("closed input contract rejects coercions and wrong operation payloads", () => {
  for (const change of [x => x.extra = true, x => x.request.requested_effects = "local-read", x => x.request.target_refs = [4], x => x.session_id = " ", x => x.request.field_postures.objective_kind = "approved", x => x.effect = effect()]) {
    const input = example(); change(input);
    assert.equal(decide("route", input).ok, false);
  }
  assert.equal(decide("effect", routed()).ok, false);
  assert.equal(decide("route", routed()).ok, false);
  assert.equal(decide("unknown", example()).ok, false);
  assert.equal(decide("route", null).ok, false);
});

test("ambiguity and blocked session capability cannot produce effects", () => {
  const ambiguous = example(); ambiguous.request = {raw_request: "research and implement"};
  const gate = decide("route", ambiguous);
  assert.notEqual(gate.kind, "direct");
  assert.equal(decide("effect", {...ambiguous, previous_receipt: gate.receipt, effect: effect()}).kind, gate.kind);
  const blocked = example(); blocked.request = {raw_request: "durable session", objective_kind: "session"};
  assert.equal(decide("route", blocked).kind, "block");
});

test("unknown and mutating effects cannot exceed a no-write route while safe effects remain direct", () => {
  for (const [metadata, expected] of [[undefined, "block"], [{effect_classes: ["persistent-mutation"], reversible: true}, "block"], [{effect_classes: ["local-read"], reversible: true}, "direct"]]) {
    const output = decide("effect", {...routed(), effect: effect(metadata)});
    assert.equal(output.kind, expected);
    assert.equal(output.result.value.client_approval_required, expected !== "block");
    assert.equal(output.authority_effect, "none");
  }
  const denied = decide("effect", {...routed(), effect: effect({effect_classes: ["local-read"], reversible: true, structurally_admissible: false})});
  assert.equal(denied.kind, "block");
});

test("continuation handles completion, failure, sole safe option and duplicates", () => {
  const input = {...routed(), continuation: {completion: {completion_id: "done-1", status: "completed", continuation_required: false, evidence_refs: []}, options: []}};
  assert.equal(decide("continue", input).kind, "complete");
  input.continuation.completion.status = "failed";
  assert.equal(decide("continue", input).kind, "block");
  input.continuation.completion.status = "completed";
  input.continuation.completion.continuation_required = true;
  input.continuation.options.push({option_id: "read", route_id: "CA2-ROUTE-UNDERSTAND", effect_classes: ["local-read"], reversible: true});
  assert.equal(decide("continue", input).kind, "direct");
  input.continuation.options.push({...input.continuation.options[0]});
  assert.deepEqual(decide("continue", input).reason_codes, ["cli.continuation-duplicate-option"]);
});

test("missing profile, missing sources and source drift fail closed in isolated fixtures", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-cli-test-"));
  try {
    assert.equal(decide("route", example(), {decisionProfilePath: resolve(root, "absent")}).kind, "block");
    assert.match(decide("route", example(), {repositoryRoot: root}).reason_codes.join(), /provenance-unavailable/);
    const profile = JSON.parse(readFileSync(decisionProfilePath, "utf8"));
    for (const source of profile.provenance) {
      const path = resolve(root, source.path); mkdirSync(dirname(path), {recursive: true});
      writeFileSync(path, readFileSync(resolve(repositoryRoot, source.path)));
    }
    assert.equal(decide("route", example(), {repositoryRoot: root}).kind, "direct");
    assert.equal(decide("route", example(), {repositoryRoot: root}).policy_source.mode, "development-live");
    writeFileSync(resolve(root, profile.provenance[0].path), "source drift");
    assert.match(decide("route", example(), {repositoryRoot: root}).reason_codes.join(), /provenance-drift/);
    assert.equal(decide("context", routed(), {wrapperProfilePath: resolve(root, "absent")}).kind, "block");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("executable emits one JSON object and meaningful exit codes", () => {
  for (const [operation, input, code] of [["route", JSON.stringify(example()), 0], ["route", "{", 2], ["route", "x".repeat(MAX_INPUT_BYTES + 1), 2], ["effect", JSON.stringify({...routed(), effect: effect()}), 2]]) {
    const run = spawnSync(process.execPath, [cli, "decide", operation], {input, encoding: "utf8", maxBuffer: 2 * MAX_INPUT_BYTES});
    assert.equal(run.status, code, run.stderr);
    assert.equal(run.stdout.trim().split("\n").length, 1);
    assert.equal(JSON.parse(run.stdout).authority_effect, "none");
    assert.equal(run.stderr, "");
  }
});
