// Additive HEN-11 orchestration. Frozen HEN-10 orchestration remains unchanged.
import {mkdirSync, readFileSync, existsSync, lstatSync, realpathSync} from "node:fs";
import {resolve, join, relative, dirname, sep} from "node:path";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {createToolArchiveJournal} from "../tool-archive-references.mjs";
import {runIntentAnchorNativeEpisode} from "../intent-anchor-native-driver-r3.mjs";
import {createSourceHintService} from "../ranked-source-index-service-r1.mjs";
import {exportIndependentTerminalSelection} from "../bounded-archive-frontier-terminal-export-r1.mjs";
import {providerAttemptHealth} from "../provider-attempt-health.mjs";
import {createRepositoryTools, tools as repositoryTools} from "../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs";
import {stable} from "../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs";
import {refineSelectedSpans} from "../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/span-refinement-r1.mjs";
import {prepareOverlaySourceCheckout} from "../../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/overlay-source-layout-r1.mjs";

const hash = value => createHash("sha256").update(value).digest("hex");
const ARMS = new Set(["intent-anchor-convergence-r3", "intent-anchor-source-neighborhood-r1", "intent-anchor-search-followthrough-r1", "intent-anchor-objective-search-r1", "intent-anchor-api-search-r1", "intent-anchor-api-search-r2", "intent-anchor-api-search-r3", "intent-anchor-terminal-shortlist-r1", "intent-anchor-terminal-shortlist-cap12-r1", "intent-anchor-terminal-shortlist-adaptive-r1", "intent-anchor-terminal-shortlist-objective-r1", "intent-anchor-terminal-shortlist-distinctive-r1", "intent-anchor-terminal-shortlist-distinctive-early-r1", "intent-anchor-terminal-shortlist-distinctive-conditional-r1", "intent-anchor-terminal-shortlist-distinctive-identifier-r1", "intent-anchor-terminal-shortlist-distinctive-reasoning-view-r1", "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1", "intent-anchor-terminal-shortlist-uncovered-requirement-r1"]);
const git = (cwd, args) => execFileSync("git", ["-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args], {cwd, encoding: "utf8", timeout: 120000, maxBuffer: 16000000});

export function applyLiveSpanRefinement({original, problem_statement, task_sha256, source_base}) {
  const sourceHashes = {}, base = realpathSync(source_base);
  const sourceForPath = path => {
    if (typeof path !== "string" || path.startsWith("/") || path.includes("\\") || path.split("/").some(piece => !piece || piece === "." || piece === "..")) throw new Error("intent-anchor-orchestration.refinement-source-path");
    const target = realpathSync(resolve(base, path));
    if (!target.startsWith(base + sep)) throw new Error("intent-anchor-orchestration.refinement-source-escape");
    const bytes = readFileSync(target); sourceHashes[path] = hash(bytes);
    return new TextDecoder("utf-8", {fatal: true, ignoreBOM: true}).decode(bytes);
  };
  const refined = refineSelectedSpans({prediction: original.prediction, problemStatement: problem_statement, sourceForPath});
  const receipt = {schema_version: "are.g01-live-span-refinement/v1", policy: "source-only-go-selected-subspan-r1",
    source_only: true, task_sha256, original_export_sha256: hash(stable(original)), original_prediction_sha256: hash(stable(original.prediction)),
    source_sha256_by_path: sourceHashes, changes: refined.changes, final_prediction_sha256: hash(stable(refined.prediction)),
    claim_ceiling: "Candidate finalization evidence only; benchmark quality requires sealed native scoring and an independent holdout."};
  return {exported: {...original, prediction: refined.prediction, span_refinement: receipt}, receipt};
}

// A depth-one file-transport fetch owns its commit/tree/blob objects. Unlike
// --shared or --local clone it has no alternate or hardlink dependency on the
// cache, while avoiding the unrelated history copied by --no-local clone.
export function prepareIsolatedShallowSourceCheckout({cache, destination, base_commit}) {
  if (typeof cache !== "string" || resolve(cache) !== cache || typeof destination !== "string" || resolve(destination) !== destination ||
      !/^[a-f0-9]{40}$/.test(base_commit) || existsSync(destination)) throw new Error("intent-anchor-orchestration.shallow-checkout-arguments");
  git(dirname(destination), ["init", "--quiet", destination]);
  git(destination, ["-c", "protocol.file.allow=always", "fetch", "--depth=1", "--no-tags", `file://${cache}`, base_commit]);
  git(destination, ["checkout", "--detach", "--quiet", base_commit]);
  git(destination, ["remote", "add", "origin", cache]);
  const head = git(destination, ["rev-parse", "HEAD"]).trim();
  const tree = git(destination, ["rev-parse", `${base_commit}^{tree}`]).trim();
  const expectedTree = git(cache, ["rev-parse", `${base_commit}^{tree}`]).trim();
  if (head !== base_commit || tree !== expectedTree || git(destination, ["rev-parse", "--is-shallow-repository"]).trim() !== "true" ||
      existsSync(join(destination, ".git", "objects", "info", "alternates")) || git(destination, ["status", "--porcelain"]).trim())
    throw new Error("intent-anchor-orchestration.shallow-checkout-integrity");
  return {head, tree};
}

export async function runPreparedIntentAnchorTask(options) {
  const state = {client: null, result: null, persisted_result: null, episode_entered: false, errors: []};
  try { return await runPreparedIntentAnchorTaskImpl(options, state); }
  catch (error) {
    const receipts = state.client?.receipts ?? [], models = receipts.filter(receipt => receipt.kind === "model");
    const known = models.every(receipt => receipt.dispatched === false || (receipt.dispatched === true && Number.isSafeInteger(receipt.input_tokens) && receipt.input_tokens >= 0 && Number.isSafeInteger(receipt.output_tokens) && receipt.output_tokens >= 0));
    const unknown_usage = !known || (state.episode_entered && models.length === 0), usage = {prompt_tokens: 0, completion_tokens: 0, total_tokens: 0};
    if (!unknown_usage) for (const receipt of models) if (receipt.dispatched) { usage.prompt_tokens += receipt.input_tokens; usage.completion_tokens += receipt.output_tokens; usage.total_tokens += receipt.input_tokens + receipt.output_tokens; }
    const result = state.persisted_result ?? {...(state.result ?? {}), status: "orchestration_error", error: String((state.original_error ?? error).message), persistence_failures: state.errors, receipts, native_export: null, benchmark_cleared: false, unknown_usage};
    throw Object.assign(new Error(`intent-anchor-orchestration.failed-with-accounting: ${String((state.original_error ?? error).message)}; final failure: ${String(error.message)}`), {cause: state.original_error ?? error, final_error: error, persistence_failure: state.errors.length > 0, persistence_failures: structuredClone(state.errors), canonical_result_preserved: state.persisted_result !== null, original_receipt: (state.original_error ?? error).receipt ?? null, result, receipts, unknown_usage, ...(!unknown_usage ? {usage, receipt: {kind: "orchestration", usage, persistence_failure: state.errors.length > 0}} : {})});
  }
}

async function runPreparedIntentAnchorTaskImpl({task_path, task_sha256, repository_cache, out, cell, create_client, measure_index_tokens, non_tool_terminal_after_convergence = false, late_bind_delivered_base = false, candidate_view, model_dispatch_enabled = true, signal, before_model_dispatch = async () => true, persistence, evidence_root, source_out, admit_source, transport_reliability, span_refinement_policy = null, source_checkout_layout = null}, state) {
  const guarded = (stage, operation) => { try { return operation(); } catch (error) { state.errors.push({stage, error: String(error.message), code: error.code ?? null}); state.original_error ??= error; throw error; } };
  if (!persistence || !["writeJson", "append", "atomicJson", "createLock", "removeLock"].every(key => typeof persistence[key] === "function")) throw new Error("intent-anchor-orchestration.guarded-persistence-required");
  if (typeof source_out !== "string" || typeof evidence_root !== "string" || typeof admit_source !== "function") throw new Error("intent-anchor-orchestration.source-admission-required");
  const save = (path, value) => guarded(`save:${path}`, () => persistence.writeJson(path, value));
  if (cell?.context_limit !== 8000 || ![96000, 160000].includes(cell?.limits?.total_tokens) || cell?.limits?.maximum_calls !== 96 || !Number.isSafeInteger(cell?.limits?.output_cap) || cell.limits.output_cap < 1 || cell.limits.output_cap > 2048 || cell?.phase_contract?.exploration_tokens !== cell.limits.total_tokens - 8000 || cell?.phase_contract?.finalization_tokens !== 8000) throw new Error("intent-anchor-orchestration.independent-cell-limits");
  if (!ARMS.has(cell.comparison_arm) || cell.context_projection !== cell.comparison_arm) throw new Error("intent-anchor-orchestration.comparison-arm");
  if (span_refinement_policy !== null && (span_refinement_policy !== "source-only-go-selected-subspan-r1" || cell.comparison_arm !== "intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1")) throw new Error("intent-anchor-orchestration.span-refinement-policy");
  if (source_checkout_layout !== null && (!["g01-r15-r2-single-lower-overlay-r1", "g01-r16-r2-single-lower-overlay-r1"].includes(source_checkout_layout?.mode) ||
      !Number.isSafeInteger(source_checkout_layout.ordinal) || source_checkout_layout.ordinal < 1 || source_checkout_layout.ordinal > 24 ||
      Object.keys(source_checkout_layout).sort().join(",") !== "mode,ordinal"))
    throw new Error("intent-anchor-orchestration.source-checkout-layout");
  const taskBytes = readFileSync(task_path); if (hash(taskBytes) !== task_sha256) throw new Error("intent-anchor-orchestration.task-digest");
  const task = JSON.parse(taskBytes), allowed = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
  if (Object.keys(task).length !== allowed.length || !allowed.every(key => typeof task[key] === "string" && task[key].length > 0) || Object.keys(task).some(key => !allowed.includes(key))) throw new Error("intent-anchor-orchestration.task-fields");
  if (!/^[a-f0-9]{40}$/.test(task.base_commit) || cell.instance_id !== task.instance_id) throw new Error("intent-anchor-orchestration.task-cell-mismatch");
  if (typeof create_client !== "function" || typeof measure_index_tokens !== "function") throw new Error("intent-anchor-orchestration.client-required");

  const root = resolve(out), cache = resolve(repository_cache), sourceRoot = resolve(source_out), evidenceRoot = resolve(evidence_root);
  for (const path of [root, cache, sourceRoot, evidenceRoot]) {
    let cursor = sep;
    for (const piece of path.split(sep).filter(Boolean)) { cursor = join(cursor, piece); try { if (lstatSync(cursor).isSymbolicLink()) throw new Error("intent-anchor-orchestration.symlink-path"); } catch (error) { if (error.code !== "ENOENT") throw error; } }
  }
  const within = (left, right) => { const path = relative(left, right); return path === "" || (!path.startsWith(`..${sep}`) && path !== ".." && !path.startsWith(sep)); };
  if (!within(evidenceRoot, root) || root === evidenceRoot || within(evidenceRoot, sourceRoot) || within(sourceRoot, evidenceRoot) || within(cache, sourceRoot) || within(sourceRoot, cache) || within(cache, evidenceRoot) || within(evidenceRoot, cache)) throw new Error("intent-anchor-orchestration.source-evidence-overlap");
  if (existsSync(sourceRoot)) throw new Error("intent-anchor-orchestration.existing-source-no-replay");
  if (existsSync(root)) throw new Error("intent-anchor-orchestration.existing-run-no-replay");
  if (git(cache, ["remote", "get-url", "origin"]).trim() !== task.repo_url) throw new Error("intent-anchor-orchestration.repository-identity");
  git(cache, ["cat-file", "-e", `${task.base_commit}^{commit}`]);
  if (await admit_source({task, cache, source_root: sourceRoot, phase: "before-prepare"}) !== true) throw new Error("intent-anchor-orchestration.source-admission-denied");

  mkdirSync(root, {recursive: true, mode: 0o700});
  save(join(root, "started.json"), {task_sha256, cell, status: "started", authority_effect: "none"});
  const journal = join(root, "events.jsonl"), snapshots = new Map(), terminalEvents = [];
  const appendJournal = createToolArchiveJournal({journal, append: text => persistence.append(journal, text)});
  const append = value => guarded("journal-append", () => { appendJournal(value); if (["request-capture", "response-capture", "terminal-packet"].includes(value.kind)) terminalEvents.push(structuredClone(value)); });
  let client, result, source_hints;
  try {
    mkdirSync(sourceRoot, {recursive: true, mode: 0o700});
    for (const name of ["base", "work"]) {
      if (await admit_source({task, cache, source_root: sourceRoot, phase: `before-${name}`}) !== true) throw new Error("intent-anchor-orchestration.source-admission-denied");
      if (source_checkout_layout) prepareOverlaySourceCheckout({mode: source_checkout_layout.mode, ordinal: source_checkout_layout.ordinal,
        destination: join(sourceRoot, name), cache, base_commit: task.base_commit});
      else prepareIsolatedShallowSourceCheckout({cache, destination: join(sourceRoot, name), base_commit: task.base_commit});
    }
    mkdirSync(join(root, "snapshots"));
    const record_source = snapshot => { const key = hash(stable([snapshot.path, snapshot.source_sha256])); if (!snapshots.has(key)) { save(join(root, "snapshots", `${key}.json`), snapshot); snapshots.set(key, snapshot); } };
    const execute_tool = createRepositoryTools({root: join(sourceRoot, "work"), base_commit: task.base_commit, record_source});
    source_hints = await createSourceHintService({repository: join(sourceRoot, "base"), base_commit: task.base_commit, signal, save_manifest: value => save(join(root, "source-index.json"), value), record: append, before_index: () => admit_source({task, cache, source_root: sourceRoot, phase: "before-work"})});
    client = await create_client({cell, task, record_event: append, signal}); state.client = client;
    const scope = {request: task.problem_statement, instance_id: task.instance_id, cell_id: cell.cell_id, cell_sha256: hash(stable(cell))};
    state.episode_entered = true;
    const episode = await runIntentAnchorNativeEpisode({arm: cell.comparison_arm, native: {client, profile: {model: client.model, reasoning_effort: cell.provider_profile.reasoning_effort, output_cap: cell.limits.output_cap}, scope, fixture_root: join(sourceRoot, "base"), directory: join(root, "state"), persistence, signal,
      before_dispatch: async () => model_dispatch_enabled && !signal?.aborted && providerAttemptHealth([...(client.receipts ?? []), ...(client.index_receipts ?? [])]).healthy && await before_model_dispatch() === true},
      task, source_hints, candidate_view, tools: repositoryTools, execute_tool: async (name, args) => { if (!repositoryTools.some(tool => tool.function.name === name)) throw new Error("intent-anchor-orchestration.unknown-task-tool"); return execute_tool(name, args); },
      source_context: () => ({snapshots: [...snapshots.values()], repoRoot: join(sourceRoot, "base")}), measure_tokens: text => measure_index_tokens(text, client), persist: append, output_cap: cell.limits.output_cap, transport_reliability, non_tool_terminal_after_convergence, late_bind_delivered_base});
    result = {...episode, index_tokenizer_receipts: client.index_receipts ?? [], instance_id: task.instance_id, cell_id: cell.cell_id, task_sha256, source_root: sourceRoot, patch: git(join(sourceRoot, "work"), ["diff", "--no-ext-diff", "--no-textconv", "--binary", task.base_commit, "--"]), native_export: null};
    state.result = result; save(join(root, "episode.json"), episode);
    if (episode.status === "final_context_selected" && episode.exported?.selection) {
      try {
        if (episode.branches.length !== 1 || episode.phase_state.closed !== true) throw new Error("intent-anchor-orchestration.incomplete-investigations");
        const end = episode.branches[0].receipt_indices.at(-1) + 1, branch_inputs = {branches: episode.branches, receipts: episode.receipts.slice(0, end)};
        const packetEvent = terminalEvents.find(event => event.kind === "terminal-packet"), packetIndex = terminalEvents.indexOf(packetEvent);
        if (packetIndex < 0) throw new Error("intent-anchor-orchestration.missing-terminal-packet");
        const finalEvents = terminalEvents.slice(packetIndex + 1), terminal_captures = finalEvents.filter(event => event.kind === "request-capture" && event.phase === "join").map(event => event.capture);
        const response_capture = finalEvents.filter(event => event.kind === "response-capture" && event.phase === "join").at(-1)?.response_capture;
        result.native_export = exportIndependentTerminalSelection({joined: packetEvent.joined, packet: packetEvent.packet, branch_inputs, terminal_captures, receipts: episode.receipts, response_capture, snapshots: [...snapshots.values()], task, repoRoot: join(sourceRoot, "base")});
        if (stable(result.native_export) !== stable(episode.exported)) throw new Error("intent-anchor-orchestration.selection-export-mismatch");
        if (span_refinement_policy) {
          const {exported, receipt} = applyLiveSpanRefinement({original: result.native_export, problem_statement: task.problem_statement, task_sha256, source_base: join(sourceRoot, "base")});
          save(join(root, "span-refinement.json"), receipt);
          result.native_export = exported;
        }
        save(join(root, "prediction.json"), result.native_export.prediction); save(join(root, "export-evidence.json"), result.native_export);
      } catch (error) { result.export_error = String(error.message); result.native_export = null; result.status = "native_export_error"; }
    }
    if (git(join(sourceRoot, "base"), ["status", "--porcelain"]).trim()) throw new Error("intent-anchor-orchestration.base-mutated");
  } catch (error) {
    state.original_error ??= error; result = {...(result ?? {}), status: "orchestration_error", error: String(error.message), receipts: client?.receipts ?? []}; state.result = result;
    append({kind: "orchestration-error", error: result.error}); throw error;
  } finally {
    source_hints?.close();
    if (result) {
      if (state.errors.length || state.original_error) { result = {...result, status: "orchestration_error", native_export: null, benchmark_cleared: false}; state.result = result; }
      const snapshot = JSON.parse(stable({...result, receipts: client?.receipts ?? result.receipts ?? [], index_tokenizer_receipts: client?.index_receipts ?? result.index_tokenizer_receipts ?? []}));
      result = snapshot; save(join(root, "result.json"), snapshot);
      if (hash(readFileSync(join(root, "result.json"))) !== hash(stable(snapshot))) throw new Error("intent-anchor-orchestration.persisted-result-mismatch");
      state.persisted_result = snapshot; save(join(root, "completed.json"), {status: result.status, result_sha256: hash(readFileSync(join(root, "result.json"))), benchmark_cleared: false});
    }
  }
  if (state.errors.length) throw state.original_error;
  return result;
}
