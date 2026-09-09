import { describe, expect, it } from "vitest";

import manifest from "../../IMPLEMENTATION-MANIFEST.candidate.json";

const validatorModulePath = "../../scripts/check-implementation-manifest.mjs";

async function validator() {
  return import(validatorModulePath);
}

describe("Workspace implementation manifest", () => {
  it("returns PASS only for the exact current candidate binding", async () => {
    const { checkImplementationManifest } = await validator();
    const report = checkImplementationManifest({ manifest });

    expect(report).toMatchObject({
      status: "PASS",
      authority_effect: "none",
      canonical_generation_claim: false,
      retained_blockers: ["WORKSPACE_CATALOG_SNAPSHOT_DRIFT"],
    });
    expect(report.bindings.preserved_explore_snapshot.snapshot_id).not.toBe(
      report.bindings.ontology_canvas_graph.graph_epoch_sha256,
    );
    expect(report.bindings.are_governed_chat).toMatchObject({
      source_count: 40,
      interface_sha256:
        "a38b798f2abc3e3165a7f5473a9d9b769ec0a7588b4cd81e98c2dafd17d1749e",
      transport: "tauri-channel-to-are-jsonl-stdio",
    });
  });

  it("fails closed when a bound source digest drifts", async () => {
    const { checkImplementationManifest } = await validator();
    const driftedManifest = structuredClone(manifest);
    driftedManifest.bindings.ontology_canvas_graph.nodes.sha256 = "0".repeat(64);

    expect(() =>
      checkImplementationManifest({ manifest: driftedManifest }),
    ).toThrowError(
      expect.objectContaining({
        code: "SOURCE_DIGEST_DRIFT",
      }),
    );
  });

  it("fails closed when a chat source digest drifts", async () => {
    const { checkImplementationManifest } = await validator();
    const driftedManifest = structuredClone(manifest);
    driftedManifest.bindings.are_governed_chat.source_closure[1].sha256 =
      "0".repeat(64);

    expect(() =>
      checkImplementationManifest({ manifest: driftedManifest }),
    ).toThrowError(
      expect.objectContaining({
        code: "SOURCE_DIGEST_DRIFT",
      }),
    );
  });

  it("fails closed when the chat closure omits a required boundary", async () => {
    const { checkImplementationManifest } = await validator();
    const incompleteManifest = structuredClone(manifest);
    incompleteManifest.bindings.are_governed_chat.source_closure =
      incompleteManifest.bindings.are_governed_chat.source_closure.slice(1);

    expect(() =>
      checkImplementationManifest({ manifest: incompleteManifest }),
    ).toThrowError(
      expect.objectContaining({
        code: "CHAT_SOURCE_CLOSURE_INVALID",
      }),
    );
  });
});
