import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { spawn } from "node:child_process";

const SHA256 = /^[0-9a-f]{64}$/;
const DECISIONS = new Set(["CONTINUE", "STOP", "READY_FOR_HUMAN_TEST", "REQUEST_TERMINAL_CONFIRMATION"]);

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function exactFile(path, expected, label) {
  if (!SHA256.test(expected ?? "")) throw new Error(`${label}:expected-digest-invalid`);
  const bytes = await readFile(path);
  const observed = digest(bytes);
  if (observed !== expected) throw new Error(`${label}:digest-drift:${observed}`);
  return { bytes, observed };
}

async function containedPath(repositoryRoot, candidate, label) {
  const root = await realpath(repositoryRoot);
  const target = await realpath(isAbsolute(candidate) ? candidate : resolve(root, candidate));
  const rel = relative(root, target);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) throw new Error(`${label}:outside-repository`);
  return target;
}

function run(command, args, timeoutMs) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (timedOut) return reject(new Error("c19-evaluator:timeout"));
      resolveResult({ code, signal, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") });
    });
  });
}

export async function evaluateExactC19({
  repositoryRoot,
  evaluatorPath,
  evaluatorSha256,
  programPath,
  programSha256,
  expectedProgramId,
  attemptPath,
  attemptSha256,
  timeoutMs = 5000,
}) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw new Error("timeout:outside-bounds");
  const evaluator = await containedPath(repositoryRoot, evaluatorPath, "evaluator");
  const program = await containedPath(repositoryRoot, programPath, "program");
  const attempt = await containedPath(repositoryRoot, attemptPath, "attempt");
  await exactFile(evaluator, evaluatorSha256, "evaluator");
  const programFile = await exactFile(program, programSha256, "program");
  const attemptFile = await exactFile(attempt, attemptSha256, "attempt");
  let programRecord;
  let attemptRecord;
  try {
    programRecord = JSON.parse(programFile.bytes);
    attemptRecord = JSON.parse(attemptFile.bytes);
  } catch {
    throw new Error("c19-input:malformed-json");
  }
  if (typeof expectedProgramId !== "string" || expectedProgramId.length === 0) throw new Error("program:expected-id-required");
  if (programRecord.program_id !== expectedProgramId) throw new Error("program:id-mismatch");
  if (attemptRecord.program_id !== expectedProgramId) throw new Error("attempt:program-id-mismatch");
  if (typeof attemptRecord.attempt_id !== "string" || attemptRecord.attempt_id.length === 0) throw new Error("attempt:id-required");

  const result = await run(evaluator, ["evaluate", "--program", program, "--attempt", attempt, "--repository-root", await realpath(repositoryRoot)], timeoutMs);
  if (result.code !== 0 && result.code !== 2) throw new Error(`c19-evaluator:exit-${result.code ?? result.signal}`);
  let evaluation;
  try {
    evaluation = JSON.parse(result.stdout);
  } catch {
    throw new Error("c19-evaluator:malformed-json");
  }
  if (!DECISIONS.has(evaluation.decision)) throw new Error("c19-evaluator:unknown-decision");
  if (evaluation.program_id !== expectedProgramId) throw new Error("c19-evaluator:program-id-mismatch");
  if (evaluation.attempt_id !== attemptRecord.attempt_id) throw new Error("c19-evaluator:attempt-id-mismatch");
  if (evaluation.authority_effect !== "none" || evaluation.effect_authorized !== false) throw new Error("c19-evaluator:effect-ceiling-violation");
  if (evaluation.decision === "STOP" && result.code !== 2) throw new Error("c19-evaluator:stop-exit-mismatch");
  if (evaluation.decision !== "STOP" && result.code !== 0) throw new Error("c19-evaluator:continue-exit-mismatch");
  return {
    evaluation,
    invocation: {
      evaluator_sha256: evaluatorSha256,
      program_sha256: programSha256,
      attempt_sha256: attemptSha256,
      exit_code: result.code,
      authority_effect: "none",
      effect_authorized: false,
    },
  };
}
