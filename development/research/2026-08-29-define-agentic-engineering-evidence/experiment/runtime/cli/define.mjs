#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import {
  answerQuestion,
  getStatus,
  initRun,
  nextStep,
  prepareRun,
} from "./runtime.mjs";
import {
  buildIsolation,
  getIsolationStatus,
  verifyIsolation,
} from "./isolation.mjs";
import {
  buildSyntheticBlock,
  getSyntheticBlockStatus,
  inspectSyntheticBlock,
  runSyntheticBlock,
  sealSyntheticBlock,
  validateSyntheticBlock,
} from "./block.mjs";

const COMMANDS = new Set(["init", "status", "questions", "answer", "prepare", "next", "isolation", "block"]);

function parseArguments(argv) {
  if (argv[0] !== "experiment") throw new Error("USAGE:expected 'experiment'");
  const tail = argv.slice(1);
  const command = COMMANDS.has(tail[0]) ? tail.shift() : "wizard";
  const options = { _: [] };
  while (tail.length) {
    const item = tail.shift();
    if (!item.startsWith("--")) {
      options._.push(item);
      continue;
    }
    const key = item.slice(2);
    if (key === "json" || key === "all") {
      options[key] = true;
      continue;
    }
    if (!tail.length || tail[0].startsWith("--")) throw new Error(`OPTION_VALUE_REQUIRED:${item}`);
    options[key] = tail.shift();
  }
  return { command, options };
}

function printQuestion(question) {
  console.log(`[${question.question_id}] ${question.question}`);
  console.log(`  Why it blocks: ${question.why_it_blocks}`);
  console.log(`  Answer shape: ${question.allowed_answer_shape}`);
}

function printStatus(derived) {
  const state = derived.state;
  console.log(`Experiment: ${state.experiment_id}`);
  console.log(`Run directory: ${derived.paths.root}`);
  console.log(`State: ${state.phase}`);
  console.log(`Selected tasks: ${state.selected_task_count}`);
  console.log(`Answers: ${state.answered_question_count}/${state.answered_question_count + state.open_question_count}`);
  console.log("Live authorization: no");
  console.log("Model calls: 0");
  console.log(`Isolation rehearsal: ${state.isolation_rehearsal}`);
  console.log(`Synthetic block: ${state.synthetic_block_status}`);
  if (state.open_questions.length) {
    console.log("Open questions:");
    for (const question of state.open_questions) printQuestion(question);
  } else if (state.phase === "draft") {
    console.log("Next action: prepare");
  } else {
    console.log(`Next action: ${state.next_action.kind}`);
  }
}

async function promptForAnswer(question) {
  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    printQuestion(question);
    return await terminal.question("Answer: ");
  } finally {
    terminal.close();
  }
}

async function wizard(options) {
  const derived = await getStatus(options.run);
  printStatus(derived);
  if (!stdin.isTTY || !stdout.isTTY) return;
  const next = derived.state.next_action;
  if (next.kind === "answer") {
    const question = derived.state.open_questions[0];
    const answer = await promptForAnswer(question);
    if (!answer.trim()) {
      console.log("No answer recorded; the question remains open.");
      return;
    }
    const updated = await answerQuestion({
      runDirectory: options.run,
      questionId: question.question_id,
      answer,
      actor: options.actor,
    });
    console.log(`Recorded ${question.question_id}. ${updated.state.open_question_count} question(s) remain.`);
    return;
  }
  if (next.kind === "prepare") {
    const terminal = createInterface({ input: stdin, output: stdout });
    try {
      const confirmation = await terminal.question("All preparation questions are answered. Move to prepared? [y/N] ");
      if (/^y(es)?$/i.test(confirmation.trim())) {
        await prepareRun({ runDirectory: options.run, actor: options.actor });
        console.log("State: prepared. No live run was authorized or started.");
      }
    } finally {
      terminal.close();
    }
  }
}

async function main(argv) {
  const { command, options } = parseArguments(argv);
  const actor = options.actor || "local-operator";
  if (command === "init") {
    const derived = await initRun({
      runDirectory: options.run,
      selectionPath: options.selection,
      experimentId: options["experiment-id"],
      actor,
    });
    if (options.json) console.log(JSON.stringify(derived.state));
    else printStatus(derived);
    return;
  }
  if (command === "status") {
    const derived = await getStatus(options.run);
    if (options.json) console.log(JSON.stringify(derived.state));
    else printStatus(derived);
    return;
  }
  if (command === "questions") {
    const derived = await getStatus(options.run);
    const questions = options.all
      ? derived.questions
      : derived.questions.filter((question) => question.status === "open");
    if (options.json) console.log(JSON.stringify(questions));
    else if (!questions.length) console.log("No open questions.");
    else for (const question of questions) printQuestion(question);
    return;
  }
  if (command === "answer") {
    const questionId = options._[0];
    let answer = options.value || options._.slice(1).join(" ");
    if (!answer && stdin.isTTY && stdout.isTTY) {
      const derived = await getStatus(options.run);
      const question = derived.questions.find((item) => item.question_id === questionId);
      if (!question) throw new Error(`QUESTION_UNKNOWN:${questionId}`);
      answer = await promptForAnswer(question);
    }
    const derived = await answerQuestion({
      runDirectory: options.run,
      questionId,
      answer,
      actor,
    });
    if (options.json) console.log(JSON.stringify(derived.state));
    else console.log(`Recorded ${questionId}. ${derived.state.open_question_count} question(s) remain.`);
    return;
  }
  if (command === "prepare") {
    const result = await prepareRun({ runDirectory: options.run, actor });
    if (options.json) console.log(JSON.stringify(result.derived.state));
    else console.log(result.transitioned ? "State: prepared. No live run was authorized or started." : "Already prepared.");
    return;
  }
  if (command === "next") {
    const result = await nextStep({ runDirectory: options.run, actor });
    if (options.json) {
      console.log(JSON.stringify({ kind: result.kind, state: result.derived.state, question: result.question ?? null }));
    } else if (result.kind === "question") {
      printQuestion(result.question);
    } else if (result.kind === "transition") {
      console.log("State: prepared. No live run was authorized or started.");
    } else {
      console.log(result.message || "L1 boundary reached.");
    }
    return;
  }
  if (command === "isolation") {
    const action = options._[0];
    if (action === "build") {
      const result = await buildIsolation({
        runDirectory: options.run,
        repositoryDirectory: options.repository || options.repo || process.cwd(),
        profilePath: options.profile,
        attemptId: options.attempt,
        actor,
      });
      if (options.json) console.log(JSON.stringify(result));
      else {
        console.log(`Isolation rehearsal: ${result.status}`);
        console.log(`Attempt: ${result.attempt_id}`);
        console.log(`Task: ${result.task_id}`);
        console.log(`Receipt: ${result.receipt_path}`);
        console.log(`Agent-visible digest: ${result.trees.agents.ticket_only.digest}`);
        console.log("Live authorization: no");
        console.log("Model calls: 0");
      }
      return;
    }
    if (action === "status") {
      const result = await getIsolationStatus({ runDirectory: options.run, attemptId: options.attempt });
      if (options.json) console.log(JSON.stringify(result));
      else if (result.attempts) {
        console.log(`Isolation rehearsal: ${result.status}`);
        for (const attempt of result.attempts) console.log(`${attempt.attempt_id}: ${attempt.status}`);
      } else {
        console.log(`Isolation rehearsal: ${result.status}`);
        console.log(`Attempt: ${result.attempt_id}`);
        if (result.receipt_path) console.log(`Receipt: ${result.receipt_path}`);
      }
      return;
    }
    if (action === "verify") {
      const result = await verifyIsolation({ runDirectory: options.run, attemptId: options.attempt });
      if (options.json) console.log(JSON.stringify(result));
      else {
        console.log(`Isolation verification: ${result.status}`);
        console.log(`Attempt: ${result.attempt_id}`);
        console.log(`Agent-visible digest: ${result.agent_visible_digest}`);
        console.log("Live authorization: no");
        console.log("Model calls: 0");
      }
      return;
    }
    throw new Error("USAGE:define experiment isolation <build|status|verify>");
  }
  if (command === "block") {
    const action = options._[0];
    const blockAttempt = options["block-attempt"];
    let result;
    if (action === "build") {
      result = await buildSyntheticBlock({
        runDirectory: options.run,
        isolationAttempt: options["isolation-attempt"],
        blockAttempt,
        materialsPath: options.materials,
        actor,
      });
    } else if (action === "inspect") {
      result = await inspectSyntheticBlock({ runDirectory: options.run, blockAttempt });
    } else if (action === "seal") {
      result = await sealSyntheticBlock({
        runDirectory: options.run,
        blockAttempt,
        confirmDigest: options["confirm-digest"],
        actor,
      });
    } else if (action === "run-synthetic") {
      result = await runSyntheticBlock({ runDirectory: options.run, blockAttempt, actor });
    } else if (action === "validate") {
      result = await validateSyntheticBlock({ runDirectory: options.run, blockAttempt, actor });
    } else if (action === "status") {
      result = await getSyntheticBlockStatus({ runDirectory: options.run, blockAttempt });
    } else {
      throw new Error("USAGE:define experiment block <build|inspect|seal|run-synthetic|validate|status>");
    }
    if (options.json) console.log(JSON.stringify(result));
    else {
      console.log(`Synthetic block: ${result.status}`);
      if (result.block_attempt_id) console.log(`Attempt: ${result.block_attempt_id}`);
      if (result.task_id) console.log(`Task: ${result.task_id}`);
      if (result.candidate_digest) console.log(`Candidate digest: ${result.candidate_digest}`);
      console.log("Live authorization: no");
      console.log("Model calls: 0");
    }
    return;
  }
  await wizard(options);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
