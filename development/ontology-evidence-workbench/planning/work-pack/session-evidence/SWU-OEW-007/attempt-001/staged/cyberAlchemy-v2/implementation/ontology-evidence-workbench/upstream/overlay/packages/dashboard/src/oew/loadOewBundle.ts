import {OewBundleError, validateOewBundle} from "./types.ts";

const files = {
  graph: "presentation-graph.json",
  sidecar: "evidence-sidecar.json",
  receipt: "adapter-receipt.json",
};

const tokenizedUrl = (baseUrl, file, token) => {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(file, base);
  if (token) url.searchParams.set("token", token);
  return url.toString();
};

export async function sha256Text(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

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
      if (!response?.ok) {
        throw new OewBundleError("BUNDLE_FETCH_FAILED", `${role}:${response?.status}`);
      }
      const text = await response.text();
      let document;
      try {
        document = JSON.parse(text);
      } catch {
        throw new OewBundleError("BUNDLE_JSON_INVALID", role);
      }
      return [role, {document, sha256: await sha256Impl(text)}];
    }),
  );
  const loaded = Object.fromEntries(entries);
  return validateOewBundle({
    graph: loaded.graph.document,
    sidecar: loaded.sidecar.document,
    receipt: loaded.receipt.document,
    hashes: {
      graph: loaded.graph.sha256,
      sidecar: loaded.sidecar.sha256,
      receipt: loaded.receipt.sha256,
    },
    expectedReceiptSha256,
  });
}
