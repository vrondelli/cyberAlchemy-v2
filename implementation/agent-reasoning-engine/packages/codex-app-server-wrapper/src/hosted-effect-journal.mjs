import {randomBytes} from "node:crypto";
import {closeSync, constants, existsSync, fstatSync, fsyncSync, lstatSync,
  openSync, readFileSync, realpathSync, statSync, unlinkSync, writeSync} from "node:fs";
import {hostname} from "node:os";
import {isAbsolute, join} from "node:path";

import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

const RECORD_SCHEMA = "are.hosted-effect-journal-record/v1";
const WRITER_LOCK_SCHEMA = "are.hosted-effect-journal-writer-lock/v1";
const MAX_JOURNAL_BYTES = 16 * 1024 * 1024;
const MAX_EVENT_BYTES = 128 * 1024;
const MAX_LOCK_BYTES = 4096;

function validEvent(event, current) {
  if (!isRecord(event) || !nonEmptyString(event.effect_id)
    || !/^[0-9a-f]{64}$/.test(event.proposal_digest ?? "")
    || event.authority_effect !== "none") return false;
  if (event.schema_version === "are.hosted-effect-intent/v1") {
    return event.status === "intent" && current === undefined
      && isRecord(event.request) && event.request.effect_id === event.effect_id
      && nonEmptyString(event.engine_decision_digest)
      && nonEmptyString(event.approval_binding_digest);
  }
  if (event.schema_version === "are.hosted-effect-outcome/v1") {
    return event.status === "complete" && current?.status === "intent"
      && current.proposal_digest === event.proposal_digest
      && isRecord(event.result)
      && event.result.schema_version === "are.hosted-effect-result/v1"
      && event.result.effect_id === event.effect_id
      && event.result.proposal_digest === event.proposal_digest;
  }
  return false;
}

function sameFile(path, identity) {
  try {
    const actual = lstatSync(path);
    return actual.isFile() && !actual.isSymbolicLink()
      && actual.dev === identity.dev && actual.ino === identity.ino;
  } catch { return false; }
}

function readWriterLock(lockPath, journalPath) {
  let record;
  try {
    const identity = lstatSync(lockPath);
    if (!identity.isFile() || identity.isSymbolicLink() || identity.size > MAX_LOCK_BYTES
      || (process.platform !== "win32"
        && ((identity.mode & 0o077) !== 0 || identity.uid !== process.getuid()))) {
      throw new Error("hosted-effect.journal-lock-invalid");
    }
    record = JSON.parse(readFileSync(lockPath, "utf8").trim());
  } catch {
    throw new Error("hosted-effect.journal-lock-invalid");
  }
  if (!isRecord(record) || record.schema_version !== WRITER_LOCK_SCHEMA
    || record.journal_path !== journalPath || record.host_name !== hostname()
    || !Number.isSafeInteger(record.process_id) || record.process_id < 1
    || !/^[0-9a-f]{32}$/.test(record.nonce ?? "")
    || !/^[0-9a-f]{64}$/.test(record.lock_digest ?? "")
    || record.authority_effect !== "none" || Object.keys(record).length !== 7) {
    throw new Error("hosted-effect.journal-lock-invalid");
  }
  const material = {...record};
  delete material.lock_digest;
  if (digestValue(material) !== record.lock_digest) throw new Error("hosted-effect.journal-lock-invalid");
  return record;
}

function writerProcessMissing(processId) {
  try { process.kill(processId, 0); return false; }
  catch (error) { return error?.code === "ESRCH"; }
}

function acquireWriterLock(lockPath, journalPath, noFollow) {
  const markerPath = `${lockPath}.recovery.lock`;
  if (existsSync(markerPath)) throw new Error("hosted-effect.journal-lock-recovery-interrupted");
  let descriptor;
  try { descriptor = openSync(lockPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o600); }
  catch (error) {
    if (error?.code !== "EEXIST") throw new Error("hosted-effect.journal-lock-create-failed");
    const old = readWriterLock(lockPath, journalPath);
    if (!writerProcessMissing(old.process_id)) throw new Error("hosted-effect.journal-lock-held");
    let marker;
    try { marker = openSync(markerPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o600); }
    catch { throw new Error("hosted-effect.journal-lock-recovery-interrupted"); }
    const markerIdentity = fstatSync(marker);
    let reclaimed = false;
    try {
      const current = readWriterLock(lockPath, journalPath);
      if (current.lock_digest !== old.lock_digest || !writerProcessMissing(current.process_id)) {
        throw new Error("hosted-effect.journal-lock-held");
      }
      unlinkSync(lockPath);
      try { descriptor = openSync(lockPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | noFollow, 0o600); }
      catch { throw new Error("hosted-effect.journal-lock-recovery-interrupted"); }
      reclaimed = true;
    } finally {
      closeSync(marker);
      if (reclaimed && sameFile(markerPath, markerIdentity)) unlinkSync(markerPath);
    }
  }
  const identity = fstatSync(descriptor);
  const material = {schema_version: WRITER_LOCK_SCHEMA, journal_path: journalPath,
    host_name: hostname(), process_id: process.pid, nonce: randomBytes(16).toString("hex"),
    authority_effect: "none"};
  const record = {...material, lock_digest: digestValue(material)};
  try {
    writeSync(descriptor, `${JSON.stringify(record)}\n`);
    fsyncSync(descriptor);
  } catch {
    closeSync(descriptor);
    if (sameFile(lockPath, identity)) unlinkSync(lockPath);
    throw new Error("hosted-effect.journal-lock-write-failed");
  }
  return {descriptor, identity, record};
}

// Exact private, caller-owned state directory only. A validated dead writer
// may be replaced under an exclusive marker; the journal still replays and
// leaves every unsettled intent unavailable for effect retry.
export function createFileHostedEffectJournal({state_dir: stateDir} = {}) {
  if (typeof stateDir !== "string" || !isAbsolute(stateDir)
    || lstatSync(stateDir).isSymbolicLink() || realpathSync(stateDir) !== stateDir) {
    throw new Error("hosted-effect.journal-directory-invalid");
  }
  const directory = statSync(stateDir);
  if (!directory.isDirectory() || (process.platform !== "win32"
    && ((directory.mode & 0o077) !== 0 || directory.uid !== process.getuid()))) {
    throw new Error("hosted-effect.journal-directory-not-private");
  }
  const journalPath = join(stateDir, "hosted-effects.jsonl");
  const lockPath = join(stateDir, "hosted-effects.lock");
  const noFollow = process.platform === "win32" ? 0 : constants.O_NOFOLLOW;
  let lock, lockIdentity, lockRecord, descriptor;
  try {
    ({descriptor: lock, identity: lockIdentity, record: lockRecord}
      = acquireWriterLock(lockPath, journalPath, noFollow));
    if (lstatSync(journalPath, {throwIfNoEntry: false})?.isSymbolicLink()) {
      throw new Error("hosted-effect.journal-file-invalid");
    }
    descriptor = openSync(journalPath, constants.O_RDWR | constants.O_APPEND | constants.O_CREAT | noFollow, 0o600);
    const identity = fstatSync(descriptor);
    if (!identity.isFile() || identity.size > MAX_JOURNAL_BYTES
      || (process.platform !== "win32"
        && ((identity.mode & 0o077) !== 0 || identity.uid !== process.getuid()))) {
      throw new Error("hosted-effect.journal-file-invalid");
    }
    // On POSIX, persist the new journal directory entry before any effect
    // intent can be accepted. A flushed file alone does not establish that
    // a newly created filename survives sudden power loss.
    if (process.platform !== "win32") {
      const parent = openSync(stateDir, constants.O_RDONLY | constants.O_DIRECTORY);
      try { fsyncSync(parent); }
      finally { closeSync(parent); }
    }
    const bytes = readFileSync(descriptor);
    if (bytes.length !== identity.size || (bytes.length > 0 && bytes.at(-1) !== 10)) {
      throw new Error("hosted-effect.journal-incomplete");
    }
    const states = new Map();
    let sequence = 0;
    let previousDigest = null;
    const lines = bytes.length === 0 ? [] : bytes.toString("utf8").split("\n").slice(0, -1);
    for (const line of lines) {
      if (!line) throw new Error("hosted-effect.journal-corrupt");
      let record;
      try { record = JSON.parse(line); }
      catch { throw new Error("hosted-effect.journal-corrupt"); }
      const material = {schema_version: RECORD_SCHEMA, sequence: sequence + 1,
        previous_digest: previousDigest, event: record.event};
      if (!isRecord(record) || record.schema_version !== RECORD_SCHEMA
        || record.sequence !== sequence + 1 || record.previous_digest !== previousDigest
        || record.record_digest !== digestValue(material)
        || !validEvent(record.event, states.get(record.event?.effect_id))) {
        throw new Error("hosted-effect.journal-corrupt");
      }
      states.set(record.event.effect_id, record.event);
      previousDigest = record.record_digest;
      sequence += 1;
    }
    let faulted = false;
    let closed = false;
    const journal = Object.freeze({
      path: journalPath,
      async get(effectId) {
        if (closed || faulted) throw new Error("hosted-effect.journal-unavailable");
        return states.get(effectId) ?? null;
      },
      async unsettled() {
        if (closed || faulted) throw new Error("hosted-effect.journal-unavailable");
        return freezeResult([...states.values()].filter(entry => entry.status === "intent")
          .map(entry => entry.effect_id));
      },
      async append(event) {
        if (closed || faulted || !validEvent(event, states.get(event?.effect_id))) return {ok: false};
        const material = {schema_version: RECORD_SCHEMA, sequence: sequence + 1,
          previous_digest: previousDigest, event};
        const record = {...material, record_digest: digestValue(material)};
        const line = Buffer.from(`${JSON.stringify(record)}\n`, "utf8");
        if (line.length > MAX_EVENT_BYTES || fstatSync(descriptor).size + line.length > MAX_JOURNAL_BYTES
          || !sameFile(journalPath, identity)) return {ok: false};
        try {
          for (let offset = 0; offset < line.length;) {
            const written = writeSync(descriptor, line, offset, line.length - offset);
            if (written <= 0) throw new Error("hosted-effect.journal-write-failed");
            offset += written;
          }
          fsyncSync(descriptor);
        } catch {
          faulted = true;
          return {ok: false};
        }
        states.set(event.effect_id, freezeResult(event));
        sequence += 1;
        previousDigest = record.record_digest;
        return {ok: true, record_digest: record.record_digest};
      },
      inspect() { return freezeResult({schema_version: "are.hosted-effect-journal-state/v1",
        records: sequence, effects: states.size,
        unsettled: [...states.values()].filter(entry => entry.status === "intent").length,
        faulted, closed, authority_effect: "none"}); },
      close() {
        if (closed) return;
        closed = true;
        closeSync(descriptor);
        closeSync(lock);
        if (sameFile(lockPath, lockIdentity)
          && readWriterLock(lockPath, journalPath).lock_digest === lockRecord.lock_digest) unlinkSync(lockPath);
      },
    });
    return journal;
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    if (lock !== undefined) {
      const identity = fstatSync(lock);
      closeSync(lock);
      if (sameFile(lockPath, identity)) unlinkSync(lockPath);
    }
    throw error;
  }
}
