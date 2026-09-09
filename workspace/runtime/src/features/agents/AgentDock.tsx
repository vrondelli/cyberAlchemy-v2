import type { EssaysSavedDraftObservation, EssaysStagedBuffer } from "@cyberalchemy/essays-runtime/markdown";
import type { EssayWorkspace } from "@cyberalchemy/essays-runtime/model";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ProposalHandoffStore,
  canAcceptSavedDraft,
  dispositionPreflight,
  hasExactSavedEvidence,
  hasLatestSavedDivergence,
  isDispositionAttemptExpired,
  reduceProposalHandoff,
  requiresReplacementConfirmation,
  sha256Evidence,
  toStagedBuffer,
  type DispositionKind,
  type ProposalHandoffRecord,
} from "./proposal-handoff";
import {
  acceptProposalCommand,
  createWorkspaceCommand,
  detectEssaysTauriAgentBridge,
  rejectProposalCommand,
  type Proposal,
  type WorkspaceSnapshot,
} from "./tauri-agent-bridge";

function requestId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function messageFor(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function stageExplanation(handoff: ProposalHandoffRecord | null): string {
  if (!handoff) return "No proposal is staged.";
  const messages: Record<ProposalHandoffRecord["stage"], string> = {
    unstaged: "The handoff record exists but has not reached the editor.",
    "staged-unsaved": "Staged in the working buffer. Save it in Essays before ledger acceptance.",
    "saved-exact": "A later Essays save contains the exact staged canonical Markdown.",
    "reconciliation-needed": "The later Essays save differs. Acceptance is disabled; reject or explicitly restage.",
    "disposition-in-flight": "The disposition request is in flight.",
    "disposition-unknown": "The transport result is ambiguous. Refresh and retry with the same request identity.",
    accepted: "The ledger reports the proposal accepted. Local handoff evidence remains visible.",
    rejected: "The ledger reports the proposal rejected. The editor buffer was not changed.",
    "terminal-conflict": "The staged evidence and terminal ledger state conflict. No implicit retry is allowed.",
  };
  return messages[handoff.stage];
}

function remoteObservation(snapshot: WorkspaceSnapshot, handoff: ProposalHandoffRecord) {
  const proposal = snapshot.proposals.find((item) => item.proposal_id === handoff.proposalId);
  return {
    status: proposal?.status ?? null,
    sourceRevision: proposal?.source_revision ?? null,
    acceptedRevision: snapshot.workspace.accepted_revision,
  };
}

interface ProposalCardProps {
  proposal: Proposal;
  busy: boolean;
  handoff: ProposalHandoffRecord | null;
  rejectReason: string;
  rejectConfirmed: boolean;
  onRejectReasonChange: (reason: string) => void;
  onRejectConfirmedChange: (confirmed: boolean) => void;
  onStage: () => void;
  onAccept: () => void;
  onReject: () => void;
}

function ProposalCard({ proposal, busy, handoff, rejectReason, rejectConfirmed, onRejectReasonChange, onRejectConfirmedChange, onStage, onAccept, onReject }: ProposalCardProps) {
  const ownsStage = handoff?.proposalId === proposal.proposal_id;
  const unknownAccept = ownsStage && handoff.stage === "disposition-unknown" && handoff.disposition?.kind === "accept";
  const unknownReject = ownsStage && handoff.stage === "disposition-unknown" && handoff.disposition?.kind === "reject";
  const attemptExpired = ownsStage && isDispositionAttemptExpired(handoff, Date.now());
  const retryAccept = unknownAccept && !attemptExpired;
  const retryReject = unknownReject && !attemptExpired;
  const acceptEnabled = ownsStage && (canAcceptSavedDraft(handoff) || (unknownAccept && hasExactSavedEvidence(handoff)));
  const reason = unknownReject ? handoff.disposition?.reason ?? "" : rejectReason;

  return (
    <article className="agent-proposal">
      <div><span>{proposal.status}</span><code>{proposal.proposal_id}</code></div>
      <p>{proposal.text}</p>
      <dl><div><dt>Rationale</dt><dd>{proposal.rationale}</dd></div><div><dt>Uncertainty</dt><dd>{proposal.uncertainty}</dd></div></dl>
      {proposal.status === "pending" && (
        <div className="proposal-disposition">
          <button type="button" disabled={busy} onClick={onStage}>Stage in editor</button>
          {ownsStage && <p className={`handoff-state state-${handoff.stage}`}><strong>{handoff.stage}</strong>{stageExplanation(handoff)}</p>}
          <button type="button" disabled={busy || !acceptEnabled} onClick={onAccept}>
            {unknownAccept && attemptExpired ? "Reconcile expired acceptance" : retryAccept ? "Retry acceptance with same request" : "Accept saved draft in ledger"}
          </button>
          <div className="reject-form" aria-label={`Reject ${proposal.proposal_id}`}>
            <label>Rejection reason<textarea rows={2} value={reason} disabled={busy || unknownReject} onChange={(event) => onRejectReasonChange(event.target.value)} /></label>
            {!unknownReject && (
              <label className="reject-confirmation"><input type="checkbox" checked={rejectConfirmed} disabled={busy || !rejectReason.trim()} onChange={(event) => onRejectConfirmedChange(event.target.checked)} />Confirm rejection; do not change the editor</label>
            )}
            <button type="button" disabled={busy || (!unknownReject && (!rejectConfirmed || !rejectReason.trim()))} onClick={onReject}>
              {unknownReject && attemptExpired ? "Reconcile expired rejection" : retryReject ? "Retry rejection with same request" : "Reject proposal"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export interface AgentDockProps {
  essayWorkspace: EssayWorkspace | null;
  savedDraftObservation: EssaysSavedDraftObservation | null;
  onStageBuffer: (buffer: EssaysStagedBuffer) => void;
}

export function AgentDock({ essayWorkspace, savedDraftObservation, onStageBuffer }: AgentDockProps) {
  const bridge = useMemo(() => detectEssaysTauriAgentBridge(), []);
  const handoffStore = useMemo(() => new ProposalHandoffStore(window.localStorage), []);
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [handoff, setHandoff] = useState<ProposalHandoffRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectConfirmed, setRejectConfirmed] = useState(false);
  const observedCursorRef = useRef(0);
  const snapshotInFlightRef = useRef<{ workspaceId: string; promise: Promise<WorkspaceSnapshot | null> } | null>(null);
  if (snapshot && snapshot.event_cursor > observedCursorRef.current) {
    observedCursorRef.current = snapshot.event_cursor;
  }
  const readSnapshot = useCallback((workspaceId: string, cursor: number | null = null) => {
    if (bridge.status !== "available") return Promise.reject(new Error("TAURI_SNAPSHOT_UNAVAILABLE"));
    const existing = snapshotInFlightRef.current;
    if (existing?.workspaceId === workspaceId) return existing.promise;
    const promise = bridge.snapshot(workspaceId, cursor);
    snapshotInFlightRef.current = { workspaceId, promise };
    const clear = () => {
      if (snapshotInFlightRef.current?.promise === promise) snapshotInFlightRef.current = null;
    };
    void promise.then(clear, clear);
    return promise;
  }, [bridge]);

  useEffect(() => {
    if (!essayWorkspace) {
      setHandoff(null);
      return;
    }
    const loaded = handoffStore.loadActive(essayWorkspace.workspaceId);
    setError(loaded.corruption ?? "");
    setHandoff(loaded.record);
    if (loaded.record && !["accepted", "rejected", "terminal-conflict"].includes(loaded.record.stage)) {
      onStageBuffer(toStagedBuffer(loaded.record));
    }
  }, [essayWorkspace?.workspaceId, handoffStore, onStageBuffer]);

  useEffect(() => {
    if (!savedDraftObservation) return;
    let active = true;
    void (async () => {
      const loaded = handoffStore.loadActive(savedDraftObservation.workspaceId);
      if (!loaded.record || loaded.corruption) return;
      const next = reduceProposalHandoff(loaded.record, {
        type: "observe-saved-draft",
        observation: savedDraftObservation,
        sha256: await sha256Evidence(savedDraftObservation.canonicalMarkdown),
        atUnixMs: Date.now(),
      });
      handoffStore.persist(next);
      if (active) setHandoff(next);
    })().catch((cause) => { if (active) setError(messageFor(cause)); });
    return () => { active = false; };
  }, [handoffStore, savedDraftObservation]);

  useEffect(() => {
    if (bridge.status !== "available" || !snapshot) return;
    const availableBridge = bridge;
    const workspaceId = snapshot.workspace.workspace_id;
    observedCursorRef.current = Math.max(observedCursorRef.current, snapshot.event_cursor);
    let disposed = false;
    let refreshTimer: number | null = null;
    let unsubscribe: (() => Promise<void>) | null = null;

    const refreshFromEvent = (event: { cursor: number; workspace_id: string }) => {
      if (event.workspace_id !== workspaceId || event.cursor <= observedCursorRef.current) return;
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        if (event.cursor <= observedCursorRef.current) return;
        observedCursorRef.current = event.cursor;
        void readSnapshot(workspaceId, event.cursor).then((next) => {
          if (disposed || !next) return;
          setSnapshot(next);
          setHandoff((current) => {
            if (!current) return current;
            const reconciled = reduceProposalHandoff(current, {
              type: "observe-remote",
              ...remoteObservation(next, current),
              atUnixMs: Date.now(),
            });
            handoffStore.persist(reconciled);
            return reconciled;
          });
        }).catch((cause) => { if (!disposed) setError(messageFor(cause)); });
      }, 32);
    };

    void availableBridge.subscribeEvents(workspaceId, observedCursorRef.current, refreshFromEvent)
      .then((stop) => {
        if (disposed) void stop();
        else unsubscribe = stop;
      })
      .catch((cause) => { if (!disposed) setError(messageFor(cause)); });

    return () => {
      disposed = true;
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      if (unsubscribe) void unsubscribe();
    };
  }, [bridge, handoffStore, readSnapshot, snapshot?.workspace.workspace_id]);

  if (bridge.status === "unavailable") {
    return (
      <aside className="agent-dock unavailable" aria-labelledby="agent-dock-title">
        <div className="agent-dock-heading"><span className="agent-pulse" aria-hidden="true" /><div><p>Agent adjunct</p><h2 id="agent-dock-title">Desktop runtime unavailable</h2></div></div>
        <p>This web preview keeps Essays browser-local. Open the same Workspace through Tauri to attach the Rust proposal ledger.</p>
        <small>No principal, proposal, or acceptance was simulated.</small>
      </aside>
    );
  }

  const persist = (next: ProposalHandoffRecord) => {
    handoffStore.persist(next);
    setHandoff(next);
    return next;
  };
  const reconcileSnapshot = (current: ProposalHandoffRecord, nextSnapshot: WorkspaceSnapshot) => persist(reduceProposalHandoff(current, {
    type: "observe-remote",
    ...remoteObservation(nextSnapshot, current),
    atUnixMs: Date.now(),
  }));

  const refresh = async () => {
    if (!essayWorkspace) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const next = await readSnapshot(essayWorkspace.workspaceId);
      setSnapshot(next);
      if (next && handoff) reconcileSnapshot(handoff, next);
      setNotice(next ? "Agent ledger refreshed and staged residue reconciled." : "No agent ledger exists for this essay yet.");
    } catch (cause) { setError(messageFor(cause)); } finally { setBusy(false); }
  };

  const attach = async () => {
    if (!essayWorkspace) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const existing = await readSnapshot(essayWorkspace.workspaceId);
      if (!existing) {
        const principal = await bridge.principalEvidence();
        await bridge.execute(createWorkspaceCommand({ requestId: requestId("workspace-create"), workspaceId: essayWorkspace.workspaceId, workOwner: principal.principalSubject, initialText: essayWorkspace.essay?.markdown ?? "", deadlineUnixMs: Date.now() + 30_000 }));
      }
      const next = await readSnapshot(essayWorkspace.workspaceId);
      setSnapshot(next);
      if (next && handoff) reconcileSnapshot(handoff, next);
      setNotice(existing ? "Existing agent ledger attached." : "Local agent ledger created and attached.");
    } catch (cause) { setError(messageFor(cause)); } finally { setBusy(false); }
  };

  const stage = async (proposal: Proposal) => {
    if (!essayWorkspace?.compositionPlan) { setError("Accept an Essays intent and composition plan before staging a proposal."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const loaded = handoffStore.loadActive(essayWorkspace.workspaceId);
      if (loaded.corruption) throw new Error(loaded.corruption);
      const replacementNeeded = requiresReplacementConfirmation(loaded.record);
      const replaceConfirmed = replacementNeeded ? window.confirm("Replace the currently staged proposal and retain its existing local record?") : false;
      if (replacementNeeded && !replaceConfirmed) { setNotice("The existing staged proposal was kept."); return; }
      const next = await handoffStore.stage({ workspaceId: essayWorkspace.workspaceId, proposalId: proposal.proposal_id, sourceLedgerRevision: proposal.source_revision, essaysWorkspaceRevision: essayWorkspace.currentRevision, essayRevision: essayWorkspace.essay?.revision ?? 0, markdown: proposal.text, replaceConfirmed });
      setHandoff(next);
      onStageBuffer(toStagedBuffer(next));
      setRejectReason(""); setRejectConfirmed(false);
      setNotice("Proposal staged in the editor working buffer. It is neither saved nor ledger-accepted.");
    } catch (cause) { setError(messageFor(cause)); } finally { setBusy(false); }
  };

  const disposition = async (proposal: Proposal, kind: DispositionKind) => {
    if (!snapshot || !handoff || handoff.proposalId !== proposal.proposal_id) return;
    const retry = handoff.stage === "disposition-unknown" && handoff.disposition?.kind === kind;
    if (kind === "accept" && !hasExactSavedEvidence(handoff)) {
      setError("Acceptance requires the exact staged Markdown at later saved Essays workspace and essay revisions.");
      return;
    }
    const reason = retry && kind === "reject" ? handoff.disposition?.reason ?? "" : rejectReason.trim();
    if (kind === "reject" && !reason) { setError("A rejection reason is required."); return; }

    setBusy(true); setError(""); setNotice("");
    const stableRequestId = handoff.disposition?.kind === kind ? handoff.disposition.requestId : requestId(`proposal-${kind}`);
    const stableDeadlineUnixMs = handoff.disposition?.kind === kind ? handoff.disposition.deadlineUnixMs : Date.now() + 30_000;
    let current = retry
      ? handoff
      : persist(reduceProposalHandoff(handoff, { type: "begin-disposition", kind, requestId: stableRequestId, reason, deadlineUnixMs: stableDeadlineUnixMs, atUnixMs: Date.now() }));
    try {
      const fresh = await readSnapshot(snapshot.workspace.workspace_id);
      if (!fresh) throw new Error("The Rust ledger disappeared before disposition.");
      setSnapshot(fresh);
      const preflight = dispositionPreflight(current, remoteObservation(fresh, current));
      if (preflight.result !== "ready") { current = reconcileSnapshot(current, fresh); setNotice(preflight.message); return; }
      if (retry && isDispositionAttemptExpired(current, Date.now())) {
        current = reconcileSnapshot(current, fresh);
        current = persist(reduceProposalHandoff(current, {
          type: "expire-disposition",
          message: "The stable disposition deadline expired after fresh-ledger reconciliation. Explicitly restage to create a new epoch and request.",
          atUnixMs: Date.now(),
        }));
        setError(stageExplanation(current));
        return;
      }
      if (kind === "accept" && !hasExactSavedEvidence(current)) {
        setError("The latest saved Essays evidence no longer exactly matches the staged proposal; acceptance was not invoked.");
        return;
      }
      if (retry) {
        current = persist(reduceProposalHandoff(current, { type: "begin-disposition", kind, requestId: stableRequestId, reason, deadlineUnixMs: stableDeadlineUnixMs, atUnixMs: Date.now() }));
      }
      if (current.stage !== "disposition-in-flight") {
        setError(stageExplanation(current));
        return;
      }
      const command = kind === "accept"
        ? acceptProposalCommand({ requestId: current.disposition!.requestId, workspaceId: current.workspaceId, proposalId: current.proposalId, expectedRevision: current.sourceLedgerRevision, deadlineUnixMs: current.disposition!.deadlineUnixMs })
        : rejectProposalCommand({ requestId: current.disposition!.requestId, workspaceId: current.workspaceId, proposalId: current.proposalId, expectedRevision: current.sourceLedgerRevision, reason: current.disposition!.reason!, deadlineUnixMs: current.disposition!.deadlineUnixMs });
      await bridge.execute(command);
      const after = await readSnapshot(current.workspaceId);
      if (!after) throw new Error("Disposition returned without a readable Rust snapshot.");
      setSnapshot(after);
      const afterObservation = remoteObservation(after, current);
      if (afterObservation.status === "pending") {
        current = persist(reduceProposalHandoff(current, { type: "disposition-ambiguous", message: "The request returned but the proposal is still pending; retry will reuse the same request identity.", atUnixMs: Date.now() }));
      } else {
        current = reconcileSnapshot(current, after);
      }
      setNotice(stageExplanation(current));
      if (kind === "reject") setRejectConfirmed(false);
    } catch (cause) {
      current = persist(reduceProposalHandoff(current, { type: "disposition-ambiguous", message: `Disposition result is unknown: ${messageFor(cause)}`, atUnixMs: Date.now() }));
      try {
        const reconciled = await readSnapshot(current.workspaceId);
        if (reconciled) { setSnapshot(reconciled); current = reconcileSnapshot(current, reconciled); }
      } catch { /* persisted unknown state is the fail-closed result */ }
      setError(stageExplanation(current));
    } finally { setBusy(false); }
  };

  const pending = snapshot?.proposals.filter((proposal) => proposal.status === "pending") ?? [];
  return (
    <aside className="agent-dock" aria-labelledby="agent-dock-title">
      <div className="agent-dock-heading"><span className="agent-pulse online" aria-hidden="true" /><div><p>Agent adjunct</p><h2 id="agent-dock-title">Rust proposal ledger</h2></div></div>
      <div className="identity-evidence"><span>Local process client</span><strong>{bridge.clientEvidence.clientId}</strong><small>Authenticated subject is resolved by the runtime · verified human identity: no</small></div>
      <ol className="handoff-steps" aria-label="Proposal review handoff"><li><strong>1</strong><span>Stage in editor</span></li><li><strong>2</strong><span>Save in Essays</span></li><li><strong>3</strong><span>Accept saved draft in ledger</span></li></ol>
      {!essayWorkspace ? <p>Open or create the Essays studio before attaching an agent ledger.</p> : <div className="agent-actions"><button type="button" disabled={busy} onClick={() => void attach()}>Attach ledger</button><button type="button" disabled={busy} onClick={() => void refresh()}>Refresh</button></div>}
      {(notice || error) && <p className={error ? "agent-message error" : "agent-message"} role={error ? "alert" : "status"}>{error || notice}</p>}
      {handoff && <section className={`handoff-residue state-${handoff.stage}`} aria-label="Persisted proposal handoff"><div><span>Stage epoch {handoff.stageEpoch}</span><strong>{handoff.stage}</strong></div><p>{stageExplanation(handoff)}</p><small>Proposal {handoff.proposalId} · ledger r{handoff.sourceLedgerRevision} · staged at Essays workspace r{handoff.stagedEssaysWorkspaceRevision} / essay r{handoff.stagedEssayRevision}</small>{handoff.observedSavedWorkspaceRevision !== null && handoff.observedSavedEssayRevision !== null && <small>Latest saved Essays evidence: workspace r{handoff.observedSavedWorkspaceRevision} / essay r{handoff.observedSavedEssayRevision} · {hasExactSavedEvidence(handoff) ? "exact staged canonical bytes" : "not exact staged canonical bytes"}</small>}{handoff.disposition?.kind === "accept" && handoff.disposition.targetSavedWorkspaceRevision !== undefined && handoff.disposition.targetSavedEssayRevision !== undefined && <small>Acceptance targets exact saved Essays workspace r{handoff.disposition.targetSavedWorkspaceRevision} / essay r{handoff.disposition.targetSavedEssayRevision}.</small>}{hasLatestSavedDivergence(handoff) && <p className="agent-message error" role="alert">Latest saved Essays draft diverges from the staged proposal. Ledger terminal status is retained, but cross-store alignment is not claimed.</p>}{handoff.visibleResidue.length > 0 && <ul>{handoff.visibleResidue.map((item) => <li key={item}>{item}</li>)}</ul>}</section>}
      {snapshot && <><section className="accepted-text"><div><span>Accepted text</span><strong>r{snapshot.workspace.accepted_revision}</strong></div><p>{snapshot.workspace.accepted_text || "No accepted text in the Rust ledger."}</p><small>{snapshot.freshness} · cursor {snapshot.event_cursor}</small></section><section className="proposal-list" aria-label="Agent proposals"><div className="proposal-heading"><h3>Pending proposals</h3><span>{pending.length}</span></div>{pending.length ? pending.map((proposal) => <ProposalCard key={proposal.proposal_id} proposal={proposal} busy={busy} handoff={handoff} rejectReason={rejectReason} rejectConfirmed={rejectConfirmed} onRejectReasonChange={(reason) => { setRejectReason(reason); setRejectConfirmed(false); }} onRejectConfirmedChange={setRejectConfirmed} onStage={() => void stage(proposal)} onAccept={() => void disposition(proposal, "accept")} onReject={() => void disposition(proposal, "reject")} />) : <p className="empty-proposals">No pending proposals. The Essays draft remains separate.</p>}</section>{(snapshot.conflicts.length > 0 || snapshot.residue.length > 0) && <section className="agent-residue"><h3>Conflicts &amp; residue</h3><ul>{[...snapshot.conflicts, ...snapshot.residue].map((item) => <li key={item}>{item}</li>)}</ul></section>}</>}
    </aside>
  );
}
