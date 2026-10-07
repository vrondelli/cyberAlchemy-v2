#!/usr/bin/env node
import {runStdioServer} from "../src/server.mjs";

runStdioServer().catch((error) => {
  process.stderr.write(`are-dsh-app-server: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
