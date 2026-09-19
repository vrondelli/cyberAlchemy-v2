import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile, stat} from "node:fs/promises";
import {existsSync} from "node:fs";
import {createRequire} from "node:module";
import {dirname, extname, relative, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";
import {once} from "node:events";
import {createHash} from "node:crypto";
import {BuildImplementationArchitectureTypesProjection} from "./implementation-architecture-types-model.mjs";
import {BuildBusinessOntologyObligationScene} from "./business-ontology-obligation-scene-model.mjs";
import {BuildFinancialSettlementProofLifecycleOntology} from "./financial-settlement-proof-lifecycle-model.mjs";

const experimentRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(experimentRoot, "../../../../..");
const htmlName = "implementation-architecture-types.html";
const sceneName = "examples/financial-settlement-business-to-obligation.scene.json";
const bridgeOntologyName = "examples/financial-settlement-proof-lifecycle.ontology.json";
const expectedSceneStepIds = Object.freeze([
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
const expectedOntologyTourStepIds = Object.freeze(["areas", "box-anatomy", "supported-path", "missing-link"]);
const expectedMappingIds = Object.freeze([
  "DS-D1.3:architecture.EnumImplementation",
  "DS-D1.4:architecture.OperationImplementation",
  "DS-D1.5:architecture.QueryImplementation",
  "DS-D1.7:architecture.RuleImplementation",
  "DS-D1.11:architecture.InterfaceImplementation",
  "DS-D1.14:architecture.StateMachineImplementation",
]);
const expectedRelationIds = Object.freeze([
  "architecture.composed_from",
  "architecture.depends_on",
  "architecture.guards",
  "architecture.exposes",
  "architecture.implements_interface",
]);
const expectedSupportingIds = Object.freeze([
  "architecture.EnumRepresentationUnit",
  "architecture.AdapterImplementation",
]);
const mimeTypes = Object.freeze({
  ".html": "text/html; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
});

const loadSources = async () => {
  const [ontology, metaTypes, scene, bridgeOntology] = await Promise.all([
    readFile(resolve(experimentRoot, "ontology.json"), "utf8").then(JSON.parse),
    readFile(resolve(experimentRoot, "domain-meta-types.projection.json"), "utf8").then(JSON.parse),
    readFile(resolve(experimentRoot, sceneName), "utf8").then(JSON.parse),
    readFile(resolve(experimentRoot, bridgeOntologyName), "utf8").then(JSON.parse),
  ]);
  return {
    ontology: {source_ref: "ontology.json", value: ontology},
    meta_types: {source_ref: "domain-meta-types.projection.json", value: metaTypes},
    scene: {source_ref: sceneName, value: scene},
    bridge_ontology: {source_ref: bridgeOntologyName, value: bridgeOntology},
  };
};

const assertProjectionError = (callback, expectedCode) => {
  assert.throws(callback, (error) => {
    assert.equal(error.code, "IAT_PROJECTION_INVALID");
    assert.ok(error.diagnostics.some((diagnostic) => diagnostic.code === expectedCode));
    return true;
  });
};

const assertSceneError = (callback, expectedCode) => {
  assert.throws(callback, (error) => {
    assert.equal(error.code, "BOO_SCENE_INVALID");
    assert.ok(error.diagnostics.some((diagnostic) => diagnostic.code === expectedCode));
    return true;
  });
};

const assertBridgeOntologyError = (callback, expectedCode) => {
  assert.throws(callback, (error) => {
    assert.equal(error.code, "FS_BRIDGE_ONTOLOGY_INVALID");
    assert.ok(error.diagnostics.some((diagnostic) => diagnostic.code === expectedCode));
    return true;
  });
};

const runModelValidation = async () => {
  const sources = await loadSources();
  const before = JSON.stringify(sources);
  const projectionSources = {ontology: sources.ontology, meta_types: sources.meta_types};
  const first = BuildImplementationArchitectureTypesProjection(projectionSources);
  const second = BuildImplementationArchitectureTypesProjection(projectionSources);
  const firstBridgeOntology = BuildFinancialSettlementProofLifecycleOntology(sources.bridge_ontology);
  const secondBridgeOntology = BuildFinancialSettlementProofLifecycleOntology(sources.bridge_ontology);

  assert.equal(JSON.stringify(sources), before, "projection must not mutate source records");
  assert.deepEqual(first, second, "projection replay must be deterministic");
  assert.deepEqual(firstBridgeOntology, secondBridgeOntology, "bridge ontology replay must be deterministic");
  assert.equal(Object.isFrozen(first), true);
  assert.equal(first.projection_id, "implementation-architecture-types:simple-v1");
  assert.equal(first.verification_status, "prototype-unverified");
  assert.equal(first.authority_effect, "none");
  assert.deepEqual(first.counts, {
    roots: 2,
    reciprocal_mappings: 6,
    supporting_types: 2,
    visible_types: 10,
    relations: 5,
  });
  assert.deepEqual(first.mappings.map((mapping) => mapping.mapping_id), expectedMappingIds);
  assert.deepEqual(first.mappings.map((mapping) => mapping.architecture_type.status), [
    "candidate", "candidate", "candidate", "candidate", "deferred", "blocked",
  ]);
  assert.ok(first.mappings.every((mapping) => mapping.meta_type.maturity === "active"));
  assert.ok(first.mappings.every((mapping) => mapping.mapping_status === "candidate-mapped"));
  assert.deepEqual(first.supporting_types.map((type) => type.id), expectedSupportingIds);
  assert.deepEqual(first.relations.map((relation) => relation.id), expectedRelationIds);
  for (const omittedTypeId of [
    "architecture.ArchitectureProfile",
    "architecture.Constraint",
    "architecture.LanguageProjection",
    "architecture.ObservationProjection",
  ]) assert.equal(first.hierarchy.some((type) => type.id === omittedTypeId), false);

  const adapterSource = sources.ontology.value.concept_types.find((type) => type.concept_id === "architecture.AdapterImplementation");
  assert.equal(adapterSource.canonical_meta_type_ref ?? null, null, "architecture adapter support role must not impersonate the deferred DomainSpec Adapter meta-type");

  const inflated = structuredClone(sources);
  inflated.ontology.value.authority_effect = "promotion-granted";
  assertProjectionError(() => BuildImplementationArchitectureTypesProjection(inflated), "authority-inflation");

  const missingRoot = structuredClone(sources);
  missingRoot.ontology.value.concept_types = missingRoot.ontology.value.concept_types.filter((type) => type.concept_id !== "architecture.ArchitectureElement");
  assertProjectionError(() => BuildImplementationArchitectureTypesProjection(missingRoot), "missing-root-type");

  const nonReciprocal = structuredClone(sources);
  nonReciprocal.ontology.value.concept_types.find((type) => type.concept_id === "architecture.RuleImplementation").canonical_meta_type_ref = "DS-D1.4";
  assertProjectionError(() => BuildImplementationArchitectureTypesProjection(nonReciprocal), "reciprocal-mapping-mismatch");

  assert.equal(firstBridgeOntology.ontology_id, "financial-settlement.proof-lifecycle");
  assert.equal(firstBridgeOntology.ontology_type, "business-system-bridge");
  assert.equal(firstBridgeOntology.authority_effect, "none");
  assert.deepEqual(firstBridgeOntology.counts, {sources: 11, node_types: 21, nodes: 62, edges: 155, views: 4, business_nodes: 6, bridge_nodes: 46, system_nodes: 10, evidence_gaps: 4, drift_findings: 2});
  const promiseToProofView = firstBridgeOntology.resolved_views["financial-settlement.promise-to-proof"];
  assert.equal(promiseToProofView.nodes.length, 41);
  assert.equal(promiseToProofView.edges.length, 74);
  assert.deepEqual(promiseToProofView.stages.map((stage) => stage.stage_id), ["promise", "proof-concerns", "architecture", "code", "evidence", "receipt"]);
  assert.equal(promiseToProofView.nodes.filter((node) => node.type_id === "bridge.ProofConcern").length, 7);
  assert.equal(promiseToProofView.nodes.filter((node) => node.type_id === "bridge.EvidenceStrategy").length, 8);
  assert.equal(promiseToProofView.nodes.find((node) => node.node_id === "strategy.settlement.concurrent-duplicate-check").artifact_status, "planned");
  assert.equal(promiseToProofView.nodes.find((node) => node.node_id === "strategy.settlement.architecture-conformance").properties.evidence_posture, "evaluator-exists-adapter-missing");
  assert.equal(promiseToProofView.edges.some((edge) => edge.edge_id === "bridge.edge.operation-contract-depends-on-rule-contract" && edge.properties.dependency_resolution === "direct-leaf"), true);
  assert.equal(firstBridgeOntology.resolved_views["financial-settlement.proof-to-code"].edges.some((edge) => edge.edge_id === "domainspec.edge.generation-classified-operation"), true);
  assert.equal(firstBridgeOntology.resolved_views["financial-settlement.proof-to-code"].edges.some((edge) => edge.edge_id === "bridge.edge.operation-meta-type-maps-to-architecture"), true);
  assert.equal(firstBridgeOntology.resolved_views["financial-settlement.proof-to-code"].edges.some((edge) => edge.from === "financial-settlement.P4" && edge.to === "FS-POST-001"), false);
  assert.equal(firstBridgeOntology.resolved_views["financial-settlement.proof-to-code"].edges.some((edge) => edge.from === "financial-settlement.GenerateSettlement" && edge.to === "poker-team.ts.generateSettlementUseCase"), false);

  const firstScene = BuildBusinessOntologyObligationScene({scene: sources.scene, implementation_projection: first, bridge_ontology: firstBridgeOntology});
  const secondScene = BuildBusinessOntologyObligationScene({scene: sources.scene, implementation_projection: first, bridge_ontology: firstBridgeOntology});
  assert.deepEqual(firstScene, secondScene, "scene replay must be deterministic");
  assert.equal(Object.isFrozen(firstScene), true);
  assert.equal(firstScene.authority_effect, "none");
  assert.equal(firstScene.verification_status, "prototype-unverified");
  assert.deepEqual(firstScene.steps.map((step) => step.step_id), expectedSceneStepIds);
  assert.deepEqual(firstScene.counts, {steps: 11, authored_nodes: 7, authored_edges: 5, minted_nodes: 4, minted_edges: 3, obligations: 79, implementation_coverage_rows: 7, ontology_nodes: 25, ontology_edges: 36, ontology_lifecycle_nodes: 41, ontology_lifecycle_edges: 74, ontology_lifecycle_stages: 6, ontology_domainspec_nodes: 3, ontology_tour_steps: 4, ontology_gaps: 4, ontology_drift_findings: 2});
  assert.equal(firstScene.ontology_lifecycle_view.view_id, "financial-settlement.promise-to-proof");
  assert.equal(Object.hasOwn(firstScene.proof_to_code, "graph_tour"), false);
  assert.equal(firstScene.ontology_tour.tour_node_id, "tour.financial-settlement.proof-to-code");
  assert.equal(firstScene.ontology_tour.ontology_tour_view_id, "financial-settlement.box-tour");
  assert.deepEqual(firstScene.ontology_tour.lanes.map((lane) => lane.lane_id), ["business", "domainspec", "bridge", "system"]);
  assert.equal(firstScene.ontology_tour.lanes.flatMap((lane) => lane.node_ids).length, 20);
  assert.deepEqual(firstScene.ontology_tour.steps.map((step) => step.tour_step_id), expectedOntologyTourStepIds);
  assert.deepEqual(firstScene.ontology_tour.steps.map((step) => step.integration_sentences.length), [3, 3, 3, 3]);
  assert.equal(firstScene.ontology_tour.steps.flatMap((step) => step.integration_sentences).filter((statement) => statement.edge_id !== null).length, 11);
  assert.equal(firstScene.ontology_tour.steps.flatMap((step) => step.integration_sentences).find((statement) => statement.posture === "missing-by-design").edge_id, null);
  assert.equal(firstScene.ontology_view.nodes.filter((node) => firstScene.ontology_tour.lanes.flatMap((lane) => lane.node_ids).includes(node.node_id)).every((node) => node.reasoning_sentence.length >= 40), true);
  assert.deepEqual(firstScene.ontology_tour.steps.find((step) => step.tour_step_id === "supported-path").edge_ids, ["domainspec.edge.generation-classified-operation", "bridge.edge.operation-meta-type-maps-to-architecture", "bridge.edge.operation-architecture-shapes-contract"]);
  assert.equal(firstScene.ontology.ontology_id, "financial-settlement.proof-lifecycle");
  assert.equal(firstScene.ontology_view.view_id, "financial-settlement.proof-to-code");
  assert.equal(firstScene.graph_planes.obligation_read_model.highlighted_obligation.id, "FS-POST-001");
  assert.equal(firstScene.graph_planes.obligation_read_model.tiers.reduce((sum, tier) => sum + tier.count, 0), 79);
  assert.equal(firstScene.implementation_coverage.some((coverage) => coverage.concept_type === "Obligation"), false);
  assert.equal(firstScene.proof_to_code.proof_plan.full_obligation_status, "not-proven");
  assert.equal(firstScene.proof_to_code.proof_plan.binding_status, "missing");
  assert.equal(firstScene.proof_to_code.code_realization.generation_status, "not-generated-from-ontology");
  assert.equal(firstScene.proof_to_code.verification.negative_control.expected_verdict, "fail-full-p4");
  assert.match(firstScene.proof_boundary, /full obligation remains skipped and unbound/);
  for (const source of firstScene.source_refs) {
    const bytes = await readFile(resolve(repositoryRoot, source.path));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), source.sha256, `scene source digest drift: ${source.path}`);
  }
  for (const source of firstBridgeOntology.source_refs) {
    const bytes = await readFile(resolve(repositoryRoot, source.path));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), source.sha256, `bridge ontology source digest drift: ${source.path}`);
  }

  const collapsedObligation = structuredClone(sources.scene);
  collapsedObligation.value.implementation_coverage.push({concept_type: "Obligation", meta_type_id: "Obligation", coverage: "unsupported", architecture_type_id: null});
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: collapsedObligation, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "obligation-meta-type-collapse");
  const wrongTierTotal = structuredClone(sources.scene);
  wrongTierTotal.value.graph_planes.obligation_read_model.tiers[0].count = 23;
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: wrongTierTotal, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "obligation-count-mismatch");
  const inflatedScene = structuredClone(sources.scene);
  inflatedScene.value.authority_effect = "promotion-granted";
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: inflatedScene, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "authority-inflation");
  const missingAudienceLanguage = structuredClone(sources.scene);
  delete missingAudienceLanguage.value.graph_planes.minted_semantic_read_model.nodes[0].display_label;
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: missingAudienceLanguage, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "missing-audience-language");
  const invalidModelingFocus = structuredClone(sources.scene);
  invalidModelingFocus.value.graph_planes.minted_semantic_read_model.modeling_focus.next_node_id = "missing.business.idea";
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: invalidModelingFocus, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "invalid-modeling-focus");
  const inflatedProof = structuredClone(sources.scene);
  inflatedProof.value.proof_to_code.proof_plan.full_obligation_status = "proven";
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: inflatedProof, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "unsupported-proof-claim");
  const inventedGeneration = structuredClone(sources.scene);
  inventedGeneration.value.proof_to_code.code_realization.generation_status = "generated-from-ontology";
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: inventedGeneration, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "unsupported-generation-claim");
  const missingNegativeControl = structuredClone(sources.scene);
  delete missingNegativeControl.value.proof_to_code.verification.negative_control;
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: missingNegativeControl, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "missing-proof-negative-control");
  const sceneOwnedTour = structuredClone(sources.scene);
  sceneOwnedTour.value.proof_to_code.graph_tour = {steps: []};
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: sceneOwnedTour, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "scene-owned-semantic-tour");
  const missingTourView = structuredClone(sources.scene);
  missingTourView.value.proof_to_code.ontology_tour_view_id = "missing.semantic.tour";
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: missingTourView, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "missing-semantic-tour-view");
  const missingLifecycleView = structuredClone(sources.scene);
  missingLifecycleView.value.proof_to_code.ontology_lifecycle_view_id = "missing.lifecycle.view";
  assertSceneError(() => BuildBusinessOntologyObligationScene({scene: missingLifecycleView, implementation_projection: first, bridge_ontology: firstBridgeOntology}), "missing-ontology-lifecycle-view");

  const danglingBridgeEdge = structuredClone(sources.bridge_ontology);
  danglingBridgeEdge.value.edges[0].to = "missing.node";
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(danglingBridgeEdge), "dangling-edge");
  const oneSidedBridgeEvidence = structuredClone(sources.bridge_ontology);
  oneSidedBridgeEvidence.value.edges.find((edge) => edge.edge_id === "bridge.edge.fs-post-001-represented-by-skipped-test").evidence_refs = ["system.derived-tests"];
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(oneSidedBridgeEvidence), "one-sided-bridge-evidence");
  const inventedBridgeProof = structuredClone(sources.bridge_ontology);
  inventedBridgeProof.value.nodes.find((node) => node.node_id === "receipt.FS-POST-001").properties.proof_status = "proven";
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(inventedBridgeProof), "unsupported-proof-claim");
  const manufacturedIdentity = structuredClone(sources.bridge_ontology);
  manufacturedIdentity.value.relation_definitions.push({relation_id: "bridge.traced_to", source_types: ["business.FormalClause"], target_types: ["bridge.ProofObligation"], cross_branch: true});
  manufacturedIdentity.value.edges.push({edge_id: "invented", relation_id: "bridge.traced_to", from: "financial-settlement.P4", to: "FS-POST-001", status: "invented", evidence_refs: ["business.semantic-graph", "system.derived-tests"], authority_effect: "none"});
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(manufacturedIdentity), "unsupported-bridge-relation");
  const missingDomainSpecLink = structuredClone(sources.bridge_ontology);
  missingDomainSpecLink.value.edges = missingDomainSpecLink.value.edges.filter((edge) => edge.edge_id !== "domainspec.edge.generation-classified-operation");
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(missingDomainSpecLink), "missing-domainspec-link");
  const mismatchedDomainSpecKind = structuredClone(sources.bridge_ontology);
  mismatchedDomainSpecKind.value.edges.find((edge) => edge.edge_id === "domainspec.edge.generation-classified-operation").to = "DS-D1.12";
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(mismatchedDomainSpecKind), "domainspec-kind-mismatch");
  const unsupportedDomainSpecMapping = structuredClone(sources.bridge_ontology);
  unsupportedDomainSpecMapping.value.edges.find((edge) => edge.edge_id === "bridge.edge.operation-meta-type-maps-to-architecture").from = "DS-D1.6";
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(unsupportedDomainSpecMapping), "unsupported-candidate-mapping");
  const duplicateLaneMembership = structuredClone(sources.bridge_ontology);
  duplicateLaneMembership.value.edges.find((edge) => edge.edge_id === "projection.edge.business-lane-contains-p4").to = "financial-settlement.GenerateSettlement";
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(duplicateLaneMembership), "invalid-semantic-lane-membership");
  const brokenTourChain = structuredClone(sources.bridge_ontology);
  brokenTourChain.value.edges.find((edge) => edge.edge_id === "projection.edge.areas-next-box-anatomy").to = "tour.step.supported-path";
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(brokenTourChain), "invalid-semantic-tour-chain");
  const offViewTourHighlight = structuredClone(sources.bridge_ontology);
  offViewTourHighlight.value.edges.find((edge) => edge.edge_id === "projection.edge.box-anatomy-highlights-generate-settlement").to = "financial-settlement.DealSplitCalculation";
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(offViewTourHighlight), "semantic-highlight-outside-view");
  const missingBoxReasoning = structuredClone(sources.bridge_ontology);
  delete missingBoxReasoning.value.nodes.find((node) => node.node_id === "FS-POST-001").reasoning_sentence;
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(missingBoxReasoning), "missing-box-reasoning");
  const unresolvedIntegrationSentence = structuredClone(sources.bridge_ontology);
  unresolvedIntegrationSentence.value.nodes.find((node) => node.node_id === "tour.step.supported-path").properties.integration_sentences[1].relation_id = "business.produces";
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(unresolvedIntegrationSentence), "semantic-integration-edge-unresolved");
  const inflatedPlannedStrategy = structuredClone(sources.bridge_ontology);
  inflatedPlannedStrategy.value.nodes.find((node) => node.node_id === "strategy.settlement.concurrent-duplicate-check").artifact_status = "current-executable";
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(inflatedPlannedStrategy), "planned-evidence-inflation");
  const incompleteLifecycleStages = structuredClone(sources.bridge_ontology);
  incompleteLifecycleStages.value.views.find((view) => view.view_id === "financial-settlement.promise-to-proof").stages[1].node_ids.pop();
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(incompleteLifecycleStages), "invalid-promise-proof-stage-membership");
  const weakenedRuleContract = structuredClone(sources.bridge_ontology);
  weakenedRuleContract.value.nodes.find((node) => node.node_id === "financial-settlement.RuleImplementationContract").properties.callable_form = "function-declaration";
  assertBridgeOntologyError(() => BuildFinancialSettlementProofLifecycleOntology(weakenedRuleContract), "invalid-rule-code-contract");

  return {
    projection_id: first.projection_id,
    counts: first.counts,
    scene_id: firstScene.scene_id,
    scene_counts: firstScene.counts,
    bridge_ontology_id: firstBridgeOntology.ontology_id,
    bridge_ontology_counts: firstBridgeOntology.counts,
    source_digests: "verified",
    source_mutated: false,
    deterministic_replay: true,
    negative_controls: ["authority-inflation", "missing-root-type", "reciprocal-mapping-mismatch", "obligation-meta-type-collapse", "obligation-count-mismatch", "scene-authority-inflation", "missing-audience-language", "invalid-modeling-focus", "unsupported-proof-claim", "unsupported-generation-claim", "missing-proof-negative-control", "scene-owned-semantic-tour", "missing-semantic-tour-view", "missing-ontology-lifecycle-view", "dangling-ontology-edge", "one-sided-bridge-evidence", "manufactured-cross-branch-identity", "missing-domainspec-link", "domainspec-kind-mismatch", "unsupported-candidate-mapping", "duplicate-semantic-lane-membership", "broken-semantic-tour-chain", "off-view-semantic-highlight", "missing-box-reasoning", "unresolved-semantic-integration-sentence", "planned-evidence-inflation", "invalid-promise-proof-stage-membership", "invalid-rule-code-contract"],
  };
};

const safePath = (requestPath) => {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const requested = decoded === "/" ? `/${htmlName}` : decoded;
  const candidate = resolve(experimentRoot, `.${requested}`);
  const rel = relative(experimentRoot, candidate);
  if (rel === ".." || rel.startsWith(`..${sep}`) || rel.startsWith("/")) return null;
  return candidate;
};

const createStaticServer = (requestLog) => createServer(async (request, response) => {
  try {
    if (!request.url || !["GET", "HEAD"].includes(request.method ?? "")) {
      response.writeHead(405).end();
      return;
    }
    const requestUrl = new URL(request.url, "http://127.0.0.1");
    if (requestUrl.pathname === "/favicon.ico") {
      requestLog.push(requestUrl.pathname);
      response.writeHead(204, {"cache-control": "no-store"}).end();
      return;
    }
    const target = safePath(request.url);
    if (!target || !existsSync(target) || !(await stat(target)).isFile()) {
      response.writeHead(404, {"content-type": "text/plain; charset=utf-8"}).end("not found");
      return;
    }
    requestLog.push(requestUrl.pathname);
    const body = await readFile(target);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(target)] ?? "application/octet-stream",
      "cache-control": "no-store",
      "content-length": body.length,
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    response.writeHead(500, {"content-type": "text/plain; charset=utf-8"}).end(error.message);
  }
});

const closeServer = async (server) => {
  if (!server.listening) return;
  await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
};

const runBrowserValidation = async () => {
  const globalRoot = execFileSync("npm", ["root", "-g"], {encoding: "utf8"}).trim();
  const require = createRequire(import.meta.url);
  const playwright = require(resolve(globalRoot, "playwright"));
  const executablePath = playwright.chromium.executablePath();
  assert.ok(existsSync(executablePath), `Chromium executable missing: ${executablePath}`);

  const requestLog = [];
  const browserRequests = [];
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];
  const server = createStaticServer(requestLog);
  let browser;
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const origin = `http://127.0.0.1:${address.port}`;
    browser = await playwright.chromium.launch({headless: true, executablePath});
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    page.on("request", (request) => browserRequests.push(request.url()));
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => { if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`); });

    await page.goto(`${origin}/${htmlName}`, {waitUntil: "networkidle"});
    await page.waitForFunction(() => window.__IAT_STATIC_RECEIPT__?.ready === true);
    await page.waitForFunction(() => window.__IAT_SCENE_STATIC_RECEIPT__?.ready === true);
    const receipt = await page.evaluate(() => window.__IAT_STATIC_RECEIPT__);
    const sceneStaticReceipt = await page.evaluate(() => window.__IAT_SCENE_STATIC_RECEIPT__);
    assert.equal(await page.title(), "DomainSpec Implementation Architecture Types");
    assert.equal(receipt.projection_id, "implementation-architecture-types:simple-v1");
    assert.equal(receipt.verification_status, "prototype-unverified");
    assert.equal(receipt.authority_effect, "none");
    assert.deepEqual(receipt.counts, {roots: 2, reciprocal_mappings: 6, supporting_types: 2, visible_types: 10, relations: 5});
    assert.deepEqual(receipt.mapping_ids, expectedMappingIds);
    assert.deepEqual(receipt.relation_ids, expectedRelationIds);
    assert.equal(await page.locator(".root-card").count(), 2);
    assert.equal(await page.locator("[data-mapping-id]").count(), 6);
    assert.equal(await page.locator("[data-type-id]").count(), 2);
    assert.equal(await page.locator("[data-relation-id]").count(), 5);
    assert.equal(await page.locator("#loading").isVisible(), false);
    assert.equal(await page.locator("#content").isVisible(), true);
    assert.equal(await page.locator("#mapping-count").textContent(), "6");
    assert.equal(await page.locator("#support-count").textContent(), "2");
    assert.equal(await page.locator("#relation-count").textContent(), "5");
    assert.equal(sceneStaticReceipt.scene_id, "financial-settlement:business-to-proof-to-code");
    assert.equal(sceneStaticReceipt.ontology_id, "financial-settlement.proof-lifecycle");
    assert.equal(sceneStaticReceipt.ontology_type, "business-system-bridge");
    assert.equal(sceneStaticReceipt.ontology_view_id, "financial-settlement.proof-to-code");
    assert.equal(sceneStaticReceipt.ontology_lifecycle_view_id, "financial-settlement.promise-to-proof");
    assert.deepEqual(sceneStaticReceipt.ontology_lifecycle_stage_ids, ["promise", "proof-concerns", "architecture", "code", "evidence", "receipt"]);
    assert.equal(sceneStaticReceipt.semantic_tour_view_id, "financial-settlement.box-tour");
    assert.equal(sceneStaticReceipt.semantic_tour_node_id, "tour.financial-settlement.proof-to-code");
    assert.equal(sceneStaticReceipt.authority_effect, "none");
    assert.equal(sceneStaticReceipt.verification_status, "prototype-unverified");
    assert.deepEqual(sceneStaticReceipt.step_ids, expectedSceneStepIds);
    assert.deepEqual(sceneStaticReceipt.ontology_tour_step_ids, expectedOntologyTourStepIds);
    assert.deepEqual(sceneStaticReceipt.ontology_tour_step_node_ids, ["tour.step.areas", "tour.step.box-anatomy", "tour.step.supported-path", "tour.step.missing-link"]);
    assert.deepEqual(sceneStaticReceipt.counts, {steps: 11, authored_nodes: 7, authored_edges: 5, minted_nodes: 4, minted_edges: 3, obligations: 79, implementation_coverage_rows: 7, ontology_nodes: 25, ontology_edges: 36, ontology_lifecycle_nodes: 41, ontology_lifecycle_edges: 74, ontology_lifecycle_stages: 6, ontology_domainspec_nodes: 3, ontology_tour_steps: 4, ontology_gaps: 4, ontology_drift_findings: 2});
    assert.equal(await page.locator("#scene-player").isVisible(), false);
    await page.locator("#scene-start").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "business-meaning");
    assert.equal(await page.locator("#scene-start").isVisible(), false);
    assert.match(await page.locator(".scene-quote").textContent(), /pay them once and keep a clear record/);
    assert.equal(await page.locator(".scene-evidence").first().isVisible(), true);
    assert.equal(await page.locator(".scene-evidence").first().locator("code").isVisible(), false);
    await page.locator("#scene-next").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "typed-business-neighborhood");
    assert.equal(await page.locator("[data-business-graph-node]").count(), 5);
    assert.equal(await page.locator("[data-business-graph-edge]").count(), 4);
    assert.equal(await page.locator('[data-business-graph-edge^="financial-settlement.edge."]').count(), 3);
    assert.equal(await page.locator('[data-modeling-focus="next"]').count(), 1);
    assert.match(await page.locator('[data-modeling-focus="next"]').innerText(), /next modeling move/i);
    assert.match(await page.locator(".business-model-next").textContent(), /next thing to model/);
    assert.match(await page.locator("#scene-visual").innerText(), /Decide whether payment is allowed/);
    assert.doesNotMatch(await page.locator("#scene-visual").innerText(), /financial-settlement/);
    await page.locator("#scene-next").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "formal-clause");
    assert.equal(await page.locator(".scene-formula-card").count(), 3);
    assert.match(await page.locator("#scene-visual").innerText(), /The player has money to receive/);
    assert.doesNotMatch(await page.locator("#scene-visual").innerText(), /pre\.total_payout/);
    await page.locator("#scene-next").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "derived-obligation");
    assert.match(await page.locator(".scene-obligation").textContent(), /Pay once, never twice/);
    assert.match(await page.locator(".scene-trace-arrow").textContent(), /test derivation creates a check/);
    await page.locator("#scene-next").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "obligation-constellation");
    assert.equal(await page.locator(".scene-tier").count(), 3);
    assert.match(await page.locator("#scene-visual").innerText(), /79 promises to check/);
    await page.locator("#scene-next").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "separate-graph-planes");
    assert.equal(await page.locator("[data-plane-id]").count(), 3);
    assert.match(await page.locator(".scene-plane-warning").textContent(), /none can replace the others/);
    assert.doesNotMatch(await page.locator("#scene-visual").innerText(), /generated-semantic-read-model/);
    await page.locator("#scene-player").press("ArrowRight");
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "proof-plan" && window.__IAT_SCENE_RECEIPT__?.activation === "keyboard");
    assert.equal(await page.locator("[data-ontology-lane]").count(), 4);
    assert.equal(await page.locator('[data-ontology-lane="domainspec"]').count(), 1);
    assert.equal(await page.locator("[data-ontology-node]").count(), 20);
    assert.equal(await page.locator("[data-ontology-edge]").count(), 14);
    assert.equal(await page.locator("[data-ontology-node]").evaluateAll((nodes) => nodes.every((node) => node.tagName === "BUTTON")), true);
    assert.equal(await page.locator("[data-lifecycle-stage]").count(), 6);
    assert.deepEqual(await page.locator("[data-lifecycle-stage]").evaluateAll((stages) => stages.map((stage) => stage.dataset.lifecycleStage)), ["promise", "proof-concerns", "architecture", "code", "evidence", "receipt"]);
    assert.match(await page.locator('[data-lifecycle-stage="promise"]').innerText(), /Pay the player once/i);
    assert.match(await page.locator('[data-lifecycle-stage="proof-concerns"]').innerText(), /Simultaneous requests still pay once/i);
    assert.match(await page.locator('[data-lifecycle-stage="architecture"]').innerText(), /Rule implementation shape/i);
    assert.match(await page.locator('[data-lifecycle-stage="evidence"]').innerText(), /Concurrent duplicate race/i);
    assert.match(await page.locator('[data-lifecycle-stage="receipt"]').innerText(), /proof receipt/i);
    assert.match(await page.locator(".ontology-graph-summary").innerText(), /20 shown of 25 ontology nodes/i);
    assert.match(await page.locator(".ontology-graph-summary").innerText(), /Lifecycle: 41 nodes · 74 edges/i);
    assert.match(await page.locator(".ontology-origin-warning").innerText(), /separates the promise, proof concerns, architecture properties, handwritten code, evidence methods, and receipt/i);
    assert.match(await page.locator(".ontology-origin-warning").innerText(), /concurrency, recovery, and load checks remain planned/i);
    assert.doesNotMatch(await page.locator("#scene-visual").innerText(), /operations\.md/);
    const ontologyTourStart = page.locator("[data-ontology-tour-start]");
    await ontologyTourStart.click();
    await page.waitForFunction(() => window.__IAT_ONTOLOGY_TOUR_RECEIPT__?.step_id === "areas");
    assert.equal((await page.evaluate(() => window.__IAT_ONTOLOGY_TOUR_RECEIPT__)).semantic_tour_node_id, "tour.financial-settlement.proof-to-code");
    assert.equal(await page.locator("[data-ontology-tour-panel]").isVisible(), true);
    assert.equal(await page.locator("[data-ontology-tour-panel]").evaluate((element) => element === document.activeElement), true);
    assert.equal(await page.locator('[data-ontology-lane].is-tour-focus').count(), 4);
    assert.equal(await page.locator("[data-ontology-tour-integration] li").count(), 3);
    assert.match(await page.locator("[data-ontology-tour-integration]").innerText(), /Business meaning supplies the promise/i);
    assert.equal((await page.evaluate(() => window.__IAT_SCENE_RECEIPT__)).step_id, "proof-plan");
    await page.locator("[data-ontology-tour-panel]").press("ArrowRight");
    await page.waitForFunction(() => window.__IAT_ONTOLOGY_TOUR_RECEIPT__?.step_id === "box-anatomy" && window.__IAT_ONTOLOGY_TOUR_RECEIPT__?.activation === "keyboard");
    assert.equal(await page.locator("[data-ontology-node].is-tour-focus").count(), 6);
    assert.equal(await page.locator("[data-ontology-edge].is-tour-focus").count(), 3);
    assert.equal(await page.locator("[data-ontology-tour-integration] li").count(), 3);
    assert.match(await page.locator("[data-ontology-tour-integration]").innerText(), /coverage intent rather than proof/i);
    assert.match(await page.locator("[data-ontology-tour-description]").innerText(), /three real relationships/i);
    await page.locator("[data-ontology-tour-next]").click();
    await page.waitForFunction(() => window.__IAT_ONTOLOGY_TOUR_RECEIPT__?.step_id === "supported-path");
    assert.equal(await page.locator("[data-ontology-node].is-tour-focus").count(), 4);
    assert.equal(await page.locator("[data-ontology-edge].is-tour-focus").count(), 3);
    assert.equal(await page.locator("[data-ontology-tour-integration] li").count(), 3);
    await page.locator("[data-ontology-tour-next]").click();
    await page.waitForFunction(() => window.__IAT_ONTOLOGY_TOUR_RECEIPT__?.step_id === "missing-link");
    assert.equal(await page.locator("[data-ontology-node].is-tour-focus").count(), 3);
    assert.equal(await page.locator("[data-ontology-edge].is-tour-focus").count(), 2);
    assert.equal(await page.locator("[data-ontology-tour-integration] li").count(), 3);
    assert.match(await page.locator("[data-ontology-tour-integration]").innerText(), /do not integrate directly today/i);
    assert.match(await page.locator("[data-ontology-tour-integration]").innerText(), /↛/);
    assert.deepEqual((await page.evaluate(() => window.__IAT_ONTOLOGY_TOUR_RECEIPT__)).integration_edge_ids, ["bridge.edge.p4-has-origin-gap", "bridge.edge.fs-post-001-has-origin-gap", null]);
    assert.equal(await page.locator('[data-ontology-edge][data-ontology-edge*="traced"]').count(), 0);
    await page.locator("[data-ontology-tour-panel]").press("Escape");
    await page.waitForFunction(() => window.__IAT_ONTOLOGY_TOUR_RECEIPT__?.active === false && window.__IAT_ONTOLOGY_TOUR_RECEIPT__?.activation === "escape");
    assert.equal(await ontologyTourStart.evaluate((element) => element === document.activeElement), true);
    const obligationBox = page.locator('[data-ontology-node="FS-POST-001"]');
    await obligationBox.click();
    await page.waitForFunction(() => window.__IAT_ONTOLOGY_NODE_RECEIPT__?.node_id === "FS-POST-001" && window.__IAT_ONTOLOGY_NODE_RECEIPT__?.open === true);
    assert.equal(await page.locator("#ontology-node-details").isVisible(), true);
    assert.equal(await page.locator("#ontology-node-close").evaluate((element) => element === document.activeElement), true);
    assert.match(await page.locator("#ontology-node-meaning").innerText(), /first eligible payout/i);
    assert.match(await page.locator("#ontology-node-reasoning").innerText(), /question that evidence must answer/i);
    assert.match(await page.locator("#ontology-node-boundary").innerText(), /not a DomainSpec meta-type/i);
    await page.locator("#ontology-node-close").click();
    assert.equal(await obligationBox.evaluate((element) => element === document.activeElement), true);
    await page.locator("#scene-next").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "implementation-architecture");
    assert.match(await page.locator("#scene-visual").innerText(), /Obligation is not a code type/);
    assert.doesNotMatch(await page.locator("#scene-visual").innerText(), /architecture\./);
    await page.locator("#scene-next").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "code-realization");
    assert.match(await page.locator(".scene-code-shell").innerText(), /shouldCreatePayout/);
    assert.match(await page.locator(".scene-code-warning").innerText(), /does not yet guarantee the complete promise/);
    assert.match(await page.locator("#scene-visual").innerText(), /did not generate these lines/);
    await page.locator("#scene-next").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "proof-execution");
    assert.equal(await page.locator("[data-proof-check]").count(), 5);
    assert.match(await page.locator(".scene-negative-control").innerText(), /full P4 proof must fail/i);
    await page.locator("#scene-next").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "evidence-verdict");
    assert.match(await page.locator(".scene-verdict-status").innerText(), /Partial, not proven/);
    assert.match(await page.locator("#scene-visual").innerText(), /No proof receipt exists/);
    assert.equal(await page.locator("#scene-next").isDisabled(), true);
    await page.locator("#scene-close").click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.active === false);
    assert.equal(await page.locator("#scene-start").isVisible(), true);
    assert.equal(await page.locator("#scene-start").evaluate((element) => element === document.activeElement), true);

    const stateMachineCard = page.locator('[data-mapping-id="DS-D1.14:architecture.StateMachineImplementation"]');
    await stateMachineCard.click();
    await page.waitForFunction(() => window.__IAT_DETAILS_RECEIPT__?.open === true);
    assert.equal(await page.locator("#details").isVisible(), true);
    assert.equal(await page.locator("#details-close").evaluate((element) => element === document.activeElement), true);
    assert.match(await page.locator("#details-status").textContent(), /active; mapping: candidate-mapped; architecture realization: blocked/);
    assert.match(await page.locator("#details-warning").textContent(), /Static exhaustiveness is not runtime transition correctness/);
    await page.locator("#details-close").click();
    await page.waitForFunction(() => window.__IAT_DETAILS_RECEIPT__?.open === false);
    assert.equal(await stateMachineCard.evaluate((element) => element === document.activeElement), true);

    await page.setViewportSize({width: 390, height: 844});
    const mobileCards = await page.locator("[data-mapping-id]").evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().x)));
    assert.equal(new Set(mobileCards).size, 1, "mobile mappings must use one column");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `mobile page has ${overflow}px horizontal overflow`);
    await page.locator('[data-mapping-id="DS-D1.11:architecture.InterfaceImplementation"]').click();
    const modalBounds = await page.locator("#details").evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {left: box.left, right: box.right, top: box.top, bottom: box.bottom};
    });
    assert.ok(modalBounds.left >= 0 && modalBounds.right <= 390 && modalBounds.top >= 0 && modalBounds.bottom <= 844);
    assert.match(await page.locator("#details-status").textContent(), /architecture realization: deferred/);
    await page.locator("#details-close").click();
    await page.locator("#scene-start").click();
    await page.locator('.scene-dot[aria-label^="Go to part 6:"]').click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "separate-graph-planes");
    assert.equal(await page.locator("[data-plane-id]").count(), 3);
    const sceneOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(sceneOverflow <= 1, `mobile scene has ${sceneOverflow}px horizontal overflow`);
    await page.locator('.scene-dot[aria-label^="Go to part 7:"]').click();
    await page.waitForFunction(() => window.__IAT_SCENE_RECEIPT__?.step_id === "proof-plan");
    await page.locator("[data-ontology-tour-start]").click();
    await page.waitForFunction(() => window.__IAT_ONTOLOGY_TOUR_RECEIPT__?.step_id === "areas");
    const mobileTourBounds = await page.locator("[data-ontology-tour-panel]").evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {left: box.left, right: box.right, width: box.width};
    });
    assert.ok(mobileTourBounds.left >= 0 && mobileTourBounds.right <= 390 && mobileTourBounds.width > 0);
    assert.equal(await page.locator('[data-ontology-lane="business"].is-tour-focus').count(), 1);
    const tourOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(tourOverflow <= 1, `mobile ontology tour has ${tourOverflow}px horizontal overflow`);
    await page.locator("[data-ontology-tour-panel]").press("Escape");

    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(failedResponses, []);
    assert.ok(browserRequests.every((url) => url.startsWith(origin)), "browser must not make external requests");
    for (const requiredPath of [`/${htmlName}`, "/implementation-architecture-types-model.mjs", "/business-ontology-obligation-scene-model.mjs", "/financial-settlement-proof-lifecycle-model.mjs", "/ontology.json", "/domain-meta-types.projection.json", `/${sceneName}`, `/${bridgeOntologyName}`]) {
      assert.ok(requestLog.includes(requiredPath), `missing browser request ${requiredPath}`);
    }
    return {
      title: await page.title(),
      counts: receipt.counts,
      scene_counts: sceneStaticReceipt.counts,
      scene_navigation: "pass-buttons-progress-keyboard",
      ontology_box_tour: "pass-4-steps-keyboard-focus-mobile",
      ontology_node_explainer: "pass-dialog-focus-restoration",
      graph_plane_separation: "pass-three-planes",
      obligation_meta_type_collapse: "absent",
      modal_focus_restoration: true,
      responsive_one_column: true,
      horizontal_overflow_px: Math.max(overflow, sceneOverflow, tourOverflow),
      external_requests: 0,
      console_errors: 0,
      page_errors: 0,
    };
  } finally {
    await browser?.close();
    await closeServer(server);
  }
};

const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex === -1 ? "all" : process.argv[modeIndex + 1];
if (!["all", "model", "browser"].includes(mode)) throw new Error(`Unsupported mode: ${mode}`);
const result = {};
if (mode === "all" || mode === "model") result.model = await runModelValidation();
if (mode === "all" || mode === "browser") result.browser = await runBrowserValidation();
console.log(JSON.stringify({status: "PASS", ...result}, null, 2));
