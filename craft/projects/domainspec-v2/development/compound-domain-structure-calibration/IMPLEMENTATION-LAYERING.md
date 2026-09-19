---
artifact_id: CDSC-LAYERING-v0.1
status: approved-planning-baseline
active_layer: L1
---

# Implementation Layering

## Layer Decisions

| Layer | Question answered | SWUs | Promotion evidence |
| --- | --- | --- | --- |
| L0 Contract and evaluator | Can the frozen envelope and outcome procedure be represented and computed totally without semantic inference? | 001-002 | schema vectors, total matrix checks, closed outcome tests, semantic-digest tests |
| L1 Fixture evidence | Can each fixture produce a finite, cited, reviewed, immutable receipt under the same contract? | 003-005 | three valid receipts, closed negatives, explicit indeterminate states, read-only source proof |
| L2 Calibration generation | Can joined receipts produce deterministic fixture outcomes and one suite verdict? | 006 | generation result, control enforcement, semantic result digests, replay-ready index |
| L3 Independent audit | Does independent replay reproduce the result and preserve every authority boundary? | 007 | audit, replay equality, typed negatives, source/write-scope scan, close receipt |

## Layer Boundaries

- L0 defines representation and deterministic treatment only; it cannot author
  fixture predicate values.
- L1 reviews evidence but cannot run or change the evaluator contract.
- L2 consumes frozen receipts and cannot repair them in place.
- L3 verifies the package and cannot reinterpret a fixture result as identity,
  replication, pattern admission, or promotion.

## Smallest Coherent Unit

`SWU-CDSC-001` is the smallest independent start: freeze schemas, fixture IDs,
source selectors, semantic-field policy, and golden vectors. It writes only
inside this package and creates no evaluation claim.

## Recomposition Proof

```text
001 contract registry and manifest
  -> 002 deterministic evaluator
  -> 003 + 004 + 005 frozen fixture receipts
  -> 006 fixture outcomes and suite verdict
  -> 007 independent replay and bounded next route
```

Removing 001 or 002 makes every result uninterpretable. Removing any L1 receipt
makes the suite `CALIBRATION-DEFER`. Removing 006 leaves no experiment result.
Removing 007 leaves the result unaudited and ineligible for a next research
route.

## Deferred Layers

No layer in this package performs cross-fixture portability research, admits an
architecture pattern, defines a DS-D1 type, changes DS-D8, or publishes a
canonical artifact. Those are separate owner routes after, and only if, this
calibration yields appropriate evidence.
