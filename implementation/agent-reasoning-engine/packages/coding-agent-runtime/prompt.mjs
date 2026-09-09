import {createHash} from "node:crypto";
import {lstatSync, readFileSync, realpathSync} from "node:fs";
import {isAbsolute, resolve, sep} from "node:path";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function resolveObservation(root, relativePath) {
  if (typeof relativePath !== "string" || relativePath.length === 0 || isAbsolute(relativePath) || relativePath.split(/[\\/]/u).includes("..")) {
    throw new Error(`OBSERVATION_PATH_INVALID:${relativePath}`);
  }
  const exactRoot = realpathSync(root);
  const absolute = resolve(exactRoot, relativePath);
  if (absolute !== exactRoot && !absolute.startsWith(`${exactRoot}${sep}`)) throw new Error(`OBSERVATION_PATH_ESCAPE:${relativePath}`);
  let current = exactRoot;
  for (const segment of relativePath.split(/[\\/]/u)) {
    current = resolve(current, segment);
    if (lstatSync(current).isSymbolicLink()) throw new Error(`OBSERVATION_SYMLINK_FORBIDDEN:${relativePath}`);
  }
  if (!lstatSync(absolute).isFile()) throw new Error(`OBSERVATION_REGULAR_FILE_REQUIRED:${relativePath}`);
  return absolute;
}

export function captureObservationContext({fixture_root, observation_allowlist, expected_snapshot, max_context_bytes = 65_536}) {
  if (!Number.isSafeInteger(max_context_bytes) || max_context_bytes < 1) throw new TypeError("max_context_bytes must be a positive safe integer.");
  const paths = [...new Set(observation_allowlist ?? [])].sort();
  if (paths.length === 0) throw new Error("OBSERVATION_ALLOWLIST_REQUIRED");
  const observations = [];
  let totalBytes = 0;
  for (const path of paths) {
    const absolute = resolveObservation(fixture_root, path);
    const bytes = readFileSync(absolute);
    totalBytes += bytes.length;
    if (totalBytes > max_context_bytes) throw new Error("OBSERVATION_CONTEXT_LIMIT_EXCEEDED");
    const observedDigest = sha256(bytes);
    if (expected_snapshot?.files?.[path] !== observedDigest) throw new Error(`OBSERVATION_SNAPSHOT_DRIFT:${path}`);
    const utf8 = bytes.toString("utf8");
    if (!Buffer.from(utf8, "utf8").equals(bytes)) throw new Error(`OBSERVATION_UTF8_REQUIRED:${path}`);
    observations.push(Object.freeze({path, sha256: observedDigest, utf8}));
  }
  return Object.freeze({observations: Object.freeze(observations), total_bytes: totalBytes});
}

export function buildCandidatePrompt({request, base_tree_sha256, mutation_allowlist, observations, capability_context = null}) {
  if (typeof request !== "string" || request.length === 0) throw new TypeError("request must be a non-empty string.");
  const contract = {
    schema_version: "are.next-action-candidate/v1",
    operation: "replace-file",
    path: "one exact path from mutation_allowlist",
    expected_base_tree_sha256: base_tree_sha256,
    expected_file_sha256: "sha256 from the matching observation",
    utf8: "complete replacement UTF-8 file content",
    rationale: "short explanation",
    authority_effect: "none"
  };
  const payload = {
    request,
    base_tree_sha256,
    mutation_allowlist: [...new Set(mutation_allowlist ?? [])].sort(),
    observations,
    capability_context
  };
  return [
    "You are proposing exactly one bounded code change. Do not execute tools or claim that a change was applied.",
    "Return exactly one JSON object and no Markdown, commentary, or code fence.",
    "The object must match this contract exactly:",
    JSON.stringify(contract, null, 2),
    "Use only the supplied observations and capability context. Capability awareness does not grant invocation or effect authority. Preserve complete file content in utf8.",
    "Request and immutable workspace snapshot:",
    JSON.stringify(payload, null, 2)
  ].join("\n\n");
}
