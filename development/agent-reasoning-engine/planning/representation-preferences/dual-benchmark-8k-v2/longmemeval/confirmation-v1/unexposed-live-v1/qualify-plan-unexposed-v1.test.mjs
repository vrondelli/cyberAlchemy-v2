import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmodSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {preflight, recover, run} from "./qualify-plan-unexposed-v1.mjs";
import {sha as protocolSha} from "./adapter-unexposed-v1.mjs";

const here = dirname(fileURLToPath(import.meta.url)), runner = join(here, "qualify-plan-unexposed-v1.mjs"), protocol = join(here, "paired-protocol-v1.json");
const runnerSha = createHash("sha256").update(readFileSync(runner)).digest("hex");
const source = process.env.ARE_G03_SOURCE_PACKAGE;

test("real-package preflight is provider-free and code-bound", {skip: !source}, () => {
  let calls = 0; const result = preflight(source, protocol, runnerSha, (command, args) => { calls++; assert.equal(command, "docker"); assert.equal(args[0], "inspect"); return "true\n"; });
  assert.equal(calls, 1); assert.equal(result.provider_calls, 0); assert.equal(result.credentials_accessed, false); assert.equal(result.code_bindings.runner_sha256, runnerSha);
  assert.deepEqual(result.ordered_question_ids, ["0e4e4c46", "gpt4_5438fa52", "ef66a6e5", "0862e8bf_abs"]);
  assert.throws(() => preflight(source, protocol, "0".repeat(64), () => "true\n"), /runner-drift/);
});

test("mocked real-package plan publishes exact bounded artifacts without generation", {skip: !source}, async () => {
  const root = mkdtempSync(join(tmpdir(), "g03-plan-test-")), output = join(root, "out"); let tokenizerCalls = 0, inspectCalls = 0;
  const invoke = (command, args, options) => {
    assert.equal(command, "docker");
    if (args[0] === "inspect") { inspectCalls++; return "true\n"; }
    assert.deepEqual(args.slice(0, 5), ["exec", "--user", "65532:65532", "-i", "are-keld-presentation-provider-gateway-1"]);
    tokenizerCalls++; const payload = JSON.parse(options.input.toString()), original = payload.messages.length === 1 && payload.messages[0].role === "user" && payload.messages[0].content.includes('"history"');
    return JSON.stringify({status: 200, prompt_tokens: original ? 9001 : 1000, response_sha256: String(tokenizerCalls).padStart(64, "0"), response_bytes: 100});
  };
  const result = await run(source, protocol, output, runnerSha, invoke);
  assert.equal(inspectCalls, 1); assert.equal(result.status, "planned"); assert.equal(result.tokenizer_calls, tokenizerCalls); assert.ok(tokenizerCalls <= 256);
  assert.equal(result.model_generation_calls, 0); assert.equal(result.judge_calls, 0); assert.equal(result.calls_exact, true); assert.equal(result.all_usage_known, true);
  assert.match(result.cohort_sha256, /^[a-f0-9]{64}$/); assert.match(result.acquisition_sha256, /^[a-f0-9]{64}$/); assert.match(result.source_sha256, /^[a-f0-9]{64}$/);
  assert.equal(result.source_bindings.cohort_sha256, result.cohort_sha256); assert.equal(result.endpoint_profile.endpoint, "https://api.z.ai/api/paas/v4/tokenizer");
  assert.equal(result.generation_token_reservation, result.generation_calls * 8000); assert.ok(result.generation_calls <= 248);
  const plan = JSON.parse(readFileSync(join(output, "PLAN.json"))); assert.equal(plan.plan_sha256, result.plan_sha256); assert.equal(plan.live_dispatch_admitted, false);
  await assert.rejects(() => run(source, protocol, output, runnerSha, invoke), /output-exists/);
});

test("complete recovery accepts only the exact replayed frozen plan", {skip: !source}, async () => {
  const makeInvoke = () => { let calls = 0; return (command, args, options) => {
    if (args[0] === "inspect") return "true\n";
    calls++; const payload = JSON.parse(options.input.toString()), original = payload.messages.length === 1 && payload.messages[0].content.includes('"history"');
    return JSON.stringify({status: 200, prompt_tokens: original ? 9001 : 1000, response_sha256: String(calls).padStart(64, "0"), response_bytes: 100});
  }; };
  const root = mkdtempSync(join(tmpdir(), "g03-exact-recover-test-")), exactOutput = join(root, "exact"), tamperedOutput = join(root, "tampered");
  await run(source, protocol, exactOutput, runnerSha, makeInvoke()); unlinkSync(join(exactOutput, "RESULTS.json"));
  const recovered = await recover(source, protocol, exactOutput, runnerSha, (_command, args) => { assert.equal(args[0], "inspect"); return "true\n"; });
  assert.equal(recovered.status, "inconclusive"); assert.equal(recovered.calls_exact, true); assert.match(recovered.cohort_sha256, /^[a-f0-9]{64}$/); assert.match(recovered.code_bindings.runner_sha256, /^[a-f0-9]{64}$/);

  await run(source, protocol, tamperedOutput, runnerSha, makeInvoke()); unlinkSync(join(tamperedOutput, "RESULTS.json"));
  const planPath = join(tamperedOutput, "PLAN.json"), tampered = JSON.parse(readFileSync(planPath));
  tampered.maximum_generation_calls--;
  const material = {...tampered}; delete material.plan_sha256; tampered.plan_sha256 = protocolSha(material);
  chmodSync(planPath, 0o600);
  writeFileSync(planPath, `${JSON.stringify(tampered, null, 2)}\n`);
  await assert.rejects(() => recover(source, protocol, tamperedOutput, runnerSha, () => "true\n"), /recovery-plan-drift/);
});

test("failed terminal result retains complete evidence lineage", {skip: !source}, async () => {
  const root = mkdtempSync(join(tmpdir(), "g03-failure-lineage-test-")), output = join(root, "out");
  const invoke = (_command, args) => { if (args[0] === "inspect") return "true\n"; const error = new Error("simulated"); error.status = 71; throw error; };
  await assert.rejects(() => run(source, protocol, output, runnerSha, invoke), /tokenizer-call-failed:71/);
  const result = JSON.parse(readFileSync(join(output, "RESULTS.json")));
  assert.equal(result.status, "failed"); assert.equal(result.failure_code, "unexposed-planning.tokenizer-call-failed:71");
  for (const key of ["selection_sha256", "cohort_sha256", "source_manifest_sha256", "acquisition_sha256", "source_revision", "source_sha256", "extractor_sha256"]) assert.ok(result[key]);
  assert.equal(result.source_bindings.cohort_sha256, result.cohort_sha256); assert.equal(result.code_bindings.runner_sha256, runnerSha); assert.equal(result.endpoint_profile.automatic_retries, 0);
});

test("recovery replays exact receipts without provider calls and bounds a prepared-only call", {skip: !source}, async () => {
  const root = mkdtempSync(join(tmpdir(), "g03-recover-test-")), output = join(root, "out"); let calls = 0;
  const invoke = (command, args, options) => {
    if (args[0] === "inspect") return "true\n";
    calls++; const payload = JSON.parse(options.input.toString()), original = payload.messages.length === 1 && payload.messages[0].content.includes('"history"');
    return JSON.stringify({status: 200, prompt_tokens: original ? 9001 : 1000, response_sha256: String(calls).padStart(64, "0"), response_bytes: 100});
  };
  const completed = await run(source, protocol, output, runnerSha, invoke);
  unlinkSync(join(output, "RESULTS.json")); unlinkSync(join(output, "PLAN.json"));
  unlinkSync(join(output, `call-${String(completed.calls).padStart(3, "0")}-measured.json`));
  let inspect = 0; const recovered = await recover(source, protocol, output, runnerSha, (_command, args) => { assert.equal(args[0], "inspect"); inspect++; return "true\n"; });
  assert.equal(inspect, 1); assert.equal(recovered.recovery_provider_calls, 0); assert.equal(recovered.calls_lower_bound, completed.calls - 1); assert.equal(recovered.calls_upper_bound, completed.calls); assert.equal(recovered.calls_exact, false);
});
