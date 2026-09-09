export interface PresentationNode {
  readonly id: string;
  readonly name: string;
  readonly summary?: string;
  readonly type: string;
  readonly complexity?: string;
  readonly filePath?: string;
  readonly tags: readonly string[];
  readonly knowledgeMeta?: { readonly category?: string; readonly content?: string };
}

export interface PresentationEdge {
  readonly id?: string;
  readonly source: string;
  readonly target: string;
  readonly type: string;
  readonly description?: string;
  readonly direction?: string;
  readonly weight?: number;
}

export interface TourStep {
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly nodeIds: readonly string[];
}

export interface PresentationGraph {
  readonly version: string;
  readonly kind: string;
  readonly project: unknown;
  readonly nodes: readonly PresentationNode[];
  readonly edges: readonly PresentationEdge[];
  readonly tour?: readonly TourStep[];
}

export interface SidecarNode {
  readonly authority_effect: string;
  readonly mapping_loss: string;
  readonly presentation_type: string;
  readonly source_artifact: string;
  readonly source_digest: string;
  readonly source_kind: string;
  readonly source_kind_original: string;
  readonly source_path: string;
  readonly source_ref: string;
}

export interface SidecarEdge {
  readonly authority_effect: string;
  readonly diagnostics: readonly string[];
  readonly evidence_refs: readonly string[];
  readonly mapping_loss: string;
  readonly presentation_relation: string;
  readonly source: string;
  readonly source_ref: string;
  readonly source_relation: string;
  readonly target: string;
}

export interface EvidenceSidecar {
  readonly schema_version: string;
  readonly authority_effect: string;
  readonly source_run: string | { readonly run_id?: string };
  readonly counts: {
    readonly presentation_nodes: number;
    readonly presentation_edges: number;
    readonly sidecar_nodes: number;
    readonly sidecar_edges: number;
  };
  readonly nodes: Readonly<Record<string, SidecarNode>>;
  readonly edges: Readonly<Record<string, SidecarEdge>>;
}

export interface AdapterReceipt {
  readonly schema_version: string;
  readonly run_id: string;
  readonly result: string;
  readonly state: string;
  readonly authority_effect: string;
  readonly evidence_ceiling: string;
  readonly artifacts: readonly { readonly path: string; readonly sha256: string; readonly size_bytes: number }[];
  readonly mapping_counts: {
    readonly presentation_nodes: number;
    readonly presentation_edges: number;
    readonly sidecar_nodes: number;
    readonly sidecar_edges: number;
  };
}

export type DatasetAssetRole = "presentationGraph" | "evidenceSidecar" | "adapterReceipt";

export interface DatasetAssetDeclaration {
  readonly url: string;
  readonly sha256: string;
  readonly sizeBytes: number;
  readonly schemaId: string;
}

export interface DatasetManifest {
  readonly schemaVersion: "oew.dataset-manifest.v1";
  readonly datasetId: string;
  readonly name: string;
  readonly runId: string;
  readonly counts: { readonly nodes: number; readonly relations: number };
  readonly assets: Readonly<Record<DatasetAssetRole, DatasetAssetDeclaration>>;
}

declare const verifiedDatasetBrand: unique symbol;

export interface VerifiedDataset {
  readonly [verifiedDatasetBrand]: true;
  readonly manifest: DatasetManifest;
  readonly graph: PresentationGraph;
  readonly sidecar: EvidenceSidecar;
  readonly receipt: AdapterReceipt;
  readonly admittedAt: string;
}

export type DatasetAdmissionCode =
  | "ABORTED"
  | "CROSS_ORIGIN"
  | "FETCH_FAILED"
  | "INVALID_JSON"
  | "INVALID_MANIFEST"
  | "SIZE_MISMATCH"
  | "DIGEST_MISMATCH"
  | "SCHEMA_MISMATCH"
  | "COUNT_MISMATCH"
  | "RECEIPT_REJECTED"
  | "IDENTITY_MISMATCH";

export class DatasetAdmissionError extends Error {
  constructor(readonly code: DatasetAdmissionCode, message: string, readonly cause?: unknown) {
    super(message);
    this.name = "DatasetAdmissionError";
  }
}
