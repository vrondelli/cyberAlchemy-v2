# Selected-local candidate intent record

## Purpose

This is the selected-local candidate for machine-projecting `CAV2-D39` Intent
without replacing its meaning. The semantic minimum is governed upstream. The
local treatment was selected through admitted run 02 and the explicit g6 owner
decision; it remains revisable, private, non-canonical, and bounded to the
evidence described in [`INTENT-SCHEMA-DECISION.md`](INTENT-SCHEMA-DECISION.md).

Schema conformance, when implemented, will establish shape only (`CAV2-D56`). It
will not establish that a value is truthful, complete, authorized, approved, or
semantically necessary.

## Approved intent instance

The source record for this define stage is the operator-confirmed intent in
[`../DISPATCH.json`](../DISPATCH.json). The values below are an exact bounded
projection of that record, not newly inferred scope.

| D39 field | Posture | Approved value | Evidence |
|---|---|---|---|
| `source` | declared | Operator as the explicit expresser of this confirmed intent. | `DISPATCH.json#/intent/source/actor_ref` |
| `purpose` | declared | Give agents a governed, traceable way to preserve intent, select risk-sensitive methods, derive typed semantic judgments, abstain on insufficient support, and withhold effects until a separate exact-action gate passes. | `DISPATCH.json#/intent/purpose` |
| `scope` | declared | Include a scoped Craft workspace, whole-engine define/design/plan, one repository-local intent-schema experiment, the evaluator first-witness plan, and a final bounded Craft refresh. Exclude evaluator/effect implementation, canonical/public mutation, orchestrator writes, and efficacy promotion claims. | `DISPATCH.json#/intent/scope` |
| `constraints` | declared | Preserve CAV2-D39; treat schema as shape evidence only; enforce zero calls after entry block/defer and two-part effect authorization; keep the corpus private; constrain final Craft refresh writes. | `DISPATCH.json#/intent/constraints` (`IC-001` through `IC-005`) |
| `target_pressure` | declared | The repository coordinates work but lacks witnessed semantic reduction; agents may silently replace intent; guessed schemas may encode framing bias; and effort/consensus/receipts/challenge may be mistaken for evidence or authority. | `DISPATCH.json#/intent/target_pressure` |
| `current_output_hypothesis` | declared | A private Invoke authoring package plus empirical intent-schema evidence, coordinated through a scoped Craft workspace and centered on `semantic-judgment evaluator@1`; status `revisable-candidate`. | `DISPATCH.json#/intent/current_output_hypothesis` |
| `revision_route` | declared | Operator plus Invoke target-artifact owner may refine, split, rename, reject, or replace candidate fields after experiment evidence; changes are logged in the scoped Craft ledger and silent replacement is forbidden. | `DISPATCH.json#/intent/revision_route` |

No field is marked `inferred` or `unresolved` in this instance because the
confirmed dispatch explicitly supplies every semantic slot. That fact does not
validate the candidate envelope across other repository records; the population
experiment still owns that evidence.

## Selected-local model

The record has two layers:

1. **Record envelope:** identity, version, raw source expression, technical
   capture provenance, capture time, and record status. Revision-history item
   granularity remains outside the selected minimum pending revision-bearing
   evidence.
2. **Intent projection:** the seven D39 semantic fields. Every populated value
   carries a source posture rather than hiding inference.

```yaml
intent_id: string
record_schema: intent-record.selected-local@1
record_status: candidate | selected-local | superseded
raw_intent:
  text_or_ref: string
  source_ref: string
  captured_at: date-time # pre-existing recorder metadata; not source-declared time
intent:
  source: FieldValue
  purpose: FieldValue
  scope: FieldValue
  constraints: FieldValue
  target_pressure: FieldValue
  current_output_hypothesis: FieldValue
  revision_route: FieldValue
# revision_history is not selected in @1; initial records carry no item schema.
```

Candidate `FieldValue`:

```yaml
posture: declared | inferred | unresolved
value: any | null
evidence_refs: [string]
inference_note: string | null
```

Whole-field `FieldValue` posture is retained. Finer-grained provenance remains
a later experiment question and must not be introduced as if run 02 selected it.

## Selected capture rules

1. `raw_intent.source_ref` is technical capture provenance only. It identifies
   where the expression was captured, not who expressed it or who has authority
   over it.
2. `intent.source.value` records the semantic expresser and accountable authority
   only when the selected source supports them. Otherwise the whole field is
   `unresolved`; a path, nearby owner, or agent identity cannot fill it.
3. `intent.revision_route` remains a required D39 question. Its owner route must
   be explicit in admissible source evidence or the field is `unresolved`.
   Navigation links and plausible maintainers do not create revision authority.
4. `raw_intent`, `intent_id`, `record_schema`, and `record_status` remain part of
   the selected local minimum. The pre-existing `captured_at` member records
   projection capture time only; run 02 did not select new timestamp semantics
   or a source-declared-time field.
5. Run 02 supplied no revision-bearing records. No revision-history item keys,
   update algebra, or admission rule are selected by this contract.

## Semantic field hypotheses

| Field | Distinct question it should answer | Candidate evidence signal | Failure signal |
|---|---|---|---|
| `source` | Who or what expressed the intent, and which accountable authority is supported? | Explicit expresser/authority evidence distinct from technical capture provenance. | Treats a file path, nearby owner, or capturing agent as the expresser or authority. |
| `purpose` | What capability or outcome should become possible? | Goal statement not reducible to the proposed artifact. | Merely restates output type or implementation. |
| `scope` | What objects, boundaries, and exclusions does the intent cover? | Included/excluded surfaces or target boundary. | Silently invents permission or duplicates constraints. |
| `constraints` | What rules, limits, dependencies, or forbidden moves bind the work? | Explicit restrictions with origins. | Becomes a bag of goals or target pressures. |
| `target_pressure` | What present problem or failure makes change necessary? | Observable tension distinct from desired future state. | Becomes a synonym for purpose or priority. |
| `current_output_hypothesis` | What output currently appears able to satisfy the intent? | Revisable artifact/capability guess plus status. | Hardens into requirement or silently replaces intent. |
| `revision_route` | Who may change the projection, by which evidence and record? | Explicit owner route and supported correction path. | Infers revision authority from navigation or allows silent replacement. |

## Population posture

- `declared`: the source artifact directly supports the value or an exact
  source-locked paraphrase.
- `inferred`: a bounded interpretation is required; `inference_note` and at least
  one source reference are mandatory.
- `unresolved`: the source does not support a safe value. `value` is `null` and
  the absence stays visible.

`unresolved` is evidence, not a schema failure. A structurally valid record may
contain unresolved semantics; whether that blocks a reasoning run belongs to a
separate contract and gate.

## Candidate structural invariants

1. `raw_intent` is preserved and never overwritten by the structured projection.
2. All seven D39 fields exist, even when their posture is `unresolved`.
3. `declared` and `inferred` values cite at least one concrete source reference.
4. `inferred` values explain the inference; `declared` values do not pretend to
   be verbatim unless they are quoted and selector-locked.
5. `unresolved` values are null and are not defaulted from convenience.
6. Revision-history item shape and update behavior are unresolved and are not
   part of `selected-local@1`.
7. `current_output_hypothesis` never grants scope, authority, or mutation
   permission.
8. The record remains private and repository-local for this experiment.

## Evidence result and remaining questions

The admitted run-02 experiment established only that:

- all 15 rows conformed to the fixed structure and declared invariants;
- whole-field posture exposed inference and missingness;
- semantic source attribution was unresolved in all 15 excerpts;
- revision routes were commonly absent or inferential;
- preserving raw intent made output-replacement pressure reviewable; and
- revision-history granularity was not exercised.

Inter-rater consistency, representative fitness, finer-grained provenance, and
revision-history mechanics remain future evidence questions.

## Selection rule

Corpus frequency did not retain or reject a D39 field. The g6 owner decision
used distinct operational questions, failure consequences, missingness, and the
canonical minimum to select this local treatment. All unresolved observations
remain residue in the decision record; schema conformance still supplies shape
evidence only.
