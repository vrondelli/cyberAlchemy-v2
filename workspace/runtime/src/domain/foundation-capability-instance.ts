import type {
  EssaysTauriAgentBridgeDetection,
  LocalProcessPrincipalEvidence,
} from "../features/agents/tauri-agent-bridge";
import { foundationCapabilityInstanceProjection } from "./foundation-capability-instance.generated";

export type FoundationCapabilityInstanceProjection = typeof foundationCapabilityInstanceProjection;

export interface FoundationInvocationPreparation {
  readonly schema: "cav2.foundation-runtime-invocation/v1-candidate";
  readonly instance_ref: string;
  readonly parent_capability_ref: string;
  readonly principal: {
    readonly principal_id: string;
    readonly domain: "local-workspace";
    readonly evidence_kind: "local-process";
    readonly verified_human_identity: false;
  };
  readonly host_claim: {
    readonly host: string;
    readonly active: true;
  };
  readonly effect_envelope: {
    readonly envelope_id: string;
    readonly effects: readonly [];
  };
  readonly grants: readonly [];
  readonly execution_requested: false;
  readonly claim_ceiling: string;
}

export const FOUNDATION_PREFLIGHT_CODES = Object.freeze({
  INSTANCE_MISMATCH: "FOUNDATION_INSTANCE_MISMATCH",
  PARENT_MISMATCH: "FOUNDATION_PARENT_MISMATCH",
  PRINCIPAL_MISSING: "FOUNDATION_PRINCIPAL_MISSING",
  PRINCIPAL_EVIDENCE_FAILED: "FOUNDATION_PRINCIPAL_EVIDENCE_FAILED",
  DOMAIN_MISMATCH: "FOUNDATION_DOMAIN_MISMATCH",
  HOST_MISMATCH: "FOUNDATION_HOST_MISMATCH",
  HOST_INACTIVE: "FOUNDATION_HOST_INACTIVE",
  HOST_EVIDENCE_UNAVAILABLE: "FOUNDATION_HOST_EVIDENCE_UNAVAILABLE",
  LIFECYCLE_INACTIVE: "FOUNDATION_LIFECYCLE_INACTIVE",
  EFFECT_NOT_ALLOWED: "FOUNDATION_EFFECT_NOT_ALLOWED",
  SOURCE_DRIFT: "FOUNDATION_SOURCE_DRIFT",
  DIGEST_UNAVAILABLE: "FOUNDATION_DIGEST_UNAVAILABLE",
} as const);

export interface FoundationPreflightEvidence {
  readonly schema: "cav2.foundation-live-preflight-evidence/v1-candidate";
  readonly evidence_id: `sha256:${string}`;
  readonly outcome: "PASS" | "FAIL";
  readonly failed_codes: readonly string[];
  readonly subject: {
    readonly instance_ref: string;
    readonly parent_capability_ref: string;
    readonly principal_ref: string;
    readonly host: string;
    readonly lifecycle_epoch: string;
  };
  readonly effect_authorized: false;
  readonly execution_attempted: false;
  readonly source_currentness: "current-at-generation" | "drifted";
  readonly claim_ceiling: string;
}

export type FoundationLivePreflightState =
  | Readonly<{ status: "unavailable"; code: typeof FOUNDATION_PREFLIGHT_CODES.HOST_EVIDENCE_UNAVAILABLE; reason: string }>
  | Readonly<{ status: "complete"; evidence: FoundationPreflightEvidence }>;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

const projection = deepFreeze(foundationCapabilityInstanceProjection);

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)]));
  }
  return value;
}

async function sha256(value: unknown): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error(FOUNDATION_PREFLIGHT_CODES.DIGEST_UNAVAILABLE);
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalize(value)));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class WorkspaceCapabilityInstanceAdapter {
  inspect(): FoundationCapabilityInstanceProjection {
    return projection;
  }

  prepareEffectFreeInvocation(principal: LocalProcessPrincipalEvidence): FoundationInvocationPreparation {
    const candidate = projection.capability_instance;
    return deepFreeze({
      schema: "cav2.foundation-runtime-invocation/v1-candidate",
      instance_ref: candidate.instance_id,
      parent_capability_ref: candidate.parent_capability_ref,
      principal: {
        principal_id: principal.principalSubject,
        domain: "local-workspace",
        evidence_kind: principal.evidenceKind,
        verified_human_identity: principal.verifiedHumanIdentity,
      },
      host_claim: { host: candidate.host, active: true },
      effect_envelope: { envelope_id: candidate.effect_envelope.envelope_id, effects: [] },
      grants: [],
      execution_requested: false,
      claim_ceiling: "preparation only; the Tauri host has not executed or issued a receipt",
    });
  }

  async evaluateEffectFreePreflight(
    invocation: FoundationInvocationPreparation,
    sourceCurrent = projection.source_currentness.status === "current-at-generation",
    additionalFailedCodes: readonly string[] = [],
  ): Promise<FoundationPreflightEvidence> {
    const candidate = projection.capability_instance;
    const failedCodes = [...additionalFailedCodes,
      invocation.instance_ref === candidate.instance_id ? null : FOUNDATION_PREFLIGHT_CODES.INSTANCE_MISMATCH,
      invocation.parent_capability_ref === candidate.parent_capability_ref ? null : FOUNDATION_PREFLIGHT_CODES.PARENT_MISMATCH,
      invocation.principal.principal_id ? null : FOUNDATION_PREFLIGHT_CODES.PRINCIPAL_MISSING,
      invocation.principal.domain === "local-workspace" ? null : FOUNDATION_PREFLIGHT_CODES.DOMAIN_MISMATCH,
      invocation.host_claim.host === candidate.host ? null : FOUNDATION_PREFLIGHT_CODES.HOST_MISMATCH,
      invocation.host_claim.active ? null : FOUNDATION_PREFLIGHT_CODES.HOST_INACTIVE,
      candidate.lifecycle.state === "candidate" && candidate.lifecycle.activation === "not-authorized" ? null : FOUNDATION_PREFLIGHT_CODES.LIFECYCLE_INACTIVE,
      invocation.effect_envelope.effects.length === 0 ? null : FOUNDATION_PREFLIGHT_CODES.EFFECT_NOT_ALLOWED,
      sourceCurrent ? null : FOUNDATION_PREFLIGHT_CODES.SOURCE_DRIFT,
    ].filter((code): code is string => code !== null);
    const subject = {
      instance_ref: invocation.instance_ref,
      parent_capability_ref: invocation.parent_capability_ref,
      principal_ref: invocation.principal.principal_id,
      host: invocation.host_claim.host,
      lifecycle_epoch: candidate.lifecycle.epoch,
    };
    const evidenceBody = {
      subject,
      failed_codes: failedCodes,
      source_currentness: sourceCurrent ? "current-at-generation" : "drifted",
      effect_authorized: false,
      execution_attempted: false,
    } as const;
    return deepFreeze({
      schema: "cav2.foundation-live-preflight-evidence/v1-candidate",
      evidence_id: `sha256:${await sha256(evidenceBody)}`,
      outcome: failedCodes.length === 0 ? "PASS" : "FAIL",
      ...evidenceBody,
      claim_ceiling: "live effect-free candidate evidence; not a Validation Receipt, conformance, approval, authority, or Host execution receipt",
    });
  }

  async runLiveEffectFreePreflight(bridge: EssaysTauriAgentBridgeDetection): Promise<FoundationLivePreflightState> {
    if (bridge.status === "unavailable") {
      return deepFreeze({
        status: "unavailable",
        code: FOUNDATION_PREFLIGHT_CODES.HOST_EVIDENCE_UNAVAILABLE,
        reason: bridge.reason,
      });
    }
    try {
      const principal = await bridge.principalEvidence();
      const invocation = this.prepareEffectFreeInvocation(principal);
      return deepFreeze({ status: "complete", evidence: await this.evaluateEffectFreePreflight(invocation) });
    } catch {
      const invocation = this.prepareEffectFreeInvocation({
        principalSubject: "",
        clientId: "essays-tauri",
        evidenceKind: "local-process",
        verifiedHumanIdentity: false,
      });
      const evidence = await this.evaluateEffectFreePreflight(
        invocation,
        projection.source_currentness.status === "current-at-generation",
        [FOUNDATION_PREFLIGHT_CODES.PRINCIPAL_EVIDENCE_FAILED],
      );
      return deepFreeze({
        status: "complete",
        evidence,
      });
    }
  }
}
