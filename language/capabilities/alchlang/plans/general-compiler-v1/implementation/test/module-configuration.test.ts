import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {buildModuleConfiguration, checkModuleConfiguration, compileModuleConfiguration} from "../src/module-configuration.js";

const sourcePath = path.resolve(import.meta.dirname, "../../extensions/are-runtime-configuration-v1/runtime-configuration.alch");
const source = () => readFileSync(sourcePath, "utf8");
const temporary = (t: {after(fn: () => void): void}) => { const root = mkdtempSync(path.join(os.tmpdir(), "alch-module-configuration-")); t.after(() => rmSync(root, {recursive: true, force: true})); return root; };
const sourceLocalTemporary = (t: {after(fn: () => void): void}) => { const root = mkdtempSync(path.join(path.dirname(sourcePath), "invalid-")); t.after(() => rmSync(root, {recursive: true, force: true})); return root; };
const relocatedSource = () => source().replace('decision "../', 'decision "../../').replace('factory-source "../../../../../../../', 'factory-source "../../../../../../../../');
const allFiles = (root: string): string[] => readdirSync(root, {withFileTypes: true}).flatMap((entry) => entry.isDirectory() ? allFiles(path.join(root, entry.name)) : [path.join(root, entry.name)]);

test("one Alch source compiles exact modules and multiple semantic entry points", () => {
  const result = compileModuleConfiguration(sourcePath);
  assert.equal(checkModuleConfiguration(sourcePath).status, "valid");
  assert.equal(result.modules.length, 1);
  assert.deepEqual(result.entries.map((entry) => entry.entry_id), ["RequestIntentContainsPhrase", "RequestIntentSemanticKey", "RouterContainsPhrase"]);
  assert.equal(result.configuration.modules[0]?.manifest_digest, "b5ce4d4a3a5b31d92658d8cd53d3ac3ce07283ab7ed8adc164fee23c1221edb5");
  assert.equal(result.conformance.runtime_admitted, false);
});

test("builds are byte deterministic and preserve the five-stage pipeline", (t) => {
  const root = temporary(t), first = path.join(root, "first"), second = path.join(root, "second");
  buildModuleConfiguration(sourcePath, first); buildModuleConfiguration(sourcePath, second);
  const firstFiles = allFiles(first).map((file) => path.relative(first, file)).sort();
  assert.deepEqual(firstFiles, allFiles(second).map((file) => path.relative(second, file)).sort());
  for (const relative of firstFiles) assert.deepEqual(readFileSync(path.join(first, relative)), readFileSync(path.join(second, relative)), relative);
  const manifest = JSON.parse(readFileSync(path.join(first, "manifest.json"), "utf8"));
  assert.deepEqual(manifest.pipeline, ["alch-source", "module-configuration-ontology", "runtime-configuration", "entrypoint-projection", "conformance-evidence"]);
  assert.equal(manifest.runtime_admitted, false);
});

test("entry meanings are orthogonal and cannot collapse to substring identities", (t) => {
  const root = sourceLocalTemporary(t), invalid = path.join(root, "invalid.alch");
  writeFileSync(invalid, relocatedSource().replace('capability ContainsPhrase\n  consumer "request-decision-router"', 'capability SemanticKey\n  consumer "request-intent-runtime"'));
  assert.throws(() => compileModuleConfiguration(invalid), /duplicate consumer capability entry/);
});

test("manifest, factory, and adoption drift fail closed", (t) => {
  for (const [name, changed, expected] of [
    ["manifest", relocatedSource().replace("b5ce4d4a3a5b31d92658d8cd53d3ac3ce07283ab7ed8adc164fee23c1221edb5", "0".repeat(64)), /manifest digest/],
    ["factory", relocatedSource().replace("1be73822d50fe2b2b84b05b1aa43627443aed156b27263a24c2f21e3d7246e91", "0".repeat(64)), /factory source digest drift/],
    ["adoption", relocatedSource().replace("d64c3f3fc1e86ee29a8b371e75adb80355c01e61fb7bb8cda1ead1aa7927c98e", "0".repeat(64)), /adoption decision digest drift/],
  ] as const) {
    const file = path.join(sourceLocalTemporary(t), `${name}.alch`); writeFileSync(file, changed);
    assert.throws(() => compileModuleConfiguration(file), expected);
  }
});
