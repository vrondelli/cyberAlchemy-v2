#!/usr/bin/env node
// Single-use G03 generation wrapper. It imports no evaluator and performs no effect on import.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmodSync, closeSync, constants, existsSync, fsyncSync, linkSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, statfsSync, statSync, unlinkSync, writeFileSync} from "node:fs";
import {dirname, join, relative, resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {outputFootprint, MAX_OUTPUT_BYTES, FINAL_RESERVE_BYTES} from "./output-budget-unexposed-v1.mjs";
import {createGatewayProviders} from "./provider-gateway-unexposed-v1.mjs";
import {preflightVpsStorage} from "./storage-vps-unexposed-v1.mjs";
import {runGeneration, runRecoveryComposite, PLANNED_GENERATION_CALLS, GENERATION_TOKEN_RESERVATION, RECOVERY_MODEL_CALLS, RECOVERY_TOKEN_RESERVATION} from "./runner-unexposed-v1.mjs";
import {verifyGenerationFreeze} from "./freeze-unexposed-v1.mjs";
import {acquireRecoveryLock, developmentLaunchReceipt, ownerLease, verifyDevelopmentLaunchReceipt} from "./generation-security-unexposed-v1.mjs";

const here = import.meta.dirname;
const zero = () => ({prompt_tokens: 0, completion_tokens: 0, total_tokens: 0});
const validUsage = (usage) => Number.isSafeInteger(usage?.prompt_tokens) && usage.prompt_tokens >= 0 && Number.isSafeInteger(usage?.completion_tokens) && usage.completion_tokens >= 0 && usage.total_tokens === usage.prompt_tokens + usage.completion_tokens;
const PREDECESSORS = Object.freeze([
  {run: "longmemeval-unexposed-generation-r4", seal_sha256: "e7894f6bd186af4bca78ca35e72c79697c039fa8c40d5af082e8d3f6a498e99d", tree_sha256: "3c0cc9c7625a4e4b45c27d585fb0cd4d1b5abe32b513dc759ccf500c1f01bb67", files: 497, bytes: 11160857},
  {run: "longmemeval-unexposed-generation-r5", seal_sha256: "7f66b3667b73a7d0800c79ef958ef8d3d12f15f2868ec2514aa01b16fbf5eb8e", tree_sha256: "ff0b491cd4c34ce893b8175617444a1436127dbef689b9a91ada6f96a815f759", files: 969, bytes: 21503872}
]);
const FORBIDDEN_REQUEST_SHA256 = Object.freeze(["92eca5ade6420bfc45b3d0fb50b1b438a0360888937f9e9e6c02ef7fce821d15", "b18313f210678aa3e5c5d0708d5d21a0caa6a9e078598cf82967d4cc2aa07957"]);
const rawSha = (value) => createHash("sha256").update(value).digest("hex");
const stableJson = (value) => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);

export function guard(binding, outputRoot, growth_reservation_bytes = 0) { return preflightVpsStorage({binding, outputRoot, growth_reservation_bytes}); }

/** Create-only, atomic hard-link publication with the inherited 32 MiB/8 MiB reserve. */
export function atomicBudgetWrite(directory, name, value) {
  assert.match(name, /^[A-Za-z0-9_-]+\.json$/); const final = ["GENERATION-SEAL.json", "RESULTS.json"].includes(name), raw = Buffer.from(`${JSON.stringify(value)}\n`), block = Math.max(4096, Number(statfsSync(directory).bsize));
  assert.ok(Number.isSafeInteger(block) && block > 0); const projected = Math.ceil(raw.length / block) * block + block, used = outputFootprint(directory), limit = final ? MAX_OUTPUT_BYTES : MAX_OUTPUT_BYTES - FINAL_RESERVE_BYTES;
  assert.ok(!final || projected <= FINAL_RESERVE_BYTES, "final artifact exceeds reserved eight MiB"); assert.ok(used + projected <= limit, "bounded output budget exhausted");
  const temporary = join(directory, `.${name}.${process.pid}.tmp`), target = join(directory, name), fd = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
  try { writeFileSync(fd, raw); chmodSync(temporary, 0o400); fsyncSync(fd); } finally { closeSync(fd); }
  try { linkSync(temporary, target); syncDir(directory); } finally { try { unlinkSync(temporary); syncDir(directory); } catch {} }
}
function syncDir(path) { const fd = openSync(path, constants.O_RDONLY | constants.O_DIRECTORY); try { fsyncSync(fd); } finally { closeSync(fd); } }

function bindTree(root) {
  const files = [];
  const walk = (directory) => { for (const name of readdirSync(directory).sort()) { const path = join(directory, name), stat = statSync(path); if (stat.isDirectory()) walk(path); else if (stat.isFile()) { const bytes = readFileSync(path); files.push({path: relative(root, path), bytes: bytes.length, sha256: rawSha(bytes)}); } } };
  walk(root); const bytes = files.reduce((total, item) => total + item.bytes, 0); return {files: files.length, bytes, tree_sha256: rawSha(stableJson(files))};
}

function initializeRun(output, root, launchReceipt, lease) {
  const staging = `${output}.claim-${process.pid}-${Date.now()}`; mkdirSync(staging, {mode: 0o700});
  atomicBudgetWrite(staging, "DEVELOPMENT-LAUNCH.json", launchReceipt); atomicBudgetWrite(staging, "LEASE.json", lease);
  renameSync(staging, output); syncDir(root);
}

export function interruptedResult(plan, events) {
  const results = plan.pairs.map((pair) => {
    const completed = events.findLast((event) => event.kind === "pair-result" && event.result.question_id === pair.question_id); if (completed) return completed.result;
    const calls = events.filter((event) => event.kind === "call-start" && event.pair_sha256 === pair.pair_sha256).map((start) => {
      const done = events.findLast((event) => event.kind === "call-result" && event.id === start.id); if (done) return done;
      const records = events.filter((event) => event.channel === "model" && event.id === start.id), receipt = records.at(-1), started = records.some((event) => event.dispatched === true), usage = validUsage(receipt?.usage) ? receipt.usage : started ? null : zero();
      return {...start, status: "interrupted", model_started: started, usage, unknown_usage: started && !validUsage(usage), receipt: receipt ?? null};
    });
    const usage = zero(); for (const call of calls) if (validUsage(call.usage)) for (const key of Object.keys(usage)) usage[key] += call.usage[key];
    return {schema: "are.longmemeval-unexposed-pair-result/v1", question_id: pair.question_id, pair_sha256: pair.pair_sha256, archive_sha256: pair.archive_sha256, projection_sha256: pair.projection.projection_sha256, status: "failed", planned_answer_slots: 2, answers: ["control", "treatment"].map((arm) => ({arm, status: "blocked", text: null, answer_sha256: null, reason: "wrapper-interrupted"})), calls, usage, unknown_usage: calls.some((call) => call.unknown_usage), held_tokens: calls.filter((call) => call.unknown_usage).reduce((total, call) => total + call.reservation_tokens, 0), persistence_failure: true};
  });
  const usage = zero(); for (const result of results) for (const key of Object.keys(usage)) usage[key] += result.usage[key];
  return {schema: "are.longmemeval-unexposed-generation-result/v1", status: "failed", planning_plan_sha256: plan.planning_plan_sha256, selection_sha256: plan.selection_sha256, cohort_sha256: plan.cohort_sha256, source_manifest_sha256: plan.source_manifest_sha256, planned_pairs: 4, planned_answer_slots: 8, maximum_pair_concurrency: 2, results, usage, unknown_usage: results.some((result) => result.unknown_usage), held_tokens: results.reduce((total, result) => total + result.held_tokens, 0), reserved_tokens: 0, token_budget: plan.token_budget, tokenizer_calls: events.filter((event) => event.channel === "tokenizer" && event.phase === "completed").length, health_stop: "wrapper-interrupted", model_generation_calls: results.reduce((total, result) => total + result.calls.filter((call) => call.model_started).length, 0), persistence_failure: true, campaign_goal_achieved: false};
}

export async function executeGeneration(freezePath, name, {verify = verifyGenerationFreeze, checkStorage = guard, makeProviders = createGatewayProviders, run = runGeneration, output_root, now = () => new Date(), makeLease = ownerLease} = {}) {
  assert.match(name, /^longmemeval-unexposed-generation-r[1-9][0-9]*$/);
  const verified = verify(freezePath); assert.equal(verified.freeze.execution_mode, "development"); assert.equal(verified.freeze.human_prelaunch_authorization_required, false); assert.equal(verified.freeze.live_dispatch_admitted, true); assert.equal(verified.freeze.launch_disabled, false); assert.equal(verified.plan.planned_model_calls, PLANNED_GENERATION_CALLS); assert.equal(verified.plan.token_budget, GENERATION_TOKEN_RESERVATION);
  const launchReceipt = developmentLaunchReceipt({freezePath, freeze: verified.freeze, freezeSha256: verified.freeze_sha256, runName: name, createdAt: now()});
  const storageBinding = verified.freeze.target_storage?.binding; assert.ok(storageBinding, "target-storage-binding-required");
  const root = resolve(output_root ?? storageBinding.output_root); assert.equal(root, storageBinding.output_root, "target-storage-root-drift");
  const output = join(root, name); assert.ok(!existsSync(output), "single-use generation directory");
  checkStorage(storageBinding, root, MAX_OUTPUT_BYTES); const lease = makeLease(); initializeRun(output, root, launchReceipt, lease);
  const controller = new AbortController(), events = [], health = {stopped: false, reason: null, reserved_tokens: 0, token_budget: verified.plan.token_budget}; let sequence = 0, providers, result, failure = null, sourceIntegrity = true, settlement = [];
  const record = async (event) => { const snapshot = structuredClone(event); events.push(snapshot); checkStorage(storageBinding, root); atomicBudgetWrite(output, `event-${String(++sequence).padStart(5, "0")}.json`, snapshot); };
  const abort = () => controller.abort(); process.once("SIGINT", abort); process.once("SIGTERM", abort); const timer = setTimeout(abort, verified.freeze.deadline_ms);
  try {
    atomicBudgetWrite(output, "STARTED.json", {schema_version: "are.longmemeval-unexposed-generation-start/v3", execution_mode: "development", freeze_sha256: verified.freeze_sha256, launch_receipt_sha256: launchReceipt.receipt_sha256, planning_plan_sha256: verified.plan.planning_plan_sha256, planned_answer_slots: 8, planned_model_calls: 152, maximum_live_tokenizer_calls: 152, automatic_retries: 0, started_at: new Date().toISOString(), authority_effect: "generation-only"});
    providers = makeProviders({record, before: () => { checkStorage(storageBinding, root); assert.ok(!health.stopped && !controller.signal.aborted, "shared-health-stop"); }, maximum_calls: 152});
    result = await run({plan: verified.plan, meter: providers.meter, generate: providers.generate, record, tokenizer_limits: {max_calls: 152, timeout_ms: verified.freeze.deadline_ms}, signal: controller.signal, health_state: health});
  } catch (error) { failure = String(error.message); result = error.result ?? null; }
  finally {
    clearTimeout(timer); controller.abort();
    const settled = await Promise.allSettled([Promise.resolve().then(() => providers?.meter.settle({timeout_ms: 35000})), Promise.resolve().then(() => providers?.generate.settle({timeout_ms: 35000}))]);
    settlement = settled.map((item) => item.status === "fulfilled" ? item.value : {settled: false, reason: "settlement-rejected"}).filter(Boolean); process.removeListener("SIGINT", abort); process.removeListener("SIGTERM", abort);
  }
  result ??= interruptedResult(verified.plan, events);
  try { const finalVerified = verify(freezePath); verifyDevelopmentLaunchReceipt(launchReceipt, {freezePath, freeze: finalVerified.freeze, freezeSha256: finalVerified.freeze_sha256, runName: name}); } catch (error) { sourceIntegrity = false; failure ??= String(error.message); }
  const clean = sourceIntegrity && settlement.length === 2 && settlement.every((item) => item.settled) && !failure && result.status === "completed" && result.model_generation_calls === 152 && result.tokenizer_calls === 152 && result.reserved_tokens === 1216000 && !result.unknown_usage && result.held_tokens === 0 && !result.persistence_failure;
  const seal = {schema_version: "are.longmemeval-unexposed-generation-seal/v3", terminal: true, status: clean ? "completed" : "failed", result, source_integrity_verified: sourceIntegrity, transport_settled: settlement.length === 2 && settlement.every((item) => item.settled), settlement, execution_mode: "development", freeze_sha256: verified.freeze_sha256, launch_receipt_sha256: launchReceipt.receipt_sha256, human_prelaunch_authorization_required: false, planning_plan_sha256: verified.plan.planning_plan_sha256, wrapper_error: failure, evaluator_reference_access: false, automatic_retries: 0, completed_at: new Date().toISOString(), campaign_goal_achieved: false, authority_effect: "generation-only"};
  try { atomicBudgetWrite(output, "GENERATION-SEAL.json", seal); } catch (error) { throw Object.assign(error, {generation_seal: seal, persistence_failure: true}); } return seal;
}

/** A prospective, single-worker successor. It never reuses partial pair output. */
export async function executeRecoveryComposite(freezePath, name, {verify = verifyGenerationFreeze, checkStorage = guard, makeProviders = createGatewayProviders, run = runRecoveryComposite, output_root} = {}) {
  assert.match(name, /^longmemeval-unexposed-recovery-r[1-9][0-9]*$/); const verified = verify(freezePath);
  assert.equal(verified.freeze.execution_mode, "development"); assert.equal(verified.freeze.human_prelaunch_authorization_required, false);
  const storageBinding = verified.freeze.target_storage.binding, root = resolve(output_root ?? storageBinding.output_root), output = join(root, name); assert.equal(root, storageBinding.output_root); assert.ok(!existsSync(output), "single-use recovery directory");
  const predecessorBindings = PREDECESSORS.map((expected) => { const directory = join(root, expected.run), sealBytes = readFileSync(join(directory, "GENERATION-SEAL.json")), seal = JSON.parse(sealBytes), tree = bindTree(directory); assert.equal(rawSha(sealBytes), expected.seal_sha256, "recovery.predecessor-seal-drift"); assert.deepEqual(tree, {files: expected.files, bytes: expected.bytes, tree_sha256: expected.tree_sha256}, "recovery.predecessor-tree-drift"); assert.equal(seal.status, "failed"); assert.equal(seal.planning_plan_sha256, verified.plan.planning_plan_sha256); return {...expected, directory, ...tree}; });
  const predecessor = JSON.parse(readFileSync(join(predecessorBindings[1].directory, "GENERATION-SEAL.json"))).result;
  checkStorage(storageBinding, root, MAX_OUTPUT_BYTES); mkdirSync(output, {mode: 0o700});
  atomicBudgetWrite(output, "DEVELOPMENT-LAUNCH.json", {schema_version: "are.longmemeval-unexposed-recovery-development-launch/v1", execution_mode: "development", human_prelaunch_authorization_required: false, freeze_sha256: verified.freeze_sha256, planning_plan_sha256: verified.plan.planning_plan_sha256, predecessor_bindings: predecessorBindings, recovery_execution_order: [3, 2], maximum_workers: 1, maximum_model_calls: RECOVERY_MODEL_CALLS, maximum_tokenizer_calls: RECOVERY_MODEL_CALLS, token_reservation: RECOVERY_TOKEN_RESERVATION, automatic_retries: 0, evaluator_reference_access: false, started_at: new Date().toISOString(), authority_effect: "generation-only"});
  const controller = new AbortController(), events = [], health = {stopped: false}; let sequence = 0, providers, result, failure = null, sourceIntegrity = true, settlement = [];
  const record = async (event) => { const snapshot = structuredClone(event); events.push(snapshot); checkStorage(storageBinding, root); atomicBudgetWrite(output, `event-${String(++sequence).padStart(5, "0")}.json`, snapshot); };
  const abort = () => controller.abort(); process.once("SIGINT", abort); process.once("SIGTERM", abort); const timer = setTimeout(abort, verified.freeze.deadline_ms);
  try { providers = makeProviders({record, before: () => { checkStorage(storageBinding, root); assert.ok(!health.stopped && !controller.signal.aborted, "recovery-health-stop"); }, maximum_calls: RECOVERY_MODEL_CALLS}); result = await run({plan: verified.plan, predecessor, meter: providers.meter, generate: providers.generate, record, signal: controller.signal, forbidden_request_sha256: FORBIDDEN_REQUEST_SHA256}); health.stopped = result.status !== "completed"; }
  catch (error) { failure = String(error.message); result = error.result ?? null; }
  finally { clearTimeout(timer); controller.abort(); const settled = await Promise.allSettled([Promise.resolve().then(() => providers?.meter.settle({timeout_ms: 35000})), Promise.resolve().then(() => providers?.generate.settle({timeout_ms: 35000}))]); settlement = settled.map((item) => item.status === "fulfilled" ? item.value : {settled: false, reason: "settlement-rejected"}).filter(Boolean); process.removeListener("SIGINT", abort); process.removeListener("SIGTERM", abort); }
  try { verify(freezePath); for (const binding of predecessorBindings) assert.deepEqual(bindTree(binding.directory), {files: binding.files, bytes: binding.bytes, tree_sha256: binding.tree_sha256}); } catch (error) { sourceIntegrity = false; failure ??= String(error.message); }
  const clean = sourceIntegrity && settlement.length === 2 && settlement.every((item) => item.settled) && !failure && result?.status === "completed" && result.recovery_model_generation_calls === RECOVERY_MODEL_CALLS && result.recovery_tokenizer_calls === RECOVERY_MODEL_CALLS && result.recovery_reserved_tokens === RECOVERY_TOKEN_RESERVATION && !result.recovery_unknown_usage && result.recovery_held_tokens === 0 && !result.persistence_failure;
  const seal = {schema_version: "are.longmemeval-unexposed-recovery-composite-seal/v1", terminal: true, status: clean ? "completed" : "failed", result, source_integrity_verified: sourceIntegrity, transport_settled: settlement.length === 2 && settlement.every((item) => item.settled), settlement, execution_mode: "development", freeze_sha256: verified.freeze_sha256, planning_plan_sha256: verified.plan.planning_plan_sha256, predecessor_bindings: predecessorBindings, forbidden_request_sha256: [...FORBIDDEN_REQUEST_SHA256], wrapper_error: failure, evaluator_reference_access: false, automatic_retries: 0, completed_at: new Date().toISOString(), campaign_goal_achieved: false, authority_effect: "generation-only"}; atomicBudgetWrite(output, "GENERATION-SEAL.json", seal); return seal;
}

/** Provider-free crash finisher. It never resumes or redispatches work. */
export function recoverGeneration(freezePath, name, {verify = verifyGenerationFreeze, checkStorage = guard, output_root, leaseDependencies} = {}) {
  assert.match(name, /^longmemeval-unexposed-generation-r[1-9][0-9]*$/); const verified = verify(freezePath);
  const storageBinding = verified.freeze.target_storage.binding, root = resolve(output_root ?? storageBinding.output_root); assert.equal(root, storageBinding.output_root, "target-storage-root-drift"); checkStorage(storageBinding, root);
  const output = join(root, name); assert.ok(existsSync(output), "recovery-directory-missing"); assert.ok(!existsSync(join(output, "GENERATION-SEAL.json")), "generation-already-sealed");
  const launchReceipt = JSON.parse(readFileSync(join(output, "DEVELOPMENT-LAUNCH.json"))), lease = JSON.parse(readFileSync(join(output, "LEASE.json"))); verifyDevelopmentLaunchReceipt(launchReceipt, {freezePath, freeze: verified.freeze, freezeSha256: verified.freeze_sha256, runName: name}); const recoveryLock = acquireRecoveryLock(output, lease, leaseDependencies);
  const names = readdirSync(output).filter((value) => /^event-[0-9]{5}\.json$/.test(value)).sort(); names.forEach((value, index) => assert.equal(value, `event-${String(index + 1).padStart(5, "0")}.json`, "recovery.event-sequence"));
  if (existsSync(join(output, "STARTED.json"))) { const started = JSON.parse(readFileSync(join(output, "STARTED.json"))); assert.equal(started.schema_version, "are.longmemeval-unexposed-generation-start/v3"); assert.equal(started.freeze_sha256, verified.freeze_sha256); assert.equal(started.launch_receipt_sha256, launchReceipt.receipt_sha256); assert.equal(started.planning_plan_sha256, verified.plan.planning_plan_sha256); }
  else assert.equal(names.length, 0, "recovery.events-without-start-record");
  const events = names.map((value) => JSON.parse(readFileSync(join(output, value)))), result = interruptedResult(verified.plan, events);
  const seal = {schema_version: "are.longmemeval-unexposed-generation-seal/v3", terminal: true, status: "failed", result, source_integrity_verified: true, transport_settled: false, settlement: [], recovery_lock: recoveryLock, execution_mode: "development", freeze_sha256: verified.freeze_sha256, launch_receipt_sha256: launchReceipt.receipt_sha256, human_prelaunch_authorization_required: false, planning_plan_sha256: verified.plan.planning_plan_sha256, wrapper_error: "process-crash-provider-state-indeterminate", evaluator_reference_access: false, automatic_retries: 0, recovered_without_provider_calls: true, completed_at: new Date().toISOString(), campaign_goal_achieved: false, authority_effect: "generation-only"};
  atomicBudgetWrite(output, "GENERATION-SEAL.json", seal); return seal;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const recover = process.argv[2] === "--recover", recoverPairs = process.argv[2] === "--recover-pairs", offset = recover || recoverPairs ? 1 : 0; assert.equal(process.argv.length, 4 + offset, "usage: live-generation-unexposed-v1.mjs [--recover|--recover-pairs] FREEZE RUN-NAME");
  const seal = recover ? recoverGeneration(process.argv[3], process.argv[4]) : recoverPairs ? await executeRecoveryComposite(process.argv[3], process.argv[4]) : await executeGeneration(process.argv[2], process.argv[3]); process.stdout.write(`${JSON.stringify({status: seal.status, model_calls: seal.result?.model_generation_calls ?? seal.result?.recovery_model_generation_calls ?? 0, tokenizer_calls: seal.result?.tokenizer_calls ?? seal.result?.recovery_tokenizer_calls ?? 0, unknown_usage: seal.result?.unknown_usage ?? seal.result?.recovery_unknown_usage ?? false})}\n`);
}
