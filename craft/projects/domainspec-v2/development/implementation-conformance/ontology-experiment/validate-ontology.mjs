#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const discoverRepositoryRoot = (start) => {
  let current = resolve(start);
  while (true) {
    if (existsSync(resolve(current, "AGENTS.md")) && existsSync(resolve(current, "projects/domainspec-v2"))) return current;
    const parent = dirname(current);
    if (parent === current) throw new Error(`unable to discover repository root from ${start}`);
    current = parent;
  }
};
const discoveredRepositoryRoot = discoverRepositoryRoot(experimentRoot);
const repositoryRoot = process.env.DOMAINSPEC_REPOSITORY_ROOT
  ? resolve(process.env.DOMAINSPEC_REPOSITORY_ROOT)
  : discoveredRepositoryRoot;
if (!existsSync(resolve(repositoryRoot, "AGENTS.md")) || !existsSync(resolve(repositoryRoot, "projects/domainspec-v2"))) {
  throw new Error(`invalid repository root: ${repositoryRoot}`);
}
const liveExperimentRoot = resolve(repositoryRoot, "projects/domainspec-v2/development/implementation-conformance/ontology-experiment");
const readJsonAt = (root, relativePath) => JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
const readJson = (relativePath) => readJsonAt(liveExperimentRoot, relativePath);
const currentOntology = readJsonAt(experimentRoot, "ontology.json");
const currentProjection = readJsonAt(experimentRoot, "domain-meta-types.projection.json");
const sha256Bytes = (bytes) => createHash("sha256").update(bytes).digest("hex");
const resolveBoundRef = (ref, label) => {
  const path = resolve(repositoryRoot, ref.path);
  const lexical = relative(repositoryRoot, path);
  if (lexical === "" || lexical.startsWith("..") || isAbsolute(lexical)) throw new Error(`${label} path escapes repository: ${ref.path}`);
  const info = lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`${label} is not a regular non-symlink file: ${ref.path}`);
  const real = relative(realpathSync(repositoryRoot), realpathSync(path));
  if (real === "" || real.startsWith("..") || isAbsolute(real)) throw new Error(`${label} real path escapes repository: ${ref.path}`);
  const bytes = readFileSync(path);
  if (bytes.length !== ref.size_bytes || sha256Bytes(bytes) !== ref.sha256) throw new Error(`${label} digest or size drift: ${ref.path}`);
  return path;
};
const ontologyArchiveRef = currentOntology.historical_preimage_refs?.find((ref) => ref.path.endsWith("/ontology.json"));
const ontologyProjectionArchiveRef = currentOntology.historical_preimage_refs?.find((ref) => ref.path.endsWith("/domain-meta-types.projection.json"));
const projectionArchiveRef = currentProjection.historical_projection_ref;
if (!ontologyArchiveRef || !ontologyProjectionArchiveRef || !projectionArchiveRef) throw new Error("v2 targets do not bind both immutable v1 preimages");
if (JSON.stringify(ontologyProjectionArchiveRef) !== JSON.stringify(projectionArchiveRef)) throw new Error("ontology and projection bind different v1 projection preimages");
const boundOntologyArchivePath = resolveBoundRef(ontologyArchiveRef, "v1 ontology preimage");
const boundProjectionArchivePath = resolveBoundRef(projectionArchiveRef, "v1 projection preimage");
const overrideArchiveRoot = process.env.DOMAINSPEC_V1_ARCHIVE_ROOT ? resolve(process.env.DOMAINSPEC_V1_ARCHIVE_ROOT) : null;
const v1OntologyPath = overrideArchiveRoot ? resolve(overrideArchiveRoot, "ontology.json") : boundOntologyArchivePath;
const v1ProjectionPath = overrideArchiveRoot ? resolve(overrideArchiveRoot, "domain-meta-types.projection.json") : boundProjectionArchivePath;
for (const [path, ref, label] of [[v1OntologyPath, ontologyArchiveRef, "v1 ontology override"], [v1ProjectionPath, projectionArchiveRef, "v1 projection override"]]) {
  const bytes = readFileSync(path);
  if (bytes.length !== ref.size_bytes || sha256Bytes(bytes) !== ref.sha256) throw new Error(`${label} does not match the bound immutable preimage`);
}
const v1ArchiveRoot = dirname(v1OntologyPath);
const ontology = JSON.parse(readFileSync(v1OntologyPath, "utf8"));
const metaTypeProjection = JSON.parse(readFileSync(v1ProjectionPath, "utf8"));
const profilePaths = [
  "profiles/base-domain.profile.json",
  "profiles/typescript-strict.profile.json",
  "profiles/python-strict.profile.json",
  "profiles/rust-strict.profile.json",
];
const profiles = new Map(profilePaths.map((path) => [path, readJson(path)]));
const observedFacts = readJson("examples/typescript-observed-facts.json");
const expectedEvaluation = readJson("examples/typescript-evaluation.expected.json");
const enumCases = readJson("examples/enum/cases.json");
const expectedEnumEvaluations = readJson("examples/enum/evaluations.expected.json");
const errors = [];
const checks = [];

const unique = (label, ids) => {
  const seen = new Set();
  const duplicates = ids.filter((id) => seen.has(id) || !seen.add(id));
  if (duplicates.length > 0) errors.push(`${label} duplicate ids: ${[...new Set(duplicates)].join(", ")}`);
  else checks.push(`${label}: ${ids.length} unique ids`);
};

unique("concept types", ontology.concept_types.map(({ concept_id }) => concept_id));
unique("properties", ontology.property_definitions.map(({ property_id }) => property_id));
unique("relations", ontology.relation_definitions.map(({ relation_id }) => relation_id));
unique("operators", ontology.constraint_operators.map(({ operator_id }) => operator_id));
unique("language projections", ontology.language_projections.map(({ projection_id }) => projection_id));

const v2RefreshedDefinitionSourceIds = new Set([
  "domainspec.meta-types-registry",
  "domainspec.meta-type-cards",
  "experiment.ontology-map",
]);
for (const source of ontology.source_refs) {
  const absolutePath = resolve(repositoryRoot, source.path);
  if (!absolutePath.startsWith(`${repositoryRoot}/`) || !existsSync(absolutePath)) {
    errors.push(`missing or escaping source: ${source.path}`);
    continue;
  }
  const actual = createHash("sha256").update(readFileSync(absolutePath)).digest("hex");
  if (actual !== source.sha256 && !v2RefreshedDefinitionSourceIds.has(source.source_id)) errors.push(`stale source digest: ${source.source_id}`);
}
checks.push(`source existence and digests: ${ontology.source_refs.length} checked`);

const conceptById = new Map(ontology.concept_types.map((concept) => [concept.concept_id, concept]));
const propertyById = new Map(ontology.property_definitions.map((property) => [property.property_id, property]));
const relationById = new Map(ontology.relation_definitions.map((relation) => [relation.relation_id, relation]));
const operatorById = new Map(ontology.constraint_operators.map((operator) => [operator.operator_id, operator]));
const sourceIds = new Set(ontology.source_refs.map(({ source_id }) => source_id));

const registryText = readFileSync(resolve(repositoryRoot, "projects/domainspec-v2/definitions/meta-types/meta-types.yml"), "utf8");
const parseRegistryMembers = () => {
  const members = [];
  let inMembers = false;
  let current = null;
  for (const line of registryText.split("\n")) {
    if (line === "members:") {
      inMembers = true;
      continue;
    }
    if (!inMembers) continue;
    const idMatch = line.match(/^  - id: (DS-D1\.\d+)$/);
    if (idMatch) {
      if (current) members.push(current);
      current = {meta_type_id: idMatch[1]};
      continue;
    }
    const fieldMatch = line.match(/^    (term|category|criterion_schema|one_line|status): (.+)$/);
    if (current && fieldMatch) current[fieldMatch[1]] = fieldMatch[2];
  }
  if (current) members.push(current);
  return members;
};

const registryActive = parseRegistryMembers();
const candidateTermsMatch = registryText.match(/\n    candidate:\n[\s\S]*?\n      terms: \[([^\]]+)\]/);
const registryCandidates = (candidateTermsMatch?.[1] ?? "").split(",").map((term) => term.trim()).filter(Boolean).map((label, index) => ({
  meta_type_id: `DS-D1.${15 + index}`,
  label,
}));
const registryDeferred = [...registryText.matchAll(/^      - id: (DS-D1\.\d+)\n        term: ([^\n]+)\n        status: ([^\n]+)/gm)].map((match) => ({
  meta_type_id: match[1],
  label: match[2],
  status: match[3],
}));
const registrySupersededMatch = registryText.match(/superseded:\n  (DS-D1\.\d+):\n    term: ([^\n]+)\n    status: ([^\n]+)\n    replacement: ([^\n]+)/);
const registrySuperseded = registrySupersededMatch ? {
  meta_type_id: registrySupersededMatch[1],
  label: registrySupersededMatch[2],
  status: registrySupersededMatch[3],
  replacement_ref: registrySupersededMatch[4].split(" ")[0],
} : null;
const metaTypeById = new Map(metaTypeProjection.meta_types.map((metaType) => [metaType.meta_type_id, metaType]));

unique("domain meta-type projection", metaTypeProjection.meta_types.map(({ meta_type_id }) => meta_type_id));
for (const sourceRef of metaTypeProjection.source_refs) if (!sourceIds.has(sourceRef)) errors.push(`unknown meta-type projection source: ${sourceRef}`);
for (const requiredSource of ["domainspec.meta-types-registry", "domainspec.meta-type-cards"]) if (!metaTypeProjection.source_refs.includes(requiredSource)) errors.push(`meta-type projection missing required source: ${requiredSource}`);
if (metaTypeProjection.authority_effect !== "none") errors.push("meta-type projection must have authority_effect none");

for (const member of registryActive) {
  const projected = metaTypeById.get(member.meta_type_id);
  if (!projected) {
    errors.push(`active canonical meta-type omitted from projection: ${member.meta_type_id}`);
    continue;
  }
  if (projected.label !== member.term || projected.category !== member.category || projected.maturity !== member.status) {
    errors.push(`active canonical meta-type drift: ${member.meta_type_id}`);
  }
  if (projected.criterion_schema !== member.criterion_schema) errors.push(`criterion projection drift: ${member.meta_type_id}`);
}

for (const candidate of registryCandidates) {
  const projected = metaTypeById.get(candidate.meta_type_id);
  if (!projected || projected.label !== candidate.label || projected.maturity !== "candidate") errors.push(`UI candidate projection drift: ${candidate.meta_type_id}`);
}

for (const deferred of registryDeferred) {
  const projected = metaTypeById.get(deferred.meta_type_id);
  if (!projected || projected.label !== deferred.label || projected.maturity !== "deferred") errors.push(`deferred meta-type projection drift: ${deferred.meta_type_id}`);
}

if (!registrySuperseded || metaTypeById.get(registrySuperseded.meta_type_id)?.maturity !== "superseded") {
  errors.push("superseded DS-D1 tombstone missing from projection");
} else {
  const projected = metaTypeById.get(registrySuperseded.meta_type_id);
  if (projected.label !== registrySuperseded.label || projected.replacement_ref !== registrySuperseded.replacement_ref || projected.architecture_type_id !== null) {
    errors.push(`superseded meta-type projection drift: ${registrySuperseded.meta_type_id}`);
  }
}

const actualMaturityCounts = Object.fromEntries(["active", "candidate", "deferred", "superseded"].map((maturity) => [
  maturity,
  metaTypeProjection.meta_types.filter((metaType) => metaType.maturity === maturity).length,
]));
for (const [maturity, count] of Object.entries(actualMaturityCounts)) {
  if (metaTypeProjection.counts[maturity] !== count) errors.push(`meta-type ${maturity} count drift: expected ${metaTypeProjection.counts[maturity]}, projected ${count}`);
}
if (metaTypeProjection.counts.staged !== actualMaturityCounts.active + actualMaturityCounts.candidate + actualMaturityCounts.deferred) errors.push("staged meta-type count must exclude superseded tombstones");
if (registryActive.length !== metaTypeProjection.counts.active || registryCandidates.length !== metaTypeProjection.counts.candidate || registryDeferred.length !== metaTypeProjection.counts.deferred) errors.push("canonical registry maturity counts differ from projection");
checks.push(`canonical DS-D1 projection: ${metaTypeProjection.counts.staged} staged plus ${metaTypeProjection.counts.superseded} superseded tombstone`);

for (const concept of ontology.concept_types) {
  for (const field of ontology.node_contract.required_fields) {
    if (!(field in concept)) errors.push(`concept ${concept.concept_id} missing ${field}`);
  }
  if (concept.extends && !conceptById.has(concept.extends)) errors.push(`unknown parent type: ${concept.concept_id} -> ${concept.extends}`);
  if (!ontology.node_contract.candidate_status_values.includes(concept.candidate_status)) errors.push(`invalid candidate status: ${concept.concept_id}`);
  for (const sourceRef of concept.source_refs) if (!sourceIds.has(sourceRef)) errors.push(`unknown concept source: ${concept.concept_id} -> ${sourceRef}`);
}
checks.push("CAV2-derived node contracts and inheritance: checked");

const isSubtype = (actualType, expectedType) => {
  let current = conceptById.get(actualType);
  const visited = new Set();
  while (current) {
    if (current.concept_id === expectedType) return true;
    if (visited.has(current.concept_id)) return false;
    visited.add(current.concept_id);
    current = current.extends ? conceptById.get(current.extends) : null;
  }
  return false;
};

const valueMatchesType = (value, valueType) => {
  if (valueType.kind === "string") return typeof value === "string";
  if (valueType.kind === "boolean") return typeof value === "boolean";
  if (valueType.kind === "integer") return Number.isInteger(value) && (valueType.minimum === undefined || value >= valueType.minimum);
  if (valueType.kind === "enum") return typeof value === "string" && valueType.values.includes(value);
  if (valueType.kind === "array") return Array.isArray(value) && value.every((item) => valueMatchesType(item, valueType.items));
  if (valueType.kind === "object") {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const required = valueType.required ?? [];
    if (required.some((field) => !(field in value))) return false;
    const properties = valueType.properties ?? {};
    if (valueType.additional_properties === false && Object.keys(value).some((field) => !(field in properties))) return false;
    return Object.entries(value).every(([field, nested]) =>
      properties[field] !== undefined && valueMatchesType(nested, properties[field]));
  }
  return false;
};

const validateFacts = (facts) => {
  for (const element of facts.elements) {
    if (!conceptById.has(element.type)) {
      errors.push(`observed element has unknown type: ${element.element_id} -> ${element.type}`);
      continue;
    }
    for (const [propertyId, value] of Object.entries(element.properties)) {
      const property = propertyById.get(propertyId);
      if (!property) {
        errors.push(`observed element has unknown property: ${element.element_id} -> ${propertyId}`);
        continue;
      }
      if (property.applies_to.kind !== "node" || !property.applies_to.types.some((type) => isSubtype(element.type, type))) {
        errors.push(`observed property does not apply: ${element.element_id} -> ${propertyId}`);
      } else if (!valueMatchesType(value, property.value_type)) {
        errors.push(`observed property has invalid value type: ${element.element_id} -> ${propertyId}`);
      }
    }
  }
};

const activeMappingStatuses = new Set(["candidate-mapped", "profiled-unmapped", "unsupported"]);
const mappedTargets = new Set();
for (const metaType of metaTypeProjection.meta_types) {
  if (!metaTypeProjection.mapping_status_values.includes(metaType.mapping_status)) errors.push(`unknown meta-type mapping status: ${metaType.meta_type_id}`);
  if (!metaType.mapping_reason || !metaType.owner_route || !metaType.review_trigger) errors.push(`incomplete meta-type coverage record: ${metaType.meta_type_id}`);
  for (const evidenceRef of metaType.evidence_refs ?? []) if (!sourceIds.has(evidenceRef)) errors.push(`unknown meta-type mapping evidence: ${metaType.meta_type_id} -> ${evidenceRef}`);
  if (metaType.maturity === "active" && !activeMappingStatuses.has(metaType.mapping_status)) errors.push(`active meta-type lacks explicit coverage disposition: ${metaType.meta_type_id}`);
  if (metaType.maturity !== "active" && metaType.mapping_status === "candidate-mapped") errors.push(`non-active meta-type cannot be mapped: ${metaType.meta_type_id}`);
  if (metaType.maturity !== "active" && metaType.architecture_type_id !== null) errors.push(`non-active meta-type has architecture target: ${metaType.meta_type_id}`);
  if (metaType.mapping_status === "candidate-mapped") {
    const target = conceptById.get(metaType.architecture_type_id);
    if (!target) errors.push(`mapped meta-type has unknown architecture target: ${metaType.meta_type_id}`);
    else if (!isSubtype(target.concept_id, "architecture.DomainConceptImplementation")) errors.push(`mapped target is not a domain concept implementation: ${target.concept_id}`);
    else if (target.canonical_meta_type_ref !== metaType.meta_type_id || target.canonical_mapping_status !== "candidate-alignment") errors.push(`non-reciprocal candidate mapping: ${metaType.meta_type_id}`);
    if (mappedTargets.has(metaType.architecture_type_id)) errors.push(`architecture target mapped more than once: ${metaType.architecture_type_id}`);
    mappedTargets.add(metaType.architecture_type_id);
  } else if (metaType.architecture_type_id !== null) {
    errors.push(`unmapped meta-type carries architecture target: ${metaType.meta_type_id}`);
  }
}

for (const concept of ontology.concept_types.filter((item) => item.canonical_meta_type_ref)) {
  const reciprocal = metaTypeById.get(concept.canonical_meta_type_ref);
  if (!reciprocal || reciprocal.architecture_type_id !== concept.concept_id || reciprocal.mapping_status !== "candidate-mapped") errors.push(`architecture concept lacks reciprocal DS-D1 coverage: ${concept.concept_id}`);
}
const adapterType = conceptById.get("architecture.AdapterImplementation");
if (adapterType?.canonical_meta_type_ref !== null || adapterType?.canonical_mapping_status !== "architecture-role-only") errors.push("architecture.AdapterImplementation must not collapse into deferred DS-D1.24 Adapter");
checks.push(`active DS-D1 coverage: ${registryActive.length} explicit dispositions, ${mappedTargets.size} reciprocal candidate mappings`);

for (const property of ontology.property_definitions) {
  for (const type of property.applies_to.types) {
    const targetMap = property.applies_to.kind === "node" ? conceptById : relationById;
    if (!targetMap.has(type)) errors.push(`property ${property.property_id} has unknown applicable type ${type}`);
  }
}

for (const relation of ontology.relation_definitions) {
  for (const type of [...relation.source_types, ...relation.target_types]) if (!conceptById.has(type)) errors.push(`relation ${relation.relation_id} has unknown endpoint ${type}`);
  for (const propertyId of relation.properties) if (!propertyById.has(propertyId)) errors.push(`relation ${relation.relation_id} has unknown property ${propertyId}`);
  if (relation.authority_effect !== "none") errors.push(`relation ${relation.relation_id} must have authority_effect none`);
  if (relation.value_effect === "value-constraining" && relation.cycle_policy !== "not-applicable" && relation.cycle_policy !== "acyclic") errors.push(`value-constraining relation ${relation.relation_id} must be acyclic when cycle policy applies`);
}
checks.push("property applicability and relation contracts: checked");

const resolveProfile = (path, stack = []) => {
  if (stack.includes(path)) throw new Error(`profile extension cycle: ${[...stack, path].join(" -> ")}`);
  const profile = profiles.get(path);
  if (!profile) throw new Error(`unknown profile: ${path}`);
  const constraints = [];
  for (const parentRef of profile.extends ?? []) {
    const parentPath = resolve(liveExperimentRoot, dirname(path), parentRef).replace(`${liveExperimentRoot}/`, "");
    constraints.push(...resolveProfile(parentPath, [...stack, path]).constraints);
  }
  constraints.push(...profile.constraints);
  return {...profile, constraints};
};

const allConstraintIds = [];
for (const path of profilePaths) {
  const profile = resolveProfile(path);
  unique(`${profile.profile_id} constraints`, profile.constraints.map(({ constraint_id }) => constraint_id));
  for (const constraint of profile.constraints) {
    allConstraintIds.push(`${profile.profile_id}:${constraint.constraint_id}`);
    const operator = operatorById.get(constraint.operator);
    const property = propertyById.get(constraint.property_id);
    if (!operator) errors.push(`unknown operator: ${constraint.constraint_id} -> ${constraint.operator}`);
    if (!property) errors.push(`unknown property: ${constraint.constraint_id} -> ${constraint.property_id}`);
    if (operator && property && !operator.accepted_value_types.includes(property.value_type.kind)) {
      errors.push(`operator value type mismatch: ${constraint.constraint_id} -> ${property.value_type.kind}`);
    }
    const expectedKind = constraint.expected?.kind === "property-ref"
      ? "property-ref"
      : constraint.operator === "cardinality"
        ? "cardinality-spec"
        : "literal";
    if (operator && !operator.expected_operand_kinds.includes(expectedKind)) {
      errors.push(`operator expected operand mismatch: ${constraint.constraint_id} -> ${expectedKind}`);
    }
    if (expectedKind === "property-ref") {
      const expectedProperty = propertyById.get(constraint.expected.property_id);
      if (!expectedProperty) errors.push(`unknown expected property: ${constraint.constraint_id} -> ${constraint.expected.property_id}`);
      else if (property && expectedProperty.value_type.kind !== property.value_type.kind) errors.push(`expected property type mismatch: ${constraint.constraint_id}`);
    }
    if (expectedKind === "cardinality-spec") {
      const bounds = constraint.expected;
      const keys = Object.keys(bounds);
      if (keys.length === 0 || keys.some((key) => !["exact", "min", "max"].includes(key) || !Number.isInteger(bounds[key]) || bounds[key] < 0)) {
        errors.push(`invalid cardinality operand: ${constraint.constraint_id}`);
      }
    }
    if (constraint.constraint_kind === "node-property") {
      for (const type of constraint.applies_to) if (!conceptById.has(type)) errors.push(`unknown constraint node type: ${constraint.constraint_id} -> ${type}`);
    } else if (constraint.constraint_kind === "relation-property") {
      if (!relationById.has(constraint.relation_type)) errors.push(`unknown constraint relation: ${constraint.constraint_id} -> ${constraint.relation_type}`);
      for (const type of [...constraint.source_types, ...constraint.target_types]) if (!conceptById.has(type)) errors.push(`unknown relation constraint endpoint: ${constraint.constraint_id} -> ${type}`);
    } else {
      errors.push(`unknown constraint kind: ${constraint.constraint_id}`);
    }
  }
}
unique("profile-qualified constraints", allConstraintIds);
checks.push(`profile schemas and references: ${profilePaths.length} profiles checked`);

const evaluateOperator = (operator, actual, expected) => {
  if (operator === "required") return actual !== undefined && actual !== null && actual !== "";
  if (operator === "equals") return actual === expected;
  if (operator === "matches") return typeof actual === "string" && new RegExp(expected).test(actual);
  if (operator === "one_of") return Array.isArray(expected) && expected.includes(actual);
  if (operator === "set_equals") {
    if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
    const actualSet = new Set(actual.map((item) => JSON.stringify(item)));
    const expectedSet = new Set(expected.map((item) => JSON.stringify(item)));
    return actualSet.size === expectedSet.size && [...actualSet].every((item) => expectedSet.has(item));
  }
  if (operator === "unique") return Array.isArray(actual) && new Set(actual.map((item) => JSON.stringify(item))).size === actual.length;
  if (operator === "non_empty") return (typeof actual === "string" || Array.isArray(actual)) && actual.length > 0;
  if (operator === "cardinality") {
    if ((typeof actual !== "string" && !Array.isArray(actual)) || typeof expected !== "object" || expected === null) return false;
    return (expected.exact === undefined || actual.length === expected.exact)
      && (expected.min === undefined || actual.length >= expected.min)
      && (expected.max === undefined || actual.length <= expected.max);
  }
  throw new Error(`unsupported evaluator operator: ${operator}`);
};

const resolveExpected = (constraint, properties) => constraint.expected?.kind === "property-ref"
  ? properties[constraint.expected.property_id]
  : constraint.expected;

const evaluate = (profile, facts) => {
  const findings = [];
  let evaluatedAssertions = 0;
  const evaluatedConstraintIds = new Set();
  const elementById = new Map(facts.elements.map((element) => [element.element_id, element]));

  for (const constraint of profile.constraints) {
    if (constraint.constraint_kind === "node-property") {
      for (const element of facts.elements) {
        if (!constraint.applies_to.some((type) => isSubtype(element.type, type))) continue;
        evaluatedAssertions += 1;
        evaluatedConstraintIds.add(constraint.constraint_id);
        const actual = element.properties[constraint.property_id];
        const expected = resolveExpected(constraint, element.properties);
        if (!evaluateOperator(constraint.operator, actual, expected)) {
          findings.push({
            constraint_id: constraint.constraint_id,
            subject_id: element.element_id,
            property_id: constraint.property_id,
            expected: constraint.operator === "required" ? "present" : expected,
            actual: actual ?? null,
            severity: constraint.severity,
          });
        }
      }
    } else {
      for (const relation of facts.relations) {
        if (relation.type !== constraint.relation_type) continue;
        const source = elementById.get(relation.from);
        const target = elementById.get(relation.to);
        if (!source || !target) {
          errors.push(`observed relation has unresolved endpoint: ${relation.relation_id}`);
          continue;
        }
        const sourceMatches = constraint.source_types.some((type) => isSubtype(source.type, type));
        const targetMatches = constraint.target_types.some((type) => isSubtype(target.type, type));
        if (!sourceMatches || !targetMatches) continue;
        evaluatedAssertions += 1;
        evaluatedConstraintIds.add(constraint.constraint_id);
        const actual = relation.properties[constraint.property_id];
        const expected = resolveExpected(constraint, relation.properties);
        if (!evaluateOperator(constraint.operator, actual, expected)) {
          findings.push({
            constraint_id: constraint.constraint_id,
            subject_id: relation.relation_id,
            property_id: constraint.property_id,
            expected,
            actual: actual ?? null,
            severity: constraint.severity,
          });
        }
      }
    }
  }

  return {
    schema_version: "domainspec-architecture-evaluation/v1",
    profile_id: profile.profile_id,
    facts_id: facts.facts_id,
    verdict: findings.length === 0 ? "pass" : "fail",
    evaluated_constraints: evaluatedConstraintIds.size,
    evaluated_assertions: evaluatedAssertions,
    finding_count: findings.length,
    findings,
    authority_effect: "none",
  };
};

const typescriptProfile = resolveProfile("profiles/typescript-strict.profile.json");
validateFacts(observedFacts);
const actualEvaluation = evaluate(typescriptProfile, observedFacts);
if (JSON.stringify(actualEvaluation) !== JSON.stringify(expectedEvaluation)) {
  errors.push("TypeScript example evaluation differs from expected projection");
}
checks.push(`executable TypeScript example: ${actualEvaluation.evaluated_assertions} assertions, ${actualEvaluation.finding_count} expected findings`);

const enumProfile = resolveProfile(enumCases.profile_path);
const buildEnumFacts = ({case_id, property_overrides}) => ({
  schema_version: enumCases.base_facts.schema_version,
  facts_id: `${enumCases.base_facts.facts_id_prefix}.${case_id}`,
  elements: enumCases.base_facts.elements.map((element) => ({
    ...element,
    properties: {...element.properties, ...property_overrides},
  })),
  relations: enumCases.base_facts.relations,
  authority_effect: enumCases.base_facts.authority_effect,
});
const actualEnumEvaluations = {
  schema_version: "domainspec-enum-evaluation-projection/v1",
  profile_id: enumProfile.profile_id,
  cases: enumCases.cases.map((enumCase) => {
    const {case_id} = enumCase;
    const facts = buildEnumFacts(enumCase);
    validateFacts(facts);
    const evaluation = evaluate(enumProfile, facts);
    return {
      case_id,
      verdict: evaluation.verdict,
      evaluated_constraints: evaluation.evaluated_constraints,
      evaluated_assertions: evaluation.evaluated_assertions,
      findings: evaluation.findings,
    };
  }),
  authority_effect: "none",
};
if (JSON.stringify(actualEnumEvaluations) !== JSON.stringify(expectedEnumEvaluations)) {
  errors.push("Enum evaluation matrix differs from expected projection");
}
checks.push(`executable Enum matrix: ${actualEnumEvaluations.cases.length} cases with exact expected findings`);

let compositionResult = null;
const compositionRunnerPath = resolve(liveExperimentRoot, "examples/enum/composition/check-enum-composition.mjs");
const compositionRun = spawnSync(process.execPath, [compositionRunnerPath], {
  cwd: liveExperimentRoot,
  encoding: "utf8",
  maxBuffer: 1024 * 1024,
});
if (compositionRun.status !== 0) {
  errors.push(`Enum composition fixtures failed: ${(compositionRun.stderr || compositionRun.stdout).trim()}`);
} else {
  try {
    compositionResult = JSON.parse(compositionRun.stdout);
    const positiveCases = compositionResult.cases.filter(({case_id}) => case_id.startsWith("positive-"));
    const negativeCases = compositionResult.cases.filter(({case_id}) => case_id.startsWith("negative-"));
    const requiredDiagnostics = [
      "ENUM_COMPOSITION_DUPLICATE_KEY",
      "ENUM_COMPOSITION_DUPLICATE_VALUE",
      "ENUM_COMPOSITION_REPEATED_CONTRIBUTION",
      "ENUM_COMPOSITION_CYCLE",
      "ENUM_COMPOSITION_COMPONENT_UNRESOLVED",
      "ENUM_COMPOSITION_DERIVATION_INCOMPLETE",
      "ENUM_COMPOSITION_RELATION_PROVENANCE_INVALID",
      "ENUM_COMPOSITION_MEMBER_PROVENANCE_INVALID",
    ];
    if (positiveCases.length !== 4 || positiveCases.some(({verdict}) => verdict !== "pass")) {
      errors.push("Enum composition fixtures must pass direct, two-component, reordered, and nested cases");
    }
    if (negativeCases.length !== 8 || negativeCases.some(({verdict}) => verdict !== "fail")) {
      errors.push("Enum composition fixtures must reject all eight structural and provenance negatives");
    }
    if (JSON.stringify(negativeCases.map(({diagnostic}) => diagnostic)) !== JSON.stringify(requiredDiagnostics)) {
      errors.push("Enum composition fixtures do not preserve the exact diagnostic matrix");
    }
    if (compositionResult.order_invariance_equal !== true) {
      errors.push("Enum composition order changes normalized meaning");
    }
    if (compositionResult.authority_effect !== "none") {
      errors.push("Enum composition fixtures must have authority_effect none");
    }
    checks.push(`Enum composition graph: ${positiveCases.length} positives and ${negativeCases.length} exact structural negatives checked`);
  } catch (error) {
    errors.push(`Enum composition fixture output is not valid JSON: ${error.message}`);
  }
}

const provenanceRunnerPath = resolve(liveExperimentRoot, "examples/enum/provenance/check-observation-projection.mjs");
const provenanceRun = spawnSync(process.execPath, [provenanceRunnerPath], {
  cwd: liveExperimentRoot,
  encoding: "utf8",
  maxBuffer: 1024 * 1024,
});
if (provenanceRun.status !== 0) {
  errors.push(`observation projection fixtures failed: ${(provenanceRun.stderr || provenanceRun.stdout).trim()}`);
} else {
  try {
    const provenanceResult = JSON.parse(provenanceRun.stdout);
    const positiveCases = provenanceResult.cases.filter(({case_id}) => case_id.startsWith("positive-"));
    const negativeCases = provenanceResult.cases.filter(({case_id}) => case_id.startsWith("negative-"));
    if (positiveCases.length !== 4 || positiveCases.some(({verdict}) => verdict !== "pass")) {
      errors.push("observation projection fixtures must pass one case for each provenance carrier");
    }
    if (negativeCases.length < 3 || negativeCases.some(({verdict}) => verdict !== "fail")) {
      errors.push("observation projection fixtures must reject every negative case");
    }
    if (provenanceResult.deterministic_conflict_pair_equal !== true) {
      errors.push("observation projection conflict result is order-dependent");
    }
    if (provenanceResult.authority_effect !== "none") {
      errors.push("observation projection fixtures must have authority_effect none");
    }
    checks.push(`observation projection provenance: ${positiveCases.length} carriers and ${negativeCases.length} negative cases checked`);
  } catch (error) {
    errors.push(`observation projection fixture output is not valid JSON: ${error.message}`);
  }
}

const scenarioRunnerPath = resolve(liveExperimentRoot, "examples/enum/scenarios/check-evaluation-scenario.mjs");
const scenarioRun = spawnSync(process.execPath, [scenarioRunnerPath], {
  cwd: liveExperimentRoot,
  encoding: "utf8",
  maxBuffer: 1024 * 1024,
});
if (scenarioRun.status !== 0) {
  errors.push(`evaluation scenario fixtures failed: ${(scenarioRun.stderr || scenarioRun.stdout).trim()}`);
} else {
  try {
    const scenarioResult = JSON.parse(scenarioRun.stdout);
    const positiveCases = scenarioResult.cases.filter(({case_id}) => case_id.startsWith("positive-"));
    const negativeCases = scenarioResult.cases.filter(({case_id}) => case_id.startsWith("negative-"));
    const requiredBlockers = [
      "BTE_RECOMPOSITION_OVERLAP",
      "BTE_EXPECTATION_REWRITTEN",
      "BTE_RECOMPOSITION_MISSING",
    ];
    if (positiveCases.length !== 1 || positiveCases.some(({verdict}) => verdict !== "pass")) {
      errors.push("evaluation scenario fixtures must pass one total causal scenario");
    }
    if (negativeCases.length !== 3 || negativeCases.some(({verdict}) => verdict !== "fail")) {
      errors.push("evaluation scenario fixtures must reject overlap, expectation rewrite, and partial join");
    }
    if (JSON.stringify(scenarioResult.represented_bte_blockers) !== JSON.stringify(requiredBlockers)) {
      errors.push("evaluation scenario fixtures do not represent the three BTE blocker classes");
    }
    if (scenarioResult.total_join_enforced !== true) {
      errors.push("evaluation scenario fixtures do not enforce a total frozen-case/result join");
    }
    if (scenarioResult.authority_effect !== "none") {
      errors.push("evaluation scenario fixtures must have authority_effect none");
    }
    checks.push(`evaluation scenario contract: ${positiveCases.length} causal scenario and ${negativeCases.length} blocker cases checked`);
  } catch (error) {
    errors.push(`evaluation scenario fixture output is not valid JSON: ${error.message}`);
  }
}

if (ontology.authority_effect !== "none" || actualEvaluation.authority_effect !== "none") errors.push("ontology and evaluation must have authority_effect none");
checks.push("authority non-collapse controls: checked");

const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const resolveJsonPointer = (document, pointer) => pointer.split("/").slice(1).reduce((value, token) => value?.[token.replace(/~1/g, "/").replace(/~0/g, "~")], document);
const verifyCurrentFileRef = (ref, label) => {
  const path = resolve(repositoryRoot, ref.path);
  const lexical = relative(repositoryRoot, path);
  if (lexical === "" || lexical.startsWith("..") || isAbsolute(lexical)) {
    errors.push(`${label} path escapes repository: ${ref.path}`);
    return null;
  }
  if (!existsSync(path)) {
    errors.push(`${label} is missing: ${ref.path}`);
    return null;
  }
  const info = lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink()) {
    errors.push(`${label} is not a regular non-symlink file: ${ref.path}`);
    return null;
  }
  const real = relative(realpathSync(repositoryRoot), realpathSync(path));
  if (real === "" || real.startsWith("..") || isAbsolute(real)) {
    errors.push(`${label} real path escapes repository: ${ref.path}`);
    return null;
  }
  const bytes = readFileSync(path);
  if ((ref.size_bytes !== undefined && bytes.length !== ref.size_bytes) || sha256Bytes(bytes) !== ref.sha256) {
    errors.push(`${label} digest or size drift: ${ref.path}`);
    return null;
  }
  return bytes;
};
const derivedImplementationRow = (instance) => ({
  implementation_instance_id: instance.implementation_instance_id,
  candidate_id: instance.candidate_id,
  canonical_meta_type_ref: instance.canonical_meta_type_ref,
  architecture_type_ref: instance.architecture_type_ref,
  endpoint_assertion_ref: cloneJson(instance.endpoint_assertion_ref),
  meta_type_maturity: instance.lifecycle_axes.meta_type_maturity,
  definition_status: instance.lifecycle_axes.definition_status,
  evidence_status: instance.lifecycle_axes.evidence_status,
  admission_status: instance.lifecycle_axes.admission_status,
  authority_effect: instance.lifecycle_axes.authority_effect,
  promotion_record_ref: instance.promotion_record_ref ?? null,
});
const derivedSupportingRow = (instance) => ({
  supporting_instance_id: instance.supporting_instance_id,
  candidate_id: instance.candidate_id,
  canonical_meta_type_ref: instance.canonical_meta_type_ref,
  architecture_type_ref: instance.architecture_type_ref,
  endpoint_assertion_ref: cloneJson(instance.endpoint_assertion_ref),
  source_identity_pointer: instance.source_identity_pointer,
  definition_status: instance.lifecycle_axes.definition_status,
  evidence_status: instance.lifecycle_axes.evidence_status,
  admission_status: instance.lifecycle_axes.admission_status,
  authority_effect: instance.lifecycle_axes.authority_effect,
});
const derivedRelationRow = (relation) => ({
  relation_instance_id: relation.relation_instance_id,
  candidate_id: relation.candidate_id,
  canonical_meta_type_ref: relation.canonical_meta_type_ref,
  relation_type_ref: relation.relation_type_ref,
  relation_assertion_ref: cloneJson(relation.relation_assertion_ref),
  source_instance_ref: relation.source_instance_ref,
  target_instance_ref: relation.target_instance_ref,
  source_candidate_id: relation.source_endpoint_binding.candidate_id,
  target_candidate_id: relation.target_endpoint_binding.candidate_id,
  source_endpoint_binding: cloneJson(relation.source_endpoint_binding),
  target_endpoint_binding: cloneJson(relation.target_endpoint_binding),
  definition_status: relation.lifecycle_axes.definition_status,
  evidence_status: relation.lifecycle_axes.evidence_status,
  admission_status: relation.lifecycle_axes.admission_status,
  authority_effect: relation.lifecycle_axes.authority_effect,
  promotion_record_ref: relation.promotion_record_ref ?? null,
});
const cloneJson = (value) => JSON.parse(JSON.stringify(value));
const admissionFailure = (code, detail) => {
  const failure = new Error(`${code}:${detail}`);
  failure.code = code;
  throw failure;
};
const exactRefIdentity = (left, right) => left?.path === right?.path && left?.sha256 === right?.sha256 && left?.size_bytes === right?.size_bytes;
const readAdmissionRef = (ref, virtualFiles, code) => {
  if (virtualFiles?.has(ref.path)) {
    const bytes = virtualFiles.get(ref.path);
    if (bytes.length !== ref.size_bytes || sha256Bytes(bytes) !== ref.sha256) admissionFailure(code, `${ref.path}:virtual-drift`);
    return bytes;
  }
  const path = resolve(repositoryRoot, ref.path);
  const lexical = relative(repositoryRoot, path);
  if (lexical === "" || lexical.startsWith("..") || isAbsolute(lexical)) admissionFailure(code, `${ref.path}:escape`);
  if (!existsSync(path)) admissionFailure(code, `${ref.path}:missing`);
  const info = lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink()) admissionFailure(code, `${ref.path}:not-regular`);
  const real = relative(realpathSync(repositoryRoot), realpathSync(path));
  if (real === "" || real.startsWith("..") || isAbsolute(real)) admissionFailure(code, `${ref.path}:real-escape`);
  const bytes = readFileSync(path);
  if (bytes.length !== ref.size_bytes || sha256Bytes(bytes) !== ref.sha256) admissionFailure(code, `${ref.path}:drift`);
  return bytes;
};
const parseAdmissionJson = (ref, virtualFiles, code) => {
  try {
    return JSON.parse(readAdmissionRef(ref, virtualFiles, code).toString("utf8"));
  } catch (error) {
    if (error.code) throw error;
    admissionFailure(code, `${ref?.path ?? "unknown"}:not-json`);
  }
};
const readBoundObjectAssertion = (ref, virtualFiles, code) => {
  const document = parseAdmissionJson(ref, virtualFiles, code);
  const assertion = resolveJsonPointer(document, ref.json_pointer);
  if (!assertion || typeof assertion !== "object" || Array.isArray(assertion)) admissionFailure(code, `${ref.path}${ref.json_pointer}:not-object`);
  return assertion;
};
const exactKeySet = (value, expected) => value !== null
  && typeof value === "object"
  && !Array.isArray(value)
  && canonicalJson(Object.keys(value).sort()) === canonicalJson([...expected].sort());
const endpointAssertionContract = {
  "candidate-architecture-implementation/v1": {
    identityFields: new Set(["concept_id", "definition_id"]),
    typeField: "type_id",
  },
  "instance-endpoint-assertion/v1": {
    identityFields: new Set(["instance_id"]),
    typeField: "architecture_type_ref",
  },
  "node-endpoint-assertion/v1": {
    identityFields: new Set(["node_id"]),
    typeField: "architecture_type_ref",
  },
};
const validateEndpointAssertion = (ref, expectedIdentity, expectedType, virtualFiles, code) => {
  const contract = endpointAssertionContract[ref?.assertion_spec];
  if (!contract || !contract.identityFields.has(ref.identity_field) || ref.architecture_type_field !== contract.typeField) admissionFailure(code, `${expectedIdentity}:ref-shape`);
  const assertion = readBoundObjectAssertion(ref, virtualFiles, code);
  const allowedKeys = new Set([ref.identity_field, ref.architecture_type_field]);
  if (ref.assertion_spec === "candidate-architecture-implementation/v1") {
    for (const key of [
      "type_id", "concept_id", "definition_id", "descriptor_id", "owner_catalogue_id", "input_concept_ids",
      "output_concept_id", "portable_form", "strategy_contract_type_id", "membership_denominator_id",
      "declared_read_targets", "declared_failures", "factory_provider_type_id", "component_names", "value_contract",
      "factory_contract", "base_type_id", "identity_components", "identity_contract", "lifecycle_contract",
      "construction_routes", "construction_pipeline",
    ]) allowedKeys.add(key);
  }
  const actualKeys = Object.keys(assertion);
  if (actualKeys.some((key) => !allowedKeys.has(key))
      || actualKeys.some((key) => ["authority_effect", "admission_status", "promotion_record_ref", "lifecycle_axes"].includes(key))) {
    admissionFailure(code, `${expectedIdentity}:assertion-keys`);
  }
  if (assertion[ref.identity_field] !== expectedIdentity || assertion[ref.architecture_type_field] !== expectedType) admissionFailure(code, `${expectedIdentity}:assertion-mismatch`);
  return { identity: assertion[ref.identity_field], type: assertion[ref.architecture_type_field], assertion };
};
const exactAssertionRef = (left, right) => exactRefIdentity(left, right)
  && left?.json_pointer === right?.json_pointer
  && left?.assertion_spec === right?.assertion_spec
  && left?.identity_field === right?.identity_field
  && left?.architecture_type_field === right?.architecture_type_field;
const exactObjectRef = (left, right) => exactRefIdentity(left, right) && left?.json_pointer === right?.json_pointer;
const exactRefArray = (left, right) => Array.isArray(left)
  && Array.isArray(right)
  && left.length === right.length
  && left.every((ref, index) => exactRefIdentity(ref, right[index]));
const validateCandidateEvidenceClosure = ({
  candidateId,
  canonicalMetaTypeRef,
  architectureTypeRef,
  conceptOrDefinitionRef,
  evidenceRefs,
  virtualFiles,
  prefix,
}) => {
  if (!exactRefArray(evidenceRefs, evidenceRefs?.slice(0, 3)) || evidenceRefs.length !== 3) admissionFailure(`${prefix}_EVIDENCE_BINDING`, `${candidateId}:bundle-shape`);
  const [candidateRef, projectionReceiptRef, terminalReceiptRef] = evidenceRefs;
  const candidate = parseAdmissionJson(candidateRef, virtualFiles, `${prefix}_CANDIDATE_STALE`);
  const lifecycle = candidate.lifecycle;
  if (candidate.schema_version !== "domainspec.meta-type-implementation-candidate/v1"
      || (candidate.authority_effect !== undefined && candidate.authority_effect !== "none")
      || !lifecycle
      || lifecycle.canonical_maturity !== "active"
      || lifecycle.architecture_mapping_status !== "candidate-mapped"
      || lifecycle.implementation_evidence_status !== "candidate"
      || lifecycle.factory_replay_kind !== "same-oracle-deterministic"
      || lifecycle.queue_readiness !== false
      || lifecycle.queue_readiness_effect !== "unchanged"
      || lifecycle.authority_effect !== "none"
      || typeof candidate.claim_ceiling !== "string"
      || candidate.claim_ceiling.length === 0
      || ["admission_status", "promotion_record_ref"].some((field) => Object.hasOwn(candidate, field))
      || candidate.candidate_id !== candidateId
      || candidate.meta_type?.id !== canonicalMetaTypeRef
      || candidate.architecture_implementation?.type_id !== architectureTypeRef) {
    admissionFailure(`${prefix}_CANDIDATE_BINDING`, candidateId);
  }
  const expectedDefinitionRef = candidate.architecture_implementation?.concept_id ?? candidate.architecture_implementation?.definition_id;
  if (conceptOrDefinitionRef !== undefined && expectedDefinitionRef !== conceptOrDefinitionRef) admissionFailure(`${prefix}_CANDIDATE_BINDING`, `${candidateId}:definition`);
  const receipt = parseAdmissionJson(projectionReceiptRef, virtualFiles, `${prefix}_RECEIPT_STALE`);
  const receiptCandidate = receipt.candidate_artifact ?? receipt.candidate_projection;
  if (receipt.result !== "pass" || receipt.authority_effect !== "none"
      || !receiptCandidate || receiptCandidate.candidate_id !== candidateId
      || !exactRefIdentity(receiptCandidate, candidateRef)
      || (receiptCandidate.meta_type_id !== undefined && receiptCandidate.meta_type_id !== canonicalMetaTypeRef)
      || (receiptCandidate.architecture_type_id !== undefined && receiptCandidate.architecture_type_id !== architectureTypeRef)
      || (receiptCandidate.authority_effect !== undefined && receiptCandidate.authority_effect !== "none")) {
    admissionFailure(`${prefix}_RECEIPT_BINDING`, candidateId);
  }
  const terminal = parseAdmissionJson(terminalReceiptRef, virtualFiles, `${prefix}_TERMINAL_STALE`);
  const terminalRows = (terminal.candidate_projections ?? []).filter((row) => row.candidate_id === candidateId);
  const terminalRow = terminalRows[0];
  if (terminal.result !== "pass" || terminal.authority_effect !== "none" || terminalRows.length !== 1
      || terminalRow.meta_type_id !== canonicalMetaTypeRef
      || !exactRefIdentity(terminalRow.candidate, candidateRef)
      || !exactRefIdentity(terminalRow.projection_receipt, projectionReceiptRef)
      || terminalRow.projection_receipt?.result !== "pass"
      || terminalRow.projection_receipt?.authority_effect !== "none") {
    admissionFailure(`${prefix}_TERMINAL_BINDING`, candidateId);
  }
  return { candidate, receipt, terminal, evidenceRefs: cloneJson(evidenceRefs) };
};
const promotionScopePayload = (record) => ({
  schema_version: record.schema_version,
  promotion_id: record.promotion_id,
  status: record.status,
  subject: record.subject,
  transition: record.transition,
  accepted_scope_algorithm: record.accepted_scope_algorithm,
  candidate_ref: record.candidate_ref,
  evidence_refs: record.evidence_refs,
  owner_acceptance: {
    owner_route: record.owner_acceptance.owner_route,
    decision_id: record.owner_acceptance.decision_id,
    decision_status: record.owner_acceptance.decision_status,
  },
  rollback: record.rollback,
  authority_effect: record.authority_effect,
});
const promotionScopeSha256 = (record) => sha256Bytes(Buffer.from(canonicalJson(promotionScopePayload(record)), "utf8"));
const expectedPromotionSubject = (kind, subject) => kind === "implementation-instance"
  ? {
      subject_kind: kind,
      instance_id: subject.implementation_instance_id,
      canonical_meta_type_ref: subject.canonical_meta_type_ref,
      architecture_type_ref: subject.architecture_type_ref,
      endpoint_assertion_ref: cloneJson(subject.endpoint_assertion_ref),
    }
  : {
      subject_kind: kind,
      instance_id: subject.relation_instance_id,
      canonical_meta_type_ref: subject.canonical_meta_type_ref,
      relation_type_ref: subject.relation_type_ref,
      source_instance_ref: subject.source_instance_ref,
      target_instance_ref: subject.target_instance_ref,
      relation_assertion_ref: cloneJson(subject.relation_assertion_ref),
      source_endpoint_binding: cloneJson(subject.source_endpoint_binding),
      target_endpoint_binding: cloneJson(subject.target_endpoint_binding),
    };

const subjectForPromotion = (document, record) => record.subject.subject_kind === "implementation-instance"
  ? document.implementation_instances.find((subject) => subject.implementation_instance_id === record.subject.instance_id)
  : document.relation_instances.find((subject) => subject.relation_instance_id === record.subject.instance_id);
const rewindPromotionSubject = (document, record) => {
  const subject = subjectForPromotion(document, record);
  if (!subject) admissionFailure("V2_PROMOTION_PREIMAGE_BINDING", `${record.promotion_id}:subject-missing`);
  subject.lifecycle_axes.admission_status = record.transition.from;
  subject.lifecycle_axes.authority_effect = "none";
  delete subject.promotion_record_ref;
  const rows = record.subject.subject_kind === "implementation-instance" ? document.derived_projection : document.derived_relation_projection;
  const row = rows.find((candidate) => (record.subject.subject_kind === "implementation-instance" ? candidate.implementation_instance_id : candidate.relation_instance_id) === record.subject.instance_id);
  if (!row) admissionFailure("V2_PROMOTION_PREIMAGE_BINDING", `${record.promotion_id}:projection-missing`);
  Object.assign(row, record.subject.subject_kind === "implementation-instance" ? derivedImplementationRow(subject) : derivedRelationRow(subject));
};
const validatePromotionPredecessor = (document, record, recordIndex, virtualFiles) => {
  let predecessor;
  try {
    predecessor = JSON.parse(readAdmissionRef(record.rollback.preimage_ref, virtualFiles, "V2_PROMOTION_PREIMAGE_STALE").toString("utf8"));
  } catch (error) {
    if (error.code) throw error;
    admissionFailure("V2_PROMOTION_PREIMAGE_BINDING", `${record.promotion_id}:not-json`);
  }
  const expected = cloneJson(document);
  const reversedRecords = expected.promotion_records.slice(recordIndex);
  expected.promotion_records = expected.promotion_records.slice(0, recordIndex);
  for (const reversedRecord of [...reversedRecords].reverse()) rewindPromotionSubject(expected, reversedRecord);
  expected.claim_ceiling = claimCeilingFor(expected);
  if (canonicalJson(predecessor) !== canonicalJson(expected)) admissionFailure("V2_PROMOTION_PREIMAGE_BINDING", `${record.promotion_id}:not-immediate-predecessor`);
};
const relationPairKey = (sourceType, targetType) => `${sourceType}\u0000${targetType}`;
const validateRelationDefinitions = (document) => {
  const conceptsById = new Map();
  for (const concept of document.concept_types) {
    if (conceptsById.has(concept.concept_id)) admissionFailure("V2_CONCEPT_HIERARCHY_INVALID", `${concept.concept_id}:duplicate`);
    conceptsById.set(concept.concept_id, concept);
  }
  const hierarchyState = new Map();
  const visitConcept = (conceptId) => {
    const state = hierarchyState.get(conceptId);
    if (state === "visiting") admissionFailure("V2_CONCEPT_HIERARCHY_CYCLE", conceptId);
    if (state === "visited") return;
    const concept = conceptsById.get(conceptId);
    if (!concept) admissionFailure("V2_CONCEPT_HIERARCHY_INVALID", `${conceptId}:unknown`);
    hierarchyState.set(conceptId, "visiting");
    if (concept.extends) {
      if (!conceptsById.has(concept.extends)) admissionFailure("V2_CONCEPT_HIERARCHY_INVALID", `${conceptId}:${concept.extends}`);
      visitConcept(concept.extends);
    }
    hierarchyState.set(conceptId, "visited");
  };
  for (const conceptId of conceptsById.keys()) visitConcept(conceptId);
  const isSubtypeOf = (actualType, expectedType) => {
    if (!conceptsById.has(actualType) || !conceptsById.has(expectedType)) return false;
    const visited = new Set();
    let current = conceptsById.get(actualType);
    while (current) {
      if (current.concept_id === expectedType) return true;
      if (visited.has(current.concept_id)) admissionFailure("V2_CONCEPT_HIERARCHY_CYCLE", current.concept_id);
      visited.add(current.concept_id);
      current = current.extends ? conceptsById.get(current.extends) : null;
    }
    return false;
  };
  const propertiesById = new Map(document.property_definitions.map((property) => [property.property_id, property]));
  const definitionSourceIds = new Set(document.definition_source_refs.map((source) => source.source_id));
  const definitionsById = new Map();
  const relationMatchersById = new Map();
  for (const definition of document.relation_definitions) {
    if (definitionsById.has(definition.relation_id)) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:duplicate`);
    const sources = definition.source_types;
    const targets = definition.target_types;
    if (!Array.isArray(sources) || sources.length === 0 || sources.some((type) => typeof type !== "string") || new Set(sources).size !== sources.length) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:source-types`);
    if (!Array.isArray(targets) || targets.length === 0 || targets.some((type) => typeof type !== "string") || new Set(targets).size !== targets.length) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:target-types`);
    if ([...sources, ...targets].some((type) => !conceptsById.has(type))) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:unknown-type`);
    if (definition.direction !== "directed" || definition.authority_effect !== "none" || !["value-free", "value-constraining"].includes(definition.value_effect)) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:semantics`);
    if (!Array.isArray(definition.properties) || new Set(definition.properties).size !== definition.properties.length || definition.properties.some((property) => !propertiesById.has(property))) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:properties`);
    if (!Array.isArray(definition.evidence_refs) || definition.evidence_refs.length === 0 || new Set(definition.evidence_refs).size !== definition.evidence_refs.length || definition.evidence_refs.some((source) => !definitionSourceIds.has(source))) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:evidence`);
    if (typeof definition.owner_route !== "string" || definition.owner_route.length === 0 || typeof definition.forbidden_collapse !== "string" || definition.forbidden_collapse.length === 0) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:governance`);
    if (!["acyclic", "cycle-permitted", "not-applicable"].includes(definition.cycle_policy)) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:cycle-policy`);
    const hasExplicitPairs = Object.hasOwn(definition, "allowed_type_pairs");
    if (!hasExplicitPairs && sources.length > 1 && targets.length > 1) admissionFailure("V2_RELATION_DEFINITION_PAIRS_REQUIRED", definition.relation_id);
    const pairs = hasExplicitPairs
      ? definition.allowed_type_pairs
      : sources.flatMap((source_type) => targets.map((target_type) => ({ source_type, target_type })));
    if (!Array.isArray(pairs) || pairs.length === 0) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:allowed-type-pairs`);
    const pairSet = new Set();
    const normalizedPairs = [];
    const usedSources = new Set();
    const usedTargets = new Set();
    for (const pair of pairs) {
      const keys = pair && typeof pair === "object" && !Array.isArray(pair) ? Object.keys(pair).sort() : [];
      if (canonicalJson(keys) !== canonicalJson(["source_type", "target_type"]) || !sources.includes(pair.source_type) || !targets.includes(pair.target_type)) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:allowed-type-pair`);
      const key = relationPairKey(pair.source_type, pair.target_type);
      if (pairSet.has(key)) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:duplicate-type-pair`);
      pairSet.add(key);
      normalizedPairs.push({ source_type: pair.source_type, target_type: pair.target_type });
      usedSources.add(pair.source_type);
      usedTargets.add(pair.target_type);
    }
    if (sources.some((source) => !usedSources.has(source)) || targets.some((target) => !usedTargets.has(target))) admissionFailure("V2_RELATION_DEFINITION_INVALID", `${definition.relation_id}:unrepresented-type`);
    definitionsById.set(definition.relation_id, definition);
    relationMatchersById.set(definition.relation_id, (sourceType, targetType) => normalizedPairs.some((pair) => isSubtypeOf(sourceType, pair.source_type) && isSubtypeOf(targetType, pair.target_type)));
  }
  return { conceptsById, definitionsById, relationMatchersById, isSubtypeOf };
};
const assertNoAcyclicRelationCycles = (relations) => {
  const graphs = new Map();
  for (const relation of relations.filter((candidate) => candidate.cycle_policy === "acyclic")) {
    if (!graphs.has(relation.relation_type_ref)) graphs.set(relation.relation_type_ref, new Map());
    const graph = graphs.get(relation.relation_type_ref);
    if (!graph.has(relation.source_instance_ref)) graph.set(relation.source_instance_ref, []);
    graph.get(relation.source_instance_ref).push(relation.target_instance_ref);
  }
  for (const [relationType, graph] of graphs) {
    const visiting = new Set();
    const visited = new Set();
    const visit = (node) => {
      if (visiting.has(node)) return true;
      if (visited.has(node)) return false;
      visiting.add(node);
      for (const target of graph.get(node) ?? []) if (visit(target)) return true;
      visiting.delete(node);
      visited.add(node);
      return false;
    };
    if ([...graph.keys()].some(visit)) admissionFailure("V2_RELATION_CYCLE", relationType);
  }
};
const validateRelationAssertion = (relation, owner, source, target, virtualFiles) => {
  if (!exactRefIdentity(relation.relation_assertion_ref, owner.candidate_ref)) admissionFailure("V2_RELATION_ASSERTION_BINDING", `${relation.relation_instance_id}:owner-artifact`);
  const assertion = readBoundObjectAssertion(relation.relation_assertion_ref, virtualFiles, "V2_RELATION_ASSERTION_STALE");
  const assertionKeys = [
    "relation_instance_id", "relation_owner_candidate_id", "relation_type_ref", "source_instance_ref", "target_instance_ref",
    "source_type_ref", "target_type_ref", "source_candidate_id", "target_candidate_id",
    "source_endpoint_assertion_ref", "target_endpoint_assertion_ref",
  ];
  if (!exactKeySet(assertion, assertionKeys)
      || !exactKeySet(assertion.source_endpoint_assertion_ref, ["candidate_id", "json_pointer"])
      || !exactKeySet(assertion.target_endpoint_assertion_ref, ["candidate_id", "json_pointer"])) {
    admissionFailure("V2_RELATION_ASSERTION_BINDING", `${relation.relation_instance_id}:assertion-keys`);
  }
  const expected = {
    relation_instance_id: relation.relation_instance_id,
    relation_owner_candidate_id: relation.candidate_id,
    relation_type_ref: relation.relation_type_ref,
    source_instance_ref: relation.source_instance_ref,
    target_instance_ref: relation.target_instance_ref,
    source_type_ref: relation.source_type_ref,
    target_type_ref: relation.target_type_ref,
    source_candidate_id: source.candidateId,
    target_candidate_id: target.candidateId,
    source_endpoint_assertion_ref: { candidate_id: source.candidateId, json_pointer: source.endpointAssertionRef.json_pointer },
    target_endpoint_assertion_ref: { candidate_id: target.candidateId, json_pointer: target.endpointAssertionRef.json_pointer },
  };
  for (const [field, value] of Object.entries(expected)) {
    if (canonicalJson(assertion[field]) !== canonicalJson(value)) admissionFailure("V2_RELATION_ASSERTION_BINDING", `${relation.relation_instance_id}:${field}`);
  }
};

const validateAdmissionDocument = (document, { virtualFiles = new Map() } = {}) => {
  const conceptMappings = new Map(document.concept_types
    .filter((concept) => concept.canonical_meta_type_ref)
    .map((concept) => [concept.canonical_meta_type_ref, concept.concept_id]));
  const maturityByMetaType = new Map(currentProjection.meta_types.map((metaType) => [metaType.meta_type_id, metaType.maturity]));
  const {
    conceptsById,
    definitionsById: relationDefinitions,
    relationMatchersById,
    isSubtypeOf,
  } = validateRelationDefinitions(document);
  const relationEndpointTypes = new Set(document.relation_definitions.flatMap((definition) => [...definition.source_types, ...definition.target_types]));
  const implementationByCandidate = new Map();
  const implementationById = new Map();
  const relationById = new Map();
  const endpointRegistry = new Map();
  const supportingIds = new Set();
  const candidateIds = new Set();
  for (const instance of document.implementation_instances) {
    if (implementationById.has(instance.implementation_instance_id) || candidateIds.has(instance.candidate_id)) admissionFailure("V2_IMPLEMENTATION_IDENTITY", instance.implementation_instance_id);
    if (endpointRegistry.has(instance.implementation_instance_id)) admissionFailure("V2_ENDPOINT_IDENTITY", instance.implementation_instance_id);
    const concept = conceptsById.get(instance.architecture_type_ref);
    if (!concept || conceptMappings.get(instance.canonical_meta_type_ref) !== instance.architecture_type_ref) admissionFailure("V2_IMPLEMENTATION_TYPE_BINDING", instance.implementation_instance_id);
    if (instance.lifecycle_axes.meta_type_maturity !== maturityByMetaType.get(instance.canonical_meta_type_ref)) admissionFailure("V2_META_TYPE_MATURITY_BINDING", instance.implementation_instance_id);
    if (instance.lifecycle_axes.definition_status !== concept.candidate_status) admissionFailure("V2_DEFINITION_STATUS_BINDING", instance.implementation_instance_id);
    if (instance.lifecycle_axes.evidence_status !== "validated-candidate") admissionFailure("V2_EVIDENCE_STATUS_BINDING", instance.implementation_instance_id);
    const evidenceRefs = [instance.candidate_ref, instance.projection_receipt_ref, instance.terminal_receipt_ref];
    validateCandidateEvidenceClosure({
      candidateId: instance.candidate_id,
      canonicalMetaTypeRef: instance.canonical_meta_type_ref,
      architectureTypeRef: instance.architecture_type_ref,
      conceptOrDefinitionRef: instance.concept_or_definition_ref,
      evidenceRefs,
      virtualFiles,
      prefix: "V2_IMPLEMENTATION",
    });
    validateEndpointAssertion(instance.endpoint_assertion_ref, instance.implementation_instance_id, instance.architecture_type_ref, virtualFiles, "V2_IMPLEMENTATION_ENDPOINT_ASSERTION");
    implementationById.set(instance.implementation_instance_id, instance);
    implementationByCandidate.set(instance.candidate_id, instance);
    candidateIds.add(instance.candidate_id);
    endpointRegistry.set(instance.implementation_instance_id, { type: instance.architecture_type_ref, candidateId: instance.candidate_id, evidenceRefs: cloneJson(evidenceRefs), endpointAssertionRef: cloneJson(instance.endpoint_assertion_ref), supporting: false });
    const languages = new Set(instance.language_realizations.map((realization) => realization.language));
    if (languages.size !== instance.language_realizations.length || !["typescript", "python", "rust"].every((language) => languages.has(language))) admissionFailure("V2_IMPLEMENTATION_LANGUAGE_BINDING", instance.candidate_id);
    for (const realization of instance.language_realizations) {
      if (!realization.endpoint_assertion_ref) continue;
      if (endpointRegistry.has(realization.node_id)) admissionFailure("V2_ENDPOINT_IDENTITY", realization.node_id);
      const endpointAssertion = readBoundObjectAssertion(realization.endpoint_assertion_ref, virtualFiles, "V2_LANGUAGE_ENDPOINT_ASSERTION");
      const endpointType = endpointAssertion[realization.endpoint_assertion_ref.architecture_type_field];
      validateEndpointAssertion(realization.endpoint_assertion_ref, realization.node_id, endpointType, virtualFiles, "V2_LANGUAGE_ENDPOINT_ASSERTION");
      if (!conceptsById.has(endpointType)) admissionFailure("V2_LANGUAGE_ENDPOINT_ASSERTION", `${realization.node_id}:unknown-type`);
      endpointRegistry.set(realization.node_id, {
        type: endpointType,
        candidateId: instance.candidate_id,
        evidenceRefs: cloneJson(evidenceRefs),
        endpointAssertionRef: cloneJson(realization.endpoint_assertion_ref),
        supporting: false,
      });
    }
  }
  for (const supporting of document.supporting_instances) {
    if (supportingIds.has(supporting.supporting_instance_id) || endpointRegistry.has(supporting.supporting_instance_id)) admissionFailure("V2_SUPPORTING_IDENTITY", supporting.supporting_instance_id);
    const owner = implementationByCandidate.get(supporting.candidate_id);
    if (!owner || owner.canonical_meta_type_ref !== supporting.canonical_meta_type_ref) admissionFailure("V2_SUPPORTING_OWNER_BINDING", supporting.supporting_instance_id);
    const concept = conceptsById.get(supporting.architecture_type_ref);
    if (!concept || concept.abstract !== false || !isSubtypeOf(concept.concept_id, "architecture.ArchitectureElement")
        || isSubtypeOf(concept.concept_id, "architecture.DomainConceptImplementation")
        || concept.canonical_meta_type_ref || ![...relationEndpointTypes].some((endpointType) => isSubtypeOf(concept.concept_id, endpointType))) {
      admissionFailure("V2_SUPPORTING_TYPE_BINDING", supporting.supporting_instance_id);
    }
    if (supporting.lifecycle_axes.definition_status !== concept.candidate_status) admissionFailure("V2_DEFINITION_STATUS_BINDING", supporting.supporting_instance_id);
    if (supporting.lifecycle_axes.evidence_status !== "validated-candidate") admissionFailure("V2_EVIDENCE_STATUS_BINDING", supporting.supporting_instance_id);
    if (supporting.lifecycle_axes.admission_status !== "not-admitted" || supporting.lifecycle_axes.authority_effect !== "none" || supporting.promotion_record_ref) admissionFailure("V2_SUPPORTING_ADMISSION_FORBIDDEN", supporting.supporting_instance_id);
    if (supporting.evidence_refs.length !== 3 || !exactRefIdentity(supporting.evidence_refs[0], owner.candidate_ref) || !exactRefIdentity(supporting.evidence_refs[1], owner.projection_receipt_ref) || !exactRefIdentity(supporting.evidence_refs[2], owner.terminal_receipt_ref)) admissionFailure("V2_SUPPORTING_EVIDENCE_BINDING", supporting.supporting_instance_id);
    validateEndpointAssertion(supporting.endpoint_assertion_ref, supporting.supporting_instance_id, supporting.architecture_type_ref, virtualFiles, "V2_SUPPORTING_ENDPOINT_ASSERTION");
    supportingIds.add(supporting.supporting_instance_id);
    endpointRegistry.set(supporting.supporting_instance_id, { type: supporting.architecture_type_ref, candidateId: supporting.candidate_id, evidenceRefs: cloneJson(supporting.evidence_refs), endpointAssertionRef: cloneJson(supporting.endpoint_assertion_ref), supporting: true });
  }
  const blueprintIds = new Set();
  const blueprintPairs = new Set();
  for (const blueprint of document.relation_instance_blueprints) {
    const hasSingle = typeof blueprint.relation_type_ref === "string";
    const hasMany = Array.isArray(blueprint.relation_type_refs);
    const expectedKeys = hasSingle
      ? ["blueprint_id", "candidate_id", "relation_type_ref", "status", "reason", "authority_effect"]
      : ["blueprint_id", "candidate_id", "relation_type_refs", "status", "reason", "authority_effect"];
    if (hasSingle === hasMany
        || !exactKeySet(blueprint, expectedKeys)
        || typeof blueprint.blueprint_id !== "string"
        || blueprint.blueprint_id.length === 0
        || blueprintIds.has(blueprint.blueprint_id)
        || !implementationByCandidate.has(blueprint.candidate_id)
        || blueprint.status !== "deferred"
        || typeof blueprint.reason !== "string"
        || blueprint.reason.trim().length === 0
        || blueprint.authority_effect !== "none") {
      admissionFailure("V2_RELATION_BLUEPRINT_INVALID", blueprint.blueprint_id ?? blueprint.candidate_id ?? "unknown");
    }
    blueprintIds.add(blueprint.blueprint_id);
    const relationTypeRefs = hasSingle ? [blueprint.relation_type_ref] : blueprint.relation_type_refs;
    if (relationTypeRefs.length === 0 || new Set(relationTypeRefs).size !== relationTypeRefs.length) admissionFailure("V2_RELATION_BLUEPRINT_INVALID", `${blueprint.blueprint_id}:relation-types`);
    for (const relationTypeRef of relationTypeRefs) {
      if (!relationDefinitions.has(relationTypeRef)) admissionFailure("V2_RELATION_BLUEPRINT_INVALID", `${blueprint.blueprint_id}:${relationTypeRef}`);
      const pair = `${blueprint.candidate_id}\u0000${relationTypeRef}`;
      if (blueprintPairs.has(pair)) admissionFailure("V2_RELATION_BLUEPRINT_DUPLICATE", `${blueprint.candidate_id}:${relationTypeRef}`);
      blueprintPairs.add(pair);
    }
  }
  const semanticEdges = new Set();
  for (const relation of document.relation_instances) {
    if (relationById.has(relation.relation_instance_id)) admissionFailure("V2_RELATION_IDENTITY", relation.relation_instance_id);
    const edge = `${relation.relation_type_ref}|${relation.source_instance_ref}|${relation.target_instance_ref}`;
    if (semanticEdges.has(edge)) admissionFailure("V2_RELATION_SEMANTIC_DUPLICATE", edge);
    semanticEdges.add(edge);
    relationById.set(relation.relation_instance_id, relation);
    const definition = relationDefinitions.get(relation.relation_type_ref);
    const source = endpointRegistry.get(relation.source_instance_ref);
    const target = endpointRegistry.get(relation.target_instance_ref);
    if (!definition || !source || !target) admissionFailure("V2_RELATION_ENDPOINT_UNKNOWN", relation.relation_instance_id);
    if (source.type !== relation.source_type_ref || target.type !== relation.target_type_ref) admissionFailure("V2_RELATION_TYPE_BINDING", relation.relation_instance_id);
    if (!relationMatchersById.get(relation.relation_type_ref)(relation.source_type_ref, relation.target_type_ref)) admissionFailure("V2_RELATION_TYPE_PAIR_INVALID", relation.relation_instance_id);
    if (relation.cycle_policy !== definition.cycle_policy) admissionFailure("V2_RELATION_CYCLE_POLICY_INVALID", relation.relation_instance_id);
    const owner = implementationByCandidate.get(relation.candidate_id);
    if (!owner || relation.canonical_meta_type_ref !== owner.canonical_meta_type_ref) admissionFailure("V2_RELATION_OWNER_BINDING", relation.relation_instance_id);
    if (relation.evidence_refs.length !== 3 || !exactRefIdentity(relation.evidence_refs[0], owner.candidate_ref) || !exactRefIdentity(relation.evidence_refs[1], owner.projection_receipt_ref) || !exactRefIdentity(relation.evidence_refs[2], owner.terminal_receipt_ref)) admissionFailure("V2_RELATION_EVIDENCE_BINDING", relation.relation_instance_id);
    validateRelationAssertion(relation, owner, source, target, virtualFiles);
    if (relation.source_endpoint_binding?.candidate_id !== source.candidateId || !exactRefArray(relation.source_endpoint_binding?.evidence_refs, source.evidenceRefs) || !exactAssertionRef(relation.source_endpoint_binding?.endpoint_assertion_ref, source.endpointAssertionRef)) admissionFailure("V2_RELATION_SOURCE_ENDPOINT_BINDING", relation.relation_instance_id);
    if (relation.target_endpoint_binding?.candidate_id !== target.candidateId || !exactRefArray(relation.target_endpoint_binding?.evidence_refs, target.evidenceRefs) || !exactAssertionRef(relation.target_endpoint_binding?.endpoint_assertion_ref, target.endpointAssertionRef)) admissionFailure("V2_RELATION_TARGET_ENDPOINT_BINDING", relation.relation_instance_id);
    const relationDefinitionStatus = definition.candidate_status ?? document.status;
    if (relation.lifecycle_axes.definition_status !== relationDefinitionStatus) admissionFailure("V2_DEFINITION_STATUS_BINDING", relation.relation_instance_id);
    if (relation.lifecycle_axes.evidence_status !== "validated-candidate") admissionFailure("V2_EVIDENCE_STATUS_BINDING", relation.relation_instance_id);
    if (relation.lifecycle_axes.admission_status === "admitted" && (source.supporting || target.supporting)) admissionFailure("V2_SUPPORTING_RELATION_ADMISSION_FORBIDDEN", relation.relation_instance_id);
  }
  assertNoAcyclicRelationCycles(document.relation_instances);

  const promotionById = new Map();
  for (const record of document.promotion_records) {
    if (promotionById.has(record.promotion_id)) admissionFailure("V2_PROMOTION_IDENTITY", record.promotion_id);
    promotionById.set(record.promotion_id, record);
  }
  const referenceCounts = new Map();
  const subjects = [
    ...document.implementation_instances.map((subject) => ({ kind: "implementation-instance", id: subject.implementation_instance_id, subject })),
    ...document.relation_instances.map((subject) => ({ kind: "relation-instance", id: subject.relation_instance_id, subject })),
  ];
  for (const { kind, id, subject } of subjects) {
    const status = subject.lifecycle_axes.admission_status;
    if (!["not-admitted", "proposed", "admitted"].includes(status)) admissionFailure("V2_ADMISSION_STATUS", id);
    if (status !== "admitted") {
      if (subject.promotion_record_ref || subject.lifecycle_axes.authority_effect !== "none") admissionFailure("V2_NONADMITTED_AUTHORITY", id);
      continue;
    }
    if (!subject.promotion_record_ref || subject.lifecycle_axes.authority_effect !== "canonical-admission") admissionFailure("V2_PROMOTION_REQUIRED", id);
    const record = promotionById.get(subject.promotion_record_ref);
    if (!record) admissionFailure("V2_PROMOTION_REQUIRED", id);
    referenceCounts.set(record.promotion_id, (referenceCounts.get(record.promotion_id) ?? 0) + 1);
    if (referenceCounts.get(record.promotion_id) !== 1) admissionFailure("V2_PROMOTION_REFERENCE_COUNT", record.promotion_id);
    if (record.schema_version !== "domainspec-promotion-record/v1" || record.status !== "accepted" || record.transition.axis !== "admission_status" || !["not-admitted", "proposed"].includes(record.transition.from) || record.transition.to !== "admitted" || record.authority_effect !== "canonical-admission") admissionFailure("V2_PROMOTION_TRANSITION", record.promotion_id);
    if (canonicalJson(record.subject) !== canonicalJson(expectedPromotionSubject(kind, subject))) admissionFailure("V2_PROMOTION_SUBJECT_BINDING", record.promotion_id);
    const owner = kind === "implementation-instance" ? subject : implementationByCandidate.get(subject.candidate_id);
    const expectedCandidate = { candidate_id: subject.candidate_id, ...(kind === "implementation-instance" ? subject.candidate_ref : subject.evidence_refs[0]) };
    const expectedEvidence = kind === "implementation-instance" ? [subject.projection_receipt_ref, subject.terminal_receipt_ref] : subject.evidence_refs.slice(1);
    if (!owner || canonicalJson(record.candidate_ref) !== canonicalJson(expectedCandidate)) admissionFailure("V2_PROMOTION_CANDIDATE_BINDING", record.promotion_id);
    if (canonicalJson(record.evidence_refs) !== canonicalJson(expectedEvidence)) admissionFailure("V2_PROMOTION_EVIDENCE_BINDING", record.promotion_id);
    readAdmissionRef(record.candidate_ref, virtualFiles, "V2_PROMOTION_CANDIDATE_STALE");
    for (const ref of record.evidence_refs) readAdmissionRef(ref, virtualFiles, "V2_PROMOTION_EVIDENCE_STALE");
    validatePromotionPredecessor(document, record, document.promotion_records.findIndex((candidate) => candidate.promotion_id === record.promotion_id), virtualFiles);
    const ownerRoute = "DomainSpec architecture-property ontology admission owner";
    if (record.owner_acceptance.owner_route !== ownerRoute || record.rollback.reversal_owner_route !== ownerRoute || record.rollback.automatic_reversal !== false || record.owner_acceptance.decision_status !== "accepted") admissionFailure("V2_PROMOTION_OWNER_BINDING", record.promotion_id);
    const acceptedScope = promotionScopeSha256(record);
    if (record.accepted_scope_algorithm !== "sha256-canonical-json-sorted-keys-v1" || record.owner_acceptance.accepted_scope_sha256 !== acceptedScope) admissionFailure("V2_PROMOTION_SCOPE_BINDING", record.promotion_id);
    const decision = resolveJsonPointer(JSON.parse(readAdmissionRef(record.owner_acceptance.decision_ref, virtualFiles, "V2_PROMOTION_DECISION_STALE").toString("utf8")), record.owner_acceptance.decision_ref.json_pointer);
    if (!decision || decision.decision_id !== record.owner_acceptance.decision_id || decision.status !== "accepted" || decision.owner_route !== ownerRoute || decision.accepted_scope_sha256 !== acceptedScope) admissionFailure("V2_PROMOTION_DECISION_BINDING", record.promotion_id);
  }
  for (const record of document.promotion_records) {
    if (referenceCounts.get(record.promotion_id) !== 1) admissionFailure("V2_PROMOTION_REFERENCE_COUNT", record.promotion_id);
  }
  const expectedImplementations = document.implementation_instances.map(derivedImplementationRow).sort((a, b) => a.implementation_instance_id.localeCompare(b.implementation_instance_id));
  const expectedSupporting = document.supporting_instances.map(derivedSupportingRow).sort((a, b) => a.supporting_instance_id.localeCompare(b.supporting_instance_id));
  const expectedRelations = document.relation_instances.map(derivedRelationRow).sort((a, b) => a.relation_instance_id.localeCompare(b.relation_instance_id));
  if (canonicalJson(expectedImplementations) !== canonicalJson([...document.derived_projection].sort((a, b) => a.implementation_instance_id.localeCompare(b.implementation_instance_id)))) admissionFailure("V2_DERIVED_IMPLEMENTATION_PROJECTION", "rows");
  if (canonicalJson(expectedSupporting) !== canonicalJson([...document.derived_supporting_projection].sort((a, b) => a.supporting_instance_id.localeCompare(b.supporting_instance_id)))) admissionFailure("V2_DERIVED_SUPPORTING_PROJECTION", "rows");
  if (canonicalJson(expectedRelations) !== canonicalJson([...document.derived_relation_projection].sort((a, b) => a.relation_instance_id.localeCompare(b.relation_instance_id)))) admissionFailure("V2_DERIVED_RELATION_PROJECTION", "rows");
  return { implementations: document.implementation_instances.length, supporting: document.supporting_instances.length, relations: document.relation_instances.length, promotions: document.promotion_records.length };
};
const validateProjectionBinding = (document, projection, sourceOntologyRef) => {
  const expectedProjectionPolicy = {
    kind: "derived-read-model",
    sources: ["implementation_instances", "supporting_instances", "relation_instances", "promotion_records"],
    may_author_lifecycle: false,
    may_grant_authority: false,
  };
  const expectedProjectionClaim = document.canonical_implementation_state
    ? "This derived read model reports the owner-admitted canonical implemented meta-type baseline, bounded static generated-target conformance, and the ontology-v2 example lifecycle axes. It does not establish production runtime conformance and cannot author admission, create a PromotionRecord, grant authority, migrate candidate bytes, publish, release, deploy, or establish production readiness."
    : "This derived read model reports ontology-v2 evidence and lifecycle axes. It cannot author admission, create a PromotionRecord, grant authority, migrate candidate bytes, publish, release, deploy, or establish production readiness.";
  if (projection.schema_version !== "domainspec-meta-type-projection/v2"
      || projection.projection_id !== "implementation-conformance.domainspec-meta-types"
      || projection.status !== "candidate-read-model"
      || projection.authority_effect !== "none"
      || projection.purpose !== "Expose the canonical DS-D1 meta-type inventory and explicit implementation-conformance coverage without changing DomainSpec formation or maturity authority."
      || canonicalJson(projection.source_refs) !== canonicalJson(metaTypeProjection.source_refs)
      || canonicalJson(projection.lifecycle_axes) !== canonicalJson(["meta_type_maturity", "definition_status", "evidence_status", "admission_status", "authority_effect"])
      || canonicalJson(projection.projection_policy) !== canonicalJson(expectedProjectionPolicy)
      || projection.claim_ceiling !== expectedProjectionClaim) {
    admissionFailure("V2_PROJECTION_ROOT_BINDING", "schema-kind-status-purpose-sources-axes-policy-claim-authority");
  }
  if (!exactRefIdentity(projection.source_ontology_ref, sourceOntologyRef)) admissionFailure("V2_PROJECTION_SOURCE_BINDING", sourceOntologyRef.path);
  if (canonicalJson(projection.derived_projection) !== canonicalJson(document.derived_projection)) admissionFailure("V2_PROJECTION_DERIVATION", "implementation");
  if (canonicalJson(projection.derived_supporting_projection) !== canonicalJson(document.derived_supporting_projection)) admissionFailure("V2_PROJECTION_DERIVATION", "supporting");
  if (canonicalJson(projection.derived_relation_projection) !== canonicalJson(document.derived_relation_projection)) admissionFailure("V2_PROJECTION_DERIVATION", "relation");
};
const claimCeilingFor = (document) => {
  const statusCounts = (subjects) => ({
    total: subjects.length,
    not_admitted: subjects.filter((subject) => subject.lifecycle_axes.admission_status === "not-admitted").length,
    proposed: subjects.filter((subject) => subject.lifecycle_axes.admission_status === "proposed").length,
    admitted: subjects.filter((subject) => subject.lifecycle_axes.admission_status === "admitted").length,
  });
  const implementationCounts = statusCounts(document.implementation_instances);
  const relationCounts = statusCounts(document.relation_instances);
  const supportingCounts = statusCounts(document.supporting_instances);
  const admittedCount = implementationCounts.admitted + relationCounts.admitted;
  const promotionCount = document.promotion_records.length;
  const blueprintCount = document.relation_instance_blueprints.length;
  const counts = `implementation_instances={total=${implementationCounts.total},not_admitted=${implementationCounts.not_admitted},proposed=${implementationCounts.proposed},admitted=${implementationCounts.admitted}}; supporting_instances={total=${supportingCounts.total},not_admitted=${supportingCounts.not_admitted}}; relation_instances={total=${relationCounts.total},not_admitted=${relationCounts.not_admitted},proposed=${relationCounts.proposed},admitted=${relationCounts.admitted}}; relation_instance_blueprints=${blueprintCount}; PromotionRecords=${promotionCount}`;
  const baselineClause = document.canonical_implementation_state
    ? ` It reports canonical implemented baseline ${document.canonical_implementation_state.baseline_id} with 13 backend meta-types and 39 realization rows; bounded static generated-target conformance is separately admitted by the current state.`
    : "";
  if (admittedCount === 0 && promotionCount === 0) {
    return `This ontology document is materialized as v2 with ${counts}.${baselineClause} Candidate bytes remain unchanged. This document creates no PromotionRecord and does not admit or promote any implementation, relation, or candidate; grant authority; publish; release; deploy; or establish production readiness.`;
  }
  return `This ontology document is materialized as v2 with ${counts}. Candidate bytes remain unchanged. This document contains ${admittedCount} owner-gated admitted instance${admittedCount === 1 ? "" : "s"} backed by ${promotionCount} accepted PromotionRecord${promotionCount === 1 ? "" : "s"}. This admission does not migrate or promote candidate bytes, publish, release, deploy, or establish production readiness.`;
};
const validateLiveClaim = (document) => {
  if (document.claim_ceiling !== claimCeilingFor(document)) admissionFailure("V2_CLAIM_COUNT_BINDING", "exact-live-state");
};
const normalizeCurrentClaim = () => {
  const expected = claimCeilingFor(currentOntology);
  if (currentOntology.claim_ceiling !== expected) errors.push("v2 current claim ceiling does not encode exact variable lifecycle counts");
};
const promotionSchemaBindingViolations = (schema) => {
  const violations = [];
  if (schema.$id !== "domainspec://schemas/promotion-record-v1" || schema.$id.includes("#")) violations.push("root-absolute-id");
  const visit = (value, path = []) => {
    if (Array.isArray(value)) return value.forEach((item, index) => visit(item, [...path, String(index)]));
    if (!value || typeof value !== "object") return;
    if (path.length > 0 && Object.hasOwn(value, "$id")) violations.push(`nested-$id:${path.join("/")}`);
    for (const keyword of ["$anchor", "$dynamicAnchor", "$dynamicRef", "$recursiveAnchor", "$recursiveRef"]) {
      if (Object.hasOwn(value, keyword)) violations.push(`unsupported-${keyword}:${path.join("/")}`);
    }
    if (Object.hasOwn(value, "$ref")) {
      if (typeof value.$ref !== "string" || !value.$ref.startsWith("#/")) violations.push(`nonlocal-$ref:${path.join("/")}`);
      else if (resolveJsonPointer(schema, value.$ref.slice(1)) === undefined) violations.push(`unresolved-$ref:${value.$ref}`);
    }
    for (const [key, item] of Object.entries(value)) visit(item, [...path, key]);
  };
  visit(schema);
  return violations;
};

const runV2Validation = () => {
  const initialErrorCount = errors.length;
  const ontologySchemaPath = resolve(experimentRoot, "schema/architecture-property-ontology-v2.schema.json");
  const promotionSchemaPath = resolve(experimentRoot, "schema/promotion-record-v1.schema.json");
  const ontologyPath = resolve(experimentRoot, "ontology.json");
  const projectionPath = resolve(experimentRoot, "domain-meta-types.projection.json");
  const ontologySchema = readJsonAt(resolve(experimentRoot, "schema"), "architecture-property-ontology-v2.schema.json");
  const promotionSchema = readJsonAt(resolve(experimentRoot, "schema"), "promotion-record-v1.schema.json");
  const bindingViolations = promotionSchemaBindingViolations(promotionSchema);
  if (bindingViolations.length > 0) errors.push(`v2 PromotionRecord cross-schema binding assumptions failed: ${bindingViolations.join(",")}`);
  const python = [
    "import json,sys",
    "from importlib.metadata import version",
    "from jsonschema import Draft202012Validator, RefResolver",
    "ontology_schema=json.load(open(sys.argv[1],encoding='utf-8'))",
    "promotion_schema=json.load(open(sys.argv[2],encoding='utf-8'))",
    "ontology=json.load(open(sys.argv[3],encoding='utf-8'))",
    "Draft202012Validator.check_schema(ontology_schema)",
    "Draft202012Validator.check_schema(promotion_schema)",
    "absolute=lambda value: {key:(promotion_schema['$id']+item if key=='$ref' and isinstance(item,str) and item.startswith('#/') else absolute(item)) for key,item in value.items()} if isinstance(value,dict) else [absolute(item) for item in value] if isinstance(value,list) else value",
    "bound_promotion_schema=absolute(promotion_schema)",
    "retrieve=lambda uri: bound_promotion_schema if uri == promotion_schema['$id'] else (_ for _ in ()).throw(ValueError('unbound schema URI: '+uri))",
    "resolver=RefResolver.from_schema(ontology_schema,handlers={'domainspec':retrieve})",
    "Draft202012Validator(ontology_schema,resolver=resolver).validate(ontology)",
    "records=ontology['promotion_records']",
    "promotion_validator=Draft202012Validator(promotion_schema)",
    "[promotion_validator.validate(record) for record in records]",
    "print(version('jsonschema'))",
  ].join(";");
  const schemaRun = bindingViolations.length === 0
    ? spawnSync("python3", ["-c", python, ontologySchemaPath, promotionSchemaPath, ontologyPath], { encoding: "utf8", maxBuffer: 1024 * 1024 })
    : { status: 1, stdout: "", stderr: bindingViolations.join(",") };
  if (schemaRun.status !== 0) errors.push(`v2 executable JSON Schema validation failed: ${(schemaRun.stderr || schemaRun.stdout).trim()}`);

  if (currentOntology.schema_version !== "domainspec-architecture-property-ontology/v2" || currentOntology.document_mode !== "live" || currentOntology.authority_effect !== "none") errors.push("v2 ontology identity, live mode, or authority effect is invalid");
  if (currentProjection.schema_version !== "domainspec-meta-type-projection/v2" || currentProjection.authority_effect !== "none") errors.push("v2 projection identity or authority effect is invalid");
  if (ontologySchema.$id !== "domainspec://schemas/architecture-property-ontology-v2" || promotionSchema.$id !== "domainspec://schemas/promotion-record-v1") errors.push("v2 schema identifiers are invalid");
  if (canonicalJson(ontologySchema.$defs?.jsonObjectRef) !== canonicalJson(promotionSchema.$defs?.jsonObjectRef)) errors.push("v2 duplicated jsonObjectRef contracts must be exact across ontology and PromotionRecord schemas");
  if (ontologySchema.properties.promotion_records?.items?.$ref !== promotionSchema.$id) errors.push("ontology schema does not bind the PromotionRecord schema");
  if (promotionSchema.properties.status?.const !== "accepted" || promotionSchema.properties.transition?.properties?.axis?.const !== "admission_status" || promotionSchema.properties.transition?.properties?.to?.const !== "admitted" || promotionSchema.properties.authority_effect?.const !== "canonical-admission") errors.push("PromotionRecord owner-gated admission contract is invalid");
  if (promotionSchema.properties.rollback?.properties?.automatic_reversal?.const !== false) errors.push("PromotionRecord automatic reversal must remain forbidden");

  const currentSourcesById = new Map(currentOntology.definition_source_refs.map((ref) => [ref.source_id, ref]));
  const refreshedSourceIds = new Set(["domainspec.meta-types-registry", "domainspec.meta-type-cards", "experiment.ontology-map"]);
  for (const historicalRef of ontology.source_refs) {
    const currentRef = currentSourcesById.get(historicalRef.source_id);
    if (!currentRef) errors.push(`v2 definition source catalogue omits immutable v1 source:${historicalRef.source_id}`);
    else if (currentRef.path !== historicalRef.path) errors.push(`v2 definition source path drift:${historicalRef.source_id}`);
    else if (!refreshedSourceIds.has(historicalRef.source_id) && canonicalJson(currentRef) !== canonicalJson(historicalRef)) errors.push(`v2 immutable definition source drift:${historicalRef.source_id}`);
  }
  for (const requiredSourceId of [
    "domainspec.definition-catalogue",
    "domainspec.current-meta-type-implementation",
    "domainspec.canonical-meta-type-baseline-v3",
    "domainspec.meta-type-baseline-v3-owner-decision",
    "domainspec.relationship-signatures",
  ]) if (!currentSourcesById.has(requiredSourceId)) errors.push(`v2 current definition source missing:${requiredSourceId}`);
  const normalizedCurrentConceptTypes = cloneJson(currentOntology.concept_types);
  for (const concept of normalizedCurrentConceptTypes) {
    if (concept.canonical_mapping_status === "canonical-baseline-alignment") concept.canonical_mapping_status = "candidate-alignment";
  }
  if (canonicalJson(normalizedCurrentConceptTypes) !== canonicalJson(ontology.concept_types)) errors.push("v2 concept catalogue changed beyond current baseline alignment");
  for (const field of ["property_definitions", "relation_definitions", "constraint_operators", "language_projections"]) {
    if (canonicalJson(currentOntology[field]) !== canonicalJson(ontology[field])) errors.push(`v2 definition catalogue drift: ${field}`);
  }
  const definitionSourceIds = new Set(currentOntology.definition_source_refs.map((ref) => ref.source_id));
  if (definitionSourceIds.size !== currentOntology.definition_source_refs.length) errors.push("v2 definition source ids are not unique");
  for (const ref of currentOntology.definition_source_refs) verifyCurrentFileRef(ref, `v2 definition source ${ref.source_id}`);
  for (const ref of currentOntology.migration_evidence_refs) verifyCurrentFileRef(ref, "v2 migration evidence");

  const canonicalState = currentOntology.canonical_implementation_state;
  const expectedOperationObligations = [
    "declared read set",
    "declared write set",
    "declared effect set",
    "guard executes before state mutation",
    "atomic state-and-outbox behavior",
    "explicit failure continuation",
    "no undeclared read, write or effect",
    "typed relationships to Rule, Event and Workflow",
  ];
  try {
    if (currentOntology.ontology_scope?.ontology_type !== "architecture-property"
        || currentOntology.ontology_scope?.branch !== "system"
        || currentOntology.ontology_scope?.visibility !== "private"
        || currentOntology.ontology_scope?.owner_route !== "implementation-conformance profile owner") {
      throw new Error("ontology scope identity or owner route drift");
    }
    if (!canonicalState || canonicalState.authority_effect !== "none") throw new Error("canonical implementation state missing or authority-inflated");
    const stateBytes = verifyCurrentFileRef(canonicalState.state_file_ref, "canonical implementation state");
    const manifestBytes = verifyCurrentFileRef(canonicalState.baseline_manifest_ref, "canonical baseline manifest");
    verifyCurrentFileRef(canonicalState.owner_decision_ref, "canonical baseline owner decision");
    if (!stateBytes || !manifestBytes) throw new Error("canonical state binding is unreadable");
    const state = JSON.parse(stateBytes.toString("utf8"));
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    if (canonicalState.state_ref !== canonicalState.state_file_ref.path) throw new Error("canonical state path identity drift");
    if (canonicalState.baseline_id !== state.baseline.id || canonicalState.baseline_id !== manifest.baseline_id) throw new Error("canonical baseline identity drift");
    if (canonicalState.baseline_digest !== state.baseline.baseline_digest || canonicalState.baseline_digest !== manifest.baseline_digest) throw new Error("canonical baseline digest drift");
    if (canonicalJson(canonicalState.scope) !== canonicalJson(state.scope) || canonicalJson(canonicalState.scope) !== canonicalJson(manifest.denominators)) throw new Error("canonical baseline denominator drift");
    if (canonicalJson(canonicalState.realization_rows) !== canonicalJson(manifest.realization_rows)) throw new Error("canonical realization row drift");
    if (canonicalState.realization_rows.length !== 39 || new Set(canonicalState.realization_rows.map(({ meta_type_id, language }) => `${meta_type_id}/${language}`)).size !== 39) throw new Error("canonical realization closure is not 13 by 3");
    if (canonicalJson(canonicalState.backend_meta_types) !== canonicalJson(state.backend_meta_types.map(({ id }) => id))) throw new Error("canonical backend type set drift");
    if (canonicalJson(canonicalState.operation_contract.obligations) !== canonicalJson(expectedOperationObligations)) throw new Error("Operation obligation set drift");
    if (canonicalJson(canonicalState.operation_contract.relationship_authority) !== canonicalJson([
      "Rule --[enforces]--> Operation",
      "Operation --[produces]--> Event",
      "Workflow --[orchestrates]--> Operation",
    ])) throw new Error("Operation relationship authority drift");
    if (canonicalJson(currentProjection.canonical_implementation_state) !== canonicalJson(canonicalState)) throw new Error("ontology/projection canonical state drift");
    if (currentOntology.implementation_instances.length !== 6 || currentOntology.implementation_instances.some(({ lifecycle_axes }) => lifecycle_axes.admission_status !== "not-admitted")) throw new Error("historical example-instance lifecycle changed");
    const conceptMappings = currentOntology.concept_types.filter(({ canonical_mapping_status }) => canonical_mapping_status === "canonical-baseline-alignment");
    if (conceptMappings.length !== 13 || new Set(conceptMappings.map(({ canonical_meta_type_ref }) => canonical_meta_type_ref)).size !== 13) throw new Error("canonical architecture concept mapping is not total");
    const activeProjectionRows = currentProjection.meta_types.filter(({ maturity }) => maturity === "active");
    if (activeProjectionRows.length !== 13 || activeProjectionRows.some(({ mapping_status, architecture_type_id }) => mapping_status !== "canonical-baseline-alignment" || !architecture_type_id)) throw new Error("canonical meta-type projection mapping is not total");
    const hostileStates = [
      { id: "missing-row", mutate: (value) => value.realization_rows.pop() },
      { id: "duplicate-row", mutate: (value) => { value.realization_rows[1] = cloneJson(value.realization_rows[0]); } },
      { id: "unknown-language", mutate: (value) => { value.realization_rows[0].language = "java"; } },
      { id: "digest-drift", mutate: (value) => { value.realization_rows[0].source.sha256 = "0".repeat(64); } },
      { id: "status-erasure", mutate: (value) => { value.claim_ceiling.generated_target_conformance = false; } },
    ];
    let hostilesKilled = 0;
    for (const hostile of hostileStates) {
      const changed = cloneJson(canonicalState);
      hostile.mutate(changed);
      const exact = changed.realization_rows.length === 39
        && new Set(changed.realization_rows.map(({ meta_type_id, language }) => `${meta_type_id}/${language}`)).size === 39
        && canonicalJson(changed.realization_rows) === canonicalJson(manifest.realization_rows)
        && changed.claim_ceiling.generated_target_conformance === true;
      if (!exact) hostilesKilled += 1;
    }
    if (hostilesKilled !== hostileStates.length) throw new Error(`canonical-state hostile controls ${hostilesKilled}/${hostileStates.length}`);
    checks.push(`canonical current implementation baseline: 13 types, 39 realization rows, 6 historical examples unchanged, hostile controls ${hostilesKilled}/${hostileStates.length}`);
  } catch (error) {
    errors.push(`v2 canonical implementation-state validation failed: ${error.message}`);
  }

  let currentAdmissionState = null;
  try {
    currentAdmissionState = validateAdmissionDocument(currentOntology);
  } catch (error) {
    errors.push(`v2 admission-state validation failed: ${error.message}`);
  }
  const validateOntologySchema = (document) => {
    if (bindingViolations.length > 0) return { accepted: false, diagnostic: bindingViolations.join(",") };
    const script = [
      "import json,sys",
      "from jsonschema import Draft202012Validator, RefResolver",
      "payload=json.load(sys.stdin)",
      "promotion_schema=payload['promotion_schema']",
      "absolute=lambda value: {key:(promotion_schema['$id']+item if key=='$ref' and isinstance(item,str) and item.startswith('#/') else absolute(item)) for key,item in value.items()} if isinstance(value,dict) else [absolute(item) for item in value] if isinstance(value,list) else value",
      "bound_promotion_schema=absolute(promotion_schema)",
      "retrieve=lambda uri: bound_promotion_schema if uri == promotion_schema['$id'] else (_ for _ in ()).throw(ValueError('unbound schema URI: '+uri))",
      "resolver=RefResolver.from_schema(payload['ontology_schema'],handlers={'domainspec':retrieve})",
      "Draft202012Validator(payload['ontology_schema'],resolver=resolver).validate(payload['document'])",
      "records=payload['document']['promotion_records']",
      "promotion_validator=Draft202012Validator(payload['promotion_schema'])",
      "[promotion_validator.validate(record) for record in records]",
    ].join(";");
    const run = spawnSync("python3", ["-c", script], {
      input: `${JSON.stringify({ ontology_schema: ontologySchema, promotion_schema: promotionSchema, document })}\n`,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    return {
      accepted: run.status === 0,
      diagnostic: (run.stderr || run.stdout || "unknown schema failure").trim(),
    };
  };
  const addVirtualJson = (virtualFiles, path, value) => {
    const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
    virtualFiles.set(path, bytes);
    return { path, sha256: sha256Bytes(bytes), size_bytes: bytes.length };
  };
  const addSyntheticImplementation = (virtualFiles, suffix, {
    metaTypeRef = "DS-D1.3",
    architectureTypeRef = "architecture.EnumImplementation",
    definitionRef = `synthetic.live-validator.${suffix}`,
    implementationIdOverride = null,
    extraCandidate = {},
  } = {}) => {
    const candidateId = `candidate.live-validator.${suffix}/v1`;
    const implementationId = implementationIdOverride ?? `implementation.live-validator.${suffix}/v1`;
    const languageEndpointAssertions = ["typescript", "python", "rust"].map((language) => ({
      node_id: `${suffix}.${language}`,
      architecture_type_ref: architectureTypeRef === "architecture.EnumImplementation" ? "architecture.EnumRepresentationUnit" : "architecture.ArchitectureElement",
    }));
    const candidateRef = addVirtualJson(virtualFiles, `synthetic/live-validator/${suffix}/candidate.json`, {
      schema_version: "domainspec.meta-type-implementation-candidate/v1",
      candidate_id: candidateId,
      meta_type: { id: metaTypeRef },
      architecture_implementation: { type_id: architectureTypeRef, definition_id: definitionRef },
      implementation_endpoint_assertion: { instance_id: implementationId, architecture_type_ref: architectureTypeRef },
      language_endpoint_assertions: languageEndpointAssertions,
      lifecycle: {
        canonical_maturity: "active",
        architecture_mapping_status: "candidate-mapped",
        implementation_evidence_status: "candidate",
        factory_replay_kind: "same-oracle-deterministic",
        queue_readiness: false,
        queue_readiness_effect: "unchanged",
        authority_effect: "none",
      },
      claim_ceiling: "Synthetic validator-only candidate with no admission, promotion, readiness, publication, release, deployment, or production authority.",
      fixture_only: true,
      authority_effect: "none",
      ...extraCandidate,
    });
    const projectionReceiptRef = addVirtualJson(virtualFiles, `synthetic/live-validator/${suffix}/projection-receipt.json`, {
      result: "pass",
      authority_effect: "none",
      candidate_artifact: { ...candidateRef, candidate_id: candidateId, meta_type_id: metaTypeRef, architecture_type_id: architectureTypeRef, authority_effect: "none" },
      fixture_only: true,
    });
    const terminalReceiptRef = addVirtualJson(virtualFiles, `synthetic/live-validator/${suffix}/terminal-receipt.json`, {
      result: "pass",
      authority_effect: "none",
      candidate_projections: [{
        meta_type_id: metaTypeRef,
        candidate_id: candidateId,
        candidate: cloneJson(candidateRef),
        projection_receipt: { ...projectionReceiptRef, result: "pass", authority_effect: "none" },
      }],
      fixture_only: true,
    });
    const implementation = {
      implementation_instance_id: implementationId,
      candidate_id: candidateId,
      canonical_meta_type_ref: metaTypeRef,
      architecture_type_ref: architectureTypeRef,
      concept_or_definition_ref: definitionRef,
      endpoint_assertion_ref: { ...candidateRef, json_pointer: "/implementation_endpoint_assertion", assertion_spec: "instance-endpoint-assertion/v1", identity_field: "instance_id", architecture_type_field: "architecture_type_ref" },
      candidate_ref: candidateRef,
      projection_receipt_ref: projectionReceiptRef,
      terminal_receipt_ref: terminalReceiptRef,
      language_realizations: ["typescript", "python", "rust"].map((language, index) => ({
        language,
        node_id: `${suffix}.${language}`,
        provider_id: `synthetic-${suffix}-${language}-v1`,
        protocol_id: `synthetic.${suffix}.${language}/v1`,
        endpoint_assertion_ref: { ...candidateRef, json_pointer: `/language_endpoint_assertions/${index}`, assertion_spec: "node-endpoint-assertion/v1", identity_field: "node_id", architecture_type_field: "architecture_type_ref" },
      })),
      lifecycle_axes: { meta_type_maturity: "active", definition_status: "candidate", evidence_status: "validated-candidate", admission_status: "not-admitted", authority_effect: "none" },
    };
    return { implementation, evidenceRefs: [candidateRef, projectionReceiptRef, terminalReceiptRef], endpointAssertionRef: implementation.endpoint_assertion_ref };
  };
  const rebindSyntheticCandidate = (fixture, implementation, mutateCandidate) => {
    const { virtualFiles, document } = fixture;
    const oldCandidateRef = cloneJson(implementation.candidate_ref);
    const oldProjectionReceiptRef = cloneJson(implementation.projection_receipt_ref);
    const oldTerminalReceiptRef = cloneJson(implementation.terminal_receipt_ref);
    const candidate = JSON.parse(virtualFiles.get(oldCandidateRef.path).toString("utf8"));
    mutateCandidate(candidate);
    const candidateRef = addVirtualJson(virtualFiles, oldCandidateRef.path, candidate);
    const receipt = JSON.parse(virtualFiles.get(oldProjectionReceiptRef.path).toString("utf8"));
    const receiptCandidateKey = receipt.candidate_artifact ? "candidate_artifact" : "candidate_projection";
    receipt[receiptCandidateKey] = { ...receipt[receiptCandidateKey], ...candidateRef, candidate_id: implementation.candidate_id };
    const projectionReceiptRef = addVirtualJson(virtualFiles, oldProjectionReceiptRef.path, receipt);
    const terminal = JSON.parse(virtualFiles.get(oldTerminalReceiptRef.path).toString("utf8"));
    const terminalRow = terminal.candidate_projections.find((row) => row.candidate_id === implementation.candidate_id);
    terminalRow.candidate = cloneJson(candidateRef);
    terminalRow.projection_receipt = { ...projectionReceiptRef, result: "pass", authority_effect: "none" };
    const terminalReceiptRef = addVirtualJson(virtualFiles, oldTerminalReceiptRef.path, terminal);
    const rebaseAssertionRef = (ref) => exactRefIdentity(ref, oldCandidateRef) ? { ...candidateRef, ...Object.fromEntries(Object.entries(ref).filter(([key]) => !["path", "sha256", "size_bytes"].includes(key))) } : ref;
    implementation.candidate_ref = candidateRef;
    implementation.projection_receipt_ref = projectionReceiptRef;
    implementation.terminal_receipt_ref = terminalReceiptRef;
    implementation.endpoint_assertion_ref = rebaseAssertionRef(implementation.endpoint_assertion_ref);
    for (const realization of implementation.language_realizations) {
      if (realization.endpoint_assertion_ref) realization.endpoint_assertion_ref = rebaseAssertionRef(realization.endpoint_assertion_ref);
    }
    const evidenceRefs = [candidateRef, projectionReceiptRef, terminalReceiptRef];
    for (const supporting of document.supporting_instances) {
      if (supporting.candidate_id !== implementation.candidate_id) continue;
      supporting.evidence_refs = cloneJson(evidenceRefs);
      supporting.endpoint_assertion_ref = rebaseAssertionRef(supporting.endpoint_assertion_ref);
    }
    for (const relation of document.relation_instances) {
      if (relation.candidate_id === implementation.candidate_id) {
        relation.evidence_refs = cloneJson(evidenceRefs);
        relation.relation_assertion_ref = rebaseAssertionRef(relation.relation_assertion_ref);
      }
      for (const side of ["source", "target"]) {
        const binding = relation[`${side}_endpoint_binding`];
        if (binding?.candidate_id !== implementation.candidate_id) continue;
        binding.evidence_refs = cloneJson(evidenceRefs);
        binding.endpoint_assertion_ref = rebaseAssertionRef(binding.endpoint_assertion_ref);
      }
    }
    document.derived_projection = document.implementation_instances.map(derivedImplementationRow);
    document.derived_supporting_projection = document.supporting_instances.map(derivedSupportingRow);
    document.derived_relation_projection = document.relation_instances.map(derivedRelationRow);
    document.claim_ceiling = claimCeilingFor(document);
    return { candidateRef, projectionReceiptRef, terminalReceiptRef };
  };
  const normalizedPreAdmissionFixture = (kind) => {
    const document = cloneJson(currentOntology);
    const virtualFiles = new Map();
    const source = addSyntheticImplementation(virtualFiles, "source-endpoint");
    const target = addSyntheticImplementation(virtualFiles, "target-endpoint");
    const relationInstanceId = "relation.live-validator.cross-candidate-depends-on/v1";
    const relationOwnerCandidateId = "candidate.live-validator.relation-owner/v1";
    const sourceEndpointAssertionRef = source.implementation.endpoint_assertion_ref;
    const targetEndpointAssertionRef = target.implementation.language_realizations[0].endpoint_assertion_ref;
    const relationAssertion = {
      relation_instance_id: relationInstanceId,
      relation_owner_candidate_id: relationOwnerCandidateId,
      relation_type_ref: "architecture.depends_on",
      source_instance_ref: source.implementation.implementation_instance_id,
      target_instance_ref: target.implementation.language_realizations[0].node_id,
      source_type_ref: source.implementation.architecture_type_ref,
      target_type_ref: "architecture.EnumRepresentationUnit",
      source_candidate_id: source.implementation.candidate_id,
      target_candidate_id: target.implementation.candidate_id,
      source_endpoint_assertion_ref: { candidate_id: source.implementation.candidate_id, json_pointer: sourceEndpointAssertionRef.json_pointer },
      target_endpoint_assertion_ref: { candidate_id: target.implementation.candidate_id, json_pointer: targetEndpointAssertionRef.json_pointer },
    };
    const owner = addSyntheticImplementation(virtualFiles, "relation-owner", { extraCandidate: { relation_assertions: [relationAssertion] } });
    const relation = {
      relation_instance_id: relationInstanceId,
      candidate_id: owner.implementation.candidate_id,
      canonical_meta_type_ref: owner.implementation.canonical_meta_type_ref,
      relation_type_ref: "architecture.depends_on",
      source_instance_ref: source.implementation.implementation_instance_id,
      target_instance_ref: target.implementation.language_realizations[0].node_id,
      source_type_ref: source.implementation.architecture_type_ref,
      target_type_ref: "architecture.EnumRepresentationUnit",
      relation_assertion_ref: { ...owner.implementation.candidate_ref, json_pointer: "/relation_assertions/0" },
      evidence_refs: cloneJson(owner.evidenceRefs),
      source_endpoint_binding: { candidate_id: source.implementation.candidate_id, evidence_refs: cloneJson(source.evidenceRefs), endpoint_assertion_ref: cloneJson(sourceEndpointAssertionRef) },
      target_endpoint_binding: { candidate_id: target.implementation.candidate_id, evidence_refs: cloneJson(target.evidenceRefs), endpoint_assertion_ref: cloneJson(targetEndpointAssertionRef) },
      cycle_policy: "acyclic",
      lifecycle_axes: { definition_status: "candidate", evidence_status: "validated-candidate", admission_status: "not-admitted", authority_effect: "none" },
    };
    document.implementation_instances = [owner.implementation, source.implementation, target.implementation];
    document.supporting_instances = [];
    document.relation_instances = [relation];
    document.relation_instance_blueprints = [];
    document.promotion_records = [];
    document.derived_projection = document.implementation_instances.map(derivedImplementationRow);
    document.derived_supporting_projection = [];
    document.derived_relation_projection = [derivedRelationRow(relation)];
    document.claim_ceiling = claimCeilingFor(document);
    const predecessorRef = addVirtualJson(virtualFiles, `synthetic/live-validator/preimages/${kind}.json`, document);
    return { document, virtualFiles, predecessorRef };
  };
  const buildAdmissionSimulation = (kind) => {
    const fixture = normalizedPreAdmissionFixture(kind);
    const document = fixture.document;
    const subject = kind === "implementation-instance" ? document.implementation_instances[0] : document.relation_instances[0];
    const instanceId = kind === "implementation-instance" ? subject.implementation_instance_id : subject.relation_instance_id;
    const promotionId = kind === "implementation-instance" ? "promotion.implementation.live-validator.synthetic-enum/v1" : "promotion.relation.live-validator.synthetic-enum/v1";
    const decisionId = kind === "implementation-instance" ? "DECISION-LIVE-VALIDATOR-IMPLEMENTATION-ADMISSION" : "DECISION-LIVE-VALIDATOR-RELATION-ADMISSION";
    const candidateSource = kind === "implementation-instance" ? subject.candidate_ref : subject.evidence_refs[0];
    const evidenceRefs = kind === "implementation-instance" ? [subject.projection_receipt_ref, subject.terminal_receipt_ref] : subject.evidence_refs.slice(1);
    const ownerRoute = "DomainSpec architecture-property ontology admission owner";
    const record = {
      schema_version: "domainspec-promotion-record/v1",
      promotion_id: promotionId,
      status: "accepted",
      subject: expectedPromotionSubject(kind, subject),
      transition: { axis: "admission_status", from: "not-admitted", to: "admitted" },
      accepted_scope_algorithm: "sha256-canonical-json-sorted-keys-v1",
      candidate_ref: { candidate_id: subject.candidate_id, ...candidateSource },
      evidence_refs: cloneJson(evidenceRefs),
      owner_acceptance: { owner_route: ownerRoute, decision_id: decisionId, decision_ref: null, decision_status: "accepted", accepted_scope_sha256: "0".repeat(64) },
      rollback: { preimage_ref: cloneJson(fixture.predecessorRef), reversal_owner_route: ownerRoute, automatic_reversal: false },
      authority_effect: "canonical-admission",
    };
    record.owner_acceptance.accepted_scope_sha256 = promotionScopeSha256(record);
    const decisionRef = addVirtualJson(fixture.virtualFiles, `synthetic/live-validator/decisions/${kind}.json`, {
      synthetic_decision: { decision_id: decisionId, status: "accepted", owner_route: ownerRoute, accepted_scope_sha256: record.owner_acceptance.accepted_scope_sha256, fixture_only: true, authority_effect: "none" },
    });
    record.owner_acceptance.decision_ref = { ...decisionRef, json_pointer: "/synthetic_decision" };
    document.promotion_records.push(record);
    subject.lifecycle_axes.admission_status = "admitted";
    subject.lifecycle_axes.authority_effect = "canonical-admission";
    subject.promotion_record_ref = promotionId;
    const projectionRows = kind === "implementation-instance" ? document.derived_projection : document.derived_relation_projection;
    const projectionRow = projectionRows.find((row) => (kind === "implementation-instance" ? row.implementation_instance_id : row.relation_instance_id) === instanceId);
    Object.assign(projectionRow, kind === "implementation-instance" ? derivedImplementationRow(subject) : derivedRelationRow(subject));
    document.claim_ceiling = claimCeilingFor(document);
    const admittedOntologyRef = addVirtualJson(fixture.virtualFiles, `synthetic/live-validator/admitted/${kind}.json`, document);
    const projection = cloneJson(currentProjection);
    projection.source_ontology_ref = cloneJson(admittedOntologyRef);
    projection.derived_projection = cloneJson(document.derived_projection);
    projection.derived_supporting_projection = cloneJson(document.derived_supporting_projection);
    projection.derived_relation_projection = cloneJson(document.derived_relation_projection);
    return { kind, document, record, projection, admittedOntologyRef, virtualFiles: fixture.virtualFiles };
  };
  const simulations = [buildAdmissionSimulation("implementation-instance"), buildAdmissionSimulation("relation-instance")];
  let positiveAdmissionsPassed = 0;
  for (const simulation of simulations) {
    try {
      const schemaValidation = validateOntologySchema(simulation.document);
      if (!schemaValidation.accepted) admissionFailure("V2_PROMOTION_SCHEMA", `${simulation.kind}:${schemaValidation.diagnostic}`);
      validateAdmissionDocument(simulation.document, simulation);
      validateProjectionBinding(simulation.document, simulation.projection, simulation.admittedOntologyRef);
      validateLiveClaim(simulation.document);
      positiveAdmissionsPassed += 1;
    } catch (error) {
      errors.push(`v2 positive ${simulation.kind} admission simulation failed: ${error.message}`);
    }
  }
  const finalizeSemanticFixture = (document, { preserveBlueprints = false } = {}) => {
    document.promotion_records = [];
    if (!preserveBlueprints) document.relation_instance_blueprints = [];
    document.derived_projection = document.implementation_instances.map(derivedImplementationRow);
    document.derived_supporting_projection = document.supporting_instances.map(derivedSupportingRow);
    document.derived_relation_projection = document.relation_instances.map(derivedRelationRow);
    document.claim_ceiling = claimCeilingFor(document);
  };
  const appendSyntheticAdmission = (fixture, kind, subject, suffix) => {
    const { document, virtualFiles } = fixture;
    const ownerRoute = "DomainSpec architecture-property ontology admission owner";
    const promotionId = `promotion.${kind}.${suffix}/v1`;
    const decisionId = `DECISION-${suffix.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
    document.claim_ceiling = claimCeilingFor(document);
    const predecessorRef = addVirtualJson(virtualFiles, `synthetic/live-validator/preimages/${suffix}.json`, document);
    const candidateSource = kind === "implementation-instance" ? subject.candidate_ref : subject.evidence_refs[0];
    const evidenceRefs = kind === "implementation-instance" ? [subject.projection_receipt_ref, subject.terminal_receipt_ref] : subject.evidence_refs.slice(1);
    const record = {
      schema_version: "domainspec-promotion-record/v1",
      promotion_id: promotionId,
      status: "accepted",
      subject: expectedPromotionSubject(kind, subject),
      transition: { axis: "admission_status", from: "not-admitted", to: "admitted" },
      accepted_scope_algorithm: "sha256-canonical-json-sorted-keys-v1",
      candidate_ref: { candidate_id: subject.candidate_id, ...candidateSource },
      evidence_refs: cloneJson(evidenceRefs),
      owner_acceptance: { owner_route: ownerRoute, decision_id: decisionId, decision_ref: null, decision_status: "accepted", accepted_scope_sha256: "0".repeat(64) },
      rollback: { preimage_ref: predecessorRef, reversal_owner_route: ownerRoute, automatic_reversal: false },
      authority_effect: "canonical-admission",
    };
    record.owner_acceptance.accepted_scope_sha256 = promotionScopeSha256(record);
    const decisionRef = addVirtualJson(virtualFiles, `synthetic/live-validator/decisions/${suffix}.json`, {
      synthetic_decision: { decision_id: decisionId, status: "accepted", owner_route: ownerRoute, accepted_scope_sha256: record.owner_acceptance.accepted_scope_sha256, fixture_only: true, authority_effect: "none" },
    });
    record.owner_acceptance.decision_ref = { ...decisionRef, json_pointer: "/synthetic_decision" };
    document.promotion_records.push(record);
    subject.lifecycle_axes.admission_status = "admitted";
    subject.lifecycle_axes.authority_effect = "canonical-admission";
    subject.promotion_record_ref = promotionId;
    const rows = kind === "implementation-instance" ? document.derived_projection : document.derived_relation_projection;
    const idField = kind === "implementation-instance" ? "implementation_instance_id" : "relation_instance_id";
    const subjectId = kind === "implementation-instance" ? subject.implementation_instance_id : subject.relation_instance_id;
    Object.assign(rows.find((row) => row[idField] === subjectId), kind === "implementation-instance" ? derivedImplementationRow(subject) : derivedRelationRow(subject));
    document.claim_ceiling = claimCeilingFor(document);
    return record;
  };
  const buildTwoRelationFixture = () => {
    const fixture = normalizedPreAdmissionFixture("two-relation-population");
    const source = fixture.document.implementation_instances[2];
    const target = fixture.document.implementation_instances[0];
    const relationInstanceId = "relation.live-validator.cross-candidate-depends-on-reverse/v1";
    const ownerCandidateId = "candidate.live-validator.relation-owner-second/v1";
    const assertion = {
      relation_instance_id: relationInstanceId,
      relation_owner_candidate_id: ownerCandidateId,
      relation_type_ref: "architecture.depends_on",
      source_instance_ref: target.implementation_instance_id,
      target_instance_ref: source.implementation_instance_id,
      source_type_ref: target.architecture_type_ref,
      target_type_ref: source.architecture_type_ref,
      source_candidate_id: target.candidate_id,
      target_candidate_id: source.candidate_id,
      source_endpoint_assertion_ref: { candidate_id: target.candidate_id, json_pointer: target.endpoint_assertion_ref.json_pointer },
      target_endpoint_assertion_ref: { candidate_id: source.candidate_id, json_pointer: source.endpoint_assertion_ref.json_pointer },
    };
    const owner = addSyntheticImplementation(fixture.virtualFiles, "relation-owner-second", { extraCandidate: { relation_assertions: [assertion] } });
    const relation = {
      relation_instance_id: relationInstanceId,
      candidate_id: owner.implementation.candidate_id,
      canonical_meta_type_ref: owner.implementation.canonical_meta_type_ref,
      relation_type_ref: "architecture.depends_on",
      source_instance_ref: target.implementation_instance_id,
      target_instance_ref: source.implementation_instance_id,
      source_type_ref: target.architecture_type_ref,
      target_type_ref: source.architecture_type_ref,
      relation_assertion_ref: { ...owner.implementation.candidate_ref, json_pointer: "/relation_assertions/0" },
      evidence_refs: cloneJson(owner.evidenceRefs),
      source_endpoint_binding: { candidate_id: target.candidate_id, evidence_refs: [target.candidate_ref, target.projection_receipt_ref, target.terminal_receipt_ref], endpoint_assertion_ref: cloneJson(target.endpoint_assertion_ref) },
      target_endpoint_binding: { candidate_id: source.candidate_id, evidence_refs: [source.candidate_ref, source.projection_receipt_ref, source.terminal_receipt_ref], endpoint_assertion_ref: cloneJson(source.endpoint_assertion_ref) },
      cycle_policy: "acyclic",
      lifecycle_axes: { definition_status: "candidate", evidence_status: "validated-candidate", admission_status: "not-admitted", authority_effect: "none" },
    };
    fixture.document.implementation_instances.push(owner.implementation);
    fixture.document.relation_instances.push(relation);
    finalizeSemanticFixture(fixture.document);
    return fixture;
  };
  const semanticPositiveCases = [
    {
      id: "cross-candidate-concrete-depends-on",
      build: () => normalizedPreAdmissionFixture("cross-candidate-concrete-depends-on"),
    },
    {
      id: "concrete-subtype-consumes",
      build: () => {
        const document = cloneJson(currentOntology);
        const virtualFiles = new Map();
        const source = addSyntheticImplementation(virtualFiles, "consumes-source");
        const target = addSyntheticImplementation(virtualFiles, "consumes-event", {
          metaTypeRef: "DS-D1.12",
          architectureTypeRef: "architecture.EventImplementation",
          definitionRef: "synthetic.live-validator.consumes-event",
        });
        const relationInstanceId = "relation.live-validator.concrete-consumes/v1";
        const relationOwnerCandidateId = "candidate.live-validator.consumes-owner/v1";
        const relationAssertion = {
          relation_instance_id: relationInstanceId,
          relation_owner_candidate_id: relationOwnerCandidateId,
          relation_type_ref: "architecture.consumes",
          source_instance_ref: source.implementation.implementation_instance_id,
          target_instance_ref: target.implementation.implementation_instance_id,
          source_type_ref: source.implementation.architecture_type_ref,
          target_type_ref: target.implementation.architecture_type_ref,
          source_candidate_id: source.implementation.candidate_id,
          target_candidate_id: target.implementation.candidate_id,
          source_endpoint_assertion_ref: { candidate_id: source.implementation.candidate_id, json_pointer: source.implementation.endpoint_assertion_ref.json_pointer },
          target_endpoint_assertion_ref: { candidate_id: target.implementation.candidate_id, json_pointer: target.implementation.endpoint_assertion_ref.json_pointer },
        };
        const owner = addSyntheticImplementation(virtualFiles, "consumes-owner", { extraCandidate: { relation_assertions: [relationAssertion] } });
        const relation = {
          relation_instance_id: relationInstanceId,
          candidate_id: owner.implementation.candidate_id,
          canonical_meta_type_ref: owner.implementation.canonical_meta_type_ref,
          relation_type_ref: "architecture.consumes",
          source_instance_ref: source.implementation.implementation_instance_id,
          target_instance_ref: target.implementation.implementation_instance_id,
          source_type_ref: source.implementation.architecture_type_ref,
          target_type_ref: target.implementation.architecture_type_ref,
          relation_assertion_ref: { ...owner.implementation.candidate_ref, json_pointer: "/relation_assertions/0" },
          evidence_refs: cloneJson(owner.evidenceRefs),
          source_endpoint_binding: { candidate_id: source.implementation.candidate_id, evidence_refs: cloneJson(source.evidenceRefs), endpoint_assertion_ref: cloneJson(source.implementation.endpoint_assertion_ref) },
          target_endpoint_binding: { candidate_id: target.implementation.candidate_id, evidence_refs: cloneJson(target.evidenceRefs), endpoint_assertion_ref: cloneJson(target.implementation.endpoint_assertion_ref) },
          cycle_policy: "acyclic",
          lifecycle_axes: { definition_status: "candidate", evidence_status: "validated-candidate", admission_status: "not-admitted", authority_effect: "none" },
        };
        document.implementation_instances = [owner.implementation, source.implementation, target.implementation];
        document.supporting_instances = [];
        document.relation_instances = [relation];
        finalizeSemanticFixture(document);
        return { document, virtualFiles };
      },
    },
    {
      id: "cycle-permitted-transitions-to",
      build: () => {
        const document = cloneJson(currentOntology);
        const virtualFiles = new Map();
        const ownerCandidateId = "candidate.live-validator.state-machine-owner/v1";
        const stateAssertions = ["a", "b"].map((suffix) => ({ instance_id: `state.live-validator.${suffix}/v1`, architecture_type_ref: "architecture.StateContract" }));
        const transitionAssertions = [
          {
            relation_instance_id: "relation.live-validator.transition-a-b/v1",
            relation_owner_candidate_id: ownerCandidateId,
            relation_type_ref: "architecture.transitions_to",
            source_instance_ref: stateAssertions[0].instance_id,
            target_instance_ref: stateAssertions[1].instance_id,
            source_type_ref: "architecture.StateContract",
            target_type_ref: "architecture.StateContract",
            source_candidate_id: ownerCandidateId,
            target_candidate_id: ownerCandidateId,
            source_endpoint_assertion_ref: { candidate_id: ownerCandidateId, json_pointer: "/supporting_endpoint_assertions/0" },
            target_endpoint_assertion_ref: { candidate_id: ownerCandidateId, json_pointer: "/supporting_endpoint_assertions/1" },
          },
          {
            relation_instance_id: "relation.live-validator.transition-b-a/v1",
            relation_owner_candidate_id: ownerCandidateId,
            relation_type_ref: "architecture.transitions_to",
            source_instance_ref: stateAssertions[1].instance_id,
            target_instance_ref: stateAssertions[0].instance_id,
            source_type_ref: "architecture.StateContract",
            target_type_ref: "architecture.StateContract",
            source_candidate_id: ownerCandidateId,
            target_candidate_id: ownerCandidateId,
            source_endpoint_assertion_ref: { candidate_id: ownerCandidateId, json_pointer: "/supporting_endpoint_assertions/1" },
            target_endpoint_assertion_ref: { candidate_id: ownerCandidateId, json_pointer: "/supporting_endpoint_assertions/0" },
          },
        ];
        const owner = addSyntheticImplementation(virtualFiles, "state-machine-owner", {
          metaTypeRef: "DS-D1.14",
          architectureTypeRef: "architecture.StateMachineImplementation",
          definitionRef: "synthetic.live-validator.state-machine",
          extraCandidate: { supporting_endpoint_assertions: stateAssertions, relation_assertions: transitionAssertions },
        });
        const makeState = (suffix, index) => ({
          supporting_instance_id: `state.live-validator.${suffix}/v1`,
          candidate_id: owner.implementation.candidate_id,
          canonical_meta_type_ref: owner.implementation.canonical_meta_type_ref,
          architecture_type_ref: "architecture.StateContract",
          endpoint_assertion_ref: { ...owner.implementation.candidate_ref, json_pointer: `/supporting_endpoint_assertions/${index}`, assertion_spec: "instance-endpoint-assertion/v1", identity_field: "instance_id", architecture_type_field: "architecture_type_ref" },
          evidence_refs: cloneJson(owner.evidenceRefs),
          lifecycle_axes: { definition_status: "candidate", evidence_status: "validated-candidate", admission_status: "not-admitted", authority_effect: "none" },
        });
        const stateA = makeState("a", 0);
        const stateB = makeState("b", 1);
        const makeTransition = (suffix, index, source, target) => ({
          relation_instance_id: `relation.live-validator.transition-${suffix}/v1`,
          candidate_id: owner.implementation.candidate_id,
          canonical_meta_type_ref: owner.implementation.canonical_meta_type_ref,
          relation_type_ref: "architecture.transitions_to",
          source_instance_ref: source.supporting_instance_id,
          target_instance_ref: target.supporting_instance_id,
          source_type_ref: source.architecture_type_ref,
          target_type_ref: target.architecture_type_ref,
          relation_assertion_ref: { ...owner.implementation.candidate_ref, json_pointer: `/relation_assertions/${index}` },
          evidence_refs: cloneJson(owner.evidenceRefs),
          source_endpoint_binding: { candidate_id: source.candidate_id, evidence_refs: cloneJson(source.evidence_refs), endpoint_assertion_ref: cloneJson(source.endpoint_assertion_ref) },
          target_endpoint_binding: { candidate_id: target.candidate_id, evidence_refs: cloneJson(target.evidence_refs), endpoint_assertion_ref: cloneJson(target.endpoint_assertion_ref) },
          cycle_policy: "cycle-permitted",
          lifecycle_axes: { definition_status: "candidate", evidence_status: "validated-candidate", admission_status: "not-admitted", authority_effect: "none" },
        });
        document.implementation_instances = [owner.implementation];
        document.supporting_instances = [stateA, stateB];
        document.relation_instances = [makeTransition("a-b", 0, stateA, stateB), makeTransition("b-a", 1, stateB, stateA)];
        finalizeSemanticFixture(document);
        return { document, virtualFiles };
      },
    },
  ];
  let semanticPositivesPassed = 0;
  for (const positive of semanticPositiveCases) {
    try {
      const fixture = positive.build();
      const schemaValidation = validateOntologySchema(fixture.document);
      if (!schemaValidation.accepted) admissionFailure("V2_SEMANTIC_POSITIVE_SCHEMA", `${positive.id}:${schemaValidation.diagnostic}`);
      validateAdmissionDocument(fixture.document, fixture);
      validateLiveClaim(fixture.document);
      semanticPositivesPassed += 1;
    } catch (error) {
      errors.push(`v2 semantic positive ${positive.id} failed: ${error.message}`);
    }
  }
  const countAwareClaimCases = [
    {
      id: "empty-zero-population-and-zero-promotions",
      build: () => {
        const document = cloneJson(currentOntology);
        document.implementation_instances = [];
        document.supporting_instances = [];
        document.relation_instances = [];
        finalizeSemanticFixture(document);
        return { document, virtualFiles: new Map() };
      },
    },
    {
      id: "one-implementation",
      build: () => {
        const document = cloneJson(currentOntology);
        document.implementation_instances = document.implementation_instances.slice(0, 1);
        document.supporting_instances = [];
        document.relation_instances = [];
        finalizeSemanticFixture(document);
        return { document, virtualFiles: new Map() };
      },
    },
    {
      id: "many-implementations",
      build: () => {
        const document = cloneJson(currentOntology);
        document.supporting_instances = [];
        document.relation_instances = [];
        finalizeSemanticFixture(document);
        return { document, virtualFiles: new Map() };
      },
    },
    {
      id: "one-supporting-instance",
      build: () => {
        const fixture = semanticPositiveCases.find((candidate) => candidate.id === "cycle-permitted-transitions-to").build();
        fixture.document.supporting_instances = fixture.document.supporting_instances.slice(0, 1);
        fixture.document.relation_instances = [];
        finalizeSemanticFixture(fixture.document);
        return fixture;
      },
    },
    {
      id: "many-supporting-instances",
      build: () => {
        const fixture = semanticPositiveCases.find((candidate) => candidate.id === "cycle-permitted-transitions-to").build();
        fixture.document.relation_instances = [];
        finalizeSemanticFixture(fixture.document);
        return fixture;
      },
    },
    { id: "one-relation", build: () => normalizedPreAdmissionFixture("claim-one-relation") },
    { id: "many-relations", build: () => buildTwoRelationFixture() },
    { id: "one-admitted-implementation-one-promotion", build: () => buildAdmissionSimulation("implementation-instance") },
    {
      id: "many-admitted-implementations-many-promotions",
      build: () => {
        const fixture = normalizedPreAdmissionFixture("claim-many-admitted-implementations");
        appendSyntheticAdmission(fixture, "implementation-instance", fixture.document.implementation_instances[0], "claim-implementation-one");
        appendSyntheticAdmission(fixture, "implementation-instance", fixture.document.implementation_instances[1], "claim-implementation-two");
        return fixture;
      },
    },
    { id: "one-admitted-relation-one-promotion", build: () => buildAdmissionSimulation("relation-instance") },
    {
      id: "many-admitted-relations-many-promotions",
      build: () => {
        const fixture = buildTwoRelationFixture();
        appendSyntheticAdmission(fixture, "relation-instance", fixture.document.relation_instances[0], "claim-relation-one");
        appendSyntheticAdmission(fixture, "relation-instance", fixture.document.relation_instances[1], "claim-relation-two");
        return fixture;
      },
    },
    {
      id: "mixed-implementation-relation-admissions",
      build: () => {
        const fixture = buildTwoRelationFixture();
        appendSyntheticAdmission(fixture, "implementation-instance", fixture.document.implementation_instances[1], "claim-mixed-implementation");
        appendSyntheticAdmission(fixture, "relation-instance", fixture.document.relation_instances[0], "claim-mixed-relation");
        return fixture;
      },
    },
    {
      id: "one-proposed-implementation",
      build: () => {
        const fixture = normalizedPreAdmissionFixture("claim-one-proposed-implementation");
        fixture.document.implementation_instances[0].lifecycle_axes.admission_status = "proposed";
        finalizeSemanticFixture(fixture.document);
        return fixture;
      },
    },
    {
      id: "many-proposed-implementations",
      build: () => {
        const fixture = normalizedPreAdmissionFixture("claim-many-proposed-implementations");
        for (const subject of fixture.document.implementation_instances.slice(0, 2)) subject.lifecycle_axes.admission_status = "proposed";
        finalizeSemanticFixture(fixture.document);
        return fixture;
      },
    },
    {
      id: "one-proposed-relation",
      build: () => {
        const fixture = normalizedPreAdmissionFixture("claim-one-proposed-relation");
        fixture.document.relation_instances[0].lifecycle_axes.admission_status = "proposed";
        finalizeSemanticFixture(fixture.document);
        return fixture;
      },
    },
    {
      id: "many-proposed-relations",
      build: () => {
        const fixture = buildTwoRelationFixture();
        for (const subject of fixture.document.relation_instances) subject.lifecycle_axes.admission_status = "proposed";
        finalizeSemanticFixture(fixture.document);
        return fixture;
      },
    },
    {
      id: "mixed-not-admitted-proposed-admitted",
      build: () => {
        const fixture = buildTwoRelationFixture();
        fixture.document.implementation_instances[1].lifecycle_axes.admission_status = "proposed";
        fixture.document.relation_instances[1].lifecycle_axes.admission_status = "proposed";
        finalizeSemanticFixture(fixture.document);
        appendSyntheticAdmission(fixture, "implementation-instance", fixture.document.implementation_instances[0], "claim-mixed-status-admitted");
        return fixture;
      },
    },
    {
      id: "one-blueprint",
      build: () => {
        const document = cloneJson(currentOntology);
        document.relation_instance_blueprints = document.relation_instance_blueprints.slice(0, 1);
        finalizeSemanticFixture(document, { preserveBlueprints: true });
        return { document, virtualFiles: new Map() };
      },
    },
    {
      id: "many-blueprints",
      build: () => {
        const document = cloneJson(currentOntology);
        finalizeSemanticFixture(document, { preserveBlueprints: true });
        return { document, virtualFiles: new Map() };
      },
    },
  ];
  let countAwareClaimsPassed = 0;
  for (const countCase of countAwareClaimCases) {
    try {
      const fixture = countCase.build();
      const { document } = fixture;
      const schemaValidation = validateOntologySchema(document);
      if (!schemaValidation.accepted) admissionFailure("V2_CLAIM_SCHEMA", `${countCase.id}:${schemaValidation.diagnostic}`);
      validateAdmissionDocument(document, fixture);
      validateLiveClaim(document);
      countAwareClaimsPassed += 1;
    } catch (error) {
      errors.push(`v2 count-aware claim positive ${countCase.id} failed: ${error.message}`);
    }
  }
  const hostileCases = [
    {
      id: "admitted-missing-record",
      kind: "implementation-instance",
      expected: "V2_PROMOTION_REQUIRED",
      mutate: ({ document }) => { document.promotion_records = []; },
    },
    {
      id: "promotion-subject-mismatch",
      kind: "relation-instance",
      expected: "V2_PROMOTION_SUBJECT_BINDING",
      mutate: ({ document }) => { document.promotion_records[0].subject.instance_id = "relation.synthetic.wrong/v1"; },
    },
    {
      id: "promotion-candidate-mismatch",
      kind: "implementation-instance",
      expected: "V2_PROMOTION_CANDIDATE_BINDING",
      mutate: ({ document }) => { document.promotion_records[0].candidate_ref.candidate_id = "candidate.synthetic.wrong/v1"; },
    },
    {
      id: "promotion-evidence-mismatch",
      kind: "relation-instance",
      expected: "V2_PROMOTION_EVIDENCE_BINDING",
      mutate: ({ document }) => { document.promotion_records[0].evidence_refs.reverse(); },
    },
    {
      id: "promotion-preimage-mismatch",
      kind: "implementation-instance",
      expected: "V2_PROMOTION_PREIMAGE_BINDING",
      mutate: ({ document }) => { const source = document.implementation_instances[0].candidate_ref; document.promotion_records[0].rollback.preimage_ref = cloneJson(source); },
    },
    {
      id: "promotion-owner-route-mismatch",
      kind: "relation-instance",
      expected: "V2_PROMOTION_OWNER_BINDING",
      mutate: ({ document }) => { document.promotion_records[0].owner_acceptance.owner_route = "synthetic-wrong-owner"; },
    },
    {
      id: "promotion-scope-mismatch",
      kind: "implementation-instance",
      expected: "V2_PROMOTION_SCOPE_BINDING",
      mutate: ({ document }) => { document.promotion_records[0].owner_acceptance.accepted_scope_sha256 = "0".repeat(64); },
    },
    {
      id: "promotion-decision-rejected",
      kind: "relation-instance",
      expected: "V2_PROMOTION_DECISION_BINDING",
      mutate: ({ document, virtualFiles }) => {
        const record = document.promotion_records[0];
        const decision = JSON.parse(virtualFiles.get(record.owner_acceptance.decision_ref.path).toString("utf8"));
        decision.synthetic_decision.status = "rejected";
        const bytes = Buffer.from(`${JSON.stringify(decision, null, 2)}\n`, "utf8");
        virtualFiles.set(record.owner_acceptance.decision_ref.path, bytes);
        record.owner_acceptance.decision_ref.sha256 = sha256Bytes(bytes);
        record.owner_acceptance.decision_ref.size_bytes = bytes.length;
      },
    },
    {
      id: "promotion-unreferenced-record",
      kind: "implementation-instance",
      expected: "V2_PROMOTION_REFERENCE_COUNT",
      mutate: ({ document }) => { const record = cloneJson(document.promotion_records[0]); record.promotion_id = "promotion.implementation.synthetic.unreferenced/v1"; document.promotion_records.push(record); },
    },
  ];
  let ownerGateHostilesKilled = 0;
  for (const hostile of hostileCases) {
    const sourceSimulation = simulations.find((simulation) => simulation.kind === hostile.kind);
    const subject = {
      document: cloneJson(sourceSimulation.document),
      virtualFiles: new Map(sourceSimulation.virtualFiles),
    };
    hostile.mutate(subject);
    let observed = null;
    try {
      validateAdmissionDocument(subject.document, subject);
    } catch (error) {
      observed = error.code;
    }
    if (observed !== hostile.expected) errors.push(`v2 owner-gate hostile ${hostile.id} observed ${observed ?? "pass"}, expected ${hostile.expected}`);
    else ownerGateHostilesKilled += 1;
  }
  const structuralHostiles = [
    {
      id: "relation-meta-type-owner-mismatch",
      expected: "V2_RELATION_OWNER_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("relation-meta-type-owner-mismatch");
        fixture.document.relation_instances[0].canonical_meta_type_ref = "DS-D1.2";
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "implementation-overwrites-realization-endpoint",
      expected: "V2_ENDPOINT_IDENTITY",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("implementation-overwrites-realization-endpoint");
        const first = fixture.document.implementation_instances[0];
        const second = addSyntheticImplementation(fixture.virtualFiles, "collision-second", { implementationIdOverride: first.language_realizations[0].node_id });
        fixture.document.implementation_instances.push(second.implementation);
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "standalone-projection-source-path-mismatch",
      expected: "V2_PROJECTION_SOURCE_BINDING",
      run: () => {
        const simulation = buildAdmissionSimulation("relation-instance");
        simulation.projection.source_ontology_ref.path = "synthetic/live-validator/admitted/wrong.json";
        validateProjectionBinding(simulation.document, simulation.projection, simulation.admittedOntologyRef);
      },
    },
    {
      id: "cross-family-constructed-by-type-pair",
      expected: "V2_RELATION_TYPE_PAIR_INVALID",
      run: () => {
        const fixture = { document: cloneJson(currentOntology), virtualFiles: new Map() };
        fixture.document.relation_instance_blueprints = [];
        const ownerCandidateId = "candidate.live-validator.cross-family-entity/v1";
        const implementationId = "implementation.live-validator.cross-family-entity/v1";
        const supportingId = "factory.live-validator.value-object/v1";
        const relationId = "relation.live-validator.cross-family-constructed-by/v1";
        const supportingAssertion = { instance_id: supportingId, architecture_type_ref: "architecture.ValueObjectFactoryProvider" };
        const relationAssertion = {
          relation_instance_id: relationId,
          relation_owner_candidate_id: ownerCandidateId,
          relation_type_ref: "architecture.constructed_by",
          source_instance_ref: implementationId,
          target_instance_ref: supportingId,
          source_type_ref: "architecture.EntityImplementation",
          target_type_ref: "architecture.ValueObjectFactoryProvider",
          source_candidate_id: ownerCandidateId,
          target_candidate_id: ownerCandidateId,
          source_endpoint_assertion_ref: { candidate_id: ownerCandidateId, json_pointer: "/implementation_endpoint_assertion" },
          target_endpoint_assertion_ref: { candidate_id: ownerCandidateId, json_pointer: "/supporting_endpoint_assertions/0" },
        };
        const owner = addSyntheticImplementation(fixture.virtualFiles, "cross-family-entity", {
          metaTypeRef: "DS-D1.1",
          architectureTypeRef: "architecture.EntityImplementation",
          definitionRef: "synthetic.live-validator.cross-family-entity",
          extraCandidate: { supporting_endpoint_assertions: [supportingAssertion], relation_assertions: [relationAssertion] },
        });
        const implementation = owner.implementation;
        const supporting = {
          supporting_instance_id: supportingId,
          candidate_id: implementation.candidate_id,
          canonical_meta_type_ref: implementation.canonical_meta_type_ref,
          architecture_type_ref: "architecture.ValueObjectFactoryProvider",
          endpoint_assertion_ref: { ...implementation.candidate_ref, json_pointer: "/supporting_endpoint_assertions/0", assertion_spec: "instance-endpoint-assertion/v1", identity_field: "instance_id", architecture_type_field: "architecture_type_ref" },
          evidence_refs: cloneJson(owner.evidenceRefs),
          lifecycle_axes: { definition_status: "candidate", evidence_status: "validated-candidate", admission_status: "not-admitted", authority_effect: "none" },
        };
        const relation = {
          relation_instance_id: relationId,
          candidate_id: implementation.candidate_id,
          canonical_meta_type_ref: implementation.canonical_meta_type_ref,
          relation_type_ref: "architecture.constructed_by",
          source_instance_ref: implementation.implementation_instance_id,
          target_instance_ref: supporting.supporting_instance_id,
          source_type_ref: "architecture.EntityImplementation",
          target_type_ref: "architecture.ValueObjectFactoryProvider",
          relation_assertion_ref: { ...implementation.candidate_ref, json_pointer: "/relation_assertions/0" },
          evidence_refs: cloneJson(supporting.evidence_refs),
          source_endpoint_binding: { candidate_id: implementation.candidate_id, evidence_refs: cloneJson(owner.evidenceRefs), endpoint_assertion_ref: cloneJson(implementation.endpoint_assertion_ref) },
          target_endpoint_binding: { candidate_id: supporting.candidate_id, evidence_refs: cloneJson(supporting.evidence_refs), endpoint_assertion_ref: cloneJson(supporting.endpoint_assertion_ref) },
          cycle_policy: "not-applicable",
          lifecycle_axes: { definition_status: "candidate", evidence_status: "validated-candidate", admission_status: "not-admitted", authority_effect: "none" },
        };
        fixture.document.implementation_instances = [implementation];
        fixture.document.supporting_instances = [supporting];
        fixture.document.relation_instances = [relation];
        fixture.document.promotion_records = [];
        fixture.document.derived_projection = [derivedImplementationRow(implementation)];
        fixture.document.derived_supporting_projection = [derivedSupportingRow(supporting)];
        fixture.document.derived_relation_projection = [derivedRelationRow(relation)];
        fixture.document.claim_ceiling = claimCeilingFor(fixture.document);
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "two-edge-composed-from-cycle",
      expected: "V2_RELATION_CYCLE",
      run: () => {
        const fixture = { document: cloneJson(currentOntology), virtualFiles: new Map() };
        fixture.document.relation_instance_blueprints = [];
        const candidateId = "candidate.live-validator.cycle-enum/v1";
        const sourceId = "cycle-enum.typescript";
        const targetId = "cycle-enum.python";
        const relationAssertions = [
          {
            relation_instance_id: "relation.live-validator.composed-from-cycle-a/v1",
            relation_owner_candidate_id: candidateId,
            relation_type_ref: "architecture.composed_from",
            source_instance_ref: sourceId,
            target_instance_ref: targetId,
            source_type_ref: "architecture.EnumRepresentationUnit",
            target_type_ref: "architecture.EnumRepresentationUnit",
            source_candidate_id: candidateId,
            target_candidate_id: candidateId,
            source_endpoint_assertion_ref: { candidate_id: candidateId, json_pointer: "/language_endpoint_assertions/0" },
            target_endpoint_assertion_ref: { candidate_id: candidateId, json_pointer: "/language_endpoint_assertions/1" },
          },
          {
            relation_instance_id: "relation.live-validator.composed-from-cycle-b/v1",
            relation_owner_candidate_id: candidateId,
            relation_type_ref: "architecture.composed_from",
            source_instance_ref: targetId,
            target_instance_ref: sourceId,
            source_type_ref: "architecture.EnumRepresentationUnit",
            target_type_ref: "architecture.EnumRepresentationUnit",
            source_candidate_id: candidateId,
            target_candidate_id: candidateId,
            source_endpoint_assertion_ref: { candidate_id: candidateId, json_pointer: "/language_endpoint_assertions/1" },
            target_endpoint_assertion_ref: { candidate_id: candidateId, json_pointer: "/language_endpoint_assertions/0" },
          },
        ];
        const owner = addSyntheticImplementation(fixture.virtualFiles, "cycle-enum", { extraCandidate: { relation_assertions: relationAssertions } });
        const implementation = owner.implementation;
        const evidenceRefs = cloneJson(owner.evidenceRefs);
        const first = {
          relation_instance_id: "relation.live-validator.composed-from-cycle-a/v1",
          candidate_id: implementation.candidate_id,
          canonical_meta_type_ref: implementation.canonical_meta_type_ref,
          relation_type_ref: "architecture.composed_from",
          source_instance_ref: implementation.language_realizations[0].node_id,
          target_instance_ref: implementation.language_realizations[1].node_id,
          source_type_ref: "architecture.EnumRepresentationUnit",
          target_type_ref: "architecture.EnumRepresentationUnit",
          relation_assertion_ref: { ...implementation.candidate_ref, json_pointer: "/relation_assertions/0" },
          evidence_refs: cloneJson(evidenceRefs),
          source_endpoint_binding: { candidate_id: implementation.candidate_id, evidence_refs: cloneJson(evidenceRefs), endpoint_assertion_ref: cloneJson(implementation.language_realizations[0].endpoint_assertion_ref) },
          target_endpoint_binding: { candidate_id: implementation.candidate_id, evidence_refs: cloneJson(evidenceRefs), endpoint_assertion_ref: cloneJson(implementation.language_realizations[1].endpoint_assertion_ref) },
          cycle_policy: "acyclic",
          lifecycle_axes: { definition_status: "candidate", evidence_status: "validated-candidate", admission_status: "not-admitted", authority_effect: "none" },
        };
        const second = {
          ...cloneJson(first),
          relation_instance_id: "relation.live-validator.composed-from-cycle-b/v1",
          source_instance_ref: first.target_instance_ref,
          target_instance_ref: first.source_instance_ref,
          relation_assertion_ref: { ...implementation.candidate_ref, json_pointer: "/relation_assertions/1" },
          source_endpoint_binding: cloneJson(first.target_endpoint_binding),
          target_endpoint_binding: cloneJson(first.source_endpoint_binding),
        };
        fixture.document.implementation_instances = [implementation];
        fixture.document.supporting_instances = [];
        fixture.document.relation_instances = [first, second];
        fixture.document.promotion_records = [];
        fixture.document.derived_projection = [derivedImplementationRow(implementation)];
        fixture.document.derived_supporting_projection = [];
        fixture.document.derived_relation_projection = [derivedRelationRow(first), derivedRelationRow(second)];
        fixture.document.claim_ceiling = claimCeilingFor(fixture.document);
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
  ];
  let structuralHostilesKilled = 0;
  for (const hostile of structuralHostiles) {
    let observed = null;
    try {
      hostile.run();
    } catch (error) {
      observed = error.code;
    }
    if (observed !== hostile.expected) errors.push(`v2 structural hostile ${hostile.id} observed ${observed ?? "pass"}, expected ${hostile.expected}`);
    else structuralHostilesKilled += 1;
  }
  const semanticHostiles = [
    {
      id: "rel-a-source-candidate-mismatch",
      expected: "V2_RELATION_SOURCE_ENDPOINT_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("rel-a-source-candidate-mismatch");
        fixture.document.relation_instances[0].source_endpoint_binding.candidate_id = "candidate.live-validator.wrong/v1";
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "rel-a-target-evidence-mismatch",
      expected: "V2_RELATION_TARGET_ENDPOINT_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("rel-a-target-evidence-mismatch");
        fixture.document.relation_instances[0].target_endpoint_binding.evidence_refs.reverse();
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "rel-a-owner-evidence-mismatch",
      expected: "V2_RELATION_EVIDENCE_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("rel-a-owner-evidence-mismatch");
        fixture.document.relation_instances[0].evidence_refs.reverse();
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "rel-a-promotion-endpoint-scope-mismatch",
      expected: "V2_PROMOTION_SUBJECT_BINDING",
      run: () => {
        const simulation = buildAdmissionSimulation("relation-instance");
        simulation.document.promotion_records[0].subject.source_endpoint_binding.candidate_id = "candidate.live-validator.wrong/v1";
        validateAdmissionDocument(simulation.document, simulation);
      },
    },
    {
      id: "supporting-unknown-type",
      expected: "V2_SUPPORTING_TYPE_BINDING",
      run: () => {
        const fixture = semanticPositiveCases.find((candidate) => candidate.id === "cycle-permitted-transitions-to").build();
        fixture.document.supporting_instances[0].architecture_type_ref = "architecture.NonexistentContract";
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "meta-type-maturity-mismatch",
      expected: "V2_META_TYPE_MATURITY_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("meta-type-maturity-mismatch");
        fixture.document.implementation_instances[0].lifecycle_axes.meta_type_maturity = "retired";
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "concept-definition-status-mismatch",
      expected: "V2_DEFINITION_STATUS_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("concept-definition-status-mismatch");
        fixture.document.implementation_instances[0].lifecycle_axes.definition_status = "retired";
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "relation-definition-status-mismatch",
      expected: "V2_DEFINITION_STATUS_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("relation-definition-status-mismatch");
        fixture.document.relation_instances[0].lifecycle_axes.definition_status = "retired";
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "validated-candidate-receipt-result-mismatch",
      expected: "V2_IMPLEMENTATION_RECEIPT_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("validated-candidate-receipt-result-mismatch");
        const implementation = fixture.document.implementation_instances[2];
        const receipt = JSON.parse(fixture.virtualFiles.get(implementation.projection_receipt_ref.path).toString("utf8"));
        receipt.result = "fail";
        const newRef = addVirtualJson(fixture.virtualFiles, implementation.projection_receipt_ref.path, receipt);
        implementation.projection_receipt_ref = newRef;
        fixture.document.relation_instances[0].target_endpoint_binding.evidence_refs[1] = cloneJson(newRef);
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "validated-candidate-terminal-authority-mismatch",
      expected: "V2_IMPLEMENTATION_TERMINAL_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("validated-candidate-terminal-authority-mismatch");
        const implementation = fixture.document.implementation_instances[1];
        const terminal = JSON.parse(fixture.virtualFiles.get(implementation.terminal_receipt_ref.path).toString("utf8"));
        terminal.authority_effect = "canonical-admission";
        const newRef = addVirtualJson(fixture.virtualFiles, implementation.terminal_receipt_ref.path, terminal);
        implementation.terminal_receipt_ref = newRef;
        fixture.document.relation_instances[0].source_endpoint_binding.evidence_refs[2] = cloneJson(newRef);
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "relation-definition-missing-source-types",
      expected: "V2_RELATION_DEFINITION_INVALID",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("relation-definition-missing-source-types");
        delete fixture.document.relation_definitions[0].source_types;
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "concept-inheritance-cycle",
      expected: "V2_CONCEPT_HIERARCHY_CYCLE",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("concept-inheritance-cycle");
        const root = fixture.document.concept_types.find((concept) => concept.concept_id === "architecture.ArchitectureElement");
        root.extends = "architecture.EnumImplementation";
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "derived-relation-endpoint-binding-drift",
      expected: "V2_DERIVED_RELATION_PROJECTION",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("derived-relation-endpoint-binding-drift");
        fixture.document.derived_relation_projection[0].source_candidate_id = "candidate.live-validator.wrong/v1";
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "stale-count-aware-claim",
      expected: "V2_CLAIM_COUNT_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("stale-count-aware-claim");
        fixture.document.claim_ceiling = fixture.document.claim_ceiling.replace("implementation_instances={total=3", "implementation_instances={total=6");
        validateLiveClaim(fixture.document);
      },
    },
    {
      id: "implementation-endpoint-assertion-pointer-drift",
      expected: "V2_IMPLEMENTATION_ENDPOINT_ASSERTION",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("implementation-endpoint-assertion-pointer-drift");
        fixture.document.implementation_instances[1].endpoint_assertion_ref.json_pointer = "/language_endpoint_assertions/0";
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "relation-assertion-pointer-drift",
      expected: "V2_RELATION_ASSERTION_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("relation-assertion-pointer-drift");
        fixture.document.relation_instances[0].relation_assertion_ref.json_pointer = "/architecture_implementation";
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "stale-predecessor-claim",
      expected: "V2_PROMOTION_PREIMAGE_BINDING",
      run: () => {
        const simulation = buildAdmissionSimulation("implementation-instance");
        const record = simulation.document.promotion_records[0];
        const predecessor = JSON.parse(simulation.virtualFiles.get(record.rollback.preimage_ref.path).toString("utf8"));
        predecessor.claim_ceiling = "stale predecessor claim";
        record.rollback.preimage_ref = addVirtualJson(simulation.virtualFiles, record.rollback.preimage_ref.path, predecessor);
        validateAdmissionDocument(simulation.document, simulation);
      },
    },
    {
      id: "candidate-artifact-authority-escalation-rehashed",
      expected: "V2_IMPLEMENTATION_CANDIDATE_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("candidate-artifact-authority-escalation-rehashed");
        const implementation = fixture.document.implementation_instances[1];
        rebindSyntheticCandidate(fixture, implementation, (candidate) => { candidate.authority_effect = "canonical-admission"; });
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "endpoint-assertion-authority-escalation-rehashed",
      expected: "V2_IMPLEMENTATION_ENDPOINT_ASSERTION",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("endpoint-assertion-authority-escalation-rehashed");
        const implementation = fixture.document.implementation_instances[1];
        rebindSyntheticCandidate(fixture, implementation, (candidate) => { candidate.implementation_endpoint_assertion.authority_effect = "canonical-admission"; });
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "relation-assertion-authority-escalation-rehashed",
      expected: "V2_RELATION_ASSERTION_BINDING",
      run: () => {
        const fixture = normalizedPreAdmissionFixture("relation-assertion-authority-escalation-rehashed");
        const owner = fixture.document.implementation_instances[0];
        rebindSyntheticCandidate(fixture, owner, (candidate) => { candidate.relation_assertions[0].authority_effect = "canonical-admission"; });
        validateAdmissionDocument(fixture.document, fixture);
      },
    },
    {
      id: "blueprint-unknown-candidate",
      expected: "V2_RELATION_BLUEPRINT_INVALID",
      run: () => {
        const document = cloneJson(currentOntology);
        document.relation_instance_blueprints[0].candidate_id = "candidate.unknown/v1";
        validateAdmissionDocument(document);
      },
    },
    {
      id: "blueprint-unknown-relation-type",
      expected: "V2_RELATION_BLUEPRINT_INVALID",
      run: () => {
        const document = cloneJson(currentOntology);
        document.relation_instance_blueprints[0].relation_type_ref = "architecture.unknown_relation";
        validateAdmissionDocument(document);
      },
    },
    {
      id: "blueprint-duplicate-expanded-pair",
      expected: "V2_RELATION_BLUEPRINT_DUPLICATE",
      run: () => {
        const document = cloneJson(currentOntology);
        const duplicate = cloneJson(document.relation_instance_blueprints[0]);
        duplicate.blueprint_id = "relation-blueprint.duplicate/v1";
        document.relation_instance_blueprints.push(duplicate);
        validateAdmissionDocument(document);
      },
    },
    {
      id: "blueprint-ambiguous-relation-ref",
      expected: "V2_RELATION_BLUEPRINT_INVALID",
      run: () => {
        const document = cloneJson(currentOntology);
        document.relation_instance_blueprints[0].relation_type_refs = [document.relation_instance_blueprints[0].relation_type_ref];
        validateAdmissionDocument(document);
      },
    },
    {
      id: "blueprint-missing-relation-ref",
      expected: "V2_RELATION_BLUEPRINT_INVALID",
      run: () => {
        const document = cloneJson(currentOntology);
        delete document.relation_instance_blueprints[0].relation_type_ref;
        validateAdmissionDocument(document);
      },
    },
    {
      id: "blueprint-status-inflation",
      expected: "V2_RELATION_BLUEPRINT_INVALID",
      run: () => {
        const document = cloneJson(currentOntology);
        document.relation_instance_blueprints[0].status = "accepted";
        validateAdmissionDocument(document);
      },
    },
    {
      id: "blueprint-empty-reason",
      expected: "V2_RELATION_BLUEPRINT_INVALID",
      run: () => {
        const document = cloneJson(currentOntology);
        document.relation_instance_blueprints[0].reason = "";
        validateAdmissionDocument(document);
      },
    },
    {
      id: "blueprint-authority-inflation",
      expected: "V2_RELATION_BLUEPRINT_INVALID",
      run: () => {
        const document = cloneJson(currentOntology);
        document.relation_instance_blueprints[0].authority_effect = "canonical-admission";
        validateAdmissionDocument(document);
      },
    },
    {
      id: "blueprint-stale-claim",
      expected: "V2_CLAIM_COUNT_BINDING",
      run: () => {
        const document = cloneJson(currentOntology);
        document.relation_instance_blueprints = document.relation_instance_blueprints.slice(0, 3);
        validateAdmissionDocument(document);
        validateLiveClaim(document);
      },
    },
  ];
  let semanticHostilesKilled = 0;
  for (const hostile of semanticHostiles) {
    let observed = null;
    try {
      hostile.run();
    } catch (error) {
      observed = error.code;
    }
    if (observed !== hostile.expected) errors.push(`v2 semantic hostile ${hostile.id} observed ${observed ?? "pass"}, expected ${hostile.expected}`);
    else semanticHostilesKilled += 1;
  }
  const projectionRootHostiles = [
    { id: "schema-version", mutate: (projection) => { projection.schema_version = "domainspec-meta-type-projection/v3"; } },
    { id: "kind", mutate: (projection) => { projection.projection_policy.kind = "authored-model"; } },
    { id: "status", mutate: (projection) => { projection.status = "accepted"; } },
    { id: "purpose", mutate: (projection) => { projection.purpose = "synthetic drift"; } },
    { id: "source-refs", mutate: (projection) => { projection.source_refs = [...projection.source_refs].reverse(); } },
    { id: "lifecycle-axes", mutate: (projection) => { projection.lifecycle_axes = projection.lifecycle_axes.slice(0, 4); } },
    { id: "projection-policy", mutate: (projection) => { projection.projection_policy.sources = ["implementation_instances"]; } },
    { id: "claim", mutate: (projection) => { projection.claim_ceiling = "synthetic drift"; } },
    { id: "authority", mutate: (projection) => { projection.authority_effect = "canonical-admission"; } },
  ];
  let projectionRootHostilesKilled = 0;
  for (const hostile of projectionRootHostiles) {
    const simulation = buildAdmissionSimulation("implementation-instance");
    hostile.mutate(simulation.projection);
    let observed = null;
    try {
      validateProjectionBinding(simulation.document, simulation.projection, simulation.admittedOntologyRef);
    } catch (error) {
      observed = error.code;
    }
    if (observed !== "V2_PROJECTION_ROOT_BINDING") errors.push(`v2 projection-root hostile ${hostile.id} observed ${observed ?? "pass"}, expected V2_PROJECTION_ROOT_BINDING`);
    else projectionRootHostilesKilled += 1;
  }
  const schemaNegativeCases = [
    {
      id: "relation-definition-missing-direction",
      build: () => {
        const fixture = normalizedPreAdmissionFixture("schema-relation-definition-missing-direction");
        delete fixture.document.relation_definitions[0].direction;
        return fixture.document;
      },
    },
    {
      id: "relation-definition-missing-cycle-policy",
      build: () => {
        const fixture = normalizedPreAdmissionFixture("schema-relation-definition-missing-cycle-policy");
        delete fixture.document.relation_definitions[0].cycle_policy;
        return fixture.document;
      },
    },
    {
      id: "implementation-promotion-subject-relation-contamination",
      build: () => {
        const simulation = buildAdmissionSimulation("implementation-instance");
        simulation.document.promotion_records[0].subject.source_instance_ref = "synthetic.forbidden";
        return simulation.document;
      },
    },
    {
      id: "relation-promotion-subject-missing-endpoint-binding",
      build: () => {
        const simulation = buildAdmissionSimulation("relation-instance");
        delete simulation.document.promotion_records[0].subject.target_endpoint_binding;
        return simulation.document;
      },
    },
    {
      id: "reduced-concept-type-definition",
      build: () => {
        const document = cloneJson(currentOntology);
        document.concept_types[0] = { concept_id: document.concept_types[0].concept_id };
        return document;
      },
    },
    {
      id: "reduced-property-definition",
      build: () => {
        const document = cloneJson(currentOntology);
        document.property_definitions[0] = { property_id: document.property_definitions[0].property_id };
        return document;
      },
    },
    {
      id: "reduced-constraint-operator",
      build: () => {
        const document = cloneJson(currentOntology);
        document.constraint_operators[0] = { operator_id: document.constraint_operators[0].operator_id };
        return document;
      },
    },
    {
      id: "reduced-language-projection",
      build: () => {
        const document = cloneJson(currentOntology);
        document.language_projections[0] = {
          projection_id: document.language_projections[0].projection_id,
          language: document.language_projections[0].language,
        };
        return document;
      },
    },
    {
      id: "promotion-decision-ref-invalid-json-pointer-escape",
      build: () => {
        const simulation = buildAdmissionSimulation("implementation-instance");
        simulation.document.promotion_records[0].owner_acceptance.decision_ref.json_pointer = "/~2invalid";
        return simulation.document;
      },
    },
    {
      id: "relation-assertion-ref-invalid-json-pointer-escape",
      build: () => {
        const simulation = buildAdmissionSimulation("relation-instance");
        simulation.document.promotion_records[0].subject.relation_assertion_ref.json_pointer = "/~2invalid";
        return simulation.document;
      },
    },
  ];
  let schemaNegativesRejected = 0;
  for (const negative of schemaNegativeCases) {
    const validation = validateOntologySchema(negative.build());
    if (validation.accepted) errors.push(`v2 schema negative ${negative.id} was accepted`);
    else schemaNegativesRejected += 1;
  }

  const currentOntologyBytes = readFileSync(ontologyPath);
  const canonicalOntologyTargetPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json";
  const currentOntologyRef = { path: canonicalOntologyTargetPath, sha256: sha256Bytes(currentOntologyBytes), size_bytes: currentOntologyBytes.length };
  try {
    validateProjectionBinding(currentOntology, currentProjection, currentOntologyRef);
    validateLiveClaim(currentOntology);
  } catch (error) {
    errors.push(`v2 live projection or claim validation failed: ${error.message}`);
  }
  const preservedProjection = JSON.parse(JSON.stringify(currentProjection));
  for (const key of ["source_ontology_ref", "historical_projection_ref", "lifecycle_axes", "projection_policy", "derived_projection", "derived_supporting_projection", "derived_relation_projection", "canonical_implementation_state", "claim_ceiling"]) delete preservedProjection[key];
  preservedProjection.mapping_status_values = cloneJson(metaTypeProjection.mapping_status_values);
  preservedProjection.meta_types = cloneJson(metaTypeProjection.meta_types);
  preservedProjection.schema_version = "domainspec-meta-type-projection/v1";
  if (canonicalJson(preservedProjection) !== canonicalJson(metaTypeProjection)) errors.push("v2 projection does not preserve the immutable v1 rows");
  const v2ErrorCount = errors.length - initialErrorCount;
  if (v2ErrorCount === 0) checks.push("self-contained ontology v2 schema, source, instance, relation, PromotionRecord, projection, and authority controls: checked");
  return {
    result: v2ErrorCount === 0 ? "pass" : "fail",
    schema_contracts: "2/2",
    cross_schema_binding_assumptions: bindingViolations.length === 0 ? "pass" : "fail",
    implementation_instances: currentAdmissionState?.implementations ?? currentOntology.implementation_instances.length,
    supporting_instances: currentAdmissionState?.supporting ?? currentOntology.supporting_instances.length,
    relation_instances: currentAdmissionState?.relations ?? currentOntology.relation_instances.length,
    relation_instance_blueprints: currentOntology.relation_instance_blueprints.length,
    promotion_records_present: currentOntology.promotion_records.length,
    positive_admission_simulations: `${positiveAdmissionsPassed}/2`,
    cross_schema_admitted_ontology_integration: `${positiveAdmissionsPassed}/2`,
    owner_gate_hostile_controls: `${ownerGateHostilesKilled}/${hostileCases.length}`,
    structural_regression_controls: `${structuralHostilesKilled}/${structuralHostiles.length}`,
    semantic_positive_controls: `${semanticPositivesPassed}/${semanticPositiveCases.length}`,
    count_aware_claim_positive_controls: `${countAwareClaimsPassed}/${countAwareClaimCases.length}`,
    semantic_hostile_controls: `${semanticHostilesKilled}/${semanticHostiles.length}`,
    projection_root_hostile_controls: `${projectionRootHostilesKilled}/${projectionRootHostiles.length}`,
    standalone_schema_negative_controls: `${schemaNegativesRejected}/${schemaNegativeCases.length}`,
    derived_projections: `${currentOntology.derived_projection.length}/${currentOntology.derived_supporting_projection.length}/${currentOntology.derived_relation_projection.length}`,
    jsonschema: schemaRun.status === 0 ? schemaRun.stdout.trim() : "failed",
    errors_added: v2ErrorCount,
  };
};

const v2Validation = runV2Validation();

const result = {
  verdict: errors.length === 0 ? "pass" : "fail",
  ontology: "ontology.json",
  validation_mode: "preserved-v1-continuity",
  repository_root_source: process.env.DOMAINSPEC_REPOSITORY_ROOT ? "explicit-test-override" : "discovered-upward",
  legacy_preimage_source: overrideArchiveRoot ? "explicit-test-override-matching-bound-refs" : "ontology-and-projection-bound-immutable-refs",
  v1_archive_root: v1ArchiveRoot,
  live_fixture_root: liveExperimentRoot,
  v2_validation: v2Validation,
  profiles: profilePaths.length,
  example_evaluation: actualEvaluation,
  enum_evaluations: actualEnumEvaluations,
  enum_composition: compositionResult,
  checks,
  errors,
};

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
