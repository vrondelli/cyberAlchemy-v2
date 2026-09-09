import assert from "node:assert/strict";
import {chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {createChatWorkspace, discoverCodingConfig, discoverExecutable} from "../src/chat-workspace.mjs";

test("chat workspace is unique, private, and outside the selected repository", () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-chat-workspace-test-"));
  const repositoryRoot = resolve(root, "repository");
  mkdirSync(repositoryRoot);
  try {
    const first = createChatWorkspace({repositoryRoot, baseDirectory: root});
    const second = createChatWorkspace({repositoryRoot, baseDirectory: root});
    assert.notEqual(first.workspaceRoot, second.workspaceRoot);
    assert.equal(first.sessionPath.startsWith(repositoryRoot), false);
    assert.equal(first.proposalDirectory, first.workspaceRoot);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("chat workspace refuses storage inside the target repository", () => {
  const repositoryRoot = mkdtempSync(resolve(tmpdir(), "cyberalchemy-chat-inside-test-"));
  try {
    assert.throws(() => createChatWorkspace({repositoryRoot, baseDirectory: repositoryRoot}), /workspace-inside-repository/u);
  } finally { rmSync(repositoryRoot, {recursive: true, force: true}); }
});

test("repository-local coding config and PATH executable discovery are deterministic", () => {
  const root = mkdtempSync(resolve(tmpdir(), "cyberalchemy-chat-discovery-test-"));
  try {
    const configDirectory = resolve(root, ".cyberalchemy");
    const binDirectory = resolve(root, "bin");
    mkdirSync(configDirectory);
    mkdirSync(binDirectory);
    writeFileSync(resolve(configDirectory, "coding-agent.json"), "{}\n");
    const executable = resolve(binDirectory, "codex");
    writeFileSync(executable, "#!/bin/sh\nexit 0\n");
    chmodSync(executable, 0o700);
    assert.equal(discoverCodingConfig(root), resolve(configDirectory, "coding-agent.json"));
    assert.equal(discoverExecutable("codex", {environment: {PATH: binDirectory}}), executable);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
