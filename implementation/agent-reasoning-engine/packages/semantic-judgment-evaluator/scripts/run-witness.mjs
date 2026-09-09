#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  AtomicFileRecordStore,
  EffectDispatcherTestDouble,
  executeWitness,
  historicalReplay,
} from "../index.mjs";
import { buildRequest, readFixture } from "../test/fixture-builder.mjs";

const OPEN_QUESTIONS_REF =
  "cyberAlchemy-v2/development/agent-reasoning-engine/spec/SPEC.md#open-blockers--owner-decisions";
const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const fixtureRoot = fileURLToPath(
  new URL("../../../fixtures/evaluator-v1/", import.meta.url),
);
const outputFlag = process.argv.indexOf("--output");
if (outputFlag === -1 || !process.argv[outputFlag + 1]) {
  throw new Error("usage: run-witness.mjs --output <directory>");
}
const outputRoot = resolve(process.cwd(), process.argv[outputFlag + 1]);
await mkdir(outputRoot, { recursive: true });

async function report(name, payload) {
  await writeFile(
    resolve(outputRoot, name),
    `${JSON.stringify({ ...payload, open_questions_ref: OPEN_QUESTIONS_REF }, null, 2)}\n`,
    "utf8",
  );
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const testRoot = resolve(packageRoot, "test");
const testFiles = (await readdir(testRoot))
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => resolve(testRoot, name));
const testRun = spawnSync(process.execPath, ["--test", ...testFiles], {
  cwd: process.cwd(),
  encoding: "utf8",
});
await report("test-report.json", {
  schema_version: "1.0.0",
  command:
    "node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/test/*.test.mjs",
  exit_code: testRun.status,
  passed: testRun.status === 0,
  stdout: testRun.stdout,
  stderr: testRun.stderr,
});
if (testRun.status !== 0) {
  throw new Error("witness tests failed; see test-report.json");
}

const sourceFiles = [
  "refund-eligibility.json",
  "release-readiness.json",
];
const fixtureEntries = [];
const sources = [];
for (const name of sourceFiles) {
  const path = resolve(fixtureRoot, name);
  const bytes = await readFile(path);
  const source = await readFixture(path);
  sources.push(source);
  fixtureEntries.push({
    family_id: source.family_id,
    author_owner_ref: source.author_owner_ref,
    source_ref: source.source_ref,
    source_file: `cyberAlchemy-v2/implementation/agent-reasoning-engine/fixtures/evaluator-v1/${name}`,
    source_exact_bytes_sha256: sha256(bytes),
  });
}
await report("fixture-manifest.json", {
  schema_version: "1.0.0",
  evaluator_entrypoint:
    "packages/semantic-judgment-evaluator/index.mjs#evaluateSemanticJudgment",
  separately_owned_family_count: fixtureEntries.length,
  fixtures: fixtureEntries,
});

const dispatcher = new EffectDispatcherTestDouble();
const executions = [];
for (const source of sources) {
  const store = new AtomicFileRecordStore(
    resolve(outputRoot, "persisted", source.family_id),
  );
  const request = buildRequest(source);
  const execution = await executeWitness(request, {
    store,
    effectDispatcher: dispatcher,
    telemetry: {},
  });
  executions.push({ source, request, execution });
}

const primary = executions[0];
const replay = historicalReplay(
  primary.request,
  primary.execution.reasoning_receipt_bytes,
);
await report("replay-report.json", {
  schema_version: "1.0.0",
  family_id: primary.source.family_id,
  matches_exact_bytes: replay.matches_exact_bytes,
  expected_exact_bytes_digest: replay.expected_exact_bytes_digest,
  replay_exact_bytes_digest: replay.replay_exact_bytes_digest,
  telemetry: replay.telemetry,
});

await report("persisted-order-report.json", {
  schema_version: "1.0.0",
  expected_order: [
    "entry-gate-decision",
    "reasoning-receipt",
    "effect-envelope",
    "effect-gate-decision",
  ],
  families: executions.map(({ source, execution }) => ({
    family_id: source.family_id,
    observed_order: execution.persisted_order,
    pass:
      JSON.stringify(execution.persisted_order) ===
      JSON.stringify([
        "entry-gate-decision",
        "reasoning-receipt",
        "effect-envelope",
        "effect-gate-decision",
      ]),
  })),
});

const repeat = await executeWitness(primary.request, {
  store: new AtomicFileRecordStore(
    resolve(outputRoot, "persisted", "repeat-delivery"),
  ),
  effectDispatcher: dispatcher,
  telemetry: {},
});
await report("effect-test-receipt.json", {
  schema_version: "1.0.0",
  adapter: "EffectDispatcherTestDouble",
  real_effects: false,
  distinct_first_deliveries: dispatcher.calls.length,
  first_delivery: primary.execution.effect_attempt,
  repeated_delivery: repeat.effect_attempt,
  one_logical_attempt_for_repeat:
    primary.execution.effect_attempt.new_attempt === true &&
    repeat.effect_attempt.new_attempt === false,
});

const acceptance = {
  tests_pass: testRun.status === 0,
  two_owner_distinct_rule_families:
    new Set(fixtureEntries.map((entry) => entry.author_owner_ref)).size === 2,
  replay_exact_bytes: replay.matches_exact_bytes,
  replay_zero_provider_calls: replay.telemetry.provider_calls === 0,
  replay_zero_effect_calls:
    replay.telemetry.effect_gate_calls === 0 &&
    replay.telemetry.effect_attempts === 0,
  persisted_order: executions.every(
    ({ execution }) =>
      JSON.stringify(execution.persisted_order) ===
      JSON.stringify([
        "entry-gate-decision",
        "reasoning-receipt",
        "effect-envelope",
        "effect-gate-decision",
      ]),
  ),
  exact_effect_test_double_only:
    dispatcher.calls.every(
      (delivery) =>
        delivery.action === "record_test_recommendation" &&
        delivery.target ===
          "test://semantic-judgment-evaluator/effect-log",
    ),
  repeat_delivery_idempotent: repeat.effect_attempt.new_attempt === false,
};
await report("TERMINAL-RECEIPT.json", {
  schema_version: "1.0.0",
  swu_id: "SWU-ARE-001",
  result: Object.values(acceptance).every(Boolean) ? "pass" : "block",
  capability_ref: "task-session",
  receipt_kind: "local-fallback",
  receipt_artifact:
    "cyberAlchemy-v2/implementation/agent-reasoning-engine/generated/runs/",
  validation: acceptance,
  blockers: [],
  residue: [
    "L0 is a semantic witness, not a general reasoning engine.",
    "No real effect adapter, actor runtime, mutable provider, or public package exists.",
  ],
  reroute: "G-ARE-L0 promotion evaluation",
  handoff_note:
    "Consume exact artifacts and digests; do not infer downstream authorization.",
});

if (!Object.values(acceptance).every(Boolean)) {
  throw new Error("witness acceptance failed; see TERMINAL-RECEIPT.json");
}
