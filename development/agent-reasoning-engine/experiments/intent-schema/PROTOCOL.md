# Intent-schema population protocol

Protocol ID: `intent-schema-population@1`

## Frozen inputs

Before interpreting records, capture SHA-256 values for:

- this protocol;
- `SPEC.md`, `CLAIM-BOUNDARY.md`, and `METRICS.md`;
- `spec/INTENT-RECORD.md`;
- both candidate JSON schemas and the validator;
- every selected source file and selected excerpt.

The manifest assignment (`population` or `holdout`) is fixed at the same time.
Any post-freeze source or protocol drift blocks the run or requires a new run ID.

## Sampling procedure

Select exactly:

- four validated dispatches whose intent/goal is explicit;
- four scoped Craft contexts with a purpose and next move;
- four Invoke/work-pack artifacts with explicit objectives;
- three held-out entries from at least two of those strata.

Prefer distinct project contexts and artifact shapes. Exclude generated indexes,
conversation-only recollections, secrets, source files outside the private/local
boundary, and artifacts that lack a stable selector. Record every inclusion
reason before population.

## Population algorithm

For each manifest entry:

1. Read only the selected excerpt plus the minimum neighboring lines required to
   resolve references.
2. Preserve the source expression in `raw_intent.text_or_ref`; do not rewrite it
   as the current output hypothesis.
3. For each of the seven fields, ask the unique question in
   `spec/INTENT-RECORD.md`.
4. Assign `declared` only when the selected source directly states or explicitly
   structures the value. Cite its manifest selector.
5. Assign `inferred` only when a bounded interpretation is necessary and
   supportable. Cite evidence and state the inference in one falsifiable note.
6. Assign `unresolved` when the source does not safely answer the question. Set
   `value` to null, keep evidence refs empty, and state no inferred default.
7. Record zero or more observations using only the registered observation kinds.
8. Propose candidate field actions only as review inputs; never mark them selected.
9. Validate the row. Repair transcription/shape errors only. A semantic posture
   change must be recorded as a revision with reason.

## Registered observation kinds

- `field_ambiguity`: the source makes two candidate interpretations plausible.
- `field_overlap`: two fields repeatedly consume the same source meaning.
- `replacement_risk`: an output/artifact hypothesis could displace purpose or
  target pressure.
- `source_granularity`: a selector is too broad or narrow to review the value.
- `envelope_redundancy`: a record mechanic duplicates derivable information.
- `missing_semantics`: sparse source leaves a consequential field unresolved.
- `other`: allowed only with an explicit explanation and owner route.

Each observation names affected fields, evidence refs, severity (`info`, `flag`,
or `block`), and a note. Observations never mutate the schemas during the run.

## Holdout rule

The three held-out sources may not be used to change schemas, enums, population
rules, observation kinds, or metrics. If a held-out row reveals a missing
structure, record the row failure and residue; do not repair and re-score it in
the same run. A repaired schema requires a new candidate version and run.

## Validation sequence

1. Expected-pass synthetic fixture returns exit 0.
2. Expected-fail fixture returns nonzero and at least one expected rule ID.
3. Every population row passes structural and invariant validation.
4. Every holdout row is tested unchanged; failure remains a finding.
5. Manifest IDs and assignments match JSONL exactly once.
6. Source/excerpt hashes still match frozen values.
7. Metrics reducer consumes only rows with validator status `pass` and separately
   reports failed holdout rows, if any.

## Stop and escalation

- Stop `block` on source drift, duplicate/missing samples, fabricated values,
  validator false pass/false fail, fewer than 12 population or 3 holdout entries,
  or protocol drift.
- Continue with `flag` for high missingness, ambiguity, overlap, or one or more
  structurally failed holdouts, provided the failure is preserved.
- Route field selection to g6. Route any canonical definition/schema change to
  its owner after—not inside—the experiment.

## Reproducibility receipt

The terminal receipt must list run ID, protocol/schema/validator hashes, manifest
hash, records hash, metrics hash, commands and exit results, artifacts, blockers,
residue, and the next owner. It proves only that this bounded run executed.
