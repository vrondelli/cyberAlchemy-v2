import {createHash} from "node:crypto";
import {chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, symlinkSync} from "node:fs";
import {dirname, isAbsolute, relative, resolve, sep} from "node:path";

import {materializeProductClosure, projectRoot, resolveProductSourcePath} from "./product.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const within = (root, candidate) => {
  const remainder = relative(root, candidate);
  return remainder === "" || (remainder !== ".." && !remainder.startsWith(`..${sep}`) && !isAbsolute(remainder));
};

export function materializeStandaloneDistribution(outputDirectory, options = {}) {
  if (typeof outputDirectory !== "string" || outputDirectory.length === 0) throw new TypeError("distribution.output-required");
  const outputRoot = resolve(outputDirectory);
  // repositoryRoot is the project's parent and can be "/" in a shallow container mount.
  // Reject overlap with the source project in either direction, not every path below its parent.
  if (within(projectRoot, outputRoot) || within(outputRoot, projectRoot)) {
    throw new Error("distribution.output-inside-source-repository");
  }
  if (existsSync(outputRoot) && readdirSync(outputRoot).length > 0) throw new Error("distribution.output-not-empty");
  mkdirSync(outputRoot, {recursive: true});

  const closure = materializeProductClosure(options);
  for (const entry of closure.files) {
    const source = resolveProductSourcePath(entry.path);
    const target = resolve(outputRoot, entry.path);
    if (target === outputRoot || !within(outputRoot, target)) throw new Error(`distribution.path-invalid:${entry.path}`);
    mkdirSync(dirname(target), {recursive: true});
    if (entry.kind === "symlink") symlinkSync(entry.link_target, target);
    else {
      copyFileSync(source, target);
      chmodSync(target, entry.mode);
    }
  }

  for (const entry of closure.files) {
    const target = resolve(outputRoot, entry.path);
    if (entry.kind === "symlink") {
      if (!lstatSync(target).isSymbolicLink()) throw new Error(`distribution.symlink-invalid:${entry.path}`);
    } else if (sha256(readFileSync(target)) !== entry.sha256) {
      throw new Error(`distribution.digest-mismatch:${entry.path}`);
    }
  }
  return Object.freeze({
    schema_version: "are.standalone-distribution/v1",
    product_id: closure.product_id,
    product_version: closure.product_version,
    closure_digest: closure.closure_digest,
    selection: closure.selection,
    mode: closure.mode,
    install_contracts: closure.install_contracts,
    file_count: closure.files.length,
    output_root: outputRoot,
    forbidden_dependencies: [],
    authority_effect: "none",
  });
}
