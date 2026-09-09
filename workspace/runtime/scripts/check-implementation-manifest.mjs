import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const RUNTIME_ROOT = resolve(dirname(SCRIPT_PATH), "..");
const REPOSITORY_ROOT = resolve(RUNTIME_ROOT, "../../..");
const MANIFEST_PATH = resolve(
  RUNTIME_ROOT,
  "IMPLEMENTATION-MANIFEST.candidate.json",
);

const EXPECTED_SOURCES = Object.freeze({
  preservedExploreSnapshot: Object.freeze({
    root: "runtime",
    path: "src/domain/workspace.generated.ts",
  }),
  nodes: Object.freeze({
    root: "repository",
    path: "cyberAlchemy-v2/workspace/nodes.json",
  }),
  relations: Object.freeze({
    root: "repository",
    path: "cyberAlchemy-v2/workspace/relations.json",
  }),
});

const REQUIRED_BLOCKER = "WORKSPACE_CATALOG_SNAPSHOT_DRIFT";
const GRAPH_EPOCH_ALGORITHM =
  "sha256(nodes-bytes || 0x00 || relations-bytes)";
const CHAT_SOURCE_COUNT = 40;
const REQUIRED_CHAT_SOURCES = new Set([
  "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/interfaces/codex-app-server-wrapper.contract.json",
  "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/client/desktop-bridge.mjs",
  "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/evidence/codex-app-server-protocol-observation.windows-0.151.json",
  "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/src/profile-loader.mjs",
  "cyberAlchemy-v2/essays/development/agent-runtime/implementation/desktop/src-tauri/src/main.rs",
  "cyberAlchemy-v2/workspace/runtime/src/features/chat/ChatSurface.tsx",
  "cyberAlchemy-v2/workspace/runtime/src/features/chat/are-chat-bridge.ts",
  "cyberAlchemy-v2/workspace/runtime/performance-budgets.candidate.json",
]);

export class ImplementationManifestCheckError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ImplementationManifestCheckError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new ImplementationManifestCheckError(code, message);
}

function assertRecord(value, label) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail("MANIFEST_SHAPE_INVALID", `${label} must be an object`);
  }
  return value;
}

function rootFor(label) {
  if (label === "runtime") {
    return RUNTIME_ROOT;
  }
  if (label === "repository") {
    return REPOSITORY_ROOT;
  }
  fail("SOURCE_ROOT_INVALID", `unsupported source root: ${String(label)}`);
}

function safelyResolve(root, path) {
  if (typeof path !== "string" || path.length === 0 || isAbsolute(path)) {
    fail("SOURCE_PATH_INVALID", "source path must be a non-empty relative path");
  }

  const resolved = resolve(root, path);
  const withinRoot = relative(root, resolved);
  if (
    withinRoot === ".." ||
    withinRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) ||
    isAbsolute(withinRoot)
  ) {
    fail("SOURCE_PATH_ESCAPE", `source path escapes its declared root: ${path}`);
  }
  return resolved;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function bindSource(sourceValue, expected, label) {
  const source = assertRecord(sourceValue, label);
  if (source.root !== expected.root || source.path !== expected.path) {
    fail(
      "SOURCE_BINDING_INVALID",
      `${label} must bind ${expected.root}:${expected.path}`,
    );
  }
  if (!/^[a-f0-9]{64}$/.test(source.sha256)) {
    fail("SOURCE_DIGEST_INVALID", `${label} sha256 must be lowercase hex`);
  }

  const path = safelyResolve(rootFor(source.root), source.path);
  const bytes = readFileSync(path);
  const actualSha256 = sha256(bytes);
  if (actualSha256 !== source.sha256) {
    fail(
      "SOURCE_DIGEST_DRIFT",
      `${label} expected ${source.sha256} but found ${actualSha256}`,
    );
  }
  return { bytes, sha256: actualSha256 };
}

function embeddedIdentity(snapshotBytes) {
  const source = snapshotBytes.toString("utf8");
  const snapshotId = source.match(/"snapshotId": "([a-f0-9]{64})"/)?.[1];
  const sourceEpoch = source.match(/"sourceEpoch": "([a-f0-9]{64})"/)?.[1];
  if (snapshotId === undefined || sourceEpoch === undefined) {
    fail(
      "PRESERVED_SNAPSHOT_IDENTITY_MISSING",
      "generated snapshot lacks a bound snapshotId or sourceEpoch",
    );
  }
  return { snapshotId, sourceEpoch };
}

function graphEpoch(nodesBytes, relationsBytes) {
  return createHash("sha256")
    .update(nodesBytes)
    .update(Buffer.from([0]))
    .update(relationsBytes)
    .digest("hex");
}

function loadManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch (error) {
    fail(
      "MANIFEST_READ_FAILED",
      error instanceof Error ? error.message : String(error),
    );
  }
}

export function checkImplementationManifest(options = {}) {
  const manifest = assertRecord(
    options.manifest ?? loadManifest(),
    "implementation manifest",
  );
  if (
    manifest.schema_version !== "cav2-workspace-implementation-binding/v1" ||
    manifest.status !== "candidate" ||
    manifest.authority_effect !== "none" ||
    manifest.canonical_generation_claim !== false ||
    typeof manifest.claim_ceiling !== "string" ||
    !manifest.claim_ceiling.includes("candidate binding")
  ) {
    fail(
      "CLAIM_CEILING_INVALID",
      "manifest must remain candidate-only with authority_effect none and no canonical generation claim",
    );
  }

  const bindings = assertRecord(manifest.bindings, "bindings");
  const snapshot = assertRecord(
    bindings.preserved_explore_snapshot,
    "preserved Explore snapshot binding",
  );
  const graph = assertRecord(
    bindings.ontology_canvas_graph,
    "ontology canvas graph binding",
  );
  const chat = assertRecord(
    bindings.are_governed_chat,
    "ARE governed chat binding",
  );
  if (
    snapshot.identity_kind !== "preserved-generated-snapshot" ||
    snapshot.generation_posture !== "preserved-not-regenerated" ||
    graph.identity_kind !== "exact-current-graph-epoch" ||
    graph.graph_epoch_algorithm !== GRAPH_EPOCH_ALGORITHM
  ) {
    fail(
      "IDENTITY_POSTURE_INVALID",
      "snapshot and graph identity postures must remain explicit and separate",
    );
  }
  if (
    chat.identity_kind !== "exact-source-closure" ||
    chat.boundary_kind !== "codex-app-server-wrapper" ||
    chat.boundary_status !== "owner-selected-candidate-not-conformant" ||
    chat.transport !== "tauri-channel-to-are-jsonl-stdio" ||
    chat.webview_process_authority !== "none"
  ) {
    fail(
      "CHAT_BOUNDARY_INVALID",
      "chat must retain the candidate ARE wrapper boundary and deny process authority to the WebView",
    );
  }
  if (
    !Array.isArray(chat.source_closure) ||
    chat.source_closure.length !== CHAT_SOURCE_COUNT
  ) {
    fail(
      "CHAT_SOURCE_CLOSURE_INVALID",
      `chat source closure must contain exactly ${CHAT_SOURCE_COUNT} sources`,
    );
  }

  const separation = assertRecord(
    manifest.identity_separation,
    "identity separation",
  );
  if (separation.preserved_snapshot_is_current_graph_epoch !== false) {
    fail(
      "IDENTITY_COLLAPSE",
      "preserved Explore snapshot cannot claim the current graph epoch",
    );
  }

  if (!Array.isArray(manifest.canonical_build_blockers)) {
    fail("BUILD_BLOCKER_MISSING", `${REQUIRED_BLOCKER} must remain recorded`);
  }
  const blocker = manifest.canonical_build_blockers.find(
    (candidate) => candidate?.code === REQUIRED_BLOCKER,
  );
  if (
    blocker?.status !== "retained-open" ||
    blocker?.blocks !== "canonical-workspace-build"
  ) {
    fail("BUILD_BLOCKER_MISSING", `${REQUIRED_BLOCKER} must remain open`);
  }

  const snapshotSource = bindSource(
    snapshot.source,
    EXPECTED_SOURCES.preservedExploreSnapshot,
    "preserved Explore snapshot",
  );
  const nodesSource = bindSource(
    graph.nodes,
    EXPECTED_SOURCES.nodes,
    "ontology nodes",
  );
  const relationsSource = bindSource(
    graph.relations,
    EXPECTED_SOURCES.relations,
    "ontology relations",
  );
  const chatPaths = new Set();
  const chatClosureHash = createHash("sha256");
  let chatInterfaceSha256 = null;
  for (const [index, sourceValue] of chat.source_closure.entries()) {
    const source = assertRecord(sourceValue, `chat source ${index}`);
    if (source.root !== "repository" || typeof source.path !== "string") {
      fail(
        "CHAT_SOURCE_CLOSURE_INVALID",
        `chat source ${index} must be repository-relative`,
      );
    }
    if (chatPaths.has(source.path)) {
      fail(
        "CHAT_SOURCE_CLOSURE_INVALID",
        `chat source closure repeats ${source.path}`,
      );
    }
    chatPaths.add(source.path);
    const bound = bindSource(
      source,
      { root: "repository", path: source.path },
      `chat source ${index}`,
    );
    chatClosureHash
      .update(source.path)
      .update(Buffer.from([0]))
      .update(bound.bytes)
      .update(Buffer.from([0]));
    if (
      source.path ===
      "cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/interfaces/codex-app-server-wrapper.contract.json"
    ) {
      chatInterfaceSha256 = bound.sha256;
    }
  }
  for (const requiredPath of REQUIRED_CHAT_SOURCES) {
    if (!chatPaths.has(requiredPath)) {
      fail(
        "CHAT_SOURCE_CLOSURE_INVALID",
        `chat source closure omits required source ${requiredPath}`,
      );
    }
  }

  const identity = embeddedIdentity(snapshotSource.bytes);
  if (
    identity.snapshotId !== snapshot.embedded_snapshot_id ||
    identity.sourceEpoch !== snapshot.embedded_source_epoch
  ) {
    fail(
      "PRESERVED_SNAPSHOT_IDENTITY_DRIFT",
      "manifest does not match the generated snapshot's embedded identity",
    );
  }

  const actualGraphEpoch = graphEpoch(
    nodesSource.bytes,
    relationsSource.bytes,
  );
  if (actualGraphEpoch !== graph.graph_epoch_sha256) {
    fail(
      "GRAPH_EPOCH_DRIFT",
      `graph epoch expected ${graph.graph_epoch_sha256} but found ${actualGraphEpoch}`,
    );
  }
  if (
    snapshot.embedded_snapshot_id === graph.graph_epoch_sha256 ||
    snapshot.embedded_source_epoch === graph.graph_epoch_sha256
  ) {
    fail(
      "IDENTITY_COLLAPSE",
      "preserved snapshot identity must differ from the current graph epoch",
    );
  }

  return {
    status: "PASS",
    check: "workspace-implementation-manifest-exact-binding",
    manifest_id: manifest.manifest_id,
    authority_effect: "none",
    canonical_generation_claim: false,
    bindings: {
      preserved_explore_snapshot: {
        sha256: snapshotSource.sha256,
        snapshot_id: identity.snapshotId,
        source_epoch: identity.sourceEpoch,
      },
      ontology_canvas_graph: {
        graph_epoch_sha256: actualGraphEpoch,
        nodes_sha256: nodesSource.sha256,
        relations_sha256: relationsSource.sha256,
      },
      are_governed_chat: {
        source_count: chat.source_closure.length,
        closure_sha256: chatClosureHash.digest("hex"),
        interface_sha256: chatInterfaceSha256,
        transport: chat.transport,
      },
    },
    retained_blockers: [REQUIRED_BLOCKER],
    claim_ceiling: manifest.claim_ceiling,
  };
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  try {
    process.stdout.write(`${JSON.stringify(checkImplementationManifest())}\n`);
  } catch (error) {
    const failure = {
      status: "FAIL",
      code:
        error instanceof ImplementationManifestCheckError
          ? error.code
          : "UNEXPECTED_CHECK_FAILURE",
      message: error instanceof Error ? error.message : String(error),
    };
    process.stderr.write(`${JSON.stringify(failure)}\n`);
    process.exitCode = 1;
  }
}
