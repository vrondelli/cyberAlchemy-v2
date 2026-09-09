import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {buildRepositoryMap} from "../repository-map.mjs";
import {createContainerSandbox, runSandboxCommand} from "../sandbox.mjs";
import {runTransactionalPatchSet} from "../patch-set-runtime.mjs";
import {snapshotTree} from "../verifier.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const sandboxConfig = {type: "container", engine: "/usr/bin/docker", image: `example.invalid/agent@sha256:${"a".repeat(64)}`, allowed_commands: ["node"], timeout_ms: 1000};

test("repository map is deterministic, budgeted, and extracts structure", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-repository-map-"));
  try {
    writeFileSync(resolve(root, "a.mjs"), "import {x} from './b.mjs'; export function alpha() { return x; }\n");
    writeFileSync(resolve(root, "b.mjs"), "export const x = 1;\n");
    writeFileSync(resolve(root, "a.test.mjs"), "import test from 'node:test'; test('x',()=>{});\n");
    const input = {repository_root: root, paths: ["b.mjs", "a.test.mjs", "a.mjs"], maximum_files: 2, maximum_bytes: 4096};
    const first = buildRepositoryMap(input);
    const second = buildRepositoryMap({...input, paths: [...input.paths].reverse()});
    assert.equal(first.map_digest, second.map_digest);
    assert.equal(first.included_file_count, 2);
    assert.equal(first.omitted_paths.length, 1);
    assert.equal(first.files.find((file) => file.path === "a.mjs").exports.includes("alpha"), true);
    assert.equal(first.files.find((file) => file.path === "a.test.mjs").test, true);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("sandbox is container-only, digest-pinned, and has no host fallback", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-sandbox-"));
  try {
    let captured;
    const sandbox = createContainerSandbox({config: sandboxConfig, repository_root: root, runner: (engine, args) => { captured = {engine, args}; return {status: 0, stdout: "ok", stderr: ""}; }});
    const result = sandbox.run(["node", "--version"]);
    assert.equal(result.ok, true);
    assert.equal(captured.engine, "/usr/bin/docker");
    assert.equal(captured.args.includes("none"), true);
    assert.equal(captured.args.includes("never"), true);
    assert.equal(captured.args.includes("--read-only"), true);
    assert.equal(captured.args.some((value) => String(value).includes("dst=/workspace,readonly")), true);
    assert.equal(sandbox.run(["sh", "-c", "id"]).reason_codes.includes("sandbox.command-not-allowlisted"), true);
    assert.deepEqual(runSandboxCommand({sandbox: null, command: ["node"]}).reason_codes, ["sandbox.required"]);
    assert.throws(() => createContainerSandbox({config: {...sandboxConfig, image: "example:latest"}, repository_root: root}), /digest-pinned/u);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("sandbox injects named environment without command-argument material and redacts output", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-sandbox-secret-"));
  try {
    let captured;
    const secret = "secret-canary-value";
    const sandbox = createContainerSandbox({config: sandboxConfig, repository_root: root, runner: (engine, args, options) => { captured = {engine, args, options}; return {status: 0, stdout: `value=${secret}`, stderr: secret}; }});
    const result = sandbox.run(["node", "--test"], {environment: {TEST_TOKEN: secret}});
    assert.equal(result.ok, true);
    assert.equal(captured.args.includes(secret), false);
    assert.equal(captured.args.includes("TEST_TOKEN"), true);
    assert.equal(captured.options.env.TEST_TOKEN, secret);
    assert.equal(JSON.stringify(result).includes(secret), false);
    assert.equal(result.stdout, "value=[REDACTED]");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("multi-file candidates require approval, verify in sandbox, and roll back failed verification", () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-patch-set-"));
  try {
    writeFileSync(resolve(root, "a.mjs"), "export const a = 1;\n");
    writeFileSync(resolve(root, "b.mjs"), "export const b = 1;\n");
    const before = snapshotTree(root);
    const candidate = {schema_version: "are.patch-set-candidate/v1", expected_base_tree_sha256: before.tree_sha256, changes: [
      {operation: "replace-file", path: "a.mjs", expected_file_sha256: before.files["a.mjs"], utf8: "export const a = 2;\n"},
      {operation: "replace-file", path: "b.mjs", expected_file_sha256: before.files["b.mjs"], utf8: "export const b = 2;\n"},
    ], rationale: "fixture", authority_effect: "none"};
    const allowed = createContainerSandbox({config: sandboxConfig, repository_root: root, runner: () => ({status: 0, stdout: "pass", stderr: ""})});
    const waiting = runTransactionalPatchSet({fixture_root: root, raw_candidate: candidate, mutation_allowlist: ["a.mjs", "b.mjs"], verification_command: ["node", "--test"], verification_sandbox: allowed});
    assert.equal(waiting.status, "AWAITING_APPROVAL");
    assert.equal(readFileSync(resolve(root, "a.mjs"), "utf8"), "export const a = 1;\n");
    const applied = runTransactionalPatchSet({fixture_root: root, raw_candidate: candidate, mutation_allowlist: ["a.mjs", "b.mjs"], verification_command: ["node", "--test"], verification_sandbox: allowed, approve: true});
    assert.equal(applied.status, "PATCH_CANDIDATE", JSON.stringify(applied));
    assert.deepEqual(applied.changed_paths, ["a.mjs", "b.mjs"]);

    const next = snapshotTree(root);
    const failingCandidate = {schema_version: "are.patch-set-candidate/v1", expected_base_tree_sha256: next.tree_sha256, changes: [{operation: "replace-file", path: "a.mjs", expected_file_sha256: next.files["a.mjs"], utf8: "export const a = 3;\n"}], authority_effect: "none"};
    const denied = createContainerSandbox({config: sandboxConfig, repository_root: root, runner: () => ({status: 1, stdout: "", stderr: "failed"})});
    const failed = runTransactionalPatchSet({fixture_root: root, raw_candidate: failingCandidate, mutation_allowlist: ["a.mjs"], verification_command: ["node", "--test"], verification_sandbox: denied, approve: true});
    assert.equal(failed.status, "BLOCK");
    assert.equal(failed.effect_applied, "rolled-back");
    assert.equal(readFileSync(resolve(root, "a.mjs"), "utf8"), "export const a = 2;\n");
  } finally { rmSync(root, {recursive: true, force: true}); }
});
