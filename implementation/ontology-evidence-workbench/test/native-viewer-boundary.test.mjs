import assert from "node:assert/strict";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  NativeViewerError,
  requestNativeViewer,
  resolveVerifiedAdapterRun,
  startNativeViewer,
  validateNetworkBoundary,
  validateRequestTarget,
} from "../scripts/serve-native-viewer.mjs";

const implementationRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
const temporaryRoots = [];
const services = [];

async function temporaryRoot() {
  const root = await mkdtemp(join(tmpdir(), "oew-native-boundary-test-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(services.splice(0).map(({ stop }) => stop()));
  await Promise.all(
    temporaryRoots.splice(0).map(
      (root) => rm(root, { recursive: true, force: true }),
    ),
  );
});

test("outer proxy enforces token, GET/HEAD, traversal, and browser asset access", async () => {
  const service = await startNativeViewer({ implementationRoot });
  services.push(service);

  const root = await requestNativeViewer({
    baseUrl: service.baseUrl,
    path: `/?token=${service.token}`,
  });
  assert.equal(root.status, 200);
  assert.match(root.body.toString("utf8"), /<!doctype html/i);
  const cookie = root.headers["set-cookie"]?.[0]?.split(";", 1)[0];
  assert.match(cookie, /^oew_viewer_access=/);
  const assetPath = root.body.toString("utf8").match(
    /(?:src|href)="(\/assets\/[^"]+)"/,
  )?.[1];
  assert.ok(assetPath);
  const asset = await requestNativeViewer({
    baseUrl: service.baseUrl,
    path: assetPath,
    cookie,
  });
  assert.equal(asset.status, 200);
  assert.ok(asset.body.length > 0);

  const head = await requestNativeViewer({
    baseUrl: service.baseUrl,
    method: "HEAD",
    path: `/?token=${service.token}`,
  });
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);

  assert.equal(
    (await requestNativeViewer({ baseUrl: service.baseUrl, path: "/" })).status,
    403,
  );
  assert.equal(
    (await requestNativeViewer({
      baseUrl: service.baseUrl,
      path: `/?token=${"0".repeat(64)}`,
    })).status,
    403,
  );
  assert.equal(
    (await requestNativeViewer({
      baseUrl: service.baseUrl,
      method: "POST",
      path: `/?token=${service.token}`,
    })).status,
    405,
  );
  assert.equal(
    (await requestNativeViewer({
      baseUrl: service.baseUrl,
      path: `/%2e%2e/secret?token=${service.token}`,
    })).status,
    400,
  );
  assert.equal(service.counters.outbound_requests, 0);
});

test("network and request-target guards reject non-loopback and traversal", () => {
  assert.throws(
    () => validateNetworkBoundary({ bindHost: "0.0.0.0" }),
    (error) => error instanceof NativeViewerError &&
      error.issue === "NON_LOOPBACK_BIND_FORBIDDEN",
  );
  assert.throws(
    () => validateNetworkBoundary({ proxyTargetHost: "example.com" }),
    (error) => error instanceof NativeViewerError &&
      error.issue === "OUTBOUND_TARGET_FORBIDDEN",
  );
  for (const target of [
    "/../secret",
    "/%2e%2e/secret",
    "/%252e%252e/secret",
    "/..%2fsecret",
    "/folder\\secret",
  ]) {
    assert.throws(
      () => validateRequestTarget(target),
      (error) => error instanceof NativeViewerError &&
        error.issue.startsWith("REQUEST_"),
    );
  }
});

test("adapter symlink escape fails before verifier or server launch", async () => {
  const root = await temporaryRoot();
  const implementation = join(root, "implementation");
  const runs = join(implementation, "generated/runs");
  const outside = join(root, "outside-run");
  await mkdir(runs, { recursive: true });
  await mkdir(outside);
  await symlink(outside, join(runs, "escape"), "dir");

  await assert.rejects(
    resolveVerifiedAdapterRun({
      adapterRun: "generated/runs/escape",
      implementationRoot: implementation,
    }),
    (error) => error instanceof NativeViewerError &&
      error.issue === "ADAPTER_RUN_SYMLINK_ESCAPE",
  );
});

test("tampered adapter run fails before viewer extraction or server launch", async () => {
  const root = await temporaryRoot();
  const implementation = join(root, "implementation");
  const run = join(implementation, "generated/runs/tampered");
  await mkdir(dirname(run), { recursive: true });
  await cp(join(implementationRoot, "generated/runs/SWU-OEW-004"), run, {
    recursive: true,
  });
  const graphPath = join(run, "presentation-graph.json");
  const graph = JSON.parse(await readFile(graphPath, "utf8"));
  graph.nodes[0].summary = "tampered";
  await writeFile(graphPath, `${JSON.stringify(graph)}\n`);

  await assert.rejects(
    resolveVerifiedAdapterRun({
      adapterRun: "generated/runs/tampered",
      implementationRoot: implementation,
    }),
    (error) => error instanceof NativeViewerError &&
      error.issue === "ADAPTER_RUN_UNVERIFIED",
  );
});
