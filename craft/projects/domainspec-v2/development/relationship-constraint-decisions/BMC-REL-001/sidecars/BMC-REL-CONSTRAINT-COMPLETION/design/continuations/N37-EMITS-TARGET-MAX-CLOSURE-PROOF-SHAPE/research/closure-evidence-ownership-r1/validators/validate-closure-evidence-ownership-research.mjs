#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..");
let root = here;
while (!existsSync(resolve(root, "AGENTS.md"))) {
  const parent = resolve(root, "..");
  if (parent === root) throw new Error("repository root not found");
  root = parent;
}
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const read = (path) => readFileSync(path);
const json = (path) => JSON.parse(read(path));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const scope = json(resolve(packageRoot, "RESEARCH-SCOPE.json"));
const context = json(resolve(packageRoot, "CONTEXT-PACK.json"));
const matrix = json(resolve(packageRoot, "OWNER-CONSUMER-MATRIX.json"));
const result = read(resolve(packageRoot, "RESEARCH-RESULT.md")).toString("utf8");
const distill = read(resolve(packageRoot, "DISTILL-VALIDATION.md")).toString("utf8");

assert(scope.source_count === 14, "scope must bind 14 sources");
assert(context.file_count === 14 && context.sources.length === 14, "context pack cardinality drift");
for (const source of context.sources) {
  const bytes = read(resolve(root, source.path));
  assert(sha256(bytes) === source.sha256, `source digest drift: ${source.path}`);
}
assert(matrix.layers.length === 5, "owner matrix must contain five layers");
assert(matrix.decision_gate_ready === false && matrix.n38_formed === false, "must remain before N38");
assert(matrix.authority_effect === "none", "authority effect must remain none");
assert(result.includes("blocked-no-admitted-closure-evidence-producer"), "blocked verdict missing");
assert(result.includes("release_admission: not-granted"), "candidate profile ceiling missing");
assert(result.includes("multiplicity === one_to_one"), "compiler limitation missing");
assert(result.includes("No user decision is justified yet"), "false owner gate");
assert(distill.includes("pass-smallest-coherent-negative-finding"), "Distill verdict missing");
assert(!result.includes("N38-A-") && !result.includes("N38-B-"), "N38 options invented");
console.log(JSON.stringify({result:"pass", sources:14, owner_layers:5, decision_gate_ready:false, n38_formed:false, authority_effect:"none"}, null, 2));
