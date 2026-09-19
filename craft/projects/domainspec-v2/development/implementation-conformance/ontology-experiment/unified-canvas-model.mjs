const FAMILY_BANDS = Object.freeze({
  "meta-type": "meaning",
  "architecture-type": "realization",
  profile: "expectation",
  constraint: "expectation",
  property: "expectation",
  "fact-element": "observation",
  "fact-relation": "observation",
  finding: "explanation",
  "scene-artifact": null,
});
const BAND_VALUES = new Set(["meaning", "realization", "expectation", "observation", "explanation"]);

const clone = (value) => JSON.parse(JSON.stringify(value));
const tail = (value) => String(value).split(/[./]/).at(-1);
const humanize = (value) => tail(value).replaceAll("_", " ").replaceAll("-", " ");
const formatValue = (value) => Array.isArray(value) ? value.join(", ") : JSON.stringify(value);
const basename = (value) => String(value).split("/").at(-1);

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

const projectionError = (diagnostics) => {
  const error = new Error(`Unified canvas projection rejected with ${diagnostics.length} diagnostic(s).`);
  error.name = "UnifiedCanvasProjectionError";
  error.code = "UOC_PROJECTION_INVALID";
  error.diagnostics = diagnostics.map((item) => Object.freeze({...item}));
  return error;
};

const sourceRecord = (entry, name, diagnostics) => {
  if (!entry || typeof entry.source_ref !== "string" || !entry.value || typeof entry.value !== "object") {
    diagnostics.push({code: "invalid-source-record", source: name, message: `${name} requires source_ref and value.`});
    return {source_ref: `missing:${name}`, value: {}};
  }
  return entry;
};

const addUnique = (collection, seen, item, diagnostics, kind) => {
  if (seen.has(item.id)) {
    diagnostics.push({code: `duplicate-${kind}-id`, id: item.id, message: `Duplicate ${kind} ID ${item.id}.`});
    return;
  }
  seen.add(item.id);
  collection.push(item);
};

const nodePlainLanguage = (family, raw, ownerProfileId = null) => {
  if (family === "meta-type") return raw.plain_language;
  if (family === "architecture-type") return `${raw.label} is a candidate ${raw.concept_role}; ${raw.forbidden_collapse}`;
  if (family === "profile") return raw.language === "portable"
    ? "Portable expectations shared by every supplied language profile."
    : `Candidate structural expectations for ${raw.language} source code.`;
  if (family === "constraint") {
    const scope = raw.applies_to ?? [...(raw.source_types ?? []), ...(raw.target_types ?? [])];
    return `${ownerProfileId} requires ${raw.property_id} to ${humanize(raw.operator)} ${formatValue(raw.expected)} for ${scope.join(", ")}.`;
  }
  if (family === "property") return raw.semantics;
  if (family === "fact-element") return `Supplied TypeScript example classified as ${tail(raw.type)}; no source adapter ran in this canvas.`;
  if (family === "fact-relation") return `Supplied TypeScript relation from ${tail(raw.from)} to ${tail(raw.to)}.`;
  if (family === "finding") return `Expected ${formatValue(raw.expected)}; observed ${formatValue(raw.actual)} under the supplied TypeScript evaluation.`;
  if (family === "scene-artifact") return raw.plain_language;
  return "Presentation record.";
};

export const BuildUnifiedCanvasProjection = (input) => {
  const diagnostics = [];
  const metaTypesSource = sourceRecord(input?.meta_types, "meta_types", diagnostics);
  const ontologySource = sourceRecord(input?.ontology, "ontology", diagnostics);
  const factsSource = sourceRecord(input?.facts, "facts", diagnostics);
  const evaluationSource = sourceRecord(input?.evaluation, "evaluation", diagnostics);
  const sceneSource = input?.scene ? sourceRecord(input.scene, "scene", diagnostics) : null;
  const profileSources = Array.isArray(input?.profiles)
    ? input.profiles.map((entry, index) => sourceRecord(entry, `profiles[${index}]`, diagnostics))
    : [];
  if (profileSources.length === 0) diagnostics.push({code: "missing-profiles", message: "At least one profile source is required."});
  if (diagnostics.length > 0) throw projectionError(diagnostics);

  const metaTypes = metaTypesSource.value;
  const ontology = ontologySource.value;
  const facts = factsSource.value;
  const evaluation = evaluationSource.value;
  const scene = sceneSource?.value ?? null;
  const profiles = profileSources.map((entry) => entry.value);
  const metaById = new Map((metaTypes.meta_types ?? []).map((item) => [item.meta_type_id, item]));
  const conceptById = new Map((ontology.concept_types ?? []).map((item) => [item.concept_id, item]));
  const propertyById = new Map((ontology.property_definitions ?? []).map((item) => [item.property_id, item]));
  const relationById = new Map((ontology.relation_definitions ?? []).map((item) => [item.relation_id, item]));
  const projectionById = new Map((ontology.language_projections ?? []).map((item) => [item.projection_id, item]));
  const profileById = new Map(profiles.map((item) => [item.profile_id, item]));
  const profileSourceById = new Map(profileSources.map((entry) => [entry.value.profile_id, entry]));
  const profileByFilename = new Map(profileSources.map((entry) => [basename(entry.source_ref), entry.value]));
  const constraintOwnerById = new Map();
  const nodes = [];
  const edges = [];
  const gaps = [];
  const nodeIds = new Set();
  const edgeIds = new Set();

  const addNode = (family, sourceId, sourceRef, label, raw, statuses = {}, context = {}) => {
    const prefixes = {
      "meta-type": "meta",
      "architecture-type": "type",
      profile: "profile",
      constraint: "constraint",
      property: "property",
      "fact-element": "fact",
      "fact-relation": "fact-relation",
      finding: "finding",
      "scene-artifact": "scene",
    };
    const id = family === "finding" ? sourceId : `${prefixes[family]}:${sourceId}`;
    addUnique(nodes, nodeIds, {
      id,
      family,
      band: context.bandOverride ?? FAMILY_BANDS[family],
      source_id: sourceId,
      source_ref: sourceRef,
      label,
      plain_language: nodePlainLanguage(family, raw, context.ownerProfileId),
      statuses,
      fixture_projection_id: context.fixtureProjectionId ?? null,
      fixture_profile_id: context.fixtureProfileId ?? null,
      evaluation_profile_id: context.evaluationProfileId ?? null,
      constraint_origin_profile_id: context.constraintOriginProfileId ?? null,
      authority_effect: raw.authority_effect ?? context.authorityEffect ?? "none",
      raw: clone(raw),
    }, diagnostics, "node");
    return id;
  };

  const addEdge = (kind, from, to, derivation, sourceKind = "presentation-bridge", raw = null) => {
    const id = `edge:${kind}:${from}->${to}`;
    addUnique(edges, edgeIds, {
      id,
      kind,
      from,
      to,
      derivation,
      source_kind: sourceKind,
      semantic_posture: "presentation-only; authority_effect none",
      visual_class: kind,
      raw: raw ? clone(raw) : null,
    }, diagnostics, "edge");
  };

  for (const [index, metaType] of (metaTypes.meta_types ?? []).entries()) {
    addNode(
      "meta-type",
      metaType.meta_type_id,
      `${metaTypesSource.source_ref}#/meta_types/${index}`,
      metaType.label,
      metaType,
      {maturity: metaType.maturity, mapping_status: metaType.mapping_status},
      {authorityEffect: metaTypes.authority_effect},
    );
  }

  for (const [index, concept] of (ontology.concept_types ?? []).entries()) {
    addNode(
      "architecture-type",
      concept.concept_id,
      `${ontologySource.source_ref}#/concept_types/${index}`,
      concept.label,
      concept,
      {candidate_status: concept.candidate_status, canonical_mapping_status: concept.canonical_mapping_status ?? null},
      {authorityEffect: ontology.authority_effect},
    );
  }

  for (const [index, profile] of profiles.entries()) {
    const source = profileSources[index];
    addNode(
      "profile",
      profile.profile_id,
      `${source.source_ref}#`,
      profile.language === "portable" ? "Portable domain" : `${humanize(profile.language)} strict`,
      profile,
      {status: profile.status, language: profile.language},
      {authorityEffect: profile.authority_effect},
    );
    for (const [constraintIndex, constraint] of (profile.constraints ?? []).entries()) {
      if (constraintOwnerById.has(constraint.constraint_id)) {
        diagnostics.push({code: "duplicate-constraint-id", id: constraint.constraint_id, message: `Constraint ${constraint.constraint_id} has multiple owners.`});
      } else {
        constraintOwnerById.set(constraint.constraint_id, profile.profile_id);
      }
      addNode(
        "constraint",
        constraint.constraint_id,
        `${source.source_ref}#/constraints/${constraintIndex}`,
        humanize(constraint.constraint_id),
        constraint,
        {severity: constraint.severity, owner_profile_id: profile.profile_id},
        {ownerProfileId: profile.profile_id, authorityEffect: profile.authority_effect},
      );
    }
  }

  for (const [index, property] of (ontology.property_definitions ?? []).entries()) {
    addNode(
      "property",
      property.property_id,
      `${ontologySource.source_ref}#/property_definitions/${index}`,
      property.label,
      property,
      {value_type: property.value_type?.kind ?? null},
      {authorityEffect: ontology.authority_effect},
    );
  }

  const sceneSteps = [];
  if (scene) {
    if (scene.schema_version !== "domainspec-lifecycle-scene/v1") diagnostics.push({code: "invalid-scene-schema", message: "Scene requires domainspec-lifecycle-scene/v1."});
    if (typeof scene.scene_id !== "string" || !scene.scene_id) diagnostics.push({code: "invalid-scene-id", message: "Scene requires scene_id."});
    if (scene.authority_effect !== "none") diagnostics.push({code: "invalid-scene-authority", message: "Explanatory scenes require authority_effect none."});
    const stepIds = new Set();
    const stepOrders = new Set();
    for (const step of scene.steps ?? []) {
      if (typeof step.step_id !== "string" || !step.step_id || stepIds.has(step.step_id)) diagnostics.push({code: "duplicate-scene-step", id: step.step_id ?? null, message: "Scene step IDs must be present and unique."});
      else stepIds.add(step.step_id);
      if (!Number.isInteger(step.order) || step.order < 1 || stepOrders.has(step.order)) diagnostics.push({code: "duplicate-scene-step-order", order: step.order ?? null, message: "Scene step orders must be positive unique integers."});
      else stepOrders.add(step.order);
      sceneSteps.push(clone(step));
    }
    sceneSteps.sort((left, right) => left.order - right.order || left.step_id.localeCompare(right.step_id));
    const stepOrdersByNode = new Map();
    for (const step of sceneSteps) {
      for (const nodeId of step.highlight_node_ids ?? []) stepOrdersByNode.set(nodeId, [...(stepOrdersByNode.get(nodeId) ?? []), step.order]);
    }
    for (const [index, artifact] of (scene.nodes ?? []).entries()) {
      const graphNodeId = `scene:${artifact.node_id}`;
      if (!BAND_VALUES.has(artifact.band)) diagnostics.push({code: "invalid-scene-band", id: artifact.node_id, band: artifact.band, message: `Scene artifact ${artifact.node_id} has invalid band ${artifact.band}.`});
      if (typeof artifact.plain_language !== "string" || !artifact.plain_language) diagnostics.push({code: "invalid-scene-plain-language", id: artifact.node_id, message: `Scene artifact ${artifact.node_id} requires plain_language.`});
      if (!Array.isArray(artifact.source_refs) || artifact.source_refs.length === 0 || artifact.source_refs.some((ref) => typeof ref.path !== "string" || typeof ref.selector !== "string" || !/^[a-f0-9]{64}$/.test(ref.sha256 ?? ""))) {
        diagnostics.push({code: "invalid-scene-source-ref", id: artifact.node_id, message: `Scene artifact ${artifact.node_id} requires digest-bound source refs.`});
      }
      addNode(
        "scene-artifact",
        artifact.node_id,
        `${sceneSource.source_ref}#/nodes/${index}`,
        artifact.label,
        artifact,
        {artifact_status: artifact.artifact_status, mechanism: artifact.mechanism, scene_id: scene.scene_id, step_orders: stepOrdersByNode.get(graphNodeId) ?? []},
        {authorityEffect: scene.authority_effect, bandOverride: artifact.band},
      );
    }
  }

  const fixtureProjection = projectionById.get(facts.projection_id);
  const fixtureProfiles = fixtureProjection
    ? profiles.filter((profile) => profile.language === fixtureProjection.language)
    : [];
  if (!fixtureProjection) diagnostics.push({code: "unknown-fixture-projection", id: facts.projection_id, message: `Unknown fixture projection ${facts.projection_id}.`});
  if (fixtureProfiles.length !== 1) diagnostics.push({code: "ambiguous-fixture-profile", projection_id: facts.projection_id, message: `Fixture projection must resolve to exactly one language profile; found ${fixtureProfiles.length}.`});
  const fixtureProfileId = fixtureProfiles[0]?.profile_id ?? null;

  for (const [index, element] of (facts.elements ?? []).entries()) {
    if (!conceptById.has(element.type)) diagnostics.push({code: "unknown-fact-type", id: element.element_id, type: element.type, message: `Fact element ${element.element_id} has unknown type ${element.type}.`});
    addNode(
      "fact-element",
      element.element_id,
      `${factsSource.source_ref}#/elements/${index}`,
      tail(element.element_id),
      element,
      {fixture: "supplied", source_digest: facts.source_digest},
      {fixtureProjectionId: facts.projection_id, fixtureProfileId, authorityEffect: facts.authority_effect},
    );
  }

  for (const [index, relation] of (facts.relations ?? []).entries()) {
    if (!relationById.has(relation.type)) diagnostics.push({code: "unknown-fact-relation-type", id: relation.relation_id, type: relation.type, message: `Fact relation ${relation.relation_id} has unknown type ${relation.type}.`});
    addNode(
      "fact-relation",
      relation.relation_id,
      `${factsSource.source_ref}#/relations/${index}`,
      humanize(relation.relation_id),
      relation,
      {fixture: "supplied", source_digest: facts.source_digest},
      {fixtureProjectionId: facts.projection_id, fixtureProfileId, authorityEffect: facts.authority_effect},
    );
  }

  if (evaluation.facts_id !== facts.facts_id) diagnostics.push({code: "evaluation-facts-mismatch", message: `Evaluation facts ${evaluation.facts_id} do not match ${facts.facts_id}.`});
  if (!profileById.has(evaluation.profile_id)) diagnostics.push({code: "unknown-evaluation-profile", id: evaluation.profile_id, message: `Unknown evaluation profile ${evaluation.profile_id}.`});
  for (const [index, finding] of (evaluation.findings ?? []).entries()) {
    const originProfileId = constraintOwnerById.get(finding.constraint_id);
    const findingId = `finding:${finding.constraint_id}:${finding.subject_id}:${finding.property_id}`;
    if (!originProfileId) diagnostics.push({code: "unknown-finding-constraint", id: finding.constraint_id, message: `Finding constraint ${finding.constraint_id} has no owner.`});
    if (!propertyById.has(finding.property_id)) diagnostics.push({code: "unknown-finding-property", id: finding.property_id, message: `Finding property ${finding.property_id} is unknown.`});
    addNode(
      "finding",
      findingId,
      `${evaluationSource.source_ref}#/findings/${index}`,
      `${humanize(finding.property_id)} finding`,
      finding,
      {severity: finding.severity, evaluation_verdict: evaluation.verdict},
      {
        evaluationProfileId: evaluation.profile_id,
        constraintOriginProfileId: originProfileId,
        authorityEffect: evaluation.authority_effect,
      },
    );
  }

  for (const metaType of metaTypes.meta_types ?? []) {
    if (metaType.mapping_status === "candidate-mapped") {
      const concept = conceptById.get(metaType.architecture_type_id);
      if (!concept || concept.canonical_meta_type_ref !== metaType.meta_type_id || concept.canonical_mapping_status !== "candidate-alignment") {
        diagnostics.push({
          code: "reciprocal-alignment-mismatch",
          meta_type_id: metaType.meta_type_id,
          architecture_type_id: metaType.architecture_type_id,
          message: `Candidate alignment for ${metaType.meta_type_id} is not reciprocal.`,
        });
      } else {
        addEdge(
          "candidate-aligns-to",
          `meta:${metaType.meta_type_id}`,
          `type:${concept.concept_id}`,
          `${metaTypesSource.source_ref}#meta_type(${metaType.meta_type_id}).architecture_type_id + ${ontologySource.source_ref}#concept_type(${concept.concept_id}).canonical_meta_type_ref`,
        );
      }
    } else {
      gaps.push({
        id: `gap:meta:${metaType.meta_type_id}:architecture-alignment`,
        kind: "architecture-alignment-absent",
        from: `meta:${metaType.meta_type_id}`,
        expected_to: null,
        mapping_status: metaType.mapping_status,
        reason: metaType.mapping_reason,
        owner_route: metaType.owner_route,
        review_trigger: metaType.review_trigger,
      });
    }
  }

  for (const concept of ontology.concept_types ?? []) {
    if (concept.canonical_meta_type_ref) {
      const metaType = metaById.get(concept.canonical_meta_type_ref);
      if (!metaType || metaType.architecture_type_id !== concept.concept_id || metaType.mapping_status !== "candidate-mapped") {
        diagnostics.push({code: "reciprocal-alignment-mismatch", architecture_type_id: concept.concept_id, message: `Architecture alignment for ${concept.concept_id} is not reciprocal.`});
      }
    }
    if (concept.extends) addEdge("extends", `type:${concept.concept_id}`, `type:${concept.extends}`, `${ontologySource.source_ref}#concept_type(${concept.concept_id}).extends`, "source-native", concept);
  }

  const resolveProfile = (profile, stack = []) => {
    if (stack.includes(profile.profile_id)) {
      diagnostics.push({code: "profile-cycle", id: profile.profile_id, message: `Profile cycle at ${profile.profile_id}.`});
      return [];
    }
    const resolved = [];
    for (const parentRef of profile.extends ?? []) {
      const parent = profileByFilename.get(basename(parentRef));
      if (!parent) {
        diagnostics.push({code: "unknown-parent-profile", id: profile.profile_id, parent_ref: parentRef, message: `Profile ${profile.profile_id} has unknown parent ${parentRef}.`});
        continue;
      }
      resolved.push(...resolveProfile(parent, [...stack, profile.profile_id]));
      resolved.push(parent.profile_id);
      addEdge("profile-inherits", `profile:${profile.profile_id}`, `profile:${parent.profile_id}`, `${profileSourceById.get(profile.profile_id).source_ref}#extends`, "source-native");
    }
    return [...new Set(resolved)];
  };

  const profileAncestors = new Map(profiles.map((profile) => [profile.profile_id, resolveProfile(profile)]));
  for (const profile of profiles) {
    for (const constraint of profile.constraints ?? []) {
      const constraintId = `constraint:${constraint.constraint_id}`;
      addEdge("defines-constraint", `profile:${profile.profile_id}`, constraintId, `${profileSourceById.get(profile.profile_id).source_ref}#constraint(${constraint.constraint_id})`, "source-native", constraint);
      if (!propertyById.has(constraint.property_id)) diagnostics.push({code: "unknown-constraint-property", id: constraint.constraint_id, property_id: constraint.property_id, message: `Constraint ${constraint.constraint_id} uses unknown property ${constraint.property_id}.`});
      addEdge("constrains", constraintId, `property:${constraint.property_id}`, `${profileSourceById.get(profile.profile_id).source_ref}#constraint(${constraint.constraint_id}).property_id`, "source-native", constraint);
      const applicableTypes = constraint.constraint_kind === "node-property"
        ? constraint.applies_to ?? []
        : [...(constraint.source_types ?? []), ...(constraint.target_types ?? [])];
      for (const typeId of applicableTypes) {
        if (!conceptById.has(typeId)) diagnostics.push({code: "unknown-constraint-type", id: constraint.constraint_id, type_id: typeId, message: `Constraint ${constraint.constraint_id} applies to unknown type ${typeId}.`});
        addEdge("applies-to", constraintId, `type:${typeId}`, `${profileSourceById.get(profile.profile_id).source_ref}#constraint(${constraint.constraint_id})`, "source-native", constraint);
      }
    }
  }

  for (const property of ontology.property_definitions ?? []) {
    if (property.applies_to?.kind !== "node") continue;
    for (const typeId of property.applies_to.types ?? []) {
      if (!conceptById.has(typeId)) diagnostics.push({code: "unknown-property-type", id: property.property_id, type_id: typeId, message: `Property ${property.property_id} applies to unknown type ${typeId}.`});
      addEdge("applies-to", `property:${property.property_id}`, `type:${typeId}`, `${ontologySource.source_ref}#property(${property.property_id}).applies_to`, "source-native", property);
    }
  }

  for (const element of facts.elements ?? []) {
    addEdge("instance-of", `fact:${element.element_id}`, `type:${element.type}`, `${factsSource.source_ref}#element(${element.element_id}).type`, "source-native", element);
    if (fixtureProfileId) addEdge("observed-under", `fact:${element.element_id}`, `profile:${fixtureProfileId}`, `${factsSource.source_ref}#projection_id -> ${ontologySource.source_ref}#language_projection(${facts.projection_id}).language -> unique profile language`, "presentation-bridge");
  }

  for (const relation of facts.relations ?? []) {
    if (!(facts.elements ?? []).some((item) => item.element_id === relation.from) || !(facts.elements ?? []).some((item) => item.element_id === relation.to)) {
      diagnostics.push({code: "dangling-fact-relation", id: relation.relation_id, from: relation.from, to: relation.to, message: `Fact relation ${relation.relation_id} has a missing endpoint.`});
    } else {
      addEdge("observed-relation", `fact:${relation.from}`, `fact:${relation.to}`, `${factsSource.source_ref}#relation(${relation.relation_id}).from/to`, "source-native", relation);
    }
    if (fixtureProfileId) addEdge("observed-under", `fact-relation:${relation.relation_id}`, `profile:${fixtureProfileId}`, `${factsSource.source_ref}#projection_id -> ${ontologySource.source_ref}#language_projection(${facts.projection_id}).language -> unique profile language`, "presentation-bridge");
  }

  const factElementIds = new Set((facts.elements ?? []).map((item) => item.element_id));
  const factRelationIds = new Set((facts.relations ?? []).map((item) => item.relation_id));
  for (const finding of evaluation.findings ?? []) {
    const findingId = `finding:${finding.constraint_id}:${finding.subject_id}:${finding.property_id}`;
    const subjectId = factElementIds.has(finding.subject_id)
      ? `fact:${finding.subject_id}`
      : factRelationIds.has(finding.subject_id)
        ? `fact-relation:${finding.subject_id}`
        : null;
    if (!subjectId) diagnostics.push({code: "unknown-finding-subject", id: finding.subject_id, message: `Finding subject ${finding.subject_id} is unknown.`});
    else addEdge("explains", findingId, subjectId, `${evaluationSource.source_ref}#finding(${finding.constraint_id}).subject_id`, "source-native", finding);
    addEdge("checks", findingId, `property:${finding.property_id}`, `${evaluationSource.source_ref}#finding(${finding.constraint_id}).property_id`, "source-native", finding);
    addEdge("checks", findingId, `constraint:${finding.constraint_id}`, `${evaluationSource.source_ref}#finding(${finding.constraint_id}).constraint_id`, "source-native", finding);
    addEdge("evaluated-under", findingId, `profile:${evaluation.profile_id}`, `${evaluationSource.source_ref}#profile_id`, "source-native", finding);
  }

  if (scene) {
    for (const [index, edge] of (scene.edges ?? []).entries()) {
      if (typeof edge.kind !== "string" || !edge.kind || typeof edge.from !== "string" || typeof edge.to !== "string") {
        diagnostics.push({code: "invalid-scene-edge", index, message: `Scene edge ${index} requires kind, from, and to.`});
        continue;
      }
      addEdge(edge.kind, edge.from, edge.to, `${sceneSource.source_ref}#/edges/${index}`, "scene-reference", edge);
    }
    for (const step of sceneSteps) {
      if (!nodeIds.has(step.focus_node_id)) diagnostics.push({code: "unknown-scene-focus", id: step.step_id, node_id: step.focus_node_id, message: `Scene step ${step.step_id} has unknown focus node ${step.focus_node_id}.`});
      if (!Array.isArray(step.highlight_node_ids) || step.highlight_node_ids.length === 0) diagnostics.push({code: "missing-scene-highlights", id: step.step_id, message: `Scene step ${step.step_id} requires highlight_node_ids.`});
      for (const nodeId of step.highlight_node_ids ?? []) if (!nodeIds.has(nodeId)) diagnostics.push({code: "unknown-scene-highlight", id: step.step_id, node_id: nodeId, message: `Scene step ${step.step_id} highlights unknown node ${nodeId}.`});
    }
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) diagnostics.push({code: "dangling-edge", id: edge.id, from: edge.from, to: edge.to, message: `Edge ${edge.id} has a missing endpoint.`});
  }
  if (diagnostics.length > 0) throw projectionError(diagnostics);

  nodes.sort((left, right) => left.id.localeCompare(right.id));
  edges.sort((left, right) => left.id.localeCompare(right.id));
  gaps.sort((left, right) => left.id.localeCompare(right.id));
  const nodeIndex = Object.fromEntries(nodes.map((node, index) => [node.id, {kind: "node", index}]));
  const indexedFamilies = Object.keys(FAMILY_BANDS).filter((family) => family !== "scene-artifact" || scene);
  const byFamily = Object.fromEntries(indexedFamilies.map((family) => [family, nodes.filter((node) => node.family === family).map((node) => node.id)]));
  const incidentEdges = Object.fromEntries(nodes.map((node) => [node.id, edges.filter((edge) => edge.from === node.id || edge.to === node.id).map((edge) => edge.id)]));
  const byProfile = Object.fromEntries(profiles.map((profile) => {
    const effectiveOwnerIds = new Set([profile.profile_id, ...(profileAncestors.get(profile.profile_id) ?? [])]);
    const ownsFixture = profile.profile_id === fixtureProfileId;
    const ownsEvaluation = profile.profile_id === evaluation.profile_id;
    return [profile.profile_id, {
      constraint_ids: nodes.filter((node) => node.family === "constraint" && effectiveOwnerIds.has(node.statuses.owner_profile_id)).map((node) => node.id),
      observation_node_ids: ownsFixture ? nodes.filter((node) => node.family === "fact-element" || node.family === "fact-relation").map((node) => node.id) : [],
      finding_node_ids: ownsEvaluation ? nodes.filter((node) => node.family === "finding").map((node) => node.id) : [],
      supplied_fixture: ownsFixture,
      supplied_evaluation: ownsEvaluation,
    }];
  }));
  const byScene = scene ? {
    [scene.scene_id]: {
      node_ids: nodes.filter((node) => node.family === "scene-artifact" && node.statuses.scene_id === scene.scene_id).map((node) => node.id),
      edge_ids: edges.filter((edge) => edge.source_kind === "scene-reference").map((edge) => edge.id),
      step_ids: sceneSteps.map((step) => step.step_id),
    },
  } : {};
  const indexes = {by_id: nodeIndex, by_family: byFamily, incident_edges: incidentEdges, by_profile: byProfile, by_scene: byScene};
  const scenes = scene ? {
    [scene.scene_id]: {
      scene_id: scene.scene_id,
      title: scene.title,
      status: scene.status,
      plain_language: scene.plain_language,
      boundary: scene.boundary,
      authority_effect: scene.authority_effect,
      source_ref: sceneSource.source_ref,
      steps: sceneSteps,
    },
  } : {};
  return deepFreeze({
    graph_id: "unified-canvas:prototype",
    verification_status: "prototype-unverified",
    authority_effect: "none",
    nodes,
    edges,
    gaps,
    indexes,
    scenes,
  });
};
