import { OewBundleError, validateOewBundle } from "./types.ts";

type JsonRecord = Record<string, unknown>;
type VerifiedOewBundle = ReturnType<typeof validateOewBundle>;
type OewFileRole = "graph" | "sidecar" | "receipt";
type OewResponse = {ok: boolean; status?: number; text(): Promise<string>};
type OewFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<OewResponse>;
type LoadedDocument = {document: unknown; sha256: string};
type RelationAssembler = (input: {
  scene: JsonRecord;
  encoding: unknown;
  geometry: unknown;
}) => Promise<JsonRecord>;
type LoadOewBundleOptions = {
  baseUrl?: string;
  token?: string | null;
  expectedReceiptSha256?: string;
  pageUrl?: string;
  fetchImpl?: OewFetch | null;
  sha256Impl?: (text: string) => Promise<string>;
  relationScene?: unknown;
  relationEncoding?: unknown;
  relationGeometry?: unknown;
  relationAssembler?: RelationAssembler | null;
};
type RelationAssemblyOptions = {
  bundle?: VerifiedOewBundle;
  scene?: unknown;
  encoding?: unknown;
  geometry?: unknown;
  assembler?: RelationAssembler | null;
};

const files: Record<OewFileRole, string> = {
  graph: "presentation-graph.json",
  sidecar: "evidence-sidecar.json",
  receipt: "adapter-receipt.json",
};

const absolutePageUrl = (baseUrl = "", pageUrl = ""): URL => {
  const browserUrl =
    typeof globalThis.location?.href === "string"
      ? globalThis.location.href
      : undefined;
  const candidate = pageUrl || browserUrl;
  try {
    const page = candidate ? new URL(candidate) : new URL(baseUrl);
    if (page.protocol !== "http:" && page.protocol !== "https:") {
      throw new Error("unsupported page protocol");
    }
    return page;
  } catch {
    throw new OewBundleError("PAGE_ORIGIN_REQUIRED");
  }
};

export const tokenizedUrl = (
  baseUrl = "",
  file = "",
  token: string | null = "",
  pageUrl = "",
) => {
  const page = absolutePageUrl(baseUrl, pageUrl);
  let base;
  let url;
  try {
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    base = new URL(normalizedBase, page);
    url = new URL(file, base);
  } catch {
    throw new OewBundleError("EVIDENCE_BASE_INVALID");
  }
  if (base.origin !== page.origin || url.origin !== page.origin) {
    throw new OewBundleError("EVIDENCE_BASE_CROSS_ORIGIN");
  }
  if (token) url.searchParams.set("token", token);
  return url.toString();
};

export async function sha256Text(text = "") {
  const bytes = new TextEncoder().encode(text);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function loadOewBundle({
  baseUrl = "",
  token = "",
  expectedReceiptSha256 = "",
  pageUrl = "",
  fetchImpl = JSON.parse("null"),
  sha256Impl = sha256Text,
  relationScene = null,
  relationEncoding = null,
  relationGeometry = null,
  relationAssembler = null,
}: LoadOewBundleOptions = {}) {
  const effectiveFetch = fetchImpl ?? globalThis.fetch;
  if (typeof effectiveFetch !== "function") {
    throw new OewBundleError("FETCH_UNAVAILABLE");
  }
  const loaded: Partial<Record<OewFileRole, LoadedDocument>> =
    Object.create(null);
  const fileEntries = Object.entries(files) as Array<[OewFileRole, string]>;
  await Promise.all(
    fileEntries.map(async ([role, file]) => {
      const response = await effectiveFetch(
        tokenizedUrl(baseUrl, file, token, pageUrl),
        {
          method: "GET",
          cache: "no-store",
          credentials: "omit",
        },
      );
      if (!response?.ok) {
        throw new OewBundleError(
          "BUNDLE_FETCH_FAILED",
          `${role}:${response?.status ?? "unknown"}`,
        );
      }
      const text = await response.text();
      let document;
      try {
        document = JSON.parse(text);
      } catch {
        throw new OewBundleError("BUNDLE_JSON_INVALID", role);
      }
      loaded[role] = { document, sha256: await sha256Impl(text) };
    }),
  );

  const graph = loaded.graph;
  const sidecar = loaded.sidecar;
  const receipt = loaded.receipt;
  if (!graph || !sidecar || !receipt) {
    throw new OewBundleError("BUNDLE_DOCUMENT_MISSING");
  }
  const bundle = validateOewBundle({
    graph: graph.document,
    sidecar: sidecar.document,
    receipt: receipt.document,
    hashes: {
      graph: graph.sha256,
      sidecar: sidecar.sha256,
      receipt: receipt.sha256,
    },
    expectedReceiptSha256,
  });
  if (relationScene === null) return bundle;
  return assembleV13RelationBundle({
    bundle,
    scene: relationScene,
    encoding: relationEncoding,
    geometry: relationGeometry,
    assembler: relationAssembler,
  });
}

/**
 * Optional v1.3 seam. The caller injects the admitted scene assembler so the
 * legacy three-file loader keeps its import and fetch boundary unchanged.
 */
export async function assembleV13RelationBundle({
  bundle,
  scene,
  encoding,
  geometry = null,
  assembler,
}: RelationAssemblyOptions = {}) {
  if (
    !isRecord(scene) ||
    scene.schema_version !== "oew.knowledge-scene.v1.3" ||
    typeof scene.scene_digest !== "string"
  ) {
    throw new OewBundleError("RELATION_SCENE_INVALID");
  }
  if (typeof assembler !== "function") {
    throw new OewBundleError("RELATION_ASSEMBLER_REQUIRED");
  }
  const relationProjectionBySourceRef = await assembler({
    scene,
    encoding,
    geometry,
  });
  if (
    relationProjectionBySourceRef === null ||
    typeof relationProjectionBySourceRef !== "object" ||
    Array.isArray(relationProjectionBySourceRef)
  ) {
    throw new OewBundleError("RELATION_PROJECTION_INVALID");
  }
  const receipt = isRecord(scene.relation_index_receipt)
    ? scene.relation_index_receipt
    : null;
  const expected = receipt?.relation_ids;
  if (
    !Array.isArray(expected) ||
    expected.some((relationId) =>
      !hasOwn(relationProjectionBySourceRef, relationId as PropertyKey),
    ) ||
    Object.keys(relationProjectionBySourceRef).length !== expected.length
  ) {
    throw new OewBundleError("RELATION_PROJECTION_NOT_TOTAL");
  }
  return Object.freeze({
    ...bundle,
    relationScene: scene,
    relationProjectionBySourceRef: Object.freeze({
      ...relationProjectionBySourceRef,
    }),
  });
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);
