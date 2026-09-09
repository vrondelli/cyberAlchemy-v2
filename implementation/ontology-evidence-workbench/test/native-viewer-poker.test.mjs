import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  probeNativeViewer,
  requestNativeViewer,
  startNativeViewer,
  verifyNativeViewerReceipt,
} from "../scripts/serve-native-viewer.mjs";

const implementationRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

test("unmodified pinned viewer loads the admitted Poker graph", async () => {
  const service = await startNativeViewer({ implementationRoot });
  try {
    const response = await requestNativeViewer({
      baseUrl: service.baseUrl,
      path: `/knowledge-graph.json?token=${service.token}`,
    });
    assert.equal(response.status, 200);
    const graph = JSON.parse(response.body);
    assert.equal(graph.project.name, "Poker Team O13 Evidence");
    assert.deepEqual(graph.nodes.map(({ id }) => id).sort(), [
      "presentation:D1",
      "presentation:D2",
      "presentation:F1",
      "presentation:R1",
    ]);
    assert.deepEqual(
      graph.edges.map(({ source, type, target }) =>
        `${source}|${type}|${target}`).sort(),
      [
        "presentation:D2|contradicts|presentation:D1",
        "presentation:D2|related|presentation:D1",
        "presentation:F1|builds_on|presentation:R1",
        "presentation:R1|builds_on|presentation:D1",
      ],
    );
    assert.equal(service.viewer.archiveSha256,
      "3553aab3723b4c9eefe3c8198a417d9ce9199cd46334e26584989d6b52d1e3a4");
  } finally {
    await service.stop();
  }
  assert.deepEqual(service.lifecycle, {
    proxy_closed: true,
    child_terminated: true,
    temporary_root_removed: true,
  });
});

test("probe produces a receipt-complete, residue-free L0 witness", async () => {
  const { receipt } = await probeNativeViewer({ implementationRoot });
  assert.equal(receipt.result, "pass");
  assert.equal(receipt.handle, "oew-native-viewer-poker/v1");
  assert.equal(receipt.upstream_viewer.upstream_bytes_modified, false);
  assert.equal(receipt.server_boundary.outbound_requests, 0);
  assert.equal(receipt.poker.node_count, 4);
  assert.equal(receipt.poker.edge_count, 4);
  assert.deepEqual(receipt.lifecycle, {
    proxy_closed: true,
    child_terminated: true,
    temporary_root_removed: true,
  });
  assert.equal(receipt.authority_effect, "none");
});

test("independent receipt verifier binds retained adapter and viewer bytes", async () => {
  const result = await verifyNativeViewerReceipt(
    "generated/runs/SWU-OEW-006/native-viewer-receipt.json",
    { implementationRoot },
  );
  assert.equal(result.verified, true, result.issues.join(","));
  assert.equal(result.handle, "oew-native-viewer-poker/v1");
  assert.equal(result.authority_effect, "none");
});
