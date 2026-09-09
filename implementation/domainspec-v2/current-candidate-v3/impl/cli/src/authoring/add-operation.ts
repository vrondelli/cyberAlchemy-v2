import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { decodeBody, loadProjectNode } from "../input/project-model.js";
import { resolveProjectRoot } from "../input/project-root.js";
import { sha256, type SourceManifestV1 } from "../input/source-manifest.js";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export interface AddOperationInput {
  readonly sourceRoot: string;
  readonly featureId: string;
  readonly nodeId: string;
  readonly description: string;
  readonly reads: readonly string[];
  readonly writes: readonly string[];
  readonly effects: readonly string[];
  readonly guard: string;
  readonly failureContinuation: string;
}

export interface AddOperationResult {
  readonly schema_version: "domainspec.add-operation-result/v1";
  readonly source_root: string;
  readonly selector: string;
  readonly node_path: string;
  readonly source_manifest: SourceManifestV1;
  readonly authority_effect: "none";
}

export class SourceAuthoringError extends Error {
  readonly exitCode = 22;

  constructor(readonly code: string, readonly pointer: string, message: string) {
    super(message);
    this.name = "SourceAuthoringError";
  }
}

function fail(code: string, pointer: string, message: string): never {
  throw new SourceAuthoringError(code, pointer, message);
}

function requireId(value: string, pointer: string): void {
  if (!ID_PATTERN.test(value)) fail("MTCLI_AUTHORING_ID", pointer, "expected a lowercase kebab-case identifier");
}

function requireText(value: string, pointer: string): void {
  if (value.trim().length === 0) fail("MTCLI_AUTHORING_TEXT", pointer, "expected nonempty text");
}

function requireSet(values: readonly string[], pointer: string): void {
  if (values.some((value) => value.trim().length === 0)) fail("MTCLI_AUTHORING_SET", pointer, "set entries must be nonempty");
  if (new Set(values).size !== values.length) fail("MTCLI_AUTHORING_SET", pointer, "set entries must be unique");
}

function canonicalDocument(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

interface AuthoringLock {
  readonly path: string;
  readonly descriptor: number;
  readonly device: number;
  readonly inode: number;
}

function acquireLock(root: string): AuthoringLock {
  const lockPath = path.join(path.dirname(root), `.${path.basename(root)}.domainspec-authoring.lock`);
  let descriptor: number;
  try {
    descriptor = fs.openSync(lockPath, "wx", 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      fail("MTCLI_AUTHORING_LOCKED", "/source-root", `another authoring transaction owns ${lockPath}`);
    }
    throw error;
  }
  try {
    fs.writeFileSync(descriptor, canonicalDocument({
      schema_version: "domainspec.authoring-lock/v1",
      operation: "add-operation",
      pid: process.pid,
    }));
    const stats = fs.fstatSync(descriptor);
    return { path: lockPath, descriptor, device: stats.dev, inode: stats.ino };
  } catch (error) {
    fs.closeSync(descriptor);
    fs.rmSync(lockPath, { force: true });
    throw error;
  }
}

function releaseLock(lock: AuthoringLock): void {
  try {
    const stats = fs.lstatSync(lock.path, { throwIfNoEntry: false });
    if (stats && stats.dev === lock.device && stats.ino === lock.inode) fs.rmSync(lock.path);
  } finally {
    fs.closeSync(lock.descriptor);
  }
}

function copyDeclaredSources(root: string, stageRoot: string, manifest: SourceManifestV1): void {
  for (const source of manifest.sources) {
    const sourcePath = path.join(root, source.relative_path);
    const targetPath = path.join(stageRoot, source.relative_path);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true, mode: 0o755 });
    fs.copyFileSync(sourcePath, targetPath, fs.constants.COPYFILE_EXCL);
  }
}

function readFeature(root: string, featureId: string): {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly bytes: Buffer;
  readonly value: {
    readonly schema_version: "domainspec.feature/v1";
    readonly feature_id: string;
    readonly nodes: readonly string[];
    readonly edges: readonly string[];
  };
} {
  const relativePath = `specs/${featureId}/feature.json`;
  const absolutePath = path.join(root, relativePath);
  const bytes = fs.readFileSync(absolutePath);
  const value = JSON.parse(bytes.toString("utf8")) as {
    readonly schema_version: "domainspec.feature/v1";
    readonly feature_id: string;
    readonly nodes: readonly string[];
    readonly edges: readonly string[];
  };
  return { relativePath, absolutePath, bytes, value };
}

function validateInput(input: AddOperationInput): void {
  requireId(input.featureId, "/feature");
  requireId(input.nodeId, "/name");
  requireText(input.description, "/description");
  requireText(input.guard, "/guard");
  requireText(input.failureContinuation, "/failure-continuation");
  requireSet(input.reads, "/reads");
  requireSet(input.writes, "/writes");
  requireSet(input.effects, "/effects");
  decodeBody("Operation", {
    description: input.description,
    reads: input.reads,
    writes: input.writes,
    effects: input.effects,
    guard: input.guard,
    failure_continuation: input.failureContinuation,
  });
}

export function addOperation(input: AddOperationInput): AddOperationResult {
  validateInput(input);
  const initialManifest = resolveProjectRoot(input.sourceRoot);
  const root = fs.realpathSync(input.sourceRoot);
  const featureExists = initialManifest.sources.some((source) => source.source_type === "feature" && source.source_id === input.featureId);
  if (!featureExists) fail("MTCLI_AUTHORING_FEATURE_MISSING", "/feature", `feature is absent:${input.featureId}`);

  const nodeRelativePath = `specs/${input.featureId}/nodes/${input.nodeId}.json`;
  const nodeAbsolutePath = path.join(root, nodeRelativePath);
  if (fs.existsSync(nodeAbsolutePath)) fail("MTCLI_AUTHORING_NODE_EXISTS", "/name", `node already exists:${input.featureId}:${input.nodeId}`);

  const lock = acquireLock(root);
  let stageRoot: string | null = null;
  let nodePublished = false;
  try {
    const lockedManifest = resolveProjectRoot(root);
    if (lockedManifest.manifest_sha256 !== initialManifest.manifest_sha256) {
      fail("MTCLI_AUTHORING_SOURCE_DRIFT", "/source-root", "source project changed before authoring lock acquisition");
    }
    if (fs.existsSync(nodeAbsolutePath)) fail("MTCLI_AUTHORING_NODE_EXISTS", "/name", `node already exists:${input.featureId}:${input.nodeId}`);

    const feature = readFeature(root, input.featureId);
    if (feature.value.nodes.includes(input.nodeId)) fail("MTCLI_AUTHORING_NODE_EXISTS", "/name", `feature already declares:${input.nodeId}`);

    const nodeDocument = canonicalDocument({
      schema_version: "domainspec.node/v1",
      node_id: input.nodeId,
      feature_id: input.featureId,
      kind: "Operation",
      body: {
        description: input.description.trim(),
        reads: [...input.reads],
        writes: [...input.writes],
        effects: [...input.effects],
        guard: input.guard.trim(),
        failure_continuation: input.failureContinuation.trim(),
      },
    });
    const featureDocument = canonicalDocument({
      schema_version: "domainspec.feature/v1",
      feature_id: input.featureId,
      nodes: [...feature.value.nodes, input.nodeId].sort(compareIds),
      edges: [...feature.value.edges],
    });

    stageRoot = fs.mkdtempSync(path.join(path.dirname(root), `.${path.basename(root)}.add-operation-`));
    copyDeclaredSources(root, stageRoot, lockedManifest);
    fs.mkdirSync(path.dirname(path.join(stageRoot, nodeRelativePath)), { recursive: true, mode: 0o755 });
    fs.writeFileSync(path.join(stageRoot, nodeRelativePath), nodeDocument, { encoding: "utf8", flag: "wx", mode: 0o644 });
    fs.writeFileSync(path.join(stageRoot, feature.relativePath), featureDocument, { encoding: "utf8", flag: "w", mode: 0o644 });

    const prospectiveManifest = resolveProjectRoot(stageRoot);
    const stagedNode = loadProjectNode(stageRoot, `${input.featureId}:${input.nodeId}`);
    if (stagedNode.kind !== "Operation" || stagedNode.meta_type_id !== "DS-D1.4") {
      fail("MTCLI_AUTHORING_META_TYPE", "/name", "authored node did not resolve to the canonical Operation meta-type");
    }

    const liveManifest = resolveProjectRoot(root);
    if (liveManifest.manifest_sha256 !== lockedManifest.manifest_sha256 || sha256(feature.bytes) !== sha256(fs.readFileSync(feature.absolutePath))) {
      fail("MTCLI_AUTHORING_SOURCE_DRIFT", "/source-root", "source project changed during authoring transaction");
    }
    if (fs.existsSync(nodeAbsolutePath)) fail("MTCLI_AUTHORING_NODE_EXISTS", "/name", `node appeared during authoring:${input.featureId}:${input.nodeId}`);

    fs.writeFileSync(nodeAbsolutePath, nodeDocument, { encoding: "utf8", flag: "wx", mode: 0o644 });
    nodePublished = true;

    const featureTemporaryPath = path.join(
      path.dirname(feature.absolutePath),
      `.${path.basename(feature.absolutePath)}.${crypto.randomUUID()}.tmp`,
    );
    try {
      fs.writeFileSync(featureTemporaryPath, featureDocument, { encoding: "utf8", flag: "wx", mode: 0o644 });
      fs.renameSync(featureTemporaryPath, feature.absolutePath);
    } catch (error) {
      fs.rmSync(featureTemporaryPath, { force: true });
      throw error;
    }

    nodePublished = false;
    return Object.freeze({
      schema_version: "domainspec.add-operation-result/v1",
      source_root: root,
      selector: `${input.featureId}:${input.nodeId}`,
      node_path: nodeRelativePath,
      source_manifest: prospectiveManifest,
      authority_effect: "none",
    });
  } catch (error) {
    if (nodePublished) fs.rmSync(nodeAbsolutePath, { force: true });
    throw error;
  } finally {
    if (stageRoot !== null) fs.rmSync(stageRoot, { recursive: true, force: true });
    releaseLock(lock);
  }
}
