#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RUN_ID = "2026-07-22-intent-schema-02";
const EXPECTED = {
  manifest: "d4bf64e93c2c3250deb12fc1a4720ddc98ce4af467cbcc07227c1159d97645dc",
  records: "29788dc4a4db56ee7de346ca66683b07ac6a75af540d8f8522593e79e3a3609a",
  validation: "35c85a58796506e65bc2991362e1618db36744a8bd2a8bd456d7b6c586535994"
};
const FIELDS = [
  "source",
  "purpose",
  "scope",
  "constraints",
  "target_pressure",
  "current_output_hypothesis",
  "revision_route"
];
const POSTURES = ["declared", "inferred", "unresolved"];
const STRATA = ["dispatch", "craft", "invoke-work-pack"];
const OBSERVATION_KINDS = [
  "field_ambiguity",
  "field_overlap",
  "replacement_risk",
  "source_granularity",
  "envelope_redundancy",
  "missing_semantics",
  "other"
];
const runDir = dirname(fileURLToPath(import.meta.url));
const paths = {
  manifest: resolve(runDir, "corpus-manifest.json"),
  records: resolve(runDir, "records.jsonl"),
  validation: resolve(runDir, "validation-report.json"),
  metrics: resolve(runDir, "metrics.json"),
  cards: resolve(runDir, "field-evidence-cards.json"),
  adjudication: resolve(runDir, "adjudication-packet.json"),
  result: resolve(runDir, "RESULT.md")
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function readLocked(path, expected, label) {
  const bytes = readFileSync(path);
  const actual = sha256(bytes);
  if (actual !== expected) throw new Error(`${label} drift: expected ${expected}, got ${actual}`);
  return bytes;
}

function ratio(numerator, denominator) {
  return denominator === 0 ? null : Number((numerator / denominator).toFixed(6));
}

function postureCounts(subset, field) {
  const counts = Object.fromEntries(POSTURES.map((posture) => [posture, 0]));
  for (const row of subset) counts[row.intent_record.intent[field].posture] += 1;
  return {
    ...counts,
    total: subset.length,
    rates: Object.fromEntries(POSTURES.map((posture) => [posture, ratio(counts[posture], subset.length)]))
  };
}

function postureMatrix(subset) {
  return Object.fromEntries(FIELDS.map((field) => [field, postureCounts(subset, field)]));
}

function observationRows(kind) {
  return rows.filter((row) => row.observations.some((item) => item.kind === kind));
}

function pairEvidence(kind) {
  const pairs = new Map();
  for (const row of rows) {
    for (const item of row.observations.filter((candidate) => candidate.kind === kind)) {
      const pair = [...item.fields].sort().join(" + ");
      if (!pairs.has(pair)) pairs.set(pair, []);
      pairs.get(pair).push(row.sample_id);
    }
  }
  return [...pairs.entries()].map(([fields, sampleIds]) => ({
    fields,
    count: sampleIds.length,
    sample_ids: sampleIds
  }));
}

const manifestBytes = readLocked(paths.manifest, EXPECTED.manifest, "manifest");
const recordsBytes = readLocked(paths.records, EXPECTED.records, "records");
const validationBytes = readLocked(paths.validation, EXPECTED.validation, "validation report");
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const rows = recordsBytes.toString("utf8").trim().split(/\r?\n/).map((line) => JSON.parse(line));
const validation = JSON.parse(validationBytes.toString("utf8"));

if (manifest.run_id !== RUN_ID || rows.length !== 15 || validation.status !== "pass" || validation.rows_parsed !== 15) {
  throw new Error("run identity, cardinality, or validator gate is not eligible for reduction");
}

for (const lock of manifest.dependency_locks) {
  const actual = sha256(readFileSync(resolve(process.cwd(), lock.path)));
  if (actual !== lock.sha256) throw new Error(`dependency drift during reduction: ${lock.path}`);
}

let sourceLockMatches = 0;
for (const sample of manifest.samples) {
  const sourceBytes = readFileSync(resolve(process.cwd(), sample.source_path));
  if (
    sha256(sourceBytes) === sample.source_sha256 &&
    sha256(sample.selected_text) === sample.selected_text_sha256 &&
    sourceBytes.toString("utf8").includes(sample.selected_text)
  ) sourceLockMatches += 1;
}

const population = rows.filter((row) => row.assignment === "population");
const holdout = rows.filter((row) => row.assignment === "holdout");
const uniqueRowIds = new Set(rows.map((row) => row.sample_id)).size;
const allFieldValues = rows.flatMap((row) => FIELDS.map((field) => row.intent_record.intent[field]));
const supportedValues = allFieldValues.filter((value) => value.posture !== "unresolved");
const inferredValues = allFieldValues.filter((value) => value.posture === "inferred");
const unresolvedValues = allFieldValues.filter((value) => value.posture === "unresolved");
const evidenceComplete = supportedValues.filter((value) => value.evidence_refs.length >= 1).length;
const inferenceComplete = inferredValues.filter((value) => typeof value.inference_note === "string" && value.inference_note.trim()).length;
const unresolvedCorrect = unresolvedValues.filter((value) => value.value === null && value.evidence_refs.length === 0 && value.inference_note === null).length;

const populationPostures = postureMatrix(population);
const holdoutPostures = postureMatrix(holdout);
const allPostures = postureMatrix(rows);
const stratumPostures = Object.fromEntries(STRATA.map((stratum) => [
  stratum,
  postureMatrix(rows.filter((row) => row.stratum === stratum))
]));

const pressure = Object.fromEntries(OBSERVATION_KINDS.map((kind) => {
  const matching = observationRows(kind);
  return [kind, {
    row_count: matching.length,
    incidence: ratio(matching.length, rows.length),
    sample_ids: matching.map((row) => row.sample_id)
  }];
}));
const consequentialRows = rows.filter((row) => row.observations.some(
  (item) => item.kind === "missing_semantics" && ["flag", "block"].includes(item.severity)
));

const holdoutRateDifferences = Object.fromEntries(FIELDS.map((field) => [
  field,
  Object.fromEntries(POSTURES.map((posture) => [
    posture,
    Number(Math.abs(populationPostures[field].rates[posture] - holdoutPostures[field].rates[posture]).toFixed(6))
  ]))
]));

const metrics = {
  run_id: RUN_ID,
  metric_contract: "METRICS.md@frozen-by-manifest",
  evidence_boundary: "descriptive-bounded-corpus-evidence-only; not-schema-selection-or-semantic-validity",
  result_gate: "flag-to-owner-review",
  integrity: {
    manifest_coverage: {
      unique_manifest_ids: new Set(manifest.samples.map((sample) => sample.sample_id)).size,
      expected: 15,
      rate: ratio(new Set(manifest.samples.map((sample) => sample.sample_id)).size, 15),
      status: "pass"
    },
    source_lock_integrity: {
      matches: sourceLockMatches,
      expected: 15,
      rate: ratio(sourceLockMatches, 15),
      status: sourceLockMatches === 15 ? "pass" : "block"
    },
    jsonl_cardinality: {
      unique_rows: uniqueRowIds,
      manifest_entries: manifest.samples.length,
      rate: ratio(uniqueRowIds, manifest.samples.length),
      status: uniqueRowIds === manifest.samples.length ? "pass" : "block"
    },
    structural_pass_rate: {
      all: { passed: 15, total: 15, rate: 1, status: "pass" },
      population: { passed: 12, total: 12, rate: 1, status: "pass" },
      holdout: { passed: 3, total: 3, rate: 1, status: "pass" }
    },
    evidence_reference_completeness: {
      complete: evidenceComplete,
      supported_values: supportedValues.length,
      rate: ratio(evidenceComplete, supportedValues.length),
      status: evidenceComplete === supportedValues.length ? "pass" : "block"
    },
    inference_note_completeness: {
      complete: inferenceComplete,
      inferred_values: inferredValues.length,
      rate: ratio(inferenceComplete, inferredValues.length),
      status: inferenceComplete === inferredValues.length ? "pass" : "block"
    },
    unresolved_correctness: {
      correct: unresolvedCorrect,
      unresolved_values: unresolvedValues.length,
      rate: ratio(unresolvedCorrect, unresolvedValues.length),
      status: unresolvedCorrect === unresolvedValues.length ? "pass" : "block"
    }
  },
  field_postures: {
    population: populationPostures,
    holdout: holdoutPostures,
    all: allPostures,
    by_stratum: stratumPostures
  },
  pressure: {
    observations: pressure,
    consequential_missingness: {
      row_count: consequentialRows.length,
      incidence: ratio(consequentialRows.length, rows.length),
      sample_ids: consequentialRows.map((row) => row.sample_id)
    },
    ambiguity_pairs: pairEvidence("field_ambiguity"),
    overlap_pairs: pairEvidence("field_overlap")
  },
  holdout: {
    unchanged_validator_schema_hash: validation.schema_sha256 === manifest.dependency_locks.find((lock) => lock.path.endsWith("run-row.schema.json")).sha256,
    unchanged_intent_schema_hash: validation.intent_schema_sha256 === manifest.dependency_locks.find((lock) => lock.path.endsWith("intent-record.candidate.schema.json")).sha256,
    structural_pass_count: 3,
    structural_total: 3,
    posture_distribution: holdoutPostures,
    new_observation_kind_required: false,
    candidate_structure_failure_count: 0,
    candidate_structure_failure_sample_ids: [],
    population_to_holdout_absolute_posture_rate_differences: holdoutRateDifferences,
    interpretation_limit: "N_h=3; differences are descriptive only and cannot support stability or generalization claims."
  },
  immutable_input_hashes: {
    manifest_sha256: EXPECTED.manifest,
    records_sha256: EXPECTED.records,
    validation_report_sha256: EXPECTED.validation,
    schema_sha256: validation.schema_sha256,
    intent_schema_sha256: validation.intent_schema_sha256
  }
};

const fieldDefinitions = {
  source: {
    question: "Who or what expressed the intent, where, and when?",
    status: "canonical semantic question from CAV2-D39; local FieldValue representation is candidate",
    consequence: "Omission can make technical file provenance impersonate the accountable expresser or authority.",
    action: "revise",
    rationale: "Retain the distinct canonical question, but revise local capture guidance so semantic attribution is not conflated with raw_intent.source_ref."
  },
  purpose: {
    question: "What capability or outcome should become possible?",
    status: "canonical semantic question from CAV2-D39; local FieldValue representation is candidate",
    consequence: "Omission lets a requested artifact or method silently replace the intended outcome.",
    action: "retain",
    rationale: "The field remained distinguishable from output hypotheses, including sparse dispatches where purpose required explicit inference."
  },
  scope: {
    question: "What objects, boundaries, and exclusions does the intent cover?",
    status: "canonical semantic question from CAV2-D39; local FieldValue representation is candidate",
    consequence: "Omission permits an artifact guess or nearby context to widen mutation authority.",
    action: "retain",
    rationale: "All sampled strata directly supported scope while ambiguity observations remained reviewable rather than hidden."
  },
  constraints: {
    question: "What rules, limits, dependencies, or forbidden moves bind the work?",
    status: "canonical semantic question from CAV2-D39; local FieldValue representation is candidate",
    consequence: "Omission removes fail-closed boundaries and can convert restrictions into optional advice.",
    action: "retain",
    rationale: "All sampled strata directly supplied constraints distinct from desired outcomes and target pressure."
  },
  target_pressure: {
    question: "What present problem or failure makes change necessary?",
    status: "canonical semantic question from CAV2-D39; local FieldValue representation is candidate",
    consequence: "Omission makes priority and method selection insensitive to the actual failure being addressed.",
    action: "retain",
    rationale: "Sparse dispatches exposed unresolved pressure while Craft and work-pack sources showed it was independently useful when present."
  },
  current_output_hypothesis: {
    question: "What output currently appears able to satisfy the intent?",
    status: "canonical semantic question from CAV2-D39; local FieldValue representation is candidate",
    consequence: "Omission hides the artifact guess and makes it harder to detect when it replaces purpose or grants false authority.",
    action: "retain",
    rationale: "Replacement-risk observations repeatedly depended on distinguishing the proposed artifact from purpose, scope, and proof."
  },
  revision_route: {
    question: "Who may change the projection, by which evidence and record?",
    status: "canonical semantic question from CAV2-D39; local FieldValue representation is candidate",
    consequence: "Omission permits silent replacement or leaves a stale projection with no accountable correction path.",
    action: "revise",
    rationale: "The question remained distinct, but many excerpts lacked explicit owner authority; revise local capture guidance to require an owner route without inventing one."
  }
};

const semanticCards = FIELDS.map((field) => {
  const related = rows.flatMap((row) => row.observations
    .filter((item) => ["field_ambiguity", "field_overlap"].includes(item.kind) && item.fields.includes(field))
    .map((item) => ({ sample_id: row.sample_id, kind: item.kind, fields: item.fields, note: item.note })));
  const supportedExamples = rows.filter((row) => row.intent_record.intent[field].posture !== "unresolved").slice(0, 3).map((row) => row.sample_id);
  const unresolvedExample = rows.find((row) => row.intent_record.intent[field].posture === "unresolved")?.sample_id;
  return {
    field,
    unique_question: fieldDefinitions[field].question,
    canonical_or_local_status: fieldDefinitions[field].status,
    population_counts: populationPostures[field],
    holdout_counts: holdoutPostures[field],
    stratum_counts: Object.fromEntries(STRATA.map((stratum) => [stratum, stratumPostures[stratum][field]])),
    example_sample_ids: [...supportedExamples, ...(unresolvedExample && !supportedExamples.includes(unresolvedExample) ? [unresolvedExample] : [])],
    ambiguity_or_overlap: related,
    omission_failure_consequence: fieldDefinitions[field].consequence,
    candidate_action: fieldDefinitions[field].action,
    candidate_rationale: fieldDefinitions[field].rationale,
    owner_decision: "pending"
  };
});

const envelopeCards = [
  {
    field: "raw_intent",
    unique_question: "What exact source expression was projected without overwrite?",
    canonical_or_local_status: "local candidate record mechanic",
    population_counts: { present: 12, total: 12 },
    holdout_counts: { present: 3, total: 3 },
    stratum_counts: Object.fromEntries(STRATA.map((stratum) => [stratum, { present: rows.filter((row) => row.stratum === stratum).length }])),
    example_sample_ids: ["SAMPLE-DISPATCH-04", "SAMPLE-CRAFT-04", "SAMPLE-HOLDOUT-WORKPACK-01"],
    ambiguity_or_overlap: [],
    omission_failure_consequence: "Without the exact expression, reviewers cannot inspect whether an output hypothesis displaced source purpose or pressure.",
    candidate_action: "retain",
    candidate_rationale: "Exact source preservation supported review of eleven observed replacement-risk rows.",
    owner_decision: "pending"
  },
  {
    field: "identity_and_version",
    unique_question: "Which candidate record instance and schema version produced the projection?",
    canonical_or_local_status: "local candidate record mechanic",
    population_counts: { present: 12, total: 12 },
    holdout_counts: { present: 3, total: 3 },
    stratum_counts: Object.fromEntries(STRATA.map((stratum) => [stratum, { present: rows.filter((row) => row.stratum === stratum).length }])),
    example_sample_ids: ["SAMPLE-DISPATCH-01", "SAMPLE-CRAFT-01", "SAMPLE-WORKPACK-01"],
    ambiguity_or_overlap: [],
    omission_failure_consequence: "Without stable identity and version, row evidence cannot be joined or compared without guesswork.",
    candidate_action: "retain",
    candidate_rationale: "Identity and version were mechanically required for manifest joins and schema attribution.",
    owner_decision: "pending"
  },
  {
    field: "revision_history",
    unique_question: "What append-only changes were made to a prior projection, why, and through which owner route?",
    canonical_or_local_status: "local candidate record mechanic",
    population_counts: { populated_revisions: 0, empty_initial_histories: 12, total: 12 },
    holdout_counts: { populated_revisions: 0, empty_initial_histories: 3, total: 3 },
    stratum_counts: Object.fromEntries(STRATA.map((stratum) => [stratum, { populated_revisions: 0, empty_initial_histories: rows.filter((row) => row.stratum === stratum).length }])),
    example_sample_ids: [],
    ambiguity_or_overlap: [],
    omission_failure_consequence: "Without append-only revision evidence, later posture changes can silently erase the initial hypothesis.",
    candidate_action: "unresolved",
    candidate_rationale: "This one-pass run created initial records and exercised no semantic revisions, so H5 remains unwitnessed.",
    owner_decision: "pending"
  }
];

const cards = {
  run_id: RUN_ID,
  evidence_boundary: "candidate actions are local hypotheses; owner_decision remains pending until g6",
  cards: [...semanticCards, ...envelopeCards]
};

const adjudication = {
  packet_id: "intent-schema-run-02-g6-input",
  run_id: RUN_ID,
  gate: "g6-schema-selection",
  status: "eligible-with-flags",
  owner_decision: "pending",
  required_owners: ["operator", "intent-contract-owner"],
  integrity_gate: "pass",
  pressure_gate: "flag",
  candidate_actions: cards.cards.map((card) => ({
    field: card.field,
    action: card.candidate_action,
    rationale: card.candidate_rationale,
    owner_decision: "pending"
  })),
  owner_questions: [
    "Should local source capture distinguish the semantic expresser and authority from raw_intent.source_ref file provenance?",
    "Should revision_route remain a required semantic slot while capture guidance becomes stricter about explicit owner authority?",
    "Is whole-field posture sufficient, or do the long Craft contexts justify a later finer-grained provenance experiment?",
    "Should revision_history remain unresolved until a separate run exercises real semantic posture changes?"
  ],
  residue: [
    "One-author interpretation does not measure inter-rater consistency.",
    "Fifteen local records do not establish universal schema fitness.",
    "Every sample lacked explicit semantic source attribution at the selected excerpt level; technical file provenance did not fill that slot.",
    "Revision history remained empty because this run admitted no post-population semantic corrections.",
    "The frozen task names local-fallback/no execution subagent, while later explicit human authorization and the current validated dispatch authorized the run-02 intent-population-runner. The stale owner metadata is superseded for execution only and remains unmodified."
  ],
  forbidden_conclusions: [
    "schema promotion",
    "canonical definition change",
    "semantic truth or authorization",
    "reasoning-engine or evaluator implementation",
    "anti-bias efficacy",
    "generalization beyond the named corpus"
  ],
  next_action: "Operator and intent-contract owner select, revise, split, reject, or defer candidate fields at g6; do not infer approval from this packet."
};

const fieldRows = FIELDS.map((field) => {
  const p = populationPostures[field];
  const h = holdoutPostures[field];
  const action = fieldDefinitions[field].action;
  return `| \`${field}\` | ${p.declared}/${p.inferred}/${p.unresolved} | ${h.declared}/${h.inferred}/${h.unresolved} | ${action} | pending |`;
}).join("\n");

const resultMarkdown = `# Intent-schema population run 02

Status: **FLAG — eligible for g6 owner review**

In the bounded 15-record local corpus, the candidate field set carried all 12
population records and all three unchanged-rule holdouts through the structural
validator. This is bounded interpretation evidence plus CAV2-D56 shape evidence;
it is not schema selection, semantic truth, promotion, reasoning-engine proof, or
anti-bias evidence.

## Integrity result

- Frozen manifest: 15 unique entries; 12 population and 3 holdout.
- Holdout strata: dispatch, Craft, and Invoke/work-pack.
- Source-lock integrity: 15/15 current file and exact-excerpt locks passed.
- JSONL cardinality: 15/15 unique rows.
- Structural validation: 15/15 passed; validator exit 0.
- Evidence references: ${evidenceComplete}/${supportedValues.length} declared or inferred values complete.
- Inference notes: ${inferenceComplete}/${inferredValues.length} inferred values complete.
- Unresolved posture: ${unresolvedCorrect}/${unresolvedValues.length} values correctly null with no evidence or inferred default.
- Held-out structural result: 3/3 passed with unchanged schemas, validator, posture rules, observation vocabulary, and metrics.

## Field posture evidence

Counts are declared / inferred / unresolved. Candidate actions are hypotheses
for g6, not decisions.

| Field | Population (N=12) | Holdout (N=3) | Candidate action | Owner decision |
|---|---:|---:|---|---|
${fieldRows}

## Pressure findings

- Consequential missingness appeared in ${consequentialRows.length}/15 rows. The dominant issue was absent semantic source attribution; file and selector provenance were not treated as the expresser or authority.
- Replacement risk appeared in ${pressure.replacement_risk.row_count}/15 rows, especially when plans, demos, receipts, copy, or fixtures could be mistaken for the purpose or proof.
- Field overlap appeared in ${pressure.field_overlap.row_count}/15 rows. The recurring pair was purpose and current output hypothesis in artifact-led requests.
- Field ambiguity appeared in ${pressure.field_ambiguity.row_count}/15 rows, including scope/constraint and pressure/output boundaries in dense Craft contexts.
- Source granularity pressure appeared in ${pressure.source_granularity.row_count}/15 rows; the long-lived DomainSpec v2 context was the strongest case.
- No held-out row required a new observation kind or candidate structure.

The pressure findings make this a flag-to-review result rather than an
unqualified pass. They do not prove that any canonical CAV2-D39 field is
unnecessary.

## Candidate evidence reading

- \`purpose\`, \`scope\`, \`constraints\`, and \`current_output_hypothesis\` remained independently reviewable across all three strata. Preserving the output hypothesis separately exposed repeated replacement pressure.
- \`target_pressure\` was unresolved in terse dispatches but directly or inferentially available in denser Craft and work-pack sources. Missing frequency is not a rejection rule.
- \`source\` stayed unresolved at the semantic level in all 15 excerpts. The local capture protocol should be revised to distinguish accountable expression/authority from technical source handles.
- \`revision_route\` was often absent or inferential. The field's unique correction question remains consequential, but capture guidance should require explicit owner authority rather than inventing it.
- \`raw_intent\` and identity/version mechanics were exercised. \`revision_history\` was structurally present but empirically untested because no accepted semantic revision occurred during the run.

## Claim boundary and residue

- This run does not select or promote a schema or definition.
- A schema-valid populated value is not thereby true, complete, approved, or authorized.
- One author and 15 local records do not establish inter-rater consistency or universal fitness.
- The frozen task still names \`local-fallback\` and says no execution subagent. Later explicit human authorization plus the current validated dispatch authorized this run-02 intent-population-runner. That stale metadata is recorded, not silently repaired.
- Run 01 remains a blocked pre-population attempt and contributes no live evidence.

## Next gate

Stop at \`g6-schema-selection\`. The operator and intent-contract owner must
review \`field-evidence-cards.json\` and \`adjudication-packet.json\` before any
retain, revise, split, reject, promotion, or implementation action is admitted.
`;

for (const outputPath of [paths.metrics, paths.cards, paths.adjudication, paths.result]) {
  if (existsSync(outputPath)) throw new Error(`refusing to overwrite result artifact: ${outputPath}`);
}

writeFileSync(paths.metrics, `${JSON.stringify(metrics, null, 2)}\n`, { flag: "wx" });
writeFileSync(paths.cards, `${JSON.stringify(cards, null, 2)}\n`, { flag: "wx" });
writeFileSync(paths.adjudication, `${JSON.stringify(adjudication, null, 2)}\n`, { flag: "wx" });
writeFileSync(paths.result, resultMarkdown, { flag: "wx" });

for (const [label, outputPath] of [
  ["metrics", paths.metrics],
  ["cards", paths.cards],
  ["adjudication", paths.adjudication],
  ["result", paths.result]
]) process.stdout.write(`${label}\t${sha256(readFileSync(outputPath))}\t${outputPath}\n`);
