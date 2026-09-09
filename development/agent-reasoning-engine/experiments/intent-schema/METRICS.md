# Intent-schema experiment metrics

All metrics are descriptive for the named 15-record corpus. No threshold alone
selects or removes a semantic field.

Let `N_p = 12`, `N_h = 3`, and `N = N_p + N_h`.

## Integrity metrics

| Metric | Formula | Required posture |
|---|---|---|
| manifest coverage | unique manifest IDs / 15 | must equal 1.0 |
| source-lock integrity | entries whose current file/excerpt hashes match / 15 | must equal 1.0 |
| JSONL cardinality | unique run rows / manifest entries | must equal 1.0 |
| structural pass rate | schema/invariant-valid rows / 15 | population must equal 1.0; holdout failures are preserved and flag/block per protocol |
| evidence-reference completeness | declared or inferred field values with >=1 evidence ref / all declared or inferred values | must equal 1.0 |
| inference-note completeness | inferred values with non-empty inference note / all inferred values | must equal 1.0 |
| unresolved correctness | unresolved values that are null with no evidence refs / all unresolved values | must equal 1.0 |

Integrity metrics decide run eligibility, not schema selection.

## Field posture metrics

For each field `f` and assignment `a`:

```text
declared_rate(f,a)   = declared(f,a) / N_a
inferred_rate(f,a)   = inferred(f,a) / N_a
unresolved_rate(f,a) = unresolved(f,a) / N_a
```

Also report counts and rates by source stratum. A low declared rate can mean the
source artifact is sparse; it is not automatic evidence that a canonical D39
field is unnecessary.

## Pressure metrics

| Metric | Definition | Interpretation limit |
|---|---|---|
| ambiguity incidence | rows with `field_ambiguity` / rows | Locates review pressure; does not prove the field is invalid. |
| overlap incidence | rows with `field_overlap` / rows | Suggests a revise/split/reject question; owner must inspect examples. |
| replacement-risk incidence | rows with `replacement_risk` / rows | Tests whether raw intent protects against output fixation. |
| source-granularity incidence | rows with `source_granularity` / rows | Assesses selector design, not field semantics. |
| envelope-redundancy incidence | rows with `envelope_redundancy` / rows | Can challenge local mechanics, not canonical D39 fields. |
| consequential missingness | flag/block `missing_semantics` observations / rows | Shows where sparse intent would require clarification before reasoning. |

For ambiguity and overlap, report affected field pairs and concrete sample IDs.

## Holdout metrics

- unchanged validator/schema hash: boolean;
- held-out structural pass count: integer 0–3;
- held-out field posture distribution;
- new observation kind required: boolean (must remain false; otherwise residue);
- candidate structure failure count and sample IDs;
- population-to-holdout absolute posture-rate differences, reported descriptively
  only because `N_h=3` is too small for stability claims.

## Field evidence cards

The result creates one evidence card per semantic/envelope field containing:

```text
field
unique_question
canonical_or_local_status
population_counts
holdout_counts
stratum_counts
example_sample_ids
ambiguity_or_overlap
omission_failure_consequence
candidate_action
owner_decision: pending
```

Candidate actions are hypotheses. `owner_decision` stays `pending` until g6.

## Result gates

- **Pass to owner review:** every integrity requirement passes and no frozen-rule
  violation exists.
- **Flag to owner review:** integrity passes but pressure metrics reveal material
  ambiguity, overlap, missingness, or holdout structure failure.
- **Block:** manifest/source integrity fails, fixture behavior is wrong, protocol
  changes after freeze, or live data is silently fabricated/defaulted.

No metric grants canonical status, validates the meaning of populated values, or
supports a general reasoning-engine or anti-bias claim.
