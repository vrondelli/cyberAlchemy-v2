import {OewBundleError, validateOewBundle} from "./types.ts";

/**
 * @typedef {{
 *   ok: boolean,
 *   status: number,
 *   text: () => Promise<string>
 * }} OewFetchResponse
 */
/**
 * @typedef {{
 *   document: unknown,
 *   sha256: string
 * }} LoadedDocument
 */

const files = {
  graph: "presentation-graph.json",
  sidecar: "evidence-sidecar.json",
  receipt: "adapter-receipt.json",
};

/**
 * @param {string} baseUrl
 * @param {string} file
 * @param {string | null | undefined} token
 * @returns {string}
 */
const tokenizedUrl = (baseUrl, file, token) => {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(file, base);
  if (token) url.searchParams.set("token", token);
  return url.toString();
};

/**
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function sha256Text(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * @param {{
 *   baseUrl: string,
 *   token?: string | null,
 *   expectedReceiptSha256: string,
 *   fetchImpl?: (url: string, options: RequestInit) => Promise<OewFetchResponse>,
 *   sha256Impl?: (text: string) => Promise<string>
 * }} options
 */
export async function loadOewBundle({
  baseUrl,
  token,
  expectedReceiptSha256,
  fetchImpl = globalThis.fetch,
  sha256Impl = sha256Text,
}) {
  if (typeof fetchImpl !== "function") {
    throw new OewBundleError("FETCH_UNAVAILABLE");
  }
  const entries = await Promise.all(
    Object.entries(files).map(async ([role, file]) => {
      const response = await fetchImpl(tokenizedUrl(baseUrl, file, token), {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
      });
      if (!response.ok) {
        throw new OewBundleError(
          "BUNDLE_FETCH_FAILED",
          `${role}:${response.status}`,
        );
      }
      const text = await response.text();
      /** @type {unknown} */
      let document;
      try {
        document = JSON.parse(text);
      } catch {
        throw new OewBundleError("BUNDLE_JSON_INVALID", role);
      }
      return [role, {document, sha256: await sha256Impl(text)}];
    }),
  );
  /** @type {Record<string, LoadedDocument>} */
  const loaded = Object.fromEntries(entries);
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
