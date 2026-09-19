#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = process.env.DOMAINSPEC_REPOSITORY_ROOT
  ? resolve(process.env.DOMAINSPEC_REPOSITORY_ROOT)
  : resolve(experimentRoot, "../../../../..");
const readJson = (relativePath) => JSON.parse(readFileSync(resolve(experimentRoot, relativePath), "utf8"));
const ontology = readJson("ontology.json");
const metaTypeProjection = readJson("domain-meta-types.projection.json");
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

for (const source of ontology.source_refs) {
  const absolutePath = resolve(repositoryRoot, source.path);
  if (!absolutePath.startsWith(`${repositoryRoot}/`) || !existsSync(absolutePath)) {
    errors.push(`missing or escaping source: ${source.path}`);
    continue;
  }
  const actual = createHash("sha256").update(readFileSync(absolutePath)).digest("hex");
  if (actual !== source.sha256) errors.push(`stale source digest: ${source.source_id}`);
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
  while (current) {
    if (current.concept_id === expectedType) return true;
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
  if (relation.value_effect === "value-constraining" && relation.cycle_policy !== "acyclic") errors.push(`value-constraining relation ${relation.relation_id} must be acyclic in this experiment`);
}
checks.push("property applicability and relation contracts: checked");

const resolveProfile = (path, stack = []) => {
  if (stack.includes(path)) throw new Error(`profile extension cycle: ${[...stack, path].join(" -> ")}`);
  const profile = profiles.get(path);
  if (!profile) throw new Error(`unknown profile: ${path}`);
  const constraints = [];
  for (const parentRef of profile.extends ?? []) {
    const parentPath = resolve(experimentRoot, dirname(path), parentRef).replace(`${experimentRoot}/`, "");
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

const provenanceRunnerPath = resolve(experimentRoot, "examples/enum/provenance/check-observation-projection.mjs");
const provenanceRun = spawnSync(process.execPath, [provenanceRunnerPath], {
  cwd: experimentRoot,
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

if (ontology.authority_effect !== "none" || actualEvaluation.authority_effect !== "none") errors.push("ontology and evaluation must have authority_effect none");
checks.push("authority non-collapse controls: checked");

const result = {
  verdict: errors.length === 0 ? "pass" : "fail",
  ontology: "ontology.json",
  profiles: profilePaths.length,
  example_evaluation: actualEvaluation,
  enum_evaluations: actualEnumEvaluations,
  checks,
  errors,
};

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
