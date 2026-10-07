// Source-only amendment after r1's pre-freeze task-spec binding rejection.
// It preserves cohort order, source task bytes, caches, protocol, and source tree.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const base = "/opt/are/evolution-runtime";
const prior = `${base}/g01-product-replication-input-r15-overlay-r1`;
const next = `${base}/g01-product-replication-input-r15-overlay-r2`;
const campaign = `${base}/g01-product-replication-r15`;
const definitionPin = "68fc5f0e72a86c187f49400db81a68fe275befde0a9e2a2e3d52231d5ac1cd9e";
const receiptPin = "1977e8d11314057872fc58c78f0828716148b43a594563a6cf9e4282eb6a60f3";
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const need = (condition, reason) => {if (!condition) throw Error(`g01-r15-r2-input-amend.${reason}`);};
const writeNew = (path, bytes) => {writeFileSync(path, bytes, {flag: "wx", mode: 0o600}); return sha(bytes);};

function main() {
  need(!existsSync(next) && !existsSync(campaign), "already-exists");
  const oldDefinitionBytes = readFileSync(join(prior, "DEFINITION.json"));
  const oldReceiptBytes = readFileSync(join(prior, "INPUT-RECEIPT.json"));
  need(sha(oldDefinitionBytes) === definitionPin && sha(oldReceiptBytes) === receiptPin,
  "prior-drift");
  const old = JSON.parse(oldDefinitionBytes), receipt = JSON.parse(oldReceiptBytes);
  need(old.schema_version === "are.g01-campaign-definition/v1" && old.status === "pre-dispatch" &&
    old.ordered_tasks?.length === 24 && receipt.task_count === 24 &&
    receipt.model_calls === 0 && receipt.gold_loaded === false, "prior-shape");
  mkdirSync(next, {mode: 0o700});
  const tasksRoot = join(next, "tasks");
  mkdirSync(tasksRoot, {mode: 0o700});
  const changed = old.ordered_tasks.map((row, index) => {
    need(Object.keys(row).sort().join(",") === "instance_id,repo,repository_cache,slug,task_path" &&
      row.slug === `task-${String(index + 1).padStart(2, "0")}` &&
      row.task_path === join(prior, "tasks", `${row.instance_id}.json`), `prior-task:${index}`);
    const bytes = readFileSync(row.task_path), task = JSON.parse(bytes);
    need(sha(bytes) === receipt.task_bindings[index].task_sha256 &&
      task.instance_id === row.instance_id && task.repo === row.repo &&
      /^[a-f0-9]{40}$/.test(task.base_commit), `task-integrity:${index}`);
    const task_path = join(tasksRoot, `${row.instance_id}.json`);
    need(writeNew(task_path, bytes) === receipt.task_bindings[index].task_sha256,
      `task-copy:${index}`);
    return {...row, task_path, base_commit: task.base_commit};
  });
  const definition = {...old, ordered_tasks: changed,
    input_amendment: {kind: "add-task-spec-base-commit-for-overlay-freeze-guard",
      prior_definition_sha256: definitionPin, task_count_changed: 0,
      task_bytes_changed: 0, task_order_changed: false, cache_bindings_changed: false},
    open_questions: [...old.open_questions,
      "Will the corrected r2 task-spec binding pass freeze and read-only serial preflight?"]};
  const definitionBytes = Buffer.from(JSON.stringify(definition, null, 2) + "\n");
  const definition_sha256 = writeNew(join(next, "DEFINITION.json"), definitionBytes);
  const nextReceipt = {schema_version: "are.g01-r15-r2-overlay-input-amend/v1",
    status: "pre-dispatch-corrected-definition-only", prior_definition_sha256: definitionPin,
    prior_receipt_sha256: receiptPin, definition_sha256,
    exact_source_task_sha256: receipt.task_bindings.map(row => row.task_sha256),
    model_calls: 0, gold_loaded: false,
    claim_ceiling: "Task-spec binding correction only; no changed task, freeze, model run or score",
    open_questions: definition.open_questions};
  const receipt_sha256 = writeNew(join(next, "INPUT-RECEIPT.json"),
    Buffer.from(JSON.stringify(nextReceipt, null, 2) + "\n"));
  console.log(JSON.stringify({status: nextReceipt.status, definition_sha256,
    receipt_sha256, tasks: changed.length}));
}

try {main();} catch (error) {
  console.error(JSON.stringify({status: "amend-error", error: String(error.message)}));
  process.exitCode = 2;
}
