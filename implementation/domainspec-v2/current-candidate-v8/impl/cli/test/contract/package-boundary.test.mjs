import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(testDir, "../..");
const packageJson = JSON.parse(fs.readFileSync(path.join(cliRoot, "package.json"), "utf8"));
const packageLock = JSON.parse(fs.readFileSync(path.join(cliRoot, "package-lock.json"), "utf8"));
const tsconfig = JSON.parse(fs.readFileSync(path.join(cliRoot, "tsconfig.json"), "utf8"));
const source = fs.readFileSync(path.join(cliRoot, "src/index.ts"), "utf8");
const versionSource = fs.readFileSync(path.join(cliRoot, "src/version.ts"), "utf8");

test("package identity and supported bin are exact", () => {
  assert.equal(packageJson.name, "@domainspec-v2/cli");
  assert.equal(packageJson.version, "0.0.0-candidate.2");
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.type, "module");
  assert.deepEqual(packageJson.bin, { "domainspec-v2": "./dist/cli/main.js" });
});

test("only the curated root entry is exported and build scripts are exact", () => {
  assert.deepEqual(packageJson.exports, {
    ".": { types: "./dist/index.d.ts", import: "./dist/index.js" }
  });
  assert.deepEqual(packageJson.files, ["dist", "contracts/instantiation-receipt.schema.json", "contracts/target-observation.schema.json", "README.md"]);
  assert.equal("workspaces" in packageJson, false);
  assert.equal("dependencies" in packageJson, false);
  assert.equal("devDependencies" in packageJson, false);
  assert.deepEqual(packageJson.scripts, {
    "catalog:check": "node tools/materialize-frozen-catalog.mjs --check",
    "relationships:check": "node tools/materialize-relationship-authority.mjs --check",
    "integration-profile:check": "node tools/materialize-system-integration-profile.mjs --check",
    typecheck: "npm run catalog:check && npm run relationships:check && npm run integration-profile:check && tsc -p tsconfig.json --noEmit --pretty false",
    build: "npm run catalog:check && npm run relationships:check && npm run integration-profile:check && tsc -p tsconfig.json",
    test: "node --import tsx --test test/cli/main.test.ts test/conformance/observe-target.test.ts test/generation/plan-instantiation.test.ts test/generation/publish-instantiation.test.ts test/input/operation-relationships.test.ts test/input/project-model.test.ts test/input/project-root.test.ts test/meta-types/catalog.test.ts test/system-integration/profile.test.ts",
    "test:contract": "node --test test/contract/foundation-contract.test.mjs test/contract/instantiation-foundation-contract.test.mjs test/contract/package-boundary.test.mjs",
    "validate:rust": "node tools/validate-generated-rust.mjs",
    "validate:clean-package": "node tools/validate-clean-package.mjs"
  });
  assert.equal(packageJson.packageManager, "npm@11.19.0");
});

test("development and factory command surfaces are not re-exported", () => {
  for (const forbidden of ["roundtrip", "derive", "self-check", "emit-tests", "factory", "replay", "verify"]) {
    assert.equal(source.includes(forbidden), false, forbidden);
    assert.equal(JSON.stringify(packageJson.exports).includes(forbidden), false, forbidden);
  }
  assert.match(source, /from "\.\/version\.js"/);
});

test("runtime and platform declarations remain exact and non-authoritative", () => {
  assert.deepEqual(packageJson.engines, { node: "26.8.1", npm: "11.19.0" });
  assert.deepEqual(packageJson.os, ["linux"]);
  assert.deepEqual(packageJson.cpu, ["x64"]);
  assert.match(versionSource, /SUPPORTED_NODE_VERSION = "v26\.8\.1"/);
  assert.match(versionSource, /AUTHORITY_EFFECT = "none"/);
  assert.equal(packageLock.lockfileVersion, 3);
  assert.deepEqual(packageLock.packages[""].engines, packageJson.engines);
  assert.deepEqual(packageLock.packages[""].bin, { "domainspec-v2": "dist/cli/main.js" });
});

test("TypeScript boundary is strict NodeNext and source-only", () => {
  assert.equal(tsconfig.extends, "../../../../toolchains/node-typescript/tsconfig/node.json");
  assert.equal(tsconfig.compilerOptions.rootDir, "src");
  assert.equal(tsconfig.compilerOptions.outDir, "dist");
  assert.deepEqual(tsconfig.include, ["src/**/*.ts"]);
  const tsc = path.resolve(cliRoot, "../node_modules/.bin/tsc");
  const result = spawnSync(tsc, ["--showConfig", "--project", path.join(cliRoot, "tsconfig.json")], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const effective = JSON.parse(result.stdout);
  assert.equal(effective.compilerOptions.module, "nodenext");
  assert.equal(effective.compilerOptions.moduleResolution, "nodenext");
  assert.equal(effective.compilerOptions.strict, true);
});
