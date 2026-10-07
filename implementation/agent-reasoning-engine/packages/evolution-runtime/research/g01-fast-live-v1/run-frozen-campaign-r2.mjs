import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";
import {runPair} from "./run-pair.mjs";
import {summarizeCampaign} from "./summarize-campaign.mjs";

const freezePath = process.argv[2], freezeSha256 = process.argv[3];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
if (!freezePath?.startsWith("/") || !/^[a-f0-9]{64}$/.test(freezeSha256) || sha(readFileSync(freezePath)) !== freezeSha256)
  throw Error("campaign-freeze-drift");
const freeze = JSON.parse(readFileSync(freezePath));
if (freeze.schema_version !== "are.g01-campaign-freeze/v1" || freeze.ordered_tasks?.length !== 24) throw Error("campaign-shape");
const controller = new AbortController();
process.on("SIGTERM", () => controller.abort());
process.on("SIGINT", () => controller.abort());
let next = 0;
const outcomes = Array(freeze.ordered_tasks.length);
async function worker() {
  while (next < outcomes.length && !controller.signal.aborted) {
    const index = next++, task = freeze.ordered_tasks[index];
    const existing = join(task.pair_plan_path, "..", "PAIR-RESULT.json");
    try {
      const result = existsSync(existing) ? JSON.parse(readFileSync(existing)) : await runPair({planPath:task.pair_plan_path, planSha256:task.pair_plan_sha256, signal:controller.signal});
      outcomes[index] = {slug:task.slug, status:result.status};
    } catch (error) { outcomes[index] = {slug:task.slug, status:"driver_error", error:String(error.message)}; }
    process.stdout.write(`${JSON.stringify({completed:outcomes.filter(Boolean).length, ...outcomes[index]})}\n`);
  }
}
await Promise.all([worker(), worker()]);
if (outcomes.some(row => !row || row.status === "driver_error")) {process.exitCode = 2;}
else {
  const summary = summarizeCampaign({freezePath, freezeSha256});
  process.stdout.write(`${JSON.stringify({status:summary.status, scored_pairs:summary.scored_pairs, planned_pairs:summary.planned_pairs, gates:summary.gates})}\n`);
}
