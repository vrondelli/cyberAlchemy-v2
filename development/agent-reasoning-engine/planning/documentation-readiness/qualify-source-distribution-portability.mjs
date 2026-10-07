#!/usr/bin/env node

import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, relative, resolve} from "node:path";
import {pathToFileURL} from "node:url";

const repositoryRoot = resolve(import.meta.dirname, "../../../..");
const productRelative = "implementation/agent-reasoning-engine";
const defaultCandidate = resolve(repositoryRoot, productRelative, "evidence/product-candidate.020.json");
const defaultArchive = resolve(repositoryRoot, productRelative, "evidence/archives/are-0.10.0-rc.1-candidate.020.tar.gz");
const defaultLifecycleReceipt = resolve(repositoryRoot, productRelative, "docs/releases/0.10.0-rc.1-lifecycle-receipt.json");
const binaryRelative = `${productRelative}/packages/module-port-governance-binding-rust/artifacts/linux-x64/are-module-port-governance-binding`;
const verifierRelative = `${productRelative}/packages/module-port-distribution-envelope/index.mjs`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fail(code, detail = "") {
  throw new Error(detail ? `${code}:${detail}` : code);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    timeout: options.timeout ?? 120_000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) fail(`command.failed:${command}`, result.error.message);
  if (result.status !== 0 || result.signal) {
    fail(`command.nonzero:${command}`, `${result.status ?? result.signal}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  return result;
}

function walk(root, current = root, output = []) {
  for (const name of readdirSync(current).sort()) {
    const path = resolve(current, name);
    const stat = lstatSync(path);
    if (stat.isDirectory()) walk(root, path, output);
    else output.push(relative(root, path).replaceAll("\\", "/"));
  }
  return output;
}

function verifyClosure(root, candidate) {
  const expected = candidate.source_closure.files.map((entry) => entry.path).sort();
  const observed = walk(root).sort();
  if (JSON.stringify(expected) !== JSON.stringify(observed)) fail("archive.inventory-mismatch");
  for (const entry of candidate.source_closure.files) {
    const path = resolve(root, entry.path);
    const stat = lstatSync(path);
    if (entry.kind === "symlink") {
      if (!stat.isSymbolicLink()) fail("archive.symlink-mismatch", entry.path);
      continue;
    }
    if (!stat.isFile()) fail("archive.file-mismatch", entry.path);
    if (sha256(readFileSync(path)) !== entry.sha256) fail("archive.digest-mismatch", entry.path);
    if ((stat.mode & 0o777) !== entry.mode) fail("archive.mode-mismatch", entry.path);
  }
}

function parseArguments() {
  const parsed = {
    candidate: defaultCandidate,
    archive: defaultArchive,
    lifecycleReceipt: defaultLifecycleReceipt,
    output: null,
  };
  const names = new Map([
    ["--candidate", "candidate"],
    ["--archive", "archive"],
    ["--lifecycle-receipt", "lifecycleReceipt"],
    ["--output", "output"],
  ]);
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 2) {
    const key = names.get(args[index]);
    const value = args[index + 1];
    if (!key || !value || value.startsWith("--")) {
      fail("usage", "qualify-source-distribution-portability.mjs [--candidate <path>] [--archive <path>] [--lifecycle-receipt <path>] [--output <path>]");
    }
    parsed[key] = resolve(value);
  }
  return parsed;
}

const paths = parseArguments();
const temporary = mkdtempSync(resolve(tmpdir(), "are-portability-qualification-"));

try {
  const candidate = JSON.parse(readFileSync(paths.candidate, "utf8"));
  const lifecycle = JSON.parse(readFileSync(paths.lifecycleReceipt, "utf8"));
  const archiveBytes = readFileSync(paths.archive);
  if (candidate.candidate_id !== "ARE-PRODUCT-CANDIDATE-020") fail("candidate.identity-invalid");
  if (lifecycle.status !== "PASS"
    || lifecycle.candidate?.candidate_id !== candidate.candidate_id
    || lifecycle.candidate?.candidate_digest !== candidate.candidate_digest
    || lifecycle.candidate?.closure_digest !== candidate.source_closure.closure_digest) {
    fail("lifecycle.candidate-binding-invalid");
  }
  if (lifecycle.artifact?.sha256 !== sha256(archiveBytes)
    || lifecycle.artifact?.bytes !== archiveBytes.byteLength) fail("lifecycle.archive-binding-invalid");

  const packagedExtraction = resolve(temporary, "packaged-artifact");
  const checkoutExtraction = resolve(temporary, "candidate-020-named-checkout");
  mkdirSync(packagedExtraction);
  mkdirSync(checkoutExtraction);
  run("tar", ["-xzf", paths.archive, "-C", packagedExtraction]);
  run("tar", ["-xzf", paths.archive, "-C", checkoutExtraction]);
  const packagedRoot = resolve(packagedExtraction, "cyberAlchemy-v2");
  const checkoutRoot = resolve(checkoutExtraction, "cyberAlchemy-v2");
  verifyClosure(packagedExtraction, candidate);
  verifyClosure(checkoutExtraction, candidate);

  const packagedVerifier = await import(pathToFileURL(resolve(packagedRoot, verifierRelative)).href);
  const packagedBinary = resolve(packagedRoot, binaryRelative);
  chmodSync(packagedBinary, 0o555);
  const packaged = packagedVerifier.verifyDistributionEnvelope({repository_root: packagedRoot});
  if (!packaged.ok || packaged.signed_binary_mode !== "0555"
    || packaged.observed_binary_mode !== "0555"
    || packaged.binary_mode_posture !== "signed-artifact-mode-exact") fail("packaged-artifact.verification-failed", packaged.reason_codes.join(","));

  const checkoutVerifier = await import(pathToFileURL(resolve(checkoutRoot, verifierRelative)).href);
  const checkoutBinary = resolve(checkoutRoot, binaryRelative);
  const untracked = checkoutVerifier.verifyDistributionEnvelope({repository_root: checkoutRoot, verification_context: "git-checkout"});
  if (untracked.ok || !untracked.reason_codes.includes("envelope.binary-mode-policy-invalid")) fail("git-checkout.untracked-did-not-fail-closed");

  run("git", ["init", "-q", "-b", "portability-candidate-020", checkoutRoot]);
  run("git", ["-C", checkoutRoot, "add", "--", binaryRelative]);
  const checkout = checkoutVerifier.verifyDistributionEnvelope({repository_root: checkoutRoot, verification_context: "git-checkout"});
  if (!checkout.ok || checkout.signed_binary_mode !== "0555"
    || checkout.observed_binary_mode !== "0755"
    || checkout.binary_mode_posture !== "git-executable-bit-materialization") fail("git-checkout.verification-failed", checkout.reason_codes.join(","));

  chmodSync(checkoutBinary, 0o775);
  const hostileMode = checkoutVerifier.verifyDistributionEnvelope({repository_root: checkoutRoot, verification_context: "git-checkout"});
  if (hostileMode.ok || !hostileMode.reason_codes.includes("envelope.binary-mode-policy-invalid")) fail("git-checkout.hostile-mode-did-not-fail-closed");
  chmodSync(checkoutBinary, 0o755);

  const originalBinary = readFileSync(checkoutBinary);
  writeFileSync(checkoutBinary, Buffer.concat([originalBinary, Buffer.from([0])]));
  const alteredBytes = checkoutVerifier.verifyDistributionEnvelope({repository_root: checkoutRoot, verification_context: "git-checkout"});
  if (alteredBytes.ok || alteredBytes.reason_codes.length === 0) fail("git-checkout.altered-bytes-did-not-fail-closed");

  const receipt = {
    schema_version: "are.portability-qualification/v1",
    status: "PASS",
    source_closure_digest: candidate.source_closure.closure_digest,
    packaged_artifact_mode: "0555-exact",
    git_checkout_context: "separate-named-fail-closed",
    reason_codes: [],
    claim_limit: "PASS proves Candidate 020's retained local archive in two disposable Linux x64 contexts: exact signed 0555 packaged-artifact verification and separately named Git-checkout 0755 normalization with untracked, hostile-mode, and altered-byte failures. It is not cross-platform proof, product approval, signing authority, publication, installation, deployment, or an external effect.",
    authority_effect: "none",
  };
  const encoded = `${JSON.stringify(receipt, null, 2)}\n`;
  if (paths.output) {
    mkdirSync(dirname(paths.output), {recursive: true});
    writeFileSync(paths.output, encoded);
  }
  process.stdout.write(encoded);
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
