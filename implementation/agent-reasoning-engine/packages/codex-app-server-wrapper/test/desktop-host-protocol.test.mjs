import assert from "node:assert/strict";
import test from "node:test";

import {desktopHostDeliveryPosture, desktopHostGlobalNotificationPosture,
  isDesktopSidebandNotification} from "../src/desktop-host-protocol.mjs";

test("desktop outbound projection distinguishes native App Server messages from ARE sideband", () => {
  const sideband = {jsonrpc: "2.0", method: "cyberalchemy/decision", params: {directive_kind: "gate"}};
  assert.equal(isDesktopSidebandNotification(sideband), true);
  assert.equal(desktopHostDeliveryPosture(sideband).kind, "sideband");
  assert.equal(desktopHostDeliveryPosture({jsonrpc: "2.0", method: "thread/status/changed",
    params: {threadId: "thread-1"}}).kind, "native-notification");
  assert.equal(desktopHostDeliveryPosture({jsonrpc: "2.0", id: 1, result: {}}).kind, "native-response");
  assert.equal(desktopHostDeliveryPosture({jsonrpc: "2.0", id: null,
    error: {code: -32700, message: "Parse error"}}).kind, "native-error");
  const remoteStatus = {jsonrpc: "2.0", method: "remoteControl/status/changed",
    params: {status: "disabled", serverName: "fixture", installationId: "install-1",
      environmentId: null}};
  assert.equal(desktopHostGlobalNotificationPosture(remoteStatus).kind, "admitted");
  assert.equal(desktopHostDeliveryPosture(remoteStatus).kind, "native-notification");
});

test("desktop outbound projection rejects unknown notices and malformed or unattributed requests", () => {
  assert.equal(desktopHostDeliveryPosture({jsonrpc: "2.0", method: "unknown/event"}).reason,
    "desktop-gateway.server-notification-unsupported");
  assert.equal(desktopHostDeliveryPosture({jsonrpc: "2.0", id: "input-1",
    method: "item/tool/requestUserInput", params: {threadId: "thread-1", turnId: "turn-1",
      isBlocking: true, questions: [{}]}}).reason, "desktop-gateway.server-request-unsupported");
  assert.equal(desktopHostDeliveryPosture({jsonrpc: "2.0", id: "form-1",
    method: "mcpServer/elicitation/request", params: {threadId: "thread-1",
      serverName: "fixture"}}).reason, "desktop-gateway.server-request-unsupported");
  assert.equal(desktopHostDeliveryPosture({jsonrpc: "2.0", id: null,
    result: {}}).reason, "desktop-gateway.delivery-invalid");
  for (const params of [{status: "connected", serverName: "fixture"},
    {status: "invented", serverName: "fixture", installationId: "install-1"},
    {status: "disabled", serverName: "fixture", installationId: "install-1", token: "secret"}]) {
    assert.equal(desktopHostGlobalNotificationPosture({jsonrpc: "2.0",
      method: "remoteControl/status/changed", params}).reason,
    "desktop-gateway.global-notification-invalid");
  }
});
