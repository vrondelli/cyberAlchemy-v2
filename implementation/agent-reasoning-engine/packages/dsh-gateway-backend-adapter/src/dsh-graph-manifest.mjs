import {createHash} from "node:crypto";
import {open, lstat, readFile, readdir, realpath} from "node:fs/promises";
import {createRequire} from "node:module";
import {dirname, isAbsolute, join, posix, relative, resolve, sep} from "node:path";
import {pathToFileURL} from "node:url";

export const DSH_GRAPH_MANIFEST_SCHEMA = "are.dsh-structural-graph-manifest/v1";
export const DSH_GRAPH_OBSERVATION_SCHEMA = "are.dsh-structural-graph-observation/v1";
export const DSH_GRAPH_RESULT_SCHEMA = "are.dsh-structural-graph-result/v1";
export const MAX_MANIFEST_BYTES = 1024 * 1024;
export const MAX_HASH_CHUNK_BYTES = 1024 * 1024;

const DIGEST = /^[0-9a-f]{64}$/u;
const GENERATED_LOADER_ID = /^[0-9a-f]{8}$/u;
const FIBER_PHASE = new Map([[0, "pending"], [1, "loading"], [2, "active"],
  [3, "failed"], [4, null], [5, "unloading"]]);
const COUNT_KEYS = ["bootstrap-isolate", "bootstrap-loader", "host-nested",
  "host-primary", "preset-nested", "preset-primary", "unknown"];
const GENERATED_LOADER_ID_MODULES = new Set([
  "@deepseek-ai/cordis-plugin-hmr",
  "@deepseek-ai/dsh-client-ui-directory-picker-browse",
  "@deepseek-ai/dsh-host-directory-picker-browse",
]);
const QUALIFIED_CONTROLLER_URL = new URL("./qualified-web-controller.mjs", import.meta.url).href;
const QUALIFIED_WORKSPACE_CONTROLLER_URL =
  new URL("./qualified-web-workspace-controller.mjs", import.meta.url).href;
const WEB_OUTCOMES_PLUGIN_URL =
  new URL("../web-outcomes-plugin/lib/index.mjs", import.meta.url).href;
const WEB_SESSION_CLIENT_BRIDGE_URL =
  new URL("../web-client-bridges/session-controller/index.mjs", import.meta.url).href;
const WEB_WORKSPACE_CLIENT_BRIDGE_URL =
  new URL("../web-client-bridges/workspace-controller/index.mjs", import.meta.url).href;

export class DshGraphManifestError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = "DshGraphManifestError";
    this.code = code;
  }
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort(compareUtf8)
      .map((key) => [key, canonicalValue(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalValue(value));
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export const DSH_RESTRICTED_PROFILE_OVERLAY_SELECTOR =
  "inline:restricted-agent-presets-overlay/v1";
export const DSH_RESTRICTED_PROFILE_OVERLAY_ROOT_TOKEN = "{{ARE_DSH_PRESET_ROOT}}";

export function renderDshRestrictedProfileOverlay(
  presetRoot = DSH_RESTRICTED_PROFILE_OVERLAY_ROOT_TOKEN,
) {
  if (typeof presetRoot !== "string" || presetRoot.length === 0) {
    fail("manifest.profile-overlay-root-invalid", "restricted preset root must be non-empty");
  }
  return `- id: agent-presets
  config:
    default: are-read-only
    roots:
      - path: ${JSON.stringify(presetRoot)}
        trust: system
    includeShippedRoot: false
    includeUserRoot: false
`;
}

export const DSH_RESTRICTED_PROFILE_OVERLAY_TEMPLATE =
  renderDshRestrictedProfileOverlay();
export const DSH_RESTRICTED_PROFILE_OVERLAY_SHA256 =
  sha256(DSH_RESTRICTED_PROFILE_OVERLAY_TEMPLATE);

export const DSH_QUALIFIED_WEB_OVERLAY_SELECTOR =
  "inline:qualified-web-controller-overlay/v1";
export const DSH_QUALIFIED_WEB_CONTROLLER_PATH_TOKEN = "{{ARE_DSH_QUALIFIED_CONTROLLER_PATH}}";
export const DSH_QUALIFIED_WEB_WORKSPACE_CONTROLLER_PATH_TOKEN =
  "{{ARE_DSH_QUALIFIED_WORKSPACE_CONTROLLER_PATH}}";
export const DSH_WEB_OUTCOMES_PLUGIN_PATH_TOKEN = "{{ARE_DSH_WEB_OUTCOMES_PLUGIN_PATH}}";
export const DSH_WEB_SESSION_CLIENT_BRIDGE_PATH_TOKEN =
  "{{ARE_DSH_WEB_SESSION_CLIENT_BRIDGE_PATH}}";
export const DSH_WEB_WORKSPACE_CLIENT_BRIDGE_PATH_TOKEN =
  "{{ARE_DSH_WEB_WORKSPACE_CLIENT_BRIDGE_PATH}}";

export function renderDshQualifiedWebOverlay(
  controllerPath = DSH_QUALIFIED_WEB_CONTROLLER_PATH_TOKEN,
  workspaceControllerPath = DSH_QUALIFIED_WEB_WORKSPACE_CONTROLLER_PATH_TOKEN,
  outcomesPluginPath = DSH_WEB_OUTCOMES_PLUGIN_PATH_TOKEN,
  sessionClientBridgePath = DSH_WEB_SESSION_CLIENT_BRIDGE_PATH_TOKEN,
  workspaceClientBridgePath = DSH_WEB_WORKSPACE_CLIENT_BRIDGE_PATH_TOKEN) {
  if (typeof controllerPath !== "string" || controllerPath.length === 0
    || typeof workspaceControllerPath !== "string" || workspaceControllerPath.length === 0
    || typeof outcomesPluginPath !== "string" || outcomesPluginPath.length === 0
    || typeof sessionClientBridgePath !== "string" || sessionClientBridgePath.length === 0
    || typeof workspaceClientBridgePath !== "string" || workspaceClientBridgePath.length === 0) {
    fail("manifest.controller-path-invalid", "qualified controller path must be non-empty");
  }
  return `- id: session-controller
  disabled: true
- id: cordis-client-runner
  disabled: true
- id: ui-cordis
  disabled: true
- insert:
    - id: are-qualified-web-controller
      name: ${JSON.stringify(controllerPath)}
- id: workspace-controller
  disabled: true
- insert:
    - id: are-qualified-web-workspace-controller
      name: ${JSON.stringify(workspaceControllerPath)}
- insert:
    - id: are-web-prompt-outcomes
      name: ${JSON.stringify(outcomesPluginPath)}
- insert:
    - id: are-web-session-client-bridge
      name: ${JSON.stringify(sessionClientBridgePath)}
- insert:
    - id: are-web-workspace-client-bridge
      name: ${JSON.stringify(workspaceClientBridgePath)}
`;
}

export const DSH_QUALIFIED_WEB_OVERLAY_TEMPLATE = renderDshQualifiedWebOverlay();
export const DSH_QUALIFIED_WEB_OVERLAY_SHA256 = sha256(DSH_QUALIFIED_WEB_OVERLAY_TEMPLATE);

function fail(code, message) {
  throw new DshGraphManifestError(code, message);
}

function plainRecord(value, at) {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype) {
    fail("manifest.schema-invalid", `${at} must be a plain object`);
  }
  return value;
}

function exactKeys(value, keys, at) {
  plainRecord(value, at);
  const actual = Object.keys(value).sort(compareUtf8);
  const expected = [...keys].sort(compareUtf8);
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    fail("manifest.schema-unknown-field", `${at} keys are not the closed schema`);
  }
}

function string(value, at, options = {}) {
  if (typeof value !== "string" || value.length === 0) {
    fail("manifest.schema-invalid", `${at} must be a non-empty string`);
  }
  if (options.max !== undefined && Buffer.byteLength(value, "utf8") > options.max) {
    fail("manifest.schema-invalid", `${at} is too long`);
  }
  return value;
}

function integer(value, at) {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail("manifest.schema-invalid", `${at} must be a non-negative safe integer`);
  }
  return value;
}

function boolean(value, at) {
  if (typeof value !== "boolean") fail("manifest.schema-invalid", `${at} must be boolean`);
  return value;
}

function digest(value, at) {
  if (typeof value !== "string" || !DIGEST.test(value)) {
    fail("manifest.schema-invalid", `${at} must be a lowercase SHA-256`);
  }
  return value;
}

function relativePath(value, at) {
  string(value, at, {max: 4096});
  if (isAbsolute(value) || /^[A-Za-z]:[\\/]/u.test(value) || value.includes("\\")
    || value === "." || value.startsWith("../") || value.includes("/../")
    || value.endsWith("/..") || posix.normalize(value) !== value) {
    fail("manifest.path-invalid", `${at} must be a normalized relative path`);
  }
  return value;
}

function sortedUnique(rows, key, at) {
  let previous;
  const seen = new Set();
  for (const row of rows) {
    const value = key(row);
    if (seen.has(value)) fail("manifest.duplicate-id", `${at} duplicates ${value}`);
    if (previous !== undefined && compareUtf8(previous, value) >= 0) {
      fail("manifest.array-unsorted", `${at} must be strictly UTF-8 sorted`);
    }
    seen.add(value);
    previous = value;
  }
}

function validateCounts(value, at) {
  exactKeys(value, COUNT_KEYS, at);
  for (const key of COUNT_KEYS) integer(value[key], `${at}.${key}`);
}

function validateStructure(value, at) {
  exactKeys(value, ["active_fiber_count", "counts"], at);
  integer(value.active_fiber_count, `${at}.active_fiber_count`);
  validateCounts(value.counts, `${at}.counts`);
  if (Object.values(value.counts).reduce((sum, count) => sum + count, 0)
    !== value.active_fiber_count) {
    fail("manifest.structure-count-invalid", `${at} counts do not sum to active_fiber_count`);
  }
}

function validateLoaderRow(row, at) {
  exactKeys(row, ["disabled", "fiber_phase", "group", "id", "module_specifier"], at);
  string(row.id, `${at}.id`, {max: 1024});
  string(row.module_specifier, `${at}.module_specifier`, {max: 1024});
  boolean(row.group, `${at}.group`);
  boolean(row.disabled, `${at}.disabled`);
  if (row.fiber_phase !== null && !["pending", "loading", "active", "failed", "unloading"]
    .includes(row.fiber_phase)) {
    fail("manifest.schema-invalid", `${at}.fiber_phase is invalid`);
  }
  if (!row.disabled && row.fiber_phase !== "active") {
    fail("manifest.loader-row-not-active", `${at} enabled row must be active`);
  }
  if (row.group && row.module_specifier !== "cordis:include") {
    fail("manifest.loader-group-invalid", `${at} group must use cordis:include`);
  }
}

function validatePackageRow(row, at) {
  exactKeys(row, ["byte_count", "file_count", "locator", "max_file_bytes", "name",
    "native_file_count", "tree_sha256", "version"], at);
  relativePath(row.locator, `${at}.locator`);
  string(row.name, `${at}.name`, {max: 512});
  string(row.version, `${at}.version`, {max: 128});
  integer(row.file_count, `${at}.file_count`);
  integer(row.byte_count, `${at}.byte_count`);
  integer(row.max_file_bytes, `${at}.max_file_bytes`);
  integer(row.native_file_count, `${at}.native_file_count`);
  digest(row.tree_sha256, `${at}.tree_sha256`);
  if (row.native_file_count > row.file_count || (row.file_count === 0 && row.max_file_bytes !== 0)) {
    fail("manifest.package-count-invalid", `${at} contains impossible counts`);
  }
}

function validateSourcePin(row, at) {
  exactKeys(row, ["byte_count", "package_name", "package_version", "reference",
    "relative_path", "resolution", "selector", "sha256"], at);
  string(row.selector, `${at}.selector`, {max: 1024});
  if (!["adapter-relative", "are-relative", "dsh-relative", "dsh-module"].includes(row.resolution)) {
    fail("manifest.resolution-unsupported", `${at}.resolution is unsupported`);
  }
  string(row.reference, `${at}.reference`, {max: 2048});
  if (row.resolution !== "dsh-module") relativePath(row.reference, `${at}.reference`);
  else if (isAbsolute(row.reference) || row.reference.startsWith(".")
    || row.reference.includes("\\") || row.reference.includes("..")) {
    fail("manifest.path-invalid", `${at}.reference is not a package specifier`);
  }
  string(row.package_name, `${at}.package_name`, {max: 512});
  string(row.package_version, `${at}.package_version`, {max: 128});
  relativePath(row.relative_path, `${at}.relative_path`);
  integer(row.byte_count, `${at}.byte_count`);
  digest(row.sha256, `${at}.sha256`);
}

function validateManifest(manifest) {
  exactKeys(manifest, ["authority_effect", "bootstrap_fibers", "callback_origin",
    "claim_posture", "host_loader_rows", "installed_package_set", "manifest_id",
    "material_digest", "model_tool_names", "packages", "preset", "profile_id",
    "profile_layers", "runtime", "schema_version", "serving_graph_lock", "source_pins",
    "structure"], "manifest");
  if (manifest.schema_version !== DSH_GRAPH_MANIFEST_SCHEMA) {
    fail("manifest.schema-version-unsupported", "manifest schema version is unsupported");
  }
  string(manifest.manifest_id, "manifest.manifest_id", {max: 256});
  string(manifest.profile_id, "manifest.profile_id", {max: 256});
  if (manifest.claim_posture !== "offline-disposable-structural-witness"
    || manifest.authority_effect !== "none" || manifest.callback_origin !== "unproved"
    || manifest.serving_graph_lock !== "not-established") {
    fail("manifest.claim-posture-invalid", "manifest claim posture exceeds D0b.4b");
  }
  digest(manifest.material_digest, "manifest.material_digest");

  if (!Array.isArray(manifest.packages) || manifest.packages.length === 0) {
    fail("manifest.schema-invalid", "manifest.packages must be non-empty");
  }
  for (const [index, row] of manifest.packages.entries()) {
    exactKeys(row, ["name", "version"], `manifest.packages[${index}]`);
    string(row.name, `manifest.packages[${index}].name`, {max: 512});
    string(row.version, `manifest.packages[${index}].version`, {max: 128});
  }
  sortedUnique(manifest.packages, (row) => `${row.name}\0${row.version}`, "manifest.packages");

  exactKeys(manifest.runtime, ["arch", "libc_family", "libc_version", "napi_version",
    "node_module_abi", "node_version", "platform"], "manifest.runtime");
  for (const key of Object.keys(manifest.runtime)) {
    string(manifest.runtime[key], `manifest.runtime.${key}`, {max: 128});
  }

  const installed = manifest.installed_package_set;
  exactKeys(installed, ["byte_count", "file_count", "max_file_bytes", "native_file_count",
    "package_instances", "package_row_json_bytes", "package_set_sha256", "packages",
    "root_selector"], "manifest.installed_package_set");
  if (installed.root_selector !== "adapter:node_modules") {
    fail("manifest.path-invalid", "installed package root selector is unsupported");
  }
  for (const key of ["package_instances", "file_count", "byte_count", "max_file_bytes",
    "native_file_count", "package_row_json_bytes"]) integer(installed[key], `installed.${key}`);
  digest(installed.package_set_sha256, "installed.package_set_sha256");
  if (!Array.isArray(installed.packages)) fail("manifest.schema-invalid", "installed.packages must be an array");
  installed.packages.forEach((row, index) => validatePackageRow(row, `installed.packages[${index}]`));
  sortedUnique(installed.packages, (row) => row.locator, "installed.packages");
  if (installed.packages.length !== installed.package_instances) {
    fail("manifest.package-count-invalid", "package_instances does not match packages length");
  }
  const packageMaterial = canonicalJson(installed.packages);
  if (Buffer.byteLength(packageMaterial) !== installed.package_row_json_bytes
    || sha256(packageMaterial) !== installed.package_set_sha256) {
    fail("manifest.package-set-digest-invalid", "installed package-set identity is inconsistent");
  }

  if (!Array.isArray(manifest.source_pins) || manifest.source_pins.length === 0) {
    fail("manifest.schema-invalid", "manifest.source_pins must be non-empty");
  }
  manifest.source_pins.forEach((row, index) => validateSourcePin(row, `source_pins[${index}]`));
  sortedUnique(manifest.source_pins, (row) => row.selector, "source_pins");

  const installedIdentities = new Set(installed.packages
    .map((row) => `${row.name}\0${row.version}`));
  for (const row of manifest.packages) {
    if (!installedIdentities.has(`${row.name}\0${row.version}`)) {
      fail("manifest.package-version-mismatch",
        `declared package ${row.name}@${row.version} is absent from the installed set`);
    }
  }

  if (!Array.isArray(manifest.profile_layers) || manifest.profile_layers.length === 0) {
    fail("manifest.schema-invalid", "manifest.profile_layers must be non-empty");
  }
  const hostOwned = ["dsh-web-are-host-owned", "dsh-web-are-host-owned-canary"]
    .includes(manifest.profile_id);
  const expectedProfileLayerSelectors = [
    "dsh:node_modules/@deepseek-ai/dsh-base/cordis.patch.yml",
    "dsh:node_modules/@deepseek-ai/dsh-web-app/cordis.patch.yml",
    DSH_RESTRICTED_PROFILE_OVERLAY_SELECTOR,
    ...(hostOwned
      ? [DSH_QUALIFIED_WEB_OVERLAY_SELECTOR] : []),
    ...(manifest.profile_id === "dsh-web-are-host-owned-canary"
      ? ["adapter:test/canary-provider.patch.yml"] : []),
    "adapter:config/read-only.patch.yml",
  ];
  const sourcePinsBySelector = new Map(manifest.source_pins
    .map((row) => [row.selector, row]));
  const layerSelectors = new Set();
  for (const [index, row] of manifest.profile_layers.entries()) {
    exactKeys(row, ["order", "selector", "sha256"], `profile_layers[${index}]`);
    integer(row.order, `profile_layers[${index}].order`);
    string(row.selector, `profile_layers[${index}].selector`, {max: 1024});
    digest(row.sha256, `profile_layers[${index}].sha256`);
    if (row.order !== index) fail("manifest.array-unsorted", "profile layers must use contiguous order");
    if (row.selector !== expectedProfileLayerSelectors[index]) {
      fail("manifest.profile-layer-mismatch", "profile layer order or selector is not the reviewed profile");
    }
    if (layerSelectors.has(row.selector)) {
      fail("manifest.duplicate-id", `profile_layers duplicates ${row.selector}`);
    }
    layerSelectors.add(row.selector);
    if (row.selector === DSH_RESTRICTED_PROFILE_OVERLAY_SELECTOR) {
      if (row.sha256 !== DSH_RESTRICTED_PROFILE_OVERLAY_SHA256) {
        fail("manifest.profile-layer-mismatch", "restricted profile overlay template digest differs");
      }
    } else if (row.selector === DSH_QUALIFIED_WEB_OVERLAY_SELECTOR) {
      if (row.sha256 !== DSH_QUALIFIED_WEB_OVERLAY_SHA256) {
        fail("manifest.profile-layer-mismatch", "qualified Web overlay template digest differs");
      }
    } else if (sourcePinsBySelector.get(row.selector)?.sha256 !== row.sha256) {
      fail("manifest.profile-layer-mismatch", "profile layer is not bound to its source pin");
    }
  }
  if (manifest.profile_layers.length !== expectedProfileLayerSelectors.length) {
    fail("manifest.profile-layer-mismatch", "profile layer count differs from the reviewed profile");
  }

  if (!Array.isArray(manifest.host_loader_rows) || manifest.host_loader_rows.length === 0) {
    fail("manifest.schema-invalid", "host loader rows must be non-empty");
  }
  manifest.host_loader_rows.forEach((row, index) => validateLoaderRow(row, `host_loader_rows[${index}]`));
  sortedUnique(manifest.host_loader_rows, (row) => row.id, "host_loader_rows");

  if (!Array.isArray(manifest.bootstrap_fibers) || manifest.bootstrap_fibers.length !== 2) {
    fail("manifest.schema-invalid", "exactly two bootstrap fibers are required");
  }
  for (const [index, row] of manifest.bootstrap_fibers.entries()) {
    exactKeys(row, ["id", "parent_id", "runtime_name"], `bootstrap_fibers[${index}]`);
    string(row.id, `bootstrap_fibers[${index}].id`, {max: 128});
    string(row.runtime_name, `bootstrap_fibers[${index}].runtime_name`, {max: 128});
    if (row.parent_id !== null) string(row.parent_id, `bootstrap_fibers[${index}].parent_id`, {max: 128});
  }
  sortedUnique(manifest.bootstrap_fibers, (row) => row.id, "bootstrap_fibers");

  exactKeys(manifest.structure, ["after", "before", "creation_delta",
    ...(hostOwned ? ["creation_delta_warm"] : [])],
  "manifest.structure");
  validateStructure(manifest.structure.before, "manifest.structure.before");
  validateStructure(manifest.structure.after, "manifest.structure.after");
  validateStructure(manifest.structure.creation_delta, "manifest.structure.creation_delta");
  if (hostOwned) {
    validateStructure(manifest.structure.creation_delta_warm, "manifest.structure.creation_delta_warm");
  }

  exactKeys(manifest.preset, ["composition_selector", "composition_sha256", "default_id",
    "roots", "rows", "selected_id"], "manifest.preset");
  relativePath(manifest.preset.composition_selector, "manifest.preset.composition_selector");
  digest(manifest.preset.composition_sha256, "manifest.preset.composition_sha256");
  string(manifest.preset.default_id, "manifest.preset.default_id", {max: 256});
  string(manifest.preset.selected_id, "manifest.preset.selected_id", {max: 256});
  if (!Array.isArray(manifest.preset.roots) || manifest.preset.roots.length !== 1) {
    fail("manifest.schema-invalid", "exactly one preset root is required");
  }
  for (const [index, row] of manifest.preset.roots.entries()) {
    exactKeys(row, ["selector", "trust"], `preset.roots[${index}]`);
    relativePath(row.selector, `preset.roots[${index}].selector`);
    if (row.trust !== "system") fail("manifest.schema-invalid", "preset root must be system trust");
  }
  sortedUnique(manifest.preset.roots, (row) => row.selector, "preset.roots");
  if (!Array.isArray(manifest.preset.rows) || manifest.preset.rows.length !== 1) {
    fail("manifest.schema-invalid", "restricted preset must contain exactly one row");
  }
  manifest.preset.rows.forEach((row, index) => validateLoaderRow(row, `preset.rows[${index}]`));
  sortedUnique(manifest.preset.rows, (row) => row.id, "preset.rows");

  if (!Array.isArray(manifest.model_tool_names)) {
    fail("manifest.schema-invalid", "model_tool_names must be an array");
  }
  for (const [index, name] of manifest.model_tool_names.entries()) {
    string(name, `model_tool_names[${index}]`, {max: 512});
  }
  sortedUnique(manifest.model_tool_names, (name) => name, "model_tool_names");
  if (manifest.model_tool_names.length !== 0) {
    fail("manifest.tool-catalog-not-empty", "D0b.4b restricted profile must expose no tools");
  }

  const material = {...manifest};
  delete material.material_digest;
  if (sha256(canonicalJson(material)) !== manifest.material_digest) {
    fail("manifest.material-digest-mismatch", "manifest material digest does not match");
  }
  return manifest;
}

export function materialDigest(manifestWithoutDigest) {
  const material = {...manifestWithoutDigest};
  delete material.material_digest;
  return sha256(canonicalJson(material));
}

export function parseDshGraphManifest(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
  if (bytes.byteLength > MAX_MANIFEST_BYTES) {
    fail("manifest.too-large", `manifest exceeds ${MAX_MANIFEST_BYTES} bytes`);
  }
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    fail("manifest.json-invalid", error instanceof Error ? error.message : "invalid JSON");
  }
  return validateManifest(value);
}

export async function loadDshGraphManifest(path) {
  const stat = await lstat(path);
  if (!stat.isFile()) fail("manifest.file-invalid", "manifest path is not a regular file");
  if (stat.size > MAX_MANIFEST_BYTES) fail("manifest.too-large", "manifest exceeds size limit");
  return parseDshGraphManifest(await readFile(path));
}

async function readDirectory(path, optional = false) {
  try {
    return (await readdir(path, {withFileTypes: true})).sort((a, b) => compareUtf8(a.name, b.name));
  } catch (error) {
    if (optional && error?.code === "ENOENT") return [];
    throw error;
  }
}

async function discoverPackageRoots(nodeModulesRoot) {
  const roots = [];
  const seenNodeModules = new Set();
  async function visit(nodeModulesPath, optional) {
    const entries = await readDirectory(nodeModulesPath, optional);
    if (entries.length === 0 && optional) return;
    const canonicalRoot = await realpath(nodeModulesPath);
    if (seenNodeModules.has(canonicalRoot)) fail("source.package-cycle", "duplicate node_modules traversal");
    seenNodeModules.add(canonicalRoot);
    const direct = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const candidate = join(nodeModulesPath, entry.name);
      const stat = await lstat(candidate);
      if (stat.isSymbolicLink()) fail("source.symlink-rejected", "package root symlink rejected");
      if (!stat.isDirectory()) fail("source.special-file-rejected", "unexpected node_modules entry");
      if (entry.name.startsWith("@")) {
        for (const child of await readDirectory(candidate)) {
          const childPath = join(candidate, child.name);
          const childStat = await lstat(childPath);
          if (childStat.isSymbolicLink()) fail("source.symlink-rejected", "scoped package symlink rejected");
          if (!childStat.isDirectory()) fail("source.special-file-rejected", "invalid scoped package entry");
          direct.push(childPath);
        }
      } else direct.push(candidate);
    }
    for (const packageRoot of direct) {
      roots.push(packageRoot);
      await visit(join(packageRoot, "node_modules"), true);
    }
  }
  await visit(nodeModulesRoot, false);
  return roots.sort((a, b) => compareUtf8(normalizeRelative(nodeModulesRoot, a),
    normalizeRelative(nodeModulesRoot, b)));
}

function normalizeRelative(root, path) {
  return relative(root, path).split(sep).join("/");
}

async function inventoryPackageTree(packageRoot) {
  const entries = [];
  let fileCount = 0;
  let byteCount = 0;
  let nativeFileCount = 0;
  let maxFileBytes = 0;
  async function walk(directory) {
    for (const entry of await readDirectory(directory)) {
      const absolute = join(directory, entry.name);
      const path = normalizeRelative(packageRoot, absolute);
      const stat = await lstat(absolute);
      if (stat.isSymbolicLink()) fail("source.symlink-rejected", "package-internal symlink rejected");
      if (entry.name === "node_modules") {
        if (!stat.isDirectory()) fail("source.special-file-rejected", "node_modules is not a directory");
        continue;
      }
      if (stat.isDirectory()) {
        entries.push({kind: "directory", path, absolute});
        await walk(absolute);
      } else if (stat.isFile()) {
        entries.push({kind: "file", path, absolute, size: stat.size,
          executable: (stat.mode & 0o111) === 0 ? 0 : 1});
        fileCount += 1;
        byteCount += stat.size;
        maxFileBytes = Math.max(maxFileBytes, stat.size);
        if (path.endsWith(".node")) nativeFileCount += 1;
      } else fail("source.special-file-rejected", "package tree contains a special file");
    }
  }
  await walk(packageRoot);
  entries.sort((a, b) => compareUtf8(a.path, b.path));
  return {entries, file_count: fileCount, byte_count: byteCount,
    native_file_count: nativeFileCount, max_file_bytes: maxFileBytes};
}

export async function inventoryInstalledPackageSet(nodeModulesRoot) {
  const absoluteRoot = resolve(nodeModulesRoot);
  const rootStat = await lstat(absoluteRoot);
  if (!rootStat.isDirectory()) fail("source.package-root-invalid", "node_modules root is not a directory");
  const rows = [];
  const trees = new Map();
  for (const packageRoot of await discoverPackageRoots(absoluteRoot)) {
    let packageJson;
    try {
      packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    } catch {
      fail("source.package-manifest-invalid", "package.json is missing or invalid");
    }
    if (typeof packageJson.name !== "string" || !packageJson.name
      || typeof packageJson.version !== "string" || !packageJson.version) {
      fail("source.package-identity-invalid", "package identity is missing");
    }
    const locator = normalizeRelative(absoluteRoot, packageRoot);
    relativePath(locator, `package locator ${locator}`);
    if (trees.has(locator)) fail("source.package-duplicate", "duplicate package locator");
    const tree = await inventoryPackageTree(packageRoot);
    trees.set(locator, tree);
    rows.push({locator, name: packageJson.name, version: packageJson.version,
      file_count: tree.file_count, byte_count: tree.byte_count,
      max_file_bytes: tree.max_file_bytes, native_file_count: tree.native_file_count});
  }
  rows.sort((a, b) => compareUtf8(a.locator, b.locator));
  return {
    rows,
    trees,
    package_instances: rows.length,
    file_count: rows.reduce((sum, row) => sum + row.file_count, 0),
    byte_count: rows.reduce((sum, row) => sum + row.byte_count, 0),
    native_file_count: rows.reduce((sum, row) => sum + row.native_file_count, 0),
    max_file_bytes: Math.max(0, ...rows.map((row) => row.max_file_bytes)),
  };
}

async function hashRegularFile(path, expected, buffer, dependencies = {}) {
  const before = await lstat(path);
  if (!before.isFile() || before.size !== expected.size
    || ((before.mode & 0o111) === 0 ? 0 : 1) !== expected.executable) {
    fail("source.file-drift", "file changed between inventory and hash passes");
  }
  if (dependencies.hash_file_impl) return dependencies.hash_file_impl(path, expected, buffer);
  const handle = await open(path, "r");
  const hash = createHash("sha256");
  let position = 0;
  try {
    while (position < expected.size) {
      const {bytesRead} = await handle.read(buffer, 0,
        Math.min(buffer.byteLength, expected.size - position), position);
      if (bytesRead === 0) fail("source.file-drift", "unexpected EOF while hashing");
      hash.update(buffer.subarray(0, bytesRead));
      position += bytesRead;
    }
  } finally {
    await handle.close();
  }
  const after = await lstat(path);
  if (!after.isFile() || after.size !== before.size || after.mode !== before.mode) {
    fail("source.file-drift", "file changed during hash pass");
  }
  return hash.digest("hex");
}

export async function hashInstalledPackageInventory(inventory, options = {}) {
  const chunkBytes = options.read_chunk_bytes ?? MAX_HASH_CHUNK_BYTES;
  if (!Number.isSafeInteger(chunkBytes) || chunkBytes < 1 || chunkBytes > MAX_HASH_CHUNK_BYTES) {
    fail("source.hash-chunk-invalid", "hash chunk exceeds the 1 MiB bound");
  }
  const buffer = Buffer.allocUnsafe(chunkBytes);
  const rows = [];
  for (const inventoryRow of inventory.rows) {
    const tree = inventory.trees.get(inventoryRow.locator);
    if (!tree) fail("source.package-inventory-invalid", "missing package tree inventory");
    const treeRows = [];
    for (const entry of tree.entries) {
      if (entry.kind === "directory") treeRows.push(["d", entry.path]);
      else treeRows.push(["f", entry.path, entry.executable, entry.size,
        await hashRegularFile(entry.absolute, entry, buffer, options)]);
    }
    treeRows.sort((a, b) => compareUtf8(a[1], b[1]));
    rows.push({...inventoryRow, tree_sha256: sha256(JSON.stringify(treeRows))});
  }
  rows.sort((a, b) => compareUtf8(a.locator, b.locator));
  const material = canonicalJson(rows);
  return {
    rows,
    package_instances: rows.length,
    file_count: rows.reduce((sum, row) => sum + row.file_count, 0),
    byte_count: rows.reduce((sum, row) => sum + row.byte_count, 0),
    native_file_count: rows.reduce((sum, row) => sum + row.native_file_count, 0),
    max_file_bytes: Math.max(0, ...rows.map((row) => row.max_file_bytes)),
    package_row_json_bytes: Buffer.byteLength(material),
    package_set_sha256: sha256(material),
  };
}

function publicInventoryRow(row) {
  return {locator: row.locator, name: row.name, version: row.version,
    file_count: row.file_count, byte_count: row.byte_count,
    max_file_bytes: row.max_file_bytes, native_file_count: row.native_file_count};
}

function same(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

export async function verifyInstalledPackageSet(expected, nodeModulesRoot, options = {}) {
  let inventory;
  try {
    inventory = await inventoryInstalledPackageSet(nodeModulesRoot);
  } catch (error) {
    return failure(error instanceof DshGraphManifestError ? error.code : "source.package-inventory-failed");
  }
  const expectedInventoryRows = expected.packages.map(({tree_sha256, ...row}) => row);
  const actualInventoryRows = inventory.rows.map(publicInventoryRow);
  const totalsMatch = inventory.package_instances === expected.package_instances
    && inventory.file_count === expected.file_count
    && inventory.byte_count === expected.byte_count
    && inventory.native_file_count === expected.native_file_count
    && inventory.max_file_bytes === expected.max_file_bytes;
  if (!totalsMatch || !same(actualInventoryRows, expectedInventoryRows)) {
    return failure(!totalsMatch ? "source.package-count-mismatch" : "source.package-inventory-mismatch");
  }
  let hashed;
  try {
    hashed = await hashInstalledPackageInventory(inventory, options);
  } catch (error) {
    return failure(error instanceof DshGraphManifestError ? error.code : "source.package-hash-failed");
  }
  if (!same(hashed.rows, expected.packages)) return failure("source.package-tree-mismatch");
  if (hashed.package_row_json_bytes !== expected.package_row_json_bytes
    || hashed.package_set_sha256 !== expected.package_set_sha256) {
    return failure("source.package-set-digest-mismatch");
  }
  return success({package_set_sha256: hashed.package_set_sha256,
    package_instances: hashed.package_instances, file_count: hashed.file_count,
    byte_count: hashed.byte_count, native_file_count: hashed.native_file_count,
    max_file_bytes: hashed.max_file_bytes, package_row_json_bytes: hashed.package_row_json_bytes});
}

function within(root, candidate) {
  const path = relative(root, candidate);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path));
}

async function packageIdentityFor(path, boundary) {
  let current = dirname(path);
  while (within(boundary, current)) {
    try {
      const manifestPath = join(current, "package.json");
      const stat = await lstat(manifestPath);
      if (stat.isFile()) {
        const value = JSON.parse(await readFile(manifestPath, "utf8"));
        if (typeof value.name === "string" && typeof value.version === "string") {
          return {root: current, name: value.name, version: value.version};
        }
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  fail("source.package-identity-invalid", "resolved source has no package identity");
}

async function resolveSourcePinTarget(pin, roots) {
  const adapterRoot = await realpath(roots.adapter_root);
  const dshPackageJson = await realpath(roots.dsh_package_json);
  const dshRoot = dirname(dshPackageJson);
  const nodeModulesRoot = await realpath(roots.node_modules_root);
  const dshRequire = createRequire(dshPackageJson);
  let candidate;
  let boundary;
  let packageIdentity;
  if (pin.resolution === "adapter-relative") {
    candidate = resolve(adapterRoot, pin.reference);
    boundary = adapterRoot;
    packageIdentity = await packageIdentityFor(candidate, adapterRoot);
  } else if (pin.resolution === "are-relative") {
    boundary = resolve(adapterRoot, "../..");
    candidate = resolve(boundary, pin.reference);
    if (!within(boundary, candidate)) fail("source.path-escape", "ARE source escapes its root");
    packageIdentity = await packageIdentityFor(candidate, boundary);
  } else if (pin.resolution === "dsh-relative") {
    candidate = resolve(dshRoot, pin.reference);
    boundary = dshRoot;
    packageIdentity = await packageIdentityFor(candidate, dshRoot);
  } else {
    candidate = dshRequire.resolve(pin.reference);
    boundary = nodeModulesRoot;
    packageIdentity = await packageIdentityFor(candidate, nodeModulesRoot);
  }
  const resolved = await realpath(candidate);
  if (!within(boundary, resolved)) fail("source.path-escape", "resolved source escapes its root");
  return {resolved, boundary, packageIdentity};
}

async function describeResolvedSource(pin, roots, options = {}) {
  const {resolved, packageIdentity} = await resolveSourcePinTarget(pin, roots);
  const stat = await lstat(resolved);
  if (!stat.isFile()) fail("source.pin-not-file", "resolved source is not a regular file");
  const buffer = Buffer.allocUnsafe(options.read_chunk_bytes ?? MAX_HASH_CHUNK_BYTES);
  const hash = await hashRegularFile(resolved, {size: stat.size,
    executable: (stat.mode & 0o111) === 0 ? 0 : 1}, buffer, options);
  return {package_name: packageIdentity.name, package_version: packageIdentity.version,
    relative_path: normalizeRelative(packageIdentity.root, resolved), byte_count: stat.size, sha256: hash};
}

export async function buildDshSourcePinIndex(manifest, roots, options = {}) {
  const byUrl = new Map();
  const bySelector = new Map();
  for (const pin of manifest.source_pins) {
    const {resolved} = await resolveSourcePinTarget(pin, roots);
    const actual = await describeResolvedSource(pin, roots, options);
    const expected = {package_name: pin.package_name, package_version: pin.package_version,
      relative_path: pin.relative_path, byte_count: pin.byte_count, sha256: pin.sha256};
    if (!same(actual, expected)) fail("source.pin-mismatch", `source pin changed: ${pin.selector}`);
    const publicPin = Object.freeze({selector: pin.selector, package_name: pin.package_name,
      package_version: pin.package_version, relative_path: pin.relative_path,
      byte_count: pin.byte_count, sha256: pin.sha256});
    const url = pathToFileURL(resolved).href;
    if (byUrl.has(url)) fail("source.pin-url-duplicate", "multiple selectors resolve to one source URL");
    byUrl.set(url, publicPin);
    bySelector.set(pin.selector, publicPin);
  }
  const appBoot = bySelector.get("module:@deepseek-ai/dsh-app-boot");
  if (!appBoot) fail("source.builtin-pin-missing", "app-boot source pin is required for Loader builtins");
  const builtins = new Map([["cordis:include", appBoot], ["cordis:group", appBoot]]);
  return Object.freeze({
    size: byUrl.size,
    lookup(value) {
      try {
        return byUrl.get(new URL(value).href);
      } catch {
        return undefined;
      }
    },
    builtin(specifier) {
      return builtins.get(specifier);
    },
  });
}

export async function describeSourcePin({selector, resolution, reference}, roots, options = {}) {
  const described = await describeResolvedSource({resolution, reference}, roots, options);
  return {selector, resolution, reference, ...described};
}

export async function verifySourcePins(sourcePins, roots, options = {}) {
  for (const pin of sourcePins) {
    try {
      const actual = await describeResolvedSource(pin, roots, options);
      const expected = {package_name: pin.package_name, package_version: pin.package_version,
        relative_path: pin.relative_path, byte_count: pin.byte_count, sha256: pin.sha256};
      if (!same(actual, expected)) return failure("source.pin-mismatch");
    } catch (error) {
      return failure(error instanceof DshGraphManifestError ? error.code : "source.pin-resolution-failed");
    }
  }
  return success({source_pin_count: sourcePins.length});
}

export function currentRuntimeTuple() {
  const report = process.report?.getReport?.();
  return {
    node_version: process.version,
    node_module_abi: String(process.versions.modules ?? ""),
    napi_version: String(process.versions.napi ?? ""),
    platform: process.platform,
    arch: process.arch,
    libc_family: report?.header?.glibcVersionRuntime ? "glibc" : "unknown",
    libc_version: String(report?.header?.glibcVersionRuntime ?? "unknown"),
  };
}

export function verifyRuntimeTuple(expected, actual = currentRuntimeTuple()) {
  return same(expected, actual) ? success({runtime: actual}) : failure("source.runtime-mismatch");
}

function runtimeRows(ctx) {
  const rows = [];
  for (const runtime of ctx.registry.values()) {
    for (const fiber of runtime.fibers) {
      if (fiber.uid !== null && fiber.state === 2) rows.push({fiber, runtime});
    }
  }
  return rows;
}

function loaderEntries(tree, label) {
  const rows = [...tree.entries()];
  const ids = new Set();
  for (const entry of rows) {
    if (ids.has(entry.id)) fail("graph.loader-id-duplicate", `${label} Loader entry ID duplicated`);
    ids.add(entry.id);
  }
  return rows;
}

function primaryFiber(entry, active) {
  if (entry.fiber === undefined) return undefined;
  const unwrapped = Object.getPrototypeOf(entry.fiber);
  if (unwrapped !== null && typeof unwrapped === "object" && active.has(unwrapped)) return unwrapped;
  if (active.has(entry.fiber)) return undefined;
  fail("graph.entry-fiber-identity-invalid", "Loader entry fiber identity is invalid");
}

function loaderServiceFiber(ctx) {
  const implementations = [];
  for (const key of Object.getOwnPropertySymbols(ctx.reflect.store)) {
    const implementation = ctx.reflect.store[key];
    if (implementation?.name === "loader") implementations.push(implementation);
  }
  if (implementations.length !== 1 || !implementations[0].fiber) {
    fail("graph.loader-bootstrap-ambiguous", "Loader service owner is ambiguous");
  }
  return implementations[0].fiber;
}

function renderLoaderRows(entries) {
  return entries.map((entry) => {
    const resolvedSpecifier = entry.options.name
      ?? (entry.options.group ? "cordis:include" : "<missing>");
    const moduleSpecifier = resolvedSpecifier === QUALIFIED_CONTROLLER_URL
      ? "adapter:src/qualified-web-controller.mjs"
      : resolvedSpecifier === QUALIFIED_WORKSPACE_CONTROLLER_URL
        ? "adapter:src/qualified-web-workspace-controller.mjs"
        : resolvedSpecifier === WEB_OUTCOMES_PLUGIN_URL
          ? "adapter:web-outcomes-plugin/lib/index.mjs"
          : resolvedSpecifier === WEB_SESSION_CLIENT_BRIDGE_URL
            ? "adapter:web-client-bridges/session-controller/index.mjs"
            : resolvedSpecifier === WEB_WORKSPACE_CLIENT_BRIDGE_URL
              ? "adapter:web-client-bridges/workspace-controller/index.mjs" : resolvedSpecifier;
    let id = entry.id;
    if (GENERATED_LOADER_ID_MODULES.has(moduleSpecifier)) {
      if (GENERATED_LOADER_ID.test(id)) {
        id = `generated:${moduleSpecifier}`;
      } else if (!(moduleSpecifier === "@deepseek-ai/cordis-plugin-hmr"
        && id === "include:hmr")) {
        fail("graph.generated-loader-id-invalid",
          `generated Loader entry ${moduleSpecifier} has an unexpected ID shape`);
      }
    }
    return {
      id,
      module_specifier: moduleSpecifier,
      group: Boolean(entry.options.group),
      disabled: Boolean(entry.disabled),
      fiber_phase: entry.fiber === undefined ? null : (FIBER_PHASE.get(entry.fiber.state) ?? "unknown"),
    };
  }).sort((a, b) => compareUtf8(a.id, b.id));
}

function emptyCounts() {
  return Object.fromEntries(COUNT_KEYS.map((key) => [key, 0]));
}

export function collectDshGraphSnapshot({ctx, agent, other_agents = [], standing_mount_for,
  preset_root_path, preset_root_selector, composition_selector, composition_sha256}) {
  const activeRows = runtimeRows(ctx);
  const active = new Set(activeRows.map(({fiber}) => fiber));
  const hostEntries = loaderEntries(ctx.loader, "host");
  const hostEntrySet = new Set(hostEntries);
  const hostPrimary = new Map();
  for (const entry of hostEntries) {
    const fiber = primaryFiber(entry, active);
    if (fiber !== undefined) hostPrimary.set(fiber, entry);
  }
  const mount = agent === undefined ? undefined : standing_mount_for(agent.ctx);
  const otherMounts = other_agents.map((item) => standing_mount_for(item.ctx));
  if (otherMounts.some((item) => item === undefined)) {
    fail("graph.agent-mount-missing", "a live Agent has no standing mount");
  }
  // Many Agents intentionally share one standing preset generation. Count its
  // Loader tree once by object identity, while retaining every Agent fiber.
  const uniqueOtherMounts = [...new Set(otherMounts.filter((item) => item !== mount))];
  const presetEntries = mount === undefined ? [] : loaderEntries(mount.tree, "preset");
  const allPresetEntries = [...presetEntries,
    ...uniqueOtherMounts.flatMap((item) => loaderEntries(item.tree, "preset"))];
  const presetEntrySet = new Set(allPresetEntries);
  const presetPrimary = new Map();
  for (const entry of allPresetEntries) {
    const fiber = primaryFiber(entry, active);
    if (fiber !== undefined) presetPrimary.set(fiber, entry);
  }
  const loaderFiber = loaderServiceFiber(ctx);
  if (!active.has(loaderFiber) || loaderFiber.entry !== undefined) {
    fail("graph.loader-bootstrap-invalid", "Loader bootstrap fiber is invalid");
  }
  const isolates = activeRows.filter(({fiber, runtime}) => fiber !== loaderFiber
    && fiber.entry === undefined && fiber.parent?.fiber === loaderFiber && runtime.name === "isolate");
  if (isolates.length !== 1) fail("graph.isolate-bootstrap-ambiguous", "isolate bootstrap is ambiguous");
  const isolateFiber = isolates[0].fiber;
  const counts = emptyCounts();
  const categories = new Map();
  const unknown = [];
  for (const {fiber, runtime} of activeRows) {
    let category;
    if (fiber === loaderFiber) category = "bootstrap-loader";
    else if (fiber === isolateFiber) category = "bootstrap-isolate";
    else if (hostPrimary.has(fiber)) category = "host-primary";
    else if (presetPrimary.has(fiber)) category = "preset-primary";
    else if (fiber.entry !== undefined && hostEntrySet.has(fiber.entry)) category = "host-nested";
    else if (fiber.entry !== undefined && presetEntrySet.has(fiber.entry)) category = "preset-nested";
    else {
      category = "unknown";
      unknown.push({has_entry: fiber.entry !== undefined,
        runtime_name: typeof runtime.name === "string" && runtime.name ? runtime.name : "<unnamed>"});
    }
    counts[category] += 1;
    categories.set(fiber, category);
  }
  unknown.sort((a, b) => compareUtf8(`${a.runtime_name}\0${a.has_entry}`, `${b.runtime_name}\0${b.has_entry}`));
  const presetService = ctx.agentPresets;
  const roots = mount === undefined ? [] : presetService.roots.map((root) => ({
    selector: root.path === preset_root_path ? preset_root_selector : "unrecognized-root",
    trust: root.trust,
  })).sort((a, b) => compareUtf8(a.selector, b.selector));
  const toolNames = agent === undefined ? [] : agent.ctx.tools.schemas(agent)
    .map((tool) => tool.name).sort(compareUtf8);
  const publicValue = {
    schema_version: DSH_GRAPH_OBSERVATION_SCHEMA,
    authority_effect: "none",
    callback_origin: "unproved",
    serving_graph_lock: "not-established",
    host_loader_rows: renderLoaderRows(hostEntries),
    bootstrap_fibers: [
      {id: "bootstrap-isolate", parent_id: "bootstrap-loader", runtime_name: "isolate"},
      {id: "bootstrap-loader", parent_id: null, runtime_name: "loader"},
    ],
    structure: {active_fiber_count: active.size, counts},
    unknown,
    preset: mount === undefined ? null : {
      composition_selector,
      composition_sha256,
      default_id: presetService.defaultId,
      roots,
      rows: renderLoaderRows(presetEntries),
      selected_id: mount.presetId,
    },
    model_tool_names: toolNames,
  };
  return {value: publicValue, active, categories};
}

export function dshGraphCreationDelta(before, after) {
  const counts = emptyCounts();
  let activeFiberCount = 0;
  for (const fiber of after.active) {
    if (before.active.has(fiber)) continue;
    activeFiberCount += 1;
    counts[after.categories.get(fiber) ?? "unknown"] += 1;
  }
  return {active_fiber_count: activeFiberCount, counts};
}

export function compareDshGraphObservation(manifest, observation) {
  const reasons = [];
  const unknown = [...(observation.before?.unknown ?? []), ...(observation.after?.unknown ?? [])];
  if (unknown.some((row) => row.has_entry === false)) {
    return failure("graph.unknown-no-entry-registration");
  }
  else if (unknown.length > 0) reasons.push("graph.unknown-entry-registration");
  if (!same(observation.before?.host_loader_rows, manifest.host_loader_rows)
    || !same(observation.after?.host_loader_rows, manifest.host_loader_rows)) {
    reasons.push("graph.host-loader-rows-mismatch");
  }
  if (!same(observation.before?.bootstrap_fibers, manifest.bootstrap_fibers)
    || !same(observation.after?.bootstrap_fibers, manifest.bootstrap_fibers)) {
    reasons.push("graph.bootstrap-fibers-mismatch");
  }
  if (!same(observation.before?.structure, manifest.structure.before)) {
    reasons.push("graph.before-structure-mismatch");
  }
  if (!same(observation.after?.structure, manifest.structure.after)) {
    reasons.push("graph.after-structure-mismatch");
  }
  if (!same(observation.creation_delta, manifest.structure.creation_delta)) {
    reasons.push("graph.creation-delta-mismatch");
  }
  if (observation.after?.preset === null || observation.after?.preset === undefined) {
    reasons.push("graph.preset-mount-missing");
  } else {
    if (observation.after.preset.selected_id !== manifest.preset.selected_id) {
      reasons.push("graph.preset-selected-mismatch");
    }
    if (observation.after.preset.default_id !== manifest.preset.default_id) {
      reasons.push("graph.preset-default-mismatch");
    }
    if (!same(observation.after.preset.roots, manifest.preset.roots)) {
      reasons.push("graph.preset-roots-mismatch");
    }
    if (observation.after.preset.composition_selector !== manifest.preset.composition_selector
      || observation.after.preset.composition_sha256 !== manifest.preset.composition_sha256) {
      reasons.push("graph.preset-composition-mismatch");
    }
    if (!same(observation.after.preset.rows, manifest.preset.rows)) {
      reasons.push("graph.preset-rows-mismatch");
    }
  }
  if (!same(observation.after?.model_tool_names, manifest.model_tool_names)) {
    reasons.push("graph.model-tools-mismatch");
  }
  if (observation.before?.callback_origin !== "unproved"
    || observation.after?.callback_origin !== "unproved") {
    reasons.push("graph.callback-origin-proved-forbidden");
  }
  return reasons.length === 0 ? success({manifest_id: manifest.manifest_id,
    active_fiber_count: observation.after.structure.active_fiber_count,
    callback_origin: "unproved", serving_graph_lock: "not-established"})
    : failure(...new Set(reasons));
}

export function compareDshHostQualification(manifest, host) {
  const reasons = [];
  if (!same(host?.host_loader_rows, manifest.host_loader_rows)) {
    reasons.push("graph.host-loader-rows-mismatch");
  }
  if (!same(host?.bootstrap_fibers, manifest.bootstrap_fibers)) {
    reasons.push("graph.bootstrap-fibers-mismatch");
  }
  if (!same(host?.structure, manifest.structure.before)) {
    reasons.push("graph.before-structure-mismatch");
  }
  if ((host?.unknown ?? []).length !== 0) reasons.push("graph.unknown-registration");
  if (host?.preset !== null) reasons.push("graph.preset-mounted-before-agent");
  if (!same(host?.model_tool_names, [])) reasons.push("graph.model-tools-mismatch");
  if (host?.callback_origin !== "unproved" || host?.serving_graph_lock !== "not-established") {
    reasons.push("graph.offline-posture-mismatch");
  }
  return reasons.length === 0
    ? success({manifest_id: manifest.manifest_id, host_graph_digest: sha256(canonicalJson(host)),
      active_fiber_count: host.structure.active_fiber_count})
    : failure(...reasons);
}

export async function verifyDshGraphManifest(manifest, options) {
  const runtime = verifyRuntimeTuple(manifest.runtime, options.runtime_tuple);
  if (!runtime.ok) return runtime;
  const source = await verifySourcePins(manifest.source_pins, options.roots, options);
  if (!source.ok) return source;
  const packages = await verifyInstalledPackageSet(manifest.installed_package_set,
    options.roots.node_modules_root, options);
  if (!packages.ok) return packages;
  return success({manifest_id: manifest.manifest_id, runtime: runtime.runtime,
    source_pin_count: source.source_pin_count, ...packages});
}

function success(value = {}) {
  return {schema_version: DSH_GRAPH_RESULT_SCHEMA, ok: true, reason_codes: [],
    authority_effect: "none", callback_origin: "unproved",
    serving_graph_lock: "not-established", ...value};
}

function failure(...reasonCodes) {
  return {schema_version: DSH_GRAPH_RESULT_SCHEMA, ok: false,
    reason_codes: [...new Set(reasonCodes.flat())], authority_effect: "none",
    callback_origin: "unproved", serving_graph_lock: "not-established"};
}
