import { describe, expect, it } from "vitest";

import { appendReasoningReceipt, isNearTranscriptEnd, shouldAutoApprove } from "./ChatSurface";
import type { AreReasoningReceipt } from "./are-chat-bridge";

function receipt(receiptId: string, sequence: number): AreReasoningReceipt {
  return {
    schemaVersion: "are.reasoning-receipt-view/v1-candidate",
    receiptId,
    sequence,
    observedAt: "2026-09-04T00:00:00.000Z",
    kind: "preflight.decision",
    status: "direct",
    route: "CA2-ROUTE-VALIDATE",
    decisionDigest: receiptId,
    evidenceDigest: receiptId,
    profileDigest: null,
    requestId: null,
    threadId: null,
    turnId: null,
    reasonCodes: [],
    authorityEffect: "none",
    claimCeiling: "fixture",
  };
}

describe("chat transcript motion", () => {
  it("keeps following a stream while the reader remains near the end", () => {
    expect(isNearTranscriptEnd(1000, 528, 400)).toBe(true);
  });

  it("releases automatic scrolling when the reader investigates earlier text", () => {
    expect(isNearTranscriptEnd(1000, 300, 400)).toBe(false);
  });
});

describe("reasoning receipt timeline", () => {
  it("deduplicates receipts and retains only the bounded latest evidence", () => {
    const first = receipt("a".repeat(64), 1);
    const second = receipt("b".repeat(64), 2);
    const third = receipt("c".repeat(64), 3);
    expect(appendReasoningReceipt([first], first, 2)).toEqual([first]);
    expect(appendReasoningReceipt([first, second], third, 2)).toEqual([second, third]);
  });
});

describe("session auto approval", () => {
  it("accepts only surfaced approvals with an explicit ARE permit decision", () => {
    const permitted = {
      type: "approval.requested",
      emittedAtMs: 1,
      promptId: "approval-1",
      permissionDecision: {kind: "permit"},
    };
    expect(shouldAutoApprove(permitted, true)).toBe(true);
    expect(shouldAutoApprove(permitted, false)).toBe(false);
    expect(shouldAutoApprove({...permitted, permissionDecision: {kind: "deny"}}, true)).toBe(false);
    expect(shouldAutoApprove({...permitted, type: "user-input.requested"}, true)).toBe(false);
  });
});
