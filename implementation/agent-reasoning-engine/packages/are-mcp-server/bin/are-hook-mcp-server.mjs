#!/usr/bin/env node
import {runHookMcpStdio} from "../src/hook-server.mjs";

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--connection-file") {
  process.stderr.write("Usage: are-hook-mcp-server --connection-file <absolute-private-path>\n");
  process.exit(2);
}
await runHookMcpStdio({connection_path: args[1]});
