import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync} from "node:fs";
import {basename, dirname, join, relative, resolve} from "node:path";

import {canonicalJson} from "../../../intent-route-resolver/index.mjs";
import {materializeHenCandidateView} from "../../src/hen-candidate-view-v1.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const need = (value, reason) => { if (!value) throw new Error(`hen09-prepare.${reason}`); };
const INDEX_PREFIX = "Pinned source index";
const LEDGER_PREFIX = "Evidence coverage ledger (not relevance or gold coverage): ";

function replaceSystem(messages, prefix, content) {
  const matches = messages.map((message, index) => ({message, index}))
    .filter(({message}) => message.role === "system" && message.content?.startsWith(prefix));
  need(matches.length === 1, `system-message:${prefix}`);
  messages[matches[0].index].content = content;
}

function visibleLedger(ledger, included) {
  need(Number.isSafeInteger(included) && included >= 0 && included <= 4 && included <= ledger.entries.length,
    "ledger-included");
  const entries = ledger.entries.slice(0, included).map(({observation_ids: _ids, ...entry}) => entry);
  return JSON.stringify({claim: ledger.claim, entries, omitted_entries: ledger.entries.length - entries.length});
}

function bindView(wire, view, presentation = {kind: "full-audit-v1"}) {
  const candidate = structuredClone(wire);
  const content = presentation.kind === "adaptive-compact-v2"
    ? `Evidence-neighborhood hints (untrusted; read_file verifies source): ${canonicalJson({
      schema_version: "are.hen-model-hints/v1", view_digest: view.view_digest,
      hints: view.hint_payload.records.slice(0, presentation.records).map((record) =>
        [record[0], record[1], record[2]]),
    })}`
    : `Evidence-neighborhood candidate view (hints only; read_file grants evidence): ${canonicalJson(view)}`;
  replaceSystem(candidate.messages, INDEX_PREFIX, content);
  return candidate;
}

export async function prepareHen09Qualification({repositoryRoot, outputRoot,
  presentationPolicy = "full-audit-v1"}) {
  repositoryRoot = resolve(repositoryRoot);
  outputRoot = resolve(outputRoot);
  need(!existsSync(outputRoot), "output-exists");
  const contextRoot = join(repositoryRoot,
    "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench");
  const runtimeRoot = join(repositoryRoot, "implementation/agent-reasoning-engine/packages/evolution-runtime");
  const taskRoot = join(repositoryRoot,
    "implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round52");
  const replayPath = join(contextRoot, "EVIDENCE-NEIGHBORHOOD-FRONTIER-REPLAY-R7.json");
  const replay = readJson(replayPath);
  need(replay.provider_calls === 0 && replay.model_calls === 0 && replay.rows?.length === 4, "replay");

  const {buildCoverageLedger} = await import(join(contextRoot, "recent-evidence-ledger-r1.mjs"));
  const {restoreRankedContext} = await import(join(contextRoot, "ranked-read-prediction-r1.mjs"));
  const {restoreRankedReadEvidenceMap} = await import(join(contextRoot, "ranked-read-evidence-r1.mjs"));
  const production = join(contextRoot, "schema-agreement-production-live-r1");
  const temp = `${outputRoot}.partial-${process.pid}`;
  mkdirSync(join(temp, "prompts"), {recursive: true, mode: 0o700});
  const requests = [], sources = new Map();
  const bindSource = (path) => sources.set(relative(repositoryRoot, path), sha(readFileSync(path)));
  bindSource(replayPath);
  bindSource(join(runtimeRoot, "evidence/HEN-07-08-PROVIDER-FREE-COMPLETION.v1.json"));
  try {
    for (const [sequence, row] of replay.rows.entries()) {
      const taskPath = join(taskRoot, `${row.instance_id}.json`);
      const task = readJson(taskPath);
      need(task.instance_id === row.instance_id && task.base_commit === row.query_results[0].hints[0].base_commit,
        `task:${sequence}`);
      bindSource(taskPath);
      const materialized = materializeHenCandidateView({task_ref: row.task_id, query_results: row.query_results});
      need(materialized.ok, `view:${sequence}`);
      const view = materialized.value;
      const ordinal = String(sequence).padStart(2, "0");
      const initialPath = join(contextRoot,
        `recent-evidence-initial-tokenizer-live-r1/metadata_root/prompts/${ordinal}.json`);
      const populatedPath = join(contextRoot,
        `recent-evidence-populated-tokenizer-live-r3/output/${ordinal}/RESULTS.json`);
      const finalPath = join(contextRoot,
        `recent-evidence-final-tokenizer-live-r1/output/${ordinal}/RESULTS.json`);
      [initialPath, populatedPath, finalPath].forEach(bindSource);

      const runRoot = join(production, "runs_root", ordinal);
      const resultPath = join(runRoot, "result.json");
      const eventsPath = join(runRoot, "events.jsonl");
      const sourceIndexPath = join(runRoot, "source-index.json");
      const snapshotRoot = join(runRoot, "snapshots");
      const historicalResult = readJson(resultPath);
      const events = readFileSync(eventsPath, "utf8").trimEnd().split("\n").map(JSON.parse);
      const snapshots = readdirSync(snapshotRoot).sort().map((name) => readJson(join(snapshotRoot, name)));
      const context = restoreRankedContext({source_index: readJson(sourceIndexPath), snapshots, task});
      const ranked_evidence = restoreRankedReadEvidenceMap(
        historicalResult.branches[0].ranked_evidence_records, context);
      const donorMaterial = {task_ref: row.task_id, instance_id: row.instance_id,
        result_sha256: sha(readFileSync(resultPath)), events_sha256: sha(readFileSync(eventsPath)),
        source_index_sha256: sha(readFileSync(sourceIndexPath)),
        snapshot_set: readdirSync(snapshotRoot).sort().map((name) => ({name,
          sha256: sha(readFileSync(join(snapshotRoot, name)))}))};
      const donor = {task, events, receipts: historicalResult.receipts, snapshots, ranked_evidence,
        donor_sha256: sha(canonicalJson(donorMaterial))};
      need(donor.task.instance_id === task.instance_id, `donor-task:${sequence}`);

      const add = (stage, stageIndex, wire, provenance) => {
        need(wire.model === "glm-5.3-flash" && Array.isArray(wire.messages) && Array.isArray(wire.tools),
          `wire:${stage}:${sequence}:${stageIndex}`);
        const bytes = canonicalJson(wire);
        const promptSha = sha(bytes);
        const promptName = `${promptSha}.json`;
        const promptPath = join(temp, "prompts", promptName);
        if (!existsSync(promptPath)) writeFileSync(promptPath, `${bytes}\n`, {flag: "wx", mode: 0o600});
        requests.push({request_id: `hen09-${stage}-${ordinal}-${String(stageIndex).padStart(2, "0")}`,
          task_ref: row.task_id, instance_id: row.instance_id, stage, stage_index: stageIndex,
          prompt_ref: `prompts/${promptName}`, prompt_sha256: promptSha, view_digest: view.view_digest,
          provenance});
      };

      add("initial", 0, bindView(readJson(initialPath), view,
        presentationPolicy === "adaptive-compact-v2" ? {kind: presentationPolicy, records: 16} : undefined),
      {source: relative(repositoryRoot, initialPath), presentation_records: 16});

      const populated = readJson(populatedPath);
      const captures = donor.events.filter((event) => event.kind === "request-capture" && event.phase === "discover");
      need(populated.rows.length === captures.length, `populated-count:${sequence}`);
      const priorCaptures = [];
      for (const [index, qualificationRow] of populated.rows.entries()) {
        const capture = captures[index].capture;
        need(capture.prompt_sha256 === qualificationRow.historical_prompt_sha256 &&
          sha(capture.prompt) === capture.prompt_sha256, `capture:${sequence}:${index}`);
        const ledger = buildCoverageLedger({captures: priorCaptures,
          receipts: donor.receipts.slice(0, qualificationRow.receipt_index), snapshots: donor.snapshots,
          ranked_evidence: donor.ranked_evidence});
        const baseline = JSON.parse(capture.prompt);
        replaceSystem(baseline.messages, LEDGER_PREFIX,
          LEDGER_PREFIX + visibleLedger(ledger, qualificationRow.included_entries));
        need(sha(canonicalJson(baseline)) === qualificationRow.candidate_prompt_sha256,
          `candidate-reconstruction:${sequence}:${index}`);
        let presentation;
        if (presentationPolicy === "adaptive-compact-v2") {
          const original = baseline.messages.find((message) => message.role === "system" &&
            message.content?.startsWith(INDEX_PREFIX));
          need(original, `index-message:${sequence}:${index}`);
          const headroom = 8000 - qualificationRow.envelope_tokens;
          let records = 0;
          for (let count = 1; count <= 16; count += 1) {
            const projected = bindView({model: "glm-5.3-flash", ...baseline}, view,
              {kind: presentationPolicy, records: count});
            const replacement = projected.messages.find((message) => message.role === "system" &&
              message.content?.startsWith("Evidence-neighborhood hints"));
            const addedBytes = Math.max(0, Buffer.byteLength(replacement.content) - Buffer.byteLength(original.content));
            if (Math.ceil(addedBytes / 2) + 64 > headroom) break;
            records = count;
          }
          presentation = {kind: presentationPolicy, records};
        }
        add("populated", index, bindView({model: "glm-5.3-flash", ...baseline}, view, presentation), {
          historical_prompt_sha256: capture.prompt_sha256,
          predecessor_candidate_prompt_sha256: qualificationRow.candidate_prompt_sha256,
          predecessor_envelope_tokens: qualificationRow.envelope_tokens,
          donor_sha256: donor.donor_sha256,
          presentation_records: presentation?.records ?? 16,
        });
        priorCaptures.push(capture);
      }

      const terminal = readJson(finalPath);
      add("terminal", 0, {model: "glm-5.3-flash", messages: terminal.prompt.messages,
        tools: terminal.prompt.tools}, {source: relative(repositoryRoot, finalPath),
        predecessor_projected_tokens: terminal.projected_tokens});
    }
    need(requests.length === 93 && requests.filter((item) => item.stage === "initial").length === 4 &&
      requests.filter((item) => item.stage === "populated").length === 85 &&
      requests.filter((item) => item.stage === "terminal").length === 4, "request-counts");
    const manifest = {
      schema_version: presentationPolicy === "adaptive-compact-v2"
        ? "are.hen-tokenizer-qualification-freeze/v2" : "are.hen-tokenizer-qualification-freeze/v1",
      qualification_ref: presentationPolicy === "adaptive-compact-v2"
        ? "qualification:HEN-09-v2" : "qualification:HEN-09-v1",
      model: "glm-5.3-flash", endpoint: "https://api.z.ai/api/paas/v4/tokenizer",
      context_limit: 8000, token_margin: 512, output_cap: 2048,
      execution: {provider_requests: 93, model_generation_requests: 0, maximum_workers: 2,
        remote_host: "187.77.163.194", credential_storage: "remote-mounted-secret",
        remote_artifact_retention: "none"},
      presentation_policy: presentationPolicy,
      stage_counts: {initial: 4, populated: 85, terminal: 4}, requests,
      source_bindings: [...sources].map(([path, sha256]) => ({path, sha256})).sort((a, b) => a.path.localeCompare(b.path)),
      claim_ceiling: "Exact tokenizer fit for frozen initial, reviewed populated-replay, and representative terminal requests only; no model generation, benchmark quality, scientific acceptance, or deployment claim.",
      open_questions_ref: "development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/BENCHMARK-EVOLUTION-WORKFLOW.md",
      authority_effect: "none",
    };
    const manifestBytes = `${canonicalJson(manifest)}\n`;
    writeFileSync(join(temp, "FREEZE.json"), manifestBytes, {flag: "wx", mode: 0o600});
    writeFileSync(join(temp, "FREEZE.sha256"), `${sha(manifestBytes)}  FREEZE.json\n`, {flag: "wx", mode: 0o600});
    renameSync(temp, outputRoot);
    return {output_root: outputRoot, manifest_sha256: sha(manifestBytes), requests: requests.length,
      stage_counts: manifest.stage_counts, provider_calls: 0, model_calls: 0};
  } catch (error) {
    rmSync(temp, {recursive: true, force: true});
    throw error;
  }
}

if (process.argv[1] && basename(process.argv[1]) === basename(import.meta.filename)) {
  const [repositoryRoot, outputRoot, presentationPolicy] = process.argv.slice(2);
  need(repositoryRoot && outputRoot, "usage");
  console.log(canonicalJson(await prepareHen09Qualification({repositoryRoot, outputRoot,
    presentationPolicy: presentationPolicy ?? "full-audit-v1"})));
}
