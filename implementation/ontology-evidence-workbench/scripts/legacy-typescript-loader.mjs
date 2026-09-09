import { stripTypeScriptTypes } from "node:module";

const shouldTranspile = (url) =>
  url.startsWith("data:text/javascript") ||
  url.includes("/oew-ui-store-test-");

export async function load(url, context, nextLoad) {
  const loaded = await nextLoad(url, context);
  if (!shouldTranspile(url) || loaded.format !== "module" || loaded.source == null) return loaded;
  const source = typeof loaded.source === "string" ? loaded.source : Buffer.from(loaded.source).toString("utf8");
  return { ...loaded, source: stripTypeScriptTypes(source, { mode: "transform", sourceMap: false }) };
}
