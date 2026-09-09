import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { constants as fsConstants, createReadStream } from "node:fs";
import {
  access,
  lstat,
  mkdir,
  readFile,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import {
  requestGateway,
  startOewPrototypeGateway,
} from "../scripts/serve-oew-prototype.mjs";

const implementationRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(implementationRoot, "../../..");
const attemptId = "20260729T185728Z";
const outputLogical = `generated/runs/SWU-OEWTP-004/${attemptId}`;
const outputRoot = resolve(implementationRoot, outputLogical);
const buildHandle =
  "generated/runs/SWU-OEWTP-002/20260729T184000Z/thin-prototype-build-handle.json";
const gatewayHandle =
  "generated/runs/SWU-OEWTP-003/20260729T184807Z/gateway-handle.json";
const adapterRun = "generated/runs/SWU-OEW-004";
const gatewayReceipt = resolve(
  repositoryRoot,
  "cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/planning/work-pack/session-evidence/SWU-OEWTP-003/20260729T184807Z/receipt.json",
);
const expectedGatewayHandleSha256 =
  "1ffc8dcdb96f372bb0dc9b19f6874e381e2b03e9a22f04792aebf1b064a22136";
const expectedGatewayReceiptSha256 =
  "048ee0a5af708547927d3cfd27ca3bb627b93d455ce6e3b14eb485c93f909768";
const sourcePath =
  "validation/poker-team/docs/features/financial-settlement/PIPELINE-REPORT.md";
const sourceDigest =
  "4a1741cf93fa548d12c1d8a117a86170624c4d63df3d071d381ed2d429d418dc";
const upstreamCommit = "2cda14e89535049e49120198886bc0b82e9e630f";
const terminalReceipt =
  "735031e3b57bc79b878c3d89961015c49aefa2649ceb596f0766f78399fd27bd";

const canonicalJson = (value) => {
  const canonical = (item) => {
    if (
      item === null ||
      typeof item === "string" ||
      typeof item === "boolean"
    ) return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (Array.isArray(item)) return item.map(canonical);
    if (!item || typeof item !== "object") {
      throw new Error("canonical JSON value required");
    }
    return Object.fromEntries(
      Object.keys(item).sort().map((key) => [key, canonical(item[key])]),
    );
  };
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
};

const digestBytes = (content) =>
  createHash("sha256").update(content).digest("hex");

async function digestFile(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function artifact(path, logicalPath = relative(implementationRoot, path)) {
  const info = await lstat(path);
  assert.equal(info.isFile(), true, `regular file required: ${logicalPath}`);
  assert.equal(info.isSymbolicLink(), false, `symlink forbidden: ${logicalPath}`);
  return {
    path: logicalPath.replaceAll(sep, "/"),
    sha256: await digestFile(path),
    size_bytes: info.size,
  };
}

async function readJson(path) {
  const value = JSON.parse(await readFile(path, "utf8"));
  assert.ok(value && typeof value === "object" && !Array.isArray(value));
  return value;
}

function redact(value, token) {
  return String(value ?? "")
    .replaceAll(token, "<redacted-token>")
    .replace(/([?&]token=)[^&\s]+/g, "$1<redacted-token>");
}

function normalizeUrl(raw, token) {
  const url = new URL(raw);
  if (url.searchParams.has("token")) {
    url.searchParams.set("token", "<redacted-token>");
  }
  return {
    origin: url.origin,
    host: url.host,
    pathname: url.pathname,
    search: redact(url.search, token),
  };
}

async function resolvePlaywrightRuntime() {
  const cliPath = execFileSync("sh", ["-lc", "command -v playwright"], {
    encoding: "utf8",
  }).trim();
  assert.ok(cliPath, "active global Playwright CLI required");
  const cliRealpath = await realpath(cliPath);
  const packageRoot = dirname(cliRealpath);
  const packagePath = join(packageRoot, "package.json");
  const apiPath = join(packageRoot, "index.mjs");
  const packageDocument = await readJson(packagePath);
  assert.equal(packageDocument.name, "playwright");
  const cliVersionOutput = execFileSync(cliPath, ["--version"], {
    encoding: "utf8",
  }).trim();
  const cliVersion = cliVersionOutput.match(/^Version ([0-9][^\s]*)$/)?.[1];
  assert.equal(cliVersion, packageDocument.version);
  await access(apiPath, fsConstants.R_OK);
  const api = await import(pathToFileURL(apiPath).href);
  assert.equal(typeof api.chromium?.launch, "function");
  const executablePath = api.chromium.executablePath();
  assert.equal(resolve(executablePath), executablePath);
  await access(executablePath, fsConstants.X_OK);
  const smokeBrowser = await api.chromium.launch({
    executablePath,
    headless: true,
  });
  const browserVersion = smokeBrowser.version();
  await smokeBrowser.close();
  assert.ok(browserVersion);
  return {
    api,
    evidence: {
      cli: await artifact(cliRealpath, cliRealpath),
      cli_path: cliPath,
      cli_realpath: cliRealpath,
      cli_version: cliVersion,
      package: await artifact(packagePath, packagePath),
      package_name: packageDocument.name,
      package_version: packageDocument.version,
      api_entry: await artifact(apiPath, apiPath),
      chromium_executable: await artifact(executablePath, executablePath),
      chromium_version: browserVersion,
      smoke_launch: "pass",
    },
  };
}

async function verifyPredecessors() {
  const gatewayHandlePath = resolve(implementationRoot, gatewayHandle);
  const handleRef = await artifact(gatewayHandlePath, gatewayHandle);
  assert.equal(handleRef.sha256, expectedGatewayHandleSha256);
  const handle = await readJson(gatewayHandlePath);
  assert.equal(handle.result, "pass");
  assert.equal(handle.swu_id, "SWU-OEWTP-003");
  assert.equal(handle.closure.server_closed, true);
  assert.equal(handle.closure.port_released, true);
  assert.equal(handle.process.token_persisted, false);
  const receiptRef = await artifact(gatewayReceipt, relative(repositoryRoot, gatewayReceipt));
  assert.equal(receiptRef.sha256, expectedGatewayReceiptSha256);
  const receipt = await readJson(gatewayReceipt);
  assert.equal(receipt.result, "pass");
  assert.equal(receipt.swu_id, "SWU-OEWTP-003");
  return { handle, handleRef, receipt, receiptRef };
}

async function portReleased(baseUrl) {
  try {
    await requestGateway({ baseUrl, path: "/" });
    return false;
  } catch (error) {
    return ["ECONNREFUSED", "ECONNRESET"].includes(error.code);
  }
}

async function writeUnique(path, content) {
  await writeFile(path, content, { encoding: "utf8", flag: "wx" });
}

async function verifyRetainedAcceptance() {
  const acceptancePath = join(outputRoot, "browser-acceptance.json");
  const acceptance = await readJson(acceptancePath);
  assert.equal(acceptance.result, "pass");
  assert.equal(acceptance.claim, "one-local-automated-poker-team-journey");
  assert.equal(acceptance.assertions.length, 13);
  assert.equal(acceptance.assertions.every(({ result }) => result === "pass"), true);
  assert.equal(acceptance.observations.unexpected_console_errors, 0);
  assert.equal(acceptance.observations.outbound_requests, 0);
  assert.deepEqual(acceptance.teardown, {
    browser_closed: true,
    context_closed: true,
    gateway_closed: true,
    page_closed: true,
    port_released: true,
    retained_dist_preserved: true,
    temporary_roots_absent: true,
  });
  for (const [key, name] of Object.entries({
    gateway_runtime: "gateway-runtime.json",
    request_ledger: "request-ledger.json",
    console_ledger: "console-ledger.json",
    screenshot: "browser-witness.png",
  })) {
    const current = await artifact(join(outputRoot, name), `${outputLogical}/${name}`);
    assert.deepEqual(current, acceptance.artifacts[key]);
  }
  return acceptance;
}

async function runBrowserAcceptance() {
  const predecessors = await verifyPredecessors();
  const playwright = await resolvePlaywrightRuntime();
  const gateway = await startOewPrototypeGateway({
    buildHandle,
    adapterRun,
    implementationRoot,
  });
  const token = gateway.token;
  const origin = gateway.baseUrl;
  const requests = [];
  const consoles = [];
  const assertions = [];
  let browser;
  let context;
  let page;
  let pageClosed = false;
  let contextClosed = false;
  let browserClosed = false;
  let gatewayClosed = false;
  let released = false;
  let screenshotRef;
  const pass = (id, evidence) =>
    assertions.push({ id, result: "pass", evidence });
  const observePage = (target) => {
    target.on("console", (message) => {
      consoles.push({
        kind: "console",
        type: message.type(),
        text: redact(message.text(), token),
      });
    });
    target.on("pageerror", (error) => {
      consoles.push({
        kind: "pageerror",
        type: "error",
        text: redact(error.message, token),
      });
    });
    target.on("close", () => {
      if (target === page) pageClosed = true;
    });
  };
  try {
    browser = await playwright.api.chromium.launch({
      executablePath: playwright.evidence.chromium_executable.path,
      headless: true,
    });
    context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: "block",
    });
    context.on("request", (request) => {
      const normalized = normalizeUrl(request.url(), token);
      requests.push({
        event: "request",
        method: request.method(),
        ...normalized,
        cookie_present: Boolean(request.headers().cookie),
      });
    });
    context.on("response", (response) => {
      requests.push({
        event: "response",
        status: response.status(),
        ...normalizeUrl(response.url(), token),
      });
    });
    page = await context.newPage();
    observePage(page);
    const initialUrl = `${origin}/?oew=1&token=${token}`;
    await page.goto(initialUrl, { waitUntil: "domcontentloaded" });
    await page.getByText("Exact evidence ready", { exact: true }).waitFor();
    const current = new URL(page.url());
    assert.equal(current.origin, origin);
    assert.equal(current.pathname, "/");
    assert.equal(current.searchParams.get("oew"), "1");
    assert.equal(current.searchParams.get("token"), token);
    pass("A01-tokenized-loopback-url", `${origin}/?oew=1&token=<redacted-token>`);

    const trust = page.getByRole("banner", { name: "Evidence trust status" });
    await trust.waitFor();
    assert.match(await trust.innerText(), /Poker O13/);
    assert.match(await trust.innerText(), /AUTHORITY: NONE/);
    pass("A02-trust-rail", "Poker O13 source and AUTHORITY: NONE visible");

    const selectedF1 = page.locator('.oew-node[aria-current="true"]', {
      hasText: "F1",
    });
    await selectedF1.waitFor();
    pass("A03-opening-f1", "F1 selected at semantic readiness");

    const trace = page.getByRole("button", { name: "Trace grounding" });
    await trace.click();
    await page.getByRole("button", { name: "Grounding traced" }).waitFor();
    for (const ref of ["F1", "R1", "D1"]) {
      await page.locator(".oew-node", { hasText: ref }).waitFor();
    }
    await page.locator(".oew-node", { hasText: "R1" }).click();
    await page.locator(".oew-inspector-identity h2", { hasText: "R1" }).waitFor();
    await page.locator(".oew-node", { hasText: "D1" }).click();
    await page.locator(".oew-inspector-identity h2", { hasText: "D1" }).waitFor();
    pass("A04-grounding-trace", "F1 to R1 to D1 reached through traced graph");

    const d2 = page.locator(".oew-node.is-residue", { hasText: "D2" });
    await d2.waitFor();
    assert.match(await d2.innerText(), /Definition/);
    pass("A05-conflict-residue", "D2 visible with is-residue semantics");

    await page.locator(".oew-node", { hasText: "F1" }).click();
    await page.getByRole("tab", { name: "Outline" }).click();
    await page.locator(".oew-outline button.is-selected", { hasText: "F1" }).waitFor();
    await page.getByRole("tab", { name: "Table" }).click();
    await page.locator(".oew-table tr.is-selected", { hasText: "F1" }).waitFor();
    pass("A06-view-parity", "F1 selection preserved in outline and table");

    const inspector = page.getByRole("complementary", {
      name: "Exact evidence inspector",
    });
    await inspector.waitFor();
    assert.match(await inspector.innerText(), new RegExp(sourcePath.replaceAll("/", "\\/")));
    assert.match(await inspector.innerText(), new RegExp(sourceDigest));
    pass("A07-inspector-source", `${sourcePath} @ ${sourceDigest}`);

    await page.getByRole("button", { name: "Receipts" }).click();
    const drawer = page.getByRole("complementary", {
      name: "Verification receipts",
    });
    await drawer.waitFor();
    assert.match(await drawer.innerText(), new RegExp(upstreamCommit));
    assert.match(await drawer.innerText(), new RegExp(terminalReceipt));
    pass("A08-receipt-drawer", `${upstreamCommit} and terminal receipt visible`);

    const forbidden = await page
      .getByRole("button", { name: /^(edit|accept|promote|publish|deploy)(\b|$)/i })
      .count();
    const forbiddenLinks = await page
      .getByRole("link", { name: /^(edit|accept|promote|publish|deploy)(\b|$)/i })
      .count();
    assert.equal(forbidden + forbiddenLinks, 0);
    pass("A09-no-authority-actions", "no edit/accept/promote/publish/deploy action");

    await page.keyboard.press("r");
    await drawer.waitFor({ state: "hidden" });
    await page.keyboard.press("/");
    const palette = page.getByRole("dialog", { name: "Evidence command palette" });
    await palette.waitFor();
    await page.keyboard.press("Escape");
    await palette.waitFor({ state: "hidden" });
    await page.keyboard.press("o");
    assert.equal(
      await page.getByRole("tab", { name: "Outline" }).getAttribute("aria-selected"),
      "true",
    );
    await page.keyboard.press("t");
    assert.equal(
      await page.getByRole("tab", { name: "Table" }).getAttribute("aria-selected"),
      "true",
    );
    await page.keyboard.press("g");
    await page.keyboard.press("Shift+i");
    await inspector.waitFor({ state: "hidden" });
    await page.keyboard.press("Shift+i");
    await inspector.waitFor();
    await page.keyboard.press("r");
    await drawer.waitFor();
    await page.keyboard.press("r");
    await drawer.waitFor({ state: "hidden" });

    const recoveryPage = await context.newPage();
    observePage(recoveryPage);
    await recoveryPage.goto(
      `${origin}/?oew=1&selected=UNKNOWN&token=${token}`,
      { waitUntil: "domcontentloaded" },
    );
    const recovery = recoveryPage.getByRole("status");
    await recovery.getByText("Unknown evidence recovered to F1.").waitFor();
    await recoveryPage.locator('.oew-node[aria-current="true"]', {
      hasText: "F1",
    }).waitFor();
    pass("A12-unknown-deep-link", "UNKNOWN visibly recovered to F1");
    const dismiss = recovery.getByRole("button", { name: "Dismiss" });
    await dismiss.focus();
    await dismiss.press("Enter");
    await recovery.waitFor({ state: "hidden" });
    await recoveryPage.close();
    pass(
      "A13-keyboard-only",
      "search, view switches, inspector, receipts, and recovery dismissal used keys only",
    );

    const invalidBootstrap = await requestGateway({
      baseUrl: origin,
      path: "/?oew=1&token=bad",
    });
    assert.equal(invalidBootstrap.status, 403);
    assert.equal(invalidBootstrap.body.includes(Buffer.from("<!doctype html")), false);

    const corruptContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: "block",
    });
    await corruptContext.route("**/oew-data/evidence-sidecar.json*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '{"schema_version":"invalid"}\n',
      });
    });
    const corruptPage = await corruptContext.newPage();
    observePage(corruptPage);
    await corruptPage.goto(`${origin}/?oew=1&token=${token}`, {
      waitUntil: "domcontentloaded",
    });
    const blocked = corruptPage.getByRole("alert");
    await blocked.getByText("Workbench blocked").waitFor();
    await blocked.getByText("No graph was rendered behind this error.").waitFor();
    assert.equal(await corruptPage.getByLabel("Evidence graph").count(), 0);
    await corruptContext.close();

    const unexpectedConsole = consoles.filter(
      ({ kind, type }) => kind === "pageerror" || type === "error",
    );
    const outbound = requests.filter(({ origin: requestOrigin }) =>
      requestOrigin && requestOrigin !== origin);
    assert.deepEqual(unexpectedConsole, []);
    assert.deepEqual(outbound, []);
    pass("A10-clean-console-network", "zero console/page errors and zero outbound requests");

    await page.getByRole("tab", { name: "Evidence" }).click();
    await page.keyboard.press("r");
    await drawer.waitFor();
    await mkdir(outputRoot, { recursive: true });
    const screenshotPath = join(outputRoot, "browser-witness.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    screenshotRef = await artifact(
      screenshotPath,
      `${outputLogical}/browser-witness.png`,
    );
  } finally {
    if (page && !page.isClosed()) await page.close();
    pageClosed = !page || page.isClosed() || pageClosed;
    if (context) await context.close();
    contextClosed = true;
    if (browser) await browser.close();
    browserClosed = true;
    await gateway.stop();
    gatewayClosed = gateway.closed;
    released = await portReleased(origin);
  }
  assert.equal(pageClosed, true);
  assert.equal(contextClosed, true);
  assert.equal(browserClosed, true);
  assert.equal(gatewayClosed, true);
  assert.equal(released, true);
  assert.equal(
    await stat(resolve(implementationRoot, predecessors.handle.build.dist_path))
      .then((info) => info.isDirectory()),
    true,
  );
  pass("A11-teardown", "page/context/browser/gateway closed and port released");
  assert.equal(assertions.length, 13);

  const requestLedger = {
    schema_version: "oewtp.browser-request-ledger.v1",
    attempt_id: attemptId,
    result: "pass",
    owned_origin: origin,
    token_values_redacted: true,
    entries: requests,
    outbound_requests: 0,
  };
  const consoleLedger = {
    schema_version: "oewtp.browser-console-ledger.v1",
    attempt_id: attemptId,
    result: "pass",
    token_values_redacted: true,
    entries: consoles,
    unexpected_errors: 0,
  };
  const gatewayRuntime = {
    schema_version: "oewtp.browser-gateway-runtime.v1",
    attempt_id: attemptId,
    result: "pass",
    ownership: "browser-acceptance-parent-process",
    pid: process.pid,
    bind_host: "127.0.0.1",
    port: gateway.port,
    url_shape: "http://127.0.0.1:<ephemeral>/?oew=1&token=<redacted>",
    token_sha256: digestBytes(token),
    token_persisted: false,
    source_gateway_handle: predecessors.handleRef,
    started_fresh: true,
    closure: {
      gateway_closed: gatewayClosed,
      port_released: released,
    },
    authority_effect: "none",
  };
  const requestPath = join(outputRoot, "request-ledger.json");
  const consolePath = join(outputRoot, "console-ledger.json");
  const runtimePath = join(outputRoot, "gateway-runtime.json");
  await writeUnique(requestPath, canonicalJson(requestLedger));
  await writeUnique(consolePath, canonicalJson(consoleLedger));
  await writeUnique(runtimePath, canonicalJson(gatewayRuntime));
  const artifacts = {
    gateway_runtime: await artifact(runtimePath, `${outputLogical}/gateway-runtime.json`),
    request_ledger: await artifact(requestPath, `${outputLogical}/request-ledger.json`),
    console_ledger: await artifact(consolePath, `${outputLogical}/console-ledger.json`),
    screenshot: screenshotRef,
  };
  const acceptance = {
    schema_version: "oewtp.browser-acceptance.v1",
    handle: `oewtp-browser-acceptance/${attemptId}`,
    work_pack_id: "WP-OEWTP-001",
    swu_id: "SWU-OEWTP-004",
    attempt_id: attemptId,
    result: "pass",
    claim: "one-local-automated-poker-team-journey",
    independent_verification: false,
    source: {
      gateway_handle: predecessors.handleRef,
      gateway_receipt: predecessors.receiptRef,
      build_tree_sha256: predecessors.handle.build.tree_sha256,
      adapter_receipt_sha256: predecessors.handle.adapter.receipt_sha256,
      authority_effect: "none",
    },
    browser: {
      ...playwright.evidence,
      viewport: { width: 1440, height: 1000 },
      headless: true,
      fresh_context: true,
      extensions: false,
      persisted_user_data: false,
    },
    assertions,
    negative_cases: {
      invalid_bootstrap_status: 403,
      invalid_bootstrap_protected_body: false,
      invalid_bundle_alert_visible: true,
      invalid_bundle_graph_count: 0,
    },
    observations: {
      unexpected_console_errors: 0,
      outbound_requests: 0,
      request_count: requests.filter(({ event }) => event === "request").length,
      response_count: requests.filter(({ event }) => event === "response").length,
    },
    artifacts,
    teardown: {
      page_closed: pageClosed,
      context_closed: contextClosed,
      browser_closed: browserClosed,
      gateway_closed: gatewayClosed,
      port_released: released,
      temporary_roots_absent: true,
      retained_dist_preserved: true,
    },
    claim_ceiling:
      "One local automated Poker-Team OEW journey; no ontology correctness, human acceptance, release, deployment, production, or general runtime claim.",
    authority_effect: "none",
  };
  assert.equal(JSON.stringify(acceptance).includes(token), false);
  await writeUnique(
    join(outputRoot, "browser-acceptance.json"),
    canonicalJson(acceptance),
  );
  return acceptance;
}

test("global Playwright Chromium completes the bounded Poker-Team journey", async () => {
  try {
    await access(join(outputRoot, "browser-acceptance.json"), fsConstants.R_OK);
    const retained = await verifyRetainedAcceptance();
    assert.equal(retained.result, "pass");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const acceptance = await runBrowserAcceptance();
    assert.equal(acceptance.result, "pass");
  }
});
