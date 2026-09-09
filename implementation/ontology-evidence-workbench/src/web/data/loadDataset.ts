import {
  DatasetAdmissionError,
  type AdapterReceipt,
  type DatasetAssetDeclaration,
  type DatasetAssetRole,
  type DatasetManifest,
  type EvidenceSidecar,
  type PresentationGraph,
  type VerifiedDataset,
} from "../contracts/bundle";

interface LoadOptions {
  readonly fetcher?: typeof fetch;
  readonly origin?: string;
  readonly signal?: AbortSignal;
}

const ROLES: readonly DatasetAssetRole[] = ["presentationGraph", "evidenceSidecar", "adapterReceipt"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertManifest(value: unknown): asserts value is DatasetManifest {
  if (!isRecord(value) || value.schemaVersion !== "oew.dataset-manifest.v1" || typeof value.datasetId !== "string" || typeof value.name !== "string" || typeof value.runId !== "string" || !isRecord(value.counts) || !Number.isInteger(value.counts.nodes) || !Number.isInteger(value.counts.relations) || !isRecord(value.assets)) {
    throw new DatasetAdmissionError("INVALID_MANIFEST", "Dataset manifest shape is invalid.");
  }
  for (const role of ROLES) {
    const asset = value.assets[role];
    if (!isRecord(asset) || typeof asset.url !== "string" || !/^[a-f0-9]{64}$/.test(String(asset.sha256)) || !Number.isInteger(asset.sizeBytes) || typeof asset.schemaId !== "string") {
      throw new DatasetAdmissionError("INVALID_MANIFEST", `Asset declaration ${role} is invalid.`);
    }
  }
}

async function digest(bytes: Uint8Array): Promise<string> {
  const input = new Uint8Array(bytes.byteLength);
  input.set(bytes);
  const result = await crypto.subtle.digest("SHA-256", input as Uint8Array<ArrayBuffer>);
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function fetchJsonAsset<T>(asset: DatasetAssetDeclaration, base: URL, fetcher: typeof fetch, signal?: AbortSignal): Promise<T> {
  const url = new URL(asset.url, base);
  if (url.origin !== base.origin || !url.pathname.startsWith("/datasets/body-war/")) {
    throw new DatasetAdmissionError("CROSS_ORIGIN", `Rejected non-dataset URL ${url.href}.`);
  }
  let response: Response;
  try {
    response = await fetcher(url, { cache: "no-store", ...(signal ? { signal } : {}) });
  } catch (error) {
    if (signal?.aborted) throw new DatasetAdmissionError("ABORTED", "Dataset admission was aborted.", error);
    throw new DatasetAdmissionError("FETCH_FAILED", `Could not fetch ${url.pathname}.`, error);
  }
  if (!response.ok) throw new DatasetAdmissionError("FETCH_FAILED", `${url.pathname} returned HTTP ${response.status}.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength !== asset.sizeBytes) throw new DatasetAdmissionError("SIZE_MISMATCH", `${url.pathname} size did not match its manifest.`);
  if (await digest(bytes) !== asset.sha256) throw new DatasetAdmissionError("DIGEST_MISMATCH", `${url.pathname} digest did not match its manifest.`);
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch (error) {
    throw new DatasetAdmissionError("INVALID_JSON", `${url.pathname} is not valid JSON.`, error);
  }
}

function validateBundle(manifest: DatasetManifest, graph: PresentationGraph, sidecar: EvidenceSidecar, receipt: AdapterReceipt): void {
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges) || !isRecord(sidecar.nodes) || !isRecord(sidecar.edges)) {
    throw new DatasetAdmissionError("SCHEMA_MISMATCH", "Graph or evidence sidecar shape is invalid.");
  }
  const counts = [graph.nodes.length, Object.keys(sidecar.nodes).length, sidecar.counts.presentation_nodes, sidecar.counts.sidecar_nodes, receipt.mapping_counts.presentation_nodes, receipt.mapping_counts.sidecar_nodes];
  const relationCounts = [graph.edges.length, Object.keys(sidecar.edges).length, sidecar.counts.presentation_edges, sidecar.counts.sidecar_edges, receipt.mapping_counts.presentation_edges, receipt.mapping_counts.sidecar_edges];
  if (counts.some((count) => count !== manifest.counts.nodes) || relationCounts.some((count) => count !== manifest.counts.relations)) {
    throw new DatasetAdmissionError("COUNT_MISMATCH", "Cross-artifact node or relation cardinality mismatch.");
  }
  if (receipt.result !== "pass" || receipt.state !== "receipt-complete" || receipt.authority_effect !== "none" || sidecar.authority_effect !== "none") {
    throw new DatasetAdmissionError("RECEIPT_REJECTED", "The adapter receipt does not prove a read-only passing projection.");
  }
  if (receipt.run_id !== manifest.runId) throw new DatasetAdmissionError("IDENTITY_MISMATCH", "Receipt and manifest run IDs differ.");
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (ids.size !== graph.nodes.length || graph.edges.some((edge) => !ids.has(edge.source) || !ids.has(edge.target))) {
    throw new DatasetAdmissionError("IDENTITY_MISMATCH", "The graph has duplicate nodes or broken relation endpoints.");
  }
  if (graph.nodes.some((node) => !sidecar.nodes[node.id])) throw new DatasetAdmissionError("IDENTITY_MISMATCH", "A graph node has no evidence sidecar record.");
}

export async function loadDataset(manifestUrl: string, options: LoadOptions = {}): Promise<VerifiedDataset> {
  const fetcher = options.fetcher ?? fetch;
  const base = new URL(manifestUrl, options.origin ?? window.location.origin);
  if (base.origin !== (options.origin ?? window.location.origin)) throw new DatasetAdmissionError("CROSS_ORIGIN", "Manifest must be same-origin.");
  let rawManifest: unknown;
  try {
    const response = await fetcher(base, { cache: "no-store", ...(options.signal ? { signal: options.signal } : {}) });
    if (!response.ok) throw new DatasetAdmissionError("FETCH_FAILED", `Manifest returned HTTP ${response.status}.`);
    rawManifest = await response.json();
  } catch (error) {
    if (error instanceof DatasetAdmissionError) throw error;
    if (options.signal?.aborted) throw new DatasetAdmissionError("ABORTED", "Dataset admission was aborted.", error);
    throw new DatasetAdmissionError("FETCH_FAILED", "Could not load the dataset manifest.", error);
  }
  assertManifest(rawManifest);
  const [graph, sidecar, receipt] = await Promise.all([
    fetchJsonAsset<PresentationGraph>(rawManifest.assets.presentationGraph, base, fetcher, options.signal),
    fetchJsonAsset<EvidenceSidecar>(rawManifest.assets.evidenceSidecar, base, fetcher, options.signal),
    fetchJsonAsset<AdapterReceipt>(rawManifest.assets.adapterReceipt, base, fetcher, options.signal),
  ]);
  validateBundle(rawManifest, graph, sidecar, receipt);
  return Object.freeze({ manifest: rawManifest, graph, sidecar, receipt, admittedAt: new Date().toISOString() }) as VerifiedDataset;
}
