#!/usr/bin/env node
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {chmodSync, copyFileSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "../../../../..");
const packageRoot = resolve(import.meta.dirname, "..");
const artifactDirectory = resolve(packageRoot, "artifacts/linux-x64");
const artifactPath = resolve(artifactDirectory, "are-module-port-governance-binding");
const manifestPath = resolve(artifactDirectory, "manifest.json");
const toolchain = resolve(repositoryRoot, "tools/toolchain/run");
const cargoManifest = resolve(packageRoot, "Cargo.toml");
const builtBinary = resolve(packageRoot, "target/release/are-module-port-governance-binding");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const sourceFiles = [
  ["implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/Cargo.toml", "9c03301a0f753cd545d1a78db922f61936fc77b8aaedf87367dc9a166c45c790"],
  ["implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/Cargo.lock", "fef2365024c7778d935b9364c1362f5853fe620958bfce5e8d74b1f0d51f31b4"],
  ["implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/src/lib.rs", "c6c96f1251fbaf3d8d75dfedea4ebe45af3a806582b8c9a0ba1d23d2ee00cee1"],
  ["implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/src/main.rs", "7d05d25975e558b35e363ea728d11e48e69b94c5f0b89bc39f7e97d0e3466574"],
  ["implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/README.md", "a528fda312eaf3e527de502fc884dc2ac6504e981bb59ba3d8276e7e20adb1ec"],
  ["rust-toolchain.toml", "d218f17bc8a7e1f8b951b4d591b960cf7933a832bd93384e4060a71f66aae411"],
];

if (process.platform !== "linux" || process.arch !== "x64") {
  throw new Error(`artifact.unsupported-build-platform:${process.platform}-${process.arch}`);
}
for (const [path, expected] of sourceFiles) {
  const observed = sha256(readFileSync(resolve(repositoryRoot, path)));
  if (observed !== expected) throw new Error(`artifact.source-digest-mismatch:${path}`);
}

const build = spawnSync(toolchain, ["cargo", "build", "--offline", "--locked", "--release", "--manifest-path", cargoManifest],
  {cwd: repositoryRoot, encoding: "utf8", timeout: 120_000, maxBuffer: 1024 * 1024});
if (build.error || build.status !== 0 || build.signal) {
  process.stderr.write(build.stderr ?? "");
  throw new Error("artifact.release-build-failed");
}

const bytes = readFileSync(builtBinary);
if (bytes.length < 4 || !bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))) {
  throw new Error("artifact.binary-format-invalid");
}
mkdirSync(artifactDirectory, {recursive: true});
const temporaryArtifact = `${artifactPath}.tmp`;
rmSync(temporaryArtifact, {force: true});
copyFileSync(builtBinary, temporaryArtifact);
chmodSync(temporaryArtifact, 0o555);
renameSync(temporaryArtifact, artifactPath);
const materialized = readFileSync(artifactPath);
const manifest = {
  schema_version: "are.module-port-packaged-verifier-artifact/v1-candidate",
  artifact_id: "ARE-MODULE-PORT-PACKAGED-VERIFIER-LINUX-X64-001-CANDIDATE",
  binding_id: "ARE-MODULE-PORT-RUST-BINDING-001-CANDIDATE",
  platform: "linux",
  architecture: "x64",
  target_triple: "x86_64-unknown-linux-gnu",
  binary_format: "elf",
  build_profile: "release",
  binary_path: "implementation/agent-reasoning-engine/packages/module-port-governance-binding-rust/artifacts/linux-x64/are-module-port-governance-binding",
  binary_sha256: sha256(materialized),
  binary_size: statSync(artifactPath).size,
  source_files: sourceFiles.map(([path, digest]) => ({path, sha256: digest})),
  runtime_compiler_required: false,
  runtime_package_manager_required: false,
  fallback_allowed: false,
  effect_authorized: false,
  authority_effect: "none",
};
const temporaryManifest = `${manifestPath}.tmp`;
writeFileSync(temporaryManifest, `${JSON.stringify(manifest, null, 2)}\n`);
renameSync(temporaryManifest, manifestPath);
process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
