#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const DIGEST = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const CONTROL_FILES = new Set(["candidate.json", "SHA256SUMS", "verify-release-candidate.mjs"]);

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalValue(value));
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function exactKeys(value, keys) {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && canonicalJson(Object.keys(value).sort()) === canonicalJson([...keys].sort());
}

function safeRelative(value) {
  return typeof value === "string"
    && value.length > 0
    && !path.isAbsolute(value)
    && value === value.split(path.sep).join("/")
    && value.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

function compareRows(left, right) {
  return left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
}

function compareNames(left, right) {
  return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function walk(root) {
  const rows = [];
  let safe = true;
  function visit(relative) {
    const directory = path.join(root, relative);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort(compareNames)) {
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      const absolute = path.join(root, child);
      if (entry.isSymbolicLink()) {
        safe = false;
        rows.push({ path: `${child}#symlink`, size_bytes: 0, sha256: "" });
      } else if (entry.isDirectory()) {
        visit(child);
      } else if (entry.isFile()) {
        const bytes = fs.readFileSync(absolute);
        rows.push({ path: child, size_bytes: bytes.length, sha256: sha256(bytes) });
      } else {
        safe = false;
        rows.push({ path: `${child}#special`, size_bytes: 0, sha256: "" });
      }
    }
  }
  visit("");
  return { rows, safe };
}

function tarText(bytes, start, length) {
  const end = bytes.indexOf(0, start);
  return bytes.subarray(start, end < 0 || end > start + length ? start + length : end).toString("utf8");
}

export function tarInventory(tarball) {
  const archive = zlib.gunzipSync(tarball);
  const rows = [];
  let offset = 0;
  let nextPath = null;
  let safe = true;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) break;
    const sizeText = tarText(header, 124, 12).trim();
    const size = Number.parseInt(sizeText || "0", 8);
    if (!Number.isSafeInteger(size) || size < 0) return { rows, safe: false };
    const name = tarText(header, 0, 100);
    const prefix = tarText(header, 345, 155);
    const headerPath = prefix ? `${prefix}/${name}` : name;
    const type = String.fromCharCode(header[156] || 48);
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (dataEnd > archive.length) return { rows, safe: false };
    const data = archive.subarray(dataStart, dataEnd);
    if (type === "x" || type === "g") {
      for (const line of data.toString("utf8").split("\n")) {
        const match = line.match(/^\d+ ([^=]+)=(.*)$/);
        if (match?.[1] === "path" && type === "x") nextPath = match[2];
      }
    } else if (type === "L") {
      nextPath = data.toString("utf8").replace(/\0+$/, "");
    } else if (type === "0" || type === "\0") {
      const relative = nextPath ?? headerPath;
      nextPath = null;
      if (!safeRelative(relative)) safe = false;
      rows.push({ path: relative, size_bytes: size, sha256: sha256(data) });
    } else if (type === "5") {
      nextPath = null;
    } else {
      safe = false;
      nextPath = null;
    }
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  const paths = rows.map(({ path: relative }) => relative);
  safe = safe && new Set(paths).size === paths.length;
  return { rows: rows.sort(compareRows), safe };
}

function manifestDigest(candidate) {
  const body = { ...candidate };
  delete body.manifest_sha256;
  return sha256(canonicalJson(body));
}

function inventoryDigest(inventory) {
  const body = { ...inventory };
  delete body.inventory_sha256;
  return sha256(canonicalJson(body));
}

function parseChecksums(text) {
  const rows = [];
  let valid = text.endsWith("\n");
  for (const line of text.trimEnd().split("\n")) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match || !safeRelative(match[2])) {
      valid = false;
      continue;
    }
    rows.push({ path: match[2], sha256: match[1] });
  }
  const paths = rows.map(({ path: relative }) => relative);
  valid = valid && new Set(paths).size === paths.length && canonicalJson(paths) === canonicalJson([...paths].sort());
  return { rows, valid };
}

function check(checks, id, predicate, detail = null) {
  checks.push(Object.freeze({ id, result: predicate ? "pass" : "fail", detail }));
}

export function verifyReleaseCandidate(bundleRoot, expectedSourceCommit = null) {
  const root = path.resolve(bundleRoot);
  const checks = [];
  let rootSafe = false;
  try {
    const stats = fs.lstatSync(root);
    rootSafe = stats.isDirectory() && !stats.isSymbolicLink() && fs.realpathSync(root) === root;
  } catch { /* reported below */ }
  check(checks, "bundle-root-real-directory", rootSafe);
  if (!rootSafe) return Object.freeze({ schema_version: "domainspec.release-candidate-verification/v1", result: "fail", checks, candidate_id: null, source_commit: null, package_sha256: null, authority_effect: "none" });

  const observed = walk(root);
  check(checks, "bundle-files-regular", observed.safe);
  const observedByPath = new Map(observed.rows.map((row) => [row.path, row]));
  const requiredControls = [...CONTROL_FILES].every((relative) => observedByPath.has(relative));
  check(checks, "control-files-present", requiredControls);

  const checksumText = observedByPath.has("SHA256SUMS") ? fs.readFileSync(path.join(root, "SHA256SUMS"), "utf8") : "";
  const checksumManifest = parseChecksums(checksumText);
  check(checks, "checksum-manifest-shape", checksumManifest.valid);
  const expectedChecksumPaths = observed.rows.map(({ path: relative }) => relative).filter((relative) => relative !== "SHA256SUMS").sort();
  check(checks, "checksum-file-set-exact", canonicalJson(checksumManifest.rows.map(({ path: relative }) => relative)) === canonicalJson(expectedChecksumPaths));
  const checksumsCurrent = checksumManifest.rows.every(({ path: relative, sha256: digest }) => observedByPath.get(relative)?.sha256 === digest);
  check(checks, "checksums-current", checksumsCurrent);

  const candidate = readJson(path.join(root, "candidate.json"));
  const candidateShape = exactKeys(candidate, ["schema_version", "candidate_id", "source", "package", "qualification", "artifacts", "claim_ceiling", "authority_effect", "manifest_sha256"]);
  check(checks, "candidate-shape-closed", candidateShape);
  check(checks, "candidate-schema", candidate?.schema_version === "domainspec.release-candidate-manifest/v1");
  check(checks, "candidate-self-digest", typeof candidate?.manifest_sha256 === "string" && candidate.manifest_sha256 === manifestDigest(candidate));
  check(checks, "candidate-authority-ceiling", candidate?.authority_effect === "none" && canonicalJson(candidate?.claim_ceiling) === canonicalJson({ release_candidate_evidence: true, publisher_identity: false, publication: false, release: false, deployment: false, production: false }));
  const sourceCommit = candidate?.source?.commit_sha;
  check(checks, "source-binding-shape", exactKeys(candidate?.source, ["repository", "commit_sha", "tree_state"]) && COMMIT.test(sourceCommit ?? "") && candidate.source.tree_state === "clean");
  check(checks, "expected-source-commit", expectedSourceCommit === null || sourceCommit === expectedSourceCommit, expectedSourceCommit);
  check(checks, "candidate-id-source-bound", typeof candidate?.candidate_id === "string" && candidate.candidate_id === `domainspec-v2-cli-1.0.0-${String(sourceCommit).slice(0, 12)}`);

  const payloadRows = observed.rows.filter(({ path: relative }) => !CONTROL_FILES.has(relative) && relative !== "SHA256SUMS");
  const candidateArtifacts = Array.isArray(candidate?.artifacts) ? candidate.artifacts : [];
  check(checks, "artifact-set-exact", canonicalJson(candidateArtifacts) === canonicalJson(payloadRows));

  const packageRelative = "package/domainspec-v2-cli-1.0.0.tgz";
  const packageRow = observedByPath.get(packageRelative);
  const packageBinding = candidate?.package;
  check(checks, "package-binding-shape", exactKeys(packageBinding, ["name", "version", "filename", "sha256", "size_bytes", "inventory_sha256", "node_version", "npm_version"]));
  check(checks, "package-subject-current", packageRow !== undefined
    && packageBinding?.name === "@domainspec-v2/cli"
    && packageBinding?.version === "1.0.0"
    && packageBinding?.filename === "domainspec-v2-cli-1.0.0.tgz"
    && packageBinding?.sha256 === packageRow.sha256
    && packageBinding?.size_bytes === packageRow.size_bytes
    && packageBinding?.node_version === "26.8.1"
    && packageBinding?.npm_version === "11.19.0");

  const packageInventory = readJson(path.join(root, "evidence", "package-inventory.json"));
  check(checks, "package-inventory-shape", exactKeys(packageInventory, ["schema_version", "package", "files", "inventory_sha256"]));
  check(checks, "package-inventory-self-digest", packageInventory?.inventory_sha256 === inventoryDigest(packageInventory));
  check(checks, "package-inventory-subject", packageInventory?.schema_version === "domainspec.release-package-inventory/v1"
    && packageInventory?.package?.sha256 === packageRow?.sha256
    && packageInventory?.inventory_sha256 === packageBinding?.inventory_sha256
    && Array.isArray(packageInventory?.files)
    && packageInventory.files.length > 0);
  let observedPackageInventory = { rows: [], safe: false };
  try { if (packageRow !== undefined) observedPackageInventory = tarInventory(fs.readFileSync(path.join(root, packageRelative))); } catch { /* reported below */ }
  check(checks, "package-archive-regular-files", observedPackageInventory.safe);
  const declaredPackageFiles = Array.isArray(packageInventory?.files) ? [...packageInventory.files].sort(compareRows) : [];
  check(checks, "package-inventory-observed", canonicalJson(declaredPackageFiles) === canonicalJson(observedPackageInventory.rows));

  const sbom = readJson(path.join(root, "evidence", "sbom.spdx.json"));
  const sbomPackage = Array.isArray(sbom?.packages) ? sbom.packages[0] : null;
  check(checks, "sbom-subject-current", sbom?.spdxVersion === "SPDX-2.3"
    && sbomPackage?.name === "@domainspec-v2/cli"
    && sbomPackage?.versionInfo === "1.0.0"
    && sbomPackage?.packageFileName === packageBinding?.filename
    && sbomPackage?.checksums?.some?.((item) => item.algorithm === "SHA256" && item.checksumValue === packageRow?.sha256));

  const provenance = readJson(path.join(root, "evidence", "provenance.intoto.json"));
  const provenanceSubject = Array.isArray(provenance?.subject) ? provenance.subject[0] : null;
  const resolvedDependencies = provenance?.predicate?.buildDefinition?.resolvedDependencies;
  check(checks, "provenance-subject-current", provenance?._type === "https://in-toto.io/Statement/v1"
    && provenance?.predicateType === "https://slsa.dev/provenance/v1"
    && provenanceSubject?.name === packageBinding?.filename
    && provenanceSubject?.digest?.sha256 === packageRow?.sha256);
  check(checks, "provenance-source-current", Array.isArray(resolvedDependencies)
    && resolvedDependencies.some((dependency) => dependency?.digest?.gitCommit === sourceCommit)
    && provenance?.predicate?.runDetails?.metadata?.sourceTree === "clean");

  const leftCertificate = readJson(path.join(root, "qualification", "run-1", "qualification-certificate.json"));
  const rightCertificate = readJson(path.join(root, "qualification", "run-2", "qualification-certificate.json"));
  const equivalence = readJson(path.join(root, "qualification", "equivalence.json"));
  const certificateDigest = leftCertificate?.certificate_sha256;
  check(checks, "qualification-certificates-pass", leftCertificate?.result === "pass" && rightCertificate?.result === "pass" && DIGEST.test(certificateDigest ?? ""));
  check(checks, "qualification-certificates-equivalent", canonicalJson(leftCertificate) === canonicalJson(rightCertificate));
  check(checks, "qualification-equivalence-pass", equivalence?.schema_version === "domainspec.recipe-qualification-l1-equivalence/v1"
    && equivalence?.result === "pass"
    && equivalence?.evidence_root === "qualification"
    && equivalence?.observed?.certificate_sha256 === certificateDigest);
  const qualificationRows = payloadRows.filter(({ path: relative }) => relative.startsWith("qualification/"));
  check(checks, "qualification-binding-current", candidate?.qualification?.level === "recipe-executable-v1"
    && candidate?.qualification?.result === "pass"
    && candidate?.qualification?.certificate_sha256 === certificateDigest
    && candidate?.qualification?.evidence_inventory_sha256 === sha256(canonicalJson(qualificationRows))
    && candidate?.qualification?.normalization === "equivalence-evidence-root-relative-v1");

  const result = checks.every(({ result: checkResult }) => checkResult === "pass") ? "pass" : "fail";
  return Object.freeze({
    schema_version: "domainspec.release-candidate-verification/v1",
    result,
    checks: Object.freeze(checks),
    candidate_id: typeof candidate?.candidate_id === "string" ? candidate.candidate_id : null,
    source_commit: COMMIT.test(sourceCommit ?? "") ? sourceCommit : null,
    package_sha256: packageRow?.sha256 ?? null,
    authority_effect: "none",
  });
}

function option(name, required) {
  const index = process.argv.indexOf(name);
  if (index < 0) {
    if (required) throw new Error(`missing required option:${name}`);
    return null;
  }
  const value = process.argv[index + 1];
  if (!value) throw new Error(`missing value:${name}`);
  return value;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const bundleRoot = option("--bundle-root", true);
  if (!path.isAbsolute(bundleRoot) || path.resolve(bundleRoot) !== bundleRoot) throw new Error("--bundle-root requires one normalized absolute path");
  const expectedSourceCommit = option("--expected-source-commit", false);
  if (expectedSourceCommit !== null && !COMMIT.test(expectedSourceCommit)) throw new Error("--expected-source-commit requires one lowercase 40-character git SHA");
  const receipt = verifyReleaseCandidate(bundleRoot, expectedSourceCommit);
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  if (receipt.result !== "pass") process.exitCode = 1;
}
