import {
  accessSync,
  closeSync,
  constants,
  existsSync,
  fsyncSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import {createHash, randomUUID} from "node:crypto";
import {dirname, join, relative, resolve} from "node:path";
import {DatabaseSync} from "node:sqlite";
import {pathToFileURL} from "node:url";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {
  evolutionProtocolDigest,
  loadCandidateCycleDefinitionRegistry,
  materializeCommandReceipt,
  materializeEvolutionEvent,
  materializeEvolutionResult,
  verifyArtifactIdentity,
  verifyCommandReceipt,
  verifyEvolutionCommand,
  verifyEvolutionEvent,
  verifyCycleDefinitionRegistry,
} from "./protocol-v1.mjs";
import {
  deriveCoordinationProjection,
  isCoordinationCommand,
  materializeCoordinationEvent,
  materializeCoordinationReceipt,
  materializeCoordinationResult,
  verifyCoordinationCommand,
  verifyCoordinationEvent,
  verifyCoordinationReceipt,
} from "./coordination-protocol-v1.mjs";
import {deriveBenchmarkResearchProjection} from "./benchmark-research-v1.mjs";
import {openSqliteEvolutionLedgerStore} from "./sqlite-ledger-store-v1.mjs";

export const EVOLUTION_KERNEL_VERSION = "are.evolution-durable-kernel/v1";
export const EVOLUTION_COMMIT_SCHEMA = "are.evolution-kernel-commit/v1";
export const EVOLUTION_PROJECTION_SCHEMA = "are.evolution-kernel-projection/v1";
export const EVOLUTION_DIAGNOSIS_SCHEMA = "are.evolution-kernel-diagnosis/v1";
export const EVOLUTION_OBSERVATION_SCHEMA = "are.evolution-observation/v1";

const HASH = /^[a-f0-9]{64}$/;
const SECRET_KEY = /(^|_)(password|passwd|secret|api_key|access_token|refresh_token|private_key|credential|cookie|authorization)($|_)/i;
const SECRET_VALUE = /(-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~+/=-]{8,}|\b(?:sk|ghp|xox[baprs])[-_][A-Za-z0-9_-]{8,})/i;
const WORK_KINDS = new Set(["executable-work", "experiment", "task", "work"]);

function freeze(value) {
  return deepFreeze(canonicalizeJson(value));
}

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function fail(stage, reasonCodes, residue = []) {
  return freeze({
    schema_version: "are.evolution-kernel-failure/v1",
    ok: false,
    stage,
    reason_codes: [...new Set(reasonCodes)].sort(),
    residue,
    authority_effect: "none",
  });
}

function success(operation, value, details = {}) {
  return freeze({ok: true, operation, value, ...details, authority_effect: "none"});
}

function bytesFor(value) {
  return Buffer.from(`${canonicalJson(canonicalizeJson(value))}\n`);
}

function digestBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fsyncDirectory(path) {
  const descriptor = openSync(path, "r");
  try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
}

function ledgerKey(paths, path) {
  return relative(paths.root, path).replaceAll("\\", "/");
}

function atomicCreate(path, bytes, paths = null, store = null) {
  if (store) {
    store.writeBatch([{key: ledgerKey(paths, path), bytes}]);
    return "created-or-replayed";
  }
  mkdirSync(dirname(path), {recursive: true, mode: 0o700});
  if (existsSync(path)) {
    if (!readFileSync(path).equals(bytes)) throw new Error(`EVOLUTION_KERNEL_CONTENT_CONFLICT:${path}`);
    return "replayed";
  }
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  try {
    writeFileSync(temporary, bytes, {flag: "wx", mode: 0o600});
    const descriptor = openSync(temporary, "r");
    try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
    try { linkSync(temporary, path); } catch (error) {
      if (error?.code !== "EEXIST" || !readFileSync(path).equals(bytes)) throw error;
    }
    fsyncDirectory(dirname(path));
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  return "created";
}

function readJson(path, paths = null, store = null) {
  const bytes = store ? store.read(ledgerKey(paths, path)) : readFileSync(path);
  if (bytes === null) throw new Error(`EVOLUTION_KERNEL_ENTRY_MISSING:${path}`);
  const text = bytes.toString("utf8");
  const value = JSON.parse(text);
  if (!bytes.equals(bytesFor(value))) throw new Error(`EVOLUTION_KERNEL_NONCANONICAL_JSON:${path}`);
  return value;
}

function listFiles(path, paths = null, store = null) {
  if (store) return store.list(`${ledgerKey(paths, path)}/`).map((key) => key.slice(key.lastIndexOf("/") + 1));
  return existsSync(path) ? readdirSync(path, {withFileTypes: true}).filter((entry) => entry.isFile()).map((entry) => entry.name).sort() : [];
}

function inspectSecrets(value, path = "$") {
  const findings = [];
  if (typeof value === "string") {
    if (SECRET_VALUE.test(value)) findings.push(`${path}:secret-pattern`);
    return findings;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => findings.push(...inspectSecrets(item, `${path}[${index}]`)));
    return findings;
  }
  if (!object(value)) return findings;
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEY.test(key) && !/_ref$/i.test(key)) findings.push(`${path}.${key}:secret-key`);
    findings.push(...inspectSecrets(child, `${path}.${key}`));
  }
  return findings;
}

function commitMaterial(commit) {
  const {commit_digest: _digest, commit_id: _id, ...material} = commit;
  return material;
}

function sealCommit(material) {
  const normalized = canonicalizeJson({...material, schema_version: EVOLUTION_COMMIT_SCHEMA, authority_effect: "none"});
  const commitDigest = evolutionProtocolDigest(normalized);
  return freeze({...normalized, commit_id: `evolution-commit:${commitDigest}`, commit_digest: commitDigest});
}

function pathsFor(root) {
  return freeze({
    root,
    objects: join(root, "objects", "sha256"),
    commits: join(root, "ledgers", "commits"),
    events: join(root, "ledgers", "events"),
    receipts: join(root, "ledgers", "receipts"),
    artifacts: join(root, "ledgers", "artifacts"),
    index: join(root, "index", "evolution.sqlite"),
    ledger: join(root, "evolution-ledger.sqlite"),
    lock: join(root, "writer.lock"),
  });
}

function ensureLayout(paths) {
  for (const path of [paths.root, paths.objects, paths.commits, paths.events, paths.receipts, paths.artifacts, dirname(paths.index)]) mkdirSync(path, {recursive: true, mode: 0o700});
}

function hasFileLedgerContent(paths) {
  if ([paths.commits, paths.events, paths.receipts, paths.artifacts].some((path) => listFiles(path).length > 0)) return true;
  return existsSync(paths.objects) && readdirSync(paths.objects, {withFileTypes: true}).some((entry) => entry.isDirectory()
    && listFiles(join(paths.objects, entry.name)).length > 0);
}

function objectPath(paths, digest) {
  return join(paths.objects, digest.slice(0, 2), digest.slice(2));
}

function storeObject(paths, bytes, store = null) {
  const value = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  const digest = digestBytes(value);
  atomicCreate(objectPath(paths, digest), value, paths, store);
  return freeze({sha256: digest, byte_length: value.byteLength});
}

function loadObject(paths, identity, store = null) {
  if (!object(identity) || !HASH.test(identity.sha256 ?? "") || !Number.isSafeInteger(identity.byte_length) || identity.byte_length < 0) throw new Error("EVOLUTION_KERNEL_OBJECT_IDENTITY_INVALID");
  const bytes = store ? store.read(ledgerKey(paths, objectPath(paths, identity.sha256)))
    : readFileSync(objectPath(paths, identity.sha256));
  if (bytes === null) throw new Error(`EVOLUTION_KERNEL_OBJECT_MISSING:${identity.sha256}`);
  if (bytes.byteLength !== identity.byte_length || digestBytes(bytes) !== identity.sha256) throw new Error(`EVOLUTION_KERNEL_OBJECT_CORRUPT:${identity.sha256}`);
  return bytes;
}

function acquireLock(paths, ownerId, sqliteMode = false) {
  let descriptor;
  try {
    descriptor = openSync(paths.lock, "wx", 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") return fail("writer-lock", ["kernel.writer-lock-held"], [{lock_path: paths.lock}]);
    return fail("writer-lock", ["kernel.writer-lock-create-failed"], [{code: error?.code ?? null}]);
  }
  const record = freeze({schema_version: "are.evolution-kernel-writer-lock/v1", owner_id: ownerId, process_id: process.pid, nonce: randomUUID(), authority_effect: "none"});
  writeSync(descriptor, bytesFor(record));
  fsyncSync(descriptor);
  if (!sqliteMode) fsyncDirectory(dirname(paths.lock));
  let released = false;
  return {
    ok: true,
    release() {
      if (released) return;
      closeSync(descriptor);
      unlinkSync(paths.lock);
      if (!sqliteMode) fsyncDirectory(dirname(paths.lock));
      released = true;
    },
  };
}

function recoverStaleLock(paths, sqliteMode = false) {
  if (!existsSync(paths.lock)) return {ok: true, disposition: "absent"};
  let record;
  try { record = readJson(paths.lock); } catch (error) {
    return fail("writer-lock-recovery", ["kernel.writer-lock-unreadable"], [{message: error.message}]);
  }
  const keys = new Set(["schema_version", "owner_id", "process_id", "nonce", "authority_effect"]);
  if (!object(record) || Object.keys(record).some((key) => !keys.has(key)) || record.schema_version !== "are.evolution-kernel-writer-lock/v1" || typeof record.owner_id !== "string" || !Number.isSafeInteger(record.process_id) || record.process_id < 1 || typeof record.nonce !== "string" || record.authority_effect !== "none") {
    return fail("writer-lock-recovery", ["kernel.writer-lock-invalid"]);
  }
  try {
    process.kill(record.process_id, 0);
    return fail("writer-lock-recovery", ["kernel.writer-lock-owner-live"], [{process_id: record.process_id}]);
  } catch (error) {
    if (error?.code !== "ESRCH") return fail("writer-lock-recovery", ["kernel.writer-lock-liveness-unknown"], [{process_id: record.process_id, code: error?.code ?? null}]);
  }
  unlinkSync(paths.lock);
  if (!sqliteMode) fsyncDirectory(dirname(paths.lock));
  return {ok: true, disposition: "stale-lock-removed", process_id: record.process_id};
}

function eventFile(paths, event) {
  return join(paths.events, `${eventDigest(event)}.json`);
}

function eventDigest(event) {
  return typeof event?.event_id === "string" ? event.event_id.slice(event.event_id.lastIndexOf(":") + 1) : "";
}

function receiptFile(paths, receipt) {
  return join(paths.receipts, `${receipt.receipt_digest}.json`);
}

function commitFile(paths, commit) {
  return join(paths.commits, `${String(commit.sequence).padStart(12, "0")}-${commit.commit_digest}.json`);
}

function verifyCommitShape(commit) {
  const allowed = new Set(["schema_version", "commit_id", "commit_digest", "sequence", "previous_commit_digest", "command_object", "event_entries", "receipt_entry", "idempotency_key", "cycle_ref", "cycle_definition_ref", "cycle_definition_digest", "previous_event_revision", "next_event_revision", "authority_effect"]);
  if (!object(commit) || Object.keys(commit).some((key) => !allowed.has(key))) return false;
  const expected = evolutionProtocolDigest(commitMaterial(commit));
  return commit.schema_version === EVOLUTION_COMMIT_SCHEMA
    && commit.commit_digest === expected
    && commit.commit_id === `evolution-commit:${expected}`
    && Number.isSafeInteger(commit.sequence) && commit.sequence > 0
    && (commit.previous_commit_digest === null || HASH.test(commit.previous_commit_digest))
    && object(commit.command_object)
    && Array.isArray(commit.event_entries)
    && object(commit.receipt_entry)
    && typeof commit.idempotency_key === "string"
    && typeof commit.cycle_ref === "string"
    && typeof commit.cycle_definition_ref === "string"
    && HASH.test(commit.cycle_definition_digest ?? "")
    && Number.isSafeInteger(commit.previous_event_revision)
    && Number.isSafeInteger(commit.next_event_revision)
    && commit.authority_effect === "none";
}

function loadAndVerify(paths, registry, store = null) {
  const reasons = [];
  let sourceUnavailable = false;
  const recordReadFailure = (error) => {
    if (["EACCES", "EPERM", "EBUSY", "EMFILE", "ENFILE"].includes(error?.code)) sourceUnavailable = true;
  };
  const commits = [];
  const events = [];
  const receipts = [];
  const commands = [];
  const payloads = new Map();
  const idempotency = new Map();
  const cycleRevisions = new Map();
  const artifacts = [];
  let previousDigest = null;
  const files = listFiles(paths.commits, paths, store).filter((name) => name.endsWith(".json"));
  for (const [index, name] of files.entries()) {
    let commit;
    try { commit = readJson(join(paths.commits, name), paths, store); } catch (error) {
      recordReadFailure(error);
      reasons.push(`kernel.commit-unreadable:${name}:${error.message}`);
      continue;
    }
    if (!verifyCommitShape(commit)) reasons.push(`kernel.commit-invalid:${name}`);
    if (commit.sequence !== index + 1) reasons.push(`kernel.commit-sequence-invalid:${name}`);
    if (commit.previous_commit_digest !== previousDigest) reasons.push(`kernel.commit-chain-invalid:${name}`);
    if (name !== `${String(commit.sequence).padStart(12, "0")}-${commit.commit_digest}.json`) reasons.push(`kernel.commit-filename-invalid:${name}`);
    previousDigest = commit.commit_digest;

    let command = null;
    try {
      command = JSON.parse(loadObject(paths, commit.command_object, store).toString("utf8"));
      if (!bytesFor(command).equals(loadObject(paths, commit.command_object, store))) reasons.push(`kernel.command-object-noncanonical:${name}`);
    } catch (error) { recordReadFailure(error); reasons.push(`kernel.command-object-invalid:${name}:${error.message}`); }
    const coordination = isCoordinationCommand(command);
    const commandCheck = coordination ? verifyCoordinationCommand(command, {registry}) : verifyEvolutionCommand(command, {registry});
    if (!commandCheck.ok) reasons.push(...commandCheck.reason_codes.map((code) => `kernel.command-invalid:${name}:${code}`));
    if (inspectSecrets(command).length > 0) reasons.push(`kernel.command-secret-material:${name}`);
    if (command?.idempotency_key !== commit.idempotency_key || command?.cycle_ref !== commit.cycle_ref || command?.cycle_definition_ref !== commit.cycle_definition_ref || command?.cycle_definition_digest !== commit.cycle_definition_digest) reasons.push(`kernel.commit-command-binding-invalid:${name}`);
    if (idempotency.has(commit.idempotency_key)) reasons.push(`kernel.idempotency-duplicate:${commit.idempotency_key}`);

    const commitEvents = [];
    const definition = registry?.definitions?.find((item) => item.definition_ref === commit.cycle_definition_ref && item.definition_digest === commit.cycle_definition_digest);
    for (const entry of commit.event_entries) {
      let event;
      try { event = readJson(join(paths.events, `${entry.event_digest}.json`), paths, store); } catch (error) {
        recordReadFailure(error);
        reasons.push(`kernel.event-entry-invalid:${name}:${error.message}`);
        continue;
      }
      const checked = coordination ? verifyCoordinationEvent(event) : verifyEvolutionEvent(event);
      const expectedEventId = coordination ? `evolution-coordination-event:${entry.event_digest}` : `evolution-event:${entry.event_digest}`;
      if (!checked.ok || event.event_id !== entry.event_ref || event.event_id !== expectedEventId) reasons.push(`kernel.event-binding-invalid:${name}:${entry.event_digest}`);
      if (event?.command_id !== command?.command_id || event?.cycle_ref !== commit.cycle_ref || event?.revision !== commit.previous_event_revision + commitEvents.length + 1 || (!coordination && !definition?.event_types?.includes(event?.event_type))) reasons.push(`kernel.event-sequence-invalid:${name}:${entry.event_digest}`);
      try {
        const payloadBytes = loadObject(paths, entry.payload_object, store);
        if (digestBytes(payloadBytes) !== event.payload_digest) reasons.push(`kernel.event-payload-binding-invalid:${name}:${entry.event_digest}`);
        const payload = JSON.parse(payloadBytes.toString("utf8"));
        if (inspectSecrets(payload).length > 0) reasons.push(`kernel.event-payload-secret-material:${name}:${entry.event_digest}`);
        if (!coordination && payload?.disposition !== undefined && !definition?.derived_dispositions?.includes(payload.disposition)) reasons.push(`kernel.event-disposition-invalid:${name}:${entry.event_digest}`);
        payloads.set(event.event_id, payload);
      } catch (error) { recordReadFailure(error); reasons.push(`kernel.event-payload-invalid:${name}:${entry.event_digest}:${error.message}`); }
      commitEvents.push(event);
      events.push(event);
    }

    let receipt = null;
    try { receipt = readJson(join(paths.receipts, `${commit.receipt_entry.receipt_digest}.json`), paths, store); } catch (error) {
      recordReadFailure(error);
      reasons.push(`kernel.receipt-entry-invalid:${name}:${error.message}`);
    }
    const receiptCheck = coordination ? verifyCoordinationReceipt(receipt, {command}) : verifyCommandReceipt(receipt, {command});
    if (!receiptCheck.ok || receipt?.receipt_id !== commit.receipt_entry.receipt_ref || receipt?.receipt_digest !== commit.receipt_entry.receipt_digest) reasons.push(`kernel.receipt-binding-invalid:${name}`);
    if (receipt && (receipt.previous_event_revision !== commit.previous_event_revision || receipt.next_event_revision !== commit.next_event_revision || canonicalJson(receipt.event_refs) !== canonicalJson(commitEvents.map((event) => event.event_id)))) reasons.push(`kernel.receipt-event-chain-invalid:${name}`);
    const current = cycleRevisions.get(commit.cycle_ref) ?? 0;
    if (receipt?.previous_event_revision !== current) reasons.push(`kernel.cycle-revision-gap:${name}`);
    if (receipt?.disposition === "accepted") cycleRevisions.set(commit.cycle_ref, receipt.next_event_revision);
    else cycleRevisions.set(commit.cycle_ref, current);

    commits.push(commit);
    commands.push(command);
    receipts.push(receipt);
    idempotency.set(commit.idempotency_key, {command, receipt, commit});
  }
  for (const name of listFiles(paths.artifacts, paths, store).filter((value) => value.endsWith(".json"))) {
    try {
      const identity = readJson(join(paths.artifacts, name), paths, store);
      const checked = verifyArtifactIdentity(identity);
      if (!checked.ok || name !== `${identity.sha256}.json`) reasons.push(`kernel.artifact-identity-invalid:${name}`);
      loadObject(paths, identity, store);
      artifacts.push(identity);
    } catch (error) { recordReadFailure(error); reasons.push(`kernel.artifact-invalid:${name}:${error.message}`); }
  }
  const artifactsByRef = new Map();
  for (const artifact of artifacts) {
    const prior = artifactsByRef.get(artifact.artifact_id) ?? 0;
    artifactsByRef.set(artifact.artifact_id, prior + 1);
  }
  for (const [eventRef, payload] of payloads) {
    if (payload?.artifact_refs === undefined) continue;
    if (!Array.isArray(payload.artifact_refs)) {
      reasons.push(`kernel.event-artifact-refs-invalid:${eventRef}`);
      continue;
    }
    const seen = new Set();
    for (const artifactRef of payload.artifact_refs) {
      if (typeof artifactRef !== "string" || seen.has(artifactRef) || artifactsByRef.get(artifactRef) !== 1)
        reasons.push(`kernel.event-artifact-binding-invalid:${eventRef}:${String(artifactRef)}`);
      seen.add(artifactRef);
    }
  }
  return {ok: reasons.length === 0, reasons: [...new Set(reasons)].sort(), sourceUnavailable, commits, events, receipts, commands, payloads, idempotency, cycleRevisions, artifacts};
}

function deriveProjection(verified) {
  const cycles = new Map();
  const records = new Map();
  const work = new Map();
  for (const [index, commit] of verified.commits.entries()) {
    const receipt = verified.receipts[index];
    const command = verified.commands[index];
    const priorCycle = cycles.get(commit.cycle_ref) ?? {
      cycle_ref: commit.cycle_ref,
      cycle_definition_ref: commit.cycle_definition_ref,
      cycle_definition_digest: commit.cycle_definition_digest,
      event_revision: 0,
      event_refs: [],
      receipt_refs: [],
      last_event_type: null,
      derived_disposition: null,
    };
    priorCycle.receipt_refs.push(receipt.receipt_id);
    for (const entry of commit.event_entries) {
      const event = verified.events.find((item) => item.event_id === entry.event_ref);
      const payload = verified.payloads.get(event.event_id);
      priorCycle.event_revision = event.revision;
      priorCycle.event_refs.push(event.event_id);
      priorCycle.last_event_type = event.event_type;
      if (typeof payload?.disposition === "string") priorCycle.derived_disposition = payload.disposition;
      const recordKey = `${event.target.record_kind}:${event.target.record_ref}`;
      const projection = records.get(recordKey) ?? {record_kind: event.target.record_kind, record_ref: event.target.record_ref, cycle_ref: event.cycle_ref, event_refs: [], latest_revision: 0, latest_event_type: null, derived_disposition: null};
      projection.event_refs.push(event.event_id);
      projection.latest_revision = event.revision;
      projection.latest_event_type = event.event_type;
      if (typeof payload?.disposition === "string") projection.derived_disposition = payload.disposition;
      records.set(recordKey, projection);
      if (WORK_KINDS.has(event.target.record_kind)) work.set(recordKey, {...projection});
    }
    cycles.set(commit.cycle_ref, priorCycle);
    if (command?.target && WORK_KINDS.has(command.target.record_kind) && !work.has(`${command.target.record_kind}:${command.target.record_ref}`)) {
      work.set(`${command.target.record_kind}:${command.target.record_ref}`, {record_kind: command.target.record_kind, record_ref: command.target.record_ref, cycle_ref: command.cycle_ref, event_refs: [], latest_revision: priorCycle.event_revision, latest_event_type: null, derived_disposition: null});
    }
  }
  const coordination = deriveCoordinationProjection(verified);
  const benchmarkResearch = deriveBenchmarkResearchProjection(verified);
    const material = canonicalizeJson({
    schema_version: EVOLUTION_PROJECTION_SCHEMA,
    head_commit_digest: verified.commits.at(-1)?.commit_digest ?? null,
    commit_count: verified.commits.length,
    aggregate_cycles: [...cycles.values()].sort((left, right) => left.cycle_ref.localeCompare(right.cycle_ref)),
    subordinate_records: [...records.values()].sort((left, right) => `${left.record_kind}:${left.record_ref}`.localeCompare(`${right.record_kind}:${right.record_ref}`)),
    executable_work: [...work.values()].sort((left, right) => `${left.record_kind}:${left.record_ref}`.localeCompare(`${right.record_kind}:${right.record_ref}`)),
    ...(coordination.phases.length || coordination.handoff_offers.length || coordination.handoff_acceptances.length || coordination.vps_capacity.length || coordination.vps_inbox.assignments.length || coordination.vps_inbox.worker_results.length ? {coordination} : {}),
    ...(benchmarkResearch ? {benchmark_research: benchmarkResearch} : {}),
    authority_effect: "none",
  });
  return freeze({...material, projection_digest: evolutionProtocolDigest(material)});
}

// A desktop reader must not construct the writer kernel: that constructor creates
// its storage layout, even when the caller only intends to inspect it.
function observedCandidateDefinitions(registry, checkedRegistry) {
  return checkedRegistry.ok ? registry.definitions.map((definition) => ({
    definition_ref: definition.definition_ref,
    cycle_kind: definition.cycle_kind,
    admission_status: definition.admission.status,
    admitted: definition.admission.admitted,
    enabled: definition.admission.enabled,
  })) : [];
}

// The installed Companion can show the bundled candidate registry even when
// no private durable-ledger root has been selected. This never probes a root,
// creates storage, or turns a definition into evidence of an executing cycle.
export function observeCandidateEvolutionRegistry({registry = loadCandidateCycleDefinitionRegistry()} = {}) {
  const checkedRegistry = verifyCycleDefinitionRegistry(registry);
  return freeze({
    schema_version: EVOLUTION_OBSERVATION_SCHEMA,
    source: "candidate-registry-only",
    observed_at_unix_ms: Date.now(),
    root_status: "not-configured",
    evidence_status: checkedRegistry.ok ? "not-observed" : "registry-invalid",
    definitions: observedCandidateDefinitions(registry, checkedRegistry),
    reason_codes: checkedRegistry.ok ? ["evolution.root-not-configured"] : ["evolution.registry-invalid"],
    commit_count: 0,
    cycle_count: 0,
    cycles_truncated: false,
    cycles: [],
    coordination_summary: null,
    phase_summaries: [],
    phase_summaries_truncated: false,
    projection_digest: null,
    operational_index_status: "not-observed",
    authority_effect: "none",
  });
}

export function observeDurableEvolution({root, registry = loadCandidateCycleDefinitionRegistry()} = {}) {
  if (typeof root !== "string" || root.trim().length === 0) throw new TypeError("Evolution observation requires an explicit storage root.");
  const checkedRegistry = verifyCycleDefinitionRegistry(registry);
  const definitions = observedCandidateDefinitions(registry, checkedRegistry);
  const observedAt = Date.now();
  const base = {
    schema_version: EVOLUTION_OBSERVATION_SCHEMA,
    source: "durable-ledger-and-candidate-registry",
    observed_at_unix_ms: observedAt,
    definitions,
    authority_effect: "none",
  };
  const result = (rootStatus, evidenceStatus, reasonCodes = [], projection = null, verified = null) => {
    const eventTypesByRef = new Map((verified?.events ?? []).map((event) => [event.event_id, event.event_type]));
    const phases = projection?.coordination?.phases ?? [];
    const workStateCounts = {planned: 0, ready: 0, leased: 0, completed: 0, blocked: 0};
    for (const phase of phases) {
      for (const item of phase.work_items) workStateCounts[item.state] += 1;
    }
    const visibleCycleRefs = new Set((projection?.aggregate_cycles ?? []).slice(0, 24)
      .map((cycle) => cycle.cycle_ref));
    const phaseSummaries = phases.slice(0, 8).map((phase) => {
      const counts = {planned: 0, ready: 0, leased: 0, completed: 0, blocked: 0};
      for (const item of phase.work_items) counts[item.state] += 1;
      return {cycle_ref: visibleCycleRefs.has(phase.cycle_ref) ? phase.cycle_ref : null,
        phase: phase.phase, work_state_counts: counts, event_count: phase.event_refs.length};
    });
    return freeze({
    ...base,
    root_status: rootStatus,
    evidence_status: evidenceStatus,
    reason_codes: reasonCodes,
    commit_count: projection?.commit_count ?? 0,
    cycle_count: projection?.aggregate_cycles.length ?? 0,
    cycles_truncated: (projection?.aggregate_cycles.length ?? 0) > 24,
    coordination_summary: projection ? {phase_count: phases.length, work_state_counts: workStateCounts} : null,
    phase_summaries: phaseSummaries,
    phase_summaries_truncated: phases.length > phaseSummaries.length,
    cycles: (projection?.aggregate_cycles ?? []).slice(0, 24).map((cycle) => {
      const recentEventTypes = cycle.event_refs.slice(-8).map((ref) => eventTypesByRef.get(ref));
      if (recentEventTypes.some((type) => typeof type !== "string")) throw new Error("Verified cycle event was not found.");
      return {
        cycle_ref: cycle.cycle_ref,
        cycle_definition_ref: cycle.cycle_definition_ref,
        event_revision: cycle.event_revision,
        last_event_type: cycle.last_event_type,
        derived_disposition: cycle.derived_disposition,
        event_count: cycle.event_refs.length,
        recent_event_types: recentEventTypes,
        events_truncated: cycle.event_refs.length > recentEventTypes.length,
      };
    }),
    projection_digest: projection?.projection_digest ?? null,
    operational_index_status: projection ? (() => {
      const indexDigest = readOnlyIndexDigest(paths);
      return indexDigest === undefined ? "unavailable"
        : indexDigest === projection.projection_digest ? "healthy" : "rebuild-required";
    })() : "not-observed",
  });
  };
  if (!checkedRegistry.ok) return result("unknown", "registry-invalid", ["evolution.registry-invalid"]);
  const paths = pathsFor(resolve(root));
  let rootStat;
  try { rootStat = statSync(paths.root); }
  catch (error) {
    return error?.code === "ENOENT"
      ? result("absent", "not-observed", ["evolution.root-absent"])
      : result("unknown", "unavailable", ["evolution.observation-failed"]);
  }
  try {
    if (!rootStat.isDirectory()) return result("invalid", "not-observed", ["evolution.root-not-directory"]);
    // existsSync treats permission failures like absence. Probe each expected
    // ledger location before its optional-file checks can mistake a denied
    // directory for an empty, verified ledger.
    accessSync(paths.root, constants.R_OK | constants.X_OK);
    for (const path of [paths.ledger, paths.objects, paths.commits, paths.events, paths.receipts, paths.artifacts]) {
      try { statSync(path); } catch (error) { if (error?.code !== "ENOENT") throw error; }
    }
    if (existsSync(paths.ledger) && hasFileLedgerContent(paths)) return result("present", "corrupt", ["evolution.storage-mixed"]);
    const store = existsSync(paths.ledger) ? openSqliteEvolutionLedgerStore({path: paths.ledger, read_only: true}) : null;
    let verified;
    try { verified = loadAndVerify(paths, registry, store); } finally { store?.close(); }
    if (!verified.ok) return verified.sourceUnavailable
      ? result("unknown", "unavailable", ["evolution.observation-failed"])
      : result("present", "corrupt", ["evolution.durable-evidence-invalid"]);
    return result("present", "verified", [], deriveProjection(verified), verified);
  } catch {
    return result("unknown", "unavailable", ["evolution.observation-failed"]);
  }
}

function openIndex(paths) {
  mkdirSync(dirname(paths.index), {recursive: true, mode: 0o700});
  return new DatabaseSync(paths.index);
}

function rebuildIndex(paths, verified, projection) {
  const database = openIndex(paths);
  try {
    database.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; BEGIN IMMEDIATE; DROP TABLE IF EXISTS metadata; DROP TABLE IF EXISTS commands; DROP TABLE IF EXISTS cycles; DROP TABLE IF EXISTS records; DROP TABLE IF EXISTS work; CREATE TABLE metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE commands(idempotency_key TEXT PRIMARY KEY, command_id TEXT NOT NULL, receipt_id TEXT NOT NULL, commit_digest TEXT NOT NULL); CREATE TABLE cycles(cycle_ref TEXT PRIMARY KEY, projection_json TEXT NOT NULL); CREATE TABLE records(record_key TEXT PRIMARY KEY, projection_json TEXT NOT NULL); CREATE TABLE work(work_key TEXT PRIMARY KEY, projection_json TEXT NOT NULL);");
    const insertMetadata = database.prepare("INSERT INTO metadata(key,value) VALUES (?,?)");
    insertMetadata.run("projection_digest", projection.projection_digest);
    insertMetadata.run("head_commit_digest", projection.head_commit_digest ?? "");
    insertMetadata.run("commit_count", String(projection.commit_count));
    const insertCommand = database.prepare("INSERT INTO commands(idempotency_key,command_id,receipt_id,commit_digest) VALUES (?,?,?,?)");
    verified.commits.forEach((commit, index) => insertCommand.run(commit.idempotency_key, verified.commands[index].command_id, verified.receipts[index].receipt_id, commit.commit_digest));
    const insertCycle = database.prepare("INSERT INTO cycles(cycle_ref,projection_json) VALUES (?,?)");
    projection.aggregate_cycles.forEach((item) => insertCycle.run(item.cycle_ref, canonicalJson(item)));
    const insertRecord = database.prepare("INSERT INTO records(record_key,projection_json) VALUES (?,?)");
    projection.subordinate_records.forEach((item) => insertRecord.run(`${item.record_kind}:${item.record_ref}`, canonicalJson(item)));
    const insertWork = database.prepare("INSERT INTO work(work_key,projection_json) VALUES (?,?)");
    projection.executable_work.forEach((item) => insertWork.run(`${item.record_kind}:${item.record_ref}`, canonicalJson(item)));
    database.exec("COMMIT;");
  } catch (error) {
    try { database.exec("ROLLBACK;"); } catch {}
    throw error;
  } finally {
    database.close();
  }
  return projection;
}

function indexDigest(paths) {
  if (!existsSync(paths.index)) return null;
  let database;
  try { database = openIndex(paths); } catch { return null; }
  try { return database.prepare("SELECT value FROM metadata WHERE key='projection_digest'").get()?.value ?? null; } catch { return null; } finally { database.close(); }
}

function readOnlyIndexDigest(paths) {
  let before;
  try { before = statSync(paths.index); }
  catch (error) { return error?.code === "ENOENT" ? null : undefined; }
  if (!before.isFile()) return undefined;
  // SQLite may create WAL/SHM sidecars even with readOnly:true. An immutable
  // URI avoids that effect, but cannot safely read an uncheckpointed WAL.
  const walSize = () => {
    try { return statSync(`${paths.index}-wal`).size; }
    catch (error) { return error?.code === "ENOENT" ? 0 : undefined; }
  };
  if (walSize() !== 0) return undefined;
  let database;
  try {
    const uri = pathToFileURL(paths.index);
    uri.searchParams.set("immutable", "1");
    database = new DatabaseSync(uri, {readOnly: true});
    const digest = database.prepare("SELECT value FROM metadata WHERE key='projection_digest'").get()?.value ?? null;
    const after = statSync(paths.index);
    if (after.size !== before.size || after.mtimeMs !== before.mtimeMs || walSize() !== 0) return undefined;
    return digest;
  } catch {
    return undefined;
  } finally {
    database?.close();
  }
}

function durableReferences(verified) {
  const objects = new Set();
  const events = new Set();
  const receipts = new Set();
  for (const commit of verified.commits) {
    objects.add(commit.command_object.sha256);
    commit.event_entries.forEach((entry) => {
      objects.add(entry.payload_object.sha256);
      events.add(`${entry.event_digest}.json`);
    });
    receipts.add(`${commit.receipt_entry.receipt_digest}.json`);
  }
  for (const artifact of verified.artifacts ?? []) objects.add(artifact.sha256);
  return {objects, events, receipts};
}

function collectObjectFiles(paths, store = null) {
  if (store) return store.list("objects/sha256/").map((key) => key.slice("objects/sha256/".length).replace("/", ""));
  const values = [];
  for (const prefix of existsSync(paths.objects) ? readdirSync(paths.objects, {withFileTypes: true}).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort() : []) {
    for (const suffix of listFiles(join(paths.objects, prefix))) values.push(`${prefix}${suffix}`);
  }
  return values;
}

function diagnosis(paths, registry, store = null) {
  const verified = loadAndVerify(paths, registry, store);
  const projection = verified.ok ? deriveProjection(verified) : null;
  const refs = durableReferences(verified);
  const residue = {
    orphan_object_digests: collectObjectFiles(paths, store).filter((value) => !refs.objects.has(value)),
    orphan_event_entries: listFiles(paths.events, paths, store).filter((value) => !refs.events.has(value)),
    orphan_receipt_entries: listFiles(paths.receipts, paths, store).filter((value) => !refs.receipts.has(value)),
  };
  const currentIndexDigest = indexDigest(paths);
  const material = canonicalizeJson({
    schema_version: EVOLUTION_DIAGNOSIS_SCHEMA,
    disposition: !verified.ok ? "blocked-corrupt-durable-evidence" : currentIndexDigest !== projection.projection_digest ? "rebuild-required" : "healthy",
    reason_codes: verified.reasons,
    durable_commit_count: verified.commits.length,
    head_commit_digest: verified.commits.at(-1)?.commit_digest ?? null,
    authoritative_projection_digest: projection?.projection_digest ?? null,
    operational_index_digest: currentIndexDigest,
    residue,
    writer_lock_present: existsSync(paths.lock),
    authority_effect: "none",
  });
  return freeze({...material, diagnosis_digest: evolutionProtocolDigest(material)});
}

function callFault(faultInjector, stage) {
  if (typeof faultInjector === "function") faultInjector(stage);
}

export function createDurableEvolutionKernel({root, registry = loadCandidateCycleDefinitionRegistry(), require_enabled = true, fault_injector = null} = {}) {
  if (typeof root !== "string" || root.trim().length === 0) throw new TypeError("The durable kernel requires an explicit storage root.");
  const paths = pathsFor(resolve(root));
  const sqliteMode = process.platform === "win32" || existsSync(paths.ledger);
  if (sqliteMode && hasFileLedgerContent(paths)) throw new Error("EVOLUTION_KERNEL_MIXED_LEDGER_UNSUPPORTED");
  if (sqliteMode) mkdirSync(paths.root, {recursive: true, mode: 0o700});
  else ensureLayout(paths);
  if (sqliteMode) openSqliteEvolutionLedgerStore({path: paths.ledger}).close();
  let store = null;

  function withStore(operation) {
    if (!sqliteMode) return operation();
    store = openSqliteEvolutionLedgerStore({path: paths.ledger});
    try { return operation(); } finally { store.close(); store = null; }
  }

  function withLock(operation) {
    return withStore(() => {
      const lock = acquireLock(paths, `kernel:${process.pid}`, sqliteMode);
      if (!lock.ok) return lock;
      try { return operation(); } finally { lock.release(); }
    });
  }

  function verifiedState() {
    const verified = loadAndVerify(paths, registry, store);
    if (!verified.ok) return {failure: fail("durable-verification", verified.reasons), verified: null, projection: null};
    return {failure: null, verified, projection: deriveProjection(verified)};
  }

  function persist(command, receipt, events, payloadObjects, current) {
    const commandObject = storeObject(paths, bytesFor(command), store);
    callFault(fault_injector, "after-objects");
    const sqliteEntries = [];
    const eventEntries = events.map((event, index) => {
      if (store) sqliteEntries.push({key: ledgerKey(paths, eventFile(paths, event)), bytes: bytesFor(event)});
      else atomicCreate(eventFile(paths, event), bytesFor(event));
      return {event_ref: event.event_id, event_digest: eventDigest(event), payload_object: payloadObjects[index]};
    });
    if (store) sqliteEntries.push({key: ledgerKey(paths, receiptFile(paths, receipt)), bytes: bytesFor(receipt)});
    else atomicCreate(receiptFile(paths, receipt), bytesFor(receipt));
    callFault(fault_injector, "after-ledger-entries");
    const commit = sealCommit({
      sequence: current.verified.commits.length + 1,
      previous_commit_digest: current.verified.commits.at(-1)?.commit_digest ?? null,
      command_object: commandObject,
      event_entries: eventEntries,
      receipt_entry: {receipt_ref: receipt.receipt_id, receipt_digest: receipt.receipt_digest},
      idempotency_key: command.idempotency_key,
      cycle_ref: command.cycle_ref,
      cycle_definition_ref: command.cycle_definition_ref,
      cycle_definition_digest: command.cycle_definition_digest,
      previous_event_revision: receipt.previous_event_revision,
      next_event_revision: receipt.next_event_revision,
    });
    if (store) {
      sqliteEntries.push({key: ledgerKey(paths, commitFile(paths, commit)), bytes: bytesFor(commit)});
      store.writeBatch(sqliteEntries);
    } else atomicCreate(commitFile(paths, commit), bytesFor(commit));
    callFault(fault_injector, "after-commit");
    const next = verifiedState();
    if (next.failure) throw new Error(`EVOLUTION_KERNEL_POST_COMMIT_VERIFICATION_FAILED:${next.failure.reason_codes.join(",")}`);
    rebuildIndex(paths, next.verified, next.projection);
    callFault(fault_injector, "after-index");
    return {commit, projection: next.projection};
  }

  const kernel = Object.freeze({
    version: EVOLUTION_KERNEL_VERSION,
    paths,
    process(command, {event_drafts = []} = {}) {
      return withLock(() => {
        const current = verifiedState();
        if (current.failure) return current.failure;
        const prior = current.verified.idempotency.get(command?.idempotency_key);
        if (prior) {
          if (prior.command?.command_id === command?.command_id) return success("process-command", materializeEvolutionResult(prior.receipt), {disposition: "replayed", commit_ref: prior.commit.commit_id, projection_digest: current.projection.projection_digest});
          return fail("command-replay", ["replay.conflict"], [{idempotency_key: command?.idempotency_key ?? null, retained_command_id: prior.command?.command_id ?? null}]);
        }
        const revision = current.verified.cycleRevisions.get(command?.cycle_ref) ?? 0;
        const checked = verifyEvolutionCommand(command, {registry, current_event_revision: revision, require_enabled});
        if (!checked.ok) {
          const structurallyValid = verifyEvolutionCommand(command);
          if (!structurallyValid.ok) return fail("command-validation", checked.reason_codes);
          const receipt = materializeCommandReceipt({command, disposition: "rejected", previous_event_revision: revision, reason_codes: checked.reason_codes});
          const stored = persist(command, receipt, [], [], current);
          return success("process-command", materializeEvolutionResult(receipt), {disposition: "rejected", commit_ref: stored.commit.commit_id, projection_digest: stored.projection.projection_digest});
        }
        const secretFindings = inspectSecrets(command);
        if (secretFindings.length > 0) {
          return fail("command-validation", ["secret-material-rejected"]);
        }
        if (!Array.isArray(event_drafts) || event_drafts.length === 0) return fail("event-materialization", ["kernel.accepted-command-events-required"]);
        const definition = registry.definitions.find((item) => item.definition_ref === command.cycle_definition_ref && item.definition_digest === command.cycle_definition_digest);
        const events = [];
        const payloadObjects = [];
        for (const [index, draft] of event_drafts.entries()) {
          if (!object(draft) || Object.keys(draft).some((key) => !["event_type", "payload"].includes(key)) || !definition?.event_types.includes(draft.event_type) || !object(draft.payload) || (draft.payload.disposition !== undefined && !definition.derived_dispositions.includes(draft.payload.disposition))) return fail("event-materialization", ["kernel.event-draft-invalid"]);
          if (inspectSecrets(draft.payload).length > 0) return fail("event-materialization", ["secret-material-rejected"]);
          const payloadBytes = Buffer.from(canonicalJson(canonicalizeJson(draft.payload)));
          const payloadObject = storeObject(paths, payloadBytes, store);
          const event = materializeEvolutionEvent({command, revision: revision + index + 1, event_type: draft.event_type, payload: draft.payload});
          if (payloadObject.sha256 !== event.payload_digest) return fail("event-materialization", ["kernel.payload-digest-mismatch"]);
          events.push(event);
          payloadObjects.push(payloadObject);
        }
        const receipt = materializeCommandReceipt({command, disposition: "accepted", previous_event_revision: revision, events});
        const stored = persist(command, receipt, events, payloadObjects, current);
        return success("process-command", materializeEvolutionResult(receipt), {disposition: "accepted", commit_ref: stored.commit.commit_id, projection_digest: stored.projection.projection_digest});
      });
    },
    processCoordination(command, {event_drafts = []} = {}) {
      return withLock(() => {
        const current = verifiedState();
        if (current.failure) return current.failure;
        const prior = current.verified.idempotency.get(command?.idempotency_key);
        if (prior) {
          if (prior.command?.command_id === command?.command_id) return success("process-coordination-command", materializeCoordinationResult(prior.receipt), {disposition: "replayed", commit_ref: prior.commit.commit_id, projection_digest: current.projection.projection_digest});
          return fail("coordination-command-replay", ["replay.conflict"], [{idempotency_key: command?.idempotency_key ?? null, retained_command_id: prior.command?.command_id ?? null}]);
        }
        const revision = current.verified.cycleRevisions.get(command?.cycle_ref) ?? 0;
        const checked = verifyCoordinationCommand(command, {registry, current_event_revision: revision, require_enabled});
        if (!checked.ok) {
          const structurallyValid = verifyCoordinationCommand(command);
          if (!structurallyValid.ok) return fail("coordination-command-validation", checked.reason_codes);
          const receipt = materializeCoordinationReceipt({command, disposition: "rejected", previous_event_revision: revision, reason_codes: checked.reason_codes});
          const stored = persist(command, receipt, [], [], current);
          return success("process-coordination-command", materializeCoordinationResult(receipt), {disposition: "rejected", commit_ref: stored.commit.commit_id, projection_digest: stored.projection.projection_digest});
        }
        if (inspectSecrets(command).length > 0) return fail("coordination-command-validation", ["secret-material-rejected"]);
        if (!Array.isArray(event_drafts) || event_drafts.length === 0) return fail("coordination-event-materialization", ["kernel.accepted-command-events-required"]);
        const events = [];
        const payloadObjects = [];
        for (const [index, draft] of event_drafts.entries()) {
          if (!object(draft) || Object.keys(draft).some((key) => !["event_type", "payload"].includes(key)) || !object(draft.payload)) return fail("coordination-event-materialization", ["coordination.event-draft-invalid"]);
          if (inspectSecrets(draft.payload).length > 0) return fail("coordination-event-materialization", ["secret-material-rejected"]);
          let event;
          try { event = materializeCoordinationEvent({command, revision: revision + index + 1, event_type: draft.event_type, payload: draft.payload}); }
          catch { return fail("coordination-event-materialization", ["coordination.event-draft-invalid"]); }
          const payloadBytes = Buffer.from(canonicalJson(canonicalizeJson(draft.payload)));
          const payloadObject = storeObject(paths, payloadBytes, store);
          if (payloadObject.sha256 !== event.payload_digest) return fail("coordination-event-materialization", ["kernel.payload-digest-mismatch"]);
          events.push(event);
          payloadObjects.push(payloadObject);
        }
        const receipt = materializeCoordinationReceipt({command, disposition: "accepted", previous_event_revision: revision, events});
        const stored = persist(command, receipt, events, payloadObjects, current);
        return success("process-coordination-command", materializeCoordinationResult(receipt), {disposition: "accepted", commit_ref: stored.commit.commit_id, projection_digest: stored.projection.projection_digest});
      });
    },
    inspect() {
      return withStore(() => {
        const current = verifiedState();
        return current.failure ?? success("inspect", current.projection);
      });
    },
    diagnose() {
      return withStore(() => success("diagnose", diagnosis(paths, registry, store)));
    },
    recover() {
      const lockRecovery = recoverStaleLock(paths, sqliteMode);
      if (!lockRecovery.ok) return lockRecovery;
      return withLock(() => {
        const current = verifiedState();
        if (current.failure) return current.failure;
        rebuildIndex(paths, current.verified, current.projection);
        return success("recover", current.projection, {disposition: "reconstructed", lock_recovery: lockRecovery.disposition, residue: diagnosis(paths, registry, store).residue});
      });
    },
    putArtifact({bytes, media_type, semantic_binding} = {}) {
      return withLock(() => {
        const value = Buffer.isBuffer(bytes) ? bytes : typeof bytes === "string" ? Buffer.from(bytes) : null;
        if (value === null || typeof media_type !== "string" || !object(semantic_binding)) return fail("artifact-store", ["kernel.artifact-input-invalid"]);
        if (SECRET_VALUE.test(value.toString("utf8")) || inspectSecrets(semantic_binding).length > 0) return fail("artifact-store", ["secret-material-rejected"]);
        const stored = {sha256: digestBytes(value), byte_length: value.byteLength};
        const identity = freeze({schema_version: "are.evolution-artifact-identity/v1", artifact_id: `sha256:${stored.sha256}`, sha256: stored.sha256, byte_length: stored.byte_length, media_type, semantic_binding, authority_effect: "none"});
        const checked = verifyArtifactIdentity(identity);
        if (!checked.ok) return fail("artifact-store", checked.reason_codes);
        storeObject(paths, value, store);
        atomicCreate(join(paths.artifacts, `${identity.sha256}.json`), bytesFor(identity), paths, store);
        return success("put-artifact", identity);
      });
    },
    readObject(identity) {
      return withStore(() => {
        try {
          const bytes = loadObject(paths, identity, store);
          return success("read-object", {sha256: identity.sha256, byte_length: bytes.byteLength, bytes_base64: bytes.toString("base64")});
        } catch (error) {
          return fail("object-read", [error.message]);
        }
      });
    },
  });
  return kernel;
}
