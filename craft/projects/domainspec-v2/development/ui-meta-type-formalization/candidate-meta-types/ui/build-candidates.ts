#!/usr/bin/env tsx
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Criterion = { name: string; rule: string; key: string; value?: string };
type Candidate = {
  id: string; label: string; slug: string; neighbor: string; law: string;
  distinguisher: string; criteria: Criterion[]; positive: Record<string, string>;
  malformed: Record<string, string>; neighbor_attributes: Record<string, string>;
  correction: string; edge_source: string[]; edge_target: string[]; limitations: string;
};

const here = dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(readFileSync(join(here, "candidates.json"), "utf8")) as {
  schema_version: string; authority_boundary: string; candidates: Candidate[];
};

function yamlScalar(value: string): string {
  return JSON.stringify(value);
}

function emitSchema(candidate: Candidate): string {
  const lines = [
    `# Generated candidate criterion for ${candidate.label}; never canonical authority.`,
    `meta_type: ${candidate.label}`,
    `category: ui-candidate`,
    `companion: ${candidate.slug}.md`,
    `lifecycle_status: candidate-experimental`,
    `candidate_id: ${candidate.id}`,
    `authority_boundary: candidate shape evidence only`,
    `required_structure:`,
    `  attributes_table_columns: [Attribute, Value]`,
    `criterion:`,
  ];
  for (const criterion of candidate.criteria) {
    lines.push(`  ${criterion.name}:`, `    rule: ${criterion.rule}`, `    key: ${criterion.key}`);
    if (criterion.value !== undefined) lines.push(`    value: ${yamlScalar(criterion.value)}`);
  }
  lines.push(
    `distinguisher:`,
    `  vs: ${yamlScalar(candidate.neighbor)}`,
    `  rule: ${yamlScalar(candidate.distinguisher)}`,
    `edge_participation:`,
    `  source_of: [${candidate.edge_source.join(", ")}]`,
    `  target_of: [${candidate.edge_target.join(", ")}]`,
    `fixtures:`,
    `  positive: fixtures/positive.md`,
    `  negative: fixtures/malformed.md`,
    `  neighbor: fixtures/neighbor.md`,
    `correction_contract: ${yamlScalar(candidate.correction)}`,
    `limitations: ${yamlScalar(candidate.limitations)}`,
    "",
  );
  return lines.join("\n");
}

function emitCard(candidate: Candidate): string {
  const criteria = candidate.criteria.map((c) => `- \`${c.key}\`: \`${c.rule}\`${c.value === undefined ? "" : ` = ${c.value}`}`).join("\n");
  return `---
artifact_id: domainspec-v2-candidate-${candidate.slug}
artifact_type: candidate-companion-doc
companion_to: ${candidate.slug}.schema.yml
owner: ui-meta-type-formalization
lifecycle_status: candidate-experimental
authority_boundary: candidate evidence only; no canonical promotion
---

# ${candidate.label} - Candidate Meta-Type Card

**Companion to** [\`${candidate.slug}.schema.yml\`](./${candidate.slug}.schema.yml).
The schema is the checked candidate contract; this prose is explanatory.

## Formation Law

${candidate.law}

## Structural Criterion

The normalized \`Attribute | Value\` table must satisfy:

${criteria}

## Distinguisher Versus ${candidate.neighbor}

${candidate.distinguisher}

## Correction Contract

${candidate.correction}

## Fixtures

- [positive](./fixtures/positive.md) - must pass.
- [malformed](./fixtures/malformed.md) - must reject.
- [neighbor](./fixtures/neighbor.md) - must reject and reroute to ${candidate.neighbor}.

## DS-D8 Slice

- Source of: ${candidate.edge_source.length ? candidate.edge_source.map((x) => `\`${x}\``).join(", ") : "none"}.
- Target of: ${candidate.edge_target.length ? candidate.edge_target.map((x) => `\`${x}\``).join(", ") : "none"}.

This edge slice is supporting evidence only.

## Limitations

${candidate.limitations} Round-trip and independent replication remain pending.

## Boundary

This candidate validates authored shape, never semantic meaning. It is not an
active or promoted DS-D1 type and is not installed under \`impl/spec/meta-types\`.
`;
}

function emitFixture(candidate: Candidate, role: "positive" | "malformed" | "neighbor"): string {
  const attrs = role === "positive" ? candidate.positive : role === "malformed" ? candidate.malformed : candidate.neighbor_attributes;
  const concept = role === "positive" ? `Example${candidate.slug.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}` : role === "malformed" ? `Malformed${candidate.slug.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}` : `${candidate.neighbor.replace(/[^A-Za-z0-9]/g, "")}Neighbor`;
  const rows = Object.entries(attrs).map(([key, value]) => `| ${key} | ${value} |`).join("\n");
  return `# ${candidate.label} candidate fixture - ${role}

## Concept Registry
| Concept | Type |
| --- | --- |
| ${concept} | ${candidate.label} |

## ${concept}
| Attribute | Value |
| --- | --- |
${rows}
`;
}

const indexRows: string[] = [];
for (const candidate of source.candidates) {
  const dir = join(here, candidate.slug);
  mkdirSync(join(dir, "fixtures"), { recursive: true });
  writeFileSync(join(dir, `${candidate.slug}.schema.yml`), emitSchema(candidate), "utf8");
  writeFileSync(join(dir, `${candidate.slug}.md`), emitCard(candidate), "utf8");
  for (const role of ["positive", "malformed", "neighbor"] as const) {
    writeFileSync(join(dir, "fixtures", `${role}.md`), emitFixture(candidate, role), "utf8");
  }
  indexRows.push(`| ${candidate.id} | [${candidate.label}](./${candidate.slug}/${candidate.slug}.md) | ${candidate.neighbor} | candidate-experimental |`);
}
writeFileSync(join(here, "INDEX.md"), `# UI Candidate Meta-Types

Generated from [\`candidates.json\`](./candidates.json). These artifacts are
candidate evidence only and are not installed canonical meta-types.

| ID | Candidate | Neighbor | Status |
| --- | --- | --- | --- |
${indexRows.join("\n")}
`, "utf8");
console.log(`generated ${source.candidates.length} UI candidate twins under ${resolve(here)}`);
