import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  OewGatewayError,
  parseGatewayArgs,
  probeOewPrototypeGateway,
  requestGateway,
  startOewPrototypeGateway,
  validateGatewayNetwork,
} from "../scripts/serve-oew-prototype.mjs";
import { validateRequestTarget } from "../scripts/serve-native-viewer.mjs";

const implementationRoot = resolve(import.meta.dirname, "..");
const buildHandle =
  "generated/runs/SWU-OEWTP-002/20260807T133357Z/thin-prototype-build-handle.json";
const adapterRun = "generated/runs/SWU-OEW-004";
const issue = (expected) => (error) =>
  error instanceof OewGatewayError && error.issue === expected;

test("CLI and network boundary are exact", () => {
  assert.deepEqual(
    parseGatewayArgs([
      "serve",
      "--build-handle",
      buildHandle,
      "--adapter-run",
      adapterRun,
      "--output",
      "generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json",
    ]),
    {
      buildHandle,
      adapterRun,
      output:
        "generated/runs/SWU-OEWTP-003/20260729T191400Z/gateway-handle.json",
    },
  );
  assert.throws(() => parseGatewayArgs(["start"]), issue("COMMAND_INVALID"));
  assert.throws(
    () => validateGatewayNetwork({ bindHost: "0.0.0.0" }),
    issue("NON_LOOPBACK_BIND_FORBIDDEN"),
  );
  assert.throws(
    () => validateGatewayNetwork({ targetHost: "example.com" }),
    issue("OUTBOUND_TARGET_FORBIDDEN"),
  );
});

test("request target bank rejects traversal and malformed forms", () => {
  for (const target of [
    "/.",
    "/..",
    "/%2e%2e/secret",
    "/%2fsecret",
    "/%5csecret",
    "/%00secret",
    "/a\\b",
    `/x?${"a".repeat(8192)}`,
  ]) {
    assert.throws(() => validateRequestTarget(target));
  }
});

test("live gateway requires explicit evidence tokens and releases its port", async () => {
  const service = await startOewPrototypeGateway({
    buildHandle,
    adapterRun,
    implementationRoot,
  });
  try {
    const bootstrap = await requestGateway({
      baseUrl: service.baseUrl,
      path: `/?token=${service.token}`,
    });
    assert.equal(bootstrap.status, 200);
    assert.match(
      bootstrap.headers["content-security-policy"],
      /connect-src 'self'/,
    );
    assert.equal(bootstrap.body.includes(Buffer.from("https://")), false);
    const cookie = bootstrap.headers["set-cookie"][0].split(";", 1)[0];
    const graph = await requestGateway({
      baseUrl: service.baseUrl,
      path: `/oew-data/presentation-graph.json?token=${service.token}`,
    });
    assert.equal(graph.status, 200);
    const cookieOnly = await requestGateway({
      baseUrl: service.baseUrl,
      path: "/oew-data/presentation-graph.json",
      cookie,
    });
    assert.equal(cookieOnly.status, 401);
  } finally {
    await service.stop();
  }
  await assert.rejects(
    requestGateway({ baseUrl: service.baseUrl, path: "/" }),
    (error) => ["ECONNREFUSED", "ECONNRESET"].includes(error.code),
  );
});

test(
  "canonical probe covers the full request bank and writes a redacted handle",
  { skip: !process.env.OEW_GATEWAY_OUTPUT },
  async () => {
    const relativeOutput = process.env.OEW_GATEWAY_OUTPUT;
    const result = await probeOewPrototypeGateway({
      buildHandle,
      adapterRun,
      output: relativeOutput,
      implementationRoot,
    });
    assert.equal(result.result, "pass");
    assert.equal(result.request_bank.failed, 0);
    assert.equal(result.request_bank.outbound_requests, 0);
    assert.equal(result.closure.server_closed, true);
    assert.equal(result.closure.port_released, true);
    const written = JSON.parse(
      await readFile(resolve(implementationRoot, relativeOutput), "utf8"),
    );
    assert.equal(written.process.token_persisted, false);
    assert.equal(Object.hasOwn(written.process, "token"), false);
  },
);
