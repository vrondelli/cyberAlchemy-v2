#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

function fail(message) {
  process.stderr.write(`git-capture: ${message}\n`);
  process.exit(1);
}

function findRepositoryRoot(startPath) {
  let candidate = path.resolve(startPath);
  while (true) {
    if (existsSync(path.join(candidate, ".git"))) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) fail(`cannot locate repository root from ${startPath}`);
    candidate = parent;
  }
}

function parseArguments(argv) {
  const result = {
    capturedAt: null,
    outputRoot: "cyberAlchemy-v2/inventory/domainspec-v2/snapshot-inputs",
    sourceRoot: "projects/domainspec-v2",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--captured-at") result.capturedAt = argv[++index];
    else if (value === "--source-root") result.sourceRoot = argv[++index];
    else if (value === "--output-root") result.outputRoot = argv[++index];
    else fail(`unknown argument: ${value}`);
  }
  if (!result.capturedAt || Number.isNaN(Date.parse(result.capturedAt))) {
    fail("--captured-at must be an explicit ISO-8601 timestamp");
  }
  return result;
}

function runGit(repoRoot, args) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "buffer",
      maxBuffer: 128 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim();
    fail(`git ${args[0]} failed${detail ? `: ${detail}` : ""}`);
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function writeAtomic(targetPath, bytes) {
  mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.tmp`;
  try {
    writeFileSync(temporaryPath, bytes);
    renameSync(temporaryPath, targetPath);
  } finally {
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
  }
}

const options = parseArguments(process.argv.slice(2));
const repoRoot = findRepositoryRoot(process.cwd());
const outputRoot = path.join(repoRoot, options.outputRoot);
const gitFiles = runGit(repoRoot, [
  "ls-files",
  "-c",
  "-o",
  "--exclude-standard",
  "-z",
  "--",
  options.sourceRoot,
]);
const gitStatus = runGit(repoRoot, [
  "status",
  "--porcelain=v1",
  "-z",
  "--untracked-files=all",
  "--",
  options.sourceRoot,
]);
const gitVersion = runGit(repoRoot, ["--version"]).toString("utf8").trim();
const head = runGit(repoRoot, ["rev-parse", "HEAD"]).toString("utf8").trim();
const metadata = {
  schema_version: "domainspec-v2.git-snapshot-inputs/v1",
  captured_at: options.capturedAt,
  source_root: options.sourceRoot,
  repository_head: head,
  git_version: gitVersion,
  commands: [
    `git ls-files -c -o --exclude-standard -z -- ${options.sourceRoot}`,
    `git status --porcelain=v1 -z --untracked-files=all -- ${options.sourceRoot}`,
  ],
  git_files_sha256: sha256(gitFiles),
  git_status_sha256: sha256(gitStatus),
};

writeAtomic(path.join(outputRoot, "git-files.nul"), gitFiles);
writeAtomic(path.join(outputRoot, "git-status.nul"), gitStatus);
writeAtomic(path.join(outputRoot, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`);

const persistedMetadata = JSON.parse(readFileSync(path.join(outputRoot, "metadata.json"), "utf8"));
if (persistedMetadata.git_files_sha256 !== sha256(readFileSync(path.join(outputRoot, "git-files.nul")))) {
  fail("persisted git-files.nul digest mismatch");
}
if (persistedMetadata.git_status_sha256 !== sha256(readFileSync(path.join(outputRoot, "git-status.nul")))) {
  fail("persisted git-status.nul digest mismatch");
}

process.stdout.write(
  `captured: ${gitFiles.length} git-file bytes, ${gitStatus.length} git-status bytes, ${head}\n`,
);
