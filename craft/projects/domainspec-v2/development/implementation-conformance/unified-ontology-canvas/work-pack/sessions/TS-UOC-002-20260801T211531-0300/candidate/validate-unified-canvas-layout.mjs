import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {ComputeDeterministicCanvasLayout} from "./unified-canvas-layout.mjs";

const repositoryRoot = process.cwd();
const experimentPath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment";
const modelModule = await import(pathToFileURL(resolve(repositoryRoot, `${experimentPath}/unified-canvas-model.mjs`)).href);
const {BuildUnifiedCanvasProjection} = modelModule;
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
const loadSource = async (sourceRef) => ({source_ref: sourceRef, value: JSON.parse(await readFile(resolve(repositoryRoot, sourceRef), "utf8"))});
const loadGraph = async () => BuildUnifiedCanvasProjection({
  meta_types: await loadSource(sourcePaths.meta_types),
  ontology: await loadSource(sourcePaths.ontology),
  profiles: await Promise.all([sourcePaths.base, sourcePaths.typescript, sourcePaths.python, sourcePaths.rust].map(loadSource)),
  facts: await loadSource(sourcePaths.facts),
  evaluation: await loadSource(sourcePaths.evaluation),
});
const overlaps = (left, right) => left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
const expectLayoutError = (operation, code) => {
  assert.throws(operation, (error) => {
    assert.equal(error.code, "UOC_LAYOUT_INVALID");
    assert.ok(error.diagnostics.some((diagnostic) => diagnostic.code === code), `missing diagnostic ${code}`);
    return true;
  });
};
const validateNodes = async () => {
  const graph = await loadGraph();
  const graphBefore = structuredClone(graph);
  const layout = ComputeDeterministicCanvasLayout(graph);
  const replay = ComputeDeterministicCanvasLayout(graph);
  assert.equal(layout.layout_id, replay.layout_id);
  assert.equal(layout.layout_digest, replay.layout_digest);
  assert.deepEqual(layout.positions, replay.positions);
  assert.deepEqual(graph, graphBefore, "layout mutated its input graph");
  assert.ok(Object.isFrozen(layout));
  assert.ok(Object.isFrozen(layout.positions));
  assert.deepEqual(layout.band_order, ["meaning", "realization", "expectation", "observation", "explanation"]);
  assert.deepEqual(layout.bands.map((band) => band.id), layout.band_order);
  assert.ok(layout.bands.every((band, index, bands) => index === 0 || band.x > bands[index - 1].x));
  assert.equal(Object.keys(layout.positions).length, graph.nodes.length);
  assert.ok(graph.nodes.every((node) => layout.positions[node.id]?.band === node.band));
  const placedIds = layout.bands.flatMap((band) => band.node_ids);
  assert.equal(new Set(placedIds).size, graph.nodes.length);
  assert.deepEqual(new Set(placedIds), new Set(graph.nodes.map((node) => node.id)));

  const rectangles = Object.entries(layout.positions).map(([id, position]) => ({id, ...position}));
  let overlapCount = 0;
  for (let leftIndex = 0; leftIndex < rectangles.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < rectangles.length; rightIndex += 1) {
      if (overlaps(rectangles[leftIndex], rectangles[rightIndex])) overlapCount += 1;
    }
  }
  assert.equal(overlapCount, 0);

  const meaningIds = layout.bands.find((band) => band.id === "meaning").node_ids;
  assert.ok(meaningIds.indexOf("meta:DS-D1.1") < meaningIds.indexOf("meta:DS-D1.4"));
  assert.equal(meaningIds.at(-1), "meta:DS-D1.10");
  const realizationIds = layout.bands.find((band) => band.id === "realization").node_ids;
  assert.ok(realizationIds.indexOf("type:architecture.DomainConceptImplementation") < realizationIds.indexOf("type:architecture.OperationImplementation"));
  const expectationIds = layout.bands.find((band) => band.id === "expectation").node_ids;
  assert.ok(expectationIds.indexOf("profile:architecture.base-domain") < expectationIds.indexOf("profile:architecture.typescript-strict"));
  assert.ok(expectationIds.indexOf("profile:architecture.typescript-strict") < expectationIds.indexOf("profile:architecture.python-strict"));
  assert.ok(expectationIds.indexOf("profile:architecture.python-strict") < expectationIds.indexOf("profile:architecture.rust-strict"));
  assert.ok(expectationIds.indexOf("profile:architecture.rust-strict") < expectationIds.indexOf("property:source.path"));
  const observationIds = layout.bands.find((band) => band.id === "observation").node_ids;
  assert.equal(observationIds.length, 5);
  const explanationIds = layout.bands.find((band) => band.id === "explanation").node_ids;
  assert.equal(explanationIds.length, 8);

  const unknownBandGraph = structuredClone(graph);
  unknownBandGraph.nodes[0].band = "unknown";
  expectLayoutError(() => ComputeDeterministicCanvasLayout(unknownBandGraph), "unknown-band");
  expectLayoutError(() => ComputeDeterministicCanvasLayout(graph, {node_width: 0}), "invalid-layout-option");
  assert.ok(!("routes" in layout) && !("ports" in layout), "SWU 002 must not implement edge routing");

  process.stdout.write(`PASS unified canvas node layout: ${graph.nodes.length} positions, ${layout.bands.length} bands, ${overlapCount} overlaps, digest ${layout.layout_digest}\n`);
};

const mode = process.argv[process.argv.indexOf("--mode") + 1];
if (mode !== "nodes") throw new Error(`Expected --mode nodes; received ${mode ?? "none"}.`);
await validateNodes();
