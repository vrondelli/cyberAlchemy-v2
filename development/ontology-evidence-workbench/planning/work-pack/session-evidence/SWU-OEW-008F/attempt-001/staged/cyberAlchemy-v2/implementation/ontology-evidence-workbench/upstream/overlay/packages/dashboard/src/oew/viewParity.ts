// @ts-nocheck

export const OEW_VIEWS = Object.freeze(["graph", "outline", "table"]);
export const GROUNDING_PATH = Object.freeze(["F1", "R1", "D1"]);
export const VISIBLE_RESIDUE = Object.freeze(["D2"]);

const lower = (value) => String(value ?? "").toLowerCase();

export function nodeRows(bundle) {
  const nodes = Array.isArray(bundle?.graph?.nodes) ? bundle.graph.nodes : [];
  return nodes.map((node) => {
    const exact = bundle.sourceRefIndex[
      bundle.sidecar.nodes[node.id].source_ref
    ];
    return {
      sourceRef: exact.sourceRef,
      presentationId: node.id,
      name: node.name,
      summary: node.summary,
      presentationType: node.type,
      sourceKind: exact.row.source_kind,
      sourcePath: exact.row.source_path,
      sourceDigest: exact.row.source_digest,
      mappingLoss: exact.row.mapping_loss,
      authorityEffect: exact.row.authority_effect,
      relation: null,
      disposition: null,
      diagnostics: [],
      grounding: GROUNDING_PATH.includes(exact.sourceRef),
      residue: VISIBLE_RESIDUE.includes(exact.sourceRef),
    };
  });
}

export function edgeRows(bundle) {
  return Object.values(bundle?.sourceRefIndex ?? {})
    .filter((entry) => entry.kind === "edge")
    .map((entry) => ({
      sourceRef: entry.sourceRef,
      presentationId: entry.presentationId,
      name: `${entry.row.source} ${entry.row.source_relation} ${entry.row.target}`,
      summary: `${entry.row.source_relation} shown as ${entry.row.presentation_relation}`,
      presentationType: "relation",
      sourceKind: "Relation",
      sourcePath: entry.row.evidence_refs.join(" · "),
      sourceDigest: null,
      mappingLoss: entry.row.mapping_loss,
      authorityEffect: entry.row.authority_effect,
      relation: entry.row.source_relation,
      presentationRelation: entry.row.presentation_relation,
      disposition: entry.row.policy_disposition,
      diagnostics: entry.row.diagnostics,
      grounding: entry.row.grounding_inclusion === "included",
      residue: entry.row.grounding_inclusion === "excluded",
      source: entry.row.source,
      target: entry.row.target,
    }));
}

export function allEvidenceRows(bundle) {
  return [...nodeRows(bundle), ...edgeRows(bundle)];
}

export function filterEvidenceRows(rows, filters = {}) {
  const text = lower(filters.text);
  const kinds = new Set(filters.kind ?? []);
  const relations = new Set(filters.relation ?? []);
  const dispositions = new Set(filters.disposition ?? []);
  const diagnostics = new Set(filters.diagnostic ?? []);
  return rows.filter((row) => {
    const haystack = lower(
      [
        row.sourceRef,
        row.name,
        row.summary,
        row.sourceKind,
        row.sourcePath,
        row.relation,
        row.disposition,
        ...(row.diagnostics ?? []),
      ].join(" "),
    );
    return (
      (!text || haystack.includes(text)) &&
      (!kinds.size || kinds.has(row.sourceKind)) &&
      (!relations.size || relations.has(row.relation)) &&
      (!dispositions.size || dispositions.has(row.disposition)) &&
      (!diagnostics.size ||
        row.diagnostics.some((item) => diagnostics.has(item)))
    );
  });
}

export function buildViewModel(bundle, state = {}) {
  const rows = filterEvidenceRows(allEvidenceRows(bundle), state.filters);
  return {
    rows,
    selectedSourceRef: state.selectedSourceRef ?? null,
    selected:
      rows.find((row) => row.sourceRef === state.selectedSourceRef) ??
      allEvidenceRows(bundle).find(
        (row) => row.sourceRef === state.selectedSourceRef,
      ) ??
      null,
    groundingPath: [...GROUNDING_PATH],
    visibleResidue: [...VISIBLE_RESIDUE],
    authorityEffect: "none",
  };
}

export function paritySnapshot(bundle, state = {}) {
  const model = buildViewModel(bundle, state);
  const snapshot = {
    selectedSourceRef: model.selectedSourceRef,
    visibleSourceRefs: model.rows.map((row) => row.sourceRef).sort(),
    groundingPath: model.groundingPath,
    visibleResidue: model.visibleResidue,
    authorityEffect: model.authorityEffect,
  };
  return Object.fromEntries(
    OEW_VIEWS.map((view) => [view, {...snapshot, view}]),
  );
}

export function assertViewParity(snapshots) {
  const comparable = OEW_VIEWS.map((view) => {
    const {view: ignored, ...state} = snapshots[view];
    void ignored;
    return JSON.stringify(state);
  });
  return new Set(comparable).size === 1;
}
