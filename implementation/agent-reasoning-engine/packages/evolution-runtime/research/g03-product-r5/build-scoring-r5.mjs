import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime/g03-product-replication-code-r7";
const relative = "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
function replaceExact(source, before, after, count = 1) {
  const found = source.split(before).length - 1;
  if (found !== count) throw Error(`source-shape-drift:${before}:${found}`);
  return source.replaceAll(before, after);
}
let reference = readFileSync(join(root,relative,"replication-cohort-reference-project-r4.py"),"utf8");
for (const [before, after] of [
  ["80-row product replication", "50-row five-type product replication"],
  ["len(ids) != 80", "len(ids) != 50"],
  ["len(set(ids)) != 80", "len(set(ids)) != 50"],
  ["generation.get(\"terminal_count\") != 80", "generation.get(\"terminal_count\") != 50"],
  ["len(generation.get(\"results\", [])) != 80", "len(generation.get(\"results\", [])) != 50"],
  ["len(answered_ids) + len(refused_ids) != 80", "len(answered_ids) + len(refused_ids) != 50"],
  [".product80-reference-", ".product50-reference-"],
  ["replication-cohort-reference-project-r4.py UPSTREAM_JSON", "replication-cohort-reference-project-r5.py UPSTREAM_JSON"]
]) reference = replaceExact(reference,before,after);
let score = readFileSync(join(root,relative,"replication-cohort-score-r4.mjs"),"utf8");
for (const [before, after, count] of [
  ["80-question product replication seal", "50-question five-type product replication seal", 1],
  ["generation.terminal_count, 80", "generation.terminal_count, 50", 1],
  ["generation.results.length, 80", "generation.results.length, 50", 1],
  ["tenK.completed, 80", "tenK.completed, 50", 1],
  ["tenK.results.length, 80", "tenK.results.length, 50", 1],
  ["planned: 80", "planned: 50", 1],
  ["Fixed 80-question six-type LongMemEval-S replication", "Fixed 50-question five-type LongMemEval-S replication", 1]
]) score = replaceExact(score,before,after,count);
const referencePath = join(root,relative,"replication-cohort-reference-project-r5.py");
const scorePath = join(root,relative,"replication-cohort-score-r5.mjs");
writeFileSync(referencePath,reference,{flag:"wx",mode:0o600});
writeFileSync(scorePath,score,{flag:"wx",mode:0o600});
process.stdout.write(`${JSON.stringify({reference_path:referencePath,reference_sha256:sha(reference),score_path:scorePath,score_sha256:sha(score)})}\n`);
