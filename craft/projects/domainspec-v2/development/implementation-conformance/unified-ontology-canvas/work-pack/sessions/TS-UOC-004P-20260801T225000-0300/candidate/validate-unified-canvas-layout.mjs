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
const segmentCrossesInterior = (from, to, rectangle) => {
  if (from.x === to.x) {
    const low = Math.min(from.y, to.y);
    const high = Math.max(from.y, to.y);
    return from.x > rectangle.x && from.x < rectangle.x + rectangle.width && high > rectangle.y && low < rectangle.y + rectangle.height;
  }
  if (from.y === to.y) {
    const low = Math.min(from.x, to.x);
    const high = Math.max(from.x, to.x);
    return from.y > rectangle.y && from.y < rectangle.y + rectangle.height && high > rectangle.x && low < rectangle.x + rectangle.width;
  }
  throw new Error("route segment is not orthogonal");
};
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
  assert.equal(layout.layout_id, "unified-layout:prototype");
  assert.equal(layout.verification_status, "prototype-unverified");
  assert.equal(["layout", "digest"].join("_") in layout, false);
  assert.equal(["node", "layout", "digest"].join("_") in layout, false);
  assert.deepEqual(layout, replay, "node layout structural replay changed");
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

  process.stdout.write(`PASS unified canvas node layout: ${graph.nodes.length} positions, ${layout.bands.length} bands, ${overlapCount} overlaps, structural replay pass\n`);
};

const validateEdges = async () => {
  const graph = await loadGraph();
  const layout = ComputeDeterministicCanvasLayout(graph);
  const replay = ComputeDeterministicCanvasLayout(graph);
  assert.equal(layout.layout_id, "unified-layout:prototype");
  assert.equal(layout.verification_status, "prototype-unverified");
  assert.equal(["layout", "digest"].join("_") in layout, false);
  assert.equal(["node", "layout", "digest"].join("_") in layout, false);
  assert.deepEqual(layout, replay, "edge layout structural replay changed");
  assert.equal(layout.routes.length, graph.edges.length);
  assert.equal(layout.corridors.length, graph.edges.length);
  assert.equal(Object.keys(layout.ports).length, graph.edges.length);
  assert.equal(new Set(layout.routes.map((route) => route.edge_id)).size, graph.edges.length);
  assert.deepEqual(layout.routes, replay.routes);
  assert.deepEqual(layout.ports, replay.ports);
  assert.deepEqual(layout.corridors, replay.corridors);
  const routeByEdge = new Map(layout.routes.map((route) => [route.edge_id, route]));
  assert.ok(graph.edges.every((edge) => routeByEdge.has(edge.id)));
  const rectangles = Object.entries(layout.positions).map(([id, position]) => ({id, ...position}));
  let crossingCount = 0;
  for (const route of layout.routes) {
    assert.ok(route.accessible_name.includes(" from ") && route.accessible_name.includes(" to "));
    assert.ok(["structural", "semantic", "evidence"].includes(route.relation_class));
    assert.ok(["solid", "dashed", "dotted"].includes(route.pattern));
    assert.ok(route.points.length >= 2);
    for (let pointIndex = 1; pointIndex < route.points.length; pointIndex += 1) {
      for (const rectangle of rectangles) {
        if (segmentCrossesInterior(route.points[pointIndex - 1], route.points[pointIndex], rectangle)) crossingCount += 1;
      }
    }
  }
  assert.equal(crossingCount, 0);
  assert.equal(layout.routes.find((route) => route.kind === "extends").pattern, "solid");
  assert.equal(layout.routes.find((route) => route.kind === "candidate-aligns-to").pattern, "dashed");
  assert.equal(layout.routes.find((route) => route.kind === "explains").pattern, "dotted");
  const parallelGroups = new Map();
  for (const route of layout.routes) {
    const key = `${route.from}->${route.to}`;
    parallelGroups.set(key, [...(parallelGroups.get(key) ?? []), route]);
  }
  for (const group of parallelGroups.values()) {
    const offsets = group.map((route) => route.parallel_offset);
    assert.equal(new Set(offsets).size, offsets.length);
    assert.deepEqual(offsets, [...offsets].sort((left, right) => left - right));
  }
  const missingEndpointGraph = structuredClone(graph);
  missingEndpointGraph.edges[0].to = "missing:node";
  expectLayoutError(() => ComputeDeterministicCanvasLayout(missingEndpointGraph), "missing-route-endpoint");
  const duplicateRouteGraph = structuredClone(graph);
  duplicateRouteGraph.edges[1].id = duplicateRouteGraph.edges[0].id;
  expectLayoutError(() => ComputeDeterministicCanvasLayout(duplicateRouteGraph), "duplicate-route");
  process.stdout.write(`PASS unified canvas edge routing: ${layout.routes.length} routes, ${crossingCount} node-interior crossings, structural replay pass\n`);
};

const mode = process.argv[process.argv.indexOf("--mode") + 1];
if (mode === "nodes") await validateNodes();
else if (mode === "edges") await validateEdges();
else throw new Error(`Expected --mode nodes or edges; received ${mode ?? "none"}.`);
