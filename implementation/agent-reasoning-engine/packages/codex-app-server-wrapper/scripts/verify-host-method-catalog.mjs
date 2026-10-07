#!/usr/bin/env node
import {realpathSync} from "node:fs";
import {isAbsolute} from "node:path";

import {verifyHostMethodCatalog} from "../src/host-catalog-verification.mjs";

const binaryArg = process.argv[2];
if (!binaryArg || !isAbsolute(binaryArg)) {
  process.stderr.write("Usage: node scripts/verify-host-method-catalog.mjs /absolute/path/to/codex\n");
  process.exitCode = 2;
} else {
  let binary;
  try { binary = realpathSync(binaryArg); }
  catch { binary = binaryArg; }
  const result = verifyHostMethodCatalog({command: binary});
  (result.ok ? process.stdout : process.stderr).write(`${JSON.stringify(result)}\n`);
  if (!result.ok) process.exitCode = 1;
}
