// Bind prospective r7 protocol, cohort and code before any model dispatch.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const root = "/opt/are/evolution-runtime";
const cohort = join(root, "g03-product-replication-r7");
const tools = join(root, "g03-product-replication-tools-r7");
const code = join(root, "g03-product-replication-code-r9/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1");
const digest = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const selection = JSON.parse(readFileSync(join(cohort, "SELECTION.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(cohort, "source/manifest.json"), "utf8"));
if (selection.schema_version !== "are.longmemeval-product-replication-selection/v7" || selection.status !== "frozen-before-model-dispatch" ||
    selection.ordered_questions.length !== 28 || manifest.rows.length !== 28 ||
    JSON.stringify(selection.ordered_questions.map(row => row.question_id)) !== JSON.stringify(manifest.question_ids) ||
    manifest.selection_file_sha256 !== digest(join(cohort, "SELECTION.json")) ||
    selection.reference_fields_read !== false || selection.provider_calls !== 0 ||
    Object.values(selection.type_quotas).length !== 4 || Object.values(selection.type_quotas).some(value => value !== 7))
  throw Error("r7.selection-not-frozen");
const files = {
  protocol: join(tools, "G03-R7-PROTOCOL.md"), selection: join(cohort, "SELECTION.json"),
  source_manifest: join(cohort, "source/manifest.json"), selector: join(tools, "select-cohort-r7.py"),
  code_builder: join(tools, "build-code-r7.mjs"), analyzer: join(tools, "analyze-accuracy-r7.mjs"),
  independent_auditor: join(tools, "audit-r7.py"),
  adapter: join(code, "replication-cohort-adapter-v1.mjs"), runner: join(code, "replication-cohort-paired-r7.mjs"),
  scorer: join(code, "replication-cohort-score-r7.mjs"), reference_projector: join(code, "replication-cohort-reference-project-r7.py"),
};
const freeze = {schema_version: "are.g03-r7-confirmation-freeze/v1", status: "frozen-before-model-dispatch",
  cohort_questions: 28, source_types: selection.type_quotas, source_revision: selection.source_revision,
  source_sha256: selection.source_sha256, file_sha256: Object.fromEntries(Object.entries(files).map(([key, path]) => [key, digest(path)])),
  model: "glm-5.3-flash", context_window: 8000, projection_characters: 5000,
  maximum_workers: 2, maximum_model_calls_per_task: 96, retries: 0,
  primary_metric: "paired strict-correct-rate difference over all 28 questions",
  direction_gate: "stratified paired bootstrap 95% lower bound > +0.10; control-favoring invalid-judge sensitivity lower bound > 0",
  reference_access_before_generation_seal: false, authority_effect: "none", frozen_at: new Date().toISOString()};
writeFileSync(join(cohort, "FREEZE.json"), `${JSON.stringify(freeze, null, 2)}\n`, {flag: "wx", mode: 0o600});
process.stdout.write(`${JSON.stringify({freeze_sha256: digest(join(cohort, "FREEZE.json")), source_manifest_sha256: freeze.file_sha256.source_manifest})}\n`);
