#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {
  compressHenHints,
  createBenchmarkResearchRuntime,
  createDurableEvolutionKernel,
  loadHenFrontierImportManifest,
  materializeHenCandidateView,
} from "../index.mjs";

const args = process.argv.slice(2);
const rootIndex = args.indexOf("--root");
const repositoryIndex = args.indexOf("--repository-root");
const root = rootIndex >= 0 ? args[rootIndex + 1] : null;
const repositoryRoot = repositoryIndex >= 0 ? args[repositoryIndex + 1] : null;
const constructionOverride = args.includes("--construction-disabled-definitions");

function output(value, status = 0) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
  process.exitCode = status;
}

function invalid(code = "prototype.request-invalid") {
  output({schema_version: "are.evolution-prototype-cli-result/v1", ok: false, reason_codes: [code], authority_effect: "none"}, 2);
}

const consumed = new Set(["--root", "--repository-root", "--construction-disabled-definitions", root, repositoryRoot]);
if (!root || !repositoryRoot || args.some((arg, index) => !consumed.has(arg) && index !== rootIndex + 1 && index !== repositoryIndex + 1)) {
  invalid();
} else {
  let request;
  try { request = JSON.parse(readFileSync(0, "utf8")); } catch { invalid(); process.exit(2); }
  const inputs = new Map([
    ["inspect", []],
    ["import-hen", ["imported_at", "actor"]],
    ["advance-hen", ["actor"]],
    ["compress-hen-hints", ["hints"]],
    ["build-hen-candidate-view", ["task_ref", "query_results"]],
    ["reconstruction-bundle", []],
  ]);
  if (!request || Object.keys(request).some((key) => !["schema_version", "operation", "input"].includes(key)) || request.schema_version !== "are.evolution-prototype-cli-request/v1" || !inputs.has(request.operation) || !request.input || typeof request.input !== "object" || Array.isArray(request.input) || Object.keys(request.input).some((key) => !inputs.get(request.operation).includes(key))) {
    invalid();
  } else {
    try {
      const kernel = createDurableEvolutionKernel({root: resolve(root), require_enabled: !constructionOverride});
      const runtime = createBenchmarkResearchRuntime({kernel, repository_root: resolve(repositoryRoot)});
      const result = request.operation === "build-hen-candidate-view"
        ? materializeHenCandidateView(request.input)
        : request.operation === "compress-hen-hints"
        ? compressHenHints(request.input.hints)
        : request.operation === "import-hen"
          ? runtime.importFrontier({manifest: loadHenFrontierImportManifest(), imported_at: request.input.imported_at, actor: request.input.actor})
          : request.operation === "advance-hen"
            ? runtime.advanceHen({actor: request.input.actor})
          : request.operation === "reconstruction-bundle"
            ? runtime.reconstructionBundle()
            : runtime.inspect();
      output(result, result.ok === false ? 2 : 0);
    } catch (error) {
      output({schema_version: "are.evolution-prototype-cli-result/v1", ok: false, reason_codes: ["prototype.request-failed"], residue: [{message: error.message}], authority_effect: "none"}, 2);
    }
  }
}
