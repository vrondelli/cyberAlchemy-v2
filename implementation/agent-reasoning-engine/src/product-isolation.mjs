import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {chmodSync, copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, statSync, symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";

import {materializeProductClosure, productRoot, repositoryRoot} from "./product.mjs";

function copyClosure(closure, destination) {
  for (const entry of closure.files) {
    const source = resolve(repositoryRoot, entry.path);
    const target = resolve(destination, entry.path);
    mkdirSync(dirname(target), {recursive: true});
    if (entry.kind === "symlink") symlinkSync(entry.link_target, target);
    else {
      copyFileSync(source, target);
      chmodSync(target, entry.mode);
    }
  }
}

export function runIsolatedProductTests(options = {}) {
  const closure = options.closure ?? materializeProductClosure();
  const directory = mkdtempSync(resolve(options.temporary_root ?? tmpdir(), "are-product-closure-"));
  copyClosure(closure, directory);
  const isolatedProductRoot = resolve(directory, productRoot.slice(repositoryRoot.length + 1));
  const command = resolve(isolatedProductRoot, "bin/are.mjs");
  const run = spawnSync(process.execPath, [command, "test"], {
    cwd: isolatedProductRoot,
    encoding: "utf8",
    timeout: options.timeout_ms ?? 900_000,
    maxBuffer: 64 * 1024 * 1024,
    env: {...process.env, ARE_PRODUCT_TEST_EXECUTION_MODE: "isolated-source-closure"},
  });
  if (run.status !== 0 || run.error || run.signal) {
    const error = new Error(`PRODUCT_ISOLATED_TESTS_FAILED:${run.status ?? run.signal ?? run.error?.code ?? "unknown"}:${directory}`);
    error.stdout = run.stdout ?? "";
    error.stderr = run.stderr ?? "";
    error.isolated_directory = directory;
    throw error;
  }
  let result;
  try { result = JSON.parse(run.stdout); }
  catch {
    const error = new Error(`PRODUCT_ISOLATED_TEST_OUTPUT_INVALID:${directory}`);
    error.stdout = run.stdout ?? "";
    error.stderr = run.stderr ?? "";
    error.isolated_directory = directory;
    throw error;
  }
  if (result.source_closure_digest !== closure.closure_digest || result.execution_mode !== "isolated-source-closure") {
    const error = new Error(`PRODUCT_ISOLATED_TEST_BINDING_MISMATCH:${directory}`);
    error.isolated_directory = directory;
    throw error;
  }
  if (options.keep !== true) rmSync(directory, {recursive: true, force: true});
  return Object.freeze({...result, isolated_directory_retained: options.keep === true ? directory : null});
}

export function verifyCopiedClosure(destination, closure = materializeProductClosure()) {
  for (const entry of closure.files) {
    const path = resolve(destination, entry.path);
    const metadata = lstatSync(path);
    if ((entry.kind === "symlink") !== metadata.isSymbolicLink()) return false;
    if (entry.kind === "symlink" && readlinkSync(path) !== entry.link_target) return false;
    const bytes = readFileSync(path);
    if (bytes.length !== entry.bytes) return false;
    if (createHash("sha256").update(bytes).digest("hex") !== entry.sha256) return false;
    if ((statSync(path).mode & 0o777) !== entry.mode) return false;
  }
  return true;
}
