import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, readlinkSync, readdirSync, statSync} from "node:fs";
import {dirname, extname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {loadRepositoryProfile} from "../packages/codex-app-server-wrapper/index.mjs";

export const productRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const repositoryRoot = resolve(productRoot, "../../..");
export const projectRoot = resolve(productRoot, "../..");
export const PRODUCT_CLOSURE_LIMITS = Object.freeze({maximum_files: 4000, maximum_bytes: 80 * 1024 * 1024});

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function directory(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function collectFiles(root, exclusions, output = []) {
  for (const entry of readdirSync(root, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(root, entry.name);
    const repositoryPath = path.slice(repositoryRoot.length).replaceAll("\\", "/");
    if (exclusions.some((exclusion) => `${repositoryPath}/`.includes(exclusion))) continue;
    if (entry.isDirectory()) collectFiles(path, exclusions, output);
    else if (entry.isFile()) output.push(path);
  }
  return output;
}

function repositoryFile(path) {
  const absolute = resolve(path);
  return absolute === repositoryRoot || absolute.startsWith(`${repositoryRoot}/`);
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
  if (base.startsWith(`${productRoot}/`) && directory(base)) return collectFiles(base, []);
  return [];
}

function declaredRepositoryFileDependencies(source) {
  const dependencies = [];
  const candidates = [];
  for (const match of source.matchAll(/\bpath\s*:\s*["']([^"']+)["']/gu)) candidates.push(match[1]);
  for (const match of source.matchAll(/["']((?:agent-routing|authority|capability|define|development|goals|implementation|language|ontology|tools)\/[^"']+)["']/gu)) candidates.push(match[1]);
  for (const candidatePath of candidates) {
    if (candidatePath.startsWith("/") || candidatePath.includes("..")) continue;
    for (const root of [projectRoot, repositoryRoot]) {
      const candidate = resolve(root, candidatePath);
      try {
        if (statSync(candidate).isFile() && repositoryFile(candidate)) dependencies.push(candidate);
      } catch {}
    }
  }
  return dependencies;
}

function expandRelativeModuleClosure(seedFiles) {
  const files = new Set(seedFiles.map((path) => resolve(path)));
  const queue = [...files];
  while (queue.length > 0) {
    const path = queue.shift();
    if (![".js", ".mjs", ".rs"].includes(extname(path))) continue;
    let source;
    try { source = readFileSync(path, "utf8"); } catch { continue; }
    for (const specifier of relativeModuleSpecifiers(source)) {
      for (const dependency of resolveModuleDependencies(path, specifier)) {
        if (files.has(dependency)) continue;
        files.add(dependency);
        queue.push(dependency);
      }
    }
    for (const dependency of declaredRepositoryFileDependencies(source)) {
      if (files.has(dependency)) continue;
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
    const repositoryRelative = resolve(repositoryRoot, entry.path);
    return existsSync(repositoryRelative) ? repositoryRelative : resolve(projectRoot, entry.path);
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
  if (typeof value.path === "string" && value.path.length > 0) output.push(resolve(repositoryRoot, value.path));
  for (const [key, item] of Object.entries(value)) {
    if (key !== "path") collectSourceBindingPaths(item, output);
  }
  return output;
}

function repositoryProfileFiles(profile) {
  const repositoryProfilePath = resolve(productRoot, profile.repository_profile);
  const repositoryProfile = readJson(repositoryProfilePath);
  const sourceFiles = collectSourceBindingPaths(repositoryProfile.sources ?? {});
  const decisionProfilePath = repositoryProfile.sources?.decision_profile?.path;
  if (typeof decisionProfilePath === "string") {
    const decisionProfile = readJson(resolve(repositoryRoot, decisionProfilePath));
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

export function materializeProductClosure() {
  const profile = readJson(resolve(productRoot, "product.json"));
  const componentRoots = profile.components.map((component) => resolve(productRoot, component.path));
  const integrationRoots = profile.integrations.map((integration) => resolve(productRoot, integration.path));
  const directoryRoots = profile.source_roots.map((root) => resolve(repositoryRoot, root));
  const fileRoots = (profile.source_files ?? []).map((file) => resolve(repositoryRoot, file));
  const seeds = [...new Set([
    ...directoryRoots.flatMap((root) => collectFiles(root, profile.closure_exclusions)),
    ...componentRoots.flatMap((root) => collectFiles(root, profile.closure_exclusions)),
    ...integrationRoots.flatMap((root) => collectFiles(root, profile.closure_exclusions)),
    ...fileRoots,
    ...packagedVerifierFiles(profile),
    ...repositoryProfileFiles(profile),
    ...externalTestSupportFiles(),
  ])];
  const files = expandRelativeModuleClosure(seeds);
  const entries = files.map((path) => {
    const bytes = readFileSync(path);
    const metadata = lstatSync(path);
    return {
      path: path.slice(repositoryRoot.length + 1).replaceAll("\\", "/"),
      bytes: bytes.length,
      sha256: sha256(bytes),
      mode: statSync(path).mode & 0o777,
      ...(metadata.isSymbolicLink() ? {kind: "symlink", link_target: readlinkSync(path)} : {}),
    };
  }).sort((a, b) => a.path.localeCompare(b.path));
  const forbidden = entries.filter((entry) => entry.path.startsWith("domainspec-core/")
    || entry.path.includes("/language/capabilities/alchlang/"));
  if (forbidden.length > 0) throw new Error(`product.external-language-dependency:${forbidden.map((entry) => entry.path).slice(0, 20).join(",")}`);
  const material = {schema_version: "are.product-source-closure/v1", product_id: profile.product_id, product_version: profile.version, files: entries, authority_effect: "none"};
  return Object.freeze({...material, closure_digest: sha256(JSON.stringify(material))});
}

export function inspectProduct(options = {}) {
  const profilePath = resolve(productRoot, "product.json");
  const profile = readJson(profilePath);
  const problems = [];
  if (profile.schema_version !== "are.product-profile/v1") problems.push("product.schema-version-invalid");
  if (profile.status !== "stability-candidate") problems.push("product.status-invalid");
  if (profile.authority_effect !== "none") problems.push("product.authority-effect-invalid");
  const componentStates = profile.components.map((component) => {
    const path = resolve(productRoot, component.path);
    const present = directory(path);
    if (component.required && !present) problems.push(`product.component-missing:${component.component_id}`);
    let packageName = null;
    try { packageName = readJson(resolve(path, "package.json")).name ?? null; } catch {
      if (component.required) problems.push(`product.component-package-invalid:${component.component_id}`);
    }
    return {component_id: component.component_id, path, present, package_name: packageName};
  });
  const integrationStates = profile.integrations.map((integration) => {
    const path = resolve(productRoot, integration.path);
    const present = directory(path);
    if (integration.required && !present) problems.push(`product.integration-missing:${integration.integration_id}`);
    return {integration_id: integration.integration_id, path, present};
  });
  const loaded = loadRepositoryProfile(resolve(productRoot, profile.repository_profile), repositoryRoot);
  if (!loaded.ok) problems.push(...(loaded.reason_codes ?? ["product.repository-profile-invalid"]));
  const runtimeMatches = process.versions.node === profile.node_runtime;
  if (options.require_exact_runtime === true && !runtimeMatches) problems.push("product.node-runtime-mismatch");
  const sourceClosure = materializeProductClosure();
  return Object.freeze({
    schema_version: "are.product-health/v1",
    status: problems.length === 0 ? "PASS" : "FAIL",
    product_id: profile.product_id,
    product_version: profile.version,
    product_status: profile.status,
    node: {expected: profile.node_runtime, observed: process.versions.node, exact_match: runtimeMatches},
    repository_profile: {path: resolve(productRoot, profile.repository_profile), verified: loaded.ok === true, profile_id: loaded.ok ? loaded.value.profile_id : null},
    components: componentStates,
    integrations: integrationStates,
    source_closure: {closure_digest: sourceClosure.closure_digest, file_count: sourceClosure.files.length, total_bytes: sourceClosure.files.reduce((sum, entry) => sum + entry.bytes, 0)},
    reason_codes: [...new Set(problems)].sort(),
    authority_effect: "none",
  });
}
