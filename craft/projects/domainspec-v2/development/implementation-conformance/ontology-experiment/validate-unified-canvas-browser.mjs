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
    if (new URL(request.url, "http://127.0.0.1").pathname === "/favicon.ico") {
      requestLog.push("/favicon.ico");
      response.writeHead(204, {"cache-control": "no-store"}).end();
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
const runBrowser = async (mode) => {
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
    try {
      await page.waitForFunction(() => window.__UOC_STATIC_RECEIPT__?.ready === true);
    } catch (error) {
      throw new Error(`${error.message}; console=${consoleErrors.join(" | ")}; page=${pageErrors.join(" | ")}`);
    }
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
    assert.equal(nodeCount, 129);
    assert.equal(edgeCount, 209);
    assert.equal(new Set(nodeIds).size, nodeCount);
    assert.equal(new Set(edgeIds).size, edgeCount);
    assert.deepEqual(families, ["architecture-type", "constraint", "fact-element", "fact-relation", "finding", "meta-type", "profile", "property", "scene-artifact"]);
    assert.equal(receipt.node_count, nodeCount);
    assert.equal(receipt.edge_count, edgeCount);
    assert.equal(receipt.band_count, bandCount);
    assert.equal(receipt.source_mutated, false);
    assert.equal(receipt.authority_effect, "none");
    assert.equal(receipt.graph_id, "unified-canvas:prototype");
    assert.equal(receipt.layout_id, "unified-layout:prototype");
    assert.equal(receipt.verification_status, "prototype-unverified");
    assert.equal(await page.locator("#loading").isVisible(), false, "loading layer must leave layout after the graph is ready");
    assert.equal(await page.locator("#ontology-canvas").isVisible(), true, "ready graph must be visible");
    for (const generatedField of [
      ["graph", "digest"],
      ["layout", "digest"],
      ["node", "layout", "digest"],
      ["source", "digests"],
    ].map((parts) => parts.join("_"))) {
      assert.equal(generatedField in receipt, false, `generated verification field present: ${generatedField}`);
    }
    assert.ok(emphasizedNodes > 0 && dimmedNodes > 0 && emphasizedNodes + dimmedNodes === nodeCount);
    assert.equal(await page.locator("[data-view]").count(), 0, "legacy lens controls must not reconstruct the graph");
    let visibilityEvidence = null;
    let focusEvidence = null;
    let inspectEvidence = null;
    let viewportEvidence = null;
    let navigatorEvidence = null;
    let canvasKeyboardEvidence = null;
    let surfaceEvidence = null;
    let sceneEvidence = null;
    let responsiveEvidence = null;
    if (mode === "visibility") {
      await page.waitForFunction(() => window.__UOC_VISIBILITY_RECEIPT__?.ready === true);
      const expectedNodeIds = [...nodeIds].sort();
      const expectedEdgeIds = [...edgeIds].sort();
      const graphIds = [receipt.graph_id];
      const assertIdentitySets = async () => {
        const currentNodeIds = await page.locator("[data-node-id]").evaluateAll((elements) => elements.map((element) => element.dataset.nodeId).sort());
        const currentEdgeIds = await page.locator("[data-edge-id]").evaluateAll((elements) => elements.map((element) => element.dataset.edgeId).sort());
        assert.deepEqual(currentNodeIds, expectedNodeIds);
        assert.deepEqual(currentEdgeIds, expectedEdgeIds);
        const currentGraphId = await page.locator("#ontology-canvas").getAttribute("data-graph-id");
        graphIds.push(currentGraphId);
        assert.equal(currentGraphId, receipt.graph_id);
      };
      const selectFilter = async (selector, value) => {
        await page.selectOption(selector, value);
        await page.waitForFunction(([filterSelector, expected]) => document.querySelector(filterSelector)?.value === expected && window.__UOC_VISIBILITY_RECEIPT__?.ready === true, [selector, value]);
        await assertIdentitySets();
        return page.evaluate(() => window.__UOC_VISIBILITY_RECEIPT__);
      };

      await selectFilter("#filter-mode", "hide");
      let visibilityReceipt = await selectFilter("#filter-family", "fact-element");
      assert.equal(visibilityReceipt.node_counts.visible, 3);
      assert.equal(visibilityReceipt.node_counts.hidden, 126);
      assert.ok(visibilityReceipt.edge_counts.hidden > 0);

      visibilityReceipt = await selectFilter("#filter-mode", "dim");
      assert.equal(visibilityReceipt.node_counts.dimmed, 126);
      assert.equal(visibilityReceipt.node_counts.hidden ?? 0, 0);

      await page.click("#clear-filters");
      await assertIdentitySets();
      await selectFilter("#filter-mode", "hide");
      visibilityReceipt = await selectFilter("#filter-maturity", "active");
      assert.ok(visibilityReceipt.node_counts.visible > 0 && visibilityReceipt.node_counts.visible < nodeCount);

      await page.click("#clear-filters");
      await assertIdentitySets();
      await selectFilter("#filter-mode", "hide");
      visibilityReceipt = await selectFilter("#filter-coverage", "unsupported");
      assert.ok(visibilityReceipt.node_counts.visible > 0 && visibilityReceipt.node_counts.visible < nodeCount);

      await page.click("#clear-filters");
      await assertIdentitySets();
      await selectFilter("#filter-mode", "hide");
      visibilityReceipt = await selectFilter("#filter-relation", "candidate-aligns-to");
      assert.equal(visibilityReceipt.edge_counts.visible, 7);
      assert.equal(visibilityReceipt.edge_counts.hidden, edgeCount - 7);

      const profileAudits = {};
      for (const profileId of ["architecture.python-strict", "architecture.rust-strict"]) {
        await page.click("#clear-filters");
        await assertIdentitySets();
        visibilityReceipt = await selectFilter("#filter-profile", profileId);
        const activatedTypeScriptEvidence = await page.locator('[data-fixture-profile-id="architecture.typescript-strict"][data-profile-match="match"], [data-evaluation-profile-id="architecture.typescript-strict"][data-profile-match="match"]').count();
        const visibleTypeScriptEvidence = await page.locator('[data-fixture-profile-id="architecture.typescript-strict"][data-visibility="visible"], [data-evaluation-profile-id="architecture.typescript-strict"][data-visibility="visible"]').count();
        assert.equal(activatedTypeScriptEvidence, 0);
        assert.equal(visibleTypeScriptEvidence, 0);
        assert.ok(visibilityReceipt.profile_notice?.startsWith("No supplied observation/evaluation for"));
        profileAudits[profileId] = {activated_typescript_evidence: activatedTypeScriptEvidence, visible_typescript_evidence: visibleTypeScriptEvidence, notice: visibilityReceipt.profile_notice};
      }

      await page.click("#clear-filters");
      await assertIdentitySets();
      visibilityReceipt = await selectFilter("#filter-profile", "architecture.typescript-strict");
      const activatedTypeScriptEvidence = await page.locator('[data-fixture-profile-id="architecture.typescript-strict"][data-profile-match="match"], [data-evaluation-profile-id="architecture.typescript-strict"][data-profile-match="match"]').count();
      assert.ok(activatedTypeScriptEvidence > 0);
      profileAudits["architecture.typescript-strict"] = {activated_typescript_evidence: activatedTypeScriptEvidence};

      await page.click("#clear-filters");
      await assertIdentitySets();
      const clearedReceipt = await page.evaluate(() => window.__UOC_VISIBILITY_RECEIPT__);
      assert.equal(clearedReceipt.node_counts.visible, nodeCount);
      assert.equal(clearedReceipt.edge_counts.visible, edgeCount);
      assert.equal(await page.locator('[data-node-id][data-visibility="visible"]').count(), nodeCount);
      assert.equal(await page.locator('[data-edge-id][data-visibility="visible"]').count(), edgeCount);
      visibilityEvidence = {graph_ids: graphIds, identity_replays: graphIds.length - 1, family: "pass-hide-and-dim", maturity: "pass", coverage: "pass", relation: "pass-7-candidate-aligns-to", profile_audits: profileAudits, clear: "pass-all-identities-visible"};
    }
    if (mode === "focus") {
      await page.waitForFunction(() => window.__UOC_FOCUS_RECEIPT__?.ready === true);
      const expectedNodeIds = [...nodeIds].sort();
      const expectedEdgeIds = [...edgeIds].sort();
      const assertIdentitySets = async () => {
        assert.deepEqual(await page.locator("[data-node-id]").evaluateAll((elements) => elements.map((element) => element.dataset.nodeId).sort()), expectedNodeIds);
        assert.deepEqual(await page.locator("[data-edge-id]").evaluateAll((elements) => elements.map((element) => element.dataset.edgeId).sort()), expectedEdgeIds);
        assert.equal(await page.locator("#ontology-canvas").getAttribute("data-graph-id"), receipt.graph_id);
      };
      await page.selectOption("#filter-family", "meta-type");
      await page.waitForFunction(() => window.__UOC_VISIBILITY_RECEIPT__?.filter_input?.family === "meta-type");
      await page.locator("#canvas-wrap").evaluate((element) => {
        element.scrollLeft = 120;
        element.scrollTop = 90;
      });
      const beforeFocus = await page.evaluate(() => ({
        visibility: window.__UOC_VISIBILITY_RECEIPT__,
        view_box: document.querySelector("#ontology-canvas").getAttribute("viewBox"),
        scroll_left: document.querySelector("#canvas-wrap").scrollLeft,
        scroll_top: document.querySelector("#canvas-wrap").scrollTop,
      }));
      await page.fill("#focus-search", "DS-D1.7");
      await page.click("#apply-focus");
      await page.waitForFunction(() => window.__UOC_FOCUS_RECEIPT__?.selected_node_id === "meta:DS-D1.7");
      let focusReceipt = await page.evaluate(() => window.__UOC_FOCUS_RECEIPT__);
      await assertIdentitySets();
      assert.equal(focusReceipt.graph_id, receipt.graph_id);
      assert.deepEqual(focusReceipt.name_only_links, []);
      for (const requiredNodeId of [
        "meta:DS-D1.7",
        "type:architecture.RuleImplementation",
        "constraint:typescript.rule-arrow-only",
        "property:callable.form",
        "fact:implementation.payment.LegacyLimitRule",
        "finding:typescript.rule-arrow-only:implementation.payment.LegacyLimitRule:callable.form",
      ]) assert.ok(focusReceipt.node_ids.includes(requiredNodeId), `Rule trace missing node ${requiredNodeId}`);
      for (const requiredKind of ["candidate-aligns-to", "applies-to", "constrains", "instance-of", "explains", "checks"]) assert.ok(focusReceipt.relation_kinds.includes(requiredKind), `Rule trace missing relation ${requiredKind}`);
      for (const edgeId of focusReceipt.edge_ids) assert.ok(expectedEdgeIds.includes(edgeId), `focused edge is not an exact graph edge: ${edgeId}`);
      assert.equal(await page.locator("[data-node-id].is-focus-emphasized").count(), focusReceipt.node_ids.length);
      assert.equal(await page.locator("[data-edge-id].is-focus-emphasized").count(), focusReceipt.edge_ids.length);
      assert.equal(await page.locator("[data-node-id].is-focus-dimmed").count(), nodeCount - focusReceipt.node_ids.length);
      const ruleTrace = {node_ids: focusReceipt.node_ids, edge_ids: focusReceipt.edge_ids, relation_kinds: focusReceipt.relation_kinds};

      await page.fill("#focus-search", "meta:DS-D1.8");
      await page.click("#apply-focus");
      await page.waitForFunction(() => window.__UOC_FOCUS_RECEIPT__?.selected_node_id === "meta:DS-D1.8");
      focusReceipt = await page.evaluate(() => window.__UOC_FOCUS_RECEIPT__);
      await assertIdentitySets();
      assert.equal(focusReceipt.missing_hops.length, 1);
      assert.equal(focusReceipt.missing_hops[0].id, "gap:meta:DS-D1.8:architecture-alignment");
      assert.equal(await page.locator('[data-gap-id="gap:meta:DS-D1.8:architecture-alignment"]').count(), 1);
      assert.ok((await page.locator('[data-gap-id="gap:meta:DS-D1.8:architecture-alignment"]').textContent()).includes("implementation-conformance profile owner"));
      assert.deepEqual(focusReceipt.name_only_links, []);
      const missingHop = focusReceipt.missing_hops[0];

      await page.click("#clear-focus");
      await page.waitForFunction(() => window.__UOC_FOCUS_RECEIPT__?.restored === true);
      const restored = await page.evaluate(() => ({focus: window.__UOC_FOCUS_RECEIPT__, visibility: window.__UOC_VISIBILITY_RECEIPT__}));
      assert.deepEqual(restored.visibility.filter_input, beforeFocus.visibility.filter_input);
      assert.equal(restored.focus.view_box, beforeFocus.view_box);
      assert.equal(restored.focus.scroll_left, beforeFocus.scroll_left);
      assert.equal(restored.focus.scroll_top, beforeFocus.scroll_top);
      assert.equal(await page.locator("[data-focus-state]").count(), 0);
      assert.equal(await page.locator(".is-focus-emphasized, .is-focus-dimmed").count(), 0);

      await page.click("#clear-filters");
      await page.locator('[data-node-id="meta:DS-D1.7"]').click();
      await page.waitForFunction(() => window.__UOC_FOCUS_RECEIPT__?.selected_node_id === "meta:DS-D1.7");
      assert.equal((await page.evaluate(() => window.__UOC_FOCUS_RECEIPT__)).selected_node_id, "meta:DS-D1.7");
      await page.click("#clear-focus");
      await assertIdentitySets();
      focusEvidence = {graph_id: receipt.graph_id, rule_trace: ruleTrace, missing_hop: missingHop, restoration: "pass-filter-viewbox-scroll", entry_mechanisms: "pass-search-and-node-activation", identity_sets: "pass-129-nodes-209-edges", name_only_links: 0};
    }
    if (mode === "inspect") {
      const findingId = "finding:typescript.rule-arrow-only:implementation.payment.LegacyLimitRule:callable.form";
      const factId = "fact:implementation.payment.LegacyLimitRule";
      const edgeId = "edge:candidate-aligns-to:meta:DS-D1.7->type:architecture.RuleImplementation";
      const finding = page.locator(`[data-node-id="${findingId}"]`);
      await finding.dblclick();
      await page.waitForFunction((expectedId) => window.__UOC_INSPECT_RECEIPT__?.dialog_open === true && window.__UOC_INSPECT_RECEIPT__?.inspected_id === expectedId, findingId);
      let inspectReceipt = await page.evaluate(() => window.__UOC_INSPECT_RECEIPT__);
      assert.equal(inspectReceipt.activation, "pointer");
      assert.equal(inspectReceipt.contract.kind, "node");
      assert.equal(inspectReceipt.contract.id, findingId);
      assert.equal(inspectReceipt.contract.evaluation_profile_id, "architecture.typescript-strict");
      assert.equal(inspectReceipt.contract.constraint_origin_profile_id, "architecture.typescript-strict");
      assert.equal(inspectReceipt.contract.fixture_profile_id, null);
      assert.equal(inspectReceipt.contract.raw.constraint_id, "typescript.rule-arrow-only");
      assert.equal(inspectReceipt.contract.raw.actual, "function-declaration");
      assert.ok(inspectReceipt.contract.source_ref.includes("typescript-evaluation.expected.json"));
      assert.ok(inspectReceipt.contract.incident_relationships.some((relation) => relation.kind === "checks"));
      assert.ok(inspectReceipt.contract.incident_relationships.some((relation) => relation.kind === "explains"));
      assert.equal(await page.locator("#details-dialog").getAttribute("data-inspector-id"), findingId);
      assert.equal(await page.locator("#details-evaluation-profile").textContent(), "architecture.typescript-strict");
      assert.equal(await page.locator("#details-constraint-origin").textContent(), "architecture.typescript-strict");
      assert.equal(await page.locator("#details-fixture-profile").textContent(), "not supplied");
      assert.equal(await page.locator("#close-details").evaluate((element) => element === document.activeElement), true);
      const pointerContract = inspectReceipt.contract;
      await page.click("#close-details");
      await page.waitForFunction((expectedId) => window.__UOC_INSPECT_RECEIPT__?.dialog_open === false && window.__UOC_INSPECT_RECEIPT__?.restored_focus_id === expectedId, findingId);
      assert.equal(await finding.evaluate((element) => element === document.activeElement), true);

      await page.evaluate((expectedId) => window.__UOC_INSPECT_API__.open(expectedId), findingId);
      await page.waitForFunction(() => window.__UOC_INSPECT_RECEIPT__?.activation === "programmatic" && window.__UOC_INSPECT_RECEIPT__?.dialog_open === true);
      inspectReceipt = await page.evaluate(() => window.__UOC_INSPECT_RECEIPT__);
      assert.deepEqual(inspectReceipt.contract, pointerContract);
      await page.click("#close-details");
      await page.waitForFunction(() => window.__UOC_INSPECT_RECEIPT__?.dialog_open === false);

      await page.evaluate((expectedId) => window.__UOC_INSPECT_API__.open(expectedId), factId);
      await page.waitForFunction((expectedId) => window.__UOC_INSPECT_RECEIPT__?.inspected_id === expectedId, factId);
      inspectReceipt = await page.evaluate(() => window.__UOC_INSPECT_RECEIPT__);
      assert.equal(inspectReceipt.contract.fixture_profile_id, "architecture.typescript-strict");
      assert.equal(inspectReceipt.contract.evaluation_profile_id, null);
      assert.equal(inspectReceipt.contract.raw.element_id, "implementation.payment.LegacyLimitRule");
      await page.click("#close-details");

      await page.evaluate((expectedId) => window.__UOC_INSPECT_API__.open(expectedId), edgeId);
      await page.waitForFunction((expectedId) => window.__UOC_INSPECT_RECEIPT__?.inspected_id === expectedId, edgeId);
      inspectReceipt = await page.evaluate(() => window.__UOC_INSPECT_RECEIPT__);
      assert.equal(inspectReceipt.contract.kind, "edge");
      assert.deepEqual(inspectReceipt.contract.direction, {from: "meta:DS-D1.7", relation: "candidate-aligns-to", to: "type:architecture.RuleImplementation"});
      assert.equal(inspectReceipt.contract.statuses.source_kind, "presentation-bridge");
      assert.ok(inspectReceipt.contract.source_ref.includes("domain-meta-types.projection.json"));
      assert.equal(await page.locator(`#details-dialog [data-relation-id="${edgeId}"]`).count(), 1);
      const dialogCopy = (await page.locator("#details-dialog").innerText()).toLocaleLowerCase();
      assert.ok(dialogCopy.includes("authority_effect none"));
      assert.ok(dialogCopy.includes("no adapter ran"));
      assert.equal(dialogCopy.includes("adapter-executed"), false);
      assert.equal(dialogCopy.includes("authority granted"), false);
      await page.click("#close-details");
      await page.waitForFunction((expectedId) => window.__UOC_INSPECT_RECEIPT__?.restored_focus_id === expectedId, edgeId);
      assert.equal(await page.locator(`[data-edge-id="${edgeId}"]`).evaluate((element) => element === document.activeElement), true);
      inspectEvidence = {graph_id: receipt.graph_id, pointer_programmatic_parity: "pass", node_id: findingId, fact_profile: "architecture.typescript-strict", edge_id: edgeId, edge_direction: inspectReceipt.contract.direction, focus_restoration: "pass-node-and-edge", overclaim_audit: "pass"};
    }
    if (mode === "viewport") {
      await page.waitForFunction(() => window.__UOC_VIEWPORT_RECEIPT__?.ready === true);
      const initial = await page.evaluate(() => window.__UOC_VIEWPORT_RECEIPT__);
      assert.equal(initial.graph_id, receipt.graph_id);
      assert.equal(initial.finite, true);
      assert.equal(initial.bounded, true);
      assert.deepEqual(initial.transform, {x: 0, y: 0, width: initial.limits.width, height: initial.limits.height, scale: 1});

      await page.fill("#focus-search", "DS-D1.7");
      await page.click("#apply-focus");
      await page.waitForFunction(() => window.__UOC_FOCUS_RECEIPT__?.selected_node_id === "meta:DS-D1.7");
      await page.click("#fit-all");
      const fitAll = await page.evaluate(() => window.__UOC_VIEWPORT_RECEIPT__);
      await page.click("#fit-selection");
      const fitSelection = await page.evaluate(() => window.__UOC_VIEWPORT_RECEIPT__);
      assert.equal(fitAll.reason, "fit-all");
      assert.equal(fitSelection.reason, "fit-selection");
      assert.notDeepEqual(fitSelection.transform, fitAll.transform);
      assert.ok(fitSelection.transform.scale > fitAll.transform.scale);
      assert.equal(fitSelection.selected_node_id, "meta:DS-D1.7");
      assert.equal((await page.evaluate(() => window.__UOC_FOCUS_RECEIPT__)).selected_node_id, "meta:DS-D1.7");

      await page.click("#zoom-in");
      await page.click("#pan-right");
      let transformed = await page.evaluate(() => window.__UOC_VIEWPORT_RECEIPT__);
      assert.equal(transformed.finite, true);
      assert.equal(transformed.bounded, true);
      assert.equal(transformed.selected_node_id, "meta:DS-D1.7");
      for (let index = 0; index < 24; index += 1) await page.click("#zoom-in");
      for (let index = 0; index < 24; index += 1) await page.click("#pan-right");
      transformed = await page.evaluate(() => window.__UOC_VIEWPORT_RECEIPT__);
      assert.equal(transformed.transform.scale, transformed.limits.max_scale);
      assert.equal(transformed.finite, true);
      assert.equal(transformed.bounded, true);
      assert.ok(transformed.transform.x <= transformed.limits.width - transformed.transform.width + transformed.limits.margin_x);

      const outsideWheel = await page.evaluate(() => {
        const event = new WheelEvent("wheel", {deltaY: -100, bubbles: true, cancelable: true});
        document.querySelector(".topbar").dispatchEvent(event);
        return {default_prevented: event.defaultPrevented, active: window.__UOC_VIEWPORT_RECEIPT__.canvas_intent_active, scroll_y: window.scrollY};
      });
      assert.equal(outsideWheel.default_prevented, false);
      assert.equal(outsideWheel.active, false);
      await page.focus("#canvas-wrap");
      const insideWheel = await page.evaluate(() => {
        const event = new WheelEvent("wheel", {deltaY: 100, bubbles: true, cancelable: true});
        document.querySelector("#canvas-wrap").dispatchEvent(event);
        return {default_prevented: event.defaultPrevented, receipt: window.__UOC_VIEWPORT_RECEIPT__, scroll_y: window.scrollY};
      });
      assert.equal(insideWheel.default_prevented, true);
      assert.equal(insideWheel.receipt.canvas_intent_active, true);
      assert.equal(insideWheel.receipt.finite, true);
      assert.equal(insideWheel.receipt.bounded, true);
      assert.equal(insideWheel.scroll_y, outsideWheel.scroll_y);
      await page.locator("#open-explore").focus();
      await page.waitForFunction(() => window.__UOC_VIEWPORT_RECEIPT__?.canvas_intent_active === false);

      await page.click("#reset-viewport");
      const resetOne = await page.evaluate(() => window.__UOC_VIEWPORT_RECEIPT__);
      await page.click("#reset-viewport");
      const resetTwo = await page.evaluate(() => window.__UOC_VIEWPORT_RECEIPT__);
      assert.deepEqual(resetTwo.transform, resetOne.transform);
      assert.deepEqual(resetTwo.transform, fitAll.transform);
      assert.equal(resetTwo.selected_node_id, "meta:DS-D1.7");
      assert.equal(resetTwo.finite, true);
      assert.equal(resetTwo.bounded, true);
      viewportEvidence = {
        graph_id: receipt.graph_id,
        initial_transform: initial.transform,
        fit_all: fitAll.transform,
        fit_selection: fitSelection.transform,
        bounded_extreme: transformed.transform,
        reset: resetTwo.transform,
        selection_id: resetTwo.selected_node_id,
        outside_wheel_prevented: outsideWheel.default_prevented,
        active_canvas_wheel_prevented: insideWheel.default_prevented,
        page_scroll_preserved: insideWheel.scroll_y === outsideWheel.scroll_y,
      };
    }
    if (mode === "navigator") {
      await page.waitForFunction(() => window.__UOC_NAVIGATOR_RECEIPT__?.ready === true);
      const navigatorReceipt = await page.evaluate(() => window.__UOC_NAVIGATOR_RECEIPT__);
      const navigatorIds = await page.locator("[data-navigator-id]").evaluateAll((elements) => elements.map((element) => element.dataset.navigatorId).sort());
      assert.deepEqual(navigatorIds, [...nodeIds].sort());
      assert.deepEqual(navigatorReceipt.navigator_ids, [...nodeIds].sort());
      assert.equal(new Set(navigatorIds).size, nodeCount);
      assert.equal(await page.locator('[data-navigator-id][data-family][data-statuses][data-selection="unselected"]').count(), nodeCount);
      assert.equal(navigatorReceipt.relation_occurrences, edgeCount * 2);
      assert.equal(await page.locator("[data-navigator-id] [data-relation-id]").count(), edgeCount * 2);
      assert.equal(await page.locator('[data-relation-direction="incoming"]').count() > 0, true);
      assert.equal(await page.locator('[data-relation-direction="outgoing"]').count() > 0, true);
      assert.equal(await page.locator('[data-relation-id][data-relation-kind]').count(), edgeCount * 2);

      const reachability = await page.evaluate((ids) => ids.map((id) => {
        const matches = window.__UOC_NAVIGATOR_API__.search(id);
        return {id, matches: [...matches], svg_focused: document.activeElement?.closest?.("#ontology-canvas") !== null};
      }), nodeIds);
      for (const item of reachability) {
        assert.deepEqual(item.matches, [item.id], `navigator exact search did not uniquely reach ${item.id}`);
        assert.equal(item.svg_focused, false, `navigator search focused SVG for ${item.id}`);
      }
      await page.evaluate(() => window.__UOC_NAVIGATOR_API__.search(""));
      await page.click("#open-explore");
      const ruleRow = page.locator('[data-navigator-id="meta:DS-D1.7"]');
      assert.equal(await ruleRow.getAttribute("data-family"), "meta-type");
      assert.ok((await ruleRow.getAttribute("data-statuses")).includes("maturity"));
      assert.ok((await ruleRow.innerText()).includes("outgoing: meta:DS-D1.7 —candidate-aligns-to→ type:architecture.RuleImplementation"));
      const factRow = page.locator('[data-navigator-id="fact:implementation.payment.LegacyLimitRule"]');
      const factCopy = await factRow.innerText();
      assert.ok(factCopy.includes("incoming:"));
      assert.ok(factCopy.includes("outgoing:"));
      await ruleRow.locator('[data-navigator-select-id="meta:DS-D1.7"]').click();
      await page.waitForFunction(() => window.__UOC_NAVIGATOR_RECEIPT__?.selected_node_id === "meta:DS-D1.7");
      assert.equal(await ruleRow.getAttribute("aria-selected"), "true");
      assert.equal(await ruleRow.getAttribute("data-selection"), "selected");
      assert.equal((await page.evaluate(() => window.__UOC_FOCUS_RECEIPT__)).selected_node_id, "meta:DS-D1.7");
      assert.equal(await page.locator('[data-navigator-select-id="meta:DS-D1.7"]').evaluate((element) => element === document.activeElement), true);
      assert.equal(await page.locator("#ontology-canvas :focus").count(), 0);
      navigatorEvidence = {graph_id: receipt.graph_id, graph_node_ids: nodeIds.length, navigator_ids: navigatorIds.length, exact_search_reachability: reachability.length, relation_occurrences: navigatorReceipt.relation_occurrences, representative_rule_relation: "pass", representative_fact_directions: "pass-incoming-outgoing", selection: "pass-without-svg-focus"};
    }
    if (mode === "canvas-keyboard") {
      await page.waitForFunction(() => window.__UOC_KEYBOARD_RECEIPT__?.ready === true);
      assert.equal(await page.locator('#ontology-canvas [tabindex="0"]').count(), 1);
      assert.equal(await page.locator('#ontology-canvas [data-node-id][tabindex="0"]').count(), 1);
      assert.equal(await page.locator('#ontology-canvas [data-edge-id][tabindex="0"]').count(), 0);
      assert.equal(await page.locator('[role="application"]').count(), 0);
      const helpCopy = await page.locator("#canvas-keyboard-help").innerText();
      assert.ok(helpCopy.includes("Alt+Right") && helpCopy.includes("outgoing"));
      assert.ok(helpCopy.includes("Alt+Left") && helpCopy.includes("incoming"));
      assert.ok(helpCopy.includes("distance, then ID"));

      const startId = "meta:DS-D1.7";
      await page.evaluate((id) => window.__UOC_KEYBOARD_API__.set(id, true), startId);
      const expectedSpatial = await page.evaluate((id) => window.__UOC_KEYBOARD_API__.spatialNeighbor(id, "ArrowRight"), startId);
      assert.ok(expectedSpatial);
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction((id) => window.__UOC_KEYBOARD_RECEIPT__?.current_node_id === id, expectedSpatial);
      let keyboardReceipt = await page.evaluate(() => window.__UOC_KEYBOARD_RECEIPT__);
      assert.equal(keyboardReceipt.move.kind, "spatial");
      assert.equal(keyboardReceipt.move.tie_break, "squared-distance-then-node-id");
      assert.equal(keyboardReceipt.selected_node_id, expectedSpatial);
      assert.deepEqual(keyboardReceipt.roving_ids, [expectedSpatial]);
      assert.equal(await page.locator(`[data-node-id="${expectedSpatial}"]`).evaluate((element) => element === document.activeElement), true);
      assert.equal(await page.locator(`[data-navigator-id="${expectedSpatial}"]`).getAttribute("aria-selected"), "true");
      const visibleFocus = await page.locator(`[data-node-id="${expectedSpatial}"]`).evaluate((element) => ({current: element.classList.contains("is-keyboard-current"), stroke_width: getComputedStyle(element.querySelector(".node-card")).strokeWidth}));
      assert.equal(visibleFocus.current, true);
      assert.equal(visibleFocus.stroke_width, "5px");

      await page.evaluate((id) => window.__UOC_KEYBOARD_API__.set(id, true), startId);
      await page.keyboard.press("ArrowRight");
      assert.equal((await page.evaluate(() => window.__UOC_KEYBOARD_RECEIPT__)).current_node_id, expectedSpatial);

      await page.evaluate((id) => window.__UOC_KEYBOARD_API__.set(id, true), startId);
      const outgoing = await page.evaluate((id) => window.__UOC_KEYBOARD_API__.relationNeighbor(id, "outgoing"), startId);
      assert.ok(outgoing?.node_id && outgoing?.edge_id);
      await page.keyboard.press("Alt+ArrowRight");
      keyboardReceipt = await page.evaluate(() => window.__UOC_KEYBOARD_RECEIPT__);
      assert.equal(keyboardReceipt.current_node_id, outgoing.node_id);
      assert.deepEqual(keyboardReceipt.move.relation, outgoing);
      assert.equal(keyboardReceipt.move.relation.direction, "outgoing");

      const incomingStart = "type:architecture.RuleImplementation";
      await page.evaluate((id) => window.__UOC_KEYBOARD_API__.set(id, true), incomingStart);
      const incoming = await page.evaluate((id) => window.__UOC_KEYBOARD_API__.relationNeighbor(id, "incoming"), incomingStart);
      assert.ok(incoming?.node_id && incoming?.edge_id);
      await page.keyboard.press("Alt+ArrowLeft");
      keyboardReceipt = await page.evaluate(() => window.__UOC_KEYBOARD_RECEIPT__);
      assert.equal(keyboardReceipt.current_node_id, incoming.node_id);
      assert.deepEqual(keyboardReceipt.move.relation, incoming);
      assert.equal(keyboardReceipt.move.relation.direction, "incoming");

      const clearOrigin = keyboardReceipt.current_node_id;
      await page.keyboard.press("Escape");
      keyboardReceipt = await page.evaluate(() => window.__UOC_KEYBOARD_RECEIPT__);
      assert.equal((await page.evaluate(() => window.__UOC_FOCUS_RECEIPT__)).selected_node_id, null);
      assert.equal(keyboardReceipt.current_node_id, clearOrigin);
      assert.equal(keyboardReceipt.tab_stop_count, 1);
      assert.equal(keyboardReceipt.application_role_present, false);
      assert.equal(await page.locator(`[data-node-id="${clearOrigin}"]`).evaluate((element) => element === document.activeElement), true);
      canvasKeyboardEvidence = {graph_id: receipt.graph_id, tab_stop_count: 1, spatial: {from: startId, to: expectedSpatial, tie_break: "squared-distance-then-node-id", replay: "deterministic"}, outgoing, incoming, visible_focus: visibleFocus, selection_parity: "pass-canvas-focus-navigator", escape_clear: "pass-focus-retained", application_role_present: false};
    }
    if (mode === "popovers") {
      const hiddenState = await page.evaluate(() => ({
        explore: {inert: document.querySelector("#explore-drawer").inert, aria_hidden: document.querySelector("#explore-drawer").getAttribute("aria-hidden"), modality: document.querySelector("#explore-drawer").dataset.modality},
        scene: {inert: document.querySelector("#scene-drawer").inert, aria_hidden: document.querySelector("#scene-drawer").getAttribute("aria-hidden"), modality: document.querySelector("#scene-drawer").dataset.modality},
        details: {open: document.querySelector("#details-dialog").open, inert: document.querySelector("#details-dialog").inert, modality: document.querySelector("#details-dialog").dataset.modality},
        help: {open: document.querySelector("#help-modal").open, inert: document.querySelector("#help-modal").inert, modality: document.querySelector("#help-modal").dataset.modality},
      }));
      assert.deepEqual(hiddenState.explore, {inert: true, aria_hidden: "true", modality: "nonmodal"});
      assert.deepEqual(hiddenState.scene, {inert: true, aria_hidden: "true", modality: "nonmodal"});
      assert.deepEqual(hiddenState.details, {open: false, inert: true, modality: "modal"});
      assert.deepEqual(hiddenState.help, {open: false, inert: true, modality: "modal"});

      await page.click("#open-explore");
      assert.equal(await page.locator("#explore-drawer").getAttribute("aria-hidden"), "false");
      assert.equal(await page.locator("#explore-drawer").evaluate((element) => element.inert), false);
      assert.equal(await page.locator("#navigator-search").evaluate((element) => element === document.activeElement), true);
      assert.equal(await page.locator("#explore-drawer").getAttribute("data-modality"), "nonmodal");
      assert.equal(await page.locator("#explore-drawer").evaluate((element) => element.matches(":modal")), false);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#explore-drawer").getAttribute("aria-hidden"), "true");
      assert.equal(await page.locator("#explore-drawer").evaluate((element) => element.inert), true);
      assert.equal(await page.locator("#open-explore").evaluate((element) => element === document.activeElement), true);
      const exploreTrace = await page.evaluate(() => window.__UOC_SURFACE_RECEIPT__);
      assert.equal(exploreTrace.restored_focus_id, "open-explore");

      const nodeId = "meta:DS-D1.7";
      const node = page.locator(`[data-node-id="${nodeId}"]`);
      await node.dblclick();
      assert.equal(await page.locator("#details-dialog").evaluate((element) => element.open && element.matches(":modal") && !element.inert), true);
      assert.equal(await page.locator("#close-details").evaluate((element) => element === document.activeElement), true);
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement?.closest("#details-dialog") !== null), true);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector("#details-dialog").open);
      assert.equal(await page.locator("#details-dialog").evaluate((element) => element.inert), true);
      assert.equal(await node.evaluate((element) => element === document.activeElement), true);
      const detailsTrace = await page.evaluate(() => window.__UOC_SURFACE_RECEIPT__);
      assert.equal(detailsTrace.restored_focus_id, nodeId);

      await page.click("#open-help");
      assert.equal(await page.locator("#help-modal").evaluate((element) => element.open && element.matches(":modal") && !element.inert), true);
      assert.equal(await page.locator("#close-help").evaluate((element) => element === document.activeElement), true);
      await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement?.closest("#help-modal") !== null), true);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector("#help-modal").open);
      assert.equal(await page.locator("#help-modal").evaluate((element) => element.inert), true);
      assert.equal(await page.locator("#open-help").evaluate((element) => element === document.activeElement), true);
      const helpTrace = await page.evaluate(() => window.__UOC_SURFACE_RECEIPT__);
      assert.equal(helpTrace.restored_focus_id, "open-help");
      assert.equal(await page.locator("#explore-drawer[inert] #navigator-search").count(), 1);
      assert.equal(await page.locator("#scene-drawer[inert] #scene-next").count(), 1);
      assert.equal(await page.locator("#details-dialog:not([open])[inert] #close-details").count(), 1);
      assert.equal(await page.locator("#help-modal:not([open])[inert] #close-help").count(), 1);
      surfaceEvidence = {modalities: {explore: "nonmodal", scene: "nonmodal", details: "modal", help: "modal"}, hidden_inert: "pass-all-four", explore: {entry: "navigator-search", escape_restore: exploreTrace.restored_focus_id}, details: {entry: "close-details", trapped: true, escape_restore: detailsTrace.restored_focus_id}, help: {entry: "close-help", trapped: true, escape_restore: helpTrace.restored_focus_id}, hidden_controls_out_of_tab_order: "pass-inert-or-closed"};
    }
    if (mode === "scene") {
      assert.equal(await page.locator("#scene-drawer").getAttribute("aria-hidden"), "true");
      assert.equal(await page.locator("#scene-step-list button").count(), 12);
      await page.click("#open-scene");
      assert.equal(await page.locator("#scene-drawer").getAttribute("aria-hidden"), "false");
      assert.equal(await page.locator("#scene-drawer").evaluate((element) => element.inert), false);
      assert.equal(await page.locator("#close-scene").evaluate((element) => element === document.activeElement), true);
      assert.equal(await page.locator("#scene-progress").innerText(), "Step 1 of 12");
      assert.match(await page.locator("#scene-name").innerText(), /SuggestedTrackStatus/);
      assert.match(await page.locator("#scene-boundary").innerText(), /not runtime proof/);
      let sceneReceipt = await page.evaluate(() => window.__UOC_SCENE_RECEIPT__);
      assert.equal(sceneReceipt.scene_id, "body-war.suggested-track-status-and-rule");
      assert.equal(sceneReceipt.step_id, "BW-01");
      assert.deepEqual(sceneReceipt.node_ids, ["scene:body-war.source.suggested-track-status"]);
      assert.equal(sceneReceipt.authority_effect, "none");

      await page.click("#scene-next");
      sceneReceipt = await page.evaluate(() => window.__UOC_SCENE_RECEIPT__);
      assert.equal(sceneReceipt.step_id, "BW-02");
      assert.equal(sceneReceipt.artifact_status, "missing");
      assert.equal(await page.locator("#focus-gaps li").count(), 1);
      assert.match(await page.locator("#scene-step-proof").innerText(), /no round-trip claim/i);

      await page.evaluate(() => window.__UOC_SCENE_API__.goTo(5));
      sceneReceipt = await page.evaluate(() => window.__UOC_SCENE_RECEIPT__);
      assert.equal(sceneReceipt.step_id, "BW-06");
      assert.match(await page.locator("#scene-code").innerText(), /defineEnum/);
      assert.match(await page.locator("#scene-code").innerText(), /as const/);

      await page.evaluate(() => window.__UOC_SCENE_API__.goTo(8));
      sceneReceipt = await page.evaluate(() => window.__UOC_SCENE_RECEIPT__);
      assert.equal(sceneReceipt.step_id, "BW-09");
      const compositionCode = await page.locator("#scene-code").innerText();
      assert.match(compositionCode, /newSuggestionNeedsEvidence/);
      assert.match(compositionCode, /import/);
      assert.ok(sceneReceipt.node_ids.includes("scene:body-war.realization.operation-import"));

      await page.evaluate(() => window.__UOC_SCENE_API__.goTo(11));
      sceneReceipt = await page.evaluate(() => window.__UOC_SCENE_RECEIPT__);
      assert.equal(sceneReceipt.step_id, "BW-12");
      assert.match(await page.locator("#scene-step-proof").innerText(), /authority_effect none/i);
      assert.ok(sceneReceipt.node_ids.includes("scene:body-war.explanation.receipt-authority"));
      assert.equal(await page.locator('[data-node-id^="scene:body-war."]').count(), 16);
      assert.equal(await page.locator("#ontology-canvas").getAttribute("data-graph-id"), receipt.graph_id);

      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#scene-drawer").getAttribute("aria-hidden"), "true");
      assert.equal(await page.locator("#scene-drawer").evaluate((element) => element.inert), true);
      assert.equal(await page.locator("#open-scene").evaluate((element) => element === document.activeElement), true);
      const surfaceReceipt = await page.evaluate(() => window.__UOC_SURFACE_RECEIPT__);
      assert.equal(surfaceReceipt.restored_focus_id, "open-scene");
      sceneEvidence = {scene_id: sceneReceipt.scene_id, steps: 12, current_and_proposed_separated: "pass", missing_enum_definition_visible: "pass", enum_code: "pass-as-const", rule_composition: "pass-direct-import", negative_control: "pass-source-bound", authority_boundary: "pass-none", graph_identity_preserved: receipt.graph_id};
    }
    if (mode === "responsive") {
      const waitForReflow = () => page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      const withinViewport = async (selector) => {
        const locator = page.locator(selector);
        assert.equal(await locator.count(), 1, `missing critical control ${selector}`);
        await locator.scrollIntoViewIfNeeded();
        const box = await locator.boundingBox();
        const viewport = page.viewportSize();
        assert.ok(box && viewport, `missing box for ${selector}`);
        assert.ok(box.x >= -0.5 && box.x + box.width <= viewport.width + 0.5, `horizontal clipping for ${selector}: ${JSON.stringify({box, viewport})}`);
        assert.ok(box.y >= -0.5 && box.y + box.height <= viewport.height + 0.5, `vertical clipping after recovery scroll for ${selector}: ${JSON.stringify({box, viewport})}`);
        return {selector, x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height)};
      };
      const dialogWithinViewport = async (selector) => {
        const box = await page.locator(selector).boundingBox();
        const viewport = page.viewportSize();
        assert.ok(box && viewport);
        assert.ok(box.x >= -0.5 && box.y >= -0.5 && box.x + box.width <= viewport.width + 0.5 && box.y + box.height <= viewport.height + 0.5, `popup clipping: ${JSON.stringify({selector, box, viewport})}`);
        return {selector, x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height)};
      };
      const criticalSelectors = [
        "#open-explore", "#open-scene", "#open-help", "#pan-left", "#pan-up", "#pan-down",
        "#pan-right", "#zoom-out", "#zoom-in", "#fit-all", "#fit-selection",
        "#reset-viewport", "#filter-family", "#filter-maturity", "#filter-coverage",
        "#filter-profile", "#filter-relation", "#filter-mode", "#clear-filters",
        "#focus-search", "#apply-focus", "#clear-focus",
      ];
      const uniqueNodeIds = [...new Set(nodeIds)].sort();
      const targetId = uniqueNodeIds.at(-1);
      await page.click("#open-explore");
      await page.waitForTimeout(220);
      await page.fill("#navigator-search", targetId);
      const targetButton = page.locator(`[data-navigator-select-id="${targetId}"]`);
      assert.equal(await targetButton.count(), 1);
      await targetButton.click();
      assert.equal(await targetButton.evaluate((element) => element === document.activeElement), true);
      await page.setViewportSize({width: 720, height: 640});
      await waitForReflow();
      assert.equal(await targetButton.evaluate((element) => element === document.activeElement), true, "focused navigator object lost during reflow");
      assert.equal((await page.evaluate(() => window.__UOC_NAVIGATOR_RECEIPT__)).selected_node_id, targetId);
      const bandOrder = await page.locator(".band-guide strong").allTextContents();
      assert.deepEqual(bandOrder, ["Meaning", "Realization", "Expectation", "Observation", "Explanation"]);
      const focusReflowDrawerBox = await dialogWithinViewport("#explore-drawer");
      await page.fill("#navigator-search", "");
      assert.equal(await page.locator('[role="treeitem"]:visible').count(), 129);
      assert.equal((await page.evaluate(() => window.__UOC_NAVIGATOR_RECEIPT__)).navigator_ids.length, 129);
      await page.keyboard.press("Escape");

      const cases = [
        {label: "wide-desktop", width: 1440, height: 1000, zoom_percent: 100},
        {label: "desktop-200-percent-css-viewport", width: 720, height: 640, zoom_percent: 200},
        {label: "desktop-400-percent-css-viewport", width: 360, height: 640, zoom_percent: 400},
        {label: "mobile", width: 390, height: 844, zoom_percent: null},
      ];
      const matrix = [];
      for (const testCase of cases) {
        await page.setViewportSize({width: testCase.width, height: testCase.height});
        await page.evaluate(() => window.scrollTo(0, 0));
        await waitForReflow();
        const documentMetrics = await page.evaluate(() => ({client_width: document.documentElement.clientWidth, scroll_width: document.documentElement.scrollWidth, body_overflow_x: getComputedStyle(document.body).overflowX}));
        assert.ok(documentMetrics.scroll_width <= documentMetrics.client_width + 1, `document horizontal overflow in ${testCase.label}: ${JSON.stringify(documentMetrics)}`);
        const controls = [];
        for (const selector of criticalSelectors) controls.push(await withinViewport(selector));
        await page.click("#open-help");
        const helpBox = await dialogWithinViewport("#help-modal");
        await page.keyboard.press("Escape");
        await page.click("#open-explore");
        await page.waitForTimeout(220);
        const exploreBox = await dialogWithinViewport("#explore-drawer");
        assert.equal(await page.locator('[role="treeitem"]:visible').count(), 129);
        await page.keyboard.press("Escape");
        matrix.push({...testCase, document: documentMetrics, critical_control_count: controls.length, control_boxes: controls, popup_boxes: [helpBox, exploreBox]});
      }

      await page.setViewportSize({width: 360, height: 640});
      await waitForReflow();
      await page.evaluate((id) => window.__UOC_INSPECT_API__.open(id, document.querySelector(`[data-node-id="${CSS.escape(id)}"]`), "responsive-contract"), "meta:DS-D1.7");
      const detailsBox = await dialogWithinViewport("#details-dialog");
      assert.equal(await page.locator("#close-details").evaluate((element) => element === document.activeElement), true);
      await page.keyboard.press("Escape");
      responsiveEvidence = {
        matrix,
        zoom_method: "equivalent CSS viewport widths for 100/200/400 percent browser reflow",
        reachable_node_ids: uniqueNodeIds.length,
        band_order: bandOrder,
        focus_preserved_across_reflow: targetId,
        focus_reflow_drawer_box: focusReflowDrawerBox,
        mobile_details_box: detailsBox,
        all_critical_controls_recoverably_unclipped: true,
        document_horizontal_overflow: false,
      };
    }
    assert.deepEqual(consoleErrors, [], "browser console errors");
    assert.deepEqual(pageErrors, [], "browser page errors");
    assert.deepEqual(failedResponses, [], "failed browser responses");
    assert.ok(browserRequests.every((url) => new URL(url).origin === origin), `external request observed: ${browserRequests.join(", ")}`);
    await browser.close();
    browser = null;
    await closeServer(server);
    cleanupConfirmed = !server.listening;
    assert.equal(cleanupConfirmed, true);
    return {
      verdict: "pass",
      mode,
      playwright_version: playwrightPackage.version,
      chromium_executable: executablePath,
      origin,
      graph_id: receipt.graph_id,
      layout_id: receipt.layout_id,
      verification_status: receipt.verification_status,
      selectors: {bands: bandCount, nodes: nodeCount, edges: edgeCount, emphasized_nodes: emphasizedNodes, dimmed_nodes: dimmedNodes},
      families,
      request_audit: {server_requests: requestLog.length, browser_requests: browserRequests.length, external_requests: 0, failed_responses: 0},
      error_audit: {console_errors: 0, page_errors: 0},
      source_mutated: false,
      visibility: visibilityEvidence,
      focus: focusEvidence,
      inspect: inspectEvidence,
      viewport: viewportEvidence,
      navigator: navigatorEvidence,
      canvas_keyboard: canvasKeyboardEvidence,
      surfaces: surfaceEvidence,
      scene: sceneEvidence,
      responsive: responsiveEvidence,
      server_cleanup: cleanupConfirmed,
    };
  } finally {
    if (browser) await browser.close();
    await closeServer(server);
  }
};

const mode = process.argv[process.argv.indexOf("--mode") + 1];
if (!["static", "visibility", "focus", "inspect", "viewport", "navigator", "canvas-keyboard", "popovers", "scene", "responsive"].includes(mode)) throw new Error(`Expected --mode static, visibility, focus, inspect, viewport, navigator, canvas-keyboard, popovers, scene, or responsive; received ${mode ?? "none"}.`);
const receipt = await runBrowser(mode);
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
