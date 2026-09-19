import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const argument = name => {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) throw new Error(`missing ${name}`);
  return path.resolve(process.argv[index + 1]);
};
const repositoryRoot = argument("--repository-root");
const outputRoot = argument("--output-root");
const write = process.argv.includes("--write");
assert.notEqual(write, process.argv.includes("--check"), "choose exactly one of --write or --check");
const cliRoot = path.join(repositoryRoot, "projects/domainspec-v2/impl/cli");
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value !== null && typeof value === "object" ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}` : JSON.stringify(value);
const relative = file => path.relative(repositoryRoot, file).split(path.sep).join("/");

function filesUnder(root) {
  const rows = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) rows.push(child);
      else throw new Error(`non-regular candidate input:${child}`);
    }
  };
  visit(root);
  return rows;
}

function row(file, category) {
  const bytes = fs.readFileSync(file);
  return { path: relative(file), category, size_bytes: bytes.length, sha256: sha256(bytes) };
}

const selected = new Map();
const addTree = (root, category) => { for (const file of filesUnder(root)) selected.set(file, row(file, category)); };
const addFile = (file, category) => selected.set(file, row(file, category));
addTree(path.join(cliRoot, "src"), "compiler-source");
addTree(path.join(cliRoot, "contracts"), "packaged-contract");
addTree(path.join(cliRoot, "examples/reconciled-commerce"), "coherent-example");
for (const name of ["package.json", "package-lock.json", "tsconfig.json", "README.md", "USER-GUIDE.md", "WHOLE-APPLICATION.md", "COMPATIBILITY.md", "MIGRATION.md"]) addFile(path.join(cliRoot, name), "product-boundary");
for (const name of ["provider-pack-selection-v1.schema.json", "integration-generation-source-v2.schema.json", "application-integration-binding-v1.schema.json"]) addFile(path.join(repositoryRoot, "projects/domainspec-v2/impl/system-integration/contracts", name), "schema-authority");
const sourceFiles = [...selected.values()].sort((left, right) => left.path.localeCompare(right.path));
const sourceBody = {
  schema_version: "domainspec.whole-application-source-graph-inventory/v1-candidate",
  roots: ["projects/domainspec-v2/impl/cli/src", "projects/domainspec-v2/impl/cli/contracts", "projects/domainspec-v2/impl/cli/examples/reconciled-commerce"],
  file_count: sourceFiles.length,
  files: sourceFiles,
  authority_effect: "none",
};
const sourceInventory = { ...sourceBody, inventory_sha256: sha256(canonical(sourceBody)) };

const localTsc = path.join(cliRoot, "node_modules/.bin/tsc");
const workspaceTsc = path.resolve(cliRoot, "../node_modules/.bin/tsc");
const tsc = fs.existsSync(localTsc) ? localTsc : workspaceTsc;
assert.equal(fs.existsSync(tsc), true, "TypeScript compiler is unavailable for source-to-dist currentness");
const tscVersion = spawnSync(tsc, ["--version"], { cwd: cliRoot, encoding: "utf8" });
assert.equal(tscVersion.status, 0, `${tscVersion.stdout}\n${tscVersion.stderr}`);
assert.equal(tscVersion.stdout.trim(), "Version 7.0.2", "unexpected TypeScript compiler version");
const temporaryDist = fs.mkdtempSync(path.join(cliRoot, ".domainspec-dist-check-"));
let distCurrentness;
try {
  const compilation = spawnSync(tsc, ["-p", path.join(cliRoot, "tsconfig.json"), "--outDir", temporaryDist, "--pretty", "false"], { cwd: cliRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  assert.equal(compilation.status, 0, `${compilation.stdout}\n${compilation.stderr}`);
  const emittedInventory = root => filesUnder(root).map(file => {
    const bytes = fs.readFileSync(file);
    return { path: path.relative(root, file).split(path.sep).join("/"), size_bytes: bytes.length, sha256: sha256(bytes) };
  }).sort((left, right) => left.path.localeCompare(right.path));
  const fresh = emittedInventory(temporaryDist);
  const packed = emittedInventory(path.join(cliRoot, "dist"));
  assert.deepEqual(packed, fresh, "packed dist is not the exact current TypeScript emit");
  distCurrentness = { result: "pass", compiler: `typescript@${tscVersion.stdout.trim().replace(/^Version /, "")}`, emitted_files: fresh.length, emitted_inventory_sha256: sha256(canonical(fresh)) };
} finally {
  fs.rmSync(temporaryDist, { recursive: true, force: true });
}

const example = path.join(cliRoot, "examples/reconciled-commerce");
const json = file => JSON.parse(fs.readFileSync(file, "utf8"));
const wholeModule = await import(pathToFileURL(path.join(cliRoot, "dist/generation/whole-application-v1.js")));
const providerModule = await import(pathToFileURL(path.join(cliRoot, "dist/generation/provider-application-v1.js")));
const outputModule = await import(pathToFileURL(path.join(cliRoot, "dist/generation/provider-application-output-v1.js")));
const integration = json(path.join(example, "integrations/application.json"));
const generatedLanguages = [];
for (const language of ["typescript", "python", "rust"]) {
  const whole = wholeModule.planWholeApplicationV1(path.join(example, "source"), json(path.join(example, `selections/${language}.json`)), structuredClone(integration));
  const provider = providerModule.composeProviderApplicationV1(whole, json(path.join(example, `providers/${language}.json`)), structuredClone(integration));
  const receipt = outputModule.createProviderApplicationReceiptV1(provider);
  const artifacts = provider.artifacts.map(item => ({ relative_path: item.relative_path, size_bytes: item.size_bytes, sha256: item.sha256, owner: provider.path_owners.find(owner => owner.relative_path === item.relative_path)?.owner })).sort((left, right) => left.relative_path.localeCompare(right.relative_path));
  generatedLanguages.push({
    language,
    whole_application_plan_sha256: whole.plan_sha256,
    provider_application_plan_sha256: provider.plan_sha256,
    publication_receipt_sha256: receipt.receipt_sha256,
    compilation_selection_sha256: provider.compilation_selection_sha256,
    provider_selection_sha256: provider.provider_selection_sha256,
    integration_source_sha256: provider.integration_source_sha256,
    dependencies: provider.dependencies,
    artifact_count: artifacts.length,
    artifact_set_sha256: sha256(canonical(artifacts)),
    artifacts,
  });
}
const generatedBody = {
  schema_version: "domainspec.whole-application-generated-artifact-inventory/v1-candidate",
  source_graph_inventory_sha256: sourceInventory.inventory_sha256,
  typescript_dist_currentness: distCurrentness,
  languages: generatedLanguages,
  runtime_guarantees_observed: false,
  claim_ceiling: "provider-code-formation-and-static-compilation-only",
  authority_effect: "none",
};
const generatedInventory = { ...generatedBody, inventory_sha256: sha256(canonical(generatedBody)) };

const packageJson = json(path.join(cliRoot, "package.json"));
const requiredScripts = ["schemas:check", "typecheck", "test:whole-application", "test:installed-whole-application", "test:contract"];
const localDependencyClosure = initial => {
  const observed = new Set(initial);
  const queue = [...initial];
  while (queue.length) {
    const file = queue.shift();
    if (!/\.(?:[cm]?js|ts)$/.test(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    const specifiers = [
      ...source.matchAll(/(?:\bfrom\s+|\bimport\s*\(\s*)["'](\.[^"']+)["']/g),
      ...source.matchAll(/new URL\(\s*["'](\.[^"']+)["']\s*,\s*import\.meta\.url\s*\)/g),
    ].map(match => match[1]);
    for (const specifier of specifiers) {
      const base = path.resolve(path.dirname(file), specifier);
      const candidates = [base, `${base}.ts`, `${base}.mjs`, `${base}.js`, `${base}.json`, path.join(base, "index.ts"), path.join(base, "index.mjs"), path.join(base, "index.js")];
      const dependency = candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (dependency && !observed.has(dependency)) {
        observed.add(dependency);
        queue.push(dependency);
      }
    }
  }
  return [...observed].sort();
};
const tests = requiredScripts.map(id => {
  const command = packageJson.scripts[id];
  if (typeof command !== "string") throw new Error(`missing required test script:${id}`);
  const visited = new Set();
  const scriptRows = [];
  const referenced = new Set();
  const visitScript = scriptId => {
    if (visited.has(scriptId)) return;
    visited.add(scriptId);
    const scriptCommand = packageJson.scripts[scriptId];
    if (typeof scriptCommand !== "string") throw new Error(`missing nested test script:${scriptId}`);
    scriptRows.push({ id: scriptId, command: scriptCommand });
    for (const match of scriptCommand.matchAll(/[A-Za-z0-9_./-]+\.(?:ts|mjs|py|sh)/g)) referenced.add(match[0]);
    for (const match of scriptCommand.matchAll(/npm run ([A-Za-z0-9:_-]+)/g)) visitScript(match[1]);
  };
  visitScript(id);
  if (id === "typecheck") referenced.add("tsconfig.json");
  const entrypoints = [...referenced].filter(value => fs.existsSync(path.resolve(cliRoot, value))).map(value => path.resolve(cliRoot, value));
  const files = localDependencyClosure(entrypoints).map(value => row(value, "test-or-validator"));
  return { id, command, script_closure: scriptRows, files };
});
const testBody = {
  schema_version: "domainspec.whole-application-test-denominator/v1-candidate",
  required_results: { schemas: "9 schemas and 8 external references pass", typecheck: "pass", whole_application: "39/39 pass", contract: "25/25 pass", package_boundary_subset: "8/8 pass", installed_consumer: "1/1 pass", l3_runtime: "pass" },
  scripts: tests,
  l3_receipt: row(path.join(outputRoot, "../l3/L3-COMPLETION-RECEIPT.json"), "runtime-evidence"),
  installed_report: row(path.join(outputRoot, "INSTALLED-CONSUMER-REPORT.json"), "installed-evidence"),
  authority_effect: "none",
};
const testDenominator = { ...testBody, denominator_sha256: sha256(canonical(testBody)) };

const outputs = new Map([
  ["SOURCE-GRAPH-INVENTORY.json", sourceInventory],
  ["GENERATED-APPLICATION-INVENTORY.json", generatedInventory],
  ["TEST-DENOMINATOR.json", testDenominator],
]);
if (write) {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const [name, value] of outputs) fs.writeFileSync(path.join(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`);
} else {
  for (const [name, value] of outputs) assert.deepEqual(JSON.parse(fs.readFileSync(path.join(outputRoot, name), "utf8")), value, `candidate inventory drifted:${name}`);
}
process.stdout.write(`${JSON.stringify({ result: "pass", mode: write ? "write" : "check", source_files: sourceFiles.length, typescript_dist_currentness: distCurrentness, generated_languages: generatedLanguages.map(row => ({ language: row.language, artifacts: row.artifact_count, plan_sha256: row.provider_application_plan_sha256 })), test_scripts: requiredScripts, authority_effect: "none" })}\n`);
