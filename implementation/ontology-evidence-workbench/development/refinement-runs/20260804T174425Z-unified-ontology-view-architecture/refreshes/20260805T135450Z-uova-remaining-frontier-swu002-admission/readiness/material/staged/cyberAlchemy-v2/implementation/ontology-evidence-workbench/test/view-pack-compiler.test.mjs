import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDirectory = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(
  testDirectory,
  "../upstream/overlay/packages/dashboard/src/oew/scene/viewPack.ts",
);
const {
  OEW_VIEW_PACK_SCHEMA,
  ViewPackError,
  compileViewPack,
  computeViewPackDigest,
} = await import(pathToFileURL(sourcePath));

const graphDigest = "a".repeat(64);
const sourceGraph = {
  schema_version: "oew.compiled-source-graph.v1",
  graph_digest: graphDigest,
  nodes: [
    { source_node_id: "node-c" },
    { source_node_id: "node-a" },
    { source_node_id: "node-b" },
  ],
  node_by_id: {
    "node-a": { source_node_id: "node-a" },
    "node-b": { source_node_id: "node-b" },
    "node-c": { source_node_id: "node-c" },
  },
};
const cluster = (id, memberNodeIds, changed = {}) => ({
  id,
  label: `Cluster ${id}`,
  purpose: `Purpose ${id}`,
  icon_token: `cluster.${id}`,
  member_node_ids: memberNodeIds,
  source_refs: [`views/clusters.json#/${id}`],
  ...changed,
});
const pack = (changed = {}) => ({
  schema_version: OEW_VIEW_PACK_SCHEMA,
  view_pack_id: "body-war.business",
  graph_digest: graphDigest,
  role: "business",
  label: "Body War business",
  purpose: "Navigate declared business responsibilities.",
  allowed_readings: ["Clusters are source-owned navigation groupings."],
  forbidden_readings: ["Layout proximity defines ontology membership."],
  membership_policy: "exactly-one-cluster-per-admitted-node",
  unassigned_policy: "reject",
  clusters: [
    cluster("cluster-b", ["node-c"]),
    cluster("cluster-a", ["node-b", "node-a"]),
  ],
  default_cluster_id: "cluster-a",
  sequences: [{ id: "tour", node_ids: ["node-a", "node-c"] }],
  source_refs: ["views/body-war-business.json"],
  authority_effect: "none",
  ...changed,
});
const withDigest = async (value) => ({
  ...value,
  view_pack_digest: await computeViewPackDigest(value),
});
const expectIssue = async (value, issue) => {
  await assert.rejects(
    () => compileViewPack(sourceGraph, value),
    (error) =>
      error instanceof ViewPackError &&
      error.code === "OEW_VIEW_PACK_REJECTED" &&
      error.issues.includes(issue),
  );
};

test("compiles an immutable exact reverse-membership index and receipt", async () => {
  const input = await withDigest(pack());
  const result = await compileViewPack(sourceGraph, input);

  assert.deepEqual(
    result.clusters.map(({ id }) => id),
    ["cluster-a", "cluster-b"],
  );
  assert.deepEqual(Object.keys(result.cluster_by_id), ["cluster-a", "cluster-b"]);
  assert.deepEqual({ ...result.cluster_id_by_node_id }, {
    "node-a": "cluster-a",
    "node-b": "cluster-a",
    "node-c": "cluster-b",
  });
  assert.deepEqual(result.sequence_by_id.tour.node_ids, ["node-a", "node-c"]);
  assert.deepEqual(result.receipt, {
    schema_version: "oew.view-pack-receipt.v1",
    result: "pass",
    view_pack_id: "body-war.business",
    view_pack_digest: input.view_pack_digest,
    graph_digest: graphDigest,
    membership_policy: "exactly-one-cluster-per-admitted-node",
    admitted_node_count: 3,
    assigned_node_count: 3,
    cluster_count: 2,
    sequence_count: 1,
    default_cluster_id: "cluster-a",
    authority_effect: "none",
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.cluster_id_by_node_id), true);
  assert.equal(Object.isFrozen(result.clusters[0].member_node_ids), true);
});

test("replays byte-equal output from the same canonical View Pack", async () => {
  const input = await withDigest(pack());
  const replay = JSON.parse(JSON.stringify(input));
  assert.equal(await computeViewPackDigest(input), await computeViewPackDigest(replay));
  assert.equal(
    JSON.stringify(await compileViewPack(sourceGraph, input)),
    JSON.stringify(await compileViewPack(sourceGraph, replay)),
  );
});

test("rejects unknown cluster membership with a stable diagnostic", async () => {
  const input = pack({
    clusters: [
      cluster("cluster-a", ["node-a", "node-b"]),
      cluster("cluster-b", ["node-c", "node-missing"]),
    ],
  });
  await expectIssue(
    await withDigest(input),
    "CLUSTER_MEMBER_UNKNOWN:cluster-b:node-missing",
  );
});

test("rejects repeated cluster membership with a stable diagnostic", async () => {
  const input = pack({
    clusters: [
      cluster("cluster-a", ["node-a", "node-a", "node-b"]),
      cluster("cluster-b", ["node-c"]),
    ],
  });
  await expectIssue(
    await withDigest(input),
    "CLUSTER_MEMBER_REPEATED:cluster-a:node-a",
  );
});

test("rejects overlapping cluster membership with a stable diagnostic", async () => {
  const input = pack({
    clusters: [
      cluster("cluster-a", ["node-a", "node-b"]),
      cluster("cluster-b", ["node-a", "node-c"]),
    ],
  });
  await expectIssue(
    await withDigest(input),
    "CLUSTER_MEMBERSHIP_OVERLAP:node-a:cluster-a:cluster-b",
  );
});

test("rejects unassigned cluster membership with a stable diagnostic", async () => {
  const input = pack({
    clusters: [cluster("cluster-a", ["node-a", "node-b"])],
    default_cluster_id: "cluster-a",
  });
  await expectIssue(
    await withDigest(input),
    "CLUSTER_MEMBERSHIP_UNASSIGNED:node-c",
  );
});

test("rejects duplicate and missing default cluster identities", async () => {
  const duplicate = pack({
    clusters: [
      cluster("cluster-a", ["node-a", "node-b"]),
      cluster("cluster-a", ["node-c"]),
    ],
  });
  await expectIssue(await withDigest(duplicate), "CLUSTER_ID_DUPLICATE:cluster-a");

  const missingDefault = pack({ default_cluster_id: "cluster-missing" });
  await expectIssue(
    await withDigest(missingDefault),
    "DEFAULT_CLUSTER_UNKNOWN:cluster-missing",
  );
});

test("rejects stale graph, View Pack, and sequence references", async () => {
  const staleGraph = await withDigest(pack({ graph_digest: "b".repeat(64) }));
  await expectIssue(staleGraph, "VIEW_PACK_GRAPH_DIGEST_MISMATCH");

  const stalePack = { ...(await withDigest(pack())), view_pack_digest: "0".repeat(64) };
  await expectIssue(stalePack, "VIEW_PACK_DIGEST_MISMATCH");

  const badSequence = pack({
    sequences: [{ id: "tour", node_ids: ["node-a", "node-missing"] }],
  });
  await expectIssue(
    await withDigest(badSequence),
    "SEQUENCE_NODE_UNKNOWN:tour:node-missing",
  );
});

test("remains independent of layout coordinates, graph topology, and renderers", async () => {
  const input = await withDigest(pack());
  const result = await compileViewPack(sourceGraph, input);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /\b(x|y|position|coordinate|topology)\b/iu);
  assert.equal(Object.hasOwn(result, "cluster_id_by_node_id"), true);
});
