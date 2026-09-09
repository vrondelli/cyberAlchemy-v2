# Intent-schema population run 02

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
- Evidence references: 77/77 declared or inferred values complete.
- Inference notes: 14/14 inferred values complete.
- Unresolved posture: 28/28 values correctly null with no evidence or inferred default.
- Held-out structural result: 3/3 passed with unchanged schemas, validator, posture rules, observation vocabulary, and metrics.

## Field posture evidence

Counts are declared / inferred / unresolved. Candidate actions are hypotheses
for g6, not decisions.

| Field | Population (N=12) | Holdout (N=3) | Candidate action | Owner decision |
|---|---:|---:|---|---|
| `source` | 0/0/12 | 0/0/3 | revise | pending |
| `purpose` | 9/3/0 | 2/1/0 | retain | pending |
| `scope` | 12/0/0 | 3/0/0 | retain | pending |
| `constraints` | 12/0/0 | 3/0/0 | retain | pending |
| `target_pressure` | 5/3/4 | 1/2/0 | retain | pending |
| `current_output_hypothesis` | 11/1/0 | 3/0/0 | retain | pending |
| `revision_route` | 2/3/7 | 0/1/2 | revise | pending |

## Pressure findings

- Consequential missingness appeared in 15/15 rows. The dominant issue was absent semantic source attribution; file and selector provenance were not treated as the expresser or authority.
- Replacement risk appeared in 11/15 rows, especially when plans, demos, receipts, copy, or fixtures could be mistaken for the purpose or proof.
- Field overlap appeared in 5/15 rows. The recurring pair was purpose and current output hypothesis in artifact-led requests.
- Field ambiguity appeared in 3/15 rows, including scope/constraint and pressure/output boundaries in dense Craft contexts.
- Source granularity pressure appeared in 2/15 rows; the long-lived DomainSpec v2 context was the strongest case.
- No held-out row required a new observation kind or candidate structure.

The pressure findings make this a flag-to-review result rather than an
unqualified pass. They do not prove that any canonical CAV2-D39 field is
unnecessary.

## Candidate evidence reading

- `purpose`, `scope`, `constraints`, and `current_output_hypothesis` remained independently reviewable across all three strata. Preserving the output hypothesis separately exposed repeated replacement pressure.
- `target_pressure` was unresolved in terse dispatches but directly or inferentially available in denser Craft and work-pack sources. Missing frequency is not a rejection rule.
- `source` stayed unresolved at the semantic level in all 15 excerpts. The local capture protocol should be revised to distinguish accountable expression/authority from technical source handles.
- `revision_route` was often absent or inferential. The field's unique correction question remains consequential, but capture guidance should require explicit owner authority rather than inventing it.
- `raw_intent` and identity/version mechanics were exercised. `revision_history` was structurally present but empirically untested because no accepted semantic revision occurred during the run.

## Claim boundary and residue

- This run does not select or promote a schema or definition.
- A schema-valid populated value is not thereby true, complete, approved, or authorized.
- One author and 15 local records do not establish inter-rater consistency or universal fitness.
- The frozen task still names `local-fallback` and says no execution subagent. Later explicit human authorization plus the current validated dispatch authorized this run-02 intent-population-runner. That stale metadata is recorded, not silently repaired.
- Run 01 remains a blocked pre-population attempt and contributes no live evidence.

## Next gate

Stop at `g6-schema-selection`. The operator and intent-contract owner must
review `field-evidence-cards.json` and `adjudication-packet.json` before any
retain, revise, split, reject, promotion, or implementation action is admitted.
