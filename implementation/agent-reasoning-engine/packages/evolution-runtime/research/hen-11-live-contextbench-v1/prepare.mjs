import {createHash} from "node:crypto";
import {existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from "node:fs";
import {isAbsolute, join, relative, resolve} from "node:path";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const need = (value, reason) => { if (!value) throw new Error(`hen11-prepare.${reason}`); };

export function treeBinding(root) {
  root = resolve(root); const files = [];
  const visit = directory => {
    for (const entry of readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name), rel = relative(root, path); need(!entry.isSymbolicLink(), `repository-symlink:${rel}`);
      if (entry.isDirectory()) visit(path);
      else { need(entry.isFile(), `repository-entry:${rel}`); const stat = lstatSync(path), bytes = readFileSync(path); files.push({path: rel, mode: stat.mode & 0o777, size: bytes.length, sha256: sha(bytes)}); }
    }
  };
  visit(root); return {files: files.length, bytes: files.reduce((sum, file) => sum + file.size, 0), tree_sha256: sha(canonicalJson(files))};
}

export async function prepareHen11({repositoryRoot, outputRoot, targetRoot = outputRoot, runtimeRepositoryRoot = repositoryRoot}) {
  repositoryRoot = resolve(repositoryRoot); outputRoot = resolve(outputRoot); targetRoot = resolve(targetRoot); runtimeRepositoryRoot = resolve(runtimeRepositoryRoot); need(!existsSync(outputRoot), "output-exists");
  const runtimePath = path => { const rel = relative(repositoryRoot, resolve(path)); need(rel && !rel.startsWith("..") && !isAbsolute(rel), `runtime-path:${path}`); return join(runtimeRepositoryRoot, rel); };
  const deployed = targetRoot !== outputRoot || runtimeRepositoryRoot !== repositoryRoot;
  const contextRoot = join(repositoryRoot, "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench");
  const evidenceRoot = join(repositoryRoot, "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence");
  const priorRoot = join(evidenceRoot, "hen-10-contextbench-live-v2"), hypothesisPath = join(evidenceRoot, "HEN-11-HYPOTHESIS-SELECTION.v1.json");
  const historicalResultsPath = join(evidenceRoot, "hen-10-contextbench-live-v7-recovery/score-r4/RESULTS.json"), historicalReviewPath = join(evidenceRoot, "hen-10-contextbench-live-v7-recovery/INDEPENDENT-POSTRUN-REVIEW.json");
  const expected = {hypothesis: "0a0ac6f13449118046e4601c171144f509401f42627adc61d869a425ca846df0", results: "473cfeacf2d466f5e36f26da5553d991bd87867919e1755cbd97253224f845a2", review: "19fb7200ce58586570d6001a36a9450dcb70de7d6e54731a52e9262d8632bddb"};
  need(sha(readFileSync(hypothesisPath)) === expected.hypothesis && sha(readFileSync(historicalResultsPath)) === expected.results && sha(readFileSync(historicalReviewPath)) === expected.review, "historical-drift");
  const hypothesis = readJson(hypothesisPath); need(hypothesis.selected_hypothesis?.hypothesis_ref === "hypothesis:H-EN-R3-intent-anchor-convergence", "hypothesis");
  mkdirSync(join(outputRoot, "views"), {recursive: true, mode: 0o700});
  try {
    const priorConfigPath = join(priorRoot, "CONFIG.json"), priorConfig = readJson(priorConfigPath), taskIds = ["contextbench-1", "contextbench-4"];
    const taskSources = new Map(), repositorySources = new Map();
    const tasks = taskIds.map(id => { const task = priorConfig.tasks.find(item => item.id === id); need(task, `task:${id}`); const bytes = readFileSync(task.task_path); need(sha(bytes) === task.task_sha256, `task-drift:${id}`); taskSources.set(id, task.task_path); repositorySources.set(id, task.repository_cache); const cloned = structuredClone(task); if (deployed) { cloned.task_path = runtimePath(task.task_path); cloned.repository_cache = join(targetRoot, "repositories", id); } return cloned; });
    const config = {...priorConfig, experiment_id: "hen-11-contextbench-intent-anchor-r3", tasks};
    const actualUpstream = "/home/vlad_/.local/share/are/contextbench-upstream-117", actualScoringCache = "/home/vlad_/.local/share/are/contextbench-retained-v1/contextbench-round52-score-cache";
    if (deployed) { need(existsSync(actualUpstream) && existsSync(actualScoringCache), "scoring-assets"); config.scorer = runtimePath(config.scorer); config.source_manifest = runtimePath(config.source_manifest); config.scoring_cache = join(targetRoot, "scoring-cache"); config.upstream = join(targetRoot, "upstream"); config.credential_path = "vps-container-secret://are-keld-presentation-provider-gateway-1/run/secrets/model_api_key"; }
    const configBytes = `${canonicalJson(config)}\n`, configLocalPath = join(outputRoot, "CONFIG.json"), configPath = join(targetRoot, "CONFIG.json"); writeFileSync(configLocalPath, configBytes, {flag: "wx", mode: 0o600});
    const cohort = {schema_version: "are.hen11-two-task-cohort/v1", cohort: tasks.map(task => ({task_id: task.id, instance_id: task.instance_id, task_path: task.task_path, task_sha256: task.task_sha256, base_commit: task.base_commit})), source_config_sha256: sha(configBytes), hypothesis_ref: hypothesis.selected_hypothesis.hypothesis_ref,
      maximum_total_model_tokens: 192000, maximum_model_calls: 192, maximum_workers: 2, control_runs: 0, dispatch_admitted: false, authority_effect: "none"};
    const cohortBytes = `${canonicalJson(cohort)}\n`, cohortLocalPath = join(outputRoot, "COHORT.json"), cohortPath = join(targetRoot, "COHORT.json"); writeFileSync(cohortLocalPath, cohortBytes, {flag: "wx", mode: 0o600});
    const {buildIntentAnchorCell, INTENT_ANCHOR_ARM} = await import(join(contextRoot, "intent-anchor-arm-r3.mjs"));
    const builderConfig = {...priorConfig, experiment_id: "hen-11-contextbench-intent-anchor-r3", tasks: taskIds.map(id => structuredClone(priorConfig.tasks.find(task => task.id === id)))};
    const remapCell = value => { if (!deployed) return value; if (Array.isArray(value)) return value.map(remapCell); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, remapCell(child)])); if (typeof value !== "string") return value; if (value.startsWith(`${repositoryRoot}/`)) return runtimePath(value); for (const [id, local] of repositorySources) if (value === local || value.startsWith(`${local}/`)) return `${tasks.find(task => task.id === id).repository_cache}${value.slice(local.length)}`; return value; };
    const slots = tasks.map((task, sequence) => { const cell = remapCell(buildIntentAnchorCell({config: builderConfig, task_id: task.id, arm: INTENT_ANCHOR_ARM})); return {sequence, slot_id: `${task.id}--${INTENT_ANCHOR_ARM}`, task_id: task.id, instance_id: task.instance_id, task_path: task.task_path, task_sha256: task.task_sha256, arm: INTENT_ANCHOR_ARM, role: "candidate", cell, cell_sha256: sha(canonicalJson(cell))}; });
    const scheduleBody = {schema_version: "are.hen11-intent-anchor-schedule/v1", candidates: [INTENT_ANCHOR_ARM], slots, assigned_outcomes: 2, maximum_total_model_tokens: 192000, maximum_model_calls: 192, maximum_workers: 2, fresh_control_runs: false, dispatch_admitted: false, authority_effect: "none"};
    const schedule = {...scheduleBody, schedule_sha256: sha(canonicalJson(scheduleBody))};
    const viewSources = new Map();
    const candidate_views = taskIds.map(id => { const source = join(priorRoot, "views", `${id}.json`), bytes = readFileSync(source), value = JSON.parse(bytes), localPath = join(outputRoot, "views", `${id}.json`), path = join(targetRoot, "views", `${id}.json`); writeFileSync(localPath, bytes, {flag: "wx", mode: 0o600}); viewSources.set(id, source); return {task_ref: id, path, sha256: sha(bytes), view_digest: value.view_digest}; });
    const preparePath = new URL(import.meta.url).pathname, runPath = new URL("./run.mjs", import.meta.url).pathname, scorePath = new URL("./score.mjs", import.meta.url).pathname,
      hostPath = new URL("./run-host.mjs", import.meta.url).pathname,
      launchPath = new URL("./launch-vps.mjs", import.meta.url).pathname,
      continuationLaunchPath = new URL("./launch-continuation-vps.mjs", import.meta.url).pathname,
      verifyPackagePath = new URL("./verify-vps-package.mjs", import.meta.url).pathname,
      remoteBridgePath = new URL("./vps-local-glm-v1.mjs", import.meta.url).pathname;
    const localExecutableEntries = [preparePath, runPath, hostPath, scorePath, launchPath, continuationLaunchPath, verifyPackagePath, remoteBridgePath, join(contextRoot, "intent-anchor-arm-r3.mjs"), join(contextRoot, "candidate-only-source-freeze.mjs"),
      // The source-index JS worker launches this Python supervisor, whose local
      // imports are not visible to the JavaScript dependency collector.
      join(contextRoot, "ranked_source_supervisor_r1.py"), join(contextRoot, "ranked_source_worker_r2.py"), join(contextRoot, "ranked_source_hints_r3.py")];
    const {collectCandidateSources} = await import(join(contextRoot, "candidate-only-source-freeze.mjs"));
    const sourceMap = new Map(collectCandidateSources(localExecutableEntries).map(binding => [binding.path, binding.sha256]));
    const boundedScorerPath = join(contextRoot, "packet-diversity-v1/score-native-bounded-v3.py"), configuredScorerPath = priorConfig.scorer, configuredSourceManifestPath = priorConfig.source_manifest;
    for (const path of [hypothesisPath, historicalResultsPath, historicalReviewPath, priorConfigPath, boundedScorerPath, configuredScorerPath, configuredSourceManifestPath]) sourceMap.set(path, sha(readFileSync(path)));
    const runRoot = join(targetRoot, "run"), sources = {config_path: configPath, config_sha256: sha(configBytes), cohort_path: cohortPath, cohort_sha256: sha(cohortBytes)};
    const executable_entries = localExecutableEntries.map(path => deployed ? runtimePath(path) : path);
    const source_bindings = [...sourceMap].map(([path, sha256]) => ({path: deployed ? runtimePath(path) : path, sha256})).sort((left, right) => left.path.localeCompare(right.path));
    const {HEN11_VPS_TOPOLOGY} = await import(remoteBridgePath);
    const repositories = [...repositorySources].map(([task_id, local_path]) => ({task_id, local_path, remote_path: tasks.find(task => task.id === task_id).repository_cache, ...treeBinding(local_path)}));
    const scoring_assets = deployed ? [{name: "upstream", local_path: actualUpstream, remote_path: config.upstream, ...treeBinding(actualUpstream)}, {name: "scoring-cache", local_path: actualScoringCache, remote_path: config.scoring_cache, ...treeBinding(actualScoringCache)}] : [];
    const deploymentMaterial = {target_root: targetRoot, runtime_repository_root: runtimeRepositoryRoot, execution_host: HEN11_VPS_TOPOLOGY.host, source_bindings_sha256: sha(canonicalJson(source_bindings)), config_sha256: sha(configBytes), cohort_sha256: sha(cohortBytes), repositories: repositories.map(({task_id, remote_path, files, bytes, tree_sha256}) => ({task_id, remote_path, files, bytes, tree_sha256})), scoring_assets: scoring_assets.map(({name, remote_path, files, bytes, tree_sha256}) => ({name, remote_path, files, bytes, tree_sha256}))};
    const freeze = {schema_version: "are.hen11-contextbench-intent-anchor-freeze/v1", objective_ref: "objective:glm8k-contextbench-context-selection", hypothesis_ref: hypothesis.selected_hypothesis.hypothesis_ref,
      model: "glm-5.3-flash", context_limit: 8000, output_cap: 2048, candidate_only: true, control_runs: 0, task_denominator: taskIds, maximum_workers: 2, maximum_model_calls: 192, maximum_model_tokens: 192000, maximum_automatic_retries: 0,
      maximum_campaign_elapsed_seconds: 14400, execution_host: "187.77.163.194", execution_topology: {kind: "vps-native", ...HEN11_VPS_TOPOLOGY}, remote_provider_bridge: {path: deployed ? runtimePath(remoteBridgePath) : remoteBridgePath, sha256: sourceMap.get(remoteBridgePath)},
      node_runtime: {path: HEN11_VPS_TOPOLOGY.node_path, version: HEN11_VPS_TOPOLOGY.node_version, sha256: HEN11_VPS_TOPOLOGY.node_sha256, required_node_options: ["--experimental-vm-modules"], launch_wrapper: deployed ? runtimePath(launchPath) : launchPath}, deployment: {...deploymentMaterial, deployment_digest: sha(canonicalJson(deploymentMaterial))},
      native_scoring_runtime: [{role: "bounded_scorer", path: deployed ? runtimePath(boundedScorerPath) : boundedScorerPath, sha256: sourceMap.get(boundedScorerPath)}, {role: "configured_wrapper", path: config.scorer, sha256: sourceMap.get(configuredScorerPath)}, {role: "source_manifest", path: config.source_manifest, sha256: sourceMap.get(configuredSourceManifestPath)}],
      native_scoring_environment: {python: {path: "/usr/bin/python3", sha256: "52e0a13e60a981d8c4b6478be2ba5176f69da07948a056bf49cf6f077e30cb41", version: "3.14.4"}, sandbox: {path: "/usr/bin/bwrap", sha256: "523da3e7399044be5163aee6f57a77a6bef7454376e28f0a0627920bae1b76b6"}, modules: {pyarrow: "23.0.1", tree_sitter: "0.26.0", tree_sitter_language_pack: "1.16.2"}},
      execution_mode: "development", development_execution: {prelaunch_authorization_required: false, cryptographic_signatures_required: false, freeze_consumption_receipt_required: true, independent_postrun_review_required: true},
      phase_contract: {per_task: {exploration_tokens: 88000, exploration_calls: 95, finalization_tokens: 8000, finalization_calls: 1}}, sources, schedule, candidate_views,
      historical_comparison: {results_path: deployed ? runtimePath(historicalResultsPath) : historicalResultsPath, results_sha256: expected.results, review_path: deployed ? runtimePath(historicalReviewPath) : historicalReviewPath, review_sha256: expected.review, task_1_span_f1: 0, two_task_mean_span_f1: 0.07327183777122158, task_4_span_f1: 0.14654367554244316},
      acceptance: {task_1_span_f1_greater_than: 0, two_task_mean_span_f1_greater_than: 0.07327183777122158, task_4_span_f1_at_least: 0.12654367554244316},
      roots: {runs_root: join(runRoot, "runs_root"), metadata_root: join(runRoot, "metadata_root"), source_root: join(runRoot, "source_root")}, executable_entries, source_bindings,
      source_bindings_sha256: sha(canonicalJson(source_bindings)),
      launch: {dispatch_admitted: true, runner_present: true, prelaunch_authorization_required: false, freeze_single_use: true, independent_postrun_review_required: true}, provider_calls: 0, model_calls: 0,
      claim_ceiling: "Two exposed development tasks only; no fresh control, untouched-set, generalization, release, deployment, or scientific-acceptance claim.", authority_effect: "none", open_questions: ["Independent post-run evaluation remains required before accepting the result."]};
    const bytes = `${canonicalJson(freeze)}\n`; writeFileSync(join(outputRoot, "FREEZE.json"), bytes, {flag: "wx", mode: 0o600}); writeFileSync(join(outputRoot, "FREEZE.sha256"), `${sha(bytes)}  FREEZE.json\n`, {flag: "wx", mode: 0o600});
    if (deployed) {
      const files = [...sourceMap].map(([local_path, sha256]) => ({local_path, remote_path: runtimePath(local_path), sha256}));
      for (const [id, local_path] of taskSources) files.push({local_path, remote_path: tasks.find(task => task.id === id).task_path, sha256: tasks.find(task => task.id === id).task_sha256});
      for (const [id, local_path] of viewSources) files.push({local_path, remote_path: candidate_views.find(view => view.task_ref === id).path, sha256: candidate_views.find(view => view.task_ref === id).sha256});
      files.push({local_path: configLocalPath, remote_path: configPath, sha256: sha(configBytes)}, {local_path: cohortLocalPath, remote_path: cohortPath, sha256: sha(cohortBytes)}, {local_path: join(outputRoot, "FREEZE.json"), remote_path: join(targetRoot, "FREEZE.json"), sha256: sha(bytes)});
      const transfer = {schema_version: "are.hen11-vps-transfer-manifest/v1", deployment_digest: freeze.deployment.deployment_digest, target_root: targetRoot, runtime_repository_root: runtimeRepositoryRoot, execution_host: "187.77.163.194", files: files.sort((a, b) => a.remote_path.localeCompare(b.remote_path)), repositories, scoring_assets, launch: {node: HEN11_VPS_TOPOLOGY.node_path, arguments: ["--experimental-vm-modules", runtimePath(launchPath), join(targetRoot, "FREEZE.json"), "<FREEZE_SHA256>"], disabled: false}, provider_calls: 0, model_calls: 0, authority_effect: "none"};
      writeFileSync(join(outputRoot, "TRANSFER-MANIFEST.json"), `${canonicalJson(transfer)}\n`, {flag: "wx", mode: 0o600});
    }
    return {output_root: outputRoot, freeze_sha256: sha(bytes), schedule_sha256: schedule.schedule_sha256, tasks: 2, provider_calls: 0, model_calls: 0, dispatch_admitted: true, prelaunch_authorization_required: false};
  } catch (error) { rmSync(outputRoot, {recursive: true, force: true}); throw error; }
}

if (process.argv[1] === import.meta.filename) console.log(canonicalJson(await prepareHen11({repositoryRoot: process.argv[2], outputRoot: process.argv[3]})));
