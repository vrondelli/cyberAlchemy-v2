import assert from "node:assert/strict";
import {chmodSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {readDshWebReleaseIndex, writeDshWebReleaseIndex} from "../src/web-release-index.mjs";

const sessionId = "session-00000000-0000-0000-0000-000000000001";

test("release index binds only cleanly released IDs to one workspace, manifest and journal head", (context) => {
  const home = mkdtempSync(join(tmpdir(), "are-dsh-release-index-"));
  context.after(() => rmSync(home, {recursive: true, force: true}));
  const binding = {home, workspace: home, manifest_id: "pinned-host", gateway_head_digest: "a".repeat(64)};
  assert.equal(readDshWebReleaseIndex(binding), null);
  assert.deepEqual(writeDshWebReleaseIndex({...binding, session_ids: [sessionId]}).session_ids, [sessionId]);
  assert.deepEqual(readDshWebReleaseIndex(binding).session_ids, [sessionId]);
  assert.throws(() => readDshWebReleaseIndex({...binding, manifest_id: "other"}), /binding-mismatch/);
  assert.throws(() => readDshWebReleaseIndex({...binding, workspace: join(home, "other")}),
    /binding-mismatch/);
  assert.throws(() => readDshWebReleaseIndex({...binding, gateway_head_digest: "b".repeat(64)}),
    /binding-mismatch/);
  const path = join(home, "are-web-released-sessions.json");
  const content = JSON.parse(readFileSync(path, "utf8"));
  writeFileSync(path, `${JSON.stringify({...content, session_ids: []})}\n`, {mode: 0o600});
  assert.throws(() => readDshWebReleaseIndex(binding), /binding-mismatch/);
  assert.deepEqual(writeDshWebReleaseIndex({...binding, session_ids: []}).session_ids, []);
  assert.deepEqual(readDshWebReleaseIndex(binding).session_ids, []);
});

test("release index refuses duplicate IDs, loose files and symlink targets", (context) => {
  const home = mkdtempSync(join(tmpdir(), "are-dsh-release-index-negative-"));
  context.after(() => rmSync(home, {recursive: true, force: true}));
  const binding = {home, workspace: home, manifest_id: "pinned-host", gateway_head_digest: null};
  assert.throws(() => writeDshWebReleaseIndex({...binding, session_ids: [sessionId, sessionId]}),
    /session-ids-invalid/);
  const path = join(home, "are-web-released-sessions.json");
  writeDshWebReleaseIndex({...binding, session_ids: []});
  chmodSync(path, 0o644);
  assert.throws(() => readDshWebReleaseIndex(binding), /file-invalid/);
  assert.throws(() => writeDshWebReleaseIndex({...binding, session_ids: []}), /file-invalid/);
  rmSync(path);
  symlinkSync(join(home, "missing.json"), path);
  assert.throws(() => readDshWebReleaseIndex(binding), /file-invalid/);
  assert.throws(() => writeDshWebReleaseIndex({...binding, session_ids: []}), /file-invalid/);
});
