import {
  normalizeMarkdown,
  type EssaysSavedDraftObservation,
  type EssaysStagedBuffer,
} from "@cyberalchemy/essays-runtime/markdown";
import type { ProposalStatus } from "./tauri-agent-bridge";

export const PROPOSAL_HANDOFF_SCHEMA = "workspace-proposal-handoff/v1" as const;

export const PROPOSAL_HANDOFF_STAGES = [
  "unstaged",
  "staged-unsaved",
  "saved-exact",
  "reconciliation-needed",
  "disposition-in-flight",
  "disposition-unknown",
  "accepted",
  "rejected",
  "terminal-conflict",
] as const;

export type ProposalHandoffStage = (typeof PROPOSAL_HANDOFF_STAGES)[number];
export type DispositionKind = "accept" | "reject";

export interface ProposalDispositionAttempt {
  kind: DispositionKind;
  requestId: string;
  reason: string | null;
  deadlineUnixMs: number;
  startedAtUnixMs: number;
  targetSavedWorkspaceRevision?: number;
  targetSavedEssayRevision?: number;
}

export interface ProposalHandoffRecord {
  schemaVersion: typeof PROPOSAL_HANDOFF_SCHEMA;
  workspaceId: string;
  proposalId: string;
  stageEpoch: number;
  stage: ProposalHandoffStage;
  sourceLedgerRevision: number;
  stagedEssaysWorkspaceRevision: number;
  stagedEssayRevision: number;
  stagedCanonicalMarkdown: string;
  stagedSha256: string;
  observedSavedWorkspaceRevision: number | null;
  observedSavedEssayRevision: number | null;
  observedSavedCanonicalMarkdown: string | null;
  observedSavedSha256: string | null;
  disposition: ProposalDispositionAttempt | null;
  visibleResidue: string[];
  updatedAtUnixMs: number;
}

export type ProposalHandoffEvent =
  | { type: "stage"; atUnixMs: number }
  | { type: "observe-saved-draft"; observation: EssaysSavedDraftObservation; sha256: string; atUnixMs: number }
  | { type: "begin-disposition"; kind: DispositionKind; requestId: string; reason?: string; deadlineUnixMs: number; atUnixMs: number }
  | { type: "disposition-ambiguous"; message: string; atUnixMs: number }
  | { type: "expire-disposition"; message: string; atUnixMs: number }
  | { type: "observe-remote"; status: ProposalStatus | null; sourceRevision: number | null; acceptedRevision: number; atUnixMs: number };

export interface StageProposalInput {
  workspaceId: string;
  proposalId: string;
  sourceLedgerRevision: number;
  essaysWorkspaceRevision: number;
  essayRevision: number;
  markdown: string;
  replaceConfirmed: boolean;
  atUnixMs?: number;
}

export interface HandoffLoadResult {
  record: ProposalHandoffRecord | null;
  corruption: string | null;
}

export interface LedgerProposalObservation {
  status: ProposalStatus | null;
  sourceRevision: number | null;
  acceptedRevision: number;
}

export type DispositionPreflight =
  | { result: "ready" }
  | { result: "terminal"; stage: "accepted" | "rejected" | "terminal-conflict"; message: string }
  | { result: "conflict"; message: string };

const ACTIVE_STAGES = new Set<ProposalHandoffStage>([
  "unstaged",
  "staged-unsaved",
  "saved-exact",
  "reconciliation-needed",
  "disposition-in-flight",
  "disposition-unknown",
  "terminal-conflict",
]);

function activePointerKey(workspaceId: string): string {
  return `cyberalchemy.workspace.proposal-handoff.active.${encodeURIComponent(workspaceId)}`;
}

function epochCounterKey(workspaceId: string): string {
  return `cyberalchemy.workspace.proposal-handoff.epoch.${encodeURIComponent(workspaceId)}`;
}

function recordKey(record: Pick<ProposalHandoffRecord, "workspaceId" | "proposalId" | "stageEpoch">): string {
  return [
    "cyberalchemy.workspace.proposal-handoff.record",
    encodeURIComponent(record.workspaceId),
    encodeURIComponent(record.proposalId),
    String(record.stageEpoch),
  ].join(".");
}

function withResidue(record: ProposalHandoffRecord, message: string, atUnixMs: number): ProposalHandoffRecord {
  return {
    ...record,
    visibleResidue: [...new Set([...record.visibleResidue, message])],
    updatedAtUnixMs: atUnixMs,
  };
}

function isTerminal(stage: ProposalHandoffStage): boolean {
  return stage === "accepted" || stage === "rejected" || stage === "terminal-conflict";
}

function isRecord(value: unknown): value is ProposalHandoffRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ProposalHandoffRecord>;
  return record.schemaVersion === PROPOSAL_HANDOFF_SCHEMA
    && typeof record.workspaceId === "string"
    && Boolean(record.workspaceId)
    && typeof record.proposalId === "string"
    && Boolean(record.proposalId)
    && Number.isSafeInteger(record.stageEpoch)
    && (record.stageEpoch ?? 0) > 0
    && PROPOSAL_HANDOFF_STAGES.includes(record.stage as ProposalHandoffStage)
    && Number.isInteger(record.sourceLedgerRevision) && (record.sourceLedgerRevision ?? -1) >= 0
    && Number.isInteger(record.stagedEssaysWorkspaceRevision) && (record.stagedEssaysWorkspaceRevision ?? -1) >= 0
    && Number.isInteger(record.stagedEssayRevision) && (record.stagedEssayRevision ?? -1) >= 0
    && typeof record.stagedCanonicalMarkdown === "string"
    && normalizeMarkdown(record.stagedCanonicalMarkdown) === record.stagedCanonicalMarkdown
    && typeof record.stagedSha256 === "string" && /^[a-f0-9]{64}$/.test(record.stagedSha256)
    && (record.observedSavedWorkspaceRevision === null || Number.isInteger(record.observedSavedWorkspaceRevision))
    && (record.observedSavedEssayRevision === null || Number.isInteger(record.observedSavedEssayRevision))
    && (record.observedSavedCanonicalMarkdown === null || typeof record.observedSavedCanonicalMarkdown === "string")
    && (record.observedSavedSha256 === null || (typeof record.observedSavedSha256 === "string" && /^[a-f0-9]{64}$/.test(record.observedSavedSha256)))
    && (record.disposition === null || (
      typeof record.disposition === "object"
      && (record.disposition.kind === "accept" || record.disposition.kind === "reject")
      && typeof record.disposition.requestId === "string" && Boolean(record.disposition.requestId)
      && (record.disposition.reason === null || typeof record.disposition.reason === "string")
      && Number.isSafeInteger(record.disposition.deadlineUnixMs)
      && typeof record.disposition.startedAtUnixMs === "number"
      && (record.disposition.targetSavedWorkspaceRevision === undefined || Number.isSafeInteger(record.disposition.targetSavedWorkspaceRevision))
      && (record.disposition.targetSavedEssayRevision === undefined || Number.isSafeInteger(record.disposition.targetSavedEssayRevision))
    ))
    && Array.isArray(record.visibleResidue)
    && record.visibleResidue.every((item) => typeof item === "string")
    && typeof record.updatedAtUnixMs === "number";
}

export async function sha256Evidence(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("SHA256_EVIDENCE_UNAVAILABLE");
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hasExactSavedEvidence(record: ProposalHandoffRecord | null): boolean {
  return Boolean(record
    && record.observedSavedWorkspaceRevision !== null
    && record.observedSavedEssayRevision !== null
    && record.observedSavedCanonicalMarkdown !== null
    && record.observedSavedWorkspaceRevision > record.stagedEssaysWorkspaceRevision
    && record.observedSavedEssayRevision > record.stagedEssayRevision
    && record.observedSavedCanonicalMarkdown === record.stagedCanonicalMarkdown);
}

export function hasLatestSavedDivergence(record: ProposalHandoffRecord | null): boolean {
  return Boolean(record
    && record.observedSavedWorkspaceRevision !== null
    && record.observedSavedEssayRevision !== null
    && record.observedSavedCanonicalMarkdown !== null
    && record.observedSavedWorkspaceRevision > record.stagedEssaysWorkspaceRevision
    && record.observedSavedEssayRevision > record.stagedEssayRevision
    && record.observedSavedCanonicalMarkdown !== record.stagedCanonicalMarkdown);
}

export function isDispositionAttemptExpired(record: ProposalHandoffRecord | null, atUnixMs: number): boolean {
  return Boolean(record?.disposition && atUnixMs >= record.disposition.deadlineUnixMs);
}

function savedObservationOrder(record: ProposalHandoffRecord, observation: EssaysSavedDraftObservation): "first" | "newer" | "same" | "older" | "incomparable" {
  if (record.observedSavedWorkspaceRevision === null || record.observedSavedEssayRevision === null) return "first";
  const workspaceDelta = observation.workspaceRevision - record.observedSavedWorkspaceRevision;
  const essayDelta = observation.essayRevision - record.observedSavedEssayRevision;
  if (workspaceDelta === 0 && essayDelta === 0) return "same";
  if (workspaceDelta >= 0 && essayDelta >= 0) return "newer";
  if (workspaceDelta <= 0 && essayDelta <= 0) return "older";
  return "incomparable";
}

export function reduceProposalHandoff(record: ProposalHandoffRecord, event: ProposalHandoffEvent): ProposalHandoffRecord {
  if (event.type === "observe-saved-draft") {
    if (event.observation.workspaceId !== record.workspaceId) return record;
    const order = savedObservationOrder(record, event.observation);
    if (order === "older") {
      return withResidue(record, "Ignored an older Essays save observation; newer saved evidence remains authoritative for this handoff.", event.atUnixMs);
    }
    if (order === "incomparable") {
      const residue = withResidue(record, "Essays save revision ordering is inconsistent across workspace and essay revisions.", event.atUnixMs);
      return isTerminal(record.stage) ? residue : { ...residue, stage: "terminal-conflict" };
    }
    if (order === "same") {
      const sameBytes = event.observation.canonicalMarkdown === record.observedSavedCanonicalMarkdown;
      if (sameBytes) return record;
      const residue = withResidue(record, "Integrity conflict: the same Essays revision pair was observed with different saved bytes.", event.atUnixMs);
      return isTerminal(record.stage) ? residue : { ...residue, stage: "terminal-conflict" };
    }
    const observation = {
      observedSavedWorkspaceRevision: event.observation.workspaceRevision,
      observedSavedEssayRevision: event.observation.essayRevision,
      observedSavedCanonicalMarkdown: event.observation.canonicalMarkdown,
      observedSavedSha256: event.sha256,
      updatedAtUnixMs: event.atUnixMs,
    };
    const observed = { ...record, ...observation };
    if (isTerminal(record.stage)) {
      return hasLatestSavedDivergence(observed)
        ? withResidue(observed, "Cross-store divergence: the latest Essays save differs from the staged proposal even though the ledger is terminal.", event.atUnixMs)
        : observed;
    }
    if (record.stage === "disposition-in-flight" || record.stage === "disposition-unknown") {
      return hasLatestSavedDivergence(observed)
        ? withResidue(observed, "The latest Essays save diverges from the staged proposal; acceptance retry is disabled while disposition remains unresolved.", event.atUnixMs)
        : observed;
    }
    const revisionsAdvanced = event.observation.workspaceRevision > record.stagedEssaysWorkspaceRevision
      && event.observation.essayRevision > record.stagedEssayRevision;
    if (!revisionsAdvanced) return { ...observed, stage: "staged-unsaved" };
    return {
      ...observed,
      stage: hasExactSavedEvidence(observed)
        ? "saved-exact"
        : "reconciliation-needed",
    };
  }

  if (isTerminal(record.stage)) return record;

  if (event.type === "stage") {
    return record.stage === "unstaged"
      ? { ...record, stage: "staged-unsaved", updatedAtUnixMs: event.atUnixMs }
      : record;
  }

  if (event.type === "begin-disposition") {
    const reason = event.kind === "reject" ? event.reason?.trim() ?? "" : null;
    if (event.kind === "accept" && !hasExactSavedEvidence(record)) {
      return withResidue(record, "Acceptance remains disabled until a later exact Essays save.", event.atUnixMs);
    }
    if (event.kind === "reject" && !reason && record.disposition?.kind !== "reject") {
      return withResidue(record, "A trimmed non-empty rejection reason is required.", event.atUnixMs);
    }
    if (record.disposition && record.disposition.kind !== event.kind) {
      return { ...withResidue(record, "A different disposition already owns this stage epoch.", event.atUnixMs), stage: "terminal-conflict" };
    }
    if (record.disposition && isDispositionAttemptExpired(record, event.atUnixMs)) {
      return {
        ...withResidue(record, "The stable disposition deadline expired; explicitly replace this stage epoch before creating a new request.", event.atUnixMs),
        stage: "terminal-conflict",
      };
    }
    return {
      ...record,
      stage: "disposition-in-flight",
      disposition: record.disposition ?? {
        kind: event.kind,
        requestId: event.requestId,
        reason,
        deadlineUnixMs: event.deadlineUnixMs,
        startedAtUnixMs: event.atUnixMs,
        ...(event.kind === "accept" && record.observedSavedWorkspaceRevision !== null && record.observedSavedEssayRevision !== null
          ? {
            targetSavedWorkspaceRevision: record.observedSavedWorkspaceRevision,
            targetSavedEssayRevision: record.observedSavedEssayRevision,
          }
          : {}),
      },
      updatedAtUnixMs: event.atUnixMs,
    };
  }

  if (event.type === "disposition-ambiguous") {
    if (record.stage !== "disposition-in-flight" && record.stage !== "disposition-unknown") return record;
    return {
      ...withResidue(record, event.message, event.atUnixMs),
      stage: "disposition-unknown",
    };
  }

  if (event.type === "expire-disposition") {
    if (!record.disposition || (record.stage !== "disposition-in-flight" && record.stage !== "disposition-unknown")) return record;
    return {
      ...withResidue(record, event.message, event.atUnixMs),
      stage: "terminal-conflict",
    };
  }

  if (event.status === "accepted") {
    const incompatible = record.disposition?.kind === "reject";
    return {
      ...withResidue(record, incompatible
        ? "The ledger accepted a proposal while this stage held a rejection request."
        : "The ledger reports this proposal accepted; local handoff evidence is retained.", event.atUnixMs),
      stage: incompatible ? "terminal-conflict" : "accepted",
    };
  }
  if (event.status === "rejected") {
    const incompatible = record.disposition?.kind === "accept";
    return {
      ...withResidue(record, incompatible
        ? "The ledger rejected a proposal while this stage held an acceptance request."
        : "The ledger reports this proposal rejected; the editor buffer was not changed.", event.atUnixMs),
      stage: incompatible ? "terminal-conflict" : "rejected",
    };
  }
  if (event.status === "superseded" || event.status === "withdrawn" || event.status === null) {
    return {
      ...withResidue(record, `The staged proposal is ${event.status ?? "absent"} in the current ledger snapshot.`, event.atUnixMs),
      stage: "terminal-conflict",
    };
  }
  if (event.sourceRevision !== record.sourceLedgerRevision || event.acceptedRevision !== record.sourceLedgerRevision) {
    return {
      ...withResidue(record, "The ledger revision no longer matches the revision captured at staging.", event.atUnixMs),
      stage: "terminal-conflict",
    };
  }
  return record;
}

export function dispositionPreflight(record: ProposalHandoffRecord, observation: LedgerProposalObservation): DispositionPreflight {
  if (observation.status === "accepted") {
    return record.disposition?.kind === "reject"
      ? { result: "terminal", stage: "terminal-conflict", message: "Ledger acceptance conflicts with the staged rejection request." }
      : { result: "terminal", stage: "accepted", message: "Ledger terminal acceptance wins." };
  }
  if (observation.status === "rejected") {
    return record.disposition?.kind === "accept"
      ? { result: "terminal", stage: "terminal-conflict", message: "Ledger rejection conflicts with the staged acceptance request." }
      : { result: "terminal", stage: "rejected", message: "Ledger terminal rejection wins." };
  }
  if (observation.status !== "pending") {
    return { result: "conflict", message: `Proposal is ${observation.status ?? "absent"}, not pending.` };
  }
  if (observation.sourceRevision !== record.sourceLedgerRevision) {
    return { result: "conflict", message: "Proposal source revision changed after staging." };
  }
  if (observation.acceptedRevision !== record.sourceLedgerRevision) {
    return { result: "conflict", message: "Ledger accepted revision changed after staging." };
  }
  return { result: "ready" };
}

export function canAcceptSavedDraft(record: ProposalHandoffRecord | null): boolean {
  return record?.stage === "saved-exact" && hasExactSavedEvidence(record);
}

export function requiresReplacementConfirmation(record: ProposalHandoffRecord | null): boolean {
  return Boolean(record && ACTIVE_STAGES.has(record.stage));
}

export function toStagedBuffer(record: ProposalHandoffRecord): EssaysStagedBuffer {
  return {
    workspaceId: record.workspaceId,
    proposalId: record.proposalId,
    stageEpoch: record.stageEpoch,
    markdown: record.stagedCanonicalMarkdown,
  };
}

export class ProposalHandoffStore {
  constructor(
    private readonly storage: Pick<Storage, "getItem" | "setItem">,
    private readonly clock: () => number = () => Date.now(),
  ) {}

  loadActive(workspaceId: string): HandoffLoadResult {
    const pointer = this.storage.getItem(activePointerKey(workspaceId));
    if (!pointer) return { record: null, corruption: null };
    const serialized = this.storage.getItem(pointer);
    if (!serialized) return { record: null, corruption: "The active proposal handoff record is missing." };
    try {
      const value: unknown = JSON.parse(serialized);
      if (!isRecord(value) || value.workspaceId !== workspaceId || recordKey(value) !== pointer) {
        return { record: null, corruption: "The persisted proposal handoff record is incompatible or mis-keyed." };
      }
      return { record: structuredClone(value), corruption: null };
    } catch {
      return { record: null, corruption: "The persisted proposal handoff record is not valid JSON." };
    }
  }

  persist(record: ProposalHandoffRecord): void {
    const key = recordKey(record);
    this.storage.setItem(key, JSON.stringify(record));
    this.storage.setItem(activePointerKey(record.workspaceId), key);
  }

  async stage(input: StageProposalInput): Promise<ProposalHandoffRecord> {
    const loaded = this.loadActive(input.workspaceId);
    if (loaded.corruption) throw new Error(`PROPOSAL_HANDOFF_CORRUPT: ${loaded.corruption}`);
    if (requiresReplacementConfirmation(loaded.record) && !input.replaceConfirmed) {
      throw new Error("PROPOSAL_HANDOFF_REPLACEMENT_CONFIRMATION_REQUIRED");
    }
    const atUnixMs = input.atUnixMs ?? this.clock();
    const counterKey = epochCounterKey(input.workspaceId);
    const previousCounter = Number(this.storage.getItem(counterKey));
    const stageEpoch = Math.max(Number.isSafeInteger(previousCounter) ? previousCounter + 1 : 1, atUnixMs);
    this.storage.setItem(counterKey, String(stageEpoch));
    const canonical = normalizeMarkdown(input.markdown);
    const staged: ProposalHandoffRecord = {
      schemaVersion: PROPOSAL_HANDOFF_SCHEMA,
      workspaceId: input.workspaceId,
      proposalId: input.proposalId,
      stageEpoch,
      stage: "unstaged",
      sourceLedgerRevision: input.sourceLedgerRevision,
      stagedEssaysWorkspaceRevision: input.essaysWorkspaceRevision,
      stagedEssayRevision: input.essayRevision,
      stagedCanonicalMarkdown: canonical,
      stagedSha256: await sha256Evidence(canonical),
      observedSavedWorkspaceRevision: null,
      observedSavedEssayRevision: null,
      observedSavedCanonicalMarkdown: null,
      observedSavedSha256: null,
      disposition: null,
      visibleResidue: loaded.record && input.replaceConfirmed
        ? [
          ...loaded.record.visibleResidue,
          `Explicitly replaced proposal ${loaded.record.proposalId} stage epoch ${loaded.record.stageEpoch}.`,
        ]
        : [],
      updatedAtUnixMs: atUnixMs,
    };
    const record = reduceProposalHandoff(staged, { type: "stage", atUnixMs });
    this.persist(record);
    return record;
  }
}
