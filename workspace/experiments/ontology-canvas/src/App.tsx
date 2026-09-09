import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  useNodesState,
  type EdgeProps,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EXPERIMENT_GRAPH_SOURCE } from "./graph.generated";
import { buildCanvasGraph, derivePortalScene, relationPresentationStyle, semanticIconKey, type OntologyCanvasEdge, type OntologyCanvasNode, type OntologyNodeData } from "./graph";
import { SemanticIcon } from "./semantic-icons";

const KIND_TONES: Record<string, string> = {
  Product: "amber",
  Project: "violet",
  Goal: "blue",
  "Product Capability": "lime",
  Participant: "cyan",
  Outcome: "rose",
  Artifact: "orange",
  Collection: "slate",
  "Project Entry": "violet",
  "External Reference": "ghost",
};

function OntologyNode({ data, selected }: NodeProps<OntologyCanvasNode>) {
  const { record, incoming, outgoing } = data;
  const icon = semanticIconKey(record);
  return (
    <div className={`ontology-node-shell tone-${KIND_TONES[record.kind] ?? "slate"}`}>
      <Handle className="semantic-handle" type="target" position={Position.Left} />
      <button
        type="button"
        className={`ontology-node nodrag nopan ${selected ? "selected" : ""}`}
        aria-label={`Use ${record.label} as portal start, ${record.kind}, ${record.status}`}
      >
        <span className="node-icon" data-semantic-icon={icon}><SemanticIcon icon={icon} /></span>
        <span className="node-copy">
          <span className="node-topline"><span>{record.kind}</span><span>{record.status}</span></span>
          <strong>{record.label}</strong>
          <span className="node-id">{record.id}</span>
          <span className="node-relations">{incoming.length} in · {outgoing.length} out</span>
        </span>
      </button>
      <Handle className="semantic-handle" type="source" position={Position.Right} />
    </div>
  );
}

function OntologyEdge(props: EdgeProps<OntologyCanvasEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);
  const relation = props.data?.relation;
  const presentation = relationPresentationStyle(relation?.type ?? "");
  const relationStyle = { "--relation-color": presentation.color } as React.CSSProperties;
  return (
    <>
      <BaseEdge {...props} path={edgePath} />
      <EdgeLabelRenderer>
        <span
          className={`relation-label ${presentation.token}`}
          data-relation-type={relation?.type}
          style={{ ...relationStyle, transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {relation?.type.replaceAll("_", " ")}
        </span>
      </EdgeLabelRenderer>
    </>
  );
}

function DetailRow({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? "detail-row wide" : "detail-row"}><dt>{label}</dt><dd>{children}</dd></div>;
}

function FocusLens({ data, onClose }: { data: OntologyNodeData | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (data && dialog && !dialog.open) dialog.showModal();
    if (!data && dialog?.open) dialog.close();
  }, [data]);
  if (!data) return null;
  const { record, incoming, outgoing } = data;
  const relationRow = (relation: (typeof incoming)[number], direction: "from" | "to") => {
    const presentation = relationPresentationStyle(relation.type);
    return <p key={relation.id} style={{ "--relation-color": presentation.color } as React.CSSProperties}><strong>{relation.type.replaceAll("_", " ")}</strong> {direction} <code>{direction === "from" ? relation.source : relation.target}</code><span>{relation.claim}</span></p>;
  };
  return (
    <dialog
      ref={ref}
      className="focus-lens"
      aria-labelledby="focus-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <article>
        <header className={`lens-header tone-${KIND_TONES[record.kind] ?? "slate"}`}>
          <div><p>{record.kind}</p><h2 id="focus-title">{record.label}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close detail">×</button>
        </header>
        <dl className="lens-grid">
          <DetailRow label="Stable identity"><code>{record.id}</code></DetailRow>
          <DetailRow label="Status"><span className="status-pill">{record.status}</span></DetailRow>
          <DetailRow label="Meaning" wide>{record.meaning}</DetailRow>
          <DetailRow label="Owner route" wide>{record.owner_route}</DetailRow>
          <DetailRow label="Boundary" wide>{record.boundary}</DetailRow>
          <DetailRow label="Claim ceiling" wide>{record.claim_ceiling}</DetailRow>
          <DetailRow label="Provenance" wide>
            {record.source_refs.length ? <ul>{record.source_refs.map((ref) => <li key={ref}><code>{ref}</code></li>)}</ul> : <span>None inside the selected source boundary.</span>}
          </DetailRow>
          <DetailRow label="Relationships" wide>
            <div className="relation-groups">
              <section><h3>Incoming · {incoming.length}</h3>{incoming.length ? incoming.map((relation) => relationRow(relation, "from")) : <p>None in this projection.</p>}</section>
              <section><h3>Outgoing · {outgoing.length}</h3>{outgoing.length ? outgoing.map((relation) => relationRow(relation, "to")) : <p>None in this projection.</p>}</section>
            </div>
          </DetailRow>
        </dl>
        <footer><strong>Projection, not authority.</strong> This experiment cannot edit, admit, accept, publish, or activate the selected record.</footer>
      </article>
    </dialog>
  );
}

const nodeTypes = { ontology: OntologyNode };
const edgeTypes = { ontology: OntologyEdge };

function Canvas() {
  const initial = useMemo(() => buildCanvasGraph(EXPERIMENT_GRAPH_SOURCE), []);
  const relationTypes = useMemo(() => [...new Set(EXPERIMENT_GRAPH_SOURCE.relations.map((relation) => relation.type))].sort(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<OntologyCanvasNode>(initial.nodes);
  const [selected, setSelected] = useState<OntologyNodeData | null>(null);
  const [portalId, setPortalId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const portalScene = useMemo(() => derivePortalScene(EXPERIMENT_GRAPH_SOURCE, portalId), [portalId]);
  const portalNode = portalId ? initial.nodes.find((node) => node.id === portalId) ?? null : null;
  const sceneEdges = useMemo(() => initial.edges.map((edge) => ({
    ...edge,
    className: [edge.className, portalId && !portalScene.edgeIds.has(edge.id) ? "outside-portal" : ""].filter(Boolean).join(" "),
  })), [initial.edges, portalId, portalScene]);

  useEffect(() => {
    const normalized = query.trim().toLowerCase();
    setNodes((current) => current.map((node) => ({
      ...node,
      className: [
        normalized && ![node.data.record.label, node.data.record.id, node.data.record.kind, node.data.record.status]
          .some((value) => value.toLowerCase().includes(normalized)) ? "dimmed" : "",
        portalId && node.id === portalId ? "portal-origin" : "",
        portalId && portalScene.nodeIds.has(node.id) && node.id !== portalId ? "portal-neighbor" : "",
        portalId && !portalScene.nodeIds.has(node.id) ? "outside-portal" : "",
      ].filter(Boolean).join(" "),
    })));
  }, [portalId, portalScene, query, setNodes]);

  const clearPortal = () => {
    setPortalId(null);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  return (
    <main className="experiment-shell">
      <aside className="rail">
        <div className="brand"><span>CA</span><div><small>CyberAlchemy</small><strong>Ontology Canvas</strong></div></div>
        <div className="experiment-note"><span>Experiment 001</span><p>Read-only projection of two exact source files.</p></div>
        <label className="search"><span>Find a node</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, ID, kind, status…" /></label>
        <section className="legend">
          <h2>Semantic kinds</h2>
          {Object.entries(KIND_TONES).map(([kind, tone]) => {
            const icon = semanticIconKey({ kind, label: kind });
            return <p key={kind}><i className={`kind-swatch tone-${tone}`}><SemanticIcon icon={icon} /></i>{kind}</p>;
          })}
          <h2 className="relation-legend-heading">Relation cues</h2>
          {relationTypes.map((type) => {
            const presentation = relationPresentationStyle(type);
            return <p key={type} data-relation-legend={type}><i className={`relation-swatch ${presentation.token}`} style={{ "--relation-color": presentation.color } as React.CSSProperties} />{type.replaceAll("_", " ")} <span aria-hidden="true">→</span></p>;
          })}
          <small className="legend-note">Each exact predicate keeps one stable color. Labels, arrows, and line patterns preserve the relation without color.</small>
        </section>
        <div className="rail-boundary"><strong>Move the view, not the truth.</strong><p>Dragging is temporary. There is no save, connect, edit, or mutation surface.</p></div>
      </aside>
      <section className="workspace-canvas">
        <header className="canvas-header">
          <div><p>A source-bound semantic map</p><h1 ref={headingRef} tabIndex={-1}>Explore the ontology as a living map.</h1></div>
          <div className="canvas-metrics"><span><strong>15</strong> nodes</span><span><strong>14</strong> relations</span><span><strong>{EXPERIMENT_GRAPH_SOURCE.sourceEpoch.slice(0, 10)}</strong> epoch</span></div>
        </header>
        <section className={`portal-bar ${portalNode ? "active" : ""}`} aria-live="polite" data-testid="portal-scope">
          {portalNode ? <>
            <span className="portal-symbol" aria-hidden="true"><SemanticIcon icon={semanticIconKey(portalNode.data.record)} /></span>
            <div><small>Portal focus · presentation scope</small><strong>{portalNode.data.record.label}</strong><span>{portalScene.nodeIds.size} visible nodes · {portalScene.edgeIds.size} connecting relations</span></div>
            <div className="portal-actions"><button type="button" onClick={() => setSelected(portalNode.data)}>Inspect focused record</button><button type="button" onClick={clearPortal}>Show all loaded graph</button></div>
          </> : <><span className="portal-prompt">Choose any card as a starting point. Its directly connected scene will stay bright; the rest of the loaded graph will darken.</span></>}
        </section>
        <div className={`flow-frame ${portalId ? "portal-active" : ""}`} aria-label="CyberAlchemy ontology canvas">
          <ReactFlow<OntologyCanvasNode, OntologyCanvasEdge>
            nodes={nodes}
            edges={sceneEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={(_, node) => { setPortalId(node.id); setSelected(null); }}
            fitView
            fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
            minZoom={0.18}
            maxZoom={1.7}
            nodesConnectable={false}
            nodesDraggable
            edgesReconnectable={false}
            elementsSelectable
            deleteKeyCode={null}
            multiSelectionKeyCode={null}
            panOnDrag
            zoomOnDoubleClick={false}
          >
            <Background color="#c7c9c2" gap={24} size={1.2} />
            <MiniMap nodeStrokeWidth={3} pannable zoomable ariaLabel="Ontology minimap" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <footer className="canvas-footer"><p><strong>Click any node</strong> to make it the portal origin. Inspect details from the scope bar.</p><p>Presentation scope only · authority effect none</p></footer>
      </section>
      <FocusLens data={selected} onClose={() => setSelected(null)} />
    </main>
  );
}

export default function App() {
  return <ReactFlowProvider><Canvas /></ReactFlowProvider>;
}
