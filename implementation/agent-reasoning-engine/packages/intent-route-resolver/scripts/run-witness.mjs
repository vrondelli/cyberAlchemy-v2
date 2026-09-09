#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import {dirname, relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {
  canonicalJson,
  sha256HexText,
} from "../index.mjs";
import {executeWitnessCases} from "../test/fixtures/witness/evaluate.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDirectory, "..");
const repositoryRoot = resolve(scriptDirectory, "../../../../../..");
const generatedRoot = resolve(
  repositoryRoot,
  "cyberAlchemy-v2/implementation/agent-reasoning-engine/generated/runs",
);

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (key === "--finalize-browser") {
      result.finalizeBrowser = true;
      continue;
    }
    const value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`missing value for ${key}`);
    }
    result[key.slice(2)] = value;
    index += 1;
  }
  if (!result.output) throw new Error("--output is required");
  return result;
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function boundedOutput(rawPath) {
  const target = resolve(repositoryRoot, rawPath);
  if (relative(generatedRoot, target).startsWith("..")) {
    throw new Error("output must be under the intent-route-resolver generated runs root");
  }
  return target;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function sourceInventory() {
  const paths = [
    "addon-manifest.json",
    "index.mjs",
    "src/canonical-json.mjs",
    "src/catalog.mjs",
    "src/eligibility.mjs",
    "src/json-port.mjs",
    "src/request.mjs",
    "src/resolve.mjs",
    "src/selected-local.mjs",
    "test/fixtures/witness/cases.json",
    "test/fixtures/witness/evaluate.mjs",
  ];
  return paths.map((path) => {
    const bytes = readFileSync(resolve(packageRoot, path));
    return {path, sha256: sha256Bytes(bytes), size_bytes: bytes.length};
  });
}

function importAudit() {
  const paths = [
    "index.mjs",
    "src/canonical-json.mjs",
    "src/catalog.mjs",
    "src/eligibility.mjs",
    "src/json-port.mjs",
    "src/request.mjs",
    "src/resolve.mjs",
    "src/selected-local.mjs",
  ];
  const patterns = [
    ["node-import", /from\s+["']node:/g],
    ["process", /\bprocess\./g],
    ["buffer", /\bBuffer\b/g],
    ["network", /\b(fetch|XMLHttpRequest|WebSocket)\b/g],
    ["filesystem", /\b(readFile|writeFile|mkdir|openSync)\b/g],
    ["runtime-sdk", /\b(OpenAI|Anthropic|Deno|Bun)\b/g],
    ["dispatch-effect", /\b(dispatch|approve|executeEffect)\s*\(/g],
  ];
  const matches = [];
  for (const path of paths) {
    const source = readFileSync(resolve(packageRoot, path), "utf8");
    for (const [kind, pattern] of patterns) {
      for (const match of source.matchAll(pattern)) {
        matches.push({path, kind, token: match[0]});
      }
    }
  }
  return {
    status: matches.length === 0 ? "PASS" : "FAIL",
    forbidden_matches: matches,
    exported_core_external_calls: 0,
    exported_core_model_calls: 0,
    exported_core_filesystem_calls: 0,
    exported_core_persistence_calls: 0,
    exported_core_dispatch_calls: 0,
    exported_core_effect_calls: 0,
  };
}

function signedReceipt(material) {
  return {
    ...material,
    receipt_digest: sha256HexText(canonicalJson(material)),
  };
}

function initialRun(args, output) {
  if (!args["run-id"]) throw new Error("--run-id is required");
  if (existsSync(output)) throw new Error("selected output directory already exists");
  mkdirSync(output, {recursive: true});

  const fixtureBytes = readFileSync(
    resolve(packageRoot, "test/fixtures/witness/cases.json"),
  );
  const fixtureDocument = JSON.parse(fixtureBytes);
  const results = executeWitnessCases(fixtureDocument);
  const resultsPath = resolve(output, "node-results.json");
  writeJson(resultsPath, results);
  const audit = importAudit();
  const pass = results.status === "PASS" && audit.status === "PASS";
  const receipt = signedReceipt({
    schema_version: "intent-route.node-witness-receipt@1",
    run_id: args["run-id"],
    package_identity: "@cyberalchemy/intent-route-resolver@0.1.0",
    source_inventory: sourceInventory(),
    fixture_input_digest: sha256Bytes(fixtureBytes),
    fixture_output_digest: sha256HexText(canonicalJson(results)),
    assertions: {
      fixed_matrix: results.status,
      case_count: results.case_count,
      comparison_count: results.comparison_count,
      dependency_import_audit: audit,
    },
    harness_write_inventory: [
      "node-results.json",
      "node-receipt.json",
    ],
    browser_status: "pending-shared-runtime-validation",
    claim_ceiling: "Private L0 typed-input Node conformance only; no natural-language, host, product UX, approval, execution, publication, or promotion claim.",
    residue: [
      "Browser main-thread and worker parity must pass before the aggregate witness can close.",
    ],
    terminal_status: pass ? "PASS" : "FAIL",
    authority_effect: "none",
  });
  writeJson(resolve(output, "node-receipt.json"), receipt);
  process.stdout.write(`${JSON.stringify({
    run_id: args["run-id"],
    node_status: receipt.terminal_status,
    cases: results.case_count,
    comparisons: results.comparison_count,
    browser_status: receipt.browser_status,
  })}\n`);
  if (!pass) process.exitCode = 1;
}

function finalizeBrowser(args, output) {
  if (!args["browser-summary"] || !args.screenshot) {
    throw new Error("--browser-summary and --screenshot are required for finalization");
  }
  const summary = JSON.parse(args["browser-summary"]);
  const expected = {
    status: "PASS",
    case_count: 17,
    main_matches_node: true,
    worker_matches_node: true,
    main_matches_worker: true,
  };
  if (canonicalJson(summary) !== canonicalJson(expected)) {
    throw new Error("browser summary does not satisfy the fixed witness contract");
  }
  const screenshotPath = resolve(repositoryRoot, args.screenshot);
  if (!existsSync(screenshotPath) || !statSync(screenshotPath).isFile()) {
    throw new Error("browser screenshot is missing");
  }
  const nodeReceiptPath = resolve(output, "node-receipt.json");
  const nodeResultsPath = resolve(output, "node-results.json");
  const nodeReceipt = JSON.parse(readFileSync(nodeReceiptPath, "utf8"));
  if (nodeReceipt.terminal_status !== "PASS") throw new Error("Node witness did not pass");

  const browserReceipt = signedReceipt({
    schema_version: "intent-route.browser-witness-receipt@1",
    summary,
    screenshot: {
      path: relative(repositoryRoot, screenshotPath),
      sha256: sha256Bytes(readFileSync(screenshotPath)),
      size_bytes: statSync(screenshotPath).size,
    },
    authority_effect: "none",
    status: "PASS",
  });
  writeJson(resolve(output, "browser-receipt.json"), browserReceipt);

  const aggregate = signedReceipt({
    schema_version: "intent-route.witness-receipt@1",
    run_id: nodeReceipt.run_id,
    package_identity: nodeReceipt.package_identity,
    node_receipt: {
      path: "node-receipt.json",
      sha256: sha256Bytes(readFileSync(nodeReceiptPath)),
    },
    node_results: {
      path: "node-results.json",
      sha256: sha256Bytes(readFileSync(nodeResultsPath)),
    },
    browser_receipt: {
      path: "browser-receipt.json",
      sha256: sha256Bytes(readFileSync(resolve(output, "browser-receipt.json"))),
    },
    harness_write_inventory: [
      "browser-receipt.json",
      relative(output, screenshotPath),
      "node-receipt.json",
      "node-results.json",
      "receipt.json",
    ].sort(),
    claim_ceiling: "Private L0 typed-input and browser-runtime conformance only; no natural-language, host, product UX, approval, execution, publication, or promotion claim.",
    residue: [
      "Consumer installation, runtime-owned projection, catalog ownership, decision persistence, approval, and execution remain outside this witness.",
    ],
    terminal_status: "PASS",
    authority_effect: "none",
  });
  writeJson(resolve(output, "receipt.json"), aggregate);
  process.stdout.write(`${JSON.stringify({
    run_id: aggregate.run_id,
    terminal_status: aggregate.terminal_status,
    browser_status: browserReceipt.status,
    receipt_digest: aggregate.receipt_digest,
  })}\n`);
}

const args = parseArgs(process.argv.slice(2));
const output = boundedOutput(args.output);
if (args.finalizeBrowser) finalizeBrowser(args, output);
else initialRun(args, output);
