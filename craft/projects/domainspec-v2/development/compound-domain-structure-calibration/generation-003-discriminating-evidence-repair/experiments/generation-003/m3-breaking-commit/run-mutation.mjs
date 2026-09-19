import { createHash } from "node:crypto";
import { createReadStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "../../../browser-runtime/node_modules/esbuild/lib/main.js";
import { chromium } from "../../../browser-runtime/node_modules/playwright/index.mjs";
import { validateBrowserEditDiff, validateBrowserObservationReceipt } from "../../../runtime/validate-browser-contracts.mjs";
import "./prepare.mjs";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(experimentRoot, "../../..");
const runName = process.argv[2] ?? "raw-run-1";
const evidenceRoot = resolve(packageRoot, "evidence/generation-003/m3-breaking-commit", runName);
const screenshotRoot = resolve(evidenceRoot, "screenshots");
mkdirSync(screenshotRoot, { recursive: true });
const descriptor = readJson(resolve(packageRoot, "browser-runtime/runtime-descriptor.json"));
const baselineReceipt = readJson(resolve(packageRoot, "evidence/generation-003/browser-baseline/build-receipt.json"));
const sourceManifestPath = resolve(packageRoot, "fixtures/generation-003/browser-source-manifest.json");
const vectors = readJson(resolve(experimentRoot, "frames/baseline/vectors.json")).vectors.filter((item) => ["V4-inactive-request-9", "V5-premature-request-9"].includes(item.vector_id));
const bundleRoot = resolve(experimentRoot, "dist");
mkdirSync(bundleRoot, { recursive: true });
await Promise.all([buildFrame("baseline"), buildFrame("mutant")]);
const editDiff = {
  schema_version: "cdsc.browser-edit-diff.v1",
  mutation_id: "M3-B",
  allowed_edit_surface: ["harness/browser-baseline/App.jsx"],
  changed_paths: ["harness/browser-baseline/App.jsx"],
  before_sha256: digest(readFileSync(resolve(experimentRoot, "frames/baseline/App.jsx"))),
  after_sha256: digest(readFileSync(resolve(experimentRoot, "frames/mutant/App.jsx"))),
  protected_roots_unchanged: true,
};
validateBrowserEditDiff(editDiff);
const server = await startServer();
const browser = await chromium.launch({ headless: true });
try {
  const vectorResults = [];
  const screenshots = [];
  const guardCommitComparison = [];
  for (const vector of vectors) {
    const baseline = await executeVector(browser, server, "baseline", vector);
    const mutant = await executeVector(browser, server, "mutant", vector, screenshotRoot);
    screenshots.push(mutant.screenshot_sha256);
    delete mutant.screenshot_sha256;
    vectorResults.push({ vector_id: vector.vector_id, baseline, mutant, comparison: same(baseline, mutant) ? "match" : "different" });
    guardCommitComparison.push({
      vector_id: vector.vector_id,
      guard_allowed: baseline.guard_allowed,
      requested_step: baseline.requested_step,
      guard_result_step: baseline.committed_step,
      baseline_committed_step: baseline.committed_step,
      mutant_committed_step: mutant.committed_step,
      notice_present: mutant.notice_present,
    });
  }
  const tB01 = guardCommitComparison.every((item) => item.guard_allowed === false && item.mutant_committed_step !== item.guard_result_step);
  const tB02 = guardCommitComparison.every((item) => item.mutant_committed_step === item.requested_step && item.mutant_committed_step !== item.baseline_committed_step);
  const receipt = {
    schema_version: "cdsc.browser-observation-receipt.v1",
    mutation_id: "M3-B",
    runtime_handle: descriptor.runtime_handle,
    source_manifest_handle: digest(readFileSync(sourceManifestPath)),
    baseline_witness_handle: baselineReceipt.baseline_witness_handle,
    target_set_handle: descriptor.atomic_target_set_handle,
    vector_results: vectorResults,
    target_observations: [
      { target_id: "T-B-01", state: tB01 ? "supported" : "refuted", evidence_fields: ["guard_allowed", "requested_step", "committed_step"] },
      { target_id: "T-B-02", state: tB02 ? "supported" : "refuted", evidence_fields: ["rendered_child_id", "requested_step", "committed_step"] },
    ],
    supporting_screenshots: [...new Set(screenshots)].sort(),
    uncertainty: ["Guard-result destination is represented by the accepted baseline committed step and separately projected in the target-comparison sidecar."],
  };
  validateBrowserObservationReceipt(receipt, { runtimeHandle: descriptor.runtime_handle, sourceManifestHandle: receipt.source_manifest_handle, baselineWitnessHandle: baselineReceipt.baseline_witness_handle, targetSetHandle: descriptor.atomic_target_set_handle });
  const output = { schema_version: "cdsc.m3-breaking-run.v1", edit_diff: editDiff, guard_commit_comparison: guardCommitComparison, observation_receipt: receipt };
  writeFileSync(resolve(evidenceRoot, "run.json"), `${JSON.stringify(output, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(output)}\n`);
} finally {
  await browser.close();
  await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
}

async function buildFrame(frame) {
  return build({ entryPoints: [resolve(experimentRoot, `frames/${frame}/App.jsx`)], outfile: resolve(bundleRoot, `${frame}.js`), bundle: true, format: "iife", platform: "browser", target: ["chrome149"], jsx: "automatic", legalComments: "none", sourcemap: false, nodePaths: [resolve(packageRoot, "browser-runtime/node_modules")] });
}

async function executeVector(browser, server, frame, vector, screenshotRoot = null) {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/${frame}?vector=${encodeURIComponent(vector.vector_id)}`);
  await page.locator("[data-action='navigate']").click();
  const expected = frame === "mutant" ? vector.input.requested_step : vector.expected.committed_step;
  await page.waitForFunction((step) => JSON.parse(document.querySelector("[data-structured-state]").getAttribute("data-structured-state")).committed_step === step, expected);
  const state = await page.locator("[data-structured-state]").evaluate((element) => JSON.parse(element.getAttribute("data-structured-state")));
  if (screenshotRoot) {
    const path = resolve(screenshotRoot, `${vector.vector_id}.png`);
    await page.screenshot({ path, animations: "disabled", fullPage: true });
    state.screenshot_sha256 = digest(readFileSync(path));
  }
  await page.close();
  return state;
}

async function startServer() {
  const template = readFileSync(resolve(packageRoot, "harness/browser-baseline/index.html"), "utf8");
  const server = createServer((request, response) => {
    const path = new URL(request.url, "http://127.0.0.1").pathname;
    if (path === "/baseline" || path === "/mutant") { response.setHeader("content-type", "text/html"); response.end(template.replace("/bundle.js", `/bundle-${path.slice(1)}.js`)); return; }
    if (path === "/bundle-baseline.js" || path === "/bundle-mutant.js") { response.setHeader("content-type", "text/javascript"); createReadStream(resolve(bundleRoot, `${path.includes("baseline") ? "baseline" : "mutant"}.js`)).pipe(response); return; }
    response.writeHead(404).end("not found");
  });
  await new Promise((resolveListen, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolveListen); });
  return server;
}

function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function digest(value) { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
