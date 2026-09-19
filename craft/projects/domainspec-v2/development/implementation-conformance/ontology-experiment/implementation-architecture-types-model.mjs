const REQUIRED_ROOT_IDS = Object.freeze([
  "architecture.ArchitectureElement",
  "architecture.DomainConceptImplementation",
]);

const SUPPORTING_TYPE_IDS = Object.freeze([
  "architecture.EnumRepresentationUnit",
  "architecture.AdapterImplementation",
]);

const INCLUDED_RELATION_IDS = Object.freeze([
  "architecture.composed_from",
  "architecture.depends_on",
  "architecture.guards",
  "architecture.exposes",
  "architecture.implements_interface",
]);

const clone = (value) => JSON.parse(JSON.stringify(value));

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

const projectionError = (diagnostics) => {
  const error = new Error(`Implementation architecture type projection rejected with ${diagnostics.length} diagnostic(s).`);
  error.name = "ImplementationArchitectureTypesProjectionError";
  error.code = "IAT_PROJECTION_INVALID";
  error.diagnostics = diagnostics.map((diagnostic) => Object.freeze({...diagnostic}));
  return error;
};

const sourceRecord = (entry, name, diagnostics) => {
  if (!entry || typeof entry.source_ref !== "string" || !entry.value || typeof entry.value !== "object") {
    diagnostics.push({code: "invalid-source-record", source: name, message: `${name} requires source_ref and value.`});
    return {source_ref: `missing:${name}`, value: {}};
  }
  return entry;
};

export const BuildImplementationArchitectureTypesProjection = (input) => {
  const diagnostics = [];
  const ontologySource = sourceRecord(input?.ontology, "ontology", diagnostics);
  const metaTypesSource = sourceRecord(input?.meta_types, "meta_types", diagnostics);
  if (diagnostics.length) throw projectionError(diagnostics);

  const ontology = ontologySource.value;
  const metaTypes = metaTypesSource.value;
  if (ontology.authority_effect !== "none" || metaTypes.authority_effect !== "none") {
    diagnostics.push({code: "authority-inflation", message: "The minimal view accepts authority_effect none only."});
  }

  const concepts = ontology.concept_types ?? [];
  const conceptById = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const roots = REQUIRED_ROOT_IDS.map((conceptId) => conceptById.get(conceptId));
  for (const [index, root] of roots.entries()) if (!root) diagnostics.push({code: "missing-root-type", concept_id: REQUIRED_ROOT_IDS[index], message: `Missing required root ${REQUIRED_ROOT_IDS[index]}.`});

  const mappedMetaTypes = (metaTypes.meta_types ?? [])
    .filter((metaType) => metaType.mapping_status === "candidate-mapped")
    .sort((left, right) => left.meta_type_id.localeCompare(right.meta_type_id, undefined, {numeric: true}));
  const mappings = mappedMetaTypes.map((metaType) => {
    const concept = conceptById.get(metaType.architecture_type_id);
    if (!concept) diagnostics.push({code: "missing-mapped-type", meta_type_id: metaType.meta_type_id, architecture_type_id: metaType.architecture_type_id, message: `Mapped architecture type ${metaType.architecture_type_id} is missing.`});
    else if (concept.canonical_meta_type_ref !== metaType.meta_type_id || concept.canonical_mapping_status !== "candidate-alignment") {
      diagnostics.push({code: "reciprocal-mapping-mismatch", meta_type_id: metaType.meta_type_id, architecture_type_id: concept.concept_id, message: `Mapping ${metaType.meta_type_id} is not reciprocal.`});
    }
    return {
      mapping_id: `${metaType.meta_type_id}:${metaType.architecture_type_id}`,
      mapping_status: metaType.mapping_status,
      authority_effect: "none",
      meta_type: {
        id: metaType.meta_type_id,
        label: metaType.label,
        maturity: metaType.maturity,
        plain_language: metaType.plain_language,
        source_ref: `${metaTypesSource.source_ref}#meta_type(${metaType.meta_type_id})`,
      },
      architecture_type: concept ? {
        id: concept.concept_id,
        label: concept.label,
        status: concept.candidate_status,
        owner_route: concept.owner_route,
        extends: concept.extends,
        forbidden_collapse: concept.forbidden_collapse,
        source_ref: `${ontologySource.source_ref}#concept_type(${concept.concept_id})`,
      } : null,
    };
  });

  const supportingTypes = SUPPORTING_TYPE_IDS.map((conceptId) => conceptById.get(conceptId));
  for (const [index, support] of supportingTypes.entries()) if (!support) diagnostics.push({code: "missing-supporting-type", concept_id: SUPPORTING_TYPE_IDS[index], message: `Missing supporting type ${SUPPORTING_TYPE_IDS[index]}.`});
  const visibleTypeIds = new Set([
    ...REQUIRED_ROOT_IDS,
    ...mappings.map((mapping) => mapping.architecture_type?.id).filter(Boolean),
    ...SUPPORTING_TYPE_IDS,
  ]);

  const relationsById = new Map((ontology.relation_definitions ?? []).map((relation) => [relation.relation_id, relation]));
  const relations = INCLUDED_RELATION_IDS.map((relationId) => relationsById.get(relationId));
  for (const [index, relation] of relations.entries()) if (!relation) diagnostics.push({code: "missing-relation", relation_id: INCLUDED_RELATION_IDS[index], message: `Missing architecture relation ${INCLUDED_RELATION_IDS[index]}.`});

  if (diagnostics.length) throw projectionError(diagnostics);

  const simplifyType = (concept, role) => ({
    id: concept.concept_id,
    label: concept.label,
    role,
    abstract: concept.abstract ?? false,
    status: concept.candidate_status,
    concept_role: concept.concept_role,
    extends: concept.extends,
    owner_route: concept.owner_route,
    forbidden_collapse: concept.forbidden_collapse,
    source_ref: `${ontologySource.source_ref}#concept_type(${concept.concept_id})`,
    authority_effect: "none",
  });

  const hierarchy = [
    ...roots.map((concept) => simplifyType(concept, "abstract-root")),
    ...mappings.map((mapping) => simplifyType(conceptById.get(mapping.architecture_type.id), "domainspec-realization")),
    ...supportingTypes.map((concept) => simplifyType(concept, "supporting-architecture-role")),
  ];

  const simplifiedRelations = relations.map((relation) => ({
    id: relation.relation_id,
    label: relation.relation_id.replace("architecture.", "").replaceAll("_", " "),
    direction: relation.direction,
    visible_source_types: relation.source_types.filter((typeId) => visibleTypeIds.has(typeId)),
    visible_target_types: relation.target_types.filter((typeId) => visibleTypeIds.has(typeId)),
    cycle_policy: relation.cycle_policy,
    owner_route: relation.owner_route,
    forbidden_collapse: relation.forbidden_collapse,
    source_ref: `${ontologySource.source_ref}#relation(${relation.relation_id})`,
    authority_effect: relation.authority_effect,
  }));

  return deepFreeze({
    projection_id: "implementation-architecture-types:simple-v1",
    verification_status: "prototype-unverified",
    authority_effect: "none",
    source_refs: {
      ontology: ontologySource.source_ref,
      meta_types: metaTypesSource.source_ref,
    },
    counts: {
      roots: roots.length,
      reciprocal_mappings: mappings.length,
      supporting_types: supportingTypes.length,
      visible_types: hierarchy.length,
      relations: simplifiedRelations.length,
    },
    mappings: clone(mappings),
    hierarchy,
    supporting_types: supportingTypes.map((concept) => simplifyType(concept, "supporting-architecture-role")),
    relations: simplifiedRelations,
    omitted_families: ["profiles", "constraints", "properties", "observed facts", "findings", "other lifecycle scenes", "promotion state"],
    proof_boundary: "This view projects candidate implementation architecture types and reciprocal alignments only. It does not admit a DomainSpec type, prove source conformance, or grant promotion, release, deployment, or production authority.",
  });
};
