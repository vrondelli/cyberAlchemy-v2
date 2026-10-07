#!/usr/bin/env node
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.ARE_PLAYWRIGHT_ROOT || "playwright-core");
const browserPath = process.env.ARE_CHROMIUM?.trim();
const files = new Map([["/", ["dashboard.html", "text/html"]], ["/app.css", ["app.css", "text/css"]], ["/app.js", ["app.js", "text/javascript"]]]);
const server = createServer((request, response) => {
  const resource = files.get(new URL(request.url, "http://localhost").pathname);
  if (!resource) {response.writeHead(404); response.end(); return;}
  response.writeHead(200, {"content-type": resource[1]});
  response.end(readFileSync(new URL(`../ui/${resource[0]}`, import.meta.url)));
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({...(browserPath ? {executablePath: browserPath} : {}), args: ["--no-sandbox"]});
const page = await browser.newPage({viewport: {width: 1200, height: 850}});
const errors = [], checks = [];
page.on("pageerror", error => errors.push(error.message));
const check = (name, value) => {assert.ok(value, name); checks.push(name);};
const threadRef = `backend-thread:${"a".repeat(64)}`;
const consumerRef = `gateway-consumer:${"b".repeat(64)}`;
await page.addInitScript(({threadRef, consumerRef}) => {
  const fixture = {mode: "normal", faults: {}, calls: {}};
  globalThis.__ARE_FIXTURE__ = fixture;
  const decision = (consumer, sequence) => ({threadRef, consumerRef: consumer, decisionType: "turn-preflight",
    outcome: "direct", reasonCodes: ["selection.unique-capability"], eventObservedAtUnixMs: Date.now(),
    decisionDigest: "c".repeat(64), evidenceEventDigest: "d".repeat(64), eventSequence: sequence});
  globalThis.__TAURI__ = {core: {invoke: async (name, args = {}) => {
    fixture.calls[name] = (fixture.calls[name] ?? 0) + 1;
    if (fixture.faults[name]) throw new Error(`${name}.unavailable`);
    if (name === "get_preferences") return {skin: "verdant", orbPlacement: "center"};
    if (name === "get_snapshot") return {schemaVersion: "are.companion-health/v1", status: "PASS", observedAtUnixMs: Date.now(),
      productStatus: "candidate", selectedComponentCount: 1, nodeVersionMatch: true, productVersion: "fixture", productId: "are", componentCount: 1,
      integrationCount: 1, closureDigest: "e".repeat(64), reasonCodes: []};
    if (name === "get_adapter_snapshot") return {schemaVersion: "are.companion-adapter-observation/v1",
      authorityEffect: "none", runtimeEpochId: fixture.mode === "adapter-epoch-b" ? "epoch-b" : "epoch-a",
      hostTaskControlStatus: "unverified", sessionFaultStatus: "not-observed",
      sessionQuarantineStatus: fixture.mode === "audit-quarantine" ? "observed" : "not-observed",
      observedAtUnixMs: Date.now(),
      selectedBackendAdapterId: ["relay-required", "compaction-observed", "compaction-recovered", "guard-live", "guard-lost"].includes(fixture.mode)
        ? "codex-app-server/v1" : "deepseek-harness-headless/v1",
      hostMethodPolicy: ["relay-required", "compaction-observed", "compaction-recovered", "guard-live", "guard-lost"].includes(fixture.mode)
        ? {status: "pinned-catalog", codexVersion: "codex-cli 0.155.0-alpha.16.4",
          knownRequestCount: 164, admittedRequestCount: 19}
        : {status: "not-applicable", codexVersion: null, knownRequestCount: null, admittedRequestCount: null},
      mcpHookRelayPreflightStatus: fixture.mode === "relay-required" ? "required" : "not-required",
      clientLinkStatus: "connected", gatewayStatus: "running",
      backendStatus: "ready", selectedPathStatus: fixture.mode === "split-adapter-path" ? "not-observed" : "ready",
      ...(fixture.mode === "legacy-counts" ? {} : {sessionPaths: fixture.mode === "split-adapter-path"
        ? {status: "observed", total: 2, ready: 0, initializing: 0,
          backendUnavailable: 1, detachedBackend: 1, inactive: 0}
        : {status: "observed", total: fixture.mode === "invalid-counts" ? 4 : 3,
          ready: 1, initializing: 1, backendUnavailable: 0, detachedBackend: 1, inactive: 0}}),
      backendCapabilities: {turnStart: "supported", turnInterrupt: "supported",
        turnSteer: "unsupported", threadResume: "supported",
        threadCompact: ["compaction-observed", "compaction-recovered"].includes(fixture.mode) ? "supported" : "unsupported",
        effectRequests: "unsupported", historyPersistence: "ephemeral"},
      ...(["guard-live", "guard-lost"].includes(fixture.mode) ? {
        managedTurnIngressStatus: "not-paused", managedTurnIngressSource: "gateway-in-process",
        managedTurnIngressReasonCode: null, managedModelEntryBoundary: "guarded-text-only-candidate",
        managedModelWireGuardStatus: fixture.mode === "guard-live" ? "parent-heartbeat-observed" : "not-observed",
        hostedEffectToolStatus: "disabled",
      } : {}),
      ...(["compaction-observed", "compaction-recovered"].includes(fixture.mode) ? {retainedHostReceipts: {status: "observed",
        turnStartAccepted: 0, turnHistoryVerified: 0, steerAccepted: 0,
        compactionTurnAccepted: 1, compactionItemCompleted: 0,
        compactionHistoryVerified: fixture.mode === "compaction-recovered" ? 1 : 0}} : {})};
    if (name === "get_thread_snapshot") {
      if (fixture.mode === "thread-unavailable") throw new Error("thread.unavailable");
      if (fixture.mode === "thread-pages") {
        if (fixture.holdThreadRead) await new Promise(resolve => {fixture.releaseThreadRead = resolve;});
        const offset = args.offset ?? 0;
        const threads = Array.from({length: Math.min(32, 40 - offset)}, (_, index) => ({
          threadRef: `backend-thread:${(offset + index + 1).toString(16).padStart(64, "0")}`,
          consumerRef, phase: "turn-active", reasoningEpochDigest: "f".repeat(64), checkpointDigest: "1".repeat(64),
          latestFrontierDigest: null, lastCompletionStatus: null, planContextDigest: null,
          acceptedTurnStartCount: 0, verifiedHostTurnCount: 0, acceptedSteerCount: 0,
        }));
        return {schemaVersion: "are.companion-thread-observation/v1",
          scope: "gateway-backend-threads-not-host-activation", authorityEffect: "none", runtimeEpochId: "epoch-a",
          observedAtUnixMs: Date.now(), threadCount: 40, pageOffset: offset, snapshotDigest: "8".repeat(64),
          nextOffset: offset === 0 ? 32 : null, ongoingThreadCount: 40,
          omittedOngoingThreadCount: 40 - threads.length,
          degradedSteerThreadCount: 0, unknownDispatchCount: 0,
          unknownHostedEffectDispatchCount: 0, unknownThreadCreationCount: 0,
          recoveredDispatchCount: 0, truncated: true, threads};
      }
      const noThread = ["unknown-thread-creation", "unknown-hosted-effect"].includes(fixture.mode);
      return {schemaVersion: "are.companion-thread-observation/v1",
      scope: "gateway-backend-threads-not-host-activation", authorityEffect: "none", runtimeEpochId: "epoch-a",
      observedAtUnixMs: Date.now(), threadCount: noThread ? 0 : 1,
      pageOffset: 0, snapshotDigest: "8".repeat(64), nextOffset: null,
      ongoingThreadCount: noThread || fixture.mode === "thread-failed"
        || fixture.mode === "thread-future-phase" ? 0 : 1,
      omittedOngoingThreadCount: 0,
      degradedSteerThreadCount: 0,
      unknownDispatchCount: noThread || fixture.mode === "unknown-hosted-effect-thread" ? 1 : 0,
      unknownHostedEffectDispatchCount: ["unknown-hosted-effect", "unknown-hosted-effect-thread"].includes(fixture.mode) ? 1 : 0,
      unknownThreadCreationCount: fixture.mode === "unknown-thread-creation" ? 1 : 0,
      recoveredDispatchCount: 1, truncated: false,
      threads: noThread ? [] : [{threadRef, consumerRef, phase: fixture.mode === "thread-failed" ? "turn-completed"
        : fixture.mode === "thread-future-phase" ? "future-phase" : "turn-active",
        reasoningEpochDigest: "f".repeat(64), checkpointDigest: "1".repeat(64),
        latestFrontierDigest: fixture.mode === "thread-failed" ? "2".repeat(64) : null,
        lastCompletionStatus: fixture.mode === "thread-failed" ? "failed" : null,
        planContextDigest: "b".repeat(64), planContextEventSequence: 3,
        planObligationCount: 7, planCompletedCount: 2, planOpenDecisionCount: 1,
        planActiveSliceOrdinal: 3, planActiveSliceStatus: "active",
        acceptedTurnStartCount: 0, verifiedHostTurnCount: 0,
        acceptedSteerCount: 0,
        acceptedCompactionTurnCount: ["compaction-observed", "compaction-recovered"].includes(fixture.mode) ? 1 : 0,
        completedCompactionItemCount: 0,
        recoveredCompactionCount: fixture.mode === "compaction-recovered" ? 1 : 0,
        recoveredDispatchCount: 1,
        unknownHostedEffectDispatchCount: fixture.mode === "unknown-hosted-effect-thread" ? 1 : 0,
        mcpHookRelayCheck: {status: "listed", checkedAtUnixMs: Date.now() - 1000}}]};
    }
    if (name === "get_decision_snapshot") {
      const truncated = fixture.mode === "truncated";
      const decisions = truncated ? Array.from({length: 32}, (_, index) => decision(`gateway-consumer:${"e".repeat(64)}`, index + 1))
        : [decision(consumerRef, 1), decision(`gateway-consumer:${"e".repeat(64)}`, 2)];
      return {schemaVersion: "are.companion-decision-observation/v1", scope: "gateway-backend-decisions-not-durable-host-history",
        authorityEffect: "none", runtimeEpochId: fixture.mode === "decision-no-epoch" ? undefined
          : fixture.mode === "source-changed" ? "epoch-b" : "epoch-a",
        observedAtUnixMs: Date.now(), decisionCount: truncated ? 33 : 2, truncated, decisions};
    }
    if (name === "get_evolution_snapshot" && fixture.mode === "evolution-source-unavailable") return {
      schemaVersion: "are.companion-evolution-observation/v1", source: "durable-ledger-and-candidate-registry",
      authorityEffect: "none", observedAtUnixMs: Date.now(), rootStatus: "unknown", evidenceStatus: "unavailable",
      operationalIndexStatus: "not-observed",
      cycleCount: 0, commitCount: 0, cyclesTruncated: false, definitions: [], cycles: [], coordinationSummary: null,
    };
    if (name === "get_evolution_snapshot" && fixture.mode === "evolution-registry-only") return {
      schemaVersion: "are.companion-evolution-observation/v1", source: "candidate-registry-only",
      authorityEffect: "none", observedAtUnixMs: Date.now(), rootStatus: "not-configured",
      evidenceStatus: "not-observed", cycleCount: 0, commitCount: 0,
      operationalIndexStatus: "not-observed",
      cyclesTruncated: false, projectionDigest: null, cycles: [], coordinationSummary: null,
      definitions: [{definitionRef: "engine-improvement/v1", cycleKind: "engine-improvement",
        admissionStatus: "candidate", admitted: false, enabled: false}],
    };
    if (name === "get_evolution_snapshot" && fixture.mode === "evolution-multiple-definitions") return {
      schemaVersion: "are.companion-evolution-observation/v1", source: "durable-ledger-and-candidate-registry",
      authorityEffect: "none", observedAtUnixMs: Date.now(), rootStatus: "present", evidenceStatus: "verified",
      operationalIndexStatus: "rebuild-required",
      cycleCount: 2, commitCount: 0, cyclesTruncated: false, definitions: [
        {definitionRef: "engine-improvement/v1", cycleKind: "engine-improvement",
          admissionStatus: "candidate", admitted: false, enabled: false},
        {definitionRef: "future-kind/v2", cycleKind: "future-kind",
          admissionStatus: "candidate", admitted: false, enabled: false},
      ],
      coordinationSummary: {phaseCount: 0, workStateCounts: {planned: 0, ready: 0, leased: 0, completed: 0, blocked: 0}},
      cycles: [
        {cycleRef: "cycle:research-fixture", cycleDefinitionRef: "benchmark-research/v1", eventRevision: 1,
          lastEventType: "comparison-recorded", derivedDisposition: "inconclusive", eventCount: 1,
          recentEventTypes: ["comparison-recorded"], eventsTruncated: false},
        {cycleRef: "cycle:review-fixture", cycleDefinitionRef: "evidence-review/v1", eventRevision: 1,
          lastEventType: "review-recorded", derivedDisposition: "recommended", eventCount: 1,
          recentEventTypes: ["review-recorded"], eventsTruncated: false},
      ],
    };
    if (name === "get_evolution_snapshot" && ["evolution-cycle", "evolution-phases", "evolution-bad-cycle", "evolution-bad-count", "evolution-corrupt-cycle"].includes(fixture.mode)) return {
      schemaVersion: "are.companion-evolution-observation/v1", source: "durable-ledger-and-candidate-registry",
      authorityEffect: "none", observedAtUnixMs: Date.now(), rootStatus: "present",
      evidenceStatus: fixture.mode === "evolution-corrupt-cycle" ? "corrupt" : "verified",
      operationalIndexStatus: fixture.mode === "evolution-corrupt-cycle" ? "not-observed" : "healthy",
      cycleCount: fixture.mode === "evolution-bad-count" ? 0 : 1, commitCount: 1, cyclesTruncated: false, definitions: [],
      coordinationSummary: fixture.mode === "evolution-corrupt-cycle" ? null
        : fixture.mode === "evolution-phases"
          ? {phaseCount: 2, workStateCounts: {planned: 0, ready: 1, leased: 1, completed: 1, blocked: 1}}
          : {phaseCount: 0, workStateCounts: {planned: 0, ready: 0, leased: 0, completed: 0, blocked: 0}},
      ...(fixture.mode === "evolution-phases" ? {phaseSummaries: [
        {cycleRef: "cycle:verified-fixture", phase: "construction", eventCount: 2,
          workStateCounts: {planned: 0, ready: 1, leased: 0, completed: 0, blocked: 1}},
        {cycleRef: "cycle:verified-fixture", phase: "comparison", eventCount: 1,
          workStateCounts: {planned: 0, ready: 0, leased: 1, completed: 1, blocked: 0}},
      ], phaseSummariesTruncated: false} : {}),
      cycles: [{cycleRef: "cycle:verified-fixture", cycleDefinitionRef: "benchmark-research/v1",
        eventRevision: 10, lastEventType: fixture.mode === "evolution-bad-cycle" ? "mismatched-event" : "comparison-recorded", derivedDisposition: "inconclusive",
        eventCount: 10, recentEventTypes: ["diagnosis-recorded", "hypothesis-recorded", "work-proposed",
          "work-reviewed", "experiment-started", "experiment-completed", "comparison-started", "comparison-recorded"],
        eventsTruncated: true}],
    };
    if (name === "get_evolution_signal_snapshot") return {
      schemaVersion: "are.companion-evolution-signal-observation/v1", source: "gateway-candidate-inbox",
      evidenceStatus: "verified", authorityEffect: "none", observedAtUnixMs: Date.now(), candidateCount: 1,
      candidatesTruncated: false, candidates: [{kind: "semantic-evaluation-blocked", recordDigest: "f".repeat(64)}],
    };
    throw new Error("fixture.not-configured");
  }}};
}, {threadRef, consumerRef});

try {
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator("#overview-product-title").getByText("Diagnostic passed").waitFor();
  check("Overview keeps uninspected sources distinct from unconfigured sources",
    await page.locator("#overview-other-sources").evaluate(element => !element.open)
      && (await Promise.all(["thread", "decision", "evolution", "evolution-signal"]
        .map(source => page.locator(`#overview-${source}-posture`).textContent()))).every(text => text === "Not inspected"));
  await page.locator("#overview-other-sources > summary").focus();
  await page.keyboard.press("Enter");
  check("opening the source index adds no backend reads",
    await page.locator("#overview-other-sources").evaluate(element => element.open)
      && await page.evaluate(() => ["get_thread_snapshot", "get_decision_snapshot",
        "get_evolution_snapshot", "get_evolution_signal_snapshot"]
        .every(command => !globalThis.__ARE_FIXTURE__.calls[command])));
  await page.keyboard.press("Enter");
  for (const width of [900, 340]) {
    await page.setViewportSize({width, height: 740});
    const navigation = await page.evaluate(() => {
      const nav = document.querySelector(".nav-list");
      return {
        labels: [...nav.querySelectorAll(".nav-item")].map(button => ({
          text: button.innerText.trim(),
          fontSize: Number.parseFloat(getComputedStyle(button).fontSize),
          visible: button.getClientRects().length > 0,
        })),
        documentFits: document.documentElement.scrollWidth <= innerWidth + 1,
        navScrollable: nav.scrollWidth > nav.clientWidth,
      };
    });
    check(`${width}px navigation keeps all seven destination labels legible`,
      navigation.labels.length === 7 && navigation.labels.every(label =>
        label.visible && label.fontSize >= 12 && /[A-Za-z]/.test(label.text)));
    check(`${width}px navigation does not overflow the document`, navigation.documentFits);
    if (width === 340) {
      check("narrow navigation scrolls within its own strip", navigation.navScrollable);
      check("narrow navigation exposes the next-sections control",
        await page.locator("#nav-scroll-next").isVisible()
        && await page.locator("#nav-scroll-next").isEnabled()
        && await page.locator("#nav-scroll-prev").isDisabled());
      await page.locator("#nav-scroll-next").click();
      check("next-sections control reveals later destinations",
        await page.evaluate(() => document.querySelector(".nav-list").scrollLeft > 0)
        && await page.locator("#nav-scroll-prev").isEnabled());
      for (let step = 0; step < 8 && await page.locator("#nav-scroll-next").isEnabled(); step++) {
        await page.locator("#nav-scroll-next").click();
      }
      check("end of narrow navigation keeps keyboard focus on the available reverse control",
        await page.locator("#nav-scroll-next").isDisabled()
        && await page.evaluate(() => document.activeElement?.id === "nav-scroll-prev"));
      for (let step = 0; step < 8 && await page.locator("#nav-scroll-prev").isEnabled(); step++) {
        await page.locator("#nav-scroll-prev").click();
      }
      check("previous-sections control returns to the start",
        await page.evaluate(() => document.querySelector(".nav-list").scrollLeft <= 1)
        && await page.locator("#nav-scroll-prev").isDisabled()
        && await page.evaluate(() => document.activeElement?.id === "nav-scroll-next"));
      await page.locator("#overview-other-sources > summary").click();
      check("narrow expanded source index fits with visible destination links", await page.evaluate(() => {
        const links = [...document.querySelectorAll(".overview-source-list button")];
        return document.documentElement.scrollWidth <= innerWidth + 1
          && links.every(link => {
            const rect = link.getBoundingClientRect();
            return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth + 1;
          });
      }));
      await page.locator("#overview-other-sources > summary").click();
      await page.locator("#overview-other-sources > summary").click();
      await page.locator('.overview-source-list button[data-panel-link="evolution"]').first().click();
      const revealed = await page.evaluate(() => {
        const strip = document.querySelector(".nav-list");
        const active = strip.querySelector('.nav-item[data-panel="evolution"]');
        const bounds = strip.getBoundingClientRect();
        const item = active.getBoundingClientRect();
        return {active: active.getAttribute("aria-current") === "page",
          visible: item.left >= bounds.left - 1 && item.right <= bounds.right + 1,
          moved: strip.scrollLeft > 0, focused: document.activeElement?.id === "evolution-title",
          documentFits: document.documentElement.scrollWidth <= innerWidth + 1};
      });
      check("narrow cross-page link reveals its selected navigation destination",
        revealed.active && revealed.visible && revealed.moved && revealed.focused && revealed.documentFits);
      await page.locator('.nav-item[data-panel="overview"]').click();
      await page.locator("#overview-other-sources > summary").click();
    }
  }
  await page.setViewportSize({width: 1200, height: 740});
  await page.locator('.nav-item[data-panel="evolution"]').click();
  await page.setViewportSize({width: 340, height: 740});
  await page.waitForFunction(() => {
    const strip = document.querySelector(".nav-list");
    const item = strip.querySelector('.nav-item[data-panel="evolution"]').getBoundingClientRect();
    const bounds = strip.getBoundingClientRect();
    return item.left >= bounds.left - 1 && item.right <= bounds.right + 1;
  });
  const resizedNavigation = await page.evaluate(() => {
    const strip = document.querySelector(".nav-list");
    const active = strip.querySelector('.nav-item[data-panel="evolution"]');
    const bounds = strip.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    return {active: active.getAttribute("aria-current"), left: item.left, right: item.right,
      stripLeft: bounds.left, stripRight: bounds.right, scrollLeft: strip.scrollLeft,
      documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth};
  });
  check(`resizing with a later section active keeps its navigation label in view ${JSON.stringify(resizedNavigation)}`,
    resizedNavigation.active === "page" && resizedNavigation.left >= resizedNavigation.stripLeft - 1
      && resizedNavigation.right <= resizedNavigation.stripRight + 1 && resizedNavigation.scrollLeft > 0
      && resizedNavigation.documentWidth <= resizedNavigation.viewportWidth + 1);
  await page.locator('.nav-item[data-panel="evolution"]').focus();
  await page.keyboard.press("Enter");
  check("narrow keyboard navigation opens the selected panel", await page.locator("#panel-evolution").isVisible());
  await page.setViewportSize({width: 1200, height: 850});
  await page.locator('.nav-item[data-panel="evolution"]').click();
  const headingFocus = await page.evaluate(() => {
    const heading = document.getElementById("evolution-title");
    const panel = document.getElementById("panel-evolution");
    const style = getComputedStyle(heading);
    return {focused: document.activeElement === heading,
      headingWidth: heading.getBoundingClientRect().width,
      panelWidth: panel.getBoundingClientRect().width,
      outlineStyle: style.outlineStyle, outlineWidth: Number.parseFloat(style.outlineWidth)};
  });
  check(`panel navigation keeps visible focus on its named heading ${JSON.stringify(headingFocus)}`, headingFocus.focused
    && headingFocus.outlineStyle !== "none" && headingFocus.outlineWidth >= 2);
  check("focused heading marker follows the heading instead of spanning the panel",
    headingFocus.headingWidth < headingFocus.panelWidth * 0.8);
  await page.locator('.nav-item[data-panel="adapters"]').click();
  await page.locator("#adapter-observation-status").getByText("Observed").waitFor();
  check("selected adapter is visible", await page.locator("#adapter-id").innerText() === "deepseek-harness-headless/v1");
  check("first adapter view keeps protocol detail collapsed without hiding task control",
    !(await page.locator("#adapter-protocol-details").evaluate(element => element.open))
      && !(await page.locator("#adapter-host-checks").evaluate(element => element.open))
      && (await Promise.all(["adapter-selected-path-state", "adapter-managed-turn-ingress-state",
        "adapter-hosted-effect-tool-state", "adapter-windows-backend-sandbox-state",
        "adapter-host-control-state", "adapter-session-fault-state",
        "adapter-session-quarantine-state"].map(id => page.locator(`#${id}`).isVisible()))).every(Boolean)
      && !(await page.locator("#adapter-receipt-compaction-turn").isVisible()));
  await page.locator("#adapter-protocol-details > summary").focus();
  await page.keyboard.press("Enter");
  check("keyboard opens bounded protocol evidence",
    await page.locator("#adapter-protocol-details").evaluate(element => element.open)
      && await page.locator("#adapter-receipt-compaction-turn").isVisible());
  check("non-Codex backend has no pinned Codex method scope",
    await page.locator("#adapter-host-method-policy").innerText() === "Not applicable to this backend");
  await page.locator("#adapter-host-checks > summary").focus();
  await page.keyboard.press("Enter");
  check("keyboard opens additional host checks",
    await page.locator("#adapter-host-checks").evaluate(element => element.open)
      && await page.locator("#adapter-mcp-relay-preflight-state").isVisible());
  for (const [id, posture] of [["adapter-turn-start", "supported"], ["adapter-interrupt", "supported"],
    ["adapter-steering", "unsupported"], ["adapter-resume", "supported"],
    ["adapter-compaction", "unsupported"], ["adapter-effects", "unsupported"],
    ["adapter-history", "ephemeral"]]) {
    check(`${id} shows its declared posture`, (await page.locator(`#${id}`).textContent())?.trim() === posture);
  }
  check("adapter readiness does not imply desktop-task control", await page.locator("#adapter-host-control-state").innerText() === "unverified");
  check("same-session path is distinguished from aggregate links",
    await page.locator("#adapter-selected-path-state").innerText() === "ready"
      && await page.locator("#overview-adapter-title").innerText() === "Backend path ready");
  check("visible gateway session counts preserve the unready categories",
    await page.locator("#adapter-session-paths").innerText()
      === "1 of 3 ready · 1 initializing · 1 detached backend");
  check("sidebar ready cue requires a same-session adapter path", await page.evaluate(() => {
    const footer = document.getElementById("sidebar-adapter");
    return footer.dataset.adapterPosture === "ready"
      && document.getElementById("sidebar-adapter-label").textContent === "Adapter path ready"
      && getComputedStyle(footer.querySelector(".fine-dot")).boxShadow !== "none";
  }));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "compaction-observed";});
  await page.locator("#refresh").click();
  await page.locator("#adapter-receipt-compaction-turn").getByText("1").waitFor();
  check("accepted compaction is separate from completed item in Adapters",
    await page.locator("#adapter-receipt-compaction").innerText() === "0"
      && await page.locator("#adapter-host-control-state").innerText() === "unverified");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "compaction-recovered";});
  await page.locator("#refresh").click();
  await page.locator("#adapter-receipt-compaction-history").getByText("1").waitFor();
  check("Adapters distinguishes recovered history from a native item",
    await page.locator("#adapter-receipt-compaction").innerText() === "0"
      && await page.locator("#adapter-host-control-state").innerText() === "unverified");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "relay-required";});
  await page.locator("#refresh").click();
  await page.locator("#adapter-mcp-relay-preflight-state").getByText("required").waitFor();
  check("pinned Codex allowlist count does not claim desktop compatibility",
    await page.locator("#adapter-host-method-policy").innerText() === "19 of 164 known requests admitted"
      && (await page.locator("#adapter-host-method-policy-detail").innerText()).includes("not desktop compatibility"));
  check("relay preflight is shown as a gateway requirement, not complete tool coverage",
    (await page.locator("#adapter-mcp-relay-preflight-detail").innerText()).includes("not proof that every hook"));
  check("decision MCP connection remains distinct from the gateway hook relay",
    await page.locator("#adapter-decision-mcp-boundary").isVisible()
      && (await page.locator("#adapter-decision-mcp-boundary").innerText()).includes("not observed by Companion")
      && (await page.locator("#adapter-decision-mcp-boundary").innerText()).includes("separate gateway hook check"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "normal";});
  await page.locator("#refresh").click();
  await page.locator("#adapter-mcp-relay-preflight-state").getByText("not-required").waitFor();
  check("Overview names independently observed product and backend path",
    (await page.locator("#overview-summary").innerText()).includes("Product diagnostic passed at")
      && (await page.locator("#overview-summary").innerText()).includes("one backend path ready at"));
  await page.locator('[data-panel="overview"]').click();
  const overviewAdapterDetail = page.locator("#overview-adapter-detail");
  const overviewTechnical = page.locator("#overview-adapter-technical");
  check("Overview keeps the task boundary visible while technical path details are collapsed",
    (await overviewAdapterDetail.innerText()).includes("This chat is not established as ARE-managed")
      && (await overviewAdapterDetail.innerText()).length < 160
      && !(await overviewTechnical.isVisible()));
  await page.locator(".overview-adapter-details > summary").focus();
  await page.keyboard.press("Enter");
  const expandedAdapter = {visible: await overviewTechnical.isVisible(),
    technical: await overviewTechnical.innerText(), summary: await overviewAdapterDetail.innerText()};
  check(`keyboard reveals the exact adapter diagnostics without changing the summary ${JSON.stringify(expandedAdapter)}`,
    expandedAdapter.visible && expandedAdapter.technical.includes("Desktop task control: unverified")
      && expandedAdapter.summary.includes("This chat is not established as ARE-managed"));
  await page.keyboard.press("Enter");
  await page.locator('[data-panel="adapters"]').click();
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "guard-live";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("overview-adapter-title")?.textContent === "Guarded text-only candidate");
  check("fresh guard heartbeat remains a candidate rather than a ready host claim",
    (await page.locator("#overview-summary").innerText()).includes("guarded text-only candidate observed")
      && (await page.locator("#overview-adapter-technical").textContent()).includes("guard heartbeat parent-heartbeat-observed")
      && await page.locator("#adapter-host-control-state").innerText() === "unverified");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "guard-lost";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("overview-adapter-title")?.textContent === "Backend connected; guard unverified");
  check("missing guard heartbeat withdraws the first-screen guarded claim",
    (await page.locator("#overview-summary").innerText()).includes("managed guard unverified")
      && !(await page.locator("#overview-summary").innerText()).includes("one backend path ready")
      && (await page.locator("#overview-adapter-technical").textContent()).includes("guard heartbeat not-observed"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "normal";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("overview-adapter-title")?.textContent === "Backend path ready");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "split-adapter-path";});
  await page.locator("#refresh").click();
  await page.locator("#adapter-selected-path-state").getByText("not-observed").waitFor();
  await page.waitForFunction(() => document.getElementById("overview-adapter-title")?.textContent === "Path observed");
  const splitState = await page.evaluate(() => ({
    client: document.getElementById("adapter-client-state").textContent,
    backend: document.getElementById("adapter-backend-state").textContent,
    overview: document.getElementById("overview-adapter-title").textContent,
  }));
  check("split-session aggregates do not make a ready path",
    splitState.client === "connected" && splitState.backend === "ready" && splitState.overview === "Path observed");
  check("split-session counts explain why aggregate links are not a ready path",
    await page.locator("#adapter-session-paths").innerText()
      === "0 of 2 ready · 1 without backend · 1 detached backend");
  check("sidebar withdraws ready cue for split-session aggregates", await page.evaluate(() => {
    const footer = document.getElementById("sidebar-adapter");
    return footer.dataset.adapterPosture === "observed"
      && document.getElementById("sidebar-adapter-label").textContent === "Adapter observed"
      && getComputedStyle(footer.querySelector(".fine-dot")).boxShadow === "none";
  }));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "legacy-counts";});
  await page.locator("#refresh").click();
  check("legacy gateway omitting counts stays unknown",
    await page.locator("#adapter-session-paths").innerText() === "Not reported by this gateway version");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "invalid-counts";});
  await page.locator("#refresh").click();
  await page.locator("#adapter-observation-status").getByText("Incompatible").waitFor();
  check("contradictory path counts remove live adapter styling", !(await page.locator("#adapter-live").isVisible()));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "audit-quarantine";});
  await page.locator("#refresh").click();
  await page.locator("#adapter-session-quarantine-state").getByText("observed").waitFor();
  check("aggregate quarantine prevents an unqualified ready summary",
    await page.locator("#overview-adapter-title").innerText() === "Gateway stop observed"
      && (await page.locator("#overview-summary").innerText()).includes("gateway fault observed at"));
  check("sidebar shows a stopped gateway without a ready cue", await page.evaluate(() => {
    const footer = document.getElementById("sidebar-adapter");
    return footer.dataset.adapterPosture === "stopped"
      && document.getElementById("sidebar-adapter-label").textContent === "Gateway stop observed"
      && getComputedStyle(footer.querySelector(".fine-dot")).boxShadow === "none";
  }));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "normal";});
  await page.locator("#refresh").click();
  await page.locator("#adapter-session-quarantine-state").getByText("not-observed").waitFor();
  await page.setViewportSize({width: 340, height: 740});
  check("narrow adapter grid stays inside the viewport", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.setViewportSize({width: 1200, height: 850});
  await page.locator('.nav-item[data-panel="threads"]').click();
  await page.locator("#thread-list .thread-card").waitFor();
  check("backend-thread card has a named, navigable heading",
    await page.getByRole("article", {name: "Backend thread aaaaaaaa"}).getByRole("heading", {name: "Backend thread aaaaaaaa", level: 2}).count() === 1);
  check("Threads visibly separates gateway reasoning from hosted Rejoin",
    await page.locator("#thread-rejoin-scope").isVisible()
      && (await page.locator("#thread-rejoin-scope").innerText()).includes("Gateway Reasoning State shows backend threads, not control of this chat")
      && !await page.locator("#thread-scope-details").evaluate(element => element.open));
  const firstThreadView = await page.evaluate(() => ({
    cardTop: document.querySelector("#thread-list .thread-card")?.getBoundingClientRect().top,
    viewportHeight: innerHeight,
    detailsOpen: document.querySelector("#thread-recovery-details")?.open,
    summary: document.querySelector("#thread-recovery-summary")?.textContent,
  }));
  check("active Reasoning State appears in the first viewport before clear-state diagnostics",
    firstThreadView.cardTop < firstThreadView.viewportHeight * .6
      && firstThreadView.detailsOpen === false
      && firstThreadView.summary?.includes("Gateway continuity"));
  const threadEvidence = page.locator("#thread-list .thread-card .thread-evidence-details");
  const threadEvidenceSummary = threadEvidence.locator("summary");
  const detailToggle = page.getByRole("button", {name: "Inspect state and evidence for backend thread aaaaaaaa"});
  const firstThreadDisclosure = await page.evaluate(() => ({
    buttonVisible: !!document.querySelector("#thread-list .thread-detail-toggle")?.getBoundingClientRect().height,
    buttonName: document.querySelector("#thread-list .thread-detail-toggle")?.getAttribute("aria-label"),
    expanded: document.querySelector("#thread-list .thread-detail-toggle")?.getAttribute("aria-expanded"),
    evidenceVisible: !!document.querySelector("#thread-list .thread-evidence-details")?.getBoundingClientRect().height,
    frontierVisible: !![...document.querySelectorAll("#thread-list .thread-card p")]
      .find(element => element.textContent.includes("No completed frontier observed yet"))?.getBoundingClientRect().height,
    planVisible: !!document.querySelector("#thread-list .thread-plan-progress")?.getBoundingClientRect().height,
    cardText: document.querySelector("#thread-list .thread-card")?.innerText,
  }));
  assert.deepEqual(firstThreadDisclosure, {
    buttonVisible: true, buttonName: "Inspect state and evidence for backend thread aaaaaaaa",
    expanded: "false", evidenceVisible: false, frontierVisible: false, planVisible: true,
    cardText: firstThreadDisclosure.cardText,
  }, "first thread row shows checkpointed plan progress but hides detailed evidence");
  assert.match(firstThreadDisclosure.cardText, /TURN ACTIVE[\s\S]*Observed at/, JSON.stringify(firstThreadDisclosure));
  assert.match(firstThreadDisclosure.cardText, /Checkpointed plan · 2\/7 obligations complete · current slice 3\/7 \(active\) · 1 open decision/);
  checks.push("first thread row shows phase, time, and content-free plan progress without opening detailed state");
  await page.setViewportSize({width: 340, height: 740});
  const narrowThread = await page.evaluate(() => {
    const plan = document.querySelector("#thread-list .thread-plan-progress");
    return {visible: !!plan && !plan.hidden, planBottom: plan?.getBoundingClientRect().bottom,
      viewportHeight: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth};
  });
  check(`narrow Threads first viewport includes checkpointed plan progress ${JSON.stringify(narrowThread)}`,
    narrowThread.visible && narrowThread.planBottom <= narrowThread.viewportHeight
      && narrowThread.scrollWidth <= narrowThread.viewportWidth + 1);
  await page.setViewportSize({width: 1200, height: 850});
  await detailToggle.focus();
  await page.keyboard.press("Enter");
  check("keyboard reveals selected backend-thread state and bounded evidence",
    await page.getByRole("button", {name: "Close state and evidence for backend thread aaaaaaaa"}).getAttribute("aria-expanded") === "true"
      && await page.locator("#thread-list .thread-card p").filter({hasText: "No completed frontier observed yet"}).isVisible()
      && await threadEvidence.isVisible()
      && !await threadEvidence.evaluate(element => element.open)
      && !await page.locator("#thread-list .thread-host-receipts").isVisible());
  await page.setViewportSize({width: 340, height: 740});
  check("expanded Threads state stays inside the narrow viewport",
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
      && await page.getByRole("button", {name: "Close state and evidence for backend thread aaaaaaaa"}).isVisible());
  await page.setViewportSize({width: 1200, height: 850});
  const oldDetailToggle = await page.locator("#thread-list .thread-detail-toggle").elementHandle();
  await page.evaluate(() => document.getElementById("refresh").click());
  await page.waitForFunction(old => document.querySelector("#thread-list .thread-detail-toggle") !== old,
    oldDetailToggle);
  check("a fresh thread read retains the selected detail without opening protocol receipts",
    await threadEvidence.isVisible() && !await threadEvidence.evaluate(element => element.open)
      && await page.evaluate(() => document.activeElement?.classList.contains("thread-detail-toggle")));
  await threadEvidenceSummary.focus();
  await page.keyboard.press("Enter");
  check("keyboard opens per-thread protocol evidence",
    await threadEvidence.evaluate(element => element.open)
      && await page.locator("#thread-list .thread-host-receipts").isVisible());
  await page.locator("#thread-recovery-details > summary").click();
  await page.getByText("1 gateway dispatch recovery was durably confirmed", {exact: false}).first().waitFor();
  check("confirmed recovery remains distinct from task activation",
    (await page.locator("#thread-dispatch-status").innerText()).includes("does not establish desktop-task activation")
      && (await page.locator("#thread-list .thread-card").innerText()).includes("not a new completion frontier or desktop-task activation"));
  check("thread shows only a dated relay catalog snapshot",
    (await page.locator("#thread-list .thread-card").innerText()).includes("Last MCP relay catalog check · listed")
      && (await page.locator("#thread-list .thread-card").innerText()).includes("does not prove continuing tool availability"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "compaction-observed";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.querySelector("#thread-list .thread-host-receipts")?.textContent?.includes("1 accepted compaction turn"));
  await threadEvidenceSummary.click();
  await page.locator("#thread-list .thread-card").getByText("1 accepted compaction turn", {exact: false}).waitFor();
  check("Threads does not promote accepted compaction to a completed item",
    (await page.locator("#thread-list .thread-card").innerText()).includes("0 native completed compaction items")
      && (await page.locator("#thread-list .thread-card").innerText()).includes("Acceptance alone does not prove a completed compaction"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "compaction-recovered";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.querySelector("#thread-list .thread-host-receipts")?.textContent?.includes("1 recovered completed compaction"));
  await threadEvidenceSummary.click();
  await page.locator("#thread-list .thread-card").getByText("1 recovered completed compaction", {exact: false}).waitFor();
  check("Threads labels recovered completion without claiming desktop activation",
    (await page.locator("#thread-list .thread-card").innerText()).includes("from host history")
      && (await page.locator("#thread-list .thread-card").innerText()).includes("0 native completed compaction items")
      && (await page.locator("#thread-list .thread-card").innerText()).includes("Acceptance alone does not prove"));
  await page.locator("#thread-recovery-details > summary").click();
  check("clear continuity details can be collapsed again", !await page.locator("#thread-recovery-details").evaluate(element => element.open));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "unknown-thread-creation";});
  await page.locator("#refresh").click();
  await page.locator("#thread-observation-status").getByText("Attention").waitFor();
  check("unknown creation stays visible without a fabricated thread row or retry",
    await page.locator("#thread-recovery-details").evaluate(element => element.open)
      && await page.locator("#thread-list .thread-card").count() === 0
      && (await page.locator("#thread-creation-status").innerText()).includes("No thread identity or safe retry"));
  await page.locator('.nav-item[data-panel="overview"]').click();
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("overview-next-link")?.dataset.panelLink === "threads");
  check("Overview leads to exact inspected thread attention without changing product health",
    (await page.locator("#overview-next-link").innerText()).includes("thread attention")
      && (await page.locator("#overview-summary").innerText()).includes("Product diagnostic passed"));
  await page.locator("#overview-next-link").click();
  await page.locator("#thread-observation-status").getByText("Attention").waitFor();
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "unknown-hosted-effect";});
  await page.locator("#refresh").click();
  await page.locator("#thread-hosted-effect-status").getByText("1 hosted-effect dispatch has", {exact: false}).waitFor();
  check("unknown hosted effect stays visible without a fabricated thread row or retry",
    await page.locator("#thread-list .thread-card").count() === 0
      && (await page.locator("#thread-hosted-effect-status").innerText()).includes("host may or may not have executed it")
      && (await page.locator("#thread-hosted-effect-status").innerText()).includes("not a safe-retry signal"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "unknown-hosted-effect-thread";});
  await page.locator("#refresh").click();
  await page.locator("#thread-list .thread-card").getByText("1 hosted-effect dispatch has", {exact: false}).waitFor();
  check("matching thread shows effect uncertainty without inferring host execution",
    (await page.locator("#thread-list .thread-card").innerText()).includes("Host execution is unknown; this is not permission to retry."));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "normal";});
  await page.locator("#refresh").click();
  await page.locator("#thread-list .thread-card").getByText("Turn active", {exact: true}).waitFor();
  check("resolved gateway attention returns the active thread to the first view",
    !await page.locator("#thread-recovery-details").evaluate(element => element.open));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "thread-failed";});
  await page.locator("#refresh").click();
  await page.locator("#thread-list .thread-card").getByText("Turn failed", {exact: true}).waitFor();
  check("failed terminal frontier is not labelled completed",
    (await page.locator("#thread-list .thread-card").innerText()).includes("Verified completion frontier · failed"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "thread-future-phase";});
  await page.locator("#refresh").click();
  await page.locator("#thread-observation-status").getByText("Incompatible").waitFor();
  const incompatibleThreadText = await page.locator("#thread-list .thread-card").innerText();
  assert.match(incompatibleThreadText, /Last seen/i);
  check("future thread phase cannot become a current completed claim",
    !incompatibleThreadText.includes("Turn completed"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "normal";});
  await page.locator("#refresh").click();
  await page.locator("#thread-list .thread-card").getByText("Turn active", {exact: true}).waitFor();
  const link = page.getByRole("button", {name: "View decisions for backend thread aaaaaaaa"});
  await link.waitFor();
  check("decision link has a thread-specific accessible name", await link.count() === 1);
  await link.click();
  await page.getByText("Backend thread aaaaaaaa · 1 of 2 recent records").waitFor();
  check("exact thread and consumer join shows one decision", await page.locator("#decision-list .thread-card").count() === 1);
  const decisionCard = page.locator("#decision-list .decision-card").first();
  check("decision first view keeps evaluation separate from authorization and execution",
    (await decisionCard.innerText()).includes("authorization and execution not observed here"));
  check("decision technical evidence starts collapsed",
    !await decisionCard.locator("details").evaluate(element => element.open));
  await decisionCard.getByText("Reason and technical evidence").click();
  check("decision reason code is revealed only on request",
    (await decisionCard.innerText()).includes("selection.unique-capability")
      && (await decisionCard.innerText()).includes("Evidence event"));
  const decisionSummary = decisionCard.locator("summary");
  await decisionSummary.focus();
  const oldSummary = await decisionSummary.elementHandle();
  await page.evaluate(() => document.getElementById("refresh").click());
  await page.waitForFunction(element => !element.isConnected, oldSummary);
  check("same-source decision refresh keeps requested detail and keyboard focus",
    await decisionCard.locator("details").evaluate(element => element.open)
      && await decisionSummary.evaluate(element => element === document.activeElement));
  await page.setViewportSize({width: 340, height: 740});
  check("expanded decision evidence fits a narrow viewport",
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.setViewportSize({width: 1200, height: 850});
  check("filtered source remains gateway-consumer scoped", await page.locator("#decision-observation-source").innerText() === "Source: current gateway consumers · backend-thread evaluations only");
  await page.getByRole("button", {name: "Back to thread ↖"}).click();
  await page.waitForFunction(() => document.activeElement?.textContent?.includes("View decisions for this backend thread"));
  check("return focuses the originating thread", await page.evaluate(() => document.activeElement?.textContent?.includes("View decisions for this backend thread")));
  await link.click();
  await page.getByRole("button", {name: "Show all recent decisions"}).click();
  await page.waitForFunction(() => document.querySelectorAll("#decision-list .thread-card").length === 2);
  check("explicit clear control shows all recent decisions", await page.locator("#decision-filter").isHidden());
  await page.locator('.nav-item[data-panel="threads"]').click();
  await link.click();
  await page.locator('.nav-item[data-panel="decisions"]').click();
  await page.waitForFunction(() => document.querySelectorAll("#decision-list .thread-card").length === 2);
  check("global Decisions navigation clears thread filter", await page.locator("#decision-filter").isHidden());

  await page.locator('.nav-item[data-panel="threads"]').click();
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "source-changed";});
  await link.click();
  await page.getByText("The gateway process changed since this thread was observed.", {exact: false}).waitFor();
  check("different runtime epoch is not joined", await page.locator("#decision-live").isHidden());
  check("evidence marks a changed decision source instead of observed",
    await page.locator("#diagnostic-decision-posture").innerText() === "Source changed"
      && (await page.locator("#diagnostic-decision-detail").innerText()).includes("cannot be joined"));
  await page.getByRole("button", {name: "Back to thread ↖"}).click();
  await page.locator('.nav-item[data-panel="decisions"]').click();
  await page.waitForFunction(() => document.getElementById("decision-observation-status")?.textContent === "Source changed");
  check("unfiltered decisions from another adapter epoch are not observed",
    await page.locator("#decision-live").isHidden()
      && await page.locator("#diagnostic-decision-posture").innerText() === "Source changed");

  await page.locator('.nav-item[data-panel="threads"]').click();
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "truncated";});
  await link.click();
  await page.waitForFunction(() => document.querySelector("#decision-empty-detail")?.textContent?.includes("Older records may be omitted"));
  check("truncated absence is not reported as no decisions", await page.locator("#decision-observation-status").innerText() === "No matching records");
  check("evidence explains a bounded filtered decision miss",
    await page.locator("#diagnostic-decision-posture").innerText() === "No matching records"
      && (await page.locator("#diagnostic-decision-detail").innerText()).includes("older records may be omitted"));
  await page.setViewportSize({width: 340, height: 740});
  check("narrow decision filter stays inside the viewport", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  check("narrow view retains the return control", await page.getByRole("button", {name: "Back to thread ↖"}).isVisible());
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "thread-unavailable";});
  await page.getByRole("button", {name: "Back to thread ↖"}).click();
  await page.waitForFunction(() => document.getElementById("thread-observation-status")?.textContent === "Unavailable");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "normal";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "View decisions for backend thread aaaaaaaa");
  check("return focus survives a failed thread refresh", await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "View decisions for backend thread aaaaaaaa"));
  await page.locator('.nav-item[data-panel="overview"]').click();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  check("overview is scrollable before linked navigation", await page.evaluate(() => window.scrollY > 0));
  await page.locator("#overview-next-link").click();
  check("passed product diagnostic routes to the next adapter reading",
    await page.locator("#panel-adapters").isVisible());
  check("linked panel navigation resets the previous page scroll", await page.evaluate(() => window.scrollY === 0));
  await page.locator('.nav-item[data-panel="diagnostics"]').click();
  check("product diagnostic does not imply service readiness", (await page.locator("#diagnostic-product-detail").innerText()).includes("does not test a gateway"));
  for (const [panel, issue] of [["adapters", "adapter"], ["threads", "thread"], ["decisions", "decision"],
    ["evolution", "evolution"], ["evolution", "evolution-signal"]]) {
    await page.locator(`.nav-item[data-panel="${panel}"]`).click();
    await page.locator(`[data-panel-link="diagnostics"][data-diagnostic-issue="${issue}"]`).click();
    check(`${issue} link focuses its exact Evidence source`, await page.evaluate(expected =>
      document.activeElement?.id === `diagnostic-${expected}-issue`, issue));
    check(`${issue} issue has its own explanation`, Boolean((await page.locator(`#diagnostic-${issue}-detail`).innerText()).trim()));
    await page.locator(`#diagnostic-${issue}-issue [data-panel-link="${panel}"]`).click();
    check(`${issue} Evidence return opens its source page`, await page.evaluate(expected =>
      !document.getElementById(`panel-${expected}`)?.hidden
        && document.activeElement?.id === `${expected}-title`, panel));
  }
  for (const source of ["product", "adapter", "thread", "decision", "evolution", "evolution-signal"]) {
    check(`${source} has an independent explanation`, Boolean((await page.locator(`#diagnostic-${source}-detail`).innerText()).trim()));
  }
  await page.waitForFunction(() => document.getElementById("diagnostic-evolution-signal-posture")?.textContent === "Verified candidate inbox");
  const signalPosture = await page.locator("#diagnostic-evolution-signal-posture").innerText();
  const ledgerPosture = await page.locator("#diagnostic-evolution-posture").innerText();
  check("candidate inbox is separate from unconfigured Evolution ledger",
    signalPosture === "Verified candidate inbox" && ledgerPosture === "Not configured");
  check("Evolution first view exposes the separate current candidate count",
    await page.locator("#evolution-signal-teaser-status").innerText() === "Verified candidate inbox"
      && await page.locator("#evolution-signal-teaser-count").innerText() === "1 recorded candidate");
  await page.locator("#evolution-signal-jump").click();
  check("Evolution candidate jump focuses the independent source heading",
    await page.evaluate(() => document.activeElement?.id === "evolution-signals-title"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "evolution-registry-only";});
  await page.locator('.nav-item[data-panel="evolution"]').click();
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Registry only");
  const registryView = await page.evaluate(() => {
    const metrics = document.getElementById("evolution-evidence-metrics");
    const card = document.getElementById("evolution-definition-card");
    const cardTop = card.getBoundingClientRect().top;
    const metricsHidden = metrics.hidden;
    metrics.hidden = false;
    const expandedCardTop = card.getBoundingClientRect().top;
    metrics.hidden = metricsHidden;
    return {metricsHidden, cardTop, expandedCardTop, viewportHeight: innerHeight,
      evidenceLineHidden: document.getElementById("evolution-evidence-line").hidden,
      indexLineHidden: document.getElementById("evolution-index-line").hidden,
      summaryVisible: !document.getElementById("evolution-registry-summary")?.hidden,
      summary: document.getElementById("evolution-registry-summary")?.textContent};
  });
  check(`registry-only Evolution brings useful definitions into the first viewport ${JSON.stringify(registryView)}`,
    registryView.metricsHidden && registryView.evidenceLineHidden && registryView.indexLineHidden && registryView.summaryVisible
      && registryView.summary.includes("1 registry definition · No runtime root configured")
      && registryView.cardTop < registryView.viewportHeight
      && registryView.expandedCardTop - registryView.cardTop > 100);
  check("registry-only Evolution exposes section and definition headings to accessibility queries",
    await page.getByRole("heading", {level: 2, name: "WHAT CAN EVOLVE · SOURCE REGISTRY"}).isVisible()
      && await page.getByRole("heading", {level: 3, name: "Engine improvement"}).isVisible()
      && await page.getByRole("heading", {level: 2, name: "GATEWAY IMPROVEMENT SIGNALS · CANDIDATES ONLY"}).isVisible());
  for (const width of [320, 340]) {
    await page.setViewportSize({width, height: 740});
    const compact = await page.evaluate(() => ({scrollWidth: document.documentElement.scrollWidth,
      titleHeight: document.getElementById("evolution-title").getBoundingClientRect().height,
      definitionTop: document.getElementById("evolution-definition-card").getBoundingClientRect().top,
      firstDefinitionTop: document.querySelector("#evolution-definitions .evolution-definition").getBoundingClientRect().top,
      refreshLines: (() => {
        const range = document.createRange();
        range.selectNodeContents(document.getElementById("refresh"));
        return range.getClientRects().length;
      })(),
      refreshRight: document.getElementById("refresh").getBoundingClientRect().right}));
    check(`registry-only Evolution stays compact and readable at ${width}px ${JSON.stringify(compact)}`,
      compact.scrollWidth <= width + 1 && compact.titleHeight < 85
        && compact.definitionTop < 700 && compact.firstDefinitionTop < 740);
    check(`Refresh view stays on one visible line at ${width}px`,
      compact.refreshLines === 1 && compact.refreshRight <= width + 1);
  }
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "evolution-multiple-definitions";});
  await page.locator('.nav-item[data-panel="evolution"]').click();
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.querySelectorAll("#evolution-cycles .evolution-cycle").length === 2);
  check("verified Evolution restores its ledger metrics",
    await page.locator("#evolution-evidence-metrics").isVisible()
      && await page.locator("#evolution-registry-summary").isHidden()
      && await page.locator("#evolution-evidence-line").isVisible());
  check("Evolution separates a rebuildable index from verified ledger evidence",
    await page.locator("#evolution-observation-status").innerText() === "Verified ledger"
      && await page.locator("#evolution-index-status").innerText() === "Rebuild required"
      && !(await page.locator("#evolution-index-line").evaluate(element => element.open)));
  await page.locator("#evolution-index-line summary").click();
  check("Evolution index explanation expands without claiming a live worker or repairing storage",
    await page.locator("#evolution-index-line").evaluate(element => element.open)
      && (await page.locator("#evolution-index-detail").innerText()).includes("Ledger evidence remains verified")
      && (await page.locator("#evolution-index-detail").innerText()).includes("no recovery was run"));
  await page.locator("#evolution-index-line summary").click();
  const evolutionHeadings = await page.locator("#panel-evolution").getByRole("heading", {level: 2}).allTextContents();
  check("verified Evolution heading navigation follows the evidence-first order",
    evolutionHeadings.includes("OBSERVED CYCLES · RECORDED DISPOSITION")
      && evolutionHeadings.includes("WHAT CAN EVOLVE · SOURCE REGISTRY")
      && evolutionHeadings.indexOf("OBSERVED CYCLES · RECORDED DISPOSITION")
      < evolutionHeadings.indexOf("WHAT CAN EVOLVE · SOURCE REGISTRY")
      && evolutionHeadings.includes("COORDINATION · VERIFIED LEDGER"));
  for (const width of [320, 340]) {
    await page.setViewportSize({width, height: 740});
    const compact = await page.evaluate(() => ({scrollWidth: document.documentElement.scrollWidth,
      metricsHeight: document.getElementById("evolution-evidence-metrics").getBoundingClientRect().height,
      cycleTop: document.getElementById("evolution-cycle-card").getBoundingClientRect().top,
      firstCycleTop: document.querySelector("#evolution-cycles .evolution-cycle").getBoundingClientRect().top,
      firstCycleSummaryBottom: document.querySelector("#evolution-cycles .evolution-cycle summary").getBoundingClientRect().bottom,
      firstCycleSummaryWidth: document.querySelector("#evolution-cycles .evolution-cycle summary").getBoundingClientRect().width,
      latestEventVisibleInSummary: document.querySelector("#evolution-cycles .evolution-cycle summary")
        .textContent.includes("Latest verified event type:"),
      metricsTop: document.getElementById("evolution-evidence-metrics").getBoundingClientRect().top}));
    check(`verified Evolution exposes its first recorded cycle before metrics at ${width}px ${JSON.stringify(compact)}`,
      compact.scrollWidth <= width + 1 && compact.metricsHeight < 220
        && compact.cycleTop < compact.metricsTop && compact.firstCycleSummaryBottom < 740
        && compact.firstCycleSummaryWidth <= width && compact.latestEventVisibleInSummary);
  }
  await page.locator("#evolution-cycle-definition").focus();
  check("compact Evolution filter retains a visible keyboard focus ring",
    await page.evaluate(() => document.activeElement?.id === "evolution-cycle-definition"
      && getComputedStyle(document.activeElement).outlineStyle === "solid"));
  const definitions = await page.locator("#evolution-definitions").innerText();
  check("Evolution explains known cycle designs without promoting candidate admission",
    definitions.includes("Engine improvement")
      && definitions.includes("compare technique variants")
      && definitions.includes("Registry status: candidate · Admission no · Enabled no")
      && definitions.includes("Registry ref: engine-improvement/v1"));
  check("an unknown Evolution definition remains transparent without an invented purpose",
    definitions.includes("Future kind")
      && definitions.includes("not described in this Companion version")
      && definitions.includes("Registry ref: future-kind/v2"));
  check("two recorded definitions expose a bounded cycle filter",
    await page.locator("#evolution-cycle-filter").isVisible()
      && await page.locator("#evolution-cycle-definition option").count() === 3);
  const readsBeforeFilter = await page.evaluate(() => globalThis.__ARE_FIXTURE__.calls.get_evolution_snapshot);
  await page.locator("#evolution-cycle-definition").selectOption("evidence-review/v1");
  check("definition selection filters only the visible verified rows",
    await page.locator("#evolution-cycles .evolution-cycle").count() === 1
      && (await page.locator("#evolution-cycles").innerText()).includes("cycle:review-fixture")
      && !(await page.locator("#evolution-cycles").innerText()).includes("cycle:research-fixture")
      && (await page.locator("#evolution-cycle-filter-status").innerText()).includes("1 of 2 verified cycles")
      && await page.evaluate(() => globalThis.__ARE_FIXTURE__.calls.get_evolution_snapshot) === readsBeforeFilter);
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Verified ledger");
  check("a fresh same-source read keeps the selected definition",
    await page.locator("#evolution-cycle-definition").inputValue() === "evidence-review/v1"
      && await page.locator("#evolution-cycles .evolution-cycle").count() === 1);
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_evolution_snapshot = true;});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Unavailable");
  check("filtered cycles remain explicitly historical after source loss",
    await page.locator("#evolution-history-note").isVisible()
      && await page.locator("#evolution-cycle-definition").inputValue() === "evidence-review/v1"
      && await page.locator("#evolution-cycles .evolution-cycle").count() === 1);
  await page.evaluate(() => {delete globalThis.__ARE_FIXTURE__.faults.get_evolution_snapshot;});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Verified ledger");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "evolution-cycle";});
  await page.locator('.nav-item[data-panel="evolution"]').click();
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Verified ledger", null, {timeout: 5_000})
    .catch(async () => {throw new Error(`Evolution fixture did not become verified: ${JSON.stringify(await page.evaluate(() => ({
      status: document.getElementById("evolution-observation-status")?.textContent,
      detail: document.getElementById("evolution-empty-detail")?.textContent,
      calls: globalThis.__ARE_FIXTURE__.calls.get_evolution_snapshot,
      mode: globalThis.__ARE_FIXTURE__.mode,
    })))}`);});
  check("a single recorded definition clears the obsolete filter",
    await page.locator("#evolution-cycle-filter").isHidden()
      && await page.locator("#evolution-cycle-definition").inputValue() === "");
  const cycle = page.locator("#evolution-cycles .evolution-cycle");
  const cycleHeadline = await cycle.locator("summary").innerText();
  check("verified cycle shows disposition, latest recorded event type, and bounded count",
    cycleHeadline.includes("Recorded disposition: inconclusive")
      && cycleHeadline.includes("Latest verified event type: comparison-recorded")
      && cycleHeadline.includes("10 verified events"));
  await cycle.locator("summary").click();
  check("expanded cycle shows only the eight latest verified event types",
    await cycle.locator("li").count() === 8
      && (await cycle.innerText()).includes("Event 10 · comparison-recorded")
      && (await cycle.innerText()).includes("2 earlier verified events omitted")
      && !(await cycle.innerText()).includes("private-"));
  const cycleSummary = cycle.locator("summary");
  await cycleSummary.focus();
  const oldCycleSummary = await cycleSummary.elementHandle();
  await page.evaluate(() => document.getElementById("refresh").click());
  await page.waitForFunction(element => !element.isConnected, oldCycleSummary);
  const cycleRefreshState = await cycle.evaluate(element => ({open: element.open,
    focused: element.querySelector("summary") === document.activeElement,
    activeTag: document.activeElement?.tagName, activeId: document.activeElement?.id,
    status: document.getElementById("evolution-observation-status")?.textContent}));
  check(`same-revision Evolution refresh keeps event detail and keyboard focus ${JSON.stringify(cycleRefreshState)}`,
    cycleRefreshState.open && cycleRefreshState.focused);
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "evolution-phases";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.querySelectorAll("#evolution-coordination .evolution-phase-row").length === 2);
  check("recorded phase cues prioritize blocked work and qualify a lease",
    await page.locator("#evolution-coordination .phase-blocked").count() === 1
      && await page.locator("#evolution-coordination .phase-leased").count() === 1
      && (await page.locator("#evolution-coordination .phase-blocked").innerText()).includes("Blocked work recorded")
      && (await page.locator("#evolution-coordination .phase-leased").innerText()).includes("worker status unknown")
      && (await page.locator("#evolution-coordination .phase-blocked").innerText()).includes("Ready 1 · Leased 0 · Completed 0 · Blocked 1"));
  check("phase cues stay within a narrow Evolution viewport",
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  const freshPhaseAccent = await page.locator("#evolution-coordination .phase-blocked")
    .evaluate(element => getComputedStyle(element).borderLeftColor);
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_evolution_snapshot = true;});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Unavailable");
  check("source failure retains only dated verified Evolution history",
    await page.locator("#evolution-live").isVisible()
      && await page.locator("#evolution-history-note").isVisible()
      && (await page.locator("#evolution-history-note").innerText()).includes("current cycle and worker state are unknown")
      && (await page.locator("#evolution-evidence-status").innerText()) === "Last verified · not current"
      && await page.locator("#evolution-coordination .evolution-phase-row").count() === 2
      && await cycle.locator("li").count() === 8);
  check("historical phase cues lose their fresh-state accent",
    await page.locator("#evolution-coordination .phase-blocked")
      .evaluate(element => getComputedStyle(element).borderLeftColor) !== freshPhaseAccent);
  await page.evaluate(() => {delete globalThis.__ARE_FIXTURE__.faults.get_evolution_snapshot;});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Verified ledger");
  check("fresh Evolution read removes the historical warning", await page.locator("#evolution-history-note").isHidden());
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "evolution-source-unavailable";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Unavailable");
  check("source-reported unavailable cannot replace verified history with a false empty ledger",
    await page.locator("#evolution-history-note").isVisible()
      && await cycle.locator("li").count() === 8
      && (await page.locator("#evolution-cycle-count").innerText()) === "1"
      && (await page.locator("#evolution-index-status").innerText()) === "Last seen · matched");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "evolution-cycle";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Verified ledger");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "evolution-bad-cycle";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Incompatible");
  check("contradictory cycle progression fails closed", await page.locator("#evolution-live").isHidden());
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "evolution-bad-count";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Incompatible");
  check("cycle count below rendered records fails closed", await page.locator("#evolution-live").isHidden());
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "evolution-corrupt-cycle";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Invalid evidence");
  check("invalid ledger status suppresses cycle rows and counts",
    await page.locator("#evolution-cycles .evolution-cycle").count() === 0
      && (await page.locator("#evolution-cycle-count").innerText()) === "—"
      && (await page.locator("#evolution-commit-count").innerText()) === "—");
  await page.locator('.nav-item[data-panel="overview"]').click();
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("overview-next-link")?.dataset.diagnosticIssue === "evolution");
  await page.locator("#overview-next-link").click();
  await page.locator("#diagnostic-evolution-posture").getByText("Invalid evidence").waitFor();
  check("Overview opens the exact invalid Evolution evidence explanation",
    (await page.locator("#diagnostic-evolution-posture").innerText()) === "Invalid evidence");
  const evolutionDiagnosticFocus = await page.evaluate(() => document.activeElement?.id);
  assert.equal(evolutionDiagnosticFocus, "diagnostic-evolution-issue",
    "Overview focuses the Evolution explanation");
  await page.locator('.nav-item[data-panel="diagnostics"]').click();
  check("narrow diagnostics remain inside the viewport", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "normal";});
  await page.locator('.nav-item[data-panel="adapters"]').click();
  await page.locator('.nav-item[data-panel="decisions"]').click();
  await page.waitForFunction(() => document.getElementById("decision-observation-status")?.textContent === "Observed");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "adapter-epoch-b";});
  await page.locator('.nav-item[data-panel="adapters"]').click();
  await page.waitForFunction(() => document.getElementById("diagnostic-decision-posture")?.textContent === "Source changed");
  check("new adapter epoch invalidates an earlier decision reading",
    await page.locator("#decision-live").isHidden()
      && (await page.locator("#decision-empty-detail").innerText()).includes("selected gateway process changed"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "normal";});
  await page.locator('.nav-item[data-panel="adapters"]').click();
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "decision-no-epoch";});
  await page.locator('.nav-item[data-panel="decisions"]').click();
  await page.waitForFunction(() => document.getElementById("decision-observation-status")?.textContent === "Incompatible");
  check("decision without gateway epoch fails closed", await page.locator("#decision-live").isHidden());

  // Failure-matrix reads remain independent; only a verified same-epoch link is joined.
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "normal";});
  await page.locator("#refresh").click();
  await page.locator('.nav-item[data-panel="adapters"]').click();
  await page.locator("#adapter-observation-status").getByText("Observed").waitFor();
  await page.locator('.nav-item[data-panel="threads"]').click();
  await page.waitForFunction(() => document.getElementById("thread-observation-source")?.textContent?.includes("same gateway epoch as Adapters"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_adapter_snapshot = true;});
  await page.locator('.nav-item[data-panel="adapters"]').click();
  await page.locator("#adapter-observation-status").getByText("Unavailable").waitFor();
  check("sidebar shows adapter loss without a ready cue", await page.evaluate(() => {
    const footer = document.getElementById("sidebar-adapter");
    return footer.dataset.adapterPosture === "unavailable"
      && document.getElementById("sidebar-adapter-label").textContent === "Adapter unavailable"
      && getComputedStyle(footer.querySelector(".fine-dot")).boxShadow === "none";
  }));
  check("adapter loss immediately removes the thread-adapter epoch claim",
    (await page.locator("#thread-observation-source").innerText()).includes("adapter link not correlated"));
  await page.locator('.nav-item[data-panel="threads"]').click();
  await page.locator("#thread-observation-status").getByText("Observed").waitFor();
  check("thread observation remains independent when adapter read fails",
    (await page.locator("#thread-observation-source").innerText()).includes("adapter link not correlated"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_adapter_snapshot = false;});
  await page.locator('.nav-item[data-panel="adapters"]').click();
  await page.waitForFunction(() => document.getElementById("thread-observation-source")?.textContent?.includes("same gateway epoch as Adapters"));
  check("same-epoch adapter recovery restores the correlation caption",
    await page.locator("#adapter-observation-status").innerText() === "Observed");

  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_snapshot = true;});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("connection-title")?.textContent === "Product diagnostic unavailable");
  check("product read failure does not turn the adapter observation green or unavailable by inference",
    await page.locator("#adapter-observation-status").innerText() === "Observed"
      && await page.locator("#overview-freshness-title").innerText() === "One reading current"
      && (await page.locator("#overview-summary").innerText()).startsWith("Product diagnostic unavailable;"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_snapshot = false;});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("connection-title")?.textContent === "ARE diagnostic passed");

  await page.locator('.nav-item[data-panel="decisions"]').click();
  await page.locator("#decision-observation-status").getByText("Observed").waitFor();
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_thread_snapshot = true;});
  await page.locator('.nav-item[data-panel="threads"]').click();
  await page.locator("#thread-observation-status").getByText("Unavailable").waitFor();
  await page.waitForFunction(() => document.getElementById("diagnostic-decision-posture")?.textContent === "Observed"
    && document.getElementById("thread-list")?.textContent?.includes("Last seen"));
  const threadFailureState = await page.evaluate(() => ({decision: document.getElementById("diagnostic-decision-posture")?.textContent,
    thread: document.getElementById("thread-list")?.textContent}));
  assert.equal(threadFailureState.decision, "Observed", JSON.stringify(threadFailureState));
  assert.match(threadFailureState.thread, /Last seen/, JSON.stringify(threadFailureState));
  checks.push("thread failure preserves independent decision evidence without a current thread claim");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_thread_snapshot = false;});
  await page.locator('.nav-item[data-panel="threads"]').click();
  await page.locator("#thread-observation-status").getByText("Observed").waitFor();
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "thread-pages";});
  await page.locator("#refresh").click();
  await page.waitForFunction(() => document.getElementById("thread-page-range")?.textContent
    === "Showing 1–32 of 40 backend threads");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.holdThreadRead = true;});
  await page.locator("#thread-page-next").click();
  await page.waitForFunction(() => document.getElementById("thread-observation-status")?.textContent === "Reading…");
  check("pending page read keeps keyboard focus on enabled Start fresh instead of dropping it",
    await page.evaluate(() => document.activeElement?.id === "thread-page-reset"
      && !document.activeElement.disabled
      && document.getElementById("thread-list")?.textContent?.includes("Last seen")));
  await page.evaluate(() => {
    const fixture = globalThis.__ARE_FIXTURE__;
    fixture.holdThreadRead = false;
    fixture.releaseThreadRead?.();
  });
  await page.waitForFunction(() => document.getElementById("thread-page-range")?.textContent
    === "Showing 33–40 of 40 backend threads");
  check("settled final page moves keyboard focus to enabled Previous",
    await page.evaluate(() => document.activeElement?.id === "thread-page-prev"
      && !document.activeElement.disabled && document.getElementById("thread-page-next")?.disabled));
  const readsBeforeFreshStart = await page.evaluate(() => globalThis.__ARE_FIXTURE__.calls.get_thread_snapshot);
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.holdThreadRead = true;});
  await page.locator("#thread-page-prev").click();
  await page.waitForFunction(() => document.getElementById("thread-observation-status")?.textContent === "Reading…");
  await page.locator("#thread-page-reset").click();
  check("Start fresh pressed during a pending page read confirms the queued action",
    await page.evaluate(() => document.getElementById("thread-observation-status")?.textContent
      === "Reading… · Start fresh queued" && document.activeElement?.id === "thread-page-reset"));
  await page.evaluate(() => {
    const fixture = globalThis.__ARE_FIXTURE__;
    fixture.holdThreadRead = false;
    fixture.releaseThreadRead?.();
  });
  await page.waitForFunction(count => globalThis.__ARE_FIXTURE__.calls.get_thread_snapshot >= count + 2
    && document.getElementById("thread-observation-status")?.textContent === "Attention",
  readsBeforeFreshStart);
  check("queued Start fresh performs a second first-page read without stealing focus",
    await page.evaluate(() => document.getElementById("thread-page-range")?.textContent
      === "Showing 1–32 of 40 backend threads" && document.activeElement?.id === "thread-page-reset"));
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.mode = "normal";});
  await page.locator("#thread-page-reset").click();
  await page.locator("#thread-observation-status").getByText("Observed").waitFor();
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_decision_snapshot = true;});
  await page.locator('.nav-item[data-panel="decisions"]').click();
  await page.locator("#decision-observation-status").getByText("Unavailable").waitFor();
  check("decision failure hides old decision rows while Threads remains observed",
    await page.locator("#decision-live").isHidden()
      && await page.locator("#diagnostic-thread-posture").innerText() === "Observed");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_decision_snapshot = false; globalThis.__ARE_FIXTURE__.mode = "evolution-cycle";});

  await page.locator('.nav-item[data-panel="evolution"]').click();
  await page.locator("#evolution-observation-status").getByText("Verified ledger").waitFor();
  await page.locator("#evolution-signal-status").getByText("Verified candidate inbox").waitFor();
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_evolution_snapshot = true;});
  await page.locator("#refresh").click();
  await page.locator("#evolution-observation-status").getByText("Unavailable").waitFor();
  check("ledger failure does not erase independent candidate-inbox evidence",
    await page.locator("#evolution-live").isVisible()
      && await page.locator("#evolution-history-note").isVisible()
      && await page.locator("#evolution-signal-status").innerText() === "Verified candidate inbox");
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_evolution_snapshot = false; globalThis.__ARE_FIXTURE__.faults.get_evolution_signal_snapshot = true;});
  await page.locator("#refresh").click();
  await page.locator("#evolution-observation-status").getByText("Verified ledger").waitFor();
  await page.locator("#evolution-signal-status").getByText("Unavailable").waitFor();
  check("candidate-inbox failure clears its count without invalidating the ledger",
    await page.locator("#evolution-signal-count").innerText() === "—"
      && await page.locator("#evolution-signal-teaser-count").innerText() === "No current count"
      && await page.locator("#evolution-live").isVisible());
  await page.locator('.nav-item[data-panel="appearance"]').click();
  await page.waitForFunction(() => document.getElementById("evolution-observation-status")?.textContent === "Stale",
    null, {timeout: 22_000});
  check("inactive Evolution reading retains dated cycles without a current claim",
    await page.locator("#evolution-history-note").evaluate(element => !element.hidden)
      && (await page.locator("#evolution-evidence-status").innerText()) === "Last verified · not current"
      && await page.locator("#evolution-cycles .evolution-cycle li").count() === 8);
  await page.evaluate(() => {globalThis.__ARE_FIXTURE__.faults.get_evolution_signal_snapshot = false;});
  await page.locator('.nav-item[data-panel="evolution"]').click();
  await page.locator("#evolution-observation-status").getByText("Verified ledger").waitFor();
  const evolutionCalls = await page.evaluate(() => globalThis.__ARE_FIXTURE__.calls.get_evolution_snapshot);
  await page.waitForFunction(previous => globalThis.__ARE_FIXTURE__.calls.get_evolution_snapshot > previous,
    evolutionCalls, {timeout: 15_000});
  check("visible Evolution observation refreshes on the bounded timer",
    await page.locator("#evolution-observation-status").innerText() === "Verified ledger");
  await page.locator('.nav-item[data-panel="overview"]').click();
  const readsBeforeOverviewDisclosure = await page.evaluate(() => ({...globalThis.__ARE_FIXTURE__.calls}));
  await page.locator("#overview-other-sources > summary").focus();
  await page.keyboard.press("Enter");
  const overviewSourceIndex = await page.evaluate(() => ({
    rows: ["thread", "decision", "evolution", "evolution-signal"].map(source => ({
      source, overview: document.getElementById(`overview-${source}-posture`)?.textContent,
      evidence: document.getElementById(`diagnostic-${source}-posture`)?.textContent,
      detail: document.getElementById(`overview-${source}-detail`)?.textContent,
    })),
    calls: {...globalThis.__ARE_FIXTURE__.calls},
  }));
  check("Overview reflects each source independently after its page was visited",
    overviewSourceIndex.rows.every(row => row.overview === row.evidence && row.overview !== "Not inspected")
      && overviewSourceIndex.rows.find(row => row.source === "decision")?.overview === "Unavailable"
      && overviewSourceIndex.rows.find(row => row.source === "decision")?.detail.includes("Last observed"));
  check("source-index inspection makes no new source queries",
    ["get_thread_snapshot", "get_decision_snapshot", "get_evolution_snapshot", "get_evolution_signal_snapshot"]
      .every(command => overviewSourceIndex.calls[command] === readsBeforeOverviewDisclosure[command]));
  await page.locator('.overview-source-list button[data-panel-link="decisions"]').click();
  await page.locator("#decision-observation-status").getByText("Observed").waitFor();
  check("source-index link requests only its destination reading",
    await page.locator("#panel-decisions").isVisible()
      && await page.locator("#overview-decision-posture").innerText() === "Observed"
      && await page.evaluate(before => ["get_thread_snapshot", "get_evolution_snapshot", "get_evolution_signal_snapshot"]
        .every(command => globalThis.__ARE_FIXTURE__.calls[command] === before[command]),
      readsBeforeOverviewDisclosure));
  check("browser has no uncaught errors", errors.length === 0);
  process.stdout.write(`${JSON.stringify({status: "PASS", checks, errors}, null, 2)}\n`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
