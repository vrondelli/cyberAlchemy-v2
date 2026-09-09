import { GENERATED_FOUNDATION_SNAPSHOT } from "./foundation.generated";

export interface FoundationDefinitionProjection {
  readonly definitionId: string;
  readonly title: string;
  readonly disposition: string;
  readonly summary: string;
  readonly sourceRef: string;
  readonly sourceSha256: string;
  readonly currentness: "current-at-generated-epoch";
  readonly ownerRoute: string;
  readonly boundary: string;
  readonly claimCeiling: string;
}

export interface FoundationSnapshot {
  readonly schemaVersion: "cav2.workspace-foundation-snapshot/v1";
  readonly snapshotId: string;
  readonly sourceEpoch: string;
  readonly generatedAt: string;
  readonly authorityEffect: "none";
  readonly integration: {
    readonly status: "projection-current-host-rebind-required";
    readonly workspaceHostId: string;
    readonly workspaceControlPlane: string;
    readonly foundationMayCommitHostState: false;
    readonly invocationAvailable: false;
    readonly reason: string;
  };
  readonly capability: {
    readonly capabilityId: string;
    readonly status: string;
    readonly outcome: string;
    readonly scope: readonly string[];
    readonly exclusions: readonly string[];
    readonly adoptionDecisionState: string;
    readonly sourceRef: string;
    readonly sourceSha256: string;
  };
  readonly legacyCandidate: {
    readonly candidateId: string;
    readonly status: string;
    readonly hostControlPlane: string;
    readonly claimCeiling: string;
    readonly productApproval: string;
    readonly sourceRef: string;
    readonly sourceSha256: string;
  };
  readonly definitions: readonly FoundationDefinitionProjection[];
  readonly sourceSet: readonly { readonly ref: string; readonly sha256: string }[];
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

const snapshot = deepFreeze(GENERATED_FOUNDATION_SNAPSHOT as FoundationSnapshot);

export class WorkspaceFoundationAdapter {
  inspectFoundation(): FoundationSnapshot {
    return snapshot;
  }
}

export function filterFoundationDefinitions(definitions: readonly FoundationDefinitionProjection[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return definitions;
  return definitions.filter((definition) => [definition.definitionId, definition.title, definition.disposition, definition.summary]
    .some((value) => value.toLocaleLowerCase().includes(normalized)));
}
