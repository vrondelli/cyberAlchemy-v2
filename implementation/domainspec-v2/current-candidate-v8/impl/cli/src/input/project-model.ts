import fs from "node:fs";
import path from "node:path";

import { metaTypeIdForLabel } from "../meta-types/catalog.js";
import {
  RELATIONSHIP_AUTHORITY_SHA256,
  RELATIONSHIP_SIGNATURES,
  deprecatedRelationship,
  generatedRelationshipView,
  relationshipSignature,
} from "../relationships/authority.js";
import { resolveProjectRoot } from "./project-root.js";
import { sha256, type SourceManifestV1 } from "./source-manifest.js";

export { RELATIONSHIP_AUTHORITY_SHA256, RELATIONSHIP_SIGNATURES } from "../relationships/authority.js";

const SELECTOR_PATTERN = /^([a-z][a-z0-9]*(?:-[a-z0-9]+)*):([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/;
const NODE_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const COMPENSATION_DEPENDENCY_PATTERN = /^([a-z][a-z0-9]*(?:-[a-z0-9]+)*):depends-on:([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/;

type BodyFieldKind = "string" | "string-array";

interface BodyContract {
  readonly required: readonly string[];
  readonly optional: readonly string[];
  readonly fields: Readonly<Record<string, BodyFieldKind>>;
  readonly nonemptyArrays?: readonly string[];
}

export const BODY_CONTRACTS: Readonly<Record<string, BodyContract>> = Object.freeze({
  Entity: { required: ["description"], optional: ["fields"], fields: { description: "string", fields: "string-array" } },
  "Value Object": { required: ["description"], optional: ["fields"], fields: { description: "string", fields: "string-array" } },
  Enum: { required: ["description", "values"], optional: [], fields: { description: "string", values: "string-array" }, nonemptyArrays: ["values"] },
  Operation: {
    required: ["description", "reads", "writes", "effects", "guard", "failure_continuation"],
    optional: [],
    fields: { description: "string", reads: "string-array", writes: "string-array", effects: "string-array", guard: "string", failure_continuation: "string" },
  },
  Query: { required: ["description", "reads"], optional: [], fields: { description: "string", reads: "string-array" } },
  Calculation: { required: ["description", "inputs"], optional: [], fields: { description: "string", inputs: "string-array" } },
  Rule: { required: ["description", "predicate"], optional: [], fields: { description: "string", predicate: "string" } },
  Policy: { required: ["description", "strategies"], optional: [], fields: { description: "string", strategies: "string-array" }, nonemptyArrays: ["strategies"] },
  Workflow: {
    required: ["description", "steps", "compensations"],
    optional: ["compensation_dependencies"],
    fields: { description: "string", steps: "string-array", compensations: "string-array", compensation_dependencies: "string-array" },
    nonemptyArrays: ["steps"],
  },
  Interface: { required: ["description", "version", "operations"], optional: [], fields: { description: "string", version: "string", operations: "string-array" } },
  Event: { required: ["description"], optional: ["fields"], fields: { description: "string", fields: "string-array" } },
  Mapping: { required: ["description", "source", "target"], optional: [], fields: { description: "string", source: "string", target: "string" } },
  "State Machine": { required: ["description", "states", "initial", "transitions"], optional: [], fields: { description: "string", states: "string-array", initial: "string", transitions: "string-array" }, nonemptyArrays: ["states"] },
});

export interface DecodedBody {
  readonly [key: string]: string | readonly string[];
}

export interface DecodedEndpoint {
  readonly feature_id: string;
  readonly node_id: string;
  readonly kind: string;
}

export interface DecodedRelationship {
  readonly edge_id: string;
  readonly relationship: string;
  readonly scope: "feature" | "project";
  readonly source: DecodedEndpoint;
  readonly target: DecodedEndpoint;
}

export interface DecodedProjectNode {
  readonly project_root: string;
  readonly project_id: string;
  readonly feature_id: string;
  readonly node_id: string;
  readonly kind: string;
  readonly meta_type_id: string;
  readonly body: DecodedBody;
  readonly relationships: readonly DecodedRelationship[];
  readonly source_manifest: SourceManifestV1;
}

export class ProjectModelError extends Error {
  readonly exitCode = 22;

  constructor(readonly code: string, readonly pointer: string, message: string) {
    super(message);
    this.name = "ProjectModelError";
  }
}

function fail(code: string, pointer: string, message: string): never {
  throw new ProjectModelError(code, pointer, message);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: unknown, expected: readonly string[], pointer: string): asserts value is Record<string, unknown> {
  if (!isObject(value)) fail("MTCLI_INPUT_SCHEMA", pointer, "expected object");
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...expected].sort())) fail("MTCLI_INPUT_SCHEMA", pointer, "unexpected or missing member");
}

function readBoundJson(projectRoot: string, manifest: SourceManifestV1, relativePath: string): Record<string, unknown> {
  const ref = manifest.sources.find((source) => source.relative_path === relativePath);
  if (!ref) fail("MTCLI_INPUT_MISSING", `/${relativePath}`, "source is absent from the project manifest");
  const bytes = fs.readFileSync(path.join(projectRoot, relativePath));
  if (bytes.length !== ref.size_bytes || sha256(bytes) !== ref.sha256) fail("MTCLI_INPUT_DRIFT", `/${relativePath}`, "source changed after project-root validation");
  let value: unknown;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch {
    fail("MTCLI_INPUT_JSON", `/${relativePath}`, "source is not valid JSON");
  }
  if (!isObject(value)) fail("MTCLI_INPUT_SCHEMA", `/${relativePath}`, "source must be an object");
  return value;
}

function requireString(value: unknown, pointer: string): string {
  if (typeof value !== "string" || value.length === 0) fail("MTCLI_INPUT_BODY", pointer, "expected nonempty string");
  return value;
}

function requireStringArray(value: unknown, pointer: string, nonempty: boolean): readonly string[] {
  if (!Array.isArray(value) || (nonempty && value.length === 0)) fail("MTCLI_INPUT_BODY", pointer, "expected string array");
  const result = value.map((entry, index) => requireString(entry, `${pointer}/${index}`));
  if (new Set(result).size !== result.length) fail("MTCLI_INPUT_BODY", pointer, "duplicate array member");
  return Object.freeze(result);
}

export function decodeBody(kind: string, value: unknown, pointer = "/body"): DecodedBody {
  const contract = BODY_CONTRACTS[kind];
  if (!contract) fail("MTCLI_INPUT_META_TYPE", pointer, `unsupported backend meta-type:${kind}`);
  if (!isObject(value)) fail("MTCLI_INPUT_BODY", pointer, "body must be an object");
  const allowed = [...contract.required, ...contract.optional];
  const actual = Object.keys(value);
  if (actual.some((key) => !allowed.includes(key)) || contract.required.some((key) => !actual.includes(key))) {
    fail("MTCLI_INPUT_BODY", pointer, `closed ${kind} body has unexpected or missing fields`);
  }
  const decoded: Record<string, string | readonly string[]> = {};
  for (const key of allowed) {
    const fieldKind = contract.fields[key];
    if (!fieldKind) fail("MTCLI_INPUT_BODY", `${pointer}/${key}`, "body contract is incomplete");
    const raw = value[key];
    if (raw === undefined && contract.optional.includes(key)) {
      decoded[key] = fieldKind === "string-array" ? Object.freeze([]) : "";
    } else if (fieldKind === "string") {
      decoded[key] = requireString(raw, `${pointer}/${key}`);
    } else {
      decoded[key] = requireStringArray(raw, `${pointer}/${key}`, contract.nonemptyArrays?.includes(key) ?? false);
    }
  }
  if (kind === "State Machine") {
    const states = decoded.states as readonly string[];
    if (!states.includes(decoded.initial as string)) fail("MTCLI_INPUT_BODY", `${pointer}/initial`, "initial state is not declared");
  }
  if (kind === "Workflow") {
    const steps = decoded.steps as readonly string[];
    const compensations = decoded.compensations as readonly string[];
    if (compensations.length !== 0 && compensations.length !== steps.length) fail("MTCLI_INPUT_BODY", `${pointer}/compensations`, "compensations must be empty or align one-to-one with steps");
    const declaredCompensations = compensations.filter((operationId) => operationId !== "none");
    for (const [index, operationId] of declaredCompensations.entries()) {
      if (!NODE_ID_PATTERN.test(operationId)) fail("MTCLI_WORKFLOW_COMPENSATION_ID", `${pointer}/compensations/${index}`, "compensation must be an Operation node ID or none");
    }
    const dependencies = decoded.compensation_dependencies as readonly string[];
    const graph = new Map(declaredCompensations.map((operationId) => [operationId, new Set<string>()]));
    for (const [index, dependency] of dependencies.entries()) {
      const match = COMPENSATION_DEPENDENCY_PATTERN.exec(dependency);
      if (!match) fail("MTCLI_WORKFLOW_COMPENSATION_DEPENDENCY", `${pointer}/compensation_dependencies/${index}`, "dependency must use operation:depends-on:operation");
      const operationId = match[1] as string;
      const prerequisiteId = match[2] as string;
      if (operationId === prerequisiteId || !graph.has(operationId) || !graph.has(prerequisiteId)) {
        fail("MTCLI_WORKFLOW_COMPENSATION_DEPENDENCY", `${pointer}/compensation_dependencies/${index}`, "dependency endpoints must be distinct declared compensation Operations");
      }
      graph.get(operationId)?.add(prerequisiteId);
    }
    const emitted = new Set<string>();
    while (emitted.size < graph.size) {
      const ready = [...graph].find(([operationId, prerequisites]) => !emitted.has(operationId) && [...prerequisites].every((entry) => emitted.has(entry)));
      if (!ready) fail("MTCLI_WORKFLOW_COMPENSATION_DEPENDENCY_CYCLE", `${pointer}/compensation_dependencies`, "compensation dependency graph is cyclic");
      emitted.add(ready[0]);
    }
  }
  return Object.freeze(decoded);
}

export function validateSelectedNodeRelationships(node: DecodedProjectNode): void {
  if (node.kind !== "Workflow") return;
  const selector = `${node.feature_id}:${node.node_id}`;
  const orchestrated = node.relationships.filter((relationship) =>
    relationship.relationship === "orchestrates" &&
    `${relationship.source.feature_id}:${relationship.source.node_id}` === selector
  );
  const targetIds = orchestrated.map(({ target }) => target.node_id);
  if (new Set(targetIds).size !== targetIds.length) {
    fail("MTCLI_WORKFLOW_OPERATION_ID_AMBIGUOUS", "/relationships", "Workflow Operation node IDs must be unique across selected orchestrates edges");
  }
  const steps = node.body.steps as readonly string[];
  const compensations = (node.body.compensations as readonly string[]).filter((operationId) => operationId !== "none");
  const required = new Set([...steps, ...compensations]);
  const observed = new Set(targetIds);
  for (const operationId of required) {
    if (!observed.has(operationId)) {
      fail("MTCLI_WORKFLOW_OPERATION_RELATIONSHIP_MISSING", "/relationships", `Workflow must orchestrate declared Operation:${operationId}`);
    }
  }
  for (const operationId of observed) {
    if (!required.has(operationId)) {
      fail("MTCLI_WORKFLOW_OPERATION_RELATIONSHIP_UNDECLARED", "/relationships", `orchestrated Operation is absent from Workflow steps and compensations:${operationId}`);
    }
  }
}

interface NodeRecord extends DecodedEndpoint {
  readonly body: Record<string, unknown>;
}

function readNodes(projectRoot: string, manifest: SourceManifestV1): Map<string, NodeRecord> {
  const nodes = new Map<string, NodeRecord>();
  for (const source of manifest.sources.filter((entry) => entry.source_type === "node")) {
    const value = readBoundJson(projectRoot, manifest, source.relative_path);
    exactKeys(value, ["schema_version", "node_id", "feature_id", "kind", "body"], `/${source.relative_path}`);
    if (typeof value.feature_id !== "string" || typeof value.node_id !== "string" || typeof value.kind !== "string" || !isObject(value.body)) {
      fail("MTCLI_INPUT_SCHEMA", `/${source.relative_path}`, "invalid node source");
    }
    nodes.set(`${value.feature_id}:${value.node_id}`, { feature_id: value.feature_id, node_id: value.node_id, kind: value.kind, body: value.body });
  }
  return nodes;
}

function endpoint(nodes: Map<string, NodeRecord>, featureId: unknown, nodeId: unknown, pointer: string): NodeRecord {
  if (typeof featureId !== "string" || typeof nodeId !== "string") fail("MTCLI_RELATIONSHIP_ENDPOINT", pointer, "invalid endpoint identity");
  const result = nodes.get(`${featureId}:${nodeId}`);
  if (!result) fail("MTCLI_RELATIONSHIP_ENDPOINT", pointer, "endpoint node is missing");
  return result;
}

const DUPLICATE_REJECTING_RELATIONSHIPS = new Set(["creates", "orchestrates", "produces", "emits"]);

function validateRelationshipGraph(edges: readonly DecodedRelationship[]): void {
  const propositions = new Map<string, DecodedRelationship>();
  for (const edge of edges) {
    if (!DUPLICATE_REJECTING_RELATIONSHIPS.has(edge.relationship)) continue;
    const key = `${edge.scope}\u0000${edge.relationship}\u0000${edge.source.feature_id}:${edge.source.node_id}\u0000${edge.target.feature_id}:${edge.target.node_id}`;
    const prior = propositions.get(key);
    if (prior) fail("MTCLI_RELATIONSHIP_DUPLICATE", `/relationships/${edge.edge_id}`, `duplicate ${edge.relationship} proposition conflicts with ${prior.edge_id}`);
    propositions.set(key, edge);
  }

  const creates = edges.filter((edge) => edge.relationship === "creates");
  const outgoing = new Map<string, DecodedRelationship>();
  const incoming = new Map<string, DecodedRelationship>();
  for (const edge of creates) {
    const sourceKey = `${edge.source.feature_id}:${edge.source.node_id}`;
    const targetKey = `${edge.target.feature_id}:${edge.target.node_id}`;
    const priorOutgoing = outgoing.get(sourceKey);
    if (priorOutgoing) fail("MTCLI_RELATIONSHIP_MULTIPLICITY", `/relationships/${edge.edge_id}`, `creates source already targets ${priorOutgoing.target.feature_id}:${priorOutgoing.target.node_id}`);
    const priorIncoming = incoming.get(targetKey);
    if (priorIncoming) fail("MTCLI_RELATIONSHIP_MULTIPLICITY", `/relationships/${edge.edge_id}`, `creates target already has source ${priorIncoming.source.feature_id}:${priorIncoming.source.node_id}`);
    outgoing.set(sourceKey, edge);
    incoming.set(targetKey, edge);
  }
}

function decodeProjectEdges(projectRoot: string, manifest: SourceManifestV1, nodes: Map<string, NodeRecord>): readonly DecodedRelationship[] {
  const result: DecodedRelationship[] = [];
  for (const source of manifest.sources.filter((entry) => entry.source_type === "feature-edge" || entry.source_type === "project-edge")) {
    const value = readBoundJson(projectRoot, manifest, source.relative_path);
    const isFeature = source.source_type === "feature-edge";
    const sourceEndpoint = isFeature
      ? endpoint(nodes, value.feature_id, value.source_node_id, `/${source.relative_path}/source`)
      : endpoint(nodes, value.source_feature_id, value.source_node_id, `/${source.relative_path}/source`);
    const targetEndpoint = isFeature
      ? endpoint(nodes, value.feature_id, value.target_node_id, `/${source.relative_path}/target`)
      : endpoint(nodes, value.target_feature_id, value.target_node_id, `/${source.relative_path}/target`);
    if (typeof value.relationship !== "string" || typeof value.edge_id !== "string") fail("MTCLI_RELATIONSHIP_SCHEMA", `/${source.relative_path}`, "invalid relationship source");
    const deprecated = deprecatedRelationship(value.relationship);
    if (deprecated) fail("MTCLI_RELATIONSHIP_DEPRECATED", `/${source.relative_path}/relationship`, `deprecated relationship:${value.relationship}; use ${deprecated.replacement}`);
    const generatedView = generatedRelationshipView(value.relationship);
    if (generatedView) fail("MTCLI_RELATIONSHIP_GENERATED_VIEW", `/${source.relative_path}/relationship`, `generated view ${value.relationship} cannot be authored; author ${generatedView.from_signature}`);
    const signature = relationshipSignature(value.relationship);
    if (!signature) fail("MTCLI_RELATIONSHIP_UNKNOWN", `/${source.relative_path}/relationship`, `unknown relationship:${value.relationship}`);
    if (!signature.source_types.includes(sourceEndpoint.kind) || !signature.target_types.includes(targetEndpoint.kind)) {
      fail("MTCLI_RELATIONSHIP_ENDPOINT", `/${source.relative_path}`, `${value.relationship} rejects ${sourceEndpoint.kind}->${targetEndpoint.kind}`);
    }
    const admittedScope = isFeature
      ? signature.feature_scope.some((scope) => scope === "same-feature" || scope === "ui" || scope === "ui-backend")
      : signature.feature_scope.includes("cross-feature");
    if (!admittedScope) fail("MTCLI_RELATIONSHIP_SCOPE", `/${source.relative_path}`, `${value.relationship} rejects ${isFeature ? "same-feature" : "cross-feature"} scope`);
    result.push(Object.freeze({
      edge_id: value.edge_id,
      relationship: value.relationship,
      scope: isFeature ? "feature" : "project",
      source: Object.freeze({ feature_id: sourceEndpoint.feature_id, node_id: sourceEndpoint.node_id, kind: sourceEndpoint.kind }),
      target: Object.freeze({ feature_id: targetEndpoint.feature_id, node_id: targetEndpoint.node_id, kind: targetEndpoint.kind }),
    }));
  }
  const sorted = Object.freeze(result.sort((left, right) => left.edge_id.localeCompare(right.edge_id)));
  validateRelationshipGraph(sorted);
  return sorted;
}

export function loadProjectNode(projectRoot: unknown, selector: unknown): DecodedProjectNode {
  if (typeof selector !== "string") fail("MTCLI_INPUT_SELECTOR", "/node", "node selector must be feature-id:node-id");
  const match = SELECTOR_PATTERN.exec(selector);
  if (!match) fail("MTCLI_INPUT_SELECTOR", "/node", "node selector must be feature-id:node-id");
  const manifest = resolveProjectRoot(projectRoot);
  const root = fs.realpathSync(String(projectRoot));
  const nodes = readNodes(root, manifest);
  const selected = nodes.get(selector);
  if (!selected) fail("MTCLI_INPUT_MISSING", "/node", `selected node is missing:${selector}`);
  const metaTypeId = metaTypeIdForLabel(selected.kind);
  const body = decodeBody(selected.kind, selected.body, `/specs/${selected.feature_id}/nodes/${selected.node_id}.json/body`);
  const projectRelationships = decodeProjectEdges(root, manifest, nodes);
  const node = Object.freeze({
    project_root: root,
    project_id: manifest.project_id,
    feature_id: match[1] as string,
    node_id: match[2] as string,
    kind: selected.kind,
    meta_type_id: metaTypeId,
    body,
    relationships: Object.freeze(projectRelationships.filter((relationship) =>
      `${relationship.source.feature_id}:${relationship.source.node_id}` === selector ||
      `${relationship.target.feature_id}:${relationship.target.node_id}` === selector
    )),
    source_manifest: manifest,
  });
  validateSelectedNodeRelationships(node);
  return node;
}
