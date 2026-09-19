---
artifact_id: CDSC2-LAYERS-v0.1
status: approved-planning-baseline
---

# Implementation Layering

## Layer Decisions

| Layer | Question | Included work | Promotion evidence | Deferred |
| --- | --- | --- | --- | --- |
| L0 | Can generation-2 inputs be validated and modeled faithfully without changing generation 1 or Savvy? | parity preflight, successor wrapper, source pins, harness manifest, baseline equivalence | enum rejection vectors, predecessor tests, source digests, baseline witness | mutation conclusions |
| L1 | Do the two preregistered mutations produce total bounded observations? | M1 and M2 isolated runs and immutable receipts | complete vector results, disjoint edit-surface proof, consequence states | F3 adjudication |
| L2 | Can observation evidence repair F3 and append one deterministic successor? | F3 receipt v2, fixture evaluation, successor suite, index append | reviewed receipt, total outcomes, predecessor-safe append, same-process replay | independent audit |
| L3 | Can a fresh process reproduce generation 2 and verify claim/source boundaries? | replay, byte audit, authority scan, final routing | exact semantic/handle equality, clean sources, complete receipts | portability and pattern research |

## Minimum Working Proof

L0 is the minimum coherent proof. A mutation run is meaningless unless the
validator rejects schema drift, generation 1 is byte-stable, source digests
match, and the unmutated harness reproduces all frozen baseline vectors.

## Promotion Rules

- L0 -> L1 only after parity, predecessor, source-pin, and baseline gates pass.
- L1 -> L2 only after both mutation receipts exist, even if one is refuted or
  indeterminate.
- L2 -> L3 only after exactly one successor index entry is appended and
  same-process replay agrees.
- L3 closes the work-pack but never promotes a type, pattern, or candidate.

## Value And Cost Boundary

The plan deliberately stops at the smallest evidence repair that can resolve
generation 1's defer. It excludes browser visuals, additional screens, new
fixtures, and cross-domain replication because they add cost without answering
the two missing F3 observations.

## Recomposition

```text
L0 trusted inputs and harness
  + L1 two mutation observations
  + L2 repaired receipt and successor generation
  + L3 independent replay and audit
  = one bounded answer to the generation-1 evidence-repair route
```
