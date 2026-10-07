// Exposed-development projection: add exact, issue-named Python constants in
// already selected files. Source and issue only; never consult labels/scores.
import {createHash} from "node:crypto";

const sha = value => createHash("sha256").update(value).digest("hex");
const validPath = value => typeof value === "string" && value.endsWith(".py") &&
  !value.startsWith("/") && !value.includes("\\") &&
  !value.split("/").some(part => ["", ".", ".."].includes(part));
const mentionedConstants = issue => [...new Set([...issue.matchAll(/`([^`]+)`/g)]
  .flatMap(quoted => [...quoted[1].matchAll(/(?:^|[^A-Za-z0-9_])(?:[A-Za-z_]\w*\.)*([A-Z][A-Z0-9_]{5,})(?![A-Za-z0-9_])/g)]
    .map(match => match[1])))].slice(0, 2);
const covered = (spans, line) => spans.some(span => span.start <= line && line <= span.end);

function declarationSpan(lines, index) {
  const first = lines[index];
  if (!first.includes("{")) return {start: index + 1, end: Math.min(lines.length, index + 4)};
  let depth = 0;
  for (let i = index; i < Math.min(lines.length, index + 24); i++) {
    depth += (lines[i].match(/\{/g) ?? []).length - (lines[i].match(/\}/g) ?? []).length;
    if (depth === 0) return {start: index + 1, end: i + 1};
  }
  return null;
}

export function addPythonExplicitIdentifierAnchors(prediction, issue, readSource) {
  if (!prediction?.traj_data || typeof issue !== "string" || typeof readSource !== "function" ||
    !Array.isArray(prediction.traj_data.pred_files) ||
    !prediction.traj_data.pred_spans || typeof prediction.traj_data.pred_spans !== "object")
    throw Error("g01-explicit-identifier.inputs");
  const projected = structuredClone(prediction), additions = [];
  const names = mentionedConstants(issue);
  for (const path of prediction.traj_data.pred_files) {
    if (!validPath(path)) continue;
    const source = readSource(path);
    if (typeof source !== "string") continue;
    const lines = source.split("\n"), spans = projected.traj_data.pred_spans[path];
    if (!Array.isArray(spans) || !spans.every(span => Number.isSafeInteger(span.start) &&
      Number.isSafeInteger(span.end) && span.start >= 1 && span.end >= span.start && span.end <= lines.length))
      throw Error("g01-explicit-identifier.spans");
    for (const name of names) {
      const declaration = new RegExp(`^${name}\\s*=`);
      const indices = lines.flatMap((line, index) => declaration.test(line) ? [index] : []);
      if (indices.length !== 1 || covered(spans, indices[0] + 1)) continue;
      const span = declarationSpan(lines, indices[0]);
      if (!span || spans.some(existing => existing.start <= span.end && existing.end >= span.start)) continue;
      spans.push(span);
      additions.push({path, identifier: name, span, source_sha256: sha(source),
        policy: "exact-backticked-uppercase-constant-in-selected-python-file-at-most-24-lines"});
      break; // At most one addition per selected file.
    }
  }
  return {prediction: projected, additions};
}
