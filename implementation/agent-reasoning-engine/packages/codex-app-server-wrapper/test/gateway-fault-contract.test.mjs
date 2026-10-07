import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

import {GATEWAY_SESSION_FAULT_REASON_CODES, GATEWAY_SESSION_FAULT_SCHEMA,
  isGatewaySessionFaultReason} from "../src/gateway-fault-contract.mjs";

test("durable gateway fault reasons have one closed client and store contract", () => {
  assert.equal(GATEWAY_SESSION_FAULT_SCHEMA, "are.gateway-session-fault/v1");
  assert.deepEqual(GATEWAY_SESSION_FAULT_REASON_CODES, ["gateway.turn-marker-history-conflict",
    "gateway.turn-history-status-conflict", "gateway.turn-completion-status-conflict",
    "gateway.compaction-history-conflict", "gateway.compaction-item-history-conflict"]);
  const browser = readFileSync(new URL("../client/app.js", import.meta.url), "utf8");
  for (const reason of GATEWAY_SESSION_FAULT_REASON_CODES) {
    assert.equal(isGatewaySessionFaultReason(reason), true, reason);
    assert.ok(browser.includes(JSON.stringify(reason)), `Hosted browser fault projection is missing ${reason}`);
  }
  for (const reason of [null, "gateway.compaction-unsettled", "gateway.session-faulted",
    "gateway.compaction-history-conflict:private-thread"]) {
    assert.equal(isGatewaySessionFaultReason(reason), false);
  }
});
