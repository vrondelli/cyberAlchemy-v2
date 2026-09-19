import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const main = async (): Promise<void> => {
const repositoryRoot = process.cwd();
const candidateRoot = resolve(repositoryRoot,
  "projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000-REPAIR-CANDIDATE");
const outputRoot = resolve(candidateRoot, "runs/claim-ceiling-audit");
const reportPath = resolve(candidateRoot, "probes/existing-claim-ceiling-audit.json");
const load = async (path: string) => import(pathToFileURL(resolve(repositoryRoot, path)).href);
const { decodeFactoryRunRequestV1 } = await load(
  "projects/domainspec-v2/impl/architecture-conformance/factory/codecs/decode-factory-run-request-v1.ts");
const { planFactoryRun } = await load(
  "projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/plan-factory-run.ts");
const { executeFactoryRun } = await load(
  "projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/execute-factory-run.ts");

const fixtures = [
  "candidate-direct-proof.request.json",
  "reference-suite.request.json",
  "rmt-calculation.request.json",
  "rmt-entity.request.json",
  "rmt-enum-semantic-slice.request.json",
  "rmt-policy.request.json",
  "rmt-query.request.json",
  "rmt-value-object.request.json",
  "rule-only.request.json",
  "w3-effects-connections.request.json",
  "w4-orchestration-lifecycle.request.json",
] as const;

await mkdir(outputRoot, { recursive: true });
const observations: Record<string, unknown>[] = [];
for (const fixture of fixtures) {
  const fixturePath = resolve(repositoryRoot,
    "projects/domainspec-v2/impl/architecture-conformance/factory/fixtures", fixture);
  const request = decodeFactoryRunRequestV1(JSON.parse(await readFile(fixturePath, "utf8")));
  const plan = await planFactoryRun({ repositoryRoot, request });
  const outputParent = resolve(outputRoot, fixture.replace(".request.json", ""));
  const run = await executeFactoryRun({ repositoryRoot, outputParent, plan });
  const mismatches: Record<string, unknown>[] = [];
  for (const locked of plan.lock.nodes) {
    const semantic = JSON.parse(await readFile(resolve(
      run.run_path, "nodes", locked.node_id, "semantic.json"), "utf8"));
    if (locked.claim_ceiling !== semantic.claim_ceiling) {
      mismatches.push({
        node_id: locked.node_id,
        provider_id: locked.provider_id,
        locked_claim_ceiling: locked.claim_ceiling,
        provider_claim_ceiling: semantic.claim_ceiling,
      });
    }
  }
  observations.push({
    fixture,
    run_path: run.run_path,
    node_count: plan.lock.nodes.length,
    mismatch_count: mismatches.length,
    mismatches,
  });
}
const mismatchCount = observations.reduce((total, item) =>
  total + Number(item.mismatch_count), 0);
await writeFile(reportPath, `${JSON.stringify({
  schema_version: "FactoryCurrentFixtureClaimCeilingAudit/v1",
  result: mismatchCount === 0 ? "pass" : "flag",
  fixture_count: fixtures.length,
  mismatch_count: mismatchCount,
  observations,
  claim_ceiling: "diagnostic inventory only; no repair or acceptance claim",
  authority_effect: "none",
}, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${JSON.stringify({ report_path: reportPath, mismatch_count: mismatchCount })}\n`);
};

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
