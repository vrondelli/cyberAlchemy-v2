// @ts-nocheck
import EvidenceOutline from "./EvidenceOutline.tsx";
import EvidenceTable from "./EvidenceTable.tsx";

const position = {
  F1: {x: 50, y: 14},
  R1: {x: 43, y: 43},
  D1: {x: 53, y: 73},
  D2: {x: 81, y: 73},
};

const projectionStyle = (projection) => projection ? {
  "--oew-edge-color": projection.encoding.color_dark,
  "--oew-edge-dash": projection.encoding.stroke_dasharray,
} : {};

const relationLabel = (row) =>
  row.relationProjection?.accessible_text ??
  `${row.source} ${row.relation} ${row.target}`;

function RelationGeometryPaths({relations, onSelect}) {
  const projected = relations.filter((row) => row.relationProjection?.geometry);
  if (!projected.length) return null;
  return (
    <svg className="oew-relation-geometry" aria-label="Exact relation paths">
      <defs>
        {projected.map((row) => {
          const relationId = row.relationProjection.ref.source_relation_id;
          return (
            <marker
              id={`oew-arrow-${relationId.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`}
              key={relationId}
              markerHeight="7"
              markerWidth="7"
              orient="auto-start-reverse"
              refX="6"
              refY="3.5"
              viewBox="0 0 7 7"
            >
              <path d="M 0 0 L 7 3.5 L 0 7 z" fill={row.relationProjection.encoding.color_dark} />
            </marker>
          );
        })}
      </defs>
      {projected.map((row) => {
        const projection = row.relationProjection;
        const relationId = projection.ref.source_relation_id;
        const markerId = `oew-arrow-${relationId.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;
        return (
          <g
            aria-label={relationLabel(row)}
            className="oew-exact-relation"
            data-relation-digest={projection.relation_digest}
            data-source-relation-id={relationId}
            key={relationId}
            onClick={() => onSelect(row.sourceRef)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelect(row.sourceRef);
            }}
            role="button"
            style={projectionStyle(projection)}
            tabIndex={0}
          >
            {projection.geometry.sections.map((section, index) => (
              <polyline
                fill="none"
                key={`${relationId}:${index}`}
                markerEnd={`url(#${markerId})`}
                points={section.map(({x, y}) => `${x},${y}`).join(" ")}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function GraphSurface({model, onSelect, traceActive}) {
  const nodes = model.rows.filter((row) => row.presentationType !== "relation");
  const relations = model.rows.filter((row) => row.presentationType === "relation");
  return (
    <div className={traceActive ? "oew-graph is-tracing" : "oew-graph"} aria-label="Evidence graph">
      <div className="oew-constellation" aria-hidden="true" />
      <RelationGeometryPaths relations={relations} onSelect={onSelect} />
      {relations.map((row) => {
        const source = position[row.source];
        const target = position[row.target];
        const projection = row.relationProjection;
        if (!source || !target) return null;
        return (
        <button
          aria-label={relationLabel(row)}
          className={`oew-edge oew-edge--${row.relation} ${row.grounding ? "is-grounding" : "is-residue"}`}
          data-pattern={projection?.encoding.pattern_label ?? undefined}
          data-relation-digest={projection?.relation_digest ?? undefined}
          data-source-relation-id={projection?.ref.source_relation_id ?? row.sourceRef}
          key={projection?.ref.source_relation_id ?? row.sourceRef}
          onClick={() => onSelect(row.sourceRef)}
          style={{
            "--sx": `${source.x}%`,
            "--sy": `${source.y}%`,
            "--tx": `${target.x}%`,
            "--ty": `${target.y}%`,
            ...projectionStyle(projection),
          }}
        >
          <span className="oew-edge-color" aria-hidden="true" />
          <span>{projection?.encoding.visible_label ?? row.relation}</span>
          {projection && <small>{projection.encoding.direction_text}</small>}
        </button>
        );
      })}
      {nodes.map((row) => (
        <button
          aria-current={model.selectedSourceRef === row.sourceRef ? "true" : undefined}
          className={[
            "oew-node",
            `oew-node--${String(row.sourceKind).toLowerCase().replaceAll(" ", "-")}`,
            row.residue ? "is-residue" : "",
            model.selectedSourceRef === row.sourceRef ? "is-selected" : "",
          ].join(" ")}
          key={row.sourceRef}
          onClick={() => onSelect(row.sourceRef)}
          style={{left: `${position[row.sourceRef].x}%`, top: `${position[row.sourceRef].y}%`}}
        >
          <span className="oew-node-id">{row.sourceRef}</span>
          <strong>{row.sourceKind}</strong>
          <small>{row.name}</small>
        </button>
      ))}
      <div className="oew-graph-legend">
        <span><i className="legend-line" /> grounding</span>
        <span><i className="legend-dash" /> contradiction</span>
        <span><i className="legend-dot" /> policy indeterminate</span>
      </div>
    </div>
  );
}

export default function EvidenceWorkspace({
  model,
  view,
  onView,
  onSelect,
  traceActive,
  onTrace,
}) {
  return (
    <main className="oew-workspace">
      <div className="oew-workspace-toolbar">
        <div className="oew-view-tabs" role="tablist" aria-label="Evidence views">
          {[
            ["graph", "Evidence"],
            ["outline", "Outline"],
            ["table", "Table"],
          ].map(([id, label]) => (
            <button
              aria-selected={view === id}
              className={view === id ? "is-active" : ""}
              key={id}
              onClick={() => onView(id)}
              role="tab"
            >
              {label}
            </button>
          ))}
          <button aria-disabled="true" className="is-disabled" title="Code context is an L2 feature">
            Code context <small>L2</small>
          </button>
        </div>
        <button className={traceActive ? "oew-trace is-active" : "oew-trace"} onClick={onTrace}>
          <span aria-hidden="true">⌁</span>
          {traceActive ? "Grounding traced" : "Trace grounding"}
        </button>
      </div>
      <div className="oew-surface" role="tabpanel">
        {view === "graph" && <GraphSurface model={model} onSelect={onSelect} traceActive={traceActive} />}
        {view === "outline" && <EvidenceOutline model={model} onSelect={onSelect} />}
        {view === "table" && <EvidenceTable model={model} onSelect={onSelect} />}
      </div>
    </main>
  );
}
