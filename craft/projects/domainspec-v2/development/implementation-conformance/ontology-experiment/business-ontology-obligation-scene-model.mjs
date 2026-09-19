const EXPECTED_STEP_IDS = Object.freeze([
  "business-meaning",
  "typed-business-neighborhood",
  "formal-clause",
  "derived-obligation",
  "obligation-constellation",
  "separate-graph-planes",
  "proof-plan",
  "implementation-architecture",
  "code-realization",
  "proof-execution",
  "evidence-verdict",
]);

const EXPECTED_TOUR_STEP_IDS = Object.freeze(["areas", "box-anatomy", "supported-path", "missing-link"]);

const clone = (value) => JSON.parse(JSON.stringify(value));

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

const sceneError = (diagnostics) => {
  const error = new Error(`Business ontology scene rejected with ${diagnostics.length} diagnostic(s).`);
  error.name = "BusinessOntologyObligationSceneError";
  error.code = "BOO_SCENE_INVALID";
  error.diagnostics = diagnostics.map((diagnostic) => Object.freeze({...diagnostic}));
  return error;
};

export const BuildBusinessOntologyObligationScene = (input) => {
  const diagnostics = [];
  const sceneRecord = input?.scene;
  const implementationProjection = input?.implementation_projection;
  const bridgeOntology = input?.bridge_ontology;
  if (!sceneRecord || typeof sceneRecord.source_ref !== "string" || !sceneRecord.value) {
    diagnostics.push({code: "invalid-scene-source", message: "scene requires source_ref and value."});
  }
  if (!implementationProjection || typeof implementationProjection !== "object") {
    diagnostics.push({code: "missing-implementation-projection", message: "The scene requires the live implementation-type projection."});
  }
  if (!bridgeOntology || typeof bridgeOntology !== "object") {
    diagnostics.push({code: "missing-bridge-ontology", message: "The scene requires the validated Financial Settlement business-system bridge ontology."});
  }
  if (diagnostics.length) throw sceneError(diagnostics);

  const scene = sceneRecord.value;
  if (scene.schema_version !== "domainspec-business-to-proof-to-code-scene/v1") diagnostics.push({code: "unsupported-schema", message: `Unsupported scene schema ${scene.schema_version}.`});
  if (scene.authority_effect !== "none" || implementationProjection.authority_effect !== "none") diagnostics.push({code: "authority-inflation", message: "Scene and implementation projection must preserve authority_effect none."});
  if (bridgeOntology.authority_effect !== "none" || bridgeOntology.ontology_type !== "business-system-bridge") diagnostics.push({code: "invalid-bridge-ontology", message: "The scene requires an authority-neutral business-system bridge ontology."});
  const stepIds = (scene.steps ?? []).map((step) => step.step_id);
  if (JSON.stringify(stepIds) !== JSON.stringify(EXPECTED_STEP_IDS)) diagnostics.push({code: "invalid-step-sequence", message: "The business-to-architecture step sequence is incomplete or reordered."});
  if ((scene.steps ?? []).some((step, index) => step.ordinal !== index + 1)) diagnostics.push({code: "invalid-step-ordinal", message: "Scene ordinals must be contiguous and one-based."});

  const planes = scene.graph_planes ?? {};
  const authored = planes.authored_feature_ontology;
  const minted = planes.minted_semantic_read_model;
  const obligations = planes.obligation_read_model;
  if (!authored || authored.node_count !== authored.nodes?.length || authored.edge_count !== authored.edges?.length) diagnostics.push({code: "authored-count-mismatch", message: "Authored graph counts must match its records."});
  if (!minted || minted.node_count !== minted.nodes?.length || minted.edge_count !== minted.edges?.length) diagnostics.push({code: "minted-count-mismatch", message: "Minted graph counts must match its records."});
  if (!obligations || obligations.obligation_count !== obligations.tiers?.reduce((sum, tier) => sum + tier.count, 0)) diagnostics.push({code: "obligation-count-mismatch", message: "Obligation tier counts must equal the declared total."});
  const audienceLanguageMissing = !scene.subject?.business_meaning
    || minted?.nodes?.some((node) => !node.display_label || !node.business_role)
    || minted?.edges?.some((edge) => !edge.plain_relationship)
    || obligations?.tiers?.some((tier) => !tier.label)
    || !obligations?.highlighted_obligation?.plain_title
    || !obligations?.highlighted_obligation?.plain_description
    || !scene.formal_clause?.plain_precondition
    || !scene.formal_clause?.plain_postcondition
    || !Array.isArray(scene.formal_clause?.plain_ordered_effects)
    || scene.implementation_coverage?.some((coverage) => !coverage.plain_label);
  if (audienceLanguageMissing) diagnostics.push({code: "missing-audience-language", message: "Every visible scene concept requires an audience-facing label or explanation."});
  const modelingFocus = minted?.modeling_focus;
  if (!modelingFocus || modelingFocus.from !== "business-promise" || !modelingFocus.label || !modelingFocus.instruction || !minted.nodes?.some((node) => node.id === modelingFocus.next_node_id)) {
    diagnostics.push({code: "invalid-modeling-focus", message: "The business graph must identify one source-backed next modeling node."});
  }
  if (obligations?.highlighted_obligation?.id !== "FS-POST-001") diagnostics.push({code: "missing-highlighted-obligation", message: "FS-POST-001 must anchor the scene."});
  if ((scene.implementation_coverage ?? []).some((coverage) => coverage.concept_type === "Obligation" || coverage.meta_type_id === "Obligation")) diagnostics.push({code: "obligation-meta-type-collapse", message: "Obligation must remain a derived artifact, not a DomainSpec meta-type."});

  const proofToCode = scene.proof_to_code;
  if (!proofToCode || proofToCode.obligation_id !== obligations?.highlighted_obligation?.id) diagnostics.push({code: "proof-obligation-mismatch", message: "The proof-to-code path must remain anchored to the highlighted obligation."});
  if (proofToCode?.proof_plan?.full_obligation_status !== "not-proven" || proofToCode?.verification?.receipt_status !== "not-issued") diagnostics.push({code: "unsupported-proof-claim", message: "FS-POST-001 remains unproven until an obligation-bound harness and receipt exist."});
  if (proofToCode?.proof_plan?.binding_status !== "missing" || proofToCode?.verification?.derived_test_status !== "coverage-gap") diagnostics.push({code: "hidden-coverage-gap", message: "The scene must expose the missing P4 binding and skipped generated test."});
  if (proofToCode?.code_realization?.generation_status !== "not-generated-from-ontology" || proofToCode?.code_realization?.status !== "existing-handwritten") diagnostics.push({code: "unsupported-generation-claim", message: "The existing TypeScript is handwritten and must not be presented as ontology-generated."});
  if (proofToCode?.code_contract?.implementation_type_id !== "architecture.OperationImplementation" || proofToCode?.code_contract?.status !== "candidate") diagnostics.push({code: "invalid-code-contract", message: "The code contract must preserve the candidate Operation implementation mapping."});
  if (!proofToCode?.verification?.negative_control || proofToCode.verification.negative_control.expected_verdict !== "fail-full-p4") diagnostics.push({code: "missing-proof-negative-control", message: "The proof plan requires a deliberate event-missing failure control."});
  if (!Array.isArray(proofToCode?.proof_plan?.observations) || proofToCode.proof_plan.observations.length !== 5) diagnostics.push({code: "incomplete-proof-observations", message: "The proof plan must cover decision, write, event, ordering, and duplicate behavior."});
  const ontologyView = bridgeOntology.resolved_views?.[proofToCode?.ontology_view_id];
  const ontologyLifecycleView = bridgeOntology.resolved_views?.[proofToCode?.ontology_lifecycle_view_id];
  const businessOntologyView = bridgeOntology.resolved_views?.["financial-settlement.business-neighborhood"];
  const semanticTourView = bridgeOntology.resolved_views?.[proofToCode?.ontology_tour_view_id];
  if (!ontologyView) diagnostics.push({code: "missing-ontology-view", message: "The proof-to-code scene must select a validated ontology view."});
  if (!ontologyLifecycleView || ontologyLifecycleView.view_id !== "financial-settlement.promise-to-proof" || ontologyLifecycleView.stages?.length !== 6) diagnostics.push({code: "missing-ontology-lifecycle-view", message: "The scene requires the ontology-owned six-stage promise-to-proof lifecycle view."});
  if (!businessOntologyView) diagnostics.push({code: "missing-business-ontology-view", message: "The scene requires the validated business-neighborhood ontology view."});
  if (!semanticTourView) diagnostics.push({code: "missing-semantic-tour-view", message: "Part 7 requires the ontology-owned semantic tour view."});
  if (Object.hasOwn(proofToCode ?? {}, "graph_tour")) diagnostics.push({code: "scene-owned-semantic-tour", message: "The scene may select a semantic tour view but may not own tour meaning or targets."});
  const ontologyViewNodeIds = new Set(ontologyView?.node_ids ?? []);
  const ontologyViewNodeById = new Map((ontologyView?.nodes ?? []).map((node) => [node.node_id, node]));
  for (const [role, nodeId] of Object.entries(proofToCode?.ontology_nodes ?? {})) if (!ontologyViewNodeIds.has(nodeId)) diagnostics.push({code: "missing-ontology-node", role, node_id: nodeId, message: `Scene role ${role} references a node outside the ontology view.`});
  if (scene.subject?.ontology_node_id !== "financial-settlement.GenerateSettlement" || !bridgeOntology.resolved_views?.["financial-settlement.business-neighborhood"]?.node_ids.includes(scene.subject.ontology_node_id)) diagnostics.push({code: "invalid-subject-ontology-node", message: "The scene subject must be the ontology's GenerateSettlement business node."});
  if (scene.subject?.meta_type_ontology_node_id !== "DS-D1.4" || proofToCode?.ontology_nodes?.operation_meta_type !== "DS-D1.4") diagnostics.push({code: "missing-domainspec-classification", message: "The scene must expose DS-D1.4 as the DomainSpec type of GenerateSettlement."});
  const ontologyViewEdgeIds = new Set(ontologyView?.edge_ids ?? []);
  for (const edgeId of ["domainspec.edge.generation-classified-operation", "bridge.edge.operation-meta-type-maps-to-architecture", "bridge.edge.operation-architecture-shapes-contract"]) {
    if (!ontologyViewEdgeIds.has(edgeId)) diagnostics.push({code: "missing-domainspec-path", edge_id: edgeId, message: `The scene's selected view requires ${edgeId}.`});
  }
  const semanticNodeById = new Map((semanticTourView?.nodes ?? []).map((node) => [node.node_id, node]));
  const semanticEdges = semanticTourView?.edges ?? [];
  const semanticTourNodes = [...semanticNodeById.values()].filter((node) => node.type_id === "projection.SemanticTour");
  const semanticViewNodes = [...semanticNodeById.values()].filter((node) => node.type_id === "projection.OntologyView");
  if (semanticTourNodes.length !== 1 || semanticViewNodes.length !== 1) diagnostics.push({code: "invalid-semantic-tour-root", message: "The selected semantic tour view requires one tour and one ontology-view node."});
  const semanticTourNode = semanticTourNodes[0];
  const semanticViewNode = semanticViewNodes[0];
  const tourForEdges = semanticEdges.filter((edge) => edge.relation_id === "projection.tour_for" && edge.from === semanticTourNode?.node_id);
  if (tourForEdges.length !== 1 || tourForEdges[0]?.to !== semanticViewNode?.node_id || semanticViewNode?.properties?.selected_graph_view_id !== proofToCode?.ontology_view_id) diagnostics.push({code: "invalid-semantic-tour-target", message: "The ontology tour must target the selected proof-to-code view."});

  const hasLaneEdges = semanticEdges.filter((edge) => edge.relation_id === "projection.has_lane" && edge.from === semanticViewNode?.node_id);
  const semanticLanes = hasLaneEdges.map((edge) => semanticNodeById.get(edge.to)).filter(Boolean).sort((left, right) => left.properties.ordinal - right.properties.ordinal).map((lane) => ({
    lane_node_id: lane.node_id,
    lane_id: lane.properties.lane_id,
    ordinal: lane.properties.ordinal,
    label: lane.label,
    plain_language: lane.plain_language,
    node_ids: semanticEdges.filter((edge) => edge.relation_id === "projection.contains_node" && edge.from === lane.node_id).map((edge) => edge.to),
  }));
  if (JSON.stringify(semanticLanes.map((lane) => lane.lane_id)) !== JSON.stringify(["business", "domainspec", "bridge", "system"]) || semanticLanes.some((lane, index) => lane.ordinal !== index + 1)) diagnostics.push({code: "invalid-semantic-tour-lanes", message: "The semantic tour requires the four ontology-owned ordered lanes."});
  const laneMembership = semanticLanes.flatMap((lane) => lane.node_ids);
  if (laneMembership.length !== 20 || new Set(laneMembership).size !== 20 || laneMembership.some((nodeId) => !ontologyViewNodeIds.has(nodeId))) diagnostics.push({code: "invalid-semantic-tour-membership", message: "Semantic lanes must contain 20 distinct nodes from the proof-to-code view."});

  const hasStepEdges = semanticEdges.filter((edge) => edge.relation_id === "projection.has_step" && edge.from === semanticTourNode?.node_id);
  const semanticStepNodes = hasStepEdges.map((edge) => semanticNodeById.get(edge.to)).filter(Boolean).sort((left, right) => left.properties.ordinal - right.properties.ordinal);
  const semanticTourSteps = semanticStepNodes.map((step) => {
    const highlightTargets = semanticEdges.filter((edge) => edge.relation_id === "projection.highlights" && edge.from === step.node_id).map((edge) => edge.to);
    const laneIds = highlightTargets.map((target) => semanticLanes.find((lane) => lane.lane_node_id === target)?.lane_id).filter(Boolean);
    const nodeIds = highlightTargets.filter((target) => ontologyViewNodeIds.has(target));
    const targetSet = new Set(nodeIds);
    const edgeIds = step.properties.highlight_mode === "connected-subgraph"
      ? (ontologyView?.edges ?? []).filter((edge) => targetSet.has(edge.from) && targetSet.has(edge.to)).map((edge) => edge.edge_id)
      : [];
    const integrationSentences = (step.properties.integration_sentences ?? []).map((statement) => {
      const fromNode = semanticNodeById.get(statement.from) ?? ontologyViewNodeById.get(statement.from);
      const toNode = semanticNodeById.get(statement.to) ?? ontologyViewNodeById.get(statement.to);
      const matchingEdges = [...semanticEdges, ...(ontologyView?.edges ?? [])].filter((edge) => edge.from === statement.from && edge.relation_id === statement.relation_id && edge.to === statement.to);
      return {
        statement_id: statement.statement_id,
        from_id: statement.from,
        from_label: fromNode?.label,
        relation_id: statement.relation_id,
        to_id: statement.to,
        to_label: toNode?.label,
        posture: statement.posture,
        sentence: statement.sentence,
        edge_id: matchingEdges[0]?.edge_id ?? null,
      };
    });
    if (integrationSentences.length !== 3 || integrationSentences.some((item) => !item.statement_id || !item.from_label || !item.to_label || !item.sentence || (item.posture === "missing-by-design" ? item.edge_id !== null : item.edge_id === null))) diagnostics.push({code: "incomplete-semantic-tour-integration", node_id: step.node_id, message: `${step.node_id} requires three resolved semantic integration sentences.`});
    return {
      tour_step_node_id: step.node_id,
      tour_step_id: step.properties.tour_step_id,
      ordinal: step.properties.ordinal,
      title: step.label,
      plain_language: step.plain_language,
      highlight_mode: step.properties.highlight_mode,
      lane_ids: laneIds,
      node_ids: nodeIds,
      edge_ids: edgeIds,
      integration_sentences: integrationSentences,
      claim_ceiling: step.claim_ceiling,
    };
  });
  if (JSON.stringify(semanticTourSteps.map((step) => step.tour_step_id)) !== JSON.stringify(EXPECTED_TOUR_STEP_IDS)) diagnostics.push({code: "invalid-semantic-tour-sequence", message: "The ontology box tour requires the four stable explanation steps."});
  const missingLinkTour = semanticTourSteps.find((step) => step.tour_step_id === "missing-link");
  if (!missingLinkTour?.node_ids.includes("financial-settlement.P4") || !missingLinkTour?.node_ids.includes("FS-POST-001") || !missingLinkTour?.node_ids.includes("gap.FS-POST-001-ontology-origin") || JSON.stringify([...missingLinkTour.edge_ids].sort()) !== JSON.stringify(["bridge.edge.fs-post-001-has-origin-gap", "bridge.edge.p4-has-origin-gap"])) diagnostics.push({code: "incomplete-semantic-missing-link-tour", message: "The final semantic tour step must derive only the two supported paths into the shared origin gap."});
  const semanticTour = {
    tour_node_id: semanticTourNode?.node_id,
    view_node_id: semanticViewNode?.node_id,
    ontology_tour_view_id: semanticTourView?.view_id,
    trigger_label: semanticTourNode?.properties?.trigger_label,
    status: semanticTourNode?.artifact_status,
    plain_language: semanticTourNode?.plain_language,
    claim_ceiling: semanticTourNode?.claim_ceiling,
    lanes: semanticLanes,
    steps: semanticTourSteps,
  };
  if (JSON.stringify([...(minted?.nodes ?? [])].map((node) => node.id).sort()) !== JSON.stringify([...(businessOntologyView?.nodes ?? [])].filter((node) => node.type_id === "business.DomainConcept").map((node) => node.node_id).sort())) diagnostics.push({code: "business-view-identity-drift", message: "The visible business concepts must be projected from the ontology business view."});
  if (scene.formal_clause?.ontology_node_id !== proofToCode?.ontology_nodes?.formal_clause || obligations?.highlighted_obligation?.ontology_node_id !== proofToCode?.ontology_nodes?.obligation) diagnostics.push({code: "ontology-identity-mismatch", message: "The visible clause and obligation must retain their ontology node identities."});
  if ((ontologyView?.edges ?? []).some((edge) => (edge.from === "financial-settlement.P4" && edge.to === "FS-POST-001") || (edge.from === "financial-settlement.GenerateSettlement" && edge.to === "poker-team.ts.generateSettlementUseCase"))) diagnostics.push({code: "manufactured-cross-branch-identity", message: "The scene must expose the missing bridge instead of manufacturing a cross-branch identity edge."});

  const mappingByMetaType = new Map(implementationProjection.mappings.map((mapping) => [mapping.meta_type.id, mapping]));
  for (const coverage of scene.implementation_coverage ?? []) {
    const mapping = mappingByMetaType.get(coverage.meta_type_id);
    if (coverage.coverage === "candidate-mapped" && (!mapping || mapping.architecture_type.id !== coverage.architecture_type_id)) {
      diagnostics.push({code: "implementation-mapping-mismatch", meta_type_id: coverage.meta_type_id, message: `Scene mapping for ${coverage.meta_type_id} does not match the live projection.`});
    }
    if (coverage.coverage !== "candidate-mapped" && coverage.architecture_type_id !== null) diagnostics.push({code: "gap-with-architecture-type", meta_type_id: coverage.meta_type_id, message: "Unmapped coverage cannot name an architecture type."});
  }
  const sourceIds = new Set((scene.source_refs ?? []).map((source) => source.source_id));
  for (const step of scene.steps ?? []) for (const sourceId of step.source_ids ?? []) if (!sourceIds.has(sourceId)) diagnostics.push({code: "missing-step-source", step_id: step.step_id, source_id: sourceId, message: `Step ${step.step_id} references unknown source ${sourceId}.`});
  if (diagnostics.length) throw sceneError(diagnostics);

  return deepFreeze({
    ...clone(scene),
    source_ref: sceneRecord.source_ref,
    verification_status: "prototype-unverified",
    ontology: {
      ontology_id: bridgeOntology.ontology_id,
      ontology_type: bridgeOntology.ontology_type,
      source_ref: bridgeOntology.source_ref,
      status: bridgeOntology.status,
      authority_effect: bridgeOntology.authority_effect,
      verification_status: bridgeOntology.verification_status,
    },
    ontology_view: clone(ontologyView),
    ontology_lifecycle_view: clone(ontologyLifecycleView),
    business_ontology_view: clone(businessOntologyView),
    ontology_tour_view: clone(semanticTourView),
    ontology_tour: clone(semanticTour),
    counts: {
      steps: scene.steps.length,
      authored_nodes: authored.node_count,
      authored_edges: authored.edge_count,
      minted_nodes: minted.node_count,
      minted_edges: minted.edge_count,
      obligations: obligations.obligation_count,
      implementation_coverage_rows: scene.implementation_coverage.length,
      ontology_nodes: ontologyView.nodes.length,
      ontology_edges: ontologyView.edges.length,
      ontology_lifecycle_nodes: ontologyLifecycleView.nodes.length,
      ontology_lifecycle_edges: ontologyLifecycleView.edges.length,
      ontology_lifecycle_stages: ontologyLifecycleView.stages.length,
      ontology_domainspec_nodes: ontologyView.nodes.filter((node) => node.type_id.startsWith("domainspec.")).length,
      ontology_tour_steps: semanticTour.steps.length,
      ontology_gaps: ontologyView.nodes.filter((node) => node.type_id === "bridge.EvidenceGap").length,
      ontology_drift_findings: ontologyView.nodes.filter((node) => node.type_id === "bridge.DriftFinding").length,
    },
  });
};
