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
    assert.equal(receipt.graph_id, "unified-canvas:prototype");
    assert.equal(receipt.layout_id, "unified-layout:prototype");
    assert.equal(receipt.verification_status, "prototype-unverified");
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
      assert.equal(visibilityReceipt.node_counts.hidden, 92);
      assert.ok(visibilityReceipt.edge_counts.hidden > 0);

      visibilityReceipt = await selectFilter("#filter-mode", "dim");
      assert.equal(visibilityReceipt.node_counts.dimmed, 92);
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
      assert.equal(visibilityReceipt.edge_counts.visible, 5);
      assert.equal(visibilityReceipt.edge_counts.hidden, edgeCount - 5);

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
      visibilityEvidence = {graph_ids: graphIds, identity_replays: graphIds.length - 1, family: "pass-hide-and-dim", maturity: "pass", coverage: "pass", relation: "pass-5-candidate-aligns-to", profile_audits: profileAudits, clear: "pass-all-identities-visible"};
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
      focusEvidence = {graph_id: receipt.graph_id, rule_trace: ruleTrace, missing_hop: missingHop, restoration: "pass-filter-viewbox-scroll", entry_mechanisms: "pass-search-and-node-activation", identity_sets: "pass-95-nodes-147-edges", name_only_links: 0};
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
      server_cleanup: cleanupConfirmed,
    };
  } finally {
    if (browser) await browser.close();
    await closeServer(server);
  }
};

const mode = process.argv[process.argv.indexOf("--mode") + 1];
if (!["static", "visibility", "focus", "inspect", "viewport", "navigator"].includes(mode)) throw new Error(`Expected --mode static, visibility, focus, inspect, viewport, or navigator; received ${mode ?? "none"}.`);
const receipt = await runBrowser(mode);
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
