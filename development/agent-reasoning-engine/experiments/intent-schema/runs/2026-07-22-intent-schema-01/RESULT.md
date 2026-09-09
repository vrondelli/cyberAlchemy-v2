# Intent-schema population result

Run: `2026-07-22-intent-schema-01`

Result: **FLAG — mechanically valid and eligible for g6 owner review**

This result is bounded to one private, repository-local corpus of 12 population
and 3 held-out records. It does not select or promote a schema.

## What executed

- One selected Task Session unit: `SWU-INTENT-001`.
- A context pack covered all eight task obligations.
- The first candidate manifest freeze was rejected before population because its
  own validation caught concurrently hardened mechanics and a changing active
  dispatch. The accepted freeze records that repair, keeps assignments unchanged,
  and uses a stable read-only dispatch instead.
- All 12 population rows were projected under the fixed posture rules.
- All 3 held-out rows were then projected without changing schema, validator,
  protocol, metrics, or observation vocabulary.
- The project-local validator parsed all 15 rows and returned zero errors.
- Metrics were recomputed from JSONL and matched the stored result.

The preflight repair is evidence that source locking works; it is not evidence
that the candidate intent fields are correct.

## Integrity result

| Check | Result |
|---|---|
| Manifest uniqueness and 12+3 assignment | 15/15, pass |
| Current file and selected-text hashes | 15/15, pass |
| Population structural/invariant validation | 12/12, pass |
| Held-out structural/invariant validation | 3/3, pass |
| Evidence refs on declared/inferred values | 78/78, pass |
| Notes on inferred values | 16/16, pass |
| Null/no-evidence unresolved values | 27/27, pass |
| Held-out rule/schema/validator drift | none |
| New holdout observation kind required | no |

These are shape, provenance-lock, and declared-invariant checks. They do not
validate the truth or authority of populated values.

## Semantic-field posture

| Field | Declared | Inferred | Unresolved | Bounded observation |
|---|---:|---:|---:|---|
| `source` | 0 | 0 | 15 | Artifact provenance existed; the originating intent actor did not. |
| `purpose` | 15 | 0 | 0 | Consistently separable from the implementation/output guess. |
| `scope` | 11 | 4 | 0 | Four rows required interpretation from owned artifacts or context. |
| `constraints` | 15 | 0 | 0 | Repeatedly carried non-derivable safety, ordering, and non-goal semantics. |
| `target_pressure` | 4 | 11 | 0 | Most durable artifacts were solution-oriented and left the current problem implicit. |
| `current_output_hypothesis` | 15 | 0 | 0 | Six rows showed concrete risk that it could replace purpose. |
| `revision_route` | 2 | 1 | 12 | Latest next moves existed, but owner/reason/revision trail usually did not. |

Across all 105 semantic field values: 62 were declared, 16 inferred, and 27
unresolved.

## Pressure observations

- `purpose` ↔ `current_output_hypothesis`: 6 replacement-risk observations.
- `scope` ↔ `constraints`: 3 repeated pair observations plus one row that also
  mixed the current output.
- Missing semantics: 11 rows carried explicit missingness observations, chiefly
  source actor and revision route.
- Source granularity: 4 folded YAML or multi-line Markdown rows showed that a
  selector is more reliable than pretending one excerpt line is the whole intent.
- No `envelope_redundancy` observation was registered, but timestamp semantics
  still failed inspection: the experiment could supply projection-record time,
  not the original source-intent time.

## Held-out result

All three held-out records passed the unchanged structure. They reproduced rather
than repaired the main pressures:

- intent source remained unresolved in all three;
- target pressure remained inferred in all three;
- revision route was declared once, inferred once, and unresolved once;
- output-replacement risk appeared in all three; and
- no new property, enum, metric, or observation kind was needed.

With only three rows, this is a procedural holdout result, not a generalization
estimate.

## Candidate actions for g6

These are recommendations for owner judgment; `owner_decision` remains pending.

| Field/mechanic | Candidate action | Evidence-bounded rationale |
|---|---|---|
| `source` semantic field | **revise** | Keep the D39 question, but separate originating actor/owner from capture-artifact provenance. All 15 rows exposed the collapse. |
| `purpose` | **retain** | Declared in 15/15 and protected against six output-replacement pressures. |
| `scope` | **retain with clearer guidance** | Independently useful, though 4/15 required inference and scope/constraint classification needs examples. |
| `constraints` | **retain** | Declared in 15/15 and repeatedly carried safety, order, non-goal, and authority limits not derivable from scope. |
| `target_pressure` | **retain** | The 11/15 inference rate is a capture gap: it exposes solution-first artifacts rather than proving redundancy. |
| `current_output_hypothesis` | **retain** | The six observed replacement risks show why the current artifact/implementation guess must be explicitly revisable. |
| `revision_route` | **retain** | Sparse support (12/15 unresolved) exposes a missing governance obligation; the two declared examples showed unique value. |
| `raw_intent.text_or_ref` | **revise** | Require a selector; make an excerpt optional and explicitly partial rather than using an ambiguous text-or-reference union. |
| `raw_intent.captured_at` | **split** | Use `recorded_at` for projection capture and optional `source_declared_at` only when the source supports it. |
| `revision_history` | **unresolved** | No record carried a live semantic revision, so record-level versus field-level history remains unwitnessed. |

The run does **not** recommend adding an eighth semantic field. It recommends
repairing the envelope and source-field shape while preserving the seven D39
questions for local use.

## What the run cannot claim

- A universal or canonical intent schema.
- Truth, authority, approval, or semantic completeness from schema validation.
- That low frequency permits removing a CAV2-D39 field.
- That one author populated every value without interpretation bias.
- Inter-rater reliability or representative coverage.
- An implemented semantic evaluator or reasoning engine.
- Anti-bias, bias-cancellation, or safety efficacy.

## Residue

1. A revision-bearing corpus is needed before selecting the granularity and
   invariants of `revision_history`.
2. A later experiment is required if independent annotator consistency matters.
3. The `source` field needs an owner-approved structure that does not confuse
   actor, owner, capture artifact, and provenance chain.
4. Target-pressure capture should become an explicit authoring/clarification
   obligation if the owner retains it; inference should not silently count as an
   accepted problem statement.
5. The sampled corpus is local and small; future reusable-harness or canonical
   claims require new evidence and separate owner routes.

## Required owner decision

Gate `g6-schema-selection` now requires the operator plus intent-contract owner
to record which candidate actions are accepted, changed, deferred, or rejected.
Corpus frequency cannot make that decision. No downstream engine reconciliation,
design, plan, or Craft refresh may proceed until that record exists.
