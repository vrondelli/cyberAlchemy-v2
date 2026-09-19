import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildEnvelope,
  canonicalize,
  sha256Canonical,
} from "../contracts/canonical-json-v1.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repairRoot = resolve(here, "..");
const domainspecRoot = resolve(repairRoot, "../..");
const implRoot = join(domainspecRoot, "impl");
const tsx = join(implRoot, "node_modules/.bin/tsx");
const candidateSource = resolve(
  repairRoot,
  "../ui-meta-type-formalization/candidate-meta-types/ui/candidates.json",
);
const outDir = resolve(getArg("--out-dir") || join(here, "results/generation-001"));
const predecessor = getArg("--predecessor") || null;

const rawSource = readFileSync(candidateSource, "utf8");
const source = JSON.parse(rawSource);
const sourceDigest = `sha256:${createHash("sha256").update(rawSource).digest("hex")}`;
const workspace = mkdtempSync(join(tmpdir(), "uir-mutations-"));

try {
  const schemaDir = join(workspace, "schemas");
  const instanceDir = join(workspace, "instances");
  mkdirSync(schemaDir, { recursive: true });
  mkdirSync(instanceDir, { recursive: true });

  const selectors = [];
  const cases = [];
  for (const candidate of [...source.candidates].sort((a, b) => a.id.localeCompare(b.id))) {
    writeFileSync(join(schemaDir, `${candidate.slug}.schema.yml`), emitSchema(candidate), "utf8");
    for (const criterion of [...candidate.criteria].sort((a, b) => a.name.localeCompare(b.name))) {
      const selector = `${candidate.id}/${criterion.name}`;
      selectors.push({
        selector,
        candidate_id: candidate.id,
        candidate: candidate.label,
        criterion: criterion.name,
        key: criterion.key,
        source_rule: criterion.rule,
        effective_rule: criterion.rule === "attribute-present" ? "attribute-nonempty/v1" : criterion.rule,
      });
      for (const mutation of ["deletion", "empty", "whitespace"]) {
        cases.push(makeCase(candidate, criterion, selector, mutation));
      }
      if (criterion.rule === "attribute-equals") {
        cases.push(makeCase(candidate, criterion, selector, "wrong-fixed"));
      }
    }
  }

  assertCensus(selectors, cases);
  const concepts = cases.map((entry, index) => ({ ...entry, concept: `Mutation${String(index + 1).padStart(3, "0")}` }));
  writeFileSync(join(workspace, "mutations.md"), emitMarkdown(concepts), "utf8");
  for (const entry of concepts) {
    writeFileSync(join(instanceDir, `${entry.concept}.instance.yml`), emitInstance(entry), "utf8");
  }

  const markdown = run(["tools/validate-content.ts", "--schema-dir", schemaDir, "--file", join(workspace, "mutations.md")], 1);
  const instances = run(["tools/instances.ts", "validate", "--schema-dir", schemaDir, "--dir", instanceDir], 1);
  const markdownResults = parseViolations(markdown, "content");
  const instanceResults = parseViolations(instances, "instance");

  const records = concepts.map((entry) => {
    const markdownResult = markdownResults.get(entry.concept);
    const instanceResult = instanceResults.get(entry.concept);
    if (!markdownResult || !instanceResult) throw new Error(`missing validator result for ${entry.concept}`);
    if (markdownResult.code !== entry.expected_code || instanceResult.code !== entry.expected_code) {
      throw new Error(`${entry.case_id}: expected ${entry.expected_code}, got markdown=${markdownResult.code}, instance=${instanceResult.code}`);
    }
    return {
      case_id: entry.case_id,
      selector: entry.selector,
      candidate_id: entry.candidate_id,
      candidate: entry.candidate,
      criterion: entry.criterion,
      key: entry.key,
      source_rule: entry.source_rule,
      effective_rule: entry.effective_rule,
      mutation: entry.mutation,
      fixture_digest: entry.fixture_digest,
      expected: { outcome: "rejected", code: entry.expected_code },
      markdown: markdownResult,
      instance: instanceResult,
      parity: markdownResult.outcome === instanceResult.outcome && markdownResult.code === instanceResult.code,
    };
  });

  const manifest = {
    schema_version: "ui-repair.mutation-manifest.v1",
    source: relativeToRepair(candidateSource),
    source_digest: sourceDigest,
    rule_projection: { "attribute-present": "attribute-nonempty/v1", "attribute-equals": "attribute-equals" },
    selector_count: selectors.length,
    fixed_selector_count: selectors.filter((entry) => entry.source_rule === "attribute-equals").length,
    selectors,
    extensions: "separate; see fixtures/contracts/duplicate-conflict-manifest.json",
  };
  const summary = {
    case_count: records.length,
    deletion: records.filter((entry) => entry.mutation === "deletion").length,
    empty: records.filter((entry) => entry.mutation === "empty").length,
    whitespace: records.filter((entry) => entry.mutation === "whitespace").length,
    wrong_fixed: records.filter((entry) => entry.mutation === "wrong-fixed").length,
    parity_pass: records.filter((entry) => entry.parity).length,
  };
  const envelope = buildEnvelope({
    contractId: "ui-repair.mutation-ledger",
    contractVersion: "1.0.0",
    semanticFields: ["manifest", "cases"],
    record: { manifest, cases: records },
    status: "complete",
    predecessorGenerationId: predecessor,
    inputHandles: [`source:${sourceDigest}`],
    createdAt: new Date().toISOString(),
  });
  const ledger = { ...envelope, schema_version: "ui-repair.mutation-ledger.v1", summary };
  publish(ledger);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

function makeCase(candidate, criterion, selector, mutation) {
  const attributes = { ...candidate.positive };
  if (mutation === "deletion") delete attributes[criterion.key];
  if (mutation === "empty") attributes[criterion.key] = "";
  if (mutation === "whitespace") attributes[criterion.key] = "   ";
  if (mutation === "wrong-fixed") attributes[criterion.key] = "__wrong_fixed__";
  const expectedCode = mutation === "deletion"
    ? "ATTRIBUTE-MISSING"
    : mutation === "empty"
      ? "ATTRIBUTE-EMPTY"
      : mutation === "whitespace"
        ? "ATTRIBUTE-WHITESPACE"
        : "FIXED-VALUE-MISMATCH";
  const semantic = { selector, mutation, effective_rule: criterion.rule === "attribute-present" ? "attribute-nonempty/v1" : criterion.rule, expected_code: expectedCode };
  return {
    ...semantic,
    case_id: `case:${sha256Canonical(semantic)}`,
    candidate_id: candidate.id,
    candidate: candidate.label,
    criterion: criterion.name,
    key: criterion.key,
    source_rule: criterion.rule,
    attributes,
    fixture_digest: sha256Canonical({ meta_type: candidate.label, attributes }),
    expected_code: expectedCode,
  };
}

function emitSchema(candidate) {
  const lines = [
    `meta_type: ${candidate.label}`,
    "required_structure:",
    "  attributes_table_columns: [Attribute, Value]",
    "criterion:",
  ];
  for (const criterion of [...candidate.criteria].sort((a, b) => a.name.localeCompare(b.name))) {
    const rule = criterion.rule === "attribute-present" ? "attribute-nonempty/v1" : criterion.rule;
    lines.push(`  ${criterion.name}:`, `    rule: ${rule}`, `    key: ${criterion.key}`);
    if (criterion.value !== undefined) lines.push(`    value: ${JSON.stringify(criterion.value)}`);
  }
  return `${lines.join("\n")}\n`;
}

function emitMarkdown(cases) {
  const lines = ["# Mandatory mutation corpus", "", "## Concept Registry", "| Concept | Type |", "| --- | --- |"];
  for (const entry of cases) lines.push(`| ${entry.concept} | ${entry.candidate} |`);
  for (const entry of cases) {
    lines.push("", `## ${entry.concept}`, "| Attribute | Value |", "| --- | --- |");
    for (const [key, value] of Object.entries(entry.attributes)) lines.push(`| ${key} | ${value} |`);
  }
  return `${lines.join("\n")}\n`;
}

function emitInstance(entry) {
  const lines = [`meta_type: ${entry.candidate}`, `concept: ${entry.concept}`, "attributes:"];
  for (const [key, value] of Object.entries(entry.attributes)) lines.push(`  ${key}: ${JSON.stringify(value)}`);
  return `${lines.join("\n")}\n`;
}

function run(args, expectedStatus) {
  const result = spawnSync(tsx, args, { cwd: implRoot, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (result.status !== expectedStatus) throw new Error(`command exit ${result.status}, expected ${expectedStatus}: ${args.join(" ")}\n${result.stdout}${result.stderr}`);
  return result.stdout + result.stderr;
}

function parseViolations(output, path) {
  const results = new Map();
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/concept=(Mutation\d+).*\[ui-repair-violations\/v1:([A-Z-]+)\]/);
    if (match) results.set(match[1], { outcome: "rejected", code: match[2], path });
  }
  return results;
}

function assertCensus(selectors, cases) {
  const ids = new Set(cases.map((entry) => entry.case_id));
  const fixed = selectors.filter((entry) => entry.source_rule === "attribute-equals").length;
  if (selectors.length !== 52 || fixed !== 9 || cases.length !== 165 || ids.size !== cases.length) {
    throw new Error(`invalid census selectors=${selectors.length} fixed=${fixed} cases=${cases.length} unique=${ids.size}`);
  }
}

function publish(ledger) {
  const target = join(outDir, "ledger.json");
  if (existsSync(target)) {
    const existing = JSON.parse(readFileSync(target, "utf8"));
    if (existing.content_digest === ledger.content_digest && existing.generation_id === ledger.generation_id) {
      console.log(`NO-OP: immutable generation already exists at ${relativeToRepair(target)}`);
      return;
    }
    throw new Error(`refusing to overwrite non-identical mutation generation at ${relativeToRepair(target)}`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(target, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  console.log(`PASS: published ${ledger.summary.case_count} immutable mutation cases at ${relativeToRepair(target)}`);
}

function relativeToRepair(path) {
  return path.replace(`${repairRoot}/`, "");
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
