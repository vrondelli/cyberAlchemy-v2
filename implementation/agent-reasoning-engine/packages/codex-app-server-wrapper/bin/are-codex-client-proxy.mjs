#!/usr/bin/env node
import {resolve} from "node:path";

import {runGatewayClientProxy} from "../index.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const socketArg = argument("--socket");
const consumerArg = argument("--consumer");
const laneArg = argument("--lane");
if (!socketArg || !consumerArg || !["plan-bound", "interaction-bound"].includes(laneArg)) {
  process.stderr.write("Usage: are-codex-client-proxy --socket <gateway.sock> --consumer <consumer-id> --lane plan-bound|interaction-bound\n");
  process.exitCode = 2;
} else {
  runGatewayClientProxy({socket_path: resolve(socketArg), consumer_id: consumerArg, lane: laneArg});
}
