# TASK-INTENT-POPULATION-001 — populate one frozen intent corpus

## Objective and owned decision

Determine whether the unchanged candidate record and population rules can carry
one frozen 12+3 private local corpus to a mechanically valid, source-reviewable
result. This task decides run eligibility only. It does not select fields.

## Dependencies

- `receipts/intent-evidence-mechanics.json` status `pass`.
- Approved experiment define/design/plan artifacts.
- Candidate schemas and validator frozen at run start.
- Read access to the selected local source artifacts.

## Inputs and outputs

Inputs: protocol, metrics contract, candidate record/schema, validator, validated
dispatch/Craft/Invoke/work-pack sources.

Outputs under `experiments/intent-schema/runs/2026-07-22-intent-schema-01/`:

- `corpus-manifest.json`
- `records.jsonl`
- `metrics.json`
- `RESULT.md`

Terminal receipt: `receipts/intent-schema-live-run.json`.

## Data/state touched

New private run artifacts only. Source artifacts are read-only. No network,
canonical definition/schema, public Arcanum, parent Craft, orchestrator, or
external effect state may be written.

## Execution algorithm

1. Resolve exactly four dispatch, four Craft, and four Invoke/work-pack
   population excerpts plus three holdouts from at least two strata.
2. Record concrete path, selector, assignment, inclusion reason, file hash, and
   selected-text hash for every sample.
3. Hash the protocol, candidate schemas, validator, and intent-record hypothesis.
4. Write the manifest and consider assignments frozen.
5. Populate all 12 population rows using declared/inferred/unresolved rules. Do
   not default missing semantics.
6. Validate after transcription. Repair only shape/transcription defects; record
   any semantic posture revision with reason.
7. Without changing schemas/protocol/metrics, populate the three held-out rows.
8. Run the complete validator with manifest/source checks.
9. Compute integrity, posture, pressure, stratum, and holdout metrics.
10. Render bounded findings, field evidence cards with `owner_decision=pending`,
    claim limits, concrete residue, and candidate actions in `RESULT.md`.
11. Return a terminal Task Session receipt and route to g6 on pass/flag, or the
    named repair owner on block.

## Ordering and precedence rules

- Direct source support precedes inference; unresolved precedes an unsupported
  default.
- The frozen manifest and protocol precede any convenience discovered during
  population.
- Structural validator results control structural status only.
- Canonical D39 source and omission consequence outrank corpus frequency in the
  later owner decision.
- A block condition outranks a pass count; holdout failure stays visible.

## Edge cases and failures

- Missing or changed source after freeze -> block, preserve partial artifacts.
- One excerpt appears to support two fields -> populate only if each unique
  question is answered; otherwise add ambiguity/overlap observation.
- No safe value -> `unresolved`, null, no evidence refs.
- Held-out needs a new property or enum -> retain failure and residue; no repair
  in the same run.
- Duplicate sample/excerpt -> replace before freeze or block afterward.
- Validator accepts expected-fail fixture or rejects expected-pass fixture -> do
  not start/continue live population.
- Any public/canonical write pressure -> block and route to owner.

## SWU-INTENT-001 — execute one frozen 12+3 population run

- **Parent task:** TASK-INTENT-POPULATION-001
- **Primary behavior:** Transform exactly one frozen 12+3 manifest into one
  validated, metric-bearing, owner-reviewable evidence run under unchanged rules.
- **Dependencies:** passing mechanics receipt and all source contracts above.
- **Write scope:** the named run directory and
  `receipts/intent-schema-live-run.json` only.
- **Done criteria:** exact manifest cardinality, source locks, JSONL rows, metrics,
  result, and terminal receipt exist; validators/metrics meet protocol gates; no
  schema repair or selection occurred.
- **Acceptance evidence:** artifact hashes, validator command/exit result,
  manifest uniqueness/source-lock checks, metric contract, and claim-boundary
  review in the receipt.
- **Verification command:**
  `node experiments/intent-schema/evidence/validate-run.mjs --schema experiments/intent-schema/evidence/run-row.schema.json --manifest experiments/intent-schema/runs/2026-07-22-intent-schema-01/corpus-manifest.json experiments/intent-schema/runs/2026-07-22-intent-schema-01/records.jsonl`
- **Execution owner:** `local-fallback` Task Session. No execution subagent is
  authorized by this dispatch.
- **Expected result shape:** the Task Session receipt shape in `WORK-PACK.md`.

### Split analysis

Plausible child units are manifest freeze, population rows, held-out rows,
metric reduction, and result closeout. None has an independently acceptable
experiment boundary: a manifest has no population evidence; population without
holdout does not test frozen rules; validation without metrics cannot inform the
selection question; metrics without source locks are unauditable; a result
without the terminal receipt cannot prove closure. Splitting these into separate
execution units would permit partial outputs to masquerade as the live-run
claim. They remain ordered steps inside one reversible SWU.

## Handoff context

Read only the approved files linked from `WORK-PACK.md`, the passing mechanics
receipt, and the selected source excerpts. Preserve the exact 12+3 boundary,
candidate schema hashes, claim boundary, and g6 owner route. Return artifacts and
residue; do not decide the schema.
