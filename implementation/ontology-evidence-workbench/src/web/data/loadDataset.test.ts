import { describe, expect, it } from "vitest";
import { DatasetAdmissionError, type DatasetManifest } from "../contracts/bundle";
import { loadDataset } from "./loadDataset";

const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
const hash = async (value: Uint8Array) => {
  const input = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", input)), (b) => b.toString(16).padStart(2, "0")).join("");
};

async function fixture(overrides: Partial<DatasetManifest> = {}) {
  const graph = { version: "1", kind: "graph", project: {}, nodes: [{ id: "n1", name: "One", type: "claim", tags: [] }], edges: [] };
  const sidecar = { schema_version: "1", authority_effect: "none", source_run: "toy", counts: { presentation_nodes: 1, presentation_edges: 0, sidecar_nodes: 1, sidecar_edges: 0 }, nodes: { n1: {} }, edges: {} };
  const receipt = { schema_version: "1", run_id: "TOY", result: "pass", state: "receipt-complete", authority_effect: "none", evidence_ceiling: "toy", artifacts: [], mapping_counts: { presentation_nodes: 1, presentation_edges: 0, sidecar_nodes: 1, sidecar_edges: 0 } };
  const values = { presentationGraph: bytes(graph), evidenceSidecar: bytes(sidecar), adapterReceipt: bytes(receipt) };
  const manifest: DatasetManifest = {
    schemaVersion: "oew.dataset-manifest.v1", datasetId: "toy", name: "Toy", runId: "TOY", counts: { nodes: 1, relations: 0 },
    assets: Object.fromEntries(await Promise.all(Object.entries(values).map(async ([role, value]) => [role, { url: `/datasets/body-war/${role}.json`, sha256: await hash(value), sizeBytes: value.byteLength, schemaId: "toy" }]))) as DatasetManifest["assets"],
    ...overrides,
  };
  const fetcher = async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("manifest.json")) return new Response(JSON.stringify(manifest));
    const role = Object.keys(values).find((key) => url.endsWith(`${key}.json`)) as keyof typeof values | undefined;
    return role ? new Response(values[role]) : new Response("missing", { status: 404 });
  };
  return { manifest, fetcher };
}

describe("loadDataset", () => {
  it("admits a consistent read-only bundle", async () => {
    const { fetcher } = await fixture();
    const dataset = await loadDataset("/datasets/body-war/manifest.json", { origin: "http://localhost", fetcher: fetcher as typeof fetch });
    expect(dataset.graph.nodes).toHaveLength(1);
  });

  it("fails closed on a digest mismatch", async () => {
    const { manifest, fetcher } = await fixture();
    const tampered = { ...manifest, assets: { ...manifest.assets, presentationGraph: { ...manifest.assets.presentationGraph, sha256: "0".repeat(64) } } };
    const wrapped = async (input: RequestInfo | URL) => String(input).endsWith("manifest.json") ? new Response(JSON.stringify(tampered)) : fetcher(input);
    await expect(loadDataset("/datasets/body-war/manifest.json", { origin: "http://localhost", fetcher: wrapped as typeof fetch })).rejects.toMatchObject({ code: "DIGEST_MISMATCH" } satisfies Partial<DatasetAdmissionError>);
  });

  it("rejects a cross-origin asset", async () => {
    const { manifest, fetcher } = await fixture();
    const external = { ...manifest, assets: { ...manifest.assets, presentationGraph: { ...manifest.assets.presentationGraph, url: "https://example.test/graph.json" } } };
    const wrapped = async (input: RequestInfo | URL) => String(input).endsWith("manifest.json") ? new Response(JSON.stringify(external)) : fetcher(input);
    await expect(loadDataset("/datasets/body-war/manifest.json", { origin: "http://localhost", fetcher: wrapped as typeof fetch })).rejects.toMatchObject({ code: "CROSS_ORIGIN" } satisfies Partial<DatasetAdmissionError>);
  });
});
