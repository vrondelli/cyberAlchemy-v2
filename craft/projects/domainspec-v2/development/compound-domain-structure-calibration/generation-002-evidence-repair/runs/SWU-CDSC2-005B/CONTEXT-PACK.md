---
task_session: SWU-CDSC2-005B
status: accepted
strict_coverage: pass
runtime: local
adapter: none
source_count: 10
---

# Context Pack: SWU-CDSC2-005B

## Selected Scope

Freeze one adjudication overlay, generate one deterministic parent-valid v1
compatibility receipt, write a provenance review, and add one focused test. Do
not invoke the evaluator, write a result, or append generation 2.

## Controlling Sources

- Refreshed work-pack, W2B wave, and SWU-CDSC2-005B contract.
- `THREE-LAYER-PROTOCOL.md` and resolved `DEC-CDSC2-009`.
- Accepted SWU-CDSC2-005A context, result, schema, validator, materializer, and
  negative-vector test.
- Immutable parent F3 receipt and review.
- Frozen M1 and M2 observation receipts.
- Parent calibration specification's finite reviewed-predicate method.

## Rubric Application

The target for each cell is the full parent substitution description and
prediction. A cell is `explained` only when one unchanged explanation accounts
for that complete target. Nearby or partial coverage is `indeterminate`, not a
convenient pass.

| Explanation | Permitted | Breaking | Reason |
| --- | --- | --- | --- |
| A-01 contextual role | partial / indeterminate | none / not-explained | Locates coordination but does not account for the full mutation consequence. |
| A-02 guard Rule | partial / indeterminate | full / explained | Covers guard stability only for M1; directly accounts for M2 redirect sensitivity. |
| A-03 sequencing | partial / indeterminate | full / explained | Covers coordination stability only for M1; directly accounts for committing the wrong value in M2. |
| A-04 aggregation | partial / indeterminate | none / not-explained | Covers child replacement only, not guard/route stability or bypass. |
| A-05 pattern pressure | none / not-explained | none / not-explained | Motivates testing but predicts neither consequence. |
| A-06 named instance | partial / indeterminate | partial / indeterminate | Describes local outcomes but does not fully explain either substitution relation. |

## Usefulness And Uncertainty

- Retain parent `D` exactly: mutation evidence now exists, but incomplete direct
  route/content attestation still prevents a deterministic downstream change.
- Resolve F3-U-01 only with M1 and F3-U-02 only with M2.
- Carry F3-U-03 unchanged.
- Carry all four M1/M2 harness, visual, React, browser, and source-mutation
  limitations as `non-portable`; they bound inference rather than erase the
  completed mutation observations.

## Hard Gates

- Exactly twelve cells and the accepted 005A structural mappings.
- No parent explanation, prediction, receipt, or observation mutation.
- Q06/Q07 target text derives only from parent `S`.
- Compatibility bytes, record ID, and generation ID repeat exactly.
- Parent U1/U2 disappear only through matching approved resolution rows.
- No evaluator import or invocation in this SWU's builder/test.

## Decisions

Blocker decisions: none. The accepted protocol and conservative
partial-as-indeterminate rule determine the execution path. The eventual
fixture/suite outcome remains deliberately unknown and is owned by SWU006R.

## Validation

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/f3-three-layer-adjudication.test.mjs
```

No runtime handoff or subagent is used.
