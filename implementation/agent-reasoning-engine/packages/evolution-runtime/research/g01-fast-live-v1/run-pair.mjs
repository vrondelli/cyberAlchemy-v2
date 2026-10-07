// One frozen JSON input drives a matched G01 pair through dispatch, seal,
// pinned native scoring, and a compact decision receipt. No promotion effect.
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {existsSync, readFileSync, statSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {runFastG01} from "./run.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (value, reason) => { if (!value) throw new Error(`g01-pair.${reason}`); };
const readJson = path => JSON.parse(readFileSync(path));
const saveNew = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + "\n", {flag: "wx", mode: 0o600});
const absolute = value => typeof value === "string" && value.startsWith("/") && resolve(value) === value;

function validatePlan(plan, planPath) {
  need(plan?.schema_version === "are.g01-fast-live-pair-plan/v1" && plan.status === "frozen-before-dispatch", "plan-shape");
  need(absolute(plan.root) && resolve(planPath) === join(plan.root, "PAIR-PLAN.json"), "plan-root");
  need(Object.keys(plan.arms ?? {}).sort().join(",") === "candidate,control", "arms");
  for (const name of ["control", "candidate"]) {
    const arm = plan.arms[name];
    need(absolute(arm?.freeze_path) && dirname(arm.freeze_path) === plan.root && /^[a-f0-9]{64}$/.test(arm.freeze_sha256), `${name}-freeze-binding`);
    need(sha(readFileSync(arm.freeze_path)) === arm.freeze_sha256, `${name}-freeze-drift`);
  }
  const control = readJson(plan.arms.control.freeze_path), candidate = readJson(plan.arms.candidate.freeze_path);
  need(control.schema_version === "are.g01-fast-live-freeze/v1" && candidate.schema_version === control.schema_version, "freeze-schema");
  need(control.task_sha256 === candidate.task_sha256 && control.config_sha256 === candidate.config_sha256 && control.task_id === candidate.task_id, "pair-task-drift");
  need(control.arm === plan.control_arm && candidate.arm === plan.candidate_arm && control.arm !== candidate.arm, "arm-drift");
  need(JSON.stringify(control.source_checkout_layout ?? null) === JSON.stringify(candidate.source_checkout_layout ?? null) &&
    (control.source_checkout_layout === undefined ||
      (["g01-r15-r2-single-lower-overlay-r1", "g01-r16-r2-single-lower-overlay-r1"].includes(control.source_checkout_layout.mode) &&
        Number.isSafeInteger(control.source_checkout_layout.ordinal) &&
        control.source_checkout_layout.ordinal >= 1 && control.source_checkout_layout.ordinal <= 24 &&
        /^[a-f0-9]{64}$/.test(control.source_checkout_layout.residency_receipt_sha256))),
  "source-checkout-layout-drift");
  need(control.span_refinement_policy === undefined && candidate.span_refinement_policy === plan.span_refinement_policy &&
    (plan.span_refinement_policy === undefined || plan.span_refinement_policy === "source-only-go-selected-subspan-r1"), "span-refinement-policy-drift");
  need(control.late_bind_delivered_base === candidate.late_bind_delivered_base &&
    control.late_bind_delivered_base === plan.late_bind_delivered_base &&
    (plan.late_bind_delivered_base === undefined || plan.late_bind_delivered_base === true),
  "late-bind-delivered-base-policy-drift");
  need(absolute(control.output_root) && absolute(candidate.output_root) && control.output_root !== candidate.output_root, "output-roots");
  need((control.source_out === undefined && candidate.source_out === undefined) ||
    (absolute(control.source_out) && absolute(candidate.source_out) && control.source_out !== candidate.source_out &&
      control.source_out.includes("/control/source/00") && candidate.source_out.includes("/candidate/source/00")),
  "source-scratch-pair-binding");
  need(plan.scorer?.image === "are-contextbench-scorer:g01-r1" && ["repo", "upstream", "cache"].every(key => absolute(plan.scorer[key])), "scorer-binding");
  need(typeof plan.claim_ceiling === "string" && plan.claim_ceiling.length > 0, "claim-ceiling");
  need(plan.abstention_policy === undefined || plan.abstention_policy === "explicit-no-final-context-zero-r1", "abstention-policy");
  return {control, candidate};
}

function scoreNative({scorer, out}) {
  const args = ["run", "--rm", "--network", "host", "-v", `${scorer.repo}:/repo:ro`, "-v", `${scorer.upstream}:/upstream:ro`, "-v", `${scorer.cache}:/cache`, "-v", `${out}:/work`, scorer.image,
    "python", "/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py", "--upstream", "/upstream", "--gold", "/upstream/data/full.parquet", "--pred", "/work/prediction.json", "--cache", "/cache", "--out", "/work/native-score.json"];
  const result = spawnSync("docker", args, {encoding: "utf8", timeout: 180000, maxBuffer: 2 * 1024 * 1024});
  need(!result.error && result.status === 0, `native-score:${String(result.error?.message ?? result.stderr).slice(0, 500)}`);
}

function metricRow(freeze) {
  const out = join(freeze.output_root, "runs", "00"), result = readJson(join(out, "result.json")), score = readJson(join(out, "native-score.json"));
  const models = result.receipts.filter(receipt => receipt.kind === "model");
  need(result.status === "final_context_selected" && models.length > 0 && models.every(receipt => Number.isSafeInteger(receipt.input_tokens) && Number.isSafeInteger(receipt.output_tokens)), "scored-arm-invalid");
  const f1 = kind => { const {coverage, precision} = score.native.final[kind]; return coverage + precision > 0 ? 2 * coverage * precision / (coverage + precision) : 0; };
  return {arm: freeze.arm, scoring_basis: "pinned-native", prediction_sha256: sha(readFileSync(join(out, "prediction.json"))), native_score_sha256: sha(readFileSync(join(out, "native-score.json"))),
    span_f1: f1("span"), file_f1: f1("file"), known_model_tokens: models.reduce((sum, receipt) => sum + receipt.input_tokens + receipt.output_tokens, 0),
    duration_seconds: (statSync(join(out, "completed.json")).mtimeMs - statSync(join(out, "started.json")).mtimeMs) / 1000, model_calls: models.length};
}

function abstentionRow(freeze) {
  const out = join(freeze.output_root, "runs", "00"), resultPath = join(out, "result.json");
  need(existsSync(resultPath) && existsSync(join(out, "started.json")) && existsSync(join(out, "completed.json")), "abstention-receipts-missing");
  const result = readJson(resultPath), models = result.receipts?.filter(receipt => receipt.kind === "model") ?? [];
  need(result.status === "run_error" && result.error === "instrument.no-final-context" && models.length > 0 &&
    models.every(receipt => Number.isSafeInteger(receipt.input_tokens) && receipt.input_tokens >= 0 && Number.isSafeInteger(receipt.output_tokens) && receipt.output_tokens >= 0), "abstention-ineligible");
  return {arm: freeze.arm, scoring_basis: "policy-abstention-zero", result_sha256: sha(readFileSync(resultPath)), prediction_sha256: null, native_score_sha256: null,
    span_f1: 0, file_f1: 0, known_model_tokens: models.reduce((sum, receipt) => sum + receipt.input_tokens + receipt.output_tokens, 0),
    duration_seconds: (statSync(join(out, "completed.json")).mtimeMs - statSync(join(out, "started.json")).mtimeMs) / 1000, model_calls: models.length};
}

export async function runPair({planPath, planSha256, signal, runArm = runFastG01, scoreArm = scoreNative}) {
  need(absolute(planPath) && /^[a-f0-9]{64}$/.test(planSha256) && signal instanceof AbortSignal && !signal.aborted, "arguments");
  const bytes = readFileSync(planPath);
  need(sha(bytes) === planSha256, "plan-drift");
  const plan = JSON.parse(bytes), freezes = validatePlan(plan, planPath);
  need(!existsSync(join(plan.root, "PAIR-RESULT.json")) && !existsSync(join(plan.root, "PREDICTION-SEAL.json")), "pair-already-attempted");
  const arms = {};
  for (const name of ["control", "candidate"]) {
    try { const result = await runArm({freezePath: plan.arms[name].freeze_path, freezeSha256: plan.arms[name].freeze_sha256, signal}); arms[name] = {status: result.status, error: result.error ?? null}; }
    catch (error) { arms[name] = {status: "dispatch_error", error: String(error.message)}; }
  }
  const predictions = Object.fromEntries(["control", "candidate"].map(name => [name, join(freezes[name].output_root, "runs", "00", "prediction.json")]));
  const policy = plan.abstention_policy === "explicit-no-final-context-zero-r1";
  const eligible = Object.fromEntries(["control", "candidate"].map(name => {
    if (existsSync(predictions[name])) return [name, "native"];
    if (!policy || arms[name].status !== "run_error" || arms[name].error !== "instrument.no-final-context") return [name, null];
    try { abstentionRow(freezes[name]); return [name, "abstention"]; } catch { return [name, null]; }
  }));
  if (Object.values(eligible).some(value => value === null)) {
    const result = {schema: "are.g01-fast-live-pair-result/v1", status: "unscored", task_sha256: freezes.control.task_sha256, arms, claim_ceiling: plan.claim_ceiling};
    saveNew(join(plan.root, "PAIR-RESULT.json"), result); return result;
  }
  const seal = {schema: "are.g01-prediction-seal/v1", status: "sealed-before-native-scoring", task_sha256: freezes.control.task_sha256,
    ...Object.fromEntries(["control", "candidate"].map(name => [name + (eligible[name] === "native" ? "_prediction_sha256" : "_result_sha256"),
      sha(readFileSync(eligible[name] === "native" ? predictions[name] : join(freezes[name].output_root, "runs", "00", "result.json")))])),
    scoring_status_at_seal: "not-started"};
  saveNew(join(plan.root, "PREDICTION-SEAL.json"), seal);
  try {
    for (const name of ["control", "candidate"]) if (eligible[name] === "native") await scoreArm({scorer: plan.scorer, out: dirname(predictions[name])});
    const control = eligible.control === "native" ? metricRow(freezes.control) : abstentionRow(freezes.control);
    const candidate = eligible.candidate === "native" ? metricRow(freezes.candidate) : abstentionRow(freezes.candidate);
    for (const [name, row] of [["control", control], ["candidate", candidate]])
      need((eligible[name] === "native" ? row.prediction_sha256 === seal[`${name}_prediction_sha256`] : row.result_sha256 === seal[`${name}_result_sha256`]), "outcome-drift-after-seal");
    const gates = {span_f1_improved: candidate.span_f1 > control.span_f1, file_f1_improved: candidate.file_f1 > control.file_f1,
      known_model_tokens_reduced: candidate.known_model_tokens < control.known_model_tokens, duration_reduced: candidate.duration_seconds < control.duration_seconds};
    gates.all_four_pass = Object.values(gates).every(Boolean);
    const result = {schema: "are.g01-fast-live-pair-result/v1", status: "scored", task_sha256: freezes.control.task_sha256,
      ...(policy ? {metric_kind: "native-or-predeclared-abstention-zero", abstention_policy: plan.abstention_policy} : {}),
      control, candidate, matched_gates: gates, claim_ceiling: plan.claim_ceiling};
    saveNew(join(plan.root, "PAIR-RESULT.json"), result); return result;
  } catch (error) {
    const result = {schema: "are.g01-fast-live-pair-result/v1", status: "scoring_error", task_sha256: freezes.control.task_sha256, arms, error: String(error.message), claim_ceiling: plan.claim_ceiling};
    saveNew(join(plan.root, "PAIR-RESULT.json"), result); return result;
  }
}

if (process.argv[1] === import.meta.filename) {
  const [planPath, planSha256] = process.argv.slice(2), controller = new AbortController();
  process.on("SIGINT", () => controller.abort()); process.on("SIGTERM", () => controller.abort());
  try { const result = await runPair({planPath, planSha256, signal: controller.signal}); console.log(JSON.stringify({status: result.status, matched_gates: result.matched_gates ?? null, claim_ceiling: result.claim_ceiling})); }
  catch (error) { console.error(JSON.stringify({status: "pair_driver_error", error: String(error.message)})); process.exitCode = 2; }
}
