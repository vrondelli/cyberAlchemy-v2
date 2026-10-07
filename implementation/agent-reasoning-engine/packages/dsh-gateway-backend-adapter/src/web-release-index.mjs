import {randomBytes} from "node:crypto";
import {closeSync, constants, fsyncSync, lstatSync, openSync,
  readFileSync, renameSync, unlinkSync, writeSync} from "node:fs";
import {join} from "node:path";

import {digestValue} from "../../codex-app-server-wrapper/src/canonical.mjs";

const SCHEMA = "are.dsh-web-release-index/v1";
const NAME = "are-web-released-sessions.json";
const SESSION_ID = /^session-[0-9a-f-]{36}$/u;
const HASH = /^[0-9a-f]{64}$/u;
const MAX_BYTES = 4096;

function fail(reason) { throw new Error(`dsh-web-release-index.${reason}`); }

function existingStat(path) {
  try { return lstatSync(path); }
  catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function validateSessionIds(ids) {
  if (!Array.isArray(ids) || ids.length > 16 || new Set(ids).size !== ids.length
    || ids.some(id => typeof id !== "string" || !SESSION_ID.test(id))) fail("session-ids-invalid");
  return [...ids].sort();
}

function payload({workspace, manifest_id, gateway_head_digest, session_ids}) {
  if (typeof workspace !== "string" || workspace.length === 0
    || typeof manifest_id !== "string" || manifest_id.length === 0
    || gateway_head_digest !== null && !HASH.test(gateway_head_digest)) fail("binding-invalid");
  return {schema_version: SCHEMA, workspace_digest: digestValue(workspace), manifest_id,
    gateway_head_digest, session_ids: validateSessionIds(session_ids)};
}

export function readDshWebReleaseIndex({home, workspace, manifest_id, gateway_head_digest}) {
  const path = join(home, NAME);
  const status = existingStat(path);
  if (!status) return null;
  if (!status.isFile() || status.size > MAX_BYTES || status.size < 2
    || (status.mode & 0o077) !== 0) fail("file-invalid");
  let record;
  try { record = JSON.parse(readFileSync(path, "utf8")); }
  catch { fail("content-invalid"); }
  if (!record || Object.keys(record).sort().join(",") !==
    "gateway_head_digest,manifest_id,record_digest,schema_version,session_ids,workspace_digest"
    || record.schema_version !== SCHEMA || !HASH.test(record.record_digest ?? "")) {
    fail("content-invalid");
  }
  const expected = payload({workspace, manifest_id, gateway_head_digest,
    session_ids: record.session_ids});
  if (record.workspace_digest !== expected.workspace_digest
    || record.manifest_id !== expected.manifest_id
    || record.gateway_head_digest !== expected.gateway_head_digest
    || JSON.stringify(record.session_ids) !== JSON.stringify(expected.session_ids)
    || record.record_digest !== digestValue(expected)) fail("binding-mismatch");
  return Object.freeze({session_ids: Object.freeze(expected.session_ids),
    gateway_head_digest: expected.gateway_head_digest});
}

export function writeDshWebReleaseIndex({home, workspace, manifest_id, gateway_head_digest,
  session_ids}) {
  const recordPayload = payload({workspace, manifest_id, gateway_head_digest, session_ids});
  const record = {...recordPayload, record_digest: digestValue(recordPayload)};
  const bytes = Buffer.from(`${JSON.stringify(record)}\n`);
  if (bytes.length > MAX_BYTES) fail("content-too-large");
  const path = join(home, NAME);
  const existing = existingStat(path);
  if (existing) {
    if (!existing.isFile() || (existing.mode & 0o077) !== 0) fail("file-invalid");
  }
  const temporary = join(home, `.are-web-released-sessions-${randomBytes(12).toString("hex")}.tmp`);
  let descriptor;
  try {
    descriptor = openSync(temporary, constants.O_CREAT | constants.O_EXCL
      | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
    let offset = 0;
    while (offset < bytes.length) offset += writeSync(descriptor, bytes, offset);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, path);
    const directory = openSync(home, constants.O_RDONLY);
    try { fsyncSync(directory); } finally { closeSync(directory); }
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    try { unlinkSync(temporary); } catch { /* A completed rename has no temporary file. */ }
    throw error;
  }
  return Object.freeze({session_ids: Object.freeze(recordPayload.session_ids),
    gateway_head_digest: recordPayload.gateway_head_digest});
}
