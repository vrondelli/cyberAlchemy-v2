// @ts-nocheck
import EvidenceOutline from "./EvidenceOutline.tsx";
import EvidenceTable from "./EvidenceTable.tsx";

const position = {
  F1: {x: 50, y: 14},
  R1: {x: 43, y: 43},
  D1: {x: 53, y: 73},
  D2: {x: 81, y: 73},
};

function GraphSurface({model, onSelect, traceActive}) {
  const nodes = model.rows.filter((row) => row.presentationType !== "relation");
  const relations = model.rows.filter((row) => row.presentationType === "relation");
  return (
    <div className={traceActive ? "oew-graph is-tracing" : "oew-graph"} aria-label="Evidence graph">
      <div className="oew-constellation" aria-hidden="true" />
      {relations.map((row) => (
        <button
          aria-label={`${row.source} ${row.relation} ${row.target}`}
          className={`oew-edge oew-edge--${row.relation} ${row.grounding ? "is-grounding" : "is-residue"}`}
          key={row.sourceRef}
          onClick={() => onSelect(row.sourceRef)}
          style={{
            "--sx": `${position[row.source].x}%`,
            "--sy": `${position[row.source].y}%`,
            "--tx": `${position[row.target].x}%`,
            "--ty": `${position[row.target].y}%`,
          }}
        >
          <span>{row.relation}</span>
        </button>
      ))}
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
