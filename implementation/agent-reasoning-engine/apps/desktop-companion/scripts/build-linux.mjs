#!/usr/bin/env node
import {spawnSync} from "node:child_process";
import {cpSync, existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, statSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {basename, dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {materializeStandaloneDistribution} from "../../../src/distribution.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(appRoot, "../../../..");
const manifest = join(appRoot, "src-tauri/Cargo.toml");
const binary = join(appRoot, "src-tauri/target/release/are-companion");
const orbManifest = join(appRoot, "experiments/native-orb/Cargo.toml");
const orbBinary = join(appRoot, "experiments/native-orb/target/release/are-native-orb-spike");
const defaultOutput = join(appRoot, "dist/are-companion_0.1.0_amd64.deb");
const toolchain = join(repositoryRoot, "tools/toolchain/run");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {encoding: "utf8", stdio: "inherit", ...options});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${basename(command)} exited ${result.status ?? "without a status"}`);
}

function preflight() {
  if (process.platform !== "linux" || process.arch !== "x64") throw new Error("This first installer targets Linux x86-64 only.");
  if (process.versions.node !== "26.8.1") throw new Error(`ARE requires Node 26.8.1; found ${process.versions.node}.`);
  const pkgConfig = spawnSync("pkg-config", ["--exists", "webkit2gtk-4.1", "gtk+-3.0", "dbus-1", "ayatana-appindicator3-0.1"], {encoding: "utf8"});
  if (pkgConfig.error || pkgConfig.status !== 0) {
    throw new Error("Linux Tauri build dependencies are missing: pkg-config, WebKitGTK 4.1, GTK 3, D-Bus, or Ayatana AppIndicator development headers. See README.md; no system packages were changed.");
  }
  if (!existsSync(toolchain)) throw new Error("Repository Rust toolchain launcher is unavailable.");
}

function writePackageFiles(packageRoot) {
  const controlDir = join(packageRoot, "DEBIAN");
  mkdirSync(controlDir, {recursive: true});
  writeFileSync(join(controlDir, "control"), [
    "Package: are-companion",
    "Version: 0.1.0",
    "Section: utils",
    "Priority: optional",
    "Architecture: amd64",
    "Maintainer: CyberAlchemy private prototype",
    "Depends: libwebkit2gtk-4.1-0, libgtk-3-0t64, libfontconfig1, libxkbcommon0, libxkbcommon-x11-0, libwayland-client0, libx11-6",
    "Description: ARE floating desktop companion prototype",
    " A local diagnostic-only dashboard with bundled ARE and Node runtime.",
    "",
  ].join("\n"));
  const applications = join(packageRoot, "usr/share/applications");
  mkdirSync(applications, {recursive: true});
  writeFileSync(join(applications, "are-companion.desktop"), [
    "[Desktop Entry]",
    "Type=Application",
    "Name=ARE Companion",
    "Comment=Local Agent Reasoning Engine observatory",
    "Exec=/opt/are-companion/bin/are-companion",
    "Icon=are-companion",
    "Terminal=false",
    "Categories=Development;Utility;",
    "",
  ].join("\n"));
  const icons = join(packageRoot, "usr/share/icons/hicolor/scalable/apps");
  mkdirSync(icons, {recursive: true});
  cpSync(join(appRoot, "ui/are-companion.svg"), join(icons, "are-companion.svg"));
}

function main() {
  const outputArgument = process.argv[2];
  if (process.argv.length > 3 || (outputArgument && !resolve(outputArgument).endsWith(".deb"))) {
    throw new Error("Usage: node scripts/build-linux.mjs [absolute-or-relative-output.deb]");
  }
  const output = resolve(outputArgument ?? defaultOutput);
  if (existsSync(output)) throw new Error(`Refusing to overwrite existing installer: ${output}`);
  preflight();
  run(toolchain, ["cargo", "build", "--locked", "--release", "--manifest-path", orbManifest]);
  if (!existsSync(orbBinary) || !statSync(orbBinary).isFile()) throw new Error("Native orb build completed without its executable.");
  run(toolchain, ["cargo", "build", "--locked", "--release", "--manifest-path", manifest]);
  if (!existsSync(binary) || !statSync(binary).isFile()) throw new Error("Tauri build completed without the companion executable.");
  const staging = mkdtempSync(join(tmpdir(), "are-companion-deb-"));
  let built = false;
  try {
    const packageRoot = join(staging, "package");
    const installRoot = join(packageRoot, "opt/are-companion");
    mkdirSync(join(installRoot, "bin"), {recursive: true});
    cpSync(binary, join(installRoot, "bin/are-companion"));
    mkdirSync(join(installRoot, "bin/native-orb"), {recursive: true});
    cpSync(orbBinary, join(installRoot, "bin/native-orb/are-native-orb"));
    mkdirSync(join(installRoot, "node/bin"), {recursive: true});
    cpSync(realpathSync(process.execPath), join(installRoot, "node/bin/node"));
    const closure = materializeStandaloneDistribution(join(installRoot, "are"),
      {include: ["evolution-runtime", "are-mcp-server"], development: true});
    writePackageFiles(packageRoot);
    mkdirSync(dirname(output), {recursive: true});
    run("dpkg-deb", ["--build", "--root-owner-group", packageRoot, output]);
    built = true;
    process.stdout.write(`${JSON.stringify({schema_version: "are.companion-installer/v1", output, closure_digest: closure.closure_digest, file_count: closure.file_count, bundle_mode: "development-evolution-observer-and-unregistered-hook-relay", native_orb: "bundled-candidate", node_version: process.versions.node, installed_runtime: "bundled-ARE-and-Node", system_dependencies: ["libwebkit2gtk-4.1-0", "libgtk-3-0t64", "libfontconfig1", "libxkbcommon0", "libxkbcommon-x11-0", "libwayland-client0", "libx11-6"], authority_effect: "none"}, null, 2)}\n`);
  } finally {
    if (built) rmSync(staging, {recursive: true, force: true});
    else process.stderr.write(`Installer staging retained for diagnosis: ${staging}\n`);
  }
}

try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 2; }
