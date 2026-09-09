// Task-aware RWO entry point. Open questions: ../TASKS.md#open-questions
import {readFileSync} from 'node:fs';
import {createAdapter, serve} from './adapter.mjs';
import {compileTask} from '../task-contract.mjs';
const [path, op] = process.argv.slice(2), config = JSON.parse(readFileSync(path, 'utf8'));
const adapter = createAdapter(config, undefined, {taskContract: compileTask(config.task)});
if (op === 'run') process.stdout.write(JSON.stringify(await adapter.run()) + '\n');
else if (op === 'verify') process.stdout.write(JSON.stringify(adapter.projection()) + '\n');
else if (op === 'serve') await serve(adapter, config.port);
else throw new Error('usage: task-adapter.mjs config.json run|verify|serve');
