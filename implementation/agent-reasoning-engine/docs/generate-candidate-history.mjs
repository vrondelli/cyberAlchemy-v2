#!/usr/bin/env node
import {createHash} from "node:crypto";
import {existsSync, readFileSync, readdirSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const productRoot = resolve(docsRoot, "..");
const evidenceRoot = resolve(productRoot, "evidence");
const outputPath = resolve(docsRoot, "releases/candidate-history.json");
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

function need(condition, code) {
  if (!condition) throw new Error(code);
}

function scope(path) {
  if (path.includes("/implementation/agent-reasoning-engine/packages/")) return "runtime-packages";
  if (path.includes("/implementation/agent-reasoning-engine/benchmarks/")) return "product-benchmarks";
  if (path.includes("/implementation/agent-reasoning-engine/")) return "product-integration";
  if (path.includes("/development/agent-reasoning-engine/")) return "development-integration";
  if (path.includes("/agent-reasoning-engine/")) return "product-definition";
  if (path.includes("/language/")) return "language-toolchain";
  if (path.includes("/agent-routing/")) return "agent-routing";
  if (path.includes("/authority/") || path.includes("/ontology/") || path.includes("/goals/")) return "repository-governance";
  return "other-declared-source";
}

export function generateCandidateHistory() {
  const names = readdirSync(evidenceRoot)
    .filter(name => /^product-candidate\.\d+\.json$/u.test(name))
    .sort((a, b) => Number(a.match(/\d+/u)[0]) - Number(b.match(/\d+/u)[0]));
  const records = names.map(name => {
    const path = resolve(evidenceRoot, name);
    const bytes = readFileSync(path);
    const record = JSON.parse(bytes);
    need(record.status === "frozen-testable-candidate", `candidate-history.not-frozen:${name}`);
    need(record.authority_effect === "none", `candidate-history.authority-effect:${name}`);
    return {name, bytes, record, files: new Map(record.source_closure.files.map(file => [file.path, file]))};
  });
  need(records.length > 0, "candidate-history.empty");

  const candidates = records.map((current, index) => {
    const prior = records[index - 1] ?? null;
    const added = [], removed = [], changed = [];
    if (prior) {
      for (const [path, file] of current.files) {
        if (!prior.files.has(path)) added.push(path);
        else if (prior.files.get(path).sha256 !== file.sha256 || prior.files.get(path).mode !== file.mode) changed.push(path);
      }
      for (const path of prior.files.keys()) if (!current.files.has(path)) removed.push(path);
    }
    const scopes = {};
    for (const [kind, paths] of Object.entries({added, changed, removed})) {
      for (const path of paths) {
        const id = scope(path);
        scopes[id] ??= {added: 0, changed: 0, removed: 0};
        scopes[id][kind] += 1;
      }
    }
    const record = current.record;
    return {
      candidate_id: record.candidate_id,
      product_version: record.product.version,
      evidence_path: `evidence/${current.name}`,
      evidence_sha256: sha256(current.bytes),
      candidate_digest: record.candidate_digest,
      source_closure_digest: record.source_closure.closure_digest,
      source_file_count: record.source_closure.files.length,
      predecessor_candidate_id: prior?.record.candidate_id ?? null,
      delta_from_predecessor: prior ? {
        added: added.length,
        changed: changed.length,
        removed: removed.length,
        unchanged: current.files.size - added.length - changed.length,
        scopes: Object.fromEntries(Object.entries(scopes).sort(([a], [b]) => a.localeCompare(b))),
      } : null,
    };
  });
  const numbers = candidates.map(item => Number(item.candidate_id.match(/\d+$/u)[0]));
  const missing_candidate_numbers = [];
  for (let number = Math.min(...numbers); number <= Math.max(...numbers); number++) if (!numbers.includes(number)) missing_candidate_numbers.push(number);
  return `${JSON.stringify({
    schema_version: "are.documentation-candidate-history/v1",
    lifecycle_status: "candidate-internal",
    selection_basis: "All immutable product-candidate.NNN.json records present in the evidence directory, ordered numerically.",
    candidates,
    missing_candidate_numbers,
    claim_limit: "Deltas compare frozen source-closure paths, modes, and digests. Scope labels summarize changed paths; they do not infer acceptance, compatibility, or user impact.",
    authority_effect: "none",
  }, null, 2)}\n`;
}

function main() {
  const [mode = "--check"] = process.argv.slice(2);
  need(["--check", "--write"].includes(mode), "usage:generate-candidate-history [--check|--write]");
  const generated = generateCandidateHistory();
  if (mode === "--write") writeFileSync(outputPath, generated);
  else {
    need(existsSync(outputPath), "candidate-history.output-missing");
    need(readFileSync(outputPath, "utf8") === generated, "candidate-history.output-drift");
  }
  process.stdout.write(`${JSON.stringify({status: mode === "--write" ? "WROTE" : "PASS", candidate_count: JSON.parse(generated).candidates.length, sha256: sha256(generated), authority_effect: "none"})}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
