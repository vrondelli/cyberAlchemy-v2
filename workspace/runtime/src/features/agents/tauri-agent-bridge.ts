import { measureAsync } from "../../performance";

export const ESSAYS_TAURI_CLIENT_EVIDENCE = Object.freeze({
  clientId: "essays-tauri",
  evidenceKind: "local-process-client-label" as const,
  verifiedHumanIdentity: false as const,
});

export interface LocalProcessPrincipalEvidence {
  principalSubject: string;
  clientId: "essays-tauri";
  evidenceKind: "local-process";
  verifiedHumanIdentity: false;
}

export type ProposalStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "superseded"
  | "withdrawn";

export interface Proposal {
  proposal_id: string;
  workspace_id: string;
  producer: string;
  client_id: string;
  source_revision: number;
  context_digest: string;
  operation_id: string;
  target_artifact: string;
  target_region: string;
  text: string;
  rationale: string;
  uncertainty: string;
  validation_diagnostics: string[];
  status: ProposalStatus;
  created_at: string;
}

export interface EssaysWorkspace {
  workspace_id: string;
  work_owner: string;
  accepted_revision: number;
  accepted_text: string;
}

export type EffectOutcome =
  | "planned"
  | "certain"
  | "failed"
  | "cancelled"
  | "uncertain";

export interface BrowserEvidence {
  evidence_id: string;
  effect_id: string;
  workspace_id: string;
  method: string;
  origin: string;
  artifact_sha256: string | null;
  redacted_observation: string;
  captured_at_unix_ms: number;
  outcome: EffectOutcome;
  residue: string[];
}

export interface WorkspaceSnapshot {
  snapshot_id: string;
  workspace: EssaysWorkspace;
  projection_revision: number;
  predecessor_revision: number | null;
  event_cursor: number;
  freshness: string;
  proposals: Proposal[];
  evidence: BrowserEvidence[];
  conflicts: string[];
  open_questions: string[];
  residue: string[];
  created_at_unix_ms: number;
}

export interface RuntimeEvent {
  cursor: number;
  workspace_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export type ReceiptOutcome =
  | "accepted"
  | "rejected"
  | "conflicted"
  | "failed"
  | "cancelled"
  | "uncertain";

export interface Receipt {
  request_id: string;
  command_digest: string;
  actor: string;
  client_id: string;
  workspace_id: string;
  outcome: ReceiptOutcome;
  code: string;
  prior_revision: number | null;
  resulting_revision: number | null;
  event_cursor: number | null;
  persistence: string;
  replayed: boolean;
  linked_proposal_id: string | null;
  linked_effect_id: string | null;
}

export interface CreateWorkspaceCommand {
  command: "create-workspace";
  request_id: string;
  workspace_id: string;
  work_owner: string;
  initial_text: string;
  deadline_unix_ms: number;
}

export interface AcceptProposalCommand {
  command: "accept-proposal";
  request_id: string;
  workspace_id: string;
  proposal_id: string;
  expected_revision: number;
  deadline_unix_ms: number;
}

export interface RejectProposalCommand {
  command: "reject-proposal";
  request_id: string;
  workspace_id: string;
  proposal_id: string;
  expected_revision: number;
  reason: string;
  deadline_unix_ms: number;
}

export type EssaysRuntimeCommand =
  | CreateWorkspaceCommand
  | AcceptProposalCommand
  | RejectProposalCommand;

export interface CreateWorkspaceCommandInput {
  requestId: string;
  workspaceId: string;
  workOwner: string;
  initialText: string;
  deadlineUnixMs: number;
}

export interface AcceptProposalCommandInput {
  requestId: string;
  workspaceId: string;
  proposalId: string;
  expectedRevision: number;
  deadlineUnixMs: number;
}

export interface RejectProposalCommandInput extends AcceptProposalCommandInput {
  reason: string;
}

export function createWorkspaceCommand(
  input: CreateWorkspaceCommandInput,
): CreateWorkspaceCommand {
  return {
    command: "create-workspace",
    request_id: input.requestId,
    workspace_id: input.workspaceId,
    work_owner: input.workOwner,
    initial_text: input.initialText,
    deadline_unix_ms: input.deadlineUnixMs,
  };
}

export function acceptProposalCommand(
  input: AcceptProposalCommandInput,
): AcceptProposalCommand {
  return {
    command: "accept-proposal",
    request_id: input.requestId,
    workspace_id: input.workspaceId,
    proposal_id: input.proposalId,
    expected_revision: input.expectedRevision,
    deadline_unix_ms: input.deadlineUnixMs,
  };
}

export function rejectProposalCommand(
  input: RejectProposalCommandInput,
): RejectProposalCommand {
  const reason = input.reason.trim();
  if (!reason) throw new Error("REJECTION_REASON_REQUIRED");
  return {
    command: "reject-proposal",
    request_id: input.requestId,
    workspace_id: input.workspaceId,
    proposal_id: input.proposalId,
    expected_revision: input.expectedRevision,
    reason,
    deadline_unix_ms: input.deadlineUnixMs,
  };
}

type TauriInvoke = <Result>(
  command: string,
  arguments_: Record<string, unknown>,
) => Promise<Result>;

interface TauriChannel<Message> {
  onmessage: (message: Message) => void;
}

interface TauriChannelConstructor {
  new <Message>(): TauriChannel<Message>;
}

interface TauriWindowLike {
  __TAURI__?: unknown;
}

export interface EssaysTauriAgentBridge {
  status: "available";
  clientEvidence: typeof ESSAYS_TAURI_CLIENT_EVIDENCE;
  principalEvidence(): Promise<LocalProcessPrincipalEvidence>;
  snapshot(
    workspaceId: string,
    cursor?: number | null,
  ): Promise<WorkspaceSnapshot | null>;
  execute(command: EssaysRuntimeCommand): Promise<Receipt>;
  subscribeEvents(
    workspaceId: string,
    cursor: number,
    onEvent: (event: RuntimeEvent) => void,
  ): Promise<() => Promise<void>>;
}

export interface EssaysTauriAgentBridgeUnavailable {
  status: "unavailable";
  reason: "web-mode" | "tauri-invoke-unavailable";
}

export type EssaysTauriAgentBridgeDetection =
  | EssaysTauriAgentBridge
  | EssaysTauriAgentBridgeUnavailable;

function readCore(candidate: unknown): { invoke: TauriInvoke; Channel: TauriChannelConstructor | null } | null {
  if (typeof candidate !== "object" || candidate === null) {
    return null;
  }

  const tauri = (candidate as TauriWindowLike).__TAURI__;
  if (typeof tauri !== "object" || tauri === null) {
    return null;
  }

  const core = (tauri as { core?: unknown }).core;
  if (typeof core !== "object" || core === null) {
    return null;
  }

  const invoke = (core as { invoke?: unknown }).invoke;
  if (typeof invoke !== "function") return null;
  const Channel = (core as { Channel?: unknown }).Channel;
  return {
    invoke: invoke as TauriInvoke,
    Channel: typeof Channel === "function" ? Channel as TauriChannelConstructor : null,
  };
}

function currentWindow(): TauriWindowLike | undefined {
  return typeof window === "undefined"
    ? undefined
    : (window as unknown as TauriWindowLike);
}

export function detectEssaysTauriAgentBridge(
  candidate: unknown = currentWindow(),
): EssaysTauriAgentBridgeDetection {
  if (candidate === undefined || candidate === null) {
    return { status: "unavailable", reason: "web-mode" };
  }

  const core = readCore(candidate);
  if (core === null) {
    const hasTauriMarker =
      typeof candidate === "object" &&
      candidate !== null &&
      "__TAURI__" in candidate;
    return {
      status: "unavailable",
      reason: hasTauriMarker ? "tauri-invoke-unavailable" : "web-mode",
    };
  }
  const { invoke, Channel } = core;

  return {
    status: "available",
    clientEvidence: ESSAYS_TAURI_CLIENT_EVIDENCE,
    principalEvidence() {
      return measureAsync(
        "workspace.tauri.principal-evidence",
        () => invoke<LocalProcessPrincipalEvidence>("principal_evidence", {}),
      );
    },
    snapshot(workspaceId, cursor = null) {
      return measureAsync(
        "workspace.tauri.snapshot",
        () => invoke<WorkspaceSnapshot | null>("snapshot", { workspaceId, cursor }),
        { workspaceId, cursor },
      );
    },
    execute(command) {
      return measureAsync(
        "workspace.tauri.execute",
        () => invoke<Receipt>("execute", { command }),
        { command: command.command, workspaceId: command.workspace_id },
      );
    },
    async subscribeEvents(workspaceId, cursor, onEvent) {
      if (Channel === null) throw new Error("TAURI_CHANNEL_UNAVAILABLE");
      const subscriptionId = globalThis.crypto?.randomUUID?.()
        ?? `events-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const channel = new Channel<RuntimeEvent>();
      channel.onmessage = onEvent;
      await measureAsync(
        "workspace.tauri.subscribe-events",
        () => invoke<void>("subscribe_events", {
          subscriptionId,
          workspaceId,
          cursor,
          onEvent: channel,
        }),
        { workspaceId, cursor },
      );
      return async () => {
        void channel;
        await invoke<boolean>("unsubscribe_events", { subscriptionId });
      };
    },
  };
}
