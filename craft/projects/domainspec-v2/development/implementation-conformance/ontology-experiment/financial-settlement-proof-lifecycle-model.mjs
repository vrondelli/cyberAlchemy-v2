const clone = (value) => JSON.parse(JSON.stringify(value));

const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
};

const ontologyError = (diagnostics) => {
  const error = new Error(`Financial Settlement bridge ontology rejected with ${diagnostics.length} diagnostic(s).`);
  error.name = "FinancialSettlementBridgeOntologyError";
  error.code = "FS_BRIDGE_ONTOLOGY_INVALID";
  error.diagnostics = diagnostics.map((diagnostic) => Object.freeze({...diagnostic}));
  return error;
};

const requiredNodeFields = Object.freeze([
  "node_id",
  "type_id",
  "branch",
  "kind",
  "label",
  "plain_language",
  "artifact_status",
  "source_refs",
  "confidence",
  "owner_route",
  "claim_ceiling",
]);

const requiredViewIds = Object.freeze([
  "financial-settlement.business-neighborhood",
  "financial-settlement.promise-to-proof",
  "financial-settlement.proof-to-code",
  "financial-settlement.box-tour",
]);

export const BuildFinancialSettlementProofLifecycleOntology = (input) => {
  const diagnostics = [];
  if (!input || typeof input.source_ref !== "string" || !input.value || typeof input.value !== "object") {
    throw ontologyError([{code: "invalid-source-record", message: "Ontology input requires source_ref and value."}]);
  }

  const ontology = input.value;
  if (ontology.schema_version !== "domainspec-business-system-bridge-ontology/v1") diagnostics.push({code: "unsupported-schema", message: `Unsupported schema ${ontology.schema_version}.`});
  if (ontology.ontology_type !== "business-system-bridge" || ontology.mode !== "map") diagnostics.push({code: "wrong-ontology-route", message: "The lifecycle requires an Ontology Vault business-system-bridge map."});
  if (ontology.ontology_type_selection?.selection_source !== "inferred" || ontology.ontology_type_selection?.confidence !== "high") diagnostics.push({code: "invalid-type-selection", message: "The inferred business-system-bridge selection and confidence must remain explicit."});
  if (ontology.authority_effect !== "none" || ontology.status !== "candidate-read-model") diagnostics.push({code: "authority-inflation", message: "The ontology must remain a candidate read model with authority_effect none."});

  const branchIds = new Set((ontology.branches ?? []).map((branch) => branch.branch_id));
  for (const branchId of ["business", "bridge", "system"]) if (!branchIds.has(branchId)) diagnostics.push({code: "missing-branch", branch_id: branchId, message: `Missing ${branchId} branch.`});

  const sourceById = new Map();
  for (const source of ontology.source_refs ?? []) {
    if (!source.source_id || sourceById.has(source.source_id)) diagnostics.push({code: "duplicate-source", source_id: source.source_id, message: "Source IDs must be unique and non-empty."});
    if (!branchIds.has(source.branch) || typeof source.path !== "string" || typeof source.selector !== "string" || !/^[a-f0-9]{64}$/.test(source.sha256 ?? "")) diagnostics.push({code: "invalid-source-ref", source_id: source.source_id, message: "Every source needs a valid branch, path, selector, and sha256."});
    sourceById.set(source.source_id, source);
  }

  const typeById = new Map();
  for (const type of ontology.node_type_definitions ?? []) {
    if (!type.type_id || typeById.has(type.type_id)) diagnostics.push({code: "duplicate-node-type", type_id: type.type_id, message: "Node type IDs must be unique and non-empty."});
    if (!branchIds.has(type.branch) || !Array.isArray(type.allowed_kinds) || type.allowed_kinds.length === 0) diagnostics.push({code: "invalid-node-type", type_id: type.type_id, message: "Node types require a branch and allowed kinds."});
    typeById.set(type.type_id, type);
  }

  const nodeById = new Map();
  for (const node of ontology.nodes ?? []) {
    if (!node.node_id || nodeById.has(node.node_id)) diagnostics.push({code: "duplicate-node", node_id: node.node_id, message: "Node IDs must be unique and non-empty."});
    for (const field of requiredNodeFields) if (node[field] === undefined || node[field] === null || node[field] === "") diagnostics.push({code: "missing-node-field", node_id: node.node_id, field, message: `Node ${node.node_id} requires ${field}.`});
    const type = typeById.get(node.type_id);
    if (!type || type.branch !== node.branch || !type.allowed_kinds.includes(node.kind)) diagnostics.push({code: "invalid-node-classification", node_id: node.node_id, message: `Node ${node.node_id} does not satisfy ${node.type_id}.`});
    if (!Array.isArray(node.source_refs) || node.source_refs.length === 0 || node.source_refs.some((sourceId) => !sourceById.has(sourceId))) diagnostics.push({code: "invalid-node-evidence", node_id: node.node_id, message: `Node ${node.node_id} requires known evidence refs.`});
    if (!node.confidence || !node.confidence.evidence || !node.confidence.commitment) diagnostics.push({code: "invalid-node-confidence", node_id: node.node_id, message: `Node ${node.node_id} requires separate evidence and commitment confidence.`});
    nodeById.set(node.node_id, node);
  }

  if (nodeById.get("FS-POST-001")?.type_id !== "bridge.ProofObligation") diagnostics.push({code: "obligation-meta-type-collapse", message: "FS-POST-001 must remain a bridge ProofObligation, not a DomainSpec meta-type."});
  const requiredDomainSpecNodes = Object.freeze({
    "domainspec.financial-settlement.semantic-graph": "domainspec.ModelArtifact",
    "domainspec.financial-settlement.obligation-read-model": "domainspec.ModelArtifact",
    "DS-D1.4": "domainspec.MetaType",
    "DS-D1.6": "domainspec.MetaType",
    "DS-D1.7": "domainspec.MetaType",
    "DS-D1.12": "domainspec.MetaType",
    "architecture.OperationImplementation": "bridge.ArchitectureRealizationType",
    "architecture.RuleImplementation": "bridge.ArchitectureRealizationType",
    "view.financial-settlement.proof-to-code": "projection.OntologyView",
    "view.lane.business": "projection.ViewLane",
    "view.lane.domainspec": "projection.ViewLane",
    "view.lane.bridge": "projection.ViewLane",
    "view.lane.system": "projection.ViewLane",
    "tour.financial-settlement.proof-to-code": "projection.SemanticTour",
    "tour.step.areas": "projection.TourStep",
    "tour.step.box-anatomy": "projection.TourStep",
    "tour.step.supported-path": "projection.TourStep",
    "tour.step.missing-link": "projection.TourStep",
  });
  for (const [nodeId, typeId] of Object.entries(requiredDomainSpecNodes)) {
    if (nodeById.get(nodeId)?.type_id !== typeId) diagnostics.push({code: "missing-domainspec-layer", node_id: nodeId, message: `The explicit DomainSpec lifecycle requires ${nodeId} as ${typeId}.`});
  }
  for (const systemId of ["poker-team.ts.decideSettlementSideEffects", "poker-team.ts.generateSettlementUseCase"]) {
    if (nodeById.get(systemId)?.properties?.generation_status !== "not-generated-from-ontology") diagnostics.push({code: "unsupported-generation-claim", node_id: systemId, message: "Existing TypeScript must remain explicitly handwritten."});
  }
  const receipt = nodeById.get("receipt.FS-POST-001");
  if (receipt?.artifact_status !== "not-issued" || receipt?.properties?.proof_status !== "not-proven") diagnostics.push({code: "unsupported-proof-claim", message: "FS-POST-001 has no issued receipt or passing verdict."});
  if (!nodeById.has("gap.FS-POST-001-ontology-origin") || nodeById.get("FS-POST-001")?.properties?.ontology_subject_ref !== "missing") diagnostics.push({code: "hidden-ontology-origin-gap", message: "The missing ontology-native obligation subject must remain explicit."});

  const relationById = new Map();
  for (const relation of ontology.relation_definitions ?? []) {
    if (!relation.relation_id || relationById.has(relation.relation_id)) diagnostics.push({code: "duplicate-relation", relation_id: relation.relation_id, message: "Relation IDs must be unique and non-empty."});
    relationById.set(relation.relation_id, relation);
  }
  for (const forbidden of ["bridge.traced_to", "bridge.realized_by", "bridge.proven_by", "bridge.generated_as"]) if (relationById.has(forbidden)) diagnostics.push({code: "unsupported-bridge-relation", relation_id: forbidden, message: `Relation ${forbidden} would outrun current evidence.`});

  const edgeById = new Map();
  for (const edge of ontology.edges ?? []) {
    if (!edge.edge_id || edgeById.has(edge.edge_id)) diagnostics.push({code: "duplicate-edge", edge_id: edge.edge_id, message: "Edge IDs must be unique and non-empty."});
    const relation = relationById.get(edge.relation_id);
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!relation) diagnostics.push({code: "unknown-edge-relation", edge_id: edge.edge_id, message: `Edge ${edge.edge_id} references an unknown relation.`});
    if (!from || !to) diagnostics.push({code: "dangling-edge", edge_id: edge.edge_id, message: `Edge ${edge.edge_id} has a missing endpoint.`});
    if (relation && from && to && (!relation.source_types.includes(from.type_id) || !relation.target_types.includes(to.type_id))) diagnostics.push({code: "invalid-edge-endpoints", edge_id: edge.edge_id, message: `Edge ${edge.edge_id} violates ${edge.relation_id} endpoint types.`});
    if (edge.authority_effect !== "none") diagnostics.push({code: "edge-authority-inflation", edge_id: edge.edge_id, message: "Every ontology edge must preserve authority_effect none."});
    if (!Array.isArray(edge.evidence_refs) || edge.evidence_refs.length === 0 || edge.evidence_refs.some((sourceId) => !sourceById.has(sourceId))) diagnostics.push({code: "invalid-edge-evidence", edge_id: edge.edge_id, message: `Edge ${edge.edge_id} requires known evidence refs.`});
    if (relation?.cross_branch) {
      const evidenceBranches = new Set((edge.evidence_refs ?? []).map((sourceId) => sourceById.get(sourceId)?.branch));
      const requiredEvidenceBranches = relation.required_evidence_branches ?? ["business", "system"];
      if (requiredEvidenceBranches.some((branch) => !evidenceBranches.has(branch))) diagnostics.push({code: "one-sided-bridge-evidence", edge_id: edge.edge_id, message: `Cross-branch edge ${edge.edge_id} requires ${requiredEvidenceBranches.join(" and ")} evidence.`});
    }
    if (edge.relation_id === "domainspec.classified_as" && from && to && from.kind !== to.kind) diagnostics.push({code: "domainspec-kind-mismatch", edge_id: edge.edge_id, message: `${from.node_id} cannot be classified as DomainSpec ${to.kind}.`});
    if (edge.relation_id === "bridge.candidate_maps_to" && from?.properties?.mapping_status !== "candidate-mapped") diagnostics.push({code: "unsupported-candidate-mapping", edge_id: edge.edge_id, message: `${from?.node_id} is not candidate-mapped in the DomainSpec projection.`});
    edgeById.set(edge.edge_id, edge);
  }

  const requiredDomainSpecEdges = Object.freeze([
    "domainspec.edge.graph-contains-generate-settlement",
    "domainspec.edge.generation-classified-operation",
    "domainspec.edge.graph-contains-p4",
    "domainspec.edge.obligation-model-contains-fs-post-001",
    "domainspec.edge.semantic-graph-has-origin-gap",
    "domainspec.edge.obligation-model-has-origin-gap",
    "bridge.edge.operation-meta-type-maps-to-architecture",
    "bridge.edge.operation-architecture-shapes-contract",
    "bridge.edge.rule-meta-type-maps-to-architecture",
    "bridge.edge.rule-architecture-shapes-contract",
    "bridge.edge.operation-contract-depends-on-rule-contract",
  ]);
  for (const edgeId of requiredDomainSpecEdges) if (!edgeById.has(edgeId)) diagnostics.push({code: "missing-domainspec-link", edge_id: edgeId, message: `The DomainSpec lifecycle view requires ${edgeId}.`});

  const forbiddenPairs = [
    ["financial-settlement.P4", "FS-POST-001"],
    ["financial-settlement.GenerateSettlement", "poker-team.ts.generateSettlementUseCase"],
  ];
  for (const [from, to] of forbiddenPairs) if ([...(ontology.edges ?? [])].some((edge) => edge.from === from && edge.to === to)) diagnostics.push({code: "manufactured-cross-branch-identity", from, to, message: `No direct ${from} to ${to} bridge is currently admissible.`});

  const viewById = new Map();
  for (const view of ontology.views ?? []) {
    if (!view.view_id || viewById.has(view.view_id)) diagnostics.push({code: "duplicate-view", view_id: view.view_id, message: "View IDs must be unique and non-empty."});
    if (!Array.isArray(view.node_ids) || view.node_ids.some((nodeId) => !nodeById.has(nodeId))) diagnostics.push({code: "invalid-view-node", view_id: view.view_id, message: `View ${view.view_id} references an unknown node.`});
    if (!Array.isArray(view.edge_ids) || view.edge_ids.some((edgeId) => !edgeById.has(edgeId))) diagnostics.push({code: "invalid-view-edge", view_id: view.view_id, message: `View ${view.view_id} references an unknown edge.`});
    if (["financial-settlement.box-tour", "financial-settlement.promise-to-proof"].includes(view.view_id)) for (const edgeId of view.edge_ids ?? []) {
      const edge = edgeById.get(edgeId);
      if (edge && (!view.node_ids.includes(edge.from) || !view.node_ids.includes(edge.to))) diagnostics.push({code: "view-edge-endpoint-outside-view", view_id: view.view_id, edge_id: edgeId, message: `Closed ontology view ${view.view_id} must contain both endpoints of ${edgeId}.`});
    }
    if (view.start_node_id && !view.node_ids.includes(view.start_node_id)) diagnostics.push({code: "invalid-view-start", view_id: view.view_id, message: `View ${view.view_id} start is outside the view.`});
    if (view.terminal_node_id && !view.node_ids.includes(view.terminal_node_id)) diagnostics.push({code: "invalid-view-terminal", view_id: view.view_id, message: `View ${view.view_id} terminal is outside the view.`});
    viewById.set(view.view_id, view);
  }
  for (const viewId of requiredViewIds) if (!viewById.has(viewId)) diagnostics.push({code: "missing-required-view", view_id: viewId, message: `Missing required view ${viewId}.`});

  const promiseToProofView = viewById.get("financial-settlement.promise-to-proof");
  const expectedLifecycleStageIds = ["promise", "proof-concerns", "architecture", "code", "evidence", "receipt"];
  const lifecycleStages = promiseToProofView?.stages ?? [];
  if (JSON.stringify(lifecycleStages.map((stage) => stage.stage_id)) !== JSON.stringify(expectedLifecycleStageIds) || lifecycleStages.some((stage, index) => stage.ordinal !== index + 1 || !stage.label || !stage.plain_language || !Array.isArray(stage.node_ids) || stage.node_ids.length === 0)) diagnostics.push({code: "invalid-promise-proof-stages", message: "The promise-to-proof view requires six ordered, explained lifecycle stages."});
  const lifecycleStageNodeIds = lifecycleStages.flatMap((stage) => stage.node_ids ?? []);
  if (new Set(lifecycleStageNodeIds).size !== lifecycleStageNodeIds.length || JSON.stringify([...lifecycleStageNodeIds].sort()) !== JSON.stringify([...(promiseToProofView?.node_ids ?? [])].sort())) diagnostics.push({code: "invalid-promise-proof-stage-membership", message: "Every promise-to-proof node must belong to exactly one lifecycle stage."});
  const lifecycleNodes = (promiseToProofView?.node_ids ?? []).map((nodeId) => nodeById.get(nodeId)).filter(Boolean);
  if (lifecycleNodes.filter((node) => node.type_id === "business.BusinessPromise").length !== 1 || lifecycleNodes.filter((node) => node.type_id === "bridge.ProofConcern").length !== 7 || lifecycleNodes.filter((node) => node.type_id === "bridge.EvidenceStrategy").length !== 8) diagnostics.push({code: "incomplete-promise-proof-model", message: "The lifecycle view requires one promise, seven proof concerns, and eight evidence strategies."});
  const promise = nodeById.get("financial-settlement.promise.pay-player-once");
  if (promise?.type_id !== "business.BusinessPromise" || promise?.artifact_status !== "candidate-business-promise") diagnostics.push({code: "invalid-business-promise", message: "The lifecycle must begin with the candidate plain-language settlement promise."});
  const requiredPlannedStrategyIds = ["strategy.settlement.concurrent-duplicate-check", "strategy.settlement.effect-order-negative-control", "strategy.settlement.retry-recovery-check", "strategy.settlement.load-stress-check"];
  for (const strategyId of requiredPlannedStrategyIds) {
    if (nodeById.get(strategyId)?.artifact_status !== "planned") diagnostics.push({code: "planned-evidence-inflation", node_id: strategyId, message: `${strategyId} must remain planned.`});
    if ([...edgeById.values()].some((edge) => edge.relation_id === "bridge.strategy_uses_artifact" && edge.from === strategyId && strategyId !== "strategy.settlement.effect-order-negative-control")) diagnostics.push({code: "planned-artifact-inflation", node_id: strategyId, message: `${strategyId} may not claim a current evidence artifact.`});
  }
  const ruleArchitecture = nodeById.get("architecture.RuleImplementation");
  const ruleContract = nodeById.get("financial-settlement.RuleImplementationContract");
  if (ruleArchitecture?.properties?.meta_type_id !== "DS-D1.7" || !ruleArchitecture?.properties?.typescript_constraints?.includes("arrow-function") || ruleArchitecture?.properties?.operation_dependency_constraint !== "direct-leaf") diagnostics.push({code: "invalid-rule-architecture-properties", message: "The Rule architecture type must retain its DomainSpec identity, arrow-function constraint, and direct-leaf composition policy."});
  if (ruleContract?.properties?.source_path_pattern !== "^src/domain/rules/[a-z0-9-]+\\.ts$" || ruleContract?.properties?.public_callable_count !== 1 || ruleContract?.properties?.callable_form !== "arrow-function" || ruleContract?.properties?.return_semantics !== "boolean" || ruleContract?.properties?.binding_required !== true) diagnostics.push({code: "invalid-rule-code-contract", message: "The candidate Rule contract must preserve the selected TypeScript structural properties."});
  const requiredLifecycleEdges = [
    "business.edge.promise-refines-to-p4",
    "bridge.edge.promise-decomposes-idempotency",
    "bridge.edge.promise-decomposes-concurrency",
    "bridge.edge.promise-decomposes-recovery",
    "bridge.edge.promise-decomposes-load",
    "bridge.edge.idempotency-checked-by-integration",
    "bridge.edge.concurrency-checked-by-race",
    "bridge.edge.recovery-checked-by-recovery",
    "bridge.edge.load-checked-by-stress",
    "bridge.edge.architecture-strategy-validates-rule-contract",
    "bridge.edge.architecture-strategy-plans-receipt",
  ];
  for (const edgeId of requiredLifecycleEdges) if (!promiseToProofView?.edge_ids.includes(edgeId)) diagnostics.push({code: "missing-promise-proof-link", edge_id: edgeId, message: `The promise-to-proof view requires ${edgeId}.`});
  if (promiseToProofView?.start_node_id !== "financial-settlement.promise.pay-player-once" || promiseToProofView?.terminal_node_id !== "receipt.FS-POST-001") diagnostics.push({code: "invalid-promise-proof-terminals", message: "The lifecycle must start at the business promise and end at the unissued proof receipt."});

  const proofToCodeView = viewById.get("financial-settlement.proof-to-code");
  const semanticTourView = viewById.get("financial-settlement.box-tour");
  const projectionViewNode = nodeById.get("view.financial-settlement.proof-to-code");
  const semanticTourNode = nodeById.get("tour.financial-settlement.proof-to-code");
  if (projectionViewNode?.properties?.selected_graph_view_id !== proofToCodeView?.view_id) diagnostics.push({code: "semantic-tour-view-mismatch", message: "The semantic view node must select the proof-to-code graph view."});
  const semanticTourForEdges = [...edgeById.values()].filter((edge) => edge.relation_id === "projection.tour_for" && edge.from === semanticTourNode?.node_id);
  if (semanticTourForEdges.length !== 1 || semanticTourForEdges[0]?.to !== projectionViewNode?.node_id) diagnostics.push({code: "invalid-semantic-tour-target", message: "The semantic tour must target exactly one ontology view node."});

  const laneNodes = [...nodeById.values()].filter((node) => node.type_id === "projection.ViewLane").sort((left, right) => left.properties?.ordinal - right.properties?.ordinal);
  if (laneNodes.length !== 4 || laneNodes.some((node, index) => node.properties?.ordinal !== index + 1) || JSON.stringify(laneNodes.map((node) => node.properties?.lane_id)) !== JSON.stringify(["business", "domainspec", "bridge", "system"])) diagnostics.push({code: "invalid-semantic-lane-order", message: "The semantic projection requires four uniquely ordered lanes."});
  const hasLaneEdges = [...edgeById.values()].filter((edge) => edge.relation_id === "projection.has_lane" && edge.from === projectionViewNode?.node_id);
  if (hasLaneEdges.length !== 4 || new Set(hasLaneEdges.map((edge) => edge.to)).size !== 4 || laneNodes.some((node) => !hasLaneEdges.some((edge) => edge.to === node.node_id))) diagnostics.push({code: "invalid-semantic-lane-ownership", message: "The ontology view must own each semantic lane exactly once."});
  const laneHandoffEdges = [...edgeById.values()].filter((edge) => edge.relation_id === "projection.hands_to");
  const expectedLaneHandoffs = ["view.lane.business->view.lane.domainspec", "view.lane.domainspec->view.lane.bridge", "view.lane.bridge->view.lane.system"];
  if (laneHandoffEdges.length !== 3 || JSON.stringify(laneHandoffEdges.map((edge) => `${edge.from}->${edge.to}`).sort()) !== JSON.stringify(expectedLaneHandoffs.sort())) diagnostics.push({code: "invalid-semantic-lane-handoffs", message: "The semantic tour requires the three ordered lane handoffs from meaning to system evidence."});

  const laneNodeIds = new Set(laneNodes.map((node) => node.node_id));
  const membershipEdges = [...edgeById.values()].filter((edge) => edge.relation_id === "projection.contains_node" && laneNodeIds.has(edge.from));
  const membershipTargets = membershipEdges.map((edge) => edge.to);
  if (membershipEdges.length !== 20 || new Set(membershipTargets).size !== membershipTargets.length) diagnostics.push({code: "invalid-semantic-lane-membership", message: "The four lanes must contain 20 distinct displayed ontology nodes."});
  for (const edge of membershipEdges) {
    const lane = nodeById.get(edge.from)?.properties?.lane_id;
    const target = nodeById.get(edge.to);
    if (!proofToCodeView?.node_ids.includes(edge.to)) diagnostics.push({code: "semantic-lane-node-outside-view", edge_id: edge.edge_id, message: `${edge.to} is outside the proof-to-code view.`});
    if (typeof target?.reasoning_sentence !== "string" || target.reasoning_sentence.length < 40) diagnostics.push({code: "missing-box-reasoning", node_id: edge.to, message: `${edge.to} requires an ontology-owned reasoning sentence for the guided view.`});
    const laneMatches = lane === "business" ? target?.type_id?.startsWith("business.")
      : lane === "domainspec" ? target?.type_id?.startsWith("domainspec.")
        : lane === "system" ? target?.type_id?.startsWith("system.")
          : lane === "bridge" ? target?.branch === "bridge" && !target?.type_id?.startsWith("domainspec.") && !target?.type_id?.startsWith("projection.")
            : false;
    if (!laneMatches) diagnostics.push({code: "semantic-lane-type-mismatch", edge_id: edge.edge_id, message: `${edge.to} does not belong in the ${lane} lane.`});
  }

  const tourStepNodes = [...nodeById.values()].filter((node) => node.type_id === "projection.TourStep").sort((left, right) => left.properties?.ordinal - right.properties?.ordinal);
  const expectedTourStepIds = ["areas", "box-anatomy", "supported-path", "missing-link"];
  if (tourStepNodes.length !== 4 || tourStepNodes.some((node, index) => node.properties?.ordinal !== index + 1) || JSON.stringify(tourStepNodes.map((node) => node.properties?.tour_step_id)) !== JSON.stringify(expectedTourStepIds)) diagnostics.push({code: "invalid-semantic-tour-step-order", message: "The ontology tour requires four ordered semantic steps."});
  const hasStepEdges = [...edgeById.values()].filter((edge) => edge.relation_id === "projection.has_step" && edge.from === semanticTourNode?.node_id);
  if (hasStepEdges.length !== 4 || new Set(hasStepEdges.map((edge) => edge.to)).size !== 4 || tourStepNodes.some((node) => !hasStepEdges.some((edge) => edge.to === node.node_id))) diagnostics.push({code: "invalid-semantic-tour-step-ownership", message: "The semantic tour must own every step exactly once."});
  const nextStepEdges = [...edgeById.values()].filter((edge) => edge.relation_id === "projection.next_step");
  const expectedNextPairs = tourStepNodes.slice(0, -1).map((node, index) => `${node.node_id}->${tourStepNodes[index + 1]?.node_id}`);
  if (nextStepEdges.length !== 3 || JSON.stringify(nextStepEdges.map((edge) => `${edge.from}->${edge.to}`).sort()) !== JSON.stringify([...expectedNextPairs].sort())) diagnostics.push({code: "invalid-semantic-tour-chain", message: "The semantic tour steps must form one acyclic linear chain."});
  const allowedHighlightModes = new Set(["lanes-only", "nodes-only", "connected-subgraph"]);
  const highlightEdges = [...edgeById.values()].filter((edge) => edge.relation_id === "projection.highlights");
  const expectedHighlightTargets = Object.freeze({
    areas: ["view.lane.business", "view.lane.domainspec", "view.lane.bridge", "view.lane.system"],
    "box-anatomy": ["financial-settlement.GenerateSettlement", "DS-D1.4", "FS-POST-001", "poker-team.test.derived.FS-POST-001", "poker-team.ts.generateSettlementUseCase", "poker-team.ts.decideSettlementSideEffects"],
    "supported-path": ["financial-settlement.GenerateSettlement", "DS-D1.4", "architecture.OperationImplementation", "financial-settlement.OperationImplementationContract"],
    "missing-link": ["financial-settlement.P4", "FS-POST-001", "gap.FS-POST-001-ontology-origin"],
  });
  if (highlightEdges.length !== 17) diagnostics.push({code: "invalid-semantic-tour-highlights", message: "The four steps require exactly 17 semantic highlight relationships."});
  const integrationStatementIds = new Set();
  for (const step of tourStepNodes) {
    if (!allowedHighlightModes.has(step.properties?.highlight_mode)) diagnostics.push({code: "invalid-semantic-highlight-mode", node_id: step.node_id, message: `${step.node_id} has an unsupported highlight mode.`});
    const targets = highlightEdges.filter((edge) => edge.from === step.node_id).map((edge) => edge.to);
    if (JSON.stringify([...targets].sort()) !== JSON.stringify([...(expectedHighlightTargets[step.properties?.tour_step_id] ?? [])].sort())) diagnostics.push({code: "invalid-semantic-step-targets", node_id: step.node_id, message: `${step.node_id} does not highlight its required semantic targets.`});
    for (const target of targets) if (!laneNodeIds.has(target) && !proofToCodeView?.node_ids.includes(target)) diagnostics.push({code: "semantic-highlight-outside-view", node_id: step.node_id, target, message: `${target} is not a lane or proof-to-code node.`});
    const integrationSentences = step.properties?.integration_sentences;
    if (!Array.isArray(integrationSentences) || integrationSentences.length !== 3) diagnostics.push({code: "invalid-semantic-integration-sentences", node_id: step.node_id, message: `${step.node_id} requires exactly three structured integration sentences.`});
    for (const statement of integrationSentences ?? []) {
      if (!statement.statement_id || integrationStatementIds.has(statement.statement_id)) diagnostics.push({code: "duplicate-semantic-integration-statement", node_id: step.node_id, statement_id: statement.statement_id, message: "Integration statement IDs must be unique and non-empty."});
      integrationStatementIds.add(statement.statement_id);
      if (typeof statement.sentence !== "string" || statement.sentence.length < 80) diagnostics.push({code: "incomplete-semantic-integration-sentence", node_id: step.node_id, statement_id: statement.statement_id, message: "Every integration statement requires a complete plain-language sentence."});
      if (!targets.includes(statement.from) || !targets.includes(statement.to)) diagnostics.push({code: "integration-statement-outside-step", node_id: step.node_id, statement_id: statement.statement_id, message: "Each integration sentence must connect subjects highlighted by its tour step."});
      const matchingEdges = [...edgeById.values()].filter((edge) => edge.from === statement.from && edge.relation_id === statement.relation_id && edge.to === statement.to);
      if (statement.posture === "missing-by-design") {
        if (matchingEdges.length !== 0) diagnostics.push({code: "semantic-missing-link-manufactured", node_id: step.node_id, statement_id: statement.statement_id, message: "A missing-by-design integration sentence must not resolve to an ontology edge."});
      } else if (matchingEdges.length !== 1) diagnostics.push({code: "semantic-integration-edge-unresolved", node_id: step.node_id, statement_id: statement.statement_id, message: "A supported integration sentence must resolve to exactly one ontology edge."});
    }
    if (step.properties?.highlight_mode === "connected-subgraph") {
      const targetSet = new Set(targets);
      const derivedEdges = (proofToCodeView?.edge_ids ?? []).map((edgeId) => edgeById.get(edgeId)).filter((edge) => targetSet.has(edge?.from) && targetSet.has(edge?.to));
      const expectedEdgeCount = {"box-anatomy": 3, "supported-path": 3, "missing-link": 2}[step.properties?.tour_step_id];
      if (derivedEdges.length !== expectedEdgeCount) diagnostics.push({code: "invalid-semantic-connected-subgraph", node_id: step.node_id, message: `${step.node_id} must derive ${expectedEdgeCount} existing graph edges from its highlighted nodes.`});
    }
  }
  const missingLinkTargets = new Set(highlightEdges.filter((edge) => edge.from === "tour.step.missing-link").map((edge) => edge.to));
  for (const nodeId of ["financial-settlement.P4", "FS-POST-001", "gap.FS-POST-001-ontology-origin"]) if (!missingLinkTargets.has(nodeId)) diagnostics.push({code: "incomplete-semantic-missing-link", node_id: nodeId, message: "The final semantic tour step must expose both records and their shared origin gap."});
  if (semanticTourView && (semanticTourView.edge_ids.length !== 52 || semanticTourView.node_ids.length !== 30 || semanticTourView.edge_ids.some((edgeId) => !edgeById.get(edgeId)?.relation_id.startsWith("projection.")))) diagnostics.push({code: "invalid-semantic-tour-view", message: "The semantic tour view must contain its 30 projection/content nodes and 52 projection relationships."});

  if (diagnostics.length) throw ontologyError(diagnostics);

  const byBranch = Object.fromEntries([...branchIds].map((branch) => [branch, [...nodeById.values()].filter((node) => node.branch === branch).map((node) => node.node_id)]));
  const views = Object.fromEntries([...viewById].map(([viewId, view]) => [viewId, {
    ...clone(view),
    nodes: view.node_ids.map((nodeId) => clone(nodeById.get(nodeId))),
    edges: view.edge_ids.map((edgeId) => clone(edgeById.get(edgeId))),
  }]));
  return deepFreeze({
    ...clone(ontology),
    source_ref: input.source_ref,
    verification_status: "prototype-unverified",
    counts: {
      sources: sourceById.size,
      node_types: typeById.size,
      nodes: nodeById.size,
      edges: edgeById.size,
      views: viewById.size,
      business_nodes: byBranch.business.length,
      bridge_nodes: byBranch.bridge.length,
      system_nodes: byBranch.system.length,
      evidence_gaps: [...nodeById.values()].filter((node) => node.type_id === "bridge.EvidenceGap").length,
      drift_findings: [...nodeById.values()].filter((node) => node.type_id === "bridge.DriftFinding").length,
    },
    indexes: {by_branch: byBranch},
    resolved_views: views,
  });
};
