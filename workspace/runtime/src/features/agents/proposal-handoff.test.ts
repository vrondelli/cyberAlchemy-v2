import { describe, expect, it } from "vitest";
import type { EssayWorkspace } from "@cyberalchemy/essays-runtime/model";
import {
  PROPOSAL_HANDOFF_SCHEMA,
  PROPOSAL_HANDOFF_STAGES,
  ProposalHandoffStore,
  canAcceptSavedDraft,
  dispositionPreflight,
  hasExactSavedEvidence,
  hasLatestSavedDivergence,
  isDispositionAttemptExpired,
  reduceProposalHandoff,
  requiresReplacementConfirmation,
  type ProposalHandoffEvent,
  type ProposalHandoffRecord,
  type ProposalHandoffStage,
} from "./proposal-handoff";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem"> {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

function record(stage: ProposalHandoffStage = "staged-unsaved"): ProposalHandoffRecord {
  return {
    schemaVersion: PROPOSAL_HANDOFF_SCHEMA,
    workspaceId: "workspace-1",
    proposalId: "proposal-1",
    stageEpoch: 100,
    stage,
    sourceLedgerRevision: 4,
    stagedEssaysWorkspaceRevision: 6,
    stagedEssayRevision: 1,
    stagedCanonicalMarkdown: "# Proposed\n\nExact text.\n",
    stagedSha256: "evidence-only",
    observedSavedWorkspaceRevision: null,
    observedSavedEssayRevision: null,
    observedSavedCanonicalMarkdown: null,
    observedSavedSha256: null,
    disposition: null,
    visibleResidue: [],
    updatedAtUnixMs: 100,
  };
}

function savedEvent(markdown: string, workspaceRevision = 7, essayRevision = 2): ProposalHandoffEvent {
  return {
    type: "observe-saved-draft",
    observation: {
      workspaceId: "workspace-1",
      workspaceRevision,
      essayRevision,
      canonicalMarkdown: markdown,
    },
    sha256: "same-digest-does-not-authorize",
    atUnixMs: 200,
  };
}

describe("proposal handoff state machine", () => {
  it("stages canonical bytes without mutating the Essays workspace", async () => {
    const storage = new MemoryStorage();
    const store = new ProposalHandoffStore(storage, () => 101);
    const workspace = {
      workspaceId: "workspace-1",
      currentRevision: 6,
      essay: { revision: 1, markdown: "# Writer draft\n" },
    } as EssayWorkspace;
    const before = structuredClone(workspace);

    const staged = await store.stage({
      workspaceId: workspace.workspaceId,
      proposalId: "proposal-1",
      sourceLedgerRevision: 4,
      essaysWorkspaceRevision: workspace.currentRevision,
      essayRevision: workspace.essay!.revision,
      markdown: "  # Proposed  \r\n\r\nExact text.  \r\n",
      replaceConfirmed: false,
    });

    expect(staged.stage).toBe("staged-unsaved");
    expect(staged.stagedCanonicalMarkdown).toBe("# Proposed\n\nExact text.\n");
    expect(staged.stagedSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(workspace).toEqual(before);
    expect(canAcceptSavedDraft(staged)).toBe(false);
  });

  it("requires explicit confirmation before replacing one active stage", async () => {
    const storage = new MemoryStorage();
    const store = new ProposalHandoffStore(storage, () => 101);
    const input = {
      workspaceId: "workspace-1",
      proposalId: "proposal-1",
      sourceLedgerRevision: 4,
      essaysWorkspaceRevision: 6,
      essayRevision: 1,
      markdown: "First",
      replaceConfirmed: false,
    };
    await store.stage(input);
    await expect(store.stage({ ...input, proposalId: "proposal-2" }))
      .rejects.toThrow("PROPOSAL_HANDOFF_REPLACEMENT_CONFIRMATION_REQUIRED");
    const replacement = await store.stage({ ...input, proposalId: "proposal-2", replaceConfirmed: true });
    expect(replacement.stageEpoch).toBeGreaterThan(101);
    expect(replacement.proposalId).toBe("proposal-2");
    expect(replacement.visibleResidue).toContain("Explicitly replaced proposal proposal-1 stage epoch 101.");
  });

  it("requires both later Essays revisions and exact canonical Markdown", () => {
    const staged = record();
    const sameRevisions = reduceProposalHandoff(staged, savedEvent(staged.stagedCanonicalMarkdown, 6, 1));
    expect(sameRevisions.stage).toBe("staged-unsaved");

    const exact = reduceProposalHandoff(staged, savedEvent(staged.stagedCanonicalMarkdown));
    expect(exact.stage).toBe("saved-exact");
    expect(canAcceptSavedDraft(exact)).toBe(true);
    expect(hasExactSavedEvidence(exact)).toBe(true);

    const divergent = reduceProposalHandoff(exact, savedEvent("# Writer chose differently.\n", 8, 3));
    expect(divergent.stage).toBe("reconciliation-needed");
    expect(divergent.observedSavedSha256).toBe("same-digest-does-not-authorize");
    expect(canAcceptSavedDraft(divergent)).toBe(false);
    expect(hasExactSavedEvidence(divergent)).toBe(false);
  });

  it("persists one stable request identity across ambiguous acceptance retry", () => {
    const exact = reduceProposalHandoff(record(), savedEvent(record().stagedCanonicalMarkdown));
    const inFlight = reduceProposalHandoff(exact, {
      type: "begin-disposition",
      kind: "accept",
      requestId: "request-stable",
      deadlineUnixMs: 900,
      atUnixMs: 300,
    });
    const unknown = reduceProposalHandoff(inFlight, {
      type: "disposition-ambiguous",
      message: "Transport ended before a terminal receipt was observed.",
      atUnixMs: 301,
    });
    const retry = reduceProposalHandoff(unknown, {
      type: "begin-disposition",
      kind: "accept",
      requestId: "request-must-not-replace",
      deadlineUnixMs: 999,
      atUnixMs: 302,
    });

    expect(unknown.stage).toBe("disposition-unknown");
    expect(retry.stage).toBe("disposition-in-flight");
    expect(retry.disposition?.requestId).toBe("request-stable");
    expect(retry.disposition?.deadlineUnixMs).toBe(900);
    expect(retry.disposition?.targetSavedWorkspaceRevision).toBe(7);
    expect(retry.disposition?.targetSavedEssayRevision).toBe(2);
    expect(dispositionPreflight(retry, { status: "pending", sourceRevision: 4, acceptedRevision: 4 }))
      .toEqual({ result: "ready" });
  });

  it("orders saved observations monotonically and fails closed on equal-pair byte conflicts", () => {
    const staged = record();
    const newest = reduceProposalHandoff(staged, savedEvent(staged.stagedCanonicalMarkdown, 9, 4));
    const older = reduceProposalHandoff(newest, savedEvent("# Older divergent bytes\n", 8, 3));
    expect(older.observedSavedWorkspaceRevision).toBe(9);
    expect(older.observedSavedEssayRevision).toBe(4);
    expect(older.observedSavedCanonicalMarkdown).toBe(staged.stagedCanonicalMarkdown);
    expect(older.stage).toBe("saved-exact");
    expect(older.visibleResidue).toContain("Ignored an older Essays save observation; newer saved evidence remains authoritative for this handoff.");

    const equalPairDifferentBytes = reduceProposalHandoff(newest, savedEvent("# Impossible alternate bytes\n", 9, 4));
    expect(equalPairDifferentBytes.stage).toBe("terminal-conflict");
    expect(equalPairDifferentBytes.observedSavedCanonicalMarkdown).toBe(staged.stagedCanonicalMarkdown);
    expect(equalPairDifferentBytes.visibleResidue).toContain("Integrity conflict: the same Essays revision pair was observed with different saved bytes.");
  });

  it("keeps ambiguity and in-flight state while later saves re-evaluate exact retry evidence", () => {
    const exact = reduceProposalHandoff(record(), savedEvent(record().stagedCanonicalMarkdown));
    const inFlight = reduceProposalHandoff(exact, {
      type: "begin-disposition",
      kind: "accept",
      requestId: "accept-later-save",
      deadlineUnixMs: 900,
      atUnixMs: 300,
    });
    const pending = reduceProposalHandoff(inFlight, {
      type: "observe-remote",
      status: "pending",
      sourceRevision: 4,
      acceptedRevision: 4,
      atUnixMs: 301,
    });
    expect(pending.stage).toBe("disposition-in-flight");

    const unknown = reduceProposalHandoff(pending, { type: "disposition-ambiguous", message: "unknown", atUnixMs: 302 });
    const laterExact = reduceProposalHandoff(unknown, savedEvent(record().stagedCanonicalMarkdown, 8, 3));
    expect(laterExact.stage).toBe("disposition-unknown");
    expect(hasExactSavedEvidence(laterExact)).toBe(true);

    const laterDivergent = reduceProposalHandoff(laterExact, savedEvent("# Writer moved on\n", 9, 4));
    expect(laterDivergent.stage).toBe("disposition-unknown");
    expect(hasExactSavedEvidence(laterDivergent)).toBe(false);
    expect(hasLatestSavedDivergence(laterDivergent)).toBe(true);
    const blockedRetry = reduceProposalHandoff(laterDivergent, {
      type: "begin-disposition",
      kind: "accept",
      requestId: "must-not-replace",
      deadlineUnixMs: 999,
      atUnixMs: 303,
    });
    expect(blockedRetry.stage).toBe("disposition-unknown");
    expect(blockedRetry.disposition?.requestId).toBe("accept-later-save");
  });

  it("expires an ambiguous stable attempt without changing its identity or deadline", () => {
    const exact = reduceProposalHandoff(record(), savedEvent(record().stagedCanonicalMarkdown));
    const inFlight = reduceProposalHandoff(exact, {
      type: "begin-disposition",
      kind: "accept",
      requestId: "expired-stable",
      deadlineUnixMs: 900,
      atUnixMs: 300,
    });
    const unknown = reduceProposalHandoff(inFlight, { type: "disposition-ambiguous", message: "unknown", atUnixMs: 301 });
    expect(isDispositionAttemptExpired(unknown, 899)).toBe(false);
    expect(isDispositionAttemptExpired(unknown, 900)).toBe(true);

    const expired = reduceProposalHandoff(unknown, {
      type: "expire-disposition",
      message: "Fresh ledger is pending, but the stable request deadline expired.",
      atUnixMs: 900,
    });
    expect(expired.stage).toBe("terminal-conflict");
    expect(expired.disposition?.requestId).toBe("expired-stable");
    expect(expired.disposition?.deadlineUnixMs).toBe(900);
    expect(requiresReplacementConfirmation(expired)).toBe(true);
  });

  it("retains terminal ledger truth and records later cross-store divergence", () => {
    const exact = reduceProposalHandoff(record(), savedEvent(record().stagedCanonicalMarkdown));
    const inFlight = reduceProposalHandoff(exact, {
      type: "begin-disposition",
      kind: "accept",
      requestId: "accepted-then-diverged",
      deadlineUnixMs: 900,
      atUnixMs: 300,
    });
    const accepted = reduceProposalHandoff(inFlight, {
      type: "observe-remote",
      status: "accepted",
      sourceRevision: 4,
      acceptedRevision: 5,
      atUnixMs: 301,
    });
    const diverged = reduceProposalHandoff(accepted, savedEvent("# Later writer save\n", 8, 3));
    expect(diverged.stage).toBe("accepted");
    expect(hasLatestSavedDivergence(diverged)).toBe(true);
    expect(diverged.disposition?.targetSavedWorkspaceRevision).toBe(7);
    expect(diverged.disposition?.targetSavedEssayRevision).toBe(2);
    expect(diverged.visibleResidue).toContain("Cross-store divergence: the latest Essays save differs from the staged proposal even though the ledger is terminal.");
  });

  it("requires a trimmed rejection reason and preserves staged editor bytes", () => {
    const staged = record();
    const invalid = reduceProposalHandoff(staged, {
      type: "begin-disposition",
      kind: "reject",
      requestId: "reject-1",
      reason: "   ",
      deadlineUnixMs: 900,
      atUnixMs: 300,
    });
    expect(invalid.stage).toBe("staged-unsaved");
    expect(invalid.visibleResidue).toContain("A trimmed non-empty rejection reason is required.");

    const valid = reduceProposalHandoff(staged, {
      type: "begin-disposition",
      kind: "reject",
      requestId: "reject-1",
      reason: "  Writer chose another direction.  ",
      deadlineUnixMs: 900,
      atUnixMs: 301,
    });
    const terminal = reduceProposalHandoff(valid, {
      type: "observe-remote",
      status: "rejected",
      sourceRevision: 4,
      acceptedRevision: 4,
      atUnixMs: 302,
    });
    expect(valid.disposition?.reason).toBe("Writer chose another direction.");
    expect(terminal.stage).toBe("rejected");
    expect(terminal.stagedCanonicalMarkdown).toBe(staged.stagedCanonicalMarkdown);
  });

  it("fails closed for stale snapshots and incompatible terminal status", () => {
    expect(dispositionPreflight(record(), { status: "pending", sourceRevision: 3, acceptedRevision: 4 }).result)
      .toBe("conflict");
    expect(dispositionPreflight(record(), { status: "pending", sourceRevision: 4, acceptedRevision: 5 }).result)
      .toBe("conflict");

    const accepting = reduceProposalHandoff(
      reduceProposalHandoff(record(), savedEvent(record().stagedCanonicalMarkdown)),
      { type: "begin-disposition", kind: "accept", requestId: "accept-1", deadlineUnixMs: 900, atUnixMs: 300 },
    );
    const rejectedRemotely = reduceProposalHandoff(accepting, {
      type: "observe-remote",
      status: "rejected",
      sourceRevision: 4,
      acceptedRevision: 4,
      atUnixMs: 301,
    });
    expect(rejectedRemotely.stage).toBe("terminal-conflict");
  });

  it("reloads valid records and surfaces corrupt persistence without repairing it", async () => {
    const storage = new MemoryStorage();
    const first = new ProposalHandoffStore(storage, () => 101);
    const staged = await first.stage({
      workspaceId: "workspace-1",
      proposalId: "proposal-1",
      sourceLedgerRevision: 4,
      essaysWorkspaceRevision: 6,
      essayRevision: 1,
      markdown: "# Proposed",
      replaceConfirmed: false,
    });
    expect(new ProposalHandoffStore(storage).loadActive("workspace-1").record).toEqual(staged);

    const pointerEntry = [...storage.values.entries()].find(([key]) => key.includes(".active."));
    storage.setItem(pointerEntry![1], "{not-json");
    expect(new ProposalHandoffStore(storage).loadActive("workspace-1")).toEqual({
      record: null,
      corruption: "The persisted proposal handoff record is not valid JSON.",
    });
  });

  it("covers every persisted state/event pair without leaving the declared state set", () => {
    const events: ProposalHandoffEvent[] = [
      { type: "stage", atUnixMs: 400 },
      savedEvent(record().stagedCanonicalMarkdown),
      { type: "begin-disposition", kind: "accept", requestId: "accept-table", deadlineUnixMs: 900, atUnixMs: 400 },
      { type: "begin-disposition", kind: "reject", requestId: "reject-table", reason: "reason", deadlineUnixMs: 900, atUnixMs: 400 },
      { type: "disposition-ambiguous", message: "table ambiguity", atUnixMs: 400 },
      { type: "expire-disposition", message: "table expiry", atUnixMs: 901 },
      { type: "observe-remote", status: "pending", sourceRevision: 4, acceptedRevision: 4, atUnixMs: 400 },
      { type: "observe-remote", status: "accepted", sourceRevision: 4, acceptedRevision: 5, atUnixMs: 400 },
      { type: "observe-remote", status: "rejected", sourceRevision: 4, acceptedRevision: 4, atUnixMs: 400 },
      { type: "observe-remote", status: "superseded", sourceRevision: 4, acceptedRevision: 4, atUnixMs: 400 },
      { type: "observe-remote", status: "withdrawn", sourceRevision: 4, acceptedRevision: 4, atUnixMs: 400 },
      { type: "observe-remote", status: null, sourceRevision: null, acceptedRevision: 4, atUnixMs: 400 },
    ];
    for (const stage of PROPOSAL_HANDOFF_STAGES) {
      for (const event of events) {
        expect(PROPOSAL_HANDOFF_STAGES).toContain(reduceProposalHandoff(record(stage), event).stage);
      }
    }
  });

  it("reports that unresolved records still require replacement confirmation", () => {
    expect(requiresReplacementConfirmation(record("disposition-unknown"))).toBe(true);
    expect(requiresReplacementConfirmation(record("accepted"))).toBe(false);
    expect(requiresReplacementConfirmation(record("rejected"))).toBe(false);
  });
});
