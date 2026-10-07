import assert from "node:assert/strict";
import {chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

import {hostedMcpHookProfile, hostedMcpHookTrustPosture,
  validateHostedMcpHookProfile} from "../src/hosted-hook-profile.mjs";

function fixture(context) {
  const root = mkdtempSync(join(tmpdir(), "are-hosted-hook-profile-"));
  const home = join(root, "codex-home");
  mkdirSync(home, {mode: 0o700});
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const path = join(home, "hooks.json");
  const write = value => writeFileSync(path, JSON.stringify(value), {mode: 0o600});
  return {home, path, write};
}

test("managed relay source requires one exact broad PreToolUse profile", context => {
  const {home, write} = fixture(context);
  const expected = hostedMcpHookProfile();
  assert.equal(Object.hasOwn(expected.hooks.PreToolUse[0], "matcher"), false);
  assert.throws(() => validateHostedMcpHookProfile(home), /managed-session.mcp-hook-profile-invalid/);
  write(expected);
  assert.match(validateHostedMcpHookProfile(home).sha256, /^[a-f0-9]{64}$/);
  const narrow = hostedMcpHookProfile();
  narrow.hooks.PreToolUse[0].matcher = "Bash";
  write(narrow);
  assert.throws(() => validateHostedMcpHookProfile(home), /managed-session.mcp-hook-profile-invalid/);
  const extra = hostedMcpHookProfile();
  extra.hooks.PermissionRequest = [];
  write(extra);
  assert.throws(() => validateHostedMcpHookProfile(home), /managed-session.mcp-hook-profile-invalid/);
});

test("managed relay source rejects public or oversized hook files", context => {
  const {home, path, write} = fixture(context);
  write(hostedMcpHookProfile());
  if (process.platform !== "win32") {
    chmodSync(path, 0o644);
    assert.throws(() => validateHostedMcpHookProfile(home), /managed-session.mcp-hook-profile-invalid/);
    chmodSync(path, 0o600);
  }
  write({hooks: hostedMcpHookProfile().hooks, padding: "x".repeat(8192)});
  assert.throws(() => validateHostedMcpHookProfile(home), /managed-session.mcp-hook-profile-invalid/);
});

test("native hooks/list must expose exactly the enabled trusted source entries", context => {
  const {path} = fixture(context);
  const hooks = ["pre_tool_use", "user_prompt_submit", "stop"].map(event => ({
    key: `${path}:${event}:0:0`, sourcePath: path,
    currentHash: `sha256:${"a".repeat(64)}`, trustStatus: "trusted", enabled: true}));
  const listed = {data: [{hooks}], nextCursor: null};
  assert.deepEqual(hostedMcpHookTrustPosture(listed, path), {ok: true});
  for (const invalid of [
    {data: [{hooks: hooks.slice(1)}], nextCursor: null},
    {data: [{hooks}], nextCursor: "next"},
    {data: [{hooks: [{...hooks[0], trustStatus: "untrusted"}, ...hooks.slice(1)]}], nextCursor: null},
    {data: [{hooks: [{...hooks[0], enabled: false}, ...hooks.slice(1)]}], nextCursor: null},
    {data: [{hooks: [{...hooks[0], sourcePath: "other"}, ...hooks.slice(1)]}], nextCursor: null},
    {data: [{hooks: [{...hooks[0], currentHash: "invalid"}, ...hooks.slice(1)]}], nextCursor: null},
    {data: [{hooks: [...hooks, hooks[0]]}], nextCursor: null},
  ]) assert.deepEqual(hostedMcpHookTrustPosture(invalid, path), {ok: false});
});
