#!/usr/bin/env node
import {spawnSync} from "node:child_process";
import {copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {basename, dirname, join, parse, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {materializeStandaloneDistribution} from "../../../src/distribution.mjs";
import {materializeProductClosure} from "../../../src/product.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutput = join(appRoot, "dist/ARE_Companion_0.1.0_x64-setup.exe");
const rustToolchain = "1.98.1-x86_64-pc-windows-msvc";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {encoding: "utf8", windowsHide: true, ...options});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${basename(command)} exited ${result.status ?? "without a status"}: ${result.stderr?.trim() ?? ""}`);
  return result.stdout;
}

function visualStudioEnvironment(stage) {
  const programFilesX86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
  const vswhere = join(programFilesX86, "Microsoft Visual Studio/Installer/vswhere.exe");
  const registered = existsSync(vswhere)
    ? run(vswhere, ["-products", "*", "-requires", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64", "-property", "installationPath"]).trim().split(/\r?\n/u).filter(Boolean).at(-1)
    : null;
  // Some repaired or portable VS installations retain a working toolchain
  // after their installer registration disappears. Accept only a concrete
  // local Build Tools tree; the developer shell and SDK are checked below.
  const candidates = [registered, ...["2022", "2026"].flatMap(year => [
    join(programFilesX86, "Microsoft Visual Studio", year, "BuildTools"),
    join(process.env.ProgramFiles ?? "C:\\Program Files", "Microsoft Visual Studio", year, "BuildTools"),
  ])].filter(Boolean);
  const installation = candidates.find(path => existsSync(join(path, "Common7/Tools/VsDevCmd.bat"))
    && existsSync(join(path, "VC/Tools/MSVC")));
  if (!installation) throw new Error("Microsoft C++ Build Tools are required for the Windows Tauri target.");
  const developerCommand = join(installation, "Common7/Tools/VsDevCmd.bat");
  if (!existsSync(developerCommand)) throw new Error("Visual Studio developer environment is unavailable.");
  const bootstrap = join(stage, "visual-studio-environment.cmd");
  writeFileSync(bootstrap, `@echo off\r\ncall "${developerCommand}" -arch=x64 -host_arch=x64 >nul\r\nif errorlevel 1 exit /b %errorlevel%\r\nset\r\n`);
  const listing = run(process.env.ComSpec ?? "cmd.exe", ["/d", "/c", bootstrap], {cwd: stage, maxBuffer: 16 * 1024 * 1024});
  const environment = {...process.env};
  for (const line of listing.split(/\r?\n/u)) {
    const separator = line.indexOf("=");
    if (separator > 0) environment[line.slice(0, separator)] = line.slice(separator + 1);
  }
  // Some VS developer shells initialize MSVC but leave WindowsSDKVersion as
  // "\\", omitting the SDK libraries from LIB even when an SDK is installed.
  // Bind this build process to an actual local SDK; do not change host settings.
  const libKey = Object.keys(environment).find((key) => key.toLowerCase() === "lib") ?? "LIB";
  const libPaths = (environment[libKey] ?? "").split(";").filter(Boolean);
  const includeKey = Object.keys(environment).find((key) => key.toLowerCase() === "include") ?? "INCLUDE";
  const includePaths = (environment[includeKey] ?? "").split(";").filter(Boolean);
  const sdkLibrariesPresent = libPaths.some((path) => existsSync(join(path, "kernel32.lib")));
  const sdkHeadersPresent = includePaths.some((path) => existsSync(join(path, "windows.h")));
  if (!sdkLibrariesPresent || !sdkHeadersPresent) {
    const sdkLibRoot = join(programFilesX86, "Windows Kits/10/Lib");
    const sdkIncludeRoot = join(programFilesX86, "Windows Kits/10/Include");
    const versions = existsSync(sdkLibRoot) ? readdirSync(sdkLibRoot, {withFileTypes: true})
      .filter((entry) => entry.isDirectory() && /^\d+\.\d+\.\d+\.\d+$/u.test(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => {
        const a = left.split(".").map(Number);
        const b = right.split(".").map(Number);
        for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return b[i] - a[i];
        return 0;
      }) : [];
    const sdkVersion = versions.find((version) => existsSync(join(sdkLibRoot, version, "um/x64/kernel32.lib"))
      && existsSync(join(sdkLibRoot, version, "ucrt/x64/ucrt.lib"))
      && existsSync(join(sdkIncludeRoot, version, "um/windows.h")));
    if (!sdkVersion) throw new Error("A complete Windows SDK x64 library set is required for the Windows Tauri target.");
    if (!sdkLibrariesPresent) {
      libPaths.push(join(sdkLibRoot, sdkVersion, "um/x64"), join(sdkLibRoot, sdkVersion, "ucrt/x64"));
      environment[libKey] = libPaths.join(";");
    }
    if (!sdkHeadersPresent) {
      includePaths.push(...["um", "shared", "ucrt", "winrt", "cppwinrt"].map((part) => join(sdkIncludeRoot, sdkVersion, part)));
      environment[includeKey] = includePaths.join(";");
    }
  }
  return environment;
}

function copySource(stageApp) {
  for (const file of [
    "src-tauri/Cargo.toml",
    "src-tauri/Cargo.lock",
    "src-tauri/build.rs",
    "src-tauri/tauri.conf.json",
    "src-tauri/tauri.windows.conf.json",
    "src-tauri/src/main.rs",
    "src-tauri/icons/icon.png",
    "src-tauri/capabilities/default.json",
  ]) {
    const target = join(stageApp, file);
    mkdirSync(dirname(target), {recursive: true});
    copyFileSync(join(appRoot, file), target);
  }
  cpSync(join(appRoot, "ui"), join(stageApp, "ui"), {recursive: true});

  // Windows ICO can contain a PNG image. It is generated from the same checked
  // raster mark used by Linux, so the staged build has one visual source.
  const iconPath = join(stageApp, "src-tauri/icons/icon.png");
  const png = readFileSync(iconPath);
  if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || png.readUInt32BE(16) !== 128 || png.readUInt32BE(20) !== 128) {
    throw new Error("ARE companion icon must be a 128x128 PNG.");
  }
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = 128;
  header[7] = 128;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  writeFileSync(join(stageApp, "src-tauri/icons/icon.ico"), Buffer.concat([header, png]));
}

function longestStagedFile(root) {
  let longest = root;
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop();
    for (const entry of readdirSync(directory, {withFileTypes: true})) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) pending.push(path);
      else if (path.length > longest.length) longest = path;
    }
  }
  return longest;
}

function main() {
  const args = process.argv.slice(2);
  const keepStage = args.includes("--keep-stage");
  const includeNativeOrb = args.includes("--include-native-orb");
  const stageParentIndex = args.indexOf("--stage-parent");
  if (stageParentIndex >= 0 && (!args[stageParentIndex + 1]
    || args[stageParentIndex + 1].startsWith("--")
    || args.lastIndexOf("--stage-parent") !== stageParentIndex)) {
    throw new Error("--stage-parent requires one existing directory.");
  }
  const stageParent = stageParentIndex >= 0 ? resolve(args[stageParentIndex + 1]) : tmpdir();
  const outputs = args.filter((value, index) => value !== "--keep-stage" && value !== "--include-native-orb"
    && (stageParentIndex < 0 || (index !== stageParentIndex && index !== stageParentIndex + 1)));
  if (outputs.length > 1 || (outputs[0] && !outputs[0].toLowerCase().endsWith(".exe"))) {
    throw new Error("Usage: node scripts/build-windows.mjs [output-setup.exe] [--keep-stage] [--include-native-orb] [--stage-parent <existing-directory>]");
  }
  if (process.platform !== "win32" || process.arch !== "x64") throw new Error("This builder requires native Windows x64 Node.");
  if (process.versions.node !== "26.8.1") throw new Error(`ARE requires Node 26.8.1; found ${process.versions.node}.`);
  const output = resolve(outputs[0] ?? defaultOutput);
  if (existsSync(output)) throw new Error(`Refusing to overwrite existing installer: ${output}`);
  const userProfile = process.env.USERPROFILE;
  if (!userProfile) throw new Error("USERPROFILE is required to locate the pinned Rust toolchain.");
  const toolchainBin = join(userProfile, ".rustup/toolchains", rustToolchain, "bin");
  const cargo = join(toolchainBin, "cargo.exe");
  const rustc = join(toolchainBin, "rustc.exe");
  const tauriCli = join(userProfile, ".cargo/bin/cargo-tauri.exe");
  if (![cargo, rustc, tauriCli].every(existsSync)) throw new Error("Pinned Windows Rust or Tauri CLI is unavailable.");
  if (!existsSync(stageParent)) throw new Error("Windows build staging parent is unavailable.");

  const stage = mkdtempSync(join(stageParent, "acw-"));
  let built = false;
  try {
    const stageApp = stage;
    copySource(stageApp);
    const resources = join(stageApp, "src-tauri/resources");
    mkdirSync(join(resources, "node"), {recursive: true});
    copyFileSync(process.execPath, join(resources, "node/node.exe"));
    mkdirSync(join(resources, "cross-os-development"), {recursive: true});
    copyFileSync(join(appRoot, "scripts/run-cross-os-development.mjs"),
      join(resources, "cross-os-development/run.mjs"));
    copyFileSync(join(appRoot, "scripts/cross-os-boundary.mjs"),
      join(resources, "cross-os-development/cross-os-boundary.mjs"));
    const closure = materializeStandaloneDistribution(join(resources, "are"),
      {include: ["evolution-runtime", "are-mcp-server"], development: true});
    const coreClosure = materializeProductClosure();
    const entry = join(resources, "are/cyberAlchemy-v2/implementation/agent-reasoning-engine/bin/are.mjs");
    const doctor = JSON.parse(run(process.execPath, [entry, "doctor", "--json"], {timeout: 30_000, maxBuffer: 1024 * 1024}));
    if (doctor.schema_version !== "are.product-health/v1" || doctor.status !== "PASS") {
      throw new Error(`The staged Windows ARE runtime failed its product-health check: schema=${doctor.schema_version ?? "missing"}, status=${doctor.status ?? "missing"}, reasons=${JSON.stringify(doctor.reason_codes ?? [])}.`);
    }
    if (doctor.source_closure?.closure_digest !== coreClosure.closure_digest) {
      throw new Error(`The staged Windows ARE source closure differs from the current product closure: staged=${doctor.source_closure?.closure_digest ?? "missing"}, current=${coreClosure.closure_digest}.`);
    }
    const longestResource = longestStagedFile(resources);
    if (longestResource.length >= 260) {
      throw new Error(`Windows NSIS cannot reliably open staged resource paths at or above 260 characters (${longestResource.length}: ${longestResource}). Rebuild with a shorter --stage-parent before compiling.`);
    }

    const environment = visualStudioEnvironment(stage);
    // Keep compiler temporary files beside the retained build stage. A full
    // system drive must not turn an otherwise isolated D: build into a
    // partial or misleading package; these values affect this child only.
    environment.TEMP = stage;
    environment.TMP = stage;
    environment.TMPDIR = stage;
    environment.CARGO_BUILD_JOBS = "1";
    environment.RUSTUP_TOOLCHAIN = rustToolchain;
    environment.CARGO = cargo;
    environment.RUSTC = rustc;
    const pathKey = Object.keys(environment).find((key) => key.toLowerCase() === "path") ?? "Path";
    environment[pathKey] = `${toolchainBin};${environment[pathKey] ?? ""}`;
    if (includeNativeOrb) {
      const orbSource = join(stage, "native-orb-source");
      for (const file of ["Cargo.toml", "Cargo.lock", "src/main.rs"]) {
        const target = join(orbSource, file);
        mkdirSync(dirname(target), {recursive: true});
        copyFileSync(join(appRoot, "experiments/native-orb", file), target);
      }
      const orbTarget = join(stage, "native-orb-target");
      run(cargo, ["build", "--release", "--locked", "--manifest-path", join(orbSource, "Cargo.toml"), "--target-dir", orbTarget], {
        cwd: orbSource, env: environment, stdio: "inherit",
      });
      const orbBinary = join(orbTarget, "release/are-native-orb-spike.exe");
      if (!existsSync(orbBinary)) throw new Error("The native orb build did not produce its executable.");
      const bundledOrb = join(resources, "native-orb/are-native-orb.exe");
      mkdirSync(dirname(bundledOrb), {recursive: true});
      copyFileSync(orbBinary, bundledOrb);
    }
    run(tauriCli, ["build", "--bundles", "nsis", "--ci", "--no-sign", "--runner", cargo], {
      cwd: join(stageApp, "src-tauri"), env: environment, stdio: "inherit",
    });
    const bundleDir = join(stageApp, "src-tauri/target/release/bundle/nsis");
    const installers = readdirSync(bundleDir).filter((name) => name.toLowerCase().endsWith("-setup.exe"));
    if (installers.length !== 1) throw new Error(`Expected one NSIS installer, found ${installers.length}.`);
    const outputDirectory = dirname(output);
    // Recursive mkdir can return EPERM for an existing Windows drive root.
    if (outputDirectory !== parse(output).root) mkdirSync(outputDirectory, {recursive: true});
    copyFileSync(join(bundleDir, installers[0]), output);
    built = true;
    process.stdout.write(`${JSON.stringify({schema_version: "are.companion-windows-installer/v1", output, source_installer: installers[0], stage: keepStage ? stage : null, closure_digest: closure.closure_digest, core_closure_digest: coreClosure.closure_digest, file_count: closure.file_count, bundle_mode: "development-evolution-observer-and-unregistered-hook-relay", native_orb: includeNativeOrb ? "bundled-candidate" : "not-bundled", node_version: process.versions.node, installer_type: "unsigned-nsis", authority_effect: "none"}, null, 2)}\n`);
  } finally {
    if (built && !keepStage) rmSync(stage, {recursive: true, force: true});
    else process.stderr.write(`Windows build staging retained for diagnosis: ${stage}\n`);
  }
}

try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 2; }
