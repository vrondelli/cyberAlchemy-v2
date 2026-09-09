import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, test } from "node:test";

import { buildIsolation } from "../cli/isolation.mjs";
import {
  buildSyntheticBlock,
  inspectSyntheticBlock,
  runSyntheticBlock,
  sealSyntheticBlock,
  validateSyntheticBlock,
} from "../cli/block.mjs";

const temporaryRoots = [];
const CLI = new URL("../cli/define.mjs", import.meta.url).pathname;
const TASK = "fixture-html-canonicalization";
const TARGET = "fixture/backend/src/domain/canonicalize.ts";
const HIDDEN = "fixture/backend/src/domain/canonicalize.test.ts";
const VISIBLE = ["fixture/backend/package.json", "fixture/backend/pnpm-lock.yaml", TARGET, "fixture/backend/tsconfig.json"];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map(async (path) => {
    await makeWritable(path);
    await rm(path, { recursive: true, force: true });
  }));
});

async function makeWritable(path) {
  try {
    const info = await lstat(path);
    if (!info.isDirectory()) return chmod(path, 0o600);
    await chmod(path, 0o700);
    for (const entry of await readdir(path)) await makeWritable(join(path, entry));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function command(cwd, name, args, binary = false) {
  const result = spawnSync(name, args, { cwd, encoding: binary ? null : "utf8" });
  assert.equal(result.status, 0, `${name} ${args.join(" ")}\n${result.stderr}`);
  return binary ? result.stdout : result.stdout.trim();
}

async function put(root, path, contents) {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents);
}

function candidate(commit) {
  return {
    candidate_id: TASK,
    repository_commit: commit,
    source_selectors: [TARGET, HIDDEN],
    inclusion_checks: {
      local_sandbox: true,
      bounded_surface: true,
      hidden_semantic_cases: true,
      reviewable_meaning: true,
      no_external_effects: true,
      model_independence: true,
      representation_parity: true,
      privacy_safe: true,
    },
    exclusion_checks: {
      requires_open_decision: false,
      semantics_indistinguishable_from_tests: false,
      live_external_integration: false,
      post_outcome_selection: false,
      unstable_or_concurrent_bytes: false,
      middle_ambiguity_band: false,
    },
    ambiguity_scores: { concept_meaning: 0, context_boundary: 0, ownership_authority: 0, valid_outcome: 0 },
    classification: "low_ambiguity_control",
    classification_reason: "Bounded synthetic low-ambiguity control.",
    selected: true,
    selection_reason: "Exercises the L3 chain without a model.",
    condition_output_seen_before_selection: false,
    hidden_case_count: 6,
  };
}

function materials() {
  const facts = [
    { fact_id: "F-001", kind: "goal", statement: "Produce stable output.", source_ref: "fixture", source_selector: "goal", applies_in_context: "fixture" },
    { fact_id: "F-002", kind: "blocked_action", statement: "Do not change hidden tests.", source_ref: "fixture", source_selector: "limit", applies_in_context: "all conditions" },
  ];
  const view = facts.map(({ fact_id, statement }) => ({ fact_id, statement }));
  const conditionCost = { direct_material_minutes: 0, direct_material_tokens: 0, allocated_fact_set_minutes: 0, allocated_fact_set_tokens: 0, artifact_characters: 0 };
  return {
    schema_version: "define-l3-materials@1",
    task_id: TASK,
    ticket: "Complete the bounded fixture behavior.",
    facts,
    equivalent_notes: view,
    definition_pack: view,
    gate_policy: { schema_version: "fixture-gate@1", requirement: "Confirm the plan names the goal.", authority_effect: "none" },
    truth_card: { expected_action: "implement", hidden_case_count: 6, authority_effect: "none" },
    costs: {
      fact_set_preparation_minutes: 0,
      fact_set_preparation_tokens: 0,
      parity_review_minutes: 0,
      parity_review_tokens: 0,
      conditions: Object.fromEntries(["ticket_only", "equivalent_notes", "definition_pack", "definition_pack_evidence_gate"].map((name) => [name, conditionCost])),
    },
  };
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "define-l3-chain-"));
  temporaryRoots.push(root);
  const repository = join(root, "repository");
  await mkdir(repository);
  command(repository, "git", ["init", "--quiet"]);
  command(repository, "git", ["config", "user.name", "Fixture"]);
  command(repository, "git", ["config", "user.email", "fixture@example.test"]);
  await put(repository, VISIBLE[0], "{\"type\":\"module\"}\n");
  await put(repository, VISIBLE[1], "lockfileVersion: '9.0'\n");
  await put(repository, TARGET, "export const original = 'ORIGINAL_SECRET';\n");
  await put(repository, VISIBLE[3], "{\"compilerOptions\":{}}\n");
  await put(repository, HIDDEN, "test('hidden truth', () => {});\n");
  const stubPath = "runtime-fixtures/canonicalize.ts";
  const stubBytes = Buffer.from("export const canonicalizeHtml = () => { throw new Error('UNIMPLEMENTED'); };\n");
  await put(repository, stubPath, stubBytes);
  command(repository, "git", ["add", "."]);
  command(repository, "git", ["commit", "--quiet", "-m", "fixture"]);
  const commit = command(repository, "git", ["rev-parse", "HEAD"]);

  const run = join(root, "run");
  await mkdir(join(run, "manifest"), { recursive: true });
  await Promise.all([
    writeFile(join(run, "events.jsonl"), ""),
    writeFile(join(run, "questions.jsonl"), ""),
    writeFile(join(run, "answers.jsonl"), `${JSON.stringify({ question_id: "randomization_seed", answer: "l3-seed" })}\n`),
    writeFile(join(run, "state.json"), `${JSON.stringify({ experiment_id: "fixture-experiment", phase: "prepared", open_question_count: 0, live_authorized: false, model_calls: 0 })}\n`),
    writeFile(join(run, "manifest", "experiment-manifest.draft.json"), `${JSON.stringify({ protocol_id: "define-downstream-utility@1", experiment_id: "fixture-experiment", created_at: "2026-08-29T00:00:00Z" })}\n`),
  ]);
  const selection = { schema_version: "define-task-selection@1", protocol_id: "define-downstream-utility@1", evidence_kind: "live_run", recorded_at: "2026-08-29T00:00:00Z", recorded_by: "fixture", selection_locked_before_condition_outputs: true, candidates: [candidate(commit)] };
  await writeFile(join(run, "manifest", "task-selection.json"), `${JSON.stringify(selection, null, 2)}\n`);

  const profile = {
    schema_version: "define-task-runtime-profile@1",
    task_id: TASK,
    repository_commit: commit,
    visible_source_paths: VISIBLE,
    evaluator_source_root: "fixture/backend",
    withheld_target_paths: [TARGET],
    hidden_test_paths: [HIDDEN],
    allowed_write_paths: [TARGET],
    forbidden_paths: [HIDDEN],
    target_path: TARGET,
    stub_fixture_path: stubPath,
    stub_fixture_sha256: sha256(stubBytes),
    original_implementation_markers: ["ORIGINAL_SECRET"],
    dependency_closure_digest: "a".repeat(64),
    agent_runtime_image_or_toolchain_digest: "b".repeat(64),
    evaluator_runtime_image_or_toolchain_digest: "b".repeat(64),
    visible_validation_commands: [],
    hidden_validation_commands: ["hidden-test"],
    resource_limits: { timeout_seconds: 10, memory_mebibytes: 128, cpu_count: 1 },
    network_policy: "none",
    expected_action: "reconstruct",
    runtime_identity: "fixture-node",
    runtime_authority: "fixture",
  };
  const baselinePath = "runtime-fixtures/baseline.json";
  const baseline = {
    schema_version: "define-task-baseline-receipt@1",
    task_id: TASK,
    repository_commit: commit,
    source: "git-object-database",
    worktree_bytes_used: false,
    visible_source_files: VISIBLE.map((path) => ({ path, sha256: sha256(command(repository, "git", ["show", `${commit}:${path}`], true)) })),
    dependency_closure_digest: profile.dependency_closure_digest,
    hidden_test_path: HIDDEN,
    hidden_test_sha256: sha256(command(repository, "git", ["show", `${commit}:${HIDDEN}`], true)),
    authority_effect: "none",
  };
  const baselineBytes = Buffer.from(`${JSON.stringify(baseline, null, 2)}\n`);
  await put(repository, baselinePath, baselineBytes);
  profile.baseline_receipt_path = baselinePath;
  profile.baseline_receipt_digest = sha256(baselineBytes);
  const profilePath = join(root, "profile.json");
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
  const materialsPath = join(root, "materials.json");
  await writeFile(materialsPath, `${JSON.stringify(materials(), null, 2)}\n`);
  await buildIsolation({ runDirectory: run, repositoryDirectory: repository, profilePath, attemptId: "l2-ready" });
  return { root, repository, run, materialsPath };
}

test("one neutral four-condition synthetic block seals and passes the existing joined validators", async () => {
  const work = await fixture();
  const built = await buildSyntheticBlock({ runDirectory: work.run, isolationAttempt: "l2-ready", blockAttempt: "l3-001", materialsPath: work.materialsPath });
  assert.equal(built.status, "candidate");
  assert.equal((await inspectSyntheticBlock({ runDirectory: work.run, blockAttempt: "l3-001" })).facts.length, 2);
  await assert.rejects(sealSyntheticBlock({ runDirectory: work.run, blockAttempt: "l3-001", confirmDigest: "0".repeat(64) }), /BLOCK_CONFIRM_DIGEST_MISMATCH/);
  await sealSyntheticBlock({ runDirectory: work.run, blockAttempt: "l3-001", confirmDigest: built.candidate_digest });
  assert.equal((await runSyntheticBlock({ runDirectory: work.run, blockAttempt: "l3-001" })).rows, 4);
  assert.equal((await validateSyntheticBlock({ runDirectory: work.run, blockAttempt: "l3-001" })).status, "pass");
  const rows = (await readFile(join(work.run, "block-attempts", "l3-001", "rows", "run.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
  assert.equal(rows.length, 4);
  assert.equal(new Set(rows.map((row) => JSON.stringify(row.outcomes))).size, 1);
  assert.equal(new Set(rows.flatMap((row) => [row.execution.planner_session_id, row.execution.implementer_session_id])).size, 8);
  const state = JSON.parse(await readFile(join(work.run, "state.json"), "utf8"));
  assert.equal(state.phase, "prepared");
  assert.equal(state.synthetic_block_status, "validated");
  assert.equal(state.live_authorized, false);
  assert.equal(state.model_calls, 0);
});

test("fact mismatch and duplicate attempts fail before synthetic execution", async () => {
  const work = await fixture();
  const broken = materials();
  broken.definition_pack[0].statement = "Different meaning.";
  const brokenPath = join(work.root, "broken-materials.json");
  await writeFile(brokenPath, `${JSON.stringify(broken)}\n`);
  await assert.rejects(
    buildSyntheticBlock({ runDirectory: work.run, isolationAttempt: "l2-ready", blockAttempt: "l3-broken", materialsPath: brokenPath }),
    /BLOCK_PARITY_STATEMENT/,
  );
  await buildSyntheticBlock({ runDirectory: work.run, isolationAttempt: "l2-ready", blockAttempt: "l3-once", materialsPath: work.materialsPath });
  await assert.rejects(
    buildSyntheticBlock({ runDirectory: work.run, isolationAttempt: "l2-ready", blockAttempt: "l3-once", materialsPath: work.materialsPath }),
    /BLOCK_ATTEMPT_EXISTS/,
  );
});

test("L2 drift blocks sealing and row mutation makes joined validation fail", async () => {
  const drift = await fixture();
  const candidateBlock = await buildSyntheticBlock({ runDirectory: drift.run, isolationAttempt: "l2-ready", blockAttempt: "l3-drift", materialsPath: drift.materialsPath });
  const source = join(drift.run, "isolation", "attempts", "l2-ready", "agent-bases", "ticket_only", TARGET);
  await chmod(dirname(source), 0o755);
  await chmod(source, 0o644);
  await writeFile(source, "x", { flag: "a" });
  await assert.rejects(
    sealSyntheticBlock({ runDirectory: drift.run, blockAttempt: "l3-drift", confirmDigest: candidateBlock.candidate_digest }),
    /ISOLATION_VERIFY_FAILED/,
  );

  const packetWork = await fixture();
  const packetCandidate = await buildSyntheticBlock({ runDirectory: packetWork.run, isolationAttempt: "l2-ready", blockAttempt: "l3-packet", materialsPath: packetWork.materialsPath });
  const packetPath = join(packetWork.run, "block-attempts", "l3-packet", "candidate", "packets", "definition_pack.md");
  await writeFile(packetPath, "drift", { flag: "a" });
  await assert.rejects(
    sealSyntheticBlock({ runDirectory: packetWork.run, blockAttempt: "l3-packet", confirmDigest: packetCandidate.candidate_digest }),
    /BLOCK_PACKET_DIGEST_DRIFT/,
  );

  const rowsWork = await fixture();
  const built = await buildSyntheticBlock({ runDirectory: rowsWork.run, isolationAttempt: "l2-ready", blockAttempt: "l3-rows", materialsPath: rowsWork.materialsPath });
  await sealSyntheticBlock({ runDirectory: rowsWork.run, blockAttempt: "l3-rows", confirmDigest: built.candidate_digest });
  await runSyntheticBlock({ runDirectory: rowsWork.run, blockAttempt: "l3-rows" });
  const rowsPath = join(rowsWork.run, "block-attempts", "l3-rows", "rows", "run.jsonl");
  const rows = (await readFile(rowsPath, "utf8")).trim().split("\n").map(JSON.parse);
  rows[1].execution.planner_session_id = rows[0].execution.planner_session_id;
  await writeFile(rowsPath, `${rows.map(JSON.stringify).join("\n")}\n`);
  await assert.rejects(validateSyntheticBlock({ runDirectory: rowsWork.run, blockAttempt: "l3-rows" }), /BLOCK_VALIDATION_FAILED/);
});

test("public block CLI builds, inspects, seals, runs, and validates one bounded attempt", async () => {
  const work = await fixture();
  const invoke = (args) => {
    const result = spawnSync(process.execPath, [CLI, "experiment", "block", ...args, "--json"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const built = invoke([
    "build", "--run", work.run, "--isolation-attempt", "l2-ready",
    "--block-attempt", "l3-cli", "--materials", work.materialsPath,
  ]);
  assert.equal(built.status, "candidate");
  assert.equal(invoke(["inspect", "--run", work.run, "--block-attempt", "l3-cli"]).facts.length, 2);
  assert.equal(invoke([
    "seal", "--run", work.run, "--block-attempt", "l3-cli", "--confirm-digest", built.candidate_digest,
  ]).status, "sealed_rehearsal");
  assert.equal(invoke(["run-synthetic", "--run", work.run, "--block-attempt", "l3-cli"]).rows, 4);
  assert.equal(invoke(["validate", "--run", work.run, "--block-attempt", "l3-cli"]).status, "pass");
});
