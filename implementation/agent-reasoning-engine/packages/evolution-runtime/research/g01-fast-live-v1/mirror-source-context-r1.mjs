// Source-only projection of selected include/ spans into a unique exact
// single_include/ mirror. This module never reads labels or native scores.
import {createHash} from "node:crypto";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => {if (!value) throw Error(`g01-mirror.${reason}`);};
const validPath = path => typeof path === "string" && path.length > 0 && !path.startsWith("/") && !path.includes("\\") && !path.split("/").some(part => ["", ".", ".."].includes(part));

export function addExactSingleIncludeMirrors(prediction, readSource) {
  need(prediction?.traj_data && typeof readSource === "function", "inputs");
  const original = prediction.traj_data;
  need(Array.isArray(original.pred_files) && original.pred_spans && typeof original.pred_spans === "object", "prediction-shape");
  const final = structuredClone(prediction);
  const additions = [];
  for (const path of original.pred_files) {
    need(validPath(path), "source-path");
    if (!path.startsWith("include/")) continue;
    const mirror = `single_include/${path.slice("include/".length)}`;
    if (!validPath(mirror) || original.pred_files.includes(mirror)) continue;
    const sourceText = readSource(path), mirrorText = readSource(mirror);
    if (typeof sourceText !== "string" || typeof mirrorText !== "string") continue;
    const sourceLines = sourceText.split("\n"), mirrorLines = mirrorText.split("\n");
    const spans = original.pred_spans[path];
    if (!Array.isArray(spans) || spans.length === 0) continue;
    const projected = [];
    let valid = true;
    for (const span of spans) {
      if (!Number.isSafeInteger(span.start) || !Number.isSafeInteger(span.end) || span.start < 1 || span.end < span.start || span.end > sourceLines.length || span.end - span.start + 1 > 200) {valid = false; break;}
      const needle = sourceLines.slice(span.start - 1, span.end);
      if (needle.every(line => !line.trim())) {valid = false; break;}
      const matches = [];
      for (let offset = 0; offset <= mirrorLines.length - needle.length; offset++) {
        if (mirrorLines[offset] !== needle[0]) continue;
        let same = true;
        for (let i = 1; i < needle.length; i++) if (mirrorLines[offset + i] !== needle[i]) {same = false; break;}
        if (same) matches.push(offset + 1);
        if (matches.length > 1) break;
      }
      if (matches.length !== 1) {valid = false; break;}
      projected.push({start: matches[0], end: matches[0] + needle.length - 1});
    }
    if (!valid) continue;
    final.traj_data.pred_files.push(mirror);
    final.traj_data.pred_spans[mirror] = projected;
    additions.push({source: path, mirror, original_spans: spans, projected_spans: projected,
      source_sha256: sha(sourceText), mirror_sha256: sha(mirrorText), mapping: "unique-exact-line-sequence"});
  }
  return {prediction: final, additions};
}
