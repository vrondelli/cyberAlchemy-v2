import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {basename, dirname, join, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import test from "node:test";

const implementationRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const adapterRoot = resolve(
  "/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEW-004",
);
const overlayRoot = join(
  implementationRoot,
  "upstream/overlay/packages/dashboard/src/oew",
);
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

async function loadModules() {
  const workroot = await mkdtemp(join(tmpdir(), "oew-ui-store-test-"));
  const types = await readFile(join(overlayRoot, "types.ts"), "utf8");
  const loader = (await readFile(join(overlayRoot, "loadOewBundle.ts"), "utf8"))
    .replace("./types.ts", "./types.mjs");
  const store = (await readFile(join(overlayRoot, "store.ts"), "utf8"))
    .replace("./types.ts", "./types.mjs");
  await writeFile(join(workroot, "types.mjs"), types);
  await writeFile(join(workroot, "loadOewBundle.mjs"), loader);
  await writeFile(join(workroot, "store.mjs"), store);
  return {
    workroot,
    loader: await import(pathToFileURL(join(workroot, "loadOewBundle.mjs"))),
    store: await import(pathToFileURL(join(workroot, "store.mjs"))),
  };
}

async function fixture() {
  const documents = {};
  for (const file of [
    "presentation-graph.json",
    "evidence-sidecar.json",
    "adapter-receipt.json",
  ]) {
    documents[file] = await readFile(join(adapterRoot, file), "utf8");
  }
  return documents;
}

const response = (text) => ({
  ok: true,
  status: 200,
  text: async () => text,
});

test("loads the exact Poker graph, sidecar, and receipt into a total source-ref index", async () => {
  const modules = await loadModules();
  try {
    const documents = await fixture();
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({url, options});
      return response(documents[basename(new URL(url).pathname)]);
    };
    const bundle = await modules.loader.loadOewBundle({
      baseUrl: "http://127.0.0.1:4173/oew/",
      token: "local-token",
      expectedReceiptSha256: sha256(documents["adapter-receipt.json"]),
      fetchImpl,
      sha256Impl: async (text) => sha256(text),
    });
    assert.equal(bundle.sourceRefs.length, 8);
    assert.deepEqual(bundle.sourceRefs, [
      "C-SPECIALIZES-D2-D1",
      "D1",
      "D2",
      "E3",
      "E4",
      "E5",
      "F1",
      "R1",
    ]);
    assert.equal(calls.length, 3);
    assert.ok(calls.every(({url}) => new URL(url).searchParams.get("token") === "local-token"));
    assert.ok(calls.every(({options}) => options.method === "GET"));

    const store = modules.store.createOewStore(bundle);
    assert.equal(store.handle, "oew-ui-store/v1");
    assert.equal(store.getState().mode, "evidence-only");
    store.selectSourceRef("C-SPECIALIZES-D2-D1");
    assert.deepEqual(
      {
        source: store.getState().selectedSourceRef,
        kind: store.getState().selectedKind,
        presentation: store.getState().selectedPresentationId,
      },
      {
        source: "C-SPECIALIZES-D2-D1",
        kind: "edge",
        presentation: "presentation-edge:D2:specializes:D1",
      },
    );
    assert.equal(
      store.getBySourceRef("C-SPECIALIZES-D2-D1").row.policy_disposition,
      "policy-indeterminate",
    );
    assert.throws(() => store.selectSourceRef("missing"), {message: /SOURCE_REF_UNKNOWN/});
  } finally {
    await rm(modules.workroot, {recursive: true, force: true});
  }
});

test("wrong receipt digest and changed graph bytes fail closed", async () => {
  const modules = await loadModules();
  try {
    const documents = await fixture();
    const fetchImpl = async (url) =>
      response(documents[basename(new URL(url).pathname)]);
    await assert.rejects(
      modules.loader.loadOewBundle({
        baseUrl: "http://127.0.0.1/",
        token: "t",
        expectedReceiptSha256: "0".repeat(64),
        fetchImpl,
        sha256Impl: async (text) => sha256(text),
      }),
      {message: /RECEIPT_DIGEST/},
    );
    const changed = {...documents};
    const graph = JSON.parse(changed["presentation-graph.json"]);
    graph.nodes[0].name = "tampered";
    changed["presentation-graph.json"] = `${JSON.stringify(graph)}\n`;
    await assert.rejects(
      modules.loader.loadOewBundle({
        baseUrl: "http://127.0.0.1/",
        token: "t",
        expectedReceiptSha256: sha256(changed["adapter-receipt.json"]),
        fetchImpl: async (url) => response(changed[basename(new URL(url).pathname)]),
        sha256Impl: async (text) => sha256(text),
      }),
      {message: /GRAPH_DIGEST/},
    );
  } finally {
    await rm(modules.workroot, {recursive: true, force: true});
  }
});

test("missing mappings, duplicate source refs, and authority effects are rejected", async () => {
  const modules = await loadModules();
  try {
    const documents = await fixture();
    const parsed = Object.fromEntries(
      Object.entries(documents).map(([key, value]) => [key, JSON.parse(value)]),
    );
    const hashes = {
      graph: sha256(documents["presentation-graph.json"]),
      sidecar: sha256(documents["evidence-sidecar.json"]),
      receipt: sha256(documents["adapter-receipt.json"]),
    };
    const validate = (next) =>
      modules.loader.loadOewBundle({
        baseUrl: "http://127.0.0.1/",
        token: "t",
        expectedReceiptSha256: hashes.receipt,
        fetchImpl: async (url) => {
          const file = basename(new URL(url).pathname);
          return response(
            next[file] ?? documents[file],
          );
        },
        sha256Impl: async (text) => {
          if (text.includes("\"tamper_mode\"")) {
            const role = JSON.parse(text).tamper_mode;
            return hashes[role];
          }
          return sha256(text);
        },
      });

    const missing = structuredClone(parsed["evidence-sidecar.json"]);
    delete missing.nodes["presentation:D1"];
    missing.tamper_mode = "sidecar";
    await assert.rejects(
      validate({"evidence-sidecar.json": JSON.stringify(missing)}),
      {message: /NODE_MAPPING_NOT_TOTAL/},
    );

    const duplicate = structuredClone(parsed["evidence-sidecar.json"]);
    duplicate.nodes["presentation:D2"].source_ref = "D1";
    duplicate.tamper_mode = "sidecar";
    await assert.rejects(
      validate({"evidence-sidecar.json": JSON.stringify(duplicate)}),
      {message: /SOURCE_REF_DUPLICATE/},
    );

    const authority = structuredClone(parsed["evidence-sidecar.json"]);
    authority.authority_effect = "promotion";
    authority.tamper_mode = "sidecar";
    await assert.rejects(
      validate({"evidence-sidecar.json": JSON.stringify(authority)}),
      {message: /SIDECAR_AUTHORITY/},
    );
  } finally {
    await rm(modules.workroot, {recursive: true, force: true});
  }
});

test("optional v1.3 assembler adds a total exact projection without changing legacy fetches", async () => {
  const modules = await loadModules();
  try {
    const scene = {
      schema_version: "oew.knowledge-scene.v1.3",
      scene_digest: "a".repeat(64),
      relation_index_receipt: {relation_ids: ["relation-a", "relation-b"]},
    };
    const observed = [];
    const result = await modules.loader.assembleV13RelationBundle({
      bundle: {legacy: true},
      scene,
      encoding: {registry: true},
      geometry: {layout: true},
      assembler: async (input) => {
        observed.push(input);
        return {
          "relation-a": {ref: {source_relation_id: "relation-a", scene_digest: scene.scene_digest}},
          "relation-b": {ref: {source_relation_id: "relation-b", scene_digest: scene.scene_digest}},
        };
      },
    });
    assert.equal(observed.length, 1);
    assert.equal(result.legacy, true);
    assert.deepEqual(Object.keys(result.relationProjectionBySourceRef), [
      "relation-a",
      "relation-b",
    ]);
    await assert.rejects(
      modules.loader.assembleV13RelationBundle({
        bundle: {},
        scene,
        assembler: async () => ({"relation-a": {}}),
      }),
      {message: /RELATION_PROJECTION_NOT_TOTAL/},
    );
  } finally {
    await rm(modules.workroot, {recursive: true, force: true});
  }
});
