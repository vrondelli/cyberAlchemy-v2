import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Background, BaseEdge, Controls, EdgeLabelRenderer, Handle, MiniMap, Position, ReactFlow, ReactFlowProvider, getSmoothStepPath, useNodesState, type EdgeProps, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WORKSPACE_GRAPH_SOURCE } from "./graph.generated";
import { PRESENTATION_FAMILIES, buildCanvasGraph, derivePortalScene, filterGraphByPredicates, materializeCanvasGraph, presentationFamily, relationPresentationStyle, semanticIconKey, type OntologyCanvasEdge, type OntologyCanvasNode, type OntologyNodeData, type OntologyRelationRecord, type PresentationFamily, type WorkspaceGraphSource } from "./graph";
import { shouldUseLayoutWorker, type LayoutResult } from "./layout";
import { SemanticIcon } from "./SemanticIcon";
import "./ontology.css";

const KIND_TONES: Record<string, string> = { Product: "amber", Project: "violet", Goal: "blue", "Product Capability": "lime", Participant: "cyan", Outcome: "rose", Artifact: "orange", Collection: "slate", "Project Entry": "violet", "External Reference": "ghost" };
type FilterId = "all" | PresentationFamily;

const OntologyNode = memo(function OntologyNode({ id, data, selected }: NodeProps<OntologyCanvasNode>) {
  const icon = semanticIconKey(data.record);
  return <div className={`ontology-node-shell tone-${KIND_TONES[data.record.kind] ?? "slate"}`}><Handle className="semantic-handle" type="target" position={Position.Left} /><button type="button" className={`ontology-node nodrag nopan ${selected ? "selected" : ""}`} data-portal-node-id={id} aria-label={`Focus ${data.record.label}, ${data.record.kind}, ${data.record.status}`} onClick={() => data.onActivate?.(id)}><span className="node-icon"><SemanticIcon icon={icon} /></span><span className="node-copy"><span className="node-topline"><span>{data.record.kind}</span><span>{data.record.status}</span></span><strong>{data.record.label}</strong><span className="node-id">{data.record.id}</span><span className="node-relations">{data.incoming.length} in · {data.outgoing.length} out</span></span></button><Handle className="semantic-handle" type="source" position={Position.Right} /></div>;
});

const OntologyEdge = memo(function OntologyEdge(props: EdgeProps<OntologyCanvasEdge>) {
  const [path, x, y] = getSmoothStepPath(props); const relation = props.data?.relation; const style = relationPresentationStyle(relation?.type ?? "");
  return <><BaseEdge {...props} path={path} /><EdgeLabelRenderer><span className={`relation-label ${style.token}`} data-relation-type={relation?.type} style={{ "--relation-color": style.color, transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` } as React.CSSProperties}>{relation?.type.replaceAll("_", " ")}</span></EdgeLabelRenderer></>;
});

function RelationList({ title, relations, direction }: { title: string; relations: readonly OntologyRelationRecord[]; direction: "incoming" | "outgoing" }) {
  return <section><h3>{title} · {relations.length}</h3>{relations.length ? relations.map((relation) => { const style = relationPresentationStyle(relation.type); return <article key={relation.id} className="relation-text-row" style={{ "--relation-color": style.color } as React.CSSProperties}><strong>{relation.type.replaceAll("_", " ")}</strong><code>{direction === "incoming" ? relation.source : relation.target}</code><p>{relation.claim}</p><small>{direction === "incoming" ? "toward selected record" : "from selected record"} · {style.family} presentation</small></article>; }) : <p className="no-relations">None in this projection.</p>}</section>;
}

function DetailDialog({ data, onClose }: { data: OntologyNodeData | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; if (data && dialog && !dialog.open) dialog.showModal(); if (!data && dialog?.open) dialog.close(); }, [data]);
  if (!data) return null;
  return <dialog ref={ref} className="ontology-detail" aria-labelledby="ontology-detail-title" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><article><header className={`tone-${KIND_TONES[data.record.kind] ?? "slate"}`}><span className="detail-icon"><SemanticIcon icon={semanticIconKey(data.record)} /></span><div><p>{data.record.kind}</p><h2 id="ontology-detail-title">{data.record.label}</h2></div><button type="button" aria-label="Close ontology detail" onClick={onClose}>×</button></header><div className="ontology-detail-body"><p className="detail-meaning">{data.record.meaning}</p><dl><div><dt>Stable identity</dt><dd><code>{data.record.id}</code></dd></div><div><dt>Status</dt><dd>{data.record.status}</dd></div><div><dt>Owner route</dt><dd>{data.record.owner_route}</dd></div><div><dt>Claim ceiling</dt><dd>{data.record.claim_ceiling}</dd></div></dl>{'raw' in data.record && <details><summary>Full source record and provenance</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{String((data.record as unknown as {raw:string}).raw)}</pre><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify((data.record as unknown as {binding:unknown}).binding,null,2)}</pre></details>}<div className="relation-text-view" aria-label="Textual relationship view"><RelationList title="Incoming" relations={data.incoming} direction="incoming" /><RelationList title="Outgoing" relations={data.outgoing} direction="outgoing" /></div></div><footer><strong>Projection, not authority.</strong> Predicate colors and families are local presentation cues.</footer></article></dialog>;
}

const nodeTypes = { ontology: OntologyNode }; const edgeTypes = { ontology: OntologyEdge };
let layoutRequestSequence = 0;

function Canvas({ source }: { source: WorkspaceGraphSource }) {
  const relationTypes = useMemo(() => [...new Set(source.relations.map((relation) => relation.type))].sort(), [source]);
  const unmappedPredicates = useMemo(() => relationTypes.filter((type) => presentationFamily(type) === "unmapped"), [relationTypes]);
  const [filter, setFilter] = useState<FilterId>("all"); const [portalId, setPortalId] = useState<string | null>(null); const [query, setQuery] = useState(""); const [selected, setSelected] = useState<OntologyNodeData | null>(null); const focusReturnId = useRef<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => filterGraphByPredicates(source, filter === "all" ? null : filter === "unmapped" ? unmappedPredicates : PRESENTATION_FAMILIES[filter]), [filter, unmappedPredicates, source]);
  const [built, setBuilt] = useState(() => buildCanvasGraph(filtered));
  useEffect(() => {
    if (!shouldUseLayoutWorker(filtered.nodes.length)) {
      setBuilt(buildCanvasGraph(filtered));
      return;
    }
    const worker = new Worker(new URL("./layout.worker.ts", import.meta.url), { type: "module" });
    const requestId = ++layoutRequestSequence;
    worker.onmessage = (event: MessageEvent<{ requestId: number; result: LayoutResult }>) => {
      if (event.data.requestId === requestId) setBuilt(materializeCanvasGraph(filtered, event.data.result));
      worker.terminate();
    };
    worker.postMessage({ requestId, input: { nodes: filtered.nodes, relations: filtered.relations } });
    return () => worker.terminate();
  }, [filtered]);
  const [nodes, setNodes, onNodesChange] = useNodesState<OntologyCanvasNode>(built.nodes); const portalScene = useMemo(() => derivePortalScene(filtered, portalId), [filtered, portalId]);
  const activate = useCallback((id: string) => { setPortalId(id); setSelected(null); }, []);
  useEffect(() => { setNodes(built.nodes.map((node) => ({ ...node, data: { ...node.data, onActivate: activate } }))); }, [activate, built.nodes, setNodes]);
  const renderedNodes = useMemo(() => { const normalized = deferredQuery.trim().toLowerCase(); return nodes.map((node) => { const className = [normalized && ![node.data.record.label, node.data.record.id, node.data.record.kind, node.data.record.status].some((value) => value.toLowerCase().includes(normalized)) ? "dimmed" : "", portalId && node.id === portalId ? "portal-origin" : "", portalId && portalScene.nodeIds.has(node.id) && node.id !== portalId ? "portal-neighbor" : "", portalId && !portalScene.nodeIds.has(node.id) ? "outside-portal" : ""].filter(Boolean).join(" "); return (node.className ?? "") === className ? node : { ...node, className }; }); }, [nodes, portalId, portalScene, deferredQuery]);
  const edges = useMemo(() => built.edges.map((edge) => ({ ...edge, className: [edge.className, portalId && !portalScene.edgeIds.has(edge.id) ? "outside-portal" : ""].filter(Boolean).join(" ") })), [built.edges, portalId, portalScene]);
  const portalNode = portalId ? renderedNodes.find((node) => node.id === portalId) ?? null : null;
  useEffect(() => { if (selected || !focusReturnId.current) return; const id = focusReturnId.current; focusReturnId.current = null; requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-portal-node-id="${CSS.escape(id)}"]`)?.focus()); }, [selected]);
  const closeDetail = () => { focusReturnId.current = selected?.record.id ?? null; setSelected(null); };
  const changeFilter = (next: FilterId) => { setFilter(next); setPortalId(null); setSelected(null); };
  const filters = useMemo<FilterId[]>(() => ["all", "structure", "coordination", "flow", "provenance", ...(unmappedPredicates.length ? ["unmapped" as const] : [])], [unmappedPredicates]);

  return <main className="ontology-surface"><header className="ontology-header"><div><p>Selected ontology graph · presentation only</p><h1>Follow meaning through its relations.</h1></div><div className="graph-epoch"><span>Graph epoch</span><code>{source.sourceEpoch.slice(0, 12)}</code><small>{source.nodes.length} nodes · {source.relations.length} relations · layout {built.layoutMs.toFixed(1)}ms</small></div></header><section className="ontology-toolbar"><label><span>Find a node</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, ID, kind, status…" /></label><div className="predicate-filters" role="group" aria-label="Exact predicate presentation filters">{filters.map((item) => { const predicates = item === "all" ? relationTypes : item === "unmapped" ? unmappedPredicates : PRESENTATION_FAMILIES[item]; return <button key={item} type="button" className={filter === item ? "active" : ""} aria-pressed={filter === item} title={item === "all" ? "All exact predicates" : predicates.join(", ")} onClick={() => changeFilter(item)}>{item}<span>{predicates.length}</span></button>; })}</div></section><section className={`portal-bar ${portalNode ? "active" : ""}`} data-testid="portal-scope" aria-live="polite">{portalNode ? <><span className="portal-symbol"><SemanticIcon icon={semanticIconKey(portalNode.data.record)} /></span><div><small>Portal focus · one-hop presentation scope</small><strong>{portalNode.data.record.label}</strong><span>{portalScene.nodeIds.size} visible nodes · {portalScene.edgeIds.size} connecting relations</span></div><div className="portal-actions"><button type="button" onClick={() => setSelected(portalNode.data)}>Inspect record &amp; relations</button><button type="button" onClick={() => setPortalId(null)}>Show filtered graph</button></div></> : <span>Choose a node as a portal. Connected records stay bright while the rest of the selected predicate view recedes.</span>}</section><section className="ontology-workbench"><div className={`flow-frame ${portalId ? "portal-active" : ""}`} aria-label="CyberAlchemy ontology canvas"><ReactFlow<OntologyCanvasNode, OntologyCanvasEdge> key={filter} nodes={renderedNodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onNodeClick={(_, node) => activate(node.id)} fitView fitViewOptions={{ padding: .16, maxZoom: 1 }} minZoom={.18} maxZoom={1.7} nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null} multiSelectionKeyCode={null} zoomOnDoubleClick={false} onlyRenderVisibleElements><Background color="#c7c9c2" gap={24} size={1.1} /><MiniMap nodeStrokeWidth={3} pannable zoomable ariaLabel="Ontology minimap" /><Controls showInteractive={false} /></ReactFlow></div><aside className="relation-legend"><h2>Presentation families</h2>{(["structure", "coordination", "flow", "provenance"] as const).map((family) => <section key={family}><h3><i className={`relation-swatch relation-${family}`} />{family}</h3><p>{PRESENTATION_FAMILIES[family].join(" · ")}</p></section>)}{unmappedPredicates.length > 0 && <section className="unmapped"><h3><i className="relation-swatch relation-unmapped" />Unmapped</h3><p>{unmappedPredicates.join(" · ")}</p></section>}<small>Color is redundant. Labels, arrows, and line patterns preserve predicate and direction.</small></aside></section><DetailDialog data={selected} onClose={closeDetail} /></main>;
}

export function OntologyCanvas({ source = WORKSPACE_GRAPH_SOURCE }: { source?: WorkspaceGraphSource }) { return <ReactFlowProvider><Canvas source={source} /></ReactFlowProvider>; }
