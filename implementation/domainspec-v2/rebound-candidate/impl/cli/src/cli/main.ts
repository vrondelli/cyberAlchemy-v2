#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { addOperation, type AddOperationInput } from "../authoring/add-operation.js";
import { observeTarget, observeTargetReceipt } from "../conformance/observe-target.js";
import { readInstantiationReceipt } from "../conformance/receipt.js";
import { planInstantiation } from "../generation/plan-instantiation.js";
import { publishInstantiation } from "../generation/publish-instantiation.js";
import { loadProjectNode } from "../input/project-model.js";
import { resolveProjectRoot } from "../input/project-root.js";
import { normalizeLanguage } from "../meta-types/catalog.js";
import { loadSystemIntegrationSelection } from "../system-integration/compiler.js";

export interface CliIo {
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
}

class CliUsageError extends Error {
  readonly exitCode = 22;
  readonly code = "MTCLI_USAGE";
  readonly pointer = "/argv";
}

function usage(message: string): never {
  throw new CliUsageError(message);
}

function objectOutput(io: CliIo, value: unknown): void {
  io.stdout(`${JSON.stringify(value, null, 2)}\n`);
}

function exactlyOneRoot(args: readonly string[], command: string): string {
  if (args.length !== 1) usage(`${command} requires exactly one explicit root`);
  const root = args[0];
  if (!root || !path.isAbsolute(root)) usage(`${command} requires an absolute root`);
  return root;
}

function parseCsvSet(value: string | undefined, option: string): readonly string[] {
  if (value === undefined) return Object.freeze([]);
  const entries = value.split(",").map((entry) => entry.trim());
  if (entries.some((entry) => entry.length === 0)) usage(`${option} must be a comma-separated list without empty entries`);
  if (new Set(entries).size !== entries.length) usage(`${option} must not contain duplicate entries`);
  return Object.freeze(entries);
}

function addOperationArgs(args: readonly string[]): AddOperationInput {
  const sourceRoot = args[0];
  if (!sourceRoot || !path.isAbsolute(sourceRoot)) usage("add operation requires one absolute source project root");
  const values = new Map<string, string>();
  const allowedOptions = [
    "--feature",
    "--name",
    "--description",
    "--reads",
    "--writes",
    "--effects",
    "--guard",
    "--failure-continuation",
  ];
  for (let index = 1; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    if (!option || !allowedOptions.includes(option) || !value || value.startsWith("--")) {
      usage("add operation received an unsupported or unvalued option");
    }
    if (values.has(option)) usage(`duplicate option:${option}`);
    values.set(option, value);
  }
  for (const required of ["--feature", "--name", "--description", "--guard", "--failure-continuation"]) {
    if (!values.has(required)) usage(`add operation requires ${required}`);
  }
  return Object.freeze({
    sourceRoot,
    featureId: values.get("--feature")!,
    nodeId: values.get("--name")!,
    description: values.get("--description")!,
    reads: parseCsvSet(values.get("--reads"), "--reads"),
    writes: parseCsvSet(values.get("--writes"), "--writes"),
    effects: parseCsvSet(values.get("--effects"), "--effects"),
    guard: values.get("--guard")!,
    failureContinuation: values.get("--failure-continuation")!,
  });
}

interface InstantiateArgs {
  readonly sourceRoot: string;
  readonly node: string;
  readonly language: "typescript" | "python" | "rust";
  readonly targetRoot: string;
  readonly integrationProfile: string | null;
  readonly integrationBindingSet: string | null;
}

function instantiateArgs(args: readonly string[]): InstantiateArgs {
  const sourceRoot = args[0];
  if (!sourceRoot || !path.isAbsolute(sourceRoot)) usage("instantiate requires one absolute source project root");
  const values = new Map<string, string>();
  const allowedOptions = ["--node", "--language", "--target-root", "--integration-profile", "--integration-binding-set"];
  for (let index = 1; index < args.length; index += 2) {
    const option = args[index];
    const value = args[index + 1];
    if (!option || !allowedOptions.includes(option) || !value || value.startsWith("--")) usage("instantiate requires valued --node, --language, --target-root, and optional system-integration profile options");
    if (values.has(option)) usage(`duplicate option:${option}`);
    values.set(option, value);
  }
  for (const required of ["--node", "--language", "--target-root"]) if (!values.has(required)) usage("instantiate requires --node, --language, and --target-root");
  const integrationProfile = values.get("--integration-profile") ?? null;
  const integrationBindingSet = values.get("--integration-binding-set") ?? null;
  if ((integrationProfile === null) !== (integrationBindingSet === null)) usage("--integration-profile and --integration-binding-set must be supplied together");
  if (values.size !== (integrationProfile === null ? 3 : 5)) usage("instantiate received an unsupported option set");
  const targetRoot = values.get("--target-root")!;
  if (!path.isAbsolute(targetRoot)) usage("--target-root must be absolute");
  return Object.freeze({
    sourceRoot,
    node: values.get("--node")!,
    language: normalizeLanguage(values.get("--language")),
    targetRoot,
    integrationProfile,
    integrationBindingSet,
  });
}

function isInstantiationTarget(root: string): boolean {
  return fs.existsSync(path.join(root, ".domainspec", "instantiations"));
}

function errorEnvelope(error: unknown): Record<string, unknown> {
  const candidate = error as Partial<Error> & { code?: unknown; pointer?: unknown };
  return {
    result: "fail",
    code: typeof candidate.code === "string" ? candidate.code : "MTCLI_UNEXPECTED",
    pointer: typeof candidate.pointer === "string" ? candidate.pointer : "$",
    message: error instanceof Error ? error.message : "unexpected failure",
    authority_effect: "none",
  };
}

export function runCli(argv: readonly string[], io: CliIo = {
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value),
}): number {
  try {
    const [command, ...args] = argv;
    if (command === "add") {
      if (args[0] !== "operation") usage("add requires the supported meta-type: operation");
      const result = addOperation(addOperationArgs(args.slice(1)));
      objectOutput(io, {
        schema_version: "domainspec.add-operation-command-result/v1",
        result: "pass",
        source_root: result.source_root,
        selector: result.selector,
        node_path: result.node_path,
        source_manifest_sha256: result.source_manifest.manifest_sha256,
        source_count: result.source_manifest.source_count,
        authority_effect: result.authority_effect,
      });
      return 0;
    }
    if (command === "instantiate") {
      const parsed = instantiateArgs(args);
      const node = loadProjectNode(parsed.sourceRoot, parsed.node);
      const systemIntegration = parsed.integrationProfile === null || parsed.integrationBindingSet === null
        ? null
        : loadSystemIntegrationSelection(node.project_root, parsed.integrationBindingSet, parsed.integrationProfile, `${node.feature_id}:${node.node_id}`, parsed.language);
      const plan = planInstantiation(node, parsed.language, systemIntegration);
      const publication = publishInstantiation(plan, parsed.targetRoot);
      const observation = observeTarget(publication.target_root);
      objectOutput(io, {
        schema_version: "domainspec.instantiate-command-result/v1",
        result: "pass",
        target_root: publication.target_root,
        receipt_path: publication.receipt_path,
        plan_sha256: plan.plan_sha256,
        receipt_sha256: publication.receipt.receipt_sha256,
        system_integration_binding_digest: plan.system_integration?.manifest.binding_digest ?? null,
        observation,
        authority_effect: "none",
      });
      return 0;
    }
    if (command === "lint") {
      const root = exactlyOneRoot(args, "lint");
      if (isInstantiationTarget(root)) {
        const observation = observeTargetReceipt(root);
        objectOutput(io, observation);
        return observation.result === "pass" ? 0 : 1;
      }
      objectOutput(io, {
        schema_version: "domainspec.source-project-lint/v1",
        result: "pass",
        source_manifest: resolveProjectRoot(root),
        authority_effect: "none",
      });
      return 0;
    }
    if (command === "receipt") {
      const root = exactlyOneRoot(args, "receipt");
      if (isInstantiationTarget(root)) {
        const observation = observeTargetReceipt(root);
        if (observation.result === "fail") {
          objectOutput(io, { observation });
          return 1;
        }
        objectOutput(io, { receipt: readInstantiationReceipt(root), observation });
      } else {
        objectOutput(io, resolveProjectRoot(root));
      }
      return 0;
    }
    usage("expected command: add operation, instantiate, lint, or receipt");
  } catch (error) {
    objectOutput({ ...io, stdout: io.stderr }, errorEnvelope(error));
    const candidate = error as { exitCode?: unknown };
    return typeof candidate.exitCode === "number" ? candidate.exitCode : 1;
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runCli(process.argv.slice(2));
}
