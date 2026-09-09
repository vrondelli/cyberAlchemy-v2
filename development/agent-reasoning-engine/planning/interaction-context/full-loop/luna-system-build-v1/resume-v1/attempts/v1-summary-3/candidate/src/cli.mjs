import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppError } from "./core.mjs";
import { MemoryStore } from "./store.mjs";

const HELP = `Memory Observatory local CLI

Usage:
  node src/cli.mjs --store FILE COMMAND --json JSON_OBJECT

Commands:
  create   Create a lesson.
  revise   Revise a lesson; input requires lesson_id and expected_revision.
  disable  Disable a lesson; input requires lesson_id and expected_revision.
  list     List lessons for product_id and participant_id.
  history  Show one lesson's events; input also requires lesson_id.
  export   Export one product/participant scope.
  explain  Assess scoped lessons against text.

All successful results are one JSON object on stdout. Errors are JSON on stderr.`;

function errorPayload(error) {
  return {
    error: {
      code: error?.code || "INTERNAL_ERROR",
      message: error instanceof AppError ? error.message : "internal CLI error"
    }
  };
}

function parseArgs(args) {
  let store;
  let command;
  let json;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") return { help: true };
    if (arg === "--store") store = args[++index];
    else if (arg === "--json") json = args[++index];
    else if (arg.startsWith("--")) throw new AppError("INVALID_INPUT", `unknown argument: ${arg}`);
    else if (!command) command = arg;
    else throw new AppError("INVALID_INPUT", `unexpected argument: ${arg}`);
  }

  if (typeof store !== "string" || store.length === 0) {
    throw new AppError("INVALID_INPUT", "--store FILE is required");
  }
  if (!command || !["create", "revise", "disable", "list", "history", "export", "explain"].includes(command)) {
    throw new AppError("INVALID_INPUT", "a valid command is required");
  }
  if (typeof json !== "string") throw new AppError("INVALID_INPUT", "--json JSON_OBJECT is required");

  let input;
  try {
    input = JSON.parse(json);
  } catch {
    throw new AppError("MALFORMED_JSON", "--json must contain valid JSON");
  }
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError("INVALID_INPUT", "--json must contain a JSON object");
  }
  return { store, command, input };
}

export function runCommand(options) {
  const store = new MemoryStore(options.store);
  switch (options.command) {
    case "create": return { lesson: store.create(options.input) };
    case "revise": return { lesson: store.revise(options.input) };
    case "disable": return { lesson: store.disable(options.input) };
    case "list": return { lessons: store.list(options.input) };
    case "history": return { events: store.history(options.input) };
    case "export": return store.exportScope(options.input);
    case "explain": return store.explain(options.input);
    default: throw new AppError("INVALID_INPUT", "unknown command");
  }
}

export function main(args = process.argv.slice(2)) {
  try {
    const options = parseArgs(args);
    if (options.help) {
      process.stdout.write(`${HELP}\n`);
      return 0;
    }
    process.stdout.write(`${JSON.stringify(runCommand(options))}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${JSON.stringify(errorPayload(error))}\n`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
