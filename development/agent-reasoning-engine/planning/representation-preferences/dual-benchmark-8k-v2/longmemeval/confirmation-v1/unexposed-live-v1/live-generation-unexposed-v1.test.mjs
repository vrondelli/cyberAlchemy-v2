import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdirSync, mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {IDS, sha} from "./adapter-unexposed-v1.mjs";
import {generationPlan} from "./runner-unexposed-v1.mjs";
import {executeGeneration, recoverGeneration, atomicBudgetWrite, interruptedResult} from "./live-generation-unexposed-v1.mjs";
import {createGatewayProviders} from "./provider-gateway-unexposed-v1.mjs";
import {RUNNER_SHA256, ADAPTER_SHA256, PROTOCOL_SHA256, PROVIDER_SHA256, OUTPUT_BUDGET_SHA256, STORAGE_GUARD_SHA256, SECURITY_SHA256, CLOSURE_SHA256} from "./freeze-unexposed-v1.mjs";
import {developmentLaunchReceipt, securityDigest} from "./generation-security-unexposed-v1.mjs";

const root = resolve(import.meta.dirname, "../../../../../../../.."), planPath = resolve(root, "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/longmemeval-unexposed-planning-v1/PLAN.json");
const planning = () => JSON.parse(readFileSync(planPath));
function rowsFromFrozen(plan) {
  return plan.tasks.map((task) => {
    const sessions = [], dates = [];
    for (const unit of task.ingestion.chunks.flat()) { const match = /^s(\d+)-m(\d+)$/.exec(unit.source_id); assert.ok(match); const session = Number(match[1]), message = Number(match[2]); sessions[session] ??= []; dates[session] ??= unit.date; assert.equal(sessions[session].length, message); sessions[session].push({role: unit.role, content: unit.content}); }
    const query = JSON.parse(task.treatment.admission.request.messages.at(-1).content);
    return {question_id: task.question_id, question_type: "generation-only-bound-source", question: query.current_question, question_date: query.current_question_date, haystack_dates: dates, haystack_sessions: sessions};
  });
}
const fixture = () => { const frozen = planning(); return generationPlan(rowsFromFrozen(frozen), frozen); };
const frozen = (plan, outputRoot) => ({plan, freeze_sha256: "f".repeat(64), freeze: {execution_mode: "development", human_prelaunch_authorization_required: false, live_dispatch_admitted: true, launch_disabled: false, deadline_ms: 30000, generation_plan_sha256: sha(plan), code_bindings: {freeze: {sha256: "1".repeat(64)}, live: {sha256: "2".repeat(64)}}, target_storage: {binding: {output_root: resolve(outputRoot)}}}});
const gatewayInspect = (command, args) => args[0] === "inspect" ? JSON.stringify({Id: "a".repeat(64), Image: `sha256:${"b".repeat(64)}`, Config: {Image: "gateway@sha256:pinned"}, State: {Running: true}, Mounts: [{Type: "volume", Name: "model-api-key", Source: "/var/lib/docker/volumes/model-api-key/_data", Destination: "/run/secrets/model_api_key", Mode: "", Propagation: "", RW: false}], NetworkSettings: {Networks: {gateway: {}}}}) : "";
const deadLease = () => ({schema_version: "are.longmemeval-unexposed-run-lease/v1", pid: 424242, process_start_ticks: "10", boot_id_sha256: securityDigest("boot-a"), owner_token_sha256: "c".repeat(64), created_at: "2026-01-01T00:00:00.000Z", status: "exclusive-owner", authority_effect: "generation-only"});
const deadLeaseDependencies = {read: (path) => { assert.equal(path, "/proc/sys/kernel/random/boot_id"); return "boot-a\n"; }, exists: () => false};
const fileSha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

test("freeze constants bind the exact imported plan dependencies and generation imports no evaluator", () => {
  assert.equal(fileSha(join(import.meta.dirname, "runner-unexposed-v1.mjs")), RUNNER_SHA256); assert.equal(fileSha(join(import.meta.dirname, "adapter-unexposed-v1.mjs")), ADAPTER_SHA256); assert.equal(fileSha(join(import.meta.dirname, "paired-protocol-v1.json")), PROTOCOL_SHA256);
  assert.equal(fileSha(resolve(import.meta.dirname, "provider-gateway-unexposed-v1.mjs")), PROVIDER_SHA256); assert.equal(fileSha(resolve(import.meta.dirname, "output-budget-unexposed-v1.mjs")), OUTPUT_BUDGET_SHA256); assert.equal(fileSha(resolve(import.meta.dirname, "storage-vps-unexposed-v1.mjs")), STORAGE_GUARD_SHA256);
  assert.equal(fileSha(resolve(import.meta.dirname, "generation-security-unexposed-v1.mjs")), SECURITY_SHA256); assert.equal(fileSha(resolve(import.meta.dirname, "dependency-closure-unexposed-v1.mjs")), CLOSURE_SHA256);
  const source = readFileSync(join(import.meta.dirname, "live-generation-unexposed-v1.mjs"), "utf8"); assert.doesNotMatch(source, /from\s+["'][^"']*(?:evaluate|score|reference)/);
});

test("mocked exact provider path seals all 152 model calls and 152 fresh tokenizer admissions", async () => {
  const plan = fixture(), output_root = mkdtempSync(join(tmpdir(), "g03-live-generation-")); let model = 0, tokenizer = 0, verified = 0;
  try {
    const seal = await executeGeneration("unused", "longmemeval-unexposed-generation-r1", {
      output_root, verify: () => { verified++; return frozen(plan, output_root); }, checkStorage: () => {},
      makeProviders: (options) => createGatewayProviders({...options, inspect: gatewayInspect, exchange: async (kind, raw, digest, {onDispatch}) => {
        assert.equal(sha(raw), digest); const request = JSON.parse(raw);
        if (kind === "tokenizer") { tokenizer++; return {status: 200, response_sha256: "2".repeat(64), bytes: 40, payload: {usage: {prompt_tokens: 1000}}}; }
        await onDispatch(); model++; return {status: 200, response_sha256: "1".repeat(64), bytes: 100, payload: {model: request.model, choices: [{finish_reason: "stop", message: {content: request.max_tokens === 768 ? "retained notes" : "final answer"}}], usage: {prompt_tokens: 1000, completion_tokens: 20, total_tokens: 1020, completion_tokens_details: {reasoning_tokens: 10}}}};
      }})
    });
    assert.equal(verified, 2); assert.equal(seal.status, "completed"); assert.equal(model, 152); assert.equal(tokenizer, 152); assert.equal(seal.human_prelaunch_authorization_required, false);
    assert.equal(seal.result.model_generation_calls, 152); assert.equal(seal.result.tokenizer_calls, 152); assert.equal(seal.result.reserved_tokens, 1216000); assert.equal(seal.result.results.flatMap((pair) => pair.answers).length, 8);
    assert.deepEqual(seal.result.results.map((pair) => pair.question_id), IDS); assert.equal(seal.evaluator_reference_access, false); assert.equal(seal.automatic_retries, 0);
    assert.deepEqual(JSON.parse(readFileSync(join(output_root, "longmemeval-unexposed-generation-r1", "GENERATION-SEAL.json"))), seal);
    await assert.rejects(() => executeGeneration("unused", "longmemeval-unexposed-generation-r1", {output_root, verify: () => frozen(plan, output_root), checkStorage: () => {}}), /single-use/);
  } finally { rmSync(output_root, {recursive: true, force: true}); }
});

test("development launch needs no reviewer artifact and provider setup failure cannot dispatch", async () => {
  const plan = fixture(), output_root = mkdtempSync(join(tmpdir(), "g03-disabled-")); let providers = 0;
  try {
    const seal = await executeGeneration("unused", "longmemeval-unexposed-generation-r2", {output_root, verify: () => frozen(plan, output_root), checkStorage: () => {}, makeProviders: () => { providers++; throw Error("setup"); }});
    assert.equal(providers, 1); assert.equal(seal.status, "failed"); assert.equal(seal.result.model_generation_calls, 0); assert.equal(seal.result.results.flatMap((pair) => pair.answers).length, 8); assert.equal(seal.result.usage.total_tokens, 0);
  } finally { rmSync(output_root, {recursive: true, force: true}); }
});

test("abrupt dispatched call seals unknown usage and held reservation conservatively", async () => {
  const plan = fixture(), output_root = mkdtempSync(join(tmpdir(), "g03-interrupted-"));
  try {
    const meter = () => {}; meter.settle = async () => ({settled: true}); const generate = () => {}; generate.settle = async () => ({settled: true});
    const seal = await executeGeneration("unused", "longmemeval-unexposed-generation-r1", {output_root, verify: () => frozen(plan, output_root), checkStorage: () => {}, makeProviders: () => ({meter, generate}), run: async ({record}) => {
      const pair = plan.pairs[0], id = `${pair.question_id}-control-ingest-0`; await record({kind: "call-start", id, pair_sha256: pair.pair_sha256, reservation_tokens: 8000}); await record({channel: "model", id, dispatched: true}); throw Error("abrupt");
    }});
    assert.equal(seal.status, "failed"); assert.equal(seal.result.unknown_usage, true); assert.equal(seal.result.held_tokens, 8000); assert.equal(seal.result.model_generation_calls, 1); assert.equal(seal.result.results.flatMap((pair) => pair.answers).length, 8);
  } finally { rmSync(output_root, {recursive: true, force: true}); }
});

test("provider-free recovery seals a stranded run without redispatch", () => {
  const plan = fixture(), output_root = mkdtempSync(join(tmpdir(), "g03-recover-")), output = join(output_root, "longmemeval-unexposed-generation-r1");
  try {
    const verified = frozen(plan, output_root), launch = developmentLaunchReceipt({freezePath: "unused", freeze: verified.freeze, freezeSha256: verified.freeze_sha256, runName: "longmemeval-unexposed-generation-r1", createdAt: new Date("2026-01-01T00:00:00.000Z")});
    mkdirSync(output); atomicBudgetWrite(output, "DEVELOPMENT-LAUNCH.json", launch); atomicBudgetWrite(output, "LEASE.json", deadLease()); atomicBudgetWrite(output, "STARTED.json", {schema_version: "are.longmemeval-unexposed-generation-start/v3", execution_mode: "development", freeze_sha256: "f".repeat(64), launch_receipt_sha256: launch.receipt_sha256, planning_plan_sha256: plan.planning_plan_sha256});
    const pair = plan.pairs[0], id = `${pair.question_id}-control-ingest-0`; atomicBudgetWrite(output, "event-00001.json", {kind: "call-start", id, pair_sha256: pair.pair_sha256, reservation_tokens: 8000}); atomicBudgetWrite(output, "event-00002.json", {channel: "model", id, phase: "dispatch-intent", dispatched: true});
    let providers = 0; const seal = recoverGeneration("unused", "longmemeval-unexposed-generation-r1", {output_root, verify: () => frozen(plan, output_root), checkStorage: () => {}, leaseDependencies: deadLeaseDependencies, makeProviders: () => { providers++; }});
    assert.equal(providers, 0); assert.equal(seal.status, "failed"); assert.equal(seal.recovered_without_provider_calls, true); assert.equal(seal.result.unknown_usage, true); assert.equal(seal.result.held_tokens, 8000); assert.equal(seal.result.model_generation_calls, 1); assert.throws(() => recoverGeneration("unused", "longmemeval-unexposed-generation-r1", {output_root, verify: () => frozen(plan, output_root), checkStorage: () => {}}), /already-sealed/);
  } finally { rmSync(output_root, {recursive: true, force: true}); }
});

test("provider-free recovery rejects an uninitialized directory with no durable consumption or lease", () => {
  const plan = fixture(), output_root = mkdtempSync(join(tmpdir(), "g03-recover-empty-")); mkdirSync(join(output_root, "longmemeval-unexposed-generation-r1"));
  try { assert.throws(() => recoverGeneration("unused", "longmemeval-unexposed-generation-r1", {output_root, verify: () => frozen(plan, output_root), checkStorage: () => {}, leaseDependencies: deadLeaseDependencies}), /DEVELOPMENT-LAUNCH/); }
  finally { rmSync(output_root, {recursive: true, force: true}); }
});

test("atomic journals are create-only and interrupted reconstruction retains known cost", () => {
  const output = mkdtempSync(join(tmpdir(), "g03-atomic-")); try { atomicBudgetWrite(output, "one.json", {x: 1}); assert.throws(() => atomicBudgetWrite(output, "one.json", {x: 2})); assert.throws(() => atomicBudgetWrite(output, "../bad.json", {})); assert.equal(JSON.parse(readFileSync(join(output, "one.json"))).x, 1); } finally { rmSync(output, {recursive: true, force: true}); }
  const plan = fixture(), pair = plan.pairs[0], events = [{kind: "call-start", id: "known", pair_sha256: pair.pair_sha256, reservation_tokens: 8000}, {channel: "model", id: "known", dispatched: true, usage: {prompt_tokens: 100, completion_tokens: 20, total_tokens: 120}}], result = interruptedResult(plan, events);
  assert.equal(result.usage.total_tokens, 120); assert.equal(result.unknown_usage, false); assert.equal(result.results.flatMap((item) => item.answers).length, 8);
});

test("development freeze path is exact-source-only and does not require reviewer authorization", {skip: !process.env.ARE_G03_SOURCE_PACKAGE || !process.env.ARE_G03_VPS_STORAGE_BINDING}, async () => {
  const {prepareGenerationFreeze} = await import("./freeze-unexposed-v1.mjs"), planningDirectory = resolve(root, "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/longmemeval-unexposed-planning-v1");
  const freeze = prepareGenerationFreeze({packageDirectory: process.env.ARE_G03_SOURCE_PACKAGE, planningDirectory, storageBindingPath: process.env.ARE_G03_VPS_STORAGE_BINDING});
  assert.equal(freeze.launch_disabled, false); assert.equal(freeze.live_dispatch_admitted, true); assert.equal(freeze.human_prelaunch_authorization_required, false); assert.equal(freeze.maximum_generation_calls, 152); assert.equal(freeze.maximum_live_tokenizer_calls, 152); assert.equal(freeze.generation_token_reservation, 1216000); assert.equal(freeze.evaluator_reference_files_present, false);
});
