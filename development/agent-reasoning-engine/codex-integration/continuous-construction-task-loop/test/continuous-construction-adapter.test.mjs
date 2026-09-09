import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { evaluateExactC19 } from "../runtime/continuous-construction-adapter.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function fixture(scriptBody) {
  const root = await mkdtemp(join(tmpdir(), "are-c19-adapter-"));
  await mkdir(join(root, "bin"));
  const evaluator = join(root, "bin", "evaluator.mjs");
  const program = join(root, "program.json");
  const attempt = join(root, "attempt.json");
  const evaluatorBytes = Buffer.from(`#!/usr/bin/env node\n${scriptBody}\n`);
  const programBytes = Buffer.from('{"program_id":"program-1"}\n');
  const attemptBytes = Buffer.from('{"attempt_id":"attempt-1","program_id":"program-1"}\n');
  await writeFile(evaluator, evaluatorBytes);
  await chmod(evaluator, 0o755);
  await writeFile(program, programBytes);
  await writeFile(attempt, attemptBytes);
  return {
    root,
    input: {
      repositoryRoot: root,
      evaluatorPath: evaluator,
      evaluatorSha256: sha256(evaluatorBytes),
      programPath: program,
      programSha256: sha256(programBytes),
      expectedProgramId: "program-1",
      attemptPath: attempt,
      attemptSha256: sha256(attemptBytes),
      timeoutMs: 1000,
    },
  };
}

test("adapter accepts a closed no-effect C19 result", async (context) => {
  const f = await fixture('process.stdout.write(JSON.stringify({program_id:"program-1",attempt_id:"attempt-1",decision:"CONTINUE",next_action:{kind:"advance-authorized-stage",stage:"canonical-definitions"},effect_authorized:false,authority_effect:"none"}));');
  context.after(() => rm(f.root, { recursive: true, force: true }));
  const result = await evaluateExactC19(f.input);
  assert.equal(result.evaluation.decision, "CONTINUE");
  assert.equal(result.invocation.exit_code, 0);
});

test("digest drift fails before invocation", async (context) => {
  const f = await fixture('process.stdout.write("{}");');
  context.after(() => rm(f.root, { recursive: true, force: true }));
  await assert.rejects(() => evaluateExactC19({ ...f.input, attemptSha256: "0".repeat(64) }), /attempt:digest-drift/);
});

test("malformed evaluator output fails closed", async (context) => {
  const f = await fixture('process.stdout.write("not-json");');
  context.after(() => rm(f.root, { recursive: true, force: true }));
  await assert.rejects(() => evaluateExactC19(f.input), /malformed-json/);
});

test("timeout kills the evaluator and fails closed", async (context) => {
  const f = await fixture('setTimeout(() => process.stdout.write("{}"), 5000);');
  context.after(() => rm(f.root, { recursive: true, force: true }));
  await assert.rejects(() => evaluateExactC19({ ...f.input, timeoutMs: 20 }), /timeout/);
});

test("effect-authorizing output is rejected", async (context) => {
  const f = await fixture('process.stdout.write(JSON.stringify({program_id:"program-1",attempt_id:"attempt-1",decision:"CONTINUE",effect_authorized:true,authority_effect:"none"}));');
  context.after(() => rm(f.root, { recursive: true, force: true }));
  await assert.rejects(() => evaluateExactC19(f.input), /effect-ceiling-violation/);
});

test("wrong evaluator program identity is rejected", async (context) => {
  const f = await fixture('process.stdout.write(JSON.stringify({program_id:"wrong-program",attempt_id:"attempt-1",decision:"CONTINUE",next_action:{kind:"advance-authorized-stage",stage:"canonical-definitions"},effect_authorized:false,authority_effect:"none"}));');
  context.after(() => rm(f.root, { recursive: true, force: true }));
  await assert.rejects(() => evaluateExactC19(f.input), /program-id-mismatch/);
});

test("exact built C19 evaluator returns CONTINUE for its immutable positive fixture", { skip: !process.env.C19_EVALUATOR_PATH }, async () => {
  const repositoryRoot = process.env.REPOSITORY_ROOT;
  assert.ok(repositoryRoot);
  const evaluatorPath = process.env.C19_EVALUATOR_PATH;
  const programPath = join(repositoryRoot, "cyberAlchemy-v2/ontology/governance/continuous-construction/programs/continuous-construction.program.json");
  const attemptPath = join(repositoryRoot, "cyberAlchemy-v2/ontology/governance/continuous-construction/examples/attempts/continue.json");
  const result = await evaluateExactC19({
    repositoryRoot,
    evaluatorPath,
    evaluatorSha256: sha256(await readFile(evaluatorPath)),
    programPath,
    programSha256: sha256(await readFile(programPath)),
    expectedProgramId: "CA2-GOV-PROGRAM-CONTINUOUS-CONSTRUCTION-001",
    attemptPath,
    attemptSha256: sha256(await readFile(attemptPath)),
    timeoutMs: 5000,
  });
  assert.equal(result.evaluation.decision, "CONTINUE");
  assert.equal(result.evaluation.next_action.stage, "business-ontology");
  assert.equal(result.invocation.effect_authorized, false);
});
