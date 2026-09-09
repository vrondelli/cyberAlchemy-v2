import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  AdapterRunWriteError,
  buildAdapterArtifacts,
  POKER_RELATION_SUBSET,
  writeAdapterRun,
} from "../src/adapter-run-writer.mjs";
import {
  CanonicalJsonError,
  canonicalJson,
} from "../src/canonical-json.mjs";
import { verifyAdapterReceipt } from "../scripts/verify-adapter-receipt.mjs";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(testDirectory, "../fixtures/poker-source-subset.json");
const verifierPath = resolve(testDirectory, "../scripts/verify-adapter-receipt.mjs");
const temporaryRoots = [];

async function temporaryRoot() {
  const root = await mkdtemp(join(tmpdir(), "oew-adapter-"));
  temporaryRoots.push(root);
  return root;
}

async function fixture() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map(
    (root) => rm(root, { recursive: true, force: true }),
  ));
});

test("canonical JSON sorts keys and rejects non-JSON values", () => {
  assert.equal(canonicalJson({ z: 1, a: { d: 2, c: 1 } }), '{"a":{"c":1,"d":2},"z":1}\n');
  assert.throws(
    () => canonicalJson({ invalid: Number.NaN }),
    (error) => error instanceof CanonicalJsonError &&
      error.issue === "NON_FINITE_NUMBER:$.invalid",
  );
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => canonicalJson(cyclic), /CYCLE:\$\.self/);
});

test("two independent Poker adapter builds are byte-identical", async () => {
  const nodeSubset = await fixture();
  const first = await buildAdapterArtifacts({ nodeSubset });
  const second = await buildAdapterArtifacts({
    nodeSubset: structuredClone(nodeSubset),
    relationSubset: structuredClone(POKER_RELATION_SUBSET),
  });
  assert.equal(first.graphBytes.equals(second.graphBytes), true);
  assert.equal(first.sidecarBytes.equals(second.sidecarBytes), true);
  assert.equal(first.graphSha256, second.graphSha256);
  assert.equal(first.sidecarSha256, second.sidecarSha256);
});

test("build emits pinned UA KnowledgeGraph and lossless Poker mappings", async () => {
  const result = await buildAdapterArtifacts({ nodeSubset: await fixture() });
  assert.equal(result.graph.version, "1.0.0");
  assert.equal(result.graph.kind, "knowledge");
  assert.equal(result.graph.nodes.length, 4);
  assert.equal(result.graph.edges.length, 4);
  assert.deepEqual(result.graph.tour.flatMap(({ nodeIds }) => nodeIds), [
    "presentation:F1",
    "presentation:R1",
    "presentation:D1",
  ]);
  assert.deepEqual(result.sidecar.grounding, {
    included_path: ["F1", "R1", "D1"],
    visible_excluded: ["D2"],
    indeterminate_candidates: ["C-SPECIALIZES-D2-D1"],
  });
  const specializes = result.sidecar.edges[
    "presentation-edge:D2:specializes:D1"
  ];
  assert.equal(specializes.policy_disposition, "policy-indeterminate");
  assert.equal(specializes.grounding_inclusion, "excluded");
  assert.deepEqual(specializes.diagnostics, ["POLICY_OWNER_UNBOUND"]);
  assert.equal(result.sidecar.authority_effect, "none");
});

test("writer witnesses graph and sidecar before writing receipt last", async () => {
  const root = await temporaryRoot();
  const output = join(root, "run");
  const phases = [];
  const result = await writeAdapterRun(output, {
    nodeSubset: await fixture(),
    onPhase: async ({ phase }) => {
      phases.push(phase);
      if (phase === "receipt-ready") {
        assert.deepEqual((await readdir(output)).sort(), [
          "evidence-sidecar.json",
          "presentation-graph.json",
        ]);
      }
    },
  });
  assert.deepEqual(phases, [
    "directory-created",
    "presentation-written",
    "sidecar-written",
    "receipt-ready",
    "receipt-written",
  ]);
  assert.deepEqual((await readdir(output)).sort(), [
    "adapter-receipt.json",
    "evidence-sidecar.json",
    "presentation-graph.json",
  ]);
  const verification = await verifyAdapterReceipt(result.receiptPath, {
    repositoryRoot: root,
  });
  assert.equal(verification.verified, true, verification.issues.join(","));
  assert.equal(verification.authority_effect, "none");
});

test("writer rejects overwrite before changing an existing run", async () => {
  const root = await temporaryRoot();
  const output = join(root, "run");
  await writeAdapterRun(output, { nodeSubset: await fixture() });
  const before = await Promise.all(
    (await readdir(output)).sort().map(async (name) => [
      name,
      await readFile(join(output, name), "utf8"),
    ]),
  );
  await assert.rejects(
    writeAdapterRun(output, { nodeSubset: await fixture() }),
    (error) => error instanceof AdapterRunWriteError &&
      error.issue === "OUTPUT_ALREADY_EXISTS",
  );
  const after = await Promise.all(
    (await readdir(output)).sort().map(async (name) => [
      name,
      await readFile(join(output, name), "utf8"),
    ]),
  );
  assert.deepEqual(after, before);
});

test("independent verifier rejects partial and extra-file runs", async () => {
  const root = await temporaryRoot();
  const partial = join(root, "partial");
  const artifacts = await buildAdapterArtifacts({ nodeSubset: await fixture() });
  await writeFile(join(root, "placeholder"), "x");
  await rm(join(root, "placeholder"));
  await import("node:fs/promises").then(({ mkdir }) => mkdir(partial));
  await writeFile(join(partial, "presentation-graph.json"), artifacts.graphBytes);
  await writeFile(join(partial, "evidence-sidecar.json"), artifacts.sidecarBytes);
  const partialResult = await verifyAdapterReceipt(
    join(partial, "adapter-receipt.json"),
    { repositoryRoot: root },
  );
  assert.equal(partialResult.verified, false);
  assert.ok(partialResult.issues.includes("RECEIPT_MISSING"));

  const complete = join(root, "complete");
  const written = await writeAdapterRun(complete, { nodeSubset: await fixture() });
  await writeFile(join(complete, "unexpected.txt"), "unexpected");
  const extraResult = await verifyAdapterReceipt(written.receiptPath, {
    repositoryRoot: root,
  });
  assert.equal(extraResult.verified, false);
  assert.ok(extraResult.issues.some((issue) => issue.startsWith("RUN_INVENTORY_INVALID:")));
});

test("independent verifier rejects graph and sidecar tampering", async () => {
  const root = await temporaryRoot();
  const original = join(root, "original");
  await writeAdapterRun(original, { nodeSubset: await fixture() });

  const graphTamper = join(root, "graph-tamper");
  await cp(original, graphTamper, { recursive: true });
  const graphPath = join(graphTamper, "presentation-graph.json");
  const graph = JSON.parse(await readFile(graphPath, "utf8"));
  graph.nodes[0].summary = "tampered";
  await writeFile(graphPath, JSON.stringify(graph));
  const graphResult = await verifyAdapterReceipt(
    join(graphTamper, "adapter-receipt.json"),
    { repositoryRoot: root },
  );
  assert.equal(graphResult.verified, false);
  assert.ok(graphResult.issues.includes("ARTIFACT_DIGEST_MISMATCH:presentation-graph.json"));

  const sidecarTamper = join(root, "sidecar-tamper");
  await cp(original, sidecarTamper, { recursive: true });
  const sidecarPath = join(sidecarTamper, "evidence-sidecar.json");
  const sidecar = JSON.parse(await readFile(sidecarPath, "utf8"));
  sidecar.authority_effect = "admit";
  await writeFile(sidecarPath, JSON.stringify(sidecar));
  const sidecarResult = await verifyAdapterReceipt(
    join(sidecarTamper, "adapter-receipt.json"),
    { repositoryRoot: root },
  );
  assert.equal(sidecarResult.verified, false);
  assert.ok(sidecarResult.issues.includes("AUTHORITY_EFFECT_FORBIDDEN:sidecar"));
  assert.ok(sidecarResult.issues.includes("ARTIFACT_DIGEST_MISMATCH:evidence-sidecar.json"));
});

test("verifier stays independent from writer and projection modules", async () => {
  const source = await readFile(verifierPath, "utf8");
  assert.doesNotMatch(source, /adapter-run-writer/);
  assert.doesNotMatch(source, /presentation-nodes/);
  assert.doesNotMatch(source, /presentation-edges/);
});
