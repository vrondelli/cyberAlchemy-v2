// Boundary tests. Open questions: TASKS.md#open-questions
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileTask} from './task-contract.mjs';
const sample = JSON.parse(readFileSync(new URL('./task.example.json', import.meta.url), 'utf8'));
const compiled = compileTask(sample);
assert.equal(compiled.digest, compileTask(Object.fromEntries(Object.entries(sample).reverse())).digest);
sample.input = 'Mutated caller object'; assert.notEqual(compiled.task.input, sample.input);
for (const invalid of [null, {}, {...compiled.task, tools: []}, {...compiled.task, task_id: '../escape'},
  {...compiled.task, instruction: ''}, {...compiled.task, input: 'é'.repeat(4097)}, {...compiled.task, input: 'x\0y'}, {...compiled.task, title: 1}]) assert.throws(() => compileTask(invalid));
for (const invalid of ['', '   ', null, 'é'.repeat(4097), 'x\0y']) assert.throws(() => compiled.verifyOutput(invalid));
compiled.verifyOutput('A bounded text result.');
assert.throws(() => compileTask({...compiled.task, objective_kind: 'implement'}), /OBJECTIVE_UNSUPPORTED/);
assert.notEqual(compiled.digest, compileTask({...compiled.task, input: 'Changed input'}).digest);
console.log(JSON.stringify({status: 'PASS', malformed_tasks_rejected: 9, invalid_outputs_rejected: 5, stable_property_order: true, unsupported_objective_rejected: true,
  caller_mutation_isolated: true, changed_input_changes_digest: true, external_model_calls: 0, open_questions_ref: '../runtime/TASKS.md#open-questions'}, null, 2));
