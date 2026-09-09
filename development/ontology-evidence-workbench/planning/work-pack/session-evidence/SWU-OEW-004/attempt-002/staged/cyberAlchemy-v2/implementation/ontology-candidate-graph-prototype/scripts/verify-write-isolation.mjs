import { createHash } from "node:crypto";
import { lstat, readFile, readdir, readlink } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

export const DEFAULT_PROTECTED_SELECTORS = Object.freeze([
  "cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml",
  "cyberAlchemy-v2/ontology/canonical-kinds/ALLOWED-EDGES.yaml",
  "cyberAlchemy-v2/authority/**",
  "validation/poker-team/**",
  ".arcanum/inventory/**",
  "arcanum/**",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function digestPath(repositoryRoot, absolutePath) {
  const stat = await lstat(absolutePath);
  const path = relative(repositoryRoot, absolutePath).split("\\").join("/");
  if (stat.isSymbolicLink()) {
    const target = await readlink(absolutePath);
    return { path, kind: "symlink", sha256: sha256(target), size_bytes: target.length };
  }
  if (stat.isFile()) {
    const bytes = await readFile(absolutePath);
    return { path, kind: "file", sha256: sha256(bytes), size_bytes: bytes.length };
  }
  return null;
}

async function collectSelector(repositoryRoot, absolutePath) {
  const stat = await lstat(absolutePath);
  if (!stat.isDirectory()) return [absolutePath];
  const dirents = await readdir(absolutePath, { recursive: true, withFileTypes: true });
  return dirents
    .filter((entry) => entry.isFile() || entry.isSymbolicLink())
    .map((entry) => join(entry.parentPath, entry.name));
}

async function digestPaths(repositoryRoot, paths, concurrency = 64) {
  const entries = [];
  for (let offset = 0; offset < paths.length; offset += concurrency) {
    const batch = paths.slice(offset, offset + concurrency);
    const digests = await Promise.all(batch.map((path) => digestPath(repositoryRoot, path)));
    entries.push(...digests.filter(Boolean));
  }
  return entries;
}

export async function snapshotProtectedSet({
  repositoryRoot,
  protectedSelectors = DEFAULT_PROTECTED_SELECTORS,
}) {
  const root = resolve(repositoryRoot);
  const paths = [];
  for (const selector of [...protectedSelectors].sort()) {
    const path = selector.endsWith("/**") ? selector.slice(0, -3) : selector;
    paths.push(...(await collectSelector(root, resolve(root, path))));
  }
  const entries = await digestPaths(root, paths.sort());
  entries.sort((left, right) => left.path.localeCompare(right.path));
  const aggregate = entries
    .map(({ path, kind, sha256: digest, size_bytes: size }) =>
      [path, kind, digest, String(size)].join("\0"),
    )
    .join("\n");
  return {
    protected_set_digest: sha256(aggregate),
    protected_file_count: entries.length,
    files: entries,
  };
}

function summarizeDifference(before, after) {
  const beforeByPath = new Map(before.files.map((entry) => [entry.path, entry]));
  const afterByPath = new Map(after.files.map((entry) => [entry.path, entry]));
  const added = after.files.filter(({ path }) => !beforeByPath.has(path)).map(({ path }) => path);
  const removed = before.files.filter(({ path }) => !afterByPath.has(path)).map(({ path }) => path);
  const changed = before.files
    .filter(({ path, sha256: digest }) => afterByPath.get(path)?.sha256 !== digest)
    .map(({ path }) => path)
    .filter((path) => afterByPath.has(path));
  return { added: added.slice(0, 20), removed: removed.slice(0, 20), changed: changed.slice(0, 20) };
}

export function createDeniedWriteProbe(target) {
  return async function deniedWriteProbe() {
    const error = new Error(`write capability denied for ${target}`);
    error.code = "WRITE_CAPABILITY_DENIED";
    error.target = target;
    throw error;
  };
}

export async function verifyWriteIsolation({
  repositoryRoot,
  protectedSelectors = DEFAULT_PROTECTED_SELECTORS,
  runEvaluation,
  writeProbe,
}) {
  if (typeof runEvaluation !== "function" || typeof writeProbe !== "function") {
    throw new TypeError("runEvaluation and writeProbe capabilities are required");
  }
  const before = await snapshotProtectedSet({ repositoryRoot, protectedSelectors });
  await runEvaluation();
  let writeDenied = false;
  try {
    await writeProbe();
  } catch (error) {
    if (error?.code !== "WRITE_CAPABILITY_DENIED") throw error;
    writeDenied = true;
  }
  if (!writeDenied) {
    const error = new Error("write probe was not denied by the supplied capability");
    error.code = "WRITE_PROBE_NOT_DENIED";
    throw error;
  }
  const after = await snapshotProtectedSet({ repositoryRoot, protectedSelectors });
  if (before.protected_set_digest !== after.protected_set_digest) {
    const error = new Error("protected selector set changed during evaluation");
    error.code = "PROTECTED_SET_CHANGED";
    error.before_digest = before.protected_set_digest;
    error.after_digest = after.protected_set_digest;
    error.difference = summarizeDifference(before, after);
    throw error;
  }
  return {
    schema_version: "candidate-isolation-attestation-v1",
    protected_set_digest_before: before.protected_set_digest,
    protected_set_digest_after: after.protected_set_digest,
    protected_file_count: before.protected_file_count,
    write_probe: "denied",
    claim: "input-isolation-only",
    host_security_claim: "none",
    authority_effect: "none",
  };
}
