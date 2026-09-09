import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve, dirname} from "node:path";
import {spawnSync} from "node:child_process";
import {decide, repositoryRoot, decisionProfilePath, MAX_INPUT_BYTES} from "../src/decision-cli.mjs";

const examplePath = new URL("../../../agent-routing/capabilities/are-cli/route.example.json", import.meta.url);
const cli = new URL("../bin/are.mjs", import.meta.url).pathname;
const example = () => JSON.parse(readFileSync(examplePath, "utf8"));
const routed = () => { const input = example(); return {...input, previous_receipt: decide("route", input).receipt}; };
const effect = (metadata) => ({method: "item/commandExecution/requestApproval", item_id: "item-1", proposal: {command: "example only; never executed"}, ...(metadata ? {metadata} : {})});

test("route is deterministic and returns the actual registry contract", () => {
  const first = decide("route", example());
  assert.equal(first.kind, "direct");
  assert.equal(first.route_contract.route_id, "CA2-ROUTE-UNDERSTAND");
  assert.deepEqual(first.route_contract.read_first, ["cyberAlchemy-v2/SOURCE-MAP.md"]);
  assert.equal(first.authority_effect, "none");
  assert.deepEqual(first, decide("route", example()));
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
  assert.deepEqual(output, decide("context", input));
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

test("unknown, unsafe, and safe effects use the existing boundary without approval", () => {
  for (const [metadata, expected] of [[undefined, "gate"], [{effect_classes: ["persistent-mutation"], reversible: true}, "gate"], [{effect_classes: ["local-read"], reversible: true}, "direct"]]) {
    const output = decide("effect", {...routed(), effect: effect(metadata)});
    assert.equal(output.kind, expected);
    assert.equal(output.result.value.client_approval_required, true);
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
    writeFileSync(resolve(root, profile.provenance[0].path), "source drift");
    assert.match(decide("route", example(), {repositoryRoot: root}).reason_codes.join(), /provenance-drift/);
    assert.equal(decide("context", routed(), {wrapperProfilePath: resolve(root, "absent")}).kind, "block");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("executable emits one JSON object and meaningful exit codes", () => {
  for (const [operation, input, code] of [["route", JSON.stringify(example()), 0], ["route", "{", 2], ["route", "x".repeat(MAX_INPUT_BYTES + 1), 2], ["effect", JSON.stringify({...routed(), effect: effect()}), 3]]) {
    const run = spawnSync(process.execPath, [cli, "decide", operation], {input, encoding: "utf8", maxBuffer: 2 * MAX_INPUT_BYTES});
    assert.equal(run.status, code, run.stderr);
    assert.equal(run.stdout.trim().split("\n").length, 1);
    assert.equal(JSON.parse(run.stdout).authority_effect, "none");
    assert.equal(run.stderr, "");
  }
});
