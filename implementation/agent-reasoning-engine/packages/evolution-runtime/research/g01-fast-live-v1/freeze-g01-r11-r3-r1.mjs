// One-time score-blind G01 r11 r3 materialization and campaign freeze.
// --check writes nothing. --freeze requires a fresh same-account GLM receipt.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import {buildDefinition, pins, readPinned} from "./define-g01-r11-r3-r1.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r11-freeze.${reason}`);};
const base = "/opt/are/evolution-runtime";
const inputRoot = `${base}/g01-product-replication-input-r14`;
const campaignRoot = `${base}/g01-product-replication-r11`;
const sourceRoot = `${base}/g01-source-r11-prospective-r40`;
const preparePath = `${sourceRoot}/implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs`;
const definitionBuilder = `${base}/define-g01-r11-r3-r1.mjs`;
const expectedBuilderSha = "a5f934a6abe9f822c467b5aa068844da872d95dbdaeb7d175d9015215bf85530";
const expectedProjection = "1070e977f677dc01c1e2ba3b256d0ffe08266ef08d1c60fb085c51ffb3528a94";

async function main() {
  const [mode, readyPath, readySha] = process.argv.slice(2);
  need(["--check", "--freeze"].includes(mode) &&
    process.argv.length === (mode === "--check" ? 3 : 5), "arguments");
  need(!existsSync(inputRoot) && !existsSync(campaignRoot), "successor-root-used");
  need(sha(readFileSync(definitionBuilder)) === expectedBuilderSha, "definition-builder-drift");
  const inputs = Object.fromEntries(Object.entries(pins).map(([name, pin]) => [name, readPinned(pin)]));
  const {bindSourceTree, prepareCampaign} = await import(pathToFileURL(preparePath).href);
  const tree = bindSourceTree(sourceRoot);
  const definition = buildDefinition({...inputs, tree});
  const projection = sha(JSON.stringify(definition));
  need(projection === expectedProjection && definition.ordered_tasks.length === 24 &&
    definition.source_tree_sha256 === tree.tree_sha256, "definition-projection-drift");
  if (mode === "--check") {
    console.log(JSON.stringify({status: "check-passed-not-frozen", definition_projection_sha256: projection,
      source_tree_sha256: tree.tree_sha256, task_count: 24, model_calls: 0}));
    return;
  }
  need(/^\/opt\/are\/evolution-runtime\/g01-r10-provider-readiness\/[A-Za-z0-9_-]+\/READY\.json$/.test(readyPath ?? "") &&
    /^[a-f0-9]{64}$/.test(readySha ?? ""), "readiness-arguments");
  const readyBytes = readFileSync(readyPath), ready = JSON.parse(readyBytes);
  need(sha(readyBytes) === readySha && ready.schema_version === "are.g01-provider-readiness/v1" &&
    ready.status === "ready" && ready.model === "glm-5.3-flash" &&
    ready.tokenizer?.status === 200 && Number.isSafeInteger(ready.tokenizer.prompt_tokens) &&
    ready.tokenizer.prompt_tokens > 0 && ready.tiny_generation?.status === 200 &&
    Number.isSafeInteger(ready.tiny_generation.output_tokens) && ready.tiny_generation.output_tokens > 0 &&
    ready.automatic_retries === 0 &&
    ready.provider_host_fingerprint_sha256 === "bb6900a580e91ec8efa83d491ba9493cd8ae782c69bafaa94d12cfc856f27e2f" &&
    ready.gateway_container_image === "sha256:dbaf783163a0d1b1e6ea7cd693f1145803df7bfaa1d23d31c41c4ffd447e3361" &&
    Number.isFinite(Date.parse(ready.checked_at)) && Date.now() >= Date.parse(ready.checked_at) &&
    Date.now() - Date.parse(ready.checked_at) < 600_000, "provider-not-ready");
  mkdirSync(inputRoot, {mode: 0o700});
  mkdirSync(join(inputRoot, "tasks"), {mode: 0o700});
  for (const task of inputs.candidate.ordered_tasks)
    writeFileSync(join(inputRoot, "tasks", `${task.instance_id}.json`),
      `${JSON.stringify(task, null, 2)}\n`, {flag: "wx", mode: 0o600});
  const bytes = Buffer.from(`${JSON.stringify({...definition,
    builder_sha256: sha(readFileSync(import.meta.filename)),
    definition_projection_sha256: projection,
    provider_readiness_sha256_at_freeze: readySha}, null, 2)}\n`);
  const definitionPath = join(inputRoot, "DEFINITION.json");
  writeFileSync(definitionPath, bytes, {flag: "wx", mode: 0o600});
  const campaign = prepareCampaign({definitionPath, definitionSha256: sha(bytes)});
  console.log(JSON.stringify({status: "frozen-before-dispatch", definition_path: definitionPath,
    definition_sha256: sha(bytes), campaign_path: campaign.campaign_path,
    campaign_sha256: campaign.campaign_sha256, source_tree_sha256: tree.tree_sha256,
    task_count: campaign.ordered_tasks.length, provider_readiness_sha256: readySha,
    model_calls: 0}));
}
main().catch(error => {console.error(JSON.stringify({status: "freeze-error", error: String(error.message)})); process.exitCode = 2;});
