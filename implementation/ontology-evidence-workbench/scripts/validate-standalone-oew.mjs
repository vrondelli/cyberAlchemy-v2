#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const outputRoot = process.env.OEW_ACCEPTANCE_OUTPUT_ROOT
  ? resolve(root, process.env.OEW_ACCEPTANCE_OUTPUT_ROOT)
  : join(root, "generated/runs/WP-SOEW-001");
const receiptPath = join(outputRoot, "full-body-war-browser-acceptance.json");
const playwrightRoot = process.env.OEW_PLAYWRIGHT_ROOT ?? "/home/vrondelli/.nvm/versions/node/v22.12.0/lib/node_modules/playwright";
const require = createRequire(import.meta.url);
const { chromium } = require(playwrightRoot);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };

await stat(join(dist, "index.html"));
await mkdir(outputRoot, { recursive: true });

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
    const relative = pathname === "/" ? "index.html" : normalize(pathname).replace(/^[/\\]+/, "");
    if (relative.includes("..")) { response.writeHead(400).end(); return; }
    let path = join(dist, relative);
    try { await stat(path); } catch { path = join(dist, "index.html"); }
    const bytes = await readFile(path);
    response.writeHead(200, { "content-type": mime[extname(path)] ?? "application/octet-stream", "content-length": bytes.length, "cache-control": "no-store", "x-content-type-options": "nosniff" });
    response.end(bytes);
  } catch (error) { response.writeHead(500).end(String(error)); }
});
await new Promise((resolveListen, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolveListen); });
const address = server.address();
if (!address || typeof address === "string") throw new Error("Could not bind browser validation server.");
const baseUrl = `http://127.0.0.1:${address.port}`;
const errors = [];
const journeys = [];
const artifacts = [];
let browser;

async function step(id, action) {
  const started = performance.now();
  try { const detail = await action(); journeys.push({ id, result: "pass", duration_ms: Math.round(performance.now() - started), ...detail }); }
  catch (error) { const detail = error instanceof Error ? error.message : String(error); journeys.push({ id, result: "fail", duration_ms: Math.round(performance.now() - started), error: detail }); errors.push(`${id}: ${detail}`); }
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("requestfailed", (request) => errors.push(`resource: ${request.url()} ${request.failure()?.errorText ?? "failed"}`));

  await step("exact-static-data", async () => {
    const expected = { "presentation-graph.json": "e8f754e6aed7b05759439df82db421eb51fa050c78b86b37d5d689e89a751433", "evidence-sidecar.json": "df72eeb1e07a62c1256d03cd313fb8f79e3a9f4bc2c13f5bdade277d14e8bc4f", "adapter-receipt.json": "a31c074d5dfed697530f11a23a3bf9c6dca9350b68f7392b314c7f8a2003f9e8" };
    for (const [name, digest] of Object.entries(expected)) { const response = await fetch(`${baseUrl}/datasets/body-war/${name}`); const bytes = Buffer.from(await response.arrayBuffer()); if (response.status !== 200 || sha256(bytes) !== digest) throw new Error(`${name} delivery mismatch`); }
    return { files: 3 };
  });
  await step("bounded-default-scene", async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.getByText("Verified read-only projection", { exact: true }).waitFor();
    const graph = page.locator(".graph-canvas"); const visible = Number(await graph.getAttribute("data-visible-nodes")); const cards = await page.locator(".node-card").count(); const portals = await page.locator(".portal-card").count();
    if (visible !== 4 || cards !== 4 || portals < 1) throw new Error(`expected 4 bounded cards and portals, saw ${visible}/${cards}/${portals}`);
    return { visible_nodes: visible, mounted_cards: cards, portal_groups: portals };
  });
  await step("portal-pivot", async () => {
    const before = await page.locator(".node-card").count(); await page.locator(".portal-card").first().click(); await page.waitForTimeout(250); const after = await page.locator(".node-card").count(); const relationTypes = await page.locator(".relation-legend__items span").count();
    if (after > 18 || relationTypes < 1) throw new Error(`portal scene bounds or relation legend failed: ${after}/${relationTypes}`);
    return { before, after, visible_relation_types: relationTypes };
  });
  await step("selection-inspector", async () => {
    const card = page.locator(".node-card").first(); const id = await card.getAttribute("data-node-id"); await card.click(); await page.locator(`.inspector-content[data-selection-id="${id}"]`).waitFor(); return { selection_id: id };
  });
  await step("search-projection", async () => {
    const input = page.getByRole("searchbox"); await input.fill("runner"); await page.waitForTimeout(150); const cards = await page.locator(".node-card").count(); const output = await page.locator(".search-box output").textContent(); if (cards > 12 || !output || output.startsWith("0 ")) throw new Error(`search projection failed: ${cards}/${output}`); await input.fill(""); return { mounted_cards: cards, output };
  });
  await step("filter-projection", async () => {
    await page.locator(".filter-menu summary").click(); const checkbox = page.locator(".filter-menu input[type=checkbox]").first(); await checkbox.check(); await page.waitForTimeout(150); const cards = await page.locator(".node-card").count(); if (cards > 12) throw new Error(`filter mounted ${cards} cards`); await checkbox.uncheck(); await page.keyboard.press("Escape"); return { mounted_cards: cards };
  });
  await step("path-branch", async () => {
    await page.getByRole("button", { name: "Path", exact: true }).click(); await page.locator(".path-mode").waitFor(); const result = await page.locator(".path-branch li").count(); if (result < 2) throw new Error("default branch path was not rendered"); return { branch_nodes: result };
  });
  await step("keyboard-and-alternate-view", async () => {
    await page.keyboard.press("/"); if (await page.evaluate(() => document.activeElement?.id) !== "ontology-search") throw new Error("slash did not focus search"); await page.locator(".brand").click(); await page.keyboard.press("?"); await page.getByRole("dialog", { name: "Command palette" }).waitFor(); await page.getByRole("button", { name: /Open overview/ }).click(); await page.getByRole("button", { name: "Evidence", exact: true }).click(); await page.getByRole("tab", { name: "Table" }).click(); const rows = await page.locator(".evidence-table tbody tr").count(); if (!rows) throw new Error("table projection was empty"); return { table_rows: rows };
  });
  await step("invalid-deep-link-recovery", async () => {
    await page.goto(`${baseUrl}/?v=1&focus=ghost&mode=focus`, { waitUntil: "networkidle" }); await page.getByText(/link referred to unavailable ontology state/i).waitFor(); return { recovered: true };
  });
  await step("responsive-mobile", async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(baseUrl, { waitUntil: "networkidle" }); await page.getByText("Verified read-only projection", { exact: true }).waitFor(); const width = await page.evaluate(() => document.documentElement.scrollWidth); if (width > 390) throw new Error(`horizontal page overflow ${width}px`); const path = join(outputRoot, "body-war-mobile.png"); await page.screenshot({ path, fullPage: true }); artifacts.push({ role: "screenshot-mobile", path: "body-war-mobile.png", sha256: sha256(await readFile(path)) }); return { scroll_width: width };
  });
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(baseUrl, { waitUntil: "networkidle" }); const desktopPath = join(outputRoot, "body-war-desktop.png"); await page.screenshot({ path: desktopPath, fullPage: true }); artifacts.push({ role: "screenshot-desktop", path: "body-war-desktop.png", sha256: sha256(await readFile(desktopPath)) });
  await context.close();
} finally {
  await browser?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

const browserVersion = browser?.version?.() ?? "unknown";
const playwrightPackage = JSON.parse(await readFile(join(playwrightRoot, "package.json"), "utf8"));
const receipt = {
  schema_version: "oew.standalone-browser-acceptance.v1", work_pack_id: "WP-SOEW-001", result: errors.length || journeys.some((journey) => journey.result !== "pass") ? "fail" : "pass", created_at: new Date().toISOString(), authority_effect: "none",
  dataset: { run_id: "BODY-WAR-ONTOLOGY-001", nodes: 237, relations: 231, graph_sha256: "e8f754e6aed7b05759439df82db421eb51fa050c78b86b37d5d689e89a751433", sidecar_sha256: "df72eeb1e07a62c1256d03cd313fb8f79e3a9f4bc2c13f5bdade277d14e8bc4f", receipt_sha256: "a31c074d5dfed697530f11a23a3bf9c6dca9350b68f7392b314c7f8a2003f9e8" },
  environment: { node: process.version, playwright: playwrightPackage.version, browser: browserVersion, executable: chromium.executablePath(), viewport_matrix: ["1440x900", "390x844"], reduced_motion: true },
  journeys, errors: [...new Set(errors)], artifacts, evidence_ceiling: "Candidate-local read-only prototype acceptance; no ontology promotion, deployment, release, or production claim."
};
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ receipt: receiptPath, result: receipt.result, journeys: journeys.length, errors: receipt.errors.length }, null, 2));
if (receipt.result !== "pass") process.exitCode = 1;
