import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, test } from "node:test";

import {
  buildIsolation,
  getIsolationStatus,
  isolationConstants,
  verifyIsolation,
} from "../cli/isolation.mjs";

const CLI = new URL("../cli/define.mjs", import.meta.url).pathname;

const temporaryRoots = [];
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
    if (!info.isDirectory()) {
      await chmod(path, 0o600);
      return;
    }
    await chmod(path, 0o700);
    for (const entry of await readdir(path)) await makeWritable(join(path, entry));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function command(cwd, name, args) {
  const result = spawnSync(name, args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `${name} ${args.join(" ")}\n${result.stderr}`);
  return result.stdout.trim();
}

function commandBytes(cwd, name, args) {
  const result = spawnSync(name, args, { cwd });
  assert.equal(result.status, 0, `${name} ${args.join(" ")}\n${result.stderr}`);
  return result.stdout;
}

async function put(root, path, contents) {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents);
}

async function fixture(options = {}) {
  const root = await mkdtemp(join(tmpdir(), "define-isolation-core-"));
  temporaryRoots.push(root);
  const repository = join(root, "repository");
  await mkdir(repository);
  command(repository, "git", ["init", "--quiet"]);
  command(repository, "git", ["config", "user.name", "Fixture"]);
  command(repository, "git", ["config", "user.email", "fixture@example.test"]);
  await put(repository, VISIBLE[0], "{\"type\":\"module\"}\n");
  await put(repository, VISIBLE[1], "lockfileVersion: '9.0'\n");
  await put(repository, VISIBLE[2], "export const canonicalizeHtml = () => 'ORIGINAL_SECRET';\n");
  await put(repository, VISIBLE[3], "{\"compilerOptions\":{}}\n");
  await put(repository, HIDDEN, "test('hidden truth', () => {});\n");
  await put(repository, "fixture/backend/src/unrelated.ts", "export const retained = true;\n");
  const stubPath = "runtime-fixtures/canonicalize.ts";
  const stubBytes = Buffer.from("export const canonicalizeHtml = () => { throw new Error('UNIMPLEMENTED'); };\n");
  await put(repository, stubPath, stubBytes);
  if (options.symlinkVisible) {
    await symlink("package.json", join(repository, "fixture/backend/link.json"));
  }
  command(repository, "git", ["add", "."]);
  command(repository, "git", ["commit", "--quiet", "-m", "fixture"]);
  const commit = command(repository, "git", ["rev-parse", "HEAD"]);

  const run = join(root, "run");
  await mkdir(join(run, "manifest"), { recursive: true });
  await writeFile(join(run, "events.jsonl"), "");
  await writeFile(join(run, "questions.jsonl"), "");
  await writeFile(join(run, "answers.jsonl"), "");
  await writeFile(join(run, "state.json"), `${JSON.stringify({
    schema_version: "define-runtime-state@1",
    experiment_id: "fixture-experiment",
    phase: options.phase ?? "prepared",
    open_question_count: options.openQuestions ?? 0,
    live_authorized: false,
    model_calls: 0,
  })}\n`);
  await writeFile(join(run, "manifest", "experiment-manifest.draft.json"), `${JSON.stringify({
    protocol_id: "define-downstream-utility@1",
    experiment_id: "fixture-experiment",
  })}\n`);
  await writeFile(join(run, "manifest", "task-selection.json"), `${JSON.stringify({
    candidates: [{ candidate_id: "fixture-task", selected: true, repository_commit: commit }],
  })}\n`);

  const profile = {
    schema_version: "define-task-runtime-profile@1",
    task_id: "fixture-task",
    repository_commit: commit,
    visible_source_paths: options.symlinkVisible ? [...VISIBLE, "fixture/backend/link.json"] : VISIBLE,
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
  const baselineReceiptPath = "runtime-fixtures/baseline-receipt.json";
  const baselineReceipt = {
    schema_version: "define-task-baseline-receipt@1",
    task_id: profile.task_id,
    repository_commit: commit,
    source: "git-object-database",
    worktree_bytes_used: false,
    visible_source_files: VISIBLE.map((path) => ({
      path,
      sha256: sha256(commandBytes(repository, "git", ["show", `${commit}:${path}`])),
    })),
    dependency_closure_digest: profile.dependency_closure_digest,
    hidden_test_path: HIDDEN,
    hidden_test_sha256: sha256(commandBytes(repository, "git", ["show", `${commit}:${HIDDEN}`])),
    authority_effect: "none",
  };
  const baselineBytes = Buffer.from(`${JSON.stringify(baselineReceipt, null, 2)}\n`);
  await put(repository, baselineReceiptPath, baselineBytes);
  profile.baseline_receipt_path = baselineReceiptPath;
  profile.baseline_receipt_digest = sha256(baselineBytes);
  const profilePath = join(root, "profile.json");
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
  return { root, repository, run, profile, profilePath, commit, stubBytes };
}

test("build uses exact commit bytes, creates four equal agent bases, and separates evaluator truth", async () => {
  const work = await fixture();
  await writeFile(join(work.repository, VISIBLE[0]), "DIRTY_WORKTREE_INJECTION\n");
  const receipt = await buildIsolation({
    runDirectory: work.run,
    repositoryDirectory: work.repository,
    profilePath: work.profilePath,
    attemptId: "attempt-001",
    actor: "test",
  });
  assert.equal(receipt.status, "ready");
  assert.equal(receipt.live_authorized, false);
  assert.equal(receipt.model_calls, 0);
  assert.equal(receipt.source.worktree_bytes_used, false);
  const conditions = isolationConstants().CONDITIONS;
  const digests = conditions.map((condition) => receipt.trees.agents[condition].digest);
  assert.equal(new Set(digests).size, 1);
  for (const condition of conditions) {
    const base = join(work.run, "isolation", "attempts", "attempt-001", "agent-bases", condition);
    assert.equal((await readFile(join(base, VISIBLE[0]), "utf8")).includes("DIRTY_WORKTREE_INJECTION"), false);
    await assert.rejects(readFile(join(base, HIDDEN)), /ENOENT/);
    assert.deepEqual(await readFile(join(base, TARGET)), work.stubBytes);
  }
  const evaluator = join(work.run, "isolation", "attempts", "attempt-001", "evaluator-base");
  assert.match(await readFile(join(evaluator, HIDDEN), "utf8"), /hidden truth/);
  assert.deepEqual(await readFile(join(evaluator, TARGET)), work.stubBytes);
  assert.equal((await verifyIsolation({ runDirectory: work.run, attemptId: "attempt-001" })).status, "pass");
  assert.equal((await getIsolationStatus({ runDirectory: work.run, attemptId: "attempt-001" })).status, "ready");
});

test("restart verification detects one-byte condition drift", async () => {
  const work = await fixture();
  await buildIsolation({ runDirectory: work.run, repositoryDirectory: work.repository, profilePath: work.profilePath, attemptId: "attempt-drift" });
  const target = join(work.run, "isolation", "attempts", "attempt-drift", "agent-bases", "ticket_only", TARGET);
  await chmod(dirname(target), 0o755);
  await chmod(target, 0o644);
  await writeFile(target, "x", { flag: "a" });
  await assert.rejects(
    verifyIsolation({ runDirectory: work.run, attemptId: "attempt-drift" }),
    /ISOLATION_VERIFY_FAILED:AGENT_TREE_DRIFT,AGENT_VISIBLE_DIGEST_MISMATCH/,
  );
});

test("leaking original implementation markers fails closed and preserves failure evidence", async () => {
  const work = await fixture();
  const leaky = Buffer.from("export const leaked = 'ORIGINAL_SECRET';\n");
  await writeFile(join(work.repository, work.profile.stub_fixture_path), leaky);
  work.profile.stub_fixture_sha256 = sha256(leaky);
  await writeFile(work.profilePath, `${JSON.stringify(work.profile)}\n`);
  await assert.rejects(
    buildIsolation({ runDirectory: work.run, repositoryDirectory: work.repository, profilePath: work.profilePath, attemptId: "attempt-leak" }),
    /ISOLATION_BUILD_FAILED:ISOLATION_AUDIT_FAILED/,
  );
  const status = await getIsolationStatus({ runDirectory: work.run, attemptId: "attempt-leak" });
  assert.equal(status.status, "failed");
  assert.equal(status.live_authorized, false);
  assert.equal(status.model_calls, 0);
  assert.ok(status.blockers.some((item) => item.code.includes("agent_original_marker_absent")));
});

test("traversal and committed symlink profiles are rejected", async () => {
  const traversal = await fixture();
  traversal.profile.visible_source_paths = ["../escape"];
  await writeFile(traversal.profilePath, `${JSON.stringify(traversal.profile)}\n`);
  await assert.rejects(
    buildIsolation({ runDirectory: traversal.run, repositoryDirectory: traversal.repository, profilePath: traversal.profilePath, attemptId: "attempt-traversal" }),
    /PROFILE_PATH_INVALID/,
  );

  const linked = await fixture({ symlinkVisible: true });
  await assert.rejects(
    buildIsolation({ runDirectory: linked.run, repositoryDirectory: linked.repository, profilePath: linked.profilePath, attemptId: "attempt-symlink" }),
    /COMMIT_PATH_MODE_REJECTED/,
  );
});

test("duplicate attempts, a competing lock, and non-prepared state fail without authority", async () => {
  const work = await fixture();
  await buildIsolation({ runDirectory: work.run, repositoryDirectory: work.repository, profilePath: work.profilePath, attemptId: "attempt-once" });
  await assert.rejects(
    buildIsolation({ runDirectory: work.run, repositoryDirectory: work.repository, profilePath: work.profilePath, attemptId: "attempt-once" }),
    /ISOLATION_ATTEMPT_EXISTS/,
  );

  await writeFile(join(work.run, "run.lock"), "occupied\n", { flag: "wx" });
  await assert.rejects(
    buildIsolation({ runDirectory: work.run, repositoryDirectory: work.repository, profilePath: work.profilePath, attemptId: "attempt-lock" }),
    /RUN_LOCKED/,
  );
  await rm(join(work.run, "run.lock"));

  const draft = await fixture({ phase: "draft" });
  await assert.rejects(
    buildIsolation({ runDirectory: draft.run, repositoryDirectory: draft.repository, profilePath: draft.profilePath, attemptId: "attempt-draft" }),
    /ISOLATION_REQUIRES_PREPARED/,
  );
  const state = JSON.parse(await readFile(work.run + "/state.json", "utf8"));
  assert.equal(state.live_authorized, false);
  assert.equal(state.model_calls, 0);
});

test("public isolation build, status, and verify commands share the persisted rehearsal", async () => {
  const work = await fixture();
  const build = spawnSync(process.execPath, [
    CLI, "experiment", "isolation", "build",
    "--run", work.run,
    "--profile", work.profilePath,
    "--attempt", "attempt-cli",
    "--repository", work.repository,
    "--json",
  ], { encoding: "utf8" });
  assert.equal(build.status, 0, build.stderr);
  assert.equal(JSON.parse(build.stdout).status, "ready");

  const status = spawnSync(process.execPath, [
    CLI, "experiment", "isolation", "status",
    "--run", work.run,
    "--attempt", "attempt-cli",
    "--json",
  ], { encoding: "utf8" });
  assert.equal(status.status, 0, status.stderr);
  assert.equal(JSON.parse(status.stdout).status, "ready");

  const verify = spawnSync(process.execPath, [
    CLI, "experiment", "isolation", "verify",
    "--run", work.run,
    "--attempt", "attempt-cli",
    "--json",
  ], { encoding: "utf8" });
  assert.equal(verify.status, 0, verify.stderr);
  assert.equal(JSON.parse(verify.stdout).status, "pass");
});
