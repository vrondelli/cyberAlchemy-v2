import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";

const repositoryRoot = process.cwd();
const evidenceRoot = resolve(repositoryRoot,
  "projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000");
const architectureRoot = resolve(repositoryRoot,
  "projects/domainspec-v2/impl/architecture-conformance");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const paths = new Set([
  "projects/domainspec-v2/impl/package.json",
  "projects/domainspec-v2/impl/package-lock.json",
]);
const walk = async (current) => {
  for (const name of await readdir(current)) {
    if (name === "target" || name === "__pycache__") continue;
    const path = resolve(current, name);
    const stat = await lstat(path);
    if (stat.isDirectory()) await walk(path);
    else if (stat.isFile()) paths.add(relative(repositoryRoot, path).replaceAll("\\", "/"));
  }
};
await walk(architectureRoot);
for (const name of ["reference-plan-output.json", "w3-plan-output.json"]) {
  const plan = JSON.parse(await readFile(resolve(evidenceRoot, "commands", name), "utf8"));
  for (const node of plan.lock.nodes) {
    for (const ref of [...node.inputs, ...node.components]) paths.add(ref.path);
  }
}
const entries = [];
for (const path of [...paths].sort((a, b) => Buffer.from(a).compare(Buffer.from(b)))) {
  const bytes = await readFile(resolve(repositoryRoot, path));
  entries.push({ path, sha256: sha256(bytes), byte_length: bytes.byteLength });
}
process.stdout.write(`${JSON.stringify({
  schema_version: "SicFacProductByteInventory/v1",
  scope: "all architecture-conformance files excluding generated target and __pycache__, both plan-locked input/component sets, and implementation package manifests",
  exclusions: ["**/target/**", "**/__pycache__/**", "node_modules/**"],
  entry_count: entries.length,
  entries,
  inventory_sha256: sha256(JSON.stringify(entries)),
  authority_effect: "none",
})}\n`);
