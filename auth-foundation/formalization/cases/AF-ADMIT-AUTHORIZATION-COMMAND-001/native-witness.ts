import { createHash } from "node:crypto";
import { lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { validateInstantiationReceipt } from "../../../../craft/projects/domainspec-v2/impl/cli/src/conformance/receipt.js";
import { canonicalSfolJson } from "../../../../craft/projects/domainspec-v2/impl/test-derivation-engine/src/sfol/cases/index.js";
import { AUTH_SFOL_V4_SOURCE_PATHS, buildAuthSfolV4Correspondence } from "./domainspec-v4-correspondence.js";

const REPO = fileURLToPath(new URL("../../../../", import.meta.url));
const AUTH = resolve(REPO, "auth-foundation");
const CASE = "formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/native-witness.rs";
const HARNESS_SHA256 = "9e1606d53ed75e7475b1bd7542bb2978a949033599b53d646d489dcdee1cfe1a";
const RUNTIME = "implementation/current-runtime-successor-v1/command-boundary";
const BINDING = "implementation/current-runtime-successor-v1/binding.json";
const BINDING_SHA256 = "ad1f6c47bc80766e4f2d7da74ebaf06734e46adf98a19508b2b5220995ad81d1";
const RECEIPT = `${RUNTIME}/.domainspec/instantiations/auth-command-boundary.admit-authorization-command.json`;
const RUST = `${RUNTIME}/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs`;
const CARGO = `${RUNTIME}/Cargo.toml`;
const RUST_ARTIFACT = "src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs";
const TOOLCHAIN = resolve(REPO, "tools/toolchain/run");
const sha = (bytes: Buffer | string): string => createHash("sha256").update(bytes).digest("hex");
function fail(code: string, detail: string): never { throw new Error(`${code}:${detail}`); }
function exact(path: string): Buffer {
  const selected = resolve(AUTH, path);
  const before = lstatSync(selected);
  if (realpathSync(selected) !== selected || !before.isFile() || before.isSymbolicLink() ||
      before.size < 1 || before.size > 2 * 1024 * 1024) fail("AUTH_NATIVE_SOURCE", path);
  const bytes = readFileSync(selected);
  const after = lstatSync(selected);
  if (!after.isFile() || after.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino ||
      before.mtimeMs !== after.mtimeMs || bytes.length !== before.size) fail("AUTH_NATIVE_SOURCE", path);
  return bytes;
}
function fixedEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { PATH: "/usr/bin:/bin", TMPDIR: "/var/tmp", LC_ALL: "C", LANG: "C" };
  for (const key of ["HOME", "XDG_DATA_HOME", "CARGO_HOME", "RUSTUP_HOME"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
}
export function boundedProcess(file: string, args: readonly string[], cwd: string, timeoutMs: number, maxBytes: number) {
  const result = spawnSync(file, [...args], { cwd, env: fixedEnv(), encoding: "utf8", timeout: timeoutMs,
    maxBuffer: maxBytes, shell: false, windowsHide: true });
  if (result.error || result.status !== 0 || result.signal ||
      Buffer.byteLength(result.stdout ?? "") > maxBytes || Buffer.byteLength(result.stderr ?? "") > maxBytes) {
    fail("AUTH_NATIVE_PROCESS", `status=${result.status};signal=${result.signal};error=${result.error?.message ?? "none"};stdout=${String(result.stdout).slice(0, 256)};stderr=${String(result.stderr).slice(0, 256)}`);
  }
  return { status: 0 as const, stdout: result.stdout, stderr: result.stderr };
}
export function parseNativeWitnessLine(output: string, valuation: string) {
  const match = /^([01]{3})\t([01]{3})\t(Ready|Deny)\n$/.exec(output);
  if (!match || match[1] !== valuation) fail("AUTH_NATIVE_OUTPUT", `wrong/extra output for ${valuation}`);
  return { valuation: match[1], observed_flags: match[2], decision: match[3] };
}
function currentSources(): Map<string, Buffer> {
  return new Map(Object.values(AUTH_SFOL_V4_SOURCE_PATHS).map(path => [path, exact(path)]));
}

/** Eight concrete local witnesses, not a v4 admission or satisfying provider result. */
export function runAuthNativeWitness(sources: ReadonlyMap<string, Buffer> = currentSources()) {
  const before = new Map([...sources].map(([path, bytes]) => [path, Buffer.from(bytes)]));
  const correspondence = buildAuthSfolV4Correspondence(sources);
  const receiptBytes = exact(RECEIPT);
  const bindingBytes = exact(BINDING);
  if (sha(bindingBytes) !== BINDING_SHA256) fail("AUTH_NATIVE_BINDING", "current successor binding bytes changed");
  const binding = JSON.parse(bindingBytes.toString("utf8")) as Record<string, unknown>;
  const targets: unknown[] = Array.isArray(binding.targets) ? binding.targets : [];
  const matching = targets.filter((value): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && (value as Record<string, unknown>).id === "command-boundary");
  const row = matching[0];
  if (!row || matching.length !== 1 ||
      row.current_receipt_file_sha256 !== sha(receiptBytes) ||
      binding.current_target_status !== "candidate-current-cli-observable" ||
      binding.authority_effect !== "none") fail("AUTH_NATIVE_BINDING", "current successor target/ref mismatch");
  let parsed: unknown;
  try { parsed = JSON.parse(receiptBytes.toString("utf8")); }
  catch { fail("AUTH_NATIVE_RECEIPT", "receipt JSON invalid"); }
  const receipt = validateInstantiationReceipt(parsed);
  if (row.current_receipt_sha256 !== receipt.receipt_sha256 ||
      binding.historical_relationship_authority_sha256 === binding.current_relationship_authority_sha256 ||
      receipt.semantic_contract.relationship_authority_sha256 !== binding.current_relationship_authority_sha256)
    fail("AUTH_NATIVE_BINDING", "receipt identity or authority transition differs");
  if (receipt.input.project_id !== "auth-foundation-command-boundary" ||
      receipt.input.feature_id !== "auth-command-boundary" ||
      receipt.input.node_id !== "admit-authorization-command" ||
      receipt.input.kind !== "Operation" || receipt.language !== "rust" ||
      receipt.artifacts.length !== 2 || receipt.artifacts[0]?.relative_path !== RUST_ARTIFACT ||
      receipt.artifacts[1]?.relative_path !== "Cargo.toml") {
    fail("AUTH_NATIVE_RECEIPT", "current successor subject or artifact inventory differs");
  }
  const rustBytes = exact(RUST);
  if (rustBytes.length !== receipt.artifacts[0].size_bytes || sha(rustBytes) !== receipt.artifacts[0].sha256)
    fail("AUTH_NATIVE_ARTIFACT", "generated Rust differs from current successor receipt");
  const cargoBytes = exact(CARGO);
  if (cargoBytes.length !== receipt.artifacts[1].size_bytes || sha(cargoBytes) !== receipt.artifacts[1].sha256 ||
      !cargoBytes.toString("utf8").includes('edition = "2024"'))
    fail("AUTH_NATIVE_ARTIFACT", "Cargo manifest differs from current successor receipt or selected edition");
  const harnessBytes = exact(CASE);
  if (sha(harnessBytes) !== HARNESS_SHA256) fail("AUTH_NATIVE_HARNESS", "reviewed harness bytes changed");
  const owned = mkdtempSync(join(tmpdir(), "auth-native-witness-"));
  try {
    writeFileSync(join(owned, "generated.rs"), rustBytes, { flag: "wx", mode: 0o600 });
    writeFileSync(join(owned, "native-witness.rs"), harnessBytes, { flag: "wx", mode: 0o600 });
    boundedProcess(TOOLCHAIN, ["rustc", "--edition=2024", "native-witness.rs", "-o", "witness"], owned, 30_000, 64 * 1024);
    const executable = join(owned, "witness");
    const binarySize = statSync(executable).size;
    if (binarySize < 1 || binarySize > 16 * 1024 * 1024) fail("AUTH_NATIVE_BINARY", `compiled output size=${binarySize}`);
    const binarySha256 = sha(readFileSync(executable));
    const observations = correspondence.valuations.map(row => {
      const process = boundedProcess(executable, [row.valuation], owned, 2_000, 4 * 1024);
      if (process.stderr !== "") fail("AUTH_NATIVE_OUTPUT", `stderr for ${row.case_id}`);
      const observed = parseNativeWitnessLine(process.stdout, row.valuation);
      if (observed.observed_flags !== row.valuation ||
          observed.decision !== (row.expected_boolean ? "Ready" : "Deny"))
        fail("AUTH_NATIVE_CONTRADICTION", row.case_id);
      return { case_id: row.case_id, case_digest: row.case_digest,
        fixture_digest: row.fixture_digest, valuation: row.valuation,
        expected_digest: row.expected_digest, observed_flags: observed.observed_flags,
        observed_decision: observed.decision, process_exit_code: process.status,
        stdout_sha256: sha(process.stdout), stderr_sha256: sha(process.stderr) };
    });
    if (sources.size !== before.size || [...before].some(([path, bytes]) => !sources.get(path)?.equals(bytes)))
      fail("AUTH_NATIVE_SOURCE_MUTATED", "selected correspondence sources changed during run");
    if (!exact(RECEIPT).equals(receiptBytes) || !exact(BINDING).equals(bindingBytes) ||
        !exact(RUST).equals(rustBytes) || !exact(CARGO).equals(cargoBytes) || !exact(CASE).equals(harnessBytes))
      fail("AUTH_NATIVE_SOURCE_MUTATED", "receipt, generated Rust or harness changed during run");
    const body = {
      schema_version: "auth-foundation.native-sfol-witness/v1-candidate" as const,
      correspondence_sha256: correspondence.report_sha256,
      successor_binding: { path: BINDING, sha256: BINDING_SHA256, size_bytes: bindingBytes.length,
        historical_relationship_authority_sha256: binding.historical_relationship_authority_sha256,
        current_relationship_authority_sha256: binding.current_relationship_authority_sha256 },
      current_successor_receipt: { path: RECEIPT, sha256: sha(receiptBytes), size_bytes: receiptBytes.length,
        receipt_sha256: receipt.receipt_sha256, full_current_cli_receipt_validation: "match" as const },
      generated_rust: { path: RUST, sha256: sha(rustBytes), size_bytes: rustBytes.length },
      cargo_manifest: { path: CARGO, sha256: sha(cargoBytes), size_bytes: cargoBytes.length },
      harness: { path: CASE, sha256: HARNESS_SHA256, size_bytes: harnessBytes.length },
      compilation: { exit_code: 0 as const, binary_size_bytes: binarySize, binary_sha256: binarySha256 }, observations,
      historical_build_digest: correspondence.proof_context.historical_build_sha256,
      historical_build_currentness: correspondence.proof_context.build_currentness,
      status: "candidate-local-witness-agreement" as const, neutral_set_eligible: false as const,
      can_satisfy_obligation: false as const, evf_pass_emitted: false as const,
      authority_effect: "none" as const,
      claim_ceiling: "Eight concrete local Auth witnesses agree with their Boolean valuations and operation results; no all-context preservation, v4 admission, independent provider, EVF pass or F5 satisfaction" as const,
    };
    return { ...body, report_sha256: sha(canonicalSfolJson(body)) };
  } finally { rmSync(owned, { recursive: true, force: true }); }
}

export function replayAuthNativeWitness(held: ReturnType<typeof runAuthNativeWitness>,
  sources: ReadonlyMap<string, Buffer> = currentSources()): ReturnType<typeof runAuthNativeWitness> {
  const current = runAuthNativeWitness(sources);
  if (canonicalSfolJson(current) !== canonicalSfolJson(held)) fail("AUTH_NATIVE_REPLAY", "held witness report differs from re-execution");
  return current;
}
