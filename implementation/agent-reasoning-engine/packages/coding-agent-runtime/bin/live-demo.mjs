#!/usr/bin/env node
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {createAppServerRpcClient, spawnAppServerRpcTransport} from "../../codex-app-server-wrapper/index.mjs";
import {inspectLiveCodexBinding, runLiveCodingAgentSession} from "../live-session.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const keep = process.argv.includes("--keep");
const approve = process.argv.includes("--approve");
const model = argument("--model");
const codexCommand = argument("--codex-command") ?? "codex";
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const productRoot = resolve(packageRoot, "../..");
const repositoryRoot = resolve(argument("--repository-root") ?? resolve(productRoot, "../../.."));
const wrapperRoot = resolve(productRoot, "packages/codex-app-server-wrapper");
const profilePath = resolve(argument("--config") ?? resolve(wrapperRoot, "profiles/repository-v1.json"));
const wrapperPath = resolve(wrapperRoot, "bin/are-codex-app-server.mjs");
const profile = JSON.parse(readFileSync(profilePath, "utf8"));
const codexBinding = inspectLiveCodexBinding({command: codexCommand, expected_version: profile.protocol_binding.observed_codex_version});
if (!codexBinding.ok) {
  process.stdout.write(`${JSON.stringify({schema_version: "are.coding-agent-live-preflight/v1", status: "BLOCK", codex_binding: codexBinding, authority_effect: "none"}, null, 2)}\n`);
  process.exit(1);
}
const root = mkdtempSync(join(tmpdir(), "are-coding-agent-live-demo-"));
const files = {
  "package.json": "{\n  \"type\": \"module\",\n  \"scripts\": {\"test\": \"node --test\"}\n}\n",
  "src/range.mjs": "export function sumInclusive(start, end) {\n  let total = 0;\n  for (let value = start; value < end; value += 1) total += value;\n  return total;\n}\n",
  "test/range.test.mjs": "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport {sumInclusive} from '../src/range.mjs';\ntest('includes both endpoints', () => { assert.equal(sumInclusive(2, 4), 9); });\ntest('single value', () => { assert.equal(sumInclusive(3, 3), 3); });\n"
};
for (const [path, utf8] of Object.entries(files)) {
  const target = resolve(root, path);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, utf8, "utf8");
}

const transport = spawnAppServerRpcTransport({command: process.execPath, args: [wrapperPath, "--config", profilePath, "--repository-root", repositoryRoot, "--codex-command", codexCommand]});
const client = createAppServerRpcClient({transport});
const receipt = await runLiveCodingAgentSession({
  run_id: "coding-agent-live-demo",
  client,
  model,
  request: "Repair sumInclusive so it includes both integer endpoints.",
  fixture_root: root,
  observation_allowlist: ["package.json", "src/range.mjs", "test/range.test.mjs"],
  mutation_allowlist: ["src/range.mjs"],
  verification_command: [process.execPath, "--test"],
  approve
});
process.stdout.write(`${JSON.stringify({...receipt, codex_binding: codexBinding, fixture_root: root, fixture_retained: keep}, null, 2)}\n`);
if (!keep) rmSync(root, {recursive: true, force: true});
process.exitCode = receipt.status === "PATCH_CANDIDATE" ? 0 : receipt.status === "AWAITING_APPROVAL" ? 3 : 1;
