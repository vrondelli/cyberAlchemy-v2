import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {BuildUnifiedCanvasProjection} from "./unified-canvas-model.mjs";

const repositoryRoot = process.cwd();
const experimentPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment";
const sourcePaths = Object.freeze({
  meta_types: `${experimentPath}/domain-meta-types.projection.json`,
  ontology: `${experimentPath}/ontology.json`,
  base: `${experimentPath}/profiles/base-domain.profile.json`,
  typescript: `${experimentPath}/profiles/typescript-strict.profile.json`,
  python: `${experimentPath}/profiles/python-strict.profile.json`,
  rust: `${experimentPath}/profiles/rust-strict.profile.json`,
  facts: `${experimentPath}/examples/typescript-observed-facts.json`,
  evaluation: `${experimentPath}/examples/typescript-evaluation.expected.json`,
});

const loadSource = async (sourceRef) => ({
  source_ref: sourceRef,
  value: JSON.parse(await readFile(resolve(repositoryRoot, sourceRef), "utf8")),
});

const loadBundle = async () => ({
  meta_types: await loadSource(sourcePaths.meta_types),
  ontology: await loadSource(sourcePaths.ontology),
  profiles: await Promise.all([sourcePaths.base, sourcePaths.typescript, sourcePaths.python, sourcePaths.rust].map(loadSource)),
  facts: await loadSource(sourcePaths.facts),
  evaluation: await loadSource(sourcePaths.evaluation),
});

const expectProjectionError = (operation, code) => {
  assert.throws(operation, (error) => {
    assert.equal(error.code, "UOC_PROJECTION_INVALID");
    assert.ok(error.diagnostics.some((diagnostic) => diagnostic.code === code), `missing diagnostic ${code}`);
    return true;
  });
};

const cloneBundle = (bundle) => structuredClone(bundle);
const idsAreUnique = (items) => new Set(items.map((item) => item.id)).size === items.length;

const validateProjection = async () => {
  const bundle = await loadBundle();
  const before = structuredClone(bundle);
  const graph = BuildUnifiedCanvasProjection(bundle);
  const replay = BuildUnifiedCanvasProjection(bundle);

  assert.equal(graph.authority_effect, "none");
  assert.equal(graph.graph_id, replay.graph_id);
  assert.equal(graph.graph_digest, replay.graph_digest);
  assert.ok(Object.isFrozen(graph));
  assert.ok(Object.isFrozen(graph.nodes));
  assert.ok(graph.nodes.every(Object.isFrozen));
  assert.deepEqual(bundle, before, "projection mutated its source bundle");
  assert.ok(idsAreUnique(graph.nodes), "node IDs must be unique");
  assert.ok(idsAreUnique(graph.edges), "edge IDs must be unique");

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  assert.ok(graph.edges.every((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to)), "edge endpoint is missing");
  assert.ok(graph.nodes.every((node) => node.plain_language && node.source_ref && node.authority_effect === "none"));
  assert.deepEqual(
    Object.fromEntries(Object.entries(graph.indexes.by_family).map(([family, ids]) => [family, ids.length])),
    {
      "meta-type": 25,
      "architecture-type": 12,
      profile: 4,
      constraint: 24,
      property: 17,
      "fact-element": 3,
      "fact-relation": 2,
      finding: 8,
    },
  );
  assert.equal(graph.nodes.length, 95);
  assert.equal(graph.gaps.length, 20);
  assert.equal(graph.edges.filter((edge) => edge.kind === "candidate-aligns-to").length, 5);

  const typescriptIndex = graph.indexes.by_profile["architecture.typescript-strict"];
  for (const profileId of ["architecture.python-strict", "architecture.rust-strict"]) {
    assert.deepEqual(graph.indexes.by_profile[profileId].observation_node_ids, []);
    assert.deepEqual(graph.indexes.by_profile[profileId].finding_node_ids, []);
  }
  assert.equal(typescriptIndex.observation_node_ids.length, 5);
  assert.equal(typescriptIndex.finding_node_ids.length, 8);
  assert.ok(graph.nodes.filter((node) => node.family === "fact-element" || node.family === "fact-relation").every((node) => node.fixture_profile_id === "architecture.typescript-strict"));
  assert.ok(graph.nodes.filter((node) => node.family === "finding").every((node) => node.evaluation_profile_id === "architecture.typescript-strict"));
  assert.ok(graph.edges.filter((edge) => edge.kind === "evaluated-under").every((edge) => edge.to === "profile:architecture.typescript-strict"));

  const nameOnly = cloneBundle(bundle);
  nameOnly.meta_types.value.meta_types[0].label = "Rule Implementation";
  const nameOnlyGraph = BuildUnifiedCanvasProjection(nameOnly);
  assert.ok(!nameOnlyGraph.edges.some((edge) => edge.kind === "candidate-aligns-to" && edge.from === "meta:DS-D1.1"));
  assert.ok(nameOnlyGraph.gaps.some((gap) => gap.from === "meta:DS-D1.1"));

  const reciprocalMismatch = cloneBundle(bundle);
  reciprocalMismatch.ontology.value.concept_types.find((item) => item.concept_id === "architecture.RuleImplementation").canonical_meta_type_ref = "DS-D1.4";
  expectProjectionError(() => BuildUnifiedCanvasProjection(reciprocalMismatch), "reciprocal-alignment-mismatch");

  const duplicate = cloneBundle(bundle);
  duplicate.meta_types.value.meta_types[1].meta_type_id = duplicate.meta_types.value.meta_types[0].meta_type_id;
  expectProjectionError(() => BuildUnifiedCanvasProjection(duplicate), "duplicate-node-id");

  const dangling = cloneBundle(bundle);
  dangling.facts.value.relations[0].to = "implementation.missing.Target";
  expectProjectionError(() => BuildUnifiedCanvasProjection(dangling), "dangling-fact-relation");

  process.stdout.write(`PASS unified canvas projection: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${graph.gaps.length} explicit gaps, digest ${graph.graph_digest}\n`);
};

const mode = process.argv[process.argv.indexOf("--mode") + 1];
if (mode !== "projection") throw new Error(`Expected --mode projection; received ${mode ?? "none"}.`);
await validateProjection();
