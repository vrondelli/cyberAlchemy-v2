#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { pathToFileURL } from "node:url";

import { canonicalBytes } from "../src/canonical-json.mjs";
import {
  requestGateway,
  startOewPrototypeGateway,
} from "./serve-oew-prototype.mjs";

const implementationRoot = resolve(import.meta.dirname, "..");
const defaultBuildHandle =
  "generated/runs/SWU-OEWTP-002/20260730T193725Z/thin-prototype-build-handle.json";
const adapterRun = "generated/runs/BODY-WAR-ONTOLOGY-001";
const tokenPattern = /([?&]token=)[^&\s]+/g;
const expectedTourNodeIds = [
  "presentation:body-war.business.context.geometry-evidence",
  "presentation:body-war.business.context.identity-consent",
  "presentation:body-war.business.context.route-expansion",
  "presentation:body-war.business.context.score-preview",
];
const expectedPortalKeys = [
  "presentation:body-war.business.context.geometry-evidence|related|owns|presentation:body-war.business.capability.activity-geometry|forward",
  "presentation:body-war.business.context.identity-consent|related|owns|presentation:body-war.business.capability.auth-consent|forward",
  "presentation:body-war.business.context.route-expansion|related|owns|presentation:body-war.business.capability.evidence-candidate-attach|forward",
  "presentation:body-war.business.context.route-expansion|related|owns|presentation:body-war.business.capability.suggested-track-creation|forward",
  "presentation:body-war.business.context.route-expansion|related|owns|presentation:body-war.business.capability.suggested-track-discovery|forward",
  "presentation:body-war.business.context.score-preview|related|owns|presentation:body-war.business.capability.score-preview|forward",
].sort();
const literalPortalSelector =
  '[data-testid="knowledge-focus-portals"] button[data-source="presentation:body-war.business.context.identity-consent"][data-target="presentation:body-war.business.capability.auth-consent"]';
const identityConsentNodeId =
  "presentation:body-war.business.context.identity-consent";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function contained(root, candidate) {
  const path = relative(root, candidate);
  return (
    path !== "" &&
    path !== ".." &&
    !path.startsWith(`..${sep}`) &&
    !isAbsolute(path)
  );
}

function redact(value, token) {
  return String(value ?? "")
    .replaceAll(token, "<redacted-token>")
    .replace(tokenPattern, "$1<redacted-token>");
}

function validateOutput(rawOutput) {
  if (typeof rawOutput !== "string" || !rawOutput) {
    throw new Error("output path is required");
  }
  const logical = rawOutput.split(sep).join("/");
  const parts = logical.split("/");
  if (
    parts.length !== 5 ||
    parts[0] !== "generated" ||
    parts[1] !== "runs" ||
    parts[2] !== "BODY-WAR-ONTOLOGY-FOCUS-AB-001" ||
    !/^[0-9]{8}T[0-9]{6}Z$/.test(parts[3]) ||
    parts[4] !== "result.json"
  ) {
    throw new Error(
      "output path must be generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/<attempt>/result.json",
    );
  }
  const output = resolve(implementationRoot, logical);
  if (!contained(implementationRoot, output)) {
    throw new Error("output path escapes the implementation root");
  }
  return {
    logical,
    output,
    outputRoot: dirname(output),
    attemptId: parts[3],
  };
}

async function artifact(path, logicalPath) {
  const info = await lstat(path);
  assert.equal(info.isFile(), true);
  assert.equal(info.isSymbolicLink(), false);
  const bytes = await readFile(path);
  return {
    path: logicalPath,
    sha256: sha256(bytes),
    size_bytes: bytes.length,
  };
}

async function resolvePlaywright() {
  const cliPath = execFileSync("sh", ["-lc", "command -v playwright"], {
    encoding: "utf8",
  }).trim();
  assert.ok(cliPath);
  const cliRealpath = await realpath(cliPath);
  const packageRoot = dirname(cliRealpath);
  const packagePath = join(packageRoot, "package.json");
  const packageDocument = JSON.parse(await readFile(packagePath, "utf8"));
  assert.equal(packageDocument.name, "playwright");
  const apiPath = join(packageRoot, "index.mjs");
  const api = await import(pathToFileURL(apiPath).href);
  const executablePath = api.chromium.executablePath();
  return {
    api,
    packageVersion: packageDocument.version,
    executablePath,
    executable: await artifact(executablePath, executablePath),
  };
}

async function portReleased(baseUrl) {
  try {
    await requestGateway({ baseUrl, path: "/" });
    return false;
  } catch (error) {
    return ["ECONNREFUSED", "ECONNRESET"].includes(error.code);
  }
}

async function renderedScene(page) {
  return await page.evaluate(() => {
    const nodeIds = [...document.querySelectorAll(".react-flow__node")]
      .map((node) => node.getAttribute("data-id"))
      .filter(Boolean)
      .sort();
    const edgeIds = [...document.querySelectorAll(".react-flow__edge")]
      .map((edge) => edge.getAttribute("data-id") ?? edge.id)
      .filter(Boolean)
      .sort();
    const portals = [
      ...document.querySelectorAll(
        '[data-testid="knowledge-focus-portals"] button[data-source]',
      ),
    ]
      .map((button) => {
        const text = button.textContent?.replace(/\s+/g, " ").trim() ?? "";
        const direction = text.includes("direction: backward")
          ? "backward"
          : text.includes("direction: bidirectional")
            ? "bidirectional"
            : "forward";
        return {
          source: button.getAttribute("data-source"),
          target: button.getAttribute("data-target"),
          presentation_relation: button.getAttribute(
            "data-presentation-relation",
          ),
          source_relation: button.getAttribute("data-source-relation"),
          authority_effect: button.getAttribute("data-authority-effect"),
          direction,
          text,
        };
      })
      .sort((left, right) =>
        [
          left.source,
          left.presentation_relation,
          left.source_relation,
          left.target,
          left.direction,
        ]
          .join("|")
          .localeCompare(
            [
              right.source,
              right.presentation_relation,
              right.source_relation,
              right.target,
              right.direction,
            ].join("|"),
          ),
      );
    const breadcrumb =
      document.querySelector('[aria-label="Focus breadcrumb"]')?.textContent
        ?.replace(/\s+/g, " ")
        .trim() ?? null;
    const back =
      [...document.querySelectorAll("button")]
        .map((button) => button.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .find((text) => text.startsWith("← Back to ")) ?? null;
    return {
      node_ids: nodeIds,
      edge_ids: edgeIds,
      portals,
      breadcrumb,
      back,
    };
  });
}

function portalKeys(portals) {
  return portals
    .map((portal) =>
      [
        portal.source,
        portal.presentation_relation,
        portal.source_relation,
        portal.target,
        portal.direction,
      ].join("|"),
    )
    .sort();
}

function interactionState(scene) {
  return {
    node_ids: scene.node_ids,
    edge_ids: scene.edge_ids,
    portal_keys: portalKeys(scene.portals),
    breadcrumb: scene.breadcrumb,
    back: scene.back,
  };
}

async function waitForTourScene(page) {
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".react-flow__node").length === 4 &&
      document.querySelectorAll(".react-flow__edge").length === 0 &&
      document.querySelectorAll(
        '[data-testid="knowledge-focus-portals"] button[data-source]',
      ).length === 6,
    undefined,
    { timeout: 15_000 },
  );
}

async function waitForPivot(page) {
  await page
    .getByRole("button", { name: /Back to Identity and Consent/ })
    .waitFor({ timeout: 15_000 });
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Focus breadcrumb"]') !== null,
    undefined,
    { timeout: 15_000 },
  );
}

async function goBack(page) {
  await page
    .getByRole("button", { name: /Back to Identity and Consent/ })
    .click();
  await page.waitForFunction(
    () => document.querySelector('[aria-label="Focus breadcrumb"]') === null,
    undefined,
    { timeout: 15_000 },
  );
  await page.waitForFunction(
    (nodeId) =>
      document.querySelector(`.react-flow__node[data-id="${nodeId}"]`) !== null,
    identityConsentNodeId,
    { timeout: 15_000 },
  );
  return await renderedScene(page);
}

async function restartTourScene(page) {
  await page.getByRole("button", { name: "Start Tour" }).click();
  await waitForTourScene(page);
}

export async function validateBodyWarFocusAb(
  rawOutput,
  {
    buildHandle =
      process.env.OEW_BODY_WAR_BUILD_HANDLE ?? defaultBuildHandle,
  } = {},
) {
  const output = validateOutput(rawOutput);
  const temporary = await mkdtemp(join(tmpdir(), "oew-body-war-focus-ab-"));
  const temporaryScreenshots = {
    baseline: join(temporary, "baseline.png"),
    focus_scene: join(temporary, "focus-scene.png"),
    portal_pivot: join(temporary, "portal-pivot.png"),
  };
  const playwright = await resolvePlaywright();
  const gateway = await startOewPrototypeGateway({
    buildHandle,
    adapterRun,
    implementationRoot,
  });
  const requests = [];
  const failedResponses = [];
  const consoleErrors = [];
  const pageErrors = [];
  const assertions = [];
  let browser;
  let context;
  let page;
  let browserClosed = false;
  let contextClosed = false;
  let pageClosed = false;
  let gatewayClosed = false;
  let baselineScene;
  let focusScene;
  let pointerState;
  let enterState;
  let spaceState;
  let restoredSourceState;
  let literalEvidence;
  try {
    assert.equal(playwright.packageVersion, "1.59.1");
    assert.equal(
      playwright.executable.sha256,
      "696170a79640ec5b50c7518140ace06c69a49cfb295bf527d4a85e26a12b89a7",
    );
    browser = await playwright.api.chromium.launch({
      executablePath: playwright.executablePath,
      headless: true,
    });
    context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: "block",
    });
    page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(redact(message.text(), gateway.token));
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(redact(error.message, gateway.token));
    });
    page.on("request", (request) => {
      const url = new URL(request.url());
      requests.push({
        method: request.method(),
        origin: url.origin,
        pathname: url.pathname,
      });
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedResponses.push({
          status: response.status(),
          url: redact(response.url(), gateway.token),
        });
      }
    });

    const launchUrl = `${gateway.baseUrl}/?token=${gateway.token}`;
    const bootstrap = await page.goto(launchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    assert.equal(bootstrap?.status(), 200);
    await page
      .getByText("Body War Business Ontology", { exact: true })
      .first()
      .waitFor({ timeout: 15_000 });
    const dismiss = page.getByRole("button", {
      name: /DON.T SHOW AGAIN/i,
    });
    if (await dismiss.count()) await dismiss.click();

    const graph = await page.evaluate(
      async ({ token }) =>
        await (
          await fetch(`/knowledge-graph.json?token=${encodeURIComponent(token)}`)
        ).json(),
      { token: gateway.token },
    );
    assert.equal(graph.project.name, "Body War Business Ontology");
    assert.equal(graph.nodes.length, 237);
    assert.equal(graph.edges.length, 231);
    assert.equal(graph.layers.length, 17);
    assert.equal(graph.tour.length, 5);
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".react-flow__node").length === 237 &&
        document.querySelectorAll(".react-flow__edge").length === 231,
      undefined,
      { timeout: 15_000 },
    );
    const startTour = page.getByRole("button", { name: "Start Tour" });
    await startTour.waitFor({ timeout: 10_000 });
    assert.equal(await startTour.isVisible(), true);
    baselineScene = await renderedScene(page);
    assert.equal(baselineScene.node_ids.length, 237);
    assert.equal(baselineScene.edge_ids.length, 231);
    await page.screenshot({
      path: temporaryScreenshots.baseline,
      fullPage: true,
    });
    assertions.push({
      id: "AB01-baseline",
      result: "pass",
      evidence:
        "Before Start Tour: 237 rendered nodes, 231 rendered edges, Start Tour visible, baseline.png captured",
    });

    await startTour.click();
    await waitForTourScene(page);
    focusScene = await renderedScene(page);
    assert.deepEqual(focusScene.node_ids, expectedTourNodeIds);
    assert.equal(focusScene.edge_ids.length, 0);
    assert.deepEqual(portalKeys(focusScene.portals), expectedPortalKeys);
    assert.equal(
      await page.getByText("SuggestedTrack", { exact: true }).count(),
      0,
    );
    await page.screenshot({
      path: temporaryScreenshots.focus_scene,
      fullPage: true,
    });
    assertions.push({
      id: "AB02-focus-scene",
      result: "pass",
      evidence:
        "After Start Tour: exact four node IDs, zero internal edges, six sorted portals, SuggestedTrack absent, focus-scene.png captured",
    });

    const literalPortal = page.locator(literalPortalSelector);
    await literalPortal.waitFor({ timeout: 15_000 });
    const literal = focusScene.portals.find(
      (portal) =>
        portal.source ===
          "presentation:body-war.business.context.identity-consent" &&
        portal.target ===
          "presentation:body-war.business.capability.auth-consent",
    );
    assert.ok(literal);
    assert.equal(literal.presentation_relation, "related");
    assert.equal(literal.source_relation, "owns");
    assert.equal(literal.authority_effect, "none");
    assert.equal(literal.direction, "forward");
    assert.match(
      literal.text,
      /Identity and Consent —related → Authentication and Consent/,
    );
    assert.match(literal.text, /evidence:/);
    const sidecar = await page.evaluate(
      async ({ token }) =>
        await (
          await fetch(
            `/oew-data/evidence-sidecar.json?token=${encodeURIComponent(token)}`,
          )
        ).json(),
      { token: gateway.token },
    );
    literalEvidence = Object.values(sidecar.edges).find(
      (edge) =>
        edge.source === "body-war.business.context.identity-consent" &&
        edge.target === "body-war.business.capability.auth-consent" &&
        edge.source_relation === "owns" &&
        edge.presentation_relation === "related",
    );
    assert.ok(literalEvidence);
    assert.equal(literalEvidence.authority_effect, "none");
    assert.ok(literalEvidence.evidence_refs.length > 0);
    assertions.push({
      id: "AB03-literal-evidence",
      result: "pass",
      evidence:
        "Literal portal preserves related presentation, owns source relation, forward direction, evidence refs, and authority none",
    });

    await literalPortal.click();
    await waitForPivot(page);
    const pointerScene = await renderedScene(page);
    pointerState = interactionState(pointerScene);
    await page.screenshot({
      path: temporaryScreenshots.portal_pivot,
      fullPage: true,
    });
    restoredSourceState = interactionState(await goBack(page));
    assert.equal(restoredSourceState.breadcrumb, null);
    assert.equal(restoredSourceState.back, null);
    assert.ok(restoredSourceState.node_ids.includes(identityConsentNodeId));
    assertions.push({
      id: "AB04-pointer-back",
      result: "pass",
      evidence:
        "Pointer pivot exposes Back, portal-pivot.png captured, Back restores the source focus",
    });

    await restartTourScene(page);
    const enterPortal = page.locator(literalPortalSelector);
    await enterPortal.focus();
    await enterPortal.press("Enter");
    await waitForPivot(page);
    enterState = interactionState(await renderedScene(page));
    assert.deepEqual(enterState, pointerState);
    assert.deepEqual(interactionState(await goBack(page)), restoredSourceState);

    await restartTourScene(page);
    const spacePortal = page.locator(literalPortalSelector);
    await spacePortal.focus();
    await spacePortal.press("Space");
    await waitForPivot(page);
    spaceState = interactionState(await renderedScene(page));
    assert.deepEqual(spaceState, pointerState);
    assert.deepEqual(interactionState(await goBack(page)), restoredSourceState);
    assertions.push({
      id: "AB05-input-equivalence",
      result: "pass",
      evidence:
        "Pointer, Enter, and Space produce byte-equivalent observable target state; Back restores the same source state after each",
    });

    const origins = [...new Set(requests.map(({ origin }) => origin))];
    const outboundRequests = requests.filter(
      ({ origin }) => origin !== gateway.baseUrl,
    );
    assert.deepEqual(origins, [gateway.baseUrl]);
    assert.deepEqual(outboundRequests, []);
    assert.deepEqual(failedResponses, []);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(pageErrors, []);
    assertions.push({
      id: "AB06-browser-isolation",
      result: "pass",
      evidence:
        "One loopback origin, zero outbound requests, failed responses, console errors, or page errors",
    });
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  } finally {
    if (page && !page.isClosed()) await page.close();
    pageClosed = true;
    if (context) await context.close();
    contextClosed = true;
    if (browser) await browser.close();
    browserClosed = true;
    await gateway.stop();
    gatewayClosed = true;
  }

  const released = await portReleased(gateway.baseUrl);
  assert.equal(released, true);
  assertions.push({
    id: "AB07-cleanup",
    result: "pass",
    evidence: "Page, context, browser, and gateway closed; port released",
  });

  await mkdir(dirname(output.outputRoot), { recursive: true });
  await mkdir(output.outputRoot, { recursive: false, mode: 0o700 });
  for (const [name, source] of Object.entries(temporaryScreenshots)) {
    const filename =
      name === "focus_scene"
        ? "focus-scene.png"
        : name === "portal_pivot"
          ? "portal-pivot.png"
          : "baseline.png";
    await copyFile(source, join(output.outputRoot, filename));
  }
  const screenshots = {
    baseline: await artifact(
      join(output.outputRoot, "baseline.png"),
      `generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/${output.attemptId}/baseline.png`,
    ),
    focus_scene: await artifact(
      join(output.outputRoot, "focus-scene.png"),
      `generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/${output.attemptId}/focus-scene.png`,
    ),
    portal_pivot: await artifact(
      join(output.outputRoot, "portal-pivot.png"),
      `generated/runs/BODY-WAR-ONTOLOGY-FOCUS-AB-001/${output.attemptId}/portal-pivot.png`,
    ),
  };
  const result = {
    schema_version: "oew.body-war-focus-ab.v1",
    attempt_id: output.attemptId,
    result: "pass",
    project: "Body War Business Ontology",
    source: {
      adapter_run: adapterRun,
      adapter_receipt_sha256:
        gateway.adapter.artifacts["adapter-receipt.json"].sha256,
      build_handle: await artifact(
        join(implementationRoot, buildHandle),
        buildHandle,
      ),
      build_tree_sha256: gateway.build.identity.tree_sha256,
    },
    conditions: {
      baseline: {
        node_count: baselineScene.node_ids.length,
        edge_count: baselineScene.edge_ids.length,
        start_tour_visible: true,
      },
      focus_scene: {
        node_ids: focusScene.node_ids,
        internal_edge_count: focusScene.edge_ids.length,
        portal_keys: portalKeys(focusScene.portals),
        suggested_track_present: false,
      },
    },
    literal_portal: {
      source:
        "presentation:body-war.business.context.identity-consent",
      target:
        "presentation:body-war.business.capability.auth-consent",
      presentation_relation: "related",
      source_relation: "owns",
      direction: "forward",
      authority_effect: "none",
      evidence_refs: literalEvidence.evidence_refs,
    },
    interaction_equivalence: {
      pointer: pointerState,
      enter: enterState,
      space: spaceState,
      pointer_enter_space_equal: true,
      back_restored_source_state: restoredSourceState,
    },
    browser: {
      package: "playwright",
      version: playwright.packageVersion,
      chromium_executable: playwright.executable,
      viewport: { width: 1440, height: 1000 },
      headless: true,
      fresh_context: true,
      service_workers: "blocked",
    },
    observations: {
      request_count: requests.length,
      request_origins: [...new Set(requests.map(({ origin }) => origin))].map(
        (origin) => (origin === gateway.baseUrl ? "loopback-gateway" : origin),
      ),
      outbound_requests: requests.filter(
        ({ origin }) => origin !== gateway.baseUrl,
      ).length,
      failed_responses: failedResponses.length,
      console_errors: consoleErrors.length,
      page_errors: pageErrors.length,
    },
    teardown: {
      page_closed: pageClosed,
      context_closed: contextClosed,
      browser_closed: browserClosed,
      gateway_closed: gatewayClosed,
      port_released: released,
    },
    assertions,
    artifacts: screenshots,
    human_test: {
      status: "pending",
      participant_target: 3,
      correct_answer_gate: "at least 7 of 9",
      median_speed_gate: "focus at least 30 percent faster than baseline",
      discoverability_gate: "3 of 3 find focus within 10 seconds",
    },
    claim_ceiling:
      "One repeatable local automated A/B browser evidence run over the accepted Body War focus preview; no improved-human-comprehension, accessibility, ontology promotion, source-backed geometry, score authority, release, deployment, or production claim.",
    authority_effect: "none",
  };
  await writeFile(output.output, canonicalBytes(result), {
    flag: "wx",
    mode: 0o600,
  });
  await rm(temporary, { recursive: true, force: true });
  return result;
}

async function main() {
  const output = process.argv[2];
  const result = await validateBodyWarFocusAb(output);
  process.stdout.write(
    `${JSON.stringify({
      result: result.result,
      attempt_id: result.attempt_id,
      baseline: result.conditions.baseline,
      focus_scene: {
        node_count: result.conditions.focus_scene.node_ids.length,
        edge_count: result.conditions.focus_scene.internal_edge_count,
        portal_count: result.conditions.focus_scene.portal_keys.length,
      },
      input_equivalence:
        result.interaction_equivalence.pointer_enter_space_equal,
      human_test: result.human_test.status,
      authority_effect: result.authority_effect,
    })}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
