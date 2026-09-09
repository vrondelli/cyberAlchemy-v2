import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {readFile, stat, writeFile} from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import {createRequire} from "node:module";

const root = "/home/vrondelli/projects/domainspec-core";
const attempt = "20260804T035543Z";
const relationId = "body-war.relation.attach-candidate-consumes-track";
const sourceId =
  "body-war.business.operation.attach-activity-evidence-candidate";
const targetId = "body-war.business.entity.suggested-track";
const evidenceRoot = `${root}/cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-023/${attempt}/browser-evidence`;
const fixtureRoot = `${root}/cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-005/20260803T154613Z/browser-evidence/fixture`;
const distRoot = `${root}/cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWSN-023/${attempt}/dashboard-dist`;
const handlePath = `${root}/cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWSN-023/${attempt}/semantic-navigation-build-handle.json`;
const chromiumExecutable =
  "/home/vrondelli/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome";
const playwrightPackage =
  "/home/vrondelli/.nvm/versions/node/v22.12.0/lib/node_modules/playwright";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assert = (condition, issue) => {
  if (!condition) throw new Error(issue);
};
const fileRef = async (target) => {
  const bytes = await readFile(target);
  return {
    path: path.relative(root, target),
    sha256: digest(bytes),
    size_bytes: bytes.length,
  };
};
const writeJson = async (target, value) =>
  writeFile(target, `${JSON.stringify(value, null, 2)}\n`, {flag: "wx"});

const mime = new Map([
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".css", "text/css"],
  [".json", "application/json"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
]);
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    const fixtureRequest = url.pathname.startsWith("/oew-data/");
    const localPath = fixtureRequest
      ? url.pathname.slice("/oew-data/".length)
      : url.pathname === "/"
        ? "index.html"
        : url.pathname.slice(1);
    const base = fixtureRequest ? fixtureRoot : distRoot;
    const target = path.resolve(base, localPath);
    assert(
      target === base || target.startsWith(`${base}${path.sep}`),
      "SERVER_PATH_ESCAPE",
    );
    const targetStat = await stat(target);
    assert(targetStat.isFile(), "SERVER_TARGET_NOT_FILE");
    response.writeHead(200, {
      "content-type": mime.get(path.extname(target)) ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, {"content-type": "text/plain"});
    response.end("not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
const targetUrl = `${baseUrl}/?oew=1&run=body-war.business-ontology&selected=${encodeURIComponent(relationId)}&surface=graph`;

const require = createRequire(import.meta.url);
const {chromium} = require(playwrightPackage);
const browser = await chromium.launch({
  headless: true,
  executablePath: chromiumExecutable,
});
let result;
try {
  const context = await browser.newContext({
    viewport: {width: 1440, height: 1000},
    colorScheme: "dark",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requests = [];
  const blockedExternalRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => requests.push(request.url()));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== baseUrl) {
      blockedExternalRequests.push(url.toString());
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });

  await page.goto(targetUrl, {waitUntil: "networkidle"});
  const edge = page.locator('.oew-edge[aria-current="true"]');
  const inspector = page.locator(
    'aside[aria-label="Exact evidence inspector"]',
  );
  const closeInspector = page.getByRole("button", {name: "Close inspector"});
  const heading = page.locator("[data-oew-scene-heading]");
  const inert = page.locator(".oew-constellation");
  await edge.waitFor({state: "visible", timeout: 15000});
  assert((await page.locator("[role=alert]").count()) === 0, "FAIL_CLOSED");
  assert((await inert.getAttribute("aria-hidden")) === "true", "INERT_ARIA");
  assert((await inert.getAttribute("role")) === null, "INERT_ROLE");
  assert((await inert.evaluate((element) => element.tabIndex)) === -1, "INERT_TAB");

  if (await inspector.isVisible()) {
    await closeInspector.click();
    await inspector.waitFor({state: "hidden"});
  }

  await edge.focus();
  await edge.press("ArrowRight");
  assert(!(await inspector.isVisible()), "NON_ACTIVATION_OPENED_INSPECTOR");

  await edge.press("Enter");
  await inspector.waitFor({state: "visible"});
  assert(
    (await inspector.textContent()).includes(relationId),
    "ENTER_WRONG_RELATION",
  );
  await closeInspector.click();
  await page.waitForFunction(
    () => document.activeElement?.matches('.oew-edge[aria-current="true"]'),
  );
  const enterReturnedToRelation = await edge.evaluate(
    (element) => document.activeElement === element,
  );

  await edge.press("Space");
  await inspector.waitFor({state: "visible"});
  assert(
    (await inspector.textContent()).includes(relationId),
    "SPACE_WRONG_RELATION",
  );
  await closeInspector.click();
  await page.waitForFunction(
    () => document.activeElement?.matches('.oew-edge[aria-current="true"]'),
  );
  const spaceReturnedToRelation = await edge.evaluate(
    (element) => document.activeElement === element,
  );

  await edge.press("Enter");
  await inspector.waitFor({state: "visible"});
  await page.locator(".oew-node").first().click({force: true});
  await closeInspector.click();
  await page.waitForFunction(
    () => document.activeElement?.matches("[data-oew-scene-heading]"),
  );
  const returnedToHeading = await heading.evaluate(
    (element) => document.activeElement === element,
  );

  const screenshotPath = `${evidenceRoot}/keyboard-focus.png`;
  await page.screenshot({path: screenshotPath, fullPage: true});
  const materialConsoleErrors = consoleErrors.filter(
    (message) => !message.includes("ERR_BLOCKED_BY_CLIENT.Inspector"),
  );
  assert(materialConsoleErrors.length === 0, "MATERIAL_CONSOLE_ERROR");
  assert(pageErrors.length === 0, "PAGE_ERROR");
  assert(
    blockedExternalRequests.every((value) =>
      value.startsWith("https://fonts.googleapis.com/"),
    ),
    "UNEXPECTED_EXTERNAL_REQUEST",
  );
  assert(enterReturnedToRelation, "ENTER_FOCUS_NOT_RESTORED");
  assert(spaceReturnedToRelation, "SPACE_FOCUS_NOT_RESTORED");
  assert(returnedToHeading, "SCENE_HEADING_FALLBACK_FAILED");

  result = {
    schema_version: "oewsn.keyboard-browser-evidence.v1",
    result: "PASS",
    attempt_id: attempt,
    url: targetUrl,
    relation_id: relationId,
    exact_relation: {source: sourceId, predicate: "consumes", target: targetId},
    assertions: {
      inert_geometry_excluded: true,
      arrow_right_does_not_activate: true,
      enter_opens_exact_relation: true,
      enter_restores_selected_relation: enterReturnedToRelation,
      space_opens_exact_relation: true,
      space_restores_selected_relation: spaceReturnedToRelation,
      scene_heading_fallback: returnedToHeading,
      fail_closed_surface_absent: true,
    },
    console_errors: consoleErrors,
    page_errors: pageErrors,
    network: {
      policy: "loopback-only-with-pre-network-route-abort",
      requests: [...new Set(requests)].sort(),
      blocked_external_requests: [...new Set(blockedExternalRequests)].sort(),
      external_requests_completed: 0,
    },
    screenshot: await fileRef(screenshotPath),
    authority_effect: "none",
    claim_ceiling:
      "Candidate-local keyboard and focus browser witness only; no full-graph usability, ontology authority, promotion, publication, release, deployment, production or human-outcome claim.",
  };
  await writeJson(`${evidenceRoot}/browser-evidence-receipt.json`, result);
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const handle = JSON.parse(await readFile(handlePath, "utf8"));
const runtimeBytes = await readFile(chromiumExecutable);
await writeJson(`${evidenceRoot}/acceptance-receipt.json`, {
  schema_version: "oewsn.browser-acceptance-receipt.v1",
  result: "PASS",
  attempt_id: attempt,
  build: {
    handle: handle.handle,
    dashboard_tree_sha256: handle.dashboard_dist.tree_sha256,
    dashboard_file_count: handle.dashboard_dist.file_count,
    typed_files_passed: handle.typed_test_discovery.file_count,
    typed_tests_passed: handle.typed_test_discovery.passed,
  },
  runtime: {
    playwright_version: "1.59.1",
    chromium_revision: "1217",
    chromium_executable: path.relative(root, chromiumExecutable),
    chromium_sha256: digest(runtimeBytes),
  },
  keyboard_evidence: await fileRef(
    `${evidenceRoot}/browser-evidence-receipt.json`,
  ),
  screenshot: result.screenshot,
  authority_effect: "none",
  claim_ceiling: result.claim_ceiling,
});

process.stdout.write(
  `${JSON.stringify({result: "PASS", url: targetUrl, assertions: result.assertions})}\n`,
);
