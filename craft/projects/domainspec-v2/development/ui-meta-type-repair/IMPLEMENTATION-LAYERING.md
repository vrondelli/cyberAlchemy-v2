---
artifact_id: UIR-IMPLEMENTATION-LAYERING-v0.2
status: approved-successor-plan
authority: development only
approved_source: refresh/2026-07-12-decision-closure/REFRESH-REPORT.md
---

# Implementation Layering

## Historical Baseline

SWU-UIR-001 through 009 completed the original L0-L2 evidence machinery.
Their receipts and generation-001 outputs are immutable prerequisites. The
successor plan extends that machinery without reopening completed SWUs.

## Active Layer Decision

| Layer | Question | SWUs | Promotion evidence |
| --- | --- | --- | --- |
| L0S Contract extension | Can finite absence be represented without converting incomplete search into absence? | 011 | bounded-search and corpus-v2 schemas, total evaluator, negative fixtures |
| L1S Successor evidence | Can the selected decisions be emitted as independent immutable records? | 012-014 | corpus generation 002, dossier-policy evaluation, relationship owner-decision receipts |
| L2S Recomposition | Can successor records compose without changing v1 history or authority? | 015 | dossier v2, index v2, predecessor integrity, deterministic replay |
| L3 Integrated audit | Is the complete repair package internally auditable for later owner routes? | 010 | accepted receipts for 001-009 and 011-015 plus boundary audit |

## Layer Boundaries

- L0S defines construction rules and failure behavior only. It does not emit a
  real-corpus absence claim.
- L1S records current evidence honestly. Below-threshold and missing states are
  valid outputs; they are not implementation failures.
- L1S relationship decisions remain separate from the decision-free packet and
  have no DS-D8 mutation effect.
- L2S may introduce v2 contract families but cannot rewrite v1 records or copy
  authority into the index.
- L3 audits evidence machinery only. It cannot promote a UI candidate or alter
  DS-D1/DS-D8.

## Promotion Path

```text
001-009 accepted history
        |
        +-> 011 -> 012 --+
        +-> 013 ---------+-> 015 -> 010
        +-> 014 ---------+
```

SWU-013 and 014 may run after their historical dependencies and this plan pass.
SWU-012 additionally requires SWU-011. SWU-015 requires all three successor
producer receipts. SWU-010 remains blocked until SWU-015 passes.

## Deferrals

- Collecting enough real corpora/reviewers to pass DEC-UIR-008 is outside this
  plan; SWU-013 records the current below-threshold result.
- Obtaining Form/Action independent positives is outside this plan; SWU-013
  records `missing`.
- Proposing or admitting an Action-source signature is outside this plan;
  SWU-014 records a route-open decision only.
- Upstream design prose changes are requested in
  `PLAN-UPSTREAM-PATCH-REQUEST.md` and are not silently applied by plan mode.

## Smallest Coherent Start

SWU-UIR-011 is the smallest executable unit. Splitting its schema, evaluator,
and failure fixtures would permit `observed-absent` to exist without a complete
construction proof. Combining corpus generation would mix contract proof with
source-dependent evidence production and replay.
