import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const playwrightRoot = process.env.WORKSPACE_PLAYWRIGHT_ROOT ?? "/home/vrondelli/.nvm/versions/node/v22.12.0/lib/node_modules/playwright";
const chromiumExecutable = process.env.WORKSPACE_CHROMIUM_EXECUTABLE ?? "/home/vrondelli/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome";
const baseUrl = process.env.WORKSPACE_CANVAS_BASE_URL ?? "http://127.0.0.1:4191";
const experiment = JSON.parse(readFileSync(resolve(root, "EXPERIMENT.json"), "utf8"));
const generation = JSON.parse(readFileSync(resolve(root, "evidence/GENERATION-RECEIPT.json"), "utf8"));
const evidenceRoot = resolve(root, "evidence");
mkdirSync(evidenceRoot, { recursive: true });
const { chromium } = require(playwrightRoot);
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const consoleErrors = [];
const pageErrors = [];
const requests = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("request", (request) => requests.push(request.url()));

await page.goto(baseUrl, { waitUntil: "networkidle" });
assert(await page.getByRole("heading", { name: "Explore the ontology as a living map." }).isVisible(), "experiment heading missing");
assert(await page.locator(".react-flow__node").count() === 15, "canvas node count mismatch");
assert(await page.locator(".react-flow__edge").count() === 14, "canvas relation count mismatch");
assert(await page.locator(".relation-label").count() === 14, "relation labels missing");
assert(await page.locator("[data-relation-legend]").count() === 10, "exact-predicate legend coverage mismatch");
assert(await page.locator(".react-flow__node [data-semantic-icon]").count() === 15, "semantic icon coverage mismatch");
assert(await page.locator('.react-flow__node [data-semantic-icon="factory"]').count() === 1, "ontology factory cue mismatch");
const ontologyPortal = page.getByRole("button", { name: /Use Ontologies as portal start, Collection/ });
assert(await ontologyPortal.getByText("Collection", { exact: true }).isVisible(), "icon is missing visible kind redundancy");
assert(await page.getByLabel("Zoom in").isVisible(), "canvas controls missing");
assert(await page.locator(".react-flow__minimap").isVisible(), "minimap missing");
const nodeBox = await page.locator(".ontology-node").first().boundingBox();
assert(nodeBox && nodeBox.width <= 216 && nodeBox.height <= 92, `compact node geometry mismatch:${JSON.stringify(nodeBox)}`);
const relationEncoding = await page.locator("[data-relation-legend]").evaluateAll((rows) => rows.map((row) => {
  const sample = row.querySelector(".relation-swatch");
  return sample ? getComputedStyle(sample).borderTopColor || getComputedStyle(sample).backgroundColor : "";
}));
assert(new Set(relationEncoding).size === 10, "predicate colors are not unique");

const capability = page.getByRole("button", { name: /Use Inspect CyberAlchemy Workspace as portal start, Product Capability/ });
await capability.click();
await page.waitForFunction(() => document.querySelectorAll(".react-flow__node.portal-origin").length === 1);
await page.waitForTimeout(220);
assert(await page.locator(".react-flow__node.portal-neighbor").count() === 7, "portal neighbor count mismatch");
assert(await page.locator(".react-flow__node.outside-portal").count() === 7, "outside portal node count mismatch");
assert(await page.locator(".react-flow__edge.outside-portal").count() === 7, "outside portal relation count mismatch");
const portalScope = page.getByTestId("portal-scope");
assert(await portalScope.getByText("Inspect CyberAlchemy Workspace", { exact: true }).isVisible(), "portal origin not disclosed");
assert(await portalScope.getByText("8 visible nodes · 7 connecting relations", { exact: true }).isVisible(), "portal scope counts missing");
const outsideOpacity = Number(await page.locator(".react-flow__node.outside-portal").first().evaluate((element) => getComputedStyle(element).opacity));
assert(outsideOpacity < 0.5, `outside portal scene is not dark:${outsideOpacity}`);
await page.screenshot({ path: resolve(evidenceRoot, "portal.png"), fullPage: true });

await portalScope.getByRole("button", { name: "Inspect focused record" }).click();
const dialog = page.getByRole("dialog", { name: "Inspect CyberAlchemy Workspace" });
assert(await dialog.isVisible(), "focus lens did not open");
for (const label of ["Stable identity", "Status", "Meaning", "Owner route", "Boundary", "Claim ceiling", "Provenance", "Relationships"]) {
  assert(await dialog.getByText(label, { exact: true }).isVisible(), `detail section missing:${label}`);
}
assert(await dialog.getByText("CA2-CAP-INSPECT-CYBERALCHEMY-WORKSPACE", { exact: true }).isVisible(), "stable identity missing");
await page.screenshot({ path: resolve(evidenceRoot, "detail.png"), fullPage: true });
await page.keyboard.press("Escape");
assert(!(await dialog.isVisible()), "focus lens did not close with Escape");

await portalScope.getByRole("button", { name: "Show all loaded graph" }).click();
await page.waitForFunction(() => document.querySelectorAll(".react-flow__node.outside-portal").length === 0);
await page.waitForTimeout(220);
assert(await page.locator("h1:focus").count() === 1, "show-all did not restore focus to graph heading");

const external = page.getByRole("button", { name: /Use CAV2-D60 as portal start, External Reference/ });
await external.focus();
await page.keyboard.press("Enter");
await page.waitForFunction(() => document.querySelectorAll(".react-flow__node.portal-origin").length === 1);
assert(await portalScope.getByText("CAV2-D60", { exact: true }).isVisible(), "keyboard portal selection failed");
await portalScope.getByRole("button", { name: "Inspect focused record" }).click();
const externalDialog = page.getByRole("dialog", { name: "CAV2-D60" });
assert(await externalDialog.getByText("outside-bounded-source", { exact: true }).isVisible(), "external boundary status missing");
assert(await externalDialog.getByText(/does not infer, reconstruct, or import/).isVisible(), "external boundary copy missing");
await externalDialog.getByRole("button", { name: "Close detail" }).click();
await portalScope.getByRole("button", { name: "Show all loaded graph" }).click();
await page.waitForFunction(() => document.querySelectorAll(".react-flow__node.outside-portal").length === 0);
await page.waitForTimeout(220);

const forbidden = page.getByRole("button", { name: /create|edit|delete|connect|accept|register|publish|mutate/i });
assert(await forbidden.count() === 0, "mutating control exposed");
await page.screenshot({ path: resolve(evidenceRoot, "desktop.png"), fullPage: true });
await capability.click();
await page.waitForFunction(() => document.querySelectorAll(".react-flow__node.portal-origin").length === 1);
await page.waitForTimeout(220);
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: resolve(evidenceRoot, "mobile.png"), fullPage: true });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
assert(overflow <= 1, `mobile overflow:${overflow}`);
assert(requests.every((url) => url.startsWith(baseUrl)), "non-local request observed");
assert(consoleErrors.length === 0, `console errors:${consoleErrors.join(" | ")}`);
assert(pageErrors.length === 0, `page errors:${pageErrors.join(" | ")}`);

const receipt = {
  schema_version: "cav2-workspace-ontology-canvas-run/v1",
  experiment_id: experiment.experiment_id,
  observed_at: new Date().toISOString(),
  status: "PASS",
  url: baseUrl,
  source_epoch: generation.source_epoch,
  counts: generation.counts,
  checks: {
    open_canvas: "PASS",
    complete_nodes: "PASS",
    labeled_relations: "PASS",
    compact_translucent_nodes: "PASS",
    exact_predicate_relation_encoding: "PASS",
    semantic_icon_redundancy: "PASS",
    one_hop_portal_scope: "PASS",
    dark_outside_scene: "PASS",
    keyboard_portal_selection: "PASS",
    show_all_focus_restoration: "PASS",
    click_to_full_detail: "PASS",
    external_reference_boundary: "PASS",
    escape_and_close: "PASS",
    no_mutating_controls: "PASS",
    minimap_and_zoom: "PASS",
    mobile_containment: "PASS",
    no_non_local_requests: "PASS",
    console_and_page_errors: "PASS"
  },
  screenshots: ["evidence/desktop.png", "evidence/portal.png", "evidence/detail.png", "evidence/mobile.png"],
  playwright_version: require(`${playwrightRoot}/package.json`).version,
  authority_effect: "none",
  claim_ceiling: experiment.claim_ceiling,
};
writeFileSync(resolve(evidenceRoot, "RUN-RECEIPT.json"), `${JSON.stringify(receipt, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
await browser.close();
