import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import { detectEssaysTauriAgentBridge } from "../features/agents/tauri-agent-bridge";
import {
  FOUNDATION_PREFLIGHT_CODES,
  WorkspaceCapabilityInstanceAdapter,
} from "./foundation-capability-instance";

const principal = {
  principalSubject: "local-process:test",
  clientId: "essays-tauri" as const,
  evidenceKind: "local-process" as const,
  verifiedHumanIdentity: false as const,
};

describe("Lab-defined Foundation Capability Instance projection", () => {
  it("uses Capability Instance as the canonical semantic subject", () => {
    const projection = new WorkspaceCapabilityInstanceAdapter().inspect();
    expect(projection.profile.canonical_semantic_subject).toBe("Capability Instance");
    expect(projection.profile.ui_aliases).toEqual(["add-on"]);
    expect(projection.profile.ui_alias_policy).toBe("noncanonical-label-only");
  });

  it("keeps parent and instance identities separate", () => {
    const candidate = new WorkspaceCapabilityInstanceAdapter().inspect().capability_instance;
    expect(candidate.instance_id).not.toBe(candidate.parent_capability_ref);
    expect(candidate.parent_capability_ref).toContain("CAV2-D67");
  });

  it("prepares an identity-bound, effect-free invocation without executing it", () => {
    const adapter = new WorkspaceCapabilityInstanceAdapter();
    const prepared = adapter.prepareEffectFreeInvocation(principal);
    expect(prepared.principal.principal_id).toBe(principal.principalSubject);
    expect(prepared.principal.verified_human_identity).toBe(false);
    expect(prepared.effect_envelope.effects).toEqual([]);
    expect(prepared.execution_requested).toBe(false);
    expect(Object.isFrozen(prepared)).toBe(true);
  });

  it("publishes exact Lab source bindings and no effectful runtime claim", () => {
    const projection = new WorkspaceCapabilityInstanceAdapter().inspect();
    expect(projection.lab_definition_bindings).toHaveLength(9);
    expect(projection.lab_definition_bindings.every((source) => /^[a-f0-9]{64}$/.test(source.sha256))).toBe(true);
    expect(projection.runtime.preflight_available).toBe(true);
    expect(projection.runtime.effectful_invocation_available).toBe(false);
    expect(projection.runtime.host_receipt_available).toBe(false);
  });

  it("evaluates deterministic identity-bound live evidence without effect authority", async () => {
    const adapter = new WorkspaceCapabilityInstanceAdapter();
    const invocation = adapter.prepareEffectFreeInvocation(principal);
    const first = await adapter.evaluateEffectFreePreflight(invocation);
    const second = await adapter.evaluateEffectFreePreflight(invocation);
    expect(first).toEqual(second);
    expect(first.outcome).toBe("PASS");
    expect(first.evidence_id).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(first.effect_authorized).toBe(false);
    expect(first.execution_attempted).toBe(false);
  });

  it("fails closed on host, effect, and source drift", async () => {
    const adapter = new WorkspaceCapabilityInstanceAdapter();
    const valid = adapter.prepareEffectFreeInvocation(principal);
    const drifted = {
      ...valid,
      host_claim: { host: "other.host", active: false as const },
      effect_envelope: { envelope_id: "effectful", effects: ["filesystem.write"] },
    } as unknown as Parameters<typeof adapter.evaluateEffectFreePreflight>[0];
    const evidence = await adapter.evaluateEffectFreePreflight(drifted, false);
    expect(evidence.outcome).toBe("FAIL");
    expect(evidence.failed_codes).toEqual(expect.arrayContaining([
      FOUNDATION_PREFLIGHT_CODES.HOST_MISMATCH,
      FOUNDATION_PREFLIGHT_CODES.HOST_INACTIVE,
      FOUNDATION_PREFLIGHT_CODES.EFFECT_NOT_ALLOWED,
      FOUNDATION_PREFLIGHT_CODES.SOURCE_DRIFT,
    ]));
    expect(evidence.effect_authorized).toBe(false);
  });

  it("reports web mode as unavailable without fabricating host evidence", async () => {
    const state = await new WorkspaceCapabilityInstanceAdapter()
      .runLiveEffectFreePreflight(detectEssaysTauriAgentBridge(undefined));
    expect(state).toEqual({
      status: "unavailable",
      code: FOUNDATION_PREFLIGHT_CODES.HOST_EVIDENCE_UNAVAILABLE,
      reason: "web-mode",
    });
  });

  it("calls only principal_evidence on the existing Tauri control plane", async () => {
    const invoke = vi.fn().mockResolvedValue(principal);
    const bridge = detectEssaysTauriAgentBridge({ __TAURI__: { core: { invoke } } });
    const state = await new WorkspaceCapabilityInstanceAdapter().runLiveEffectFreePreflight(bridge);
    expect(state.status).toBe("complete");
    if (state.status === "complete") expect(state.evidence.outcome).toBe("PASS");
    expect(invoke).toHaveBeenCalledExactlyOnceWith("principal_evidence", {});
    expect(invoke).not.toHaveBeenCalledWith("execute", expect.anything());
  });

  it("turns a principal-evidence failure into typed fail-closed evidence", async () => {
    const invoke = vi.fn().mockRejectedValue(new Error("host unavailable"));
    const bridge = detectEssaysTauriAgentBridge({ __TAURI__: { core: { invoke } } });
    const state = await new WorkspaceCapabilityInstanceAdapter().runLiveEffectFreePreflight(bridge);
    expect(state.status).toBe("complete");
    if (state.status === "complete") {
      expect(state.evidence.outcome).toBe("FAIL");
      expect(state.evidence.failed_codes).toContain(FOUNDATION_PREFLIGHT_CODES.PRINCIPAL_EVIDENCE_FAILED);
      expect(state.evidence.effect_authorized).toBe(false);
    }
  });
});
