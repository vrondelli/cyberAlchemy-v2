import {createHash} from "node:crypto";
import {chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, symlinkSync} from "node:fs";
import {dirname, resolve} from "node:path";

import {materializeProductClosure, repositoryRoot} from "./product.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function materializeStandaloneDistribution(outputDirectory) {
  if (typeof outputDirectory !== "string" || outputDirectory.length === 0) throw new TypeError("distribution.output-required");
  const outputRoot = resolve(outputDirectory);
  if (outputRoot === repositoryRoot || outputRoot.startsWith(`${repositoryRoot}/`)) throw new Error("distribution.output-inside-source-repository");
  if (existsSync(outputRoot) && readdirSync(outputRoot).length > 0) throw new Error("distribution.output-not-empty");
  mkdirSync(outputRoot, {recursive: true});

  const closure = materializeProductClosure();
  for (const entry of closure.files) {
    const source = resolve(repositoryRoot, entry.path);
    const target = resolve(outputRoot, entry.path);
    if (!target.startsWith(`${outputRoot}/`)) throw new Error(`distribution.path-invalid:${entry.path}`);
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
    file_count: closure.files.length,
    output_root: outputRoot,
    forbidden_dependencies: [],
    authority_effect: "none",
  });
}
