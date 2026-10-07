import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, readlinkSync, readdirSync, statSync} from "node:fs";
import {dirname, extname, isAbsolute, relative, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";

export const productRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const repositoryRoot = resolve(productRoot, "../../..");
export const projectRoot = resolve(productRoot, "../..");
const PROJECT_PATH_PREFIX = "cyberAlchemy-v2";
export const PRODUCT_CLOSURE_LIMITS = Object.freeze({maximum_files: 4000, maximum_bytes: 80 * 1024 * 1024});
const PRODUCT_PROFILE_VERSIONS = new Set(["are.product-profile/v1", "are.product-profile/v2"]);
const LAYERS = new Set(["core", "extension", "research"]);
const MATURITIES = new Set(["stable", "candidate", "experimental"]);
const INSTALL_POSTURES = new Set(["required", "optional", "development-only"]);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function validateProductProfile(profile) {
  const problems = [];
  if (!profile || typeof profile !== "object" || !PRODUCT_PROFILE_VERSIONS.has(profile.schema_version)) problems.push("product.schema-version-invalid");
  const ids = new Set();
  for (const [kind, records] of [["component", profile?.components], ["integration", profile?.integrations]]) {
    if (!Array.isArray(records)) { problems.push(`product.${kind}s-invalid`); continue; }
    for (const record of records) {
      const id = record?.[`${kind}_id`];
      if (typeof id !== "string" || id.length === 0) problems.push(`product.${kind}-id-invalid`);
      else if (ids.has(id)) problems.push(`product.id-duplicate:${id}`);
      else ids.add(id);
      if (typeof record?.path !== "string" || record.path.length === 0) problems.push(`product.${kind}-path-invalid:${id ?? "unknown"}`);
      if (profile.schema_version === "are.product-profile/v2") {
        if (!LAYERS.has(record.layer)) problems.push(`product.layer-invalid:${id}`);
        if (!MATURITIES.has(record.maturity)) problems.push(`product.maturity-invalid:${id}`);
        if (typeof record.default_enabled !== "boolean") problems.push(`product.default-enabled-invalid:${id}`);
        if (!INSTALL_POSTURES.has(record.install_posture)) problems.push(`product.install-posture-invalid:${id}`);
        if (record.install !== undefined) {
          const install = record.install;
          if (!install || typeof install !== "object" || !["npm-ci"].includes(install.method)
            || typeof install.working_directory !== "string" || typeof install.lockfile !== "string"
            || typeof install.command !== "string" || install.network_policy !== "operator-controlled-no-implicit-download") problems.push(`product.install-contract-invalid:${id}`);
        }
        if (record.layer === "core" && (record.required !== true || record.default_enabled !== true || record.install_posture !== "required")) problems.push(`product.core-contract-invalid:${id}`);
        if (record.layer !== "core" && record.required === true) problems.push(`product.optional-layer-required:${id}`);
        if (record.layer === "research" && record.install_posture !== "development-only") problems.push(`product.research-install-posture-invalid:${id}`);
      }
    }
  }
  return Object.freeze({status: problems.length === 0 ? "PASS" : "FAIL", reason_codes: [...new Set(problems)].sort()});
}

export function normalizeProductProfile(profile) {
  if (profile.schema_version === "are.product-profile/v2") return profile;
  if (profile.schema_version !== "are.product-profile/v1") throw new Error("product.schema-version-invalid");
  const normalize = (record) => ({
    ...record,
    layer: record.required ? "core" : "extension",
    maturity: "candidate",
    default_enabled: record.required === true,
    install_posture: record.required ? "required" : "optional",
  });
  return {...profile, components: profile.components.map(normalize), integrations: profile.integrations.map(normalize), compatibility_source_schema: "are.product-profile/v1"};
}

export function resolveProductSelection(profile, options = {}) {
  const normalized = normalizeProductProfile(profile);
  const requested = new Set(options.include ?? []);
  const records = [...normalized.components, ...normalized.integrations];
  const known = new Set(records.map((record) => record.component_id ?? record.integration_id));
  for (const id of requested) if (!known.has(id)) throw new Error(`product.selection-unknown:${id}`);
  const selected = records.filter((record) => record.layer === "core" || record.default_enabled === true || requested.has(record.component_id ?? record.integration_id));
  if (selected.some((record) => record.layer === "research") && options.development !== true) throw new Error("product.research-requires-development-mode");
  return Object.freeze({
    profile: normalized,
    components: selected.filter((record) => record.component_id),
    integrations: selected.filter((record) => record.integration_id),
    selection: [...selected.map((record) => record.component_id ?? record.integration_id)].sort(),
    mode: options.development === true ? "development" : "product",
  });
}

function directory(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function withinProject(path) {
  const remainder = relative(projectRoot, resolve(path));
  return remainder === "" || (remainder !== ".." && !remainder.startsWith(`..${sep}`) && !isAbsolute(remainder));
}

export function resolveProductSourcePath(reference) {
  if (typeof reference !== "string" || reference.length === 0 || isAbsolute(reference)) {
    throw new Error("product.source-path-invalid");
  }
  const normalized = reference.replaceAll("\\", "/");
  const projectRelative = normalized === PROJECT_PATH_PREFIX ? ""
    : normalized.startsWith(`${PROJECT_PATH_PREFIX}/`) ? normalized.slice(PROJECT_PATH_PREFIX.length + 1) : normalized;
  const source = resolve(projectRoot, projectRelative);
  if (!withinProject(source)) throw new Error("product.source-path-outside-project");
  return source;
}

export function packagedProductPath(path) {
  if (!withinProject(path)) throw new Error("product.source-path-outside-project");
  const remainder = relative(projectRoot, resolve(path)).split(sep).join("/");
  return remainder ? `${PROJECT_PATH_PREFIX}/${remainder}` : PROJECT_PATH_PREFIX;
}

function exclusionApplies(repositoryPath, exclusion) {
  if (exclusion === "/evidence/" && (repositoryPath.includes("/test/evidence/") || repositoryPath.endsWith("/test/evidence"))) return false;
  return `${repositoryPath}/`.includes(exclusion);
}

function collectFiles(root, exclusions, output = []) {
  for (const entry of readdirSync(root, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(root, entry.name);
    const repositoryPath = packagedProductPath(path);
    if (exclusions.some((exclusion) => exclusionApplies(repositoryPath, exclusion))) continue;
    if (entry.isDirectory()) collectFiles(path, exclusions, output);
    else if (entry.isFile()) output.push(path);
  }
  return output;
}

function repositoryFile(path) {
  return withinProject(path);
}

function relativeModuleSpecifiers(source) {
  const found = [];
  const staticPattern = /\b(?:import|export)\s+(?:[^;"']*?\s+from\s*)?["'](\.{1,2}\/[^"']+)["']/gu;
  const dynamicPattern = /\bimport\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/gu;
  const localUrlPattern = /\bnew\s+URL\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*,\s*import\.meta\.url\s*,?\s*\)/gu;
  for (const pattern of [staticPattern, dynamicPattern, localUrlPattern]) {
    for (const match of source.matchAll(pattern)) found.push(match[1]);
  }
  return found;
}

function resolveModuleDependencies(importer, specifier) {
  const base = resolve(dirname(importer), specifier);
  const candidates = [base, `${base}.mjs`, `${base}.js`, `${base}.json`, resolve(base, "index.mjs"), resolve(base, "index.js")];
  const file = candidates.find((candidate) => {
    try { return statSync(candidate).isFile() && repositoryFile(candidate); } catch { return false; }
  });
  if (file) return [file];
  if (base.startsWith(`${productRoot}${sep}`) && directory(base)) return collectFiles(base, []);
  return [];
}

function declaredRepositoryFileDependencies(source) {
  const dependencies = [];
  const candidates = [];
  for (const match of source.matchAll(/\bpath\s*:\s*["']([^"']+)["']/gu)) candidates.push(match[1]);
  for (const match of source.matchAll(/["']((?:agent-routing|authority|capability|define|development|goals|implementation|language|ontology|tools)\/[^"']+)["']/gu)) candidates.push(match[1]);
  for (const candidatePath of candidates) {
    // Source-text discovery is not a path parser. Escaped regex/string
    // fragments such as /path: "\\/disposable\\/root"/ are not repository refs.
    if (candidatePath.startsWith("/") || candidatePath.includes("..")
      || candidatePath.includes("\\")) continue;
    const candidate = resolveProductSourcePath(candidatePath);
    try {
      if (statSync(candidate).isFile() && repositoryFile(candidate)) dependencies.push(candidate);
    } catch {}
  }
  return dependencies;
}

function isExcluded(path, exclusions) {
  const repositoryPath = packagedProductPath(path);
  return exclusions.some((exclusion) => exclusionApplies(repositoryPath, exclusion));
}

function expandRelativeModuleClosure(seedFiles, exclusions) {
  const files = new Set(seedFiles.map((path) => resolve(path)));
  const queue = [...files];
  while (queue.length > 0) {
    const path = queue.shift();
    if (![".js", ".mjs", ".rs"].includes(extname(path))) continue;
    let source;
    try { source = readFileSync(path, "utf8"); } catch { continue; }
    for (const specifier of relativeModuleSpecifiers(source)) {
      for (const dependency of resolveModuleDependencies(path, specifier)) {
        if (files.has(dependency) || isExcluded(dependency, exclusions)) continue;
        files.add(dependency);
        queue.push(dependency);
      }
    }
    for (const dependency of declaredRepositoryFileDependencies(source)) {
      if (files.has(dependency) || isExcluded(dependency, exclusions)) continue;
      files.add(dependency);
      queue.push(dependency);
    }
  }
  return [...files];
}

function packagedVerifierFiles(profile) {
  if (!profile.components.some((component) => component.component_id === "module-port-governance-cutover")) return [];
  const packageRoot = resolve(productRoot, "packages/module-port-governance-binding-rust");
  const manifestPath = resolve(packageRoot, "artifacts/linux-x64/manifest.json");
  if (!existsSync(manifestPath)) throw new Error("product.packaged-verifier-manifest-missing");
  const manifest = readJson(manifestPath);
  const declaredSources = (manifest.source_files ?? []).map((entry) => {
    return resolveProductSourcePath(entry.path);
  });
  const buildSupport = [
    resolve(projectRoot, "tools/toolchain/run"),
    resolve(projectRoot, "tools/toolchain/lock.json"),
    resolve(projectRoot, "tools/toolchain/compiler.sh"),
    resolve(projectRoot, "tools/toolchain/README.md"),
  ];
  return [
    ...collectFiles(packageRoot, profile.closure_exclusions),
    ...declaredSources,
    ...buildSupport,
  ];
}

function collectSourceBindingPaths(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectSourceBindingPaths(item, output);
    return output;
  }
  if (!value || typeof value !== "object") return output;
  if (typeof value.path === "string" && value.path.length > 0) output.push(resolveProductSourcePath(value.path));
  for (const [key, item] of Object.entries(value)) {
    if (key !== "path") collectSourceBindingPaths(item, output);
  }
  return output;
}

function repositoryProfileFiles(profile, selectedComponents) {
  if (!selectedComponents.some((component) => component.component_id === "codex-app-server-wrapper")) return [];
  const repositoryProfilePath = resolve(productRoot, profile.repository_profile);
  const repositoryProfile = readJson(repositoryProfilePath);
  const sourceFiles = collectSourceBindingPaths(repositoryProfile.sources ?? {});
  const decisionProfilePath = repositoryProfile.sources?.decision_profile?.path;
  if (typeof decisionProfilePath === "string") {
    const decisionProfile = readJson(resolveProductSourcePath(decisionProfilePath));
    sourceFiles.push(...collectSourceBindingPaths(decisionProfile.provenance ?? []));
  }
  return [repositoryProfilePath, ...sourceFiles];
}

function externalTestSupportFiles() {
  const routeAvailabilityBundle = resolve(productRoot, "packages/request-decision-router/generated/route-availability");
  const codexProtocolEvidence = resolve(projectRoot, "development/agent-reasoning-engine/codex-integration/evidence");
  const systemOntologyRoot = resolve(projectRoot, "define/system-ontology");
  const defineCatalog = resolve(projectRoot, "define/definitions.json");
  return [
    ...collectFiles(routeAvailabilityBundle, []),
    ...collectFiles(codexProtocolEvidence, []),
    defineCatalog,
    ...["PROFILE.json", "NODES.json", "RELATIONS.json"].map((name) => resolve(systemOntologyRoot, name)),
  ];
}

export function materializeProductClosure(options = {}) {
  const rawProfile = readJson(resolve(productRoot, "product.json"));
  const validation = validateProductProfile(rawProfile);
  if (validation.status !== "PASS") throw new Error(validation.reason_codes.join(","));
  const {profile, components, integrations, selection, mode} = resolveProductSelection(rawProfile, options);
  const directoryRoots = profile.source_roots.map(resolveProductSourcePath);
  const fileRoots = (profile.source_files ?? []).map(resolveProductSourcePath);
  const seeds = [...new Set([
    ...directoryRoots.flatMap((root) => collectFiles(root, profile.closure_exclusions)),
    ...components.flatMap((component) => collectFiles(resolve(productRoot, component.path), [
      ...profile.closure_exclusions,
      ...(component.closure_exclusions ?? []).map((path) => `/${component.path}/${path}/`),
    ])),
    ...integrations.flatMap((integration) => collectFiles(resolve(productRoot, integration.path), profile.closure_exclusions)),
    ...fileRoots,
    ...packagedVerifierFiles(profile),
    ...repositoryProfileFiles(profile, components),
    ...externalTestSupportFiles(),
  ])];
  const files = expandRelativeModuleClosure(seeds, profile.closure_exclusions);
  const entries = files.map((path) => {
    const bytes = readFileSync(path);
    const metadata = lstatSync(path);
    return {
      path: packagedProductPath(path),
      bytes: bytes.length,
      sha256: sha256(bytes),
      mode: statSync(path).mode & 0o777,
      ...(metadata.isSymbolicLink() ? {kind: "symlink", link_target: readlinkSync(path)} : {}),
    };
  }).sort((a, b) => a.path.localeCompare(b.path));
  const forbidden = entries.filter((entry) => entry.path.startsWith("domainspec-core/")
    || entry.path.includes("/language/capabilities/alchlang/"));
  if (forbidden.length > 0) throw new Error(`product.external-language-dependency:${forbidden.map((entry) => entry.path).slice(0, 20).join(",")}`);
  const installContracts = components.filter((component) => component.install).map((component) => ({component_id: component.component_id, ...component.install}));
  const material = {schema_version: "are.product-source-closure/v2", product_id: profile.product_id, product_version: profile.version, selection, mode, install_contracts: installContracts, files: entries, authority_effect: "none"};
  return Object.freeze({...material, closure_digest: sha256(JSON.stringify(material))});
}

export function inspectProduct(options = {}) {
  const profilePath = resolve(productRoot, "product.json");
  const rawProfile = readJson(profilePath);
  const profileValidation = validateProductProfile(rawProfile);
  const profile = normalizeProductProfile(rawProfile);
  const problems = [...profileValidation.reason_codes];
  if (profile.status !== "stability-candidate") problems.push("product.status-invalid");
  if (profile.authority_effect !== "none") problems.push("product.authority-effect-invalid");
  let selection;
  try { selection = resolveProductSelection(profile, options); } catch (error) {
    problems.push(error.message);
    selection = {components: [], integrations: [], selection: [], mode: options.development === true ? "development" : "product"};
  }
  const componentStates = profile.components.map((component) => {
    const path = resolve(productRoot, component.path);
    const present = directory(path);
    if (component.required && !present) problems.push(`product.component-missing:${component.component_id}`);
    let packageName = null;
    try { packageName = readJson(resolve(path, "package.json")).name ?? null; } catch {
      if (component.required) problems.push(`product.component-package-invalid:${component.component_id}`);
    }
    return {component_id: component.component_id, path, present, package_name: packageName, layer: component.layer, maturity: component.maturity, default_enabled: component.default_enabled, install_posture: component.install_posture, selected: selection.components.some((item) => item.component_id === component.component_id)};
  });
  const integrationStates = profile.integrations.map((integration) => {
    const path = resolve(productRoot, integration.path);
    const present = directory(path);
    if (integration.required && !present) problems.push(`product.integration-missing:${integration.integration_id}`);
    return {integration_id: integration.integration_id, path, present, layer: integration.layer, maturity: integration.maturity, default_enabled: integration.default_enabled, install_posture: integration.install_posture, selected: selection.integrations.some((item) => item.integration_id === integration.integration_id)};
  });
  const repositoryProfileSelected = selection.components.some((component) => component.component_id === "codex-app-server-wrapper");
  const runtimeMatches = process.versions.node === profile.node_runtime;
  if (options.require_exact_runtime === true && !runtimeMatches) problems.push("product.node-runtime-mismatch");
  let sourceClosure;
  try { sourceClosure = materializeProductClosure(options); } catch (error) {
    problems.push(error.message);
    sourceClosure = {closure_digest: null, files: []};
  }
  return Object.freeze({
    schema_version: "are.product-health/v1",
    status: problems.length === 0 ? "PASS" : "FAIL",
    product_id: profile.product_id,
    product_version: profile.version,
    product_status: profile.status,
    node: {expected: profile.node_runtime, observed: process.versions.node, exact_match: runtimeMatches},
    profile_schema: {source: rawProfile.schema_version, effective: profile.schema_version, compatibility_source: profile.compatibility_source_schema ?? null},
    selection: {mode: selection.mode, ids: selection.selection},
    repository_profile: {path: resolve(productRoot, profile.repository_profile), selected: repositoryProfileSelected, verification: repositoryProfileSelected ? "owned-by-selected-component" : "not-selected"},
    components: componentStates,
    integrations: integrationStates,
    source_closure: {closure_digest: sourceClosure.closure_digest, file_count: sourceClosure.files.length, total_bytes: sourceClosure.files.reduce((sum, entry) => sum + entry.bytes, 0)},
    reason_codes: [...new Set(problems)].sort(),
    authority_effect: "none",
  });
}
