import { describe, expect, it, vi } from "vitest";

import {
  ESSAYS_TAURI_CLIENT_EVIDENCE,
  acceptProposalCommand,
  createWorkspaceCommand,
  detectEssaysTauriAgentBridge,
  rejectProposalCommand,
  type Receipt,
  type RuntimeEvent,
  type WorkspaceSnapshot,
} from "./tauri-agent-bridge";

const snapshotFixture: WorkspaceSnapshot = {
  snapshot_id: "snapshot-1",
  workspace: {
    workspace_id: "essays",
    work_owner: "owner",
    accepted_revision: 4,
    accepted_text: "Accepted essay text",
  },
  projection_revision: 4,
  predecessor_revision: 3,
  event_cursor: 12,
  freshness: "fresh",
  proposals: [
    {
      proposal_id: "proposal-7",
      workspace_id: "essays",
      producer: "agent",
      client_id: "agent-client",
      source_revision: 4,
      context_digest: "sha256:context",
      operation_id: "revise-essay",
      target_artifact: "essay.md",
      target_region: "body",
      text: "Proposed essay text",
      rationale: "Tighten the opening",
      uncertainty: "The final tone remains owner-controlled",
      validation_diagnostics: [],
      status: "pending",
      created_at: "2026-09-02T10:00:00Z",
    },
  ],
  evidence: [],
  conflicts: [],
  open_questions: [],
  residue: [],
  created_at_unix_ms: 1_788_343_200_000,
};

const receiptFixture: Receipt = {
  request_id: "request-accept-7",
  command_digest: "digest",
  actor: "essays-tauri",
  client_id: "essays-tauri",
  workspace_id: "essays",
  outcome: "accepted",
  code: "accepted",
  prior_revision: 4,
  resulting_revision: 5,
  event_cursor: 13,
  persistence: "durable",
  replayed: false,
  linked_proposal_id: "proposal-7",
  linked_effect_id: null,
};

function availableBridge(invoke: ReturnType<typeof vi.fn>) {
  const detection = detectEssaysTauriAgentBridge({
    __TAURI__: { core: { invoke } },
  });
  expect(detection.status).toBe("available");
  if (detection.status !== "available") {
    throw new Error("fixture did not expose a Tauri bridge");
  }
  return detection;
}

describe("Essays Tauri agent bridge", () => {
  it("reports explicit unavailability in web mode without inventing a principal", () => {
    const detection = detectEssaysTauriAgentBridge();

    expect(detection).toEqual({ status: "unavailable", reason: "web-mode" });
    expect("clientEvidence" in detection).toBe(false);
  });

  it("resolves the authenticated subject separately from the fixed client label", async () => {
    const invoke = vi.fn().mockResolvedValue({
      principalSubject: "unix:1000",
      clientId: "essays-tauri",
      evidenceKind: "local-process",
      verifiedHumanIdentity: false,
    });
    const bridge = availableBridge(invoke);

    expect(bridge.clientEvidence).toBe(ESSAYS_TAURI_CLIENT_EVIDENCE);
    expect(bridge.clientEvidence).toEqual({
      clientId: "essays-tauri",
      evidenceKind: "local-process-client-label",
      verifiedHumanIdentity: false,
    });
    await expect(bridge.principalEvidence()).resolves.toEqual({
      principalSubject: "unix:1000",
      clientId: "essays-tauri",
      evidenceKind: "local-process",
      verifiedHumanIdentity: false,
    });
    expect(invoke).toHaveBeenCalledExactlyOnceWith("principal_evidence", {});
  });

  it("invokes snapshot with camelCase Tauri arguments and keeps proposals separate", async () => {
    const invoke = vi.fn().mockResolvedValue(snapshotFixture);
    const bridge = availableBridge(invoke);

    const snapshot = await bridge.snapshot("essays", 9);

    expect(invoke).toHaveBeenCalledExactlyOnceWith("snapshot", {
      workspaceId: "essays",
      cursor: 9,
    });
    expect(snapshot?.workspace.accepted_text).toBe("Accepted essay text");
    expect(snapshot?.proposals[0]?.text).toBe("Proposed essay text");
    expect(snapshot?.workspace.accepted_text).not.toBe(
      snapshot?.proposals[0]?.text,
    );
  });

  it("serializes a deterministic create-workspace command inside execute", async () => {
    const invoke = vi.fn().mockResolvedValue(receiptFixture);
    const bridge = availableBridge(invoke);
    const command = createWorkspaceCommand({
      requestId: "request-create-1",
      workspaceId: "essays",
      workOwner: "owner",
      initialText: "Opening",
      deadlineUnixMs: 1_788_343_260_000,
    });

    await bridge.execute(command);

    expect(invoke).toHaveBeenCalledExactlyOnceWith("execute", {
      command: {
        command: "create-workspace",
        request_id: "request-create-1",
        workspace_id: "essays",
        work_owner: "owner",
        initial_text: "Opening",
        deadline_unix_ms: 1_788_343_260_000,
      },
    });
  });

  it("binds acceptance to the caller-supplied expected revision and deadline", async () => {
    const invoke = vi.fn().mockResolvedValue(receiptFixture);
    const bridge = availableBridge(invoke);
    const command = acceptProposalCommand({
      requestId: "request-accept-7",
      workspaceId: "essays",
      proposalId: "proposal-7",
      expectedRevision: 4,
      deadlineUnixMs: 1_788_343_260_000,
    });

    await bridge.execute(command);

    expect(invoke).toHaveBeenCalledExactlyOnceWith("execute", {
      command: {
        command: "accept-proposal",
        request_id: "request-accept-7",
        workspace_id: "essays",
        proposal_id: "proposal-7",
        expected_revision: 4,
        deadline_unix_ms: 1_788_343_260_000,
      },
    });
  });

  it("binds rejection to expected revision and a trimmed non-empty reason", async () => {
    const invoke = vi.fn().mockResolvedValue(receiptFixture);
    const bridge = availableBridge(invoke);
    const command = rejectProposalCommand({
      requestId: "request-reject-7",
      workspaceId: "essays",
      proposalId: "proposal-7",
      expectedRevision: 4,
      reason: "  Writer selected a different direction.  ",
      deadlineUnixMs: 1_788_343_260_000,
    });

    await bridge.execute(command);

    expect(invoke).toHaveBeenCalledExactlyOnceWith("execute", {
      command: {
        command: "reject-proposal",
        request_id: "request-reject-7",
        workspace_id: "essays",
        proposal_id: "proposal-7",
        expected_revision: 4,
        reason: "Writer selected a different direction.",
        deadline_unix_ms: 1_788_343_260_000,
      },
    });
    expect(() => rejectProposalCommand({
      requestId: "request-reject-empty",
      workspaceId: "essays",
      proposalId: "proposal-7",
      expectedRevision: 4,
      reason: "   ",
      deadlineUnixMs: 1_788_343_260_000,
    })).toThrow("REJECTION_REASON_REQUIRED");
  });

  it("streams runtime events through a bounded Tauri channel and unsubscribes explicitly", async () => {
    class MockChannel<Message> {
      onmessage: (message: Message) => void = () => undefined;
    }
    const invoke = vi.fn().mockResolvedValue(undefined);
    const detection = detectEssaysTauriAgentBridge({
      __TAURI__: { core: { invoke, Channel: MockChannel } },
    });
    if (detection.status !== "available") throw new Error("fixture did not expose a Tauri bridge");
    const events: RuntimeEvent[] = [];

    const unsubscribe = await detection.subscribeEvents("essays", 12, (event) => events.push(event));
    const subscribeArguments = invoke.mock.calls[0]?.[1] as {
      subscriptionId: string;
      workspaceId: string;
      cursor: number;
      onEvent: MockChannel<RuntimeEvent>;
    };
    expect(invoke.mock.calls[0]?.[0]).toBe("subscribe_events");
    expect(subscribeArguments.workspaceId).toBe("essays");
    expect(subscribeArguments.cursor).toBe(12);
    subscribeArguments.onEvent.onmessage({
      cursor: 13,
      workspace_id: "essays",
      event_type: "proposal-recorded",
      payload: { proposal_id: "proposal-8" },
      created_at: "2026-09-03T10:00:00Z",
    });
    expect(events).toHaveLength(1);

    await unsubscribe();
    expect(invoke.mock.calls[1]?.[0]).toBe("unsubscribe_events");
    expect(invoke.mock.calls[1]?.[1]).toEqual({ subscriptionId: subscribeArguments.subscriptionId });
  });
});
