import { scheduleAfterHandshake } from "wlc-startup-probe";
import type { EssaysSavedDraftObservation, EssaysStagedBuffer } from "@cyberalchemy/essays-runtime/markdown";
import type { EssayWorkspace } from "@cyberalchemy/essays-runtime/model";
import "@cyberalchemy/essays-runtime/styles.css";
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { WorkspaceRuntime } from "./domain/runtime";
import { filterWorkspaceRecords, toWorkspaceViewModel, WORKSPACE_COLLECTIONS, type WorkspaceCollection, type WorkspaceRecord } from "./domain/workspace";
import { AgentDock } from "./features/agents/AgentDock";
import { markNextPaint } from "./performance";
import { isSurfaceVisible } from "./features/control-center/layout";
import "./features/control-center/control-center.css";

const loadEssaysApp = () => import("@cyberalchemy/essays-runtime");
const loadOntologyCanvas = () => import("./features/ontology/OntologyCanvas");
const loadChatSurface = () => import("./features/chat/ChatSurface");
const loadFoundationSurface = () => import("./features/foundation/FoundationSurface");
const EssaysApp = memo(lazy(loadEssaysApp));
const OntologyCanvas = memo(lazy(() => loadOntologyCanvas().then((module) => ({ default: module.OntologyCanvas }))));
const ChatSurface = memo(lazy(() => loadChatSurface().then((module) => ({ default: module.ChatSurface }))));
const FoundationSurface = memo(lazy(() => loadFoundationSurface().then((module) => ({ default: module.FoundationSurface }))));
const MemoAgentDock = memo(AgentDock);

const COLLECTION_LABELS: Record<WorkspaceCollection, string> = {
  definitions: "Definitions",
  products: "Products",
  projects: "Projects",
  ontologies: "Ontologies",
};

type Surface = "explore" | "foundation" | "ontology" | "essays" | "chat";

function projectFromHash(hash: string): string | null {
  const match = /^#\/projects\/(.+)$/.exec(hash);
  return match ? decodeURIComponent(match[1]) : null;
}

function surfaceFromHash(hash: string): Surface {
  if (hash === "#/foundation") return "foundation";
  if (hash === "#/ontology") return "ontology";
  if (hash === "#/chat") return "chat";
  return hash === "#/essays" || projectFromHash(hash) === "CA2-PROJECT-ESSAYS" ? "essays" : "explore";
}

function AppIcon({ name }: { name: Surface | "mark" }) {
  if (name === "mark") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" /><path d="m8 14 4-7 4 7M9.5 12h5" /></svg>;
  if (name === "essays") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6V3Z" /><path d="M9 9h6M9 13h6M9 17h4M15 3v4h4" /></svg>;
  if (name === "ontology") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="17" r="2.5" /><circle cx="19" cy="17" r="2.5" /><path d="m10.7 7.2-4.4 7.6m7-7.6 4.4 7.6M7.5 17h9" /></svg>;
  if (name === "chat") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z" /><path d="M8 9h8M8 12h5" /></svg>;
  if (name === "foundation") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16M6 19v-5h12v5M8 14V9h8v5M10 9V4h4v5" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><circle cx="12" cy="17" r="3" /><path d="m9.5 8.7 1.4 5.3m3.6-5.3-1.4 5.3M10 7h4" /></svg>;
}

const RailButton = memo(function RailButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: Surface; onClick: () => void }) {
  return (
    <button type="button" className={active ? "rail-action active" : "rail-action"} aria-label={label} aria-current={active ? "page" : undefined} onClick={onClick}>
      <AppIcon name={icon} />
      <span className="rail-tooltip" role="tooltip">{label}</span>
    </button>
  );
});

function RecordDetail({ record, onOpenEssays }: { record: WorkspaceRecord; onOpenEssays: () => void }) {
  const isEssays = record.collection === "projects" && record.recordId === "CA2-PROJECT-ESSAYS";
  return (
    <article className="record-detail" aria-labelledby="record-title">
      <div className="detail-heading">
        <div><p className="record-kind">{COLLECTION_LABELS[record.collection].slice(0, -1)}</p><h2 id="record-title">{record.label}</h2></div>
        <span className={`status status-${record.status.replaceAll("_", "-")}`}>{record.status}</span>
      </div>
      <p className="record-id">{record.recordId}</p>
      <p className="meaning">{record.meaning}</p>
      <dl className="detail-grid">
        <div><dt>Owner route</dt><dd>{record.ownerRoute}</dd></div>
        <div><dt>Boundary</dt><dd>{record.boundary}</dd></div>
        <div className="wide"><dt>Claim ceiling</dt><dd>{record.claimCeiling}</dd></div>
        <div className="wide"><dt>Provenance</dt><dd><ul>{record.sourceRefs.map((ref) => <li key={ref}>{ref}</li>)}</ul></dd></div>
      </dl>
      {isEssays && <button className="project-entry" type="button" onClick={onOpenEssays}><span>Open owned capability</span><strong>Essays <span aria-hidden="true">→</span></strong></button>}
    </article>
  );
}

const ExploreSurface = memo(function ExploreSurface({ onOpenEssays }: { onOpenEssays: () => void }) {
  const runtime = useMemo(() => new WorkspaceRuntime(), []);
  const snapshot = useMemo(() => runtime.inspectWorkspace(), [runtime]);
  const view = useMemo(() => toWorkspaceViewModel(snapshot), [snapshot]);
  const [collection, setCollection] = useState<WorkspaceCollection>("projects");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("CA2-PROJECT-ESSAYS");
  const records = filterWorkspaceRecords(view.collections[collection], query);
  const selected = view.collections[collection].find((item) => item.recordId === selectedId) ?? records[0] ?? view.collections[collection][0];

  const chooseCollection = (next: WorkspaceCollection) => {
    setCollection(next);
    setQuery("");
    setSelectedId(view.collections[next][0]?.recordId ?? "");
    window.history.replaceState(null, "", `#/collections/${next}`);
  };

  return (
    <main className="workspace-main">
      <header className="surface-header">
        <div><p className="eyebrow">Semantic read plane</p><h1>Explore the system.</h1></div>
        <div className="epoch-card" aria-label="Workspace source epoch"><span>Source epoch</span><code>{snapshot.sourceEpoch.slice(0, 12)}</code><small>generated · read-only</small></div>
      </header>
      <div className="collection-tabs" role="tablist" aria-label="Workspace collections">
        {WORKSPACE_COLLECTIONS.map((item) => <button key={item} role="tab" aria-selected={collection === item} className={collection === item ? "active" : ""} onClick={() => chooseCollection(item)}>{COLLECTION_LABELS[item]} <span>{view.collections[item].length}</span></button>)}
      </div>
      <section className="explorer" aria-label={`${COLLECTION_LABELS[collection]} explorer`}>
        <div className="record-browser">
          <div className="browser-heading"><div><p className="section-number">{String(WORKSPACE_COLLECTIONS.indexOf(collection) + 1).padStart(2, "0")}</p><h2>{COLLECTION_LABELS[collection]}</h2></div><span>{view.collections[collection].length} records</span></div>
          <label className="search-field"><span className="sr-only">Search {COLLECTION_LABELS[collection]}</span><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${collection}…`} /></label>
          <div className="record-list" role="list">
            {records.map((record) => <button key={record.recordId} role="listitem" className={selected?.recordId === record.recordId ? "selected" : ""} onClick={() => setSelectedId(record.recordId)}><span className="record-list-main"><strong>{record.label}</strong><small>{record.recordId}</small></span><span className="record-arrow" aria-hidden="true">→</span></button>)}
            {records.length === 0 && <p className="empty-result">No records match “{query}”.</p>}
          </div>
        </div>
        {selected && <RecordDetail record={selected} onOpenEssays={onOpenEssays} />}
      </section>
      <footer className="workspace-footer"><p><strong>Projection, not authority.</strong> Visibility does not prove admission, conformance, correctness, or product value.</p><p>Snapshot <code>{snapshot.snapshotId.slice(0, 16)}</code></p></footer>
    </main>
  );
});

function SurfaceFrame({ children }: { children: ReactNode }) {
  return <section className="surface-frame">{children}</section>;
}

export default function WorkspaceApp() {
  const initialSurface = useMemo(() => surfaceFromHash(window.location.hash), []);
  const [surface, setSurface] = useState<Surface>(initialSurface);
  const [controlCenter, setControlCenter] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const visible = (candidate: Surface) => isSurfaceVisible(candidate, surface, controlCenter);
  const toggleControlCenter = () => {
    if (!controlCenter) setMountedSurfaces(current => {
      const updated = current.has("chat") ? current : new Set([...current, "chat" as Surface]);
      mountedSurfacesRef.current = updated;
      return updated;
    });
    setControlCenter(value => !value);
  };
  const [mountedSurfaces, setMountedSurfaces] = useState<ReadonlySet<Surface>>(() => new Set([initialSurface]));
  const surfaceRef = useRef(surface);
  const mountedSurfacesRef = useRef(mountedSurfaces);
  surfaceRef.current = surface;
  mountedSurfacesRef.current = mountedSurfaces;
  const [essayWorkspace, setEssayWorkspace] = useState<EssayWorkspace | null>(null);
  const [stagedBuffer, setStagedBuffer] = useState<EssaysStagedBuffer | null>(null);
  const [savedDraftObservation, setSavedDraftObservation] = useState<EssaysSavedDraftObservation | null>(null);

  useEffect(() => {
    const update = () => {
      const next = surfaceFromHash(window.location.hash);
      surfaceRef.current = next;
      setSurface(next);
      setMountedSurfaces((current) => {
        const updated = current.has(next) ? current : new Set([...current, next]);
        mountedSurfacesRef.current = updated;
        return updated;
      });
      markNextPaint("workspace.hash-navigation-to-paint", { surface: next });
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    return scheduleAfterHandshake(() => {
    const warmSurfaces = () => { void Promise.all([loadEssaysApp(), loadOntologyCanvas(), loadChatSurface(), loadFoundationSurface()]); };
    const idleApi = window as unknown as {
      requestIdleCallback?: (callback: () => void, options: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (idleApi.requestIdleCallback && idleApi.cancelIdleCallback) {
      const idleId = idleApi.requestIdleCallback(warmSurfaces, { timeout: 250 });
      return () => idleApi.cancelIdleCallback?.(idleId);
    }
    const timeoutId = window.setTimeout(warmSurfaces, 0);
    return () => window.clearTimeout(timeoutId);
    });
  }, []);

  const navigate = useCallback((next: Surface) => {
    if (next === surfaceRef.current) return;
    const isFirstMount = !mountedSurfacesRef.current.has(next);
    const hash = next === "essays" ? "#/essays" : next === "foundation" ? "#/foundation" : next === "ontology" ? "#/ontology" : next === "chat" ? "#/chat" : "#/collections/projects";
    window.history.replaceState(null, "", hash);
    surfaceRef.current = next;
    setSurface(next);
    setMountedSurfaces((current) => {
      const updated = current.has(next) ? current : new Set([...current, next]);
      mountedSurfacesRef.current = updated;
      return updated;
    });
    markNextPaint(isFirstMount ? "workspace.cold-navigation-to-paint" : "workspace.navigation-to-paint", {
      surface: next,
      navigationKind: isFirstMount ? "cold-first-mount" : "steady-mounted-switch",
    });
    if (next === "foundation") markNextPaint("foundation.navigation-to-paint", { surface: next });
  }, []);
  const openEssays = useCallback(() => navigate("essays"), [navigate]);
  const openExplore = useCallback(() => navigate("explore"), [navigate]);
  const openFoundation = useCallback(() => navigate("foundation"), [navigate]);
  const openOntology = useCallback(() => navigate("ontology"), [navigate]);
  const openChat = useCallback(() => navigate("chat"), [navigate]);
  const receiveEssayWorkspace = useCallback((workspace: EssayWorkspace | null) => setEssayWorkspace(workspace), []);

  return (
    <div className={`workspace-shell${controlCenter ? " workspace-control-center" : ""}${chatExpanded ? " chat-expanded" : ""}${surface === "chat" ? " chat-only" : ""}`}>
      <aside className="app-rail" aria-label="Application navigation">
        <div className="brand-mark" aria-label="CyberAlchemy Workspace"><AppIcon name="mark" /></div>
        <nav aria-label="Workspace surfaces">
          <RailButton active={surface === "explore"} label="Explore workspace" icon="explore" onClick={openExplore} />
          <RailButton active={surface === "foundation"} label="Open Foundation" icon="foundation" onClick={openFoundation} />
          <RailButton active={surface === "ontology"} label="Open Ontology" icon="ontology" onClick={openOntology} />
          <RailButton active={surface === "essays"} label="Open Essays" icon="essays" onClick={openEssays} />
          <RailButton active={surface === "chat"} label="Open governed chat" icon="chat" onClick={openChat} />
        </nav>
        <div className="local-indicator" title="Local candidate runtime"><span /><span className="sr-only">Local candidate runtime</span></div>
      </aside>
      <SurfaceFrame>
        <div className="control-center-controls">
          <button type="button" aria-pressed={controlCenter} onClick={toggleControlCenter}>Control center · {controlCenter ? "On" : "Off"}</button>
          {controlCenter && <button type="button" aria-pressed={chatExpanded} onClick={() => setChatExpanded(value => !value)}>{chatExpanded ? "Compact chat" : "Expand chat"}</button>}
          {controlCenter && <small>Layout prototype · artifact navigation does not change the chat target</small>}
        </div>
        {mountedSurfaces.has("explore") && <div className="surface-view" hidden={!visible("explore")}><ExploreSurface onOpenEssays={openEssays} /></div>}
        {mountedSurfaces.has("foundation") && <div className="surface-view" hidden={!visible("foundation")}><Suspense fallback={<p className="surface-loading">Loading Foundation snapshot…</p>}><FoundationSurface /></Suspense></div>}
        {mountedSurfaces.has("ontology") && <div className="surface-view" hidden={!visible("ontology")}><Suspense fallback={<p className="surface-loading">Preparing ontology…</p>}><OntologyCanvas /></Suspense></div>}
        {mountedSurfaces.has("chat") && <div className="surface-view control-center-chat" hidden={!visible("chat")}><Suspense fallback={<p className="surface-loading">Connecting to the Agent Reasoning Engine…</p>}><ChatSurface /></Suspense></div>}
        {mountedSurfaces.has("essays") && <div className="surface-view" hidden={!visible("essays")}><Suspense fallback={<p className="surface-loading">Preparing Essays…</p>}><div className="essays-composition">
          <section className="essays-owned-plane" aria-label="Essays project capability">
            <div className="ownership-strip"><span>Essays-owned action plane</span><strong>Workspace composes · Essays decides</strong></div>
            <EssaysApp
              embedded
              onWorkspaceChange={receiveEssayWorkspace}
              stagedBuffer={stagedBuffer}
              onSavedDraftObservation={setSavedDraftObservation}
            />
          </section>
          <MemoAgentDock
            essayWorkspace={essayWorkspace}
            savedDraftObservation={savedDraftObservation}
            onStageBuffer={setStagedBuffer}
          />
        </div></Suspense></div>}
      </SurfaceFrame>
    </div>
  );
}
