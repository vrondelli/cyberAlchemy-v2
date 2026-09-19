import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const ontologyDir = resolve(scriptDir, "..");

function findRepositoryRoot(start) {
  let cursor = start;
  while (true) {
    if (existsSync(join(cursor, ".git"))) return cursor;
    const parent = dirname(cursor);
    if (parent === cursor) throw new Error("repository root not found");
    cursor = parent;
  }
}

const repositoryRoot = findRepositoryRoot(ontologyDir);
const checks = [];

function check(checkId, condition, detail) {
  checks.push({ check_id: checkId, outcome: condition ? "PASS" : "BLOCK", detail });
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ontologyDir, relativePath), "utf8"));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function unique(values) {
  return values.length === new Set(values).size;
}

function typeMatches(value, type) {
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  return typeof value === type;
}

function validateSchema(value, schema, pointer = "$") {
  const errors = [];
  if (schema.type && !typeMatches(value, schema.type)) {
    return [`${pointer}: expected ${schema.type}`];
  }
  if (Object.hasOwn(schema, "const") && !sameJson(value, schema.const)) {
    errors.push(`${pointer}: expected const ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((item) => sameJson(value, item))) {
    errors.push(`${pointer}: value is outside enum`);
  }
  if (typeof value === "string") {
    if (schema.minLength && value.length < schema.minLength) errors.push(`${pointer}: string too short`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${pointer}: pattern mismatch`);
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${pointer}: below minimum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) errors.push(`${pointer}: too few items`);
    if (schema.uniqueItems && !unique(value.map((item) => JSON.stringify(item)))) errors.push(`${pointer}: duplicate items`);
    if (schema.items) {
      value.forEach((item, index) => errors.push(...validateSchema(item, schema.items, `${pointer}[${index}]`)));
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push(`${pointer}: missing ${key}`);
    }
    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(value, key)) errors.push(...validateSchema(value[key], childSchema, `${pointer}.${key}`));
    }
  }
  return errors;
}

const profile = readJson("PROFILE.json");
const typeSelection = readJson("TYPE-SELECTION.json");
const sourcesDocument = readJson("SOURCES.json");
const nodesDocument = readJson("NODES.json");
const relationsDocument = readJson("RELATIONS.json");
const viewsDocument = readJson("VIEWS.json");
const residueEntries = readFileSync(join(ontologyDir, "RESIDUE.jsonl"), "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const schemaArtifacts = [
  ["PROFILE.json", profile, "schemas/profile.schema.json"],
  ["SOURCES.json", sourcesDocument, "schemas/sources.schema.json"],
  ["NODES.json", nodesDocument, "schemas/nodes.schema.json"],
  ["RELATIONS.json", relationsDocument, "schemas/relations.schema.json"],
  ["VIEWS.json", viewsDocument, "schemas/views.schema.json"]
];

for (const [artifact, value, schemaPath] of schemaArtifacts) {
  const errors = validateSchema(value, readJson(schemaPath));
  check(`schema:${artifact}`, errors.length === 0, errors.length === 0 ? `${artifact} matches ${schemaPath}` : errors.join("; "));
}
const residueSchema = readJson("schemas/residue-entry.schema.json");
const residueErrors = residueEntries.flatMap((entry, index) =>
  validateSchema(entry, residueSchema, `$[${index}]`)
);
check("schema:RESIDUE.jsonl", residueErrors.length === 0, residueErrors.length === 0 ? "all residue entries match the owned schema" : residueErrors.join("; "));

check(
  "type-selection",
  typeSelection.selected_ontology_type === "system-runtime" &&
    typeSelection.materialization_mode === "package-required" &&
    typeSelection.visibility === "private" &&
    typeSelection.authority_effect === "none",
  "system-runtime selected as a private package-required candidate with authority_effect none"
);

const sourceIds = sourcesDocument.sources.map(({ source_id }) => source_id);
check("source-id-uniqueness", unique(sourceIds), `${sourceIds.length} source identities are unique`);
for (const source of sourcesDocument.sources) {
  const sourcePath = join(repositoryRoot, source.path);
  const present = existsSync(sourcePath);
  check(`source-present:${source.source_id}`, present, source.path);
  if (!present) continue;
  const bytes = readFileSync(sourcePath);
  check(`source-sha256:${source.source_id}`, sha256(bytes) === source.sha256, source.path);
  check(`source-size:${source.source_id}`, statSync(sourcePath).size === source.size_bytes, `${source.path} (${source.size_bytes} bytes)`);
}

const sourceIdSet = new Set(sourceIds);
const nodes = nodesDocument.nodes;
const nodeIds = nodes.map(({ node_id }) => node_id);
const nodeIdSet = new Set(nodeIds);
check("node-id-uniqueness", unique(nodeIds), `${nodeIds.length} node identities are unique`);
check(
  "node-role-closure",
  nodes.every(({ role }) => profile.allowed_node_roles.includes(role)),
  "every node role is admitted by PROFILE.json"
);
check(
  "node-source-closure",
  nodes.every(({ source_refs }) => source_refs.every((sourceId) => sourceIdSet.has(sourceId))),
  "every node source reference resolves"
);
check(
  "node-authority-ceiling",
  nodes.every(({ authority_effect }) => authority_effect === "none"),
  "every node preserves authority_effect none"
);

const relations = relationsDocument.relations;
const relationIds = relations.map(({ relation_id }) => relation_id);
check("relation-id-uniqueness", unique(relationIds), `${relationIds.length} relation identities are unique`);
check(
  "relation-type-closure",
  relations.every(({ type }) => profile.allowed_relation_types.includes(type)),
  "every relation type is admitted by PROFILE.json"
);
check(
  "relation-endpoint-closure",
  relations.every(({ from_node_id, to_node_id }) => nodeIdSet.has(from_node_id) && nodeIdSet.has(to_node_id)),
  "every relation endpoint resolves"
);
check(
  "relation-source-closure",
  relations.every(({ source_refs }) => source_refs.every((sourceId) => sourceIdSet.has(sourceId))),
  "every relation source reference resolves"
);
check(
  "relation-authority-ceiling",
  relations.every(({ authority_effect }) => authority_effect === "none"),
  "every relation preserves authority_effect none"
);

for (const view of viewsDocument.views) {
  const refs = [...(view.node_ids ?? []), ...(view.omitted_node_ids ?? [])];
  check(`view-node-closure:${view.view_id}`, refs.every((nodeId) => nodeIdSet.has(nodeId)), `${refs.length} explicit view node references resolve`);
  check(`view-relation-type-closure:${view.view_id}`, (view.relation_types ?? []).every((type) => profile.allowed_relation_types.includes(type)), "explicit view relation types resolve");
}

const residueIds = residueEntries.map(({ residue_id }) => residue_id);
check("residue-id-uniqueness", unique(residueIds), `${residueIds.length} residue identities are unique`);
check(
  "residue-source-closure",
  residueEntries.every(({ source_refs }) => source_refs.every((sourceId) => sourceIdSet.has(sourceId))),
  "every residue source reference resolves"
);
check(
  "residue-authority-ceiling",
  residueEntries.every(({ authority_effect }) => authority_effect === "none"),
  "every residue entry preserves authority_effect none"
);

const catalogSource = sourcesDocument.sources.find(({ source_id }) => source_id === "invoke.cli-stage-catalog");
const catalog = JSON.parse(readFileSync(join(repositoryRoot, catalogSource.path), "utf8"));
const catalogStages = catalog.modes.define.stages;
const stageNodes = nodes.filter(({ stage_id }) => stage_id);
const ontologyStageIds = stageNodes.map(({ stage_id }) => stage_id).sort();
const catalogStageIds = Object.keys(catalogStages).sort();
check("live-stage-identity", sameJson(ontologyStageIds, catalogStageIds), `ontology and catalog expose ${catalogStageIds.join(", ")}`);
check(
  "live-stage-operations",
  catalogStageIds.every((stageId) => {
    const node = stageNodes.find((candidate) => candidate.stage_id === stageId);
    return node && sameJson([...node.operations].sort(), [...catalogStages[stageId].operations].sort());
  }),
  "every stage operation list equals the current catalog"
);

function relationExists(type, fromNodeId, toNodeId) {
  return relations.some((relation) => relation.type === type && relation.from_node_id === fromNodeId && relation.to_node_id === toNodeId);
}

const orderedStages = ["semantic-context", "semantic-closure", "source", "bundle", "admission", "status"];
const expectedOrderEdges = orderedStages.slice(0, -1).map((stageId, index) => [
  `stage.${stageId}`,
  `stage.${orderedStages[index + 1]}`
]);
const orderRelations = relations.filter(({ type }) => type === "orders_before");
check(
  "workflow-order",
  orderRelations.length === expectedOrderEdges.length && expectedOrderEdges.every(([from, to]) => relationExists("orders_before", from, to)),
  orderedStages.join(" -> ")
);
check(
  "status-evidence-pair",
  relationExists("requires", "stage.status", "artifact.define-stage-receipt") &&
    relationExists("requires", "stage.status", "artifact.define-bundle-admission-receipt"),
  "status requires both producer and independent admission receipts"
);
check(
  "independent-admission-producer",
  relationExists("produces", "stage.admission", "artifact.define-bundle-admission-receipt") &&
    !relationExists("produces", "stage.bundle", "artifact.define-bundle-admission-receipt"),
  "only the admission stage produces the admission receipt"
);
const expectedAxes = ["axis.artifact-authored", "axis.registry-released", "axis.mutation-runtime-ready"];
check(
  "status-axis-independence",
  expectedAxes.every((axisId) => nodeIdSet.has(axisId) && relationExists("projects", "stage.status", axisId)) && unique(expectedAxes),
  "three separate axes are projected by status"
);
const wirBoundary = nodes.find(({ node_id }) => node_id === "evidence.swu-wir-006");
check(
  "wir-execution-boundary",
  wirBoundary?.status === "blocked-not-started" && wirBoundary.authority_effect === "none",
  "SWU-WIR-006 is reused as blocked, not-started evidence only"
);
check(
  "package-authority-ceiling",
  profile.authority_effect === "none" && typeSelection.authority_effect === "none",
  "profile and type decision grant no authority"
);

const blocking = checks.filter(({ outcome }) => outcome !== "PASS");
const result = {
  schema_version: "ontology-vault.validation-result.v1",
  ontology_id: profile.ontology_id,
  overall: blocking.length === 0 ? "PASS" : "BLOCK",
  summary: {
    checks: checks.length,
    passed: checks.length - blocking.length,
    blocked: blocking.length,
    nodes: nodes.length,
    relations: relations.length,
    sources: sourcesDocument.sources.length,
    residue_entries: residueEntries.length
  },
  checks,
  claim_ceiling: "Private candidate ontology validation only; no WIR execution, acceptance, release, publication, or runtime authority.",
  authority_effect: "none"
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = blocking.length === 0 ? 0 : 1;
