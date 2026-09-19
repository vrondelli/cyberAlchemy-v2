import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const implementationRoot = resolve(scriptDir, "..");
const repositoryRoot = resolve(implementationRoot, "../../..");
const operationSource = resolve(implementationRoot, "operation-source");
const standardRuntime = resolve(implementationRoot, "standard-runtime");
const commandBoundarySource = resolve(implementationRoot, "command-boundary-source");
const commandBoundaryRuntime = resolve(implementationRoot, "command-boundary-runtime");
const trustedInputSource = resolve(implementationRoot, "trusted-input-source");
const trustedInputRuntime = resolve(implementationRoot, "trusted-input-runtime");
const cli = resolve(repositoryRoot, "projects/domainspec-v2/impl/cli/src/cli/main.ts");
const node = process.env.DOMAINSPEC_NODE
  ?? "/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node";
const tsx = process.env.DOMAINSPEC_TSX
  ?? resolve(repositoryRoot, "projects/domainspec-v2/impl/cli/node_modules/tsx/dist/cli.mjs");
const validator = resolve(scriptDir, "validate.py");
const check = process.argv.includes("--check");

function files(root: string, base = root): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? files(path, base) : [relative(base, path)];
  }).sort();
}

function equalTrees(left: string, right: string): boolean {
  if (!existsSync(right)) return false;
  const leftFiles = files(left);
  const rightFiles = files(right)
    .filter((path) => !path.startsWith("target/") && path !== "Cargo.lock");
  return JSON.stringify(leftFiles) === JSON.stringify(rightFiles)
    && leftFiles.every((path) => readFileSync(join(left, path)).equals(readFileSync(join(right, path))));
}

const scratchParent = mkdtempSync(join(tmpdir(), "domainspec-auth-standard-build-"));
const generated = resolve(scratchParent, "runtime");
const generatedCommandBoundary = resolve(scratchParent, "command-boundary-runtime");
const generatedTrustedInput = resolve(scratchParent, "trusted-input-runtime");
try {
  const result = JSON.parse(execFileSync(node, [tsx,
    cli,
    "instantiate",
    operationSource,
    "--node",
    "auth-exact-permission:authorize",
    "--language",
    "rust",
    "--target-root",
    generated,
  ], { cwd: repositoryRoot, encoding: "utf8", env: { ...process.env, TMPDIR: "/tmp" } }));
  if (result.result !== "pass" || result.observation?.result !== "pass") {
    throw new Error("STANDARD_CLI_INSTANTIATION_FAILED");
  }

  const commandBoundaryResult = JSON.parse(execFileSync(node, [tsx,
    cli,
    "instantiate",
    commandBoundarySource,
    "--node",
    "auth-command-boundary:admit-authorization-command",
    "--language",
    "rust",
    "--target-root",
    generatedCommandBoundary,
  ], { cwd: repositoryRoot, encoding: "utf8", env: { ...process.env, TMPDIR: "/tmp" } }));
  if (commandBoundaryResult.result !== "pass" || commandBoundaryResult.observation?.result !== "pass") {
    throw new Error("COMMAND_BOUNDARY_CLI_INSTANTIATION_FAILED");
  }

  const trustedInputResult = JSON.parse(execFileSync(node, [tsx,
    cli,
    "instantiate",
    trustedInputSource,
    "--node",
    "trusted-input-resolution:resolve-trusted-inputs",
    "--language",
    "rust",
    "--target-root",
    generatedTrustedInput,
    "--integration-profile",
    "provider-neutral-v1",
    "--integration-binding-set",
    "trusted-input-sqlite",
  ], { cwd: repositoryRoot, encoding: "utf8", env: { ...process.env, TMPDIR: "/tmp" } }));
  if (trustedInputResult.result !== "pass" || trustedInputResult.observation?.result !== "pass") {
    throw new Error("TRUSTED_INPUT_CLI_INSTANTIATION_FAILED");
  }

  if (check) {
    if (!equalTrees(generated, standardRuntime)) throw new Error("STANDARD_RUNTIME_DRIFT");
    if (!equalTrees(generatedCommandBoundary, commandBoundaryRuntime)) {
      throw new Error("COMMAND_BOUNDARY_RUNTIME_DRIFT");
    }
    if (!equalTrees(generatedTrustedInput, trustedInputRuntime)) {
      throw new Error("TRUSTED_INPUT_RUNTIME_DRIFT");
    }
  } else {
    rmSync(standardRuntime, { recursive: true, force: true });
    cpSync(generated, standardRuntime, { recursive: true });
    rmSync(commandBoundaryRuntime, { recursive: true, force: true });
    cpSync(generatedCommandBoundary, commandBoundaryRuntime, { recursive: true });
    rmSync(trustedInputRuntime, { recursive: true, force: true });
    cpSync(generatedTrustedInput, trustedInputRuntime, { recursive: true });
  }

  execFileSync("python3", [validator, ...(check ? [] : ["--write-receipt"])], {
    cwd: repositoryRoot,
    stdio: "inherit",
  });
  process.stdout.write(`${check ? "checked" : "built"}=standard-typed-operation-command-boundary-and-trusted-input-query\n`);
} finally {
  rmSync(scratchParent, { recursive: true, force: true });
}
