import { testTsx } from "./toolchain.js";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CompilationRejected, loadAlchLangSource } from "../src/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonical = path.join(root, "examples/typed-backend.alch");
const legacy = path.join(root, "examples/typed-backend.md");

test(".alch is the canonical plain source format", () => {
  const loaded = loadAlchLangSource(canonical);
  assert.equal(loaded.file_format, "canonical-alch");
  assert.equal(loaded.source_kind, "plain-alchlang");
  assert.equal((loaded.carrier.identity as any).domain_id, "typed-commerce");
});

test("legacy Markdown remains fenced and explicitly classified", () => {
  const loaded = loadAlchLangSource(legacy);
  assert.equal(loaded.file_format, "legacy-markdown");
  assert.equal(loaded.source_kind, "markdown-alchlang");
});

test("unsupported suffixes and fenced .alch files fail causally", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "alchlang-source-"));
  const text = "domain tiny \"Tiny\"\nowner tiny-owner\n";
  const wrong = path.join(directory, "tiny.txt"); writeFileSync(wrong, text);
  const uppercase = path.join(directory, "tiny.ALCH"); writeFileSync(uppercase, text);
  const fenced = path.join(directory, "tiny.alch"); writeFileSync(fenced, `\`\`\`alchlang\n${text}\`\`\`\n`);
  assert.throws(() => loadAlchLangSource(wrong), (error: unknown) => error instanceof CompilationRejected && error.issues[0].code === "SOURCE_EXTENSION");
  assert.throws(() => loadAlchLangSource(uppercase), (error: unknown) => error instanceof CompilationRejected && error.issues[0].code === "SOURCE_EXTENSION");
  assert.throws(() => loadAlchLangSource(fenced), (error: unknown) => error instanceof CompilationRejected && error.issues[0].code === "SOURCE_CONTAINER");
});

test("domainspec check validates .alch without writing generated output", () => {
  const tsx = testTsx();
  const result = spawnSync(tsx, [path.join(root, "src/cli.ts"), "check", canonical, "--backend", "local-compat"], { cwd: root, encoding: "utf8", env: process.env });
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.status, "valid");
  assert.equal(receipt.file_format, "canonical-alch");
  assert.equal(receipt.domain_id, "typed-commerce");
  assert.equal(receipt.authority_effect, "none");
});
