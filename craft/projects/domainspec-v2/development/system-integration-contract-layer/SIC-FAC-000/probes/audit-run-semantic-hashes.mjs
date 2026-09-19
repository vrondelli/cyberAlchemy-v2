import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const canonical = (value) => JSON.stringify(
  Array.isArray(value) ? value.map((item) => JSON.parse(canonical(item))) :
    value !== null && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) =>
          Buffer.from(a).compare(Buffer.from(b))).map(([key, child]) =>
          [key, JSON.parse(canonical(child))]))
      : value,
);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const audits = [];
for (const runPath of process.argv.slice(2)) {
  const root = resolve(process.cwd(), runPath);
  const [receipt, lock] = await Promise.all([
    readFile(resolve(root, "semantic-receipt.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "lock.json"), "utf8").then(JSON.parse),
  ]);
  const nodes = [];
  for (const node of receipt.ordered_nodes) {
    const semantic = await readFile(resolve(root, "nodes", node.node_id, "semantic.json"), "utf8")
      .then(JSON.parse);
    const observed = sha256(canonical(semantic));
    const locked = lock.nodes.find(({ node_id }) => node_id === node.node_id);
    nodes.push({
      node_id: node.node_id,
      expected_semantic_sha256: node.semantic_sha256,
      observed_semantic_sha256: observed,
      equal: observed === node.semantic_sha256,
      proof_denominator_count: locked.inputs.filter(({ role }) =>
        role === "proof-denominator").length,
    });
  }
  audits.push({
    run_path: runPath,
    run_id: receipt.run_id,
    node_count: nodes.length,
    all_semantic_hashes_equal: nodes.every(({ equal }) => equal),
    denominator_backed_node_count: nodes.filter(({ proof_denominator_count }) =>
      proof_denominator_count === 1).length,
    legacy_non_denominator_node_count: nodes.filter(({ proof_denominator_count }) =>
      proof_denominator_count === 0).length,
    nodes,
  });
}
process.stdout.write(`${JSON.stringify({
  schema_version: "SicFacSemanticHashAudit/v1",
  result: audits.every(({ all_semantic_hashes_equal }) => all_semantic_hashes_equal)
    ? "pass" : "block",
  audits,
  authority_effect: "none",
})}\n`);
