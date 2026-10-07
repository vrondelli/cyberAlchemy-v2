import {cpSync, existsSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";

const base = "/opt/are/evolution-runtime/g03-product-replication-code-r6";
const target = "/opt/are/evolution-runtime/g03-product-replication-code-r7";
const relative = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
if (existsSync(target)) throw Error("fresh-code-root-required");
const adapterPath = join(base,relative,"replication-cohort-adapter-v1.mjs");
const runnerPath = join(base,relative,"replication-cohort-paired-r4.mjs");
const adapter = readFileSync(adapterPath,"utf8"), runner = readFileSync(runnerPath,"utf8");
if ((adapter.match(/manifest\.rows\.length, 80/g)??[]).length !== 1 ||
    (adapter.match(/manifest\.question_ids\)\.size, 80/g)??[]).length !== 1 ||
    (runner.match(/Prospective 80-question generation only/g)??[]).length !== 2) throw Error("r4-source-shape-drift");
cpSync(base,target,{recursive:true,errorOnExist:true,force:false});
const outputAdapter = adapter.replace("manifest.rows.length, 80", "manifest.rows.length, 50")
  .replace("manifest.question_ids).size, 80", "manifest.question_ids).size, 50")
  .replace("80-question product replication cohort", "50-question five-type r5 replication cohort");
const outputRunner = runner.replace("Frozen 80-question matched replication", "Frozen 50-question five-type matched replication")
  .replaceAll("Prospective 80-question generation only", "Prospective 50-question five-type generation only");
writeFileSync(join(target,relative,"replication-cohort-adapter-v1.mjs"),outputAdapter);
writeFileSync(join(target,relative,"replication-cohort-paired-r5.mjs"),outputRunner,{flag:"wx"});
process.stdout.write(`${JSON.stringify({code_root:target,adapter_sha256:sha(outputAdapter),runner_sha256:sha(outputRunner),base_runner_sha256:sha(runner)})}\n`);
