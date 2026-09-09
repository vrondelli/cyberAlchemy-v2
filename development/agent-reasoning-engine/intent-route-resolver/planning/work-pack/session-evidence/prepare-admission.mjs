#!/usr/bin/env node

import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import {dirname, relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(scriptPath), "../../../../../../..");
const workPack = "cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/planning/WORK-PACK.md";
const evidenceRoot = "cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/planning/work-pack/session-evidence";
const receiptSchema = ".agents/skills/invoke/schemas/material-package-receipt.schema.json";
const materialSchemaDir = ".agents/skills/invoke/schemas";
const requestSchema = ".agents/skills/task-session/schemas/mutation-admission-request.schema.json";
const admissionReceiptSchema = ".agents/skills/task-session/schemas/mutation-admission-receipt.schema.json";

function fail(message) {
  throw new Error(message);
}

function parseArgs(values) {
  const result = {
    changes: [],
    validations: [],
    dependencies: [],
    executionOutputs: [],
  };
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    const value = values[index + 1];
    if (!key.startsWith("--") || value === undefined) fail(`missing value for ${key}`);
    index += 1;
    if (key === "--change") result.changes.push(value);
    else if (key === "--validation") result.validations.push(value);
    else if (key === "--dependency") result.dependencies.push(value);
    else if (key === "--execution-output") result.executionOutputs.push(value);
    else result[key.slice(2)] = value;
  }
  for (const required of ["task-id", "swu-id", "task-file", "run-id"]) {
    if (!result[required]) fail(`--${required} is required`);
  }
  if (result.changes.length === 0 || result.validations.length === 0) {
    fail("at least one --change and --validation are required");
  }
  return result;
}

function splitPair(raw) {
  const marker = raw.indexOf("=");
  if (marker < 1 || marker === raw.length - 1) fail(`expected KEY=VALUE, received ${raw}`);
  return [raw.slice(0, marker), raw.slice(marker + 1)];
}

function absolute(path) {
  const candidate = resolve(repositoryRoot, path);
  if (relative(repositoryRoot, candidate).startsWith("..")) fail(`path escapes repository: ${path}`);
  return candidate;
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function exact(path, snake = false) {
  const bytes = readFileSync(absolute(path));
  return {
    path,
    sha256: sha256Bytes(bytes),
    [snake ? "size_bytes" : "sizeBytes"]: bytes.length,
  };
}

function writeJson(path, value) {
  const target = absolute(path);
  mkdirSync(dirname(target), {recursive: true});
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const taskId = args["task-id"];
  const swuId = args["swu-id"];
  const taskFile = args["task-file"];
  const runId = args["run-id"];
  const evidenceDir = `${evidenceRoot}/${swuId}/${runId}`;
  const changes = args.changes.map(splitPair);
  const dependencies = args.dependencies.map(splitPair);
  const validationCommands = [...new Set(args.validations)].sort();
  const materialWrites = changes.map(([target]) => target).sort();
  const executionOutputs = [...new Set(args.executionOutputs)].sort();
  const allowedWrites = [...materialWrites, ...executionOutputs].sort();
  const owner = "agent-reasoning-engine-implementation-owner";

  const context = {
    schema_version: "task-session-context-pack.v1",
    task_id: taskId,
    swu_id: swuId,
    run_id: runId,
    strict_coverage: true,
    selected_sources: [workPack, taskFile],
    dependency_frontier: dependencies.map(([id]) => id),
    obligations: [
      {
        id: `${swuId}-behavior`,
        status: "covered",
        evidence: `${taskFile}#${swuId.toLowerCase()}`,
      },
      {
        id: `${swuId}-runtime-boundary`,
        status: "covered",
        evidence: "Direct user requirement: standalone runtime-neutral add-on with browser witness.",
      },
    ],
    execution_contract: {
      writeProfile: "material-bound",
      materialWrites,
      executionOutputs,
      allowedWrites,
      validationCommands,
      lifecycleOwner: owner,
      authorityClass: "private",
      publicationClass: "private",
    },
    blockers: [],
    claim_ceiling: "Private standalone L0 adapter evidence only; no consumer, product, approval, execution, publication, or promotion claim.",
  };
  const contextPath = `${evidenceDir}/context-pack.json`;
  writeJson(contextPath, context);
  const contextMarkdown = `# Runtime handoff context pack: ${swuId}

- Task: \`${taskId}\`
- Run: \`${runId}\`
- Strict coverage: pass
- Material writes: ${materialWrites.length}
- Dependencies: ${dependencies.length}
- Validation commands: ${validationCommands.length}
- Evidence role: session evidence, not canonical planning authority

The exact behavior, write scope, edge cases, and done criteria are controlled by
\`${taskFile}\`. The direct user requirement adds runtime-neutral packaging and
a browser conformance witness without granting consumer integration authority.

## Open Questions

See \`cyberAlchemy-v2/development/agent-reasoning-engine/intent-route-resolver/OPEN-QUESTIONS.md\`.
`;
  writeFileSync(absolute(`${evidenceDir}/CONTEXT-PACK.md`), contextMarkdown);

  const controls = [
    [taskFile, "task-contract"],
    [workPack, "work-pack"],
    [contextPath, "context-pack"],
  ];
  const sourceArtifacts = controls.map(([path]) => ({
    ...exact(path, true),
    authority_class: "private",
  }));
  const controlArtifacts = controls.map(([path, role]) => ({
    ...exact(path),
    role,
    authorityClass: "private",
  }));
  const packageDependencies = dependencies.map(([dependencyId, path]) => ({
    dependency_id: dependencyId,
    artifact_ref: exact(path, true),
  }));
  const requestDependencies = dependencies.map(([dependencyId, path]) => ({
    dependencyId,
    artifactRef: exact(path),
  }));

  const packageDocument = {
    schema_version: "1.0.0",
    package_id: `intent-route-resolver-${swuId.toLowerCase()}-${runId.toLowerCase()}`,
    mutation_mode: "apply-approved",
    mutation_state: "materialized",
    lifecycle_owner: owner,
    authority_class: "private",
    publication_class: "private",
    source_artifacts: sourceArtifacts,
    changes: changes.map(([target, staged]) => ({
      target_path: target,
      operation: statSync(absolute(target), {throwIfNoEntry: false}) ? "update" : "create",
      output_ref: exact(staged, true),
    })),
    target_inventory: materialWrites.map((target) => ({
      target_path: target,
      lifecycle_owner: owner,
      authority_class: "private",
      publication_class: "private",
      dependency_ids: dependencies.map(([id]) => id),
    })),
    dependencies: packageDependencies,
    mirror_groups: [],
    approval: {
      class: "explicit-apply",
      owner,
      scope_paths: materialWrites,
      authority_classes: ["private"],
      publication_classes: ["private"],
    },
    validation_commands: validationCommands,
  };
  const materialPackagePath = `${evidenceDir}/materialization/material-package.json`;
  const materialReceiptPath = `${evidenceDir}/materialization/material-receipt.json`;
  writeJson(materialPackagePath, packageDocument);
  execFileSync(
    "python3",
    [
      ".agents/skills/invoke/scripts/material_package_validator.py",
      materialPackagePath,
      "--root",
      ".",
      "--schema-dir",
      materialSchemaDir,
      "--output",
      materialReceiptPath,
    ],
    {cwd: repositoryRoot, stdio: "inherit"},
  );

  const request = {
    schemaVersion: "1.2.0",
    executionMode: "reusable-mutation",
    taskId,
    swuId,
    controlArtifacts,
    dependencyFrontier: requestDependencies,
    materialPackage: exact(materialPackagePath),
    materialReceipt: exact(materialReceiptPath),
    producerReceiptSchema: exact(receiptSchema),
    materialWrites,
    executionOutputs,
    allowedWrites,
    validationCommands,
    lifecycleOwner: owner,
    authorityClass: "private",
    publicationClass: "private",
  };
  const requestPath = `${evidenceDir}/mutation-admission-request.json`;
  const admissionPath = `${evidenceDir}/mutation-admission-receipt.json`;
  writeJson(requestPath, request);
  execFileSync(
    "python3",
    [
      ".agents/skills/task-session/scripts/verify-mutation-readiness.py",
      requestPath,
      "--repository-root",
      ".",
      "--request-schema",
      requestSchema,
      "--receipt-schema",
      admissionReceiptSchema,
      "--output",
      admissionPath,
    ],
    {cwd: repositoryRoot, stdio: "inherit"},
  );
  const admission = JSON.parse(readFileSync(absolute(admissionPath), "utf8"));
  process.stdout.write(`${JSON.stringify({
    swu_id: swuId,
    material: JSON.parse(readFileSync(absolute(materialReceiptPath), "utf8")).patchVerdict,
    admission: admission.admissionVerdict,
    mutation_ready: admission.mutationReady,
    reasons: admission.reasons,
  })}\n`);
}

main();
