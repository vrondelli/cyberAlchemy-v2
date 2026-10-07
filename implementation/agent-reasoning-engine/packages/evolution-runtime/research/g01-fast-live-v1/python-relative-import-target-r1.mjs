// Exposed-development, source-only projection. Never consult labels or scores.
import {createHash} from "node:crypto";
import {posix} from "node:path";

const sha = value => createHash("sha256").update(value).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-relative-import.${reason}`);};
const validPath = path => typeof path === "string" && path.endsWith(".py") &&
  !path.startsWith("/") && !path.includes("\\") &&
  !path.split("/").some(part => ["", ".", ".."].includes(part));
const word = name => new RegExp(`\\b${name}\\b`);
const declaration = name => new RegExp(`^\\s*(?:(?:async\\s+)?def\\s+${name}\\b|class\\s+${name}\\b|${name}\\s*=)`);

export function addPythonRelativeImportTargets(prediction, readSource) {
  need(prediction?.traj_data && typeof readSource === "function", "inputs");
  const original = prediction.traj_data;
  need(Array.isArray(original.pred_files) && original.pred_spans &&
    typeof original.pred_spans === "object", "prediction-shape");
  const projected = structuredClone(prediction), additions = [];
  const seen = new Set(original.pred_files);
  for (const sourcePath of original.pred_files) {
    if (!validPath(sourcePath)) continue;
    const source = readSource(sourcePath);
    if (typeof source !== "string") continue;
    const lines = source.split("\n");
    const spans = original.pred_spans[sourcePath];
    if (!Array.isArray(spans) || spans.length === 0) continue;
    const selected = [];
    for (const span of spans) {
      need(Number.isSafeInteger(span.start) && Number.isSafeInteger(span.end) &&
        span.start >= 1 && span.end >= span.start && span.end <= lines.length, "span-shape");
      selected.push(...lines.slice(span.start - 1, span.end));
    }
    const selectedText = selected.join("\n");
    for (const line of lines.slice(0, 80)) {
      const match = line.match(/^from\s+\.([A-Za-z_]\w*)\s+import\s+([A-Za-z_,\s]+)\s*$/);
      if (!match) continue;
      const targetPath = posix.join(posix.dirname(sourcePath), `${match[1]}.py`);
      if (!validPath(targetPath) || seen.has(targetPath)) continue;
      const names = match[2].split(",").map(item => item.trim()).filter(item => /^[A-Za-z_]\w*$/.test(item));
      const used = names.filter(name => word(name).test(selectedText));
      if (used.length === 0) continue;
      const target = readSource(targetPath);
      if (typeof target !== "string") continue;
      const targetLines = target.split("\n");
      if (targetLines.at(-1) === "") targetLines.pop();
      if (targetLines.length < 8 || targetLines.length > 120 ||
        !used.some(name => targetLines.some(value => declaration(name).test(value)))) continue;
      projected.traj_data.pred_files.push(targetPath);
      projected.traj_data.pred_spans[targetPath] = [{start: 1, end: targetLines.length}];
      additions.push({source_path: sourcePath, target_path: targetPath,
        imported_names_used: used, target_span: {start: 1, end: targetLines.length},
        source_sha256: sha(source), target_sha256: sha(target),
        policy: "single-dot-relative-import-entire-helper-at-most-120-lines"});
      seen.add(targetPath);
      break; // At most one helper per selected source file.
    }
  }
  return {prediction: projected, additions};
}
