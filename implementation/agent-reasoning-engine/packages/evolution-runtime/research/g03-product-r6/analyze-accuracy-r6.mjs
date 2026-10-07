// Frozen r6 accuracy-only analysis. References and raw answers are not read here.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";

const [manifestPath, generationPath, scorePath, outputPath] = process.argv.slice(2);
if (![manifestPath, generationPath, scorePath, outputPath].every(Boolean)) throw Error("usage: analyze-accuracy-r6.mjs MANIFEST GENERATION SCORE NEW_OUTPUT");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => { const bytes = readFileSync(resolve(path)); return {bytes, value: JSON.parse(bytes)}; };
const source = read(manifestPath), generation = read(generationPath), score = read(scorePath);
const generationRun = read(join(dirname(resolve(generationPath)), "RUN.json"));
const scoreRun = read(join(dirname(resolve(scorePath)), "RUN.json"));
const ids = source.value.question_ids;
if (source.value.rows?.length !== 40 || ids?.length !== 40 || new Set(ids).size !== 40 ||
    generation.value.status !== "completed" || generation.value.terminal_count !== 40 || generation.value.unknown_usage !== false ||
    generation.value.failure_count !== 0 || generation.value.results?.length !== 40 ||
    generationRun.value.source_manifest_file_sha256 !== sha(source.bytes) ||
    score.value.status !== "completed" || score.value.unknown_usage !== false ||
    score.value.judgments?.length !== generation.value.completed * 2 || score.value.valid_judgments > 80 ||
    scoreRun.value.generation_result_sha256 !== sha(generation.bytes) ||
    scoreRun.value.cohort_manifest_sha256 !== sha(source.bytes) ||
    scoreRun.value.planned_judgments !== generation.value.completed * 2 ||
    JSON.stringify(generation.value.question_ids) !== JSON.stringify(ids) ||
    JSON.stringify(score.value.question_ids) !== JSON.stringify(ids)) throw Error("r6.incomplete-or-drift");

const rows = [];
for (let index = 0; index < 40; index++) {
  const id = ids[index], sourceRow = source.value.rows[index], result = generation.value.results[index];
  if (sourceRow.question_id !== id || result.question_id !== id || result.unknown_usage !== false ||
      !["completed", "provider-refused"].includes(result.status)) throw Error(`r6.generation-row:${id}`);
  if (result.status === "provider-refused") {
    if (result.refusal?.provider_error_code !== "1301" || score.value.judgments.some(j => j.question_id === id)) throw Error(`r6.refusal:${id}`);
    rows.push({question_id: id, question_type: sourceRow.question_type, provider_refused: true,
      control: {correct: false, judge_valid: true, tokens: null, milliseconds: null},
      treatment: {correct: false, judge_valid: true, tokens: null, milliseconds: null}});
    continue;
  }
  const arms = {};
  for (const arm of ["control", "treatment"]) {
    const matches = score.value.judgments.filter(j => j.question_id === id && j.arm === arm);
    if (matches.length !== 1) throw Error(`r6.judge-row:${id}:${arm}`);
    const judge = matches[0], calls = result.calls.filter(call => call.arm === arm);
    if (judge.parser_version !== "yes-no-optional-period/v1" || !/^[a-f0-9]{64}$/.test(judge.judge_response_sha256 ?? "") ||
        !Number.isSafeInteger(judge.usage?.total_tokens) || !Number.isSafeInteger(judge.elapsed_ms) ||
        calls.some(call => call.status !== "completed" || !Number.isSafeInteger(call.usage?.total_tokens))) throw Error(`r6.judge-or-call:${id}:${arm}`);
    const tokens = calls.reduce((total, call) => total + call.usage.total_tokens, 0) + judge.usage.total_tokens;
    const milliseconds = result.arm_elapsed_ms[arm] + judge.elapsed_ms;
    if (tokens <= 0 || milliseconds <= 0) throw Error(`r6.cost:${id}:${arm}`);
    arms[arm] = {correct: judge.correct === true, judge_valid: judge.valid === true, tokens, milliseconds};
  }
  rows.push({question_id: id, question_type: sourceRow.question_type, provider_refused: false, ...arms});
}
const refused = rows.filter(row => row.provider_refused).map(row => row.question_id);
if (refused.length !== generation.value.provider_refused || refused.length !== score.value.provider_refused ||
    JSON.stringify(refused) !== JSON.stringify(score.value.fixed_incorrect_question_ids)) throw Error("r6.refusal-accounting");
const sum = (sample, arm, key) => sample.reduce((total, row) => total + Number(row[arm][key]), 0);
const measure = sample => {
  const answered = sample.filter(row => !row.provider_refused);
  const primary = (sum(sample, "treatment", "correct") - sum(sample, "control", "correct")) / sample.length;
  const sensitivity = (sample.filter(row => row.treatment.correct && row.treatment.judge_valid).length -
    sample.filter(row => row.control.correct || !row.control.judge_valid).length) / sample.length;
  return {control_accuracy: sum(sample, "control", "correct") / sample.length,
    treatment_accuracy: sum(sample, "treatment", "correct") / sample.length,
    accuracy_difference: primary, control_favoring_sensitivity_difference: sensitivity,
    answered_pair_token_ratio: answered.length ? sum(answered, "treatment", "tokens") / sum(answered, "control", "tokens") : null,
    answered_pair_time_ratio: answered.length ? sum(answered, "treatment", "milliseconds") / sum(answered, "control", "milliseconds") : null};
};
const sourceSha = sha(source.bytes); let state = parseInt(sourceSha.slice(0, 8), 16) || 1;
const random = () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0x100000000; };
const groups = [...new Set(rows.map(row => row.question_type))].sort().map(type => rows.filter(row => row.question_type === type));
if (groups.length !== 5 || groups.some(group => group.length !== 8)) throw Error("r6.strata-drift");
const draws = {accuracy_difference: [], control_favoring_sensitivity_difference: [], answered_pair_token_ratio: [], answered_pair_time_ratio: []};
for (let b = 0; b < 20_000; b++) {
  const sample = groups.flatMap(group => Array.from({length: group.length}, () => group[Math.floor(random() * group.length)]));
  const value = measure(sample);
  for (const key of Object.keys(draws)) if (value[key] !== null) draws[key].push(value[key]);
}
const intervals = Object.fromEntries(Object.entries(draws).map(([key, values]) => {
  values.sort((a, b) => a - b);
  return [key, values.length ? [values[Math.floor(.025 * (values.length - 1))], values[Math.floor(.975 * (values.length - 1))]] : null];
}));
const treatmentOnly = rows.filter(row => row.treatment.correct && !row.control.correct).length;
const controlOnly = rows.filter(row => row.control.correct && !row.treatment.correct).length;
const discordant = treatmentOnly + controlOnly;
let tail = Math.pow(.5, discordant), term = tail;
for (let k = 1; k <= Math.min(treatmentOnly, controlOnly); k++) { term *= (discordant - k + 1) / k; tail += term; }
const point = measure(rows);
const analysis = {schema_version: "are.g03-accuracy-confirmation-analysis/v1", planned_questions: 40,
  source_manifest_sha256: sourceSha, generation_run_sha256: sha(generationRun.bytes), generation_result_sha256: sha(generation.bytes),
  score_run_sha256: sha(scoreRun.bytes), score_result_sha256: sha(score.bytes), rows, point, intervals,
  provider_refused: refused.length, invalid_judgments: generation.value.completed * 2 - score.value.valid_judgments,
  discordants: {treatment_only: treatmentOnly, control_only: controlOnly, two_sided_exact_mcnemar_p: discordant ? Math.min(1, 2 * tail) : 1},
  method: {paired_unit: "question", strata: "five question types, eight each", resamples: 20_000,
    seed_source: "first eight hex digits of frozen source-manifest SHA-256", seed: parseInt(sourceSha.slice(0, 8), 16),
    percentiles: "floor((B-1)*p), p=0.025 and 0.975", invalid_judge_policy: "primary incorrect; sensitivity treatment incorrect/control correct",
    provider_refusal_policy: "code-1301 both arms incorrect in all-40 accuracy denominator"},
  accuracy_directional_gate_pass: intervals.accuracy_difference[0] > .10 && intervals.control_favoring_sensitivity_difference[0] > 0,
  claim_ceiling: "Five-type, fixed 40-question accuracy comparison only; no full-benchmark, efficiency, or general ARE superiority claim; Vlad/Dave exact-card review required",
  script_sha256: sha(readFileSync(import.meta.filename))};
writeFileSync(resolve(outputPath), JSON.stringify(analysis, null, 2) + "\n", {flag: "wx", mode: 0o600});
process.stdout.write(`${JSON.stringify({planned: 40, point, intervals, gate: analysis.accuracy_directional_gate_pass})}\n`);
