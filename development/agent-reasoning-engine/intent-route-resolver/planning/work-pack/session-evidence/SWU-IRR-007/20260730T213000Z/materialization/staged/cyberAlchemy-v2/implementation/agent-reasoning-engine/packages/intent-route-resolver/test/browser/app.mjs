import {canonicalJson} from "../../index.mjs";
import {executeWitnessCases} from "../fixtures/witness/evaluate.mjs";

const statusNode = document.querySelector("#status");
const caseCountNode = document.querySelector("#case-count");
const mainNode = document.querySelector("#main-node");
const workerNode = document.querySelector("#worker-node");
const casesNode = document.querySelector("#cases");

function workerResult(document) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./worker.mjs", import.meta.url), {type: "module"});
    worker.addEventListener("message", (event) => {
      worker.terminate();
      if (event.data.ok) resolve(event.data.result);
      else reject(new Error(event.data.error));
    }, {once: true});
    worker.addEventListener("error", reject, {once: true});
    worker.postMessage(document);
  });
}

function observedLabel(item) {
  return (
    item.observed.disposition_kind
    ?? item.observed.reason_code
    ?? item.observed.posture
    ?? "checked"
  );
}

function renderCases(result) {
  for (const item of result.cases) {
    const article = document.createElement("article");
    article.className = `case ${item.pass ? "pass" : "fail"}`;
    const title = document.createElement("h3");
    title.textContent = item.case_id;
    const detail = document.createElement("p");
    const kind = document.createElement("span");
    kind.className = "kind";
    kind.textContent = observedLabel(item);
    detail.append(kind, document.createElement("br"), item.output_digest.slice(0, 20));
    article.append(title, detail);
    casesNode.append(article);
  }
}

async function main() {
  const nodeResultsPath = new URLSearchParams(location.search).get("node-results");
  if (!nodeResultsPath) throw new Error("node-results query parameter is required");

  const [fixtureResponse, nodeResponse] = await Promise.all([
    fetch("../fixtures/witness/cases.json"),
    fetch(nodeResultsPath),
  ]);
  if (!fixtureResponse.ok || !nodeResponse.ok) throw new Error("witness inputs could not be loaded");

  const fixtureDocument = await fixtureResponse.json();
  const expectedNode = await nodeResponse.json();
  const mainResult = executeWitnessCases(fixtureDocument);
  const isolatedResult = await workerResult(fixtureDocument);
  const mainMatchesNode = canonicalJson(mainResult) === canonicalJson(expectedNode);
  const workerMatchesNode = canonicalJson(isolatedResult) === canonicalJson(expectedNode);
  const mainMatchesWorker = canonicalJson(mainResult) === canonicalJson(isolatedResult);
  const pass = (
    mainResult.status === "PASS"
    && isolatedResult.status === "PASS"
    && mainMatchesNode
    && workerMatchesNode
    && mainMatchesWorker
  );
  const summary = {
    status: pass ? "PASS" : "FAIL",
    case_count: mainResult.case_count,
    main_matches_node: mainMatchesNode,
    worker_matches_node: workerMatchesNode,
    main_matches_worker: mainMatchesWorker,
  };

  statusNode.textContent = summary.status;
  caseCountNode.textContent = String(summary.case_count);
  mainNode.textContent = mainMatchesNode ? "MATCH" : "MISMATCH";
  workerNode.textContent = workerMatchesNode ? "MATCH" : "MISMATCH";
  document.body.dataset.status = summary.status;
  renderCases(mainResult);
  window.__intentRouteWitness = summary;
}

main().catch((error) => {
  statusNode.textContent = "FAIL";
  document.body.dataset.status = "FAIL";
  window.__intentRouteWitness = {
    status: "FAIL",
    error: String(error),
  };
});
