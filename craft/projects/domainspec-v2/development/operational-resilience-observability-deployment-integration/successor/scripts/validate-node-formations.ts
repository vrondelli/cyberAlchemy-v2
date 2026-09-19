import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateMintedNodeFormation } from "../../../../impl/tools/minted-project/meta-type-body-adapter";

type SourceNode = Readonly<{
  node_id: string;
  kind: string;
  body: Record<string, unknown>;
}>;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const nodeRoot = resolve(scriptDir, "../domainspec/nodes");
const records = readdirSync(nodeRoot)
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) => {
    const node = JSON.parse(readFileSync(resolve(nodeRoot, name), "utf8")) as SourceNode;
    const violations = validateMintedNodeFormation(node.kind, node.body, `successor/domainspec/nodes/${name}`);
    return {
      source: name,
      node_id: node.node_id,
      kind: node.kind,
      violations: violations.map(({ criterionId, code, path, detail }) => ({ criterionId, code, path, detail })),
    };
  });

const failures = records.flatMap((record) =>
  record.violations.map((violation) => `${record.source}:${violation.criterionId}:${violation.code}`),
);
const kindCounts = Object.fromEntries(
  ["Entity", "Value Object"].map((kind) => [kind, records.filter((record) => record.kind === kind).length]),
);
const result = {
  schema_version: "domainspec.orodi.successor-formation-validation/v1",
  status: failures.length === 0 ? "pass" : "fail",
  node_count: records.length,
  kind_counts: kindCounts,
  records,
  failures,
  authority_effect: "none",
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = failures.length === 0 ? 0 : 1;
