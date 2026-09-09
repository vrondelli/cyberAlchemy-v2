import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {mkdir, readFile, stat, writeFile} from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import {createRequire} from "node:module";

const root = "/home/vrondelli/projects/domainspec-core";
const attempt = "20260803T154613Z";
const relationId = "body-war.relation.attach-candidate-consumes-track";
const sourceId = "body-war.business.operation.attach-activity-evidence-candidate";
const targetId = "body-war.business.entity.suggested-track";
const edgeId = `presentation-edge:${relationId}`;
const evidenceRoot = `${root}/cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-005/${attempt}/browser-evidence`;
const fixtureRoot = `${evidenceRoot}/fixture`;
const distRoot = `${root}/cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWSN-005/${attempt}/dashboard-dist`;
const handlePath = `${root}/cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWSN-005/${attempt}/semantic-navigation-build-handle.json`;
const sourceRoot = `${root}/cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/BODY-WAR-ONTOLOGY-001`;
const relationPath = `${root}/projects/body-war/ontology/business/relations/relations.json`;
const encodingPath = `${root}/cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/decisions/OD-04-SEMANTIC-FAMILIES-CANDIDATE.json`;
const chromiumExecutable = "/home/vrondelli/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome";
const playwrightPackage = "/home/vrondelli/.nvm/versions/node/v22.12.0/lib/node_modules/playwright";
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const jsonBytes = (value) => Buffer.from(JSON.stringify(value));
const writeJson = async (target, value) => writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
const fileRef = async (target) => {
  const bytes = await readFile(target);
  return {path: path.relative(root, target), sha256: digest(bytes), size_bytes: bytes.length};
};
const assert = (condition, issue) => { if (!condition) throw new Error(issue); };

await mkdir(fixtureRoot, {recursive: true});
const baseGraph = JSON.parse(await readFile(`${sourceRoot}/presentation-graph.json`, "utf8"));
const baseSidecar = JSON.parse(await readFile(`${sourceRoot}/evidence-sidecar.json`, "utf8"));
const baseReceipt = JSON.parse(await readFile(`${sourceRoot}/adapter-receipt.json`, "utf8"));
const sourceRelationsBytes = await readFile(relationPath);
const encodingBytes = await readFile(encodingPath);
const sourceRelationSet = JSON.parse(sourceRelationsBytes);
const relationEncoding = JSON.parse(encodingBytes);
const sourceRelation = sourceRelationSet.relations.find((relation) => relation.relation_id === relationId);
const sourceEdge = baseSidecar.edges[edgeId];
assert(sourceRelation && sourceEdge, "FIXTURE_RELATION_MISSING");
const presentationNodeIds = [`presentation:${sourceId}`, `presentation:${targetId}`];
const graph = {
  ...baseGraph,
  edges: baseGraph.edges.filter((edge) => edge.source === presentationNodeIds[0] && edge.target === presentationNodeIds[1] && edge.description === sourceRelation.predicate && edge.type === sourceEdge.presentation_relation),
  layers: baseGraph.layers.map((layer) => ({...layer, nodeIds: layer.nodeIds.filter((id) => presentationNodeIds.includes(id))})).filter((layer) => layer.nodeIds.length > 0),
  nodes: baseGraph.nodes.filter((node) => presentationNodeIds.includes(node.id)),
  tour: [],
};
assert(graph.edges.length === 1 && graph.nodes.length === 2, "FIXTURE_GRAPH_CARDINALITY");
const graphBytes = jsonBytes(graph);
const sourceRelations = {schema_version: sourceRelationSet.schema_version, relations: [sourceRelation]};
const sidecarBytes = jsonBytes({
  ...baseSidecar,
  counts: {...baseSidecar.counts, presentation_edges: 1, presentation_nodes: 2, sidecar_edges: 1, sidecar_nodes: 2, source_nodes: 2, source_relations: 1},
  edges: {[edgeId]: sourceEdge},
  grounding: {included_path: [], indeterminate_candidates: [], visible_excluded: []},
  nodes: Object.fromEntries(presentationNodeIds.map((id) => [id, baseSidecar.nodes[id]])),
  source_relations: sourceRelations,
  relation_encoding: relationEncoding,
});
const graphSha256 = digest(graphBytes);
const sidecarSha256 = digest(sidecarBytes);
const receipt = {
  ...baseReceipt,
  adapter: {...baseReceipt.adapter, version: "0.1.0-body-war-semantic-fixture"},
  artifacts: baseReceipt.artifacts.map((artifact) => {
    if (artifact.role === "presentation-graph") return {...artifact, sha256: graphSha256, size_bytes: graphBytes.length};
    if (artifact.role === "evidence-sidecar") return {...artifact, sha256: sidecarSha256, size_bytes: sidecarBytes.length};
    return artifact;
  }),
  determinism: {...baseReceipt.determinism, graph_sha256: graphSha256, sidecar_sha256: sidecarSha256},
  mapping_counts: {presentation_edges: 1, presentation_nodes: 2, sidecar_edges: 1, sidecar_nodes: 2, source_nodes: 2, source_relations: 1},
  evidence_ceiling: "Deterministic candidate-local browser fixture adding exact source relations and the owner-approved relation-encoding candidate bytes; no ontology authority, promotion, release, deployment, production, or human-outcome claim.",
  semantic_fixture: {
    schema_version: "oew.semantic-navigation-browser-fixture.v1",
    authority_effect: "none",
    source_relations_sha256: digest(sourceRelationsBytes),
    relation_encoding_sha256: digest(encodingBytes),
    source_relation_ids: [relationId],
  },
};
const receiptBytes = jsonBytes(receipt);
assert(graphSha256 === "8343daedea307e68a3df9a9df22cf8c8b7723e394fd53aa52ee1ae8bd7672838", "FIXTURE_GRAPH_IDENTITY_DRIFT");
assert(sidecarSha256 === "ffc1973e0557087249f115907ff3cb85ecbf5586772d6b3843b0f1028ea61667", "FIXTURE_SIDECAR_IDENTITY_DRIFT");
assert(digest(receiptBytes) === "07c9491aaec8c1a98a15aa75c46f3a1b28a9c96365e20d8cfb252722d80b9b95", "FIXTURE_RECEIPT_IDENTITY_DRIFT");
await writeFile(`${fixtureRoot}/presentation-graph.json`, graphBytes);
await writeFile(`${fixtureRoot}/evidence-sidecar.json`, sidecarBytes);
await writeFile(`${fixtureRoot}/adapter-receipt.json`, receiptBytes);

const mime = new Map([[".html", "text/html"], [".js", "text/javascript"], [".css", "text/css"], [".json", "application/json"], [".svg", "image/svg+xml"], [".ico", "image/x-icon"]]);
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    const fixtureRequest = url.pathname.startsWith("/oew-data/");
    const localPath = fixtureRequest ? url.pathname.slice("/oew-data/".length) : (url.pathname === "/" ? "index.html" : url.pathname.slice(1));
    const base = fixtureRequest ? fixtureRoot : distRoot;
    const target = path.resolve(base, localPath);
    assert(target === base || target.startsWith(`${base}${path.sep}`), "SERVER_PATH_ESCAPE");
    const targetStat = await stat(target);
    assert(targetStat.isFile(), "SERVER_TARGET_NOT_FILE");
    response.writeHead(200, {"content-type": mime.get(path.extname(target)) ?? "application/octet-stream", "cache-control": "no-store"});
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, {"content-type": "text/plain"});
    response.end("not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
const targetUrl = `${baseUrl}/?oew=1&run=body-war.business-ontology&selected=${encodeURIComponent(relationId)}&surface=graph&q=${encodeURIComponent(relationId)}`;

const require = createRequire(import.meta.url);
const {chromium} = require(playwrightPackage);
const browser = await chromium.launch({headless: true, executablePath: chromiumExecutable});
const modeResults = [];
try {
  for (const mode of ["default", "grayscale", "forced-colors"]) {
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}, colorScheme: "dark", forcedColors: mode === "forced-colors" ? "active" : "none"});
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const requests = [];
    const blockedExternalRequests = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
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
    await page.locator(".oew-edge.is-selected").waitFor({state: "visible", timeout: 15000});
    assert((await page.locator("[role=alert]").count()) === 0, `${mode}:FAIL_CLOSED_SURFACE_VISIBLE`);
    if (mode === "grayscale") await page.addStyleTag({content: "html { filter: grayscale(1) !important; }"});
    const edge = page.locator(".oew-edge.is-selected");
    const snapshot = await edge.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        ariaCurrent: element.getAttribute("aria-current"), ariaLabel: element.getAttribute("aria-label"),
        text: element.textContent.replace(/\s+/g, " ").trim(),
        colorToken: element.getAttribute("data-color-token"), patternToken: element.getAttribute("data-pattern-token"),
        schema: element.getAttribute("data-relation-schema"), borderColor: style.borderTopColor,
        borderStyle: style.borderTopStyle, borderWidth: style.borderTopWidth,
        backgroundColor: style.backgroundColor, outlineStyle: style.outlineStyle,
      };
    });
    assert(snapshot.ariaCurrent === "true", `${mode}:SELECTED_STATE_MISSING`);
    assert(snapshot.schema === "relation-presentation-record.v1", `${mode}:SCHEMA_MISSING`);
    assert(snapshot.colorToken === "edge.data.consumes", `${mode}:COLOR_TOKEN_MISSING`);
    assert(snapshot.patternToken === "edge.pattern.solid", `${mode}:PATTERN_TOKEN_MISSING`);
    for (const value of [sourceId, "consumes", targetId, "directed", "forward", "Selected relation"]) assert(snapshot.text.includes(value) || snapshot.ariaLabel.includes(value), `${mode}:EXACT_TEXT_MISSING:${value}`);
    const materialConsoleErrors = consoleErrors.filter((message) => !message.includes("ERR_BLOCKED_BY_CLIENT.Inspector"));
    assert(materialConsoleErrors.length === 0 && pageErrors.length === 0, `${mode}:BROWSER_ERROR:${JSON.stringify({consoleErrors, pageErrors, requests})}`);
    assert(blockedExternalRequests.every((value) => value.startsWith("https://fonts.googleapis.com/")), `${mode}:UNEXPECTED_EXTERNAL_REQUEST:${JSON.stringify(blockedExternalRequests)}`);
    const cdp = await context.newCDPSession(page);
    const accessibility = await cdp.send("Accessibility.getFullAXTree");
    const screenshotPath = `${evidenceRoot}/${mode}.png`;
    await page.screenshot({path: screenshotPath, fullPage: true});
    const modeResult = {
      mode, url: targetUrl, edge: snapshot,
      requests: [...new Set(requests)].sort(), blocked_external_requests: [...new Set(blockedExternalRequests)].sort(), console_errors: consoleErrors, page_errors: pageErrors,
      accessibility_name_matches: accessibility.nodes.some((node) => node.name?.value?.includes(sourceId) && node.name?.value?.includes("consumes") && node.name?.value?.includes(targetId)),
      screenshot: await fileRef(screenshotPath),
    };
    assert(modeResult.accessibility_name_matches, `${mode}:ACCESSIBLE_NAME_MISSING`);
    await writeJson(`${evidenceRoot}/${mode}.json`, modeResult);
    modeResults.push(modeResult);
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

const rgb = (value) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const luminance = (value) => rgb(value).map((channel) => channel / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
const defaultMode = modeResults.find((item) => item.mode === "default");
const contrastRatio = (Math.max(luminance(defaultMode.edge.borderColor), luminance(defaultMode.edge.backgroundColor)) + 0.05) / (Math.min(luminance(defaultMode.edge.borderColor), luminance(defaultMode.edge.backgroundColor)) + 0.05);
assert(contrastRatio >= 3, "NAMED_GRAPHIC_CONTRAST_BELOW_3_TO_1");
const handle = JSON.parse(await readFile(handlePath, "utf8"));
const runtimeBytes = await readFile(chromiumExecutable);
await writeJson(`${evidenceRoot}/contrast-ledger.json`, {schema_version: "oewsn.browser-contrast-ledger.v1", foreground: defaultMode.edge.borderColor, background: defaultMode.edge.backgroundColor, ratio: contrastRatio, minimum: 3, result: "PASS"});
await writeJson(`${evidenceRoot}/browser-evidence-receipt.json`, {
  schema_version: "oewsn.selected-relation-browser-evidence.v1", result: "PASS", attempt_id: attempt,
  relation: {id: relationId, source: sourceId, predicate: "consumes", target: targetId, source_direction: "directed", projected_direction: "forward", color_token: "edge.data.consumes", pattern_token: "edge.pattern.solid"},
  fixture: {graph: {sha256: graphSha256, size_bytes: graphBytes.length}, sidecar: {sha256: sidecarSha256, size_bytes: sidecarBytes.length}, receipt: {sha256: digest(receiptBytes), size_bytes: receiptBytes.length}},
  build: {handle: handle.handle, dashboard_tree_sha256: handle.dashboard_dist.tree_sha256, dashboard_file_count: handle.dashboard_dist.file_count, typed_tests_passed: handle.typed_test_discovery.passed},
  runtime: {playwright_version: "1.59.1", chromium_revision: "1217", chromium_executable: path.relative(root, chromiumExecutable), chromium_sha256: digest(runtimeBytes)},
  modes: modeResults.map((item) => ({mode: item.mode, screenshot: item.screenshot, accessible_name_matches: item.accessibility_name_matches, edge: item.edge})),
  contrast: {ratio: contrastRatio, minimum: 3, result: "PASS"},
  network: {policy: "loopback-only-with-pre-network-route-abort", external_requests_completed: 0, blocked_external_requests: [...new Set(modeResults.flatMap((item) => item.blocked_external_requests))].sort()}, authority_effect: "none",
  claim_ceiling: "Candidate-local selected-relation browser witness only; no full-graph usability, ontology authority, promotion, release, deployment, production, or human-outcome claim.",
});
process.stdout.write(`${JSON.stringify({result: "PASS", modes: modeResults.length, contrast_ratio: contrastRatio, url: targetUrl})}\n`);
