import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {runCampaign} from "./run-campaign.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "g01-one-command-"));
  const campaignPath = join(root, "CAMPAIGN-FREEZE.json");
  writeFileSync(campaignPath, JSON.stringify({status: "frozen-before-dispatch"}));
  const tasks = Array.from({length: 5}, (_, index) => ({slug: `task-${index}`, pair_plan_path: join(root, `task-${index}`, "PAIR-PLAN.json"), pair_plan_sha256: "a".repeat(64)}));
  return {root, campaignPath, tasks, prepare: () => ({campaign_path: campaignPath, campaign_sha256: sha(readFileSync(campaignPath)), ordered_tasks: tasks}),
    clean: () => rmSync(root, {recursive: true, force: true})};
}

test("one definition drives every frozen pair with bounded concurrency and one summary", async () => {
  const f = fixture(), seen = [], releases = [];
  let active = 0, peak = 0, summaries = 0;
  try {
    const pending = runCampaign({definitionPath: "/fixture/DEFINITION.json", definitionSha256: "b".repeat(64), concurrency: 2,
      signal: new AbortController().signal, prepare: f.prepare,
      run: async ({planPath}) => {
        active++; peak = Math.max(peak, active); seen.push(planPath);
        await new Promise(resolve => releases.push(resolve));
        active--; return {status: "scored"};
      }, summarize: () => { summaries++; return {status: "complete", gates: {campaign_pass: true}, scored_pairs: 5, planned_pairs: 5}; }});
    for (let index = 0; index < 5; index++) {
      while (!releases.length) await new Promise(resolve => setTimeout(resolve, 1));
      releases.shift()();
    }
    const result = await pending;
    assert.equal(peak, 2); assert.equal(seen.length, 5); assert.equal(summaries, 1);
    assert.equal(result.gates.campaign_pass, true);
  } finally { f.clean(); }
});

test("one failed pair does not stop other frozen tasks or claim a campaign result", async () => {
  const f = fixture(); let called = 0, summarized = false;
  try {
    const result = await runCampaign({definitionPath: "/fixture/DEFINITION.json", definitionSha256: "b".repeat(64), concurrency: 3,
      signal: new AbortController().signal, prepare: f.prepare,
      run: async () => { called++; if (called === 1) throw new Error("fixture-failure"); return {status: "scored"}; },
      summarize: () => { summarized = true; throw new Error("must-not-summarize"); }});
    assert.equal(called, 5); assert.equal(result.status, "driver_error"); assert.equal(result.driver_errors.length, 1);
    assert.equal(summarized, false);
  } finally { f.clean(); }
});
