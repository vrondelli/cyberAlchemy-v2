import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type RecordJson = { [key: string]: any };

const sourceFile = fileURLToPath(import.meta.url);
const executionRoot = resolve(dirname(sourceFile), "..");
const repoRoot = resolve(dirname(sourceFile), "../../../../../../../..");
const verticalsRoot = join(executionRoot, "verticals");
const buildRoot = join(executionRoot, "build");
const domainspecCompilerPath = join(repoRoot, "projects/domainspec-v2/impl/cli/src/input/project-model.ts");
const { loadCompiledProjectGraph } = await import(pathToFileURL(domainspecCompilerPath).href) as {
  loadCompiledProjectGraph(root: string): RecordJson;
};

function sha256(bytes: string | Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function normalized(value: Json): Json {
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, normalized(value[key])])) as Json;
  }
  return value;
}

function jsonBytes(value: Json): string {
  return `${JSON.stringify(normalized(value), null, 2)}\n`;
}

function readJson(path: string): RecordJson {
  return JSON.parse(readFileSync(path, "utf8")) as RecordJson;
}

function write(path: string, bytes: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
}

function writeJson(path: string, value: Json): void {
  write(path, jsonBytes(value));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ALCHLANG_COMPILE:${message}`);
}

function ids(rows: RecordJson[], field = "id"): string[] {
  return rows.map((row) => String(row[field]));
}

function unique(values: string[], label: string): void {
  assert(new Set(values).size === values.length, `duplicate-${label}`);
}

function validateSource(source: RecordJson, capability: RecordJson, ontology: RecordJson): void {
  assert(source.schema_version === "alchlang.governed-domain-description/v1-candidate", "source-version");
  assert(source.authority_effect === "none", "source-authority-effect");
  assert(capability.capability_id === source.capability_ref, "capability-reference");
  assert(ontology.ontology_id === source.business_ontology_ref, "ontology-reference");
  assert(ontology.capability_ref === source.capability_ref, "ontology-capability-reference");
  const termIds = ids(source.terms);
  const ruleIds = ids(source.rules);
  const actionIds = ids(source.actions);
  const eventIds = ids(source.events);
  const authorityIds = ids(source.authority_boundaries);
  [termIds, ruleIds, actionIds, eventIds, authorityIds].forEach((set, index) => unique(set, `source-set-${index}`));
  const ontologyNodeIds = new Set(ids(ontology.nodes));
  unique(ids(ontology.nodes), "business-ontology-node");
  for (const id of [...termIds, ...ruleIds, ...actionIds, ...eventIds, ...authorityIds]) {
    assert(ontologyNodeIds.has(id), `business-ontology-node-missing:${id}`);
  }
  for (const relation of ontology.relations) {
    assert(ontologyNodeIds.has(relation.source), `business-relation-source:${relation.id}`);
    assert(ontologyNodeIds.has(relation.target), `business-relation-target:${relation.id}`);
  }
  const terms = new Set(termIds);
  for (const edge of source.ontology_edges) {
    assert(terms.has(edge.source), `ontology-edge-source:${edge.id}`);
    assert(terms.has(edge.target), `ontology-edge-target:${edge.id}`);
    assert(typeof edge.type === "string" && edge.type.length > 0, `ontology-edge-type:${edge.id}`);
  }
  const rules = new Set(ruleIds);
  const actions = new Set(actionIds);
  const events = new Set(eventIds);
  const authorities = new Set(authorityIds);
  for (const rule of source.rules) for (const ref of rule.action_refs) assert(actions.has(ref), `rule-action:${rule.id}:${ref}`);
  for (const action of source.actions) {
    for (const ref of action.rule_refs) assert(rules.has(ref), `action-rule:${action.id}:${ref}`);
    for (const ref of action.event_refs) assert(events.has(ref), `action-event:${action.id}:${ref}`);
    assert(authorities.has(action.authority_boundary_ref), `action-authority:${action.id}`);
  }
  for (const permission of source.permissions) assert(actions.has(permission.action_ref), `permission-action:${permission.id}`);
  const states = new Set(source.state_machine.states);
  assert(states.has(source.state_machine.initial), "state-machine-initial");
  for (const transition of source.state_machine.transitions) {
    assert(states.has(transition.from) && states.has(transition.to), `transition-state:${transition.id}`);
    assert(transition.rule_ref === null || rules.has(transition.rule_ref), `transition-rule:${transition.id}`);
    assert(transition.event_ref === null || events.has(transition.event_ref), `transition-event:${transition.id}`);
  }
  for (const question of source.open_questions) {
    assert(question.status === "resolved", `unresolved-question:${question.id}`);
    assert(typeof question.resolution === "string" && question.resolution.length > 0, `question-resolution:${question.id}`);
  }
}

function primitive(name: string): RecordJson {
  const supported = new Set(["string", "boolean", "integer", "decimal", "timestamp", "uuid"]);
  return { kind: "primitive", name: supported.has(name) ? name : "string" };
}

function payloadType(field: string): string {
  if (field.includes("quantity")) return "integer";
  if (field === "amount") return "decimal";
  if (field.endsWith("-id")) return "uuid";
  return "string";
}

function lowerToDomainSpec(source: RecordJson, targetRoot: string): void {
  const feature = source.domain_id;
  const subject = source.primary_subject.term_id;
  const stateMachine = source.state_machine.id;
  const nodes: RecordJson[] = [];
  const edges: RecordJson[] = [];
  nodes.push({
    schema_version: "domainspec.node/v1", node_id: subject, feature_id: feature, kind: "Entity",
    body: {
      description: source.terms.find((term: RecordJson) => term.id === subject)?.meaning ?? source.title,
      identity_field: source.primary_subject.fields[0].id,
      fields: source.primary_subject.fields.map((field: RecordJson) => ({ field_id: field.id, type_ref: primitive(field.type), required: field.required }))
    }
  });
  for (const rule of source.rules) nodes.push({
    schema_version: "domainspec.node/v1", node_id: rule.id, feature_id: feature, kind: "Rule",
    body: { description: rule.description, predicate: rule.predicate }
  });
  for (const event of source.events) nodes.push({
    schema_version: "domainspec.node/v1", node_id: event.id, feature_id: feature, kind: "Event",
    body: {
      description: event.description, event_type: event.id, version: "1",
      occurrence_id: { field_id: "occurrence-id", type_ref: primitive("uuid"), required: true },
      occurred_at_policy: "required",
      payload: event.payload.map((field: string) => ({ field_id: field, type_ref: primitive(payloadType(field)), required: true }))
    }
  });
  for (const action of source.actions) nodes.push({
    schema_version: "domainspec.node/v1", node_id: action.id, feature_id: feature, kind: "Operation",
    body: {
      description: action.description, reads: action.reads, writes: action.writes,
      effects: action.event_refs, guard: action.rule_refs.join("+"), failure_continuation: action.failure_continuation
    }
  });
  nodes.push({
    schema_version: "domainspec.node/v1", node_id: stateMachine, feature_id: feature, kind: "State Machine",
    body: {
      description: `${source.title} lifecycle.`, states: source.state_machine.states, initial: source.state_machine.initial,
      transitions: source.state_machine.transitions.map((transition: RecordJson) => ({
        transition_id: transition.id, source_state: transition.from, target_state: transition.to,
        guard_ref: transition.rule_ref === null ? null : `${feature}:${transition.rule_ref}`,
        effect_event_ref: transition.event_ref === null ? null : `${feature}:${transition.event_ref}`
      }))
    }
  });
  const addEdge = (id: string, relationship: string, from: string, to: string): void => edges.push({
    schema_version: "domainspec.edge/v1", edge_id: id, feature_id: feature, relationship,
    source_node_id: from, target_node_id: to, scope: "feature"
  });
  for (const action of source.actions) {
    addEdge(`${subject}-performs-${action.id}`, "performs", subject, action.id);
    addEdge(`${action.id}-reads-${subject}`, "reads", action.id, subject);
    for (const rule of action.rule_refs) addEdge(`${rule}-enforces-${action.id}`, "enforces", rule, action.id);
    for (const event of action.event_refs) addEdge(`${action.id}-produces-${event}`, "produces", action.id, event);
  }
  for (const event of source.events) {
    addEdge(`${subject}-emits-${event.id}`, "emits", subject, event.id);
    if (source.state_machine.transitions.some((transition: RecordJson) => transition.event_ref === event.id)) {
      addEdge(`${event.id}-transitions-${stateMachine}`, "transitions", event.id, stateMachine);
    }
  }
  unique(ids(nodes, "node_id"), "domainspec-node");
  unique(ids(edges, "edge_id"), "domainspec-edge");
  writeJson(join(targetRoot, "project.json"), {
    schema_version: "domainspec.project/v1", project_id: source.domain_id, features: [feature], cross_feature_edges: []
  });
  writeJson(join(targetRoot, `specs/${feature}/feature.json`), {
    schema_version: "domainspec.feature/v1", feature_id: feature,
    nodes: ids(nodes, "node_id").sort(), edges: ids(edges, "edge_id").sort()
  });
  for (const node of nodes) writeJson(join(targetRoot, `specs/${feature}/nodes/${node.node_id}.json`), node);
  for (const edge of edges) writeJson(join(targetRoot, `specs/${feature}/edges/${edge.edge_id}.json`), edge);
}

function typeName(domainId: string): string {
  return domainId.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("");
}

function emitTypes(source: RecordJson): string {
  const name = typeName(source.domain_id);
  const fields = source.primary_subject.fields.map((field: RecordJson) => {
    const ts = field.type === "integer" || field.type === "decimal" ? "number" : field.type === "boolean" ? "boolean" : "string";
    return `  ${JSON.stringify(field.id)}${field.required ? "" : "?"}: ${ts};`;
  }).join("\n");
  return `export interface ${name}Subject {\n${fields}\n}\n\nexport type DomainOutcome = "pass" | "denied" | "blocked" | "failed" | "uncertain";\nexport interface DomainResult { outcome: DomainOutcome; code: string; event?: string; receipt?: Record<string, unknown>; idempotent?: boolean; }\n`;
}

function emitSchema(source: RecordJson): string {
  const checks = source.primary_subject.fields.filter((field: RecordJson) => field.required).map((field: RecordJson) => {
    const expected = field.type === "integer" || field.type === "decimal" ? "number" : field.type === "boolean" ? "boolean" : "string";
    return `  if (typeof input[${JSON.stringify(field.id)}] !== ${JSON.stringify(expected)}) throw new Error("SCHEMA_REQUIRED:${field.id}");`;
  }).join("\n");
  return `export function validateSubject(input: Record<string, unknown>): void {\n${checks}\n}\n`;
}

function emitMachine(source: RecordJson): string {
  const transitions = source.state_machine.transitions.map((transition: RecordJson) => ({ id: transition.id, from: transition.from, to: transition.to, rule: transition.rule_ref, event: transition.event_ref }));
  return `export const states = ${JSON.stringify(source.state_machine.states)} as const;\nexport const initialState = ${JSON.stringify(source.state_machine.initial)} as const;\nexport const transitions = ${JSON.stringify(transitions, null, 2)} as const;\n\nexport function transition(current: string, transitionId: string, guardAccepted = true): { state: string; event: string | null } {\n  const selected = transitions.find((candidate) => candidate.id === transitionId);\n  if (!selected) throw new Error("UNDECLARED_TRANSITION");\n  if (selected.from !== current) throw new Error("SOURCE_MISMATCH");\n  if (selected.rule !== null && !guardAccepted) throw new Error("GUARD_REJECTED");\n  return { state: selected.to, event: selected.event };\n}\n`;
}

function emitEvents(source: RecordJson): string {
  const events = Object.fromEntries(source.events.map((event: RecordJson) => [event.id, { eventType: event.id, version: 1, payload: event.payload }]));
  return `export const eventContracts = ${JSON.stringify(events, null, 2)} as const;\n`;
}

function emitCreditTools(): string {
  return `import type { DomainResult } from "./domain.types.ts";\n\nexport interface CreditAdapter { release(customerId: string, amount: number): { receiptId: string }; }\nexport class InMemoryCreditAdapter implements CreditAdapter { calls: Array<{ customerId: string; amount: number }> = []; release(customerId: string, amount: number) { this.calls.push({ customerId, amount }); return { receiptId: \`credit-\${this.calls.length}\` }; } }\nexport function releaseCredit(input: { customerId: string; status: string; riskScore: number; riskProvenanceKnown: boolean; humanConfirmed: boolean; authorityCurrent: boolean; amount: number }, adapter: CreditAdapter): DomainResult {\n  if (!input.riskProvenanceKnown) return { outcome: "blocked", code: "RISK_PROVENANCE_UNKNOWN" };\n  if (input.status !== "approved") return { outcome: "denied", code: "CUSTOMER_NOT_APPROVED" };\n  if (input.riskScore <= 472 && !input.humanConfirmed) return { outcome: "denied", code: "HUMAN_CONFIRMATION_REQUIRED" };\n  if (!input.authorityCurrent) return { outcome: "denied", code: "AUTHORITY_NOT_CURRENT" };\n  const receipt = adapter.release(input.customerId, input.amount);\n  return { outcome: "pass", code: "CREDIT_RELEASED", event: "credit-released", receipt };\n}\n`;
}

function emitInventoryTools(): string {
  return `import type { DomainResult } from "./domain.types.ts";\n\nexport class InMemoryInventoryAdapter { available: number; private reservations = new Map<string, number>(); constructor(available: number) { this.available = available; } reserve(requestKey: string, quantity: number): DomainResult { if (this.reservations.has(requestKey)) return { outcome: "pass", code: "ALREADY_RESERVED", event: "inventory-reserved", idempotent: true }; if (quantity > this.available) return { outcome: "denied", code: "INSUFFICIENT_AVAILABILITY" }; this.available -= quantity; this.reservations.set(requestKey, quantity); return { outcome: "pass", code: "INVENTORY_RESERVED", event: "inventory-reserved" }; } release(requestKey: string): DomainResult { const quantity = this.reservations.get(requestKey); if (quantity === undefined) return { outcome: "denied", code: "RESERVATION_NOT_FOUND" }; this.reservations.delete(requestKey); this.available += quantity; return { outcome: "pass", code: "RESERVATION_RELEASED", event: "reservation-released" }; } }\nexport function reserveInventory(input: { requestKey: string; quantity: number; observationOwnerResolved: boolean }, adapter: InMemoryInventoryAdapter): DomainResult { if (!input.observationOwnerResolved) return { outcome: "blocked", code: "OBSERVATION_OWNER_UNKNOWN" }; if (!Number.isInteger(input.quantity) || input.quantity <= 0) return { outcome: "denied", code: "QUANTITY_NOT_POSITIVE" }; return adapter.reserve(input.requestKey, input.quantity); }\nexport function releaseReservation(requestKey: string, adapter: InMemoryInventoryAdapter): DomainResult { return adapter.release(requestKey); }\n`;
}

function emitRollbackTools(): string {
  return `import type { DomainResult } from "./domain.types.ts";\n\nexport type SandboxOutcome = "success" | "failure" | "timeout";\nexport class SandboxRollbackAdapter { readonly sandbox = true; readonly endpoint = null; calls = 0; constructor(private outcome: SandboxOutcome) {} rollback(serviceId: string, targetRevision: string) { this.calls += 1; return { outcome: this.outcome, receiptId: \`sandbox-\${this.calls}\`, serviceId, targetRevision, endpoint: this.endpoint }; } }\nexport function rollbackDeployment(input: { serviceId: string; incidentActive: boolean; targetApproved: boolean; targetCurrent: boolean; grantCurrent: boolean; confirmed: boolean; targetRevision: string }, adapter: SandboxRollbackAdapter): DomainResult { if (!adapter.sandbox || adapter.endpoint !== null) return { outcome: "blocked", code: "NON_SANDBOX_ADAPTER" }; if (!input.incidentActive) return { outcome: "denied", code: "INCIDENT_NOT_ACTIVE" }; if (!input.targetApproved || !input.targetCurrent) return { outcome: "denied", code: "TARGET_NOT_CURRENT" }; if (!input.grantCurrent) return { outcome: "denied", code: "GRANT_NOT_CURRENT" }; if (!input.confirmed) return { outcome: "denied", code: "CONFIRMATION_REQUIRED" }; const receipt = adapter.rollback(input.serviceId, input.targetRevision); if (receipt.outcome === "timeout") return { outcome: "uncertain", code: "ROLLBACK_OUTCOME_UNCERTAIN", event: "rollback-outcome-uncertain", receipt }; if (receipt.outcome === "failure") return { outcome: "failed", code: "ROLLBACK_FAILED", receipt }; return { outcome: "pass", code: "ROLLBACK_COMPLETED", event: "rollback-completed", receipt }; }\n`;
}

function emitTools(source: RecordJson): string {
  if (source.runtime_profile === "credit-release-reference-v1") return emitCreditTools();
  if (source.runtime_profile === "inventory-reservation-reference-v1") return emitInventoryTools();
  if (source.runtime_profile === "production-rollback-sandbox-reference-v1") return emitRollbackTools();
  throw new Error(`ALCHLANG_COMPILE:runtime-profile:${source.runtime_profile}`);
}

function emitTests(source: RecordJson): string {
  if (source.runtime_profile === "credit-release-reference-v1") return `import assert from "node:assert/strict"; import test from "node:test"; import { transition } from "./domain.machine.ts"; import { validateSubject } from "./domain.schema.ts"; import { eventContracts } from "./domain.events.ts"; import { InMemoryCreditAdapter, releaseCredit } from "./domain.tools.ts";\nconst base = { customerId: "c-1", status: "approved", riskScore: 700, riskProvenanceKnown: true, humanConfirmed: false, authorityCurrent: true, amount: 100 };\ntest("generated subject schema checks required fields", () => { validateSubject({ "customer-id": "c-1", "risk-score": 700, status: "approved" }); assert.throws(() => validateSubject({ "customer-id": "c-1" })); });\ntest("generated event contract is versioned", () => assert.equal(eventContracts["credit-released"].version, 1));\ntest("approved low-risk release succeeds", () => { const adapter = new InMemoryCreditAdapter(); assert.equal(releaseCredit(base, adapter).outcome, "pass"); assert.equal(adapter.calls.length, 1); });\ntest("pending release is denied", () => assert.equal(releaseCredit({ ...base, status: "pending" }, new InMemoryCreditAdapter()).code, "CUSTOMER_NOT_APPROVED"));\ntest("risk score 472 requires confirmation", () => assert.equal(releaseCredit({ ...base, riskScore: 472 }, new InMemoryCreditAdapter()).code, "HUMAN_CONFIRMATION_REQUIRED"));\ntest("unknown risk provenance blocks", () => assert.equal(releaseCredit({ ...base, riskProvenanceKnown: false }, new InMemoryCreditAdapter()).outcome, "blocked"));\ntest("authority is rechecked", () => assert.equal(releaseCredit({ ...base, authorityCurrent: false }, new InMemoryCreditAdapter()).code, "AUTHORITY_NOT_CURRENT"));\ntest("state transition remains causal", () => assert.deepEqual(transition("approved", "release-credit"), { state: "released", event: "credit-released" }));\n`;
  if (source.runtime_profile === "inventory-reservation-reference-v1") return `import assert from "node:assert/strict"; import test from "node:test"; import { transition } from "./domain.machine.ts"; import { validateSubject } from "./domain.schema.ts"; import { eventContracts } from "./domain.events.ts"; import { InMemoryInventoryAdapter, releaseReservation, reserveInventory } from "./domain.tools.ts";\ntest("generated subject schema checks required fields", () => { validateSubject({ "stock-item-id": "s-1", "available-quantity": 5, status: "requested" }); assert.throws(() => validateSubject({ "stock-item-id": "s-1" })); });\ntest("generated event contract is versioned", () => assert.equal(eventContracts["inventory-reserved"].version, 1));\ntest("reservation within availability succeeds", () => { const adapter = new InMemoryInventoryAdapter(5); assert.equal(reserveInventory({ requestKey: "a", quantity: 3, observationOwnerResolved: true }, adapter).outcome, "pass"); assert.equal(adapter.available, 2); });\ntest("over-reservation is denied", () => assert.equal(reserveInventory({ requestKey: "a", quantity: 6, observationOwnerResolved: true }, new InMemoryInventoryAdapter(5)).code, "INSUFFICIENT_AVAILABILITY"));\ntest("duplicate request is idempotent", () => { const adapter = new InMemoryInventoryAdapter(5); reserveInventory({ requestKey: "a", quantity: 3, observationOwnerResolved: true }, adapter); const second = reserveInventory({ requestKey: "a", quantity: 3, observationOwnerResolved: true }, adapter); assert.equal(second.idempotent, true); assert.equal(adapter.available, 2); });\ntest("competing requests preserve invariant", () => { const adapter = new InMemoryInventoryAdapter(5); assert.equal(reserveInventory({ requestKey: "a", quantity: 3, observationOwnerResolved: true }, adapter).outcome, "pass"); assert.equal(reserveInventory({ requestKey: "b", quantity: 3, observationOwnerResolved: true }, adapter).outcome, "denied"); assert.equal(adapter.available, 2); });\ntest("release restores availability", () => { const adapter = new InMemoryInventoryAdapter(5); reserveInventory({ requestKey: "a", quantity: 3, observationOwnerResolved: true }, adapter); assert.equal(releaseReservation("a", adapter).outcome, "pass"); assert.equal(adapter.available, 5); });\ntest("unknown observation owner blocks", () => assert.equal(reserveInventory({ requestKey: "a", quantity: 1, observationOwnerResolved: false }, new InMemoryInventoryAdapter(5)).outcome, "blocked"));\ntest("state transition remains causal", () => assert.deepEqual(transition("requested", "reserve"), { state: "reserved", event: "inventory-reserved" }));\n`;
  return `import assert from "node:assert/strict"; import test from "node:test"; import { transition } from "./domain.machine.ts"; import { validateSubject } from "./domain.schema.ts"; import { eventContracts } from "./domain.events.ts"; import { rollbackDeployment, SandboxRollbackAdapter } from "./domain.tools.ts";\nconst base = { serviceId: "s-1", incidentActive: true, targetApproved: true, targetCurrent: true, grantCurrent: true, confirmed: true, targetRevision: "r-1" };\ntest("generated subject schema checks required fields", () => { validateSubject({ "service-id": "s-1", "current-revision": "r-2", status: "degraded" }); assert.throws(() => validateSubject({ "service-id": "s-1" })); });\ntest("generated event contract is versioned", () => assert.equal(eventContracts["rollback-completed"].version, 1));\ntest("authorized simulated rollback succeeds", () => { const adapter = new SandboxRollbackAdapter("success"); assert.equal(rollbackDeployment(base, adapter).outcome, "pass"); assert.equal(adapter.calls, 1); assert.equal(adapter.endpoint, null); });\ntest("missing confirmation is denied", () => assert.equal(rollbackDeployment({ ...base, confirmed: false }, new SandboxRollbackAdapter("success")).code, "CONFIRMATION_REQUIRED"));\ntest("revoked grant is denied", () => assert.equal(rollbackDeployment({ ...base, grantCurrent: false }, new SandboxRollbackAdapter("success")).code, "GRANT_NOT_CURRENT"));\ntest("stale target is denied", () => assert.equal(rollbackDeployment({ ...base, targetCurrent: false }, new SandboxRollbackAdapter("success")).code, "TARGET_NOT_CURRENT"));\ntest("timeout is uncertain rather than success", () => assert.equal(rollbackDeployment(base, new SandboxRollbackAdapter("timeout")).outcome, "uncertain"));\ntest("adapter exposes no real endpoint", () => assert.equal(new SandboxRollbackAdapter("success").endpoint, null));\ntest("state transition remains causal", () => assert.deepEqual(transition("rolling-back", "complete-rollback"), { state: "restored", event: "rollback-completed" }));\n`;
}

function filesRecursively(root: string): string[] {
  if (!statSync(root).isDirectory()) return [root];
  return readdirSync(root).sort().flatMap((entry) => filesRecursively(join(root, entry)));
}

function treeDigest(root: string): string {
  const records = filesRecursively(root).map((path) => `${relative(root, path)}:${sha256(readFileSync(path))}`);
  return sha256(`${records.join("\n")}\n`);
}

function generateVertical(verticalRoot: string, targetRoot: string): RecordJson {
  const sourcePath = join(verticalRoot, "alchlang.domain.json");
  const capabilityPath = join(verticalRoot, "product-capability.json");
  const ontologyPath = join(verticalRoot, "business-ontology.json");
  const source = readJson(sourcePath);
  const capability = readJson(capabilityPath);
  const ontology = readJson(ontologyPath);
  validateSource(source, capability, ontology);
  const dsRoot = join(targetRoot, "domainspec");
  const generatedRoot = join(targetRoot, "generated");
  lowerToDomainSpec(source, dsRoot);
  const rawGraph = loadCompiledProjectGraph(dsRoot);
  const graph = { ...rawGraph, project_root: "." };
  const graphBytes = jsonBytes(graph as Json);
  const graphDigest = sha256(graphBytes);
  const systemOntology = {
    schema_version: "cav2.alchlang.generated-system-ontology/v1-candidate",
    ontology_id: `cav2.alchlang.example.${source.domain_id}.system`,
    source_graph_sha256: graphDigest,
    business_nodes: source.terms.map((term: RecordJson) => ({ id: `business:${term.id}`, role: "ontology-term", meaning: term.meaning })),
    system_nodes: graph.nodes.map((node: RecordJson) => ({ id: `system:${node.selector}`, role: node.kind, body: node.body })),
    relations: graph.relationships.map((edge: RecordJson) => ({ id: edge.edge_id, type: edge.relationship, source: `system:${edge.source.feature_id}:${edge.source.node_id}`, target: `system:${edge.target.feature_id}:${edge.target.node_id}` })),
    authority_effect: "none"
  };
  const generated: Record<string, string> = {
    "domain.types.ts": emitTypes(source),
    "domain.schema.ts": emitSchema(source),
    "domain.machine.ts": emitMachine(source),
    "domain.events.ts": emitEvents(source),
    "domain.tools.ts": emitTools(source),
    "domain.test.ts": emitTests(source),
    "domain.graph.json": graphBytes,
    "system-ontology.json": jsonBytes(systemOntology as Json)
  };
  const traceability = {
    schema_version: "cav2.alchlang.traceability/v1-candidate",
    domain_id: source.domain_id,
    alchlang_source_sha256: sha256(readFileSync(sourcePath)),
    domainspec_source_manifest_sha256: graph.source_manifest.manifest_sha256,
    compiled_graph_sha256: graphDigest,
    artifact_bindings: Object.keys(generated).sort().map((artifact) => ({
      artifact, source_refs: [source.domain_id, ...ids(source.terms), ...ids(source.rules), ...ids(source.actions), ...ids(source.events)],
      system_refs: graph.nodes.map((node: RecordJson) => node.selector)
    })),
    business_only_terms: source.terms.filter((term: RecordJson) => term.id !== source.primary_subject.term_id).map((term: RecordJson) => term.id),
    authority_effect: "none"
  };
  generated["traceability.json"] = jsonBytes(traceability as Json);
  for (const [name, bytes] of Object.entries(generated)) write(join(generatedRoot, name), bytes);
  const implementationFiles = Object.keys(generated).filter((name) => name.endsWith(".ts")).sort();
  const generationReceipt = {
    schema_version: "cav2.alchlang.generation-receipt/v1-candidate",
    domain_id: source.domain_id,
    inputs: {
      product_capability_sha256: sha256(readFileSync(capabilityPath)),
      business_ontology_sha256: sha256(readFileSync(ontologyPath)),
      alchlang_source_sha256: sha256(readFileSync(sourcePath)),
      domainspec_source_manifest_sha256: graph.source_manifest.manifest_sha256
    },
    outputs: Object.fromEntries(Object.entries(generated).sort().map(([name, bytes]) => [name, sha256(bytes)])),
    compiled_graph_sha256: graphDigest,
    system_ontology_sha256: sha256(generated["system-ontology.json"]),
    implementation_sha256: sha256(implementationFiles.map((name) => `${name}:${sha256(generated[name])}`).join("\n")),
    domainspec_compiler_sha256: sha256(readFileSync(domainspecCompilerPath)),
    node_runtime: process.version,
    declared_node_runtime: "v26.8.1",
    toolchain_drift: process.version !== "v26.8.1",
    authority_effect: "none"
  };
  writeJson(join(targetRoot, "evidence/generation-receipt.json"), generationReceipt as Json);
  const binding = {
    schema_version: "cav2.alchlang.construction-binding/v1-candidate",
    binding_id: `ALCHLANG-BIND-${source.domain_id.toUpperCase()}-001`,
    status: "candidate-pending-source-local-and-user-conformance-review",
    definitions: { ref: "ALCHLANG-INITIAL-LANGUAGE-DEFINITION-PACK", digest: readJson(join(executionRoot, "AUTHORIZATION.v1.json")).predecessor_sha256.definition_pack },
    product_capability: { ref: capability.capability_id, digest: generationReceipt.inputs.product_capability_sha256 },
    business_ontology: { ref: ontology.ontology_id, digest: generationReceipt.inputs.business_ontology_sha256 },
    alchlang_source: { ref: relative(executionRoot, sourcePath), digest: generationReceipt.inputs.alchlang_source_sha256 },
    domainspec_source: { ref: relative(executionRoot, dsRoot), manifest_digest: graph.source_manifest.manifest_sha256 },
    compiled_graph: { ref: relative(executionRoot, join(generatedRoot, "domain.graph.json")), digest: graphDigest },
    system_ontology: { ref: relative(executionRoot, join(generatedRoot, "system-ontology.json")), digest: generationReceipt.system_ontology_sha256 },
    implementation: { ref: relative(executionRoot, generatedRoot), digest: generationReceipt.implementation_sha256 },
    conformance: null,
    authority_effect: "none"
  };
  writeJson(join(targetRoot, "evidence/construction-binding.candidate.json"), binding as Json);
  return { source, generatedRoot, generationReceipt };
}

function buildAll(target: string): RecordJson[] {
  mkdirSync(target, { recursive: true });
  return readdirSync(verticalsRoot).sort().map((name) => generateVertical(join(verticalsRoot, name), join(target, name)));
}

function safeReplaceBuild(): void {
  assert(buildRoot === join(executionRoot, "build"), "unsafe-build-root");
  assert(buildRoot.startsWith(`${executionRoot}${sep}`), "unsafe-build-boundary");
  rmSync(buildRoot, { recursive: true, force: true });
  buildAll(buildRoot);
  const temp = mkdtempSync(join(tmpdir(), "alchlang-determinism-"));
  try {
    const a = join(temp, "a");
    const b = join(temp, "b");
    buildAll(a);
    buildAll(b);
    const results = readdirSync(verticalsRoot).sort().map((name) => {
      const first = treeDigest(join(a, name, "generated"));
      const second = treeDigest(join(b, name, "generated"));
      assert(first === second, `non-deterministic-generated-tree:${name}`);
      const final = treeDigest(join(buildRoot, name, "generated"));
      assert(final === first, `final-generated-tree-drift:${name}`);
      return { vertical_id: name, first_sha256: first, second_sha256: second, final_sha256: final, status: "PASS" };
    });
    writeJson(join(executionRoot, "evidence/determinism.json"), {
      schema_version: "cav2.alchlang.determinism-evidence/v1", campaign_id: "CA2-CAMPAIGN-ALCHLANG-THREE-COMPILED-VERTICALS-001",
      comparisons: results, authority_effect: "none"
    });
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

export { validateSource };

if (process.argv[1] && resolve(process.argv[1]) === sourceFile) {
  safeReplaceBuild();
  process.stdout.write(`${jsonBytes({ result: "PASS", verticals: readdirSync(verticalsRoot).sort(), build_root: relative(repoRoot, buildRoot), authority_effect: "none" })}`);
}
