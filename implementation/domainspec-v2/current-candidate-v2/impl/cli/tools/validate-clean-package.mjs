import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(cliRoot, "fixtures/input-roots/canonical-project");

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env: { ...process.env, npm_config_audit: "false", npm_config_fund: "false", npm_config_update_notifier: "false" } });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed (${result.status})\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}

function inventory(root) {
  const rows = [];
  function visit(relative) {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) visit(child);
      else {
        const bytes = fs.readFileSync(path.join(root, child));
        rows.push({ relative_path: child, size_bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") });
      }
    }
  }
  visit("");
  return rows;
}

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "domainspec-cli-clean-package-"));
try {
  const sourcePackage = JSON.parse(fs.readFileSync(path.join(cliRoot, "package.json"), "utf8"));
  assert.deepEqual(sourcePackage.engines, { node: "26.8.1", npm: "11.19.0" });
  assert.equal(sourcePackage.packageManager, "npm@11.19.0");
  const packOutput = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", temporaryRoot], cliRoot));
  assert.equal(packOutput.length, 1);
  const packed = packOutput[0];
  const tarball = path.join(temporaryRoot, packed.filename);
  assert.equal(fs.existsSync(tarball), true);
  const packedPaths = packed.files.map(({ path: relativePath }) => relativePath).sort();
  assert.equal(packedPaths.includes("package.json"), true);
  assert.equal(packedPaths.includes("README.md"), true);
  assert.equal(packedPaths.includes("dist/authoring/add-operation.js"), true);
  assert.equal(packedPaths.includes("dist/cli/main.js"), true);
  assert.equal(packedPaths.includes("dist/meta-types/frozen-catalog.generated.js"), true);
  assert.equal(packedPaths.includes("dist/system-integration/frozen-profile.generated.js"), true);
  assert.equal(packedPaths.includes("dist/system-integration/compiler.js"), true);
  assert.equal(packedPaths.includes("contracts/instantiation-receipt.schema.json"), true);
  assert.equal(packedPaths.includes("contracts/target-observation.schema.json"), true);
  assert.equal(packedPaths.some((relativePath) => relativePath.startsWith("src/") || relativePath.startsWith("test/") || relativePath.startsWith("tools/")), false);

  const cleanRuns = ["consumer-one", "consumer-two"].map((name) => {
    const consumer = path.join(temporaryRoot, name);
    fs.mkdirSync(consumer);
    fs.writeFileSync(path.join(consumer, "package.json"), `${JSON.stringify({ private: true, type: "module" })}\n`);
    run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], consumer);
    const source = path.join(consumer, "source");
    fs.cpSync(fixtureRoot, source, { recursive: true });
    const executable = path.join(consumer, "node_modules/.bin/domainspec-v2");
    const target = path.join(consumer, "target");
    const authoringResult = JSON.parse(run(executable, [
      "add", "operation", source,
      "--feature", "alpha",
      "--name", "create-order",
      "--description", "Create an order from the current cart.",
      "--reads", "customer.status,cart.total",
      "--writes", "order.id,order.status,order.total",
      "--effects", "OrderCreated",
      "--guard", "customer-is-active-and-cart-is-valid",
      "--failure-continuation", "return-create-order-error",
    ], consumer));
    const sourceLint = JSON.parse(run(executable, ["lint", source], consumer));
    const result = JSON.parse(run(executable, ["instantiate", source, "--node", "alpha:settle", "--language", "typescript", "--target-root", target, "--integration-profile", "provider-neutral-v1", "--integration-binding-set", "settle-runtime"], consumer));
    return { consumer, executable, source, target, authoringResult, sourceLint, result };
  });
  const authoringResults = cleanRuns.map(({ authoringResult }) => authoringResult);
  assert.equal(authoringResults.every(({ result, selector, source_count }) => result === "pass" && selector === "alpha:create-order" && source_count === 12), true);
  assert.equal(authoringResults[0].source_manifest_sha256, authoringResults[1].source_manifest_sha256);
  assert.equal(cleanRuns.every(({ sourceLint, authoringResult }) => sourceLint.result === "pass" && sourceLint.source_manifest.manifest_sha256 === authoringResult.source_manifest_sha256), true);
  assert.equal(
    fs.readFileSync(path.join(cleanRuns[0].source, authoringResults[0].node_path), "utf8"),
    fs.readFileSync(path.join(cleanRuns[1].source, authoringResults[1].node_path), "utf8"),
  );
  const commandResults = cleanRuns.map(({ result }) => result);
  assert.equal(commandResults.every(({ result }) => result === "pass"), true);
  const deterministicInventory = inventory(cleanRuns[0].target);
  assert.deepEqual(deterministicInventory, inventory(cleanRuns[1].target));
  const lint = JSON.parse(run(cleanRuns[0].executable, ["lint", cleanRuns[0].target], cleanRuns[0].consumer));
  assert.equal(lint.result, "pass");
  const receipt = JSON.parse(run(cleanRuns[1].executable, ["receipt", cleanRuns[1].target], cleanRuns[1].consumer));
  assert.equal(receipt.observation.result, "pass");
  assert.equal(receipt.receipt.input.source_manifest_sha256, authoringResults[1].source_manifest_sha256);
  const mutatedArtifact = commandResults[0].observation.observed_artifacts[0].relative_path;
  fs.appendFileSync(path.join(cleanRuns[0].target, mutatedArtifact), "// clean-package causal drift\n");
  const failureRun = spawnSync(cleanRuns[0].executable, ["lint", cleanRuns[0].target], { cwd: cleanRuns[0].consumer, encoding: "utf8" });
  assert.equal(failureRun.status, 1, failureRun.stderr);
  const failureObservation = JSON.parse(failureRun.stdout);
  assert.equal(failureObservation.result, "fail");
  assert.equal(failureObservation.code, "MTCLI_OBSERVE_EXACT_REALIZATION");
  const schemaCases = [
    [path.join(cliRoot, "contracts/instantiation-receipt.schema.json"), receipt.receipt, "instantiation-receipt.json"],
    [path.join(cliRoot, "contracts/target-observation.schema.json"), receipt.observation, "target-observation.json"],
    [path.join(cliRoot, "contracts/target-observation.schema.json"), failureObservation, "target-observation-failure.json"],
  ];
  for (const [schemaPath, value, filename] of schemaCases) {
    const valuePath = path.join(temporaryRoot, filename);
    fs.writeFileSync(valuePath, `${JSON.stringify(value)}\n`);
    run("python3", ["-c", "import json,jsonschema,sys; jsonschema.Draft202012Validator(json.load(open(sys.argv[1]))).validate(json.load(open(sys.argv[2])))", schemaPath, valuePath], temporaryRoot);
  }

  const tarballSha256 = crypto.createHash("sha256").update(fs.readFileSync(tarball)).digest("hex");

  process.stdout.write(`${JSON.stringify({
    schema_version: "domainspec.clean-package-validation/v1",
    result: "pass",
    package: { filename: packed.filename, size_bytes: packed.size, sha256: tarballSha256, npm_sha1: packed.shasum, integrity: packed.integrity, files: packedPaths },
    clean_run_count: cleanRuns.length,
    authored_operation: {
      selector: authoringResults[0].selector,
      node_path: authoringResults[0].node_path,
      source_manifest_sha256: authoringResults[0].source_manifest_sha256,
    },
    deterministic_target_inventory: deterministicInventory,
    plan_sha256: commandResults[0].plan_sha256,
    receipt_sha256: commandResults[0].receipt_sha256,
    authority_effect: "none",
  }, null, 2)}\n`);
} finally {
  assert.equal(temporaryRoot.startsWith(path.join(os.tmpdir(), "domainspec-cli-clean-package-")), true);
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
