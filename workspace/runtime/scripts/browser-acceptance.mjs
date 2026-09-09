import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const playwrightRoot = process.env.WORKSPACE_PLAYWRIGHT_ROOT
  ?? "/home/vrondelli/.nvm/versions/node/v22.12.0/lib/node_modules/playwright";
const chromiumExecutable = process.env.WORKSPACE_CHROMIUM_EXECUTABLE
  ?? "/home/vrondelli/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome";
const baseUrl = process.env.WORKSPACE_BASE_URL ?? "http://127.0.0.1:4187";
const outputRoot = process.env.WORKSPACE_BROWSER_OUTPUT ?? "/tmp/cyberalchemy-workspace-browser-acceptance";
const expectOntologyUnavailable = process.env.WORKSPACE_EXPECT_ONTOLOGY_UNAVAILABLE === "1";
const { chromium } = require(playwrightRoot);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertMobileLifecycleRail(viewportWidth) {
  await page.setViewportSize({ width: viewportWidth, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0);

  const stageRail = page.locator(".stage-rail");
  assert(await stageRail.count() === 1, `${viewportWidth}px viewport does not expose exactly one lifecycle rail`);
  const geometry = await stageRail.evaluate((rail) => {
    const rect = (element) => {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
    };
    const items = Array.from(rail.querySelectorAll(":scope > li"));
    const labels = items.map((item) => item.querySelector(":scope > span:last-child"));
    const appRail = document.querySelector(".app-rail");
    if (!appRail || labels.some((label) => !label)) throw new Error("MOBILE_LIFECYCLE_GEOMETRY_UNAVAILABLE");
    return {
      clientWidth: rail.clientWidth,
      scrollWidth: rail.scrollWidth,
      rail: rect(rail),
      items: items.map(rect),
      labels: labels.map((label) => rect(label)),
      viewportWidth: window.innerWidth,
      appRailTop: appRail.getBoundingClientRect().top,
    };
  });

  assert(geometry.items.length === 5, `${viewportWidth}px viewport does not render exactly five lifecycle stages`);
  assert(geometry.labels.length === 5, `${viewportWidth}px viewport does not render exactly five lifecycle labels`);
  assert(geometry.scrollWidth <= geometry.clientWidth + 1, `${viewportWidth}px lifecycle rail scrolls horizontally`);
  const withinRailAndViewport = (bounds) => bounds.left >= geometry.rail.left - 1
    && bounds.right <= geometry.rail.right + 1
    && bounds.left >= -1
    && bounds.right <= geometry.viewportWidth + 1;
  assert(geometry.items.every(withinRailAndViewport), `${viewportWidth}px lifecycle item escapes the rail or viewport`);
  assert(geometry.labels.every(withinRailAndViewport), `${viewportWidth}px lifecycle label escapes the rail or viewport`);
  assert(geometry.rail.bottom <= geometry.appRailTop + 1, `${viewportWidth}px lifecycle rail is obscured by the fixed application rail`);
}

async function assertDesktopEssaysGeometry() {
  const plane = page.locator(".essays-owned-plane");
  const dock = page.locator(".agent-dock");
  assert(await plane.count() === 1, "desktop Essays surface does not expose exactly one owned plane");
  assert(await dock.count() === 1, "desktop Essays surface does not expose exactly one agent dock");

  const planeBox = await plane.boundingBox();
  const dockBox = await dock.boundingBox();
  assert(planeBox && dockBox, "desktop Essays plane or agent dock has no measurable geometry");
  assert(planeBox.x + planeBox.width <= dockBox.x + 1, "desktop Essays owned plane does not end before the agent dock");
  const planeWidths = await plane.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
  assert(planeWidths.scrollWidth <= planeWidths.clientWidth + 1, "desktop Essays plane scrolls horizontally");
  const documentWidths = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert(documentWidths.scrollWidth <= documentWidths.clientWidth + 1, "desktop document scrolls horizontally");

  const targets = [
    ["review panel", page.locator(".review-panel")],
    ["Editorial review heading", page.getByRole("heading", { name: "Editorial review" })],
    ["Open editorial review button", page.getByRole("button", { name: "Open editorial review" })],
    ["Residue & export heading", page.getByRole("heading", { name: "Residue & export" })],
    ["Validate current revision button", page.getByRole("button", { name: "Validate current revision" })],
    ["Export reviewable package button", page.getByRole("button", { name: "Export reviewable package" })],
  ];
  for (const [name, target] of targets) {
    assert(await target.count() === 1, `desktop Essays ${name} is missing or ambiguous`);
    assert(await target.evaluate((element) => Boolean(element.closest(".essays-owned-plane"))), `desktop Essays ${name} is outside the owned plane`);
    const bounds = await target.boundingBox();
    assert(bounds, `desktop Essays ${name} has no measurable geometry`);
    assert(bounds.x >= planeBox.x - 1 && bounds.x + bounds.width <= planeBox.x + planeBox.width + 1, `desktop Essays ${name} escapes the owned plane`);
    assert(bounds.y >= planeBox.y - 1 && bounds.y + bounds.height <= planeBox.y + planeBox.height + 1, `desktop Essays ${name} escapes the owned plane vertically`);
    assert(bounds.x + bounds.width <= dockBox.x + 1, `desktop Essays ${name} is clipped by the agent dock`);
  }
}

const browser = await chromium.launch({ headless: true, executablePath: chromiumExecutable });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
context.setDefaultTimeout(15_000);
const page = await context.newPage();
try {
const consoleErrors = [];
const pageErrors = [];
const requests = [];
const httpErrors = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(`${message.text()} (${message.location().url})`); });
page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("request", (request) => requests.push(request.url()));
page.on("response", (response) => { if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`); });

await page.goto(baseUrl, { waitUntil: "networkidle" });
assert(await page.getByRole("heading", { name: "Dashboard", exact: true }).isVisible(), "Workspace dashboard heading missing");
await page.getByRole("button", { name: "Explore workspace", exact: true }).click();
assert(await page.getByRole("heading", { name: "Explore the system." }).isVisible(), "Workspace explore heading missing");
assert(await page.getByRole("button", { name: "Explore workspace" }).getAttribute("aria-current") === "page", "Explore icon destination is not selected");
assert(await page.getByRole("button", { name: "Open Essays" }).isVisible(), "Essays icon destination missing");
assert(await page.getByRole("button", { name: "Open Ontology" }).isVisible(), "Ontology icon destination missing");
assert(await page.getByRole("button", { name: "Open governed chat" }).isVisible(), "governed chat destination missing");
assert(await page.getByRole("tab", { name: /Projects/ }).getAttribute("aria-selected") === "true", "Projects collection is not the initial real-project surface");
assert(await page.locator(".rail-action[title]").count() === 0, "rail buttons retained competing native title tooltips");
await page.keyboard.press("Tab");
await page.getByRole("button", { name: "Explore workspace" }).focus();
await page.getByRole("button", { name: "Open Essays" }).hover();
const visibleRailTooltips = page.locator(".rail-tooltip:visible");
assert(await visibleRailTooltips.count() === 1, "pointer hover and keyboard focus did not expose exactly one rail tooltip");
assert(await visibleRailTooltips.textContent() === "Explore workspace", "keyboard focus did not retain the exclusive Explore tooltip during Essays hover");

const ontologyResponse = expectOntologyUnavailable
  ? page.waitForResponse(response => response.url() === `${baseUrl}/api/ontology-v4`)
  : null;
await page.getByRole("button", { name: "Open Ontology" }).click();
assert(page.url().endsWith("#/ontology"), "Ontology destination did not open");
if (ontologyResponse) {
  assert((await ontologyResponse).status() === 404, "isolated dashboard ontology boundary changed");
  await page.getByRole("alert").filter({hasText: "v4 read model unavailable."}).waitFor({state: "visible"});
}
await page.getByRole("button", { name: "Show Workspace graph", exact: true }).click();
await page.getByRole("heading", { name: "Follow meaning through its relations." }).waitFor({ state: "visible" });
assert(await page.getByRole("heading", { name: "Follow meaning through its relations." }).isVisible(), "ontology heading missing");
assert(await page.getByText("b60385638745", { exact: true }).isVisible(), "current graph epoch is not disclosed separately");
assert(await page.locator(".react-flow__minimap").isVisible(), "ontology minimap missing");
assert(await page.getByRole("group", { name: "Exact predicate presentation filters" }).isVisible(), "predicate filter group missing");

const essaysPortal = page.getByRole("button", { name: "Focus Essays, Project Entry, proposed" });
assert(await essaysPortal.count() === 1, "Essays ontology node lacks one unambiguous keyboard focus target");
await essaysPortal.focus();
await page.keyboard.press("Enter");
assert(await page.getByTestId("portal-scope").getByText("Essays", { exact: true }).isVisible(), "Essays portal did not activate by keyboard");
assert(await page.getByTestId("portal-scope").getByText("2 visible nodes · 1 connecting relations", { exact: true }).isVisible(), "Essays one-hop portal scope is not exact");
await page.getByRole("button", { name: "Inspect record & relations" }).click();
assert(await page.getByRole("dialog").isVisible(), "ontology detail dialog missing");
assert(await page.getByRole("dialog").evaluate((dialog) => dialog.contains(document.activeElement)), "modal focus did not enter the ontology detail dialog");
assert(await page.getByRole("dialog").getByLabel("Textual relationship view").isVisible(), "textual relation alternative missing");
assert(await page.getByRole("dialog").getByText("includes entry", { exact: true }).isVisible(), "exact predicate missing from textual relation view");
assert(await page.getByRole("dialog").getByText("WORKSPACE-COLLECTION-PROJECTS", { exact: true }).isVisible(), "related stable identity missing from textual relation view");
await page.getByRole("button", { name: "Close ontology detail" }).click();
await page.waitForFunction(() => document.activeElement?.getAttribute("data-portal-node-id") === "CA2-PROJECT-ESSAYS");
assert(await essaysPortal.evaluate((element) => element === document.activeElement), "focus did not return to the selected ontology node");
await page.getByRole("button", { name: "Show filtered graph" }).click();
await essaysPortal.focus();
await page.keyboard.press("Space");
assert(await page.getByTestId("portal-scope").getByText("Essays", { exact: true }).isVisible(), "Essays portal did not activate with Space");

await page.getByRole("button", { name: /coordination/i }).click();
assert(await page.locator(".relation-label[data-relation-type='coordinates']").count() === 1, "coordination filter lost the exact coordinates predicate");
assert(await page.locator(".relation-label[data-relation-type='serves']").count() === 1, "coordination filter lost the exact serves predicate");
assert(await page.locator(".relation-label[data-relation-type='enables']").count() === 1, "coordination filter lost the exact enables predicate");
assert(await page.locator(".relation-label:not([data-relation-type='coordinates']):not([data-relation-type='serves']):not([data-relation-type='enables'])").count() === 0, "coordination filter leaked a predicate outside its declared presentation family");
await page.waitForTimeout(250);
assert(await page.locator(".react-flow__node.outside-portal").count() === 0, "filtered graph retained stale portal dimming");
const filteredBounds = await page.locator(".react-flow__node").evaluateAll((elements) => { const boxes = elements.map((element) => element.getBoundingClientRect()); return { left: Math.min(...boxes.map((box) => box.left)), right: Math.max(...boxes.map((box) => box.right)) }; });
const canvasBounds = await page.locator(".flow-frame").boundingBox();
assert(canvasBounds && (filteredBounds.right - filteredBounds.left) / canvasBounds.width >= 0.5, "filtered ontology graph was not refitted to a useful canvas scale");
assert(await page.getByText("Color is redundant. Labels, arrows, and line patterns preserve predicate and direction.").isVisible(), "non-color semantic cue disclosure missing");
await page.screenshot({ path: `${outputRoot}-ontology-coordination-desktop.png`, fullPage: true });
await page.getByRole("button", { name: /^all/i }).click();
await page.screenshot({ path: `${outputRoot}-ontology-desktop.png`, fullPage: true });

await page.getByRole("button", { name: "Explore workspace" }).click();

const essaysRecord = page.locator(".record-list button").filter({ hasText: "CA2-PROJECT-ESSAYS" });
assert(await essaysRecord.count() === 1, "generated Essays project record missing or ambiguous");
await essaysRecord.click();
assert(await page.getByText("Essays Project owner", { exact: true }).isVisible(), "Essays owner boundary missing");
await page.getByRole("button", { name: /Open owned capability Essays/ }).click();
assert(page.url().endsWith("#/essays"), "Essays destination did not open");
await page.getByText("Essays-owned action plane").waitFor({ state: "visible" });
assert(await page.getByText("Essays-owned action plane").isVisible(), "Essays ownership strip missing");
assert(await page.getByRole("heading", { name: "Desktop runtime unavailable" }).isVisible(), "web-mode agent boundary missing");
assert(await page.getByText("No principal, proposal, or acceptance was simulated.").isVisible(), "web-mode non-simulation disclosure missing");

assert(await page.getByRole("heading", { name: "Begin with intent, not a blank page." }).isVisible(), "embedded Essays setup missing");
await page.getByRole("button", { name: "Create local studio" }).click();
await page.setViewportSize({ width: 1280, height: 820 });
assert(await page.evaluate(() => window.innerWidth === 1280 && window.innerHeight === 820), "desktop Essays viewport is not exactly 1280x820 after studio creation");
assert(await page.getByRole("heading", { name: "Ontology as a Product Practice" }).isVisible(), "Essays studio did not initialize");
assert(await page.getByRole("heading", { name: "Text intent" }).isVisible(), "Essays lifecycle did not remain present");
assert(await page.locator(".save-state").filter({ hasText: /Local revision \d+/ }).isVisible(), "Essays local revision evidence missing");

const acceptIntent = page.getByRole("button", { name: "Accept intent" });
assert(await acceptIntent.count() === 1, "Accept intent action is missing or ambiguous");
await acceptIntent.click();
const generatePlan = page.getByRole("button", { name: "Generate & accept local plan" });
await generatePlan.waitFor({ state: "visible" });
assert(await generatePlan.count() === 1, "Generate and accept plan action is missing or ambiguous");
await generatePlan.click();
await page.getByRole("heading", { name: "Composition plan" }).waitFor({ state: "visible" });
await page.locator("[data-testid=milkdown-editor]").waitFor({ state: "visible" });
const revisionBeforeSave = Number((await page.locator(".save-state").textContent())?.match(/\d+/)?.[0] ?? -1);
const saveDraft = page.getByRole("button", { name: "Save accepted draft" });
assert(await saveDraft.count() === 1, "Save accepted draft action is missing or ambiguous");
await saveDraft.click();
await page.waitForFunction((previousRevision) => {
  const revision = Number(document.querySelector(".save-state")?.textContent?.match(/\d+/)?.[0] ?? -1);
  return revision > previousRevision;
}, revisionBeforeSave);
const savedNotice = page.getByRole("status").filter({ hasText: "Writer-approved draft revision saved." });
await savedNotice.waitFor({ state: "visible" });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForFunction(() => window.scrollY === 0);
await assertDesktopEssaysGeometry();

await page.getByRole("button", { name: "Explore workspace" }).click();
assert(await page.getByRole("heading", { name: "Explore the system." }).isVisible(), "icon rail did not return to Explore");
await page.keyboard.press("Tab");
const focusStyle = await page.locator(":focus").evaluate((element) => {
  const style = getComputedStyle(element);
  return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
});
assert(focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth !== "0px", "keyboard focus is not visible");

await page.screenshot({ path: `${outputRoot}-desktop.png`, fullPage: true });
await page.getByRole("button", { name: "Open governed chat" }).click();
assert(page.url().endsWith("#/chat"), "governed chat destination did not open");
await page.getByRole("heading", { name: "Work in conversation." }).waitFor({ state: "visible" });
assert(await page.getByText("Workspace → Tauri → ARE wrapper → Codex app-server", { exact: true }).isVisible(), "chat boundary chain missing");
const decisionsToggle = page.locator('button[aria-controls="are-decisions-panel"]');
// The full Chat route shows decisions directly; the dock uses a disclosure.
if (await decisionsToggle.isVisible()) {
  await decisionsToggle.click();
  assert(await decisionsToggle.getAttribute("aria-expanded") === "true", "Chat decisions did not expand");
}
await page.getByRole("alert").getByText("Chat requires the Tauri desktop and a host-configured ARE Codex bridge.", { exact: true }).waitFor({ state: "visible" });
assert(await page.getByRole("alert").getByText("Chat requires the Tauri desktop and a host-configured ARE Codex bridge.", { exact: true }).isVisible(), "web chat did not fail closed at the desktop boundary");
assert(await page.getByLabel("Message the governed Codex session").isDisabled(), "web chat composer is enabled without the native ARE bridge");
assert(await page.getByRole("button", { name: "Send", exact: true }).isDisabled(), "web chat send is enabled without the native ARE bridge");
assert(await page.getByRole("switch", { name: /Auto approve/ }).isDisabled(), "web chat approvals are enabled without the native ARE bridge");
await page.screenshot({ path: `${outputRoot}-chat-web-boundary.png`, fullPage: true });
await page.getByRole("button", { name: "Open Essays" }).click();
for (const viewportWidth of [320, 390]) {
  await assertMobileLifecycleRail(viewportWidth);
  const mobileRail = await page.locator(".app-rail").boundingBox();
  for (const control of [page.getByLabel("Objective"), page.getByRole("button", { name: "Validate current revision" })]) {
    await control.focus();
    const mobileControl = await control.boundingBox();
    assert(mobileControl && mobileRail && mobileControl.y + mobileControl.height <= mobileRail.y, `${viewportWidth}px focused mobile control is obscured by the fixed rail`);
  }
  assert(await page.locator(".rail-tooltip:visible").count() === 0, `${viewportWidth}px mobile rail exposed an obscuring tooltip`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert(overflow <= 1, `${viewportWidth}px narrow layout has ${overflow}px horizontal overflow`);
}
await page.screenshot({ path: `${outputRoot}-mobile.png`, fullPage: false });

const nonLocalRequests = requests.filter((url) => !url.startsWith(baseUrl));
assert(nonLocalRequests.length === 0, `unexpected non-local requests: ${nonLocalRequests.join(", ")}`);
assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
const expectedConsoleErrors = expectOntologyUnavailable ? consoleErrors.filter(error =>
  error === `Failed to load resource: the server responded with a status of 404 (Not Found) (${baseUrl}/api/ontology-v4)`) : [];
const unexpectedConsoleErrors = consoleErrors.filter(error => !expectedConsoleErrors.includes(error));
assert(unexpectedConsoleErrors.length === 0, `console errors: ${unexpectedConsoleErrors.join(" | ")}`);
const unexpectedHttpErrors = httpErrors.filter(error => !(expectOntologyUnavailable && error === `404 ${baseUrl}/api/ontology-v4`));
assert(unexpectedHttpErrors.length === 0, `HTTP errors: ${unexpectedHttpErrors.join(" | ")}`);

console.log(JSON.stringify({
  status: "PASS",
  url: baseUrl,
  playwrightVersion: require(`${playwrightRoot}/package.json`).version,
  expectedUnavailableEndpoints: expectOntologyUnavailable ? ["/api/ontology-v4: verified 404 and visible unavailable alert"] : [],
  sourceFixtures: {
    explore: "preserved exact-byte WorkspaceSnapshot; canonical freshness blocked by WORKSPACE_CATALOG_SNAPSHOT_DRIFT",
    ontology: "bundled Workspace graph; not a fresh ontology event replay",
  },
  projectRecord: "CA2-PROJECT-ESSAYS",
  checks: {
    iconFirstAccessibleNavigation: "PASS",
    mutuallyExclusiveRailTooltip: "PASS",
    ontologyCurrentGraphEpoch: "PASS",
    ontologyKeyboardPortal: "PASS",
    ontologyExactPredicateFilter: "PASS",
    ontologyTextAlternativeAndFocusRestore: "PASS",
    ontologyModalFocusAndSpaceActivation: "PASS",
    ontologyFilteredViewRefit: "PASS",
    realEssaysProjectRecord: "PASS",
    essaysOwnershipBoundary: "PASS",
    embeddedEssaysLifecycle: "PASS",
    embeddedEssaysDesktopGeometry: "PASS",
    governedChatWebBoundary: "PASS",
    webAgentRuntimeUnavailable: "PASS",
    noSimulatedPrincipalOrAcceptance: "PASS",
    keyboardFocus: "PASS",
    mobileFocusedControlClearsRail: "PASS",
    mobileTooltipsSuppressed: "PASS",
    narrowViewportNoOverflow: "PASS",
    noNonLocalRequests: "PASS",
    consoleAndPageErrors: "PASS",
  },
  screenshots: [`${outputRoot}-ontology-desktop.png`, `${outputRoot}-ontology-coordination-desktop.png`, `${outputRoot}-desktop.png`, `${outputRoot}-chat-web-boundary.png`, `${outputRoot}-mobile.png`],
}, null, 2));

} finally {
  await browser.close();
}
