// Task receipt rejection against actual RWO. Open questions: ../TASKS.md#open-questions
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {compileTask} from '../task-contract.mjs';
import {createAdapter} from './adapter.mjs';
import {projectWorkers} from '../../../../../workspace/runtime/src/features/control-center/workers.ts';
const root = mkdtempSync(resolve(tmpdir(), 'rwo-text-boundary-'));
const taskContract = compileTask(JSON.parse(readFileSync(new URL('../task.example.json', import.meta.url))));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const kernel = resolve(process.argv[2]);
const base = {kernel, kernel_sha256: sha(readFileSync(kernel)), socket: resolve(root, 'private.sock'), request_id: taskContract.task.task_id, task: taskContract.task};
const valid = {request_id: base.request_id, status: 'passed', model: 'gpt-5.6-luna', prompt_sha256: sha(taskContract.prompt),
  task_digest: taskContract.digest, verified: true, provider_calls: 1, max_output_tokens: 512, tools_enabled: false,
  output: 'The bounded runtime is verified. Launch controls remain to be implemented.', thread_id: 'thread', turn_id: 'turn', completion_binding_digest: 'a'.repeat(64)};
try {
  for (const [name, result] of [['wrong-task', {...valid, task_digest: 'b'.repeat(64)}], ['empty', {...valid, output: ' '}], ['oversize', {...valid, output: 'x'.repeat(8193)}]]) {
    let calls = 0;
    const adapter = createAdapter({...base, state: resolve(root, name)}, async () => {calls++; return result;}, {taskContract});
    await assert.rejects(adapter.run()); assert.equal(adapter.read().status, 'uncertain');
    await assert.rejects(adapter.run(), /RECONCILIATION/); assert.equal(calls, 1);
  }
  const adapter = createAdapter({...base, state: resolve(root, 'good')}, async (_socket, request) => {
    assert.deepEqual(request, {op: 'run', request_id: base.request_id, task_digest: taskContract.digest}); return valid;
  }, {taskContract});
  await adapter.run(); assert.equal((await adapter.run()).new_provider_calls, 0);
  const projection = adapter.projection(), workers = projectWorkers(projection);
  assert.equal(workers.tasks[0].run, taskContract.task.title); assert.equal(workers.tasks[0].role, 'text-worker');
  assert.equal(workers.tasks[0].evidence.turnId, valid.turn_id);
  assert.ok(!JSON.stringify(projection).includes(valid.output)); assert.ok(!JSON.stringify(projection).includes(taskContract.task.input));
  console.log(JSON.stringify({status:'PASS', wrong_task_receipt_rejected:true, invalid_result_blocks_retry:true,
    workspace_task_projection:true, input_output_not_in_read_model:true, external_model_calls:0, open_questions_ref:'../runtime/TASKS.md#open-questions'},null,2));
} finally {rmSync(root,{recursive:true,force:true});}
