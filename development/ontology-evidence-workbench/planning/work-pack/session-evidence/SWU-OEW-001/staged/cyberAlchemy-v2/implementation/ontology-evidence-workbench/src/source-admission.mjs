import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { verifyTerminalReceipt } from "../../ontology-candidate-graph-prototype/scripts/verify-terminal-receipt.mjs";

const EXPECTED_FILES = Object.freeze([
  "digest-map.v1.json",
  "projection.v1.json",
  "result.v1.json",
  "terminal-receipt.json",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function contained(root, candidate) {
  const path = relative(root, candidate);
  return path !== "" && path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

function normalizedRepositoryPath(root, candidate) {
  return relative(root, candidate).split(sep).join("/");
}

export class SourceAdmissionError extends Error {
  constructor(issues) {
    const stableIssues = [...new Set(issues)].sort();
    super(`source admission rejected: ${stableIssues.join(",")}`);
    this.name = "SourceAdmissionError";
    this.code = "OEW_SOURCE_ADMISSION_REJECTED";
    this.issues = stableIssues;
  }
}

async function resolveContainedReceipt(repositoryRoot, receiptPath) {
  const issues = [];
  let root;
  try {
    root = await realpath(resolve(repositoryRoot));
  } catch (error) {
    throw new SourceAdmissionError([
      `REPOSITORY_ROOT_INVALID:${error.code ?? "UNKNOWN"}`,
    ]);
  }

  const lexicalReceipt = resolve(root, receiptPath);
  if (!contained(root, lexicalReceipt)) {
    throw new SourceAdmissionError(["PATH_ESCAPE:terminal-receipt.json"]);
  }
  if (basename(lexicalReceipt) !== "terminal-receipt.json") {
    issues.push("RECEIPT_NAME_INVALID");
  }

  let receipt;
  try {
    receipt = await realpath(lexicalReceipt);
  } catch (error) {
    issues.push(`MISSING_SOURCE:terminal-receipt.json:${error.code ?? "UNKNOWN"}`);
  }
  if (receipt && !contained(root, receipt)) {
    issues.push("PATH_ESCAPE:terminal-receipt.json");
  }
  if (issues.length > 0) throw new SourceAdmissionError(issues);
  return { root, receipt };
}

async function inspectRunFiles(root, receipt) {
  const runDirectory = dirname(receipt);
  const issues = [];
  const files = [];

  for (const name of EXPECTED_FILES) {
    const lexicalPath = resolve(runDirectory, name);
    if (!contained(runDirectory, lexicalPath)) {
      issues.push(`PATH_ESCAPE:${name}`);
      continue;
    }
    try {
      const status = await lstat(lexicalPath);
      if (!status.isFile()) issues.push(`SOURCE_NOT_REGULAR_FILE:${name}`);
      if (status.isSymbolicLink()) issues.push(`SOURCE_SYMLINK_FORBIDDEN:${name}`);
      const canonicalPath = await realpath(lexicalPath);
      if (!contained(runDirectory, canonicalPath)) issues.push(`PATH_ESCAPE:${name}`);
      if (!contained(root, canonicalPath)) issues.push(`PATH_ESCAPE:${name}`);
      const bytes = await readFile(canonicalPath);
      files.push({
        name,
        sha256: sha256(bytes),
        size_bytes: bytes.length,
      });
    } catch (error) {
      issues.push(`MISSING_SOURCE:${name}:${error.code ?? "UNKNOWN"}`);
    }
  }

  if (issues.length > 0) throw new SourceAdmissionError(issues);
  return { runDirectory, files: files.sort((left, right) => left.name.localeCompare(right.name)) };
}

export function isVerifiedRunHandle(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  if (value.schema_version !== "oew-verified-run-handle/v1") return false;
  if (value.verified !== true || value.authority_effect !== "none") return false;
  if (!/^[a-f0-9]{64}$/.test(value.receipt_sha256 ?? "")) return false;
  if (!Array.isArray(value.files) || value.files.length !== EXPECTED_FILES.length) return false;
  return value.files.every(
    (file, index) =>
      file?.name === EXPECTED_FILES[index] &&
      /^[a-f0-9]{64}$/.test(file.sha256 ?? "") &&
      Number.isInteger(file.size_bytes) &&
      file.size_bytes > 0,
  );
}

export async function admitCandidateRun(receiptPath, { repositoryRoot } = {}) {
  if (typeof receiptPath !== "string" || receiptPath.length === 0) {
    throw new SourceAdmissionError(["RECEIPT_PATH_REQUIRED"]);
  }
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    throw new SourceAdmissionError(["REPOSITORY_ROOT_REQUIRED"]);
  }

  const { root, receipt } = await resolveContainedReceipt(repositoryRoot, receiptPath);
  const inspected = await inspectRunFiles(root, receipt);
  const verification = await verifyTerminalReceipt(receipt);
  if (!verification.verified) {
    throw new SourceAdmissionError(
      verification.issues.map((issue) => `TERMINAL_VERIFIER:${issue}`),
    );
  }
  if (verification.artifact_count !== EXPECTED_FILES.length) {
    throw new SourceAdmissionError(["TERMINAL_VERIFIER:INVENTORY_MISMATCH"]);
  }

  const terminalReceipt = JSON.parse(await readFile(receipt, "utf8"));
  const handle = {
    schema_version: "oew-verified-run-handle/v1",
    verified: true,
    authority_effect: "none",
    source: {
      run_directory: normalizedRepositoryPath(root, inspected.runDirectory),
      receipt_path: normalizedRepositoryPath(root, receipt),
      task_id: terminalReceipt.task_id,
      swu_id: terminalReceipt.swu_id,
    },
    receipt_sha256: verification.receipt_sha256,
    files: inspected.files,
  };
  if (!isVerifiedRunHandle(handle)) {
    throw new SourceAdmissionError(["VERIFIED_HANDLE_INVALID"]);
  }
  return handle;
}
