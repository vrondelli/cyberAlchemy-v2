#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const attemptRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(attemptRoot, "../../../../../../../..");
const stageRoot = join(attemptRoot, "materialization/staging");
const materializationRoot = join(attemptRoot, "materialization");
const taskPath =
  "cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/planning/work-pack/tasks/TASK-OEWTP-01-TYPED-ADMISSION.md";
const workPackPath =
  "cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/planning/WORK-PACK.md";
const contextPath = relative(repositoryRoot, join(attemptRoot, "context-pack.json"));
const browserFailureDependency =
  "cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/browser-acceptance.test.mjs";
const typeTargets = [
  "cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/types.ts",
  "cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/loadOewBundle.ts",
  "cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/store.ts",
];
const overlayManifestTarget =
  "cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/overlay-manifest.json";
const firstWorkingTarget =
  "cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/first-working-version-manifest.json";
const materialWrites = [...typeTargets, overlayManifestTarget, firstWorkingTarget];
const executionOutputs = [
  "cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWTP-001/20260729T190254Z/typed-admission.json",
  "cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/planning/work-pack/session-evidence/SWU-OEWTP-001/20260729T190254Z/receipt.json",
];
const validationCommands = [
  "node --test test/ui-store.test.mjs test/trust-rail.test.mjs test/evidence-inspector.test.mjs test/view-parity.test.mjs test/navigation.test.mjs test/poker-tour.test.mjs test/responsive.test.mjs",
  "node <browser-default-page-origin-probe>",
  "pnpm --dir <fresh-root> --filter @understand-anything/dashboard exec vitest run <six-explicit-oew-tests>",
  "pnpm --dir <fresh-root> --filter @understand-anything/dashboard exec tsc -b --pretty false",
];
const sha256 = (content) =>
  createHash("sha256").update(content).digest("hex");

async function artifact(root, logicalPath, extra = {}) {
  const content = await readFile(resolve(root, logicalPath));
  const info = await stat(resolve(root, logicalPath));
  return {
    path: logicalPath,
    sha256: sha256(content),
    size_bytes: info.size,
    ...extra,
  };
}

async function assertNoSymlink(root, logicalPath) {
  const rel = relative(resolve(root), resolve(root, logicalPath));
  if (!rel || rel.startsWith("..")) throw new Error(`path escape: ${logicalPath}`);
  let cursor = resolve(root);
  for (const part of rel.split("/").slice(0, -1)) {
    cursor = join(cursor, part);
    try {
      if ((await lstat(cursor)).isSymbolicLink()) {
        throw new Error(`symlink ancestor: ${logicalPath}`);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

async function mirror(logicalPath) {
  await assertNoSymlink(stageRoot, logicalPath);
  const destination = resolve(stageRoot, logicalPath);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(resolve(repositoryRoot, logicalPath), destination);
}

for (const target of typeTargets) {
  await assertNoSymlink(stageRoot, target);
  await stat(resolve(stageRoot, target));
}
const overlayManifest = JSON.parse(
  await readFile(resolve(repositoryRoot, overlayManifestTarget), "utf8"),
);
const overlayRows = new Map(overlayManifest.files.map((row) => [row.path, row]));
for (const target of typeTargets) {
  const relativeOverlayPath = target.split("/upstream/overlay/")[1];
  const row = overlayRows.get(relativeOverlayPath);
  if (!row) throw new Error(`overlay row missing: ${relativeOverlayPath}`);
  const bound = await artifact(stageRoot, target);
  row.sha256 = bound.sha256;
  row.size_bytes = bound.size_bytes;
}
await mkdir(dirname(resolve(stageRoot, overlayManifestTarget)), { recursive: true });
await writeFile(
  resolve(stageRoot, overlayManifestTarget),
  `${JSON.stringify(overlayManifest, null, 2)}\n`,
);
const firstWorking = JSON.parse(
  await readFile(resolve(repositoryRoot, firstWorkingTarget), "utf8"),
);
const stagedOverlay = await artifact(stageRoot, overlayManifestTarget);
firstWorking.overlay_manifest.sha256 = stagedOverlay.sha256;
firstWorking.overlay_manifest.size_bytes = stagedOverlay.size_bytes;
await mkdir(dirname(resolve(stageRoot, firstWorkingTarget)), { recursive: true });
await writeFile(
  resolve(stageRoot, firstWorkingTarget),
  `${JSON.stringify(firstWorking, null, 2)}\n`,
);

const controls = [
  { path: taskPath, role: "task-contract" },
  { path: workPackPath, role: "work-pack" },
  { path: contextPath, role: "context-pack" },
];
const dependencies = [
  {
    dependency_id: "browser-acceptance-failure-reproducer",
    path: browserFailureDependency,
  },
];
for (const item of [...controls, ...dependencies]) await mirror(item.path);
const sourceArtifacts = [];
for (const control of controls) {
  sourceArtifacts.push(
    await artifact(stageRoot, control.path, { authority_class: "private" }),
  );
}
const dependencyEntries = [];
for (const dependency of dependencies) {
  dependencyEntries.push({
    dependency_id: dependency.dependency_id,
    artifact_ref: await artifact(stageRoot, dependency.path),
  });
}
const changes = [];
const inventory = [];
for (const target of materialWrites) {
  changes.push({
    target_path: target,
    operation: "update",
    output_ref: await artifact(stageRoot, target),
  });
  inventory.push({
    target_path: target,
    lifecycle_owner: "task-session",
    authority_class: "private",
    publication_class: "internal",
    dependency_ids: dependencies.map((item) => item.dependency_id),
  });
}
const materialPackage = {
  schema_version: "1.0.0",
  package_id: "oewtp-swu-001-repair-20260729T190254Z",
  mutation_mode: "apply-approved",
  mutation_state: "materialized",
  lifecycle_owner: "task-session",
  authority_class: "private",
  publication_class: "internal",
  source_artifacts: sourceArtifacts,
  changes,
  target_inventory: inventory,
  dependencies: dependencyEntries,
  mirror_groups: [],
  approval: {
    class: "explicit-apply",
    owner: "task-session",
    scope_paths: materialWrites,
    authority_classes: ["private"],
    publication_classes: ["internal"],
  },
  validation_commands: validationCommands,
};
const packagePath = join(materializationRoot, "material-package.json");
await writeFile(packagePath, `${JSON.stringify(materialPackage, null, 2)}\n`);
const materialReceiptPath = join(materializationRoot, "material-receipt.json");
const exactRequestRef = async (path) => {
  const value = await artifact(repositoryRoot, relative(repositoryRoot, path));
  return { path: value.path, sha256: value.sha256, sizeBytes: value.size_bytes };
};
const admissionRequest = {
  schemaVersion: "1.1.0",
  executionMode: "routed-mutation",
  taskId: "TASK-OEWTP-01-TYPED-ADMISSION",
  swuId: "SWU-OEWTP-001",
  controlArtifacts: sourceArtifacts.map((item, index) => ({
    path: item.path,
    sha256: item.sha256,
    sizeBytes: item.size_bytes,
    role: controls[index].role,
    authorityClass: item.authority_class,
  })),
  dependencyFrontier: dependencyEntries.map((item) => ({
    dependencyId: item.dependency_id,
    artifactRef: {
      path: item.artifact_ref.path,
      sha256: item.artifact_ref.sha256,
      sizeBytes: item.artifact_ref.size_bytes,
    },
  })),
  materialPackage: await exactRequestRef(packagePath),
  materialReceipt: {
    path: relative(repositoryRoot, materialReceiptPath),
    sha256: "0".repeat(64),
    sizeBytes: 0,
  },
  producerReceiptSchema: await exactRequestRef(
    resolve(repositoryRoot, ".agents/skills/invoke/schemas/material-package-receipt.schema.json"),
  ),
  materialWrites,
  executionOutputs,
  allowedWrites: [...materialWrites, ...executionOutputs],
  validationCommands,
  lifecycleOwner: "task-session",
  authorityClass: "private",
  publicationClass: "internal",
};
await writeFile(
  join(materializationRoot, "admission-request.pending.json"),
  `${JSON.stringify(admissionRequest, null, 2)}\n`,
);
try {
  admissionRequest.materialReceipt = await exactRequestRef(materialReceiptPath);
  await writeFile(
    join(materializationRoot, "admission-request.json"),
    `${JSON.stringify(admissionRequest, null, 2)}\n`,
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
