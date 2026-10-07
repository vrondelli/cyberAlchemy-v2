// Source-only G01 r3 preflight. Does not load gold, dispatch a model, or score.
import {createHash} from "node:crypto";
import {readdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {preflight} from "./preflight-campaign-r2.mjs";
import {runSourceIndex} from "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-index-service-r1.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const [inputRoot, outputPath] = process.argv.slice(2);
if (!inputRoot?.startsWith("/") || !outputPath?.startsWith("/")) throw new Error("g01-r3-preflight.absolute-paths-required");
const taskRoot = join(inputRoot, "tasks");
const rows = readdirSync(taskRoot).filter(name => name.endsWith(".json"))
  .map(name => JSON.parse(readFileSync(join(taskRoot, name))))
  .sort((a, b) => a.repo.localeCompare(b.repo) || sha(a.instance_id).localeCompare(sha(b.instance_id)));
const result = await preflight({rows, runSourceIndex});
const receipt = {...result, schema_version: "are.g01-r3-source-index-preflight/v1", cohort: "g01-r3", input_root: inputRoot,
  claim_ceiling: "Source-only index and bounded-primer preflight; not native scoring or model quality"};
const bytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`);
writeFileSync(outputPath, bytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({status: receipt.status, count: rows.length, passed: receipt.results.filter(row => row.status === "passed").length,
  output_path: outputPath, output_sha256: sha(bytes)}));
if (receipt.status !== "passed") process.exitCode = 2;
