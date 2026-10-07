// Source-only heading-filter preflight on the fixed next-order Python sequence.
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const mode = process.argv[2];
if (!["--check", "--audit"].includes(mode) || process.argv.length !== 3)
  throw Error("g01-heading-anchor.arguments");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const read = path => readFileSync(path), json = path => JSON.parse(read(path));
const need = (ok, reason) => {if (!ok) throw Error(`g01-heading-anchor.${reason}`);};
const oldPath = "/opt/are/evolution-runtime/g01-source-r10-prospective-r17/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-convergence-r3.mjs";
const newPath = "/opt/are/evolution-runtime/g01-heading-anchor-tools-r1/intent-anchor-convergence-r3-heading-r1.mjs";
const root = "/opt/are/evolution-runtime/g01-r31-heading-anchor-preflight-r1";
need(!existsSync(root), "output-exists");
const oldModule = await import(pathToFileURL(oldPath).href);
const newModule = await import(pathToFileURL(newPath).href);
const studies = ["g01-r28-openlibrary-import-validation-r1",
  "g01-r29-ansible-import-validation-r1", "g01-r30-keras-import-validation-r1",
  "g01-r31-django-import-validation-r1"];
const rows = studies.map(study => {
  const freeze = json(`/opt/are/evolution-runtime/${study}/CONTROL-FREEZE.json`);
  const config = json(freeze.config_path);
  const taskBytes = read(config.tasks[0].task_path), task = JSON.parse(taskBytes);
  need(sha(taskBytes) === freeze.task_sha256, `${study}-task-drift`);
  const oldAnchors = oldModule.deriveIssueAnchors(task.problem_statement, {issue_template_aware: true});
  const newAnchors = newModule.deriveIssueAnchors(task.problem_statement, {issue_template_aware: true});
  return {study, task_sha256: freeze.task_sha256,
    changed: JSON.stringify(oldAnchors) !== JSON.stringify(newAnchors),
    old_anchor_terms: oldAnchors.map(item => item.terms),
    new_anchor_terms: newAnchors.map(item => item.terms)};
});
const django = rows[3];
need(django.old_anchor_terms[1]?.join(" ") === "description" &&
  django.new_anchor_terms[1]?.includes("flush") &&
  django.new_anchor_terms[1]?.includes("migrate"), "django-heading-repair-not-observed");
const result = {schema_version: "are.g01-heading-anchor-source-preflight/v1",
  status: "source-only-anchor-change-verified", old_source_sha256: sha(read(oldPath)),
  new_source_sha256: sha(read(newPath)), denominator: rows.length,
  changed_tasks: rows.filter(row => row.changed).length, rows,
  model_calls: 0, gold_loaded: false,
  claim_ceiling: "Source-only exposed diagnosis; no live completion or quality gain established"};
if (mode === "--audit") {
  mkdirSync(root, {mode: 0o700});
  const path = join(root, "RESULT.json");
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, {flag: "wx", mode: 0o600});
}
console.log(JSON.stringify({status: mode === "--audit" ? result.status : "read-only-ready",
  denominator: result.denominator, changed_tasks: result.changed_tasks,
  changed_studies: rows.filter(row => row.changed).map(row => row.study),
  django_old_second_anchor: django.old_anchor_terms[1],
  django_new_second_anchor: django.new_anchor_terms[1],
  result_sha256: mode === "--audit" ? sha(read(join(root, "RESULT.json"))) : null,
  model_calls: 0}));
