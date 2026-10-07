// One source-only definition freezes, dispatches, and summarizes a bounded
// G01 campaign. Pair dispatch and native scoring remain in run-pair.mjs.
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {prepareCampaign} from "./prepare-campaign.mjs";
import {runPair} from "./run-pair.mjs";
import {summarizeCampaign} from "./summarize-campaign.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => { if (!condition) throw new Error(`g01-campaign-runner.${reason}`); };

export async function runCampaign({definitionPath, definitionSha256, concurrency = 4, signal,
  prepare = prepareCampaign, run = runPair, summarize = summarizeCampaign}) {
  need(typeof definitionPath === "string" && /^[a-f0-9]{64}$/.test(definitionSha256), "definition");
  need(Number.isSafeInteger(concurrency) && concurrency >= 1 && concurrency <= 4, "concurrency");
  need(signal instanceof AbortSignal && !signal.aborted, "signal");
  const frozen = prepare({definitionPath, definitionSha256});
  need(frozen?.ordered_tasks?.length > 0 && sha(readFileSync(frozen.campaign_path)) === frozen.campaign_sha256, "freeze");
  const rows = Array(frozen.ordered_tasks.length);
  let next = 0;
  async function worker() {
    while (next < rows.length) {
      const index = next++, task = frozen.ordered_tasks[index];
      try {
        const result = await run({planPath: task.pair_plan_path, planSha256: task.pair_plan_sha256, signal});
        rows[index] = {slug: task.slug, status: result.status, matched_gates: result.matched_gates ?? null};
      } catch (error) {
        rows[index] = {slug: task.slug, status: "driver_error", error: String(error.message)};
      }
    }
  }
  await Promise.all(Array.from({length: Math.min(concurrency, rows.length)}, worker));
  const driverErrors = rows.filter(row => row.status === "driver_error");
  if (driverErrors.length) return {status: "driver_error", campaign_path: frozen.campaign_path, rows, driver_errors: driverErrors};
  const summary = summarize({freezePath: frozen.campaign_path, freezeSha256: frozen.campaign_sha256});
  return {status: summary.status, campaign_path: frozen.campaign_path, campaign_result_path: frozen.campaign_path.replace(/CAMPAIGN-FREEZE\.json$/, "CAMPAIGN-RESULT.json"),
    rows, gates: summary.gates, scored_pairs: summary.scored_pairs, planned_pairs: summary.planned_pairs};
}

if (process.argv[1] === import.meta.filename) {
  const [definitionPath, definitionSha256, concurrencyText] = process.argv.slice(2);
  const controller = new AbortController();
  process.on("SIGINT", () => controller.abort()); process.on("SIGTERM", () => controller.abort());
  try {
    const result = await runCampaign({definitionPath, definitionSha256, concurrency: concurrencyText === undefined ? 4 : Number(concurrencyText), signal: controller.signal});
    console.log(JSON.stringify(result));
    if (result.status === "driver_error") process.exitCode = 2;
  } catch (error) {
    console.error(JSON.stringify({status: "campaign_driver_error", error: String(error.message)}));
    process.exitCode = 2;
  }
}
