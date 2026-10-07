import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {createFileHostedEffectJournal} from "../src/hosted-effect-journal.mjs";

const digest = "a".repeat(64);
const intent = {schema_version: "are.hosted-effect-intent/v1", effect_id: "effect-one",
  proposal_digest: digest, engine_decision_digest: "decision", approval_binding_digest: "approval",
  request: {effect_id: "effect-one", kind: "command"}, status: "intent", authority_effect: "none"};
const outcome = {schema_version: "are.hosted-effect-outcome/v1", effect_id: "effect-one",
  proposal_digest: digest, status: "complete", result: {schema_version: "are.hosted-effect-result/v1",
    effect_id: "effect-one", proposal_digest: digest, ok: true, authority_effect: "none"},
  authority_effect: "none"};

function temporaryState() {
  const path = mkdtempSync(join(tmpdir(), "are-hosted-effect-journal-"));
  chmodSync(path, 0o700);
  return path;
}

function terminateWriter(path, complete) {
  const source = `const {createFileHostedEffectJournal} = await import(process.argv[1]);
    const journal = createFileHostedEffectJournal({state_dir: process.argv[2]});
    await journal.append(JSON.parse(process.argv[3]));
    if (process.argv[5] === "complete") await journal.append(JSON.parse(process.argv[4]));
    process.kill(process.pid, "SIGKILL");`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", source,
    new URL("../src/hosted-effect-journal.mjs", import.meta.url).href,
    path, JSON.stringify(intent), JSON.stringify(outcome), complete ? "complete" : "intent"],
  {encoding: "utf8", timeout: 10000});
  assert.notEqual(child.status, 0, child.stderr);
}

test("hosted effect journal fsyncs an intent and outcome across restart", async () => {
  const path = temporaryState();
  try {
    const journal = createFileHostedEffectJournal({state_dir: path});
    const first = await journal.append(intent);
    const second = await journal.append(outcome);
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    assert.notEqual(first.record_digest, second.record_digest);
    assert.equal(journal.inspect().records, 2);
    journal.close();
    const restarted = createFileHostedEffectJournal({state_dir: path});
    assert.deepEqual(await restarted.get("effect-one"), outcome);
    restarted.close();
  } finally { rmSync(path, {recursive: true, force: true}); }
});

test("journal refuses concurrent owners and preserves unsettled intent after restart", async () => {
  const path = temporaryState();
  try {
    const first = createFileHostedEffectJournal({state_dir: path});
    assert.equal((await first.append(intent)).ok, true);
    assert.deepEqual(await first.unsettled(), ["effect-one"]);
    assert.throws(() => createFileHostedEffectJournal({state_dir: path}), /hosted-effect.journal-lock-held/);
    first.close();
    const restarted = createFileHostedEffectJournal({state_dir: path});
    assert.equal((await restarted.get("effect-one")).status, "intent");
    assert.equal((await restarted.append(intent)).ok, false);
    assert.equal((await restarted.append(outcome)).ok, true);
    assert.deepEqual(await restarted.unsettled(), []);
    restarted.close();
    const completed = createFileHostedEffectJournal({state_dir: path});
    assert.deepEqual(await completed.get("effect-one"), outcome);
    completed.close();
  } finally { rmSync(path, {recursive: true, force: true}); }
});

test("journal reclaims only a validated dead writer and preserves complete history", async () => {
  const path = temporaryState();
  try {
    terminateWriter(path, true);
    const reopened = createFileHostedEffectJournal({state_dir: path});
    assert.deepEqual(await reopened.get("effect-one"), outcome);
    assert.deepEqual(await reopened.unsettled(), []);
    reopened.close();
  } finally { rmSync(path, {recursive: true, force: true}); }
});

test("journal recovery retains an unsettled effect without replaying it", async () => {
  const path = temporaryState();
  try {
    terminateWriter(path, false);
    const reopened = createFileHostedEffectJournal({state_dir: path});
    assert.deepEqual(await reopened.unsettled(), ["effect-one"]);
    assert.equal((await reopened.get("effect-one")).status, "intent");
    assert.equal((await reopened.append(intent)).ok, false);
    reopened.close();
  } finally { rmSync(path, {recursive: true, force: true}); }
});

test("legacy, altered, and interrupted journal writer locks remain refused", () => {
  const path = temporaryState();
  try {
    terminateWriter(path, true);
    const lockPath = join(path, "hosted-effects.lock");
    const original = readFileSync(lockPath, "utf8");
    writeFileSync(lockPath, "123:legacy\n", {mode: 0o600});
    assert.throws(() => createFileHostedEffectJournal({state_dir: path}),
      /hosted-effect.journal-lock-invalid/);
    writeFileSync(lockPath, original.replace('"lock_digest":"', '"lock_digest":"f'), {mode: 0o600});
    assert.throws(() => createFileHostedEffectJournal({state_dir: path}),
      /hosted-effect.journal-lock-invalid/);
    writeFileSync(lockPath, original, {mode: 0o600});
    writeFileSync(`${lockPath}.recovery.lock`, "interrupted\n", {mode: 0o600});
    assert.throws(() => createFileHostedEffectJournal({state_dir: path}),
      /hosted-effect.journal-lock-recovery-interrupted/);
  } finally { rmSync(path, {recursive: true, force: true}); }
});

test("journal rejects altered or torn records rather than inventing clean state", async () => {
  const path = temporaryState();
  try {
    const journal = createFileHostedEffectJournal({state_dir: path});
    assert.equal((await journal.append(intent)).ok, true);
    journal.close();
    const file = join(path, "hosted-effects.jsonl");
    const original = readFileSync(file, "utf8");
    writeFileSync(file, original.replace("effect-one", "effect-two"), {mode: 0o600});
    assert.throws(() => createFileHostedEffectJournal({state_dir: path}),
      /hosted-effect.journal-corrupt/);
    writeFileSync(file, original.slice(0, -1), {mode: 0o600});
    assert.throws(() => createFileHostedEffectJournal({state_dir: path}),
      /hosted-effect.journal-incomplete/);
  } finally { rmSync(path, {recursive: true, force: true}); }
});
