import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

type Obj = { [key: string]: any };
const sourceFile = fileURLToPath(import.meta.url);
const root = resolve(dirname(sourceFile), "../..");
const bindingPath = join(root, "evidence/construction-binding.candidate.json");

function hash(algorithm: "sha1" | "sha256", bytes: Buffer | string): string { return createHash(algorithm).update(bytes).digest("hex"); }
function fail(message: string): never { throw new Error(`ALCHLANG_OPERATION_PATTERN_BINDING:${message}`); }
function assert(condition: unknown, message: string): asserts condition { if (!condition) fail(message); }
function readJson(path: string, label: string): Obj {
  let bytes: string; try { bytes = readFileSync(path, "utf8"); } catch (error) { fail(`missing:${label}:${String(error)}`); }
  let value: unknown; try { value = JSON.parse(bytes); } catch (error) { fail(`invalid-json:${label}:${String(error)}`); }
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `not-object:${label}`); return value as Obj;
}
function locate(ref: string, label: string): string {
  assert(typeof ref === "string" && ref.length > 0, `invalid-ref:${label}`); const path = resolve(root, ref);
  assert(path === root || path.startsWith(`${root}${sep}`), `out-of-scope:${label}:${ref}`); return path;
}
function bound(row: Obj, label: string): Obj {
  assert(typeof row?.sha256 === "string" && /^[0-9a-f]{64}$/.test(row.sha256), `invalid-digest:${label}`);
  const path = locate(row.ref, label); assert(hash("sha256", readFileSync(path)) === row.sha256, `drift:${label}`); return readJson(path, label);
}
function filesUnder(base: string): string[] {
  const visit = (dir: string): string[] => readdirSync(dir).sort().flatMap((name) => { const path = join(dir, name); return statSync(path).isDirectory() ? visit(path) : [relative(base, path).split(sep).join("/")]; });
  return visit(base);
}
function tree(base: string, paths: string[]): string { return hash("sha256", `${[...paths].sort().map((p) => `${p}:${hash("sha256", readFileSync(join(base, p)))}`).join("\n")}\n`); }
function complete(row: Obj, label: string): { base: string; paths: string[]; digest: string } {
  assert(row.set === "complete-tree", `set-mode:${label}`); const base = locate(row.root, label); const paths = filesUnder(base);
  assert(paths.length === row.file_count, `file-count:${label}:${paths.length}:${row.file_count}`); const digest = tree(base, paths);
  assert(digest === row.tree_sha256, `tree-drift:${label}`); return { base, paths, digest };
}
function implementationSet(row: Obj): { base: string; paths: string[]; digest: string } {
  assert(row.set === "package.json+tsconfig.json+tsconfig.build.json+complete(src,test,examples)", "implementation-set-mode");
  const base = locate(row.root, "implementation"); const paths = ["package.json", "tsconfig.build.json", "tsconfig.json", ...["examples", "src", "test"].flatMap((dir) => filesUnder(join(base, dir)).map((p) => `${dir}/${p}`))].sort();
  assert(paths.length === row.file_count, `file-count:implementation:${paths.length}:${row.file_count}`); const digest = tree(base, paths);
  assert(digest === row.tree_sha256, "tree-drift:implementation"); return { base, paths, digest };
}
function stable(value: any): any { return Array.isArray(value) ? value.map(stable) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])) : value; }
function same(left: unknown, right: unknown, label: string): void { assert(JSON.stringify(stable(left)) === JSON.stringify(stable(right)), `mismatch:${label}`); }

const binding = readJson(bindingPath, "binding");
assert(binding.schema_version === "cav2.alchlang.local-runtime-cli.construction-binding/v1-candidate", "schema-version");
assert(binding.binding_id === "CA2-BIND-ALCHLANG-LOCAL-RUNTIME-CLI-V1-001", "binding-id");
assert(binding.status === "candidate-pending-independent-conformance", "candidate-status");
assert(binding.ontology_id === "cav2.alchlang.local-runtime-cli.business", "ontology-id");
assert(binding.authority_effect === "none" && binding.d65_chain?.conformance === null, "authority-or-conformance");
assert(binding.execution_context?.route === "CA2-ROUTE-IMPLEMENT" && binding.execution_context?.mode === "owner-directed-native-inline" && binding.execution_context?.helper_count === 0, "execution-context");
assert(binding.execution_context?.scope === "durable-sqlite-transactional-outbox-and-confirmed-http-integration", "execution-scope");
const d65 = binding.d65_chain as Obj;

const acceptance = bound(d65.immutable_predecessor_decision, "acceptance");
const carrierAcceptance = bound(d65.carrier_contract_decision, "carrier-acceptance");
const profile = bound(d65.accepted_predecessor_package.profile, "profile");
const originalCapability = bound(d65.accepted_predecessor_package.original_product_capability, "original-capability");
const originalNodes = bound(d65.accepted_predecessor_package.original_business_ontology_nodes, "original-nodes");
const originalRelations = bound(d65.accepted_predecessor_package.original_business_ontology_relations, "original-relations");
const carrier = bound(d65.accepted_predecessor_package.carrier_contract, "carrier");
const extensionCapability = bound(d65.extension_product_capability, "extension-capability");
const extensionOntology = bound(d65.extension_business_ontology, "extension-ontology");
const patternExtension = complete(d65.operation_pattern_extension, "operation-pattern-extension");
const patternCapability = bound(d65.operation_pattern_extension.product_capability, "pattern-capability");
const patternOntology = bound(d65.operation_pattern_extension.business_ontology, "pattern-ontology");
const patternRegistry = bound(d65.operation_pattern_extension.registry, "pattern-registry");
bound(d65.operation_pattern_extension.schema, "pattern-schema");
bound(d65.operation_pattern_extension.sources, "pattern-sources");
const providerCandidate = bound(d65.operation_pattern_extension.provider_runtime_candidate, "provider-runtime-candidate");
assert(providerCandidate.provider_id === d65.operation_pattern_extension.provider_runtime_candidate.provider_id && providerCandidate.status === "candidate-local-runtime-validated" && providerCandidate.authority_effect === "none", "provider-runtime-candidate-declaration");
assert(acceptance.decision === "accept-exact-predecessor-package" && acceptance.decision_id === d65.immutable_predecessor_decision.decision_id, "acceptance-declaration");
const accepted = new Map((acceptance.accepted_material?.files ?? []).map((row: Obj) => [row.path, row.sha256]));
for (const [path, row] of [["profile.json", d65.accepted_predecessor_package.profile], ["product-capability.json", d65.accepted_predecessor_package.original_product_capability], ["nodes.json", d65.accepted_predecessor_package.original_business_ontology_nodes], ["relations.json", d65.accepted_predecessor_package.original_business_ontology_relations]] as Array<[string, Obj]>) assert(accepted.get(path) === row.sha256, `accepted-byte:${path}`);
assert(carrierAcceptance.decision === "accept-exact-carrier-contract-successor" && carrierAcceptance.decision_id === d65.carrier_contract_decision.decision_id, "carrier-acceptance-declaration");
const acceptedCarrier = new Map((carrierAcceptance.accepted_material?.files ?? []).map((row: Obj) => [row.path, row.sha256]));
assert(acceptedCarrier.get("carrier-v2.contract.json") === d65.accepted_predecessor_package.carrier_contract.sha256, "accepted-byte:carrier-v2.contract.json");
assert(profile.authority_effect === "none" && carrier.authority_effect === "none", "predecessor-authority");
assert(originalCapability.capability_id === d65.accepted_predecessor_package.original_product_capability.capability_id && originalCapability.authority_effect === "none", "original-capability-declaration");
const originalIds = new Set((originalNodes.nodes ?? []).map((row: Obj) => row.id)); for (const row of originalRelations.relations ?? []) assert(originalIds.has(row.source) && originalIds.has(row.target), `original-edge:${row.id}`);
assert(extensionCapability.capability_id === d65.extension_product_capability.capability_id && extensionCapability.extends_capability_ref === originalCapability.capability_id, "extension-capability-declaration");
assert(extensionCapability.authority_effect === "none" && extensionOntology.authority_effect === "none" && extensionOntology.ontology_id === binding.ontology_id, "extension-authority-or-id");
const extensionIds = new Set((extensionOntology.nodes ?? []).map((row: Obj) => row.id)); for (const row of extensionOntology.relations ?? []) assert(extensionIds.has(row.source) && extensionIds.has(row.target), `extension-edge:${row.id}`);
assert(patternExtension.paths.includes("ARCHITECTURE.md") && patternExtension.paths.includes("ARCHITECTURE-PATTERN-LIBRARY.md") && patternExtension.paths.includes("pattern-library/TESTING-ALIGNMENT.md"), "pattern-architecture-package");
assert(patternCapability.capability_id === d65.operation_pattern_extension.product_capability.capability_id && patternCapability.extends_capability_ref === extensionCapability.capability_id && patternCapability.authority_effect === "none", "pattern-capability-declaration");
assert(patternOntology.ontology_id === d65.operation_pattern_extension.business_ontology.ontology_id && patternOntology.authority_effect === "none", "pattern-ontology-declaration");
const patternIds = new Set((patternOntology.nodes ?? []).map((row: Obj) => row.id)); for (const row of patternOntology.relations ?? []) assert(patternIds.has(row.source) && patternIds.has(row.target), `pattern-edge:${row.id}`);
assert(patternRegistry.registry_id === d65.operation_pattern_extension.registry.registry_id && patternRegistry.authority_effect === "none", "pattern-registry-declaration");
for (const pattern of patternRegistry.patterns ?? []) {
  const derived = [pattern.meta_type, pattern.integration_binding, pattern.generator, pattern.conformance].every((item: Obj) => item.status === "closed") ? "available" : "blocked";
  assert(pattern.availability === derived, `pattern-availability:${pattern.pattern_id}`);
  assert(pattern.architecture_pattern_status !== "stable", `unowned-stable-pattern:${pattern.pattern_id}`);
  assert(pattern.availability === "available" ? pattern.blockers.length === 0 : pattern.blockers.length > 0, `pattern-blockers:${pattern.pattern_id}`);
}

const source = complete(d65.domainspec_authored_source, "domainspec");
const project = readJson(join(source.base, "project.json"), "domainspec-project"); same(project.features, ["general-compiler", "local-runtime-cli", "operation-pattern-registry"], "domainspec-features");
const generated = complete(d65.compiled_projections, "generated"); same(generated.paths, ["domain.graph.json", "system-ontology.json", "traceability.json"], "generated-files");
const receipt = bound(d65.compiled_projections.generation_receipt, "generation-receipt"); const graph = bound(d65.compiled_projections.compiled_graph, "graph"); const system = bound(d65.compiled_projections.system_ontology, "system"); const trace = bound(d65.compiled_projections.traceability, "trace");
assert(receipt.inputs?.domainspec_source_tree_sha256 === source.digest && receipt.inputs?.domainspec_source_manifest_sha256 === d65.domainspec_authored_source.source_manifest_sha256, "receipt-source");
assert(receipt.outputs?.["domain.graph.json"] === d65.compiled_projections.compiled_graph.sha256 && receipt.outputs?.["system-ontology.json"] === d65.compiled_projections.system_ontology.sha256 && receipt.outputs?.["traceability.json"] === d65.compiled_projections.traceability.sha256, "receipt-outputs");
assert(receipt.deterministic_replay === "PASS" && receipt.authority_effect === "none", "receipt-posture");
assert(graph.source_manifest?.source_count === source.paths.length && graph.source_manifest?.manifest_sha256 === d65.domainspec_authored_source.source_manifest_sha256, "graph-source");
assert(system.source_graph_sha256 === d65.compiled_projections.compiled_graph.sha256 && system.authority_effect === "none", "system-binding");
assert(trace.source_manifest_sha256 === d65.domainspec_authored_source.source_manifest_sha256 && trace.compiled_graph_sha256 === d65.compiled_projections.compiled_graph.sha256 && trace.system_ontology_sha256 === d65.compiled_projections.system_ontology.sha256 && trace.authority_effect === "none", "trace-binding");

const implementation = d65.exact_implementation as Obj; const material = implementationSet(implementation.source_config_tests_example); const dist = complete(implementation.built_dist, "dist");
const packagePath = locate(implementation.package.manifest_ref, "package"); assert(hash("sha256", readFileSync(packagePath)) === implementation.package.manifest_sha256, "package-drift"); const pkg = readJson(packagePath, "package");
assert(pkg.name === implementation.package.name && pkg.version === implementation.package.version && pkg.private === true, "package-identity"); same(pkg.bin, implementation.package.bin, "package-bin"); assert(pkg.files?.includes("dist"), "package-dist");
const tar = implementation.local_tarball as Obj; const artifacts = complete({ root: tar.artifact_root, set: tar.set, file_count: tar.file_count, tree_sha256: tar.tree_sha256 }, "package-artifacts");
assert(artifacts.paths.length === 1 && locate(tar.ref, "tarball") === join(artifacts.base, artifacts.paths[0]), "tarball-set"); const tarBytes = readFileSync(locate(tar.ref, "tarball"));
assert(hash("sha256", tarBytes) === tar.sha256 && hash("sha1", tarBytes) === tar.npm_shasum_sha1, "tarball-digest");
const listing = spawnSync("tar", ["-tzf", locate(tar.ref, "tarball")], { encoding: "utf8" }); assert(listing.status === 0, `tar-list:${listing.stderr}`); const entries = listing.stdout.trim().split("\n").filter(Boolean).sort();
const expectedEntries = ["package/README.md", "package/package.json", ...dist.paths.map((p) => `package/dist/${p}`)].sort(); assert(entries.length === tar.entry_count && JSON.stringify(entries) === JSON.stringify(expectedEntries), "tar-entry-set");
const packedPkg = spawnSync("tar", ["-xOf", locate(tar.ref, "tarball"), "package/package.json"], { encoding: "utf8" }); assert(packedPkg.status === 0, "tar-package"); same(JSON.parse(packedPkg.stdout), pkg, "packed-package");
for (const path of dist.paths) { const packed = spawnSync("tar", ["-xOf", locate(tar.ref, "tarball"), `package/dist/${path}`]); assert(packed.status === 0 && hash("sha256", packed.stdout) === hash("sha256", readFileSync(join(dist.base, path))), `tar-dist:${path}`); }

const proofDigests: string[] = [];
for (const proof of implementation.cli_proofs as Obj[]) {
  const proofSet = complete(proof, `proof:${proof.proof_id}`); const manifestPath = locate(proof.manifest_ref, `manifest:${proof.proof_id}`);
  assert(hash("sha256", readFileSync(manifestPath)) === proof.manifest_sha256, `manifest-drift:${proof.proof_id}`); const manifest = readJson(manifestPath, `manifest:${proof.proof_id}`);
  assert(manifest.authority_effect === "none", `proof-authority:${proof.proof_id}`); const payload = proofSet.paths.filter((p) => p !== "manifest.json").sort(); same(Object.keys(manifest.files ?? {}).sort(), payload, `manifest-files:${proof.proof_id}`);
  for (const [path, expected] of Object.entries(manifest.files ?? {})) assert(hash("sha256", readFileSync(join(proofSet.base, path))) === expected, `manifest-file:${proof.proof_id}:${path}`); proofDigests.push(proofSet.digest);
}
assert(proofDigests.length === 2 && proofDigests[0] === proofDigests[1], "proof-parity");
assert(binding.toolchain?.node_runtime === receipt.node_runtime && process.version === binding.toolchain.node_runtime, `toolchain:${process.version}`);
for (const flag of ["all_declared_material_sets_fail_on_missing_or_unexpected_files", "package_tarball_matches_source_package_and_built_dist", "both_cli_proofs_close_against_their_manifests", "pattern_availability_fail_closed", "conformance_pending"]) assert(binding.dependency_closure?.[flag] === true, `closure:${flag}`);

process.stdout.write(`${JSON.stringify({ schema_version: "cav2.alchlang.local-runtime-cli.binding-self-validation/v1", status: "PASS", binding_id: binding.binding_id, binding_sha256: hash("sha256", readFileSync(bindingPath)), ontology_id: binding.ontology_id, checks: { accepted_predecessor_bytes: "PASS", extension_capability_and_ontology: "PASS", domainspec: { files: source.paths.length, tree_sha256: source.digest }, compiled_projections: { files: generated.paths.length, tree_sha256: generated.digest }, implementation_material: { files: material.paths.length, tree_sha256: material.digest }, dist: { files: dist.paths.length, tree_sha256: dist.digest }, tarball: { sha256: tar.sha256, npm_shasum_sha1: tar.npm_shasum_sha1, entries: entries.length }, cli_proofs: { count: proofDigests.length, files_each: implementation.cli_proofs[0].file_count, tree_sha256: proofDigests[0] }, toolchain: process.version, conformance: "null-pending-independent-owner" }, authority_effect: "none", claim_ceiling: binding.claim_ceiling }, null, 2)}\n`);
