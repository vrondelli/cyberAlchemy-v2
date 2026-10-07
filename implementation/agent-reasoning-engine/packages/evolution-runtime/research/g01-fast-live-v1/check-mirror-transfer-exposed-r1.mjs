// Read-only, no-gold trigger census on existing exposed G01 predictions.
import {execFileSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {addExactSingleIncludeMirrors} from "./mirror-source-context-r1.mjs";

const base = "/opt/are/evolution-runtime";
const read = path => JSON.parse(readFileSync(path));
const summary = [];
for (const campaign of ["g01-product-replication-r6", "g01-product-replication-r7", "g01-product-replication-r8"]) {
  const root = join(base, campaign), freeze = read(join(root, "CAMPAIGN-FREEZE.json"));
  let predictions = 0, readable = 0, unavailable = 0;
  const triggered = [];
  for (const task of freeze.ordered_tasks) {
    const pair = join(root, task.slug), path = join(pair, "candidate", "runs", "00", "prediction.json");
    if (!existsSync(path)) continue;
    predictions++;
    const prediction = read(path), config = read(join(pair, "CONFIG.json")), cache = config.tasks[0].repository_cache;
    const readSource = sourcePath => {
      try {return execFileSync("git", ["-C", cache, "show", `${prediction.commit}:${sourcePath}`], {encoding: "utf8", maxBuffer: 10_000_000, stdio: ["ignore", "pipe", "ignore"]});}
      catch {return null;}
    };
    try {
      const result = addExactSingleIncludeMirrors(prediction, readSource);
      readable++;
      if (result.additions.length) triggered.push({slug: task.slug, repo: task.repo, added_files: result.additions.map(x => x.mirror), added_spans: result.additions.reduce((n, x) => n + x.projected_spans.length, 0)});
    } catch {unavailable++;}
  }
  summary.push({campaign, frozen_tasks: freeze.ordered_tasks.length, predictions, readable, unavailable, triggered});
}
console.log(JSON.stringify({schema_version: "are.g01-mirror-exposed-trigger-census/v1", status: "read-only", gold_loaded: false, model_calls: 0, summary,
  claim_ceiling: "Source-only trigger census on existing exposed predictions; no native-score transfer or superiority claim"}));
