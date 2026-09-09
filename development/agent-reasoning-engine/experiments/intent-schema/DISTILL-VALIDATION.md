# Distill validation — intent-schema experiment plan

Mode: `validate`

Verdict: **PASS**

## Validation target

- objective and approved six-view experiment design;
- `IMPLEMENTATION-LAYERING.md`;
- `WORK-PACK.md` and split task/wave contracts;
- selected `SWU-INTENT-001`;
- claim boundary, blockers, and g6 handoff.

## Tensioned validation lenses

The “proposer” and “balancer” below are review roles applied by the parent
coordinator, not execution subagents and not independent evidence.

### Proposer

Retain one SWU covering manifest freeze through terminal result because the
experiment claim is indivisible: one frozen candidate must survive population,
holdout, validation, metrics, and closeout before it can inform selection.

### Balancer

Test five splits: manifest-only, population-only, holdout-only, metrics-only, and
result-only. Each can produce an artifact, but none can independently satisfy the
approved decision question. Allowing any child to pass would create partial
evidence that could be overclaimed. Retain the ordered full-run boundary.

## Required checks

| Check | Result | Evidence |
|---|---|---|
| Smallest coherent unit | pass | One complete frozen 12+3 run is the minimum result eligible for g6. |
| One primary behavior | pass | Produce a source-locked owner-reviewable evidence run under unchanged rules. |
| Independent acceptance boundary | pass | Exact manifest, rows, metrics, result, and terminal receipt close together. |
| Split analysis | pass | Candidate children cannot answer the experiment question independently. |
| Narrow first unit | pass | The unit tests one record candidate and does not build a general harness or engine. |
| Recomposition proof | pass | The run creates the field evidence cards required by the experiment spec and g6. |
| Algorithmic detail | pass | Task contract defines data, steps, precedence, failures, and validation. |
| Navigation | pass | Work-pack links task, wave, source design, selected SWU, and verification command. |
| Owner boundary | pass | Task Session owns execution; g6 owners select; promotion owners remain outside. |
| Hidden acceptance gap | pass with named residue | Inter-rater and representative-sample claims are explicitly excluded. |

## Recomposition proof

```text
SWU-INTENT-001
  -> source-locked records + held-out behavior + metrics + residue
  -> experiment success/flag/block result
  -> g6 field evidence cards with owner_decision=pending
  -> local schema-selection record after owner review
```

Removing manifest locking, holdout, validator evidence, metrics, result wording,
or terminal receipt breaks this chain. Adding repeatability, multi-annotator
analysis, reusable packaging, or schema promotion exceeds it.

## Residue and repair routes

- `GAP-INTENT-ANNOTATION-001`: future experiment owner if inter-rater evidence is
  later required.
- `GAP-INTENT-SAMPLE-001`: g6 owner must keep selection local and revisable.
- Any L0 mechanics failure: research-evidence-harness repair, then rerun Distill
  only if the selected SWU boundary changes.

The plan may route to L0 evidence mechanics and then the selected Task Session.
