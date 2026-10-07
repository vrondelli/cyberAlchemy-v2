// Independent count-only audit of the first r19 timeout and safety stop.
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
const [mode] = process.argv.slice(2);
const need = (v, why) => {if (!v) throw Error(`g01-r19-stop-audit.${why}`);};
need(["--check", "--write"].includes(mode) && process.argv.length === 3, "arguments");
const root = "/opt/are/evolution-runtime/g01-r19-exposed-transfer-160k-r1";
const outputRoot = "/tmp/are-g01-r19-exposed-transfer-160k-r1";
const expected = {freeze: "a8b3a2850e527146f6c66bc0cace802ceb48d8980665b2cbba38613c23a85c00",
  coordinator: "8c684bc020e967b7a5090fac660f74f97e56737aa4098478dd9e4d397e74404b",
  attempt: "2091d6a5b8da1e8934535ea4ae1564a827f4a7ba7d2cd503d6912f8fb8021dd6",
  result: "a1d5065228a538dd2679b9b94894716b76248cd068175266610471f11706d87b"};
const sha = b => createHash("sha256").update(b).digest("hex"), bytes = p => readFileSync(p), read = p => JSON.parse(bytes(p));
const freezePath = join(root, "TRANSFER-FREEZE.json"), coordinatorPath = join(root, "COORDINATOR-RESULT.json");
const attemptPath = join(root, "ATTEMPT-01.json");
const resultPath = join(outputRoot, "cpp-fmt-13ef1e10", "control", "runs", "00", "result.json");
need(sha(bytes(freezePath)) === expected.freeze && sha(bytes(coordinatorPath)) === expected.coordinator &&
  sha(bytes(attemptPath)) === expected.attempt && sha(bytes(resultPath)) === expected.result,
  "pinned-input-drift");
const freeze = read(freezePath), coordinator = read(coordinatorPath), attempt = read(attemptPath), result = read(resultPath);
need(freeze.status === "frozen-before-dispatch" && freeze.tasks.length === 5 &&
  coordinator.status === "safety-stopped" && coordinator.terminal_attempts === 1 &&
  coordinator.unattempted === 9 && attempt.attempt === 1 &&
  attempt.slug === "cpp-fmt-13ef1e10" && attempt.arm === "control" &&
  attempt.unknown_usage === true && attempt.unaccounted_terminal === true &&
  attempt.provider_safety_stop === false && result.status === "run_error" &&
  result.error === "glm.request-failed" && result.receipts?.length >= 20,
  "terminal-shape");
const models = result.receipts.filter(r => r.kind === "model" && r.dispatched !== false);
const known = models.filter(r => Number.isSafeInteger(r.input_tokens) && Number.isSafeInteger(r.output_tokens));
const unknown = models.filter(r => !Number.isSafeInteger(r.input_tokens) || !Number.isSafeInteger(r.output_tokens));
const last = models.at(-1), knownTokens = known.reduce((s, r) => s + r.input_tokens + r.output_tokens, 0);
need(models.length === 20 && known.length === 19 && unknown.length === 1 &&
  last === unknown[0] && last.status === null && last.failure_code === "request-failed" &&
  /^[a-f0-9]{64}$/.test(last.request_sha256) && knownTokens > 0 &&
  !existsSync(join(outputRoot, "cpp-fmt-13ef1e10", "candidate")), "usage-or-scope-drift");
const audit = {schema_version: "are.g01-r19-exposed-transfer-safety-stop-audit/v1",
  status: "timeout-and-unknown-usage-verified", transfer_freeze_sha256: expected.freeze,
  coordinator_sha256: expected.coordinator, attempt_sha256: expected.attempt,
  result_sha256: expected.result, terminal_attempts: 1, unattempted_arms: 9,
  model_calls: models.length, known_usage_calls: known.length, unknown_usage_calls: unknown.length,
  known_tokens_lower_bound: knownTokens, timeout_request_sha256: last.request_sha256,
  timeout_failure_code: last.failure_code, exact_total_tokens: null,
  native_score: null, claim_ceiling: "Exposed safety-stop evidence only; no quality or superiority"};
if (mode === "--write") {
  const path = join(root, "FAILURE-AUDIT.json");
  need(!existsSync(path), "already-written");
  writeFileSync(path, `${JSON.stringify(audit, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: audit.status, known_tokens_lower_bound: knownTokens,
  unknown_usage_calls: unknown.length,
  audit_sha256: mode === "--write" ? sha(bytes(join(root, "FAILURE-AUDIT.json"))) : null}));
