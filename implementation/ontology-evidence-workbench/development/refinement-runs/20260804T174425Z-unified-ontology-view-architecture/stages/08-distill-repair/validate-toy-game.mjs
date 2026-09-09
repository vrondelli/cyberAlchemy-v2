import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const [graphPath, sidecarPath] = process.argv.slice(2)
if (!graphPath || !sidecarPath) throw new Error("usage: node validate-toy-game.mjs <presentation-graph.json> <evidence-sidecar.json>")

const graph = JSON.parse(await readFile(graphPath, "utf8"))
const sidecar = JSON.parse(await readFile(sidecarPath, "utf8"))
const edgeRows = Object.entries(sidecar.edges)
const clone = value => structuredClone(value)
const fail = code => { const error = new Error(code); error.code = code; throw error }

assert.equal(graph.nodes.length, 276)
assert.equal(graph.edges.length, 301)
assert.equal(edgeRows.length, 301)
assert.equal(Object.keys(sidecar.relation_encoding.predicateColorMap).length, 39)
assert.equal(new Set(Object.values(sidecar.relation_encoding.predicateColorMap)).size, 39)

const relationFrom = ([presentationId, row], index) => ({
  source_relation_id: row.source_ref,
  presentation_id: presentationId,
  source_node_id: row.source,
  target_node_id: row.target,
  exact_predicate: row.source_relation,
  expected_predicate: row.source_relation,
  color_token: sidecar.relation_encoding.predicateColorMap[row.source_relation],
  pattern_token: sidecar.relation_encoding.presentationPatternMap[row.presentation_relation],
  geometry: [{ x: index * 40, y: 20 }, { x: index * 40 + 30, y: 60 }],
  marker: { present: true, endpoint: "target" },
  evidence_refs: row.evidence_refs
})

const baseRelations = edgeRows.slice(0, 6).map(relationFrom)
const parallel = { ...clone(baseRelations[0]), source_relation_id: "fixture.parallel-distinct-relation", presentation_id: "fixture-edge:parallel", exact_predicate: "tested_by", expected_predicate: "tested_by", color_token: sidecar.relation_encoding.predicateColorMap.tested_by }
const allRelations = [...baseRelations, parallel]
const nodeIds = [...new Set(allRelations.flatMap(row => [row.source_node_id, row.target_node_id]))]
const baseline = {
  graph_digest: "a".repeat(64),
  view_pack_digest: "b".repeat(64),
  source: { nodes: 276, relations: 301, predicates: 39 },
  nodes: nodeIds.map(source_node_id => ({ source_node_id, icon_token: "node-kind.fixture", label: source_node_id })),
  internal_relations: allRelations.slice(0, 4),
  cut_relations: allRelations.slice(4),
  expected_relation_ids: allRelations.map(row => row.source_relation_id),
  portals: [
    { portal_id: "portal:runtime", destination_cluster_id: "cluster:runtime", constituents: allRelations.slice(4, 6).map(row => ({ source_relation_id: row.source_relation_id, outside_endpoint_node_id: row.target_node_id, traversal_direction: "with-source" })) },
    { portal_id: "portal:verification", destination_cluster_id: "cluster:verification", constituents: [parallel].map(row => ({ source_relation_id: row.source_relation_id, outside_endpoint_node_id: row.target_node_id, traversal_direction: "with-source" })) }
  ],
  navigation_before: { graph_digest: "a".repeat(64), view_pack_digest: "b".repeat(64), scope: "home", viewport: { x: 10, y: 20, zoom: 1.25 }, selected: { kind: "relation", id: allRelations[0].source_relation_id }, filters: { predicate: ["realized_by"] }, index_state: { query: "runner", sort_key: "label", sort_direction: "ascending" }, expanded_portal_ids: ["portal:runtime"], initiating_control_id: "portal-runtime", focus_target_id: "portal-runtime" },
  navigation_restored: null,
  complete_index_rows: 577,
  selected_relation_id: allRelations[0].source_relation_id,
  endpoint_boxes: { source: { x: 0, y: 0, width: 120, height: 80 }, target: { x: 200, y: 0, width: 120, height: 80 } },
  inspector_box: { x: 400, y: 0, width: 240, height: 600 },
  path: { policy_id: "directed-shortest", policy_version: "1.0.0", elapsed_ms: 12, paths: [[{ source_relation_id: allRelations[0].source_relation_id }]] }
}
baseline.navigation_restored = clone(baseline.navigation_before)

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function validate(model) {
  if (model.source.nodes !== 276 || model.source.relations !== 301 || model.source.predicates !== 39) fail("FULL_SOURCE_DENOMINATOR_CHANGED")
  if (model.complete_index_rows !== 577) fail("FULL_INDEX_NOT_TOTAL")
  if (model.nodes.some(node => !node.icon_token)) fail("NODE_KIND_CUE_MISSING")
  const relations = [...model.internal_relations, ...model.cut_relations]
  if (relations.some(row => !Array.isArray(row.geometry) || row.geometry.length < 2)) fail("RELATION_GEOMETRY_MISSING")
  if (relations.some(row => !row.marker?.present)) fail("DIRECTION_MARKER_MISSING")
  if (relations.some(row => row.exact_predicate !== row.expected_predicate)) fail("EXACT_PREDICATE_LOST")
  const predicateColors = new Map()
  for (const row of relations) {
    const prior = predicateColors.get(row.color_token)
    if (prior && prior !== row.exact_predicate) fail("PREDICATE_COLOR_COLLISION")
    predicateColors.set(row.color_token, row.exact_predicate)
  }
  const gotIds = relations.map(row => row.source_relation_id).sort()
  if (JSON.stringify(gotIds) !== JSON.stringify([...model.expected_relation_ids].sort())) fail("RELATION_MAPPING_NOT_TOTAL")
  if (!model.portals.some(portal => portal.constituents.length > 1)) fail("PORTAL_GROUPING_LOST")
  const constituentIds = model.portals.flatMap(portal => portal.constituents.map(row => row.source_relation_id)).sort()
  const cutIds = model.cut_relations.map(row => row.source_relation_id).sort()
  if (JSON.stringify(constituentIds) !== JSON.stringify(cutIds)) fail("PORTAL_CONSTITUENTS_NOT_TOTAL")
  if (model.portals.some(portal => !portal.destination_cluster_id)) fail("PORTAL_DESTINATION_UNRESOLVED")
  if (JSON.stringify(model.navigation_before) !== JSON.stringify(model.navigation_restored)) fail("NAVIGATION_FRAME_NOT_RESTORED")
  if (model.navigation_before.graph_digest !== model.graph_digest || model.navigation_before.view_pack_digest !== model.view_pack_digest) fail("NAVIGATION_STALE_REVISION")
  if (model.path.paths.length > 8 || model.path.paths.some(path => path.length > 8) || model.path.elapsed_ms > 250) fail("PATH_POLICY_BOUNDS_EXCEEDED")
  if (overlaps(model.inspector_box, model.endpoint_boxes.source) || overlaps(model.inspector_box, model.endpoint_boxes.target)) fail("INSPECTOR_OCCLUSION")
  return "pass"
}

assert.equal(validate(baseline), "pass")

const mutations = [
  ["relation-as-card", "RELATION_GEOMETRY_MISSING", model => { delete model.internal_relations[0].geometry }],
  ["marker-removed", "DIRECTION_MARKER_MISSING", model => { model.internal_relations[0].marker.present = false }],
  ["node-icon-removed", "NODE_KIND_CUE_MISSING", model => { model.nodes[0].icon_token = "" }],
  ["portal-flattened", "PORTAL_GROUPING_LOST", model => { model.portals = model.cut_relations.map((row, index) => ({ portal_id: `flat:${index}`, destination_cluster_id: `cluster:${index}`, constituents: [{ source_relation_id: row.source_relation_id }] })) }],
  ["predicate-generalized", "EXACT_PREDICATE_LOST", model => { model.internal_relations[0].exact_predicate = "builds_on" }],
  ["predicate-color-collision", "PREDICATE_COLOR_COLLISION", model => { model.cut_relations[0].color_token = model.internal_relations[0].color_token }],
  ["frame-partially-restored", "NAVIGATION_FRAME_NOT_RESTORED", model => { model.navigation_restored.viewport.zoom = 1 }],
  ["parallel-relation-deduplicated", "RELATION_MAPPING_NOT_TOTAL", model => { model.cut_relations = model.cut_relations.filter(row => row.source_relation_id !== "fixture.parallel-distinct-relation"); model.portals[1].constituents = [] }],
  ["full-index-row-lost", "FULL_INDEX_NOT_TOTAL", model => { model.complete_index_rows = 576 }],
  ["inspector-covers-endpoint", "INSPECTOR_OCCLUSION", model => { model.inspector_box = { x: 180, y: 0, width: 300, height: 300 } }],
  ["portal-cluster-missing", "PORTAL_DESTINATION_UNRESOLVED", model => { model.portals[0].destination_cluster_id = "" }],
  ["path-unbounded", "PATH_POLICY_BOUNDS_EXCEEDED", model => { model.path.paths = Array.from({ length: 9 }, () => []) }],
  ["stale-navigation-revision", "NAVIGATION_STALE_REVISION", model => { model.navigation_before.graph_digest = "c".repeat(64); model.navigation_restored = clone(model.navigation_before) }]
]

const results = []
for (const [name, expected, mutate] of mutations) {
  const model = clone(baseline)
  mutate(model)
  let observed = "NO_FAILURE"
  try { validate(model) } catch (error) { observed = error.code ?? error.message }
  assert.equal(observed, expected, `${name}: expected ${expected}, got ${observed}`)
  results.push({ mutation: name, expected, observed, result: "pass" })
}

console.log(JSON.stringify({
  schema_version: "oew.refine-toy-game.v1",
  result: "pass",
  source_fixture: { nodes: graph.nodes.length, relations: graph.edges.length, sidecar_relations: edgeRows.length, exact_predicates: Object.keys(sidecar.relation_encoding.predicateColorMap).length, complete_index_rows: 577 },
  positive_control: "pass",
  negative_controls: results,
  claim_ceiling: "Deterministic design toy only; no product build, renderer, browser, performance, accessibility, or human-comprehension evidence."
}, null, 2))
