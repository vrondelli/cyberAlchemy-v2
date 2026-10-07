#!/usr/bin/env node
import {createHash} from "node:crypto";
import {lstatSync, readFileSync, readdirSync, realpathSync} from "node:fs";
import {relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function stable(value) { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); }

export function freezeProductCandidate({repository_root = resolve(import.meta.dirname, "../../../../../..") } = {}) {
  const repositoryRoot = realpathSync(repository_root);
  const roots = [
    resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/coding-agent-runtime"),
  ];
  const excluded = new Set(["PRODUCT-CANDIDATE.json", "PRODUCT-TEST-RECEIPT.json"]);
  const files = {};
  function walk(directory) {
    for (const entry of readdirSync(directory, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === "node_modules" || excluded.has(entry.name)) continue;
      const path = resolve(directory, entry.name);
      const status = lstatSync(path);
      if (status.isSymbolicLink()) throw new Error(`SYMLINK_FORBIDDEN:${relative(repositoryRoot, path)}`);
      if (status.isDirectory()) walk(path);
      else if (status.isFile()) files[relative(repositoryRoot, path).replaceAll("\\", "/")] = sha256(readFileSync(path));
      else throw new Error(`UNSUPPORTED_FILE:${relative(repositoryRoot, path)}`);
    }
  }
  for (const root of roots) walk(root);
  const sourceSetDigest = sha256(stable(files));
  return Object.freeze({schema_version: "cav2.coding-agent-product-candidate/v2", status: "frozen-testable-candidate", frozen_at: "content-addressed-no-wall-clock-binding", source_set_digest: sourceSetDigest, source_file_count: Object.keys(files).length, files, product_approval: "not-requested", authority_effect: "none", claim_limit: "Exact runtime-only candidate; discontinued TUI and all UI conformance are outside this source set. No approval, adoption, publication, release, deployment, or external-effect authority."});
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.stdout.write(`${JSON.stringify(freezeProductCandidate(), null, 2)}\n`);
