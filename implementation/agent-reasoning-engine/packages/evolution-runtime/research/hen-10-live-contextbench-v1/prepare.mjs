import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {join, relative, resolve} from "node:path";

import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {materializeHenCandidateView} from "../../src/hen-candidate-view-v1.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const need = (value, reason) => { if (!value) throw new Error(`hen10-prepare.${reason}`); };

export async function prepareHen10({repositoryRoot, outputRoot}) {
  repositoryRoot = resolve(repositoryRoot); outputRoot = resolve(outputRoot);
  need(!existsSync(outputRoot), "output-exists");
  const temp = outputRoot; mkdirSync(join(temp, "views"), {recursive: true, mode: 0o700});
  const contextRoot = join(repositoryRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench");
  const replayPath = join(contextRoot, "EVIDENCE-NEIGHBORHOOD-FRONTIER-REPLAY-R7.json");
  const replay = readJson(replayPath); need(replay.rows?.length === 4 && replay.provider_calls === 0, "replay");
  const original = readJson(join(contextRoot, "discovery-v1/live-config.json"));
  try {
    const tasks = replay.rows.map((row, index) => {
      const prior = original.tasks.find(task => task.id === row.task_id); need(prior, `task:${index}`);
      const taskPath = resolve(row.source_relocation.task_path), repository = resolve(row.source_relocation.repository);
      const taskBytes = readFileSync(taskPath), task = JSON.parse(taskBytes);
      need(task.instance_id === row.instance_id && task.base_commit === prior.base_commit, `identity:${index}`);
      const materialized = materializeHenCandidateView({task_ref: row.task_id, query_results: row.query_results}); need(materialized.ok, `view:${index}`);
      const viewPath = join(temp, "views", `${row.task_id}.json`); writeFileSync(viewPath, `${canonicalJson(materialized.value)}\n`, {flag: "wx", mode: 0o600});
      return {...prior, task_path: taskPath, task_sha256: sha(taskBytes), repository_cache: repository,
        cell_template: {...prior.cell_template, provider_profile: {...prior.cell_template.provider_profile,
          index_tokenizer_transport_attempts: 1, request_tokenizer_transport_attempts: 1}}};
    });
    const config = {...original, tasks, credential_path: "remote-mounted-secret://187.77.163.194/are-keld-presentation-provider-gateway-1",
      python: "/usr/bin/python3", scorer: join(repositoryRoot, "implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py"),
      source_manifest: join(repositoryRoot, "implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-manifest.json"),
      experiment_id: "hen-10-contextbench-live-v1"};
    const configBytes = `${canonicalJson(config)}\n`; const configPath = join(temp, "CONFIG.json"); writeFileSync(configPath, configBytes, {flag: "wx", mode: 0o600});
    const cohort = {cohort: tasks.map(task => ({task_id: task.id, instance_id: task.instance_id, task_path: task.task_path, task_sha256: task.task_sha256, base_commit: task.base_commit})),
      source_config_sha256: sha(configBytes), experiment_ref: "hypothesis:H-EN-R2-adaptive-v2", maximum_total_model_tokens: 384000,
      maximum_model_calls: 384, maximum_workers: 2, dispatch_admitted: false, authority_effect: "none",
      open_questions_ref: "BENCHMARK-EVOLUTION-WORKFLOW.md"};
    const cohortBytes = `${canonicalJson(cohort)}\n`; const cohortPath = join(temp, "COHORT.json"); writeFileSync(cohortPath, cohortBytes, {flag: "wx", mode: 0o600});
    const {buildRankedSourceHintsSchedule} = await import(join(contextRoot, "ranked-source-hints-schedule-r2.mjs"));
    const sources = {config_path: configPath, cohort_path: cohortPath, cohort_sha256: sha(cohortBytes)};
    const schedule = buildRankedSourceHintsSchedule(sources);
    const viewBindings = tasks.map(task => { const path = join(temp, "views", `${task.id}.json`); const value = readJson(path); return {task_ref: task.id, path, sha256: sha(readFileSync(path)), view_digest: value.view_digest}; });
    const runRoot = join(outputRoot, "run");
    const {collectCandidateSources} = await import(join(contextRoot, "candidate-only-source-freeze.mjs"));
    const executableEntries = [new URL("./run.mjs", import.meta.url).pathname,
      join(contextRoot, "ranked-source-hints-schedule-r2.mjs"), join(contextRoot, "ranked-source-generation-storage-r1.mjs"),
      join(contextRoot, "ranked-source-campaign-r1.mjs"), join(contextRoot, "candidate-only-source-freeze.mjs")];
    const executableClosure = collectCandidateSources(executableEntries);
    const dataFiles = [replayPath, join(repositoryRoot, "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/HEN-09-TOKENIZER-QUALIFICATION.v1.json")];
    const priorAttempt = join(repositoryRoot, "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/hen-10-contextbench-live-v1/ATTEMPT-SUMMARY.json");
    if (existsSync(priorAttempt)) dataFiles.push(priorAttempt);
    const sourceBindings = new Map(executableClosure.map(binding => [binding.path, binding.sha256]));
    for (const path of dataFiles) sourceBindings.set(path, sha(readFileSync(path)));
    const provenancePath = join(repositoryRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/cleanup-20260918/HOST-STORAGE-CORRECTION.md");
    const storageBinding = {schema: "are.wsl-host-storage-binding/v1", verified: true, distribution: "Ubuntu", windows_base_path: "D:\\WSL\\Ubuntu", virtual_disk: "ext4.vhdx", host_drive: "D", host_root: "/mnt/d", verification_method: "Windows Lxss registry, verified by coordinating agent; see bound provenance", provenance: {path: provenancePath, sha256: sha(readFileSync(provenancePath))}, open_questions_ref: "STORAGE-HOST.md"};
    const freeze = {schema_version: "are.hen10-contextbench-live-freeze/v1", objective_ref: "objective:glm8k-contextbench-context-selection",
      hypothesis_ref: "hypothesis:H-EN-R2-adaptive-v2", model: "glm-5.3-flash", context_limit: 8000, output_cap: 2048,
      node_runtime: {required_node_options: ["--experimental-vm-modules"]},
      candidate_only: true, control_runs: 0, presentation_policy: "adaptive-compact-v2", maximum_workers: 2,
      maximum_model_calls: 384, maximum_model_tokens: 384000, maximum_automatic_retries: 0,
      remote: {host: "187.77.163.194", container: "are-keld-presentation-provider-gateway-1", secret_path: "/run/secrets/model_api_key", secret_crosses_host_boundary: false, remote_artifacts_retained: false}, storage_binding: storageBinding,
      sources, schedule, candidate_views: viewBindings,
      roots: {outcome_root: join(runRoot, "outcome_root"), runs_root: join(runRoot, "runs_root"), metadata_root: join(runRoot, "metadata_root"), source_root: join(runRoot, "source_root")},
      executable_entries: executableEntries, source_bindings: [...sourceBindings].map(([path, sha256]) => ({path, sha256})).sort((left, right) => left.path.localeCompare(right.path)),
      prior_qualification: {evidence_ref: "HEN-09-TOKENIZER-QUALIFICATION-001", accepted_revision_provider_calls: 93, overflows: 0},
      prior_attempt: existsSync(priorAttempt) ? {evidence_ref: relative(repositoryRoot, priorAttempt), disposition: "stopped-before-model-dispatch", model_calls: 0, diagnostic_tokenizer_calls: 2} : null,
      launch_gate: "independent-review-required", claim_ceiling: "Exposed four-task development-cohort evidence only; no untouched-set, generalization, release, deployment, or scientific-acceptance claim.",
      route_receipt_digest: "e4cd58ef1812dfaa1e9c59a488ba4fa7be93964a1c497cdb70417b2a23eae0fe", authority_effect: "none",
      open_questions_ref: "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/BENCHMARK-EVOLUTION-WORKFLOW.md"};
    const bytes = `${canonicalJson(freeze)}\n`; writeFileSync(join(temp, "FREEZE.json"), bytes, {flag: "wx", mode: 0o600}); writeFileSync(join(temp, "FREEZE.sha256"), `${sha(bytes)}  FREEZE.json\n`, {flag: "wx", mode: 0o600});
    return {output_root: outputRoot, freeze_sha256: sha(bytes), schedule_sha256: schedule.schedule_sha256, tasks: tasks.length, provider_calls: 0, model_calls: 0};
  } catch (error) { rmSync(temp, {recursive: true, force: true}); throw error; }
}

if (process.argv[1] === import.meta.filename) console.log(canonicalJson(await prepareHen10({repositoryRoot: process.argv[2], outputRoot: process.argv[3]})));
