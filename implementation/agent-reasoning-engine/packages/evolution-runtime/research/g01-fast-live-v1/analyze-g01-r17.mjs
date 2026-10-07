// Frozen-cohort G01 r17 numerical gate. Receipt, label, and publication review are separate.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime/g01-product-replication-r17";
const definitionPath = "/opt/are/evolution-runtime/g01-product-replication-input-r17-r16cohort/DEFINITION.json";
const definitionSha = "b08037525f086b21043cb545be99ee23c8c0db93fb50f6016f4541c9243c822c";
const freezeSha = "31c9b1e0c1bbe533852e9577b17f9308a78a104dd1814b33a98af030145558b7";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path);
const need = (value, reason) => { if (!value) throw Error(`g01-r17-analysis.${reason}`); };

const metrics = sample => {
  const sum = (arm, key) => sample.reduce((value, row) => value + row[arm][key], 0);
  const n = sample.length;
  const controlTokens = sum("control", "known_model_tokens");
  const controlTime = sum("control", "duration_seconds");
  need(n === 24 && controlTokens > 0 && controlTime > 0, "metric-denominator");
  return {
    span_f1_difference: (sum("candidate", "span_f1") - sum("control", "span_f1")) / n,
    file_f1_difference: (sum("candidate", "file_f1") - sum("control", "file_f1")) / n,
    token_ratio: sum("candidate", "known_model_tokens") / controlTokens,
    time_ratio: sum("candidate", "duration_seconds") / controlTime
  };
};

export function analyzeRows(rows, seedHex = definitionSha, draws = 20_000) {
  need(Array.isArray(rows) && rows.length === 24 && /^[a-f0-9]{64}$/.test(seedHex) &&
    Number.isSafeInteger(draws) && draws > 0, "arguments");
  const groups = [...new Set(rows.map(row => row.repo))].sort()
    .map(repo => rows.filter(row => row.repo === repo));
  need(groups.length === 5 && groups.every(group => group.length > 0) &&
    groups.reduce((n, group) => n + group.length, 0) === 24, "five-repository-strata");
  for (const row of rows) {
    need(typeof row.repo === "string" && row.repo.includes("/") &&
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
  for (let i = 0; i < draws; i++) {
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
    strata: groups.map(group => ({repo: group[0].repo, pairs: group.length})),
    resamples: draws, seed_sha256: seedHex};
}

if (process.argv[1] === import.meta.filename) {
  const [mode, auditSha] = process.argv.slice(2);
  need(mode === "--write" && /^[a-f0-9]{64}$/.test(auditSha ?? "") &&
    process.argv.length === 4, "cli-arguments");
  const definitionBytes = read(definitionPath);
  const freezeBytes = read(join(root, "CAMPAIGN-FREEZE.json"));
  const auditBytes = read(join(root, "HASH-AUDIT.json"));
  need(sha(definitionBytes) === definitionSha && sha(freezeBytes) === freezeSha &&
    sha(auditBytes) === auditSha, "frozen-or-audit-drift");
  const definition = JSON.parse(definitionBytes);
  const freeze = JSON.parse(freezeBytes);
  const audit = JSON.parse(auditBytes);
  need(definition.ordered_tasks?.length === 24 && freeze.ordered_tasks?.length === 24 &&
    freeze.definition_sha256 === definitionSha &&
    freeze.decision_rule === definition.decision_rule &&
    audit.schema_version === "are.g01-r17-independent-receipt-audit/v1" &&
    audit.status === "terminal-receipts-verified" &&
    audit.definition_sha256 === definitionSha && audit.campaign_freeze_sha256 === freezeSha &&
    audit.planned_pairs === 24 && audit.terminal_pairs === 24 &&
    audit.scored_pairs === 24 && audit.invalid_pairs === 0 && audit.pending_pairs === 0 &&
    audit.sources_verified === 415 && audit.rows?.length === 24,
  "all-pairs-audited");
  const rows = audit.rows.map((row, i) => {
    const task = definition.ordered_tasks[i];
    need(row.status === "scored" && row.slug === task.slug &&
      row.instance_id === task.instance_id && /^[a-f0-9]{64}$/.test(row.pair_result_sha256) &&
      /^[a-f0-9]{64}$/.test(row.prediction_seal_sha256), `row-binding:${i}`);
    return {slug: row.slug, instance_id: row.instance_id, repo: task.repo,
      pair_result_sha256: row.pair_result_sha256,
      control: row.control, candidate: row.candidate};
  });
  const analysis = analyzeRows(rows);
  const output = {schema_version: "are.g01-r17-numeric-analysis/v1",
    status: "terminal-numeric-analysis", campaign_freeze_sha256: freezeSha,
    definition_sha256: definitionSha, receipt_audit_sha256: auditSha,
    planned_pairs: 24, scored_pairs: 24, ...analysis, rows,
    method: "Five-repository-stratified paired bootstrap, 20,000 with-replacement resamples within each frozen repository, SHA-256-seeded xorshift32, percentile 95% intervals",
    claim_ceiling: "Numerical four-gate result only. Label and score-integrity review, scope qualification, and reviewer approval remain separate; no general superiority or publication authorization.",
    authority_effect: "none"};
  const outputBytes = Buffer.from(`${JSON.stringify(output, null, 2)}\n`);
  writeFileSync(join(root, "NUMERIC-ANALYSIS.json"), outputBytes, {flag: "wx", mode: 0o600});
  console.log(JSON.stringify({status: output.status, scored_pairs: 24,
    point: analysis.point, intervals: analysis.intervals, gates: analysis.gates,
    all_numeric_gates_pass: analysis.all_numeric_gates_pass, output_sha256: sha(outputBytes)}));
}
