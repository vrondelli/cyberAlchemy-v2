import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import test from "node:test";

import {applyCodexAppServerProposal, bindCodexProposal} from "../codex-proposal.mjs";
import {snapshotTree} from "../index.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const sandbox = {type: "container", engine: "/usr/bin/docker", image: `example.invalid/agent@sha256:${"a".repeat(64)}`, allowed_commands: ["node"]};
function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "codex-proposal-test-"));
  for (const [path, bytes] of Object.entries({"package.json": "{\"type\":\"module\"}\n", "src/a.mjs": "export const a=1;\n", "test/a.test.mjs": "// test\n"})) { const target = resolve(root, path); mkdirSync(dirname(target), {recursive: true}); writeFileSync(target, bytes); }
  const profile = resolve(root, "profile.json"); writeFileSync(profile, "{\"profile\":1}\n");
  return {root, profile, cleanup: () => rmSync(root, {recursive: true, force: true})};
}
function material(item, withSandbox = true) {
  const before = snapshotTree(item.root);
  const candidate = JSON.stringify({schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "src/a.mjs", expected_base_tree_sha256: before.tree_sha256, expected_file_sha256: before.files["src/a.mjs"], utf8: "export const a=2;\n", rationale: "repair", authority_effect: "none"});
  const digest = sha(candidate);
  const scope = {schema_version: "are.codex-coding-agent-scope/v1", observation_allowlist: ["package.json", "src/a.mjs", "test/a.test.mjs"], mutation_allowlist: ["src/a.mjs"], verification_command: ["node", "--test"], ...(withSandbox ? {sandbox} : {})};
  const raw = {schema_version: "are.codex-app-server-coding-proposal/v1", status: "AWAITING_APPROVAL", run_id: "codex:1", request: "repair", candidate_utf8: candidate, candidate_sha256: digest, approval_digest: digest, action_id: "action", thread_id: "thread", observation_allowlist: scope.observation_allowlist, mutation_allowlist: scope.mutation_allowlist, verification_command: scope.verification_command, authority_effect: "none"};
  return {scope, digest, proposal: bindCodexProposal({proposal: raw, scope_config: scope, codex_profile_bytes: readFileSync(item.profile)})};
}

test("Codex proposal application binds approval, scope, profile, transaction, and sandbox verification", () => {
  const item = fixture();
  try {
    const bound = material(item);
    const applied = applyCodexAppServerProposal({proposal: bound.proposal, repository_root: item.root, scope_config: bound.scope, codex_profile_path: item.profile, approval_digest: bound.digest, sandbox_runner: () => ({status: 0, stdout: "pass", stderr: ""})});
    assert.equal(applied.status, "PATCH_CANDIDATE", JSON.stringify(applied));
    assert.match(readFileSync(resolve(item.root, "src/a.mjs"), "utf8"), /a=2/u);
    assert.deepEqual(applied.application.changed_paths, ["src/a.mjs"]);
  } finally { item.cleanup(); }
});

test("Codex proposal application blocks mismatch, scope drift, and missing sandbox before mutation", () => {
  for (const mode of ["digest", "scope", "sandbox"]) {
    const item = fixture();
    try {
      const bound = material(item, mode !== "sandbox");
      const before = readFileSync(resolve(item.root, "src/a.mjs"), "utf8");
      const scope = mode === "scope" ? {...bound.scope, max_context_bytes: 99} : bound.scope;
      const approval = mode === "digest" ? "0".repeat(64) : bound.digest;
      const applied = applyCodexAppServerProposal({proposal: bound.proposal, repository_root: item.root, scope_config: scope, codex_profile_path: item.profile, approval_digest: approval, sandbox_runner: () => ({status: 0, stdout: "pass", stderr: ""})});
      assert.equal(applied.status, "BLOCK");
      assert.equal(readFileSync(resolve(item.root, "src/a.mjs"), "utf8"), before);
    } finally { item.cleanup(); }
  }
});
