import {createHash} from "node:crypto";
import {lstatSync, readFileSync, realpathSync} from "node:fs";
import {extname, isAbsolute, resolve, sep} from "node:path";

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }
function freeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); for (const child of Object.values(value)) freeze(child); return value; }
function unique(values) { return [...new Set(values)].sort(); }

function exactFile(root, path) {
  if (typeof path !== "string" || !path || isAbsolute(path) || path.split(/[\\/]/u).includes("..")) throw new Error("MAP_PATH_INVALID");
  const absolute = resolve(root, path);
  if (absolute !== root && !absolute.startsWith(`${root}${sep}`)) throw new Error("MAP_PATH_ESCAPE");
  let cursor = root;
  for (const segment of path.split(/[\\/]/u)) {
    cursor = resolve(cursor, segment);
    const status = lstatSync(cursor);
    if (status.isSymbolicLink()) throw new Error("MAP_SYMLINK_FORBIDDEN");
  }
  if (!lstatSync(absolute).isFile()) throw new Error("MAP_REGULAR_FILE_REQUIRED");
  return absolute;
}

function extract(source, path) {
  const extension = extname(path).toLowerCase();
  const imports = [];
  const exports = [];
  const symbols = [];
  if ([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"].includes(extension)) {
    for (const match of source.matchAll(/(?:import\s+(?:[^"']+?\s+from\s+)?|export\s+[^"']*?\s+from\s+|require\s*\()(["'])([^"']+)\1/gu)) imports.push(match[2]);
    for (const match of source.matchAll(/\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gu)) exports.push(match[1]);
    for (const match of source.matchAll(/\b(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gu)) symbols.push(match[1]);
  } else if (extension === ".py") {
    for (const match of source.matchAll(/^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gmu)) imports.push(match[1] ?? match[2]);
    for (const match of source.matchAll(/^\s*(?:async\s+)?(?:def|class)\s+([A-Za-z_]\w*)/gmu)) symbols.push(match[1]);
  }
  return {imports: unique(imports), exports: unique(exports), symbols: unique(symbols), test: /(^|\/)(test|tests|__tests__)(\/|$)|(?:\.test|\.spec)\.[^.]+$/u.test(path)};
}

export function buildRepositoryMap({repository_root, paths = [], maximum_files = 256, maximum_bytes = 262_144, include_extensions = null} = {}) {
  if (typeof repository_root !== "string" || !repository_root) throw new TypeError("repository_root is required.");
  if (!Array.isArray(paths) || paths.some((path) => typeof path !== "string")) throw new TypeError("paths must be an array.");
  if (!Number.isSafeInteger(maximum_files) || maximum_files < 1 || !Number.isSafeInteger(maximum_bytes) || maximum_bytes < 1024) throw new TypeError("repository map budgets are invalid.");
  const root = realpathSync(repository_root);
  const extensions = include_extensions === null ? null : new Set(include_extensions);
  const selectedPaths = unique(paths).filter((path) => extensions === null || extensions.has(extname(path).toLowerCase()));
  const included = [];
  const omitted = [];
  let sourceBytes = 0;
  for (const path of selectedPaths) {
    const absolute = exactFile(root, path);
    const bytes = readFileSync(absolute);
    if (included.length >= maximum_files || sourceBytes + bytes.length > maximum_bytes) { omitted.push({path, sha256: sha256(bytes), byte_count: bytes.length}); continue; }
    let source;
    try { source = new TextDecoder("utf-8", {fatal: true}).decode(bytes); }
    catch { omitted.push({path, sha256: sha256(bytes), byte_count: bytes.length, reason: "non-utf8"}); continue; }
    included.push({path, sha256: sha256(bytes), byte_count: bytes.length, ...extract(source, path)});
    sourceBytes += bytes.length;
  }
  const material = {schema_version: "are.coding-agent-repository-map/v1", root_digest: sha256(root), files: included, omitted_paths: omitted, selected_path_count: selectedPaths.length, included_file_count: included.length, included_source_bytes: sourceBytes, maximum_files, maximum_bytes, model_calls: 0, network_calls: 0, authority_effect: "none"};
  return freeze({...material, map_digest: sha256(stable(material))});
}
