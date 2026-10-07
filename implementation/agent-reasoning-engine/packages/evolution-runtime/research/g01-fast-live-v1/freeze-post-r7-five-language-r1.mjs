// Materialize the already checked, score-blind r8 definition once, before dispatch.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {buildDefinition} from "./define-post-r7-five-language-r1.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-r8-freeze.${reason}`);};
const base = "/opt/are/evolution-runtime";
const inputRoot = `${base}/g01-product-replication-input-r11`;
const campaignRoot = `${base}/g01-product-replication-r8`;
const pinned = {
  candidate: [`${base}/g01-post-r7-multilang-cohort-candidate-r2/COHORT-CANDIDATE.json`, "9364dcb5978c89b16c5b84c0f964e93bac4a332f562f2b73365fecb745b498c6"],
  caches: [`${base}/g01-post-r7-source-caches-r2/SOURCE-CACHES.json`, "4715d97c477a3a091ae7bbd384f7c1545cc6d4944e90cf9e9f7234ae3a2f941e"],
  preflight: [`${base}/g01-post-r7-runner-index-preflight-r2/RUNNER-INDEX-PREFLIGHT.json`, "562f4b65ca68be26affcf1125fc7ff87a3be14f5778054b0409bfc6d7ff39764"],
  coverage: [`${base}/g01-post-r7-r2-gold-index-coverage-r2/GOLD-INDEX-COVERAGE.json`, "8096e6e8bc3d3e3ba9c9aac99a067308e1941248412f78a5c9ec0715314b1732"],
  prior: [`${base}/g01-product-replication-input-r10/DEFINITION.json`, "d0d02594dfac39104d4f3afbc0242414b5e84ea30b82ab766b438548a0594a59"]
};
function readPinned([path, digest]) {
  const bytes = readFileSync(path);
  need(sha(bytes) === digest, `receipt-drift:${path}`);
  return JSON.parse(bytes);
}
try {
  const mode = process.argv[2];
  need(["--check", "--freeze"].includes(mode) && process.argv.length === 3, "arguments");
  need(!existsSync(inputRoot) && !existsSync(campaignRoot), "successor-root-used");
  const input = Object.fromEntries(Object.entries(pinned).map(([key, pin]) => [key, readPinned(pin)]));
  const definition = buildDefinition(input);
  const projection = sha(JSON.stringify(definition));
  need(projection === "86640462ed0d903a1c65e634aea9a0487c1c30c8298c330ab86a38a1d08f807e", "definition-projection-drift");
  need(definition.ordered_tasks.length === 24 && input.candidate.ordered_tasks.length === 24, "task-count");
  if (mode === "--check") {
    console.log(JSON.stringify({status: "check-passed-not-frozen", definition_projection_sha256: projection, task_count: 24, model_calls: 0}));
  } else {
    mkdirSync(inputRoot, {mode: 0o700});
    mkdirSync(join(inputRoot, "tasks"), {mode: 0o700});
    for (const task of input.candidate.ordered_tasks)
      writeFileSync(join(inputRoot, "tasks", `${task.instance_id}.json`), JSON.stringify(task, null, 2) + "\n", {flag: "wx", mode: 0o600});
    const bytes = Buffer.from(JSON.stringify({...definition, builder_sha256: sha(readFileSync(import.meta.filename)), definition_projection_sha256: projection}, null, 2) + "\n");
    const path = join(inputRoot, "DEFINITION.json");
    writeFileSync(path, bytes, {flag: "wx", mode: 0o600});
    console.log(JSON.stringify({status: "pre-dispatch", definition_path: path, definition_sha256: sha(bytes), definition_projection_sha256: projection, task_count: 24, model_calls: 0}));
  }
} catch (error) {
  console.error(JSON.stringify({status: "definition-error", error: String(error.message)}));
  process.exitCode = 2;
}
