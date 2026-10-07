// Exposed-development projection. Only prediction summary and pinned base source.
import {createHash} from "node:crypto";

const sha = value => createHash("sha256").update(value).digest("hex");
const validPath = path => typeof path === "string" && path.endsWith(".py") &&
  !path.startsWith("/") && !path.includes("\\") &&
  !path.split("/").some(part => ["", ".", ".."].includes(part));

function functionSpan(source, declarationLine) {
  const lines = source.split("\n");
  const start = declarationLine - 1;
  if (!Number.isSafeInteger(declarationLine) || declarationLine < 1 || start >= lines.length ||
    !/^def\s+[A-Za-z_]\w*\s*\(/.test(lines[start])) return null;
  let end = start;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() && !/^\s/.test(lines[i]) && !lines[i].startsWith("#")) break;
    if (lines[i].trim()) end = i;
    if (i - start >= 31) return null;
  }
  return {start: declarationLine, end: end + 1};
}

export function addSummarySymbolClosure(prediction, summary, resolveSymbol) {
  if (!prediction?.traj_data || !Array.isArray(prediction.traj_data.pred_files) ||
    typeof prediction.traj_data.pred_spans !== "object" ||
    typeof summary !== "string" || typeof resolveSymbol !== "function")
    throw Error("g01-summary-symbol-closure.inputs");
  const projected = structuredClone(prediction);
  const selected = projected.traj_data.pred_files;
  if (selected.length !== 1 || !validPath(selected[0]))
    return {prediction: projected, additions: []};
  const symbols = [...new Set([...summary.matchAll(/`([A-Za-z_]\w*)\s*\(/g)].map(hit => hit[1]))];
  const candidates = [];
  for (const symbol of symbols) {
    const hits = resolveSymbol(symbol);
    if (!Array.isArray(hits)) throw Error("g01-summary-symbol-closure.hits");
    if (hits.length !== 1) continue;
    const hit = hits[0];
    if (!validPath(hit.path) || selected.includes(hit.path) || typeof hit.source !== "string") continue;
    const span = functionSpan(hit.source, hit.line);
    if (span) candidates.push({symbol, path: hit.path, span, source_sha256: sha(hit.source)});
  }
  // Do not choose among several plausible new files after viewing an outcome.
  if (candidates.length !== 1) return {prediction: projected, additions: []};
  const addition = candidates[0];
  selected.push(addition.path);
  projected.traj_data.pred_spans[addition.path] = [addition.span];
  return {prediction: projected, additions: [addition]};
}
