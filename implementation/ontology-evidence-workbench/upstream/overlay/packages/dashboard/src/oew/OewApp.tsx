// @ts-nocheck
import {useEffect, useMemo, useState} from "react";
import CommandPalette from "./CommandPalette.tsx";
import EvidenceFilters from "./EvidenceFilters.tsx";
import EvidenceInspector from "./EvidenceInspector.tsx";
import EvidenceWorkspace from "./EvidenceWorkspace.tsx";
import PokerTour from "./PokerTour.tsx";
import TrustRail from "./TrustRail.tsx";
import {loadOewBundle} from "./loadOewBundle.ts";
import {createOewStore} from "./store.ts";
import {buildDeepLink, keyboardCommand, parseDeepLink} from "./keyboard.ts";
import {allEvidenceRows, buildViewModel} from "./viewParity.ts";
import "./oew.css";

const EXPECTED_RECEIPT_SHA256 =
  "d60fe2048800a1c376dc9d7f04afbfed314f619783d0cb0059059597704ebb01";
const RUN_ID = "SWU-OCGP-008";

export function attachRelationProjections(model, bundle) {
  const projections = bundle?.relationProjectionBySourceRef;
  if (!projections) return model;
  const rows = model.rows.map((row) => ({
    ...row,
    relationProjection: projections[row.sourceRef] ?? null,
  }));
  const selected = model.selected
    ? {
        ...model.selected,
        relationProjection: projections[model.selected.sourceRef] ?? null,
      }
    : null;
  return {...model, rows, selected};
}

function Navigator({filters, onFilters, onSearch, onStartTour}) {
  return (
    <aside className="oew-navigator" aria-label="Evidence navigator">
      <div className="oew-panel-heading">Navigator</div>
      <button className="oew-search-trigger" onClick={onSearch}>
        <span>⌕</span><span>Search evidence</span><kbd>⌘ K</kbd>
      </button>
      <section className="oew-saved">
        <h2>Saved views</h2>
        <button className="is-active"><span>◇</span> Poker O13</button>
        <button><span>⚡</span> Conflicts</button>
        <button><span>?</span> Indeterminate</button>
      </section>
      <button className="oew-tour-start" onClick={onStartTour}>
        <span aria-hidden="true">▶</span>
        <span><strong>Walk the evidence</strong><small>6 exact steps</small></span>
      </button>
      <EvidenceFilters filters={filters} onChange={onFilters} />
      <div className="oew-nav-ceiling">
        <strong>Read-only prototype</strong>
        <span>No edit, accept, promote, or publish actions.</span>
      </div>
    </aside>
  );
}

function ReceiptDrawer({receipt, open, onClose}) {
  if (!open) return null;
  return (
    <aside className="oew-receipts" aria-label="Verification receipts">
      <div>
        <span className="oew-kicker">Receipt drawer</span>
        <h2>Why the labels are trusted</h2>
      </div>
      <dl>
        <div><dt>Source run</dt><dd>{receipt.source_run.run_id}</dd></div>
        <div><dt>Terminal receipt</dt><dd className="oew-mono">{receipt.source_run.terminal_receipt_sha256}</dd></div>
        <div><dt>Graph digest</dt><dd className="oew-mono">{receipt.determinism.graph_sha256}</dd></div>
        <div><dt>Sidecar digest</dt><dd className="oew-mono">{receipt.determinism.sidecar_sha256}</dd></div>
        <div><dt>Adapter</dt><dd>{receipt.adapter.name}@{receipt.adapter.version}</dd></div>
        <div><dt>Upstream pin</dt><dd className="oew-mono">{receipt.upstream_contract.commit}</dd></div>
        <div><dt>Protected source</dt><dd>{receipt.protected_source_check.read_only ? "read-only ✓" : "blocked"}</dd></div>
        <div><dt>Authority</dt><dd>authority_effect: {receipt.authority_effect}</dd></div>
      </dl>
      <button onClick={onClose}>Close receipts</button>
    </aside>
  );
}

export default function OewApp() {
  const [status, setStatus] = useState({kind: "loading", detail: "Loading exact evidence…"});
  const [bundle, setBundle] = useState(null);
  const [store, setStore] = useState(null);
  const [selectedSourceRef, setSelectedSourceRef] = useState(null);
  const [view, setView] = useState("graph");
  const [filters, setFilters] = useState({
    text: "",
    kind: [],
    relation: [],
    disposition: [],
    diagnostic: [],
  });
  const [commandOpen, setCommandOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const [traceActive, setTraceActive] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [recoveryNotice, setRecoveryNotice] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    loadOewBundle({
      baseUrl: "/oew-data/",
      token,
      expectedReceiptSha256: EXPECTED_RECEIPT_SHA256,
    })
      .then((loaded) => {
        const nextStore = createOewStore(loaded);
        const link = parseDeepLink(window.location.search, loaded.sourceRefs);
        nextStore.selectSourceRef(link.selectedSourceRef);
        setBundle(loaded);
        setStore(nextStore);
        setSelectedSourceRef(link.selectedSourceRef);
        setView(link.surface);
        setFilters((current) => ({...current, ...link.filters}));
        setRecoveryNotice(
          link.recoveredInvalidSelection
            ? `Unknown evidence recovered to ${link.selectedSourceRef}.`
            : null,
        );
        setStatus({kind: "ready", detail: "Exact evidence ready"});
      })
      .catch((error) => {
        setStatus({kind: "blocked", detail: error instanceof Error ? error.message : String(error)});
      });
  }, []);

  const model = useMemo(
    () =>
      bundle
        ? attachRelationProjections(
            buildViewModel(bundle, {selectedSourceRef, filters}),
            bundle,
          )
        : {rows: [], selected: null, selectedSourceRef: null, groundingPath: [], visibleResidue: []},
    [bundle, selectedSourceRef, filters],
  );
  const paletteRows = useMemo(
    () => (bundle ? allEvidenceRows(bundle).filter((row) => {
      const query = filters.text.toLowerCase();
      return !query || `${row.sourceRef} ${row.name} ${row.sourceKind} ${row.relation ?? ""} ${row.sourcePath ?? ""}`.toLowerCase().includes(query);
    }) : []),
    [bundle, filters.text],
  );

  const select = (sourceRef, nextView = view) => {
    if (!store?.getBySourceRef(sourceRef)) {
      setRecoveryNotice(`Unknown evidence recovered to F1.`);
      sourceRef = "F1";
    }
    store?.selectSourceRef(sourceRef);
    setSelectedSourceRef(sourceRef);
    setView(nextView);
    setCommandOpen(false);
    const url = buildDeepLink({runId: RUN_ID, selectedSourceRef: sourceRef, surface: nextView, filters});
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    const listener = (event) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName) && event.key !== "Escape") return;
      const command = keyboardCommand(event);
      if (!command) return;
      if (command !== "dismiss") event.preventDefault();
      if (command === "open-search") setCommandOpen(true);
      if (command === "toggle-inspector") setInspectorOpen((value) => !value);
      if (command === "toggle-receipts") setReceiptsOpen((value) => !value);
      if (command.startsWith("view-")) setView(command.replace("view-", ""));
      if (command === "dismiss") {
        setCommandOpen(false);
        setTourOpen(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  if (status.kind === "blocked") {
    return (
      <main className="oew-failure" role="alert">
        <span className="oew-kicker">Fail-closed evidence boundary</span>
        <h1>Workbench blocked</h1>
        <p>{status.detail}</p>
        <code>No graph was rendered behind this error.</code>
      </main>
    );
  }
  if (!bundle || !store) {
    return (
      <main className="oew-loading">
        <span className="oew-loader" aria-hidden="true" />
        <p>{status.detail}</p>
      </main>
    );
  }

  return (
    <div className="oew-app">
      <TrustRail receipt={bundle.receipt} onOpenReceipts={() => setReceiptsOpen(true)} />
      {recoveryNotice && (
        <div className="oew-recovery" role="status">
          {recoveryNotice}<button onClick={() => setRecoveryNotice(null)}>Dismiss</button>
        </div>
      )}
      <div className={`oew-shell ${inspectorOpen ? "has-inspector" : ""}`}>
        <Navigator
          filters={filters}
          onFilters={setFilters}
          onSearch={() => setCommandOpen(true)}
          onStartTour={() => { setTourOpen(true); setTourStep(0); select("F1", "graph"); }}
        />
        <EvidenceWorkspace
          model={model}
          onSelect={select}
          onTrace={() => { setTraceActive((value) => !value); select("F1", "graph"); }}
          onView={setView}
          traceActive={traceActive}
          view={view}
        />
        {inspectorOpen && (
          <EvidenceInspector
            entry={selectedSourceRef ? {
              ...bundle.sourceRefIndex[selectedSourceRef],
              relationProjection:
                bundle.relationProjectionBySourceRef?.[selectedSourceRef] ?? null,
            } : null}
            onClose={() => setInspectorOpen(false)}
          />
        )}
      </div>
      <PokerTour
        onClose={() => setTourOpen(false)}
        onFocus={select}
        onOpenReceipts={() => setReceiptsOpen(true)}
        onStep={setTourStep}
        open={tourOpen}
        step={tourStep}
      />
      <ReceiptDrawer open={receiptsOpen} onClose={() => setReceiptsOpen(false)} receipt={bundle.receipt} />
      <CommandPalette
        onClose={() => setCommandOpen(false)}
        onQuery={(text) => setFilters((current) => ({...current, text}))}
        onSelect={select}
        open={commandOpen}
        query={filters.text}
        results={paletteRows}
      />
    </div>
  );
}
