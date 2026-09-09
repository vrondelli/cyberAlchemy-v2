import { useEffect, useMemo, useReducer, useState } from "react";
import type { TourStep, VerifiedDataset } from "../contracts/bundle";
import type { FocusScene } from "../contracts/scene";
import { AppShell } from "../components/AppShell";
import { ClusterOverview } from "../components/ClusterOverview";
import { CommandPalette } from "../components/CommandPalette";
import { EvidenceFilters } from "../components/EvidenceFilters";
import { EvidenceInspector } from "../components/EvidenceInspector";
import { EvidenceWorkspace } from "../components/EvidenceWorkspace";
import { GroupedPortals } from "../components/GroupedPortals";
import { GuidedTour } from "../components/GuidedTour";
import { PathMode } from "../components/PathMode";
import { RelationLegend } from "../components/RelationLegend";
import { SearchBox } from "../components/SearchBox";
import { TrustRail } from "../components/TrustRail";
import { BODY_WAR_MANIFEST_URL } from "../data/datasetManifest";
import { loadDataset } from "../data/loadDataset";
import { GraphCanvas } from "../graph/GraphCanvas";
import { evidenceSelectionModel } from "../presentation/evidenceViewModels";
import { deriveTrustState } from "../presentation/trustState";
import { queryFocusScene } from "../scene/focusScene";
import { queryBoundedPath } from "../scene/pathQuery";
import { queryGroupedPortals } from "../scene/portalQuery";
import { buildSourceGraph, nodeKind } from "../scene/sourceGraph";
import { bodyWarTour } from "../tours/bodyWarTour";
import { parseDeepLink, serializeDeepLink } from "../state/deepLinks";
import { commandForEvent } from "../state/keyboard";
import { portalAction } from "../state/portalNavigation";
import { projectQuery } from "../state/queryProjection";
import { reduceWorkbench } from "../state/workbenchReducer";
import { createInitialWorkbenchState, type WorkbenchAction, type WorkbenchMode } from "../state/workbenchState";

function LoadingState({ error }: { readonly error?: string | null }) {
  const trust = deriveTrustState(null, error);
  return <main className={`load-state${error ? " load-state--failed" : ""}`} aria-busy={!error}><p className="eyebrow">{trust.title}</p><h1>Body War Ontology Workbench</h1><p>{trust.message}</p></main>;
}

function Workbench({ dataset }: { readonly dataset: VerifiedDataset }) {
  const graph = useMemo(() => buildSourceGraph(dataset), [dataset]);
  const initial = useMemo(() => {
    const base = createInitialWorkbenchState(dataset);
    const linked = parseDeepLink(window.location.search, dataset);
    return { ...base, ...linked, recovery: linked.recovery ?? base.recovery };
  }, [dataset]);
  const [state, dispatch] = useReducer((current: typeof initial, action: WorkbenchAction) => reduceWorkbench(current, action, dataset), initial);
  const [tourIndex, setTourIndex] = useState<number | null>(null);
  const [tourScene, setTourScene] = useState<readonly string[] | null>(dataset.graph.tour?.[0]?.nodeIds ?? null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pathStart, setPathStart] = useState(state.focusId);
  const firstNeighbor = graph.outgoing.get(state.focusId)?.[0]?.targetId ?? graph.incoming.get(state.focusId)?.[0]?.sourceId ?? dataset.graph.nodes[1]?.id ?? state.focusId;
  const [pathEnd, setPathEnd] = useState(firstNeighbor);
  const resultIds = useMemo(() => projectQuery(dataset.graph.nodes, state.query, state.filters), [dataset, state.query, state.filters]);
  const hasQueryProjection = Boolean(state.query || Object.values(state.filters).some((values) => values.length));
  const path = useMemo(() => queryBoundedPath(graph, pathStart, pathEnd), [graph, pathStart, pathEnd]);
  const scene = useMemo<FocusScene>(() => {
    if (state.mode === "path" && path.status === "found") return queryFocusScene(graph, { focusIds: path.nodeIds, radius: 0, visibleLimit: 18 });
    if (hasQueryProjection) return queryFocusScene(graph, { focusIds: resultIds.slice(0, 12), radius: 0, visibleLimit: 12 });
    if (tourScene?.length) return queryFocusScene(graph, { focusIds: tourScene, radius: 0, visibleLimit: Math.min(12, tourScene.length) });
    return queryFocusScene(graph, { focusIds: [state.focusId], radius: state.mode === "overview" ? 1 : 1, visibleLimit: 18 });
  }, [graph, hasQueryProjection, path, resultIds, state.focusId, state.mode, tourScene]);
  const portals = useMemo(() => queryGroupedPortals(graph, scene), [graph, scene]);
  const evidence = useMemo(() => evidenceSelectionModel(dataset, graph.relations, state.selection), [dataset, graph.relations, state.selection]);
  const tour = useMemo(() => bodyWarTour(dataset), [dataset]);
  const names = useMemo(() => new Map(dataset.graph.nodes.map((node) => [node.id, node.name])), [dataset]);
  const options = useMemo(() => dataset.graph.nodes.map((node) => ({ id: node.id, name: node.name })).sort((a, b) => a.name.localeCompare(b.name)), [dataset]);
  const kinds = useMemo(() => [...new Set(dataset.graph.nodes.map((node) => nodeKind(node.tags, node.knowledgeMeta?.category)))].sort(), [dataset]);

  useEffect(() => { window.history.replaceState(null, "", serializeDeepLink(state)); }, [state]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable=true]");
      if (event.key === "?" && !typing) { event.preventDefault(); setPaletteOpen(true); return; }
      if (event.key === "/" && !typing) { event.preventDefault(); document.querySelector<HTMLInputElement>("#ontology-search")?.focus(); return; }
      if (typing) return;
      const command = commandForEvent(event, state); if (command) { event.preventDefault(); dispatch(command.action); setTourScene(null); }
    };
    window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener);
  }, [state]);

  const setMode = (mode: WorkbenchMode) => { dispatch({ type: "set-mode", mode }); setTourScene(null); };
  const openTourStep = (step: TourStep) => { setTourScene(step.nodeIds); dispatch({ type: "pivot", focusId: step.nodeIds[0]! }); };
  const header = <header className="topbar"><div className="brand"><span className="brand__mark">BW</span><div><strong>Body War</strong><small>Ontology evidence workbench</small></div></div><nav aria-label="Workbench modes"><button className={state.mode === "overview" || state.mode === "focus" ? "is-active" : ""} onClick={() => setMode("overview")}>Overview</button><button className={state.mode === "path" ? "is-active" : ""} onClick={() => setMode("path")}>Path</button><button className={state.mode === "outline" || state.mode === "table" ? "is-active" : ""} onClick={() => setMode("outline")}>Evidence</button></nav><div className="topbar__actions"><button type="button" onClick={() => setPaletteOpen(true)} title="Commands (?)">⌘ Commands</button><GuidedTour steps={tour} active={tourIndex} onActive={setTourIndex} onOpen={openTourStep} /></div></header>;
  const toolbar = <div className="toolbar"><SearchBox value={state.query} count={resultIds.length} onChange={(query) => { dispatch({ type: "set-query", query }); setTourScene(null); }} /><EvidenceFilters kinds={kinds} selected={state.filters.kind ?? []} onChange={(values) => { dispatch({ type: "set-filter", group: "kind", values }); setTourScene(null); }} /><div className="history-controls"><button type="button" onClick={() => dispatch({ type: "history-back" })} disabled={state.historyIndex === 0} aria-label="Previous scene">←</button><button type="button" onClick={() => dispatch({ type: "history-forward" })} disabled={state.historyIndex >= state.history.length - 1} aria-label="Next scene">→</button></div></div>;
  const title = tourScene ? dataset.graph.tour?.find((step) => step.nodeIds === tourScene)?.title ?? "Business capability map" : names.get(state.focusId) ?? "Focused ontology scene";
  const main = <section className="graph-region">{state.recovery && <div className="recovery-notice" role="status">{state.recovery}<button onClick={() => dispatch({ type: "recover", message: null })}>Dismiss</button></div>}{state.mode === "path" ? <PathMode result={path} names={names} startId={pathStart} endId={pathEnd} options={options} onStart={setPathStart} onEnd={setPathEnd} /> : <ClusterOverview scene={scene} title={title} />}<GraphCanvas dataset={dataset} scene={scene} selection={state.selection} onSelectNode={(id) => dispatch({ type: "select", selection: { kind: "node", id } })} onSelectRelation={(id) => dispatch({ type: "select", selection: { kind: "relation", id } })} /><RelationLegend relations={scene.relations} /></section>;
  const portalArea = <GroupedPortals portals={portals} onOpen={(portal) => { dispatch(portalAction(portal)); setTourScene(null); setPathStart(portal.pivotFocusId); }} />;
  const workspaceIds = hasQueryProjection ? resultIds : scene.nodes.map((node) => node.id);
  return <AppShell header={header} trust={<TrustRail state={deriveTrustState(dataset)} />} toolbar={toolbar} main={main} portals={portalArea} inspector={<EvidenceInspector model={evidence} />} workspace={<EvidenceWorkspace dataset={dataset} ids={workspaceIds} selection={state.selection} mode={state.mode} onMode={setMode} onSelect={(id) => dispatch({ type: "select", selection: { kind: "node", id } })} />} overlay={<CommandPalette open={paletteOpen} state={state} onClose={() => setPaletteOpen(false)} onAction={dispatch} />} />;
}

export function OewApp() {
  const [dataset, setDataset] = useState<VerifiedDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { const controller = new AbortController(); void loadDataset(BODY_WAR_MANIFEST_URL, { signal: controller.signal }).then(setDataset).catch((reason: unknown) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Unknown dataset error"); }); return () => controller.abort(); }, []);
  return dataset ? <Workbench dataset={dataset} /> : <LoadingState error={error} />;
}
