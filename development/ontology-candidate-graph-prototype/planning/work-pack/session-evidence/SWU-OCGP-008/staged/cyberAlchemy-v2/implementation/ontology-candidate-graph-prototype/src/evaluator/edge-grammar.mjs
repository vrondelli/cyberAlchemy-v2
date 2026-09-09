export const GRAMMAR_SOURCE_DIGESTS = Object.freeze({
  "cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml":
    "f3ed1ed8a6452b5b8c200eadf184b2bf937b919440c26dcfa726fa334752e0d1",
  "cyberAlchemy-v2/ontology/canonical-kinds/ALLOWED-EDGES.yaml":
    "500851b158e5c286a45ce50a99a7010e58ede6d7702cbf148c0f9db24a0224b8",
});

const FORWARD_PREDICATES = new Set(["creates", "updates", "derives-from", "contradicts"]);
const DECLARATION_FORBIDDEN_INVERSES = new Set(["created-by", "updated-by", "derives"]);

const ALLOWED_TRIPLES = new Map([
  ["discovery|derives-from|research", Infinity],
  ["discovery|contradicts|discovery", Infinity],
  ["research|derives-from|discovery", 1],
  ["findings|derives-from|research", 1],
  ["session|creates|discovery", Infinity],
  ["session|updates|discovery", Infinity],
  ["session|creates|research", Infinity],
  ["session|updates|research", Infinity],
  ["session|creates|findings", Infinity],
  ["session|updates|findings", Infinity],
  ["session|creates|session", Infinity],
  ["session|updates|session", Infinity],
]);

function issue(edgeId, code, message) {
  return { path: `edges[${edgeId}]`, code, message };
}

function compareIssue(left, right) {
  return (
    left.path.localeCompare(right.path) ||
    left.code.localeCompare(right.code) ||
    left.message.localeCompare(right.message)
  );
}

export function evaluateEdgeGrammar(graph) {
  const nodesById = new Map(graph.nodes.map((node) => [node.node_id, node]));
  const edges = [...graph.edges].sort((left, right) => left.edge_id.localeCompare(right.edge_id));
  const issues = [];
  const validEdges = [];

  for (const edge of edges) {
    const sourceKind = nodesById.get(edge.source)?.kind;
    const targetKind = nodesById.get(edge.target)?.kind;

    if (DECLARATION_FORBIDDEN_INVERSES.has(edge.predicate)) {
      issues.push(
        issue(
          edge.edge_id,
          "INVERSE_EDGE_DECLARATION",
          `Read inverse ${edge.predicate} cannot be stored`,
        ),
      );
      continue;
    }
    if (!FORWARD_PREDICATES.has(edge.predicate)) {
      issues.push(
        issue(edge.edge_id, "UNKNOWN_PREDICATE", `Unknown predicate ${edge.predicate}`),
      );
      continue;
    }
    if (sourceKind === "session" && !["creates", "updates"].includes(edge.predicate)) {
      issues.push(
        issue(
          edge.edge_id,
          "SESSION_CLAIM_FORBIDDEN",
          "A session may declare only creates or updates",
        ),
      );
      continue;
    }
    if (sourceKind !== "session" && targetKind === "session") {
      issues.push(
        issue(
          edge.edge_id,
          "SESSION_EVIDENCE_FORBIDDEN",
          "An artifact cannot use a session as evidence",
        ),
      );
      continue;
    }

    const triple = `${sourceKind}|${edge.predicate}|${targetKind}`;
    if (!ALLOWED_TRIPLES.has(triple)) {
      issues.push(
        issue(
          edge.edge_id,
          "EDGE_ENDPOINT_PAIR_FORBIDDEN",
          `Forbidden edge triple ${triple}`,
        ),
      );
      continue;
    }
    validEdges.push({ edge, triple, maximum: ALLOWED_TRIPLES.get(triple) });
  }

  const groups = new Map();
  for (const record of validEdges) {
    if (!Number.isFinite(record.maximum)) continue;
    const key = `${record.edge.source}|${record.triple}`;
    const current = groups.get(key) ?? [];
    current.push(record.edge.edge_id);
    groups.set(key, current);
  }
  for (const [key, edgeIds] of [...groups].sort(([left], [right]) => left.localeCompare(right))) {
    const maximum = validEdges.find(
      (record) => `${record.edge.source}|${record.triple}` === key,
    ).maximum;
    if (edgeIds.length > maximum) {
      issues.push({
        path: `cardinality[${key}]`,
        code: "EDGE_CARDINALITY_EXCEEDED",
        message: `Expected at most ${maximum} edge; received ${edgeIds.length}: ${edgeIds.join(",")}`,
      });
    }
  }

  issues.sort(compareIssue);
  return {
    grammar_version: "candidate-edge-grammar-v1",
    accepted_edge_ids: validEdges.map(({ edge }) => edge.edge_id).sort(),
    issues,
  };
}
