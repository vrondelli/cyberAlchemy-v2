import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import test from "node:test";
import {finishHen11Host, runHen11Host, validateHostDevelopmentFreeze} from "./run-host.mjs";
import {prepareHen11} from "./prepare.mjs";
import {canonicalJson} from "../../../intent-route-resolver/index.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");
async function fixture(t) {
  const parent = mkdtempSync(join(tmpdir(), "hen11-host-")), repositoryRoot = resolve(import.meta.dirname, "../../../../../.."), outputRoot = join(parent, "hen-11-contextbench-intent-anchor-r3-v11"); t.after(() => rmSync(parent, {recursive: true, force: true}));
  await prepareHen11({repositoryRoot, outputRoot}); const freezePath = join(outputRoot, "FREEZE.json"), freezeBytes = readFileSync(freezePath), freeze = JSON.parse(freezeBytes), freezeSha = sha(freezeBytes);
  return {outputRoot, freezePath, freeze, freezeSha};
}
function launchUse(freeze, freezeSha, consumed_at) { return {schema_version: "are.hen11-development-execution-use/v1", execution_mode: "development", freeze_sha256: freezeSha, source_bindings_sha256: freeze.source_bindings_sha256, deployment_digest: freeze.deployment.deployment_digest, consumed_at, prelaunch_authorization_required: false, cryptographic_signatures_required: false, independent_postrun_review_required: true, status: "consumed", authority_effect: "none"}; }

test("host validation binds the exact development freeze without reviewer authorization", async t => {
  const f = await fixture(t); const checked = validateHostDevelopmentFreeze({freezePath: f.freezePath, freezeSha256: f.freezeSha}); assert.equal(checked.freeze.execution_mode, "development");
  assert.throws(() => validateHostDevelopmentFreeze({freezePath: f.freezePath, freezeSha256: "0".repeat(64)}), /freeze-binding/);
});

test("host run consumes a freeze once and publishes final PROCESS", async t => {
  const f = await fixture(t), now = () => new Date("2026-09-26T01:00:00.000Z"), row = slot => ({task_id: slot.task_id, result: {status: "final_context_selected", native_export: {prediction: {instance_id: slot.instance_id}}, receipts: [{kind: "model", dispatched: true, input_tokens: 10, output_tokens: 5, automatic_retries: 0}], index_tokenizer_receipts: []}, evidence: {ledger: {evidence_consistent: true}, windows: {measured_windows_verified: true}}});
  const settlement = await runHen11Host({freezePath: f.freezePath, freezeSha256: f.freezeSha, signal: new AbortController().signal, now, host: {verify_topology: () => true, execute_slot: async slot => row(slot)}});
  assert.equal(settlement.status, "settled"); assert.equal(JSON.parse(readFileSync(join(f.outputRoot, "run/PROCESS.json"))).status, "settled"); const use = JSON.parse(readFileSync(join(f.outputRoot, "run/DEVELOPMENT-EXECUTION-USE.json"))); assert.equal(use.status, "consumed"); assert.equal(use.prelaunch_authorization_required, false); assert.equal(use.cryptographic_signatures_required, false);
  await assert.rejects(runHen11Host({freezePath: f.freezePath, freezeSha256: f.freezeSha, signal: new AbortController().signal, now, host: {verify_topology: () => true}}), /run-root-exists/);
});

test("host run preserves an already successful task without dispatching it", async t => {
  const f = await fixture(t), now = () => new Date("2026-09-26T01:00:00.000Z"), row = slot => ({task_id: slot.task_id, result: {status: "final_context_selected", native_export: {prediction: {instance_id: slot.instance_id}}, receipts: [{kind: "model", dispatched: true, input_tokens: 10, output_tokens: 5, automatic_retries: 0}], index_tokenizer_receipts: []}, evidence: {ledger: {evidence_consistent: true}, windows: {measured_windows_verified: true}}});
  const preserved = row(f.freeze.schedule.slots[1]); let dispatched = 0;
  const settlement = await runHen11Host({freezePath: f.freezePath, freezeSha256: f.freezeSha, signal: new AbortController().signal, now, host: {preserved_rows: new Map([[preserved.task_id, preserved]]), verify_topology: () => true, execute_slot: async slot => { dispatched++; return row(slot); }}});
  assert.equal(settlement.status, "settled"); assert.equal(dispatched, 1); assert.deepEqual(JSON.parse(readFileSync(join(f.outputRoot, "run/rows/01.json"))), preserved);
});

test("restart finisher settles an existing development process without dispatch", async t => {
  const f = await fixture(t), runRoot = join(f.outputRoot, "run"); mkdirSync(join(runRoot, "rows"), {recursive: true});
  writeFileSync(join(runRoot, "DEVELOPMENT-EXECUTION-USE.json"), `${canonicalJson(launchUse(f.freeze, f.freezeSha, "2026-09-26T01:00:00.000Z"))}\n`); writeFileSync(join(runRoot, "PROCESS.json"), `${canonicalJson({status: "running"})}\n`);
  const settlement = finishHen11Host({freezePath: f.freezePath, freezeSha256: f.freezeSha}); assert.equal(settlement.status, "failed"); assert.equal(settlement.model_calls, 0); assert.equal(JSON.parse(readFileSync(join(runRoot, "PROCESS.json"))).status, "failed");
});

test("finisher closes initialization crash gaps conservatively", async t => {
  const f = await fixture(t), runRoot = join(f.outputRoot, "run"); mkdirSync(runRoot, {recursive: true});
  const settlement = finishHen11Host({freezePath: f.freezePath, freezeSha256: f.freezeSha}); assert.equal(settlement.status, "failed"); assert.match(settlement.failure.message, /before-freeze-consumption/); assert.equal(JSON.parse(readFileSync(join(runRoot, "PROCESS.json"))).status, "failed");
});
