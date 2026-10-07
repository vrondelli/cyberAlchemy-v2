import assert from "node:assert/strict";
import {chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {DatabaseSync} from "node:sqlite";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  createDurableEvolutionKernel,
  createEvolutionCoordinator,
  loadCandidateCycleDefinitionRegistry,
  materializeEvolutionCommand,
  observeCandidateEvolutionRegistry,
  observeDurableEvolution,
} from "../index.mjs";

const registry = loadCandidateCycleDefinitionRegistry();
const definition = registry.definitions.find((item) => item.definition_ref === "benchmark-research/v1");

function temporaryRoot() {
  return mkdtempSync(resolve(tmpdir(), "are-evolution-kernel-"));
}

function command(overrides = {}) {
  return materializeEvolutionCommand({
    idempotency_key: "kernel-test:diagnose:001",
    expected_event_revision: 0,
    actor: {actor_id: "agent:kernel-test", actor_kind: "agent"},
    worker_ref: null,
    cycle_ref: "cycle:kernel-test",
    cycle_definition_ref: definition.definition_ref,
    cycle_definition_digest: definition.definition_digest,
    operation: "cycle.diagnose",
    target: {record_kind: "experiment", record_ref: "experiment:kernel-test"},
    payload: {objective_ref: "objective:kernel-test"},
    ...overrides,
  });
}

const eventDraft = {event_type: "diagnosis-recorded", payload: {diagnosis_ref: "diagnosis:kernel-test", disposition: "active"}};

test("native Windows SQLite writer commits and the read-only observer reconstructs after reopen", {skip: process.platform !== "win32"}, () => {
  const parent = temporaryRoot();
  const root = join(parent, "native-windows-ledger");
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    assert.equal(kernel.process(command(), {event_drafts: [eventDraft]}).disposition, "accepted");
    const first = kernel.inspect().value;
    assert.equal(existsSync(join(root, "evolution-ledger.sqlite")), true);
    assert.equal(existsSync(join(root, "ledgers", "commits")), false);
    const observation = observeDurableEvolution({root});
    assert.equal(observation.evidence_status, "verified");
    assert.equal(observation.operational_index_status, "healthy");
    assert.equal(observation.commit_count, 1);
    assert.equal(observation.cycles[0].last_event_type, "diagnosis-recorded");
    const cli = spawnSync(process.execPath, [fileURLToPath(new URL("../bin/observe.mjs", import.meta.url)),
      "--json", "--root", root], {encoding: "utf8"});
    assert.equal(cli.status, 0, cli.stderr);
    assert.equal(JSON.parse(cli.stdout).commit_count, 1);
    const reopened = createDurableEvolutionKernel({root, require_enabled: false});
    assert.equal(reopened.inspect().value.projection_digest, first.projection_digest);
    assert.equal(reopened.process(command(), {event_drafts: [eventDraft]}).disposition, "replayed");
  } finally { rmSync(parent, {recursive: true, force: true}); }
});

test("SQLite kernel refuses a mixed file-ledger root", {skip: process.platform !== "win32"}, () => {
  const root = temporaryRoot();
  try {
    const store = createDurableEvolutionKernel({root, require_enabled: false});
    const commits = join(root, "ledgers", "commits");
    mkdirSync(commits, {recursive: true});
    writeFileSync(join(commits, "foreign.json"), "{}\n");
    assert.throws(() => createDurableEvolutionKernel({root, require_enabled: false}),
      /EVOLUTION_KERNEL_MIXED_LEDGER_UNSUPPORTED/u);
    assert.deepEqual(observeDurableEvolution({root}).reason_codes, ["evolution.storage-mixed"]);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("read-only observation does not create an absent root", () => {
  const parent = temporaryRoot();
  const root = join(parent, "not-created");
  try {
    const observation = observeDurableEvolution({root});
    assert.equal(existsSync(root), false);
    assert.equal(observation.schema_version, "are.evolution-observation/v1");
    assert.equal(observation.root_status, "absent");
    assert.equal(observation.evidence_status, "not-observed");
    assert.equal(observation.operational_index_status, "not-observed");
    assert.equal(observation.definitions.length, 5);
    assert.ok(observation.definitions.every(item => item.admission_status === "candidate" && !item.admitted && !item.enabled));
    assert.deepEqual(observation.cycles, []);
    assert.equal(observation.coordination_summary, null);
    assert.equal(JSON.stringify(observation).includes(root), false);
  } finally { rmSync(parent, {recursive: true, force: true}); }
});

test("candidate registry observation needs no ledger root and cannot imply a cycle", () => {
  const observation = observeCandidateEvolutionRegistry();
  assert.equal(observation.schema_version, "are.evolution-observation/v1");
  assert.equal(observation.source, "candidate-registry-only");
  assert.equal(observation.root_status, "not-configured");
  assert.equal(observation.evidence_status, "not-observed");
  assert.equal(observation.definitions.length, 5);
  assert.ok(observation.definitions.every(item => item.admission_status === "candidate" && !item.admitted && !item.enabled));
  assert.deepEqual(observation.cycles, []);
  assert.equal(observation.coordination_summary, null);
  assert.equal(observation.cycle_count, 0);
  assert.equal(observation.commit_count, 0);
  assert.equal(observation.projection_digest, null);
  assert.deepEqual(observation.reason_codes, ["evolution.root-not-configured"]);
  const invalid = observeCandidateEvolutionRegistry({registry: {}});
  assert.equal(invalid.evidence_status, "registry-invalid");
  assert.deepEqual(invalid.definitions, []);
  const cli = fileURLToPath(new URL("../bin/observe.mjs", import.meta.url));
  const run = spawnSync(process.execPath, [cli, "--json", "--registry-only"], {encoding: "utf8"});
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).source, "candidate-registry-only");
  const mixed = spawnSync(process.execPath, [cli, "--json", "--registry-only", "--root", "somewhere"], {encoding: "utf8"});
  assert.equal(mixed.status, 2);
});

test("unreadable existing Evolution directories cannot become verified empty evidence", {
  skip: process.platform === "win32" || process.getuid?.() === 0,
}, () => {
  const root = temporaryRoot();
  const ledgers = join(root, "ledgers");
  let deniedCommit;
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    assert.equal(kernel.process(command(), {event_drafts: [eventDraft]}).disposition, "accepted");
    assert.equal(observeDurableEvolution({root}).cycle_count, 1);
    chmodSync(root, 0o000);
    const deniedRoot = observeDurableEvolution({root});
    assert.equal(deniedRoot.root_status, "unknown");
    assert.equal(deniedRoot.evidence_status, "unavailable");
    assert.equal(deniedRoot.cycle_count, 0);
    assert.equal(JSON.stringify(deniedRoot).includes(root), false);
    chmodSync(root, 0o700);
    chmodSync(ledgers, 0o000);
    const deniedLedger = observeDurableEvolution({root});
    assert.equal(deniedLedger.evidence_status, "unavailable");
    assert.equal(deniedLedger.cycle_count, 0);
    assert.equal(JSON.stringify(deniedLedger).includes(root), false);
    chmodSync(ledgers, 0o700);
    deniedCommit = join(ledgers, "commits", readdirSync(join(ledgers, "commits"))[0]);
    chmodSync(deniedCommit, 0o000);
    const deniedRecord = observeDurableEvolution({root});
    assert.equal(deniedRecord.root_status, "unknown");
    assert.equal(deniedRecord.evidence_status, "unavailable");
    assert.equal(deniedRecord.cycle_count, 0);
    assert.equal(JSON.stringify(deniedRecord).includes(root), false);
  } finally {
    chmodSync(root, 0o700);
    if (existsSync(ledgers)) chmodSync(ledgers, 0o700);
    if (deniedCommit && existsSync(deniedCommit)) chmodSync(deniedCommit, 0o600);
    rmSync(root, {recursive: true, force: true});
  }
});

test("read-only observation projects verified cycles without writing the index", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    kernel.process(command(), {event_drafts: [eventDraft]});
    const index = join(root, "index", "evolution.sqlite");
    const before = readFileSync(index);
    const indexFilesBefore = readdirSync(join(root, "index")).sort();
    const observation = observeDurableEvolution({root});
    assert.equal(observation.evidence_status, "verified");
    assert.equal(observation.operational_index_status, "healthy");
    assert.equal(observation.commit_count, 1);
    assert.equal(observation.cycle_count, 1);
    assert.deepEqual(observation.cycles, [{cycle_ref: "cycle:kernel-test", cycle_definition_ref: definition.definition_ref, event_revision: 1, last_event_type: "diagnosis-recorded", derived_disposition: "active", event_count: 1, recent_event_types: ["diagnosis-recorded"], events_truncated: false}]);
    assert.deepEqual(observation.coordination_summary, {phase_count: 0, work_state_counts: {planned: 0, ready: 0, leased: 0, completed: 0, blocked: 0}});
    assert.deepEqual(readFileSync(index), before);
    assert.deepEqual(readdirSync(join(root, "index")).sort(), indexFilesBefore);
    assert.equal(JSON.stringify(observation).includes("experiment:kernel-test"), false);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("an uncheckpointed operational-index WAL is indeterminate without creating sidecars", () => {
  const root = temporaryRoot();
  let writer;
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    assert.equal(kernel.process(command(), {event_drafts: [eventDraft]}).disposition, "accepted");
    const index = join(root, "index", "evolution.sqlite");
    writer = new DatabaseSync(index);
    writer.exec("PRAGMA wal_autocheckpoint=0");
    writer.prepare("UPDATE metadata SET value=? WHERE key='projection_digest'").run("f".repeat(64));
    assert.ok(statSync(`${index}-wal`).size > 0);
    const before = readdirSync(join(root, "index")).sort();
    const observed = observeDurableEvolution({root});
    assert.equal(observed.evidence_status, "verified");
    assert.equal(observed.operational_index_status, "unavailable");
    assert.deepEqual(readdirSync(join(root, "index")).sort(), before);
  } finally {
    writer?.close();
    rmSync(root, {recursive: true, force: true});
  }
});

test("read-only observation summarizes verified coordination without exposing work identifiers", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    const coordinator = createEvolutionCoordinator({kernel, registry, verify_plan: () => true,
      validators: {"validator:evidence": () => ({ok: true})},
      cycle_validators: {"benchmark-research": () => ({ok: true})},
      now: () => "2026-09-22T12:00:00.000Z"});
    const cycleRef = "cycle:coordination-private";
    const base = {actor: {actor_id: "agent:test", actor_kind: "agent"}, worker_ref: null,
      cycle_ref: cycleRef, cycle_definition_ref: definition.definition_ref,
      cycle_definition_digest: definition.definition_digest};
    const plan = {schema_version: "are.research-work-plan/v1", plan_digest: "a".repeat(64),
      research_dag: {dag_digest: "b".repeat(64)}, tasks: [
        {task_id: "task:private-a", title: "A", owner: "agent", lane: "product-construction", stage: "P3", question_ref: "question:a", depends_on: [], completion_criteria: ["criterion:a"], validator_ref: "validator:evidence"},
        {task_id: "task:private-b", title: "B", owner: "agent", lane: "product-construction", stage: "P3", question_ref: "question:a", depends_on: ["task:private-a"], completion_criteria: ["criterion:b"], validator_ref: "validator:evidence"},
      ], topological_order: ["task:private-a", "task:private-b"], authority_effect: "none"};
    const envelope = {schema_version: "are.evolution-effect-envelope/v1", envelope_ref: "envelope:test", cycle_ref: cycleRef,
      cycle_definition_digest: definition.definition_digest, authorization_ref: "decision:test",
      allowed_effect_classes: ["repository-read"], resource_limits: {maximum_attempts: 2,
        maximum_concurrency: 1, maximum_tokens: 100, maximum_cost: 10, maximum_elapsed_seconds: 1000},
      expires_at: "2030-01-01T00:00:00.000Z", enabled: true, authority_effect: "none"};
    assert.equal(coordinator.admitPhase({...base, idempotency_key: "coordination:admit", expected_event_revision: 0,
      phase: "construction", plan, envelope, prerequisite_receipt_refs: []}).disposition, "accepted");
    assert.deepEqual(observeDurableEvolution({root}).coordination_summary,
      {phase_count: 1, work_state_counts: {planned: 1, ready: 1, leased: 0, completed: 0, blocked: 0}});
    assert.equal(coordinator.leaseWork({...base, idempotency_key: "coordination:lease", expected_event_revision: 1,
      phase: "construction", task_ref: "task:private-a", worker_ref: "worker:private", rationale: "fixture",
      effect_class: null, resource_request: {}, lease_seconds: 30}).disposition, "accepted");
    const observation = observeDurableEvolution({root});
    assert.deepEqual(observation.coordination_summary,
      {phase_count: 1, work_state_counts: {planned: 1, ready: 0, leased: 1, completed: 0, blocked: 0}});
    assert.deepEqual(observation.phase_summaries, [{cycle_ref: cycleRef, phase: "construction",
      work_state_counts: {planned: 1, ready: 0, leased: 1, completed: 0, blocked: 0}, event_count: 2}]);
    assert.equal(observation.phase_summaries_truncated, false);
    assert.equal(JSON.stringify(observation).includes("task:private-a"), false);
    assert.equal(JSON.stringify(observation).includes("worker:private"), false);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("read-only observation bounds recent verified event types and never exposes payloads", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    const drafts = Array.from({length: 10}, (_, index) => ({event_type: "diagnosis-recorded",
      payload: {diagnosis_ref: `diagnosis:private-${index}`, disposition: "active"}}));
    assert.equal(kernel.process(command(), {event_drafts: drafts}).disposition, "accepted");
    const observation = observeDurableEvolution({root});
    assert.equal(observation.evidence_status, "verified");
    assert.equal(observation.cycles[0].event_count, 10);
    assert.equal(observation.cycles[0].recent_event_types.length, 8);
    assert.ok(observation.cycles[0].recent_event_types.every((type) => type === "diagnosis-recorded"));
    assert.equal(observation.cycles[0].events_truncated, true);
    assert.equal(JSON.stringify(observation).includes("diagnosis:private-"), false);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("evolution-status CLI uses the same non-mutating observation", () => {
  const parent = temporaryRoot();
  const root = join(parent, "cli-not-created");
  try {
    const cli = fileURLToPath(new URL("../bin/observe.mjs", import.meta.url));
    const run = spawnSync(process.execPath, [cli, "--json", "--root", root], {encoding: "utf8"});
    assert.equal(run.status, 0, run.stderr);
    assert.equal(JSON.parse(run.stdout).root_status, "absent");
    assert.equal(existsSync(root), false);
  } finally { rmSync(parent, {recursive: true, force: true}); }
});

test("corrupt Evolution evidence fails closed without exposing ledger paths", () => {
  const root = temporaryRoot();
  try {
    const commits = join(root, "ledgers", "commits");
    mkdirSync(commits, {recursive: true});
    writeFileSync(join(commits, "000000000001-bad.json"), "not-json\n");
    const observation = observeDurableEvolution({root});
    assert.equal(observation.evidence_status, "corrupt");
    assert.equal(observation.cycle_count, 0);
    assert.deepEqual(observation.reason_codes, ["evolution.durable-evidence-invalid"]);
    assert.equal(JSON.stringify(observation).includes(root), false);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("an accepted command commits once and reconstructs byte-identical three-layer state", () => {
  const root = temporaryRoot();
  try {
    const first = createDurableEvolutionKernel({root, require_enabled: false});
    const accepted = first.process(command(), {event_drafts: [eventDraft]});
    assert.equal(accepted.ok, true);
    assert.equal(accepted.disposition, "accepted");
    const before = first.inspect();
    const fresh = createDurableEvolutionKernel({root, require_enabled: false});
    const after = fresh.inspect();
    assert.deepEqual(after, before);
    assert.deepEqual(after.value, JSON.parse(readFileSync(new URL("../fixtures/durable-kernel-v1/three-layer-snapshot.json", import.meta.url))));
    assert.equal(after.value.aggregate_cycles.length, 1);
    assert.equal(after.value.subordinate_records.length, 1);
    assert.equal(after.value.executable_work.length, 1);
    assert.equal(after.value.aggregate_cycles[0].event_revision, 1);
    assert.equal(existsSync(join(root, "index", "evolution.sqlite")), true);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("exact duplicate commands replay their first receipt and changed bytes conflict", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    const first = kernel.process(command(), {event_drafts: [eventDraft]});
    const replay = kernel.process(command(), {event_drafts: [eventDraft]});
    assert.equal(replay.disposition, "replayed");
    assert.deepEqual(replay.value.receipt, first.value.receipt);
    assert.equal(kernel.inspect().value.commit_count, 1);
    const changed = command({payload: {objective_ref: "objective:changed"}});
    assert.deepEqual(kernel.process(changed, {event_drafts: [eventDraft]}).reason_codes, ["replay.conflict"]);
    assert.equal(kernel.inspect().value.commit_count, 1);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("the production-default kernel durably rejects disabled cycle definitions", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root});
    const rejected = kernel.process(command(), {event_drafts: [eventDraft]});
    assert.equal(rejected.ok, true);
    assert.equal(rejected.disposition, "rejected");
    assert.deepEqual(rejected.value.receipt.reason_codes, ["command.definition-not-enabled"]);
    assert.equal(kernel.inspect().value.commit_count, 1);
    assert.equal(kernel.inspect().value.aggregate_cycles[0].event_revision, 0);
    assert.equal(definition.admission.enabled, false);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("the JSON stdin CLI keeps disabled definitions non-runnable", () => {
  const root = temporaryRoot();
  try {
    const request = {schema_version: "are.evolution-kernel-request/v1", operation: "process", command: command(), event_drafts: [eventDraft]};
    const cli = fileURLToPath(new URL("../bin/kernel.mjs", import.meta.url));
    const run = spawnSync(process.execPath, [cli, "--root", root], {input: JSON.stringify(request), encoding: "utf8"});
    assert.equal(run.status, 0, run.stderr);
    const output = JSON.parse(run.stdout);
    assert.equal(output.ok, true);
    assert.equal(output.disposition, "rejected");
    assert.deepEqual(output.value.receipt.reason_codes, ["command.definition-not-enabled"]);
    const unknown = spawnSync(process.execPath, [cli, "--root", root], {input: JSON.stringify({schema_version: "are.evolution-kernel-request/v1", operation: "inspect", root}), encoding: "utf8"});
    assert.equal(unknown.status, 2);
    assert.deepEqual(JSON.parse(unknown.stdout).reason_codes, ["kernel.request-invalid"]);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("concurrent stale expected revisions settle as one accepted and one rejected receipt", async () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    const first = command({idempotency_key: "kernel-test:race:one"});
    const second = command({idempotency_key: "kernel-test:race:two", payload: {objective_ref: "objective:second"}});
    const [left, right] = await Promise.all([
      Promise.resolve().then(() => kernel.process(first, {event_drafts: [eventDraft]})),
      Promise.resolve().then(() => kernel.process(second, {event_drafts: [eventDraft]})),
    ]);
    assert.deepEqual([left.disposition, right.disposition], ["accepted", "rejected"]);
    assert.deepEqual(right.value.receipt.reason_codes, ["command.stale-revision"]);
    assert.equal(kernel.inspect().value.aggregate_cycles[0].event_revision, 1);
    assert.equal(kernel.inspect().value.commit_count, 2);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("SQLite loss is diagnosed and rebuilt solely from durable inputs", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    kernel.process(command(), {event_drafts: [eventDraft]});
    const expected = kernel.inspect().value;
    rmSync(join(root, "index", "evolution.sqlite"), {force: true});
    assert.equal(kernel.diagnose().value.disposition, "rebuild-required");
    const observed = observeDurableEvolution({root});
    assert.equal(observed.evidence_status, "verified");
    assert.equal(observed.operational_index_status, "rebuild-required");
    assert.equal(existsSync(join(root, "index", "evolution.sqlite")), false);
    const recovered = createDurableEvolutionKernel({root, require_enabled: false}).recover();
    assert.equal(recovered.ok, true);
    assert.deepEqual(recovered.value, expected);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("a stale writer lock blocks redispatch until explicit recovery removes it", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    const stale = {authority_effect: "none", nonce: "stale-test-lock", owner_id: "kernel:dead-process", process_id: 999999, schema_version: "are.evolution-kernel-writer-lock/v1"};
    writeFileSync(kernel.paths.lock, `${JSON.stringify(stale)}\n`, {mode: 0o600});
    assert.deepEqual(kernel.process(command(), {event_drafts: [eventDraft]}).reason_codes, ["kernel.writer-lock-held"]);
    const recovered = kernel.recover();
    assert.equal(recovered.ok, true);
    assert.equal(recovered.lock_recovery, "stale-lock-removed");
    assert.equal(kernel.process(command(), {event_drafts: [eventDraft]}).disposition, "accepted");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("missing or corrupt durable objects block recovery", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    kernel.process(command(), {event_drafts: [eventDraft]});
    if (process.platform === "win32") {
      const database = new DatabaseSync(kernel.paths.ledger);
      try {
        const row = database.prepare("SELECT content FROM ledger_entries WHERE entry_key LIKE 'ledgers/commits/%' ORDER BY entry_key LIMIT 1").get();
        const commit = JSON.parse(Buffer.from(row.content).toString("utf8"));
        const key = `objects/sha256/${commit.command_object.sha256.slice(0, 2)}/${commit.command_object.sha256.slice(2)}`;
        database.prepare("UPDATE ledger_entries SET content=? WHERE entry_key=?").run(Buffer.from("corrupt"), key);
      } finally { database.close(); }
    } else {
      const commitName = readFileSync(join(kernel.paths.commits, readdirSync(kernel.paths.commits).sort()[0]), "utf8");
      const commit = JSON.parse(commitName);
      const objectPath = join(kernel.paths.objects, commit.command_object.sha256.slice(0, 2), commit.command_object.sha256.slice(2));
      writeFileSync(objectPath, "corrupt");
    }
    const recovered = createDurableEvolutionKernel({root, require_enabled: false}).recover();
    assert.equal(recovered.ok, false);
    assert.ok(recovered.reason_codes.some((code) => code.includes(process.platform === "win32" ? "ENTRY_CORRUPT" : "OBJECT_CORRUPT")));
  } finally { rmSync(root, {recursive: true, force: true}); }
});

for (const point of ["after-objects", "after-ledger-entries", "after-commit", "after-index"]) {
  test(`crash point ${point} is recovered from commit visibility`, () => {
    const root = temporaryRoot();
    try {
      const crashing = createDurableEvolutionKernel({root, require_enabled: false, fault_injector(stage) { if (stage === point) throw new Error(`CRASH:${point}`); }});
      assert.throws(() => crashing.process(command(), {event_drafts: [eventDraft]}), new RegExp(`CRASH:${point}`));
      const fresh = createDurableEvolutionKernel({root, require_enabled: false});
      const recovered = fresh.recover();
      assert.equal(recovered.ok, true);
      assert.equal(recovered.value.commit_count, ["after-commit", "after-index"].includes(point) ? 1 : 0);
      if (["after-objects", "after-ledger-entries"].includes(point)) {
        const residue = fresh.diagnose().value.residue;
        assert.ok(residue.orphan_object_digests.length + residue.orphan_event_entries.length + residue.orphan_receipt_entries.length > 0);
      }
    } finally { rmSync(root, {recursive: true, force: true}); }
  });
}

test("recognized secrets never enter command or artifact durable storage", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    const secretCommand = command({payload: {api_key: "sk-example-secret-123456789"}});
    assert.deepEqual(kernel.process(secretCommand, {event_drafts: [eventDraft]}).reason_codes, ["secret-material-rejected"]);
    assert.equal(kernel.inspect().value.commit_count, 0);
    const artifact = kernel.putArtifact({bytes: "Authorization: Bearer abcdefghijklmnop", media_type: "text/plain", semantic_binding: {cycle_ref: "cycle:kernel-test", cycle_definition_digest: definition.definition_digest, role: "evidence", provenance_refs: ["source:test"], claim_ceiling: "test evidence only"}});
    assert.deepEqual(artifact.reason_codes, ["secret-material-rejected"]);
    assert.equal(kernel.diagnose().value.residue.orphan_object_digests.length, 0);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("non-secret artifacts are content addressed, verified, and deduplicated", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    const input = {bytes: "bounded benchmark evidence", media_type: "text/plain", semantic_binding: {cycle_ref: "cycle:kernel-test", cycle_definition_digest: definition.definition_digest, role: "evidence", provenance_refs: ["source:test"], claim_ceiling: "candidate evidence only"}};
    const first = kernel.putArtifact(input);
    const second = kernel.putArtifact(input);
    assert.equal(first.ok, true);
    assert.deepEqual(second, first);
    const loaded = kernel.readObject({sha256: first.value.sha256, byte_length: first.value.byte_length});
    assert.equal(Buffer.from(loaded.value.bytes_base64, "base64").toString("utf8"), input.bytes);
    assert.equal(kernel.diagnose().value.disposition, "rebuild-required");
    assert.equal(kernel.recover().ok, true);
    assert.deepEqual(kernel.diagnose().value.residue.orphan_object_digests, []);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
