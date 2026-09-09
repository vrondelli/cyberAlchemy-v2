import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type RecordJson = { [key: string]: any };
const sourceFile = fileURLToPath(import.meta.url);
const executionRoot = resolve(dirname(sourceFile), "..");
const repoRoot = resolve(dirname(sourceFile), "../../../../../../../..");
const campaignRoot = resolve(executionRoot, "..");

function sha256(bytes: string | Buffer): string { return createHash("sha256").update(bytes).digest("hex"); }
function readJson(path: string): RecordJson { return JSON.parse(readFileSync(path, "utf8")) as RecordJson; }
function stable(value: any): any { if (Array.isArray(value)) return value.map(stable); if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])); return value; }
function jsonBytes(value: any): string { return `${JSON.stringify(stable(value), null, 2)}\n`; }
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`ALCHLANG_HISTORICAL_CURRENTNESS:${message}`); }

const campaignPath = join(campaignRoot, "CAMPAIGN.v1-candidate.json");
const authorizationPath = join(executionRoot, "AUTHORIZATION.v1.json");
const replayPath = join(executionRoot, "CURRENT-INTEGRATION-REPLAY.v1.json");
const decisionPath = join(executionRoot, "INDEPENDENT-VALIDATION-DECISION.v1.json");
const campaign = readJson(campaignPath);
const authorization = readJson(authorizationPath);
const replay = readJson(replayPath);
const decision = readJson(decisionPath);

assert(sha256(readFileSync(campaignPath)) === authorization.campaign_sha256, "authorization-campaign-digest");
assert(sha256(readFileSync(authorizationPath)) === replay.historical_authorization.sha256, "replay-historical-authorization-digest");
assert(sha256(readFileSync(decisionPath)) === replay.accepted_decision.sha256, "replay-accepted-decision-digest");

const acceptedArtifacts = decision.verticals.flatMap((vertical: RecordJson) => {
  const bindingPath = join(executionRoot, vertical.binding_ref);
  const bindingSha256 = sha256(readFileSync(bindingPath));
  assert(bindingSha256 === vertical.binding_sha256, `accepted-binding-digest:${vertical.vertical_id}`);
  const binding = readJson(bindingPath);
  const conformancePath = join(executionRoot, "evidence/accepted", `${vertical.vertical_id}.source-local-conformance.json`);
  const conformanceSha256 = sha256(readFileSync(conformancePath));
  assert(conformanceSha256 === binding.conformance.digest, `accepted-conformance-digest:${vertical.vertical_id}`);
  return [
    { vertical_id: vertical.vertical_id, kind: "construction-binding", sha256: bindingSha256, status: "UNCHANGED" },
    { vertical_id: vertical.vertical_id, kind: "source-local-conformance", sha256: conformanceSha256, status: "UNCHANGED" }
  ];
});

const comparisons = campaign.source_snapshot.map((source: RecordJson) => {
  const actual = sha256(readFileSync(join(repoRoot, source.path)));
  return {
    path: source.path,
    historical_sha256: source.sha256,
    current_sha256: actual,
    status: actual === source.sha256 ? "UNCHANGED" : "DRIFT"
  };
});
const drifts = comparisons.filter((row: RecordJson) => row.status === "DRIFT");
assert(drifts.length === 1, `expected-one-drift-observed:${drifts.length}`);
assert(drifts[0].path === replay.expected_historical_drift.path, `unexpected-drift:${drifts[0].path}`);
assert(drifts[0].historical_sha256 === replay.expected_historical_drift.historical_sha256, "historical-drift-digest");
assert(drifts[0].current_sha256 === replay.expected_historical_drift.current_sha256, "current-drift-digest");

const report = {
  schema_version: "cav2.alchlang.historical-currentness/v1-candidate",
  campaign_id: campaign.campaign_id,
  status: "PASS",
  historical_replay_status: "SUPERSEDED_EXPECTED_DRIFT",
  expected_failure: `ALCHLANG_VALIDATE:predecessor-drift:${drifts[0].path}`,
  comparisons,
  accepted_decision: { sha256: replay.accepted_decision.sha256, status: "UNCHANGED" },
  accepted_artifacts: acceptedArtifacts,
  authority_effect: "none",
  claim_ceiling: "Diagnostic proof that the immutable historical authorization is not current. PASS means the expected supersession was detected; it does not make the historical replay current or grant any authority."
};
const outputPath = join(executionRoot, "evidence/historical-currentness.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, jsonBytes(report));
process.stdout.write(jsonBytes(report));
