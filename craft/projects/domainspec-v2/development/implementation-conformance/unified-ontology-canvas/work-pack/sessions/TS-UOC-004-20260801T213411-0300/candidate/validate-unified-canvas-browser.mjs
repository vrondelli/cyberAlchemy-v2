import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile, stat} from "node:fs/promises";
import {existsSync} from "node:fs";
import {createRequire} from "node:module";
import {resolve, extname, relative, sep} from "node:path";
import {execFileSync} from "node:child_process";
import {once} from "node:events";

const repositoryRoot = process.cwd();
const experimentPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment";
const serverRoot = resolve(repositoryRoot, experimentPath);
const htmlName = "architecture-ontology-view.html";
const mimeTypes = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
});
const safePath = (requestPath) => {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const requested = decoded === "/" ? `/${htmlName}` : decoded;
  const candidate = resolve(serverRoot, `.${requested}`);
  const rel = relative(serverRoot, candidate);
  if (rel.startsWith(`..${sep}`) || rel === ".." || rel.startsWith("/")) return null;
  return candidate;
};
const createStaticServer = (requestLog) => createServer(async (request, response) => {
  try {
    if (!request.url || !["GET", "HEAD"].includes(request.method ?? "")) {
      response.writeHead(405).end();
      return;
    }
    const target = safePath(request.url);
    if (!target || !existsSync(target) || !(await stat(target)).isFile()) {
      response.writeHead(404, {"content-type": "text/plain; charset=utf-8"}).end("not found");
      return;
    }
    requestLog.push(new URL(request.url, "http://127.0.0.1").pathname);
    const body = await readFile(target);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(target)] ?? "application/octet-stream",
      "cache-control": "no-store",
      "content-length": body.length,
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    response.writeHead(500, {"content-type": "text/plain; charset=utf-8"}).end(error.message);
  }
});
const closeServer = async (server) => {
  if (!server.listening) return;
  await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
};
const runStatic = async () => {
  const globalRoot = execFileSync("npm", ["root", "-g"], {encoding: "utf8"}).trim();
  const require = createRequire(import.meta.url);
  const playwright = require(resolve(globalRoot, "playwright"));
  const playwrightPackage = require(resolve(globalRoot, "playwright/package.json"));
  const executablePath = playwright.chromium.executablePath();
  assert.ok(existsSync(executablePath), `Chromium executable missing: ${executablePath}`);
  const requestLog = [];
  const browserRequests = [];
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];
  const server = createStaticServer(requestLog);
  let browser = null;
  let cleanupConfirmed = false;
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const origin = `http://127.0.0.1:${address.port}`;
    browser = await playwright.chromium.launch({headless: true, executablePath});
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    page.on("request", (request) => browserRequests.push(request.url()));
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => { if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`); });
    await page.goto(`${origin}/${htmlName}`, {waitUntil: "networkidle"});
    await page.waitForFunction(() => window.__UOC_STATIC_RECEIPT__?.ready === true);
    const receipt = await page.evaluate(() => window.__UOC_STATIC_RECEIPT__);
    const bandCount = await page.locator("[data-layer='bands'] > [data-band]").count();
    const nodeCount = await page.locator("[data-layer='nodes'] > [data-node-id]").count();
    const edgeCount = await page.locator("[data-layer='edges'] > [data-edge-id]").count();
    const nodeIds = await page.locator("[data-node-id]").evaluateAll((elements) => elements.map((element) => element.dataset.nodeId));
    const edgeIds = await page.locator("[data-edge-id]").evaluateAll((elements) => elements.map((element) => element.dataset.edgeId));
    const families = await page.locator("[data-node-id]").evaluateAll((elements) => [...new Set(elements.map((element) => element.dataset.family))].sort());
    const emphasizedNodes = await page.locator("[data-node-id].is-emphasized").count();
    const dimmedNodes = await page.locator("[data-node-id].is-dimmed").count();
    assert.equal(bandCount, 5);
    assert.equal(nodeCount, 95);
    assert.equal(edgeCount, 147);
    assert.equal(new Set(nodeIds).size, nodeCount);
    assert.equal(new Set(edgeIds).size, edgeCount);
    assert.deepEqual(families, ["architecture-type", "constraint", "fact-element", "fact-relation", "finding", "meta-type", "profile", "property"]);
    assert.equal(receipt.node_count, nodeCount);
    assert.equal(receipt.edge_count, edgeCount);
    assert.equal(receipt.band_count, bandCount);
    assert.equal(receipt.source_mutated, false);
    assert.equal(receipt.authority_effect, "none");
    assert.ok(emphasizedNodes > 0 && dimmedNodes > 0 && emphasizedNodes + dimmedNodes === nodeCount);
    assert.equal(await page.locator("[data-view]").count(), 0, "legacy lens controls must not reconstruct the graph");
    assert.equal(consoleErrors.length, 0);
    assert.equal(pageErrors.length, 0);
    assert.equal(failedResponses.length, 0);
    assert.ok(browserRequests.every((url) => new URL(url).origin === origin), `external request observed: ${browserRequests.join(", ")}`);
    await browser.close();
    browser = null;
    await closeServer(server);
    cleanupConfirmed = !server.listening;
    assert.equal(cleanupConfirmed, true);
    return {
      verdict: "pass",
      mode: "static",
      playwright_version: playwrightPackage.version,
      chromium_executable: executablePath,
      origin,
      graph_id: receipt.graph_id,
      graph_digest: receipt.graph_digest,
      layout_digest: receipt.layout_digest,
      selectors: {bands: bandCount, nodes: nodeCount, edges: edgeCount, emphasized_nodes: emphasizedNodes, dimmed_nodes: dimmedNodes},
      families,
      request_audit: {server_requests: requestLog.length, browser_requests: browserRequests.length, external_requests: 0, failed_responses: 0},
      error_audit: {console_errors: 0, page_errors: 0},
      source_mutated: false,
      server_cleanup: cleanupConfirmed,
    };
  } finally {
    if (browser) await browser.close();
    await closeServer(server);
  }
};

const mode = process.argv[process.argv.indexOf("--mode") + 1];
if (mode !== "static") throw new Error(`Expected --mode static; received ${mode ?? "none"}.`);
const receipt = await runStatic();
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
