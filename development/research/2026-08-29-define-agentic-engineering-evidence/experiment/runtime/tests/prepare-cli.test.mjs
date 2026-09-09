import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../cli/define.mjs", import.meta.url));
const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

function validCandidate(index, classification) {
  const high = classification === "high_ambiguity";
  return {
    candidate_id: `task-${index}`,
    repository_commit: "0123456789abcdef0123456789abcdef01234567",
    source_selectors: [`projects/task-${index}/src`],
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
    ambiguity_scores: high
      ? { concept_meaning: 2, context_boundary: 1, ownership_authority: 1, valid_outcome: 0 }
      : { concept_meaning: 0, context_boundary: 0, ownership_authority: 0, valid_outcome: 1 },
    classification,
    classification_reason: high ? "Frozen semantic tension." : "Explicit local behavior.",
    selected: true,
    selection_reason: "Selected before condition output.",
    condition_output_seen_before_selection: false,
    hidden_case_count: 3,
  };
}

async function makeWorkspace() {
  const root = await mkdtemp(join(tmpdir(), "define-prepare-cli-"));
  temporaryRoots.push(root);
  const selection = join(root, "selection.json");
  await writeFile(selection, `${JSON.stringify({
    schema_version: "define-task-selection@1",
    protocol_id: "define-downstream-utility@1",
    evidence_kind: "live_run",
    recorded_at: "2026-08-29T00:00:00Z",
    recorded_by: "test-fixture",
    selection_locked_before_condition_outputs: true,
    candidates: [
      validCandidate(1, "low_ambiguity_control"),
      validCandidate(2, "low_ambiguity_control"),
      validCandidate(3, "high_ambiguity"),
      validCandidate(4, "high_ambiguity"),
      validCandidate(5, "high_ambiguity"),
      validCandidate(6, "high_ambiguity"),
    ],
  }, null, 2)}\n`);
  return { root, run: join(root, "run"), selection };
}

function cli(args, options = {}) {
  return spawnSync(process.execPath, [CLI, "experiment", ...args], {
    encoding: "utf8",
    env: options.env || process.env,
  });
}

function expectPass(result) {
  assert.equal(result.status, 0, `stderr=${result.stderr}\nstdout=${result.stdout}`);
  return result;
}

async function initialize(workspace, env) {
  expectPass(cli([
    "init",
    "--run", workspace.run,
    "--selection", workspace.selection,
    "--experiment-id", "fixture-pilot",
    "--json",
  ], { env }));
}

async function answerAll(run, env) {
  const questions = JSON.parse(expectPass(cli(["questions", "--run", run, "--json"], { env })).stdout);
  for (const question of questions) {
    expectPass(cli([
      "answer", question.question_id, "fixture answer",
      "--run", run,
      "--json",
    ], { env }));
  }
}

test("restart derives the same state and preserves recorded answers", async () => {
  const workspace = await makeWorkspace();
  await initialize(workspace);
  expectPass(cli(["answer", "experiment_owner", "owner-1", "--run", workspace.run]));

  const first = JSON.parse(expectPass(cli(["status", "--run", workspace.run, "--json"])).stdout);
  const restarted = JSON.parse(expectPass(cli(["status", "--run", workspace.run, "--json"])).stdout);
  assert.equal(first.phase, "draft");
  assert.equal(restarted.answered_question_count, 1);
  assert.equal(restarted.open_question_count, first.open_question_count);
  assert.equal(restarted.next_action.question_id, "model_identity");
});

test("unanswered questions remain visible to status, questions, next, and the wizard", async () => {
  const workspace = await makeWorkspace();
  await initialize(workspace);
  const before = cli(["next", "--run", workspace.run]);
  expectPass(before);
  assert.match(before.stdout, /\[experiment_owner\]/);

  expectPass(cli(["answer", "experiment_owner", "owner-1", "--run", workspace.run]));
  const openQuestions = JSON.parse(expectPass(cli(["questions", "--run", workspace.run, "--json"])).stdout);
  assert.equal(openQuestions.some((question) => question.question_id === "experiment_owner"), false);
  assert.equal(openQuestions.some((question) => question.question_id === "model_identity"), true);
  const wizard = expectPass(cli(["--run", workspace.run]));
  assert.match(wizard.stdout, /\[model_identity\]/);
});

test("next performs no transition with an open question and exactly one prepared transition when ready", async () => {
  const workspace = await makeWorkspace();
  await initialize(workspace);
  const eventsBefore = (await readFile(join(workspace.run, "events.jsonl"), "utf8")).trim().split("\n").length;
  const blockedNext = JSON.parse(expectPass(cli(["next", "--run", workspace.run, "--json"])).stdout);
  assert.equal(blockedNext.kind, "question");
  const eventsAfterQuestion = (await readFile(join(workspace.run, "events.jsonl"), "utf8")).trim().split("\n").length;
  assert.equal(eventsAfterQuestion, eventsBefore);

  await answerAll(workspace.run);
  const transition = JSON.parse(expectPass(cli(["next", "--run", workspace.run, "--json"])).stdout);
  assert.equal(transition.kind, "transition");
  assert.equal(transition.state.phase, "prepared");
  const afterTransition = (await readFile(join(workspace.run, "events.jsonl"), "utf8")).trim().split("\n").length;

  const boundary = JSON.parse(expectPass(cli(["next", "--run", workspace.run, "--json"])).stdout);
  assert.equal(boundary.kind, "boundary");
  assert.equal(boundary.state.phase, "prepared");
  const afterBoundary = (await readFile(join(workspace.run, "events.jsonl"), "utf8")).trim().split("\n").length;
  assert.equal(afterBoundary, afterTransition);
});

test("prepare is blocked until required answers exist, then persists prepared state", async () => {
  const workspace = await makeWorkspace();
  await initialize(workspace);
  const blocked = cli(["prepare", "--run", workspace.run]);
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /PREPARE_BLOCKED/);

  await answerAll(workspace.run);
  expectPass(cli(["prepare", "--run", workspace.run]));
  const status = JSON.parse(expectPass(cli(["status", "--run", workspace.run, "--json"])).stdout);
  const manifest = JSON.parse(await readFile(join(workspace.run, "manifest", "experiment-manifest.draft.json"), "utf8"));
  assert.equal(status.phase, "prepared");
  assert.equal(status.open_question_count, 0);
  assert.equal(manifest.status, "prepared");
  assert.equal(manifest.live_authorization.authorized, false);
});

test("exclusive run lock rejects a competing mutation without losing state", async () => {
  const workspace = await makeWorkspace();
  await initialize(workspace);
  await writeFile(join(workspace.run, "run.lock"), "occupied\n", { flag: "wx" });
  const blocked = cli(["answer", "experiment_owner", "owner-1", "--run", workspace.run]);
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /RUN_LOCKED/);
  const status = JSON.parse(expectPass(cli(["status", "--run", workspace.run, "--json"])).stdout);
  assert.equal(status.answered_question_count, 0);
});

test("all L1 operations make zero model calls and never grant live authorization", async () => {
  const workspace = await makeWorkspace();
  const fakeBin = join(workspace.root, "fake-bin");
  const modelSentinel = join(workspace.root, "model-called");
  await import("node:fs/promises").then(({ mkdir }) => mkdir(fakeBin));
  const fakeCodex = join(fakeBin, "codex");
  await writeFile(fakeCodex, `#!/bin/sh\nprintf called > "${modelSentinel}"\nexit 99\n`);
  await chmod(fakeCodex, 0o755);
  const env = { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` };

  await initialize(workspace, env);
  await answerAll(workspace.run, env);
  expectPass(cli(["prepare", "--run", workspace.run], { env }));
  expectPass(cli(["next", "--run", workspace.run], { env }));

  await assert.rejects(readFile(modelSentinel), /ENOENT/);
  const state = JSON.parse(await readFile(join(workspace.run, "state.json"), "utf8"));
  const events = (await readFile(join(workspace.run, "events.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map(JSON.parse);
  assert.equal(state.phase, "prepared");
  assert.equal(state.live_authorized, false);
  assert.equal(state.model_calls, 0);
  assert.equal(events.some((event) => /authoriz|planner|implementer|session/i.test(event.event_type)), false);
});
