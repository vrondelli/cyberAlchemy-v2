import {createHash} from "node:crypto";
import {lstatSync, readFileSync, readdirSync, realpathSync} from "node:fs";
import {relative, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function walk(root, directory = root, output = {}) {
  for (const entry of readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(directory, entry.name);
    const name = relative(root, path).replaceAll("\\", "/");
    const status = lstatSync(path);
    if (status.isSymbolicLink()) throw new Error(`SYMLINK_FORBIDDEN:${name}`);
    if (status.isDirectory()) walk(root, path, output);
    else if (status.isFile()) output[name] = sha256(readFileSync(path));
    else throw new Error(`UNSUPPORTED_FILE_TYPE:${name}`);
  }
  return output;
}

export function snapshotTree(root) {
  const exactRoot = realpathSync(root);
  const files = walk(exactRoot);
  return Object.freeze({root: exactRoot, files: Object.freeze(files), tree_sha256: sha256(stable(files))});
}

function failure(reasonCodes, details = {}) {
  const material = {schema_version: "are.coding-agent-postimage-verification/v1", status: "BLOCK", reason_codes: [...new Set(reasonCodes)].sort(), ...details, authority_effect: "none"};
  return Object.freeze({...material, verification_digest: sha256(stable(material))});
}

export function verifyFixture(input) {
  try {
    const root = realpathSync(input.fixture_root);
    const before = input.before;
    const after = snapshotTree(root);
    const allPaths = [...new Set([...Object.keys(before.files), ...Object.keys(after.files)])].sort();
    const changedPaths = allPaths.filter((path) => before.files[path] !== after.files[path]);
    const allowlist = [...new Set(input.mutation_allowlist)].sort();
    const reasons = [];
    if (before.tree_sha256 !== input.expected_base_tree_sha256) reasons.push("verifier.base-tree-binding-invalid");
    if (changedPaths.length === 0) reasons.push("verifier.patch-empty");
    if (changedPaths.some((path) => !allowlist.includes(path))) reasons.push("verifier.write-outside-allowlist");
    if (changedPaths.some((path) => path.startsWith("test/") || path === "package.json")) reasons.push("verifier.protected-file-changed");
    if (reasons.length > 0) return failure(reasons, {before_tree_sha256: before.tree_sha256, after_tree_sha256: after.tree_sha256, changed_paths: changedPaths});

    const [executable, ...args] = input.verification_command;
    const run = spawnSync(executable, args, {
      cwd: root,
      encoding: "utf8",
      timeout: input.verification_timeout_ms ?? 30_000,
      env: {LANG: "C", LC_ALL: "C", PATH: resolve(executable, "..")},
    });
    if (run.error?.code === "ETIMEDOUT") return failure(["verifier.command-timeout"], {changed_paths: changedPaths, before_tree_sha256: before.tree_sha256, after_tree_sha256: after.tree_sha256});
    if (run.status !== input.expected_exit) return failure(["verifier.command-failed"], {changed_paths: changedPaths, before_tree_sha256: before.tree_sha256, after_tree_sha256: after.tree_sha256, observed_exit: run.status, stdout: run.stdout ?? "", stderr: run.stderr ?? ""});

    const material = {
      schema_version: "are.coding-agent-postimage-verification/v1",
      status: "PASS_BOUNDED",
      reason_codes: [],
      before_tree_sha256: before.tree_sha256,
      after_tree_sha256: after.tree_sha256,
      changed_paths: changedPaths,
      mutation_allowlist: allowlist,
      command: input.verification_command,
      observed_exit: run.status,
      stdout_sha256: sha256(run.stdout ?? ""),
      stderr_sha256: sha256(run.stderr ?? ""),
      authority_effect: "none"
    };
    return Object.freeze({...material, verification_digest: sha256(stable(material))});
  } catch (error) {
    return failure(["verifier.internal-failure"], {error: error.message});
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const input = JSON.parse(await readStdin());
  const result = verifyFixture(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.status === "PASS_BOUNDED" ? 0 : 1;
}
