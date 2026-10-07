#!/usr/bin/env node
/** Replay the unchanged v2 derivation in its former directory shape.
 * This is archival verification, not a current F5/provider qualification. */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statfsSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const caseRoot = dirname(fileURLToPath(import.meta.url));
const authRoot = resolve(caseRoot, "../../..");
const repositoryRoot = resolve(authRoot, "..");
const relativeCase = "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001";
const historicalFiles = {
  "derive-tests.ts": "58b86dcfa74af951c74c9d29ad6848e7ef0b3c290778d9c2fadc5e614adb8689",
  "TDE-BINDINGS.v2.json": "96ca6a95b769d5f8db806f27dffcbc2460551b8d159fdd293b64de5e2d95ae1a",
  "TDE-CASES.v2.json": "5216d84f3e63fae3cf37bc0759dca2dd3aced25c9adc25905a47e875d8b2440a",
  "TDE-EVALUATIONS.v2.json": "bdb83e82c665b2fbb5716cdfcb6dfd15972a251536da47184b21ebf773766cf7",
  "TDE-EVIDENCE.v2.json": "55a1d01184dde2d4a0ba53c9f90385919ee7f8c4ebd2fcb98ae36c97917151a2",
  "TDE-MUTATION-EVIDENCE.v2.json": "bf9e1fd5ff1438fdbdff7310058bd04a9806067222bf32bd4fefc2966a838ef7",
  "TDE-OBSERVATIONS.v2.json": "1484b1a6995c155a685b63af3b898124187d8cb339093edd69ab61db8dbaa1f7",
  "TDE-PROOF-RECEIPT.v2.json": "ef8182f93e33158ec989bc216bf102c07b98e5c42bf3f5e86ca7489de9dbea7f",
  "W7-PREIMAGE-MANIFEST.v2.json": "bffbe95984018d2dce5ef8ccc527e99ef9171de0577e29a13e9d995b17d8146f",
  "SFOL-CLAUSE-ADMISSION-MANIFEST.v1.json": "f3a8c7ca8598d3eccaef749df376537c7c902c5f42bc8101694dcffdf06a5431",
};
export const RUST_CRATE_FILES = [
  "implementation/sfol-conformance/Cargo.toml",
  "implementation/sfol-conformance/Cargo.lock",
  "implementation/sfol-conformance/src/main.rs",
  "implementation/sfol-conformance/tests/derived.rs",
  "implementation/command-boundary-runtime/Cargo.toml",
  "implementation/command-boundary-runtime/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs",
  "implementation/command-boundary-runtime/.domainspec/instantiations/auth-command-boundary.admit-authorization-command.json",
];
const cargoLockSha256 = "c3f245dd9e2ca5ab018522340714e2fb06480440889a324b685e3e0a19cb6110";

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

function regularBytes(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 1 || stat.size > 2 * 1024 * 1024)
    throw new Error(`HISTORICAL_V2_SOURCE_INVALID:${path}`);
  return readFileSync(path);
}

export function verifyPinnedHistoricalFile(name, bytes) {
  const digest = historicalFiles[name];
  if (!digest || sha256(bytes) !== digest) throw new Error(`HISTORICAL_V2_BYTES_DRIFT:${name}`);
}

function requireHistoricalFiles() {
  for (const name of Object.keys(historicalFiles)) {
    verifyPinnedHistoricalFile(name, regularBytes(join(caseRoot, name)));
  }
}

function copySelected(sourceRoot, destinationRoot, relativePath) {
  if (relativePath.startsWith("/") || relativePath.split("/").some(part => !part || part === "." || part === ".."))
    throw new Error(`HISTORICAL_V2_PATH_INVALID:${relativePath}`);
  const source = join(sourceRoot, relativePath), target = join(destinationRoot, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  if (sha256(regularBytes(source)) !== sha256(regularBytes(target)))
    throw new Error(`HISTORICAL_V2_COPY_DRIFT:${relativePath}`);
}

export function stageRustCrates(sourceRoot, destinationRoot) {
  for (const path of RUST_CRATE_FILES) copySelected(sourceRoot, destinationRoot, path);
}

function temporaryBase() {
  for (const path of [tmpdir(), "/var/tmp"]) {
    if (!existsSync(path)) continue;
    const stat = statfsSync(path);
    if (stat.bavail * stat.bsize >= 256 * 1024 * 1024) return path;
  }
  throw new Error("HISTORICAL_V2_TEMP_SPACE_UNAVAILABLE");
}

export function replayHistoricalV2() {
  requireHistoricalFiles();
  const manifestPath = join(caseRoot, "W7-PREIMAGE-MANIFEST.v2.json");
  const manifest = JSON.parse(regularBytes(manifestPath).toString("utf8"));
  const manifestEntries = [...manifest.immutable_predecessors, ...manifest.selected_implementation_dependencies];
  if (sha256(regularBytes(join(authRoot, "implementation/sfol-conformance/Cargo.lock"))) !== cargoLockSha256)
    throw new Error("HISTORICAL_V2_CARGO_LOCK_DRIFT");
  for (const entry of manifestEntries) {
    if (sha256(regularBytes(join(authRoot, entry.path))) !== entry.sha256)
      throw new Error(`HISTORICAL_V2_PREIMAGE_DRIFT:${entry.path}`);
  }
  const temp = mkdtempSync(join(temporaryBase(), "auth-sfol-historical-v2-"));
  try {
    const stagedAuth = join(temp, "projects/auth-foundation");
    mkdirSync(stagedAuth, { recursive: true });
    stageRustCrates(authRoot, stagedAuth);
    for (const entry of manifestEntries) copySelected(authRoot, stagedAuth, entry.path);
    for (const name of Object.keys(historicalFiles))
      copySelected(authRoot, stagedAuth, `${relativeCase}/${name}`);
    copySelected(repositoryRoot, temp, "rust-toolchain.toml");
    symlinkSync(join(repositoryRoot, "craft/projects/domainspec-v2"), join(temp, "projects/domainspec-v2"), "dir");
    const script = join(stagedAuth, relativeCase, "derive-tests.ts");
    const tsx = join(repositoryRoot, "craft/projects/domainspec-v2/impl/test-derivation-engine/node_modules/tsx/dist/cli.mjs");
    const toolchain = join(repositoryRoot, "tools/toolchain/run");
    if (!existsSync(tsx)) throw new Error("HISTORICAL_V2_TSX_UNAVAILABLE");
    const result = spawnSync(toolchain, [process.execPath, tsx, script, "--check"], {
      cwd: join(repositoryRoot, "craft/projects/domainspec-v2/impl/test-derivation-engine"),
      env: { ...process.env, CARGO_NET_OFFLINE: "true", CARGO_TARGET_DIR: join(temp, "target") },
      encoding: "utf8", timeout: 120_000, maxBuffer: 2 * 1024 * 1024,
    });
    if (result.error || result.status !== 0)
      throw new Error(`HISTORICAL_V2_REPLAY_FAILED:${result.error?.message ?? result.stderr?.slice(-3000) ?? result.status}`);
    const derived = JSON.parse(result.stdout.trim());
    if (derived.result !== "pass" || derived.cases !== 8 ||
        derived.evidence_sha256 !== historicalFiles["TDE-EVIDENCE.v2.json"])
      throw new Error("HISTORICAL_V2_REPLAY_RESULT_MISMATCH");
    requireHistoricalFiles();
    return { result: "pass", case_count: 8, historical_v2_bytes: "unchanged",
      evidence_sha256: derived.evidence_sha256,
      claim_ceiling: "archival local SFOL-to-Rust replay only; no current DomainSpec v4 neutral set, F5 satisfaction or production runtime guarantee" };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (process.argv.length !== 2) {
    process.stderr.write("usage: node replay-historical-v2.mjs\n");
    process.exitCode = 2;
  } else {
    try { process.stdout.write(`${JSON.stringify(replayHistoricalV2(), null, 2)}\n`); }
    catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    }
  }
}
