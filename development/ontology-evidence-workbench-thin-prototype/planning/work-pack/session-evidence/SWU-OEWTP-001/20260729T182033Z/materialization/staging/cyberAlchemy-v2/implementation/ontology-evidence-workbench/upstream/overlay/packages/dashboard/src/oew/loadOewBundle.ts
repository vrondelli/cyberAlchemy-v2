import { OewBundleError, validateOewBundle } from "./types.ts";

/**
 * @typedef {import("./types.ts").VerifiedOewBundle} VerifiedOewBundle
 * @typedef {"graph" | "sidecar" | "receipt"} OewFileRole
 * @typedef {{ok: boolean, status?: number, text(): Promise<string>}} OewResponse
 * @typedef {(input: string | URL, init?: RequestInit) => Promise<OewResponse>} OewFetch
 * @typedef {{document: unknown, sha256: string}} LoadedDocument
 * @typedef {object} LoadOewBundleOptions
 * @property {string} baseUrl
 * @property {string | null} [token]
 * @property {string} expectedReceiptSha256
 * @property {string} [pageUrl]
 * @property {OewFetch} [fetchImpl]
 * @property {(text: string) => Promise<string>} [sha256Impl]
 */

/** @type {Record<OewFileRole, string>} */
const files = {
  graph: "presentation-graph.json",
  sidecar: "evidence-sidecar.json",
  receipt: "adapter-receipt.json",
};

/**
 * @param {string} baseUrl
 * @param {string} [pageUrl]
 */
const absolutePageUrl = (baseUrl = "", pageUrl = "") => {
  const browserUrl =
    typeof globalThis.location?.href === "string"
      ? globalThis.location.href
      : undefined;
  const candidate = pageUrl ?? browserUrl;
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

/**
 * @param {string} baseUrl
 * @param {string} file
 * @param {string | null} [token]
 * @param {string} [pageUrl]
 */
export const tokenizedUrl = (
  baseUrl = "",
  file = "",
  token = "",
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

/** @param {string} text */
export async function sha256Text(text = "") {
  const bytes = new TextEncoder().encode(text);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * @param {LoadOewBundleOptions} options
 * @returns {Promise<VerifiedOewBundle>}
 */
export async function loadOewBundle({
  baseUrl = "",
  token = "",
  expectedReceiptSha256 = "",
  pageUrl = "",
  fetchImpl = JSON.parse("null"),
  sha256Impl = sha256Text,
} = {}) {
  const effectiveFetch = fetchImpl ?? globalThis.fetch;
  if (typeof effectiveFetch !== "function") {
    throw new OewBundleError("FETCH_UNAVAILABLE");
  }
  /** @type {Partial<Record<OewFileRole, LoadedDocument>>} */
  const loaded = Object.create(null);
  /** @type {Array<[OewFileRole, string]>} */
  const fileEntries = Object.entries(files);
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
  return validateOewBundle({
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
}
