#!/usr/bin/env node
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, extname, relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../..");
const outputPath = resolve(packageRoot, "evidence/runtime-closure.v2.json");
const checkOnly = process.argv.includes("--check");
const seeds = [
  "runtime/proxy.mjs",
  "client/session.mjs",
  "client/interactive.mjs",
  "scripts/canary.mjs",
  "scripts/build-runtime-closure.mjs",
  "scripts/run-regression.mjs",
  "test/proxy.test.mjs",
  "test/interactive-client.test.mjs",
  "test/conformance-repair.test.mjs",
  "test/fixtures/mock-app-server.mjs",
].map((path) => resolve(packageRoot, path));
const extras = [
  resolve(packageRoot, "evidence/codex-app-server-protocol-observation.v1.json"),
  resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/profiles/cyberalchemy-v1.json"),
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function resolveImport(base, specifier) {
  const candidate = resolve(dirname(base), specifier);
  for (const path of [candidate, `${candidate}.mjs`, resolve(candidate, "index.mjs")]) if (existsSync(path)) return path;
  throw new Error(`UNRESOLVED_RUNTIME_IMPORT:${base}:${specifier}`);
}

const files = new Set([...seeds, ...extras]);
const queue = [...seeds];
while (queue.length > 0) {
  const path = queue.shift();
  if (extname(path) !== ".mjs") continue;
  const source = readFileSync(path, "utf8");
  for (const match of source.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) {
    const dependency = resolveImport(path, match[1]);
    if (!files.has(dependency)) {
      files.add(dependency);
      queue.push(dependency);
    }
  }
}
const profile = JSON.parse(readFileSync(extras[1], "utf8"));
for (const source of profile.provenance) files.add(resolve(repositoryRoot, source.path));

const entries = [...files].sort().map((path) => {
  if (!(path === repositoryRoot || path.startsWith(`${repositoryRoot}/`))) throw new Error(`RUNTIME_CLOSURE_ESCAPE:${path}`);
  const bytes = readFileSync(path);
  return {path: relative(repositoryRoot, path), size: bytes.length, sha256: sha256(bytes)};
});
const material = {schema_version: "are.codex-runtime-closure/v2", entries, authority_effect: "none"};
const closure = {...material, closure_digest: sha256(JSON.stringify(material))};
const rendered = `${JSON.stringify(closure, null, 2)}\n`;
if (checkOnly) {
  if (readFileSync(outputPath, "utf8") !== rendered) throw new Error("RUNTIME_CLOSURE_DRIFT");
} else writeFileSync(outputPath, rendered, "utf8");
process.stdout.write(`${closure.closure_digest}\n`);
