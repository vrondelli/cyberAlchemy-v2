import { createHash, randomUUID } from "node:crypto";
import {
  appendFile,
  copyFile,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getIsolationStatus } from "./isolation.mjs";
import { getSyntheticBlockStatus } from "./block.mjs";

const PROTOCOL_ID = "define-downstream-utility@1";
const EVENT_SCHEMA = "define-runtime-event@1";
const QUESTION_SCHEMA = "define-runtime-question@1";
const ANSWER_SCHEMA = "define-runtime-answer@1";
const STATE_SCHEMA = "define-runtime-state@1";
const MANIFEST_SCHEMA = "define-experiment-manifest-draft@1";

const VALIDATOR_PATH = fileURLToPath(
  new URL("../../evidence/validate_task_selection.py", import.meta.url),
);

export const PREPARATION_QUESTIONS = Object.freeze([
  {
    question_id: "experiment_owner",
    question: "Who owns the experiment and may later authorize its live run?",
    why_it_blocks: "The future freeze and authorization gates need a named owner.",
    allowed_answer_shape: "One person or accountable owner identifier.",
  },
  {
    question_id: "model_identity",
    question: "Which exact model identity is proposed for planner and implementer sessions?",
    why_it_blocks: "Every condition in a task block must use the same frozen model identity.",
    allowed_answer_shape: "Provider and exact model/version identifier; this does not authorize a call.",
  },
  {
    question_id: "harness_identity",
    question: "Which exact session harness or adapter identity is proposed?",
    why_it_blocks: "The execution surface must be stable inside each task block.",
    allowed_answer_shape: "Adapter name plus version or immutable digest.",
  },
  {
    question_id: "planner_budget",
    question: "What is the proposed planner budget per cell?",
    why_it_blocks: "Resource equality must be frozen before condition assignment.",
    allowed_answer_shape: "Concrete token and time limits.",
  },
  {
    question_id: "implementer_budget",
    question: "What is the proposed implementer budget per cell?",
    why_it_blocks: "Resource equality must be frozen before condition assignment.",
    allowed_answer_shape: "Concrete token and time limits.",
  },
  {
    question_id: "randomization_seed",
    question: "What seed will determine condition order inside each task block?",
    why_it_blocks: "Condition order must be reproducible and fixed before outputs exist.",
    allowed_answer_shape: "A non-empty seed string or integer written as text.",
  },
  {
    question_id: "reviewer_identities",
    question: "Who are the two proposed blinded reviewers?",
    why_it_blocks: "The protocol requires two independent reviews for every cell.",
    allowed_answer_shape: "Two distinct reviewer identifiers and their reviewer type.",
  },
  {
    question_id: "privacy_boundary",
    question: "What repository material may the experiment copy into local sandboxes?",
    why_it_blocks: "The controller must not expose private or unrelated repository material.",
    allowed_answer_shape: "A concrete local-only scope and explicit exclusions.",
  },
  {
    question_id: "cost_ceiling",
    question: "What total live cost ceiling is proposed for the pilot?",
    why_it_blocks: "A later live authorization must bind a finite budget.",
    allowed_answer_shape: "Currency and maximum amount, or an explicit zero for rehearsal only.",
  },
  {
    question_id: "external_effect_envelope",
    question: "What external effects are permitted during the pilot?",
    why_it_blocks: "The runtime must stop any effect outside the authorized sandbox.",
    allowed_answer_shape: "Use 'none' for the recommended first pilot, or list exact effects.",
  },
]);

function now() {
  return new Date().toISOString();
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function atomicJson(path, value) {
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  await rename(temporary, path);
}

async function appendJsonLine(path, value) {
  await appendFile(path, `${JSON.stringify(value)}\n`, { encoding: "utf8" });
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readJsonLines(path) {
  const text = await readFile(path, "utf8");
  if (!text.trim()) return [];
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`INVALID_JSONL:${path}:${index + 1}:${error.message}`);
      }
    });
}

function assertRunDirectory(runDirectory) {
  if (!runDirectory) throw new Error("RUN_REQUIRED:pass --run <run-directory>");
  return resolve(runDirectory);
}

function runPaths(runDirectory) {
  const root = assertRunDirectory(runDirectory);
  return {
    root,
    lock: join(root, "run.lock"),
    events: join(root, "events.jsonl"),
    questions: join(root, "questions.jsonl"),
    answers: join(root, "answers.jsonl"),
    state: join(root, "state.json"),
    manifestDirectory: join(root, "manifest"),
    manifest: join(root, "manifest", "experiment-manifest.draft.json"),
    selection: join(root, "manifest", "task-selection.json"),
  };
}

async function assertInitialized(paths) {
  for (const path of [paths.events, paths.questions, paths.answers, paths.manifest, paths.selection]) {
    if (!(await pathExists(path))) throw new Error(`RUN_NOT_INITIALIZED:${paths.root}`);
  }
}

async function withRunLock(paths, operation) {
  let handle;
  try {
    handle = await open(paths.lock, "wx", 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error(`RUN_LOCKED:${paths.root}`);
    throw error;
  }
  try {
    await handle.writeFile(`${JSON.stringify({ pid: process.pid, acquired_at: now() })}\n`);
    return await operation();
  } finally {
    await handle.close();
    await rm(paths.lock, { force: true });
  }
}

function validateSelection(selectionPath) {
  const result = spawnSync(
    "python3",
    [VALIDATOR_PATH, "--live-pilot", selectionPath],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (result.error) {
    throw new Error(`SELECTION_VALIDATOR_UNAVAILABLE:${result.error.message}`);
  }
  if (result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`SELECTION_INVALID:${details}`);
  }
  return result.stdout.trim();
}

function latestAnswers(answers) {
  const byQuestion = new Map();
  for (const answer of answers) byQuestion.set(answer.question_id, answer);
  return byQuestion;
}

function phaseFromEvents(events) {
  return events.length ? events.at(-1).result_state : "draft";
}

function questionsWithStatus(questions, answers) {
  const byQuestion = latestAnswers(answers);
  return questions.map((question) => {
    const answer = byQuestion.get(question.question_id);
    return answer
      ? { ...question, status: "answered", answer: answer.answer, answered_at: answer.answered_at }
      : { ...question, status: "open" };
  });
}

async function derive(runDirectory) {
  const paths = runPaths(runDirectory);
  await assertInitialized(paths);
  const isolationPromise = (await pathExists(paths.state))
    ? getIsolationStatus({ runDirectory: paths.root })
    : Promise.resolve({ status: "absent", attempts: [] });
  const blockPromise = (await pathExists(paths.state))
    ? getSyntheticBlockStatus({ runDirectory: paths.root })
    : Promise.resolve({ status: "absent", attempts: [] });
  const [manifest, events, questions, answers, isolation, block] = await Promise.all([
    readJson(paths.manifest),
    readJsonLines(paths.events),
    readJsonLines(paths.questions),
    readJsonLines(paths.answers),
    isolationPromise,
    blockPromise,
  ]);
  const mergedQuestions = questionsWithStatus(questions, answers);
  const openQuestions = mergedQuestions.filter((question) => question.status === "open");
  const phase = phaseFromEvents(events);
  const nextAction = openQuestions.length
    ? { kind: "answer", question_id: openQuestions[0].question_id }
    : phase === "draft"
      ? { kind: "prepare" }
      : isolation.status === "absent"
        ? { kind: "isolation_build", reason: "L2 may build a zero-model isolation rehearsal." }
        : block.status === "absent"
          ? { kind: "block_build", reason: "L3 may build one zero-model synthetic task block." }
          : block.status === "candidate"
            ? { kind: "block_seal", reason: "Inspect and confirm the candidate digest." }
            : block.status === "sealed_rehearsal"
              ? { kind: "block_run_synthetic" }
              : block.status === "synthetic_complete"
                ? { kind: "block_validate" }
                : { kind: "native_cell_not_implemented", reason: "L3 is validated; L4 remains unavailable." };
  return {
    paths,
    manifest,
    events,
    questions: mergedQuestions,
    answers,
    state: {
      schema_version: STATE_SCHEMA,
      protocol_id: PROTOCOL_ID,
      experiment_id: manifest.experiment_id,
      phase,
      selection_digest: manifest.task_selection.sha256,
      selected_task_count: manifest.task_selection.selected_task_ids.length,
      answered_question_count: mergedQuestions.length - openQuestions.length,
      open_question_count: openQuestions.length,
      open_questions: openQuestions,
      next_action: nextAction,
      isolation_rehearsal: isolation.status,
      isolation_attempts: isolation.attempts ?? [],
      synthetic_block_status: block.status,
      synthetic_block_attempts: block.attempts ?? [],
      live_authorized: false,
      model_calls: 0,
      last_event_sequence: events.length ? events.at(-1).sequence : 0,
      derived_at: now(),
    },
  };
}

async function writeDerived(runDirectory) {
  const derived = await derive(runDirectory);
  const answerValues = Object.fromEntries(
    derived.answers.map((answer) => [answer.question_id, answer.answer]),
  );
  const manifest = {
    ...derived.manifest,
    status: derived.state.phase,
    preparation_answers: answerValues,
    unanswered_question_ids: derived.state.open_questions.map((question) => question.question_id),
    live_authorization: { status: "not_authorized", authorized: false },
    model_execution: { status: "disabled_in_l1", calls: 0 },
    updated_at: now(),
  };
  await atomicJson(derived.paths.manifest, manifest);
  const refreshed = await derive(runDirectory);
  await atomicJson(refreshed.paths.state, refreshed.state);
  return refreshed;
}

async function appendEvent(paths, event) {
  const events = await readJsonLines(paths.events);
  const sequence = events.length + 1;
  await appendJsonLine(paths.events, {
    schema_version: EVENT_SCHEMA,
    sequence,
    recorded_at: now(),
    experiment_id: event.experiment_id,
    task_id: null,
    condition: null,
    cell_id: null,
    event_type: event.event_type,
    actor_or_adapter: event.actor_or_adapter,
    prior_state: event.prior_state,
    result_state: event.result_state,
    input_digests: event.input_digests ?? {},
    output_digests: event.output_digests ?? {},
    session_id: null,
    status: "success",
    deviation_codes: [],
  });
}

export async function initRun({ runDirectory, selectionPath, experimentId, actor = "local-operator" }) {
  if (!selectionPath) throw new Error("SELECTION_REQUIRED:pass --selection <task-selection.json>");
  const paths = runPaths(runDirectory);
  const sourceSelection = resolve(selectionPath);
  const validatorOutput = validateSelection(sourceSelection);
  const selectionBytes = await readFile(sourceSelection);
  const selection = JSON.parse(selectionBytes.toString("utf8"));
  const selectedTaskIds = selection.candidates
    .filter((candidate) => candidate.selected)
    .map((candidate) => candidate.candidate_id);
  const resolvedExperimentId = experimentId || `define-pilot-${Date.now()}`;

  if (await pathExists(paths.root)) throw new Error(`RUN_EXISTS:${paths.root}`);
  await mkdir(paths.root);
  return withRunLock(paths, async () => {
    await mkdir(paths.manifestDirectory);
    await Promise.all([
      writeFile(paths.events, "", { flag: "wx" }),
      writeFile(paths.questions, "", { flag: "wx" }),
      writeFile(paths.answers, "", { flag: "wx" }),
    ]);
    await copyFile(sourceSelection, paths.selection);
    const copiedBytes = await readFile(paths.selection);
    if (sha256(copiedBytes) !== sha256(selectionBytes)) {
      throw new Error("SELECTION_COPY_DIGEST_MISMATCH");
    }
    validateSelection(paths.selection);
    const createdAt = now();
    await atomicJson(paths.manifest, {
      schema_version: MANIFEST_SCHEMA,
      protocol_id: PROTOCOL_ID,
      experiment_id: resolvedExperimentId,
      status: "draft",
      created_at: createdAt,
      updated_at: createdAt,
      task_selection: {
        copied_path: "manifest/task-selection.json",
        source_path: sourceSelection,
        sha256: sha256(copiedBytes),
        validator: "validate_task_selection.py --live-pilot",
        validator_output: validatorOutput,
        selected_task_ids: selectedTaskIds,
      },
      preparation_answers: {},
      unanswered_question_ids: PREPARATION_QUESTIONS.map((question) => question.question_id),
      live_authorization: { status: "not_authorized", authorized: false },
      model_execution: { status: "disabled_in_l1", calls: 0 },
    });
    await appendEvent(paths, {
      experiment_id: resolvedExperimentId,
      event_type: "run_initialized",
      actor_or_adapter: actor,
      prior_state: null,
      result_state: "draft",
      input_digests: { task_selection: sha256(selectionBytes) },
      output_digests: { bound_task_selection: sha256(copiedBytes) },
    });
    for (const question of PREPARATION_QUESTIONS) {
      const record = {
        schema_version: QUESTION_SCHEMA,
        experiment_id: resolvedExperimentId,
        cell_id: null,
        ...question,
        asked_at: createdAt,
        status: "open",
      };
      await appendJsonLine(paths.questions, record);
      await appendEvent(paths, {
        experiment_id: resolvedExperimentId,
        event_type: "question_asked",
        actor_or_adapter: "prepare-cli",
        prior_state: "draft",
        result_state: "draft",
        output_digests: { question: sha256(JSON.stringify(record)) },
      });
    }
    return writeDerived(paths.root);
  });
}

export async function getStatus(runDirectory) {
  return derive(runDirectory);
}

export async function answerQuestion({ runDirectory, questionId, answer, actor = "local-operator" }) {
  if (!questionId) throw new Error("QUESTION_ID_REQUIRED");
  if (typeof answer !== "string" || !answer.trim()) throw new Error("ANSWER_REQUIRED");
  const paths = runPaths(runDirectory);
  await assertInitialized(paths);
  return withRunLock(paths, async () => {
    const current = await derive(paths.root);
    if (current.state.phase !== "draft") throw new Error(`ANSWER_NOT_ALLOWED:${current.state.phase}`);
    const question = current.questions.find((item) => item.question_id === questionId);
    if (!question) throw new Error(`QUESTION_UNKNOWN:${questionId}`);
    if (question.status === "answered") throw new Error(`QUESTION_ALREADY_ANSWERED:${questionId}`);
    const record = {
      schema_version: ANSWER_SCHEMA,
      answer_id: randomUUID(),
      experiment_id: current.state.experiment_id,
      question_id: questionId,
      answer: answer.trim(),
      answered_at: now(),
      answered_by: actor,
    };
    await appendJsonLine(paths.answers, record);
    await appendEvent(paths, {
      experiment_id: current.state.experiment_id,
      event_type: "question_answered",
      actor_or_adapter: actor,
      prior_state: "draft",
      result_state: "draft",
      input_digests: { question: sha256(JSON.stringify(question)) },
      output_digests: { answer: sha256(JSON.stringify(record)) },
    });
    return writeDerived(paths.root);
  });
}

async function prepareLocked(paths, actor) {
  const current = await derive(paths.root);
  if (current.state.phase === "prepared") return { derived: current, transitioned: false };
  if (current.state.phase !== "draft") throw new Error(`PREPARE_NOT_ALLOWED:${current.state.phase}`);
  if (current.state.open_question_count > 0) {
    throw new Error(`PREPARE_BLOCKED:unanswered_questions=${current.state.open_question_count}`);
  }
  await appendEvent(paths, {
    experiment_id: current.state.experiment_id,
    event_type: "preparation_completed",
    actor_or_adapter: actor,
    prior_state: "draft",
    result_state: "prepared",
  });
  return { derived: await writeDerived(paths.root), transitioned: true };
}

export async function prepareRun({ runDirectory, actor = "local-operator" }) {
  const paths = runPaths(runDirectory);
  await assertInitialized(paths);
  return withRunLock(paths, () => prepareLocked(paths, actor));
}

export async function nextStep({ runDirectory, actor = "local-operator" }) {
  const paths = runPaths(runDirectory);
  await assertInitialized(paths);
  const initial = await derive(paths.root);
  if (initial.state.open_question_count > 0) {
    return {
      kind: "question",
      question: initial.state.open_questions[0],
      derived: initial,
    };
  }
  if (initial.state.phase !== "draft") {
    return {
      kind: "boundary",
      derived: initial,
      message: initial.state.isolation_rehearsal === "absent"
        ? "Prepared. L2 isolation rehearsal is available; no live run is authorized."
        : initial.state.synthetic_block_status === "absent"
          ? "L2 is ready. L3 synthetic block construction is available; no live run is authorized."
          : initial.state.synthetic_block_status === "validated"
            ? "L3 is validated. L4 native execution is not implemented or authorized."
            : `L3 next action: ${initial.state.next_action.kind}.`,
    };
  }
  return withRunLock(paths, async () => {
    const result = await prepareLocked(paths, actor);
    return { kind: result.transitioned ? "transition" : "boundary", ...result };
  });
}

export function runtimeConstants() {
  return { PROTOCOL_ID, VALIDATOR_PATH };
}
