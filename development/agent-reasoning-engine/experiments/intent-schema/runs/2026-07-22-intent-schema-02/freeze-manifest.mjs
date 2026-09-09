#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RUN_ID = "2026-07-22-intent-schema-02";
const FROZEN_AT = "2026-07-22T10:24:55-03:00";
const repoRoot = process.cwd();
const runDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(runDir, "corpus-manifest.json");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sourceBytes(path) {
  return readFileSync(resolve(repoRoot, path));
}

function exactRawIntent(path) {
  const parsed = JSON.parse(sourceBytes(path).toString("utf8"));
  if (typeof parsed?.intent?.raw !== "string" || !parsed.intent.raw.length) {
    throw new Error(`missing /intent/raw in ${path}`);
  }
  return parsed.intent.raw;
}

function exactMarkdownSection(path, heading) {
  const source = sourceBytes(path).toString("utf8");
  const lines = source.split(/(?<=\n)/);
  const start = lines.findIndex((line) => line.replace(/\r?\n$/, "") === heading);
  if (start < 0) throw new Error(`missing ${heading} in ${path}`);
  const level = heading.match(/^#+/)[0].length;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#+)\s/);
    if (match && match[1].length <= level) {
      end = index;
      break;
    }
  }
  return `${lines.slice(start, end).join("").replace(/\n+$/, "")}\n`;
}

function exactTopLevelCraftContext(path, contextId) {
  const source = sourceBytes(path).toString("utf8");
  const lines = source.split(/(?<=\n)/);
  const contextsIndex = lines.findIndex(
    (line) => line.replace(/\r?\n$/, "") === "contexts:"
  );
  if (contextsIndex < 0) throw new Error(`missing top-level contexts in ${path}`);
  const needle = `  - context_id: ${contextId}`;
  const start = lines.findIndex(
    (line, index) => index > contextsIndex && line.replace(/\r?\n$/, "") === needle
  );
  if (start < 0) throw new Error(`missing top-level context ${contextId} in ${path}`);
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^  - context_id: /.test(lines[index]) || /^\S/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return `${lines.slice(start, end).join("").replace(/\n+$/, "")}\n`;
}

const dependencies = [
  ["cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/SPEC.md", "4879d8a065dd8e263938396d234286b9c52e8fe21460b33e296e77ec718cfe2f"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/CLAIM-BOUNDARY.md", "ba6313c769f7f671fa2787e08bde248e4f8bbf111f3fa5a5fe1e989305ce77ad"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/PROTOCOL.md", "908d114a1335482482ff1ae661bef71c8edc505992b81ca82d314b3aade43421"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/METRICS.md", "6e6a551e1903c87df55f77d4df1c14632d10bdcdf78c2bca0ed00f7a0048a27b"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/spec/INTENT-RECORD.md", "3e2f5ce85a1c70d042d42fc474604ed36824f8bdc9f755d14d80e31e54007a6d"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/evidence/intent-record.candidate.schema.json", "d33279307a528e1213d881a29e8428cb62256f4a6ecf02d5dfd11c57208486a6"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/evidence/run-row.schema.json", "bc750467f47c3ff25c25ad71bf62fcddcdbfc8e15227be5dd597ad96240aa106"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/evidence/validate-run.mjs", "e406bbc45a767721cef2e5043ea046394ab727a00547cb779ed1be5135768bae"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/evidence/RULES.md", "d97b0fc3014cfdde56724ccc98742564d7cad63069d708df426fbb11011f64da"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/work-pack/tasks/TASK-INTENT-POPULATION-001.md", "284e94bd887264711d92bf2e24ec2ec43fedfb87029419fb92f7d290a4f643f6"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/experiments/intent-schema/work-pack/waves/W1-LIVE.md", "ed38c4f511d787db3ba1ad9046dfec504b57180397f60be1215aaeb6e1c53ebd"],
  ["cyberAlchemy-v2/development/agent-reasoning-engine/receipts/intent-evidence-mechanics.json", "7bce35a6c881cf152710bcaf491599eaa86f213b7c36d296cde3057a21301cab"]
];

const sourceSpecs = [
  { sample_id: "SAMPLE-DISPATCH-01", assignment: "population", stratum: "dispatch", source_path: "cyberAlchemy-v2/ontology/development/2026-06-30-ontology-vault-runtime-profile-handoff/HANDOFF-DISPATCH.json", selector: "/intent/raw", kind: "raw", inclusion_reason: "Population dispatch with a compact cross-capability handoff intent." },
  { sample_id: "SAMPLE-DISPATCH-02", assignment: "population", stratum: "dispatch", source_path: "cyberAlchemy-v2/development/linkedin-positioning/linkedin-positioning.dispatch.json", selector: "/intent/raw", kind: "raw", inclusion_reason: "Population dispatch combining public copy, destination, role, and formality constraints." },
  { sample_id: "SAMPLE-DISPATCH-03", assignment: "population", stratum: "dispatch", source_path: "cyberAlchemy-v2/development/interactive-ontology-learning-map/DISPATCH.json", selector: "/intent/raw", kind: "raw", inclusion_reason: "Population dispatch with a private define-design-plan learning application target." },
  { sample_id: "SAMPLE-DISPATCH-04", assignment: "population", stratum: "dispatch", source_path: "cyberAlchemy-v2/validation/development/artifact-admission-validator/artifact-admission-validator.dispatch.json", selector: "/intent/raw", kind: "raw", inclusion_reason: "Population dispatch with a sparse plan-first validator request." },
  { sample_id: "SAMPLE-CRAFT-01", assignment: "population", stratum: "craft", source_path: "cyberAlchemy-v2/.craft/ledger.yml", selector: "context:CTX-CAV2-ROOT", kind: "craft", argument: "CTX-CAV2-ROOT", inclusion_reason: "Population Craft root context with purpose, stage, gate, next move, and owned surfaces." },
  { sample_id: "SAMPLE-CRAFT-02", assignment: "population", stratum: "craft", source_path: "cyberAlchemy-v2/.craft/ledger.yml", selector: "context:CTX-CAV2-MINT", kind: "craft", argument: "CTX-CAV2-MINT", inclusion_reason: "Population Craft feature context with explicit scope guardrail and evidence residue." },
  { sample_id: "SAMPLE-CRAFT-03", assignment: "population", stratum: "craft", source_path: "cyberAlchemy-v2/.craft/ledger.yml", selector: "context:CTX-CAV2-DOMAINSPEC-V2", kind: "craft", argument: "CTX-CAV2-DOMAINSPEC-V2", inclusion_reason: "Population Craft pillar context with long evidence state, ownership pointers, and residue." },
  { sample_id: "SAMPLE-CRAFT-04", assignment: "population", stratum: "craft", source_path: "cyberAlchemy-v2/.craft/ledger.yml", selector: "context:CTX-CAV2-IOLM", kind: "craft", argument: "CTX-CAV2-IOLM", inclusion_reason: "Population Craft blocked context with explicit authority and effect boundaries." },
  { sample_id: "SAMPLE-WORKPACK-01", assignment: "population", stratum: "invoke-work-pack", source_path: "cyberAlchemy-v2/ontology/development/2026-06-30-ontology-folder-consolidation/WORK-PACK.md", selector: "## Objective Summary", kind: "markdown", argument: "## Objective Summary", inclusion_reason: "Population work-pack objective with inputs, success condition, and authority-preservation constraint." },
  { sample_id: "SAMPLE-WORKPACK-02", assignment: "population", stratum: "invoke-work-pack", source_path: "cyberAlchemy-v2/development/business-plan/2026-07-investor-bp/WORK-PACK.md", selector: "## Objective", kind: "markdown", argument: "## Objective", inclusion_reason: "Population work-pack objective with audience, parity, claim, and browser-validation constraints." },
  { sample_id: "SAMPLE-WORKPACK-03", assignment: "population", stratum: "invoke-work-pack", source_path: "cyberAlchemy-v2/development/interactive-ontology-learning-map/WORK-PACK.md", selector: "## Objective", kind: "markdown", argument: "## Objective", inclusion_reason: "Population work-pack objective with passed, blocked, selected, and deferred lanes." },
  { sample_id: "SAMPLE-WORKPACK-04", assignment: "population", stratum: "invoke-work-pack", source_path: "cyberAlchemy-v2/validation/development/artifact-admission-validator/WORK-PACK.md", selector: "## Objective Summary", kind: "markdown", argument: "## Objective Summary", inclusion_reason: "Population work-pack objective with deterministic receipt and authority limits." },
  { sample_id: "SAMPLE-HOLDOUT-DISPATCH-01", assignment: "holdout", stratum: "dispatch", source_path: "cyberAlchemy-v2/development/domainspec-v2/refreshes/2026-07-17-fpr02-integrated-consumer-proof/REFRESH-DISPATCH.json", selector: "/intent/raw", kind: "raw", inclusion_reason: "Held-out refresh dispatch, not inspected to alter rules or schema." },
  { sample_id: "SAMPLE-HOLDOUT-CRAFT-01", assignment: "holdout", stratum: "craft", source_path: "cyberAlchemy-v2/development/agent-reasoning-engine/.craft/ledger.yml", selector: "context:CTX-ARE-ROOT", kind: "craft", argument: "CTX-ARE-ROOT", inclusion_reason: "Held-out project-local Craft root, not inspected to alter rules or schema." },
  { sample_id: "SAMPLE-HOLDOUT-WORKPACK-01", assignment: "holdout", stratum: "invoke-work-pack", source_path: "projects/poker-agent-arena/WORK-PACK.md", selector: "## Objective", kind: "markdown", argument: "## Objective", inclusion_reason: "Held-out independent work-pack objective, not inspected to alter rules or schema." }
];

if (existsSync(outputPath)) {
  throw new Error(`refusing to overwrite frozen manifest: ${outputPath}`);
}

const dependencyLocks = dependencies.map(([path, expectedSha256]) => {
  const actualSha256 = sha256(sourceBytes(path));
  if (actualSha256 !== expectedSha256) {
    throw new Error(`stale dependency ${path}: expected ${expectedSha256}, got ${actualSha256}`);
  }
  return { path, sha256: actualSha256 };
});

const samples = sourceSpecs.map((spec) => {
  const bytes = sourceBytes(spec.source_path);
  const selectedText = spec.kind === "raw"
    ? exactRawIntent(spec.source_path)
    : spec.kind === "craft"
      ? exactTopLevelCraftContext(spec.source_path, spec.argument)
      : exactMarkdownSection(spec.source_path, spec.argument);
  if (!bytes.toString("utf8").includes(selectedText)) {
    throw new Error(`selected text is not an exact UTF-8 substring for ${spec.sample_id}`);
  }
  return {
    sample_id: spec.sample_id,
    assignment: spec.assignment,
    stratum: spec.stratum,
    source_path: spec.source_path,
    selector: spec.selector,
    source_sha256: sha256(bytes),
    selected_text: selectedText,
    selected_text_sha256: sha256(selectedText),
    inclusion_reason: spec.inclusion_reason
  };
});

const population = samples.filter((sample) => sample.assignment === "population");
const holdout = samples.filter((sample) => sample.assignment === "holdout");
if (samples.length !== 15 || new Set(samples.map((sample) => sample.sample_id)).size !== 15) {
  throw new Error("manifest requires exactly 15 unique samples");
}
if (population.length !== 12 || holdout.length !== 3 || new Set(holdout.map((sample) => sample.stratum)).size !== 3) {
  throw new Error("manifest requires 12 population and 3 holdout samples across the three holdout strata");
}

const manifest = {
  run_id: RUN_ID,
  protocol_id: "intent-schema-population@1",
  frozen_at: FROZEN_AT,
  evidence_boundary: "source-lock-and-assignment-evidence-only; not-semantic-validity",
  dependency_locks: dependencyLocks,
  samples
};

writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${outputPath}\n${sha256(readFileSync(outputPath))}\n`);
