// Provider-free executable and planning-evidence closure for the G03 freeze.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstatSync, readFileSync, readdirSync, realpathSync} from "node:fs";
import {builtinModules, createRequire} from "node:module";
import {dirname, extname, join, resolve} from "node:path";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const IMPORT = /(?:\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?|\bimport\s*\()\s*["']([^"']+)["']/g;
const REQUIRE = /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g, BUILTINS = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

function exactRegularFile(path, code) {
  const absolute = resolve(path), stat = lstatSync(absolute);
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && realpathSync(absolute) === absolute, code);
  return absolute;
}

function resolveLocalImport(parent, specifier) {
  if (!specifier.startsWith(".")) {
    try { return exactRegularFile(createRequire(parent).resolve(specifier), "closure.package-import-not-regular"); }
    catch { assert.fail(`closure.import-unresolved:${specifier}:${parent}`); }
  }
  const base = resolve(dirname(parent), specifier), candidates = extname(base) ? [base] : [base, `${base}.mjs`, `${base}.js`, `${base}.json`, join(base, "index.mjs"), join(base, "index.js")];
  for (const candidate of candidates) {
    try { return exactRegularFile(candidate, "closure.import-not-regular"); } catch {}
  }
  assert.fail(`closure.import-unresolved:${specifier}:${parent}`);
}

export function collectExecutableClosure(entries) {
  assert.ok(Array.isArray(entries) && entries.length > 0, "closure.entries");
  const pending = entries.map((entry) => exactRegularFile(entry, "closure.entry-not-regular")), seen = new Map();
  while (pending.length) {
    const path = pending.pop(); if (seen.has(path)) continue;
    const bytes = readFileSync(path); seen.set(path, digest(bytes));
    if (![".mjs", ".js"].includes(extname(path))) continue;
    const source = bytes.toString("utf8"); let match;
    const specifiers = []; while ((match = IMPORT.exec(source))) specifiers.push(match[1]); while ((match = REQUIRE.exec(source))) specifiers.push(match[1]);
    for (const specifier of specifiers) {
      if (BUILTINS.has(specifier)) continue;
      pending.push(resolveLocalImport(path, specifier));
    }
  }
  const files = [...seen].map(([path, sha256]) => ({path, sha256})).sort((a, b) => a.path.localeCompare(b.path));
  return {schema_version: "are.longmemeval-executable-closure/v1", entries: entries.map((entry) => resolve(entry)), files, tree_sha256: digest(JSON.stringify(files))};
}

export function collectPlanningTree(planningDirectory) {
  const root = resolve(planningDirectory), names = readdirSync(root).sort(), expected = ["IMPORT-RECEIPT.json", "PLAN.json", "RESULTS.json"];
  for (let index = 1; index <= 156; index++) {
    const id = String(index).padStart(3, "0"); expected.push(`call-${id}-measured.json`, `call-${id}-prepared.json`);
  }
  expected.sort(); assert.deepEqual(names, expected, "planning-tree.exact-whitelist");
  const files = names.map((name) => { const path = exactRegularFile(join(root, name), `planning-tree.not-regular:${name}`); return {name, sha256: digest(readFileSync(path))}; });
  return {schema_version: "are.longmemeval-planning-tree/v1", root, whitelist: {fixed: ["IMPORT-RECEIPT.json", "PLAN.json", "RESULTS.json"], call_range: {first: 1, last: 156, states: ["prepared", "measured"], width: 3}, exact_file_count: 315}, files, tree_sha256: digest(JSON.stringify(files))};
}
