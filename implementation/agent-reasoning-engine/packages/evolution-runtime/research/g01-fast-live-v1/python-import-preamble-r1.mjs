// Exposed-development source-only span projection. Never load native labels here.
import {createHash} from "node:crypto";

const sha = value => createHash("sha256").update(value).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-python-preamble.${reason}`);};
const validPath = path => typeof path === "string" && path.endsWith(".py") &&
  !path.startsWith("/") && !path.includes("\\") &&
  !path.split("/").some(part => ["", ".", ".."].includes(part));

function importedNames(lines) {
  const names = new Set();
  for (const line of lines) {
    const from = line.match(/^from\s+[\w.]+\s+import\s+([\w, ]+)\s*$/);
    if (from) {
      for (const item of from[1].split(",")) {
        const match = item.trim().match(/^([A-Za-z_]\w*)(?:\s+as\s+([A-Za-z_]\w*))?$/);
        if (match) names.add(match[2] ?? match[1]);
      }
      continue;
    }
    const direct = line.match(/^import\s+([\w., ]+)\s*$/);
    if (direct) {
      for (const item of direct[1].split(",")) {
        const match = item.trim().match(/^([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)(?:\s+as\s+([A-Za-z_]\w*))?$/);
        if (match) names.add(match[2] ?? match[1].split(".")[0]);
      }
    }
  }
  return names;
}

export function addPythonImportPreamble(prediction, readSource) {
  need(prediction?.traj_data && typeof readSource === "function", "inputs");
  const original = prediction.traj_data;
  need(Array.isArray(original.pred_files) && original.pred_spans &&
    typeof original.pred_spans === "object", "prediction-shape");
  const projected = structuredClone(prediction), additions = [];
  for (const path of original.pred_files) {
    if (!validPath(path)) continue;
    const source = readSource(path);
    if (typeof source !== "string") continue;
    const lines = source.split("\n");
    const firstDeclaration = lines.findIndex(line => /^(?:async\s+def|def|class)\s+[A-Za-z_]\w*/.test(line));
    if (firstDeclaration < 3 || firstDeclaration > 80) continue;
    const preambleEnd = firstDeclaration;
    const names = importedNames(lines.slice(0, preambleEnd));
    if (names.size === 0) continue;
    const spans = original.pred_spans[path];
    if (!Array.isArray(spans) || spans.length === 0) continue;
    const selected = [];
    for (const span of spans) {
      need(Number.isSafeInteger(span.start) && Number.isSafeInteger(span.end) &&
        span.start >= 1 && span.end >= span.start && span.end <= lines.length, "span-shape");
      selected.push(...lines.slice(span.start - 1, span.end));
    }
    const selectedText = selected.join("\n");
    const matched = [...names].filter(name => new RegExp(`\\b${name}\\b`).test(selectedText)).sort();
    if (matched.length === 0) continue;
    const alreadyCovered = spans.some(span => span.start <= 1 && span.end >= preambleEnd);
    if (alreadyCovered) continue;
    projected.traj_data.pred_spans[path].push({start: 1, end: preambleEnd});
    additions.push({path, span: {start: 1, end: preambleEnd}, matched_imported_names: matched,
      source_sha256: sha(source), policy: "bounded-module-preamble-before-first-declaration"});
  }
  return {prediction: projected, additions};
}
