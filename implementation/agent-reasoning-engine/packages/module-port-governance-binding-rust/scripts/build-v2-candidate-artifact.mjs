#!/usr/bin/env node
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {constants, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {resolve, sep} from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "../../../../..");
const packageRoot = resolve(import.meta.dirname, "..");
const artifactDirectory = resolve(packageRoot, "artifacts/linux-x64-v2-candidate");
const artifactPath = resolve(artifactDirectory, "are-module-port-v2-candidate");
const manifestPath = resolve(artifactDirectory, "manifest.json");
const toolchain = resolve(repositoryRoot, "tools/toolchain/run");
const cargoManifest = resolve(packageRoot, "Cargo.toml");
const builtBinary = resolve(packageRoot, "target/release/are-module-port-v2-candidate");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function regularBytes(relative) {
  let current = repositoryRoot;
  for (const part of relative.split("/")) {
    if (!part || part === "." || part === ".." || part.includes(sep)) throw new Error("artifact.source-path-invalid");
    current = resolve(current, part);
    if (lstatSync(current).isSymbolicLink()) throw new Error(`artifact.source-symlink:${relative}`);
  }
  if (!lstatSync(current).isFile()) throw new Error(`artifact.source-not-regular:${relative}`);
  return readFileSync(current);
}

// These are compile inputs, not a claim that this candidate has been admitted.
const sourceFiles = [
  ["implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/Cargo.toml", "9c03301a0f753cd545d1a78db922f61936fc77b8aaedf87367dc9a166c45c790"],
  ["implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/Cargo.lock", "fef2365024c7778d935b9364c1362f5853fe620958bfce5e8d74b1f0d51f31b4"],
  ["implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/src/bin/are-module-port-v2-candidate.rs", "5bdfbaa90e2b973c2a00ec63d9a66db824a95412829aefb6176a4175cd7b2ccd"],
  ["implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/src/lib.rs", "c6c96f1251fbaf3d8d75dfedea4ebe45af3a806582b8c9a0ba1d23d2ee00cee1"],
  ["implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/src/main.rs", "7d05d25975e558b35e363ea728d11e48e69b94c5f0b89bc39f7e97d0e3466574"],
  ["rust-toolchain.toml", "d218f17bc8a7e1f8b951b4d591b960cf7933a832bd93384e4060a71f66aae411"],
  ["tools/toolchain/lock.json", "2bfab72c891817e3fa381562f170dcad5ab7311c52c0cb7ad57fb1074d1c4fae"],
];

if (process.platform !== "linux" || process.arch !== "x64") {
  throw new Error(`artifact.unsupported-build-platform:${process.platform}-${process.arch}`);
}
for (const name of ["CARGO_BUILD_TARGET", "RUSTFLAGS", "CARGO_ENCODED_RUSTFLAGS", "RUSTC_WRAPPER", "RUSTC_WORKSPACE_WRAPPER"]) {
  if (process.env[name]) throw new Error(`artifact.uncontrolled-build-environment:${name}`);
}
const version = spawnSync(toolchain, ["rustc", "-vV"],
  {cwd: repositoryRoot, encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024});
if (version.error || version.status !== 0 || !/^host: x86_64-unknown-linux-gnu$/mu.test(version.stdout)) {
  throw new Error("artifact.compiler-target-mismatch");
}
for (const [path, expected] of sourceFiles) {
  if (sha256(regularBytes(path)) !== expected) {
    throw new Error(`artifact.source-digest-mismatch:${path}`);
  }
}

const build = spawnSync(toolchain, ["cargo", "build", "--offline", "--locked", "--release",
  "--manifest-path", cargoManifest, "--bin", "are-module-port-v2-candidate"],
{cwd: repositoryRoot, encoding: "utf8", timeout: 120_000, maxBuffer: 1024 * 1024});
if (build.error || build.status !== 0 || build.signal) {
  process.stderr.write(build.stderr ?? "");
  throw new Error("artifact.release-build-failed");
}
if (!lstatSync(builtBinary).isFile()) throw new Error("artifact.built-binary-not-regular");
const binary = readFileSync(builtBinary);
if (binary.length < 20 || !binary.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))
  || binary[4] !== 2 || binary[5] !== 1 || binary.readUInt16LE(18) !== 0x3e) {
  throw new Error("artifact.binary-format-invalid");
}
for (const path of [packageRoot, resolve(packageRoot, "artifacts")]) {
  if (lstatSync(path).isSymbolicLink()) throw new Error("artifact.directory-symlink");
}
mkdirSync(artifactDirectory, {recursive: true});
if (lstatSync(artifactDirectory).isSymbolicLink()) throw new Error("artifact.directory-symlink");
if (existsSync(artifactPath)) {
  if (!lstatSync(artifactPath).isFile() || sha256(readFileSync(artifactPath)) !== sha256(binary)) {
    throw new Error("artifact.existing-binary-differs");
  }
} else {
  copyFileSync(builtBinary, artifactPath, constants.COPYFILE_EXCL);
}
const materialized = readFileSync(artifactPath);
const manifest = {
  schema_version: "are.module-port-packaged-verifier-artifact/v2-candidate",
  artifact_id: "ARE-MODULE-PORT-PACKAGED-VERIFIER-LINUX-X64-002-CANDIDATE",
  binding_id: "ARE-MODULE-PORT-RUST-BINDING-002-CANDIDATE",
  platform: "linux",
  architecture: "x64",
  target_triple: "x86_64-unknown-linux-gnu",
  binary_format: "elf",
  build_profile: "release",
  binary_path: "implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/artifacts/linux-x64-v2-candidate/are-module-port-v2-candidate",
  binary_sha256: sha256(materialized),
  binary_size: statSync(artifactPath).size,
  source_files: sourceFiles.map(([path, digest]) => ({path, sha256: digest})),
  runtime_compiler_required: false,
  runtime_package_manager_required: false,
  fallback_allowed: false,
  runtime_admitted: false,
  binding_admitted: false,
  activation_selected: false,
  cutover_completed: false,
  enforcement_active: false,
  effect_authorized: false,
  authority_effect: "none",
};
const bytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
if (existsSync(manifestPath)) {
  if (!lstatSync(manifestPath).isFile() || !readFileSync(manifestPath).equals(bytes)) {
    throw new Error("artifact.existing-manifest-differs");
  }
} else {
  writeFileSync(manifestPath, bytes, {flag: "wx", mode: 0o444});
}
process.stdout.write(bytes);
