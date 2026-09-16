import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {basename, dirname, resolve} from "node:path";

import {materializeProductClosure, productRoot, repositoryRoot} from "./product.mjs";

const repositoryPath = (path) => resolve(path).slice(repositoryRoot.length + 1).replaceAll("\\", "/");
const isWithin = (path, root) => path === root || path.startsWith(`${root}/`);
const isNodeTest = (path) => basename(path).endsWith(".test.mjs") || basename(path) === "test.mjs";

export function materializeProductTestPlan() {
  const profile = JSON.parse(readFileSync(resolve(productRoot, "product.json"), "utf8"));
  const closure = materializeProductClosure();
  const owners = [
    {target_id: "product", path: productRoot, runner: "node-test"},
    ...profile.components.map((component) => ({target_id: `component:${component.component_id}`, path: resolve(productRoot, component.path), runner: "node-test"})),
    ...profile.integrations.map((integration) => ({target_id: `integration:${integration.integration_id}`, path: resolve(productRoot, integration.path), runner: "node-test"})),
  ].sort((left, right) => right.path.length - left.path.length);
  const suites = new Map();
  const unowned = [];
  for (const entry of closure.files.filter((file) => isNodeTest(file.path))) {
    const absolute = resolve(repositoryRoot, entry.path);
    const owner = owners.find((candidate) => isWithin(absolute, candidate.path));
    if (!owner) { unowned.push(entry.path); continue; }
    const current = suites.get(owner.target_id) ?? {...owner, test_files: []};
    current.test_files.push(absolute);
    suites.set(owner.target_id, current);
  }
  const rustManifests = closure.files.filter((file) => file.path.endsWith("/Cargo.toml") && file.path.includes("/module-port-governance-binding-rust/"));
  for (const entry of rustManifests) {
    const manifest = resolve(repositoryRoot, entry.path);
    suites.set("derived:module-port-governance-binding-rust", {
      target_id: "derived:module-port-governance-binding-rust",
      path: dirname(manifest),
      runner: "cargo-test",
      manifest,
      test_files: [manifest],
    });
  }
  const productPackageTests = closure.files.filter((file) => file.path.startsWith("cyberAlchemy-v2/agent-reasoning-engine/tests/") && basename(file.path).startsWith("test_") && file.path.endsWith(".py"));
  if (productPackageTests.length > 0) {
    const path = resolve(productRoot, "../../agent-reasoning-engine");
    suites.set("integration:are-product-package", {
      target_id: "integration:are-product-package",
      path,
      runner: "python-unittest",
      test_files: productPackageTests.map((entry) => resolve(repositoryRoot, entry.path)),
    });
  }
  const normalized = [...suites.values()].map((suite) => ({
    ...suite,
    target_ref: repositoryPath(suite.path),
    test_files: suite.test_files.sort(),
    test_refs: suite.test_files.map(repositoryPath).sort(),
    ...(suite.manifest ? {manifest_ref: repositoryPath(suite.manifest)} : {}),
  })).sort((left, right) => left.target_id.localeCompare(right.target_id));
  const material = {
    schema_version: "are.product-test-plan/v1",
    source_closure_digest: closure.closure_digest,
    suites: normalized.map(({target_id, target_ref, runner, test_refs, manifest_ref}) => ({target_id, target_ref, runner, test_refs, ...(manifest_ref ? {manifest_ref} : {})})),
    unowned_test_files: unowned.sort(),
    authority_effect: "none",
  };
  return Object.freeze({...material, plan_digest: createHash("sha256").update(JSON.stringify(material)).digest("hex"), runtime_suites: normalized});
}
