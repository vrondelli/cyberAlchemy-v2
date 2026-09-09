import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WORKSPACE_ID = "local-essay-workspace";
const PROPOSAL_A_TEXT = "# Persisted proposal A\n\nA proposal staged, saved, and accepted through the real Tauri ledger.";
const PROPOSAL_A_REQUEST_ID = "wdio-record-proposal-a";
const PROPOSAL_A_ID = "wdio-proposal-a";
const PROPOSAL_B_TEXT = "# Persisted proposal B\n\nA second proposal staged and saved before an external ledger rejection.";
const PROPOSAL_B_REQUEST_ID = "wdio-record-proposal-b";
const PROPOSAL_B_ID = "wdio-proposal-b";
const PROPOSAL_B_REJECT_REQUEST_ID = "wdio-reject-proposal-b";
const FIXED_DEADLINE_UNIX_MS = 4_102_444_800_000;
const ARTIFACT_DIRECTORY = process.env.WORKSPACE_WDIO_OUTPUT ?? "/tmp/cav2-workspace-tauri-smoke";
const PERFORMANCE_BUDGETS = JSON.parse(readFileSync(new URL("../../performance-budgets.candidate.json", import.meta.url), "utf8"));

function percentile95(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? null;
}

function screenshotDigest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

async function invokeInWebView(command, args) {
  return browser.tauri.execute(
    async ({ core }, commandName, commandArgs) => {
      if (typeof core?.invoke !== "function") throw new Error("TAURI_INVOKE_UNAVAILABLE");
      return core.invoke(commandName, commandArgs);
    },
    command,
    args,
  );
}

function proposalCommand({ requestId, proposalId, sourceRevision, text }) {
  const operationId = `wdio-proposal-${proposalId}`;
  const command = {
    command: "record-proposal",
    request_id: requestId,
    workspace_id: WORKSPACE_ID,
    proposal_id: proposalId,
    source_revision: sourceRevision,
    context: {
      context_id: `wdio-context-${proposalId}`,
      purpose: operationId,
      provenance: ["wdio:real-tauri-slice-3"],
      sufficiency: "sufficient",
      authority_ceiling: "proposal-only",
      inferred: false,
      confidence_basis_points: null,
      conflicts: [],
      correction_ref: null,
      rejected: false,
    },
    operation_id: operationId,
    target_artifact: "essay.md",
    target_region: "body",
    text,
    rationale: "Exercise the proposal-to-writer-save handoff.",
    uncertainty: "Candidate smoke evidence only.",
    validation_diagnostics: ["wdio-real-ipc"],
    deadline_unix_ms: FIXED_DEADLINE_UNIX_MS,
  };
  if (command.context.purpose !== command.operation_id) {
    throw new Error("WDIO_PROPOSAL_PURPOSE_OPERATION_MISMATCH");
  }
  return command;
}

function rejectProposalBCommand() {
  return {
    command: "reject-proposal",
    request_id: PROPOSAL_B_REJECT_REQUEST_ID,
    workspace_id: WORKSPACE_ID,
    proposal_id: PROPOSAL_B_ID,
    expected_revision: 1,
    reason: "Deterministic WDIO terminal-conflict fixture.",
    deadline_unix_ms: FIXED_DEADLINE_UNIX_MS,
  };
}

async function openProjectOwnedEssays() {
  const explore = await $('button[aria-label="Explore workspace"]');
  await explore.waitForClickable();
  await explore.click();
  await expect($('//*[normalize-space()="Explore the system."]')).toBeDisplayed();

  const essaysRecord = await $('//*[contains(@class,"record-list")]//button[contains(.,"CA2-PROJECT-ESSAYS")]');
  await essaysRecord.waitForClickable();
  await essaysRecord.click();
  const openOwned = await $("button*=Open owned capability");
  await openOwned.waitForClickable();
  await openOwned.click();
  await expect($(".ownership-strip")).toHaveText(expect.stringContaining("Essays-owned action plane"));
}

async function createPreparedStudio() {
  const setupHeading = await $('//*[normalize-space()="Begin with intent, not a blank page."]');
  if (await setupHeading.isExisting()) {
    const createStudio = await $("button=Create local studio");
    await createStudio.waitForClickable();
    await createStudio.click();
  }
  await expect($('//*[normalize-space()="Ontology as a Product Practice"]')).toBeDisplayed();

  const acceptIntent = await $("button=Accept intent");
  if (await acceptIntent.isExisting()) {
    await acceptIntent.waitForClickable();
    await acceptIntent.click();
  }
  const generatePlan = await $("button=Generate & accept local plan");
  if (await generatePlan.isExisting()) {
    await generatePlan.waitForClickable();
    await generatePlan.click();
  }
  await expect($('//*[normalize-space()="Composition plan"]')).toBeDisplayed();
  await expect($("[data-testid=milkdown-editor]")).toBeDisplayed();
}

async function resetScrollToTop() {
  await browser.execute(() => window.scrollTo(0, 0));
  await browser.waitUntil(
    async () => await browser.execute(() => window.scrollY) === 0,
    { timeout: 5_000, timeoutMsg: "WebView did not reset to the top surface" },
  );
}

async function navigateMountedSurfaceAndAwaitPaint(label, visibleSelector) {
  const before = await browser.execute(() => (window.__CA2_PERFORMANCE_SAMPLES__ ?? [])
    .filter((sample) => sample.name === "workspace.navigation-to-paint").length);
  await $(`button[aria-label="${label}"]`).click();
  await $(visibleSelector).waitForDisplayed();
  await browser.waitUntil(async () => await browser.execute((previousCount) =>
    (window.__CA2_PERFORMANCE_SAMPLES__ ?? [])
      .filter((sample) => sample.name === "workspace.navigation-to-paint").length > previousCount,
  before), { timeout: 5_000, timeoutMsg: `${label} did not record an independent steady-navigation paint` });
}

async function settleWebViewFrames(count = 3) {
  await browser.executeAsync((frameCount, done) => {
    let remaining = frameCount;
    const tick = () => {
      remaining -= 1;
      if (remaining === 0) done(true);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, count);
}

async function lifecycleRailGeometry() {
  return browser.execute(() => {
    const stageRail = document.querySelector(".stage-rail");
    const appRail = document.querySelector(".app-rail");
    if (!stageRail || !appRail) throw new Error("MOBILE_LIFECYCLE_GEOMETRY_UNAVAILABLE");
    const rect = (element) => {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
    };
    const items = Array.from(stageRail.querySelectorAll(":scope > li"));
    const labels = items.map((item) => item.querySelector(":scope > span:last-child"));
    if (labels.some((label) => !label)) throw new Error("MOBILE_LIFECYCLE_LABEL_UNAVAILABLE");
    return {
      clientWidth: stageRail.clientWidth,
      scrollWidth: stageRail.scrollWidth,
      rail: rect(stageRail),
      items: items.map(rect),
      labels: labels.map((label) => rect(label)),
      viewportWidth: window.innerWidth,
      appRailTop: appRail.getBoundingClientRect().top,
    };
  });
}

function expectLifecycleRailGeometry(geometry) {
  expect(geometry.items).toHaveLength(5);
  expect(geometry.labels).toHaveLength(5);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  for (const bounds of [...geometry.items, ...geometry.labels]) {
    expect(bounds.left).toBeGreaterThanOrEqual(geometry.rail.left - 1);
    expect(bounds.right).toBeLessThanOrEqual(geometry.rail.right + 1);
    expect(bounds.left).toBeGreaterThanOrEqual(-1);
    expect(bounds.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  }
  expect(geometry.rail.bottom).toBeLessThanOrEqual(geometry.appRailTop + 1);
}

async function essaysDesktopGeometry() {
  return browser.execute(() => {
    const plane = document.querySelector(".essays-owned-plane");
    const dock = document.querySelector(".agent-dock");
    if (!plane || !dock) throw new Error("DESKTOP_ESSAYS_GEOMETRY_UNAVAILABLE");
    const findExact = (selector, text) => Array.from(document.querySelectorAll(selector))
      .find((element) => element.textContent?.trim() === text);
    const targets = [
      ["review panel", document.querySelector(".review-panel")],
      ["Editorial review heading", document.querySelector("#review-heading")],
      ["Open editorial review button", findExact("button", "Open editorial review")],
      ["Residue & export heading", document.querySelector("#residue-heading")],
      ["Validate current revision button", findExact("button", "Validate current revision")],
      ["Export reviewable package button", findExact("button", "Export reviewable package")],
    ];
    if (targets.some(([, element]) => !element)) throw new Error("DESKTOP_ESSAYS_TARGET_UNAVAILABLE");
    const rect = (element) => {
      const bounds = element.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
    };
    return {
      plane: rect(plane),
      dock: rect(dock),
      planeClientWidth: plane.clientWidth,
      planeScrollWidth: plane.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      targets: targets.map(([name, element]) => ({ name, contained: plane.contains(element), bounds: rect(element) })),
    };
  });
}

function expectEssaysDesktopGeometry(geometry) {
  expect(geometry.plane.right).toBeLessThanOrEqual(geometry.dock.left + 1);
  expect(geometry.planeScrollWidth).toBeLessThanOrEqual(geometry.planeClientWidth + 1);
  expect(geometry.documentScrollWidth).toBeLessThanOrEqual(geometry.documentClientWidth + 1);
  expect(geometry.targets).toHaveLength(6);
  for (const target of geometry.targets) {
    expect(target.contained).toBe(true);
    expect(target.bounds.left).toBeGreaterThanOrEqual(geometry.plane.left - 1);
    expect(target.bounds.right).toBeLessThanOrEqual(geometry.plane.right + 1);
    expect(target.bounds.top).toBeGreaterThanOrEqual(geometry.plane.top - 1);
    expect(target.bounds.bottom).toBeLessThanOrEqual(geometry.plane.bottom + 1);
    expect(target.bounds.right).toBeLessThanOrEqual(geometry.dock.left + 1);
  }
}

async function inspectOntology(screenshots) {
  const ontologyRail = await $('button[aria-label="Open Ontology"]');
  await ontologyRail.waitForClickable();
  await ontologyRail.click();
  await expect($('section[aria-label="Event-calculated ontology browser"]')).toBeDisplayed();
  await expect($("h1=Ontology & views")).toBeDisplayed();
  // Retain the existing Workspace graph coverage via its explicit selector.
  // The event-backed v4 API is a separate integration requirement, not proved here.
  const workspaceGraph = await $("button=Show Workspace graph");
  await workspaceGraph.waitForClickable();
  await workspaceGraph.click();
  await expect($('//*[normalize-space()="Follow meaning through its relations."]')).toBeDisplayed();

  const portal = await $('button[aria-label="Focus Essays, Project Entry, proposed"]');
  await portal.waitForClickable();
  await portal.click();
  await expect($("[data-testid=portal-scope]")).toHaveText(expect.stringContaining("Essays"));

  const coordination = await $('button*=coordination');
  await coordination.waitForClickable();
  await coordination.click();
  await expect($("[data-testid=portal-scope]")).toHaveText(expect.stringContaining("Choose a node as a portal."));

  const coordinatesEdge = await $('.react-flow__edge[data-id="WORKSPACE-REL-004"]');
  await coordinatesEdge.waitForDisplayed();
  await expect($(".relation-label[data-relation-type=coordinates]")).toBeDisplayed();

  const survivingEndpoint = await $('.react-flow__node[data-id="CA2-PROJECT-CYBERALCHEMY-WORKSPACE"]');
  await survivingEndpoint.waitForClickable();
  await survivingEndpoint.click();

  const inspect = await $("button=Inspect record & relations");
  await inspect.waitForClickable();
  await inspect.click();
  await expect($("[role=dialog]")).toBeDisplayed();
  await expect($("[aria-label='Textual relationship view']")).toBeDisplayed();

  const path = join(ARTIFACT_DIRECTORY, "ontology-dialog-1280x820.png");
  await browser.saveScreenshot(path);
  screenshots.push({ path, sha256: screenshotDigest(path) });
  const close = await $('button[aria-label="Close ontology detail"]');
  await close.waitForClickable();
  await close.click();
  await $("[role=dialog]").waitForExist({ reverse: true });
}

describe("unified Workspace and Essays Slice 3 through real Tauri IPC", () => {
  it("stages, writer-saves, accepts, and preserves terminal residue across relaunch", async () => {
    mkdirSync(ARTIFACT_DIRECTORY, { recursive: true });
    const capturedPerformanceSamples = [];
    await browser.waitUntil(async () => (await browser.getUrl()) !== "about:blank", {
      timeout: 15_000,
      timeoutMsg: "Tauri application document did not become available",
    });
    await $("body").waitForExist();
    await browser.waitUntil(async () => await browser.execute(() =>
      (window.__CA2_PERFORMANCE_SAMPLES__ ?? []).some((sample) => sample.name === "chat.connect-to-ready"),
    ), { timeout: 5_000, timeoutMsg: "Workspace governed chat control plane did not become ready" });
    // Tauri already configures the initial desktop size. Do not overlap a driver
    // resize with the cold startup samples; normalize later geometry only now.
    await browser.setWindowSize(1280, 820);
    await browser.execute(() => {
      window.localStorage.clear();
      const startupMetrics = new Set([
        "workspace.tauri.chat-cold-ipc-handshake",
        "workspace.tauri.chat-connect-dispatch",
        "workspace.tauri.chat-event-replay-dispatch",
        "chat.connect-to-ready",
      ]);
      window.__CA2_PERFORMANCE_SAMPLES__ = (window.__CA2_PERFORMANCE_SAMPLES__ ?? [])
        .filter((sample) => startupMetrics.has(sample.name));
      window.location.hash = "#/collections/projects";
    });

    await openProjectOwnedEssays();
    await createPreparedStudio();
    const editableDraft = await $("[data-testid='milkdown-editor'] [contenteditable='true']");
    await editableDraft.waitForClickable();
    const beforeEditorText = await editableDraft.getText();
    await browser.execute(() => {
      const editor = document.querySelector("[data-testid='milkdown-editor'] [contenteditable='true']");
      if (!(editor instanceof HTMLElement)) throw new Error("MILKDOWN_EDITABLE_MISSING");
      editor.focus();
      if (!document.execCommand("insertText", false, "x")) throw new Error("MILKDOWN_INSERT_TEXT_REJECTED");
    });
    await browser.waitUntil(
      async () => await browser.execute(() => (window.__CA2_PERFORMANCE_SAMPLES__ ?? []).some((sample) => sample.name === "essays.editor-input-to-projection")),
      { timeout: 5_000, timeoutMsg: "Editor input projection sample was not recorded" },
    );
    await expect(editableDraft).toHaveText(`x${beforeEditorText}`);
    await browser.execute(() => {
      const editor = document.querySelector("[data-testid='milkdown-editor'] [contenteditable='true']");
      if (!(editor instanceof HTMLElement)) throw new Error("MILKDOWN_EDITABLE_MISSING");
      editor.focus();
      if (!document.execCommand("delete", false)) throw new Error("MILKDOWN_DELETE_REJECTED");
    });

    const attachLedger = await $("button=Attach ledger");
    await attachLedger.waitForClickable();
    await attachLedger.click();
    await expect($("aside.agent-dock")).toHaveText(expect.stringContaining("Local agent ledger created and attached."));

    const principal = await invokeInWebView("principal_evidence", {});
    expect(principal).toMatchObject({ clientId: "essays-tauri", evidenceKind: "local-process", verifiedHumanIdentity: false });
    expect(principal.principalSubject).toMatch(/^(unix:\d+|windows:S-[\d-]+)$/);

    const proposalACommand = proposalCommand({ requestId: PROPOSAL_A_REQUEST_ID, proposalId: PROPOSAL_A_ID, sourceRevision: 0, text: PROPOSAL_A_TEXT });
    const proposalReceipt = await invokeInWebView("execute", { command: proposalACommand });
    expect(proposalReceipt).toMatchObject({ request_id: PROPOSAL_A_REQUEST_ID, workspace_id: WORKSPACE_ID, outcome: "accepted", replayed: false, linked_proposal_id: PROPOSAL_A_ID });

    await $("button=Refresh").click();
    const proposalCard = await $("article.agent-proposal");
    await proposalCard.waitForDisplayed();
    await expect(proposalCard).toHaveText(expect.stringContaining(PROPOSAL_A_TEXT));

    const acceptSaved = await $("button=Accept saved draft in ledger");
    expect(await acceptSaved.isEnabled()).toBe(false);
    await $("button=Stage in editor").click();
    await expect($("[aria-label='Persisted proposal handoff']")).toHaveText(expect.stringContaining("staged-unsaved"));
    expect(await acceptSaved.isEnabled()).toBe(false);

    const saveDraft = await $("button=Save accepted draft");
    await saveDraft.waitForClickable();
    await saveDraft.click();
    await expect($(".essays-owned-plane .notice")).toHaveText(expect.stringContaining("Writer-approved draft revision saved."));
    await expect($("[aria-label='Persisted proposal handoff']")).toHaveText(expect.stringContaining("saved-exact"));
    await browser.waitUntil(async () => await browser.execute(() => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((candidate) => candidate.textContent?.trim() === "Accept saved draft in ledger");
      return Boolean(button && !button.disabled);
    }), { timeout: 5_000, timeoutMsg: "Saved-draft acceptance did not become enabled in the WebView" });
    await browser.execute(() => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((candidate) => candidate.textContent?.trim() === "Accept saved draft in ledger");
      if (!(button instanceof HTMLButtonElement) || button.disabled) throw new Error("SAVED_DRAFT_ACCEPTANCE_UNAVAILABLE");
      button.click();
    });

    const acceptedText = await $("section.accepted-text");
    await expect(acceptedText).toHaveText(expect.stringContaining("r1"));
    await expect(acceptedText).toHaveText(expect.stringContaining(PROPOSAL_A_TEXT));
    await expect($("[aria-label='Persisted proposal handoff']")).toHaveText(expect.stringContaining("accepted"));

    const beforeRelaunch = await invokeInWebView("snapshot", { workspaceId: WORKSPACE_ID, cursor: null });
    expect(beforeRelaunch.workspace.accepted_revision).toBe(1);
    expect(beforeRelaunch.workspace.accepted_text).toBe(PROPOSAL_A_TEXT);

    const proposalBCommand = proposalCommand({ requestId: PROPOSAL_B_REQUEST_ID, proposalId: PROPOSAL_B_ID, sourceRevision: 1, text: PROPOSAL_B_TEXT });
    const proposalBReceipt = await invokeInWebView("execute", { command: proposalBCommand });
    expect(proposalBReceipt).toMatchObject({ request_id: PROPOSAL_B_REQUEST_ID, workspace_id: WORKSPACE_ID, outcome: "accepted", replayed: false, linked_proposal_id: PROPOSAL_B_ID });
    await $("button=Refresh").click();
    const proposalBCard = await $(`//article[contains(@class,"agent-proposal")][contains(.,"${PROPOSAL_B_ID}")]`);
    await proposalBCard.waitForDisplayed();
    await proposalBCard.$("button=Stage in editor").click();
    await expect($("[aria-label='Persisted proposal handoff']")).toHaveText(expect.stringContaining("staged-unsaved"));
    await $("button=Save accepted draft").click();
    await expect($("[aria-label='Persisted proposal handoff']")).toHaveText(expect.stringContaining("saved-exact"));

    const proposalBRejectReceipt = await invokeInWebView("execute", { command: rejectProposalBCommand() });
    expect(proposalBRejectReceipt).toMatchObject({ request_id: PROPOSAL_B_REJECT_REQUEST_ID, workspace_id: WORKSPACE_ID, outcome: "rejected", replayed: false, linked_proposal_id: PROPOSAL_B_ID });
    await expect($("[aria-label='Persisted proposal handoff']")).toHaveText(expect.stringContaining("rejected"));
    await expect($("[aria-label='Persisted proposal handoff']")).toHaveText(expect.stringContaining("ledger reports this proposal rejected"));
    await proposalBCard.waitForExist({ reverse: true });

    const conflictSnapshot = await invokeInWebView("snapshot", { workspaceId: WORKSPACE_ID, cursor: null });
    expect(conflictSnapshot.workspace.accepted_revision).toBe(1);
    expect(conflictSnapshot.workspace.accepted_text).toBe(PROPOSAL_A_TEXT);
    expect(conflictSnapshot.proposals.find((proposal) => proposal.proposal_id === PROPOSAL_B_ID)?.status).toBe("rejected");
    const terminalCursor = conflictSnapshot.event_cursor;

    const screenshots = [];
    const essaysPath = join(ARTIFACT_DIRECTORY, "essays-accepted-1280x820.png");
    await browser.saveScreenshot(essaysPath);
    screenshots.push({ path: essaysPath, sha256: screenshotDigest(essaysPath) });

    await resetScrollToTop();
    await expect($(".ownership-strip")).toBeDisplayed();
    await expect($(".essays-root .topbar")).toBeDisplayed();
    await expect($(".stage-rail")).toBeDisplayed();
    await expect($("[data-testid=milkdown-editor]")).toBeDisplayed();
    await expect($("[aria-label='Persisted proposal handoff']")).toHaveText(expect.stringContaining("rejected"));
    const desktopEssaysGeometry = await essaysDesktopGeometry();
    expectEssaysDesktopGeometry(desktopEssaysGeometry);
    const essaysTopPath = join(ARTIFACT_DIRECTORY, "essays-top-reset-1280x820.png");
    await browser.saveScreenshot(essaysTopPath);
    screenshots.push({ path: essaysTopPath, sha256: screenshotDigest(essaysTopPath) });

    await inspectOntology(screenshots);

    capturedPerformanceSamples.push(...await browser.execute(() => window.__CA2_PERFORMANCE_SAMPLES__ ?? []));

    await browser.reloadSession();
    await browser.setWindowSize(1280, 820);
    // A restored Essays route makes another Essays click a no-op. Establish a
    // different visible route before measuring the recovery navigation.
    await $('button[aria-label="Explore workspace"]').click();
    await expect($('//*[normalize-space()="Explore the system."]')).toBeDisplayed();
    await browser.execute(() => { window.__CA2_PERFORMANCE_SAMPLES__ = []; });
    const essaysRail = await $('button[aria-label="Open Essays"]');
    await essaysRail.waitForClickable();
    await essaysRail.click();
    await expect($('//*[normalize-space()="Ontology as a Product Practice"]')).toBeDisplayed();
    await browser.waitUntil(async () => await browser.execute(() =>
      (window.__CA2_PERFORMANCE_SAMPLES__ ?? [])
        .some((sample) => sample.name === "workspace.navigation-to-paint" || sample.name === "workspace.cold-navigation-to-paint")),
    { timeout: 5_000, timeoutMsg: "Recovery navigation did not finish its paint measurement" });

    await $("button=Refresh").click();

    const afterRelaunch = await invokeInWebView("snapshot", { workspaceId: WORKSPACE_ID, cursor: null });
    expect(afterRelaunch.workspace.accepted_revision).toBe(1);
    expect(afterRelaunch.workspace.accepted_text).toBe(PROPOSAL_A_TEXT);
    expect(afterRelaunch.event_cursor).toBe(terminalCursor);
    await expect($("[aria-label='Persisted proposal handoff']")).toHaveText(expect.stringContaining("rejected"));

    const replayReceipt = await invokeInWebView("execute", { command: proposalACommand });
    expect(replayReceipt.replayed).toBe(true);
    const afterReplay = await invokeInWebView("snapshot", { workspaceId: WORKSPACE_ID, cursor: null });
    expect(afterReplay.event_cursor).toBe(terminalCursor);
    expect(afterReplay.proposals.filter((proposal) => proposal.proposal_id === PROPOSAL_A_ID)).toHaveLength(1);
    await browser.execute(() => {
      const recoveryMetrics = new Set(["workspace.navigation-to-paint", "workspace.cold-navigation-to-paint"]);
      window.__CA2_PERFORMANCE_SAMPLES__ = (window.__CA2_PERFORMANCE_SAMPLES__ ?? [])
        .filter((sample) => !recoveryMetrics.has(sample.name));
    });

    const chatRail = await $('button[aria-label="Open governed chat"]');
    await chatRail.waitForClickable();
    await chatRail.click();
    await expect($('//*[normalize-space()="Work in conversation."]')).toBeDisplayed();
    await expect($(".chat-status-ready")).toBeDisplayed();
    const chatIntent = await $("#are-chat-intent");
    await browser.execute(() => {
      const select = document.querySelector("#are-chat-intent");
      if (!(select instanceof HTMLSelectElement)) throw new Error("CHAT_INTENT_SELECTOR_MISSING");
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
      if (!setter) throw new Error("CHAT_INTENT_VALUE_SETTER_MISSING");
      setter.call(select, "validate");
      select.dispatchEvent(new Event("change", {bubbles: true}));
    });
    await expect(chatIntent).toHaveValue("validate");
    const chatInput = await $("#are-chat-input");
    await chatInput.setValue("Validate the governed desktop chat canary.");
    const sendChat = await $(".chat-composer").$("button=Send");
    await sendChat.waitForClickable();
    await sendChat.click();
    await expect($(".decision-card")).toHaveText(expect.stringContaining("direct"));
    await expect($(".decision-card")).toHaveText(expect.stringContaining("run bounded non-ontology validation and report evidence"));
    const approveOnce = await $("button=Approve once");
    await approveOnce.waitForClickable();
    await expect($(".decision-card-attention code")).toHaveText(expect.stringMatching(/^[a-f0-9]{64}$/));
    await browser.execute(() => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((candidate) => candidate.textContent?.trim() === "Approve once");
      if (!(button instanceof HTMLButtonElement) || button.disabled) throw new Error("CHAT_APPROVAL_UNAVAILABLE");
      button.click();
    });
    await expect($(".chat-message-assistant")).toHaveText(expect.stringContaining("Mock turn completed."));
    await expect($(".chat-status-ready")).toBeDisplayed();
    const chatPath = join(ARTIFACT_DIRECTORY, "governed-chat-1280x820.png");
    const replyVisibility = await browser.execute(() => {
      const reply = Array.from(document.querySelectorAll(".chat-message-assistant:not([hidden])"))
        .find(element => element.textContent?.includes("Mock turn completed."));
      const placeholder = document.querySelector(".chat-message-streaming[hidden]");
      if (!reply || !placeholder) throw Error("CHAT_COMPLETED_REPLY_MISSING");
      return {replyOpacity: getComputedStyle(reply).opacity, placeholderDisplay: getComputedStyle(placeholder).display};
    });
    expect(replyVisibility).toEqual({replyOpacity: "1", placeholderDisplay: "none"});
    await browser.saveScreenshot(chatPath);
    screenshots.push({ path: chatPath, sha256: screenshotDigest(chatPath) });

    await settleWebViewFrames();
    await navigateMountedSurfaceAndAwaitPaint("Open Essays", ".surface-view:not([hidden]) .essays-root");

    for (let iteration = 0; iteration < 7; iteration += 1) {
      await navigateMountedSurfaceAndAwaitPaint("Explore workspace", ".surface-view:not([hidden]) .workspace-main");
      await navigateMountedSurfaceAndAwaitPaint("Open governed chat", ".surface-view:not([hidden]) .chat-surface");
      await navigateMountedSurfaceAndAwaitPaint("Open Essays", ".surface-view:not([hidden]) .essays-root");
    }

    const requestedOuterViewport = { width: 390, height: 844 };
    await browser.setWindowSize(requestedOuterViewport.width, requestedOuterViewport.height);
    await browser.waitUntil(async () => await browser.execute(() => {
      const rail = document.querySelector(".app-rail");
      return window.innerWidth <= 720 && rail !== null && getComputedStyle(rail).position === "fixed";
    }), { timeout: 5_000, timeoutMsg: "WebView did not settle into the mobile navigation layout" });
    await resetScrollToTop();
    const measuredInnerViewport = await browser.execute(() => ({ width: window.innerWidth, height: window.innerHeight }));
    expect(measuredInnerViewport.width).toBeGreaterThan(0);
    expect(measuredInnerViewport.width).toBeLessThanOrEqual(720);
    expect(measuredInnerViewport.height).toBeGreaterThan(0);
    const mobileLifecycleGeometry = await lifecycleRailGeometry();
    expectLifecycleRailGeometry(mobileLifecycleGeometry);
    const essaysMobilePath = join(ARTIFACT_DIRECTORY, "essays-mobile-top-390x844.png");
    await browser.saveScreenshot(essaysMobilePath);
    screenshots.push({ path: essaysMobilePath, sha256: screenshotDigest(essaysMobilePath) });

    const performanceSamples = [
      ...capturedPerformanceSamples,
      ...await browser.execute(() => window.__CA2_PERFORMANCE_SAMPLES__ ?? []),
    ];
    const performanceResults = Object.entries(PERFORMANCE_BUDGETS.budgets).map(([name, budget]) => {
      const matchingSamples = performanceSamples.filter((sample) => sample.name === name);
      const durations = matchingSamples.map((sample) => sample.durationMs);
      const p95Ms = percentile95(durations);
      const status = durations.length < budget.minimum_samples
        ? "insufficient-samples"
        : p95Ms === null || p95Ms > budget.p95_ms
          ? "p95-exceeded"
          : "within-budget";
      return {
        name,
        status,
        sampleCount: durations.length,
        samplesMs: durations,
        sampleDetails: matchingSamples.map((sample) => sample.detail ?? null),
        p95Ms,
        budgetMs: budget.p95_ms,
      };
    });

    process.stdout.write(`${JSON.stringify({ status: "CANDIDATE_PERFORMANCE_MEASURED", performanceResults, authorityEffect: "none" })}\n`);
    // Diagnostic only: run after capturing budget samples; never inject these
    // intervals into product measurements or exclude slow product samples.
    const idleFrameIntervals = await browser.executeAsync((done) => {
      const intervals = [];
      let previous;
      const tick = (now) => {
        if (previous !== undefined) intervals.push(now - previous);
        previous = now;
        if (intervals.length === 20) done(intervals);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    writeFileSync(join(ARTIFACT_DIRECTORY, "native-performance.json"), JSON.stringify({
      status: performanceResults.every(result => result.status === "within-budget") ? "PASS" : "FAIL",
      authorityEffect: "none",
      performanceResults,
      performanceSamples,
      idleFrameIntervals,
      idleFrameP95Ms: percentile95(idleFrameIntervals),
      screenshots,
      measuredInnerViewport,
      open_questions_ref: "../T7-ACCEPTANCE.md#open-questions",
    }, null, 2) + "\n");
    const failedBudget = performanceResults.find((result) => result.status !== "within-budget");
    if (failedBudget) {
      throw new Error(`${failedBudget.name} ${failedBudget.status}; samples=${JSON.stringify(failedBudget.samplesMs)} p95=${failedBudget.p95Ms ?? "unavailable"}ms budget=${failedBudget.budgetMs}ms`);
    }

    process.stdout.write(`${JSON.stringify({
      status: "CANDIDATE_SCREENSHOTS_CAPTURED",
      viewport: { width: 1280, height: 820 },
      requestedOuterViewport,
      measuredInnerViewport,
      desktopEssaysGeometry,
      mobileLifecycleGeometry,
      fixture: "fresh-browser-local-and-temporary-sqlite",
      webview: "actual-tauri-embedded-provider",
      screenshots,
      performanceResults,
      aestheticAssessment: "not-evaluated",
      authorityEffect: "none",
    })}\n`);
  });
});
