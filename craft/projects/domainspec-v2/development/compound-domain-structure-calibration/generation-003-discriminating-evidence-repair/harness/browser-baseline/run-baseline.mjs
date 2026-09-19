import { createHash } from "node:crypto";
import { createReadStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "../../browser-runtime/node_modules/playwright/index.mjs";
import { validateBrowserSourceManifest } from "../../runtime/validate-browser-contracts.mjs";
import { validateBrowserRuntimeDescriptor } from "../../runtime/validate-browser-runtime.mjs";
import { buildHarness } from "./build.mjs";

const harnessRoot = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(harnessRoot, "../..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const runName = process.argv[2] ?? "raw-run-1";
const runRoot = resolve(packageRoot, "evidence/generation-003/browser-baseline", runName);
const screenshotRoot = resolve(runRoot, "screenshots");
mkdirSync(screenshotRoot, { recursive: true });

const descriptor = readJson(resolve(packageRoot, "browser-runtime/runtime-descriptor.json"));
const sourceManifestPath = resolve(packageRoot, "fixtures/generation-003/browser-source-manifest.json");
const sourceManifest = readJson(sourceManifestPath);
const vectors = readJson(resolve(harnessRoot, "vectors.json")).vectors;
validateBrowserRuntimeDescriptor(descriptor, { repositoryRoot });
validateBrowserSourceManifest(sourceManifest, { runtimeHandle: descriptor.runtime_handle, targetSetHandle: descriptor.atomic_target_set_handle });
await buildHarness();

const server = await startServer();
const browser = await chromium.launch({ headless: true });
try {
  const results = [];
  const screenshotDigests = [];
  for (const vector of vectors) {
    const page = await browser.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${server.address().port}/?vector=${encodeURIComponent(vector.vector_id)}`);
    if (vector.input.action !== "render") {
      await page.locator(`[data-action='${vector.input.action}']`).click();
      await page.waitForFunction((expected) => {
        const element = document.querySelector("[data-structured-state]");
        return element && JSON.parse(element.getAttribute("data-structured-state")).committed_step === expected;
      }, vector.expected.committed_step);
    }
    const observed = await page.locator("[data-structured-state]").evaluate((element) => JSON.parse(element.getAttribute("data-structured-state")));
    const screenshotPath = resolve(screenshotRoot, `${vector.vector_id}.png`);
    await page.screenshot({ path: screenshotPath, animations: "disabled", fullPage: true });
    const screenshotSha256 = digest(readFileSync(screenshotPath));
    screenshotDigests.push(screenshotSha256);
    results.push({ vector_id: vector.vector_id, expected: vector.expected, observed, comparison: same(vector.expected, observed) ? "match" : "different" });
    await page.close();
  }
  const output = {
    schema_version: "cdsc.browser-baseline-run.v1",
    runtime_handle: descriptor.runtime_handle,
    source_manifest_handle: digest(readFileSync(sourceManifestPath)),
    target_set_handle: descriptor.atomic_target_set_handle,
    render_engine: "react",
    react_version: "19.2.7",
    vectors: results,
    supporting_screenshots: [...new Set(screenshotDigests)].sort(),
  };
  writeFileSync(resolve(runRoot, "run.json"), `${JSON.stringify(output, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(output)}\n`);
} finally {
  await browser.close();
  await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
}

async function startServer() {
  const files = {
    "/": resolve(harnessRoot, "index.html"),
    "/bundle.js": resolve(harnessRoot, "dist/bundle.js"),
  };
  const server = createServer((request, response) => {
    const path = new URL(request.url, "http://127.0.0.1").pathname;
    const file = files[path];
    if (!file) {
      response.writeHead(404).end("not found");
      return;
    }
    response.setHeader("content-type", extname(file) === ".js" ? "text/javascript" : "text/html");
    createReadStream(file).pipe(response);
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  return server;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function digest(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
