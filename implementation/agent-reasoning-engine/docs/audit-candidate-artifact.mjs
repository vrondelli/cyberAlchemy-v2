#!/usr/bin/env node
import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, readlinkSync, statSync, writeFileSync} from "node:fs";
import {dirname, extname, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const workspaceRoot = resolve(productRoot, "../../..");
const candidatePath = resolve(productRoot, "evidence/product-candidate.013.json");
const sourcesPath = resolve(docsRoot, "releases/candidate-013-recovery-sources.json");
const outputPath = resolve(docsRoot, "releases/candidate-013-artifact-preflight.json");
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

function need(condition, code) {
  if (!condition) throw new Error(code);
}

function exactBytesAndMode(bytes, mode, entry) {
  return bytes.length === entry.bytes && sha256(bytes) === entry.sha256 && mode === entry.mode;
}

function currentExact(entry) {
  const path = resolve(workspaceRoot, entry.path);
  if (!existsSync(path) && !lstatExists(path)) return false;
  if (entry.kind === "symlink" && (!lstatSync(path).isSymbolicLink() || readlinkSync(path) !== entry.link_target)) return false;
  return exactBytesAndMode(readFileSync(path), statSync(path).mode & 0o777, entry);
}

function lstatExists(path) {
  try { lstatSync(path); return true; } catch { return false; }
}

function gitRecovery(entry, sources) {
  const selected = sources.repositories.find(item => entry.path.startsWith(item.path_prefix));
  if (!selected) return null;
  const relative = entry.path.slice(selected.path_prefix.length);
  const repository = resolve(workspaceRoot, selected.repository_path);
  const blob = spawnSync("git", ["-C", repository, "show", `${selected.commit}:${relative}`], {encoding: null, maxBuffer: 16 * 1024 * 1024});
  if (blob.status !== 0) return null;
  const tree = spawnSync("git", ["-C", repository, "ls-tree", selected.commit, "--", relative], {encoding: "utf8"});
  if (tree.status !== 0 || !tree.stdout.trim()) return null;
  const gitMode = tree.stdout.trim().split(/\s+/u)[0];
  const mode = gitMode === "100755" ? 0o755 : gitMode === "100644" ? 0o644 : entry.mode;
  return exactBytesAndMode(blob.stdout, mode, entry) ? {repository_path: selected.repository_path, commit: selected.commit} : null;
}

function unresolvedScope(path) {
  if (path.startsWith("domainspec-core/projects/domainspec-v2/impl/cli/dist/")) return "domainspec-compiler-dist";
  if (path.startsWith("cyberAlchemy-v2/language/")) return "language-toolchain";
  return "other";
}

export function auditCandidateArtifact() {
  const candidateBytes = readFileSync(candidatePath);
  const candidate = JSON.parse(candidateBytes);
  const sourcesBytes = readFileSync(sourcesPath);
  const sources = JSON.parse(sourcesBytes);
  need(candidate.candidate_id === sources.candidate_id, "artifact-preflight.candidate-id-drift");
  need(sources.authority_effect === "none", "artifact-preflight.authority-effect-invalid");
  const classifications = {current_exact: 0, git_recovery_exact: 0, unresolved: 0};
  const recoverySources = new Map();
  const unresolved = [];
  for (const entry of candidate.source_closure.files) {
    if (currentExact(entry)) {
      classifications.current_exact += 1;
      continue;
    }
    const recovery = gitRecovery(entry, sources);
    if (recovery) {
      classifications.git_recovery_exact += 1;
      const id = `${recovery.repository_path}@${recovery.commit}`;
      recoverySources.set(id, (recoverySources.get(id) ?? 0) + 1);
      continue;
    }
    classifications.unresolved += 1;
    unresolved.push(entry.path);
  }
  const unresolvedByScope = {};
  const unresolvedByExtension = {};
  for (const path of unresolved) {
    const scope = unresolvedScope(path);
    unresolvedByScope[scope] = (unresolvedByScope[scope] ?? 0) + 1;
    const extension = extname(path) || "<none>";
    unresolvedByExtension[extension] = (unresolvedByExtension[extension] ?? 0) + 1;
  }
  const total = Object.values(classifications).reduce((sum, count) => sum + count, 0);
  need(total === candidate.source_closure.files.length, "artifact-preflight.classification-count-drift");
  const closureComposition = {
    domainspec_compiler_dist_files: candidate.source_closure.files.filter(entry => entry.path.startsWith("domainspec-core/projects/domainspec-v2/impl/cli/dist/")).length,
    domainspec_compiler_source_files: candidate.source_closure.files.filter(entry => entry.path.startsWith("domainspec-core/projects/domainspec-v2/impl/cli/src/")).length,
    frozen_typescript_tool_files: candidate.source_closure.files.filter(entry => entry.path.includes("/node_modules/@typescript/old/")).length,
  };
  return `${JSON.stringify({
    schema_version: "are.documentation-artifact-preflight/v1",
    status: classifications.unresolved === 0 ? "PASS" : "BLOCKED",
    candidate_id: candidate.candidate_id,
    candidate_digest: candidate.candidate_digest,
    source_closure_digest: candidate.source_closure.closure_digest,
    candidate_evidence_sha256: sha256(candidateBytes),
    recovery_sources_sha256: sha256(sourcesBytes),
    total_files: total,
    classifications,
    closure_composition: closureComposition,
    exact_recovery_sources: Object.fromEntries([...recoverySources.entries()].sort(([a], [b]) => a.localeCompare(b))),
    unresolved: {
      path_set_sha256: sha256(`${unresolved.sort().join("\n")}\n`),
      by_scope: Object.fromEntries(Object.entries(unresolvedByScope).sort(([a], [b]) => a.localeCompare(b))),
      by_extension: Object.fromEntries(Object.entries(unresolvedByExtension).sort(([a], [b]) => a.localeCompare(b))),
      sample_paths: unresolved.slice(0, 20),
    },
    reproducibility_assessment: closureComposition.domainspec_compiler_source_files === 0 && classifications.unresolved > 0
      ? "Candidate 013 does not contain the DomainSpec compiler sources needed to rebuild its unresolved generated dist bytes."
      : "Candidate-bound rebuild inputs require separate evaluation.",
    next_gate: classifications.unresolved === 0
      ? "Materialize the closure in a clean directory and run the isolated suite."
      : "Create a successor candidate that binds an exact packaged DomainSpec compiler artifact or its complete reproducible source and toolchain chain.",
    claim_limit: "This preflight proves only whether each frozen file is available byte-for-byte from the current workspace or selected Git commits. It does not build, test, approve, publish, install, or deploy an artifact.",
    authority_effect: "none",
  }, null, 2)}\n`;
}

function main() {
  const [mode = "--check"] = process.argv.slice(2);
  need(["--check", "--write"].includes(mode), "usage:audit-candidate-artifact [--check|--write]");
  const generated = auditCandidateArtifact();
  if (mode === "--write") writeFileSync(outputPath, generated);
  else {
    need(existsSync(outputPath), "artifact-preflight.output-missing");
    need(readFileSync(outputPath, "utf8") === generated, "artifact-preflight.output-drift");
  }
  const result = JSON.parse(generated);
  process.stdout.write(`${JSON.stringify({status: result.status, mode, classifications: result.classifications, authority_effect: "none"})}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
