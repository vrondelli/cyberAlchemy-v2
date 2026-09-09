// Stage one exact VPS text task. Open questions: TASKS.md#open-questions
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileTask} from './task-contract.mjs';
const [targetArg, kernelArg, taskArg] = process.argv.slice(2);
assert.ok(targetArg && kernelArg && taskArg, 'usage: prepare-task.mjs new-stage kernel task.json');
const target = resolve(targetArg), here = dirname(fileURLToPath(import.meta.url));
const task = compileTask(JSON.parse(readFileSync(taskArg, 'utf8')));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = Object.fromEntries(['pilot-host.mjs', 'task-host.mjs', 'task-contract.mjs', 'run-task-vps.py', 'rwo/adapter.mjs', 'rwo/task-adapter.mjs'].map(name => [name, readFileSync(resolve(here, name))]));
sources['rwo/rwo-are-pilot-kernel'] = readFileSync(kernelArg);
const hostBase = JSON.parse(readFileSync(resolve(here, task.task.objective_kind ? 'host.objective.candidate.json' : 'host.candidate.json'), 'utf8'));
const id = sha(JSON.stringify({task_digest: task.digest, host_binding: hostBase, files: Object.fromEntries(Object.entries(sources).map(([name, bytes]) => [name, sha(bytes)]))})).slice(0, 16);
const remote = `/srv/are-luna-pilot/tasks/${id}`, state = `/var/lib/are-luna-pilot/tasks/${id}`, runtime = `/run/are-text-${id}`;
const host = {...hostBase, state: `${state}/host`, runtime, task: task.task};
const adapter = {kernel: `${remote}/rwo/rwo-are-pilot-kernel`, kernel_sha256: sha(sources['rwo/rwo-are-pilot-kernel']), state: `${state}/rwo`, socket: `${runtime}/control.sock`, request_id: task.task.task_id, task: task.task};
sources['host.json'] = Buffer.from(JSON.stringify(host, null, 2) + '\n');
sources['adapter.json'] = Buffer.from(JSON.stringify(adapter, null, 2) + '\n');
mkdirSync(target, {mode: 0o700});
for (const [name, bytes] of Object.entries(sources)) { const path = resolve(target, name); mkdirSync(dirname(path), {recursive: true}); writeFileSync(path, bytes, {mode: 0o600}); }
const manifest = {schema_version: 'are-text-task-deployment/v1', remote, state, runtime, task_digest: task.digest,
  files: Object.fromEntries(Object.entries(sources).map(([name, bytes]) => [name, sha(bytes)])),
  budget: {provider_calls: 1, max_output_tokens: 512, tools_enabled: false}, authority_effect: 'none', open_questions_ref: 'workspace/plans/luna-vps/runtime/TASKS.md#open-questions'};
writeFileSync(resolve(target, 'MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
