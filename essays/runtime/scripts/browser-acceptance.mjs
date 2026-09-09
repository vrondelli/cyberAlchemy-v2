import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const playwrightRoot = process.env.ESSAYS_PLAYWRIGHT_ROOT
  ?? "/home/vrondelli/.nvm/versions/node/v22.12.0/lib/node_modules/playwright";
const chromiumExecutable = process.env.ESSAYS_CHROMIUM_EXECUTABLE
  ?? "/home/vrondelli/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome";
const baseUrl = process.env.ESSAYS_BASE_URL ?? "http://127.0.0.1:4186";
const outputRoot = process.env.ESSAYS_BROWSER_OUTPUT ?? "/tmp/essays-browser-acceptance";
const { chromium } = require(playwrightRoot);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
const requests = [];
const httpErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("request", (request) => requests.push(request.url()));
page.on("response", (response) => {
  if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
});

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
assert(await page.getByRole("heading", { name: "Begin with intent, not a blank page." }).isVisible(), "setup heading missing");
await page.getByLabel("Essay working title").fill("The Bug Ticket That Became an Ontology");
await page.getByLabel("Writer name").fill("Runtime witness");
await page.getByRole("button", { name: "Create local studio" }).click();
await page.getByRole("heading", { name: "Text intent" }).waitFor();

await page.getByLabel("Objective").fill("Explain how a debugging process can reveal an ontology defect");
await page.getByLabel("Audience").fill("Engineers and product leaders working with DDD");
await page.getByLabel("Tone").fill("technical, descriptive, and narrative");
await page.getByLabel(/Constraints/).fill("Use a believable bug-ticket story\nPreserve fault evidence");
await page.getByRole("button", { name: "Accept intent" }).click();
await page.getByRole("button", { name: "Generate & accept local plan" }).click();
await page.locator(".ProseMirror").waitFor();
assert(await page.getByText("No writing agent was invoked.", { exact: false }).isVisible(), "Whisper claim ceiling missing");
assert(await page.getByText("Changes remain a working buffer", { exact: false }).isVisible(), "editor authority instruction missing");

// First prove the blocked path with an exact addressable review.
await page.locator(".ProseMirror").fill("Draft without title.\n\nTODO verify the evidence.\n\nA closing thought.");
await page.waitForFunction(() => /\d+ words/.test(document.querySelector(".editor-footer span")?.textContent ?? ""));
await page.getByRole("button", { name: "Save accepted draft" }).click();
await page.getByRole("button", { name: "Open editorial review" }).click();
await page.locator(".review-list").waitFor();
const blockingCards = page.locator(".review-card.blocking[data-block-id]");
const blockingCardCount = await blockingCards.count();
if (blockingCardCount < 1) {
  const diagnostics = await page.evaluate(() => ({
    reviewText: document.querySelector(".review-list")?.textContent ?? null,
    workspace: JSON.parse(localStorage.getItem("cyberalchemy.essays.workspace.local-essay-workspace") ?? "null"),
  }));
  throw new Error(`blocking review comments are not addressable: ${JSON.stringify(diagnostics)}`);
}
await page.getByRole("button", { name: "Validate current revision" }).click();
const exportButton = page.getByRole("button", { name: "Export reviewable package" });
assert(await exportButton.isDisabled(), "export must be disabled while blocking residue remains");
assert(await page.locator(".residue-list .blocking").count() > 0, "blocking residue is not visible");

// Replace the working buffer with a writer-approved, reviewable exact revision.
const paragraphs = [
  "The ticket looked ordinary: customers could reserve a room that operations had already marked unavailable. The engineer began at the API boundary, reproduced the failure, and saved the request, response, and timestamp before touching the rule.",
  "The logs showed no transport error. The command had passed validation, the aggregate had accepted it, and the availability projection had returned a positive answer. That narrowed the fault from infrastructure to the meaning carried between models.",
  "In the projection code, unavailable meant that no inventory row existed for the requested date. In the operations model, unavailable meant that a room was blocked by maintenance, owner policy, or an accepted reservation. The same word named two different predicates.",
  "The engineer documented the fault as an ontology mismatch, not merely a bad conditional. The ticket recorded the competing definitions, their owners, the evidence that distinguished them, and the invariant that availability must be decided by the product policy before projection.",
  "The fix changed code, but the durable product work changed the model. Once the distinction became explicit, the team could route future rules, tests, and UI language through one owned definition instead of rediscovering it in another incident.",
];
const acceptedMarkdown = `# The Bug Ticket That Became an Ontology\n\n${paragraphs.join("\n\n")}`;
await page.locator(".ProseMirror").fill(acceptedMarkdown);
await page.waitForFunction(() => Number.parseInt(document.querySelector(".editor-footer span")?.textContent ?? "0", 10) >= 120);
await page.getByRole("button", { name: "Save accepted draft" }).click();
await page.getByRole("button", { name: "Refresh review for this revision" }).click();
await page.getByText(/Essay r\d+ · (?:open|resolved) · \d+ open/).waitFor();
assert(await page.locator(".review-card.blocking").count() === 0, "accepted draft has unexpected blocking review");
await page.getByRole("button", { name: "Validate current revision" }).click();
assert(!(await exportButton.isDisabled()), "validated exact revision should be export eligible");

const downloadPromise = page.waitForEvent("download");
await exportButton.click();
const download = await downloadPromise;
const downloadedPath = await download.path();
assert(downloadedPath, "local export did not produce a file");
const manifest = JSON.parse(readFileSync(downloadedPath, "utf8"));
assert(manifest.publicationEffect === "none", "export implied publication");
assert(manifest.markdown.includes("ontology mismatch"), "export does not contain exact accepted prose");
assert(manifest.blocks.every((block) => block.blockId && block.partId), "export lost stable block identities");

// Persistence and reload preserve the Essays-owned accepted snapshot.
const revisionBeforeReload = await page.locator(".save-state").textContent();
await page.reload({ waitUntil: "networkidle" });
await page.locator(".topbar h1", { hasText: "The Bug Ticket That Became an Ontology" }).waitFor();
assert((await page.locator(".save-state").textContent()) === revisionBeforeReload, "workspace revision did not persist");
assert((await page.locator(".ProseMirror").textContent()).includes("ontology mismatch"), "accepted draft did not persist");

// Keyboard focus, visible focus, semantic editor labeling, and review association.
await page.getByLabel("Objective").focus();
await page.keyboard.press("Tab");
const focused = page.locator(":focus");
const focusStyle = await focused.evaluate((element) => {
  const style = getComputedStyle(element);
  return { tag: element.tagName, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
});
assert(focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth !== "0px", "keyboard focus is not visible");
assert(await page.locator('[data-testid="milkdown-editor"][aria-label="Essay Markdown editor"][aria-describedby="editor-instructions"]').count() === 1, "editor semantic label or instructions binding missing");
assert(await page.locator('[aria-label^="Review review-"]').count() === 1, "review is not associated with its exact revision");

await page.screenshot({ path: `${outputRoot}-desktop.png`, fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: `${outputRoot}-mobile.png`, fullPage: true });
const viewportOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
assert(viewportOverflow <= 1, `narrow layout has ${viewportOverflow}px horizontal overflow`);

const nonLocalRequests = requests.filter((url) => !url.startsWith(baseUrl));
assert(nonLocalRequests.length === 0, `unexpected non-local requests: ${nonLocalRequests.join(", ")}`);
assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(" | ")}; HTTP: ${httpErrors.join(" | ")}`);
assert(httpErrors.length === 0, `HTTP errors: ${httpErrors.join(" | ")}`);

console.log(JSON.stringify({
  status: "PASS",
  playwrightVersion: require(`${playwrightRoot}/package.json`).version,
  chromiumExecutable,
  url: baseUrl,
  checks: {
    setupAndSemanticLabels: "PASS",
    explicitIntentPlanAndDraftAuthority: "PASS",
    stableAddressableReview: "PASS",
    blockedExport: "PASS",
    successfulExactRevisionExport: "PASS",
    localPersistence: "PASS",
    keyboardAndVisibleFocus: "PASS",
    narrowViewportNoOverflow: "PASS",
    consoleAndPageErrors: "PASS",
    nonLocalNetworkRequests: "PASS",
  },
  export: {
    suggestedFilename: download.suggestedFilename(),
    essayRevision: manifest.essayRevision,
    blockCount: manifest.blocks.length,
    publicationEffect: manifest.publicationEffect,
  },
  screenshots: [`${outputRoot}-desktop.png`, `${outputRoot}-mobile.png`],
}, null, 2));

await browser.close();
