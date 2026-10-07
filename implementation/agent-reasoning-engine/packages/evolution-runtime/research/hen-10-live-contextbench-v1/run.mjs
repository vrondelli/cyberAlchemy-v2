import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";

import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {verifyHenCandidateView} from "../../src/hen-candidate-view-v1.mjs";
import {createRemoteMountedCredentialBinding, createRemoteMountedPost} from "./remote-mounted-glm-v1.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../../../..");
const contextRoot = join(repositoryRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench");
const sha = value => createHash("sha256").update(value).digest("hex");
const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const need = (value, reason) => { if (!value) throw new Error(`hen10-run.${reason}`); };

export async function runHen10({freezePath, freezeSha256, reviewPath, signal}) {
  freezePath = resolve(freezePath); reviewPath = resolve(reviewPath);
  const freezeBytes = readFileSync(freezePath); need(sha(freezeBytes) === freezeSha256, "freeze-drift");
  const freeze = JSON.parse(freezeBytes); need(freeze.schema_version === "are.hen10-contextbench-live-freeze/v1", "freeze-schema");
  const review = readJson(reviewPath); need(review.schema_version === "are.hen10-independent-launch-review/v1" && review.decision === "PASS" && review.dispatch_admitted === true && review.freeze_sha256 === freezeSha256 && review.findings.length === 0, "independent-review");
  for (const binding of freeze.source_bindings) need(sha(readFileSync(binding.path)) === binding.sha256, `source-drift:${binding.path}`);
  const candidateViews = new Map();
  for (const binding of freeze.candidate_views) {
    need(sha(readFileSync(binding.path)) === binding.sha256, `view-drift:${binding.task_ref}`);
    const view = readJson(binding.path); need(verifyHenCandidateView(view).ok && view.view_digest === binding.view_digest && view.task_ref === binding.task_ref, `view:${binding.task_ref}`);
    candidateViews.set(binding.task_ref, view);
  }
  need(candidateViews.size === 4 && freeze.candidate_only === true && freeze.control_runs === 0 && freeze.maximum_workers === 2, "bounded-campaign");
  const {verifyRankedSourceHintsSchedule} = await import(join(contextRoot, "ranked-source-hints-schedule-r2.mjs"));
  const {verifyCandidateSources} = await import(join(contextRoot, "candidate-only-source-freeze.mjs"));
  const {createComparisonGenerationStorage} = await import(join(contextRoot, "ranked-source-generation-storage-r1.mjs"));
  const {runComparisonCampaign} = await import(join(contextRoot, "ranked-source-campaign-r1.mjs"));
  verifyCandidateSources(freeze.source_bindings, freeze.executable_entries);
  verifyRankedSourceHintsSchedule({schedule: freeze.schedule, ...freeze.sources});
  const runRoot = dirname(freeze.roots.outcome_root); need(!existsSync(runRoot), "run-root-exists"); mkdirSync(runRoot, {recursive: true, mode: 0o700});
  for (const key of ["outcome_root", "runs_root", "metadata_root"]) mkdirSync(freeze.roots[key], {mode: 0o700});
  const request = {...freeze.roots, schedule: freeze.schedule, sources: freeze.sources, binding: freeze.storage_binding};
  const storage = createComparisonGenerationStorage(request);
  const started = {schema_version: "are.hen10-live-process/v1", freeze_sha256: freezeSha256, review_sha256: sha(readFileSync(reviewPath)), started_at: new Date().toISOString(), pid: process.pid, status: "running", authority_effect: "none"};
  writeFileSync(join(runRoot, "PROCESS.json"), `${canonicalJson(started)}\n`, {flag: "wx", mode: 0o600});
  let result, error;
  try {
    result = await runComparisonCampaign({...request, ...storage, signal, candidate_views: candidateViews,
      client_factory_options: {credential_override: createRemoteMountedCredentialBinding(), post: createRemoteMountedPost()}});
    need(result.terminal_status === "settled" && result.reconciliation?.all_run_evidence_reconciled === true && result.reconciliation.reconciled_outcomes === 4, "campaign-incomplete");
    return result;
  } catch (caught) { error = caught; throw caught; }
  finally {
    const settlement = {...started, completed_at: new Date().toISOString(), status: error ? "failed" : "settled", error: error ? String(error.message) : null,
      result: result ?? error?.campaign_evidence ?? error?.result ?? null};
    writeFileSync(join(runRoot, "SETTLEMENT.json"), `${canonicalJson(settlement)}\n`, {flag: "wx", mode: 0o600});
  }
}

if (process.argv[1] === import.meta.filename) {
  const controller = new AbortController(); process.on("SIGINT", () => controller.abort()); process.on("SIGTERM", () => controller.abort());
  try { console.log(canonicalJson(await runHen10({freezePath: process.argv[2], freezeSha256: process.argv[3], reviewPath: process.argv[4], signal: controller.signal}))); }
  catch (error) { console.error(canonicalJson({status: "failed", error: String(error.message)})); process.exitCode = 2; }
}
