// Materialize one source-only G01 task from a pinned 8K template, before dispatch.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const [baseConfigPath, taskPath, repositoryCache, outputPath, experimentId = "g01-fast-live-v1"] = process.argv.slice(2);
if (![baseConfigPath, taskPath, repositoryCache, outputPath].every(value => typeof value === "string" && value.startsWith("/"))) throw new Error("g01-prepare-config.absolute-paths-required");
if (!/^[a-z0-9][a-z0-9-]{1,127}$/.test(experimentId)) throw new Error("g01-prepare-config.experiment-id");
const base = JSON.parse(readFileSync(baseConfigPath));
const taskBytes = readFileSync(taskPath), task = JSON.parse(taskBytes);
const allowed = ["instance_id", "original_inst_id", "repo", "repo_url", "language", "base_commit", "problem_statement", "source"];
if (Object.keys(task).length !== allowed.length || !allowed.every(key => typeof task[key] === "string" && task[key].length > 0) || !/^[a-f0-9]{40}$/.test(task.base_commit)) throw new Error("g01-prepare-config.task-shape");
const template = base.tasks.find(row => row.id === "contextbench-1");
if (!template || template.instance_id === task.instance_id || base.context_limit !== 8000 || base.total_tokens_per_arm !== 96000) throw new Error("g01-prepare-config.template");
const taskId = "contextbench-fresh";
const row = {...template, id: taskId, instance_id: task.instance_id, base_commit: task.base_commit, task_path: taskPath, task_sha256: hash(taskBytes), repository_cache: repositoryCache,
  cell_template: {...template.cell_template, instance_id: task.instance_id}};
const config = {...base, experiment_id: experimentId, tasks: [row]};
const bytes = Buffer.from(JSON.stringify(config) + "\n");
writeFileSync(outputPath, bytes, {flag: "wx", mode: 0o600});
console.log(JSON.stringify({config_path: outputPath, config_sha256: hash(bytes), task_id: taskId, task_sha256: row.task_sha256, instance_id: task.instance_id, base_commit: task.base_commit}));
