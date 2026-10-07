#!/usr/bin/env node
import {observeGatewayEvolutionSignals} from "../src/gateway-signal-observer.mjs";

const args = process.argv.slice(2);
const logIndex = args.indexOf("--log");
if (args.length !== 3 || !args.includes("--json") || logIndex < 0 || !args[logIndex + 1]) {
  process.stderr.write("Usage: observe-gateway-signals.mjs --json --log <absolute-private-path>\n");
  process.exitCode = 2;
} else {
  process.stdout.write(`${JSON.stringify(observeGatewayEvolutionSignals({log_path: args[logIndex + 1]}))}\n`);
}
