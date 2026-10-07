import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";

import {canonicalJson} from "../../../intent-route-resolver/index.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const need = (value, reason) => { if (!value) throw new Error(`hen10-recovery-prepare.${reason}`); };

export async function prepareHen10Recovery({repositoryRoot, priorRoot, outputRoot}) {
  repositoryRoot = resolve(repositoryRoot); priorRoot = resolve(priorRoot); outputRoot = resolve(outputRoot);
  need(!existsSync(outputRoot), "output-exists");
  const freezePath = join(priorRoot, "FREEZE.json");
  const reviewPath = join(priorRoot, "INDEPENDENT-LAUNCH-REVIEW.json");
  const summaryPath = join(priorRoot, "ATTEMPT-SUMMARY.json");
  const settlementPath = join(priorRoot, "run/SETTLEMENT.json");
  const resultsPath = join(priorRoot, "run/metadata_root/RESULTS.json");
  const manifestPath = join(priorRoot, "run/metadata_root/EVIDENCE-MANIFEST.json");
  const sealPath = join(priorRoot, "run/outcome_root/GENERATION-SEAL.json");
  const prior = readJson(freezePath), summary = readJson(summaryPath), settlement = readJson(settlementPath);
  const initialAttemptPath = join(repositoryRoot, prior.prior_attempt.evidence_ref);
  need(prior.schema_version === "are.hen10-contextbench-live-freeze/v1", "prior-freeze");
  need(summary.status === "incomplete-environment-suspension" && settlement.status === "failed", "prior-attempt");
  need(summary.tasks.length === 4 && summary.tasks.slice(0, 2).every(task => task.reconciled === true) && summary.tasks.slice(2).every(task => task.reconciled === false), "recovery-boundary");
  mkdirSync(outputRoot, {recursive: true, mode: 0o700});
  try {
    const contextRoot = join(repositoryRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench");
    const executableEntries = [
      new URL("./run-recovery.mjs", import.meta.url).pathname,
      new URL("./score-recovery.mjs", import.meta.url).pathname,
      new URL("./remote-mounted-glm-v1.mjs", import.meta.url).pathname,
      join(contextRoot, "ranked-source-arm-r1.mjs"),
      join(contextRoot, "ranked-source-live-client-r1.mjs"),
      join(contextRoot, "ranked-source-run-files-r1.mjs"),
      join(contextRoot, "candidate-only-source-freeze.mjs")
    ];
    const {collectCandidateSources} = await import(join(contextRoot, "candidate-only-source-freeze.mjs"));
    const bindings = new Map(collectCandidateSources(executableEntries).map(binding => [binding.path, binding.sha256]));
    for (const path of [freezePath, reviewPath, summaryPath, settlementPath, resultsPath, manifestPath, sealPath, initialAttemptPath]) bindings.set(path, sha(readFileSync(path)));
    const preserved = prior.schedule.slots.slice(0, 2).map((slot, index) => {
      const resultPath = join(prior.roots.runs_root, String(index).padStart(2, "0"), "result.json");
      const outcomePath = join(prior.roots.outcome_root, "outcomes", `${String(index).padStart(2, "0")}.json`);
      const taskSummary = summary.tasks[index];
      need(taskSummary.task_ref === slot.task_id && taskSummary.result_sha256 === sha(readFileSync(resultPath)), `preserved:${index}`);
      bindings.set(resultPath, taskSummary.result_sha256);
      bindings.set(outcomePath, sha(readFileSync(outcomePath)));
      return {sequence: index, task_ref: slot.task_id, slot_id: slot.slot_id, result_path: resultPath, result_sha256: taskSummary.result_sha256,
        outcome_path: outcomePath, outcome_sha256: sha(readFileSync(outcomePath)), runs_root: prior.roots.runs_root, source_root: prior.roots.source_root};
    });
    const recoverySlots = prior.schedule.slots.slice(2);
    need(recoverySlots.length === 2 && recoverySlots.map(slot => slot.task_id).join(",") === "contextbench-3,contextbench-4", "recovery-slots");
    const runRoot = join(outputRoot, "run");
    const freeze = {
      schema_version: "are.hen10-contextbench-recovery-freeze/v1",
      objective_ref: prior.objective_ref,
      hypothesis_ref: prior.hypothesis_ref,
      recovery_of: {freeze_path: freezePath, freeze_sha256: sha(readFileSync(freezePath)), review_path: reviewPath,
        review_sha256: sha(readFileSync(reviewPath)), attempt_summary_path: summaryPath, attempt_summary_sha256: sha(readFileSync(summaryPath)),
        settlement_path: settlementPath, settlement_sha256: sha(readFileSync(settlementPath)), results_path: resultsPath, results_sha256: sha(readFileSync(resultsPath)),
        manifest_path: manifestPath, manifest_sha256: sha(readFileSync(manifestPath)), seal_path: sealPath, seal_sha256: sha(readFileSync(sealPath))},
      initial_attempt: {summary_path: initialAttemptPath, summary_sha256: sha(readFileSync(initialAttemptPath))},
      model: prior.model,
      context_limit: 8000,
      output_cap: 2048,
      node_runtime: {required_node_options: ["--experimental-vm-modules"]},
      candidate_only: true,
      control_runs: 0,
      presentation_policy: prior.presentation_policy,
      recovery_policy: "fresh-unfinished-tasks-only",
      maximum_workers: 2,
      maximum_model_calls: 192,
      maximum_model_tokens: 192000,
      all_attempt_upper_bound: {model_calls: 259, model_tokens: 429828},
      maximum_automatic_retries: 0,
      remote: prior.remote,
      storage_binding: prior.storage_binding,
      sources: prior.sources,
      original_schedule_sha256: prior.schedule.schedule_sha256,
      recovery_slots: recoverySlots,
      candidate_views: prior.candidate_views.filter(view => recoverySlots.some(slot => slot.task_id === view.task_ref)),
      preserved,
      roots: {runs_root: join(runRoot, "runs_root"), source_root: join(runRoot, "source_root"), metadata_root: join(runRoot, "metadata_root")},
      executable_entries: executableEntries,
      source_bindings: [...bindings].map(([path, sha256]) => ({path, sha256})).sort((left, right) => left.path.localeCompare(right.path)),
      launch_gate: "independent-recovery-review-required",
      claim_ceiling: "Recovery and composite evidence for the same four exposed development tasks only; no untouched-set, generalization, release, deployment, or scientific-acceptance claim.",
      authority_effect: "none",
      open_questions_ref: "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/BENCHMARK-EVOLUTION-WORKFLOW.md"
    };
    const bytes = `${canonicalJson(freeze)}\n`;
    writeFileSync(join(outputRoot, "FREEZE.json"), bytes, {flag: "wx", mode: 0o600});
    writeFileSync(join(outputRoot, "FREEZE.sha256"), `${sha(bytes)}  FREEZE.json\n`, {flag: "wx", mode: 0o600});
    return {output_root: outputRoot, freeze_sha256: sha(bytes), recovery_tasks: recoverySlots.map(slot => slot.task_id), preserved_tasks: preserved.map(row => row.task_ref), provider_calls: 0};
  } catch (error) {
    rmSync(outputRoot, {recursive: true, force: true});
    throw error;
  }
}

if (process.argv[1] === import.meta.filename) console.log(canonicalJson(await prepareHen10Recovery({repositoryRoot: process.argv[2], priorRoot: process.argv[3], outputRoot: process.argv[4]})));
