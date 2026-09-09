import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  appendFile,
  chmod,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { verifyIsolation } from "./isolation.mjs";

const CONDITIONS = Object.freeze([
  "ticket_only",
  "equivalent_notes",
  "definition_pack",
  "definition_pack_evidence_gate",
]);
const PROTOCOL_ID = "define-downstream-utility@1";
const EVENT_SCHEMA = "define-runtime-event@1";
const BLOCK_SCHEMA = "define-synthetic-task-block@1";
const RECEIPT_SCHEMA = "define-synthetic-block-receipt@1";
const DEFAULT_MATERIALS = fileURLToPath(new URL(
  "../fixtures/html-canonicalization/l3/materials.json",
  import.meta.url,
));
const EVIDENCE = fileURLToPath(new URL("../../evidence/", import.meta.url));

function now() {
  return new Date().toISOString();
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function canonicalDigest(value) {
  return sha256(Buffer.from(canonicalize(value), "utf8"));
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readJsonLines(path) {
  const text = await readFile(path, "utf8");
  return text.split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

async function atomicJson(path, value) {
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  await rename(temporary, path);
}

function safeId(value, label) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(value)) {
    throw new Error(`${label}_INVALID`);
  }
  return value;
}

function pathsFor(runDirectory, blockAttempt) {
  if (!runDirectory) throw new Error("RUN_REQUIRED");
  const root = resolve(runDirectory);
  const blocks = join(root, "block-attempts");
  const attempt = blockAttempt ? join(blocks, safeId(blockAttempt, "BLOCK_ATTEMPT_ID")) : null;
  return {
    root,
    lock: join(root, "run.lock"),
    state: join(root, "state.json"),
    events: join(root, "events.jsonl"),
    answers: join(root, "answers.jsonl"),
    manifest: join(root, "manifest", "experiment-manifest.draft.json"),
    selection: join(root, "manifest", "task-selection.json"),
    isolationAttempts: join(root, "isolation", "attempts"),
    blocks,
    attempt,
    candidate: attempt ? join(attempt, "candidate") : null,
    sealed: attempt ? join(attempt, "sealed") : null,
    cells: attempt ? join(attempt, "cells") : null,
    rows: attempt ? join(attempt, "rows", "run.jsonl") : null,
    receipt: attempt ? join(attempt, "block-receipt.json") : null,
    validation: attempt ? join(attempt, "validation-receipt.json") : null,
  };
}

async function withLock(paths, operation) {
  let handle;
  try {
    handle = await open(paths.lock, "wx", 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") throw new Error(`RUN_LOCKED:${paths.root}`);
    throw error;
  }
  try {
    await handle.writeFile(`${JSON.stringify({ pid: process.pid, operation: "synthetic_block", acquired_at: now() })}\n`);
    return await operation();
  } finally {
    await handle.close();
    await rm(paths.lock, { force: true });
  }
}

async function appendEvent(paths, state, eventType, actor, outputs = {}) {
  const events = await readJsonLines(paths.events);
  await appendFile(paths.events, `${JSON.stringify({
    schema_version: EVENT_SCHEMA,
    sequence: events.length + 1,
    recorded_at: now(),
    experiment_id: state.experiment_id,
    task_id: outputs.task_id ?? null,
    condition: null,
    cell_id: null,
    event_type: eventType,
    actor_or_adapter: actor,
    prior_state: "prepared",
    result_state: "prepared",
    input_digests: outputs.input_digests ?? {},
    output_digests: outputs.output_digests ?? {},
    session_id: null,
    status: "success",
    deviation_codes: [],
  })}\n`);
}

async function updateState(paths, status, blockAttempt) {
  const state = await readJson(paths.state);
  if (state.phase !== "prepared" || state.live_authorized !== false || state.model_calls !== 0) {
    throw new Error("BLOCK_ZERO_AUTHORITY_STATE_DRIFT");
  }
  await atomicJson(paths.state, {
    ...state,
    synthetic_block_status: status,
    synthetic_block_attempt_id: blockAttempt,
    live_authorized: false,
    model_calls: 0,
    derived_at: now(),
  });
}

function validateMaterials(materials, taskId, profile) {
  if (materials.schema_version !== "define-l3-materials@1" || materials.task_id !== taskId) {
    throw new Error("BLOCK_MATERIALS_IDENTITY_DRIFT");
  }
  if (!Array.isArray(materials.facts) || !materials.facts.length) throw new Error("BLOCK_FACTS_REQUIRED");
  const ids = materials.facts.map((fact) => fact.fact_id);
  if (ids.some((id) => typeof id !== "string" || !id) || new Set(ids).size !== ids.length) {
    throw new Error("BLOCK_FACT_IDS_INVALID");
  }
  for (const view of [materials.equivalent_notes, materials.definition_pack]) {
    if (!Array.isArray(view) || view.length !== materials.facts.length) throw new Error("BLOCK_PARITY_CARDINALITY");
    for (const item of view) {
      const fact = materials.facts.find((candidate) => candidate.fact_id === item.fact_id);
      if (!fact || item.statement !== fact.statement) throw new Error(`BLOCK_PARITY_STATEMENT:${item.fact_id}`);
    }
  }
  const prohibited = ["```", "implementation step", "permission to deploy", "permission to publish"];
  const packText = JSON.stringify(materials.definition_pack).toLowerCase();
  for (const marker of [...prohibited, ...(profile.original_implementation_markers ?? []).map((value) => value.toLowerCase())]) {
    if (packText.includes(marker)) throw new Error(`BLOCK_PACK_PROHIBITED_CONTENT:${sha256(marker).slice(0, 12)}`);
  }
  if (materials.gate_policy?.authority_effect !== "none" || materials.truth_card?.authority_effect !== "none") {
    throw new Error("BLOCK_MATERIALS_AUTHORITY_EFFECT");
  }
  return ids;
}

function renderFacts(title, items) {
  return `# ${title}\n\n${items.map((item) => `## ${item.fact_id}\n\n${item.statement}\n`).join("\n")}`;
}

function packet(title, ticket, extra = []) {
  return `# ${title}\n\n## Ticket\n\n${ticket.trim()}\n\n${extra.map((item) => item.trim()).join("\n\n")}\n`;
}

function orderFor(seedText, taskId) {
  return [...CONDITIONS].sort((left, right) => {
    const a = sha256(`${seedText}\0${taskId}\0${left}`);
    const b = sha256(`${seedText}\0${taskId}\0${right}`);
    return a.localeCompare(b);
  });
}

function seedNumber(seedText) {
  return /^\d+$/.test(seedText) && Number.isSafeInteger(Number(seedText))
    ? Number(seedText)
    : Number.parseInt(sha256(seedText).slice(0, 8), 16);
}

async function sealTree(root) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) await sealTree(path);
    else await chmod(path, 0o444);
  }
  await chmod(root, 0o555);
}

function runTool(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return {
    command: [command, ...args].join(" "),
    exit: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

async function verifyCandidate(paths, receipt) {
  const candidatePath = join(paths.candidate, "block-candidate.json");
  const candidate = await readJson(candidatePath);
  const { candidate_digest: embeddedDigest, ...core } = candidate;
  const recomputed = canonicalDigest(core);
  if (embeddedDigest !== receipt.candidate_digest || recomputed !== receipt.candidate_digest) {
    throw new Error("BLOCK_CANDIDATE_DIGEST_DRIFT");
  }
  const exact = [
    [join(paths.candidate, "condition-manifest.json"), candidate.condition_manifest_sha256, "CONDITION_MANIFEST"],
    [join(paths.candidate, "task-selection.synthetic.json"), candidate.synthetic_selection_sha256, "SYNTHETIC_SELECTION"],
    [join(paths.candidate, "artifacts", "truth-card.json"), candidate.truth_card_sha256, "TRUTH_CARD"],
    [join(paths.candidate, "materials.json"), candidate.materials_sha256, "MATERIALS"],
  ];
  for (const [path, expected, label] of exact) {
    if (sha256(await readFile(path)) !== expected) throw new Error(`BLOCK_${label}_DIGEST_DRIFT`);
  }
  const manifest = await readJson(join(paths.candidate, "condition-manifest.json"));
  const artifacts = {
    notes: sha256(await readFile(join(paths.candidate, "artifacts", "equivalent-notes.md"))),
    pack: sha256(await readFile(join(paths.candidate, "artifacts", "definition-pack.md"))),
    gate: sha256(await readFile(join(paths.candidate, "artifacts", "gate-policy.json"))),
  };
  for (const condition of CONDITIONS) {
    const actual = sha256(await readFile(join(paths.candidate, "packets", `${condition}.md`)));
    if (actual !== manifest.conditions[condition].condition_packet_digest) throw new Error(`BLOCK_PACKET_DIGEST_DRIFT:${condition}`);
  }
  if (artifacts.notes !== manifest.conditions.equivalent_notes.artifact_digest
    || artifacts.pack !== manifest.conditions.definition_pack.definition_pack_digest
    || artifacts.pack !== manifest.conditions.definition_pack_evidence_gate.definition_pack_digest
    || artifacts.gate !== manifest.conditions.definition_pack_evidence_gate.gate_policy_digest) {
    throw new Error("BLOCK_ARTIFACT_DIGEST_DRIFT");
  }
  return candidate;
}

function neutralReviews() {
  const rubric = {
    goal_intent_fidelity: 1,
    concept_context_fidelity: 1,
    assumptions_questions: 1,
    source_traceability: 1,
    authority_limits: 1,
    implementation_tests: 1,
  };
  return ["synthetic-reviewer-a", "synthetic-reviewer-b"].map((reviewer_id) => ({
    reviewer_id,
    blind_to_condition: true,
    plan_rubric: rubric,
    plan_total: 6,
    comprehension_score: 2,
    accepted: true,
    condition_guess: "unknown",
    guess_confidence: 0.25,
  }));
}

export async function buildSyntheticBlock({
  runDirectory,
  isolationAttempt,
  blockAttempt,
  materialsPath = DEFAULT_MATERIALS,
  actor = "local-operator",
}) {
  const paths = pathsFor(runDirectory, blockAttempt);
  if (!isolationAttempt) throw new Error("ISOLATION_ATTEMPT_REQUIRED");
  return withLock(paths, async () => {
    const state = await readJson(paths.state);
    if (state.phase !== "prepared" || state.open_question_count !== 0) throw new Error("BLOCK_REQUIRES_PREPARED");
    if (await exists(paths.attempt)) throw new Error(`BLOCK_ATTEMPT_EXISTS:${blockAttempt}`);
    const isolationVerification = await verifyIsolation({ runDirectory, attemptId: isolationAttempt });
    const isolationDirectory = join(paths.isolationAttempts, safeId(isolationAttempt, "ISOLATION_ATTEMPT_ID"));
    const isolationReceiptPath = join(isolationDirectory, "isolation-rehearsal-receipt.json");
    const profilePath = join(isolationDirectory, "profile.json");
    const [isolationReceipt, isolationReceiptBytes, profile, profileBytes, selection, manifest, answers, materialsBytes] = await Promise.all([
      readJson(isolationReceiptPath), readFile(isolationReceiptPath), readJson(profilePath), readFile(profilePath),
      readJson(paths.selection), readJson(paths.manifest), readJsonLines(paths.answers), readFile(resolve(materialsPath)),
    ]);
    const materials = JSON.parse(materialsBytes.toString("utf8"));
    const taskId = isolationReceipt.task_id;
    if (isolationReceipt.status !== "ready" || isolationReceipt.authority_effect !== "none"
      || isolationReceipt.live_authorized !== false || isolationReceipt.model_calls !== 0
      || isolationReceipt.network_policy !== "none") {
      throw new Error("BLOCK_ISOLATION_RECEIPT_BOUNDARY_INVALID");
    }
    const factIds = validateMaterials(materials, taskId, profile);
    const selected = selection.candidates.find((candidate) => candidate.candidate_id === taskId && candidate.selected === true);
    if (!selected) throw new Error(`BLOCK_TASK_NOT_SELECTED:${taskId}`);
    const answerMap = Object.fromEntries(answers.map((answer) => [answer.question_id, answer.answer]));
    const seedText = String(answerMap.randomization_seed ?? "");
    if (!seedText) throw new Error("BLOCK_RANDOMIZATION_SEED_REQUIRED");

    await mkdir(join(paths.candidate, "artifacts"), { recursive: true });
    await mkdir(join(paths.candidate, "packets"), { recursive: true });
    const ticket = `${materials.ticket.trim()}\n`;
    const notes = renderFacts("Equivalent Notes", materials.equivalent_notes);
    const pack = renderFacts("Definition Pack", materials.definition_pack);
    const gate = `${JSON.stringify(materials.gate_policy, null, 2)}\n`;
    const truth = `${JSON.stringify(materials.truth_card, null, 2)}\n`;
    const artifactPaths = {
      ticket: join(paths.candidate, "artifacts", "ticket.md"),
      notes: join(paths.candidate, "artifacts", "equivalent-notes.md"),
      pack: join(paths.candidate, "artifacts", "definition-pack.md"),
      gate: join(paths.candidate, "artifacts", "gate-policy.json"),
      truth: join(paths.candidate, "artifacts", "truth-card.json"),
    };
    await Promise.all([
      writeFile(artifactPaths.ticket, ticket), writeFile(artifactPaths.notes, notes), writeFile(artifactPaths.pack, pack),
      writeFile(artifactPaths.gate, gate), writeFile(artifactPaths.truth, truth),
    ]);
    const packetBytes = {
      ticket_only: packet("Ticket Only", ticket),
      equivalent_notes: packet("Ticket And Equivalent Notes", ticket, [notes]),
      definition_pack: packet("Ticket And Definition Pack", ticket, [pack]),
      definition_pack_evidence_gate: packet("Ticket, Definition Pack, And Evidence Gate", ticket, [pack, `## Evidence Gate\n\n${gate}`]),
    };
    for (const condition of CONDITIONS) await writeFile(join(paths.candidate, "packets", `${condition}.md`), packetBytes[condition]);
    await writeFile(join(paths.candidate, "materials.json"), materialsBytes);

    const factSetDigest = canonicalDigest(materials.facts);
    const packDigest = sha256(pack);
    const gateDigest = sha256(gate);
    const conditionManifest = {
      schema_version: "define-condition-manifest@1",
      protocol_id: PROTOCOL_ID,
      evidence_kind: "synthetic_fixture",
      task_id: taskId,
      task_class: selected.classification,
      repository_commit: profile.repository_commit,
      source_packet_digest: isolationVerification.agent_visible_digest,
      fact_set_digest: factSetDigest,
      authority_effect: "none",
      facts: materials.facts,
      conditions: Object.fromEntries(CONDITIONS.map((condition) => {
        const usesFacts = condition !== "ticket_only";
        const usesPack = condition === "definition_pack" || condition === "definition_pack_evidence_gate";
        return [condition, {
          condition_packet_digest: sha256(packetBytes[condition]),
          artifact_digest: condition === "equivalent_notes" ? sha256(notes) : usesPack ? packDigest : null,
          selected_fact_ids: usesFacts ? factIds : [],
          definition_pack_digest: usesPack ? packDigest : null,
          gate_policy_digest: condition === "definition_pack_evidence_gate" ? gateDigest : null,
          contains_prohibited_content: false,
          authority_effect: "none",
        }];
      })),
      parity_reviews: ["fact-id-and-statement-forward", "fact-id-and-statement-reverse"].map((reviewer_id) => ({
        reviewer_id,
        pack_to_notes: true,
        notes_to_pack: true,
        parity_receipt_digest: canonicalDigest({ reviewer_id, facts: materials.facts, notes: materials.equivalent_notes, pack: materials.definition_pack }),
      })),
      costs: {
        ...materials.costs,
        conditions: Object.fromEntries(CONDITIONS.map((condition) => [condition, {
          ...materials.costs.conditions[condition],
          artifact_characters: packetBytes[condition].length,
        }])),
      },
    };
    const syntheticSelection = {
      schema_version: "define-task-selection@1",
      protocol_id: PROTOCOL_ID,
      evidence_kind: "synthetic_fixture",
      recorded_at: manifest.created_at,
      recorded_by: "define-l3-synthetic-controller",
      selection_locked_before_condition_outputs: true,
      candidates: [{ ...selected, selected: true, condition_output_seen_before_selection: false }],
    };
    await atomicJson(join(paths.candidate, "condition-manifest.json"), conditionManifest);
    await atomicJson(join(paths.candidate, "task-selection.synthetic.json"), syntheticSelection);
    const order = orderFor(seedText, taskId);
    const candidateCore = {
      schema_version: BLOCK_SCHEMA,
      protocol_id: PROTOCOL_ID,
      evidence_kind: "synthetic_fixture",
      experiment_id: manifest.experiment_id,
      task_id: taskId,
      block_attempt_id: blockAttempt,
      source: {
        isolation_attempt_id: isolationAttempt,
        isolation_receipt_sha256: sha256(isolationReceiptBytes),
        profile_sha256: sha256(profileBytes),
        original_selection_sha256: sha256(await readFile(paths.selection)),
        agent_visible_digest: isolationVerification.agent_visible_digest,
      },
      materials_sha256: sha256(materialsBytes),
      condition_manifest_sha256: sha256(await readFile(join(paths.candidate, "condition-manifest.json"))),
      synthetic_selection_sha256: sha256(await readFile(join(paths.candidate, "task-selection.synthetic.json"))),
      truth_card_sha256: sha256(truth),
      hidden_case_count: materials.truth_card.hidden_case_count,
      seed_text: seedText,
      seed_number: seedNumber(seedText),
      condition_order: order,
      synthetic_adapter: "define-neutral-synthetic-adapter@1",
      authority_effect: "none",
      live_authorized: false,
      model_calls: 0,
      network_policy: "none",
    };
    const candidateDigest = canonicalDigest(candidateCore);
    await atomicJson(join(paths.candidate, "block-candidate.json"), { ...candidateCore, candidate_digest: candidateDigest });
    await atomicJson(paths.receipt, {
      schema_version: RECEIPT_SCHEMA,
      status: "candidate",
      recorded_at: now(),
      block_attempt_id: blockAttempt,
      task_id: taskId,
      candidate_digest: candidateDigest,
      authority_effect: "none",
      live_authorized: false,
      model_calls: 0,
    });
    await appendEvent(paths, state, "synthetic_block_candidate_built", actor, {
      task_id: taskId,
      input_digests: { isolation_receipt: sha256(isolationReceiptBytes) },
      output_digests: { block_candidate: candidateDigest },
    });
    await updateState(paths, "candidate", blockAttempt);
    return { status: "candidate", task_id: taskId, block_attempt_id: blockAttempt, candidate_digest: candidateDigest, condition_order: order, authority_effect: "none", live_authorized: false, model_calls: 0 };
  });
}

export async function inspectSyntheticBlock({ runDirectory, blockAttempt }) {
  const paths = pathsFor(runDirectory, blockAttempt);
  if (!(await exists(paths.receipt))) return { status: "absent", block_attempt_id: blockAttempt };
  const receipt = await readJson(paths.receipt);
  const candidate = await readJson(join(paths.candidate, "block-candidate.json"));
  const manifest = await readJson(join(paths.candidate, "condition-manifest.json"));
  return {
    ...receipt,
    condition_order: candidate.condition_order,
    facts: manifest.facts,
    conditions: manifest.conditions,
  };
}

export async function sealSyntheticBlock({ runDirectory, blockAttempt, confirmDigest, actor = "local-operator" }) {
  const paths = pathsFor(runDirectory, blockAttempt);
  return withLock(paths, async () => {
    const state = await readJson(paths.state);
    const receipt = await readJson(paths.receipt);
    if (receipt.status !== "candidate") throw new Error(`BLOCK_SEAL_NOT_ALLOWED:${receipt.status}`);
    if (!confirmDigest || confirmDigest !== receipt.candidate_digest) throw new Error("BLOCK_CONFIRM_DIGEST_MISMATCH");
    const candidate = await verifyCandidate(paths, receipt);
    await verifyIsolation({ runDirectory, attemptId: candidate.source.isolation_attempt_id });
    await mkdir(paths.sealed);
    const sealedAt = now();
    await atomicJson(join(paths.sealed, "seal-receipt.json"), {
      schema_version: "define-synthetic-block-seal@1",
      status: "sealed_rehearsal",
      sealed_at: sealedAt,
      candidate_digest: receipt.candidate_digest,
      authority_effect: "none",
      live_authorized: false,
      model_calls: 0,
    });
    await sealTree(paths.candidate);
    await atomicJson(paths.receipt, { ...receipt, status: "sealed_rehearsal", sealed_at: sealedAt });
    await appendEvent(paths, state, "synthetic_block_sealed", actor, { task_id: receipt.task_id, output_digests: { block_candidate: receipt.candidate_digest } });
    await updateState(paths, "sealed_rehearsal", blockAttempt);
    return { ...receipt, status: "sealed_rehearsal", sealed_at: sealedAt };
  });
}

export async function runSyntheticBlock({ runDirectory, blockAttempt, actor = "synthetic-controller" }) {
  const paths = pathsFor(runDirectory, blockAttempt);
  return withLock(paths, async () => {
    const state = await readJson(paths.state);
    const receipt = await readJson(paths.receipt);
    if (receipt.status !== "sealed_rehearsal") throw new Error(`BLOCK_RUN_NOT_ALLOWED:${receipt.status}`);
    if (await exists(paths.cells)) throw new Error("BLOCK_SYNTHETIC_RUN_EXISTS");
    const [candidate, manifest, selection, seal] = await Promise.all([
      readJson(join(paths.candidate, "block-candidate.json")),
      readJson(join(paths.candidate, "condition-manifest.json")),
      readJson(join(paths.candidate, "task-selection.synthetic.json")),
      readJson(join(paths.sealed, "seal-receipt.json")),
    ]);
    const selectionPath = join(paths.attempt, "task-selection.synthetic.json");
    const manifestPath = join(paths.attempt, "condition-manifest.json");
    await atomicJson(selectionPath, selection);
    await atomicJson(manifestPath, manifest);
    const selectionDigest = sha256(await readFile(selectionPath));
    const manifestDigest = sha256(await readFile(manifestPath));
    const rows = [];
    for (const condition of candidate.condition_order) {
      const cell = join(paths.cells, condition);
      await mkdir(cell, { recursive: true });
      const plan = "# Synthetic Plan\n\nPreserve the stated behavior and modify only the allowed target.\n";
      const outcome = { outcome: "implement", allowed_paths_only: true, synthetic: true };
      const plannerSession = `synthetic-planner-${blockAttempt}-${condition}`;
      const implementerSession = `synthetic-implementer-${blockAttempt}-${condition}`;
      await writeFile(join(cell, "plan.md"), plan);
      await atomicJson(join(cell, "implementer-outcome.json"), outcome);
      await atomicJson(join(cell, "input-separation-receipt.json"), {
        planner_session_id: plannerSession,
        implementer_session_id: implementerSession,
        frozen_plan_sha256: sha256(plan),
        planner_conversation_included: false,
        allowed_write_paths_only: true,
      });
      await atomicJson(join(cell, "synthetic-evaluator-receipt.json"), {
        evidence_kind: "synthetic_fixture",
        hidden_command_executed: false,
        hidden_cases_total: candidate.hidden_case_count,
        hidden_cases_passed: candidate.hidden_case_count,
        semantic_defects: { critical: 0, major: 0, minor: 0 },
        claim_boundary: "synthetic_fixture_no_product_claim",
      });
      const cost = manifest.costs.conditions[condition];
      rows.push({
        schema_version: "define-downstream-utility-run-row@1",
        protocol_id: PROTOCOL_ID,
        evidence_kind: "synthetic_fixture",
        run_id: `${candidate.task_id}-${condition}-${blockAttempt}`,
        task_id: candidate.task_id,
        task_class: manifest.task_class,
        condition,
        repetition: 1,
        status: "completed",
        frozen: {
          repository_commit: manifest.repository_commit,
          source_packet_digest: manifest.source_packet_digest,
          fact_set_digest: manifest.fact_set_digest,
          truth_card_digest: candidate.truth_card_sha256,
          task_selection_digest: selectionDigest,
          condition_manifest_digest: manifestDigest,
          condition_packet_digest: manifest.conditions[condition].condition_packet_digest,
          definition_pack_digest: manifest.conditions[condition].definition_pack_digest,
          gate_policy_digest: manifest.conditions[condition].gate_policy_digest,
          frozen_at: seal.sealed_at,
        },
        execution: {
          model_id: "synthetic-fixture-no-model@1",
          harness_id: candidate.synthetic_adapter,
          planner_session_id: plannerSession,
          implementer_session_id: implementerSession,
          tool_versions: { controller: "define-l3@1" },
          randomization_seed: candidate.seed_number,
          condition_order: candidate.condition_order,
          budget_id: "zero-model-zero-cost@1",
          sandbox_id: `l2-${candidate.source.agent_visible_digest.slice(0, 16)}`,
        },
        controls: {
          truth_card_frozen_before_assignment: true,
          task_class_frozen_before_assignment: true,
          source_access_equal: true,
          information_parity_checked: condition !== "ticket_only",
          clean_planner_session: true,
          clean_implementer_session: true,
          conversation_history_separated: true,
        },
        timing: {
          material_preparation_minutes: cost.direct_material_minutes + cost.allocated_fact_set_minutes,
          material_preparation_tokens: cost.direct_material_tokens + cost.allocated_fact_set_tokens,
          planning_minutes: 0,
          implementation_minutes: 0,
          review_minutes: 0,
          rework_minutes: 0,
          total_tokens: 0,
          artifact_characters: plan.length,
        },
        outcomes: {
          gold_outcome: "implement",
          observed_outcome: "implement",
          hidden_cases_total: candidate.hidden_case_count,
          hidden_cases_passed: candidate.hidden_case_count,
          semantic_defects: { critical: 0, major: 0, minor: 0 },
          weighted_semantic_defects: 0,
          unnecessary_change: false,
          incorrect_abstention: false,
          outcome_match: true,
          scope_violations: 0,
          owner_corrections: 0,
          review_rejections: 0,
        },
        reviews: neutralReviews(),
        review_adjudication: { acceptance_disagreement: false, resolution: "none", adjudicator_id: null, note: "" },
        unknown_fields: [],
        deviations: [],
      });
    }
    await mkdir(dirname(paths.rows), { recursive: true });
    await writeFile(paths.rows, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, { flag: "wx" });
    await atomicJson(paths.receipt, { ...receipt, status: "synthetic_complete", completed_at: now(), rows_sha256: sha256(await readFile(paths.rows)) });
    await appendEvent(paths, state, "synthetic_block_completed", actor, { task_id: candidate.task_id, output_digests: { rows: sha256(await readFile(paths.rows)) } });
    await updateState(paths, "synthetic_complete", blockAttempt);
    return { status: "synthetic_complete", task_id: candidate.task_id, rows: rows.length, authority_effect: "none", live_authorized: false, model_calls: 0 };
  });
}

export async function validateSyntheticBlock({ runDirectory, blockAttempt, actor = "local-validator" }) {
  const paths = pathsFor(runDirectory, blockAttempt);
  return withLock(paths, async () => {
    const state = await readJson(paths.state);
    const receipt = await readJson(paths.receipt);
    if (receipt.status !== "synthetic_complete" && receipt.status !== "validated") throw new Error(`BLOCK_VALIDATE_NOT_ALLOWED:${receipt.status}`);
    const commands = [
      ["python3", [join(EVIDENCE, "validate_task_selection.py"), join(paths.attempt, "task-selection.synthetic.json")]],
      ["python3", [join(EVIDENCE, "validate_condition_manifest.py"), join(paths.attempt, "condition-manifest.json")]],
      ["python3", [join(EVIDENCE, "validate_run.py"), paths.rows]],
      ["python3", [join(EVIDENCE, "validate_experiment_bundle.py"), join(paths.attempt, "task-selection.synthetic.json"), paths.rows, join(paths.attempt, "condition-manifest.json")]],
    ];
    const checks = commands.map(([command, args]) => runTool(command, args));
    const blockers = checks.filter((check) => check.exit !== 0).map((check) => ({ code: "BLOCK_VALIDATOR_FAILED", command: check.command, exit: check.exit, output: `${check.stdout}${check.stderr}`.trim() }));
    const validation = {
      schema_version: "define-synthetic-block-validation@1",
      status: blockers.length ? "fail" : "pass",
      validated_at: now(),
      block_attempt_id: blockAttempt,
      checks,
      blockers,
      authority_effect: "none",
      live_authorized: false,
      model_calls: 0,
    };
    await atomicJson(paths.validation, validation);
    if (blockers.length) throw new Error(`BLOCK_VALIDATION_FAILED:${blockers.length}`);
    await atomicJson(paths.receipt, { ...receipt, status: "validated", validated_at: validation.validated_at, validation_sha256: sha256(await readFile(paths.validation)) });
    await appendEvent(paths, state, "synthetic_block_validated", actor, { task_id: receipt.task_id, output_digests: { validation: sha256(await readFile(paths.validation)) } });
    await updateState(paths, "validated", blockAttempt);
    return validation;
  });
}

export async function getSyntheticBlockStatus({ runDirectory, blockAttempt }) {
  const paths = pathsFor(runDirectory, blockAttempt);
  if (blockAttempt) return inspectSyntheticBlock({ runDirectory, blockAttempt });
  if (!(await exists(paths.blocks))) return { status: "absent", attempts: [] };
  const names = (await readdir(paths.blocks)).sort();
  const attempts = [];
  for (const name of names) attempts.push(await inspectSyntheticBlock({ runDirectory, blockAttempt: name }));
  return { status: attempts.length ? attempts.at(-1).status : "absent", attempts };
}

export function blockConstants() {
  return { CONDITIONS, DEFAULT_MATERIALS };
}
