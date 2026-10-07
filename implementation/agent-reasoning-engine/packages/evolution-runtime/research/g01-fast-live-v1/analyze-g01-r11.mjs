// Frozen G01 r11/r12 numerical analysis. Receipt and label integrity are separate
// gates; this script never grants publication or a general superiority claim.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const revision = ["r11", "r12"].includes(process.argv[3]) ? process.argv[3] : "r11";
const campaigns = {
  r11: {input: "r14", candidate: "g01-r11-clean-cohort-candidate-r3",
    definitionSha: "adbaaf8355c8887a18e31360858780fd395a5dfd1cd8838c6a83a5ae10a0e89f",
    freezeSha: "8614ceff2338089f98630ea30c1ed887db55d004de6c77cbddb7a50098048081",
    candidateSha: "4a880cebe939ab25e3c35431cef7396a95534c863547e74024bc5211991bdb66",
    strata: 15, sources: 407},
  r12: {input: "r15", candidate: "g01-r12-clean-cohort-candidate-r2",
    definitionSha: "d7410c9e5a8ad346f9c6a312d02bda6282b0893a79e0c3017304fa564c70c7c4",
    freezeSha: "b47ba1b2ea0a540f085758a84cc45599c9fdf6a124e18c144b6e9a8f2c4f6ee4",
    candidateSha: "427a3dbdc746f9260ad705a9599041f69572cdb9d79e5efb19fa63190c91cbbd",
    strata: 16, sources: 408}
};
const scope = campaigns[revision];
const root = `/opt/are/evolution-runtime/g01-product-replication-${revision}`;
const definitionPath = `/opt/are/evolution-runtime/g01-product-replication-input-${scope?.input}/DEFINITION.json`;
const definitionSha = scope?.definitionSha;
const freezeSha = scope?.freezeSha;
const candidatePath = `/opt/are/evolution-runtime/${scope?.candidate}/COHORT-CANDIDATE.json`;
const candidateSha = scope?.candidateSha;
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path);
const need = (value, reason) => {if (!value) throw Error(`g01-${revision}-analysis.${reason}`);};
const metrics = sample => {
  const sum = (arm, key) => sample.reduce((value, row) => value + row[arm][key], 0);
  const n = sample.length;
  const controlTokens = sum("control", "known_model_tokens");
  const controlTime = sum("control", "duration_seconds");
  need(n > 0 && controlTokens > 0 && controlTime > 0, "metric-denominator");
  return {
    span_f1_difference: (sum("candidate", "span_f1") - sum("control", "span_f1")) / n,
    file_f1_difference: (sum("candidate", "file_f1") - sum("control", "file_f1")) / n,
    token_ratio: sum("candidate", "known_model_tokens") / controlTokens,
    time_ratio: sum("candidate", "duration_seconds") / controlTime
  };
};

export function analyzeRows(rows, seedHex, draws = 20_000, expectedStrata = 15) {
  need(Array.isArray(rows) && rows.length === 24 &&
    /^[a-f0-9]{64}$/.test(seedHex) && Number.isSafeInteger(draws) && draws > 0,
  "analysis-arguments");
  const groups = [...new Set(rows.map(row => row.origin))].sort()
    .map(origin => rows.filter(row => row.origin === origin));
  need(groups.length === expectedStrata && groups.every(group => group.length >= 1 && group.length <= 2),
    "repository-strata");
  for (const row of rows) {
    need(typeof row.origin === "string" && /^https:\/\//.test(row.origin) &&
      ["control", "candidate"].every(arm =>
      ["span_f1", "file_f1"].every(key =>
        Number.isFinite(row[arm]?.[key]) && row[arm][key] >= 0 && row[arm][key] <= 1) &&
      ["known_model_tokens", "duration_seconds"].every(key =>
        Number.isFinite(row[arm]?.[key]) && row[arm][key] > 0)),
    `row-metrics:${row.slug}`);
  }
  let state = Number.parseInt(seedHex.slice(0, 8), 16) || 1;
  const random = () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
  const samples = {span_f1_difference: [], file_f1_difference: [], token_ratio: [], time_ratio: []};
  for (let index = 0; index < draws; index++) {
    const sample = groups.flatMap(group =>
      Array.from({length: group.length}, () => group[Math.floor(random() * group.length)]));
    const value = metrics(sample);
    for (const key of Object.keys(samples)) samples[key].push(value[key]);
  }
  const intervals = Object.fromEntries(Object.entries(samples).map(([key, values]) => {
    values.sort((a, b) => a - b);
    return [key, [values[Math.floor(0.025 * (values.length - 1))],
      values[Math.floor(0.975 * (values.length - 1))]]];
  }));
  const point = metrics(rows);
  const gates = {
    span_f1_lower_above_zero: intervals.span_f1_difference[0] > 0,
    file_f1_lower_above_zero: intervals.file_f1_difference[0] > 0,
    token_ratio_upper_below_one: intervals.token_ratio[1] < 1,
    time_ratio_upper_below_one: intervals.time_ratio[1] < 1
  };
  return {point, intervals, gates, all_numeric_gates_pass: Object.values(gates).every(Boolean),
    strata: groups.length, resamples: draws, seed_sha256: seedHex};
}

if (process.argv[1] === import.meta.filename) {
  const mode = process.argv[2], auditSha = process.argv[4] ?? process.argv[3];
  need(scope && mode === "--write" && /^[a-f0-9]{64}$/.test(auditSha ?? "") &&
    (process.argv.length === 4 || process.argv.length === 5), "arguments");
  const definitionBytes = read(definitionPath), freezeBytes = read(join(root, "CAMPAIGN-FREEZE.json"));
  const candidateBytes = read(candidatePath);
  need(sha(definitionBytes) === definitionSha && sha(freezeBytes) === freezeSha &&
    sha(candidateBytes) === candidateSha,
    "frozen-input-drift");
  const definition = JSON.parse(definitionBytes), freeze = JSON.parse(freezeBytes);
  const candidate = JSON.parse(candidateBytes);
  need(definition.ordered_tasks?.length === 24 && freeze.ordered_tasks?.length === 24 &&
    freeze.definition_sha256 === definitionSha &&
    definition.source_only_candidate_sha256 === candidateSha &&
    candidate.selected_git_origins === scope.strata && candidate.ordered_tasks?.length === 24 &&
    freeze.decision_rule === definition.decision_rule,
    "frozen-definition-binding");
  const auditBytes = read(join(root, "HASH-AUDIT.json"));
  need(sha(auditBytes) === auditSha, "audit-drift");
  const audit = JSON.parse(auditBytes);
  need(audit.schema_version === `are.g01-${revision}-independent-receipt-audit/v1` &&
    audit.status === "terminal-receipts-verified" &&
    audit.definition_sha256 === definitionSha && audit.campaign_freeze_sha256 === freezeSha &&
    audit.planned_pairs === 24 && audit.terminal_pairs === 24 &&
    audit.scored_pairs === 24 && audit.invalid_pairs === 0 &&
    audit.pending_pairs === 0 && audit.sources_verified === scope.sources &&
    audit.rows?.length === 24, "receipt-audit-gate");
  const rows = audit.rows.map((row, index) => {
    const task = definition.ordered_tasks[index], sourceTask = candidate.ordered_tasks[index];
    need(row.status === "scored" && row.slug === task.slug &&
      row.instance_id === task.instance_id &&
      sourceTask.instance_id === task.instance_id && sourceTask.repo === task.repo &&
      typeof sourceTask.repo_url === "string" && /^https:\/\//.test(sourceTask.repo_url) &&
      /^[a-f0-9]{64}$/.test(row.pair_result_sha256) &&
      /^[a-f0-9]{64}$/.test(row.prediction_seal_sha256),
      `row-binding:${index}`);
    return {slug: row.slug, instance_id: row.instance_id, repo: task.repo,
      origin: sourceTask.repo_url,
      pair_result_sha256: row.pair_result_sha256,
      control: row.control, candidate: row.candidate};
  });
  const analysis = analyzeRows(rows, definitionSha, 20_000, scope.strata);
  const output = {schema_version: `are.g01-${revision}-numeric-analysis/v1`,
    status: "terminal-numeric-analysis", campaign_freeze_sha256: freezeSha,
    definition_sha256: definitionSha, receipt_audit_sha256: auditSha,
    planned_pairs: 24, scored_pairs: 24, ...analysis, rows,
    method: `Repository-stratified paired bootstrap, fixed ${scope.strata} Git-origin strata bound to the frozen source-only candidate, 20,000 with-replacement resamples, SHA-256-seeded xorshift32, percentile 95% intervals`,
    claim_ceiling: "Numerical four-gate result only. Label/score-integrity review, scope qualification, and Vlad/Dave product-page review remain separate; no general superiority or publication authorization.",
    authority_effect: "none"};
  const outputBytes = Buffer.from(`${JSON.stringify(output, null, 2)}\n`);
  writeFileSync(join(root, "NUMERIC-ANALYSIS.json"), outputBytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: output.status, scored_pairs: 24,
    point: analysis.point, intervals: analysis.intervals, gates: analysis.gates,
    all_numeric_gates_pass: analysis.all_numeric_gates_pass,
    output_sha256: sha(outputBytes)}));
}
