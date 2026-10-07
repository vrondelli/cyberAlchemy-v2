import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {canonicalJson, canonicalizeJson, deepFreeze, sha256HexText} from "../../intent-route-resolver/index.mjs";

export const EVOLUTION_PROTOCOL_VERSION = "are.evolution-protocol/v1";
export const EVOLUTION_COMMAND_SCHEMA = "are.evolution-command/v1";
export const EVOLUTION_RESULT_SCHEMA = "are.evolution-result/v1";
export const EVOLUTION_EVENT_SCHEMA = "are.evolution-event/v1";
export const EVOLUTION_COMMAND_RECEIPT_SCHEMA = "are.evolution-command-receipt/v1";
export const EVOLUTION_CYCLE_DEFINITION_SCHEMA = "are.evolution-cycle-definition/v1";
export const EVOLUTION_CYCLE_REGISTRY_SCHEMA = "are.evolution-cycle-definition-registry/v1";

const SHA256 = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const OPERATION = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;
const EVENT_TYPE = /^[a-z][a-z0-9-]*$/;
const DEFINITION_REF = /^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/;
const CYCLE_KINDS = new Set(["benchmark-research", "research-learning", "engine-improvement", "interaction-learning", "controlled-upgrade"]);
const POLICY_KINDS = new Map([
  ["benchmark-research", "benchmark-objective"],
  ["research-learning", "research-answerability"],
  ["engine-improvement", "engine-comparison"],
  ["interaction-learning", "interaction-learning"],
  ["controlled-upgrade", "controlled-upgrade"],
]);

const COMMAND_KEYS = new Set(["schema_version", "command_id", "idempotency_key", "expected_event_revision", "actor", "worker_ref", "cycle_ref", "cycle_definition_ref", "cycle_definition_digest", "operation", "target", "payload", "payload_digest", "authority_effect"]);
const DEFINITION_KEYS = new Set(["schema_version", "definition_ref", "definition_digest", "cycle_kind", "version", "predecessor", "compatibility", "command_types", "event_types", "derived_dispositions", "policy_extension", "validator_bindings", "admission", "authority_effect"]);

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" && value.length > 0;
}

function freeze(value) {
  return deepFreeze(canonicalizeJson(value));
}

export function evolutionProtocolDigest(value) {
  return sha256HexText(canonicalJson(canonicalizeJson(value)));
}

function fileDigest(url) {
  return createHash("sha256").update(readFileSync(url)).digest("hex");
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function unknownKeys(value, allowed, prefix) {
  if (!object(value)) return [`${prefix}.object-required`];
  return Object.keys(value).filter((key) => !allowed.has(key)).map((key) => `${prefix}.unknown-field:${key}`);
}

function validIdentifier(value) {
  return text(value) && IDENTIFIER.test(value);
}

function validStringArray(value, pattern = IDENTIFIER) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => text(item) && pattern.test(item)) && new Set(value).size === value.length;
}

function result(ok, stage, reasonCodes = [], value = null) {
  return freeze({
    schema_version: "are.evolution-protocol-validation/v1",
    ok,
    stage,
    reason_codes: sortedUnique(reasonCodes),
    ...(value === null ? {} : {value}),
    authority_effect: "none",
  });
}

function definitionMaterial(definition) {
  const {definition_digest: _digest, ...material} = definition;
  return material;
}

function commandMaterial(command) {
  const {command_id: _id, ...material} = command;
  return material;
}

function receiptMaterial(receipt) {
  const {receipt_id: _id, receipt_digest: _digest, ...material} = receipt;
  return material;
}

export function sealCycleDefinition(input) {
  if (!object(input)) throw new TypeError("Cycle definition must be an object.");
  const material = canonicalizeJson({...input, schema_version: EVOLUTION_CYCLE_DEFINITION_SCHEMA, authority_effect: "none"});
  delete material.definition_digest;
  const definitionDigest = evolutionProtocolDigest(material);
  return freeze({...material, definition_digest: definitionDigest});
}

export function verifyCycleDefinition(definition, {policy_schema_digest: policySchemaDigest = null, validator_implementation_digest: validatorImplementationDigest = null} = {}) {
  const reasons = unknownKeys(definition, DEFINITION_KEYS, "definition");
  if (definition?.schema_version !== EVOLUTION_CYCLE_DEFINITION_SCHEMA) reasons.push("definition.schema-version-invalid");
  const match = text(definition?.definition_ref) ? definition.definition_ref.match(DEFINITION_REF) : null;
  if (!match) reasons.push("definition.ref-invalid");
  if (!CYCLE_KINDS.has(definition?.cycle_kind)) reasons.push("definition.cycle-kind-invalid");
  if (match && match[1] !== definition.cycle_kind) reasons.push("definition.ref-kind-mismatch");
  if (!Number.isSafeInteger(definition?.version) || definition.version < 1) reasons.push("definition.version-invalid");
  if (match && Number(match[2]) !== definition.version) reasons.push("definition.ref-version-mismatch");
  if (definition?.predecessor !== null) {
    const predecessorKeys = new Set(["definition_ref", "definition_digest"]);
    reasons.push(...unknownKeys(definition?.predecessor, predecessorKeys, "definition.predecessor"));
    if (!DEFINITION_REF.test(definition?.predecessor?.definition_ref ?? "")) reasons.push("definition.predecessor-ref-invalid");
    if (!SHA256.test(definition?.predecessor?.definition_digest ?? "")) reasons.push("definition.predecessor-digest-invalid");
  }
  const compatibilityKeys = new Set(["mode", "minimum_runtime_protocol"]);
  reasons.push(...unknownKeys(definition?.compatibility, compatibilityKeys, "definition.compatibility"));
  if (!["initial", "additive-successor", "breaking-successor"].includes(definition?.compatibility?.mode)) reasons.push("definition.compatibility-mode-invalid");
  if (definition?.compatibility?.minimum_runtime_protocol !== EVOLUTION_PROTOCOL_VERSION) reasons.push("definition.minimum-protocol-invalid");
  if (definition?.version === 1 && (definition?.predecessor !== null || definition?.compatibility?.mode !== "initial")) reasons.push("definition.initial-lineage-invalid");
  if (definition?.version > 1 && (!object(definition?.predecessor) || definition?.compatibility?.mode === "initial")) reasons.push("definition.successor-lineage-required");
  if (!validStringArray(definition?.command_types, OPERATION)) reasons.push("definition.command-types-invalid");
  if (!validStringArray(definition?.event_types, EVENT_TYPE)) reasons.push("definition.event-types-invalid");
  if (!validStringArray(definition?.derived_dispositions, EVENT_TYPE)) reasons.push("definition.dispositions-invalid");
  const policyKeys = new Set(["policy_kind", "schema_ref", "schema_digest"]);
  reasons.push(...unknownKeys(definition?.policy_extension, policyKeys, "definition.policy-extension"));
  if (definition?.policy_extension?.policy_kind !== POLICY_KINDS.get(definition?.cycle_kind)) reasons.push("definition.policy-kind-mismatch");
  if (!text(definition?.policy_extension?.schema_ref)) reasons.push("definition.policy-schema-ref-required");
  if (!SHA256.test(definition?.policy_extension?.schema_digest ?? "")) reasons.push("definition.policy-schema-digest-invalid");
  if (policySchemaDigest !== null && definition?.policy_extension?.schema_digest !== policySchemaDigest) reasons.push("definition.policy-schema-drift");
  if (!Array.isArray(definition?.validator_bindings) || definition.validator_bindings.length === 0) reasons.push("definition.validators-required");
  for (const [index, binding] of (definition?.validator_bindings ?? []).entries()) {
    const prefix = `definition.validator:${index}`;
    reasons.push(...unknownKeys(binding, new Set(["validator_ref", "version", "roles", "implementation_digest"]), prefix));
    if (!text(binding?.validator_ref) || !text(binding?.version) || !validStringArray(binding?.roles) || !SHA256.test(binding?.implementation_digest ?? "")) reasons.push(`${prefix}.invalid`);
    if (validatorImplementationDigest !== null && binding?.implementation_digest !== validatorImplementationDigest) reasons.push(`${prefix}.implementation-drift`);
  }
  const admissionKeys = new Set(["status", "admitted", "enabled", "user_decision_ref"]);
  reasons.push(...unknownKeys(definition?.admission, admissionKeys, "definition.admission"));
  if (definition?.admission?.status !== "candidate" || definition?.admission?.admitted !== false || definition?.admission?.enabled !== false || definition?.admission?.user_decision_ref !== null) reasons.push("definition.candidate-admission-invalid");
  if (definition?.authority_effect !== "none") reasons.push("definition.authority-effect-invalid");
  if (!SHA256.test(definition?.definition_digest ?? "") || definition?.definition_digest !== evolutionProtocolDigest(definitionMaterial(definition))) reasons.push("definition.digest-invalid");
  return reasons.length > 0 ? result(false, "cycle-definition", reasons) : result(true, "cycle-definition", [], definition);
}

export function loadCandidateCycleDefinitionRegistry() {
  return freeze(JSON.parse(readFileSync(new URL("../registry/cycle-definitions.v1.json", import.meta.url), "utf8")));
}

export function verifyCycleDefinitionRegistry(registry = loadCandidateCycleDefinitionRegistry()) {
  const reasons = [];
  if (!object(registry) || registry.schema_version !== EVOLUTION_CYCLE_REGISTRY_SCHEMA) reasons.push("registry.schema-version-invalid");
  if (registry?.admission_policy !== "user-only" || registry?.authority_effect !== "none") reasons.push("registry.authority-posture-invalid");
  if (!Array.isArray(registry?.definitions) || registry.definitions.length !== 5) reasons.push("registry.definition-closure-invalid");
  const policySchemaDigest = fileDigest(new URL("../schemas/cycle-policies-v1.schema.json", import.meta.url));
  const validatorImplementationDigest = fileDigest(new URL(import.meta.url));
  const refs = new Set();
  const kinds = new Set();
  for (const definition of registry?.definitions ?? []) {
    const checked = verifyCycleDefinition(definition, {policy_schema_digest: policySchemaDigest, validator_implementation_digest: validatorImplementationDigest});
    reasons.push(...checked.reason_codes.map((code) => `${definition?.definition_ref ?? "unknown"}:${code}`));
    if (refs.has(definition?.definition_ref)) reasons.push("registry.definition-ref-duplicate");
    if (kinds.has(definition?.cycle_kind)) reasons.push("registry.cycle-kind-duplicate");
    refs.add(definition?.definition_ref);
    kinds.add(definition?.cycle_kind);
  }
  for (const kind of CYCLE_KINDS) if (!kinds.has(kind)) reasons.push(`registry.cycle-kind-missing:${kind}`);
  return reasons.length > 0 ? result(false, "cycle-definition-registry", reasons) : result(true, "cycle-definition-registry", [], registry);
}

export function assessCycleDefinitionCompatibility(predecessor, successor) {
  const reasons = [];
  const previous = verifyCycleDefinition(predecessor);
  const next = verifyCycleDefinition(successor);
  if (!previous.ok) reasons.push("compatibility.predecessor-invalid");
  if (!next.ok) reasons.push("compatibility.successor-invalid");
  if (predecessor?.cycle_kind !== successor?.cycle_kind) reasons.push("compatibility.cycle-kind-changed");
  if (successor?.version !== predecessor?.version + 1) reasons.push("compatibility.version-not-successor");
  if (successor?.predecessor?.definition_ref !== predecessor?.definition_ref || successor?.predecessor?.definition_digest !== predecessor?.definition_digest) reasons.push("compatibility.predecessor-binding-mismatch");
  if (successor?.compatibility?.mode === "additive-successor") {
    for (const field of ["command_types", "event_types", "derived_dispositions"]) {
      for (const value of predecessor?.[field] ?? []) if (!(successor?.[field] ?? []).includes(value)) reasons.push(`compatibility.additive-removal:${field}:${value}`);
    }
    if (predecessor?.policy_extension?.policy_kind !== successor?.policy_extension?.policy_kind) reasons.push("compatibility.policy-kind-changed");
  }
  return reasons.length > 0 ? result(false, "cycle-definition-compatibility", reasons) : result(true, "cycle-definition-compatibility", [], successor);
}

export function materializeEvolutionCommand(input) {
  if (!object(input)) throw new TypeError("Evolution command input must be an object.");
  if (Object.hasOwn(input, "state") || Object.hasOwn(input, "projection_state")) throw new TypeError("Evolution commands cannot assign projection state.");
  const payload = canonicalizeJson(object(input.payload) ? input.payload : {});
  const material = canonicalizeJson({
    schema_version: EVOLUTION_COMMAND_SCHEMA,
    idempotency_key: input.idempotency_key,
    expected_event_revision: input.expected_event_revision,
    actor: input.actor,
    ...(input.worker_ref === undefined ? {} : {worker_ref: input.worker_ref}),
    cycle_ref: input.cycle_ref,
    cycle_definition_ref: input.cycle_definition_ref,
    cycle_definition_digest: input.cycle_definition_digest,
    operation: input.operation,
    target: input.target,
    payload,
    payload_digest: evolutionProtocolDigest(payload),
    authority_effect: "none",
  });
  const commandDigest = evolutionProtocolDigest(material);
  const command = freeze({...material, command_id: `evolution-command:${commandDigest}`});
  const checked = verifyEvolutionCommand(command);
  if (!checked.ok) throw new TypeError(`Evolution command is invalid: ${checked.reason_codes.join(",")}`);
  return command;
}

export function verifyEvolutionCommand(command, {registry = null, current_event_revision: currentEventRevision = null, require_enabled: requireEnabled = false} = {}) {
  const reasons = unknownKeys(command, COMMAND_KEYS, "command");
  if (command?.schema_version !== EVOLUTION_COMMAND_SCHEMA) reasons.push("command.schema-version-invalid");
  if (!validIdentifier(command?.idempotency_key)) reasons.push("command.idempotency-key-invalid");
  if (!Number.isSafeInteger(command?.expected_event_revision) || command.expected_event_revision < 0) reasons.push("command.expected-revision-invalid");
  if (currentEventRevision !== null && command?.expected_event_revision !== currentEventRevision) reasons.push("command.stale-revision");
  reasons.push(...unknownKeys(command?.actor, new Set(["actor_id", "actor_kind"]), "command.actor"));
  if (!validIdentifier(command?.actor?.actor_id) || !["user", "agent", "worker", "adapter", "runtime"].includes(command?.actor?.actor_kind)) reasons.push("command.actor-invalid");
  if (command?.worker_ref !== undefined && command.worker_ref !== null && !validIdentifier(command.worker_ref)) reasons.push("command.worker-ref-invalid");
  if (!validIdentifier(command?.cycle_ref) || !validIdentifier(command?.cycle_definition_ref)) reasons.push("command.cycle-binding-invalid");
  if (!SHA256.test(command?.cycle_definition_digest ?? "")) reasons.push("command.definition-digest-invalid");
  if (!OPERATION.test(command?.operation ?? "")) reasons.push("command.operation-invalid");
  reasons.push(...unknownKeys(command?.target, new Set(["record_kind", "record_ref"]), "command.target"));
  if (!validIdentifier(command?.target?.record_kind) || !validIdentifier(command?.target?.record_ref)) reasons.push("command.target-invalid");
  if (!object(command?.payload)) reasons.push("command.payload-invalid");
  if (!SHA256.test(command?.payload_digest ?? "") || command?.payload_digest !== evolutionProtocolDigest(command?.payload ?? {})) reasons.push("command.payload-digest-invalid");
  if (command?.authority_effect !== "none") reasons.push("command.authority-effect-invalid");
  const expectedCommandDigest = object(command) ? evolutionProtocolDigest(commandMaterial(command)) : "";
  if (command?.command_id !== `evolution-command:${expectedCommandDigest}`) reasons.push("command.id-invalid");
  if (registry !== null) {
    const definition = registry?.definitions?.find((entry) => entry.definition_ref === command?.cycle_definition_ref);
    if (!definition) reasons.push("command.definition-unregistered");
    else {
      if (definition.definition_digest !== command?.cycle_definition_digest) reasons.push("command.definition-substitution");
      if (!definition.command_types.includes(command?.operation)) reasons.push("command.operation-not-declared");
      if (requireEnabled && (!definition.admission.admitted || !definition.admission.enabled)) reasons.push("command.definition-not-enabled");
    }
  }
  return reasons.length > 0 ? result(false, "command", reasons) : result(true, "command", [], command);
}

export function materializeEvolutionEvent({command, revision, event_type: eventType, payload = {}}) {
  const checked = verifyEvolutionCommand(command);
  if (!checked.ok) throw new TypeError(`Cannot create event for invalid command: ${checked.reason_codes.join(",")}`);
  if (!Number.isSafeInteger(revision) || revision < 1 || !EVENT_TYPE.test(eventType ?? "")) throw new TypeError("Evolution event requires a positive revision and semantic event type.");
  const payloadDigest = evolutionProtocolDigest(canonicalizeJson(payload));
  const material = canonicalizeJson({schema_version: EVOLUTION_EVENT_SCHEMA, cycle_ref: command.cycle_ref, revision, command_id: command.command_id, event_type: eventType, target: command.target, payload_digest: payloadDigest, authority_effect: "none"});
  const eventDigest = evolutionProtocolDigest(material);
  return freeze({...material, event_id: `evolution-event:${eventDigest}`});
}

export function verifyEvolutionEvent(event) {
  const allowed = new Set(["schema_version", "event_id", "cycle_ref", "revision", "command_id", "event_type", "target", "payload_digest", "authority_effect"]);
  const reasons = unknownKeys(event, allowed, "event");
  if (event?.schema_version !== EVOLUTION_EVENT_SCHEMA) reasons.push("event.schema-version-invalid");
  if (!validIdentifier(event?.cycle_ref) || !Number.isSafeInteger(event?.revision) || event.revision < 1) reasons.push("event.cycle-revision-invalid");
  if (!/^evolution-command:[a-f0-9]{64}$/.test(event?.command_id ?? "") || !EVENT_TYPE.test(event?.event_type ?? "")) reasons.push("event.command-or-type-invalid");
  reasons.push(...unknownKeys(event?.target, new Set(["record_kind", "record_ref"]), "event.target"));
  if (!validIdentifier(event?.target?.record_kind) || !validIdentifier(event?.target?.record_ref) || !SHA256.test(event?.payload_digest ?? "")) reasons.push("event.target-or-payload-invalid");
  if (event?.authority_effect !== "none") reasons.push("event.authority-effect-invalid");
  if (object(event)) {
    const {event_id: _id, ...material} = event;
    if (event.event_id !== `evolution-event:${evolutionProtocolDigest(material)}`) reasons.push("event.id-invalid");
  }
  return reasons.length > 0 ? result(false, "event", reasons) : result(true, "event", [], event);
}

export function materializeCommandReceipt({command, disposition, previous_event_revision: previousEventRevision, events = [], reason_codes: reasonCodes = []}) {
  const checked = verifyEvolutionCommand(command);
  if (!checked.ok) throw new TypeError(`Cannot create receipt for invalid command: ${checked.reason_codes.join(",")}`);
  if (!["accepted", "rejected"].includes(disposition) || !Number.isSafeInteger(previousEventRevision) || previousEventRevision < 0) throw new TypeError("Command receipt disposition or revision is invalid.");
  if (disposition === "accepted" && events.length === 0) throw new TypeError("Accepted command receipts require at least one event.");
  if (disposition === "rejected" && events.length > 0) throw new TypeError("Rejected command receipts cannot cite accepted events.");
  for (const [index, event] of events.entries()) {
    if (event?.schema_version !== EVOLUTION_EVENT_SCHEMA || event.command_id !== command.command_id || event.cycle_ref !== command.cycle_ref || event.revision !== previousEventRevision + index + 1) throw new TypeError("Command receipt contains an invalid event sequence.");
  }
  const reasons = sortedUnique(reasonCodes.filter(validIdentifier));
  if (disposition === "rejected" && reasons.length === 0) throw new TypeError("Rejected command receipts require reason codes.");
  const material = canonicalizeJson({
    schema_version: EVOLUTION_COMMAND_RECEIPT_SCHEMA,
    command_id: command.command_id,
    command_digest: command.command_id.slice("evolution-command:".length),
    idempotency_key: command.idempotency_key,
    cycle_ref: command.cycle_ref,
    cycle_definition_digest: command.cycle_definition_digest,
    disposition,
    previous_event_revision: previousEventRevision,
    next_event_revision: disposition === "accepted" ? previousEventRevision + events.length : previousEventRevision,
    event_refs: events.map((event) => event.event_id),
    reason_codes: reasons,
    authority_effect: "none",
  });
  const receiptDigest = evolutionProtocolDigest(material);
  return freeze({...material, receipt_id: `evolution-command-receipt:${receiptDigest}`, receipt_digest: receiptDigest});
}

export function verifyCommandReceipt(receipt, {command = null} = {}) {
  const allowed = new Set(["schema_version", "receipt_id", "receipt_digest", "command_id", "command_digest", "idempotency_key", "cycle_ref", "cycle_definition_digest", "disposition", "previous_event_revision", "next_event_revision", "event_refs", "reason_codes", "authority_effect"]);
  const reasons = unknownKeys(receipt, allowed, "receipt");
  if (receipt?.schema_version !== EVOLUTION_COMMAND_RECEIPT_SCHEMA) reasons.push("receipt.schema-version-invalid");
  const expected = object(receipt) ? evolutionProtocolDigest(receiptMaterial(receipt)) : "";
  if (receipt?.receipt_digest !== expected || receipt?.receipt_id !== `evolution-command-receipt:${expected}`) reasons.push("receipt.digest-invalid");
  if (!["accepted", "rejected"].includes(receipt?.disposition)) reasons.push("receipt.disposition-invalid");
  if (!Number.isSafeInteger(receipt?.previous_event_revision) || !Number.isSafeInteger(receipt?.next_event_revision)) reasons.push("receipt.revision-invalid");
  if (receipt?.disposition === "rejected" && (receipt.next_event_revision !== receipt.previous_event_revision || receipt.event_refs?.length !== 0 || !receipt.reason_codes?.length)) reasons.push("receipt.rejection-shape-invalid");
  if (receipt?.disposition === "accepted" && (receipt.next_event_revision <= receipt.previous_event_revision || !receipt.event_refs?.length)) reasons.push("receipt.acceptance-shape-invalid");
  if (receipt?.authority_effect !== "none") reasons.push("receipt.authority-effect-invalid");
  if (command !== null) {
    const checked = verifyEvolutionCommand(command);
    if (!checked.ok || receipt?.command_id !== command.command_id || receipt?.command_digest !== command.command_id.slice("evolution-command:".length) || receipt?.idempotency_key !== command.idempotency_key || receipt?.cycle_definition_digest !== command.cycle_definition_digest) reasons.push("receipt.command-binding-invalid");
  }
  return reasons.length > 0 ? result(false, "command-receipt", reasons) : result(true, "command-receipt", [], receipt);
}

export function materializeEvolutionResult(receipt) {
  const checked = verifyCommandReceipt(receipt);
  if (!checked.ok) throw new TypeError(`Cannot create result for invalid receipt: ${checked.reason_codes.join(",")}`);
  return freeze({schema_version: EVOLUTION_RESULT_SCHEMA, command_id: receipt.command_id, disposition: receipt.disposition, receipt, authority_effect: "none"});
}

export function verifyEvolutionResult(value) {
  const reasons = unknownKeys(value, new Set(["schema_version", "command_id", "disposition", "receipt", "authority_effect"]), "result");
  if (value?.schema_version !== EVOLUTION_RESULT_SCHEMA) reasons.push("result.schema-version-invalid");
  const receipt = verifyCommandReceipt(value?.receipt);
  if (!receipt.ok || value?.command_id !== value?.receipt?.command_id || value?.disposition !== value?.receipt?.disposition) reasons.push("result.receipt-binding-invalid");
  if (value?.authority_effect !== "none") reasons.push("result.authority-effect-invalid");
  return reasons.length > 0 ? result(false, "result", reasons) : result(true, "result", [], value);
}

export function verifyArtifactIdentity(value) {
  const reasons = unknownKeys(value, new Set(["schema_version", "artifact_id", "sha256", "byte_length", "media_type", "semantic_binding", "authority_effect"]), "artifact");
  if (value?.schema_version !== "are.evolution-artifact-identity/v1" || !SHA256.test(value?.sha256 ?? "") || value?.artifact_id !== `sha256:${value?.sha256}` || !Number.isSafeInteger(value?.byte_length) || value.byte_length < 0 || !text(value?.media_type)) reasons.push("artifact.identity-invalid");
  const binding = value?.semantic_binding;
  reasons.push(...unknownKeys(binding, new Set(["cycle_ref", "cycle_definition_digest", "role", "provenance_refs", "claim_ceiling"]), "artifact.semantic-binding"));
  if (!validIdentifier(binding?.cycle_ref) || !SHA256.test(binding?.cycle_definition_digest ?? "") || !validIdentifier(binding?.role) || !validStringArray(binding?.provenance_refs) || !text(binding?.claim_ceiling)) reasons.push("artifact.semantic-binding-invalid");
  if (value?.authority_effect !== "none") reasons.push("artifact.authority-effect-invalid");
  return reasons.length > 0 ? result(false, "artifact-identity", reasons) : result(true, "artifact-identity", [], value);
}

export function verifyEffectEnvelope(value) {
  const reasons = unknownKeys(value, new Set(["schema_version", "envelope_ref", "cycle_ref", "cycle_definition_digest", "authorization_ref", "allowed_effect_classes", "resource_limits", "expires_at", "enabled", "authority_effect"]), "effect-envelope");
  if (value?.schema_version !== "are.evolution-effect-envelope/v1" || !validIdentifier(value?.envelope_ref) || !validIdentifier(value?.cycle_ref) || !SHA256.test(value?.cycle_definition_digest ?? "") || !validIdentifier(value?.authorization_ref)) reasons.push("effect-envelope.identity-invalid");
  if (!Array.isArray(value?.allowed_effect_classes) || new Set(value.allowed_effect_classes).size !== value.allowed_effect_classes.length || !value.allowed_effect_classes.every(validIdentifier) || !object(value?.resource_limits) || !text(value?.expires_at) || typeof value?.enabled !== "boolean") reasons.push("effect-envelope.bounds-invalid");
  if (value?.authority_effect !== "none") reasons.push("effect-envelope.authority-effect-invalid");
  return reasons.length > 0 ? result(false, "effect-envelope", reasons) : result(true, "effect-envelope", [], value);
}

export function verifyPhaseAdmission(value) {
  const reasons = unknownKeys(value, new Set(["schema_version", "admission_ref", "cycle_ref", "phase", "expected_event_revision", "envelope_ref", "envelope_digest", "prerequisite_receipt_refs", "disposition", "reason_codes", "authority_effect"]), "phase-admission");
  if (value?.schema_version !== "are.evolution-phase-admission/v1" || !validIdentifier(value?.admission_ref) || !validIdentifier(value?.cycle_ref) || !validIdentifier(value?.phase) || !Number.isSafeInteger(value?.expected_event_revision) || value.expected_event_revision < 0 || !validIdentifier(value?.envelope_ref) || !SHA256.test(value?.envelope_digest ?? "")) reasons.push("phase-admission.identity-invalid");
  if (!Array.isArray(value?.prerequisite_receipt_refs) || !value.prerequisite_receipt_refs.every(validIdentifier) || !["admitted", "rejected"].includes(value?.disposition) || !Array.isArray(value?.reason_codes) || !value.reason_codes.every(validIdentifier)) reasons.push("phase-admission.disposition-invalid");
  if (value?.disposition === "rejected" && value.reason_codes.length === 0) reasons.push("phase-admission.rejection-reason-required");
  if (value?.authority_effect !== "none") reasons.push("phase-admission.authority-effect-invalid");
  return reasons.length > 0 ? result(false, "phase-admission", reasons) : result(true, "phase-admission", [], value);
}

export function verifyHandoffOffer(value) {
  const reasons = unknownKeys(value, new Set(["schema_version", "handoff_ref", "handoff_type", "source_cycle_ref", "target_cycle_kind", "artifact_refs", "claim_refs", "offer_receipt_ref", "authority_effect"]), "handoff-offer");
  if (value?.schema_version !== "are.evolution-handoff-offer/v1" || !validIdentifier(value?.handoff_ref) || !validIdentifier(value?.handoff_type) || !validIdentifier(value?.source_cycle_ref) || !validIdentifier(value?.target_cycle_kind) || !validStringArray(value?.artifact_refs) || !Array.isArray(value?.claim_refs) || !value.claim_refs.every(validIdentifier) || !validIdentifier(value?.offer_receipt_ref)) reasons.push("handoff-offer.invalid");
  if (value?.authority_effect !== "none") reasons.push("handoff-offer.authority-effect-invalid");
  return reasons.length > 0 ? result(false, "handoff-offer", reasons) : result(true, "handoff-offer", [], value);
}

export function verifyHandoffAcceptance(value) {
  const reasons = unknownKeys(value, new Set(["schema_version", "handoff_ref", "offer_digest", "receiving_cycle_ref", "accepted_artifact_refs", "accepted_claim_refs", "disposition", "reason_codes", "acceptance_receipt_ref", "authority_effect"]), "handoff-acceptance");
  if (value?.schema_version !== "are.evolution-handoff-acceptance/v1" || !validIdentifier(value?.handoff_ref) || !SHA256.test(value?.offer_digest ?? "") || !validIdentifier(value?.receiving_cycle_ref) || !Array.isArray(value?.accepted_artifact_refs) || !value.accepted_artifact_refs.every(validIdentifier) || !Array.isArray(value?.accepted_claim_refs) || !value.accepted_claim_refs.every(validIdentifier) || !["accepted", "rejected"].includes(value?.disposition) || !Array.isArray(value?.reason_codes) || !value.reason_codes.every(validIdentifier) || !validIdentifier(value?.acceptance_receipt_ref)) reasons.push("handoff-acceptance.invalid");
  if (value?.disposition === "rejected" && value.reason_codes.length === 0) reasons.push("handoff-acceptance.rejection-reason-required");
  if (value?.authority_effect !== "none") reasons.push("handoff-acceptance.authority-effect-invalid");
  return reasons.length > 0 ? result(false, "handoff-acceptance", reasons) : result(true, "handoff-acceptance", [], value);
}

export function assessCommandReplay({prior_receipt: priorReceipt, command}) {
  const receiptCheck = verifyCommandReceipt(priorReceipt);
  const commandCheck = verifyEvolutionCommand(command);
  if (!receiptCheck.ok || !commandCheck.ok) return result(false, "command-replay", ["replay.input-invalid"]);
  if (priorReceipt.idempotency_key !== command.idempotency_key) return result(false, "command-replay", ["replay.idempotency-key-mismatch"]);
  if (priorReceipt.command_digest !== command.command_id.slice("evolution-command:".length)) return result(false, "command-replay", ["replay.conflict"]);
  return result(true, "command-replay", [], {disposition: "replayed", receipt: priorReceipt, authority_effect: "none"});
}

export function verifyProtocolDocument(document, options = {}) {
  if (!object(document)) return result(false, "protocol-document", ["protocol.object-required"]);
  if (document.schema_version === EVOLUTION_COMMAND_SCHEMA) return verifyEvolutionCommand(document, options);
  if (document.schema_version === EVOLUTION_RESULT_SCHEMA) return verifyEvolutionResult(document);
  if (document.schema_version === EVOLUTION_EVENT_SCHEMA) return verifyEvolutionEvent(document);
  if (document.schema_version === EVOLUTION_COMMAND_RECEIPT_SCHEMA) return verifyCommandReceipt(document, options);
  if (document.schema_version === "are.evolution-artifact-identity/v1") return verifyArtifactIdentity(document);
  if (document.schema_version === "are.evolution-effect-envelope/v1") return verifyEffectEnvelope(document);
  if (document.schema_version === "are.evolution-phase-admission/v1") return verifyPhaseAdmission(document);
  if (document.schema_version === "are.evolution-handoff-offer/v1") return verifyHandoffOffer(document);
  if (document.schema_version === "are.evolution-handoff-acceptance/v1") return verifyHandoffAcceptance(document);
  if (document.schema_version === EVOLUTION_CYCLE_DEFINITION_SCHEMA) return verifyCycleDefinition(document, options);
  if (document.schema_version === EVOLUTION_CYCLE_REGISTRY_SCHEMA) return verifyCycleDefinitionRegistry(document);
  return result(false, "protocol-document", ["protocol.schema-version-unsupported"]);
}
