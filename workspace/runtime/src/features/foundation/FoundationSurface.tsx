import { useEffect, useMemo, useState } from "react";
import { filterFoundationDefinitions, WorkspaceFoundationAdapter } from "../../domain/foundation";
import {
  type FoundationLivePreflightState,
  WorkspaceCapabilityInstanceAdapter,
} from "../../domain/foundation-capability-instance";
import { detectEssaysTauriAgentBridge } from "../agents/tauri-agent-bridge";
import { markNextPaint } from "../../performance";
import "./foundation.css";

export function FoundationSurface() {
  const adapter = useMemo(() => new WorkspaceFoundationAdapter(), []);
  const snapshot = useMemo(() => adapter.inspectFoundation(), [adapter]);
  const capabilityInstanceAdapter = useMemo(() => new WorkspaceCapabilityInstanceAdapter(), []);
  const capabilityProjection = useMemo(() => capabilityInstanceAdapter.inspect(), [capabilityInstanceAdapter]);
  const capabilityInstance = capabilityProjection.capability_instance;
  const [livePreflight, setLivePreflight] = useState<FoundationLivePreflightState | { status: "pending" }>({ status: "pending" });
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(snapshot.definitions[0]?.definitionId ?? "");
  const definitions = filterFoundationDefinitions(snapshot.definitions, query);
  const selected = snapshot.definitions.find((definition) => definition.definitionId === selectedId) ?? definitions[0];
  useEffect(() => {
    let active = true;
    void capabilityInstanceAdapter
      .runLiveEffectFreePreflight(detectEssaysTauriAgentBridge())
      .then((result) => { if (active) setLivePreflight(result); });
    return () => { active = false; };
  }, [capabilityInstanceAdapter]);
  const changeQuery = (value: string) => {
    setQuery(value);
    markNextPaint("foundation.search-to-paint", { resultCount: filterFoundationDefinitions(snapshot.definitions, value).length });
  };
  const chooseDefinition = (definitionId: string) => {
    setSelectedId(definitionId);
    markNextPaint("foundation.selection-to-paint", { definitionId });
  };

  return <main className="foundation-surface">
    <header className="foundation-hero">
      <div><p>Foundation edge · Capability Instance candidate</p><h1>Everything connects through an explicit contract.</h1><span>{capabilityInstance.product_candidate.outcome}</span></div>
      <dl><div><dt>Instance</dt><dd><code>{capabilityInstance.instance_id}</code></dd></div><div><dt>Lab bindings</dt><dd>{capabilityProjection.lab_definition_bindings.length}</dd></div><div><dt>Authority effect</dt><dd>{snapshot.authorityEffect}</dd></div></dl>
    </header>

    <section className="foundation-instance" aria-label="Capability Instance candidate">
      <header><div><p>Lab-defined semantic core</p><h2>Capability Instance</h2></div><span>{capabilityInstance.lifecycle.state}</span></header>
      <p>{capabilityInstance.product_candidate.outcome}</p>
      <dl><div><dt>Instance identity</dt><dd><code>{capabilityInstance.instance_id}@{capabilityInstance.version}</code></dd></div><div><dt>Parent Product Capability</dt><dd><code>{capabilityInstance.parent_capability_ref}</code></dd></div><div><dt>Host</dt><dd>{capabilityInstance.host}</dd></div><div><dt>Installation</dt><dd>{capabilityInstance.installation.binding_status}</dd></div><div><dt>Effect envelope</dt><dd>{capabilityInstance.effect_envelope.effects.length === 0 ? "Empty · effect-free" : "Effectful"}</dd></div><div><dt>Host execution</dt><dd>{capabilityProjection.runtime.effectful_invocation_available ? "Available" : "Not bound"}</dd></div></dl>
      <footer><strong>Instance ≠ Parent · Conformance ≠ Authority.</strong> “Add-on” is a UI label only; the canonical semantic subject is Capability Instance.</footer>
    </section>

    <section className="foundation-boundary" aria-label="Foundation integration boundary">
      <div><span className="foundation-status-dot" /><div><small>Integration state</small><strong>Capability Instance projection current · effect-free preflight available</strong></div></div>
      <p>The Foundation now binds the Tauri Workspace host and local-process principal shape for preparation. The existing agent control plane still owns every execution and receipt.</p>
      <dl><div><dt>Canonical host</dt><dd>{capabilityInstance.host}</dd></div><div><dt>Host control plane</dt><dd>Tauri agent control plane</dd></div><div><dt>Foundation may commit Host state</dt><dd>No</dd></div><div><dt>Effectful invocation</dt><dd>Not bound by this candidate</dd></div></dl>
      <article className={`foundation-preflight foundation-preflight-${livePreflight.status === "complete" ? livePreflight.evidence.outcome.toLowerCase() : livePreflight.status}`} aria-live="polite">
        <div><small>Live effect-free preflight</small><strong>{livePreflight.status === "pending" ? "Checking Tauri host evidence…" : livePreflight.status === "unavailable" ? "Host evidence unavailable" : livePreflight.evidence.outcome}</strong></div>
        {livePreflight.status === "unavailable" && <p><code>{livePreflight.code}</code> · {livePreflight.reason}. Browser mode does not fabricate an active host.</p>}
        {livePreflight.status === "complete" && <><p><code>{livePreflight.evidence.evidence_id}</code></p><dl><div><dt>Principal</dt><dd><code>{livePreflight.evidence.subject.principal_ref || "unresolved"}</code></dd></div><div><dt>Source currentness</dt><dd>{livePreflight.evidence.source_currentness}</dd></div><div><dt>Execution attempted</dt><dd>No</dd></div><div><dt>Failed codes</dt><dd>{livePreflight.evidence.failed_codes.length ? livePreflight.evidence.failed_codes.join(", ") : "None"}</dd></div></dl></>}
      </article>
    </section>

    <section className="foundation-grid">
      <article className="foundation-stack">
        <div><small>07</small><strong>Product experiences, reasoning engines, harnesses</strong></div>
        <div><small>06</small><strong>Host Agent Control Plane</strong><span>Workspace-owned requests, approvals, claims, results, effects</span></div>
        <div><small>05</small><strong>Base adapters</strong><span>IDE · CLI · VCS · filesystem · agent runtime · provider</span></div>
        <div><small>04</small><strong>Boundary kernel</strong><span>Typed ports · capability profiles · effect envelopes</span></div>
        <div><small>03</small><strong>Evidence kernel</strong><span>Receipts · snapshots · replay</span></div>
        <div><small>02</small><strong>Registry kernel</strong><span>Identity · currentness · compatibility · lifecycle</span></div>
        <div><small>01</small><strong>Governance kernel</strong><span>Facts · requests · decisions · gates</span></div>
        <div><small>00</small><strong>Semantic substrate</strong><span>Definitions · source identity · ownership</span></div>
      </article>

      <article className="foundation-definitions">
        <header><div><p>Compatibility projection</p><h2>Legacy CAF vocabulary</h2></div><label><span className="sr-only">Search legacy Foundation definitions</span><input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Search definitions…" /></label></header>
        <div className="foundation-definition-browser">
          <nav aria-label="Foundation definitions">{definitions.map((definition) => <button type="button" key={definition.definitionId} className={selected?.definitionId === definition.definitionId ? "selected" : ""} onClick={() => chooseDefinition(definition.definitionId)}><span>{definition.definitionId}</span><strong>{definition.title}</strong></button>)}</nav>
          {selected ? <section className="foundation-definition-detail"><div><span>{selected.disposition}</span><code>{selected.definitionId}</code></div><h3>{selected.title}</h3><p>{selected.summary}</p><dl><div><dt>Currentness</dt><dd>{selected.currentness}</dd></div><div><dt>Owner route</dt><dd>{selected.ownerRoute}</dd></div><div><dt>Boundary</dt><dd>{selected.boundary}</dd></div><div><dt>Claim ceiling</dt><dd>{selected.claimCeiling}</dd></div><div><dt>Source</dt><dd><code>{selected.sourceRef}</code></dd></div></dl></section> : <p>No definition matches “{query}”.</p>}
        </div>
      </article>
    </section>

    <footer className="foundation-footer"><strong>Candidate projection and preflight, not activation.</strong> This surface does not admit a Lab definition, adopt the Product Capability, establish conformance, authorize an effect, or issue a Host receipt.</footer>
  </main>;
}
