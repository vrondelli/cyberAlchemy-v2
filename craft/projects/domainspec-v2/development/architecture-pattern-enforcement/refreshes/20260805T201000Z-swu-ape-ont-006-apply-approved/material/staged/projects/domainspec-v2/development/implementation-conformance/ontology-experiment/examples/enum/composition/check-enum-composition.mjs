import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDirectory = dirname(fileURLToPath(import.meta.url));
const loadJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const casesDocument = await loadJson(resolve(fixtureDirectory, "cases.json"));
const expectedPath = resolve(fixtureDirectory, "evaluations.expected.json");
const ontology = await loadJson(resolve(fixtureDirectory, casesDocument.ontology_path));

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stable(nested)]),
    );
  }
  return value;
};
const canonical = (value) => JSON.stringify(stable(value));
const digest = (value) => createHash("sha256").update(canonical(value)).digest("hex");
const nonEmptyString = (value) => typeof value === "string" && value.length > 0;
const unique = (values) => new Set(values).size === values.length;
const sameSet = (left, right) => {
  const normalizedLeft = [...new Set(left)].sort();
  const normalizedRight = [...new Set(right)].sort();
  return canonical(normalizedLeft) === canonical(normalizedRight);
};

class CompositionError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
const block = (condition, code) => {
  if (condition) throw new CompositionError(code);
};
const validObservedProvenance = (provenance) =>
  provenance?.kind === "observed"
  && nonEmptyString(provenance.owner_route)
  && Array.isArray(provenance.raw_refs)
  && provenance.raw_refs.length > 0
  && provenance.raw_refs.every(nonEmptyString);

const validateOntologyContract = () => {
  const concept = ontology.concept_types.find(({ concept_id }) =>
    concept_id === "architecture.EnumRepresentationUnit");
  block(concept === undefined, "ONTOLOGY_ENUM_REPRESENTATION_UNIT_MISSING");
  block(concept.canonical_meta_type_ref !== null, "ONTOLOGY_REPRESENTATION_UNIT_CANONICAL_COLLAPSE");
  block(concept.extends !== "architecture.ArchitectureElement", "ONTOLOGY_REPRESENTATION_UNIT_PARENT_INVALID");

  const relation = ontology.relation_definitions.find(({ relation_id }) =>
    relation_id === "architecture.composed_from");
  block(relation === undefined, "ONTOLOGY_COMPOSED_FROM_MISSING");
  block(relation.direction !== "directed", "ONTOLOGY_COMPOSED_FROM_DIRECTION_INVALID");
  block(relation.cycle_policy !== "acyclic", "ONTOLOGY_COMPOSED_FROM_CYCLE_POLICY_INVALID");
  block(relation.authority_effect !== "none", "ONTOLOGY_COMPOSED_FROM_AUTHORITY_INVALID");
  block(relation.value_effect !== "value-constraining", "ONTOLOGY_COMPOSED_FROM_VALUE_EFFECT_INVALID");

  for (const propertyId of ["enum.implemented_members", "enum.implemented_values", "enum.composition_kind"]) {
    block(
      !ontology.property_definitions.some(({ property_id }) => property_id === propertyId),
      "ONTOLOGY_ENUM_COMPOSITION_PROPERTY_MISSING",
    );
  }
};

const evaluateCase = (testCase) => {
  try {
    const subjectIds = testCase.subjects.map(({ subject_ref }) => subject_ref);
    block(!unique(subjectIds), "ENUM_COMPOSITION_DUPLICATE_SUBJECT");
    const subjectById = new Map(testCase.subjects.map((subject) => [subject.subject_ref, subject]));
    const root = subjectById.get(testCase.root_ref);
    block(root === undefined, "ENUM_COMPOSITION_ROOT_UNRESOLVED");
    block(root.ontology_type !== "architecture.EnumImplementation", "ENUM_COMPOSITION_ROOT_TYPE_INVALID");
    for (const subject of testCase.subjects) {
      block(
        !["architecture.EnumImplementation", "architecture.EnumRepresentationUnit"].includes(subject.ontology_type),
        "ENUM_COMPOSITION_SUBJECT_TYPE_INVALID",
      );
      block(
        !["direct", "composed"].includes(subject.properties?.["enum.composition_kind"]),
        "ENUM_COMPOSITION_KIND_INVALID",
      );
    }

    const relationIds = testCase.relations.map(({ relation_id }) => relation_id);
    block(!unique(relationIds), "ENUM_COMPOSITION_DUPLICATE_RELATION");
    const adjacency = new Map(subjectIds.map((subjectId) => [subjectId, []]));
    for (const relation of testCase.relations) {
      block(relation.relation_type !== "architecture.composed_from", "ENUM_COMPOSITION_RELATION_TYPE_INVALID");
      block(!subjectById.has(relation.source_ref) || !subjectById.has(relation.target_ref), "ENUM_COMPOSITION_COMPONENT_UNRESOLVED");
      block(
        subjectById.get(relation.target_ref).ontology_type !== "architecture.EnumRepresentationUnit",
        "ENUM_COMPOSITION_TARGET_TYPE_INVALID",
      );
      block(!validObservedProvenance(relation.provenance), "ENUM_COMPOSITION_RELATION_PROVENANCE_INVALID");
      adjacency.get(relation.source_ref).push(relation.target_ref);
    }

    const cycleState = new Map();
    const findCycle = (subjectRef) => {
      const state = cycleState.get(subjectRef);
      block(state === "visiting", "ENUM_COMPOSITION_CYCLE");
      if (state === "visited") return;
      cycleState.set(subjectRef, "visiting");
      for (const targetRef of adjacency.get(subjectRef)) findCycle(targetRef);
      cycleState.set(subjectRef, "visited");
    };
    findCycle(testCase.root_ref);

    const contributionCount = new Map();
    const visit = (subjectRef) => {
      const count = (contributionCount.get(subjectRef) ?? 0) + 1;
      contributionCount.set(subjectRef, count);
      block(count > 1, "ENUM_COMPOSITION_REPEATED_CONTRIBUTION");
      for (const targetRef of adjacency.get(subjectRef)) visit(targetRef);
    };
    visit(testCase.root_ref);
    block(contributionCount.size !== subjectById.size, "ENUM_COMPOSITION_UNREACHABLE_SUBJECT");

    const leafRefs = new Set();
    for (const [subjectRef, subject] of subjectById) {
      const childCount = adjacency.get(subjectRef).length;
      const expectedKind = childCount === 0 ? "direct" : "composed";
      block(subject.properties["enum.composition_kind"] !== expectedKind, "ENUM_COMPOSITION_KIND_EDGE_MISMATCH");
      if (childCount === 0) leafRefs.add(subjectRef);
    }

    const factIds = testCase.facts.map(({ fact_id }) => fact_id);
    block(!unique(factIds), "ENUM_COMPOSITION_DUPLICATE_FACT");
    const memberFacts = testCase.facts.filter(({ predicate_ref }) =>
      predicate_ref === "enum.implemented_members");
    for (const fact of memberFacts) {
      block(!leafRefs.has(fact.subject_ref), "ENUM_COMPOSITION_MEMBER_NOT_ON_LEAF");
      block(!validObservedProvenance(fact.provenance), "ENUM_COMPOSITION_MEMBER_PROVENANCE_INVALID");
      block(
        !nonEmptyString(fact.value?.key) || !nonEmptyString(fact.value?.value),
        "ENUM_COMPOSITION_MEMBER_INVALID",
      );
    }
    for (const leafRef of leafRefs) {
      block(!memberFacts.some(({ subject_ref }) => subject_ref === leafRef), "ENUM_COMPOSITION_LEAF_MEMBER_MISSING");
    }

    const duplicateKey = memberFacts.some((fact, index) =>
      memberFacts.findIndex(({ value }) => value.key === fact.value.key) !== index);
    block(duplicateKey, "ENUM_COMPOSITION_DUPLICATE_KEY");
    const duplicateValue = memberFacts.some((fact, index) =>
      memberFacts.findIndex(({ value }) => value.value === fact.value.value) !== index);
    block(duplicateValue, "ENUM_COMPOSITION_DUPLICATE_VALUE");

    const derivedFacts = testCase.facts.filter(({ predicate_ref, subject_ref }) =>
      predicate_ref === "enum.implemented_values" && subject_ref === testCase.root_ref);
    block(derivedFacts.length !== 1, "ENUM_COMPOSITION_DERIVED_VALUE_FACT_REQUIRED");
    const derived = derivedFacts[0];
    const derivation = derived.provenance?.derivation_ref;
    block(
      derived.provenance?.kind !== "derived"
        || !nonEmptyString(derived.provenance.owner_route)
        || !Array.isArray(derivation?.input_fact_ids),
      "ENUM_COMPOSITION_DERIVATION_PROVENANCE_INVALID",
    );
    block(
      !sameSet(derivation.input_fact_ids, memberFacts.map(({ fact_id }) => fact_id)),
      "ENUM_COMPOSITION_DERIVATION_INCOMPLETE",
    );

    const normalizedMembers = memberFacts
      .map(({ fact_id, subject_ref, value }) => ({
        key: value.key,
        value: value.value,
        origin_subject_ref: subject_ref,
        input_fact_id: fact_id,
      }))
      .sort((left, right) =>
        left.key.localeCompare(right.key)
        || left.value.localeCompare(right.value)
        || left.origin_subject_ref.localeCompare(right.origin_subject_ref));
    const implementedValues = normalizedMembers.map(({ value }) => value);
    block(canonical(derived.value) !== canonical(implementedValues), "ENUM_COMPOSITION_DERIVED_VALUE_MISMATCH");
    const semanticProjection = {
      implemented_values: implementedValues,
      member_origins: normalizedMembers,
    };
    return {
      case_id: testCase.case_id,
      verdict: "pass",
      diagnostic: null,
      ...semanticProjection,
      semantic_sha256: digest(semanticProjection),
    };
  } catch (error) {
    return {
      case_id: testCase.case_id,
      verdict: "fail",
      diagnostic: error.code ?? "ENUM_COMPOSITION_INTERNAL_ERROR",
      implemented_values: null,
      member_origins: null,
      semantic_sha256: null,
    };
  }
};

validateOntologyContract();
if (process.versions.node !== casesDocument.runner_contract.runtime_version) {
  throw new Error(`runtime drift: expected ${casesDocument.runner_contract.runtime_version}, got ${process.versions.node}`);
}

const evaluations = casesDocument.cases.map(evaluateCase);
const pair = casesDocument.runner_contract.order_invariance_pair
  .map((caseId) => evaluations.find(({ case_id }) => case_id === caseId));
const actualDocument = {
  schema_version: "domainspec-enum-composition-evaluations/v1",
  cases: evaluations,
  order_invariance_equal:
    pair.every(({ verdict }) => verdict === "pass")
    && pair[0].semantic_sha256 === pair[1].semantic_sha256,
  authority_effect: "none",
};
block(!actualDocument.order_invariance_equal, "ENUM_COMPOSITION_ORDER_INVARIANCE_FAILED");

if (!process.argv.includes("--actual-only")) {
  const expected = await loadJson(expectedPath);
  if (canonical(actualDocument) !== canonical(expected)) {
    process.stderr.write("Enum composition evaluations did not match the exact fixture.\n");
    process.stderr.write(`${JSON.stringify(actualDocument, null, 2)}\n`);
    process.exit(1);
  }
}

process.stdout.write(`${JSON.stringify(actualDocument, null, 2)}\n`);
