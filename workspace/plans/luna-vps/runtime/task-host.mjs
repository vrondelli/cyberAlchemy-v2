// Immutable task host entry point. Open questions: TASKS.md#open-questions
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {startPilotHost} from './pilot-host.mjs';
import {compileTask} from './task-contract.mjs';
process.umask(0o077);
const config = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const taskContract = compileTask(config.task);
if (config.mode === 'live' && process.env.CREDENTIALS_DIRECTORY) config.credential_file = resolve(process.env.CREDENTIALS_DIRECTORY, 'openai-api-key');
const prepare = process.argv[3] === '--prepare';
const host = await startPilotHost(config, {prepare, taskContract});
process.stdout.write(JSON.stringify(host.status()) + '\n');
if (prepare) await host.close();
else for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, async () => {await host.close(); process.exit(0);});
