import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { AppError, errorBody, isObject } from './core.mjs';
import { openStore } from './store.mjs';

const HELP = `Memory Observatory local CLI

Usage:
  node src/cli.mjs --store FILE COMMAND --json JSON_OBJECT

Commands:
  create   Create a lesson; JSON includes product_id, participant_id, lesson_id,
           instruction, source_ref, and optional conditions/exclusions.
  revise   Revise lesson_id with expected_revision, instruction and source_ref.
  disable  Disable lesson_id with expected_revision; repeated disable is safe.
  list     List lessons for product_id and participant_id.
  history  Show lesson history for product_id, participant_id and lesson_id.
  export   Export all lessons and events for product_id and participant_id.
  explain  Assess a scoped text, optionally using invalidated_refs and override_ids.

The store is a local JSON file and is intended for one writer at a time.`;

function parseArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };
  let store;
  let command;
  let jsonText;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--store') store = argv[++i];
    else if (arg === '--json') jsonText = argv[++i];
    else if (arg.startsWith('--')) throw new AppError('validation_error', `Unknown option: ${arg}`);
    else if (!command) command = arg;
    else throw new AppError('validation_error', `Unexpected argument: ${arg}`);
  }
  if (!store) throw new AppError('validation_error', '--store is required');
  if (!command || !['create', 'revise', 'disable', 'list', 'history', 'export', 'explain'].includes(command)) {
    throw new AppError('validation_error', 'A valid command is required');
  }
  if (jsonText === undefined) return { store, command, input: {} };
  let input;
  try { input = JSON.parse(jsonText); } catch {
    throw new AppError('malformed_json', '--json is not valid JSON');
  }
  if (!isObject(input)) throw new AppError('validation_error', '--json must contain an object');
  return { store, command, input };
}

export async function runCli(argv = process.argv.slice(2)) {
  const config = parseArgs(argv);
  if (config.help) {
    process.stdout.write(HELP + '\\n');
    return;
  }
  const store = await openStore(config.store);
  let result;
  switch (config.command) {
    case 'create': result = { lesson: await store.create(config.input) }; break;
    case 'revise': result = { lesson: await store.revise(config.input) }; break;
    case 'disable': result = { lesson: await store.disable(config.input) }; break;
    case 'list': result = { lessons: await store.list(config.input) }; break;
    case 'history': result = { events: await store.history(config.input) }; break;
    case 'export': result = await store.export(config.input); break;
    case 'explain': result = await store.explain(config.input); break;
    default: throw new AppError('validation_error', 'Unsupported command');
  }
  process.stdout.write(JSON.stringify(result) + '\\n');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runCli().catch(error => {
    process.stderr.write(JSON.stringify(errorBody(error)) + '\\n');
    process.exitCode = 1;
  });
}
