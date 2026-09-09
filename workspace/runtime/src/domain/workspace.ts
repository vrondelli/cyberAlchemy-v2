export const WORKSPACE_COLLECTIONS = ["definitions", "products", "projects", "ontologies"] as const;

export type WorkspaceCollection = (typeof WORKSPACE_COLLECTIONS)[number];

export interface WorkspaceRecord {
  readonly collection: WorkspaceCollection;
  readonly recordId: string;
  readonly label: string;
  readonly status: string;
  readonly meaning: string;
  readonly ownerRoute: string;
  readonly sourceRefs: readonly string[];
  readonly boundary: string;
  readonly claimCeiling: string;
  readonly sourceEpoch: string;
  readonly projectEntryRef?: string;
}

export interface WorkspaceSnapshot {
  readonly snapshotId: string;
  readonly sourceEpoch: string;
  readonly generatedAt: string;
  readonly authorityEffect: "none";
  readonly definitions: readonly WorkspaceRecord[];
  readonly products: readonly WorkspaceRecord[];
  readonly projects: readonly WorkspaceRecord[];
  readonly ontologies: readonly WorkspaceRecord[];
}

export interface WorkspaceViewModel {
  readonly snapshotId: string;
  readonly sourceEpoch: string;
  readonly collections: Readonly<Record<WorkspaceCollection, readonly WorkspaceRecord[]>>;
}

export function toWorkspaceViewModel(snapshot: WorkspaceSnapshot): WorkspaceViewModel {
  return {
    snapshotId: snapshot.snapshotId,
    sourceEpoch: snapshot.sourceEpoch,
    collections: Object.freeze({
      definitions: snapshot.definitions,
      products: snapshot.products,
      projects: snapshot.projects,
      ontologies: snapshot.ontologies,
    }),
  };
}

export function filterWorkspaceRecords(records: readonly WorkspaceRecord[], query: string): readonly WorkspaceRecord[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return records;
  return records.filter((record) => [record.label, record.recordId, record.status, record.meaning, record.ownerRoute]
    .some((value) => value.toLocaleLowerCase().includes(normalized)));
}
