import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { sha256Canonical } from "../../evaluation/canonical-json.mjs";

export const RUNTIME_PACKAGES = Object.freeze({
  "@playwright/test": "1.61.1",
  esbuild: "0.28.1",
  react: "19.2.7",
  "react-dom": "19.2.7",
});

export const RUNTIME_COMPONENTS = Object.freeze(["chromium-1228", "chromium_headless_shell-1228", "ffmpeg-1011"]);

export function runtimeHandle(descriptor) {
  const semantic = structuredClone(descriptor);
  delete semantic.runtime_handle;
  return sha256Canonical(semantic);
}

export function validateBrowserRuntimeDescriptor(descriptor, { repositoryRoot }) {
  requireObject(descriptor, "runtime descriptor");
  assertExactKeys(descriptor, [
    "schema_version", "runtime_handle", "runtime_source", "decision_id", "package_root", "packages",
    "package_sha256", "lock_sha256", "browser", "components", "smoke", "protected_import_manifest_handle",
    "atomic_target_set_handle", "generated_harness_dependency_map",
  ], "runtime descriptor");
  if (descriptor.schema_version !== "cdsc.browser-runtime.v1") throw new TypeError("runtime schema version mismatch");
  if (descriptor.runtime_source !== "pinned-isolated-install" || descriptor.decision_id !== "DEC-CDSC3-011") throw new TypeError("wrong runtime source or decision");
  if (JSON.stringify(descriptor.packages) !== JSON.stringify(RUNTIME_PACKAGES)) throw new TypeError("wrong runtime package versions");
  if (descriptor.runtime_handle !== runtimeHandle(descriptor)) throw new TypeError("runtime handle mismatch");
  if (JSON.stringify(descriptor.components) !== JSON.stringify(RUNTIME_COMPONENTS)) throw new TypeError("browser component revision mismatch");

  const packageRoot = resolve(repositoryRoot, descriptor.package_root);
  assertFileDigest(resolve(packageRoot, "package.json"), descriptor.package_sha256, "runtime package manifest");
  assertFileDigest(resolve(packageRoot, "package-lock.json"), descriptor.lock_sha256, "runtime lockfile");

  const browser = requireObject(descriptor.browser, "browser descriptor");
  assertExactKeys(browser, ["name", "version", "revision", "executable_path", "executable_sha256", "executable_bytes"], "browser descriptor");
  if (browser.name !== "chromium" || browser.version !== "149.0.7827.55" || browser.revision !== "1228") throw new TypeError("wrong browser version");
  if (browser.executable_path.startsWith("/") || browser.executable_path.includes("..")) throw new TypeError("browser executable must be package-relative");
  const executable = resolve(packageRoot, browser.executable_path);
  if (!existsSync(executable)) throw new TypeError("missing browser executable");
  assertFileDigest(executable, browser.executable_sha256, "browser executable");
  if (statSync(executable).size !== browser.executable_bytes) throw new TypeError("browser executable size mismatch");

  const smoke = requireObject(descriptor.smoke, "smoke descriptor");
  assertExactKeys(smoke, ["status", "run_count", "structured_state", "screenshot_sha256", "replay_state"], "smoke descriptor");
  if (smoke.status !== "pass" || smoke.run_count !== 2 || smoke.replay_state !== "identical") throw new TypeError("browser launch smoke failed");
  assertExactKeys(smoke.structured_state, ["ready", "vector", "text"], "smoke structured state");
  if (smoke.structured_state.ready !== true || smoke.structured_state.vector !== "SMOKE-01") throw new TypeError("browser structured DOM smoke failed");
  requireDigest(smoke.screenshot_sha256, "smoke screenshot digest");
  requireDigest(descriptor.protected_import_manifest_handle, "protected import manifest handle");
  requireDigest(descriptor.atomic_target_set_handle, "atomic target set handle");
  assertExactKeys(descriptor.generated_harness_dependency_map, ["browser_control", "rendering", "bundling"], "harness dependency map");
  return true;
}

function assertFileDigest(path, expected, label) {
  if (!existsSync(path)) throw new TypeError(`missing ${label}`);
  const actual = `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
  if (actual !== expected) throw new TypeError(`${label} digest mismatch`);
}

function requireDigest(value, label) {
  if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value)) throw new TypeError(`${label} must be a SHA-256 digest`);
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new TypeError(`${label} has unknown or missing field`);
}

function requireObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}
