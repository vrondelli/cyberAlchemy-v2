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
  "generated/runs/SWU-OEWTP-002/20260729T190700Z/thin-prototype-build-handle.json";
const adapterRun = "generated/runs/BODY-WAR-ONTOLOGY-001";
const tokenPattern = /([?&]token=)[^&\s]+/g;

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
    parts[2] !== "BODY-WAR-ONTOLOGY-BROWSER-001" ||
    !/^[0-9]{8}T[0-9]{6}Z$/.test(parts[3]) ||
    parts[4] !== "browser-acceptance.json"
  ) {
    throw new Error("output path must be generated/runs/BODY-WAR-ONTOLOGY-BROWSER-001/<attempt>/browser-acceptance.json");
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

export async function validateBodyWarBrowser(
  rawOutput,
  {
    buildHandle =
      process.env.OEW_BODY_WAR_BUILD_HANDLE ?? defaultBuildHandle,
  } = {},
) {
  const output = validateOutput(rawOutput);
  const temporary = await mkdtemp(join(tmpdir(), "oew-body-war-browser-"));
  const temporaryScreenshot = join(temporary, "browser-witness.png");
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
  try {
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
    assertions.push({
      id: "BW01-project-loaded",
      result: "pass",
      evidence: "Body War Business Ontology visible",
    });

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
    assertions.push({
      id: "BW02-complete-graph",
      result: "pass",
      evidence: "237 nodes, 231 relations, 17 layers, 5 tour steps",
    });

    const search = page.getByPlaceholder(
      "Search nodes by name, summary, or tags...",
    );
    await search.fill("SuggestedTrack");
    const suggestedTrack = page.getByText("SuggestedTrack", { exact: true }).first();
    await suggestedTrack.waitFor();
    await suggestedTrack.click();
    const selectedBody = await page.locator("body").innerText();
    assert.match(
      selectedBody,
      /A runner-visible proposed route awaiting evidence and separate source-backed promotion\./,
    );
    assert.match(
      selectedBody,
      /projects\/body-war\/ontology\/business\/nodes\/entity\.suggested-track\.json/,
    );
    assertions.push({
      id: "BW03-suggested-track-source",
      result: "pass",
      evidence: "SuggestedTrack definition and exact ontology source path visible",
    });

    await search.fill("");
    await page.getByRole("button", { name: "Start Tour" }).click();
    assert.match(await page.locator("body").innerText(), /Business capability map/);
    assertions.push({
      id: "BW04-business-tour",
      result: "pass",
      evidence: "Body War business capability tour started",
    });

    const portals = page.getByTestId("knowledge-focus-portals");
    await portals.waitFor({ timeout: 15_000 });
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
    assert.equal(
      await page.getByText("SuggestedTrack", { exact: true }).count(),
      0,
    );
    assertions.push({
      id: "BW05-exact-focus-scene",
      result: "pass",
      evidence: "4 scene nodes, 0 internal edges, 6 boundary portals; SuggestedTrack absent",
    });

    const literalPortal = portals.locator(
      'button[data-source="presentation:body-war.business.context.identity-consent"][data-target="presentation:body-war.business.capability.auth-consent"]',
    );
    await literalPortal.waitFor();
    await page.waitForFunction(
      () => {
        const portal = document.querySelector(
          '[data-testid="knowledge-focus-portals"] button[data-source="presentation:body-war.business.context.identity-consent"][data-target="presentation:body-war.business.capability.auth-consent"]',
        );
        return (
          portal?.getAttribute("data-source-relation") === "owns" &&
          portal?.getAttribute("data-authority-effect") === "none"
        );
      },
      undefined,
      { timeout: 15_000 },
    );
    assert.match(
      await literalPortal.innerText(),
      /Identity and Consent —related → Authentication and Consent/,
    );
    assertions.push({
      id: "BW06-literal-portal-evidence",
      result: "pass",
      evidence: "related portal retains source relation owns and authority none",
    });

    await literalPortal.click();
    await page
      .getByRole("button", { name: /Back to Identity and Consent/ })
      .waitFor({ timeout: 15_000 });
    assert.match(await portals.innerText(), /Focus scene/i);
    await page
      .getByRole("button", { name: /Back to Identity and Consent/ })
      .click();
    await page.waitForFunction(
      () =>
        !document.querySelector(
          '[aria-label="Focus breadcrumb"]',
        ),
      undefined,
      { timeout: 15_000 },
    );
    assertions.push({
      id: "BW07-portal-pivot-back",
      result: "pass",
      evidence: "pointer pivot exposes a local Back path and Back restores the source focus",
    });

    const origins = [...new Set(requests.map(({ origin }) => origin))];
    assert.deepEqual(origins, [gateway.baseUrl]);
    assert.deepEqual(failedResponses, []);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(pageErrors, []);
    assertions.push({
      id: "BW08-loopback-clean",
      result: "pass",
      evidence: "one loopback origin, zero failed responses, zero console/page errors",
    });
    await page.screenshot({
      path: temporaryScreenshot,
      fullPage: true,
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
  const screenshot = await artifact(
    temporaryScreenshot,
    `generated/runs/BODY-WAR-ONTOLOGY-BROWSER-001/${output.attemptId}/browser-witness.png`,
  );
  const receipt = {
    schema_version: "oew.body-war-browser-acceptance.v1",
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
    observations: {
      nodes: 237,
      relations: 231,
      layers: 17,
      tour_steps: 5,
      focus_scene_nodes: 4,
      focus_scene_internal_edges: 0,
      focus_scene_portals: 6,
      request_count: requests.length,
      outbound_requests: 0,
      failed_responses: 0,
      console_errors: 0,
      page_errors: 0,
    },
    assertions,
    browser: {
      package: "playwright",
      version: playwright.packageVersion,
      chromium_executable: playwright.executable,
      viewport: { width: 1440, height: 1000 },
      headless: true,
      fresh_context: true,
    },
    runtime: {
      bind_host: "127.0.0.1",
      url_shape: "http://127.0.0.1:<ephemeral>/?token=<redacted>",
      token_persisted: false,
    },
    teardown: {
      page_closed: pageClosed,
      context_closed: contextClosed,
      browser_closed: browserClosed,
      gateway_closed: gatewayClosed,
      port_released: released,
    },
    artifacts: {
      screenshot,
    },
    claim_ceiling:
      "One local Body War business ontology visualization over the candidate-local source package; no system implementation, ontology promotion, source-backed geometry, score authority, release, deployment, production, or human acceptance claim.",
    authority_effect: "none",
  };
  await mkdir(dirname(output.outputRoot), { recursive: true });
  await mkdir(output.outputRoot, { recursive: false, mode: 0o700 });
  await copyFile(
    temporaryScreenshot,
    join(output.outputRoot, "browser-witness.png"),
  );
  await writeFile(output.output, canonicalBytes(receipt), {
    flag: "wx",
    mode: 0o600,
  });
  await rm(temporary, { recursive: true, force: true });
  return receipt;
}

async function main() {
  const output = process.argv[2];
  const receipt = await validateBodyWarBrowser(output);
  process.stdout.write(
    `${JSON.stringify({
      result: receipt.result,
      attempt_id: receipt.attempt_id,
      nodes: receipt.observations.nodes,
      relations: receipt.observations.relations,
      authority_effect: receipt.authority_effect,
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
